import { DiffLine, DiffHunk, DiffSummary, DiffCharChunk } from '../types';

/**
 * Computes intra-line character/word-level diff for modified lines
 */
export function computeCharDiff(oldLine: string, newLine: string): DiffCharChunk[] {
  if (oldLine === newLine) {
    return [{ type: 'same', text: oldLine }];
  }

  // Tokenize by word boundaries, symbols, or whitespace for natural token diffing
  const tokenize = (str: string): string[] => {
    return str.match(/(\s+|[a-zA-Z0-9_]+|[^\s\w])/g) || [str];
  };

  const tokensOld = tokenize(oldLine);
  const tokensNew = tokenize(newLine);

  const n = tokensOld.length;
  const m = tokensNew.length;

  // DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokensOld[i - 1] === tokensNew[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff chunks
  const chunks: DiffCharChunk[] = [];
  let i = n;
  let j = m;

  const rawChunks: DiffCharChunk[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensOld[i - 1] === tokensNew[j - 1]) {
      rawChunks.unshift({ type: 'same', text: tokensOld[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChunks.unshift({ type: 'added', text: tokensNew[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawChunks.unshift({ type: 'deleted', text: tokensOld[i - 1] });
      i--;
    }
  }

  // Merge adjacent chunks of the same type
  for (const chunk of rawChunks) {
    if (chunks.length > 0 && chunks[chunks.length - 1].type === chunk.type) {
      chunks[chunks.length - 1].text += chunk.text;
    } else {
      chunks.push({ ...chunk });
    }
  }

  return chunks;
}

/**
 * Computes full line-by-line diff between checkpoint (old) and working content (new)
 */
export function computeFileDiff(
  oldContent: string = '',
  newContent: string = ''
): {
  lines: DiffLine[];
  hunks: DiffHunk[];
  summary: DiffSummary;
  isClean: boolean;
} {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const n = oldLines.length;
  const m = newLines.length;

  // Fast path: identical contents
  if (oldContent === newContent) {
    const identicalLines: DiffLine[] = oldLines.map((line, idx) => ({
      type: 'unchanged',
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
      oldContent: line,
      newContent: line,
      charDiffs: [{ type: 'same', text: line }],
    }));

    return {
      lines: identicalLines,
      hunks: [],
      summary: {
        additions: 0,
        deletions: 0,
        modifications: 0,
        totalChanges: 0,
      },
      isClean: true,
    };
  }

  // Dynamic Programming LCS for Line Matching
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to extract line changes
  let i = n;
  let j = m;
  const rawDiff: Array<{
    type: 'unchanged' | 'deleted' | 'added';
    oldLine?: string;
    newLine?: string;
    oldNum?: number;
    newNum?: number;
  }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.unshift({
        type: 'unchanged',
        oldLine: oldLines[i - 1],
        newLine: newLines[j - 1],
        oldNum: i,
        newNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({
        type: 'added',
        newLine: newLines[j - 1],
        newNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.unshift({
        type: 'deleted',
        oldLine: oldLines[i - 1],
        oldNum: i,
      });
      i--;
    }
  }

  // Post-process to group adjacent deletion + addition into 'modified' if applicable
  const diffLines: DiffLine[] = [];
  let summaryAdditions = 0;
  let summaryDeletions = 0;
  let summaryModifications = 0;

  let idx = 0;
  while (idx < rawDiff.length) {
    const current = rawDiff[idx];

    // Check if we have a consecutive deleted and added block that represents modification
    if (current.type === 'deleted' && idx + 1 < rawDiff.length && rawDiff[idx + 1].type === 'added') {
      const next = rawDiff[idx + 1];
      const charDiffs = computeCharDiff(current.oldLine || '', next.newLine || '');
      
      diffLines.push({
        type: 'modified',
        oldLineNumber: current.oldNum,
        newLineNumber: next.newNum,
        oldContent: current.oldLine,
        newContent: next.newLine,
        charDiffs,
      });
      summaryModifications++;
      idx += 2;
    } else if (current.type === 'deleted') {
      diffLines.push({
        type: 'deleted',
        oldLineNumber: current.oldNum,
        oldContent: current.oldLine,
      });
      summaryDeletions++;
      idx++;
    } else if (current.type === 'added') {
      diffLines.push({
        type: 'added',
        newLineNumber: current.newNum,
        newContent: current.newLine,
      });
      summaryAdditions++;
      idx++;
    } else {
      diffLines.push({
        type: 'unchanged',
        oldLineNumber: current.oldNum,
        newLineNumber: current.newNum,
        oldContent: current.oldLine,
        newContent: current.newLine,
        charDiffs: [{ type: 'same', text: current.newLine || '' }],
      });
      idx++;
    }
  }

  // Group diffLines into Hunks for jump navigation (with 3 lines of context padding)
  const hunks: DiffHunk[] = [];
  let currentHunkLines: DiffLine[] = [];
  let hunkStartOld = 0;
  let hunkStartNew = 0;
  let inHunk = false;

  diffLines.forEach((line, lineIdx) => {
    const isChange = line.type !== 'unchanged';

    if (isChange) {
      if (!inHunk) {
        inHunk = true;
        hunkStartOld = line.oldLineNumber || 1;
        hunkStartNew = line.newLineNumber || 1;
        currentHunkLines = [];
      }
      currentHunkLines.push(line);
    } else {
      if (inHunk) {
        hunks.push({
          id: `hunk-${hunks.length + 1}`,
          oldStart: hunkStartOld,
          oldCount: currentHunkLines.filter(l => l.oldLineNumber).length,
          newStart: hunkStartNew,
          newCount: currentHunkLines.filter(l => l.newLineNumber).length,
          lines: [...currentHunkLines],
        });
        currentHunkLines = [];
        inHunk = false;
      }
    }
  });

  if (inHunk && currentHunkLines.length > 0) {
    hunks.push({
      id: `hunk-${hunks.length + 1}`,
      oldStart: hunkStartOld,
      oldCount: currentHunkLines.filter(l => l.oldLineNumber).length,
      newStart: hunkStartNew,
      newCount: currentHunkLines.filter(l => l.newLineNumber).length,
      lines: [...currentHunkLines],
    });
  }

  const totalChanges = summaryAdditions + summaryDeletions + summaryModifications;

  return {
    lines: diffLines,
    hunks,
    summary: {
      additions: summaryAdditions,
      deletions: summaryDeletions,
      modifications: summaryModifications,
      totalChanges,
    },
    isClean: totalChanges === 0,
  };
}

/**
 * Generates unified diff patch text (format compatible with git diff / patch)
 */
export function generateUnifiedPatch(
  fileName: string,
  oldContent: string,
  newContent: string,
  oldLabel: string = 'saved-checkpoint',
  newLabel: string = 'working-tree'
): string {
  const { lines, hunks, summary } = computeFileDiff(oldContent, newContent);
  if (summary.totalChanges === 0) {
    return `# No changes in ${fileName} relative to ${oldLabel}\n`;
  }

  let patch = `--- a/${fileName} (${oldLabel})\n+++ b/${fileName} (${newLabel})\n`;

  lines.forEach((line) => {
    if (line.type === 'added') {
      patch += `+${line.newContent || ''}\n`;
    } else if (line.type === 'deleted') {
      patch += `-${line.oldContent || ''}\n`;
    } else if (line.type === 'modified') {
      patch += `-${line.oldContent || ''}\n+${line.newContent || ''}\n`;
    } else {
      patch += ` ${line.newContent || line.oldContent || ''}\n`;
    }
  });

  return patch;
}
