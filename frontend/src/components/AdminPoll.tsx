'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Ticket, Loader2, Send, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface CandidateInput {
  title: string;
  synopsis: string;
  file: File | null;
  cover_url: string;
}

export function AdminPoll() {
  const [activePoll, setActivePoll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // New Poll State
  const [pollTitle, setPollTitle] = useState('Enquete da Semana');
  const [candidates, setCandidates] = useState<CandidateInput[]>([
    { title: '', synopsis: '', file: null, cover_url: '' },
    { title: '', synopsis: '', file: null, cover_url: '' },
    { title: '', synopsis: '', file: null, cover_url: '' },
    { title: '', synopsis: '', file: null, cover_url: '' },
    { title: '', synopsis: '', file: null, cover_url: '' }
  ]);

  useEffect(() => {
    fetchActivePoll();
  }, []);

  const fetchActivePoll = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('movie_polls')
      .select('*, poll_candidates(*)')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setActivePoll(data);
    } else {
      setActivePoll(null);
    }
    setIsLoading(false);
  };

  const handleCandidateChange = (index: number, field: keyof CandidateInput, value: any) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const uploadCoverToR2 = async (file: File): Promise<string> => {
    const filename = `poll_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const res = await fetch('/api/r2-presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: file.type })
    });
    
    if (!res.ok) throw new Error('Falha ao gerar URL de upload da capa');
    
    const { signedUrl, publicUrl } = await res.json();
    
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    
    if (!uploadRes.ok) throw new Error('Falha no upload da capa para a Cloudflare');
    return publicUrl;
  };

  const createPoll = async () => {
    // Validate
    if (!pollTitle) return alert("Preencha o título da enquete");
    for (let i = 0; i < 5; i++) {
      if (!candidates[i].title || !candidates[i].synopsis || !candidates[i].file) {
        return alert(`Preencha todos os campos do Filme ${i + 1} (incluindo a imagem).`);
      }
    }

    setIsPublishing(true);
    try {
      // 1. Upload all images
      const uploadedCandidates = await Promise.all(
        candidates.map(async (c) => {
          const url = await uploadCoverToR2(c.file!);
          return { title: c.title, synopsis: c.synopsis, cover_url: url };
        })
      );

      // 2. Create Poll
      const { data: pollData, error: pollError } = await supabase
        .from('movie_polls')
        .insert({ title: pollTitle, is_active: true })
        .select('id')
        .single();
        
      if (pollError) throw pollError;

      // 3. Create Candidates
      const candidatesToInsert = uploadedCandidates.map(c => ({
        poll_id: pollData.id,
        title: c.title,
        synopsis: c.synopsis,
        cover_url: c.cover_url
      }));

      const { error: candidatesError } = await supabase
        .from('poll_candidates')
        .insert(candidatesToInsert);

      if (candidatesError) throw candidatesError;

      alert("Enquete publicada com sucesso!");
      fetchActivePoll();
    } catch (e: any) {
      console.error(e);
      alert("Erro ao publicar enquete: " + e.message);
    }
    setIsPublishing(false);
  };

  const closePollAndNotify = async () => {
    if (!activePoll || !confirm("Tem certeza que deseja encerrar a enquete? Os SMS e E-mails serão disparados (modo simulado) para todos os cadastrados!")) return;
    
    setIsClosing(true);
    try {
      const res = await fetch('/api/notify-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: activePoll.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao notificar');
      
      alert(`Enquete Encerrada! Filme vencedor: ${data.winner}\n\nNotificações disparadas (Logs no servidor) para ${data.notifiedUsers} usuários!`);
      fetchActivePoll();
    } catch(e: any) {
      alert("Erro: " + e.message);
    }
    setIsClosing(false);
  };

  if (isLoading) return <div className="p-6 text-white/50 animate-pulse">Carregando dados da Enquete...</div>;

  return (
    <div className="bg-[#051622] rounded-2xl border border-white/10 p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <Ticket className="text-[#00f0ff]" size={24} />
        Gerenciador de Enquetes e SMS
      </h2>

      {activePoll ? (
        <div className="bg-gradient-to-r from-blue-900/40 to-transparent border border-blue-500/30 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">No Ar</span>
              <h3 className="text-2xl font-bold text-white">{activePoll.title}</h3>
              <p className="text-white/60 text-sm mt-1">A página de Filmes está exibindo esta enquete agora.</p>
            </div>
            <button 
              onClick={closePollAndNotify}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all"
            >
              {isClosing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Encerrar Enquete e Disparar SMS
            </button>
          </div>

          <div className="space-y-3">
            {activePoll.poll_candidates?.sort((a:any, b:any) => b.votes_count - a.votes_count).map((c: any, i: number) => (
              <div key={c.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                <span className="text-white font-medium flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10'}`}>{i + 1}</span>
                  {c.title}
                </span>
                <span className="text-[#00f0ff] font-bold">{c.votes_count} Votos</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl">
            Nenhuma enquete ativa. Crie uma nova para a semana. O resultado sempre sai na Quinta-feira à noite!
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Título da Enquete</label>
              <input type="text" value={pollTitle} onChange={e => setPollTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00f0ff] transition-colors" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {candidates.map((c, i) => (
                <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-[#00f0ff] font-bold text-sm">Opção {i + 1}</h4>
                  
                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Capa (Poster)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleCandidateChange(i, 'file', e.target.files?.[0] || null)}
                      className="w-full text-xs text-white/60 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Nome do Filme</label>
                    <input type="text" value={c.title} onChange={e => handleCandidateChange(i, 'title', e.target.value)} className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-white text-xs" />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Sinopse Curta</label>
                    <textarea value={c.synopsis} onChange={e => handleCandidateChange(i, 'synopsis', e.target.value)} className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-white text-xs h-16 resize-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={createPoll}
                disabled={isPublishing}
                className="bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#051622] px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                {isPublishing ? 'Fazendo Upload das Capas e Publicando...' : 'Publicar Enquete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
