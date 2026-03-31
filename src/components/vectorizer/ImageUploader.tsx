'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/vectorizer/config';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelected, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const helperTextId = useId();
  const errorTextId = useId();
  const describedBy = error ? `${helperTextId} ${errorTextId}` : helperTextId;

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError('Unsupported format. Use JPEG, PNG, GIF, BMP, TIFF, or WebP.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB.`);
        return;
      }

      onImageSelected(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = Array.from(e.clipboardData.items)
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onPaste={handlePaste}
      tabIndex={0}
      role="button"
      aria-disabled={disabled}
      aria-describedby={describedBy}
      onKeyDown={handleKeyDown}
      className={`
        relative flex flex-col items-center justify-center
        rounded-xl border-2 border-dashed p-8
        transition-colors cursor-pointer min-h-[200px]
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-600 hover:border-neutral-400'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <svg className="w-10 h-10 text-neutral-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>

      <p className="text-neutral-300 text-sm font-medium">
        Drop an image here, click to browse, or paste from clipboard
      </p>
      <p id={helperTextId} className="text-neutral-500 text-xs mt-1">
        JPEG, PNG, GIF, BMP, TIFF, WebP — up to 10MB
      </p>

      {error && (
        <p
          id={errorTextId}
          className="text-red-400 text-sm mt-3"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
