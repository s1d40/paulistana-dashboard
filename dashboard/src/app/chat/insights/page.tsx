export const dynamic = 'force-dynamic';
import ChatPanel from '@/components/chat-panel';
import { LineChart } from 'lucide-react';

export default function InsightsChatPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Analista de Dados IA
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Converse com seus dados. Tire dúvidas sobre as métricas de vendas e comportamento dos usuários.
          </p>
        </div>
        
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <ChatPanel 
            title="Consultor de Dados"
            description="Pergunte sobre picos de acesso ou dicas de conversão."
            apiEndpoint="/api/chat/insights"
            icon={<LineChart className="w-5 h-5 text-blue-500" />}
          />
        </div>
      </div>
    </div>
  );
}
