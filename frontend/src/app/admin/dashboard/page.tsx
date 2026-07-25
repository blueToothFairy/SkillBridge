'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchPendingProjectsApi, reviewProjectApi } from '@/lib/api/projects';
import { ApiProject } from '@/types';
import { parseMarkdown } from '@/lib/markdown';
import {
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  Building,
  DollarSign,
  Clock,
  Briefcase,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  const [pendingProjects, setPendingProjects] = useState<ApiProject[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect if not ADMIN
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadPendingProjects = async () => {
    if (!token) return;
    try {
      setLoadingData(true);
      setErrorMsg(null);
      const data = await fetchPendingProjectsApi(token);
      setPendingProjects(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể tải danh sách dự án chờ duyệt.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      loadPendingProjects();
    }
  }, [token, user]);

  const handleReviewProject = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (!token) return;
    setReviewingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await reviewProjectApi(token, id, action);
      setSuccessMsg(
        action === 'APPROVE'
          ? 'Đã duyệt dự án thành công! Dự án hiện đã hoạt động (OPEN).'
          : 'Đã từ chối dự án. Trạng thái đã chuyển thành Nháp (DRAFT).'
      );
      setPendingProjects((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Xử lý duyệt dự án thất bại.');
    } finally {
      setReviewingId(null);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <span className="text-sm font-medium">Đang xác thực thông tin Admin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-md mb-3">
            <ShieldAlert className="w-3.5 h-3.5" /> Chế độ Quản trị viên
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Phê Duyệt Dự Án Doanh Nghiệp (SME)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Xem xét chi tiết nội dung, mô tả công việc (JD) và yêu cầu kỹ năng của các dự án trước khi cho phép công khai.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content */}
      {loadingData ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-sm font-medium">Đang tải danh sách bài đăng chờ duyệt...</span>
        </div>
      ) : pendingProjects.length === 0 ? (
        <div className="card-crisp p-12 text-center bg-white space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Không có dự án nào chờ duyệt</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Tất cả các bài đăng dự án của doanh nghiệp đã được xem xét và phê duyệt.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Có {pendingProjects.length} dự án cần xem xét duyệt
          </span>

          {pendingProjects.map((project) => {
            const companyName = project.sme?.companyName || 'Doanh nghiệp Partner';
            const categoryName = project.categoryTag?.name || 'Chưa phân loại';
            const requiredSkills = Array.isArray(project.requiredSkillTags) ? project.requiredSkillTags : [];

            return (
              <div key={project.id} className="card-crisp p-6 sm:p-8 bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-6 transition-all hover:shadow-md">
                <div className="space-y-5">
                  {/* Badges & Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md">
                        {categoryName}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold rounded-md uppercase tracking-wider">
                        Chờ duyệt (Reviewing)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Đăng lúc: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {/* Title & SME Info */}
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-950 leading-tight">
                      {project.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{companyName}</span>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                      Nội dung chi tiết bài đăng
                    </p>
                    <div className="space-y-1">
                      {parseMarkdown(project.description)}
                    </div>
                  </div>

                  {/* Meta Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Ngân sách</span>
                      <span className="font-bold text-slate-900 flex items-center mt-0.5 text-sm font-mono">
                        {formatVnd(Number(project.budget))}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Thời gian dự kiến</span>
                      <span className="font-bold text-slate-900 flex items-center mt-0.5 text-sm gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {project.durationWeeks} tuần
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Số ứng viên tối đa</span>
                      <span className="font-bold text-slate-900 flex items-center mt-0.5 text-sm gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {project.maxApplicants} ứng viên
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Hạn ứng tuyển</span>
                      <span className="font-bold text-slate-900 flex items-center mt-0.5 text-sm gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(project.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                      Kỹ năng yêu cầu
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {requiredSkills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleReviewProject(project.id, 'REJECT')}
                    disabled={reviewingId !== null}
                    className="px-4 py-2 border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Từ chối (Reject)
                  </button>
                  <button
                    onClick={() => handleReviewProject(project.id, 'APPROVE')}
                    disabled={reviewingId !== null}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Duyệt dự án (Approve)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
