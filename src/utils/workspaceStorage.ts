import { FileItem, TestCase, ConsoleTab, EditorSplitDirection } from '../types';

export const WORKSPACE_STORAGE_KEY = 'cloudide_workspace_backup';

export interface SavedWorkspace {
  version: number;
  lastSaved: number;
  files: FileItem[];
  pane1ActiveFileId: string;
  pane1OpenFileIds: string[];
  pane2ActiveFileId?: string;
  pane2OpenFileIds?: string[];
  focusedPane?: 'pane-1' | 'pane-2';
  editorSplit?: EditorSplitDirection;
  stdinInput?: string;
  testCases?: TestCase[];
  activeTab?: ConsoleTab;
}

export function loadSavedWorkspace(): SavedWorkspace | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (data && Array.isArray(data.files) && data.files.length > 0) {
      return data as SavedWorkspace;
    }
  } catch (err) {
    console.warn('Failed to load saved workspace from localStorage:', err);
  }
  return null;
}

export function saveWorkspaceToStorage(workspace: SavedWorkspace): boolean {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch (err) {
    console.error('Failed to auto-save workspace to localStorage:', err);
    return false;
  }
}

export function clearSavedWorkspace(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear saved workspace:', err);
  }
}

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Never';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 3) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}
