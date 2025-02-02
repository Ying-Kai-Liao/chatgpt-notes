import { Metadata, ResolvingMetadata } from 'next';
import { getNoteByShareId } from '@/lib/db';

type Props = {
  params: { shareId: string }
  children: React.ReactNode
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
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

export default function SharedNoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
