'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Trash2,
  FolderPlus,
  Share2,
  Copy,
  Star,
  StarOff,
  Edit,
} from 'lucide-react';
import { deleteNote, type Note } from '@/lib/db';
import toast from 'react-hot-toast';

interface NoteItemProps {
  note: Note;
  onDelete: () => void;
  onAddToWorkspace?: (noteId: string) => void;
  onToggleFavorite?: (noteId: string, isFavorite: boolean) => void;
  onToggleShare?: (noteId: string, isShared: boolean) => void;
}

export default function NoteItem({
  note,
  onDelete,
  onAddToWorkspace,
  onToggleFavorite,
  onToggleShare,
}: NoteItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      setIsDeleting(true);
      await deleteNote(note.id);
      toast.success('Note deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!note.shareId) return;
    navigator.clipboard.writeText(`${window.location.origin}/shared/${note.shareId}`);
    toast.success('Share link copied to clipboard');
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleFavorite?.(note.id, !note.isFavorite);
  };

  const handleToggleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleShare?.(note.id, !note.isPublic);
  };

  const handleAddToWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToWorkspace?.(note.id);
  };

  return (
    <Link href={`/note/${note.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-lg line-clamp-1">{note.title || 'Untitled'}</h3>
            {note.isPublic && (
              <div className="flex items-center text-sm text-blue-600">
                <Share2 className="h-4 w-4" />
              </div>
            )}
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
                disabled={isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                window.location.href = `/note/${note.id}/edit`;
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddToWorkspace}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add to Workspace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite}>
                {note.isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleShare}>
                <Share2 className={`h-4 w-4 mr-2 ${note.isPublic ? 'text-green-500' : ''}`} />
                {note.isPublic ? 'Make Private' : 'Share Note'}
              </DropdownMenuItem>
              {note.isPublic && (
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 line-clamp-2">{note.content}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(note.updatedAt.toDate()).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
