/**
 * Unit tests for InboxView component
 * 
 * Tests validate:
 * - Email display with required fields (sender, subject, timestamp)
 * - Category badge display with color coding
 * - Email selection functionality
 * - Loading states
 * - Error handling
 * - Empty state
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InboxView from '../InboxView';
import type { Email } from '@/types';

// Mock email data
const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'john.doe@example.com',
    subject: 'Q4 Planning Meeting',
    body: 'Hi team, let\'s schedule our Q4 planning meeting for next week.',
    timestamp: new Date().toISOString(),
    category: 'Important',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [
      {
        id: 'a1',
        email_id: '1',
        task: 'Schedule Q4 meeting',
        deadline: '2024-01-20',
        completed: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '2',
    sender: 'newsletter@techblog.com',
    subject: 'Weekly Tech Digest',
    body: 'This week\'s top stories in technology...',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    category: 'Newsletter',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
  {
    id: '3',
    sender: 'spam@suspicious.com',
    subject: 'You won a prize!',
    body: 'Click here to claim your prize...',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    category: 'Spam',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
];

describe('InboxView Component', () => {
  const mockOnEmailSelect = jest.fn();

  beforeEach(() => {
    mockOnEmailSelect.mockClear();
  });

  describe('Email Display', () => {
    it('displays email list with required fields', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      // Check that sender is displayed
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('newsletter@techblog.com')).toBeInTheDocument();

      // Check that subject is displayed
      expect(screen.getByText('Q4 Planning Meeting')).toBeInTheDocument();
      expect(screen.getByText('Weekly Tech Digest')).toBeInTheDocument();

      // Check that timestamps are displayed (in relative format)
      expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
    });

    it('displays category badges with correct colors', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      // Check that category badges are displayed
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
      expect(screen.getByText('Spam')).toBeInTheDocument();

      // Check that badges have correct color classes
      const importantBadge = screen.getByText('Important');
      expect(importantBadge).toHaveClass('bg-red-100', 'text-red-800');

      const newsletterBadge = screen.getByText('Newsletter');
      expect(newsletterBadge).toHaveClass('bg-purple-100', 'text-purple-800');

      const spamBadge = screen.getByText('Spam');
      expect(spamBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('displays action items count when present', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      expect(screen.getByText('1 action item')).toBeInTheDocument();
    });

    it('displays email count in header', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      expect(screen.getByText(/3 emails/)).toBeInTheDocument();
    });
  });

  describe('Email Selection', () => {
    it('calls onEmailSelect when email is clicked', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      const firstEmail = screen.getByText('Q4 Planning Meeting').closest('div[role="button"]');
      fireEvent.click(firstEmail!);

      expect(mockOnEmailSelect).toHaveBeenCalledWith('1');
      expect(mockOnEmailSelect).toHaveBeenCalledTimes(1);
    });

    it('highlights selected email', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          selectedEmailId="2"
          isLoading={false}
        />
      );

      const selectedEmail = screen.getByText('Weekly Tech Digest').closest('div[role="button"]');
      expect(selectedEmail).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('supports keyboard navigation', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      const firstEmail = screen.getByText('Q4 Planning Meeting').closest('div[role="button"]');
      
      // Test Enter key
      fireEvent.keyDown(firstEmail!, { key: 'Enter' });
      expect(mockOnEmailSelect).toHaveBeenCalledWith('1');

      // Test Space key
      mockOnEmailSelect.mockClear();
      fireEvent.keyDown(firstEmail!, { key: ' ' });
      expect(mockOnEmailSelect).toHaveBeenCalledWith('1');
    });
  });

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(
        <InboxView
          emails={[]}
          onEmailSelect={mockOnEmailSelect}
          isLoading={true}
        />
      );

      // Check for loading skeleton (animated elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not display emails when loading', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={true}
        />
      );

      expect(screen.queryByText('Q4 Planning Meeting')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to load emails';
      render(
        <InboxView
          emails={[]}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('Error loading emails')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display emails when error is present', () => {
      render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
          error="Some error"
        />
      );

      expect(screen.queryByText('Q4 Planning Meeting')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no emails', () => {
      render(
        <InboxView
          emails={[]}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      expect(screen.getByText('No emails')).toBeInTheDocument();
      expect(screen.getByText('Load your inbox to get started')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('truncates long email bodies', () => {
      const longBodyEmail: Email = {
        ...mockEmails[0],
        body: 'A'.repeat(200), // Very long body
      };

      render(
        <InboxView
          emails={[longBodyEmail]}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      const bodyText = screen.getByText(/A+\.\.\./);
      expect(bodyText.textContent?.length).toBeLessThan(200);
    });

    it('applies proper styling classes for responsive design', () => {
      const { container } = render(
        <InboxView
          emails={mockEmails}
          onEmailSelect={mockOnEmailSelect}
          isLoading={false}
        />
      );

      // Check for responsive container classes
      const mainContainer = container.querySelector('.h-full.overflow-y-auto');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
