'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserWorkspaces, deleteWorkspace, type Workspace } from '@/lib/workspace';
import { moveNoteToWorkspace } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Plus, MoreVertical } from 'lucide-react';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import toast from 'react-hot-toast';

interface WorkspaceSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  onSuccess?: () => void;
}

export default function WorkspaceSelectDialog({
  open,
  onOpenChange,
  noteId,
  onSuccess,
}: WorkspaceSelectDialogProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user } = useAuth();

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    
    try {
      const userWorkspaces = await getUserWorkspaces(user.uid);
      setWorkspaces(userWorkspaces);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchWorkspaces();
    }
  }, [open, user, fetchWorkspaces]);

  const handleMoveToWorkspace = async (workspaceId: string | null) => {
    try {
      setMoving(true);
      await moveNoteToWorkspace(noteId, workspaceId);
      toast.success('Note moved successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving note:', error);
      toast.error('Failed to move note');
    } finally {
      setMoving(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? All notes will be moved to "My Notes".')) {
      return;
    }

    try {
      setDeleting(workspaceId);
      await deleteWorkspace(workspaceId);
      toast.success('Workspace deleted successfully');
      fetchWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Move to Workspace</DialogTitle>
            <DialogDescription>
              Choose a workspace to move this note to
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {/* Root workspace option */}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleMoveToWorkspace(null)}
                    disabled={moving}
                  >
                    My Notes (No Workspace)
                  </Button>

                  {/* Workspace options */}
                  {workspaces.map((workspace) => (
                    <div key={workspace.id} className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="flex-1 justify-start"
                        onClick={() => handleMoveToWorkspace(workspace.id)}
                        disabled={moving || deleting === workspace.id}
                      >
                        {workspace.name}
                        {deleting === workspace.id && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={moving || deleting === workspace.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteWorkspace(workspace.id)}
                          >
                            Delete Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {workspaces.length === 0 && (
                    <p className="text-center text-sm text-gray-500 py-4">
                      No workspaces found. Create one below.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateDialog(true)}
              disabled={moving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchWorkspaces}
      />
    </>
  );
}
