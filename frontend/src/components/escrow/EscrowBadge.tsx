'use client';

import React from 'react';
import { EscrowStatus } from '@/types';
import { ShieldCheck, Clock, Unlock } from 'lucide-react';

const LABELS: Record<string, { label: string; className: string; icon: typeof ShieldCheck }> = {
  PENDING: {
    label: 'Escrow Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  NONE: {
    label: 'Escrow Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  HELD: {
    label: 'Escrow Held',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: ShieldCheck,
  },
  LOCKED: {
    label: 'Escrow Held',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: ShieldCheck,
  },
  RELEASED: {
    label: 'Escrow Released',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Unlock,
  },
};

interface EscrowBadgeProps {
  status: EscrowStatus | string;
  className?: string;
}

export default function EscrowBadge({ status, className = '' }: EscrowBadgeProps) {
  const meta = LABELS[status] || LABELS.PENDING;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}
