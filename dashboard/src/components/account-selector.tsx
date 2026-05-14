'use client';

import { useState, useEffect } from 'react';
import { fetchAccounts, fetchClients, Account, Client } from '@/services/supabase-service';
import { Users, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface AccountSelectorProps {
  onSelect: (account: Account, client: Client | null) => void;
}

export default function AccountSelector({ onSelect }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchClients()]).then(([accs, clis]) => {
      setAccounts(accs);
      setClients(clis);
      
      // Regra de Negócio: Auto-selecionar 'Natural Feeding BR' por padrão
      const defaultAccount = accs.find(a => a.nome_conta.includes('Natural Feeding')) || accs[0];
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id_conta);
        const client = clis.find(c => c.id_cliente === defaultAccount.id_cliente) || null;
        onSelect(defaultAccount, client);
      }
    });
    // Executa apenas uma vez no carregamento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (account: Account) => {
    setSelectedAccountId(account.id_conta);
    const client = clients.find(c => c.id_cliente === account.id_cliente) || null;
    onSelect(account, client);
    setIsOpen(false);
  };

  const selectedAccount = accounts.find(a => a.id_conta === selectedAccountId);

  return (
    <div className="relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">
        Conta de Destino (Contexto)
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {selectedAccount ? selectedAccount.nome_conta : 'Selecionar Conta'}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium">
              {selectedAccount ? selectedAccount.nicho : 'Publicação e Tokens'}
            </p>
          </div>
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
              {accounts.map((acc) => (
                <button
                  key={acc.id_conta}
                  onClick={() => handleSelect(acc)}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-1 last:mb-0",
                    selectedAccountId === acc.id_conta
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-100 dark:border-zinc-700">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">{acc.nome_conta}</p>
                      <p className="text-[9px] opacity-70">{acc.nicho}</p>
                    </div>
                  </div>
                  {selectedAccountId === acc.id_conta && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
