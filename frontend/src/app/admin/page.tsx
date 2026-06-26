'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Radio, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Supabase states
  const [isLive, setIsLive] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      setIsAuthenticated(true);
      fetchCurrentSettings();
    } else {
      alert('Credenciais incorretas');
    }
  };

  const fetchCurrentSettings = async () => {
    // Se não tiver variável de ambiente configurada, não quebra a tela
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const { data, error } = await supabase
      .from('broadcast_control')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setIsLive(data.is_live);
      setLiveUrl(data.live_url || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      alert('Conecte o Supabase no .env para salvar as alterações.');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('broadcast_control')
      .update({ is_live: isLive, live_url: liveUrl })
      .eq('id', 1);

    setIsSaving(false);

    if (!error) {
      setSuccessMsg('Configurações de transmissão atualizadas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
  };

  // ----- TELA DE LOGIN -----
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center pt-20 px-4">
        <form onSubmit={handleLogin} className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <Lock className="text-[#00f0ff] mb-2" size={32} />
            <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Usuário" 
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff]"
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff]"
            />
            <button type="submit" className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white font-bold py-3 rounded-lg transition-all">
              Entrar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----- TELA DO PAINEL -----
  return (
    <div className="flex-1 flex flex-col items-center pt-16 px-4 pb-12 w-full">
      <div className="w-full max-w-xl space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
          <p className="text-white/60">Gerencie o sinal da WebTV em tempo real.</p>
        </div>

        <form onSubmit={handleSave} className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full space-y-6">
          
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {/* Toggle "Ao Vivo" */}
          <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <Radio className={isLive ? "text-red-500" : "text-white/40"} size={24} />
              <div>
                <p className="text-white font-medium">Sinal Ao Vivo</p>
                <p className="text-xs text-white/50">Força o player a exibir a transmissão</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isLive}
                onChange={() => setIsLive(!isLive)}
              />
              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          {/* Input URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Link da Transmissão (M3U8, MP4)</label>
            <input 
              type="url" 
              placeholder="https://..."
              value={liveUrl}
              onChange={e => setLiveUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] font-mono text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] disabled:opacity-50 disabled:hover:bg-[#0e4b77] disabled:hover:text-white text-white font-bold py-4 rounded-lg transition-all"
          >
            <Save size={20} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
