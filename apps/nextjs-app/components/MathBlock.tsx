'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathBlockProps {
  content: string;
}

export default function MathBlock({ content }: MathBlockProps) {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mathRef.current) {
      try {
        katex.render(content, mathRef.current, {
          displayMode: true,
          throwOnError: false,
          output: 'html',
          strict: false
        });
      } catch (error) {
        console.error('KaTeX error:', error);
        if (mathRef.current) {
          mathRef.current.textContent = content;
        }
      }
    }
  }, [content]);

  return (
    <div 
      ref={mathRef} 
      className="my-4 py-2 overflow-x-auto text-center"
    />
  );
}
