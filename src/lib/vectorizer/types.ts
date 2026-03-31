export interface VectorizeConfig {
  colorMode?: 'color' | 'binary';
  colorPrecision?: number;    // 1-8, significant bits per RGB channel
  layerDifference?: number;   // 1-256, color difference between gradient layers
  filterSpeckle?: number;     // 0-100, discard patches smaller than this
  cornerThreshold?: number;   // 0-180, minimum angle to be considered a corner
  spliceThreshold?: number;   // 0-180, minimum angle displacement to splice a spline
  lengthThreshold?: number;   // 0-100, iterative subdivide until segments shorter than this
  maxIterations?: number;     // 1-20
  pathPrecision?: number;     // 0-8, decimal places in path coordinates
  maxDimension?: number;      // max width/height for preprocessing resize
  colorCount?: number;        // 2-256, for color quantization
  upscale?: number;           // 1-8, multiplier to upscale small images before tracing
  minTraceDimension?: number; // target min dimension for auto-upscale before tracing
  textFocus?: boolean;        // UI hint to show text-focused tweaks are active
  preset?: 'logo' | 'illustration' | 'photo' | 'custom' | 'precision';
}

export interface SvgMetadata {
  width: number;
  height: number;
  pathCount: number;
  fileSizeBytes: number;
  processingTimeMs: number;
}

export interface SvgValidation {
  isPureVector: boolean;
  hasEmbeddedRaster: boolean;
  hasBase64Data: boolean;
  hasForeignObject: boolean;
  warnings: string[];
}

export interface VectorizeResult {
  svg: string;
  metadata: SvgMetadata;
  validation: SvgValidation;
}

export type VectorizerStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
