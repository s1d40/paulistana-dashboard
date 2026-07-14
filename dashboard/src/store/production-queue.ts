import { create } from 'zustand';
import { VideoScene, CarrosselScene, ElevenLabsVoiceSettings, ReplicateConfig, SatoriPayload } from '@/types/content-studio';
import { PostImage, PostAudio } from '@/services/supabase-service';

export type WorkerStatus = 'idle' | 'waiting' | 'processing' | 'success' | 'error';

interface SceneProgress {
  numero: number;
  audio: WorkerStatus;
  image: WorkerStatus;
  render: WorkerStatus;
  urls: {
    audio?: string;
    image?: string;
    render?: string;
    timestamps?: string;
  };
  error?: string;
}

// Union type for any scene type that can be processed
export type ProductionScene = VideoScene | CarrosselScene | { numero: number; prompt_visual: string; replicate?: ReplicateConfig; payload_api?: SatoriPayload; texto_narrado?: string };

interface RenderPayload {
  image_url: string;
  audio_url: string;
  timestamps_url: string;
  animacao: string;
  image_reference_url?: string | string[];
}

interface ProductionQueueState {
  isProcessing: boolean;
  activePostId: string | null;
  progress: Record<number, SceneProgress>;
  
  startProduction: (postId: string, scenes: ProductionScene[], voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  generateAssets: (postId: string, scenes: ProductionScene[], voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  generateSceneAssets: (postId: string, scene: ProductionScene, voiceSettings?: ElevenLabsVoiceSettings, imageReferenceUrl?: string | string[]) => Promise<void>;
  generateSceneImage: (postId: string, scene: ProductionScene, imageReferenceUrl?: string | string[]) => Promise<void>;
  generateSceneAudio: (postId: string, scene: ProductionScene, voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  renderScene: (postId: string, scene: ProductionScene, renderData: RenderPayload) => Promise<void>;
  renderAllScenes: (postId: string, scenes: ProductionScene[], allImagens: PostImage[], allAudios: PostAudio[]) => Promise<void>;
  compileFinalVideo: (postId: string, sceneVideoUrls: string[]) => Promise<void>;
  reset: () => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const resolveReferenceUrls = (
  usaReferencia?: boolean | null,
  slugProduto?: string | null,
  tipoReferencia?: string | null
): string | string[] | undefined => {
  if (!usaReferencia || !slugProduto) return undefined;
  
  const GCS_BASE_URL = 'https://storage.googleapis.com/cocreator_content';
  const folder = tipoReferencia === 'embalagem' ? 'embalagem' : 'produtos_reais';
  
  const cleanSlugs = slugProduto
    .replace(/\s+e\s+/gi, ',')
    .replace(/\s+and\s+/gi, ',')
    .replace(/;/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (cleanSlugs.length === 0) return undefined;

  const urls = cleanSlugs.map(slug => {
    const hasExtension = /\.(png|jpg|jpeg|webp)$/i.test(slug);
    const fileName = hasExtension ? slug : `${slug}.png`;
    return `${GCS_BASE_URL}/${folder}/${fileName}`;
  });

  return urls.length === 1 ? urls[0] : urls;
};

const authHeader = { 'Content-Type': 'application/json' };
const PROXY_WORKER = '/api/worker'; 

export const useProductionQueue = create<ProductionQueueState>((set, get) => ({
  isProcessing: false,
  activePostId: null,
  progress: {},

  reset: () => set({ isProcessing: false, activePostId: null, progress: {} }),

  generateSceneImage: async (postId, scene, imageReferenceUrl) => {
    console.log('[Queue] 🖼 Generating Scene Image:', { postId, sceneNumero: scene.numero });
    const n = scene.numero;
    const videoScene = scene as VideoScene;
    const carrosselScene = scene as CarrosselScene;
    const isCarrossel = !videoScene.replicate && !!carrosselScene.payload_api;

    set(state => ({ 
      progress: { 
        ...state.progress, 
        [n]: { 
          ...(state.progress[n] || { numero: n, audio: 'idle', image: 'idle', render: 'idle', urls: {} }), 
          image: 'processing'
        } 
      } 
    }));

    try {
      // Build payload_replicate to send a ready-to-use Replicate body to n8n
      let payloadReplicate: Record<string, any> | undefined = undefined;
      if (!isCarrossel && videoScene.replicate) {
        
        // 1. Sanitização Universal: Se o LLM ou o banco gerou image_input como string pura, forçar para Array.
        if (typeof videoScene.replicate.input?.image_input === 'string') {
          videoScene.replicate.input.image_input = [videoScene.replicate.input.image_input];
        }

        const inputCopy = { ...videoScene.replicate.input };
        
        // 2. Sobrescrever com a referência manual do Estúdio (se houver)
        if (imageReferenceUrl) {
          inputCopy.image_input = Array.isArray(imageReferenceUrl)
            ? imageReferenceUrl
            : [imageReferenceUrl];
        } else if (!inputCopy.image_input || (Array.isArray(inputCopy.image_input) && inputCopy.image_input.length === 0)) {
          // Se não tem referência NENHUMA (nem do estúdio nem da IA), remove o campo para não bugar o Replicate
          delete inputCopy.image_input;
        }

        payloadReplicate = {
          input: inputCopy
        };
      }

      const response = await fetch(PROXY_WORKER, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ 
          type: 'image',
          id_post: postId, 
          id_cena: (scene as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).id_cena,
          numero_cena: n, 
          replicate: videoScene.replicate,
          payload_api: carrosselScene.payload_api,
          is_carrossel: !!isCarrossel,
          image_reference_url: imageReferenceUrl, // Pass the resolved GCS URL
          payload_replicate: payloadReplicate // Flat Replicate payload for n8n
        })
      });
      console.log('[Queue] 🖼 Image Gen Request Sent:', response.status);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], image: 'success' } } }));
    } catch (err) {
      console.error(`Image Gen Error ${n}:`, err);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], image: 'error' } } }));
    }
  },

  generateSceneAudio: async (postId, scene, voiceSettings) => {
    console.log('[Queue] 🎙 Generating Scene Audio:', { postId, sceneNumero: scene.numero });
    const n = scene.numero;
    const texto_narrado = (scene as VideoScene).texto_narrado;
    if (!texto_narrado) {
      console.warn('[Queue] 🎙 Missing texto_narrado for scene', n);
      return;
    }

    set(state => ({ 
      progress: { 
        ...state.progress, 
        [n]: { 
          ...(state.progress[n] || { numero: n, audio: 'idle', image: 'idle', render: 'idle', urls: {} }), 
          audio: 'processing'
        } 
      } 
    }));

    const finalVoiceSettings = {
      voice_id: voiceSettings?.voice_id || 'EXAVITQu4vr4xnSDxMaL',
      model_id: voiceSettings?.model_id || "eleven_multilingual_v2",
      stability: voiceSettings?.stability ?? 0.7,
      similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
      style: voiceSettings?.style ?? 0.15,
      use_speaker_boost: voiceSettings?.use_speaker_boost ?? true,
      speed: voiceSettings?.speed ?? 1.10
    };

    try {
      const response = await fetch(PROXY_WORKER, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ type: 'audio', id_post: postId, id_cena: (scene as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).id_cena, numero_cena: n, texto_narrado, voice_settings: finalVoiceSettings })
      });
      console.log('[Queue] 🎙 Audio Gen Request Sent:', response.status);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], audio: 'success' } } }));
    } catch (err) {
      console.error(`Audio Gen Error ${n}:`, err);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], audio: 'error' } } }));
    }
  },

  generateSceneAssets: async (postId, scene, voiceSettings, imageReferenceUrl) => {
    const state = get();
    set({ isProcessing: true });
    try {
      await state.generateSceneAudio(postId, scene, voiceSettings);
      await sleep(2000);
      await state.generateSceneImage(postId, scene, imageReferenceUrl);
    } finally {
      // Small delay before setting to false to allow n8n a head start
      setTimeout(() => set({ isProcessing: false }), 2000);
    }
  },

  generateAssets: async (postId, scenes, voiceSettings) => {
    set({ isProcessing: true, activePostId: postId });
    const state = get();
    try {
      for (const scene of scenes) {
        // Resolve reference URL if needed
        const videoScene = scene as VideoScene;
        const refUrl = resolveReferenceUrls(
          videoScene.usa_referencia,
          videoScene.slug_produto,
          videoScene.tipo_referencia
        );

        await state.generateSceneAudio(postId, scene, voiceSettings);
        await sleep(2000);
        await state.generateSceneImage(postId, scene, refUrl);
        await sleep(4000);
      }
    } finally {
      setTimeout(() => set({ isProcessing: false }), 5000);
    }
  },

  renderScene: async (postId, scene, renderData) => {
    console.log('--- PRODUCTION QUEUE v2.4: Rendering Scene ---', { postId, numero: scene.numero, renderData });
    const n = scene.numero;
    set(state => ({ 
      isProcessing: true, 
      progress: { 
        ...state.progress, 
        [n]: { 
          ...(state.progress[n] || { numero: n, audio: 'idle', image: 'idle', render: 'idle', urls: {} }), 
          render: 'processing' 
        } 
      } 
    }));

    try {
      // Triggering rebuild with this comment - Ensure all assets are passed to n8n
      await fetch(PROXY_WORKER, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ 
          type: 'render',
          id_post: postId, 
          id_cena: (scene as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).id_cena,
          numero_cena: n, 
          action: 'render_scene',
          ...renderData
        })
      });
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], render: 'success' } } }));
      // Increase delay to 8s to let FFMPEG finish and clear resources
      await sleep(8000);
    } catch (err) {
      console.error(`Render Scene Error ${n}:`, err);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], render: 'error' } } }));
    } finally {
      set({ isProcessing: false });
    }
  },

  renderAllScenes: async (postId, scenes, allImagens, allAudios) => {
    set({ isProcessing: true });
    const state = get();
    
    for (const scene of scenes) {
      const n = scene.numero;
      const sceneImg = allImagens.find(img => Number(img.numero_cena) === n);
      const sceneAud = allAudios.find(aud => Number(aud.numero_cena) === n);
      
      const videoScene = scene as VideoScene;
      const refUrl = resolveReferenceUrls(
        videoScene.usa_referencia,
        videoScene.slug_produto,
        videoScene.tipo_referencia
      );

      const renderData: RenderPayload = {
        image_url: sceneImg?.image_url || '',
        audio_url: sceneAud?.audio_url || '',
        timestamps_url: sceneAud?.timestamps || '',
        animacao: (scene as VideoScene).animacao || 'zoom_in',
        image_reference_url: refUrl
      };

      if (!renderData.image_url || !renderData.audio_url || !renderData.timestamps_url) {
        console.warn(`Skipping Scene ${n}: Assets missing`, renderData);
        continue;
      }

      await state.renderScene(postId, scene, renderData);
      // Wait 10s between scenes in the batch
      await sleep(10000);
    }
    set({ isProcessing: false });
  },

  compileFinalVideo: async (postId, video_urls) => {
    set({ isProcessing: true });
    try {
      await sleep(8000);
      await fetch(PROXY_WORKER, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ type: 'final', id_post: postId, video_urls, action: 'compile_final' })
      });
      alert('Compilação final iniciada!');
    } catch (err) {
      console.error('Erro na compilação final:', err);
      alert('Erro ao iniciar compilação final.');
    } finally {
      set({ isProcessing: false });
    }
  },

  startProduction: async (postId, scenes, voiceSettings) => {
    const state = get();
    await state.generateAssets(postId, scenes, voiceSettings);
  }
}));
