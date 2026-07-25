'use client';

import React from 'react';
import { MOCK_CERTIFICATE } from '@/lib/mockData';
import { Award, ShieldCheck, CheckCircle2, Share2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DigitalCertificatePage() {
  const cert = MOCK_CERTIFICATE;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/profile/stu-1"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Verified Portfolio
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Certificate
          </button>
          <button
            onClick={() => alert('Certificate share link copied to clipboard!')}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Verification Link
          </button>
        </div>
      </div>

      {/* Main Certificate Frame (Human-crafted editorial design) */}
      <div className="card-crisp p-8 bg-white border border-slate-200 shadow-lg space-y-8 relative overflow-hidden">
        {/* Top Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-bold tracking-wider uppercase">
            <Award className="h-4 w-4 text-emerald-400" /> SkillBridge Official Certificate
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif pt-2">
            Certificate of Completion
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Verification ID: {cert.verificationCode}
          </p>
        </div>

        {/* Certificate Body Text */}
        <div className="text-center space-y-4 max-w-xl mx-auto py-4 border-y border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            This is to certify that
          </p>
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
            {cert.studentName}
          </h2>
          <p className="text-xs text-slate-600">
            Student at <strong className="text-slate-800">{cert.university}</strong>
          </p>

          <p className="text-xs text-slate-600 leading-relaxed pt-2">
            has successfully completed the short-term SME project{' '}
            <strong className="text-slate-900">&ldquo;{cert.projectTitle}&rdquo;</strong> commissioned by{' '}
            <strong className="text-slate-900">{cert.smeCompany}</strong> through the SkillBridge Marketplace platform.
          </p>
        </div>

        {/* Verified Skills */}
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified Skill Tags Applied:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {cert.skillsVerified.map((sk) => (
              <span key={sk} className="tag-matched text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-300">
                {sk} ✓
              </span>
            ))}
          </div>
        </div>

        {/* Signatures & Issue Metadata */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="text-left">
            <p className="font-bold text-slate-900">SkillBridge Verification System</p>
            <p className="text-[11px] text-slate-500">Issued on {cert.issueDate}</p>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-emerald-800 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentic SkillBridge Digital Credential
          </div>
        </div>
      </div>
    </div>
  );
}
