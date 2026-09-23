import React from 'react';
import { 
  Play, 
  Layers, 
  Sparkles, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  FileCode,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { CodeLensItem, CodeLensReferenceLocation } from '../types';

interface CodeLensOverlayProps {
  items: CodeLensItem[];
  lineHeightPx: number;
  fontSize: number;
  paddingY: number;
  paddingX: number;
  lines: string[];
  onOpenReferences: (item: CodeLensItem) => void;
  onRunSymbol: (item: CodeLensItem) => void;
  onAskAiSymbol: (item: CodeLensItem) => void;
}

export const CodeLensOverlay: React.FC<CodeLensOverlayProps> = ({
  items,
  lineHeightPx,
  fontSize,
  paddingY,
  paddingX,
  lines,
  onOpenReferences,
  onRunSymbol,
  onAskAiSymbol,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-15 overflow-hidden">
      {items.map((item) => {
        // Line number is 1-indexed
        const lineIndex = item.line - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) return null;

        const lineText = lines[lineIndex] || '';
        // Calculate leading whitespace indentation in characters
        const indentMatch = lineText.match(/^(\s*)/);
        const indentLength = indentMatch ? indentMatch[1].length : 0;
        
        // Approximate character width for JetBrains Mono / monospace
        const charWidth = fontSize * 0.6;
        const leftPos = paddingX + indentLength * charWidth;

        // Position CodeLens right above the function line
        // We offset vertically so it rests cleanly just above the symbol text
        const topPos = paddingY + lineIndex * lineHeightPx - Math.max(14, lineHeightPx * 0.72);

        // If topPos is negative (e.g. line 1), we render it pinned to top or slightly offset
        const clampedTopPos = Math.max(0, topPos);

        return (
          <div
            key={item.id}
            style={{
              top: `${clampedTopPos}px`,
              left: `${leftPos}px`,
            }}
            className="absolute flex items-center gap-2.5 text-[11px] font-mono leading-none pointer-events-auto py-0.5 px-1.5 rounded bg-slate-950/80 backdrop-blur-xs border border-slate-800/80 shadow-xs transition-all duration-150 group hover:border-indigo-500/50 hover:bg-slate-900/90 z-20"
          >
            {/* References Counter Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenReferences(item);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
              title={`Click to view all ${item.referenceCount} reference locations`}
            >
              <Layers className="w-3 h-3 text-indigo-400/80 group-hover:text-indigo-300" />
              <span className="hover:underline underline-offset-2">
                {item.referenceCount} {item.referenceCount === 1 ? 'ref' : 'refs'}
              </span>
            </button>

            <span className="text-slate-700 select-none">|</span>

            {/* Run / Test Button (VS Code style) */}
            {item.canRun && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunSymbol(item);
                  }}
                  className="flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300 hover:underline underline-offset-2 transition-colors cursor-pointer font-medium"
                  title={`Execute ${item.symbolName}`}
                >
                  <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                  <span>{item.runLabel || 'Run'}</span>
                </button>
                <span className="text-slate-700 select-none">|</span>
              </>
            )}

            {/* Complexity Indicator (if available) */}
            {item.complexity && (
              <>
                <span 
                  className="flex items-center gap-1 text-amber-400/90"
                  title={`Estimated Time Complexity: ${item.complexity}`}
                >
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>{item.complexity}</span>
                </span>
                <span className="text-slate-700 select-none">|</span>
              </>
            )}

            {/* AI Assistant Explain Symbol */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAiSymbol(item);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer opacity-70 hover:opacity-100"
              title={`Ask Gemini Copilot to explain or optimize '${item.symbolName}'`}
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              <span className="hover:underline underline-offset-2">Explain</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
