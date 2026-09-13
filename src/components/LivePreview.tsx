import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FileItem } from '../types';

interface LivePreviewProps {
  files: FileItem[];
  activeFile: FileItem;
  onIframeLog: (type: 'log' | 'info' | 'warn' | 'error', args: any[]) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  activeFile,
  onIframeLog,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  // Listen to postMessage from iframe for runtime logs & errors
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'cloudide-preview-frame') {
        const { type, args } = event.data;
        if (type && args) {
          onIframeLog(type, args);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onIframeLog]);

  // Construct iframe source document
  const generatePreviewSrcDoc = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html')) || (activeFile.language === 'html' ? activeFile : null);
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.jsx') || f.name.endsWith('.ts') || f.name.endsWith('.tsx'));

    let htmlContent = htmlFile ? htmlFile.content : `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="root"></div>
</body>
</html>
    `;

    // Inject Bridge script for console capture and error intercepting
    const bridgeScript = `
<script>
  (function() {
    function sendLog(type, args) {
      try {
        window.parent.postMessage({
          source: 'cloudide-preview-frame',
          type: type,
          args: Array.from(args).map(function(a) {
            if (typeof a === 'object') {
              try { return JSON.parse(JSON.stringify(a)); } catch(e) { return String(a); }
            }
            return String(a);
          })
        }, '*');
      } catch(e) {}
    }

    var originalLog = console.log;
    var originalInfo = console.info;
    var originalWarn = console.warn;
    var originalError = console.error;

    console.log = function() { originalLog.apply(console, arguments); sendLog('log', arguments); };
    console.info = function() { originalInfo.apply(console, arguments); sendLog('info', arguments); };
    console.warn = function() { originalWarn.apply(console, arguments); sendLog('warn', arguments); };
    console.error = function() { originalError.apply(console, arguments); sendLog('error', arguments); };

    window.onerror = function(msg, url, line, col, error) {
      sendLog('error', ['[Preview Error] ' + msg + ' (Line: ' + line + ')']);
    };
  })();
</script>
    `;

    // Inject custom CSS
    let customCss = '';
    cssFiles.forEach(f => {
      customCss += `<style>${f.content}</style>\n`;
    });

    // Check if there is React code in active or JS file
    let scriptTags = '';
    jsFiles.forEach(f => {
      const isReact = f.content.includes('react') || f.content.includes('createRoot') || f.content.includes('<') || f.name.endsWith('.jsx') || f.name.endsWith('.tsx');
      if (isReact) {
        // Babel Standalone transpiler for in-browser React JSX
        scriptTags += `
<script type="module">
  ${f.content}
</script>
        `;
      } else {
        scriptTags += `
<script>
  try {
    ${f.content}
  } catch(err) {
    console.error(err);
  }
</script>
        `;
      }
    });

    // If HTML file doesn't already have bridge script, inject it
    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>${bridgeScript}${customCss}`);
    } else {
      htmlContent = `${bridgeScript}${customCss}${htmlContent}`;
    }

    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${scriptTags}</body>`);
    } else {
      htmlContent = `${htmlContent}${scriptTags}`;
    }

    return htmlContent;
  };

  const getWidthStyle = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px] h-[667px] my-auto shadow-2xl rounded-2xl border-4 border-slate-700';
      case 'tablet':
        return 'max-w-[768px] h-[90%] my-auto shadow-2xl rounded-xl border-2 border-slate-700';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Viewport & Device Controls Bar */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              deviceMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="hidden md:inline font-mono text-[11px] text-slate-500">
            {deviceMode === 'desktop' ? '100% Fluid' : deviceMode === 'tablet' ? '768 × 1024' : '375 × 667'}
          </span>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reload Preview Frame"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex items-center justify-center p-2 bg-slate-950/90 overflow-hidden relative">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={generatePreviewSrcDoc()}
          title="CloudIDE Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          className={`bg-slate-950 border-0 transition-all ${getWidthStyle()}`}
        />
      </div>
    </div>
  );
};
