/**
 * API module exports
 * Central export point for all API-related functionality
 */

export { apiClient, APIClient } from './client';
export { APIClientError, NetworkError, ValidationError } from '@/types/api';
export type {
  APIClientConfig,
  EmailAPI,
  PromptAPI,
  AgentAPI,
  DraftAPI,
  APIClient as IAPIClient,
} from '@/types/api';
