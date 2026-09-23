import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileItem, 
  Language, 
  EditorTheme, 
  DiffViewMode, 
  DiffHunk, 
  DiffLine 
} from '../types';
import { computeFileDiff, generateUnifiedPatch } from '../utils/diffEngine';
import { tokenizeLine, getTokenClassName, isLightTheme, getThemeBgHex } from '../utils/syntax';
import { formatTimeAgo } from '../utils/workspaceStorage';
import { 
  GitCompare, 
  Columns, 
  AlignJustify, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  BookmarkCheck, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  FileCode, 
  Plus, 
  Minus, 
  Edit3,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DiffViewerProps {
  file: FileItem;
  theme?: EditorTheme;
  fontSize?: number;
  onClose: () => void;
  onRestoreCheckpoint: (fileId: string) => void;
  onUpdateCheckpoint: (fileId: string) => void;
  onAskAiDiff?: (diffPatch: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  file,
  theme = 'vs-dark',
  fontSize = 13,
  onClose,
  onRestoreCheckpoint,
  onUpdateCheckpoint,
  onAskAiDiff,
}) => {
  const [viewMode, setViewMode] = useState<DiffViewMode>('split');
  const [activeHunkIndex, setActiveHunkIndex] = useState<number>(0);
  const [copiedPatch, setCopiedPatch] = useState(false);

  // Subtle Cross-Fade Transition state when theme changes
  const prevThemeRef = useRef<EditorTheme>(theme || 'vs-dark');
  const [crossFadeOverlay, setCrossFadeOverlay] = useState<{
    active: boolean;
    prevTheme: EditorTheme;
    key: number;
  } | null>(null);

  useEffect(() => {
    const currentTheme = theme || 'vs-dark';
    if (prevThemeRef.current !== currentTheme) {
      const oldTheme = prevThemeRef.current;
      prevThemeRef.current = currentTheme;
      setCrossFadeOverlay({
        active: true,
        prevTheme: oldTheme,
        key: Date.now(),
      });
      const timer = setTimeout(() => {
        setCrossFadeOverlay(null);
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [theme]);

  const isLight = isLightTheme(theme);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const unifiedPaneRef = useRef<HTMLDivElement>(null);
  const hunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Baseline content from checkpoint, defaulting to current content if never checkpointed
  const savedContent = file.savedContent !== undefined ? file.savedContent : file.content;
  const currentContent = file.content;

  // Compute diff and statistics
  const diffResult = useMemo(() => {
    return computeFileDiff(savedContent, currentContent);
  }, [savedContent, currentContent]);

  const { lines, hunks, summary, isClean } = diffResult;

  // Generate unified diff patch
  const patchText = useMemo(() => {
    return generateUnifiedPatch(
      file.name,
      savedContent,
      currentContent,
      file.checkpointLabel || 'Saved Checkpoint',
      'Working Copy'
    );
  }, [file.name, savedContent, currentContent, file.checkpointLabel]);

  // Synchronize scrolling in Split Mode
  const handleLeftScroll = () => {
    if (leftPaneRef.current && rightPaneRef.current) {
      rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
      rightPaneRef.current.scrollLeft = leftPaneRef.current.scrollLeft;
    }
  };

  const handleRightScroll = () => {
    if (leftPaneRef.current && rightPaneRef.current) {
      leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
      leftPaneRef.current.scrollLeft = rightPaneRef.current.scrollLeft;
    }
  };

  // Scroll to active hunk when navigating
  const scrollToHunk = (index: number) => {
    if (hunks.length === 0) return;
    const targetHunk = hunks[index];
    if (!targetHunk) return;

    setActiveHunkIndex(index);
    const targetElem = hunkRefs.current[targetHunk.id];
    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevHunk = () => {
    if (hunks.length === 0) return;
    const prev = activeHunkIndex > 0 ? activeHunkIndex - 1 : hunks.length - 1;
    scrollToHunk(prev);
  };

  const handleNextHunk = () => {
    if (hunks.length === 0) return;
    const next = activeHunkIndex < hunks.length - 1 ? activeHunkIndex + 1 : 0;
    scrollToHunk(next);
  };

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(patchText);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  // Syntax line renderer with optional character-level diff highlighting
  const renderSyntaxLine = (
    text: string | undefined, 
    lang: Language, 
    charDiffs?: { type: 'same' | 'added' | 'deleted'; text: string }[]
  ) => {
    if (text === undefined) return <span className="opacity-0"> </span>;

    // If character-level diff chunks exist, render with precision highlight
    if (charDiffs && charDiffs.length > 1) {
      return (
        <span className="font-mono">
          {charDiffs.map((chunk, idx) => {
            if (chunk.type === 'added') {
              return (
                <span 
                  key={idx} 
                  className="bg-emerald-500/40 text-emerald-100 font-semibold px-0.5 rounded-xs"
                >
                  {chunk.text}
                </span>
              );
            }
            if (chunk.type === 'deleted') {
              return (
                <span 
                  key={idx} 
                  className="bg-red-500/40 text-red-200 line-through px-0.5 rounded-xs opacity-90"
                >
                  {chunk.text}
                </span>
              );
            }
            return <span key={idx}>{chunk.text}</span>;
          })}
        </span>
      );
    }

    // Standard Syntax Tokenization
    const tokens = tokenizeLine(text, lang);
    return (
      <span className="font-mono">
        {tokens.map((token, idx) => (
          <span key={idx} className={getTokenClassName(token.type, theme as EditorTheme)}>
            {token.value}
          </span>
        ))}
      </span>
    );
  };

  const getThemeBgClass = () => {
    switch (theme) {
      case 'tokyo-night': return 'bg-[#1a1b26] text-slate-100';
      case 'dracula': return 'bg-[#282a36] text-slate-100';
      case 'monokai': return 'bg-[#272822] text-slate-100';
      case 'synthwave': return 'bg-[#241b2f] text-slate-100';
      case 'one-dark': return 'bg-[#1e1e1e] text-slate-100';
      case 'github-light': return 'bg-white text-slate-900';
      case 'vs-dark':
      default: return 'bg-slate-950 text-slate-100';
    }
  };

  return (
    <div className={`h-full flex flex-col ${getThemeBgClass()} theme-transition font-sans select-none overflow-hidden relative`}>
      {/* Subtle Cross-Fade Transition Overlay */}
      {crossFadeOverlay && crossFadeOverlay.active && (
        <div
          key={crossFadeOverlay.key}
          className="absolute inset-0 pointer-events-none z-50 animate-theme-crossfade"
          style={{
            backgroundColor: getThemeBgHex(crossFadeOverlay.prevTheme),
          }}
        />
      )}

      {/* Diff Viewer Top Toolbar */}
      <div className={`h-11 px-3 ${isLight ? 'bg-slate-100/95 border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-200'} theme-transition border-b flex items-center justify-between gap-2 shrink-0 z-20`}>
        {/* Left: Identity & Checkpoint Status */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
            <GitCompare className="w-4 h-4" />
          </div>
          
          <div className="flex items-center gap-2 truncate">
            <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'} font-mono truncate`}>
              {file.name}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-800 text-indigo-300 border-slate-700'} border`}>
              Diff Viewer
            </span>
            <span className="text-slate-500 hidden sm:inline text-xs">•</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'} truncate hidden md:inline`}>
              Baseline: <span className={`${isLight ? 'text-slate-800' : 'text-slate-300'} font-medium`}>{file.checkpointLabel || 'Last Saved Checkpoint'}</span>
              {file.lastCheckpointTime ? ` (${formatTimeAgo(file.lastCheckpointTime)})` : ''}
            </span>
          </div>
        </div>

        {/* Center: Diff Stat Badges */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
          <span 
            className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
            title={`${summary.additions} added lines`}
          >
            <Plus className="w-3 h-3" />
            <span>{summary.additions}</span>
          </span>
          <span 
            className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/30"
            title={`${summary.deletions} deleted lines`}
          >
            <Minus className="w-3 h-3" />
            <span>{summary.deletions}</span>
          </span>
          {summary.modifications > 0 && (
            <span 
              className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-500/30"
              title={`${summary.modifications} modified lines`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{summary.modifications}</span>
            </span>
          )}
        </div>

        {/* Right: Mode Switcher & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Hunk Navigator */}
          {hunks.length > 0 && (
            <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700/60 p-0.5 text-xs font-mono">
              <span className="px-2 text-[11px] text-slate-400">
                {activeHunkIndex + 1}/{hunks.length}
              </span>
              <button
                onClick={handlePrevHunk}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                title="Previous Change (Alt+▲)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextHunk}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                title="Next Change (Alt+▼)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View Mode Toggle: Split vs Unified */}
          <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700/60 p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'split' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Split View"
            >
              <Columns className="w-3 h-3" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'unified' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Inline Unified View"
            >
              <AlignJustify className="w-3 h-3" />
              <span className="hidden md:inline">Unified</span>
            </button>
          </div>

          {/* Ask AI to Explain Diff */}
          {onAskAiDiff && !isClean && (
            <button
              onClick={() => onAskAiDiff(patchText)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Explain differences using Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explain Changes</span>
            </button>
          )}

          {/* Copy Patch */}
          <button
            onClick={handleCopyPatch}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            title="Copy Unified Diff Patch"
          >
            {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Restore / Revert to Checkpoint */}
          {!isClean && (
            <button
              onClick={() => onRestoreCheckpoint(file.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Discard working changes and restore file back to last checkpoint"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Revert</span>
            </button>
          )}

          {/* Save as New Checkpoint */}
          {!isClean && (
            <button
              onClick={() => onUpdateCheckpoint(file.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Save current working content as the new baseline checkpoint"
            >
              <BookmarkCheck className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Save Checkpoint</span>
            </button>
          )}

          {/* Close Diff Viewer */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
            title="Close Diff Viewer & Return to Editor (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean State Notification (No changes relative to checkpoint) */}
      {isClean ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">
            No Differences Detected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed font-sans">
            The current file content is completely identical to the saved checkpoint baseline. Edit the file in the editor to view live line-by-line and character-level comparisons.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-colors cursor-pointer"
            >
              Return to Code Editor
            </button>
          </div>
        </div>
      ) : (
        /* Active Diff Stream */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-header showing column titles in Split Mode */}
          {viewMode === 'split' && (
            <div className="h-7 bg-slate-900 border-b border-slate-800 grid grid-cols-2 text-[11px] font-mono font-medium text-slate-400 shrink-0">
              <div className="px-3 flex items-center justify-between border-r border-slate-800 bg-rose-950/10">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Checkpoint (Saved Content)
                </span>
                <span className="text-[10px] text-slate-500">Read-Only Baseline</span>
              </div>
              <div className="px-3 flex items-center justify-between bg-emerald-950/10">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Working Tree (Current Changes)
                </span>
                <span className="text-[10px] text-slate-500">Live File</span>
              </div>
            </div>
          )}

          {/* Mode 1: Side-by-Side Split View */}
          {viewMode === 'split' ? (
            <div className="flex-1 grid grid-cols-2 overflow-hidden divide-x divide-slate-800">
              {/* Left Pane: Checkpoint / Old */}
              <div 
                ref={leftPaneRef}
                onScroll={handleLeftScroll}
                className="overflow-auto bg-slate-950 font-mono text-xs leading-relaxed select-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                <div className="min-w-max py-2">
                  {lines.map((line, idx) => {
                    const isDeleted = line.type === 'deleted';
                    const isModified = line.type === 'modified';
                    const isAdded = line.type === 'added';
                    const isUnchanged = line.type === 'unchanged';

                    // If it's pure addition in working tree, left side has blank row
                    const bgClass = isDeleted 
                      ? 'bg-rose-950/35 text-rose-200 border-l-2 border-rose-500' 
                      : isModified 
                        ? 'bg-amber-950/30 text-amber-200 border-l-2 border-amber-500' 
                        : isAdded 
                          ? 'bg-slate-900/30 opacity-40 select-none' 
                          : 'hover:bg-slate-900/50 border-l-2 border-transparent';

                    return (
                      <div 
                        key={`left-${idx}`}
                        className={`flex items-stretch px-2 py-0.5 group ${bgClass}`}
                      >
                        {/* Line Number */}
                        <div className="w-12 shrink-0 text-right pr-3 select-none text-slate-600 font-mono text-[11px]">
                          {line.oldLineNumber || ''}
                        </div>

                        {/* Gutter Symbol */}
                        <div className="w-4 shrink-0 text-center select-none font-mono text-[11px] font-bold">
                          {isDeleted && <span className="text-rose-400">-</span>}
                          {isModified && <span className="text-amber-400">~</span>}
                          {isAdded && <span className="text-slate-700">·</span>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 whitespace-pre pl-2">
                          {renderSyntaxLine(line.oldContent, file.language, isModified ? line.charDiffs : undefined)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Current Working Tree / New */}
              <div 
                ref={rightPaneRef}
                onScroll={handleRightScroll}
                className="overflow-auto bg-slate-950 font-mono text-xs leading-relaxed select-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                <div className="min-w-max py-2">
                  {lines.map((line, idx) => {
                    const isAdded = line.type === 'added';
                    const isModified = line.type === 'modified';
                    const isDeleted = line.type === 'deleted';

                    const bgClass = isAdded 
                      ? 'bg-emerald-950/35 text-emerald-200 border-l-2 border-emerald-500' 
                      : isModified 
                        ? 'bg-emerald-950/25 text-emerald-200 border-l-2 border-emerald-400' 
                        : isDeleted 
                          ? 'bg-slate-900/30 opacity-40 select-none' 
                          : 'hover:bg-slate-900/50 border-l-2 border-transparent';

                    return (
                      <div 
                        key={`right-${idx}`}
                        className={`flex items-stretch px-2 py-0.5 group ${bgClass}`}
                      >
                        {/* Line Number */}
                        <div className="w-12 shrink-0 text-right pr-3 select-none text-slate-600 font-mono text-[11px]">
                          {line.newLineNumber || ''}
                        </div>

                        {/* Gutter Symbol */}
                        <div className="w-4 shrink-0 text-center select-none font-mono text-[11px] font-bold">
                          {isAdded && <span className="text-emerald-400">+</span>}
                          {isModified && <span className="text-emerald-400">+</span>}
                          {isDeleted && <span className="text-slate-700">·</span>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 whitespace-pre pl-2">
                          {renderSyntaxLine(line.newContent, file.language, isModified ? line.charDiffs : undefined)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Unified Inline View */
            <div 
              ref={unifiedPaneRef}
              className="flex-1 overflow-auto bg-slate-950 font-mono text-xs leading-relaxed select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              <div className="min-w-max py-2">
                {lines.map((line, idx) => {
                  const isAdded = line.type === 'added';
                  const isDeleted = line.type === 'deleted';
                  const isModified = line.type === 'modified';

                  const bgClass = isDeleted 
                    ? 'bg-rose-950/35 text-rose-200 border-l-2 border-rose-500' 
                    : isAdded 
                      ? 'bg-emerald-950/35 text-emerald-200 border-l-2 border-emerald-500' 
                      : isModified 
                        ? 'bg-amber-950/30 text-amber-200 border-l-2 border-amber-500' 
                        : 'hover:bg-slate-900/50 border-l-2 border-transparent';

                  return (
                    <div 
                      key={`unified-${idx}`}
                      className={`flex items-stretch px-2 py-0.5 group ${bgClass}`}
                    >
                      {/* Old Line Number */}
                      <div className="w-10 shrink-0 text-right pr-2 select-none text-slate-600 font-mono text-[11px]">
                        {line.oldLineNumber || ''}
                      </div>

                      {/* New Line Number */}
                      <div className="w-10 shrink-0 text-right pr-3 select-none text-slate-600 font-mono text-[11px] border-r border-slate-800">
                        {line.newLineNumber || ''}
                      </div>

                      {/* Gutter Symbol */}
                      <div className="w-6 shrink-0 text-center select-none font-mono text-[11px] font-bold">
                        {isDeleted && <span className="text-rose-400 font-bold">-</span>}
                        {isAdded && <span className="text-emerald-400 font-bold">+</span>}
                        {isModified && <span className="text-amber-400 font-bold">~</span>}
                      </div>

                      {/* Content */}
                      <div className="flex-1 whitespace-pre pl-2">
                        {renderSyntaxLine(
                          line.newContent || line.oldContent, 
                          file.language, 
                          isModified ? line.charDiffs : undefined
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diff Viewer Bottom Status Bar */}
      <div className="h-7 px-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>
            {hunks.length} {hunks.length === 1 ? 'change hunk' : 'change hunks'}
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">+{summary.additions}</span>
          <span className="text-rose-400 font-semibold">-{summary.deletions}</span>
          {summary.modifications > 0 && (
            <span className="text-sky-400 font-semibold">~{summary.modifications}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Esc</kbd> to exit Diff Viewer
          </span>
          <span className="text-indigo-400 font-medium">
            {file.language.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
