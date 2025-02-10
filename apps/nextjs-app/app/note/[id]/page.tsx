'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import BackToTop from '@/components/BackToTop';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Share2, Loader2, Eye, Code, Edit2, Save, FileDown } from "lucide-react";
import { useAuth } from '@/lib/auth-context';
import { getNote, toggleNoteSharing, updateNote, type Note } from '@/lib/db';
import { Document, Page, Text, View, Link as PdfLink, StyleSheet, pdf } from '@react-pdf/renderer';
import { marked } from 'marked';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<"preview" | "markdown" | "edit">("preview");
  const [editedContent, setEditedContent] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingTestPdf, setExportingTestPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const fetchNote = async () => {
      try {
        const noteData = await getNote(params.id as string);
        if (!noteData) {
          setError('Note not found');
          return;
        }
        
        if (noteData.userId !== user.uid) {
          setError('You do not have permission to view this note');
          return;
        }

        setNote(noteData);
        setEditedContent(noteData.content);
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id, user, authLoading, router]);

  // Create styles
  const styles = StyleSheet.create({
    page: {
      padding: 50,
      fontSize: 11,
      fontFamily: 'Helvetica',
    },
    section: {
      marginBottom: 10,
    },
    heading1: {
      fontSize: 24,
      marginBottom: 16,
      fontWeight: 'bold',
      paddingTop: 16,
    },
    heading2: {
      fontSize: 20,
      marginBottom: 12,
      fontWeight: 'bold',
      paddingTop: 12,
    },
    heading3: {
      fontSize: 16,
      marginBottom: 10,
      fontWeight: 'bold',
      paddingTop: 10,
    },
    paragraph: {
      marginBottom: 10,
      lineHeight: 1.6,
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
    },
    emphasis: {
      fontStyle: 'italic',
    },
    strong: {
      fontWeight: 'bold',
    },
    link: {
      color: '#0366d6',
      textDecoration: 'underline',
    },
    blockquote: {
      marginLeft: 16,
      paddingLeft: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#dfe2e5',
      fontStyle: 'italic',
      color: '#6a737d',
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
    }
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
        // Special handling for "_Date: date_" pattern
        const dateMatch = text.match(/^_Date:\s*(.*?)_$/);
        if (dateMatch) {
          return (
            <Text style={styles.date}>
              <Text style={styles.datePrefix}>Date: </Text>
              {dateMatch[1]}
            </Text>
          );
        }

        // Handle inline styles
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|_.*?_)/);
        return parts.map((part, i) => {
          try {
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
            return part;
          } catch (error) {
            console.error('Error rendering inline content part:', error);
            return part;
          }
        });
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
          return (
            <Text key={index} style={styles.paragraph}>
              {renderInlineContent(token.text)}
            </Text>
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

    const renderContent = (content: string) => {
      // Handle numbered headings (e.g., "## 1. Executive Summary")
      if (content.match(/^##?\s+\d+\.\s+/)) {
        const headingText = content.replace(/^(##?\s+)(\d+\.\s+)/, '$1');  // Remove the number but keep the ## or #
        const sectionText = content.replace(/^##?\s+\d+\.\s+/, '');  // Get the text without ## and number
        const headingId = sectionText.toLowerCase().replace(/\s+/g, '-');
        
        if (content.startsWith('# ')) {
          return <Text id={headingId} style={styles.heading1}>{sectionText}</Text>;
        } else {
          return <Text id={headingId} style={styles.heading2}>{sectionText}</Text>;
        }
      }
      
      // Handle regular headings
      if (content.startsWith('# ')) {
        const headingText = content.slice(2);
        const headingId = headingText.toLowerCase().replace(/\s+/g, '-');
        return <Text id={headingId} style={styles.heading1}>{headingText}</Text>;
      }
      if (content.startsWith('## ')) {
        const headingText = content.slice(3);
        const headingId = headingText.toLowerCase().replace(/\s+/g, '-');
        return <Text id={headingId} style={styles.heading2}>{headingText}</Text>;
      }
      return renderToken(marked.lexer(content)[0], 0);
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

  const handleTestPdf = async () => {
    try {
      setExportingTestPdf(true);
      const testContent = `# PDF Test Document

## Table of Contents
1. [Heading Test](#heading-test)
2. [Text Formatting](#text-formatting)
3. [Lists](#lists)

## 1. Heading Test
This section tests heading navigation.

## 2. Text Formatting
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
Here are some text formatting examples:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms

## 3. Lists
1. Ordered list item 1
2. Ordered list item 2
   - Nested bullet point
   - Another nested point

> This is a blockquote to test styling

\`\`\`
This is a code block
to test code formatting
\`\`\`
`;

      const blob = await pdf(<PDFDocument content={testContent} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating test PDF:', error);
      toast.error('Failed to generate test PDF');
    } finally {
      setExportingTestPdf(false);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position: fixed; left: 0; top: 0; opacity: 0;';
    document.body.appendChild(textarea);

    try {
      textarea.select();
      document.execCommand('copy');
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy to clipboard');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const copyToClipboard = async () => {
    if (!note) return;

    try {
      await navigator.clipboard.writeText(note.content);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleSharing = async () => {
    if (!note) return;

    try {
      const { isPublic, shareId } = await toggleNoteSharing(note.id);
      setNote({ ...note, isPublic, shareId });

      if (isPublic && shareId) {
        const url = `${window.location.origin}/shared/${shareId}`;
        setShareUrl(url);
        toast.success('Note is now shared');
      } else {
        setShareUrl(null);
        toast.success('Note is no longer shared');
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      toast.error('Failed to toggle sharing');
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      } else {
        fallbackCopyTextToClipboard(shareUrl);
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      fallbackCopyTextToClipboard(shareUrl);
    }
  };

  const handleEdit = () => {
    setEditedContent(note?.content || "");
    setViewMode("edit");
  };

  const handleSaveEdit = async () => {
    if (!note) return;

    try {
      await updateNote(note.id, editedContent);
      setNote({ ...note, content: editedContent });
      setViewMode("preview");
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save changes');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
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
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <BackToTop />
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col space-y-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-row sm:items-center gap-4 min-w-0 max-w-full sm:max-w-[60%] sm:min-w-0">
              <Link href="/">
                <Button variant="ghost" size="sm" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold truncate min-w-0 sm:hidden" title={note.title || 'Untitled Note'}>
                {note.title || 'Untitled Note'}
              </h1>
            </div>

            <div className="flex flex-row items-center justify-between gap-2 min-w-full sm:min-w-[93%]">
              <div className="bg-gray-100 rounded-lg p-1 flex flex-wrap gap-1 sm:flex-nowrap">
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
                <Button
                  variant={viewMode === "edit" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSharing}
                  className="flex items-center gap-1"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{note.isPublic ? 'Unshare' : 'Share'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {exportingPdf ? 'Generating...' : 'PDF'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestPdf}
                  disabled={exportingTestPdf}
                  className="flex items-center gap-1"
                >
                  {exportingTestPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Code className="h-4 w-4" />
                  )}
                  Test PDF
                </Button>
              </div>
            </div>
          </div>

          {shareUrl && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 truncate flex-1">
                {shareUrl}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyShareUrl}
                className="flex items-center gap-1 shrink-0"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {viewMode === "edit" ? (
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="font-mono min-h-[400px] p-4"
                placeholder="Edit your markdown here..."
              />
              <div className="flex justify-end">
                <Button onClick={handleSaveEdit} className="flex items-center gap-1">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : viewMode === "markdown" ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg">
                {note.content}
              </div>
            </div>
          ) : (
            <div className="prose max-w-none ">
              <div ref={contentRef} className="bg-white p-4 sm:p-6 rounded-lg [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >{note.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
