/**
 * DraftEditor Component
 * Display and edit generated email drafts
 * 
 * Validates Requirements:
 * - 6.4: Display draft content with edit capabilities
 * - 7.1: Real-time editing with state management
 * - 7.2: Save edited drafts to backend storage
 * - 7.3: Display most recent version with all edits preserved
 * - 9.1: Display user-friendly error messages
 * - 11.5: Provide immediate visual feedback
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/lib/toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { LoadingButton } from './LoadingStates';
import ConfirmDialog from './ConfirmDialog';
import {
  saveDraftToLocalStorage,
  removeDraftFromLocalStorage,
  autoSaveDraft,
  getAutoSavedDraft,
  clearAutoSavedDraft,
  hasNewerLocalVersion,
} from '@/lib/draft-recovery';
import type { Draft, UpdateDraftRequest } from '@/types';

export interface DraftEditorProps {
  draft: Draft;
  onSave: (draft: UpdateDraftRequest) => Promise<void>;
  onDiscard: () => void;
  isLoading?: boolean;
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 10) {
      return 'Just now';
    } else if (diffSecs < 60) {
      return `${diffSecs} seconds ago`;
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch (error) {
    return timestamp;
  }
}

/**
 * DraftEditor Component
 * Main component for editing email drafts
 * 
 * Validates Requirements:
 * - 6.4: Display draft content with edit capabilities
 * - 7.1: Real-time editing with state management
 * - 7.2: Save edited drafts to backend storage
 * - 7.3: Display most recent version with all edits preserved
 */
export default function DraftEditor({
  draft,
  onSave,
  onDiscard,
  isLoading = false,
}: DraftEditorProps) {
  // Local state for editing
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(draft.updated_at);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredContent, setRecoveredContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { showSuccess, showError, showInfo } = useToast();

  // Check for local storage recovery on mount
  useEffect(() => {
    const localData = getAutoSavedDraft(draft.id);
    if (localData && hasNewerLocalVersion(draft.id, draft.updated_at)) {
      setRecoveredContent({
        subject: localData.subject,
        body: localData.body,
      });
      setShowRecoveryPrompt(true);
    }
  }, [draft.id, draft.updated_at]);

  // Track if content has changed from original
  useEffect(() => {
    const hasChanges = subject !== draft.subject || body !== draft.body;
    setHasUnsavedChanges(hasChanges);
    
    // Auto-save to local storage when content changes
    if (hasChanges) {
      autoSaveDraft(draft.id, subject, body);
    }
  }, [subject, body, draft.subject, draft.body, draft.id]);

  // Auto-save functionality (every 30 seconds)
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for 30 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true); // true indicates auto-save
      }, 30000);
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, isSaving, subject, body]);

  // Update local state when draft prop changes
  useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
    setLastSaved(draft.updated_at);
    setHasUnsavedChanges(false);
  }, [draft.id]); // Only reset when draft ID changes

  // Auto-resize textarea
  useEffect(() => {
    if (bodyTextareaRef.current) {
      bodyTextareaRef.current.style.height = 'auto';
      bodyTextareaRef.current.style.height = `${bodyTextareaRef.current.scrollHeight}px`;
    }
  }, [body]);

  /**
   * Handle save operation
   */
  const handleSave = async (isAutoSave = false) => {
    if (isSaving || !hasUnsavedChanges) return;

    setIsSaving(true);

    // Save to local storage as backup before attempting server save
    saveDraftToLocalStorage(draft.id, subject, body);

    try {
      const updateRequest: UpdateDraftRequest = {
        subject,
        body,
        suggested_follow_ups: draft.suggested_follow_ups,
      };

      await onSave(updateRequest);
      
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      
      // Clear local storage after successful save
      clearAutoSavedDraft(draft.id);
      removeDraftFromLocalStorage(draft.id);
      
      // Show success message only for manual saves
      if (!isAutoSave) {
        showSuccess('Draft saved successfully!');
      }
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
      showInfo('Your changes are saved locally and will be recovered.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle discard operation with confirmation
   */
  const handleDiscard = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      confirmDiscard();
    }
  };

  /**
   * Confirm discard action
   */
  const confirmDiscard = () => {
    // Clear local storage
    clearAutoSavedDraft(draft.id);
    removeDraftFromLocalStorage(draft.id);
    setShowDiscardConfirm(false);
    onDiscard();
  };

  /**
   * Handle recovery of local content
   */
  const handleRecoverContent = () => {
    if (recoveredContent) {
      setSubject(recoveredContent.subject);
      setBody(recoveredContent.body);
      setShowRecoveryPrompt(false);
      showInfo('Draft content recovered from local storage');
    }
  };

  /**
   * Dismiss recovery prompt
   */
  const handleDismissRecovery = () => {
    clearAutoSavedDraft(draft.id);
    setShowRecoveryPrompt(false);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard Draft?"
        message="You have unsaved changes. Are you sure you want to discard this draft? This action cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="danger"
        onConfirm={confirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Recovery Prompt Dialog */}
      <ConfirmDialog
        isOpen={showRecoveryPrompt}
        title="Recover Draft?"
        message="We found a more recent version of this draft saved locally. Would you like to recover it?"
        confirmLabel="Recover"
        cancelLabel="Dismiss"
        variant="info"
        onConfirm={handleRecoverContent}
        onCancel={handleDismissRecovery}
      />

      <div className="h-full flex flex-col bg-white" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Draft Editor</h2>
          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            {isSaving && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
          </div>
        </div>
        
        {/* Last saved timestamp */}
        {lastSaved && (
          <p className="text-xs text-gray-500">
            Last saved: {formatTimestamp(lastSaved)}
          </p>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Subject field */}
          <div>
            <label
              htmlFor="draft-subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject
            </label>
            <input
              id="draft-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading || isSaving}
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-sm
              "
              placeholder="Email subject..."
            />
          </div>

          {/* Body field */}
          <div>
            <label
              htmlFor="draft-body"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Body
            </label>
            <textarea
              id="draft-body"
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isLoading || isSaving}
              rows={12}
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-sm font-mono
              "
              placeholder="Email body..."
              style={{ minHeight: '300px' }}
            />
          </div>

          {/* Suggested follow-ups */}
          {draft.suggested_follow_ups && draft.suggested_follow_ups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Follow-ups
              </label>
              <div className="space-y-2">
                {draft.suggested_follow_ups.map((followUp, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <p className="text-sm text-gray-700">{followUp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="shrink-0 border-t border-gray-200 p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Auto-save enabled (every 30 seconds)
          </div>
          <div className="flex items-center gap-2">
            <LoadingButton
              onClick={handleDiscard}
              disabled={isLoading || isSaving}
              isLoading={false}
              variant="secondary"
            >
              Discard
            </LoadingButton>
            <LoadingButton
              onClick={() => handleSave()}
              disabled={!hasUnsavedChanges || isLoading}
              isLoading={isSaving}
              variant="primary"
            >
              Save Draft
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
