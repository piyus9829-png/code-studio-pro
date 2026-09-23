import React, { useState } from 'react';
import { EditorSettings, EditorTheme, TerminalTheme } from '../types';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  Palette, 
  Brackets, 
  Check, 
  Type, 
  AlignLeft, 
  Smartphone,
  Terminal,
  Code2,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { TERMINAL_THEMES } from '../utils/terminalThemes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [themeTab, setThemeTab] = useState<'editor' | 'terminal'>('editor');

  if (!isOpen) return null;

  const editorThemes: Array<{ id: EditorTheme; name: string; bg: string; subtitle: string }> = [
    { id: 'vs-dark', name: 'VS Code Dark+', bg: 'bg-[#0f172a]', subtitle: 'Default dark blue' },
    { id: 'tokyo-night', name: 'Tokyo Night', bg: 'bg-[#1a1b26]', subtitle: 'Clean midnight purple' },
    { id: 'dracula', name: 'Dracula Pro', bg: 'bg-[#282a36]', subtitle: 'Vibrant neon contrast' },
    { id: 'monokai', name: 'Monokai Pro', bg: 'bg-[#272822]', subtitle: 'High-contrast retro' },
    { id: 'synthwave', name: "Synthwave '84", bg: 'bg-[#241b2f]', subtitle: 'Neon magenta cyberpunk' },
    { id: 'github-light', name: 'GitHub Light', bg: 'bg-slate-100 text-slate-900', subtitle: 'Clean daytime light' },
  ];

  const terminalThemesList = Object.values(TERMINAL_THEMES);
  const currentTerminalTheme = settings.terminalTheme || 'default-dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[88vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Editor & Environment Settings</h2>
              <p className="text-xs text-slate-400">Configure editor, output terminal themes, and behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-200 custom-scrollbar">
          {/* Theme Section with Sub-Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Appearance & Themes</span>
              </label>

              {/* Theme Sub-tab Selector */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setThemeTab('editor')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    themeTab === 'editor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Editor Theme</span>
                </button>
                <button
                  onClick={() => setThemeTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    themeTab === 'terminal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Output Terminal Theme</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">New</span>
                </button>
              </div>
            </div>

            {/* Editor Themes Tab */}
            {themeTab === 'editor' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 mb-2">
                  Controls the syntax highlighting and background colors for the primary code editor panes.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {editorThemes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer min-h-[64px] ${t.bg} ${
                        settings.theme === t.id
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 font-bold shadow-lg'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate text-xs font-medium">{t.name}</span>
                        {settings.theme === t.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{t.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Output Terminal Theme Tab */}
            {themeTab === 'terminal' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Pick a dedicated color palette specifically for stdout/stderr logs, REPL prompt, and test runners (independent of editor theme).
                  </p>
                  <span className="text-[11px] font-mono text-indigo-400 shrink-0">
                    Active: {TERMINAL_THEMES[currentTerminalTheme]?.name || 'VS Code Dark+'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {terminalThemesList.map(t => {
                    const isSelected = currentTerminalTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onUpdateSettings({ terminalTheme: t.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-slate-950 shadow-lg'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/70 hover:bg-slate-950'
                        }`}
                      >
                        {/* Theme Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div>
                            <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                              <span>{t.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                t.category === 'Light'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {t.category}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Live Terminal Visual Swatch */}
                        <div 
                          className="w-full rounded-lg p-2 font-mono text-[10px] space-y-1 border border-black/20 shadow-inner"
                          style={{ backgroundColor: t.preview.bg, color: t.preview.text }}
                        >
                          <div className="flex items-center justify-between text-[9px] opacity-80 border-b border-black/10 pb-0.5">
                            <span style={{ color: t.preview.accent }}>$ terminal</span>
                            <span style={{ color: t.preview.prompt }}>exit 0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: t.preview.prompt }} className="font-bold">&gt;</span>
                            <span className="truncate">output log sample</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Typography & Spacing */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Typography & Coding Fonts</span>
            </label>

            {/* Font Family Selection */}
            <div>
              <label className="block text-slate-400 mb-2 font-medium">Editor Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'jetbrains-mono', name: 'JetBrains Mono', fontClass: 'font-jetbrains', sub: 'Modern & crisp' },
                  { id: 'fira-code', name: 'Fira Code', fontClass: 'font-fira', sub: 'Rich programmer glyphs' },
                  { id: 'system-mono', name: 'System Mono', fontClass: 'font-mono', sub: 'Native system' },
                ].map(font => (
                  <button
                    key={font.id}
                    onClick={() => onUpdateSettings({ fontFamily: font.id })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      (settings.fontFamily || 'jetbrains-mono') === font.id
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`font-semibold text-xs ${font.fontClass}`}>{font.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{font.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Ligatures Toggle & Interactive Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span>Font Ligatures</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      settings.fontLigatures !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {settings.fontLigatures !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Renders special symbol pairs as unified programming ligatures (<code className="text-indigo-300">=&#62;</code>, <code className="text-indigo-300">!=</code>, <code className="text-indigo-300">===</code>, <code className="text-indigo-300">-&#62;</code>, <code className="text-indigo-300">&#60;=</code>)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.fontLigatures !== false}
                  onChange={(e) => onUpdateSettings({ fontLigatures: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer shrink-0 ml-3"
                />
              </div>

              {/* Live Ligature Sample Box */}
              <div 
                className={`p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between transition-all ${
                  settings.fontFamily === 'fira-code' ? 'font-fira' : settings.fontFamily === 'system-mono' ? 'font-mono' : 'font-jetbrains'
                } ${settings.fontLigatures !== false ? 'ligatures-enabled text-indigo-200' : 'ligatures-disabled text-slate-300'}`}
                style={{
                  fontVariantLigatures: settings.fontLigatures !== false ? 'normal' : 'none',
                  fontFeatureSettings: settings.fontLigatures !== false ? '"liga" 1, "calt" 1, "dlig" 1' : '"liga" 0, "calt" 0, "dlig" 0',
                }}
              >
                <div className="text-[11px] text-slate-500 font-sans select-none">Live Ligature Preview:</div>
                <div className="tracking-normal font-medium text-[13px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  <span>const fn = (x) =&gt; x !== null &amp;&amp; x &gt;= 0; // -&gt; === &lt;= !=</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Font Size ({settings.fontSize}px)</label>
                <input
                  type="range"
                  min="11"
                  max="18"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Tab Indent Size ({settings.tabSize} Spaces)</label>
                <div className="flex gap-2">
                  {[2, 4].map(size => (
                    <button
                      key={size}
                      onClick={() => onUpdateSettings({ tabSize: size })}
                      className={`flex-1 py-1.5 rounded-lg border text-center font-mono cursor-pointer transition-all ${
                        settings.tabSize === size
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {size} Spaces
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VS Code Intelligence Features */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Brackets className="w-3.5 h-3.5 text-emerald-400" />
              <span>VS Code Smart Code Editing</span>
            </label>

            {/* VS Code CodeLens Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">CodeLens References & Run Actions</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    VS Code
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Displays symbol reference counters, complexity estimations, and one-click 'Run' triggers directly above functions, classes, and endpoints
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.codeLens !== false}
                onChange={(e) => onUpdateSettings({ codeLens: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Auto-Save Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Auto-Save Workspace & Files</div>
                <div className="text-[11px] text-slate-500">Periodically backs up file contents and tabs to localStorage to prevent data loss on refresh</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSave !== false}
                onChange={(e) => onUpdateSettings({ autoSave: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Code Editor Minimap Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Show Code Editor Minimap</div>
                <div className="text-[11px] text-slate-500">Displays a scaled overview map of the entire file along the right edge of the editor</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minimap !== false}
                onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Collaborative Cursors Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Collaborative Cursors & Live Peer Presence</div>
                <div className="text-[11px] text-slate-500">Shows real-time active cursor positions with colored badges and usernames for simulated multi-user collaboration</div>
              </div>
              <input
                type="checkbox"
                checked={settings.collaborativeCursors !== false}
                onChange={(e) => onUpdateSettings({ collaborativeCursors: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Auto Close Brackets */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Auto Closing Brackets & Quotes</div>
                <div className="text-[11px] text-slate-500">Automatically inserts matching pair for (), {}, [], &quot;&quot;, &apos;&apos;</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCloseBrackets}
                onChange={(e) => onUpdateSettings({ autoCloseBrackets: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Auto Comma */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Auto Comma on Enter</div>
                <div className="text-[11px] text-slate-500">Smart comma completion inside arrays and object parameters</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoComma}
                onChange={(e) => onUpdateSettings({ autoComma: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Bracket Pair Colorization */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Bracket Pair Colorization</div>
                <div className="text-[11px] text-slate-500">Colorizes matching brackets with nested contrasting hues</div>
              </div>
              <input
                type="checkbox"
                checked={settings.bracketPairColorization}
                onChange={(e) => onUpdateSettings({ bracketPairColorization: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Progressive Web App / PWABuilder & Desktop Install */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Application & PWA Integration</span>
            </label>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">PWABuilder & Web Manifest</div>
                  <div className="text-[11px] text-slate-500">W3C Compliant Web App Manifest with Offline Service Worker</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Ready</span>
              </div>
              <PWAInstallButton variant="menu" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
