import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { AdminProvider } from "@/contexts/AdminContext";
import { AdminPanel } from "@/components/AdminPanel";
import { ChatSidebar } from "@/components/ChatSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OX WebTV Platform",
  description: "Plataforma futurista de WebTV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-20">
        <AdminProvider>
          <Header />
          <main className="flex-1 flex flex-col relative overflow-x-hidden">{children}</main>
          <ChatSidebar />
          <AdminPanel />
        </AdminProvider>
      </body>
    </html>
  );
}
