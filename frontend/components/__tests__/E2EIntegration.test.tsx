/**
 * End-to-End Integration Tests for Frontend Components
 * 
 * Tests validate:
 * - Complete email workflow from inbox to processing
 * - Prompt configuration UI and behavior
 * - Draft generation and editing workflow
 * - Error handling across components
 * - Component integration and data flow
 * - UI state management
 * 
 * Validates Requirements: All (comprehensive frontend integration)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InboxView from '../InboxView';
import PromptBrain from '../PromptBrain';
import EmailAgent from '../EmailAgent';
import DraftEditor from '../DraftEditor';
import type { Email, PromptConfig, Draft, ChatMessage } from '@/types';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock data
const mockEmails: Email[] = [
  {
    id: 'email-1',
    sender: 'john@example.com',
    subject: 'Project Update',
    body: 'Here is the latest update on the project. Please review by Friday.',
    timestamp: new Date().toISOString(),
    category: 'Important',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [
      {
        id: 'action-1',
        email_id: 'email-1',
        task: 'Review project update',
        deadline: '2024-12-31',
        completed: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'email-2',
    sender: 'newsletter@tech.com',
    subject: 'Weekly Newsletter',
    body: 'This week in tech...',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'Newsletter',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
];

const mockPrompts: PromptConfig = {
  categorization_prompt: 'Categorize this email as Important, Newsletter, Spam, or To-Do',
  action_item_prompt: 'Extract action items from this email',
  auto_reply_prompt: 'Generate a professional reply to this email',
};

const mockDraft: Draft = {
  id: 'draft-1',
  email_id: 'email-1',
  subject: 'Re: Project Update',
  body: 'Thank you for the update. I will review it by Friday.',
  suggested_follow_ups: ['Schedule follow-up meeting'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('End-to-End Frontend Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Complete Email Workflow', () => {
    it('displays emails, allows selection, and shows details', () => {
      const onEmailSelect = jest.fn();

      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={onEmailSelect}
          isLoading={false}
        />
      );

      // Verify emails are displayed
      expect(screen.getByText('Project Update')).toBeInTheDocument();
      expect(screen.getByText('Weekly Newsletter')).toBeInTheDocument();

      // Select an email
      const firstEmail = screen.getByText('Project Update').closest('div[role="button"]');
      fireEvent.click(firstEmail!);

      // Verify selection callback
      expect(onEmailSelect).toHaveBeenCalledWith('email-1');
    });

    it('shows category badges and action items', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={jest.fn()}
          isLoading={false}
        />
      );

      // Verify category badges
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();

      // Verify action items count
      expect(screen.getByText('1 action item')).toBeInTheDocument();
    });

    it('handles empty inbox state', () => {
      render(
        <InboxView
          emails={[]}
          onEmailSelect={jest.fn()}
          isLoading={false}
        />
      );

      expect(screen.getByText('No emails')).toBeInTheDocument();
      expect(screen.getByText('Load your inbox to get started')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      render(
        <InboxView
          emails={[]}
          onEmailSelect={jest.fn()}
          isLoading={true}
        />
      );

      // Check for loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles error state', () => {
      const errorMessage = 'Failed to load emails';
      render(
        <InboxView
          emails={[]}
          onEmailSelect={jest.fn()}
          isLoading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('Error loading emails')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Prompt Configuration Workflow', () => {
    it('displays and allows editing of prompts', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      render(
        <PromptBrain
          prompts={mockPrompts}
          onSave={onSave}
          isLoading={false}
        />
      );

      // Verify prompts are displayed
      expect(screen.getByDisplayValue(/Categorize this email/)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Extract action items/)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Generate a professional reply/)).toBeInTheDocument();

      // Edit a prompt
      const categorizationInput = screen.getByLabelText('Categorization Prompt');
      fireEvent.change(categorizationInput, {
        target: { value: 'New categorization prompt' },
      });

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save Prompts/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            categorization_prompt: 'New categorization prompt',
          })
        );
      });
    });

    it('shows loading state during save', async () => {
      const onSave = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <PromptBrain
          prompts={mockPrompts}
          onSave={onSave}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText('Categorization Prompt');
      fireEvent.change(input, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Prompts/i });
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('handles save errors gracefully', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <PromptBrain
          prompts={mockPrompts}
          onSave={onSave}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText('Categorization Prompt');
      fireEvent.change(input, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Prompts/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('allows resetting to defaults', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);

      render(
        <PromptBrain
          prompts={mockPrompts}
          onSave={onSave}
          isLoading={false}
        />
      );

      // Modify a prompt
      const input = screen.getByLabelText('Categorization Prompt');
      fireEvent.change(input, { target: { value: 'Modified prompt' } });

      // Reset to defaults
      const resetButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(resetButton);

      // Verify reset
      await waitFor(() => {
        const inputAfterReset = screen.getByLabelText('Categorization Prompt') as HTMLTextAreaElement;
        expect(inputAfterReset.value).toBe(mockPrompts.categorization_prompt);
      });
    });
  });

  describe('Draft Generation and Editing Workflow', () => {
    it('displays draft and allows editing', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const onDiscard = jest.fn();

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={onSave}
          onDiscard={onDiscard}
        />
      );

      // Verify draft is displayed
      expect(screen.getByDisplayValue('Re: Project Update')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Thank you for the update/)).toBeInTheDocument();

      // Edit draft
      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Re: Project Update - Reviewed' } });

      const bodyTextarea = screen.getByLabelText('Body');
      fireEvent.change(bodyTextarea, { target: { value: 'Updated body content' } });

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Re: Project Update - Reviewed',
            body: 'Updated body content',
          })
        );
      });
    });

    it('shows unsaved changes indicator', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={jest.fn()}
          onDiscard={jest.fn()}
        />
      );

      // Initially no unsaved changes
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

      // Make a change
      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      // Should show unsaved changes
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('confirms before discarding unsaved changes', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      const onDiscard = jest.fn();

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={jest.fn()}
          onDiscard={onDiscard}
        />
      );

      // Make a change
      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      // Try to discard
      const discardButton = screen.getByRole('button', { name: /Discard/i });
      fireEvent.click(discardButton);

      // Should show confirmation
      expect(confirmSpy).toHaveBeenCalled();
      expect(onDiscard).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('displays suggested follow-ups', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={jest.fn()}
          onDiscard={jest.fn()}
        />
      );

      expect(screen.getByText('Suggested Follow-ups')).toBeInTheDocument();
      expect(screen.getByText('Schedule follow-up meeting')).toBeInTheDocument();
    });
  });

  describe('Email Agent Chat Workflow', () => {
    it('displays chat interface and allows sending messages', async () => {
      const onSendMessage = jest.fn().mockResolvedValue('This is a response from the agent');
      const chatHistory: ChatMessage[] = [];

      render(
        <EmailAgent
          selectedEmail={mockEmails[0]}
          onSendMessage={onSendMessage}
          chatHistory={chatHistory}
        />
      );

      // Verify chat interface is displayed
      expect(screen.getByPlaceholderText(/Ask about this email/i)).toBeInTheDocument();

      // Type a message
      const input = screen.getByPlaceholderText(/Ask about this email/i);
      fireEvent.change(input, { target: { value: 'Summarize this email' } });

      // Send message
      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Summarize this email');
      });
    });

    it('displays chat history', () => {
      const chatHistory: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What tasks do I need to do?',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'You have 1 task: Review project update by Friday',
          timestamp: new Date().toISOString(),
        },
      ];

      render(
        <EmailAgent
          selectedEmail={mockEmails[0]}
          onSendMessage={jest.fn()}
          chatHistory={chatHistory}
        />
      );

      expect(screen.getByText('What tasks do I need to do?')).toBeInTheDocument();
      expect(screen.getByText('You have 1 task: Review project update by Friday')).toBeInTheDocument();
    });

    it('shows suggested queries', () => {
      render(
        <EmailAgent
          selectedEmail={mockEmails[0]}
          onSendMessage={jest.fn()}
          chatHistory={[]}
        />
      );

      // Check for suggested queries
      expect(screen.getByText(/Summarize/i)).toBeInTheDocument();
      expect(screen.getByText(/What tasks/i)).toBeInTheDocument();
    });

    it('handles no selected email state', () => {
      render(
        <EmailAgent
          selectedEmail={undefined}
          onSendMessage={jest.fn()}
          chatHistory={[]}
        />
      );

      expect(screen.getByText(/Select an email/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates inbox selection with email agent', () => {
      const onEmailSelect = jest.fn();
      const onSendMessage = jest.fn();

      const { rerender } = render(
        <div>
          <InboxView
            emails={mockEmails}
            onEmailSelect={onEmailSelect}
            isLoading={false}
          />
          <EmailAgent
            selectedEmail={undefined}
            onSendMessage={onSendMessage}
            chatHistory={[]}
          />
        </div>
      );

      // Initially no email selected
      expect(screen.getByText(/Select an email/i)).toBeInTheDocument();

      // Select an email
      const firstEmail = screen.getByText('Project Update').closest('div[role="button"]');
      fireEvent.click(firstEmail!);

      expect(onEmailSelect).toHaveBeenCalledWith('email-1');

      // Rerender with selected email
      rerender(
        <div>
          <InboxView
            emails={mockEmails}
            onEmailSelect={onEmailSelect}
            selectedEmailId="email-1"
            isLoading={false}
          />
          <EmailAgent
            selectedEmail={mockEmails[0]}
            onSendMessage={onSendMessage}
            chatHistory={[]}
          />
        </div>
      );

      // Email agent should now show the selected email
      expect(screen.queryByText(/Select an email/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask about this email/i)).toBeInTheDocument();
    });

    it('maintains state consistency across components', () => {
      const onEmailSelect = jest.fn();
      const onSave = jest.fn();

      render(
        <div>
          <InboxView
            emails={mockEmails}
            onEmailSelect={onEmailSelect}
            selectedEmailId="email-1"
            isLoading={false}
          />
          <DraftEditor
            draft={mockDraft}
            onSave={onSave}
            onDiscard={jest.fn()}
          />
        </div>
      );

      // Verify both components display consistent data
      expect(screen.getByText('Project Update')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Re: Project Update')).toBeInTheDocument();
    });
  });

  describe('Error Handling Across Components', () => {
    it('handles network errors in inbox', () => {
      render(
        <InboxView
          emails={[]}
          onEmailSelect={jest.fn()}
          isLoading={false}
          error="Network connection failed"
        />
      );

      expect(screen.getByText('Error loading emails')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('handles save errors in draft editor', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Failed to save draft'));

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={onSave}
          onDiscard={jest.fn()}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save draft')).toBeInTheDocument();
      });
    });

    it('handles chat errors gracefully', async () => {
      const onSendMessage = jest.fn().mockRejectedValue(new Error('Chat service unavailable'));

      render(
        <EmailAgent
          selectedEmail={mockEmails[0]}
          onSendMessage={onSendMessage}
          chatHistory={[]}
        />
      );

      const input = screen.getByPlaceholderText(/Ask about this email/i);
      fireEvent.change(input, { target: { value: 'Test message' } });

      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('applies responsive classes to inbox', () => {
      const { container } = render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={jest.fn()}
          isLoading={false}
        />
      );

      const mainContainer = container.querySelector('.h-full.overflow-y-auto');
      expect(mainContainer).toBeInTheDocument();
    });

    it('has proper ARIA labels', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={jest.fn()}
          isLoading={false}
        />
      );

      const emailItems = screen.getAllByRole('button');
      expect(emailItems.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation in inbox', () => {
      const onEmailSelect = jest.fn();

      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={onEmailSelect}
          isLoading={false}
        />
      );

      const firstEmail = screen.getByText('Project Update').closest('div[role="button"]');

      // Test Enter key
      fireEvent.keyDown(firstEmail!, { key: 'Enter' });
      expect(onEmailSelect).toHaveBeenCalledWith('email-1');

      // Test Space key
      onEmailSelect.mockClear();
      fireEvent.keyDown(firstEmail!, { key: ' ' });
      expect(onEmailSelect).toHaveBeenCalledWith('email-1');
    });
  });
});
