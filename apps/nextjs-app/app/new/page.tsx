'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { createNote } from '@/lib/db';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function NewNotePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('# New Note\n\nStart writing here...');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save notes');
      return;
    }

    try {
      setSaving(true);
      const noteId = await createNote(user.uid, content);
      toast.success('Note saved successfully');
      router.push(`/note/${noteId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">Please sign in to create notes</p>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                onClick={() => setViewMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                onClick={() => setViewMode('preview')}
              >
                Preview
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center"
          >
            <Save className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">
              {saving ? 'Saving...' : 'Save Note'}
            </span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {viewMode === 'edit' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[calc(100vh-300px)] p-4 font-mono text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start writing your note in Markdown..."
              />
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
