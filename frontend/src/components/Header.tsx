'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/assets/Ox-Tv-Final-Logo.png';
import { User, MessageSquare } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

export function Header() {
  const [time, setTime] = useState<string>('');
  const { setIsAdminOpen, isChatOpen, setIsChatOpen } = useAdmin();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    
    // Initial call
    updateClock();
    
    // Update every second (or minute, but second ensures it ticks exactly when minute changes)
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0e4b77]/40 backdrop-blur-[10px] border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0 flex items-center h-full py-2">
          <Link href="/">
            <div 
              className="relative h-16 w-44 sm:w-52 transition-transform hover:scale-105 duration-300"
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
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-red-500 text-xs font-bold tracking-widest">AO VIVO</span>
          </div>
          <div className="text-white/90 font-mono text-2xl font-light tracking-wide">
            {time || '--:--'}
          </div>
        </div>

        {/* Right: Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              href="/grade" 
              className="px-5 py-2 text-sm font-medium text-white/90 bg-transparent border border-white/20 rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all duration-300"
            >
              Grade
            </Link>
            <Link 
              href="/filmes" 
              className="px-5 py-2 text-sm font-medium text-white/90 bg-transparent border border-white/20 rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all duration-300"
            >
              Filmes
            </Link>
          </nav>
          
          <div className="h-6 w-[1px] bg-white/20 hidden md:block"></div>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center justify-center h-10 px-4 rounded-full border transition-all duration-300 gap-2 ${isChatOpen ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.4)]' : 'border-white/20 text-white/80 hover:text-white hover:border-[#00f0ff] bg-black/20 hover:bg-black/40'}`}
          >
            <MessageSquare size={16} />
            <span className="hidden md:inline text-sm font-medium">Chat</span>
          </button>

          <button 
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-[#00f0ff] hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all duration-300 bg-black/20 hover:bg-black/40 cursor-pointer"
            aria-label="Backoffice"
          >
            <User size={18} />
          </button>
        </div>

      </div>

      {/* Mobile Center elements (shown only on small screens below the header or integrated if space permits) */}
      {/* For this minimal setup, let's keep the clock and live status visible in the center but smaller on mobile if we remove 'hidden sm:flex' */}
    </header>
  );
}
