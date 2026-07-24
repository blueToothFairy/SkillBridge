'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Navbar } from './Navbar';
import { StudentSidebar } from './StudentSidebar';
import { SMESidebar } from './SMESidebar';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {role === 'STUDENT' ? <StudentSidebar /> : <SMESidebar />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
