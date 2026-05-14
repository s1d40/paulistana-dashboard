import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "./providers";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Dashboard Centralizado",
  description: "BFF Dashboard para métricas de e-commerce e integrações",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}
    >
      <body className="h-screen flex overflow-hidden">
        <Providers>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-y-auto">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
