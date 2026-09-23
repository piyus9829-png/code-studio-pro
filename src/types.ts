export type Language = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'c'
  | 'cpp'
  | 'java'
  | 'kotlin'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'swift'
  | 'bash'
  | 'html' 
  | 'xml'
  | 'groovy'
  | 'css' 
  | 'json' 
  | 'sql' 
  | 'markdown';

export interface FileItem {
  id: string;
  name: string;
  language: Language;
  content: string;
  savedContent?: string; // Checkpoint baseline content
  lastCheckpointTime?: number; // Timestamp of saved checkpoint
  checkpointLabel?: string; // Checkpoint descriptor (e.g. 'Last Saved Checkpoint')
  isDiffActive?: boolean; // Whether Diff Viewer mode is active
  isFolder?: boolean;
  parentId?: string | null;
  isOpen?: boolean;
  isModified?: boolean;
  isReadOnly?: boolean;
}

export type DiffChangeType = 'added' | 'deleted' | 'modified' | 'unchanged';

export interface DiffCharChunk {
  type: 'same' | 'added' | 'deleted';
  text: string;
}

export interface DiffLine {
  type: DiffChangeType;
  oldLineNumber?: number;
  newLineNumber?: number;
  oldContent?: string;
  newContent?: string;
  charDiffs?: DiffCharChunk[];
}

export interface DiffHunk {
  id: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  modifications: number;
  totalChanges: number;
}

export type DiffViewMode = 'split' | 'unified';

export interface ChartPlotData {
  type: 'line' | 'scatter' | 'bar' | 'histogram' | 'pie';
  title?: string;
  xlabel?: string;
  ylabel?: string;
  grid?: boolean;
  series: Array<{
    name?: string;
    x?: any[];
    y: number[];
    color?: string;
    type?: string;
  }>;
  labels?: string[];
  bins?: number;
}

export interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'table' | 'dir' | 'system' | 'stdin' | 'chart';
  args: any[];
  timestamp: number;
  location?: string;
  chartData?: ChartPlotData;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  status?: 'passed' | 'failed' | 'running' | 'untested';
  executionTimeMs?: number;
}

export interface SQLQueryPlanNode {
  operation: string;
  target?: string;
  cost?: number;
  estimatedRows?: number;
  actualRows?: number;
  condition?: string;
  details?: string;
  children?: SQLQueryPlanNode[];
}

export interface SQLQueryResult {
  id: string;
  query: string;
  columns: Array<{ name: string; type: string }>;
  rows: Array<Record<string, any>>;
  rowCount: number;
  affectedRows?: number;
  executionTimeMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  queryPlan?: SQLQueryPlanNode;
  startedAt?: string;
}

export interface ExecutionResult {
  logs: ConsoleLogEntry[];
  result?: any;
  error?: string | null;
  executionTimeMs: number;
  status: 'idle' | 'running' | 'success' | 'error';
  memoryUsedMb?: number;
  rawStdout?: string;
  rawStderr?: string;
  exitCode?: number | null;
  signal?: string | null;
  compilerOutput?: string;
  executionEngine?: string;
  language?: string;
  version?: string;
  affectedRows?: number;
  activeDatabase?: string;
  queryResults?: Array<{
    query: string;
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTimeMs: number;
  }>;
  sqlQueryResults?: SQLQueryResult[];
}

export interface SQLColumnSchema {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  foreignTable?: string;
  foreignColumn?: string;
  nullable?: boolean;
  defaultVal?: any;
}

export interface SQLTableSchema {
  name: string;
  columns: SQLColumnSchema[];
  rowCount: number;
  rows: Array<Record<string, any>>;
}

export interface SQLDatabaseSchema {
  name: string;
  description?: string;
  tables: Record<string, SQLTableSchema>;
}

export type ConsoleTab = 'console' | 'preview' | 'table' | 'stdin' | 'testcases' | 'charts' | 'database' | 'api-tester';

export type EditorTheme = 
  | 'vs-dark' 
  | 'tokyo-night' 
  | 'one-dark' 
  | 'monokai' 
  | 'dracula' 
  | 'synthwave'
  | 'github-light';

export type TerminalTheme = 
  | 'default-dark' 
  | 'solarized-dark' 
  | 'solarized-light' 
  | 'gruvbox-dark' 
  | 'gruvbox-light' 
  | 'nord' 
  | 'dracula' 
  | 'monokai' 
  | 'matrix-green';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'C / C++' | 'JavaScript' | 'TypeScript' | 'React' | 'Python' | 'Java' | 'FastAPI' | 'Django' | 'Web/HTML' | 'Data & SQL' | 'Competitive' | 'Mobile & Frameworks';
  icon: string;
  files: Array<{
    name: string;
    language: Language;
    content: string;
  }>;
  activeFileName: string;
  defaultTab: ConsoleTab;
  defaultStdin?: string;
  testCases?: TestCase[];
}

export interface AutocompleteSuggestion {
  label: string;
  insertText: string;
  detail: string;
  kind: 'keyword' | 'function' | 'snippet' | 'variable' | 'property' | 'type';
}

export interface ConsoleSettings {
  fontSize: number;
  lineWrap: boolean;
  showTimestamps: boolean;
  autoScroll: boolean;
  clearOnRun: boolean;
  theme?: TerminalTheme;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary?: string;
  framework?: 'fastapi' | 'django' | 'express' | 'flask';
  params?: Array<{ name: string; in: 'path' | 'query' | 'header'; type: string; required?: boolean }>;
  requestBodySample?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  timeMs: number;
  headers: Record<string, string>;
  body: any;
  rawText: string;
  isError?: boolean;
}

export interface CollaboratorUser {
  id: string;
  name: string;
  color: string;
  avatarColor: string;
  initials: string;
  line: number; // 1-indexed line
  col: number; // 0-indexed column
  selectionEnd?: { line: number; col: number } | null;
  status: 'active' | 'typing' | 'idle' | 'navigating' | 'selecting';
  activityMessage?: string;
  fileId?: string;
  lastActive: number;
}

export interface CodeLensReferenceLocation {
  fileId?: string;
  fileName?: string;
  line: number;
  col: number;
  lineContent: string;
}

export interface CodeLensItem {
  id: string;
  symbolName: string;
  kind: 'function' | 'class' | 'method' | 'struct' | 'interface' | 'endpoint' | 'test' | 'query';
  line: number; // 1-indexed line number where the declaration starts
  col?: number;
  signature?: string;
  paramSummary?: string;
  referenceCount: number;
  referenceLocations: CodeLensReferenceLocation[];
  canRun?: boolean;
  runLabel?: string;
  complexity?: string;
  author?: string;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autoCloseBrackets: boolean;
  autoCloseQuotes: boolean;
  autoComma: boolean;
  autoSemicolon: boolean;
  bracketPairColorization: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  collaborativeCursors?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number; // debounce delay in milliseconds (e.g. 1000)
  codeLens?: boolean; // Show CodeLens above functions and classes
  theme: EditorTheme;
  terminalTheme?: TerminalTheme;
  fontLigatures: boolean;
  fontFamily?: 'jetbrains-mono' | 'fira-code' | 'system-mono' | string;
}

export type EditorSplitDirection = 'none' | 'horizontal' | 'vertical';

export interface DetachedWindow {
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
