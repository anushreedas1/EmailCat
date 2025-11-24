/**
 * API client type definitions
 * These types define the structure for API service methods
 */

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
} from './index';

/**
 * API client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Email API service interface
 */
export interface EmailAPI {
  /**
   * Load emails from mock inbox
   */
  loadInbox(): Promise<LoadInboxResponse>;

  /**
   * Get all emails
   */
  getAllEmails(): Promise<Email[]>;

  /**
   * Get single email by ID
   */
  getEmailById(emailId: string): Promise<Email>;

  /**
   * Process email (categorize and extract actions)
   */
  processEmail(
    emailId: string,
    request?: ProcessEmailRequest
  ): Promise<ProcessEmailResponse>;
}

/**
 * Prompt API service interface
 */
export interface PromptAPI {
  /**
   * Get current prompt configuration
   */
  getPrompts(): Promise<PromptConfig>;

  /**
   * Update prompt configuration
   */
  updatePrompts(request: UpdatePromptRequest): Promise<PromptConfig>;

  /**
   * Get default prompt templates
   */
  getDefaultPrompts(): Promise<DefaultPromptsResponse>;
}

/**
 * Agent API service interface
 */
export interface AgentAPI {
  /**
   * Send chat message to agent
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Generate draft reply
   */
  generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse>;
}

/**
 * Draft API service interface
 */
export interface DraftAPI {
  /**
   * Get all drafts
   */
  getAllDrafts(): Promise<Draft[]>;

  /**
   * Get draft by ID
   */
  getDraftById(draftId: string): Promise<Draft>;

  /**
   * Update existing draft
   */
  updateDraft(draftId: string, request: UpdateDraftRequest): Promise<Draft>;

  /**
   * Delete draft
   */
  deleteDraft(draftId: string): Promise<DeleteDraftResponse>;

  /**
   * Get all drafts for a specific email
   */
  getDraftsForEmail(emailId: string): Promise<Draft[]>;
}

/**
 * Complete API client interface
 */
export interface APIClient {
  emails: EmailAPI;
  prompts: PromptAPI;
  agent: AgentAPI;
  drafts: DraftAPI;
}

/**
 * HTTP method types
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request options for API calls
 */
export interface RequestOptions {
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

/**
 * API error types
 */
export class APIClientError extends Error {
  public status?: number;
  public response?: unknown;

  constructor(
    message: string,
    status?: number,
    response?: unknown
  ) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
    this.response = response;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIClientError);
    }
  }
}

/**
 * Network error type
 */
export class NetworkError extends APIClientError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Validation error type
 */
export class ValidationError extends APIClientError {
  public errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = errors;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
