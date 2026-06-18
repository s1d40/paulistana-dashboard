import Papa from 'papaparse';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/12JcGa9CuHtavgf0goY8yraYQ6kYuy8NCXsKPKmBWDdY/export?format=csv&gid=';

// GIDs das abas
export const GID_POSTS = '1785597339';
export const GID_IMAGENS = '1311161084';
export const GID_AUDIOS = '1038454023';
export const GID_VIDEOS = '729253016';
export const GID_CARROSSEL = '927613935';
export const GID_PRODUTOS = '1888995061';

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
  imagens?: string;
  Audios?: string;
  Video?: string;
}

export interface PostImage {
  id_post: string;
  id_cena?: string;
  image_url?: string;
  prompt_utilizado?: string;
  data_geracao?: string;
  numero_cena?: string;
  Sincronizado_Pinecone?: string;
  url_imagem_fundo?: string; // Aba carrossel
  texto_na_imagem?: string; // Aba carrossel
}

export interface PostAudio {
  id_audio: string;
  id_post: string;
  id_cena?: string;
  audio_url?: string;
  texto_narrado?: string;
  data_geracao?: string;
  numero_cena?: string;
  timestamps?: string;
}

export interface PostVideo {
  id_video_final: string;
  id_post: string;
  video_final_url?: string;
  data_compilacao?: string;
}

export interface PostVideoCena {
  id: string; // Will match id_cena
  id_post: string;
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

export interface PostDetailsPayload {
  post: ContentPost | null;
  imagens: PostImage[];
  audios: PostAudio[];
  videos: PostVideo[];
  videos_cenas?: PostVideoCena[];
}

export async function fetchSheet<T>(gid: string): Promise<T[]> {
  const url = `${BASE_URL}${gid}`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet ${gid}: ${response.statusText}`);
    }
    const csvText = await response.text();
    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error: Error) => reject(error)
      });
    });
  } catch (error) {
    console.error(`Error fetching sheet ${gid}:`, error);
    return [];
  }
}

export async function fetchAllImages(): Promise<PostImage[]> {
  const [allImages, allCarrossel] = await Promise.all([
    fetchSheet<PostImage>(GID_IMAGENS),
    fetchSheet<PostImage>(GID_CARROSSEL)
  ]);

  // Filtra entradas sem URL e combina as abas
  return [...allImages, ...allCarrossel].filter(img => img.image_url || img.url_imagem_fundo);
}

export async function fetchAllAudios(): Promise<PostAudio[]> {
  const audios = await fetchSheet<PostAudio>(GID_AUDIOS);
  return audios.filter(audio => audio.audio_url && audio.audio_url.trim() !== '');
}

export async function fetchProducts(): Promise<Product[]> {
  const products = await fetchSheet<Product>(GID_PRODUTOS);
  return products.filter(p => p.Produto && p.Produto.trim() !== '');
}

export async function fetchContentPosts(): Promise<ContentPost[]> {
  const posts = await fetchSheet<ContentPost>(GID_POSTS);
  return posts.filter(post => post.id_post && post.id_post.trim() !== '');
}

export interface Account {
  id_conta: string;
  id_cliente: string;
  nicho: string;
  nome_conta: string;
  conta_id_instagram?: string;
  ig_access_token?: string;
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

export const GID_CONTAS = '1142517032'; // GID fictício
export const GID_CLIENTES = '417387431'; // GID fictício

export async function fetchAccounts(): Promise<Account[]> {
  console.log('Fetching accounts from GID:', GID_CONTAS);
  // Simulação com dados reais do backup local por enquanto
  return [
    { id_conta: 'b3f9c2d1-7e84-4a56-9d2b-1f8e3c6a4b90', id_cliente: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nicho: 'Astrologia e Signos', nome_conta: 'Codigo dos Signos' },
    { id_conta: 'e8a5f4c9-2d1b-47e3-8c6a-9b5d0f1e2c3a', id_cliente: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nicho: 'Leis da Atração', nome_conta: 'Leis do Universo BR' },
    { id_conta: '3a199973-bf79-46ae-bbf4-66282aa62319', id_cliente: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nicho: 'Alimentação Natural', nome_conta: 'Natural Feeding BR' }
  ];
}

export async function fetchClients(): Promise<Client[]> {
  console.log('Fetching clients from GID:', GID_CLIENTES);
  return [
    { id_cliente: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nome_cliente: 'Felipe', chat_id: '1481670558' }
  ];
}

export async function fetchPostDetails(id_post: string): Promise<PostDetailsPayload> {
  const [allPosts, allImages, allAudios, allVideos, allCarrossel] = await Promise.all([
    fetchContentPosts(),
    fetchSheet<PostImage>(GID_IMAGENS),
    fetchSheet<PostAudio>(GID_AUDIOS),
    fetchSheet<PostVideo>(GID_VIDEOS),
    fetchSheet<PostImage>(GID_CARROSSEL)
  ]);

  const post = allPosts.find(p => p.id_post === id_post) || null;
  
  // Combina as imagens das duas abas (Padrão e Carrossel) e filtra pelo id_post
  const imagens = [...allImages, ...allCarrossel].filter(img => img.id_post === id_post);
  
  const audios = allAudios.filter(audio => audio.id_post === id_post);
  const videos = allVideos.filter(video => video.id_post === id_post);

  return { post, imagens, audios, videos };
}
