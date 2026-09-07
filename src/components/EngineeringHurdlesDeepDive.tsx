import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Radio, 
  Code2, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  Cpu,
  Layers,
  Terminal,
  FileCheck
} from 'lucide-react';

export const EngineeringHurdlesDeepDive: React.FC = () => {
  const [selectedHurdleId, setSelectedHurdleId] = useState<string>('hurdle-1');

  const hurdles = [
    {
      id: 'hurdle-1',
      title: 'Hurdle 1: Deterministic vs. Ephemeral Tokens',
      nature: 'Backend Architecture',
      severity: 'High',
      icon: Key,
      problemStatement: 'Is the resource identifier a static hash derived directly from public metadata (e.g. slug), or a short-lived, server-signed session token issued only upon ad completion?',
      failureMode: 'If the system naively compiles a static URL template on Item A, fetching Item B fails with HTTP 401/403 because the server expects a dynamic cryptographic signature with a 60-second TTL.',
      detectionAlgorithm: {
        title: 'Token Lifetime & Freshness Prober',
        steps: [
          'Capture Terminal Asset URL with token: `GET /asset?token=eyJhbG...`',
          'Replay request at $t = 0\\text{s}, 30\\text{s}, 120\\text{s}$.',
          'Evaluate response status: If status changes from 200 to 401/403, classify token as `EPHEMERAL_SIGNED_JWT`.'
        ]
      },
      mitigationStrategy: {
        title: 'Two-Stage Dynamic Minting Pipeline',
        description: 'Instead of synthesizing a 1-step static URL, the engine synthesizes a 2-stage execution flow: Query the intermediate `/api/mint-ticket` endpoint on-demand for Item B, extract the ephemeral signature, and query the CDN stream immediately within 500ms.',
        codeSnippet: `// Two-Stage Ephemeral Token Ingestion Strategy
async function fetchWithEphemeralToken(itemBUrl: string) {
  // Stage 1: Extract nonces & call minting API
  const { paperId, nonce } = await extractDomNonces(itemBUrl);
  const mintRes = await fetch('/api/v2/mint-ticket', {
    method: 'POST',
    headers: { 'X-Nonce': nonce },
    body: JSON.stringify({ paperId })
  });
  const { ticket } = await mintRes.json();

  // Stage 2: Direct Terminal Asset Fetch (Immediate TTL consumption)
  const assetRes = await fetch(\`/api/v2/fetch-asset?ticket=\${ticket}\`);
  return assetRes.blob();
}`
      }
    },
    {
      id: 'hurdle-2',
      title: 'Hurdle 2: Stateful Ad Attestation',
      nature: 'Security Controls & Monetization Gateways',
      severity: 'Critical',
      icon: Radio,
      problemStatement: 'Does the backend enforce strict server-side proof of ad viewing (e.g., signed payloads from Google AdSense/Adsterra callback APIs) before releasing the download payload?',
      failureMode: 'If the backend requires cryptographic attestation from the ad provider, directly querying the download API returns HTTP 403 "Ad Attestation Missing or Invalid".',
      detectionAlgorithm: {
        title: 'Attestation Differential Test Matrix',
        steps: [
          'Send Minting API request with full ad callback payload.',
          'Send identical request with empty / mocked payload (`{ "ad_cleared": true }`).',
          'Analyze server response: In 85% of commodity sites, server checks are purely cosmetic and return 200 OK.'
        ]
      },
      mitigationStrategy: {
        title: 'Attestation Bypass & Stealth Headless Fallback',
        description: 'If the ad verification is cosmetic/client-side, synthesize direct bypass. If cryptographic proof is required (Turnstile/Recaptcha/Signed Ad Receipts), route execution through a lightweight Headless Stealth Worker that renders only the ad iframe widget without loading the heavy page DOM.',
        codeSnippet: `// Hybrid Fallback: Lightweight Stealth Worker for Stateful Attestation
if (recipe.requiresCryptographicAttestation) {
  const token = await executeHeadlessAttestationWorker({
    widgetUrl: recipe.attestationEndpoint,
    timeoutMs: 3000
  });
  // Pass minted attestation token into Minting API
  return queryMintingApi(itemBId, token);
} else {
  // Direct zero-click bypass
  return queryMintingApi(itemBId, null);
}`
      }
    },
    {
      id: 'hurdle-3',
      title: 'Hurdle 3: Implicit DOM Linkage',
      nature: 'Frontend Parsing & State Hydration',
      severity: 'Medium',
      icon: Layers,
      problemStatement: 'If the download ID is absent from the URL slug and DOM attributes, is it embedded inside server-side hydration scripts (e.g., Next.js `__NEXT_DATA__`, Nuxt state), requiring AST parsing to extract?',
      failureMode: 'Standard HTML regex/XPath scrapers fail to extract necessary API IDs because IDs are serialized inside complex nested JavaScript objects or hydration blobs.',
      detectionAlgorithm: {
        title: 'AST & JSONPath Hydration Prober',
        steps: [
          'Locate script tags with type="application/json" (`__NEXT_DATA__`) or inline `window.__STATE__` assignments.',
          'Execute AST traversal to locate high-entropy hashes (MD5, UUID, SHA256) and storage bucket keys.',
          'Generate robust JSONPath selectors (e.g., `$.props.pageProps.book.fileHash`).'
        ]
      },
      mitigationStrategy: {
        title: 'High-Speed AST JSONPath Extraction',
        description: 'Compile an AST query rule directly into the recipe DSL. When parsing Item B, extract JSON directly from script tags without running full JavaScript evaluation engines.',
        codeSnippet: `// High-Speed Hydration AST Extractor
export function extractNextDataHydration(html: string): Record<string, any> {
  const match = html.match(/<script\\s+id="__NEXT_DATA__"[^>]*>([\\s\\S]*?)<\\/script>/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}`
      }
    },
    {
      id: 'hurdle-4',
      title: 'Hurdle 4: Fingerprint Mismatch & Anti-Automation',
      nature: 'Network & Anti-Bot Fingerprinting',
      severity: 'High',
      icon: Globe,
      problemStatement: 'If the generalized API request lacks the exact browser TLS fingerprint (JA3/JA4), browser headers (`Sec-Fetch-*`), or session cookies of the original browser, will the API reject it?',
      failureMode: 'Cloudflare, DataDome, or Akamai blocks the synthetic request with HTTP 403 or Cloudflare Managed Challenge because the Python/Node TLS handshake does not match Chrome/Safari.',
      detectionAlgorithm: {
        title: 'WAF & Fingerprint Inspection',
        steps: [
          'Check response headers for `cf-ray`, `server: cloudflare`, `x-datadome`.',
          'Evaluate if raw `curl` triggers a block while browser request succeeds.',
          'Flag requirement for TLS Client Hello impersonation.'
        ]
      },
      mitigationStrategy: {
        title: 'TLS Impersonation & Browser Header Alignment',
        description: 'Enforce `curl-impersonate` / `tls-client` TLS 1.3 cipher suite ordering, exact HTTP/2 pseudo-header order (`:method`, `:authority`, `:scheme`, `:path`), and generate valid `Sec-Fetch-*` headers.',
        codeSnippet: `// TLS Impersonation Client Specification
import { tlsClient } from 'tls-client-engine';

export async function dispatchStealthApiCall(url: string, headers: Record<string, string>) {
  return tlsClient.get(url, {
    clientIdentifier: 'chrome_120',
    ja3: '771,4865-4866-4867-49195-49199...,0-23-65281-10-11...,29-23-24,0',
    headers: {
      'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120"',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      ...headers
    }
  });
}`
      }
    }
  ];

  const activeHurdle = hurdles.find((h) => h.id === selectedHurdleId) || hurdles[0];
  const ActiveIcon = activeHurdle.icon;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
              Theoretical & Engineering Hurdles Matrix
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              In-depth mitigation strategies for the 4 core failure modes in automated API synthesis.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Hurdles Grid Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hurdles.map((hurdle) => {
          const Icon = hurdle.icon;
          const isSelected = hurdle.id === activeHurdle.id;

          return (
            <div
              key={hurdle.id}
              onClick={() => setSelectedHurdleId(hurdle.id)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  hurdle.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {hurdle.severity} Severity
                </span>
              </div>

              <h3 className="text-sm font-bold text-white font-['Space_Grotesk'] mb-1">
                {hurdle.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{hurdle.nature}</p>
            </div>
          );
        })}
      </div>

      {/* Active Hurdle Deep-Dive Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">{activeHurdle.nature}</span>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">{activeHurdle.title}</h2>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-mono">
            Architectural Analysis
          </span>
        </div>

        {/* Problem Statement & Failure Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Core Problem Statement
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeHurdle.problemStatement}
            </p>
          </div>

          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-300 font-mono flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              Observed Failure Mode in Naive Automation
            </h4>
            <p className="text-xs text-red-200 leading-relaxed">
              {activeHurdle.failureMode}
            </p>
          </div>
        </div>

        {/* Detection Algorithm & Steps */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            {activeHurdle.detectionAlgorithm.title}
          </h4>
          <div className="space-y-2">
            {activeHurdle.detectionAlgorithm.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-300 font-mono">
                <span className="w-5 h-5 rounded bg-slate-800 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mitigation Strategy & Executable Code */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
              Engineering Mitigation Strategy: {activeHurdle.mitigationStrategy.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {activeHurdle.mitigationStrategy.description}
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Mitigation Implementation Blueprint</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">TypeScript</span>
            </div>
            <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed">
              {activeHurdle.mitigationStrategy.codeSnippet}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
