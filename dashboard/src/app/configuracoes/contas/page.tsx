'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Account, fetchAccounts } from '@/services/supabase-service';
import { Loader2, Camera, Globe, Video, Settings2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContasConfigPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  const handleRemoveAll = async () => {
    if (accounts.length === 0) return;
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Tem certeza que deseja excluir TODAS as ${accounts.length} contas?\n\nIsso também removerá todos os posts vinculados. Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    
    setRemovingAll(true);
    try {
      const res = await fetch('/api/accounts/bulk-delete', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAccounts([]);
        alert(`✅ ${data.deleted} contas excluídas com sucesso!`);
      } else {
        alert('Erro: ' + (data.error || 'Falha ao excluir contas'));
      }
    } catch (err) {
      alert('Erro de conexão ao excluir contas.');
    } finally {
      setRemovingAll(false);
    }
  };

  const handleRemove = async (account: Account) => {
    const confirmed = window.confirm(`Tem certeza que deseja desconectar a conta "${account.nome_conta}"? Isso removerá os tokens de acesso.`);
    if (!confirmed) return;
    
    setRemovingId(account.id_conta);
    try {
      const res = await fetch(`/api/accounts/${account.id_conta}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(prev => prev.filter(a => a.id_conta !== account.id_conta));
      } else {
        alert('Erro ao remover conta. Tente novamente.');
      }
    } catch (err) {
      alert('Erro ao remover conta.');
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAccounts();
        setAccounts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4 bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs text-center">
          Carregando Contas...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Settings2 className="w-48 h-48 text-indigo-500" />
          </div>
          
          <div className="relative z-10 flex items-center gap-6">
            <button onClick={() => router.back()} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-700/50">
              <ArrowLeft className="w-6 h-6 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-indigo-500" /> Configuração de Contas
              </h1>
              <p className="text-zinc-400 text-sm font-medium mt-2 max-w-xl">
                Gerencie as integrações OAuth e o status de conexão de todas as suas contas. As contas conectadas permitem a automação de postagens, leitura de métricas e moderação de comentários de forma segura e oficial.
              </p>
            </div>
          </div>

          {/* Botão Excluir Todas */}
          {accounts.length > 0 && (
            <button
              onClick={handleRemoveAll}
              disabled={removingAll}
              className="relative z-10 flex items-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-2xl transition-all font-bold text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {removingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {removingAll ? 'Excluindo...' : `Excluir Todas (${accounts.length})`}
            </button>
          )}
        </header>

        {/* Accounts Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const type = account.conta_id_instagram ? 'Instagram' : 
                         account.conta_id_facebook ? 'Facebook' :
                         account.yt_credencial ? 'Youtube' : 'Generic';
                         
            const isConnectedMeta = !!account.ig_access_token || !!account.facebook_access_token;
            
            // Parse YouTube credentials
            let ytInfo: { channel_name?: string; channel_id?: string; channel_thumbnail?: string } | null = null;
            try {
              if (account.yt_credencial) {
                ytInfo = typeof account.yt_credencial === 'string' ? JSON.parse(account.yt_credencial) : account.yt_credencial;
              }
            } catch { /* ignore parse errors */ }
            
            return (
              <div key={account.id_conta} className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 hover:border-indigo-500/50 hover:shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[340px]">
                
                {/* Indicador de Status Topo */}
                <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                   {isConnectedMeta ? (
                     <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Ativo
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                       <AlertCircle className="w-3 h-3" /> Inativo
                     </span>
                   )}
                </div>

                <div className="mt-4">
                  {/* Profile Picture or Icon */}
                  {account.ig_profile_picture_url ? (
                    <img 
                      src={account.ig_profile_picture_url} 
                      alt={account.nome_conta}
                      className="w-16 h-16 rounded-2xl object-cover border border-zinc-700 shadow-xl mb-6 group-hover:-translate-y-2 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                       {type === 'Instagram' ? <Camera className="w-8 h-8 text-pink-500" /> : 
                        type === 'Facebook' ? <Globe className="w-8 h-8 text-blue-500" /> :
                        type === 'Youtube' ? <Video className="w-8 h-8 text-red-500" /> :
                        <Globe className="w-8 h-8 text-indigo-500" />}
                    </div>
                  )}
                  
                  <h3 className="font-black text-xl text-white tracking-tight leading-tight">{account.nome_conta}</h3>
                  {account.ig_username && (
                    <p className="text-sm text-pink-400 font-semibold mt-1">@{account.ig_username}</p>
                  )}
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mt-2">{account.nicho || 'Geral'}</p>
                  
                  <div className="mt-6 space-y-3">
                     <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 font-medium">Integração Principal</span>
                        <span className="text-zinc-300 font-bold">{type === 'Instagram' ? 'Instagram API' : 'Meta Graph API'}</span>
                     </div>
                     {account.ig_username && (
                       <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                          <span className="text-zinc-500 font-medium">Username</span>
                          <span className="text-zinc-300 font-bold">@{account.ig_username}</span>
                       </div>
                     )}
                     <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 font-medium">Permissões</span>
                        <span className="text-zinc-300 font-bold">Leitura / Escrita</span>
                     </div>
                     {/* YouTube Connection Status */}
                     <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-red-500" /> YouTube
                        </span>
                        {ytInfo?.channel_name ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {ytInfo.channel_name}
                          </span>
                        ) : (
                          <a href={`/api/auth/google?conta_id=${account.id_conta}`} className="text-red-400 hover:text-red-300 font-bold transition-colors">
                            Conectar →
                          </a>
                        )}
                     </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2">
                   {isConnectedMeta ? (
                     <>
                       <a href={`/api/auth/facebook?conta_id=${account.id_conta}`} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center border border-zinc-700">
                          Atualizar Token (Reconectar)
                       </a>
                       {!ytInfo?.channel_name && (
                         <a href={`/api/auth/google?conta_id=${account.id_conta}`} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/40">
                           <Video className="w-3 h-3" />
                           Conectar YouTube
                         </a>
                       )}
                       <button 
                         onClick={() => handleRemove(account)}
                         disabled={removingId === account.id_conta}
                         className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-400/60 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20 disabled:opacity-50"
                       >
                         <Trash2 className="w-3 h-3" />
                         {removingId === account.id_conta ? 'Removendo...' : 'Desconectar'}
                       </button>
                     </>
                   ) : (
                     <a href={`/api/auth/facebook?conta_id=${account.id_conta}`} className="w-full py-4 bg-[#1877F2] hover:bg-[#1864D9] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center group-hover:scale-[1.02]">
                        <Globe className="w-4 h-4 mr-2" /> Conectar Facebook
                     </a>
                   )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Estado Vazio: quando não há contas vinculadas */}
        {accounts.length === 0 && (
          <section className="flex flex-col items-center justify-center py-20 space-y-8">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800 shadow-2xl">
              <Camera className="w-12 h-12 text-pink-500/50" />
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">Nenhuma conta conectada</h2>
              <p className="text-zinc-500 text-sm max-w-md">
                Conecte sua conta do Facebook ou Instagram para vincular automaticamente suas páginas e contas ao painel.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/api/auth/facebook" 
                className="px-8 py-4 bg-[#1877F2] hover:bg-[#1864D9] text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3 hover:scale-105 active:scale-95"
              >
                <Globe className="w-5 h-5" />
                Conectar com Facebook
              </a>
              <a 
                href="/api/auth/instagram" 
                className="px-8 py-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-pink-500/20 flex items-center gap-3 hover:scale-105 active:scale-95"
              >
                <Camera className="w-5 h-5" />
                Conectar com Instagram
              </a>
              <a 
                href="/api/auth/google" 
                className="px-8 py-4 bg-[#FF0000] hover:bg-[#CC0000] text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-3 hover:scale-105 active:scale-95"
              >
                <Video className="w-5 h-5" />
                Conectar com YouTube
              </a>
            </div>
          </section>
        )}

        {/* Botão de adicionar nova conta (quando já tem contas) */}
        {accounts.length > 0 && (
          <section className="flex flex-wrap gap-4 justify-center pt-4">
            <a 
              href="/api/auth/facebook" 
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-800 flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              + Adicionar via Facebook
            </a>
            <a 
              href="/api/auth/instagram" 
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-800 flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-pink-400" />
              + Adicionar via Instagram
            </a>
          </section>
        )}

      </div>
    </div>
  );
}
