'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Account, fetchAccounts } from '@/services/supabase-service';
import { Loader2, Camera, Globe, Video, Settings2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContasConfigPage() {
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
        </header>

        {/* Accounts Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const type = account.conta_id_instagram ? 'Instagram' : 
                         account.conta_id_facebook ? 'Facebook' :
                         account.yt_credencial ? 'Youtube' : 'Generic';
                         
            const isConnectedMeta = !!account.ig_access_token || !!account.facebook_access_token;
            
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
                  <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                     {type === 'Instagram' ? <Camera className="w-8 h-8 text-pink-500" /> : 
                      type === 'Facebook' ? <Globe className="w-8 h-8 text-blue-500" /> :
                      type === 'Youtube' ? <Video className="w-8 h-8 text-red-500" /> :
                      <Globe className="w-8 h-8 text-indigo-500" />}
                  </div>
                  
                  <h3 className="font-black text-xl text-white tracking-tight leading-tight">{account.nome_conta}</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mt-2">{account.nicho || 'Geral'}</p>
                  
                  <div className="mt-8 space-y-3">
                     <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 font-medium">Integração Principal</span>
                        <span className="text-zinc-300 font-bold">Meta Graph API</span>
                     </div>
                     <div className="flex items-center justify-between text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                        <span className="text-zinc-500 font-medium">Permissões</span>
                        <span className="text-zinc-300 font-bold">Leitura / Escrita</span>
                     </div>
                  </div>
                </div>

                <div className="pt-8">
                   {isConnectedMeta ? (
                     <div className="flex flex-col gap-2">
                       <a href={`/api/auth/facebook?conta_id=${account.id_conta}`} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center border border-zinc-700">
                          Atualizar Token (Reconectar)
                       </a>
                     </div>
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

      </div>
    </div>
  );
}
