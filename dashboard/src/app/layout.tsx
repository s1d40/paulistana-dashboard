import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";
import LayoutWrapper from "./layout-wrapper";

export const metadata: Metadata = {
  title: "Cocreator Studio",
  description: "Dashboard para métricas de e-commerce e automações de conteúdo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="font-sans h-full antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50"
      suppressHydrationWarning
    >
      <body className="h-full">
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
