import React, { useState } from 'react';
import { HoverInfo } from '../utils/intellisense';
import { 
  Braces, 
  Type, 
  Terminal, 
  Variable, 
  Code2, 
  BookOpen, 
  Copy, 
  Check, 
  Sparkles, 
  Layers,
  Box,
  Cpu,
  Info
} from 'lucide-react';

interface HoverTooltipProps {
  info: HoverInfo;
  position: { top: number; left: number };
  onClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  info,
  position,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySignature = () => {
    navigator.clipboard.writeText(info.signature || info.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case 'function':
      case 'method':
        return {
          icon: <Braces className="w-3 h-3 text-purple-400" />,
          label: kind === 'method' ? 'method' : 'function',
          badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
        };
      case 'class':
      case 'struct':
        return {
          icon: <Layers className="w-3 h-3 text-emerald-400" />,
          label: kind,
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        };
      case 'interface':
      case 'type':
        return {
          icon: <Type className="w-3 h-3 text-cyan-400" />,
          label: kind,
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
        };
      case 'keyword':
        return {
          icon: <Terminal className="w-3 h-3 text-indigo-400" />,
          label: 'keyword',
          badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
        };
      case 'variable':
      case 'constant':
        return {
          icon: <Variable className="w-3 h-3 text-sky-400" />,
          label: kind,
          badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800/60',
        };
      case 'module':
        return {
          icon: <Box className="w-3 h-3 text-amber-400" />,
          label: 'module',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        };
      default:
        return {
          icon: <Code2 className="w-3 h-3 text-slate-400" />,
          label: kind,
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const badge = getKindBadge(info.kind);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute z-50 select-text font-mono text-xs shadow-2xl rounded-xl border border-slate-700/80 bg-slate-900/98 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '420px',
        minWidth: '280px',
      }}
    >
      {/* Header bar with icon, symbol name, kind tag, and source tag */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1 rounded border ${badge.badgeClass} shrink-0`}>
            {badge.icon}
          </div>
          <span className="font-bold text-slate-100 truncate text-[13px]">
            {info.name}
          </span>
          <span
            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${badge.badgeClass}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {info.source && (
            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              {info.source === 'user' ? 'local symbol' : info.source}
            </span>
          )}
          <button
            onClick={handleCopySignature}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy type signature"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Code Signature block */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto">
        <pre className="text-[11px] text-indigo-200 font-mono leading-relaxed whitespace-pre-wrap">
          {info.signature || info.name}
        </pre>
      </div>

      {/* Main Documentation Body */}
      <div className="p-3 space-y-2.5 max-h-60 overflow-y-auto text-slate-300 text-[11px] font-sans leading-relaxed custom-scrollbar">
        {info.detail && (
          <p className="text-slate-300 font-medium">{info.detail}</p>
        )}

        {info.doc && (
          <div className="text-slate-400 whitespace-pre-wrap leading-normal font-sans">
            {info.doc}
          </div>
        )}

        {/* Parameter List */}
        {info.params && info.params.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono block">
              Parameters:
            </span>
            <div className="space-y-1">
              {info.params.map((p, idx) => (
                <div key={idx} className="flex items-baseline gap-1.5 text-[11px]">
                  <code className="text-indigo-300 font-mono text-[10px] font-semibold bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-900/40">
                    {p.name}
                  </code>
                  {p.type && (
                    <span className="text-slate-400 font-mono text-[10px]">
                      : {p.type}
                    </span>
                  )}
                  {p.doc && (
                    <span className="text-slate-400 font-sans text-[11px] ml-1">
                      — {p.doc}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Returns Info */}
        {info.returns && (
          <div className="pt-1.5 border-t border-slate-800/80 flex items-baseline gap-1.5 text-[11px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
              Returns:
            </span>
            <span className="text-emerald-300 font-mono text-[10px]">
              {info.returns}
            </span>
          </div>
        )}

        {/* Example Snippet */}
        {info.example && (
          <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono block">
              Example:
            </span>
            <pre className="p-2 rounded bg-slate-950 border border-slate-800/80 text-emerald-300 font-mono text-[10px] overflow-x-auto">
              {info.example}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
