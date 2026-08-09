'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, PlayCircle, Save, X, GripVertical } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

interface CarouselItem {
  id: number;
  category_id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  time_label: string;
  duration_label: string;
  genre: string;
  video_url: string;
  sort_order: number;
}

export default function VODManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCategoryIdForNewItem, setSelectedCategoryIdForNewItem] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        supabase.from('site_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('site_carousel_items').select('*').order('sort_order', { ascending: true })
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // CATEGORY ACTIONS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    
    try {
      if (editingCategory.id === 0) {
        // Insert new
        const { error } = await supabase.from('site_categories').insert({
          name: editingCategory.name,
          sort_order: categories.length
        });
        if (error) throw error;
      } else {
        // Update
        const { error } = await supabase.from('site_categories').update({
          name: editingCategory.name
        }).eq('id', editingCategory.id);
        if (error) throw error;
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert("Erro ao salvar categoria: " + e.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Tem certeza? Isso apagará TODOS os vídeos desta prateleira!")) return;
    try {
      await supabase.from('site_categories').delete().eq('id', id);
      fetchData();
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  const openNewCategoryModal = () => {
    setEditingCategory({ id: 0, name: '', sort_order: 0 });
    setIsCategoryModalOpen(true);
  };

  // ITEM ACTIONS
  const openNewItemModal = (categoryId: number) => {
    setEditingItem({
      id: 0,
      category_id: categoryId,
      title: '',
      description: '',
      thumbnail_url: '',
      time_label: '12:00',
      duration_label: '90 min',
      genre: 'Filme',
      video_url: '',
      sort_order: 0
    });
    setSelectedCategoryIdForNewItem(categoryId);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem.thumbnail_url) return;
    
    try {
      const itemToSave = { ...editingItem };
      if (itemToSave.id === 0) {
        // Remove ID to let DB autogenerate
        const { id, ...insertData } = itemToSave;
        const { error } = await supabase.from('site_carousel_items').insert({
          ...insertData,
          sort_order: items.filter(i => i.category_id === insertData.category_id).length
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_carousel_items').update(itemToSave).eq('id', itemToSave.id);
        if (error) throw error;
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert("Erro ao salvar vídeo: " + e.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Deletar este vídeo?")) return;
    try {
      await supabase.from('site_carousel_items').delete().eq('id', id);
      fetchData();
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  if (loading) return <div className="text-white/50 animate-pulse">Carregando dados do VOD...</div>;

  return (
    <div className="space-y-8 relative pb-12">
      <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">Prateleiras (VOD)</h2>
          <p className="text-white/50 text-sm">Organize as categorias e adicione os vídeos no estilo Netflix.</p>
        </div>
        <button 
          onClick={openNewCategoryModal}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Plus size={16} /> Nova Prateleira
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/20 rounded-xl">
          <p className="text-white/60 mb-4">Nenhuma prateleira criada ainda.</p>
          <button onClick={openNewCategoryModal} className="text-purple-400 font-bold hover:underline">
            Criar primeira prateleira
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catItems = items.filter(i => i.category_id === cat.id);
            return (
              <div key={cat.id} className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-[#051622] p-4 flex justify-between items-center border-b border-white/10">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <GripVertical size={16} className="text-white/20" />
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openNewItemModal(cat.id)}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Adicionar Vídeo
                    </button>
                    <button 
                      onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                      className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 overflow-x-auto custom-scrollbar">
                  {catItems.length === 0 ? (
                    <p className="text-white/30 text-sm italic py-4 text-center">Nenhum vídeo nesta prateleira.</p>
                  ) : (
                    <div className="flex gap-4 min-w-max pb-2">
                      {catItems.map((item) => (
                        <div key={item.id} className="w-[200px] flex-shrink-0 group relative rounded-xl overflow-hidden border border-white/10 bg-black cursor-pointer">
                          <div className="h-[112px] relative">
                            <img src={item.thumbnail_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            {/* Hover Actions Background */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="bg-red-500 hover:bg-red-400 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>
                            <p className="text-white/50 text-xs mt-1 truncate">{item.genre} • {item.duration_label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CATEGORY */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveCategory} className="bg-[#051622] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingCategory.id === 0 ? 'Nova Prateleira' : 'Editar Prateleira'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm font-bold">Nome da Categoria</label>
                <input 
                  type="text" 
                  required
                  value={editingCategory.name} 
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-purple-500 outline-none"
                  placeholder="Ex: Lançamentos"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-white/70 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-bold transition-colors">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ITEM */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSaveItem} className="bg-[#051622] border border-white/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PlayCircle className="text-purple-500" />
              {editingItem.id === 0 ? 'Adicionar Vídeo à Prateleira' : 'Editar Vídeo'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Título</label>
                <input 
                  type="text" required value={editingItem.title} 
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">URL da Imagem de Capa (Thumbnail)</label>
                <input 
                  type="url" required value={editingItem.thumbnail_url} 
                  onChange={e => setEditingItem({...editingItem, thumbnail_url: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">URL do Vídeo (M3U8 / MP4)</label>
                <input 
                  type="url" value={editingItem.video_url} 
                  onChange={e => setEditingItem({...editingItem, video_url: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                  placeholder="Opcional por enquanto..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Gênero</label>
                <input 
                  type="text" required value={editingItem.genre} 
                  onChange={e => setEditingItem({...editingItem, genre: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Duração (Ex: 120 min)</label>
                <input 
                  type="text" required value={editingItem.duration_label} 
                  onChange={e => setEditingItem({...editingItem, duration_label: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Sinopse</label>
                <textarea 
                  required value={editingItem.description} 
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none resize-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-white/70 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-bold transition-colors">Salvar Vídeo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
