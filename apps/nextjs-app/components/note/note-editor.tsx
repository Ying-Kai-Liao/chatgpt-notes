import { Timestamp } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor, ViewMode } from "@/components/markdown/MarkdownEditor";
import { formatRelativeDate } from "@/lib/utils/date";

interface NoteEditorProps {
  title: string;
  content: string;
  updatedAt: Timestamp | null;
  viewMode: ViewMode;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleBlur: () => void;
  onContentChange: (value: string) => void;
  onContentBlur: () => void;
}

export function NoteEditor({
  title,
  content,
  updatedAt,
  viewMode,
  onTitleChange,
  onTitleBlur,
  onContentChange,
  onContentBlur
}: NoteEditorProps) {
  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex-1 flex flex-col">
          <div className="border-b border-input">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={title}
                onChange={onTitleChange}
                onBlur={onTitleBlur}
                className="w-full text-sm font-bold border-none focus:ring-0 px-0 pb-2 bg-transparent outline-none"
                placeholder="Untitled Note"
              />
              {updatedAt && (
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  Last edited {formatRelativeDate(updatedAt)}
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <MarkdownEditor
              content={content}
              onChange={onContentChange}
              onBlur={onContentBlur}
              viewMode={viewMode}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
