// app/dashboard/note/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getNote } from "@/app/actions/notes";
import NoteEditorClient from "./note-editor-client";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return (
    <NoteEditorClient 
      noteId={isNewNote ? undefined : id}
      initialTitle={note?.title || ""}
      initialContent={note?.content || null}
      initialFolderId={note?.folderId || undefined}
      initialTags={note?.tags || []}
      initialIsPinned={note?.isPinned || false}
    />
  );
}