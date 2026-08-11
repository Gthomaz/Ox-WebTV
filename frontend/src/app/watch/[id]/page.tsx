'use client';

import React, { useEffect, useState, Component, ErrorInfo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#051622] flex flex-col items-center justify-center p-8 text-white">
          <AlertCircle size={64} className="text-red-500 mb-6" />
          <h1 className="text-3xl font-bold mb-4">CRASH DETECTADO!</h1>
          <p className="text-lg text-white/80 mb-6">Por favor, tire um print desta tela e mande pro Antigravity:</p>
          <div className="bg-red-500/20 border border-red-500 p-6 rounded-xl w-full max-w-3xl overflow-auto text-left font-mono">
            <h2 className="text-red-400 font-bold text-xl mb-2">{this.state.error?.name}: {this.state.error?.message}</h2>
            <pre className="text-sm text-red-300/80 mt-4 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
          <Link href="/grade" className="mt-8 bg-[#00f0ff] text-[#051622] px-8 py-3 rounded-xl font-bold">Voltar</Link>
        </div>
      );
    }
    return this.props.children;
  }
}

function WatchPageContent() {
  const params = useParams();
  const id = params?.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('site_carousel_items')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          setError('Filme não encontrado no catálogo.');
        } else if (data) {
          setMovie(data);
        }
      } catch (err) {
        setError('Ocorreu um erro ao carregar o filme.');
      }
      setLoading(false);
    };

    fetchMovie();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#051622]">
      <Header />
      
      <main className="flex-1 flex flex-col relative w-full items-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-40">
            <Loader2 size={64} className="text-[#00f0ff] animate-spin mb-6" />
            <p className="text-white/60 text-xl font-light">Preparando a sessão pipoca...</p>
          </div>
        ) : error || !movie ? (
          <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-40 px-4 text-center">
            <AlertCircle size={64} className="text-red-500 mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
            <Link href="/grade" className="bg-[#00f0ff] hover:bg-white text-[#051622] px-6 py-3 rounded-xl font-bold transition-colors">
              Voltar ao Catálogo
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto flex flex-col animate-in fade-in duration-700">
            {/* The Cinematic Player */}
            <div className="w-full aspect-video bg-black rounded-b-2xl md:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:mt-6 border-b md:border border-white/10 relative group">
               {!movie.video_url ? (
                 <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center">
                   <AlertCircle size={48} className="text-red-500 mb-4" />
                   <p className="text-white font-bold text-xl mb-2">Vídeo indisponível</p>
                   <p className="text-white/60">A URL deste filme ainda não foi cadastrada no sistema.</p>
                 </div>
               ) : (
                 <ReactPlayer
                   url={movie.video_url}
                   width="100%"
                   height="100%"
                   controls={true}
                   playing={true}
                   config={{
                     file: {
                       forceHLS: typeof movie.video_url === 'string' && movie.video_url.includes('.m3u8')
                     }
                   }}
                 />
               )}
            </div>

            {/* Movie Info */}
            <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                    {movie.genre || 'VOD'}
                  </span>
                  <span className="text-white/50 text-sm font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                    {movie.duration_label || '00:00'}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-md">
                  {movie.title}
                </h1>
                <div className="h-[2px] w-24 bg-gradient-to-r from-[#00f0ff] to-transparent rounded-full mb-6"></div>
                <p className="text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-4xl">
                  {movie.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function WatchPage() {
  return (
    <ErrorBoundary>
      <WatchPageContent />
    </ErrorBoundary>
  );
}
