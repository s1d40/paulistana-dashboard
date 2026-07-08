'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  X, Image as ImageIcon, Video, FileText, Loader2, 
  Save, 
  Hash, Layout, Smartphone, PenTool, Sparkles,
  Monitor, PlayCircle, Camera, CheckCircle2,
  Globe, Share2, Send, ExternalLink, Download, Copy, Check,
  CalendarDays, Bot, Upload
} from 'lucide-react';
import { fetchPostDetails, duplicatePostAsDraft, PostDetailsPayload, Account, PostImage } from '@/services/supabase-service';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';
import AccountSelector from '@/components/account-selector';
import Link from 'next/link';

interface PostDetailModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'studio' | 'instagram' | 'youtube' | 'publish' | 'schedule';

export default function PostDetailModal({ postId, isOpen, onClose }: PostDetailModalProps) {
  const router = useRouter();
  const [details, setDetails] = useState<PostDetailsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, imageTarget: PostImage) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageId(imageTarget.id_imagem || imageTarget.numero_cena || 'new');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');
      const { url } = await res.json();

      // Atualizar o banco de dados
      if (imageTarget.id_imagem) {
        await supabase.from('imagens').update({ image_url: url }).eq('id_imagem', imageTarget.id_imagem);
      } else {
        await supabase.from('imagens').update({ image_url: url }).eq('id_post', imageTarget.id_post).eq('numero_cena', imageTarget.numero_cena);
      }

      // Atualizar o estado local
      setDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          imagens: prev.imagens.map(img => {
            if (img.id_imagem === imageTarget.id_imagem || (img.numero_cena && img.numero_cena === imageTarget.numero_cena)) {
              return { ...img, image_url: url };
            }
            return img;
          })
        };
      });

    } catch (err) {
      console.error(err);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImageId(null);
    }
  };
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      alert('Por favor, insira um nome para o preset.');
      return;
    }
    setIsSavingPreset(true);
    try {
      const { data: currentPreset, error: fetchErr } = await supabase
        .from('content_presets')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
        
      if (fetchErr) throw fetchErr;
      
      const newConfig = currentPreset?.config || {};
      newConfig.is_draft = false;

      const { error } = await supabase
        .from('content_presets')
        .upsert({
          id: postId,
          name: newPresetName,
          description: newPresetDesc || 'Preset extraído da biblioteca',
          track: currentPreset?.track || 'TikTok / Reels',
          sessions: currentPreset?.sessions || [],
          config: newConfig
        });

      if (error) throw error;
      
      alert('Preset salvo na Biblioteca de Arquitetos com sucesso!');
      setIsSavePresetModalOpen(false);
      setNewPresetName('');
      setNewPresetDesc('');
      
      setDetails(prev => prev ? { ...prev, has_preset: true } : null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar preset. Tem certeza que as configurações de IA estão anexas a este post?');
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Form States
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const handleGenerateScript = async () => {
    if (!details?.post) return;
    setIsGeneratingScript(true);
    try {
      let config = { model: 'gpt-4o', temperature: 0.7, prompt: `Criar roteiro para: ${details.post.tema_post}` };
      let systemMessage = 'Você é um roteirista de alta performance.';
      
      if (details?.has_preset) {
        const { data: preset } = await supabase.from('content_presets').select('*').eq('id', postId).maybeSingle();
        if (preset) {
          if (preset.systemMessage) systemMessage = preset.systemMessage;
          if (preset.config) config = { ...preset.config, prompt: preset.config.prompt || config.prompt };
        }
      }

      const response = await fetch('/api/chat/roteirista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: `Gerar roteiro sobre ${details.post.tema_post}`,
          system_message: systemMessage,
          config
        })
      });

      if (!response.ok) {
        let errorMsg = `Erro na geração de roteiro para ${details.post.tema_post}`;
        try { const errData = await response.json(); if (errData.error) errorMsg = errData.error; } catch(e) {}
        throw new Error(errorMsg);
      }
      const { script } = await response.json();
      
      const roteiroString = JSON.stringify(script);
      const { error } = await supabase.from('posts').update({ roteiro_gerado: roteiroString }).eq('id_post', postId);
      if (error) throw error;
      
      setDetails({ ...details, post: { ...details.post, roteiro_gerado: roteiroString } });
      alert('Roteiro gerado com sucesso!');
    } catch (err: any) {
      alert(`Falha ao gerar roteiro: ${err.message}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Other Form States
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytTags, setYtTags] = useState('');

  const handlePublish = async (platform: string) => {
    if (!selectedAccount) {
      alert('Selecione uma conta primeiro');
      return;
    }
    
    setIsPublishing(platform);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId, 
          accountId: selectedAccount.id_conta,
          platform 
        }),
      });

      if (!res.ok) throw new Error('Falha na publicação');
      alert(`Publicação enviada para ${platform}!`);
    } catch (err) {
      console.error(err);
      alert(`Erro ao publicar no ${platform}`);
    } finally {
      setIsPublishing(null);
    }
  };

  const handleSchedule = async (platform: string) => {
    if (!selectedAccount) {
      alert('Selecione uma conta primeiro');
      return;
    }
    if (!scheduleDate) {
      alert('Selecione uma data e horário primeiro');
      return;
    }

    const confirmSchedule = confirm(`Deseja agendar este post para ${new Date(scheduleDate).toLocaleString()}?`);
    if (!confirmSchedule) return;

    setIsPublishing(platform);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          accountId: selectedAccount.id_conta,
          platform,
          scheduled_for: scheduleDate
        }),
      });

      if (!res.ok) throw new Error('Falha no agendamento');
      alert(`Agendamento enviado para ${platform} com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao agendar');
    } finally {
      setIsPublishing(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !postId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPostDetails(postId);
        setDetails(data);
        
        // Initialize form states
        if (data.post) {
          setCaption(data.post.captions || data.post.roteiro_gerado || '');
          setHashtags(data.post.hashtags || '');
          setYtTitle(data.post.titulo_post || '');
          setScheduleDate(data.post.data_agendamento ? new Date(data.post.data_agendamento).toISOString().slice(0, 16) : '');
        }
      } catch (err) {
        setError('Erro ao carregar detalhes do post');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId, isOpen]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      if (!res.ok) throw new Error('Falha na aprovação');
      alert('Solicitação de aprovação enviada!');
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar post.');
    }
  };

  const handleRender = async (id: string) => {
    try {
      const res = await fetch('/api/content/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      if (!res.ok) throw new Error('Falha no render');
      alert('Renderização iniciada!');
    } catch (err) {
      console.error(err);
      alert('Erro ao iniciar renderização.');
    }
  };

  const handleDuplicateToArchitect = async () => {
    if (!postId) return;

    // Se o post ainda não tem roteiro (está em branco/draft inicial), apenas volte para o chat
    if (!details?.post?.roteiro_gerado || details.post.roteiro_gerado.trim() === '' || details.post.roteiro_gerado === '{}') {
      onClose();
      router.push(`/conteudo/chat?id_post=${postId}`);
      return;
    }

    const proceed = confirm('Deseja criar um novo rascunho em branco para gerar uma nova versão com o Arquiteto? O post atual continuará salvo na sua biblioteca intacto.');
    if (!proceed) return;

    setIsDuplicating(true);
    try {
      const newId = await duplicatePostAsDraft(postId);
      onClose(); // Close the modal
      router.push(`/conteudo/chat?id_post=${newId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar rascunho.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handlePersistChanges = async () => {
    if (!postId || !details?.post) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captions: caption,
          hashtags: hashtags,
          titulo_post: ytTitle,
          data_agendamento: scheduleDate || null,
          status_agendamento: scheduleDate ? 'agendado' : 'nao_agendado'
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar no banco de dados');
      
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao persistir alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Briefing', icon: Layout },
    { id: 'studio', label: 'Estúdio IA', icon: Monitor },
    { id: 'instagram', label: 'Instagram', icon: Camera },
    { id: 'youtube', label: 'Youtube', icon: Video },
    { id: 'schedule', label: 'Agendar', icon: CalendarDays },
    { id: 'publish', label: 'Publicar', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Window */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0c0a09] border border-zinc-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Dusk */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl shadow-lg shadow-orange-500/20">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                Refinar <span className="text-orange-500">Conteúdo</span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Process Engine // ID: {postId?.substring(0, 12)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {details?.post && (
              <div className="flex gap-2 mr-4 border-r border-zinc-800/50 pr-4">
                <button 
                  onClick={() => setIsSavePresetModalOpen(true)}
                  disabled={isDuplicating || isSaving || loading || !details?.has_preset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-amber-500/20 disabled:cursor-not-allowed"
                  title={details?.has_preset ? "Salvar configuração de IA (DNA do Arquiteto) como um Preset reutilizável" : "Este post não possui configurações de IA salvas para serem copiadas"}
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Preset
                </button>
                <button 
                  onClick={handleDuplicateToArchitect}
                  disabled={isDuplicating || isSaving || loading || !details?.has_preset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-indigo-500/20 disabled:cursor-not-allowed"
                  title={details?.has_preset ? "Voltar para o Arquiteto e gerar uma nova versão usando este roteiro como base" : "Este post não possui configurações de IA salvas para serem copiadas"}
                >
                  {isDuplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  Novo Roteiro
                </button>
                <button 
                  onClick={() => handleApprove(postId)}
                  disabled={isDuplicating || isSaving || loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar
                </button>
                <button 
                  onClick={() => handleRender(postId)}
                  disabled={isSaving || loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 border border-indigo-500/20"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Render
                </button>
              </div>
            )}
            <button 
              onClick={handlePersistChanges}
              disabled={isSaving || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
            <button 
              onClick={onClose}
              className="p-3 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Dusk */}
        <div className="flex gap-2 px-10 pt-4 bg-zinc-900/10 border-b border-zinc-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative group",
                activeTab === tab.id
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-orange-500" : "text-zinc-600 group-hover:text-zinc-400")} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Body Dusk */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#0c0a09] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4">
              <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Ecossistema...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-950/20 border border-red-900/50 rounded-3xl text-red-500 text-center">
              <h3 className="font-black uppercase tracking-widest mb-2">Erro de Sincronização</h3>
              <p className="text-sm">{error}</p>
            </div>
          ) : details?.post ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* --- TAB: OVERVIEW (Briefing) --- */}
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/50">Título do Projeto</span>
                        <h3 className="text-3xl font-black text-white leading-tight tracking-tighter uppercase italic">
                          {details.post.titulo_post || details.post.tema_post}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                          {details.post.status || 'PENDENTE'}
                        </span>
                        <span className="px-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                          {details.post.tipo_post || 'INSTAGRAM'}
                        </span>
                      </div>

                      <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] backdrop-blur-sm space-y-4">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <FileText className="w-4 h-4 text-orange-500" /> Roteiro Estratégico
                        </h4>
                        {details.post.roteiro_gerado ? (
                          <p className="text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed italic border-l-2 border-orange-500/30 pl-6 py-2">
                            &quot;{details.post.roteiro_gerado}&quot;
                          </p>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-xl space-y-4">
                            <p className="text-zinc-500 text-sm italic">Nenhum roteiro gerado ainda.</p>
                            <button
                              onClick={handleGenerateScript}
                              disabled={isGeneratingScript || (!details.has_preset && !details.post.tema_post)}
                              className="px-6 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                            >
                              {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                              {isGeneratingScript ? 'Gerando Roteiro...' : 'Gerar Roteiro com IA'}
                            </button>
                            {!details.has_preset && (
                              <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center">
                                Aviso: Post sem preset vinculado. Será usado prompt genérico.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vídeo Preview Geral */}
                    <div className="space-y-6">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <Video className="w-4 h-4 text-rose-500" /> Master Render Preview
                      </h4>
                      {details.videos.length > 0 ? (
                        <div className="space-y-4">
                          <div className="rounded-[2.5rem] overflow-hidden border-8 border-zinc-900 shadow-2xl bg-black aspect-[9/16] relative max-w-[280px] mx-auto group">
                            <video controls className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                              <source src={details.videos[0].video_final_url} type="video/mp4" />
                            </video>
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                              Final Render
                            </div>
                          </div>
                          <a 
                            href={details.videos[0].video_final_url} 
                            download={`video_${postId}.mp4`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full max-w-[280px] mx-auto py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl hover:scale-105 active:scale-95"
                          >
                            <Download className="w-4 h-4 text-orange-500" />
                            Baixar Master MP4
                          </a>
                        </div>
                      ) : (
                        <div className="aspect-[9/16] max-w-[280px] mx-auto bg-zinc-900/50 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group hover:border-orange-500/30 transition-all duration-500">
                          <Video className="w-12 h-12 mb-4 opacity-20 group-hover:text-orange-500 group-hover:opacity-50 transition-all" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Renderização</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Publishing Kit (Captions & Hashtags) */}
                  <div className="space-y-6 pt-10 border-t border-zinc-800/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <Sparkles className="w-4 h-4 text-orange-500" /> Kit de Publicação Rápida
                      </h4>

                      {/* Removido o Agendamento daqui para a aba Agendar */}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl space-y-4 relative group focus-within:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-orange-500 transition-colors">Legenda Final</span>
                          <button 
                            onClick={() => copyToClipboard(caption, 'caption')}
                            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                          >
                            {copiedField === 'caption' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="w-full h-36 bg-transparent border-none text-sm text-zinc-300 leading-relaxed outline-none focus:ring-0 resize-none placeholder:text-zinc-700 custom-scrollbar"
                          placeholder="Digite a legenda personalizada para esta publicação..."
                        />
                      </div>

                      <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl space-y-4 relative group focus-within:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-orange-500 transition-colors">Hashtags Estratégicas</span>
                          <button 
                            onClick={() => copyToClipboard(hashtags, 'hashtags')}
                            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                          >
                            {copiedField === 'hashtags' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <textarea
                          value={hashtags}
                          onChange={(e) => setHashtags(e.target.value)}
                          className="w-full h-36 bg-transparent border-none text-sm text-indigo-400 font-mono tracking-tight outline-none focus:ring-0 resize-none placeholder:text-zinc-700 custom-scrollbar"
                          placeholder="#branding #fitness #lifestyle"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Galeria de Assets */}
                  {details.imagens.length > 0 && (
                    <div className="space-y-6 pt-10 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <ImageIcon className="w-4 h-4 text-emerald-500" /> Image Engine Assets ({details.imagens.length})
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                        {details.imagens.map((img, idx) => {
                          const isUploading = uploadingImageId === (img.id_imagem || img.numero_cena);
                          return (
                          <div key={idx} className="group relative rounded-2xl overflow-hidden bg-zinc-900 aspect-square border border-zinc-800 transition-all hover:border-orange-500/50">
                            <Image 
                              src={img.image_url || img.url_imagem_fundo || ''} 
                              alt={`Asset ${idx}`} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-20">
                               <div className="flex items-center justify-between w-full">
                                 <span className="text-[8px] font-black text-white uppercase tracking-widest">Asset #{idx + 1}</span>
                                 <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-1.5 rounded-md backdrop-blur-md transition-colors" title="Substituir Imagem">
                                   <Upload className="w-3 h-3 text-white" />
                                   <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden" 
                                     onChange={(e) => handleUploadImage(e, img)}
                                     disabled={isUploading}
                                   />
                                 </label>
                               </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB: STUDIO IA (Link Direct) --- */}
              {activeTab === 'studio' && (
                <div className="flex flex-col items-center justify-center py-20 space-y-8 bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] backdrop-blur-sm">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-500/20 relative">
                     <Monitor className="w-10 h-10 text-white" />
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-bounce">
                        <Sparkles className="w-3 h-3 text-orange-500" />
                     </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Laboratório de Edição</h3>
                    <p className="text-zinc-500 text-sm font-medium max-w-sm">
                      Acesse o ambiente completo de manipulação de cenas, assets e cronologia do vídeo.
                    </p>
                  </div>
                  <Link 
                    href={`/conteudo/editor/${postId}`}
                    target="_blank"
                    className="flex items-center gap-3 px-10 py-5 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 group"
                  >
                    Abrir Estúdio Completo
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </div>
              )}

              {/* --- TAB: INSTAGRAM --- */}
              {activeTab === 'instagram' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-4 h-4 text-pink-500" /> Legenda do Post
                        </label>
                        <button 
                          onClick={() => copyToClipboard(caption, 'caption')}
                          className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedField === 'caption' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedField === 'caption' ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <textarea 
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full h-80 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-zinc-300 text-sm focus:border-pink-500/50 outline-none transition-all resize-none leading-relaxed placeholder:text-zinc-700 shadow-inner"
                        placeholder="Escreva a legenda estratégica..."
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Hash className="w-4 h-4 text-pink-500" /> Cluster de Hashtags
                        </label>
                        <button 
                          onClick={() => copyToClipboard(hashtags, 'hashtags')}
                          className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedField === 'hashtags' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedField === 'hashtags' ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <input 
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        className="w-full p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-300 text-sm focus:border-pink-500/50 outline-none transition-all placeholder:text-zinc-700"
                        placeholder="#branding #fitness #lifestyle"
                      />
                    </div>
                  </div>
                  
                  {/* Mock Phone Preview Dusk */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-[300px] h-[600px] bg-[#0c0a09] rounded-[3.5rem] border-[10px] border-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden">
                      <div className="absolute inset-0 bg-zinc-900">
                        {details.videos[0]?.video_final_url ? (
                          <video autoPlay loop muted className="w-full h-full object-cover opacity-60">
                            <source src={details.videos[0].video_final_url} type="video/mp4" />
                          </video>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black text-[10px] uppercase tracking-widest">No Signal</div>
                        )}
                      </div>
                      <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-black/20 to-transparent">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-purple-600 border border-white/20 shadow-xl" />
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white">paulistanaemporio</span>
                             <span className="text-[8px] text-zinc-400">Original Audio</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-200 line-clamp-2 mb-2 leading-relaxed font-medium">
                          {caption || 'Aguardando conteúdo estratégico...'}
                        </p>
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{hashtags}</span>
                      </div>
                    </div>
                    <p className="mt-8 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Live Preview v1.0
                    </p>
                  </div>
                </div>
              )}

              {/* --- TAB: YOUTUBE --- */}
              {activeTab === 'youtube' && (
                <div className="max-w-3xl mx-auto space-y-10 py-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                      <span>YouTube Shorts Title</span>
                      <span className={clsx("text-[10px]", ytTitle.length > 100 ? "text-red-500" : "text-zinc-600")}>
                        {ytTitle.length} / 100
                      </span>
                    </label>
                    <input 
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      maxLength={100}
                      className="w-full p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-xl font-black uppercase italic tracking-tighter focus:border-red-500/50 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                      placeholder="SEO Optimized Headline..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Metadata Description</label>
                      <textarea 
                        value={ytDescription}
                        onChange={(e) => setYtDescription(e.target.value)}
                        className="w-full h-48 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-400 text-sm focus:border-red-500/50 outline-none transition-all resize-none leading-relaxed placeholder:text-zinc-800 shadow-inner"
                        placeholder="Deep metadata indexing..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Semantic Tags</label>
                      <textarea 
                        value={ytTags}
                        onChange={(e) => setYtTags(e.target.value)}
                        className="w-full h-48 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-400 text-sm focus:border-red-500/50 outline-none transition-all resize-none leading-relaxed placeholder:text-zinc-800 shadow-inner"
                        placeholder="Tag clusters for algorithmic reach..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: PUBLISH --- */}
              {activeTab === 'publish' && (
                <div className="max-w-4xl mx-auto space-y-12 py-6">
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                       <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center shadow-xl">
                          <Globe className="w-8 h-8 text-indigo-500" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Hub de Distribuição</h3>
                          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Selecione o destino e dispare o conteúdo</p>
                       </div>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                       <AccountSelector onSelect={(acc) => setSelectedAccount(acc)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {(() => {
                        const hasCaptions = !!details?.post?.captions;
                        const hasHashtags = !!details?.post?.hashtags;
                        const hasVideo = !!details?.videos && details.videos.length > 0 && !!details.videos[0].video_final_url;
                        const isReady = hasCaptions && hasHashtags && hasVideo;
                        return [
                          { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                          { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                          { id: 'youtube', label: 'YouTube', icon: Video, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        ].map((plat) => (
                          <div key={plat.id} className="relative group">
                            <div
                              className={clsx(
                                "w-full flex flex-col items-center p-6 rounded-[2rem] border transition-all relative overflow-hidden",
                                plat.bg, plat.border,
                                isPublishing === plat.id ? "animate-pulse" : (isReady && selectedAccount ? "" : "opacity-40 grayscale")
                              )}
                            >
                              <plat.icon className={clsx("w-8 h-8 mb-4 transition-transform group-hover:scale-110 duration-500", plat.color)} />
                              
                              <div className="flex flex-col gap-2 w-full mt-2">
                                <button
                                  onClick={() => handlePublish(plat.id)}
                                  disabled={!!isPublishing || !isReady || !selectedAccount}
                                  className={clsx("w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md bg-zinc-900/50 hover:bg-zinc-800 disabled:cursor-not-allowed", plat.color)}
                                >
                                  Publicar Agora
                                </button>
                              </div>

                              {isPublishing === plat.id && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                                   <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                              )}
                            </div>

                            {/* Tooltip de Erro/Bloqueio */}
                            {(!isReady || !selectedAccount) && (
                               <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-48 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Requisitos Pendentes:</p>
                                  <div className="space-y-1.5">
                                     {!selectedAccount && <div className="flex items-center gap-2 text-orange-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Selecionar Conta</span></div>}
                                     {!hasCaptions && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Gerar Legenda</span></div>}
                                     {!hasHashtags && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Gerar Hashtags</span></div>}
                                     {!hasVideo && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Finalizar Vídeo</span></div>}
                                  </div>
                               </div>
                            )}
                          </div>
                        ));
                     })()}
                  </div>

                  <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex items-center justify-between backdrop-blur-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                           <Send className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                           <h4 className="text-xs font-black text-white uppercase tracking-widest">Publicação em Massa</h4>
                           <p className="text-[10px] text-zinc-500">Enviar simultaneamente para todas as plataformas configuradas.</p>
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-3">

                       <button 
                          onClick={() => handlePublish('all')}
                          disabled={!selectedAccount || !!isPublishing || !details?.post?.captions || !details?.post?.hashtags || !details?.videos?.[0]?.video_final_url}
                          className="px-6 py-3 bg-zinc-800 hover:bg-white hover:text-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 shadow-xl flex items-center gap-2"
                        >
                          {isPublishing === 'all' && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />}
                          {isPublishing === 'all' ? 'Disparando...' : 'Disparar Broadcast'}
                       </button>
                     </div>
                  </div>
                </div>
              )}

              {/* --- TAB: SCHEDULE --- */}
              {activeTab === 'schedule' && (
                <div className="max-w-4xl mx-auto space-y-12 py-6">
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                       <div className="w-16 h-16 bg-zinc-900 border border-indigo-500/50 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/20">
                          <CalendarDays className="w-8 h-8 text-indigo-500" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Central de Agendamento</h3>
                          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Defina a data e programe seus posts</p>
                       </div>
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-6">
                       <div className="p-6 bg-zinc-900/50 border border-indigo-500/30 rounded-[2rem] flex flex-col items-center gap-4">
                         <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Data e Hora do Post</span>
                         <input 
                           type="datetime-local" 
                           value={scheduleDate}
                           onChange={(e) => setScheduleDate(e.target.value)}
                           className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer text-center"
                         />
                       </div>
                       <AccountSelector onSelect={(acc) => setSelectedAccount(acc)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {(() => {
                        const hasCaptions = !!details?.post?.captions;
                        const hasHashtags = !!details?.post?.hashtags;
                        const hasVideo = !!details?.videos && details.videos.length > 0 && !!details.videos[0].video_final_url;
                        const isReady = hasCaptions && hasHashtags && hasVideo && scheduleDate;
                        return [
                          { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                          { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                          { id: 'youtube', label: 'YouTube', icon: Video, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        ].map((plat) => (
                          <div key={plat.id} className="relative group">
                            <div
                              className={clsx(
                                "w-full flex flex-col items-center p-6 rounded-[2rem] border transition-all relative overflow-hidden",
                                plat.bg, plat.border,
                                isPublishing === plat.id ? "animate-pulse" : (isReady && selectedAccount ? "" : "opacity-40 grayscale")
                              )}
                            >
                              <plat.icon className={clsx("w-8 h-8 mb-4 transition-transform group-hover:scale-110 duration-500", plat.color)} />
                              
                              <div className="flex flex-col gap-2 w-full mt-2">
                                <button
                                  onClick={() => handleSchedule(plat.id)}
                                  disabled={!!isPublishing || !isReady || !selectedAccount}
                                  className={clsx("w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md bg-zinc-900/50 hover:bg-zinc-800 disabled:cursor-not-allowed", plat.color)}
                                >
                                  Agendar
                                </button>
                              </div>

                              {isPublishing === plat.id && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                                   <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                              )}
                            </div>

                            {/* Tooltip de Erro/Bloqueio */}
                            {(!isReady || !selectedAccount) && (
                               <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-48 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Requisitos Pendentes:</p>
                                  <div className="space-y-1.5">
                                     {!scheduleDate && <div className="flex items-center gap-2 text-indigo-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Definir Data</span></div>}
                                     {!selectedAccount && <div className="flex items-center gap-2 text-orange-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Selecionar Conta</span></div>}
                                     {!hasCaptions && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Gerar Legenda</span></div>}
                                     {!hasHashtags && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Gerar Hashtags</span></div>}
                                     {!hasVideo && <div className="flex items-center gap-2 text-red-500"><div className="w-1 h-1 bg-current rounded-full" /><span className="text-[8px] font-bold">Finalizar Vídeo</span></div>}
                                  </div>
                               </div>
                            )}
                          </div>
                        ));
                     })()}
                  </div>

                  <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex items-center justify-between backdrop-blur-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                           <CalendarDays className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                           <h4 className="text-xs font-black text-white uppercase tracking-widest">Agendamento em Massa</h4>
                           <p className="text-[10px] text-zinc-500">Programar simultaneamente para todas as plataformas.</p>
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-3">
                       <button 
                          onClick={() => handleSchedule('all')}
                          disabled={!selectedAccount || !!isPublishing || !details?.post?.captions || !details?.post?.hashtags || !details?.videos?.[0]?.video_final_url || !scheduleDate}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 shadow-xl flex items-center gap-2"
                        >
                          {isPublishing === 'all' && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                          Agendar Broadcast
                       </button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center text-zinc-500">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase tracking-widest text-[10px]">Iniciando Protocolos de Dados...</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Preset Modal */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSavePresetModalOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-amber-500" />
                Salvar como Preset
              </h3>
              <button onClick={() => setIsSavePresetModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-400">
                Isso salvará o DNA do Arquiteto (prompt, modelo e sessões de pesquisa) utilizado neste post como um modelo reutilizável na sua Biblioteca de Arquitetos.
              </p>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome do Preset</label>
                <input 
                  type="text" 
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="Ex: Roteiro Viral para Perfumes..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Descrição (Opcional)</label>
                <textarea 
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  placeholder="Descrição breve do que este preset faz..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-zinc-800 bg-zinc-950/30 flex justify-end gap-3">
              <button 
                onClick={() => setIsSavePresetModalOpen(false)}
                disabled={isSavingPreset}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePreset}
                disabled={isSavingPreset || !newPresetName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSavingPreset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Preset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
