'use client';

import React, { useState, useEffect } from 'react';
import { Clock, PlayCircle, X, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

interface CarouselItem {
  id: number;
  category_id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  time_label: string;
  duration_label: string;
  genre: string;
  video_url: string;
  sort_order: number;
}

export function FakeScheduleCarousels() {
  const [activeItem, setActiveItem] = useState<CarouselItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          supabase.from('site_categories').select('*').order('sort_order', { ascending: true }),
          supabase.from('site_carousel_items').select('*').order('sort_order', { ascending: true })
        ]);
        if (catsRes.data) setCategories(catsRes.data);
        if (itemsRes.data) setItems(itemsRes.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-white/50 text-center py-20 animate-pulse">Carregando prateleiras...</div>;
  if (categories.length === 0) return <div className="text-white/50 text-center py-20">Nenhuma prateleira disponível no momento.</div>;

  return (
    <div className="w-full flex flex-col space-y-10">
      
      {categories.map((category, catIdx) => {
        const catItems = items.filter(i => i.category_id === category.id);
        if (catItems.length === 0) return null;

        // Duplicating for the infinite marquee effect if we have items
        const displayPrograms = [...catItems, ...catItems];
        
        return (
          <div key={category.id} className="w-full">
            <div className="flex flex-col px-4 md:px-0 mb-3">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-2">{category.name}</h2>
              <div className="h-[2px] w-full bg-gradient-to-r from-red-600 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            </div>
            
            <div className="relative w-full bg-black/20 border-y border-white/5 py-4 overflow-hidden group">
              <div className={`flex gap-6 w-max px-4 ${catIdx % 2 === 0 ? 'animate-marquee' : 'animate-marquee-reverse'} hover:[animation-play-state:paused]`}>
                {displayPrograms.map((program, idx) => (
                  <div 
                    key={`fake-${catIdx}-${program.id}-${idx}`}
                    onClick={() => setActiveItem(program)}
                    className="w-[320px] flex-shrink-0 rounded-2xl overflow-hidden relative group/card bg-black border border-white/10 hover:border-[#00f0ff]/50 transition-colors cursor-pointer"
                  >
                    <div className="absolute inset-0 z-0">
                      <img src={program.thumbnail_url} alt={program.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/card:opacity-60 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                    <div className="relative z-10 p-5 h-[160px] flex flex-col justify-end">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5 text-[#00f0ff] font-mono text-xs bg-[#00f0ff]/10 px-2 py-1 rounded">
                            <Clock size={14} />
                            {program.time_label}
                          </div>
                        </div>
                        <PlayCircle size={24} className="text-white/50 group-hover/card:text-[#00f0ff] transition-colors mt-1" />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-1">{program.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-1">{program.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" 
            onClick={() => setActiveItem(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-3xl bg-[#051622] border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            {/* Red Close Button */}
            <button 
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 group"
            >
              <span className="text-sm font-bold tracking-widest hidden sm:block group-hover:block">FECHAR</span>
              <X size={24} />
            </button>

            {/* Banner Image */}
            <div className="w-full h-[250px] sm:h-[350px] relative">
              <img src={activeItem.thumbnail_url} alt={activeItem.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051622] via-[#051622]/60 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                    {activeItem.genre}
                  </span>
                  <span className="text-white/60 text-sm font-mono flex items-center gap-1.5">
                    <Clock size={14} /> {activeItem.duration_label}
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{activeItem.title}</h2>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-white/10 p-3 rounded-xl">
                  <Info className="text-[#00f0ff]" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Sinopse</h3>
                  <p className="text-white/80 text-lg leading-relaxed font-light">
                    {activeItem.description}
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                {activeItem.video_url && (
                  <button 
                    onClick={() => window.open(activeItem.video_url, '_blank')}
                    className="bg-[#00f0ff] hover:bg-white text-[#051622] font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2"
                  >
                    <PlayCircle size={20} /> Assistir Agora
                  </button>
                )}
                <button 
                  onClick={() => setActiveItem(null)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                >
                  Voltar para a Página
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
