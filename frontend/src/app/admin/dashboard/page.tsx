'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, LogOut, MonitorPlay, AlertTriangle, BarChart2, Tv, Palette } from 'lucide-react';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';

import TVDepartment from '@/components/admin/departments/TVDepartment';
import DenunciasDepartment from '@/components/admin/departments/DenunciasDepartment';
import PollsDepartment from '@/components/admin/departments/PollsDepartment';
import FrontendDepartment from '@/components/admin/departments/FrontendDepartment';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tv' | 'denuncias' | 'enquetes' | 'frontend'>('tv');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const cookies = document.cookie;
    if (!cookies.includes('ox_admin_auth=true')) {
      router.push('/admin/login');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "ox_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/');
  };

  if (loading) return <div className="flex-1 flex items-center justify-center bg-[#020b14] h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div></div>;

  return (
    <div className="w-full flex bg-[#020b14] h-screen overflow-hidden text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#051622] border-r border-white/10 flex flex-col shrink-0 z-50">
        <div className="p-6 h-28 flex items-center justify-center border-b border-white/5">
          <Image src={Logo} alt="OXTV" width={120} height={48} className="object-contain" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 px-2">Departamentos</div>
          
          <button 
            onClick={() => setActiveTab('tv')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
              activeTab === 'tv' ? 'bg-[#0e4b77] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00f0ff]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Tv size={20} className={activeTab === 'tv' ? 'text-[#00f0ff]' : ''} />
            Emissora / Ao Vivo
          </button>
          
          <button 
            onClick={() => setActiveTab('denuncias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
              activeTab === 'denuncias' ? 'bg-[#0e4b77] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00f0ff]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <AlertTriangle size={20} className={activeTab === 'denuncias' ? 'text-red-400' : ''} />
            QG Denúncias
          </button>

          <button 
            onClick={() => setActiveTab('enquetes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
              activeTab === 'enquetes' ? 'bg-[#0e4b77] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00f0ff]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart2 size={20} className={activeTab === 'enquetes' ? 'text-yellow-400' : ''} />
            Enquetes Programadas
          </button>

          <button 
            onClick={() => setActiveTab('frontend')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
              activeTab === 'frontend' ? 'bg-[#0e4b77] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-[#00f0ff]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Palette size={20} className={activeTab === 'frontend' ? 'text-pink-400' : ''} />
            Portal & CMS
          </button>
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-3 rounded-lg transition-colors text-sm font-semibold"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#020b14] relative">
        <header className="h-20 bg-[#051622]/80 backdrop-blur-md border-b border-white/5 flex items-center px-8 shrink-0">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white/90 tracking-wide">
            <LayoutDashboard className="text-[#00f0ff]" /> 
            Master Dashboard
          </h1>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'tv' && <TVDepartment />}
          {activeTab === 'denuncias' && <div className="h-full overflow-y-auto custom-scrollbar"><DenunciasDepartment /></div>}
          {activeTab === 'enquetes' && <PollsDepartment />}
          {activeTab === 'frontend' && <div className="h-full overflow-y-auto custom-scrollbar"><FrontendDepartment /></div>}
        </div>
      </main>
    </div>
  );
}
