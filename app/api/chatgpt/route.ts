import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface ChatGPTTextDoc {
  id: string;
  version: number;
  content: string;
  title?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    model_slug?: string;
    shared_conversation_id?: string;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { textDocId, content } = await request.json();

    // Here we'll implement the actual ChatGPT API integration
    // For now, we'll just mock the response
    const mockResponse: ChatGPTTextDoc = {
      id: textDocId,
      version: 1,
      content: content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        model_slug: 'gpt-4',
        shared_conversation_id: `shared-${textDocId}`
      }
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing ChatGPT text doc:', error);
    return NextResponse.json(
      { error: 'Failed to process ChatGPT text doc' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const textDocId = searchParams.get('textDocId');

    if (!textDocId) {
      return NextResponse.json(
        { error: 'Missing textDocId parameter' },
        { status: 400 }
      );
    }

    // Here we'll implement the actual ChatGPT API fetch
    // For now, we'll just mock the response
    const mockResponse: ChatGPTTextDoc = {
      id: textDocId,
      version: 1,
      content: '# Sample ChatGPT Conversation\n\nThis is a mock conversation content.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error fetching ChatGPT text doc:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ChatGPT text doc' },
      { status: 500 }
    );
  }
}
