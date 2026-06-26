'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Radio, Save, CheckCircle2, Plus, Trash2, CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Program {
  id: number;
  title: string;
  url: string;
  start_time: string;
}

export default function AdminPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Supabase states - Broadcast Control
  const [isLive, setIsLive] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Supabase states - Programacao
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      setIsAuthenticated(true);
      fetchCurrentSettings();
      fetchPrograms();
    } else {
      alert('Credenciais incorretas');
    }
  };

  const fetchCurrentSettings = async () => {
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

  const fetchPrograms = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const { data, error } = await supabase
      .from('programacao')
      .select('*')
      .order('start_time', { ascending: true });

    if (data) {
      setPrograms(data);
    }
  };

  const handleSaveControl = async (e: React.FormEvent) => {
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

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setScheduleMsg('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      alert('Conecte o Supabase no .env primeiro.');
      setIsAdding(false);
      return;
    }

    if (!newTitle || !newUrl || !newStartTime) {
      alert('Preencha todos os campos da grade.');
      setIsAdding(false);
      return;
    }

    const { error } = await supabase
      .from('programacao')
      .insert([
        { title: newTitle, url: newUrl, start_time: newStartTime }
      ]);

    setIsAdding(false);

    if (!error) {
      setScheduleMsg('Programa adicionado com sucesso!');
      setNewTitle('');
      setNewUrl('');
      setNewStartTime('');
      fetchPrograms(); // refresh
      setTimeout(() => setScheduleMsg(''), 4000);
    } else {
      alert('Erro ao adicionar: ' + error.message);
    }
  };

  const handleRemoveProgram = async (id: number) => {
    if (!confirm('Deseja realmente remover este programa?')) return;

    const { error } = await supabase
      .from('programacao')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchPrograms();
    } else {
      alert('Erro ao remover: ' + error.message);
    }
  };

  // ----- TELA DE LOGIN -----
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center pt-20 px-4 pb-12">
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
    <div className="flex-1 flex flex-col items-center pt-16 px-4 pb-24 w-full">
      <div className="w-full max-w-2xl space-y-10">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Painel de Controle</h1>
          <p className="text-white/60">Gerencie a transmissão e a grade da WebTV em tempo real.</p>
        </div>

        {/* --- CONTROLE AO VIVO --- */}
        <section className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Radio className="text-[#00f0ff]" size={24} />
            Controle de Transmissão
          </h2>

          <form onSubmit={handleSaveControl} className="space-y-6">
            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={20} />
                <span className="text-sm font-medium">{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Radio className={isLive ? "text-red-500 animate-pulse" : "text-white/40"} size={24} />
                <div>
                  <p className="text-white font-medium">Sinal Ao Vivo</p>
                  <p className="text-xs text-white/50">Força a tela inicial a exibir esta URL</p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">URL do Sinal Ao Vivo (M3U8 / MP4)</label>
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
        </section>


        {/* --- GESTÃO DE GRADE --- */}
        <section className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <CalendarClock className="text-[#00f0ff]" size={24} />
            Gestão de Grade
          </h2>

          <form onSubmit={handleAddProgram} className="space-y-4">
            {scheduleMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} />
                <span className="text-sm font-medium">{scheduleMsg}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Título do Programa</label>
                <input 
                  type="text" 
                  placeholder="Ex: OX News da Manhã"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Horário de Início</label>
                <input 
                  type="datetime-local" 
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">URL do Vídeo</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] font-mono text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-2 bg-black/40 hover:bg-white border border-white/20 hover:text-black text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              <Plus size={20} />
              {isAdding ? 'Adicionando...' : 'Adicionar à Grade'}
            </button>
          </form>

          {/* Listagem da Grade */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-white/80 font-medium mb-4">Programação Atual</h3>
            
            {programs.length === 0 ? (
              <p className="text-white/40 text-center py-6 bg-black/20 rounded-xl border border-white/5">
                Nenhum programa cadastrado.
              </p>
            ) : (
              <div className="space-y-3">
                {programs.map(prog => {
                  const dateObj = new Date(prog.start_time);
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={prog.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-white/5 hover:border-white/20 rounded-xl transition-all gap-4">
                      <div>
                        <h4 className="text-white font-medium">{prog.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded font-mono">
                            {formattedDate} às {formattedTime}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveProgram(prog.id)}
                        className="flex items-center justify-center gap-2 sm:w-auto w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </div>
    </div>
  );
}
