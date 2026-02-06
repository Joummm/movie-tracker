import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movie Tracker",
  description: "Acompanhe filmes e séries que você assiste",
  icons: {
    icon: [
      {
        url: "/movie.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/movie.svg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    apple: "/movie.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="dark">
      <body className={`font-sans antialiased flex flex-col min-h-screen`}>
        {children}
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
