import { create } from 'zustand';
import { VideoScene, CarrosselScene, ElevenLabsVoiceSettings, ReplicateConfig, SatoriPayload } from '@/types/content-studio';
import { PostImage, PostAudio } from '@/services/google-sheets';

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
  image_reference_url?: string;
}

interface ProductionQueueState {
  isProcessing: boolean;
  activePostId: string | null;
  progress: Record<number, SceneProgress>;
  
  startProduction: (postId: string, scenes: ProductionScene[], voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  generateAssets: (postId: string, scenes: ProductionScene[], voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  generateSceneAssets: (postId: string, scene: ProductionScene, voiceSettings?: ElevenLabsVoiceSettings, imageReferenceUrl?: string) => Promise<void>;
  generateSceneImage: (postId: string, scene: ProductionScene, imageReferenceUrl?: string) => Promise<void>;
  generateSceneAudio: (postId: string, scene: ProductionScene, voiceSettings?: ElevenLabsVoiceSettings) => Promise<void>;
  renderScene: (postId: string, scene: ProductionScene, renderData: RenderPayload) => Promise<void>;
  renderAllScenes: (postId: string, scenes: ProductionScene[], allImagens: PostImage[], allAudios: PostAudio[]) => Promise<void>;
  compileFinalVideo: (postId: string, sceneVideoUrls: string[]) => Promise<void>;
  reset: () => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const authHeader = { 'Authorization': 'Bearer RqsEZoRFwm6zW8Rs', 'Content-Type': 'application/json' };
const WORKER_AUDIO = 'https://n8n.sfaisolutions.com/webhook/fa8faa6a-cd80-42c8-a591-de5ab1312bc9';
const WORKER_IMAGE = 'https://n8n.sfaisolutions.com/webhook/b0ad003d-54ce-44c9-a143-574f04b24d4a';
const WORKER_RENDER = 'https://n8n.sfaisolutions.com/webhook/a182e7fd-832f-42a8-9e8d-b404acdac2c9'; 
const WORKER_FINAL = 'https://n8n.sfaisolutions.com/webhook/2651caa0-5c55-4bda-ac84-bf8d49f07836'; 

export const useProductionQueue = create<ProductionQueueState>((set, get) => ({
  isProcessing: false,
  activePostId: null,
  progress: {},

  reset: () => set({ isProcessing: false, activePostId: null, progress: {} }),

  generateSceneImage: async (postId, scene, imageReferenceUrl) => {
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
      await fetch(WORKER_IMAGE, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ 
          id_post: postId, 
          numero_cena: n, 
          replicate: videoScene.replicate,
          payload_api: carrosselScene.payload_api,
          is_carrossel: !!isCarrossel,
          image_reference_url: imageReferenceUrl // Pass the resolved GCS URL
        })
      });
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], image: 'success' } } }));
    } catch (err) {
      console.error(`Image Gen Error ${n}:`, err);
      set(state => ({ progress: { ...state.progress, [n]: { ...state.progress[n], image: 'error' } } }));
    }
  },

  generateSceneAudio: async (postId, scene, voiceSettings) => {
    const n = scene.numero;
    const texto_narrado = (scene as VideoScene).texto_narrado;
    if (!texto_narrado) return;

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
      model_id: voiceSettings?.model_id || "eleven_multilingual_v2",
      stability: voiceSettings?.stability ?? 0.7,
      similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
      style: voiceSettings?.style ?? 0.15,
      use_speaker_boost: voiceSettings?.use_speaker_boost ?? true,
      speed: voiceSettings?.speed ?? 1.10
    };

    try {
      await fetch(WORKER_AUDIO, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ id_post: postId, numero_cena: n, texto_narrado, voice_settings: finalVoiceSettings })
      });
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
        let refUrl = undefined;
        if (videoScene.usa_referencia && videoScene.slug_produto) {
          const GCS_BASE_URL = 'https://storage.googleapis.com/cocreator_content';
          const folder = videoScene.tipo_referencia === 'embalagem' ? 'embalagem' : 'produtos_reais';
          const slug = videoScene.slug_produto.split(',')[0].trim();
          const fileName = slug.includes('.') ? slug : `${slug}.png`;
          refUrl = `${GCS_BASE_URL}/${folder}/${fileName}`;
        }

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
      await fetch(WORKER_RENDER, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ 
          id_post: postId, 
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
      let refUrl = undefined;
      if (videoScene.usa_referencia && videoScene.slug_produto) {
        const GCS_BASE_URL = 'https://storage.googleapis.com/cocreator_content';
        const folder = videoScene.tipo_referencia === 'embalagem' ? 'embalagem' : 'produtos_reais';
        const slug = videoScene.slug_produto.split(',')[0].trim();
        const fileName = slug.includes('.') ? slug : `${slug}.png`;
        refUrl = `${GCS_BASE_URL}/${folder}/${fileName}`;
      }

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
      await fetch(WORKER_FINAL, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ id_post: postId, video_urls, action: 'compile_final' })
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
