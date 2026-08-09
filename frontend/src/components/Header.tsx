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
  const [socialLinks, setSocialLinks] = useState({ instagram: '', whatsapp: '', facebook: '' });



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

    // Fetch social settings
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) {
        setSocialLinks({
          instagram: data.instagram_url || '',
          whatsapp: data.whatsapp_url || '',
          facebook: data.facebook_url || ''
        });
      }
    };
    fetchSettings();

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
          
          <div className="flex gap-4 justify-center mt-2">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/30 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            )}
            {socialLinks.whatsapp && (
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-green-400 hover:bg-green-400/10 hover:border-green-400/30 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
            )}
          </div>
          
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
