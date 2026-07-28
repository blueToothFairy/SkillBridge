'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentCertificatesApi } from '@/lib/api/certificates';
import { Award, ShieldCheck, Calendar, ArrowLeft, Loader2, AlertCircle, FileText } from 'lucide-react';

export default function StudentCertificatesPage() {
  const { token, user, authLoading } = useAuth() as any;
  const studentId = user?.profile?.id;

  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificates() {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStudentCertificatesApi(studentId);
        setCertificates(data);
      } catch (err: any) {
        console.error('Failed to load certificates:', err);
        setError(err.message || 'Failed to fetch certificates.');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      loadCertificates();
    }
  }, [studentId, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link
          href={`/student/profile/${studentId || 'stu-1'}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="h-7 w-7 text-blue-600" /> Your Digital Certificates
        </h1>
        <p className="text-xs text-slate-500 max-w-xl">
          SkillBridge official verifiable credentials generated automatically upon project milestone completion and acceptance by your clients.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Certificates List Grid */}
      {certificates.length === 0 ? (
        <div className="card-crisp p-12 bg-white text-center space-y-4 border border-slate-200 shadow-sm rounded-xl">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Award className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Certificates Earned Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Once you complete an accepted project milestone or SME signs off your final work, your digital certificate will appear here.
            </p>
          </div>
          <Link
            href="/student/browse"
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 inline-block text-xs font-semibold"
          >
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="card-crisp p-6 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-sm flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              {/* Top Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-80" />

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold">
                    <ShieldCheck className="h-3 w-3" /> VERIFIED
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {cert.verificationCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {cert.projectTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Client: <span className="font-medium text-slate-700">{cert.smeCompany}</span>
                  </p>
                </div>

                {/* Verified Skills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(cert.skillsVerified || []).map((skill: string) => (
                    <span key={skill} className="tag-predefined text-[10px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom detail action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Issued: {cert.issueDate}</span>
                </div>
                <Link
                  href={`/certificates/${cert.verificationCode}`}
                  className="btn-primary py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5" /> View Certificate
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
