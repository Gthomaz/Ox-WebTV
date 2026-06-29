import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { AdminProvider } from "@/contexts/AdminContext";
import { Footer } from "@/components/Footer";
import Script from "next/script";
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
  title: "OX WebTV Quissamã",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col pt-24 overflow-x-hidden">
        <AdminProvider>
          <Header />
          <main className="flex-1 flex flex-col relative">{children}</main>
          <Footer />
        </AdminProvider>
        <Script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
