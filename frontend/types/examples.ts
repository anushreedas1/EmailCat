/**
 * Example usage of TypeScript types
 * This file demonstrates how to use the types and validates they work correctly
 */

import type {
  Email,
  ActionItem,
  PromptConfig,
  Draft,
  ChatMessage,
  CategoryTag,
  LoadInboxResponse,
  ProcessEmailResponse,
  ChatRequest,
  UpdatePromptRequest,
} from './index';

// ============================================================================
// Example Data
// ============================================================================

/**
 * Example action item
 */
export const exampleActionItem: ActionItem = {
  id: 'action-1',
  email_id: 'email-1',
  task: 'Review Q4 budget proposal',
  deadline: '2024-01-20',
  completed: false,
  created_at: '2024-01-15T10:30:00Z',
};

/**
 * Example email
 */
export const exampleEmail: Email = {
  id: 'email-1',
  sender: 'john.doe@company.com',
  subject: 'Q4 Budget Review',
  body: 'Please review the attached Q4 budget proposal by Friday.',
  timestamp: '2024-01-15T10:30:00Z',
  category: 'Important',
  processed: true,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:35:00Z',
  action_items: [exampleActionItem],
};

/**
 * Example prompt configuration
 */
export const examplePromptConfig: PromptConfig = {
  id: 'prompt-1',
  categorization_prompt: 'Categorize this email as Important, Newsletter, Spam, or To-Do',
  action_item_prompt: 'Extract action items from this email',
  auto_reply_prompt: 'Generate a professional reply to this email',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

/**
 * Example draft
 */
export const exampleDraft: Draft = {
  id: 'draft-1',
  email_id: 'email-1',
  subject: 'Re: Q4 Budget Review',
  body: 'Thank you for sending the budget proposal. I will review it and provide feedback by Friday.',
  suggested_follow_ups: [
    'Schedule follow-up meeting',
    'Request additional details',
  ],
  created_at: '2024-01-15T11:00:00Z',
  updated_at: '2024-01-15T11:00:00Z',
};

/**
 * Example chat message
 */
export const exampleChatMessage: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'What tasks do I need to do?',
  timestamp: '2024-01-15T11:30:00Z',
};

// ============================================================================
// Example Functions
// ============================================================================

/**
 * Example function using CategoryTag type
 */
export function getCategoryColor(category: CategoryTag): string {
  const colorMap: Record<CategoryTag, string> = {
    Important: '#ef4444',
    Newsletter: '#3b82f6',
    Spam: '#6b7280',
    'To-Do': '#10b981',
    Uncategorized: '#f59e0b',
  };
  return colorMap[category];
}

/**
 * Example function using Email type
 */
export function formatEmailPreview(email: Email): string {
  return `${email.sender}: ${email.subject}`;
}

/**
 * Example function using ActionItem type
 */
export function isActionItemOverdue(actionItem: ActionItem): boolean {
  if (!actionItem.deadline) return false;
  const deadline = new Date(actionItem.deadline);
  return deadline < new Date() && !actionItem.completed;
}

/**
 * Example API request builder
 */
export function buildChatRequest(
  message: string,
  emailId?: string
): ChatRequest {
  return {
    message,
    email_id: emailId || null,
    context: null,
  };
}

/**
 * Example API response handler
 */
export function handleLoadInboxResponse(
  response: LoadInboxResponse
): { success: boolean; message: string } {
  if (response.count === 0) {
    return {
      success: false,
      message: 'No emails found in inbox',
    };
  }
  return {
    success: true,
    message: `Successfully loaded ${response.count} emails`,
  };
}

/**
 * Example prompt update builder
 */
export function buildPromptUpdate(
  config: PromptConfig
): UpdatePromptRequest {
  return {
    categorization_prompt: config.categorization_prompt,
    action_item_prompt: config.action_item_prompt,
    auto_reply_prompt: config.auto_reply_prompt,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid CategoryTag
 */
export function isCategoryTag(value: string): value is CategoryTag {
  return ['Important', 'Newsletter', 'Spam', 'To-Do', 'Uncategorized'].includes(
    value
  );
}

/**
 * Type guard to check if an email has been processed
 */
export function isProcessedEmail(email: Email): boolean {
  return email.processed && email.category !== null;
}

/**
 * Type guard to check if a chat message is from the user
 */
export function isUserMessage(message: ChatMessage): boolean {
  return message.role === 'user';
}
