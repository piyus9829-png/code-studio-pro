import { CodeLensItem, CodeLensReferenceLocation, Language, FileItem } from '../types';

/**
 * Heuristic Algorithm Complexity Dictionary for standard algorithms
 */
const ALGO_COMPLEXITY_MAP: Record<string, string> = {
  bubblesort: 'O(N²)',
  insertionsort: 'O(N²)',
  selectionsort: 'O(N²)',
  mergesort: 'O(N log N)',
  quicksort: 'O(N log N)',
  heapsort: 'O(N log N)',
  binarysearch: 'O(log N)',
  linearsearch: 'O(N)',
  fibonacci: 'O(N)',
  factorial: 'O(N)',
  dfs: 'O(V + E)',
  bfs: 'O(V + E)',
  dijkstra: 'O((V + E) log V)',
  calculatestats: 'O(N)',
  printsummary: 'O(N)',
  solve: 'O(N)',
  twosum: 'O(N)',
  primefactors: 'O(√N)',
  sieve: 'O(N log log N)',
};

/**
 * Parses source code into actionable VS Code-style CodeLens items (functions, classes, endpoints, queries)
 */
export function extractCodeLensSymbols(
  currentFile: { id?: string; name: string; language: Language; content: string },
  allWorkspaceFiles?: FileItem[]
): CodeLensItem[] {
  const { content, language, name, id } = currentFile;
  if (!content || !content.trim()) return [];

  const lines = content.split('\n');
  const codeLensList: CodeLensItem[] = [];

  // Helper to extract word occurrences across files
  const findReferences = (symbol: string, declLine: number): CodeLensReferenceLocation[] => {
    const refs: CodeLensReferenceLocation[] = [];
    if (!symbol || symbol.length < 2) return refs;

    // Word boundary regex for exact identifier matching
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');

    // 1. Search within the current file
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      // Skip the line of declaration itself
      if (lineNum === declLine) return;

      // Skip pure single line comment lines
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
        return;
      }

      let match: RegExpExecArray | null;
      while ((match = regex.exec(lineText)) !== null) {
        refs.push({
          fileId: id,
          fileName: name,
          line: lineNum,
          col: match.index,
          lineContent: lineText.trim(),
        });
      }
    });

    // 2. Search across other open workspace files
    if (allWorkspaceFiles && allWorkspaceFiles.length > 0) {
      allWorkspaceFiles.forEach(otherFile => {
        if (otherFile.id === id || otherFile.name === name) return;
        const otherLines = otherFile.content.split('\n');
        otherLines.forEach((otherLineText, idx) => {
          const lineNum = idx + 1;
          const trimmed = otherLineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) return;

          let match: RegExpExecArray | null;
          while ((match = regex.exec(otherLineText)) !== null) {
            refs.push({
              fileId: otherFile.id,
              fileName: otherFile.name,
              line: lineNum,
              col: match.index,
              lineContent: otherLineText.trim(),
            });
          }
        });
      });
    }

    return refs;
  };

  // Helper to extract signature from definition line
  const extractSignature = (lineText: string): string => {
    const clean = lineText.trim().replace(/\{$/, '').trim();
    if (clean.length > 60) {
      return clean.slice(0, 57) + '...';
    }
    return clean;
  };

  // Helper to detect algorithmic complexity
  const getComplexity = (symbol: string): string | undefined => {
    const key = symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [algoKey, comp] of Object.entries(ALGO_COMPLEXITY_MAP)) {
      if (key.includes(algoKey)) {
        return comp;
      }
    }
    return undefined;
  };

  // Line-by-line grammar scanner based on language
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const trimmed = lineText.trim();
    const lineNum = i + 1;

    // Skip empty lines or top-level comment blocks
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      continue;
    }

    // --- C & C++ Parsing ---
    if (language === 'cpp' || language === 'c') {
      // main function
      if (/\bint\s+main\s*\(/.test(trimmed) || /\bvoid\s+main\s*\(/.test(trimmed)) {
        const refs = findReferences('main', lineNum);
        codeLensList.push({
          id: `lens-main-${lineNum}`,
          symbolName: 'main',
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: 'Run Main',
          complexity: 'Entrypoint',
          author: 'You',
        });
        continue;
      }

      // Class or Struct definition
      const classMatch = trimmed.match(/^(?:template\s*<[^>]+>\s*)?(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (classMatch) {
        const symbolName = classMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-class-${symbolName}-${lineNum}`,
          symbolName,
          kind: trimmed.startsWith('struct') ? 'struct' : 'class',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: false,
          author: 'You',
        });
        continue;
      }

      // General C/C++ function: [type] [name]([params]) {
      const funcMatch = trimmed.match(/^(?:inline\s+|static\s+|virtual\s+|explicit\s+|constexpr\s+)*(?:void|int|bool|double|float|char|auto|long|std::vector<[^>]+>|std::string|string|size_t|[A-Za-z_][A-Za-z0-9_:*&<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:const)?\s*(?:\{|;|$)/);
      if (funcMatch && funcMatch[1] !== 'if' && funcMatch[1] !== 'for' && funcMatch[1] !== 'while' && funcMatch[1] !== 'switch') {
        const symbolName = funcMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-func-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          paramSummary: funcMatch[2]?.trim() || 'void',
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: `Run ${symbolName}`,
          complexity: getComplexity(symbolName),
          author: 'You',
        });
        continue;
      }
    }

    // --- Python Parsing ---
    if (language === 'python') {
      // FastAPI / Flask / Django decorator routes: @app.get(...), @router.post(...)
      if (trimmed.startsWith('@app.') || trimmed.startsWith('@router.') || trimmed.startsWith('@api.')) {
        const routeMatch = trimmed.match(/@(app|router|api)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/i);
        if (routeMatch) {
          const method = routeMatch[2].toUpperCase();
          const path = routeMatch[3];
          // Check the next line for function name
          const nextLine = lines[i + 1]?.trim() || '';
          const fnMatch = nextLine.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)/);
          const symbolName = fnMatch ? fnMatch[1] : `${method} ${path}`;
          const refs = fnMatch ? findReferences(fnMatch[1], lineNum + 1) : [];

          codeLensList.push({
            id: `lens-route-${lineNum}`,
            symbolName,
            kind: 'endpoint',
            line: lineNum,
            signature: `${method} ${path}`,
            referenceCount: refs.length,
            referenceLocations: refs,
            canRun: true,
            runLabel: `Test ${method} ${path}`,
            author: 'You',
          });
          continue;
        }
      }

      // Pytest / Unit test function: def test_...
      if (/^def\s+(test_[A-Za-z0-9_]*)\s*\(/.test(trimmed)) {
        const testMatch = trimmed.match(/^def\s+(test_[A-Za-z0-9_]*)\s*\(([^)]*)\)/);
        if (testMatch) {
          const symbolName = testMatch[1];
          const refs = findReferences(symbolName, lineNum);
          codeLensList.push({
            id: `lens-test-${symbolName}-${lineNum}`,
            symbolName,
            kind: 'test',
            line: lineNum,
            signature: extractSignature(trimmed),
            referenceCount: refs.length,
            referenceLocations: refs,
            canRun: true,
            runLabel: `Run Test`,
            author: 'You',
          });
          continue;
        }
      }

      // Standard Python function: def func_name(...)
      const pyFuncMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:/);
      if (pyFuncMatch) {
        const symbolName = pyFuncMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-pyfunc-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          paramSummary: pyFuncMatch[2]?.trim() || 'none',
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: symbolName === 'main' ? 'Run Program' : `Run ${symbolName}`,
          complexity: getComplexity(symbolName),
          author: 'You',
        });
        continue;
      }

      // Python class definition: class ClassName(...)
      const pyClassMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)(?:\([^)]*\))?\s*:/);
      if (pyClassMatch) {
        const symbolName = pyClassMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-pyclass-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'class',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: false,
          author: 'You',
        });
        continue;
      }
    }

    // --- JavaScript & TypeScript Parsing ---
    if (language === 'javascript' || language === 'typescript') {
      // Test blocks: describe(...), it(...), test(...)
      const testBlockMatch = trimmed.match(/^(?:describe|it|test)\s*\(\s*["'`]([^"'`]+)["'`]/);
      if (testBlockMatch) {
        const testTitle = testBlockMatch[1];
        codeLensList.push({
          id: `lens-jstest-${lineNum}`,
          symbolName: testTitle,
          kind: 'test',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: 0,
          referenceLocations: [],
          canRun: true,
          runLabel: 'Run Test',
          author: 'You',
        });
        continue;
      }

      // Class declaration: class UserService {
      const jsClassMatch = trimmed.match(/^(?:export\s+(?:default\s+)?)?class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (jsClassMatch) {
        const symbolName = jsClassMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-jsclass-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'class',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: false,
          author: 'You',
        });
        continue;
      }

      // Interface or Type alias: interface UserData { or type Config = {
      const tsTypeMatch = trimmed.match(/^(?:export\s+)?(?:interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (tsTypeMatch) {
        const symbolName = tsTypeMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-tstype-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'interface',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: false,
          author: 'You',
        });
        continue;
      }

      // Function declaration: function foo(...) {
      const jsFuncMatch = trimmed.match(/^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
      if (jsFuncMatch) {
        const symbolName = jsFuncMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-jsfunc-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          paramSummary: jsFuncMatch[2]?.trim() || 'void',
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: `Run ${symbolName}`,
          complexity: getComplexity(symbolName),
          author: 'You',
        });
        continue;
      }

      // Arrow function declaration: const foo = (...) =>
      const arrowMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?(?:\(([^)]*)\)|[A-Za-z_][A-Za-z0-9_]*)\s*=>/);
      if (arrowMatch) {
        const symbolName = arrowMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-arrow-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          paramSummary: arrowMatch[2]?.trim() || 'void',
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: `Run ${symbolName}`,
          complexity: getComplexity(symbolName),
          author: 'You',
        });
        continue;
      }
    }

    // --- Java Parsing ---
    if (language === 'java') {
      if (/public\s+static\s+void\s+main\s*\(/.test(trimmed)) {
        const refs = findReferences('main', lineNum);
        codeLensList.push({
          id: `lens-javamain-${lineNum}`,
          symbolName: 'main',
          kind: 'function',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: 'Run Main',
          complexity: 'Entrypoint',
          author: 'You',
        });
        continue;
      }

      const javaClassMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+|final\s+|abstract\s+)*(?:class|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (javaClassMatch) {
        const symbolName = javaClassMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-javaclass-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'class',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: false,
          author: 'You',
        });
        continue;
      }

      const javaMethodMatch = trimmed.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+|final\s+|synchronized\s+)*(?:void|int|boolean|double|float|String|long|[A-Za-z_][A-Za-z0-9_<>]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
      if (javaMethodMatch && javaMethodMatch[1] !== 'if' && javaMethodMatch[1] !== 'for' && javaMethodMatch[1] !== 'while') {
        const symbolName = javaMethodMatch[1];
        const refs = findReferences(symbolName, lineNum);
        codeLensList.push({
          id: `lens-javamethod-${symbolName}-${lineNum}`,
          symbolName,
          kind: 'method',
          line: lineNum,
          signature: extractSignature(trimmed),
          paramSummary: javaMethodMatch[2]?.trim() || 'void',
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: `Run ${symbolName}`,
          complexity: getComplexity(symbolName),
          author: 'You',
        });
        continue;
      }
    }

    // --- SQL Parsing ---
    if (language === 'sql') {
      const createTableMatch = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][A-Za-z0-9_]*)/i);
      if (createTableMatch) {
        const tableName = createTableMatch[1];
        const refs = findReferences(tableName, lineNum);
        codeLensList.push({
          id: `lens-sqltable-${tableName}-${lineNum}`,
          symbolName: tableName,
          kind: 'struct',
          line: lineNum,
          signature: `TABLE ${tableName}`,
          referenceCount: refs.length,
          referenceLocations: refs,
          canRun: true,
          runLabel: 'Execute DDL',
          author: 'You',
        });
        continue;
      }

      const selectMatch = trimmed.match(/^SELECT\b/i);
      if (selectMatch) {
        codeLensList.push({
          id: `lens-sqlquery-${lineNum}`,
          symbolName: `Query (Line ${lineNum})`,
          kind: 'query',
          line: lineNum,
          signature: extractSignature(trimmed),
          referenceCount: 0,
          referenceLocations: [],
          canRun: true,
          runLabel: 'Execute Query',
          author: 'You',
        });
        continue;
      }
    }
  }

  return codeLensList;
}
