'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Radio, AlertCircle } from 'lucide-react';

export default function LiveController() {
  const [isLive, setIsLive] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCurrent();
    
    // Subscribe to changes so it stays in sync if another admin changes it
    const channel = supabase.channel('broadcast-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_control' }, payload => {
        setIsLive(payload.new.is_live);
        setLiveUrl(payload.new.live_url || '');
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCurrent = async () => {
    const { data } = await supabase.from('broadcast_control').select('is_live, live_url').single();
    if (data) {
      const settings = data as any;
      setIsLive(settings.is_live);
      setLiveUrl(settings.live_url || '');
    }
  };

  const handleToggle = async () => {
    const newStatus = !isLive;
    setIsSaving(true);
    await supabase.from('broadcast_control').update({ is_live: newStatus }).eq('id', 1);
    setIsLive(newStatus);
    setIsSaving(false);
  };

  const handleSaveUrl = async () => {
    setIsSaving(true);
    await supabase.from('broadcast_control').update({ live_url: liveUrl }).eq('id', 1);
    setIsSaving(false);
    alert('URL Ao Vivo Atualizada!');
  };

  return (
    <div className="bg-[#051622] rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden">
      {/* Glow Effect */}
      {isLive && (
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
      )}

      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <Radio className={isLive ? "text-red-500 animate-pulse" : "text-white/40"} />
        Controle de Transmissão Mestra
      </h2>

      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
        <div>
          <h3 className="text-white font-semibold mb-1">Interrupção de Emergência / Ao Vivo</h3>
          <p className="text-white/50 text-xs">Corta a grade gravada instantaneamente e transmite o link M3U8.</p>
        </div>
        
        <button 
          onClick={handleToggle}
          disabled={isSaving}
          className={`relative px-4 py-2 rounded-lg font-bold text-xs tracking-widest transition-all duration-300 shadow-xl overflow-hidden group ${
            isLive 
              ? 'bg-transparent text-red-500 border border-red-500 hover:bg-red-500 hover:text-white' 
              : 'bg-red-600 text-white hover:bg-red-500'
          }`}
        >
          {isLive ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 group-hover:bg-white animate-pulse"></span>
              ENCERRAR AO VIVO
            </span>
          ) : (
            'ENTRAR AO VIVO'
          )}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/70 uppercase">URL do Sinal Ao Vivo (M3U8)</label>
        <div className="flex gap-3">
          <input 
            type="url" 
            value={liveUrl}
            onChange={e => setLiveUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-red-500 outline-none transition-colors"
          />
          <button 
            onClick={handleSaveUrl}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 text-xs text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>
          <strong>Sincronia Mágica:</strong> Ao clicar em "Encerrar Ao Vivo", o sistema não volta o vídeo gravado do começo, nem de onde parou. Ele <strong>avança no tempo</strong> a quantidade exata de minutos que se passaram, comportando-se exatamente como uma emissora de TV real.
        </p>
      </div>
    </div>
  );
}
