import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getFolder } from "@/app/actions/folders";
import { db } from "@/db/index";
import { notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import FolderClient from "./folder-client";

export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  // Treat /folders/new or /folders/create as new folder routes
  const isNewFolder = id === "new" || id === "create";

  // Fetch folder if editing existing folder
  let folder = null;
  let folderNotes: Array<{
    id: string;
    title: string;
    updatedAt: Date | null;
    isPinned: boolean | null;
  }> = [];
  
  // Fetch all user notes for the "Add Existing Note" dialog
  let allUserNotes: Array<{
    id: string;
    title: string;
    folderId: string | null;
    updatedAt: Date | null;
  }> = [];

  if (!isNewFolder) {
    const result = await getFolder(id);
    if (result.success && result.folder) {
      folder = result.folder;

      // Fetch all notes in this folder
      folderNotes = await db
        .select({
          id: notes.id,
          title: notes.title,
          updatedAt: notes.updatedAt,
          isPinned: notes.isPinned,
        })
        .from(notes)
        .where(eq(notes.folderId, id))
        .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

      // Fetch all user's notes for adding to folder
      allUserNotes = await db
        .select({
          id: notes.id,
          title: notes.title,
          folderId: notes.folderId,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .where(eq(notes.userId, user.id))
        .orderBy(desc(notes.updatedAt));
    }
  }

  return (
    <FolderClient 
      folderId={isNewFolder ? undefined : id}
      initialName={folder?.name || ""}
      allUserNotes={allUserNotes}
      initialColor={folder?.color}
      folderNotes={folderNotes}
    />
  );
}