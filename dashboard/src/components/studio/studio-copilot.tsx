import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, MessageSquare, 
  Sparkles, Loader2, Maximize2, Minimize2,
  Trash2, RefreshCw
} from 'lucide-react';
import { VideoScript } from '@/types/content-studio';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StudioCopilotProps {
  id_post: string;
  currentScript: VideoScript;
  onScriptUpdate: (newScript: VideoScript) => void;
}

export const StudioCopilot: React.FC<StudioCopilotProps> = ({ 
  id_post, 
  currentScript, 
  onScriptUpdate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_post,
          messages: newMessages,
          current_script: currentScript
        })
      });

      if (!response.ok) throw new Error('Falha no Copilot');

      const data = await response.json();
      
      if (data.updated_script) {
        onScriptUpdate(data.updated_script);
      }

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }

    } catch (err) {
      console.error('[Copilot] Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar seu comando.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Limpar histórico do chat?')) {
      setMessages([]);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group z-50"
      >
        <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#0c0a09] animate-pulse" />
      </button>
    );
  }

  return (
    <div className={clsx(
      "fixed bottom-8 right-8 w-96 bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col transition-all z-50 overflow-hidden",
      isMinimized ? "h-16" : "h-[600px]"
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Studio Copilot</h3>
            <p className="text-[8px] font-mono text-zinc-500 uppercase">AI Assistant Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Limpar Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-600 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_bottom,#111_0%,#000_100%)]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <Sparkles className="w-10 h-10 text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Como posso ajudar na sua produção hoje?
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-[200px]">
                  {["Mude a cena 1", "Adicione uma cena", "Melhore a legenda"].map(hint => (
                    <button 
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[8px] font-bold text-zinc-400 hover:bg-zinc-800 transition-all uppercase tracking-tighter"
                    >
                      &quot;{hint}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={clsx(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={clsx(
                  "p-4 rounded-[1.5rem] text-xs leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest px-2">
                  {msg.role === 'user' ? 'Você' : 'Copilot'}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-3 text-indigo-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest animate-pulse">Processando Scripts...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-zinc-900 bg-black/40">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Diga ao Copilot o que mudar..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-14 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700 shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-3 text-[7px] text-zinc-600 text-center font-black uppercase tracking-[0.2em]">
              O Copilot pode alterar o script e os assets do vídeo.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
