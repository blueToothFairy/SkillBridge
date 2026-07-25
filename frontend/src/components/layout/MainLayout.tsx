'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar } from './Navbar';
import { StudentSidebar } from './StudentSidebar';
import { SMESidebar } from './SMESidebar';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useApp();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {!isAuthPage && (role === 'STUDENT' ? <StudentSidebar /> : <SMESidebar />)}
        <main className={`flex-1 overflow-y-auto w-full ${isAuthPage ? 'p-4 flex items-center justify-center' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
