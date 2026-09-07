/**
 * DirectLink Content Script
 * 1. Takes DOM snapshots when user tags a source page.
 * 2. Injects 1-Click Instant Bypass buttons on pages matching active recipes.
 */

(async function () {
  const currentDomain = window.location.hostname;

  // Check if a recipe exists for this domain
  chrome.storage.local.get([`recipe_${currentDomain}`], (res) => {
    const recipe = res[`recipe_${currentDomain}`];
    if (recipe && recipe.bindings) {
      console.log('[DirectLink Engine] Active recipe found for:', currentDomain);
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
      // Find candidate links or terminal URLs on current page
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
   * Capture rich DOM entities for relationship solving
   */
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

    // Check for Next.js SSR Hydration
    let nextData = null;
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        nextData = JSON.parse(nextScript.textContent);
      } catch (e) {}
    }

    // URL slug tokens
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

  /**
   * Inject 1-Click Instant Bypass Button into the webpage
   */
  function injectDirectBypassUI(recipe) {
    // Find potential download buttons or links
    const targetElements = document.querySelectorAll(
      '#btn-download, #download-button, .download-btn, .btn-download, a[href*="download"], [data-action="download"], button:not([data-directlink])'
    );

    if (targetElements.length === 0) return;

    targetElements.forEach(originalEl => {
      // Prevent double injection
      if (originalEl.getAttribute('data-directlink-processed')) return;
      originalEl.setAttribute('data-directlink-processed', 'true');

      // Create Fast 1-Click Button
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

        fastBtn.innerHTML = '⏳ Resolving Direct Download Link...';
        fastBtn.style.opacity = '0.7';

        try {
          // 1. Evaluate bindings against live DOM
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

              // Apply transforms if specified
              if (b.transform === 'btoa' && extractedVal) {
                extractedVal = btoa(extractedVal);
              }

              if (extractedVal) {
                queryParams.set(b.paramName, extractedVal);
              }
            }
          }

          // 2. Build final request URL
          const targetUrl = new URL(recipe.endpointTemplate);
          queryParams.forEach((v, k) => {
            targetUrl.searchParams.set(k, v);
          });

          console.log('[DirectLink Engine] Fetching direct stream from:', targetUrl.toString());

          // 3. Query Minting API directly
          const response = await fetch(targetUrl.toString(), {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Referer': window.location.href
            }
          });

          // Check if response is JSON containing a direct CDN URL
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            const directUrl = data.cdn_direct_url || data.download_url || data.url || data.link || targetUrl.toString();
            fastBtn.innerHTML = '✓ Download Triggered!';
            window.location.href = directUrl;
          } else {
            // Direct binary or redirect
            fastBtn.innerHTML = '✓ Download Triggered!';
            window.location.href = targetUrl.toString();
          }

          setTimeout(() => {
            fastBtn.innerHTML = '⚡ Instant Direct Download <span style="font-size:10px; opacity:0.8;">(DirectLink)</span>';
            fastBtn.style.opacity = '1';
          }, 3000);

        } catch (err) {
          console.error('[DirectLink Engine] Failed to execute instant bypass:', err);
          fastBtn.innerHTML = '⚠️ Bypass Failed - Click for Manual';
          fastBtn.style.background = '#dc2626';
          setTimeout(() => {
            fastBtn.innerHTML = '⚡ Instant Direct Download';
            fastBtn.style.background = 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
            fastBtn.style.opacity = '1';
          }, 3000);
        }
      };

      // Insert adjacent to original button
      if (originalEl.parentNode) {
        originalEl.parentNode.insertBefore(fastBtn, originalEl.nextSibling);
      }
    });
  }
})();
