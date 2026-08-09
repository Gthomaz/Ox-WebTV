"use client";

import React, { useState, useEffect } from 'react';
import { DenunciaForm } from '@/components/denuncia/DenunciaForm';
import { MapPin, Send, Trash2, Tv, ShieldAlert, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import Image from 'next/image';

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
  const [dislikes, setDislikes] = useState(denuncia.dislikes_count || 0);
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

  const handleDislike = async () => {
    setDislikes(dislikes + 1);
    try {
      await fetch(`/api/reports/${denuncia.id}/dislike`, { method: 'POST' });
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
    <div className="overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 mb-8">
      <div className="bg-gray-50/50 border-b border-gray-100 p-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#0D3B66] text-white text-xs px-2 py-0.5 rounded font-mono shadow-sm">
                {denuncia.protocol_number || `ID-${denuncia.id}`}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                Postado em {new Date(denuncia.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <h3 className="text-xl text-[#0D3B66] font-extrabold mt-2 leading-tight">{denuncia.title}</h3>
            <div className="flex items-center mt-2 font-bold text-gray-700 text-sm">
              <MapPin className="w-4 h-4 mr-1 text-red-600" /> 
              {denuncia.location_address || 'Endereço não informado'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={denuncia.status} />
            <button 
              onClick={() => onDelete(denuncia.id)}
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
              title="Deletar Denúncia (Para Testes)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-gray-800 font-medium whitespace-pre-line leading-relaxed text-sm md:text-base">
          {denuncia.description}
        </p>

        {denuncia.report_media && denuncia.report_media.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {denuncia.report_media.map((media: any, index: number) => {
              if (media.media_type === 'video' || media.media_url.match(/\.(mp4|mov|webm)$/i)) {
                return (
                  <video key={index} src={media.media_url} controls playsInline webkit-playsinline preload="metadata" className="h-40 md:h-56 rounded-lg object-cover bg-black flex-shrink-0" />
                );
              }
              return (
                <img key={index} src={media.media_url} alt="Evidência" className="h-40 md:h-56 w-auto object-cover rounded-lg border border-gray-200 shadow-sm flex-shrink-0" />
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-3 px-5 flex justify-between items-center text-gray-700">
        <div className="flex gap-6">
          <button onClick={handleLike} className="hover:text-blue-600 font-bold text-sm flex items-center transition-colors">
            <ThumbsUp className="w-5 h-5 mr-2" /> {likes}
          </button>
          <button onClick={handleDislike} className="hover:text-red-600 font-bold text-sm flex items-center transition-colors">
            <ThumbsDown className="w-5 h-5 mr-2" /> {dislikes}
          </button>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-[#0D3B66] font-bold text-sm flex items-center transition-colors">
          <MessageCircle className="w-5 h-5 mr-2" /> {comments.length}
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-100 p-5 border-t border-gray-200">
          <div className="space-y-4 mb-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((c, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-bold text-sm text-[#0D3B66]">{c.author_name}</span>
                  <span className="text-xs font-semibold text-gray-500">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-gray-800 text-sm font-medium">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm font-semibold text-gray-500 py-6">Seja o primeiro a comentar sobre este problema!</p>
            )}
          </div>

          <form onSubmit={submitComment} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
            <input 
              placeholder="Seu Nome" 
              value={authorName} 
              onChange={e => setAuthorName(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 font-medium rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
              required
            />
            <div className="flex gap-2">
              <input 
                placeholder="Escreva um comentário..." 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 font-medium rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
                required
              />
              <button type="submit" disabled={isSubmitting} className="bg-[#0D3B66] hover:bg-blue-900 text-white rounded-md px-4 py-2 transition-colors disabled:opacity-50 shadow-md">
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
  const [instructions, setInstructions] = useState('');
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
    }
  };

  const fetchSettings = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.from('site_settings').select('fiscalizacao_instructions').eq('id', 1).single();
      if (data && data.fiscalizacao_instructions) {
        setInstructions(data.fiscalizacao_instructions);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchReports(), fetchSettings()]).finally(() => setIsLoading(false));
  }, []);

  const handleDenunciaEnviada = () => {
    fetchReports();
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Você é o Helder Ramalho? Tem certeza que quer deletar esta denúncia da base de dados? (Função apenas para teste)")) return;
    
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDenuncias(denuncias.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Falha ao deletar:", error);
    }
  };

  return (
    <div className="w-full bg-gray-100 flex flex-col font-sans">
      <div className="flex-1 pb-16 pt-6">
        {/* Banner do Portal */}
        <div className="bg-[#0D3B66] text-white py-10 shadow-lg">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <Image src="/fiscaliza-logo.png" width={120} height={120} alt="Fiscaliza Quissamã Logo" className="object-contain bg-white/10 rounded-2xl p-2 shadow-inner" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-md">Portal de Fiscalização</h1>
              <p className="text-lg text-blue-100 mt-2 font-medium">Denuncie, acompanhe e participe da fiscalização da nossa cidade através da OX TV.</p>
              <div className="flex flex-col md:flex-row items-center gap-4 mt-6 justify-center md:justify-start">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-extrabold bg-red-600 px-4 py-2 rounded-md text-white shadow-md uppercase tracking-wide">
                    Moderador Responsável: Helder Ramalho
                  </p>
                  <a 
                    href="/admin/dashboard/denuncias" 
                    className="bg-white hover:bg-gray-100 text-[#0D3B66] text-sm font-bold py-2.5 px-6 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md border-b-4 border-gray-200 hover:border-gray-300"
                  >
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Alternar para Painel Administrativo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-10 max-w-6xl">
          {/* Navegação por Abas */}
          <div className="flex border-b-2 border-gray-200 mb-10">
            <button 
              className={`flex-1 py-4 font-black text-lg text-center border-b-4 transition-colors ${activeTab === 'feed' ? 'border-[#0D3B66] text-[#0D3B66]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('feed')}
            >
              Feed de Fiscalização
            </button>
            <button 
              className={`flex-1 py-4 font-black text-lg text-center border-b-4 transition-colors ${activeTab === 'nova' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('nova')}
            >
              Registrar Nova Ocorrência
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Coluna Principal */}
            <div className="lg:col-span-2">
              {activeTab === 'nova' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <DenunciaForm onSuccess={handleDenunciaEnviada} />
                </div>
              )}

              {activeTab === 'feed' && (
                <div className="animate-in fade-in duration-500">
                  <h2 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
                    <Tv className="text-[#0D3B66] w-8 h-8" /> Ocorrências Recentes
                  </h2>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0D3B66]"></div>
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                      <ShieldAlert className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Nenhuma denúncia registrada</h3>
                      <p className="text-gray-600 font-medium">
                        Seja o primeiro a colaborar com a fiscalização da cidade.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coluna Lateral (Sidebar Informativa) */}
            <div className="hidden lg:block space-y-8">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <h3 className="font-extrabold text-gray-900 text-xl mb-5 border-b-2 border-gray-100 pb-3">Como funciona?</h3>
                {instructions ? (
                  <div className="space-y-5 text-gray-700 font-medium whitespace-pre-wrap">
                    {instructions}
                  </div>
                ) : (
                  <ul className="space-y-5 text-gray-700 font-medium">
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-600 font-black rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5 shadow-sm">1</span>
                      Você registra o problema com fotos, vídeo e endereço detalhado.
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-600 font-black rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5 shadow-sm">2</span>
                      A denúncia entra no Feed Público para a população apoiar e comentar.
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-600 font-black rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5 shadow-sm">3</span>
                      O moderador cobra as soluções devidas dos órgãos responsáveis.
                    </li>
                  </ul>
                )}
              </div>

              <div className="bg-[#051622] text-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MapPin size={100} />
                </div>
                <h3 className="font-black text-2xl mb-3 relative z-10 text-red-500">Quissamã mais forte!</h3>
                <p className="text-base text-gray-300 relative z-10 leading-relaxed mb-6 font-medium">
                  A Fiscalização Cidadã é um projeto da OX TV para dar voz ativa aos moradores. Não fique calado diante dos problemas do seu bairro.
                </p>
                <button 
                  onClick={() => setActiveTab('nova')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-base relative z-10 shadow-lg"
                >
                  Fazer uma Denúncia Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
