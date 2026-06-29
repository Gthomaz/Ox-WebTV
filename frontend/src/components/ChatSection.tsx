'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LiveChat } from './LiveChat';
import { MessageSquareText } from 'lucide-react';

export function ChatSection() {
  const [isChatActive, setIsChatActive] = useState(false);

  useEffect(() => {
    const fetchControl = async () => {
      const { data } = await supabase.from('broadcast_control').select('chat_active').single();
      if (data) setIsChatActive(data.chat_active);
    };

    fetchControl();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const channel = supabase
        .channel('chat-section-status')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_control' }, (payload) => {
          const newData = payload.new as any;
          if (newData && typeof newData.chat_active !== 'undefined') {
            setIsChatActive(newData.chat_active);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  if (!isChatActive) return null;

  return (
    <div id="chat" className="w-full flex flex-col items-center mt-12 mb-8 animate-fade-in scroll-mt-24">
      <div className="w-full text-center space-y-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
          <MessageSquareText className="text-[#00f0ff]" size={32} />
          Bate-Papo ao Vivo
        </h2>
        <p className="text-white/60 font-light">
          Participe da transmissão, mande suas perguntas e interaja com os apresentadores!
        </p>
      </div>
      <div className="w-full max-w-5xl mx-auto">
        <LiveChat isActive={true} mode="embed" />
      </div>
    </div>
  );
}
