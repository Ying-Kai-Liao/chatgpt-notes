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
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
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
        <CardHeader className="flex flex-row items-center justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{note.title || 'Untitled Note'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant={viewMode === "markdown" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("markdown")}
                className="flex items-center gap-1"
              >
                <Code className="h-4 w-4" />
                Markdown
              </Button>
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant={note.isPublic ? "secondary" : "outline"} 
              size="sm"
              onClick={toggleSharing}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {note.isPublic ? 'Shared' : 'Share'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
            <div className="prose max-w-none">
              <div className="bg-white p-6 rounded-lg border">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
