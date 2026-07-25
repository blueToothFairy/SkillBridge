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
    ? user.role === 'ADMIN'
      ? 'System Administrator'
      : user.role === 'STUDENT'
      ? user.profile?.fullName || 'Student User'
      : user.profile?.companyName || 'SME Organization'
    : role === 'STUDENT'
    ? studentProfile.fullName
    : 'Artisan Coffee Co.';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Prominent Logo */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-slate-900 hover:text-brand-primary transition-colors font-sans">
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
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-lg pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
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
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full" />
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold text-white uppercase">
                {userName.substring(0, 2)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg transition-colors shadow-xs"
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
