/**
 * EmailAgent Component
 * Provides conversational interface for inbox queries
 * 
 * Validates Requirements:
 * - 5.1: Enable Email Agent chat interface for selected email
 * - 5.2: Send query, email content, and prompts to LLM
 * - 5.3: Display LLM response in chat interface
 * - 5.4: Handle special queries (summarize, tasks, urgent emails)
 * - 11.3: Smooth conversational interface with clear message threading
 * - 9.1: Display user-friendly error messages
 * - 11.5: Provide immediate visual feedback
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Spinner } from './LoadingStates';
import type { Email, ChatMessage } from '@/types';

export interface EmailAgentProps {
  selectedEmail?: Email;
  allEmails?: Email[];
  onSendMessage: (message: string) => Promise<string>;
  chatHistory: ChatMessage[];
  isLoading?: boolean;
}

/**
 * Suggested queries for quick actions
 */
const SUGGESTED_QUERIES_WITH_EMAIL = [
  'Summarize this email',
  'What are the action items from this email?',
  'Draft a reply to this email',
  'Is this email important?',
];

const SUGGESTED_QUERIES_GLOBAL = [
  'Do I have any important emails?',
  'What tasks do I need to do?',
  'Show me all urgent emails',
  'Summarize my inbox',
];

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return timestamp;
  }
}

/**
 * Loading indicator component
 */
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg max-w-[80px]">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

/**
 * Chat message component
 */
interface ChatMessageItemProps {
  message: ChatMessage;
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isUser ? 'bg-blue-500 ml-2' : 'bg-gray-300 mr-2'}
          `}
        >
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          )}
        </div>

        {/* Message bubble */}
        <div className="flex flex-col">
          <div
            className={`
              rounded-lg px-4 py-2 shadow-sm
              ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}
            `}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ selectedEmail, hasEmails }: { selectedEmail?: Email; hasEmails: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <svg
        className="w-16 h-16 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Email Agent</h3>
      <p className="text-sm text-gray-500 mb-4">
        {selectedEmail
          ? 'Ask me anything about this email'
          : hasEmails
          ? 'Ask me about your inbox or select an email'
          : 'Load your inbox to get started'}
      </p>
      {selectedEmail && (
        <div className="text-xs text-gray-400">
          Selected: {selectedEmail.subject}
        </div>
      )}
    </div>
  );
}

/**
 * EmailAgent Component
 * Main component for chat interface
 * 
 * Validates Requirements:
 * - 5.1: Enable Email Agent chat interface for selected email
 * - 5.2: Send query, email content, and prompts to LLM
 * - 5.3: Display LLM response in chat interface
 * - 11.3: Smooth conversational interface with clear message threading
 */
export default function EmailAgent({
  selectedEmail,
  allEmails = [],
  onSendMessage,
  chatHistory,
  isLoading = false,
}: EmailAgentProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedEmail]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isSending) return;

    const trimmedMessage = messageText.trim();
    setMessage('');
    setIsSending(true);

    try {
      await onSendMessage(trimmedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling is done in parent component
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(message);
  };

  /**
   * Handle suggested query click
   */
  const handleSuggestedQuery = (query: string) => {
    handleSendMessage(query);
  };

  /**
   * Handle textarea key down
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Email Agent</h2>
        {selectedEmail && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            Context: {selectedEmail.subject}
          </p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {chatHistory.length === 0 ? (
          <EmptyState selectedEmail={selectedEmail} hasEmails={allEmails.length > 0} />
        ) : (
          <>
            {chatHistory.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
            {isSending && (
              <div className="flex justify-start mb-4">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested queries */}
      {chatHistory.length === 0 && allEmails.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-2">Suggested queries:</p>
          <div className="flex flex-wrap gap-2">
            {(selectedEmail ? SUGGESTED_QUERIES_WITH_EMAIL : SUGGESTED_QUERIES_GLOBAL).map((query) => (
              <button
                key={query}
                onClick={() => handleSuggestedQuery(query)}
                disabled={isSending}
                className="
                  px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300
                  rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedEmail
                  ? 'Ask about this email...'
                  : allEmails.length > 0
                  ? 'Ask about your inbox...'
                  : 'Load inbox to start chatting'
              }
              disabled={allEmails.length === 0 || isSending}
              rows={1}
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-sm text-gray-900
              "
              style={{
                minHeight: '40px',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || allEmails.length === 0 || isSending}
            className="
              flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors
              disabled:bg-gray-300 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
