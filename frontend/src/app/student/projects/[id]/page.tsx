'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProjectByIdApi } from '@/lib/api/projects';
import { ApiProject } from '@/types';
import { useApp } from '@/context/AppContext';
import { parseMarkdown } from '@/lib/markdown';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Tag as TagIcon,
  Building2,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  Briefcase
} from 'lucide-react';

export default function StudentProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { getProjectById } = useApp();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Application State
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [appliedDate, setAppliedDate] = useState<string>('');
  const [savedCoverMessage, setSavedCoverMessage] = useState<string>('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [coverMessage, setCoverMessage] = useState<string>('');
  const [submittingApply, setSubmittingApply] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!projectId) return;

    async function loadProject() {
      try {
        setLoading(true);
        setError(null);

        // Fallback for mock projects
        if (projectId.startsWith('proj-')) {
          const mockProj = getProjectById(projectId);
          if (mockProj) {
            const apiProj: ApiProject = {
              id: mockProj.id,
              smeId: 'sme-1',
              title: mockProj.title,
              description: mockProj.description,
              categoryTagId: 'cat-1',
              categoryTag: { id: 'cat-1', name: mockProj.category, type: 'CATEGORY', isActive: true, createdAt: '' },
              requiredSkillTags: mockProj.requiredSkills,
              budget: mockProj.budgetVnd,
              durationWeeks: mockProj.durationWeeks,
              maxApplicants: mockProj.maxApplicants,
              deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: mockProj.status,
              escrowStatus: mockProj.escrowStatus as any,
              createdAt: mockProj.createdAt,
              updatedAt: mockProj.createdAt,
              sme: {
                id: 'sme-1',
                companyName: mockProj.smeCompany,
                website: 'https://artisan.com'
              }
            };
            setProject(apiProj);
            
            // Check local storage for application simulation
            const appliedInfo = localStorage.getItem(`sb_applied_${projectId}`);
            if (appliedInfo) {
              const parsed = JSON.parse(appliedInfo);
              setIsApplied(true);
              setAppliedDate(parsed.date);
              setSavedCoverMessage(parsed.coverMessage);
            }
            setLoading(false);
            return;
          }
        }

        const data = await fetchProjectByIdApi(projectId);
        setProject(data);

        // Check local storage for application simulation
        const appliedInfo = localStorage.getItem(`sb_applied_${projectId}`);
        if (appliedInfo) {
          const parsed = JSON.parse(appliedInfo);
          setIsApplied(true);
          setAppliedDate(parsed.date);
          setSavedCoverMessage(parsed.coverMessage);
        }
      } catch (err: any) {
        console.error('Failed to load project details:', err);
        setError(err.message || 'Không thể tải thông tin dự án. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, getProjectById]);

  const handleOpenApplyModal = () => {
    setIsApplyModalOpen(true);
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverMessage.trim()) return;

    setSubmittingApply(true);
    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const today = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const applyData = {
        date: today,
        coverMessage,
      };

      localStorage.setItem(`sb_applied_${projectId}`, JSON.stringify(applyData));
      setIsApplied(true);
      setAppliedDate(today);
      setSavedCoverMessage(coverMessage);
      setApplySuccess(true);

      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingApply(false);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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
      {/* Back Button */}
      <div>
        <Link
          href="/student/browse"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Sàn Dự án Sinh viên
        </Link>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-crisp p-6 sm:p-8 bg-white space-y-6">
            {/* Header Tags & Title */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md">
                  <TagIcon className="w-3.5 h-3.5" />
                  {categoryName}
                </span>
                <span className="status-pill status-open">
                  {project.status}
                </span>
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

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Mô tả chi tiết dự án</h3>
              <div className="space-y-1">
                {parseMarkdown(project.description)}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Skill Tags */}
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

          {/* Application Detail (If applied) */}
          {isApplied && (
            <div className="card-crisp p-6 bg-white space-y-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">Hồ sơ ứng tuyển của bạn đã được gửi</span>
              </div>
              <div className="text-xs space-y-2 text-slate-600">
                <p>
                  <strong>Ngày nộp:</strong> {appliedDate}
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-700 mb-1">Thư giới thiệu của bạn:</p>
                  <p className="italic text-slate-600 leading-relaxed">{savedCoverMessage}</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Doanh nghiệp {companyName} sẽ xem xét hồ sơ của bạn. Bạn sẽ nhận được thông báo tại Dashboard Sinh viên khi trạng thái thay đổi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Project Sidebar Stats */}
        <div className="space-y-6">
          {/* Stats Box */}
          <div className="card-crisp p-6 bg-white space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Thông tin dự án
            </h3>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Ngân sách dự kiến</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatVnd(Number(project.budget))}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Thời gian thực hiện</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {project.durationWeeks} tuần
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-primary shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Hạn cuối nộp hồ sơ</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {new Date(project.deadline).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Box */}
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
                  className="w-full btn-primary py-3 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Ứng tuyển dự án ngay
                </button>
              )}
            </div>
          </div>

          {/* SME Brand Card */}
          <div className="card-crisp p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Thông tin doanh nghiệp
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium uppercase">Tên doanh nghiệp</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {companyName}
                </span>
              </div>

              {project.sme?.industry && (
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Lĩnh vực hoạt động</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">
                    {project.sme.industry}
                  </span>
                </div>
              )}

              {project.sme?.website && (
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Website doanh nghiệp</span>
                  <a
                    href={project.sme.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-primary hover:underline font-semibold mt-0.5"
                  >
                    Truy cập website <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Cover Letter Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {applySuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Nộp hồ sơ thành công!</h3>
                <p className="text-xs text-slate-600">
                  Hồ sơ của bạn đã được ghi nhận. Hệ thống sẽ lưu trạng thái ứng tuyển của bạn.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApply} className="space-y-4">
                <div className="mb-4">
                  <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Ứng tuyển dự án</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-slate-500">{companyName}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Thư ứng tuyển (Cover Letter) & Giới thiệu bản thân
                  </label>
                  <textarea
                    rows={4}
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Trình bày lý do bạn phù hợp với dự án, kỹ năng ứng dụng và cam kết thời gian..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingApply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Gửi Hồ Sơ Ứng Tuyển
                      </>
                    )}
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
