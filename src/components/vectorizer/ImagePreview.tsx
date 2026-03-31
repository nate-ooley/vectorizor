'use client';

interface ImagePreviewProps {
  src: string;
  fileName?: string;
}

export function ImagePreview({ src, fileName }: ImagePreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Original (Raster)</h3>
      <div className="relative rounded-lg border border-neutral-700 bg-neutral-900 overflow-hidden">
        <div className="flex items-center justify-center p-4 min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={fileName || 'Input image'}
            className="max-w-full max-h-[400px] object-contain"
          />
        </div>
      </div>
      {fileName && (
        <p className="text-xs text-neutral-500 truncate">{fileName}</p>
      )}
    </div>
  );
}
