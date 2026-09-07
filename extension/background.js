import { RelationshipSolver } from './solver.js';

let currentSession = null;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DirectLink Engine] Extension installed successfully.');
});

// Main message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SOURCE_RECORDING') {
    currentSession = {
      tabId: sender.tab?.id || message.tabId,
      sourceUrl: message.sourceUrl,
      sourceDom: message.domSnapshot,
      startTime: Date.now(),
      hops: []
    };

    console.log('[DirectLink Engine] Started recording trip for:', message.sourceUrl);
    sendResponse({ status: 'recording_active', sourceUrl: message.sourceUrl });
    return true;
  }

  if (message.type === 'TAG_TARGET_ENDPOINT') {
    if (!currentSession) {
      sendResponse({ status: 'error', message: 'No active source recording session found. Please tag a source page first!' });
      return true;
    }

    try {
      // Execute Relationship Solver
      const recipe = RelationshipSolver.solve(
        currentSession.sourceDom,
        message.targetUrl,
        message.targetBody
      );

      const domain = new URL(currentSession.sourceUrl).hostname;
      const storageKey = `recipe_${domain}`;

      // Save recipe to chrome.storage.local
      chrome.storage.local.set({ [storageKey]: recipe }, () => {
        console.log(`[DirectLink Engine] Synthesized and saved recipe for ${domain}:`, recipe);
        sendResponse({ status: 'success', recipe, domain });
        currentSession = null; // Reset session
      });
    } catch (err) {
      console.error('[DirectLink Engine] Failed to solve relationship:', err);
      sendResponse({ status: 'error', message: err.message });
    }
    return true;
  }

  if (message.type === 'GET_SESSION_STATUS') {
    sendResponse({
      isRecording: !!currentSession,
      currentSession: currentSession ? {
        sourceUrl: currentSession.sourceUrl,
        domain: new URL(currentSession.sourceUrl).hostname,
        durationSeconds: Math.floor((Date.now() - currentSession.startTime) / 1000)
      } : null
    });
    return true;
  }

  if (message.type === 'CANCEL_RECORDING') {
    currentSession = null;
    sendResponse({ status: 'cancelled' });
    return true;
  }

  if (message.type === 'GET_ALL_RECIPES') {
    chrome.storage.local.get(null, (items) => {
      const recipes = [];
      for (const [k, v] of Object.entries(items)) {
        if (k.startsWith('recipe_') && v && v.domain) {
          recipes.push(v);
        }
      }
      sendResponse({ recipes });
    });
    return true;
  }

  if (message.type === 'DELETE_RECIPE') {
    const storageKey = `recipe_${message.domain}`;
    chrome.storage.local.remove(storageKey, () => {
      sendResponse({ status: 'deleted', domain: message.domain });
    });
    return true;
  }

  return true;
});
