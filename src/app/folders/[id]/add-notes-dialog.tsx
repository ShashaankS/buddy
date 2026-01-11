"use client";

import { useState } from "react";
import { saveNote } from "@/app/actions/notes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, PlusIcon, SearchIcon, FolderPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddNotesDialogProps {
  folderId: string;
  availableNotes: Array<{
    id: string;
    title: string;
    folderId: string | null;
    updatedAt: Date | null;
  }>;
}

export default function AddNotesDialog({ folderId, availableNotes }: AddNotesDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addingNoteId, setAddingNoteId] = useState<string | null>(null);

  // Filter notes that are not in any folder or in a different folder
  const unassignedNotes = availableNotes.filter(
    (note) => !note.folderId || note.folderId !== folderId
  );

  const filteredNotes = unassignedNotes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNote = async (noteId: string) => {
    setAddingNoteId(noteId);
    try {
      const note = availableNotes.find((n) => n.id === noteId);
      if (!note) return;

      const result = await saveNote({
        noteId: note.id,
        title: note.title,
        content: null, // Keep existing content
        folderId: folderId,
      });

      if (result.success) {
        router.refresh();
        setOpen(false);
        setSearch("");
      } else {
        alert(result.error || "Failed to add note to folder");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note to folder");
    } finally {
      setAddingNoteId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlusIcon className="h-4 w-4 mr-2" />
          Add Existing Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Existing Notes to Folder</DialogTitle>
          <DialogDescription>
            Select notes to add to this folder. Notes can be moved between folders.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "No notes found matching your search" : "No notes available to add"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                      <FileTextIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{note.title || "Untitled Note"}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.folderId ? (
                          <Badge variant="secondary" className="mt-1">
                            In another folder
                          </Badge>
                        ) : (
                          <span>Not in any folder</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddNote(note.id)}
                    disabled={addingNoteId === note.id}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {addingNoteId === note.id ? "Adding..." : "Add"}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
