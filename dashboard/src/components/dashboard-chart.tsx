'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { useDateFilter } from '@/store/date-filter';
import { Loader2, AlertCircle } from 'lucide-react';

// Função que busca dados do BFF (que por sua vez chama as APIs da Nuvemshop e GA)
const fetchDashboardData = async (range: string) => {
  const response = await fetch(`/api/dashboard?range=${range}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar métricas');
  }
  return response.json();
};

interface DashboardData {
  categories: string[];
  activeUsers: number[];
  totalRevenue: number[];
  conversionRate: number[];
}

export default function DashboardChart({ preloadedData }: { preloadedData?: DashboardData }) {
  const { range, setRange } = useDateFilter();

  const { data: fetchedData, isLoading: isFetching, isError, refetch } = useQuery({
    queryKey: ['dashboardMetrics', range],
    queryFn: () => fetchDashboardData(range),
    enabled: !preloadedData,
    initialData: preloadedData,
  });

  const data = fetchedData;
  const isLoading = isFetching && !data;

  const chartOptions = useMemo(() => {
    if (!data) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#f4f4f5' }
      },
      legend: {
        data: ['Taxa de Conversão (%)', 'Receita Diária (R$)', 'Visitantes Ativos'],
        bottom: 0,
        textStyle: { color: '#a1a1aa' } // zinc-400
      },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          boundaryGap: true,
          data: data.categories,
          axisLine: { lineStyle: { color: '#52525b' } },
          axisLabel: { color: '#a1a1aa' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Volume',
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#27272a', type: 'dashed' } },
          axisLabel: { color: '#a1a1aa' }
        },
        {
          type: 'value',
          name: 'Taxa (%)',
          position: 'right',
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#a1a1aa' }
        }
      ],
      series: [
        {
          name: 'Visitantes Ativos',
          type: 'bar',
          data: data.activeUsers,
          itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }, // indigo-600
          emphasis: { focus: 'series' }
        },
        {
          name: 'Receita Diária (R$)',
          type: 'line',
          smooth: true,
          data: data.totalRevenue,
          lineStyle: { color: '#0ea5e9', width: 3 }, // sky-500
          itemStyle: { color: '#0ea5e9' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(14, 165, 233, 0.5)' },
                { offset: 1, color: 'rgba(14, 165, 233, 0)' }
              ]
            }
          }
        },
        {
          name: 'Taxa de Conversão (%)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.conversionRate,
          lineStyle: { color: '#10b981', width: 3 }, // emerald-500
          itemStyle: { color: '#10b981' }
        }
      ]
    };
  }, [data]);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Performance Integrada</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Métricas consolidadas Nuvemshop e Google Analytics</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              range === '7d' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            7 Dias
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              range === '30d' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            30 Dias
          </button>
          <button
            onClick={() => setRange('90d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              range === '90d' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            90 Dias
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm rounded-lg">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Carregando métricas...</p>
          </div>
        )}
        
        {isError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm rounded-lg border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-8 h-8 text-red-600 mb-4" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-4">Falha ao carregar os dados</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {!isError && data && (
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }} // Exigência para alta performance
            notMerge={true}
            lazyUpdate={true}
          />
        )}
      </div>
    </div>
  );
}
