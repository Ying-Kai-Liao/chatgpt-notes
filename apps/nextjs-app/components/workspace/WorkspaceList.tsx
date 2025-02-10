import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getUserWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, type Workspace } from '@/lib/workspace';
import { useAuth } from '@/lib/auth-context';

interface WorkspaceItemProps {
  workspace: Workspace;
  onSelect: (workspace: Workspace) => void;
  selectedId?: string;
  level?: number;
}

const WorkspaceItem = ({ workspace, onSelect, selectedId, level = 0 }: WorkspaceItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [childWorkspaces, setChildWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (isExpanded) {
      loadChildWorkspaces();
    }
  }, [isExpanded]);

  const loadChildWorkspaces = async () => {
    const children = await getUserWorkspaces(workspace.userId, workspace.id);
    setChildWorkspaces(children);
  };

  const handleUpdate = async () => {
    await updateWorkspace(workspace.id, { name });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workspace and all its contents?')) {
      await deleteWorkspace(workspace.id);
      // Refresh the parent component
      window.location.reload();
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
          selectedId === workspace.id ? 'bg-gray-100' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {workspace.icon && (
          <span className="text-lg" role="img" aria-label={workspace.name}>
            {workspace.icon}
          </span>
        )}

        {isEditing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            className="h-8 w-48"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 truncate"
            onClick={() => onSelect(workspace)}
            style={{ color: workspace.color }}
          >
            {workspace.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {childWorkspaces.map((child) => (
            <WorkspaceItem
              key={child.id}
              workspace={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function WorkspaceList() {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    if (!user) return;
    const rootWorkspaces = await getUserWorkspaces(user.uid, null);
    setWorkspaces(rootWorkspaces);
  };

  const handleCreateWorkspace = async () => {
    if (!user || !newWorkspaceName.trim()) return;

    await createWorkspace(user.uid, newWorkspaceName);
    setNewWorkspaceName('');
    setIsCreating(false);
    loadWorkspaces();
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    router.push(`/workspace/${workspace.id}`);
  };

  if (!user) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="gap-1"
        >
          <FolderPlus className="h-4 w-4" />
          New
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 p-2">
          <Folder className="h-4 w-4" />
          <Input
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            onBlur={() => newWorkspaceName.trim() && handleCreateWorkspace()}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            placeholder="Workspace name"
            className="h-8"
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1">
        {workspaces.map((workspace) => (
          <WorkspaceItem
            key={workspace.id}
            workspace={workspace}
            onSelect={handleSelectWorkspace}
            selectedId={selectedWorkspace?.id}
          />
        ))}
      </div>
    </div>
  );
}
