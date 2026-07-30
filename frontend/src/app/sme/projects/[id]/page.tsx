'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProjectByIdApi, cancelProjectApi } from '@/lib/api/projects';
import { ApiProject } from '@/types';
import ProjectForm from '@/components/projects/ProjectForm';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { parseMarkdown } from '@/lib/markdown';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Tag as TagIcon,
  Award,
  AlertCircle,
  Edit2,
  Users,
  ShieldCheck,
  Loader2,
  Building2,
  ExternalLink,
  XCircle
} from 'lucide-react';

export default function SmeProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { getProjectById } = useApp();
  const { token } = useAuth();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Simulated metrics
  const [applicantCount, setApplicantCount] = useState<number>(0);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
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
          setApplicantCount(mockProj.applicantCount);
          setLoading(false);
          return;
        }
      }

      const data = await fetchProjectByIdApi(projectId);
      setProject(data);
      setApplicantCount(data.applicantCount || 0);
    } catch (err: any) {
      console.error('Failed to load project details for SME:', err);
      setError(err.message || 'Không thể tải thông tin dự án. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [projectId, getProjectById]);

  useEffect(() => {
    loadProject();
  }, [projectId, loadProject]);

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadProject();
  };

  const handleCancelProject = async () => {
    if (!token || !project) return;
    if (!confirm('Bạn có chắc chắn muốn hủy dự án này không? Trạng thái dự án sẽ chuyển sang CANCELLED và bạn không thể chỉnh sửa lại.')) {
      return;
    }

    try {
      setCancelling(true);
      const updated = await cancelProjectApi(token, project.id);
      setProject(updated);
      alert('Đã hủy dự án thành công!');
    } catch (err: any) {
      alert(err.message || 'Hủy dự án thất bại. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
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
        <p className="text-xs text-slate-500">{error || 'Dự án này không tồn tại hoặc bạn không có quyền xem.'}</p>
        <Link href="/sme/dashboard" className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-4 mt-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang quản lý SME
        </Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Hủy & Quay lại chi tiết dự án
          </button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chế độ chỉnh sửa</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
          <ProjectForm
            projectToEdit={project}
            onCancel={() => setIsEditing(false)}
            onSuccess={handleEditSuccess}
          />
        </div>
      </div>
    );
  }

  const categoryName = project.categoryTag?.name || 'General';
  const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];
  const companyName = project.sme?.companyName || 'Doanh nghiệp của bạn';

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Back Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/sme/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang quản lý SME
        </Link>
        <div className="flex items-center gap-2">
          {project.status === 'OPEN' && (
            <button
              onClick={handleCancelProject}
              disabled={cancelling}
              className="px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Hủy dự án
            </button>
          )}
          {(project.status === 'DRAFT' || project.status === 'OPEN' || project.status === 'UNDER_REVIEW') && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa bài viết
            </button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-crisp p-6 sm:p-8 bg-white space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md">
                  <TagIcon className="w-3.5 h-3.5" />
                  {categoryName}
                </span>
                <span
                  className={`status-pill ${
                    project.status === 'OPEN'
                      ? 'status-open'
                      : project.status === 'IN_PROGRESS'
                      ? 'status-in-progress'
                      : project.status === 'COMPLETED'
                      ? 'status-completed'
                      : project.status === 'UNDER_REVIEW'
                      ? 'status-under-review'
                      : 'status-draft'
                  }`}
                >
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
        </div>

        {/* Sidebar Stats & Settings */}
        <div className="space-y-6">
          {/* Info Card */}
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
          </div>

          {/* SME-Only Metrics Card */}
          <div className="card-crisp p-6 bg-white space-y-5 border-t-4 border-t-brand-primary">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Chỉ hiển thị với doanh nghiệp (SME Only)</span>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium uppercase">Trạng thái hồ sơ</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    Đã có {applicantCount} ứng viên ứng tuyển
                  </span>
                  <div className="mt-2 space-y-1.5">
                    <Link
                      href={`/sme/projects/${project.id}/applicants`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                    >
                      Mở bảng đánh giá matching ứng viên <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/escrow/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Escrow &amp; ký quỹ <ShieldCheck className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/projects/${project.id}/milestones`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
                    >
                      Quản lý milestones <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
