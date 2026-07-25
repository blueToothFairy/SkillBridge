'use client';

import React, { useState, useEffect } from 'react';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilter from '@/components/projects/ProjectFilter';
import { fetchProjectsApi } from '@/lib/api/projects';
import { fetchTagsApi } from '@/lib/api/tags';
import { ApiProject, Tag } from '@/types';
import { Loader2, Search, Sparkles } from 'lucide-react';

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<Tag[]>([]);
  const [skillTags, setSkillTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSkillName, setSelectedSkillName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, catList, skillList] = await Promise.all([
          fetchProjectsApi({
            categoryTagId: selectedCategoryId || undefined,
            query: searchQuery || undefined,
          }),
          fetchTagsApi('CATEGORY'),
          fetchTagsApi('SKILL'),
        ]);

        setProjects(projRes.projects);
        setCategories(catList);
        setSkillTags(skillList);
      } catch (err) {
        console.error('Failed to load browse projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategoryId, searchQuery]);

  // Client-side skill filter if selectedSkillName is active
  const filteredProjects = projects.filter((p) => {
    if (!selectedSkillName) return true;
    const skills = Array.isArray(p.requiredSkillTags) ? p.requiredSkillTags : [];
    return skills.includes(selectedSkillName);
  });

  const handleResetFilters = () => {
    setSelectedCategoryId('');
    setSelectedSkillName('');
    setSearchQuery('');
  };

  return (
    <div className="w-full">
      <main className="py-6">
        {/* Header Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Sàn Dự án Thực tế dành cho Sinh viên
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Khám phá Dự án & Cơ hội Thực tập Linh hoạt
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tìm kiếm dự án doanh nghiệp SME phù hợp theo đúng danh mục & kỹ năng ứng dụng của bạn.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <ProjectFilter
              categories={categories}
              skillTags={skillTags}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              selectedSkillName={selectedSkillName}
              setSelectedSkillName={setSelectedSkillName}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onReset={handleResetFilters}
            />
          </div>

          {/* Main Content Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hiển thị {filteredProjects.length} dự án khả dụng
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                <span className="text-sm font-medium">Đang tải danh sách dự án...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="card-crisp p-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Không tìm thấy dự án phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc danh mục và kỹ năng.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-secondary text-xs mt-4"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
