export interface LanguageRuntimeDefinition {
  image?: string;
  compile?: string;
  run: string;
  filename?: string;
  timeoutMs?: number;
  memoryMb?: number;
}

export const languageConfig: Record<string, LanguageRuntimeDefinition> = {
  // --- Already Added ---
  "python": { 
    image: "python:3.10-alpine",
    run: "python3 main.py",
    filename: "main.py"
  },
  "cpp": { 
    image: "gcc:latest",
    compile: "g++ main.cpp -o main", 
    run: "./main",
    filename: "main.cpp"
  },
  "java": { 
    image: "openjdk:17-alpine",
    compile: "javac Main.java", 
    run: "java Main",
    filename: "Main.java"
  },

  // --- NEW: Web Languages ---
  "javascript": {
    image: "node:18-alpine",
    run: "node main.js", // No compile needed
    filename: "main.js"
  },
  "typescript": {
    image: "bun:latest", // 'Bun' use karein, ye Node se 10x fast hai
    run: "bun run main.ts", 
    filename: "main.ts"
  },

  // --- NEW: System Languages (High Performance) ---
  "c": {
    image: "gcc:latest",
    compile: "gcc main.c -o main",
    run: "./main",
    filename: "main.c"
  },
  "go": {
    image: "golang:1.20-alpine",
    run: "go run main.go", // 'go run' compile+run dono saath mein karta hai
    filename: "main.go"
  },
  "rust": {
    image: "rust:latest",
    compile: "rustc main.rs -o main", // Rust compiler bahut strict hai
    run: "./main",
    filename: "main.rs"
  },

  // --- NEW: Scripting Languages ---
  "php": {
    image: "php:8.2-cli-alpine",
    run: "php main.php",
    filename: "main.php"
  },
  "ruby": {
    image: "ruby:3.2-alpine",
    run: "ruby main.rb",
    filename: "main.rb"
  },
  
  // --- NEW: Bonus (Resume Flex) ---
  "swift": {
    image: "swift:5.8",
    compile: "swiftc main.swift -o main",
    run: "./main",
    filename: "main.swift"
  },
  "bash": {
    image: "bash:latest",
    run: "bash main.sh",
    filename: "main.sh"
  }
};

/**
 * Returns the resolved runtime configuration for any requested language,
 * with case-insensitive and alias matching.
 */
export function getLanguageRuntime(language: string): LanguageRuntimeDefinition | undefined {
  const norm = (language || "").toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    "c++": "cpp",
    "py": "python",
    "js": "javascript",
    "node": "javascript",
    "ts": "typescript",
    "golang": "go",
    "rs": "rust",
    "sh": "bash",
    "shell": "bash",
    "zsh": "bash",
    "rb": "ruby"
  };

  const key = aliasMap[norm] || norm;
  return languageConfig[key];
}
