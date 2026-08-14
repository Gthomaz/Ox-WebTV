import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, FileVideo, CheckCircle, AlertCircle, PlaySquare } from 'lucide-react';

interface ScheduleUploaderProps {
  onUploadComplete: (title: string, url: string, durationMinutes: number, startTime: string) => void;
}

export default function ScheduleUploader({ onUploadComplete }: ScheduleUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number>(0);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractVideoDuration = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const timeout = setTimeout(() => {
      setErrorMsg('Formato incompatível para cálculo automático (ex: .mkv). Por favor, digite a duração manualmente na caixinha.');
    }, 1500);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      window.URL.revokeObjectURL(video.src);
      const exactSeconds = Math.round(video.duration);
      setDurationSec(exactSeconds);
      setErrorMsg(''); // clear error if it worked
    };
    video.src = URL.createObjectURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorMsg('');
      setDurationSec(0); // reset
      extractVideoDuration(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.includes('video/')) {
        setFile(droppedFile);
        setErrorMsg('');
        extractVideoDuration(droppedFile);
      } else {
        setErrorMsg('Por favor, envie apenas arquivos de vídeo (ex: .mp4)');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setErrorMsg('Por favor, selecione um arquivo primeiro.');

    setUploading(true);
    setProgress(10);
    setErrorMsg('');

    try {
      // 1. Obter URL pre-assinada
      const presignRes = await fetch('/api/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4' })
      });
      if (!presignRes.ok) throw new Error('Erro ao obter autorização de upload (R2)');
      const { signedUrl, publicUrl } = await presignRes.json();

      // 2. Fazer upload direto para o Cloudflare R2 usando XMLHttpRequest para ter barra de progresso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 90);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Falha no upload direto para CDN. Status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de conexão ao enviar para a CDN da Cloudflare.'));
        });

        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });
      setProgress(80);

      const finalTitle = file.name.replace(/\.[^/.]+$/, ""); // Strip extension

      // 3. Save to database (filmes) to add to VOD
      const { error: dbError } = await supabase.from('filmes').insert([{
        title: finalTitle,
        video_url: publicUrl,
        duration_seconds: durationSec,
        cover_url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=1000',
        category: 'Outros',
      }]);

      if (dbError) throw dbError;
      setProgress(100);

      // Trigger callback to refresh VOD list instead of adding to schedule
      // We pass empty strings to tell the parent it's just a VOD refresh if we don't want to change the prop type yet
      onUploadComplete(finalTitle, publicUrl, durationSec, 'VOD_ONLY');

      // Reset form
      setFile(null);
      setDurationSec(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Ocorreu um erro durante o upload.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0e4b77]/20 to-black/40 border border-[#00f0ff]/20 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4 text-white">
        <UploadCloud className="text-[#00f0ff]" />
        <h3 className="font-bold text-lg">Upload Automático para VOD & Grade</h3>
      </div>
      
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">


        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#00f0ff]/30 rounded-xl p-6 text-center hover:bg-[#00f0ff]/5 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[120px]"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
          {file ? (
            <div className="flex items-center gap-3">
              <PlaySquare className="text-[#00f0ff]" size={32} />
              <div className="text-left">
                <p className="text-white font-bold text-sm">{file.name}</p>
                <p className="text-white/50 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <>
              <FileVideo className="text-white/40 mb-2 group-hover:scale-110 transition-transform" size={32} />
              <p className="text-white/80 text-sm font-semibold">Clique para procurar arquivo</p>
              <p className="text-white/40 text-xs mt-1">ou arraste o vídeo para esta área (MP4, WEBM, OGG)</p>
            </>
          )}
        </div>

        {uploading && (
          <div className="w-full bg-black rounded-full h-2 overflow-hidden border border-white/10">
            <div className="h-full bg-[#00f0ff] transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={uploading || !file}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all ${
            uploading || !file 
              ? 'bg-white/5 text-white/30 cursor-not-allowed' 
              : 'bg-[#10b981] text-white hover:bg-[#059669]'
          }`}
        >
          {uploading ? 'Processando Upload...' : 'Adicionar à Biblioteca VOD'}
        </button>
      </form>
    </div>
  );
}
