'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, X, Check } from 'lucide-react';
import clsx from 'clsx';
import { Task, TaskCard, TaskStatus } from './TaskCard';

interface ColumnProps {
  col: { id: TaskStatus; title: string; color: string; border: string };
  tasks: Task[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onQuickAdd: (status: TaskStatus, title: string) => void;
  colors: any[];
}

export function Column({ col, tasks, onDelete, onUpdate, onQuickAdd, colors }: ColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleAdd = () => {
    if (quickTitle.trim()) {
      onQuickAdd(col.id, quickTitle);
      setQuickTitle('');
      setIsAdding(false);
    }
  };

  return (
    <Droppable droppableId={col.id}>
      {(provided, snapshot) => (
        <div 
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={clsx(
            "flex-1 min-w-[320px] max-w-[400px] rounded-[2rem] border p-4 flex flex-col bg-zinc-900/10 backdrop-blur-md transition-colors", 
            col.color, 
            col.border,
            snapshot.isDraggingOver ? "bg-zinc-800/40 border-orange-500/30" : "border-zinc-800/50"
          )}
        >
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 px-4 py-2 flex items-center justify-between border-b border-zinc-800/30">
            {col.title}
            <span className="bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px] font-mono">
              {tasks.length}
            </span>
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 custom-scrollbar pb-4 min-h-[150px]">
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onDelete={onDelete} 
                onUpdate={onUpdate}
                colors={colors}
              />
            ))}
            {provided.placeholder}
          </div>

          {/* Quick Add at bottom */}
          <div className="mt-4 px-2">
            {isAdding ? (
              <div className="bg-zinc-900/80 border border-orange-500/30 p-3 rounded-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                <input
                  autoFocus
                  placeholder="Título da ideia..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                  className="bg-transparent border-none text-sm text-white outline-none w-full"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="p-1 text-zinc-500 hover:text-zinc-400">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleAdd} className="p-1 text-emerald-500 hover:text-emerald-400">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                Adicionar Card
              </button>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}
