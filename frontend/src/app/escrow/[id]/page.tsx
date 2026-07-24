'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Award,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

export default function ProjectAcceptanceEscrowPage() {
  const params = useParams();
  const projectId = (params?.id as string) || 'proj-1';
  const router = useRouter();

  const { getProjectById, acceptProjectAndReleaseEscrow } = useApp();
  const project = getProjectById(projectId) || getProjectById('proj-1');

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  if (!project) {
    return <div className="p-8 text-center text-slate-500">Project not found.</div>;
  }

  const isReleased = project.escrowStatus === 'RELEASED' || project.status === 'COMPLETED';

  const handleApproveAndRelease = () => {
    acceptProjectAndReleaseEscrow(project.id);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Title (Photo #5 match) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">
            Projects &gt; {project.title} &gt; Final Acceptance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Project Acceptance & Escrow
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and approve the completed project deliverables to release simulated escrow funds.
          </p>
        </div>

        <span
          className={`status-pill self-start sm:self-auto text-xs px-3 py-1.5 ${
            isReleased ? 'status-completed' : 'status-open'
          }`}
        >
          {isReleased ? 'Escrow Released' : 'Ready for Release'}
        </span>
      </div>

      {/* Main Grid (2 columns: Left summary & milestones, Right Escrow Status & SME Decision) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary Card (Photo #5 match) */}
          <div className="card-crisp p-6 bg-white space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Project Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Project</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{project.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Student</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {project.acceptedStudentName || 'Alex Chen'} · UCL
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Category</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{project.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Total Budget</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">
                  {(project.budgetVnd).toLocaleString()} VND (~£480)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Duration</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {project.durationWeeks} weeks
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Milestones</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {project.milestones.length} of {project.milestones.length} completed
                </span>
              </div>
            </div>
          </div>

          {/* Completed Milestones List (Photo #5 match) */}
          <div className="card-crisp p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900">Completed Milestones</h2>
              <span className="text-xs font-semibold text-slate-500">
                Total: {(project.budgetVnd).toLocaleString()} VND
              </span>
            </div>

            <div className="space-y-3">
              {project.milestones.map((m) => {
                const milestoneReleased = isReleased || m.status === 'ACCEPTED';
                return (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{m.title}</p>
                        <p className="text-[11px] text-slate-500">Deadline: {m.deadline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-slate-900">
                        {(m.amountVnd).toLocaleString()} VND
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded ${
                          milestoneReleased
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {milestoneReleased ? 'Released' : 'Ready for Release'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Escrow Status & Decision Card (Photo #5 match) */}
        <div className="space-y-6">
          {/* Escrow Status Breakdown Box */}
          <div className="card-crisp p-6 bg-white space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Escrow Status
            </h2>

            <div className="space-y-2 text-xs">
              {project.milestones.map((m) => (
                <div key={m.id} className="flex justify-between items-center text-slate-600">
                  <span className="truncate pr-2">{m.title}</span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    ✓ {(m.amountVnd).toLocaleString()} VND
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total to release</span>
                <span className="text-base text-emerald-700">
                  {(project.budgetVnd).toLocaleString()} VND
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-[11px] text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-600" /> Simulated Escrow Holding
              </p>
              <p className="text-blue-700 leading-tight">
                Funds are held in simulated platform escrow and automatically released upon your final approval.
              </p>
            </div>
          </div>

          {/* SME Decision Box (Photo #5 match) */}
          <div className="card-crisp p-6 bg-white space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Your Decision
            </h2>

            {isReleased ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-2 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Escrow Released & Completed!</p>
                <p className="text-emerald-700 text-[11px]">
                  Verified Portfolio entry and Digital Certificate auto-issued to student.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleApproveAndRelease}
                  className="w-full btn-accent-green text-sm py-3 font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve Project & Release Escrow
                </button>

                <button
                  onClick={() => router.push(`/workspace/${project.id}`)}
                  className="w-full btn-secondary text-xs py-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Request Revision
                </button>

                {/* Checklist */}
                <div className="pt-2 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All milestones complete
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All deliverable links received
                  </div>
                </div>

                {/* Day 28 Auto-Accept Warning Banner */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Day 28 Auto-Accept Rule
                  </p>
                  <p className="text-amber-800 leading-tight">
                    In accordance with SRS §3.5 business rules, if no action is taken within 28 days, the system will auto-accept and release funds to the student.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-md w-full p-6 shadow-xl space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Project Approved & Escrow Released!</h3>
            <p className="text-xs text-slate-600">
              The project is now marked as <strong>COMPLETED</strong>. Simulated escrow funds of{' '}
              <strong>{(project.budgetVnd).toLocaleString()} VND</strong> have been released.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 text-left space-y-1">
              <p className="font-semibold flex items-center gap-1 text-emerald-700">
                <FileCheck className="h-3.5 w-3.5" /> Auto-Generated Artifacts:
              </p>
              <p>• Verified Portfolio entry added to student profile.</p>
              <p>• Digital Certificate generated with verification code.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/student/profile/stu-1"
                className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs py-2 px-4"
              >
                View Verified Portfolio & Certificate
              </Link>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
