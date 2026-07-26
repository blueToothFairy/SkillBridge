'use client';

import React, { useState } from 'react';
import { Loader2, ShieldCheck, X, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import { depositEscrowApi, EscrowStatusResponse } from '@/lib/api/escrow';

interface EscrowModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  budget: number;
  token: string;
  onClose: () => void;
  onSuccess: (status: EscrowStatusResponse) => void;
}

export default function EscrowModal({
  isOpen,
  projectId,
  projectTitle,
  budget,
  token,
  onClose,
  onSuccess,
}: EscrowModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleDeposit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const status = await depositEscrowApi(token, projectId);
      setDone(true);
      onSuccess(status);
      setTimeout(() => {
        onClose();
        setDone(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Không thể ký quỹ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Ký quỹ mô phỏng</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-900">Đã khóa kinh phí (HELD)</p>
              <p className="text-xs text-slate-500">Dự án sẽ chuyển sang IN_PROGRESS nếu đã match ứng viên.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Xác nhận ký quỹ mô phỏng cho dự án <strong>{projectTitle}</strong>. Không có giao dịch thật —
                hệ thống chỉ chuyển trạng thái <code className="text-[11px]">PENDING → HELD</code>.
              </p>

              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Số tiền ký quỹ
                </p>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">{formatVnd(budget)}</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4" disabled={submitting}>
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Xác nhận ký quỹ
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
