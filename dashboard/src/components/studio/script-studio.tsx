import React, { useState } from 'react';
import { 
  isVideoScript, 
  isCarrosselScript, 
  isBlogScript, 
  normalizeScriptData,
  VideoScript, 
  CarrosselScript, 
  BlogScript 
} from '@/types/content-studio';
import { VideoStudio } from './video-studio';
import { CarrosselStudio } from './carrossel-studio';
import { BlogStudio } from './blog-studio';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ContentPost, Account, PostImage, PostAudio, PostVideoCena, PostVideo } from '@/services/supabase-service';

interface ScriptStudioProps {
  rawJson: string;
  onSave: (updatedJson: string) => void;
  post?: ContentPost | null;
  imagens?: PostImage[];
  audios?: PostAudio[];
  videos_cenas?: PostVideoCena[];
  videos?: PostVideo[];
  accounts?: Account[];
  onPublish?: (id_conta: string) => void;
  onSchedule?: (id_conta: string, date: string) => void;
  onRefresh?: () => void;
}

type ScriptData = VideoScript | CarrosselScript | BlogScript;

export const ScriptStudio: React.FC<ScriptStudioProps> = ({ 
  rawJson, 
  onSave, 
  post,
  imagens = [], 
  audios = [], 
  videos_cenas = [],
  videos = [],
  accounts = [],
  onPublish,
  onSchedule,
  onRefresh
}) => {
  // Debug prop delivery
  console.log('[ScriptStudio] Prop Update:', {
    imgs: imagens.length,
    auds: audios.length,
    cenas: videos_cenas.length,
    final: videos.length,
    postStatus: post?.status
  });
  const [data, setData] = useState<ScriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevRawJson, setPrevRawJson] = useState(rawJson);

  // Sync state with props if rawJson changes from parent
  if (rawJson !== prevRawJson) {
    setPrevRawJson(rawJson);
    try {
      const parsed = normalizeScriptData(JSON.parse(rawJson));
      setData(parsed);
      setError(null);
    } catch (e) {
      console.error('Invalid JSON passed to ScriptStudio:', e);
      setError('O JSON do roteiro está malformado ou corrompido.');
    }
  }

  // Initial initialization if state is empty
  if (data === null && error === null && rawJson) {
    try {
      setData(normalizeScriptData(JSON.parse(rawJson)));
    } catch {
      setError('O JSON do roteiro está malformado ou corrompido.');
    }
  }

  const handleUpdate = (newData: ScriptData) => {
    setData(newData);
    onSave(JSON.stringify(newData, null, 2));
  };

  if (error) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold text-red-900 dark:text-red-400">Erro de Sintaxe JSON</h3>
        <p className="text-red-600 dark:text-red-500 max-w-md">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Tentar Corrigir
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Analisando Estrutura do Roteiro...</p>
      </div>
    );
  }

  // Polymorphic Mounting
  if (isVideoScript(data)) {
    return (
      <VideoStudio 
        data={data as VideoScript} 
        onChange={handleUpdate} 
        post={post}
        imagens={imagens} 
        audios={audios} 
        videos_cenas={videos_cenas}
        videos={videos}
        accounts={accounts}
        onPublish={onPublish}
        onSchedule={onSchedule}
        onRefresh={onRefresh}
      />
    );
  }

  if (isCarrosselScript(data)) {
    return <CarrosselStudio data={data as CarrosselScript} onChange={handleUpdate} imagens={imagens} />;
  }

  if (isBlogScript(data)) {
    return <BlogStudio data={data as BlogScript} onChange={handleUpdate} />;
  }

  // Fallback for generic or unknown scripts
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30">
        <AlertCircle className="w-5 h-5" />
        <p className="text-sm font-medium">Formato de roteiro não reconhecido. Usando editor genérico.</p>
      </div>
      <textarea 
        value={JSON.stringify(data, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            handleUpdate(parsed);
          } catch {
            // Silence error while typing
          }
        }}
        className="w-full h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 font-mono text-xs"
      />
    </div>
  );
};
