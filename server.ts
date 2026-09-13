import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import vm from "vm";
import { performance } from "perf_hooks";

// Lazy initialization for Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  });

  // Server-side Node.js / JavaScript Code Execution Endpoint
  app.post("/api/execute/node", async (req, res) => {
    const { code, input = "" } = req.body;

    if (typeof code !== "string") {
      res.status(400).json({ error: "Code must be a string." });
      return;
    }

    const logs: Array<{
      type: "log" | "info" | "warn" | "error" | "table" | "dir";
      args: string[];
      timestamp: number;
    }> = [];

    const customConsole = {
      log: (...args: any[]) => {
        logs.push({
          type: "log",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      info: (...args: any[]) => {
        logs.push({
          type: "info",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      warn: (...args: any[]) => {
        logs.push({
          type: "warn",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      error: (...args: any[]) => {
        logs.push({
          type: "error",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      table: (...args: any[]) => {
        logs.push({
          type: "table",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      dir: (...args: any[]) => {
        logs.push({
          type: "dir",
          args: args.map((arg) => formatValue(arg)),
          timestamp: Date.now(),
        });
      },
      clear: () => {
        logs.length = 0;
      },
    };

    const sandbox = {
      console: customConsole,
      setTimeout: (fn: Function, ms: number) => setTimeout(fn, Math.min(ms, 2000)),
      clearTimeout,
      setInterval: (fn: Function, ms: number) => setInterval(fn, Math.max(ms, 100)),
      clearInterval,
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Promise,
      Symbol,
      BigInt,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
      Buffer,
      input,
      process: {
        env: { NODE_ENV: "sandbox" },
        version: process.version,
        platform: "cloudide-sandbox",
        cwd: () => "/workspace",
      },
    };

    const startTime = performance.now();
    let result: any = undefined;
    let error: string | null = null;
    let executionTime = 0;

    try {
      const context = vm.createContext(sandbox);
      // Strip simple TypeScript type annotations if present or execute as modern JS
      const sanitizedCode = transpileTypeScriptLike(code);
      const script = new vm.Script(sanitizedCode, {
        filename: "script.js",
      });

      result = script.runInContext(context, {
        timeout: 5000,
        displayErrors: true,
      });

      // Handle promise result if returned
      if (result && typeof result.then === "function") {
        result = await Promise.race([
          result,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Async execution timed out after 5s")), 5000)
          ),
        ]);
      }
      executionTime = Math.round(performance.now() - startTime);
    } catch (err: any) {
      executionTime = Math.round(performance.now() - startTime);
      error = err?.stack || err?.message || String(err);
      logs.push({
        type: "error",
        args: [error ?? "An error occurred"],
        timestamp: Date.now(),
      });
    }

    res.json({
      success: !error,
      logs,
      result: result !== undefined ? formatValue(result) : undefined,
      error,
      executionTimeMs: executionTime,
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      },
    });
  });

  // AI Assistant Endpoint (Code Analysis, Bug Fix, Generation, Explanation, Optimization)
  app.post("/api/gemini/assist", async (req, res) => {
    try {
      const { action, prompt, code, language, context } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Provide intelligent fallback if API key is not configured yet
        res.json({
          response: getFallbackAIResponse(action, code, language, prompt),
          model: "built-in-heuristics",
          fallback: true,
        });
        return;
      }

      let systemInstruction = `You are CloudIDE Studio Pro's intelligent senior software engineer AI assistant.
You provide clear, accurate, high-performance code solutions, explanations, refactorings, and bug diagnostics.
Always format code snippets clearly using markdown code blocks with appropriate language tags.
Be concise, direct, helpful, and technically precise.`;

      let userPrompt = "";
      if (action === "explain") {
        userPrompt = `Please explain the following ${language || "code"} clearly, detailing what each section does, time/space complexity if applicable, and key logic:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      } else if (action === "fix") {
        userPrompt = `Please inspect this ${language || "code"} for bugs, runtime errors, or logical flaws. Identify the issues and provide the fixed, production-ready code with an explanation:\n\n\`\`\`${language || ""}\n${code}\n\`\`\`\n\nAdditional user notes: ${prompt || "Find and fix all bugs."}`;
      } else if (action === "optimize") {
        userPrompt = `Please optimize the following ${language || "code"} for performance, memory efficiency, and readability. Provide the optimized version and explain the improvements:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      } else if (action === "test") {
        userPrompt = `Generate comprehensive unit tests and edge cases for the following ${language || "code"}:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      } else if (action === "convert") {
        userPrompt = `Convert the following code to ${prompt || "TypeScript"}:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      } else {
        userPrompt = `${prompt}\n\nCurrent file context (${language || "code"}):\n\`\`\`${language || ""}\n${code}\n\`\`\``;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        response: response.text || "No response generated.",
        model: "gemini-3.8-flash",
        fallback: false,
      });
    } catch (err: any) {
      console.error("Gemini assist error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate AI response",
        details: String(err),
      });
    }
  });

  // Serve PWA Manifest with explicit CORS and MIME headers for PWABuilder
  app.get(["/manifest.json", "/manifest.webmanifest"], (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    res.sendFile(manifestPath);
  });

  // Serve PWA Service Worker with proper headers
  app.get("/sw.js", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    const swPath = path.join(process.cwd(), "public", "sw.js");
    res.sendFile(swPath);
  });

  // Serve all public directory assets (icons, screenshots) directly
  app.use(express.static(path.join(process.cwd(), "public"), {
    maxAge: "1d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudIDE Studio Pro server running on http://0.0.0.0:${PORT}`);
  });
}

function formatValue(val: any): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean" || typeof val === "symbol") {
    return String(val);
  }
  if (typeof val === "function") {
    return `[Function: ${val.name || "anonymous"}]`;
  }
  if (val instanceof Error) {
    return val.stack || `${val.name}: ${val.message}`;
  }
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function transpileTypeScriptLike(code: string): string {
  // Strip simple type annotations (e.g. `: string`, `: number`, `as any`, `interface ...`, `type ...`)
  let clean = code;
  // Remove import/export keywords for single-script execution
  clean = clean.replace(/export\s+default\s+/g, "");
  clean = clean.replace(/export\s+/g, "");
  clean = clean.replace(/import\s+.*?from\s+['"].*?['"];?/g, "// [import stripped]");
  // Remove interface and type statements
  clean = clean.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "");
  clean = clean.replace(/type\s+\w+\s*=[\s\S]*?;/g, "");
  // Remove basic type assertions like `as any`, `as string`
  clean = clean.replace(/\bas\s+[A-Za-z0-9_<>[\]|&]+/g, "");
  return clean;
}

function getFallbackAIResponse(action: string, code: string, language: string, prompt: string): string {
  if (action === "explain") {
    return `### Code Explanation (${language || "JavaScript"})\n\nThis code performs the following actions:\n1. Defines execution structures and variables.\n2. Iterates over inputs and applies transformations.\n3. Produces log outputs and outputs the final result.\n\n**Key Observation:** The structure uses modern syntax and can be executed directly in the CloudIDE console.`;
  }
  if (action === "optimize") {
    return `### Optimization Suggestions\n\n1. **Memory:** Avoid creating intermediate arrays when possible (use streaming or generators).\n2. **Complexity:** Cache repeated lookups in local variables.\n3. **Modern APIs:** Prefer \`for...of\` or native high-order methods for clarity.`;
  }
  return `### AI Copilot Ready\n\nTo unlock real-time Gemini AI code reasoning, bug fixing, and test generation, configure your \`GEMINI_API_KEY\` in the AI Studio Secrets panel. The built-in execution engine is running and fully functional!`;
}

startServer();
