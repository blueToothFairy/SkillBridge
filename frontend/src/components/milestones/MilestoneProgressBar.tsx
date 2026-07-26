'use client';

import React from 'react';
import { Milestone } from '../../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface MilestoneProgressBarProps {
  milestones: Milestone[];
}

export default function MilestoneProgressBar({ milestones }: MilestoneProgressBarProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const total = milestones.length;
  const accepted = milestones.filter((m) => m.status === 'ACCEPTED').length;
  const submitted = milestones.filter((m) => m.status === 'SUBMITTED').length;
  const revision = milestones.filter((m) => m.status === 'REVISION_REQUIRED').length;
  const pending = total - accepted - submitted - revision;

  const progressPercent = Math.round((accepted / total) * 100);

  return (
    <div className="w-full space-y-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
      {/* Label and Percentage */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500 uppercase tracking-wider">Tiến độ hoàn thành dự án</span>
        <span className="text-slate-900 text-sm font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {progressPercent}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex gap-0.5 border border-slate-200/30">
        {/* Accepted (Green) */}
        <div
          style={{ width: `${(accepted / total) * 100}%` }}
          className="bg-emerald-500 h-full transition-all duration-500 ease-out"
          title={`Approved: ${accepted}/${total}`}
        />
        {/* Submitted (Orange/Amber) */}
        <div
          style={{ width: `${(submitted / total) * 100}%` }}
          className="bg-amber-500 h-full transition-all duration-500 ease-out"
          title={`Submitted: ${submitted}/${total}`}
        />
        {/* Revision Required (Red) */}
        <div
          style={{ width: `${(revision / total) * 100}%` }}
          className="bg-rose-500 h-full transition-all duration-500 ease-out"
          title={`Revision Required: ${revision}/${total}`}
        />
      </div>

      {/* Legend / Info Badges */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs text-slate-500 font-medium pt-1">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{accepted} Đã duyệt (Approved)</span>
        </div>
        {submitted > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>{submitted} Đang kiểm tra (Submitted)</span>
          </div>
        )}
        {revision > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{revision} Yêu cầu sửa đổi (Revision)</span>
          </div>
        )}
        {pending > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
            <span>{pending} Chưa bắt đầu (Pending)</span>
          </div>
        )}
      </div>
    </div>
  );
}
