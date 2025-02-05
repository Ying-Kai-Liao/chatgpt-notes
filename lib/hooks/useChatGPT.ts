import { useState } from 'react';
import type { ChatGPTTextDoc } from '@/app/api/chatgpt/route';

interface UseChatGPTOptions {
  onError?: (error: Error) => void;
}

export function useChatGPT(options: UseChatGPTOptions = {}) {
  const [loading, setLoading] = useState(false);

  const saveTextDoc = async (textDocId: string, content: string): Promise<ChatGPTTextDoc | null> => {
    setLoading(true);
    try {
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textDocId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save ChatGPT text doc');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving ChatGPT text doc:', error);
      options.onError?.(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTextDoc = async (textDocId: string): Promise<ChatGPTTextDoc | null> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chatgpt?textDocId=${encodeURIComponent(textDocId)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch ChatGPT text doc');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ChatGPT text doc:', error);
      options.onError?.(error as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveTextDoc,
    getTextDoc,
  };
}
