'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Settings, X, Tv, Link as LinkIcon, MessageCircle, Image as ImageIcon, Trash2, ShieldBan, Film } from 'lucide-react';

export function AdminPanel() {
  const { 
    isAdminOpen, setIsAdminOpen,
    playerMode, setPlayerMode,
    liveStreamUrl, setLiveStreamUrl,
    pollData, setPollData,
    overlayAd, setOverlayAd,
    clearChat, blockedUsers, blockUser, unblockUser,
    movies, addMovie, removeMovie
  } = useAdmin();

  const [tempQuestion, setTempQuestion] = useState('');
  const [tempOptions, setTempOptions] = useState('Sim, Com certeza, Não');
  const [tempBlockUser, setTempBlockUser] = useState('');
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieCover, setNewMovieCover] = useState('');
  const [newMovieVideo, setNewMovieVideo] = useState('');

  if (!isAdminOpen) return null;

  const handleDispararEnquete = () => {
    if (tempQuestion.trim()) {
      const optionsArray = tempOptions.split(',').map(o => o.trim()).filter(o => o);
      setPollData({
        id: Date.now().toString(),
        question: tempQuestion,
        options: optionsArray.length > 0 ? optionsArray : ['Sim', 'Não']
      });
      setTempQuestion('');
    } else {
      setPollData(null);
    }
  };

  const handleBlockUser = () => {
    if (tempBlockUser.trim()) {
      blockUser(tempBlockUser.trim());
      setTempBlockUser('');
    }
  };

  const handleAddMovie = () => {
    if (newMovieTitle && newMovieCover && newMovieVideo) {
      addMovie({ title: newMovieTitle, coverUrl: newMovieCover, videoUrl: newMovieVideo });
      setNewMovieTitle('');
      setNewMovieCover('');
      setNewMovieVideo('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#051622] border border-[#00f0ff]/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2 text-white">
            <Settings size={20} className="text-[#00f0ff]" />
            <h2 className="font-bold tracking-wide">Backoffice <span className="text-[#00f0ff] font-light">OX</span></h2>
          </div>
          <button onClick={() => setIsAdminOpen(false)} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          
          {/* Toggle Player Mode */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <Tv size={16} /> Estado do Player
            </label>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
              <button 
                onClick={() => setPlayerMode('live')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${playerMode === 'live' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white/50 hover:text-white/80'}`}
              >
                🔴 Ao Vivo
              </button>
              <button 
                onClick={() => setPlayerMode('grade')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${playerMode === 'grade' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-white/50 hover:text-white/80'}`}
              >
                📼 Grade
              </button>
            </div>
          </div>

          {/* URL do Stream */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <LinkIcon size={16} /> URL do Stream (Ao Vivo)
            </label>
            <input 
              type="text" 
              value={liveStreamUrl}
              onChange={(e) => setLiveStreamUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all"
              placeholder="https://..."
            />
          </div>

          {/* Enquete Interativa */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <MessageCircle size={16} /> Disparar Enquete Interativa
            </label>
            <div className="space-y-2">
              <input 
                type="text" 
                value={tempQuestion}
                onChange={(e) => setTempQuestion(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                placeholder="Pergunta da enquete..."
              />
              <input 
                type="text" 
                value={tempOptions}
                onChange={(e) => setTempOptions(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]"
                placeholder="Opções separadas por vírgula"
              />
              <button 
                onClick={handleDispararEnquete}
                className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/10 hover:border-transparent mt-2"
              >
                Lançar na Tela
              </button>
            </div>
            {pollData && (
              <div className="text-xs text-[#00f0ff] bg-[#00f0ff]/10 p-2 rounded border border-[#00f0ff]/20 flex justify-between items-center mt-2">
                <span className="truncate mr-2">Ativa: {pollData.question}</span>
                <button onClick={() => setPollData(null)} className="text-white hover:text-red-400 shrink-0"><X size={14}/></button>
              </div>
            )}
          </div>

          {/* Moderação do Chat */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <ShieldBan size={16} /> Moderação do Chat
            </label>
            <button 
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              <Trash2 size={16} /> Limpar Histórico do Chat
            </button>

            <div className="flex gap-2 pt-2">
              <input 
                type="text" 
                value={tempBlockUser}
                onChange={(e) => setTempBlockUser(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                placeholder="Nome do usuário"
              />
              <button 
                onClick={handleBlockUser}
                className="bg-black/40 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/70 px-3 py-2 rounded-lg transition-all"
              >
                Bloquear
              </button>
            </div>

            {blockedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {blockedUsers.map(user => (
                  <span key={user} className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">
                    {user}
                    <button onClick={() => unblockUser(user)} className="hover:text-white"><X size={12}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Anúncio Overlay */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <ImageIcon size={16} /> Sobreposição / Anúncio
            </label>
            <select 
              value={overlayAd}
              onChange={(e) => setOverlayAd(e.target.value as any)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all appearance-none"
            >
              <option value="none">Nenhum Anúncio</option>
              <option value="banner1">Banner Patrocinador 1</option>
              <option value="banner2">Banner Promoção Especial</option>
            </select>
          </div>

          {/* Gerenciador de Filmes */}
          <div className="space-y-3 border-t border-white/10 pt-4 pb-8">
            <label className="flex items-center gap-2 text-sm text-white/70 font-medium">
              <Film size={16} /> Gerenciador de Filmes
            </label>
            <div className="space-y-2">
              <input type="text" value={newMovieTitle} onChange={(e) => setNewMovieTitle(e.target.value)} placeholder="Título do Filme" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]" />
              <input type="text" value={newMovieCover} onChange={(e) => setNewMovieCover(e.target.value)} placeholder="URL da Capa" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]" />
              <input type="text" value={newMovieVideo} onChange={(e) => setNewMovieVideo(e.target.value)} placeholder="URL do Vídeo (m3u8/mp4)" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff]" />
              <button onClick={handleAddMovie} className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/10 hover:border-transparent mt-2">
                Adicionar Catálogo
              </button>
            </div>
            
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {movies.map(movie => (
                <div key={movie.id} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/10">
                  <span className="text-sm text-white truncate pr-2" title={movie.title}>{movie.title}</span>
                  <button onClick={() => removeMovie(movie.id)} className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
