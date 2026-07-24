'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { role } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (role === 'STUDENT') {
      router.push('/student/dashboard');
    } else {
      router.push('/sme/dashboard');
    }
  }, [role, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-slate-500 font-medium text-sm">
        Redirecting to {role === 'STUDENT' ? 'Student Workspace' : 'SME Portal'}...
      </div>
    </div>
  );
}
