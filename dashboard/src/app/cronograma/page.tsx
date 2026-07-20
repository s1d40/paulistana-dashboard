'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { fetchContentPosts, fetchAccounts, ContentPost, Account } from '@/services/supabase-service';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
  LayoutList,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

// Social media icons (not available in this lucide-react version)
const IgIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const FbIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const YtIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);
import clsx from 'clsx';
import Link from 'next/link';

type ViewMode = 'list' | 'grid' | 'calendar';
type StatusFilter = 'all' | 'agendado' | 'publicado';
type PeriodFilter = 'all' | 'next7' | 'next30' | 'past';

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS_PT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

function getPlatforms(post: ContentPost) {
  const platforms: { name: string; icon: (props: { className?: string }) => React.JSX.Element; color: string }[] = [];
  if (post.instagram_url) platforms.push({ name: 'IG', icon: IgIcon, color: 'text-pink-400' });
  if (post.facebook_url) platforms.push({ name: 'FB', icon: FbIcon, color: 'text-blue-400' });
  if (post.youtube_url) platforms.push({ name: 'YT', icon: YtIcon, color: 'text-red-400' });
  return platforms;
}

function getStatusInfo(post: ContentPost, date: Date) {
  const isPast = date.getTime() < Date.now();
  if (post.status_agendamento === 'publicado') return { label: 'Publicado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', icon: CheckCircle2 };
  if (isPast) return { label: 'Atrasado', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500', icon: AlertCircle };
  return { label: 'Agendado', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-500', icon: Clock };
}

export default function CronogramaPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [postsData, accountsData] = await Promise.all([fetchContentPosts(), fetchAccounts()]);
        const scheduled = postsData.filter(p => p.data_agendamento || p.status_agendamento === 'publicado');
        setPosts(scheduled);
        setAccounts(accountsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered + Sorted Posts
  const filteredPosts = useMemo(() => {
    const now = new Date();
    return posts.filter(p => {
      // Status filter
      if (statusFilter !== 'all' && p.status_agendamento !== statusFilter) return false;
      // Account filter
      if (accountFilter !== 'all' && p.id_conta !== accountFilter) return false;
      // Period filter
      if (periodFilter !== 'all') {
        const d = new Date(p.data_agendamento || 0);
        if (periodFilter === 'past' && d.getTime() >= now.getTime()) return false;
        if (periodFilter === 'next7') {
          const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
          if (d.getTime() < now.getTime() || d.getTime() > in7.getTime()) return false;
        }
        if (periodFilter === 'next30') {
          const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
          if (d.getTime() < now.getTime() || d.getTime() > in30.getTime()) return false;
        }
      }
      // Platform filter
      if (platformFilter.length > 0) {
        const has = (platformFilter.includes('ig') && p.instagram_url) ||
                    (platformFilter.includes('fb') && p.facebook_url) ||
                    (platformFilter.includes('yt') && p.youtube_url);
        if (!has) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.data_agendamento || 0).getTime();
      const dateB = new Date(b.data_agendamento || 0).getTime();
      return dateA - dateB;
    });
  }, [posts, statusFilter, accountFilter, periodFilter, platformFilter]);

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: filteredPosts.length,
      agendados: filteredPosts.filter(p => p.status_agendamento === 'agendado' && new Date(p.data_agendamento || 0).getTime() >= now).length,
      publicados: filteredPosts.filter(p => p.status_agendamento === 'publicado').length,
      atrasados: filteredPosts.filter(p => p.status_agendamento !== 'publicado' && new Date(p.data_agendamento || 0).getTime() < now).length,
    };
  }, [filteredPosts]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    accountFilter !== 'all',
    periodFilter !== 'all',
    platformFilter.length > 0,
  ].filter(Boolean).length;

  const togglePlatform = (p: string) => {
    setPlatformFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setAccountFilter('all');
    setPeriodFilter('all');
    setPlatformFilter([]);
  };

  const getAccountName = (id?: string) => {
    if (!id) return null;
    const acc = accounts.find(a => a.id_conta === id);
    return acc?.nome_conta || null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">
          <CalendarIcon className="w-3 h-3" />
          Social Engine
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
          Cronograma <span className="text-indigo-500">de Publicações</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium">Gerencie a fila de postagens automatizadas e agendadas.</p>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-zinc-900', border: 'border-zinc-800' },
            { label: 'Agendados', value: stats.agendados, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
            { label: 'Publicados', value: stats.publicados, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
            { label: 'Atrasados', value: stats.atrasados, color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
          ].map(s => (
            <div key={s.label} className={clsx('p-4 rounded-2xl border', s.bg, s.border)}>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.label}</p>
              <p className={clsx('text-2xl font-black mt-1', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Left: View Selector + Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900/80 p-1 border border-zinc-800 rounded-xl">
            {([
              { mode: 'list' as ViewMode, icon: LayoutList, label: 'Lista' },
              { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
              { mode: 'calendar' as ViewMode, icon: CalendarDays, label: 'Calendário' },
            ]).map(v => (
              <button
                key={v.mode}
                onClick={() => { setViewMode(v.mode); setSelectedDay(null); }}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                  viewMode === v.mode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'
                )}
                title={v.label}
              >
                <v.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center bg-zinc-900/50 p-1 border border-zinc-800 rounded-xl">
            {([
              { value: 'all' as StatusFilter, label: 'Todos', activeClass: 'bg-white text-black' },
              { value: 'agendado' as StatusFilter, label: 'Agendados', activeClass: 'bg-indigo-600 text-white' },
              { value: 'publicado' as StatusFilter, label: 'Publicados', activeClass: 'bg-emerald-600 text-white' },
            ]).map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={clsx(
                  'px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                  statusFilter === f.value ? f.activeClass + ' shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-indigo-500/50 transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Todas Contas</option>
            {accounts.map(a => (
              <option key={a.id_conta} value={a.id_conta}>{a.nome_conta}</option>
            ))}
          </select>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-indigo-500/50 transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Todo Período</option>
            <option value="next7">Próximos 7 dias</option>
            <option value="next30">Próximos 30 dias</option>
            <option value="past">Apenas Passadas</option>
          </select>

          {/* Platform Toggles */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {([
              { key: 'ig', icon: IgIcon, color: 'text-pink-400', activeBg: 'bg-pink-500/20' },
              { key: 'fb', icon: FbIcon, color: 'text-blue-400', activeBg: 'bg-blue-500/20' },
              { key: 'yt', icon: YtIcon, color: 'text-red-400', activeBg: 'bg-red-500/20' },
            ]).map(p => (
              <button
                key={p.key}
                onClick={() => togglePlatform(p.key)}
                className={clsx(
                  'p-1.5 rounded-lg transition-all',
                  platformFilter.includes(p.key) ? `${p.activeBg} ${p.color}` : 'text-zinc-600 hover:text-zinc-400'
                )}
                title={p.key.toUpperCase()}
              >
                <p.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500/20 transition-all"
            >
              <X className="w-3 h-3" /> Limpar ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-50">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Calendário...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="animate-in fade-in duration-300">
          {viewMode === 'list' && <ListView posts={filteredPosts} getAccountName={getAccountName} />}
          {viewMode === 'grid' && <GridView posts={filteredPosts} getAccountName={getAccountName} />}
          {viewMode === 'calendar' && (
            <CalendarView
              posts={filteredPosts}
              calendarDate={calendarDate}
              setCalendarDate={setCalendarDate}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              getAccountName={getAccountName}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ============ EMPTY STATE ============ */
function EmptyState() {
  return (
    <div className="h-96 flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/20">
      <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800">
        <Clock className="w-8 h-8 text-zinc-700" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-zinc-400">Nenhuma publicação encontrada.</p>
        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Ajuste os filtros ou acesse a biblioteca.</p>
      </div>
      <Link href="/conteudo" className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all">
        Ir para Biblioteca
      </Link>
    </div>
  );
}

/* ============ LIST VIEW ============ */
function ListView({ posts, getAccountName }: { posts: ContentPost[]; getAccountName: (id?: string) => string | null }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {posts.map(post => {
        const date = new Date(post.data_agendamento || 0);
        const status = getStatusInfo(post, date);
        const platforms = getPlatforms(post);
        const accountName = getAccountName(post.id_conta);
        const StatusIcon = status.icon;

        return (
          <div key={post.id_post} className="group flex items-center gap-4 md:gap-6 p-4 md:p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:bg-zinc-900 hover:border-indigo-500/30 transition-all">
            {/* Date Badge */}
            <div className={clsx(
              'flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 transition-all shrink-0',
              status.bg
            )}>
              <span className="text-[9px] font-black uppercase text-indigo-400">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
              <span className="text-2xl md:text-3xl font-black text-white">{date.getDate()}</span>
              <span className="text-[8px] font-black uppercase text-zinc-500">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {accountName && (
                  <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-violet-500/20">
                    {accountName}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                  {post.tipo_post || 'Vídeo'}
                </span>
                <div className={clsx('flex items-center gap-1 text-[8px] font-black uppercase tracking-widest', status.color)}>
                  <StatusIcon className="w-3 h-3" /> {status.label}
                </div>
              </div>
              <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                {post.titulo_post || post.tema_post}
              </h3>
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-500 line-clamp-1 italic flex-1">{post.captions || 'Sem legenda.'}</p>
                {platforms.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {platforms.map(p => {
                      const PIcon = p.icon;
                      return <PIcon key={p.name} className={clsx('w-3.5 h-3.5', p.color)} />;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/conteudo?id=${post.id_post}`} className="p-2.5 bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white rounded-xl transition-all">
                <FileText className="w-4 h-4" />
              </Link>
              <Link href={`/production/${post.id_post}`} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white rounded-xl transition-all">
                Editar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ GRID VIEW ============ */
function GridView({ posts, getAccountName }: { posts: ContentPost[]; getAccountName: (id?: string) => string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {posts.map(post => {
        const date = new Date(post.data_agendamento || 0);
        const status = getStatusInfo(post, date);
        const platforms = getPlatforms(post);
        const accountName = getAccountName(post.id_conta);
        const StatusIcon = status.icon;

        return (
          <Link
            key={post.id_post}
            href={`/production/${post.id_post}`}
            className="group flex flex-col bg-zinc-900/60 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/40 hover:bg-zinc-900 transition-all overflow-hidden"
          >
            {/* Top bar with date + status */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className={clsx('w-2 h-2 rounded-full', status.dot)} />
                <span className={clsx('text-[10px] font-black uppercase tracking-widest', status.color)}>{status.label}</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500">
                {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-3 space-y-2">
              <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors leading-tight">
                {post.titulo_post || post.tema_post}
              </h3>
              <p className="text-[11px] text-zinc-500 line-clamp-2 italic leading-relaxed">
                {post.captions || 'Sem legenda definida.'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                {accountName && (
                  <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[7px] font-black uppercase tracking-widest rounded border border-violet-500/20 truncate max-w-[100px]">
                    {accountName}
                  </span>
                )}
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[7px] font-black uppercase rounded">
                  {post.tipo_post || 'Vídeo'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {platforms.map(p => {
                  const PIcon = p.icon;
                  return <PIcon key={p.name} className={clsx('w-3 h-3', p.color)} />;
                })}
                {platforms.length === 0 && <span className="text-[8px] text-zinc-700">—</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ============ CALENDAR VIEW ============ */
function CalendarView({
  posts, calendarDate, setCalendarDate, selectedDay, setSelectedDay, getAccountName
}: {
  posts: ContentPost[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  selectedDay: number | null;
  setSelectedDay: (d: number | null) => void;
  getAccountName: (id?: string) => string | null;
}) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0 in our grid. JS getDay: 0=Sun, 1=Mon...
  const firstDayJS = new Date(year, month, 1).getDay();
  const startOffset = firstDayJS === 0 ? 6 : firstDayJS - 1; // Adjust for Mon start
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Group posts by day
  const postsByDay = useMemo(() => {
    const map: Record<number, ContentPost[]> = {};
    posts.forEach(p => {
      const d = new Date(p.data_agendamento || 0);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(p);
      }
    });
    return map;
  }, [posts, year, month]);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const selectedPosts = selectedDay ? (postsByDay[selectedDay] || []) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all text-zinc-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            {MONTHS_PT[month]} <span className="text-indigo-500">{year}</span>
          </h2>
          <button onClick={nextMonth} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all text-zinc-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS_PT.map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 py-2">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = postsByDay[day] || [];
            const isToday = isCurrentMonth && today.getDate() === day;
            const isSelected = selectedDay === day;
            const hasPublished = dayPosts.some(p => p.status_agendamento === 'publicado');
            const hasScheduled = dayPosts.some(p => p.status_agendamento !== 'publicado');

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={clsx(
                  'aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative',
                  isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' :
                  isToday ? 'bg-indigo-500/10 border border-indigo-500/30 text-white' :
                  dayPosts.length > 0 ? 'bg-zinc-800/80 hover:bg-zinc-800 text-white cursor-pointer' :
                  'text-zinc-600 hover:bg-zinc-900'
                )}
              >
                <span className={clsx('text-sm font-bold', isSelected && 'text-white')}>{day}</span>
                {/* Post dots */}
                {dayPosts.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasScheduled && <div className={clsx('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white/60' : 'bg-indigo-500')} />}
                    {hasPublished && <div className={clsx('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-emerald-500')} />}
                    {dayPosts.length > 2 && (
                      <span className={clsx('text-[7px] font-black', isSelected ? 'text-white/70' : 'text-zinc-500')}>
                        +{dayPosts.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[9px] font-bold text-zinc-500">Agendado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-zinc-500">Publicado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/30" />
            <span className="text-[9px] font-bold text-zinc-500">Hoje</span>
          </div>
        </div>
      </div>

      {/* Selected Day Posts */}
      {selectedDay && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {selectedDay} de {MONTHS_PT[month]}
            </h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-md">
              {selectedPosts.length} {selectedPosts.length === 1 ? 'post' : 'posts'}
            </span>
            <button onClick={() => setSelectedDay(null)} className="ml-auto p-1 text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedPosts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
              <p className="text-xs text-zinc-600 font-bold">Nenhum post neste dia.</p>
            </div>
          ) : (
            <ListView posts={selectedPosts} getAccountName={getAccountName} />
          )}
        </div>
      )}
    </div>
  );
}
