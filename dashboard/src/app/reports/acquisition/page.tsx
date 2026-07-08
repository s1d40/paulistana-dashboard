"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MousePointerClick, 
  Clock, 
  Activity, 
  Globe,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AcquisitionPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(err => setError('Erro ao conectar com Google Analytics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-500" />
          Aquisição de Tráfego (GA4)
        </h1>
        <p className="text-zinc-400 mt-2 font-medium">
          Métricas de acesso do E-commerce nos últimos 30 dias.
        </p>
      </div>

      {loading ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-24 flex flex-col items-center justify-center text-zinc-500">
          <RefreshCw className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p>Consultando dados do Google Analytics 4...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-12 flex flex-col items-center justify-center text-center text-red-400">
          <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-red-500 mb-2">Erro na Conexão</h3>
          <p className="text-sm opacity-80 max-w-sm">{error}</p>
        </div>
      ) : data && (
        <div className="space-y-8">
          
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-zinc-400 font-medium">Usuários Ativos</h3>
              </div>
              <div className="text-3xl font-black text-white">{parseInt(data.kpis.activeUsers).toLocaleString('pt-BR')}</div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <MousePointerClick className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-zinc-400 font-medium">Visualizações de Tela</h3>
              </div>
              <div className="text-3xl font-black text-white">{parseInt(data.kpis.pageViews).toLocaleString('pt-BR')}</div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-zinc-400 font-medium">Taxa de Rejeição</h3>
              </div>
              <div className="text-3xl font-black text-white">{(Number(data.kpis.bounceRate) * 100).toFixed(1)}%</div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-zinc-400 font-medium">Duração Média</h3>
              </div>
              <div className="text-3xl font-black text-white">{data.kpis.avgSessionSecs}s</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Top Origens */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                <h3 className="font-bold text-white">Origem do Tráfego (Source / Medium)</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 px-2">Origem</th>
                      <th className="pb-3 px-2 text-right">Sessões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {data.sources.map((src: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-800/20">
                        <td className="py-3 px-2 text-zinc-300 font-medium">{src.source}</td>
                        <td className="py-3 px-2 text-right text-emerald-400 font-bold">{src.sessions.toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Páginas Mais Visitadas */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                <h3 className="font-bold text-white">Páginas Mais Acessadas</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 px-2">Página / Título</th>
                      <th className="pb-3 px-2 text-right">Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {data.topPages.map((page: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-800/20">
                        <td className="py-3 px-2">
                          <div className="text-sm font-medium text-zinc-200 line-clamp-1">{page.title}</div>
                          <div className="text-xs text-zinc-500">{page.path}</div>
                        </td>
                        <td className="py-3 px-2 text-right text-blue-400 font-bold">{page.views.toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
