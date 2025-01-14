/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createNote } from "@/lib/db";
import { AuthForm } from "@/components/auth-form";
import { NoteList } from "@/components/NoteList";

export default function Home() {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert conversation");
      }

      const noteId = await createNote(user.uid, data.markdown);

      router.push(`/note/${noteId}`);
    } catch (error: any) {
      console.error("Error converting conversation:", error);
      // toast.error(error.message || 'Failed to convert conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto mb-8">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">
            {user ? "Convert ChatGPT Conversation" : "Sign in to Continue"}
          </h2>
        </CardHeader>
        <CardContent>
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="url"
                  placeholder="Paste ChatGPT share link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Convert to Markdown
                  </>
                )}
              </Button>
            </form>
          ) : (
            <AuthForm />
          )}
        </CardContent>
      </Card>

      {user && <NoteList />}
    </div>
  );
}
