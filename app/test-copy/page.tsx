'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy } from "lucide-react";
import toast from 'react-hot-toast';

export default function TestCopy() {
  const [text] = useState(`This is a test text that will be copied.
It can have multiple lines
and will work on mobile devices too!`);

  const fallbackCopyTextToClipboard = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Prevent scrolling to bottom on iOS
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      toast.success('Text copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy to clipboard');
    }

    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Text copied to clipboard!');
    } catch (err) {
      console.log('Clipboard API failed, using fallback.');
      fallbackCopyTextToClipboard(text);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b p-6">
          <h1 className="text-2xl font-bold">Test Copy Functionality</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg">
              {text}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
