import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Sparkles, 
  Wand2, 
  Trash2, 
  FileCode, 
  Download, 
  Settings, 
  Terminal, 
  CheckCircle2, 
  Search,
  Palette
} from 'lucide-react';
import { EditorTheme, Language } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCode: () => void;
  onFormatCode: () => void;
  onClearConsole: () => void;
  onOpenTemplates: () => void;
  onToggleAi: () => void;
  onSelectTheme: (theme: EditorTheme) => void;
  onSelectLanguage: (lang: Language) => void;
  onExport: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onRunCode,
  onFormatCode,
  onClearConsole,
  onOpenTemplates,
  onToggleAi,
  onSelectTheme,
  onSelectLanguage,
  onExport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'run-code',
      title: 'Run: Execute Active Script / Program',
      category: 'Runner',
      shortcut: '⇧↵ / ⌃↵',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      action: () => { onRunCode(); onClose(); }
    },
    {
      id: 'format-doc',
      title: 'Format Document (Prettier Beautifier)',
      category: 'Editor',
      shortcut: '⌥⇧F',
      icon: <Wand2 className="w-4 h-4 text-indigo-400" />,
      action: () => { onFormatCode(); onClose(); }
    },
    {
      id: 'ai-copilot',
      title: 'Gemini AI Copilot: Open Assistant',
      category: 'AI Tools',
      shortcut: '⌃I',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => { onToggleAi(); onClose(); }
    },
    {
      id: 'open-templates',
      title: 'Templates: Browse Starter C, C++, JS, Python Projects',
      category: 'Workspace',
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      action: () => { onOpenTemplates(); onClose(); }
    },
    {
      id: 'clear-console',
      title: 'Console: Clear Output Buffer',
      category: 'Terminal',
      shortcut: '⌃K',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: () => { onClearConsole(); onClose(); }
    },
    {
      id: 'theme-vs-dark',
      title: 'Theme: VS Code Dark+ (Default)',
      category: 'Preferences',
      icon: <Palette className="w-4 h-4 text-blue-400" />,
      action: () => { onSelectTheme('vs-dark'); onClose(); }
    },
    {
      id: 'theme-tokyo-night',
      title: 'Theme: Tokyo Night Dark',
      category: 'Preferences',
      icon: <Palette className="w-4 h-4 text-indigo-400" />,
      action: () => { onSelectTheme('tokyo-night'); onClose(); }
    },
    {
      id: 'theme-dracula',
      title: 'Theme: Dracula Pro',
      category: 'Preferences',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      action: () => { onSelectTheme('dracula'); onClose(); }
    },
    {
      id: 'theme-monokai',
      title: 'Theme: Monokai Pro',
      category: 'Preferences',
      icon: <Palette className="w-4 h-4 text-yellow-400" />,
      action: () => { onSelectTheme('monokai'); onClose(); }
    },
    {
      id: 'lang-cpp',
      title: 'Change Language Mode: C++ (Modern C++20)',
      category: 'Language',
      icon: <Terminal className="w-4 h-4 text-blue-400" />,
      action: () => { onSelectLanguage('cpp'); onClose(); }
    },
    {
      id: 'lang-c',
      title: 'Change Language Mode: C (C17 Standard)',
      category: 'Language',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      action: () => { onSelectLanguage('c'); onClose(); }
    },
    {
      id: 'lang-js',
      title: 'Change Language Mode: JavaScript (ES2024)',
      category: 'Language',
      icon: <FileCode className="w-4 h-4 text-yellow-400" />,
      action: () => { onSelectLanguage('javascript'); onClose(); }
    },
    {
      id: 'lang-py',
      title: 'Change Language Mode: Python (3.12)',
      category: 'Language',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => { onSelectLanguage('python'); onClose(); }
    },
    {
      id: 'export-project',
      title: 'File: Export Project Archive (.json)',
      category: 'File',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      action: () => { onExport(); onClose(); }
    },
  ];

  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Input Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions (e.g. Run, Theme, C++, Format)..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">ESC</kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={cmd.action}
                className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1 rounded bg-slate-800/80 text-slate-200">
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{cmd.title}</div>
                    <div className="text-[10px] opacity-60 uppercase font-mono">{cmd.category}</div>
                  </div>
                </div>

                {cmd.shortcut && (
                  <kbd className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    idx === selectedIndex ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
