import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ViewMode } from "@/components/markdown/MarkdownEditor";
import { 
  ArrowLeft, 
  Share2, 
  Star, 
  Download, 
  Eye, 
  Code, 
  Edit, 
  Copy, 
  ArrowUpToLine,
  Trash2, 
  MoreVertical 
} from "lucide-react";
import Link from "next/link";

interface NoteToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isPublic: boolean;
  isFavorite: boolean;
  exportingPdf: boolean;
  onShare: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onExportPdf: () => void;
  onExportMarkdown: () => void;
  onCopyAll: () => void;
}

export function NoteToolbar({
  viewMode,
  setViewMode,
  isPublic,
  isFavorite,
  exportingPdf,
  onShare,
  onToggleFavorite,
  onDelete,
  onExportPdf,
  onExportMarkdown,
  onCopyAll,
}: NoteToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
          <Button
            variant={viewMode === "edit" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            variant={viewMode === "markdown" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("markdown")}
            className="flex items-center gap-1"
          >
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Markdown</span>
          </Button>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            className={isPublic ? 'text-green-500' : ''}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFavorite}
            className={isFavorite ? 'text-yellow-500' : ''}
          >
            {isFavorite ? (
              <Star className="h-4 w-4 fill-current" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={exportingPdf}
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportPdf} disabled={exportingPdf}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportMarkdown}>
                <ArrowUpToLine className="h-4 w-4 mr-2" />
                Export MD
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            onClick={onCopyAll}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile dropdown */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShare}>
                <Share2 className={`h-4 w-4 mr-2 ${isPublic ? 'text-green-500' : ''}`} />
                {isPublic ? 'Unshare' : 'Share'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                {isFavorite ? 'Unfavorite' : 'Favorite'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPdf} disabled={exportingPdf}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportMarkdown}>
                <Code className="h-4 w-4 mr-2" />
                Export MD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyAll}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
