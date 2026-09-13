import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'compact' | 'menu' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as an installed PWA in standalone mode
  if (isInstalled) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>App is Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          disabled={installing}
          title="Install CloudIDE App"
          className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors border border-slate-700/50"
        >
          <Download className="w-4 h-4" />
        </button>
      );
    }

    if (variant === 'menu') {
      return (
        <button
          id="pwa-install-menu-btn"
          onClick={handleInstallClick}
          disabled={installing}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Install Desktop / Mobile App</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">PWA</span>
        </button>
      );
    }

    return (
      <button
        id="pwa-install-header-btn"
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-300 hover:text-indigo-200 shadow-sm transition-all"
        title="Install CloudIDE Studio Pro as a Desktop or Mobile App"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          title="Install CloudIDE on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Install on iPhone / iPad</h3>
                    <p className="text-xs text-slate-400">PWABuilder & iOS Safari Guide</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                  <p>Tap the <strong className="text-white">Share</strong> button in your Safari bottom navigation toolbar.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                  <p>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
                  <p>Tap <strong className="text-white">Add</strong> at top right to launch CloudIDE directly from your home screen in standalone window mode.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white shadow-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
