import type { SvgValidation } from './types';

export function validateSvg(svgString: string): SvgValidation {
  const warnings: string[] = [];

  const hasImageTag = /<image[\s>]/i.test(svgString);
  if (hasImageTag) warnings.push('SVG contains <image> element with embedded raster data');

  const hasBase64Data = /data:image\/(png|jpeg|jpg|gif|bmp|webp|tiff)/i.test(svgString);
  if (hasBase64Data) warnings.push('SVG contains base64-encoded raster image data');

  const hasForeignObject = /<foreignObject[\s>]/i.test(svgString);
  if (hasForeignObject) warnings.push('SVG contains <foreignObject> element');

  const hasExternalRaster = /xlink:href=["'][^"']*\.(png|jpg|jpeg|gif|bmp|webp|tiff)/i.test(svgString);
  if (hasExternalRaster) warnings.push('SVG contains external raster image reference');

  const hasEmbeddedRaster = hasImageTag || hasBase64Data || hasExternalRaster;

  return {
    isPureVector: !hasEmbeddedRaster && !hasForeignObject,
    hasEmbeddedRaster,
    hasBase64Data,
    hasForeignObject,
    warnings,
  };
}
