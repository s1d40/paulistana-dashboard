import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchContentPresets, fetchPresetById } from '@/services/supabase-service';
import { supabase } from '@/lib/supabase';

export interface RenderPayload {
  image_url: string;
  audio_url: string;
  timestamps_url: string;
  animacao: string;
  image_reference_url?: string;
}

export interface SystemMessageSession {
  id: string;
  title: string;
  content: string;
  isEditable: boolean;
  isEssential: boolean;
}

export type ContentType = 'video' | 'carrossel' | 'blog' | 'general';

export interface Preset {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  sessions: SystemMessageSession[];
  prompt: string;
  model: string;
  temperature: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  config?: {
    is_draft?: boolean;
    [key: string]: any;
  };
}

interface PresetState {
  presets: Preset[];
  activePresetId: string | null;
  isLoading: boolean;
  initializePresets: () => Promise<void>;
  addPreset: (preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreset: (id: string, updates: Partial<Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deletePreset: (id: string) => void;
  setActivePreset: (id: string | null) => void;
  clonePreset: (id: string, name: string, description: string) => Promise<string | null>;
  createDraftPreset: (track: ContentType, explicitId?: string, sourcePresetId?: string) => Promise<string | null>;
  refreshPreset: (id: string) => Promise<void>;
  resetToDefaults: () => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePresetId: null,
      isLoading: false,

      refreshPreset: async (id: string) => {
        try {
           const dbPreset = await fetchPresetById(id);
           if (dbPreset) {
             const loadedPreset: Preset = {
               id: dbPreset.id as string,
               name: dbPreset.name as string,
               type: (dbPreset.track || 'general') as ContentType,
               description: (dbPreset.description || '') as string,
               sessions: (dbPreset.sessions || []) as SystemMessageSession[],
               prompt: ((dbPreset.config as Record<string, unknown>)?.prompt || '') as string,
               model: ((dbPreset.config as Record<string, unknown>)?.model || 'gpt5.4') as string,
               temperature: ((dbPreset.config as Record<string, unknown>)?.temperature ?? 0.7) as number,
               isFavorite: false,
               createdAt: dbPreset.created_at as string,
               updatedAt: dbPreset.updated_at as string,
               config: dbPreset.config as any
             };
             set(state => ({
               presets: state.presets.map(p => p.id === id ? loadedPreset : p)
             }));
             console.log('[Store] Preset refreshed from DB:', id);
           }
        } catch (error) {
           console.error('[Store] Failed to refresh preset:', error);
        }
      },

      createDraftPreset: async (track, explicitId, sourcePresetId) => {
        const id = explicitId || crypto.randomUUID();
        
        // 1. Verifica se já existe no estado local
        const existingLocal = get().presets.find(p => p.id === id);
        if (existingLocal) {
           console.log('[Store] Ephemeral session already exists locally:', id);
           set({ activePresetId: id });
           return id;
        }

        // 2. Verifica se já existe no banco (ex: rascunho duplicado via UI que ainda não foi pro Zustand local)
        const dbPreset = await fetchPresetById(id);
        if (dbPreset) {
           console.log('[Store] Session found in DB. Injecting to local store:', id);
           const loadedPreset: Preset = {
             id: dbPreset.id as string,
             name: dbPreset.name as string,
             type: (dbPreset.track || 'general') as ContentType,
             description: (dbPreset.description || '') as string,
             sessions: (dbPreset.sessions || []) as SystemMessageSession[],
             prompt: ((dbPreset.config as Record<string, unknown>)?.prompt || '') as string,
             model: ((dbPreset.config as Record<string, unknown>)?.model || 'gpt5.4') as string,
             temperature: ((dbPreset.config as Record<string, unknown>)?.temperature ?? 0.7) as number,
             isFavorite: false,
             createdAt: dbPreset.created_at as string,
             updatedAt: dbPreset.updated_at as string,
             config: dbPreset.config as any
           };
           set(state => ({
             presets: [...state.presets, loadedPreset],
             activePresetId: id
           }));
           return id;
        }

        const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log('[Store] Creating new ephemeral draft session:', id);

        const sourcePreset = sourcePresetId ? get().presets.find(p => p.id === sourcePresetId) : null;

        const newDraftPreset: Preset = {
          id: id,
          name: sourcePreset ? `Draft: ${sourcePreset.name} (${shortId})` : `Draft: ${track} (${shortId})`,
          description: sourcePreset ? `Draft da lista baseado em ${sourcePreset.name}` : 'Sandbox efêmero criado automaticamente para esta sessão.',
          type: track,
          sessions: sourcePreset ? sourcePreset.sessions : BACKBONE_SESSIONS,
          prompt: sourcePreset ? sourcePreset.prompt : 'Atue como um Roteirista Master. Sua tarefa é criar roteiros de alta performance, respeitando estritamente as sessões ativas deste Cocreator Studio. Retorne apenas o JSON final.',
          model: sourcePreset ? sourcePreset.model : 'gpt5.4',
          temperature: sourcePreset ? sourcePreset.temperature : 0.7,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Config flag used later when converting it to a real preset
          ...( { config: { is_draft: true, prompt: sourcePreset ? sourcePreset.prompt : 'Atue como um Roteirista Master. Sua tarefa é criar roteiros de alta performance, respeitando estritamente as sessões ativas deste Cocreator Studio. Retorne apenas o JSON final.', model: sourcePreset ? sourcePreset.model : 'gpt5.4', temperature: sourcePreset ? sourcePreset.temperature : 0.7 } } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */ )
        };

        // CORREÇÃO: Para o Agente Arquiteto n8n conseguir atualizar o preset via DB e a UI atualizar via Realtime,
        // o draft OBRIGATORIAMENTE precisa existir no Supabase. Vamos fazer um UPSERT fire-and-forget.
        supabase.from('content_presets').upsert({
          id: newDraftPreset.id,
          name: newDraftPreset.name,
          description: newDraftPreset.description,
          track: newDraftPreset.type,
          sessions: newDraftPreset.sessions,
          config: newDraftPreset.config
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('[Store] Erro ao salvar draft no DB:', error);
        });

        // Adiciona no state local (Zustand)
        set(state => ({
          presets: [...state.presets, newDraftPreset],
          activePresetId: id
        }));

        return id;
      },

      initializePresets: async () => {
        set({ isLoading: true });
        try {
          const data = await fetchContentPresets();
          console.log('[Store] Presets fetched from DB:', data.length);
          
          const mappedPresets: Preset[] = data
            .filter((p) => !((p.config as Record<string, unknown>)?.is_draft === true))
            .map((p) => ({
              id: p.id as string,
              name: p.name as string,
              type: (p.track || 'general') as ContentType,
              description: (p.description || '') as string,
              sessions: (p.sessions || []) as SystemMessageSession[],
              prompt: ((p.config as Record<string, unknown>)?.prompt || '') as string,
              model: ((p.config as Record<string, unknown>)?.model || 'gpt5.4') as string,
              temperature: ((p.config as Record<string, unknown>)?.temperature ?? 0.7) as number,
              isFavorite: ((p.config as Record<string, unknown>)?.isFavorite === true) as boolean,
              createdAt: p.created_at as string,
              updatedAt: p.updated_at as string,
            }));

          if (mappedPresets.length > 0) {
            set({ 
              presets: mappedPresets, 
              activePresetId: get().activePresetId || mappedPresets[0].id,
              isLoading: false 
            });
          } else {
            // Fallback to DEFAULT_PRESETS if DB is empty or fetching failed
            const newPresets = DEFAULT_PRESETS.map(p => ({
              ...p,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            set({ 
              presets: newPresets, 
              activePresetId: newPresets[0].id,
              isLoading: false 
            });
          }

        } catch (error) {
          console.error('Error initializing presets:', error);
          const newPresets = DEFAULT_PRESETS.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          set({ 
            presets: newPresets, 
            activePresetId: newPresets[0].id,
            isLoading: false 
          });
        }
      },

      clonePreset: async (id, name, description) => {
        const source = get().presets.find(p => p.id === id);
        if (!source) return null;

        try {
          const { data, error } = await supabase
            .from('content_presets')
            .insert({
              name,
              description,
              track: source.type,
              sessions: source.sessions,
              config: {
                model: source.model,
                temperature: source.temperature,
                prompt: source.prompt
              }
            })
            .select()
            .single();

          if (error) throw error;
          
          await get().initializePresets();
          return data.id;
        } catch (error) {
          console.error('Error cloning preset:', error);
          return null;
        }
      },

      addPreset: (presetData) => {
        const newPreset: Preset = {
          ...presetData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          presets: [...state.presets, newPreset],
          activePresetId: state.presets.length === 0 ? newPreset.id : state.activePresetId,
        }));

        // Fire and forget insert into Supabase
        supabase
          .from('content_presets')
          .insert({
            id: newPreset.id,
            name: newPreset.name,
            description: newPreset.description,
            track: newPreset.type,
            sessions: newPreset.sessions,
            config: {
              prompt: newPreset.prompt,
              model: newPreset.model,
              temperature: newPreset.temperature,
              isFavorite: newPreset.isFavorite,
            }
          })
          .then(({ error }) => {
            if (error) console.error('[Supabase] Erro ao criar preset no banco:', error);
          });
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date().toISOString() }
              : preset
          ),
        }));
        
        // Sincronizar 'isFavorite' (e outras atualizações leves) com o Supabase
        // Não bloqueia a UI (fire and forget)
        const currentPreset = get().presets.find(p => p.id === id);
        if (currentPreset) {
          supabase
            .from('content_presets')
            .update({ 
              name: currentPreset.name,
              description: currentPreset.description,
              track: currentPreset.type,
              sessions: currentPreset.sessions,
              config: {
                prompt: currentPreset.prompt,
                model: currentPreset.model,
                temperature: currentPreset.temperature,
                isFavorite: currentPreset.isFavorite,
                ...(currentPreset as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).config
              }
            })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error('[Supabase] Erro ao sincronizar update do preset:', error);
            });
        }
      },

      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter((preset) => preset.id !== id),
        activePresetId: state.activePresetId === id ? null : state.activePresetId,
      })),

      setActivePreset: (id) => set({ activePresetId: id }),
      
      resetToDefaults: () => {
        const newPresets = DEFAULT_PRESETS.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        set({
          presets: newPresets,
          activePresetId: newPresets[0].id
        });

        // Fire and forget insert defaults to Supabase
        Promise.all(newPresets.map(preset => 
          supabase.from('content_presets').insert({
            id: preset.id,
            name: preset.name,
            description: preset.description,
            track: preset.type,
            sessions: preset.sessions,
            config: {
              prompt: preset.prompt,
              model: preset.model,
              temperature: preset.temperature,
              isFavorite: preset.isFavorite,
            }
          })
        )).catch(err => console.error('[Supabase] Erro ao resetar para padroes:', err));
      }
    }),
    {
      name: 'n8n-presets-storage',
    }
  )
);

