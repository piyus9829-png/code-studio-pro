import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudCheck, Check, RotateCw, AlertCircle, Trash2, HardDrive, Clock } from 'lucide-react';
import { formatTimeAgo, WORKSPACE_STORAGE_KEY } from '../utils/workspaceStorage';

interface AutoSaveIndicatorProps {
  lastSaved: number;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  onManualSave: () => void;
  onResetWorkspace?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  autoSaveEnabled,
  onToggleAutoSave,
  onManualSave,
  onResetWorkspace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeAgoStr, setTimeAgoStr] = useState(() => formatTimeAgo(lastSaved));
  const popoverRef = useRef<HTMLDivElement>(null);

  // Periodic ticker to update "Xs ago" display
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgoStr(formatTimeAgo(lastSaved));
    }, 2000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  // Outside click listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  // Compute storage size in localStorage
  const getStorageSize = () => {
    try {
      const data = localStorage.getItem(WORKSPACE_STORAGE_KEY) || '';
      const bytes = new Blob([data]).size;
      if (bytes < 1024) return `${bytes} B`;
      return `${(bytes / 1024).toFixed(1)} KB`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-sans transition-all cursor-pointer select-none ${
          isSaving
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : hasUnsavedChanges
            ? 'bg-slate-900 border-amber-500/40 text-amber-200 hover:bg-slate-800'
            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        title={`Auto-Save Status: ${autoSaveEnabled ? (isSaving ? 'Saving...' : hasUnsavedChanges ? 'Pending auto-save...' : `Saved (${timeAgoStr})`) : 'Auto-save disabled'}`}
      >
        {isSaving ? (
          <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
        ) : hasUnsavedChanges ? (
          <Cloud className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}

        <span className="hidden xl:inline text-[11px] font-medium">
          {isSaving ? (
            'Saving...'
          ) : hasUnsavedChanges ? (
            'Saving in 1s...'
          ) : (
            `Saved ${timeAgoStr}`
          )}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden font-sans text-xs animate-fade-in divide-y divide-slate-800">
          {/* Header */}
          <div className="p-3 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xs">Local Storage Auto-Save</h4>
                <p className="text-[10px] text-slate-400">Protects against browser refresh & crashes</p>
              </div>
            </div>
          </div>

          {/* Details & Status */}
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last Saved:
              </span>
              <span className="font-mono text-slate-200">{timeAgoStr}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                Backup Size:
              </span>
              <span className="font-mono text-slate-200">{getStorageSize()}</span>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-300 font-medium text-[11px]">Periodic Auto-Save</span>
              <button
                onClick={() => onToggleAutoSave(!autoSaveEnabled)}
                className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  autoSaveEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoSaveEnabled ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-2.5 bg-slate-950/80 flex items-center justify-between gap-2">
            {onResetWorkspace && (
              <button
                onClick={() => {
                  onResetWorkspace();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-900/50 text-[11px] transition-colors cursor-pointer"
                title="Clear saved local backup and reload starter template"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => {
                onManualSave();
                setIsOpen(false);
              }}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer shadow-sm"
              title="Save all open files to localStorage immediately"
            >
              <Check className="w-3 h-3" />
              <span>Save Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
