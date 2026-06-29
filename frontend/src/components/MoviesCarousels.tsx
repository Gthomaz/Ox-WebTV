'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayCircle, Film } from 'lucide-react';
import Link from 'next/link';

interface Movie {
  id: number;
  title: string;
  cover_url: string;
  description: string;
}

export function MoviesCarousels() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase.from('filmes').select('*').order('id', { ascending: false });
      if (data && data.length > 0) {
        // We need 25 movies for 5 carousels of 5 movies. Duplicate if not enough.
        let filledMovies = [...data];
        while (filledMovies.length < 25) {
          filledMovies = [...filledMovies, ...data];
        }
        setMovies(filledMovies.slice(0, 25));
      }
    };
    fetchMovies();
  }, []);

  if (movies.length === 0) return null;

  const categories = [
    "Especiais do Mês",
    "Ação e Adrenalina",
    "Comédias para Relaxar",
    "Documentários Exclusivos",
    "Favoritos da Audiência"
  ];

  return (
    <div className="w-full flex flex-col space-y-8 mt-4 mb-12">
      {categories.map((category, catIndex) => {
        // Get 5 movies for this category
        const rowMovies = movies.slice(catIndex * 5, (catIndex + 1) * 5);
        
        return (
          <div key={category} className="w-full flex flex-col">
            <div className="flex flex-col px-4 md:px-0 mb-3">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-2 flex items-center gap-2">
                <Film className="text-[#00f0ff]" size={24} />
                {category}
              </h2>
              <div className="h-[2px] w-1/3 bg-gradient-to-r from-[#00f0ff] to-transparent rounded-full opacity-50"></div>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-4 px-4 md:px-0 w-max">
                {rowMovies.map((movie, idx) => (
                  <Link 
                    href={`/filmes?id=${movie.id}`}
                    key={`${movie.id}-${idx}`}
                    className="w-[220px] md:w-[280px] h-[340px] flex-shrink-0 rounded-xl overflow-hidden relative group cursor-pointer border border-white/10 hover:border-[#00f0ff] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  >
                    <img 
                      src={movie.cover_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop"} 
                      alt={movie.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <PlayCircle size={40} className="text-white/80 group-hover:text-[#00f0ff] mb-3 transition-colors" />
                      <h3 className="text-lg font-bold text-white leading-tight mb-1 line-clamp-2">{movie.title}</h3>
                      {movie.description && (
                        <p className="text-xs text-white/60 line-clamp-2">{movie.description}</p>
                      )}
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
