import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from 'geist/font/mono';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ChimeraLens AI | Transform Your Photos",
  description: "Swap your face into stunning artistic templates with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <QueryProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
            <footer className="w-full p-4 text-center border-t text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} ChimeraLens AI. All Rights Reserved.</p>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </footer>
          </div>
          <Toaster richColors theme="dark" />
        </QueryProvider>
      </body>
    </html>
  );
}

