interface Message {
  role: string;
  content: string;
}

interface Conversation {
  title: string;
  messages: Message[];
  debug?: DebugInfo;
}

interface DebugInfo {
  [key: string]: string | number | boolean;
}

interface ChatGPTMessage {
  message: {
    author: {
      role: string;
    };
    content: {
      content_type: string;
      parts: string[];
    };
  };
  parent?: string;
  children?: string[];
}

function buildMessageChain(mapping: { [key: string]: ChatGPTMessage }): Message[] {
  console.log('Building message chain from mapping:', JSON.stringify(mapping, null, 2));
  
  // Find the first message (one without a parent)
  const firstMessageId = Object.keys(mapping).find(
    (id) => !mapping[id].parent
  );

  console.log('First message ID:', firstMessageId);
  if (!firstMessageId) return [];

  const messages: Message[] = [];
  let currentId = firstMessageId;

  while (currentId) {
    console.log('Processing message ID:', currentId);
    const currentMessage = mapping[currentId];
    console.log('Current message:', JSON.stringify(currentMessage, null, 2));
    
    if (currentMessage.message?.content?.parts?.[0]) {
      messages.push({
        role: currentMessage.message.author.role,
        content: currentMessage.message.content.parts[0],
      });
      console.log('Added message:', {
        role: currentMessage.message.author.role,
        content: currentMessage.message.content.parts[0].substring(0, 100) + '...',
      });
    } else {
      console.log('Skipped message due to missing content');
    }
    
    currentId = currentMessage.children?.[0] || '';
    console.log('Next message ID:', currentId);
  }

  console.log('Final messages array:', JSON.stringify(messages, null, 2));
  return messages;
}

export async function fetchChatGPTConversation(shareId: string): Promise<Conversation> {
  console.log('Fetching conversation for share ID:', shareId);
  
  try {
    // Use absolute URL for server-side, relative for client-side
    const url = typeof window === 'undefined'
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/proxy/chatgpt?id=${encodeURIComponent(shareId)}`
      : `/api/proxy/chatgpt?id=${encodeURIComponent(shareId)}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch conversation: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const { data, debug } = await response.json();
    console.log('Debug info from proxy:', debug);
    
    if (!data || !data.mapping) {
      throw new Error('Invalid response format from ChatGPT API');
    }

    const messages = buildMessageChain(data.mapping);
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    
    if (filteredMessages.length === 0) {
      throw new Error('No valid messages found in conversation');
    }

    return {
      title: data.title || 'Untitled Conversation',
      messages: filteredMessages,
      debug
    };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export function convertToMarkdown(conversation: Conversation): string {
  console.log('Converting conversation to markdown:', JSON.stringify(conversation, null, 2));
  
  let markdown = `# ${conversation.title}\n\n`;

  conversation.messages.forEach((message, index) => {
    console.log(`Processing message ${index}:`, message);
    if (message.role !== 'tool') {
      const role = message.role === 'assistant' ? 'ChatGPT' : 'User';
      markdown += `## ${role}\n\n${message.content}\n\n`;
    }
  });

  console.log('Final markdown:', markdown);
  return markdown;
}
