'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Final-Logo.png';
import { Lock, Radio, Save, CheckCircle2, Plus, Trash2, CalendarClock, GripVertical, Image as ImageIcon, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Program {
  id: number;
  title: string;
  url: string;
  start_time: string;
  sort_order: number;
}

function SortableItem({ id, program, onRemove }: { id: number, program: Program, onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const dateObj = new Date(program.start_time);
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-3 bg-[#0a1a2a] hover:bg-[#112a42] border ${isDragging ? 'border-[#00f0ff]' : 'border-white/5'} rounded-xl transition-colors gap-4 mb-2`}>
      <div className="flex items-center gap-3 w-full">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-[#00f0ff] text-white/40">
          <GripVertical size={20} />
        </div>
        <div>
          <h4 className="text-white font-medium text-sm">{program.title}</h4>
          <span className="text-xs text-[#00f0ff] font-mono">{formattedDate} às {formattedTime}</span>
        </div>
      </div>
      <button onClick={() => onRemove(program.id)} className="text-red-500 hover:text-white p-2 rounded-lg hover:bg-red-500/20 transition-all">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Broadcast Control States
  const [isLive, setIsLive] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  
  // Watermark States
  const [watermarkUrl, setWatermarkUrl] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(1);
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  
  // Interactivity States
  const [banner, setBanner] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsStr, setPollOptionsStr] = useState(''); // Comma separated

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Schedule States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    const { data } = await supabase.from('broadcast_control').select('*').eq('id', 1).single();
    if (data) {
      setIsLive(data.is_live);
      setLiveUrl(data.live_url || '');
      setWatermarkUrl(data.watermark_url || '');
      setWatermarkOpacity(data.watermark_opacity ?? 1);
      setWatermarkPosition(data.watermark_position || 'bottom-right');
      setBanner(data.active_banner || '');
      setPollQuestion(data.active_poll_question || '');
      if (data.active_poll_options) {
        setPollOptionsStr(data.active_poll_options.join(', '));
      }
    }
  };

  const fetchPrograms = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const { data } = await supabase.from('programacao').select('*').order('sort_order', { ascending: true });
    if (data) setPrograms(data);
  };

  const handleSaveControl = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      alert('Conecte o Supabase no .env para salvar as alterações.');
      setIsSaving(false); return;
    }

    const optionsArray = pollOptionsStr.split(',').map(s => s.trim()).filter(s => s !== '');

    const { error } = await supabase
      .from('broadcast_control')
      .update({ 
        is_live: isLive, 
        live_url: liveUrl,
        watermark_url: watermarkUrl,
        watermark_opacity: watermarkOpacity,
        watermark_position: watermarkPosition,
        active_banner: banner,
        active_poll_question: pollQuestion,
        active_poll_options: optionsArray.length > 0 ? optionsArray : null
      })
      .eq('id', 1);

    setIsSaving(false);

    if (!error) {
      setSuccessMsg('Configurações aplicadas no ar!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const maxSort = programs.length > 0 ? Math.max(...programs.map(p => p.sort_order)) : 0;

    const { error } = await supabase.from('programacao').insert([
      { title: newTitle, url: newUrl, start_time: newStartTime, sort_order: maxSort + 1 }
    ]);

    setIsAdding(false);
    if (!error) {
      setNewTitle(''); setNewUrl(''); setNewStartTime('');
      fetchPrograms();
    } else {
      alert('Erro ao adicionar: ' + error.message);
    }
  };

  const handleRemoveProgram = async (id: number) => {
    const { error } = await supabase.from('programacao').delete().eq('id', id);
    if (!error) fetchPrograms();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPrograms((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Update sort_order in backend
        const updatePromises = newArray.map((item, index) => 
          supabase.from('programacao').update({ sort_order: index }).eq('id', item.id)
        );
        Promise.all(updatePromises);
        
        // Also update local state sort_order just in case
        return newArray.map((item, index) => ({ ...item, sort_order: index }));
      });
    }
  };

  const handleClearChat = () => {
    // We haven't implemented a real chat backend table yet, but this is a placeholder 
    // for the moderator action as requested.
    alert("Comando de limpeza de chat enviado ao servidor (Placeholder).");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center pt-20 px-4 pb-12">
        <form onSubmit={handleLogin} className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative h-20 w-56 mb-4"
              style={{ background: 'transparent' }}
            >
              <Image 
                src={Logo} 
                alt="OX TV Quissamã Logo" 
                fill
                className="object-contain object-center"
                style={{ background: 'transparent' }}
                priority
              />
            </div>
            <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
          </div>
          <input type="text" placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white mb-4" />
          <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white mb-4" />
          <button type="submit" className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white font-bold py-3 rounded-lg transition-all">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#020b14] pt-24 pb-12 px-4 md:px-8">
      
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Master Control Room</h1>
          <p className="text-[#00f0ff]">Gerenciamento de Estação de TV em Tempo Real</p>
        </div>
        <button onClick={() => handleSaveControl()} disabled={isSaving} className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2">
          <Save size={20} />
          {isSaving ? 'Aplicando...' : 'Aplicar Interatividade (No Ar)'}
        </button>
      </div>

      {successMsg && (
        <div className="max-w-7xl mx-auto bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-4 rounded-xl flex items-center gap-3 mb-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <CheckCircle2 size={24} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LADO ESQUERDO: Grade Drag & Drop */}
        <div className="lg:col-span-5 bg-[#051622] rounded-2xl border border-white/10 p-6 flex flex-col h-[75vh]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <CalendarClock className="text-[#00f0ff]" size={20} />
            Grade (Drag & Drop)
          </h2>

          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={programs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {programs.map((prog) => (
                  <SortableItem key={prog.id} id={prog.id} program={prog} onRemove={handleRemoveProgram} />
                ))}
              </SortableContext>
            </DndContext>
            {programs.length === 0 && (
              <p className="text-white/40 text-center text-sm py-10">Grade vazia. Adicione abaixo.</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <form onSubmit={handleAddProgram} className="space-y-3">
              <input type="text" placeholder="Título (Ex: Noticiário)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm [color-scheme:dark]" />
                <input type="url" placeholder="URL do Vídeo" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <button type="submit" disabled={isAdding} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-sm transition-all">
                <Plus size={16} /> Adicionar à Fila
              </button>
            </form>
          </div>
        </div>

        {/* LADO DIREITO: Módulos de Controle */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-[75vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          
          {/* Módulo 1: Player Master */}
          <div className="bg-[#051622] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Radio className={isLive ? "text-red-500 animate-pulse" : "text-white/40"} size={20} />
              Sinal Mestre
            </h2>
            <div className="flex items-center gap-4 mb-4">
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isLive} onChange={() => setIsLive(!isLive)} />
                <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-3 text-sm font-medium text-white">{isLive ? 'Transmissão Ao Vivo Ativa' : 'Grade Agendada Ativa'}</span>
              </label>
            </div>
            <input type="url" placeholder="URL do Sinal Ao Vivo (M3U8 / MP4)" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 font-mono text-sm" />
          </div>

          {/* Módulo 2: Interatividade */}
          <div className="bg-[#051622] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <AlertCircle className="text-yellow-500" size={20} />
              Motor de Interatividade
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Aviso / Banner Superior</label>
                <input type="text" placeholder="Ex: Oferta Exclusiva 50% OFF (Deixe em branco para remover)" value={banner} onChange={e => setBanner(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Pergunta da Enquete</label>
                  <input type="text" placeholder="Qual seu time?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Opções (separadas por vírgula)</label>
                  <input type="text" placeholder="Flamengo, Vasco, Fluminense" value={pollOptionsStr} onChange={e => setPollOptionsStr(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 mt-2">
                <button onClick={handleClearChat} type="button" className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-4 py-2 rounded-lg mt-2">
                  <MessageSquare size={16} /> Limpar Bate-Papo do Espectador (Wipe Chat)
                </button>
              </div>
            </div>
          </div>

          {/* Módulo 3: Watermark */}
          <div className="bg-[#051622] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ImageIcon className="text-purple-400" size={20} />
              Watermark Dinâmico (Marca D'água)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">URL da Imagem da Logo (PNG transparente)</label>
                <input type="text" placeholder="/assets/Ox-Tv-Final-Logo.png" value={watermarkUrl} onChange={e => setWatermarkUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>Opacidade</span>
                    <span>{Math.round(watermarkOpacity * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Posição</label>
                  <select value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="top-left">Canto Superior Esquerdo</option>
                    <option value="top-right">Canto Superior Direito</option>
                    <option value="bottom-left">Canto Inferior Esquerdo</option>
                    <option value="bottom-right">Canto Inferior Direito</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
