'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type Note } from '@/lib/db';
import  NoteItem from './NoteItem';

interface WorkspaceNotesProps {
  notes: Note[];
  title: string;
  className?: string;
  onAddToWorkspace?: (noteId: string) => void;
  onToggleFavorite?: (noteId: string, isFavorite: boolean) => void;
}

export function WorkspaceNotes({
  notes,
  title,
  className,
  onAddToWorkspace,
  onToggleFavorite,
}: WorkspaceNotesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={className}>
      <div className="mb-4">
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center py-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h2 className="text-lg font-semibold">{title}</h2>
            <span className="text-sm text-gray-500">({notes.length})</span>
          </div>
        </Button>
      </div>

      {isExpanded && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={() => {}}
              onAddToWorkspace={onAddToWorkspace}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
          {notes.length === 0 && (
            <div className="col-span-full text-center py-4 text-gray-500">
              No notes in this workspace
            </div>
          )}
        </div>
      )}
    </div>
  );
}
