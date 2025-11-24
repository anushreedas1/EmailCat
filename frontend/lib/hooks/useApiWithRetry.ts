/**
 * API Hook with Retry Logic
 * Custom hook for API calls with automatic retry and error handling
 * 
 * Validates Requirements:
 * - 9.1: Handle LLM API failures with retry logic
 * - 9.2: Queue operations and retry when connection is restored
 * - 9.4: Handle backend service unavailability
 */

'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/lib/toast';
import { retryWithBackoff, getUserFriendlyErrorMessage, isRetryableError } from '@/lib/error-handler';

interface UseApiWithRetryOptions<T> {
  maxRetries?: number;
  showErrorToast?: boolean;
  showRetryToast?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export function useApiWithRetry<T>(
  apiFunction: () => Promise<T>,
  options: UseApiWithRetryOptions<T> = {}
) {
  const {
    maxRetries = 3,
    showErrorToast = true,
    showRetryToast = true,
    onSuccess,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<T | null>(null);
  const { showError, showInfo } = useToast();

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await retryWithBackoff(apiFunction, {
        maxRetries,
        onRetry: (attempt, retryError) => {
          if (showRetryToast && isRetryableError(retryError)) {
            showInfo(`Retrying... (Attempt ${attempt}/${maxRetries})`);
          }
        },
      });

      setData(result);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        const message = getUserFriendlyErrorMessage(err);
        showError(message);
      }
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, maxRetries, showErrorToast, showRetryToast, onSuccess, onError, showError, showInfo]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}
