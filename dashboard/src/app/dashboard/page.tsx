export const dynamic = 'force-dynamic';
import OverviewDashboard from '@/components/overview-dashboard';

export default function Home() {
  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Visão Geral
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Acompanhe o desempenho centralizado das suas métricas e conversões.
          </p>
        </div>

        <OverviewDashboard />
      </div>
    </main>
  );
}
