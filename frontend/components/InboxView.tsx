/**
 * InboxView Component
 * Displays list of emails with metadata and category tags
 * 
 * Validates Requirements:
 * - 1.2: Display emails with sender, subject, timestamp
 * - 3.3: Display category tag in email list view
 * - 11.1: Clear list format with visual hierarchy
 * - 11.4: Distinct visual indicators for each category tag
 * - 11.5: Immediate visual feedback for loading states
 * - 9.1: Display user-friendly error messages
 */

'use client';

import React from 'react';
import { LoadingList, EmptyState as EmptyStateComponent, ErrorState as ErrorStateComponent } from './LoadingStates';
import type { Email, CategoryTag } from '@/types';

export interface InboxViewProps {
  emails: Email[];
  onEmailSelect: (emailId: string) => void;
  selectedEmailId?: string;
  isLoading: boolean;
  error?: string | null;
}

/**
 * Get color classes for category badges
 * Validates: Requirements 11.4 - Distinct visual indicators for each category
 */
function getCategoryColor(category: CategoryTag | null): string {
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch (error) {
    return timestamp;
  }
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}



/**
 * Email list item component
 */
interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}

function EmailItem({ email, isSelected, onClick }: EmailItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-150
        hover:shadow-md hover:border-gray-300
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-gray-200 bg-white'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Email from ${email.sender}: ${email.subject}`}
    >
      {/* Header: Sender and Timestamp */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {email.sender}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {email.category && (
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                ${getCategoryColor(email.category)}
              `}
            >
              {email.category}
            </span>
          )}
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatTimestamp(email.timestamp)}
          </span>
        </div>
      </div>

      {/* Subject */}
      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
        {email.subject}
      </h3>

      {/* Body Preview */}
      <p className="text-sm text-gray-600 line-clamp-2">
        {truncateText(email.body, 150)}
      </p>

      {/* Action Items Badge */}
      {email.action_items && email.action_items.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <svg
            className="w-4 h-4"
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
          <span>{email.action_items.length} action item{email.action_items.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

/**
 * InboxView Component
 * Main component for displaying email list
 * 
 * Validates Requirements:
 * - 1.2: Display emails with sender, subject, timestamp
 * - 3.3: Display category tag in email list view
 * - 11.1: Clear list format with visual hierarchy
 * - 11.5: Immediate visual feedback for loading states
 */
export default function InboxView({
  emails,
  onEmailSelect,
  selectedEmailId,
  isLoading,
  error,
}: InboxViewProps) {
  const [sortBy, setSortBy] = React.useState<'date' | 'sender' | 'category'>('date');
  const [filterCategory, setFilterCategory] = React.useState<CategoryTag | 'all'>('all');

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <LoadingList count={5} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <ErrorStateComponent
          title="Error loading emails"
          message={error}
        />
      </div>
    );
  }

  // Empty state
  if (!emails || emails.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <EmptyStateComponent
          icon={
            <svg
              className="w-16 h-16"
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
          }
          title="No emails"
          description="Load your inbox to get started"
        />
      </div>
    );
  }

  // Filter emails by category
  const filteredEmails = filterCategory === 'all' 
    ? emails 
    : emails.filter(email => email.category === filterCategory);

  // Define category priority for sorting (lower number = higher priority)
  const getCategoryPriority = (category: string | null): number => {
    const priorities: Record<string, number> = {
      'Important': 1,
      'To-Do': 2,
      'Newsletter': 3,
      'Uncategorized': 4,
      'Spam': 5,
    };
    return priorities[category || 'Uncategorized'] || 4;
  };

  // Sort emails
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'sender':
        return a.sender.localeCompare(b.sender);
      case 'category':
        // Sort by priority, then alphabetically within same priority
        const priorityDiff = getCategoryPriority(a.category) - getCategoryPriority(b.category);
        if (priorityDiff !== 0) return priorityDiff;
        return (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized');
      default:
        return 0;
    }
  });

  // Email list
  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="shrink-0 p-4 border-b border-gray-200">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Inbox
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''})
            </span>
          </h2>
        </div>
        
        {/* Sort and Filter Controls */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'sender' | 'category')}
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="sender">Sort by Sender</option>
            <option value="category">Sort by Category</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as CategoryTag | 'all')}
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Important">Important</option>
            <option value="To-Do">To-Do</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Spam">Spam</option>
            <option value="Uncategorized">Uncategorized</option>
          </select>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {sortedEmails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              isSelected={email.id === selectedEmailId}
              onClick={() => onEmailSelect(email.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
