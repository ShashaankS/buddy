"use server";

import { db } from "@/db/index";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveNote(data: {
  noteId?: string;
  title: string;
  content: any; // TipTap JSON content
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
}) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // If noteId exists, update existing note
    if (data.noteId) {
      const [updatedNote] = await db
        .update(notes)
        .set({
          title: data.title,
          content: data.content,
          folderId: data.folderId || null,
          tags: data.tags || [],
          isPinned: data.isPinned || false,
          updatedAt: new Date(),
        })
        .where(eq(notes.id, data.noteId))
        .returning();

      revalidatePath("/");
      revalidatePath(`/notes/${data.noteId}`);
      
      return { success: true, note: updatedNote };
    }

    // Create new note
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: data.title || "Untitled Note",
        content: data.content,
        folderId: data.folderId || null,
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        isArchived: false,
      })
      .returning();

    revalidatePath("/");
    
    return { success: true, note: newNote };
  } catch (error) {
    console.error("Error saving note:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save note" 
    };
  }
}

export async function getNote(noteId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    console.log("getNote called with:", noteId);
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

    return { success: true, note };
  } catch (error) {
    console.error("Error fetching note:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch note" 
    };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    await db
      .delete(notes)
      .where(eq(notes.id, noteId));

    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete note" 
    };
  }
}

export async function togglePinNote(noteId: string, isPinned: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    await db
      .update(notes)
      .set({ isPinned })
      .where(eq(notes.id, noteId));

    revalidatePath("/dashboard");
    revalidatePath(`/notes/${noteId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling pin:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to toggle pin" 
    };
  }
}