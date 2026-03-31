'use client';

import { useVectorizer } from '@/hooks/useVectorizer';
import { ImageUploader } from './ImageUploader';
import { ComparisonView } from './ComparisonView';
import { ControlPanel } from './ControlPanel';
import { ProcessingStatus } from './ProcessingStatus';
import { DownloadButton } from './DownloadButton';

export function VectorizerApp() {
  const {
    status,
    inputFile,
    inputPreviewUrl,
    config,
    result,
    error,
    isDirty,
    setConfig,
    setFile,
    vectorize,
    reset,
    downloadSvg,
  } = useVectorizer();

  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <div className="flex flex-col gap-8">
      {/* Upload area */}
      {!inputFile && (
        <ImageUploader onImageSelected={setFile} disabled={isProcessing} />
      )}

      {/* Comparison view */}
      {inputPreviewUrl && (
        <ComparisonView
          inputPreviewUrl={inputPreviewUrl}
          inputFileName={inputFile?.name}
          result={result}
        />
      )}

      {/* Controls */}
      {inputFile && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          <ControlPanel config={config} onChange={setConfig} disabled={isProcessing} />

          <div className="flex flex-col gap-3">
            <button
              onClick={vectorize}
              disabled={isProcessing || !inputFile}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isProcessing
                  ? 'bg-blue-800 text-blue-300 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                }
              `}
            >
              {isProcessing ? 'Processing...' : 'Vectorize'}
            </button>

            <DownloadButton onDownload={downloadSvg} disabled={!result || isDirty} />
            {isDirty && (
              <p className="text-xs text-amber-400">
                Settings changed since the last conversion. Re-run vectorization to refresh the SVG.
              </p>
            )}

            <button
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <ProcessingStatus status={status} error={error} />
    </div>
  );
}
