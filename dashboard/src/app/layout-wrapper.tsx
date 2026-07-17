'use client';

import Sidebar from "@/components/sidebar";
// import StudioAssistant from "@/components/studio-assistant";
import { useState, useEffect } from 'react';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  return (
    <div className="h-screen flex overflow-hidden">
      {!isPublicPage && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
      {/* {!isPublicPage && <StudioAssistant />} */}
    </div>
  );
}
