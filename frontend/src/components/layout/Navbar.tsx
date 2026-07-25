'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Bell,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { role, studentProfile } = useApp();
  const { user, isAuthenticated, logout } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  const userName = user
    ? user.role === 'STUDENT'
      ? user.profile?.fullName || 'Student User'
      : user.profile?.companyName || 'SME Organization'
    : role === 'STUDENT'
    ? studentProfile.fullName
    : 'Artisan Coffee Co.';

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Prominent Logo */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-slate-100 transition-all font-sans">
            SkillBridge
          </span>
        </Link>
      </div>

      {/* Center Search Bar - Hidden on Auth Pages */}
      {!isAuthPage && (
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
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <button
              aria-label="Notifications"
              className="relative p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full" />
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                {userName.substring(0, 2)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
