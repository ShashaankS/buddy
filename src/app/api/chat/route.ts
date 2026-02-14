import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db/index';
import { notes, chatSessions, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { findSimilarNotes, buildRagContext } from '@/lib/rag-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use the chatbot.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, sessionId, contextNoteIds } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const [newSession] = await db.insert(chatSessions).values({
        userId: user.id,
        title: message.slice(0, 50) + '...',
      }).returning();
      currentSessionId = newSession.id;
    }

    // Save user message
    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      userId: user.id,
      role: 'user',
      content: message,
      contextNoteIds: contextNoteIds || [],
    });

    // Build context for RAG
    let context = '';
    let usedNoteIds: string[] = contextNoteIds || [];

    // If specific notes provided, use them
    if (contextNoteIds && contextNoteIds.length > 0) {
      const selectedNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, user.id));
      
      const filteredNotes = selectedNotes.filter(note => 
        contextNoteIds.includes(note.id)
      );

      context = 'Here is relevant information from your selected notes:\n\n';
      for (const note of filteredNotes) {
        context += `[Note: ${note.title}]\n`;
        if (note.content) {
          // Extract text from TipTap JSON
          const textContent = extractTextFromContent(note.content);
          context += `${textContent.slice(0, 500)}\n\n`;
        }
      }
    } else {
      // Use vector search to find relevant notes
      const similarNotes = await findSimilarNotes(message, user.id, 3);
      
      if (similarNotes.length > 0) {
        context = buildRagContext(similarNotes);
        usedNoteIds = similarNotes.map(n => n.noteId).filter((id): id is string => id !== null);
      }
    }

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are a helpful AI assistant that helps users with their notes and questions. 
${context ? `Use the following context from the user's notes to answer their question:\n\n${context}\n\n` : ''}
If you use information from the notes, mention it naturally in your response. 
If the question cannot be answered with the provided context or is a simple question, answer based on your general knowledge.
Be concise, helpful, and friendly.`;

    const result = await model.generateContent([
      systemPrompt,
      `User question: ${message}`
    ]);

    const response = result.response;
    const responseText = response.text();

    // Save assistant message
    await db.insert(chatMessages).values({
      sessionId: currentSessionId,
      userId: user.id,
      role: 'assistant',
      content: responseText,
      contextNoteIds: usedNoteIds,
    });

    return NextResponse.json({
      message: responseText,
      sessionId: currentSessionId,
      contextUsed: context.length > 0,
      contextNoteIds: usedNoteIds,
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// Helper function to extract text from TipTap JSON
function extractTextFromContent(content: unknown): string {
  if (!content) return '';
  
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
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed.content && Array.isArray(parsed.content)) {
        parsed.content.forEach((child: unknown) => {
          if (typeof child === 'object' && child !== null) {
            traverse(child as Record<string, unknown>);
          }
        });
      }
    } catch {
      return content;
    }
  } else if (typeof content === 'object' && 'content' in content) {
    const contentObj = content as Record<string, unknown>;
    if (contentObj.content && Array.isArray(contentObj.content)) {
      contentObj.content.forEach((child: unknown) => {
        if (typeof child === 'object' && child !== null) {
          traverse(child as Record<string, unknown>);
        }
      });
    }
  }
  
  return text.trim();
}
