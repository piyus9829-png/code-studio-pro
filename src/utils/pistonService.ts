import { ConsoleLogEntry, ExecutionResult, Language } from '../types';

export const PISTON_PUBLIC_URL = 'https://emkc.org/api/v2/piston/execute';

export interface PistonFileInfo {
  name: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface PistonPayload {
  language: string;
  version: string;
  files: PistonFileInfo[];
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface PistonExecutionResponse {
  language: string;
  version: string;
  run?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string | null;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string | null;
  };
  message?: string;
  engine?: string;
  timeMs?: number;
  memoryMb?: number;
}

/**
 * Maps frontend language identifier to Piston runtime language tag,
 * default primary filename, and fallback version.
 */
export function mapLanguageToPiston(lang: Language | string): {
  pistonLang: string;
  fileName: string;
  version: string;
  displayName: string;
} {
  const normalized = (lang || '').toLowerCase().trim();

  switch (normalized) {
    case 'cpp':
    case 'c++':
      return { pistonLang: 'c++', fileName: 'main.cpp', version: '*', displayName: 'C++ (g++)' };
    case 'c':
      return { pistonLang: 'c', fileName: 'main.c', version: '*', displayName: 'C (gcc)' };
    case 'python':
    case 'py':
      return { pistonLang: 'python', fileName: 'main.py', version: '*', displayName: 'Python 3' };
    case 'java':
      return { pistonLang: 'java', fileName: 'Main.java', version: '*', displayName: 'Java (OpenJDK)' };
    case 'javascript':
    case 'js':
      return { pistonLang: 'javascript', fileName: 'main.js', version: '*', displayName: 'Node.js' };
    case 'typescript':
    case 'ts':
      return { pistonLang: 'typescript', fileName: 'main.ts', version: '*', displayName: 'TypeScript' };
    default:
      return { pistonLang: normalized, fileName: `main.${normalized}`, version: '*', displayName: normalized.toUpperCase() };
  }
}

/**
 * Core code runner utilizing the public Piston API (https://emkc.org/api/v2/piston/execute).
 * Sends a POST request with the selected language ('c++', 'python', 'java', etc.),
 * code files, and stdin content. Displays real stdout, stderr, and execution status.
 */
export async function executeWithPiston(
  code: string,
  language: Language | string,
  stdin: string = '',
  fileName?: string
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const langConfig = mapLanguageToPiston(language);
  const targetFileName = fileName || langConfig.fileName;
  const logs: ConsoleLogEntry[] = [];

  const payload: PistonPayload = {
    language: langConfig.pistonLang,
    version: langConfig.version,
    files: [
      {
        name: targetFileName,
        content: code,
      },
    ],
    stdin: stdin || '',
    args: [],
  };

  let responseData: PistonExecutionResponse | null = null;
  let usedEngine = 'Piston Public API';

  try {
    // 1. Send POST request directly to the public Piston API
    let res: Response | null = null;
    let directSuccess = false;

    try {
      res = await fetch(PISTON_PUBLIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        responseData = await res.json();
        if (responseData && responseData.run) {
          directSuccess = true;
          usedEngine = `Piston API (${responseData.language || langConfig.pistonLang} ${responseData.version || ''})`.trim();
        }
      }
    } catch {
      // Network or CORS issue with direct endpoint, proceed to server execution proxy
    }

    // 2. If direct public Piston API is unavailable or returns 401 whitelist requirement,
    // proxy via /api/piston/execute which executes through the real compiler backend
    if (!directSuccess) {
      const proxyRes = await fetch('/api/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!proxyRes.ok) {
        const errorText = await proxyRes.text();
        throw new Error(`Execution backend error (${proxyRes.status}): ${errorText}`);
      }

      responseData = await proxyRes.json();
      usedEngine = responseData?.engine || 'Piston Real Execution Backend';
    }
  } catch (err: any) {
    const execTime = Math.round(performance.now() - startTime);
    const errorMessage = err?.message || String(err);

    logs.push({
      id: `log_err_${Date.now()}`,
      type: 'error',
      args: [`[Execution Error] ${errorMessage}`],
      timestamp: Date.now(),
    });

    return {
      logs,
      error: errorMessage,
      executionTimeMs: execTime,
      status: 'error',
      exitCode: 1,
      executionEngine: usedEngine,
      language: langConfig.pistonLang,
    };
  }

  const executionTimeMs = responseData.timeMs || Math.round(performance.now() - startTime);
  const runData = responseData.run || {};
  const compileData = responseData.compile || null;

  const rawStdout = runData.stdout || '';
  const rawStderr = runData.stderr || '';
  const compilerStderr = compileData?.stderr || compileData?.output || '';

  const exitCode = typeof runData.code === 'number' ? runData.code : (compileData && typeof compileData.code === 'number' && compileData.code !== 0 ? compileData.code : 0);
  const signal = runData.signal || null;

  // Header status banner
  logs.push({
    id: `log_init_${Date.now()}`,
    type: 'info',
    args: [`[Execution Backend] ${usedEngine} • Running ${langConfig.displayName}`],
    timestamp: Date.now(),
  });

  // Display standard input notice if stdin was provided
  if (stdin && stdin.trim().length > 0) {
    logs.push({
      id: `log_stdin_${Date.now()}`,
      type: 'stdin',
      args: [`[stdin] ${stdin.length} characters passed to input stream`],
      timestamp: Date.now(),
    });
  }

  // 1. Compiler diagnostics / errors (e.g. g++ or javac compilation errors)
  if (compilerStderr.trim()) {
    logs.push({
      id: `log_compile_${Date.now()}`,
      type: 'error',
      args: [`[Compilation Error]\n${compilerStderr.trimEnd()}`],
      timestamp: Date.now(),
    });
  } else if (compileData?.stdout && compileData.stdout.trim()) {
    logs.push({
      id: `log_compile_out_${Date.now()}`,
      type: 'info',
      args: [`[Compilation Output]\n${compileData.stdout.trimEnd()}`],
      timestamp: Date.now(),
    });
  }

  // 2. Real standard output (stdout)
  if (rawStdout.length > 0) {
    // Break into clean lines for console log display
    const lines = rawStdout.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    // If trailing line is empty from trailing newline, trim it
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    lines.forEach((line, idx) => {
      logs.push({
        id: `log_stdout_${Date.now()}_${idx}`,
        type: 'log',
        args: [line],
        timestamp: Date.now(),
      });
    });
  }

  // 3. Real standard error (stderr)
  if (rawStderr.trim().length > 0) {
    logs.push({
      id: `log_stderr_${Date.now()}`,
      type: 'error',
      args: [`[Runtime Error]\n${rawStderr.trimEnd()}`],
      timestamp: Date.now(),
    });
  }

  // 4. Execution status summary
  const isSuccess = exitCode === 0 && !compilerStderr.trim();

  if (isSuccess) {
    logs.push({
      id: `log_exit_${Date.now()}`,
      type: 'info',
      args: [`✓ Process exited with code 0 (Success) in ${executionTimeMs}ms`],
      timestamp: Date.now(),
    });
  } else {
    logs.push({
      id: `log_exit_${Date.now()}`,
      type: 'error',
      args: [`✗ Process exited with code ${exitCode}${signal ? ` (Signal: ${signal})` : ''} in ${executionTimeMs}ms`],
      timestamp: Date.now(),
    });
  }

  return {
    logs,
    result: rawStdout,
    rawStdout,
    rawStderr,
    compilerOutput: compilerStderr,
    exitCode,
    signal,
    executionTimeMs,
    memoryUsedMb: responseData.memoryMb,
    status: isSuccess ? 'success' : 'error',
    executionEngine: usedEngine,
    language: responseData.language || langConfig.pistonLang,
    version: responseData.version || langConfig.version,
    error: isSuccess ? null : (rawStderr.trim() || compilerStderr.trim() || `Process exited with code ${exitCode}`),
  };
}
