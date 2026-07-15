'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle, Search, Send, Heart, EyeOff,
  CheckCircle, AlertCircle, Loader2,
  Clock, ThumbsUp, Reply, Trash2,
  Image as ImageIcon, RefreshCw, ChevronDown
} from 'lucide-react';
import { InstagramIcon } from '@/components/brand-icons';
import clsx from 'clsx';

interface Account {
  id_conta: string;
  nome_conta: string;
  conta_id_instagram?: string;
}

interface CommentReply {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
}

interface Comment {
  id: string;
  postId: string;
  postCaption: string;
  postThumbnail: string;
  postType: string;
  username: string;
  text: string;
  timestamp: string;
  likes: number;
  replies: CommentReply[];
  platform: string;
  // Local UI state
  isLiked?: boolean;
  isHidden?: boolean;
  isResolved?: boolean;
}

function getInitials(name: string) {
  return name.replace('@', '').substring(0, 2).toUpperCase() || '??';
}

function getAvatarColor(id: string) {
  const colors = ['from-pink-500 to-rose-500', 'from-violet-500 to-purple-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-red-500 to-pink-500', 'from-indigo-500 to-blue-500'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(isoDate: string) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function CommentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load accounts
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          const accs = (data.accounts || []).filter((a: any) => a.conta_id_instagram);
          setAccounts(accs);
          if (accs.length > 0) setSelectedAccountId(accs[0].id_conta);
        }
      } catch (_) { /* ignore */ }
    }
    loadAccounts();
  }, []);

  // Load comments when account changes
  useEffect(() => {
    if (selectedAccountId) loadComments();
  }, [selectedAccountId]);

  const loadComments = async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/instagram/comments?accountId=${selectedAccountId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao carregar comentários');
        setComments([]);
        return;
      }

      setComments((data.comments || []).map((c: any) => ({ ...c, isLiked: false, isHidden: false, isResolved: false })));
      setAccountName(data.accountName || '');
    } catch (e: any) {
      setError(e.message || 'Erro de conexão');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch('/api/instagram/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          commentId,
          text: replyText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao responder');
      } else {
        // Adicionar resposta localmente
        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isResolved: true,
              replies: [...c.replies, {
                id: data.replyId || `temp_${Date.now()}`,
                username: accountName,
                text: replyText,
                timestamp: new Date().toISOString(),
                isFromMe: true
              }]
            };
          }
          return c;
        }));
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleHide = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isHidden: true } : c));
  };

  const handleResolve = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isResolved: !c.isResolved } : c));
  };

  const handleLike = async (commentId: string, isCurrentlyLiked: boolean) => {
    setLikingId(commentId);
    try {
      const res = await fetch('/api/instagram/comments/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          commentId,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === commentId ? {
          ...c,
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1
        } : c));
      } else {
        setError(data.error || 'Erro ao curtir');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLikingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja EXCLUIR este comentário? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    setDeletingId(commentId);
    try {
      const res = await fetch('/api/instagram/comments/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          commentId,
          action: 'delete'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        setError(data.error || 'Erro ao excluir');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredComments = comments.filter(c => {
    if (c.isHidden) return false;
    const matchesSearch = c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'resolved' && c.isResolved) ||
      (filterStatus === 'pending' && !c.isResolved);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: comments.filter(c => !c.isHidden).length,
    pending: comments.filter(c => !c.isResolved && !c.isHidden).length,
    withReplies: comments.filter(c => c.replies.length > 0 && !c.isHidden).length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Comentários</h1>
              <p className="text-xs text-zinc-400 font-medium">
                {isLoading ? 'Carregando...' : `${stats.total} comentários${accountName ? ` · ${accountName}` : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Account Selector */}
            {accounts.length > 0 && (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[200px]"
              >
                {accounts.map(acc => (
                  <option key={acc.id_conta} value={acc.id_conta}>
                    {acc.nome_conta}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={loadComments}
              disabled={isLoading}
              className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-4 h-4 text-zinc-500", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'from-indigo-500 to-violet-500', icon: MessageCircle },
            { label: 'Pendentes', value: stats.pending, color: 'from-amber-500 to-orange-500', icon: Clock },
            { label: 'Respondidos', value: stats.withReplies, color: 'from-emerald-500 to-teal-500', icon: ThumbsUp },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3">
              <div className={clsx("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar comentário ou usuário..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'pending', 'resolved'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                  filterStatus === s
                    ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendentes' : 'Resolvidos'}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Erro</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Comments Feed */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm text-zinc-400">Carregando comentários do Instagram...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center text-zinc-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-bold">{comments.length === 0 ? 'Nenhum comentário encontrado' : 'Nenhum resultado para o filtro'}</p>
              <p className="text-xs mt-1">Selecione uma conta com Instagram configurado</p>
            </div>
          ) : (
            filteredComments.map(comment => (
              <div
                key={comment.id}
                className={clsx(
                  "bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden transition-all",
                  comment.isResolved
                    ? "border-emerald-200 dark:border-emerald-900/50"
                    : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                <div className="p-4">
                  {/* Post Context */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    {comment.postThumbnail ? (
                      <img src={comment.postThumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-zinc-400 truncate flex-1">{comment.postCaption || 'Post sem legenda'}</span>
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  </div>

                  {/* Comment */}
                  <div className="flex gap-3">
                    <div className={clsx(
                      "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-xs shrink-0",
                      getAvatarColor(comment.username)
                    )}>
                      {getInitials(comment.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">@{comment.username}</span>
                        <span className="text-[10px] text-zinc-400">{formatTime(comment.timestamp)}</span>
                        {comment.isResolved && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" /> Resolvido
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{comment.text}</p>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex gap-2 items-start">
                              <div className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0 mt-0.5",
                                reply.isFromMe ? "bg-indigo-600" : "bg-zinc-500"
                              )}>
                                {getInitials(reply.username)}
                              </div>
                              <div>
                                <span className={clsx("text-[10px] font-bold", reply.isFromMe ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500")}>
                                  @{reply.username}
                                </span>
                                <span className="text-[10px] text-zinc-400 ml-2">{formatTime(reply.timestamp)}</span>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">

                        <button
                          onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        >
                          <Reply className="w-3 h-3" /> Responder
                        </button>
                        <button
                          onClick={() => handleResolve(comment.id)}
                          className={clsx(
                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all",
                            comment.isResolved
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
                          )}
                        >
                          <CheckCircle className="w-3 h-3" /> {comment.isResolved ? 'Resolvido' : 'Resolver'}
                        </button>
                        <button
                          onClick={() => handleHide(comment.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-all"
                        >
                          <EyeOff className="w-3 h-3" /> Ocultar
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Excluir
                        </button>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {['👏', '🔥', '❤️', '🙌', '😍', '😂', '😢', '🙏', '💡'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => setReplyText(prev => prev + emoji)}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                              placeholder="Escreva sua resposta..."
                              autoFocus
                              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyText.trim() || isSending}
                              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
                            >
                              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
