import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase admin (para evitar bypass de RLS no backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Usando anon por enquanto, já que RLS permite leitura pública
);

export const revalidate = 0; // Impede cache do Next.js nesta rota

export async function GET() {
  try {
    // 1. Pega configurações globais de transmissão (broadcast_control)
    const { data: broadcast } = await supabase.from('broadcast_control').select('*').single();

    if (!broadcast) {
      return NextResponse.json({ error: 'Configurações de transmissão não encontradas.' }, { status: 404 });
    }

    // 2. Verifica se há uma Enquete Agendada ativa (scheduled_polls)
    let activePollQuestion = broadcast.active_poll_question;
    let activePollOptions = broadcast.active_poll_options;

    try {
      const nowIso = new Date().toISOString();
      const { data: scheduledPolls } = await supabase
        .from('scheduled_polls')
        .select('*')
        .lte('start_time', nowIso)
        .gte('end_time', nowIso)
        .limit(1);

      if (scheduledPolls && scheduledPolls.length > 0) {
        activePollQuestion = scheduledPolls[0].question;
        try {
          activePollOptions = typeof scheduledPolls[0].options === 'string' ? JSON.parse(scheduledPolls[0].options) : scheduledPolls[0].options;
        } catch(e) {
          activePollOptions = scheduledPolls[0].options;
        }
      }
    } catch(e) {
      // Ignora erro caso a tabela scheduled_polls ainda não tenha sido criada
      console.warn("Aviso: Tabela scheduled_polls não acessível.");
    }

    // 3. Se estiver em Modo de Emergência (Ao Vivo / Podcast / Repórter)
    if (broadcast.is_live) {
      return NextResponse.json({
        isLive: true,
        videoUrl: broadcast.live_url,
        title: 'Transmissão Ao Vivo',
        seekTo: 0,
        watermarkUrl: broadcast.watermark_url,
        watermarkOpacity: broadcast.watermark_opacity,
        watermarkPosition: broadcast.watermark_position,
        activeBanner: broadcast.active_banner,
        pollQuestion: activePollQuestion,
        pollOptions: activePollOptions,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }

    // 4. Lógica da Grade Normal
    const now = new Date();
    
    // Converte a data e hora para o fuso horário de Brasília (América/Sao_Paulo)
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    
    // formatter.format(now) retorna algo como "04/07/2026, 00:28:56"
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const todayDateStr = `${year}-${month}-${day}`;

    const hour = parseInt(getPart('hour') || '0', 10);
    const minute = parseInt(getPart('minute') || '0', 10);
    const second = parseInt(getPart('second') || '0', 10);

    // Segundos decorridos desde a meia-noite (Horário de Brasília)
    const secondsSinceMidnight = hour * 3600 + minute * 60 + second;

    // 5. Buscar a grade de hoje
    const { data: schedule } = await supabase
      .from('daily_schedule')
      .select('id')
      .eq('schedule_date', todayDateStr)
      .single();

    if (schedule) {
      // 6. Buscar os itens para calcular o Loop Contínuo
      const { data: items } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('daily_schedule_id', schedule.id)
        .order('start_time_seconds', { ascending: true }); // Mantém a ordem definida no painel

      if (items && items.length > 0) {
        const totalPlaylistDuration = items.reduce((acc, curr) => acc + curr.duration_seconds, 0);
        
        if (totalPlaylistDuration > 0) {
          let currentItem = null;
          let seekTo = 0;

          // Percorre a grade buscando o vídeo que deveria estar tocando no exato segundo atual
          for (const item of items) {
            const itemEnd = item.start_time_seconds + item.duration_seconds;
            if (secondsSinceMidnight >= item.start_time_seconds && secondsSinceMidnight < itemEnd) {
              currentItem = item;
              seekTo = secondsSinceMidnight - item.start_time_seconds;
              break;
            }
          }

          if (currentItem) {
            return NextResponse.json({
              isLive: false,
              videoUrl: currentItem.video_url,
              title: currentItem.title,
              seekTo: seekTo,
              watermarkUrl: broadcast?.watermark_url,
              watermarkOpacity: broadcast?.watermark_opacity,
              watermarkPosition: broadcast?.watermark_position,
              activeBanner: broadcast?.active_banner,
              pollQuestion: activePollQuestion,
              pollOptions: activePollOptions,
            });
          }
        }
      }
    }

    // 7. Fallback (Se não tiver grade pra hoje ou se não encontrou vídeo no horário - BURACO NA GRADE)
    // Toca um vídeo padrão de fallback
    const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    
    // O fallback dura várias horas, fazemos um modulo longo para não travar
    const fallbackSeek = secondsSinceMidnight % 43200; 

    return NextResponse.json({
      isLive: false,
      videoUrl: fallbackUrl,
      title: 'Programação Local (Fallback)',
      seekTo: fallbackSeek,
      watermarkUrl: broadcast?.watermark_url,
      watermarkOpacity: broadcast?.watermark_opacity,
      watermarkPosition: broadcast?.watermark_position,
      activeBanner: broadcast?.active_banner,
      pollQuestion: activePollQuestion,
      pollOptions: activePollOptions,
    });

  } catch (err) {
    console.error("API /grade/current ERROR:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
