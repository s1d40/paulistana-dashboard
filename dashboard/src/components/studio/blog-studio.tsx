import React from 'react';
import { BlogScript } from '@/types/content-studio';
import { Sparkles, Loader2 } from 'lucide-react';
import { useProductionQueue, ProductionScene } from '@/store/production-queue';
import { useParams } from 'next/navigation';

interface BlogStudioProps {
  data: BlogScript;
  onChange: (newData: BlogScript) => void;
}

export const BlogStudio: React.FC<BlogStudioProps> = ({ data, onChange }) => {
  const { id } = useParams();
  const { generateAssets, isProcessing } = useProductionQueue();

  const handleGenerateImages = async () => {
    // Map blog images to a format generateAssets understands
    const scenes: ProductionScene[] = [
      { 
        numero: 0, 
        prompt_visual: data.featured_image_url, 
        replicate: { 
          model_url: 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions',
          input: { prompt: data.featured_image_url, aspect_ratio: '16:9' as const, output_format: 'webp' as const } 
        } 
      },
      ...data.imagens_internas.map((img, i) => ({
        numero: i + 1,
        prompt_visual: img.prompt_visual,
        replicate: { 
          model_url: 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions',
          input: { prompt: img.prompt_visual, aspect_ratio: '16:9' as const, output_format: 'webp' as const } 
        }
      }))
    ];
    await generateAssets(id as string, scenes);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Editor Form */}
      <div className="space-y-6 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Editor de Blog (SEO)</h3>
          <button 
            onClick={handleGenerateImages}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Gerar Imagens do Artigo
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Título do Artigo</label>
            <input 
              type="text" 
              value={data.title} 
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Slug</label>
              <input 
                type="text" 
                value={data.slug} 
                onChange={(e) => onChange({ ...data, slug: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Categoria</label>
              <input 
                type="text" 
                value={data.categoria_alvo} 
                onChange={(e) => onChange({ ...data, categoria_alvo: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl space-y-4">
            <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Yoast SEO Settings</p>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Focus Keyword</label>
              <input 
                type="text" 
                value={data.yoast_focuskw} 
                onChange={(e) => onChange({ ...data, yoast_focuskw: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1">Meta Description</label>
              <textarea 
                value={data.yoast_metadesc} 
                onChange={(e) => onChange({ ...data, yoast_metadesc: e.target.value })}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs h-20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-zinc-500 mb-1">Conteúdo HTML</label>
            <textarea 
              value={data.content} 
              onChange={(e) => onChange({ ...data, content: e.target.value })}
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-xs font-mono h-96"
            />
          </div>
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0 h-[600px] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 bg-white dark:bg-zinc-800 rounded px-3 py-1 text-[10px] text-zinc-400 font-mono truncate">
            blog.paulistanaemporio.com/{data.slug}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-black mb-6">{data.title}</h1>
          <div 
            className="blog-preview-content"
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </div>
        <div className="p-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest text-center">
          Preview Artigo SEO
        </div>
      </div>

      <style jsx global>{`
        .blog-preview-content .clinical-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 13px;
        }
        .blog-preview-content .clinical-table th {
          background-color: #f8f9fa;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
        }
        .blog-preview-content .clinical-table td {
          padding: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .blog-preview-content .medical-review-card {
          border-left: 4px solid #10b981;
        }
        .blog-preview-content blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 20px;
          font-style: italic;
          color: #4b5563;
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};
