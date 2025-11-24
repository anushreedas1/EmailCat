/**
 * API Client for Email Productivity Agent
 * Implements all API calls with Axios, error handling, and interceptors
 * 
 * Validates Requirements:
 * - 8.1: Frontend routes all data operations through FastAPI backend
 * - 9.4: Backend service unavailability handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  APIClient,
  EmailAPI,
  PromptAPI,
  AgentAPI,
  DraftAPI,
  APIClientConfig,
} from '@/types/api';
import {
  APIClientError,
  NetworkError,
  ValidationError,
} from '@/types/api';
import type {
  Email,
  Draft,
  PromptConfig,
  LoadInboxResponse,
  ProcessEmailResponse,
  ChatResponse,
  GenerateDraftResponse,
  DeleteDraftResponse,
  DefaultPromptsResponse,
  ProcessEmailRequest,
  UpdatePromptRequest,
  CreateDraftRequest,
  UpdateDraftRequest,
  ChatRequest,
  GenerateDraftRequest,
} from '@/types';

/**
 * Default API configuration
 */
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 0, // No timeout - for free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Create custom error from Axios error
 */
function createAPIError(error: AxiosError): APIClientError | NetworkError | ValidationError {
  if (!error.response) {
    // Network error - no response received
    return new NetworkError(
      error.message || 'Network error. Please check your connection.'
    );
  }

  const status = error.response.status;
  const data = error.response.data as { detail?: string; message?: string; errors?: Record<string, string[]> };

  if (status === 422) {
    // Validation error
    return new ValidationError(
      data?.detail || 'Validation error',
      data?.errors
    );
  }

  // Generic API error
  return new APIClientError(
    data?.detail || error.message || 'An error occurred',
    status,
    data
  );
}

/**
 * Create configured Axios instance
 */
function createAxiosInstance(config: APIClientConfig): AxiosInstance {
  const instance = axios.create(config);

  // Request interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(createAPIError(error));
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Response from ${response.config.url}:`, response.status);
      }
      return response;
    },
    (error: AxiosError) => {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[API] Error from ${error.config?.url}:`, error.message);
      }

      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          new NetworkError('Request timeout. Please try again.')
        );
      }

      if (error.code === 'ERR_NETWORK') {
        return Promise.reject(
          new NetworkError('Unable to connect to server. Please check if the backend is running.')
        );
      }

      return Promise.reject(createAPIError(error));
    }
  );

  return instance;
}

/**
 * Email API implementation
 */
class EmailAPIImpl implements EmailAPI {
  constructor(private client: AxiosInstance) {}

  async loadInbox(): Promise<LoadInboxResponse> {
    const response = await this.client.post<LoadInboxResponse>('/api/emails/load');
    return response.data;
  }

  async getAllEmails(): Promise<Email[]> {
    const response = await this.client.get<{ emails: Email[]; count: number }>('/api/emails');
    return response.data.emails;
  }

  async getEmailById(emailId: string): Promise<Email> {
    const response = await this.client.get<Email>(`/api/emails/${emailId}`);
    return response.data;
  }

  async processEmail(
    emailId: string,
    request?: ProcessEmailRequest
  ): Promise<ProcessEmailResponse> {
    const response = await this.client.post<ProcessEmailResponse>(
      `/api/emails/${emailId}/process`,
      request || {}
    );
    return response.data;
  }
}

/**
 * Prompt API implementation
 */
class PromptAPIImpl implements PromptAPI {
  constructor(private client: AxiosInstance) {}

  async getPrompts(): Promise<PromptConfig> {
    const response = await this.client.get<PromptConfig>('/api/prompts');
    return response.data;
  }

  async updatePrompts(request: UpdatePromptRequest): Promise<PromptConfig> {
    const response = await this.client.put<PromptConfig>('/api/prompts', request);
    return response.data;
  }

  async getDefaultPrompts(): Promise<DefaultPromptsResponse> {
    const response = await this.client.get<DefaultPromptsResponse>('/api/prompts/defaults');
    return response.data;
  }
}

/**
 * Agent API implementation
 */
class AgentAPIImpl implements AgentAPI {
  constructor(private client: AxiosInstance) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.client.post<ChatResponse>('/api/agent/chat', request);
    return response.data;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _unused_CreateDraftRequest = {} as CreateDraftRequest;

  async generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const response = await this.client.post<GenerateDraftResponse>(
      '/api/agent/draft',
      request
    );
    return response.data;
  }
}

/**
 * Draft API implementation
 */
class DraftAPIImpl implements DraftAPI {
  constructor(private client: AxiosInstance) {}

  async getAllDrafts(): Promise<Draft[]> {
    const response = await this.client.get<Draft[]>('/api/drafts');
    return response.data;
  }

  async getDraftById(draftId: string): Promise<Draft> {
    const response = await this.client.get<Draft>(`/api/drafts/${draftId}`);
    return response.data;
  }

  async updateDraft(draftId: string, request: UpdateDraftRequest): Promise<Draft> {
    const response = await this.client.put<Draft>(`/api/drafts/${draftId}`, request);
    return response.data;
  }

  async deleteDraft(draftId: string): Promise<DeleteDraftResponse> {
    const response = await this.client.delete<DeleteDraftResponse>(`/api/drafts/${draftId}`);
    return response.data;
  }

  async getDraftsForEmail(emailId: string): Promise<Draft[]> {
    const response = await this.client.get<Draft[]>('/api/drafts', {
      params: { email_id: emailId },
    });
    return response.data;
  }
}

/**
 * Main API client implementation
 */
class APIClientImpl implements APIClient {
  private axiosInstance: AxiosInstance;
  public emails: EmailAPI;
  public prompts: PromptAPI;
  public agent: AgentAPI;
  public drafts: DraftAPI;

  constructor(config: APIClientConfig = DEFAULT_CONFIG) {
    this.axiosInstance = createAxiosInstance(config);
    this.emails = new EmailAPIImpl(this.axiosInstance);
    this.prompts = new PromptAPIImpl(this.axiosInstance);
    this.agent = new AgentAPIImpl(this.axiosInstance);
    this.drafts = new DraftAPIImpl(this.axiosInstance);
  }

  /**
   * Get the underlying Axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

/**
 * Create and export singleton API client instance
 */
export const apiClient = new APIClientImpl();

/**
 * Export API client class for custom instances
 */
export { APIClientImpl as APIClient };

/**
 * Export error classes for error handling
 */
export { APIClientError, NetworkError, ValidationError } from '@/types/api';
