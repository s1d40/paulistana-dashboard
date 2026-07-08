'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Server, Cpu, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, TerminalSquare, Settings2, PlayCircle, Clock } from 'lucide-react';
import Sidebar from '@/components/sidebar';

interface PM2Status {
  status: string;
  memory: number;
  cpu: number;
  uptime: number;
  restarts: number;
}

interface QueueItem {
  id_post: string;
  titulo_post: string;
  status: string;
  data_criacao: string;
}

export default function ServerDashboard() {
  const [pm2Status, setPm2Status] = useState<PM2Status | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchQueue();

    // Subscribe to realtime changes in posts
    const channel = supabase.channel('queue_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchQueue();
      })
      .subscribe();

    const interval = setInterval(fetchStatus, 10000); // Poll PM2 status every 10s

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/server/pm2');
      const data = await res.json();
      if (data.status) {
        setPm2Status(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id_post, titulo_post, status, data_criacao')
        .in('status', ['Produzir', 'Processando', 'Erro na Produção'])
        .order('data_criacao', { ascending: true });

      if (!error && data) {
        setQueueItems(data);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Tem certeza que deseja reiniciar o Worker de Vídeos? Isso irá abortar qualquer renderização em andamento.')) return;
    setIsRestarting(true);
    try {
      await fetch('/api/server/pm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      });
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      console.error(err);
    }
    setIsRestarting(false);
  };

  const handleResetQueue = async () => {
    if (!confirm('Deseja mover todos os posts "Processando" e com "Erro" de volta para "Produzir"?')) return;
    try {
      await fetch('/api/server/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' })
      });
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetItem = async (id: string) => {
    try {
      await fetch('/api/server/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_item', id_post: id })
      });
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (ms: number) => {
    const totalSeconds = Math.floor((Date.now() - ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-full text-white font-sans">
        
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Server className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Server Control Panel</h1>
              <p className="text-sm text-zinc-400 mt-1">Gerenciamento de recursos e filas de renderização</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRestart}
              disabled={isRestarting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl border border-red-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRestarting ? 'animate-spin' : ''}`} />
              Reiniciar Worker
            </button>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 flex-1">
          
          {/* Server Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-center z-10">
                <span className="text-zinc-400 font-medium">Status</span>
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="z-10 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${pm2Status?.status === 'online' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                <span className="text-2xl font-bold capitalize">{pm2Status?.status || 'Offline'}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-center z-10">
                <span className="text-zinc-400 font-medium">Memória (RAM)</span>
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <div className="z-10">
                <span className="text-2xl font-bold">{pm2Status ? formatBytes(pm2Status.memory) : '--'}</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-center z-10">
                <span className="text-zinc-400 font-medium">Uso de CPU</span>
                <Cpu className="w-5 h-5 text-orange-400" />
              </div>
              <div className="z-10">
                <span className="text-2xl font-bold">{pm2Status?.cpu || 0}%</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-center z-10">
                <span className="text-zinc-400 font-medium">Uptime</span>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="z-10">
                <span className="text-2xl font-bold">{pm2Status ? formatUptime(pm2Status.uptime) : '--'}</span>
                <span className="text-xs text-zinc-500 ml-2">({pm2Status?.restarts || 0} restarts)</span>
              </div>
            </div>
          </div>

          {/* Render Queue Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalSquare className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-semibold text-white">Fila de Renderização (Worker Python)</h2>
              </div>
              <button 
                onClick={handleResetQueue}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all"
              >
                <Settings2 className="w-4 h-4" />
                Forçar Reset Geral
              </button>
            </div>

            <div className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500">Carregando fila...</div>
              ) : queueItems.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-lg font-medium text-zinc-400">A fila está vazia</p>
                  <p className="text-sm">Nenhum post aguardando renderização no momento.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                      <th className="px-6 py-4 border-b border-white/5">Post ID</th>
                      <th className="px-6 py-4 border-b border-white/5">Título</th>
                      <th className="px-6 py-4 border-b border-white/5">Status</th>
                      <th className="px-6 py-4 border-b border-white/5">Criado Em</th>
                      <th className="px-6 py-4 border-b border-white/5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {queueItems.map(item => (
                      <tr key={item.id_post} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                          {item.id_post.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {item.titulo_post || 'Sem Título'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Processando' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            item.status === 'Produzir' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {item.status === 'Processando' && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {item.status === 'Produzir' && <PlayCircle className="w-3 h-3" />}
                            {item.status === 'Erro na Produção' && <AlertTriangle className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {new Date(item.data_criacao).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleResetItem(item.id_post)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all"
                          >
                            Resetar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </main>
    </div>
  );
}
