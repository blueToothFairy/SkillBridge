'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { fetchProjectByIdApi, fetchProjectsApi } from '@/lib/api/projects';
import {
  fetchProjectMilestonesApi,
  submitMilestoneDeliverableApi,
  reviewMilestoneApi,
  cancelMilestoneSubmissionApi,
} from '@/lib/api/milestones';
import { fetchMyApplicationsApi } from '@/lib/api/applications';
import { ApiProject, Milestone } from '@/types';
import MilestoneProgressBar from '@/components/milestones/MilestoneProgressBar';
import { parseMarkdown } from '@/lib/markdown';
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
  ShieldCheck,
  FolderGit2,
  Building,
} from 'lucide-react';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const routeProjectId = (params?.id as string) || 'proj-1';

  const { token, role: authRole, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { projects: mockProjects } = useApp();

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoProjects, setHasNoProjects] = useState<boolean>(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'Overview' | 'Milestones' | 'Deliverables' | 'Activity'>('Overview');

  // Submit/Review Form States
  const [deliverableInput, setDeliverableInput] = useState<{ [key: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<string>('');
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(null);

  // 1. Fetch user's active projects for the dropdown
  useEffect(() => {
    async function loadSelectorProjects() {
      try {
        if (token) {
          let activeDbProjects: any[] = [];
          if (authRole === 'STUDENT') {
            const apps = await fetchMyApplicationsApi(token);
            activeDbProjects = apps
              .filter((app: any) => app.status === 'ACCEPTED' && app.project)
              .map((app: any) => app.project);
            if (activeDbProjects.length === 0) {
              setHasNoProjects(true);
              setUserProjects([]);
              setLoading(false);
              return;
            }
          } else if (authRole === 'SME') {
            const res = await fetchProjectsApi({ limit: 50, mine: true, token });
            activeDbProjects = res.projects;
          } else {
            const [inProgressRes, pendingRes, completedRes] = await Promise.all([
              fetchProjectsApi({ limit: 50, status: 'IN_PROGRESS', token }),
              fetchProjectsApi({ limit: 50, status: 'PENDING_ACCEPTANCE', token }),
              fetchProjectsApi({ limit: 50, status: 'COMPLETED', token })
            ]);
            activeDbProjects = [
              ...inProgressRes.projects,
              ...pendingRes.projects,
              ...completedRes.projects
            ];
          }
          
          setHasNoProjects(false);
          // Use active database projects if any are found, otherwise fallback to mock projects for demonstration
          setUserProjects(activeDbProjects.length > 0 ? activeDbProjects : mockProjects);
        } else {
          setHasNoProjects(false);
          setUserProjects(mockProjects);
        }
      } catch (err) {
        console.error('Failed to load user projects for selector:', err);
        setHasNoProjects(false);
        setUserProjects(mockProjects);
      }
    }
    if (!authLoading) {
      loadSelectorProjects();
    }
  }, [token, authLoading, authRole, mockProjects]);

  // 2. Fetch project and milestone details
  const loadWorkspaceData = useCallback(async () => {
    if (!routeProjectId) return;
    try {
      setLoading(true);
      setError(null);

      // Check if it is a real database project (UUID) or mock project
      if (routeProjectId && !routeProjectId.startsWith('proj-')) {
        if (!token) return;
        const [projData, mileData] = await Promise.all([
          fetchProjectByIdApi(routeProjectId),
          fetchProjectMilestonesApi(token, routeProjectId),
        ]);
        setProject(projData);
        setMilestones(mileData);
      } else {
        // Fallback to mock project
        const mockProj = mockProjects.find((p) => p.id === routeProjectId) || mockProjects[0];
        setProject(mockProj);
        setMilestones(mockProj?.milestones || []);
      }
    } catch (err: any) {
      console.error('Failed to load workspace project:', err);
      setError(err.message || 'Không thể tải không gian làm việc.');
    } finally {
      setLoading(false);
    }
  }, [routeProjectId, token, mockProjects]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !routeProjectId.startsWith('proj-')) {
      router.push('/login');
      return;
    }
    if (!hasNoProjects) {
      loadWorkspaceData();
    }
  }, [routeProjectId, token, authLoading, isAuthenticated, loadWorkspaceData, router, hasNoProjects]);

  // Student: Submit deliverable
  const handleSubmitDeliverable = async (milestoneId: string) => {
    const url = deliverableInput[milestoneId];
    if (!url || !url.trim() || !token) return;

    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      alert('Vui lòng nhập định dạng URL hợp lệ.');
      return;
    }

    try {
      setSubmittingId(milestoneId);
      const updated = await submitMilestoneDeliverableApi(token, milestoneId, url);
      setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)));
      setDeliverableInput((prev) => ({ ...prev, [milestoneId]: '' }));
    } catch (err: any) {
      alert(err.message || 'Gửi sản phẩm thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  // Student: Cancel submission
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

  // SME: Approve milestone
  const handleApproveMilestone = async (milestoneId: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn phê duyệt cột mốc này?')) return;

    try {
      setSubmittingId(milestoneId);
      await reviewMilestoneApi(token, milestoneId, 'APPROVE');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || 'Duyệt cột mốc thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  // SME: Request revision
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
        <span className="text-sm font-medium">Đang tải không gian làm việc...</span>
      </div>
    );
  }

  if (hasNoProjects) {
    return (
      <div className="card-crisp p-12 bg-white text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm rounded-xl border border-slate-200">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <FolderGit2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Bạn chưa ứng tuyển vào dự án nào</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            Hiện tại bạn chưa tham gia hoặc chưa được nhận vào dự án nào. Hãy ứng tuyển vào các dự án để bắt đầu làm việc.
          </p>
        </div>
        <Link
          href="/student/browse"
          className="btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 inline-block text-xs font-semibold"
        >
          Tìm kiếm dự án
        </Link>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy dự án</h3>
        <p className="text-xs text-slate-500">{error || 'Dự án này không tồn tại hoặc bạn không có quyền truy cập.'}</p>
        <button onClick={() => router.back()} className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-4 mt-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>
    );
  }

  const isMock = project.id.startsWith('proj-');
  const userRole = isMock ? 'STUDENT' : authRole; // Fallback to mock student role

  return (
    <div className="space-y-6">
      {/* Top Workspace Header */}
      <div className="card-crisp p-6 bg-white space-y-4">
        {/* Project Selector Dropdown */}
        {userProjects.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-lg">
            <FolderGit2 className="w-4 h-4 text-brand-primary shrink-0" />
            <span>Chọn dự án:</span>
            <select
              value={project.id}
              onChange={(e) => {
                router.push(`/workspace/${e.target.value}`);
              }}
              className="bg-white border border-slate-200 text-slate-800 rounded-md p-1 font-semibold focus:outline-none max-w-xs truncate"
            >
              {userProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 shrink-0" />
              {isMock ? project.smeCompany : (project.sme?.companyName || 'Doanh nghiệp')} &gt; {project.title}
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

          <div className="flex items-center gap-4 text-xs font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Ngân sách</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {isMock ? formatVnd(project.budgetVnd) : formatVnd(project.budget)}
              </span>
            </div>
            <div className="border-l border-slate-200 h-8" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Cột mốc</span>
              <span className="font-bold text-slate-900">
                {milestones.filter(m => m.status === 'ACCEPTED').length}/{milestones.length} đã duyệt
              </span>
            </div>
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
              {tab === 'Overview'
                ? 'Tổng quan'
                : tab === 'Milestones'
                ? 'Cột mốc'
                : tab === 'Deliverables'
                ? 'Sản phẩm bàn giao'
                : 'Hoạt động'}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Tab Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Tab Content) */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'Overview' && (
            <div className="card-crisp p-5 bg-white space-y-3">
              <h2 className="text-base font-bold text-slate-900">Project Brief</h2>
              <div className="space-y-1 text-slate-600 text-xs leading-relaxed">
                {parseMarkdown(project.description)}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <div>
                  <span className="block text-slate-400">Doanh nghiệp</span>
                  <span className="font-bold text-slate-900">
                    {isMock ? project.smeCompany : (project.sme?.companyName || 'Doanh nghiệp')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Sinh viên thực hiện</span>
                  <span className="font-bold text-slate-900">
                    {isMock ? (project.acceptedStudentName || 'Alex Chen') : 'Đội ngũ sinh viên được duyệt'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Simulated Escrow</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> LOCKED
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Milestones' && (
            <div className="space-y-4">
              {!isMock && <MilestoneProgressBar milestones={milestones} />}

              <div className="card-crisp p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900">Tiến độ cột mốc thực tế</h2>
                  <span className="text-[11px] text-slate-400">
                    Nộp link sản phẩm tại đây để SME duyệt giải ngân
                  </span>
                </div>

                {milestones.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có cột mốc nào được tạo cho dự án này.</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {milestones.map((m, idx) => {
                      const isAccepted = m.status === 'ACCEPTED';
                      const isSubmitted = m.status === 'SUBMITTED';
                      const isRevision = m.status === 'REVISION_REQUIRED';
                      const isPending = m.status === 'PENDING';
                      const isInProgress = m.status === 'IN_PROGRESS';

                      return (
                        <div key={m.id} className="relative pl-10 space-y-2">
                          {/* Circle status indicator */}
                          <div
                            className={`absolute left-1 top-1 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
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
                              <Clock className="h-3.5 w-3.5 animate-pulse" />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{m.title}</h3>
                                <span className="text-[11px] font-semibold text-brand-primary">
                                  ({formatVnd(Number(m.amountVnd))})
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{m.description}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
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
                                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
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

                          {/* Submitted URL */}
                          {m.deliverableUrl && (
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-2 truncate text-slate-600">
                                <FileText className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                                <span className="font-mono text-slate-700 truncate">{m.deliverableUrl}</span>
                              </div>
                              <a
                                href={m.deliverableUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-primary font-semibold hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                              >
                                Mở link <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}

                          {/* Revision feedback */}
                          {isRevision && m.revisionFeedback && (
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <strong>Ý kiến chỉnh sửa từ SME:</strong> {m.revisionFeedback}
                              </div>
                            </div>
                          )}

                          {/* Student submit & cancel actions */}
                          {userRole === 'STUDENT' && (isPending || isInProgress || isSubmitted || isRevision) && (project.status === 'IN_PROGRESS' || isMock) && (
                            <div className="pt-2">
                              {milestones.slice(0, idx).some(prevM => prevM.status !== 'ACCEPTED') ? (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 max-w-lg mt-1 font-medium flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 shrink-0" />
                                  <span>Bạn chỉ được nộp bài cho cột mốc này sau khi tất cả các cột mốc trước đó đã được SME phê duyệt.</span>
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-lg space-y-2 max-w-lg">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    {isSubmitted ? 'Chỉnh sửa / Cập nhật Link Bàn giao' : 'Nộp Link Sản Phẩm Bàn Giao'}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="url"
                                      value={deliverableInput[m.id] !== undefined ? deliverableInput[m.id] : (m.deliverableUrl || '')}
                                      onChange={(e) =>
                                        setDeliverableInput((prev) => ({ ...prev, [m.id]: e.target.value }))
                                      }
                                      placeholder="https://github.com/project-link"
                                      className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                                      disabled={submittingId === m.id}
                                    />
                                    <button
                                      onClick={() => handleSubmitDeliverable(m.id)}
                                      disabled={
                                        submittingId === m.id || 
                                        (deliverableInput[m.id] !== undefined ? !deliverableInput[m.id].trim() : !m.deliverableUrl)
                                      }
                                      className="btn-primary text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-50 shrink-0"
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
                                    {isSubmitted && !isMock && (
                                      <button
                                        onClick={() => handleCancelSubmission(m.id)}
                                        disabled={submittingId === m.id}
                                        className="btn-secondary text-xs py-2 px-3 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold shrink-0"
                                      >
                                        Hủy nộp bài
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* SME review actions */}
                          {userRole === 'SME' && isSubmitted && !isMock && (
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleApproveMilestone(m.id)}
                                disabled={submittingId === m.id}
                                className="btn-accent-green text-[11px] py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-xs"
                              >
                                Duyệt & Giải ngân
                              </button>
                              <button
                                onClick={() => setShowRevisionModal(m.id)}
                                disabled={submittingId === m.id}
                                className="btn-secondary text-[11px] py-1.5 px-3 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md font-semibold"
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
            </div>
          )}

          {activeTab === 'Deliverables' && (
            <div className="card-crisp p-5 bg-white space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Danh sách Sản phẩm đã Bàn giao
              </h2>
              {milestones.filter((m) => m.deliverableUrl).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Chưa có link sản phẩm bàn giao nào được gửi.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {milestones
                    .filter((m) => m.deliverableUrl)
                    .map((m) => (
                      <div key={m.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{m.title}</span>
                          <span className="font-mono text-slate-500 truncate block max-w-sm sm:max-w-md">
                            {m.deliverableUrl}
                          </span>
                        </div>
                        <a
                          href={m.deliverableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-2.5 flex items-center gap-1 border border-slate-200 text-[11px]"
                        >
                          Mở link <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Activity' && (
            <div className="card-crisp p-5 bg-white space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Nhật ký Hoạt động Cột mốc
              </h2>
              <div className="space-y-4 text-xs text-slate-600">
                {milestones
                  .filter((m) => m.status !== 'PENDING')
                  .map((m) => (
                    <div key={m.id} className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
                      <span
                        className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                          m.status === 'ACCEPTED'
                            ? 'bg-emerald-500'
                            : m.status === 'SUBMITTED'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <p className="text-slate-800 leading-relaxed">
                          Cột mốc **{m.title}** được chuyển sang trạng thái{' '}
                          <strong className="font-bold text-slate-900">
                            {m.status === 'ACCEPTED'
                              ? 'Đã duyệt & Giải ngân thành công'
                              : m.status === 'SUBMITTED'
                              ? 'Đang chờ duyệt'
                              : 'Cần sửa đổi'}
                          </strong>
                          .
                        </p>
                        {m.submittedAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Thời gian: {new Date(m.submittedAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {milestones.filter((m) => m.status !== 'PENDING').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có nhật ký hoạt động nào.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar Activity Feed) */}
        <div className="space-y-6">
          <div className="card-crisp p-5 bg-white space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Project Activity Log
            </h2>
            <div className="space-y-3 text-xs text-slate-500 leading-relaxed">
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Alex Chen</strong> submitted Milestone 3 — Refined logo + brand guidelines
                  </p>
                  <p className="text-[10px] text-slate-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Sarah Mitchell</strong> left feedback on Milestone 2
                  </p>
                  <p className="text-[10px] text-slate-400">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-slate-800">
                    <strong className="font-bold">Milestone 2 approved</strong> — 3,600,000 VND released to Alex Chen
                  </p>
                  <p className="text-[10px] text-slate-400">6 Dec 2024</p>
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

      {/* SME Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Yêu cầu sửa đổi bàn giao</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập nhận xét hoặc chỉ dẫn chi tiết để sinh viên biết cần chỉnh sửa hay cập nhật những gì.
            </p>
            <textarea
              rows={4}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="Ví dụ: Vui lòng bổ sung thêm thiết kế màn hình Profile cá nhân..."
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
                className="btn-primary bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg text-white font-semibold"
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
