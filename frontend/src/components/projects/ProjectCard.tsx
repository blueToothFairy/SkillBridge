'use client';

import React from 'react';
import { ApiProject } from '@/types';
import { Clock, Bookmark } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: ApiProject;
  onApplyClick?: (project: ApiProject) => void;
}

const TILE_COLORS = [
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-900',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
];

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'SB';
}

export default function ProjectCard({ project, onApplyClick }: ProjectCardProps) {
  const companyName = project.sme?.companyName || 'Verified SME';
  const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];
  const tileColor = TILE_COLORS[companyName.length % TILE_COLORS.length];

  const formatBudget = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
      amount
    );

  return (
    <article className="card-crisp card-crisp-hover p-5 flex flex-col justify-between bg-white min-h-[260px]">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${tileColor}`}
          >
            {companyInitials(companyName)}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            aria-label="Bookmark"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        <Link href={`/student/projects/${project.id}`} className="block group">
          <h3 className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
            {project.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 mt-1 font-medium">{companyName}</p>

        <p className="text-[13px] text-slate-600 line-clamp-2 mt-3 leading-relaxed">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {requiredSkills.slice(0, 4).map((skill) => (
            <span key={skill} className="tag-predefined text-[11px]">
              {skill}
            </span>
          ))}
          {requiredSkills.length > 4 && (
            <span className="tag-predefined text-[11px]">+{requiredSkills.length - 4}</span>
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span className="font-bold text-slate-800">{formatBudget(Number(project.budget))}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {project.durationWeeks} weeks
          </span>
          <span>{project.applicantCount ?? 0} applicants</span>
        </div>

        {onApplyClick ? (
          <button
            type="button"
            onClick={() => onApplyClick(project)}
            className="btn-primary text-xs py-2 px-4 shrink-0"
          >
            Apply
          </button>
        ) : (
          <Link href={`/student/projects/${project.id}`} className="btn-primary text-xs py-2 px-4 shrink-0">
            Apply
          </Link>
        )}
      </div>
    </article>
  );
}
