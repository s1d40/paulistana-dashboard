export type ContentTrack = 'video' | 'carrossel' | 'blog';

// --- VIDEO TYPES ---
export interface ReplicateConfig {
  model_url: string; // e.g., https://api.replicate.com/v1/models/google/nano-banana/predictions
  input: {
    prompt: string;
    negative_prompt?: string;
    aspect_ratio: '9:16' | '16:9' | '1:1';
    output_format: 'webp' | 'jpg' | 'png';
    image_input?: string[]; // For reference-based generation
    [key: string]: unknown; // Allow for other model-specific parameters
  };
}

export interface VideoScene {
  numero: number;
  modelo_ia: string; // Display name
  replicate?: ReplicateConfig; // Detailed API config
  texto_narrado: string;
  prompt_visual: string;
  prompt_negativo: string;
  animacao: string;
  usa_referencia: boolean;
  tipo_referencia: 'produto_real' | 'embalagem' | null;
  slug_produto: string | null;
}

export interface ElevenLabsVoiceSettings {
  model_id: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
}

export interface VideoScript {
  tipo_post: string; // Discriminator: contains "Video" or "Reels"
  tema: string;
  titulo_otimizado: string;
  caption_final: string;
  direcao_de_arte: string;
  voice_settings?: ElevenLabsVoiceSettings; // Optional voice settings
  cenas: VideoScene[];
}

// --- CARROSSEL TYPES (Satori Schema) ---
export interface SatoriPayload {
  slideCategory: 'hook' | 'body' | 'cta';
  content: {
    headline: string;
    subHeadline: string;
  };
  theme: {
    textColor: string;
    highlightColor: string;
    highlightStyle: 'color' | 'box' | 'underline';
    imageFilter: string;
    headlineFont: string;
    bodyFont: string;
    textShadow: boolean;
    textOutline: boolean;
  };
  layout: {
    anchor: 'top' | 'center' | 'bottom';
    textAlign: 'left' | 'center' | 'right';
    imageFrame: 'full' | 'arch' | 'circle' | 'soft-arch' | 'square';
  };
  overlay: {
    enabled: boolean;
    type: string;
    opacity: number;
  };
  actionIndicator: {
    type: 'swipe-arrow' | 'swipe-text' | 'save-button';
  };
}

export interface CarrosselScene {
  numero: number;
  prompt_visual: string;
  prompt_negativo: string;
  payload_api: SatoriPayload;
}

export interface CarrosselScript {
  tipo_post: 'Carrossel';
  tema: string;
  titulo_otimizado: string;
  caption_final: string;
  cenas: CarrosselScene[];
}

// --- BLOG TYPES ---
export interface BlogImage {
  prompt_visual: string;
  prompt_negativo: string;
}

export interface BlogScript {
  title: string;
  slug: string;
  categoria_alvo: string;
  yoast_focuskw: string;
  yoast_title: string;
  yoast_metadesc: string;
  featured_image_url: string; // This is often a prompt in the production phase
  imagens_internas: BlogImage[];
  content: string; // HTML string
}

// --- DISCRIMINATOR FUNCTIONS ---
export function isVideoScript(data: unknown): data is VideoScript {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const type = (d.tipo_post as string || '').toLowerCase();
  return type === 'video';
}

export function isCarrosselScript(data: unknown): data is CarrosselScript {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const type = (d.tipo_post as string || '').toLowerCase();
  return type === 'carrossel';
}

export function isBlogScript(data: unknown): data is BlogScript {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const type = (d.tipo_post as string || '').toLowerCase();
  return type === 'blog' || (!!d.yoast_focuskw && !!d.content);
}
