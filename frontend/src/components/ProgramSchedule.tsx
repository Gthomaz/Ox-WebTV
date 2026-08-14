'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, PlayCircle } from 'lucide-react';

interface ScheduleItem {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  start_time_seconds: number;
}

export function ProgramSchedule() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const getBrasiliaTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour') || '0', 10);
    const minute = parseInt(getPart('minute') || '0', 10);
    const second = parseInt(getPart('second') || '0', 10);

    return {
      dateStr: `${year}-${month}-${day}`,
      secondsSinceMidnight: hour * 3600 + minute * 60 + second
    };
  };

  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      const { dateStr, secondsSinceMidnight } = getBrasiliaTime();
      setCurrentSeconds(secondsSinceMidnight);

      const { data: schedule } = await supabase
        .from('daily_schedule')
        .select('id')
        .eq('schedule_date', dateStr)
        .single();

      if (schedule) {
        const { data: scheduleItems } = await supabase
          .from('schedule_items')
          .select('*')
          .eq('daily_schedule_id', schedule.id)
          .order('start_time_seconds', { ascending: true });
        
        if (scheduleItems) {
          setItems(scheduleItems);
        }
      } else {
        setItems([]);
      }
    };

    fetchTodaySchedule();

    const interval = setInterval(() => {
      const { secondsSinceMidnight } = getBrasiliaTime();
      setCurrentSeconds(secondsSinceMidnight);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // identify the active item
    const index = items.findIndex(p => currentSeconds >= p.start_time_seconds && currentSeconds < (p.start_time_seconds + p.duration_seconds));
    if (index !== -1 && index !== activeItemIndex) {
      setActiveItemIndex(index);
    }
  }, [currentSeconds, items, activeItemIndex]);

  useEffect(() => {
    if (activeItemIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetId = `program-card-${activeItemIndex}`;
      const activeElement = document.getElementById(targetId);
      
      if (activeElement) {
        const containerCenter = container.clientWidth / 2;
        const elementCenter = activeElement.offsetLeft + (activeElement.clientWidth / 2);
        container.scrollTo({
          left: elementCenter - containerCenter,
          behavior: 'smooth'
        });
      }
    }
  }, [activeItemIndex]);

  const formatTimeStr = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full mt-2">
      <div className="flex flex-col px-4 md:px-0 mb-3">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-2">Grade de <span className="text-[#00f0ff]">Programação</span></h2>
        <div className="h-[2px] w-full bg-gradient-to-r from-red-600 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
      </div>
      
      <div className="relative w-full bg-black/20 border-y border-white/5 py-4 md:py-6 overflow-x-auto custom-scrollbar" ref={scrollContainerRef}>
        <div className="flex gap-4 px-4 w-max items-center">
          {items.map((program, idx) => {
            const isPlaying = currentSeconds >= program.start_time_seconds && currentSeconds < (program.start_time_seconds + program.duration_seconds);
            const isPast = currentSeconds >= (program.start_time_seconds + program.duration_seconds);

            return (
              <div 
                id={`program-card-${idx}`}
                key={`schedule-${program.id}-${idx}`}
                className={`w-[240px] flex-shrink-0 rounded-2xl overflow-hidden relative group bg-black transition-all duration-300
                  ${isPlaying ? 'border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)] transform scale-[1.03] mx-2' : 'border border-white/10 hover:border-white/30'}
                  ${isPast ? 'opacity-50 grayscale' : 'opacity-100'}
                `}
              >
                <div className="absolute inset-0 z-0">
                  {program.thumbnail_url ? (
                    <img src={program.thumbnail_url} alt={program.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0e4b77] to-[#051622] opacity-80" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                </div>
                <div className="relative z-10 p-4 h-[135px] flex flex-col justify-end">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col items-start gap-1">
                      {isPlaying && (
                         <span className="text-[10px] font-bold text-[#051622] bg-[#00f0ff] px-2 py-0.5 rounded-full mb-1 animate-pulse tracking-widest">NO AR</span>
                      )}
                      <div className="flex items-center gap-1.5 text-white/90 font-mono text-xs bg-white/10 px-2 py-1 rounded">
                        <Clock size={12} />
                        {formatTimeStr(program.start_time_seconds)}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight line-clamp-2">{program.title}</h3>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
             <div className="text-white/40 py-4 text-sm w-full text-center">Nenhum programa na grade para hoje.</div>
          )}
        </div>
      </div>
    </div>
  );
}
