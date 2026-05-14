'use client';

import { usePresetStore, ContentType, Preset } from '@/store/presetStore';
import { CheckCircle2, ChevronDown, FileJson, Video, Layout, FileText } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface PresetSelectorProps {
  onSelect?: (preset: Preset) => void;
}

export default function PresetSelector({ onSelect }: PresetSelectorProps) {
  const { presets, activePresetId, setActivePreset } = usePresetStore();
  const [isOpen, setIsOpen] = useState(false);

  const activePreset = presets.find(p => p.id === activePresetId);

  const getIconForType = (type: ContentType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'carrossel': return <Layout className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      default: return <FileJson className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">
        Preset de Produção
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 group-hover:text-indigo-500 transition-colors">
            {activePreset ? getIconForType(activePreset.type || 'general') : <FileJson className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {activePreset ? activePreset.name : 'Selecionar Preset'}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium">
              {activePreset ? (activePreset.type || 'general').toUpperCase() : 'Nenhum ativo'}
            </p>
          </div>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
              {presets.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 italic">
                  Nenhum preset encontrado.
                </div>
              ) : (
                presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      if (onSelect) {
                        onSelect(preset);
                      } else {
                        setActivePreset(preset.id);
                      }
                      setIsOpen(false);
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 last:mb-0",
                      activePresetId === preset.id
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        {getIconForType(preset.type || 'general')}
                      </span>
                      <div className="text-left">
                        <p className="text-xs font-bold">{preset.name}</p>
                        <p className="text-[9px] opacity-70">{preset.description.substring(0, 40)}...</p>
                      </div>
                    </div>
                    {activePresetId === preset.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))
              )}
            </div>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
              <a 
                href="/presets" 
                className="block text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 py-2"
              >
                Gerenciar Todos os Presets
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
