'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Share2, Loader2, Eye, Code, Edit2, Save } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { getNote, toggleNoteSharing, updateNote, type Note } from '@/lib/db';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<"preview" | "markdown" | "edit">("preview");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const fetchNote = async () => {
      try {
        const noteData = await getNote(params.id as string);
        if (!noteData) {
          setError('Note not found');
          return;
        }
        
        if (noteData.userId !== user.uid) {
          setError('You do not have permission to view this note');
          return;
        }

        setNote(noteData);
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id, user, authLoading, router]);

  const fallbackCopyTextToClipboard = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Prevent scrolling to bottom on iOS
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy to clipboard');
    }

    document.body.removeChild(textarea);
  };

  const copyToClipboard = async () => {
    if (!note) return;
    
    try {
      await navigator.clipboard.writeText(note.content);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleSharing = async () => {
    if (!note) return;

    try {
      const { isPublic, shareId } = await toggleNoteSharing(note.id);
      setNote({ ...note, isPublic, shareId });
      
      if (isPublic && shareId) {
        const shareUrl = `${window.location.origin}/shared/${shareId}`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Share link copied to clipboard!');
        } catch (err) {
          console.log('Clipboard API failed, using fallback.');
          fallbackCopyTextToClipboard(shareUrl);
        }
        // toast.success(`Share URL: ${shareUrl}`);
      } else {
        toast.success('Note is no longer shared');
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      toast.error('Failed to toggle sharing');
    }
  };

  const handleEdit = () => {
    setEditedContent(note?.content || "");
    setViewMode("edit");
  };

  const handleSaveEdit = async () => {
    if (!note) return;

    try {
      await updateNote(note.id, editedContent);
      setNote({ ...note, content: editedContent });
      setViewMode("preview");
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save changes');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b p-6 space-y-4 sm:space-y-0">
          <div className="flex flex-row sm:items-center gap-4 min-w-0 max-w-full sm:max-w-[60%]">
            <Link href="/">
              <Button variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold truncate min-w-0" title={note.title || 'Untitled Note'}>
              {note.title || 'Untitled Note'}
            </h1>
          </div>
          <div className="flex flex-row justify-between sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="bg-gray-100 rounded-lg p-1 flex flex-wrap gap-1 sm:flex-nowrap">
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button
                variant={viewMode === "markdown" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("markdown")}
                className="flex items-center gap-1"
              >
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Markdown</span>
              </Button>
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button 
                variant={note.isPublic ? "secondary" : "outline"} 
                size="sm"
                onClick={toggleSharing}
                className="flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{note.isPublic ? 'Shared' : 'Share'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {viewMode === "edit" ? (
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="font-mono min-h-[400px] p-4"
                placeholder="Edit your markdown here..."
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveEdit} className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : viewMode === "markdown" ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg">
                {note.content}
              </div>
            </div>
          ) : (
            <div className="prose max-w-none ">
              <div className="bg-white p-4 sm:p-6 rounded-lg [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
