import { supabase } from '@/lib/supabase';

export interface PostImage {
  id_imagem?: string;
  id_post: string;
  image_url?: string;
  prompt_utilizado?: string;
  data_geracao?: string;
  numero_cena?: string;
  Sincronizado_Pinecone?: string;
  url_imagem_fundo?: string; 
  texto_na_imagem?: string; 
  id_cena?: string;
}

export interface PostAudio {
  id_audio: string;
  id_post: string;
  audio_url?: string;
  texto_narrado?: string;
  data_geracao?: string;
  numero_cena?: string;
  timestamps?: string;
  id_cena?: string;
}

export interface PostVideo {
  id_video_final: string;
  id_post: string;
  video_final_url?: string;
  data_compilacao?: string;
}

export interface PostVideoCena {
  id: string; // Este UUID agora será gerado no n8n a cada tentativa (Histórico)
  id_post: string;
  id_cena?: string; // Foreign Key vinculando este vídeo gerado à cena do JSON
  numero_cena: number;
  video_url: string;
  status: string;
  error_log?: string;
  data_geracao?: string;
}

export interface Product {
  Produto: string;
  slug_embalagem: string;
  slug_imagem_real: string;
  Restricao_Narrativa?: string;
  Restricao_Visual?: string;
}

export interface Account {
  id_conta: string;
  id_cliente: string;
  nicho: string;
  nome_conta: string;
  conta_id_instagram?: string;
  ig_access_token?: string;
  ig_username?: string;
  ig_profile_picture_url?: string;
  yt_credencial?: string;
  conta_id_facebook?: string;
  facebook_access_token?: string;
  conta_id_threads?: string;
  threads_access_token?: string;
}

export interface Client {
  id_cliente: string;
  nome_cliente: string;
  chat_id: string;
}

export interface ContentPost {
  id_post: string;
  tema_post: string;
  roteiro_gerado: string;
  prompt_imagem?: string;
  captions?: string;
  status?: string;
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  data_criacao?: string;
  agendado?: string;
  feedback?: string;
  tipo_post?: string;
  id_conta?: string;
  titulo_post?: string;
  hashtags?: string;
  data_agendamento?: string;
  status_agendamento?: string;
  images_status?: 'Pendente' | 'OK';
  audio_status?: 'Pendente' | 'OK';
  video_status?: 'Pendente' | 'OK';
  imagens?: PostImage[];
  audios?: PostAudio[];
  videos?: PostVideo[];
}

export interface ProductionList {
  id: string;
  name: string;
  preset_id: string;
  items: Array<{
    tema: string;
    prompt: string;
    titulo_otimizado?: string;
    captions?: string;
    hashtags?: string;
    preset_id?: string;
    model?: string;
  }>;
  status: string;
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  name: string;
  preset_id?: string;
  account_id?: string;
  items: Array<{ uuid: string; produto: string; slug: string }>;
  created_at: string;
}

export interface PostDetailsPayload {
  post: ContentPost | null;
  imagens: PostImage[];
  audios: PostAudio[];
  videos: PostVideo[];
  videos_cenas?: PostVideoCena[];
  has_preset?: boolean;
}


/**
 * NOMES DAS TABELAS (SUBSTITUINDO GIDs)
 */
export const TABLE_POSTS = 'posts';
export const TABLE_IMAGENS = 'imagens';
export const TABLE_AUDIOS = 'audios';
export const TABLE_VIDEOS = 'videos';
export const TABLE_PRODUTOS = 'produtos';
export const TABLE_CONTAS = 'contas';
export const TABLE_CLIENTES = 'clientes';

// Aliases para manter compatibilidade com código que usa GID
export const GID_POSTS = TABLE_POSTS;
export const GID_IMAGENS = TABLE_IMAGENS;
export const GID_AUDIOS = TABLE_AUDIOS;
export const GID_VIDEOS = TABLE_VIDEOS;

