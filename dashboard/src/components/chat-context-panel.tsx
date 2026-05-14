'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Image as ImageIcon, Music, Video, CheckCircle2, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';

const fetchLatestPost = async () => {
  const res = await fetch('/api/content?limit=1');
  if (!res.ok) throw new Error('Falha ao carregar contexto');
  const data = await res.json();
  return data[0];
};

export default function ChatContextPanel() {
  const [isApproving, setIsApproving] = useState(false);
  const { data: post, isLoading, refetch } = useQuery({
    queryKey: ['latestPostContext'],
    queryFn: fetchLatestPost,
    refetchInterval: 5000, // Poll every 5 seconds for "real-time" feel
  });

  const handleApprove = async () => {
    if (!post?.id_post) return;
    
    setIsApproving(true);
    try {
      const res = await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id_post }),
      });

      if (!res.ok) throw new Error('Falha na requisição');
      
      alert('Solicitação de aprovação enviada ao n8n!');
      refetch();
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar solicitação de aprovação.');
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse text-zinc-400">Carregando contexto...</div>;
  if (!post) return <div className="p-8 text-center text-zinc-400">Nenhum post ativo para orquestração.</div>;

  const status = post.status || 'Pendente_Geracao';
  const isPosted = status.toLowerCase() === 'postado' || status === 'Publicado';
  const isGenerating = status === 'Gerando' || status === 'Processando';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Post em Foco</h3>
        <button onClick={() => refetch()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors">
          <RefreshCcw className={clsx("w-3 h-3", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Post Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={clsx(
              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
              isPosted ? "bg-emerald-100 text-emerald-700" : 
              isGenerating ? "bg-indigo-100 text-indigo-700 animate-pulse" : 
              "bg-amber-100 text-amber-700"
            )}>
              {status.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">#{post.id_post?.substring(0,8)}</span>
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-white leading-tight">{post.titulo_post || post.tema_post}</h4>
        </div>

        {/* Assets Status Table */}
        <div className="space-y-4">
          <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Status dos Assets</h5>
          
          <div className="space-y-3">
            <AssetItem 
              icon={<FileText className="w-4 h-4" />} 
              label="Roteiro & Legenda" 
              status={post.roteiro_gerado ? 'Pronto' : 'Pendente'} 
            />
            <AssetItem 
              icon={<ImageIcon className="w-4 h-4" />} 
              label="Imagens / Carrossel" 
              status={post.Imagens === 'OK' ? 'Pronto' : 'Pendente'} 
            />
            <AssetItem 
              icon={<Music className="w-4 h-4" />} 
              label="Narração (Áudio)" 
              status={post.Audios === 'OK' ? 'Pronto' : 'Pendente'} 
            />
            <AssetItem 
              icon={<Video className="w-4 h-4" />} 
              label="Vídeo Final (Render)" 
              status={post.Video === 'OK' ? 'Pronto' : 'Pendente'} 
            />
          </div>
        </div>

        {/* Actions Area */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isApproving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Aprovar para Postagem
          </button>
        </div>

        {/* Quick View Area */}
        {post.Video === 'OK' && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
             <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Preview do Vídeo</h5>
             <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <video 
                  src={`https://storage.googleapis.com/cocreator_content/posts/${post.id_post}/video_final.mp4`} 
                  controls 
                  className="w-full h-full object-contain"
                />
             </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[9px] text-zinc-400 italic leading-relaxed text-center">
          Dica: Peça ao agente para &quot;Gerar o vídeo para este post&quot; assim que os áudios e imagens estiverem prontos.
        </p>
      </div>
    </div>
  );
}

function AssetItem({ icon, label, status }: { icon: React.ReactNode, label: string, status: 'Pronto' | 'Pendente' | 'Erro' }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={clsx(
          "p-1.5 rounded-lg transition-colors",
          status === 'Pronto' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
        )}>
          {icon}
        </div>
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      {status === 'Pronto' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      )}
    </div>
  );
}
