'use client';

import React, { useEffect } from 'react';
import VideoPlayer from "@/components/VideoPlayer";
import { ProgramSchedule } from "@/components/ProgramSchedule";
import { ChatSection } from "@/components/ChatSection";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex-1 flex flex-col relative w-full pt-8 pb-12">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00f0ff]/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center max-w-7xl mx-auto space-y-10">
        
        {/* Title area */}
        <div className="text-center space-y-4">
          <p className="text-white/60 max-w-2xl mx-auto font-light">
            Acompanhe nossa programação ao vivo ou as melhores gravações.
          </p>
        </div>

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
