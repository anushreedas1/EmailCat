/**
 * PromptBrain Component
 * 
 * Allows users to configure and save prompt templates for LLM behavior.
 * Provides multi-line text inputs for categorization, action item, and auto-reply prompts.
 * 
 * Validates Requirements:
 * - 2.1: Display input fields for categorization, action item, and auto-reply prompts
 * - 2.2: Persist prompts to backend storage
 * - 2.3: Update stored prompts and apply changes
 * - 2.4: Provide default prompt templates
 * - 11.2: Organized, easy-to-understand layout
 * - 9.1: Display user-friendly error messages
 * - 11.5: Provide immediate visual feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import type { PromptConfig, UpdatePromptRequest } from '@/types';

export interface PromptBrainProps {
  prompts: PromptConfig;
  onSave: (prompts: UpdatePromptRequest) => Promise<void>;
  onResetToDefaults: () => Promise<void>;
  isLoading: boolean;
}

export default function PromptBrain({
  prompts,
  onSave,
  onResetToDefaults,
  isLoading,
}: PromptBrainProps) {
  // Local state for form inputs
  const [categorizationPrompt, setCategorizationPrompt] = useState(prompts.categorization_prompt);
  const [actionItemPrompt, setActionItemPrompt] = useState(prompts.action_item_prompt);
  const [autoReplyPrompt, setAutoReplyPrompt] = useState(prompts.auto_reply_prompt);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { showSuccess, showError } = useToast();

  // Update local state when prompts prop changes
  useEffect(() => {
    setCategorizationPrompt(prompts.categorization_prompt);
    setActionItemPrompt(prompts.action_item_prompt);
    setAutoReplyPrompt(prompts.auto_reply_prompt);
    setHasChanges(false);
  }, [prompts]);

  // Track changes
  useEffect(() => {
    const changed =
      categorizationPrompt !== prompts.categorization_prompt ||
      actionItemPrompt !== prompts.action_item_prompt ||
      autoReplyPrompt !== prompts.auto_reply_prompt;
    setHasChanges(changed);
  }, [categorizationPrompt, actionItemPrompt, autoReplyPrompt, prompts]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        categorization_prompt: categorizationPrompt,
        action_item_prompt: actionItemPrompt,
        auto_reply_prompt: autoReplyPrompt,
      });
      showSuccess('Prompts saved successfully!');
      setHasChanges(false);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all prompts to defaults? This will discard any unsaved changes.')) {
      return;
    }

    setIsSaving(true);
    try {
      await onResetToDefaults();
      showSuccess('Prompts reset to defaults!');
      setHasChanges(false);
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Prompt Brain</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure how the AI processes your emails
        </p>
      </div>



      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Categorization Prompt */}
        <div>
          <label
            htmlFor="categorization-prompt"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Categorization Prompt
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Guides how emails are categorized (Important, Newsletter, Spam, To-Do)
          </p>
          <textarea
            id="categorization-prompt"
            value={categorizationPrompt}
            onChange={(e) => setCategorizationPrompt(e.target.value)}
            disabled={isLoading || isSaving}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-mono text-gray-900"
            placeholder="Enter categorization prompt..."
          />
        </div>

        {/* Action Item Prompt */}
        <div>
          <label
            htmlFor="action-item-prompt"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Action Item Extraction Prompt
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Guides how tasks and action items are extracted from emails
          </p>
          <textarea
            id="action-item-prompt"
            value={actionItemPrompt}
            onChange={(e) => setActionItemPrompt(e.target.value)}
            disabled={isLoading || isSaving}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-mono text-gray-900"
            placeholder="Enter action item extraction prompt..."
          />
        </div>

        {/* Auto-Reply Prompt */}
        <div>
          <label
            htmlFor="auto-reply-prompt"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Auto-Reply Draft Prompt
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Guides how email reply drafts are generated
          </p>
          <textarea
            id="auto-reply-prompt"
            value={autoReplyPrompt}
            onChange={(e) => setAutoReplyPrompt(e.target.value)}
            disabled={isLoading || isSaving}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-mono text-gray-900"
            placeholder="Enter auto-reply draft prompt..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            disabled={isLoading || isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving || !hasChanges}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
        
        {hasChanges && !isSaving && (
          <p className="mt-2 text-xs text-gray-600">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}
