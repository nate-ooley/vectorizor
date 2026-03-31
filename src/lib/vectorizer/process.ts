import { vectorize } from '@neplex/vectorizer';
import type { VectorizeConfig, SvgMetadata } from './types';
import { DEFAULT_CONFIG } from './config';
import { preprocessImage } from './preprocess';

// Const enum values from @neplex/vectorizer (can't import const enums with isolatedModules)
const COLOR_MODE_COLOR = 0;
const COLOR_MODE_BINARY = 1;
const HIERARCHICAL_STACKED = 0;  // Stacked mode: layers stack on top of each other (more paths, better fidelity)
const PATH_SIMPLIFY_SPLINE = 2;

export async function processImage(
  buffer: Buffer,
  userConfig: VectorizeConfig
): Promise<{ svg: string; metadata: SvgMetadata }> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const startTime = performance.now();

  // Step 1: Preprocess with sharp (upscale + normalize)
  const { buffer: preprocessed, width, height, origWidth, origHeight } =
    await preprocessImage(buffer, config);

  // Step 2: Vectorize
  let svg = await vectorize(preprocessed, {
    colorMode: config.colorMode === 'binary' ? COLOR_MODE_BINARY : COLOR_MODE_COLOR,
    hierarchical: HIERARCHICAL_STACKED,
    filterSpeckle: config.filterSpeckle ?? 2,
    colorPrecision: config.colorPrecision ?? 8,
    layerDifference: config.layerDifference ?? 6,
    mode: PATH_SIMPLIFY_SPLINE,
    cornerThreshold: config.cornerThreshold ?? 120,
    lengthThreshold: config.lengthThreshold ?? 3,
    maxIterations: config.maxIterations ?? 20,
    spliceThreshold: config.spliceThreshold ?? 90,
    pathPrecision: config.pathPrecision ?? 8,
  });

  // Step 3: Fix SVG dimensions.
  // The vectorizer outputs width/height matching the upscaled pixel dimensions
  // (e.g., 4000x765 for a 277x53 image). We need to set the SVG's display size
  // to the ORIGINAL image dimensions and use viewBox for the coordinate space.
  // This way the SVG renders at the correct default size but scales infinitely.
  if (width !== origWidth || height !== origHeight) {
    // Remove any existing viewBox to avoid duplicates
    svg = svg.replace(/\s+viewBox="[^"]*"/g, '');
    svg = svg.replace(
      /<svg([^>]*)width="[^"]*"([^>]*)height="[^"]*"/,
      `<svg$1width="${origWidth}"$2height="${origHeight}" viewBox="0 0 ${width} ${height}"`
    );
  }

  // Step 4: Count paths
  const pathCount = (svg.match(/<path[\s>]/g) || []).length;

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    svg,
    metadata: {
      width: origWidth,
      height: origHeight,
      pathCount,
      fileSizeBytes: Buffer.byteLength(svg, 'utf-8'),
      processingTimeMs,
    },
  };
}
