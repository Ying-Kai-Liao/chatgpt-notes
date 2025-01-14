import { NextResponse } from 'next/server';
import { fetchChatGPTConversation, convertToMarkdown } from '@/lib/chatgpt';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "ChatGPT share link is required" },
        { status: 400 }
      );
    }

    // Extract conversation ID from the URL
    const match = url.match(/\/share\/([\w-]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid ChatGPT share link" },
        { status: 400 }
      );
    }

    const conversationId = match[1];
    const conversation = await fetchChatGPTConversation(conversationId);
    const markdown = convertToMarkdown(conversation);
    console.log('Markdown result:', markdown);

    // Just return the markdown, let client handle saving
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Error converting chat:', error);
    return NextResponse.json(
      { error: "Failed to convert conversation" },
      { status: 500 }
    );
  }
}
