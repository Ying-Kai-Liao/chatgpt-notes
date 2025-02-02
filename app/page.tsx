/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Loader2, LinkIcon, Eye, Code } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createNote } from "@/lib/db";
import { AuthForm } from "@/components/auth-form";
import { NoteList } from "@/components/NoteList";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { FlutedGlass } from "@/components/FlutedGlass";

export default function Home() {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"markdown" | "preview">("preview");
  const [useHeadless, setUseHeadless] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    setIsLoading(true);
    try {
      const endpoint = useHeadless ? "/api/headless-fetch" : "/api/convert";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: link,
          selector: ".markdown", // Always include selector since headless is default
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert conversation");
      }

      const markdown = data.markdown;
      setConvertedContent(markdown);
      
      // If user is logged in, save the note immediately
      if (user) {
        const noteId = await createNote(user.uid, markdown);
        router.push(`/note/${noteId}`);
      }
    } catch (error: unknown) {
      console.error("Error converting conversation:", error);
      toast.error((error as Error).message || 'Failed to convert conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!convertedContent || !user) return;
    
    try {
      const noteId = await createNote(user.uid, convertedContent);
      router.push(`/note/${noteId}`);
      // toast.success('Note saved successfully!');
    } catch (error: unknown) {
      console.error("Error saving note:", error);
      // toast.error((error as Error).message ?? 'Failed to save note');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-600 to-blue-200">
      <div className="fixed top-24 left-0 right-0 z-10 bg-none">
        <div className="container mx-auto px-4">
          <div className="h-[220px]">
            <FlutedGlass type="fluted">
              <Card className="w-full h-full bg-glassy">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-center text-white/80">
                    Convert LLM Chat to Markdown
                  </h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Input
                        type="url"
                        placeholder="Paste ChatGPT share link"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="flex-1 placeholder:text-white/70 text-white/80 outline-none ring-offset-background focus-visible:outline-none"
                      />
                      <div className="hidden items-center justify-between text-sm text-gray-500 ">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="headless"
                            checked={useHeadless}
                            onChange={(e) => setUseHeadless(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                      <label htmlFor="useHeadless" className="hidden text-sm text-gray-600">
                        Use headless browser (better for complex pages)
                      </label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !link}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Convert
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </FlutedGlass>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-[280px] pb-20">
        {convertedContent && (
          <div className="h-[500px]">
            <FlutedGlass type="cross">
              <Card className="w-full h-full bg-white/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-2xl font-bold">Converted Content</h2>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 rounded-lg p-1 flex">
                      <Button
                        variant={viewMode === "preview" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("preview")}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant={viewMode === "markdown" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("markdown")}
                        className="flex items-center gap-1"
                      >
                        <Code className="h-4 w-4" />
                        Markdown
                      </Button>
                    </div>
                    {user && (
                      <Button onClick={handleSave} variant="outline">
                        Save as Note
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === "markdown" ? (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg">
                        {convertedContent}
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <div className="bg-white p-6 rounded-lg border">
                        <ReactMarkdown>{convertedContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FlutedGlass>
          </div>
        )}

        {user && <NoteList />}
      </div>
    </div>
  );
}
