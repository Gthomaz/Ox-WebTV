import { VideoPlayer } from "@/components/VideoPlayer";
import { ProgramSchedule } from "@/components/ProgramSchedule";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative w-full pt-8 pb-12">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00f0ff]/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center max-w-7xl mx-auto space-y-10">
        
        {/* Title area */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            OX Web<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-white">TV</span>
          </h1>
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

      </div>
    </div>
  );
}
