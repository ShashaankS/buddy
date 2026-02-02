"use server";

import { createClient } from "@/utils/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db/index";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function summarizeNote(content: any, title: string, noteId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    if (!noteId) {
      return {
        success: false,
        error: "Note must be saved before summarization",
      };
    }

    // Fetch the note from database using Drizzle
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      throw new Error("Note not found");
    }

    // Check if user owns this note
    if (note.userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Convert TipTap JSON content to plain text
    const textContent = extractTextFromTipTap(note.content);

    if (!textContent || textContent.trim().length === 0) {
      return {
        success: false,
        error: "Note content is empty",
      };
    }

    // Call Gemini API for summarization
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are a helpful assistant that creates concise summaries and extracts key points from text.

Summarize the following note titled "${note.title}":

${textContent}

Format your response as JSON with 'summary' (a brief paragraph) and 'key_points' (an array of 3-5 bullet points).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    const summary = parsedResult.summary || "";
    const keyPoints = parsedResult.key_points || [];

    // Update the note with summary and key points using Drizzle
    await db
      .update(notes)
      .set({
        summary: summary,
        keyPoints: keyPoints,
        summaryWordCount: summary.split(/\s+/).length,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    return {
      success: true,
      summary: summary,
      keyPoints: keyPoints,
    };
  } catch (error) {
    console.error("Error summarizing note:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to summarize note",
    };
  }
}

function extractTextFromTipTap(content: any): string {
  if (!content) return "";
  
  let text = "";
  
  const traverse = (node: any) => {
    if (node.type === "text") {
      text += node.text;
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
    
    // Add spacing between blocks
    if (node.type === "paragraph" || node.type === "heading") {
      text += "\n";
    }
  };
  
  traverse(content);
  
  return text.trim();
}
