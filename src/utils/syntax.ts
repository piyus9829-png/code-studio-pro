import { Language, EditorTheme } from '../types';

export interface Token {
  type: 
    | 'keyword' 
    | 'string' 
    | 'number' 
    | 'comment' 
    | 'function' 
    | 'type' 
    | 'tag' 
    | 'operator' 
    | 'punctuation' 
    | 'preprocessor'
    | 'bracket-1'
    | 'bracket-2'
    | 'bracket-3'
    | 'text';
  value: string;
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'default', 'try', 'catch', 'finally', 'throw',
  'new', 'class', 'extends', 'super', 'this', 'typeof', 'instanceof', 'in', 'of',
  'import', 'export', 'from', 'as', 'async', 'await', 'yield', 'delete', 'void'
]);

const TS_TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'void', 'unknown', 'never', 'object',
  'symbol', 'bigint', 'Array', 'Record', 'Promise', 'Map', 'Set', 'T', 'K', 'V',
  'interface', 'type', 'enum', 'implements', 'declare', 'abstract', 'readonly'
]);

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
  'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda',
  'pass', 'global', 'nonlocal', 'assert', 'yield', 'del', 'in', 'is', 'not', 'and', 'or'
]);

const CPP_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool',
  'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class',
  'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast',
  'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete',
  'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern',
  'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long',
  'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator',
  'or', 'or_eq', 'private', 'protected', 'public', 'register', 'reinterpret_cast',
  'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
  'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw',
  'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
  'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq', 'cin', 'cout', 'endl'
]);

const CPP_TYPES = new Set([
  'vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set', 'pair', 'tuple',
  'queue', 'deque', 'stack', 'priority_queue', 'array', 'size_t', 'int32_t', 'int64_t',
  'uint32_t', 'uint64_t', 'ifstream', 'ofstream', 'stringstream', 'ostream', 'istream',
  'int', 'float', 'double', 'char', 'bool', 'void', 'long', 'short', 'unsigned'
]);

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'delete',
  'create', 'table', 'drop', 'alter', 'join', 'left', 'right', 'inner', 'outer',
  'on', 'group', 'by', 'order', 'asc', 'desc', 'having', 'limit', 'as', 'and', 'or',
  'not', 'null', 'primary', 'key', 'int', 'varchar', 'round', 'count', 'sum', 'avg'
]);

/**
 * Tokenizes a single line of source code with bracket matching & colorization
 */
