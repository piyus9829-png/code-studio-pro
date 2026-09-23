import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FileItem, Language, EditorTheme, EditorSettings, AutocompleteSuggestion, CodeLensItem } from '../types';
import { tokenizeLine, getTokenClassName, isLightTheme, getThemeBgHex } from '../utils/syntax';
import { getSmartSuggestions, ExtendedSuggestion, getHoverDoc, HoverInfo } from '../utils/intellisense';
import { extractCodeLensSymbols } from '../utils/codeLensParser';
import { 
  EditorCursor, 
  offsetToLineCol, 
  lineColToOffset, 
  getWordRangeAtOffset, 
  findNextOccurrence, 
  findAllOccurrences, 
  addCursorAbove, 
  addCursorBelow, 
  applyTextEdit, 
  applyBackspace, 
  applyDelete, 
  applyMoveCursors, 
  deduplicateAndSortCursors, 
  calculateSelectionSegments 
} from '../utils/multicursor';
import { IntelliSenseWidget } from './IntelliSenseWidget';
import { HoverTooltip } from './HoverTooltip';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { EditorMinimap } from './EditorMinimap';
import { CollaborativeCursorsOverlay } from './CollaborativeCursorsOverlay';
import { CollaborativePresenceBar } from './CollaborativePresenceBar';
import { CodeLensOverlay } from './CodeLensOverlay';
import { ReferencesPeekModal } from './ReferencesPeekModal';
import { useCollaborativeSession } from '../utils/useCollaborativeSession';
import { DiffViewer } from './DiffViewer';
import { 
  Copy, 
  Check, 
  Search, 
  Replace, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Code2, 
  FileCode, 
  Binary,
  Settings,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  CopyPlus,
  Hash,
  Globe,
  Layers,
  MousePointerClick,
  GitCompare
} from 'lucide-react';

