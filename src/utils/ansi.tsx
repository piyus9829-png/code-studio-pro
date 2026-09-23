import React from 'react';

export interface AnsiSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  hidden?: boolean;
}

// 16 Standard ANSI colors (high visibility and vibrant contrast for dark/light themes)
const ANSI_FG_COLORS: Record<number, string> = {
  30: '#1e293b', // Black / Dark Slate
  31: '#f87171', // Red
  32: '#4ade80', // Green
  33: '#facc15', // Yellow
  34: '#60a5fa', // Blue
  35: '#c084fc', // Magenta / Purple
  36: '#38bdf8', // Cyan
  37: '#f1f5f9', // White / Light Gray

  // Bright / High-Intensity Colors
  90: '#94a3b8', // Bright Black / Slate
  91: '#fca5a5', // Bright Red
  92: '#86efac', // Bright Green
  93: '#fef08a', // Bright Yellow
  94: '#93c5fd', // Bright Blue
  95: '#f0abfc', // Bright Magenta
  96: '#67e8f9', // Bright Cyan
  97: '#ffffff', // Bright White
};

const ANSI_BG_COLORS: Record<number, string> = {
  40: '#0f172a', // Black
  41: '#7f1d1d', // Red
  42: '#14532d', // Green
  43: '#713f12', // Yellow
  44: '#1e3a8a', // Blue
  45: '#581c87', // Magenta
  46: '#164e63', // Cyan
  47: '#cbd5e1', // White

  // Bright Backgrounds
  100: '#334155', // Bright Black
  101: '#991b1b', // Bright Red
  102: '#166534', // Bright Green
  103: '#854d0e', // Bright Yellow
  104: '#1d4ed8', // Bright Blue
  105: '#6b21a8', // Bright Magenta
  106: '#155e75', // Bright Cyan
  107: '#f8fafc', // Bright White
};

/**
 * Maps 256-color palette index (0-255) to hex/RGB color strings
 */
export function get256Color(index: number): string {
  if (index < 0 || isNaN(index)) return '#f1f5f9';
  if (index < 8) return ANSI_FG_COLORS[30 + index] || '#f1f5f9';
  if (index < 16) return ANSI_FG_COLORS[90 + (index - 8)] || '#f1f5f9';

  // 216 Color Cube (16 - 231): 6x6x6 RGB
  if (index <= 231) {
    const val = index - 16;
    const r = Math.floor(val / 36);
    const g = Math.floor((val % 36) / 6);
    const b = val % 6;
    const toChannel = (c: number) => (c === 0 ? 0 : 55 + c * 40);
    return `rgb(${toChannel(r)}, ${toChannel(g)}, ${toChannel(b)})`;
  }

  // Grayscale ramp (232 - 255): 24 shades of gray
  const gray = Math.min(255, (index - 232) * 10 + 8);
  return `rgb(${gray}, ${gray}, ${gray})`;
}

/**
 * Normalizes all string representations of escape codes (\\x1b, \\033, \\u001b, \\e, \u001b, \033)
 * to standard character 0x1B.
 */
