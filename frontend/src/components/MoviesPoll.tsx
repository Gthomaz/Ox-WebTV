'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { CheckCircle2, Ticket, Users, TrendingUp } from 'lucide-react';

interface Candidate {
  id: number;
  title: string;
  synopsis: string;
  cover_url: string;
  votes_count: number;
}

interface Poll {
  id: number;
  title: string;
  is_active: boolean;
  candidates: Candidate[];
}

export function MoviesPoll() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Registration Form
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check local storage for previous votes
    const savedEmail = localStorage.getItem('oxtv_voter_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
    fetchActivePoll();
    setupRealtime();
  }, []);

  const fetchActivePoll = async () => {
    // Buscar enquete ativa
    const { data: pollData } = await supabase
      .from('movie_polls')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (pollData) {
      // Buscar candidatos dessa enquete
      const { data: candidatesData } = await supabase
        .from('poll_candidates')
        .select('*')
        .eq('poll_id', pollData.id)
        .order('id', { ascending: true });

      setPoll({
        id: pollData.id,
        title: pollData.title,
        is_active: pollData.is_active,
        candidates: candidatesData || []
      });
      
      // Checar se o usuário atual já votou nesta enquete no DB
      const savedEmail = localStorage.getItem('oxtv_voter_email');
      if (savedEmail) {
        const { data: voteInfo } = await supabase
          .from('poll_votes')
          .select('id')
          .eq('poll_id', pollData.id)
          .eq('user_email', savedEmail)
          .single();
          
        if (voteInfo) {
          setHasVoted(true);
        } else {
          setHasVoted(false); // Nova enquete!
        }
      }
    }
  };

  const setupRealtime = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    
    // Ouvir atualizações de votos na tabela de candidatos
    const channel = supabase
      .channel('poll_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'poll_candidates' }, (payload) => {
        setPoll((prev) => {
          if (!prev) return prev;
          const updatedCandidates = prev.candidates.map(c => 
            c.id === payload.new.id ? { ...c, votes_count: payload.new.votes_count } : c
          );
          return { ...prev, candidates: updatedCandidates };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVoteClick = (candidateId: number) => {
    if (hasVoted) return;
    setSelectedCandidate(candidateId);
    
    const savedEmail = localStorage.getItem('oxtv_voter_email');
    if (!savedEmail) {
      setShowRegForm(true);
    } else {
      submitVote(candidateId, savedEmail);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName || !selectedCandidate || !poll) return;
    
    setIsSubmitting(true);
    
    // Salvar perfil
    await supabase.from('user_profiles').upsert({
      email: regEmail,
      name: regName,
      phone: regPhone
    });
    
    localStorage.setItem('oxtv_voter_email', regEmail);
    localStorage.setItem('oxtv_voter_name', regName);
    setUserEmail(regEmail);
    
    await submitVote(selectedCandidate, regEmail);
    setShowRegForm(false);
    setIsSubmitting(false);
  };

  const submitVote = async (candidateId: number, email: string) => {
    if (!poll) return;
    
    // Registrar Voto
    const { error } = await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      candidate_id: candidateId,
      user_email: email
    });
    
    if (!error) {
      setHasVoted(true);
      
      const candidate = poll.candidates.find(c => c.id === candidateId);
      if (candidate) {
        await supabase.from('poll_candidates')
          .update({ votes_count: candidate.votes_count + 1 })
          .eq('id', candidateId);
      }
    } else {
      if (error.code === '23505') { // Unique violation
        setHasVoted(true);
      }
    }
  };

  if (!poll) return null;

  const totalVotes = poll.candidates.reduce((sum, c) => sum + c.votes_count, 0);

  return (
    <div className="w-full bg-[#051622]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8 mt-12 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Ticket className="text-[#00f0ff]" />
            Enquete da Semana
          </h2>
          <p className="text-[#00f0ff] font-medium mt-1">{poll.title}</p>
        </div>
        <div className="flex items-center gap-2 bg-[#00f0ff]/10 text-[#00f0ff] px-4 py-2 rounded-full border border-[#00f0ff]/20">
          <TrendingUp size={18} />
          <span className="font-bold">{totalVotes} Votos</span>
        </div>
      </div>

      {showRegForm && !hasVoted ? (
        <div className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8 animate-in fade-in">
          <h3 className="text-lg font-bold text-white mb-2">Quase lá! Crie seu perfil para votar</h3>
          <p className="text-sm text-white/60 mb-6">Nós avisaremos você por E-mail e SMS assim que o filme vencedor for decidido!</p>
          <form onSubmit={handleRegistrationSubmit} className="space-y-4 max-w-md">
            <input required type="text" placeholder="Seu Nome" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white" />
            <input required type="email" placeholder="Seu E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white" />
            <input required type="tel" placeholder="Seu Celular (Ex: 21999999999)" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white" />
            <div className="flex gap-4 mt-6">
              <button type="button" onClick={() => setShowRegForm(false)} className="px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#051622] font-bold px-6 py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                {isSubmitting ? 'Registrando...' : 'Confirmar Voto'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Lado Esquerdo: Lista de Filmes (Vertical) */}
          <div className="lg:col-span-7 space-y-4">
            {poll.candidates.map((candidate) => (
              <div key={candidate.id} className={`flex flex-col sm:flex-row gap-4 bg-black/30 p-3 rounded-xl border transition-all ${selectedCandidate === candidate.id ? 'border-[#00f0ff] bg-[#00f0ff]/5' : 'border-white/5 hover:border-white/20'}`}>
                <div className="w-full sm:w-24 h-36 relative rounded-lg overflow-hidden shrink-0">
                  <Image src={candidate.cover_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200"} alt={candidate.title} fill sizes="100px" className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{candidate.title}</h3>
                    <p className="text-xs text-white/50 line-clamp-3">{candidate.synopsis}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-white/40 font-mono flex items-center gap-1">
                      <Users size={14} /> {candidate.votes_count} votos
                    </span>
                    {!hasVoted ? (
                      <button 
                        onClick={() => handleVoteClick(candidate.id)}
                        className="bg-white/10 hover:bg-[#00f0ff] hover:text-[#051622] text-white px-6 py-2 rounded-lg text-sm font-bold transition-all"
                      >
                        Votar Neste
                      </button>
                    ) : (
                      <span className="text-[#00f0ff] font-bold text-sm bg-[#00f0ff]/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                        {selectedCandidate === candidate.id ? <><CheckCircle2 size={16} /> Seu Voto</> : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lado Direito: Resultados Ao Vivo */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 bg-black/50 p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-green-400" /> Resultados ao Vivo
              </h3>
              
              {!hasVoted ? (
                <div className="text-center py-12 px-4 border border-dashed border-white/20 rounded-xl">
                  <Users className="mx-auto text-white/20 mb-3" size={48} />
                  <p className="text-white/60">Vote em um filme ao lado para desbloquear os resultados em tempo real da comunidade.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {poll.candidates
                    .slice()
                    .sort((a, b) => b.votes_count - a.votes_count)
                    .map((c, index) => {
                      const percentage = totalVotes > 0 ? Math.round((c.votes_count / totalVotes) * 100) : 0;
                      return (
                        <div key={c.id} className="relative">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}>
                                {index + 1}
                              </span>
                              {c.title}
                            </span>
                            <span className="text-[#00f0ff] font-bold">{percentage}%</span>
                          </div>
                          <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-gradient-to-r from-green-400 to-[#00f0ff]' : 'bg-white/30'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                  })}
                  
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                      <CheckCircle2 className="mx-auto text-green-400 mb-2" size={32} />
                      <p className="text-green-400 font-bold">Voto Registrado!</p>
                      <p className="text-xs text-white/60 mt-1">Você será avisado(a) por E-mail e SMS quando a votação for encerrada!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
