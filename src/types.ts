export interface NetworkRequest {
  id: string;
  timestamp: number;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: number;
  statusText: string;
  initiator: 'user_gesture' | 'script_ad_network' | 'script_timer' | 'script_core_api' | 'redirect';
  contentType: string;
  contentLength?: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  isTerminalAsset?: boolean;
  isMintingCall?: boolean;
  durationMs: number;
  adGateEvent?: string;
  notes?: string;
}

export interface ExtractedDOMEntity {
  key: string;
  source: 'url_slug' | 'url_path_param' | 'canonical_link' | 'data_attribute' | 'meta_tag' | 'json_ld' | 'hydration_state' | 'inline_script';
  location: string;
  value: string;
  entropy?: number;
  dataType: 'string' | 'uuid' | 'integer' | 'hash_md5' | 'hash_sha256' | 'base64' | 'json';
}

export interface ParameterCorrelation {
  targetLocation: 'query' | 'path' | 'header' | 'json_body';
  targetParamName: string;
  observedValue: string;
  matchedEntityKey: string;
  transformation: 'identity' | 'md5' | 'sha256' | 'base64_encode' | 'base64_decode' | 'slug_to_id' | 'ast_json_path' | 'regex_capture';
  confidenceScore: number; // 0.0 - 1.0
  derivationDescription: string;
}

export interface DeclarativeRecipe {
  id: string;
  version: string;
  sitePattern: string;
  description: string;
  extractors: {
    key: string;
    type: 'regex' | 'css_selector' | 'xpath' | 'json_path' | 'ast_query';
    target: 'url' | 'dom' | 'hydration_state' | 'meta';
    pattern: string;
    transform?: string;
  }[];
  mintingRequest?: {
    endpoint: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    params?: Record<string, string>;
    body?: Record<string, any>;
    responseTokenExtractor: {
      location: 'json_path' | 'header' | 'regex';
      path: string;
    };
  };
  terminalRequest: {
    endpointTemplate: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    params?: Record<string, string>;
    body?: Record<string, any>;
    expectedContentType: string;
  };
  gatekeeperMitigation: {
    tokenType: 'deterministic' | 'ephemeral_api_minted' | 'stateful_ad_bypassed' | 'hybrid_fallback';
    tlsImpersonationRequired: boolean;
    cookiePropagation: boolean;
    delayRequiredSeconds?: number;
    notes: string;
  };
}

export interface TestTargetItem {
  name: string;
  url: string;
  domSnippet: string;
  hydrationSnippet?: string;
  expectedResult: {
    extractedEntities: Record<string, string>;
    mintingUrl?: string;
    terminalAssetUrl: string;
    fileSize: string;
    contentType: string;
    timeSavedSeconds: number;
    adInteractionsBypassed: number;
  };
}

export interface ScenarioCase {
  id: string;
  title: string;
  category: string;
  targetDomain: string;
  summary: string;
  demonstrationItem: {
    name: string;
    url: string;
    domHtml: string;
    hydrationData?: any;
    terminalFilename: string;
  };
  networkTrace: NetworkRequest[];
  inferredEntities: ExtractedDOMEntity[];
  correlations: ParameterCorrelation[];
  synthesizedRecipe: DeclarativeRecipe;
  hurdlesEncountered: {
    hurdle: 'deterministic_vs_ephemeral' | 'ad_attestation' | 'implicit_dom_linkage' | 'fingerprint_mismatch';
    difficulty: 'Low' | 'Medium' | 'High' | 'Critical';
    finding: string;
    resolution: string;
  }[];
  generalizationTestItems: TestTargetItem[];
}

export interface ExtensionRecordingSession {
  sourceUrl: string;
  sourceDomain: string;
  sourceDomSnapshot: {
    title: string;
    clickedElementSelector: string;
    clickedElementHref: string;
    dataAttributes: Record<string, string>;
    metaTags: Record<string, string>;
    hydrationData?: Record<string, any>;
    urlTokens: string[];
  };
  navigationHops: {
    hopIndex: number;
    url: string;
    method: string;
    statusCode: number;
    type: 'redirect' | 'navigation' | 'fetch' | 'ad_script';
    requestHeaders?: Record<string, string>;
    responseBodySample?: string;
  }[];
  targetEndpoint: {
    url: string;
    domain: string;
    isExternalHost: boolean;
    mimeType: string;
    inferredParams: Record<string, string>;
  };
  inferredRelationship?: {
    algorithmUsed: 'exact_token' | 'base64_decode' | 'hash_derivation' | 'hydration_ast' | 'network_provenance_dag' | 'third_party_bridge';
    confidence: number;
    bindingFormula: string;
    recipeSnippet: string;
  };
}

export type ViewMode = 
  | 'workbench' 
  | 'ad_chain_analyzer'
  | 'extension_blueprint'
  | 'documentation' 
  | 'hurdles' 
  | 'trace_inspector' 
  | 'custom_lab' 
  | 'code_exporter';
