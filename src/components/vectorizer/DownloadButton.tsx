'use client';

interface DownloadButtonProps {
  onDownload: () => void;
  disabled?: boolean;
}

export function DownloadButton({ onDownload, disabled }: DownloadButtonProps) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        text-sm font-medium transition-colors
        ${disabled
          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-500 text-white'
        }
      `}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download SVG
    </button>
  );
}
