'use client';

import { ImagePreview } from './ImagePreview';
import { SvgPreview } from './SvgPreview';
import type { VectorizeResult } from '@/lib/vectorizer/types';

interface ComparisonViewProps {
  inputPreviewUrl: string;
  inputFileName?: string;
  result: VectorizeResult | null;
}

export function ComparisonView({ inputPreviewUrl, inputFileName, result }: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ImagePreview src={inputPreviewUrl} fileName={inputFileName} />
      {result ? (
        <SvgPreview
          svg={result.svg}
          metadata={result.metadata}
          validation={result.validation}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Vectorized (SVG)</h3>
          <div className="rounded-lg border border-neutral-700 bg-neutral-900 flex items-center justify-center min-h-[300px]">
            <p className="text-neutral-500 text-sm">Click &quot;Vectorize&quot; to convert</p>
          </div>
        </div>
      )}
    </div>
  );
}
