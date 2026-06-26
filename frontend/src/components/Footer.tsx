import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#020b14] border-t border-white/10 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} OX TV Quissamã. Todos os direitos reservados.
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="text-white/20 hover:text-white/60 transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/5"
            title="Acesso Restrito"
          >
            <Lock size={16} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
