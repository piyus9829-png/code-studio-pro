import React from 'react';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Layout, 
  Wand2, 
  Code2, 
  Layers, 
  Download,
  Command,
  Settings as SettingsIcon,
  CheckCircle2,
  Terminal,
  FileInput
} from 'lucide-react';
import { Language, ExecutionResult, ConsoleTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  onClearConsole: () => void;
  onFormatCode: () => void;
  onOpenTemplates: () => void;
  onToggleAiCopilot: () => void;
  isAiCopilotOpen: boolean;
  activeLanguage: Language;
  executionResult: ExecutionResult | null;
  layoutMode: 'split-horizontal' | 'split-vertical' | 'editor-only' | 'output-only';
  onChangeLayout: (mode: 'split-horizontal' | 'split-vertical' | 'editor-only' | 'output-only') => void;
  onExportProject: () => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onToggleStdin: () => void;
  isStdinActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  isRunning,
  onClearConsole,
  onFormatCode,
  onOpenTemplates,
  onToggleAiCopilot,
  isAiCopilotOpen,
  activeLanguage,
  executionResult,
  layoutMode,
  onChangeLayout,
  onExportProject,
  onOpenCommandPalette,
  onOpenSettings,
  onToggleStdin,
  isStdinActive,
}) => {
  const getLanguageBadge = (lang: Language) => {
    switch (lang) {
      case 'cpp':
        return { label: 'C++20 Engine', color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' };
      case 'c':
        return { label: 'C17 Runtime', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' };
      case 'javascript':
        return { label: 'JS / Node VM', color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' };
      case 'typescript':
        return { label: 'TypeScript', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'python':
        return { label: 'Python (NumPy & Pandas)', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
      case 'sql':
        return { label: 'SQL RDBMS Engine', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
      case 'html':
        return { label: 'HTML5 / Live Web', color: 'text-orange-300 bg-orange-500/10 border-orange-500/30' };
      default:
        return { label: lang.toUpperCase(), color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const badge = getLanguageBadge(activeLanguage);

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 select-none z-20">
      {/* Brand & Workspace Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/20">
          <Code2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent hidden sm:inline">
            CloudIDE Studio Pro
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Center Execution & Fast Action Bar */}
      <div className="flex items-center gap-1.5">
        {/* Run Code Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
          title="Run Code (Shift+Enter or Ctrl+Enter)"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded bg-indigo-700/80 text-[10px] font-mono ml-0.5">⇧↵</kbd>
        </button>

        {/* Custom Input Toggle */}
        <button
          onClick={onToggleStdin}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            isStdinActive
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
          }`}
          title="Toggle Standard Input (stdin)"
        >
          <FileInput className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Input</span>
        </button>

        {/* Format Document Button */}
        <button
          onClick={onFormatCode}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
          title="Format Document (Beautify)"
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Format</span>
        </button>

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
          title="Command Palette (F1 or Ctrl+Shift+P)"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline text-[11px] font-mono">F1</span>
        </button>

        {/* Starter Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>
      </div>

      {/* Right Controls: AI Toggle, Settings & Layout */}
      <div className="flex items-center gap-1">
        {/* Gemini AI Toggle */}
        <button
          onClick={onToggleAiCopilot}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isAiCopilotOpen
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
          }`}
          title="Toggle Gemini AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden md:inline">AI Copilot</span>
        </button>

        {/* Layout Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => onChangeLayout('split-horizontal')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              layoutMode === 'split-horizontal' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Split Horizontal (Side by Side)"
          >
            <Layout className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLayout('split-vertical')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              layoutMode === 'split-vertical' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Split Vertical (Top / Bottom)"
          >
            <div className="w-3.5 h-3.5 border border-current rounded-xs flex flex-col justify-between p-0.5">
              <div className="h-1 bg-current w-full"></div>
              <div className="h-1 bg-current w-full"></div>
            </div>
          </button>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Editor Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Export Project */}
        <button
          onClick={onExportProject}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Export Project JSON"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
