import React, { useState } from 'react';
import { CarrosselScript } from '@/types/content-studio';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { PostImage } from '@/services/supabase-service';
import { useProductionQueue } from '@/store/production-queue';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';

interface CarrosselStudioProps {
  data: CarrosselScript;
  onChange: (newData: CarrosselScript) => void;
  imagens?: PostImage[];
}

export const CarrosselStudio: React.FC<CarrosselStudioProps> = ({ data, onChange, imagens = [] }) => {
  const { id } = useParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const { generateAssets, isProcessing, progress } = useProductionQueue();

  const currentScene = data.cenas[activeSlide];
  const payload = currentScene?.payload_api;

  const sceneImg = imagens.find(img => Number(img.numero_cena) === currentScene?.numero);
  const bgUrl = sceneImg?.image_url || sceneImg?.url_imagem_fundo;

  const sceneProgress = progress[currentScene?.numero];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Editor Form */}
      <div className="space-y-6 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Editor de Carrossel</h3>
          <button 
            onClick={() => generateAssets(id as string, data.cenas)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Gerar Todas as Imagens
          </button>
        </div>
        
        {/* Slide Selector */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
          {data.cenas.map((cena, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={clsx(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border",
                activeSlide === idx 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              )}
            >
              Slide {cena.numero} ({payload?.slideCategory})
            </button>
          ))}
        </div>

        {currentScene && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-6 relative overflow-hidden">
              {sceneProgress?.image === 'processing' && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
                   <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Renderizando Slide...</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase text-zinc-500">Headline (Slide {currentScene.numero})</label>
                <button 
                  onClick={() => generateAssets(id as string, [currentScene])}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-all text-[9px] font-black uppercase"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Regerar Imagem
                </button>
              </div>

              <textarea 
                value={payload.content.headline}
                onChange={(e) => {
                  const newCenas = [...data.cenas];
                  newCenas[activeSlide].payload_api.content.headline = e.target.value;
                  onChange({ ...data, cenas: newCenas });
                }}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-lg font-bold"
              />

              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Subheadline</label>
                <textarea 
                  value={payload.content.subHeadline}
                  onChange={(e) => {
                    const newCenas = [...data.cenas];
                    newCenas[activeSlide].payload_api.content.subHeadline = e.target.value;
                    onChange({ ...data, cenas: newCenas });
                  }}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Highlight Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={payload.theme.highlightColor}
                      onChange={(e) => {
                        const newCenas = [...data.cenas];
                        newCenas[activeSlide].payload_api.theme.highlightColor = e.target.value;
                        onChange({ ...data, cenas: newCenas });
                      }}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={payload.theme.highlightColor}
                      onChange={(e) => {
                        const newCenas = [...data.cenas];
                        newCenas[activeSlide].payload_api.theme.highlightColor = e.target.value;
                        onChange({ ...data, cenas: newCenas });
                      }}
                      className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Anchor</label>
                  <select 
                    value={payload.layout.anchor}
                    onChange={(e) => {
                      const newCenas = [...data.cenas];
                      newCenas[activeSlide].payload_api.layout.anchor = e.target.value as 'top' | 'center' | 'bottom';
                      onChange({ ...data, cenas: newCenas });
                    }}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
                  >
                    <option value="top">Topo</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Base</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Preview */}
      <div className="bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center sticky top-0 h-[600px]">
        <div className="relative group">
          <div 
            className="aspect-square w-80 bg-white rounded shadow-2xl overflow-hidden relative border border-zinc-200 flex flex-col p-8 justify-between transition-all"
            style={{ 
              backgroundColor: !bgUrl ? (payload?.theme.textColor === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF') : 'transparent',
              justifyContent: payload?.layout.anchor === 'top' ? 'flex-start' : payload?.layout.anchor === 'center' ? 'center' : 'flex-end',
              textAlign: payload?.layout.textAlign
            }}
          >
            {bgUrl && (
              <div className="absolute inset-0 z-0">
                <Image 
                  src={bgUrl} 
                  alt="Background" 
                  fill 
                  unoptimized 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}
            {/* Satori Simulation */}
            <div className="space-y-4 relative z-10">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: payload?.theme.textColor }}>
                {payload?.content.headline.split('**').map((part, i) => 
                  i % 2 === 1 
                    ? <span key={i} style={{ color: payload?.theme.highlightColor }}>{part}</span> 
                    : part
                )}
              </h1>
              <p className="text-sm opacity-80" style={{ color: payload?.theme.textColor }}>
                {payload?.content.subHeadline}
              </p>
            </div>
            
            {payload?.actionIndicator.type === 'swipe-arrow' && (
              <div className="absolute right-4 bottom-4 animate-bounce relative z-10">
                <ChevronRight className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
          
          <div className="absolute -left-4 top-1/2 -translate-y-1/2">
             <button 
              disabled={activeSlide === 0}
              onClick={() => setActiveSlide(s => s - 1)}
              className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-0 transition-opacity"
             >
               <ChevronLeft className="w-4 h-4" />
             </button>
          </div>

          <div className="absolute -right-4 top-1/2 -translate-y-1/2">
             <button 
              disabled={activeSlide === data.cenas.length - 1}
              onClick={() => setActiveSlide(s => s + 1)}
              className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-0 transition-opacity"
             >
               <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>
        
        <div className="mt-8 flex gap-1.5">
          {data.cenas.map((_, i) => (
            <div key={i} className={clsx("h-1.5 rounded-full transition-all", activeSlide === i ? "w-8 bg-indigo-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-800")} />
          ))}
        </div>
        <p className="mt-4 text-zinc-500 text-[10px] font-black uppercase tracking-widest">Preview Satori Engine (1:1)</p>
      </div>
    </div>
  );
};
