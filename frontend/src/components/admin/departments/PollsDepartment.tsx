'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Calendar, Play, Loader2, BarChart2 } from 'lucide-react';

export default function PollsDepartment() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase.from('scheduled_polls').select('*').order('start_time', { ascending: true });
      if (error) throw error;
      setPolls(data || []);
    } catch (e: any) {
      console.warn("Tabela scheduled_polls pode não existir ainda. Execute o SQL de criação.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length >= 4) return alert("Máximo de 4 opções.");
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!question || options.some(o => !o) || !startTime || !endTime) {
      return alert("Preencha todos os campos e certifique-se de que não há opções vazias.");
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('scheduled_polls').insert({
        question,
        options: JSON.stringify(options),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      if (error) throw error;
      
      alert("Enquete agendada com sucesso!");
      setQuestion('');
      setOptions(['', '']);
      setStartTime('');
      setEndTime('');
      fetchPolls();
    } catch (e: any) {
      alert("Erro ao salvar enquete. Certifique-se de ter criado a tabela no Supabase.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir esta enquete agendada?")) return;
    await supabase.from('scheduled_polls').delete().eq('id', id);
    fetchPolls();
  };
  
  const forcePushPoll = async (poll: any) => {
    if (!confirm(`Deseja empurrar a enquete "${poll.question}" IMEDIATAMENTE para a tela (ignorando o horário)?`)) return;
    
    try {
      await supabase.from('broadcast_control').update({
        active_poll_question: poll.question,
        active_poll_options: poll.options
      }).eq('id', 1);
      alert("Enquete ativada manualmente! Ela já está aparecendo no player.");
    } catch (e) {
      console.error(e);
      alert("Erro ao empurrar enquete.");
    }
  };
  
  const clearCurrentPoll = async () => {
    if (!confirm("Remover qualquer enquete ativa da tela agora?")) return;
    await supabase.from('broadcast_control').update({
      active_poll_question: '',
      active_poll_options: null
    }).eq('id', 1);
    alert("Enquete removida da tela!");
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00f0ff]" /></div>;

  return (
    <div className="h-full p-6 bg-[#020b14] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-[#051622] rounded-2xl border border-white/10 p-6 shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="text-[#00f0ff]" /> Central de Enquetes Interativas
            </h1>
            <p className="text-white/50 text-sm mt-1">Crie e agende enquetes para aparecerem no Player durante sua programação.</p>
          </div>
          <button 
            onClick={clearCurrentPoll}
            className="bg-red-900/50 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors font-semibold border border-red-500/30 text-sm"
          >
            Forçar Remoção da Tela
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulário de Criação */}
          <div className="lg:col-span-1 bg-[#051622] rounded-2xl border border-white/10 p-6 shadow-xl h-max">
            <h2 className="text-lg font-bold text-white mb-4">Nova Enquete</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase">Pergunta</label>
                <textarea 
                  value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Qual seu artista favorito?"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00f0ff] outline-none mt-1 resize-none h-20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 uppercase flex justify-between">
                  Opções de Resposta
                  {options.length < 4 && (
                    <button onClick={handleAddOption} className="text-[#00f0ff] hover:text-white">+ Adicionar</button>
                  )}
                </label>
                <div className="space-y-2 mt-1">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        value={opt} onChange={e => handleOptionChange(i, e.target.value)}
                        placeholder={`Opção ${i + 1}`}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-[#00f0ff] outline-none"
                      />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-white/5 rounded-lg"><X size={16}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 uppercase">Início (Entra no ar)</label>
                  <input 
                    type="datetime-local" 
                    value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-white text-xs focus:border-[#00f0ff] outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/70 uppercase">Fim (Sai do ar)</label>
                  <input 
                    type="datetime-local" 
                    value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-white text-xs focus:border-[#00f0ff] outline-none mt-1"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave} disabled={isSaving}
                className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white font-bold py-3 rounded-xl transition-all mt-4"
              >
                {isSaving ? 'Salvando...' : 'Agendar Enquete'}
              </button>
            </div>
          </div>

          {/* Lista de Enquetes Agendadas */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="text-[#00f0ff]" /> Próximas Enquetes
            </h2>
            
            {polls.length === 0 ? (
              <div className="bg-[#051622] rounded-2xl border border-white/10 p-10 text-center text-white/50">
                Nenhuma enquete agendada. Crie uma ao lado!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {polls.map(poll => (
                  <div key={poll.id} className="bg-[#051622] rounded-2xl border border-white/10 p-5 shadow-xl relative group hover:border-[#00f0ff]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white text-lg">{poll.question}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => forcePushPoll(poll)}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1 font-bold shadow-lg"
                          title="Forçar ativação IMEDIATA na tela"
                        >
                          <Play size={12} fill="currentColor" /> Ativar Agora
                        </button>
                        <button 
                          onClick={() => handleDelete(poll.id)}
                          className="bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {JSON.parse(poll.options).map((opt: string, i: number) => (
                        <span key={i} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-white/80">
                          {opt}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-6 border-t border-white/5 pt-3">
                      <div className="text-xs text-white/50">
                        <span className="font-bold uppercase block mb-1">Início:</span>
                        <span className="text-[#00f0ff]">{new Date(poll.start_time).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        <span className="font-bold uppercase block mb-1">Fim:</span>
                        <span className="text-yellow-400">{new Date(poll.end_time).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
