import type { Metadata } from 'next';
import { getNoteByShareId } from '@/lib/db';

type LayoutProps = {
  children: React.ReactNode;
  params: { shareId: string };
};

export async function generateMetadata(
  { params }: LayoutProps
): Promise<Metadata> {
  const note = await getNoteByShareId(params.shareId);
  
  if (!note) {
    return {
      title: 'LLM Notes',
      description: 'The requested note could not be found or is no longer shared.',
    }
  }

  const title = note.title || 'Shared Note';
  const description = note.content.substring(0, 160) + (note.content.length > 160 ? '...' : '');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: note.createdAt.toISOString(),
      modifiedTime: note.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function SharedNoteLayout({
  children,
  params,
}: LayoutProps) {
  return children;
}
