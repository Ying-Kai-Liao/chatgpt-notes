'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Share2, 
  Save, 
  Trash2, 
  Star, 
  Download, 
  Eye, 
  Code, 
  Edit, 
  Copy, 
  ArrowUpToLine, 
  MoreVertical 
} from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import {
  getNote,
  updateNote,
  deleteNote,
  toggleNoteShare,
  toggleNoteFavorite,
  Note,
} from '@/lib/db';
import toast from 'react-hot-toast';
import { Document, Page, Text, View, Link as PdfLink, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { marked } from 'marked';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MermaidRenderer from '../../../components/MermaidRenderer';

// Register font for Chinese support
Font.register({
  family: 'Noto Sans TC',
  src: 'https://fonts.gstatic.com/ea/notosanstc/v1/NotoSansTC-Regular.otf'
});

type ViewMode = 'edit' | 'preview' | 'markdown';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const noteData = await getNote(params.id as string);
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
  }, [params.id, user]);

  const handleSave = useCallback(async () => {
    if (!note || isSaving) return;

    setIsSaving(true);
    try {
      await updateNote(note.id, content);
      toast.success('Note saved');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [note, content, isSaving]);

  const handleDelete = useCallback(async () => {
    if (!note) return;

    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    try {
      await deleteNote(note.id);
      toast.success('Note deleted');
      router.push('/');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  }, [note, router]);

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
      const newValue = !note.isFavorite;
      await toggleNoteFavorite(note.id, newValue);
      setNote(prev => prev ? { ...prev, isFavorite: newValue } : null);
      toast.success(newValue ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  }, [note]);

  const handleCopyAll = useCallback((): void => {
    if (!note?.content) return;
    navigator.clipboard.writeText(note.content);
    toast.success('Content copied to clipboard');
  }, [note?.content]);

  const scrollToTop = useCallback((): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Create styles
  const styles = StyleSheet.create({
    page: {
      padding: 50,
      fontSize: 11,
      fontFamily: 'Noto Sans TC',
    },
    section: {
      marginBottom: 10,
    },
    heading1: {
      fontSize: 24,
      marginBottom: 16,
      fontWeight: 'bold',
      paddingTop: 16,
      fontFamily: 'Noto Sans TC',
    },
    heading2: {
      fontSize: 20,
      marginBottom: 12,
      fontWeight: 'bold',
      paddingTop: 12,
      fontFamily: 'Noto Sans TC',
    },
    heading3: {
      fontSize: 16,
      marginBottom: 10,
      fontWeight: 'bold',
      paddingTop: 10,
      fontFamily: 'Noto Sans TC',
    },
    paragraph: {
      marginBottom: 10,
      lineHeight: 1.8,
      fontFamily: 'Noto Sans TC',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    text: {
      fontFamily: 'Noto Sans TC',
    },
    char: {
      fontFamily: 'Noto Sans TC',
    },
    code: {
      fontFamily: 'Courier',
      backgroundColor: '#f6f8fa',
      padding: 12,
      marginVertical: 12,
      fontSize: 10,
    },
    list: {
      marginLeft: 24,
      marginBottom: 12,
      marginTop: 8,
    },
    listItem: {
      marginBottom: 8,
      paddingLeft: 12,
      lineHeight: 1.4,
      fontFamily: 'Noto Sans TC',
    },
    emphasis: {
      fontStyle: 'italic',
      fontFamily: 'Helvetica',
    },
    strong: {
      fontWeight: 'bold',
      fontFamily: 'Noto Sans TC',
    },
    link: {
      color: '#0366d6',
      textDecoration: 'underline',
      fontFamily: 'Noto Sans TC',
    },
    blockquote: {
      marginLeft: 16,
      paddingLeft: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#dfe2e5',
      fontStyle: 'italic',
      color: '#6a737d',
      fontFamily: 'Noto Sans TC',
    },
    date: {
      fontFamily: 'Times-Italic',
      color: '#666666',
      marginBottom: 16,
      fontSize: 11,
    },
    hr: {
      borderTopWidth: 1,
      borderTopColor: '#dfe2e5',
      marginVertical: 20,
    },
    datePrefix: {
      fontWeight: 'bold',
      color: '#24292e',
      fontFamily: 'Noto Sans TC',
    },
  });

  // PDF Document component
  const PDFDocument = ({ content }: { content: string }) => {
    type TokenType = ReturnType<typeof marked.lexer>[number];
    
    interface ListItem {
      type: 'list_item';
      raw: string;
      task: boolean;
      checked?: boolean;
      loose: boolean;
      text: string;
      tokens: TokenType[];
    }

    const renderInlineContent = (text: string): React.ReactNode => {
      try {
        // Handle inline styles
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|_.*?_)/);
        return parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('**') && part.endsWith('**')) {
            return <Text key={i} style={styles.strong}>{part.slice(2, -2)}</Text>;
          }
          if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            return <Text key={i} style={styles.emphasis}>{part.slice(1, -1)}</Text>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <Text key={i} style={styles.code}>{part.slice(1, -1)}</Text>;
          }
          if (part.match(/\[(.*?)\]\((.*?)\)/)) {
            const [, text, url] = part.match(/\[(.*?)\]\((.*?)\)/)!;
            const isInternalLink = url.startsWith('#');
            return isInternalLink ? (
              <PdfLink key={i} src={url} style={styles.link}>{text}</PdfLink>
            ) : (
              <Text key={i} style={styles.link}>{text}</Text>
            );
          }

          // Split text into segments of Chinese characters and non-Chinese text
          const segments = part.split(/([\\u4e00-\\u9fa5]+)/g).filter(Boolean);
          return segments.map((segment, segIndex) => {
            // Check if segment contains Chinese characters
            if (/[\u4e00-\u9fa5]/.test(segment)) {
              // Split Chinese characters
              return [...segment].map((char, charIndex) => (
                <Text key={`${i}-${segIndex}-${charIndex}`} style={styles.char}>{char}</Text>
              ));
            } else {
              // Keep English text together
              return <Text key={`${i}-${segIndex}`} style={styles.text}>{segment}</Text>;
            }
          });
        }).filter(Boolean);
      } catch (error) {
        console.error('Error in renderInlineContent:', error);
        return text;
      }
    };

    const renderToken = (token: TokenType, index: number): React.ReactNode => {
      switch (token.type) {
        case 'heading':
          const headingLevel = `heading${token.depth}` as keyof typeof styles;
          const HeadingStyle = styles[headingLevel] || styles.heading1;
          
          // Handle numbered headings (e.g., "1. Executive Summary")
          const headingText = token.text;
          const sectionText = headingText.replace(/^\d+\.\s+/, '');  // Remove any leading numbers
          const headingId = sectionText.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <Text key={index} id={headingId} style={HeadingStyle}>
              {renderInlineContent(headingText)}
            </Text>
          );
        
        case 'paragraph':
          // First check if it's a date pattern
          // Special handling for "_Date: date_" pattern
          const dateMatch = token.text.match(/^_Date:\s*(.+?)_$/);
          if (dateMatch) {
            return (
              <View key={index}>
                <Text style={styles.date}>
                  <Text style={styles.datePrefix}>Date: </Text>
                  <Text>{dateMatch[1]}</Text>
                </Text>
              </View>
            );
          }
          
          // Otherwise handle regular paragraph with Chinese text
          return (
            <View key={index} style={styles.paragraph}>
              <Text style={styles.text}>
                {renderInlineContent(token.text)}
              </Text>
            </View>
          );
        
        case 'code':
          return (
            <View key={index} style={styles.code}>
              <Text>{token.text}</Text>
            </View>
          );
        
        case 'list':
          return (
            <View key={index} style={styles.list}>
              {(token.items as ListItem[]).map((item, i) => (
                <Text key={i} style={styles.listItem}>
                  {token.ordered ? `${i + 1}. ` : '• '}
                  {renderInlineContent(item.text)}
                </Text>
              ))}
            </View>
          );

        case 'hr':
          return <View key={index} style={styles.hr} />;

        case 'blockquote':
          return (
            <View key={index} style={styles.blockquote}>
              <Text>{renderInlineContent(token.text)}</Text>
            </View>
          );
        
        default:
          if ('text' in token) {
            return renderInlineContent(token.text);
          }
          return null;
      }
    };

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View>
            {marked.lexer(content).map((token, index) => renderToken(token, index))}
          </View>
        </Page>
      </Document>
    );
  };

  const handleExportPdf = async () => {
    if (!note?.content) return;
    
    try {
      setExportingPdf(true);
      const doc = <PDFDocument content={note.content} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.title ? `${note.title}.pdf` : 'note.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </Button>
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

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportPdf}
                disabled={exportingPdf}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className={note.isPublic ? 'text-green-500' : ''}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
                className={note.isFavorite ? 'text-yellow-500' : ''}
              >
                {note.isFavorite ? (
                  <Star className="h-4 w-4 fill-current" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyAll}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
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
                  <DropdownMenuItem onClick={handleExportPdf} disabled={exportingPdf}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className={`h-4 w-4 mr-2 ${note.isPublic ? 'text-green-500' : ''}`} />
                    {note.isPublic ? 'Unshare' : 'Share'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleFavorite}>
                    <Star className={`h-4 w-4 mr-2 ${note.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                    {note.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyAll}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {shareUrl && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Share Link</p>
                  <code 
                    className="block bg-muted p-2 rounded text-sm break-all cursor-pointer overflow-hidden text-ellipsis"
                    onClick={(e) => {
                      const range = document.createRange();
                      range.selectNodeContents(e.currentTarget);
                      const selection = window.getSelection();
                      if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                    }}
                  >
                    {shareUrl}
                  </code>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Share link copied to clipboard');
                  }}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6" id="note-content">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none focus:ring-0 px-0"
              placeholder="Untitled Note"
            />
            {viewMode === 'edit' && (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[50vh] border-none focus:ring-0 px-0 font-mono mt-4"
                placeholder="Start writing..."
              />
            )}
            {viewMode === 'preview' && (
              <div className="prose max-w-none">
                <div className="bg-background p-6 sm:p-8 rounded-lg space-y-4 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_h5]:break-words [&_h6]:break-words [&_p]:break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      pre: ({ children }) => (
                        <pre className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg my-4">
                          {children}
                        </pre>
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !node?.position?.start.line;
                        if (!isInline && match?.[1] === 'mermaid') {
                          // Clean up the mermaid diagram text
                          const diagramText = String(children)
                            .replace(/\n$/, '')  // Remove trailing newline
                            .trim();             // Remove extra whitespace
                          
                          return <MermaidRenderer chart={diagramText} />;
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {viewMode === 'markdown' && (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto mt-4">
                <code>{content}</code>
              </pre>
            )}
          </CardContent>
        </Card>

        {viewMode === 'edit' && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      {showScrollTop && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 bg-background shadow-md"
        >
          <ArrowUpToLine className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
