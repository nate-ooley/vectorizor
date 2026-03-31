'use client';

import { useState, useCallback, useRef } from 'react';
import type { VectorizeConfig, VectorizeResult, VectorizerStatus } from '@/lib/vectorizer/types';
import { DEFAULT_CONFIG } from '@/lib/vectorizer/config';

interface VectorizerState {
  status: VectorizerStatus;
  inputFile: File | null;
  inputPreviewUrl: string | null;
  config: VectorizeConfig;
  result: VectorizeResult | null;
  error: string | null;
  isDirty: boolean;
}

export function useVectorizer() {
  const [state, setState] = useState<VectorizerState>({
    status: 'idle',
    inputFile: null,
    inputPreviewUrl: null,
    config: DEFAULT_CONFIG,
    result: null,
    error: null,
    isDirty: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const setConfig = useCallback((config: VectorizeConfig) => {
    setState((prev) => ({
      ...prev,
      config,
      isDirty: prev.result ? true : prev.isDirty,
    }));
  }, []);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => {
      // Revoke previous object URL
      if (prev.inputPreviewUrl) {
        URL.revokeObjectURL(prev.inputPreviewUrl);
      }
      return {
        ...prev,
        inputFile: file,
        inputPreviewUrl: file ? URL.createObjectURL(file) : null,
        result: null,
        error: null,
        isDirty: false,
        status: file ? 'idle' : 'idle',
      };
    });
  }, []);

  const vectorize = useCallback(async () => {
    if (!state.inputFile) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, status: 'uploading', error: null }));

    try {
      const formData = new FormData();
      formData.append('image', state.inputFile);
      formData.append('config', JSON.stringify(state.config));

      setState((prev) => ({ ...prev, status: 'processing' }));

      const response = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const result: VectorizeResult = await response.json();

      setState((prev) => ({
        ...prev,
        status: 'complete',
        result,
        error: null,
        isDirty: false,
      }));
      abortRef.current = null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setState((prev) => ({ ...prev, status: 'error', error: message }));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [state.inputFile, state.config]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => {
      if (prev.inputPreviewUrl) {
        URL.revokeObjectURL(prev.inputPreviewUrl);
      }
      return {
        status: 'idle',
        inputFile: null,
        inputPreviewUrl: null,
        config: prev.config,
        result: null,
        error: null,
        isDirty: false,
      };
    });
  }, []);

  const downloadSvg = useCallback(() => {
    if (!state.result?.svg) return;
    const blob = new Blob([state.result.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = state.inputFile?.name.replace(/\.[^.]+$/, '') || 'vectorized';
    a.download = `${baseName}-vector.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.result, state.inputFile]);

  return {
    ...state,
    setConfig,
    setFile,
    vectorize,
    reset,
    downloadSvg,
  };
}
