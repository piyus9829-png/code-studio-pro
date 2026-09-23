import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Search, 
  FileCode, 
  Code2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { CodeLensItem, CodeLensReferenceLocation } from '../types';

interface ReferencesPeekModalProps {
  item: CodeLensItem | null;
  onClose: () => void;
  onJumpToLocation: (fileId?: string, line?: number, col?: number) => void;
  onAskAiAboutSymbol?: (symbolName: string) => void;
}

export const ReferencesPeekModal: React.FC<ReferencesPeekModalProps> = ({
  item,
  onClose,
  onJumpToLocation,
  onAskAiAboutSymbol,
}) => {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const filteredLocations = item.referenceLocations.filter(loc => 
    (loc.fileName || '').toLowerCase().includes(filter.toLowerCase()) ||
    loc.lineContent.toLowerCase().includes(filter.toLowerCase()) ||
    String(loc.line).includes(filter)
  );

  const activeRef = filteredLocations[selectedIndex] || filteredLocations[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100 font-mono">
                  {item.symbolName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono border border-slate-700">
                  {item.referenceCount} {item.referenceCount === 1 ? 'reference' : 'references'}
                </span>
                {item.complexity && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                    {item.complexity}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                Decl: Line {item.line} {item.signature ? `• ${item.signature}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAskAiAboutSymbol && (
              <button
                onClick={() => {
                  onAskAiAboutSymbol(item.symbolName);
                  onClose();
                }}
                className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                title="Explain symbol with Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explain Symbol</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter references by file or code..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
          />
        </div>

        {/* Reference list & details */}
        <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredLocations.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-mono">
              {item.referenceCount === 0 
                ? 'No external references found (symbol defined and used internally or at declaration).'
                : 'No references matching the search query.'}
            </div>
          ) : (
            filteredLocations.map((ref, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${ref.fileName}-${ref.line}-${ref.col}-${idx}`}
                  onClick={() => {
                    setSelectedIndex(idx);
                    onJumpToLocation(ref.fileId, ref.line, ref.col);
                    onClose();
                  }}
                  className={`flex items-start justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-950/70 border border-indigo-500/50 shadow-xs' 
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <div className="mt-0.5 p-1 rounded bg-slate-800 text-slate-400 shrink-0">
                      <FileCode className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-200">
                          {ref.fileName || 'Current File'}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800/80 text-indigo-300 font-mono">
                          Ln {ref.line}, Col {ref.col + 1}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 truncate">
                        <span className="text-indigo-400 select-none mr-2 font-semibold">
                          {ref.line}:
                        </span>
                        {ref.lineContent}
                      </div>
                    </div>
                  </div>

                  <button
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded-md transition-colors shrink-0 ml-2"
                    title="Jump to code location"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd> to exit</span>
          </div>
          <div>
            Click any reference row to navigate directly
          </div>
        </div>
      </div>
    </div>
  );
};
