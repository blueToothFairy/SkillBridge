'use client';

import React from 'react';
import { Tag } from '@/types';
import { Search, Filter, X } from 'lucide-react';

interface ProjectFilterProps {
  categories: Tag[];
  skillTags: Tag[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedSkillName: string;
  setSelectedSkillName: (skill: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReset: () => void;
}

export default function ProjectFilter({
  categories,
  skillTags,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedSkillName,
  setSelectedSkillName,
  searchQuery,
  setSearchQuery,
  onReset,
}: ProjectFilterProps) {
  const hasActiveFilters = selectedCategoryId !== '' || selectedSkillName !== '' || searchQuery !== '';

  return (
    <div className="card-crisp p-5 space-y-5">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-brand-primary" /> Lọc dự án
        </span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-brand-primary hover:text-brand-primary-hover font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tìm kiếm</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ khóa, tên bài..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Danh mục dự án</label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Skill Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kỹ năng yêu cầu</label>
        <select
          value={selectedSkillName}
          onChange={(e) => setSelectedSkillName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
        >
          <option value="">Tất cả kỹ năng</option>
          {skillTags.map((skill) => (
            <option key={skill.id} value={skill.name}>
              {skill.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
