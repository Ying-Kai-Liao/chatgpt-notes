import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { RootLayoutContent } from '@/components/layout/RootLayoutContent';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatGPT Notes Converter',
  description: 'Convert ChatGPT conversations into beautiful Markdown notes',
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
