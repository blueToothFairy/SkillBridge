'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { parseMarkdown } from '@/lib/markdown';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  MessageSquare,
  FileText,
} from 'lucide-react';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = (params?.id as string) || 'proj-1';

  const { getProjectById, role, submitMilestoneDeliverable, reviewMilestone } = useApp();
  const project = getProjectById(projectId) || getProjectById('proj-1');

  const [activeTab, setActiveTab] = useState<'Overview' | 'Milestones' | 'Deliverables' | 'Activity'>('Overview');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [activeMilestoneForSubmit, setActiveMilestoneForSubmit] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-500">
        Project not found.
      </div>
    );
  }

  const approvedCount = project.milestones.filter((m) => m.status === 'ACCEPTED').length;
  const totalMilestones = project.milestones.length || 1;
  const progressPercent = Math.round((approvedCount / totalMilestones) * 100);

  const handleSubmitDeliverable = (milestoneId: string) => {
    if (!deliverableInput.trim()) return;
    submitMilestoneDeliverable(project.id, milestoneId, deliverableInput);
    setDeliverableInput('');
    setActiveMilestoneForSubmit(null);
  };

  const handleApproveMilestone = (milestoneId: string) => {
    reviewMilestone(project.id, milestoneId, 'APPROVE');
  };

  const handleRequestRevision = (milestoneId: string) => {
    reviewMilestone(project.id, milestoneId, 'REVISION', revisionFeedback);
    setShowRevisionModal(null);
    setRevisionFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Top Workspace Header (Photo #4 match) */}
      <div className="card-crisp p-6 bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1">
              {project.smeCompany} &gt; {project.title}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {project.title}
              </h1>
              <span className="status-pill status-in-progress">
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Progress & Metrics */}
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 block">Progress</span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-bold text-slate-900">{progressPercent}%</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block">Milestones</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {approvedCount}/{totalMilestones} approved
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Budget</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {(project.budgetVnd).toLocaleString()} VND
              </span>
            </div>

            {role === 'SME' && (
              <Link
                href={`/escrow/${project.id}`}
                className="btn-primary text-xs py-2 px-4"
              >
                Review Acceptance & Escrow
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-sm font-semibold pt-2">
          {(['Overview', 'Milestones', 'Deliverables', 'Activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout (2 columns: Left brief & milestones, Right activity stream) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Brief Card (Photo #4 match) */}
          <div className="card-crisp p-5 bg-white space-y-3">
            <h2 className="text-base font-bold text-slate-900">Project Brief</h2>
            <div className="space-y-1">{parseMarkdown(project.description)}</div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Client</span>
                <span className="font-bold text-slate-900">{project.smeCompany}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Student</span>
                <span className="font-bold text-slate-900">
                  {project.acceptedStudentName || 'Alex Chen'} ({project.acceptedStudentUniversity})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Simulated Escrow</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> LOCKED
                </span>
              </div>
            </div>
          </div>

          {/* Milestone Timeline (Photo #4 match) */}
          <div className="card-crisp p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900">Milestone Timeline</h2>
              <span className="text-xs text-slate-500">
                Deliverable URLs required for submission
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {project.milestones.map((m, idx) => {
                const isAccepted = m.status === 'ACCEPTED';
                const isSubmitted = m.status === 'SUBMITTED';
                const isRevision = m.status === 'REVISION_REQUIRED';

                return (
                  <div key={m.id} className="relative pl-10 space-y-2">
                    {/* Status Circle Icon */}
                    <div
                      className={`absolute left-1 top-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isAccepted
                          ? 'bg-emerald-600 text-white'
                          : isSubmitted
                          ? 'bg-amber-500 text-white'
                          : isRevision
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isSubmitted ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                          <span className="text-xs font-semibold text-slate-500">
                            ({(m.amountVnd).toLocaleString()} VND on approval)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{m.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Deadline: {m.deadline}</p>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded shrink-0 ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSubmitted
                            ? 'bg-amber-100 text-amber-800'
                            : isRevision
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAccepted
                          ? 'Approved'
                          : isSubmitted
                          ? 'Under Review'
                          : isRevision
                          ? 'Revision Required'
                          : 'Pending'}
                      </span>
                    </div>

                    {/* Deliverable URL display if submitted/accepted */}
                    {m.deliverableUrl && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                          <span className="font-mono text-slate-700 truncate">
                            {m.deliverableUrl}
                          </span>
                        </div>
                        <a
                          href={m.deliverableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-primary font-semibold hover:text-brand-primary-hover hover:underline flex items-center gap-1 shrink-0 ml-2"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Revision Feedback alert */}
                    {isRevision && m.revisionFeedback && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                        <strong>SME Feedback:</strong> {m.revisionFeedback}
                      </div>
                    )}

                    {/* Action Controls for Student (Submit Deliverable URL) */}
                    {role === 'STUDENT' && (m.status === 'PENDING' || isRevision) && (
                      <div className="pt-2">
                        {activeMilestoneForSubmit === m.id ? (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                            <label className="text-xs font-bold text-slate-800 block">
                              Submit Deliverable URL (GitHub / Figma / Google Drive)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={deliverableInput}
                                onChange={(e) => setDeliverableInput(e.target.value)}
                                placeholder="https://figma.com/file/your-deliverable-link"
                                className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                              />
                              <button
                                onClick={() => handleSubmitDeliverable(m.id)}
                                className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
                              >
                                <Send className="h-3 w-3" /> Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveMilestoneForSubmit(m.id)}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            Submit Deliverable URL
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action Controls for SME (Approve / Request Revision) */}
                    {role === 'SME' && isSubmitted && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleApproveMilestone(m.id)}
                          className="btn-accent-green text-xs py-1.5 px-3"
                        >
                          Approve Milestone & Release Payment
                        </button>
                        <button
                          onClick={() => setShowRevisionModal(m.id)}
                          className="btn-secondary text-xs py-1.5 px-3 text-danger-state border-red-200 hover:bg-rose-50/50"
                        >
                          Request Revision
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Activity Feed (Photo #4 match) */}
        <div className="space-y-6">
          <div className="card-crisp p-5 bg-white space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Project Activity Log
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Alex Chen</strong> submitted Milestone 3 — Refined logo + brand guidelines
                  </p>
                  <p className="text-[11px] text-slate-400">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Sarah Mitchell</strong> left feedback on Milestone 2
                  </p>
                  <p className="text-[11px] text-slate-400">Yesterday</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Milestone 2 approved</strong> — 3,600,000 VND released to Alex Chen
                  </p>
                  <p className="text-[11px] text-slate-400">6 Dec 2024</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Milestone 1 approved</strong> — 3,600,000 VND released to Alex Chen
                  </p>
                  <p className="text-[11px] text-slate-400">30 Nov 2024</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-crisp p-4 bg-slate-50 text-slate-600 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <MessageSquare className="h-4 w-4 text-brand-primary" /> Integrated External Tools
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              In MVP, team collaboration occurs via your preferred external tools (Google Drive, Figma, GitHub, Discord). Submit deliverable URLs above.
            </p>
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Request Milestone Revision</h3>
            <p className="text-xs text-slate-500">
              Provide clear feedback for the student to update their deliverable.
            </p>
            <textarea
              rows={4}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="e.g. Please refine the secondary color palette vectors and upload high-res SVGs."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRevisionModal(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestRevision(showRevisionModal)}
                className="btn-primary bg-danger-state hover:bg-red-700 text-xs"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
