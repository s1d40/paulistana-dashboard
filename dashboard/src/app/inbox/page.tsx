'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Search, Send, Image as ImageIcon, Smile,
  MoreVertical, Phone, Video, ArrowLeft, User, Clock,
  CheckCheck, Circle, Loader2,
  RefreshCw, Filter, Star, Archive, Trash2, AlertCircle
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/brand-icons';
import clsx from 'clsx';

// Types
interface Account {
  id_conta: string;
  nome_conta: string;
  conta_id_instagram?: string;
  conta_id_facebook?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantUsername: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageFrom: string;
  updatedTime: string;
  platform: 'instagram' | 'facebook';
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
  fromId: string;
  fromName: string;
  type: 'text' | 'media';
  attachments?: any[];
}

function getInitials(name: string) {
  return name.replace('@', '').split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || '??';
}

function getAvatarColor(id: string) {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(isoDate: string) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 48) {
    return 'Ontem';
  } else {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}

export default function InboxPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook'>('instagram');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch accounts on mount
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          const accs = (data.accounts || data || []).filter((a: any) => a.conta_id_instagram || a.conta_id_facebook);
          setAccounts(accs);
          if (accs.length > 0) {
            setSelectedAccountId(accs[0].id_conta);
          }
        }
      } catch (e) {
        // Fallback: fetch from supabase directly
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data } = await supabase.from('contas').select('id_conta, nome_conta, conta_id_instagram, conta_id_facebook');
          const accs = (data || []).filter((a: any) => a.conta_id_instagram || a.conta_id_facebook);
          setAccounts(accs);
          if (accs.length > 0) setSelectedAccountId(accs[0].id_conta);
        } catch (_) { /* ignore */ }
      }
    }
    loadAccounts();
  }, []);

  // Fetch conversations when account changes or tab changes
  useEffect(() => {
    if (!selectedAccountId) return;
    loadConversations();
  }, [selectedAccountId, activeTab]);

  const loadConversations = async () => {
    if (!selectedAccountId) return;
    setIsLoadingConversations(true);
    setError(null);
    try {
      const res = await fetch(`/api/instagram/conversations?accountId=${selectedAccountId}&platform=${activeTab}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao carregar conversas');
        setConversations([]);
        return;
      }

      const convs: Conversation[] = (data.conversations || []).map((c: any) => ({
        ...c,
        unreadCount: 0 // TODO: implement unread tracking
      }));
      setConversations(convs);
    } catch (e: any) {
      setError(e.message || 'Erro de conexão');
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conv: Conversation) => {
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/instagram/messages?accountId=${selectedAccountId}&conversationId=${conv.id}`);
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Erro ao carregar mensagens');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedAccountId) return;
    
    setIsSending(true);
    const textToSend = newMessage;
    setNewMessage('');

    // Optimistic update
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      text: textToSend,
      timestamp: new Date().toISOString(),
      isFromMe: true,
      fromId: '',
      fromName: '',
      type: 'text'
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/instagram/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          recipientId: selectedConversation.participantId,
          text: textToSend
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar');
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        setNewMessage(textToSend);
      } else {
        // Update temp message with real ID
        setMessages(prev => prev.map(m => 
          m.id === tempMsg.id ? { ...m, id: data.messageId || m.id } : m
        ));
      }
    } catch (e: any) {
      setError(e.message);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileShowChat(true);
    setError(null);
    loadMessages(conv);
  };

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-0px)] bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      
      {/* SIDEBAR: Contacts List */}
      <div className={clsx(
        "flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full md:w-96 md:min-w-[384px] shrink-0",
        mobileShowChat && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-zinc-900 dark:text-white">Inbox</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {isLoadingConversations ? 'Carregando...' : 
                   conversations.length > 0 ? `${conversations.length} conversa${conversations.length > 1 ? 's' : ''}` : 'Instagram DMs'}
                </p>
              </div>
            </div>
            <button 
              onClick={loadConversations}
              disabled={isLoadingConversations}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-4 h-4 text-zinc-400", isLoadingConversations && "animate-spin")} />
            </button>
          </div>

          {/* Platform Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-3">
            <button
              onClick={() => setActiveTab('instagram')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all",
                activeTab === 'instagram' 
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <InstagramIcon className="w-4 h-4" />
              Instagram
            </button>
            <button
              onClick={() => setActiveTab('facebook')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all",
                activeTab === 'facebook' 
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <FacebookIcon className="w-4 h-4" />
              Messenger
            </button>
          </div>

          {/* Account Selector */}
          {accounts.length > 0 && (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full mb-3 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {accounts.map(acc => (
                <option key={acc.id_conta} value={acc.id_conta}>
                  {acc.nome_conta} {acc.conta_id_instagram ? '(IG)' : ''} {acc.conta_id_facebook ? '(FB)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">Erro</p>
              <p className="text-[10px] text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-auto">✕</button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
              <span className="text-xs font-medium">Carregando conversas...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 px-6">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <span className="text-xs font-medium text-center">
                {conversations.length === 0 ? 'Nenhuma conversa encontrada. Selecione uma conta com Instagram configurado.' : 'Nenhum resultado'}
              </span>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={clsx(
                  "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all border-b border-zinc-50 dark:border-zinc-800/50",
                  selectedConversation?.id === conv.id
                    ? "bg-indigo-50 dark:bg-indigo-500/10 border-l-2 border-l-indigo-500"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-l-2 border-l-transparent"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={clsx(
                    "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-sm shadow-md",
                    getAvatarColor(conv.participantId || conv.id)
                  )}>
                    {getInitials(conv.participantName)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                    <InstagramIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {conv.participantName || 'Usuário Instagram'}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                      {formatTime(conv.lastMessageTime || conv.updatedTime)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate pr-2">
                    {conv.lastMessage || 'Sem mensagens'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN: Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-white dark:bg-zinc-950",
        !mobileShowChat && !selectedConversation && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <button 
                onClick={() => { setMobileShowChat(false); setSelectedConversation(null); }}
                className="md:hidden p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-500" />
              </button>
              <div className="relative">
                <div className={clsx(
                  "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-black text-sm",
                  getAvatarColor(selectedConversation.participantId || selectedConversation.id)
                )}>
                  {getInitials(selectedConversation.participantName)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white truncate">
                  {selectedConversation.participantName || 'Usuário Instagram'}
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                  <InstagramIcon className="w-3 h-3 text-pink-500" />
                  {selectedConversation.participantUsername || selectedConversation.participantId}
                </p>
              </div>
              <button 
                onClick={() => loadMessages(selectedConversation)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className={clsx("w-4 h-4 text-zinc-400", isLoadingMessages && "animate-spin")} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-zinc-50 dark:bg-zinc-950"
              style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.03) 0%, transparent 50%)' }}
            >
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <span className="text-xs text-zinc-400">Carregando mensagens...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-xs">Nenhuma mensagem nesta conversa</span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={clsx("flex", msg.isFromMe ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                      msg.isFromMe
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md border border-zinc-100 dark:border-zinc-700"
                    )}>
                      {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-1">
                          {msg.attachments.map((att: any, i: number) => (
                            att.image_data?.url ? (
                              <img key={i} src={att.image_data.url} alt="attachment" className="rounded-lg max-w-full max-h-48 mt-1" />
                            ) : att.video_data?.url ? (
                              <video key={i} src={att.video_data.url} controls className="rounded-lg max-w-full max-h-48 mt-1" />
                            ) : null
                          ))}
                        </div>
                      )}
                      <div className={clsx(
                        "flex items-center justify-end gap-1 mt-1",
                        msg.isFromMe ? "text-indigo-200" : "text-zinc-400"
                      )}>
                        <span className="text-[9px] font-medium">{formatTime(msg.timestamp)}</span>
                        {msg.isFromMe && <CheckCheck className="w-3 h-3 text-sky-300" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Escreva uma mensagem..."
                  disabled={isSending}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className={clsx(
                    "p-2.5 rounded-xl transition-all",
                    newMessage.trim()
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}
                >
                  {isSending 
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5" />
                  }
                </button>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1.5 px-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Respostas enviadas com tag Human Agent — válidas além de 24h
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-indigo-500/40" />
            </div>
            <h2 className="text-xl font-black text-zinc-700 dark:text-zinc-300 mb-2">Selecione uma conversa</h2>
            <p className="text-sm text-zinc-400 max-w-sm text-center">
              Escolha um contato à esquerda para visualizar e responder mensagens do Instagram.
            </p>
            <div className="flex items-center gap-3 mt-6 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-500" /> Instagram DMs
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <FacebookIcon className="w-3.5 h-3.5 text-blue-500" /> Messenger
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
