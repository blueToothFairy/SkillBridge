'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PREDEFINED_CATEGORIES, PREDEFINED_SKILLS } from '@/lib/mockData';
import { Project, PredefinedCategory, PredefinedSkill } from '@/types';
import {
  Search,
  Filter,
  Bookmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function BrowseProjectsPage() {
  const { projects, applyToProject, applications, studentProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [durationFilter, setDurationFilter] = useState<string>('Any');
  const [selectedProjectForApply, setSelectedProjectForApply] = useState<Project | null>(null);
  const [coverMessage, setCoverMessage] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (p.status !== 'OPEN') return false;

    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.smeCompany.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;

    const matchesSkill =
      selectedSkill === 'All' ||
      p.requiredSkills.includes(selectedSkill as PredefinedSkill);

    let matchesDuration = true;
    if (durationFilter === '1-2 weeks') matchesDuration = p.durationWeeks <= 2;
    if (durationFilter === '3-4 weeks') matchesDuration = p.durationWeeks >= 3 && p.durationWeeks <= 4;
    if (durationFilter === '5+ weeks') matchesDuration = p.durationWeeks > 4;

    return matchesSearch && matchesCategory && matchesSkill && matchesDuration;
  });

  const handleOpenApplyModal = (proj: Project) => {
    setSelectedProjectForApply(proj);
    setCoverMessage('');
    setAppliedSuccess(false);
  };

  const handleSubmitApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForApply) return;
    applyToProject(selectedProjectForApply.id, coverMessage);
    setAppliedSuccess(true);
    setTimeout(() => {
      setSelectedProjectForApply(null);
      setAppliedSuccess(false);
    }, 1500);
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Short-term pilot projects (1–4 weeks) posted by verified SMEs in Ho Chi Minh City.
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md border border-slate-200 self-start sm:self-auto">
          {filteredProjects.length} Projects Available
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6 bg-white p-4 rounded-lg border border-slate-200 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600" /> Filters
            </span>
            {(selectedCategory !== 'All' || selectedSkill !== 'All' || durationFilter !== 'Any') && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedSkill('All');
                  setDurationFilter('Any');
                }}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Reset all
              </button>
            )}
          </div>

          {/* Search Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Category</label>
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {PREDEFINED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Duration</label>
            <div className="space-y-1">
              {['Any', '1-2 weeks', '3-4 weeks', '5+ weeks'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDurationFilter(dur)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    durationFilter === dur
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Predefined Skills */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Required Skills (Predefined)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedSkill('All')}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  selectedSkill === 'All'
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Skills
              </button>
              {PREDEFINED_SKILLS.slice(0, 15).map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(skill)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    selectedSkill === skill
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Projects Grid */}
        <main className="lg:col-span-3">
          {filteredProjects.length === 0 ? (
            <div className="card-crisp p-12 text-center">
              <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No projects found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or filters to find available SME projects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const hasApplied = applications.some((a) => a.projectId === proj.id);
                const initials = getCompanyInitials(proj.smeCompany);

                return (
                  <div
                    key={proj.id}
                    className="card-crisp p-5 card-crisp-hover flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                              {proj.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {proj.smeCompany}
                            </p>
                          </div>
                        </div>
                        <button
                          aria-label="Bookmark project"
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                        {proj.description}
                      </p>

                      {/* Required Skill Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {proj.requiredSkills.map((skill) => {
                          const isStudentSkill = [
                            ...studentProfile.skills.expert,
                            ...studentProfile.skills.proficient,
                            ...studentProfile.skills.familiar,
                          ].includes(skill);

                          return (
                            <span
                              key={skill}
                              className={isStudentSkill ? 'tag-matched' : 'tag-predefined'}
                            >
                              {skill} {isStudentSkill && '✓'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {(proj.budgetVnd).toLocaleString()} VND
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {proj.durationWeeks} weeks
                          </span>
                          <span>·</span>
                          <span>{proj.applicantCount} applicants</span>
                        </p>
                      </div>

                      {hasApplied ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(proj)}
                          className="btn-primary text-xs py-1.5 px-4 bg-blue-600 hover:bg-blue-700"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Apply Modal */}
      {selectedProjectForApply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-lg w-full p-6 shadow-xl space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedProjectForApply(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Individual Project Application
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {selectedProjectForApply.title}
              </h2>
              <p className="text-xs text-slate-500">{selectedProjectForApply.smeCompany}</p>
            </div>

            {appliedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-500">
                  The SME will review candidate skill match scores and shortlist applicants.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApply} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Applicant: {studentProfile.fullName}</p>
                  <p className="text-slate-600">
                    {studentProfile.university} · {studentProfile.major}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {studentProfile.skills.expert.map((s) => (
                      <span key={s} className="tag-matched text-[10px]">
                        {s} (Expert)
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cover Message / Why you are a great fit (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Briefly describe your relevant coursework, university projects, or experience with the required skill tags..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Max 2,000 characters.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForApply(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs">
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
