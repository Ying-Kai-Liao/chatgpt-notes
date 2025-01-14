import { NextResponse } from 'next/server';
import { fetchChatGPTConversation, convertToMarkdown } from '@/lib/chatgpt';

export async function POST(request: Request) {
  try {
    const { link } = await request.json();
    console.log('Received link:', link);
    
    // Extract share ID from the link
    const shareId = link.split('/').pop();
    console.log('Extracted share ID:', shareId);
    
    if (!shareId) {
      console.error('Invalid share ID');
      return NextResponse.json(
        { error: 'Invalid ChatGPT share link' },
        { status: 400 }
      );
    }

    // Fetch the conversation
    console.log('Fetching conversation...');
    const conversation = await fetchChatGPTConversation(shareId);
    console.log('Debug info:', conversation.debug);
    console.log('Fetched conversation:', JSON.stringify(conversation, null, 2));
    
    // Convert to markdown
    console.log('Converting to markdown...');
    const markdown = convertToMarkdown(conversation);
    console.log('Markdown result:', markdown);

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Error converting chat:', error);
    return NextResponse.json(
      { error: 'Failed to convert chat', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
