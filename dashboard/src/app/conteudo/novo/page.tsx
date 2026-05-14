'use client';

import { Video, Layout, FileText, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializePostInSupabase } from '@/services/supabase-service';
import { Loader2 } from 'lucide-react';

const tracks = [
  {
    id: 'video',
    title: 'Vídeo Viral',
    description: 'TikTok, Reels e YouTube Shorts com legendas dinâmicas.',
    icon: Video,
    color: 'bg-indigo-500',
    hover: 'hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
    type_name: 'video',
    disabled: false
    },
    {
    id: 'carrossel',
    title: 'Carrossel Satori',
    description: 'Design editorial automático focado em alta retenção visual.',
    icon: Layout,
    color: 'bg-emerald-500',
    hover: 'hover:border-emerald-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
    type_name: 'carrossel',
    disabled: true
    },
    {
    id: 'blog',
    title: 'Blog Post SEO',
    description: 'Artigos profundos YMYL otimizados para o Google Search.',
    icon: FileText,
    color: 'bg-amber-500',
    hover: 'hover:border-amber-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
    type_name: 'blog',
    disabled: true
    }
    ];

    export default function NovoConteudoPage() {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();

    const handleTrackSelection = async (track: typeof tracks[0]) => {
    if (track.disabled) return;
    setLoadingId(track.id);
    try {
      const uuid = crypto.randomUUID();

      // Inicializa o post com o UUID que servirá de Session ID
      // Usamos IDs padrão para conta/cliente por enquanto
      await initializePostInSupabase(
        { uuid, produto: `Novo ${track.title} (Briefing)` },
        track.type_name,
        'b3f9c2d1-7e84-4a56-9d2b-1f8e3c6a4b90' // Paulistana Principal
      );

      // Redireciona para o chat passando o ID do post como sessão
      router.push(`/conteudo/chat?track=${track.id}&id_post=${uuid}`);
    } catch (error) {
      console.error('Erro ao iniciar produção:', error);
      alert('Falha ao inicializar post. Tente novamente.');
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500">
            <Sparkles className="w-3 h-3" />
            Co-Creator Studio v2
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">O que vamos criar hoje?</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Selecione o formato de conteúdo para iniciar o direcionamento criativo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <button 
              key={track.id} 
              disabled={loadingId !== null || track.disabled}
              onClick={() => handleTrackSelection(track)}
              className={`group p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl transition-all duration-300 ${track.disabled ? 'opacity-40 grayscale cursor-not-allowed' : track.hover} flex flex-col items-center text-center space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 disabled:opacity-50`}
            >
              <div className={`${track.disabled ? 'bg-zinc-500' : track.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {loadingId === track.id ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <track.icon className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{track.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{track.description}</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {track.disabled ? 'Em breve' : loadingId === track.id ? 'Inicializando...' : 'Iniciar Chat'}
                {!track.disabled && <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-8">
          <Link href="/conteudo" className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            ← Voltar para a Biblioteca
          </Link>
        </div>
      </div>
    </div>
  );
}
