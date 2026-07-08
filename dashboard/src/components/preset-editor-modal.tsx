'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Loader2, Sparkles, Wand2, Database, Edit3, Lock, ChevronDown, Settings2 } from 'lucide-react';
import clsx from 'clsx';
import { usePresetStore, SystemMessageSession } from '@/store/presetStore';

interface PresetEditorModalProps {
  presetId: string | null;
  onClose: () => void;
}

export default function PresetEditorModal({ presetId, onClose }: PresetEditorModalProps) {
  const { presets, updatePreset } = usePresetStore();
  const [mounted, setMounted] = useState(false);
  
  const preset = presets.find(p => p.id === presetId);
  
  const [localSessions, setLocalSessions] = useState<SystemMessageSession[]>([]);
  const [localPrompt, setLocalPrompt] = useState('');
  const [localModel, setLocalModel] = useState('gpt-4o');
  const [localTemp, setLocalTemp] = useState(0.7);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (preset) {
      setLocalSessions(preset.sessions || []);
      setLocalPrompt(preset.prompt || '');
      setLocalModel(preset.model || 'gpt-4o');
      setLocalTemp(preset.temperature || 0.7);
    }
  }, [preset]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!mounted || !presetId || !preset) return null;

  const handleUpdateLocalSession = (sessionId: string, newContent: string) => {
    setLocalSessions(prev => prev.map(s => s.id === sessionId ? { ...s, content: newContent } : s));
  };

  const handleSaveSession = (sessionId: string) => {
    updatePreset(presetId, { sessions: localSessions });
    setEditingSessionId(null);
  };

  const handleSaveSettings = () => {
    updatePreset(presetId, { 
      prompt: localPrompt, 
      model: localModel, 
      temperature: localTemp 
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          active_preset_id: presetId,
          architect_model: localModel,
          architect_prompt: localPrompt,
        })
      });

      if (!response.ok) throw new Error('Falha no Arquiteto');

      const data = await response.json();
      
      const assistantMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.metadata?.is_architect_update && data.metadata?.new_sessions) {
        setLocalSessions(data.metadata.new_sessions);
        updatePreset(presetId, { sessions: data.metadata.new_sessions });
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro ao comunicar com o Arquiteto.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="w-full max-w-7xl h-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Settings2 className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Editor de Preset: {preset.name}</h2>
              <p className="text-xs text-zinc-500">Ajuste o DNA do Arquiteto globalmente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          
          {/* Cockpit - Cards */}
          <div className="w-2/3 bg-zinc-950 border-r border-zinc-800 overflow-y-auto p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-500" /> DNA do Arquiteto (Sessões)
              </h3>
              <button onClick={handleSaveSettings} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg">
                Salvar Configurações
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Modelo Base</label>
                  <input 
                    type="text" 
                    value={localModel} 
                    onChange={e => setLocalModel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white" 
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Temperatura: {localTemp}</label>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={localTemp} 
                    onChange={e => setLocalTemp(parseFloat(e.target.value))}
                    className="w-full mt-2" 
                  />
                </div>
                <div className="space-y-2 flex-[2]">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Prompt Global</label>
                  <input 
                    type="text" 
                    value={localPrompt} 
                    onChange={e => setLocalPrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white" 
                  />
                </div>
              </div>

              {localSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div key={session.id} className={clsx("rounded-2xl border bg-zinc-900 flex flex-col p-4 transition-all", isExpanded ? "col-span-2 border-indigo-500/50" : "col-span-1 border-zinc-800")}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}>
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                           {session.isEssential ? <Lock className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-white tracking-wider">{session.title}</h4>
                      </div>
                      <div className="flex gap-2">
                         {!isEditing && <button onClick={() => setEditingSessionId(session.id)} className="p-1.5 text-zinc-400 hover:text-white"><Edit3 className="w-3 h-3" /></button>}
                         <button onClick={() => setExpandedSessionId(isExpanded ? null : session.id)} className="p-1.5 text-zinc-400 hover:text-white">
                            <ChevronDown className={clsx("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
                         </button>
                      </div>
                    </div>
                    
                    {isExpanded ? (
                      <div className="mt-2 space-y-3 flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                             <textarea 
                              value={session.content} 
                              onChange={(e) => handleUpdateLocalSession(session.id, e.target.value)} 
                              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-mono text-zinc-300 outline-none" 
                             />
                             <div className="flex gap-2">
                                <button onClick={() => setEditingSessionId(null)} className="flex-1 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg">Cancelar</button>
                                <button onClick={() => handleSaveSession(session.id)} className="flex-[2] py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg">Salvar</button>
                             </div>
                          </div>
                        ) : (
                          <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl max-h-48 overflow-y-auto">
                            <p className="text-[10px] text-zinc-400 whitespace-pre-wrap">{session.content}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 line-clamp-3 cursor-pointer" onClick={() => setExpandedSessionId(session.id)}>
                        {session.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-1/3 bg-zinc-900/50 flex flex-col">
            <div className="p-4 border-b border-zinc-800/50 flex items-center gap-3 shrink-0">
               <div className="p-2 bg-indigo-500/10 rounded-xl"><Bot className="w-5 h-5 text-indigo-400" /></div>
               <div>
                  <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Arquiteto</h3>
                  <p className="text-[9px] text-zinc-500">Peça para ele alterar os cards</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center mt-10">
                  <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Oi! Sou o Arquiteto. Me diga como você quer alterar este Preset (adicionar blocos, mudar o tom, etc).</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={clsx("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={clsx("px-4 py-3 rounded-2xl text-xs leading-relaxed", msg.role === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-zinc-800 text-zinc-300 rounded-bl-none")}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 text-zinc-500 bg-zinc-800/50 w-fit px-4 py-2 rounded-2xl rounded-bl-none">
                  <Loader2 className="w-3 h-3 animate-spin" /> <span className="text-[10px] font-medium">Pensando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ex: Adicione uma regra para usar tom sarcástico..." 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button onClick={handleSend} disabled={!input.trim() || isProcessing} className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white rounded-lg flex items-center justify-center transition-colors">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
