'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, UserCircle2, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  id: number;
  nickname: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

export function LiveChat({ isActive, mode = 'overlay' }: { isActive: boolean, mode?: 'overlay' | 'embed' }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) setMessages(data.reverse());
    };

    fetchMessages();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const channel = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, () => {
          // If a message is deleted (like clearing chat), we can just refetch
          fetchMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isActive]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length > 2) {
      setIsJoined(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isJoined) return;

    const msg = newMessage.trim();
    setNewMessage(''); // optimistic clear

    await supabase.from('chat_messages').insert([{
      nickname: nickname,
      message: msg,
      is_admin: nickname.toLowerCase() === 'admin' || nickname.toLowerCase() === 'guibson'
    }]);
  };

  if (!isActive) return null;

  const containerClasses = mode === 'overlay' 
    ? "absolute top-4 right-4 bottom-24 w-72 sm:w-80 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-40 transition-all duration-300"
    : "relative w-full h-[600px] bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl mt-4";

  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className="bg-[#051622]/90 border-b border-white/10 p-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Chat ao Vivo
        </h3>
        <span className="text-xs text-white/40">{messages.length} msg</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          <p className="text-white/30 text-xs text-center mt-4">Nenhuma mensagem ainda. Seja o primeiro!</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="animate-fade-in-up">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-bold ${msg.is_admin ? 'text-red-400' : 'text-[#00f0ff]'}`}>
                  {msg.is_admin && <ShieldAlert size={10} className="inline mr-1" />}
                  {msg.nickname}
                </span>
                <span className="text-[10px] text-white/30">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-white/90 break-words leading-tight mt-0.5 bg-white/5 rounded-r-lg rounded-bl-lg px-3 py-2 inline-block">
                {msg.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#020b14]/90 border-t border-white/10">
        {!isJoined ? (
          <form onSubmit={handleJoin} className="flex gap-2">
            <div className="relative flex-1">
              <UserCircle2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Seu apelido..." 
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={15}
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                required
              />
            </div>
            <button type="submit" className="bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white px-3 rounded-lg text-sm font-bold transition-colors">
              Entrar
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Sua mensagem..." 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              maxLength={100}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-[#00f0ff]/20 hover:bg-[#00f0ff] text-[#00f0ff] hover:text-[#051622] p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
