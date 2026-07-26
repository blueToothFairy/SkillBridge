'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProjectByIdApi } from '@/lib/api/projects';
import { applyToProjectApi, fetchMyApplicationsApi } from '@/lib/api/applications';
import { ApiProject } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { parseMarkdown } from '@/lib/markdown';
import ApplyModal from '@/components/applications/ApplyModal';
import EscrowBadge from '@/components/escrow/EscrowBadge';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Tag as TagIcon,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function StudentProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { token, isAuthenticated, role } = useAuth();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isApplied, setIsApplied] = useState(false);
  const [appliedDate, setAppliedDate] = useState('');
  const [savedCoverMessage, setSavedCoverMessage] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProjectByIdApi(projectId);
        setProject(data);

        if (token && role === 'STUDENT') {
          const apps = await fetchMyApplicationsApi(token);
          const mine = apps.find((a) => a.projectId === projectId && a.status !== 'WITHDRAWN');
          if (mine) {
            setIsApplied(true);
            setAppliedDate(new Date(mine.createdAt).toLocaleDateString('vi-VN'));
            setSavedCoverMessage(mine.coverMessage || '');
            setMatchScore(mine.matchScore);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin dự án.');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, token, role]);

  const handleOpenApplyModal = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setApplyError(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApply = async (coverMessage: string) => {
    if (!token || !projectId) return;
    setSubmittingApply(true);
    setApplyError(null);
    try {
      const app = await applyToProjectApi(token, projectId, coverMessage);
      setIsApplied(true);
      setAppliedDate(new Date(app.createdAt).toLocaleDateString('vi-VN'));
      setSavedCoverMessage(app.coverMessage || coverMessage);
      setMatchScore(app.matchScore);
      setApplySuccess(true);
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess(false);
      }, 1400);
    } catch (err: any) {
      setApplyError(err.message || 'Ứng tuyển thất bại');
    } finally {
      setSubmittingApply(false);
    }
  };

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <span className="text-sm font-medium">Đang tải thông tin chi tiết dự án...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy dự án</h3>
        <p className="text-xs text-slate-500">{error || 'Dự án này không tồn tại hoặc đã bị gỡ bỏ.'}</p>
        <Link href="/student/browse" className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-4 mt-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại Sàn dự án
        </Link>
      </div>
    );
  }

  const categoryName = project.categoryTag?.name || 'General';
  const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];
  const companyName = project.sme?.companyName || 'Doanh nghiệp Đối tác';

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      <div>
        <Link
          href="/student/browse"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Sàn Dự án Sinh viên
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-crisp p-6 sm:p-8 bg-white space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md">
                  <TagIcon className="w-3.5 h-3.5" />
                  {categoryName}
                </span>
                <span className="status-pill status-open">{project.status}</span>
                <EscrowBadge status={project.escrowStatus} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {project.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{companyName}</span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Mô tả chi tiết dự án</h3>
              <div className="space-y-1">{parseMarkdown(project.description)}</div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Kỹ năng yêu cầu</h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isApplied && (
            <div className="card-crisp p-6 bg-white space-y-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">Hồ sơ ứng tuyển của bạn đã được gửi</span>
              </div>
              <div className="text-xs space-y-2 text-slate-600">
                <p>
                  <strong>Ngày nộp:</strong> {appliedDate}
                  {matchScore !== null && (
                    <>
                      {' '}
                      · <strong>Skill match:</strong> {matchScore}%
                    </>
                  )}
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-700 mb-1">Thư giới thiệu của bạn:</p>
                  <p className="italic text-slate-600 leading-relaxed">{savedCoverMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-crisp p-6 bg-white space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Thông tin dự án</h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Ngân sách</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatVnd(Number(project.budget))}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Thời gian</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{project.durationWeeks} tuần</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Hạn nộp hồ sơ</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {new Date(project.deadline).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {project.status !== 'OPEN' ? (
                <div className="p-3 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-center text-xs font-semibold">
                  Dự án đã đóng ứng tuyển
                </div>
              ) : isApplied ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã ứng tuyển
                </div>
              ) : (
                <button
                  onClick={handleOpenApplyModal}
                  className="w-full btn-primary py-3 font-semibold text-sm"
                >
                  Ứng tuyển dự án ngay
                </button>
              )}
            </div>
          </div>

          <div className="card-crisp p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Doanh nghiệp</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Tên</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{companyName}</span>
              </div>
              {project.sme?.website && (
                <a
                  href={project.sme.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-primary hover:underline font-semibold"
                >
                  Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <ApplyModal
        projectTitle={project.title}
        isOpen={isApplyModalOpen}
        isSubmitting={submittingApply}
        error={applyError}
        success={applySuccess}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleSubmitApply}
      />
    </div>
  );
}
