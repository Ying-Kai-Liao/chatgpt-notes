"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WorkspaceList from "@/components/workspace/WorkspaceList";
import { useAuth } from "@/lib/auth-context";
import { getWorkspace, type Workspace } from "@/lib/workspace";
import { getUserNotes, createNote, type Note } from "@/lib/db";
import toast from "react-hot-toast";

export default function WorkspacePage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      
      if (!user) {
        toast.error("Please sign in to view this workspace");
        router.push("/");
        return;
      }

      if (!params.id || typeof params.id !== "string") {
        toast.error("Invalid workspace ID");
        router.push("/");
        return;
      }

      try {
        const workspace = await getWorkspace(params.id);
        if (!workspace) {
          toast.error("Workspace not found");
          router.push("/");
          return;
        }
        setWorkspace(workspace);

        const notes = await getUserNotes(user.uid, params.id);
        setNotes(notes);
      } catch (error) {
        console.error("Error loading workspace:", error);
        toast.error("Failed to load workspace");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, params.id, router, authLoading]);

  const handleCreateNote = async () => {
    if (!user || !workspace) return;
    try {
      const noteId = await createNote(user.uid, "# New Note\n", workspace.id);
      router.push(`/note/${noteId}`);
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !workspace) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-8">
        <div className="w-64 flex-none">
          <WorkspaceList />
        </div>

        <div className="flex-1">
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: workspace.color }}
                >
                  {workspace.icon} {workspace.name}
                </h1>
                {workspace.description && (
                  <p className="text-gray-500 mt-1">{workspace.description}</p>
                )}
              </div>
              <Button onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" />
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
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(note.updatedAt.toDate()).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                </Card>
              ))}
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
