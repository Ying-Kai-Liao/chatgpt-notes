import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Textarea } from "@/components/ui/textarea";
import MermaidRenderer from '../MermaidRenderer';
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';
import type { Components } from 'react-markdown';

export type ViewMode = 'edit' | 'preview' | 'markdown';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function MarkdownEditor({ content, onChange, onBlur, viewMode }: MarkdownEditorProps) {
  const components: Components = {
    pre({ children }) {
      return (
        <div className="relative group">
          <pre className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg my-4 text-zinc-800 dark:text-zinc-200">
            {children}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700"
            onClick={() => {
              const content = children?.toString() || '';
              navigator.clipboard.writeText(content);
              toast.success("Code copied to clipboard");
            }}
          >
            Copy
          </Button>
        </div>
      );
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      if (language === 'mermaid') {
        return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
      }
      return (
        <code className={`${className} bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 rounded px-1 py-0.5`}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="w-full">
      {viewMode === 'edit' && (
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="min-h-[500px] font-mono text-base bg-background resize-none border-none focus-visible:ring-0 p-0"
          placeholder="Write your note here..."
        />
      )}
      {viewMode === 'preview' && (
        <div className="prose prose-zinc max-w-none">
          <div className="bg-background p-6 sm:p-8 rounded-lg space-y-4 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-gray-300 dark:border-gray-700 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 dark:border-gray-700 [&_td]:p-2 [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_h5]:break-words [&_h6]:break-words [&_p]:break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={components}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {viewMode === 'markdown' && (
        <pre className="bg-gray-100 dark:bg-gray-800 dark:text-zinc-200 p-4 rounded-lg overflow-auto mt-4">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}
