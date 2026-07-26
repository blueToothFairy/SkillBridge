'use client';

import React from 'react';
import { Tag } from '@/types';
import { Settings2, X } from 'lucide-react';

interface ProjectFilterProps {
  categories: Tag[];
  skillTags: Tag[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedSkillName: string;
  setSelectedSkillName: (skill: string) => void;
  durationWeeks: string;
  setDurationWeeks: (v: string) => void;
  onReset: () => void;
}

const DURATION_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1-2', label: '1–2 weeks' },
  { value: '3-4', label: '3–4 weeks' },
  { value: '5+', label: '5+ weeks' },
];

export default function ProjectFilter({
  categories,
  skillTags,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedSkillName,
  setSelectedSkillName,
  durationWeeks,
  setDurationWeeks,
  onReset,
}: ProjectFilterProps) {
  const hasActive =
    selectedCategoryId !== '' || selectedSkillName !== '' || durationWeeks !== '';

  return (
    <aside className="card-crisp p-5 space-y-6 bg-white sticky top-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-500" /> Filters
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Category list — prototype style */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => setSelectedCategoryId('')}
              className={`w-full text-left text-[13px] px-3 py-2 rounded-lg font-medium transition-colors ${
                selectedCategoryId === ''
                  ? 'bg-blue-50 text-brand-primary'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left text-[13px] px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-50 text-brand-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Duration chips */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</p>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'any'}
              type="button"
              onClick={() => setDurationWeeks(opt.value)}
              className={`text-[12px] px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                durationWeeks === opt.value
                  ? 'bg-blue-50 border-blue-200 text-brand-primary'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Popular skills tags */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Popular Skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skillTags.slice(0, 12).map((skill) => {
            const active = selectedSkillName === skill.name;
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => setSelectedSkillName(active ? '' : skill.name)}
                className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 border-blue-200 text-brand-primary'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {skill.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
