import React, { useState } from 'react';
import { ScenarioCase, TestTargetItem } from '../types';
import { 
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
  Activity
} from 'lucide-react';

interface InteractiveWorkbenchProps {
  scenario: ScenarioCase;
  onSwitchToDocumentation: () => void;
  onSwitchToHurdles: () => void;
}

export const InteractiveWorkbench: React.FC<InteractiveWorkbenchProps> = ({
  scenario,
  onSwitchToDocumentation,
  onSwitchToHurdles,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedTargetItem, setSelectedTargetItem] = useState<TestTargetItem>(
    scenario.generalizationTestItems[0] || {
      name: 'Item B: Sample Target',
      url: scenario.demonstrationItem.url,
      domSnippet: '',
      expectedResult: {
        extractedEntities: {},
        terminalAssetUrl: '',
        fileSize: '45 MB',
        contentType: 'application/pdf',
        timeSavedSeconds: 20,
        adInteractionsBypassed: 3
      }
    }
  );

  const [isExecutingZeroClick, setIsExecutingZeroClick] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [activeCodeTab, setActiveCodeTab] = useState<'recipe' | 'python' | 'typescript' | 'curl'>('recipe');

  // Terminal Asset request
  const terminalReq = scenario.networkTrace.find((t) => t.isTerminalAsset);
  const mintingReq = scenario.networkTrace.find((t) => t.isMintingCall);
  const adReqs = scenario.networkTrace.filter((t) => t.adGateEvent || t.initiator.includes('ad'));

  // Run Zero-Click Ingestion Simulation
  const handleExecuteZeroClick = () => {
    setIsExecutingZeroClick(true);
    setExecutionLogs([]);
    setExecutionResult(null);

    const logs: string[] = [];
    logs.push(`[0.00s] Initializing Zero-Click Ingestion Engine v2.4`);
    logs.push(`[0.05s] Querying target URL: ${selectedTargetItem.url}`);
    setExecutionLogs([...logs]);

    setTimeout(() => {
      logs.push(`[0.12s] Document fetched (HTTP 200 OK, 64.2 KB). Parsing DOM & Hydration state...`);
      logs.push(`[0.18s] AST Extractor matched:`);
      Object.entries(selectedTargetItem.expectedResult.extractedEntities).forEach(([k, v]) => {
        logs.push(`        • ${k} => "${v}"`);
      });
      setExecutionLogs([...logs]);

      setTimeout(() => {
        if (scenario.synthesizedRecipe.mintingRequest) {
          logs.push(`[0.26s] Instantiating Minting Request: ${scenario.synthesizedRecipe.mintingRequest.endpoint}`);
          logs.push(`[0.34s] Minting API Response: Received CDN Direct Stream URL in 80ms`);
        }
        logs.push(`[0.42s] Connecting to Terminal Asset: ${selectedTargetItem.expectedResult.terminalAssetUrl}`);
        logs.push(`[0.55s] HTTP 200 OK | Content-Type: ${selectedTargetItem.expectedResult.contentType} | Stream Opened`);
        logs.push(`[✓ 0.58s] Ingestion Complete! Zero ad popups triggered. 100% direct binary retrieved.`);
        setExecutionLogs([...logs]);
        setIsExecutingZeroClick(false);
        setExecutionResult(selectedTargetItem.expectedResult);
      }, 500);
    }, 400);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner: Scenario Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {scenario.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">Domain: {scenario.targetDomain}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {scenario.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSwitchToDocumentation}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
            >
              <span>View Full Spec</span>
              <ChevronRight className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={onSwitchToHurdles}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Hurdles Analysis</span>
            </button>
          </div>
        </div>

        {/* Hurdles Quick Callouts */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenario.hurdlesEncountered.map((h, i) => (
            <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {h.hurdle.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  h.difficulty === 'Critical' ? 'bg-red-500/20 text-red-300' :
                  h.difficulty === 'High' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {h.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">{h.finding}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Step Pipeline Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { step: 1, title: '1. Demonstration Trace', subtitle: 'Network & DOM Observer', icon: Activity },
            { step: 2, title: '2. Causal Graph', subtitle: 'Backtrack Minting API', icon: Database },
            { step: 3, title: '3. Entity Correlation', subtitle: 'DOM-to-Param Matrix', icon: Cpu },
            { step: 4, title: '4. Recipe Synthesis', subtitle: 'Declarative DSL & Code', icon: FileCode },
            { step: 5, title: '5. Zero-Click Testing', subtitle: 'Item B Generalization', icon: Zap }
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeStep === item.step;
            const isCompleted = activeStep > item.step;

            return (
              <button
                key={item.step}
                onClick={() => setActiveStep(item.step)}
                className={`p-3 rounded-lg text-left transition-all relative ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : isCompleted
                    ? 'bg-slate-950 text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                    : 'bg-slate-950/40 text-slate-400 hover:bg-slate-900 border border-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold tracking-tight">{item.title}</span>
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <p className={`text-[11px] truncate ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: DEMONSTRATION TRACE & NETWORK LOGGING */}
      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Phase 1: Human-Guided Demonstration Trace (Item A)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Passive observer logged {scenario.networkTrace.length} HTTP requests, identified 1 Terminal Asset Event, and flagged {adReqs.length} ad/friction events.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Proceed to Causal Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Trace Stream Waterfall Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Network Waterfall & Initiator Sequence
              </span>
              <span className="text-[11px] text-slate-400">
                Demonstrated Target: <span className="text-slate-200 font-mono">{scenario.demonstrationItem.name}</span>
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {scenario.networkTrace.map((req, idx) => (
                <div 
                  key={req.id} 
                  className={`p-4 transition-colors ${
                    req.isTerminalAsset
                      ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500'
                      : req.isMintingCall
                      ? 'bg-indigo-950/20 border-l-4 border-l-indigo-500'
                      : req.adGateEvent
                      ? 'bg-amber-950/10 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${
                        req.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        req.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {req.method}
                      </span>
                      <span className="text-xs font-mono text-slate-200 font-semibold truncate max-w-md sm:max-w-xl">
                        {req.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">{req.durationMs}ms</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {req.status} {req.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Highlights / Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    {req.isTerminalAsset && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        TERMINAL ASSET EVENT (application/pdf binary)
                      </span>
                    )}
                    {req.isMintingCall && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-indigo-400" />
                        DISCOVERED MINTING API CALL
                      </span>
                    )}
                    {req.adGateEvent && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {req.adGateEvent}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      Type: <span className="text-slate-300">{req.contentType}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Initiator: <span className="text-slate-300">{req.initiator}</span>
                    </span>
                  </div>

                  {req.notes && (
                    <p className="mt-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      💡 <span className="text-slate-300 font-medium">Inference Analysis:</span> {req.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Demonstration DOM Snapshot */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Item A Captured DOM Snippet & Initial Hydration State
              </span>
              <span className="text-xs text-slate-400 font-mono">{scenario.demonstrationItem.url}</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono rounded-lg overflow-x-auto border border-slate-800/80 max-h-64">
              {scenario.demonstrationItem.domHtml}
            </pre>
          </div>
        </div>
      )}

      {/* STEP 2: CAUSAL DEPENDENCY GRAPH & BACKTRACKING */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Phase 2.1: Causal Dependency Backtracking
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The engine backtracks from the Terminal Asset URL to discover which intermediate API call minted the asset link, isolating the real endpoint from ad noise.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Proceed to Correlation Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visual Causal DAG */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4">
              Observed Execution Graph vs. Synthesized Direct Path
            </h3>

            <div className="space-y-4">
              {/* Full Traversed Chain */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Human Traversal Flow (25.4s total, 3 friction gates)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                    Slow & Unreproducible at Scale
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    1. Page Load (HTML + JS)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 line-through">
                    2. Ad Network Script (Adsterra/Popunder)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 line-through">
                    3. 15s Countdown Timer Gate
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="p-2.5 rounded bg-indigo-950/60 border border-indigo-500/60 text-indigo-300 font-bold">
                    4. Minting API Call
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 font-bold">
                    5. Terminal Binary CDN Stream
                  </div>
                </div>
              </div>

              {/* Synthesized Zero-Click Path */}
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Synthesized Programmatic Path (0.42s total, Zero UI)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    60x Faster • 100% Automated
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                    Raw GET HTML (0.08s)
                    <div className="text-[10px] text-slate-400">Extract AST & Meta tokens</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <div className="p-3 rounded-lg bg-indigo-900/60 border border-indigo-500 text-indigo-100 font-bold">
                    Direct Minting API (0.12s)
                    <div className="text-[10px] text-indigo-300">Pass extracted variables</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <div className="p-3 rounded-lg bg-emerald-900/60 border border-emerald-500 text-emerald-100 font-bold">
                    Stream Terminal Asset (0.22s)
                    <div className="text-[10px] text-emerald-300">Direct CDN binary</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minting Request In-Depth Card */}
          {mintingReq && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white font-mono">
                    Isolated Minting API Request Contract
                  </span>
                </div>
                <span className="text-xs text-indigo-300 font-mono">{mintingReq.method} {mintingReq.url}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-2">Query & Body Parameters:</span>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto">
                    {JSON.stringify(mintingReq.queryParams || mintingReq.requestBody, null, 2)}
                  </pre>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-2">Minted Response Payload:</span>
                  <pre className="text-emerald-300 text-[11px] overflow-x-auto">
                    {JSON.stringify(mintingReq.responseBody, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: ENTITY EXTRACTION & PARAMETER CORRELATION */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Phase 2.2: Entity Extraction & Correlation Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Comparing all candidate tokens from the DOM, URL slug, and Next.js hydration payload against the Minting API parameters.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Synthesize Recipe DSL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Extracted DOM Entities Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Candidate DOM & Hydration State Entities (Item A)
              </span>
              <span className="text-xs text-slate-400">Total Entities: {scenario.inferredEntities.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Variable Key</th>
                    <th className="p-3">Source Type</th>
                    <th className="p-3">DOM / AST Location Selector</th>
                    <th className="p-3">Observed Value</th>
                    <th className="p-3">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {scenario.inferredEntities.map((ent, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-indigo-300">{ent.key}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                          {ent.source}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{ent.location}</td>
                      <td className="p-3 text-emerald-400 font-bold">{ent.value}</td>
                      <td className="p-3 text-slate-400">{ent.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Correlation Confidence Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              API Parameter Correlation & Transformation Solver
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {scenario.correlations.map((corr, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {corr.targetLocation.toUpperCase()} Param: <span className="text-white">"{corr.targetParamName}"</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Mapped to DOM: <span className="text-white">"{corr.matchedEntityKey}"</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{corr.derivationDescription}</p>
                  </div>

                  <div className="flex items-center gap-4 min-w-max">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {(corr.confidenceScore * 100).toFixed(0)}% Confidence
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">
                        Transform: {corr.transformation}
                      </div>
                    </div>

                    <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${corr.confidenceScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SYNTHESIZED DECLARATIVE RECIPE & CODE EXPORTER */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Phase 3: Synthesized Declarative Recipe & Client Code
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The engine compiled the learned correlation rules into a declarative recipe that can be executed natively in Python, Node.js, or cURL.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(5)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Proceed to Generalization Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Code Viewer with Tab Switcher */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCodeTab('recipe')}
                  className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition ${
                    activeCodeTab === 'recipe' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Declarative Recipe JSON
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition ${
                    activeCodeTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python (httpx) Client
                </button>
                <button
                  onClick={() => setActiveCodeTab('typescript')}
                  className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition ${
                    activeCodeTab === 'typescript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TypeScript (Node.js) Client
                </button>
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition ${
                    activeCodeTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL Pipeline
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Recipe ID: <span className="text-slate-200">{scenario.synthesizedRecipe.id}</span>
              </span>
            </div>

            <div className="p-4 overflow-x-auto max-h-[500px]">
              {activeCodeTab === 'recipe' && (
                <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                  {JSON.stringify(scenario.synthesizedRecipe, null, 2)}
                </pre>
              )}

              {activeCodeTab === 'python' && (
                <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
{`# Generated Python Zero-Click Ingestion Client for ${scenario.targetDomain}
import httpx
import json
import re
from bs4 import BeautifulSoup

class IngestionClient:
    def __init__(self):
        self.session = httpx.Client(
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
            timeout=20.0
        )

    def fetch_asset(self, item_url: str, output_path: str):
        # 1. Fetch raw HTML
        res = self.session.get(item_url)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        # 2. Extract synthesized entities
        meta_id = soup.find('meta', {'name': 'book-id'})
        book_id = meta_id['content'] if meta_id else None
        
        script_data = soup.find('script', {'id': '__NEXT_DATA__'})
        next_data = json.loads(script_data.string) if script_data else {}
        file_hash = next_data.get('props', {}).get('pageProps', {}).get('book', {}).get('fileHash')

        # 3. Direct Minting Request (Zero UI / No Ad timer)
        mint_res = self.session.get(
            "${scenario.synthesizedRecipe.mintingRequest?.endpoint || ''}",
            params={"resource": file_hash, "id": book_id},
            headers={"Referer": item_url}
        )
        mint_res.raise_for_status()
        cdn_url = mint_res.json()['cdn_direct_url']

        # 4. Stream direct binary
        with self.session.stream("GET", cdn_url) as stream:
            with open(output_path, "wb") as f:
                for chunk in stream.iter_bytes():
                    f.write(chunk)
        print(f"[✓] Successfully retrieved {output_path}")`}
                </pre>
              )}

              {activeCodeTab === 'typescript' && (
                <pre className="text-xs font-mono text-indigo-300 leading-relaxed">
{`// Generated TypeScript Zero-Click Ingestion Client for ${scenario.targetDomain}
import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function ingestAsset(itemUrl: string, destinationPath: string) {
  // 1. Fetch initial HTML
  const pageRes = await fetch(itemUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  const html = await pageRes.text();

  // 2. Extract Next.js Hydration & Meta tags
  const bookIdMatch = html.match(/<meta\\s+name="book-id"\\s+content="([^"]+)"/);
  const bookId = bookIdMatch ? bookIdMatch[1] : '';

  const nextDataMatch = html.match(/<script\\s+id="__NEXT_DATA__"[^>]*>([\\s\\S]*?)<\\/script>/);
  const nextData = nextDataMatch ? JSON.parse(nextDataMatch[1]) : {};
  const fileHash = nextData?.props?.pageProps?.book?.fileHash;

  // 3. Direct Minting API Dispatch
  const mintUrl = new URL('${scenario.synthesizedRecipe.mintingRequest?.endpoint || ''}');
  mintUrl.searchParams.set('resource', fileHash);
  mintUrl.searchParams.set('id', bookId);

  const mintRes = await fetch(mintUrl.toString(), {
    headers: { 'Accept': 'application/json', 'Referer': itemUrl }
  });
  const mintJson = await mintRes.json();
  const cdnUrl = mintJson.cdn_direct_url;

  // 4. Stream binary file directly
  const assetRes = await fetch(cdnUrl);
  if (!assetRes.body) throw new Error('No body returned from CDN');
  
  // @ts-ignore
  await pipeline(assetRes.body, fs.createWriteStream(destinationPath));
  console.log(\`[✓] Downloaded \${destinationPath}\`);
}`}
                </pre>
              )}

              {activeCodeTab === 'curl' && (
                <pre className="text-xs font-mono text-amber-300 leading-relaxed">
{`# Step 1: Extract variables from Item B HTML
BOOK_ID=$(curl -s "https://edu-resource-vault.org/books/quantitative-aptitude-rs-aggarwal" | grep -oP '(?<=name="book-id" content=")[^"]+')
FILE_HASH=$(curl -s "https://edu-resource-vault.org/books/quantitative-aptitude-rs-aggarwal" | grep -oP '(?<="fileHash":")[^"]+')

# Step 2: Mint direct CDN URL without ad delay
CDN_URL=$(curl -s "https://edu-resource-vault.org/api/v2/download-mint?resource=\${FILE_HASH}&id=\${BOOK_ID}" | jq -r .cdn_direct_url)

# Step 3: Direct binary download
curl -L -o "Quantitative_Aptitude.pdf" "$CDN_URL"`}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: GENERALIZATION TEST LAB (ITEM B / C ZERO-CLICK EXECUTION) */}
      {activeStep === 5 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Phase 3.2: Live Zero-Click Generalization Test
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select an unseen Item B or Item C to verify that the synthesized recipe fetches the asset in &lt;1 second with zero ad clicks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteZeroClick}
                disabled={isExecutingZeroClick}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isExecutingZeroClick ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>Execute Zero-Click Ingestion</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Target Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenario.generalizationTestItems.map((target, idx) => {
              const isSelected = selectedTargetItem.url === target.url;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedTargetItem(target);
                    setExecutionResult(null);
                    setExecutionLogs([]);
                  }}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-300 font-mono">
                      Test Target #{idx + 1}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        ACTIVE TEST
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white font-['Space_Grotesk'] mb-1">
                    {target.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono truncate mb-3">{target.url}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Expected Size: <strong className="text-slate-200">{target.expectedResult.fileSize}</strong></span>
                    <span>•</span>
                    <span>Format: <strong className="text-slate-200">{target.expectedResult.contentType}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Execution Terminal & Results Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Terminal Output (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    Zero-Click Runtime Execution Stream
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Sandbox v2.4</span>
              </div>

              <div className="p-4 bg-slate-950 flex-1 font-mono text-xs space-y-1.5 min-h-[260px] max-h-[360px] overflow-y-auto">
                {executionLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                    <Zap className="w-8 h-8 mb-2 text-slate-600" />
                    <p className="text-xs">Click "Execute Zero-Click Ingestion" to run the test target.</p>
                  </div>
                ) : (
                  executionLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`leading-relaxed ${
                        log.includes('[✓') ? 'text-emerald-400 font-bold' :
                        log.includes('Extracted:') ? 'text-cyan-300' :
                        log.includes('Minting') ? 'text-indigo-300' :
                        'text-slate-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Generalization Benchmark Scorecard (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Ingestion Efficiency Benchmark
                  </h4>
                  {executionResult && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      SUCCESS
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Time Saved vs. Human UI Flow</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        {executionResult ? `~${executionResult.timeSavedSeconds}s Saved (98% reduction)` : '—'}
                      </span>
                    </div>
                    <Clock className="w-6 h-6 text-emerald-500/40" />
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Ad Gates & Friction Skipped</span>
                      <span className="text-lg font-bold text-cyan-400 font-mono">
                        {executionResult ? `${executionResult.adInteractionsBypassed} Gating Interactions` : '—'}
                      </span>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-cyan-500/40" />
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Binary Transfer Verification</span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {executionResult ? `${executionResult.contentType} (${executionResult.fileSize})` : '—'}
                      </span>
                    </div>
                    <FileCheck className="w-6 h-6 text-indigo-500/40" />
                  </div>
                </div>
              </div>

              {executionResult && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => alert(`Simulated direct binary stream download for: ${selectedTargetItem.name}`)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Ingested Binary ({executionResult.fileSize})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
