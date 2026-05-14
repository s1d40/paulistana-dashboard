import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

// Configuração do GCS
const storage = new Storage({
  keyFilename: path.join(process.cwd(), '..', 'cocreator-470801-85fe137c8f33.json'),
});
const BUCKET_NAME = 'cocreator_content';
const UPLOADS_PREFIX = 'chat_uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const destFileName = `${UPLOADS_PREFIX}/${fileName}`;

    const bucket = storage.bucket(BUCKET_NAME);
    const blob = bucket.file(destFileName);

    // Upload do buffer para o GCS
    await blob.save(buffer, {
      contentType: file.type,
      resumable: false,
    });

    // Torna o arquivo público (opcional, dependendo das permissões do bucket)
    // Se o bucket não tiver acesso uniforme, podemos usar makePublic()
    // try { await blob.makePublic(); } catch (e) { console.warn('GCS MakePublic failed:', e); }

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destFileName}`;

    return NextResponse.json({ 
      url: publicUrl,
      name: file.name,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    console.error('GCS Upload Error:', error);
    return NextResponse.json({ error: 'Falha ao fazer upload para o Cloud Storage' }, { status: 500 });
  }
}