export function tokenizeLine(line: string, language: Language, bracketDepth = 0): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;
  let currentBracketDepth = bracketDepth;

  // Preprocessor directives in C/C++ (e.g. #include <iostream>, #define MAX 100)
  if ((language === 'c' || language === 'cpp') && line.trim().startsWith('#')) {
    tokens.push({ type: 'preprocessor', value: line });
    return tokens;
  }

  while (i < len) {
    // 1. Comments
    if (
      (line[i] === '/' && line[i + 1] === '/') ||
      (language === 'python' && line[i] === '#') ||
      (language === 'sql' && line[i] === '-' && line[i + 1] === '-')
    ) {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // 2. Strings & Character literals
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let str = quote;
      i++;
      while (i < len && line[i] !== quote) {
        if (line[i] === '\\' && i + 1 < len) {
          str += line[i] + line[i + 1];
          i += 2;
        } else {
          str += line[i];
          i++;
        }
      }
      if (i < len) {
        str += line[i];
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // 3. Numbers
    if (/[0-9]/.test(line[i])) {
      let num = '';
      while (i < len && /[0-9.xa-fA-F_uUlL]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 4. HTML / JSX Tags
    if ((language === 'html' || language === 'javascript' || language === 'typescript') && line[i] === '<' && /[a-zA-Z/]/.test(line[i + 1] || '')) {
      let tag = '';
      while (i < len && line[i] !== '>' && !/\s/.test(line[i])) {
        tag += line[i];
        i++;
      }
      tokens.push({ type: 'tag', value: tag });
      continue;
    }

    // 5. Bracket Pair Colorization (VS Code style)
    if (line[i] === '{' || line[i] === '(' || line[i] === '[') {
      const bType: Token['type'] = currentBracketDepth % 3 === 0 ? 'bracket-1' : currentBracketDepth % 3 === 1 ? 'bracket-2' : 'bracket-3';
      tokens.push({ type: bType, value: line[i] });
      currentBracketDepth++;
      i++;
      continue;
    }
    if (line[i] === '}' || line[i] === ')' || line[i] === ']') {
      currentBracketDepth = Math.max(0, currentBracketDepth - 1);
      const bType: Token['type'] = currentBracketDepth % 3 === 0 ? 'bracket-1' : currentBracketDepth % 3 === 1 ? 'bracket-2' : 'bracket-3';
      tokens.push({ type: bType, value: line[i] });
      i++;
      continue;
    }

    // 6. Identifiers, Keywords, Functions
    if (/[a-zA-Z_$]/.test(line[i])) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_$:]/.test(line[i])) {
        ident += line[i];
        i++;
      }

      const lower = ident.toLowerCase();
      if ((language === 'c' || language === 'cpp') && (CPP_KEYWORDS.has(ident) || CPP_KEYWORDS.has(lower))) {
        tokens.push({ type: 'keyword', value: ident });
      } else if ((language === 'c' || language === 'cpp') && CPP_TYPES.has(ident)) {
        tokens.push({ type: 'type', value: ident });
      } else if (language === 'sql' && SQL_KEYWORDS.has(lower)) {
        tokens.push({ type: 'keyword', value: ident });
      } else if (language === 'python' && PY_KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident });
      } else if (JS_KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident });
      } else if (TS_TYPES.has(ident)) {
        tokens.push({ type: 'type', value: ident });
      } else if (ident === 'true' || ident === 'false' || ident === 'null' || ident === 'undefined' || ident === 'nullptr' || ident === 'None' || ident === 'True' || ident === 'False') {
        tokens.push({ type: 'number', value: ident });
      } else if (i < len && (line[i] === '(' || line[i] === '<')) {
        tokens.push({ type: 'function', value: ident });
      } else {
        tokens.push({ type: 'text', value: ident });
      }
      continue;
    }

    // 7. Operators & Punctuation
    if (/[=+\-*/%&|^!<>?:~]/.test(line[i])) {
      let op = '';
      while (i < len && /[=+\-*/%&|^!<>?:~]/.test(line[i])) {
        op += line[i];
        i++;
      }
      tokens.push({ type: 'operator', value: op });
      continue;
    }

    if (/[;.,]/.test(line[i])) {
      tokens.push({ type: 'punctuation', value: line[i] });
      i++;
      continue;
    }

    // 8. Whitespace and fallback
    tokens.push({ type: 'text', value: line[i] });
    i++;
  }

  return tokens;
}

/**
 * Returns Tailwind class for token type
 */
export function getTokenClassName(type: Token['type'], theme: EditorTheme = 'vs-dark'): string {
  switch (type) {
    case 'preprocessor':
      return 'text-amber-400 font-semibold';
    case 'keyword':
      return theme === 'synthwave' ? 'text-pink-400 font-bold drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' : 'text-purple-400 font-semibold';
    case 'string':
      return theme === 'monokai' ? 'text-amber-300' : 'text-emerald-300';
    case 'number':
      return theme === 'tokyo-night' ? 'text-orange-300' : 'text-amber-300';
    case 'comment':
      return 'text-slate-500 italic';
    case 'function':
      return theme === 'dracula' ? 'text-green-400 font-medium' : 'text-cyan-300 font-medium';
    case 'type':
      return 'text-yellow-200 font-semibold';
    case 'tag':
      return 'text-pink-400';
    case 'operator':
      return 'text-indigo-300';
    case 'punctuation':
      return 'text-slate-400';
    case 'bracket-1':
      return 'text-yellow-400 font-bold';
    case 'bracket-2':
      return 'text-purple-400 font-bold';
    case 'bracket-3':
      return 'text-cyan-400 font-bold';
    case 'text':
    default:
      return 'text-slate-200';
  }
}
