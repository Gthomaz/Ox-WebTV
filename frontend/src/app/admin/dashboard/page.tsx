'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScheduleManager from '@/components/admin/ScheduleManager';
import LiveController from '@/components/admin/LiveController';
import VideoPlayer from '@/components/VideoPlayer';
import { LayoutDashboard, LogOut, Link as LinkIcon, Copy, Check, MonitorPlay, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Verifica cookie de admin direto
    const cookies = document.cookie;
    if (!cookies.includes('ox_admin_auth=true')) {
      router.push('/admin/login');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const [embedCode, setEmbedCode] = useState(`<iframe src="https://seusite.com.br/embed" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`);

  useEffect(() => {
    checkAuth();
    if (typeof window !== 'undefined') {
      setEmbedCode(`<iframe src="${window.location.origin}/embed" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`);
    }
  }, []);

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-[#020b14] h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div></div>;

  return (
    <div className="w-full flex-1 bg-[#020b14] flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="bg-[#051622] border-b border-white/10 shrink-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-28 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <Image src={Logo} alt="OXTV" width={120} height={48} className="object-contain" />
          </div>
          
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-3xl tracking-tight flex items-center gap-3">
            <LayoutDashboard size={32} className="text-[#00f0ff]" />
            Master Dashboard
          </h1>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard/denuncias"
              className="flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg"
            >
              <AlertTriangle size={16} />
              Denúncias OX TV
            </Link>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 overflow-hidden">
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
          
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
          <div className="xl:col-span-8 flex flex-col h-full overflow-hidden">
            <ScheduleManager />
          </div>

        </div>

      </main>
    </div>
  );
}
