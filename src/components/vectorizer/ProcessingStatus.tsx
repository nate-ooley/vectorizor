'use client';

import type { VectorizerStatus } from '@/lib/vectorizer/types';

interface ProcessingStatusProps {
  status: VectorizerStatus;
  error: string | null;
}

export function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-3">
      {(status === 'uploading' || status === 'processing') && (
        <>
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-300">
            {status === 'uploading' ? 'Uploading image...' : 'Vectorizing — tracing contours and fitting curves...'}
          </span>
        </>
      )}

      {status === 'complete' && (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-400">Vectorization complete</span>
        </>
      )}

      {status === 'error' && error && (
        <>
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm text-red-400">{error}</span>
        </>
      )}
    </div>
  );
}
