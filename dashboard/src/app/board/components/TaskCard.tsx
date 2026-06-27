'use client';

import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, UserCircle, GripVertical, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { Portal } from '@/components/portal';

export type TaskStatus = 'ideia' | 'fazendo' | 'concluido';

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  status: TaskStatus;
  autor_email: string;
  autor_nome?: string;
  cor?: string;
  data_criacao: string;
  posicao?: number;
  tags?: string[];
}

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  colors: any[];
}

export function TaskCard({ task, index, onDelete, onUpdate, colors }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.titulo);
  
  const cardColor = colors.find(c => c.id === task.cor) || colors[0];

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.titulo) {
      onUpdate(task.id, { titulo: editTitle });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.titulo);
    setIsEditing(false);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => {
        const cardContent = (
          <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              // Use fixed positioning only when dragging to avoid layout breaks
              position: snapshot.isDragging ? 'fixed' : ((provided.draggableProps.style as any)?.position || 'relative'),
            }}
            className={clsx(
              "border p-4 rounded-2xl shadow-xl transition-all group flex flex-col gap-3 group/card", 
              cardColor.bg, 
              cardColor.border, 
              cardColor.glow,
              snapshot.isDragging ? "!z-[9999] border-orange-500 shadow-orange-500/40 rotate-1 scale-105" : "hover:border-zinc-500/50"
            )}
          >
            {/* Header / Drag Handle */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  {...provided.dragHandleProps} 
                  className="p-1 hover:bg-white/10 rounded-md cursor-grab active:cursor-grabbing text-zinc-600 transition-colors"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleCancel();
                      }}
                      className="bg-black/40 border border-orange-500/50 rounded px-2 py-1 text-sm text-white w-full outline-none"
                    />
                    <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancel} className="text-zinc-500 hover:text-zinc-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 
                    onClick={() => setIsEditing(true)}
                    className="font-bold text-white text-sm leading-tight truncate cursor-text hover:text-orange-400 transition-colors flex-1"
                  >
                    {task.titulo}
                  </h3>
                )}
              </div>
              
              <button 
                onClick={() => onDelete(task.id)} 
                className="text-zinc-600 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pl-6">
                {task.tags.map((tag, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Description */}
            {task.descricao && (
              <p className="text-[11px] text-zinc-500 line-clamp-2 italic leading-relaxed pl-6">
                {task.descricao}
              </p>
            )}
            
            {/* Footer */}
            <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-800/30 pl-6">
              <div className={clsx("flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-black", cardColor.accent)}>
                <UserCircle className="w-3.5 h-3.5" />
                {task.autor_nome || task.autor_email?.split('@')[0] || 'Anônimo'}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    alert('Enviando ideia para a Inteligência Artificial criar o roteiro base...');
                    // Chama a API de single_production do Next
                    try {
                      const res = await fetch('/api/production', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'single_production',
                          presetName: 'Roteiro Express (Mural)',
                          systemMessage: 'Você é um roteirista. Crie um roteiro curto e viral baseado no título e insights.',
                          items: [{ id: task.id, title: task.titulo, description: task.descricao }],
                          id_conta: 'paulistana_emporio'
                        })
                      });
                      if (res.ok) alert('Roteiro gerado e enviado para a esteira de revisão com sucesso!');
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-2 py-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-[8px] font-bold uppercase rounded border border-purple-500/20 transition-colors"
                >
                  Gerar Roteiro
                </button>
                <div className="text-[8px] font-mono text-zinc-700">
                  {new Date(task.data_criacao).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        );

        if (snapshot.isDragging) {
          return (
            <Portal>
              {cardContent}
            </Portal>
          );
        }
        return cardContent;
      }}
    </Draggable>
  );
}
