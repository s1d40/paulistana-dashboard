'use client';

import Sidebar from "@/components/sidebar";
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <body className="h-screen flex overflow-hidden">
      {!isLoginPage && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </body>
  );
}
