'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function VideoPlayer() {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const fetchStatus = async () => {
      // Fazendo a busca no banco apenas se as variáveis de ambiente existirem
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Fallback local se não houver Supabase configurado ainda
        setUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        return;
      }

      const { data, error } = await supabase
        .from('broadcast_control')
        .select('*')
        .single();
      
      if (data) {
        if (data.is_live) {
          setUrl(data.live_url);
        } else {
          setUrl(data.current_video_id || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        }
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
            const newData = payload.new;
            if (newData.is_live) {
              setUrl(newData.live_url);
            } else {
              setUrl(newData.current_video_id || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  if (!url) {
    return (
      <div className="video-container flex items-center justify-center bg-black/50 aspect-video text-white/50">
        Aguardando conexão com o servidor...
      </div>
    );
  }

  return (
    <div className="video-container">
      <video controls width="100%" src={url} autoPlay>
        Seu navegador não suporta a reprodução de vídeo.
      </video>
    </div>
  );
}
