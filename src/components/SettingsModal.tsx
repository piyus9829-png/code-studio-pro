import React from 'react';
import { EditorSettings, EditorTheme } from '../types';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  Palette, 
  Brackets, 
  Check,
  Type,
  AlignLeft,
  Smartphone
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
  if (!isOpen) return null;

  const themes: Array<{ id: EditorTheme; name: string; bg: string }> = [
    { id: 'vs-dark', name: 'VS Code Dark+ (Default)', bg: 'bg-[#0f172a]' },
    { id: 'tokyo-night', name: 'Tokyo Night', bg: 'bg-[#1a1b26]' },
    { id: 'dracula', name: 'Dracula Pro', bg: 'bg-[#282a36]' },
    { id: 'monokai', name: 'Monokai Pro', bg: 'bg-[#272822]' },
    { id: 'synthwave', name: "Synthwave '84", bg: 'bg-[#241b2f]' },
    { id: 'github-light', name: 'GitHub Light', bg: 'bg-slate-100 text-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Editor Settings</h2>
              <p className="text-xs text-slate-400">Configure VS Code behavior and styling</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-200">
          {/* Theme Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Color Theme</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${t.bg} ${
                    settings.theme === t.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 font-bold'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  {settings.theme === t.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Typography & Spacing */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Typography & Indentation</span>
            </label>

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
