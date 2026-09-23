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
  FileInput,
  Globe,
  Menu,
  SplitSquareHorizontal,
  SplitSquareVertical,
  ExternalLink,
  Columns
} from 'lucide-react';
import { Language, ExecutionResult, ConsoleTab, EditorSplitDirection } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { AuthUserMenu } from './AuthUserMenu';

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  onClearConsole: () => void;
  onFormatCode: () => void;
  onOpenTemplates: () => void;
  onOpenLanguagesHub?: () => void;
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
  isOutputHidden?: boolean;
  onToggleOutputPanel?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  editorSplit?: EditorSplitDirection;
  onToggleEditorSplit?: (split: EditorSplitDirection) => void;
  onPopOutOutput?: () => void;
  lastSaved?: number;
  isAutoSaving?: boolean;
  hasUnsavedChanges?: boolean;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: (enabled: boolean) => void;
  onManualSave?: () => void;
  onResetWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  isRunning,
  onClearConsole,
  onFormatCode,
  onOpenTemplates,
  onOpenLanguagesHub,
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
  isOutputHidden = false,
  onToggleOutputPanel,
  onToggleSidebar,
  isSidebarOpen,
  editorSplit = 'none',
  onToggleEditorSplit,
  onPopOutOutput,
  lastSaved = Date.now(),
  isAutoSaving = false,
  hasUnsavedChanges = false,
  autoSaveEnabled = true,
  onToggleAutoSave = () => {},
  onManualSave = () => {},
  onResetWorkspace,
}) => {
  const getLanguageBadge = (lang: Language) => {
    switch (lang) {
      case 'cpp':
        return { label: 'C++', color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' };
      case 'c':
        return { label: 'C', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' };
      case 'java':
        return { label: 'Java', color: 'text-rose-300 bg-rose-500/10 border-rose-500/30' };
      case 'python':
        return { label: 'Python', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
      case 'javascript':
        return { label: 'JS', color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' };
      case 'typescript':
        return { label: 'TS', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'sql':
        return { label: 'SQL', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
      case 'html':
        return { label: 'HTML', color: 'text-orange-300 bg-orange-500/10 border-orange-500/30' };
      default:
        return { label: lang.toUpperCase(), color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const badge = getLanguageBadge(activeLanguage);

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between px-2 sm:px-3 py-1.5 gap-y-1.5 shrink-0 select-none z-20">
      {/* Left: Brand & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle File Explorer (Sidebar)"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
          <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs sm:text-sm bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent hidden sm:inline">
            CloudIDE
          </span>
          {onOpenLanguagesHub ? (
            <button
              onClick={onOpenLanguagesHub}
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${badge.color} hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1`}
              title="Click to open Languages & Compilers Hub"
            >
              <span>{badge.label}</span>
            </button>
          ) : (
            <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Center Execution & Fast Action Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Run Code Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer shrink-0"
          title="Run Code (Shift+Enter or Ctrl+Enter)"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded bg-indigo-700/80 text-[10px] font-mono ml-0.5">⇧↵</kbd>
        </button>

        {/* All Languages Hub Dedicated Panel Button */}
        {onOpenLanguagesHub && (
          <button
            onClick={onOpenLanguagesHub}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer shadow-sm shrink-0"
            title="All Languages & Compilers Hub (Ctrl+L)"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Languages</span>
          </button>
        )}

        {/* Custom Input Toggle */}
        <button
          onClick={onToggleStdin}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
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
          className="hidden xs:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer shrink-0"
          title="Format Document (Beautify)"
        >
          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Format</span>
        </button>

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer shrink-0"
          title="Command Palette (F1 or Ctrl+Shift+P)"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline text-[11px] font-mono">F1</span>
        </button>

        {/* Starter Templates */}
        <button
          onClick={onOpenTemplates}
          className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors cursor-pointer shrink-0"
          title="Browse Starter Templates"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Templates</span>
        </button>
      </div>

      {/* Right Controls: AI Toggle, Settings & Layout */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Gemini AI Toggle */}
        <button
          onClick={onToggleAiCopilot}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isAiCopilotOpen
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
          }`}
          title="Toggle Gemini AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden md:inline">AI Copilot</span>
        </button>

        {/* Multi-Window & Split Editor Switcher */}
        {onToggleEditorSplit && (
          <div className="hidden md:flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onToggleEditorSplit(editorSplit === 'horizontal' ? 'none' : 'horizontal')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                editorSplit === 'horizontal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split Editor Side-by-Side (Horizontal)"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleEditorSplit(editorSplit === 'vertical' ? 'none' : 'vertical')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                editorSplit === 'vertical' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split Editor Stacked (Vertical)"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Layout Mode Switcher */}
        <div className="hidden sm:flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => onChangeLayout('split-horizontal')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              layoutMode === 'split-horizontal' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Split Horizontal (Editor Left / Output Right)"
          >
            <Layout className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLayout('split-vertical')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              layoutMode === 'split-vertical' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Split Vertical (Editor Top / Output Bottom)"
          >
            <div className="w-3.5 h-3.5 border border-current rounded-xs flex flex-col justify-between p-0.5">
              <div className="h-1 bg-current w-full"></div>
              <div className="h-1 bg-current w-full"></div>
            </div>
          </button>
          {onToggleOutputPanel && (
            <button
              onClick={onToggleOutputPanel}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                !isOutputHidden ? 'text-indigo-400 bg-slate-800/80' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={isOutputHidden ? "Show Output Panel" : "Hide Output Panel"}
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}
          {onPopOutOutput && (
            <button
              onClick={onPopOutOutput}
              className="p-1 rounded text-xs text-slate-500 hover:text-indigo-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Pop-out Output Console into Detached Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* LocalStorage AutoSave Indicator */}
        <AutoSaveIndicator
          lastSaved={lastSaved}
          isSaving={isAutoSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
          onManualSave={onManualSave}
          onResetWorkspace={onResetWorkspace}
        />

        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* User Authentication & Protection Platform Menu */}
        <AuthUserMenu />

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
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer hidden sm:block"
          title="Export Project JSON"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
