import { FileItem, Language } from '../types';

export interface DocumentSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'struct' | 'method' | 'variable' | 'heading' | 'element';
  line: number; // 1-indexed
  endLine?: number;
}

export interface BreadcrumbSegment {
  id: string;
  type: 'workspace' | 'folder' | 'file' | 'symbol';
  name: string;
  fullPath: string;
  symbolKind?: DocumentSymbol['kind'];
  symbolLine?: number;
}

/**
 * Extracts document symbols (functions, classes, structs, interfaces, headers)
 * for document outline and symbol breadcrumb resolution.
 */
export function extractDocumentSymbols(content: string, language: Language): DocumentSymbol[] {
  if (!content) return [];
  const lines = content.split('\n');
  const symbols: DocumentSymbol[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    if (language === 'typescript' || language === 'javascript') {
      // Classes
      const classMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_$]+)/);
      if (classMatch) {
        symbols.push({ name: `class ${classMatch[1]}`, kind: 'class', line: lineNum });
        return;
      }
      // Interfaces & Types
      const ifaceMatch = trimmed.match(/(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
      if (ifaceMatch) {
        symbols.push({ name: `interface ${ifaceMatch[1]}`, kind: 'interface', line: lineNum });
        return;
      }
      const typeMatch = trimmed.match(/(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*=/);
      if (typeMatch) {
        symbols.push({ name: `type ${typeMatch[1]}`, kind: 'type', line: lineNum });
        return;
      }
      // Named functions
      const funcMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*([A-Za-z0-9_$]+)?\s*\(/);
      if (funcMatch) {
        symbols.push({ name: `${funcMatch[1] || 'anonymous'}()`, kind: 'function', line: lineNum });
        return;
      }
      // Arrow function declarations / const components
      const arrowMatch = trimmed.match(/(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/);
      if (arrowMatch) {
        symbols.push({ name: `${arrowMatch[1]}()`, kind: 'function', line: lineNum });
        return;
      }
    } else if (language === 'python') {
      const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        symbols.push({ name: `class ${classMatch[1]}`, kind: 'class', line: lineNum });
        return;
      }
      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/);
      if (defMatch) {
        symbols.push({ name: `${defMatch[1]}()`, kind: 'function', line: lineNum });
        return;
      }
    } else if (language === 'c' || language === 'cpp') {
      const classMatch = trimmed.match(/(?:class|struct)\s+([A-Za-z0-9_]+)/);
      if (classMatch && !trimmed.endsWith(';')) {
        symbols.push({ name: `${classMatch[0]}`, kind: classMatch[0].startsWith('class') ? 'class' : 'struct', line: lineNum });
        return;
      }
      const funcMatch = trimmed.match(/^(?:[A-Za-z0-9_<>\s*&:]+)\s+([A-Za-z0-9_~]+)\s*\([^;]*\)(?:\s*const)?\s*(?:\{|$)/);
      if (funcMatch && !trimmed.startsWith('return') && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while')) {
        symbols.push({ name: `${funcMatch[1]}()`, kind: 'function', line: lineNum });
        return;
      }
    } else if (language === 'java') {
      const classMatch = trimmed.match(/(?:public|private|protected|static|\s)*class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        symbols.push({ name: `class ${classMatch[1]}`, kind: 'class', line: lineNum });
        return;
      }
      const methodMatch = trimmed.match(/(?:public|private|protected|static|final|\s)+[\w<>\[\]]+\s+([A-Za-z0-9_]+)\s*\([^;]*\)\s*(?:\{|$)/);
      if (methodMatch) {
        symbols.push({ name: `${methodMatch[1]}()`, kind: 'method', line: lineNum });
        return;
      }
    } else if (language === 'markdown') {
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        symbols.push({ name: headingMatch[2], kind: 'heading', line: lineNum });
        return;
      }
    } else if (language === 'sql') {
      const sqlMatch = trimmed.match(/(?:CREATE\s+TABLE|SELECT|CREATE\s+VIEW|INSERT\s+INTO|CREATE\s+PROCEDURE)\s+([A-Za-z0-9_]+)?/i);
      if (sqlMatch) {
        symbols.push({ name: trimmed.slice(0, 30), kind: 'statement' as any, line: lineNum });
        return;
      }
    }
  });

  return symbols;
}

/**
 * Finds the nearest enclosing symbol given the active cursor line.
 */
export function getActiveSymbolAtLine(symbols: DocumentSymbol[], cursorLine: number): DocumentSymbol | null {
  if (!symbols || symbols.length === 0) return null;
  // Find the symbol with highest line <= cursorLine
  let best: DocumentSymbol | null = null;
  for (const sym of symbols) {
    if (sym.line <= cursorLine) {
      if (!best || sym.line > best.line) {
        best = sym;
      }
    }
  }
  return best;
}

/**
 * Parses the breadcrumb trail segments for a file path.
 */
export function buildBreadcrumbSegments(
  fileName: string,
  content: string,
  cursorLine: number,
  language: Language,
  workspaceName = 'cloudide-workspace'
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];

  // Root Workspace segment
  segments.push({
    id: 'ws-root',
    type: 'workspace',
    name: workspaceName,
    fullPath: '/',
  });

  // Normalize path segments
  const normalized = fileName.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length === 1) {
    // If it's a top-level source file without explicit folder, default logical folder to 'src'
    segments.push({
      id: 'folder-src',
      type: 'folder',
      name: 'src',
      fullPath: '/src',
    });

    segments.push({
      id: `file-${parts[0]}`,
      type: 'file',
      name: parts[0],
      fullPath: `/src/${parts[0]}`,
    });
  } else {
    // Multiple path segments (e.g. src/components/Header.tsx)
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts[i];
      currentPath += `/${folder}`;
      segments.push({
        id: `folder-${folder}-${i}`,
        type: 'folder',
        name: folder,
        fullPath: currentPath,
      });
    }

    const actualFileName = parts[parts.length - 1];
    currentPath += `/${actualFileName}`;
    segments.push({
      id: `file-${actualFileName}`,
      type: 'file',
      name: actualFileName,
      fullPath: currentPath,
    });
  }

  // Active Symbol segment if detected
  const symbols = extractDocumentSymbols(content, language);
  const activeSymbol = getActiveSymbolAtLine(symbols, cursorLine);
  if (activeSymbol) {
    segments.push({
      id: `symbol-${activeSymbol.line}-${activeSymbol.name}`,
      type: 'symbol',
      name: activeSymbol.name,
      fullPath: `${fileName}#L${activeSymbol.line}`,
      symbolKind: activeSymbol.kind,
      symbolLine: activeSymbol.line,
    });
  }

  return segments;
}
