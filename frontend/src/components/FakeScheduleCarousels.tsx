'use client';

import React, { useState, useEffect } from 'react';
import { Clock, PlayCircle, X, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import Link from 'next/link';

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

        return (
          <div key={category.id} className="w-full">
            <div className="flex flex-col px-4 md:px-0 mb-3">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide mb-2">{category.name}</h2>
              <div className="h-[2px] w-full bg-gradient-to-r from-red-600 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            </div>
            
            <div className="relative w-full bg-black/20 border-y border-white/5 py-4 overflow-x-auto overflow-y-hidden group custom-scrollbar">
              <div className="flex gap-6 w-max px-4">
                {catItems.map((program, idx) => (
                  <Link 
                    href={`/watch/${program.id}`}
                    target="_blank"
                    key={`fake-${catIdx}-${program.id}-${idx}`}
                    className="w-[240px] flex-shrink-0 rounded-2xl overflow-hidden relative group/card bg-black border border-white/10 hover:border-[#00f0ff]/50 transition-colors cursor-pointer block"
                  >
                    <div className="absolute inset-0 z-0">
                      <img src={program.thumbnail_url} alt={program.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/card:opacity-60 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                    <div className="relative z-10 p-4 h-[135px] flex flex-col justify-end">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1 text-[#00f0ff] font-mono text-[10px] bg-[#00f0ff]/10 px-1.5 py-0.5 rounded">
                            <Clock size={12} />
                            {program.time_label}
                          </div>
                        </div>
                        <PlayCircle size={20} className="text-white/50 group-hover/card:text-[#00f0ff] transition-colors mt-1" />
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight mb-1 line-clamp-1">{program.title}</h3>
                      <p className="text-sm text-white/60 line-clamp-1">{program.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}



    </div>
  );
}
