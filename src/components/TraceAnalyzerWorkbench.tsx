import React, { useState } from 'react';
import { ScenarioCase, NetworkRequest } from '../types';
import { 
  Activity, 
  Search, 
  Filter, 
  Terminal, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Flame,
  ArrowRight,
  Database,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface TraceAnalyzerWorkbenchProps {
  scenario: ScenarioCase;
}

export const TraceAnalyzerWorkbench: React.FC<TraceAnalyzerWorkbenchProps> = ({ scenario }) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>(scenario.networkTrace[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchUrl, setSearchUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredTrace = scenario.networkTrace.filter((req) => {
    if (filterType === 'terminal' && !req.isTerminalAsset) return false;
    if (filterType === 'minting' && !req.isMintingCall) return false;
    if (filterType === 'ad' && !req.adGateEvent && !req.initiator.includes('ad')) return false;
    if (searchUrl && !req.url.toLowerCase().includes(searchUrl.toLowerCase())) return false;
    return true;
  });

  const selectedReq = scenario.networkTrace.find((t) => t.id === selectedRequestId) || scenario.networkTrace[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
              Passive Network Trace & HAR Inspector
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Inspect raw HTTP requests, headers, cookies, payloads, and initiator call stacks captured during Demonstration Mode.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Filter by URL..."
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 rounded-lg px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
          >
            <option value="all">All Requests ({scenario.networkTrace.length})</option>
            <option value="terminal">Terminal Asset Only</option>
            <option value="minting">Minting API Only</option>
            <option value="ad">Ad / Gatekeeper Interstitials</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left List (5 cols), Right Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Request List */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono">
              Recorded Requests ({filteredTrace.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">CDP Stream</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {filteredTrace.map((req, idx) => {
              const isSelected = req.id === selectedReq?.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`p-3.5 cursor-pointer transition text-xs font-mono ${
                    isSelected
                      ? 'bg-indigo-950/50 border-l-4 border-l-indigo-500'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        req.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        req.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {req.method}
                      </span>
                      <span className="text-slate-200 font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                        {req.url.split('/').pop() || req.url}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{req.status} OK</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">{req.url}</span>
                    <span className="shrink-0">{req.durationMs}ms</span>
                  </div>

                  {req.isTerminalAsset && (
                    <div className="mt-1.5 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Terminal Asset Event
                    </div>
                  )}
                  {req.isMintingCall && (
                    <div className="mt-1.5 text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Minting API Call
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Request Detail Inspector */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {selectedReq ? (
            <div>
              {/* Top Meta Bar */}
              <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-indigo-500/20 text-indigo-300">
                      {selectedReq.method}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{selectedReq.status} {selectedReq.statusText}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Duration: {selectedReq.durationMs}ms</span>
                </div>
                <div className="text-xs font-mono text-cyan-300 break-all bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedReq.url}
                </div>
              </div>

              {/* Inspector Tabs / Sections */}
              <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
                
                {/* Request Headers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Request Headers
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedReq.requestHeaders, null, 2), 'req-headers')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'req-headers' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy JSON
                    </button>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    {Object.entries(selectedReq.requestHeaders).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-indigo-400 font-semibold">{k}:</span>
                        <span className="text-slate-300 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Headers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Response Headers
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedReq.responseHeaders, null, 2), 'res-headers')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'res-headers' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy JSON
                    </button>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    {Object.entries(selectedReq.responseHeaders).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-cyan-400 font-semibold">{k}:</span>
                        <span className="text-slate-300 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Query Params or Request Body */}
                {(Object.keys(selectedReq.queryParams).length > 0 || selectedReq.requestBody) && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Request Payload / Query Parameters
                    </span>
                    <pre className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                      {JSON.stringify(selectedReq.queryParams || selectedReq.requestBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Body Payload */}
                {selectedReq.responseBody && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Response Body (JSON)
                    </span>
                    <pre className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                      {JSON.stringify(selectedReq.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              Select a request from the left list to inspect headers and payloads.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
