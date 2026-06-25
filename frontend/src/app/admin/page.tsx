'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      alert('Login efetuado com sucesso!');
    } else {
      alert('Credenciais incorretas');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center pt-20 px-4">
      <form onSubmit={handleLogin} className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Lock className="text-[#00f0ff] mb-2" size={32} />
          <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Usuário" 
            value={user}
            onChange={e => setUser(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff]"
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff]"
          />
          <button type="submit" className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white font-bold py-3 rounded-lg transition-all">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
