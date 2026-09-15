import React, { useState } from 'react';
import { Language, ProjectTemplate } from '../types';
import { STARTER_TEMPLATES } from '../data/templates';
import { 
  X, 
  Search, 
  Terminal, 
  FileCode, 
  Binary, 
  Layers, 
  Database, 
  Zap, 
  Server, 
  Code2, 
  Check, 
  Copy, 
  ArrowRight, 
  Plus, 
  Sparkles,
  Cpu,
  Globe,
  BookOpen,
  Play
} from 'lucide-react';

export interface LanguageInfo {
  id: Language | 'fastapi' | 'django' | 'react';
  language: Language;
  name: string;
  category: 'Systems & CP' | 'Web & Frameworks' | 'Data & SQL' | 'General & Scripting';
  version: string;
  compiler: string;
  description: string;
  features: string[];
  fileExtension: string;
  defaultFileName: string;
  sampleCode: string;
  templateId?: string;
  accentColor: string;
  badgeBg: string;
}

export const ALL_LANGUAGES: LanguageInfo[] = [
  {
    id: 'cpp',
    language: 'cpp',
    name: 'C++ (C++20 / GCC 13)',
    category: 'Systems & CP',
    version: 'C++20 ISO',
    compiler: 'GCC 13.2 / Clang Fast VM',
    description: 'High-performance systems programming and competitive programming with complete STL (vector, map, algorithm).',
    features: ['STL Containers', 'Fast I/O (cin/cout)', 'Template Metaprogramming', 'Standard Algorithms'],
    fileExtension: '.cpp',
    defaultFileName: 'main.cpp',
    templateId: 'cpp-algo-suite',
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    sampleCode: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> nums = {45, 12, 89, 23, 7, 90};
    sort(nums.begin(), nums.end());
    
    cout << "Sorted C++ Array: ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    return 0;
}`,
  },
  {
    id: 'fastapi',
    language: 'python',
    name: 'FastAPI Microservice',
    category: 'Web & Frameworks',
    version: 'FastAPI 0.110 / Python 3.12',
    compiler: 'Uvicorn ASGI + Pydantic v2',
    description: 'Modern, high-performance web framework for building REST APIs with automatic request validation, OpenAPI docs & TestClient.',
    features: ['Pydantic Schemas', 'Path & Query Validation', 'HTTPException Handlers', 'Interactive API Tester'],
    fileExtension: '.py',
    defaultFileName: 'main.py',
    templateId: 'fastapi-microservice-suite',
    accentColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    sampleCode: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="CloudIDE Microservice")

class Product(BaseModel):
    name: str
    price: float
    in_stock: bool = True

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FastAPI"}

@app.post("/api/products")
def create_product(prod: Product):
    return {"created": True, "data": prod.model_dump()}`,
  },
  {
    id: 'django',
    language: 'python',
    name: 'Django Web Service & ORM',
    category: 'Web & Frameworks',
    version: 'Django 5.0 / Python 3.12',
    compiler: 'Django Standalone + SQLite ORM',
    description: 'Batteries-included web framework with SQLite in-memory ORM models, migrations, JSON response views, and Client testing.',
    features: ['SQLite In-Memory ORM', 'Schema Migrations', 'URL Dispatcher', 'Django Test Client'],
    fileExtension: '.py',
    defaultFileName: 'app.py',
    templateId: 'django-orm-webservice',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    sampleCode: `import django
from django.conf import settings
from django.http import JsonResponse
from django.urls import path

# Django Standalone App
def api_index(request):
    return JsonResponse({"message": "Hello from Django 5!"})

urlpatterns = [
    path('api/django/', api_index),
]`,
  },
  {
    id: 'python',
    language: 'python',
    name: 'Python 3.12 (Data & ML)',
    category: 'General & Scripting',
    version: 'Python 3.12.2',
    compiler: 'CPython 3.12 / WebAssembly VM',
    description: 'General-purpose programming, data visualization (Matplotlib plots & charts), numerical calculations, and algorithms.',
    features: ['Matplotlib Interactive Plots', 'NumPy Matrix math', 'Object-Oriented Classes', 'Standard Input Streams'],
    fileExtension: '.py',
    defaultFileName: 'script.py',
    templateId: 'python-matplotlib-analytics',
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    sampleCode: `import math

def calculate_fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print("Fibonacci Sequence (first 10):", calculate_fibonacci(10))`,
  },
  {
    id: 'java',
    language: 'java',
    name: 'Java (OpenJDK 17)',
    category: 'Systems & CP',
    version: 'Java SE 17 (LTS)',
    compiler: 'OpenJDK 17 / JVM Engine',
    description: 'Object-oriented programming language with robust standard libraries, collections framework, and Scanner standard input.',
    features: ['OOP Architecture', 'Java Collections (List, Map)', 'Scanner standard input', 'Stream API & Lambdas'],
    fileExtension: '.java',
    defaultFileName: 'Main.java',
    templateId: 'java-data-structures-suite',
    accentColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    sampleCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("Java", "Kotlin", "Scala");
        System.out.println("JVM Languages List: " + list);
    }
}`,
  },
  {
    id: 'c',
    language: 'c',
    name: 'C (C11 Standard)',
    category: 'Systems & CP',
    version: 'C11 ISO/IEC 9899',
    compiler: 'GCC 13.2 / Clang VM',
    description: 'Low-level procedural language with direct memory manipulation, pointer arithmetic, struct modeling, and stdio streams.',
    features: ['Pointers & Memory', 'Struct Data Types', 'scanf & printf I/O', 'High Speed Execution'],
    fileExtension: '.c',
    defaultFileName: 'main.c',
    templateId: 'c-matrix-pointers-suite',
    accentColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    sampleCode: `#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int sum = 0;
    int length = sizeof(arr) / sizeof(arr[0]);

    for (int i = 0; i < length; i++) {
        sum += arr[i];
    }

    printf("C Sum: %d | Mean: %.2f\\n", sum, (float)sum / length);
    return 0;
}`,
  },
  {
    id: 'sql',
    language: 'sql',
    name: 'SQL (SQLite 3 Database)',
    category: 'Data & SQL',
    version: 'SQLite 3.42 / ANSI SQL',
    compiler: 'SQLite In-Memory DB Engine',
    description: 'Relational database query language for table creation, relational schema joins, indexes, aggregation, and data analysis.',
    features: ['In-Memory Database', 'Visual Table Grid', 'CREATE / INSERT / SELECT / JOIN', 'Aggregate Analytics'],
    fileExtension: '.sql',
    defaultFileName: 'query.sql',
    templateId: 'sql-relational-analytics',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    sampleCode: `-- Create Table and Insert Data
