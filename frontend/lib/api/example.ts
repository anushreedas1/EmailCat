/**
 * Example usage of the API client
 * This file demonstrates how to use the API client in your components
 * 
 * NOTE: This is for reference only and should not be imported in production code
 */

import { apiClient, APIClientError, NetworkError, ValidationError } from './index';

/**
 * Example: Load and display emails
 */
export async function exampleLoadEmails() {
  try {
    // Load mock inbox
    const { count, emails } = await apiClient.emails.loadInbox();
    console.log(`Successfully loaded ${count} emails`);

    // Get all emails
    const allEmails = await apiClient.emails.getAllEmails();
    console.log('All emails:', allEmails);

    // Get specific email
    if (allEmails.length > 0) {
      const firstEmail = await apiClient.emails.getEmailById(allEmails[0].id);
      console.log('First email:', firstEmail);

      // Process the email
      const result = await apiClient.emails.processEmail(firstEmail.id);
      console.log('Processing result:', result);
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
    } else if (error instanceof APIClientError) {
      console.error('API error:', error.message, error.status);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example: Manage prompts
 */
export async function exampleManagePrompts() {
  try {
    // Get current prompts
    const prompts = await apiClient.prompts.getPrompts();
    console.log('Current prompts:', prompts);

    // Update prompts
    const updated = await apiClient.prompts.updatePrompts({
      categorization_prompt: 'Categorize this email as Important, Newsletter, Spam, or To-Do',
      action_item_prompt: 'Extract action items from this email',
      auto_reply_prompt: 'Generate a professional reply to this email',
    });
    console.log('Updated prompts:', updated);

    // Get default prompts
    const defaults = await apiClient.prompts.getDefaultPrompts();
    console.log('Default prompts:', defaults);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
      console.error('Field errors:', error.errors);
    } else if (error instanceof APIClientError) {
      console.error('API error:', error.message);
    }
  }
}

/**
 * Example: Chat with agent
 */
export async function exampleAgentChat() {
  try {
    // Send a chat message
    const response = await apiClient.agent.chat({
      message: 'What tasks do I need to do?',
    });
    console.log('Agent response:', response.response);

    // Chat with email context
    const emails = await apiClient.emails.getAllEmails();
    if (emails.length > 0) {
      const contextResponse = await apiClient.agent.chat({
        message: 'Summarize this email',
        email_id: emails[0].id,
      });
      console.log('Context response:', contextResponse.response);
    }

    // Generate a draft
    if (emails.length > 0) {
      const { draft } = await apiClient.agent.generateDraft({
        email_id: emails[0].id,
        instructions: 'Keep it brief and professional',
      });
      console.log('Generated draft:', draft);
    }
  } catch (error) {
    if (error instanceof APIClientError) {
      console.error('API error:', error.message);
    }
  }
}

/**
 * Example: Manage drafts
 */
export async function exampleManageDrafts() {
  try {
    // Get all drafts
    const drafts = await apiClient.drafts.getAllDrafts();
    console.log('All drafts:', drafts);

    // Generate a new draft using the agent
    const emails = await apiClient.emails.getAllEmails();
    if (emails.length > 0) {
      const { draft: newDraft } = await apiClient.agent.generateDraft({
        email_id: emails[0].id,
        instructions: 'Keep it professional',
      });
      console.log('Generated draft:', newDraft);

      // Update the draft
      const updated = await apiClient.drafts.updateDraft(newDraft.id, {
        body: 'Updated: Thank you for your email...',
      });
      console.log('Updated draft:', updated);

      // Get draft by ID
      const retrieved = await apiClient.drafts.getDraftById(newDraft.id);
      console.log('Retrieved draft:', retrieved);

      // Get drafts for specific email
      const emailDrafts = await apiClient.drafts.getDraftsForEmail(emails[0].id);
      console.log('Drafts for email:', emailDrafts);

      // Delete the draft
      const deleteResult = await apiClient.drafts.deleteDraft(newDraft.id);
      console.log('Delete result:', deleteResult);
    }
  } catch (error) {
    if (error instanceof APIClientError) {
      console.error('API error:', error.message);
    }
  }
}

/**
 * Example: Comprehensive error handling
 */
export async function exampleErrorHandling() {
  try {
    // This will fail if the backend is not running
    await apiClient.emails.getAllEmails();
  } catch (error) {
    if (error instanceof NetworkError) {
      // Handle network errors
      console.error('Cannot connect to server. Is the backend running?');
      console.error('Error:', error.message);
    } else if (error instanceof ValidationError) {
      // Handle validation errors
      console.error('Invalid request data');
      console.error('Validation errors:', error.errors);
    } else if (error instanceof APIClientError) {
      // Handle other API errors
      console.error(`API Error (${error.status}): ${error.message}`);
      if (error.status === 404) {
        console.error('Resource not found');
      } else if (error.status === 500) {
        console.error('Server error');
      }
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example: Using with React components
 */
export function exampleReactUsage() {
  // This is pseudo-code to show how to use the API client in React components
  
  /*
  import { useEffect, useState } from 'react';
  import { apiClient, NetworkError } from '@/lib/api';
  import type { Email } from '@/types';

  function EmailList() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      async function loadEmails() {
        try {
          setLoading(true);
          setError(null);
          const data = await apiClient.emails.getAllEmails();
          setEmails(data);
        } catch (err) {
          if (err instanceof NetworkError) {
            setError('Unable to connect to server');
          } else {
            setError('Failed to load emails');
          }
        } finally {
          setLoading(false);
        }
      }

      loadEmails();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
      <div>
        {emails.map(email => (
          <div key={email.id}>
            <h3>{email.subject}</h3>
            <p>From: {email.sender}</p>
          </div>
        ))}
      </div>
    );
  }
  */
}

/**
 * Example: Using with React Query
 */
export function exampleReactQueryUsage() {
  // This is pseudo-code to show how to use the API client with React Query
  
  /*
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { apiClient } from '@/lib/api';

  // Query for emails
  function useEmails() {
    return useQuery({
      queryKey: ['emails'],
      queryFn: () => apiClient.emails.getAllEmails(),
    });
  }

  // Mutation for processing email
  function useProcessEmail() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (emailId: string) => 
        apiClient.emails.processEmail(emailId),
      onSuccess: () => {
        // Invalidate and refetch emails
        queryClient.invalidateQueries({ queryKey: ['emails'] });
      },
    });
  }

  // Usage in component
  function EmailComponent() {
    const { data: emails, isLoading, error } = useEmails();
    const processEmail = useProcessEmail();

    const handleProcess = (emailId: string) => {
      processEmail.mutate(emailId);
    };

    // ... render component
  }
  */
}
