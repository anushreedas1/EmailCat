/**
 * DraftEditor Component Usage Example
 * Demonstrates how to use the DraftEditor component
 */

'use client';

import React, { useState } from 'react';
import DraftEditor from './DraftEditor';
import type { Draft, UpdateDraftRequest } from '@/types';
import { apiClient } from '@/lib/api/client';

// Pre-compute timestamps outside component to avoid impure function calls during render
const ONE_HOUR_AGO = new Date(Date.now() - 3600000).toISOString();
const THIRTY_MINS_AGO = new Date(Date.now() - 1800000).toISOString();

/**
 * Example: Basic DraftEditor usage
 */
export function BasicDraftEditorExample() {
  const [draft, setDraft] = useState<Draft>({
    id: 'draft-123',
    email_id: 'email-456',
    subject: 'Re: Project Update',
    body: 'Hi John,\n\nThank you for the update on the project. I appreciate the detailed breakdown of the milestones.\n\nI have a few questions:\n1. What is the timeline for Phase 2?\n2. Do we need additional resources?\n\nLooking forward to your response.\n\nBest regards,\nSarah',
    suggested_follow_ups: [
      'Schedule a follow-up meeting to discuss Phase 2 timeline',
      'Review resource allocation for the project',
    ],
    created_at: ONE_HOUR_AGO,
    updated_at: THIRTY_MINS_AGO,
  });

  const handleSave = async (updateRequest: UpdateDraftRequest) => {
    console.log('Saving draft:', updateRequest);
    
    try {
      // Call API to update draft
      const updatedDraft = await apiClient.drafts.updateDraft(draft.id, updateRequest);
      setDraft(updatedDraft);
      console.log('Draft saved successfully:', updatedDraft);
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error; // Re-throw to let component handle error display
    }
  };

  const handleDiscard = () => {
    console.log('Discarding draft');
    // In a real app, this would navigate away or close the editor
    alert('Draft discarded');
  };

  return (
    <div className="h-screen">
      <DraftEditor
        draft={draft}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

/**
 * Example: DraftEditor with loading state
 */
export function LoadingDraftEditorExample() {
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);

  // Simulate loading draft
  React.useEffect(() => {
    setTimeout(() => {
      setDraft({
        id: 'draft-789',
        email_id: 'email-012',
        subject: 'Re: Meeting Request',
        body: 'Hi Team,\n\nI would be happy to attend the meeting. Please send me the calendar invite.\n\nThanks!',
        suggested_follow_ups: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleSave = async (updateRequest: UpdateDraftRequest) => {
    if (!draft) return;
    
    const updatedDraft = await apiClient.drafts.updateDraft(draft.id, updateRequest);
    setDraft(updatedDraft);
  };

  const handleDiscard = () => {
    console.log('Draft discarded');
  };

  if (isLoading || !draft) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <DraftEditor
        draft={draft}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * Example: DraftEditor with minimal draft (no follow-ups)
 */
export function MinimalDraftEditorExample() {
  const draft: Draft = {
    id: 'draft-minimal',
    email_id: 'email-minimal',
    subject: 'Quick Reply',
    body: 'Thanks for reaching out!',
    suggested_follow_ups: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleSave = async (updateRequest: UpdateDraftRequest) => {
    console.log('Saving minimal draft:', updateRequest);
    await apiClient.drafts.updateDraft(draft.id, updateRequest);
  };

  const handleDiscard = () => {
    console.log('Minimal draft discarded');
  };

  return (
    <div className="h-screen">
      <DraftEditor
        draft={draft}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

/**
 * Example: DraftEditor in a modal/dialog
 */
export function ModalDraftEditorExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft] = useState<Draft>({
    id: 'draft-modal',
    email_id: 'email-modal',
    subject: 'Re: Question about the report',
    body: 'Hi,\n\nI have reviewed the report and it looks great. Just one minor suggestion on page 3.\n\nBest,\nAlex',
    suggested_follow_ups: ['Send the revised report by end of week'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const handleSave = async (updateRequest: UpdateDraftRequest) => {
    await apiClient.drafts.updateDraft(draft.id, updateRequest);
  };

  const handleDiscard = () => {
    setIsOpen(false);
  };

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Open Draft Editor
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden">
            <DraftEditor
              draft={draft}
              onSave={handleSave}
              onDiscard={handleDiscard}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Multiple drafts with switching
 */
export function MultipleDraftsExample() {
  const [drafts] = useState<Draft[]>([
    {
      id: 'draft-1',
      email_id: 'email-1',
      subject: 'Re: Budget Proposal',
      body: 'The budget looks reasonable. Let\'s discuss in our next meeting.',
      suggested_follow_ups: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'draft-2',
      email_id: 'email-2',
      subject: 'Re: Team Outing',
      body: 'Count me in! Looking forward to it.',
      suggested_follow_ups: ['Confirm attendance by Friday'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [currentDraftIndex, setCurrentDraftIndex] = useState(0);

  const handleSave = async (updateRequest: UpdateDraftRequest) => {
    const currentDraft = drafts[currentDraftIndex];
    await apiClient.drafts.updateDraft(currentDraft.id, updateRequest);
  };

  const handleDiscard = () => {
    console.log('Draft discarded');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Draft selector */}
      <div className="bg-gray-100 border-b border-gray-300 p-4">
        <div className="flex gap-2">
          {drafts.map((draft, index) => (
            <button
              key={draft.id}
              onClick={() => setCurrentDraftIndex(index)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  index === currentDraftIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Draft {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Draft editor */}
      <div className="flex-1">
        <DraftEditor
          draft={drafts[currentDraftIndex]}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      </div>
    </div>
  );
}
