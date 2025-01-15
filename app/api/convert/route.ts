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
        { error: "Invalid ChatGPT share link format" },
        { status: 400 }
      );
    }

    const conversationId = match[1];
    console.log('Converting conversation:', conversationId);

    try {
      const conversation = await fetchChatGPTConversation(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { error: "Failed to fetch conversation data" },
          { status: 500 }
        );
      }

      console.log('Fetched conversation:', {
        title: conversation.title,
        messageCount: conversation.messages.length
      });

      const markdown = convertToMarkdown(conversation);
      console.log('Generated markdown length:', markdown.length);

      return NextResponse.json({ markdown });
    } catch (conversionError) {
      console.error('Conversion error:', conversionError);
      const errorMessage = conversionError instanceof Error 
        ? conversionError.message 
        : 'Unknown error occurred';

      // Check for specific error cases
      if (errorMessage.includes('no longer accessible')) {
        return NextResponse.json(
          { error: "This conversation is no longer available. The share link might have expired." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
