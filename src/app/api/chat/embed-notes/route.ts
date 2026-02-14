import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db/index';
import { notes, noteEmbeddings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateEmbedding, extractTextFromTipTap, chunkText } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Get the note
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note || note.userId !== user.id) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Extract text from TipTap JSON
    const textContent = extractTextFromTipTap(note.content);
    
    if (!textContent || textContent.length < 10) {
      return NextResponse.json(
        { error: 'Note content is too short to embed' },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(textContent, 1000);

    // Delete existing embeddings for this note
    await db.delete(noteEmbeddings).where(eq(noteEmbeddings.noteId, noteId));

    // Generate and store embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk);
      
      return db.insert(noteEmbeddings).values({
        noteId: note.id,
        userId: user.id,
        content: chunk,
        embedding: embedding,
        metadata: {
          title: note.title,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      });
    });

    await Promise.all(embeddingPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully embedded ${chunks.length} chunks from note`,
      chunksCreated: chunks.length,
    });

  } catch (error) {
    console.error('Error embedding note:', error);
    return NextResponse.json(
      { error: 'Failed to embed note' },
      { status: 500 }
    );
  }
}

// GET endpoint to embed all notes for a user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all user's notes
    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id));

    let successCount = 0;
    let errorCount = 0;

    // Process each note
    for (const note of userNotes) {
      try {
        const textContent = extractTextFromTipTap(note.content);
        
        if (!textContent || textContent.length < 10) {
          errorCount++;
          continue;
        }

        const chunks = chunkText(textContent, 1000);

        // Delete existing embeddings
        await db.delete(noteEmbeddings).where(eq(noteEmbeddings.noteId, note.id));

        // Generate and store embeddings
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await generateEmbedding(chunk);
          
          await db.insert(noteEmbeddings).values({
            noteId: note.id,
            userId: user.id,
            content: chunk,
            embedding: embedding,
            metadata: {
              title: note.title,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          });
        }

        successCount++;
      } catch (error) {
        console.error(`Error embedding note ${note.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Embedded ${successCount} notes successfully`,
      successCount,
      errorCount,
      totalNotes: userNotes.length,
    });

  } catch (error) {
    console.error('Error embedding all notes:', error);
    return NextResponse.json(
      { error: 'Failed to embed notes' },
      { status: 500 }
    );
  }
}
