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

interface ChatGPTMessageContent {
  content_type: 'text' | 'multimodal_text' | string;
  parts: (string | {
    type: 'image';
    asset_pointer: string;
    size?: {
      width: number;
      height: number;
    };
  })[];
}

interface ChatGPTMessageMetadata {
  // Message timing and source
  timestamp_?: string;
  message_type?: string;
  model_slug?: string;
  parent_id?: string;
  
  // Finish reason and token counts
  finish_details?: {
    type: string;
    stop_tokens?: number[];
  };
  token_count?: number;
  
  // Response and request context
  response_id?: string;
  conversation_id?: string;
  weight?: number;
  
  // System and user context
  user_context?: string;
  system_prompt?: string;
  
  // Citations and references
  citations?: Array<{
    start_ix: number;
    end_ix: number;
    citation_format: string;
    metadata: {
      url?: string;
      title?: string;
      text?: string;
    };
  }>;
}

interface ChatGPTMessage {
  id?: string;
  message: {
    author: {
      role: string;
    };
    content: ChatGPTMessageContent;
    status?: string;
    weight?: number;
    metadata?: ChatGPTMessageMetadata;
  };
  parent?: string;
  children?: string[];
}

function buildMessageChain(mapping: { [key: string]: ChatGPTMessage }): Message[] {
  console.log('Building message chain from mapping:', JSON.stringify(mapping, null, 2));
  
  const messages: Message[] = [];
  let currentId = Object.keys(mapping)[0];
  
  while (currentId && mapping[currentId]) {
    const currentMessage = mapping[currentId];
    
    if (currentMessage.message?.content?.parts?.length > 0) {
      const parts = currentMessage.message.content.parts;
      const role = currentMessage.message.author.role;
      
      // Convert each part to string safely
      const content = parts.map(part => {
        if (typeof part === 'string') {
          return part;
        }
        if (typeof part === 'object' && part !== null) {
          if (part.type === 'image') {
            return `[Image${part.size ? ` (${part.size.width}x${part.size.height})` : ''}]`;
          }
          return JSON.stringify(part);
        }
        return '[Unknown content]';
      }).join('\n');
      
      messages.push({ role, content });
      
      console.log('Added message:', {
        role,
        contentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : '')
      });
    } else {
      console.log('Skipped message due to missing content');
    }
    
    currentId = currentMessage.children?.[0] || '';
  }

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

    const responseData = await response.json();
    // console.log('Fetched conversation data:', JSON.stringify(responseData, null, 2));
    
    // Extract data from the nested structure
    const data = responseData.data || responseData;
    
    if (!data?.mapping) {
      console.error('Invalid data structure:', data);
      throw new Error('Invalid conversation data: missing mapping');
    }

    const messages = buildMessageChain(data.mapping);
    return {
      title: data.title || 'Untitled Conversation',
      messages,
      debug: {
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    throw error;
  }
}

export function convertToMarkdown(conversation: Conversation): string {
  const lines: string[] = [];
  lines.push(`# ${conversation.title}\n`);
  
  for (const message of conversation.messages) {
    const role = message.role === 'assistant' ? 'ChatGPT' : 'User';
    lines.push(`## ${role}\n`);
    lines.push(message.content);
    lines.push(''); // Empty line for spacing
  }
  
  return lines.join('\n');
}
