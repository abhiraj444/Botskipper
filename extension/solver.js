/**
 * DirectLink Relationship Solver Engine
 * Reverse-engineers the relationship between Source DOM entities and Target API endpoints.
 */

export class RelationshipSolver {
  /**
   * Main inference entry point.
   * @param {Object} sourceDom - Snapshot of source page DOM (meta tags, data-attrs, nextData, urlTokens)
   * @param {string} targetUrl - The final download URL or minting API request URL
   * @param {Object} [targetBody] - Optional POST payload if target was an AJAX call
   * @returns {Array<Object>} List of inferred bindings and synthesis recipe
   */
  static solve(sourceDom, targetUrl, targetBody = null) {
    const bindings = [];
    const targetUrlObj = new URL(targetUrl);
    const targetParams = {};

    // 1. Collect target parameters from search query
    targetUrlObj.searchParams.forEach((value, key) => {
      targetParams[key] = value;
    });

    // 2. Collect target parameters from JSON body if present
    if (targetBody && typeof targetBody === 'object') {
      Object.entries(targetBody).forEach(([key, val]) => {
        targetParams[key] = String(val);
      });
    }

    // 3. For each target parameter, find its provenance in the source DOM
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

      // Strategy B: Match in data-* attributes
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
              description: `Extracted from DOM attribute data-${attrName}`
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
        // Check if decoded value matches any source token or ID
        if (sourceDom.dataAttributes) {
          for (const [attrName, attrVal] of Object.entries(sourceDom.dataAttributes)) {
            if (attrVal === decoded) {
              bindings.push({
                paramName,
                sourceType: 'data_attr',
                selector: `[data-${attrName}]`,
                attribute: `data-${attrName}`,
                transform: 'btoa',
                confidence: 0.98,
                description: `Base64 encoded from data-${attrName}`
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
      } catch (e) {
        // Not a valid base64 string, proceed
      }

      if (matched) continue;

      // Strategy D: SSR / Next.js Hydration AST Recursive Prober
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
              description: `Extracted from URL slug segment`
            });
            matched = true;
            break;
          }
        }
      }
    }

    // 4. Construct synthesized recipe
    const endpointTemplate = `${targetUrlObj.origin}${targetUrlObj.pathname}`;
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

  /**
   * Helper to recursively search an object for a target string value.
   */
  static searchObject(obj, targetVal, currentPath = '') {
    if (!obj || typeof obj !== 'object') return null;
    for (const [key, val] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
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

  /**
   * Check if target URL belongs to a known external file hosting service
   */
  static isExternalHub(url) {
    const hubDomains = ['mediafire.com', 'mega.nz', 'drive.google.com', 'rapidgator.net', 's3.amazonaws.com', 'r2.cloudflarestorage.com'];
    return hubDomains.some(hub => url.includes(hub));
  }
}
