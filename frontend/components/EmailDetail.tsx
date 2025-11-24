/**
 * EmailDetail Component
 * Gmail-style email detail view showing full email content
 */

'use client';

import React from 'react';
import type { Email } from '@/types';

export interface EmailDetailProps {
  email?: Email;
}

/**
 * Get color classes for category badges
 */
function getCategoryColor(category: string): string {
  switch (category) {
    case 'Important':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'To-Do':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Newsletter':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Spam':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Uncategorized':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return timestamp;
  }
}

/**
 * Empty state when no email is selected
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <svg
        className="w-20 h-20 text-gray-300 mb-4"
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">No email selected</h3>
      <p className="text-sm text-gray-500">
        Select an email from the inbox to view its details
      </p>
    </div>
  );
}

/**
 * EmailDetail Component
 * Displays full email content in Gmail-style layout
 */
export default function EmailDetail({ email }: EmailDetailProps) {
  if (!email) {
    return (
      <div className="h-full bg-white">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-semibold text-gray-900 flex-1 pr-4">
            {email.subject}
          </h1>
          {email.category && (
            <span
              className={`
                shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                ${getCategoryColor(email.category)}
              `}
            >
              {email.category}
            </span>
          )}
        </div>

        {/* Sender info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {email.sender.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{email.sender}</span>
            </div>
            <div className="text-sm text-gray-500">
              {formatTimestamp(email.timestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">
            {email.body}
          </div>
        </div>

        {/* Action Items Section */}
        {email.action_items && email.action_items.length > 0 && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-amber-600"
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
              <h3 className="text-sm font-semibold text-gray-900">
                Action Items ({email.action_items.length})
              </h3>
            </div>
            <ul className="space-y-2">
              {email.action_items.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 mt-0.5 rounded border-2 border-amber-400"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{item.task}</p>
                    {item.deadline && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Due:</span> {item.deadline}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            className="
              px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
              hover:bg-blue-700 transition-colors
              flex items-center gap-2
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Reply
          </button>
          <button
            className="
              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg
              hover:bg-gray-50 transition-colors
              flex items-center gap-2
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Forward
          </button>
          <button
            className="
              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg
              hover:bg-gray-50 transition-colors
              flex items-center gap-2
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
