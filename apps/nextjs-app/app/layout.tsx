import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { RootLayoutContent } from '@/components/layout/RootLayoutContent';
import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: 'LLM Notes Converter',
  description: 'Convert your LLM conversations into well-formatted notes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RootLayoutContent>
        {children}
      </RootLayoutContent>
    </AuthProvider>
  );
}
