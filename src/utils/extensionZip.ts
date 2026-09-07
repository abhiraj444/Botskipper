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
 * DirectLink Relationship Solver Engine (v2 - Multi-Step & Backend API Resolver)
 * Reverse-engineers:
 * 1. Direct URL Templates (static parameter alignment)
 * 2. Backend Minting APIs (Internal / External APIs called with page/button metadata)
 * 3. Chained Intermediate Brokers (Source -> Broker API -> Bridge Page -> Terminal Download)
 */

export class RelationshipSolver {
  static solve(sourceDom, targetUrl, targetBody = null, networkHops = []) {
    const mintingApiHop = this.findMintingApiHop(networkHops, targetUrl);

    if (mintingApiHop) {
      console.log('[RelationshipSolver] Detected Backend Minting API:', mintingApiHop.url);
      return this.synthesizeApiMinterRecipe(sourceDom, mintingApiHop, targetUrl);
    }

    const brokerHop = this.findBrokerHop(networkHops, sourceDom);
    if (brokerHop && brokerHop.url !== targetUrl) {
      console.log('[RelationshipSolver] Detected Chained Broker Hop:', brokerHop.url);
      return this.synthesizeChainedBrokerRecipe(sourceDom, brokerHop, targetUrl);
    }

    return this.synthesizeDirectUrlRecipe(sourceDom, targetUrl, targetBody);
  }

  static findMintingApiHop(networkHops, targetUrl) {
    if (!networkHops || networkHops.length === 0) return null;
    const apiKeywords = ['/api/', '/ajax/', 'mint', 'get-link', 'generate', 'download', 'resolve', 'ticket', 'token', 'file-stream'];
    
    for (let i = networkHops.length - 1; i >= 0; i--) {
      const hop = networkHops[i];
      if (!hop.url) continue;
      if (this.isAdTracker(hop.url)) continue;

      const isApi = apiKeywords.some(kw => hop.url.toLowerCase().includes(kw)) ||
                    hop.type === 'xmlhttprequest' ||
                    hop.type === 'fetch';

      if (isApi) {
        return hop;
      }
    }
    return null;
  }

  static findBrokerHop(networkHops, sourceDom) {
    if (!networkHops || networkHops.length === 0) return null;
    const sourceHostname = new URL(sourceDom.url).hostname;

    for (const hop of networkHops) {
      if (!hop.url) continue;
      if (this.isAdTracker(hop.url)) continue;

      const hopHost = new URL(hop.url).hostname;
      if (hopHost !== sourceHostname || hop.url.includes('/gateway') || hop.url.includes('/bridge') || hop.url.includes('/link/')) {
        return hop;
      }
    }
    return null;
  }

