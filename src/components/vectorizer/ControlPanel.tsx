'use client';

import { useState } from 'react';
import type { VectorizeConfig } from '@/lib/vectorizer/types';
import { PRESETS } from '@/lib/vectorizer/config';

interface ControlPanelProps {
  config: VectorizeConfig;
  onChange: (config: VectorizeConfig) => void;
  disabled?: boolean;
}

export function ControlPanel({ config, onChange, disabled }: ControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<VectorizeConfig>) => {
    onChange({ ...config, ...partial });
  };

  const applyPreset = (key: string) => {
    onChange({ ...PRESETS[key] });
  };

  const toggleTextFocus = () => {
    if (config.textFocus) {
      update({ textFocus: false });
      return;
    }
    update({
      textFocus: true,
      filterSpeckle: 0,
      layerDifference: Math.min(config.layerDifference ?? 6, 4),
      cornerThreshold: 160,
      spliceThreshold: 110,
      lengthThreshold: 2,
      maxIterations: 20,
      pathPrecision: 8,
      colorCount: Math.max(config.colorCount ?? 64, 192),
      minTraceDimension: Math.max(config.minTraceDimension ?? 0, 7500),
      maxDimension: Math.max(config.maxDimension ?? 0, 8000),
    });
  };

  return (
    <div className={`flex flex-col gap-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Presets */}
      <div>
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide block mb-2">Preset</label>
        <div className="flex gap-2">
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                config.preset === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Color Mode */}
      <div>
        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide block mb-2">Color Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => update({ colorMode: 'color' })}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              config.colorMode !== 'binary'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Color
          </button>
          <button
            onClick={() => update({ colorMode: 'binary' })}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              config.colorMode === 'binary'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Black & White
          </button>
        </div>
      </div>

      {/* Upscale */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-neutral-300">Upscale</label>
          <span className="text-sm font-mono text-neutral-400">
            {(config.upscale ?? 1) <= 1 ? 'Auto' : `${config.upscale}x`}
          </span>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Auto', value: 1 },
            { label: '2x', value: 2 },
            { label: '3x', value: 3 },
            { label: '4x', value: 4 },
            { label: '5x', value: 5 },
            { label: '6x', value: 6 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ upscale: opt.value })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                (config.upscale ?? 1) === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-1">Enlarges the image before the tracer runs. More pixels = more contour data = crisper edges. Auto mode upscales small images to 4000px. Use 2-4x for images that still look soft at Auto.</p>
      </div>

      {/* Speckle Filter */}
      <SliderControl
        label="Speckle Filter"
        description="Removes tiny isolated pixel groups smaller than this size (in pixels). At 0-1, every tiny dot is preserved for maximum accuracy. Increase to 10-20 to clean up JPEG noise or scanner artifacts. Higher values (50+) remove small design elements — use with caution."
        value={config.filterSpeckle ?? 2}
        min={0}
        max={100}
        onChange={(v) => update({ filterSpeckle: v })}
      />

      {/* Color Precision */}
      <SliderControl
        label="Color Precision"
        description="How many color shades the vectorizer can distinguish (1-8 bits per channel). At 8, all 16 million RGB colors are available — maximum fidelity. Lower values merge similar colors: 6 gives ~260K colors, 4 gives ~4K colors. Lower = fewer SVG paths and smaller file size, but colors become posterized."
        value={config.colorPrecision ?? 8}
        min={1}
        max={8}
        onChange={(v) => update({ colorPrecision: v })}
      />

      {/* Layer Difference */}
      <SliderControl
        label="Layer Difference"
        description="The minimum color difference needed to create a separate SVG layer. At 1, even the tiniest color variation gets its own path — maximum detail. At 16+, only major color changes create layers. Lower = more paths, larger file, more accurate. Higher = fewer paths, smaller file, more posterized."
        value={config.layerDifference ?? 6}
        min={1}
        max={256}
        onChange={(v) => update({ layerDifference: v })}
      />

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-blue-400 hover:text-blue-300 text-left"
      >
        {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-4 border-t border-neutral-800 pt-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Text Focus</span>
            <button
              onClick={toggleTextFocus}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-colors
                ${config.textFocus
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}
              `}
              aria-pressed={config.textFocus ? 'true' : 'false'}
            >
              {config.textFocus ? 'Text Focus Enabled' : 'Boost Letter Clarity'}
            </button>
            <p className="text-xs text-neutral-500">
              Raises auto-upscale limits and color fidelity so letterforms, S-curves, and icon strokes stay razor sharp. Recommended for logos, wordmarks, and UI glyphs.
            </p>
          </div>
          <SliderControl
            label="Corner Threshold"
            description="Angles sharper than this (in degrees) are kept as hard corners instead of being smoothed into curves. At 120, most angles are preserved as corners — good for logos and geometric art. Lower values (60-90) smooth more aggressively, softening corners into curves. Higher values keep more sharp points."
            value={config.cornerThreshold ?? 120}
            min={0}
            max={180}
            onChange={(v) => update({ cornerThreshold: v })}
          />
          <SliderControl
            label="Splice Threshold"
            description="Controls how curve segments connect to each other. At 90, curves join smoothly at angles up to 90°. Lower values allow sharper joins — edges stay crisper but may look angular. Higher values force smoother connections — looks polished but may round off intentional corners."
            value={config.spliceThreshold ?? 90}
            min={0}
            max={180}
            onChange={(v) => update({ spliceThreshold: v })}
          />
          <SliderControl
            label="Length Threshold"
            description="The tracer subdivides curves until each segment is shorter than this value (in pixels). At 2, segments are very short — curves follow the original contour tightly. Higher values (10+) use longer segments, creating smoother but less accurate curves. For maximum edge fidelity, keep at 2-4."
            value={config.lengthThreshold ?? 3}
            min={0}
            max={100}
            onChange={(v) => update({ lengthThreshold: v })}
          />
          <SliderControl
            label="Max Iterations"
            description="How many times the algorithm refines each curve to better fit the original contour. At 20 (max), curves are refined until they closely match the pixel edges. Lower values (5-10) stop earlier — faster processing but curves may deviate from the original shape."
            value={config.maxIterations ?? 20}
            min={1}
            max={20}
            onChange={(v) => update({ maxIterations: v })}
          />
          <SliderControl
            label="Path Precision"
            description="Number of decimal places in SVG coordinate values (0-8). At 8, coordinates like '123.45678901' allow extremely precise curve positioning. At 2, coordinates round to '123.45' — smaller file but slightly less precise curves. For maximum edge accuracy, keep at 6-8."
            value={config.pathPrecision ?? 8}
            min={0}
            max={8}
            onChange={(v) => update({ pathPrecision: v })}
          />
          <SliderControl
            label="Edge Fidelity Boost"
            description="Controls how much color detail is preserved before tracing (2-256). Push this higher to keep micro-gradients around text edges so curves stay clean at 400–800% zoom. Lower values create smaller SVGs but can introduce banding."
            value={config.colorCount ?? 64}
            min={2}
            max={256}
            onChange={(v) => update({ colorCount: v })}
          />
        </div>
      )}
    </div>
  );
}

function SliderControl({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-neutral-300">{label}</label>
        <span className="text-sm font-mono text-neutral-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
      <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
    </div>
  );
}
