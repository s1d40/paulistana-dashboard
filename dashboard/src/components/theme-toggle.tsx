'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Sunrise, Sunset, CloudSun, MoonStar } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    { id: 'light', name: 'Claro', icon: Sun },
    { id: 'offwhite', name: 'Offwhite', icon: CloudSun },
    { id: 'dark', name: 'Escuro', icon: Moon },
    { id: 'sunset', name: 'Fim de Tarde', icon: Sunset },
    { id: 'offblack', name: 'Off Black', icon: MoonStar },
    { id: 'dawn', name: 'Madrugada', icon: Sunrise },
  ];

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-2 items-center w-full px-2 py-4 border-t border-zinc-200 dark:border-zinc-800">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.name}
            className={clsx(
              "p-2 rounded-md transition-colors",
              theme === t.id ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full border-t border-zinc-200 dark:border-zinc-800 pt-4 pb-2 mt-4">
      <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1 px-2">
        Tema do Painel
      </div>
      <div className="grid grid-cols-2 gap-1 px-2">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
              theme === t.id 
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-medium" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="truncate">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
