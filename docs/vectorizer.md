# Image to SVG Vectorizer — Technical Documentation

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Processing Pipeline](#processing-pipeline)
- [API Reference](#api-reference)
- [Configuration Parameters](#configuration-parameters)
- [Config Validation](#config-validation)
- [Presets](#presets)
- [UI Components](#ui-components)
- [Client-Side Hook](#client-side-hook)
- [SVG Validation](#svg-validation)
- [Supported Formats](#supported-formats)
- [Limits and Constraints](#limits-and-constraints)
- [Error Handling](#error-handling)
- [How Vectorization Works (Technical Deep Dive)](#how-vectorization-works-technical-deep-dive)
- [Verifying Output Quality](#verifying-output-quality)
- [Dependencies](#dependencies)
- [Configuration Files](#configuration-files)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Image to SVG Vectorizer is a web-based tool that converts raster images (JPEG, PNG, GIF, BMP, TIFF, WebP) into 100% pure vector SVG files. The output contains zero embedded raster data — every pixel region is converted into mathematical Bezier curves that scale infinitely with crisp edges at any size.

A 500x500 pixel logo can be vectorized and then scaled to any dimension (including billboard-sized output at 500x500 meters) with no quality degradation. This is the fundamental property of vector graphics: they are defined by math, not pixels.

The tool runs at `/vectorizer` within the Dev Projects Portal.

---

## How It Works

1. **Upload** a raster image (drag-drop, file picker, or clipboard paste)
2. **Configure** the vectorization settings using presets or manual sliders
3. **Vectorize** — the server processes the image through a multi-step pipeline
4. **Preview** the result side-by-side with the original, with zoom up to 800%
5. **Download** the pure SVG file

The conversion pipeline runs entirely server-side. The browser sends the raster image to a Next.js API route, which preprocesses it with `sharp` and vectorizes it with VTracer (via `@neplex/vectorizer`). The response contains the SVG string, metadata about the output, and a validation report confirming the output is 100% vector.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

This installs all dependencies including:
- `@neplex/vectorizer` — VTracer Node.js binding (native Rust via NAPI-RS)
- `sharp` — Image preprocessing library (native C via libvips)

Both packages include prebuilt binaries for macOS, Linux, and Windows.

### Running the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/vectorizer` to use the tool.

### Building for Production

```bash
npm run build
npm start
```

---

## Architecture

```
Browser (Client)                          Server (Next.js API Route)
┌─────────────────────┐                  ┌──────────────────────────────┐
│  ImageUploader       │                  │  POST /api/vectorize         │
│  ControlPanel        │  multipart/      │                              │
│  useVectorizer hook  │──form-data──────>│  1. Validate input           │
│                      │                  │  2. sharp: normalize to PNG  │
│  ComparisonView      │                  │  3. sharp: resize/quantize   │
│    ImagePreview      │  JSON response   │  4. VTracer: trace contours  │
│    SvgPreview        │<─────────────────│  5. VTracer: fit Bezier      │
│  DownloadButton      │  {svg, metadata, │  6. Validate SVG purity      │
│                      │   validation}    │  7. Return result             │
└─────────────────────┘                  └──────────────────────────────┘
```

All image processing is server-side. This avoids:
- WebAssembly/webpack configuration complexity
- Browser freezing during processing of large images
- Client memory limitations

The client is responsible only for:
- File selection and upload
- Rendering the config UI (sliders, presets)
- Displaying the raster input and SVG output previews
- Triggering the SVG file download

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                              # Home page with link to vectorizer
│   ├── layout.tsx                            # Root layout
│   ├── globals.css                           # Global styles (Tailwind CSS 4)
│   ├── vectorizer/
│   │   ├── page.tsx                          # /vectorizer route (Server Component)
│   │   ├── loading.tsx                       # Loading skeleton
│   │   └── error.tsx                         # Error boundary
│   └── api/
│       └── vectorize/
│           └── route.ts                      # POST /api/vectorize endpoint
├── components/
│   └── vectorizer/
│       ├── VectorizerApp.tsx                 # Top-level orchestrator (Client Component)
│       ├── ImageUploader.tsx                 # Drag-drop + file picker + paste
│       ├── ImagePreview.tsx                  # Raster input display
│       ├── SvgPreview.tsx                    # SVG output with zoom controls
│       ├── ControlPanel.tsx                  # Presets + parameter sliders
│       ├── ComparisonView.tsx                # Side-by-side raster vs SVG
│       ├── ProcessingStatus.tsx              # Progress/error indicator
│       └── DownloadButton.tsx                # SVG file download trigger
├── hooks/
│   └── useVectorizer.ts                      # State machine hook for the full workflow
└── lib/
    └── vectorizer/
        ├── types.ts                          # Shared TypeScript interfaces
        ├── config.ts                         # Presets, defaults, constants
        ├── preprocess.ts                     # sharp-based image preprocessing
        ├── process.ts                        # Full server-side processing pipeline
        └── validate-svg.ts                   # SVG purity validation
```

---

## Processing Pipeline

The server pipeline is implemented across three files in `src/lib/vectorizer/`. Each step is described below.

### Step 1: Image Ingestion and Format Normalization

**File:** `src/lib/vectorizer/preprocess.ts`

The raw uploaded file (any supported format) is passed to `sharp` and converted to a normalized PNG buffer. This handles format differences uniformly — JPEG compression artifacts, GIF animation (first frame only), BMP headers, TIFF encoding, and WebP containers are all resolved into a consistent pixel buffer.

```
Input (any format) → sharp → PNG buffer
```

### Step 2: Preprocessing (Upscale + Posterization)

**File:** `src/lib/vectorizer/preprocess.ts`

Preprocessing calculates a single target resolution and applies two transforms in one sharp pipeline:

- **Upscale / Resize:** The pipeline first computes the final target dimensions. If an explicit `upscale` multiplier (2x-6x) is set, the image is scaled by that factor. Otherwise, if the largest side is smaller than `minTraceDimension` (configurable per preset, default 7500px for the `precision` preset), the image is auto-upscaled to reach that threshold. After upscaling, if the result exceeds `maxDimension`, it is capped back down. The resize uses the **Lanczos3** kernel, which produces smooth anti-aliased edges — unlike nearest-neighbor, which creates blocky staircase patterns that the tracer would reproduce.

- **Posterization (Color Quantization):** After resizing, the image is always posterized to a palette-based PNG using `colorCount` colors (default 192 for the `precision` preset, range 2-256). Lanczos3 upscaling introduces anti-aliasing gradients at every edge; without posterization the vectorizer traces each gradient step as a separate path, creating a fuzzy glow effect. Posterizing snaps gradient pixels to their nearest palette color, creating hard color boundaries while keeping the smooth Lanczos3 contours. This is the key insight of the preprocessing approach: **Lanczos3 for smooth contour geometry, posterization for clean color boundaries**.

The `PreprocessResult` returns both the preprocessed (upscaled) dimensions and the original image dimensions, which are used later to set the SVG's display size.

### Step 3: Vectorization (Contour Tracing and Curve Fitting)

**File:** `src/lib/vectorizer/process.ts`

The preprocessed PNG buffer is passed to `@neplex/vectorizer` (VTracer). VTracer performs:

1. **Color clustering** — Groups similar pixels into discrete color regions using the `colorPrecision` and `layerDifference` parameters
2. **Contour extraction** — Traces the boundaries of each color region
3. **Speckle filtering** — Removes patches smaller than `filterSpeckle` pixels
4. **Curve fitting** — Converts jagged pixel boundaries into smooth cubic Bezier splines using iterative optimization controlled by `cornerThreshold`, `spliceThreshold`, `lengthThreshold`, and `maxIterations`
5. **SVG generation** — Outputs an SVG string containing `<path>` elements with `d` attributes (Bezier curve commands: M, L, C, Q, Z) and `fill` colors

The algorithm uses **stacked hierarchical** layering, where paths are layered back-to-front with opaque fills. This produces compact SVG output.

The curve fitting mode is fixed to **Spline** (PathSimplifyMode.Spline = 2), which produces smooth cubic Bezier curves rather than polygons or raw pixels.

### Step 3.5: SVG Dimension Fix (viewBox)

**File:** `src/lib/vectorizer/process.ts`

When the image was upscaled during preprocessing (i.e., the traced dimensions differ from the original), the raw SVG from VTracer has width/height matching the upscaled pixel dimensions (e.g., 4000x765 for a 277x53 original). The pipeline rewrites the SVG root element so that:
- `width` and `height` are set to the **original** image dimensions (for correct default rendering size)
- `viewBox` is set to `0 0 <upscaledWidth> <upscaledHeight>` (preserving all the high-resolution curve data)

This means the SVG renders at the correct default size but contains all the detail from the upscaled trace, scaling infinitely with crisp edges.

### Step 4: SVG Validation

**File:** `src/lib/vectorizer/validate-svg.ts`

The generated SVG string is scanned for any non-vector content:

| Check | Detects |
|-------|---------|
| `<image>` elements | Embedded raster data |
| `data:image/...` URIs | Base64-encoded raster images |
| `<foreignObject>` elements | HTML/raster content containers |
| `xlink:href` to raster files | External raster image references |

The validation returns an `SvgValidation` object indicating whether the output is pure vector. VTracer's algorithm inherently produces only `<path>` elements, so this check serves as a safety net rather than a filter.

### Step 5: Metadata Extraction

The pipeline extracts metadata from the result:
- **Dimensions:** Width and height from the preprocessing step
- **Path count:** Number of `<path>` elements in the SVG (via regex count)
- **File size:** Byte size of the SVG string
- **Processing time:** Wall clock time for the entire pipeline in milliseconds

---

## API Reference

### `POST /api/vectorize`

**File:** `src/app/api/vectorize/route.ts`

Converts a raster image to a pure vector SVG.

#### Request

Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | The raster image file to vectorize |
| `config` | string (JSON) | No | JSON-encoded `VectorizeConfig` object |

#### Response (200 OK)

```json
{
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>...</svg>",
  "metadata": {
    "width": 500,
    "height": 500,
    "pathCount": 142,
    "fileSizeBytes": 48320,
    "processingTimeMs": 230
  },
  "validation": {
    "isPureVector": true,
    "hasEmbeddedRaster": false,
    "hasBase64Data": false,
    "hasForeignObject": false,
    "warnings": []
  }
}
```

#### Error Responses

| Status | Condition | Example Message |
|--------|-----------|-----------------|
| 400 | No image provided | `"No image provided"` |
| 400 | Unsupported format | `"Unsupported format: image/avif. Supported: JPEG, PNG, GIF, BMP, TIFF, WebP"` |
| 413 | File too large | `"File too large (15.2MB). Maximum: 10MB"` |
| 500 | Processing failure | `"Processing failed: <error message>"` |
| 504 | Timeout | `"Processing timed out. Try a smaller image or lower detail settings."` |

---

## Configuration Parameters

All parameters are optional. Defaults come from the active preset (default: `logo`).

### `VectorizeConfig` Interface

**File:** `src/lib/vectorizer/types.ts`

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `colorMode` | `'color' \| 'binary'` | — | `'color'` | Color or black-and-white output |
| `colorPrecision` | number | 1–8 | 6 | Significant bits per RGB channel. Higher = more color accuracy, more paths |
| `layerDifference` | number | 1–256 | 16 | Color difference threshold between gradient layers. Lower = more layers, finer gradients |
| `filterSpeckle` | number | 0–100 | 8 | Discard patches smaller than this many pixels. Higher = cleaner but less detailed |
| `cornerThreshold` | number | 0–180 | 60 | Minimum momentary angle (degrees) to be considered a corner. Higher = smoother curves |
| `spliceThreshold` | number | 0–180 | 45 | Minimum angle displacement (degrees) to splice a spline. Higher = smoother but less accurate |
| `lengthThreshold` | number | 0–100 | 4 | Iteratively subdivide until all segments are shorter than this length |
| `maxIterations` | number | 1–20 | 10 | Maximum number of curve-fitting iterations |
| `pathPrecision` | number | 0–8 | 3 | Decimal places in SVG path coordinate values. Higher = more precise but larger file |
| `maxDimension` | number | — | 2048 | Max width/height for preprocessing resize (pixels) |
| `colorCount` | number | 2–256 | — | Color quantization target. Only applied if specified |
| `preset` | `'logo' \| 'illustration' \| 'photo' \| 'custom'` | — | `'logo'` | Active preset name |

### Parameter Tuning Guide

**For logos and icons (flat colors, clean edges):**
- Use the `logo` preset
- Increase `filterSpeckle` (8–20) to remove noise
- Decrease `colorPrecision` (4–6) to reduce unnecessary color variations
- Increase `layerDifference` (16–32) for fewer, cleaner layers

**For illustrations (many colors, gradients):**
- Use the `illustration` preset
- Set `colorPrecision` to 8 for full color accuracy
- Decrease `layerDifference` (4–8) for smoother gradients
- Keep `filterSpeckle` low (2–4) to preserve detail

**For photographs (continuous tones):**
- Use the `photo` preset
- Note: Photos will always look posterized/artistic when vectorized. This is inherent to vector conversion.
- Lower `maxDimension` (512–1024) to keep file size manageable
- Increase `layerDifference` (16+) to limit the number of paths

---

## Presets

**File:** `src/lib/vectorizer/config.ts`

Four presets are available, each tuned for different image types:

### Logo (Default)

Optimized for flat-color logos and icons. Aggressive speckle filtering removes compression artifacts. Moderate color precision keeps paths clean.

| Parameter | Value |
|-----------|-------|
| colorPrecision | 6 |
| layerDifference | 16 |
| filterSpeckle | 8 |
| maxDimension | 2048 |

### Illustration

Higher fidelity for multi-color artwork. Lower layer difference captures more gradient detail. Less speckle filtering preserves fine features.

| Parameter | Value |
|-----------|-------|
| colorPrecision | 8 |
| layerDifference | 8 |
| filterSpeckle | 4 |
| maxDimension | 2048 |

### Photo

Balanced settings for photographic content. Lower max dimension limits processing time. Minimal layer difference captures tonal range.

| Parameter | Value |
|-----------|-------|
| colorPrecision | 8 |
| layerDifference | 4 |
| filterSpeckle | 2 |
| maxDimension | 1024 |

### Custom

Baseline values for manual tuning. All sliders are independently adjustable.

| Parameter | Value |
|-----------|-------|
| colorPrecision | 6 |
| layerDifference | 16 |
| filterSpeckle | 4 |
| maxDimension | 2048 |

---

## UI Components

All UI components are React Client Components (`'use client'`) located in `src/components/vectorizer/`.

### VectorizerApp

**File:** `src/components/vectorizer/VectorizerApp.tsx`

Top-level orchestrator. Connects the `useVectorizer` hook to all child components. Manages the workflow: upload area is shown when no file is selected; comparison view and controls appear after file selection; download button enables after processing completes.

### ImageUploader

**File:** `src/components/vectorizer/ImageUploader.tsx`

Three input methods:
- **Drag and drop** onto the drop zone (visual feedback on drag-over)
- **Click to browse** via a hidden `<input type="file" accept="image/*">`
- **Clipboard paste** via the `paste` event (supports pasting screenshots)

Client-side validation rejects unsupported formats and files over 10MB before upload.

### ComparisonView

**File:** `src/components/vectorizer/ComparisonView.tsx`

Side-by-side layout (stacked on mobile, two columns on desktop). Shows the original raster image on the left and the vectorized SVG on the right. Before processing, the right panel shows a placeholder.

### ImagePreview

**File:** `src/components/vectorizer/ImagePreview.tsx`

Renders the original raster image using an `<img>` tag with the object URL created from the uploaded file. Constrains the image to fit within the preview area.

### SvgPreview

**File:** `src/components/vectorizer/SvgPreview.tsx`

Renders the SVG output with zoom controls (100%, 200%, 400%, 800%). The SVG is injected via `dangerouslySetInnerHTML` after validation confirms it is pure vector. A metadata bar below the preview shows dimensions, path count, file size, processing time, and the vector purity status (green "100% vector" or red "Contains raster data").

### ControlPanel

**File:** `src/components/vectorizer/ControlPanel.tsx`

Two sections:
- **Standard controls:** Preset selector, color mode toggle, speckle filter slider, color precision slider, layer difference slider
- **Advanced controls** (hidden by default, toggle to show): Corner threshold, splice threshold, length threshold, max iterations, path precision

Each slider shows the current numeric value and a description of what it controls.

### ProcessingStatus

**File:** `src/components/vectorizer/ProcessingStatus.tsx`

Displays the current workflow state:
- **Uploading:** Spinner + "Uploading image..."
- **Processing:** Spinner + "Vectorizing — tracing contours and fitting curves..."
- **Complete:** Green checkmark + "Vectorization complete"
- **Error:** Red X + error message

### DownloadButton

**File:** `src/components/vectorizer/DownloadButton.tsx`

Disabled until processing completes. Triggers a browser download of the SVG file. The filename is derived from the original input filename with a `-vector.svg` suffix (e.g., `logo.png` becomes `logo-vector.svg`).

---

## Client-Side Hook

### `useVectorizer`

**File:** `src/hooks/useVectorizer.ts`

A custom React hook that manages the entire client-side workflow as a state machine.

#### State

| Field | Type | Description |
|-------|------|-------------|
| `status` | `VectorizerStatus` | Current state: `'idle'`, `'uploading'`, `'processing'`, `'complete'`, `'error'` |
| `inputFile` | `File \| null` | The selected raster image file |
| `inputPreviewUrl` | `string \| null` | Object URL for the raster preview (created via `URL.createObjectURL`) |
| `config` | `VectorizeConfig` | Current vectorization configuration |
| `result` | `VectorizeResult \| null` | The SVG string, metadata, and validation result |
| `error` | `string \| null` | Error message if status is `'error'` |

#### Actions

| Method | Description |
|--------|-------------|
| `setFile(file)` | Sets the input file, creates a preview URL, resets result/error state |
| `setConfig(config)` | Updates the vectorization configuration |
| `vectorize()` | Sends the image + config to `POST /api/vectorize` and transitions through `uploading` → `processing` → `complete` or `error` |
| `reset()` | Clears all state (file, preview, result, error) back to idle. Revokes the object URL to prevent memory leaks |
| `downloadSvg()` | Creates a Blob from the SVG string and triggers a browser download |

#### State Transitions

```
idle ──[setFile]──> idle (with file loaded)
                     │
                     ├──[vectorize]──> uploading ──> processing ──> complete
                     │                                    │
                     │                                    └──> error
                     │
                     └──[reset]──> idle (clean)
```

---

## SVG Validation

**File:** `src/lib/vectorizer/validate-svg.ts`

Every SVG output is validated to confirm it contains zero embedded raster data.

### Validation Checks

| Check | Pattern | Flags |
|-------|---------|-------|
| Embedded raster images | `/<image[\s>]/i` | `hasEmbeddedRaster` |
| Base64-encoded raster data | `/data:image\/(png\|jpeg\|jpg\|gif\|bmp\|webp\|tiff)/i` | `hasBase64Data` |
| Foreign objects (HTML containers) | `/<foreignObject[\s>]/i` | `hasForeignObject` |
| External raster references | `/xlink:href=["'][^"']*\.(png\|jpg\|jpeg\|gif\|bmp\|webp\|tiff)/i` | `hasEmbeddedRaster` |

### Validation Result

```typescript
interface SvgValidation {
  isPureVector: boolean;       // true if ALL checks pass
  hasEmbeddedRaster: boolean;  // true if <image>, base64, or external raster found
  hasBase64Data: boolean;      // true if data:image/ URI found
  hasForeignObject: boolean;   // true if <foreignObject> found
  warnings: string[];          // human-readable descriptions of any issues
}
```

The `isPureVector` field is `true` only when there are zero raster elements and zero foreign objects. This is the authoritative indicator that the output is safe to scale infinitely.

---

## Supported Formats

### Input Formats

| Format | MIME Type | Notes |
|--------|-----------|-------|
| JPEG | `image/jpeg` | Compression artifacts are smoothed during vectorization |
| PNG | `image/png` | Best input format for logos (lossless, sharp edges) |
| GIF | `image/gif` | First frame only (animation is not preserved) |
| BMP | `image/bmp` | Uncompressed, large files |
| TIFF | `image/tiff` | First page only for multi-page TIFFs |
| WebP | `image/webp` | Both lossy and lossless supported |
| SVG | `image/svg+xml` | Accepted but rasterized first (re-vectorization) |

### Output Format

Pure SVG 1.1 containing only:
- `<svg>` root element with `xmlns` and `viewBox`
- `<path>` elements with `d` (Bezier curve commands) and `fill` attributes
- No `<image>`, `<foreignObject>`, base64 data, or external references

---

## Limits and Constraints

| Limit | Value | Configurable |
|-------|-------|:------------:|
| Maximum file size | 10 MB | Yes (`MAX_FILE_SIZE` in `config.ts`) |
| Processing timeout | 30 seconds | Yes (`PROCESSING_TIMEOUT_MS` in `config.ts`) |
| Maximum preprocessing dimension | 2048 px | Yes (`maxDimension` in config) |
| Color quantization range | 2–256 colors | Yes (`colorCount` in config) |

---

## Error Handling

Errors are handled at four layers:

### Layer 1: Client-Side Validation (ImageUploader)

Before uploading, the client checks:
- File MIME type is in the allowed list
- File size is under 10MB

Invalid files are rejected with an inline error message — no network request is made.

### Layer 2: Server-Side Validation (API Route)

The API route validates:
- An image file was provided (`400`)
- The MIME type is supported (`400`)
- The file size is within limits (`413`)

### Layer 3: Processing Errors (API Route)

If `sharp` or `@neplex/vectorizer` throws during processing:
- The error is caught and returned as `500` with the error message
- A 30-second timeout guard returns `504` if processing hangs

### Layer 4: Route Error Boundary (error.tsx)

If the React page itself throws during rendering, the Next.js error boundary (`src/app/vectorizer/error.tsx`) catches it and displays a recovery UI with a "Try Again" button.

---

## How Vectorization Works (Technical Deep Dive)

### Raster vs Vector

A raster image is a grid of colored pixels. A 500x500 image contains exactly 250,000 pixels. Zoom in and you see colored squares. The information is fixed — there is no detail between pixels.

A vector image is a set of mathematical instructions: "draw a curve from point A to point B with these control points, fill it with this color." The math scales infinitely. Whether the output device is a phone screen or a 500-meter billboard, the curves are recalculated at the target resolution with mathematically smooth edges.

### The VTracer Algorithm

VTracer (the engine behind `@neplex/vectorizer`) performs these steps:

1. **Color quantization/clustering:** The image's colors are clustered into discrete groups based on `colorPrecision` (how many significant bits per channel) and `layerDifference` (minimum color distance between layers).

2. **Layer separation:** Each color cluster becomes a separate binary layer (pixels in this color vs not).

3. **Contour tracing:** For each layer, the algorithm walks along the boundary between "in" and "out" pixels, recording a sequence of pixel coordinates.

4. **Speckle removal:** Contours enclosing fewer pixels than `filterSpeckle` are discarded.

5. **Path simplification:** The raw pixel contour is simplified using the Ramer-Douglas-Peucker algorithm to reduce the number of points while preserving shape.

6. **Bezier curve fitting:** The simplified points are fitted with cubic Bezier splines using iterative least-squares optimization. The `cornerThreshold` determines where hard corners occur vs smooth curves. The `spliceThreshold` and `lengthThreshold` control smoothing precision. The `maxIterations` caps the optimization loop.

7. **SVG assembly:** The fitted curves are encoded as SVG `<path>` elements with `d` attributes containing `M` (move), `L` (line), `C` (cubic Bezier), `Q` (quadratic Bezier), and `Z` (close) commands. Colors are assigned as `fill` attributes. Layers are stacked back-to-front (stacked hierarchical mode).

### Why the Output Is Inherently Pure Vector

VTracer's algorithm **only produces `<path>` elements**. It does not have the capability to embed raster images, create `<foreignObject>` elements, or reference external files. The SVG output is structurally guaranteed to be pure vector by the algorithm's design. The validation step is a defense-in-depth safeguard, not a filter.

---

## Verifying Output Quality

### Automated (Every Conversion)

The `validation.isPureVector` field in the API response confirms the output contains zero raster data. This is checked automatically and displayed in the UI.

### Visual (In-Browser)

The SVG preview component includes zoom controls at 100%, 200%, 400%, and 800%. At 800% zoom:
- Vector output shows mathematically smooth curves
- Any raster content would show visible pixel blocks

### Manual (Downloaded File)

1. Open the `.svg` file in a text editor. Search for `<image`, `data:image`, and `foreignObject`. None should be present.
2. Open the `.svg` file in a browser. Zoom to 1000%+ using Ctrl/Cmd + scroll. Edges should remain crisp.
3. Open the `.svg` file in a vector editor (Illustrator, Figma, Inkscape). All content should be editable paths, not embedded images.

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.4.6 | React framework (App Router, API routes) |
| `react` | 19.1.0 | UI framework |
| `react-dom` | 19.1.0 | React DOM renderer |
| `@neplex/vectorizer` | ^0.0.5 | VTracer Node.js binding — image-to-SVG vectorization engine (MIT license, native Rust via NAPI-RS) |
| `sharp` | ^0.34.5 | Image preprocessing — format conversion, resize, color quantization (Apache-2.0, native C via libvips) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Type checking |
| `tailwindcss` | ^4 | Utility-first CSS |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 15.4.6 | Next.js ESLint rules |

---

## Configuration Files

### `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['@neplex/vectorizer', 'sharp'],
};
```

The `serverExternalPackages` entry tells Next.js to not bundle these native Node.js modules. They are resolved at runtime from `node_modules` instead. This is required because both packages contain platform-specific binary addons that cannot be processed by webpack/turbopack.

### `tsconfig.json`

Path alias `@/*` maps to `./src/*`, enabling imports like `@/lib/vectorizer/types`.

---

## Known Limitations

1. **GIF animations:** Only the first frame is processed. Animated GIFs lose their animation.

2. **Photographic images:** Photos convert to a posterized/artistic style. Continuous tones become discrete color bands. This is inherent to vector conversion — raster photographs contain information that cannot be losslessly represented as vector paths.

3. **Very large images:** Images are capped at 2048px (configurable) before vectorization. While larger inputs are supported, processing time and SVG file size increase significantly.

4. **SVG file size for complex images:** A photograph vectorized at high detail can produce SVGs with thousands of paths and file sizes in the megabytes. Use higher `filterSpeckle` and `layerDifference` values to reduce complexity.

5. **Transparency:** Semi-transparent pixels in PNGs are flattened during vectorization. VTracer does not produce semi-transparent fills.

6. **Processing timeout:** Complex images at high-detail settings may exceed the 30-second timeout. Reduce `maxDimension`, increase `filterSpeckle`, or increase `layerDifference` to speed up processing.

---

## Troubleshooting

### "Processing timed out"

The image is too complex for the current settings. Try:
- Switching to the `logo` or `custom` preset (less detail)
- Increasing `filterSpeckle` to 10–20
- Increasing `layerDifference` to 32+
- Decreasing `maxDimension` to 1024 or 512

### "Unsupported format"

The file's MIME type is not in the allowed list. Supported formats: JPEG, PNG, GIF, BMP, TIFF, WebP. If the file is a valid image but has an incorrect extension or MIME type, try re-saving it in a supported format.

### Build fails with native module errors

`@neplex/vectorizer` and `sharp` include prebuilt binaries. If the install fails:
1. Ensure you are on a supported platform (macOS arm64/x64, Linux x64, Windows x64)
2. Try `npm rebuild` to recompile native addons
3. Check that Node.js 20+ is installed

### SVG output looks overly simplified

Increase detail by:
- Decreasing `filterSpeckle` (fewer patches removed)
- Decreasing `layerDifference` (more color layers)
- Increasing `colorPrecision` (more color accuracy)
- Increasing `maxIterations` (more curve-fitting refinement)

### SVG output has too many paths / large file size

Reduce complexity by:
- Increasing `filterSpeckle` (remove small details)
- Increasing `layerDifference` (merge similar colors)
- Decreasing `colorPrecision` (fewer color distinctions)
- Enabling `colorCount` to force a specific palette size
