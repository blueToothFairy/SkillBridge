'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Building,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  FolderGit2,
} from 'lucide-react';

export default function SMEDashboard() {
  const { projects, applications } = useApp();

  const smeProjects = projects;
  const inProgressProject = projects.find((p) => p.status === 'IN_PROGRESS');
  const openProjects = projects.filter((p) => p.status === 'OPEN');

  return (
    <div className="space-y-6">
      {/* SME Header Banner */}
      <div className="card-crisp p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-100 text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded">
              SME PORTAL
            </span>
            <span className="text-xs text-slate-400">Artisan Coffee Co. · Employer</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Employer Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Manage your project postings, review student skill-match scores, and approve milestone deliverables under simulated platform escrow.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/sme/post-project"
            className="btn-accent-green flex items-center gap-2 text-sm font-bold shadow-xs"
          >
            <PlusCircle className="h-4 w-4" /> Post New Project
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Posted Projects
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{smeProjects.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <FolderGit2 className="h-3.5 w-3.5 text-blue-600" /> 1 in progress
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Applications
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {applications.length + 10}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-emerald-600" /> Skill-tag ranked
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Simulated Escrow Locked
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">14,400,000 VND</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Status: LOCKED
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Auto-Accept Status
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">28 Days</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Day 28 safety rule
          </p>
        </div>
      </div>

      {/* Active Project in Progress */}
      {inProgressProject && (
        <div className="card-crisp p-6 border-l-4 border-l-slate-900 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="status-pill status-in-progress">In Progress</span>
                <span className="text-xs font-bold text-slate-500">
                  Assigned Student: {inProgressProject.acceptedStudentName} ({inProgressProject.acceptedStudentUniversity})
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{inProgressProject.title}</h2>
              <p className="text-xs text-slate-500">
                Budget: {(inProgressProject.budgetVnd).toLocaleString()} VND (~£480) · Duration: {inProgressProject.durationWeeks} weeks
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/workspace/${inProgressProject.id}`}
                className="btn-secondary text-xs py-2 px-3"
              >
                Project Workspace
              </Link>
              <Link
                href={`/escrow/${inProgressProject.id}`}
                className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs py-2 px-4"
              >
                Acceptance &amp; Escrow
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Milestone Review Action Needed:
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Milestone #3 (Refined logo + brand guidelines)</strong> deliverable link submitted by Alex Chen. Awaiting your review.
                </span>
              </div>
              <Link
                href={`/workspace/${inProgressProject.id}`}
                className="btn-primary bg-amber-600 hover:bg-amber-700 text-xs py-1.5 px-3 shrink-0"
              >
                Review Deliverable
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Projects Needing Applicants Review */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" /> Open Projects &amp; Applicants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openProjects.map((proj) => (
            <div key={proj.id} className="card-crisp p-5 bg-white flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">{proj.category}</span>
                  <span className="status-pill status-open">Open</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">{proj.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">{proj.description}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {proj.requiredSkills.map((s) => (
                    <span key={s} className="tag-predefined text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{proj.applicantCount} Applicants</p>
                  <p className="text-[11px] text-slate-500">Skill-tag overlap ranked</p>
                </div>
                <Link
                  href={`/sme/matching/${proj.id}`}
                  className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  Review Applicants <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
