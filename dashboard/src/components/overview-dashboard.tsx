'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDateFilter } from '@/store/date-filter';
import DashboardChart from './dashboard-chart';
import { TrendingUp, Users, ShoppingBag, DollarSign, Loader2, Globe, Smartphone, MousePointer2, LayoutGrid, Store, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

interface AcquisitionItem {
  source: string;
  sessions: number;
}

interface DeviceItem {
  device: string;
  activeUsers: number;
}

interface PageMetric {
  path: string;
  title: string;
  views: number;
  users: number;
}

interface WordPressPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  link: string;
  status: string;
  yoast_head_json?: {
    og_image?: Array<{ url: string }>;
    description?: string;
  };
}

interface DashboardData {
  categories: string[];
  totalRevenue: number[];
  orderCount: number[];
  activeUsers: number[];
  pageViews: number[];
  conversionRate: number[];
  acquisition: AcquisitionItem[];
  devices: DeviceItem[];
  topPages: PageMetric[];
  wpPosts: WordPressPost[];
}

export default function OverviewDashboard() {
  const { range } = useDateFilter();
  const [domain, setDomain] = useState('all');

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardData', range, domain],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?range=${range}&domain=${domain}`);
      if (!res.ok) throw new Error('Falha ao carregar dados do dashboard');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500">Carregando métricas agregadas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p>Erro ao carregar dados.</p>
        <p className="text-sm text-zinc-500 mt-2">{(error as Error)?.message}</p>
      </div>
    );
  }

  // Calculate KPIs
  const totalRevenue = data.totalRevenue?.reduce((a: number, b: number) => a + b, 0) || 0;
  const totalOrders = data.orderCount?.reduce((a: number, b: number) => a + b, 0) || 0;
  const totalVisitors = data.activeUsers?.reduce((a: number, b: number) => a + b, 0) || 0;
  const conversionRate = totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(2) : '0.00';

  const kpis = [
    { id: 'revenue', title: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'orders', title: 'Total de Pedidos', value: totalOrders.toLocaleString('pt-BR'), icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'visitors', title: 'Visitantes Únicos', value: totalVisitors.toLocaleString('pt-BR'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'conversion', title: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  // Filter KPIs based on domain
  const visibleKpis = domain === 'blog' 
    ? kpis.filter(kpi => kpi.id === 'visitors') 
    : kpis;

  const tabs = [
    { id: 'all', label: 'Visão Geral', icon: LayoutGrid },
    { id: 'store', label: 'Loja', icon: Store },
    { id: 'blog', label: 'Blog', icon: BookOpen },
  ];

  const topPagesLabel = domain === 'blog' ? 'Artigos Mais Lidos' : domain === 'store' ? 'Produtos Mais Vistos' : 'Páginas Mais Visitadas';
  const TopPagesIcon = domain === 'blog' ? BookOpen : domain === 'store' ? ShoppingBag : MousePointer2;

  return (
    <div className="space-y-8">
      {/* Domain Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDomain(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              domain === tab.id
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${domain === tab.id ? 'text-indigo-500' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${domain === 'blog' ? 'lg:grid-cols-1 max-w-sm' : 'lg:grid-cols-4'} gap-6`}>
        {visibleKpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <DashboardChart preloadedData={data} />
      </div>

      {/* Deep Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Origem de Tráfego</h3>
          </div>
          <div className="space-y-4">
            {data.acquisition?.map((item: AcquisitionItem, i: number) => {
              const maxSessions = Math.max(...data.acquisition.map((a: AcquisitionItem) => a.sessions));
              const percentage = (item.sessions / maxSessions) * 100;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">{item.source}</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">{item.sessions.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Dispositivos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.devices?.map((item: DeviceItem, i: number) => {
              const totalUsers = data.devices.reduce((acc: number, curr: DeviceItem) => acc + curr.activeUsers, 0);
              const percentage = ((item.activeUsers / totalUsers) * 100).toFixed(1);
              return (
                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  {item.device === 'mobile' ? <Smartphone className="w-8 h-8 text-zinc-400 mb-2" /> : <MousePointer2 className="w-8 h-8 text-zinc-400 mb-2" />}
                  <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">{item.device}</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{percentage}%</span>
                  <span className="text-[10px] text-zinc-400">{item.activeUsers.toLocaleString()} usuários</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed text-center">
              Dica: O tráfego <b>{data.devices?.sort((a: DeviceItem, b: DeviceItem) => b.activeUsers - a.activeUsers)[0]?.device}</b> é sua maior fonte de acessos. Garanta que a experiência de checkout esteja otimizada para este dispositivo.
            </p>
          </div>
        </div>
      </div>

      {/* Top Pages Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TopPagesIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{topPagesLabel}</h3>
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Top 10 Performance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider font-bold">
                <th className="pb-3 pl-2">Página / Título</th>
                <th className="pb-3 text-right">Visualizações</th>
                <th className="pb-3 text-right pr-2">Visitantes Únicos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {data.topPages?.map((page, i) => (
                <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-4 pl-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {page.title}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono truncate max-w-[300px] md:max-w-md">
                        {page.path}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                      {page.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {page.users.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WordPress Posts Section (Only for Blog or All) */}
      {(domain === 'blog' || domain === 'all') && data.wpPosts && data.wpPosts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Artigos do WordPress</h3>
            </div>
            <a 
              href="https://blog.paulistanaemporio.com/wp-admin/edit.php" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1"
            >
              Gerenciar no WP <MousePointer2 className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.wpPosts.map((post) => (
              <div key={post.id} className="flex gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 hover:shadow-md transition-all group">
                {post.yoast_head_json?.og_image?.[0]?.url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 relative">
                    <Image 
                      src={post.yoast_head_json.og_image[0].url} 
                      alt={post.title.rendered}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {post.title.rendered}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tighter">
                      {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={clsx(
                      "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                      post.status === 'publish' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {post.status === 'publish' ? 'Publicado' : 'Rascunho'}
                    </span>
                    <a 
                      href={`https://blog.paulistanaemporio.com/wp-admin/post.php?post=${post.id}&action=edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-zinc-500 hover:text-indigo-600 underline underline-offset-2"
                    >
                      Editar Post
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
