'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { validateCPF, formatCPF } from '@/lib/cpf';
import Link from 'next/link';

interface AuthFormProps {
  type: 'login' | 'register';
}

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Only for register
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length <= 11) {
      setCpf(formatCPF(raw));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (type === 'register') {
      const rawCpf = cpf.replace(/[^\d]/g, '');
      if (!validateCPF(rawCpf)) {
        setError('CPF inválido. Por favor, verifique os números digitados.');
        setLoading(false);
        return;
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            cpf: rawCpf,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Conta criada com sucesso! Verifique sua caixa de e-mail para confirmar o cadastro (caso necessário) ou faça login.');
      }
      
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('E-mail ou senha inválidos.');
      } else {
        router.push('/');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto relative group z-10">
      {/* Decorative Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00f0ff] to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-[#051622]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {type === 'login' ? 'Bem-vindo de volta' : 'Criar Conta'}
          </h2>
          <p className="text-white/50 text-sm">
            {type === 'login' 
              ? 'Entre para acessar a grade completa e interagir.' 
              : 'Junte-se à maior plataforma de TV Digital do planeta.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-sm text-emerald-200 leading-relaxed">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                    placeholder="João da Silva"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">CPF</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    required
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-11 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative group/btn overflow-hidden rounded-xl p-[1px] mt-4"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] to-blue-600 rounded-xl opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
            <div className="relative flex items-center justify-center gap-2 bg-black/50 backdrop-blur-sm px-6 py-3.5 rounded-xl transition-all duration-300 group-hover/btn:bg-transparent">
              {loading ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <>
                  <span className="font-bold text-white tracking-wide">{type === 'login' ? 'Entrar na OXTV' : 'Criar minha conta'}</span>
                  <ArrowRight className="text-white opacity-70 group-hover/btn:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </div>
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/50 border-t border-white/5 pt-6">
          {type === 'login' ? (
            <p>
              Ainda não tem conta?{' '}
              <Link href="/register" className="text-[#00f0ff] font-semibold hover:underline">
                Cadastre-se grátis
              </Link>
            </p>
          ) : (
            <p>
              Já possui uma conta?{' '}
              <Link href="/login" className="text-[#00f0ff] font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
