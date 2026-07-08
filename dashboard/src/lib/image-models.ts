export interface ImageModel {
  id: string;
  label: string;
  supportsReference: boolean;
  speed: 'rápido' | 'médio' | 'lento';
  description?: string;
}

/**
 * Lista centralizada de modelos de imagem disponíveis no Replicate.
 * Esta é a ÚNICA fonte de verdade para modelos — todos os componentes
 * (GlobalMediaConfig, VideoStudio, ProductionCard, etc.) devem importar daqui.
 */
export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'google/nano-banana',
    label: 'Nano Banana v1 (Google)',
    supportsReference: true,
    speed: 'médio',
    description: 'Modelo original do Google. Suporta injeção de imagem de produto/embalagem via image_input.',
  },
  {
    id: 'google/nano-banana-2',
    label: 'Nano Banana v2 (Google)',
    supportsReference: true,
    speed: 'médio',
    description: 'Versão mais recente com 4K, melhor texto e world knowledge. Suporta image_input.',
  },
  {
    id: 'black-forest-labs/flux-schnell',
    label: 'Flux Schnell (BFL)',
    supportsReference: false,
    speed: 'rápido',
    description: 'Geração rápida, boa qualidade geral. Ideal para conteúdo abstrato (signos, dicas, etc).',
  },
  {
    id: 'lucataco/flux-dev-multi-lora',
    label: 'Flux Dev Multi-LoRA (Img2Img)',
    supportsReference: true,
    speed: 'lento',
    description: 'Suporta image-to-image via prompt_strength. Ideal para transformações com referência visual.',
  },
  {
    id: 'prunaai/flux-fast',
    label: 'Flux Fast (Pruna)',
    supportsReference: false,
    speed: 'rápido',
    description: 'FLUX.1-dev otimizado pela PrunaAI. Geração ultra-rápida.',
  },
  {
    id: 'prunaai/z-image-turbo',
    label: 'Z-Image Turbo (Pruna)',
    supportsReference: false,
    speed: 'rápido',
    description: 'Modelo Alibaba/Tongyi-MAI otimizado. Sub-segundo, ótimo para geração em massa.',
  },
];

/**
 * Converte um model ID (ex: 'google/nano-banana') para a URL REST do Replicate.
 */
export function modelIdToUrl(modelId: string): string {
  return `https://api.replicate.com/v1/models/${modelId}/predictions`;
}

/**
 * Converte uma URL REST do Replicate para um model ID.
 */
export function urlToModelId(url: string): string {
  if (url.includes('/models/')) {
    return url.split('/models/')[1].replace('/predictions', '');
  }
  return 'google/nano-banana';
}

/**
 * Encontra um modelo pelo ID.
 */
export function getModelById(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find(m => m.id === id);
}

/**
 * Retorna o modelo padrão.
 */
export const DEFAULT_IMAGE_MODEL = 'google/nano-banana';
