import React, { useState, useRef, useEffect } from 'react';
import { FileItem, Language, ExecutionResult, ConsoleTab, TestCase, EditorSettings } from '../types';
import { CodeEditor } from './CodeEditor';
import { OutputConsole } from './OutputConsole';
import { LivePreview } from './LivePreview';
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Terminal, 
  FileCode, 
  Eye, 
  RotateCcw,
  Sparkles,
  Move
} from 'lucide-react';

export interface DetachedWindowItem {
  id: string;
  type: 'editor' | 'output' | 'preview';
  title: string;
  fileId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface FloatingWindowManagerProps {
  windows: DetachedWindowItem[];
  onUpdateWindow: (id: string, updates: Partial<DetachedWindowItem>) => void;
  onCloseWindow: (id: string) => void;
  onBringToFront: (id: string) => void;
  // Shared state & callbacks for embedded views
  files: FileItem[];
  onChangeContent: (fileId: string, content: string) => void;
  onRunCode: () => void;
  editorSettings: EditorSettings;
  executionResult: ExecutionResult | null;
  activeConsoleTab: ConsoleTab;
  onChangeConsoleTab: (tab: ConsoleTab) => void;
  onClearConsole: () => void;
  isRunning: boolean;
  stdinInput: string;
  onChangeStdin: (stdin: string) => void;
  testCases: TestCase[];
  onRunTestCases: () => void;
  onAddTestCase: () => void;
  onUpdateTestCase: (id: string, updated: Partial<TestCase>) => void;
  onDeleteTestCase: (id: string) => void;
  onExecuteApiRequest: (method: string, path: string, headers: Record<string, string>, body: string) => Promise<any>;
  onAskAi: (code?: string) => void;
  onIframeLog?: (log: any) => void;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  windows,
  onUpdateWindow,
  onCloseWindow,
  onBringToFront,
  files,
  onChangeContent,
  onRunCode,
  editorSettings,
  executionResult,
  activeConsoleTab,
  onChangeConsoleTab,
  onClearConsole,
  isRunning,
  stdinInput,
  onChangeStdin,
  testCases,
  onRunTestCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onExecuteApiRequest,
  onAskAi,
  onIframeLog,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; winX: number; winY: number; winW: number; winH: number }>({
    mouseX: 0, mouseY: 0, winX: 0, winY: 0, winW: 0, winH: 0
  });

