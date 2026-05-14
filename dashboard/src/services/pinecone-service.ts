import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SemanticSearchResult {
  id: string;
  score: number;
  metadata: {
    image_url: string;
    prompt: string;
    id_post?: string;
  };
}

export async function searchSimilarImages(prompt: string, minScore: number = 0.90): Promise<SemanticSearchResult[]> {
  try {
    // 1. Gerar Embedding do prompt de busca
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: prompt,
    });

    const vector = embeddingResponse.data[0].embedding;

    // 2. Consultar Pinecone
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    
    // Usamos o host direto para garantir conexão na cpx32 se houver problema de DNS
    const queryResponse = await index.query({
      vector: vector,
      topK: 5,
      includeMetadata: true,
    });

    // 3. Filtrar por score e mapear resultados
    return queryResponse.matches
      .filter(match => (match.score || 0) >= minScore)
      .map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as SemanticSearchResult['metadata']
      }));

  } catch (error) {
    console.error('Pinecone Search Error:', error);
    throw new Error('Falha na busca semântica de imagens.');
  }
}
