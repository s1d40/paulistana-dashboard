import { supabase } from '@/lib/supabase';
import { 
  PostImage, PostAudio, PostVideo, PostVideoCena,
  Product, Account, Client, PostDetailsPayload 
} from './google-sheets';

// Re-exporting interfaces imported from google-sheets
export type { PostImage, PostAudio, PostVideo, PostVideoCena, Product, Account, Client, PostDetailsPayload };

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

export async function fetchTable<T>(tableName: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`Error fetching table ${tableName} from Supabase:`, error);
    return [];
  }
  
  return data as T[];
}

export async function fetchAllImages(): Promise<PostImage[]> {
  return fetchTable<PostImage>(TABLE_IMAGENS);
}

export async function fetchAllAudios(): Promise<PostAudio[]> {
  return fetchTable<PostAudio>(TABLE_AUDIOS);
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*');
  
  if (error) {
    console.error('Error fetching products from Supabase:', error);
    return [];
  }
  
  // Mapear campos do Postgres (snake_case) de volta para o padrão esperado pela interface (Pascal/Camel)
  return data.map((p) => ({
    Produto: p.produto,
    slug_embalagem: p.slug_embalagem,
    slug_imagem_real: p.slug_imagem_real,
    Restricao_Narrativa: p.restricao_narrativa,
    Restricao_Visual: p.restricao_visual
  })) as Product[];
}

export async function fetchContentPosts(): Promise<ContentPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('data_criacao', { ascending: false });
  
  if (error) {
    console.error('Error fetching posts from Supabase:', error);
    return [];
  }
  
  return data as ContentPost[];
}

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('contas')
    .select('*');
  
  if (error) {
    console.error('Error fetching accounts from Supabase:', error);
    return [];
  }
  
  return data as Account[];
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
    .order('created_at', { ascending: true })
    .not('id', 'is', null); // Dummy filter to bust cache

  if (error) {
    console.error('Error fetching content presets:', error);
    return [];
  }

  return (data || []) as Record<string, unknown>[];
}

export async function fetchPresetById(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('content_presets')
    .select('*')
    .eq('id', id)
    .single();

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
  const [postRes, imagensRes, audiosRes, videosRes, videosCenasRes] = await Promise.all([
    supabase.from('posts').select('*').eq('id_post', id_post).single(),
    supabase.from('imagens').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false }).not('id_imagem', 'is', null),
    supabase.from('audios').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false }).not('id_audio', 'is', null),
    supabase.from('videos').select('*').eq('id_post', id_post).order('data_compilacao', { ascending: false }),
    supabase.from('videos_cenas').select('*').eq('id_post', id_post).order('data_geracao', { ascending: false })
  ]);

  if (postRes.error) {
    console.error(`Error fetching post details for ${id_post}:`, postRes.error);
  }

  return {
    post: postRes.data as ContentPost || null,
    imagens: (imagensRes.data || []) as PostImage[],
    audios: (audiosRes.data || []) as PostAudio[],
    videos: (videosRes.data || []) as PostVideo[],
    videos_cenas: (videosCenasRes.data || []) as PostVideoCena[]
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
  const { data: oldPost } = await supabase.from('posts').select('*').eq('id_post', oldId).single();
  
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
  const { data: oldPreset } = await supabase.from('content_presets').select('*').eq('id', oldId).single();

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
