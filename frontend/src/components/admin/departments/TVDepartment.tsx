'use client';

import React, { useState, useEffect } from 'react';
import ScheduleManager from '@/components/admin/ScheduleManager';
import LiveController from '@/components/admin/LiveController';
import VideoPlayer from '@/components/VideoPlayer';
import { MonitorPlay, Link as LinkIcon, Check, Copy } from 'lucide-react';

export default function TVDepartment() {
  const [embedCode, setEmbedCode] = useState(`<iframe src="https://seusite.com.br/embed" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmbedCode(`<iframe src="${window.location.origin}/embed" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`);
    }
  }, []);

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full overflow-hidden p-6">
      {/* Coluna Esquerda: Controle Ao Vivo e Ferramentas */}
      <div className="xl:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Monitoramento (Preview) */}
        <div className="bg-[#051622] rounded-2xl border border-white/10 p-4 shadow-xl shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <MonitorPlay className="text-[#00f0ff]" size={20} />
            Preview de Direção
          </h2>
          <div className="w-full rounded-xl overflow-hidden border border-white/5 shadow-2xl relative bg-black aspect-video">
            <VideoPlayer />
          </div>
        </div>

        {/* Live Controller / Identidade Visual */}
        <div className="shrink-0">
          <LiveController />
        </div>
        
        {/* Embed Code Widget */}
        <div className="bg-[#051622] rounded-2xl border border-white/10 p-5 shadow-xl shrink-0 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <LinkIcon className="text-[#00f0ff]" size={20} />
            Código de Incorporação (Embed)
          </h2>
          <p className="text-white/50 text-xs mb-3">Copie o código abaixo e cole no HTML de qualquer site para exibir a emissora ao vivo.</p>
          
          <div className="relative group">
            <div className="bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[10px] text-[#00f0ff] break-all overflow-hidden relative">
              {embedCode}
              <button 
                onClick={copyEmbed}
                className="absolute top-1 right-1 bg-[#0e4b77] hover:bg-[#00f0ff] text-white hover:text-black p-1.5 rounded-lg transition-all"
                title="Copiar código"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Gerenciador de Grade Diária */}
      <div className="xl:col-span-8 flex flex-col h-full min-h-0">
        <ScheduleManager />
      </div>
    </div>
  );
}
