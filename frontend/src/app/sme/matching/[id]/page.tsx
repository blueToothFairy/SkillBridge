'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Users,
  CheckCircle2,
  XCircle,
  Star,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function SMEMatchingPage() {
  const params = useParams();
  const projectId = (params?.id as string) || 'proj-2';
  const router = useRouter();

  const { getProjectById, applications, confirmMatching } = useApp();
  const project = getProjectById(projectId) || getProjectById('proj-2');

  const projectApps = applications.filter(
    (a) => a.projectId === projectId || a.projectId === 'proj-2'
  );

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [matchingSuccess, setMatchingSuccess] = useState(false);

  if (!project) {
    return <div className="p-8 text-center text-slate-500">Project not found.</div>;
  }

  const handleToggleSelectStudent = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      if (selectedStudentIds.length < project.maxApplicants) {
        setSelectedStudentIds([...selectedStudentIds, studentId]);
      }
    }
  };

  const handleConfirmMatching = () => {
    if (selectedStudentIds.length === 0) return;
    confirmMatching(project.id, selectedStudentIds);
    setMatchingSuccess(true);
    setTimeout(() => {
      router.push(`/workspace/${project.id}`);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Matching &amp; Selection &gt; {project.title}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" /> Applicant Skill-Tag Matching
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Applicants ranked by predefined skill-tag overlap count. Select 1 to {project.maxApplicants}{' '}
            candidates to confirm match.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-semibold text-slate-500 block">Required Skills</span>
          <div className="flex flex-wrap gap-1 mt-1 justify-end">
            {project.requiredSkills.map((sk) => (
              <span key={sk} className="tag-predefined text-[11px]">
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Match Confirmation Bar */}
      <div className="card-crisp p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-300 font-medium">
            Selected Applicants: <strong className="text-white font-bold">{selectedStudentIds.length}</strong> of {project.maxApplicants} max
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Confirming selection will set project status to <span className="text-blue-400 font-mono">IN_PROGRESS</span> and lock simulated escrow.
          </p>
        </div>

        <button
          onClick={handleConfirmMatching}
          disabled={selectedStudentIds.length === 0}
          className={`btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-bold ${
            selectedStudentIds.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Confirm Match &amp; Lock Escrow
        </button>
      </div>

      {matchingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-xs font-bold text-center">
          Match confirmed! Transitioning project to IN_PROGRESS &amp; locking simulated escrow...
        </div>
      )}

      {/* Applicant Cards List */}
      <div className="space-y-4">
        {projectApps.map((app) => {
          const isSelected = selectedStudentIds.includes(app.studentId);

          return (
            <div
              key={app.id}
              className={`card-crisp p-5 bg-white space-y-4 border-2 transition-all ${
                isSelected ? 'border-blue-600 shadow-md' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg shrink-0">
                    {app.studentName.split(' ').map((n) => n[0]).join('')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{app.studentName}</h3>
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {app.studentUniversity} · Year {app.studentYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{app.studentMajor}</p>

                    {/* Skill Match Overlap Score Badge */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                        {app.matchScore}% Skill Tag Overlap ({app.matchingSkillsCount}/{app.totalRequiredSkills} matched)
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Applied: {app.appliedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleToggleSelectStudent(app.studentId)}
                    className={`btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : '+ Select Applicant'}
                  </button>
                </div>
              </div>

              {/* Cover Message */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">Cover Message:</span>
                <p className="leading-relaxed italic">{app.coverMessage}</p>
              </div>

              {/* Skill Chips Comparison */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-slate-500 font-medium mr-1">Matched Skill Tags:</span>
                  {app.skills.map((s) => (
                    <span key={s} className="tag-matched text-[11px]">
                      {s} ✓
                    </span>
                  ))}
                </div>

                <a
                  href="/student/profile/stu-1"
                  target="_blank"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Verified Portfolio <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
