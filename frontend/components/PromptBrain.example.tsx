/**
 * Example usage of PromptBrain component
 * 
 * This file demonstrates how to integrate the PromptBrain component
 * with the API client and state management.
 */

'use client';

import { useState, useEffect } from 'react';
import PromptBrain from './PromptBrain';
import { apiClient } from '@/lib/api/client';
import type { PromptConfig, UpdatePromptRequest } from '@/types';

export default function PromptBrainExample() {
  const [prompts, setPrompts] = useState<PromptConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.prompts.getPrompts();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError('Failed to load prompts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedPrompts: UpdatePromptRequest) => {
    try {
      const data = await apiClient.prompts.updatePrompts(updatedPrompts);
      setPrompts(data);
    } catch (err) {
      console.error('Failed to save prompts:', err);
      throw err; // Re-throw to let component handle the error
    }
  };

  const handleResetToDefaults = async () => {
    try {
      const defaults = await apiClient.prompts.getDefaultPrompts();
      const data = await apiClient.prompts.updatePrompts({
        categorization_prompt: defaults.categorization_prompt,
        action_item_prompt: defaults.action_item_prompt,
        auto_reply_prompt: defaults.auto_reply_prompt,
      });
      setPrompts(data);
    } catch (err) {
      console.error('Failed to reset prompts:', err);
      throw err; // Re-throw to let component handle the error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  if (error || !prompts) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load prompts'}</p>
          <button
            onClick={loadPrompts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PromptBrain
      prompts={prompts}
      onSave={handleSave}
      onResetToDefaults={handleResetToDefaults}
      isLoading={false}
    />
  );
}
