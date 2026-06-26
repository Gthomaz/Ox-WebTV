import React from 'react';

export default function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="video-container">
      <video controls width="100%" src={url}>
        Seu navegador não suporta a reprodução de vídeo.
      </video>
    </div>
  );
}
