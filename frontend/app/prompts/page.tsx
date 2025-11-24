/**
 * Prompts Configuration Page
 * 
 * Demonstrates the PromptBrain component with full API integration.
 */

import PromptBrainExample from '@/components/PromptBrain.example';

export default function PromptsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
          <PromptBrainExample />
        </div>
      </div>
    </div>
  );
}
