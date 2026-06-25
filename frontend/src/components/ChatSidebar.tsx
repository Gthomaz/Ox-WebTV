'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Send, X, MessageSquareOff } from 'lucide-react';

export function ChatSidebar() {
  const { isChatOpen, setIsChatOpen, chatMessages, setChatMessages, blockedUsers } = useAdmin();
  const [inputText, setInputText] = useState('');
  const [username] = useState('Espectador' + Math.floor(Math.random() * 1000));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    if (blockedUsers.includes(username)) {
      alert("Você está bloqueado do chat.");
      return;
    }

    const newMsg = {
      id: Date.now().toString(),
      user: username,
      text: inputText.trim()
    };
    
    setChatMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="fixed right-0 top-20 bottom-0 w-80 bg-[#051622]/80 backdrop-blur-xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,240,255,0.05)] z-40 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h3 className="text-white font-semibold text-sm tracking-wide">Chat ao Vivo</h3>
        <button onClick={() => setIsChatOpen(false)} className="text-white/50 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 gap-2">
            <MessageSquareOff size={32} />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className="text-sm leading-relaxed">
              <span className="font-bold text-[#00f0ff] mr-2">{msg.user}:</span>
              <span className="text-white/90 break-words">{msg.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        {blockedUsers.includes(username) ? (
          <div className="text-center text-red-400 text-sm py-2 font-medium">Você foi bloqueado do chat.</div>
        ) : (
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00f0ff] hover:text-white disabled:opacity-50 disabled:hover:text-[#00f0ff] p-1 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
