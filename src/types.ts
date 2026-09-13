export type Language = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'c'
  | 'cpp'
  | 'html' 
  | 'css' 
  | 'json' 
  | 'sql' 
  | 'markdown';

export interface FileItem {
  id: string;
  name: string;
  language: Language;
  content: string;
  isFolder?: boolean;
  parentId?: string | null;
  isOpen?: boolean;
  isModified?: boolean;
  isReadOnly?: boolean;
}

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

export type ConsoleTab = 'console' | 'preview' | 'table' | 'stdin' | 'testcases' | 'charts' | 'database';

export type EditorTheme = 
  | 'vs-dark' 
  | 'tokyo-night' 
  | 'one-dark' 
  | 'monokai' 
  | 'dracula' 
  | 'synthwave'
  | 'github-light';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'C / C++' | 'JavaScript' | 'TypeScript' | 'React' | 'Python' | 'Web/HTML' | 'Data & SQL' | 'Competitive';
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
  theme: EditorTheme;
}
