"use client";

import React, { useState, useEffect } from 'react';
import { DenunciaForm } from '@/components/denuncia/DenunciaForm';
import { MapPin, Send, Trash2, Home, Tv, ShieldAlert } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const StatusBadge = ({ status }: { status: string }) => {
  const getStyle = (s: string) => {
    switch(s) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Em Averiguação': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Em Solução': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Resolvido': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStyle(status)}`}>
      {status}
    </span>
  );
};

function FeedPost({ denuncia, onDelete }: { denuncia: any, onDelete: (id: number) => void }) {
  const [likes, setLikes] = useState(denuncia.likes_count || 0);
  const [comments, setComments] = useState<any[]>(denuncia.report_comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    setLikes(likes + 1);
    try {
      await fetch(`/api/reports/${denuncia.id}/like`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/reports/${denuncia.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: authorName, content: newComment })
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments([...comments, commentData]);
        setNewComment('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white rounded-xl shadow-md border border-gray-100 mb-6">
      <div className="bg-gray-50/50 border-b border-gray-100 p-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#0D3B66] text-white text-xs px-2 py-0.5 rounded font-mono">
                {denuncia.protocol_number || `ID-${denuncia.id}`}
              </span>
              <span className="text-xs text-gray-500">
                Postado em {new Date(denuncia.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <h3 className="text-xl text-[#0D3B66] font-bold mt-2">{denuncia.title}</h3>
            <div className="flex items-center mt-2 font-medium text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 text-red-500" /> 
              {denuncia.location_address || 'Endereço não informado'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={denuncia.status} />
            <button 
              onClick={() => onDelete(denuncia.id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
              title="Deletar Denúncia (Para Testes)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm md:text-base">
          {denuncia.description}
        </p>

        {denuncia.media_items && denuncia.media_items.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {denuncia.media_items.map((url: string, index: number) => {
              if (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm')) {
                return (
                  <video key={index} src={url} controls className="h-32 md:h-48 rounded-md object-cover bg-black" />
                );
              }
              return (
                <img key={index} src={url} alt="Evidência" className="h-32 md:h-48 w-auto object-cover rounded-md border border-gray-200" />
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-100 p-3 px-4 flex justify-between items-center">
        <button onClick={handleLike} className="text-gray-500 hover:text-blue-600 font-medium text-sm flex items-center transition-colors">
          👍 Apoiar <span className="ml-1 bg-white border px-1.5 py-0.5 rounded text-xs">{likes}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="text-gray-500 hover:text-blue-600 font-medium text-sm transition-colors">
          💬 {comments.length} Comentários
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-100 p-4 border-t border-gray-200">
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((c, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-sm text-[#0D3B66]">{c.author_name}</span>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-gray-700 text-sm">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">Seja o primeiro a comentar sobre este problema!</p>
            )}
          </div>

          <form onSubmit={submitComment} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2">
            <input 
              placeholder="Seu Nome" 
              value={authorName} 
              onChange={e => setAuthorName(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2">
              <input 
                placeholder="Escreva um comentário..." 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button type="submit" disabled={isSubmitting} className="bg-[#0D3B66] hover:bg-blue-800 text-white rounded px-3 py-2 transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DenunciasPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'nova'>('feed');
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setDenuncias(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDenunciaEnviada = () => {
    fetchReports(); // Recarrega os dados do feed
    setActiveTab('feed'); // Troca a aba para o feed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Você é o Helder? Tem certeza que quer deletar esta denúncia da base de dados? (Função apenas para teste)")) return;
    
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error("Falha ao deletar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 pb-12 pt-[72px]">
        {/* Banner do Portal */}
        <div className="bg-[#0D3B66] text-white py-10 shadow-inner">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <img src="/logo.png" alt="Fiscaliza Quissamã Logo" className="h-24 w-24 object-contain bg-white/10 rounded-xl p-2" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Portal de Fiscalização</h1>
              <p className="text-base text-blue-200 mt-2">Denuncie, acompanhe e participe da fiscalização da nossa cidade através da OX TV.</p>
              <div className="flex flex-col md:flex-row items-center gap-4 mt-4 justify-center md:justify-start">
                <p className="text-xs font-semibold bg-red-700/50 inline-block px-3 py-1.5 rounded text-red-100 border border-red-500/30">
                  Moderador: Helder Araújo
                </p>
                <a 
                  href="/admin/dashboard/denuncias" 
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-1.5 px-4 rounded transition-colors flex items-center gap-2"
                >
                  Acessar QG Helder (Backoffice)
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 max-w-4xl">
          {/* Navegação de Abas Personalizada */}
          <div className="flex bg-white shadow-sm rounded-lg p-1 mb-8">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 text-center py-3 text-sm md:text-base font-bold rounded-md transition-all ${activeTab === 'feed' ? 'bg-[#0D3B66] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Feed de Denúncias
            </button>
            <button 
              onClick={() => setActiveTab('nova')}
              className={`flex-1 text-center py-3 text-sm md:text-base font-bold rounded-md transition-all ${activeTab === 'nova' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Nova Denúncia
            </button>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === 'nova' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DenunciaForm onSuccess={handleDenunciaEnviada} />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Denúncias Recentes</h2>
                <div className="text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm text-gray-600">
                  {denuncias.length} registros
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D3B66]"></div>
                </div>
              ) : denuncias.length > 0 ? (
                denuncias.map((denuncia) => (
                  <FeedPost 
                    key={denuncia.id} 
                    denuncia={denuncia} 
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700">Nenhuma denúncia registrada</h3>
                  <p className="text-gray-500 mt-2">Seja o primeiro a contribuir com a fiscalização da cidade.</p>
                  <button 
                    onClick={() => setActiveTab('nova')}
                    className="mt-6 bg-[#0D3B66] hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Fazer uma Denúncia
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
