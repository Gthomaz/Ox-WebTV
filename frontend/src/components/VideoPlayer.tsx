'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Logo from '@/assets/Ox-Tv-Final-Logo.png';

export default function VideoPlayer() {
  const [url, setUrl] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  
  // New States
  const [watermarkUrl, setWatermarkUrl] = useState<string>('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(1);
  const [watermarkPosition, setWatermarkPosition] = useState<string>('bottom-right');
  const [activeBanner, setActiveBanner] = useState<string>('');
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        return;
      }

      const { data, error } = await supabase
        .from('broadcast_control')
        .select('*')
        .single();
      
      if (data) {
        updateState(data);
      }
    };

    fetchStatus();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'broadcast_control' },
          (payload) => {
            updateState(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const updateState = (data: any) => {
    setIsLive(data.is_live);
    if (data.is_live) {
      setUrl(data.live_url);
    } else {
      setUrl(data.current_video_id || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
    }
    
    setWatermarkUrl(data.watermark_url || '');
    setWatermarkOpacity(data.watermark_opacity ?? 1);
    setWatermarkPosition(data.watermark_position || 'bottom-right');
    setActiveBanner(data.active_banner || '');
    
    // Reset poll vote if question changes
    setPollQuestion((prev) => {
      if (prev !== data.active_poll_question) {
        setHasVoted(false);
      }
      return data.active_poll_question || '';
    });
    
    setPollOptions(data.active_poll_options || []);
  };

  const getWatermarkClasses = () => {
    switch (watermarkPosition) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-16 left-4'; 
      case 'bottom-right': return 'bottom-16 right-4';
      default: return 'bottom-16 right-4';
    }
  };

  if (!url) {
    return (
      <div className="video-container flex items-center justify-center bg-black/50 aspect-video text-white/50 rounded-2xl border border-white/10">
        Aguardando conexão com o servidor...
      </div>
    );
  }

  return (
    <div className="video-container relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(14,75,119,0.5)] border border-white/10 group bg-black">
      <video controls width="100%" src={url} autoPlay className="w-full h-full object-cover">
        Seu navegador não suporta a reprodução de vídeo.
      </video>

      {/* Watermark Dinâmico */}
      {(watermarkUrl || Logo) && (
        <div 
          className={`absolute z-10 pointer-events-none transition-opacity duration-300 ${getWatermarkClasses()}`}
          style={{ opacity: watermarkOpacity }}
        >
          {watermarkUrl ? (
            <img src={watermarkUrl} alt="Watermark" className="h-12 w-auto object-contain drop-shadow-md" />
          ) : (
            <Image src={Logo} alt="Watermark" className="h-12 w-auto object-contain drop-shadow-md" />
          )}
        </div>
      )}

      {/* Banner / Anúncio */}
      {activeBanner && (
        <div className="absolute top-4 right-1/2 translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-blue-600/90 to-[#0e4b77]/90 backdrop-blur-md text-white px-6 py-2 rounded-lg border border-white/20 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-3">
            <span className="text-[10px] uppercase bg-black/50 px-2 py-0.5 rounded text-white/80 font-bold tracking-wider animate-pulse">Aviso</span>
            <span className="text-sm font-medium">{activeBanner}</span>
          </div>
        </div>
      )}

      {/* Indicador de Status do Stream */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-red-500/30 text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wider text-red-400">AO VIVO</span>
          </div>
        </div>
      )}

      {/* Interactive Poll Overlay */}
      <div className={`absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 ${pollQuestion && !hasVoted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {pollQuestion && (
          <div className="bg-[#051622] border-2 border-[#00f0ff]/50 px-8 py-8 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.3)] text-center max-w-lg w-full transform transition-all duration-500 scale-100 pointer-events-auto">
            <h3 className="text-[#00f0ff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f0ff]"></span>
              </span>
              Enquete Interativa
            </h3>
            
            <p className="text-white text-2xl font-bold leading-snug mb-8">{pollQuestion}</p>
            
            <div className="space-y-3">
              {pollOptions?.map((option, idx) => (
                <button 
                  key={idx}
                  onClick={() => setHasVoted(true)}
                  className="w-full bg-[#0e4b77]/40 hover:bg-[#00f0ff] hover:text-[#051622] border border-[#0e4b77] hover:border-[#00f0ff] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02]"
                >
                  {option}
                </button>
              ))}
            </div>
            <button onClick={() => setHasVoted(true)} className="mt-4 text-xs text-white/40 hover:text-white transition-colors">Fechar (Ignorar)</button>
          </div>
        )}
      </div>
    </div>
  );
}
