import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db/index";
import { folders, notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
  FolderIcon,
  FileTextIcon,
  PlusIcon,
  ClockIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function FoldersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all user's folders
  const userFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, user.id))
    .orderBy(desc(folders.createdAt));

  // Fetch all user's notes to map to folders
  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.updatedAt));

  // Map folders with their 3 latest notes
  const foldersWithNotes = userFolders.map((folder) => {
    const folderNotes = userNotes
      .filter((note) => note.folderId === folder.id)
      .slice(0, 3);
    return {
      ...folder,
      latestNotes: folderNotes,
      totalNotes: userNotes.filter((note) => note.folderId === folder.id).length,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">All Folders</h1>
            <p className="text-muted-foreground text-lg">
              {userFolders.length} {userFolders.length === 1 ? 'folder' : 'folders'} in your collection
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/folders/create" className="gap-2">
              <PlusIcon className="h-5 w-5" />
              Create Folder
            </Link>
          </Button>
        </div>

        {/* Folders Grid */}
        {foldersWithNotes.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No folders yet</h3>
              <p className="text-muted-foreground mb-6">Create your first folder to organize your notes</p>
              <Button asChild>
                <Link href="/folders/create" className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create Folder
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foldersWithNotes.map((folder) => (
              <Card key={folder.id} className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                  <Link href={`/folders/${folder.id}`} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
                      <FolderIcon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate group-hover:text-primary transition-colors">
                        {folder.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(folder.createdAt!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                  </Link>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <FileTextIcon className="h-3 w-3" />
                      {folder.totalNotes} {folder.totalNotes === 1 ? 'note' : 'notes'}
                    </Badge>
                  </div>

                  {/* Latest 3 Notes */}
                  {folder.latestNotes.length > 0 ? (
                    <div className="space-y-2 flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Latest Notes:</p>
                      {folder.latestNotes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/notes/${note.id}`}
                          className="block p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <FileTextIcon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{note.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.updatedAt!).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-4">
                      <p className="text-xs text-muted-foreground">No notes yet</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/folders/${folder.id}`} className="gap-2">
                        View Folder
                        <ArrowRightIcon className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}