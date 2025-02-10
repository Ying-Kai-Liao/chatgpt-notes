'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from '@/lib/auth-context';
import { Loader2, Plus, MoreVertical } from 'lucide-react';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import toast from 'react-hot-toast';

interface ManageWorkspacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ManageWorkspacesDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManageWorkspacesDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchWorkspaces = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserWorkspaces(user.uid);
      setWorkspaces(data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWorkspaces();
    }
  }, [open, user]);

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? Notes in this workspace will be moved to root.')) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      toast.success('Workspace deleted successfully');
      await fetchWorkspaces();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const handleCreateSuccess = async () => {
    setShowCreateDialog(false);
    await fetchWorkspaces();
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Manage Workspaces</DialogTitle>
            <DialogDescription>
              Create, edit, or delete your workspaces. Notes in deleted workspaces will be moved to root.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="w-full mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>

            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No workspaces yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <span className="font-medium">{workspace.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteWorkspace(workspace.id)}
                            className="text-red-500"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
