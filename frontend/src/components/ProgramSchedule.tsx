'use client';

import React, { useEffect, useState, useRef } from 'react';
import { scheduleData, Program } from '@/data/scheduleData';
import { Clock, PlayCircle } from 'lucide-react';

export function ProgramSchedule() {
  const [currentPrograms, setCurrentPrograms] = useState<Program[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Definir horário atual para destacar cards
    const now = new Date();
    setCurrentTime(now);

    const currentDay = now.getDay();
    // Filtra programas pelo dia da semana (Se for FDS, traz o de Madrugada pelo menos, ou apenas ajusta a lógica)
    // Para efeito de demonstração, se for final de semana mostraremos a grade de sexta (5) ou domingo
    const dayToFilter = currentDay === 0 || currentDay === 6 ? 5 : currentDay;
    
    const todaySchedule = scheduleData.filter(p => p.days.includes(dayToFilter));
    // Ordenar por horário
    todaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    setCurrentPrograms(todaySchedule);

    // Atualiza a cada minuto para manter o card ativo em sincronia
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll para o item ativo após o componente montar
    if (currentTime && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentPrograms, currentTime]);

  const isProgramActive = (startTime: string, endTime: string, now: Date) => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    
    const [endH, endM] = endTime.split(':').map(Number);
    let endTotal = endH * 60 + endM;
    
    // Tratamento para meia-noite
    if (endTotal === 0) endTotal = 24 * 60;

    return currentMinutes >= startTotal && currentMinutes < endTotal;
  };

  return (
    <div className="w-full mt-12 mb-8">
      <div className="flex items-center justify-between mb-6 px-4 md:px-0">
        <h2 className="text-2xl font-bold text-white tracking-wide">Grade de <span className="text-[#00f0ff]">Programação</span></h2>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-6 pt-2 px-4 md:px-0 snap-x snap-mandatory hide-scrollbar relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {currentPrograms.map((program) => {
          const isActive = currentTime ? isProgramActive(program.startTime, program.endTime, currentTime) : false;
          
          return (
            <div 
              key={program.id}
              data-active={isActive}
              className={`
                min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-center rounded-2xl p-5 
                backdrop-blur-md transition-all duration-500 relative overflow-hidden group
                ${isActive 
                  ? 'bg-gradient-to-br from-[#0e4b77]/60 to-[#0a3656]/60 border border-[#00f0ff]/50 shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
                  : 'bg-black/40 border border-white/10 hover:border-white/20 hover:bg-black/50'
                }
              `}
            >
              {/* Efeito de brilho de fundo se estiver ativo */}
              {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              )}

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock size={16} className={isActive ? 'text-[#00f0ff]' : ''} />
                  <span className={`text-sm font-mono ${isActive ? 'text-[#00f0ff] font-semibold' : ''}`}>
                    {program.startTime} - {program.endTime}
                  </span>
                </div>
                
                {isActive && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    AGORA
                  </span>
                )}
              </div>
              
              <div className="relative z-10">
                <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {program.title}
                </h3>
                <p className="text-white/50 text-sm line-clamp-2 leading-relaxed">
                  {program.description}
                </p>
              </div>

              {/* Ícone de play escondido que aparece no hover para os cards futuros */}
              <div className={`absolute bottom-5 right-5 transition-all duration-300 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'}`}>
                <PlayCircle size={24} className={isActive ? 'text-[#00f0ff]' : 'text-white/40'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
