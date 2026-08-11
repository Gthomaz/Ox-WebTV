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
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeSeconds(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isToday = () => {
    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    return selectedDate === todayStr;
  };
  
  // VOD Library State
  const [vodMovies, setVodMovies] = useState<any[]>([]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDuration, setNewDuration] = useState(''); 
  const [durationType, setDurationType] = useState<'minutes' | 'seconds'>('minutes');
  const [newStartTime, setNewStartTime] = useState('');

  useEffect(() => {
    fetchScheduleForDate(selectedDate);
    fetchVodMovies();
  }, [selectedDate]);

  const fetchVodMovies = async () => {
    const { data } = await supabase.from('filmes').select('*').order('id', { ascending: false });
    if (data) setVodMovies(data);
  };

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
      alert(err.message + '\n\n(O vídeo foi salvo no Catálogo VOD, mas não pôde entrar na grade.)');
    }
  };

  const handleRemoveVodMovie = async (movieId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este vídeo da biblioteca?')) {
      await supabase.from('filmes').delete().eq('id', movieId);
      fetchVodMovies();
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);

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
    handleDragEnd();

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

  const handleEditItem = async (itemId: number, currentTitle: string, currentStartTime: number) => {
    const newTitle = window.prompt('Digite o novo título para este vídeo:', currentTitle);
    if (newTitle === null) return; // Usuário cancelou

    const currentFormattedTime = formatTime(currentStartTime);
    const newTime = window.prompt('Digite o novo horário de início (Formato HH:MM:SS ou HH:MM):', currentFormattedTime);
    if (newTime === null) return; // Usuário cancelou

    const parsedTime = parseTime(newTime);
    let finalTime = currentStartTime;
    
    if (parsedTime !== null) {
      finalTime = parsedTime;
    } else if (newTime.trim() !== currentFormattedTime) {
      alert('Formato de hora inválido. O horário não foi alterado.');
    }

    const titleToSave = newTitle.trim() === '' ? currentTitle : newTitle.trim();

    await supabase.from('schedule_items').update({ 
      title: titleToSave,
      start_time_seconds: finalTime
    }).eq('id', itemId);
    
    fetchScheduleForDate(selectedDate);
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
    <div className="bg-[#051622] rounded-2xl border border-white/10 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
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

      <div className="mb-6 border border-white/10 rounded-lg flex-1 min-h-[300px] overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#051622] sticky top-0 z-20 shadow-md">
            <tr className="border-b border-white/20 text-white/50 uppercase tracking-wider text-xs">
              <th className="py-1 px-3 border-x border-white/10 w-10 text-center">ID</th>
              <th className="py-1 px-3 border-r border-white/10 w-full text-left">Título do Vídeo</th>
              <th className="py-1 px-3 border-r border-white/10 w-24 text-center">Duração</th>
              <th className="py-1 px-3 border-r border-white/10 w-24 text-center">Cronômetro</th>
              <th className="py-1 px-3 border-r border-white/10 w-24 text-center">Data</th>
              <th className="py-1 px-3 border-r border-white/10 w-24 text-center">Horário</th>
              <th className="py-1 px-3 border-r border-white/10 w-16 text-center">Editar</th>
              <th className="py-1 px-3 w-16 text-center">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const playing = isToday() && currentTimeSeconds >= item.start_time_seconds && currentTimeSeconds < item.start_time_seconds + item.duration_seconds;
              const countdown = playing ? (item.start_time_seconds + item.duration_seconds) - currentTimeSeconds : null;
              const formattedDate = `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
              
              return (
              <tr 
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`border-b border-white/5 transition-colors group text-white cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'opacity-50' : ''} ${dragOverIndex === index ? 'bg-white/10 border-t-2 border-t-[#00f0ff]' : ''} ${playing ? 'bg-[#0e4b77]/40 border-l-4 border-l-[#00f0ff]' : 'hover:bg-white/10'}`}
              >
                <td className="py-1 px-3 border-x border-white/10 text-center text-[#00f0ff] font-bold">{index + 1}</td>
                <td className="py-1 px-3 border-r border-white/10 font-medium truncate max-w-[300px] xl:max-w-[450px]" title={item.title}>{item.title}</td>
                <td className="py-1 px-3 border-r border-white/10 text-center text-white/60">
                  {item.duration_seconds >= 60 
                    ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60 > 0 ? (item.duration_seconds % 60) + 's' : ''}`
                    : `${item.duration_seconds} seg`}
                </td>
                <td className="py-1 px-3 border-r border-white/10 text-center font-mono font-bold text-yellow-400">
                  {playing ? formatTime(countdown!) : '-'}
                </td>
                <td className="py-1 px-3 border-r border-white/10 text-center font-mono text-white/60">{formattedDate}</td>
                <td className="py-1 px-3 border-r border-white/10 text-center font-mono text-[#00f0ff]">{formatTime(item.start_time_seconds)}</td>
                <td className="py-1 px-3 border-r border-white/10 text-center">
                  <button 
                    onClick={() => handleEditItem(item.id, item.title, item.start_time_seconds)}
                    className="text-[#00f0ff]/50 hover:text-[#00f0ff] p-1 rounded transition-colors"
                    title="Editar Título e Horário"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
                <td className="py-1 px-3 text-center">
                  <button 
                    onClick={() => handleRemoveItem(item.id, item.duration_seconds)}
                    className="text-red-500/50 hover:text-red-400 p-1 rounded transition-colors"
                    title="Excluir Vídeo"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )})}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-white/40 border-x border-white/10">
                  Nenhum programa agendado para esta data.
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-[#051622]/95 backdrop-blur sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-white/20">
              <tr className="text-[#00f0ff] font-bold">
                <td className="py-1 px-3 border-x border-white/10"></td>
                <td className="py-1 px-3 border-r border-white/10 text-right uppercase text-xs">Total do Dia:</td>
                <td className="py-1 px-3 border-r border-white/10">{formatTime(totalDuration)}</td>
                <td className="py-1 px-3 border-r border-white/10"></td>
                <td className="py-1 px-3 border-r border-white/10"></td>
                <td className="py-1 px-3 border-r border-white/10"></td>
                <td className="py-1 px-3 border-r border-white/10"></td>
                <td className="py-1 px-3"></td>
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

      {/* Biblioteca VOD (Vídeos Convertidos pelo Robô) */}
      <div className="mt-8 bg-[#051622]/50 border border-[#00f0ff]/20 rounded-xl p-6 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Tv className="text-[#00f0ff]" />
          Biblioteca VOD (Vídeos Processados)
        </h3>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar border border-white/10 rounded-lg">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead className="bg-[#051622] sticky top-0 z-20 shadow-md">
              <tr className="border-b border-white/20 text-white/50 uppercase tracking-wider text-xs">
                <th className="py-1 px-4 border-r border-white/10">Data</th>
                <th className="py-1 px-4 border-r border-white/10">Nome do Vídeo</th>
                <th className="py-1 px-4 border-r border-white/10 text-center">Duração</th>
                <th className="py-1 px-4 border-r border-white/10 text-center">Formato</th>
                <th className="py-1 px-4 border-r border-white/10 text-center">Adicionar</th>
                <th className="py-1 px-4 text-center">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {vodMovies.map((movie) => {
                const mTitle = movie.title || movie.titulo || 'Sem Título';
                const mUrl = movie.video_url || movie.url || '';
                const mDuration = movie.duration_seconds || movie.duracao_segundos || 0;
                const mFormat = mUrl.includes('.mp4') ? 'MP4' : (mUrl.includes('.webm') ? 'WEBM' : 'Outro');
                const mDate = movie.created_at ? new Date(movie.created_at).toLocaleDateString('pt-BR') : '-';
                
                return (
                  <tr key={movie.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-white">
                    <td className="py-1 px-4 border-r border-white/10 text-white/60 whitespace-nowrap">{mDate}</td>
                    <td className="py-1 px-4 border-r border-white/10 font-medium truncate max-w-[250px]" title={mTitle}>{mTitle}</td>
                    <td className="py-1 px-4 border-r border-white/10 text-[#00f0ff] font-mono text-center">{formatTime(mDuration)}</td>
                    <td className="py-1 px-4 border-r border-white/10 text-center">
                      <span className="bg-white/10 px-2 py-1 rounded text-xs text-white/70">{mFormat}</span>
                    </td>
                    <td className="py-1 px-4 border-r border-white/10 text-center">
                      <button
                        onClick={() => handleAddFromUpload(mTitle, mUrl, mDuration, '')}
                        className="bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#051622] px-3 py-1.5 rounded text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,240,255,0)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] whitespace-nowrap"
                      >
                        + Adicionar à Grade
                      </button>
                    </td>
                    <td className="py-1 px-4 text-center">
                      <button 
                        onClick={() => handleRemoveVodMovie(movie.id)}
                        className="text-red-500/50 hover:text-red-400 p-1.5 rounded transition-colors bg-red-500/5 hover:bg-red-500/20"
                        title="Excluir Vídeo da Biblioteca"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {vodMovies.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-white/40 text-sm">
                    Nenhum vídeo processado encontrado no banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Upload Component Integrado */}
        <ScheduleUploader onUploadComplete={handleAddFromUpload} />
        <ScheduleUrlAdder onUploadComplete={handleAddFromUpload} />
      </div>
    </div>
  );
}