interface CodeEditorProps {
  file: FileItem;
  files?: FileItem[];
  onSelectFile?: (fileId: string) => void;
  workspaceName?: string;
  onChangeContent: (content: string) => void;
  onRun: () => void;
  onAskAi: (selectedCode?: string) => void;
  onToggleDiffMode?: (fileId: string) => void;
  onRestoreCheckpoint?: (fileId: string) => void;
  onUpdateCheckpoint?: (fileId: string) => void;
  settings?: EditorSettings;
  onOpenLanguagesHub?: () => void;
}

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  autoComma: true,
  autoSemicolon: true,
  bracketPairColorization: true,
  lineNumbers: true,
  minimap: true,
  collaborativeCursors: true,
  theme: 'vs-dark',
  fontLigatures: true,
  fontFamily: 'jetbrains-mono',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  files = [],
  onSelectFile,
  workspaceName,
  onChangeContent,
  onRun,
  onAskAi,
  onToggleDiffMode,
  onRestoreCheckpoint,
  onUpdateCheckpoint,
  settings = DEFAULT_SETTINGS,
  onOpenLanguagesHub,
}) => {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, offset: 0 });
  const [cursors, setCursors] = useState<EditorCursor[]>([{ id: 'primary', start: 0, end: 0 }]);
  const [copied, setCopied] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Jump to Line Popover State
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [targetLineInput, setTargetLineInput] = useState('');

  // IntelliSense State
  const [suggestions, setSuggestions] = useState<ExtendedSuggestion[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number } | null>(null);
  const [activePrefix, setActivePrefix] = useState<string>('');

  // Hover Documentation Tooltip State
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const syntaxOverlayRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const collabOverlayRef = useRef<HTMLDivElement>(null);
  const codeLensOverlayRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCollabCursors, setShowCollabCursors] = useState(settings.collaborativeCursors !== false);
  const [showCodeLens, setShowCodeLens] = useState(settings.codeLens !== false);
  const [selectedLensItem, setSelectedLensItem] = useState<CodeLensItem | null>(null);

  const {
    collaborators,
    isSessionPaused,
    connectionStatus,
    activeRoomId,
    currentUser,
    joinRoom,
    toggleSessionPause,
    addCollaborator,
    removeCollaborator,
    resetCollaborators,
  } = useCollaborativeSession({
    content: file.content,
    fileId: file.id,
    enabled: showCollabCursors,
    onRemoteContentChange: onChangeContent,
    currentCursor: {
      line: cursorPos.line,
      col: cursorPos.col,
    },
  });

  // Extract CodeLens items (functions, classes, endpoints, test cases)
  const codeLensItems = useMemo(() => {
    if (!showCodeLens) return [];
    return extractCodeLensSymbols(file, files);
  }, [file, files, showCodeLens]);

  // Subtle Cross-Fade Transition state when theme changes
  const prevThemeRef = useRef<EditorTheme>(settings.theme || 'vs-dark');
  const [crossFadeOverlay, setCrossFadeOverlay] = useState<{
    active: boolean;
    prevTheme: EditorTheme;
    key: number;
  } | null>(null);

  useEffect(() => {
    const currentTheme = settings.theme || 'vs-dark';
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
  }, [settings.theme]);

  const isLight = isLightTheme(settings.theme);

  const lines = file.content.split('\n');

  // Exact Typography & Geometry Metrics for Pixel-Perfect Textarea/Overlay Alignment
  const fontSize = settings.fontSize || 13;
  const lineHeightPx = Math.round(fontSize * 1.57); // e.g. 13px -> 20px exact height
  
  const getEditorFontFamily = () => {
    if (settings.fontFamily === 'fira-code') {
      return "'Fira Code', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
    }
    if (settings.fontFamily === 'system-mono') {
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
    }
    return "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
  };
  const editorFontFamily = getEditorFontFamily();
  const paddingY = 12; // 12px top and bottom
  const paddingX = 14; // 14px left and right

  const sharedEditorStyles: React.CSSProperties = {
    fontFamily: editorFontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeightPx}px`,
    tabSize: settings.tabSize,
    MozTabSize: settings.tabSize,
    fontVariantLigatures: settings.fontLigatures !== false ? 'normal' : 'none',
    fontFeatureSettings: settings.fontLigatures !== false ? '"liga" 1, "calt" 1, "dlig" 1' : '"liga" 0, "calt" 0, "dlig" 0',
    letterSpacing: '0px',
    wordSpacing: '0px',
    whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: settings.wordWrap ? 'break-all' : 'normal',
    overflowWrap: settings.wordWrap ? 'break-word' : 'normal',
    boxSizing: 'border-box',
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    margin: 0,
    border: 0,
    outline: 'none',
  };

  const [scrollMetrics, setScrollMetrics] = useState({ scrollTop: 0, scrollHeight: 1, clientHeight: 1 });

  // Update scroll metrics on content change or resize
  useEffect(() => {
    if (textareaRef.current) {
      setScrollMetrics({
        scrollTop: textareaRef.current.scrollTop,
        scrollHeight: textareaRef.current.scrollHeight || 1,
        clientHeight: textareaRef.current.clientHeight || 1,
      });
    }
  }, [file.content, settings.fontSize, settings.wordWrap]);

  // Synchronize Scroll between Textarea, Syntax Overlay, Line Numbers, Minimap, and CodeLens
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft, scrollHeight, clientHeight } = e.currentTarget;
    setScrollMetrics({ scrollTop, scrollHeight, clientHeight });

    if (syntaxOverlayRef.current) {
      syntaxOverlayRef.current.scrollTop = scrollTop;
      syntaxOverlayRef.current.scrollLeft = scrollLeft;
    }
    if (collabOverlayRef.current) {
      collabOverlayRef.current.scrollTop = scrollTop;
      collabOverlayRef.current.scrollLeft = scrollLeft;
    }
    if (codeLensOverlayRef.current) {
      codeLensOverlayRef.current.scrollTop = scrollTop;
      codeLensOverlayRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    // Dismiss hover tooltip on editor scroll
    if (hoverInfo && !isHoveringTooltip) {
      setHoverInfo(null);
      setHoverPos(null);
    }
  };

  const handleMinimapScrollTo = useCallback((targetScrollTop: number) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = targetScrollTop;
      setScrollMetrics(prev => ({ ...prev, scrollTop: targetScrollTop }));
      if (syntaxOverlayRef.current) {
        syntaxOverlayRef.current.scrollTop = targetScrollTop;
      }
      if (collabOverlayRef.current) {
        collabOverlayRef.current.scrollTop = targetScrollTop;
      }
      if (codeLensOverlayRef.current) {
        codeLensOverlayRef.current.scrollTop = targetScrollTop;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = targetScrollTop;
      }
    }
  }, []);

  // --- CodeLens Action Handlers ---
  const handleOpenReferences = useCallback((item: CodeLensItem) => {
    setSelectedLensItem(item);
  }, []);

  const handleRunSymbol = useCallback((item: CodeLensItem) => {
    onRun();
  }, [onRun]);

  const handleAskAiSymbol = useCallback((item: CodeLensItem) => {
    onAskAi(`Explain the implementation, performance characteristics, and usage of \`${item.symbolName}\` (${item.kind}) declared at line ${item.line} in ${file.name}.`);
  }, [file.name, onAskAi]);

  const handleJumpToCodeLensLocation = useCallback((fileId?: string, line?: number, col?: number) => {
    if (fileId && fileId !== file.id && onSelectFile) {
      onSelectFile(fileId);
    }
    if (line !== undefined) {
      setTimeout(() => {
        handleJumpToLine(line);
      }, 50);
    }
  }, [file.id, onSelectFile]);

  // Helper to extract identifier / symbol at given character position
  const getWordAtCharPosition = (lineText: string, charPos: number): string | null => {
    if (!lineText || charPos < 0) return null;
    const isWordChar = (c: string) => /[a-zA-Z0-9_$#@.:<>-]/.test(c);
    
    const clampedPos = Math.min(charPos, lineText.length);
    let pos = clampedPos;
    if (pos === lineText.length || !isWordChar(lineText[pos])) {
      if (pos > 0 && isWordChar(lineText[pos - 1])) {
        pos = pos - 1;
      } else {
        return null;
      }
    }

    let start = pos;
    let end = pos;
    while (start > 0 && isWordChar(lineText[start - 1])) {
      start--;
    }
    while (end < lineText.length && isWordChar(lineText[end])) {
      end++;
    }

    const word = lineText.slice(start, end).trim();
    return word.length >= 2 ? word : null;
  };

  const scheduleClearHover = useCallback((delay = 180) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      if (!isHoveringTooltip) {
        setHoverInfo(null);
        setHoverPos(null);
      }
    }, delay);
  }, [isHoveringTooltip]);

  const handleEditorMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // If autocomplete suggestion popup is active, do not display hover tooltip
    if (suggestions.length > 0) {
      if (hoverInfo) {
        setHoverInfo(null);
        setHoverPos(null);
      }
      return;
    }

    if (!textareaRef.current || !editorContainerRef.current) return;
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();

    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      scheduleClearHover();
      return;
    }

    const mouseX = e.clientX - rect.left + textarea.scrollLeft;
    const mouseY = e.clientY - rect.top + textarea.scrollTop;

    const lineIdx = Math.floor((mouseY - paddingY) / lineHeightPx);
    if (lineIdx < 0 || lineIdx >= lines.length) {
      scheduleClearHover();
      return;
    }

    const lineText = lines[lineIdx];
    const approxCharWidth = fontSize * 0.602;
    const charIdx = Math.floor((mouseX - paddingX) / approxCharWidth);

    const token = getWordAtCharPosition(lineText, charIdx);
    if (!token) {
      scheduleClearHover();
      return;
    }

    // Cancel pending clear timer
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);

    // If currently showing documentation for this token, preserve it
    if (hoverInfo && (hoverInfo.name === token || hoverInfo.name.endsWith(token))) {
      return;
    }

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(() => {
      const doc = getHoverDoc(token, file.language, file.content, lineIdx, lineText);
      if (doc) {
        const containerWidth = editorContainerRef.current?.clientWidth || 700;
        const targetTop = (lineIdx * lineHeightPx) + paddingY - textarea.scrollTop;
        const targetLeft = Math.max(12, Math.min(
          containerWidth - 360,
          (charIdx * approxCharWidth) + paddingX - textarea.scrollLeft
        ));

        // Display above line if sufficient room (>170px), otherwise below line
        const tooltipTop = targetTop > 170 ? targetTop - 8 : targetTop + lineHeightPx + 8;

        setHoverInfo(doc);
        setHoverPos({
          top: Math.max(8, tooltipTop),
          left: Math.max(8, targetLeft),
        });
      } else {
        setHoverInfo(null);
        setHoverPos(null);
      }
    }, 180);
  }, [suggestions.length, hoverInfo, lines, lineHeightPx, fontSize, paddingX, paddingY, file.language, file.content, scheduleClearHover]);

  // Track cursor position & trigger IntelliSense suggestions (debounced & async)
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const selEnd = textareaRef.current.selectionEnd;

    const before = text.slice(0, selStart);
    const lineArr = before.split('\n');
    const currentLine = lineArr.length;
    const currentLineText = lineArr[lineArr.length - 1];
    const currentCol = currentLineText.length + 1;

    setCursorPos({ line: currentLine, col: currentCol, offset: selStart });

    // If single cursor mode, keep cursors in sync with selection
    setCursors(prev => {
      if (prev.length <= 1) {
        return [{ id: 'primary', start: selStart, end: selEnd }];
      }
      return prev;
    });

    // Cancel existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Autocomplete Trigger Detection (Debounced for 60fps performance)
    debounceTimerRef.current = setTimeout(() => {
      if (!textareaRef.current) return;
      const currentWordMatch = currentLineText.match(/([a-zA-Z0-9_$#.:<>@-]+)$/);

      if (currentWordMatch && currentWordMatch[1].length >= 1) {
        const prefix = currentWordMatch[1];
        const matched = getSmartSuggestions(prefix, file.language, text);

        if (matched.length > 0) {
          setSuggestions(matched);
          setSelectedSuggestionIdx(0);
          setActivePrefix(prefix);

          // Calculate precise pixel coordinates based on line height & character width
          const scrollTop = textareaRef.current.scrollTop || 0;
          const scrollLeft = textareaRef.current.scrollLeft || 0;
          const charWidth = fontSize * 0.602;

          let top = (currentLine - 1) * lineHeightPx + paddingY + lineHeightPx + 4 - scrollTop;
          let left = Math.round((currentCol - prefix.length - 1) * charWidth) + paddingX - scrollLeft;

          // Boundary adjustments
          const containerHeight = editorContainerRef.current?.clientHeight || 500;
          const containerWidth = editorContainerRef.current?.clientWidth || 700;

          if (top + 240 > containerHeight && top > 250) {
            top = Math.max(10, (currentLine - 1) * lineHeightPx + paddingY - 240 - scrollTop);
          }

          top = Math.max(8, top);
          left = Math.max(10, Math.min(left, containerWidth - 340));

          setSuggestionPos({ top, left });
          return;
        }
      }

      setSuggestions([]);
      setSuggestionPos(null);
      setActivePrefix('');
    }, 15);
  }, [file.language, fontSize, lineHeightPx, paddingX, paddingY]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // --- Multi-Cursor Action Handlers ---

  // Add Next Occurrence of current selection or word (VS Code Ctrl+D / Cmd+D)
  const handleAddNextOccurrence = useCallback(() => {
    const content = file.content;
    if (!content) return;

    const ta = textareaRef.current;
    const fallbackStart = ta ? ta.selectionStart : 0;
    const fallbackEnd = ta ? ta.selectionEnd : 0;

    const activeCursor = cursors[cursors.length - 1] || { id: 'primary', start: fallbackStart, end: fallbackEnd };
    const minOffset = Math.min(activeCursor.start, activeCursor.end);
    const maxOffset = Math.max(activeCursor.start, activeCursor.end);

    // If active cursor is a point cursor without range selection: select current word
    if (minOffset === maxOffset) {
      const wordRange = getWordRangeAtOffset(content, minOffset);
      if (wordRange) {
        const updated = cursors.map(c => 
          c.id === activeCursor.id ? { ...c, start: wordRange.start, end: wordRange.end } : c
        );
        const deduplicated = deduplicateAndSortCursors(updated);
        setCursors(deduplicated);

        if (ta) {
          ta.focus();
          ta.setSelectionRange(wordRange.start, wordRange.end);
        }
        return;
      }
    }

    // Active cursor already has a range selection
    const selectedText = content.slice(minOffset, maxOffset);
    if (!selectedText) return;

    // Find next occurrence starting after highest cursor offset
    const highestOffset = Math.max(...cursors.map(c => Math.max(c.start, c.end)));
    const match = findNextOccurrence(content, selectedText, highestOffset);

    if (match) {
      const newCursor: EditorCursor = {
        id: `cursor-${Date.now()}-${Math.random()}`,
        start: match.start,
        end: match.end,
      };
      const nextCursors = deduplicateAndSortCursors([...cursors, newCursor]);
      setCursors(nextCursors);

      // Scroll editor if necessary to bring newly selected match into view
      if (ta) {
        const loc = offsetToLineCol(content, match.start);
        const targetTop = loc.line * lineHeightPx;
        const currentScroll = ta.scrollTop;
        const height = ta.clientHeight;
        if (targetTop < currentScroll || targetTop > currentScroll + height - 60) {
          ta.scrollTo({ top: Math.max(0, targetTop - height / 3), behavior: 'smooth' });
        }
        ta.focus();
      }
    }
  }, [cursors, file.content, lineHeightPx]);

  // Select ALL Occurrences of selected text or word (VS Code Ctrl+Shift+L)
  const handleSelectAllOccurrences = useCallback(() => {
    const content = file.content;
    if (!content) return;

    const ta = textareaRef.current;
    const fallbackStart = ta ? ta.selectionStart : 0;
    const fallbackEnd = ta ? ta.selectionEnd : 0;

    const activeCursor = cursors[cursors.length - 1] || { id: 'primary', start: fallbackStart, end: fallbackEnd };
    let minOffset = Math.min(activeCursor.start, activeCursor.end);
    let maxOffset = Math.max(activeCursor.start, activeCursor.end);

    if (minOffset === maxOffset) {
      const wordRange = getWordRangeAtOffset(content, minOffset);
      if (wordRange) {
        minOffset = wordRange.start;
        maxOffset = wordRange.end;
      }
    }

    const selectedText = content.slice(minOffset, maxOffset);
    if (!selectedText) return;

    const allMatches = findAllOccurrences(content, selectedText);
    if (allMatches.length > 0) {
      const nextCursors: EditorCursor[] = allMatches.map((m, idx) => ({
        id: `cursor-all-${idx}-${Date.now()}`,
        start: m.start,
        end: m.end,
      }));
      setCursors(nextCursors);
      if (ta) ta.focus();
    }
  }, [cursors, file.content]);

  // Add Cursor Directly Above (Ctrl+Alt+Up / Cmd+Option+Up)
  const handleAddCursorAbove = useCallback(() => {
    setCursors(prev => addCursorAbove(prev, lines, file.content));
    if (textareaRef.current) textareaRef.current.focus();
  }, [lines, file.content]);

  // Add Cursor Directly Below (Ctrl+Alt+Down / Cmd+Option+Down)
  const handleAddCursorBelow = useCallback(() => {
    setCursors(prev => addCursorBelow(prev, lines, file.content));
    if (textareaRef.current) textareaRef.current.focus();
  }, [lines, file.content]);

  // Clear / Collapse Multi-Cursor back to Single Cursor (Escape or UI button)
  const handleClearMultiCursor = useCallback(() => {
    const last = cursors[cursors.length - 1] || { id: 'primary', start: 0, end: 0 };
    setCursors([{ id: 'primary', start: last.end, end: last.end }]);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(last.end, last.end);
      updateCursorPosition();
    }
  }, [cursors, updateCursorPosition]);

  // Alt + Click handler to add or remove individual cursor
  const handleEditorMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (e.altKey && textareaRef.current) {
      e.preventDefault();
      const ta = textareaRef.current;
      const rect = ta.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + ta.scrollLeft;
      const mouseY = e.clientY - rect.top + ta.scrollTop;

      const clickedLine = Math.floor((mouseY - paddingY) / lineHeightPx);
      if (clickedLine < 0 || clickedLine >= lines.length) return;

      const approxCharWidth = fontSize * 0.602;
      const clickedCol = Math.max(0, Math.min(Math.round((mouseX - paddingX) / approxCharWidth), lines[clickedLine].length));
      const clickedOffset = lineColToOffset(lines, clickedLine, clickedCol);

      // Check if a cursor already exists at this exact point
      const existingIdx = cursors.findIndex(c => Math.abs(c.end - clickedOffset) === 0);
      if (existingIdx !== -1 && cursors.length > 1) {
        setCursors(cursors.filter((_, idx) => idx !== existingIdx));
      } else {
        const next = deduplicateAndSortCursors([
          ...cursors,
          { id: `cursor-${Date.now()}-${Math.random()}`, start: clickedOffset, end: clickedOffset }
        ]);
        setCursors(next);
      }
      ta.focus();
      return;
    }
  };

  // Normal Click / Selection Handler
  const handleEditorClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!e.altKey && textareaRef.current) {
      const selStart = textareaRef.current.selectionStart;
      const selEnd = textareaRef.current.selectionEnd;
      setCursors([{ id: 'primary', start: selStart, end: selEnd }]);
      updateCursorPosition();
    }
  };

  // Paste Event Handler (Supports line-by-line distribution when pasting multi-line clipboard)
  const handleEditorPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (cursors.length > 1) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const res = applyTextEdit(file.content, cursors, pastedText);
      onChangeContent(res.newContent);
      setCursors(res.newCursors);
    }
  };

  // --- Code Line Up / Down & Navigation Utilities ---

  // Move Current Line or Multi-line Block UP
  const handleMoveLineUp = () => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const { selectionStart, selectionEnd, value } = ta;
    const linesArr = value.split('\n');
    
    // Calculate start and end line indices
    const startLineIdx = value.substring(0, selectionStart).split('\n').length - 1;
    const endLineIdx = value.substring(0, selectionEnd).split('\n').length - 1;

    if (startLineIdx === 0) return; // Already at top

    if (startLineIdx === endLineIdx) {
      // Single line move up
      const temp = linesArr[startLineIdx];
      linesArr[startLineIdx] = linesArr[startLineIdx - 1];
      linesArr[startLineIdx - 1] = temp;
      const newContent = linesArr.join('\n');
      onChangeContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = linesArr.slice(0, startLineIdx - 1).join('\n').length + (startLineIdx - 1 > 0 ? 1 : 0) + (selectionStart - (linesArr.slice(0, startLineIdx).join('\n').length + 1));
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(Math.max(0, newPos), Math.max(0, newPos));
          updateCursorPosition();
        }
      }, 0);
    } else {
      // Multi-line block move up
      const targetPrevLine = linesArr[startLineIdx - 1];
      const selectedBlock = linesArr.slice(startLineIdx, endLineIdx + 1);
      linesArr.splice(startLineIdx - 1, (endLineIdx - startLineIdx + 2), ...selectedBlock, targetPrevLine);
      onChangeContent(linesArr.join('\n'));
    }
  };

  // Move Current Line or Multi-line Block DOWN
  const handleMoveLineDown = () => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const { selectionStart, selectionEnd, value } = ta;
    const linesArr = value.split('\n');

    const startLineIdx = value.substring(0, selectionStart).split('\n').length - 1;
    const endLineIdx = value.substring(0, selectionEnd).split('\n').length - 1;

    if (endLineIdx >= linesArr.length - 1) return; // Already at bottom

    if (startLineIdx === endLineIdx) {
      // Single line move down
      const temp = linesArr[startLineIdx];
      linesArr[startLineIdx] = linesArr[startLineIdx + 1];
      linesArr[startLineIdx + 1] = temp;
      const newContent = linesArr.join('\n');
      onChangeContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = linesArr.slice(0, startLineIdx + 1).join('\n').length + 1 + Math.min(cursorPos.col - 1, linesArr[startLineIdx + 1].length);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
          updateCursorPosition();
        }
      }, 0);
    } else {
      // Multi-line block move down
      const targetNextLine = linesArr[endLineIdx + 1];
      const selectedBlock = linesArr.slice(startLineIdx, endLineIdx + 1);
      linesArr.splice(startLineIdx, (endLineIdx - startLineIdx + 2), targetNextLine, ...selectedBlock);
      onChangeContent(linesArr.join('\n'));
    }
  };

  // Duplicate Line Up / Down
  const handleDuplicateLine = (direction: 'up' | 'down') => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const { selectionStart, selectionEnd, value } = ta;

    const before = value.substring(0, selectionStart);
    const lineStart = before.lastIndexOf('\n') + 1;
    const nextLineEnd = value.indexOf('\n', selectionEnd);
    const lineEnd = nextLineEnd === -1 ? value.length : nextLineEnd;
    const currentLine = value.substring(lineStart, lineEnd);

    let newContent = '';
    if (direction === 'up') {
      newContent = value.substring(0, lineStart) + currentLine + '\n' + value.substring(lineStart);
    } else {
      newContent = value.substring(0, lineEnd) + '\n' + currentLine + value.substring(lineEnd);
    }
    onChangeContent(newContent);
  };

  // Scroll / Jump to Top of Code
  const handleScrollToTop = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      updateCursorPosition();
    }
  };

  // Scroll / Jump to Bottom of Code
  const handleScrollToBottom = () => {
    if (textareaRef.current) {
      const len = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(len, len);
      textareaRef.current.scrollTo({ top: textareaRef.current.scrollHeight, behavior: 'smooth' });
      updateCursorPosition();
    }
  };

  // Go to Line Number
  const handleGoToLine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lineNum = parseInt(targetLineInput, 10);
    if (isNaN(lineNum) || lineNum < 1 || !textareaRef.current) {
      setShowGoToLine(false);
      return;
    }

    const linesArr = file.content.split('\n');
    const clampedLine = Math.min(lineNum, linesArr.length);
    let charOffset = 0;
    for (let i = 0; i < clampedLine - 1; i++) {
      charOffset += linesArr[i].length + 1;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset);
    const scrollTarget = (clampedLine - 1) * lineHeightPx;
    textareaRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    updateCursorPosition();
    setShowGoToLine(false);
    setTargetLineInput('');
  };

  // Direct Jump to Line from Breadcrumb Symbol Outline
  const handleJumpToLine = (lineNum: number) => {
    if (!textareaRef.current) return;
    const linesArr = file.content.split('\n');
    const clampedLine = Math.max(1, Math.min(lineNum, linesArr.length));
    let charOffset = 0;
    for (let i = 0; i < clampedLine - 1; i++) {
      charOffset += linesArr[i].length + 1;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset);
    const scrollTarget = (clampedLine - 1) * lineHeightPx;
    textareaRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    updateCursorPosition();
  };

  // Insert Autocomplete Suggestion
  const insertSuggestion = (suggestion: ExtendedSuggestion) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const selStart = ta.selectionStart;
    const text = ta.value;

    const before = text.slice(0, selStart);
    const after = text.slice(selStart);
    const match = before.match(/([a-zA-Z0-9_$#.:<>@-]+)$/);
    const prefixLen = match ? match[1].length : (activePrefix ? activePrefix.length : 0);

    const newBefore = before.slice(0, before.length - prefixLen) + suggestion.insertText;
    const newContent = newBefore + after;

    onChangeContent(newContent);
    setSuggestions([]);
    setSuggestionPos(null);
    setActivePrefix('');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = newBefore.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        updateCursorPosition();
      }
    }, 10);
  };

  // Keyboard Event Interceptor: VS Code features
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd, value } = ta;

    // Dismiss active hover tooltip on any key interaction
    if (hoverInfo) {
      setHoverInfo(null);
      setHoverPos(null);
    }

    // --- Multi-Cursor Specific Key Shortcuts ---

    // Escape: Clear / Collapse Multi-Cursors
    if (e.key === 'Escape' && cursors.length > 1) {
      e.preventDefault();
      handleClearMultiCursor();
      return;
    }

    // Select Next Occurrence (Ctrl + D / Cmd + D)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleAddNextOccurrence();
      return;
    }

    // Select All Occurrences (Ctrl + Shift + L / Cmd + Shift + L)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      handleSelectAllOccurrences();
      return;
    }

    // Add Cursor Above (Ctrl + Alt + Up / Cmd + Option + Up)
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      handleAddCursorAbove();
      return;
    }

    // Add Cursor Below (Ctrl + Alt + Down / Cmd + Option + Down)
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      handleAddCursorBelow();
      return;
    }

    // --- Simultaneous Editing Across Multiple Cursors ---
    if (cursors.length > 1) {
      // Backspace across all cursors
      if (e.key === 'Backspace') {
        e.preventDefault();
        const res = applyBackspace(value, cursors);
        onChangeContent(res.newContent);
        setCursors(res.newCursors);
        return;
      }

      // Forward Delete across all cursors
      if (e.key === 'Delete') {
        e.preventDefault();
        const res = applyDelete(value, cursors);
        onChangeContent(res.newContent);
        setCursors(res.newCursors);
        return;
      }

      // Enter across all cursors
      if (e.key === 'Enter') {
        e.preventDefault();
        const res = applyTextEdit(value, cursors, '\n');
        onChangeContent(res.newContent);
        setCursors(res.newCursors);
        return;
      }

      // Tab / Indent across all cursors
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabStr = ' '.repeat(settings.tabSize || 2);
        const res = applyTextEdit(value, cursors, tabStr);
        onChangeContent(res.newContent);
        setCursors(res.newCursors);
        return;
      }

      // Cursor movement across all cursors
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : e.key === 'Home' ? 'home' : 'end';
        const next = applyMoveCursors(value, lines, cursors, dir);
        setCursors(next);
        return;
      }

      // Printable character typing across all cursors
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        let insertChar = e.key;
        if (settings.autoCloseBrackets) {
          const pairs: Record<string, string> = {
            '(': '()',
            '{': '{}',
            '[': '[]',
            '"': '""',
            "'": "''",
            '`': '``',
          };
          if (pairs[e.key]) {
            // Check if all cursors have range selections
            const anySelection = cursors.some(c => c.start !== c.end);
            if (!anySelection) {
              insertChar = pairs[e.key];
            }
          }
        }
        const res = applyTextEdit(value, cursors, insertChar);
        onChangeContent(res.newContent);
        setCursors(res.newCursors);
        return;
      }
    }

    // 0. Manual Trigger IntelliSense via Ctrl + Space
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const lineArr = before.split('\n');
      const currentLineText = lineArr[lineArr.length - 1];
      const currentWordMatch = currentLineText.match(/([a-zA-Z0-9_$#.:<>@-]+)$/);
      const prefix = currentWordMatch ? currentWordMatch[1] : '';

      const matched = getSmartSuggestions(prefix || 'a', file.language, value);
      if (matched.length > 0) {
        setSuggestions(matched);
        setSelectedSuggestionIdx(0);
        setActivePrefix(prefix);
        const scrollTop = textareaRef.current?.scrollTop || 0;
        const scrollLeft = textareaRef.current?.scrollLeft || 0;
        const charWidth = fontSize * 0.602;
        const top = Math.max(8, (lineArr.length - 1) * lineHeightPx + paddingY + lineHeightPx + 4 - scrollTop);
        const left = Math.max(10, Math.round((currentLineText.length - prefix.length) * charWidth) + paddingX - scrollLeft);
        setSuggestionPos({ top, left });
      }
      return;
    }

    // 1. If Autocomplete is active
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx(idx => (idx + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx(idx => (idx - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        setSuggestionPos(null);
        setActivePrefix('');
        return;
      }
    }

    // 2. Global Shortcuts: Run Code (Shift + Enter or Ctrl + Enter)
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // 3. Find & Replace (Ctrl + F)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // 4. Go to Line (Ctrl + G)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      setShowGoToLine(true);
      return;
    }

    // 5. Jump to Top (Ctrl + Home / Cmd + Home)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
      e.preventDefault();
      handleScrollToTop();
      return;
    }

    // 6. Jump to Bottom (Ctrl + End / Cmd + End)
    if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
      e.preventDefault();
      handleScrollToBottom();
      return;
    }

    // 7. Duplicate Line (Alt + Shift + Up / Down or Ctrl + D)
    if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      handleDuplicateLine(e.key === 'ArrowUp' ? 'up' : 'down');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleDuplicateLine('down');
      return;
    }

    // 8. Move Line Up / Down (Alt + ArrowUp / Alt + ArrowDown)
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (e.key === 'ArrowUp') handleMoveLineUp();
      else handleMoveLineDown();
      return;
    }

    // 9. Delete Line (Ctrl + Shift + K)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const linesArr = value.split('\n');
      const lineIndex = value.substring(0, selectionStart).split('\n').length - 1;
      linesArr.splice(lineIndex, 1);
      onChangeContent(linesArr.join('\n'));
      return;
    }

    // 10. Toggle Comment (Ctrl + /)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const commentChar = file.language === 'python' ? '# ' : file.language === 'sql' ? '-- ' : '// ';
      const before = value.substring(0, selectionStart);
      const lineStart = before.lastIndexOf('\n') + 1;
      const after = value.substring(selectionStart);
      const nextLine = after.indexOf('\n');
      const lineEnd = nextLine === -1 ? value.length : selectionStart + nextLine;
      const lineText = value.substring(lineStart, lineEnd);

      let newLineText = '';
      if (lineText.trimStart().startsWith(commentChar.trim())) {
        newLineText = lineText.replace(commentChar, '');
      } else {
        newLineText = commentChar + lineText;
      }

      const newContent = value.substring(0, lineStart) + newLineText + value.substring(lineEnd);
      onChangeContent(newContent);
      return;
    }

    // 8. Tab & Shift+Tab (Multi-line Indentation / Dedentation)
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabStr = ' '.repeat(settings.tabSize || 2);

      if (selectionStart !== selectionEnd) {
        // Multi-line indent/dedent
        const startLine = value.substring(0, selectionStart).lastIndexOf('\n') + 1;
        const endLine = value.indexOf('\n', selectionEnd);
        const actualEndLine = endLine === -1 ? value.length : endLine;
        const selectedBlock = value.substring(startLine, actualEndLine);
        const blockLines = selectedBlock.split('\n');

        let modifiedBlock = '';
        if (e.shiftKey) {
          // Dedent
          modifiedBlock = blockLines.map(l => l.startsWith(tabStr) ? l.slice(tabStr.length) : l.replace(/^\s+/, '')).join('\n');
        } else {
          // Indent
          modifiedBlock = blockLines.map(l => tabStr + l).join('\n');
        }

        const newContent = value.substring(0, startLine) + modifiedBlock + value.substring(actualEndLine);
        onChangeContent(newContent);
      } else {
        // Single cursor indent
        const newContent = value.substring(0, selectionStart) + tabStr + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + tabStr.length;
        }, 0);
      }
      return;
    }

    // 9. Auto-Bracket Closing & Auto-Quote Insertion (VS Code behavior)
    if (settings.autoCloseBrackets) {
      const pairs: Record<string, string> = {
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '`': '`',
        '<': '>',
      };

      const closePairs = [')', '}', ']', '"', "'", '`', '>'];

      // Closing bracket skip if cursor is already before it
      if (closePairs.includes(e.key) && value[selectionStart] === e.key && selectionStart === selectionEnd) {
        e.preventDefault();
        ta.selectionStart = ta.selectionEnd = selectionStart + 1;
        updateCursorPosition();
        return;
      }

      if (pairs[e.key] && selectionStart === selectionEnd) {
        e.preventDefault();
        const open = e.key;
        const close = pairs[e.key];
        const newContent = value.substring(0, selectionStart) + open + close + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 1;
          updateCursorPosition();
        }, 0);
        return;
      }
    }

    // 10. Auto-Indentation & Auto-Brace expansion on Enter
    if (e.key === 'Enter') {
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const currentLine = beforeCursor.split('\n').pop() || '';
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : '';
      const tabStr = ' '.repeat(settings.tabSize || 2);

      // Between { and }
      if (beforeCursor.endsWith('{') && afterCursor.startsWith('}')) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + tabStr + '\n' + currentIndent + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length + tabStr.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }

      // Open brace or colon (Python) extra indent
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':') || currentLine.trim().endsWith('(') || currentLine.trim().endsWith('[')) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + tabStr + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length + tabStr.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }

      // Auto-Comma on Enter inside object or array list
      if (settings.autoComma && (currentLine.includes(':') || currentLine.includes(',')) && !currentLine.trim().endsWith(',') && !currentLine.trim().endsWith('{') && !currentLine.trim().endsWith('[')) {
        if (afterCursor.trim().startsWith('}') || afterCursor.trim().startsWith(']')) {
          // Inside object/array
          e.preventDefault();
          const newContent = beforeCursor + ',\n' + currentIndent + afterCursor;
          onChangeContent(newContent);
          setTimeout(() => {
            const newPos = selectionStart + 2 + currentIndent.length;
            ta.selectionStart = ta.selectionEnd = newPos;
            updateCursorPosition();
          }, 0);
          return;
        }
      }

      // Normal enter preserves indent
      if (currentIndent.length > 0) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }
    }
  };

  // Find & Replace actions
  const handleFind = (query: string) => {
    setFindQuery(query);
    if (!query) {
      setMatchCount(0);
      return;
    }
    const matches = (file.content.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    setMatchCount(matches);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = file.content.replace(regex, replaceQuery);
    onChangeContent(newContent);
    setMatchCount(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeBackground = () => {
    switch (settings.theme) {
      case 'tokyo-night': return 'bg-[#1a1b26] text-slate-100 border-slate-800';
      case 'dracula': return 'bg-[#282a36] text-slate-100 border-slate-800';
      case 'monokai': return 'bg-[#272822] text-slate-100 border-slate-800';
      case 'synthwave': return 'bg-[#241b2f] text-slate-100 border-slate-800';
      case 'one-dark': return 'bg-[#1e1e1e] text-slate-100 border-slate-800';
      case 'github-light': return 'bg-white text-slate-900 border-slate-200';
      case 'vs-dark':
      default: return 'bg-slate-950 text-slate-100 border-slate-800';
    }
  };

  // If Diff Viewer mode is active for this file, render the DiffViewer directly
  if (file.isDiffActive) {
    return (
      <DiffViewer
        file={file}
        theme={settings.theme}
        fontSize={settings.fontSize}
        onClose={() => onToggleDiffMode && onToggleDiffMode(file.id)}
        onRestoreCheckpoint={(fileId) => onRestoreCheckpoint && onRestoreCheckpoint(fileId)}
        onUpdateCheckpoint={(fileId) => onUpdateCheckpoint && onUpdateCheckpoint(fileId)}
        onAskAiDiff={(patch) => onAskAi(`Please explain this code diff and recommend any fixes or optimizations:\n\`\`\`diff\n${patch}\n\`\`\``)}
      />
    );
  }

  // Compute active lines set for all cursors
  const activeLinesSet = new Set<number>(
    cursors.map(c => offsetToLineCol(file.content, c.end).line + 1)
  );
  const approxCharWidth = fontSize * 0.602;

  const isFileModifiedVsSaved = (file.savedContent !== undefined && file.savedContent !== file.content) || file.isModified;

  return (
    <div className={`w-full h-full flex flex-col ${getThemeBackground()} theme-transition border-r relative overflow-hidden select-none min-w-0 max-w-full`}>
      {/* Subtle Cross-Fade Transition Overlay on Theme Switch */}
      {crossFadeOverlay && crossFadeOverlay.active && (
        <div
          key={crossFadeOverlay.key}
          className="absolute inset-0 pointer-events-none z-40 animate-theme-crossfade"
          style={{
            backgroundColor: getThemeBgHex(crossFadeOverlay.prevTheme),
          }}
        />
      )}

      {/* VS Code Breadcrumbs Header */}
      <div className={`min-h-8 ${isLight ? 'bg-slate-100/95 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-300'} theme-transition border-b flex flex-wrap items-center justify-between px-2 sm:px-3 py-1 gap-1 text-xs shrink-0 select-none`}>
        <BreadcrumbNavigation
          file={file}
          files={files}
          cursorLine={cursorPos.line}
          onSelectFile={onSelectFile}
          onJumpToLine={handleJumpToLine}
          workspaceName={workspaceName}
          className="flex-1 min-w-0 mr-1 sm:mr-2"
        />

        <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
          {/* Multi-Cursor Tools & Indicator */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 text-slate-400 mr-0.5">
            {/* Add Next Occurrence (Ctrl+D) */}
            <button
              onClick={handleAddNextOccurrence}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Add Next Occurrence / Multi-Cursor (Ctrl+D / Cmd+D)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Select All Occurrences (Ctrl+Shift+L) */}
            <button
              onClick={handleSelectAllOccurrences}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer hidden md:flex"
              title="Select All Occurrences (Ctrl+Shift+L)"
            >
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Add Cursor Above (Ctrl+Alt+Up) */}
            <button
              onClick={handleAddCursorAbove}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer hidden sm:flex"
              title="Add Cursor Above (Ctrl+Alt+↑)"
            >
              <ArrowUp className="w-3 h-3 text-slate-400" />
            </button>

            {/* Add Cursor Below (Ctrl+Alt+Down) */}
            <button
              onClick={handleAddCursorBelow}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer hidden sm:flex"
              title="Add Cursor Below (Ctrl+Alt+↓)"
            >
              <ArrowDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Active Multi-Cursor Indicator Badge */}
          {cursors.length > 1 && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-[11px] font-mono shrink-0 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>{cursors.length} Cursors</span>
              <button
                onClick={handleClearMultiCursor}
                className="hover:text-white p-0.5 rounded hover:bg-indigo-900/60 transition-colors cursor-pointer ml-0.5"
                title="Exit Multi-Cursor (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Code Up / Down & Navigation Tools */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 text-slate-400 mr-0.5 sm:mr-1">
            {/* Scroll to Top */}
            <button
              onClick={handleScrollToTop}
              className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Scroll / Jump to Top of Code (Ctrl+Home)"
            >
              <ChevronsUp className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Move Line Up */}
            <button
              onClick={handleMoveLineUp}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Move Line / Selection Up (Alt+↑)"
            >
              <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Move Line Down */}
            <button
              onClick={handleMoveLineDown}
              className="p-1 rounded hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Move Line / Selection Down (Alt+↓)"
            >
              <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Scroll to Bottom */}
            <button
              onClick={handleScrollToBottom}
              className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Scroll / Jump to Bottom of Code (Ctrl+End)"
            >
              <ChevronsDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Duplicate Line Down */}
            <button
              onClick={() => handleDuplicateLine('down')}
              className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer hidden sm:flex"
              title="Duplicate Line Down (Alt+Shift+↓ or Ctrl+D)"
            >
              <CopyPlus className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Go to Line */}
            <button
              onClick={() => setShowGoToLine(!showGoToLine)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showGoToLine ? 'bg-indigo-950 text-indigo-300' : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Go to Line Number (Ctrl+G)"
            >
              <Hash className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Diff Viewer Toggle Button */}
          {onToggleDiffMode && (
            <button
              onClick={() => onToggleDiffMode(file.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 border ${
                isFileModifiedVsSaved
                  ? 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700/60'
              }`}
              title={isFileModifiedVsSaved ? 'Compare unsaved changes with checkpoint (Diff Viewer)' : 'Open Diff Viewer (Compare with saved checkpoint)'}
            >
              <GitCompare className={`w-3.5 h-3.5 ${isFileModifiedVsSaved ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Diff</span>
              {isFileModifiedVsSaved && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>
          )}

          {/* Ask AI for selected code */}
          <button
            onClick={() => {
              const selectedText = textareaRef.current
                ? textareaRef.current.value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
                : '';
              onAskAi(selectedText);
            }}
            className="px-1.5 sm:px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Ask Gemini Copilot about selected code"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Collaborative Session Presence Indicator & Peer Menu */}
          <CollaborativePresenceBar
            collaborators={collaborators}
            isSessionPaused={isSessionPaused}
            connectionStatus={connectionStatus}
            activeRoomId={activeRoomId}
            currentUser={currentUser}
            onJoinRoom={joinRoom}
            onTogglePause={toggleSessionPause}
            onAddCollaborator={addCollaborator}
            onResetCollaborators={resetCollaborators}
            onJumpToCollaborator={handleJumpToLine}
            showCursors={showCollabCursors}
            onToggleShowCursors={() => setShowCollabCursors(!showCollabCursors)}
          />

          {/* Find & Replace toggle */}
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              showFind ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Find and Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Copy code */}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy entire file content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Go to Line Popover */}
      {showGoToLine && (
        <form onSubmit={handleGoToLine} className="p-2 bg-slate-900 border-b border-indigo-500/30 flex items-center gap-2 text-xs shrink-0 animate-fade-in">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-700">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="number"
              min="1"
              max={lines.length}
              autoFocus
              placeholder={`Go to line (1 - ${lines.length})...`}
              value={targetLineInput}
              onChange={(e) => setTargetLineInput(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-44 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
          >
            Jump
          </button>
          <button
            type="button"
            onClick={() => setShowGoToLine(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Find & Replace Bar */}
      {showFind && (
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs shrink-0 animate-fade-in">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => handleFind(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-32 font-mono"
            />
            {matchCount > 0 && (
              <span className="text-[10px] text-slate-500">{matchCount} matches</span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Replace className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-32 font-mono"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            disabled={!findQuery || matchCount === 0}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[11px] transition-colors cursor-pointer"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Main Canvas: Split into Line Numbers & Syntax Overlay & Textarea */}
      <div 
        ref={editorContainerRef}
        onMouseMove={handleEditorMouseMove}
        onMouseLeave={() => scheduleClearHover(200)}
        className={`flex-1 flex overflow-hidden relative select-text ${isLight ? 'bg-slate-50/40' : 'bg-slate-950/20'} theme-transition w-full max-w-full min-w-0`}
        style={{ fontFamily: editorFontFamily, fontSize: `${fontSize}px` }}
      >
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div 
            ref={lineNumbersRef}
            className={`w-9 sm:w-12 ${isLight ? 'bg-slate-100/80 border-slate-200 text-slate-400' : 'bg-slate-950/70 border-slate-900 text-slate-600'} theme-transition border-r select-none text-right pr-1.5 sm:pr-3 shrink-0 overflow-hidden`}
            style={{
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              fontFamily: editorFontFamily,
            }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrent = activeLinesSet.has(lineNum);
              return (
                <div
                  key={idx}
                  style={{
                    height: `${lineHeightPx}px`,
                    lineHeight: `${lineHeightPx}px`,
                    fontSize: `${Math.max(10, fontSize - 3)}px`,
                  }}
                  className={`font-mono transition-colors ${
                    isCurrent 
                      ? isLight 
                        ? 'text-indigo-600 font-bold bg-indigo-100/60 rounded-sm' 
                        : 'text-indigo-400 font-bold bg-indigo-950/40 rounded-sm' 
                      : isLight 
                      ? 'hover:text-slate-700' 
                      : 'hover:text-slate-400'
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Code Canvas Container */}
        <div className="flex-1 min-w-0 relative overflow-hidden w-full max-w-full">
          {/* Active Line Highlight Ribbon(s) */}
          {Array.from(activeLinesSet).map((activeLine) => (
            <div
              key={`active-line-${activeLine}`}
              className={`absolute left-0 right-0 ${isLight ? 'bg-indigo-50/70 border-indigo-200/50' : 'bg-slate-800/35 border-slate-700/25'} pointer-events-none border-y z-0 transition-all duration-75`}
              style={{
                top: `${(activeLine - 1) * lineHeightPx + paddingY}px`,
                height: `${lineHeightPx}px`,
              }}
            />
          ))}

          {/* Multi-Cursor Visual Selection Highlight & Carets Layer */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-5"
            style={sharedEditorStyles}
          >
            {/* Selection Highlight Rectangles */}
            {cursors.map((c) => {
              if (c.start === c.end) return null;
              const segments = calculateSelectionSegments(file.content, lines, c);
              return segments.map((seg, sIdx) => {
                const segTop = seg.line * lineHeightPx + paddingY;
                const segLeft = Math.round(seg.startCol * approxCharWidth) + paddingX;
                const segWidth = Math.max(4, Math.round((seg.endCol - seg.startCol) * approxCharWidth));
                return (
                  <div
                    key={`${c.id}-seg-${sIdx}`}
                    className={`absolute ${isLight ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-indigo-500/30 border-indigo-400/50'} border rounded-[2px]`}
                    style={{
                      top: `${segTop}px`,
                      left: `${segLeft}px`,
                      width: `${segWidth}px`,
                      height: `${lineHeightPx}px`,
                    }}
                  />
                );
              });
            })}

            {/* Multi-Cursor Blinking Carets */}
            {cursors.length > 1 && cursors.map((c, idx) => {
              const loc = offsetToLineCol(file.content, c.end);
              const top = loc.line * lineHeightPx + paddingY;
              const left = Math.round(loc.col * approxCharWidth) + paddingX;
              return (
                <div
                  key={c.id || idx}
                  className={`absolute w-[2px] ${isLight ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.7)]' : 'bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.9)]'} rounded-full animate-pulse`}
                  style={{
                    top: `${top}px`,
                    left: `${left}px`,
                    height: `${lineHeightPx}px`,
                    zIndex: 6,
                  }}
                />
              );
            })}
          </div>

          {/* Syntax Highlight Overlay (Synchronized Scroll) */}
          <div
            ref={syntaxOverlayRef}
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-1 w-full theme-transition"
            style={sharedEditorStyles}
          >
            {lines.map((line, idx) => (
              <div 
                key={idx}
                style={{
                  height: `${lineHeightPx}px`,
                  lineHeight: `${lineHeightPx}px`,
                }}
              >
                {line.length === 0 ? (
                  '\u00A0'
                ) : (
                  tokenizeLine(line, file.language).map((token, tIdx) => (
                    <span
                      key={tIdx}
                      className={`${getTokenClassName(token.type, settings.theme)} theme-transition`}
                    >
                      {token.value}
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>

          {/* Real-time Collaborative Cursors & Username Badges Layer (Synchronized Scroll) */}
          {showCollabCursors && (
            <div
              ref={collabOverlayRef}
              className="absolute inset-0 pointer-events-none overflow-hidden select-none z-20 w-full"
              style={sharedEditorStyles}
            >
              <CollaborativeCursorsOverlay
                collaborators={collaborators}
                fontSize={fontSize}
                lineHeightPx={lineHeightPx}
                approxCharWidth={approxCharWidth}
                paddingY={paddingY}
                paddingX={paddingX}
                lines={lines}
                onJumpToLine={handleJumpToLine}
              />
            </div>
          )}

          {/* VS Code CodeLens Layer (Functions, Classes, References, Run Actions) */}
          {showCodeLens && codeLensItems.length > 0 && (
            <div
              ref={codeLensOverlayRef}
              className="absolute inset-0 pointer-events-none overflow-hidden select-none z-25 w-full"
              style={sharedEditorStyles}
            >
              <CodeLensOverlay
                items={codeLensItems}
                lineHeightPx={lineHeightPx}
                fontSize={fontSize}
                paddingY={paddingY}
                paddingX={paddingX}
                lines={lines}
                onOpenReferences={handleOpenReferences}
                onRunSymbol={handleRunSymbol}
                onAskAiSymbol={handleAskAiSymbol}
              />
            </div>
          )}

          {/* Editable Transparent Interactive Textarea (Caret matches underlying text 1:1, horizontal scroll enabled) */}
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={(e) => {
              onChangeContent(e.target.value);
              updateCursorPosition();
            }}
            onKeyDown={handleKeyDown}
            onMouseDown={handleEditorMouseDown}
            onClick={handleEditorClick}
            onKeyUp={updateCursorPosition}
            onSelect={updateCursorPosition}
            onPaste={handleEditorPaste}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={`absolute inset-0 w-full h-full resize-none bg-transparent focus:outline-none z-10 ${isLight ? 'selection:bg-indigo-100 selection:text-indigo-950' : 'selection:bg-indigo-500/40'} overflow-auto`}
            style={{
              ...sharedEditorStyles,
              color: 'transparent',
              caretColor: cursors.length > 1 ? 'transparent' : isLight ? '#0f172a' : '#ffffff',
              overflow: 'auto',
            }}
          />

          {/* IntelliSense Autocomplete Popup */}
          {suggestions.length > 0 && suggestionPos && (
            <IntelliSenseWidget
              suggestions={suggestions}
              selectedIndex={selectedSuggestionIdx}
              onSelectIndex={setSelectedSuggestionIdx}
              onApplySuggestion={insertSuggestion}
              position={suggestionPos}
              prefix={activePrefix}
            />
          )}

          {/* Hover-Over Documentation Tooltip */}
          {hoverInfo && hoverPos && suggestions.length === 0 && (
            <HoverTooltip
              info={hoverInfo}
              position={hoverPos}
              onMouseEnter={() => {
                setIsHoveringTooltip(true);
                if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
              }}
              onMouseLeave={() => {
                setIsHoveringTooltip(false);
                scheduleClearHover(180);
              }}
              onClose={() => {
                setHoverInfo(null);
                setHoverPos(null);
              }}
            />
          )}
        </div>

        {/* Minimap Gutter (Rendered when settings.minimap !== false) */}
        {settings.minimap !== false && (
          <EditorMinimap
            content={file.content}
            language={file.language}
            theme={settings.theme}
            scrollTop={scrollMetrics.scrollTop}
            scrollHeight={scrollMetrics.scrollHeight}
            clientHeight={scrollMetrics.clientHeight}
            activeLine={cursorPos.line}
            onScrollTo={handleMinimapScrollTo}
          />
        )}
      </div>

      {/* VS Code Bottom Status Bar */}
      <div className={`h-6 ${isLight ? 'bg-slate-100/90 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800/80 text-slate-400'} theme-transition border-t flex items-center justify-between px-3 text-[11px] shrink-0 select-none font-mono`}>
        <div className="flex items-center gap-3">
          {cursors.length > 1 ? (
            <button
              onClick={handleClearMultiCursor}
              className="flex items-center gap-1.5 text-indigo-300 hover:text-white bg-indigo-950/80 border border-indigo-500/50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              title="Multi-Cursor Active: Press Esc or click to reset to 1 cursor"
            >
              <Layers className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>{cursors.length} Cursors (Esc to exit)</span>
            </button>
          ) : (
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          )}
          <span>Spaces: {settings.tabSize}</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">LF</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Diff Viewer Status Trigger */}
          {onToggleDiffMode && (
            <button
              onClick={() => onToggleDiffMode(file.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                isFileModifiedVsSaved
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-500/30 hover:text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle Diff Viewer Mode"
            >
              <GitCompare className={`w-3 h-3 ${isFileModifiedVsSaved ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{isFileModifiedVsSaved ? 'Diff (Modified)' : 'Diff'}</span>
            </button>
          )}

          {/* CodeLens Toggle & Status Badge */}
          <button
            onClick={() => setShowCodeLens(!showCodeLens)}
            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              showCodeLens 
                ? 'text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-500/30' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
            title={showCodeLens ? `CodeLens Enabled: ${codeLensItems.length} Symbols Found (Click to toggle)` : 'CodeLens Disabled (Click to enable)'}
          >
            <Code2 className="w-3 h-3 text-indigo-400" />
            <span>{showCodeLens ? `${codeLensItems.length} CodeLens` : 'CodeLens Off'}</span>
          </button>

          {/* Real-time Collaboration Status Badge */}
          {showCollabCursors && (
            <button
              onClick={() => setShowCollabCursors(!showCollabCursors)}
              className="flex items-center gap-1.5 text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-500/30 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              title={`${collaborators.length} Collaborators Active in Simulated Session`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{collaborators.length} Peers Active</span>
            </button>
          )}

          {onOpenLanguagesHub ? (
            <button
              onClick={onOpenLanguagesHub}
              className="capitalize text-indigo-300 hover:text-white font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="All Languages Hub & Switcher (Ctrl+L)"
            >
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>{file.language}</span>
            </button>
          ) : (
            <span className="capitalize text-indigo-300 font-medium">{file.language}</span>
          )}
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Ready
          </span>
        </div>
      </div>

      {/* VS Code Interactive References Peek Modal */}
      {selectedLensItem && (
        <ReferencesPeekModal
          item={selectedLensItem}
          onClose={() => setSelectedLensItem(null)}
          onJumpToLocation={handleJumpToCodeLensLocation}
          onAskAiAboutSymbol={(sym) => onAskAi(`Explain the implementation, parameters, and callers of symbol '${sym}' in ${file.name}`)}
        />
      )}
    </div>
  );
};
