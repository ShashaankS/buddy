// app/dashboard/notes/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db/index";
import { notes, folders } from "@/db/schema";
import { eq, desc, or, isNull } from "drizzle-orm";
import Link from "next/link";
import {
  FileTextIcon,
  PlusIcon,
  FolderIcon,
  ClockIcon,
  PinIcon,
  ArchiveIcon,
  SearchIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AllNotesPage() {
  // AUTH CHECK
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // FETCH ALL USER'S NOTES
  const userNotes = await db
    .select({
      note: notes,
      folder: folders,
    })
    .from(notes)
    .leftJoin(folders, eq(notes.folderId, folders.id))
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

  // SEPARATE NOTES BY STATUS
  const pinnedNotes = userNotes.filter(({ note }) => note.isPinned && !note.isArchived);
  const activeNotes = userNotes.filter(({ note }) => !note.isPinned && !note.isArchived);
  const archivedNotes = userNotes.filter(({ note }) => note.isArchived);

  // GET STATS
  const totalNotes = userNotes.length;
  const totalPinned = pinnedNotes.length;
  const totalArchived = archivedNotes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">All Notes</h1>
            <p className="text-muted-foreground text-lg">
              {totalNotes} {totalNotes === 1 ? 'note' : 'notes'} in your collection
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/notes/new" className="gap-2">
              <PlusIcon className="h-5 w-5" />
              Create Note
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Notes</CardDescription>
              <CardTitle className="text-3xl">{totalNotes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pinned Notes</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{totalPinned}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Archived Notes</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{totalArchived}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-10"
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Search functionality coming soon</p>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Notes ({activeNotes.length})</TabsTrigger>
            <TabsTrigger value="pinned">Pinned ({pinnedNotes.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedNotes.length})</TabsTrigger>
          </TabsList>

          {/* All Notes Tab */}
          <TabsContent value="all" className="space-y-4">
            {pinnedNotes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PinIcon className="h-5 w-5 text-yellow-600" />
                  Pinned Notes
                </h2>
                <NotesGrid notes={pinnedNotes} />
              </div>
            )}

            {activeNotes.length > 0 ? (
              <div className="space-y-4">
                {pinnedNotes.length > 0 && (
                  <h2 className="text-xl font-semibold">Other Notes</h2>
                )}
                <NotesGrid notes={activeNotes} />
              </div>
            ) : pinnedNotes.length === 0 ? (
              <EmptyState
                icon={FileTextIcon}
                title="No notes yet"
                description="Create your first note to get started"
                actionText="Create Note"
                actionHref="/notes/new"
              />
            ) : null}
          </TabsContent>

          {/* Pinned Tab */}
          <TabsContent value="pinned" className="space-y-4">
            {pinnedNotes.length > 0 ? (
              <NotesGrid notes={pinnedNotes} />
            ) : (
              <EmptyState
                icon={PinIcon}
                title="No pinned notes"
                description="Pin important notes to find them quickly"
              />
            )}
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived" className="space-y-4">
            {archivedNotes.length > 0 ? (
              <NotesGrid notes={archivedNotes} />
            ) : (
              <EmptyState
                icon={ArchiveIcon}
                title="No archived notes"
                description="Archived notes will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Notes Grid Component
function NotesGrid({ notes }: { notes: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map(({ note, folder }) => (
        <Link key={note.id} href={`/notes/${note.id}`}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500 transition-colors">
                    <FileTextIcon className="h-4 w-4 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  {note.isPinned && (
                    <PinIcon className="h-4 w-4 text-yellow-600 shrink-0" />
                  )}
                  {note.isArchived && (
                    <ArchiveIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>
              <CardTitle className="text-base truncate group-hover:text-green-600 transition-colors">
                {note.title || "Untitled Note"}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <ClockIcon className="h-3 w-3" />
                {new Date(note.updatedAt!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {/* Folder Badge */}
              {folder && (
                <Badge variant="outline" className="gap-1">
                  <FolderIcon className="h-3 w-3" />
                  {folder.name}
                </Badge>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
}: {
  icon: any;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Icon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          {description}
        </p>
        {actionText && actionHref && (
          <Button asChild>
            <Link href={actionHref} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              {actionText}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}