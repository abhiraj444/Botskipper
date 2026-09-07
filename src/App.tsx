/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewMode, ScenarioCase } from './types';
import { SCENARIOS } from './data/scenariosData';
import { TECHNICAL_DOCUMENTATION } from './data/documentationData';
import { Navbar } from './components/Navbar';
import { InteractiveWorkbench } from './components/InteractiveWorkbench';
import { TechnicalDocumentationView } from './components/TechnicalDocumentationView';
import { EngineeringHurdlesDeepDive } from './components/EngineeringHurdlesDeepDive';
import { TraceAnalyzerWorkbench } from './components/TraceAnalyzerWorkbench';
import { CustomTraceLab } from './components/CustomTraceLab';
import { RecipeCodeViewer } from './components/RecipeCodeViewer';
import { AdChainProvenanceAnalyzer } from './components/AdChainProvenanceAnalyzer';
import { ExtensionArchitectureBlueprint } from './components/ExtensionArchitectureBlueprint';
import { 
  Terminal, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Code2, 
  Layers, 
  CheckCircle2, 
  Download 
} from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>('workbench');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioCase>(SCENARIOS[0]);

  // Export Full Technical Documentation as Markdown file
  const handleExportDocumentation = () => {
    let md = `# Few-Shot Demonstration Learning for API Contract Inference and Dynamic Gatekeeper Bypassing\n`;
    md += `*Technical Specification & Architecture Reference Manual*\n`;
    md += `*Generated: ${new Date().toISOString()}*\n\n`;
    md += `---\n\n`;

    TECHNICAL_DOCUMENTATION.forEach((sec) => {
      md += `## ${sec.title}\n\n`;
      md += `> **Summary:** ${sec.summary}\n\n`;
      md += `${sec.content}\n\n`;

      if (sec.codeSnippets && sec.codeSnippets.length > 0) {
        sec.codeSnippets.forEach((snippet) => {
          md += `### ${snippet.title}\n\n`;
          md += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`;
        });
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'API_Contract_Inference_Technical_Specification.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* Navbar Navigation */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        scenarios={SCENARIOS}
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
        onExportDoc={handleExportDocumentation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentMode === 'workbench' && (
          <InteractiveWorkbench
            scenario={selectedScenario}
            onSwitchToDocumentation={() => setCurrentMode('documentation')}
            onSwitchToHurdles={() => setCurrentMode('hurdles')}
          />
        )}

        {currentMode === 'ad_chain_analyzer' && (
          <AdChainProvenanceAnalyzer />
        )}

        {currentMode === 'extension_blueprint' && (
          <ExtensionArchitectureBlueprint />
        )}

        {currentMode === 'documentation' && (
          <TechnicalDocumentationView />
        )}

        {currentMode === 'hurdles' && (
          <EngineeringHurdlesDeepDive />
        )}

        {currentMode === 'trace_inspector' && (
          <TraceAnalyzerWorkbench scenario={selectedScenario} />
        )}

        {currentMode === 'custom_lab' && (
          <CustomTraceLab />
        )}

        {currentMode === 'code_exporter' && (
          <RecipeCodeViewer scenario={selectedScenario} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-slate-400">
              Record-and-Generalize Ingestion Engine Specification
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Phase 1: Trace Observation</span>
            <span>•</span>
            <span>Phase 2: Contract Inference</span>
            <span>•</span>
            <span>Phase 3: Zero-Click Synthesis</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
