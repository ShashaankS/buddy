import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db/index";
import { folders as noteFolders, notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { FolderIcon, FileTextIcon, PlusIcon, ClockIcon, ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chatbot } from "@/components/chatbot";

export default async function DashboardPage() {
  // 1. AUTH CHECK
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2. FETCH RECENT FOLDERS (limit 6)
  const recentFolders = await db
    .select()
    .from(noteFolders)
    .where(eq(noteFolders.userId, user.id))
    .orderBy(desc(noteFolders.createdAt))
    .limit(6);

  // 3. FETCH RECENT NOTES (limit 8)
  const recentNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.createdAt))
    .limit(8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground text-lg">
            Organize your courses and notes in one place
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Link href="/folders/create">
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
                    <PlusIcon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      Create New Folder
                    </CardTitle>
                    <CardDescription>Organize your courses</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/notes/new`}>
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500 transition-colors">
                    <PlusIcon className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-green-600 transition-colors">
                      Create New Note
                    </CardTitle>
                    <CardDescription>Start writing instantly</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Folders Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FolderIcon className="h-6 w-6" />
              <h2 className="text-3xl font-bold tracking-tight">Recent Folders</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href={`/folders`} className="gap-2">
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentFolders.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No folders yet. Create your first one!</p>
                <Button asChild>
                  <Link href={`/folders/create`} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Create Folder
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentFolders.map((folder) => (
                <Link key={folder.id} href={`/folders/${folder.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
                          <FolderIcon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate group-hover:text-primary transition-colors">
                            {folder.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <ClockIcon className="h-3 w-3" />
                            {folder.createdAt && new Date(folder.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="gap-1">
                        <FileTextIcon className="h-3 w-3" />
                        {recentNotes.filter(n => n.folderId === folder.id).length} notes
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileTextIcon className="h-6 w-6" />
              <h2 className="text-3xl font-bold tracking-tight">Recent Notes</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href={`/notes`} className="gap-2">
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentNotes.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No notes yet. Start writing!</p>
                <Button asChild variant="default">
                  <Link href={`/notes/new`} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Create Note
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentNotes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`}>
                    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500 transition-colors">
                        <FileTextIcon className="h-4 w-4 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                      <CardTitle className="text-base truncate group-hover:text-green-600 transition-colors">
                        {note.title}
                      </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-muted-foreground mb-2">{recentFolders.find(f => f.id === note.folderId)?.name || "No folder"}</p>
                      <CardDescription className="flex items-center gap-1 text-xs">
                      <ClockIcon className="h-3 w-3" />
                      {note.createdAt && new Date(note.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      </CardDescription>
                    </CardContent>
                    </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Chatbot */}
      <Chatbot 
        notes={recentNotes.map(note => ({
          id: note.id,
          title: note.title,
          createdAt: note.createdAt || new Date(),
        }))}
        isLoggedIn={!!user}
      />
    </div>
  );
}