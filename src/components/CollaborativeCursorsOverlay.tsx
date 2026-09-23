import React from 'react';
import { CollaboratorUser } from '../types';

interface CollaborativeCursorsOverlayProps {
  collaborators: CollaboratorUser[];
  fontSize: number;
  lineHeightPx: number;
  approxCharWidth: number;
  paddingY: number;
  paddingX: number;
  lines: string[];
  onJumpToLine?: (line: number) => void;
}

export const CollaborativeCursorsOverlay: React.FC<CollaborativeCursorsOverlayProps> = ({
  collaborators,
  lineHeightPx,
  approxCharWidth,
  paddingY,
  paddingX,
  lines,
  onJumpToLine,
}) => {
  if (!collaborators || collaborators.length === 0) return null;

  const totalLines = Math.max(1, lines.length);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-visible">
      {collaborators.map((user) => {
        const clampedLine = Math.max(1, Math.min(totalLines, user.line));
        const lineText = lines[clampedLine - 1] || '';
        const clampedCol = Math.max(0, Math.min(lineText.length, user.col));

        const top = (clampedLine - 1) * lineHeightPx + paddingY;
        const left = Math.round(clampedCol * approxCharWidth) + paddingX;

        // Selection Highlight Range
        let selectionBox = null;
        if (user.selectionEnd && user.selectionEnd.line === clampedLine) {
          const endCol = Math.max(0, Math.min(lineText.length, user.selectionEnd.col));
          const startCol = Math.min(clampedCol, endCol);
          const finishCol = Math.max(clampedCol, endCol);
          const selLeft = Math.round(startCol * approxCharWidth) + paddingX;
          const selWidth = Math.max(4, Math.round((finishCol - startCol) * approxCharWidth));

          selectionBox = (
            <div
              key={`sel-${user.id}`}
              className="absolute rounded-[2px] transition-all duration-200 pointer-events-none"
              style={{
                top: `${top}px`,
                left: `${selLeft}px`,
                width: `${selWidth}px`,
                height: `${lineHeightPx}px`,
                backgroundColor: `${user.color}25`,
                border: `1px solid ${user.color}60`,
              }}
            />
          );
        }

        return (
          <React.Fragment key={`cursor-${user.id}`}>
            {selectionBox}

            {/* Vertical Caret Bar & Attached Username Badge */}
            <div
              className="absolute pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: '2px',
                height: `${lineHeightPx}px`,
                backgroundColor: user.color,
                boxShadow: `0 0 8px ${user.color}cc`,
                zIndex: 25,
              }}
            >
              {/* Colored Username Badge Positioned Above Caret */}
              <div
                onClick={() => onJumpToLine?.(clampedLine)}
                title={`${user.name} (Ln ${clampedLine}, Col ${clampedCol}) • ${user.activityMessage || user.status}`}
                className="group pointer-events-auto cursor-pointer absolute bottom-full left-0 -translate-y-1 select-none flex items-center gap-1.5 px-2 py-0.5 rounded-t-md rounded-br-md text-[11px] font-semibold tracking-wide text-white shadow-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: user.color,
                  boxShadow: `0 2px 8px rgba(0,0,0,0.35), 0 0 1px ${user.color}`,
                }}
              >
                {/* User Name */}
                <span className="whitespace-nowrap font-sans drop-shadow-sm">{user.name}</span>

                {/* Live Status Indicator (Pulsing when typing) */}
                {user.status === 'typing' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                )}

                {/* Downward Pointer Triangle */}
                <div
                  className="absolute top-full left-0 w-0 h-0 border-solid"
                  style={{
                    borderWidth: '4px 4px 0 0',
                    borderColor: `${user.color} transparent transparent transparent`,
                  }}
                />
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
