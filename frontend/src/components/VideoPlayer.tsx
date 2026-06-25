'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import Link from 'next/link';
import { ShoppingBag, Radio } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

export function VideoPlayer() {
  const { playerMode, liveStreamUrl, pollData, overlayAd } = useAdmin();
  const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  const [currentUrl, setCurrentUrl] = useState<string>(liveStreamUrl);
  const [streamStatus, setStreamStatus] = useState<'ao_vivo' | 'gravado'>(playerMode === 'live' ? 'ao_vivo' : 'gravado');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isError, setIsError] = useState(false);
  const [hasVotedPollId, setHasVotedPollId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reagir a mudanças do painel Admin
  useEffect(() => {
    if (playerMode === 'grade') {
      setStreamStatus('gravado');
      setCurrentUrl(fallbackUrl);
      setIsError(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      setStreamStatus('ao_vivo');
      setCurrentUrl(liveStreamUrl);
      setIsError(false);
      
      // Reinicia verificação de timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (streamStatus === 'ao_vivo') {
          handleStreamError();
        }
      }, 10000);
    }
  }, [playerMode, liveStreamUrl]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleStreamError = () => {
    if (streamStatus === 'ao_vivo' && playerMode === 'live') {
      console.log('Live stream offline ou com erro. Alternando para programação gravada...');
      setIsError(true);
      setStreamStatus('gravado');
      setCurrentUrl(fallbackUrl);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleReady = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsError(false);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(14,75,119,0.5)] border border-white/10 group bg-black/50">
      
      {/* Botão flutuante do Shopping */}
      <div className="absolute top-4 right-4 z-20">
        <Link 
          href="/shopping"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-pink-500/20 transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-md"
        >
          <ShoppingBag size={16} />
          <span>Ir ao Shopping</span>
        </Link>
      </div>

      {/* Indicador de Status do Stream */}
      <div className="absolute top-4 left-4 z-20">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${streamStatus === 'ao_vivo' ? 'bg-black/40 border-red-500/30 text-white' : 'bg-black/40 border-blue-500/30 text-white'}`}>
          {streamStatus === 'ao_vivo' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-red-400">AO VIVO</span>
            </>
          ) : (
            <>
              <Radio size={12} className="text-blue-400" />
              <span className="text-xs font-bold tracking-wider text-blue-400">GRAVADO</span>
            </>
          )}
        </div>
      </div>

      {/* Ad Overlay via Admin Panel */}
      {overlayAd !== 'none' && (
        <div className="absolute top-4 right-1/2 translate-x-1/2 md:translate-x-0 md:right-48 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-blue-600/90 to-[#0e4b77]/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/20 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-3">
            <span className="text-[10px] uppercase bg-black/50 px-2 py-0.5 rounded text-white/80 font-bold tracking-wider">Patrocínio</span>
            <span className="text-sm font-medium">
              {overlayAd === 'banner1' ? 'Apoio: Prefeitura Municipal' : 'Oferta OX Store: 50% OFF'}
            </span>
          </div>
        </div>
      )}

      {/* Player Wrapper */}
      <div className="w-full h-full relative z-10 pointer-events-auto">
        <ReactPlayer
          url={currentUrl}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls={true}
          onError={handleStreamError}
          onReady={handleReady}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          } as any}
        />
      </div>

      {/* Interactive Poll Overlay */}
      <div className={`absolute inset-0 z-40 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-500 ${pollData && hasVotedPollId !== pollData.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {pollData && (
          <div className="bg-[#051622] border-2 border-[#00f0ff]/50 px-8 py-8 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.3)] text-center max-w-lg w-full transform transition-all duration-500 scale-100">
            <h3 className="text-[#00f0ff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f0ff]"></span>
              </span>
              Enquete Interativa
            </h3>
            
            <p className="text-white text-2xl font-bold leading-snug mb-8">{pollData.question}</p>
            
            <div className="space-y-3">
              {pollData.options.map((option, idx) => (
                <button 
                  key={idx}
                  onClick={() => setHasVotedPollId(pollData.id)}
                  className="w-full bg-[#0e4b77]/40 hover:bg-[#00f0ff] hover:text-[#051622] border border-[#0e4b77] hover:border-[#00f0ff] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {currentUrl === liveStreamUrl && !isError && playerMode === 'live' && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-ox-navy border-t-[#00f0ff] rounded-full animate-spin"></div>
            <p className="text-white/70 font-mono text-sm tracking-widest animate-pulse">CONECTANDO...</p>
          </div>
        </div>
      )}
    </div>
  );
}
