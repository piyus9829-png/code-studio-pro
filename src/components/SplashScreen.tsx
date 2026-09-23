import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, Sparkles, Terminal, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1800,
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing CloudIDE Studio Pro engines...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const dismiss = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onCompleteRef.current();
    }, 300);
  };

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / minDurationMs) * 100), 100);
      setProgress(Math.max(15, pct));

      if (pct < 35) {
        setStatusText('Booting Compiler Engines (C++, Python, Rust, Go, TS)...');
      } else if (pct < 70) {
        setStatusText('Mounting Monaco Editor & IntelliSense AST...');
      } else if (pct < 95) {
        setStatusText('Synchronizing Cloud Sandbox & Security Channels...');
      } else {
        setStatusText('Ready! Launching Workspace...');
      }

      if (elapsed >= minDurationMs) {
        clearInterval(interval);
        dismiss();
      }
    }, 30);

    // Hard fallback timeout to guarantee dismiss
    const fallbackTimeout = setTimeout(() => {
      clearInterval(interval);
      dismiss();
    }, minDurationMs + 400);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
    };
  }, [minDurationMs]);

  return (
    <AnimatePresence>
      {!isFadingOut && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={dismiss}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090d16] text-white select-none overflow-hidden cursor-pointer"
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
          </div>

          {/* Center Brand & Logo Container */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {/* Animated Logo Icon with Rings */}
            <div className="relative mb-6">
              {/* Pulsing Outer Ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-purple-500/30 blur-md"
              />

              {/* Hex / Square Frame */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-0.5 shadow-2xl shadow-blue-500/20">
                <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  <Code2 className="w-10 h-10 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                </div>
              </div>

              {/* Small floating badge */}
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-blue-500 text-[10px] font-bold tracking-wider uppercase text-white shadow-lg border border-blue-300/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> PRO
              </div>
            </div>

            {/* App Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                CloudIDE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Studio Pro</span>
              </h1>
              <p className="mt-1.5 text-xs text-gray-400 font-medium">
                Next-Gen Multi-Language Web IDE & Cloud Sandbox
              </p>
            </div>

            {/* Progress Bar & Status */}
            <div className="w-full mt-7">
              {/* Progress Track */}
              <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden p-0.5 border border-gray-700/50 relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-75 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Dynamic Status Text */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span className="truncate pr-2">{statusText}</span>
                <span className="text-blue-400 font-semibold">{progress}%</span>
              </div>
            </div>

            {/* Click to skip / enter */}
            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>

            {/* Bottom feature badges */}
            <div className="mt-6 flex items-center gap-3 text-[11px] text-gray-500">
              <div className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-gray-400" />
                <span>Monaco Engine</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-gray-400" />
                <span>12+ Languages</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                <span>OAuth 2.0</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
