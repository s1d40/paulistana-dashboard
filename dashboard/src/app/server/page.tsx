'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, Server, Cpu, HardDrive, RefreshCw, AlertTriangle, 
  CheckCircle2, TerminalSquare, Settings2, PlayCircle, Clock,
  Power, RotateCcw, XCircle, Zap, ScrollText, Wifi, WifiOff,
  MemoryStick, MonitorDot
} from 'lucide-react';
import clsx from 'clsx';

interface PM2Process {
  name: string;
  id: number;
  status: string;
  memory: number;
  cpu: number;
  uptime: number;
  restarts: number;
  pid: number;
  server: string;
}

interface ServerInfo {
  name: string;
  host: string;
  label: string;
  specs: { vcpu: number; ram: string; disk: string; plan: string };
  isLocal: boolean;
  processes: PM2Process[];
  online: number;
  total: number;
  totalMemory: number;
  totalCpu: number;
  reachable: boolean;
}

interface QueueItem {
  id_post: string;
  titulo_post: string;
  status: string;
  data_criacao: string;
}

const SERVER_COLORS: Record<string, { accent: string; border: string; bg: string; gradient: string }> = {
  'cocreator-helsinki': { accent: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10', gradient: 'from-indigo-600/20 via-indigo-500/5 to-transparent' },
  'ubuntu-32gb-hel1-1': { accent: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10', gradient: 'from-amber-600/20 via-amber-500/5 to-transparent' },
};

export default function ServerDashboard() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logsModal, setLogsModal] = useState<{ name: string; logs: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/server/pm2');
      const data = await res.json();
      if (data.servers) {
        setServers(data.servers);
      }
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id_post, titulo_post, status, data_criacao')
        .in('status', ['Produzir', 'Processando', 'Erro na Produção'])
        .order('data_criacao', { ascending: true });

      if (!error && data) setQueueItems(data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchQueue();

    const channel = supabase.channel('queue_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchQueue())
      .subscribe();

    const interval = setInterval(fetchStatus, 10000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [fetchStatus, fetchQueue]);

  const handleAction = async (action: string, processName: string, serverHost: string) => {
    const key = `${action}-${processName}`;
    if (action === 'restart' && !confirm(`Reiniciar ${processName}?`)) return;
    if (action === 'stop' && !confirm(`Parar ${processName}?`)) return;
    
    setActionLoading(key);
    try {
      const res = await fetch('/api/server/pm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, processName, serverHost })
      });
      const data = await res.json();
      
      if (action === 'logs' && data.logs) {
        setLogsModal({ name: processName, logs: data.logs });
      }
      
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleResetQueue = async () => {
    if (!confirm('Mover todos os posts com erro de volta para "Produzir"?')) return;
    try {
      await fetch('/api/server/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' })
      });
      fetchQueue();
    } catch (err) { console.error(err); }
  };

  const handleResetItem = async (id: string) => {
    try {
      await fetch('/api/server/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_item', id_post: id })
      });
      fetchQueue();
    } catch (err) { console.error(err); }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (ms: number) => {
    if (!ms) return '--';
    const totalSeconds = Math.floor((Date.now() - ms) / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const totalProcesses = servers.reduce((s, sv) => s + sv.total, 0);
  const totalOnline = servers.reduce((s, sv) => s + sv.online, 0);
  const totalMem = servers.reduce((s, sv) => s + sv.totalMemory, 0);
  const totalCpu = servers.reduce((s, sv) => s + sv.totalCpu, 0);

  return (
    <div className="flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-full text-white font-sans">
        
      {/* HEADER */}
      <header className="px-6 md:px-8 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 relative">
            <Server className="w-6 h-6 text-indigo-400" />
            <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${totalOnline === totalProcesses ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Painel de Controle</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {servers.length} servidores · {totalOnline}/{totalProcesses} processos · {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
        <button onClick={fetchStatus} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium rounded-xl border border-white/10 transition-all text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 flex-1">
        
        {/* === GLOBAL SUMMARY === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Processos</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold">{totalOnline}<span className="text-sm font-normal text-zinc-500">/{totalProcesses}</span></span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">RAM Total</span>
              <MemoryStick className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold">{formatBytes(totalMem)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 hover:border-orange-500/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">CPU Total</span>
              <Cpu className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-2xl font-bold">{totalCpu.toFixed(1)}%</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 hover:border-amber-500/30 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fila Worker</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold">{queueItems.length}<span className="text-sm font-normal text-zinc-500"> itens</span></span>
          </div>
        </div>

        {/* === SERVER SECTIONS === */}
        {servers.map(server => {
          const colors = SERVER_COLORS[server.name] || SERVER_COLORS['cocreator-helsinki'];
          return (
            <div key={server.name} className="space-y-3">
              {/* Server Header */}
              <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors.gradient} rounded-2xl border ${colors.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <MonitorDot className={`w-5 h-5 ${colors.accent}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-white text-sm">{server.label}</h2>
                      {server.reachable ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          <Wifi className="w-2.5 h-2.5" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                          <WifiOff className="w-2.5 h-2.5" /> Offline
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {server.name} · {server.specs.plan} · {server.specs.vcpu} vCPU · {server.specs.ram} RAM · {server.specs.disk}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatBytes(server.totalMemory)}</p>
                  <p className="text-[10px] text-zinc-500">{server.online}/{server.total} processos</p>
                </div>
              </div>

              {/* Process Cards */}
              <div className={`grid grid-cols-1 ${server.processes.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-3`}>
                {server.processes.map(proc => {
                  const isOnline = proc.status === 'online';
                  return (
                    <div key={`${server.name}-${proc.id}`} className={clsx(
                      "bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20",
                      !isOnline && "opacity-60"
                    )}>
                      <div className="p-4">
                        {/* Process Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                            <div>
                              <h3 className="font-bold text-white text-xs tracking-tight">{proc.name}</h3>
                              <span className="text-[9px] text-zinc-600 font-mono">PID {proc.pid}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${isOnline ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                            {proc.status}
                          </span>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="bg-black/30 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-zinc-500 uppercase font-bold">RAM</p>
                            <p className="text-[11px] font-bold text-blue-300">{formatBytes(proc.memory)}</p>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-zinc-500 uppercase font-bold">CPU</p>
                            <p className="text-[11px] font-bold text-orange-300">{proc.cpu}%</p>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-zinc-500 uppercase font-bold">Up</p>
                            <p className="text-[11px] font-bold text-emerald-300">{formatUptime(proc.uptime)}</p>
                          </div>
                          <div className="bg-black/30 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-zinc-500 uppercase font-bold">↻</p>
                            <p className={clsx("text-[11px] font-bold", proc.restarts > 100 ? 'text-red-400' : proc.restarts > 10 ? 'text-amber-300' : 'text-zinc-300')}>{proc.restarts}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAction('restart', proc.name, server.host)}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-300 text-[10px] font-bold rounded-lg border border-white/10 hover:border-amber-500/20 transition-all disabled:opacity-30"
                          >
                            <RotateCcw className={`w-2.5 h-2.5 ${actionLoading === `restart-${proc.name}` ? 'animate-spin' : ''}`} /> Restart
                          </button>
                          <button
                            onClick={() => handleAction('logs', proc.name, server.host)}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-300 text-[10px] font-bold rounded-lg border border-white/10 hover:border-indigo-500/20 transition-all disabled:opacity-30"
                          >
                            <ScrollText className="w-2.5 h-2.5" /> Logs
                          </button>
                          {isOnline ? (
                            <button
                              onClick={() => handleAction('stop', proc.name, server.host)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center px-2 py-1.5 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 text-[10px] font-bold rounded-lg border border-white/10 hover:border-red-500/20 transition-all disabled:opacity-30"
                            >
                              <XCircle className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('start', proc.name, server.host)}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center px-2 py-1.5 bg-white/5 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 text-[10px] font-bold rounded-lg border border-white/10 hover:border-emerald-500/20 transition-all disabled:opacity-30"
                            >
                              <Power className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* === RENDER QUEUE === */}
        <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Fila de Renderização</h2>
              {queueItems.length > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  {queueItems.length}
                </span>
              )}
            </div>
            <button onClick={handleResetQueue} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-lg transition-all">
              <Settings2 className="w-3 h-3" /> Reset
            </button>
          </div>
          <div>
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Carregando...</div>
            ) : queueItems.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-zinc-500">
                <CheckCircle2 className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-xs font-medium text-zinc-400">Fila vazia</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/20 text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                    <th className="px-4 py-2.5 border-b border-white/5">ID</th>
                    <th className="px-4 py-2.5 border-b border-white/5">Título</th>
                    <th className="px-4 py-2.5 border-b border-white/5">Status</th>
                    <th className="px-4 py-2.5 border-b border-white/5">Criado</th>
                    <th className="px-4 py-2.5 border-b border-white/5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {queueItems.map(item => (
                    <tr key={item.id_post} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-400">{item.id_post.substring(0, 8)}...</td>
                      <td className="px-4 py-2.5 text-[11px] font-medium text-white">{item.titulo_post || 'Sem Título'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          item.status === 'Processando' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          item.status === 'Produzir' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.status === 'Processando' && <RefreshCw className="w-2 h-2 animate-spin" />}
                          {item.status === 'Produzir' && <PlayCircle className="w-2 h-2" />}
                          {item.status === 'Erro na Produção' && <AlertTriangle className="w-2 h-2" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-zinc-500">{new Date(item.data_criacao).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => handleResetItem(item.id_post)} className="px-2 py-1 text-[9px] font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all">
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

      {/* === LOGS MODAL === */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setLogsModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[90%] max-w-3xl max-h-[70vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Logs: {logsModal.name}</h3>
              </div>
              <button onClick={() => setLogsModal(null)} className="text-zinc-400 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-all">{logsModal.logs}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
