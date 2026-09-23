import React, { useEffect, useRef } from 'react';
import { ExtendedSuggestion } from '../utils/intellisense';
import { 
  Code2, 
  Terminal, 
  Sparkles, 
  Box, 
  Braces, 
  Type, 
  Variable, 
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface IntelliSenseWidgetProps {
  suggestions: ExtendedSuggestion[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onApplySuggestion: (suggestion: ExtendedSuggestion) => void;
  position: { top: number; left: number };
  prefix: string;
}

export const IntelliSenseWidget: React.FC<IntelliSenseWidgetProps> = ({
  suggestions,
  selectedIndex,
  onSelectIndex,
  onApplySuggestion,
  position,
  prefix,
}) => {
  const activeItemRef = useRef<HTMLDivElement>(null);
  const activeItem = suggestions[selectedIndex] || suggestions[0];

  // Auto-scroll selected item into view inside popup list
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) return null;

  // Icon & color helper by kind
  const getKindBadge = (kind: string, source?: string) => {
    switch (kind) {
      case 'function':
        return {
          icon: <Braces className="w-3 h-3 text-purple-400" />,
          badge: 'fn',
          color: 'bg-purple-950/80 text-purple-300 border-purple-800/50',
        };
      case 'keyword':
        return {
          icon: <Terminal className="w-3 h-3 text-indigo-400" />,
          badge: 'key',
          color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50',
        };
      case 'snippet':
        return {
          icon: <Code2 className="w-3 h-3 text-amber-400" />,
          badge: 'snip',
          color: 'bg-amber-950/80 text-amber-300 border-amber-800/50',
        };
      case 'type':
      case 'class':
        return {
          icon: <Type className="w-3 h-3 text-emerald-400" />,
          badge: 'type',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50',
        };
      case 'variable':
        return {
          icon: <Variable className="w-3 h-3 text-sky-400" />,
          badge: source === 'identifier' ? 'local' : 'var',
          color: 'bg-sky-950/80 text-sky-300 border-sky-800/50',
        };
      default:
        return {
          icon: <Box className="w-3 h-3 text-slate-400" />,
          badge: 'item',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  // Highlight matched prefix in suggestion label
  const renderHighlightedLabel = (label: string, matchPrefix: string) => {
    if (!matchPrefix) return label;
    const lowerLabel = label.toLowerCase();
    const lowerPrefix = matchPrefix.toLowerCase();
    const idx = lowerLabel.indexOf(lowerPrefix);

    if (idx === -1) return label;

    return (
      <>
        {label.slice(0, idx)}
        <span className="text-indigo-300 font-bold bg-indigo-500/20 px-0.5 rounded">
          {label.slice(idx, idx + matchPrefix.length)}
        </span>
        {label.slice(idx + matchPrefix.length)}
      </>
    );
  };

  return (
    <div
      className="absolute z-40 flex items-start select-none font-mono animate-in fade-in zoom-in-95 duration-100 shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '90vw',
      }}
    >
      {/* Primary Suggestions List Box */}
      <div className="w-80 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Ribbon */}
        <div className="px-2.5 py-1.5 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>IntelliSense</span>
            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-normal">
              {suggestions.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span>Tab / ↵</span>
            <span className="text-slate-600">•</span>
            <span>Esc to cancel</span>
          </div>
        </div>

        {/* Suggestion Items Container */}
        <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const badgeInfo = getKindBadge(item.kind, item.source);

            return (
              <div
                key={`${item.label}-${idx}`}
                ref={isSelected ? activeItemRef : null}
                onMouseEnter={() => onSelectIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onApplySuggestion(item);
                }}
                className={`px-2 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {/* Left: Kind Icon + Label */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-0.5 rounded border ${badgeInfo.color} shrink-0`}>
                    {badgeInfo.icon}
                  </div>
                  <span className="truncate font-medium text-[12px]">
                    {renderHighlightedLabel(item.label, prefix)}
                  </span>
                </div>

                {/* Right: Kind / Detail Pill */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                      isSelected
                        ? 'bg-indigo-700/80 text-indigo-100 border-indigo-400/40'
                        : badgeInfo.color
                    }`}
                  >
                    {badgeInfo.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="px-2.5 py-1 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
          <span>↑↓ to navigate</span>
          <span className="truncate max-w-[150px]">{activeItem?.detail || ''}</span>
        </div>
      </div>

      {/* Side Documentation & Syntax Example Box (Displays if doc / details exist) */}
      {activeItem && (activeItem.doc || activeItem.detail) && (
        <div className="hidden sm:flex flex-col ml-2 w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl text-xs font-mono">
          <div className="px-2.5 py-1.5 bg-slate-950/90 border-b border-slate-800/90 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300">
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>Documentation</span>
          </div>
          <div className="p-2.5 space-y-2 max-h-56 overflow-y-auto text-slate-300 text-[11px] leading-relaxed">
            <div className="font-semibold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>{activeItem.label}</span>
              <span className="text-[10px] text-indigo-400 capitalize">{activeItem.kind}</span>
            </div>

            {activeItem.detail && (
              <p className="text-slate-400 text-[10px]">{activeItem.detail}</p>
            )}

            {activeItem.doc && (
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-slate-300 whitespace-pre-wrap font-sans text-[11px] leading-snug">
                {activeItem.doc}
              </div>
            )}

            {activeItem.insertText && activeItem.insertText !== activeItem.label && (
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Template Syntax</span>
                <pre className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto">
                  {activeItem.insertText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
