'use client';

import React, { useState } from 'react';
import { Lock, Upload, FileVideo, CheckCircle } from 'lucide-react';

export default function AdminUploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{success: boolean; message: string} | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciais incorretas');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      setStatus(data);
      if (data.success) {
        setFile(null);
      }
    } catch (err) {
      setStatus({ success: false, message: 'Erro na conexão com o servidor' });
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center pt-20">
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center pt-20 px-4 pb-12">
      <div className="bg-[#051622] p-8 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Upload className="text-[#00f0ff]" /> Upload de Vídeos
        </h2>
        <p className="text-white/50 text-sm mb-6">
          Os arquivos enviados aqui serão salvos na pasta <code>public/videos</code>. Depois de carregados, você poderá usá-los na grade de programação através do caminho: <code>/videos/nome-do-arquivo.mp4</code>.
          <br/><br/>
          <strong className="text-yellow-400">Aviso Vercel:</strong> Em hospedagens serverless (como a Vercel), os arquivos são deletados entre os deploys. Para VOD definitivo, recomenda-se hospedar os vídeos em um CDN (ex: S3, Mux, Cloudflare) e apenas cadastrar a URL. O upload funciona melhor em hospedagem VPS própria.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#00f0ff]/50 transition-colors">
            <input 
              type="file" 
              accept="video/*" 
              id="video-upload"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <FileVideo size={48} className={file ? "text-[#00f0ff]" : "text-white/20"} />
              <span className="text-white font-medium break-all">
                {file ? file.name : "Clique para selecionar um vídeo (MP4)"}
              </span>
            </label>
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {status.success && <CheckCircle size={16} />}
              {status.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!file || uploading}
            className="w-full bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] disabled:opacity-50 disabled:hover:bg-[#0e4b77] disabled:hover:text-white text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Enviando arquivo...
              </>
            ) : (
              'Iniciar Upload'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
