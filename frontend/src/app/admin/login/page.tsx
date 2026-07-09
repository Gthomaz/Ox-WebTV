'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha hardcoded exclusiva para a diretoria, separada dos usuários comuns
    if (user === 'diretoria@oxtv.com.br' && pass === 'RedPassion@2026') {
      // Define um cookie simples de admin válido por 24h
      document.cookie = "ox_admin_auth=true; path=/; max-age=86400";
      router.push('/admin/dashboard');
    } else {
      setError('Credenciais de diretoria inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#051622] border border-red-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
          
          <div className="flex flex-col items-center mb-8">
            <Image src={Logo} alt="OXTV" width={150} height={60} className="object-contain mb-4" />
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
              <ShieldAlert size={16} />
              <span className="text-sm font-bold tracking-widest uppercase">Acesso da Diretoria</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-white/50 text-xs font-bold uppercase mb-1.5 pl-1">E-mail da Diretoria</label>
              <input 
                type="text" 
                value={user}
                onChange={e => setUser(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="Ex: diretoria@..."
              />
            </div>
            
            <div>
              <label className="block text-white/50 text-xs font-bold uppercase mb-1.5 pl-1">Senha Master</label>
              <input 
                type="password" 
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4"
            >
              <Lock size={18} className="group-hover:hidden" />
              <ArrowRight size={18} className="hidden group-hover:block" />
              Destrancar Painel Master
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
