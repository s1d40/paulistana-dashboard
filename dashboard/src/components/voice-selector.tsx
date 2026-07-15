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
  
  const [localVoice, setLocalVoice] = useState(activePreset?.config?.voice_id || 'pNInz6obpgDQGcFmaJgB');
  const [localModel, setLocalModel] = useState(activePreset?.config?.voiceSettings?.model_id || 'eleven_multilingual_v2');
  const lastPresetIdRef = useRef(activePresetId);

  useEffect(() => {
    if (activePresetId !== lastPresetIdRef.current) {
      setLocalVoice(activePreset?.config?.voice_id || 'pNInz6obpgDQGcFmaJgB');
      setLocalModel(activePreset?.config?.voiceSettings?.model_id || 'eleven_multilingual_v2');
      lastPresetIdRef.current = activePresetId;
    }
  }, [activePresetId, activePreset?.config?.voice_id, activePreset?.config?.voiceSettings?.model_id]);

  const handleSave = (newVoiceId: string, newModelId: string) => {
    setLocalVoice(newVoiceId);
    setLocalModel(newModelId);
    if (activePreset) {
      updatePreset(activePreset.id, { 
        config: { 
          ...activePreset.config, 
          voice_id: newVoiceId,
          voiceSettings: {
            ...(activePreset.config.voiceSettings || {}),
            model_id: newModelId,
            voice_id: newVoiceId
          }
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
        onChange={(e) => handleSave(e.target.value, localModel)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
      >
        {ELEVENLABS_VOICES.map(voice => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>

      <select
        value={localModel}
        onChange={(e) => handleSave(localVoice, e.target.value)}
        className="w-full mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
      >
        <option value="eleven_multilingual_v2">Multilingual v2 (Padrão)</option>
        <option value="eleven_turbo_v2_5">Turbo v2.5 (Rápido/Inglês)</option>
        <option value="eleven_turbo_v2">Turbo v2</option>
        <option value="eleven_multilingual_sts_v2">Multilingual STS v2</option>
        <option value="eleven_monolingual_v1">Monolingual v1</option>
      </select>
    </div>
  );
}