  static synthesizeApiMinterRecipe(sourceDom, apiHop, finalDownloadUrl) {
    const apiObj = new URL(apiHop.url);
    const sourceHostname = new URL(sourceDom.url).hostname;
    const isInternalBackend = apiObj.hostname === sourceHostname;

    const apiParams = {};
    apiObj.searchParams.forEach((v, k) => { apiParams[k] = v; });
    const bindings = this.resolveBindings(sourceDom, apiParams);

    let bodyBindings = [];
    if (apiHop.requestBody && typeof apiHop.requestBody === 'object') {
      bodyBindings = this.resolveBindings(sourceDom, apiHop.requestBody);
    }

    return {
      domain: sourceHostname,
      strategy: 'BACKEND_API_MINTER',
      description: isInternalBackend
        ? 'Website calls internal backend API with page/button metadata to mint direct download link'
        : 'Website calls external API service to generate authorized download token',
      endpointTemplate: \`\${apiObj.origin}\${apiObj.pathname}\`,
      httpMethod: apiHop.method || 'GET',
      isInternalBackend,
      queryBindings: bindings,
      bodyBindings: bodyBindings,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': sourceDom.url
      },
      responseExtractors: ['download_url', 'cdn_url', 'direct_url', 'file_url', 'url', 'link', 'data.download_url', 'data.url'],
      finalDownloadUrlExample: finalDownloadUrl,
      createdAt: new Date().toISOString()
    };
  }

  static synthesizeChainedBrokerRecipe(sourceDom, brokerHop, finalDownloadUrl) {
    const brokerObj = new URL(brokerHop.url);
    const sourceHostname = new URL(sourceDom.url).hostname;

    const brokerParams = {};
    brokerObj.searchParams.forEach((v, k) => { brokerParams[k] = v; });
    const step1Bindings = this.resolveBindings(sourceDom, brokerParams);

    return {
      domain: sourceHostname,
      strategy: 'MULTI_STEP_CHAIN',
      description: 'Multi-step resolution: Source DOM data is passed to an intermediate service/gateway which returns a bridge page containing the real download button.',
      step1: {
        type: 'BROKER_CALL',
        endpoint: \`\${brokerObj.origin}\${brokerObj.pathname}\`,
        method: brokerHop.method || 'GET',
        bindings: step1Bindings
      },
      step2: {
        type: 'TERMINAL_BRIDGE',
        action: 'RESOLVE_TERMINAL_BUTTON',
        candidateSelectors: ['#btn-download', '#download-button', '.btn-download', 'a[href*="download"]', 'a.btn-success'],
        terminalDomain: new URL(finalDownloadUrl).hostname
      },
      finalDownloadUrlExample: finalDownloadUrl,
      createdAt: new Date().toISOString()
    };
  }

  static synthesizeDirectUrlRecipe(sourceDom, targetUrl, targetBody) {
    const targetUrlObj = new URL(targetUrl);
    const targetParams = {};
    targetUrlObj.searchParams.forEach((value, key) => { targetParams[key] = value; });

    if (targetBody && typeof targetBody === 'object') {
      Object.entries(targetBody).forEach(([k, v]) => { targetParams[k] = String(v); });
    }

    const bindings = this.resolveBindings(sourceDom, targetParams);
    const isThirdPartyHub = this.isExternalHub(targetUrl);

    return {
      domain: new URL(sourceDom.url).hostname,
      strategy: 'DIRECT_URL_TEMPLATE',
      description: 'Direct parameter interpolation from source page metadata into final target download URL',
      endpointTemplate: \`\${targetUrlObj.origin}\${targetUrlObj.pathname}\`,
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

  static resolveBindings(sourceDom, targetParams) {
    const bindings = [];

    for (const [paramName, paramVal] of Object.entries(targetParams)) {
      if (!paramVal || paramVal.length < 2) continue;
      let matched = false;

      // 1. Match in Download Button Dataset
      if (sourceDom.buttonDataset) {
        for (const [attrName, attrVal] of Object.entries(sourceDom.buttonDataset)) {
          if (attrVal === paramVal) {
            bindings.push({
              paramName,
              sourceType: 'button_data_attr',
              selector: '#download-btn, [data-action="download"], .download-btn, a[href*="download"]',
              attribute: \`data-\${attrName}\`,
              transform: 'identity',
              confidence: 0.99,
              description: \`Extracted directly from original Download Button (data-\${attrName})\`
            });
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // 2. Match in meta tags
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

      // 3. Match in DOM data-* attributes
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
              description: \`Extracted from page DOM attribute data-\${attrName}\`
            });
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // 4. Inverse Base64 Match
      try {
        const decoded = atob(paramVal);
        if (sourceDom.buttonDataset) {
          for (const [attrName, attrVal] of Object.entries(sourceDom.buttonDataset)) {
            if (attrVal === decoded) {
              bindings.push({
                paramName,
                sourceType: 'button_data_attr',
                selector: '#download-btn, .download-btn',
                attribute: \`data-\${attrName}\`,
                transform: 'btoa',
                confidence: 0.98,
                description: \`Base64 encoded from Download Button attribute data-\${attrName}\`
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

      // 5. SSR / Next.js Hydration AST Recursive Prober
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

      // 6. URL Token / Slug Direct Match
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

    return bindings;
  }

  static searchObject(obj, targetVal, currentPath = '') {
    if (!obj || typeof obj !== 'object') return null;
    for (const [key, val] of Object.entries(obj)) {
      const newPath = currentPath ? \`\${currentPath}.\${key}\` : key;
      if (String(val) === String(targetVal)) return newPath;
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

  static isAdTracker(url) {
    const adDomains = ['doubleclick', 'google-analytics', 'adnxs', 'popcash', 'propellerads', 'adsterra', 'exoclick', 'monetag', 'track', 'beacon', 'telemetry'];
    return adDomains.some(ad => url.toLowerCase().includes(ad));
  }
}`,

  'background.js': `import { RelationshipSolver } from './solver.js';

let currentSession = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('[DirectLink Engine v2] Multi-Step & Backend API Resolver Extension installed.');
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!currentSession) return;
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

    console.log(\`[DirectLink Network Sniffer] Captured \${details.method} \${details.url}\`);
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

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
        message.targetBody,
        currentSession.hops
      );

      const domain = new URL(currentSession.sourceUrl).hostname;
      const storageKey = \`recipe_\${domain}\`;

      chrome.storage.local.set({ [storageKey]: recipe }, () => {
        console.log(\`[DirectLink Engine] Synthesized and saved recipe (\${recipe.strategy}) for \${domain}:\`, recipe);
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
    if (recipe) {
      console.log(\`[DirectLink Engine] Active recipe found for \${currentDomain} (\${recipe.strategy})\`);
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

    const buttonDataset = {};
    const downloadBtns = document.querySelectorAll('#btn-download, #download-button, .download-btn, .btn-download, a[href*="download"], [data-action="download"], button[data-id], button[data-file]');
    downloadBtns.forEach(btn => {
      for (const [k, v] of Object.entries(btn.dataset)) {
        buttonDataset[k] = v;
      }
      if (btn.getAttribute('href') && !btn.getAttribute('href').startsWith('#') && !btn.getAttribute('href').startsWith('javascript:')) {
        buttonDataset['button_href'] = btn.getAttribute('href');
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
      buttonDataset,
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

        fastBtn.innerHTML = '⏳ Bypassing Ads & Minting Direct Stream...';
        fastBtn.style.opacity = '0.7';

        try {
          if (recipe.strategy === 'BACKEND_API_MINTER') {
            await executeBackendApiMinting(recipe, originalEl, fastBtn);
          } else if (recipe.strategy === 'MULTI_STEP_CHAIN') {
            await executeMultiStepChain(recipe, originalEl, fastBtn);
          } else {
            await executeDirectUrlTemplate(recipe, originalEl, fastBtn);
          }
        } catch (err) {
          console.error('[DirectLink Engine] Execution error:', err);
          fastBtn.innerHTML = '⚠️ Bypass Failed - Click for Manual';
          fastBtn.style.background = '#dc2626';
          setTimeout(() => {
            fastBtn.innerHTML = '⚡ Instant Direct Download';
            fastBtn.style.background = 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
            fastBtn.style.opacity = '1';
          }, 3500);
        }
      };

      if (originalEl.parentNode) {
        originalEl.parentNode.insertBefore(fastBtn, originalEl.nextSibling);
      }
    });
  }

  async function executeBackendApiMinting(recipe, originalEl, fastBtn) {
    const queryParams = new URLSearchParams();
    const bodyPayload = {};

    if (recipe.queryBindings && Array.isArray(recipe.queryBindings)) {
      for (const b of recipe.queryBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) queryParams.set(b.paramName, val);
      }
    }

    if (recipe.bodyBindings && Array.isArray(recipe.bodyBindings)) {
      for (const b of recipe.bodyBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) bodyPayload[b.paramName] = val;
      }
    }

    const apiUrl = new URL(recipe.endpointTemplate);
    queryParams.forEach((v, k) => apiUrl.searchParams.set(k, v));

    console.log(\`[DirectLink Engine] Calling Minting API: \${recipe.httpMethod} \${apiUrl.toString()}\`);

    const fetchOptions = {
      method: recipe.httpMethod || 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': window.location.href
      },
      credentials: 'include'
    };

    if (recipe.httpMethod === 'POST') {
      fetchOptions.body = JSON.stringify(bodyPayload);
    }

    const res = await fetch(apiUrl.toString(), fetchOptions);
    const contentType = res.headers.get('content-type') || '';

    let directDownloadUrl = null;

    if (contentType.includes('application/json')) {
      const data = await res.json();
      console.log('[DirectLink Engine] Received API Minting Response:', data);

      for (const key of (recipe.responseExtractors || ['download_url', 'url', 'cdn_url', 'link'])) {
        const val = getNestedProp(data, key);
        if (val && typeof val === 'string' && val.startsWith('http')) {
          directDownloadUrl = val;
          break;
        }
      }

      if (!directDownloadUrl) {
        directDownloadUrl = findFirstHttpUrl(data);
      }
    } else {
      directDownloadUrl = apiUrl.toString();
    }

    if (directDownloadUrl) {
      fastBtn.innerHTML = '✓ Download Triggered!';
      fastBtn.style.opacity = '1';
      window.location.href = directDownloadUrl;
    } else {
      throw new Error('Could not extract download URL from API response');
    }
  }

  async function executeMultiStepChain(recipe, originalEl, fastBtn) {
    const step1 = recipe.step1;
    const queryParams = new URLSearchParams();

    if (step1.bindings) {
      for (const b of step1.bindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) queryParams.set(b.paramName, val);
      }
    }

    const brokerUrl = new URL(step1.endpoint);
    queryParams.forEach((v, k) => brokerUrl.searchParams.set(k, v));

    console.log('[DirectLink Engine] Querying Broker Step 1:', brokerUrl.toString());

    const brokerRes = await fetch(brokerUrl.toString(), {
      headers: { 'Referer': window.location.href },
      credentials: 'include'
    });

    const bridgeHtml = await brokerRes.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(bridgeHtml, 'text/html');

    let terminalLink = null;
    for (const selector of (recipe.step2?.candidateSelectors || ['#btn-download', 'a[href*="download"]'])) {
      const candidateEl = doc.querySelector(selector);
      if (candidateEl && candidateEl.getAttribute('href')) {
        const href = candidateEl.getAttribute('href');
        if (href.startsWith('http')) {
          terminalLink = href;
          break;
        } else if (href.startsWith('/')) {
          terminalLink = new URL(href, brokerUrl.origin).toString();
          break;
        }
      }
    }

    if (terminalLink) {
      console.log('[DirectLink Engine] Terminal link resolved from Bridge Page:', terminalLink);
      fastBtn.innerHTML = '✓ Download Triggered!';
      fastBtn.style.opacity = '1';
      window.location.href = terminalLink;
    } else {
      window.location.href = brokerUrl.toString();
    }
  }

  async function executeDirectUrlTemplate(recipe, originalEl, fastBtn) {
    const queryParams = new URLSearchParams();

    if (recipe.bindings && Array.isArray(recipe.bindings)) {
      for (const b of recipe.bindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) queryParams.set(b.paramName, val);
      }
    }

    const targetUrl = new URL(recipe.endpointTemplate);
    queryParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

    fastBtn.innerHTML = '✓ Download Triggered!';
    fastBtn.style.opacity = '1';
    window.location.href = targetUrl.toString();
  }

  function extractValueFromBinding(binding, originalEl) {
    let val = '';

    if (binding.sourceType === 'button_data_attr' && originalEl) {
      const attrKey = binding.attribute.replace('data-', '');
      val = originalEl.dataset[attrKey] || originalEl.getAttribute(binding.attribute) || '';
    } else if (binding.sourceType === 'meta') {
      const el = document.querySelector(binding.selector);
      if (el) val = el.getAttribute(binding.attribute || 'content') || '';
    } else if (binding.sourceType === 'data_attr') {
      const el = document.querySelector(binding.selector);
      if (el) val = el.getAttribute(binding.attribute) || el.dataset[binding.attribute.replace('data-', '')] || '';
    } else if (binding.sourceType === 'url_slug') {
      val = window.location.pathname.split('/').filter(Boolean).pop() || '';
    } else if (binding.sourceType === 'next_data') {
      const nextScript = document.getElementById('__NEXT_DATA__');
      if (nextScript) {
        try {
          const parsed = JSON.parse(nextScript.textContent);
          val = String(getNestedProp(parsed, binding.attribute) || '');
        } catch (e) {}
      }
    }

    if (binding.transform === 'btoa' && val) {
      val = btoa(val);
    }

    return val;
  }

  function getNestedProp(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function findFirstHttpUrl(obj) {
    if (!obj || typeof obj !== 'object') return null;
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.startsWith('http') && !val.includes('logo') && !val.includes('.png')) {
        return val;
      }
      if (typeof val === 'object') {
        const found = findFirstHttpUrl(val);
        if (found) return found;
      }
    }
    return null;
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
    <span>DirectLink v2.0 • Multi-Step & Backend API Resolver</span>
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
        const strategyLabel = res.recipe.strategy === 'BACKEND_API_MINTER' 
          ? 'Backend Minting API' 
          : res.recipe.strategy === 'MULTI_STEP_CHAIN' 
            ? 'Multi-Step Broker Chain' 
            : 'Direct URL Template';
        alert(\`🎉 Success! Generated \${strategyLabel} recipe for \${res.domain}.\`);
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
          <span class="recipe-rules">\${recipe.strategy || 'DIRECT'} • \${recipe.description ? recipe.description.slice(0, 45) + '...' : ''}</span>
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
> **Now supporting Multi-Step DAGs, Backend API Minting, and Chained Intermediate Brokers.**

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

## 🧠 Advanced Resolution Architectures Supported:
1. **Direct URL Template Matching**: Parameters extracted from source page are bound into the final link.
2. **Backend API Minting**: The website uses button/DOM data to call an internal/external API, which mints and returns the download link JSON. The extension calls this API directly on future pages.
3. **Chained Intermediate Brokers**: The website calls an intermediate gateway/broker that yields a bridge page containing the real download button. The extension resolves this bridge in the background with zero ads.
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
