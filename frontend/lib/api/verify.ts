/**
 * API Client Verification Script
 * 
 * This script verifies the API client structure and can be used
 * to test connectivity with the backend.
 * 
 * Run with: npx tsx frontend/lib/api/verify.ts
 */

import { apiClient, APIClientError, NetworkError, ValidationError } from './index';

/**
 * Verify API client structure
 */
function verifyStructure() {
  console.log('🔍 Verifying API Client Structure...\n');

  const checks = [
    { name: 'API Client Instance', value: apiClient !== undefined },
    { name: 'Email API', value: apiClient.emails !== undefined },
    { name: 'Prompt API', value: apiClient.prompts !== undefined },
    { name: 'Agent API', value: apiClient.agent !== undefined },
    { name: 'Draft API', value: apiClient.drafts !== undefined },
    { name: 'Email.loadInbox', value: typeof apiClient.emails.loadInbox === 'function' },
    { name: 'Email.getAllEmails', value: typeof apiClient.emails.getAllEmails === 'function' },
    { name: 'Email.getEmailById', value: typeof apiClient.emails.getEmailById === 'function' },
    { name: 'Email.processEmail', value: typeof apiClient.emails.processEmail === 'function' },
    { name: 'Prompt.getPrompts', value: typeof apiClient.prompts.getPrompts === 'function' },
    { name: 'Prompt.updatePrompts', value: typeof apiClient.prompts.updatePrompts === 'function' },
    { name: 'Prompt.getDefaultPrompts', value: typeof apiClient.prompts.getDefaultPrompts === 'function' },
    { name: 'Agent.chat', value: typeof apiClient.agent.chat === 'function' },
    { name: 'Agent.generateDraft', value: typeof apiClient.agent.generateDraft === 'function' },
    { name: 'Draft.getAllDrafts', value: typeof apiClient.drafts.getAllDrafts === 'function' },
    { name: 'Draft.getDraftById', value: typeof apiClient.drafts.getDraftById === 'function' },
    { name: 'Draft.updateDraft', value: typeof apiClient.drafts.updateDraft === 'function' },
    { name: 'Draft.deleteDraft', value: typeof apiClient.drafts.deleteDraft === 'function' },
    { name: 'Draft.getDraftsForEmail', value: typeof apiClient.drafts.getDraftsForEmail === 'function' },
    { name: 'APIClientError', value: APIClientError !== undefined },
    { name: 'NetworkError', value: NetworkError !== undefined },
    { name: 'ValidationError', value: ValidationError !== undefined },
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    if (check.value) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  return failed === 0;
}

/**
 * Test error classes
 */
function verifyErrorClasses() {
  console.log('🔍 Verifying Error Classes...\n');

  try {
    // Test APIClientError
    const apiError = new APIClientError('Test error', 500, { detail: 'Server error' });
    console.log('✅ APIClientError created:', {
      name: apiError.name,
      message: apiError.message,
      status: apiError.status,
    });

    // Test NetworkError
    const networkError = new NetworkError('Connection failed');
    console.log('✅ NetworkError created:', {
      name: networkError.name,
      message: networkError.message,
      isAPIClientError: networkError instanceof APIClientError,
    });

    // Test ValidationError
    const validationError = new ValidationError('Validation failed', {
      email: ['Invalid format'],
    });
    console.log('✅ ValidationError created:', {
      name: validationError.name,
      message: validationError.message,
      status: validationError.status,
      errors: validationError.errors,
    });

    console.log('\n✅ All error classes working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ Error class verification failed:', error);
    return false;
  }
}

/**
 * Test backend connectivity (optional)
 */
async function testConnectivity() {
  console.log('🔍 Testing Backend Connectivity...\n');
  console.log('Note: This requires the backend to be running at http://localhost:8000\n');

  try {
    // Try to get all emails
    console.log('Attempting to fetch emails...');
    const emails = await apiClient.emails.getAllEmails();
    console.log(`✅ Successfully connected! Found ${emails.length} emails\n`);
    return true;
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('⚠️  Backend not reachable. Make sure it\'s running at http://localhost:8000');
      console.log('   Error:', error.message);
    } else if (error instanceof APIClientError) {
      console.log('⚠️  API Error:', error.message);
      console.log('   Status:', error.status);
    } else {
      console.log('❌ Unexpected error:', error);
    }
    console.log('\n💡 To start the backend, run: cd backend && python -m uvicorn app.main:app --reload\n');
    return false;
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Email Productivity Agent - API Client Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verify structure
  const structureOk = verifyStructure();

  // Verify error classes
  const errorsOk = verifyErrorClasses();

  // Test connectivity (optional)
  const connectivityOk = await testConnectivity();

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Structure:    ${structureOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Classes: ${errorsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Connectivity:  ${connectivityOk ? '✅ PASS' : '⚠️  SKIP (backend not running)'}\n`);

  if (structureOk && errorsOk) {
    console.log('✅ API Client is properly configured and ready to use!\n');
    if (!connectivityOk) {
      console.log('💡 Start the backend to test full functionality.\n');
    }
  } else {
    console.log('❌ API Client has issues that need to be fixed.\n');
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
