/**
 * DirectLink Relationship Solver Engine (v2 - Multi-Step & Backend API Resolver)
 * Reverse-engineers:
 * 1. Direct URL Templates (static parameter alignment)
 * 2. Backend Minting APIs (Internal / External APIs called with page/button metadata)
 * 3. Chained Intermediate Brokers (Source -> Broker API -> Bridge Page -> Terminal Download)
 */

export class RelationshipSolver {
  /**
   * Main inference entry point.
   * @param {Object} sourceDom - Snapshot of source page DOM (meta tags, data-attrs, nextData, urlTokens, buttonDataset)
   * @param {string} targetUrl - The final download URL or minting API request URL
   * @param {Object} [targetBody] - Optional POST payload
   * @param {Array<Object>} [networkHops] - Network requests captured during the recording session
   * @returns {Object} Synthesized multi-step execution recipe
   */
  static solve(sourceDom, targetUrl, targetBody = null, networkHops = []) {
    // 1. Check if there was an intermediate Minting API request in the network trace
    const mintingApiHop = this.findMintingApiHop(networkHops, targetUrl);

    if (mintingApiHop) {
      console.log('[RelationshipSolver] Detected Backend Minting API:', mintingApiHop.url);
      return this.synthesizeApiMinterRecipe(sourceDom, mintingApiHop, targetUrl);
    }

    // 2. Check if this is a Multi-Hop Chained Broker (intermediate service called with page data)
    const brokerHop = this.findBrokerHop(networkHops, sourceDom);
    if (brokerHop && brokerHop.url !== targetUrl) {
      console.log('[RelationshipSolver] Detected Chained Broker Hop:', brokerHop.url);
      return this.synthesizeChainedBrokerRecipe(sourceDom, brokerHop, targetUrl);
    }

    // 3. Fallback to Direct URL Parameter Alignment
    return this.synthesizeDirectUrlRecipe(sourceDom, targetUrl, targetBody);
  }

  /**
   * Inspects network trace to find if an internal or external API call mints the download URL
   */
  static findMintingApiHop(networkHops, targetUrl) {
    if (!networkHops || networkHops.length === 0) return null;

    // Look for requests with API / JSON / Minting indicators
    const apiKeywords = ['/api/', '/ajax/', 'mint', 'get-link', 'generate', 'download', 'resolve', 'ticket', 'token', 'file-stream'];
    
    // Reverse search (most recent requests before target)
    for (let i = networkHops.length - 1; i >= 0; i--) {
      const hop = networkHops[i];
      if (!hop.url) continue;

      // Ignore pure ad network tracking calls
      if (this.isAdTracker(hop.url)) continue;

      // Check if URL matches API pattern
      const isApi = apiKeywords.some(kw => hop.url.toLowerCase().includes(kw)) ||
                    hop.type === 'xmlhttprequest' ||
                    hop.type === 'fetch';

      if (isApi) {
        return hop;
      }
    }
    return null;
  }

  /**
   * Detects intermediate broker websites or external gateways
   */
  static findBrokerHop(networkHops, sourceDom) {
    if (!networkHops || networkHops.length === 0) return null;
    const sourceHostname = new URL(sourceDom.url).hostname;

    for (const hop of networkHops) {
      if (!hop.url) continue;
      if (this.isAdTracker(hop.url)) continue;

      const hopHost = new URL(hop.url).hostname;
      // Hop on different domain or dedicated gateway path
      if (hopHost !== sourceHostname || hop.url.includes('/gateway') || hop.url.includes('/bridge') || hop.url.includes('/link/')) {
        return hop;
      }
    }
    return null;
  }

  /**
   * Synthesize an API Minting Recipe (Website calls its own/external backend with button/DOM info)
   */
  static synthesizeApiMinterRecipe(sourceDom, apiHop, finalDownloadUrl) {
    const apiObj = new URL(apiHop.url);
    const sourceHostname = new URL(sourceDom.url).hostname;
    const isInternalBackend = apiObj.hostname === sourceHostname;

    // Bind parameters from Source DOM into API request
    const apiParams = {};
    apiObj.searchParams.forEach((v, k) => { apiParams[k] = v; });

    const bindings = this.resolveBindings(sourceDom, apiParams);

    // If POST request, also match body parameters
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
      endpointTemplate: `${apiObj.origin}${apiObj.pathname}`,
      httpMethod: apiHop.method || 'GET',
      isInternalBackend,
      queryBindings: bindings,
      bodyBindings: bodyBindings,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': sourceDom.url
      },
      // Inferred response JSON field containing the final download link
      responseExtractors: ['download_url', 'cdn_url', 'direct_url', 'file_url', 'url', 'link', 'data.download_url', 'data.url'],
      finalDownloadUrlExample: finalDownloadUrl,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Synthesize a Multi-Step Chained Broker Recipe
   */
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
        endpoint: `${brokerObj.origin}${brokerObj.pathname}`,
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

  /**
   * Synthesize a Direct URL Template Recipe (Static parameters match)
   */
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
      endpointTemplate: `${targetUrlObj.origin}${targetUrlObj.pathname}`,
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

  /**
   * Core parameter matcher: Matches target/API params to source DOM entities
   */
  static resolveBindings(sourceDom, targetParams) {
    const bindings = [];

    for (const [paramName, paramVal] of Object.entries(targetParams)) {
      if (!paramVal || paramVal.length < 2) continue;
      let matched = false;

      // 1. Match in Download Button Dataset (e.g. data-id, data-file-key on the button itself!)
      if (sourceDom.buttonDataset) {
        for (const [attrName, attrVal] of Object.entries(sourceDom.buttonDataset)) {
          if (attrVal === paramVal) {
            bindings.push({
              paramName,
              sourceType: 'button_data_attr',
              selector: '#download-btn, [data-action="download"], .download-btn, a[href*="download"]',
              attribute: `data-${attrName}`,
              transform: 'identity',
              confidence: 0.99,
              description: `Extracted directly from original Download Button (data-${attrName})`
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
              selector: `meta[name="${metaName}"]`,
              attribute: 'content',
              transform: 'identity',
              confidence: 1.0,
              description: `Extracted from <meta name="${metaName}">`
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
              selector: `[data-${attrName}]`,
              attribute: `data-${attrName}`,
              transform: 'identity',
              confidence: 0.95,
              description: `Extracted from page DOM attribute data-${attrName}`
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
                attribute: `data-${attrName}`,
                transform: 'btoa',
                confidence: 0.98,
                description: `Base64 encoded from Download Button attribute data-${attrName}`
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
                description: `Base64 encoded from URL token "${token}"`
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
            selector: `__NEXT_DATA__.${jsonPath}`,
            attribute: jsonPath,
            transform: 'json_prop',
            confidence: 0.99,
            description: `Extracted from Next.js Hydration: ${jsonPath}`
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
              description: `Extracted from URL slug segment`
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
      const newPath = currentPath ? `${currentPath}.${key}` : key;
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
}
