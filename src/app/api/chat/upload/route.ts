import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db/index';
import { notes, noteEmbeddings } from '@/db/schema';
import { generateEmbedding, chunkText } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Only text, markdown, and PDF files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    let textContent = '';
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      textContent = await file.text();
    } else {
      // For PDF, we'd need a PDF parser library
      return NextResponse.json(
        { error: 'PDF support coming soon. Please use text or markdown files.' },
        { status: 400 }
      );
    }

    if (!textContent || textContent.length < 10) {
      return NextResponse.json(
        { error: 'File content is too short' },
        { status: 400 }
      );
    }

    // Create a new note from the uploaded file
    const [newNote] = await db.insert(notes).values({
      userId: user.id,
      title: file.name.replace(/\.(txt|md)$/, ''),
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: textContent,
              },
            ],
          },
        ],
      },
      tags: ['uploaded'],
    }).returning();

    // Chunk and embed the content
    const chunks = chunkText(textContent, 1000);

    // Generate and store embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      await db.insert(noteEmbeddings).values({
        noteId: newNote.id,
        userId: user.id,
        content: chunk,
        embedding: embedding,
        metadata: {
          title: newNote.title,
          chunkIndex: i,
          totalChunks: chunks.length,
          source: 'upload',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded and embedded successfully',
      noteId: newNote.id,
      noteTitle: newNote.title,
      chunksCreated: chunks.length,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process file' },
      { status: 500 }
    );
  }
}
