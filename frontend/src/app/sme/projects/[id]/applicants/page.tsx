'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchProjectByIdApi } from '@/lib/api/projects';
import {
  ApiApplication,
  confirmMatchApi,
  fetchProjectApplicantsApi,
  updateApplicationStatusApi,
} from '@/lib/api/applications';
import { ApiProject } from '@/types';
import EscrowBadge from '@/components/escrow/EscrowBadge';
import EscrowModal from '@/components/escrow/EscrowModal';
import {
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function SMEApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { token, isAuthenticated, isLoading: authLoading, role } = useAuth();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [applicants, setApplicants] = useState<ApiApplication[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  const load = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [proj, apps] = await Promise.all([
        fetchProjectByIdApi(projectId),
        fetchProjectApplicantsApi(token, projectId),
      ]);
      setProject(proj);
      setApplicants(apps);
      const preselected = apps
        .filter((a) => a.status === 'ACCEPTED' || a.status === 'SHORTLISTED')
        .map((a) => a.studentId);
      setSelectedStudentIds(preselected);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách ứng viên');
    } finally {
      setLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (role !== 'SME' && role !== 'ADMIN'))) {
      router.push('/login');
      return;
    }
    if (token) load();
  }, [authLoading, isAuthenticated, role, token, load, router]);

  const toggleSelect = (studentId: string) => {
    if (!project) return;
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) return prev.filter((id) => id !== studentId);
      if (prev.length >= project.maxApplicants) return prev;
      return [...prev, studentId];
    });
  };

  const handleShortlist = async (applicationId: string) => {
    if (!token) return;
    try {
      await updateApplicationStatusApi(token, applicationId, 'SHORTLISTED');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmMatch = async () => {
    if (!token || !project || selectedStudentIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await confirmMatchApi(token, project.id, selectedStudentIds);
      setProject(result.project);
      setApplicants(result.applications);
      setSuccessMsg('Đã confirm matching. Tiếp theo: ký quỹ (escrow deposit) để mở IN_PROGRESS.');
      if (result.project.escrowStatus === 'PENDING' || result.project.escrowStatus === 'NONE') {
        setShowEscrowModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Confirm match thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải ứng viên...
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center text-slate-500">{error || 'Project not found'}</div>;
  }

  const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href={`/sme/projects/${project.id}`}
            className="text-xs text-slate-500 hover:text-brand-primary inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Chi tiết dự án
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" /> Ứng viên & Skill Matching
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách đã sắp xếp theo % skill-tag overlap. Chọn 1–{project.maxApplicants} ứng viên để confirm.
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-2">{project.title}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EscrowBadge status={project.escrowStatus} />
          <div className="flex flex-wrap gap-1 justify-end">
            {requiredSkills.map((sk) => (
              <span key={sk} className="tag-predefined text-[11px]">
                {sk}
              </span>
            ))}
          </div>
        </div>
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

      <div className="card-crisp p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-300">
            Đã chọn: <strong className="text-white">{selectedStudentIds.length}</strong> / {project.maxApplicants}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Confirm → project <span className="text-blue-300 font-mono">MATCHED</span>. Deposit escrow →{' '}
            <span className="text-emerald-300 font-mono">IN_PROGRESS</span> + HELD.
          </p>
        </div>
        <div className="flex gap-2">
          {(project.status === 'MATCHED' || project.escrowStatus === 'PENDING') && (
            <button
              type="button"
              onClick={() => setShowEscrowModal(true)}
              className="text-xs py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 font-bold inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Ký quỹ
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmMatch}
            disabled={selectedStudentIds.length === 0 || submitting || project.status === 'IN_PROGRESS'}
            className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 font-bold disabled:opacity-40"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm Match
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {applicants.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">Chưa có ứng viên nào.</div>
        )}

        {applicants.map((app) => {
          const isSelected = selectedStudentIds.includes(app.studentId);
          const name = app.student?.fullName || 'Student';

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
                    {name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{name}</h3>
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {app.student?.university} · Year {app.student?.year}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{app.student?.major}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                        {app.matchScore}% Skill Match ({app.matchingSkillsCount}/{app.totalRequiredSkills})
                      </span>
                      <span className="text-xs text-slate-500">
                        Applied: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {app.status === 'APPLIED' && (
                    <button
                      type="button"
                      onClick={() => handleShortlist(app.id)}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      Shortlist
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSelect(app.studentId)}
                    disabled={project.status === 'IN_PROGRESS'}
                    className={`btn-secondary text-xs py-2 px-4 font-bold ${
                      isSelected ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    {isSelected ? '✓ Selected' : '+ Select'}
                  </button>
                </div>
              </div>

              {app.coverMessage && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Cover Message:</span>
                  <p className="leading-relaxed italic">{app.coverMessage}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-slate-500 font-medium mr-1">Matched skills:</span>
                  {app.matchingSkills.map((s) => (
                    <span key={s} className="tag-matched text-[11px]">
                      {s} ✓
                    </span>
                  ))}
                  {app.matchingSkills.length === 0 && (
                    <span className="text-slate-400 italic">Không trùng skill nào</span>
                  )}
                </div>
                <Link
                  href={`/student/profile/${app.studentId}`}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Xem profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {token && (
        <EscrowModal
          isOpen={showEscrowModal}
          projectId={project.id}
          projectTitle={project.title}
          budget={Number(project.budget)}
          token={token}
          onClose={() => setShowEscrowModal(false)}
          onSuccess={(status) => {
            setProject((prev) =>
              prev
                ? {
                    ...prev,
                    escrowStatus: status.escrowStatus,
                    status: status.projectStatus as ApiProject['status'],
                  }
                : prev
            );
            setSuccessMsg('Escrow HELD — dự án đã sẵn sàng làm việc.');
          }}
        />
      )}
    </div>
  );
}
