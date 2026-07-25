'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-white text-slate-600 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 border-r border-slate-200">
      <div>
        <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Admin Portal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            System Administrator
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

      <div className="mt-8 p-3.5 bg-slate-50 text-slate-600 rounded-lg text-xs border border-slate-200">
        <div className="flex items-center gap-1.5 font-bold text-brand-primary mb-1">
          <Shield className="h-4 w-4" />
          Review Workflow
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Verify and approve SME projects before they become active (OPEN) for student applications.
        </p>
      </div>
    </aside>
  );
};
