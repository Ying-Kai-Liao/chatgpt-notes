'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Edit } from "lucide-react";
import { getNoteByShareId, type Note } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { createNote } from '@/lib/db';
import toast from 'react-hot-toast';

export default function SharedNotePage() {
  const params = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const noteData = await getNoteByShareId(params.shareId as string);
        if (!noteData) {
          setError('Note not found or is no longer shared');
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
  }, [params.shareId]);

  if (loading) {
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

  if (!note) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {user && (note.userId === user.uid ? (
            <Button asChild className="flex items-center">
              <Link href={`/note/${note.id}`}>
                <Edit className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Edit Note</span>
              </Link>
            </Button>
          ) : (
            <Button
              onClick={async () => {
                try {
                  await createNote(user.uid, note.content);
                  toast.success('Note saved to your collection');
                } catch (error) {
                  console.error('Error saving note:', error);
                  toast.error('Failed to save note');
                }
              }}
              className="flex items-center"
            >
              <Save className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Save to My Notes</span>
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">{note.title || 'Untitled Note'}</h1>
            <div className="prose max-w-none">
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
