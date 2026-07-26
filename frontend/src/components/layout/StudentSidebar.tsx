'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  FileCheck,
  FolderGit2,
  Award,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

export const StudentSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Browse Projects', href: '/student/browse', icon: Search },
    { label: 'My Applications', href: '/student/applications', icon: FileCheck },
    { label: 'Project Workspaces', href: '/workspace/proj-1', icon: FolderGit2 },
    { label: 'Verified Portfolio', href: '/student/profile/stu-1', icon: UserCheck },
    { label: 'Digital Certificates', href: '/certificates/cert-1', icon: Award },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div>
        <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Student Workspace
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Year 4 · UCL / HCM City
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50/50 text-brand-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Simulated Escrow Banner */}
      <div className="mt-8 p-3.5 bg-slate-50 text-slate-600 rounded-lg text-xs border border-slate-200">
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 mb-1">
          <ShieldCheck className="h-4 w-4" />
          Simulated Escrow Protection
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          MVP simulated payment holding: funds are locked in escrow when project starts and released upon milestone acceptance.
        </p>
      </div>
    </aside>
  );
};

function GraduationCapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
