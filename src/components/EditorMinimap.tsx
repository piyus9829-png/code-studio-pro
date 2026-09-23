import React, { useRef, useState, useEffect, useCallback } from 'react';
import { EditorTheme, Language } from '../types';
import { tokenizeLine } from '../utils/syntax';

interface EditorMinimapProps {
  content: string;
  language: Language;
  theme: EditorTheme;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  activeLine?: number;
  onScrollTo: (targetScrollTop: number) => void;
}

export const EditorMinimap: React.FC<EditorMinimapProps> = ({
  content,
  language,
  theme,
  scrollTop,
  scrollHeight,
  clientHeight,
  activeLine,
  onScrollTo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lines = content.split('\n');

  // Theme color mapping for minimap micro-tokens
  const getTokenColor = (type: string): string => {
    switch (type) {
      case 'keyword':
      case 'storage':
        return '#c084fc'; // purple-400
      case 'function':
      case 'method':
        return '#60a5fa'; // blue-400
      case 'string':
        return '#34d399'; // emerald-400
      case 'number':
        return '#fb923c'; // orange-400
      case 'comment':
        return '#64748b'; // slate-500
      case 'type':
      case 'class':
        return '#38bdf8'; // sky-400
      case 'operator':
      case 'punctuation':
        return '#94a3b8'; // slate-400
      case 'variable':
      case 'parameter':
        return '#f472b6'; // pink-400
      case 'tag':
        return '#f87171'; // red-400
      case 'attribute':
        return '#fbbf24'; // amber-400
      default:
        return '#cbd5e1'; // slate-300
    }
  };

  // Viewport Box Calculations
  const minimapHeight = containerRef.current?.clientHeight || 400;
  const effectiveScrollHeight = Math.max(scrollHeight, clientHeight, 1);
  
  // Height of each line in minimap (2px base, max scale)
  const lineMiniHeight = 2.4;
  const totalMinimapContentHeight = Math.max(minimapHeight, lines.length * lineMiniHeight + 20);

  // Ratio of minimap scroll to editor scroll
  const scrollRatio = scrollHeight > clientHeight 
    ? scrollTop / (scrollHeight - clientHeight)
    : 0;

  // Viewport slider dimensions
  const viewportHeight = Math.max(20, Math.min(minimapHeight, (clientHeight / effectiveScrollHeight) * minimapHeight));
  const maxSliderTop = minimapHeight - viewportHeight;
  const sliderTop = Math.max(0, Math.min(maxSliderTop, scrollRatio * maxSliderTop));

  // Handle direct click on minimap track
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Calculate target scroll percentage
    const targetRatio = Math.max(0, Math.min(1, (clickY - viewportHeight / 2) / Math.max(1, rect.height - viewportHeight)));
    const targetScrollTop = targetRatio * (scrollHeight - clientHeight);
    onScrollTo(targetScrollTop);
  };

  // Handle slider drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const targetRatio = Math.max(0, Math.min(1, (relativeY - viewportHeight / 2) / Math.max(1, rect.height - viewportHeight)));
      const targetScrollTop = targetRatio * (scrollHeight - clientHeight);
      onScrollTo(targetScrollTop);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrollHeight, clientHeight, viewportHeight, onScrollTo]);

  return (
    <div
      ref={containerRef}
      onClick={handleMinimapClick}
      className="w-16 sm:w-20 shrink-0 h-full border-l border-slate-800/80 bg-slate-950/60 hover:bg-slate-950/80 select-none overflow-hidden relative cursor-pointer group transition-colors"
      title="Editor Minimap (Click or drag to navigate)"
    >
      {/* Micro Lines Renderer */}
      <div 
        className="w-full absolute top-0 left-0 px-1.5 py-2 pointer-events-none"
        style={{
          transform: `translateY(-${scrollRatio * Math.max(0, totalMinimapContentHeight - minimapHeight)}px)`,
        }}
      >
        {lines.slice(0, 500).map((line, idx) => {
          const lineNum = idx + 1;
          const isActive = activeLine === lineNum;
          const indentMatch = line.match(/^(\s*)/);
          const indentLength = indentMatch ? indentMatch[1].length : 0;
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} style={{ height: `${lineMiniHeight}px` }} />;
          }

          const tokens = tokenizeLine(line, language);

          return (
            <div
              key={idx}
              className={`flex items-center gap-0.5 overflow-hidden rounded-[1px] my-[0.4px] ${
                isActive ? 'bg-indigo-500/30 ring-1 ring-indigo-400/50' : ''
              }`}
              style={{
                height: `${lineMiniHeight}px`,
                paddingLeft: `${Math.min(24, indentLength * 1.5)}px`,
              }}
            >
              {tokens.map((tok, tIdx) => {
                const charCount = tok.value.length;
                const widthPx = Math.max(2, Math.min(28, charCount * 1.2));
                return (
                  <span
                    key={tIdx}
                    className="inline-block rounded-[0.5px] opacity-70 group-hover:opacity-90 transition-opacity"
                    style={{
                      width: `${widthPx}px`,
                      height: '1.6px',
                      backgroundColor: getTokenColor(tok.type),
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Interactive Visible Viewport Box */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          top: `${sliderTop}px`,
          height: `${viewportHeight}px`,
        }}
        className={`absolute left-0 right-0 border-y border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 group-hover:bg-indigo-500/20 transition-colors z-10 cursor-grab active:cursor-grabbing shadow-sm ${
          isDragging ? 'bg-indigo-500/30 border-indigo-400 ring-1 ring-indigo-400/30' : ''
        }`}
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-indigo-400/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
