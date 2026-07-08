'use client';

import { usePresetStore } from '@/store/presetStore';
import { Mic, Save } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Soft/Female)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Deep/Narration)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm/Female)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Well-rounded/Male)' },
  { id: 'TX3OmfQAelAqweILnX', name: 'Josh (Deep/Engaging/Male)' }
];

export default function VoiceSelector() {
  const { presets, activePresetId, updatePreset } = usePresetStore();
  const activePreset = presets.find(p => p.id === activePresetId);
  
  const [localVoice, setLocalVoice] = useState(activePreset?.config?.voice_id || 'EXAVITQu4vr4xnSDxMaL');
  const lastPresetIdRef = useRef(activePresetId);

  useEffect(() => {
    if (activePresetId !== lastPresetIdRef.current) {
      setLocalVoice(activePreset?.config?.voice_id || 'EXAVITQu4vr4xnSDxMaL');
      lastPresetIdRef.current = activePresetId;
    }
  }, [activePresetId, activePreset?.config?.voice_id]);

  const handleSave = (newVoiceId: string) => {
    setLocalVoice(newVoiceId);
    if (activePreset) {
      updatePreset(activePreset.id, { 
        config: { 
          ...activePreset.config, 
          voice_id: newVoiceId 
        } 
      });
    }
  };

  if (!activePreset) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Mic className="w-4 h-4" /> Voz da Narração (ElevenLabs)
        </label>
      </div>
      
      <select
        value={localVoice}
        onChange={(e) => handleSave(e.target.value)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
      >
        {ELEVENLABS_VOICES.map(voice => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
}
