import { PRESETS } from './config';
import type { VectorizeConfig } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return undefined;
  }
  return clamp(value, min, max);
}

const PRESET_KEYS = new Set(Object.keys(PRESETS));
const MIN_TRACE_DIM_BOUNDS = { min: 1000, max: 10000 };

export function sanitizeConfig(raw: unknown): VectorizeConfig {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const input = raw as Record<string, unknown>;

  const sanitized: VectorizeConfig = {};

  if (input.colorMode === 'binary') {
    sanitized.colorMode = 'binary';
  } else if (input.colorMode === 'color') {
    sanitized.colorMode = 'color';
  }

  const colorPrecision = safeNumber(input.colorPrecision, 1, 8);
  if (colorPrecision !== undefined) sanitized.colorPrecision = colorPrecision;

  const layerDifference = safeNumber(input.layerDifference, 1, 256);
  if (layerDifference !== undefined) sanitized.layerDifference = layerDifference;

  const filterSpeckle = safeNumber(input.filterSpeckle, 0, 500);
  if (filterSpeckle !== undefined) sanitized.filterSpeckle = filterSpeckle;

  const cornerThreshold = safeNumber(input.cornerThreshold, 0, 180);
  if (cornerThreshold !== undefined) sanitized.cornerThreshold = cornerThreshold;

  const spliceThreshold = safeNumber(input.spliceThreshold, 0, 180);
  if (spliceThreshold !== undefined) sanitized.spliceThreshold = spliceThreshold;

  const lengthThreshold = safeNumber(input.lengthThreshold, 0, 200);
  if (lengthThreshold !== undefined) sanitized.lengthThreshold = lengthThreshold;

  const maxIterations = safeNumber(input.maxIterations, 1, 40);
  if (maxIterations !== undefined) sanitized.maxIterations = maxIterations;

  const pathPrecision = safeNumber(input.pathPrecision, 0, 8);
  if (pathPrecision !== undefined) sanitized.pathPrecision = pathPrecision;

  const maxDimension = safeNumber(input.maxDimension, 256, 10000);
  if (maxDimension !== undefined) sanitized.maxDimension = Math.round(maxDimension);

  const colorCount = safeNumber(input.colorCount, 2, 256);
  if (colorCount !== undefined) sanitized.colorCount = Math.round(colorCount);

  const upscale = safeNumber(input.upscale, 1, 8);
  if (upscale !== undefined) sanitized.upscale = Math.round(upscale);

  const minTraceDimension = safeNumber(
    input.minTraceDimension,
    MIN_TRACE_DIM_BOUNDS.min,
    MIN_TRACE_DIM_BOUNDS.max
  );
  if (minTraceDimension !== undefined) sanitized.minTraceDimension = Math.round(minTraceDimension);

  if (typeof input.preset === 'string' && PRESET_KEYS.has(input.preset)) {
    sanitized.preset = input.preset as VectorizeConfig['preset'];
  }

  return sanitized;
}
