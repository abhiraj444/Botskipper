/**
 * DirectLink Content Script (v2 - Multi-Step & Backend API Resolver)
 * 1. Takes deep DOM snapshots (including button dataset & Next.js state)
 * 2. Injects 1-Click Instant Bypass buttons
 * 3. Executes Multi-Step DAGs:
 *    - Direct URL Templates
 *    - Backend API Minting (Internal/External XHR with page metadata)
 *    - Chained Brokers (Intermediate service -> Bridge page -> Terminal button)
 */

(async function () {
  const currentDomain = window.location.hostname;
  const bareDomain = currentDomain.replace(/^www\./, '');
  const wwwDomain = `www.${bareDomain}`;

  // Check if an active recipe exists for this domain (checking bare and www forms)
  chrome.storage.local.get([`recipe_${currentDomain}`, `recipe_${bareDomain}`, `recipe_${wwwDomain}`], (res) => {
    const recipe = res[`recipe_${currentDomain}`] || res[`recipe_${bareDomain}`] || res[`recipe_${wwwDomain}`];
    if (recipe) {
      console.log(`[DirectLink Engine] Active recipe found for ${currentDomain} (${recipe.strategy})`);
      injectDirectBypassUI(recipe);
    }
  });

  // Listen for instructions from popup
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

  /**
   * Capture deep DOM entities including all scripts, text, and download button attributes
   */
  function captureCurrentDomSnapshot() {
    // 1. Meta tags
    const metaTags = {};
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });

    // 2. Global data attributes
    const dataAttributes = {};
    document.querySelectorAll('[data-id], [data-book-id], [data-file], [data-hash], [data-slug], [data-key]').forEach(el => {
      for (const [k, v] of Object.entries(el.dataset)) {
        dataAttributes[k] = v;
      }
    });

    // 3. Download Button Specific Dataset & Anchors (including ad shorteners like shrinkme)
    const buttonDataset = {};
    const downloadBtns = findDownloadCandidates();
    downloadBtns.forEach(btn => {
      for (const [k, v] of Object.entries(btn.dataset)) {
        buttonDataset[k] = v;
      }
      const href = btn.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        buttonDataset['button_href'] = href;
      }
      if (btn.id) buttonDataset['button_id'] = btn.id;
      if (btn.className) buttonDataset['button_class'] = btn.className;
    });

    // 4. Next.js SSR Hydration AST
    let nextData = null;
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        nextData = JSON.parse(nextScript.textContent);
      } catch (e) {}
    }

    // 5. Inlined scripts texts (for finding embedded IDs, hashes, tokens)
    const allScripts = [];
    document.querySelectorAll('script:not([src])').forEach(s => {
      if (s.textContent && s.textContent.length < 50000) {
        allScripts.push(s.textContent);
      }
    });

    // 6. URL slug tokens
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    return {
      url: window.location.href,
      title: document.title,
      metaTags,
      dataAttributes,
      buttonDataset,
      nextData,
      allScripts: allScripts.slice(0, 15),
      urlTokens: pathParts
    };
  }

  /**
   * Intelligently find download buttons, links, or ad shortener anchors on the page
   */
  function findDownloadCandidates() {
    const candidates = [];
    const elements = document.querySelectorAll('a, button, [role="button"], input[type="button"], input[type="submit"]');

    const downloadRegex = /(?:download|get\s*file|get\s*pdf|download\s*pdf|pdf\s*download|direct\s*download|click\s*here\s*to\s*download|free\s*download)/i;
    const adShortenerRegex = /(?:shrinkme|themezon|mrproblogger|gplinks|droplink|linkvertise|ouo\.io|shorturl|bit\.ly|tinyurl)/i;

    elements.forEach(el => {
      if (el.hasAttribute('data-directlink')) return; // Skip our own button

      const text = (el.textContent || el.innerText || '').trim();
      const href = el.getAttribute('href') || '';
      const id = el.id || '';
      const cls = el.className || '';
      const title = el.getAttribute('title') || '';
      const aria = el.getAttribute('aria-label') || '';

      const isTextMatch = downloadRegex.test(text) || downloadRegex.test(title) || downloadRegex.test(aria);
      const isHrefMatch = href.includes('download') || adShortenerRegex.test(href);
      const isClassOrIdMatch = id.toLowerCase().includes('download') || (typeof cls === 'string' && cls.toLowerCase().includes('download'));

      if (isTextMatch || isHrefMatch || isClassOrIdMatch) {
        candidates.push(el);
      }
    });

    return candidates;
  }

  /**
   * Inject 1-Click Instant Bypass Button & Floating Action Bar
   */
  function injectDirectBypassUI(recipe) {
    // 1. Inject inline buttons next to existing download links
    injectInlineButtons(recipe);

    // 2. Always inject persistent floating action bar (guarantees access even if DOM buttons are hidden)
    injectFloatingActionBar(recipe);

    // 3. Setup MutationObserver for dynamic SPAs (Next.js, Vue, dynamic pagination)
    const observer = new MutationObserver(() => {
      injectInlineButtons(recipe);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectInlineButtons(recipe) {
    const targetElements = findDownloadCandidates();

    targetElements.forEach(originalEl => {
      if (originalEl.getAttribute('data-directlink-processed')) return;
      originalEl.setAttribute('data-directlink-processed', 'true');

      const fastBtn = document.createElement('button');
      fastBtn.setAttribute('data-directlink', 'true');
      fastBtn.innerHTML = '⚡ Instant Direct Download <span style="font-size:10px; opacity:0.8;">(DirectLink)</span>';
      fastBtn.style.cssText = `
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
      `;

      fastBtn.onmouseenter = () => {
        fastBtn.style.transform = 'translateY(-1px)';
        fastBtn.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.45)';
      };
      fastBtn.onmouseleave = () => {
        fastBtn.style.transform = 'none';
        fastBtn.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.35)';
      };

      fastBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBypassClick(recipe, originalEl, fastBtn);
      };

      if (originalEl.parentNode) {
        originalEl.parentNode.insertBefore(fastBtn, originalEl.nextSibling);
      }
    });
  }

  /**
   * Floating Action Bar guaranteeing 1-click bypass visibility anywhere on the page
   */
  function injectFloatingActionBar(recipe) {
    if (document.getElementById('directlink-floating-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'directlink-floating-bar';
    bar.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      backdrop-filter: blur(8px);
      animation: directlinkFadeIn 0.3s ease-out;
    `;

    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">⚡</span>
        <div>
          <div style="font-weight: 700; color: #34d399;">DirectLink Bypass Active</div>
          <div style="font-size: 11px; opacity: 0.7;">Zero-click direct download ready</div>
        </div>
      </div>
      <button id="directlink-floating-trigger" style="
        background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
        color: #ffffff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        transition: transform 0.15s ease;
      ">⚡ Download Direct</button>
      <button id="directlink-floating-close" style="
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 16px;
        padding: 2px 6px;
      ">✕</button>
    `;

    document.body.appendChild(bar);

    const triggerBtn = document.getElementById('directlink-floating-trigger');
    triggerBtn.onclick = () => {
      const candidates = findDownloadCandidates();
      handleBypassClick(recipe, candidates[0] || null, triggerBtn);
    };

    document.getElementById('directlink-floating-close').onclick = () => {
      bar.remove();
    };
  }

  async function handleBypassClick(recipe, originalEl, triggerBtn) {
    const originalHtml = triggerBtn.innerHTML;
    triggerBtn.innerHTML = '⏳ Bypassing Ads & Minting Direct Stream...';
    triggerBtn.style.opacity = '0.8';

    try {
      if (recipe.strategy === 'BACKEND_API_MINTER') {
        await executeBackendApiMinting(recipe, originalEl, triggerBtn);
      } else if (recipe.strategy === 'MULTI_STEP_CHAIN') {
        await executeMultiStepChain(recipe, originalEl, triggerBtn);
      } else {
        await executeDirectUrlTemplate(recipe, originalEl, triggerBtn);
      }
    } catch (err) {
      console.error('[DirectLink Engine] Execution error:', err);
      triggerBtn.innerHTML = '⚠️ Bypass Failed - Click for Manual';
      triggerBtn.style.background = '#dc2626';
      setTimeout(() => {
        triggerBtn.innerHTML = originalHtml;
        triggerBtn.style.background = 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
        triggerBtn.style.opacity = '1';
      }, 4000);
    }
  }

  /**
   * Strategy 1: Backend API Minting
   * The page uses information from the current page/button to call an API, which responds with the download URL.
   */
  async function executeBackendApiMinting(recipe, originalEl, fastBtn) {
    const queryParams = new URLSearchParams();
    const bodyPayload = {};

    let endpointStr = recipe.endpointTemplate;

    // 1. Substitute Path Parameters (e.g. /api/v1/books/dl/{resourceId})
    if (recipe.pathBindings && Array.isArray(recipe.pathBindings)) {
      for (const pb of recipe.pathBindings) {
        let val = extractValueFromBinding(pb, originalEl);
        if (!val) {
          // Dynamic hex/resource ID fallback on current page
          val = findDynamicResourceIdOnPage(pb.idLength || 16, pb.tokenExample);
        }
        if (val) {
          endpointStr = endpointStr.replace(`{${pb.paramName}}`, val);
        }
      }
    }

    // Fallback: If endpoint still has {placeholder} or if it has a hardcoded ID from previous session
    if (endpointStr.includes('{')) {
      const pageId = findDynamicResourceIdOnPage(16);
      if (pageId) {
        endpointStr = endpointStr.replace(/\{[^}]+\}/g, pageId);
      }
    } else if (/\/books\/dl\/[a-f0-9]{12,64}/i.test(endpointStr)) {
      // Auto-generalize if endpoint was saved with a specific book ID from recording session
      const pageId = findDynamicResourceIdOnPage(16);
      if (pageId) {
        endpointStr = endpointStr.replace(/\/books\/dl\/[a-f0-9]{12,64}/i, `/books/dl/${pageId}`);
      }
    }

    // 2. Evaluate query bindings
    if (recipe.queryBindings && Array.isArray(recipe.queryBindings)) {
      for (const b of recipe.queryBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) queryParams.set(b.paramName, val);
      }
    }

    // 3. Evaluate body bindings for POST
    if (recipe.bodyBindings && Array.isArray(recipe.bodyBindings)) {
      for (const b of recipe.bodyBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) bodyPayload[b.paramName] = val;
      }
    }

    const apiUrl = new URL(endpointStr);
    queryParams.forEach((v, k) => apiUrl.searchParams.set(k, v));

    console.log(`[DirectLink Engine] Calling Minting API: ${recipe.httpMethod || 'GET'} ${apiUrl.toString()}`);

    const fetchOptions = {
      method: recipe.httpMethod || 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': window.location.href
      },
      credentials: 'include' // include session cookies for authorization
    };

    if (recipe.httpMethod === 'POST') {
      fetchOptions.body = JSON.stringify(bodyPayload);
    }

    const res = await fetch(apiUrl.toString(), fetchOptions);

    let directDownloadUrl = null;

    if (res.redirected && res.url) {
      directDownloadUrl = res.url;
    } else {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        console.log('[DirectLink Engine] Received API Minting Response:', data);

        // Search response extractors
        for (const key of (recipe.responseExtractors || ['download_url', 'url', 'cdn_url', 'link', 'data.download_url'])) {
          const val = getNestedProp(data, key);
          if (val && typeof val === 'string' && val.startsWith('http')) {
            directDownloadUrl = val;
            break;
          }
        }

        // If no standard key matched, recursive search for http URL
        if (!directDownloadUrl) {
          directDownloadUrl = findFirstHttpUrl(data);
        }
      } else {
        // Direct binary stream
        directDownloadUrl = apiUrl.toString();
      }
    }

    if (directDownloadUrl) {
      fastBtn.innerHTML = '✓ Download Triggered!';
      fastBtn.style.opacity = '1';
      triggerBrowserDownload(directDownloadUrl);
    } else {
      throw new Error('Could not extract download URL from API response');
    }
  }

  function triggerBrowserDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1000);
  }

  /**
   * Searches the current page for dynamic hex/alphanumeric IDs (e.g. Next.js data, script tags, DOM attributes)
   */
  function findDynamicResourceIdOnPage(expectedLength = 16, excludeToken = '') {
    // 1. Next.js state
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        const parsed = JSON.parse(nextScript.textContent);
        const candidate = findIdInObject(parsed, expectedLength);
        if (candidate && candidate !== excludeToken) return candidate;
      } catch (e) {}
    }

    // 2. Scripts inspection
    const scripts = document.querySelectorAll('script:not([src])');
    for (const s of scripts) {
      const text = s.textContent || '';
      const regex = new RegExp(`(?:"(?:_id|id|book_id|file_id)"|id)\\s*:\\s*["']([a-f0-9]{${expectedLength - 4},${expectedLength + 4}})["']`, 'i');
      const match = text.match(regex);
      if (match && match[1] && match[1] !== excludeToken) {
        return match[1];
      }
    }

    // 3. DOM attributes
    const elementsWithData = document.querySelectorAll('[data-id], [data-book-id], [data-file], [data-slug]');
    for (const el of elementsWithData) {
      for (const val of Object.values(el.dataset)) {
        if (val && typeof val === 'string' && val.length >= 8 && val !== excludeToken) {
          return val;
        }
      }
    }

    // 4. Raw HTML 16-hex match
    const bodyHtml = document.body.innerHTML;
    const hexMatch = bodyHtml.match(/\b([a-f0-9]{16})\b/i);
    if (hexMatch && hexMatch[1] && hexMatch[1] !== excludeToken) {
      return hexMatch[1];
    }

    return null;
  }

  function findIdInObject(obj, targetLength) {
    if (!obj || typeof obj !== 'object') return null;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && (/^[a-f0-9]+$/i.test(v) || /id/i.test(k))) {
        if (Math.abs(v.length - targetLength) <= 4) return v;
      }
      if (typeof v === 'object') {
        const found = findIdInObject(v, targetLength);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Strategy 2: Multi-Step Chain (Broker -> Bridge Page -> Terminal Link)
   */
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

    // Fetch intermediate broker or bridge page HTML in background (avoiding ads!)
    const brokerRes = await fetch(brokerUrl.toString(), {
      headers: { 'Referer': window.location.href },
      credentials: 'include'
    });

    const bridgeHtml = await brokerRes.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(bridgeHtml, 'text/html');

    // Look for terminal download button in the bridge HTML
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
      triggerBrowserDownload(terminalLink);
    } else {
      // Fallback: direct navigation to broker if bridge parsing failed
      triggerBrowserDownload(brokerUrl.toString());
    }
  }

  /**
   * Strategy 3: Direct URL Template (Static parameters)
   */
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
    triggerBrowserDownload(targetUrl.toString());
  }

  /**
   * Dynamic extractor helper
   */
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
})();
