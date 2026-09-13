import React, { useState, useMemo } from 'react';
import { SQLQueryResult, SQLQueryPlanNode } from '../types';
import { 
  Table, 
  Terminal, 
  GitCommit, 
  BarChart3, 
  Search, 
  Download, 
  Copy, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  Maximize2, 
  FileSpreadsheet, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database,
  Layers,
  Sparkles,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { ChartPlotViewer } from './ChartPlotViewer';

interface VSCodeSQLViewerProps {
  queryResults: SQLQueryResult[];
  rawLogs?: Array<{ type: string; args: any[]; timestamp: number }>;
  activeDatabase?: string;
  totalExecutionTimeMs?: number;
  affectedRows?: number;
  onOpenExplorer?: () => void;
  onInsertCodeSnippet?: (snippet: string) => void;
}

export const VSCodeSQLViewer: React.FC<VSCodeSQLViewerProps> = ({
  queryResults = [],
  rawLogs = [],
  activeDatabase = 'ecommerce_db',
  totalExecutionTimeMs = 0,
  affectedRows = 0,
  onOpenExplorer,
  onInsertCodeSnippet,
}) => {
  const [selectedResultIdx, setSelectedResultIdx] = useState<number>(0);
  const [activeViewTab, setActiveViewTab] = useState<'grid' | 'messages' | 'plan' | 'chart'>('grid');
  
  // Table search, sorting and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Cell Inspector selection
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string; value: any } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Current active query result
  const currentResult: SQLQueryResult | undefined = queryResults[selectedResultIdx] || queryResults[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Filter and Sort rows
  const filteredAndSortedRows = useMemo(() => {
    if (!currentResult || !currentResult.rows) return [];
    let rows = [...currentResult.rows];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(row => 
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc' 
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [currentResult, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalRows = filteredAndSortedRows.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalRows / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return filteredAndSortedRows;
    const start = (page - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, page, pageSize]);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const cols = currentResult.columns.map(c => c.name);
    const headerRow = cols.join(',');
    const dataRows = currentResult.rows.map(row => 
      cols.map(c => {
        const val = row[c] === null || row[c] === undefined ? '' : String(row[c]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${selectedResultIdx + 1}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const jsonContent = JSON.stringify(currentResult.rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_result_${selectedResultIdx + 1}.json`;
    link.click();
    setShowExportMenu(false);
  };

  const handleExportSQLInserts = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const tableName = 'exported_table';
    const cols = currentResult.columns.map(c => c.name);
    const statements = currentResult.rows.map(row => {
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');
      return `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals});`;
    }).join('\n');

    handleCopy(statements, 'SQL Inserts copied');
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const cols = currentResult.columns.map(c => c.name);
    const header = `| ${cols.join(' | ')} |`;
    const separator = `| ${cols.map(() => '---').join(' | ')} |`;
    const rows = currentResult.rows.map(r => `| ${cols.map(c => String(r[c] ?? '')).join(' | ')} |`).join('\n');
    handleCopy(`${header}\n${separator}\n${rows}`, 'Markdown Table copied');
    setShowExportMenu(false);
  };

  // Generate chart data for visualization view
  const chartData = useMemo(() => {
    if (!currentResult || currentResult.rows.length === 0) return null;
    const cols = currentResult.columns;
    const numCols = cols.filter(c => c.type.includes('INT') || c.type.includes('DECIMAL') || c.type.includes('NUMERIC') || c.type.includes('FLOAT'));
    const labelCols = cols.filter(c => !numCols.includes(c));

    if (numCols.length === 0) return null;

    const labelColName = labelCols[0]?.name || cols[0].name;
    const labels = currentResult.rows.map(r => String(r[labelColName] ?? ''));
    
    const series = numCols.slice(0, 3).map((col, idx) => ({
      name: col.name,
      y: currentResult.rows.map(r => Number(r[col.name]) || 0),
      x: labels,
    }));

    return {
      type: 'bar' as const,
      title: `Query ${selectedResultIdx + 1} Visualization`,
      xlabel: labelColName,
      ylabel: numCols[0].name,
      grid: true,
      series,
      labels
    };
  }, [currentResult, selectedResultIdx]);

  if (queryResults.length === 0 && rawLogs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#1e1e1e] text-slate-400 font-sans select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#252526] border border-[#333333] flex items-center justify-center mb-4 shadow-xl">
          <Database className="w-8 h-8 text-[#007acc]" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No SQL Query Executed Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Execute queries using <kbd className="px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#3c3c3c] text-[#4fc1ff] font-mono text-[11px]">Run</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#3c3c3c] text-[#4fc1ff] font-mono text-[11px]">Ctrl+Enter</kbd> to inspect interactive result grids, message logs, and execution plans.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc] font-sans select-text overflow-hidden text-xs">
      {/* VS Code Top Query Result Tab Bar */}
      <div className="bg-[#252526] border-b border-[#333333] flex items-center justify-between px-2 shrink-0 select-none overflow-x-auto">
        <div className="flex items-center gap-1 py-1">
          {/* Query Result Tabs (Result 1, Result 2, ...) */}
          {queryResults.map((qr, idx) => {
            const isSelected = activeViewTab === 'grid' && selectedResultIdx === idx;
            return (
              <button
                key={qr.id || idx}
                onClick={() => {
                  setSelectedResultIdx(idx);
                  setActiveViewTab('grid');
                  setPage(1);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1e1e1e] text-[#ffffff] border-[#007acc] shadow-sm font-semibold'
                    : 'bg-[#2d2d2d]/60 text-[#969696] hover:text-[#cccccc] hover:bg-[#2d2d2d] border-transparent'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-[#4fc1ff]" />
                <span>Result {idx + 1}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#333333] text-[#4ec9b0] font-mono">
                  {qr.rowCount} {qr.rowCount === 1 ? 'row' : 'rows'}
                </span>
              </button>
            );
          })}

          {/* Messages Tab */}
          <button
            onClick={() => setActiveViewTab('messages')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              activeViewTab === 'messages'
                ? 'bg-[#1e1e1e] text-[#ffffff] border-[#007acc] shadow-sm font-semibold'
                : 'bg-[#2d2d2d]/60 text-[#969696] hover:text-[#cccccc] hover:bg-[#2d2d2d] border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#dcdcaa]" />
            <span>Messages</span>
            {rawLogs.filter(l => l.type === 'error').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#f48771]" />
            )}
          </button>

          {/* Query Plan / Explain Tab */}
          {queryResults.some(qr => qr.queryPlan) && (
            <button
              onClick={() => setActiveViewTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer border ${
                activeViewTab === 'plan'
                  ? 'bg-[#1e1e1e] text-[#ffffff] border-[#007acc] shadow-sm font-semibold'
                  : 'bg-[#2d2d2d]/60 text-[#969696] hover:text-[#cccccc] hover:bg-[#2d2d2d] border-transparent'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-[#c586c0]" />
              <span>Query Plan</span>
            </button>
          )}

          {/* Visualization Tab */}
          {chartData && (
            <button
              onClick={() => setActiveViewTab('chart')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition cursor-pointer border ${
                activeViewTab === 'chart'
                  ? 'bg-[#1e1e1e] text-[#ffffff] border-[#007acc] shadow-sm font-semibold'
                  : 'bg-[#2d2d2d]/60 text-[#969696] hover:text-[#cccccc] hover:bg-[#2d2d2d] border-transparent'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#9cdcfe]" />
              <span>Chart</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 py-1">
          {/* Notification Toast */}
          {copiedNotification && (
            <span className="flex items-center gap-1 text-[11px] text-[#4ec9b0] bg-[#2d2d2d] px-2 py-0.5 rounded border border-[#3c3c3c] animate-fade-in">
              <Check className="w-3 h-3" />
              <span>{copiedNotification}</span>
            </span>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#cccccc] hover:text-[#ffffff] transition border border-[#3c3c3c] cursor-pointer text-xs"
              title="Export Query Results"
            >
              <Download className="w-3.5 h-3.5 text-[#4fc1ff]" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#454545] rounded-md shadow-2xl py-1 z-50 animate-scale-in">
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#094771] hover:text-white text-[#cccccc] cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#4ec9b0]" />
                  <span>Save as CSV file</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#094771] hover:text-white text-[#cccccc] cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-[#ce9178]" />
                  <span>Save as JSON file</span>
                </button>
                <div className="my-1 border-t border-[#333333]" />
                <button
                  onClick={handleExportSQLInserts}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#094771] hover:text-white text-[#cccccc] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#4fc1ff]" />
                  <span>Copy as SQL INSERTs</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#094771] hover:text-white text-[#cccccc] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#c586c0]" />
                  <span>Copy as Markdown Table</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* VIEW 1: DATA GRID (VS Code Table) */}
        {activeViewTab === 'grid' && currentResult && (
          <div className="h-full flex flex-col">
            {/* Query Header & Filter Bar */}
            <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-3 py-1.5 flex items-center justify-between gap-3 shrink-0">
              {/* Query Snippet Preview */}
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                <span className="text-[11px] font-mono text-[#569cd6] shrink-0 font-semibold">SQL &gt;</span>
                <span 
                  className="text-[11px] font-mono text-[#d4d4d4] truncate select-all bg-[#252526] px-2 py-0.5 rounded border border-[#333333]"
                  title={currentResult.query}
                >
                  {currentResult.query}
                </span>
              </div>

              {/* In-Grid Search Filter */}
              <div className="relative w-48 shrink-0">
                <Search className="w-3 h-3 text-[#858585] absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-7 pr-6 py-1 bg-[#252526] border border-[#3c3c3c] rounded text-xs text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1.5 text-[#858585] hover:text-[#cccccc]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Page Size Switcher */}
              <div className="flex items-center gap-1 shrink-0 text-[#858585] text-[11px]">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-xs text-[#cccccc] focus:outline-none focus:border-[#007acc]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>All</option>
                </select>
              </div>
            </div>

            {/* VS Code Data Grid Table Container */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              <table className="w-full text-left font-mono border-collapse select-text">
                <thead className="sticky top-0 bg-[#252526] z-10 shadow-sm">
                  <tr className="border-b border-[#333333] text-[#cccccc]">
                    {/* Row Index Column */}
                    <th className="p-2 border-r border-[#333333] text-[#858585] text-center w-12 font-bold select-none bg-[#252526]">
                      #
                    </th>
                    {currentResult.columns.map((col) => {
                      const isSorted = sortColumn === col.name;
                      return (
                        <th
                          key={col.name}
                          onClick={() => handleSort(col.name)}
                          className="p-2 border-r border-[#333333] font-semibold text-xs text-[#cccccc] hover:bg-[#2d2d2d] cursor-pointer transition select-none group bg-[#252526]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#9cdcfe] font-medium">{col.name}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#1e1e1e] text-[#4ec9b0] border border-[#333333] uppercase">
                                {col.type || 'TEXT'}
                              </span>
                            </div>
                            <div className="text-[#858585]">
                              {isSorted ? (
                                sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#007acc]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#007acc]" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60" />
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, rIdx) => {
                      const absoluteRowIdx = pageSize === -1 ? rIdx : (page - 1) * pageSize + rIdx;
                      return (
                        <tr
                          key={rIdx}
                          className="hover:bg-[#2a2d2e] transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="p-2 border-r border-[#2d2d2d] text-[#858585] text-center select-none bg-[#252526]/40 group-hover:bg-[#2a2d2e]">
                            {absoluteRowIdx + 1}
                          </td>
                          {currentResult.columns.map((col) => {
                            const val = row[col.name];
                            const isCellSelected = selectedCell?.rowIdx === absoluteRowIdx && selectedCell?.colName === col.name;

                            return (
                              <td
                                key={col.name}
                                onClick={() => setSelectedCell({ rowIdx: absoluteRowIdx, colName: col.name, value: val })}
                                onDoubleClick={() => handleCopy(String(val ?? ''), 'Cell value copied')}
                                className={`p-2 border-r border-[#2d2d2d] max-w-xs truncate cursor-cell ${
                                  isCellSelected
                                    ? 'bg-[#094771]/60 outline outline-1 outline-[#007acc] text-white'
                                    : 'text-[#cccccc]'
                                }`}
                                title="Click to inspect, Double-click to copy"
                              >
                                {val === null || val === undefined ? (
                                  <span className="text-[#808080] italic">NULL</span>
                                ) : typeof val === 'number' ? (
                                  <span className="text-[#b5cea8]">{val}</span>
                                ) : typeof val === 'boolean' ? (
                                  <span className="text-[#569cd6] font-bold">{val ? 'TRUE' : 'FALSE'}</span>
                                ) : typeof val === 'object' ? (
                                  <span className="text-[#ce9178]">{JSON.stringify(val)}</span>
                                ) : (
                                  <span>{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={currentResult.columns.length + 1}
                        className="p-8 text-center text-[#858585]"
                      >
                        {searchTerm ? 'No rows match the search query.' : 'Query executed successfully with 0 rows returned.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="bg-[#252526] border-t border-[#333333] px-3 py-1.5 flex items-center justify-between shrink-0 select-none">
                <span className="text-[#858585] text-[11px]">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalRows)} of {totalRows} rows
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-2 py-0.5 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] disabled:opacity-40 disabled:hover:bg-[#2d2d2d] text-[#cccccc] text-xs transition"
                  >
                    &laquo; First
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-0.5 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] disabled:opacity-40 disabled:hover:bg-[#2d2d2d] text-[#cccccc] text-xs transition"
                  >
                    &lsaquo; Prev
                  </button>
                  <span className="px-2 text-xs text-[#cccccc] font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-0.5 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] disabled:opacity-40 disabled:hover:bg-[#2d2d2d] text-[#cccccc] text-xs transition"
                  >
                    Next &rsaquo;
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-2 py-0.5 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] disabled:opacity-40 disabled:hover:bg-[#2d2d2d] text-[#cccccc] text-xs transition"
                  >
                    Last &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MESSAGES / CONSOLE LOG */}
        {activeViewTab === 'messages' && (
          <div className="h-full overflow-y-auto p-4 bg-[#1e1e1e] font-mono text-xs text-[#cccccc] space-y-3">
            <div className="border-b border-[#333333] pb-2 flex items-center justify-between">
              <span className="text-[#858585] font-semibold uppercase tracking-wider text-[11px]">
                SQL Execution Messages Log
              </span>
              <span className="text-[#4ec9b0] text-[11px]">
                Database: <code className="text-[#9cdcfe]">{activeDatabase}</code>
              </span>
            </div>

            {/* Structured execution summaries for each query */}
            <div className="space-y-3">
              {queryResults.map((qr, idx) => (
                <div key={idx} className="bg-[#252526] border border-[#333333] rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[#858585] text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#4ec9b0] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4ec9b0]" />
                      <span>Statement {idx + 1} Succeeded</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{qr.executionTimeMs} ms</span>
                    </span>
                  </div>

                  <div className="bg-[#1e1e1e] p-2 rounded border border-[#333333] text-[#d4d4d4] font-mono overflow-x-auto">
                    {qr.query}
                  </div>

                  <div className="text-[11px] text-[#858585] flex items-center gap-3 pt-1">
                    <span>• {qr.rowCount} rows returned</span>
                    {qr.affectedRows !== undefined && <span>• {qr.affectedRows} rows affected</span>}
                    <span>• Columns: {qr.columns.map(c => c.name).join(', ')}</span>
                  </div>
                </div>
              ))}

              {/* Raw Console Logs */}
              {rawLogs.map((log, lIdx) => (
                <div key={lIdx} className="text-[#cccccc] pl-2 border-l-2 border-[#007acc] leading-relaxed">
                  {log.args.map((a, i) => (
                    <span key={i} className={log.type === 'error' ? 'text-[#f48771]' : log.type === 'warn' ? 'text-[#cca700]' : 'text-[#cccccc]'}>
                      {typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)}{' '}
                    </span>
                  ))}
                </div>
              ))}

              <div className="pt-2 text-[#858585] text-[11px] border-t border-[#333333]">
                Total execution time: {totalExecutionTimeMs} ms • Commands completed successfully.
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: QUERY EXECUTION PLAN (EXPLAIN) */}
        {activeViewTab === 'plan' && (
          <div className="h-full overflow-y-auto p-4 bg-[#1e1e1e]">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="border-b border-[#333333] pb-2">
                <h4 className="text-sm font-bold text-[#ffffff] flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#c586c0]" />
                  <span>Query Execution Plan (Explain Analyzer)</span>
                </h4>
                <p className="text-xs text-[#858585] mt-0.5">
                  Cost estimation, scan strategies, join trees, and relational algebra evaluation.
                </p>
              </div>

              {queryResults.filter(qr => qr.queryPlan).map((qr, qIdx) => (
                <div key={qIdx} className="bg-[#252526] border border-[#333333] rounded-xl p-4 shadow-xl">
                  <div className="text-xs font-mono text-[#9cdcfe] mb-3 pb-2 border-b border-[#333333] flex items-center justify-between">
                    <span>Query: {qr.query}</span>
                    <span className="text-[#4ec9b0] text-[11px]">{qr.executionTimeMs} ms</span>
                  </div>

                  {qr.queryPlan && <QueryPlanTreeNode node={qr.queryPlan} depth={0} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: CHART / VISUALIZATION */}
        {activeViewTab === 'chart' && chartData && (
          <div className="h-full overflow-y-auto p-4 bg-[#1e1e1e] flex flex-col items-center justify-center">
            <ChartPlotViewer plotData={chartData} />
          </div>
        )}
      </div>

      {/* VS Code Bottom Status Bar */}
      <div className="bg-[#007acc] text-[#ffffff] px-3 py-1 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span>Ready</span>
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 opacity-80" />
            <span>DB: {activeDatabase}</span>
          </span>
          {currentResult && (
            <span>
              {totalRows} {totalRows === 1 ? 'row' : 'rows'} retrieved in {currentResult.executionTimeMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {selectedCell && (
            <span className="bg-[#094771] px-2 py-0.2 rounded text-[10px] text-white truncate max-w-xs">
              Selected: [{selectedCell.colName}] = {String(selectedCell.value ?? 'NULL')}
            </span>
          )}
          {onOpenExplorer && (
            <button
              onClick={onOpenExplorer}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Schema &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Cell Detail Inspector Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#252526] border border-[#454545] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-[#1e1e1e] border-b border-[#333333] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#ffffff] flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#4fc1ff]" />
                <span>Cell Inspector: {selectedCell.colName} (Row #{selectedCell.rowIdx + 1})</span>
              </span>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[#858585] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#1e1e1e]/60">
              <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-3 font-mono text-xs text-[#cccccc] max-h-60 overflow-y-auto whitespace-pre-wrap break-all select-text">
                {selectedCell.value === null || selectedCell.value === undefined ? (
                  <span className="text-[#808080] italic">NULL</span>
                ) : typeof selectedCell.value === 'object' ? (
                  JSON.stringify(selectedCell.value, null, 2)
                ) : (
                  String(selectedCell.value)
                )}
              </div>
            </div>

            <div className="bg-[#252526] border-t border-[#333333] px-4 py-2.5 flex items-center justify-end gap-2">
              <button
                onClick={() => handleCopy(String(selectedCell.value ?? ''), 'Cell value copied')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#0062a3] text-white font-medium text-xs transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Value</span>
              </button>
              <button
                onClick={() => setSelectedCell(null)}
                className="px-3 py-1.5 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#cccccc] text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Visual Plan Node Renderer for SQL EXPLAIN
 */
const QueryPlanTreeNode: React.FC<{ node: SQLQueryPlanNode; depth: number }> = ({ node, depth }) => {
  const getBadgeColor = (op: string) => {
    if (op.includes('Scan')) return 'bg-[#ce9178]/20 text-[#ce9178] border-[#ce9178]/40';
    if (op.includes('Join')) return 'bg-[#4fc1ff]/20 text-[#4fc1ff] border-[#4fc1ff]/40';
    if (op.includes('Aggregate') || op.includes('Group')) return 'bg-[#c586c0]/20 text-[#c586c0] border-[#c586c0]/40';
    if (op.includes('Sort')) return 'bg-[#dcdcaa]/20 text-[#dcdcaa] border-[#dcdcaa]/40';
    return 'bg-[#4ec9b0]/20 text-[#4ec9b0] border-[#4ec9b0]/40';
  };

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-6 pl-4 border-l border-[#333333]' : ''}`}>
      <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#1e1e1e] border border-[#333333] hover:border-[#007acc] transition">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getBadgeColor(node.operation)}`}>
          {node.operation}
        </span>

        <div className="flex-1 min-w-0 font-mono text-xs">
          <div className="flex items-center justify-between text-[#cccccc]">
            <span className="font-semibold text-[#9cdcfe]">{node.target || node.operation}</span>
            {node.cost !== undefined && (
              <span className="text-[11px] text-[#858585]">
                Cost: <span className="text-[#b5cea8]">{node.cost}</span> | Est Rows: <span className="text-[#b5cea8]">{node.estimatedRows ?? 1}</span>
              </span>
            )}
          </div>
          {node.condition && (
            <div className="text-[11px] text-[#ce9178] mt-0.5 truncate">
              Filter: {node.condition}
            </div>
          )}
          {node.details && (
            <div className="text-[11px] text-[#858585] mt-0.5">
              {node.details}
            </div>
          )}
        </div>
      </div>

      {node.children && node.children.map((child, i) => (
        <QueryPlanTreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};
