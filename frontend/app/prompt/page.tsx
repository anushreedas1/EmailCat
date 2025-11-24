/**
 * Prompt Configuration Page
 * Dedicated page for configuring AI prompts
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PromptBrain from '@/components/PromptBrain';
import type { UpdatePromptRequest } from '@/types';

export default function PromptPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch prompts
  const {
    data: prompts,
    isLoading: promptsLoading,
  } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => apiClient.prompts.getPrompts(),
  });

  // Update prompts mutation
  const updatePromptsMutation = useMutation({
    mutationFn: (request: UpdatePromptRequest) => apiClient.prompts.updatePrompts(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  // Reset to defaults mutation
  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const defaults = await apiClient.prompts.getDefaultPrompts();
      return apiClient.prompts.updatePrompts({
        categorization_prompt: defaults.categorization_prompt,
        action_item_prompt: defaults.action_item_prompt,
        auto_reply_prompt: defaults.auto_reply_prompt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  // Handle save prompts
  const handleSavePrompts = useCallback(
    async (request: UpdatePromptRequest) => {
      await updatePromptsMutation.mutateAsync(request);
    },
    [updatePromptsMutation]
  );

  // Handle reset to defaults
  const handleResetToDefaults = useCallback(async () => {
    await resetToDefaultsMutation.mutateAsync();
  }, [resetToDefaultsMutation]);

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToHome}
                  className="
                    p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                    rounded-lg transition-colors
                  "
                  title="Back to Home"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Prompt Configuration
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure how the AI processes and responds to your emails
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto">
            {prompts ? (
              <PromptBrain
                prompts={prompts}
                onSave={handleSavePrompts}
                onResetToDefaults={handleResetToDefaults}
                isLoading={promptsLoading || updatePromptsMutation.isPending}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
