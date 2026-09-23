export interface EditorCursor {
  id: string;
  start: number; // Anchor / range start offset (0-based)
  end: number;   // Active head / range end offset (0-based)
}

/**
 * Converts a 0-based character offset in string to 0-based line and column.
 */
export function offsetToLineCol(content: string, offset: number): { line: number; col: number } {
  const clamped = Math.max(0, Math.min(offset, content.length));
  const before = content.slice(0, clamped);
  const lineSplits = before.split('\n');
  const line = lineSplits.length - 1;
  const col = lineSplits[lineSplits.length - 1].length;
  return { line, col };
}

/**
 * Converts a 0-based line and column to a character offset.
 */
export function lineColToOffset(lines: string[], line: number, col: number): number {
  const clampedLine = Math.max(0, Math.min(line, lines.length - 1));
  let offset = 0;
  for (let i = 0; i < clampedLine; i++) {
    offset += lines[i].length + 1; // +1 for '\n'
  }
  const maxCol = lines[clampedLine] ? lines[clampedLine].length : 0;
  const clampedCol = Math.max(0, Math.min(col, maxCol));
  return offset + clampedCol;
}

/**
 * Identifies the boundary and text of the word surrounding the given offset.
 */
export function getWordRangeAtOffset(content: string, offset: number): { start: number; end: number; word: string } | null {
  if (!content) return null;
  const clamped = Math.max(0, Math.min(offset, content.length));
  const isWordChar = (c: string) => /[a-zA-Z0-9_$#@.:<>-]/.test(c);

  let targetPos = clamped;
  if (targetPos === content.length || !isWordChar(content[targetPos])) {
    if (targetPos > 0 && isWordChar(content[targetPos - 1])) {
      targetPos = targetPos - 1;
    } else {
      return null;
    }
  }

  let start = targetPos;
  let end = targetPos;
  while (start > 0 && isWordChar(content[start - 1])) {
    start--;
  }
  while (end < content.length && isWordChar(content[end])) {
    end++;
  }

  if (start >= end) return null;
  return {
    start,
    end,
    word: content.slice(start, end),
  };
}

/**
 * Normalizes, removes duplicates/overlaps, and sorts cursors ascending by start offset.
 */
export function deduplicateAndSortCursors(cursors: EditorCursor[]): EditorCursor[] {
  if (cursors.length <= 1) return cursors;

  // Sort ascending by normalized start
  const sorted = [...cursors].sort((a, b) => {
    const aMin = Math.min(a.start, a.end);
    const bMin = Math.min(b.start, b.end);
    if (aMin !== bMin) return aMin - bMin;
    return Math.max(a.start, a.end) - Math.max(b.start, b.end);
  });

  const merged: EditorCursor[] = [];
  for (const cur of sorted) {
    const curMin = Math.min(cur.start, cur.end);
    const curMax = Math.max(cur.start, cur.end);

    if (merged.length === 0) {
      merged.push({ ...cur });
      continue;
    }

    const prev = merged[merged.length - 1];
    const prevMin = Math.min(prev.start, prev.end);
    const prevMax = Math.max(prev.start, prev.end);

    // If point cursor identical to previous
    if (curMin === curMax && prevMin === prevMax && curMin === prevMin) {
      continue;
    }

    // If overlapping range
    if (curMin < prevMax) {
      // Merge ranges
      prev.start = prevMin;
      prev.end = Math.max(prevMax, curMax);
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

/**
 * Searches for the next non-overlapping occurrence of `searchStr` in `content`.
 */
export function findNextOccurrence(
  content: string, 
  searchStr: string, 
  fromOffset: number
): { start: number; end: number } | null {
  if (!searchStr || !content) return null;

  let index = content.indexOf(searchStr, fromOffset);
  if (index === -1) {
    // Wrap around to start of file
    index = content.indexOf(searchStr, 0);
  }

  if (index === -1) return null;
  return {
    start: index,
    end: index + searchStr.length,
  };
}

/**
 * Finds all non-overlapping occurrences of `searchStr` in `content`.
 */
export function findAllOccurrences(content: string, searchStr: string): Array<{ start: number; end: number }> {
  if (!searchStr || !content) return [];
  const results: Array<{ start: number; end: number }> = [];
  let index = 0;

  while ((index = content.indexOf(searchStr, index)) !== -1) {
    results.push({
      start: index,
      end: index + searchStr.length,
    });
    index += Math.max(1, searchStr.length);
  }

  return results;
}

/**
 * Adds a cursor on the line above at the matching column.
 */
export function addCursorAbove(cursors: EditorCursor[], lines: string[], content: string): EditorCursor[] {
  if (cursors.length === 0) return cursors;
  
  // Find topmost cursor
  const topmost = [...cursors].sort((a, b) => Math.min(a.start, a.end) - Math.min(b.start, b.end))[0];
  const { line, col } = offsetToLineCol(content, topmost.end);

  if (line <= 0) return cursors;

  const targetLine = line - 1;
  const targetCol = Math.min(col, lines[targetLine].length);
  const targetOffset = lineColToOffset(lines, targetLine, targetCol);

  const newCursor: EditorCursor = {
    id: `cursor-${Date.now()}-${Math.random()}`,
    start: targetOffset,
    end: targetOffset,
  };

  return deduplicateAndSortCursors([...cursors, newCursor]);
}

/**
 * Adds a cursor on the line below at the matching column.
 */
export function addCursorBelow(cursors: EditorCursor[], lines: string[], content: string): EditorCursor[] {
  if (cursors.length === 0) return cursors;

  // Find bottommost cursor
  const bottommost = [...cursors].sort((a, b) => Math.max(b.start, b.end) - Math.max(a.start, a.end))[0];
  const { line, col } = offsetToLineCol(content, bottommost.end);

  if (line >= lines.length - 1) return cursors;

  const targetLine = line + 1;
  const targetCol = Math.min(col, lines[targetLine].length);
  const targetOffset = lineColToOffset(lines, targetLine, targetCol);

  const newCursor: EditorCursor = {
    id: `cursor-${Date.now()}-${Math.random()}`,
    start: targetOffset,
    end: targetOffset,
  };

  return deduplicateAndSortCursors([...cursors, newCursor]);
}

/**
 * Applies a text insertion / replacement across all active cursors.
 * If multiple lines of text are passed (e.g. multi-line paste) and line count matches cursor count,
 * each line is mapped to its respective cursor!
 */
export function applyTextEdit(
  content: string, 
  cursors: EditorCursor[], 
  insertText: string
): { newContent: string; newCursors: EditorCursor[] } {
  if (cursors.length === 0) {
    return { newContent: content, newCursors: cursors };
  }

  // Sort cursors in descending order so earlier offsets remain invariant
  const sorted = [...cursors].sort((a, b) => Math.min(b.start, b.end) - Math.min(a.start, a.end));
  const multilineStrings = insertText.split('\n');
  const isMultiPaste = multilineStrings.length === cursors.length && cursors.length > 1;

  let currentContent = content;
  const newPositions: Array<{ id: string; pos: number }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    // If multi-paste, match ascending index to lines (sorted is descending, so original index is length - 1 - i)
    const textToInsert = isMultiPaste ? multilineStrings[sorted.length - 1 - i] : insertText;

    const minOffset = Math.min(cur.start, cur.end);
    const maxOffset = Math.max(cur.start, cur.end);

    const before = currentContent.slice(0, minOffset);
    const after = currentContent.slice(maxOffset);

    currentContent = before + textToInsert + after;
    newPositions.push({
      id: cur.id,
      pos: minOffset + textToInsert.length,
    });
  }

  const newCursors: EditorCursor[] = newPositions.map(p => ({
    id: p.id,
    start: p.pos,
    end: p.pos,
  }));

  return {
    newContent: currentContent,
    newCursors: deduplicateAndSortCursors(newCursors),
  };
}

/**
 * Applies backspace across all active cursors.
 */
export function applyBackspace(
  content: string, 
  cursors: EditorCursor[]
): { newContent: string; newCursors: EditorCursor[] } {
  if (cursors.length === 0) return { newContent: content, newCursors: cursors };

  const sorted = [...cursors].sort((a, b) => Math.min(b.start, b.end) - Math.min(a.start, a.end));
  let currentContent = content;
  const newPositions: Array<{ id: string; pos: number }> = [];

  for (const cur of sorted) {
    const minOffset = Math.min(cur.start, cur.end);
    const maxOffset = Math.max(cur.start, cur.end);

    if (minOffset !== maxOffset) {
      // Range selection: delete selection
      const before = currentContent.slice(0, minOffset);
      const after = currentContent.slice(maxOffset);
      currentContent = before + after;
      newPositions.push({ id: cur.id, pos: minOffset });
    } else {
      // Point cursor: delete preceding char
      if (minOffset > 0) {
        const before = currentContent.slice(0, minOffset - 1);
        const after = currentContent.slice(minOffset);
        currentContent = before + after;
        newPositions.push({ id: cur.id, pos: minOffset - 1 });
      } else {
        newPositions.push({ id: cur.id, pos: 0 });
      }
    }
  }

  const newCursors: EditorCursor[] = newPositions.map(p => ({
    id: p.id,
    start: p.pos,
    end: p.pos,
  }));

  return {
    newContent: currentContent,
    newCursors: deduplicateAndSortCursors(newCursors),
  };
}

/**
 * Applies forward delete (Delete key) across all active cursors.
 */
export function applyDelete(
  content: string, 
  cursors: EditorCursor[]
): { newContent: string; newCursors: EditorCursor[] } {
  if (cursors.length === 0) return { newContent: content, newCursors: cursors };

  const sorted = [...cursors].sort((a, b) => Math.min(b.start, b.end) - Math.min(a.start, a.end));
  let currentContent = content;
  const newPositions: Array<{ id: string; pos: number }> = [];

  for (const cur of sorted) {
    const minOffset = Math.min(cur.start, cur.end);
    const maxOffset = Math.max(cur.start, cur.end);

    if (minOffset !== maxOffset) {
      // Range selection: delete selection
      const before = currentContent.slice(0, minOffset);
      const after = currentContent.slice(maxOffset);
      currentContent = before + after;
      newPositions.push({ id: cur.id, pos: minOffset });
    } else {
      // Point cursor: delete following character
      if (minOffset < currentContent.length) {
        const before = currentContent.slice(0, minOffset);
        const after = currentContent.slice(minOffset + 1);
        currentContent = before + after;
        newPositions.push({ id: cur.id, pos: minOffset });
      } else {
        newPositions.push({ id: cur.id, pos: currentContent.length });
      }
    }
  }

  const newCursors: EditorCursor[] = newPositions.map(p => ({
    id: p.id,
    start: p.pos,
    end: p.pos,
  }));

  return {
    newContent: currentContent,
    newCursors: deduplicateAndSortCursors(newCursors),
  };
}

/**
 * Moves all cursors in a direction without modifying text content.
 */
export function applyMoveCursors(
  content: string,
  lines: string[],
  cursors: EditorCursor[],
  direction: 'left' | 'right' | 'up' | 'down' | 'home' | 'end'
): EditorCursor[] {
  const newCursors = cursors.map(cur => {
    const minOffset = Math.min(cur.start, cur.end);
    const maxOffset = Math.max(cur.start, cur.end);
    const hasSelection = minOffset !== maxOffset;

    let targetOffset = cur.end;

    if (direction === 'left') {
      if (hasSelection) {
        targetOffset = minOffset;
      } else {
        targetOffset = Math.max(0, cur.end - 1);
      }
    } else if (direction === 'right') {
      if (hasSelection) {
        targetOffset = maxOffset;
      } else {
        targetOffset = Math.min(content.length, cur.end + 1);
      }
    } else if (direction === 'home') {
      const { line } = offsetToLineCol(content, cur.end);
      const lineStart = lineColToOffset(lines, line, 0);
      const currentLineText = lines[line] || '';
      const firstNonWs = currentLineText.search(/\S/);
      const firstCharOffset = firstNonWs === -1 ? lineStart : lineStart + firstNonWs;
      
      targetOffset = cur.end === firstCharOffset ? lineStart : firstCharOffset;
    } else if (direction === 'end') {
      const { line } = offsetToLineCol(content, cur.end);
      const lineEnd = lineColToOffset(lines, line, lines[line] ? lines[line].length : 0);
      targetOffset = lineEnd;
    } else if (direction === 'up') {
      const { line, col } = offsetToLineCol(content, cur.end);
      if (line > 0) {
        const targetLine = line - 1;
        const targetCol = Math.min(col, lines[targetLine] ? lines[targetLine].length : 0);
        targetOffset = lineColToOffset(lines, targetLine, targetCol);
      }
    } else if (direction === 'down') {
      const { line, col } = offsetToLineCol(content, cur.end);
      if (line < lines.length - 1) {
        const targetLine = line + 1;
        const targetCol = Math.min(col, lines[targetLine] ? lines[targetLine].length : 0);
        targetOffset = lineColToOffset(lines, targetLine, targetCol);
      }
    }

    return {
      id: cur.id,
      start: targetOffset,
      end: targetOffset,
    };
  });

  return deduplicateAndSortCursors(newCursors);
}

/**
 * Breaks a range selection into per-line visual segments for multi-line highlight rendering.
 */
export function calculateSelectionSegments(
  content: string, 
  lines: string[], 
  cursor: EditorCursor
): Array<{ line: number; startCol: number; endCol: number }> {
  const minOffset = Math.min(cursor.start, cursor.end);
  const maxOffset = Math.max(cursor.start, cursor.end);
  if (minOffset === maxOffset) return [];

  const startLoc = offsetToLineCol(content, minOffset);
  const endLoc = offsetToLineCol(content, maxOffset);

  const segments: Array<{ line: number; startCol: number; endCol: number }> = [];

  for (let l = startLoc.line; l <= endLoc.line; l++) {
    const lineLen = lines[l] ? lines[l].length : 0;
    const startCol = (l === startLoc.line) ? startLoc.col : 0;
    const endCol = (l === endLoc.line) ? endLoc.col : lineLen;

    segments.push({
      line: l,
      startCol,
      endCol: Math.max(startCol + 1, endCol),
    });
  }

  return segments;
}
