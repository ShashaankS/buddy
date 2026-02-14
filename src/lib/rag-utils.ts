import { db } from '@/db/index';
import { noteEmbeddings, notes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateEmbedding } from './embeddings';

/**
 * Find similar notes using vector similarity search
 * @param query - The search query
 * @param userId - The user ID to limit search to their notes
 * @param limit - Maximum number of results to return
 * @param similarityThreshold - Minimum similarity score (0-1, where 1 is most similar)
 * @returns Array of similar note chunks with their content and metadata
 */
export async function findSimilarNotes(
  query: string,
  userId: string,
  limit: number = 5,
  similarityThreshold: number = 0.3
) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform vector similarity search using cosine similarity
    const results = await db
      .select({
        id: noteEmbeddings.id,
        noteId: noteEmbeddings.noteId,
        content: noteEmbeddings.content,
        metadata: noteEmbeddings.metadata,
        similarity: sql<number>`1 - (${noteEmbeddings.embedding} <=> ${sql`ARRAY[${sql.join(queryEmbedding.map(v => sql`${v}`), sql`, `)}]::vector`})`,
      })
      .from(noteEmbeddings)
      .where(eq(noteEmbeddings.userId, userId))
      .orderBy(sql`${noteEmbeddings.embedding} <=> ${sql`ARRAY[${sql.join(queryEmbedding.map(v => sql`${v}`), sql`, `)}]::vector`}`)
      .limit(limit);
    
    // Filter by similarity threshold
    const filteredResults = results.filter(
      result => result.similarity >= similarityThreshold
    );
    
    return filteredResults;
  } catch (error) {
    console.error('Error finding similar notes:', error);
    return [];
  }
}

/**
 * Get full notes details for the matched embeddings
 * @param embeddingResults - Results from findSimilarNotes
 * @returns Array of full note objects
 */
export async function getNotesDetails(embeddingResults: Array<{ noteId: string | null }>) {
  if (embeddingResults.length === 0) return [];
  
  const noteIds = [...new Set(embeddingResults.map(r => r.noteId))];
  
  const noteDetails = await db
    .select()
    .from(notes)
    .where(sql`${notes.id} = ANY(${noteIds})`);
  
  return noteDetails;
}

/**
 * Build context string from similar notes for RAG
 * @param similarNotes - Results from findSimilarNotes
 * @param maxContextLength - Maximum length of context in characters
 * @returns Formatted context string
 */
export function buildRagContext(similarNotes: Array<{ content: string; similarity: number }>, maxContextLength: number = 3000): string {
  if (similarNotes.length === 0) {
    return '';
  }
  
  let context = 'Here is relevant information from your notes:\n\n';
  let currentLength = context.length;
  
  for (const note of similarNotes) {
    const noteContext = `[From your notes - Similarity: ${(note.similarity * 100).toFixed(1)}%]\n${note.content}\n\n`;
    
    if (currentLength + noteContext.length > maxContextLength) {
      break;
    }
    
    context += noteContext;
    currentLength += noteContext.length;
  }
  
  return context;
}
