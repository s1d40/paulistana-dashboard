import React, { useState, useEffect } from 'react';
import { VideoScript, VideoScene } from '@/types/content-studio';
import { 
  Sparkles, Settings2, 
  Image as ImageIcon, Film, Music, Clock,
  Play, Volume2, RefreshCw, Send, AlertTriangle, CheckCircle2,
  Camera, Video, Globe, Database
} from 'lucide-react';
import { useProductionQueue } from '@/store/production-queue';
import { PostImage, PostAudio, PostVideoCena, PostVideo, ContentPost, Account, Product } from '@/services/google-sheets';
import { useParams } from 'next/navigation';
import { fetchProducts } from '@/services/supabase-service';
import clsx from 'clsx';
import Image from 'next/image';

interface VideoStudioProps {
  data: VideoScript;
  onChange: (newData: VideoScript) => void;
  post?: ContentPost | null;
  imagens?: PostImage[];
  audios?: PostAudio[];
  videos_cenas?: PostVideoCena[];
  videos?: PostVideo[];
  accounts?: Account[];
  onPublish?: (id_conta: string) => void;
}

const ANIMATION_OPTIONS = [
  { id: 'zoom_in', label: 'Zoom In' },
  { id: 'zoom_out', label: 'Zoom Out' },
  { id: 'pan_left', label: 'Pan Left' },
  { id: 'pan_right', label: 'Pan Right' },
  { id: 'static', label: 'Estático' }
];

