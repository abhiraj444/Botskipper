import { RelationshipSolver } from './solver.js';

let currentSession = null;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DirectLink Engine v2] Multi-Step & Backend API Resolver Extension installed.');
});

// Passively capture network requests during an active recording session
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!currentSession) return;
    // Don't capture image/media/style noise
    if (['image', 'stylesheet', 'font', 'media'].includes(details.type)) return;

    let bodyData = null;
    if (details.requestBody && details.requestBody.raw) {
      try {
        const decoder = new TextDecoder('utf-8');
        const rawText = details.requestBody.raw.map(b => b.bytes ? decoder.decode(b.bytes) : '').join('');
        if (rawText.startsWith('{')) {
          bodyData = JSON.parse(rawText);
        } else {
          bodyData = rawText;
        }
      } catch (e) {}
    } else if (details.requestBody && details.requestBody.formData) {
      bodyData = details.requestBody.formData;
    }

    currentSession.hops.push({
      url: details.url,
      method: details.method,
      type: details.type,
      requestBody: bodyData,
      timestamp: Date.now()
    });

    console.log(`[DirectLink Network Sniffer] Captured ${details.method} ${details.url}`);
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

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
      // Execute Upgraded Multi-Step & API Relationship Solver
      const recipe = RelationshipSolver.solve(
        currentSession.sourceDom,
        message.targetUrl,
        message.targetBody,
        currentSession.hops
      );

      const domain = new URL(currentSession.sourceUrl).hostname;
      const bareDomain = domain.replace(/^www\./, '');
      const storageKey1 = `recipe_${domain}`;
      const storageKey2 = `recipe_${bareDomain}`;

      // Save recipe to chrome.storage.local under both domain keys
      chrome.storage.local.set({ [storageKey1]: recipe, [storageKey2]: recipe }, () => {
        console.log(`[DirectLink Engine] Synthesized and saved recipe (${recipe.strategy}) for ${domain}:`, recipe);
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
        durationSeconds: Math.floor((Date.now() - currentSession.startTime) / 1000),
        capturedHopsCount: currentSession.hops.length
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
