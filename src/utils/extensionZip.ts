import JSZip from 'jszip';

// Raw extension files source
export const EXTENSION_FILES = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "DirectLink - Zero-Click Resource Ingestion Engine",
  "version": "1.0.0",
  "description": "Record-and-Generalize extension to reverse-engineer ad-gate loops and provide instant 1-click downloads.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "webRequest",
    "declarativeNetRequest"
  ],
  "optional_permissions": [
    "debugger"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "DirectLink Engine"
  }
}`,

  'solver.js': `/**
 * DirectLink Relationship Solver Engine
 * Reverse-engineers the relationship between Source DOM entities and Target API endpoints.
 */

export class RelationshipSolver {
  static solve(sourceDom, targetUrl, targetBody = null) {
    const bindings = [];
    const targetUrlObj = new URL(targetUrl);
    const targetParams = {};

    targetUrlObj.searchParams.forEach((value, key) => {
      targetParams[key] = value;
    });

    if (targetBody && typeof targetBody === 'object') {
      Object.entries(targetBody).forEach(([key, val]) => {
        targetParams[key] = String(val);
      });
    }

    for (const [paramName, paramVal] of Object.entries(targetParams)) {
      if (!paramVal || paramVal.length < 2) continue;

      let matched = false;

      // Strategy A: Direct Match in meta tags
      if (sourceDom.metaTags) {
        for (const [metaName, metaContent] of Object.entries(sourceDom.metaTags)) {
          if (metaContent === paramVal) {
            bindings.push({
              paramName,
              sourceType: 'meta',
              selector: \`meta[name="\${metaName}"]\`,
              attribute: 'content',
              transform: 'identity',
              confidence: 1.0,
              description: \`Extracted from <meta name="\${metaName}">\`
            });
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // Strategy B: Match in data-* attributes
      if (sourceDom.dataAttributes) {
        for (const [attrName, attrVal] of Object.entries(sourceDom.dataAttributes)) {
          if (attrVal === paramVal) {
            bindings.push({
              paramName,
              sourceType: 'data_attr',
              selector: \`[data-\${attrName}]\`,
              attribute: \`data-\${attrName}\`,
              transform: 'identity',
              confidence: 0.95,
              description: \`Extracted from DOM attribute data-\${attrName}\`
            });
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // Strategy C: Inverse Base64 Decoding Match
      try {
        const decoded = atob(paramVal);
        if (sourceDom.dataAttributes) {
          for (const [attrName, attrVal] of Object.entries(sourceDom.dataAttributes)) {
            if (attrVal === decoded) {
              bindings.push({
                paramName,
                sourceType: 'data_attr',
                selector: \`[data-\${attrName}]\`,
                attribute: \`data-\${attrName}\`,
                transform: 'btoa',
                confidence: 0.98,
                description: \`Base64 encoded from data-\${attrName}\`
              });
              matched = true;
              break;
            }
          }
        }
        if (!matched && sourceDom.urlTokens) {
          for (const token of sourceDom.urlTokens) {
            if (token === decoded) {
              bindings.push({
                paramName,
                sourceType: 'url_slug',
                selector: 'window.location.pathname',
                transform: 'btoa',
                confidence: 0.92,
                description: \`Base64 encoded from URL token "\${token}"\`
              });
              matched = true;
              break;
            }
          }
        }
      } catch (e) {}

      if (matched) continue;

      // Strategy D: SSR / Next.js Hydration AST Recursive Prober
      if (sourceDom.nextData) {
        const jsonPath = this.searchObject(sourceDom.nextData, paramVal);
        if (jsonPath) {
          bindings.push({
            paramName,
            sourceType: 'next_data',
            selector: \`__NEXT_DATA__.\${jsonPath}\`,
            attribute: jsonPath,
            transform: 'json_prop',
            confidence: 0.99,
            description: \`Extracted from Next.js Hydration: \${jsonPath}\`
          });
          matched = true;
        }
      }

      if (matched) continue;

      // Strategy E: URL Token / Slug Direct Match
      if (sourceDom.urlTokens) {
        for (const token of sourceDom.urlTokens) {
          if (token === paramVal) {
            bindings.push({
              paramName,
              sourceType: 'url_slug',
              selector: 'window.location.pathname',
              transform: 'slug_segment',
              confidence: 0.88,
              description: \`Extracted from URL slug segment\`
            });
            matched = true;
            break;
          }
        }
      }
    }

    const endpointTemplate = \`\${targetUrlObj.origin}\${targetUrlObj.pathname}\`;
    const isThirdPartyHub = this.isExternalHub(targetUrl);

    return {
      domain: new URL(sourceDom.url).hostname,
      endpointTemplate,
      isThirdPartyHub,
      httpMethod: 'GET',
      bindings,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Referer': sourceDom.url
      },
      createdAt: new Date().toISOString()
    };
  }

  static searchObject(obj, targetVal, currentPath = '') {
    if (!obj || typeof obj !== 'object') return null;
    for (const [key, val] of Object.entries(obj)) {
      const newPath = currentPath ? \`\${currentPath}.\${key}\` : key;
      if (String(val) === String(targetVal)) {
        return newPath;
      }
      if (typeof val === 'object') {
        const found = this.searchObject(val, targetVal, newPath);
        if (found) return found;
      }
    }
    return null;
  }

  static isExternalHub(url) {
    const hubDomains = ['mediafire.com', 'mega.nz', 'drive.google.com', 'rapidgator.net', 's3.amazonaws.com', 'r2.cloudflarestorage.com'];
    return hubDomains.some(hub => url.includes(hub));
  }
}`,

  'background.js': `import { RelationshipSolver } from './solver.js';

let currentSession = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[DirectLink Engine] Extension installed successfully.');
});

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
      const recipe = RelationshipSolver.solve(
        currentSession.sourceDom,
        message.targetUrl,
        message.targetBody
      );

      const domain = new URL(currentSession.sourceUrl).hostname;
      const storageKey = \`recipe_\${domain}\`;

      chrome.storage.local.set({ [storageKey]: recipe }, () => {
        console.log(\`[DirectLink Engine] Synthesized and saved recipe for \${domain}:\`, recipe);
        sendResponse({ status: 'success', recipe, domain });
        currentSession = null;
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
    const storageKey = \`recipe_\${message.domain}\`;
    chrome.storage.local.remove(storageKey, () => {
      sendResponse({ status: 'deleted', domain: message.domain });
    });
    return true;
  }

  return true;
});`,

  'content_script.js': `(async function () {
  const currentDomain = window.location.hostname;

  chrome.storage.local.get([\`recipe_\${currentDomain}\`], (res) => {
    const recipe = res[\`recipe_\${currentDomain}\`];
    if (recipe && recipe.bindings) {
      console.log('[DirectLink Engine] Active recipe found for:', currentDomain);
      injectDirectBypassUI(recipe);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_SOURCE_DOM') {
      const snapshot = captureCurrentDomSnapshot();
      sendResponse({ snapshot, url: window.location.href });
      return true;
    }

    if (message.type === 'CAPTURE_TARGET_ENDPOINT') {
      const candidateLinks = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href.startsWith('http'));

      sendResponse({
        url: window.location.href,
        candidateLinks: candidateLinks.slice(0, 10)
      });
      return true;
    }
    return true;
  });

  function captureCurrentDomSnapshot() {
    const metaTags = {};
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });

    const dataAttributes = {};
    document.querySelectorAll('[data-id], [data-book-id], [data-file], [data-hash], [data-slug], [data-key]').forEach(el => {
      for (const [k, v] of Object.entries(el.dataset)) {
        dataAttributes[k] = v;
      }
    });

    let nextData = null;
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        nextData = JSON.parse(nextScript.textContent);
      } catch (e) {}
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
      url: window.location.href,
      title: document.title,
      metaTags,
      dataAttributes,
      nextData,
      urlTokens: pathParts
    };
  }

  function injectDirectBypassUI(recipe) {
    const targetElements = document.querySelectorAll(
      '#btn-download, #download-button, .download-btn, .btn-download, a[href*="download"], [data-action="download"], button:not([data-directlink])'
    );

    if (targetElements.length === 0) return;

    targetElements.forEach(originalEl => {
      if (originalEl.getAttribute('data-directlink-processed')) return;
      originalEl.setAttribute('data-directlink-processed', 'true');

      const fastBtn = document.createElement('button');
      fastBtn.setAttribute('data-directlink', 'true');
      fastBtn.innerHTML = '⚡ Instant Direct Download <span style="font-size:10px; opacity:0.8;">(DirectLink)</span>';
      fastBtn.style.cssText = \`
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 700;
        padding: 10px 18px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
        cursor: pointer;
        margin: 8px 4px;
        transition: all 0.2s ease;
        z-index: 999999;
      \`;

      fastBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        fastBtn.innerHTML = '⏳ Resolving Direct Download Link...';
        fastBtn.style.opacity = '0.7';

        try {
          const queryParams = new URLSearchParams();

          if (recipe.bindings && Array.isArray(recipe.bindings)) {
            for (const b of recipe.bindings) {
              let extractedVal = '';

              if (b.sourceType === 'meta') {
                const el = document.querySelector(b.selector);
                if (el) extractedVal = el.getAttribute(b.attribute || 'content') || '';
              } else if (b.sourceType === 'data_attr') {
                const el = document.querySelector(b.selector);
                if (el) extractedVal = el.getAttribute(b.attribute) || el.dataset[b.attribute.replace('data-', '')] || '';
              } else if (b.sourceType === 'url_slug') {
                extractedVal = window.location.pathname.split('/').filter(Boolean).pop() || '';
              } else if (b.sourceType === 'next_data') {
                const nextScript = document.getElementById('__NEXT_DATA__');
                if (nextScript) {
                  try {
                    const parsed = JSON.parse(nextScript.textContent);
                    const keys = b.attribute.split('.');
                    let cur = parsed;
                    for (const k of keys) {
                      cur = cur ? cur[k] : undefined;
                    }
                    if (cur) extractedVal = String(cur);
                  } catch (e) {}
                }
              }

              if (b.transform === 'btoa' && extractedVal) {
                extractedVal = btoa(extractedVal);
              }

              if (extractedVal) {
                queryParams.set(b.paramName, extractedVal);
              }
            }
          }

          const targetUrl = new URL(recipe.endpointTemplate);
          queryParams.forEach((v, k) => {
            targetUrl.searchParams.set(k, v);
          });

          const response = await fetch(targetUrl.toString(), {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Referer': window.location.href
            }
          });

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            const directUrl = data.cdn_direct_url || data.download_url || data.url || data.link || targetUrl.toString();
            fastBtn.innerHTML = '✓ Download Triggered!';
            window.location.href = directUrl;
          } else {
            fastBtn.innerHTML = '✓ Download Triggered!';
            window.location.href = targetUrl.toString();
          }

          setTimeout(() => {
            fastBtn.innerHTML = '⚡ Instant Direct Download <span style="font-size:10px; opacity:0.8;">(DirectLink)</span>';
            fastBtn.style.opacity = '1';
          }, 3000);

        } catch (err) {
          fastBtn.innerHTML = '⚠️ Bypass Failed - Click for Manual';
          fastBtn.style.background = '#dc2626';
          setTimeout(() => {
            fastBtn.innerHTML = '⚡ Instant Direct Download';
            fastBtn.style.background = 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
            fastBtn.style.opacity = '1';
          }, 3000);
        }
      };

      if (originalEl.parentNode) {
        originalEl.parentNode.insertBefore(fastBtn, originalEl.nextSibling);
      }
    });
  }
})();`,

  'popup.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DirectLink Ingestion Engine</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="icon-badge">⚡</div>
      <div class="brand-text">
        <div class="brand-title">DirectLink Engine</div>
        <div class="brand-subtitle">Record & Auto-Bypass</div>
      </div>
    </div>
    <div id="status-pill" class="status-pill idle">Ready</div>
  </div>

  <div class="main-content">
    <div class="domain-card">
      <span class="label">Current Tab:</span>
      <span id="current-tab-domain" class="domain-name">Loading...</span>
    </div>

    <div class="action-buttons">
      <button id="btn-tag-source" class="btn btn-primary">
        <span class="btn-icon">📍</span>
        <div class="btn-text">
          <span class="btn-title">1. Tag Page as Source</span>
          <span class="btn-desc">Record DOM snapshot & start ad trip</span>
        </div>
      </button>

      <button id="btn-tag-target" class="btn btn-success" disabled>
        <span class="btn-icon">🎯</span>
        <div class="btn-text">
          <span class="btn-title">2. Tag Target Download Link</span>
          <span class="btn-desc">Infer relationship & save domain recipe</span>
        </div>
      </button>
    </div>

    <div id="recording-banner" class="recording-banner hidden">
      <div class="pulse-dot"></div>
      <div class="banner-text">
        <strong id="recording-source-label">Recording Active:</strong>
        <span>Navigate through ad pages now. When you reach the final download page, open extension & click Button 2!</span>
      </div>
      <button id="btn-cancel-recording" class="btn-mini-cancel">Cancel</button>
    </div>

    <div class="recipes-section">
      <div class="section-title-row">
        <span class="section-title">Saved Domain Recipes</span>
        <span id="recipe-count" class="badge">0</span>
      </div>

      <div id="recipes-list" class="recipes-list">
        <div class="empty-state">No domain recipes saved yet. Tag a source page above to create one.</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>DirectLink v1.0 • Manifest V3</span>
  </div>

  <script type="module" src="popup.js"></script>
</body>
</html>`,

  'popup.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  width: 360px;
  background: #090d16;
  color: #f1f5f9;
  padding: 0;
  margin: 0;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-badge {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.brand-subtitle {
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
}

.status-pill {
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  padding: 4px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.status-pill.idle {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.4);
}

.status-pill.recording {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.main-content {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.domain-card {
  background: #111827;
  border: 1px solid #1f2937;
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.domain-card .label {
  color: #64748b;
  font-family: monospace;
}

.domain-name {
  color: #38bdf8;
  font-weight: 600;
  font-family: monospace;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 18px;
}

.btn-title {
  display: block;
  font-size: 12px;
  font-weight: 700;
}

.btn-desc {
  display: block;
  font-size: 10px;
  opacity: 0.8;
  font-family: monospace;
}

.recording-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
}

.recording-banner.hidden {
  display: none;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  animation: pulse 1s infinite;
}

.banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #fca5a5;
}

.btn-mini-cancel {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  align-self: flex-start;
}

.recipes-section {
  border-top: 1px solid #1e293b;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  font-family: monospace;
}

.badge {
  background: #1e293b;
  color: #38bdf8;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  font-family: monospace;
  font-weight: bold;
}

.recipes-list {
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-state {
  font-size: 10px;
  color: #64748b;
  text-align: center;
  padding: 16px 8px;
  font-family: monospace;
}

.recipe-item {
  background: #0f172a;
  border: 1px solid #1e293b;
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.recipe-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
}

.recipe-domain {
  font-weight: 700;
  color: #34d399;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-rules {
  font-size: 9px;
  color: #94a3b8;
  font-family: monospace;
}

.btn-delete-recipe {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
}

.footer {
  padding: 10px 16px;
  background: #090d16;
  border-top: 1px solid #1e293b;
  font-size: 10px;
  color: #475569;
  text-align: center;
  font-family: monospace;
}`,

  'popup.js': `const currentTabDomainEl = document.getElementById('current-tab-domain');
const statusPill = document.getElementById('status-pill');
const btnTagSource = document.getElementById('btn-tag-source');
const btnTagTarget = document.getElementById('btn-tag-target');
const recordingBanner = document.getElementById('recording-banner');
const btnCancelRecording = document.getElementById('btn-cancel-recording');
const recipesListEl = document.getElementById('recipes-list');
const recipeCountEl = document.getElementById('recipe-count');

let activeTab = null;

async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tabs[0];

  if (activeTab && activeTab.url) {
    try {
      const url = new URL(activeTab.url);
      currentTabDomainEl.textContent = url.hostname;
    } catch (e) {
      currentTabDomainEl.textContent = activeTab.url;
    }
  } else {
    currentTabDomainEl.textContent = 'Chrome Internal Page';
    btnTagSource.disabled = true;
  }

  chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' }, (res) => {
    if (res && res.isRecording) {
      setRecordingUI(true, res.currentSession.sourceUrl);
    } else {
      setRecordingUI(false);
    }
  });

  loadSavedRecipes();
}

function setRecordingUI(isRecording, sourceUrl = '') {
  if (isRecording) {
    statusPill.textContent = 'RECORDING';
    statusPill.className = 'status-pill recording';
    recordingBanner.classList.remove('hidden');
    btnTagSource.disabled = true;
    btnTagTarget.disabled = false;
  } else {
    statusPill.textContent = 'READY';
    statusPill.className = 'status-pill idle';
    recordingBanner.classList.add('hidden');
    btnTagSource.disabled = !activeTab || !activeTab.url || activeTab.url.startsWith('chrome://');
    btnTagTarget.disabled = true;
  }
}

btnTagSource.addEventListener('click', async () => {
  if (!activeTab || !activeTab.id) return;

  btnTagSource.disabled = true;
  btnTagSource.querySelector('.btn-title').textContent = 'Capturing DOM...';

  chrome.tabs.sendMessage(activeTab.id, { type: 'CAPTURE_SOURCE_DOM' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      alert('Could not capture page DOM. Please refresh the page and try again.');
      btnTagSource.disabled = false;
      btnTagSource.querySelector('.btn-title').textContent = '1. Tag Page as Source';
      return;
    }

    chrome.runtime.sendMessage({
      type: 'START_SOURCE_RECORDING',
      tabId: activeTab.id,
      sourceUrl: response.url,
      domSnapshot: response.snapshot
    }, (res) => {
      btnTagSource.querySelector('.btn-title').textContent = '1. Tag Page as Source';
      if (res && res.status === 'recording_active') {
        setRecordingUI(true, response.url);
      }
    });
  });
});

btnTagTarget.addEventListener('click', async () => {
  if (!activeTab || !activeTab.id) return;

  btnTagTarget.disabled = true;
  btnTagTarget.querySelector('.btn-title').textContent = 'Analyzing Endpoints...';

  chrome.tabs.sendMessage(activeTab.id, { type: 'CAPTURE_TARGET_ENDPOINT' }, (response) => {
    const targetUrl = response ? response.url : activeTab.url;

    chrome.runtime.sendMessage({
      type: 'TAG_TARGET_ENDPOINT',
      targetUrl: targetUrl
    }, (res) => {
      btnTagTarget.querySelector('.btn-title').textContent = '2. Tag Target Download Link';
      if (res && res.status === 'success') {
        alert(\`🎉 Success! Direct bypass recipe generated for \${res.domain} with \${res.recipe.bindings.length} parameter bindings.\`);
        setRecordingUI(false);
        loadSavedRecipes();
      } else {
        alert(\`Failed to solve relationship: \${res ? res.message : 'Unknown error'}\`);
        setRecordingUI(false);
      }
    });
  });
});

btnCancelRecording.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CANCEL_RECORDING' }, () => {
    setRecordingUI(false);
  });
});

function loadSavedRecipes() {
  chrome.runtime.sendMessage({ type: 'GET_ALL_RECIPES' }, (res) => {
    if (!res || !res.recipes) return;
    const recipes = res.recipes;
    recipeCountEl.textContent = recipes.length;

    if (recipes.length === 0) {
      recipesListEl.innerHTML = '<div class="empty-state">No domain recipes saved yet. Tag a source page above to create one.</div>';
      return;
    }

    recipesListEl.innerHTML = '';
    recipes.forEach((recipe) => {
      const item = document.createElement('div');
      item.className = 'recipe-item';
      item.innerHTML = \`
        <div class="recipe-info">
          <span class="recipe-domain">⚡ \${recipe.domain}</span>
          <span class="recipe-rules">\${recipe.bindings.length} dynamic bindings • \${recipe.isThirdPartyHub ? 'External Host' : 'Direct API'}</span>
        </div>
        <button class="btn-delete-recipe" data-domain="\${recipe.domain}" title="Delete Recipe">✕</button>
      \`;
      recipesListEl.appendChild(item);
    });

    document.querySelectorAll('.btn-delete-recipe').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.getAttribute('data-domain');
        chrome.runtime.sendMessage({ type: 'DELETE_RECIPE', domain }, () => {
          loadSavedRecipes();
        });
      });
    });
  });
}

init();`,

  'README.md': `# ⚡ DirectLink - Chrome Extension (Manifest V3)

> **Record-and-Generalize Extension to reverse-engineer ad-gate loops and provide instant 1-click downloads.**

---

## 🚀 How to Install in Google Chrome

1. Unzip this package to a folder named \`directlink-extension\`.
2. Open Google Chrome and navigate to:
   \`chrome://extensions\`
3. In the top-right corner, turn on **"Developer mode"** toggle.
4. In the top-left corner, click **"Load unpacked"**.
5. Select the unzipped folder.
6. The extension is now loaded and ready to use!

---

## 🎯 2-Tag Workflow:
1. Open the source resource page -> Open extension popup -> Click **"1. Tag Page as Source"**.
2. Complete the human verification/redirect steps manually just once.
3. On the final download page -> Open extension popup -> Click **"2. Tag Target Download Link"**.
4. Done! Any future visits to items on this domain will show a direct green **"⚡ Instant Direct Download"** button with 0 ads!
`
};

export async function downloadExtensionZip() {
  const zip = new JSZip();
  const folder = zip.folder('directlink-extension');

  if (!folder) return;

  for (const [filename, content] of Object.entries(EXTENSION_FILES)) {
    folder.file(filename, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'directlink-chrome-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
