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
    const isInternalBackend = this.isSameApexDomain(apiObj.hostname, sourceHostname);

    // 1. Bind query parameters from API request
    const apiParams = {};
    apiObj.searchParams.forEach((v, k) => { apiParams[k] = v; });
    const queryBindings = this.resolveBindings(sourceDom, apiParams);

    // 2. Bind path parameters (e.g., /api/v1/books/dl/:bookId)
    const pathSegments = apiObj.pathname.split('/').filter(Boolean);
    const pathBindings = [];
    const templatedSegments = pathSegments.map((segment, index) => {
      // Check if segment is dynamic (hex ID, UUID, numeric ID, or found in source DOM)
      const isDynamic = /^[a-f0-9]{8,64}$/i.test(segment) ||
                        /^[0-9]+$/.test(segment) ||
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

      if (isDynamic) {
        // Try to bind this dynamic token to the source DOM
        const matchedBinding = this.findTokenInSourceDom(sourceDom, segment, `path_param_${index}`);
        if (matchedBinding) {
          pathBindings.push(matchedBinding);
          return `{${matchedBinding.paramName}}`;
        } else {
          // If not directly found, record it as a resource ID template with regex fallback
          const tokenName = 'resourceId';
          pathBindings.push({
            paramName: tokenName,
            segmentIndex: index,
            tokenExample: segment,
            sourceType: 'inferred_resource_id',
            idLength: segment.length,
            isHex: /^[a-f0-9]+$/i.test(segment),
            description: `Dynamic REST ID (${segment.length}-char ${/^[a-f0-9]+$/i.test(segment) ? 'hex' : 'token'}) in API path`
          });
          return `{${tokenName}}`;
        }
      }
      return segment;
    });

    const templatedPathname = '/' + templatedSegments.join('/');

    // 3. If POST request, also match body parameters
    let bodyBindings = [];
    if (apiHop.requestBody && typeof apiHop.requestBody === 'object') {
      bodyBindings = this.resolveBindings(sourceDom, apiHop.requestBody);
    }

    // Normalized combined bindings array for compatibility
    const allBindings = [...queryBindings, ...pathBindings, ...bodyBindings];

    return {
      domain: sourceHostname,
      strategy: 'BACKEND_API_MINTER',
      description: isInternalBackend
        ? 'Website calls internal backend API with resource identifier to mint direct download link'
        : 'Website calls external API service to generate authorized download token',
      endpointTemplate: `${apiObj.origin}${templatedPathname}`,
      httpMethod: apiHop.method || 'GET',
      isInternalBackend,
      queryBindings,
      pathBindings,
      bodyBindings,
      bindings: allBindings,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': sourceDom.url
      },
      // Inferred response JSON field containing the final download link
      responseExtractors: ['download_url', 'cdn_url', 'direct_url', 'file_url', 'url', 'link', 'data.download_url', 'data.url', 'data'],
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
      bindings: step1Bindings,
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

  /**
   * Check if two hostnames share the same apex root domain
   * e.g. api.allcompetitionclasses.com and www.allcompetitionclasses.com share allcompetitionclasses.com
   */
  static isSameApexDomain(hostA, hostB) {
    if (!hostA || !hostB) return false;
    if (hostA === hostB) return true;
    const partsA = hostA.split('.').slice(-2).join('.');
    const partsB = hostB.split('.').slice(-2).join('.');
    return partsA === partsB;
  }

  /**
   * Search for an arbitrary dynamic token (e.g. hex ID, book ID) in the source DOM snapshot
   */
  static findTokenInSourceDom(sourceDom, token, defaultParamName = 'id') {
    if (!token || token.length < 3) return null;

    // 1. Next.js state
    if (sourceDom.nextData) {
      const jsonPath = this.searchObject(sourceDom.nextData, token);
      if (jsonPath) {
        return {
          paramName: defaultParamName,
          tokenExample: token,
          sourceType: 'next_data',
          selector: `__NEXT_DATA__.${jsonPath}`,
          attribute: jsonPath,
          transform: 'json_prop',
          confidence: 0.99,
          description: `Extracted from Next.js Hydration: ${jsonPath}`
        };
      }
    }

    // 2. Button Dataset
    if (sourceDom.buttonDataset) {
      for (const [k, v] of Object.entries(sourceDom.buttonDataset)) {
        if (v === token || (typeof v === 'string' && v.includes(token))) {
          return {
            paramName: defaultParamName,
            tokenExample: token,
            sourceType: 'button_data_attr',
            selector: 'button, a',
            attribute: `data-${k}`,
            transform: 'identity',
            confidence: 0.98,
            description: `Extracted from button data-${k}`
          };
        }
      }
    }

    // 3. DOM data attributes
    if (sourceDom.dataAttributes) {
      for (const [k, v] of Object.entries(sourceDom.dataAttributes)) {
        if (v === token) {
          return {
            paramName: defaultParamName,
            tokenExample: token,
            sourceType: 'data_attr',
            selector: `[data-${k}]`,
            attribute: `data-${k}`,
            transform: 'identity',
            confidence: 0.95,
            description: `Extracted from data-${k}`
          };
        }
      }
    }

    // 4. Meta tags
    if (sourceDom.metaTags) {
      for (const [k, v] of Object.entries(sourceDom.metaTags)) {
        if (v === token) {
          return {
            paramName: defaultParamName,
            tokenExample: token,
            sourceType: 'meta',
            selector: `meta[name="${k}"]`,
            attribute: 'content',
            transform: 'identity',
            confidence: 0.95,
            description: `Extracted from <meta name="${k}">`
          };
        }
      }
    }

    // 5. Inlined script tags
    if (sourceDom.allScripts && Array.isArray(sourceDom.allScripts)) {
      for (let i = 0; i < sourceDom.allScripts.length; i++) {
        const scriptText = sourceDom.allScripts[i];
        if (scriptText.includes(token)) {
          return {
            paramName: defaultParamName,
            tokenExample: token,
            sourceType: 'inline_script',
            scriptIndex: i,
            regex: `(?:"|_id|id|book_id)["':\\s]+(["']?${token}["']?)`,
            confidence: 0.92,
            description: `Extracted from inline script #${i}`
          };
        }
      }
    }

    return null;
  }
}