// Default Presets Data
export const DEFAULT_PRESETS: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Vídeo Paulistana Master',
    type: 'video',
    description: 'Estratégia completa para TikTok Shop e Instagram baseada no framework Paulistana.',
    model: 'gpt5.4',
    temperature: 0.7,
    prompt: 'Atue como a IA Roteirista da marca \'Paulistana Empório\', especializada em alimentação saudável e suplementação natural. Sua tarefa é criar roteiros de alta performance para vídeos de Instagram e TikTok Shop, respeitando estritamente as sessões ativas do cockpit.',
    sessions: [
      {
        id: 'persona',
        title: 'Persona e Missão',
        isEssential: true,
        isEditable: true,
        content: "Você é o Diretor Criativo Chefe da marca \"Paulistana Empório\", especializada em Alimentação Saudável e Suplementação Natural. Sua missão é criar roteiros de alta performance para duas frentes distintas: Vídeos Virais (Instagram/TikTok) e Anúncios Diretos (Mercado Livre/TikTok Shop). Você é mestre em \"Neuro-Marketing\", equilibrando autoridade em saúde, estética premium (\"Macro food photography\", \"Cinematic lifestyle\") e conversão de vendas."
      },
      {
        id: 'slug_info',
        title: 'Busca de Estoque',
        isEssential: true,
        isEditable: false,
        content: "Você possui acesso à ferramenta Get_Slug_Info. Sempre que for criar um roteiro, você deve considerar os produtos listados no retorno desta ferramenta. O valor que você preencherá na chave slug_produto do seu output final DEVE SER OBRIGATORIAMENTE uma cópia exata do campo Slug_Imagem fornecido por esta ferramenta. IMPORTANTE: Nas cenas iniciais use a referência de produto_real, mas na cena final de CTA, use obrigatoriamente a referência de embalagem."
      },
      {
        id: 'compliance',
        title: 'Compliance de Saúde',
        isEssential: true,
        isEditable: true,
        content: "Você está ESTRITAMENTE PROIBIDO de prometer curas médicas, emagrecimento milagroso ou diagnosticar doenças. Foque em termos como \"aliada poderosa\", \"fonte natural de energia\" e \"ajuda a mitigar o cansaço\"."
      },
      {
        id: 'narracao',
        title: 'Arte da Narração (TTS)',
        isEssential: false,
        isEditable: true,
        content: "Nunca use dois pontos (:) ou traços (-) na narração. Escreva frases curtas e sensoriais. Foque em textura, aroma e sabor para que a IA de voz soe humana e envolvente."
      },
      {
        id: 'framework',
        title: 'Framework de Decisão',
        isEssential: true,
        isEditable: true,
        content: "Ao receber o tema, identifique o destino do vídeo. \n\nINSTAGRAM: Foco em Dor > Solução. 9 a 12 cenas. Narração entre 12 a 20 palavras.\nTIKTOK SHOP: Foco em Retenção & Conversão Direta. 5 a 7 cenas. Ritmo acelerado. Comece apresentando o produto e suas características sensoriais.\n\nREGRA FINAL: O vídeo deve terminar obrigatoriamente com a imagem da embalagem e a narração: 'Não perca tempo! Garanta já o seu na Paulistana Empório'."
      },
      {
        id: 'hashtags',
        title: 'Hashtags Estratégicas',
        isEssential: false,
        isEditable: true,
        content: "O Arquiteto preencherá este card com as hashtags após a conversa."
      },
      {
        id: 'estetica',
        title: 'Estética Visual',
        isEssential: false,
        isEditable: true,
        content: "Prompts 100% em inglês. Estética 'Cinematic Documentary'. Todo prompt visual DEVE terminar com: ', landscape ratio 16:9, centered composition, main subject perfectly in the middle, wide empty margins'. Varie as animações entre: zoom_in, zoom_out, pan_left, pan_right, pan_up. Nunca use a mesma animação em duas cenas seguidas. Prompt Negativo OBRIGATÓRIO: 'text, typography, watermark, letters, fonts, writing, words, signature, ugly, distorted'."
      },
      {
        id: 'template',
        title: 'Template JSON Obrigatório (Inviolável)',
        isEssential: true,
        isEditable: false,
        content: "[ESTRUTURA DO ROTEIRO INTERNO JSON - TEMPLATE GENÉRICO]\nSua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON estritamente válido. A estrutura abaixo é fixa e obrigatória:\n{\n  \"tipo_post\": \"video\",\n  \"tema\": \"...\",\n  \"titulo_otimizado\": \"Título Curto\",\n  \"caption_final\": \"Legenda das redes sociais\",\n  \"direcao_de_arte\": \"Estilo visual\",\n  \"cenas\": [\n    { \"numero\": 1, \"texto_narrado\": \"...\", \"prompt_visual\": \"...\", \"prompt_negativo\": \"...\", \"usa_referencia\": true, \"tipo_referencia\": \"produto_real\", \"slug_produto\": \"...\" }\n  ]\n}"
      }
    ]
  },
  {
    name: 'Carrossel Satori Viral',
    type: 'carrossel',
    description: 'Estrategista de Retenção Visual e Copywriter Chefe focado em deslize extremo.',
    model: 'gpt5.4',
    temperature: 0.7,
    prompt: 'Crie um carrossel altamente viral reduzindo a carga cognitiva.',
    sessions: [
      {
        id: 'persona',
        title: 'Persona Criativa',
        isEssential: true,
        isEditable: true,
        content: "Você é o Diretor Criativo e Estrategista de Retenção Visual da SFAI Solutions. Sua missão é transformar temas em carrosséis virais de 8 a 10 slides. Foco absoluto na redução da Carga Cognitiva: leitura em menos de 2 segundos."
      },
      {
        id: 'nichos',
        title: 'Diretrizes de Nicho',
        isEssential: true,
        isEditable: true,
        content: "PERFIL A: Mistérios (Storytelling, Dourado, Dark-moody).\nPERFIL B: Saúde (Minimalista, Fotorrealismo cru, Textos escuros).\nPERFIL C: Arquétipos (Boho, Colagem vintage, Centro vazio)."
      },
      {
        id: 'categorias',
        title: 'Categorias de Slide',
        isEssential: true,
        isEditable: false,
        content: "hook (Capa): Título monstruoso (max 45 char).\nbody (Miolo): Poucas palavras, sem listas. Crie slides consecutivos para múltiplos tópicos.\ncta (Ação): Slide final com actionIndicator.type: \"save-button\"."
      },
      {
        id: 'estetica',
        title: 'Visual e Tipografia',
        isEssential: false,
        isEditable: true,
        content: "Use Fontes como Bebas Neue, Montserrat e Inter. Marque apenas UMA palavra por slide com ** para destaque. Se usar highlightStyle: \"box\", a cor deve ser clara/neon."
      },
      {
        id: 'template',
        title: 'Template JSON Obrigatório (Inviolável)',
        isEssential: true,
        isEditable: false,
        content: "[ESTRUTURA DO ROTEIRO INTERNO JSON - CARROSSEL]\nSua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON estritamente válido:\n{\n  \"tipo_post\": \"carrossel\",\n  \"tema\": \"...\",\n  \"cenas\": [\n    { \"numero\": 1, \"prompt_visual\": \"...\", \"payload_api\": { \"slideCategory\": \"hook\", \"content\": { \"headline\": \"...\", \"subHeadline\": \"...\" } } }\n  ]\n}"
      }
    ]
  },
  {
    name: 'Blog SEO Autoridade',
    type: 'blog',
    description: 'Head de Technical SEO e Especialista em Nutrição Ortomolecular para artigos enciclopédicos.',
    model: 'gpt5.4',
    temperature: 0.7,
    prompt: 'Crie um artigo enciclopédico com alta autoridade tópica.',
    sessions: [
      {
        id: 'persona',
        title: 'Persona SEO',
        isEssential: true,
        isEditable: true,
        content: "Você é o Diretor Criativo e Head de Technical SEO focado no blog do Empório Paulistana. Sua missão é criar artigos com profundidade enciclopédica e alta Autoridade Tópica (Skyscraper 2.0)."
      },
      {
        id: 'estrutura',
        title: 'Estrutura do Artigo',
        isEssential: true,
        isEditable: true,
        content: "Introdução disruptiva (Myth-Busting). Citações obrigatórias (PubMed/Mayo Clinic). Cobertura de Entidades (NLP): taxonomia, mecanismos de ação, contraindicações. Mínimo 4 links internos."
      },
      {
        id: 'html_visual',
        title: 'Retenção Visual (HTML)',
        isEssential: false,
        isEditable: true,
        content: "Injete Tabelas Clínicas, Boxes de Prós vs Contras e Blockquotes. Use Medical Review Byline no início ou fim."
      },
      {
        id: 'template',
        title: 'Estrutura de Dados (Inviolável)',
        isEssential: true,
        isEditable: false,
        content: "[ESTRUTURA OBRIGATÓRIA - BLOG]\n{\n  \"tipo_post\": \"blog\",\n  \"title\": \"...\",\n  \"slug\": \"...\",\n  \"yoast_focuskw\": \"...\",\n  \"content\": \"<p>HTML aqui</p>\"\n}"
      }
    ]
  },
  {
    name: 'Vídeo Marketplace',
    type: 'video',
    description: 'Framework para anúncios focados em venda direta ESTRITAMENTE para Marketplace (Mercado Livre, Amazon, TikTok Shop).',
    model: 'gpt5.4',
    temperature: 0.7,
    prompt: 'CRIE AGORA O ROTEIRO E INICIE A PRODUÇÃO EXCLUSIVAMENTE PARA ESTE PRODUTO ABAIXO. IGNORE QUALQUER PRODUTO ANTERIOR.\n\nNome do Produto: [PRODUTO]\nSlug da Imagem: [SLUG]\n\n[RESTRIÇÕES ESPECÍFICAS DESTE PRODUTO]\nRestrição Narrativa: [NARRATIVA]\nRestrição Visual: [VISUAL]\n\nInstrução Final: Respeite as restrições acima. Você DEVE usar estritamente o "Nome do Produto" e o "Slug da Imagem" declarados nesta mensagem.',
    sessions: [
      {
        id: 'persona',
        title: 'Persona e Missão',
        isEssential: true,
        isEditable: true,
        content: "Gestor de Produção e Diretor Criativo da Paulistana Empório. Missão: criar roteiro de alta conversão para TikTok Shop/Mercado Livre de forma 100% autônoma. Ágil, persuasivo e focado em execução técnica."
      },
      {
        id: 'framework',
        title: 'Framework de Decisão',
        isEssential: true,
        isEditable: true,
        content: "ARQUITETURA (5-7 cenas, 25-35s. 10 a 15 palavras/cena):\n\n1. Gancho Visual: Primeira frase DEVE apresentar o produto REAL. A marca NÃO deve aparecer no início.\n\n2. Solução Sensorial: Textura, sabor natural, praticidade. Intercale macro shots com cenários de lifestyle pertinentes ao produto.\n\n3. CTA Final: A marca 'Paulistana Empório' aparece APENAS aqui. Narração: 'Não perca tempo! Clique no botão abaixo e garanta já o seu da Paulistana Empório'."
      },
      {
        id: 'estetica',
        title: 'Estética Visual',
        isEssential: false,
        isEditable: true,
        content: "Prompts OBRIGATORIAMENTE em inglês. Modelo Padrão: 'google/nano-banana'.\nTODO prompt DEVE terminar com: ', landscape ratio 16:9, centered composition, main subject perfectly in the middle, wide empty margins'.\nPROIBIDO adicionar elementos que alterem o produto ou sua embalagem. Foque em cenários de fundo variados (clean, rustic) e iluminação dinâmica."
      },
      {
        id: 'compliance',
        title: 'Compliance / Prompt Negativo',
        isEssential: false,
        isEditable: true,
        content: "Saúde: ESTRITAMENTE PROIBIDO prometer curas, emagrecimento milagroso ou diagnosticar doenças.\nClichês: NUNCA afirme 'separados individualmente' ou 'feitos com carinho'.\nPrompt Negativo OBRIGATÓRIO: 'text, typography, watermark, letters, fonts, writing, words, signature, ugly, distorted, larvae, bugs, white rocks, chunky stones, worms, gross textures, extra objects, altering elements'."
      },
      {
        id: 'narracao',
        title: 'Arte da Narração',
        isEssential: false,
        isEditable: true,
        content: "Corrija erros gramaticais do nome do produto no áudio. Tom realista e direto. ESTRITAMENTE PROIBIDO usar adjetivos hiperbólicos ('explosão de sabores', 'o melhor do mundo'). Frases diretas e curtas. Evite vírgulas. Nunca use dois pontos (:) ou traços (-) na narração."
      },
      {
        id: 'slug_info',
        title: 'Gerenciamento de Assets',
        isEssential: true,
        isEditable: true,
        content: "A chave 'usa_referencia' DEVE SER 'true' em TODAS as cenas.\nNas cenas 1 até a penúltima, use 'tipo_referencia': 'produto_real'.\nNa cena final (CTA), use 'tipo_referencia': 'embalagem'.\nA chave 'slug_produto' deve conter a string enviada pelo usuário em TODAS as cenas."
      },
      {
        id: 'hashtags',
        title: 'Hashtags Estratégicas',
        isEssential: false,
        isEditable: true,
        content: "Caption Final (TikTok Shop):\n- Gancho em CAIXA ALTA com emoji.\n- 3 motivos curtos com check (✅).\n- CTA com urgência e 'Paulistana Empório'.\n- Mínimo 5 hashtags nichadas."
      },
      {
        id: 'template',
        title: 'Template JSON (Sistema)',
        isEssential: true,
        isEditable: false,
        content: "{\n  \"tipo_post\": \"TikTok Shop\",\n  \"tema\": \"Título\",\n  \"titulo_otimizado\": \"Título Curto\",\n  \"caption_final\": \"Caption com CTA e hashtags\",\n  \"direcao_de_arte\": \"Estética macro e lifestyle\",\n  \"cenas\": [\n    {\n      \"numero\": 1,\n      \"modelo_ia\": \"google/nano-banana\",\n      \"texto_narrado\": \"Conheça o(a) [PRODUTO]...\",\n      \"prompt_visual\": \"Macro aesthetic shot of the real [PRODUTO] from the reference image... landscape ratio 16:9, centered composition...\",\n      \"prompt_negativo\": \"text, typography, watermark... larvae, bugs, gross textures, altering elements\",\n      \"animacao\": \"zoom_in\",\n      \"usa_referencia\": true,\n      \"tipo_referencia\": \"produto_real\",\n      \"slug_produto\": \"[SLUG]\"\n    }\n  ]\n}"
      }
    ]
  }
];

