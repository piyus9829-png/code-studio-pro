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
  ApiResponse,
  EditorSplitDirection,
  DetachedWindow
} from './types';
import { STARTER_TEMPLATES } from './data/templates';
import { executeCode, runTestCases, executeApiRequest } from './utils/executor';
import { 
  loadSavedWorkspace, 
  saveWorkspaceToStorage, 
  clearSavedWorkspace, 
  SavedWorkspace 
} from './utils/workspaceStorage';
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
import { DynamicTabBar } from './components/DynamicTabBar';
import { FloatingWindowManager, DetachedWindowItem } from './components/FloatingWindowManager';
import { AuthModal } from './components/AuthModal';
import { ProtectionCenterModal } from './components/ProtectionCenterModal';
import { PremiumGateModal } from './components/PremiumGateModal';
import { SplashScreen } from './components/SplashScreen';
import { useAuth } from './context/AuthContext';
import { X, Plus, Terminal, Sparkles, ChevronUp, SplitSquareHorizontal, SplitSquareVertical, ExternalLink, ShieldAlert, AlertTriangle } from 'lucide-react';

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
  autoSave: true,
  autoSaveDelay: 1000,
  theme: 'vs-dark',
  fontLigatures: true,
  fontFamily: 'jetbrains-mono',
};

