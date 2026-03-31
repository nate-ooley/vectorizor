import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/vectorizer/process';
import { validateSvg } from '@/lib/vectorizer/validate-svg';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, PROCESSING_TIMEOUT_MS } from '@/lib/vectorizer/config';
import type { VectorizeConfig } from '@/lib/vectorizer/types';
import { sanitizeConfig } from '@/lib/vectorizer/config-validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const configStr = formData.get('config') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: `Unsupported format: ${imageFile.type}. Supported: JPEG, PNG, GIF, BMP, TIFF, WebP` },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(imageFile.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB` },
        { status: 413 }
      );
    }

    let parsedConfig: VectorizeConfig = {};
    if (configStr) {
      try {
        parsedConfig = JSON.parse(configStr);
      } catch {
        return NextResponse.json({ error: 'Invalid config payload' }, { status: 400 });
      }
    }

    const config: VectorizeConfig = sanitizeConfig(parsedConfig);
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const result = await Promise.race([
      processImage(buffer, config),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Processing timed out')), PROCESSING_TIMEOUT_MS)
      ),
    ]);

    const validation = validateSvg(result.svg);

    return NextResponse.json({
      svg: result.svg,
      metadata: result.metadata,
      validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Processing timed out') {
      return NextResponse.json({ error: 'Processing timed out. Try a smaller image or lower detail settings.' }, { status: 504 });
    }

    console.error('Vectorize error:', error);
    return NextResponse.json({ error: `Processing failed: ${message}` }, { status: 500 });
  }
}
