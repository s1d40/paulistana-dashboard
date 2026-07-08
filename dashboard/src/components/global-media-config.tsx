'use client';

import { usePresetStore } from '@/store/presetStore';
import { clsx } from 'clsx';
import { Settings2, Volume2, Image as ImageIcon, Sparkles } from 'lucide-react';
import ImageModelSelector from '@/components/image-model-selector';
import { DEFAULT_IMAGE_MODEL } from '@/lib/image-models';

export default function GlobalMediaConfig() {
  const { activePresetId, presets, updatePreset } = usePresetStore();
  const activePreset = presets.find((p) => p.id === activePresetId);

  if (!activePreset) return null;

  const config = activePreset.config || {};
  const imageModel = config.image_model || DEFAULT_IMAGE_MODEL;
  const formatoVideo = config.formato_video || 'portrait';
  const comLegendas = config.com_legendas !== undefined ? config.com_legendas : true;
  
  const defaultVoiceSettings = {
    model_id: "eleven_multilingual_v2",
    stability: 0.7,
    similarity_boost: 0.75,
    style: 0.15,
    use_speaker_boost: true,
    speed: 1.10,
    voice_id: "Xb7hH8MSALEsuEVAig0v"
  };
  
  const voiceSettings = config.voice_settings || defaultVoiceSettings;

  const handleUpdateImageModel = (model: string) => {
    updatePreset(activePreset.id, {
      config: { ...config, image_model: model }
    });
  };

  const handleUpdateConfig = (key: string, value: any) => {
    updatePreset(activePreset.id, {
      config: { ...config, [key]: value }
    });
  };

  const handleUpdateVoice = (key: string, value: any) => {
    updatePreset(activePreset.id, {
      config: { 
        ...config, 
        voice_settings: { ...voiceSettings, [key]: value }
      }
    });
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
          Configurações de IA (Global)
        </h3>
      </div>

      {/* Image Model Config — agora usando o componente centralizado */}
      <ImageModelSelector 
        value={imageModel} 
        onChange={handleUpdateImageModel}
        label="Modelo de Imagem (Nível Preset)"
      />

      {/* Video Format & Subtitles Config */}
      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
          <Settings2 className="w-3 h-3" /> Configuração de Vídeo
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Formato do Vídeo</label>
            <select 
              value={formatoVideo}
              onChange={(e) => handleUpdateConfig('formato_video', e.target.value)}
              className="w-full mt-1 text-xs p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-700 dark:text-zinc-300"
            >
              <option value="portrait">Vertical 9:16 (Reels/TikTok)</option>
              <option value="landscape">Horizontal 16:9 (YouTube)</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center pt-5">
            <input 
              type="checkbox"
              id="com-legendas"
              checked={comLegendas}
              onChange={(e) => handleUpdateConfig('com_legendas', e.target.checked)}
              className="accent-indigo-500 rounded mr-2"
            />
            <label htmlFor="com-legendas" className="text-[10px] font-bold text-zinc-500 cursor-pointer">
              Gerar Legendas Animadas (CapCut)
            </label>
          </div>
        </div>
      </div>

      {/* Voice Settings Config */}
      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> Configuração de Voz (ElevenLabs)
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Voice ID / Personagem</label>
            <input 
              type="text" 
              value={voiceSettings.voice_id || ''}
              onChange={(e) => handleUpdateVoice('voice_id', e.target.value)}
              placeholder="Ex: Xb7hH8MSALEsuEVAig0v"
              className="w-full mt-1 text-xs p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-700 dark:text-zinc-300"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase flex justify-between">
              Stability <span>{voiceSettings.stability}</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={voiceSettings.stability}
              onChange={(e) => handleUpdateVoice('stability', parseFloat(e.target.value))}
              className="w-full mt-1 accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase flex justify-between">
              Similarity <span>{voiceSettings.similarity_boost}</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={voiceSettings.similarity_boost}
              onChange={(e) => handleUpdateVoice('similarity_boost', parseFloat(e.target.value))}
              className="w-full mt-1 accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase flex justify-between">
              Style Exaggeration <span>{voiceSettings.style}</span>
            </label>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={voiceSettings.style}
              onChange={(e) => handleUpdateVoice('style', parseFloat(e.target.value))}
              className="w-full mt-1 accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase flex justify-between">
              Speed <span>{voiceSettings.speed}x</span>
            </label>
            <input 
              type="range" min="0.5" max="2" step="0.05"
              value={voiceSettings.speed}
              onChange={(e) => handleUpdateVoice('speed', parseFloat(e.target.value))}
              className="w-full mt-1 accent-indigo-500"
            />
          </div>
          
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <input 
              type="checkbox"
              id="speaker-boost"
              checked={voiceSettings.use_speaker_boost}
              onChange={(e) => handleUpdateVoice('use_speaker_boost', e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <label htmlFor="speaker-boost" className="text-[10px] font-bold text-zinc-500 cursor-pointer">
              Ativar Speaker Boost
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
