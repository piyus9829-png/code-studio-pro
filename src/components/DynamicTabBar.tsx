import React, { useState, useRef, useEffect } from 'react';
import { FileItem, Language } from '../types';
import { 
  X, 
  Plus, 
  SplitSquareHorizontal, 
  SplitSquareVertical, 
  ExternalLink, 
  Pin, 
  MoreHorizontal,
  FileCode,
  Check,
  FilePlus,
  Columns,
  Maximize2,
  GitCompare,
  RotateCcw,
  BookmarkCheck
} from 'lucide-react';

interface DynamicTabBarProps {
  paneId: 'pane-1' | 'pane-2';
  files: FileItem[];
  openFileIds: string[];
  activeFileId: string;
  pinnedFileIds?: string[];
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onCloseOtherTabs?: (fileId: string) => void;
  onCloseAllTabs?: () => void;
  onTogglePinTab?: (fileId: string) => void;
  onToggleDiffMode?: (fileId: string) => void;
  onRestoreCheckpoint?: (fileId: string) => void;
  onUpdateCheckpoint?: (fileId: string) => void;
  onSplitEditor?: (direction: 'horizontal' | 'vertical') => void;
  onCloseSplit?: () => void;
  isSplitActive?: boolean;
  splitDirection?: 'horizontal' | 'vertical';
  onPopOutFile?: (fileId: string) => void;
  onCreateNewFile: (name: string, language: Language) => void;
  onOpenFileInTab: (fileId: string) => void;
}

