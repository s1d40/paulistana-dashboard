"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Eye, 
  Users, 
  PlaySquare,
  AlertCircle,
  RefreshCw,
  Heart,
  MessageCircle,
  ThumbsUp,
  Share2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import AccountSelector from '@/components/account-selector';
import { Account, Client } from '@/services/supabase-service';
import clsx from 'clsx';
import { InstagramIcon, YoutubeIcon, FacebookIcon } from '@/components/brand-icons';

export default function EngagementPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [ytLoading, setYtLoading] = useState(false);
  const [ytData, setYtData] = useState<any>(null);
  const [ytError, setYtError] = useState('');

  const [igLoading, setIgLoading] = useState(false);
  const [igData, setIgData] = useState<any>(null);
  const [igError, setIgError] = useState('');

  const [fbLoading, setFbLoading] = useState(false);
  const [fbData, setFbData] = useState<any>(null);
  const [fbError, setFbError] = useState('');

  const handleAccountSelect = (account: Account) => {
    setSelectedAccountId(account.id_conta);
  };

  useEffect(() => {
    if (!selectedAccountId) return;

    setIgLoading(true);
    setYtLoading(true);
    setFbLoading(true);

    // Fetch Facebook Page Insights
    fetch(`/api/social/facebook?accountId=${selectedAccountId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setFbError(data.error);
        else { setFbData(data); setFbError(''); }
      })
      .catch(err => setFbError('Erro ao conectar com API do Facebook'))
      .finally(() => setFbLoading(false));

    // Fetch YouTube
    fetch(`/api/social/youtube?accountId=${selectedAccountId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setYtError(data.error);
        else { setYtData(data); setYtError(''); }
      })
      .catch(err => setYtError('Erro ao conectar com API do YouTube'))
      .finally(() => setYtLoading(false));

    // Fetch Instagram
    fetch(`/api/social/instagram?accountId=${selectedAccountId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setIgError(data.error);
        else { setIgData(data); setIgError(''); }
      })
      .catch(err => setIgError('Erro ao conectar com API do Instagram'))
      .finally(() => setIgLoading(false));
  }, [selectedAccountId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Account Selector */}
      <div className="relative z-50 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-zinc-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PlaySquare className="w-6 h-6 text-white" />
            </div>
            Performance
          </h1>
          <p className="text-zinc-400 mt-3 font-medium text-lg max-w-xl">
            Painel consolidado de Business Intelligence. Monitore visualizações e engajamento das contas selecionadas.
          </p>
        </div>
        <div className="w-full md:w-80 shrink-0 relative z-50">
          <AccountSelector onSelect={handleAccountSelect} placement="bottom" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* INSTAGRAM SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-xl">
                <InstagramIcon className="w-5 h-5 text-white" />
              </div>
              Instagram Insights
            </h2>
          </div>

          {igLoading ? (
            <div className="h-[400px] bg-zinc-900/50 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-500 backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 animate-spin mb-6 text-pink-500" />
              <p className="font-medium text-lg">Sincronizando com a Meta...</p>
            </div>
          ) : !igData || igError ? (
            <div className="h-[400px] bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conta não vinculada</h3>
              <p className="text-zinc-400 max-w-sm">{igError || 'Nenhuma conta do Instagram vinculada a este perfil.'}</p>
            </div>
          ) : igData && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400"/> Seguidores
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{igData.profile.followers.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-purple-400"/> Publicações
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{igData.profile.mediaCount.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Últimos Posts e Reels</h3>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {igData.recentPosts.map((post: any) => (
                    <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" className="flex items-center gap-5 p-5 hover:bg-white/5 transition-colors group">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                        {post.type === 'VIDEO' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 line-clamp-2 leading-relaxed mb-3 group-hover:text-white transition-colors">{post.caption}</p>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-pink-400/80"><Heart className="w-3.5 h-3.5 fill-current" /> {post.likes}</span>
                          <span className="flex items-center gap-1.5 text-blue-400/80"><MessageCircle className="w-3.5 h-3.5" /> {post.comments}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FACEBOOK SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <FacebookIcon className="w-5 h-5 text-blue-500" />
              </div>
              Facebook Page Insights
            </h2>
          </div>

          {fbLoading ? (
            <div className="h-[400px] bg-zinc-900/50 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-500 backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 animate-spin mb-6 text-blue-500" />
              <p className="font-medium text-lg">Carregando insights da Page...</p>
            </div>
          ) : !fbData || fbError ? (
            <div className="h-[400px] bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <FacebookIcon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Facebook Page não vinculada</h3>
              <p className="text-zinc-400 max-w-sm">{fbError || 'Conecte uma Facebook Page via Facebook Login para ver insights.'}</p>
            </div>
          ) : fbData && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              {/* Page Info Header */}
              <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex items-center gap-5">
                {fbData.page.picture && (
                  <img src={fbData.page.picture} alt={fbData.page.name} className="w-16 h-16 rounded-2xl shadow-lg" />
                )}
                <div>
                  <h3 className="text-xl font-black text-white">{fbData.page.name}</h3>
                  <p className="text-sm text-blue-400 font-medium">{fbData.page.category}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400"/> Seguidores
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{fbData.page.followers.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400"/> Impressões (28d)
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{fbData.insights.impressions.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400"/> Engajamento (28d)
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{fbData.insights.postEngagements.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400"/> Usuários Engajados (28d)
                  </div>
                  <div className="text-4xl font-black text-white tracking-tight">{fbData.insights.engagedUsers.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Publicações Recentes da Página</h3>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {fbData.recentPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center gap-5 p-5 hover:bg-white/5 transition-colors group">
                      {post.picture && (
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                          <img src={post.picture} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 line-clamp-2 leading-relaxed mb-3 group-hover:text-white transition-colors">{post.message}</p>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-blue-400/80"><ThumbsUp className="w-3.5 h-3.5" /> {post.reactions}</span>
                          <span className="flex items-center gap-1.5 text-green-400/80"><MessageCircle className="w-3.5 h-3.5" /> {post.comments}</span>
                          <span className="flex items-center gap-1.5 text-purple-400/80"><Share2 className="w-3.5 h-3.5" /> {post.shares}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* YOUTUBE SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <YoutubeIcon className="w-5 h-5 text-red-500" />
              </div>
              YouTube Analytics
            </h2>
          </div>

          {ytLoading ? (
            <div className="h-[400px] bg-zinc-900/50 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-zinc-500 backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 animate-spin mb-6 text-red-500" />
              <p className="font-medium text-lg">Conectando ao YouTube API...</p>
            </div>
          ) : !ytData || ytError ? (
            <div className="h-[400px] bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <PlayCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Canal não vinculado</h3>
              <p className="text-zinc-400 max-w-sm">Nenhum canal do YouTube foi configurado para esta conta no momento.</p>
            </div>
          ) : ytData && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Users className="w-3 h-3 text-red-400"/> Inscritos</div>
                  <div className="text-3xl font-black text-white tracking-tight">{ytData.channel.subscribers.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Eye className="w-3 h-3 text-red-400"/> Views</div>
                  <div className="text-3xl font-black text-white tracking-tight">{ytData.channel.totalViews.toLocaleString('pt-BR')}</div>
                </div>
                <div className="bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><PlaySquare className="w-3 h-3 text-red-400"/> Vídeos</div>
                  <div className="text-3xl font-black text-white tracking-tight">{ytData.channel.videoCount.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Últimos Vídeos</h3>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {ytData.recentVideos.map((video: any) => (
                    <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="flex gap-5 p-5 hover:bg-white/5 transition-colors group">
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm font-bold text-zinc-200 line-clamp-2 leading-snug mb-2 group-hover:text-white transition-colors">{video.title}</p>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.views.toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {video.likes.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </a>
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
