/**
 * Drafts Page
 * View and manage saved email drafts
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import DraftEditor from '@/components/DraftEditor';
import type { Draft, UpdateDraftRequest } from '@/types';

export default function DraftsPage() {
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Fetch all drafts
  const {
    data: drafts = [],
    isLoading: draftsLoading,
    error: draftsError,
  } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => apiClient.drafts.getAllDrafts(),
  });

  // Update draft mutation
  const updateDraftMutation = useMutation({
    mutationFn: ({ draftId, request }: { draftId: string; request: UpdateDraftRequest }) =>
      apiClient.drafts.updateDraft(draftId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      showSuccess('Draft saved successfully!');
    },
    onError: (error: unknown) => {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: (draftId: string) => apiClient.drafts.deleteDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      showSuccess('Draft deleted successfully!');
      setSelectedDraftId(undefined);
    },
    onError: (error: unknown) => {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    },
  });

  const selectedDraft = drafts.find((d) => d.id === selectedDraftId);

  const handleSaveDraft = useCallback(
    async (request: UpdateDraftRequest) => {
      if (!selectedDraftId) return;
      await updateDraftMutation.mutateAsync({
        draftId: selectedDraftId,
        request,
      });
    },
    [selectedDraftId, updateDraftMutation]
  );

  const handleDiscardDraft = useCallback(() => {
    if (!selectedDraftId) return;
    if (confirm('Are you sure you want to delete this draft?')) {
      deleteDraftMutation.mutate(selectedDraftId);
    }
  }, [selectedDraftId, deleteDraftMutation]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
                  <h1 className="text-2xl font-bold text-gray-900">Saved Drafts</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    View and edit your saved email drafts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Left: Drafts List */}
            <div className="border-r border-gray-200 bg-white overflow-y-auto p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                All Drafts ({drafts.length})
              </h2>

              {draftsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : draftsError ? (
                <div className="text-center py-8 text-red-600">
                  Error loading drafts
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No drafts saved yet</p>
                  <p className="text-sm mt-2">Generate drafts from the main inbox</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => setSelectedDraftId(draft.id)}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          selectedDraftId === draft.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {draft.subject}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {draft.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Updated: {new Date(draft.updated_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Draft Editor */}
            <div className="lg:col-span-2 bg-white overflow-hidden">
              {selectedDraft ? (
                <DraftEditor
                  draft={selectedDraft}
                  onSave={handleSaveDraft}
                  onDiscard={handleDiscardDraft}
                  isLoading={updateDraftMutation.isPending || deleteDraftMutation.isPending}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg">Select a draft to edit</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
