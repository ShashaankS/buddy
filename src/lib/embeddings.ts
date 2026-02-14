import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate embeddings for a given text using Gemini API
 * @param text - The text to generate embeddings for
 * @returns An array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @returns An array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const promises = texts.map(text => model.embedContent(text));
    const results = await Promise.all(promises);
    return results.map(result => result.embedding.values);
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw new Error('Failed to generate batch embeddings');
  }
}

/**
 * Extract text content from TipTap JSON
 * @param content - TipTap JSON content
 * @returns Plain text extracted from the JSON
 */
export function extractTextFromTipTap(content: unknown): string {
  if (!content || typeof content !== 'object' || !('content' in content)) return '';
  
  let text = '';
  
  function traverse(node: Record<string, unknown>) {
    if (node.type === 'text' && typeof node.text === 'string') {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: unknown) => {
        if (typeof child === 'object' && child !== null) {
          traverse(child as Record<string, unknown>);
        }
      });
    }
  }
  
  const contentObj = content as Record<string, unknown>;
  if (contentObj.content && Array.isArray(contentObj.content)) {
    contentObj.content.forEach((child: unknown) => {
      if (typeof child === 'object' && child !== null) {
        traverse(child as Record<string, unknown>);
      }
    });
  }
  
  return text.trim();
}

/**
 * Chunk text into smaller parts for better embedding quality
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum size of each chunk in characters
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  if (text.length <= maxChunkSize) return [text];
  
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
