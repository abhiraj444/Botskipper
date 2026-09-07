import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  FileCode, 
  RefreshCw 
} from 'lucide-react';

export const CustomTraceLab: React.FC = () => {
  const [customHtml, setCustomHtml] = useState<string>(
`<html lang="en">
<head>
  <link rel="canonical" href="https://example-docs.org/download/quantum-computing-principles" />
  <meta name="asset-uuid" content="a8f9c102-44b1-4f9e-8812-990144aaef10" />
  <script id="__NEXT_DATA__" type="application/json">
    {"props":{"pageProps":{"document":{"id":"doc_88921","slug":"quantum-computing-principles","tokenHash":"d41d8cd98f00b204e9800998ecf8427e"}}}}
  </script>
</head>
<body>
  <div class="asset-container" data-catalog-code="CAT_QUANTUM_01" data-checksum="d41d8cd98f00b204e9800998ecf8427e">
    <h1>Principles of Quantum Computing</h1>
    <button id="btn-mint">Download PDF</button>
  </div>
</body>
</html>`
  );

  const [observedApiCall, setObservedApiCall] = useState<string>(
`GET /api/v2/mint-download?checksum=d41d8cd98f00b204e9800998ecf8427e&docId=doc_88921&uuid=a8f9c102-44b1-4f9e-8812-990144aaef10`
  );

  const [inferenceResults, setInferenceResults] = useState<any[] | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runInferenceEngine = () => {
    setIsRunning(true);
    setInferenceResults(null);

    setTimeout(() => {
      const results: any[] = [];

      // Parse customHtml for entities
      const entities: { key: string; source: string; value: string; location: string }[] = [];

      // Meta tags
      const metaMatches = customHtml.matchAll(/<meta\s+name="([^"]+)"\s+content="([^"]+)"/g);
      for (const m of metaMatches) {
        entities.push({ key: m[1], source: 'meta_tag', value: m[2], location: `meta[name="${m[1]}"]` });
      }

      // Data attributes
      const dataMatches = customHtml.matchAll(/data-([a-zA-Z0-9_-]+)="([^"]+)"/g);
      for (const m of dataMatches) {
        entities.push({ key: `data-${m[1]}`, source: 'data_attribute', value: m[2], location: `[data-${m[1]}]` });
      }

      // __NEXT_DATA__
      const nextMatch = customHtml.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextMatch) {
        try {
          const parsed = JSON.parse(nextMatch[1]);
          const doc = parsed?.props?.pageProps?.document || {};
          Object.entries(doc).forEach(([k, v]) => {
            entities.push({ key: `next.${k}`, source: 'hydration_state', value: String(v), location: `__NEXT_DATA__.props.pageProps.document.${k}` });
          });
        } catch {}
      }

      // Canonical link
      const canonMatch = customHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
      if (canonMatch) {
        entities.push({ key: 'canonicalUrl', source: 'canonical_link', value: canonMatch[1], location: 'link[rel="canonical"]' });
      }

      // Parse Observed API Call
      const urlObj = new URL(observedApiCall.replace(/^[A-Z]+\s+/, 'https://example-docs.org'));
      urlObj.searchParams.forEach((val, paramName) => {
        // Find best match in entities
        let bestMatch = entities.find((e) => e.value === val);
        if (bestMatch) {
          results.push({
            paramName,
            paramValue: val,
            matchedKey: bestMatch.key,
            source: bestMatch.source,
            location: bestMatch.location,
            transform: 'identity',
            confidence: 1.0,
            recipeRule: `$.${paramName} = ${bestMatch.location}`
          });
        } else {
          results.push({
            paramName,
            paramValue: val,
            matchedKey: 'Unknown (Heuristic Probe)',
            source: 'unmatched',
            location: '—',
            transform: 'none',
            confidence: 0.2,
            recipeRule: `Manual inspection required`
          });
        }
      });

      setInferenceResults(results);
      setIsRunning(false);
    }, 500);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
              Custom DOM & API Inference Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Paste arbitrary HTML markup, Next.js hydration state, and observed API requests to test parameter correlation algorithms in real time.
          </p>
        </div>

        <button
          onClick={runInferenceEngine}
          disabled={isRunning}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>Run Correlation Solver</span>
        </button>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom DOM Input */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              1. Input Demonstration HTML / Hydration Blob
            </span>
          </div>
          <textarea
            value={customHtml}
            onChange={(e) => setCustomHtml(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 p-4 text-xs font-mono text-slate-200 focus:outline-none resize-none"
            placeholder="Paste HTML source code with meta tags, data attributes, or __NEXT_DATA__..."
          />
        </div>

        {/* Custom Observed API Request Input */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              2. Input Observed Minting / Terminal API Request
            </span>
          </div>
          <textarea
            value={observedApiCall}
            onChange={(e) => setObservedApiCall(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 p-4 text-xs font-mono text-cyan-300 focus:outline-none resize-none"
            placeholder="GET /api/v2/mint-download?checksum=...&docId=..."
          />
        </div>
      </div>

      {/* Inferred Output Matrix */}
      {inferenceResults && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                Inference Correlation Engine Output ({inferenceResults.length} parameters bound)
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              AST Solved
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
            {inferenceResults.map((res, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400">Param: "{res.paramName}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-emerald-400">Entity: "{res.matchedKey}"</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Extracted from: <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">{res.location}</code>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    Value: {res.paramValue}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {(res.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
