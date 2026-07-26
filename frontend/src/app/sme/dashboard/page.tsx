'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchProjectsApi } from '@/lib/api/projects';
import { ApiProject } from '@/types';
import {
  Plus,
  FolderGit2,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  Building2,
  Filter,
} from 'lucide-react';

export default function SMEDashboard() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProjects() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetchProjectsApi({ limit: 50, mine: true, token });
        setProjects(res.projects);
      } catch (err) {
        console.error('Failed to fetch SME dashboard projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [token]);

  const totalProjects = projects.length;
  const openProjects = projects.filter((p) => p.status === 'OPEN');
  const inProgressProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

  // Format currency
  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-100">
              SME PORTAL
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {user?.email || 'Doanh nghiệp SME'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng Quản Lý Dự Án SME
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Quản lý các bài viết tuyển dụng, ứng viên sinh viên và theo dõi tiến độ mốc dự án thực tế.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/sme/post-project"
            className="btn-primary inline-flex items-center gap-2 py-2.5 text-xs"
          >
            <Plus className="w-4 h-4" /> Đăng Dự Án Mới
          </Link>
        </div>
      </div>

      {/* Metrics Row - Real Queryable Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tổng Bài Đăng
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalProjects}</p>
          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-brand-primary" /> Tất cả bài viết
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Đang Mở Tuyển
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{openProjects.length}</p>
          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Nhận ứng tuyển
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Đang Thực Hiện
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{inProgressProjects.length}</p>
          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
            <FolderGit2 className="w-3.5 h-3.5 text-brand-primary" /> Đang triển khai
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Đã Nghiệm Thu
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{completedProjects.length}</p>
          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hoàn thành
          </p>
        </div>
      </div>

      {/* Projects Table View - Operational Density */}
      <div className="card-crisp overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Danh Sách Dự Án Đã Đăng
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {projects.length} dự án từ Database
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            Đang tải dữ liệu dự án từ cơ sở dữ liệu...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Chưa có dự án nào được đăng. Hãy nhấn &quot;Đăng Dự Án Mới&quot; để tạo bài viết đầu tiên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tên Dự Án</th>
                  <th className="py-3 px-4">Danh Mục</th>
                  <th className="py-3 px-4">Ngân Sách</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {proj.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="tag-predefined">
                        {proj.categoryTag?.name || 'Chung'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 tabular-nums">
                      {formatVnd(Number(proj.budget))}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {proj.durationWeeks} tuần
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`status-pill ${
                          proj.status === 'OPEN'
                            ? 'status-open'
                            : proj.status === 'IN_PROGRESS'
                            ? 'status-in-progress'
                            : proj.status === 'COMPLETED'
                            ? 'status-completed'
                            : proj.status === 'UNDER_REVIEW'
                            ? 'status-under-review'
                            : 'status-draft'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/sme/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-primary-hover font-medium"
                        >
                          Xem <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/sme/projects/${proj.id}/applicants`}
                          className="text-slate-600 hover:text-slate-900 font-medium"
                        >
                          Ứng viên
                        </Link>
                        <Link
                          href={`/escrow/${proj.id}`}
                          className="text-emerald-700 hover:text-emerald-800 font-medium"
                        >
                          Escrow
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
