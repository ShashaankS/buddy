// app/dashboard/note/[id]/note-editor-client.tsx
"use client";

import NoteEditor from "@/components/note-editor";
import { saveNote, deleteNote } from "@/app/actions/notes";
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
  availableFolders?: Array<{ id: string; name: string; }>;
}

export default function NoteEditorClient({
  noteId,
  initialTitle,
  initialContent,
  initialFolderId,
  initialTags,
  initialIsPinned,
  availableFolders = [],
}: NoteEditorClientProps) {
  const router = useRouter();
  const [currentNoteId, setCurrentNoteId] = useState(noteId);
  const [folderId, setFolderId] = useState(initialFolderId);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleFolderChange = async (newFolderId: string | undefined) => {
    if (!currentNoteId) {
      setFolderId(newFolderId);
      return;
    }

    try {
      const result = await saveNote({
        noteId: currentNoteId,
        title: initialTitle,
        folderId: newFolderId || null,
      });

      if (result.success) {
        setFolderId(newFolderId);
        toast.success("Folder updated!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update folder");
      }
    } catch (error) {
      console.error("Folder change error:", error);
      toast.error("Failed to update folder");
    }
  };

  const handleDelete = async () => {
    if (!currentNoteId) return;

    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteNote(currentNoteId);
      if (result.success) {
        toast.success("Note deleted successfully!");
        router.push("/notes");
      } else {
        toast.error(result.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <NoteEditor
      noteId={currentNoteId}
      initialTitle={initialTitle}
      initialContent={initialContent}
      onSave={handleSave}
      currentFolderId={folderId}
      availableFolders={availableFolders}
      onFolderChange={handleFolderChange}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}