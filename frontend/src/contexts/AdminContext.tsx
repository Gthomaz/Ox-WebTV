'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

export interface PollData {
  id: string;
  question: string;
  options: string[];
}

export interface Movie {
  id: string;
  title: string;
  coverUrl: string;
  videoUrl: string;
}

interface AdminState {
  isAdminOpen: boolean;
  setIsAdminOpen: (val: boolean) => void;
  
  playerMode: 'live' | 'grade';
  setPlayerMode: (val: 'live' | 'grade') => void;
  
  liveStreamUrl: string;
  setLiveStreamUrl: (val: string) => void;
  
  overlayAd: 'none' | 'banner1' | 'banner2';
  setOverlayAd: (val: 'none' | 'banner1' | 'banner2') => void;
  
  pollData: PollData | null;
  setPollData: (val: PollData | null) => void;
  
  isChatOpen: boolean;
  setIsChatOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearChat: () => void;
  
  blockedUsers: string[];
  blockUser: (user: string) => void;
  unblockUser: (user: string) => void;

  movies: Movie[];
  addMovie: (movie: Omit<Movie, 'id'>) => void;
  removeMovie: (id: string) => void;
}

const AdminContext = createContext<AdminState | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [playerMode, setPlayerMode] = useState<'live' | 'grade'>('live');
  const [liveStreamUrl, setLiveStreamUrl] = useState('https://live.oxtv.com/stream.m3u8');
  const [overlayAd, setOverlayAd] = useState<'none' | 'banner1' | 'banner2'>('none');
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  const [movies, setMovies] = useState<Movie[]>([
    { id: '1', title: 'O Último Suspiro', coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400&h=600', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { id: '2', title: 'A Jornada Estelar', coverUrl: 'https://images.unsplash.com/photo-1618519764620-7403abdbdf9a?auto=format&fit=crop&q=80&w=400&h=600', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { id: '3', title: 'Mistérios de Quissamã', coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400&h=600', videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ]);

  const clearChat = () => setChatMessages([]);
  
  const blockUser = (user: string) => {
    if (!blockedUsers.includes(user)) {
      setBlockedUsers(prev => [...prev, user]);
    }
  };
  
  const unblockUser = (user: string) => {
    setBlockedUsers(prev => prev.filter(u => u !== user));
  };

  const addMovie = (movie: Omit<Movie, 'id'>) => {
    setMovies(prev => [...prev, { ...movie, id: Date.now().toString() }]);
  };

  const removeMovie = (id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AdminContext.Provider value={{
      isAdminOpen, setIsAdminOpen,
      playerMode, setPlayerMode,
      liveStreamUrl, setLiveStreamUrl,
      overlayAd, setOverlayAd,
      pollData, setPollData,
      isChatOpen, setIsChatOpen,
      chatMessages, setChatMessages, clearChat,
      blockedUsers, blockUser, unblockUser,
      movies, addMovie, removeMovie
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
