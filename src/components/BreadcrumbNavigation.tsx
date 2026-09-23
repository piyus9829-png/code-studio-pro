import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FileItem, Language } from '../types';
import { 
  buildBreadcrumbSegments, 
  extractDocumentSymbols, 
  BreadcrumbSegment, 
  DocumentSymbol 
} from '../utils/breadcrumbs';
import { 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Binary, 
  Terminal, 
  Layers, 
  Database, 
  Copy, 
  Check, 
  Code2, 
  Braces, 
  Box, 
  Variable, 
  Heading, 
  Search, 
  CheckCircle2, 
  Hash,
  Sparkles
} from 'lucide-react';

interface BreadcrumbNavigationProps {
  file: FileItem;
  files?: FileItem[];
  cursorLine: number;
  onSelectFile?: (fileId: string) => void;
  onJumpToLine?: (line: number) => void;
  workspaceName?: string;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  file,
  files = [],
  cursorLine,
  onSelectFile,
  onJumpToLine,
  workspaceName = 'cloudide-workspace',
  className = '',
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse breadcrumb segments
  const segments = useMemo(() => {
    return buildBreadcrumbSegments(
      file.name,
      file.content,
      cursorLine,
      file.language,
      workspaceName
    );
  }, [file.name, file.content, cursorLine, file.language, workspaceName]);

  // Extract all symbols in current file for document outline dropdown
  const allSymbols = useMemo(() => {
    return extractDocumentSymbols(file.content, file.language);
  }, [file.content, file.language]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setSearchFilter('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDropdown) {
        setActiveDropdown(null);
        setSearchFilter('');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);

  // File type icon resolver
  const getFileIcon = (fileName: string, lang: Language) => {
    if (fileName.endsWith('.cpp') || fileName.endsWith('.hpp') || fileName.endsWith('.cc')) {
      return <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (fileName.endsWith('.c') || fileName.endsWith('.h')) {
      return <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (fileName.endsWith('.java')) {
      return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
    switch (lang) {
      case 'javascript':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'typescript':
        return <Binary className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'python':
        return <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'sql':
        return <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'html':
      case 'css':
        return <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'json':
        return <Braces className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
  };

  // Symbol kind icon resolver
  const getSymbolIcon = (kind?: DocumentSymbol['kind']) => {
    switch (kind) {
      case 'class':
      case 'struct':
        return <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'interface':
      case 'type':
        return <Braces className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'heading':
        return <Heading className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'variable':
        return <Variable className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'function':
      case 'method':
      default:
        return <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
  };

  // Copy full relative file path
  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const relativePath = file.name.startsWith('src/') || file.name.startsWith('/') 
      ? file.name 
      : `src/${file.name}`;
    try {
      await navigator.clipboard.writeText(relativePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('Failed to copy path', err);
    }
  };

  // Filtered files for file picker dropdown
  const filteredFiles = useMemo(() => {
    if (!searchFilter.trim()) return files;
    const q = searchFilter.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchFilter]);

  // Filtered symbols for outline dropdown
  const filteredSymbols = useMemo(() => {
    if (!searchFilter.trim()) return allSymbols;
    const q = searchFilter.toLowerCase();
    return allSymbols.filter(s => s.name.toLowerCase().includes(q));
  }, [allSymbols, searchFilter]);

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center font-mono text-[11px] text-slate-400 select-none overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="flex items-center gap-1 flex-nowrap shrink-0">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const isFile = segment.type === 'file';
          const isSymbol = segment.type === 'symbol';
          const isWorkspace = segment.type === 'workspace';
          const isFolder = segment.type === 'folder';
          const isOpen = activeDropdown === segment.id;

          return (
            <React.Fragment key={segment.id}>
              {/* Segment Item Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isOpen) {
                      setActiveDropdown(null);
                      setSearchFilter('');
                    } else {
                      setActiveDropdown(segment.id);
                      setSearchFilter('');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    isOpen
                      ? 'bg-slate-800 text-indigo-200 ring-1 ring-indigo-500/40'
                      : isFile
                      ? 'text-indigo-300 hover:text-white hover:bg-slate-800/80 font-semibold'
                      : isSymbol
                      ? 'text-purple-300 hover:text-white hover:bg-slate-800/80'
                      : isWorkspace
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Click to view ${segment.type} navigation options (${segment.name})`}
                >
                  {/* Segment Icon */}
                  {isWorkspace && (
                    <Folder className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20 shrink-0" />
                  )}
                  {isFolder && (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                  )}
                  {isFile && getFileIcon(segment.name, file.language)}
                  {isSymbol && getSymbolIcon(segment.symbolKind)}

                  <span className="truncate max-w-[130px] sm:max-w-[200px]">{segment.name}</span>

                  {/* Modified status dot for active file */}
                  {isFile && file.isModified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-0.5" title="Unsaved changes" />
                  )}
                </button>

                {/* Dropdown Popover */}
                {isOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1.5 w-64 max-h-72 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 text-xs select-none backdrop-blur-md"
                  >
                    {/* Popover Header / Search */}
                    <div className="p-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 bg-slate-900 border border-slate-700/70 rounded px-2 py-1">
                        <Search className="w-3 h-3 text-slate-500 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder={isSymbol ? "Search symbols..." : "Filter files..."}
                          className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-500 font-sans focus:outline-none"
                        />
                      </div>

                      {isFile && (
                        <button
                          onClick={handleCopyPath}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors shrink-0"
                          title="Copy file path"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Popover Body List */}
                    <div className="flex-1 overflow-y-auto p-1 space-y-0.5 max-h-56">
                      {isSymbol ? (
                        /* Document Outline Symbol List */
                        filteredSymbols.length > 0 ? (
                          filteredSymbols.map((sym, sIdx) => {
                            const isCurrent = sym.line === segment.symbolLine;
                            return (
                              <button
                                key={`sym-${sIdx}-${sym.line}`}
                                onClick={() => {
                                  if (onJumpToLine) onJumpToLine(sym.line);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                  isCurrent
                                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getSymbolIcon(sym.kind)}
                                  <span className="truncate font-mono text-[11px]">{sym.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono ml-2 shrink-0">
                                  :{sym.line}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-slate-500 text-[11px]">
                            No matching symbols found
                          </div>
                        )
                      ) : (
                        /* File Switcher List */
                        filteredFiles.length > 0 ? (
                          filteredFiles.map((f) => {
                            const isSelected = f.id === file.id;
                            return (
                              <button
                                key={f.id}
                                onClick={() => {
                                  if (onSelectFile) onSelectFile(f.id);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getFileIcon(f.name, f.language)}
                                  <span className="truncate font-mono text-[11px]">{f.name}</span>
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] text-indigo-400 font-medium shrink-0 ml-2">
                                    active
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-slate-500 text-[11px]">
                            No matching files found
                          </div>
                        )
                      )}
                    </div>

                    {/* Popover Footer Info */}
                    <div className="p-1.5 px-2 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{isSymbol ? `${allSymbols.length} symbols in outline` : `${files.length} files in project`}</span>
                      <span>Esc to close</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chevron Separator between breadcrumbs */}
              {!isLast && (
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
