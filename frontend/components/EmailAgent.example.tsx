/**
 * EmailAgent Component Usage Example
 * 
 * This example demonstrates how to integrate the EmailAgent component
 * into your application with proper state management and API integration.
 */

'use client';

import React, { useState } from 'react';
import EmailAgent from './EmailAgent';
import { apiClient } from '@/lib/api/client';
import type { Email, ChatMessage } from '@/types';

export default function EmailAgentExample() {
  // State for selected email
  const [selectedEmail, setSelectedEmail] = useState<Email | undefined>(undefined);
  
  // State for chat history
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle sending a message to the agent
   * This function calls the backend API and updates the chat history
   */
  const handleSendMessage = async (message: string): Promise<string> => {
    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message to history
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the agent API
      const response = await apiClient.agent.chat({
        message,
        email_id: selectedEmail?.id || null,
        context: null,
      });

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      // Add assistant message to history
      setChatHistory((prev) => [...prev, assistantMessage]);

      return response.response;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };

      // Add error message to history
      setChatHistory((prev) => [...prev, errorMessage]);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Example: Simulate selecting an email
   */
  const handleSelectEmail = () => {
    const exampleEmail: Email = {
      id: '1',
      sender: 'john@example.com',
      subject: 'Project Update',
      body: 'Here is the latest update on the project...',
      timestamp: new Date().toISOString(),
      category: 'Important',
      processed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      action_items: [
        {
          id: '1',
          email_id: '1',
          task: 'Review project proposal',
          deadline: '2024-12-31',
          completed: false,
          created_at: new Date().toISOString(),
        },
      ],
    };

    setSelectedEmail(exampleEmail);
    setChatHistory([]); // Clear chat history when selecting new email
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-bold mb-2">EmailAgent Example</h1>
        <button
          onClick={handleSelectEmail}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Select Example Email
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <EmailAgent
          selectedEmail={selectedEmail}
          onSendMessage={handleSendMessage}
          chatHistory={chatHistory}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

/**
 * Integration Notes:
 * 
 * 1. State Management:
 *    - Maintain chatHistory in parent component state
 *    - Track selectedEmail to provide context
 *    - Handle loading states for better UX
 * 
 * 2. API Integration:
 *    - Use apiClient.agent.chat() to send messages
 *    - Pass email_id for context-aware responses
 *    - Handle errors gracefully with user-friendly messages
 * 
 * 3. Chat History:
 *    - Create ChatMessage objects with unique IDs
 *    - Use ISO 8601 timestamps for consistency
 *    - Clear history when switching emails (optional)
 * 
 * 4. Special Queries:
 *    - "Summarize this email" - requires selectedEmail
 *    - "What tasks do I need to do?" - works without selectedEmail
 *    - "Show me all urgent emails" - works without selectedEmail
 * 
 * 5. Error Handling:
 *    - Catch API errors and display error messages
 *    - Add error messages to chat history for visibility
 *    - Log errors for debugging
 * 
 * 6. Performance:
 *    - Consider implementing message pagination for long conversations
 *    - Debounce rapid message sends if needed
 *    - Cache responses for repeated queries (optional)
 */
