import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { createClient } from '@/utils/supabase/server';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'tokens', 'cocreator-470801-85fe137c8f33.json'),
});
const BUCKET_NAME = 'cocreator_content';

/** Map extensions to proper MIME types */
const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.ico': 'image/x-icon',
};

/** Supported image extensions */
const SUPPORTED_EXTENSIONS = new Set(Object.keys(MIME_MAP));

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui não-alfanuméricos por hífen
    .replace(/(^-|-$)+/g, ''); // Remove hifens no começo/fim
}

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? `.${match[1].toLowerCase()}` : '.png';
}

function getContentType(ext: string, fileType?: string): string {
  // 1. Try our MIME map first (most reliable)
  if (MIME_MAP[ext]) return MIME_MAP[ext];
  // 2. Use the file's reported type if it looks valid
  if (fileType && fileType.startsWith('image/')) return fileType;
  // 3. Fallback to octet-stream
  return 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productTitle = formData.get('productTitle') as string;
    const existingSlug = formData.get('existingSlug') as string;
    const imageType = formData.get('imageType') as string; // 'real' ou 'embalagem'

    if (!file || !productTitle || !imageType) {
      return NextResponse.json({ error: 'Arquivo, productTitle ou imageType ausente.' }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 20MB.' }, { status: 400 });
    }

    const ext = getExtension(file.name);
    const contentType = getContentType(ext, file.type);

    console.log(`[Upload] File: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB, Type: ${file.type}, Resolved CT: ${contentType}, Ext: ${ext}`);

    // Warn but don't block unsupported formats
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      console.warn(`[Upload] Uncommon format: ${ext} — proceeding anyway`);
    }

    const UPLOADS_PREFIX = imageType === 'embalagem' ? 'embalagens' : 'produtos_reais';
    const dbColumn = imageType === 'embalagem' ? 'slug_embalagem' : 'slug_imagem_real';

    const buffer = Buffer.from(await file.arrayBuffer());

    let baseSlug = existingSlug;
    if (!baseSlug || baseSlug === 'null') {
      baseSlug = generateSlug(productTitle);
    } else {
      baseSlug = baseSlug.replace(/\.[^/.]+$/, "");
    }

    const finalSlug = `${baseSlug}${ext}`;
    const destFileName = `${UPLOADS_PREFIX}/${finalSlug}`;

    const bucket = storage.bucket(BUCKET_NAME);
    const blob = bucket.file(destFileName);

    await blob.save(buffer, {
      contentType,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destFileName}`;
    const supabase = await createClient();

    let err1 = null;

    if (imageType === 'real') {
      // 1a. Fetch existing product to preserve other fields if we are changing the primary key
      const { data: oldRows } = await supabase
        .from('produtos')
        .select('*')
        .eq('produto', productTitle)
        .limit(1);
        
      const oldRow = oldRows && oldRows.length > 0 ? oldRows[0] : {};

      // 1b. Upsert into produtos. 
      // Se finalSlug mudou (ex: .png para .webp), criará nova linha com os mesmos dados.
      // Se não mudou, apenas atualiza.
      const { error } = await supabase
        .from('produtos')
        .upsert({ 
          ...oldRow,
          slug_imagem_real: finalSlug, 
          produto: productTitle 
        }, { onConflict: 'slug_imagem_real' });
        
      err1 = error;
    } else {
      // Se for embalagem, apenas fazemos update normal. 
      // Se a linha não existir em 'produtos', update afeta 0 linhas (err1=null) mas não quebra FK
      const { error } = await supabase
        .from('produtos')
        .update({ slug_embalagem: finalSlug })
        .eq('produto', productTitle);
        
      err1 = error;
    }

    if (err1) console.warn("[Upload] Update produtos warning:", err1);

    // 2. Atualizar produtos_plataformas
    const { error: err2 } = await supabase
      .from('produtos_plataformas')
      .update({ [dbColumn]: finalSlug })
      .eq('title', productTitle);

    if (err2) console.warn("[Upload] Update produtos_plataformas warning:", err2);

    return NextResponse.json({ 
      url: publicUrl,
      slug: finalSlug,
      format: ext,
      success: true
    });
  } catch (error: any) {
    console.error('[Upload] GCS Upload Error:', error?.message || error);
    return NextResponse.json({ 
      error: `Falha ao fazer upload: ${error?.message || 'erro desconhecido'}` 
    }, { status: 500 });
  }
}
