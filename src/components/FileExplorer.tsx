import React, { useState } from 'react';
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
  X
} from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, language: Language) => void;
  onDeleteFile: (fileId: string) => void;
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
  onOpenTemplates,
  onOpenLanguagesHub,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);

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

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none font-sans text-xs">
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
              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getLanguageIcon(file.language, file.name)}
                    <span className="truncate font-mono text-[11px]">{file.name}</span>
                  </div>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
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
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center gap-2 font-semibold text-xs transition-all cursor-pointer shadow-sm"
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
    </div>
  );
};
