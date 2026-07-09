'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';

import { supabase } from '@/lib/supabase';

export function Header() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);



  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    // Initial call
    updateClock();
    
    // Update every second (or minute, but second ensures it ticks exactly when minute changes)
    const interval = setInterval(updateClock, 1000);

    // Fetch initial live status
    const fetchLiveStatus = async () => {
      const { data } = await supabase.from('broadcast_control').select('is_live').single();
      if (data) setIsLive(data.is_live);
    };
    fetchLiveStatus();

    // Listen for changes
    let channel: any;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      channel = supabase
        .channel('header-live-status')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_control' }, (payload) => {
          const newData = payload.new as any;
          if (newData && typeof newData.is_live !== 'undefined') {
            setIsLive(newData.is_live);
          }
        })
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Ocultar este header principal se estivermos no painel da diretoria (que já tem o próprio header)
  // IMPORTANTE: Deve vir DEPOIS de todos os hooks para evitar erro de "Rendered fewer hooks than expected"
  if (pathname === '/admin/dashboard') {
    return null;
  }

  return (
    <>
    <header className="sticky top-0 left-0 w-full z-50 bg-[#0e4b77]/40 backdrop-blur-[10px] border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto px-4 h-24 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0 flex items-center h-full pl-2 pt-2 sm:pl-4 sm:pt-3">
          <Link href="/">
            <div 
              className="relative h-20 w-56 sm:w-64 transition-transform hover:scale-105 duration-300"
              style={{ background: 'transparent' }}
            >
              <Image 
                src={Logo} 
                alt="OX TV Quissamã Logo" 
                fill
                className="object-contain object-left"
                style={{ background: 'transparent' }}
                priority
              />
            </div>
          </Link>
        </div>

        {/* Center: Clock and Status */}
        <div className="hidden sm:flex flex-col items-center justify-center space-y-1">
          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-500 text-xs font-bold tracking-widest">AO VIVO</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white/50"></span>
              </span>
              <span className="text-white/60 text-xs font-bold tracking-widest">GRADE</span>
            </div>
          )}
          <div className="text-white/90 font-mono text-2xl font-light tracking-wide">
            {time || '--:--'}
          </div>
        </div>

        {/* Right: Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Hamburger Menu Button (Always visible) */}
          <button 
            className="p-2 text-white hover:text-[#00f0ff] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>

      </div>
    </header>

      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`absolute top-0 right-0 w-64 h-full bg-[#051622] border-l border-white/10 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-end">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2">
              <X size={28} />
            </button>
          </div>
          
          <nav className="flex flex-col gap-4 mt-4">
            <Link 
              href="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white hover:text-[#00f0ff] border-b border-white/10 pb-3 transition-colors"
            >
              Home (Player)
            </Link>
            <Link 
              href="/grade" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white hover:text-[#00f0ff] border-b border-white/10 pb-3 transition-colors"
            >
              Programação do Canal
            </Link>
            <Link 
              href="/filmes" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white hover:text-[#00f0ff] border-b border-white/10 pb-3 transition-colors"
            >
              Filmes Sugeridos
            </Link>
            <Link 
              href="/#chat" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white hover:text-[#00f0ff] border-b border-white/10 pb-3 transition-colors"
            >
              Chat ao Vivo
            </Link>
            <Link 
              href="/denuncias" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-red-500 hover:text-red-400 border-b border-white/10 pb-3 transition-colors flex items-center justify-between"
            >
              Portal de Denúncias <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">NOVO</span>
            </Link>
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white hover:text-[#00f0ff] border-b border-white/10 pb-3 transition-colors mt-2"
            >
              Entrar (Login)
            </Link>
            <Link 
              href="/register" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-[#051622] bg-[#00f0ff] hover:bg-white text-center py-2 rounded-lg transition-colors mt-2"
            >
              Criar Conta Grátis
            </Link>
          </nav>
          
          <div className="mt-auto pt-8 border-t border-white/10">
            <div className="flex flex-col items-center justify-center space-y-2">
               {isLive ? (
                 <div className="flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                   </span>
                   <span className="text-red-500 text-xs font-bold tracking-widest">AO VIVO</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-white/50"></span>
                   </span>
                   <span className="text-white/60 text-xs font-bold tracking-widest">GRADE</span>
                 </div>
               )}
               <div className="text-white font-mono text-xl tracking-wide">
                 {time || '--:--'}
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
