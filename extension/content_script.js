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

  // Check if an active recipe exists for this domain
  chrome.storage.local.get([`recipe_${currentDomain}`], (res) => {
    const recipe = res[`recipe_${currentDomain}`];
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
   * Capture deep DOM entities including download button attributes
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

    // 3. Download Button Specific Dataset (crucial when website calls backend API from button metadata!)
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

    // 4. Next.js SSR Hydration AST
    let nextData = null;
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        nextData = JSON.parse(nextScript.textContent);
      } catch (e) {}
    }

    // 5. URL slug tokens
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

  /**
   * Inject 1-Click Instant Bypass Button into the webpage
   */
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

  /**
   * Strategy 1: Backend API Minting
   * The page uses information from the current page/button to call an API, which responds with the download URL.
   */
  async function executeBackendApiMinting(recipe, originalEl, fastBtn) {
    const queryParams = new URLSearchParams();
    const bodyPayload = {};

    // 1. Evaluate query bindings
    if (recipe.queryBindings && Array.isArray(recipe.queryBindings)) {
      for (const b of recipe.queryBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) queryParams.set(b.paramName, val);
      }
    }

    // 2. Evaluate body bindings for POST
    if (recipe.bodyBindings && Array.isArray(recipe.bodyBindings)) {
      for (const b of recipe.bodyBindings) {
        const val = extractValueFromBinding(b, originalEl);
        if (val) bodyPayload[b.paramName] = val;
      }
    }

    const apiUrl = new URL(recipe.endpointTemplate);
    queryParams.forEach((v, k) => apiUrl.searchParams.set(k, v));

    console.log(`[DirectLink Engine] Calling Minting API: ${recipe.httpMethod} ${apiUrl.toString()}`);

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
    const contentType = res.headers.get('content-type') || '';

    let directDownloadUrl = null;

    if (contentType.includes('application/json')) {
      const data = await res.json();
      console.log('[DirectLink Engine] Received API Minting Response:', data);

      // Search response extractors
      for (const key of (recipe.responseExtractors || ['download_url', 'url', 'cdn_url', 'link'])) {
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
      // Direct binary stream or redirect response
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
      window.location.href = terminalLink;
    } else {
      // Fallback: direct navigation to broker if bridge parsing failed
      window.location.href = brokerUrl.toString();
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
    window.location.href = targetUrl.toString();
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
