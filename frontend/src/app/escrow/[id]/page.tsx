'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchProjectByIdApi } from '@/lib/api/projects';
import {
  EscrowStatusResponse,
  fetchEscrowStatusApi,
  releaseEscrowApi,
} from '@/lib/api/escrow';
import { ApiProject } from '@/types';
import EscrowBadge from '@/components/escrow/EscrowBadge';
import EscrowModal from '@/components/escrow/EscrowModal';
import {
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

export default function ProjectEscrowPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { token, isAuthenticated, isLoading: authLoading, role } = useAuth();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [escrow, setEscrow] = useState<EscrowStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [proj, status] = await Promise.all([
        fetchProjectByIdApi(projectId),
        fetchEscrowStatusApi(token, projectId),
      ]);
      setProject(proj);
      setEscrow(status);
    } catch (err: any) {
      setError(err.message || 'Không thể tải escrow');
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (token) load();
  }, [authLoading, isAuthenticated, token, load, router]);

  const handleRelease = async () => {
    if (!token || !projectId) return;
    setReleasing(true);
    setError(null);
    try {
      const status = await releaseEscrowApi(token, projectId);
      setEscrow(status);
      setSuccessMsg('Escrow released successfully (simulated).');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReleasing(false);
    }
  };

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
      amount
    );

  const milestoneBadge = (m: EscrowStatusResponse['milestones'][0], escrowStatus: string) => {
    if (escrowStatus === 'RELEASED' || m.isFundReleased) {
      return { label: 'Released', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (m.status === 'ACCEPTED') {
      return { label: 'Ready for Release', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: 'Locked', className: 'bg-amber-50 text-amber-800 border-amber-200' };
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading acceptance & escrow...
      </div>
    );
  }

  if (!project || !escrow) {
    return <div className="p-8 text-center text-slate-500">{error || 'Not found'}</div>;
  }

  const isReleased = escrow.escrowStatus === 'RELEASED';
  const readyForRelease = escrow.canRelease || isReleased;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb — Hình 5 */}
      <p className="text-xs text-slate-500 font-medium">
        Projects &gt; {project.title} &gt; Final Acceptance
      </p>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Project Acceptance &amp; Escrow
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and approve the completed project to release payment.
          </p>
        </div>
        <span
          className={`self-start text-xs font-bold px-3 py-1.5 rounded-full border ${
            isReleased
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : readyForRelease
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          {isReleased ? 'Escrow Released' : readyForRelease ? 'Ready for Release' : 'In Progress'}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
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
                <span className="text-slate-500 block font-medium">Category</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {project.categoryTag?.name || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Total Budget</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">
                  {formatVnd(escrow.totalBudget)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Duration</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {project.durationWeeks} weeks
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Project Status</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{escrow.projectStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Milestones</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {escrow.milestones.filter((m) => m.status === 'ACCEPTED').length} of{' '}
                  {escrow.milestones.length} completed
                </span>
              </div>
            </div>
          </div>

          {/* Completed milestones list */}
          <div className="card-crisp p-6 bg-white space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Completed Milestones
            </h2>
            {escrow.milestones.length === 0 && (
              <p className="text-xs text-slate-500 py-4">Chưa có milestone nào.</p>
            )}
            {escrow.milestones.map((m) => {
              const badge = milestoneBadge(m, escrow.escrowStatus);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.status}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{formatVnd(m.amountVnd)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card-crisp p-5 bg-white space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Escrow Status
              </div>
              <EscrowBadge status={escrow.escrowStatus} />
            </div>

            <div className="space-y-2">
              {escrow.milestones.map((m) => {
                const badge = milestoneBadge(m, escrow.escrowStatus);
                return (
                  <div key={m.id} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-600 truncate">{m.title}</span>
                    <span className="font-semibold text-slate-800 shrink-0">
                      {formatVnd(m.amountVnd)}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge.className}`}>
                      {badge.label === 'Released' ? 'OK' : badge.label === 'Locked' ? 'Hold' : 'Ready'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Total to release</span>
              <span className="font-extrabold text-slate-900">{formatVnd(escrow.totalBudget)}</span>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
              Funds are held in simulated escrow and released upon SME approval. No real payment in MVP.
            </div>

            {escrow.canDeposit && role === 'SME' && (
              <button
                type="button"
                onClick={() => setShowDeposit(true)}
                className="w-full btn-primary text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700"
              >
                Deposit / Lock Escrow
              </button>
            )}
          </div>

          {/* Your Decision — Hình 5 */}
          <div className="card-crisp p-5 bg-white space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Your Decision</h3>

            <button
              type="button"
              onClick={handleRelease}
              disabled={!escrow.canRelease || releasing}
              className="w-full btn-accent-green text-xs py-3 inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {releasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approve Project &amp; Release Escrow
            </button>

            <button
              type="button"
              disabled
              title="Thịnh Day 27 — API revise chưa wire"
              className="w-full text-xs py-2.5 rounded-lg border border-amber-300 text-amber-700 font-semibold bg-white opacity-60 cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Request Revision
            </button>

            <ul className="pt-2 space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Community review: N/A (V1.1)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    escrow.milestones.length > 0 &&
                    escrow.milestones.every((m) => m.status === 'ACCEPTED')
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }`}
                />
                All milestones complete
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    escrow.milestones.some((m) => m.status === 'ACCEPTED' || m.status === 'SUBMITTED')
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }`}
                />
                All deliverables received
              </li>
            </ul>

            <Link
              href={`/projects/${project.id}/milestones`}
              className="block text-center text-xs font-semibold text-brand-primary hover:underline pt-1"
            >
              Open milestone workspace →
            </Link>
          </div>
        </div>
      </div>

      {token && (
        <EscrowModal
          isOpen={showDeposit}
          projectId={project.id}
          projectTitle={project.title}
          budget={Number(project.budget)}
          token={token}
          onClose={() => setShowDeposit(false)}
          onSuccess={(status) => {
            setEscrow(status);
            setSuccessMsg('Escrow HELD — funds locked for milestones.');
            load();
          }}
        />
      )}
    </div>
  );
}