  // Global mousemove & mouseup for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeDragId) {
        const win = windows.find(w => w.id === activeDragId);
        if (win && !win.isMaximized) {
          const dx = e.clientX - dragStartPosRef.current.mouseX;
          const dy = e.clientY - dragStartPosRef.current.mouseY;
          const newX = Math.max(10, Math.min(window.innerWidth - 100, dragStartPosRef.current.winX + dx));
          const newY = Math.max(40, Math.min(window.innerHeight - 80, dragStartPosRef.current.winY + dy));
          onUpdateWindow(activeDragId, { position: { x: newX, y: newY } });
        }
      } else if (activeResizeId) {
        const win = windows.find(w => w.id === activeResizeId);
        if (win && !win.isMaximized) {
          const dx = e.clientX - dragStartPosRef.current.mouseX;
          const dy = e.clientY - dragStartPosRef.current.mouseY;
          const newW = Math.max(340, Math.min(window.innerWidth - 20, dragStartPosRef.current.winW + dx));
          const newH = Math.max(220, Math.min(window.innerHeight - 50, dragStartPosRef.current.winH + dy));
          onUpdateWindow(activeResizeId, { size: { width: newW, height: newH } });
        }
      }
    };

    const handleMouseUp = () => {
      setActiveDragId(null);
      setActiveResizeId(null);
    };

    if (activeDragId || activeResizeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDragId, activeResizeId, windows, onUpdateWindow]);

  const handleStartDrag = (e: React.MouseEvent, win: DetachedWindowItem) => {
    if (win.isMaximized) return;
    onBringToFront(win.id);
    setActiveDragId(win.id);
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.position.x,
      winY: win.position.y,
      winW: win.size.width,
      winH: win.size.height,
    };
  };

  const handleStartResize = (e: React.MouseEvent, win: DetachedWindowItem) => {
    e.stopPropagation();
    if (win.isMaximized) return;
    onBringToFront(win.id);
    setActiveResizeId(win.id);
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.position.x,
      winY: win.position.y,
      winW: win.size.width,
      winH: win.size.height,
    };
  };

  const minimizedWindows = windows.filter(w => w.isMinimized);

  return (
    <>
      {/* Active Floating Windows */}
      {windows.map((win) => {
        if (win.isMinimized) return null;

        const targetFile = win.fileId ? files.find(f => f.id === win.fileId) : null;

        const style: React.CSSProperties = win.isMaximized
          ? {
              position: 'fixed',
              top: '44px',
              left: '0px',
              width: '100vw',
              height: 'calc(100vh - 44px)',
              zIndex: win.zIndex,
            }
          : {
              position: 'fixed',
              top: `${win.position.y}px`,
              left: `${win.position.x}px`,
              width: `${win.size.width}px`,
              height: `${win.size.height}px`,
              zIndex: win.zIndex,
            };

        return (
          <div
            key={win.id}
            style={style}
            onMouseDown={() => onBringToFront(win.id)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ring-1 ring-white/10"
          >
            {/* Window Title Bar */}
            <div
              onMouseDown={(e) => handleStartDrag(e, win)}
              className="h-9 bg-slate-950/90 border-b border-slate-800 px-3 flex items-center justify-between cursor-move select-none shrink-0"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-200">
                {win.type === 'output' && <Terminal className="w-3.5 h-3.5 text-indigo-400" />}
                {win.type === 'preview' && <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                {win.type === 'editor' && <FileCode className="w-3.5 h-3.5 text-blue-400" />}
                <span className="font-semibold">{win.title}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 uppercase font-sans">
                  Pop-out Window
                </span>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                {/* Minimize Button */}
                <button
                  onClick={() => onUpdateWindow(win.id, { isMinimized: true })}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Minimize Window"
                >
                  <Minus className="w-3 h-3" />
                </button>

                {/* Maximize / Restore Button */}
                <button
                  onClick={() => onUpdateWindow(win.id, { isMaximized: !win.isMaximized })}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={win.isMaximized ? 'Restore Size' : 'Maximize Window'}
                >
                  {win.isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>

                {/* Dock back / Close Button */}
                <button
                  onClick={() => onCloseWindow(win.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Close and Dock back to workspace"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Window Content Body */}
            <div className="flex-1 overflow-hidden relative bg-slate-950/70">
              {win.type === 'editor' && targetFile && (
                <div className="h-full w-full">
                  <CodeEditor
                    key={targetFile.id}
                    file={targetFile}
                    files={files}
                    workspaceName="cloudide-workspace"
                    onChangeContent={(content) => onChangeContent(targetFile.id, content)}
                    onRun={onRunCode}
                    onAskAi={(code) => onAskAi(code)}
                    settings={editorSettings}
                  />
                </div>
              )}

              {win.type === 'output' && (
                <div className="h-full w-full flex flex-col">
                  <OutputConsole
                    activeTab={activeConsoleTab}
                    onChangeTab={onChangeConsoleTab}
                    executionResult={executionResult}
                    onClear={onClearConsole}
                    isRunning={isRunning}
                    onRunRepl={() => {}}
                    stdinInput={stdinInput}
                    onChangeStdin={onChangeStdin}
                    testCases={testCases}
                    onRunTestCases={onRunTestCases}
                    onAddTestCase={onAddTestCase}
                    onUpdateTestCase={onUpdateTestCase}
                    onDeleteTestCase={onDeleteTestCase}
                    activeLanguage={targetFile?.language || 'python'}
                    activeCode={targetFile?.content}
                    onExecuteApiRequest={onExecuteApiRequest}
                    terminalTheme={editorSettings.terminalTheme}
                    customPreviewContent={
                      <LivePreview
                        files={files}
                        activeFile={targetFile || files[0]}
                        onIframeLog={onIframeLog}
                      />
                    }
                  />
                </div>
              )}

              {win.type === 'preview' && (
                <div className="h-full w-full">
                  <LivePreview
                    files={files}
                    activeFile={targetFile || files[0]}
                    onIframeLog={onIframeLog}
                  />
                </div>
              )}
            </div>

            {/* Resizer Handle at bottom-right corner */}
            {!win.isMaximized && (
              <div
                onMouseDown={(e) => handleStartResize(e, win)}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-20 group"
                title="Resize window"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-500 group-hover:border-indigo-400 transition-colors" />
              </div>
            )}
          </div>
        );
      })}

      {/* Minimized Windows Dock at Bottom Right */}
      {minimizedWindows.length > 0 && (
        <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 bg-slate-900/90 border border-slate-750 p-1.5 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Windows ({minimizedWindows.length})</span>
          {minimizedWindows.map((win) => (
            <button
              key={win.id}
              onClick={() => {
                onUpdateWindow(win.id, { isMinimized: false });
                onBringToFront(win.id);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title={`Restore ${win.title}`}
            >
              {win.type === 'output' && <Terminal className="w-3 h-3 text-indigo-300" />}
              {win.type === 'editor' && <FileCode className="w-3 h-3 text-blue-300" />}
              {win.type === 'preview' && <Eye className="w-3 h-3 text-emerald-300" />}
              <span className="truncate max-w-[100px]">{win.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};
