import { clsx } from 'clsx';
import { useState } from 'react';
import {
  CheckCircle2, Package, Trash2, PenTool, Image as ImageIcon,
  Music, Video, Loader2, AlertCircle, Sparkles, ExternalLink,
  MoreHorizontal, Smartphone, Type, Globe, CalendarDays,
  Download, Copy, Share2
} from 'lucide-react';
import ImageModelSelector from '@/components/image-model-selector';
import { IMAGE_MODELS, getModelById } from '@/lib/image-models';
import DateTimePicker from '@/components/date-time-picker';

interface ProductionItem {
  uuid: string;
  produto: string;
  slug: string;
  status: 'Aguardando' | 'Processando' | 'Pronto' | 'Erro';
  videoUrl?: string;
  images: string[];
  audios: string[];
  customPrompt?: string;
  tituloOtimizado?: string;
  captions?: string;
  hashtags?: string;
  status_agendamento?: string;
  data_agendamento?: string;
  statusDetalhe?: string;
  
  // Staging Area Flags
  hasScript?: boolean;
  scriptGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  captionsGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  imagesGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  audiosGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  videoGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';

  // Strategy overrides
  imageStrategy?: 'ai' | 'produto' | 'embalagem' | 'ambos';
  imageModelOverride?: string;
  voiceIdOverride?: string;
  voiceModelOverride?: string;
}

interface ProductionCardProps {
  item: ProductionItem;
  activeTab: 'video' | 'caption' | 'publish' | 'schedule';
  setCardTab: (tab: 'video' | 'caption' | 'publish' | 'schedule') => void;
  progress: number;
  publishingStatus: Record<string, any>;
  accountName?: string;
  onDiscard: (uuid: string) => void;
  onGenerateAll: (item: ProductionItem) => void;
  onGenerateScript: (item: ProductionItem) => void;
  onGenerateImages: (item: ProductionItem) => void;
  onGenerateAudios: (item: ProductionItem) => void;
  onGenerateVideo: (item: ProductionItem) => void;
  onUpdateState: (uuid: string, updates: Partial<ProductionItem>) => void;
  onDownload: (url: string, filename: string) => void;
  onCopyText: (text: string, type: string) => void;
  onPublishPlatform: (postId: string, platform: string) => void;
  onPublishAll: (postId: string) => void;
  onSchedule: (postId: string, dateStr: string) => void;
  activeImageModel?: string;
}

