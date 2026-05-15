'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings,
  FileText,
  Images,
  Music,
  Package,
  PlayCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

const mainNavigation = [
  { name: 'Visão Geral', href: '/', icon: LayoutDashboard },
  { name: 'Mural de Ideias', href: '/board', icon: KanbanSquare },
  { name: 'Cronograma', href: '/cronograma', icon: Calendar },
];

const contentNavigation = [
  { name: 'Estúdio (IA)', href: '/conteudo/novo', icon: PlayCircle },
  { name: 'Biblioteca', href: '/conteudo', icon: FileText },
  { name: 'Social Hub', href: '/conteudo/publicar', icon: Share2 },
];

const assetNavigation = [
  { name: 'Banco de Imagens', href: '/banco-imagens', icon: Images },
  { name: 'Banco de Áudios', href: '/banco-audios', icon: Music },
  { name: 'Gerenciador de Ativos', href: '/produtos', icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={clsx(
      "flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-sm z-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={clsx(
        "flex h-16 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800",
        isCollapsed ? "justify-center" : "px-6"
      )}>
        <h1 className={clsx(
          "font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent transition-all",
          isCollapsed ? "text-xl scale-125" : "text-xl"
        )}>
          {isCollapsed ? "P" : "Paulistana BI"}
        </h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-8">
          
          {/* Principal */}
          <div>
            <ul role="list" className="space-y-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-zinc-700 hover:text-indigo-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors',
                        isCollapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-zinc-300',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Fábrica de Conteúdo */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2 truncate">
                Fábrica de Conteúdo
              </div>
            )}
            <ul role="list" className="space-y-1">
              {contentNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-zinc-700 hover:text-indigo-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors',
                        isCollapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-zinc-300',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Gestão de Ativos */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2 truncate">
                Gestão de Ativos
              </div>
            )}
            <ul role="list" className="space-y-1">
              {assetNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={clsx(
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-zinc-700 hover:text-indigo-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors',
                        isCollapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-zinc-300',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
        </nav>
      </div>
      
      {/* Bottom Profile/Settings */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
        <Link href="/presets" className={clsx(
          "flex items-center gap-x-4 px-2 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-md transition-colors",
          isCollapsed && "justify-center"
        )}>
          <Settings className="h-5 w-5 text-zinc-400" />
          {!isCollapsed && <span>Configurações</span>}
        </Link>

        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={clsx(
            "w-full flex items-center gap-x-4 px-2 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sair do Painel</span>}
        </button>
      </div>
    </div>
  );
}
