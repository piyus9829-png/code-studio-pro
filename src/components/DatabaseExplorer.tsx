import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table as TableIcon, 
  Key, 
  Search, 
  Download, 
  RefreshCw, 
  Code2, 
  Copy, 
  Check, 
  Columns, 
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  DatabaseZap,
  Sparkles
} from 'lucide-react';
import { SQLDatabaseSchema, SQLTableSchema } from '../types';
import { getAllDatabases, getActiveDatabase, setActiveDatabaseName, resetAllDatabases } from '../utils/executor';

interface DatabaseExplorerProps {
  onInsertCodeSnippet?: (code: string) => void;
  onSelectDatabase?: (dbName: string) => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  onInsertCodeSnippet,
  onSelectDatabase,
}) => {
  const [databases, setDatabases] = useState<Record<string, SQLDatabaseSchema>>({});
  const [activeDbName, setActiveDbName] = useState<string>('ecommerce_db');
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'data' | 'schema'>('data');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const refreshData = () => {
    const all = getAllDatabases();
    setDatabases(all);
    const active = getActiveDatabase();
    setActiveDbName(active.name);
    const tables = Object.keys(active.tables);
    if (!selectedTableName || !active.tables[selectedTableName]) {
      setSelectedTableName(tables[0] || '');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currentDb: SQLDatabaseSchema | undefined = databases[activeDbName] || getActiveDatabase();
  const currentTable: SQLTableSchema | undefined = currentDb?.tables?.[selectedTableName];

  const handleSwitchDb = (dbName: string) => {
    setActiveDatabaseName(dbName);
    setActiveDbName(dbName);
    const updated = getAllDatabases();
    setDatabases(updated);
    const tables = Object.keys(updated[dbName]?.tables || {});
    setSelectedTableName(tables[0] || '');
    setPage(1);
    if (onSelectDatabase) {
      onSelectDatabase(dbName);
    }
  };

  const handleReset = () => {
    resetAllDatabases();
    refreshData();
  };

  const handleExportCSV = () => {
    if (!currentTable || currentTable.rows.length === 0) return;
    const headers = currentTable.columns.map(c => c.name).join(',');
    const rows = currentTable.rows.map(r => 
      currentTable.columns.map(c => {
        const val = r[c.name];
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val ?? '';
      }).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeDbName}_${selectedTableName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!currentTable) return;
    const jsonStr = JSON.stringify(currentTable.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeDbName}_${selectedTableName}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateQuery = (queryType: 'select' | 'join' | 'insert') => {
    if (!currentTable) return;
    let snippet = '';
    if (queryType === 'select') {
      snippet = `USE ${activeDbName};\n\nSELECT *\nFROM ${selectedTableName}\nLIMIT 20;\n`;
    } else if (queryType === 'join') {
      const fkCol = currentTable.columns.find(c => c.isForeign && c.foreignTable);
      if (fkCol && fkCol.foreignTable) {
        snippet = `USE ${activeDbName};\n\nSELECT *\nFROM ${selectedTableName} t1\nINNER JOIN ${fkCol.foreignTable} t2 ON t1.${fkCol.name} = t2.${fkCol.foreignColumn || 'id'}\nLIMIT 20;\n`;
      } else {
        snippet = `USE ${activeDbName};\n\nSELECT *\nFROM ${selectedTableName}\nWHERE id > 0\nORDER BY id DESC\nLIMIT 10;\n`;
      }
    } else if (queryType === 'insert') {
      const colNames = currentTable.columns.map(c => c.name).join(', ');
      const valHolders = currentTable.columns.map(c => c.type.includes('INT') ? '999' : "'sample'").join(', ');
      snippet = `USE ${activeDbName};\n\nINSERT INTO ${selectedTableName} (${colNames})\nVALUES (${valHolders});\n`;
    }

    if (onInsertCodeSnippet) {
      onInsertCodeSnippet(snippet);
    } else {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter & Sort table rows
  let filteredRows = currentTable ? [...currentTable.rows] : [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredRows = filteredRows.filter(r => 
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  if (sortCol) {
    filteredRows.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const tablesList: SQLTableSchema[] = currentDb ? (Object.values(currentDb.tables) as SQLTableSchema[]) : [];
  const totalDatabaseRows = tablesList.reduce((acc, t) => acc + t.rows.length, 0);
  const totalDatabaseTables = tablesList.length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Bar: Database Selector & Stats */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Database:</span>
              <select
                value={activeDbName}
                onChange={(e) => handleSwitchDb(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-indigo-300 text-xs font-bold rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Object.keys(databases).map(db => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Database Meta Badges */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
            {totalDatabaseTables} Tables
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-400">
            {totalDatabaseRows} Total Rows
          </span>
          <button
            onClick={handleReset}
            title="Reset Database to Default Seed"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reseed</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Tables Tree */}
        <div className="w-56 bg-slate-900/60 border-r border-slate-800 flex flex-col">
          <div className="p-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
            <span>Tables Schema</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{Object.keys(currentDb?.tables || {}).length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tablesList.map(tbl => {
              const isSelected = tbl.name === selectedTableName;
              return (
                <button
                  key={tbl.name}
                  onClick={() => {
                    setSelectedTableName(tbl.name);
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{tbl.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-400 font-mono">
                    {tbl.rows.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="p-2.5 border-t border-slate-800/80 text-[11px] text-slate-500 bg-slate-950/40">
            <p className="leading-tight">{currentDb?.description || 'Active SQL Database'}</p>
          </div>
        </div>

        {/* Right Content Area: Table Inspector & Data Grid */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {currentTable ? (
            <>
              {/* Header with Table name, Tabs, Search & Action Buttons */}
              <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-slate-200">{currentTable.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">({currentTable.rows.length} rows, {currentTable.columns.length} columns)</span>
                  </div>

                  {/* Tabs: Data vs Schema */}
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        activeTab === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Table Data
                    </button>
                    <button
                      onClick={() => setActiveTab('schema')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        activeTab === 'schema' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Schema & Types
                    </button>
                  </div>
                </div>

                {/* Query Snippet & Export Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerateQuery('select')}
                    title="Generate SELECT Query into Editor"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Query Table</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    title="Export as CSV file"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    title="Export as JSON"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Data View */}
              {activeTab === 'data' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-2.5 bg-slate-900/20 border-b border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder={`Search in ${currentTable.name}...`}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="text-xs text-slate-400">
                      Showing {paginatedRows.length} of {filteredRows.length} records
                    </div>
                  </div>

                  {/* Table Grid */}
                  <div className="flex-1 overflow-auto">
                    {paginatedRows.length > 0 ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 sticky top-0 z-10 border-b border-slate-800">
                            {currentTable.columns.map(col => (
                              <th
                                key={col.name}
                                onClick={() => {
                                  if (sortCol === col.name) {
                                    setSortAsc(!sortAsc);
                                  } else {
                                    setSortCol(col.name);
                                    setSortAsc(true);
                                  }
                                }}
                                className="px-3 py-2 text-slate-300 font-semibold cursor-pointer hover:bg-slate-800 transition whitespace-nowrap"
                              >
                                <div className="flex items-center gap-1.5">
                                  {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                                  <span>{col.name}</span>
                                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {paginatedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-950/20 transition">
                              {currentTable.columns.map(col => {
                                const val = row[col.name];
                                const isNull = val === null || val === undefined;
                                const isNum = typeof val === 'number';
                                return (
                                  <td key={col.name} className="px-3 py-1.5 whitespace-nowrap">
                                    {isNull ? (
                                      <span className="text-slate-600 italic">NULL</span>
                                    ) : isNum ? (
                                      <span className="text-cyan-300">{val}</span>
                                    ) : (
                                      <span className="text-slate-200">{String(val)}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                        <Search className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-xs">No records found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Bar */}
                  {totalPages > 1 && (
                    <div className="p-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
                      <div>
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex gap-1">
                        <button
                          disabled={page === 1}
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          disabled={page === totalPages}
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schema View */}
              {activeTab === 'schema' && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold">
                          <th className="px-4 py-2.5">Column</th>
                          <th className="px-4 py-2.5">Data Type</th>
                          <th className="px-4 py-2.5">Constraint</th>
                          <th className="px-4 py-2.5">Nullable</th>
                          <th className="px-4 py-2.5">Relationships</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                        {currentTable.columns.map(col => (
                          <tr key={col.name} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-2.5 font-bold text-indigo-300 flex items-center gap-1.5">
                              {col.isPrimary && <Key className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{col.name}</span>
                            </td>
                            <td className="px-4 py-2.5 text-emerald-400">{col.type}</td>
                            <td className="px-4 py-2.5">
                              {col.isPrimary ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                                  PRIMARY KEY
                                </span>
                              ) : col.isForeign ? (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                                  FOREIGN KEY
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400">
                              {col.nullable ? 'YES' : 'NO'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                              {col.foreignTable ? (
                                <span className="text-indigo-400">
                                  → {col.foreignTable}.{col.foreignColumn || 'id'}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Schema Quick DDL Generator */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300">Generated DDL Specification</span>
                      <button
                        onClick={() => {
                          const ddl = `CREATE TABLE ${currentTable.name} (\n` + 
                            currentTable.columns.map(c => `  ${c.name} ${c.type}${c.isPrimary ? ' PRIMARY KEY' : ''}`).join(',\n') + 
                            `\n);`;
                          navigator.clipboard.writeText(ddl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy DDL'}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
{`CREATE TABLE ${currentTable.name} (
${currentTable.columns.map(c => `  ${c.name} ${c.type}${c.isPrimary ? ' PRIMARY KEY' : ''}`).join(',\n')}
);`}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
              <DatabaseZap className="w-10 h-10 mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Select a table to inspect schema and live records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
