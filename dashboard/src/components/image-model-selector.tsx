'use client';

import { IMAGE_MODELS, ImageModel, DEFAULT_IMAGE_MODEL } from '@/lib/image-models';
import { Image as ImageIcon, Zap, Clock, Gauge, Package } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

interface ImageModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  size?: 'compact' | 'full';
  label?: string;
  showDescription?: boolean;
}

const speedConfig = {
  'rápido': { icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Rápido' },
  'médio': { icon: Gauge, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Médio' },
  'lento': { icon: Clock, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Lento' },
};

export default function ImageModelSelector({ 
  value, 
  onChange, 
  size = 'full',
  label = 'Modelo de Imagem',
  showDescription = true
}: ImageModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModel = IMAGE_MODELS.find(m => m.id === value) || IMAGE_MODELS[0];
  const SpeedIcon = speedConfig[selectedModel.speed].icon;

  if (size === 'compact') {
    return (
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> {label}
        </label>
        <select
          value={value || DEFAULT_IMAGE_MODEL}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[10px] font-bold p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-700 dark:text-zinc-300 appearance-none"
        >
          {IMAGE_MODELS.map(m => (
            <option key={m.id} value={m.id}>
              {m.label} {m.supportsReference ? '📦' : '🎨'}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
        <ImageIcon className="w-3 h-3" /> {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 transition-all shadow-sm group text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx("p-1.5 rounded-lg shrink-0", speedConfig[selectedModel.speed].bg)}>
            <SpeedIcon className={clsx("w-3.5 h-3.5", speedConfig[selectedModel.speed].color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{selectedModel.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx("text-[8px] font-black uppercase", speedConfig[selectedModel.speed].color)}>
                {speedConfig[selectedModel.speed].label}
              </span>
              {selectedModel.supportsReference && (
                <span className="text-[8px] font-bold text-indigo-500 flex items-center gap-0.5">
                  <Package className="w-2.5 h-2.5" /> Produto
                </span>
              )}
            </div>
          </div>
        </div>
        <svg className={clsx("w-4 h-4 text-zinc-400 transition-transform shrink-0", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
              {IMAGE_MODELS.map((model) => {
                const MSpeedIcon = speedConfig[model.speed].icon;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      "w-full flex items-start gap-3 p-3 rounded-lg transition-colors mb-1 last:mb-0 text-left",
                      value === model.id
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className={clsx("p-1.5 rounded-lg shrink-0 mt-0.5", speedConfig[model.speed].bg)}>
                      <MSpeedIcon className={clsx("w-3.5 h-3.5", speedConfig[model.speed].color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold truncate">{model.label}</p>
                        {value === model.id && (
                          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx("text-[8px] font-black uppercase", speedConfig[model.speed].color)}>
                          {speedConfig[model.speed].label}
                        </span>
                        {model.supportsReference && (
                          <span className="text-[8px] font-bold text-indigo-500 flex items-center gap-0.5">
                            <Package className="w-2.5 h-2.5" /> Suporta Produto
                          </span>
                        )}
                      </div>
                      {showDescription && model.description && (
                        <p className="text-[9px] text-zinc-400 mt-1 leading-snug">{model.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
