"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFolder, deleteFolder } from "@/app/actions/folders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Trash2,
  FolderIcon,
  FileTextIcon,
  PlusIcon,
  ClockIcon,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import AddNotesDialog from "./add-notes-dialog";

interface FolderClientProps {
  folderId?: string;
  initialName: string;
  initialColor?: string | null;
  folderNotes: Array<{
    id: string;
    title: string;
    updatedAt: Date | null;
    isPinned: boolean | null;
  }>;
  allUserNotes: Array<{
    id: string;
    title: string;
    folderId: string | null;
    updatedAt: Date | null;
  }>;
}

export default function FolderClient({
  folderId,
  initialName,
  initialColor,
  folderNotes,
  allUserNotes,
}: FolderClientProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor || "#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveFolder({
        folderId,
        name,
        color,
      });

      if (result.success && result.folder) {
        if (!folderId) {
          router.replace(`/folders/${result.folder.id}`);
        }
      } else {
        alert(result.error || "Failed to save folder");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save folder");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!folderId) return;
    
    if (!confirm("Are you sure you want to delete this folder? Notes will not be deleted.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteFolder(folderId);
      if (result.success) {
        router.push("/folders");
      } else {
        alert(result.error || "Failed to delete folder");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-3 flex-1 max-w-2xl">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  <FolderIcon className="h-5 w-5" style={{ color }} />
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Folder Name"
                  className="text-xl font-semibold border-none shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              {folderId && (
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notes">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Notes ({folderNotes.length})
            </TabsTrigger>
            <TabsTrigger value="timetable">
              <Calendar className="h-4 w-4 mr-2" />
              Timetable
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Folder Notes</h2>
              {folderId && (
                <div className="flex gap-2">
                  <AddNotesDialog folderId={folderId} availableNotes={allUserNotes} />
                  <Button asChild>
                    <Link href={`/notes/new?folderId=${folderId}`} className="gap-2">
                      <PlusIcon className="h-4 w-4" />
                      New Note
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {folderNotes.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No notes in this folder yet</p>
                  {folderId && (
                    <Button asChild>
                      <Link href={`/notes/new?folderId=${folderId}`} className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Create Note
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folderNotes.map((note) => (
                  <Link key={note.id} href={`/notes/${note.id}`}>
                    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500 transition-colors">
                              <FileTextIcon className="h-4 w-4 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            {note.isPinned && (
                              <Badge variant="secondary" className="text-xs">
                                Pinned
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base truncate group-hover:text-green-600 transition-colors">
                          {note.title || "Untitled Note"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <ClockIcon className="h-3 w-3" />
                          {note.updatedAt
                            ? new Date(note.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : "N/A"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Folder Timetable
                </CardTitle>
                <CardDescription>
                  Create a study schedule for this folder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Placeholder for timetable functionality */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Timetable Coming Soon</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Plan your study sessions and track your progress
                    </p>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Set study times for each day</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Create recurring study sessions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileTextIcon className="h-4 w-4" />
                        <span>Link notes to specific sessions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
