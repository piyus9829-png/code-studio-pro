import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileItem, Language, EditorTheme, EditorSettings, AutocompleteSuggestion } from '../types';
import { tokenizeLine, getTokenClassName } from '../utils/syntax';
import { 
  Copy, 
  Check, 
  Search, 
  Replace, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Code2, 
  FileCode, 
  Binary,
  Settings,
  X
} from 'lucide-react';

interface CodeEditorProps {
  file: FileItem;
  onChangeContent: (content: string) => void;
  onRun: () => void;
  onAskAi: (selectedCode?: string) => void;
  settings?: EditorSettings;
}

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  autoComma: true,
  autoSemicolon: true,
  bracketPairColorization: true,
  lineNumbers: true,
  minimap: true,
  theme: 'vs-dark',
};

// Autocomplete database for multiple languages
const AUTOCOMPLETE_CATALOG: Record<string, AutocompleteSuggestion[]> = {
  cpp: [
    { label: '#include <iostream>', insertText: '#include <iostream>\n', detail: 'Standard I/O stream', kind: 'snippet' },
    { label: '#include <vector>', insertText: '#include <vector>\n', detail: 'Dynamic array container', kind: 'snippet' },
    { label: '#include <algorithm>', insertText: '#include <algorithm>\n', detail: 'Sorting & algorithms', kind: 'snippet' },
    { label: 'cin >>', insertText: 'cin >> ', detail: 'Standard input stream', kind: 'keyword' },
    { label: 'cout <<', insertText: 'cout <<  << endl;', detail: 'Standard output stream', kind: 'keyword' },
    { label: 'vector<int>', insertText: 'vector<int> ', detail: 'Integer dynamic vector', kind: 'type' },
    { label: 'int main()', insertText: 'int main() {\n  \n  return 0;\n}', detail: 'C++ Main Entry Point', kind: 'snippet' },
    { label: 'for (int i = 0; ...)', insertText: 'for (int i = 0; i < n; i++) {\n  \n}', detail: 'Indexed for loop', kind: 'snippet' },
    { label: 'sort(v.begin(), v.end())', insertText: 'sort(v.begin(), v.end());', detail: 'Sort container', kind: 'function' },
  ],
  c: [
    { label: '#include <stdio.h>', insertText: '#include <stdio.h>\n', detail: 'Standard I/O library', kind: 'snippet' },
    { label: '#include <stdlib.h>', insertText: '#include <stdlib.h>\n', detail: 'Standard general utilities', kind: 'snippet' },
    { label: 'printf("...", ...)', insertText: 'printf("%d\\n", );', detail: 'Formatted print output', kind: 'function' },
    { label: 'scanf("...", &...)', insertText: 'scanf("%d", &);', detail: 'Formatted standard input', kind: 'function' },
    { label: 'int main()', insertText: 'int main() {\n  \n  return 0;\n}', detail: 'C Main Function', kind: 'snippet' },
  ],
  javascript: [
    { label: 'console.log()', insertText: 'console.log();', detail: 'Print to console', kind: 'function' },
    { label: 'console.table()', insertText: 'console.table();', detail: 'Render table to console', kind: 'function' },
    { label: 'console.time()', insertText: 'console.time("timer");', detail: 'Start execution timer', kind: 'function' },
    { label: 'function ()', insertText: 'function name(params) {\n  \n}', detail: 'Function declaration', kind: 'snippet' },
    { label: 'const / let', insertText: 'const  = ;', detail: 'Constant variable declaration', kind: 'keyword' },
    { label: 'async / await', insertText: 'async function () {\n  const res = await fetch();\n}', detail: 'Asynchronous function', kind: 'snippet' },
    { label: 'map / filter / reduce', insertText: '.map(item => item)', detail: 'Array transformation', kind: 'function' },
  ],
  python: [
    { label: 'print()', insertText: 'print()', detail: 'Print output to stdout', kind: 'function' },
    { label: 'input()', insertText: 'input("Enter value: ")', detail: 'Read from standard input', kind: 'function' },
    { label: 'def function():', insertText: 'def function_name(args):\n    ', detail: 'Define Python function', kind: 'snippet' },
    { label: 'for item in list:', insertText: 'for item in items:\n    ', detail: 'Iterate over sequence', kind: 'snippet' },
    { label: 'if __name__ == "__main__":', insertText: 'if __name__ == "__main__":\n    ', detail: 'Python script entrypoint', kind: 'snippet' },
  ],
  sql: [
    { label: 'SELECT * FROM', insertText: 'SELECT * FROM ', detail: 'Select query', kind: 'keyword' },
    { label: 'CREATE TABLE', insertText: 'CREATE TABLE table_name (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);', detail: 'Create table statement', kind: 'snippet' },
    { label: 'INSERT INTO', insertText: 'INSERT INTO table_name VALUES ();', detail: 'Insert rows', kind: 'snippet' },
  ]
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChangeContent,
  onRun,
  onAskAi,
  settings = DEFAULT_SETTINGS,
}) => {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, offset: 0 });
  const [copied, setCopied] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // IntelliSense State
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const lines = file.content.split('\n');

  // Track cursor position
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;

    const before = text.slice(0, selStart);
    const lineArr = before.split('\n');
    const currentLine = lineArr.length;
    const currentCol = lineArr[lineArr.length - 1].length + 1;

    setCursorPos({ line: currentLine, col: currentCol, offset: selStart });

    // Autocomplete Trigger Detection
    const currentWordMatch = lineArr[lineArr.length - 1].match(/([a-zA-Z0-9_#.:<>]+)$/);
    if (currentWordMatch && currentWordMatch[1].length >= 2) {
      const prefix = currentWordMatch[1].toLowerCase();
      const catalog = AUTOCOMPLETE_CATALOG[file.language] || AUTOCOMPLETE_CATALOG['javascript'] || [];
      const matched = catalog.filter(item => item.label.toLowerCase().includes(prefix));

      if (matched.length > 0) {
        setSuggestions(matched);
        setSelectedSuggestionIdx(0);
        // Calculate approximate top/left based on line & col
        const top = Math.min(currentLine * 20 + 28, 400);
        const left = Math.min(currentCol * 8 + 48, 500);
        setSuggestionPos({ top, left });
        return;
      }
    }
    setSuggestions([]);
    setSuggestionPos(null);
  }, [file.language]);

  // Insert Autocomplete Suggestion
  const insertSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const selStart = ta.selectionStart;
    const text = ta.value;

    const before = text.slice(0, selStart);
    const after = text.slice(selStart);
    const match = before.match(/([a-zA-Z0-9_#.:<>]+)$/);
    const prefixLen = match ? match[1].length : 0;

    const newBefore = before.slice(0, before.length - prefixLen) + suggestion.insertText;
    const newContent = newBefore + after;

    onChangeContent(newContent);
    setSuggestions([]);
    setSuggestionPos(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = newBefore.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        updateCursorPosition();
      }
    }, 10);
  };

  // Keyboard Event Interceptor: VS Code features
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd, value } = ta;

    // 1. If Autocomplete is active
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx(idx => (idx + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx(idx => (idx - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        setSuggestionPos(null);
        return;
      }
    }

    // 2. Global Shortcuts: Run Code (Shift + Enter or Ctrl + Enter)
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // 3. Find & Replace (Ctrl + F)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFind(true);
      return;
    }

    // 4. Duplicate Line (Alt + Shift + Down or Ctrl + D)
    if ((e.altKey && e.shiftKey && e.key === 'ArrowDown') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd')) {
      e.preventDefault();
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const lineStart = before.lastIndexOf('\n') + 1;
      const nextLineEnd = value.indexOf('\n', selectionEnd);
      const lineEnd = nextLineEnd === -1 ? value.length : nextLineEnd;
      const currentLine = value.substring(lineStart, lineEnd);

      const newContent = value.substring(0, lineEnd) + '\n' + currentLine + value.substring(lineEnd);
      onChangeContent(newContent);
      return;
    }

    // 5. Move Line Up / Down (Alt + ArrowUp / Alt + ArrowDown)
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const linesArr = value.split('\n');
      const lineIndex = value.substring(0, selectionStart).split('\n').length - 1;

      if (e.key === 'ArrowUp' && lineIndex > 0) {
        const temp = linesArr[lineIndex];
        linesArr[lineIndex] = linesArr[lineIndex - 1];
        linesArr[lineIndex - 1] = temp;
        onChangeContent(linesArr.join('\n'));
      } else if (e.key === 'ArrowDown' && lineIndex < linesArr.length - 1) {
        const temp = linesArr[lineIndex];
        linesArr[lineIndex] = linesArr[lineIndex + 1];
        linesArr[lineIndex + 1] = temp;
        onChangeContent(linesArr.join('\n'));
      }
      return;
    }

    // 6. Delete Line (Ctrl + Shift + K)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const linesArr = value.split('\n');
      const lineIndex = value.substring(0, selectionStart).split('\n').length - 1;
      linesArr.splice(lineIndex, 1);
      onChangeContent(linesArr.join('\n'));
      return;
    }

    // 7. Toggle Comment (Ctrl + /)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const commentChar = file.language === 'python' ? '# ' : file.language === 'sql' ? '-- ' : '// ';
      const before = value.substring(0, selectionStart);
      const lineStart = before.lastIndexOf('\n') + 1;
      const after = value.substring(selectionStart);
      const nextLine = after.indexOf('\n');
      const lineEnd = nextLine === -1 ? value.length : selectionStart + nextLine;
      const lineText = value.substring(lineStart, lineEnd);

      let newLineText = '';
      if (lineText.trimStart().startsWith(commentChar.trim())) {
        newLineText = lineText.replace(commentChar, '');
      } else {
        newLineText = commentChar + lineText;
      }

      const newContent = value.substring(0, lineStart) + newLineText + value.substring(lineEnd);
      onChangeContent(newContent);
      return;
    }

    // 8. Tab & Shift+Tab (Multi-line Indentation / Dedentation)
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabStr = ' '.repeat(settings.tabSize || 2);

      if (selectionStart !== selectionEnd) {
        // Multi-line indent/dedent
        const startLine = value.substring(0, selectionStart).lastIndexOf('\n') + 1;
        const endLine = value.indexOf('\n', selectionEnd);
        const actualEndLine = endLine === -1 ? value.length : endLine;
        const selectedBlock = value.substring(startLine, actualEndLine);
        const blockLines = selectedBlock.split('\n');

        let modifiedBlock = '';
        if (e.shiftKey) {
          // Dedent
          modifiedBlock = blockLines.map(l => l.startsWith(tabStr) ? l.slice(tabStr.length) : l.replace(/^\s+/, '')).join('\n');
        } else {
          // Indent
          modifiedBlock = blockLines.map(l => tabStr + l).join('\n');
        }

        const newContent = value.substring(0, startLine) + modifiedBlock + value.substring(actualEndLine);
        onChangeContent(newContent);
      } else {
        // Single cursor indent
        const newContent = value.substring(0, selectionStart) + tabStr + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + tabStr.length;
        }, 0);
      }
      return;
    }

    // 9. Auto-Bracket Closing & Auto-Quote Insertion (VS Code behavior)
    if (settings.autoCloseBrackets) {
      const pairs: Record<string, string> = {
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '`': '`',
        '<': '>',
      };

      const closePairs = [')', '}', ']', '"', "'", '`', '>'];

      // Closing bracket skip if cursor is already before it
      if (closePairs.includes(e.key) && value[selectionStart] === e.key && selectionStart === selectionEnd) {
        e.preventDefault();
        ta.selectionStart = ta.selectionEnd = selectionStart + 1;
        updateCursorPosition();
        return;
      }

      if (pairs[e.key] && selectionStart === selectionEnd) {
        e.preventDefault();
        const open = e.key;
        const close = pairs[e.key];
        const newContent = value.substring(0, selectionStart) + open + close + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 1;
          updateCursorPosition();
        }, 0);
        return;
      }
    }

    // 10. Auto-Indentation & Auto-Brace expansion on Enter
    if (e.key === 'Enter') {
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      const currentLine = beforeCursor.split('\n').pop() || '';
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : '';
      const tabStr = ' '.repeat(settings.tabSize || 2);

      // Between { and }
      if (beforeCursor.endsWith('{') && afterCursor.startsWith('}')) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + tabStr + '\n' + currentIndent + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length + tabStr.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }

      // Open brace or colon (Python) extra indent
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':') || currentLine.trim().endsWith('(') || currentLine.trim().endsWith('[')) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + tabStr + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length + tabStr.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }

      // Auto-Comma on Enter inside object or array list
      if (settings.autoComma && (currentLine.includes(':') || currentLine.includes(',')) && !currentLine.trim().endsWith(',') && !currentLine.trim().endsWith('{') && !currentLine.trim().endsWith('[')) {
        if (afterCursor.trim().startsWith('}') || afterCursor.trim().startsWith(']')) {
          // Inside object/array
          e.preventDefault();
          const newContent = beforeCursor + ',\n' + currentIndent + afterCursor;
          onChangeContent(newContent);
          setTimeout(() => {
            const newPos = selectionStart + 2 + currentIndent.length;
            ta.selectionStart = ta.selectionEnd = newPos;
            updateCursorPosition();
          }, 0);
          return;
        }
      }

      // Normal enter preserves indent
      if (currentIndent.length > 0) {
        e.preventDefault();
        const newContent = beforeCursor + '\n' + currentIndent + afterCursor;
        onChangeContent(newContent);
        setTimeout(() => {
          const newPos = selectionStart + 1 + currentIndent.length;
          ta.selectionStart = ta.selectionEnd = newPos;
          updateCursorPosition();
        }, 0);
        return;
      }
    }
  };

  // Find & Replace actions
  const handleFind = (query: string) => {
    setFindQuery(query);
    if (!query) {
      setMatchCount(0);
      return;
    }
    const matches = (file.content.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    setMatchCount(matches);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = file.content.replace(regex, replaceQuery);
    onChangeContent(newContent);
    setMatchCount(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeBackground = () => {
    switch (settings.theme) {
      case 'tokyo-night': return 'bg-[#1a1b26]';
      case 'dracula': return 'bg-[#282a36]';
      case 'monokai': return 'bg-[#272822]';
      case 'synthwave': return 'bg-[#241b2f]';
      case 'github-light': return 'bg-white text-slate-900';
      case 'vs-dark':
      default: return 'bg-slate-950';
    }
  };

  return (
    <div className={`h-full flex flex-col ${getThemeBackground()} border-r border-slate-800 relative overflow-hidden select-none`}>
      {/* VS Code Breadcrumbs Header */}
      <div className="h-8 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <span className="text-slate-500">workspace</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">src</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-300 font-semibold flex items-center gap-1">
            <FileCode className="w-3 h-3 text-indigo-400" />
            {file.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Ask AI for selected code */}
          <button
            onClick={() => {
              const selectedText = textareaRef.current
                ? textareaRef.current.value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd)
                : '';
              onAskAi(selectedText);
            }}
            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer"
            title="Ask Gemini Copilot about selected code"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>AI Copilot</span>
          </button>

          {/* Find & Replace toggle */}
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              showFind ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Find and Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Copy code */}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy entire file content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFind && (
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs shrink-0 animate-fade-in">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => handleFind(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-32 font-mono"
            />
            {matchCount > 0 && (
              <span className="text-[10px] text-slate-500">{matchCount} matches</span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Replace className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Replace..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-slate-100 text-xs focus:outline-none w-32 font-mono"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            disabled={!findQuery || matchCount === 0}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-[11px] transition-colors cursor-pointer"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Main Canvas: Split into Line Numbers & Syntax Overlay & Textarea */}
      <div 
        ref={editorContainerRef}
        className="flex-1 flex overflow-auto relative font-mono text-xs select-text"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div className="w-12 py-3 bg-slate-950/60 border-r border-slate-900 select-none text-right pr-3 font-mono text-slate-600 shrink-0">
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === cursorPos.line;
              return (
                <div
                  key={idx}
                  className={`leading-relaxed text-[11px] ${
                    isCurrent ? 'text-indigo-400 font-bold bg-indigo-950/30' : 'hover:text-slate-400'
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Code Canvas Container */}
        <div className="flex-1 relative overflow-hidden py-3 px-3">
          {/* Active Line Highlight Ribbon */}
          <div
            className="absolute left-0 right-0 bg-slate-800/30 pointer-events-none border-y border-slate-700/20"
            style={{
              top: `${(cursorPos.line - 1) * 20 + 12}px`,
              height: '20px',
            }}
          />

          {/* Syntax Highlight Overlay */}
          <div className="absolute inset-0 p-3 pointer-events-none font-mono whitespace-pre leading-relaxed overflow-hidden">
            {lines.map((line, idx) => (
              <div key={idx} className="h-5">
                {tokenizeLine(line, file.language).map((token, tIdx) => (
                  <span
                    key={tIdx}
                    className={getTokenClassName(token.type, settings.theme)}
                  >
                    {token.value}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Editable Transparent Interactive Textarea */}
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={(e) => {
              onChangeContent(e.target.value);
              updateCursorPosition();
            }}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onSelect={updateCursorPosition}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full p-3 font-mono text-transparent caret-white resize-none bg-transparent focus:outline-none leading-relaxed whitespace-pre z-10 selection:bg-indigo-500/40"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
            }}
          />

          {/* IntelliSense Autocomplete Popup */}
          {suggestions.length > 0 && suggestionPos && (
            <div
              className="absolute z-30 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden font-mono text-xs animate-fade-in"
              style={{
                top: `${suggestionPos.top}px`,
                left: `${suggestionPos.left}px`,
              }}
            >
              <div className="p-1.5 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>IntelliSense Suggestions</span>
                <span className="text-slate-500">Tab / ↵ to insert</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => insertSuggestion(item)}
                    className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      idx === selectedSuggestionIdx
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] px-1 rounded bg-slate-800/80 text-indigo-300 font-bold uppercase">
                        {item.kind[0]}
                      </span>
                      <span className="font-semibold truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-2 truncate max-w-[100px]">
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VS Code Bottom Status Bar */}
      <div className="h-6 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between px-3 text-[11px] text-slate-400 shrink-0 select-none font-mono">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: {settings.tabSize}</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">LF</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="capitalize text-indigo-300 font-medium">{file.language}</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Ready
          </span>
        </div>
      </div>
    </div>
  );
};
