import React, { useState, useEffect, useRef } from 'react';
import { VideoScript, VideoScene } from '@/types/content-studio';
import { 
  Sparkles, Settings2, 
  Image as ImageIcon, Film, Music, Clock,
  Play, Pause, Volume2, VolumeX, RefreshCw, Send, AlertTriangle, CheckCircle2,
  Camera, Video, Globe, Database, Plus, ChevronLeft, ChevronRight, Maximize,
  Trash2
} from 'lucide-react';
import { useProductionQueue, resolveReferenceUrls } from '@/store/production-queue';
import { PostImage, PostAudio, PostVideoCena, PostVideo, ContentPost, Account, Product, fetchProducts } from '@/services/supabase-service';
import { useParams } from 'next/navigation';
import { StudioCopilot } from './studio-copilot';
import clsx from 'clsx';
import Image from 'next/image';
import { IMAGE_MODELS, modelIdToUrl, urlToModelId } from '@/lib/image-models';
import { supabase } from '@/lib/supabase';
import MultiProductSelector from '@/components/multi-product-selector';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface VideoStudioProps {
  data: VideoScript;
  onChange: (newData: VideoScript) => void;
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

const ANIMATION_OPTIONS = [
  { id: 'zoom_in', label: 'Zoom In' },
  { id: 'zoom_out', label: 'Zoom Out' },
  { id: 'pan_left', label: 'Pan Left' },
  { id: 'pan_right', label: 'Pan Right' },
  { id: 'static', label: 'Estático' }
];

// Modelos disponíveis agora vêm do arquivo centralizado
const AVAILABLE_MODELS = IMAGE_MODELS.map(m => ({
  label: m.label,
  url: modelIdToUrl(m.id),
}));

export const VideoStudio: React.FC<VideoStudioProps> = ({ 
  data, 
  onChange, 
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
  const { id: postId } = useParams();
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  
  const { 
    progress, 
    generateSceneAssets, 
    generateSceneImage,
    generateSceneAudio, 
    renderScene,
    compileFinalVideo,
    isProcessing 
  } = useProductionQueue();

  const currentScene = data.cenas[selectedSceneIdx];

  // Initialize Replicate config and Voice Settings if missing
  useEffect(() => {
    let changed = false;
    const updatedData = { ...data };

    const newCenas = data.cenas.map(scene => {
      let modified = false;
      const updatedScene = { ...scene };
      
      if (!updatedScene.id_cena) {
        updatedScene.id_cena = crypto.randomUUID();
        modified = true;
      }

      if (!updatedScene.replicate) {
        // Usa formato_video do roteiro para definir aspect_ratio
        const isLandscape = data.formato_video === 'landscape' || !data.formato_video;
        updatedScene.replicate = {
          model_url: AVAILABLE_MODELS[0].url,
          input: {
            prompt: updatedScene.prompt_visual,
            negative_prompt: updatedScene.prompt_negativo,
            aspect_ratio: isLandscape ? '16:9' as const : '9:16' as const,
            output_format: 'jpg' as const
          }
        };
        modified = true;
      }

      if (modified) changed = true;
      return updatedScene;
    });

    if (changed) {
      updatedData.cenas = newCenas;
    }

    const defaultVoice = {
      model_id: "eleven_multilingual_v2",
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: true,
      speed: 1.10
    };

    if (!data.voice_settings || Object.keys(data.voice_settings).length < Object.keys(defaultVoice).length) {
      changed = true;
      updatedData.voice_settings = {
        ...defaultVoice,
        ...(data.voice_settings || {})
      };
    }

    if (changed) {
      onChange(updatedData);
    }
  }, [data, onChange]);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
    };
    loadProducts();
  }, []);

  // Asset Helpers
  const getSceneImage = (numero: number) => {
    const matches = imagens.filter(img => Number(img.numero_cena || (img as unknown as { numero: string | number }).numero) === Number(numero));
    return matches.length > 0 ? matches[0] : undefined;
  };
  
  const getSceneAudio = (cena: VideoScene) => {
    // Tenta primeiro pelo id_cena (mais seguro contra reindexação)
    if (cena.id_cena) {
      const byId = audios.find(aud => aud.id_cena === cena.id_cena);
      if (byId) return byId;
    }
    // Fallback para numero_cena (assets antigos sem id_cena)
    const matches = audios.filter(aud => Number(aud.numero_cena || (aud as unknown as { numero: string | number }).numero) === Number(cena.numero));
    return matches.length > 0 ? matches[0] : undefined;
  };

  const getSceneVideo = (cena: VideoScene) => {
    // Tenta primeiro pelo id_cena
    if (cena.id_cena) {
      const byId = videos_cenas.find(vid => vid.id_cena === cena.id_cena);
      if (byId) return byId;
    }
    // Fallback para numero_cena
    const matches = videos_cenas.filter(vid => Number(vid.numero_cena) === Number(cena.numero));
    return matches.length > 0 ? matches[0] : undefined;
  };

  const handleDeleteSceneAssets = async () => {
    if (!postId || !currentScene) return;
    const confirmDelete = confirm(
      `⚠️ Tem certeza que deseja deletar todos os assets da Cena ${currentScene.numero}? \n\n` +
      `Isso irá excluir permanentemente do banco de dados:\n` +
      `- A Imagem gerada\n` +
      `- O Áudio gerado\n` +
      `- O Fragmento de Vídeo renderizado\n` +
      `- O Vídeo Final Compilado (que precisará ser gerado de novo)\n\n` +
      `Isso permitirá que você gere novos assets do zero para esta cena.`
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete image
      const { error: imgError } = await supabase
        .from('imagens')
        .delete()
        .eq('id_post', postId)
        .eq('numero_cena', currentScene.numero);
        
      if (imgError) console.error('Error deleting image:', imgError);

      // 2. Delete audio
      const { error: audError } = await supabase
        .from('audios')
        .delete()
        .eq('id_post', postId)
        .eq('numero_cena', currentScene.numero);
        
      if (audError) console.error('Error deleting audio:', audError);

      // 3. Delete video fragment
      const { error: vidCenaError } = await supabase
        .from('videos_cenas')
        .delete()
        .eq('id_post', postId)
        .eq('numero_cena', currentScene.numero);
        
      if (vidCenaError) console.error('Error deleting video cena:', vidCenaError);

      // 4. Delete final compiled video
      const { error: vidError } = await supabase
        .from('videos')
        .delete()
        .eq('id_post', postId);
        
      if (vidError) console.error('Error deleting final video:', vidError);

      // Reset preview mode
      setPreviewMode('scene');

      // Refresh parent assets
      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error('Error in handleDeleteSceneAssets:', err);
      alert('Ocorreu um erro ao excluir os assets.');
    }
  };

  const handleDeleteScene = async (idxToDelete: number) => {
    if (!postId || !data.cenas) return;
    
    if (data.cenas.length <= 1) {
      alert("Você não pode deletar todas as cenas. O vídeo precisa ter pelo menos uma cena!");
      return;
    }

    const sceneToDelete = data.cenas[idxToDelete];
    const sceneNum = sceneToDelete.numero;

    const confirmDelete = confirm(
      `⚠️ Tem certeza que deseja excluir completamente a Cena ${sceneNum}? \n\n` +
      `Isso irá remover permanentemente do roteiro e do banco de dados:\n` +
      `- A Imagem gerada desta cena\n` +
      `- O Áudio gerado desta cena\n` +
      `- O Fragmento de Vídeo renderizado desta cena\n` +
      `- O Vídeo Final Compilado (que precisará ser gerado de novo)\n\n` +
      `Todas as cenas subsequentes serão automaticamente reindexadas e renumeradas para trás.`
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete assets of the target scene
      await supabase.from('imagens').delete().eq('id_post', postId).eq('numero_cena', sceneNum);
      await supabase.from('audios').delete().eq('id_post', postId).eq('numero_cena', sceneNum);
      await supabase.from('videos_cenas').delete().eq('id_post', postId).eq('numero_cena', sceneNum);
      await supabase.from('videos').delete().eq('id_post', postId); // Invalidate final video

      // 2. Shift subsequent assets in ascending order
      for (let currentNum = sceneNum + 1; currentNum <= data.cenas.length; currentNum++) {
        const targetNum = currentNum - 1;

        await supabase
          .from('imagens')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);

        await supabase
          .from('audios')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);

        await supabase
          .from('videos_cenas')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);
      }

      // 3. Update local state and reindex
      const newCenas = data.cenas.filter((_, i) => i !== idxToDelete);
      const reindexed = reindexScenes(newCenas);

      let nextSelectedIdx = selectedSceneIdx;
      if (selectedSceneIdx >= reindexed.length) {
        nextSelectedIdx = reindexed.length - 1;
      } else if (selectedSceneIdx === idxToDelete && idxToDelete > 0) {
        nextSelectedIdx = idxToDelete - 1;
      }
      setSelectedSceneIdx(nextSelectedIdx);

      const updatedScript = { ...data, cenas: reindexed };

      // Update Supabase IMMEDIATELY with the new script to prevent desync
      const { error: saveErr } = await supabase
        .from('posts')
        .update({ roteiro_gerado: JSON.stringify(updatedScript, null, 2) })
        .eq('id_post', postId);
      
      if (saveErr) {
        console.error('Error saving updated script to DB:', saveErr);
        throw saveErr;
      }

      onChange(updatedScript);
      setPreviewMode('scene');

      // Refresh parent assets
      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error('Error in handleDeleteScene:', err);
      alert('Ocorreu um erro ao excluir a cena e reorganizar os assets.');
    }
  };


  const currentImage = getSceneImage(currentScene?.numero);
  const currentAudio = currentScene ? getSceneAudio(currentScene) : undefined;
  const currentVideo = currentScene ? getSceneVideo(currentScene) : undefined;

  // Smart Outdated Asset Detection
  const isAudioOutdated = !!(currentAudio && currentScene && currentScene.texto_narrado !== currentAudio.texto_narrado);
  const isImageOutdated = !!(currentImage && currentScene && currentScene.prompt_visual !== currentImage.prompt_utilizado);

  // Check if any scene in the entire script is outdated compared to generated assets
  const isAnySceneOutdated = data.cenas.some((cena) => {
    const aud = getSceneAudio(cena);
    const img = getSceneImage(cena.numero);
    const audOutdated = !!(aud && cena.texto_narrado !== aud.texto_narrado);
    const imgOutdated = !!(img && cena.prompt_visual !== img.prompt_utilizado);
    return audOutdated || imgOutdated;
  });

  const [smartRecreateTarget, setSmartRecreateTarget] = useState<{
    sceneNumero: number;
    waitAudio: boolean;
    waitImage: boolean;
    isRendering: boolean;
  } | null>(null);

  const isSmartRecreating = !!smartRecreateTarget;

  // Auto-render effect for smart recreate
  useEffect(() => {
    if (!smartRecreateTarget || !postId) return;

    const { sceneNumero, waitAudio, waitImage, isRendering } = smartRecreateTarget;
    const targetScene = data.cenas.find(c => c.numero === sceneNumero);
    if (!targetScene) {
      setTimeout(() => setSmartRecreateTarget(null), 0);
      return;
    }

    if (isRendering) {
      const sceneVideo = getSceneVideo(targetScene);
      if (sceneVideo) {
        console.log('[SmartRecreate] Scene video generated successfully! Resetting state.');
        setTimeout(() => setSmartRecreateTarget(null), 0);
      }
      return;
    }

    let audioReady = !waitAudio;
    let imageReady = !waitImage;
    let readyAudio = waitAudio ? undefined : getSceneAudio(targetScene);
    let readyImage = waitImage ? undefined : getSceneImage(sceneNumero);

    if (waitAudio) {
      const match = getSceneAudio(targetScene);
      if (match && match.texto_narrado === targetScene.texto_narrado && match.audio_url) {
        audioReady = true;
        readyAudio = match;
      }
    }

    if (waitImage) {
      const match = getSceneImage(sceneNumero);
      if (match && match.prompt_utilizado === targetScene.prompt_visual && (match.image_url || match.url_imagem_fundo)) {
        imageReady = true;
        readyImage = match;
      }
    }

    if (audioReady && imageReady && readyAudio && readyImage) {
      console.log('[SmartRecreate] All assets ready! Triggering scene render...');
      
      setSmartRecreateTarget(prev => prev ? { ...prev, isRendering: true } : null);

      const refUrl = resolveReferenceUrls(
        targetScene.usa_referencia,
        targetScene.slug_produto,
        targetScene.tipo_referencia
      );

      renderScene(postId as string, targetScene, {
        image_url: readyImage.image_url || readyImage.url_imagem_fundo || '',
        audio_url: readyAudio.audio_url || '',
        timestamps_url: readyAudio.timestamps || '',
        animacao: targetScene.animacao || 'zoom_in',
        image_reference_url: refUrl
      });
    }
  }, [imagens, audios, videos_cenas, smartRecreateTarget, data.cenas, postId, renderScene]);

  const handleSmartRecreate = async () => {
    if (!postId || !currentScene || isProcessing || isSmartRecreating) return;

    const waitAudio = isAudioOutdated;
    const waitImage = isImageOutdated;

    setSmartRecreateTarget({
      sceneNumero: currentScene.numero,
      waitAudio,
      waitImage,
      isRendering: false
    });

    try {
      invalidateFinalVideo();

      // Delete existing video fragment for this scene from Supabase
      const { error: vidCenaError } = await supabase
        .from('videos_cenas')
        .delete()
        .eq('id_post', postId)
        .eq('numero_cena', currentScene.numero);
      if (vidCenaError) console.error('[SmartRecreate] Error deleting old video cena:', vidCenaError);

      if (waitAudio) {
        const { error: audError } = await supabase
          .from('audios')
          .delete()
          .eq('id_post', postId)
          .eq('numero_cena', currentScene.numero);
        if (audError) console.error('[SmartRecreate] Error deleting old audio:', audError);
      }

      if (waitImage) {
        const { error: imgError } = await supabase
          .from('imagens')
          .delete()
          .eq('id_post', postId)
          .eq('numero_cena', currentScene.numero);
        if (imgError) console.error('[SmartRecreate] Error deleting old image:', imgError);
      }

      if (waitAudio) {
        generateSceneAudio(postId as string, currentScene, data.voice_settings);
      }

      if (waitImage) {
        const refUrl = resolveReferenceUrls(
          currentScene.usa_referencia,
          currentScene.slug_produto,
          currentScene.tipo_referencia
        );
        generateSceneImage(postId as string, currentScene, refUrl);
      }

      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error('[SmartRecreate] Failed to initiate smart recreate:', err);
      alert('Erro ao iniciar a regeração dos assets.');
      setTimeout(() => setSmartRecreateTarget(null), 0);
    }
  };

  // Validation
  const allScenesRendered = data.cenas.every(c => getSceneVideo(c));
  const renderedCount = data.cenas.filter(c => getSceneVideo(c)).length;

  const finalVideo = videos && videos.length > 0 
    ? [...videos].sort((a, b) => new Date(b.data_compilacao || 0).getTime() - new Date(a.data_compilacao || 0).getTime())[0] 
    : null;
  const [previewMode, setPreviewMode] = useState<'scene' | 'final'>(finalVideo ? 'final' : 'scene');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);

  // Auto-delete compiled final video from database when script changes
  const invalidateFinalVideo = () => {
    setPreviewMode('scene');
    if (finalVideo && postId) {
      supabase
        .from('videos')
        .delete()
        .eq('id_post', postId)
        .then(({ error }) => {
          if (error) console.error('Error auto-deleting outdated final video:', error);
        });
    }
  };

  // Helper to ensure scenes are always numbered 1, 2, 3... and have a valid UUID id_cena
  const reindexScenes = (cenas: VideoScene[]) => {
    const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    
    return cenas.map((c, i) => ({ 
      ...c, 
      numero: i + 1,
      id_cena: (c.id_cena && isValidUUID(c.id_cena)) ? c.id_cena : crypto.randomUUID()
    }));
  };

  const insertScene = async (indexToInsertAt: number) => {
    if (!postId) return;
    const sceneNum = indexToInsertAt + 1;

    const newScene: VideoScene = {
      id_cena: crypto.randomUUID(),
      numero: sceneNum,
      texto_narrado: '',
      prompt_visual: '',
      prompt_negativo: '',
      animacao: 'zoom_in',
      modelo_ia: 'Nano Banana',
      usa_referencia: false,
      tipo_referencia: null,
      slug_produto: null
    };

    try {
      invalidateFinalVideo();

      // Shift subsequent assets forward in descending order to avoid conflicts in Supabase
      for (let currentNum = data.cenas.length; currentNum >= sceneNum; currentNum--) {
        const targetNum = currentNum + 1;

        await supabase
          .from('imagens')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);

        await supabase
          .from('audios')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);

        await supabase
          .from('videos_cenas')
          .update({ numero_cena: targetNum })
          .eq('id_post', postId)
          .eq('numero_cena', currentNum);
      }

      const newCenas = [...data.cenas];
      newCenas.splice(indexToInsertAt, 0, newScene);
      const reindexed = reindexScenes(newCenas);
      const updatedScript = { ...data, cenas: reindexed };

      // Persist new script to Supabase immediately to avoid desync
      const { error: saveErr } = await supabase
        .from('posts')
        .update({ roteiro_gerado: JSON.stringify(updatedScript, null, 2) })
        .eq('id_post', postId);
      
      if (saveErr) console.error('[InsertScene] Error saving updated script:', saveErr);

      onChange(updatedScript);
      setSelectedSceneIdx(indexToInsertAt);

    } catch (err) {
      console.error('[InsertScene] Error:', err);
    }
  };

  const moveScene = async (currentIndex: number, direction: 'left' | 'right') => {
    if (!postId) return;
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= data.cenas.length) return;

    const numA = currentIndex + 1;
    const numB = newIndex + 1;

    try {
      invalidateFinalVideo();

      // Swap the assets of numA and numB in Supabase using temporary 999
      // Step 1: Move numA assets to 999
      await supabase.from('imagens').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numA);
      await supabase.from('audios').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numA);
      await supabase.from('videos_cenas').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numA);

      // Step 2: Move numB assets to numA
      await supabase.from('imagens').update({ numero_cena: numA }).eq('id_post', postId).eq('numero_cena', numB);
      await supabase.from('audios').update({ numero_cena: numA }).eq('id_post', postId).eq('numero_cena', numB);
      await supabase.from('videos_cenas').update({ numero_cena: numA }).eq('id_post', postId).eq('numero_cena', numB);

      // Step 3: Move 999 assets to numB
      await supabase.from('imagens').update({ numero_cena: numB }).eq('id_post', postId).eq('numero_cena', 999);
      await supabase.from('audios').update({ numero_cena: numB }).eq('id_post', postId).eq('numero_cena', 999);
      await supabase.from('videos_cenas').update({ numero_cena: numB }).eq('id_post', postId).eq('numero_cena', 999);

      const newCenas = [...data.cenas];
      const temp = newCenas[currentIndex];
      newCenas[currentIndex] = newCenas[newIndex];
      newCenas[newIndex] = temp;

      const reindexed = reindexScenes(newCenas);
      const updatedScript = { ...data, cenas: reindexed };

      // Persist swapped script to Supabase immediately to avoid desync
      const { error: saveErr } = await supabase
        .from('posts')
        .update({ roteiro_gerado: JSON.stringify(updatedScript, null, 2) })
        .eq('id_post', postId);
      
      if (saveErr) console.error('[MoveScene] Error saving updated script:', saveErr);

      onChange(updatedScript);
      if (selectedSceneIdx === currentIndex) setSelectedSceneIdx(newIndex);
      else if (selectedSceneIdx === newIndex) setSelectedSceneIdx(currentIndex);

    } catch (err) {
      console.error('[MoveScene] Error:', err);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    if (!postId) return;

    const numSource = sourceIndex + 1;
    const numDest = destinationIndex + 1;

    try {
      invalidateFinalVideo();

      // Step 1: Move source assets to temp 999
      await supabase.from('imagens').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numSource);
      await supabase.from('audios').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numSource);
      await supabase.from('videos_cenas').update({ numero_cena: 999 }).eq('id_post', postId).eq('numero_cena', numSource);

      // Step 2: Shift items
      if (sourceIndex < destinationIndex) {
        // Moving right: items between shift left
        for (let currentNum = numSource + 1; currentNum <= numDest; currentNum++) {
          const targetNum = currentNum - 1;
          await supabase.from('imagens').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
          await supabase.from('audios').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
          await supabase.from('videos_cenas').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
        }
      } else {
        // Moving left: items between shift right
        for (let currentNum = numSource - 1; currentNum >= numDest; currentNum--) {
          const targetNum = currentNum + 1;
          await supabase.from('imagens').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
          await supabase.from('audios').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
          await supabase.from('videos_cenas').update({ numero_cena: targetNum }).eq('id_post', postId).eq('numero_cena', currentNum);
        }
      }

      // Step 3: Move 999 assets to destination
      await supabase.from('imagens').update({ numero_cena: numDest }).eq('id_post', postId).eq('numero_cena', 999);
      await supabase.from('audios').update({ numero_cena: numDest }).eq('id_post', postId).eq('numero_cena', 999);
      await supabase.from('videos_cenas').update({ numero_cena: numDest }).eq('id_post', postId).eq('numero_cena', 999);

      // Update script
      const newCenas = Array.from(data.cenas);
      const [movedScene] = newCenas.splice(sourceIndex, 1);
      newCenas.splice(destinationIndex, 0, movedScene);

      const reindexed = reindexScenes(newCenas);
      const updatedScript = { ...data, cenas: reindexed };

      const { error: saveErr } = await supabase
        .from('posts')
        .update({ roteiro_gerado: JSON.stringify(updatedScript, null, 2) })
        .eq('id_post', postId);
      
      if (saveErr) console.error('[DragEnd] Error saving updated script:', saveErr);

      onChange(updatedScript);
      
      // Update selected scene to follow it
      if (selectedSceneIdx === sourceIndex) setSelectedSceneIdx(destinationIndex);
      else if (selectedSceneIdx > sourceIndex && selectedSceneIdx <= destinationIndex) setSelectedSceneIdx(selectedSceneIdx - 1);
      else if (selectedSceneIdx < sourceIndex && selectedSceneIdx >= destinationIndex) setSelectedSceneIdx(selectedSceneIdx + 1);

    } catch (err) {
      console.error('[DragEnd] Error:', err);
    }
  };

  const togglePlay = () => {
    if (mainVideoRef.current) {
      if (isPlaying) mainVideoRef.current.pause();
      else mainVideoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const updateScene = (idx: number, updates: Partial<VideoScene>) => {
    const newCenas = [...data.cenas];
    
    // Auto-sync prompt to replicate config if prompt_visual is updated
    if (updates.prompt_visual && newCenas[idx].replicate) {
      updates.replicate = {
        ...newCenas[idx].replicate!,
        input: {
          ...newCenas[idx].replicate!.input,
          prompt: updates.prompt_visual
        }
      };
    }

    newCenas[idx] = { ...newCenas[idx], ...updates };
    onChange({ ...data, cenas: newCenas });
    invalidateFinalVideo();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none overflow-hidden">
      
      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* 1. CINEMATIC PREVIEW (Left - Dominant) */}
        <div className="flex-[1.5] flex flex-col bg-black relative border-r border-zinc-900 min-h-0">
          
          {/* Header do Player */}
          <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/50 shrink-0">
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-black/60 border border-zinc-800 text-white text-[10px] font-black rounded uppercase tracking-widest shadow-xl">
                Cena {currentScene?.numero}
              </div>
              {currentVideo && (
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black rounded uppercase flex items-center gap-1.5 shadow-lg">
                  <CheckCircle2 className="w-3 h-3" /> Render OK
                </div>
              )}
            </div>

            {finalVideo && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <div className="flex bg-zinc-900/90 border border-zinc-800 rounded-full p-1 shadow-inner">
                  <button 
                    onClick={() => setPreviewMode('scene')}
                    className={clsx(
                      "px-6 py-1 text-[9px] font-black uppercase rounded-full transition-all", 
                      previewMode === 'scene' ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    Visualização de Cena
                  </button>
                  <button 
                    onClick={() => setPreviewMode('final')}
                    className={clsx(
                      "px-6 py-1 text-[9px] font-black uppercase rounded-full transition-all flex items-center gap-1.5", 
                      previewMode === 'final' ? "bg-emerald-600 text-white shadow" : "text-zinc-500 hover:text-white"
                    )}
                    title={isAnySceneOutdated ? "Atenção: O Roteiro foi modificado. Compile um novo Master Final." : undefined}
                  >
                    Master Final
                    {isAnySceneOutdated && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>
                
                <button
                  onClick={async () => {
                    const proceed = confirm("⚠️ Tem certeza que deseja deletar o Vídeo Master Final compilado? Isso não afetará as cenas individuais.");
                    if (!proceed) return;
                    try {
                      const { error } = await supabase.from('videos').delete().eq('id_post', postId);
                      if (error) console.error('Error deleting final video:', error);
                      else {
                        setPreviewMode('scene');
                        if (onRefresh) onRefresh();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30 text-zinc-500 rounded-full transition-all shadow-md"
                  title="Deletar Vídeo Master Final"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-4 lg:p-6 relative overflow-hidden bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]">
            
            <div className="aspect-[9/16] h-full max-h-[85vh] bg-zinc-900/50 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative border border-zinc-800 group flex flex-col items-center justify-center">
              
              {/* Player Area */}
              <div className="relative w-full h-full bg-zinc-950">
                {previewMode === 'final' && finalVideo ? (
                  <video 
                    ref={mainVideoRef}
                    src={finalVideo.video_final_url ? `${finalVideo.video_final_url}?t=${new Date(finalVideo.data_compilacao || 0).getTime()}` : undefined} 
                    autoPlay 
                    controls
                    className="w-full h-full object-cover" 
                    onTimeUpdate={(e) => setVideoProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : currentVideo?.video_url ? (
                  <video 
                    ref={mainVideoRef}
                    src={currentVideo.video_url ? `${currentVideo.video_url}?t=${new Date(currentVideo.data_geracao || 0).getTime()}` : undefined} 
                    autoPlay 
                    controls
                    className="w-full h-full object-cover"
                    onTimeUpdate={(e) => setVideoProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : currentImage?.image_url ? (
                  <div className="w-full h-full relative flex flex-col items-center justify-between">
                    <Image src={currentImage.image_url} alt="Preview" fill unoptimized className="object-cover" />
                    {currentAudio?.audio_url && (
                      <div className="absolute bottom-4 left-4 right-4 z-40 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider text-center">Áudio da Cena</span>
                        <audio 
                          ref={mainVideoRef as any}
                          id="preview-audio" 
                          src={currentAudio.audio_url} 
                          controls
                          className="w-full" 
                          onTimeUpdate={(e) => setVideoProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 p-12 text-center bg-zinc-950">
                    <Film className="w-12 h-12 text-zinc-800 animate-pulse" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Aguardando Produção</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 2. PRODUCTION CONTROL (Right) */}
        <div className="flex-[1] flex flex-col bg-zinc-900/40 backdrop-blur-md overflow-y-auto custom-scrollbar border-l border-zinc-900 min-w-[350px]">
          
          {/* Action Hub */}
          <div className="p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Controle de Cena</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={clsx(
                    "p-2.5 rounded-xl border transition-all",
                    showAdvanced ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white"
                  )}
                  title="Configurações Avançadas"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    const refUrl = resolveReferenceUrls(
                      currentScene.usa_referencia,
                      currentScene.slug_produto,
                      currentScene.tipo_referencia
                    );
                    invalidateFinalVideo();
                    generateSceneAssets(postId as string, currentScene, data.voice_settings, refUrl);
                  }}
                  disabled={isProcessing}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
                  title="Gerar Assets (Imagem/Áudio)"
                >
                  <Sparkles className={clsx("w-4 h-4", isProcessing && "animate-spin")} />
                </button>
                <button 
                  onClick={() => {
                    if (!currentImage || !currentAudio) return alert("Gere os assets primeiro!");
                    
                    const refUrl = resolveReferenceUrls(
                      currentScene.usa_referencia,
                      currentScene.slug_produto,
                      currentScene.tipo_referencia
                    );

                    invalidateFinalVideo();
                    renderScene(postId as string, currentScene, {
                      image_url: currentImage.image_url || currentImage.url_imagem_fundo || '',
                      audio_url: currentAudio.audio_url || '',
                      timestamps_url: currentAudio.timestamps || '',
                      animacao: currentScene.animacao || 'zoom_in',
                      image_reference_url: refUrl
                    });
                  }}
                  disabled={isProcessing || !currentImage}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
                  title="Renderizar Cena"
                >
                  <Film className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeleteSceneAssets}
                  disabled={isProcessing}
                  className="p-2.5 bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/30 text-zinc-500 rounded-xl border border-zinc-700 transition-all disabled:opacity-50"
                  title="Deletar Assets desta Cena (Refazer)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteScene(selectedSceneIdx)}
                  disabled={isProcessing}
                  className="p-2.5 bg-red-950/20 hover:bg-red-900/40 text-red-500 rounded-xl border border-red-900/50 hover:border-red-500 transition-all disabled:opacity-50 animate-pulse hover:animate-none"
                  title="Excluir esta Cena Completamente"
                >
                  <Trash2 className="w-4 h-4 fill-red-500/20" />
                </button>

              </div>
            </div>

            {showAdvanced && (
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Modelo de Imagem</span>
                  </div>
                  <select 
                    value={currentScene.replicate?.model_url || AVAILABLE_MODELS[0].url}
                    onChange={(e) => updateScene(selectedSceneIdx, {
                      replicate: { ...currentScene.replicate!, model_url: e.target.value }
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-bold text-zinc-400 outline-none appearance-none"
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.url} value={m.url}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-indigo-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voz (ElevenLabs)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Estabilidade</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={data.voice_settings?.stability || 0.7} 
                        onChange={(e) => {
                          onChange({...data, voice_settings: {...data.voice_settings!, stability: parseFloat(e.target.value)}});
                          invalidateFinalVideo();
                        }} 
                        className="w-full accent-indigo-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-500">Clareza</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={data.voice_settings?.similarity_boost || 0.75} 
                        onChange={(e) => {
                          onChange({...data, voice_settings: {...data.voice_settings!, similarity_boost: parseFloat(e.target.value)}});
                          invalidateFinalVideo();
                        }} 
                        className="w-full accent-indigo-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Final Production Card */}
            <div className={clsx(
              "p-6 rounded-3xl border-2 transition-all duration-500 shadow-2xl overflow-hidden relative group",
              allScenesRendered 
                ? "bg-emerald-600/10 border-emerald-500/30" 
                : "bg-zinc-900/50 border-zinc-800"
            )}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      allScenesRendered ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {allScenesRendered ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Produção Final</h3>
                      <p className="text-[9px] font-bold text-zinc-500">{renderedCount} de {data.cenas.length} cenas prontas</p>
                    </div>
                  </div>
                  {allScenesRendered && (
                    <button 
                      onClick={() => {
                        const urls = data.cenas
                          .map(c => {
                            const vid = getSceneVideo(c);
                            return vid?.video_url ? `${vid.video_url}?t=${new Date(vid.data_geracao || 0).getTime()}` : null;
                          })
                          .filter(Boolean) as string[];
                        compileFinalVideo(postId as string, urls);
                      }}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Compilar Master
                    </button>
                  )}
                </div>
                
                {!allScenesRendered && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-tight">Rrenderize todas as cenas para liberar a compilação</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scene Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Narração</label>
                  <button 
                    onClick={async () => {
                      invalidateFinalVideo();
                      // Delete old audio and video fragment from Supabase so the UI instantly clears them
                      await supabase.from('audios').delete().eq('id_post', postId).eq('numero_cena', currentScene.numero);
                      await supabase.from('videos_cenas').delete().eq('id_post', postId).eq('numero_cena', currentScene.numero);
                      if (onRefresh) onRefresh();
                      generateSceneAudio(postId as string, currentScene, data.voice_settings);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-[8px] font-black uppercase flex items-center gap-1"
                  >
                    <RefreshCw className={clsx("w-2.5 h-2.5", isProcessing && "animate-spin")} /> Refazer Áudio
                  </button>
                </div>
                <textarea 
                  value={currentScene?.texto_narrado}
                  onChange={(e) => updateScene(selectedSceneIdx, { texto_narrado: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-xs leading-relaxed text-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none h-28"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Animação</label>
                   <select 
                    value={currentScene?.animacao || 'zoom_in'}
                    onChange={(e) => updateScene(selectedSceneIdx, { animacao: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-bold text-zinc-400 outline-none appearance-none"
                   >
                     {ANIMATION_OPTIONS.map(opt => (
                       <option key={opt.id} value={opt.id}>{opt.label}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest flex items-center gap-2">
                      Referência Visual
                      {currentScene?.slug_produto && <Database className="w-3 h-3 text-emerald-500 animate-pulse" />}
                    </label>
                    
                    {(() => {
                       const rawSlug = currentScene?.slug_produto || '';
                       const cleanSlugs = rawSlug
                         .replace(/\s+e\s+/gi, ',')
                         .replace(/\s+and\s+/gi, ',')
                         .replace(/;/g, ',')
                         .split(',')
                         .map(s => s.replace(/\.(png|jpg|webp)$/, '').trim())
                         .filter(Boolean);

                       // Find matching products from database for selection
                       const selectedProducts = cleanSlugs.map(slug => {
                         const match = products.find(p => p.slug_embalagem?.replace(/\.(png|jpg|webp)$/, '').trim() === slug);
                         if (match) return match;
                         // Return a placeholder product if not found in db
                         return {
                           Produto: slug,
                           slug_embalagem: slug,
                           slug_imagem_real: slug
                         } as Product;
                       });

                       const isMultiple = cleanSlugs.length > 1;

                       return (
                         <div className="space-y-2">
                           <MultiProductSelector
                             products={products}
                             selectedProducts={selectedProducts}
                             onChange={(newProducts) => {
                               const slug_produto = newProducts.map(p => p.slug_embalagem).join(',');
                               updateScene(selectedSceneIdx, { 
                                 slug_produto,
                                 usa_referencia: newProducts.length > 0
                               });
                             }}
                           />
                           
                           {isMultiple && (
                             <p className="text-[8px] font-medium text-zinc-500 italic leading-snug mt-1">
                               ℹ️ Geração utilizará a primeira imagem da lista (<b>{selectedProducts[0]?.Produto || cleanSlugs[0]}</b>) como ativo real.
                             </p>
                           )}
                         </div>
                       );
                    })()}
                 </div>

                {/* New Reference Type Selector */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Tipo de Referência</label>
                   <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                      <button 
                        onClick={() => updateScene(selectedSceneIdx, { tipo_referencia: 'produto_real' })}
                        className={clsx(
                          "flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all",
                          currentScene?.tipo_referencia === 'produto_real' ? "bg-zinc-800 text-emerald-400" : "text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        Produto Real
                      </button>
                      <button 
                        onClick={() => updateScene(selectedSceneIdx, { tipo_referencia: 'embalagem' })}
                        className={clsx(
                          "flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all",
                          currentScene?.tipo_referencia === 'embalagem' ? "bg-zinc-800 text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        Embalagem
                      </button>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Prompt Visual (AI)</label>
                  <button 
                    onClick={async () => {
                      const refUrl = resolveReferenceUrls(
                        currentScene.usa_referencia,
                        currentScene.slug_produto,
                        currentScene.tipo_referencia
                      );
                      invalidateFinalVideo();
                      // Delete old image and video fragment from Supabase so the UI instantly clears them
                      await supabase.from('imagens').delete().eq('id_post', postId).eq('numero_cena', currentScene.numero);
                      await supabase.from('videos_cenas').delete().eq('id_post', postId).eq('numero_cena', currentScene.numero);
                      if (onRefresh) onRefresh();
                      generateSceneImage(postId as string, currentScene, refUrl);
                    }}
                    className="text-amber-500 hover:text-amber-400 text-[8px] font-black uppercase flex items-center gap-1"
                  >
                    <RefreshCw className={clsx("w-2.5 h-2.5", isProcessing && "animate-spin")} /> Refazer Imagem
                  </button>
                </div>
                <textarea 
                  value={currentScene?.prompt_visual}
                  onChange={(e) => updateScene(selectedSceneIdx, { prompt_visual: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-[10px] font-mono text-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                />
              </div>

              {/* SMART RECREATE & INTELLIGENT SCENE CARD */}
              {(isAudioOutdated || isImageOutdated) && (
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-orange-600/5 to-transparent border border-amber-500/20 rounded-2xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-400">Alterações Detectadas</h4>
                        <p className="text-[9px] font-bold text-zinc-400 leading-relaxed mt-1">
                          Você modificou os parâmetros desta cena. Deseja refazer os assets alterados e re-renderizar o fragmento de vídeo?
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[8px] font-bold">
                        {isAudioOutdated && (
                          <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg uppercase tracking-tight flex items-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.05)]">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                            Narração Modificada (Regerar Áudio)
                          </span>
                        )}
                        {isImageOutdated && (
                          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg uppercase tracking-tight flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.05)]">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            Prompt Modificado (Regerar Imagem)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleSmartRecreate}
                          disabled={isProcessing || isSmartRecreating}
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-[10px] font-black uppercase rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                        >
                          {isSmartRecreating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              {smartRecreateTarget?.isRendering 
                                ? 'Renderizando Cena...' 
                                : (smartRecreateTarget?.waitAudio && smartRecreateTarget?.waitImage)
                                ? 'Gerando Áudio e Imagem...'
                                : smartRecreateTarget?.waitAudio
                                ? 'Gerando Novo Áudio...'
                                : 'Gerando Nova Imagem...'}
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              Refazer e Renderizar Cena
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RICH TIMELINE (Bottom of Workspace) */}
      <div className="h-52 bg-black/40 border-t border-zinc-900 flex flex-col shrink-0">
        <div className="px-6 py-2 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-indigo-500/50"><Film className="w-3 h-3" /> Timeline de Produção</span>
            <span>{data.cenas.length} Cenas Planejadas</span>
          </div>
          <button onClick={() => insertScene(data.cenas.length)} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-[9px] font-bold transition-all border border-indigo-500/30">
            <Plus className="w-3 h-3" /> Adicionar Cena
          </button>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timeline-cenas" direction="horizontal">
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 flex items-center px-6 gap-4 overflow-x-auto custom-scrollbar py-4 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]"
              >
                 {data.cenas.map((cena, idx) => {
                   const isSelected = selectedSceneIdx === idx;
                   const sceneImg = getSceneImage(cena.numero);
                   const sceneAud = getSceneAudio(cena);
                   const sceneVid = getSceneVideo(cena);

                   return (
                     <Draggable key={`cena-${cena.id_cena || idx}`} draggableId={`cena-${cena.id_cena || idx}`} index={idx}>
                       {(provided, snapshot) => (
                         <div 
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           className={clsx(
                             "flex flex-col gap-2 shrink-0 group/scene transition-transform relative",
                             snapshot.isDragging && "scale-105 z-50 shadow-2xl"
                           )}
                           style={provided.draggableProps.style}
                         >
                            <div 
                              className={clsx(
                                "w-48 h-28 rounded-2xl border-2 transition-all relative overflow-hidden",
                                isSelected ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-zinc-900" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                              )}
                            >
                              <button 
                                onClick={() => setSelectedSceneIdx(idx)}
                                className="absolute inset-0 w-full h-full text-left"
                              >
                                {sceneVid ? (
                                  <video src={sceneVid.video_url} className="w-full h-full object-cover opacity-60 group-hover/scene:opacity-100 transition-opacity" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
                                ) : sceneImg ? (
                                  <Image src={sceneImg.image_url || sceneImg.url_imagem_fundo || ''} fill unoptimized className="object-cover opacity-60 group-hover/scene:opacity-100 transition-opacity" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-6 text-center">
                                    <p className="text-[7px] font-black text-zinc-700 uppercase leading-tight line-clamp-3">{cena.texto_narrado}</p>
                                  </div>
                                )}
                              </button>

                              {/* Top Overlay Indicators */}
                              <div className="absolute top-2 left-2 flex gap-1.5 z-20">
                                 <div className="px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-[8px] font-black text-white rounded-md border border-white/10">
                                   #{cena.numero}
                                 </div>
                                 {cena.slug_produto && (
                                   <div className="px-1.5 py-0.5 bg-emerald-500/80 backdrop-blur-md text-[8px] font-black text-white rounded-md border border-emerald-400/20 flex items-center gap-1 shadow-lg">
                                     <Database className="w-2.5 h-2.5" />
                                     PR REAL
                                   </div>
                                 )}
                              </div>

                              {/* Move & Reorder Controls Overlay */}
                              <div className="absolute bottom-2 right-2 flex gap-1 z-20 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteScene(idx); }} 
                                  className="p-1.5 bg-black/80 hover:bg-red-600 rounded-md backdrop-blur-md border border-white/10 text-red-500 hover:text-white shadow-lg transition-colors"
                                  title="Excluir cena"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Progress Dots */}
                              <div className="absolute top-2 right-2 flex gap-1 z-20">
                                <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneImg ? "bg-amber-500" : "bg-zinc-800")} />
                                <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneAud ? "bg-indigo-500" : "bg-zinc-800")} />
                                <div className={clsx("w-1.5 h-1.5 rounded-full border border-black/50", sceneVid ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-800")} />
                              </div>

                              {/* Processing Overlays */}
                              {progress[cena.numero]?.render === 'processing' && (
                                <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[2px] flex items-center justify-center z-30">
                                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                </div>
                              )}
                            </div>

                            {/* Add Scene Before (Only on first item) */}
                            {idx === 0 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); insertScene(0); }}
                                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-800 hover:bg-indigo-500 rounded-full flex items-center justify-center border-2 border-zinc-950 z-30 opacity-0 group-hover/scene:opacity-100 transition-all shadow-xl hover:scale-110"
                                title="Adicionar cena no início"
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            )}

                            {/* Add Scene After */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); insertScene(idx + 1); }}
                              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-800 hover:bg-indigo-500 rounded-full flex items-center justify-center border-2 border-zinc-950 z-30 opacity-0 group-hover/scene:opacity-100 transition-all shadow-xl hover:scale-110"
                              title="Adicionar cena após esta"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>

                            {/* Audio Status Bar / Tiny Player */}
                            <div className={clsx(
                              "w-48 rounded-xl border flex flex-col p-2 gap-2 transition-all",
                              isSelected ? "bg-indigo-500/10 border-indigo-500/30" : "bg-zinc-900/50 border-zinc-800"
                            )}>
                              <div className="flex items-center gap-2">
                                <Music className={clsx("w-2.5 h-2.5", sceneAud ? "text-indigo-400" : "text-zinc-700")} />
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={clsx(
                                    "h-full transition-all duration-1000",
                                    sceneAud ? "w-full bg-indigo-500" : progress[cena.numero]?.audio === 'processing' ? "w-1/2 bg-amber-500 animate-pulse" : "w-0"
                                  )} />
                                </div>
                                {sceneAud && (
                                  <div className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">OK</div>
                                )}
                              </div>
                              
                              {sceneAud && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const audio = document.getElementById(`audio-${cena.numero}`) as HTMLAudioElement;
                                      if (audio.paused) audio.play(); else audio.pause();
                                    }}
                                    className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-md"
                                  >
                                    <Play className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                  <audio 
                                    id={`audio-${cena.numero}`} 
                                    src={sceneAud.audio_url} 
                                    className="h-4 w-full opacity-50 hover:opacity-100 transition-opacity" 
                                    controls 
                                  />
                                </div>
                              )}
                            </div>
                         </div>
                       )}
                     </Draggable>
                   );
                 })}
                 {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

             {/* Studio Copilot (Floating Assistant) */}
             <StudioCopilot 
               id_post={postId as string}
               currentScript={data}
               onScriptUpdate={(newScript) => {
                 // Apply reindexing and update parent
                 const updated = { 
                   ...newScript, 
                   cenas: reindexScenes(newScript.cenas) 
                 };
                 onChange(updated);
                 invalidateFinalVideo();
               }}
             />

             {/* FOOTER: PUBLISHING & STATUS */}      {finalVideo && (
        <div className="h-24 bg-indigo-600 border-t border-indigo-500 px-12 flex items-center justify-between shadow-[0_-20px_50px_rgba(79,70,229,0.2)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-black uppercase tracking-tighter">Vídeo Master Finalizado</h4>
                <p className="text-indigo-100 text-[10px] font-bold opacity-80 uppercase">Pronto para distribuição multi-plataforma</p>
              </div>
            </div>

            {/* Publication Links (Dynamic via Realtime) */}
            <div className="flex items-center gap-2 ml-4">
              {post?.instagram_url && (
                <a 
                  href={post.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Camera className="w-3 h-3" /> Instagram
                </a>
              )}
              {post?.facebook_url && (
                <a 
                  href={post.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Globe className="w-3 h-3" /> Facebook
                </a>
              )}
              {post?.youtube_url && (
                <a 
                  href={post.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  <Video className="w-3 h-3" /> YouTube
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">             <select 
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-indigo-700/50 border border-indigo-400 text-white text-[10px] font-bold rounded-xl px-4 py-3 outline-none min-w-[200px]"
             >
               <option value="">Selecione a Conta...</option>
               {accounts.map(acc => (
                 <option key={acc.id_conta} value={acc.id_conta}>{acc.nome_conta} ({acc.nicho})</option>
               ))}
             </select>
             <input
               type="datetime-local"
               value={scheduleDate}
               onChange={(e) => setScheduleDate(e.target.value)}
               className="bg-indigo-700/50 border border-indigo-400 text-white text-[10px] font-bold rounded-xl px-4 py-3 outline-none"
             />
             <button
               onClick={() => onSchedule?.(selectedAccountId, scheduleDate)}
               disabled={!selectedAccountId || !scheduleDate}
               className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
             >
               Agendar
             </button>
             <button 
               onClick={() => onPublish?.(selectedAccountId)}
               disabled={!selectedAccountId}
               className="px-10 py-3 bg-white text-indigo-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 group"
             >
               <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               Publicar Agora
             </button>
              <button 
                onClick={() => {
                  const urls = data.cenas
                    .map(c => {
                      const vid = getSceneVideo(c);
                      return vid?.video_url ? `${vid.video_url}?t=${new Date(vid.data_geracao || 0).getTime()}` : null;
                    })
                    .filter(Boolean) as string[];
                  compileFinalVideo(postId as string, urls);
                }}
               className="p-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all shadow-lg"
               title="Refazer Compilação Final"
             >
               <RefreshCw className={clsx("w-4 h-4", isProcessing && "animate-spin")} />
             </button>
             </div>
             </div>
             )}    </div>
  );
};
