'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, PlayCircle } from 'lucide-react';
import Image from 'next/image';

interface Program {
  id: number;
  title: string;
  url: string;
  start_time: string;
  thumbnail_url?: string;
  description?: string;
}

export function ProgramSchedule() {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase.from('programacao').select('*').order('sort_order', { ascending: true });
      if (data) setPrograms(data);
    };

    fetchPrograms();

    // Subscribe to realtime updates
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const channel = supabase
        .channel('programacao-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'programacao' }, () => {
          fetchPrograms();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full mt-12 mb-8">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <h2 className="text-2xl font-bold text-white tracking-wide">Grade de <span className="text-[#00f0ff]">Programação</span></h2>
      </div>
      
      {/* Marquee Container */}
      <div className="relative overflow-hidden w-full bg-black/20 border-y border-white/5 py-6">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...programs, ...programs, ...programs].map((program, idx) => (
            <div 
              key={`${program.id}-${idx}`}
              className="w-[320px] mx-3 flex-shrink-0 rounded-2xl overflow-hidden relative group bg-black border border-white/10 hover:border-[#00f0ff]/50 transition-colors"
            >
              {/* Thumbnail Background */}
              <div className="absolute inset-0 z-0">
                {program.thumbnail_url ? (
                  <Image src={program.thumbnail_url} alt={program.title} fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0e4b77] to-[#051622] opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-5 h-[160px] flex flex-col justify-end">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-[#00f0ff] font-mono text-xs bg-[#00f0ff]/10 px-2 py-1 rounded">
                    <Clock size={14} />
                    {formatTime(program.start_time)}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-1">{program.title}</h3>
                {program.description && (
                  <p className="text-sm text-white/60 line-clamp-2">{program.description}</p>
                )}
              </div>
            </div>
          ))}
          {programs.length === 0 && (
             <div className="text-white/40 px-8 py-4">Nenhum programa na grade no momento.</div>
          )}
        </div>
      </div>
    </div>
  );
}
