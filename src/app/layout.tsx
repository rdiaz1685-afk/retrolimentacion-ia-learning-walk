
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learning Walk Feedback IA",
  description: "Sistema de retroalimentación inteligente para Learning Walks",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {session ? (
          <div className="h-full relative font-sans">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 overflow-y-auto">
              <Sidebar user={session.user} />
            </div>
            <main className="md:pl-72 bg-slate-50 min-h-screen">
              {children}
            </main>
          </div>
        ) : (
          <main className="h-full min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
