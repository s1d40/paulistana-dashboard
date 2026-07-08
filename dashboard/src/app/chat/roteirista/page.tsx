'use client';
export const dynamic = 'force-dynamic';

import ChatPanel from '@/components/chat-panel';
import { PenTool, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePresetStore } from '@/store/presetStore';
import { useMemo } from 'react';

export default function RoteiristaChatPage() {
  const { presets, activePresetId } = usePresetStore();
  
  const activePreset = useMemo(() => 
    presets.find(p => p.id === activePresetId), 
    [presets, activePresetId]
  );

  // Consolidar todas as sessões em um único system message
  const consolidatedSystemMessage = useMemo(() => {
    if (!activePreset || !activePreset.sessions) return '';
    return activePreset.sessions
      .map(s => `### ${s.title}\n${s.content}`)
      .join('\n\n');
  }, [activePreset]);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 h-full flex flex-col overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="mb-6 space-y-2">
          <Link href="/production" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para Produção
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Chat com Roteirista
            </h1>
            {activePreset && (
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                Preset: {activePreset.name}
              </span>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Refine roteiros individualmente, peça ajustes em ganchos ou brainstorme novas ideias.
          </p>
        </div>
        
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
          <ChatPanel 
            title="Agente Roteirista (Fase 4)"
            description={activePreset?.description || "Interface de refinamento criativo para a esteira de produção."}
            apiEndpoint="/api/chat/roteirista"
            icon={<PenTool className="w-5 h-5 text-indigo-500" />}
            systemMessage={consolidatedSystemMessage}
            initialPrompt={activePreset?.prompt}
          />
        </div>
      </div>
    </div>
  );
}
