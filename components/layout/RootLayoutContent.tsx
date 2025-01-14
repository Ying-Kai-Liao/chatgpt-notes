'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import GradientText from '@/components/GradientText';

const inter = Inter({ subsets: ['latin'] });

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-full flex flex-col`}>
        <Toaster position="bottom-center" />
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <GradientText>
                    ChatGPT Notes
                  </GradientText>
                </div>
              </div>
              {user && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
        <main className="flex-grow">{children}</main>
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-center space-x-4">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} ChatGPT Notes. All rights reserved.
              </p>
              <div className="text-center text-sm flex flex-row text-gray-500 dark:text-gray-400 ">
                Created by 
                <GradientText>
                  <a href="https://github.com/Ying-Kai-Liao" className="hover:underline ml-1">
                    YingKaiLiao
                  </a>
                </GradientText>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
