'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, MapPin, Phone, Mail, Image as ImageIcon, Calendar as CalendarIcon, X, CheckCircle, AlertTriangle, Trash2, LayoutGrid, Video, ListTodo, BarChart3 } from 'lucide-react';

const STATUSES = ["Pendente", "Em Averiguação", "Em Solução", "Resolvido"];

export default function DenunciasDepartment() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  // Estados para o modal de transição (Drop)
  const [pendingDrop, setPendingDrop] = useState<{ reportId: number, newStatus: string } | null>(null);
  const [dropObservation, setDropObservation] = useState('');

  // Estados do QG
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar'>('kanban');
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string, observation?: string) => {
    try {
      // Se houver uma observação, salva a anotação primeiro
      if (observation) {
        await fetch(`/api/reports/${id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: `[Movimentado para ${newStatus}]\n${observation}`, userId: 1 })
        });
      }

      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchReports();
        if (selectedReport?.id === id) {
          setSelectedReport(prev => ({ ...prev, status: newStatus }));
          if (observation) openNotes({ ...selectedReport, status: newStatus }); // Atualiza anotações na mesa
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta denúncia definitivamente? Esta ação não pode ser desfeita.")) return;
    
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const openNotes = async (report: any) => {
    setSelectedReport(report);
    try {
      const res = await fetch(`/api/reports/${report.id}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedReport) return;
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, userId: 1 })
      });
      if (res.ok) {
        const note = await res.json();
        setNotes([note, ...notes]);
        setNewNote('');
      }
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, reportId: number) => {
    e.dataTransfer.setData('reportId', reportId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const reportId = parseInt(e.dataTransfer.getData('reportId'));
    if (!isNaN(reportId)) {
      // Verifica o status atual
      const report = reports.find(r => r.id === reportId);
      if (report && report.status !== newStatus) {
        // Exige anotação ao invés de atualizar instantaneamente
        setPendingDrop({ reportId, newStatus });
      }
    }
  };

  const confirmDrop = async () => {
    if (pendingDrop && dropObservation.trim()) {
      await updateStatus(pendingDrop.reportId, pendingDrop.newStatus, dropObservation);
      setPendingDrop(null);
      setDropObservation('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 text-gray-900 min-h-screen relative">
      <div className="flex flex-col gap-6 mb-8">
        
        {/* CABEÇALHO DO QG */}
        <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0D3B66] flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              QG de Fiscalização
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Controle Total de Denúncias da Cidade</p>
          </div>
          
          <div className="flex gap-4">
            <a 
              href="/denuncias" 
              target="_blank"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition-colors flex items-center shadow-sm"
            >
              Ver Portal Público
            </a>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Total Recebido</p>
              <h3 className="text-2xl font-black text-gray-800">{reports.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ListTodo size={24} /></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Aguardando (Pendentes)</p>
              <h3 className="text-2xl font-black text-orange-500">{reports.filter(r => r.status === 'Pendente').length}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-500 rounded-lg"><AlertTriangle size={24} /></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Em Andamento</p>
              <h3 className="text-2xl font-black text-blue-500">{reports.filter(r => r.status === 'Em Averiguação' || r.status === 'Em Solução').length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-lg"><Loader2 size={24} /></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Resolvidas</p>
              <h3 className="text-2xl font-black text-green-500">{reports.filter(r => r.status === 'Resolvido').length}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-500 rounded-lg"><CheckCircle size={24} /></div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-2 border-b border-gray-300 pb-2">
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-all flex items-center gap-2 ${activeTab === 'kanban' ? 'bg-[#0D3B66] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <LayoutGrid size={18} /> Board Interativo (Kanban)
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-[#0D3B66] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <CalendarIcon size={18} /> Calendário de Ocorrências
          </button>
        </div>
      </div>
      
      {/* MODAL DE OBSERVAÇÃO OBRIGATÓRIA NO DROP */}
      {pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0D3B66] p-4 text-white">
              <h2 className="text-xl font-bold">Parecer Obrigatório</h2>
              <p className="text-sm text-blue-200">Justifique a movimentação para "{pendingDrop.newStatus}"</p>
            </div>
            <div className="p-6">
              <textarea 
                autoFocus
                placeholder="Ex: Equipe enviada ao local para averiguação inicial..." 
                value={dropObservation}
                onChange={e => setDropObservation(e.target.value)}
                className="w-full mb-4 p-4 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent outline-none resize-none min-h-[120px]"
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setPendingDrop(null); setDropObservation(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDrop}
                  disabled={!dropObservation.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar e Mover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-8 pt-4">
          {STATUSES.map(status => (
            <div 
              key={status} 
              className="bg-gray-200/60 rounded-xl p-4 shadow-inner min-h-[400px] min-w-[280px] border border-gray-300"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b-2 border-gray-300 flex justify-between items-center">
                {status} 
                <span className="bg-[#0D3B66] text-white text-xs px-2 py-1 rounded-full">
                  {reports.filter(r => r.status === status).length}
                </span>
              </h3>
              
              <div className="space-y-4">
                {reports.filter(r => r.status === status).map(report => (
                  <div 
                    key={report.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, report.id)}
                    onClick={() => openNotes(report)}
                    className={`cursor-pointer hover:border-blue-500 border-2 transition-all shadow-md bg-white rounded-xl overflow-hidden
                      ${selectedReport?.id === report.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                  >
                    {report.report_media && report.report_media.length > 0 && (
                      <div className="h-32 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {report.report_media[0].media_type === 'image' ? (
                          <img src={report.report_media[0].media_url} alt="Denúncia" className="w-full h-full object-cover" />
                        ) : report.report_media[0].media_type === 'video' ? (
                          <div className="w-full h-full bg-black flex items-center justify-center relative">
                            <video src={report.report_media[0].media_url} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">Vídeo</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <div className="p-4 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded block w-max">
                          {report.protocol_number || `ID-${report.id}`}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Impede de abrir a Mesa de Trabalho
                            deleteReport(report.id);
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Excluir Denúncia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{report.title}</h4>
                    </div>
                    <div className="p-4 pt-0">
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{report.description}</p>
                      {report.location_address && (
                        <p className="text-xs text-gray-400 flex items-start gap-1 mt-2 line-clamp-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {report.location_address}
                        </p>
                      )}
                      
                      {report.report_notes && report.report_notes.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Anotações Anteriores:</p>
                          {report.report_notes.map((note: any) => (
                            <div key={note.id} className="bg-yellow-50/80 p-2 rounded border border-yellow-200 shadow-sm relative">
                              <p className="text-[11px] text-gray-800 leading-tight whitespace-pre-wrap">{note.note}</p>
                              <span className="text-[9px] text-gray-400 mt-1 block text-right font-mono">
                                {new Date(note.created_at).toLocaleDateString('pt-BR')} {new Date(note.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR BOARD */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4 min-h-[500px]">
          <h2 className="text-xl font-bold text-[#0D3B66] mb-6 flex items-center gap-2">
            <CalendarIcon /> Histórico de Entrada de Denúncias
          </h2>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Nenhuma denúncia registrada.</p>
            ) : (
              // Agrupando reports por dia (apenas para exibição simples no calendário)
              Array.from(new Set(reports.map(r => new Date(r.created_at).toLocaleDateString('pt-BR'))))
                .sort((a, b) => {
                  const [da, ma, ya] = a.split('/');
                  const [db, mb, yb] = b.split('/');
                  return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
                })
                .map(date => {
                  const reportsOnDate = reports.filter(r => new Date(r.created_at).toLocaleDateString('pt-BR') === date);
                  return (
                    <div key={date} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center">
                        <span>{date}</span>
                        <span className="bg-[#0D3B66] text-white text-xs px-2 py-1 rounded-full">{reportsOnDate.length} denúncias</span>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {reportsOnDate.map(report => (
                          <div 
                            key={report.id} 
                            onClick={() => openNotes(report)}
                            className="bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            <span className="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded block w-max mb-2">
                              {report.protocol_number || `ID-${report.id}`}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{report.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              report.status === 'Resolvido' ? 'bg-green-100 text-green-700' :
                              report.status === 'Pendente' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* MESA DE TRABALHO (WORKSPACE INFERIOR) */}
      {selectedReport && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-4 animate-in slide-in-from-bottom-8">
          <div className="bg-[#0D3B66] p-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mesa de Trabalho - Detalhes do Caso
            </h2>
            <button 
              onClick={() => setSelectedReport(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna 1: Dados da Denúncia */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Protocolo: {selectedReport.protocol_number || `ID-${selectedReport.id}`}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      Status: {selectedReport.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mídia em Tamanho Real na Mesa */}
              {selectedReport.report_media && selectedReport.report_media.length > 0 && (
                <div className="w-full bg-black rounded-xl overflow-hidden shadow-sm h-96 flex items-center justify-center">
                  {selectedReport.report_media[0].media_type === 'image' ? (
                    <img 
                      src={selectedReport.report_media[0].media_url} 
                      alt="Mídia da denúncia" 
                      className="w-full h-full object-contain" 
                    />
                  ) : selectedReport.report_media[0].media_type === 'video' ? (
                    <video 
                      src={selectedReport.report_media[0].media_url} 
                      controls 
                      className="w-full h-full object-contain" 
                    />
                  ) : null}
                </div>
              )}

              {/* Tabela de Informações */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <th className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold w-1/3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Data do Registro
                      </th>
                      <td className="px-4 py-3">{new Date(selectedReport.created_at).toLocaleString('pt-BR')}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Endereço
                      </th>
                      <td className="px-4 py-3">{selectedReport.location_address || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Telefone
                      </th>
                      <td className="px-4 py-3">{selectedReport.phone || 'Não informado'}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" /> E-mail
                      </th>
                      <td className="px-4 py-3">{selectedReport.email || 'Não informado'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Descrição Completa:</h4>
                <p className="text-gray-600 whitespace-pre-wrap bg-white p-4 rounded-xl border border-gray-200 leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setPendingDrop({ reportId: selectedReport.id, newStatus: "Resolvido" })}
                  className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Marcar Resolvido
                </button>
                <button 
                  onClick={() => setPendingDrop({ reportId: selectedReport.id, newStatus: "Pendente" })}
                  className="flex-1 min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" /> Marcar Pendente
                </button>
                <button 
                  onClick={() => deleteReport(selectedReport.id)}
                  className="flex-none bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  title="Excluir Denúncia"
                >
                  <Trash2 className="w-5 h-5" /> Excluir
                </button>
              </div>
            </div>

            {/* Coluna 2: Anotações do Helder (Histórico) */}
            <div className="col-span-1 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col h-full min-h-[600px]">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0D3B66]" /> 
                Histórico de Averiguação
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {notes.map(note => (
                  <div key={note.id} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm relative">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
                    <span className="text-[10px] text-gray-500 mt-2 block text-right font-mono">
                      {new Date(note.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm text-center">Nenhum parecer emitido ainda.<br/>Mova o cartão para iniciar.</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200 mt-auto">
                <textarea 
                  placeholder="Escreva uma anotação avulsa..." 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full mb-3 p-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent outline-none resize-none bg-white shadow-inner"
                  rows={3}
                />
                <button 
                  onClick={addNote} 
                  className="w-full bg-[#0D3B66] hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md"
                >
                  Adicionar Anotação Extra
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
