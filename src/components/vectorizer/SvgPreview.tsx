'use client';

import { useMemo, useState } from 'react';
import type { SvgMetadata, SvgValidation } from '@/lib/vectorizer/types';

interface SvgPreviewProps {
  svg: string;
  metadata: SvgMetadata;
  validation: SvgValidation;
}

const ZOOM_LEVELS = [100, 200, 400, 800];

export function SvgPreview({ svg, metadata, validation }: SvgPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const sanitizedSvg = useMemo(() => sanitizeSvgMarkup(svg), [svg]);
  const dataUrl = useMemo(() => {
    if (!sanitizedSvg) return '';
    return `data:image/svg+xml;utf8,${encodeURIComponent(sanitizedSvg)}`;
  }, [sanitizedSvg]);
  const showFallback = !sanitizedSvg || !dataUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Vectorized (SVG)</h3>
        <div className="flex gap-1">
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setZoom(level)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                zoom === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {level}%
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg border border-neutral-700 bg-neutral-900 overflow-auto">
        <div
          className="flex items-center justify-center p-4 min-h-[300px]"
          style={{ maxHeight: '500px' }}
        >
          {showFallback ? (
            <p className="text-sm text-red-300 text-center">Unable to render SVG preview safely.</p>
          ) : (
            <ZoomedSvgImage
              src={dataUrl}
              zoom={zoom}
              metadata={metadata}
            />
          )}
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
        <span>{metadata.width} x {metadata.height}</span>
        <span>{metadata.pathCount} paths</span>
        <span>{(metadata.fileSizeBytes / 1024).toFixed(1)} KB</span>
        <span>{metadata.processingTimeMs}ms</span>
        {validation.isPureVector ? (
          <span className="text-green-500">100% vector</span>
        ) : (
          <span className="text-red-400">Contains raster data</span>
        )}
      </div>

      {validation.warnings.length > 0 && (
        <div className="rounded bg-red-900/30 border border-red-800 p-2 text-xs text-red-300">
          {validation.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoomedSvgImage({
  src,
  zoom,
  metadata,
}: {
  src: string;
  zoom: number;
  metadata: SvgMetadata;
}) {
  const baseWidth = Math.max(200, Math.min(metadata.width || 0, 600) || 400);
  const scale = zoom / 100;
  const displayWidth = baseWidth * scale;
  const aspectRatio =
    metadata.width && metadata.height ? metadata.height / metadata.width : 1;
  const displayHeight = displayWidth * aspectRatio;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="Vector preview"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      className="select-none pointer-events-none"
      draggable={false}
    />
  );
}

function sanitizeSvgMarkup(svg: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return '';
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      return '';
    }

    doc.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((el) => el.remove());

    const serializer = new XMLSerializer();

    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === 'href' || name === 'xlink:href') {
          if (/^javascript:/i.test(value) || /^data:text\/html/i.test(value)) {
            el.removeAttribute(attr.name);
            return;
          }
        }
        if (name === 'style' && /url\s*\(\s*['"]?\s*javascript:/i.test(value)) {
          el.removeAttribute(attr.name);
          return;
        }
      });
    });

    return serializer.serializeToString(doc);
  } catch {
    return '';
  }
}
