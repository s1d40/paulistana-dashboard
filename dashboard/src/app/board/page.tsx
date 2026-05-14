'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Layout, ArrowRight, ArrowLeft, Trash2, Sparkles, UserCircle } from 'lucide-react';
import clsx from 'clsx';

type TaskStatus = 'ideia' | 'fazendo' | 'concluido';

interface Task {
  id: string;
  titulo: string;
  descricao: string;
  status: TaskStatus;
  autor_email: string;
  autor_nome?: string;
  cor?: string;
  data_criacao: string;
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAuthor, setNewTaskAuthor] = useState('');
  const [newTaskCor, setNewTaskCor] = useState('zinc');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { id: 'zinc', bg: 'bg-zinc-900', border: 'border-zinc-800', accent: 'text-zinc-400', glow: 'hover:border-zinc-500/30' },
    { id: 'orange', bg: 'bg-orange-950/20', border: 'border-orange-900/50', accent: 'text-orange-500', glow: 'hover:border-orange-500/50' },
    { id: 'blue', bg: 'bg-blue-950/20', border: 'border-blue-900/50', accent: 'text-blue-500', glow: 'hover:border-blue-500/50' },
    { id: 'purple', bg: 'bg-purple-950/20', border: 'border-purple-900/50', accent: 'text-purple-500', glow: 'hover:border-purple-500/50' },
    { id: 'emerald', bg: 'bg-emerald-950/20', border: 'border-emerald-900/50', accent: 'text-emerald-500', glow: 'hover:border-emerald-500/50' },
    { id: 'pink', bg: 'bg-pink-950/20', border: 'border-pink-900/50', accent: 'text-pink-500', glow: 'hover:border-pink-500/50' },
  ];

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
        setUserName(name);
        setNewTaskAuthor(name);
      }

      const { data } = await supabase
        .from('mural_ideias')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (data) setTasks(data as Task[]);
      setLoading(false);
    };

    fetchUserAndTasks();

    const channel = supabase
      .channel('mural_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mural_ideias' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('mural_ideias').insert([{
      titulo: newTaskTitle,
      descricao: newTaskDesc,
      status: 'ideia',
      autor_email: userEmail || 'localhost@dev.com',
      autor_nome: newTaskAuthor || userName || 'Anônimo',
      cor: newTaskCor
    }]);

    if (!error) {
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsModalOpen(false);
    } else {
      console.error('[Board] Error creating idea:', error);
      alert(`Erro ao criar ideia: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleMove = async (id: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    const { error } = await supabase.from('mural_ideias').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('[Board] Error moving task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta ideia?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('mural_ideias').delete().eq('id', id);
    if (error) {
      console.error('[Board] Error deleting task:', error);
    }
  };

  const columns: { id: TaskStatus; title: string; color: string; border: string }[] = [
    { id: 'ideia', title: 'Ideias (Backlog)', color: 'bg-zinc-800/50', border: 'border-zinc-700' },
    { id: 'fazendo', title: 'Em Progresso', color: 'bg-indigo-900/20', border: 'border-indigo-500/30' },
    { id: 'concluido', title: 'Concluído', color: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  ];

  return (
    <div className="min-h-screen bg-[#0c0a09] text-zinc-100 font-sans selection:bg-orange-500/30 flex flex-col relative overflow-hidden">
      {/* Background Decorativo Dusk */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <header className="relative z-10 px-8 py-6 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl shadow-lg shadow-orange-500/20">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white italic">
              Mural da <span className="text-orange-500">Equipe</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Cocreator Internal Board</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Ideia
        </button>
      </header>

      <main className="relative z-10 flex-1 p-8 overflow-x-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-orange-500">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-6 h-[calc(100vh-160px)] min-w-[1000px]">
            {columns.map(col => (
              <div key={col.id} className={clsx("flex-1 rounded-[2rem] border p-4 flex flex-col backdrop-blur-md", col.color, col.border)}>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 px-2 flex items-center justify-between">
                  {col.title}
                  <span className="bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px]">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </h2>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {tasks.filter(t => t.status === col.id).map(task => {
                    const cardColor = colors.find(c => c.id === task.cor) || colors[0];
                    return (
                      <div key={task.id} className={clsx("border p-5 rounded-2xl shadow-xl transition-all group flex flex-col gap-3", cardColor.bg, cardColor.border, cardColor.glow)}>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-white text-sm leading-tight">{task.titulo}</h3>
                          <button onClick={() => handleDelete(task.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {task.descricao && (
                          <p className="text-xs text-zinc-500 line-clamp-3 italic leading-relaxed">
                            {task.descricao}
                          </p>
                        )}
                        
                        <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-800/50">
                          <div className={clsx("flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold", cardColor.accent)}>
                            <UserCircle className="w-3.5 h-3.5" />
                            {task.autor_nome || task.autor_email?.split('@')[0] || 'Anônimo'}
                          </div>
                          
                          <div className="flex gap-1">
                            {col.id !== 'ideia' && (
                              <button 
                                onClick={() => handleMove(task.id, col.id === 'concluido' ? 'fazendo' : 'ideia')}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                title="Mover para trás"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {col.id !== 'concluido' && (
                              <button 
                                onClick={() => handleMove(task.id, col.id === 'ideia' ? 'fazendo' : 'concluido')}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                title="Mover para frente"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Nova Ideia */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0a09] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-8 py-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
              <h2 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" /> Adicionar Ideia
              </h2>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Título</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500/50 outline-none"
                    placeholder="Título da ideia..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seu Nome</label>
                  <input 
                    type="text" 
                    required
                    value={newTaskAuthor}
                    onChange={e => setNewTaskAuthor(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500/50 outline-none"
                    placeholder="Quem é você?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cor do Card</label>
                <div className="flex gap-3">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setNewTaskCor(color.id)}
                      className={clsx(
                        "w-10 h-10 rounded-xl border-2 transition-all",
                        color.bg,
                        color.border,
                        newTaskCor === color.id ? "scale-110 border-white" : "opacity-50 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição (Opcional)</label>
                <textarea 
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500/50 outline-none resize-none"
                  placeholder="Detalhes, links de referência, anotações..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
