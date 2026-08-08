import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, AlertCircle } from 'lucide-react';

interface ScheduleUrlAdderProps {
  onUploadComplete: (title: string, url: string, durationSec: number, startTimeStr: string) => void;
}

export default function ScheduleUrlAdder({ onUploadComplete }: ScheduleUrlAdderProps) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationSec, setDurationSec] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [category, setCategory] = useState('Outros');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAutoDuration = (url: string) => {
    if (!url) return;
    const video = document.createElement('video');
    video.style.display = 'none';
    video.preload = 'metadata';
    video.src = url;
    
    video.onloadedmetadata = () => {
      setDurationSec(Math.round(video.duration));
      if (document.body.contains(video)) document.body.removeChild(video);
    };
    
    video.onerror = () => {
      console.error("Erro ao carregar video para calcular tempo");
      if (document.body.contains(video)) document.body.removeChild(video);
    };
    
    document.body.appendChild(video);
    video.load();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return setErrorMsg('Por favor, insira a URL do vídeo.');
    if (!title.trim()) return setErrorMsg('Por favor, insira um título.');
    if (durationSec <= 0) return setErrorMsg('A duração deve ser maior que zero.');

    setUploading(true);
    setErrorMsg('');

    try {
      const { error: dbError } = await supabase.from('filmes').insert([{
        title: title,
        video_url: videoUrl,
        duration_seconds: durationSec,
        cover_url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=1000',
        category: category,
      }]);

      if (dbError) throw dbError;

      onUploadComplete(title, videoUrl, durationSec, startTime);

      setVideoUrl('');
      setTitle('');
      setDurationSec(0);
      setStartTime('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao adicionar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-900/40 to-black/60 border border-green-500/30 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4 text-green-400">
        <Globe className="text-green-400" />
        <h3 className="font-bold text-lg">Upload Automático para VOD & Grade (URL)</h3>
      </div>
      
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-400 outline-none"
            >
              <option value="Podcast">Podcast</option>
              <option value="Filme">Filme</option>
              <option value="Série">Série</option>
              <option value="Documentário">Documentário</option>
              <option value="Esportes">Esportes</option>
              <option value="Jornalismo">Jornalismo</option>
              <option value="Musical">Musical</option>
              <option value="Infantil">Infantil</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do Vídeo"
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-400 outline-none"
            />
          </div>
          <div>
            <div className="relative">
              <input 
                type="number" 
                value={durationSec || ''}
                onChange={(e) => setDurationSec(parseInt(e.target.value) || 0)}
                placeholder="Duração"
                required min="1"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 pr-16 text-white text-sm focus:border-green-400 outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-white/40">segundos</span>
            </div>
          </div>
          <div>
            <input 
              type="time" 
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-400 outline-none"
              title="Deixe vazio para tocar logo após o último vídeo"
            />
          </div>
        </div>

        <div>
          <input 
            type="url" 
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={(e) => handleAutoDuration(e.target.value)}
            placeholder="Cole a URL do Vídeo ou Transmissão Ao Vivo (ex: .mp4, .webm, .m3u8)"
            required
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:border-green-400 outline-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all ${
            uploading 
              ? 'bg-white/5 text-white/30 cursor-not-allowed' 
              : 'bg-green-500 text-[#051622] hover:bg-green-400'
          }`}
        >
          {uploading ? 'Processando...' : 'Adicionar à Grade Diária via URL'}
        </button>
      </form>
    </div>
  );
}