CREATE TABLE developers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    experience_yrs INTEGER
);

INSERT INTO developers (name, role, experience_yrs) VALUES
('Alex Rivera', 'Backend Engineer', 5),
('Sam Chen', 'Data Scientist', 4),
('Morgan Taylor', 'Frontend Architect', 7);

SELECT * FROM developers WHERE experience_yrs >= 5;`,
  },
  {
    id: 'typescript',
    language: 'typescript',
    name: 'TypeScript 5.x',
    category: 'General & Scripting',
    version: 'TypeScript 5.4',
    compiler: 'V8 Engine / TS Transpiler',
    description: 'Typed superset of JavaScript providing static type checking, interfaces, enums, generics, and modern ES features.',
    features: ['Strict Typing', 'Interfaces & Enums', 'Generics', 'Modern ES2024 Modules'],
    fileExtension: '.ts',
    defaultFileName: 'index.ts',
    templateId: 'ts-canvas-visualizer',
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    sampleCode: `interface User {
    id: number;
    name: string;
    role: 'admin' | 'developer' | 'viewer';
}

const users: User[] = [
    { id: 1, name: 'Alice', role: 'developer' },
    { id: 2, name: 'Bob', role: 'admin' }
];

console.log("TypeScript Users:", users);`,
  },
  {
    id: 'javascript',
    language: 'javascript',
    name: 'JavaScript (Node / ES2024)',
    category: 'General & Scripting',
    version: 'ECMAScript 2024',
    compiler: 'V8 JavaScript Virtual Machine',
    description: 'Universal language for web applications, algorithms, asynchronous event loops, promises, and interactive consoles.',
    features: ['Async / Await', 'Array Methods (map, filter)', 'JSON Parsing', 'DOM Manipulation'],
    fileExtension: '.js',
    defaultFileName: 'script.js',
    accentColor: 'text-yellow-300',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    sampleCode: `// Asynchronous JavaScript Operations
