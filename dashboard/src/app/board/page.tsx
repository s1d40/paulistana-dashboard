'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Layout, Sparkles, UserCircle } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from './components/TaskCard';
import { Column } from './components/Column';
import clsx from 'clsx';

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

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('mural_ideias')
      .select('*')
      .order('posicao', { ascending: true });

    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
        setUserName(name);
        setNewTaskAuthor(name);
      }
    };

    fetchUser();
    fetchTasks();

    const channel = supabase
      .channel('mural_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mural_ideias' }, (payload) => {
        // Only fetch if we are not in the middle of a local update to avoid flickering
        // But for simplicity, we just fetch
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    
    // Get highest position for 'ideia' status
    const ideaTasks = tasks.filter(t => t.status === 'ideia');
    const nextPos = ideaTasks.length > 0 ? Math.max(...ideaTasks.map(t => t.posicao || 0)) + 1 : 0;

    const { error } = await supabase.from('mural_ideias').insert([{
      titulo: newTaskTitle,
      descricao: newTaskDesc,
      status: 'ideia',
      autor_email: userEmail || 'localhost@dev.com',
      autor_nome: newTaskAuthor || userName || 'Anônimo',
      cor: newTaskCor,
      posicao: nextPos
    }]);

    if (!error) {
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsModalOpen(false);
      fetchTasks();
    } else {
      console.error('[Board] Error creating idea:', error);
      alert(`Erro ao criar ideia: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  const handleQuickAdd = async (status: TaskStatus, title: string) => {
    const statusTasks = tasks.filter(t => t.status === status);
    const nextPos = statusTasks.length > 0 ? Math.max(...statusTasks.map(t => t.posicao || 0)) + 1 : 0;

    const { error } = await supabase.from('mural_ideias').insert([{
      titulo: title,
      status: status,
      autor_email: userEmail || 'localhost@dev.com',
      autor_nome: userName || 'Anônimo',
      cor: 'zinc',
      posicao: nextPos
    }]);

    if (error) {
      console.error('[Board] Error quick adding idea:', error);
    } else {
      fetchTasks();
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase.from('mural_ideias').update(updates).eq('id', id);
    if (error) {
      console.error('[Board] Error updating task:', error);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Excluir esta ideia?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('mural_ideias').delete().eq('id', id);
    if (error) {
      console.error('[Board] Error deleting task:', error);
      fetchTasks();
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Local clone for optimistic update
    const newTasks = [...tasks];
    const draggedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    if (draggedTaskIndex === -1) return;

    const draggedTask = { ...newTasks[draggedTaskIndex] };
    
    // Filter tasks by status and sort by position
    const sourceTasks = newTasks.filter(t => t.status === sourceStatus).sort((a, b) => (a.posicao || 0) - (b.posicao || 0));
    const destTasks = sourceStatus === destStatus 
      ? sourceTasks 
      : newTasks.filter(t => t.status === destStatus).sort((a, b) => (a.posicao || 0) - (b.posicao || 0));

    // Remove from source
    const [removed] = sourceTasks.splice(source.index, 1);
    
    // Update status and insert into destination
    removed.status = destStatus;
    destTasks.splice(destination.index, 0, removed);

    // Re-calculate positions for affected columns
    sourceTasks.forEach((t, i) => t.posicao = i);
    destTasks.forEach((t, i) => t.posicao = i);

    // Update global tasks state
    const updatedTasks = newTasks.map(t => {
      const sMatch = sourceTasks.find(st => st.id === t.id);
      if (sMatch) return sMatch;
      const dMatch = destTasks.find(dt => dt.id === t.id);
      if (dMatch) return dMatch;
      return t;
    });

    setTasks(updatedTasks);

    // Persist to DB
    const updates = destTasks.map((t, i) => ({
      ...t,
      posicao: i
    }));

    if (sourceStatus !== destStatus) {
      updates.push(...sourceTasks.map((t, i) => ({
        ...t,
        posicao: i
      })));
    }

    const { error } = await supabase.from('mural_ideias').upsert(updates);
    if (error) {
      console.error('[Board] Error updating positions:', error);
      fetchTasks();
    }
  };

  const columns: { id: TaskStatus; title: string; color: string; border: string }[] = [
    { id: 'ideia', title: 'Ideias (Backlog)', color: 'bg-zinc-800/20', border: 'border-zinc-800' },
    { id: 'fazendo', title: 'Em Progresso', color: 'bg-orange-900/10', border: 'border-orange-500/20' },
    { id: 'concluido', title: 'Concluído', color: 'bg-emerald-900/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#0c0a09] text-zinc-100 font-sans selection:bg-orange-500/30 flex flex-col relative overflow-hidden">
      {/* Background Decorativo Dusk */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full opacity-30" />
      </div>

      <header className="relative z-20 px-8 py-6 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl flex justify-between items-center">
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
        
        <div className="flex items-center gap-6">
          {userName && (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <UserCircle className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{userName}</span>
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Ideia
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-8 overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-orange-500">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-[calc(100vh-160px)] min-w-fit">
              {columns.map(col => (
                <Column 
                  key={col.id}
                  col={col}
                  tasks={tasks.filter(t => t.status === col.id).sort((a, b) => (a.posicao || 0) - (b.posicao || 0))}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  onQuickAdd={handleQuickAdd}
                  colors={colors}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Modal Nova Ideia (Mantido para criação detalhada) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0a09] border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:border-orange-500/50 outline-none"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:border-orange-500/50 outline-none"
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
                        newTaskCor === color.id ? "scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "opacity-30 hover:opacity-100"
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
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:border-orange-500/50 outline-none resize-none leading-relaxed"
                  placeholder="Detalhes, links de referência, anotações..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20"
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
