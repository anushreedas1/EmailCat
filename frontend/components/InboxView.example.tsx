/**
 * Example usage of InboxView component
 * This file demonstrates how to use the InboxView component with mock data
 */

import React, { useState } from 'react';
import InboxView from './InboxView';
import type { Email } from '@/types';

// Mock email data for demonstration
const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'john.doe@company.com',
    subject: 'Q4 Planning Meeting',
    body: 'Hi team, let\'s schedule our Q4 planning meeting for next week. Please send your availability for Tuesday or Wednesday afternoon. We need to discuss budget allocation and project priorities.',
    timestamp: new Date().toISOString(),
    category: 'Important',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [
      {
        id: 'a1',
        email_id: '1',
        task: 'Send availability for Q4 meeting',
        deadline: '2024-01-20',
        completed: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '2',
    sender: 'newsletter@techblog.com',
    subject: 'Weekly Tech Digest - AI Breakthroughs',
    body: 'This week\'s top stories in technology: New AI models, quantum computing advances, and the latest in web development frameworks.',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    category: 'Newsletter',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
  {
    id: '3',
    sender: 'sarah.johnson@client.com',
    subject: 'Project Proposal Review',
    body: 'Could you please review the attached project proposal and provide feedback by end of week? We need to finalize the scope before presenting to stakeholders.',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    category: 'To-Do',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [
      {
        id: 'a2',
        email_id: '3',
        task: 'Review project proposal',
        deadline: '2024-01-19',
        completed: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'a3',
        email_id: '3',
        task: 'Provide feedback',
        deadline: '2024-01-19',
        completed: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '4',
    sender: 'spam@suspicious.com',
    subject: 'You won a prize! Click here now!!!',
    body: 'Congratulations! You have been selected as a winner. Click this link immediately to claim your prize of $1,000,000.',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    category: 'Spam',
    processed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
  {
    id: '5',
    sender: 'team@company.com',
    subject: 'Team Lunch Next Friday',
    body: 'Hey everyone! Let\'s do a team lunch next Friday at 12:30 PM. Please let me know if you can make it.',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    category: null,
    processed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items: [],
  },
];

/**
 * Example 1: Basic usage with mock data
 */
export function BasicExample() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();

  return (
    <div className="h-screen">
      <InboxView
        emails={mockEmails}
        onEmailSelect={setSelectedEmailId}
        selectedEmailId={selectedEmailId}
        isLoading={false}
      />
    </div>
  );
}

/**
 * Example 2: Loading state
 */
export function LoadingExample() {
  return (
    <div className="h-screen">
      <InboxView
        emails={[]}
        onEmailSelect={() => {}}
        isLoading={true}
      />
    </div>
  );
}

/**
 * Example 3: Error state
 */
export function ErrorExample() {
  return (
    <div className="h-screen">
      <InboxView
        emails={[]}
        onEmailSelect={() => {}}
        isLoading={false}
        error="Failed to load emails. Please check your connection."
      />
    </div>
  );
}

/**
 * Example 4: Empty state
 */
export function EmptyExample() {
  return (
    <div className="h-screen">
      <InboxView
        emails={[]}
        onEmailSelect={() => {}}
        isLoading={false}
      />
    </div>
  );
}

/**
 * Example 5: With email selection handler
 */
export function InteractiveExample() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const [emails] = useState(mockEmails);

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
    console.log('Selected email:', emailId);
    
    // Find and log the selected email
    const email = emails.find(e => e.id === emailId);
    if (email) {
      console.log('Email details:', {
        sender: email.sender,
        subject: email.subject,
        category: email.category,
        actionItems: email.action_items.length,
      });
    }
  };

  return (
    <div className="h-screen">
      <InboxView
        emails={emails}
        onEmailSelect={handleEmailSelect}
        selectedEmailId={selectedEmailId}
        isLoading={false}
      />
    </div>
  );
}

/**
 * Example 6: Filtered emails (only Important)
 */
export function FilteredExample() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const importantEmails = mockEmails.filter(e => e.category === 'Important');

  return (
    <div className="h-screen">
      <InboxView
        emails={importantEmails}
        onEmailSelect={setSelectedEmailId}
        selectedEmailId={selectedEmailId}
        isLoading={false}
      />
    </div>
  );
}
