'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Legacy route → canonical applicants page */
export default function SMEMatchingRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/sme/projects/${id}/applicants`);
    }
  }, [id, router]);

  return (
    <div className="p-8 text-center text-slate-500 text-sm">
      Đang chuyển tới trang ứng viên...
    </div>
  );
}
