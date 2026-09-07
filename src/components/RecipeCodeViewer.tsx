import React, { useState } from 'react';
import { ScenarioCase } from '../types';
import { Code2, Copy, Check, Download, Terminal, Layers, Sparkles } from 'lucide-react';

interface RecipeCodeViewerProps {
  scenario: ScenarioCase;
}

export const RecipeCodeViewer: React.FC<RecipeCodeViewerProps> = ({ scenario }) => {
  const [activeTab, setActiveTab] = useState<'dsl' | 'python' | 'ts' | 'curl' | 'playwright'>('dsl');
  const [copied, setCopied] = useState<boolean>(false);

  const getCode = () => {
    switch (activeTab) {
      case 'dsl':
        return JSON.stringify(scenario.synthesizedRecipe, null, 2);
      case 'python':
        return `# Generated Python Client for ${scenario.targetDomain}
import httpx
import json
import re
from bs4 import BeautifulSoup

def ingest_item(item_url: str, output_path: str):
    session = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
        follow_redirects=True,
        timeout=30.0
    )
    
    # 1. Fetch document
    res = session.get(item_url)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    
    # 2. Extract synthesized entities
    meta_tag = soup.find("meta", {"name": "book-id"})
    book_id = meta_tag["content"] if meta_tag else None
    
    script_elem = soup.find("script", {"id": "__NEXT_DATA__"})
    next_json = json.loads(script_elem.string) if script_elem else {}
    file_hash = next_json.get("props", {}).get("pageProps", {}).get("book", {}).get("fileHash")
    
    # 3. Direct Minting Request
    mint_url = "${scenario.synthesizedRecipe.mintingRequest?.endpoint || ''}"
    mint_res = session.get(mint_url, params={"resource": file_hash, "id": book_id})
    mint_res.raise_for_status()
    cdn_url = mint_res.json()["cdn_direct_url"]
    
    # 4. Stream Terminal Binary
    with session.stream("GET", cdn_url) as stream:
        with open(output_path, "wb") as f:
            for chunk in stream.iter_bytes(chunk_size=65536):
                f.write(chunk)
                
    print(f"[✓] Zero-Click Download Completed: {output_path}")

# Run:
# ingest_item("${scenario.generalizationTestItems[0]?.url || scenario.demonstrationItem.url}", "output.pdf")`;

      case 'ts':
        return `// Generated Node.js TypeScript Client for ${scenario.targetDomain}
import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function ingestZeroClick(itemUrl: string, outputPath: string) {
  // 1. Ingest DOM
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

  // 3. Query Minting API
  const mintUrl = new URL('${scenario.synthesizedRecipe.mintingRequest?.endpoint || ''}');
  mintUrl.searchParams.set('resource', fileHash);
  mintUrl.searchParams.set('id', bookId);

  const mintRes = await fetch(mintUrl.toString(), {
    headers: { 'Accept': 'application/json', 'Referer': itemUrl }
  });
  const { cdn_direct_url } = await mintRes.json();

  // 4. Stream Direct Binary
  const assetRes = await fetch(cdn_direct_url);
  if (!assetRes.body) throw new Error('No body returned from CDN');
  
  // @ts-ignore
  await pipeline(assetRes.body, fs.createWriteStream(outputPath));
  console.log(\`[✓] Downloaded \${outputPath}\`);
}`;

      case 'curl':
        return `#!/usr/bin/env bash
# Fast Shell / cURL Ingestion Script for ${scenario.targetDomain}
TARGET_URL="${scenario.generalizationTestItems[0]?.url || scenario.demonstrationItem.url}"

echo "[*] Ingesting HTML from $TARGET_URL"
HTML=$(curl -s "$TARGET_URL")

# Extract variables
BOOK_ID=$(echo "$HTML" | grep -oP '(?<=name="book-id" content=")[^"]+')
FILE_HASH=$(echo "$HTML" | grep -oP '(?<="fileHash":")[^"]+')

echo "[+] Extracted bookId=$BOOK_ID fileHash=$FILE_HASH"

# Direct Minting API Query
CDN_URL=$(curl -s "${scenario.synthesizedRecipe.mintingRequest?.endpoint || ''}?resource=\${FILE_HASH}&id=\${BOOK_ID}" | grep -oP '(?<="cdn_direct_url":")[^"]+')

echo "[+] Minted CDN URL: $CDN_URL"

# Stream Binary
curl -L -o "downloaded_asset.pdf" "$CDN_URL"
echo "[✓] Download complete!"`;

      case 'playwright':
        return `// Playwright Stealth Headless Runner (for Anti-Bot Fallbacks)
import { chromium } from 'playwright';

export async function runStealthIngestion(url: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Intercept & block heavy ad trackers
  await page.route('**/{ad-syndicate,popunder,analytics}**', route => route.abort());

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Extract hydration directly from DOM execution context
  const fileHash = await page.evaluate(() => {
    // @ts-ignore
    return window.__NEXT_DATA__?.props?.pageProps?.book?.fileHash;
  });

  console.log(\`Extracted fileHash in stealth worker: \${fileHash}\`);
  await browser.close();
}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
              Recipe DSL & Code Exporter
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Export synthesized ingestion recipes in standard formats: Declarative JSON AST, Python httpx, Node.js TypeScript, Bash/cURL, and Playwright Stealth.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Active Code'}</span>
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'dsl', label: 'Declarative Recipe JSON' },
              { id: 'python', label: 'Python (httpx)' },
              { id: 'ts', label: 'Node.js (TypeScript)' },
              { id: 'curl', label: 'Bash / cURL' },
              { id: 'playwright', label: 'Playwright Stealth' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Target: <strong className="text-slate-200">{scenario.targetDomain}</strong>
          </span>
        </div>

        <div className="p-5 overflow-x-auto max-h-[600px]">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
            {getCode()}
          </pre>
        </div>
      </div>

    </div>
  );
};
