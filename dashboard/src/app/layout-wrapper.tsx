'use client';

import Sidebar from "@/components/sidebar";
import { useState, useEffect } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const isLoginPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="h-screen flex overflow-hidden">
      {!isLoginPage && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
