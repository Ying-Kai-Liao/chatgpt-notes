'use client';
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ViewMode } from "@/components/markdown/MarkdownEditor";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote, toggleNoteFavorite, deleteNote, toggleNoteShare } from "@/lib/db";
import { Note } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { NoteToolbar } from "@/components/note/note-toolbar";
import { ShareLinkCard } from "@/components/note/share-link-card";
import { NoteEditor } from "@/components/note/note-editor";
import PDFDocument from "@/components/pdf/PDFDocument";
import { pdf } from '@react-pdf/renderer';
import { ArrowUpToLine } from "lucide-react";

export default function TestNotePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const noteData = await getNote(id as string);
        if (!noteData) {
          setError('Note not found');
          return;
        }
        if (noteData.userId !== user?.uid) {
          setError('You do not have permission to view this note');
          return;
        }
        setNote(noteData);
        setContent(noteData.content);
        setTitle(noteData.title);
        if (noteData.isPublic && noteData.shareId) {
          setShareUrl(`${window.location.origin}/shared/${noteData.shareId}`);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNote();
    }
  }, [id, user]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = useCallback(async () => {
    if (!note || isSaving) return;

    setIsSaving(true);
    try {
      await updateNote(note.id, content);
      setNote(prev => prev ? { ...prev, title } : null);
      toast.success('Note saved');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [note, title, content, isSaving]);

  const handleShare = useCallback(async () => {
    if (!note) return;

    try {
      const shareId = await toggleNoteShare(note.id);
      setNote(prev => prev ? { ...prev, isPublic: !prev.isPublic, shareId: shareId || undefined } : null);

      if (!note.isPublic && shareId) {
        const url = `${window.location.origin}/shared/${shareId}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        toast.success('Share link copied to clipboard');
      } else {
        setShareUrl(null);
        toast.success('Note is no longer shared');
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      toast.error('Failed to share note');
    }
  }, [note]);

  const handleToggleFavorite = useCallback(async () => {
    if (!note) return;

    try {
      await toggleNoteFavorite(note.id, !note.isFavorite);
      setNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      toast.success(note.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to toggle favorite');
    }
  }, [note]);

  const handleDelete = useCallback(async () => {
    if (!note) return;

    try {
      await deleteNote(note.id);
      toast.success('Note deleted');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  }, [note]);

  const handleCopyAll = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  }, [content]);

  const handleExportPdf = useCallback(async () => {
    try {
      setExportingPdf(true);
      const doc = <PDFDocument title={title} content={content} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF file downloaded');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  }, [title, content]);

  const handleExportMarkdown = useCallback(() => {
    const markdownContent = `# ${title}\n\n${content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded');
  }, [title, content]);

  const handleTitleChange = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleContentChange = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
      });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading note..." />;
  }

  if (error || !note) {
    return <ErrorMessage title={error || "Note not found"} />;
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-8 lg:px-0">
      <NoteToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        isPublic={note.isPublic}
        isFavorite={note.isFavorite || false}
        exportingPdf={exportingPdf}
        onShare={handleShare}
        onToggleFavorite={handleToggleFavorite}
        onDelete={() => setShowDeleteDialog(true)}
        onExportPdf={handleExportPdf}
        onExportMarkdown={handleExportMarkdown}
        onCopyAll={handleCopyAll}
      />

      {shareUrl && <ShareLinkCard url={shareUrl} />}

      <NoteEditor
        title={title}
        content={content}
        updatedAt={note.updatedAt}
        viewMode={viewMode}
        onTitleChange={(e) => setTitle(e.target.value)}
        onTitleBlur={handleTitleChange}
        onContentChange={setContent}
        onContentBlur={handleContentChange}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 bg-background shadow-md hover:bg-accent"
          onClick={scrollToTop}
        >
          <ArrowUpToLine className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
