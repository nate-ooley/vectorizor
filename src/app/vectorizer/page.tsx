import type { Metadata } from 'next';
import { VectorizerApp } from '@/components/vectorizer/VectorizerApp';

export const metadata: Metadata = {
  title: 'Image to SVG Vectorizer',
  description: 'Convert raster images (JPEG, PNG, GIF) to pure vector SVG files. Infinitely scalable with crisp edges at any size.',
};

export default function VectorizerPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Image to SVG Vectorizer</h1>
          <p className="text-neutral-400 mt-2">
            Convert any raster image to a 100% pure vector SVG. The output scales infinitely with zero quality loss — from pixels to billboards.
          </p>
        </div>
        <VectorizerApp />
      </div>
    </main>
  );
}