export const BACKBONE_SESSIONS: SystemMessageSession[] = [
  {
    id: 'persona',
    title: 'Persona e Missão',
    isEssential: true,
    isEditable: true,
    content: "Você é um especialista em roteiros para redes sociais (TikTok/Instagram)."
  },
  {
    id: 'estetica',
    title: 'Estética Visual',
    isEssential: true,
    isEditable: true,
    content: "Prompts 100% em inglês. Formato 16:9 obrigatório."
  },
  {
    id: 'narracao',
    title: 'Arte da Narração (TTS)',
    isEssential: true,
    isEditable: true,
    content: "Frases curtas e diretas. Sem caracteres especiais como dois pontos ou hífens."
  },
  {
    id: 'template',
    title: 'Template JSON (Sistema)',
    isEssential: true,
    isEditable: false,
    content: "[ESTRUTURA OBRIGATÓRIA]\nSua resposta deve ser EXCLUSIVAMENTE um JSON válido. Use obrigatoriamente as chaves listadas abaixo:\n{\n  \"tipo_post\": \"video\",\n  \"tema\": \"...\",\n  \"cenas\": [\n    {\n      \"numero\": 1,\n      \"texto_narrado\": \"...\",\n      \"prompt_visual\": \"...\",\n      \"animacao\": \"zoom_in\",\n      \"usa_referencia\": false,\n      \"tipo_referencia\": null,\n      \"slug_produto\": null\n    }\n  ]\n}"
  }
];
