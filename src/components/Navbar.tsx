import React from 'react';
import { ViewMode, ScenarioCase } from '../types';
import { downloadExtensionZip } from '../utils/extensionZip';
import { 
  Terminal, 
  BookOpen, 
  ShieldAlert, 
  Activity, 
  Code2, 
  FlaskConical, 
  Layers, 
  Download, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Network,
  Puzzle,
  PackageCheck
} from 'lucide-react';

interface NavbarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  scenarios: ScenarioCase[];
  selectedScenario: ScenarioCase;
  onSelectScenario: (scenario: ScenarioCase) => void;
  onExportDoc: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  scenarios,
  selectedScenario,
  onSelectScenario,
  onExportDoc,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white font-['Space_Grotesk'] text-base sm:text-lg">
                  Record & Generalize
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.4 Spec
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Few-Shot Demonstration Learning for API Contract Inference
              </p>
            </div>
          </div>

          {/* Scenario Selector Dropdown */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Target:
            </span>
            <select
              value={selectedScenario.id}
              onChange={(e) => {
                const found = scenarios.find((s) => s.id === e.target.value);
                if (found) onSelectScenario(found);
              }}
              className="bg-slate-950 text-xs text-slate-200 rounded px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => onSelectMode('workbench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'workbench'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Interactive Workbench</span>
            </button>

            <button
              onClick={() => onSelectMode('ad_chain_analyzer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'ad_chain_analyzer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ad Chain</span>
            </button>

            <button
              onClick={() => onSelectMode('extension_blueprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'extension_blueprint'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5 text-amber-400" />
              <span>Extension Blueprint</span>
            </button>

            <button
              onClick={() => onSelectMode('documentation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'documentation'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Technical Spec</span>
            </button>

            <button
              onClick={() => onSelectMode('hurdles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'hurdles'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>4 Core Hurdles</span>
            </button>

            <button
              onClick={() => onSelectMode('trace_inspector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'trace_inspector'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Trace Inspector</span>
            </button>

            <button
              onClick={() => onSelectMode('custom_lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'custom_lab'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Inference Lab</span>
            </button>

            <button
              onClick={() => onSelectMode('code_exporter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentMode === 'code_exporter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code / DSL</span>
            </button>

            {/* Download Chrome Extension Button */}
            <button
              onClick={downloadExtensionZip}
              title="Download Chrome Extension (Unpacked Zip ready for chrome://extensions)"
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Get Extension (.zip)</span>
            </button>

            {/* Export Documentation Button */}
            <button
              onClick={onExportDoc}
              title="Export Full Technical Documentation as Markdown"
              className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Export Spec</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
