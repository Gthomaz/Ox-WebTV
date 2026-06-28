'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';
import dynamic from 'next/dynamic';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertCircle, Cast } from 'lucide-react';
import { LiveChat } from './LiveChat';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

export default function VideoPlayer() {
  const [url, setUrl] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [currentProgramTitle, setCurrentProgramTitle] = useState<string>('');
  const [useNativeFallback, setUseNativeFallback] = useState(false);
  
  // Custom Controls State
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(true); // Force muted for mobile autoplay
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [playerErrorMsg, setPlayerErrorMsg] = useState<string>('');

  // Refs for Playlist state
  const currentIndexRef = useRef(0);
  const programsListRef = useRef<any[]>([]);

  // New States from DB
  const [watermarkUrl, setWatermarkUrl] = useState<string>('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(1);
  const [watermarkPosition, setWatermarkPosition] = useState<string>('bottom-right');
  const [activeBanner, setActiveBanner] = useState<string>('');
  
  // Interactive Polling and Chat
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const reactPlayerRef = useRef<any>(null);

  // Force Autoplay workaround for mobile
  useEffect(() => {
    if (url) {
      setTimeout(() => {
        if (useNativeFallback && nativeVideoRef.current) {
          nativeVideoRef.current.play().catch((e: any) => console.log("Native Autoplay blocked:", e));
        } else if (!useNativeFallback && reactPlayerRef.current) {
          try {
            const internal = reactPlayerRef.current.getInternalPlayer();
            if (internal && typeof internal.play === 'function') {
              internal.play().catch((e: any) => console.log("ReactPlayer Autoplay blocked:", e));
            }
          } catch (e) {
            console.log(e);
          }
        }
      }, 500); // Small delay to ensure DOM is ready
    }
  }, [url, useNativeFallback]);

  // Global body click to brute-force autoplay policy
  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (useNativeFallback && nativeVideoRef.current && playing) {
        nativeVideoRef.current.play().catch(e => console.log("Global Interaction Play Blocked:", e));
      } else if (!useNativeFallback && reactPlayerRef.current && playing) {
        try {
          const internal = reactPlayerRef.current.getInternalPlayer();
          if (internal && typeof internal.play === 'function') internal.play().catch(() => {});
        } catch(e) {}
      }
    };
    document.body.addEventListener('click', handleGlobalInteraction, { once: true });
    document.body.addEventListener('touchstart', handleGlobalInteraction, { once: true });
    return () => {
      document.body.removeEventListener('click', handleGlobalInteraction);
      document.body.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, [useNativeFallback, playing]);

  // Sync custom controls to native video
  useEffect(() => {
    if (useNativeFallback && nativeVideoRef.current) {
      if (playing) {
        nativeVideoRef.current.play().catch(e => console.log("Native Play failed:", e));
      } else {
        nativeVideoRef.current.pause();
      }
    }
  }, [playing, useNativeFallback]);

  useEffect(() => {
    if (useNativeFallback && nativeVideoRef.current) {
      nativeVideoRef.current.volume = volume;
      nativeVideoRef.current.muted = muted;
    }
  }, [volume, muted, useNativeFallback]);

  const playNextVideo = useCallback(() => {
    if (isLive || programsListRef.current.length === 0) return;
    
    // Avança para o próximo (Loop infinito)
    currentIndexRef.current = (currentIndexRef.current + 1) % programsListRef.current.length;
    const nextProgram = programsListRef.current[currentIndexRef.current];
    
    setUrl(nextProgram.url);
    setUseNativeFallback(!nextProgram.url.includes('.m3u8'));
    setCurrentProgramTitle(nextProgram.title);
    setPlayerErrorMsg('');
  }, [isLive]);

  // Native Error Listener directly on DOM element
  useEffect(() => {
    const videoObj = nativeVideoRef.current;
    if (!videoObj) return;

    const handleError = (e: Event) => {
      console.error("DOM Native Video Error", e);
      const mediaError = videoObj.error;
      let errorDetails = "Erro desconhecido (Evento)";
      if (mediaError) {
        switch (mediaError.code) {
          case mediaError.MEDIA_ERR_ABORTED: errorDetails = "1 (ABORTED): Usuário abortou."; break;
          case mediaError.MEDIA_ERR_NETWORK: errorDetails = "2 (NETWORK): Erro de rede/CORS bloqueado pelo Bucket Supabase."; break;
          case mediaError.MEDIA_ERR_DECODE: errorDetails = "3 (DECODE): Falha de decodificação."; break;
          case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetails = "4 (SRC_NOT_SUPPORTED): Formato/URL bloqueado."; break;
          default: errorDetails = `${mediaError.code}: Erro genérico.`; break;
        }
      } else {
        errorDetails = "Sem código de erro. Possível CORS rigoroso ou arquivo ausente.";
      }
      setPlayerErrorMsg(`ALERTA TÉCNICO: ${errorDetails} | Src: ${videoObj.src}`);
      setIsBuffering(false);
    };

    videoObj.addEventListener('error', handleError);
    videoObj.addEventListener('ended', playNextVideo);
    return () => {
      videoObj.removeEventListener('error', handleError);
      videoObj.removeEventListener('ended', playNextVideo);
    };
  }, [url, useNativeFallback, playNextVideo]);

  useEffect(() => {
    const fetchStatusAndPrograms = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
        return;
      }

      const { data: broadcastData } = await supabase.from('broadcast_control').select('*').single();
      const { data: programsData } = await supabase.from('programacao').select('url, title').order('sort_order', { ascending: true });

      if (broadcastData) {
        updateState(broadcastData, programsData || []);
      } else {
        console.error("Nenhum dado encontrado na tabela broadcast_control. Usando fallback da Grade.");
        updateState({ is_live: false, current_video_id: null }, programsData || []);
      }
    };

    fetchStatusAndPrograms();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'broadcast_control' },
          async (payload) => {
            const { data: programsData } = await supabase.from('programacao').select('url, title');
            updateState(payload.new || payload.old, programsData || []);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const updateState = (data: any, programs: any[]) => {
    programsListRef.current = programs;
    setIsLive(data.is_live);
    let currentUrl = '';
    
    if (data.is_live) {
      currentUrl = data.live_url;
      setUrl(currentUrl);
      setUseNativeFallback(currentUrl ? !currentUrl.includes('.m3u8') : false);
      setCurrentProgramTitle('');
      setPlayerErrorMsg('');
    } else {
      if (data.current_video_id) {
        currentUrl = data.current_video_id;
      } else if (programs && programs.length > 0) {
        if (currentIndexRef.current >= programs.length) {
          currentIndexRef.current = 0;
        }
        currentUrl = programs[currentIndexRef.current].url;
      } else {
        currentUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      }
      
      setUrl(currentUrl);
      setUseNativeFallback(currentUrl ? !currentUrl.includes('.m3u8') : false);
      setPlayerErrorMsg('');
      
      const matchedProgram = programs.find((p: any) => p.url === currentUrl);
      setCurrentProgramTitle(matchedProgram ? matchedProgram.title : 'Programação OXTV');
    }
    
    setWatermarkUrl(data.watermark_url || '');
    setWatermarkOpacity(data.watermark_opacity ?? 1);
    setWatermarkPosition(data.watermark_position || 'bottom-right');
    setActiveBanner(data.active_banner || '');
    
    setPollQuestion((prev) => {
      if (prev !== data.active_poll_question) setHasVoted(false);
      return data.active_poll_question || '';
    });
    setPollOptions(data.active_poll_options || []);
    setIsChatActive(data.chat_active || false);
  };

  const getWatermarkClasses = () => {
    switch (watermarkPosition) {
      case 'top-left': return 'top-20 left-4'; 
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-20 left-4'; 
      case 'bottom-right': return 'bottom-20 right-4';
      default: return 'bottom-20 right-4';
    }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = () => setPlaying(!playing);
  const toggleMute = () => setMuted(!muted);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => setVolume(parseFloat(e.target.value));
  
  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      await playerContainerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleCast = async () => {
    try {
      if (nativeVideoRef.current && (nativeVideoRef.current as any).remote) {
        await (nativeVideoRef.current as any).remote.prompt();
      } else {
        alert("O recurso de transmissão (Cast) não é suportado pelo seu navegador atual ou nenhuma tela foi detectada.");
      }
    } catch (err) {
      console.error('Erro de Cast:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!url) {
    return (
      <div className="video-container flex items-center justify-center bg-black/50 aspect-video text-white/50 rounded-2xl border border-white/10">
        <Loader2 className="animate-spin mr-2" /> Aguardando conexão com o servidor...
      </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      className="video-container relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(14,75,119,0.5)] border border-white/10 group bg-black"
    >
      {!useNativeFallback ? (
        <ReactPlayer
          ref={reactPlayerRef}
          url={url}
          playing={playing}
          volume={volume}
          muted={muted}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onBuffer={() => setIsBuffering(true)}
          onBufferEnd={() => setIsBuffering(false)}
          onReady={() => setIsBuffering(false)}
          onStart={() => setIsBuffering(false)}
          onPlay={() => setIsBuffering(false)}
          onEnded={playNextVideo}
          onError={(e: any) => {
            console.error("VideoPlayer Error - URL:", url, e);
            setPlayerErrorMsg(`ReactPlayer Error: Falha ao carregar HLS. Motivo: ${e?.type || e?.message || 'Media não suportada ou CORS.'} | URL: ${url}`);
            setIsBuffering(false);
          }}
          config={({
            file: {
              hlsOptions: {
                maxBufferLength: 30,
                maxBufferSize: 60 * 1000 * 1000,
                lowLatencyMode: true,
              }
            }
          } as any)}
        />
      ) : (
        <video 
          ref={nativeVideoRef}
          src={url}
          autoPlay={playing}
          controls={true}
          muted={muted}
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain"
          onPlaying={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onError={(e) => {
            console.error("Native Video Error", e);
            const mediaError = (e.target as HTMLVideoElement).error;
            let errorDetails = "Erro desconhecido";
            if (mediaError) {
              switch (mediaError.code) {
                case mediaError.MEDIA_ERR_ABORTED: errorDetails = "1 (MEDIA_ERR_ABORTED): Download abortado pelo usuário."; break;
                case mediaError.MEDIA_ERR_NETWORK: errorDetails = "2 (MEDIA_ERR_NETWORK): Erro de rede ou CORS. Verifique permissões do Supabase."; break;
                case mediaError.MEDIA_ERR_DECODE: errorDetails = "3 (MEDIA_ERR_DECODE): Erro de decodificação. Arquivo corrompido."; break;
                case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetails = "4 (MEDIA_ERR_SRC_NOT_SUPPORTED): Formato/Codec não suportado ou erro 403/404."; break;
                default: errorDetails = `${mediaError.code}: Erro genérico na mídia.`; break;
              }
            }
            setPlayerErrorMsg(`Native Video Error: ${errorDetails} | Src: ${url}`);
            setIsBuffering(false);
          }}
          playsInline
        />
      )}

      {/* ERROR OVERLAY */}
      {playerErrorMsg && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center border border-red-600/30 rounded-2xl">
          <AlertCircle className="text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" size={64} />
          <h3 className="text-2xl font-bold text-white mb-2">Falha Crítica de Reprodução</h3>
          <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/30 w-full max-w-3xl overflow-hidden mb-6">
            <p className="text-red-400 font-mono text-sm break-words select-all text-left">
              {playerErrorMsg}
            </p>
          </div>
          <button 
            onClick={() => { 
              setPlayerErrorMsg(''); 
              setIsBuffering(true); 
              if (useNativeFallback && nativeVideoRef.current) nativeVideoRef.current.load();
            }}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            Recarregar Vídeo
          </button>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/20">
          <Loader2 size={48} className="text-[#00f0ff] animate-spin drop-shadow-lg" />
        </div>
      )}

      {/* Status Overlay (AO VIVO / Título) */}
      <div className={`absolute top-4 left-4 z-20 pointer-events-none transition-opacity duration-500 ${showControls || !playing ? 'opacity-100' : 'opacity-0'}`}>
        {isLive ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/60 border border-red-500/30 text-white shadow-lg w-max">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-red-400">AO VIVO</span>
            </div>
            <span className="text-xs text-white/70 font-medium px-2 drop-shadow-md">Transmissão Direta</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border border-white/10 text-white shadow-lg w-max">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></div>
            <span className="text-sm font-semibold tracking-wide text-white drop-shadow-md">{currentProgramTitle}</span>
          </div>
        )}
      </div>

      {/* Watermark Dinâmico */}
      {(watermarkUrl || Logo) && (
        <div 
          className={`absolute z-10 pointer-events-none transition-opacity duration-300 ${getWatermarkClasses()}`}
          style={{ opacity: watermarkOpacity }}
        >
          {watermarkUrl ? (
            <img src={watermarkUrl} alt="Watermark" className="h-12 w-auto object-contain drop-shadow-md" />
          ) : (
            <Image src={Logo} alt="Watermark" className="h-12 w-auto object-contain drop-shadow-md" />
          )}
        </div>
      )}

      {/* Banner / Anúncio */}
      {activeBanner && (
        <div className="absolute top-4 right-1/2 translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-blue-600/90 to-[#0e4b77]/90 backdrop-blur-md text-white px-6 py-2 rounded-lg border border-white/20 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-3">
            <span className="text-[10px] uppercase bg-black/50 px-2 py-0.5 rounded text-white/80 font-bold tracking-wider animate-pulse">Aviso</span>
            <span className="text-sm font-medium">{activeBanner}</span>
          </div>
        </div>
      )}

      {/* Interactive Poll Overlay */}
      <div className={`absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 ${pollQuestion && !hasVoted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {pollQuestion && (
           <div className="bg-[#051622] border-2 border-[#00f0ff]/50 px-8 py-8 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.3)] text-center max-w-lg w-full transform transition-all duration-500 scale-100 pointer-events-auto">
             <h3 className="text-[#00f0ff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f0ff]"></span>
               </span>
               Enquete Interativa
             </h3>
             <p className="text-white text-2xl font-bold leading-snug mb-8">{pollQuestion}</p>
             <div className="space-y-3">
               {pollOptions?.map((option, idx) => (
                 <button key={idx} onClick={() => setHasVoted(true)} className="w-full bg-[#0e4b77]/40 hover:bg-[#00f0ff] hover:text-[#051622] border border-[#0e4b77] hover:border-[#00f0ff] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02]">
                   {option}
                 </button>
               ))}
             </div>
             <button onClick={() => setHasVoted(true)} className="mt-4 text-xs text-white/40 hover:text-white transition-colors">Fechar (Ignorar)</button>
           </div>
        )}
      </div>

      {/* Live Chat Overlay */}
      <LiveChat isActive={isChatActive} />

      {/* Custom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 px-4 py-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-[#00f0ff] transition-colors p-1" title={playing ? 'Pausar' : 'Reproduzir'}>
              {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <div className="flex items-center gap-2 group">
              <button onClick={toggleMute} className="text-white hover:text-[#00f0ff] transition-colors p-1">
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" 
                min={0} max={1} step="0.05" 
                value={muted ? 0 : volume} 
                onChange={handleVolumeChange} 
                className="w-0 group-hover:w-20 transition-all duration-300 opacity-0 group-hover:opacity-100 accent-[#00f0ff] h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleCast} className="text-white hover:text-[#00f0ff] transition-colors p-1" title="Transmitir para TV">
              <Cast size={20} />
            </button>
            <button onClick={toggleFullscreen} className="text-white hover:text-[#00f0ff] transition-colors p-1" title="Tela Cheia">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
