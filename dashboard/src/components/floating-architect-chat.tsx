'use client';

import { useRef, useState } from 'react';
import { Send, Loader2, User, Bot, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import { usePresetStore } from '@/store/presetStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_ARCHITECT_PROMPT = `
Você é o Arquiteto Master do Cocreator. Sua função é receber os pedidos do usuário sobre o lote/preset atual e RECONFIGURAR o preset DESTA SESSÃO ESPECÍFICA. Suas mudanças afetarão apenas a lista atual (pois o preset original foi clonado como rascunho temporário).
Você deve se comunicar de forma extremamente direta e concisa. Responda o que foi alterado e PRONTO. Nada de explicações longas.
Use as ferramentas disponíveis para alterar o Preset. As ferramentas são ações que você pode retornar no formato JSON (embora seu output aqui seja apenas texto para o usuário, o backend interceptará suas tool calls).
O usuário pode pedir coisas como: "Faça todos os vídeos mais curtos", "Mude o estilo visual para dark", "Agora quero que os títulos sejam clickbait".

Ferramentas disponíveis no backend (você não precisa formatar JSON, apenas responda em texto o que fará, e o framework de agents chamará as tools por debaixo dos panos baseado no seu intent):
- **Atualizar_Prompt_Base**: Para mudar o prompt master.
- **Atualizar_Card**: Para preencher ou editar o conteúdo de QUALQUER card.
- **Ajustar_Parametros_Globais**: (model, temperature).
`;

export interface ArchitectChatProps {
  activePresetId?: string;
  onRefreshPreset?: () => void;
}

export default function ArchitectChat({ activePresetId, onRefreshPreset }: ArchitectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const presets = usePresetStore(state => state.presets);
  const activePreset = presets.find(p => p.id === activePresetId);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activePresetId || !activePreset) {
      if (!activePresetId) alert('Selecione um Preset primeiro.');
      return;
    }

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          track: activePreset.type || 'video',
          active_preset_id: activePresetId, 
          session_id: activePresetId, // Architect usa o presetId como sessionId
          current_sessions: activePreset.sessions || [],
          prompt: activePreset.prompt || '',
          model: activePreset.model || 'gpt5.4',
          temperature: activePreset.temperature || 0.7,
          
          architect_model: 'gemini 3.1 pro',
          architect_prompt: DEFAULT_ARCHITECT_PROMPT,
          use_real_products: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha no Agente');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      
      if (onRefreshPreset) {
         // Pequeno delay para garantir que o webhook atualizou o DB
         setTimeout(() => {
           onRefreshPreset();
         }, 1500);
      }
      
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro na comunicação com o Arquiteto.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5" />
          Arquiteto Global
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
          Diretor Criativo Master. Altere o preset globalmente conversando.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70 p-6">
            <Bot className="w-12 h-12 text-emerald-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-sm">
              Diga o que você quer mudar neste lote. Eu vou reconfigurar o Preset de forma global. Ex: "Deixe os roteiros mais curtos" ou "Crie uma regra visual sem fundos escuros".
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border",
              m.role === 'user' ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500" : "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
            )}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={clsx(
              "max-w-[85%] p-4 text-sm rounded-2xl shadow-sm",
              m.role === 'user' 
                ? "bg-zinc-900 text-white dark:bg-zinc-800 rounded-tr-none" 
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-none font-medium prose prose-sm prose-emerald dark:prose-invert"
            )}>
              {m.role === 'user' ? m.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-emerald-500/70 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Processando alterações...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <form onSubmit={sendMessage} className="relative flex items-center max-w-4xl mx-auto">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            disabled={loading || !activePresetId}
            placeholder={!activePresetId ? "Selecione um lote..." : "Comande o Arquiteto..."}
            className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading || !activePresetId} 
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-emerald-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
