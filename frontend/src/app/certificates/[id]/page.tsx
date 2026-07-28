'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Award,
  ShieldCheck,
  Share2,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { fetchCertificateByCodeApi } from '@/lib/api/certificates';
import { CertificateQrCode } from '@/components/certificates/CertificateQrCode';
import { DigitalCertificate } from '@/types';

export default function DigitalCertificatePage() {
  const params = useParams();
  const code = params?.id as string;

  const [cert, setCert] = useState<DigitalCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!code) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCertificateByCodeApi(code);
        setCert(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  const verificationUrl = useMemo(() => {
    if (!cert || typeof window === 'undefined') return '';
    return `${window.location.origin}/certificates/${cert.verificationCode}`;
  }, [cert]);

  const handleCopyLink = async () => {
    if (!verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setShareMessage('Verification link copied to clipboard.');
      setTimeout(() => {
        setCopied(false);
        setShareMessage(null);
      }, 2500);
    } catch {
      setError('Không thể copy link xác thực.');
    }
  };

  const handleShare = async () => {
    if (!cert || !verificationUrl) return;

    const sharePayload = {
      title: `SkillBridge Certificate — ${cert.projectTitle}`,
      text: `${cert.studentName} completed "${cert.projectTitle}" on SkillBridge. Verify: ${cert.verificationCode}`,
      url: verificationUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(sharePayload);
        setShareMessage('Certificate shared successfully.');
      } else {
        await navigator.clipboard.writeText(`${sharePayload.text}\n${verificationUrl}`);
        setCopied(true);
        setShareMessage('Share text copied (native share not supported on this device).');
      }
      setTimeout(() => {
        setCopied(false);
        setShareMessage(null);
      }, 2500);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError('Không thể chia sẻ chứng nhận.');
      }
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="card-crisp p-6 bg-white text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Certificate Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested certificate does not exist.'}</p>
        <Link href="/certificates" className="btn-primary inline-block text-sm px-4 py-2">
          Back to Certificates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div className="no-print flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/certificates"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Certificates
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPdf}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleShare}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Certificate
          </button>
        </div>
      </div>

      {shareMessage && (
        <div className="no-print card-crisp p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {shareMessage}
        </div>
      )}

      <div className="certificate-print-area card-crisp p-8 bg-white border border-slate-200 shadow-lg space-y-8 relative overflow-hidden">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-md text-xs font-bold tracking-wider uppercase">
            <Award className="h-4 w-4 text-emerald-400" /> SkillBridge Official Certificate
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight pt-2">
            Certificate of Completion
          </h1>
          <p className="text-xs text-slate-500 font-mono">Verification ID: {cert.verificationCode}</p>
        </div>

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
            <strong className="text-slate-900">{cert.smeCompany}</strong> through the SkillBridge platform.
          </p>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified Skill Tags Applied
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {cert.skillsVerified.map((sk) => (
              <span
                key={sk}
                className="tag-matched text-xs px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-300"
              >
                {sk} ✓
              </span>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="text-left space-y-1">
            <p className="font-bold text-slate-900">SkillBridge Verification System</p>
            <p className="text-[11px] text-slate-500">Issued on {cert.issueDate}</p>
            <p className="text-[11px] text-slate-500 break-all">{verificationUrl}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {verificationUrl && <CertificateQrCode value={verificationUrl} size={112} />}
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Scan to verify</p>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-emerald-800 font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentic SkillBridge Digital Credential
          </div>
        </div>
      </div>

      <div className="no-print card-crisp p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Public verification endpoint: <code>/api/certificates/verify/{cert.verificationCode}</code>
      </div>
    </div>
  );
}
