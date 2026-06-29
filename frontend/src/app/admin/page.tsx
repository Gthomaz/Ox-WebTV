'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';
import { Lock, Radio, Save, CheckCircle2, Plus, Trash2, CalendarClock, GripVertical, Image as ImageIcon, MessageSquare, AlertCircle, LogOut, Upload, Film, MonitorPlay } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VideoPlayer from '@/components/VideoPlayer';
import { LiveChat } from '@/components/LiveChat';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Program {
  id: number;
  title: string;
  url: string;
  start_time: string;
  sort_order: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  description?: string;
}

interface Movie {
  id: number;
  title: string;
  cover_url: string;
  description: string;
  video_url: string;
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
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Broadcast Control States
  const [isLive, setIsLive] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');
  
  // Watermark States
  const [watermarkUrl, setWatermarkUrl] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(1);
  const [watermarkHPos, setWatermarkHPos] = useState(95);
  const [watermarkVPos, setWatermarkVPos] = useState(95);
  const [watermarkSize, setWatermarkSize] = useState(100);
  const [banner, setBanner] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsStr, setPollOptionsStr] = useState('');
  const [chatActive, setChatActive] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Schedule States
  const [programs, setPrograms] = useState<Program[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Movies States
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieCover, setNewMovieCover] = useState('');
  const [newMovieDesc, setNewMovieDesc] = useState('');
  const [newMovieVideo, setNewMovieVideo] = useState('');
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadCoverProgress, setUploadCoverProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadVideoProgress, setUploadVideoProgress] = useState(0);

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
      fetchMovies();
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
      setWatermarkHPos(data.watermark_h_pos ?? 95);
      setWatermarkVPos(data.watermark_v_pos ?? 95);
      setWatermarkSize(data.watermark_size ?? 100);
      setBanner(data.active_banner || '');
      setPollQuestion(data.active_poll_question || '');
      setChatActive(data.chat_active || false);
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

  const fetchMovies = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const { data } = await supabase.from('filmes').select('*').order('id', { ascending: false });
    if (data) setMoviesList(data);
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
      .upsert({ 
        id: 1,
        is_live: isLive, 
        live_url: liveUrl,
        watermark_url: watermarkUrl,
        watermark_opacity: watermarkOpacity,
        watermark_h_pos: watermarkHPos,
        watermark_v_pos: watermarkVPos,
        watermark_size: watermarkSize,
        active_banner: banner,
        active_poll_question: pollQuestion,
        active_poll_options: optionsArray.length > 0 ? optionsArray : null,
        chat_active: chatActive
      });

    setIsSaving(false);

    if (!error) {
      setSuccessMsg('Configurações aplicadas no ar!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
  };

  const toggleLiveStatus = async () => {
    const newStatus = !isLive;
    setIsLive(newStatus);
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await supabase.from('broadcast_control').update({ is_live: newStatus }).eq('id', 1);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const maxSort = programs.length > 0 ? Math.max(...programs.map(p => p.sort_order)) : 0;
    
    let finalStartTime = newStartTime;
    if (!finalStartTime || finalStartTime.trim() === '') {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      finalStartTime = now.toISOString().slice(0, 16);
    }

    let duration = 0;
    try {
      duration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = newUrl;
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(Math.round(video.duration || 0));
        video.onerror = () => resolve(0);
        setTimeout(() => resolve(0), 4000);
      });
    } catch(e) {}

    const totalDuration = programs.reduce((acc, p) => acc + (p.duration_seconds || 0), 0);
    if (totalDuration + duration > 86400) {
      alert(`Bloqueado! Limite de 24 horas excedido. Total atual: ${(totalDuration/3600).toFixed(1)}h | Este vídeo: ${(duration/3600).toFixed(1)}h`);
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from('programacao').insert([
      { 
        title: newTitle, 
        url: newUrl, 
        start_time: finalStartTime, 
        sort_order: maxSort + 1,
        duration_seconds: duration,
        thumbnail_url: newThumbnail,
        description: newDesc
      }
    ]);

    setIsAdding(false);
    if (!error) {
      setNewTitle(''); setNewUrl(''); setNewStartTime(''); setNewThumbnail(''); setNewDesc('');
      fetchPrograms();
    } else {
      alert('Erro ao adicionar: ' + error.message);
    }
  };

  const handleRemoveProgram = async (id: number) => {
    const { error } = await supabase.from('programacao').delete().eq('id', id);
    if (!error) fetchPrograms();
  };

  const handleSaveGrid = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('broadcast_control')
      .update({ grid_updated_at: new Date().toISOString() })
      .eq('id', 1);
    
    setIsSaving(false);
    if (!error) {
      setSuccessMsg('Grade Salva! Player atualizado para todos.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Erro ao salvar grade: ' + error.message);
    }
  };

  const extractThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';
      
      video.onloadeddata = () => {
        video.currentTime = 1; // Pega o frame em 1 segundo
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao gerar capa'));
            }
            URL.revokeObjectURL(video.src);
          }, 'image/jpeg', 0.7);
        } else {
          reject(new Error('Erro no contexto do canvas'));
        }
      };

      video.onerror = (e) => reject(e);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setUploadVideoProgress(0);
    setIsUploadingCover(true);
    setUploadCoverProgress(0);

    try {
      // 1. Gerar Capa (Thumbnail Automática)
      const thumbBlob = await extractThumbnail(file);
      const thumbFile = new File([thumbBlob], `cover_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Request Presigned URL for Thumbnail
      const thumbRes = await fetch('/api/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: thumbFile.name, contentType: thumbFile.type })
      });
      if (!thumbRes.ok) {
        const errorData = await thumbRes.json().catch(() => ({}));
        throw new Error(`Capa: ${errorData.error || thumbRes.statusText}`);
      }
      const { signedUrl: thumbSignedUrl, publicUrl: thumbPublicUrl } = await thumbRes.json();

      // Upload Thumbnail directly to R2
      const thumbUpload = await fetch(thumbSignedUrl, {
        method: 'PUT',
        body: thumbFile,
        headers: { 'Content-Type': thumbFile.type }
      });
      if (!thumbUpload.ok) throw new Error('Falha no upload da capa');
      
      setUploadCoverProgress(100);
      setNewMovieCover(thumbPublicUrl);
      setIsUploadingCover(false);

      // 2. Request Presigned URL for Video
      const videoRes = await fetch('/api/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4' })
      });
      if (!videoRes.ok) {
        const errorData = await videoRes.json().catch(() => ({}));
        throw new Error(`Vídeo: ${errorData.error || videoRes.statusText}`);
      }
      const { signedUrl: videoSignedUrl, publicUrl: videoPublicUrl } = await videoRes.json();

      const progressInterval = setInterval(() => {
        setUploadVideoProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 500);

      // Upload Video directly to R2
      const videoUpload = await fetch(videoSignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'video/mp4' }
      });

      clearInterval(progressInterval);
      if (!videoUpload.ok) throw new Error('Falha no upload do vídeo');

      setUploadVideoProgress(100);
      setNewMovieVideo(videoPublicUrl);

      setTimeout(() => {
        setIsUploadingVideo(false);
        setUploadVideoProgress(0);
        setUploadCoverProgress(0);
      }, 1500);

    } catch (error: any) {
      alert(`Erro no upload: ` + error.message);
      setIsUploadingVideo(false);
      setIsUploadingCover(false);
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMovie(true);

    const { error } = await supabase.from('filmes').insert([
      { title: newMovieTitle, cover_url: newMovieCover, description: newMovieDesc, video_url: newMovieVideo }
    ]);

    setIsAddingMovie(false);
    if (!error) {
      setNewMovieTitle(''); setNewMovieCover(''); setNewMovieDesc(''); setNewMovieVideo('');
      fetchMovies();
    } else {
      alert('Erro ao adicionar filme: ' + error.message);
    }
  };

  const handleRemoveMovie = async (movie: Movie) => {
    try {
      const getFilePathFromUrl = (url: string) => {
        if (!url) return null;
        const parts = url.split('/public/filmes/');
        return parts.length > 1 ? parts[1] : null;
      };

      const coverPath = getFilePathFromUrl(movie.cover_url);
      const videoPath = getFilePathFromUrl(movie.video_url);

      const pathsToRemove = [];
      if (coverPath) pathsToRemove.push(coverPath);
      if (videoPath) pathsToRemove.push(videoPath);

      if (pathsToRemove.length > 0) {
        await supabase.storage.from('filmes').remove(pathsToRemove);
      }

      const { error } = await supabase.from('filmes').delete().eq('id', movie.id);
      if (error) throw error;
      
      fetchMovies();
    } catch (error: any) {
      alert('Erro ao excluir filme: ' + error.message);
    }
  };

  const handleAddMovieToSchedule = async (movie: Movie) => {
    const maxSort = programs.length > 0 ? Math.max(...programs.map(p => p.sort_order)) : 0;
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const startTime = now.toISOString().slice(0, 16);
    
    const { error } = await supabase.from('programacao').insert([
      { 
        title: movie.title, 
        url: movie.video_url, 
        start_time: startTime, 
        sort_order: maxSort + 1,
        thumbnail_url: movie.cover_url,
        description: movie.description
      }
    ]);

    if (!error) {
      fetchPrograms();
    } else {
      alert('Erro ao adicionar à grade: ' + error.message);
    }
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
        
        Promise.all(updatePromises).catch(err => {
          console.error("Erro ao reordenar grade:", err);
          alert("Falha ao salvar a nova ordem no banco de dados.");
        });
        
        // Also update local state sort_order
        return newArray.map((item, index) => ({ ...item, sort_order: index }));
      });
    }
  };

  const handleClearChat = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const confirmWipe = window.confirm("Tem certeza que deseja APAGAR todas as mensagens do chat público?");
    if (!confirmWipe) return;
    
    const { error } = await supabase.from('chat_messages').delete().neq('id', 0);
    if (!error) {
      alert("Chat limpo com sucesso!");
    } else {
      alert("Erro ao limpar chat: " + error.message);
    }
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
        <div className="flex w-full md:w-auto gap-4">
          <button 
            onClick={() => router.push('/')} 
            className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Sair
          </button>
          <button onClick={() => handleSaveControl()} disabled={isSaving} className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2">
            <Save size={20} />
            {isSaving ? 'Aplicando...' : 'Aplicar Interatividade (No Ar)'}
          </button>
        </div>
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
            <div className="flex justify-end mb-4">
              <button onClick={handleSaveGrid} disabled={isSaving} className="flex items-center gap-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#051622] font-bold px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all">
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar Grade e Atualizar Player'}
              </button>
            </div>
            <form onSubmit={handleAddProgram} className="space-y-3">
              <input type="text" placeholder="Título (Ex: Noticiário)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="text" placeholder="Sinopse / Descrição Curta" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm [color-scheme:dark]" />
                <input type="url" placeholder="URL do Vídeo" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <input type="url" placeholder="URL da Miniatura (Thumbnail)" value={newThumbnail} onChange={e => setNewThumbnail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <button type="submit" disabled={isAdding} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-sm transition-all">
                <Plus size={16} /> Adicionar à Fila
              </button>
            </form>
          </div>
        </div>

        {/* MÓDULO DE FILMES */}
        <div className="lg:col-span-5 bg-[#051622] rounded-2xl border border-white/10 p-6 flex flex-col h-[50vh] lg:h-[75vh]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <ImageIcon className="text-[#00f0ff]" size={20} />
            Catálogo de Filmes
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase">
                  <th className="pb-2 font-medium font-sans">Capa</th>
                  <th className="pb-2 font-medium font-sans">Detalhes</th>
                  <th className="pb-2 font-medium font-sans text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {moviesList.map((movie) => (
                  <tr key={movie.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-3 w-16">
                      <img src={movie.cover_url} alt={movie.title} className="w-12 h-16 object-cover rounded-md bg-black shadow-sm" />
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <h4 className="text-white font-medium text-sm leading-tight mb-1">{movie.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{movie.description}</p>
                    </td>
                    <td className="py-3 align-middle text-right w-24">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAddMovieToSchedule(movie)} className="text-[#00f0ff] hover:text-white p-2 rounded-lg hover:bg-[#00f0ff]/20 transition-all" title="Adicionar à Grade">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => handleRemoveMovie(movie)} className="text-red-500 hover:text-white p-2 rounded-lg hover:bg-red-500/20 transition-all" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {moviesList.length === 0 && (
              <p className="text-white/40 text-center text-sm py-10">Nenhum filme cadastrado.</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <form onSubmit={handleAddMovie} className="space-y-3">
              <input type="text" placeholder="Título do Filme" value={newMovieTitle} onChange={e => setNewMovieTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="text" placeholder="Sinopse" value={newMovieDesc} onChange={e => setNewMovieDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              <div className="flex flex-col gap-2 mt-2">
                <label className={`flex flex-col items-center justify-center gap-2 ${(isUploadingVideo || isUploadingCover) ? 'bg-white/10 text-white/50 cursor-not-allowed' : (newMovieVideo && newMovieCover) ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] cursor-pointer'} border border-[#00f0ff]/30 px-3 py-6 rounded-lg text-sm transition-all text-center`} title="Upload Automático do Filme">
                  {(newMovieVideo && newMovieCover && !isUploadingVideo && !isUploadingCover) ? <Film size={24} /> : <Upload size={24} />}
                  <span className="font-medium">
                    {(isUploadingVideo || isUploadingCover) 
                      ? 'Processando e Enviando...' 
                      : (newMovieVideo && newMovieCover) 
                        ? 'Vídeo e Capa Prontos!' 
                        : 'Selecionar Arquivo de Vídeo (Capa Automática)'}
                  </span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={isUploadingVideo || isUploadingCover} />
                </label>
                {(isUploadingVideo || isUploadingCover) && (
                  <div className="w-full bg-white/10 rounded-full h-1 mt-1 overflow-hidden">
                    <div className="bg-[#00f0ff] h-1 rounded-full transition-all duration-300" style={{ width: `${Math.max(uploadVideoProgress, uploadCoverProgress)}%` }}></div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isAddingMovie || !newMovieCover || !newMovieVideo} className={`w-full flex items-center justify-center gap-2 ${(isAddingMovie || !newMovieCover || !newMovieVideo) ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff]'} border border-white/10 py-2 rounded-lg text-sm transition-all`}>
                <Plus size={16} /> Adicionar Filme
              </button>
            </form>
          </div>
        </div>

        {/* LADO DIREITO: Módulos de Controle */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-auto lg:h-[75vh] overflow-y-auto pr-2 pb-10 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
          
          {/* Módulo 0: Preview de Direção */}
          <div className="bg-[#051622] rounded-2xl border border-white/10 p-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MonitorPlay className="text-[#00f0ff]" size={20} />
                Preview de Direção (MCR)
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-black/40 rounded-full border border-white/10">
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`}></div>
                <span className={isLive ? 'text-red-400 tracking-wider' : 'text-green-400 tracking-wider'}>{isLive ? 'SINAL AO VIVO' : 'SINAL VOD'}</span>
              </div>
            </div>
            {/* O container interno do VideoPlayer limita o tamanho máximo para que caiba bem no painel */}
            <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-white/5 shadow-2xl relative">
              <VideoPlayer />
              {/* Bloqueador de Interação: Opcional, mantido comentado se quisermos que o admin mude o volume. 
                  Como é preview, vamos deixar a interação livre para o admin mutar se quiser. */}
            </div>
          </div>

          {/* Módulo 1: Player Master */}
          <div className="bg-[#051622] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Radio className={isLive ? "text-red-500 animate-pulse" : "text-white/40"} size={20} />
              Sinal Mestre
            </h2>
            <div className="flex flex-col mb-4">
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isLive} onChange={toggleLiveStatus} />
                  <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                  <span className="ml-3 text-sm font-medium text-white">{isLive ? 'Link Externo (Sinal Mestre)' : 'Programação (Grade)'}</span>
                </label>
              </div>
              <div className="text-xs text-white/50 mt-3 p-3 bg-black/30 rounded-lg border border-white/5">
                <p className="mb-1"><strong className="text-red-400">🔴 VERMELHO (AO VIVO):</strong> Corta a grade e ativa o Link M3U8 para OBS, repórteres de rua ou programas gravados ao vivo como podcasts.</p>
                <p><strong className="text-white">⚪ BRANCO (GRADE):</strong> Toca a programação normal da Grade de Vídeos (Padrão).</p>
              </div>
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
                <div className="flex items-center gap-4 mb-4 mt-2">
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={chatActive} onChange={() => setChatActive(!chatActive)} />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-sm font-medium text-white">{chatActive ? 'Chat Público Ligado' : 'Chat Público Desligado'}</span>
                  </label>
                </div>
                <button onClick={handleClearChat} type="button" className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-4 py-2 rounded-lg mt-2">
                  <MessageSquare size={16} /> Limpar Bate-Papo do Espectador (Wipe Chat)
                </button>
              </div>
              
              {/* Backoffice Chat Room */}
              {chatActive && (
                <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="text-sm font-bold text-[#00f0ff] mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> Sala de Controle de Bate-Papo (Backoffice)
                  </h3>
                  <p className="text-xs text-white/50 mb-2">Você pode moderar e conversar com os espectadores diretamente por aqui. Entre com o apelido "Admin".</p>
                  <LiveChat isActive={chatActive} mode="embed" />
                </div>
              )}
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
                <input type="text" placeholder="/assets/Ox-Tv-Logo-Transparent.png" value={watermarkUrl} onChange={e => setWatermarkUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>Posição Horizontal (Esq ↔ Dir)</span>
                    <span className="text-[#00f0ff]">{watermarkHPos}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={watermarkHPos} onChange={e => setWatermarkHPos(parseInt(e.target.value))} className="w-full accent-[#00f0ff]" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>Posição Vertical (Cima ↕ Baixo)</span>
                    <span className="text-[#00f0ff]">{watermarkVPos}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={watermarkVPos} onChange={e => setWatermarkVPos(parseInt(e.target.value))} className="w-full accent-[#00f0ff]" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>Tamanho da Logo</span>
                    <span className="text-[#00f0ff]">{watermarkSize}%</span>
                  </label>
                  <input type="range" min="10" max="300" value={watermarkSize} onChange={e => setWatermarkSize(parseInt(e.target.value))} className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 flex justify-between">
                    <span>Transparência (Visibilidade)</span>
                    <span className="text-purple-400">{Math.round(watermarkOpacity * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.05" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button onClick={handleSaveControl} disabled={isSaving} className="bg-purple-600/50 border border-purple-500 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2">
                  <Save size={16} />
                  {isSaving ? 'Salvando...' : 'Salvar Marca D\'água'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
