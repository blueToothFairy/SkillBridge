'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Bell,
  Building2,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { role, setRole, studentProfile } = useApp();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="bg-blue-600 text-white p-1.5 rounded-md flex items-center justify-center font-black">
            SB
          </span>
          <span className="text-white font-extrabold text-xl tracking-tight">SkillBridge</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
            MVP v1.0
          </span>
        </Link>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              role === 'STUDENT'
                ? 'Search projects, skills (Figma, Python, React)...'
                : 'Search applicants, skills, projects...'
            }
            className="w-full bg-slate-800/80 text-slate-100 placeholder-slate-400 text-sm rounded-md pl-9 pr-4 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls: Role Switcher & User Avatar */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Button */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setRole('STUDENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              role === 'STUDENT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Student View
          </button>
          <button
            onClick={() => setRole('SME')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              role === 'SME'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            SME View
          </button>
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
            {role === 'STUDENT' ? 'AC' : 'SM'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {role === 'STUDENT' ? studentProfile.fullName : 'Sarah Mitchell'}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              {role === 'STUDENT' ? 'Verified Student' : 'Artisan Coffee Co.'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
