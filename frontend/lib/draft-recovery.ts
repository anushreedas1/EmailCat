/**
 * Draft Recovery Utilities
 * Local storage fallback for draft content recovery
 * 
 * Validates Requirements:
 * - 12.4: Preserve partial draft content for user recovery on errors
 * - 12.2: Persist all drafts across application restarts
 */

import type { Draft } from '@/types';

const DRAFT_RECOVERY_KEY_PREFIX = 'draft_recovery_';
const DRAFT_AUTOSAVE_KEY_PREFIX = 'draft_autosave_';

/**
 * Save draft to local storage for recovery
 */
export function saveDraftToLocalStorage(
  draftId: string,
  subject: string,
  body: string
): void {
  try {
    const recoveryData = {
      draftId,
      subject,
      body,
      timestamp: new Date().toISOString(),
    };
    
    const key = `${DRAFT_RECOVERY_KEY_PREFIX}${draftId}`;
    localStorage.setItem(key, JSON.stringify(recoveryData));
  } catch (error) {
    console.error('Failed to save draft to local storage:', error);
  }
}

/**
 * Get draft from local storage
 */
export function getDraftFromLocalStorage(draftId: string): {
  subject: string;
  body: string;
  timestamp: string;
} | null {
  try {
    const key = `${DRAFT_RECOVERY_KEY_PREFIX}${draftId}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get draft from local storage:', error);
    return null;
  }
}

/**
 * Remove draft from local storage after successful save
 */
export function removeDraftFromLocalStorage(draftId: string): void {
  try {
    const key = `${DRAFT_RECOVERY_KEY_PREFIX}${draftId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove draft from local storage:', error);
  }
}

/**
 * Get all recovery drafts
 */
export function getAllRecoveryDrafts(): Array<{
  draftId: string;
  subject: string;
  body: string;
  timestamp: string;
}> {
  const recoveryDrafts: Array<{
    draftId: string;
    subject: string;
    body: string;
    timestamp: string;
  }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_RECOVERY_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          recoveryDrafts.push(parsed);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get recovery drafts:', error);
  }
  
  return recoveryDrafts;
}

/**
 * Clear old recovery drafts (older than 7 days)
 */
export function clearOldRecoveryDrafts(): void {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_RECOVERY_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const timestamp = new Date(parsed.timestamp);
          
          if (timestamp < sevenDaysAgo) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear old recovery drafts:', error);
  }
}

/**
 * Auto-save draft content (separate from recovery)
 */
export function autoSaveDraft(
  draftId: string,
  subject: string,
  body: string
): void {
  try {
    const autoSaveData = {
      subject,
      body,
      timestamp: new Date().toISOString(),
    };
    
    const key = `${DRAFT_AUTOSAVE_KEY_PREFIX}${draftId}`;
    localStorage.setItem(key, JSON.stringify(autoSaveData));
  } catch (error) {
    console.error('Failed to auto-save draft:', error);
  }
}

/**
 * Get auto-saved draft content
 */
export function getAutoSavedDraft(draftId: string): {
  subject: string;
  body: string;
  timestamp: string;
} | null {
  try {
    const key = `${DRAFT_AUTOSAVE_KEY_PREFIX}${draftId}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get auto-saved draft:', error);
    return null;
  }
}

/**
 * Clear auto-saved draft after successful save
 */
export function clearAutoSavedDraft(draftId: string): void {
  try {
    const key = `${DRAFT_AUTOSAVE_KEY_PREFIX}${draftId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear auto-saved draft:', error);
  }
}

/**
 * Check if there's a newer version in local storage
 */
export function hasNewerLocalVersion(
  draftId: string,
  serverTimestamp: string
): boolean {
  try {
    const localData = getAutoSavedDraft(draftId);
    if (!localData) return false;
    
    const localTime = new Date(localData.timestamp);
    const serverTime = new Date(serverTimestamp);
    
    return localTime > serverTime;
  } catch (error) {
    console.error('Failed to check for newer local version:', error);
    return false;
  }
}
