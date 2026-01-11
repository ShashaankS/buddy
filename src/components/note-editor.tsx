"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { common, createLowlight } from 'lowlight';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Link2,
  Underline as UnderlineIcon,
  Save,
  ArrowLeft,
  Clock,
  Trash2,
  FolderIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(common);

interface NoteEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: any;
  onSave?: (title: string, content: any) => Promise<void>;
  currentFolderId?: string;
  availableFolders?: Array<{ id: string; name: string; }>;
  onFolderChange?: (folderId: string | undefined) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function NoteEditor({
  noteId,
  initialTitle = '',
  initialContent = null,
  onSave,
  currentFolderId,
  availableFolders = [],
  onFolderChange,
  onDelete,
  isDeleting = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const router = useRouter();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your notes...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] px-4 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      debouncedSave(title, editor.getJSON());
    },
  });

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (currentTitle: string, content: any) => {
      if (!onSave) return;
      
      setSaveStatus('saving');
      setIsSaving(true);
      
      try {
        await onSave(currentTitle, content);
        setLastSaved(new Date());
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save:', error);
        setSaveStatus('unsaved');
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [onSave]
  );

  // Save on title change
  useEffect(() => {
    if (title !== initialTitle && editor) {
      setSaveStatus('unsaved');
      debouncedSave(title, editor.getJSON());
    }
  }, [title, initialTitle, editor, debouncedSave]);

  const handleLinkAdd = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageUpload = () => {
    const url = window.prompt('Enter Image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }
  const handleManualSave = async () => {
    if (!editor || !onSave) return;
    
    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      await onSave(title, editor.getJSON());
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  };

  const MenuButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    tooltip 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
              'h-8 w-8 p-0',
              isActive && 'bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Note"
                className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 max-w-md"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Folder Selector */}
              {availableFolders.length > 0 && (
                <Select
                  value={currentFolderId || "none"}
                  onValueChange={(value) => onFolderChange?.(value === "none" ? undefined : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <div className="flex items-center gap-2">
                      {/* <FolderIcon className="h-4 w-4" /> */}
                      <SelectValue placeholder="No folder" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        No folder
                      </div>
                    </SelectItem>
                    {availableFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Save Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {saveStatus === 'saving' && (
                  <>
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && lastSaved && (
                  <>
                    <Save className="h-4 w-4 text-green-600" />
                    <span>Saved {formatTimeAgo(lastSaved)}</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Unsaved changes</span>
                  </>
                )}
              </div>

              <Button
                onClick={() => debouncedSave.flush()}
                disabled={isSaving || saveStatus === 'saved'}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
              
              {noteId && onDelete && (
                <Button
                  onClick={onDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-[73px] z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 pr-2 border-r">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                tooltip="Bold (Ctrl+B)"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                tooltip="Italic (Ctrl+I)"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                icon={UnderlineIcon}
                tooltip="Underline (Ctrl+U)"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                tooltip="Strikethrough"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                icon={Code}
                tooltip="Inline Code"
              />
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 px-2 border-r">
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                icon={Heading1}
                tooltip="Heading 1"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                icon={Heading2}
                tooltip="Heading 2"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                icon={Heading3}
                tooltip="Heading 3"
              />
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 px-2 border-r">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                tooltip="Bullet List"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                tooltip="Numbered List"
              />
              <MenuButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                tooltip="Quote"
              />
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 px-2 border-r">
              <MenuButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                icon={AlignLeft}
                tooltip="Align Left"
              />
              <MenuButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                icon={AlignCenter}
                tooltip="Align Center"
              />
              <MenuButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                icon={AlignRight}
                tooltip="Align Right"
              />
            </div>

            {/* Media & Links */}
            <div className="flex items-center gap-1 px-2 border-r">
              <MenuButton
                onClick={handleImageUpload}
                icon={ImageIcon}
                tooltip="Insert Image"
              />
              <MenuButton
                onClick={handleLinkAdd}
                isActive={editor.isActive('link')}
                icon={Link2}
                tooltip="Add Link"
              />
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 px-2">
              <MenuButton
                onClick={() => editor.chain().focus().undo().run()}
                icon={Undo}
                tooltip="Undo (Ctrl+Z)"
              />
              <MenuButton
                onClick={() => editor.chain().focus().redo().run()}
                icon={Redo}
                tooltip="Redo (Ctrl+Y)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-none shadow-none">
          <EditorContent editor={editor} />
        </Card>
      </div>
    </div>
  );
}

// Utility Functions
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { flush: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
      lastArgs = null;
    }, wait);
  } as T & { flush: () => void };

  debounced.flush = function () {
    if (timeout) {
      clearTimeout(timeout);
      if (lastArgs) {
        func.apply(null, lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }
  };

  return debounced;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}