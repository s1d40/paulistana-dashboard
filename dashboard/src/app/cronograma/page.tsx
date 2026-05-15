'use client';

import { useEffect, useState } from 'react';
import { fetchContentPosts, ContentPost } from '@/services/supabase-service';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  FileText
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

export default function CronogramaPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'agendado' | 'publicado'>('all');

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchContentPosts();
        // Filtra apenas posts que tem data de agendamento ou já foram publicados
        const scheduledPosts = data.filter(p => p.data_agendamento || p.status_agendamento === 'publicado');
        setPosts(scheduledPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true;
    return p.status_agendamento === filter;
  }).sort((a, b) => {
    const dateA = new Date(a.data_agendamento || 0).getTime();
    const dateB = new Date(b.data_agendamento || 0).getTime();
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-zinc-950 p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <CalendarIcon className="w-3 h-3" />
            Social Engine
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Cronograma <span className="text-indigo-500">de Publicações</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium">Gerencie a fila de postagens automatizadas e agendadas.</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 border border-zinc-800 rounded-2xl">
          <button 
            onClick={() => setFilter('all')}
            className={clsx(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              filter === 'all' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('agendado')}
            className={clsx(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              filter === 'agendado' ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Agendados
          </button>
          <button 
            onClick={() => setFilter('publicado')}
            className={clsx(
              "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              filter === 'publicado' ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Publicados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Calendário...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
          <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800">
            <Clock className="w-8 h-8 text-zinc-700" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-zinc-400">Nenhuma publicação agendada.</p>
            <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Acesse a biblioteca para programar posts.</p>
          </div>
          <Link href="/conteudo" className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all">
            Ir para Biblioteca
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {filteredPosts.map((post) => {
             const date = new Date(post.data_agendamento || 0);
             const isPast = date.getTime() < new Date().getTime();

             return (
               <div key={post.id_post} className="group flex items-center gap-6 p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] hover:bg-zinc-900 hover:border-indigo-500/30 transition-all shadow-xl">
                  {/* Date Badge */}
                  <div className={clsx(
                    "flex flex-col items-center justify-center w-24 h-24 rounded-3xl border-2 transition-all shrink-0",
                    isPast ? "bg-zinc-950 border-zinc-800 opacity-50" : "bg-indigo-600/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                  )}>
                    <span className="text-[10px] font-black uppercase text-indigo-400">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    <span className="text-3xl font-black text-white">{date.getDate()}</span>
                    <span className="text-[8px] font-black uppercase text-zinc-500">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                       <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                         {post.tipo_post || 'Vídeo'}
                       </span>
                       {post.status_agendamento === 'publicado' ? (
                         <div className="flex items-center gap-1 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                           <CheckCircle2 className="w-3 h-3" /> Publicado
                         </div>
                       ) : isPast ? (
                         <div className="flex items-center gap-1 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                           <AlertCircle className="w-3 h-3" /> Atrasado / Falhou
                         </div>
                       ) : (
                         <div className="flex items-center gap-1 text-indigo-400 text-[8px] font-black uppercase tracking-widest">
                           <Clock className="w-3 h-3" /> Agendado
                         </div>
                       )}
                    </div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                      {post.titulo_post || post.tema_post}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-1 italic">
                      {post.captions || 'Sem legenda definida.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                     <Link 
                      href={`/conteudo?id=${post.id_post}`} 
                      className="p-3 bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white rounded-2xl transition-all group/btn"
                     >
                       <FileText className="w-5 h-5" />
                     </Link>
                     <button className="flex items-center gap-2 px-6 py-3 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white rounded-2xl transition-all shadow-xl">
                       Editar <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
}
