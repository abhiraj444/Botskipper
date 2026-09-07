import React, { useState } from 'react';
import { 
  Network, 
  ArrowRight, 
  ShieldAlert, 
  Search, 
  Terminal, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  Key, 
  FileCode, 
  Database, 
  Sparkles, 
  Copy, 
  Check,
  Flame,
  Clock,
  Radio,
  Layers,
  Zap,
  Globe
} from 'lucide-react';

export const AdChainProvenanceAnalyzer: React.FC = () => {
  const [activeHop, setActiveHop] = useState<number>(1);
  const [selectedMechanism, setSelectedMechanism] = useState<number>(1);
  const [searchDemoTerm, setSearchDemoTerm] = useState<string>('bk_9948271');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const adChainHops = [
    {
      hop: 1,
      title: 'Hop 1: Original Download Page (Origin Domain)',
      domain: 'https://edu-resource-vault.org',
      path: '/books/english-grammar-practice',
      type: 'origin_page',
      description: 'User visits the book page. The download button contains hidden metadata (e.g. data-id="bk_9948271" or embedded in __NEXT_DATA__). Clicking "Download" fires a link or script that encodes this book ID into the ad link.',
      outgoingPayload: {
        method: 'GET',
        targetUrl: 'https://ad-syndicate.net/gate?pub=vault88&payload=YmtfOTk0ODI3MQ==&ref=english-grammar',
        embeddedData: {
          bookId: 'bk_9948271',
          base64Payload: 'YmtfOTk0ODI3MQ== (Base64 of "bk_9948271")',
          slug: 'english-grammar-practice'
        }
      },
      devtoolsInspection: 'In DevTools Elements tab, inspect <button id="btn-download"> or check the href attribute: href="https://ad-syndicate.net/gate?pub=vault88&payload=YmtfOTk0ODI3MQ=="'
    },
    {
      hop: 2,
      title: 'Hop 2: 1st Ad Interstitial & Popunder Gate',
      domain: 'https://ad-syndicate.net',
      path: '/gate?pub=vault88&payload=YmtfOTk0ODI3MQ==',
      type: 'ad_domain_1',
      description: 'The browser is navigated to a 3rd party ad network. The ad network serves promotional banners, registers an affiliate click, and retains the "payload" query parameter in memory / URL.',
      outgoingPayload: {
        method: '302 REDIRECT / JS Location',
        targetUrl: 'https://countdown-gate.xyz/verify-human?session=s_88190&data=YmtfOTk0ODI3MQ==',
        embeddedData: {
          forwardedPayload: 'YmtfOTk0ODI3MQ==',
          adSessionId: 's_88190'
        }
      },
      devtoolsInspection: 'In DevTools Network tab with "Preserve Log" checked, notice the 302 Redirect chain carrying ?payload= across domain boundaries.'
    },
    {
      hop: 3,
      title: 'Hop 3: Forced Countdown Timer & Verification Screen',
      domain: 'https://countdown-gate.xyz',
      path: '/verify-human?session=s_88190&data=YmtfOTk0ODI3MQ==',
      type: 'ad_domain_2',
      description: 'A 15-second JavaScript countdown runs. Once timer reaches 0, JavaScript on this page decodes the "data" param (or passes it to a completion webhook) and calls back to the original origin server.',
      outgoingPayload: {
        method: 'POST / AJAX Fetch',
        targetUrl: 'https://edu-resource-vault.org/api/v2/download-mint',
        embeddedData: {
          requestBody: {
            id: 'bk_9948271',
            resourceHash: '094875c8e2b1f4a9',
            adVerificationStatus: 'cleared_timer_15s'
          }
        }
      },
      devtoolsInspection: 'At 00:15s, look for an XHR/Fetch request sent BACK to the original domain (https://edu-resource-vault.org). This is the Minting Call!'
    },
    {
      hop: 4,
      title: 'Hop 4: The Minting API Call (The Golden Request)',
      domain: 'https://edu-resource-vault.org',
      path: '/api/v2/download-mint?id=bk_9948271&resource=094875c8e2b1f4a9',
      type: 'minting_api',
      description: 'The core server receives the request referencing the original book ID. It generates a pre-signed S3/CDN download URL and returns it in JSON response: {"cdn_direct_url": "https://cdn.edu-resource-vault.org/.../Grammar.pdf"}.',
      outgoingPayload: {
        method: 'HTTP 200 JSON Response',
        targetUrl: 'https://cdn.edu-resource-vault.org/assets/s3/094875c8e2b1f4a9/English_Grammar_Full.pdf',
        embeddedData: {
          cdnDirectUrl: 'https://cdn.edu-resource-vault.org/assets/s3/094875c8e2b1f4a9/English_Grammar_Full.pdf',
          fileSizeBytes: 50331648,
          expiresIn: 3600
        }
      },
      devtoolsInspection: 'Filter by Fetch/XHR in DevTools. Click the request -> Preview tab -> see the minted CDN URL.'
    },
    {
      hop: 5,
      title: 'Hop 5: Terminal Binary Download Event',
      domain: 'https://cdn.edu-resource-vault.org',
      path: '/assets/s3/094875c8e2b1f4a9/English_Grammar_Full.pdf',
      type: 'terminal_asset',
      description: 'The browser initiates the direct download of the actual binary file (application/pdf, 48 MB).',
      outgoingPayload: {
        method: 'GET',
        targetUrl: 'Direct Binary Stream (Content-Disposition: attachment)',
        embeddedData: {
          contentType: 'application/pdf',
          fileSize: '48.0 MB'
        }
      },
      devtoolsInspection: 'HTTP 200 OK | Content-Type: application/pdf | Size: 48 MB.'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Network className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Trace Forensics & Provenance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
              How the Final Download Link Relates to the Original Page
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-2 leading-relaxed">
              When a download button sends you through multiple ad domains and timers, the final page <strong className="text-white">must pass identifying information</strong> back to the main server to know which file you requested. Here is how state is propagated and how to isolate the request.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE 5-HOP REDIRECT TRACER */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
              1. Interactive Multi-Domain Hop-by-Hop Trace Simulator
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Click any hop below to inspect data payloads
          </span>
        </div>

        {/* Hop Stepper Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {adChainHops.map((item) => {
            const isSelected = activeHop === item.hop;
            return (
              <button
                key={item.hop}
                onClick={() => setActiveHop(item.hop)}
                className={`p-3 rounded-xl text-left transition border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold font-mono">Hop #{item.hop}</span>
                  {item.hop === 4 && <Flame className="w-3.5 h-3.5 text-amber-300" />}
                  {item.hop === 5 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                </div>
                <div className="text-xs font-semibold truncate">{item.title.split(':')[1]}</div>
                <div className={`text-[10px] font-mono truncate mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {item.domain.replace('https://', '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Hop Details Inspector */}
        {(() => {
          const currentHop = adChainHops.find((h) => h.hop === activeHop) || adChainHops[0];
          return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      HOP {currentHop.hop} OF 5
                    </span>
                    <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                      {currentHop.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Domain: <strong className="text-cyan-400">{currentHop.domain}</strong>{currentHop.path}
                  </p>
                </div>

                {currentHop.hop === 4 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center gap-1.5 animate-pulse">
                    <Flame className="w-4 h-4 text-amber-400" />
                    TARGET TO ISOLATE (MINTING CALL)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
                {currentHop.description}
              </p>

              {/* Data payload exchanged */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">Outgoing Request / Destination:</span>
                  <div className="text-indigo-300 break-all bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
                    <span className="font-bold text-emerald-400">{currentHop.outgoingPayload.method}</span>{' '}
                    {currentHop.outgoingPayload.targetUrl}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">Embedded Identity / State Data:</span>
                  <pre className="text-cyan-300 text-[11px] overflow-x-auto bg-slate-900 p-2.5 rounded border border-slate-800">
                    {JSON.stringify(currentHop.outgoingPayload.embeddedData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* How to find in DevTools */}
              <div className="bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl flex items-start gap-3">
                <Terminal className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-200 font-mono">
                    How to verify this in Chrome / Browser DevTools:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentHop.devtoolsInspection}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 2: THE 4 REAL-WORLD ARCHITECTURES */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
              2. The 4 Mechanisms Used to Link the Original Page to the Download Request
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Architectural Patterns</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Mechanism 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">
                1
              </span>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Query String & Base64 Forwarding (Stateless Chain)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The original page encodes the asset ID into the initial ad link query parameter (e.g. <code className="text-cyan-300">?data=YmtfOTk0ODI3MQ==</code>). Every subsequent ad timer page forwards this parameter in its redirect until the final page reads it and calls the original API.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
              <strong className="text-emerald-400">How to bypass:</strong> Extract the parameter directly from the original HTML and call the final API without passing through any ad URLs.
            </div>
          </div>

          {/* Mechanism 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">
                2
              </span>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Pre-Minted Session Nonce (Redis / Backend Session)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When the original download button is clicked, the site issues a background call: <code className="text-cyan-300">POST /api/create-intent &#123; bookId: "bk_994" &#125;</code>. The server saves this in Redis with a temporary session ID (<code className="text-cyan-300">sess_9981</code>). The ad chain only passes this session ID.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
              <strong className="text-emerald-400">How to bypass:</strong> Call <code className="text-slate-200">/api/create-intent</code> programmatically, then call <code className="text-slate-200">/api/claim-download</code> directly.
            </div>
          </div>

          {/* Mechanism 3 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">
                3
              </span>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Deterministic Hash Derivation (Zero Backend State)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Over 60% of commodity download portals do not store state across ad hops. The download link is generated purely client-side from a deterministic hash (e.g. <code className="text-cyan-300">md5(slug + secret_salt)</code> or embedded in <code className="text-cyan-300">__NEXT_DATA__</code>). The ad network is purely client-side monetization friction.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
              <strong className="text-emerald-400">How to bypass:</strong> Replicate the hash function or extract the pre-computed hash from the Next.js hydration blob.
            </div>
          </div>

          {/* Mechanism 4 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs font-mono">
                4
              </span>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Session Cookie & Referer Header Binding
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The original page sets a cookie (<code className="text-cyan-300">Set-Cookie: pending_asset=bk_9948271</code>). When the final redirect brings you back to the main domain, the browser automatically attaches this cookie and the <code className="text-cyan-300">Referer</code> header, allowing the server to release the download.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
              <strong className="text-emerald-400">How to bypass:</strong> Maintain a cookie jar and pass <code className="text-slate-200">Referer: https://origin.com/books/...</code> in your programmatic client.
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: STEP-BY-STEP DEVTOOLS HOW-TO GUIDE */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
              3. Practical Guide: How to Find the Request in Chrome DevTools
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Step-by-Step Procedure</span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <span>Step 1: Check "Preserve Log" (Crucial for Redirects)</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              When a website redirects you to 3rd-party ad domains, Chrome automatically clears your Network tab by default.
              <br />
              👉 <strong>Fix:</strong> Open DevTools (<kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200">F12</kbd>) $\rightarrow$ go to <strong>Network</strong> tab $\rightarrow$ check the <strong>"Preserve Log"</strong> checkbox and <strong>"Disable Cache"</strong>.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <span>Step 2: Use Network Global Search (Ctrl+F / Cmd+F)</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Take the book ID (e.g. <code className="bg-slate-950 text-cyan-300 px-1 py-0.5 rounded">bk_9948271</code>) or the URL slug from the original page.
              <br />
              👉 <strong>Action:</strong> Inside the DevTools Network tab, press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200">Ctrl+F</kbd> (or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200">Cmd+F</kbd>) to open the Network Search drawer. Type the ID or slug. DevTools will immediately highlight every request, query parameter, and JSON response that referenced this asset!
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span>Step 3: Backtrack from the Terminal PDF/ZIP Event</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Look for the very last request that returned the file (<code className="bg-slate-950 text-emerald-400 px-1 py-0.5 rounded">Content-Type: application/pdf</code> or <code className="bg-slate-950 text-emerald-400 px-1 py-0.5 rounded">application/zip</code>).
              <br />
              👉 <strong>Action:</strong> Look at the <strong>Initiator</strong> column for that request. It will point you directly to the JavaScript line or the API call that minted that URL.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span>Step 4: Test Direct Replay with cURL / Python</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Right-click the discovered Minting Request in DevTools $\rightarrow$ <strong>Copy</strong> $\rightarrow$ <strong>Copy as cURL</strong>.
              <br />
              👉 <strong>Verification:</strong> Paste the cURL command in your terminal. If it returns the download URL immediately without navigating to the ad website, you have successfully isolated the direct API contract!
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
