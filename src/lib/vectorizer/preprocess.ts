import sharp from 'sharp';
import type { VectorizeConfig } from './types';

// Default minimum dimension for tracing. The tracer needs enough pixels
// to produce smooth contours. For small images, we upscale aggressively.
const DEFAULT_MIN_TRACE_DIMENSION = 5000;

export interface PreprocessResult {
  buffer: Buffer;
  width: number;       // preprocessed (upscaled) width
  height: number;      // preprocessed (upscaled) height
  origWidth: number;   // original image width
  origHeight: number;  // original image height
}

export async function preprocessImage(
  buffer: Buffer,
  config: VectorizeConfig
): Promise<PreprocessResult> {
  const metadata = await sharp(buffer).metadata();
  const origWidth = metadata.width ?? 0;
  const origHeight = metadata.height ?? 0;
  const maxSide = Math.max(origWidth, origHeight);

  // ─── Step 1: Calculate final target dimensions ───
  // IMPORTANT: We must compute the final size BEFORE calling .resize(),
  // because sharp only allows ONE resize per pipeline. A second .resize()
  // call silently overwrites the first.
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  const upscale = config.upscale ?? 1;
  const minTraceDimension = config.minTraceDimension ?? DEFAULT_MIN_TRACE_DIMENSION;
  if (upscale > 1) {
    targetWidth = Math.round(origWidth * upscale);
    targetHeight = Math.round(origHeight * upscale);
  } else if (maxSide < minTraceDimension && maxSide > 0) {
    const autoScale = minTraceDimension / maxSide;
    targetWidth = Math.round(origWidth * autoScale);
    targetHeight = Math.round(origHeight * autoScale);
  }

  // Apply maxDimension cap (shrink if too large after upscale)
  const maxDim = config.maxDimension ?? 4000;
  const scaledMaxSide = Math.max(targetWidth, targetHeight);
  if (scaledMaxSide > maxDim) {
    const capScale = maxDim / scaledMaxSide;
    targetWidth = Math.round(targetWidth * capScale);
    targetHeight = Math.round(targetHeight * capScale);
  }

  // ─── Step 2: Upscale with lanczos3 for smooth contours ───
  // Lanczos3 creates smooth anti-aliased edges during upscale, which gives
  // VTracer smooth contour data to trace (unlike nearest-neighbor which
  // creates blocky staircase patterns).
  let pipeline = sharp(buffer, { animated: false });

  if (targetWidth !== origWidth || targetHeight !== origHeight) {
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      kernel: 'lanczos3',
      fit: 'fill',
    });
  }

  // ─── Step 3: Posterize to eliminate anti-aliasing gradients ───
  // Lanczos3 upscaling creates smooth gradients at every edge (anti-aliasing).
  // Without posterization, the vectorizer traces every gradient step as a
  // separate path, creating a fuzzy glow effect.
  // Posterizing to a reduced palette snaps those gradient pixels to their
  // nearest color, creating hard color boundaries while keeping smooth contours.
  // We use PNG palette mode with a generous color count to preserve real colors
  // while eliminating the subtle anti-aliasing gradient steps.
  const colorCount = config.colorCount ?? 64;
  pipeline = pipeline.png({ palette: true, colours: Math.min(colorCount, 256) });

  const result = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    origWidth,
    origHeight,
  };
}