export async function fetchTable<T>(tableName: string, page?: number, limit?: number): Promise<T[]> {
  let query = supabase
    .from(tableName)
    .select('*');
    
  if (page !== undefined && limit !== undefined) {
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(500); // Prevent OOM
  }
  
  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching table ${tableName} from Supabase:`, error);
    return [];
  }
  
  return data as T[];
}

export async function fetchAllImages(page?: number, limit?: number): Promise<PostImage[]> {
  return fetchTable<PostImage>(TABLE_IMAGENS, page, limit);
}

export async function fetchAllAudios(page?: number, limit?: number): Promise<PostAudio[]> {
  return fetchTable<PostAudio>(TABLE_AUDIOS, page, limit);
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('produtos_plataformas')
    .select(`
      title,
      slug_embalagem,
      slug_imagem_real,
      produtos (
        restricao_narrativa,
        restricao_visual
      )
    `);

  if (error) {
    console.error('Error fetching products from Supabase:', error);
    return [];
  }

  const uniqueProducts = new Map();

  data.forEach((item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const key = item.title?.toLowerCase().trim();
    if (key && !uniqueProducts.has(key)) {
      uniqueProducts.set(key, {
        Produto: item.title,
        slug_embalagem: item.slug_embalagem || '',
        slug_imagem_real: item.slug_imagem_real || '',
        Restricao_Narrativa: item.produtos?.restricao_narrativa || '',
        Restricao_Visual: item.produtos?.restricao_visual || ''
      });
    }
  });

  return Array.from(uniqueProducts.values());
}

export async function fetchProductionLists(): Promise<ProductionList[]> {
  const { data, error } = await supabase
    .from('production_lists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching production lists:', error);
    return [];
  }

  return data as ProductionList[];
}

export async function fetchProductionBatches(): Promise<ProductionBatch[]> {
  const { data, error } = await supabase
    .from('production_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching production batches:', error);
    return [];
  }

  return data as ProductionBatch[];
}

export async function createProductionBatch(batch: Omit<ProductionBatch, 'id' | 'created_at'>): Promise<ProductionBatch | null> {
  const { data, error } = await supabase
    .from('production_batches')
    .insert(batch)
    .select()
    .single();

  if (error) {
    console.error('Error creating production batch:', error);
    return null;
  }
  return data as ProductionBatch;
}

export async function fetchContentPosts(page?: number, limit?: number): Promise<ContentPost[]> {
  let query = supabase
    .from('posts')
    .select('*, imagens(image_url, url_imagem_fundo, numero_cena), audios(audio_url), videos(video_final_url)')
    .order('data_criacao', { ascending: false });
    
  if (page !== undefined && limit !== undefined) {
    const from = page * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  } else {
    query = query.limit(200); // Prevent OOM
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching posts from Supabase:', error);
    return [];
  }
  
  return data as ContentPost[];
}

export async function fetchAccounts(): Promise<Account[]> {
  try {
    const res = await fetch('/api/accounts', { cache: 'no-store' });
    if (!res.ok) {
      console.error('Error fetching accounts:', res.statusText);
      return [];
    }
    const json = await res.json();
    const data = json.accounts || [];
    
    // Deduplicate by id_conta (safety net)
    const seen = new Set<string>();
    const unique = data.filter((acc: any) => {
      if (seen.has(acc.id_conta)) return false;
      seen.add(acc.id_conta);
      return true;
    });

    return unique as Account[];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*');
  
  if (error) {
    console.error('Error fetching clients from Supabase:', error);
    return [];
  }
  
  return data as Client[];
}

export async function fetchContentPresets(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('content_presets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching content presets:', error);
    throw error;
  }

  return (data || []) as Record<string, unknown>[];
}

export async function fetchPresetById(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('content_presets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[Supabase] Error fetching preset ${id}:`, error.message);
    return null;
  }

  return data;
}

export async function updatePresetInSupabase(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('content_presets')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function createPresetInSupabase(preset: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('content_presets')
    .insert(preset)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPostDetails(id_post: string): Promise<PostDetailsPayload> {
  // Using a dummy filter to bust Supabase/Cloudflare cache
  const [postRes, imagensRes, audiosRes, videosRes, videosCenasRes, presetRes] = await Promise.all([
    supabase.from('posts').select('*').eq('id_post', id_post).single(),
    supabase.from('imagens').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false }).not('id_imagem', 'is', null),
    supabase.from('audios').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false }).not('id_audio', 'is', null),
    supabase.from('videos').select('*').eq('id_post', id_post).order('data_compilacao', { ascending: false }),
    supabase.from('videos_cenas').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false }),
    supabase.from('content_presets').select('id').eq('id', id_post).maybeSingle()
  ]);

  if (postRes.error) {
    console.error(`Error fetching post details for ${id_post}:`, postRes.error);
  }

  return {
    post: postRes.data as ContentPost || null,
    imagens: (imagensRes.data || []) as PostImage[],
    audios: (audiosRes.data || []) as PostAudio[],
    videos: (videosRes.data || []) as PostVideo[],
    videos_cenas: (videosCenasRes.data || []) as PostVideoCena[],
    has_preset: !!presetRes.data
  };
}

