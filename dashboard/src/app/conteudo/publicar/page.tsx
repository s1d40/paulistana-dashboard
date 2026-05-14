'use client';

import { useState, useEffect } from 'react';
import { Account, fetchAccounts } from '@/services/supabase-service';
import { ArrowLeft, Loader2, Globe, Camera, Video, Share2, ExternalLink, Settings, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PublicarPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs text-center">
          Carregando Hub de Publicação...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all border border-zinc-800">
              <ArrowLeft className="w-6 h-6 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Social Media <span className="text-indigo-500">Hub</span></h1>
              <p className="text-zinc-500 text-sm font-medium">Gerencie suas contas e publique em massa.</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configurar Nova Conta
          </button>
        </header>

        {/* Accounts Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            // Determine platform type based on available fields
            const type = account.conta_id_instagram ? 'Instagram' : 
                         account.conta_id_facebook ? 'Facebook' :
                         account.yt_credencial ? 'Youtube' : 'Generic';

            return (
              <div key={account.id_conta} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-[1.5rem] flex items-center justify-center border border-zinc-700 shadow-xl group-hover:scale-110 transition-transform duration-500">
                     {type === 'Instagram' ? <Camera className="w-8 h-8 text-pink-500" /> : 
                      type === 'Facebook' ? <Globe className="w-8 h-8 text-blue-500" /> :
                      type === 'Youtube' ? <Video className="w-8 h-8 text-red-500" /> :
                      <Globe className="w-8 h-8 text-indigo-500" />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white tracking-tight">{account.nome_conta}</h3>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{account.nicho || 'Geral'}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600">{type} Account</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                      <span>Status</span>
                      <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Conectado</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                      <span>Métricas</span>
                      <span className="text-zinc-300">Google Analytics 4</span>
                   </div>
                </div>

                <div className="pt-4 flex gap-2">
                   <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700">Ver Perfil</button>
                   <button className="flex-1 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-indigo-500/20">Configurações</button>
                </div>
              </div>
            );
          })}

          {/* Add New Placeholder */}
          <button className="border-2 border-dashed border-zinc-800 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:border-indigo-500/40 hover:text-indigo-400 transition-all bg-zinc-900/10">
             <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800"><Share2 className="w-8 h-8" /></div>
             <span className="text-xs font-black uppercase tracking-widest">Adicionar Canal</span>
          </button>
        </section>

        {/* Ready to Publish Section (Placeholder for future) */}
        <section className="bg-indigo-600/5 border border-indigo-500/10 rounded-[3rem] p-12 space-y-8">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Conteúdos Prontos</h2>
                 <p className="text-zinc-500 text-sm font-medium">Posts que já foram renderizados e aguardam sua aprovação final.</p>
              </div>
              <button onClick={() => router.push('/conteudo')} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-widest transition-all">
                Ir para o Estúdio <ExternalLink className="w-4 h-4" />
              </button>
           </div>
           
           <div className="h-40 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              Nenhum post pronto para publicação imediata.
           </div>
        </section>
      </div>
    </div>
  );
}
