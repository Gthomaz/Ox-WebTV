import chokidar from 'chokidar';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import WebSocket from 'ws';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERRO: Variáveis do Supabase não configuradas no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
  global: {
    headers: { 'x-my-custom-header': 'ox-tv-bot' },
  },
  realtime: {
    transport: WebSocket,
  }
});


// Configuração de Pastas (Caminhos Absolutos para não ter erro!)
const RAW_DIR = '/var/www/oxwebtv/raw_videos';
const OUT_DIR = '/var/www/oxwebtv/frontend/public/uploads';

fs.ensureDirSync(RAW_DIR);
fs.ensureDirSync(OUT_DIR);

console.log(`🤖 Robô Conversor de Vídeo Iniciado!`);
console.log(`📂 Vigiando pasta: ${RAW_DIR}`);
console.log(`💾 Salvando em: ${OUT_DIR}`);

// Fila simples para evitar rodar várias conversões ao mesmo tempo e travar a VPS
let isConverting = false;
const queue = [];

const watcher = chokidar.watch(RAW_DIR, {
  ignored: /(^|[\/\\])\../, // ignora arquivos ocultos
  persistent: true,
  usePolling: true,
  interval: 2000,
  awaitWriteFinish: {
    stabilityThreshold: 5000, // Aguarda 5 segundos sem mudanças no tamanho do arquivo para confirmar que o upload (FileZilla) terminou
    pollInterval: 1000
  }
});

watcher.on('add', (filePath) => {
  console.log(`[+] Novo arquivo detectado pelo watcher: ${path.basename(filePath)}`);
  if (!queue.includes(filePath)) {
    queue.push(filePath);
    processQueue();
  }
});

setTimeout(() => {
  try {
    console.log(`🔍 [DEBUG] Lendo a pasta manualmente: ${RAW_DIR}`);
    const files = fs.readdirSync(RAW_DIR);
    console.log(`🔍 [DEBUG] Arquivos encontrados na pasta: ${JSON.stringify(files)}`);
    for (const file of files) {
      if (!file.startsWith('.')) {
        const fullPath = path.join(RAW_DIR, file);
        if (!queue.includes(fullPath)) {
          console.log(`[+] Arquivo antigo encontrado na pasta. Colocando na fila: ${file}`);
          queue.push(fullPath);
        }
      }
    }
    processQueue();
  } catch(e) {
    console.error(`❌ [DEBUG] Erro ao ler a pasta:`, e);
  }
}, 2000);

async function processQueue() {
  if (isConverting || queue.length === 0) return;
  
  isConverting = true;
  const inputPath = queue.shift();
  const filename = path.basename(inputPath, path.extname(inputPath));
  const uniqueId = Date.now();
  
  const mp4Output = path.join(OUT_DIR, `${uniqueId}_${filename}.mp4`);
  const webmOutput = path.join(OUT_DIR, `${uniqueId}_${filename}.webm`);
  
  try {
    console.log(`\n⏳ Iniciando conversão dupla para: ${filename}`);
    
    // Pegar duração original
    const durationSec = await getVideoDuration(inputPath);
    
    console.log(`🎬 Duração detectada: ${durationSec} segundos.`);
    console.log(`🔨 Convertendo para MP4...`);
    
    await convertVideo(inputPath, mp4Output, 'mp4');
    
    console.log(`🔨 Convertendo para WEBM...`);
    await convertVideo(inputPath, webmOutput, 'webm');

    console.log(`✅ Conversão concluída com sucesso!`);
    
    // 4. Salvar no Banco de Dados (Supabase)
    const publicUrl = `https://cdn.oxtv.com.br/uploads/${path.basename(mp4Output)}`;
    
    console.log(`📡 Salvando no banco de dados OX TV...`);
    const { error } = await supabase.from('site_carousel_items').insert([{
      title: filename.replace(/_/g, ' '),
      video_url: publicUrl,
      thumbnail_url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=1000',
      genre: 'Filme',
      duration_label: `${Math.floor(durationSec / 60)} min`,
      description: 'Processado automaticamente pelo robô da OX TV.',
      is_active: true
    }]);

    if (error) {
      console.error(`❌ Erro ao salvar no banco de dados:`, error);
    } else {
      console.log(`🎉 Vídeo adicionado à OX TV com sucesso!`);
      // Deletar o arquivo original para não lotar a VPS
      fs.removeSync(inputPath);
      console.log(`🗑️ Arquivo bruto deletado: ${inputPath}`);
    }

  } catch (error) {
    console.error(`❌ Erro durante o processo do arquivo ${filename}:`, error);
  } finally {
    isConverting = false;
    processQueue(); // Puxa o próximo da fila
  }
}

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(Math.round(metadata.format.duration));
    });
  });
}

function convertVideo(input, output, format) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(input)
      .output(output);
      
    if (format === 'mp4') {
      command
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast', // 'fast' ajuda a não sobrecarregar tanto a CPU
          '-crf 23',      // Qualidade boa, tamanho aceitável
          '-movflags +faststart' // Otimizado para tocar na web antes de baixar tudo
        ]);
    } else if (format === 'webm') {
      command
        .videoCodec('libvpx-vp9')
        .audioCodec('libopus')
        .outputOptions([
          '-deadline realtime', // Acelera o VP9
          '-cpu-used 4',
          '-b:v 2M' // Bitrate alvo
        ]);
    }

    command
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r[${format.toUpperCase()}] Progresso: ${progress.percent.toFixed(2)}% convertido...`);
        }
      })
      .on('end', () => {
        process.stdout.write('\n');
        resolve();
      })
      .on('error', (err) => {
        process.stdout.write('\n');
        reject(err);
      })
      .run();
  });
}
