'use client';

import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Movie {
  id: number;
  title: string;
  cover_url: string;
  description: string;
  video_url: string;
}

export default function FilmesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [activeMovieId, setActiveMovieId] = useState<number | null>(null);

  const activeMovie = movies.find(m => m.id === activeMovieId);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase.from('filmes').select('*').order('id', { ascending: false });
      if (data) setMovies(data);
    };
    fetchMovies();
  }, []);

  // Client-side Hydration handling for avoiding mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col relative w-full pt-8 pb-12">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00f0ff]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex flex-col max-w-7xl mx-auto space-y-10">

        {/* Title area */}
        <div className="text-center md:text-left space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            Catálogo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-white">Filmes</span>
          </h1>
          <p className="text-white/60 font-light">
            Escolha um título e assista sob demanda.
          </p>
        </div>

        {/* Main Player Component for VOD */}
        {activeMovie && (
          <div className="w-full bg-[#051622] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(14,75,119,0.5)] border border-[#00f0ff]/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-gradient-to-r from-[#0e4b77]/50 to-transparent border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{activeMovie.title}</h2>
            </div>
            <div className="aspect-video w-full relative bg-black">
              <ReactPlayer
                // @ts-ignore
                url={activeMovie.video_url}
                width="100%"
                height="100%"
                playing={true}
                controls={true}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                } as any}
              />
            </div>
          </div>
        )}

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 [perspective:1000px]">
          {movies.map(movie => (
            <div
              key={movie.id}
              className={`relative aspect-[2/3] rounded-xl cursor-pointer group transition-all duration-700 [transform-style:preserve-3d] hover:[transform:rotateY(180deg)] ${activeMovieId === movie.id ? 'shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-[1.02]' : 'hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'}`}
            >
              {/* Frente do Card */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden border border-white/10">
                <Image
                  src={movie.cover_url}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#051622] via-[#051622]/40 to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none">
                  <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight drop-shadow-md">{movie.title}</h3>
                </div>
              </div>

              {/* Verso do Card */}
              <div 
                onClick={() => {
                  setActiveMovieId(movie.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-br from-[#0e4b77] to-[#051622] border border-[#00f0ff]/30 p-4 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center text-center overflow-hidden"
              >
                <h3 className="text-white font-bold text-lg mb-2">{movie.title}</h3>
                <p className="text-white/70 text-sm line-clamp-5 mb-4">{movie.description}</p>
                <button className="flex items-center gap-2 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/40 border border-[#00f0ff] text-white px-4 py-2 rounded-full transition-colors">
                  <PlayCircle size={18} />
                  Assistir
                </button>
              </div>
            </div>
          ))}
          {movies.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/50">
              Nenhum filme adicionado ao catálogo ainda. Use o Backoffice para gerenciar.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
