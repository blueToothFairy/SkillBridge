'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  PlusCircle,
  Users,
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const SMESidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'SME Dashboard', href: '/sme/dashboard', icon: Building },
    { label: 'Post a Project', href: '/sme/post-project', icon: PlusCircle },
    { label: 'Applicants & Matching', href: '/sme/matching/proj-2', icon: Users },
    { label: 'Project Workspaces', href: '/workspace/proj-1', icon: FolderGit2 },
    { label: 'Acceptance & Escrow', href: '/escrow/proj-1', icon: CheckCircle2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 border-r border-slate-800">
      <div>
        <div className="mb-4 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-100 tracking-wide uppercase">
              SME Portal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Artisan Coffee Co. · SME Employer
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
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* SME Escrow Info */}
      <div className="mt-8 p-3 bg-slate-800/80 rounded-lg text-xs border border-slate-700">
        <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
          <ShieldCheck className="h-4 w-4" />
          Predefined Tag Matching
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          SkillBridge matches student skill tags directly with your project requirements. Select 1 to 4 top candidates.
        </p>
      </div>
    </aside>
  );
};
