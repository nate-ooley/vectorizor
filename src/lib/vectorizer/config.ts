import type { VectorizeConfig } from './types';

export const PRESETS: Record<string, VectorizeConfig> = {
  precision: {
    colorMode: 'color',
    colorPrecision: 8,
    layerDifference: 4,
    filterSpeckle: 1,
    cornerThreshold: 150,
    spliceThreshold: 100,
    lengthThreshold: 2,
    maxIterations: 20,
    pathPrecision: 8,
    maxDimension: 8000,
    minTraceDimension: 7500,
    colorCount: 192,
    upscale: 1,
    preset: 'precision',
    textFocus: false,
  },
  logo: {
    colorMode: 'color',
    colorPrecision: 8,       // Full color fidelity
    layerDifference: 6,      // Good balance: captures detail without exploding path count
    filterSpeckle: 2,        // Remove 1-2px noise but keep all real detail
    cornerThreshold: 120,    // Preserve most sharp corners
    spliceThreshold: 90,     // Smooth curve connections
    lengthThreshold: 3,      // Short segments = tight fit to contours
    maxIterations: 20,       // Max refinement passes
    pathPrecision: 8,        // Full coordinate precision
    maxDimension: 4000,      // Upper bound after upscale
    upscale: 1,              // Auto-upscale handles this
    minTraceDimension: 4500,
    preset: 'logo',
    textFocus: false,
  },
  illustration: {
    colorMode: 'color',
    colorPrecision: 8,
    layerDifference: 8,      // Slightly coarser for complex artwork
    filterSpeckle: 3,
    cornerThreshold: 100,
    spliceThreshold: 75,
    lengthThreshold: 4,
    maxIterations: 15,
    pathPrecision: 6,
    maxDimension: 4000,
    upscale: 1,
    minTraceDimension: 4500,
    preset: 'illustration',
    textFocus: false,
  },
  photo: {
    colorMode: 'color',
    colorPrecision: 6,       // Photos have many gradients, reduce to keep file manageable
    layerDifference: 16,     // Coarser layers for photos (too many gradients otherwise)
    filterSpeckle: 4,
    cornerThreshold: 60,     // More smoothing for organic photo shapes
    spliceThreshold: 45,
    lengthThreshold: 5,
    maxIterations: 10,
    pathPrecision: 4,
    maxDimension: 3000,      // Photos are huge, keep processing bounded
    upscale: 1,
    minTraceDimension: 3500,
    preset: 'photo',
    textFocus: false,
  },
  custom: {
    colorMode: 'color',
    colorPrecision: 8,
    layerDifference: 6,
    filterSpeckle: 2,
    cornerThreshold: 120,
    spliceThreshold: 90,
    lengthThreshold: 3,
    maxIterations: 20,
    pathPrecision: 8,
    maxDimension: 4000,
    upscale: 1,
    minTraceDimension: 4000,
    preset: 'custom',
    textFocus: false,
  },
};

export const DEFAULT_CONFIG = PRESETS.precision;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  'image/svg+xml',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const PROCESSING_TIMEOUT_MS = 120_000;  // 120 seconds (high fidelity takes longer)
