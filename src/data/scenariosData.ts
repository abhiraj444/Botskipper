import { ScenarioCase } from '../types';

export const SCENARIOS: ScenarioCase[] = [
  {
    id: 'edu-pdf-repository',
    title: 'Educational PDF Repository (Next.js Hydration & MD5 Hash)',
    category: 'E-Book / PDF Library',
    targetDomain: 'https://edu-resource-vault.org',
    summary: 'Single demonstration on an English Grammar book reverse-engineers a 3-step ad redirect loop with a 15-second countdown down to a direct 0-click CDN API fetch.',
    demonstrationItem: {
      name: 'Item A: High School English Grammar & Composition',
      url: 'https://edu-resource-vault.org/books/english-grammar-and-composition-wren-martin',
      domHtml: `<html lang="en">
<head>
  <link rel="canonical" href="https://edu-resource-vault.org/books/english-grammar-and-composition-wren-martin" />
  <meta name="book-id" content="bk_9948271" />
  <script id="__NEXT_DATA__" type="application/json">
    {"props":{"pageProps":{"book":{"id":"bk_9948271","slug":"english-grammar-and-composition-wren-martin","isbn":"978-8121900096","fileHash":"094875c8e2b1f4a9","storageBucket":"s3-eu-central-1"}}}}
  </script>
</head>
<body>
  <div class="book-card" data-catalog-id="cat_8820" data-resource-key="094875c8e2b1f4a9">
    <h1 class="text-2xl font-bold">English Grammar and Composition</h1>
    <button id="btn-download" class="btn-primary" data-action="initiate_ad_flow">Download PDF (48 MB)</button>
  </div>
</body>
</html>`,
      hydrationData: {
        props: {
          pageProps: {
            book: {
              id: 'bk_9948271',
              slug: 'english-grammar-and-composition-wren-martin',
              isbn: '978-8121900096',
              fileHash: '094875c8e2b1f4a9',
              storageBucket: 's3-eu-central-1'
            }
          }
        }
      },
      terminalFilename: 'English_Grammar_Wren_Martin_Full.pdf'
    },
    networkTrace: [
      {
        id: 'req-01',
        timestamp: 0,
        url: 'https://edu-resource-vault.org/books/english-grammar-and-composition-wren-martin',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'text/html; charset=utf-8',
        requestHeaders: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        responseHeaders: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': 'session_token=s_983fa90; Path=/; HttpOnly'
        },
        queryParams: {},
        durationMs: 320,
        notes: 'Initial DOM page load with embedded __NEXT_DATA__ hydration state.'
      },
      {
        id: 'req-02',
        timestamp: 450,
        url: 'https://ad-syndicate.net/v3/serve?publisher=vault88&slot=interstitial_download',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'script_ad_network',
        contentType: 'application/javascript',
        requestHeaders: { 'Referer': 'https://edu-resource-vault.org/' },
        responseHeaders: { 'Content-Type': 'application/javascript' },
        queryParams: { publisher: 'vault88', slot: 'interstitial_download' },
        durationMs: 210,
        adGateEvent: 'Ad Interstitial Triggered (Forced 15s Countdown Overlay)',
        notes: 'Monetization network script injected into DOM.'
      },
      {
        id: 'req-03',
        timestamp: 15600,
        url: 'https://edu-resource-vault.org/api/v1/ad-gate/verify-completion',
        method: 'POST',
        status: 200,
        statusText: 'OK',
        initiator: 'script_timer',
        contentType: 'application/json',
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        responseHeaders: { 'Content-Type': 'application/json' },
        queryParams: {},
        requestBody: {
          bookId: 'bk_9948271',
          adTimerSeconds: 15,
          clientTimestamp: 1718000000
        },
        responseBody: {
          status: 'verified',
          mintedPass: 'pass_ad_9948271_cleared',
          expiresIn: 300
        },
        durationMs: 140,
        adGateEvent: 'Client-side timer completion signal sent to server',
        notes: 'Analysis shows backend does not cryptographically verify ad network receipt; accepts raw bookId.'
      },
      {
        id: 'req-04',
        timestamp: 16100,
        url: 'https://edu-resource-vault.org/api/v2/download-mint?resource=094875c8e2b1f4a9&id=bk_9948271',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'script_core_api',
        contentType: 'application/json',
        requestHeaders: {
          'Accept': 'application/json',
          'Referer': 'https://edu-resource-vault.org/books/english-grammar-and-composition-wren-martin'
        },
        responseHeaders: { 'Content-Type': 'application/json' },
        queryParams: {
          resource: '094875c8e2b1f4a9',
          id: 'bk_9948271'
        },
        responseBody: {
          success: true,
          cdn_direct_url: 'https://cdn.edu-resource-vault.org/assets/s3-eu-central-1/094875c8e2b1f4a9/English_Grammar_Wren_Martin_Full.pdf',
          file_name: 'English_Grammar_Wren_Martin_Full.pdf',
          size_bytes: 50331648
        },
        isMintingCall: true,
        durationMs: 180,
        notes: 'THE MINTING CALL: Takes resource hash and bookId directly to produce final CDN asset link.'
      },
      {
        id: 'req-05',
        timestamp: 16400,
        url: 'https://cdn.edu-resource-vault.org/assets/s3-eu-central-1/094875c8e2b1f4a9/English_Grammar_Wren_Martin_Full.pdf',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'application/pdf',
        contentLength: 50331648,
        requestHeaders: { 'Accept': '*/*' },
        responseHeaders: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="English_Grammar_Wren_Martin_Full.pdf"',
          'Content-Length': '50331648'
        },
        queryParams: {},
        isTerminalAsset: true,
        durationMs: 1450,
        notes: 'TERMINAL ASSET EVENT: Direct binary stream (application/pdf, 48MB).'
      }
    ],
    inferredEntities: [
      {
        key: 'slug',
        source: 'url_slug',
        location: 'window.location.pathname.split("/").pop()',
        value: 'english-grammar-and-composition-wren-martin',
        dataType: 'string'
      },
      {
        key: 'bookId',
        source: 'meta_tag',
        location: 'meta[name="book-id"]',
        value: 'bk_9948271',
        dataType: 'string'
      },
      {
        key: 'fileHash',
        source: 'hydration_state',
        location: '__NEXT_DATA__.props.pageProps.book.fileHash',
        value: '094875c8e2b1f4a9',
        entropy: 3.82,
        dataType: 'hash_md5'
      },
      {
        key: 'storageBucket',
        source: 'hydration_state',
        location: '__NEXT_DATA__.props.pageProps.book.storageBucket',
        value: 's3-eu-central-1',
        dataType: 'string'
      },
      {
        key: 'resourceKeyAttr',
        source: 'data_attribute',
        location: '.book-card[data-resource-key]',
        value: '094875c8e2b1f4a9',
        dataType: 'hash_md5'
      }
    ],
    correlations: [
      {
        targetLocation: 'query',
        targetParamName: 'resource',
        observedValue: '094875c8e2b1f4a9',
        matchedEntityKey: 'fileHash',
        transformation: 'ast_json_path',
        confidenceScore: 0.99,
        derivationDescription: 'Exact match between Minting API ?resource param and Next.js hydration book.fileHash (and DOM data-resource-key attribute).'
      },
      {
        targetLocation: 'query',
        targetParamName: 'id',
        observedValue: 'bk_9948271',
        matchedEntityKey: 'bookId',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Exact match between Minting API ?id param and meta[name="book-id"] tag.'
      }
    ],
    synthesizedRecipe: {
      id: 'recipe-edu-vault-v1',
      version: '1.2.0',
      sitePattern: '^https://edu-resource-vault\\.org/books/([a-zA-Z0-9_-]+)$',
      description: 'Zero-Click Direct Ingestion Recipe for EduResourceVault Books without Ad Loops.',
      extractors: [
        {
          key: 'bookId',
          type: 'css_selector',
          target: 'meta',
          pattern: 'meta[name="book-id"]',
          transform: 'attr(content)'
        },
        {
          key: 'fileHash',
          type: 'json_path',
          target: 'hydration_state',
          pattern: '$.props.pageProps.book.fileHash'
        },
        {
          key: 'slug',
          type: 'regex',
          target: 'url',
          pattern: '/books/([^/?#]+)'
        }
      ],
      mintingRequest: {
        endpoint: 'https://edu-resource-vault.org/api/v2/download-mint',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://edu-resource-vault.org/books/{{slug}}'
        },
        params: {
          'resource': '{{fileHash}}',
          'id': '{{bookId}}'
        },
        responseTokenExtractor: {
          location: 'json_path',
          path: '$.cdn_direct_url'
        }
      },
      terminalRequest: {
        endpointTemplate: '{{mintingResult}}',
        method: 'GET',
        headers: {
          'Accept': '*/*'
        },
        expectedContentType: 'application/pdf'
      },
      gatekeeperMitigation: {
        tokenType: 'deterministic',
        tlsImpersonationRequired: false,
        cookiePropagation: true,
        delayRequiredSeconds: 0,
        notes: 'Ad-gate verification endpoint is completely bypassable. The minting API directly returns the S3 CDN presigned URL without checking ad network completion status.'
      }
    },
    hurdlesEncountered: [
      {
        hurdle: 'implicit_dom_linkage',
        difficulty: 'Medium',
        finding: 'Resource hash was not in the URL slug, but safely isolated inside the Next.js hydration payload and DOM data-attribute.',
        resolution: 'AST JSON-LD / __NEXT_DATA__ extractor isolates fileHash in 4 milliseconds.'
      },
      {
        hurdle: 'ad_attestation',
        difficulty: 'Low',
        finding: 'The 15-second interstitial ad is enforced purely by client-side JS setTimeout. The server minting endpoint /api/v2/download-mint has zero server-side gating.',
        resolution: 'Directly omit the ad verification call (Req 02 & Req 03) and query the minting endpoint directly.'
      }
    ],
    generalizationTestItems: [
      {
        name: 'Item B: Quantitative Aptitude for Competitive Examinations (R.S. Aggarwal)',
        url: 'https://edu-resource-vault.org/books/quantitative-aptitude-rs-aggarwal',
        domSnippet: '<meta name="book-id" content="bk_5510294" /><script id="__NEXT_DATA__">{"props":{"pageProps":{"book":{"id":"bk_5510294","slug":"quantitative-aptitude-rs-aggarwal","fileHash":"77a1029bf33c419e"}}}}</script>',
        hydrationSnippet: '{"props":{"pageProps":{"book":{"id":"bk_5510294","fileHash":"77a1029bf33c419e"}}}}',
        expectedResult: {
          extractedEntities: {
            bookId: 'bk_5510294',
            fileHash: '77a1029bf33c419e',
            slug: 'quantitative-aptitude-rs-aggarwal'
          },
          mintingUrl: 'https://edu-resource-vault.org/api/v2/download-mint?resource=77a1029bf33c419e&id=bk_5510294',
          terminalAssetUrl: 'https://cdn.edu-resource-vault.org/assets/s3-eu-central-1/77a1029bf33c419e/Quantitative_Aptitude_RS_Aggarwal.pdf',
          fileSize: '62.4 MB',
          contentType: 'application/pdf',
          timeSavedSeconds: 22.5,
          adInteractionsBypassed: 3
        }
      },
      {
        name: 'Item C: Concepts of Physics (H.C. Verma Vol 1)',
        url: 'https://edu-resource-vault.org/books/concepts-of-physics-hc-verma-vol-1',
        domSnippet: '<meta name="book-id" content="bk_1092483" /><script id="__NEXT_DATA__">{"props":{"pageProps":{"book":{"id":"bk_1092483","slug":"concepts-of-physics-hc-verma-vol-1","fileHash":"11ca998f55da201b"}}}}</script>',
        hydrationSnippet: '{"props":{"pageProps":{"book":{"id":"bk_1092483","fileHash":"11ca998f55da201b"}}}}',
        expectedResult: {
          extractedEntities: {
            bookId: 'bk_1092483',
            fileHash: '11ca998f55da201b',
            slug: 'concepts-of-physics-hc-verma-vol-1'
          },
          mintingUrl: 'https://edu-resource-vault.org/api/v2/download-mint?resource=11ca998f55da201b&id=bk_1092483',
          terminalAssetUrl: 'https://cdn.edu-resource-vault.org/assets/s3-eu-central-1/11ca998f55da201b/Concepts_of_Physics_HCV_Vol1.pdf',
          fileSize: '38.1 MB',
          contentType: 'application/pdf',
          timeSavedSeconds: 18.2,
          adInteractionsBypassed: 3
        }
      }
    ]
  },
  {
    id: 'media-vault-archive',
    title: 'Media Archive Hub (Base64 & Dynamic Data Attributes)',
    category: 'Lossless Audio / Dataset Archive',
    targetDomain: 'https://lossless-master-archive.cc',
    summary: 'Reverse-engineers an obfuscated media vault that forces 2 popup tab-under ads before decoding a base64 encoded token from a custom DOM tag.',
    demonstrationItem: {
      name: 'Item A: FLAC Master Studio Tape Vol 4',
      url: 'https://lossless-master-archive.cc/archive/master-tape-vol-4',
      domHtml: `<html lang="en">
<head>
  <title>Master Studio Tape Vol 4 — Lossless Archive</title>
  <meta property="og:asset:id" content="arc_tape_9901" />
</head>
<body data-session="sess_live_4491">
  <div class="archive-header" data-asset-code="YXJjX3RhcGVfOTkwMQ==" data-vault-cluster="node-ams-02">
    <h1>FLAC Master Studio Tape Vol 4</h1>
    <div id="countdown-holder" class="timer-box">Please wait 10 seconds for mirrors...</div>
  </div>
</body>
</html>`,
      terminalFilename: 'Studio_Tape_Vol4_24bit_96khz.zip'
    },
    networkTrace: [
      {
        id: 'mv-01',
        timestamp: 0,
        url: 'https://lossless-master-archive.cc/archive/master-tape-vol-4',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'text/html; charset=utf-8',
        requestHeaders: { 'User-Agent': 'Mozilla/5.0' },
        responseHeaders: { 'Content-Type': 'text/html; charset=utf-8' },
        queryParams: {},
        durationMs: 240
      },
      {
        id: 'mv-02',
        timestamp: 800,
        url: 'https://click-popunder-network.xyz/track?site=lossless&event=page_open',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'script_ad_network',
        contentType: 'text/javascript',
        requestHeaders: {},
        responseHeaders: {},
        queryParams: { site: 'lossless', event: 'page_open' },
        durationMs: 190,
        adGateEvent: 'Popunder Trigger: Spawns new background tab to casino sponsor'
      },
      {
        id: 'mv-03',
        timestamp: 10400,
        url: 'https://lossless-master-archive.cc/gateway/resolve-mirror',
        method: 'POST',
        status: 200,
        statusText: 'OK',
        initiator: 'script_core_api',
        contentType: 'application/json',
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        responseHeaders: { 'Content-Type': 'application/json' },
        queryParams: {},
        requestBody: {
          assetCode: 'YXJjX3RhcGVfOTkwMQ==',
          cluster: 'node-ams-02'
        },
        responseBody: {
          streamUrl: 'https://ams02-cdn.lossless-master-archive.cc/streams/arc_tape_9901/Studio_Tape_Vol4_24bit_96khz.zip'
        },
        isMintingCall: true,
        durationMs: 160,
        notes: 'MINTING CALL: Takes Base64 assetCode & cluster string, resolves to raw ZIP stream.'
      },
      {
        id: 'mv-04',
        timestamp: 10800,
        url: 'https://ams02-cdn.lossless-master-archive.cc/streams/arc_tape_9901/Studio_Tape_Vol4_24bit_96khz.zip',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'application/zip',
        contentLength: 482344960,
        requestHeaders: { 'Accept': '*/*' },
        responseHeaders: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="Studio_Tape_Vol4_24bit_96khz.zip"'
        },
        queryParams: {},
        isTerminalAsset: true,
        durationMs: 2400,
        notes: 'TERMINAL ASSET EVENT: High-speed ZIP stream (460MB).'
      }
    ],
    inferredEntities: [
      {
        key: 'assetId',
        source: 'meta_tag',
        location: 'meta[property="og:asset:id"]',
        value: 'arc_tape_9901',
        dataType: 'string'
      },
      {
        key: 'assetCodeRaw',
        source: 'data_attribute',
        location: '.archive-header[data-asset-code]',
        value: 'YXJjX3RhcGVfOTkwMQ==',
        dataType: 'base64'
      },
      {
        key: 'vaultCluster',
        source: 'data_attribute',
        location: '.archive-header[data-vault-cluster]',
        value: 'node-ams-02',
        dataType: 'string'
      }
    ],
    correlations: [
      {
        targetLocation: 'json_body',
        targetParamName: 'assetCode',
        observedValue: 'YXJjX3RhcGVfOTkwMQ==',
        matchedEntityKey: 'assetCodeRaw',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Direct match between POST body assetCode and DOM attribute data-asset-code.'
      },
      {
        targetLocation: 'json_body',
        targetParamName: 'cluster',
        observedValue: 'node-ams-02',
        matchedEntityKey: 'vaultCluster',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Direct match between POST body cluster and DOM attribute data-vault-cluster.'
      }
    ],
    synthesizedRecipe: {
      id: 'recipe-lossless-archive-v1',
      version: '1.0.0',
      sitePattern: '^https://lossless-master-archive\\.cc/archive/([a-zA-Z0-9_-]+)$',
      description: 'Zero-Click Direct Ingestion for Lossless Audio Master Archives.',
      extractors: [
        {
          key: 'assetCode',
          type: 'css_selector',
          target: 'dom',
          pattern: '.archive-header[data-asset-code]',
          transform: 'attr(data-asset-code)'
        },
        {
          key: 'cluster',
          type: 'css_selector',
          target: 'dom',
          pattern: '.archive-header[data-vault-cluster]',
          transform: 'attr(data-vault-cluster)'
        }
      ],
      mintingRequest: {
        endpoint: 'https://lossless-master-archive.cc/gateway/resolve-mirror',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: {
          'assetCode': '{{assetCode}}',
          'cluster': '{{cluster}}'
        },
        responseTokenExtractor: {
          location: 'json_path',
          path: '$.streamUrl'
        }
      },
      terminalRequest: {
        endpointTemplate: '{{mintingResult}}',
        method: 'GET',
        headers: { 'Accept': '*/*' },
        expectedContentType: 'application/zip'
      },
      gatekeeperMitigation: {
        tokenType: 'deterministic',
        tlsImpersonationRequired: false,
        cookiePropagation: false,
        delayRequiredSeconds: 0,
        notes: 'Popunder ads and 10-second timer are entirely client-side. The resolve-mirror gateway endpoint responds instantaneously.'
      }
    },
    hurdlesEncountered: [
      {
        hurdle: 'deterministic_vs_ephemeral',
        difficulty: 'Low',
        finding: 'Asset codes are standard Base64 encodings of internal IDs, requiring no cryptographic session nonces.',
        resolution: 'Extracted directly via DOM query selector.'
      }
    ],
    generalizationTestItems: [
      {
        name: 'Item B: Orchestral Symphonies 24-Bit FLAC Set',
        url: 'https://lossless-master-archive.cc/archive/orchestral-symphonies-24bit',
        domSnippet: '<div class="archive-header" data-asset-code="YXJjX3N5bXBoXzQ0MTI=" data-vault-cluster="node-fra-01"></div>',
        expectedResult: {
          extractedEntities: {
            assetCode: 'YXJjX3N5bXBoXzQ0MTI=',
            cluster: 'node-fra-01'
          },
          mintingUrl: 'https://lossless-master-archive.cc/gateway/resolve-mirror',
          terminalAssetUrl: 'https://fra01-cdn.lossless-master-archive.cc/streams/arc_symph_4412/Orchestral_Symphonies_Set.zip',
          fileSize: '1.2 GB',
          contentType: 'application/zip',
          timeSavedSeconds: 15.0,
          adInteractionsBypassed: 2
        }
      }
    ]
  },
  {
    id: 'secure-scientific-vault',
    title: 'Scientific Research Hub (Ephemeral JWT Minting & Session Nonce)',
    category: 'Academic Preprints & Datasets',
    targetDomain: 'https://open-science-repository.io',
    summary: 'Observes a single manual verification cycle, models an ephemeral HMAC ticket minting flow, and infers request header dependencies to automate batch paper downloads.',
    demonstrationItem: {
      name: 'Item A: Fault-Tolerant Quantum Error Correction (2024)',
      url: 'https://open-science-repository.io/papers/quantum-error-correction-2024',
      domHtml: `<html lang="en">
<head>
  <meta name="paper-doi" content="10.1038/s41586-024-00129-x" />
  <meta name="nonce" content="e9f1a23c88b049" />
</head>
<body>
  <div id="paper-view" data-paper-id="ppr_998124">
    <h1>Fault-Tolerant Quantum Error Correction</h1>
    <div id="anti-leech-gate" data-challenge-id="ch_88190">
      Click "Generate PDF Link" and solve the quick verification.
    </div>
  </div>
</body>
</html>`,
      terminalFilename: 'Quantum_Error_Correction_Nature_2024.pdf'
    },
    networkTrace: [
      {
        id: 'sci-01',
        timestamp: 0,
        url: 'https://open-science-repository.io/papers/quantum-error-correction-2024',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'text/html; charset=utf-8',
        requestHeaders: { 'User-Agent': 'Mozilla/5.0' },
        responseHeaders: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': 'osr_session=s_88319aa01; Path=/; HttpOnly; SameSite=Strict'
        },
        queryParams: {},
        durationMs: 310
      },
      {
        id: 'sci-02',
        timestamp: 1200,
        url: 'https://open-science-repository.io/api/v2/mint-ticket',
        method: 'POST',
        status: 200,
        statusText: 'OK',
        initiator: 'script_core_api',
        contentType: 'application/json',
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-OSR-Nonce': 'e9f1a23c88b049',
          'Sec-Fetch-Site': 'same-origin'
        },
        responseHeaders: { 'Content-Type': 'application/json' },
        queryParams: {},
        requestBody: {
          paperId: 'ppr_998124',
          doi: '10.1038/s41586-024-00129-x'
        },
        responseBody: {
          ticket: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2kiOiIxMC4xMDM4L3M0MTU4Ni0wMjQtMDAxMjkteCIsInBhcGVySWQiOiJwcHJfOTk4MTI0IiwiZXhwIjoxNzE4MDAzNjAwfQ.9Hj3k...',
          downloadEndpoint: '/api/v2/fetch-asset'
        },
        isMintingCall: true,
        durationMs: 140,
        notes: 'MINTING CALL: Takes paperId and DOI, verified with HTML session nonce, issues signed short-lived JWT ticket.'
      },
      {
        id: 'sci-03',
        timestamp: 1500,
        url: 'https://open-science-repository.io/api/v2/fetch-asset?ticket=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        initiator: 'user_gesture',
        contentType: 'application/pdf',
        contentLength: 12495810,
        requestHeaders: {
          'Accept': 'application/pdf',
          'Cookie': 'osr_session=s_88319aa01'
        },
        responseHeaders: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Quantum_Error_Correction_Nature_2024.pdf"'
        },
        queryParams: { ticket: 'eyJhbGciOiJIUzI1Ni...' },
        isTerminalAsset: true,
        durationMs: 820,
        notes: 'TERMINAL ASSET EVENT: Direct PDF stream authenticated by short-lived ticket.'
      }
    ],
    inferredEntities: [
      {
        key: 'paperId',
        source: 'data_attribute',
        location: '#paper-view[data-paper-id]',
        value: 'ppr_998124',
        dataType: 'string'
      },
      {
        key: 'doi',
        source: 'meta_tag',
        location: 'meta[name="paper-doi"]',
        value: '10.1038/s41586-024-00129-x',
        dataType: 'string'
      },
      {
        key: 'nonce',
        source: 'meta_tag',
        location: 'meta[name="nonce"]',
        value: 'e9f1a23c88b049',
        dataType: 'hash_md5'
      }
    ],
    correlations: [
      {
        targetLocation: 'json_body',
        targetParamName: 'paperId',
        observedValue: 'ppr_998124',
        matchedEntityKey: 'paperId',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Matched POST body paperId to #paper-view[data-paper-id]'
      },
      {
        targetLocation: 'json_body',
        targetParamName: 'doi',
        observedValue: '10.1038/s41586-024-00129-x',
        matchedEntityKey: 'doi',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Matched POST body doi to meta[name="paper-doi"]'
      },
      {
        targetLocation: 'header',
        targetParamName: 'X-OSR-Nonce',
        observedValue: 'e9f1a23c88b049',
        matchedEntityKey: 'nonce',
        transformation: 'identity',
        confidenceScore: 1.0,
        derivationDescription: 'Matched Custom Header X-OSR-Nonce to meta[name="nonce"]'
      }
    ],
    synthesizedRecipe: {
      id: 'recipe-open-science-v2',
      version: '2.1.0',
      sitePattern: '^https://open-science-repository\\.io/papers/([a-zA-Z0-9_-]+)$',
      description: 'Two-Stage Ephemeral Token Ingestion Pipeline for Open Science Repository.',
      extractors: [
        {
          key: 'paperId',
          type: 'css_selector',
          target: 'dom',
          pattern: '#paper-view',
          transform: 'attr(data-paper-id)'
        },
        {
          key: 'doi',
          type: 'css_selector',
          target: 'meta',
          pattern: 'meta[name="paper-doi"]',
          transform: 'attr(content)'
        },
        {
          key: 'nonce',
          type: 'css_selector',
          target: 'meta',
          pattern: 'meta[name="nonce"]',
          transform: 'attr(content)'
        }
      ],
      mintingRequest: {
        endpoint: 'https://open-science-repository.io/api/v2/mint-ticket',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OSR-Nonce': '{{nonce}}',
          'Sec-Fetch-Site': 'same-origin'
        },
        body: {
          'paperId': '{{paperId}}',
          'doi': '{{doi}}'
        },
        responseTokenExtractor: {
          location: 'json_path',
          path: '$.ticket'
        }
      },
      terminalRequest: {
        endpointTemplate: 'https://open-science-repository.io/api/v2/fetch-asset?ticket={{mintingResult}}',
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
        expectedContentType: 'application/pdf'
      },
      gatekeeperMitigation: {
        tokenType: 'ephemeral_api_minted',
        tlsImpersonationRequired: false,
        cookiePropagation: true,
        delayRequiredSeconds: 0,
        notes: 'Two-stage recipe: Must first extract the page nonce and call /api/v2/mint-ticket to receive an ephemeral HMAC ticket before fetching the terminal asset.'
      }
    },
    hurdlesEncountered: [
      {
        hurdle: 'deterministic_vs_ephemeral',
        difficulty: 'High',
        finding: 'Terminal URLs use server-signed JWTs with 60-second expiration. Static URL construction fails.',
        resolution: 'Synthesized 2-stage execution flow: Ingest page -> Query mint-ticket API with extracted nonce -> Fetch terminal asset within 500ms.'
      }
    ],
    generalizationTestItems: [
      {
        name: 'Item B: Neural Network Pruning at Scale (ICLR 2024)',
        url: 'https://open-science-repository.io/papers/neural-network-pruning-2024',
        domSnippet: '<meta name="paper-doi" content="10.1145/3618257.3624801" /><meta name="nonce" content="ff44b912c0199a" /><div id="paper-view" data-paper-id="ppr_334188"></div>',
        expectedResult: {
          extractedEntities: {
            paperId: 'ppr_334188',
            doi: '10.1145/3618257.3624801',
            nonce: 'ff44b912c0199a'
          },
          mintingUrl: 'https://open-science-repository.io/api/v2/mint-ticket (POST)',
          terminalAssetUrl: 'https://open-science-repository.io/api/v2/fetch-asset?ticket=eyJhbGciOiJIUzI1NiIsInR5cCI...',
          fileSize: '8.4 MB',
          contentType: 'application/pdf',
          timeSavedSeconds: 12.8,
          adInteractionsBypassed: 1
        }
      }
    ]
  }
];
