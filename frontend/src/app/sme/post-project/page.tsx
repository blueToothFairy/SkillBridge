'use client';

import React from 'react';
import ProjectForm from '@/components/projects/ProjectForm';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PostProjectPage() {
  return (
    <div className="w-full">
      <main className="max-w-4xl w-full mx-auto py-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/sme/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang quản lý SME
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-brand-primary text-xs font-semibold rounded-md mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Dành cho Doanh nghiệp & Dự án SME
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng bài Tuyển dụng Sinh viên & Dự án Mới
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kết nối với lực lượng sinh viên tài năng, đăng bài theo danh mục & kỹ năng yêu cầu rõ ràng.
          </p>
        </div>

        {/* Form Container */}
        <ProjectForm />
      </main>
    </div>
  );
}
