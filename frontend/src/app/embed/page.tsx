import React from 'react';
import VideoPlayer from '@/components/VideoPlayer';

export default function EmbedPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        header, footer { display: none !important; }
        body { padding-top: 0 !important; margin: 0 !important; overflow: hidden !important; background: black !important; }
        main { padding: 0 !important; margin: 0 !important; height: 100vh !important; }
      `}} />
      <div className="w-full h-screen bg-black overflow-hidden flex items-center justify-center">
        <VideoPlayer />
      </div>
    </>
  );
}
