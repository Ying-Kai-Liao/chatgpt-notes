import { Metadata, ResolvingMetadata } from 'next'
import { getNoteByShareId } from '@/lib/db';

export async function generateMetadata(
  { params }: { params: { shareId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const note = await getNoteByShareId(params.shareId)
 
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
 
  if (!note) {
    return {
      title: 'LLM Notes',
      description: 'The requested note could not be found or is no longer shared.',
    }
  }

  const title = note.title || 'Shared Note'
  const description = note.content.substring(0, 160) + (note.content.length > 160 ? '...' : '')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: note.createdAt.toISOString(),
      modifiedTime: note.updatedAt.toISOString(),
      images: Array.isArray(previousImages) ? previousImages : [previousImages],
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
  children: React.ReactNode
}) {
  return children
}