const AVAILABLE_MODELS = [
  { label: 'Nano Banana (Google)', url: 'https://api.replicate.com/v1/models/google/nano-banana/predictions' },
  { label: 'Flux Schnell (Pruna)', url: 'https://api.replicate.com/v1/models/prunaai/flux-fast/predictions' },
  { label: 'Z-Image Turbo', url: 'https://api.replicate.com/v1/models/prunaai/z-image-turbo/predictions' },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({ 
  data, 
  onChange, 
  post,
  imagens = [], 
  audios = [], 
  videos_cenas = [],
  videos = [],
  accounts = [],
  onPublish
}) => {
  const { id: postId } = useParams();
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  const { 
    progress, 
    generateSceneAssets, 
    generateSceneImage, 
    renderScene,
    compileFinalVideo,
    isProcessing 
  } = useProductionQueue();

  const currentScene = data.cenas[selectedSceneIdx];

  // Initialize Replicate config and Voice Settings if missing
  useEffect(() => {
    let changed = false;
    const updatedData = { ...data };

    const newCenas = data.cenas.map(scene => {
      if (!scene.replicate) {
        changed = true;
        return {
          ...scene,
          replicate: {
            model_url: AVAILABLE_MODELS[0].url,
            input: {
              prompt: scene.prompt_visual,
              negative_prompt: scene.prompt_negativo,
              aspect_ratio: '9:16' as const,
              output_format: 'jpg' as const
            }
          }
        };
      }
      return scene;
    });

    if (changed) {
      updatedData.cenas = newCenas;
    }

    const defaultVoice = {
      model_id: "eleven_multilingual_v2",
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: true,
      speed: 1.10
    };

    if (!data.voice_settings || Object.keys(data.voice_settings).length < Object.keys(defaultVoice).length) {
      changed = true;
      updatedData.voice_settings = {
        ...defaultVoice,
        ...(data.voice_settings || {})
      };
    }

    if (changed) {
      onChange(updatedData);
    }
  }, [data, onChange]);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
    };
    loadProducts();
  }, []);

  // Asset Helpers
  const getSceneImage = (numero: number) => imagens.find(img => Number(img.numero_cena || (img as unknown as { numero: string | number }).numero) === Number(numero));
  const getSceneAudio = (numero: number) => audios.find(aud => Number(aud.numero_cena || (aud as unknown as { numero: string | number }).numero) === Number(numero));
  const getSceneVideo = (numero: number) => videos_cenas.find(vid => Number(vid.numero_cena) === Number(numero));

  const currentImage = getSceneImage(currentScene?.numero);
  const currentAudio = getSceneAudio(currentScene?.numero);
  const currentVideo = getSceneVideo(currentScene?.numero);

  // Validation
  const allScenesRendered = data.cenas.every(c => getSceneVideo(c.numero));
  const renderedCount = data.cenas.filter(c => getSceneVideo(c.numero)).length;

  const finalVideo = videos && videos.length > 0 ? videos[0] : null;
  const [previewMode, setPreviewMode] = useState<'scene' | 'final'>(finalVideo ? 'final' : 'scene');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);

  const updateScene = (idx: number, updates: Partial<VideoScene>) => {
    const newCenas = [...data.cenas];
    
    // Auto-sync prompt to replicate config if prompt_visual is updated
    if (updates.prompt_visual && newCenas[idx].replicate) {
      updates.replicate = {
        ...newCenas[idx].replicate!,
        input: {
          ...newCenas[idx].replicate!.input,
          prompt: updates.prompt_visual
        }
      };
    }

    newCenas[idx] = { ...newCenas[idx], ...updates };
    onChange({ ...data, cenas: newCenas });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none overflow-hidden">
      
      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* 1. CINEMATIC PREVIEW (Left - Dominant) */}
        <div className="flex-[1.5] flex flex-col bg-black relative border-r border-zinc-900 min-h-0">
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
            
            {/* Context Switcher */}
            {finalVideo && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-full p-1 shadow-2xl scale-90 lg:scale-100">
                <button 
                  onClick={() => setPreviewMode('scene')}
                  className={clsx(
                    "px-6 py-1.5 text-[10px] font-black uppercase rounded-full transition-all", 
                    previewMode === 'scene' ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Visualização de Cena
                </button>
                <button 
                  onClick={() => setPreviewMode('final')}
                  className={clsx(
                    "px-6 py-1.5 text-[10px] font-black uppercase rounded-full transition-all", 
                    previewMode === 'final' ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Master Final
                </button>
              </div>
            )}

            <div className="aspect-[9/16] h-full max-h-[85vh] bg-zinc-900/50 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative border-4 border-zinc-800/50 group">
                {previewMode === 'final' && finalVideo ? (
                  <video src={finalVideo.video_final_url} controls autoPlay className="w-full h-full object-cover" />
                ) : currentVideo?.video_url ? (
                  <div className="w-full h-full relative">
                    <video 
                      src={currentVideo.video_url} 
                      controls 
                      autoPlay 
                      muted={isMuted} 
                      loop 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute bottom-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/80 transition-all z-20"
                    >
                      {isMuted ? <Volume2 className="w-5 h-5 opacity-50" /> : <Volume2 className="w-5 h-5 text-indigo-400" />}
                    </button>
                  </div>
                ) : currentImage?.image_url ? (
                  <div className="w-full h-full relative">
                    <Image src={currentImage.image_url} alt="Preview" fill unoptimized className="object-cover" />
                    {currentAudio?.audio_url && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4/5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 z-20">
                        <button 
                          onClick={() => {
                            const audio = document.getElementById('preview-audio') as HTMLAudioElement;
                            if (audio.paused) audio.play(); else audio.pause();
                          }}
                          className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <audio id="preview-audio" src={currentAudio.audio_url} className="w-full h-8 accent-indigo-500" controls />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 p-12 text-center">
                    <Film className="w-16 h-16 text-zinc-800 animate-pulse" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Aguardando Produção Visual</p>
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                  <div className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-xl uppercase tracking-widest">
                    Cena {currentScene?.numero}
                  </div>
                  {currentVideo && (
                    <div className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-full shadow-lg uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Render OK
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* 2. PRODUCTION CONTROL (Right) */}
        <div className="flex-[1] flex flex-col bg-zinc-900/40 backdrop-blur-md overflow-y-auto custom-scrollbar border-l border-zinc-900 min-w-[350px]">
          
          {/* Action Hub */}
          <div className="p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Controle de Cena</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={clsx(
                    "p-2.5 rounded-xl border transition-all",
                    showAdvanced ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white"
                  )}
                  title="Configurações Avançadas"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => generateSceneAssets(postId as string, currentScene, data.voice_settings)}
                  disabled={isProcessing}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
                  title="Gerar Assets (Imagem/Áudio)"
                >
                  <Sparkles className={clsx("w-4 h-4", isProcessing && "animate-spin")} />
                </button>
                <button 
                  onClick={() => {
                    if (!currentImage || !currentAudio) return alert("Gere os assets primeiro!");
                    renderScene(postId as string, currentScene, {
                      image_url: currentImage.image_url || currentImage.url_imagem_fundo || '',
                      audio_url: currentAudio.audio_url || '',
                      timestamps_url: currentAudio.timestamps || '',
                      animacao: currentScene.animacao || 'zoom_in'
                    });
                  }}
                  disabled={isProcessing || !currentImage}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
                  title="Renderizar Cena"
                >
                  <Film className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Modelo de Imagem</span>
                  </div>
                  <select 
                    value={currentScene.replicate?.model_url || AVAILABLE_MODELS[0].url}
                    onChange={(e) => updateScene(selectedSceneIdx, {
                      replicate: { ...currentScene.replicate!, model_url: e.target.value }
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-bold text-zinc-400 outline-none appearance-none"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.url} value={m.url}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-indigo-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voz (ElevenLabs)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Estabilidade</label>
                      <input type="range" min="0" max="1" step="0.1" value={data.voice_settings?.stability || 0.7} onChange={(e) => onChange({...data, voice_settings: {...data.voice_settings!, stability: parseFloat(e.target.value)}})} className="w-full accent-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Clareza</label>
                      <input type="range" min="0" max="1" step="0.1" value={data.voice_settings?.similarity_boost || 0.75} onChange={(e) => onChange({...data, voice_settings: {...data.voice_settings!, similarity_boost: parseFloat(e.target.value)}})} className="w-full accent-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Final Production Card */}
            <div className={clsx(
              "p-6 rounded-3xl border-2 transition-all duration-500 shadow-2xl overflow-hidden relative group",
              allScenesRendered 
                ? "bg-emerald-600/10 border-emerald-500/30" 
                : "bg-zinc-900/50 border-zinc-800"
            )}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      allScenesRendered ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {allScenesRendered ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Produção Final</h3>
                      <p className="text-[9px] font-bold text-zinc-500">{renderedCount} de {data.cenas.length} cenas prontas</p>
                    </div>
                  </div>
                  {allScenesRendered && (
                    <button 
                      onClick={() => {
                        const urls = data.cenas.map(c => getSceneVideo(c.numero)!.video_url);
                        compileFinalVideo(postId as string, urls);
                      }}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Compilar Master
                    </button>
                  )}
                </div>
                
                {!allScenesRendered && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-tight">Rrenderize todas as cenas para liberar a compilação</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scene Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Narração</label>
                <textarea 
                  value={currentScene?.texto_narrado}
                  onChange={(e) => updateScene(selectedSceneIdx, { texto_narrado: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-xs leading-relaxed text-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none h-28"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Animação</label>
                   <select 
                    value={currentScene?.animacao || 'zoom_in'}
                    onChange={(e) => updateScene(selectedSceneIdx, { animacao: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-bold text-zinc-400 outline-none appearance-none"
                   >
                     {ANIMATION_OPTIONS.map(opt => (
                       <option key={opt.id} value={opt.id}>{opt.label}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest flex items-center gap-2">
                     Referência Visual
                     {currentScene?.slug_produto && <Database className="w-3 h-3 text-emerald-500 animate-pulse" />}
                   </label>
                   <select 
                    value={currentScene?.slug_produto || ''}
                    onChange={(e) => updateScene(selectedSceneIdx, { 
                      slug_produto: e.target.value,
                      usa_referencia: !!e.target.value 
                    })}
                    className={clsx(
                      "w-full bg-zinc-950 border rounded-xl p-3 text-[10px] font-bold outline-none appearance-none transition-all",
                      currentScene?.slug_produto ? "border-emerald-500/50 text-emerald-400" : "border-zinc-800 text-zinc-400"
                    )}
                   >
                     <option value="">Nenhum (Somente IA)</option>
                     {products.map(p => (
                       <option key={p.slug_embalagem} value={p.slug_embalagem}>{p.Produto}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Prompt Visual (AI)</label>
                  <button 
                    onClick={() => generateSceneImage(postId as string, currentScene)}
                    className="text-amber-500 hover:text-amber-400 text-[8px] font-black uppercase flex items-center gap-1"
                  >
                    <RefreshCw className={clsx("w-2.5 h-2.5", isProcessing && "animate-spin")} /> Regenerar
                  </button>
                </div>
                <textarea 
                  value={currentScene?.prompt_visual}
                  onChange={(e) => updateScene(selectedSceneIdx, { prompt_visual: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-[10px] font-mono text-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RICH TIMELINE (Bottom of Workspace) */}
      <div className="h-52 bg-black/40 border-t border-zinc-900 flex flex-col shrink-0">
        <div className="px-6 py-2 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-indigo-500/50"><Film className="w-3 h-3" /> Timeline de Produção</span>
            <span>{data.cenas.length} Cenas Planejadas</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center px-6 gap-3 overflow-x-auto custom-scrollbar py-4 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]">
           {data.cenas.map((cena, idx) => {
             const isSelected = selectedSceneIdx === idx;
             const sceneImg = getSceneImage(cena.numero);
             const sceneAud = getSceneAudio(cena.numero);
             const sceneVid = getSceneVideo(cena.numero);

             return (
               <div key={idx} className="flex flex-col gap-2 shrink-0 group/scene">
                  <div 
                    className={clsx(
                      "w-48 h-28 rounded-2xl border-2 transition-all relative overflow-hidden",
                      isSelected ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-zinc-900" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    )}
                  >
                    <button 
                      onClick={() => setSelectedSceneIdx(idx)}
                      className="absolute inset-0 w-full h-full text-left"
                    >
                      {sceneVid ? (
                        <video src={sceneVid.video_url} className="w-full h-full object-cover opacity-60 group-hover/scene:opacity-100 transition-opacity" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
                      ) : sceneImg ? (
                        <Image src={sceneImg.image_url || sceneImg.url_imagem_fundo || ''} fill unoptimized className="object-cover opacity-60 group-hover/scene:opacity-100 transition-opacity" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-6 text-center">
                          <p className="text-[7px] font-black text-zinc-700 uppercase leading-tight line-clamp-3">{cena.texto_narrado}</p>
                        </div>
                      )}
                    </button>

                    {/* Scene Indicators & Quick Actions */}
                    <div className="absolute top-2 left-2 flex gap-1.5 z-20">
                       <div className="px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-[8px] font-black text-white rounded-md border border-white/10">
                         #{cena.numero}
                       </div>
                       {cena.slug_produto && (
                         <div className="px-1.5 py-0.5 bg-emerald-500/80 backdrop-blur-md text-[8px] font-black text-white rounded-md border border-emerald-400/20 flex items-center gap-1 shadow-lg">
                           <Database className="w-2.5 h-2.5" />
                           PR REAL
                         </div>
                       )}
                    </div>

                    {/* Progress Dots */}
                    <div className="absolute top-2 right-2 flex gap-1 z-20">
                      <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneImg ? "bg-amber-500" : "bg-zinc-800")} />
                      <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneAud ? "bg-indigo-500" : "bg-zinc-800")} />
                      <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneVid ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-800")} />
                    </div>

                    {/* Processing Overlays (via Production Queue) */}
                    {progress[cena.numero]?.render === 'processing' && (
                      <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[2px] flex items-center justify-center z-30">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Audio Status Bar / Tiny Player */}
                  <div className={clsx(
                    "w-48 rounded-xl border flex flex-col p-2 gap-2 transition-all",
                    isSelected ? "bg-indigo-500/10 border-indigo-500/30" : "bg-zinc-900/50 border-zinc-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <Music className={clsx("w-2.5 h-2.5", sceneAud ? "text-indigo-400" : "text-zinc-700")} />
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={clsx(
                          "h-full transition-all duration-1000",
                          sceneAud ? "w-full bg-indigo-500" : progress[cena.numero]?.audio === 'processing' ? "w-1/2 bg-amber-500 animate-pulse" : "w-0"
                        )} />
                      </div>
                      {sceneAud && (
                        <div className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">OK</div>
                      )}
                    </div>
                    
                    {sceneAud && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const audio = document.getElementById(`audio-${cena.numero}`) as HTMLAudioElement;
                            if (audio.paused) audio.play(); else audio.pause();
                          }}
                          className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-md"
                        >
                          <Play className="w-2.5 h-2.5 text-zinc-400" />
                        </button>
                        <audio 
                          id={`audio-${cena.numero}`} 
                          src={sceneAud.audio_url} 
                          className="h-4 w-full opacity-50 hover:opacity-100 transition-opacity" 
                          controls 
                        />
                      </div>
                    )}
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* FOOTER: PUBLISHING & STATUS */}
      {finalVideo && (
        <div className="h-24 bg-indigo-600 border-t border-indigo-500 px-12 flex items-center justify-between shadow-[0_-20px_50px_rgba(79,70,229,0.2)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter">Vídeo Master Finalizado</h4>
                <p className="text-indigo-100 text-[10px] font-bold opacity-80 uppercase">Pronto para distribuição multi-plataforma</p>
              </div>
            </div>

            {/* Publication Links (Dynamic via Realtime) */}
            <div className="flex items-center gap-2 ml-4">
              {post?.instagram_url && (
                <a 
                  href={post.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Camera className="w-3 h-3" /> Instagram
                </a>
              )}
              {post?.facebook_url && (
                <a 
                  href={post.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Globe className="w-3 h-3" /> Facebook
                </a>
              )}
              {post?.youtube_url && (
                <a 
                  href={post.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Video className="w-3 h-3" /> YouTube
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">             <select 
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-indigo-700/50 border border-indigo-400 text-white text-[10px] font-bold rounded-xl px-4 py-3 outline-none min-w-[200px]"
             >
               <option value="">Selecione a Conta...</option>
               {accounts.map(acc => (
                 <option key={acc.id_conta} value={acc.id_conta}>{acc.nome_conta} ({acc.nicho})</option>
               ))}
             </select>
             <button 
              onClick={() => onPublish?.(selectedAccountId)}
              disabled={!selectedAccountId}
              className="px-10 py-3 bg-white text-indigo-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 group"
             >
               <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               Publicar Agora
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
