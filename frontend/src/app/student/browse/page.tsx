'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilter from '@/components/projects/ProjectFilter';
import ApplyModal from '@/components/applications/ApplyModal';
import { fetchProjectsApi } from '@/lib/api/projects';
import { fetchTagsApi } from '@/lib/api/tags';
import { applyToProjectApi } from '@/lib/api/applications';
import { useAuth } from '@/context/AuthContext';
import { ApiProject, Tag } from '@/types';
import { Loader2, Search } from 'lucide-react';

function matchesDuration(weeks: number, filter: string) {
  if (!filter) return true;
  if (filter === '1-2') return weeks >= 1 && weeks <= 2;
  if (filter === '3-4') return weeks >= 3 && weeks <= 4;
  if (filter === '5+') return weeks >= 5;
  return true;
}

export default function BrowseProjectsPage() {
  const router = useRouter();
  const { token, isAuthenticated, role } = useAuth();

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<Tag[]>([]);
  const [skillTags, setSkillTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSkillName, setSelectedSkillName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [applyTarget, setApplyTarget] = useState<ApiProject | null>(null);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, catList, skillList] = await Promise.all([
          fetchProjectsApi({
            categoryTagId: selectedCategoryId || undefined,
            query: searchQuery || undefined,
            limit: 50,
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

  const filteredProjects = projects.filter((p) => {
    if (selectedSkillName) {
      const skills = Array.isArray(p.requiredSkillTags) ? p.requiredSkillTags : [];
      if (!skills.includes(selectedSkillName)) return false;
    }
    return matchesDuration(p.durationWeeks, durationWeeks);
  });

  const handleResetFilters = () => {
    setSelectedCategoryId('');
    setSelectedSkillName('');
    setDurationWeeks('');
    setSearchInput('');
    setSearchQuery('');
  };

  const handleApplyClick = (project: ApiProject) => {
    if (!isAuthenticated || role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setApplyError(null);
    setApplySuccess(false);
    setApplyTarget(project);
  };

  const handleSubmitApply = async (coverMessage: string) => {
    if (!token || !applyTarget) return;
    setSubmittingApply(true);
    setApplyError(null);
    try {
      await applyToProjectApi(token, applyTarget.id, coverMessage);
      setApplySuccess(true);
      setTimeout(() => {
        setApplyTarget(null);
        setApplySuccess(false);
        router.push('/student/applications');
      }, 1200);
    } catch (err: any) {
      setApplyError(err.message || 'Apply failed');
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Prototype header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse Projects</h1>
      </div>

      {/* Wide search — Hình 3 */}
      <div className="mb-6 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search projects, companies, or skills..."
          className="w-full pl-11 pr-28 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
          {filteredProjects.length} projects
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <ProjectFilter
            categories={categories}
            skillTags={skillTags}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedSkillName={selectedSkillName}
            setSelectedSkillName={setSelectedSkillName}
            durationWeeks={durationWeeks}
            setDurationWeeks={setDurationWeeks}
            onReset={handleResetFilters}
          />
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-sm">Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="card-crisp p-12 text-center bg-white">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No matching projects</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or another keyword.</p>
              <button type="button" onClick={handleResetFilters} className="btn-secondary text-xs mt-4">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} onApplyClick={handleApplyClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ApplyModal
        projectTitle={applyTarget?.title || ''}
        isOpen={!!applyTarget}
        isSubmitting={submittingApply}
        error={applyError}
        success={applySuccess}
        onClose={() => setApplyTarget(null)}
        onSubmit={handleSubmitApply}
      />
    </div>
  );
}
