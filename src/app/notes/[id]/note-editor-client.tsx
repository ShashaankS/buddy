// app/dashboard/note/[id]/note-editor-client.tsx
"use client";

import NoteEditor from "@/components/note-editor";
import { saveNote } from "@/app/actions/notes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"; // Install: npm install sonner

interface NoteEditorClientProps {
  noteId?: string;
  initialTitle: string;
  initialContent: any;
  initialFolderId?: string;
  initialTags?: string[];
  initialIsPinned?: boolean;
}

export default function NoteEditorClient({
  noteId,
  initialTitle,
  initialContent,
  initialFolderId,
  initialTags,
  initialIsPinned,
}: NoteEditorClientProps) {
  const router = useRouter();
  const [currentNoteId, setCurrentNoteId] = useState(noteId);
  const [folderId, setFolderId] = useState(initialFolderId);

  const handleSave = async (title: string, content: any) => {
    try {
      const result = await saveNote({
        noteId: currentNoteId,
        title,
        content, // This will be saved as JSON
        folderId: folderId,
        tags: initialTags,
        isPinned: initialIsPinned,
      });

      if (result.success && result.note) {
        // If this was a new note, update the URL and state
        if (!currentNoteId) {
          setCurrentNoteId(result.note.id);
          router.replace(`/notes/${result.note.id}`);
        }
        
        toast.success("Note saved successfully!");
      } else {
        toast.error(result.error || "Failed to save note");
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save note");
      throw error;
    }
  };

  return (
    <NoteEditor
      noteId={currentNoteId}
      initialTitle={initialTitle}
      initialContent={initialContent}
      onSave={handleSave}
    />
  );
}