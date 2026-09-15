import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileItem, 
  ExecutionResult, 
  ConsoleTab, 
  ProjectTemplate, 
  Language, 
  EditorSettings, 
  TestCase,
  EditorTheme,
  ApiResponse 
} from './types';
import { STARTER_TEMPLATES } from './data/templates';
import { executeCode, runTestCases, executeApiRequest } from './utils/executor';
import { Header } from './components/Header';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { OutputConsole } from './components/OutputConsole';
import { LivePreview } from './components/LivePreview';
import { AICopilot } from './components/AICopilot';
import { TemplatesModal } from './components/TemplatesModal';
import { LanguagesHubModal } from './components/LanguagesHubModal';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { X, Plus, Terminal, Sparkles, ChevronUp } from 'lucide-react';

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
  theme: 'vs-dark',
};

export default function App() {
  const initialTemplate = STARTER_TEMPLATES[0]; // C++ Algorithm Suite with Custom I/O

  const [files, setFiles] = useState<FileItem[]>(() =>
    initialTemplate.files.map((f, idx) => ({
      id: `file_${idx}_${Date.now()}`,
      name: f.name,
      language: f.language,
      content: f.content,
      isOpen: idx === 0,
      isModified: false,
    }))
  );

  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || '');
  const [openFileIds, setOpenFileIds] = useState<string[]>(() => [files[0]?.id || '']);
  const [activeTab, setActiveTab] = useState<ConsoleTab>(initialTemplate.defaultTab);
  const [stdinInput, setStdinInput] = useState<string>(initialTemplate.defaultStdin || '');
  const [testCases, setTestCases] = useState<TestCase[]>(() => initialTemplate.testCases || [
    {
      id: 'tc-1',
      name: 'Sample Case 1',
      input: '8\n45 12 89 23 7 90 34 56\n',
      expectedOutput: 'Sorted Array: [7, 12, 23, 34, 45, 56, 89, 90]\nMin Element: 7\nMax Element: 90\nSum: 356\nMean: 44.50',
    }
  ]);

  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isLanguagesHubOpen, setIsLanguagesHubOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split-horizontal' | 'split-vertical' | 'editor-only' | 'output-only'>('split-horizontal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Panel Minimize / Maximize / Hide State
  const [isOutputMinimized, setIsOutputMinimized] = useState(false);
  const [isOutputHidden, setIsOutputHidden] = useState(false);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage: 50 = 50% split
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const splitContainerRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Core Code Execution Handler
  const handleRunCode = useCallback(async () => {
    if (!activeFile || isRunning) return;
    setIsRunning(true);

    // If minimized or hidden, restore panel to show execution output
    if (isOutputHidden) setIsOutputHidden(false);

    try {
      const result = await executeCode(activeFile.content, activeFile.language, stdinInput, false);
      setExecutionResult(result);

      if (activeFile.language === 'html' || activeFile.name.endsWith('.jsx') || activeFile.name.endsWith('.tsx')) {
        setActiveTab('preview');
      } else if (activeFile.language === 'sql') {
        setActiveTab('table');
      } else {
        setActiveTab('console');
      }
    } catch (err: any) {
      setExecutionResult({
        logs: [{
          id: `err_${Date.now()}`,
          type: 'error',
          args: [err?.message || String(err)],
          timestamp: Date.now(),
        }],
        error: err?.message || String(err),
        executionTimeMs: 0,
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, isRunning, stdinInput, isOutputHidden]);

  // Execute Interactive API Request (FastAPI / Django / Express / Flask)
  const handleExecuteApiRequest = useCallback(async (
    method: string, 
    path: string, 
    headers: Record<string, string>, 
    body: string
  ): Promise<ApiResponse> => {
    if (!activeFile) {
      return {
        status: 500,
        statusText: 'No Active File',
        timeMs: 0,
        headers: {},
        body: { error: 'No active file found to execute' },
        rawText: 'No active file'
      };
    }
    return await executeApiRequest(activeFile.content, activeFile.language, method, path, headers, body);
  }, [activeFile]);

  // Run Test Cases against code
  const handleRunTestCases = async () => {
    if (!activeFile || isRunning) return;
    setIsRunning(true);
    if (isOutputHidden) setIsOutputHidden(false);
    if (isOutputMinimized) setIsOutputMinimized(false);
    setActiveTab('testcases');

    try {
      const updated = await runTestCases(activeFile.content, activeFile.language, testCases);
      setTestCases(updated);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  // Global Keyboard Shortcuts (F1, Ctrl+P, Shift+Enter, Ctrl+`, Ctrl+L)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // F1 or Ctrl+Shift+P for Command Palette
      if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+` (backtick) or Cmd+` for toggling output panel
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsOutputHidden(prev => !prev);
      }
      // Ctrl+L or Cmd+L for opening Languages Hub (when not in a browser URL bar)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLanguagesHubOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Mouse Drag Handler for Split Panes Resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      
      let newRatio = 50;
      if (layoutMode === 'split-vertical') {
        const offset = e.clientY - rect.top;
        newRatio = Math.max(15, Math.min(85, (offset / rect.height) * 100));
      } else {
        const offset = e.clientX - rect.left;
        newRatio = Math.max(15, Math.min(85, (offset / rect.width) * 100));
      }
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      if (isDraggingSplit) {
        setIsDraggingSplit(false);
      }
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit, layoutMode]);

  // Auto-run initial template on mount
  useEffect(() => {
    if (activeFile) {
      handleRunCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update file content
  const handleContentChange = (newContent: string) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === activeFileId ? { ...f, content: newContent, isModified: true } : f
      )
    );
  };

  // Open / Select File
  const handleSelectFile = (fileId: string) => {
    setActiveFileId(fileId);
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds(prev => [...prev, fileId]);
    }
  };

  // Close Tab
  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const remaining = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(remaining);
    if (activeFileId === fileId && remaining.length > 0) {
      setActiveFileId(remaining[remaining.length - 1]);
    }
  };

  // Create New File
  const handleCreateFile = (name: string, language: Language, customContent?: string) => {
    let initialSnippet = customContent || '';
    if (!initialSnippet) {
      if (language === 'cpp') {
        initialSnippet = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}\n`;
      } else if (language === 'c') {
        initialSnippet = `#include <stdio.h>\n\nint main() {\n    printf("Hello C!\\n");\n    return 0;\n}\n`;
      } else if (language === 'java') {
        initialSnippet = `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}\n`;
      } else if (language === 'python') {
        initialSnippet = `print("Hello from Python!")\n`;
      } else if (language === 'sql') {
        initialSnippet = `-- SQL Query\nSELECT 'Hello SQL' AS message;\n`;
      } else {
        initialSnippet = `console.log("Hello from ${name}!");\n`;
      }
    }

    const newFile: FileItem = {
      id: `file_${Date.now()}`,
      name,
      language,
      content: initialSnippet,
      isOpen: true,
      isModified: false,
    };
    setFiles(prev => [...prev, newFile]);
    setOpenFileIds(prev => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
  };

  // Delete File
  const handleDeleteFile = (fileId: string) => {
    const remainingFiles = files.filter(f => f.id !== fileId);
    if (remainingFiles.length === 0) return;
    setFiles(remainingFiles);
    setOpenFileIds(prev => prev.filter(id => id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(remainingFiles[0].id);
    }
  };

  // Load Starter Template
  const handleSelectTemplate = (template: ProjectTemplate) => {
    const newFiles: FileItem[] = template.files.map((f, idx) => ({
      id: `file_${idx}_${Date.now()}`,
      name: f.name,
      language: f.language,
      content: f.content,
      isOpen: idx === 0,
      isModified: false,
    }));

    setFiles(newFiles);
    setActiveFileId(newFiles[0].id);
    setOpenFileIds(newFiles.map(f => f.id));
    setActiveTab(template.defaultTab);
    setStdinInput(template.defaultStdin || '');
    if (template.testCases) {
      setTestCases(template.testCases);
    }
    setIsOutputHidden(false);
    setIsOutputMinimized(false);

    // Auto-run template code
    setTimeout(() => {
      executeCode(newFiles[0].content, newFiles[0].language, template.defaultStdin || '', false).then(res => {
        setExecutionResult(res);
      });
    }, 50);
  };

  // Format Code Beautifier
  const handleFormatCode = () => {
    if (!activeFile) return;
    try {
      if (activeFile.language === 'json') {
        const formatted = JSON.stringify(JSON.parse(activeFile.content), null, 2);
        handleContentChange(formatted);
      } else {
        const formatted = activeFile.content
          .split('\n')
          .map(line => line.trimEnd())
          .join('\n');
        handleContentChange(formatted);
      }
    } catch {
      // Keep as is
    }
  };

  // Clear Console
  const handleClearConsole = () => {
    setExecutionResult({
      logs: [],
      executionTimeMs: 0,
      status: 'idle',
    });
  };

  // Export Project JSON
  const handleExportProject = () => {
    const projectData = {
      name: 'CloudIDE-Project',
      exportedAt: new Date().toISOString(),
      files: files.map(f => ({ name: f.name, language: f.language, content: f.content })),
      stdin: stdinInput,
      testCases,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudide_project_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle iframe logs from Live Preview
  const handleIframeLog = (type: 'log' | 'info' | 'warn' | 'error', args: any[]) => {
    setExecutionResult(prev => ({
      logs: [
        ...(prev?.logs || []),
        {
          id: `iframe_log_${Date.now()}_${Math.random()}`,
          type,
          args,
          timestamp: Date.now(),
        },
      ],
      executionTimeMs: prev?.executionTimeMs || 0,
      status: type === 'error' ? 'error' : (prev?.status || 'success'),
    }));
  };

  // Test Case Management
  const handleAddTestCase = () => {
    const newCase: TestCase = {
      id: `tc_${Date.now()}`,
      name: `Test Case ${testCases.length + 1}`,
      input: '',
      expectedOutput: '',
      status: 'untested',
    };
    setTestCases(prev => [...prev, newCase]);
  };

  const handleUpdateTestCase = (id: string, updated: Partial<TestCase>) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, ...updated } : tc));
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  // Layout calculations
  const showEditor = !isOutputMaximized && layoutMode !== 'output-only';
  const showOutput = !isOutputHidden && layoutMode !== 'editor-only';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        onRun={handleRunCode}
        isRunning={isRunning}
        onClearConsole={handleClearConsole}
        onFormatCode={handleFormatCode}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
        onToggleAiCopilot={() => setIsAiCopilotOpen(prev => !prev)}
        isAiCopilotOpen={isAiCopilotOpen}
        activeLanguage={activeFile?.language || 'cpp'}
        executionResult={executionResult}
        layoutMode={layoutMode}
        onChangeLayout={(mode) => {
          setLayoutMode(mode);
          if (mode === 'editor-only') setIsOutputHidden(true);
          else setIsOutputHidden(false);
        }}
        onExportProject={handleExportProject}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleStdin={() => {
          if (isOutputHidden) setIsOutputHidden(false);
          if (isOutputMinimized) setIsOutputMinimized(false);
          setActiveTab(activeTab === 'stdin' ? 'console' : 'stdin');
        }}
        isStdinActive={activeTab === 'stdin' && showOutput}
        isOutputHidden={isOutputHidden || layoutMode === 'editor-only'}
        onToggleOutputPanel={() => setIsOutputHidden(prev => !prev)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Studio Work Area */}
      <div className="w-full max-w-[100vw] flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Explorer (Desktop) */}
        {isSidebarOpen && (
          <div className="w-56 shrink-0 hidden md:block">
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
            />
          </div>
        )}

        {/* Mobile File Explorer Slide-over Drawer */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer Container */}
            <div className="relative w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col">
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={(id) => {
                  handleSelectFile(id);
                  setIsSidebarOpen(false);
                }}
                onCreateFile={(name, lang) => {
                  handleCreateFile(name, lang);
                  setIsSidebarOpen(false);
                }}
                onDeleteFile={handleDeleteFile}
                onOpenTemplates={() => {
                  setIsTemplatesOpen(true);
                  setIsSidebarOpen(false);
                }}
                onOpenLanguagesHub={() => {
                  setIsLanguagesHubOpen(true);
                  setIsSidebarOpen(false);
                }}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Center: Editor & Output Panels */}
        <div className="w-full max-w-[100vw] flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Mobile View Mode Switcher (Code / Output / Split) */}
          <div className="md:hidden flex items-center justify-between bg-slate-950 border-b border-slate-800 px-2.5 py-1.5 select-none shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setLayoutMode('editor-only');
                  setIsOutputHidden(true);
                }}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                  layoutMode === 'editor-only' || isOutputHidden
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => {
                  setLayoutMode('output-only');
                  setIsOutputHidden(false);
                  setIsOutputMinimized(false);
                }}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'output-only'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Output
                {executionResult && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    executionResult.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                )}
              </button>
              <button
                onClick={() => {
                  setLayoutMode('split-vertical');
                  setIsOutputHidden(false);
                  setIsOutputMinimized(false);
                }}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                  layoutMode === 'split-vertical' && !isOutputHidden
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span className="truncate max-w-[120px] text-indigo-300 font-semibold">{activeFile?.name}</span>
            </div>
          </div>

          {/* File Tab Bar */}
          {showEditor && (
            <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center px-2 space-x-1 overflow-x-auto select-none shrink-0">
              {openFileIds.map(fileId => {
                const file = files.find(f => f.id === fileId);
                if (!file) return null;
                const isActive = file.id === activeFileId;

                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`group flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-mono font-medium cursor-pointer border-t-2 transition-all ${
                      isActive
                        ? 'bg-slate-950 text-slate-100 border-indigo-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    {file.isModified && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                    )}
                    {openFileIds.length > 1 && (
                      <button
                        onClick={(e) => handleCloseTab(e, file.id)}
                        className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => handleCreateFile(`main_${files.length + 1}.py`, 'python')}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors ml-1 cursor-pointer"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Split Panes: Editor & Output Console with Resizer */}
          <div
            ref={splitContainerRef}
            className={`flex-1 flex overflow-hidden w-full max-w-full min-w-0 ${
              layoutMode === 'split-vertical' ? 'flex-col' : 'flex-col lg:flex-row'
            }`}
          >
            {/* Code Editor Pane */}
            {showEditor && activeFile && (
              <div
                style={{
                  flex: showOutput && !isOutputMinimized 
                    ? `0 0 ${layoutMode === 'split-vertical' ? `${splitRatio}%` : `${splitRatio}%`}` 
                    : '1 1 100%',
                }}
                className="overflow-hidden min-h-[120px] w-full max-w-full min-w-0"
              >
                <CodeEditor
                  key={activeFile.id}
                  file={activeFile}
                  onChangeContent={handleContentChange}
                  onRun={handleRunCode}
                  onAskAi={() => setIsAiCopilotOpen(true)}
                  settings={editorSettings}
                  onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
                />
              </div>
            )}

            {/* Draggable Resizer Divider */}
            {showEditor && showOutput && !isOutputMinimized && !isOutputMaximized && (
              <div
                onMouseDown={() => setIsDraggingSplit(true)}
                className={`group shrink-0 bg-slate-800 hover:bg-indigo-500 transition-colors cursor-row-resize ${
                  layoutMode === 'split-vertical' 
                    ? 'h-1.5 w-full cursor-row-resize' 
                    : 'w-1.5 h-full cursor-col-resize hidden lg:block'
                }`}
                title="Drag to resize Editor & Output panels"
              >
                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className={`bg-white rounded-full ${layoutMode === 'split-vertical' ? 'w-8 h-0.5' : 'h-8 w-0.5'}`} />
                </div>
              </div>
            )}

            {/* Output, Stdin, Tests & API Tester Pane */}
            {showOutput && (
              <div
                style={{
                  flex: isOutputMinimized 
                    ? '0 0 auto' 
                    : (showEditor ? `1 1 ${100 - splitRatio}%` : '1 1 100%'),
                  height: isOutputMinimized ? '36px' : undefined
                }}
                className="overflow-hidden min-h-[36px] w-full max-w-full min-w-0 flex flex-col"
              >
                <OutputConsole
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  executionResult={executionResult}
                  onClear={handleClearConsole}
                  isRunning={isRunning}
                  onRunRepl={(expr) => {}}
                  stdinInput={stdinInput}
                  onChangeStdin={setStdinInput}
                  testCases={testCases}
                  onRunTestCases={handleRunTestCases}
                  onAddTestCase={handleAddTestCase}
                  onUpdateTestCase={handleUpdateTestCase}
                  onDeleteTestCase={handleDeleteTestCase}
                  activeLanguage={activeFile.language}
                  activeCode={activeFile.content}
                  onExecuteApiRequest={handleExecuteApiRequest}
                  isMinimized={isOutputMinimized}
                  onToggleMinimize={() => setIsOutputMinimized(prev => !prev)}
                  isMaximized={isOutputMaximized}
                  onToggleMaximize={() => {
                    setIsOutputMaximized(prev => !prev);
                    if (isOutputMinimized) setIsOutputMinimized(false);
                  }}
                  onClose={() => setIsOutputHidden(true)}
                  onInsertCodeSnippet={(snippet) => {
                    if (activeFile) {
                      handleContentChange(activeFile.content + '\n' + snippet);
                    }
                  }}
                  customPreviewContent={
                    <LivePreview
                      files={files}
                      activeFile={activeFile}
                      onIframeLog={handleIframeLog}
                    />
                  }
                />
              </div>
            )}
          </div>

          {/* Floating Button to Restore Output Panel when Hidden */}
          {isOutputHidden && (
            <button
              onClick={() => setIsOutputHidden(false)}
              className="absolute bottom-4 right-4 z-30 px-3 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium text-xs shadow-2xl flex items-center gap-2 border border-indigo-500/40 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer animate-fade-in"
              title="Restore Output Console (Ctrl+`)"
            >
              <Terminal className="w-4 h-4 text-indigo-200" />
              <span>Show Output Panel</span>
              <kbd className="px-1.5 py-0.5 rounded bg-indigo-800 text-[10px] font-mono">Ctrl+`</kbd>
            </button>
          )}
        </div>

        {/* Right Drawer: Gemini AI Copilot */}
        {isAiCopilotOpen && (
          <div className="w-80 shrink-0 z-30 shadow-2xl">
            <AICopilot
              activeFile={activeFile}
              onApplyCode={(code) => handleContentChange(code)}
              onClose={() => setIsAiCopilotOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Languages & Compilers Hub Dedicated Panel */}
      <LanguagesHubModal
        isOpen={isLanguagesHubOpen}
        onClose={() => setIsLanguagesHubOpen(false)}
        activeLanguage={activeFile?.language || 'cpp'}
        currentLanguage={activeFile?.language || 'cpp'}
        onSelectTemplate={(template) => {
          handleSelectTemplate(template);
          setIsLanguagesHubOpen(false);
        }}
        onLoadTemplate={(template) => {
          handleSelectTemplate(template);
          setIsLanguagesHubOpen(false);
        }}
        onCreateFile={(name, lang, initialCode) => {
          handleCreateFile(name, lang, initialCode);
          setIsLanguagesHubOpen(false);
        }}
        onCreateFileForLanguage={(name, lang, initialCode) => {
          handleCreateFile(name, lang, initialCode);
          setIsLanguagesHubOpen(false);
        }}
        onSwitchLanguage={(lang) => {
          if (activeFile) {
            setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, language: lang } : f));
          }
          setIsLanguagesHubOpen(false);
        }}
        onSelectLanguage={(lang) => {
          if (activeFile) {
            setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, language: lang } : f));
          }
          setIsLanguagesHubOpen(false);
        }}
      />

      {/* VS Code Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRunCode={handleRunCode}
        onFormatCode={handleFormatCode}
        onClearConsole={handleClearConsole}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleAi={() => setIsAiCopilotOpen(true)}
        onSelectTheme={(theme: EditorTheme) => setEditorSettings(s => ({ ...s, theme }))}
        onSelectLanguage={(lang: Language) => {
          setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang } : f));
        }}
        onExport={handleExportProject}
      />

      {/* Editor Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={editorSettings}
        onUpdateSettings={(updated) => setEditorSettings(s => ({ ...s, ...updated }))}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