export default function App() {
  const { user, profile, isAdmin, isPremium, isAnonymous, requirePremium, protectionConfig, setAuthModalOpen } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);
  const initialTemplate = STARTER_TEMPLATES[0]; // C++ Algorithm Suite with Custom I/O
  const savedWorkspace = useRef(loadSavedWorkspace()).current;

  const [files, setFiles] = useState<FileItem[]>(() => {
    if (savedWorkspace && savedWorkspace.files && savedWorkspace.files.length > 0) {
      return savedWorkspace.files.map(f => ({
        ...f,
        savedContent: f.savedContent !== undefined ? f.savedContent : f.content,
        lastCheckpointTime: f.lastCheckpointTime || Date.now(),
        checkpointLabel: f.checkpointLabel || 'Checkpoint',
        isDiffActive: !!f.isDiffActive,
      }));
    }
    return initialTemplate.files.map((f, idx) => ({
      id: `file_${idx}_${Date.now()}`,
      name: f.name,
      language: f.language,
      content: f.content,
      savedContent: f.content,
      lastCheckpointTime: Date.now(),
      checkpointLabel: 'Initial Checkpoint',
      isOpen: true,
      isModified: false,
      isDiffActive: false,
    }));
  });

  // Pane 1 & Pane 2 Tab States
  const [pane1ActiveFileId, setPane1ActiveFileId] = useState<string>(() => 
    savedWorkspace?.pane1ActiveFileId && files.some(f => f.id === savedWorkspace.pane1ActiveFileId)
      ? savedWorkspace.pane1ActiveFileId
      : files[0]?.id || ''
  );
  const [pane1OpenFileIds, setPane1OpenFileIds] = useState<string[]>(() => 
    savedWorkspace?.pane1OpenFileIds && savedWorkspace.pane1OpenFileIds.length > 0
      ? savedWorkspace.pane1OpenFileIds.filter(id => files.some(f => f.id === id))
      : files.map(f => f.id)
  );
  const [pane2ActiveFileId, setPane2ActiveFileId] = useState<string>(() => 
    savedWorkspace?.pane2ActiveFileId && files.some(f => f.id === savedWorkspace.pane2ActiveFileId)
      ? savedWorkspace.pane2ActiveFileId
      : files[1]?.id || files[0]?.id || ''
  );
  const [pane2OpenFileIds, setPane2OpenFileIds] = useState<string[]>(() => 
    savedWorkspace?.pane2OpenFileIds && savedWorkspace.pane2OpenFileIds.length > 0
      ? savedWorkspace.pane2OpenFileIds.filter(id => files.some(f => f.id === id))
      : files.length > 1 ? [files[1].id] : [files[0]?.id || '']
  );
  const [pinnedFileIds, setPinnedFileIds] = useState<string[]>([]);
  const [focusedPane, setFocusedPane] = useState<'pane-1' | 'pane-2'>(() => 
    savedWorkspace?.focusedPane || 'pane-1'
  );

  // Split Editor State
  const [editorSplit, setEditorSplit] = useState<EditorSplitDirection>(() => 
    savedWorkspace?.editorSplit || 'none'
  );
  const [editorSplitRatio, setEditorSplitRatio] = useState<number>(50);
  const [isDraggingEditorSplit, setIsDraggingEditorSplit] = useState(false);
  const editorSplitContainerRef = useRef<HTMLDivElement>(null);

  // Detached Pop-out Windows State
  const [detachedWindows, setDetachedWindows] = useState<DetachedWindowItem[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(100);

  const [activeTab, setActiveTab] = useState<ConsoleTab>(() => 
    savedWorkspace?.activeTab || initialTemplate.defaultTab
  );
  const [stdinInput, setStdinInput] = useState<string>(() => 
    savedWorkspace?.stdinInput !== undefined ? savedWorkspace.stdinInput : (initialTemplate.defaultStdin || '')
  );
  const [testCases, setTestCases] = useState<TestCase[]>(() => 
    savedWorkspace?.testCases && savedWorkspace.testCases.length > 0
      ? savedWorkspace.testCases
      : (initialTemplate.testCases || [
          {
            id: 'tc-1',
            name: 'Sample Case 1',
            input: '8\n45 12 89 23 7 90 34 56\n',
            expectedOutput: 'Sorted Array: [7, 12, 23, 34, 45, 56, 89, 90]\nMin Element: 7\nMax Element: 90\nSum: 356\nMean: 44.50',
          }
        ])
  );

  // Auto-Save Management State
  const [lastSaved, setLastSaved] = useState<number>(() => savedWorkspace?.lastSaved || Date.now());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isLanguagesHubOpen, setIsLanguagesHubOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem('cloudide_editor_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Persist editor settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cloudide_editor_settings', JSON.stringify(editorSettings));
    } catch {
      // ignore
    }
  }, [editorSettings]);

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

  // Active File based on focused pane
  const activeFile = (focusedPane === 'pane-2' && editorSplit !== 'none')
    ? (files.find(f => f.id === pane2ActiveFileId) || files.find(f => f.id === pane1ActiveFileId) || files[0])
    : (files.find(f => f.id === pane1ActiveFileId) || files[0]);

  const pane1ActiveFile = files.find(f => f.id === pane1ActiveFileId) || files[0];
  const pane2ActiveFile = files.find(f => f.id === pane2ActiveFileId) || files[1] || files[0];

  // Core Code Execution Handler
  const handleRunCode = useCallback(async () => {
    if (!activeFile || isRunning) return;

    // Protection Platform: Check Emergency Runtime Lockdown
    if (protectionConfig?.emergencyLockdown && !isAdmin) {
      setExecutionResult({
        logs: [{
          id: `lockdown_${Date.now()}`,
          type: 'error',
          args: ['[PROTECTION PLATFORM ALERT] Code execution is temporarily locked down by system administrator (tarun98293@gmail.com).'],
          timestamp: Date.now(),
        }],
        error: 'System Lockdown Active',
        executionTimeMs: 0,
        status: 'error',
      });
      return;
    }

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

  // Global Keyboard Shortcuts (F1, Ctrl+P, Shift+Enter, Ctrl+`, Ctrl+L, Ctrl+\ for split)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for Manual Workspace Save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave();
      }
      // F1 or Ctrl+Shift+P for Command Palette
      if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+\ for split editor toggle
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setEditorSplit(prev => prev === 'none' ? 'horizontal' : 'none');
      }
      // Ctrl+` (backtick) or Cmd+` for toggling output panel
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsOutputHidden(prev => !prev);
      }
      // Ctrl+L or Cmd+L for opening Languages Hub
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLanguagesHubOpen(prev => !prev);
      }
      // Alt+D to toggle Diff Viewer for currently focused/active file
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const currentActive = focusedPane === 'pane-1' ? pane1ActiveFileId : (pane2ActiveFileId || pane1ActiveFileId);
        if (currentActive) {
          handleToggleDiffMode(currentActive);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Mouse Drag Handler for Split Panes Resizer (Editor vs Output)
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

  // Mouse Drag Handler for Split Editor Resizer (Pane 1 vs Pane 2)
  useEffect(() => {
    const handleEditorSplitMove = (e: MouseEvent) => {
      if (!isDraggingEditorSplit || !editorSplitContainerRef.current) return;
      const rect = editorSplitContainerRef.current.getBoundingClientRect();

      let newRatio = 50;
      if (editorSplit === 'vertical') {
        const offset = e.clientY - rect.top;
        newRatio = Math.max(20, Math.min(80, (offset / rect.height) * 100));
      } else {
        const offset = e.clientX - rect.left;
        newRatio = Math.max(20, Math.min(80, (offset / rect.width) * 100));
      }
      setEditorSplitRatio(newRatio);
    };

    const handleEditorSplitUp = () => {
      if (isDraggingEditorSplit) {
        setIsDraggingEditorSplit(false);
      }
    };

    if (isDraggingEditorSplit) {
      window.addEventListener('mousemove', handleEditorSplitMove);
      window.addEventListener('mouseup', handleEditorSplitUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleEditorSplitMove);
      window.removeEventListener('mouseup', handleEditorSplitUp);
    };
  }, [isDraggingEditorSplit, editorSplit]);

  // Keep a synchronized ref for reliable synchronous unmount / beforeunload serialization
  const workspaceStateRef = useRef({
    files,
    pane1ActiveFileId,
    pane1OpenFileIds,
    pane2ActiveFileId,
    pane2OpenFileIds,
    focusedPane,
    editorSplit,
    stdinInput,
    testCases,
    activeTab,
  });

  useEffect(() => {
    workspaceStateRef.current = {
      files,
      pane1ActiveFileId,
      pane1OpenFileIds,
      pane2ActiveFileId,
      pane2OpenFileIds,
      focusedPane,
      editorSplit,
      stdinInput,
      testCases,
      activeTab,
    };
  }, [files, pane1ActiveFileId, pane1OpenFileIds, pane2ActiveFileId, pane2OpenFileIds, focusedPane, editorSplit, stdinInput, testCases, activeTab]);

  // Core Auto-Save & Manual Save Persistence Handler
  const performSave = useCallback(() => {
    const current = workspaceStateRef.current;
    const now = Date.now();
    const updatedFiles = current.files.map(f => ({
      ...f,
      savedContent: f.content,
      lastCheckpointTime: now,
      checkpointLabel: 'Saved Checkpoint',
      isModified: false,
    }));

    const snapshot: SavedWorkspace = {
      version: 1,
      lastSaved: now,
      files: updatedFiles,
      pane1ActiveFileId: current.pane1ActiveFileId,
      pane1OpenFileIds: current.pane1OpenFileIds,
      pane2ActiveFileId: current.pane2ActiveFileId,
      pane2OpenFileIds: current.pane2OpenFileIds,
      focusedPane: current.focusedPane,
      editorSplit: current.editorSplit,
      stdinInput: current.stdinInput,
      testCases: current.testCases,
      activeTab: current.activeTab,
    };

    setIsAutoSaving(true);
    const success = saveWorkspaceToStorage(snapshot);
    if (success) {
      setLastSaved(snapshot.lastSaved);
      setHasUnsavedChanges(false);
      // Mark files as unmodified and update savedContent in state
      setFiles(updatedFiles);
    }

    setTimeout(() => {
      setIsAutoSaving(false);
    }, 300);
  }, []);

  // Window beforeunload listener: immediately dumps the latest workspace into localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = workspaceStateRef.current;
      saveWorkspaceToStorage({
        version: 1,
        lastSaved: Date.now(),
        files: current.files.map(f => ({ ...f, isModified: false })),
        pane1ActiveFileId: current.pane1ActiveFileId,
        pane1OpenFileIds: current.pane1OpenFileIds,
        pane2ActiveFileId: current.pane2ActiveFileId,
        pane2OpenFileIds: current.pane2OpenFileIds,
        focusedPane: current.focusedPane,
        editorSplit: current.editorSplit,
        stdinInput: current.stdinInput,
        testCases: current.testCases,
        activeTab: current.activeTab,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Debounced auto-save on workspace content changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (editorSettings.autoSave === false) return;

    setHasUnsavedChanges(true);
    const timer = setTimeout(() => {
      performSave();
    }, editorSettings.autoSaveDelay || 1000);

    return () => clearTimeout(timer);
  }, [
    files, 
    pane1ActiveFileId, 
    pane1OpenFileIds, 
    pane2ActiveFileId, 
    pane2OpenFileIds, 
    stdinInput, 
    testCases, 
    editorSplit, 
    editorSettings.autoSave, 
    editorSettings.autoSaveDelay,
    performSave
  ]);

  // Periodic interval safeguard (every 5 seconds) to ensure changes are flushed if pending
  useEffect(() => {
    if (editorSettings.autoSave === false) return;
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        performSave();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [editorSettings.autoSave, hasUnsavedChanges, performSave]);

  // Reset workspace to original factory starter template
  const handleResetWorkspace = () => {
    clearSavedWorkspace();
    const resetFiles: FileItem[] = initialTemplate.files.map((f, idx) => ({
      id: `file_${idx}_${Date.now()}`,
      name: f.name,
      language: f.language,
      content: f.content,
      savedContent: f.content,
      lastCheckpointTime: Date.now(),
      checkpointLabel: 'Factory Checkpoint',
      isOpen: true,
      isModified: false,
      isDiffActive: false,
    }));
    setFiles(resetFiles);
    setPane1ActiveFileId(resetFiles[0].id);
    setPane1OpenFileIds(resetFiles.map(f => f.id));
    if (resetFiles.length > 1) {
      setPane2ActiveFileId(resetFiles[1].id);
      setPane2OpenFileIds([resetFiles[1].id]);
    } else {
      setPane2ActiveFileId(resetFiles[0].id);
      setPane2OpenFileIds([resetFiles[0].id]);
    }
    setFocusedPane('pane-1');
    setEditorSplit('none');
    setActiveTab(initialTemplate.defaultTab);
    setStdinInput(initialTemplate.defaultStdin || '');
    setTestCases(initialTemplate.testCases || []);
    setLastSaved(Date.now());
    setHasUnsavedChanges(false);

    setTimeout(() => {
      executeCode(resetFiles[0].content, resetFiles[0].language, initialTemplate.defaultStdin || '', false).then(res => {
        setExecutionResult(res);
      });
    }, 50);
  };

  // Auto-run initial template on mount
  useEffect(() => {
    if (activeFile) {
      handleRunCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update file content with fileId
  const handleContentChange = (fileId: string, newContent: string) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { 
          ...f, 
          content: newContent, 
          isModified: f.savedContent !== undefined ? f.savedContent !== newContent : true 
        } : f
      )
    );
  };

  // Diff Mode Handlers
  const handleToggleDiffMode = (fileId: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            isDiffActive: !f.isDiffActive,
            savedContent: f.savedContent !== undefined ? f.savedContent : f.content,
            lastCheckpointTime: f.lastCheckpointTime || Date.now(),
            checkpointLabel: f.checkpointLabel || 'Saved Checkpoint',
          };
        }
        return f;
      })
    );
  };

  const handleRestoreCheckpoint = (fileId: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          const restored = f.savedContent !== undefined ? f.savedContent : f.content;
          return {
            ...f,
            content: restored,
            isModified: false,
          };
        }
        return f;
      })
    );
  };

  const handleUpdateCheckpoint = (fileId: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            savedContent: f.content,
            lastCheckpointTime: Date.now(),
            checkpointLabel: 'Manual Checkpoint',
            isModified: false,
          };
        }
        return f;
      })
    );
  };

  const handleDuplicateFile = (fileId: string) => {
    const target = files.find(f => f.id === fileId);
    if (!target) return;
    const parts = target.name.split('.');
    let newName = '';
    if (parts.length > 1) {
      const ext = parts.pop();
      newName = `${parts.join('.')}_copy.${ext}`;
    } else {
      newName = `${target.name}_copy`;
    }
    handleCreateFile(newName, target.language, target.content);
  };

  // Open / Select File in Pane
  const handleSelectFileInPane = (pane: 'pane-1' | 'pane-2', fileId: string) => {
    setFocusedPane(pane);
    if (pane === 'pane-1') {
      setPane1ActiveFileId(fileId);
      if (!pane1OpenFileIds.includes(fileId)) {
        setPane1OpenFileIds(prev => [...prev, fileId]);
      }
    } else {
      setPane2ActiveFileId(fileId);
      if (!pane2OpenFileIds.includes(fileId)) {
        setPane2OpenFileIds(prev => [...prev, fileId]);
      }
    }
  };

  // Close Tab in Pane
  const handleCloseTabInPane = (pane: 'pane-1' | 'pane-2', fileId: string) => {
    if (pane === 'pane-1') {
      const remaining = pane1OpenFileIds.filter(id => id !== fileId);
      setPane1OpenFileIds(remaining);
      if (pane1ActiveFileId === fileId && remaining.length > 0) {
        setPane1ActiveFileId(remaining[remaining.length - 1]);
      }
    } else {
      const remaining = pane2OpenFileIds.filter(id => id !== fileId);
      setPane2OpenFileIds(remaining);
      if (pane2ActiveFileId === fileId && remaining.length > 0) {
        setPane2ActiveFileId(remaining[remaining.length - 1]);
      }
    }
  };

  // Close Other Tabs
  const handleCloseOtherTabs = (pane: 'pane-1' | 'pane-2', fileId: string) => {
    if (pane === 'pane-1') {
      setPane1OpenFileIds([fileId]);
      setPane1ActiveFileId(fileId);
    } else {
      setPane2OpenFileIds([fileId]);
      setPane2ActiveFileId(fileId);
    }
  };

  // Close All Tabs
  const handleCloseAllTabs = (pane: 'pane-1' | 'pane-2') => {
    if (files.length === 0) return;
    if (pane === 'pane-1') {
      setPane1OpenFileIds([files[0].id]);
      setPane1ActiveFileId(files[0].id);
    } else {
      setPane2OpenFileIds([files[0].id]);
      setPane2ActiveFileId(files[0].id);
    }
  };

  // Toggle Pin Tab
  const handleTogglePinTab = (fileId: string) => {
    setPinnedFileIds(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  // Split Editor
  const handleSplitEditor = (direction: 'horizontal' | 'vertical') => {
    requirePremium('Multi-Window Split View', () => {
      setEditorSplit(direction);
      // If Pane 2 has no open file yet, set to current active file or another file
      if (pane2OpenFileIds.length === 0 || !pane2ActiveFileId) {
        const alternateFile = files.find(f => f.id !== pane1ActiveFileId) || files[0];
        if (alternateFile) {
          setPane2OpenFileIds([alternateFile.id]);
          setPane2ActiveFileId(alternateFile.id);
        }
      }
    });
  };

  // Close Split Editor
  const handleCloseSplitEditor = () => {
    setEditorSplit('none');
    setFocusedPane('pane-1');
  };

  // Detached Floating Window Handlers
  const handlePopOutOutput = () => {
    requirePremium('Floating Windows', () => {
      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);
      setDetachedWindows(prev => [
        ...prev.filter(w => w.type !== 'output'),
        {
          id: `win_output_${Date.now()}`,
          type: 'output',
          title: 'Output Console',
          position: { x: Math.max(40, window.innerWidth - 650), y: 70 },
          size: { width: 620, height: 460 },
          isMinimized: false,
          isMaximized: false,
          zIndex: newZ,
        }
      ]);
    });
  };

  const handlePopOutFile = (fileId: string) => {
    requirePremium('Floating Windows', () => {
      const file = files.find(f => f.id === fileId);
      if (!file) return;
      const newZ = maxZIndex + 1;
      setMaxZIndex(newZ);
      setDetachedWindows(prev => [
        ...prev,
        {
          id: `win_file_${fileId}_${Date.now()}`,
          type: 'editor',
          title: `${file.name}`,
          fileId: file.id,
          position: { x: Math.max(50, window.innerWidth / 4), y: 90 },
          size: { width: 600, height: 480 },
          isMinimized: false,
          isMaximized: false,
          zIndex: newZ,
        }
      ]);
    });
  };

  const handleUpdateDetachedWindow = (id: string, updates: Partial<DetachedWindowItem>) => {
    setDetachedWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const handleCloseDetachedWindow = (id: string) => {
    setDetachedWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleBringWindowToFront = (id: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setDetachedWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ } : w));
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
      savedContent: initialSnippet,
      lastCheckpointTime: Date.now(),
      checkpointLabel: 'Initial Checkpoint',
      isOpen: true,
      isModified: false,
      isDiffActive: false,
    };
    setFiles(prev => [...prev, newFile]);
    setPane1OpenFileIds(prev => [...prev, newFile.id]);
    setPane1ActiveFileId(newFile.id);
  };

  // Delete File
  const handleDeleteFile = (fileId: string) => {
    const remainingFiles = files.filter(f => f.id !== fileId);
    if (remainingFiles.length === 0) return;
    setFiles(remainingFiles);
    setPane1OpenFileIds(prev => prev.filter(id => id !== fileId));
    setPane2OpenFileIds(prev => prev.filter(id => id !== fileId));
    if (pane1ActiveFileId === fileId) {
      setPane1ActiveFileId(remainingFiles[0].id);
    }
    if (pane2ActiveFileId === fileId) {
      setPane2ActiveFileId(remainingFiles[0].id);
    }
  };

  // Load Starter Template
  const handleSelectTemplate = (template: ProjectTemplate) => {
    const newFiles: FileItem[] = template.files.map((f, idx) => ({
      id: `file_${idx}_${Date.now()}`,
      name: f.name,
      language: f.language,
      content: f.content,
      savedContent: f.content,
      lastCheckpointTime: Date.now(),
      checkpointLabel: 'Template Checkpoint',
      isOpen: true,
      isModified: false,
      isDiffActive: false,
    }));

    setFiles(newFiles);
    setPane1ActiveFileId(newFiles[0].id);
    setPane1OpenFileIds(newFiles.map(f => f.id));
    if (newFiles.length > 1) {
      setPane2ActiveFileId(newFiles[1].id);
      setPane2OpenFileIds([newFiles[1].id]);
    } else {
      setPane2ActiveFileId(newFiles[0].id);
      setPane2OpenFileIds([newFiles[0].id]);
    }
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
        handleContentChange(activeFile.id, formatted);
      } else {
        const formatted = activeFile.content
          .split('\n')
          .map(line => line.trimEnd())
          .join('\n');
        handleContentChange(activeFile.id, formatted);
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
        onToggleAiCopilot={() => requirePremium('AI Copilot', () => setIsAiCopilotOpen(prev => !prev))}
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
        editorSplit={editorSplit}
        onToggleEditorSplit={(split) => setEditorSplit(split)}
        onPopOutOutput={() => requirePremium('Floating Windows', () => handlePopOutOutput())}
        lastSaved={lastSaved}
        isAutoSaving={isAutoSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        autoSaveEnabled={editorSettings.autoSave !== false}
        onToggleAutoSave={(enabled) => setEditorSettings(prev => ({ ...prev, autoSave: enabled }))}
        onManualSave={performSave}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Protection Platform Status Banners */}
      {protectionConfig?.maintenanceMode && (
        <div className="bg-amber-950/90 border-b border-amber-600/50 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Maintenance Mode Active:</strong> Public executions are restricted. Master Admin ({isAdmin ? 'You are logged in' : 'Sign in as tarun98293@gmail.com'}) has full access.
            </span>
          </div>
          {!user && (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="underline hover:text-white text-[11px] font-semibold cursor-pointer"
            >
              Sign In as Admin
            </button>
          )}
        </div>
      )}

      {protectionConfig?.emergencyLockdown && (
        <div className="bg-red-950/90 border-b border-red-600/50 px-4 py-1.5 flex items-center justify-between text-xs text-red-200 z-10 shrink-0 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Emergency Runtime Lockdown Active:</strong> Code execution processes are paused by platform defense shield.
            </span>
          </div>
        </div>
      )}

      {/* Main Studio Work Area */}
      <div className="w-full max-w-[100vw] flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Explorer (Desktop) */}
        {isSidebarOpen && (
          <div className="w-56 shrink-0 hidden md:block">
            <FileExplorer
              files={files}
              activeFileId={pane1ActiveFileId}
              onSelectFile={(id) => handleSelectFileInPane(focusedPane, id)}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onToggleDiffMode={handleToggleDiffMode}
              onRestoreCheckpoint={handleRestoreCheckpoint}
              onUpdateCheckpoint={handleUpdateCheckpoint}
              onDuplicateFile={handleDuplicateFile}
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
                activeFileId={pane1ActiveFileId}
                onSelectFile={(id) => {
                  handleSelectFileInPane('pane-1', id);
                  setIsSidebarOpen(false);
                }}
                onCreateFile={(name, lang) => {
                  handleCreateFile(name, lang);
                  setIsSidebarOpen(false);
                }}
                onDeleteFile={handleDeleteFile}
                onToggleDiffMode={handleToggleDiffMode}
                onRestoreCheckpoint={handleRestoreCheckpoint}
                onUpdateCheckpoint={handleUpdateCheckpoint}
                onDuplicateFile={handleDuplicateFile}
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

          {/* Split Panes: Editor & Output Console with Resizer */}
          <div
            ref={splitContainerRef}
            className={`flex-1 flex overflow-hidden w-full max-w-full min-w-0 ${
              layoutMode === 'split-vertical' ? 'flex-col' : 'flex-col lg:flex-row'
            }`}
          >
            {/* Code Editor Pane (or Dual Split Editor Panes) */}
            {showEditor && (
              <div
                style={{
                  flex: showOutput && !isOutputMinimized 
                    ? `0 0 ${splitRatio}%` 
                    : '1 1 100%',
                }}
                className="overflow-hidden min-h-[140px] w-full max-w-full min-w-0 flex flex-col"
              >
                {/* Single Editor Mode */}
                {editorSplit === 'none' ? (
                  <div 
                    onClick={() => setFocusedPane('pane-1')}
                    className="flex-1 flex flex-col h-full overflow-hidden"
                  >
                    <DynamicTabBar
                      paneId="pane-1"
                      files={files}
                      openFileIds={pane1OpenFileIds}
                      activeFileId={pane1ActiveFileId}
                      pinnedFileIds={pinnedFileIds}
                      onSelectTab={(id) => handleSelectFileInPane('pane-1', id)}
                      onCloseTab={(id) => handleCloseTabInPane('pane-1', id)}
                      onCloseOtherTabs={(id) => handleCloseOtherTabs('pane-1', id)}
                      onCloseAllTabs={() => handleCloseAllTabs('pane-1')}
                      onTogglePinTab={handleTogglePinTab}
                      onSplitEditor={handleSplitEditor}
                      isSplitActive={false}
                      onPopOutFile={handlePopOutFile}
                      onCreateNewFile={handleCreateFile}
                      onOpenFileInTab={(id) => handleSelectFileInPane('pane-1', id)}
                      onToggleDiffMode={handleToggleDiffMode}
                      onRestoreCheckpoint={handleRestoreCheckpoint}
                      onUpdateCheckpoint={handleUpdateCheckpoint}
                    />

                    {pane1ActiveFile && (
                      <div className="flex-1 overflow-hidden relative">
                        <CodeEditor
                          key={pane1ActiveFile.id}
                          file={pane1ActiveFile}
                          files={files}
                          onSelectFile={(id) => handleSelectFileInPane('pane-1', id)}
                          workspaceName="cloudide-workspace"
                          onChangeContent={(content) => handleContentChange(pane1ActiveFile.id, content)}
                          onRun={handleRunCode}
                          onAskAi={() => requirePremium('AI Copilot', () => setIsAiCopilotOpen(true))}
                          onToggleDiffMode={handleToggleDiffMode}
                          onRestoreCheckpoint={handleRestoreCheckpoint}
                          onUpdateCheckpoint={handleUpdateCheckpoint}
                          settings={editorSettings}
                          onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Dual Multi-Window Split Screen Mode */
                  <div
                    ref={editorSplitContainerRef}
                    className={`flex-1 flex overflow-hidden w-full h-full ${
                      editorSplit === 'vertical' ? 'flex-col' : 'flex-row'
                    }`}
                  >
                    {/* Pane 1 (Left / Top) */}
                    <div
                      style={{
                        flex: `0 0 ${editorSplitRatio}%`,
                      }}
                      onClick={() => setFocusedPane('pane-1')}
                      className={`flex flex-col overflow-hidden min-h-[100px] min-w-[150px] transition-all border-r border-slate-800 ${
                        focusedPane === 'pane-1' ? 'ring-1 ring-indigo-500/50' : ''
                      }`}
                    >
                      <DynamicTabBar
                        paneId="pane-1"
                        files={files}
                        openFileIds={pane1OpenFileIds}
                        activeFileId={pane1ActiveFileId}
                        pinnedFileIds={pinnedFileIds}
                        onSelectTab={(id) => handleSelectFileInPane('pane-1', id)}
                        onCloseTab={(id) => handleCloseTabInPane('pane-1', id)}
                        onCloseOtherTabs={(id) => handleCloseOtherTabs('pane-1', id)}
                        onCloseAllTabs={() => handleCloseAllTabs('pane-1')}
                        onTogglePinTab={handleTogglePinTab}
                        onSplitEditor={handleSplitEditor}
                        onCloseSplit={handleCloseSplitEditor}
                        isSplitActive={true}
                        splitDirection={editorSplit}
                        onPopOutFile={handlePopOutFile}
                        onCreateNewFile={handleCreateFile}
                        onOpenFileInTab={(id) => handleSelectFileInPane('pane-1', id)}
                        onToggleDiffMode={handleToggleDiffMode}
                        onRestoreCheckpoint={handleRestoreCheckpoint}
                        onUpdateCheckpoint={handleUpdateCheckpoint}
                      />

                      {pane1ActiveFile && (
                        <div className="flex-1 overflow-hidden relative">
                          <CodeEditor
                            key={pane1ActiveFile.id}
                            file={pane1ActiveFile}
                            files={files}
                            onSelectFile={(id) => handleSelectFileInPane('pane-1', id)}
                            workspaceName="cloudide-workspace"
                            onChangeContent={(content) => handleContentChange(pane1ActiveFile.id, content)}
                            onRun={handleRunCode}
                            onAskAi={() => requirePremium('AI Copilot', () => setIsAiCopilotOpen(true))}
                            onToggleDiffMode={handleToggleDiffMode}
                            onRestoreCheckpoint={handleRestoreCheckpoint}
                            onUpdateCheckpoint={handleUpdateCheckpoint}
                            settings={editorSettings}
                            onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Resizer Divider between Pane 1 and Pane 2 */}
                    <div
                      onMouseDown={() => setIsDraggingEditorSplit(true)}
                      className={`group shrink-0 bg-slate-800 hover:bg-indigo-500 transition-colors z-10 ${
                        editorSplit === 'vertical' 
                          ? 'h-1.5 w-full cursor-row-resize' 
                          : 'w-1.5 h-full cursor-col-resize'
                      }`}
                      title="Drag to resize Split Editor panes"
                    >
                      <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className={`bg-white rounded-full ${editorSplit === 'vertical' ? 'w-8 h-0.5' : 'h-8 w-0.5'}`} />
                      </div>
                    </div>

                    {/* Pane 2 (Right / Bottom) */}
                    <div
                      style={{
                        flex: `1 1 ${100 - editorSplitRatio}%`,
                      }}
                      onClick={() => setFocusedPane('pane-2')}
                      className={`flex flex-col overflow-hidden min-h-[100px] min-w-[150px] transition-all ${
                        focusedPane === 'pane-2' ? 'ring-1 ring-indigo-500/50' : ''
                      }`}
                    >
                      <DynamicTabBar
                        paneId="pane-2"
                        files={files}
                        openFileIds={pane2OpenFileIds}
                        activeFileId={pane2ActiveFileId}
                        pinnedFileIds={pinnedFileIds}
                        onSelectTab={(id) => handleSelectFileInPane('pane-2', id)}
                        onCloseTab={(id) => handleCloseTabInPane('pane-2', id)}
                        onCloseOtherTabs={(id) => handleCloseOtherTabs('pane-2', id)}
                        onCloseAllTabs={() => handleCloseAllTabs('pane-2')}
                        onTogglePinTab={handleTogglePinTab}
                        onSplitEditor={handleSplitEditor}
                        onCloseSplit={handleCloseSplitEditor}
                        isSplitActive={true}
                        splitDirection={editorSplit}
                        onPopOutFile={handlePopOutFile}
                        onCreateNewFile={handleCreateFile}
                        onOpenFileInTab={(id) => handleSelectFileInPane('pane-2', id)}
                        onToggleDiffMode={handleToggleDiffMode}
                        onRestoreCheckpoint={handleRestoreCheckpoint}
                        onUpdateCheckpoint={handleUpdateCheckpoint}
                      />

                      {pane2ActiveFile && (
                        <div className="flex-1 overflow-hidden relative">
                          <CodeEditor
                            key={pane2ActiveFile.id}
                            file={pane2ActiveFile}
                            files={files}
                            onSelectFile={(id) => handleSelectFileInPane('pane-2', id)}
                            workspaceName="cloudide-workspace"
                            onChangeContent={(content) => handleContentChange(pane2ActiveFile.id, content)}
                            onRun={handleRunCode}
                            onAskAi={() => requirePremium('AI Copilot', () => setIsAiCopilotOpen(true))}
                            onToggleDiffMode={handleToggleDiffMode}
                            onRestoreCheckpoint={handleRestoreCheckpoint}
                            onUpdateCheckpoint={handleUpdateCheckpoint}
                            settings={editorSettings}
                            onOpenLanguagesHub={() => setIsLanguagesHubOpen(true)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Draggable Resizer Divider (between Editor & Output) */}
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
                  activeLanguage={activeFile?.language || 'python'}
                  activeCode={activeFile?.content || ''}
                  onExecuteApiRequest={handleExecuteApiRequest}
                  terminalTheme={editorSettings.terminalTheme}
                  onUpdateTerminalTheme={(theme) => setEditorSettings(prev => ({ ...prev, terminalTheme: theme }))}
                  isMinimized={isOutputMinimized}
                  onToggleMinimize={() => setIsOutputMinimized(prev => !prev)}
                  isMaximized={isOutputMaximized}
                  onToggleMaximize={() => {
                    setIsOutputMaximized(prev => !prev);
                    if (isOutputMinimized) setIsOutputMinimized(false);
                  }}
                  onClose={() => setIsOutputHidden(true)}
                  onPopOut={handlePopOutOutput}
                  onInsertCodeSnippet={(snippet) => {
                    if (activeFile) {
                      handleContentChange(activeFile.id, activeFile.content + '\n' + snippet);
                    }
                  }}
                  customPreviewContent={
                    <LivePreview
                      files={files}
                      activeFile={activeFile || files[0]}
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
              onApplyCode={(code) => activeFile && handleContentChange(activeFile.id, code)}
              onClose={() => setIsAiCopilotOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Detached Pop-out Floating Windows Manager */}
      <FloatingWindowManager
        windows={detachedWindows}
        onUpdateWindow={handleUpdateDetachedWindow}
        onCloseWindow={handleCloseDetachedWindow}
        onBringToFront={handleBringWindowToFront}
        files={files}
        onChangeContent={handleContentChange}
        onRunCode={handleRunCode}
        editorSettings={editorSettings}
        executionResult={executionResult}
        activeConsoleTab={activeTab}
        onChangeConsoleTab={setActiveTab}
        onClearConsole={handleClearConsole}
        isRunning={isRunning}
        stdinInput={stdinInput}
        onChangeStdin={setStdinInput}
        testCases={testCases}
        onRunTestCases={handleRunTestCases}
        onAddTestCase={handleAddTestCase}
        onUpdateTestCase={handleUpdateTestCase}
        onDeleteTestCase={handleDeleteTestCase}
        onExecuteApiRequest={handleExecuteApiRequest}
        onAskAi={() => requirePremium('AI Copilot', () => setIsAiCopilotOpen(true))}
        onIframeLog={handleIframeLog}
      />

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
          if (activeFile) {
            setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, language: lang } : f));
          }
        }}
        onExport={handleExportProject}
        onSaveWorkspace={performSave}
        onResetWorkspace={handleResetWorkspace}
        onToggleDiffMode={() => {
          const currentActive = focusedPane === 'pane-1' ? pane1ActiveFileId : (pane2ActiveFileId || pane1ActiveFileId);
          if (currentActive) handleToggleDiffMode(currentActive);
        }}
        onRestoreCheckpoint={() => {
          const currentActive = focusedPane === 'pane-1' ? pane1ActiveFileId : (pane2ActiveFileId || pane1ActiveFileId);
          if (currentActive) handleRestoreCheckpoint(currentActive);
        }}
        onUpdateCheckpoint={() => {
          const currentActive = focusedPane === 'pane-1' ? pane1ActiveFileId : (pane2ActiveFileId || pane1ActiveFileId);
          if (currentActive) handleUpdateCheckpoint(currentActive);
        }}
      />

      {/* Editor Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={editorSettings}
        onUpdateSettings={(updated) => setEditorSettings(s => ({ ...s, ...updated }))}
      />

      {/* Multi-Provider Authentication Modal */}
      <AuthModal />

      {/* Feature Gating Modal for Premium Tools */}
      <PremiumGateModal />

      {/* Master Protection Platform & Admin Center */}
      <ProtectionCenterModal />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

      {/* 2-3 Second Animated Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
    </div>
  );
}
