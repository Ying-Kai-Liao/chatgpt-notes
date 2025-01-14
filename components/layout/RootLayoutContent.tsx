"use client";

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import GradientText from "@/components/GradientText";
import { LogOut } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

function NavContent() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <Button variant="ghost" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      ) : (
        <Sheet >
          <SheetTrigger asChild>
            <Button>Sign In to Save and Share</Button>
          </SheetTrigger>
          <SheetContent className="bg-white/95 backdrop-blur-xl border-l shadow-lg">
            <SheetHeader >
              <SheetTitle>Sign In</SheetTitle>
              <SheetDescription>
                Sign in to save and manage your notes
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <AuthForm />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} antialiased bg-gray-50 text-gray-900 min-h-full flex flex-col`}
      >
        <Toaster position="bottom-center" />
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/logo.svg"
                    width={32}
                    height={32}
                    alt="Logo"
                    className="mr-2 filter logo"
                  />
                  <span className="text-xl font-semibold">ChatGPT Notes</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <NavContent />
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">{children}</main>
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-center space-x-4">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} ChatGPT Notes. All rights
                reserved.
              </p>
              <div className="text-center text-sm flex flex-row text-gray-500 dark:text-gray-400 ">
                Created by
                <GradientText>
                  <a
                    href="https://github.com/Ying-Kai-Liao"
                    className="hover:underline ml-1"
                  >
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
