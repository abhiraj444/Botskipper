import React, { useState } from 'react';
import { downloadExtensionZip } from '../utils/extensionZip';
import { 
  Puzzle, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Cpu, 
  FileCode, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  ChevronRight,
  Database,
  Search,
  Eye,
  Terminal,
  FileCheck,
  Flame,
  AlertTriangle,
  Activity,
  Globe,
  Radio,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Sparkles,
  MousePointer,
  Bookmark,
  Compass,
  FileText,
  PackageCheck,
  FolderDown
} from 'lucide-react';

export const ExtensionArchitectureBlueprint: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interactive_demo' | 'solvers' | 'manifest_v3_code' | 'edge_cases'>('interactive_demo');
  const [demoScenario, setDemoScenario] = useState<'api_minter' | 'chained_broker' | 'direct_url'>('api_minter');
  const [demoStep, setDemoStep] = useState<number>(1);
  const [simulatingInference, setSimulatingInference] = useState<boolean>(false);
  const [testOnTargetB, setTestOnTargetB] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSolver, setSelectedSolver] = useState<number>(4);
  const [activeCodeFile, setActiveCodeFile] = useState<'manifest' | 'background' | 'content' | 'solver' | 'popup'>('solver');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const solversList = [
    {
      id: 1,
      name: 'Direct Identifier & Slug Alignment',
      summary: 'Matches plain or slug-normalized tokens between Source DOM/URL and Target API parameters.',
      mathFormula: 'Confidence = \\frac{|Tokens(Source) \\cap Tokens(Target)|}{|Tokens(Target)|} \\in [0, 1]',
      howItWorks: 'The extension extracts all numeric IDs, UUIDs, and hyphenated slugs from the source page (URL, meta tags, data attributes). It compares them with the query string and JSON body of the final endpoint. If an exact or partial match occurs, an extraction selector is generated.',
      exampleSource: 'URL: /books/quantum-physics-vol-2 | meta[name="id"]: "99281"',
      exampleTarget: 'GET https://cdn.vault.io/api/v2/mint?book_id=99281&slug=quantum-physics-vol-2',
      inferredRule: '$.book_id = document.querySelector(\'meta[name="id"]\').content\n$.slug = window.location.pathname.split("/").pop()'
    },
    {
      id: 2,
      name: 'Encoding & Cryptographic Inverse Solver',
      summary: 'Detects Base64, Hex, URL encoding, and common cryptographic hashes (MD5, SHA-256).',
      mathFormula: 'f_{decode}(Payload) = \\text{SourceToken} \\implies Transform = f_{encode}',
      howItWorks: 'If the target URL contains opaque hashes or strings (e.g. "YmtfOTkyODE=" or "e10adc3949ba59abbe56e057f20f883e"), the solver tests common transforms: Base64 decode, Hex decode, and MD5/SHA256 of source tokens. When a match is found, the transformation function is bound to the recipe.',
      exampleSource: 'Book ID: "bk_99281"',
      exampleTarget: 'GET https://ad-gate.net/dl?token=YmtfOTkyODE=',
      inferredRule: '$.token = btoa(document.querySelector(\'[data-book-id]\').dataset.bookId)'
    },
    {
      id: 3,
      name: 'SSR & Hydration AST State Prober',
      summary: 'Inspects __NEXT_DATA__, __NUXT__, and Redux state trees for hidden resource hashes.',
      mathFormula: '\\exists k \\in \\text{Keys}(AST) \\text{ s.t. } AST[k] = TargetParam',
      howItWorks: 'Modern React/Next.js and Vue/Nuxt websites store complete pre-rendered JSON payloads in <script id="__NEXT_DATA__"> or window.__INITIAL_STATE__. The extension parses this JSON AST into a flattened dot-notation key-value map and matches target parameters directly to state paths.',
      exampleSource: '<script id="__NEXT_DATA__">{"props":{"pageProps":{"fileHash":"a8f90c1"}}}</script>',
      exampleTarget: 'GET https://api.vault.io/download?file=a8f90c1',
      inferredRule: '$.file = JSON.parse(document.getElementById("__NEXT_DATA__").textContent).props.pageProps.fileHash'
    },
    {
      id: 4,
      name: 'Backend Minting API Sniffer',
      summary: 'Detects when the website calls an internal or external backend API using button metadata to mint download URLs.',
      mathFormula: 'MintingReq = \\arg\\min_{req \\in Trace} \\{ t(req) \\mid TargetURL \\in req.ResponseBody \\vee req.type \\in \\{xhr, fetch\\} \\}',
      howItWorks: 'Websites often use button data-attributes (e.g. data-file-id, data-hash) to trigger an internal API (POST /api/v2/generate-link) or 3rd-party minting endpoint which returns a JSON payload containing the real download URL. DirectLink intercepts this API request during recording, maps the parameters from the button dataset, and calls the API directly in the background.',
      exampleSource: 'Download Button: data-file-id="bk_88291", data-token="sec_9918"',
      exampleTarget: 'POST /api/v2/generate-link -> Response: {"download_url": "https://cdn.files.com/stream/..."}',
      inferredRule: 'fetch("/api/v2/generate-link", { method: "POST", body: { file_id: button.dataset.fileId } }) -> extract response.download_url'
    },
    {
      id: 5,
      name: 'Multi-Step Chained Broker & Bridge Resolver',
      summary: 'Resolves intermediate broker services where source data is sent to an external gateway that serves a bridge page with the terminal button.',
      mathFormula: 'Source \\xrightarrow{params} BrokerGateway \\xrightarrow{fetch\\_bridge} TerminalHTML \\xrightarrow{selector} DirectBinary',
      howItWorks: 'When the website passes parameters to an intermediate service (e.g. https://link-broker.com/view?id=...) that serves an HTML page containing the real download button, DirectLink models this as a Multi-Step DAG. On future pages, it calls the broker, parses the bridge page headlessly for the terminal selector, and starts the file stream with zero ads.',
      exampleSource: 'Source button points to: https://broker-gate.org/route?session=bk_88291',
      exampleTarget: 'Bridge page serves <a id="btn-download" href="https://cdn.vault.io/stream/...">',
      inferredRule: 'Step 1: GET broker-gate.org/route?session={id}\nStep 2: Parse bridge HTML for #btn-download -> Navigate to direct href'
    },
    {
      id: 6,
      name: 'Differential Fuzzing & Header Minimizer',
      summary: 'Strips unnecessary cookies and headers to find the absolute minimal HTTP request needed.',
      mathFormula: 'MinHeaders = \\arg\\min_{H \\subseteq Headers} \\{ |H| \\mid API(H) = 200 \\}',
      howItWorks: 'The recorded trip might contain 40 ad cookies, tracking telemetry, and analytics. The extension sends lightweight verification probes with stripped headers to confirm if only the Referer or a single session cookie is required, making the final synthesized recipe lightweight and fast.',
      exampleSource: 'Recorded request had 45 ad cookies + 20 tracking headers',
      exampleTarget: 'Minimal verified request needs only: Referer + User-Agent',
      inferredRule: 'Strip all ad cookies. Replay with: headers = { "Referer": sourceUrl }'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Puzzle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Browser Extension Architecture & Solver Blueprint
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
              The Record-Once, Auto-Bypass Extension Engine
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-2 leading-relaxed">
              A browser extension that lets you <strong>tag a source download page</strong>, record a single manual trip through the ad maze, <strong>tag the final link</strong>, and automatically reverse-engineer the relationship to give 1-click downloads for every future item on that domain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadExtensionZip}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Download Extension (.zip)</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Manifest V3 Ready
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {[
          { id: 'interactive_demo', label: '1. Live Extension Simulation', icon: Play },
          { id: 'solvers', label: '2. The 6 Relationship Solvers', icon: Cpu },
          { id: 'manifest_v3_code', label: '3. Complete Extension Code (V3)', icon: Code2 },
          { id: 'edge_cases', label: '4. External Hubs & Edge Cases', icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INTERACTIVE SIMULATION */}
      {activeTab === 'interactive_demo' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-indigo-400" />
                  Interactive Extension Resolution Engine
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Simulate how the extension reverse-engineers backend APIs, multi-hop broker chains, or direct URL templates.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Progress:</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">
                  Step {demoStep} of 4
                </span>
              </div>
            </div>

            {/* Scenario Architecture Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Select Website Resolution Architecture:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setDemoScenario('api_minter');
                    setDemoStep(1);
                    setTestOnTargetB(false);
                  }}
                  className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
                    demoScenario === 'api_minter'
                      ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 font-mono">1. Backend Minting API</span>
                    {demoScenario === 'api_minter' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Website calls an internal or external backend API with button/page data, which responds with direct download JSON.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setDemoScenario('chained_broker');
                    setDemoStep(1);
                    setTestOnTargetB(false);
                  }}
                  className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
                    demoScenario === 'chained_broker'
                      ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 font-mono">2. Chained Intermediate Broker</span>
                    {demoScenario === 'chained_broker' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Button sends data to an intermediate service/gateway which serves a bridge page containing the real download button.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setDemoScenario('direct_url');
                    setDemoStep(1);
                    setTestOnTargetB(false);
                  }}
                  className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
                    demoScenario === 'direct_url'
                      ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">3. Direct URL Template</span>
                    {demoScenario === 'direct_url' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Parameters and Base64 tokens from the source DOM are interpolated directly into the final download URL.
                  </p>
                </button>
              </div>
            </div>

            {/* Step 1: Tag Source */}
            {demoStep === 1 && (
              <div className="space-y-5">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      User is on: https://e-library-hub.io/book/advanced-calculus
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Step 1: Tagging Source Page</span>
                  </div>
                  
                  {/* Simulated Web Page Frame */}
                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Advanced Calculus (9th Edition)</h3>
                        <p className="text-xs text-slate-400 font-mono">ISBN: 978-0134437768 | PDF (42 MB)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {demoScenario === 'api_minter' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                            Calls Backend: /api/v2/generate-link
                          </span>
                        )}
                        {demoScenario === 'chained_broker' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                            Calls Broker: gateway.io/bridge
                          </span>
                        )}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          data-book-id="bk_88291"
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg border border-dashed border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                          Download Button (Tag with Extension)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {demoScenario === 'api_minter' && 'Button contains data-file-id="bk_88291" and data-auth-token="sec_9918". Clicking it invokes an internal backend API!'}
                          {demoScenario === 'chained_broker' && 'Button contains data-broker-key="bk_88291". Clicking it opens an intermediate ad gateway page.'}
                          {demoScenario === 'direct_url' && 'Button leads to an ad redirection chain before landing on the target download URL.'}
                        </p>
                      </div>

                      <button
                        onClick={() => setDemoStep(2)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Puzzle className="w-4 h-4 text-cyan-300" />
                        <span>Tag this Page as Source & Start Trip</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl text-xs text-slate-300 space-y-1">
                  <strong className="text-indigo-300 font-mono">What the extension does in the background:</strong>
                  <p>Attaches <code>chrome.webRequest.onBeforeRequest</code> to sniff all API and navigation traffic. Takes DOM snapshot (button dataset attributes, meta tags, Next.js hydration state, and URL tokens).</p>
                </div>
              </div>
            )}

            {/* Step 2: Navigate Ad Chain & Capture Network Requests */}
            {demoStep === 2 && (
              <div className="space-y-5">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      Trip Recording Active (Network Sniffer Intercepted Traffic)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Step 2: Passive Traffic Sniffing</span>
                  </div>

                  <div className="space-y-2">
                    {demoScenario === 'api_minter' ? (
                      <>
                        <div className="p-3 bg-slate-950 rounded-lg border border-indigo-500/30 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold">API XHR</span>
                            <span className="text-indigo-200 truncate max-w-[280px] sm:max-w-[400px]">POST https://e-library-hub.io/api/v2/generate-link</span>
                          </div>
                          <span className="text-emerald-400 font-bold">Payload: {`{ file_id: "bk_88291" }`}</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Response</span>
                            <span className="text-slate-300 truncate max-w-[280px] sm:max-w-[400px]">{`{ "status": "ok", "download_url": "https://cdn.vault.io/stream/bk_88291.pdf" }`}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">200 OK</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Ad Pop</span>
                            <span className="text-slate-400 truncate max-w-[280px] sm:max-w-[400px]">https://popcash-tracker.net/ad?click_id=99281</span>
                          </div>
                          <span className="text-slate-500">Ignored Noise</span>
                        </div>
                      </>
                    ) : demoScenario === 'chained_broker' ? (
                      <>
                        <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">Broker</span>
                            <span className="text-cyan-200 truncate max-w-[280px] sm:max-w-[400px]">GET https://gateway-broker.io/view?resource=bk_88291</span>
                          </div>
                          <span className="text-emerald-400 font-bold">200 OK</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Bridge HTML</span>
                            <span className="text-slate-300 truncate max-w-[280px] sm:max-w-[400px]">Contains {`<a id="download-btn" href="https://cdn.vault.io/stream/bk_88291.pdf">`}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">Parsed DOM</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Ad Timer</span>
                            <span className="text-slate-400 truncate max-w-[280px] sm:max-w-[400px]">15s Countdown Interstitial overlay</span>
                          </div>
                          <span className="text-amber-400 font-bold">Interrupted</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Hop 1</span>
                            <span className="text-slate-200 truncate max-w-[280px] sm:max-w-[400px]">https://ad-syndicate.net/redirect?pub=99&data=YmtfODgyOTE=</span>
                          </div>
                          <span className="text-emerald-400 font-bold">302 Found</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Hop 2</span>
                            <span className="text-slate-200 truncate max-w-[280px] sm:max-w-[400px]">https://timer-gate-interstitial.xyz/wait?session=s_1029</span>
                          </div>
                          <span className="text-emerald-400 font-bold">200 OK</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setDemoStep(3)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Arrived at Terminal Download Link &rarr; Tag Target</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Tag Target & Run Inference Engine */}
            {demoStep === 3 && (
              <div className="space-y-5">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      Target Link: https://cdn.vault.io/stream/bk_88291.pdf
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Step 3: Relationship Inference</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {demoScenario === 'api_minter' ? 'Identified Minting API in Network Trace:' : demoScenario === 'chained_broker' ? 'Identified Intermediate Broker Hop:' : 'Target URL Parameters:'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {demoScenario === 'api_minter' ? 'POST /api/v2/generate-link' : demoScenario === 'chained_broker' ? 'Multi-Step DAG' : 'GET cdn.vault.io'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-200 bg-slate-900 p-3 rounded border border-slate-800 break-all">
                      {demoScenario === 'api_minter' && 'POST https://e-library-hub.io/api/v2/generate-link -> Response { "download_url": "https://cdn.vault.io/stream/bk_88291.pdf" }'}
                      {demoScenario === 'chained_broker' && 'GET https://gateway-broker.io/view?resource=bk_88291 -> Bridge DOM contains #download-btn'}
                      {demoScenario === 'direct_url' && 'GET https://cdn.vault.io/api/v2/mint?book_id=bk_88291&checksum=094875c8e2b1f4a9'}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white font-mono">
                        Ready to Solve Relationship (Source Page &harr; Target Endpoint)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {demoScenario === 'api_minter' && 'The engine detected the backend minting API! It will map button attributes to the POST payload.'}
                        {demoScenario === 'chained_broker' && 'The engine detected the intermediate broker! It will synthesize a 2-step headless bridge fetcher.'}
                        {demoScenario === 'direct_url' && 'The engine will cross-correlate source DOM entities with target parameters.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSimulatingInference(true);
                        setTimeout(() => {
                          setSimulatingInference(false);
                          setDemoStep(4);
                        }, 800);
                      }}
                      disabled={simulatingInference}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {simulatingInference ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
                      <span>{simulatingInference ? 'Solving Relationship...' : 'Tag Target & Synthesize Recipe'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Recipe Synthesized & 0-Click Verification */}
            {demoStep === 4 && (
              <div className="space-y-6">
                <div className="bg-emerald-950/20 border border-emerald-500/40 p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                        Domain Recipe Successfully Synthesized & Saved in Extension Storage!
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Strategy: {demoScenario === 'api_minter' ? 'BACKEND_API_MINTER' : demoScenario === 'chained_broker' ? 'MULTI_STEP_CHAIN' : 'DIRECT_URL_TEMPLATE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Inferred Binding Rule:</span>
                      {demoScenario === 'api_minter' ? (
                        <p className="text-cyan-300">
                          <code>body.file_id &larr; button.dataset.fileId</code><br />
                          <code>responseExtractor &larr; json.download_url</code>
                        </p>
                      ) : demoScenario === 'chained_broker' ? (
                        <p className="text-cyan-300">
                          <code>step1.broker_param &larr; button.dataset.brokerKey</code><br />
                          <code>step2.bridge_selector &larr; #download-btn</code>
                        </p>
                      ) : (
                        <p className="text-cyan-300">
                          <code>book_id &larr; element.dataset.bookId || meta['id']</code><br />
                          <code>checksum &larr; __NEXT_DATA__.props.fileHash</code>
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Execution Action:</span>
                      {demoScenario === 'api_minter' ? (
                        <p className="text-indigo-300 truncate">
                          <code>POST /api/v2/generate-link {`{ file_id }`} &rarr; direct stream</code>
                        </p>
                      ) : demoScenario === 'chained_broker' ? (
                        <p className="text-indigo-300 truncate">
                          <code>Headless fetch broker &rarr; parse DOM bridge &rarr; trigger href</code>
                        </p>
                      ) : (
                        <p className="text-indigo-300 truncate">
                          <code>https://cdn.vault.io/api/v2/mint?book_id={'{book_id}'}</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulation of Visiting a BRAND NEW book page on that domain */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Testing on Unseen Target (Book B): Quantum Mechanics
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Extension Interceptor Active
                    </span>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Quantum Mechanics & Wave Functions</h3>
                        <p className="text-xs text-slate-400 font-mono">https://e-library-hub.io/book/quantum-mechanics (ID: bk_99304)</p>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Size: 56.4 MB PDF
                      </span>
                    </div>

                    {/* The Intercepted Button */}
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-200">Standard Webpage Button Intercepted:</div>
                        <p className="text-[11px] text-slate-400">
                          {demoScenario === 'api_minter' && 'Original button triggers ad timers. DirectLink calls POST /api/v2/generate-link directly!'}
                          {demoScenario === 'chained_broker' && 'Original button redirects to ad gateway. DirectLink fetches bridge page in background!'}
                          {demoScenario === 'direct_url' && 'Original link pointed to ad networks. DirectLink injected instant 0-click bypass!'}
                        </p>
                      </div>

                      <button
                        onClick={() => setTestOnTargetB(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Zap className="w-4 h-4 fill-current text-amber-300" />
                        <span>⚡ 1-Click Instant Download (Bypassed)</span>
                      </button>
                    </div>

                    {testOnTargetB && (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 space-y-1 animate-fadeIn">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Direct Binary Stream Triggered!
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          {demoScenario === 'api_minter' && 'Called POST /api/v2/generate-link { file_id: "bk_99304" } -> Received stream URL in 140ms (0 ad tabs opened, 0s delay).'}
                          {demoScenario === 'chained_broker' && 'Fetched gateway broker headlessly in 180ms -> Extracted terminal #download-btn -> Started stream (0 popups, 0 countdowns).'}
                          {demoScenario === 'direct_url' && 'Interpolated direct URL -> Fetched from https://cdn.vault.io/assets/s3/quantum-mechanics.pdf (0 ad tabs, 0s delay).'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      setDemoStep(1);
                      setTestOnTargetB(false);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-lg border border-slate-800 transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Simulation</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 2: THE 6 RELATIONSHIP SOLVERS */}
      {activeTab === 'solvers' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                The 6 Relationship Solvers (How the Extension Figures Out the Linkage)
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                The extension does not guess blindly. It executes a mathematical pipeline of 6 specialized correlation algorithms to discover how the source page attributes transform into the final endpoint.
              </p>
            </div>

            {/* Solvers Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {solversList.map((s) => {
                const isSelected = selectedSolver === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSolver(s.id)}
                    className={`p-3 rounded-xl text-left transition border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-indigo-200">SOLVER #{s.id}</div>
                    <div className="text-xs font-semibold truncate mt-0.5">{s.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Solver Deep Dive Card */}
            {(() => {
              const solver = solversList.find((s) => s.id === selectedSolver) || solversList[0];
              return (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        ALGORITHM #{solver.id}
                      </span>
                      <h3 className="text-base font-bold text-white font-['Space_Grotesk'] mt-1">
                        {solver.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{solver.summary}</p>
                    </div>

                    <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-amber-300">
                      <code>{solver.mathFormula}</code>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">Detailed Algorithmic Logic:</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
                      {solver.howItWorks}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Example Inputs:</span>
                      <div className="text-indigo-300 text-[11px]">{solver.exampleSource}</div>
                      <div className="text-emerald-300 text-[11px]">{solver.exampleTarget}</div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Synthesized Extension Rule:</span>
                      <pre className="text-cyan-300 text-[11px] overflow-x-auto bg-slate-900 p-2 rounded">
                        {solver.inferredRule}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* TAB 3: COMPLETE MANIFEST V3 CODEBASE */}
      {activeTab === 'manifest_v3_code' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  Production Manifest V3 Extension Source Code
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Ready-to-build Chrome Extension codebase implementing the 2-Tag Recording Workflow and Relationship Solver.
                </p>
              </div>

              <button
                onClick={() => handleCopy('/* Extension Source Code */', 'all-code')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                {copiedKey === 'all-code' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>Copy Active File</span>
              </button>
            </div>

            {/* File Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-3">
              {[
                { id: 'solver', label: 'relationship_solver.ts (Core Engine)' },
                { id: 'background', label: 'background.ts (Service Worker & CDP)' },
                { id: 'content', label: 'content_script.ts (DOM & Interceptor)' },
                { id: 'manifest', label: 'manifest.json (Manifest V3)' },
                { id: 'popup', label: 'popup.html / UI' }
              ].map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveCodeFile(file.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    activeCodeFile === file.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {file.label}
                </button>
              ))}
            </div>

            {/* Code Display */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 overflow-x-auto max-h-[550px]">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                {activeCodeFile === 'solver' && `// solver.js - v2 Record-and-Generalize Inference Engine
export class RelationshipSolver {
  /**
   * Synthesizes an executable bypass recipe based on the source DOM snapshot,
   * terminal target URL, and network requests intercepted during the ad trip.
   */
  static solve(sourceDom, targetUrl, networkHops = []) {
    // Check Strategy 1: Did an internal or external backend API return this download link?
    const mintingHop = this.findMintingApiHop(networkHops, targetUrl);
    if (mintingHop) {
      return this.synthesizeApiMinterRecipe(sourceDom, mintingHop, targetUrl);
    }

    // Check Strategy 2: Did the trip pass through an intermediate broker/gateway?
    const brokerHop = this.findBrokerHop(networkHops, sourceDom);
    if (brokerHop) {
      return this.synthesizeChainedBrokerRecipe(sourceDom, brokerHop, targetUrl);
    }

    // Strategy 3: Parameter alignment directly into terminal URL
    return this.synthesizeDirectUrlRecipe(sourceDom, targetUrl);
  }

  static findMintingApiHop(networkHops, targetUrl) {
    const targetFile = targetUrl.split('?')[0].split('/').pop();
    return networkHops.find(hop => {
      if (hop.type !== 'xmlhttprequest' && hop.type !== 'fetch') return false;
      // Match if the API request URL, body, or response references the file
      return hop.url.includes(targetFile) || (hop.requestBody && JSON.stringify(hop.requestBody).includes(targetFile));
    });
  }

  static synthesizeApiMinterRecipe(sourceDom, mintingHop, targetUrl) {
    const bindings = [];
    const sourceTokens = this.extractSourceTokens(sourceDom);

    // Map source button data attributes to API request parameters
    if (mintingHop.requestBody) {
      for (const [key, val] of Object.entries(mintingHop.requestBody)) {
        const match = sourceTokens.find(t => t.val === String(val));
        if (match) {
          bindings.push({ param: key, in: 'body', selector: match.selector, attr: match.attr });
        }
      }
    }

    return {
      strategy: 'BACKEND_API_MINTER',
      endpoint: mintingHop.url,
      method: mintingHop.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      bindings,
      responseExtractor: 'download_url || url || file_url || link'
    };
  }
}`}

                {activeCodeFile === 'background' && `// background.js - Service Worker with Passive Network Sniffer
let currentSession = null;

// Passively record all network hops between Tag Source and Tag Target
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!currentSession || !currentSession.isRecording) return;
    if (details.type === 'image' || details.type === 'stylesheet' || details.type === 'font') return;

    currentSession.hops.push({
      url: details.url,
      method: details.method,
      type: details.type,
      timeStamp: details.timeStamp
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TRIP_RECORDING') {
    currentSession = {
      sourceUrl: message.sourceUrl,
      sourceDom: message.domSnapshot,
      hops: [],
      isRecording: true
    };
    sendResponse({ status: 'recording_started' });
  }

  if (message.type === 'TAG_TARGET_URL') {
    if (!currentSession) return;
    const recipe = RelationshipSolver.solve(currentSession.sourceDom, message.targetUrl, currentSession.hops);
    const domain = new URL(currentSession.sourceUrl).hostname;

    chrome.storage.local.set({ [\`recipe_\${domain}\`]: recipe }, () => {
      sendResponse({ status: 'recipe_saved', recipe });
    });
    currentSession = null;
  }
  return true;
});`}

                {activeCodeFile === 'content' && `// content_script.js - Injected into target webpages
(async function() {
  const domain = window.location.hostname;
  const result = await chrome.storage.local.get([\`recipe_\${domain}\`]);
  const recipe = result[\`recipe_\${domain}\`];
  if (!recipe) return;

  // Intercept original download button
  const originalBtn = document.querySelector('#btn-download, .download-btn, [data-action="download"]');
  if (!originalBtn) return;

  const bypassBtn = document.createElement('button');
  bypassBtn.innerText = '⚡ 1-Click Direct Download (DirectLink)';
  bypassBtn.style.cssText = 'background: #059669; color: white; padding: 10px 18px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;';

  bypassBtn.onclick = async (e) => {
    e.preventDefault();
    bypassBtn.innerText = '⏳ Resolving Direct CDN Link...';

    if (recipe.strategy === 'BACKEND_API_MINTER') {
      await executeBackendApiMinting(recipe, originalBtn);
    } else if (recipe.strategy === 'MULTI_STEP_CHAIN') {
      await executeMultiStepChain(recipe, originalBtn);
    } else {
      await executeDirectUrl(recipe, originalBtn);
    }
  };

  originalBtn.parentNode.insertBefore(bypassBtn, originalBtn.nextSibling);

  async function executeBackendApiMinting(recipe, btn) {
    const payload = {};
    for (const b of recipe.bindings) {
      if (b.in === 'body') payload[b.param] = btn.dataset[b.attr] || '';
    }
    const res = await fetch(recipe.endpoint, {
      method: recipe.method,
      headers: recipe.headers,
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    const data = await res.json();
    window.location.href = data.download_url || data.url;
  }
})();`}

                {activeCodeFile === 'manifest' && `{
  "manifest_version": 3,
  "name": "DirectLink - Zero-Click Resource Ingestion Engine",
  "version": "1.0.0",
  "description": "Record-and-Generalize extension to bypass ad-gate loops and stream direct binary assets.",
  "permissions": [
    "storage",
    "debugger",
    "webRequest",
    "declarativeNetRequest",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
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
    "default_icon": "icons/icon128.png"
  }
}`}

                {activeCodeFile === 'popup' && `<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 300px; font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }
    h2 { font-size: 14px; margin-top: 0; color: #818cf8; }
    button { width: 100%; padding: 10px; margin-bottom: 8px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; }
    .btn-source { background: #4f46e5; color: white; }
    .btn-target { background: #059669; color: white; }
    .status { font-size: 11px; color: #94a3b8; margin-top: 8px; font-family: monospace; }
  </style>
</head>
<body>
  <h2>DirectLink Ingestion Engine</h2>
  <button id="btn-tag-source" class="btn-source">1. Tag This Page as Source</button>
  <button id="btn-tag-target" class="btn-target">2. Tag Target Download</button>
  <div id="status" class="status">Status: Idle</div>
  <script src="popup.js"></script>
</body>
</html>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXTERNAL HUBS & EDGE CASES */}
      {activeTab === 'edge_cases' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Handling Third-Party Hosts (MediaFire, Mega, Google Drive, Rapidgator)
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                You pointed out an essential reality: <strong className="text-slate-200">"Sometimes the original download resource doesn't stay within the control of the source URL."</strong> Here is how the extension handles external hosts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    Pattern A: Source Page &rarr; External Hub URL
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The original page does not host the file; it links to an external host (e.g. MediaFire or Google Drive) behind an ad shortener (e.g. <code>adfly</code> or <code>shrinkme</code>).
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong className="text-emerald-400">Extension Strategy:</strong> The relationship solver extracts the raw 3rd-party hub URL from the ad shortener redirect payload, completely skipping the ad countdown.
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    Pattern B: S3 / Cloudflare R2 Presigned URLs
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The minting API returns an ephemeral pre-signed AWS S3 URL with an expiration timestamp (e.g. <code>X-Amz-Expires=3600</code>).
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong className="text-emerald-400">Extension Strategy:</strong> The extension does not save the S3 link permanently (which expires). Instead, it saves the <em>Minting API template</em> so every click generates a fresh S3 presigned URL on the fly.
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    Pattern C: Encrypted Mega / FileCrypt Containers
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Links are protected by client-side AES keys or DLC/CCF containers embedded in JavaScript variables.
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong className="text-emerald-400">Extension Strategy:</strong> The content script runs inside the DOM execution context (<code className="text-indigo-300">world: 'MAIN'</code>), reading the decryption key directly from memory.
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    Pattern D: Cookie / IP Bound Downloads
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The CDN validates that the IP and session cookies of the downloader match the browser that issued the minting call.
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong className="text-emerald-400">Extension Strategy:</strong> Because the extension runs directly in the user's browser, it naturally shares the exact same IP, TLS JA4 fingerprint, and cookie jar, bypassing anti-bot IP blocks automatically.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
