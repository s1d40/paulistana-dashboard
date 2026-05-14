'use client';

import { 
  Send, Loader2, User, Bot, Paperclip, X, Image as ImageIcon, 
  Music, Video, FileText, Download, Layout
} from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'post';
  url: string;
  name: string;
  id?: string;
  status?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  metadata?: {
    postId?: string;
    action?: string;
    progress?: number;
  };
}

export interface ChatPanelProps {
  title: string;
  description: string;
  apiEndpoint: string;
  icon?: React.ReactNode;
  systemMessage?: string;
  initialPrompt?: string;
  inputValue?: string;
  onInputChange?: (val: string) => void;
}

export default function ChatPanel({ 
  title, description, apiEndpoint, icon, systemMessage, initialPrompt,
  inputValue, onInputChange 
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [internalInput, setInternalInput] = useState('');
  
  const localInput = inputValue !== undefined ? inputValue : internalInput;
  const setLocalInput = onInputChange || setInternalInput;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(2, 10)}`);
  const [activeView, setActiveView] = useState<'chat' | 'gallery'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPromptRef = useRef(initialPrompt);

  // Pre-fill input if initialPrompt is provided and no messages yet
  useEffect(() => {
    if (initialPrompt && messages.length === 0 && initialPromptRef.current === initialPrompt) {
      setLocalInput(initialPrompt);
      initialPromptRef.current = undefined; // Mark as handled
    }
  }, [initialPrompt, messages.length, setLocalInput]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const allMedia = useMemo(() => {
    const media: Attachment[] = [];
    messages.forEach(m => {
      if (m.attachments) media.push(...m.attachments);
    });
    return media;
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) throw new Error(`Falha no upload de ${file.name}`);
        const data = await res.json();
        
        let type: Attachment['type'] = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        return {
          type,
          url: data.url,
          name: data.name
        } as Attachment;
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setPendingAttachments(prev => [...prev, ...uploadedAttachments]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload de um ou mais arquivos.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!localInput.trim() && pendingAttachments.length === 0) || isLoading || isUploading) return;
    
    const userMessage = localInput.trim();
    const currentAttachments = [...pendingAttachments];
    
    setLocalInput('');
    setPendingAttachments([]);
    setIsLoading(true);

    const newMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          sessionId, 
          attachments: currentAttachments,
          systemMessage, // Pass the consolidated system message
        }),
      });

      if (!res.ok) throw new Error('Erro na requisição');

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev, 
          { id: assistantMessageId, role: 'assistant', content: '' }
        ]);

        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            let textToAppend = '';
            const newAttachments: Attachment[] = [];
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]' || !dataStr) continue;
                try {
                  const dataObj = JSON.parse(dataStr);
                  // Check for text content
                  const content = dataObj.output ?? dataObj.text ?? dataObj.response ?? dataObj.message ?? dataObj.token;
                  if (typeof content === 'string') textToAppend += content;
                  
                  // Check for assistant attachments returned by the flow
                  if (dataObj.attachments && Array.isArray(dataObj.attachments)) {
                    newAttachments.push(...dataObj.attachments);
                  }
                } catch {
                  // Silent catch for text chunks
                }
              }
            }
            
            if (textToAppend || newAttachments.length > 0) {
               setMessages((prev) => prev.map(m => 
                 m.id === assistantMessageId 
                  ? { 
                      ...m, 
                      content: m.content + textToAppend,
                      attachments: m.attachments ? [...m.attachments, ...newAttachments] : (newAttachments.length > 0 ? newAttachments : undefined)
                    } 
                  : m
               ));
            }
          }
        }
      } else {
        const data = await res.json();
        setMessages((prev) => [
          ...prev, 
          { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: data.output || data.response || data.message || (typeof data === 'string' ? data : 'OK'),
            attachments: data.attachments
          }
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Desculpe, ocorreu um erro de conexão.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const AttachmentPreview = ({ attachment, className }: { attachment: Attachment, className?: string }) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className={clsx("relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800", className)}>
            <Image 
              src={attachment.url} 
              alt={attachment.name} 
              width={800} 
              height={600} 
              unoptimized 
              className="max-w-full h-auto object-cover" 
            />
          </div>
        );
      case 'video':
        return (
          <video controls src={attachment.url} className={clsx("rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-full", className)} />
        );
      case 'audio':
        return (
          <audio controls src={attachment.url} className={clsx("w-full max-w-sm", className)} />
        );
      case 'post':
        return (
          <div className={clsx("bg-white dark:bg-zinc-900 border-2 border-indigo-500 rounded-xl p-4 shadow-lg min-w-[280px]", className)}>
            <div className="flex items-center gap-2 mb-2 text-indigo-500">
              <Layout className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Post Associado</span>
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{attachment.name}</h4>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400">#{attachment.id?.substring(0,8)}</span>
              <span className={clsx(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                attachment.status === 'OK' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
              )}>
                {attachment.status || 'Processando'}
              </span>
            </div>
          </div>
        );
      default:
        return (
          <a 
            href={attachment.url} 
            target="_blank" 
            rel="noreferrer"
            className={clsx("flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors", className)}
          >
            <FileText className="w-5 h-5 text-indigo-500" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{attachment.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase">Documento</p>
            </div>
            <Download className="w-4 h-4 text-zinc-400" />
          </a>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full mx-auto bg-white dark:bg-zinc-950 overflow-hidden">
      
      {/* Sidebar Navigation (Mobile optimization: can be tabs) */}
      <div className="md:w-16 flex md:flex-col border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950">
        <button 
          onClick={() => setActiveView('chat')}
          className={clsx(
            "flex-1 md:flex-none p-4 flex flex-col items-center gap-1 transition-all",
            activeView === 'chat' ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <Bot className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chat</span>
        </button>
        <button 
          onClick={() => setActiveView('gallery')}
          className={clsx(
            "flex-1 md:flex-none p-4 flex flex-col items-center gap-1 transition-all",
            activeView === 'gallery' ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          <Layout className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Mídias</span>
          {allMedia.length > 0 && (
            <span className="absolute md:relative md:top-0 md:right-0 top-2 right-4 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
              {allMedia.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {activeView === 'chat' ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {icon || <Bot className="w-5 h-5 text-indigo-500" />}
                {title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {description}
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-40">
                  <Bot className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">Inicie uma conversa multimídia</p>
                  <p className="text-sm">Envie imagens, vídeos ou documentos para análise.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx("flex gap-4", m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <div
                      className={clsx(
                        "max-w-[85%] space-y-3",
                        m.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'
                      )}
                    >
                      {/* Attachments rendering */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {m.attachments.map((at, i) => (
                            <AttachmentPreview key={i} attachment={at} className="max-w-[240px]" />
                          ))}
                        </div>
                      )}
                      
                      {/* Text content bubble */}
                      {m.content && (
                        <div
                          className={clsx(
                            "rounded-2xl px-4 py-3 shadow-sm",
                            m.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed text-sm font-medium">
                            {m.content}
                          </p>
                        </div>
                      )}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    <span className="text-sm font-bold text-zinc-500">Processando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
              {/* Pending Attachments List */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl animate-in slide-in-from-bottom-2">
                  {pendingAttachments.map((at, i) => (
                  <div key={i} className="relative group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center relative">
                    {at.type === 'image' ? (
                      <Image 
                        src={at.url} 
                        alt={at.name} 
                        fill 
                        unoptimized 
                        className="object-cover" 
                      />
                    ) : at.type === 'video' ? (
                      <Video className="w-6 h-6 text-zinc-400" />
                    ) : at.type === 'audio' ? (
                      <Music className="w-6 h-6 text-zinc-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>                      <button 
                        onClick={() => removePendingAttachment(i)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                    </div>
                  )}
                </div>
              )}

              <form
                onSubmit={handleFormSubmit}
                className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1.5 pl-4 border border-transparent focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner"
              >
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors"
                  title="Anexar arquivos"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <input
                  className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 py-2 font-medium"
                  value={localInput}
                  placeholder="Digite sua mensagem..."
                  onChange={(e) => setLocalInput(e.target.value)}
                />
                
                <button
                  type="submit"
                  disabled={(!localInput.trim() && pendingAttachments.length === 0) || isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-500" /> Galeria da Sessão
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Todos os artefatos multimídia desta sessão</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {allMedia.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold">Nenhuma mídia encontrada</p>
                  <p className="text-xs">Assets enviados ou recebidos aparecerão aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {allMedia.map((at, i) => (
                    <div key={i} className="group relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                        {at.type === 'image' ? (
                          <Image 
                            src={at.url} 
                            alt={at.name} 
                            fill 
                            unoptimized 
                            className="object-cover transition-transform group-hover:scale-110" 
                          />
                        ) : at.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video src={at.url} className="w-full h-full object-cover opacity-60" />
                            <Video className="absolute inset-0 m-auto w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        ) : at.type === 'audio' ? (
                          <Music className="w-10 h-10 text-zinc-300" />
                        ) : (
                          <FileText className="w-10 h-10 text-zinc-300" />
                        )}
                      </div>
                      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate pr-2">{at.name}</p>
                        <a href={at.url} target="_blank" rel="noreferrer" className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                          <Download className="w-3 h-3 text-indigo-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-indigo-600 text-white text-center">
              <p className="text-[10px] font-black uppercase tracking-widest">Base de Assets para Cocreator Studio</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}