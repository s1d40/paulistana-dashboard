'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/brand-icons';

export default function OnboardingClient({ pages, token }: { pages: any[], token: string }) {
  const router = useRouter();
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePage = (id: string) => {
    const next = new Set(selectedPages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPages(next);
  };

  const handleImport = async () => {
    if (selectedPages.size === 0) return;
    setIsLoading(true);
    setError(null);

    const pagesToImport = pages.filter(p => selectedPages.has(p.id));

    try {
      const res = await fetch('/api/accounts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: pagesToImport, longToken: token })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao importar contas');
      }

      router.push('/?onboarding=success');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-4">Selecione suas Marcas</h1>
        <p className="text-zinc-400 text-lg">
          Encontramos as seguintes contas conectadas ao seu perfil. Selecione quais deseja gerenciar no sistema.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {pages.map((page) => {
          const isSelected = selectedPages.has(page.id);
          const hasIg = !!page.instagram_business_account;

          return (
            <div
              key={page.id}
              onClick={() => togglePage(page.id)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-indigo-500/10 border-indigo-500' 
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl font-bold">
                    {page.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{page.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FacebookIcon className="w-4 h-4 text-blue-500" />
                        Página
                      </span>
                      {hasIg && (
                        <span className="flex items-center gap-1">
                          <InstagramIcon className="w-4 h-4 text-pink-500" />
                          @{page.instagram_business_account.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pages.length === 0 && (
        <div className="text-center p-12 bg-zinc-900/50 rounded-2xl border border-white/5">
          Nenhuma página encontrada. Certifique-se de que você é administrador de páginas no Facebook.
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleImport}
          disabled={selectedPages.size === 0 || isLoading}
          className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          Importar Contas Selecionadas
        </button>
      </div>
    </div>
  );
}
