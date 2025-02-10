'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserNotesWithWorkspaces, type WorkspaceNotesGroup, toggleNoteFavorite, toggleNoteShare } from '@/lib/db';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import NoteItem from './NoteItem';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import WorkspaceSelectDialog from './WorkspaceSelectDialog';
import ManageWorkspacesDialog from './ManageWorkspacesDialog';

export default function NoteList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<WorkspaceNotesGroup[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const fetchNotesAndWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const notesData = await getUserNotesWithWorkspaces(user.uid);
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotesAndWorkspaces();
  }, [fetchNotesAndWorkspaces]);

  const handleAddToWorkspace = (noteId: string) => {
    setSelectedNoteId(noteId);
    setShowWorkspaceDialog(true);
  };

  const handleToggleFavorite = async (noteId: string, isFavorite: boolean) => {
    try {
      await toggleNoteFavorite(noteId, isFavorite);
      toast.success(!isFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchNotesAndWorkspaces();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleToggleShare = async (noteId: string, isShared: boolean) => {
    try {
      const shareId = await toggleNoteShare(noteId);
      if (shareId) {
        const shareUrl = `${window.location.origin}/shared/${shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      } else {
        toast.success('Note is now private');
      }
      fetchNotesAndWorkspaces();
    } catch (error) {
      console.error('Error toggling share:', error);
      toast.error('Failed to update share status');
    }
  };

  const handleWorkspaceDialogClose = () => {
    setShowWorkspaceDialog(false);
    setSelectedNoteId(null);
    fetchNotesAndWorkspaces();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please sign in to view your notes</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Notes</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowManageDialog(true)} variant="outline">
              Manage Workspaces
            </Button>
            <Button asChild>
              <Link href="/note/new">
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {notes.slice().reverse().map((group) => (
            <div key={group.workspace.id ?? 'root'} className="space-y-4">
              <h2 className="text-lg font-semibold">
                {group.workspace.name}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({group.notes.length} {group.notes.length === 1 ? 'note' : 'notes'})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.notes.map((note) => (
                  <NoteItem 
                    key={note.id} 
                    note={note}
                    onDelete={fetchNotesAndWorkspaces}
                    onToggleFavorite={(noteId, isFavorite) => handleToggleFavorite(noteId, isFavorite)}
                    onAddToWorkspace={handleAddToWorkspace}
                    onToggleShare={handleToggleShare}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

          {selectedNoteId && (
            <WorkspaceSelectDialog
              open={showWorkspaceDialog}
              onOpenChange={(open) => !open && handleWorkspaceDialogClose()}
              noteId={selectedNoteId}
              onSuccess={fetchNotesAndWorkspaces}
            />
          )}

          <ManageWorkspacesDialog
            open={showManageDialog}
            onOpenChange={setShowManageDialog}
            onSuccess={fetchNotesAndWorkspaces}
          />
      </div>
    </div>
  );
}
