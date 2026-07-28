'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, FolderGit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyApplicationsApi } from '@/lib/api/applications';

export default function WorkspaceEntryPage() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    async function resolveWorkspace() {
      if (!token) return;
      try {
        const applications = await fetchMyApplicationsApi(token);
        const accepted = applications.find((app: any) => app.status === 'ACCEPTED' && app.project?.id);
        if (accepted?.project?.id) {
          router.replace(`/workspace/${accepted.project.id}`);
        }
      } catch (error) {
        console.error('Failed to resolve workspace entry:', error);
      }
    }

    if (!isLoading) {
      resolveWorkspace();
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="card-crisp p-8 bg-white text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-primary">
          <FolderGit2 className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Chưa có workspace hoạt động</h1>
        <p className="text-sm text-slate-500">
          Student chỉ có workspace khi đã được SME accept vào một project. Hãy vào danh sách project để apply hoặc kiểm tra lại trạng thái ứng tuyển.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/student/browse" className="btn-primary px-4 py-2 text-sm">
            Browse Projects
          </Link>
          <Link href="/student/applications" className="btn-secondary px-4 py-2 text-sm">
            View Applications
          </Link>
        </div>
      </div>
    </div>
  );
}
