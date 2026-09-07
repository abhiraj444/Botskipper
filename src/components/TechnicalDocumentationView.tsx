import React, { useState } from 'react';
import { TECHNICAL_DOCUMENTATION, DocumentationSection } from '../data/documentationData';
import { 
  BookOpen, 
  Search, 
  Check, 
  Copy, 
  Code2, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Sparkles,
  Terminal,
  Cpu
} from 'lucide-react';

export const TechnicalDocumentationView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(TECHNICAL_DOCUMENTATION[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const filteredSections = TECHNICAL_DOCUMENTATION.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = TECHNICAL_DOCUMENTATION.find((s) => s.id === activeSectionId) || TECHNICAL_DOCUMENTATION[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      
      {/* Left Sidebar Table of Contents (3 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="sticky top-20 space-y-4">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search technical spec..."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Section Navigation List */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
              <span>Specification Sections</span>
              <span>{TECHNICAL_DOCUMENTATION.length} Modules</span>
            </div>

            {filteredSections.map((sec) => {
              const isSelected = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  {sec.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Architecture Quick Meta */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Engine Architecture Info
            </span>
            <div className="text-slate-400 space-y-1 text-[11px]">
              <div>• Inference Method: <strong className="text-slate-300">Few-Shot Causal Trace Analysis</strong></div>
              <div>• Extraction Target: <strong className="text-slate-300">AST DOM & Hydration State</strong></div>
              <div>• Execution Model: <strong className="text-slate-300">Zero-Click Declarative DSL</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Documentation Reader (8 cols) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Document Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            {activeSection.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {activeSection.badge}
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">Document Revision: 2.4.0 (2026 Release)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
            {activeSection.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {activeSection.summary}
          </p>
        </div>

        {/* Formatted Markdown Content */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-200 leading-relaxed text-sm">
          <div 
            className="prose prose-invert max-w-none space-y-4"
            dangerouslySetInnerHTML={{
              __html: activeSection.content
                .replace(/### (.*?)\n/g, '<h3 class="text-lg font-bold text-white font-mono mt-6 mb-2 text-indigo-300">$1</h3>')
                .replace(/## (.*?)\n/g, '<h2 class="text-xl font-bold text-white font-mono mt-8 mb-3 border-b border-slate-800 pb-2">$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                .replace(/`([^`]+)`/g, '<code class="bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-800">$1</code>')
                .replace(/\n\n/g, '<p class="my-3 text-slate-300"></p>')
            }}
          />
        </div>

        {/* Code Snippets Section */}
        {activeSection.codeSnippets && activeSection.codeSnippets.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Executable Reference Implementations
            </h3>

            {activeSection.codeSnippets.map((snippet, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    {snippet.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {snippet.language}
                    </span>
                    <button
                      onClick={() => handleCopyCode(snippet.code, `${activeSection.id}-${idx}`)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Copy code to clipboard"
                    >
                      {copiedCodeId === `${activeSection.id}-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto max-h-96">
                  <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                    {snippet.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
