/**
 * Main Application Page
 * Three-column layout with Inbox View, Prompt Brain Panel, and Email Agent Chat
 * 
 * Validates Requirements:
 * - 8.4: Clear separation between UI, backend services, and LLM integration
 * - 11.1: Clear list format with visual hierarchy
 * - 11.2: Organized, easy-to-understand layout
 * - 11.3: Smooth conversational interface
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/lib/toast';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { clearOldRecoveryDrafts } from '@/lib/draft-recovery';
import InboxView from '@/components/InboxView';
import EmailDetail from '@/components/EmailDetail';
import EmailAgent from '@/components/EmailAgent';
import DraftEditor from '@/components/DraftEditor';
import NavigationMenu from '@/components/NavigationMenu';
import type { ChatMessage, Draft, UpdateDraftRequest } from '@/types';

export default function Home() {
  // State management
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  
  const router = useRouter();

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // Clear old recovery drafts on mount
  useEffect(() => {
    clearOldRecoveryDrafts();
  }, []);

  // Fetch emails
  const {
    data: emails = [],
    isLoading: emailsLoading,
    error: emailsError,
  } = useQuery({
    queryKey: ['emails'],
    queryFn: () => apiClient.emails.getAllEmails(),
  });



  // Load inbox mutation
  const loadInboxMutation = useMutation({
    mutationFn: () => apiClient.emails.loadInbox(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      showSuccess(`Loaded ${data.count} emails successfully`);
    },
    onError: (error: unknown) => {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    },
  });



  // Update draft mutation
  const updateDraftMutation = useMutation({
    mutationFn: ({ draftId, request }: { draftId: string; request: UpdateDraftRequest }) =>
      apiClient.drafts.updateDraft(draftId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  // Get selected email
  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  // Handle email selection
  const handleEmailSelect = useCallback((emailId: string) => {
    setSelectedEmailId(emailId);
    setChatHistory([]);
    setShowDraftEditor(false);
  }, []);

  // Handle sending chat message
  const handleSendMessage = useCallback(
    async (message: string): Promise<string> => {
      // Add user message to history
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, userMessage]);

      try {
        // Call API with optional email_id
        const response = await apiClient.agent.chat({
          message,
          email_id: selectedEmailId, // Can be undefined for global queries
        });

        // Add assistant response to history
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, assistantMessage]);

        return response.response;
      } catch (error: unknown) {
        const message = getUserFriendlyErrorMessage(error);
        showError(message);
        throw error;
      }
    },
    [selectedEmailId, showError]
  );



  // Handle save draft
  const handleSaveDraft = useCallback(
    async (request: UpdateDraftRequest) => {
      if (!activeDraft) return;
      await updateDraftMutation.mutateAsync({
        draftId: activeDraft.id,
        request,
      });
    },
    [activeDraft, updateDraftMutation]
  );

  // Handle discard draft
  const handleDiscardDraft = useCallback(() => {
    setActiveDraft(null);
    setShowDraftEditor(false);
  }, []);

  // Handle load inbox
  const handleLoadInbox = useCallback(() => {
    loadInboxMutation.mutate();
  }, [loadInboxMutation]);

  // Process all emails mutation
  const processAllEmailsMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const email of emails) {
        try {
          const result = await apiClient.emails.processEmail(email.id, { use_llm: true });
          results.push(result);
        } catch (error) {
          console.error(`Failed to process email ${email.id}:`, error);
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      showSuccess('All emails processed successfully!');
    },
    onError: (error: unknown) => {
      const message = getUserFriendlyErrorMessage(error);
      showError(message);
    },
  });

  // Handle process all emails
  const handleProcessAllEmails = useCallback(() => {
    if (emails.length === 0) {
      showError('No emails to process. Load inbox first.');
      return;
    }
    processAllEmailsMutation.mutate();
  }, [emails, processAllEmailsMutation, showError]);



  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="shrink-0 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <NavigationMenu />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Email Productivity Agent
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    AI-powered email management and drafting
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadInbox}
                  disabled={loadInboxMutation.isPending}
                  className="
                    px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                    hover:bg-blue-700 transition-colors
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {loadInboxMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Load Inbox
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleProcessAllEmails}
                  disabled={processAllEmailsMutation.isPending || emails.length === 0}
                  className="
                    px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                    hover:bg-green-700 transition-colors
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                  title="Categorize all emails and extract action items using AI"
                >
                  {processAllEmailsMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      Process All Emails
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        </header>



        {/* Main content - Three column layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Left column: Inbox View */}
            <div className="border-r border-gray-200 bg-white overflow-hidden">
              <InboxView
                emails={emails}
                onEmailSelect={handleEmailSelect}
                selectedEmailId={selectedEmailId}
                isLoading={emailsLoading}
                error={emailsError ? String(emailsError) : undefined}
              />
            </div>

            {/* Middle column: Email Detail View */}
            <div className="border-r border-gray-200 bg-white overflow-hidden">
              {showDraftEditor && activeDraft ? (
                <DraftEditor
                  draft={activeDraft}
                  onSave={handleSaveDraft}
                  onDiscard={handleDiscardDraft}
                  isLoading={updateDraftMutation.isPending}
                />
              ) : (
                <EmailDetail email={selectedEmail} />
              )}
            </div>

            {/* Right column: Email Agent Chat */}
            <div className="bg-white overflow-hidden">
              <EmailAgent
                selectedEmail={selectedEmail}
                allEmails={emails}
                onSendMessage={handleSendMessage}
                chatHistory={chatHistory}
              />
            </div>
          </div>
        </div>

        {/* Mobile responsive message */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <p className="text-sm text-center">
            For the best experience, please use a larger screen
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
