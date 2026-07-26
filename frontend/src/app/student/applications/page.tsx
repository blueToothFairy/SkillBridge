'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ApiApplication,
  fetchMyApplicationsApi,
  withdrawApplicationApi,
} from '@/lib/api/applications';
import { FileCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function MyApplicationsPage() {
  const { token, isAuthenticated, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== 'STUDENT')) {
      router.push('/login');
      return;
    }
    if (!token) return;

    async function load() {
      try {
        setLoading(true);
        const apps = await fetchMyApplicationsApi(token!);
        setApplications(apps.filter((a) => a.status !== 'WITHDRAWN'));
      } catch (err: any) {
        setError(err.message || 'Không thể tải applications');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, isAuthenticated, role, token, router]);

  const handleWithdraw = async (id: string) => {
    if (!token) return;
    try {
      await withdrawApplicationApi(token, id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải hồ sơ ứng tuyển...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-blue-600" /> My Submitted Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái và điểm skill-matching từ API thật.
          </p>
        </div>
        <Link href="/student/browse" className="btn-primary text-xs py-2 px-4">
          Browse More Projects
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {applications.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">Bạn chưa ứng tuyển dự án nào.</div>
        )}

        {applications.map((app) => (
          <div key={app.id} className="card-crisp p-5 bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">
                  {app.project?.title || 'Project'}
                </h3>
                <p className="text-xs text-slate-500">
                  {app.project?.sme?.companyName || ''} · Applied{' '}
                  {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  app.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : app.status === 'SHORTLISTED'
                      ? 'bg-blue-100 text-blue-800'
                      : app.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                }`}
              >
                {app.status}
              </span>
            </div>

            {app.coverMessage && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 block mb-1">Cover Message:</span>
                <p className="text-slate-600 leading-relaxed italic">{app.coverMessage}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2 flex-wrap">
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {app.matchScore}% Skill Match ({app.matchingSkillsCount}/{app.totalRequiredSkills})
              </span>

              <div className="flex items-center gap-2">
                {(app.status === 'APPLIED' || app.status === 'SHORTLISTED') && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(app.id)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Withdraw
                  </button>
                )}
                {app.status === 'ACCEPTED' && (
                  <Link
                    href={`/projects/${app.projectId}/milestones`}
                    className="btn-accent-green text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    Open Milestones <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <Link
                  href={`/student/projects/${app.projectId}`}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Chi tiết
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
