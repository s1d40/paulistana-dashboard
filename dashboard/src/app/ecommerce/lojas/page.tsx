"use client";

import React, { useState, useEffect } from 'react';
import { Store, Plus, ExternalLink, Settings, ToggleLeft, ToggleRight, Palette, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StoreConfig {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  theme: Record<string, string>;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function LojasPage() {
  const [stores, setStores] = useState<StoreConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStores(data);
    }
    setLoading(false);
  }

  async function toggleStore(id: string, currentActive: boolean) {
    await supabase
      .from('store_configs')
      .update({ is_active: !currentActive })
      .eq('id', id);
    fetchStores();
  }

  function copyUrl(slug: string) {
    navigator.clipboard.writeText(`https://${slug}.paulistanaemporio.com`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  const THEME_PRESETS = [
    { name: 'Místico (Ouro)', accent: '#D4AF37', bg: '#0B0E14' },
    { name: 'Natural (Verde)', accent: '#22C55E', bg: '#0A1208' },
    { name: 'Moderno (Azul)', accent: '#3B82F6', bg: '#0C1220' },
    { name: 'Premium (Roxo)', accent: '#8B5CF6', bg: '#0E0A1A' },
    { name: 'Energia (Laranja)', accent: '#F97316', bg: '#140C06' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto ecommerce-theme">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ecommerce-accent flex items-center gap-3">
            <Store className="w-8 h-8" />
            Lojas (Storefronts)
          </h1>
          <p className="text-ecommerce-muted mt-1">
            Gerencie as lojas de cada página. Cada loja é um subdomínio de paulistanaemporio.com
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-ecommerce-accent text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Loja
        </button>
      </div>

      {/* Store Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-ecommerce-card border border-ecommerce-border rounded-xl p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-ecommerce-accent/10 flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-ecommerce-accent" />
          </div>
          <h3 className="text-xl font-bold text-ecommerce-text mb-2">Nenhuma loja criada</h3>
          <p className="text-ecommerce-muted mb-6">
            Crie sua primeira loja e comece a vender!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-ecommerce-accent text-white rounded-xl font-medium text-sm hover:opacity-90"
          >
            Criar Primeira Loja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-ecommerce-card border border-ecommerce-border rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Color bar */}
              <div
                className="h-2"
                style={{ backgroundColor: store.theme?.accent || '#D4AF37' }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ecommerce-text">
                      {store.display_name}
                    </h3>
                    <p className="text-xs text-ecommerce-muted mt-1 font-mono">
                      {store.slug}.paulistanaemporio.com
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStore(store.id, store.is_active)}
                    className="flex-shrink-0"
                    title={store.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {store.is_active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-ecommerce-muted" />
                    )}
                  </button>
                </div>

                {store.description && (
                  <p className="text-sm text-ecommerce-muted line-clamp-2 mb-4">
                    {store.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-ecommerce-border">
                  <a
                    href={`https://${store.slug}.paulistanaemporio.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ecommerce-accent bg-ecommerce-accent/10 rounded-lg hover:bg-ecommerce-accent/20 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Loja
                  </a>
                  <button
                    onClick={() => copyUrl(store.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ecommerce-muted bg-ecommerce-bg rounded-lg hover:bg-ecommerce-bg/80 transition-colors"
                  >
                    {copiedSlug === store.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar URL
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme Presets Reference */}
      <div className="mt-12">
        <h3 className="text-lg font-bold text-ecommerce-text mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-ecommerce-accent" />
          Temas Disponíveis
        </h3>
        <div className="flex flex-wrap gap-3">
          {THEME_PRESETS.map((preset) => (
            <div
              key={preset.name}
              className="flex items-center gap-2 px-4 py-2 bg-ecommerce-card border border-ecommerce-border rounded-xl"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: preset.accent }}
              />
              <span className="text-xs font-medium text-ecommerce-text">
                {preset.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
