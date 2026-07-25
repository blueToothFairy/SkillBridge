'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function StudentDashboard() {
  const { studentProfile, projects, applications, portfolioEntries } = useApp();

  const activeProject = projects.find((p) => p.status === 'IN_PROGRESS');
  const openProjects = projects.filter((p) => p.status === 'OPEN').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-brand-primary text-[11px] font-bold px-2 py-0.5 rounded">
              STUDENT DASHBOARD
            </span>
            <span className="text-xs text-slate-500">
              {studentProfile.university} · {studentProfile.major} ({studentProfile.year}th Year)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {studentProfile.fullName}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            You have <strong className="text-slate-800">1 project in progress</strong> and{' '}
            <strong className="text-slate-800">{portfolioEntries.length} verified portfolio items</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/browse"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </Link>
          <Link
            href="/student/profile/stu-1"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Award className="h-4 w-4 text-emerald-500" />
            View Verified Portfolio
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Active Projects
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">1</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-brand-primary" /> Milestone 3 in review
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Submitted Applications
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 1 Shortlisted
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Verified Portfolio Entries
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{portfolioEntries.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified by SkillBridge
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Profile Skill Tags
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {studentProfile.skills.expert.length + studentProfile.skills.proficient.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Predefined tag list</p>
        </div>
      </div>

      {/* Active Project Card */}
      {activeProject && (
        <div className="card-crisp p-6 border-l-4 border-l-brand-primary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="status-pill status-in-progress">In Progress</span>
                <span className="text-xs font-semibold text-slate-500">
                  {activeProject.smeCompany}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{activeProject.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Budget: {(activeProject.budgetVnd).toLocaleString()} VND (~£480) · Duration: {activeProject.durationWeeks} weeks
              </p>
            </div>
            <Link
              href={`/workspace/${activeProject.id}`}
              className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
            >
              Open Workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
              Milestone Progress (2 of 4 Approved)
            </p>
            <div className="space-y-2">
              {activeProject.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        m.status === 'ACCEPTED'
                          ? 'bg-emerald-600 text-white'
                          : m.status === 'SUBMITTED'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{m.title}</p>
                      <p className="text-[11px] text-slate-500">Due: {m.deadline}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      m.status === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.status === 'SUBMITTED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.status === 'ACCEPTED'
                      ? 'Approved'
                      : m.status === 'SUBMITTED'
                      ? 'Under Review'
                      : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-primary" /> Recommended Projects for You
          </h2>
          <Link
            href="/student/browse"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
          >
            View all projects ({projects.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {openProjects.map((proj) => (
            <div key={proj.id} className="card-crisp p-5 card-crisp-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">{proj.category}</span>
                  <span className="status-pill status-open">Open</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base line-clamp-1">{proj.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{proj.smeCompany}</p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{proj.description}</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {proj.requiredSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="tag-predefined">
                      {skill}
                    </span>
                  ))}
                  {proj.requiredSkills.length > 3 && (
                    <span className="tag-predefined">+{proj.requiredSkills.length - 3}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {(proj.budgetVnd).toLocaleString()} VND
                  </p>
                  <p className="text-[11px] text-slate-500">{proj.durationWeeks} weeks</p>
                </div>
                <Link
                  href={`/student/projects/${proj.id}`}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
