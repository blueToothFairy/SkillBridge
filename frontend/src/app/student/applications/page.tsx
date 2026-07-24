'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { FileCheck, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function MyApplicationsPage() {
  const { applications } = useApp();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-blue-600" /> My Submitted Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual project application statuses and SME skill-tag match evaluations.
          </p>
        </div>
        <Link href="/student/browse" className="btn-primary text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700">
          Browse More Projects
        </Link>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="card-crisp p-5 bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Application #{app.id}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{app.projectTitle}</h3>
                <p className="text-xs text-slate-500">Applied on {app.appliedAt}</p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  app.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : app.status === 'SHORTLISTED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {app.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 block mb-1">Your Cover Message:</span>
              <p className="text-slate-600 leading-relaxed italic">{app.coverMessage}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {app.matchScore}% Skill Tag Match ({app.matchingSkillsCount}/{app.totalRequiredSkills} matched)
              </span>

              {app.status === 'ACCEPTED' && (
                <Link
                  href={`/workspace/${app.projectId}`}
                  className="btn-accent-green text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  Open Workspace <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
