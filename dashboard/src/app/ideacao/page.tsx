'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from 'react';
import ChatPanel from '@/components/chat-panel';
import { usePresetStore } from '@/store/presetStore';
import { fetchProducts, Product } from '@/services/supabase-service';
import { Lightbulb, Database, Sparkles, Settings2, Box, Tag, Copy, Check, Edit3 } from 'lucide-react';
import clsx from 'clsx';
import PresetEditorModal from '@/components/preset-editor-modal';

const DEFAULT_IDEATION_PROMPT = `[INSTRUÇÕES DO DIRETOR DE IDEACAO]
Você é um estrategista de conteúdo especializado em criar pautas para produção em massa.
Seu objetivo é receber um tema central do usuário e gerar uma lista de ideias para vídeos.
Para cada ideia da lista, você deve definir obrigatoriamente:
1. O "tema" específico do vídeo.
2. O "prompt" contendo as diretrizes de como o roteirista deve desenvolver este roteiro.
3. O "titulo_otimizado" (título cativante de até 100 caracteres).
4. As "captions" (uma legenda persuasiva, limpa e persuasiva).
5. As "hashtags" (de 5 a 10 hashtags estratégicas separadas por espaços, ex: "#marketing #seo").

Quando o usuário pedir para gerar ou salvar a lista, você DEVE OBRIGATORIAMENTE utilizar a ferramenta \`save_ideation_list\` fornecendo todos os campos acima em cada item.
Após usar a ferramenta com sucesso, responda: "✅ Lista de produção gerada e salva com sucesso. Você já pode acessá-la no painel de Produção em Massa."`;

