'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Edit2, Save, Tv, AlertTriangle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import ScheduleUploader from './ScheduleUploader';
import ScheduleUrlAdder from './ScheduleUrlAdder';

interface ScheduleItem {
  id: number;
  video_url: string;
  title: string;
  duration_seconds: number;
  start_time_seconds: number;
  sort_order: number;
}

export default function ScheduleManager() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  const selectedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDuration, setNewDuration] = useState(''); 
  const [durationType, setDurationType] = useState<'minutes' | 'seconds'>('minutes');
  const [newStartTime, setNewStartTime] = useState('');

  useEffect(() => {
    fetchScheduleForDate(selectedDate);
  }, [selectedDate]);

  const fetchScheduleForDate = async (dateStr: string) => {
    const { data: schedule } = await supabase
      .from('daily_schedule')
      .select('*')
      .eq('schedule_date', dateStr)
      .single();

    if (schedule) {
      setScheduleId(schedule.id);
      setTotalDuration(schedule.total_duration_seconds);
      
      const { data: scheduleItems } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('daily_schedule_id', schedule.id)
        .order('start_time_seconds', { ascending: true });
        
      setItems(scheduleItems || []);
    } else {
      setScheduleId(null);
      setTotalDuration(0);
      setItems([]);
    }
  };

  const parseTime = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) return null;
    const hours = parts[0];
    const minutes = parts[1];
    const seconds = parts.length > 2 ? parts[2] : 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const hasCollision = (newStart: number, newDuration: number, existingItems: ScheduleItem[], excludeId?: number) => {
    const newEnd = newStart + newDuration;
    return existingItems.some(item => {
      if (excludeId && item.id === excludeId) return false;
      const itemEnd = item.start_time_seconds + item.duration_seconds;
      return (newStart < itemEnd && newEnd > item.start_time_seconds);
    });
  };

  const processAddition = async (title: string, url: string, durationSec: number, startTimeStr: string) => {
    let currentScheduleId = scheduleId;
    let scheduleData = null;

    if (!currentScheduleId) {
      const { data: newSched, error } = await supabase
        .from('daily_schedule')
        .insert([{ schedule_date: selectedDate, total_duration_seconds: 0 }])
        .select()
        .single();
        
      if (error) throw new Error('Erro ao criar grade: ' + error.message);
      currentScheduleId = newSched.id;
      scheduleData = newSched;
    }

    const { data: existingItems } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('daily_schedule_id', currentScheduleId);
      
    const itemsList = existingItems || [];

    let startTime = 0;
    const requestedTime = parseTime(startTimeStr);
    
    if (requestedTime !== null) {
      startTime = requestedTime;
    } else {
      if (itemsList.length > 0) {
        startTime = Math.max(...itemsList.map(i => i.start_time_seconds + i.duration_seconds));
      }
    }

    if (startTime + durationSec > 86400) {
      throw new Error('O horário de término ultrapassa o limite diário de 24 horas (00:00).');
    }

    if (hasCollision(startTime, durationSec, itemsList)) {
      throw new Error('Conflito de Horário! Já existe um programa ocupando este espaço. Remova o existente ou mude o horário.');
    }

    const { error: itemError } = await supabase
      .from('schedule_items')
      .insert([{
        daily_schedule_id: currentScheduleId,
        title: title,
        video_url: url,
        duration_seconds: durationSec,
        start_time_seconds: startTime,
        sort_order: 0
      }]);

    if (itemError) throw new Error('Erro ao adicionar item: ' + itemError.message);

    const newTotal = itemsList.reduce((acc, curr) => acc + curr.duration_seconds, 0) + durationSec;
    await supabase.from('daily_schedule').update({ total_duration_seconds: newTotal }).eq('id', currentScheduleId);

    return true;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const durationValue = parseInt(newDuration);
    if (isNaN(durationValue) || durationValue <= 0) return alert('Duração inválida');
    
    const durationSec = durationType === 'minutes' ? durationValue * 60 : durationValue;

    try {
      await processAddition(newTitle, newUrl, durationSec, newStartTime);
      setNewTitle('');
      setNewUrl('');
      setNewDuration('');
      setNewStartTime('');
      fetchScheduleForDate(selectedDate);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddFromUpload = async (title: string, url: string, durationSec: number, startTimeStr: string) => {
    try {
      await processAddition(title, url, durationSec, startTimeStr);
      fetchScheduleForDate(selectedDate);
      alert('Upload concluído e adicionado à Grade com sucesso!');
    } catch (err: any) {
      alert(err.message + '\\n\\n(O vídeo foi salvo no Catálogo VOD, mas não pôde entrar na grade.)');
    }
  };

  const handleRemoveItem = async (itemId: number, itemDuration: number) => {
    await supabase.from('schedule_items').delete().eq('id', itemId);
    
    const newItems = items.filter(i => i.id !== itemId);
    const newTotal = newItems.reduce((acc, curr) => acc + curr.duration_seconds, 0);

    await supabase.from('daily_schedule')
      .update({ total_duration_seconds: newTotal })
      .eq('id', scheduleId);

    fetchScheduleForDate(selectedDate);
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    // Recalculate start times linearly for the whole list to maintain proper loop sequence
    let currentStartTime = 0;
    const updates = newItems.map((item, i) => {
      const updatedItem = {
        ...item,
        start_time_seconds: currentStartTime,
        sort_order: i
      };
      currentStartTime += item.duration_seconds;
      return updatedItem;
    });

    // Optimistic UI update
    setItems(updates);

    // Persist to DB (sequentially since bulk upsert requires all primary keys)
    try {
      for (const item of updates) {
        await supabase.from('schedule_items').update({ 
          start_time_seconds: item.start_time_seconds,
          sort_order: item.sort_order 
        }).eq('id', item.id);
      }
    } catch (e) {
      console.error('Failed to reorder', e);
      // Revert on fail
      fetchScheduleForDate(selectedDate);
    }
  };

  const handleEditTitle = async (itemId: number, currentTitle: string) => {
    const newTitle = window.prompt('Digite o novo título para este vídeo:', currentTitle);
    if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
      await supabase.from('schedule_items').update({ title: newTitle.trim() }).eq('id', itemId);
      fetchScheduleForDate(selectedDate);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const progressPercentage = Math.min((totalDuration / 86400) * 100, 100);

  // Geração de Meses e Dias
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Meses restantes do ano atual (do mês atual até Dezembro)
  const availableMonths = months.map((name, index) => ({ name, index })).filter(m => m.index >= today.getMonth());

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-[#051622] rounded-2xl border border-white/10 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="text-[#00f0ff]" />
          Planejador Mensal de Grade
        </h2>
        <div className="text-[#00f0ff] font-bold text-lg bg-[#0e4b77]/30 px-4 py-1 rounded-lg border border-[#00f0ff]/30">
          {selectedDate.split('-').reverse().join('/')}
        </div>
      </div>

      {/* Abas de Meses */}
      <div className="flex flex-wrap gap-2 pb-2 mb-4">
        {availableMonths.map(m => (
          <button
            key={m.index}
            onClick={() => {
              setSelectedMonth(m.index);
              setSelectedDay(1); // Reset day to 1 when month changes
            }}
            className={`whitespace-nowrap shrink-0 px-4 py-1.5 rounded-lg font-semibold transition-all ${
              selectedMonth === m.index 
                ? 'bg-[#00f0ff] text-[#051622] shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {m.name} {selectedYear}
          </button>
        ))}
      </div>

      {/* Trilha de Dias (Wrap) */}
      <div className="flex flex-wrap gap-2 pb-4 mb-6 relative">
        {daysArray.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`min-w-[48px] shrink-0 h-12 flex flex-col items-center justify-center rounded-xl font-bold transition-all ${
              selectedDay === day 
                ? 'bg-white text-black shadow-lg scale-110 z-10' 
                : 'bg-black/50 text-white/60 hover:bg-[#00f0ff]/20 hover:text-[#00f0ff] border border-white/5'
            }`}
          >
            <span className="text-xs font-normal opacity-70">Dia</span>
            <span className="text-base">{day}</span>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/70 mb-2">
          <span>Ocupação do Dia (24h)</span>
          <span>{formatTime(totalDuration)} / 24:00 ({progressPercentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-black rounded-full h-4 border border-white/10 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${progressPercentage > 95 ? 'bg-red-500' : 'bg-[#00f0ff]'}`} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-6 border border-white/10 rounded-lg flex-1 overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#051622] sticky top-0 z-20 shadow-md">
            <tr className="border-b border-white/20 text-white/50 uppercase tracking-wider">
              <th className="py-3 px-3 border-x border-white/10">Título do Vídeo</th>
              <th className="py-3 px-3 border-r border-white/10">Duração</th>
              <th className="py-3 px-3 border-r border-white/10">Horário (Play)</th>
              <th className="py-3 px-3 border-r border-white/10 w-16 text-center">Ordem</th>
              <th className="py-3 px-3 border-r border-white/10 text-center">Editar</th>
              <th className="py-3 px-3 text-center">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group text-white">
                <td className="py-3 px-3 border-x border-white/10 font-medium truncate max-w-[200px]" title={item.title}>{item.title}</td>
                <td className="py-3 px-3 border-r border-white/10 text-white/60">
                  {item.duration_seconds >= 60 
                    ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60 > 0 ? (item.duration_seconds % 60) + 's' : ''}`
                    : `${item.duration_seconds} seg`}
                </td>
                <td className="py-3 px-3 border-r border-white/10 font-mono text-[#00f0ff]">{formatTime(item.start_time_seconds)}</td>
                <td className="py-3 px-3 border-r border-white/10 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button 
                      onClick={() => handleReorder(items.indexOf(item), 'up')}
                      disabled={items.indexOf(item) === 0}
                      className="text-white/40 hover:text-[#00f0ff] disabled:opacity-20 disabled:hover:text-white/40 p-0.5 rounded transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button 
                      onClick={() => handleReorder(items.indexOf(item), 'down')}
                      disabled={items.indexOf(item) === items.length - 1}
                      className="text-white/40 hover:text-[#00f0ff] disabled:opacity-20 disabled:hover:text-white/40 p-0.5 rounded transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-3 border-r border-white/10 text-center">
                  <button 
                    onClick={() => handleEditTitle(item.id, item.title)}
                    className="text-[#00f0ff]/50 hover:text-[#00f0ff] p-1 rounded transition-colors"
                    title="Editar Título"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
                <td className="py-3 px-3 text-center">
                  <button 
                    onClick={() => handleRemoveItem(item.id, item.duration_seconds)}
                    className="text-red-500/50 hover:text-red-400 p-1 rounded transition-colors"
                    title="Excluir Vídeo"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/40 border-x border-white/10">
                  Nenhum programa agendado para esta data.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-[#051622]/95 backdrop-blur sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-white/20">
              <tr className="text-[#00f0ff] font-bold">
                <td className="py-3 px-3 border-x border-white/10 text-right uppercase text-xs">Total do Dia:</td>
                <td className="py-3 px-3 border-r border-white/10">{formatTime(totalDuration)}</td>
                <td className="py-3 px-3 border-r border-white/10"></td>
                <td className="py-3 px-3 border-r border-white/10"></td>
                <td className="py-3 px-3 border-r border-white/10"></td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <form onSubmit={handleAddItem} className="shrink-0 bg-black/30 p-4 rounded-xl border border-white/10 flex gap-3 flex-wrap md:flex-nowrap">
        <input 
          type="text" 
          placeholder="Nome do Programa" 
          required
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="flex-1 min-w-[150px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#00f0ff] outline-none text-sm"
        />
        <input 
          type="url" 
          placeholder="URL (m3u8, mp4)" 
          required
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          className="flex-1 min-w-[150px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#00f0ff] outline-none text-sm"
        />
        <div className="flex bg-black/50 border border-white/10 rounded-lg overflow-hidden shrink-0">
          <input 
            type="number" 
            placeholder="Duração" 
            required
            min="1"
            value={newDuration}
            onChange={e => setNewDuration(e.target.value)}
            className="w-[80px] bg-transparent px-3 py-2 text-white focus:border-[#00f0ff] outline-none text-sm"
          />
          <select 
            value={durationType}
            onChange={e => setDurationType(e.target.value as 'minutes'|'seconds')}
            className="bg-transparent text-white/70 text-xs px-2 border-l border-white/10 outline-none hover:text-white"
          >
            <option value="minutes" className="bg-[#051622]">Min</option>
            <option value="seconds" className="bg-[#051622]">Seg</option>
          </select>
        </div>
        <input 
          type="time"
          step="1" 
          value={newStartTime}
          onChange={e => setNewStartTime(e.target.value)}
          className="w-[120px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#00f0ff] outline-none text-sm"
          title="Deixe vazio para auto-encaixar"
        />
        <button 
          type="submit"
          className="bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Upload Component Integrado */}
      <ScheduleUploader onUploadComplete={handleAddFromUpload} />
      <ScheduleUrlAdder onUploadComplete={handleAddFromUpload} />
    </div>
  );
}
