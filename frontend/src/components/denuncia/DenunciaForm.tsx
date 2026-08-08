"use client";

import React, { useState } from 'react';
import { MapPin, Camera, Video, AlertTriangle } from 'lucide-react';

export function DenunciaForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => f.size <= 5 * 1024 * 1024); // Limite de 5MB
      
      if (validFiles.length !== selectedFiles.length) {
        setStatusMsg({ type: 'error', text: 'Algumas fotos ultrapassam o limite de 5MB e foram descartadas.' });
      }
      
      setFotos(prev => {
        const total = [...prev, ...validFiles];
        if (total.length > 5) {
          setStatusMsg({ type: 'error', text: 'Você só pode enviar até 5 fotos por denúncia.' });
        }
        return total.slice(0, 5); // Limite máximo de 5 fotos
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= 20 * 1024 * 1024) { 
        setVideo(file);
      } else {
        setStatusMsg({ type: 'error', text: 'O arquivo de vídeo excede o tamanho limite permitido (20MB).' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    
    try {
      // 1. Fazer upload de todas as mídias (fotos e vídeo)
      const mediaItems: string[] = [];
      const filesToUpload = [...fotos];
      if (video) filesToUpload.push(video);

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        
        // URL relativa pois agora roda dentro do mesmo Next.js
        const uploadRes = await fetch('/api/reports/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          if (url) mediaItems.push(url);
        } else {
          console.error("Falha ao enviar arquivo:", file.name);
        }
      }

      // 2. Enviar os dados da denúncia com as URLs
      const payload = {
        title,
        description,
        latitude,
        longitude,
        location_address: locationAddress,
        phone,
        email,
        mediaItems
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao registrar denúncia");
      }

      setStatusMsg({ type: 'success', text: 'Sua denúncia foi registrada com sucesso e está pendente de análise.' });

      // Reset form
      setTitle('');
      setDescription('');
      setLatitude(null);
      setLongitude(null);
      setLocationAddress('');
      setPhone('');
      setEmail('');
      setFotos([]);
      setVideo(null);
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: error.message || 'Não foi possível enviar a denúncia no momento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600 relative overflow-hidden">
      
      {/* Decoração visual remetendo à fiscalização */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <AlertTriangle className="w-24 h-24 text-red-600" />
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center mb-6">
          <AlertTriangle className="mr-2 h-6 w-6 text-red-600" />
          Registrar Ocorrência
        </h2>
        
        {statusMsg && (
          <div className={`p-4 mb-4 rounded-md font-semibold text-sm ${statusMsg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Denúncia</label>
            <input 
              type="text"
              placeholder="Ex: Asfalto cedendo na via principal" 
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição Detalhada</label>
            <textarea 
              placeholder="Descreva o máximo de detalhes possível sobre o ocorrido..." 
              required 
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input 
                type="text"
                placeholder="(22) 99999-9999" 
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
              <input 
                type="email"
                placeholder="seuemail@exemplo.com" 
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 flex items-center mb-3">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              Localização
            </h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                type="text"
                placeholder="Rua, Número, Bairro - Quissamã, RJ" 
                className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                value={locationAddress}
                onChange={e => setLocationAddress(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="flex-shrink-0 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-md transition-colors"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLatitude(position.coords.latitude);
                        setLongitude(position.coords.longitude);
                        setStatusMsg({ type: 'success', text: `Localização Capturada: Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}` });
                      },
                      (error) => {
                        setStatusMsg({ type: 'error', text: error.message });
                      }
                    );
                  }
                }}>
                Capturar GPS
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="block text-sm font-medium text-gray-700">Fotos da Denúncia</span>
              <span className="block text-xs text-gray-500 mt-1">Máx 5 fotos (Até 5MB cada)</span>
              
              {fotos.length > 0 && (
                <div className="mt-3 text-sm text-red-600 font-semibold bg-red-50 py-1 px-2 rounded">
                  {fotos.length} foto(s) anexada(s)
                </div>
              )}
            </div>
            
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer relative">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="block text-sm font-medium text-gray-700">Vídeo (Opcional)</span>
              <span className="block text-xs text-gray-500 mt-1">Máx 1 vídeo (Até 20MB)</span>
              
              {video && (
                <div className="mt-3 text-sm text-red-600 font-semibold bg-red-50 py-1 px-2 rounded">
                  Vídeo anexado com sucesso!
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Suas informações pessoais são mantidas em sigilo pela moderação.
        </p>
      </div>
    </form>
  );
}