const fetchData = async () => {
    const data = [1, 2, 3, 4, 5];
    const squares = data.map(x => x * x);
    console.log("Squared Numbers:", squares);
};

fetchData();`,
  },
  {
    id: 'react',
    language: 'typescript',
    name: 'React 18 & JSX / TSX',
    category: 'Web & Frameworks',
    version: 'React 18.2 / Tailwind CSS',
    compiler: 'Live Web Preview Engine',
    description: 'Component-based UI library with hooks (useState, useEffect), reactive state management, and real-time live browser preview.',
    features: ['React Hooks', 'Tailwind CSS Classes', 'Live Iframe Preview', 'Interactive UI Components'],
    fileExtension: '.tsx',
    defaultFileName: 'App.tsx',
    templateId: 'react-interactive-dashboard',
    accentColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    sampleCode: `import React, { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div className="p-4 bg-slate-900 text-white rounded-lg">
            <h2 className="text-xl font-bold">Count: {count}</h2>
            <button onClick={() => setCount(c => c + 1)} className="mt-2 px-3 py-1 bg-indigo-600 rounded">
                Increment
            </button>
        </div>
    );
}`,
  },
  {
    id: 'html',
    language: 'html',
    name: 'HTML5 & CSS3 Web Canvas',
    category: 'Web & Frameworks',
    version: 'HTML5 / CSS3',
    compiler: 'Live Browser Renderer',
    description: 'Modern standard web markup with responsive styling, animations, canvas APIs, and full interactive preview support.',
    features: ['Responsive Layouts', 'CSS3 Animations', 'Canvas 2D Graphics', 'Live DOM Sandbox'],
    fileExtension: '.html',
    defaultFileName: 'index.html',
    templateId: 'web-canvas-particles',
    accentColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    sampleCode: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0f172a; color: #38bdf8; font-family: sans-serif; display: grid; place-items: center; height: 100vh; }
  </style>
</head>
<body>
  <h1>Hello from Live HTML5 Preview!</h1>
</body>
</html>`,
  },
  {
    id: 'json',
    language: 'json',
    name: 'JSON Data & Configs',
    category: 'Data & SQL',
    version: 'RFC 8259 Standard',
    compiler: 'JSON Schema Validator',
    description: 'Lightweight data interchange format for REST API payloads, application configs, database seeds, and settings.',
    features: ['Key-Value Structures', 'Nested Arrays & Objects', 'Strict Syntax Validation', 'Pretty Formatter'],
    fileExtension: '.json',
    defaultFileName: 'data.json',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    sampleCode: `{
  "projectName": "CloudIDE Studio",
  "version": "2.4.0",
  "languagesSupported": 12,
  "settings": {
    "autoSave": true,
    "theme": "vs-dark"
  }
}`,
  }
];

interface LanguagesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage?: (lang: Language) => void;
  onSwitchLanguage?: (lang: Language) => void;
  onCreateFileForLanguage?: (name: string, lang: Language, initialCode?: string) => void;
  onCreateFile?: (name: string, lang: Language, initialCode?: string) => void;
  onLoadTemplate?: (template: ProjectTemplate) => void;
  onSelectTemplate?: (template: ProjectTemplate) => void;
  currentLanguage?: Language;
  activeLanguage?: Language;
}

