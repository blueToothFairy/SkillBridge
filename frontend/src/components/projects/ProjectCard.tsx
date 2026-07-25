'use client';

import React from 'react';
import { ApiProject } from '@/types';
import { Clock, DollarSign, Building2, Tag as TagIcon, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: ApiProject;
  onApplyClick?: (project: ApiProject) => void;
}

export default function ProjectCard({ project, onApplyClick }: ProjectCardProps) {
  const companyName = project.sme?.companyName || 'Verified SME';
  const categoryName = project.categoryTag?.name || 'General';
  const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="card-crisp card-crisp-hover p-6 flex flex-col justify-between group">
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md">
            <TagIcon className="w-3.5 h-3.5" />
            {categoryName}
          </span>
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {project.durationWeeks} tuần
          </span>
        </div>

        {/* Title & SME */}
        <Link href={`/student/projects/${project.id}`} className="block">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-2 mb-2">
            {project.title}
          </h3>
        </Link>
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-4">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          {companyName}
        </p>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Skill Badges */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {requiredSkills.slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium rounded-md"
            >
              {skill}
            </span>
          ))}
          {requiredSkills.length > 5 && (
            <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[11px] font-medium rounded-md">
              +{requiredSkills.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Ngân sách</span>
          <span className="text-sm font-bold text-slate-900">
            {formatVnd(Number(project.budget))}
          </span>
        </div>

        <Link
          href={`/student/projects/${project.id}`}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1"
        >
          Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