function normalizeEscapeSequences(input: string): string {
  if (!input) return '';
  return input
    .replace(/\\u001b/gi, '\x1b')
    .replace(/\\x1b/gi, '\x1b')
    .replace(/\\033/g, '\x1b')
    .replace(/\\e\[/g, '\x1b[')
    .replace(/\u001b/g, '\x1b');
}

/**
 * Tests if the given string contains any ANSI escape sequences
 */
export function hasAnsiCodes(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const normalized = normalizeEscapeSequences(input);
  return /\x1b\[[0-9;]*[a-zA-Z]/.test(normalized);
}

/**
 * Strips all ANSI escape sequences from text
 */
export function stripAnsi(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const normalized = normalizeEscapeSequences(input);
  return normalized.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Parses raw text containing ANSI escape sequences into styled spans
 */
export function parseAnsi(input: string): AnsiSpan[] {
  if (!input || typeof input !== 'string') {
    return [{ text: String(input ?? '') }];
  }

  const normalized = normalizeEscapeSequences(input);

  // If no ANSI codes are detected, return single text span
  if (!/\x1b\[[0-9;]*[a-zA-Z]/.test(normalized)) {
    return [{ text: normalized }];
  }

  const spans: AnsiSpan[] = [];
  const regex = /\x1b\[([0-9;]*)([a-zA-Z])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Current ANSI styling state
  let currentFg: string | undefined = undefined;
  let currentBg: string | undefined = undefined;
  let isBold = false;
  let isDim = false;
  let isItalic = false;
  let isUnderline = false;
  let isStrikethrough = false;
  let isInverse = false;
  let isHidden = false;

  const pushSpan = (text: string) => {
    if (!text) return;
    spans.push({
      text,
      fg: currentFg,
      bg: currentBg,
      bold: isBold,
      dim: isDim,
      italic: isItalic,
      underline: isUnderline,
      strikethrough: isStrikethrough,
      inverse: isInverse,
      hidden: isHidden,
    });
  };

  while ((match = regex.exec(normalized)) !== null) {
    const textBefore = normalized.slice(lastIndex, match.index);
    pushSpan(textBefore);

    lastIndex = regex.lastIndex;

    const codeStr = match[1];
    const command = match[2];

    // 'm' is SGR (Select Graphic Rendition)
    if (command === 'm') {
      const params = codeStr === '' ? [0] : codeStr.split(';').map(p => parseInt(p, 10) || 0);

      for (let i = 0; i < params.length; i++) {
        const code = params[i];

        if (code === 0) {
          // Reset all
          currentFg = undefined;
          currentBg = undefined;
          isBold = false;
          isDim = false;
          isItalic = false;
          isUnderline = false;
          isStrikethrough = false;
          isInverse = false;
          isHidden = false;
        } else if (code === 1) {
          isBold = true;
          isDim = false;
        } else if (code === 2) {
          isDim = true;
          isBold = false;
        } else if (code === 3) {
          isItalic = true;
        } else if (code === 4) {
          isUnderline = true;
        } else if (code === 7) {
          isInverse = true;
        } else if (code === 8) {
          isHidden = true;
        } else if (code === 9) {
          isStrikethrough = true;
        } else if (code === 21 || code === 22) {
          isBold = false;
          isDim = false;
        } else if (code === 23) {
          isItalic = false;
        } else if (code === 24) {
          isUnderline = false;
        } else if (code === 27) {
          isInverse = false;
        } else if (code === 28) {
          isHidden = false;
        } else if (code === 29) {
          isStrikethrough = false;
        } else if (code >= 30 && code <= 37) {
          currentFg = ANSI_FG_COLORS[code];
        } else if (code === 38) {
          // Extended foreground color
          if (params[i + 1] === 5 && params[i + 2] !== undefined) {
            currentFg = get256Color(params[i + 2]);
            i += 2;
          } else if (params[i + 1] === 2 && params[i + 2] !== undefined && params[i + 3] !== undefined && params[i + 4] !== undefined) {
            currentFg = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
            i += 4;
          }
        } else if (code === 39) {
          currentFg = undefined;
        } else if (code >= 40 && code <= 47) {
          currentBg = ANSI_BG_COLORS[code];
        } else if (code === 48) {
          // Extended background color
          if (params[i + 1] === 5 && params[i + 2] !== undefined) {
            currentBg = get256Color(params[i + 2]);
            i += 2;
          } else if (params[i + 1] === 2 && params[i + 2] !== undefined && params[i + 3] !== undefined && params[i + 4] !== undefined) {
            currentBg = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
            i += 4;
          }
        } else if (code === 49) {
          currentBg = undefined;
        } else if (code >= 90 && code <= 97) {
          currentFg = ANSI_FG_COLORS[code];
        } else if (code >= 100 && code <= 107) {
          currentBg = ANSI_BG_COLORS[code];
        }
      }
    }
  }

  // Push remaining text
  if (lastIndex < normalized.length) {
    pushSpan(normalized.slice(lastIndex));
  }

  return spans.length > 0 ? spans : [{ text: '' }];
}

/**
 * React Component for rendering ANSI-escaped text with formatted colors and styles
 */
export const AnsiText: React.FC<{
  text: string;
  className?: string;
  defaultColor?: string;
}> = ({ text, className = '', defaultColor }) => {
  const spans = parseAnsi(text);

  if (spans.length === 1 && !spans[0].fg && !spans[0].bg && !spans[0].bold && !spans[0].underline && !spans[0].italic && !spans[0].strikethrough && !spans[0].dim) {
    return <span className={className}>{spans[0].text}</span>;
  }

  return (
    <span className={className}>
      {spans.map((span, idx) => {
        let fgColor = span.fg || defaultColor;
        let bgColor = span.bg;

        if (span.inverse) {
          const temp = fgColor;
          fgColor = bgColor || '#0f172a';
          bgColor = temp || '#f1f5f9';
        }

        const style: React.CSSProperties = {
          color: fgColor,
          backgroundColor: bgColor,
          fontWeight: span.bold ? 700 : undefined,
          fontStyle: span.italic ? 'italic' : undefined,
          textDecoration: [
            span.underline ? 'underline' : '',
            span.strikethrough ? 'line-through' : '',
          ].filter(Boolean).join(' ') || undefined,
          opacity: span.dim ? 0.6 : span.hidden ? 0 : undefined,
        };

        return (
          <span key={idx} style={style}>
            {span.text}
          </span>
        );
      })}
    </span>
  );
};
