/**
 * Inbox Page
 * Demo page showcasing the InboxView component
 */

'use client';

import React, { useState, useEffect } from 'react';
import InboxView from '@/components/InboxView';
import { apiClient } from '@/lib/api/client';
import type { Email } from '@/types';

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load emails on mount
  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const emailList = await apiClient.emails.getAllEmails();
      setEmails(emailList);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load emails');
      console.error('Error loading emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadInbox = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.emails.loadInbox();
      setEmails(response.emails);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load inbox');
      console.error('Error loading inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Email Productivity Agent
          </h1>
          <button
            onClick={handleLoadInbox}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load Mock Inbox'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Inbox View - Left Panel */}
        <div className="w-1/3 border-r border-gray-200 bg-white">
          <InboxView
            emails={emails}
            onEmailSelect={handleEmailSelect}
            selectedEmailId={selectedEmailId}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Email Detail - Right Panel */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          {selectedEmail ? (
            <div>
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedEmail.subject}
                    </h2>
                    <p className="text-sm text-gray-600">
                      From: <span className="font-medium">{selectedEmail.sender}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {selectedEmail.category && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedEmail.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedEmail.body}
                </div>
              </div>

              {selectedEmail.action_items && selectedEmail.action_items.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {selectedEmail.action_items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-yellow-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-900">{item.task}</p>
                          {item.deadline && (
                            <p className="text-xs text-gray-500">
                              Due: {item.deadline}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg">Select an email to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
