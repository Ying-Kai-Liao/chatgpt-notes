'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, Share2, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { getNote, toggleNoteSharing, type Note } from '@/lib/db';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewRaw, setViewRaw] = useState(false);

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
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewRaw(!viewRaw)}>
              {viewRaw ? 'View Rendered' : 'View Raw'}
            </Button>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button 
              variant={note?.isPublic ? "secondary" : "outline"}
              onClick={toggleSharing}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {note?.isPublic ? 'Shared' : 'Share'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {viewRaw ? (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {note?.content}
              </pre>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{note?.content || ''}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
