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
  
  // Get the origin for the API call
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const response = await fetch(`${origin}/api/proxy/chatgpt?id=${encodeURIComponent(shareId)}`);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error response:', errorData);
    throw new Error(errorData.error || `Failed to fetch conversation: ${response.statusText}`);
  }

  const { data, debug } = await response.json();
  console.log('Debug info from proxy:', debug);
  console.log('Raw API response:', JSON.stringify(data, null, 2));
  
  const messages = buildMessageChain(data.mapping);
  console.log('Messages after filtering:', JSON.stringify(messages.filter(msg => msg.role !== 'system'), null, 2));

  return {
    title: data.title || 'Untitled Conversation',
    messages: messages.filter(msg => msg.role !== 'system'),
    debug
  };
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
