'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchProjectByIdApi } from '@/lib/api/projects';
import {
  fetchProjectMilestonesApi,
  submitMilestoneDeliverableApi,
  reviewMilestoneApi,
  cancelMilestoneSubmissionApi,
} from '@/lib/api/milestones';
import { ApiProject, Milestone } from '@/types';
import MilestoneProgressBar from '@/components/milestones/MilestoneProgressBar';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  FileText,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function ProjectMilestonesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { token, role, user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [deliverableInput, setDeliverableInput] = useState<{ [key: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<string>('');
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId || !token) return;
    try {
      setLoading(true);
      setError(null);

      const [projData, mileData] = await Promise.all([
        fetchProjectByIdApi(projectId),
        fetchProjectMilestonesApi(token, projectId),
      ]);

      setProject(projData);
      setMilestones(mileData);
    } catch (err: any) {
      console.error('Failed to load milestones page:', err);
      setError(err.message || 'Không thể tải thông tin cột mốc. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (token && projectId) {
      loadData();
    }
  }, [projectId, token, authLoading, isAuthenticated, loadData, router]);

  const handleSubmitDeliverable = async (milestoneId: string) => {
    const url = deliverableInput[milestoneId];
    if (!url || !url.trim() || !token) return;

    // URL Basic validation
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      alert('Vui lòng nhập định dạng URL hợp lệ (e.g., https://github.com/...)');
      return;
    }

    try {
      setSubmittingId(milestoneId);
      const updated = await submitMilestoneDeliverableApi(token, milestoneId, url);
      
      // Update local state
      setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)));
      setDeliverableInput((prev) => ({ ...prev, [milestoneId]: '' }));
    } catch (err: any) {
      alert(err.message || 'Gửi báo cáo thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelSubmission = async (milestoneId: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn hủy bài nộp này? Cột mốc sẽ quay về trạng thái Chưa làm.')) return;

    try {
      setSubmittingId(milestoneId);
      const updated = await cancelMilestoneSubmissionApi(token, milestoneId);
      setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)));
      setDeliverableInput((prev) => ({ ...prev, [milestoneId]: '' }));
    } catch (err: any) {
      alert(err.message || 'Hủy nộp bài thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn duyệt cột mốc này và tiến hành bước tiếp theo?')) return;

    try {
      setSubmittingId(milestoneId);
      const updated = await reviewMilestoneApi(token, milestoneId, 'APPROVE');
      
      // Reload everything to get updated project status
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Duyệt thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRequestRevision = async (milestoneId: string) => {
    if (!token || !revisionFeedback.trim()) return;

    try {
      setSubmittingId(milestoneId);
      const updated = await reviewMilestoneApi(token, milestoneId, 'REVISE', revisionFeedback);
      
      setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)));
      setShowRevisionModal(null);
      setRevisionFeedback('');
    } catch (err: any) {
      alert(err.message || 'Yêu cầu sửa đổi thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <span className="text-sm font-medium">Đang tải thông tin cột mốc...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy cột mốc dự án</h3>
        <p className="text-xs text-slate-500">{error || 'Dự án này không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button onClick={() => router.back()} className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-4 mt-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang trước
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
              DỰ ÁN: {project.title}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Cột mốc & Bàn giao
          </h1>
        </div>
        <button onClick={() => router.back()} className="btn-secondary text-xs py-2 px-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết dự án
        </button>
      </div>

      {/* Progress bar */}
      <MilestoneProgressBar milestones={milestones} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Milestones list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 px-1">Danh sách cột mốc</h2>

          {milestones.length === 0 ? (
            <div className="card-crisp p-8 text-center text-slate-400 text-sm">
              Chưa có cột mốc nào được tạo cho dự án này.
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              {milestones.map((m, idx) => {
                const isAccepted = m.status === 'ACCEPTED';
                const isSubmitted = m.status === 'SUBMITTED';
                const isRevision = m.status === 'REVISION_REQUIRED';
                const isPending = m.status === 'PENDING';
                const isInProgress = m.status === 'IN_PROGRESS';
                const canStudentSubmit =
                  isPending || isInProgress || isSubmitted || isRevision;

                return (
                  <div key={m.id} className="relative pl-12 bg-white card-crisp p-5 hover:border-slate-300 transition-colors">
                    {/* Progress indicator badge */}
                    <div
                      className={`absolute left-2.5 top-5 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isAccepted
                          ? 'bg-emerald-600 text-white'
                          : isSubmitted
                          ? 'bg-amber-500 text-white'
                          : isRevision
                          ? 'bg-rose-500 text-white'
                          : isInProgress
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isSubmitted ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Milestone details */}
                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                          <span className="text-xs font-semibold text-brand-primary bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30">
                            {formatVnd(Number(m.amountVnd))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Hạn chót: {new Date(m.deadline).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          isAccepted
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : isSubmitted
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : isRevision
                            ? 'bg-rose-50 border border-rose-200 text-rose-700 animate-pulse'
                            : isInProgress
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-slate-50 border border-slate-200 text-slate-600'
                        }`}
                      >
                        {isAccepted
                          ? 'Đã duyệt'
                          : isSubmitted
                          ? 'Đang chờ duyệt'
                          : isRevision
                          ? 'Cần sửa đổi'
                          : isInProgress
                          ? 'Đang làm'
                          : 'Chưa làm'}
                      </span>
                    </div>

                    {/* Revision Feedback */}
                    {isRevision && m.revisionFeedback && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Ý kiến chỉnh sửa từ SME:</strong> {m.revisionFeedback}
                        </div>
                      </div>
                    )}

                    {/* Submitted Deliverable Display */}
                    {m.deliverableUrl && (
                      <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate text-slate-600">
                          <FileText className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                          <span className="font-mono text-slate-700 truncate">{m.deliverableUrl}</span>
                        </div>
                        <a
                          href={m.deliverableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-primary font-semibold hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                        >
                          Mở link <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Student Submit Actions */}
                    {role === 'STUDENT' && canStudentSubmit && project.status === 'IN_PROGRESS' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-lg space-y-2">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {isSubmitted ? 'Chỉnh sửa/Nộp lại Link Sản Phẩm Bàn Giao' : 'Nộp Link Sản Phẩm Bàn Giao (Figma, GitHub, Google Drive...)'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={deliverableInput[m.id] !== undefined ? deliverableInput[m.id] : (m.deliverableUrl || '')}
                              onChange={(e) =>
                                setDeliverableInput((prev) => ({ ...prev, [m.id]: e.target.value }))
                              }
                              placeholder="https://github.com/project-link"
                              className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                              disabled={submittingId === m.id}
                            />
                            <button
                              onClick={() => handleSubmitDeliverable(m.id)}
                              disabled={
                                submittingId === m.id || 
                                (deliverableInput[m.id] !== undefined ? !deliverableInput[m.id].trim() : !m.deliverableUrl)
                              }
                              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                            >
                              {submittingId === m.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isSubmitted ? (
                                'Cập nhật'
                              ) : isRevision ? (
                                'Nộp lại'
                              ) : (
                                'Nộp bài'
                              )}
                            </button>
                            {isSubmitted && (
                              <button
                                onClick={() => handleCancelSubmission(m.id)}
                                disabled={submittingId === m.id}
                                className="btn-secondary text-xs py-2 px-3 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold shrink-0"
                              >
                                Hủy bài nộp
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SME Review Actions */}
                    {role === 'SME' && isSubmitted && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => handleApproveMilestone(m.id)}
                          disabled={submittingId === m.id}
                          className="btn-accent-green text-xs py-1.5 px-3 flex items-center gap-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md font-semibold"
                        >
                          Duyệt & Giải ngân
                        </button>
                        <button
                          onClick={() => setShowRevisionModal(m.id)}
                          disabled={submittingId === m.id}
                          className="btn-secondary text-xs py-1.5 px-3 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md font-semibold"
                        >
                          Yêu cầu sửa đổi
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="card-crisp p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Thông tin dự án
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Trạng thái dự án</span>
                <span className="font-bold text-slate-950 block mt-0.5">
                  {project.status === 'IN_PROGRESS'
                    ? 'Đang thực hiện'
                    : project.status === 'PENDING_ACCEPTANCE'
                    ? 'Chờ nghiệm thu'
                    : project.status === 'COMPLETED'
                    ? 'Đã hoàn thành'
                    : project.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Tổng ngân sách</span>
                <span className="font-bold text-slate-950 block mt-0.5 text-sm">
                  {formatVnd(Number(project.budget))}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Thời gian thực hiện</span>
                <span className="font-bold text-slate-950 block mt-0.5">
                  {project.durationWeeks} tuần
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Yêu cầu chỉnh sửa bàn giao</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vui lòng viết nhận xét hoặc hướng dẫn chi tiết để sinh viên biết cần chỉnh sửa hay cập nhật những gì.
            </p>
            <textarea
              rows={4}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="Ví dụ: Vui lòng sửa lại bảng màu UI theo đúng file thiết kế moodboard và cập nhật lại link..."
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => {
                  setShowRevisionModal(null);
                  setRevisionFeedback('');
                }}
                className="btn-secondary py-1.5 px-3 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRequestRevision(showRevisionModal)}
                disabled={!revisionFeedback.trim() || submittingId === showRevisionModal}
                className="btn-primary bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg text-white"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
