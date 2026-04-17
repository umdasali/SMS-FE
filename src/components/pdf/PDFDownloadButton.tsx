'use client';

import { pdf, DocumentProps } from '@react-pdf/renderer';
import { Button } from 'antd';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';

interface PDFDownloadButtonProps {
  document: React.ReactElement<DocumentProps>;
  fileName: string;
  buttonText?: string;
  loadingText?: string;
  icon?: React.ReactNode;
}

/**
 * Generates the PDF blob eagerly on mount so the button is immediately
 * ready with a stable size — no layout shift from loading → ready transition.
 */
export function PDFDownloadButton({
  document: doc,
  fileName,
  buttonText = 'Download Official PDF',
  loadingText = 'Preparing PDF...',
  icon,
}: PDFDownloadButtonProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    pdf(doc).toBlob().then((blob) => {
      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setBlobUrl(url);
    }).catch(() => {/* silently ignore — button stays in loading state */});

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = blobUrl === null;

  return (
    <Button
      block
      type="primary"
      icon={loading ? <LoadingOutlined /> : (icon || <DownloadOutlined />)}
      disabled={loading}
      href={blobUrl ?? undefined}
      download={fileName}
      style={{
        borderRadius: 8,
        height: 40,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {loading ? loadingText : buttonText}
    </Button>
  );
}
