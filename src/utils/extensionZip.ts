import JSZip from 'jszip';
import manifestRaw from '../../extension/manifest.json?raw';
import solverRaw from '../../extension/solver.js?raw';
import backgroundRaw from '../../extension/background.js?raw';
import contentScriptRaw from '../../extension/content_script.js?raw';
import popupHtmlRaw from '../../extension/popup.html?raw';
import popupCssRaw from '../../extension/popup.css?raw';
import popupJsRaw from '../../extension/popup.js?raw';
import readmeRaw from '../../extension/README.md?raw';

// Raw extension files directly loaded from the /extension directory
export const EXTENSION_FILES: Record<string, string> = {
  'manifest.json': manifestRaw,
  'solver.js': solverRaw,
  'background.js': backgroundRaw,
  'content_script.js': contentScriptRaw,
  'popup.html': popupHtmlRaw,
  'popup.css': popupCssRaw,
  'popup.js': popupJsRaw,
  'README.md': readmeRaw,
};

export async function downloadExtensionZip() {
  const zip = new JSZip();
  const folder = zip.folder('directlink-extension');

  if (!folder) return;

  for (const [filename, content] of Object.entries(EXTENSION_FILES)) {
    folder.file(filename, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'directlink-chrome-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
