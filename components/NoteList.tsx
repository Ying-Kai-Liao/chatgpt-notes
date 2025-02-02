"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { getUserNotes, deleteNote, type Note } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export function NoteList({ className }: { className?: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userNotes = await getUserNotes(user.uid);
      // Sort notes by creation date, newest first
      userNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setNotes(userNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchNotes();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.preventDefault(); // Prevent navigation
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully");
      // Refresh the notes list
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            No notes yet. Convert your first ChatGPT conversation!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Your Notes</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {notes.map((note) => (
          <div key={note.id} className="group relative">
            <Link href={`/note/${note.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="p-4 space-y-1">
                  <h3
                    className="font-medium text-base sm:text-lg truncate"
                    title={note.title}
                  >
                    {note.title || 'Untitled Note'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(e, note.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
