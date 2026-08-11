'use client';

import React, { useState, useEffect } from 'react';
import VideoPlayer from "@/components/VideoPlayer";
import { ProgramSchedule } from "@/components/ProgramSchedule";
import { ChatSection } from "@/components/ChatSection";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [settings, setSettings] = useState({
    title: 'OX WebTV',
    slogan: 'Acompanhe nossa programação ao vivo ou as melhores gravações.',
    image: '',
    height: '300px',
    width: '100%',
    active: true
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings({
          title: data.home_banner_title || 'OX WebTV',
          slogan: data.home_slogan || 'Acompanhe nossa programação ao vivo ou as melhores gravações.',
          image: data.home_banner_image || '',
          height: data.home_banner_height || '300px',
          width: data.home_banner_width || '100%',
          active: data.home_banner_active !== false
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="flex-1 flex flex-col relative w-full pt-8 pb-12">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00f0ff]/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      {/* Title area (Dynamic Banner) - MOVIDO PARA FORA DO CONTAINER max-w-7xl PARA PERMITIR LARGURA TOTAL */}
      {settings.active && (
        <div className="w-full flex justify-center mb-10 px-4 sm:px-6">
          <div 
            className={`rounded-2xl overflow-hidden relative ${settings.image ? '' : 'bg-gradient-to-br from-[#00f0ff]/20 to-[#0e4b77]/20 border border-white/10'}`}
            style={{ height: settings.height, minHeight: '150px', width: settings.width, maxWidth: '100%' }}
          >
            {settings.image && (
              <img src={settings.image} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020b14] via-[#020b14]/60 to-transparent"></div>
            
            <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center h-full w-full">
              <h1 className="text-3xl md:text-5xl font-bold text-white max-w-4xl leading-tight drop-shadow-lg">
                {settings.title}
              </h1>
              <p className="text-white/80 max-w-2xl mx-auto font-light text-lg mt-4">
                {settings.slogan}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center max-w-7xl mx-auto space-y-10">
        
        {/* Main Player Component */}
        <div className="w-full">
          <VideoPlayer />
        </div>

        {/* Schedule Component */}
        <div className="w-full">
          <ProgramSchedule />
        </div>

        {/* Live Chat Section */}
        <ChatSection />

      </div>

      {/* Invisible Admin Gateway */}
      <Link href="/admin" className="absolute bottom-2 right-2 w-[10px] h-[10px] bg-transparent opacity-0 z-50 cursor-default" title="Área Restrita" />
    </div>
  );
}
