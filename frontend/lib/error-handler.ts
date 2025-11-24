/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 * 
 * Validates Requirements:
 * - 9.1: Display user-friendly error messages for LLM API failures
 * - 9.3: Handle invalid email data gracefully
 * - 9.4: Handle backend service unavailability
 */

import { APIClientError, NetworkError, ValidationError } from '@/types/api';

/**
 * Get user-friendly error message from error object
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle API client errors
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your connection and ensure the backend is running.';
  }

  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`;
  }

  if (error instanceof APIClientError) {
    // Map specific status codes to user-friendly messages
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timeout. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few moments.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('LLM') || error.message.includes('API')) {
      return 'Processing delayed due to high demand. Please try again.';
    }
    return error.message;
  }

  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof APIClientError) {
    // Retry on server errors and rate limiting
    const status = error.status || 0;
    return status >= 500 || status === 429 || status === 408;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('econnaborted')
    );
  }

  return false;
}

/**
 * Log error for debugging
 */
export function logError(error: unknown, context?: string) {
  const prefix = context ? `[${context}]` : '[Error]';
  
  if (process.env.NODE_ENV === 'development') {
    console.error(prefix, error);
  }

  // In production, you might want to send errors to a logging service
  // Example: sendToLoggingService(error, context);
}

/**
 * Handle error with toast notification
 */
export function handleErrorWithToast(
  error: unknown,
  showToast: (type: 'error', message: string) => void,
  context?: string
) {
  logError(error, context);
  const message = getUserFriendlyErrorMessage(error);
  showToast('error', message);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors?: Record<string, string[]>): string {
  if (!errors) return '';

  const messages = Object.entries(errors)
    .map(([field, fieldErrors]) => {
      return `${field}: ${fieldErrors.join(', ')}`;
    })
    .join('; ');

  return messages;
}
