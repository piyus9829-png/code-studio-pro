import React, { useState, useRef, useEffect } from 'react';
import { FileItem, Language } from '../types';
import { 
  FileCode, 
  Folder, 
  Plus, 
  Trash2, 
  FileText, 
  Binary, 
  Layers, 
  Database,
  Terminal,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Globe,
  X,
  GitCompare,
  RotateCcw,
  BookmarkCheck,
  MoreVertical,
  Copy,
  ExternalLink,
  Edit2
} from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, language: Language) => void;
  onDeleteFile: (fileId: string) => void;
  onToggleDiffMode?: (fileId: string) => void;
  onRestoreCheckpoint?: (fileId: string) => void;
  onUpdateCheckpoint?: (fileId: string) => void;
  onDuplicateFile?: (fileId: string) => void;
  onOpenTemplates: () => void;
  onOpenLanguagesHub?: () => void;
  onClose?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onToggleDiffMode,
  onRestoreCheckpoint,
  onUpdateCheckpoint,
  onDuplicateFile,
  onOpenTemplates,
  onOpenLanguagesHub,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getLanguageIcon = (lang: Language, name: string) => {
    if (name.endsWith('.cpp') || name.endsWith('.hpp')) {
      return <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (name.endsWith('.c') || name.endsWith('.h')) {
      return <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (name.endsWith('.java')) {
      return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    }
    switch (lang) {
      case 'javascript':
        return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'typescript':
        return <Binary className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'python':
        return <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'java':
        return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'cpp':
        return <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'c':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'sql':
        return <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'html':
      case 'css':
        return <Layers className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const inferLanguage = (name: string): Language => {
    if (name.endsWith('.cpp') || name.endsWith('.hpp') || name.endsWith('.cc')) return 'cpp';
    if (name.endsWith('.c') || name.endsWith('.h')) return 'c';
    if (name.endsWith('.java')) return 'java';
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
    if (name.endsWith('.py')) return 'python';
    if (name.endsWith('.sql')) return 'sql';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.md')) return 'markdown';
    return 'javascript';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const lang = inferLanguage(name);
    onCreateFile(name, lang);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleFileContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fileId,
    });
  };

  const targetMenuFile = contextMenu ? files.find(f => f.id === contextMenu.fileId) : null;
  const isTargetFileModified = targetMenuFile 
    ? (targetMenuFile.savedContent !== undefined && targetMenuFile.savedContent !== targetMenuFile.content) || targetMenuFile.isModified
    : false;

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none font-sans text-xs relative">
      {/* Explorer Top Bar */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="New File (e.g. main.cpp, script.js, test.py)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Explorer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Files Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Workspace Root Node */}
        <div 
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-slate-300 font-semibold cursor-pointer hover:bg-slate-800/50 rounded-md"
        >
          {isWorkspaceOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <Folder className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
          <span className="truncate">cloudide-workspace</span>
        </div>

        {isWorkspaceOpen && (
          <div className="pl-4 space-y-0.5 mt-0.5">
            {files.map((file) => {
              const isActive = file.id === activeFileId;
              const hasChanges = (file.savedContent !== undefined && file.savedContent !== file.content) || file.isModified;

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  onContextMenu={(e) => handleFileContextMenu(e, file.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                  title={`${file.name} (Right-click for options)`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getLanguageIcon(file.language, file.name)}
                    <span className="truncate font-mono text-[11px]">{file.name}</span>
                    {hasChanges && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" title="Modified since last checkpoint" />
                    )}
                    {file.isDiffActive && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                        DIFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* More / Context Menu Trigger */}
                    <button
                      onClick={(e) => handleFileContextMenu(e, file.id)}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="File Options & Diff Viewer"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete File"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Inline New File Form */}
            {isCreating && (
              <form onSubmit={handleCreateSubmit} className="p-1">
                <input
                  type="text"
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={() => {
                    if (!newFileName.trim()) setIsCreating(false);
                  }}
                  placeholder="e.g. main.cpp, app.js"
                  className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                />
              </form>
            )}
          </div>
        )}
      </div>

      {/* Starter Templates & Languages Hub Banners */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 space-y-1.5">
        {onOpenLanguagesHub && (
          <button
            onClick={onOpenLanguagesHub}
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center gap-2 font-semibold text-xs transition-all cursor-pointer shadow-xs"
            title="Open All Languages & Compilers Hub"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Languages Hub</span>
          </button>
        )}

        <button
          onClick={onOpenTemplates}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center gap-2 font-medium text-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Starter Templates</span>
        </button>
      </div>

      {/* Rich File Context Menu with Diff Viewer Toggle Switch */}
      {contextMenu && targetMenuFile && (
        <div
          ref={contextMenuRef}
          style={{ 
            top: Math.min(contextMenu.y, window.innerHeight - 300), 
            left: Math.min(contextMenu.x, window.innerWidth - 250) 
          }}
          className="fixed bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 p-1.5 text-xs w-60 animate-in fade-in zoom-in-95 duration-100 text-slate-200 divide-y divide-slate-800/80 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header with File Name */}
          <div className="px-2.5 py-1.5 pb-2">
            <div className="font-semibold text-xs text-white truncate font-mono">
              {targetMenuFile.name}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{targetMenuFile.language.toUpperCase()}</span>
              <span>•</span>
              <span className={isTargetFileModified ? 'text-amber-400 font-medium' : 'text-slate-500'}>
                {isTargetFileModified ? 'Modified since saved' : 'Matches Checkpoint'}
              </span>
            </div>
          </div>

          {/* Diff Viewer Mode Switch (The Toggle Switch) */}
          <div className="py-1.5">
            <div 
              onClick={() => {
                if (onToggleDiffMode) {
                  onToggleDiffMode(targetMenuFile.id);
                }
                setContextMenu(null);
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 pr-2">
                <div className={`p-1 rounded ${targetMenuFile.isDiffActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                  <GitCompare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-[11px] text-slate-100 flex items-center gap-1">
                    <span>Diff Viewer Mode</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {targetMenuFile.isDiffActive ? 'Active in editor' : 'Compare vs Checkpoint'}
                  </div>
                </div>
              </div>

              {/* The Toggle Switch UI */}
              <div 
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  targetMenuFile.isDiffActive ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    targetMenuFile.isDiffActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Checkpoint Quick Actions */}
          <div className="py-1">
            {onUpdateCheckpoint && (
              <button
                onClick={() => {
                  onUpdateCheckpoint(targetMenuFile.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                title="Save current file contents as a new baseline checkpoint"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save New Checkpoint</span>
              </button>
            )}

            {onRestoreCheckpoint && isTargetFileModified && (
              <button
                onClick={() => {
                  onRestoreCheckpoint(targetMenuFile.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors"
                title="Discard unsaved changes and restore back to saved checkpoint"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Restore to Checkpoint</span>
              </button>
            )}

            {onDuplicateFile && (
              <button
                onClick={() => {
                  onDuplicateFile(targetMenuFile.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate File</span>
              </button>
            )}
          </div>

          {/* Standard File Operations */}
          {files.length > 1 && (
            <div className="pt-1">
              <button
                onClick={() => {
                  onDeleteFile(targetMenuFile.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete File</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
