'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Link as LinkIcon, Home, Layout, ShieldAlert, Lock, Image as ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';

export default function FrontendDepartment() {
  const [activeSubTab, setActiveSubTab] = useState<'textos'|'home'|'vod'|'fiscalizacao'|'login'>('textos');
  
  // Settings State
  const [settings, setSettings] = useState({
    facebook_url: '',
    instagram_url: '',
    whatsapp_url: '',
    home_slogan: '',
    home_banner_title: '',
    home_banner_image: '',
    fiscalizacao_instructions: '',
    login_welcome_text: '',
    register_welcome_text: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings({
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          whatsapp_url: data.whatsapp_url || '',
          home_slogan: data.home_slogan || '',
          home_banner_title: data.home_banner_title || '',
          home_banner_image: data.home_banner_image || '',
          fiscalizacao_instructions: data.fiscalizacao_instructions || '',
          login_welcome_text: data.login_welcome_text || '',
          register_welcome_text: data.register_welcome_text || ''
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').upsert({
        id: 1,
        ...settings,
        updated_at: new Date()
      });
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Carregando painel CMS... (Certifique-se de ter rodado o script SQL)</div>;

  return (
    <div className="p-6 md:p-8 h-full flex flex-col space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-[#051622] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layout className="text-[#00f0ff]" /> Portal & CMS
          </h1>
          <p className="text-white/60 text-sm mt-1">Gerencie textos, links e imagens de todo o site público.</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={saving || activeSubTab === 'vod'}
          className="bg-[#0e4b77] hover:bg-[#00f0ff] hover:text-[#051622] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setActiveSubTab('textos')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'textos' ? 'bg-[#00f0ff] text-[#051622]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
          <LinkIcon size={18} /> Redes Sociais & Footer
        </button>
        <button onClick={() => setActiveSubTab('home')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'home' ? 'bg-[#00f0ff] text-[#051622]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
          <Home size={18} /> Homepage (Banners)
        </button>
        <button onClick={() => setActiveSubTab('vod')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'vod' ? 'bg-purple-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
          <Layout size={18} /> Nossa Grade (VOD)
        </button>
        <button onClick={() => setActiveSubTab('fiscalizacao')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'fiscalizacao' ? 'bg-red-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
          <ShieldAlert size={18} /> Fiscalização
        </button>
        <button onClick={() => setActiveSubTab('login')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'login' ? 'bg-green-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
          <Lock size={18} /> Acesso (Criar Conta)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#051622] rounded-2xl border border-white/10 p-6 custom-scrollbar shadow-xl">
        
        {/* TAB 1: Redes Sociais */}
        {activeSubTab === 'textos' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Redes Sociais (Links)</h2>
            <p className="text-white/50 text-sm mb-4">Deixe em branco para ocultar o botão no Menu e no Rodapé.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Link do Instagram</label>
                <input 
                  type="url" 
                  value={settings.instagram_url} 
                  onChange={e => handleChange('instagram_url', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none"
                  placeholder="https://instagram.com/oxtv..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Link do WhatsApp</label>
                <input 
                  type="url" 
                  value={settings.whatsapp_url} 
                  onChange={e => handleChange('whatsapp_url', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none"
                  placeholder="https://wa.me/55..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Link do Facebook</label>
                <input 
                  type="url" 
                  value={settings.facebook_url} 
                  onChange={e => handleChange('facebook_url', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Homepage */}
        {activeSubTab === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Homepage (Página Inicial)</h2>
            
            <div className="space-y-4 max-w-3xl">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Título Gigante do Banner</label>
                <textarea 
                  value={settings.home_banner_title} 
                  onChange={e => handleChange('home_banner_title', e.target.value)}
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none resize-none"
                  placeholder="Ex: OX WebTV chega para informar Quissamã..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Slogan (Subtítulo da Grade)</label>
                <input 
                  type="text" 
                  value={settings.home_slogan} 
                  onChange={e => handleChange('home_slogan', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none"
                  placeholder="Ex: Acompanhe nossa programação ao vivo..."
                />
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-white/70 text-sm font-bold flex items-center gap-2">
                  <ImageIcon size={16} /> URL da Imagem de Fundo do Banner (Opcional)
                </label>
                <input 
                  type="url" 
                  value={settings.home_banner_image} 
                  onChange={e => handleChange('home_banner_image', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#00f0ff] outline-none"
                  placeholder="https://suaimagem.com/banner.jpg"
                />
                <p className="text-xs text-white/40">Se vazio, usaremos o gradiente amarelo/neon padrão.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Fiscalização */}
        {activeSubTab === 'fiscalizacao' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Portal de Fiscalização</h2>
            
            <div className="space-y-2 max-w-3xl">
              <label className="text-white/70 text-sm font-bold">Texto Lateral (Como Funciona?)</label>
              <textarea 
                value={settings.fiscalizacao_instructions} 
                onChange={e => handleChange('fiscalizacao_instructions', e.target.value)}
                className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none resize-none"
                placeholder="Escreva aqui as regras ou instruções..."
              />
              <p className="text-xs text-white/40">Dica: Use parágrafos simples.</p>
            </div>
          </div>
        )}

        {/* TAB 4: Login */}
        {activeSubTab === 'login' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Telas de Acesso (Login / Cadastro)</h2>
            
            <div className="space-y-6 max-w-3xl">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Mensagem Tela de Login</label>
                <input 
                  type="text" 
                  value={settings.login_welcome_text} 
                  onChange={e => handleChange('login_welcome_text', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
                  placeholder="Faça login para continuar na OX TV..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-bold">Mensagem Tela Criar Conta</label>
                <input 
                  type="text" 
                  value={settings.register_welcome_text} 
                  onChange={e => handleChange('register_welcome_text', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-green-500 outline-none"
                  placeholder="Junte-se à maior plataforma da região..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VOD (Nossa Grade) */}
        {activeSubTab === 'vod' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Gerenciador de Prateleiras (VOD)</h2>
              <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
                <Plus size={16} /> Nova Prateleira
              </button>
            </div>
            
            <div className="bg-black/50 border border-white/5 rounded-xl p-8 text-center text-white/50">
              <p>Módulo de VOD (Video on Demand) será implementado em seguida.</p>
              <p className="text-sm mt-2">Você poderá criar categorias (Sessão Pipoca, Destaques) e adicionar vídeos nelas.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
