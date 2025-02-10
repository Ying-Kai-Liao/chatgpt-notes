'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WorkspaceList from '@/components/workspace/WorkspaceList';
import { useAuth } from '@/lib/auth-context';
import { getWorkspace, type Workspace } from '@/lib/workspace';
import { getUserNotes, createNote, type Note } from '@/lib/db';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadWorkspaceAndNotes();
  }, [user, params.id]);

  const loadWorkspaceAndNotes = async () => {
    if (!params.id || typeof params.id !== 'string') return;

    try {
      const [workspaceData, notesData] = await Promise.all([
        getWorkspace(params.id),
        getUserNotes(user!.uid, params.id),
      ]);

      setWorkspace(workspaceData);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !workspace) return;

    try {
      const noteId = await createNote(user.uid, '# New Note\n', workspace.id);
      router.push(`/note/${noteId}`);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50">
        <WorkspaceList />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : workspace ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: workspace.color }}>
                  {workspace.icon} {workspace.name}
                </h1>
                {workspace.description && (
                  <p className="text-gray-600 mt-1">{workspace.description}</p>
                )}
              </div>
              <Button onClick={handleCreateNote} className="gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/note/${note.id}`)}
                >
                  <h3 className="font-medium mb-2">{note.title}</h3>
                  <p className="text-sm text-gray-600">
                    Last updated:{' '}
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Workspace not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
