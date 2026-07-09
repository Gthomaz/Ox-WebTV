'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, UploadCloud, FileVideo, CheckCircle, AlertCircle, PlaySquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/Ox-Tv-Logo-Transparent.png';

export default function UploadsPage() {
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [category, setCategory] = useState('Podcast');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const cookies = document.cookie;
    if (!cookies.includes('ox_admin_auth=true')) {
      router.push('/admin/login');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorMsg('');
      setSuccess(false);
      extractVideoDuration(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.includes('video/')) {
        setFile(droppedFile);
        setErrorMsg('');
        setSuccess(false);
        extractVideoDuration(droppedFile);
      } else {
        setErrorMsg('Por favor, envie apenas arquivos de vídeo (ex: .mp4)');
      }
    }
  };

  const extractVideoDuration = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      // duration in seconds, convert to minutes and round up
      const durationMinutes = Math.ceil(video.duration / 60);
      setDuration(durationMinutes);
    };
    
    video.src = URL.createObjectURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Por favor, selecione um arquivo primeiro.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Por favor, insira um título para o vídeo.');
      return;
    }

    setUploading(true);
    setProgress(10);
    setErrorMsg('');
    setSuccess(false);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `podcasts/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);

      setProgress(80);

      // 3. Save to database (filmes)
      const { error: dbError } = await supabase.from('filmes').insert([
        {
          title: title,
          video_url: publicUrl,
          duration_seconds: duration * 60, // Convert minutes to seconds
          cover_url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=1000', // Default cover for now
          category: category,
        }
      ]);

      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);
      setFile(null);
      setTitle('');
      setDuration(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Ocorreu um erro durante o upload. Verifique as permissões do bucket (Storage).');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020b14] flex flex-col">
      {/* Navbar */}
      <header className="bg-[#051622] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1000px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src={Logo} alt="OXTV" width={100} height={40} className="object-contain" />
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <UploadCloud size={20} className="text-[#00f0ff]" />
              Gerenciador VOD & Uploads
            </h1>
          </div>
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-[#00f0ff] hover:text-white transition-colors text-sm font-semibold">
            <LayoutDashboard size={16} /> Voltar ao Painel
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-6 py-12">
        
        <div className="bg-[#051622] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#0e4b77]"></div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Subir Novo Vídeo</h2>
          <p className="text-white/60 text-sm mb-8">Faça o upload do seu Podcast ou Filme. Ele ficará disponível imediatamente no Catálogo e na Grade Diária.</p>

          {success && (
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle className="text-green-400" size={32} />
              <div>
                <h4 className="text-green-400 font-bold">Upload Concluído com Sucesso!</h4>
                <p className="text-green-400/80 text-sm">O vídeo já está no seu banco de dados pronto para ser usado.</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4 animate-in fade-in">
              <AlertCircle className="text-red-400" size={32} />
              <p className="text-red-400 font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-white/80 text-sm font-bold mb-2">Gênero / Categoria</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all appearance-none"
                  required
                >
                  <option value="Podcast">Podcast</option>
                  <option value="Filme">Filme</option>
                  <option value="Série">Série</option>
                  <option value="Documentário">Documentário</option>
                  <option value="Esportes">Esportes</option>
                  <option value="Jornalismo">Jornalismo</option>
                  <option value="Musical">Musical</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-white/80 text-sm font-bold mb-2">Título do Vídeo</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: OX Podcast #01"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-white/80 text-sm font-bold mb-2">Duração (Minutos)</label>
                <input 
                  type="number" 
                  value={duration || ''}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 120"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                  required
                />
              </div>
            </div>

            {/* Dropzone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#00f0ff]/30 rounded-2xl p-12 text-center hover:bg-[#00f0ff]/5 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-[#00f0ff]/20 p-4 rounded-full">
                    <PlaySquare className="text-[#00f0ff]" size={48} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{file.name}</p>
                    <p className="text-white/50 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-red-400 text-sm hover:underline mt-2"
                  >
                    Trocar arquivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white/5 p-6 rounded-full group-hover:scale-110 transition-transform">
                    <FileVideo className="text-white/40" size={48} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Clique aqui para procurar no computador</p>
                    <p className="text-white/50 text-sm mt-1 mb-4">ou arraste o vídeo para esta área (Formato: MP4)</p>
                    <button 
                      type="button"
                      className="bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] text-white px-6 py-2 rounded-lg font-bold transition-all inline-block pointer-events-none"
                    >
                      Procurar Arquivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Enviando vídeo...</span>
                  <span className="text-[#00f0ff] font-bold">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00f0ff] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={uploading || !file}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                uploading || !file 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                  : 'bg-[#00f0ff] text-[#051622] hover:bg-[#00d0dd] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.01]'
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#051622]"></div>
                  Processando...
                </>
              ) : (
                <>
                  <UploadCloud size={24} />
                  Fazer Upload e Salvar
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