function IdeationStudioContent() {
  const { presets, initializePresets } = usePresetStore();
  
  // State
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [ideationSystemMessage, setIdeationSystemMessage] = useState(DEFAULT_IDEATION_PROMPT);
  const [isEditingDNA, setIsEditingDNA] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useStoreProducts, setUseStoreProducts] = useState(true);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  // Load products and presets from Supabase
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products in ideation page:', err);
      }
    }
    loadProducts();
    initializePresets();
  }, [initializePresets]);

  // Setup initial preset
  useEffect(() => {
    if (presets.length > 0 && !activePresetId) {
      setActivePresetId(presets[0].id);
    }
  }, [presets, activePresetId]);

  const activePreset = useMemo(() => presets.find(p => p.id === activePresetId), [presets, activePresetId]);

  // Combine Ideation Agent DNA with the active Preset context and Product list context
  const consolidatedSystemMessage = useMemo(() => {
    let presetContext = '';
    if (activePreset) {
      presetContext = `\n\n[CONTEXTO DO FORMATO (PRESET)]\nVocê está idealizando listas para o seguinte Preset:\nNome: ${activePreset.name}\nPrompt Base do Roteiro: ${activePreset.prompt}`;
    }
    
    let productContext = '';
    if (useStoreProducts && products.length > 0) {
      const lines = products.map(p => `- **${p.Produto}**: slug_embalagem = \`${p.slug_embalagem}\`, slug_imagem_real = \`${p.slug_imagem_real}\`${p.Restricao_Narrativa ? `, restrição narrativa: "${p.Restricao_Narrativa}"` : ''}${p.Restricao_Visual ? `, restrição visual: "${p.Restricao_Visual}"` : ''}`);
      productContext = `\n\n[LISTA DE PRODUTOS REAIS DISPONÍVEIS E SEUS SLUGS]
Seja extremamente intencional e use os slugs destes produtos reais ao conceber ideias e temas de vídeo. Se a pauta/ideia envolver um produto específico, adicione diretrizes detalhadas no campo "prompt" da ideia especificando qual slug real usar (exemplo: "Usar slug de imagem real: uva-passa-preta" ou "Usar slug de embalagem: comparativo-tamara-vs-uva-passa-preta").
Evite inventar slugs de produtos que não estão na lista abaixo.

Produtos reais cadastrados:
${lines.join('\n')}`;
    }

    return `${ideationSystemMessage}${presetContext}${productContext}`;
  }, [ideationSystemMessage, activePreset, products, useStoreProducts]);

  // Handle clipboard copying for slugs
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle intercepting the tool success (optional UI flourish)
  const handleIdeationToolSuccess = (toolName: string) => {
    if (toolName === 'save_ideation_list') {
       console.log('Ideation List Saved via Agent Tool!');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* SIDEBAR: Configuration */}
      <div className="w-[380px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full shadow-2xl z-10 shrink-0">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Ideation Studio
          </h2>
          <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">
            Gerador de Listas Temáticas
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Preset Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-indigo-500" /> 
                Vincular ao Preset
              </label>
              {activePresetId && (
                <button 
                  onClick={() => setIsEditorModalOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Editar Arquiteto
                </button>
              )}
            </div>
            <select
              value={activePresetId}
              onChange={(e) => setActivePresetId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            {/* Resumo visual do Preset (Mini-Cards) */}
            {activePreset && activePreset.sessions && activePreset.sessions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activePreset.sessions.slice(0, 3).map(s => (
                  <span key={s.id} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase rounded">
                    {s.title}
                  </span>
                ))}
                {activePreset.sessions.length > 3 && (
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase rounded">
                    +{activePreset.sessions.length - 3}
                  </span>
                )}
              </div>
            )}
            
            <p className="text-[10px] font-medium text-zinc-400 mt-2">
              A lista de prompts gerada será desenhada para funcionar perfeitamente com este formato de roteiro.
            </p>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 w-full" />

          {/* Real Products List Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-emerald-500" />
                Produtos Reais Sincronizados
              </label>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setUseStoreProducts(!useStoreProducts)}>
                <span className="text-[10px] font-bold text-zinc-400">Usar no Contexto?</span>
                <button
                  type="button"
                  className={clsx(
                    "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                    useStoreProducts ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      useStoreProducts ? "translate-x-3" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
            
            {products.length === 0 ? (
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 italic p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 text-center">
                Carregando produtos...
              </div>
            ) : !useStoreProducts ? (
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 italic p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 text-center">
                Contexto de produtos desativado.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {products.map((p, idx) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-3 space-y-2 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate max-w-[280px]">
                        {p.Produto}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {p.slug_embalagem && (
                        <button 
                          onClick={() => handleCopy(p.slug_embalagem, `emb-${idx}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 rounded-md text-[9px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                          title="Copiar slug de embalagem"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>emb: {p.slug_embalagem}</span>
                          {copiedId === `emb-${idx}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                        </button>
                      )}
                      
                      {p.slug_imagem_real && (
                        <button 
                          onClick={() => handleCopy(p.slug_imagem_real, `img-${idx}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30 rounded-md text-[9px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                          title="Copiar slug de imagem real"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>real: {p.slug_imagem_real}</span>
                          {copiedId === `img-${idx}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">
              O Agente de Ideação possui total visibilidade desta lista e usará os slugs reais. Clique nos badges acima para copiar os slugs se desejar.
            </p>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 w-full" />

          {/* Ideation DNA Editor */}
          <div className="space-y-3 flex-1 flex flex-col pb-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-amber-500" /> 
                DNA do Agente Ideador
              </label>
              <button 
                onClick={() => setIsEditingDNA(!isEditingDNA)}
                className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 uppercase"
              >
                {isEditingDNA ? 'Ocultar' : 'Editar'}
              </button>
            </div>
            
            {isEditingDNA ? (
              <textarea
                value={ideationSystemMessage}
                onChange={(e) => setIdeationSystemMessage(e.target.value)}
                className="w-full flex-1 min-h-[200px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none shadow-inner"
                placeholder="Insira as instruções do Agente de Ideação..."
              />
            ) : (
              <div className="w-full flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-[10px] font-mono text-zinc-500 overflow-y-auto max-h-[200px] whitespace-pre-wrap shadow-inner">
                {ideationSystemMessage}
              </div>
            )}
            
            <p className="text-[10px] font-medium text-amber-600/70 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
              Mantenha a instrução da ferramenta <strong>save_ideation_list</strong> para garantir que a lista seja salva no banco.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN AREA: Chat Interface */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        <div className="absolute top-6 right-6 z-10">
          <a href="/ideacao/listas" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Ver Listas Salvas
          </a>
        </div>
        <ChatPanel 
          title="Agente de Ideação"
          description="Estrategista especializado em gerar listas temáticas para produção em massa."
          apiEndpoint="/api/chat/ideacao"
          icon={<Sparkles className="w-5 h-5 text-amber-500" />}
          systemMessage={consolidatedSystemMessage}
          onToolSuccess={handleIdeationToolSuccess}
          metadata={{ preset_id: activePresetId }}
        />
      </div>

      {isEditorModalOpen && (
        <PresetEditorModal presetId={activePresetId} onClose={() => setIsEditorModalOpen(false)} />
      )}
    </div>
  );
}

export default function IdeationStudioPage() {
  return <Suspense fallback={null}><IdeationStudioContent /></Suspense>;
}