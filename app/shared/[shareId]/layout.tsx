import type { Metadata } from 'next';
import { getNoteByShareId } from '@/lib/db';

export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
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

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
