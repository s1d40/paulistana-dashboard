'use client';

import { useState, Suspense } from 'react';
import { usePresetStore, ContentType, SystemMessageSession, Preset } from '@/store/presetStore';
import { Plus, Save, Trash2, CheckCircle2, ArrowLeft, Lock, Unlock, Type, FileJson, Video, Layout, FileText, RefreshCcw, Copy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

function PresetsContent() {
  const { presets, activePresetId, addPreset, updatePreset, deletePreset, setActivePreset } = usePresetStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const [prevIdFromUrl, setPrevIdFromUrl] = useState<string | null>(null);

  // Sync state during render to avoid cascading renders
  if (idFromUrl && idFromUrl !== prevIdFromUrl) {
    setPrevIdFromUrl(idFromUrl);
    setEditingId(idFromUrl);
  }

  const editingPreset = presets.find((p) => p.id === editingId) || null;

  const handleCreateNew = () => {
    addPreset({
      name: 'Novo Preset',
      description: 'Descrição do preset',
      type: 'general',
      model: 'gpt-4o',
      temperature: 0.7,
      sessions: [
        {
          id: 'essential',
          title: 'Instruções Base (Essencial)',
          content: '',
          isEditable: false,
          isEssential: true
        },
        {
          id: 'cta',
          title: 'Chamada de Ação (CTA)',
          content: '',
          isEditable: true,
          isEssential: false
        }
      ],
      prompt: '',
    });
    
    // Select the newly created preset
    setTimeout(() => {
      const latest = usePresetStore.getState().presets;
      if (latest.length > 0) {
        setEditingId(latest[latest.length - 1].id);
      }
    }, 50);
  };

  const handleDuplicate = (preset: Preset) => {
    addPreset({
      name: `${preset.name} (Cópia)`,
      description: preset.description,
      type: preset.type,
      model: preset.model || 'gpt-4o',
      temperature: preset.temperature || 0.7,
      sessions: JSON.parse(JSON.stringify(preset.sessions)),
      prompt: preset.prompt,
    });
    
    setTimeout(() => {
      const latest = usePresetStore.getState().presets;
      if (latest.length > 0) {
        setEditingId(latest[latest.length - 1].id);
      }
    }, 50);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleUpdateSession = (sessionId: string, updates: Partial<SystemMessageSession>) => {
    if (!editingPreset || !editingPreset.sessions) return;
    const newSessions = editingPreset.sessions.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    );
    updatePreset(editingPreset.id, { sessions: newSessions });
  };

  const addSession = () => {
    if (!editingPreset) return;
    const currentSessions = editingPreset.sessions || [];
    const newSession: SystemMessageSession = {
      id: crypto.randomUUID(),
      title: 'Nova Sessão',
      content: '',
      isEditable: true,
      isEssential: false
    };
    updatePreset(editingPreset.id, { sessions: [...currentSessions, newSession] });
  };

  const removeSession = (sessionId: string) => {
    if (!editingPreset || !editingPreset.sessions) return;
    const session = editingPreset.sessions.find(s => s.id === sessionId);
    if (session?.isEssential) return;
    
    updatePreset(editingPreset.id, { 
      sessions: editingPreset.sessions.filter(s => s.id !== sessionId) 
    });
  };

  const toggleSessionEditable = (sessionId: string) => {
    if (!editingPreset || !editingPreset.sessions) return;
    const newSessions = editingPreset.sessions.map(s => 
      s.id === sessionId ? { ...s, isEditable: !s.isEditable } : s
    );
    updatePreset(editingPreset.id, { sessions: newSessions });
  };

  const getIconForType = (type: ContentType) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'carrossel': return <Layout className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      default: return <FileJson className="w-4 h-4" />;
    }
  };

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              Gestor de Presets v2
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Gerencie as sessões de System Message e comportamentos da sua linha de produção.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirm('Isso irá substituir todos os seus presets atuais pelos padrões. Deseja continuar?')) {
                  usePresetStore.getState().resetToDefaults();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors shadow-sm hover:bg-zinc-50"
            >
              <RefreshCcw className="w-5 h-5" />
              Carregar Padrões
            </button>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Criar Novo Preset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / List of Presets */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-xs">Meus Presets</h2>
            
            {presets.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">Nenhum preset encontrado.</p>
                <button
                  onClick={handleCreateNew}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Criar o primeiro preset
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setEditingId(preset.id);
                      setIsSaved(false);
                    }}
                    className={clsx(
                      "p-4 rounded-xl cursor-pointer transition-all border",
                      editingId === preset.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/50 shadow-inner'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "p-1 rounded text-zinc-500",
                            editingId === preset.id ? "bg-white dark:bg-zinc-800 shadow-sm" : "bg-zinc-100 dark:bg-zinc-800"
                          )}>
                            {getIconForType(preset.type || 'general')}
                          </span>
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                            {preset.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">
                          {preset.description}
                        </p>
                        {activePresetId === preset.id && (
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mt-2 border border-emerald-200 dark:border-emerald-800">
                            Preset Ativo <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-8">
            {editingPreset ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col h-full gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Configuração do Preset</h2>
                    <p className="text-xs text-zinc-500 font-medium">ID: {editingPreset.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(editingPreset)}
                      className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                      title="Duplicar Preset (Salvar como Cópia)"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePreset(editingPreset.id)}
                      className={clsx(
                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        activePresetId === editingPreset.id
                          ? 'bg-emerald-500 text-white cursor-default shadow-lg shadow-emerald-500/20'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      )}
                    >
                      {activePresetId === editingPreset.id ? 'Ativo' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este preset permanentemente?')) {
                          deletePreset(editingPreset.id);
                          setEditingId(null);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nome do Preset</label>
                    <input
                      type="text"
                      value={editingPreset.name}
                      onChange={(e) => updatePreset(editingPreset.id, { name: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tipo de Conteúdo</label>
                    <select
                      value={editingPreset.type}
                      onChange={(e) => updatePreset(editingPreset.id, { type: e.target.value as ContentType })}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-bold"
                    >
                      <option value="general">Geral / Misto</option>
                      <option value="video">Vídeos (TikTok/Reels)</option>
                      <option value="carrossel">Carrosséis (Instagram)</option>
                      <option value="blog">Blog Posts</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Descrição</label>
                    <input
                      type="text"
                      value={editingPreset.description}
                      onChange={(e) => updatePreset(editingPreset.id, { description: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white italic"
                    />
                  </div>
                </div>

                {/* Sessions Editor */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <FileJson className="w-4 h-4" /> Sessões do System Message
                    </h3>
                    <button 
                      onClick={addSession}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-900/30"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Sessão
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingPreset.sessions?.map((session) => (
                      <div 
                        key={session.id} 
                        className={clsx(
                          "border rounded-xl overflow-hidden transition-all shadow-sm",
                          session.isEssential ? "border-amber-200 dark:border-amber-900/30" : "border-zinc-200 dark:border-zinc-800"
                        )}
                      >
                        <div className={clsx(
                          "px-4 py-2 flex items-center justify-between border-b",
                          session.isEssential ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20" : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        )}>
                          <div className="flex items-center gap-2">
                            {session.isEssential ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-zinc-400" />}
                            <input 
                              type="text" 
                              value={session.title} 
                              readOnly={session.isEssential}
                              onChange={(e) => handleUpdateSession(session.id, { title: e.target.value })}
                              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 w-64 focus:text-indigo-600"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                             {!session.isEssential && (
                               <>
                                <button 
                                  onClick={() => toggleSessionEditable(session.id)}
                                  className={clsx(
                                    "p-1.5 rounded-md transition-colors",
                                    session.isEditable ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  )}
                                  title={session.isEditable ? "Edição Habilitada" : "Habilitar Edição"}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => removeSession(session.id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                               </>
                             )}
                          </div>
                        </div>
                        <div className="relative">
                          {!session.isEditable && !session.isEssential && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                              <button 
                                onClick={() => toggleSessionEditable(session.id)}
                                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95"
                              >
                                Clique para Editar
                              </button>
                            </div>
                          )}
                          <textarea
                            value={session.content}
                            onChange={(e) => handleUpdateSession(session.id, { content: e.target.value })}
                            readOnly={!session.isEditable && session.isEssential}
                            className={clsx(
                              "w-full h-48 px-4 py-3 bg-transparent outline-none font-mono text-xs resize-none dark:text-zinc-300 custom-scrollbar",
                              session.isEssential && "opacity-60 cursor-not-allowed"
                            )}
                            placeholder="Insira as instruções desta sessão..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Type className="w-4 h-4" /> Prompt (Instrução Específica)
                  </label>
                  <textarea
                    value={editingPreset.prompt}
                    onChange={(e) => updatePreset(editingPreset.id, { prompt: e.target.value })}
                    className="w-full h-32 px-4 py-3 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono text-sm resize-none shadow-inner"
                    placeholder="Instrução que varia conforme a campanha..."
                  />
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                   <button 
                     onClick={() => setEditingId(null)}
                     className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200 dark:border-zinc-700"
                   >
                     Fechar Editor
                   </button>
                   <button 
                     onClick={handleSave}
                     className={clsx(
                       "px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-2",
                       isSaved 
                        ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                     )}
                   >
                     {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                     {isSaved ? 'Preset Atualizado!' : 'Salvar Alterações'}
                   </button>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50">
                <Layout className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-xs">Selecione um preset ao lado ou crie um novo para editar.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function PresetsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <PresetsContent />
    </Suspense>
  );
}
