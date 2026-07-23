'use client';

import Link from 'next/link';

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
  LogOut,
  Calendar,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';


const mainNavigation = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inteligência ML', href: '/mercado-livre', icon: TrendingUp },
  { name: 'Mural de Ideias', href: '/board', icon: KanbanSquare },
  { name: 'Cronograma', href: '/cronograma', icon: Calendar },
];

const contentNavigation = [
  { name: 'Estúdio (IA)', href: '/conteudo/novo', icon: PlayCircle },
  { name: 'Biblioteca', href: '/conteudo', icon: FileText },
  { name: 'Social Hub', href: '/conteudo/publicar', icon: Share2 },
  { name: 'Criar Listas (Ideação)', href: '/ideacao', icon: Lightbulb },
  { name: 'Esteira de Produção', href: '/production', icon: PlayCircle },
];

const engagementNavigation = [
  { name: 'Inbox (DMs)', href: '/inbox', icon: MessageSquare },
  { name: 'Comentários', href: '/comments', icon: MessageCircle },
  { name: 'Performance', href: '/reports/engagement', icon: TrendingUp },
];

const assetNavigation = [
  { name: 'Banco de Imagens', href: '/banco-imagens', icon: Images },
  { name: 'Banco de Áudios', href: '/banco-audios', icon: Music },
  { name: 'Gerenciador de Ativos', href: '/produtos', icon: Package },
  { name: 'Conversor de Mídia', href: '/conversor', icon: RefreshCw },
];

export default function Sidebar() {
  const [pathname, setPathname] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);
  
  const isAutoHideMode = pathname.startsWith('/conteudo/editor') || pathname.startsWith('/conteudo/chat');
  const effectiveCollapsed = isAutoHideMode ? false : isCollapsed;

  return (
    <div className={clsx(
      "flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full transition-all duration-500",
      isAutoHideMode 
        ? "absolute left-0 top-0 z-[100] w-64 -translate-x-[calc(100%-10px)] hover:translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)] group" 
        : (effectiveCollapsed ? "w-20 relative" : "w-64 relative")
    )}>
      {/* Area to catch mouse hover when hidden and show a thin visual indicator */}
      {isAutoHideMode && (
        <div className="absolute right-0 top-0 w-[10px] h-full translate-x-full cursor-e-resize flex items-center justify-center bg-transparent hover:bg-zinc-800/20 transition-colors">
          <div className="w-1 h-32 rounded-full bg-zinc-800/30 group-hover:bg-transparent transition-all" />
        </div>
      )}

      {/* Collapse Toggle Button - Hidden in Auto-Hide Mode */}
      {!isAutoHideMode && (
        <button 
          onClick={() => setIsCollapsed(!effectiveCollapsed)}
          className="absolute -right-3 top-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-sm z-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {effectiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      <div className={clsx(
        "flex h-16 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800",
        effectiveCollapsed ? "justify-center" : "px-6"
      )}>
        <h1 className={clsx(
          "font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent transition-all",
          effectiveCollapsed ? "text-xl scale-125" : "text-xl"
        )}>
          {effectiveCollapsed ? "C" : "Cocreator Studio"}
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
                Engajamento
              </div>
            )}
            <ul role="list" className="space-y-1">
              {engagementNavigation.map((item) => {
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
      <div className="flex-none pb-4">

        {/* Commercial Widget */}
        {!isCollapsed && (
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Créditos de IA</span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">32 / 50</span>
              </div>
              <div className="w-full bg-white dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '64%' }} />
              </div>
              <Link href="/produtos" className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm">
                Fazer Upgrade
              </Link>
            </div>
          </div>
        )}

        <div className="px-4 space-y-2 mt-2">
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
    </div>
  );
}
