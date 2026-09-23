import React, { useState, useRef, useEffect } from 'react';
import { 
  ConsoleLogEntry, 
  ConsoleTab, 
  ExecutionResult,
  TestCase,
  Language,
  ConsoleSettings,
  ApiResponse,
  TerminalTheme 
} from '../types';
import { evaluateReplExpression } from '../utils/executor';
import { AnsiText, stripAnsi } from '../utils/ansi';
import { ChartPlotViewer } from './ChartPlotViewer';
import { DatabaseExplorer } from './DatabaseExplorer';
import { VSCodeSQLViewer } from './VSCodeSQLViewer';
import { ApiExplorer } from './ApiExplorer';
import { getTerminalThemeConfig, TERMINAL_THEMES, TerminalThemeDefinition } from '../utils/terminalThemes';
import { 
  Terminal as TerminalIcon, 
  Eye, 
  Table as TableIcon, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CornerDownLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileInput,
  CheckCircle2,
  XCircle,
  Play,
  Plus,
  BarChart3,
  Database,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  Zap,
  Settings as SettingsIcon,
  Minus,
  ExternalLink,
  Palette
} from 'lucide-react';

interface OutputConsoleProps {
  activeTab: ConsoleTab;
  onChangeTab: (tab: ConsoleTab) => void;
  executionResult: ExecutionResult | null;
  onClear: () => void;
  isRunning: boolean;
  onRunRepl: (expr: string) => void;
  customPreviewContent?: React.ReactNode;
  stdinInput: string;
  onChangeStdin: (stdin: string) => void;
  testCases: TestCase[];
  onRunTestCases: () => void;
  onAddTestCase: () => void;
  onUpdateTestCase: (id: string, updated: Partial<TestCase>) => void;
  onDeleteTestCase: (id: string) => void;
  activeLanguage: Language;
  onInsertCodeSnippet?: (snippet: string) => void;
  terminalTheme?: TerminalTheme;
  onUpdateTerminalTheme?: (theme: TerminalTheme) => void;
  // Panel minimize / maximize / close controls
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  onPopOut?: () => void;
  activeCode?: string;
  onExecuteApiRequest?: (method: string, path: string, headers: Record<string, string>, body: string) => Promise<ApiResponse>;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({
  activeTab,
  onChangeTab,
  executionResult,
  onClear,
  isRunning,
  customPreviewContent,
  stdinInput,
  onChangeStdin,
  testCases,
  onRunTestCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  activeLanguage,
  onInsertCodeSnippet,
  terminalTheme,
  onUpdateTerminalTheme,
  isMinimized = false,
  onToggleMinimize,
  isMaximized = false,
  onToggleMaximize,
  onClose,
  onPopOut,
  activeCode = '',
  onExecuteApiRequest,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warn' | 'info' | 'stdin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replInput, setReplInput] = useState('');
  const [replHistory, setReplHistory] = useState<Array<{ input: string; output: string; isError: boolean }>>([]);
  const [copied, setCopied] = useState(false);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string>(testCases[0]?.id || '');
  const [isConsoleSettingsOpen, setIsConsoleSettingsOpen] = useState(false);
  const [consoleSettings, setConsoleSettings] = useState<ConsoleSettings>(() => {
    try {
      const saved = localStorage.getItem('cloudide_console_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontSize: 12,
      lineWrap: true,
      showTimestamps: false,
      autoScroll: true,
      clearOnRun: false,
      theme: 'default-dark',
    };
  });

  const activeThemeId: TerminalTheme = terminalTheme || consoleSettings.theme || 'default-dark';
  const tConfig = getTerminalThemeConfig(activeThemeId);

  const handleSelectTheme = (newTheme: TerminalTheme) => {
    setConsoleSettings(s => ({ ...s, theme: newTheme }));
    if (onUpdateTerminalTheme) {
      onUpdateTerminalTheme(newTheme);
    }
  };

  const consoleBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('cloudide_console_settings', JSON.stringify(consoleSettings));
    } catch {}
  }, [consoleSettings]);

  useEffect(() => {
    if (activeTab === 'console' && consoleSettings.autoScroll && consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionResult?.logs, activeTab, consoleSettings.autoScroll]);

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    const expr = replInput.trim();
    const evalRes = evaluateReplExpression(expr);
    setReplHistory(prev => [
      ...prev,
      { input: expr, output: typeof evalRes.output === 'object' ? JSON.stringify(evalRes.output, null, 2) : String(evalRes.output), isError: evalRes.isError }
    ]);
    setReplInput('');
  };

  const handleCopyLogs = () => {
    if (!executionResult?.logs) return;
    const text = executionResult.logs
      .map(l => `[${l.type.toUpperCase()}] ${stripAnsi(l.args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '))}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = (executionResult?.logs || []).filter(log => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = stripAnsi(log.args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')).toLowerCase();
      return content.includes(q);
    }
    return true;
  });

  const errorCount = (executionResult?.logs || []).filter(l => l.type === 'error').length;
  const warnCount = (executionResult?.logs || []).filter(l => l.type === 'warn').length;
  const currentTestCase = testCases.find(tc => tc.id === activeTestCaseId) || testCases[0];

  // 1. Minimized State Dock View
  if (isMinimized) {
    return (
      <div className={`h-9 ${tConfig.headerBg} border-t ${tConfig.borderColor} flex items-center justify-between px-3 shrink-0 select-none text-xs font-sans`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMinimize}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors cursor-pointer"
            title="Restore / Expand Output Panel"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Output Panel (Minimized)</span>
          </button>

          {executionResult && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              {executionResult.status === 'success' ? (
                <span className={`px-2 py-0.2 rounded-full font-bold border flex items-center gap-1 ${tConfig.statusBadgeSuccess}`}>
                  <Check className="w-3 h-3" />
                  Exit 0
                </span>
              ) : (
                <span className={`px-2 py-0.2 rounded-full font-bold border flex items-center gap-1 ${tConfig.statusBadgeError}`}>
                  <AlertCircle className="w-3 h-3" />
                  Exit {executionResult.exitCode ?? 1}
                </span>
              )}
              <span className={`${tConfig.dimTextColor} hidden sm:inline`}>{executionResult.executionTimeMs}ms</span>
            </div>
          )}
        </div>

        {/* Tab Shortcuts on Minimized Bar */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onChangeTab('console');
              if (onToggleMinimize) onToggleMinimize();
            }}
            className="px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px] cursor-pointer"
          >
            Logs ({filteredLogs.length})
          </button>
          <button
            onClick={() => {
              onChangeTab('stdin');
              if (onToggleMinimize) onToggleMinimize();
            }}
            className="px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px] cursor-pointer"
          >
            Input
          </button>
          <button
            onClick={() => {
              onChangeTab('api-tester');
              if (onToggleMinimize) onToggleMinimize();
            }}
            className="px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px] hidden sm:inline cursor-pointer"
          >
            API Tester
          </button>

          <button
            onClick={onToggleMinimize}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-1 cursor-pointer"
            title="Expand Panel"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Output Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Full Expanded Output Panel
  return (
    <div className={`h-full flex flex-col ${tConfig.containerBg} ${tConfig.textColor} border-t sm:border-t-0 sm:border-l ${tConfig.borderColor} select-text overflow-hidden transition-colors`}>
      {/* Console Navigation Bar */}
      <div className={`h-10 ${tConfig.headerBg} border-b ${tConfig.borderColor} flex items-center justify-between px-3 shrink-0 select-none overflow-x-auto gap-2 transition-colors`}>
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
          {/* Console Tab */}
          <button
            onClick={() => onChangeTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'console' ? tConfig.tabActive : tConfig.tabInactive
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Output</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                {errorCount}
              </span>
            )}
          </button>

          {/* Standard Input (stdin) Tab */}
          <button
            onClick={() => onChangeTab('stdin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'stdin' ? tConfig.tabActive : tConfig.tabInactive
            }`}
          >
            <FileInput className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom Input</span>
            {stdinInput.trim() && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Test Cases Tab */}
          <button
            onClick={() => onChangeTab('testcases')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'testcases' ? tConfig.tabActive : tConfig.tabInactive
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Cases</span>
            <span className="text-[10px] opacity-70 font-mono">({testCases.length})</span>
          </button>

          {/* FastAPI & Django API Tester Tab */}
          <button
            onClick={() => onChangeTab('api-tester')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'api-tester' ? tConfig.tabActive : tConfig.tabInactive
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>API Tester</span>
          </button>

          {/* Live Preview Tab */}
          {(activeLanguage === 'html' || activeLanguage === 'javascript' || activeLanguage === 'typescript') && (
            <button
              onClick={() => onChangeTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'preview' ? tConfig.tabActive : tConfig.tabInactive
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Preview</span>
            </button>
          )}

          {/* Data Table Tab */}
          {(activeLanguage === 'sql' || executionResult?.result || executionResult?.logs.some(l => l.type === 'table')) && (
            <button
              onClick={() => onChangeTab('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'table' ? tConfig.tabActive : tConfig.tabInactive
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data View</span>
            </button>
          )}

          {/* Charts & Plots Tab */}
          {(activeLanguage === 'python' || executionResult?.logs.some(l => l.type === 'chart' || l.chartData)) && (
            <button
              onClick={() => onChangeTab('charts')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'charts' ? tConfig.tabActive : tConfig.tabInactive
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plots & Charts</span>
            </button>
          )}

          {/* Database Explorer Tab */}
          {activeLanguage === 'sql' && (
            <button
              onClick={() => onChangeTab('database')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'database' ? tConfig.tabActive : tConfig.tabInactive
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>DB Explorer</span>
            </button>
          )}
        </div>

        {/* Right Actions: Filter, Copy, Clear, Customize, Maximize, Minimize, Close */}
        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'console' && (
            <>
              <div className="relative hidden xl:block">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/30 border border-slate-700/60 rounded-md pl-6 pr-2 py-0.5 text-xs text-inherit placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-24"
                />
              </div>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-md hover:bg-black/20 text-slate-400 hover:text-inherit transition-colors cursor-pointer"
                title="Copy all output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClear}
                className="p-1.5 rounded-md hover:bg-black/20 text-slate-400 hover:text-inherit transition-colors cursor-pointer"
                title="Clear console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Console Customization Settings Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsConsoleSettingsOpen(prev => !prev)}
              className={`p-1.5 rounded-md text-slate-400 hover:text-inherit hover:bg-black/20 transition-colors cursor-pointer ${
                isConsoleSettingsOpen ? 'bg-black/30 text-indigo-400' : ''
              }`}
              title="Terminal Theme & Preferences"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Popover Settings Dropdown */}
            {isConsoleSettingsOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 z-50 text-xs font-sans space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-100">Terminal Preferences</span>
                  </div>
                  <button
                    onClick={() => setIsConsoleSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Terminal Theme Switcher */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-medium flex items-center gap-1">
                      <Palette className="w-3 h-3 text-indigo-400" />
                      <span>Terminal Theme</span>
                    </label>
                    <span className="text-[10px] font-mono text-indigo-300">
                      {tConfig.name.split(' ')[0]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                    {Object.values(TERMINAL_THEMES).map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between text-[10px] ${
                          activeThemeId === theme.id
                            ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-800 font-bold'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                        style={{ borderLeftColor: theme.preview.accent, borderLeftWidth: '3px' }}
                      >
                        <span className="truncate text-slate-200 font-medium">{theme.name.replace(' (Default)', '').replace(' (Green)', '')}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0" style={{ backgroundColor: theme.preview.bg }} />
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.preview.prompt }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Terminal Font Size</span>
                  <div className="flex items-center gap-1">
                    {[11, 12, 13, 14].map(sz => (
                      <button
                        key={sz}
                        onClick={() => setConsoleSettings(s => ({ ...s, fontSize: sz }))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                          consoleSettings.fontSize === sz
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Wrap */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Wrap Long Lines</span>
                  <input
                    type="checkbox"
                    checked={consoleSettings.lineWrap}
                    onChange={(e) => setConsoleSettings(s => ({ ...s, lineWrap: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Show Timestamps</span>
                  <input
                    type="checkbox"
                    checked={consoleSettings.showTimestamps}
                    onChange={(e) => setConsoleSettings(s => ({ ...s, showTimestamps: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Auto Scroll */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auto-scroll to Bottom</span>
                  <input
                    type="checkbox"
                    checked={consoleSettings.autoScroll}
                    onChange={(e) => setConsoleSettings(s => ({ ...s, autoScroll: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Clear on Run */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clear Logs on Run</span>
                  <input
                    type="checkbox"
                    checked={consoleSettings.clearOnRun}
                    onChange={(e) => setConsoleSettings(s => ({ ...s, clearOnRun: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Pop-out to Floating Window Button */}
          {onPopOut && (
            <button
              onClick={onPopOut}
              className="p-1.5 rounded-md hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
              title="Pop-out Console into Detached Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize Button */}
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1.5 rounded-md hover:bg-black/20 text-slate-400 hover:text-inherit transition-colors cursor-pointer"
              title="Minimize Output Panel"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Maximize Button */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 rounded-md hover:bg-black/20 text-slate-400 hover:text-inherit transition-colors cursor-pointer"
              title={isMaximized ? "Restore Panel Size" : "Maximize Output Panel"}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close / Hide Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Hide Output Panel (Ctrl+`)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Output Console Tab */}
        {activeTab === 'console' && (
          <div className={`h-full flex flex-col font-mono text-xs ${tConfig.containerBg}`}>
            {/* Filter Pills & Execution Status Banner */}
            <div className={`px-3 py-1.5 ${tConfig.filterBarBg} border-b ${tConfig.borderColor} flex items-center justify-between text-[11px] select-none shrink-0 flex-wrap gap-2`}>
              <div className="flex items-center gap-1.5">
                <span className={`${tConfig.dimTextColor} font-semibold`}>Filter:</span>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterType === 'all' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({(executionResult?.logs || []).length})
                </button>
                <button
                  onClick={() => setFilterType('error')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterType === 'error' ? 'bg-red-500/30 text-red-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Errors ({errorCount})
                </button>
                <button
                  onClick={() => setFilterType('warn')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterType === 'warn' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Warnings ({warnCount})
                </button>
              </div>

              {executionResult && (
                <div className="text-[11px] flex items-center gap-2 flex-wrap">
                  {executionResult.executionEngine && (
                    <span className={`px-2 py-0.5 rounded-full bg-black/30 ${tConfig.dimTextColor} font-mono text-[10px] border ${tConfig.borderColor}`}>
                      ⚡ {executionResult.executionEngine}
                    </span>
                  )}

                  {executionResult.status === 'success' ? (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1 ${tConfig.statusBadgeSuccess}`}>
                      <Check className="w-3 h-3" />
                      Exit 0 (Success)
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1 ${tConfig.statusBadgeError}`}>
                      <AlertCircle className="w-3 h-3" />
                      {executionResult.compilerOutput ? 'Compilation Error' : `Exit ${executionResult.exitCode ?? 1} (Error)`}
                    </span>
                  )}

                  <span className={tConfig.dimTextColor}>⏱️ {executionResult.executionTimeMs}ms</span>
                  {executionResult.memoryUsedMb && (
                    <span className={tConfig.dimTextColor}>💾 {executionResult.memoryUsedMb}MB</span>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Logs Body */}
            <div 
              className={`flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar ${tConfig.containerBg}`}
              style={{ fontSize: `${consoleSettings.fontSize}px` }}
            >
              {filteredLogs.length === 0 && replHistory.length === 0 ? (
                <div className={`h-full flex flex-col items-center justify-center ${tConfig.dimTextColor} space-y-2 py-12`}>
                  <TerminalIcon className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No output yet. Click &quot;Run Code&quot; (Shift+Enter) to execute.</p>
                </div>
              ) : (
                <>
                  {filteredLogs.map((log) => (
                    <LogItem 
                      key={log.id} 
                      log={log} 
                      lineWrap={consoleSettings.lineWrap}
                      showTimestamp={consoleSettings.showTimestamps}
                      tConfig={tConfig}
                    />
                  ))}

                  {replHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                      <div className={`text-[10px] uppercase font-bold tracking-wider ${tConfig.dimTextColor}`}>REPL Evaluations</div>
                      {replHistory.map((item, idx) => (
                        <div key={idx} className={`p-2 rounded-lg border space-y-1 font-mono text-xs ${tConfig.logDefault} ${tConfig.borderColor}`}>
                          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                            <span>&gt;</span>
                            <AnsiText text={item.input} />
                          </div>
                          <div className={`pl-3.5 ${item.isError ? 'text-rose-400' : 'text-emerald-400'} whitespace-pre-wrap`}>
                            <AnsiText text={item.output} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div ref={consoleBottomRef} />
            </div>

            {/* Interactive REPL Prompt */}
            <form onSubmit={handleReplSubmit} className={`border-t ${tConfig.borderColor} ${tConfig.replBg} p-2 flex items-center gap-2 shrink-0`}>
              <span className="font-mono text-xs pl-1" style={{ color: tConfig.preview.prompt }}>&gt;</span>
              <input
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                placeholder="Evaluate live expression or test statement..."
                className={`flex-1 bg-transparent ${tConfig.textColor} placeholder-slate-500 focus:outline-none font-mono text-xs`}
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                title="Execute REPL expression"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* FastAPI & Django API Tester Tab */}
        {activeTab === 'api-tester' && (
          <ApiExplorer
            code={activeCode}
            language={activeLanguage}
            onExecuteRequest={onExecuteApiRequest || (async () => ({
              status: 200,
              statusText: 'OK',
              timeMs: 1,
              headers: {},
              body: { message: 'API Tester Ready' },
              rawText: '{"message": "API Tester Ready"}'
            }))}
            onInsertCodeSnippet={onInsertCodeSnippet}
          />
        )}

        {/* Custom Standard Input Tab */}
        {activeTab === 'stdin' && (
          <div className="h-full flex flex-col p-4 bg-slate-950 font-sans">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Standard Input Stream (stdin)</h3>
                <p className="text-xs text-slate-400">Passed directly to std::cin, scanf(), input(), Scanner, and readline()</p>
              </div>
              <button
                onClick={() => onChangeStdin('')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Clear input
              </button>
            </div>
            <textarea
              value={stdinInput}
              onChange={(e) => onChangeStdin(e.target.value)}
              placeholder="Enter your input values here (e.g. array length followed by numbers or multiline strings)..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
            />
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === 'testcases' && (
          <div className="h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden font-sans">
            {/* Left: Test Cases Selector */}
            <div className="w-full md:w-56 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0">
              <div className="p-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Test Suite</span>
                <button
                  onClick={onAddTestCase}
                  className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  title="Add Test Case"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    onClick={() => setActiveTestCaseId(tc.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                      tc.id === activeTestCaseId
                        ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate font-medium">{tc.name || `Case #${idx + 1}`}</span>
                    {tc.status === 'passed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {tc.status === 'failed' && (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-800">
                <button
                  onClick={onRunTestCases}
                  disabled={isRunning}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run All Test Cases</span>
                </button>
              </div>
            </div>

            {/* Right: Active Test Case Details */}
            {currentTestCase && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={currentTestCase.name}
                    onChange={(e) => onUpdateTestCase(currentTestCase.id, { name: e.target.value })}
                    className="bg-transparent text-sm font-bold text-slate-100 focus:outline-none border-b border-transparent focus:border-indigo-500"
                  />
                  {testCases.length > 1 && (
                    <button
                      onClick={() => onDeleteTestCase(currentTestCase.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-400 mb-1">Input Data</label>
                    <textarea
                      value={currentTestCase.input}
                      onChange={(e) => onUpdateTestCase(currentTestCase.id, { input: e.target.value })}
                      className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none min-h-[120px]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-400 mb-1">Expected Output</label>
                    <textarea
                      value={currentTestCase.expectedOutput}
                      onChange={(e) => onUpdateTestCase(currentTestCase.id, { expectedOutput: e.target.value })}
                      className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none min-h-[120px]"
                    />
                  </div>
                </div>

                {currentTestCase.actualOutput !== undefined && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300">Actual Output</span>
                      <span className={`text-xs font-bold ${currentTestCase.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {currentTestCase.status === 'passed' ? '✓ Passed' : '✗ Output Mismatch'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap">
                      <AnsiText text={currentTestCase.actualOutput || '(empty output)'} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col bg-white">
            {customPreviewContent}
          </div>
        )}

        {/* Data Table Tab */}
        {activeTab === 'table' && (
          <div className="h-full p-4 overflow-auto bg-slate-950 custom-scrollbar">
            {executionResult?.sqlQueryResults && executionResult.sqlQueryResults.length > 0 ? (
              <VSCodeSQLViewer results={executionResult.sqlQueryResults} />
            ) : (
              <DataTableViewer executionResult={executionResult} />
            )}
          </div>
        )}

        {/* Plots & Charts Tab */}
        {activeTab === 'charts' && (
          <div className="h-full p-4 overflow-auto bg-slate-950 custom-scrollbar">
            <ChartsTabContent executionResult={executionResult} />
          </div>
        )}

        {/* Database Explorer Tab */}
        {activeTab === 'database' && (
          <div className="h-full overflow-hidden bg-slate-950">
            <DatabaseExplorer
              onInsertQuery={(query) => {
                if (onInsertCodeSnippet) onInsertCodeSnippet(query);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const LogItem: React.FC<{ 
  log: ConsoleLogEntry; 
  lineWrap?: boolean; 
  showTimestamp?: boolean; 
  tConfig?: TerminalThemeDefinition;
}> = ({ log, lineWrap = true, showTimestamp = false, tConfig }) => {
  const getLogStyle = () => {
    if (tConfig) {
      switch (log.type) {
        case 'error':
          return tConfig.logError;
        case 'warn':
          return tConfig.logWarn;
        case 'info':
          return tConfig.logInfo;
        case 'stdin':
          return tConfig.logStdin;
        default:
          return tConfig.logDefault;
      }
    }
    switch (log.type) {
      case 'error':
        return 'text-red-300 bg-red-950/30 border-red-900/40';
      case 'warn':
        return 'text-amber-300 bg-amber-950/30 border-amber-900/40';
      case 'info':
        return 'text-cyan-300 bg-cyan-950/20 border-cyan-900/30';
      case 'stdin':
        return 'text-amber-200 bg-amber-950/20 border-amber-900/30';
      default:
        return 'text-slate-200 bg-slate-900/50 border-slate-800/60';
    }
  };

  const getIcon = () => {
    switch (log.type) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
      case 'stdin':
        return <FileInput className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'chart':
        return <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
      default:
        return (
          <span 
            className="select-none text-[10px] font-bold" 
            style={{ color: tConfig ? tConfig.preview.prompt : '#64748b' }}
          >
            &gt;
          </span>
        );
    }
  };

  const formattedTime = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div className={`flex flex-col gap-1.5 p-2 rounded-lg border text-xs font-mono transition-colors ${getLogStyle()}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        {showTimestamp && (
          <span className={`text-[10px] ${tConfig?.dimTextColor || 'text-slate-500'} font-mono shrink-0 select-none`}>
            [{formattedTime}]
          </span>
        )}
        <div className={`flex-1 leading-relaxed ${lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'}`}>
          {log.args.map((arg, idx) => {
            if (typeof arg === 'object' && arg !== null) {
              return (
                <span key={idx} className="opacity-90 underline-offset-2">
                  {JSON.stringify(arg, null, 2)}{' '}
                </span>
              );
            }
            return (
              <React.Fragment key={idx}>
                <AnsiText text={String(arg)} />{' '}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {log.chartData && (
        <div className="pl-5">
          <ChartPlotViewer plotData={log.chartData} />
        </div>
      )}
    </div>
  );
};

const DataTableViewer: React.FC<{ executionResult: ExecutionResult | null }> = ({ executionResult }) => {
  const tableLog = executionResult?.logs.find(l => l.type === 'table' && Array.isArray(l.args[0]));
  const result = executionResult?.result;

  const dataArray: Array<Record<string, any>> = 
    (tableLog && Array.isArray(tableLog.args[0])) ? tableLog.args[0] :
    (Array.isArray(result) ? result : null);

  if (!dataArray || dataArray.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
        <TableIcon className="w-10 h-10 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-400">No Structured Data Output</h3>
        <p className="text-xs text-slate-500 mt-1">
          Use <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">SELECT ...</code> or <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">console.table()</code> to view records.
        </p>
      </div>
    );
  }

  const columns = Object.keys(dataArray[0] || {});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Table Records ({dataArray.length} entries)</span>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-slate-900/90">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-800/90 border-b border-slate-700 text-slate-200">
              <th className="p-3 border-r border-slate-700/60 text-slate-500 w-12 font-bold">#</th>
              {columns.map(col => (
                <th key={col} className="p-3 border-r border-slate-700/60 font-semibold tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataArray.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="p-3 border-r border-slate-800 text-slate-500">{rIdx + 1}</td>
                {columns.map(col => (
                  <td key={col} className="p-3 border-r border-slate-800 text-slate-200">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ChartsTabContent: React.FC<{ executionResult: ExecutionResult | null }> = ({ executionResult }) => {
  const chartLogs = (executionResult?.logs || []).filter(l => l.type === 'chart' || l.chartData);

  if (chartLogs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 font-sans">
        <BarChart3 className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Matplotlib / Plots Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
          In your Python code, use <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">plt.plot()</code>, <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">plt.bar()</code>, or <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">plt.show()</code> to generate interactive visual charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chartLogs.map((log) => (
        log.chartData ? (
          <div key={log.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <ChartPlotViewer plotData={log.chartData} />
          </div>
        ) : null
      ))}
    </div>
  );
};
