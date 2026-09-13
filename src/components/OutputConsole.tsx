import React, { useState, useRef, useEffect } from 'react';
import { 
  ConsoleLogEntry, 
  ConsoleTab, 
  ExecutionResult,
  TestCase,
  Language 
} from '../types';
import { evaluateReplExpression } from '../utils/executor';
import { ChartPlotViewer } from './ChartPlotViewer';
import { DatabaseExplorer } from './DatabaseExplorer';
import { VSCodeSQLViewer } from './VSCodeSQLViewer';
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
  ChevronRight,
  FileInput,
  CheckCircle2,
  XCircle,
  Play,
  Plus,
  BarChart3,
  Database
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
}) => {
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warn' | 'info' | 'stdin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replInput, setReplInput] = useState('');
  const [replHistory, setReplHistory] = useState<Array<{ input: string; output: string; isError: boolean }>>([]);
  const [copied, setCopied] = useState(false);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string>(testCases[0]?.id || '');
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'console' && consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [executionResult?.logs, activeTab]);

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
      .map(l => `[${l.type.toUpperCase()}] ${l.args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = (executionResult?.logs || []).filter(log => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = log.args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ').toLowerCase();
      return content.includes(q);
    }
    return true;
  });

  const errorCount = (executionResult?.logs || []).filter(l => l.type === 'error').length;
  const warnCount = (executionResult?.logs || []).filter(l => l.type === 'warn').length;

  const currentTestCase = testCases.find(tc => tc.id === activeTestCaseId) || testCases[0];

  return (
    <div className="h-full flex flex-col bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 select-text overflow-hidden">
      {/* Console Navigation Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 select-none overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* Console Tab */}
          <button
            onClick={() => onChangeTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'console'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
              activeTab === 'stdin'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
              activeTab === 'testcases'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Cases</span>
            <span className="text-[10px] text-slate-500 font-mono">({testCases.length})</span>
          </button>

          {/* Live Preview Tab */}
          {(activeLanguage === 'html' || activeLanguage === 'javascript' || activeLanguage === 'typescript') && (
            <button
              onClick={() => onChangeTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
                activeTab === 'table'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
                activeTab === 'charts'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plots & Charts</span>
              {executionResult?.logs.filter(l => l.type === 'chart' || l.chartData).length ? (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  {executionResult.logs.filter(l => l.type === 'chart' || l.chartData).length}
                </span>
              ) : null}
            </button>
          )}

          {/* Database Explorer Tab */}
          {activeLanguage === 'sql' && (
            <button
              onClick={() => onChangeTab('database')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>DB Explorer</span>
            </button>
          )}
        </div>

        {/* Right Console Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'console' && (
            <>
              <div className="relative hidden md:block">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-md pl-6 pr-2 py-0.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-28"
                />
              </div>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Copy all output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClear}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Output Console Tab */}
        {activeTab === 'console' && (
          <div className="h-full flex flex-col font-mono text-xs bg-slate-950">
            {/* Filter Pills */}
            <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] select-none shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Filter:</span>
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
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>⏱️ {executionResult.executionTimeMs}ms</span>
                  {executionResult.memoryUsedMb && (
                    <span>💾 {executionResult.memoryUsedMb}MB</span>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable Logs Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
                  <TerminalIcon className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">No output yet. Click &quot;Run Code&quot; (Shift+Enter) to execute.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))
              )}
              <div ref={consoleBottomRef} />
            </div>

            {/* Interactive REPL Prompt */}
            <form onSubmit={handleReplSubmit} className="border-t border-slate-800 bg-slate-900/90 p-2 flex items-center gap-2 shrink-0">
              <span className="text-indigo-400 font-bold pl-1">&gt;</span>
              <input
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                placeholder="Type expression to evaluate (e.g. 2 + 2, Math.PI)..."
                className="flex-1 bg-transparent text-slate-100 text-xs focus:outline-none placeholder-slate-600 font-mono"
              />
              <button
                type="submit"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Evaluate expression"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Custom Stdin Input Tab */}
        {activeTab === 'stdin' && (
          <div className="h-full flex flex-col bg-slate-950 p-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <FileInput className="w-4 h-4 text-amber-400" />
                  <span>Standard Input (stdin)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provide custom input data consumed by <code className="text-amber-300">cin</code>, <code className="text-amber-300">scanf</code>, <code className="text-amber-300">input()</code>, or <code className="text-amber-300">readline()</code>.
                </p>
              </div>
              <button
                onClick={() => onChangeStdin('')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Clear Input
              </button>
            </div>

            <textarea
              value={stdinInput}
              onChange={(e) => onChangeStdin(e.target.value)}
              placeholder="Enter input here (e.g., lines of numbers, strings)..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-slate-100 text-xs resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        )}

        {/* Test Cases Judge Tab */}
        {activeTab === 'testcases' && (
          <div className="h-full flex flex-col bg-slate-950 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Competitive Programming Test Judge</h3>
                <p className="text-xs text-slate-400">Validate code against sample & hidden test cases</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onAddTestCase}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test Case</span>
                </button>
                <button
                  onClick={onRunTestCases}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run All Tests</span>
                </button>
              </div>
            </div>

            {/* Test Case Selector Tabs */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 shrink-0">
              {testCases.map((tc, idx) => (
                <button
                  key={tc.id}
                  onClick={() => setActiveTestCaseId(tc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    tc.id === currentTestCase?.id
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  {tc.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {tc.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span>{tc.name || `Case ${idx + 1}`}</span>
                </button>
              ))}
            </div>

            {/* Active Test Case Detail View */}
            {currentTestCase && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-300 mb-1">Standard Input (stdin)</label>
                  <textarea
                    value={currentTestCase.input}
                    onChange={(e) => onUpdateTestCase(currentTestCase.id, { input: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 resize-none focus:outline-none focus:border-indigo-500 min-h-[120px]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-300 mb-1">Expected Output</label>
                  <textarea
                    value={currentTestCase.expectedOutput}
                    onChange={(e) => onUpdateTestCase(currentTestCase.id, { expectedOutput: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 resize-none focus:outline-none focus:border-indigo-500 min-h-[120px]"
                  />
                </div>

                {currentTestCase.actualOutput !== undefined && (
                  <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">Actual Program Output</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        currentTestCase.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {currentTestCase.status?.toUpperCase()} ({currentTestCase.executionTimeMs || 0}ms)
                      </span>
                    </div>
                    <pre className="bg-slate-950 p-2.5 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                      {currentTestCase.actualOutput || '(No output)'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-full w-full bg-slate-950">
            {customPreviewContent}
          </div>
        )}

        {/* Data View / SQL Grid Tab */}
        {activeTab === 'table' && (
          <div className="h-full overflow-hidden bg-slate-950">
            {activeLanguage === 'sql' || (executionResult?.sqlQueryResults && executionResult.sqlQueryResults.length > 0) ? (
              <VSCodeSQLViewer 
                executionResult={executionResult}
                onOpenExplorer={() => onChangeTab('database')}
                onInsertCodeSnippet={onInsertCodeSnippet}
              />
            ) : (
              <div className="h-full overflow-auto p-4">
                <DataTableViewer executionResult={executionResult} />
              </div>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="h-full overflow-y-auto p-4 bg-slate-950">
            {executionResult?.logs.some(l => l.type === 'chart' || l.chartData) ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Generated Data Visualizations</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {executionResult.logs.filter(l => l.type === 'chart' || l.chartData).length} Figure(s)
                  </span>
                </div>
                {executionResult.logs
                  .filter(l => l.type === 'chart' || l.chartData)
                  .map(l => l.chartData && (
                    <ChartPlotViewer key={l.id} plotData={l.chartData} />
                  ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                <BarChart3 className="w-10 h-10 text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-400">No Matplotlib Charts Generated</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                  Use <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">plt.plot()</code> and <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">plt.show()</code> in your Python code to render charts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Database Explorer Tab */}
        {activeTab === 'database' && (
          <div className="h-full overflow-hidden bg-slate-950">
            <DatabaseExplorer onInsertCodeSnippet={onInsertCodeSnippet} />
          </div>
        )}
      </div>
    </div>
  );
};

interface LogItemProps {
  log: ConsoleLogEntry;
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  const getLogStyle = () => {
    switch (log.type) {
      case 'error':
        return 'bg-red-950/30 border-red-900/50 text-red-300';
      case 'warn':
        return 'bg-amber-950/30 border-amber-900/50 text-amber-300';
      case 'info':
        return 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200';
      case 'stdin':
        return 'bg-amber-950/20 border-amber-900/40 text-amber-200';
      case 'table':
        return 'bg-slate-900/80 border-slate-800 text-slate-200';
      case 'chart':
        return 'bg-slate-900/90 border-slate-800 text-cyan-200';
      case 'log':
      default:
        return 'bg-slate-900/40 border-slate-800/60 text-slate-300';
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
        return <span className="text-slate-600 select-none text-[10px]">&gt;</span>;
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-lg border text-xs font-mono transition-colors ${getLogStyle()}`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 whitespace-pre-wrap break-all leading-relaxed">
          {log.args.map((arg, idx) => {
            if (typeof arg === 'object' && arg !== null) {
              return (
                <span key={idx} className="text-cyan-300">
                  {JSON.stringify(arg, null, 2)}{' '}
                </span>
              );
            }
            return <span key={idx}>{String(arg)} </span>;
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
