/**
 * Universal Frontend Code Runner Function
 * Connects directly to the Universal Execution Endpoint (/execute)
 */
export interface RunCodeOptions {
  language: string;
  sourceCode: string;
  setConsoleOutput?: (output: string) => void;
  baseUrl?: string;
}

export interface RunCodeResponse {
  status: 'success' | 'error';
  output: string;
  executionTime?: string;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

/**
 * ⚡ The Universal Code Runner Function
 */
export const runCode = async (
  selectedLanguage: string,
  code: string,
  setConsoleOutput?: (output: string) => void,
  baseUrl: string = ''
): Promise<RunCodeResponse> => {
  // 1. Button ko 'Loading' state mein daalo
  if (setConsoleOutput) {
    setConsoleOutput("Compiling...");
  }

  const endpoint = baseUrl ? `${baseUrl}/execute` : '/execute';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: selectedLanguage, // e.g., "python"
        sourceCode: code // User ka likha hua code
      })
    });

    const data = await response.json();

    // 2. Output Dikhao
    if (data.status === "success") {
      const outputText = data.output || data.stdout || "Code executed successfully with no output.";
      if (setConsoleOutput) {
        setConsoleOutput(outputText);
      }
      return {
        status: 'success',
        output: outputText,
        executionTime: data.executionTime,
        stdout: data.stdout,
        stderr: data.stderr,
        exitCode: data.exitCode
      };
    } else {
      const errorMsg = "Error: " + (data.error || "Execution failed");
      if (setConsoleOutput) {
        setConsoleOutput(errorMsg);
      }
      return {
        status: 'error',
        output: errorMsg,
        error: data.error
      };
    }
  } catch (err: any) {
    const serverErrMsg = "Server Error: Check your backend terminal!";
    if (setConsoleOutput) {
      setConsoleOutput(serverErrMsg);
    }
    return {
      status: 'error',
      output: serverErrMsg,
      error: err?.message || serverErrMsg
    };
  }
};

export default runCode;