export const LanguagesHubModal: React.FC<LanguagesHubModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage,
  onSwitchLanguage,
  onCreateFileForLanguage,
  onCreateFile,
  onLoadTemplate,
  onSelectTemplate,
  currentLanguage,
  activeLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePreviewLang, setActivePreviewLang] = useState<LanguageInfo>(ALL_LANGUAGES[0]);

  const handleSwitch = onSelectLanguage || onSwitchLanguage || (() => {});
  const handleCreate = onCreateFileForLanguage || onCreateFile || (() => {});
  const handleTemplate = onLoadTemplate || onSelectTemplate || (() => {});
  const effectiveCurrentLang = currentLanguage || activeLanguage || 'cpp';

  if (!isOpen) return null;

  const categories = ['All', 'Systems & CP', 'Web & Frameworks', 'Data & SQL', 'General & Scripting'];

  const filteredLanguages = ALL_LANGUAGES.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.version.toLowerCase().includes(q) ||
        item.compiler.toLowerCase().includes(q) ||
        item.features.some(f => f.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyCode = (langInfo: LanguageInfo) => {
    navigator.clipboard.writeText(langInfo.sampleCode);
    setCopiedId(langInfo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Systems & CP':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'Web & Frameworks':
        return <Globe className="w-4 h-4 text-yellow-400" />;
      case 'Data & SQL':
        return <Database className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Languages & Frameworks Hub</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  {ALL_LANGUAGES.length} Supported
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch languages, create source files, or launch verified starter sandboxes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search language, compiler, framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
        </div>

        {/* Content: Left Languages List, Right Details & Starter Snippet */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Language Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 custom-scrollbar">
            {filteredLanguages.map(item => {
              const isSelected = activePreviewLang.id === item.id;
              const isCurrentActive = effectiveCurrentLang === item.language;

              return (
                <div
                  key={item.id}
                  onClick={() => setActivePreviewLang(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    {/* Top Row: Title + Version */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${item.accentColor} group-hover:text-white transition-colors`}>
                          {item.name}
                        </span>
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${item.badgeBg}`}>
                        {item.version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Features Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.features.slice(0, 3).map((feat, fIdx) => (
                        <span key={fIdx} className="text-[10px] bg-slate-950/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-auto text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.compiler}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitch(item.language);
                        onClose();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                    >
                      <span>Switch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Preview & Quick Actions Panel */}
          <div className="w-full md:w-96 bg-slate-950/90 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {activePreviewLang.category}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-mono ${activePreviewLang.badgeBg}`}>
                  {activePreviewLang.version}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{activePreviewLang.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activePreviewLang.description}</p>
            </div>

            {/* Runtime & Execution Specs */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Engine / Compiler:</span>
                <span className="font-mono text-slate-200 font-medium">{activePreviewLang.compiler}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Standard Extension:</span>
                <span className="font-mono text-indigo-300 font-semibold">{activePreviewLang.fileExtension}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Default File:</span>
                <span className="font-mono text-slate-200">{activePreviewLang.defaultFileName}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              {/* 1. Create New File with this language */}
              <button
                onClick={() => {
                  handleCreate(activePreviewLang.defaultFileName, activePreviewLang.language, activePreviewLang.sampleCode);
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New {activePreviewLang.defaultFileName}</span>
              </button>

              {/* 2. Switch Current File Language */}
              <button
                onClick={() => {
                  handleSwitch(activePreviewLang.language);
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-indigo-400" />
                <span>Switch Current File to {activePreviewLang.name}</span>
              </button>

              {/* 3. Load Full Starter Template if available */}
              {activePreviewLang.templateId && (
                <button
                  onClick={() => {
                    const tpl = STARTER_TEMPLATES.find(t => t.id === activePreviewLang.templateId);
                    if (tpl) {
                      handleTemplate(tpl);
                      onClose();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>Load {activePreviewLang.name} Starter Project</span>
                </button>
              )}
            </div>

            {/* Starter Code Snippet Box with Copy Button */}
            <div className="flex-1 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Starter Code Boilerplate</span>
                <button
                  onClick={() => handleCopyCode(activePreviewLang)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                >
                  {copiedId === activePreviewLang.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/90 p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed custom-scrollbar">
                <pre className="whitespace-pre-wrap">{activePreviewLang.sampleCode}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Zero install required — all compilers and runtimes execute in-browser / WebAssembly sandboxes</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
