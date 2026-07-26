'use client';

import React, { useState } from 'react';
import { Loader2, Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApplyModalProps {
  projectTitle: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  success?: boolean;
  onClose: () => void;
  onSubmit: (coverMessage: string) => Promise<void> | void;
}

export default function ApplyModal({
  projectTitle,
  isOpen,
  isSubmitting = false,
  error = null,
  success = false,
  onClose,
  onSubmit,
}: ApplyModalProps) {
  const [coverMessage, setCoverMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverMessage.trim()) return;
    await onSubmit(coverMessage.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Apply to project</h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{projectTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-900">Đã gửi hồ sơ ứng tuyển!</p>
            <p className="text-xs text-slate-500">SME sẽ xem hồ sơ và điểm skill-matching của bạn.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Cover Letter / Lời nhắn
              </label>
              <textarea
                required
                rows={6}
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                placeholder="Giới thiệu ngắn về kỹ năng phù hợp với dự án..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hệ thống sẽ tự tính % trùng khớp skill tags của bạn với yêu cầu dự án.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !coverMessage.trim()}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Gửi ứng tuyển
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