export default function ProductionCard({
  item, activeTab, setCardTab, progress, publishingStatus, accountName,
  onDiscard, onGenerateAll, onGenerateScript, onGenerateImages,
  onGenerateAudios, onGenerateVideo, onUpdateState, onDownload,
  onCopyText, onPublishPlatform, onPublishAll, onSchedule, activeImageModel
}: ProductionCardProps) {
  const [scheduleDate, setScheduleDate] = useState(
    item.data_agendamento ? new Date(item.data_agendamento).toISOString().substring(0, 16) : ''
  );
  return (
    <div className={clsx(
      "rounded-3xl border transition-all shadow-xl overflow-hidden backdrop-blur-md",
      item.status === 'Pronto' 
        ? "bg-white/80 dark:bg-zinc-900/80 border-emerald-500/30 hover:shadow-emerald-500/10" 
        : "bg-white/60 dark:bg-zinc-900/60 border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-500/30"
    )}>
      {/* Progress Bar Top */}
      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800">
        <div className={clsx("h-full transition-all duration-1000 ease-in-out", item.status === 'Pronto' ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${progress}%` }} />
      </div>
      
      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-center">
             <div className={clsx(
               "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all bg-cover bg-center overflow-hidden shrink-0 border border-zinc-200/50 dark:border-zinc-800/50",
               (item.images?.length ?? 0) > 0 ? "" :
               item.status === 'Pronto' 
                 ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30" 
                 : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-500 dark:text-zinc-400"
             )}
             style={{
               backgroundImage: (item.images?.length ?? 0) > 0 ? `url(${item.images![0]})` : undefined
             }}
             >
                {(item.images?.length ?? 0) === 0 && (
                  item.status === 'Pronto' ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />
                )}
             </div>
             <div className="min-w-0">
               <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1 line-clamp-2">{item.produto}</h4>
               <div className="flex items-center gap-2 mt-0.5">
                 <p className="text-[10px] font-mono text-zinc-400 tracking-wider">ID: {item.uuid.substring(0,12)}</p>
                 {accountName && (
                   <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 truncate max-w-[120px]">
                     {accountName}
                   </span>
                 )}
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={clsx(
              "text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm",
              item.status === 'Pronto'
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : item.status === 'Processando'
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse"
                  : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
            )}>
              {item.status}
            </span>
            {(item.hasScript || item.status === 'Pronto' || item.status === 'Erro') && (
              <button
                onClick={(e) => { e.stopPropagation(); onDiscard(item.uuid); }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors bg-white/50 dark:bg-zinc-800/50 relative z-50"
                title="Descartar conteúdo gerado"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* IF NOT READY: PIPELINE STEPS AND GENERATE BUTTONS */}
        {item.status !== 'Pronto' && (
          <div className="bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", item.hasScript ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><PenTool className="w-3 h-3"/></div>
                   <div className={clsx("w-6 h-px", item.hasScript ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                   <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", (item.images?.length ?? 0) > 0 ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><ImageIcon className="w-3 h-3"/></div>
                   <div className={clsx("w-6 h-px", (item.images?.length ?? 0) > 0 ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                   <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", (item.audios?.length ?? 0) > 0 ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><Music className="w-3 h-3"/></div>
                   <div className={clsx("w-6 h-px", (item.audios?.length ?? 0) > 0 ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                   <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", item.videoGeneratingStatus === 'success' ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><Video className="w-3 h-3"/></div>
                </div>
                <span className="text-[9px] font-black uppercase text-zinc-400">{progress}% Completo</span>
             </div>

             <div className="space-y-2">
                <button 
                  onClick={() => onGenerateAll(item)}
                  disabled={item.status === 'Processando'}
                  className={clsx(
                    "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                    item.status === 'Processando' ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" : 
                    item.status === 'Erro' ? "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20" :
                    "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-[1.02]"
                  )}
                >
                  {item.status === 'Processando' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   item.status === 'Erro' ? <AlertCircle className="w-4 h-4" /> :
                   <Sparkles className="w-4 h-4" />}
                  {item.status === 'Processando' ? (item.statusDetalhe || 'Processando Automação...') : 
                   item.status === 'Erro' ? 'Tentar Novamente (Reprocessar)' :
                   'Gerar Vídeo Completo (Auto)'}
                </button>
                
                {item.hasScript ? (
                  <a 
                     href={`/conteudo/editor/${item.uuid}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  >
                     <ExternalLink className="w-3 h-3" /> Abrir no Estúdio
                  </a>
                ) : (
                  <button 
                    onClick={() => onGenerateScript(item)}
                    disabled={item.scriptGeneratingStatus === 'generating'}
                    className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-500/20 hover:border-zinc-500/50 text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {item.scriptGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <PenTool className="w-3 h-3" />} Gerar Roteiro
                  </button>
                )}
                
                <details className="col-span-2 group" open>
                   <summary className="text-[9px] font-bold uppercase text-zinc-400 hover:text-indigo-400 cursor-pointer flex items-center justify-center gap-1 mt-2">
                     <MoreHorizontal className="w-3 h-3" /> Controles Avançados
                   </summary>
                   <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      {/* Nível 3: Seletor de Modelo por Vídeo */}
                      <ImageModelSelector
                        value={item.imageModelOverride || activeImageModel || 'google/nano-banana'}
                        onChange={(modelId) => onUpdateState(item.uuid, { imageModelOverride: modelId })}
                        size="compact"
                        label={item.imageModelOverride ? 'Modelo Imagem (Override)' : 'Modelo Imagem (Herdado)'}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="w-full text-[10px] p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 font-bold tracking-wider disabled:opacity-50"
                          value={item.voiceIdOverride || ''}
                          onChange={e => onUpdateState(item.uuid, { voiceIdOverride: e.target.value || undefined })}
                        >
                          <option value="">Voz (Herdada)</option>
                          <option value="EXAVITQu4vr4xnSDxMaL">Bella (Soft/Female)</option>
                          <option value="pNInz6obpgDQGcFmaJgB">Adam (Deep/Narration)</option>
                          <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm/Female)</option>
                          <option value="ErXwobaYiN019PkySvjV">Antoni (Well-rounded)</option>
                          <option value="TX3OmfQAelAqweILnX">Josh (Deep/Male)</option>
                        </select>
                        <select
                          className="w-full text-[10px] p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 font-bold tracking-wider disabled:opacity-50"
                          value={item.voiceModelOverride || ''}
                          onChange={e => onUpdateState(item.uuid, { voiceModelOverride: e.target.value || undefined })}
                        >
                          <option value="">IA (Herdada)</option>
                          <option value="eleven_multilingual_v2">Multilingual v2</option>
                          <option value="eleven_turbo_v2_5">Turbo v2.5</option>
                        </select>
                      </div>
                      {(item.imageModelOverride || item.voiceIdOverride || item.voiceModelOverride) && (
                        <button 
                          onClick={() => onUpdateState(item.uuid, { imageModelOverride: undefined, voiceIdOverride: undefined, voiceModelOverride: undefined })}
                          className="text-[8px] font-bold text-indigo-500 hover:text-indigo-400 uppercase self-end"
                        >
                          ↩ Resetar para Preset
                        </button>
                      )}
                      {(() => {
                        const effectiveModel = item.imageModelOverride || activeImageModel || 'google/nano-banana';
                        const modelInfo = getModelById(effectiveModel);
                        const supportsRef = modelInfo?.supportsReference ?? false;
                        return (
                          <>
                            {!supportsRef && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-2 text-amber-500">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span className="text-[9px] font-bold">Este modelo não suporta injeção de imagens de produto.</span>
                              </div>
                            )}
                            <select
                              className="w-full text-[10px] p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider disabled:opacity-50"
                              value={item.imageStrategy || 'ai'}
                              onChange={e => onUpdateState(item.uuid, { imageStrategy: e.target.value as any })}
                            >
                              <option value="ai">Gerar Cenários (IA)</option>
                              <option value="produto" disabled={!supportsRef}>Usar Imagem do Produto</option>
                              <option value="embalagem" disabled={!supportsRef}>Usar Imagem da Embalagem</option>
                            </select>
                          </>
                        );
                      })()}
                      <textarea
                        className="w-full text-xs p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 resize-none min-h-[60px]"
                        placeholder="Ajuste fino (ex: 'Mude o tema para guaraná')..."
                        value={item.customPrompt || ''}
                        onChange={e => onUpdateState(item.uuid, { customPrompt: e.target.value })}
                      />
                      <div className="grid grid-cols-4 gap-1.5">
                         <button onClick={() => onGenerateScript(item)} disabled={item.scriptGeneratingStatus === 'generating'} className="py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                           {item.scriptGeneratingStatus === 'generating' ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <PenTool className="w-2.5 h-2.5" />} Roteiro
                         </button>
                         <button onClick={() => onGenerateImages(item)} disabled={!item.hasScript || item.imagesGeneratingStatus === 'generating'} className="py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                           {item.imagesGeneratingStatus === 'generating' ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <ImageIcon className="w-2.5 h-2.5" />} Imagens
                         </button>
                         <button onClick={() => onGenerateAudios(item)} disabled={!item.hasScript || item.audiosGeneratingStatus === 'generating'} className="py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                           {item.audiosGeneratingStatus === 'generating' ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <Music className="w-2.5 h-2.5" />} Áudios
                         </button>
                         <button onClick={() => onGenerateVideo(item)} disabled={!item.hasScript || item.videoGeneratingStatus === 'generating'} className="py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                           {item.videoGeneratingStatus === 'generating' ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <Video className="w-2.5 h-2.5" />} Vídeo
                         </button>
                      </div>
                   </div>
                </details>
             </div>

             {item.hasScript && (
               <a 
                 href={`/conteudo/editor/${item.uuid}`} 
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full mt-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
               >
                 <ExternalLink className="w-3 h-3" /> Abrir no Estúdio Criativo
               </a>
             )}
          </div>
        )}

        {/* IF READY: COMPACT TABS */}
        {item.status === 'Pronto' && item.videoUrl && (
          <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden shadow-inner">
             <div className="flex bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={() => setCardTab('video')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'video' ? "bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 border-t-2 border-t-emerald-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Smartphone className="w-3 h-3"/> Mídia</button>
                <button onClick={() => setCardTab('caption')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'caption' ? "bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Type className="w-3 h-3"/> Legenda</button>
                <button onClick={() => setCardTab('publish')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'publish' ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Globe className="w-3 h-3"/> Postar</button>
                <button onClick={() => setCardTab('schedule')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'schedule' ? "bg-white dark:bg-zinc-950 text-purple-600 dark:text-purple-400 border-t-2 border-t-purple-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><CalendarDays className="w-3 h-3"/> Agendar</button>
             </div>

             <div className="p-4">
                {activeTab === 'video' && (
                   <div className="space-y-3 animate-in fade-in duration-300">
                     <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-60 mx-auto bg-black relative shadow-lg ring-1 ring-zinc-800">
                       <video src={item.videoUrl} controls playsInline className="w-full h-full object-cover" />
                     </div>
                     <button onClick={() => onDownload(item.videoUrl!, `video-${item.slug || 'slug'}-${item.uuid.substring(0,8)}.mp4`)} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5">
                       <Download className="w-3.5 h-3.5" /> Baixar MP4 HD
                     </button>
                   </div>
                )}

                {activeTab === 'caption' && (
                   <div className="space-y-3 animate-in fade-in duration-300">
                     <div className="max-h-48 overflow-y-auto text-[10px] text-zinc-600 dark:text-zinc-300 font-medium whitespace-pre-wrap pr-2 custom-scrollbar flex flex-col justify-center">
                       {item.captionsGeneratingStatus === 'generating' ? (
                         <div className="py-8 flex flex-col items-center justify-center text-indigo-500 opacity-70">
                           <Loader2 className="w-6 h-6 animate-spin mb-2" />
                           <span className="text-[9px] font-bold uppercase tracking-widest">Escrevendo Legenda...</span>
                         </div>
                       ) : item.captions ? (
                         <>
                           <p className="font-extrabold text-zinc-800 dark:text-zinc-100 mb-2">{item.tituloOtimizado}</p>
                           <p>{item.captions}</p>
                           <p className="mt-3 text-indigo-500 dark:text-indigo-400 font-mono text-[9px]">{item.hashtags}</p>
                         </>
                       ) : <span className="italic text-zinc-400">Nenhuma legenda gerada.</span>}
                     </div>
                     <button onClick={() => onCopyText(`${item.captions || ''}\n\n${item.hashtags || ''}`, 'Conteúdo')} disabled={!item.captions} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                       <Copy className="w-3.5 h-3.5" /> Copiar Tudo
                     </button>
                   </div>
                )}

                {activeTab === 'publish' && (
                   <div className="space-y-3 animate-in fade-in duration-300">
                     <div className="grid grid-cols-1 gap-2">
                        {(['instagram', 'youtube', 'facebook'] as const).map((platform) => {
                          const status = publishingStatus[item.uuid]?.[platform];
                          const isPublishing = status === 'publishing';
                          const isPublished = status === 'published';
                          const isError = status === 'error';
                          const platformConfig = {
                            instagram: { label: 'Instagram Reels', color: 'bg-pink-500', hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950/20' },
                            youtube: { label: 'YouTube Shorts', color: 'bg-red-500', hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/20' },
                            facebook: { label: 'Facebook', color: 'bg-blue-500', hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/20' },
                          };
                          const cfg = platformConfig[platform];
                          return (
                            <button 
                              key={platform}
                              onClick={() => onPublishPlatform(item.uuid, platform)} 
                              disabled={item.status !== 'Pronto' || isPublishing || isPublished} 
                              className={clsx(
                                "w-full py-2.5 rounded-xl text-[9px] font-bold uppercase transition-all border flex items-center justify-between px-4",
                                isPublished 
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                  : isPublishing 
                                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 animate-pulse"
                                  : isError
                                  ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-500"
                                  : `bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 ${cfg.hoverBg}`
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <div className={clsx("w-2 h-2 rounded-full", isPublished ? "bg-emerald-500" : isError ? "bg-red-500" : cfg.color)} />
                                {cfg.label}
                              </span>
                              <span className="flex items-center gap-1">
                                {isPublishing && <Loader2 className="w-3 h-3 animate-spin" />}
                                {isPublished ? '✓ ENVIADO' : isPublishing ? 'ENVIANDO...' : isError ? '✕ ERRO' : 'POSTAR'}
                              </span>
                            </button>
                          );
                        })}
                     </div>
                     {(() => {
                       const allStatus = publishingStatus[item.uuid]?.all;
                       const anyPublishing = ['instagram', 'youtube', 'facebook'].some(p => publishingStatus[item.uuid]?.[p] === 'publishing');
                       const allPublished = ['instagram', 'youtube', 'facebook'].every(p => publishingStatus[item.uuid]?.[p] === 'published');
                       return (
                         <button 
                           onClick={() => onPublishAll(item.uuid)} 
                           disabled={item.status !== 'Pronto' || anyPublishing || allPublished} 
                           className={clsx(
                             "w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5",
                             allPublished
                               ? "bg-emerald-600 text-white cursor-default"
                               : anyPublishing
                               ? "bg-blue-400 text-white animate-pulse cursor-wait"
                               : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                           )}
                         >
                           {allPublished ? (
                             <><CheckCircle2 className="w-3.5 h-3.5" /> Publicado em Todos</>
                           ) : anyPublishing ? (
                             <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Disparando...</>
                           ) : (
                             <><Share2 className="w-3.5 h-3.5" /> Disparar em Todos</>
                           )}
                         </button>
                       );
                     })()}
                   </div>
                )}

                {activeTab === 'schedule' && (
                   <div className="space-y-4 animate-in fade-in duration-300">
                     <div className="flex flex-col gap-2">
                       <label className="text-[9px] font-black uppercase text-zinc-500">Data e Hora de Publicação</label>
                       <DateTimePicker
                         value={scheduleDate}
                         onChange={setScheduleDate}
                       />
                     </div>
                     <button disabled={item.status !== 'Pronto' || !scheduleDate} onClick={() => {
                       if (!scheduleDate) { alert('Escolha uma data.'); return; }
                       onSchedule(item.uuid, scheduleDate);
                     }} className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 disabled:cursor-not-allowed">
                       <CalendarDays className="w-3.5 h-3.5" /> {item.status_agendamento === 'agendado' ? 'Atualizar Agendamento' : 'Programar Publicação'}
                     </button>
                     {item.status_agendamento === 'agendado' && (
                       <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-2 rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Agendado para {new Date(item.data_agendamento!).toLocaleDateString('pt-BR')} às {new Date(item.data_agendamento!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                     )}
                   </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
