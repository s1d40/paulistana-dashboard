export const dynamic = 'force-dynamic';
import ChatPanel from '@/components/chat-panel';
import ChatContextPanel from '@/components/chat-context-panel';
import { PenTool } from 'lucide-react';

export default function ConteudoChatPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 h-full flex flex-col overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Orquestrador de Conteúdo
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
            Agente especializado na criação de vídeos virais e automação multimídia via n8n.
          </p>
        </div>
        
        <div className="flex-1 min-h-0 flex gap-6">
          {/* Main Chat Area */}
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
            <ChatPanel 
              title="Agente de Conteúdo (n8n)"
              description="Conectado ao seu fluxo principal de inteligência artificial."
              apiEndpoint="/api/chat/conteudo"
              icon={<PenTool className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          {/* Context Sidebar */}
          <div className="hidden lg:block w-80 shrink-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            <ChatContextPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
