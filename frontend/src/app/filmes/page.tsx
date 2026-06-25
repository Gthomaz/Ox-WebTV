'use client';

import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useAdmin } from '@/contexts/AdminContext';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';

export default function FilmesPage() {
  const { movies } = useAdmin();
  const [activeMovieId, setActiveMovieId] = useState<string | null>(null);

  const activeMovie = movies.find(m => m.id === activeMovieId);

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
                url={activeMovie.videoUrl}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map(movie => (
            <div 
              key={movie.id}
              onClick={() => {
                setActiveMovieId(movie.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 border ${activeMovieId === movie.id ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-[1.02]' : 'border-white/10 hover:border-[#00f0ff]/50 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'}`}
            >
              <Image 
                src={movie.coverUrl}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051622] via-[#051622]/40 to-transparent opacity-90"></div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                <PlayCircle size={48} className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] transition-transform duration-300 group-hover:scale-110" />
              </div>

              <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none">
                <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight drop-shadow-md">{movie.title}</h3>
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
