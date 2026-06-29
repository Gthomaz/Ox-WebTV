'use client';

import React, { useState, useEffect, Suspense } from 'react';
import ReactPlayer from 'react-player';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { MoviesPoll } from '@/components/MoviesPoll';
import { CommunityFeed } from '@/components/CommunityFeed';

interface Movie {
  id: number;
  title: string;
  cover_url: string;
  description: string;
  video_url: string;
}

function FilmesContent() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [activeMovieId, setActiveMovieId] = useState<number | null>(null);
  const searchParams = useSearchParams();

  const activeMovie = movies.find(m => m.id === activeMovieId);

  const fallbackImage = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase.from('filmes').select('*').order('id', { ascending: false });
      if (data) {
        setMovies(data);
        const urlId = searchParams?.get('id');
        if (urlId) {
          const parsedId = parseInt(urlId, 10);
          if (!isNaN(parsedId) && data.some(m => m.id === parsedId)) {
            setActiveMovieId(parsedId);
          }
        }
      }
    };
    fetchMovies();
  }, [searchParams]);

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
            Filmes <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-white">Sugeridos</span>
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

        {/* Comunidade Cinéfila (Feed Estilo Facebook) */}
        <div className="w-full relative z-20">
          <CommunityFeed />
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {movies.map(movie => (
            <div
              key={movie.id}
              onClick={() => {
                setActiveMovieId(movie.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative aspect-[2/3] rounded-xl cursor-pointer group overflow-hidden border transition-all duration-300 ${activeMovieId === movie.id ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.5)] scale-[1.02]' : 'border-white/10 hover:border-[#00f0ff] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]'}`}
            >
              <Image
                src={movie.cover_url || fallbackImage}
                alt={movie.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 p-4 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <PlayCircle size={40} className={`mb-3 transition-colors ${activeMovieId === movie.id ? 'text-[#00f0ff]' : 'text-white/80 group-hover:text-[#00f0ff]'}`} />
                <h3 className="text-base md:text-lg font-bold text-white leading-tight mb-1 line-clamp-2">{movie.title}</h3>
                {movie.description && (
                  <p className="text-xs text-white/60 line-clamp-2">{movie.description}</p>
                )}
              </div>
            </div>
          ))}
          {movies.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/50">
              Nenhum filme adicionado ao catálogo ainda. Use o Backoffice para gerenciar.
            </div>
          )}
        </div>

        {/* Módulo de Votação (Enquetes Semanais) */}
        <div className="pt-8 mt-12 border-t border-white/10">
          <MoviesPoll />
        </div>

      </div>
    </div>
  );
}

export default function FilmesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-[#051622]"><div className="w-8 h-8 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div></div>}>
      <FilmesContent />
    </Suspense>
  );
}
