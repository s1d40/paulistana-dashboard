"use client";

import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Camera, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Users, 
  PlaySquare,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function EngagementPage() {
  const [ytLoading, setYtLoading] = useState(true);
  const [ytData, setYtData] = useState<any>(null);
  const [ytError, setYtError] = useState('');

  const [igLoading, setIgLoading] = useState(true);
  const [igData, setIgData] = useState<any>(null);
  const [igError, setIgError] = useState('');

  useEffect(() => {
    // Fetch YouTube
    fetch('/api/social/youtube')
      .then(res => res.json())
      .then(data => {
        if (data.error) setYtError(data.error);
        else setYtData(data);
      })
      .catch(err => setYtError('Erro ao conectar com API do YouTube'))
      .finally(() => setYtLoading(false));

    // Fetch Instagram
    fetch('/api/social/instagram')
      .then(res => res.json())
      .then(data => {
        if (data.error) setIgError(data.error);
        else setIgData(data);
      })
      .catch(err => setIgError('Erro ao conectar com API do Instagram'))
      .finally(() => setIgLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <PlaySquare className="w-8 h-8 text-rose-500" />
          Performance de Conteúdo
        </h1>
        <p className="text-zinc-400 mt-2 font-medium">
          Monitore visualizações, engajamento e métricas dos vídeos gerados pela fábrica de conteúdo nas suas redes sociais.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* YOUTUBE SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-red-500" />
              YouTube
            </h2>
          </div>

          {ytLoading ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-red-500" />
              <p>Conectando ao YouTube Data API...</p>
            </div>
          ) : ytError ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-red-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-red-500 mb-2">Integração Pendente</h3>
              <p className="text-sm opacity-80 max-w-sm">{ytError}</p>
              <p className="text-xs mt-4 text-zinc-500">Aguardando inserção de YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID.</p>
            </div>
          ) : ytData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Inscritos</div>
                  <div className="text-2xl font-black text-white">{ytData.channel.subscribers.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Eye className="w-4 h-4"/> Visitas Totais</div>
                  <div className="text-2xl font-black text-white">{ytData.channel.totalViews.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><PlaySquare className="w-4 h-4"/> Vídeos</div>
                  <div className="text-2xl font-black text-white">{ytData.channel.videoCount.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800 bg-zinc-950/50">
                  <h3 className="font-bold text-white text-sm">Últimos Lançamentos</h3>
                </div>
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {ytData.recentVideos.map((video: any) => (
                    <div key={video.id} className="flex gap-4 p-3 bg-zinc-800/20 rounded-xl border border-zinc-700/30 hover:bg-zinc-800/40 transition-colors">
                      <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-200 line-clamp-1" title={video.title}>{video.title}</h4>
                        <p className="text-xs text-zinc-500 mb-2">{new Date(video.publishedAt).toLocaleDateString('pt-BR')}</p>
                        <div className="flex gap-3 text-xs font-medium">
                          <span className="flex items-center gap-1 text-emerald-400"><Eye className="w-3 h-3"/> {video.views.toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1 text-zinc-400"><ThumbsUp className="w-3 h-3"/> {video.likes.toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1 text-zinc-400"><MessageCircle className="w-3 h-3"/> {video.comments.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INSTAGRAM SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-fuchsia-500" />
              Instagram
            </h2>
          </div>

          {igLoading ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-fuchsia-500" />
              <p>Conectando à Meta Graph API...</p>
            </div>
          ) : igError ? (
            <div className="bg-fuchsia-950/20 border border-fuchsia-900/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-fuchsia-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-fuchsia-500 mb-2">Integração Pendente</h3>
              <p className="text-sm opacity-80 max-w-sm">{igError}</p>
              <p className="text-xs mt-4 text-zinc-500">Aguardando inserção de INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_ACCOUNT_ID.</p>
            </div>
          ) : igData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                  {igData.profile.picture ? (
                    <img src={igData.profile.picture} alt="Profile" className="w-12 h-12 rounded-full border-2 border-fuchsia-500" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-fuchsia-500 flex items-center justify-center"><Camera className="w-5 h-5 text-fuchsia-500"/></div>
                  )}
                  <div>
                    <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Seguidores</div>
                    <div className="text-2xl font-black text-white">{igData.profile.followers.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><PlaySquare className="w-4 h-4"/> Posts / Reels</div>
                  <div className="text-2xl font-black text-white">{igData.profile.mediaCount.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800 bg-zinc-950/50">
                  <h3 className="font-bold text-white text-sm">Últimos Reels e Posts</h3>
                </div>
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {igData.recentPosts.map((post: any) => (
                    <div key={post.id} className="flex gap-4 p-3 bg-zinc-800/20 rounded-xl border border-zinc-700/30 hover:bg-zinc-800/40 transition-colors">
                      <div className="relative w-16 h-20 shrink-0">
                        <img src={post.thumbnail} alt="Post" className="w-full h-full object-cover rounded-lg" />
                        {post.type === 'VIDEO' && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"><PlaySquare className="w-5 h-5 text-white" /></div>}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-2" title={post.caption}>{post.caption}</p>
                        <div className="flex gap-3 text-xs font-medium">
                          <span className="flex items-center gap-1 text-fuchsia-400"><ThumbsUp className="w-3 h-3"/> {post.likes.toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1 text-zinc-400"><MessageCircle className="w-3 h-3"/> {post.comments.toLocaleString('pt-BR')}</span>
                          <a href={post.permalink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-zinc-500 hover:text-white ml-auto"><ExternalLink className="w-3 h-3"/> Abrir</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
