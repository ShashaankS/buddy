// app/dashboard/note/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getNote } from "@/app/actions/notes";
import { db } from "@/db/index";
import { folders } from "@/db/schema";
import { eq } from "drizzle-orm";
import NoteEditorClient from "./note-editor-client";

export default async function NotePage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { id } = await params;
  const { folderId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  // Treat both /notes/new and legacy /notes/create as new-note routes
  const isNewNote = id === "new" || id === "create";

  // Fetch note if editing existing note
  let note = null;
  if (!isNewNote) {
    const result = await getNote(id);
    if (result.success && result.note) {
      note = result.note;
    }
  }

  // Fetch user's folders for the folder selector
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
    })
    .from(folders)
    .where(eq(folders.userId, user.id));

  return (
    <NoteEditorClient 
      noteId={isNewNote ? undefined : id}
      initialTitle={note?.title || ""}
      initialContent={note?.content || null}
      initialFolderId={note?.folderId || folderId || undefined}
      initialTags={note?.tags || []}
      initialIsPinned={note?.isPinned || false}
      availableFolders={userFolders}
    />
  );
}