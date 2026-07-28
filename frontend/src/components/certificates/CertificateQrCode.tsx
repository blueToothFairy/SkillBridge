'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface CertificateQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function CertificateQrCode({ value, size = 120, className = '' }: CertificateQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#101828',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`rounded-md border border-slate-200 bg-slate-50 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Certificate verification QR code"
      width={size}
      height={size}
      className={`rounded-md border border-slate-200 bg-white ${className}`}
    />
  );
}
