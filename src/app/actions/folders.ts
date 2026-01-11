"use server";

import { db } from "@/db/index";
import { folders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveFolder(data: {
  folderId?: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // If folderId exists, update existing folder
    if (data.folderId) {
      const [updatedFolder] = await db
        .update(folders)
        .set({
          name: data.name,
          color: data.color || null,
          parentId: data.parentId || null,
        })
        .where(eq(folders.id, data.folderId))
        .returning();

      revalidatePath("/folders");
      revalidatePath(`/folders/${data.folderId}`);
      
      return { success: true, folder: updatedFolder };
    }

    // Create new folder
    const [newFolder] = await db
      .insert(folders)
      .values({
        userId: user.id,
        name: data.name || "Untitled Folder",
        color: data.color || null,
        parentId: data.parentId || null,
      })
      .returning();

    revalidatePath("/folders");
    
    return { success: true, folder: newFolder };
  } catch (error) {
    console.error("Error saving folder:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save folder" 
    };
  }
}

export async function getFolder(folderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      throw new Error("Folder not found");
    }

    if (folder.userId !== user.id) {
      throw new Error("Unauthorized");
    }

    return { success: true, folder };
  } catch (error) {
    console.error("Error fetching folder:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch folder" 
    };
  }
}

export async function deleteFolder(folderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    await db
      .delete(folders)
      .where(eq(folders.id, folderId));

    revalidatePath("/folders");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete folder" 
    };
  }
}
