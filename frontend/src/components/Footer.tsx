import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#051622] shrink-0 border-t border-white/10 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center relative min-h-[32px]">
        <div className="text-white/60 text-sm text-center">
          &copy; {new Date().getFullYear()} OX TV Quissamã. Todos os direitos reservados.
        </div>
        <div className="absolute right-4 flex items-center">
          <Link 
            href="/admin/login" 
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
