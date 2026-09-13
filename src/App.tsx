import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileItem, 
  ExecutionResult, 
  ConsoleTab, 
  ProjectTemplate, 
  Language, 
  EditorSettings, 
  TestCase,
  EditorTheme 
} from './types';
import { STARTER_TEMPLATES } from './data/templates';
import { executeCode, runTestCases } from './utils/executor';
import { Header } from './components/Header';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { OutputConsole } from './components/OutputConsole';
import { LivePreview } from './components/LivePreview';
import { AICopilot } from './components/AICopilot';
import { TemplatesModal } from './components/TemplatesModal';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { X, Plus, Terminal, Sparkles } from 'lucide-react';

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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split-horizontal' | 'split-vertical' | 'editor-only' | 'output-only'>('split-horizontal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Core Code Execution Handler
  const handleRunCode = useCallback(async () => {
    if (!activeFile || isRunning) return;
    setIsRunning(true);

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
  }, [activeFile, isRunning, stdinInput]);

  // Run Test Cases against code
  const handleRunTestCases = async () => {
    if (!activeFile || isRunning) return;
    setIsRunning(true);
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

  // Global Keyboard Shortcuts (F1, Ctrl+P, Shift+Enter)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // F1 or Ctrl+Shift+P for Command Palette
      if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

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
  const handleCreateFile = (name: string, language: Language) => {
    let initialSnippet = '';
    if (language === 'cpp') {
      initialSnippet = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello C++!" << endl;\n    return 0;\n}\n`;
    } else if (language === 'c') {
      initialSnippet = `#include <stdio.h>\n\nint main() {\n    printf("Hello C!\\n");\n    return 0;\n}\n`;
    } else if (language === 'python') {
      initialSnippet = `print("Hello from Python!")\n`;
    } else if (language === 'sql') {
      initialSnippet = `-- SQL Query\nSELECT 'Hello SQL' AS message;\n`;
    } else {
      initialSnippet = `console.log("Hello from ${name}!");\n`;
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

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        onRun={handleRunCode}
        isRunning={isRunning}
        onClearConsole={handleClearConsole}
        onFormatCode={handleFormatCode}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleAiCopilot={() => setIsAiCopilotOpen(prev => !prev)}
        isAiCopilotOpen={isAiCopilotOpen}
        activeLanguage={activeFile?.language || 'cpp'}
        executionResult={executionResult}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        onExportProject={handleExportProject}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleStdin={() => setActiveTab(activeTab === 'stdin' ? 'console' : 'stdin')}
        isStdinActive={activeTab === 'stdin'}
      />

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Explorer */}
        {isSidebarOpen && (
          <div className="w-56 shrink-0 hidden md:block">
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
            />
          </div>
        )}

        {/* Center: Editor & Output Panels */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* File Tab Bar */}
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
              onClick={() => handleCreateFile(`main_${files.length + 1}.cpp`, 'cpp')}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors ml-1 cursor-pointer"
              title="New C++ Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Split Panes: Editor & Output Console */}
          <div
            className={`flex-1 flex overflow-hidden ${
              layoutMode === 'split-vertical' ? 'flex-col' : 'flex-col lg:flex-row'
            }`}
          >
            {/* Code Editor Pane */}
            {layoutMode !== 'output-only' && activeFile && (
              <div
                className={`flex-1 overflow-hidden min-h-[240px] ${
                  layoutMode === 'split-horizontal' ? 'lg:w-1/2' : ''
                }`}
              >
                <CodeEditor
                  key={activeFile.id}
                  file={activeFile}
                  onChangeContent={handleContentChange}
                  onRun={handleRunCode}
                  onAskAi={(selected) => setIsAiCopilotOpen(true)}
                  settings={editorSettings}
                />
              </div>
            )}

            {/* Output, Stdin & Test Cases Pane */}
            {layoutMode !== 'editor-only' && (
              <div
                className={`flex-1 overflow-hidden min-h-[240px] ${
                  layoutMode === 'split-horizontal' ? 'lg:w-1/2' : ''
                }`}
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
