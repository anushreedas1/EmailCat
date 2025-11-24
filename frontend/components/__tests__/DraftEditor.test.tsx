/**
 * Unit tests for DraftEditor component
 * 
 * Tests validate:
 * - Draft display with subject and body fields
 * - Real-time editing functionality
 * - Save and discard operations
 * - Auto-save functionality
 * - Suggested follow-ups display
 * - Last saved timestamp display
 * - Error handling
 * - Keyboard shortcuts
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DraftEditor from '../DraftEditor';
import type { Draft, UpdateDraftRequest } from '@/types';

// Mock draft data
const mockDraft: Draft = {
  id: 'draft-123',
  email_id: 'email-456',
  subject: 'Re: Project Update',
  body: 'Hi John,\n\nThank you for the update on the project.\n\nBest regards,\nSarah',
  suggested_follow_ups: [
    'Schedule a follow-up meeting',
    'Review resource allocation',
  ],
  created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
};

const mockDraftWithoutFollowUps: Draft = {
  id: 'draft-789',
  email_id: 'email-012',
  subject: 'Quick Reply',
  body: 'Thanks for reaching out!',
  suggested_follow_ups: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('DraftEditor Component', () => {
  const mockOnSave = jest.fn();
  const mockOnDiscard = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnDiscard.mockClear();
    jest.clearAllTimers();
  });

  describe('Draft Display', () => {
    it('displays draft subject and body in editable fields', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject') as HTMLInputElement;
      const bodyTextarea = screen.getByLabelText('Body') as HTMLTextAreaElement;

      expect(subjectInput.value).toBe(mockDraft.subject);
      expect(bodyTextarea.value).toBe(mockDraft.body);
    });

    it('displays suggested follow-ups when available', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText('Suggested Follow-ups')).toBeInTheDocument();
      expect(screen.getByText('Schedule a follow-up meeting')).toBeInTheDocument();
      expect(screen.getByText('Review resource allocation')).toBeInTheDocument();
    });

    it('does not display follow-ups section when not available', () => {
      render(
        <DraftEditor
          draft={mockDraftWithoutFollowUps}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.queryByText('Suggested Follow-ups')).not.toBeInTheDocument();
    });

    it('displays last saved timestamp', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
    });

    it('displays Draft Editor header', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText('Draft Editor')).toBeInTheDocument();
    });
  });

  describe('Real-time Editing', () => {
    it('updates subject field in real-time', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject') as HTMLInputElement;
      
      fireEvent.change(subjectInput, { target: { value: 'Updated Subject' } });
      
      expect(subjectInput.value).toBe('Updated Subject');
    });

    it('updates body field in real-time', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const bodyTextarea = screen.getByLabelText('Body') as HTMLTextAreaElement;
      
      fireEvent.change(bodyTextarea, { target: { value: 'Updated body content' } });
      
      expect(bodyTextarea.value).toBe('Updated body content');
    });

    it('shows unsaved changes indicator when content is modified', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified Subject' } });

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('enables save button when changes are made', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      expect(saveButton).toBeDisabled();

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified Subject' } });

      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Save Operation', () => {
    it('calls onSave with updated content when save button is clicked', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      const bodyTextarea = screen.getByLabelText('Body');

      fireEvent.change(subjectInput, { target: { value: 'New Subject' } });
      fireEvent.change(bodyTextarea, { target: { value: 'New Body' } });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          subject: 'New Subject',
          body: 'New Body',
          suggested_follow_ups: mockDraft.suggested_follow_ups,
        });
      });
    });

    it('displays saving indicator during save operation', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('displays success message after successful save', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });

    it('displays error message when save fails', async () => {
      mockOnSave.mockRejectedValue(new Error('Network error'));

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('disables save button when no changes are made', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Discard Operation', () => {
    it('calls onDiscard when discard button is clicked without changes', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const discardButton = screen.getByRole('button', { name: /Discard/i });
      fireEvent.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation dialog when discarding with unsaved changes', () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const discardButton = screen.getByRole('button', { name: /Discard/i });
      fireEvent.click(discardButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnDiscard).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('calls onDiscard when user confirms discard with changes', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      const discardButton = screen.getByRole('button', { name: /Discard/i });
      fireEvent.click(discardButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnDiscard).toHaveBeenCalledTimes(1);

      confirmSpy.mockRestore();
    });
  });

  describe('Auto-save Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('triggers auto-save after 30 seconds of inactivity', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('displays auto-save enabled message', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText('Auto-save enabled (every 30 seconds)')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('saves draft when Cmd+S is pressed', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      // Simulate Cmd+S
      fireEvent.keyDown(subjectInput, { key: 's', metaKey: true });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('saves draft when Ctrl+S is pressed', async () => {
      mockOnSave.mockResolvedValue(undefined);

      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      fireEvent.change(subjectInput, { target: { value: 'Modified' } });

      // Simulate Ctrl+S
      fireEvent.keyDown(subjectInput, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('disables inputs when isLoading is true', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          isLoading={true}
        />
      );

      const subjectInput = screen.getByLabelText('Subject') as HTMLInputElement;
      const bodyTextarea = screen.getByLabelText('Body') as HTMLTextAreaElement;

      expect(subjectInput).toBeDisabled();
      expect(bodyTextarea).toBeDisabled();
    });

    it('disables buttons when isLoading is true', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          isLoading={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Draft/i });
      const discardButton = screen.getByRole('button', { name: /Discard/i });

      expect(saveButton).toBeDisabled();
      expect(discardButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper label associations', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      const subjectInput = screen.getByLabelText('Subject');
      const bodyTextarea = screen.getByLabelText('Body');

      expect(subjectInput).toHaveAttribute('id', 'draft-subject');
      expect(bodyTextarea).toHaveAttribute('id', 'draft-body');
    });

    it('has proper button labels', () => {
      render(
        <DraftEditor
          draft={mockDraft}
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Discard/i })).toBeInTheDocument();
    });
  });
});