/**
 * UTILS PARA INSERÇÃO (Usado pelo Dashboard)
 */
export async function initializePostInSupabase(item: { uuid: string, produto: string }, presetName: string, idConta: string) {
  const { error } = await supabase
    .from('posts')
    .insert({
      id_post: item.uuid,
      tema_post: item.produto,
      status: 'Aguardando IA',
      tipo_post: presetName,
      id_conta: idConta,
      data_criacao: new Date().toISOString(),
      images_status: 'Pendente',
      audio_status: 'Pendente',
      video_status: 'Pendente'
    });

  if (error) throw error;
}

export async function updatePostInSupabase(id_post: string, updates: Partial<ContentPost>) {
  const { error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id_post', id_post);

  if (error) throw error;
}

export async function clearMediaFromSupabase(id_post: string) {
  await supabase.from('videos').delete().eq('id_post', id_post);
  await supabase.from('videos_cenas').delete().eq('id_post', id_post);
  await supabase.from('imagens').delete().eq('id_post', id_post);
  await supabase.from('audios').delete().eq('id_post', id_post);
}

export async function deletePostFromSupabase(id_post: string) {
  // Try to delete from posts (and it should cascade to videos/cenas if DB constraints are set, or just delete the main post)
  const { error: postError } = await supabase.from('posts').delete().eq('id_post', id_post);
  if (postError) throw postError;

  // Also try to delete from content_presets just in case
  await supabase.from('content_presets').delete().eq('id', id_post);
}

export async function duplicatePostAsDraft(oldId: string): Promise<string> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

  // 1. Fetch old post
  const { data: oldPost } = await supabase.from('posts').select('*').eq('id_post', oldId).maybeSingle();
  
  if (oldPost) {
    // 2. Insert new post (copy metadata, but no roteiro_gerado)
    await supabase.from('posts').insert({
      id_post: newId,
      tema_post: oldPost.tema_post,
      titulo_post: oldPost.titulo_post,
      tipo_post: oldPost.tipo_post,
      id_conta: oldPost.id_conta,
      status: 'Aguardando IA',
      data_criacao: new Date().toISOString(),
      images_status: 'Pendente',
      audio_status: 'Pendente',
      video_status: 'Pendente'
    });
  }

  // 3. Fetch old preset
  const { data: oldPreset } = await supabase.from('content_presets').select('*').eq('id', oldId).maybeSingle();

  if (oldPreset) {
    // 4. Insert new preset with a unique name to avoid content_presets_name_key constraint
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newName = oldPreset.name.includes('(Clone') 
      ? `${oldPreset.name.split('(Clone')[0].trim()} (Clone ${uniqueSuffix})`
      : `${oldPreset.name} (Clone ${uniqueSuffix})`;

    const { error: presetError } = await supabase.from('content_presets').insert({
      id: newId,
      name: newName,
      description: oldPreset.description,
      track: oldPreset.track,
      config: oldPreset.config,
      sessions: oldPreset.sessions
    });
    
    if (presetError) {
      console.error(`Error duplicating preset: code=${presetError.code}, msg=${presetError.message}, details=${presetError.details}`);
      throw presetError;
    }
  }

  return newId;
}

export async function fetchMLCampaigns() {
  const { data, error } = await supabase.from('ml_campaigns').select(`
    *,
    ml_campaign_items (*)
  `).order('campaign_id', { ascending: false });
  if (error) {
    console.error('Error fetching ML campaigns', error);
    return [];
  }
  return data;
}

export async function fetchBlingPedidos() {
  const { data, error } = await supabase.from('bling_pedidos').select('*').order('data', { ascending: false }).limit(100);
  if (error) {
    console.error('Error fetching Bling pedidos', error);
    return [];
  }
  return data;
}
