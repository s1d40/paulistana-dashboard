'use client';

import { usePresetStore } from '@/store/presetStore';
import { Type, Save } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function PromptEditor() {
  const { presets, activePresetId, updatePreset } = usePresetStore();
  const activePreset = presets.find(p => p.id === activePresetId);
  
  const [localPrompt, setLocalInput] = useState(activePreset?.prompt || '');
  const lastPresetIdRef = useRef(activePresetId);

  // Sincronizar quando o preset ativo mudar
  useEffect(() => {
    if (activePresetId !== lastPresetIdRef.current) {
      setLocalInput(activePreset?.prompt || '');
      lastPresetIdRef.current = activePresetId;
    }
  }, [activePresetId, activePreset?.prompt]);

  const handleSave = () => {
    if (activePreset) {
      updatePreset(activePreset.id, { prompt: localPrompt });
    }
  };

  if (!activePreset) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Type className="w-4 h-4" /> Prompt de Campanha
        </label>
        <button 
          onClick={handleSave}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-800"
        >
          <Save className="w-3 h-3" /> Salvar Prompt
        </button>
      </div>
      
      <textarea
        value={localPrompt}
        onChange={(e) => setLocalInput(e.target.value)}
        onBlur={handleSave}
        className="w-full h-32 px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono text-xs resize-none shadow-inner"
        placeholder="Instrução que varia conforme a campanha atual..."
      />
      <p className="text-[9px] text-zinc-500 italic">
        * Este prompt será enviado como a instrução principal para o roteirista.
      </p>
    </div>
  );
}
