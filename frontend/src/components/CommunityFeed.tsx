'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { MessageSquare, ThumbsUp, ThumbsDown, Image as ImageIcon, Send, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

interface Post {
  id: number;
  author_name: string;
  author_email: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

export function CommunityFeed() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth Form (Se o usuário não tiver Perfil)
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check auth
    const savedEmail = localStorage.getItem('oxtv_voter_email');
    const savedName = localStorage.getItem('oxtv_voter_name');
    if (savedEmail && savedName) {
      setUserEmail(savedEmail);
      setUserName(savedName);
    }
    
    fetchPosts();
    setupRealtime();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (data) setPosts(data);
  };

  const setupRealtime = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    
    const channel = supabase
      .channel('community_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, (payload) => {
        setPosts((prev) => [payload.new as Post, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_posts' }, (payload) => {
        setPosts((prev) => prev.map(p => p.id === payload.new.id ? (payload.new as Post) : p));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const uploadImageToR2 = async (file: File): Promise<string> => {
    const filename = `post_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const res = await fetch('/api/r2-presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: file.type })
    });
    
    if (!res.ok) throw new Error('Falha no upload');
    const { signedUrl, publicUrl } = await res.json();
    
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    
    if (!uploadRes.ok) throw new Error('Falha no upload R2');
    return publicUrl;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    if (!userEmail) {
      setShowRegForm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = null;
      if (imageFile) {
        uploadedUrl = await uploadImageToR2(imageFile);
      }

      await supabase.from('community_posts').insert({
        author_name: userName,
        author_email: userEmail,
        content: content.trim(),
        image_url: uploadedUrl
      });

      setContent('');
      setImageFile(null);
    } catch (e: any) {
      alert("Erro ao postar: " + e.message);
    }
    setIsSubmitting(false);
  };

  const handleInteraction = async (postId: number, type: 'like' | 'dislike') => {
    if (!userEmail) {
      setShowRegForm(true);
      return;
    }

    try {
      // Registrar interação
      const { error } = await supabase.from('community_interactions').insert({
        post_id: postId,
        user_email: userEmail,
        interaction_type: type
      });

      if (!error) {
        // Atualizar contadores na tabela post
        const post = posts.find(p => p.id === postId);
        if (post) {
          const updates = type === 'like' 
            ? { likes_count: post.likes_count + 1 }
            : { dislikes_count: post.dislikes_count + 1 };
            
          await supabase.from('community_posts').update(updates).eq('id', postId);
        }
      } else if (error.code === '23505') {
        // Já interagiu
        alert("Você já avaliou esta postagem!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) return;
    
    // Salvar perfil simples (sem celular obrigatorio se for só para o chat, mas tentamos salvar o basico)
    await supabase.from('user_profiles').upsert({
      email: regEmail,
      name: regName
    });
    
    localStorage.setItem('oxtv_voter_email', regEmail);
    localStorage.setItem('oxtv_voter_name', regName);
    setUserEmail(regEmail);
    setUserName(regName);
    setShowRegForm(false);
    
    // Auto submit if there was pending content
    if (content.trim() || imageFile) {
      handlePostSubmit(e);
    }
  };

  return (
    <div className="w-full bg-[#051622]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500 mb-12">
      {/* Header Colapsável */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#0e4b77]/50 to-transparent hover:bg-white/5 transition-colors border-b border-white/10"
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="text-[#00f0ff]" size={24} />
          Comunidade Cinéfila
        </h2>
        <div className="flex items-center gap-2 text-white/50 hover:text-white">
          <span className="text-sm font-medium">{isExpanded ? 'Ocultar Comunidade' : 'Mostrar Comunidade'}</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Body da Comunidade */}
      <div className={`transition-all duration-500 ease-in-out origin-top ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 md:p-6 flex flex-col h-[700px]">
          
          {/* Caixa de Criação de Post */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-6 shrink-0">
            {showRegForm ? (
              <div className="animate-in fade-in slide-in-from-top-4">
                <h3 className="text-white font-bold mb-2">Junte-se à Comunidade</h3>
                <p className="text-white/60 text-sm mb-4">Crie um perfil rápido para postar e avaliar comentários.</p>
                <form onSubmit={handleRegistrationSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input required type="text" placeholder="Seu Nome" value={regName} onChange={e => setRegName(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white" />
                  <input required type="email" placeholder="Seu E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white" />
                  <button type="submit" className="bg-[#00f0ff] text-[#051622] font-bold px-6 py-2 rounded-lg hover:bg-[#00f0ff]/80 transition-colors">Entrar</button>
                  <button type="button" onClick={() => setShowRegForm(false)} className="text-white/60 hover:text-white px-4">Cancelar</button>
                </form>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="O que você achou dos filmes? Compartilhe suas teorias..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white resize-none h-24 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] outline-none transition-all"
                />
                
                {imageFile && (
                  <div className="relative w-max">
                    <img src={URL.createObjectURL(imageFile)} className="h-20 rounded-lg border border-white/20" />
                    <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <label className="cursor-pointer flex items-center gap-2 text-white/60 hover:text-[#00f0ff] transition-colors bg-white/5 hover:bg-[#00f0ff]/10 px-4 py-2 rounded-lg">
                    <ImageIcon size={20} />
                    <span className="text-sm font-medium">Anexar Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting || (!content.trim() && !imageFile)}
                    className="bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#051622] font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    Publicar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Feed de Posts */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
            {posts.map((post) => (
              <div key={post.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{post.author_name}</h4>
                    <span className="text-xs text-white/40">{new Date(post.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                
                <p className="text-white/90 mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {post.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-white/10 max-h-80 w-max">
                    <img src={post.image_url} alt="Imagem anexada" className="max-h-80 object-contain" />
                  </div>
                )}
                
                <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                  <button onClick={() => handleInteraction(post.id, 'like')} className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors">
                    <ThumbsUp size={18} />
                    <span className="text-sm font-bold">{post.likes_count}</span>
                  </button>
                  <button onClick={() => handleInteraction(post.id, 'dislike')} className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors">
                    <ThumbsDown size={18} />
                    <span className="text-sm font-bold">{post.dislikes_count}</span>
                  </button>
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>Seja o primeiro a compartilhar sua opinião sobre os filmes da semana!</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