export const DynamicTabBar: React.FC<DynamicTabBarProps> = ({
  paneId,
  files,
  openFileIds,
  activeFileId,
  pinnedFileIds = [],
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onTogglePinTab,
  onToggleDiffMode,
  onRestoreCheckpoint,
  onUpdateCheckpoint,
  onSplitEditor,
  onCloseSplit,
  isSplitActive = false,
  splitDirection = 'horizontal',
  onPopOutFile,
  onCreateNewFile,
  onOpenFileInTab,
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLanguageColor = (lang: Language) => {
    switch (lang) {
      case 'python': return 'text-amber-400';
      case 'typescript': return 'text-blue-400';
      case 'javascript': return 'text-yellow-400';
      case 'cpp': return 'text-blue-300';
      case 'c': return 'text-cyan-300';
      case 'java': return 'text-rose-400';
      case 'html': return 'text-orange-400';
      case 'css': return 'text-sky-400';
      case 'sql': return 'text-emerald-400';
      case 'json': return 'text-amber-300';
      default: return 'text-slate-400';
    }
  };

  const handleTabContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fileId,
    });
  };

  const unpinnedIds = openFileIds.filter(id => !pinnedFileIds.includes(id));
  const pinnedIds = openFileIds.filter(id => pinnedFileIds.includes(id));
  const orderedIds = [...pinnedIds, ...unpinnedIds];

  const unopenedFiles = files.filter(f => !openFileIds.includes(f.id));

  return (
    <div className="h-9 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-1.5 select-none shrink-0 relative overflow-hidden backdrop-blur-sm">
      {/* Scrollable Tab List */}
      <div 
        ref={tabContainerRef}
        className="flex items-center space-x-1 overflow-x-auto scrollbar-none h-full py-1 pr-2 max-w-full flex-1"
      >
        {orderedIds.map((fileId) => {
          const file = files.find((f) => f.id === fileId);
          if (!file) return null;
          const isActive = file.id === activeFileId;
          const isPinned = pinnedFileIds.includes(file.id);

          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              onContextMenu={(e) => handleTabContextMenu(e, file.id)}
              className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-t-md text-xs font-mono font-medium cursor-pointer border-t-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-950 text-slate-100 border-indigo-500 shadow-sm'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
              }`}
              title={`${file.name} (${file.language}) - Right click for options`}
            >
              {isPinned && <Pin className="w-3 h-3 text-indigo-400 rotate-45 shrink-0" />}
              <FileCode className={`w-3.5 h-3.5 ${getLanguageColor(file.language)} shrink-0`} />
              
              <span className="truncate max-w-[130px]">{file.name}</span>

              {/* Diff Mode Badge on Tab */}
              {file.isDiffActive && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                  DIFF
                </span>
              )}

              {/* Modified Dot Indicator */}
              {file.isModified && !file.isDiffActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" title="Unsaved changes" />
              )}

              {/* Tab Close Button */}
              {!isPinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 cursor-pointer"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Plus / New Tab & Quick Open Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsNewMenuOpen(prev => !prev)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-0.5 cursor-pointer flex items-center gap-0.5"
            title="New File Tab or Open File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {isNewMenuOpen && (
            <div
              ref={menuRef}
              className="absolute left-0 top-full mt-1 w-56 bg-slate-900 border border-slate-750 rounded-lg shadow-2xl z-50 p-1 text-xs divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Quick Create
                </div>
                <button
                  onClick={() => {
                    onCreateNewFile(`script_${files.length + 1}.py`, 'python');
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Python File (.py)</span>
                </button>
                <button
                  onClick={() => {
                    onCreateNewFile(`service_${files.length + 1}.ts`, 'typescript');
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>TypeScript File (.ts)</span>
                </button>
                <button
                  onClick={() => {
                    onCreateNewFile(`index_${files.length + 1}.html`, 'html');
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-orange-400" />
                  <span>HTML File (.html)</span>
                </button>
                <button
                  onClick={() => {
                    onCreateNewFile(`main_${files.length + 1}.cpp`, 'cpp');
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 flex items-center gap-2 cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-blue-300" />
                  <span>C++ File (.cpp)</span>
                </button>
              </div>

              {unopenedFiles.length > 0 && (
                <div className="py-1">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Open Existing File
                  </div>
                  {unopenedFiles.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onOpenFileInTab(f.id);
                        setIsNewMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{f.name}</span>
                      <span className={`text-[10px] ${getLanguageColor(f.language)}`}>{f.language}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Split Editor, Detach / Pop-out Window */}
      <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-800/80">
        {/* Split Right (Horizontal) Button */}
        {onSplitEditor && (
          <button
            onClick={() => onSplitEditor('horizontal')}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
              isSplitActive && splitDirection === 'horizontal'
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Editor Right (Side-by-Side)"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Split Down (Vertical) Button */}
        {onSplitEditor && (
          <button
            onClick={() => onSplitEditor('vertical')}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
              isSplitActive && splitDirection === 'vertical'
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Editor Down (Stacked)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Close Split (if split active) */}
        {isSplitActive && onCloseSplit && (
          <button
            onClick={onCloseSplit}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 transition-colors cursor-pointer"
            title="Close this split pane"
          >
            Close Split
          </button>
        )}

        {/* Pop-out Active Tab into Floating Window */}
        {onPopOutFile && activeFileId && (
          <button
            onClick={() => onPopOutFile(activeFileId)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title="Pop-out File into Detached Floating Window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: 32, left: Math.min(contextMenu.x, window.innerWidth - 240) }}
          className="fixed bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 p-1.5 text-xs w-56 animate-in fade-in zoom-in-95 duration-100 text-slate-200 divide-y divide-slate-800/80 select-none"
        >
          {/* Diff Viewer Toggle Switch */}
          {onToggleDiffMode && (() => {
            const currentTabFile = files.find(f => f.id === contextMenu.fileId);
            const isDiffOn = currentTabFile?.isDiffActive || false;
            return (
              <div className="pb-1.5">
                <div
                  onClick={() => {
                    onToggleDiffMode(contextMenu.fileId);
                    setContextMenu(null);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${isDiffOn ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                      <GitCompare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[11px] text-slate-100">
                        Diff Viewer
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isDiffOn ? 'Active' : 'Compare Saved'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch Component */}
                  <div
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isDiffOn ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isDiffOn ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="py-1">
            {onTogglePinTab && (
              <button
                onClick={() => {
                  onTogglePinTab(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{pinnedFileIds.includes(contextMenu.fileId) ? 'Unpin Tab' : 'Pin Tab'}</span>
              </button>
            )}

            {onUpdateCheckpoint && (
              <button
                onClick={() => {
                  onUpdateCheckpoint(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-300 flex items-center gap-2 cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save New Checkpoint</span>
              </button>
            )}

            {onRestoreCheckpoint && (
              <button
                onClick={() => {
                  onRestoreCheckpoint(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Restore to Checkpoint</span>
              </button>
            )}

            {onPopOutFile && (
              <button
                onClick={() => {
                  onPopOutFile(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Detach to Window</span>
              </button>
            )}

            {onSplitEditor && (
              <button
                onClick={() => {
                  onSplitEditor('horizontal');
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Split to Side</span>
              </button>
            )}
          </div>

          <div className="pt-1">
            {onCloseTab && (
              <button
                onClick={() => {
                  onCloseTab(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Close</span>
              </button>
            )}

            {onCloseOtherTabs && (
              <button
                onClick={() => {
                  onCloseOtherTabs(contextMenu.fileId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5 text-slate-400" />
                <span>Close Other Tabs</span>
              </button>
            )}

            {onCloseAllTabs && (
              <button
                onClick={() => {
                  onCloseAllTabs();
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Close All Tabs</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
