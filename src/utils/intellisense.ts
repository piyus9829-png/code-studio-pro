import { Language, AutocompleteSuggestion } from '../types';

export interface ExtendedSuggestion extends AutocompleteSuggestion {
  doc?: string; // Markdown / text documentation preview
  snippetPreview?: string;
  source?: 'keyword' | 'builtin' | 'framework' | 'snippet' | 'identifier';
  score?: number;
}

// 1. C & C++ Catalog
const CPP_SUGGESTIONS: ExtendedSuggestion[] = [
  // IO & Basics
  { 
    label: 'cout <<', 
    insertText: 'cout <<  << endl;', 
    detail: 'Standard character output stream', 
    kind: 'keyword', 
    doc: 'Writes formatted output to the standard output stream (stdout).\nExample: cout << "Hello " << value << endl;' 
  },
  { 
    label: 'cin >>', 
    insertText: 'cin >> ;', 
    detail: 'Standard character input stream', 
    kind: 'keyword', 
    doc: 'Reads formatted input from the standard input stream (stdin).\nExample: cin >> x >> y;' 
  },
  { 
    label: 'endl', 
    insertText: 'endl', 
    detail: 'Insert newline and flush stream', 
    kind: 'keyword', 
    doc: 'Inserts a newline character into the output sequence and flushes the stream.' 
  },
  { 
    label: 'cerr <<', 
    insertText: 'cerr << "Error: " <<  << endl;', 
    detail: 'Standard error output stream', 
    kind: 'keyword', 
    doc: 'Unbuffered standard error stream for printing diagnostic messages.' 
  },
  { 
    label: '#include <iostream>', 
    insertText: '#include <iostream>\n', 
    detail: 'Header: Standard Input / Output streams', 
    kind: 'snippet',
    doc: 'Includes basic C++ input/output objects: cin, cout, cerr, clog, endl.'
  },
  { 
    label: '#include <vector>', 
    insertText: '#include <vector>\n', 
    detail: 'Header: Dynamic array container', 
    kind: 'snippet',
    doc: 'Defines the std::vector dynamic array container.'
  },
  { 
    label: '#include <algorithm>', 
    insertText: '#include <algorithm>\n', 
    detail: 'Header: Standard algorithm library', 
    kind: 'snippet',
    doc: 'Includes std::sort, std::min, std::max, std::find, std::reverse, std::binary_search, etc.'
  },
  { 
    label: '#include <string>', 
    insertText: '#include <string>\n', 
    detail: 'Header: std::string class', 
    kind: 'snippet',
    doc: 'Includes standard string type and operations.'
  },
  { 
    label: '#include <map>', 
    insertText: '#include <map>\n', 
    detail: 'Header: Red-Black tree associative map', 
    kind: 'snippet' 
  },
  { 
    label: '#include <unordered_map>', 
    insertText: '#include <unordered_map>\n', 
    detail: 'Header: Hash-table associative map', 
    kind: 'snippet' 
  },
  { 
    label: '#include <set>', 
    insertText: '#include <set>\n', 
    detail: 'Header: Ordered unique element container', 
    kind: 'snippet' 
  },
  { 
    label: '#include <queue>', 
    insertText: '#include <queue>\n', 
    detail: 'Header: Queue & Priority Queue', 
    kind: 'snippet' 
  },
  { 
    label: '#include <cmath>', 
    insertText: '#include <cmath>\n', 
    detail: 'Header: Mathematical functions', 
    kind: 'snippet' 
  },
  { 
    label: 'using namespace std;', 
    insertText: 'using namespace std;\n', 
    detail: 'Import standard namespace', 
    kind: 'keyword' 
  },
  { 
    label: 'vector<int>', 
    insertText: 'vector<int> v;', 
    detail: 'Dynamic integer vector', 
    kind: 'type',
    doc: 'std::vector<int> is a sequence container that encapsulates dynamic size arrays.'
  },
  { 
    label: 'vector<string>', 
    insertText: 'vector<string> list;', 
    detail: 'Dynamic string vector', 
    kind: 'type' 
  },
  { 
    label: 'pair<int, int>', 
    insertText: 'pair<int, int> p = {0, 0};', 
    detail: 'Tuple of two elements', 
    kind: 'type' 
  },
  { 
    label: 'sort(v.begin(), v.end())', 
    insertText: 'sort(v.begin(), v.end());', 
    detail: 'Sort elements in container', 
    kind: 'function',
    doc: 'Sorts the elements in range [begin, end) in ascending order with O(N log N) complexity.'
  },
  { 
    label: 'reverse(v.begin(), v.end())', 
    insertText: 'reverse(v.begin(), v.end());', 
    detail: 'Reverse container elements', 
    kind: 'function' 
  },
  { 
    label: 'min(a, b)', 
    insertText: 'min(a, b)', 
    detail: 'Return smaller of two values', 
    kind: 'function' 
  },
  { 
    label: 'max(a, b)', 
    insertText: 'max(a, b)', 
    detail: 'Return greater of two values', 
    kind: 'function' 
  },
  { 
    label: 'swap(a, b)', 
    insertText: 'swap(a, b);', 
    detail: 'Exchange values of two variables', 
    kind: 'function' 
  },
  { 
    label: 'push_back()', 
    insertText: 'push_back();', 
    detail: 'Append element to vector', 
    kind: 'function' 
  },
  { 
    label: 'emplace_back()', 
    insertText: 'emplace_back();', 
    detail: 'Construct element in-place at back', 
    kind: 'function' 
  },
  { 
    label: 'int main()', 
    insertText: 'int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    return 0;\n}', 
    detail: 'Fast I/O C++ Main Template', 
    kind: 'snippet',
    doc: 'Standard fast I/O C++ entry point with std::ios_base::sync_with_stdio(false).'
  },
  { 
    label: 'for (int i = 0; i < n; i++)', 
    insertText: 'for (int i = 0; i < n; i++) {\n    \n}', 
    detail: 'Indexed for loop', 
    kind: 'snippet' 
  },
  { 
    label: 'for (auto& item : container)', 
    insertText: 'for (const auto& item : items) {\n    \n}', 
    detail: 'Range-based for loop', 
    kind: 'snippet' 
  },
  { 
    label: 'while (cin >> x)', 
    insertText: 'while (cin >> x) {\n    \n}', 
    detail: 'Read until end of file stream', 
    kind: 'snippet' 
  },
  { 
    label: 'struct Node', 
    insertText: 'struct Node {\n    int val;\n    Node* next;\n    Node(int x) : val(x), next(nullptr) {}\n};', 
    detail: 'Linked list node definition', 
    kind: 'snippet' 
  },
  { 
    label: 'class Solution', 
    insertText: 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};', 
    detail: 'Competitive programming class', 
    kind: 'snippet' 
  },
  // C-specific additions
  { 
    label: '#include <stdio.h>', 
    insertText: '#include <stdio.h>\n', 
    detail: 'C Standard I/O library', 
    kind: 'snippet' 
  },
  { 
    label: '#include <stdlib.h>', 
    insertText: '#include <stdlib.h>\n', 
    detail: 'C Standard General Utility Library', 
    kind: 'snippet' 
  },
  { 
    label: '#include <string.h>', 
    insertText: '#include <string.h>\n', 
    detail: 'C String handling functions', 
    kind: 'snippet' 
  },
  { 
    label: 'printf("...", ...)', 
    insertText: 'printf("%d\\n", );', 
    detail: 'Print formatted output to stdout', 
    kind: 'function',
    doc: 'int printf(const char *format, ...);\nWrites formatted data to standard output.'
  },
  { 
    label: 'scanf("...", &...)', 
    insertText: 'scanf("%d", &);', 
    detail: 'Read formatted input from stdin', 
    kind: 'function',
    doc: 'int scanf(const char *format, ...);\nReads formatted input from standard input stream.'
  },
  { 
    label: 'malloc(size)', 
    insertText: '(int*)malloc(n * sizeof(int));', 
    detail: 'Allocate dynamic memory block', 
    kind: 'function' 
  },
  { 
    label: 'free(ptr)', 
    insertText: 'free(ptr);', 
    detail: 'Deallocate dynamic memory block', 
    kind: 'function' 
  },
  { 
    label: 'sizeof(type)', 
    insertText: 'sizeof()', 
    detail: 'Return byte size of object or type', 
    kind: 'keyword' 
  },
];

// 2. Python & Modern Frameworks Catalog (FastAPI, Django, Flask, PyData)
const PYTHON_SUGGESTIONS: ExtendedSuggestion[] = [
  // Core Keywords
  { 
    label: 'import', 
    insertText: 'import ', 
    detail: 'Import module into namespace', 
    kind: 'keyword',
    doc: 'Imports an entire module or package into the current namespace.\nExample: import math, sys'
  },
  { 
    label: 'from ... import ...', 
    insertText: 'from  import ', 
    detail: 'Import specific symbols from module', 
    kind: 'keyword',
    doc: 'Imports specific attributes, classes, or functions from a module.'
  },
  { 
    label: 'def function_name():', 
    insertText: 'def function_name(arg1, arg2):\n    """Docstring."""\n    return ', 
    detail: 'Define Python function', 
    kind: 'snippet',
    doc: 'Declares a user-defined function with arguments and optional return value.'
  },
  { 
    label: 'async def handler():', 
    insertText: 'async def handler():\n    return {"status": "ok"}', 
    detail: 'Asynchronous coroutine function', 
    kind: 'snippet',
    doc: 'Defines an async coroutine for use with asyncio, FastAPI, or Django async views.'
  },
  { 
    label: 'class ClassName:', 
    insertText: 'class ClassName:\n    def __init__(self, name: str):\n        self.name = name\n', 
    detail: 'Define Python class', 
    kind: 'snippet' 
  },
  { 
    label: 'if __name__ == "__main__":', 
    insertText: 'if __name__ == "__main__":\n    ', 
    detail: 'Script entry point guard', 
    kind: 'snippet',
    doc: 'Boilerplate guard ensuring code executes only when run as a standalone script.'
  },
  { 
    label: 'print()', 
    insertText: 'print()', 
    detail: 'Print objects to the text stream', 
    kind: 'function',
    doc: 'print(*objects, sep=" ", end="\\n", file=sys.stdout, flush=False)'
  },
  { 
    label: 'input()', 
    insertText: 'input("Enter value: ")', 
    detail: 'Read string line from standard input', 
    kind: 'function',
    doc: 'Reads a line from input, converts it to a string, and returns it.'
  },
  { 
    label: 'len(sequence)', 
    insertText: 'len()', 
    detail: 'Return number of items in container', 
    kind: 'function' 
  },
  { 
    label: 'range(start, stop, step)', 
    insertText: 'range(len())', 
    detail: 'Generate sequence of numbers', 
    kind: 'function' 
  },
  { 
    label: 'enumerate(iterable)', 
    insertText: 'enumerate()', 
    detail: 'Return index and item pair iterator', 
    kind: 'function' 
  },
  { 
    label: 'zip(*iterables)', 
    insertText: 'zip()', 
    detail: 'Aggregate elements from multiple iterables', 
    kind: 'function' 
  },
  { 
    label: 'try ... except ... finally:', 
    insertText: 'try:\n    \nexcept Exception as e:\n    print(f"Error: {e}")\nfinally:\n    ', 
    detail: 'Exception handling block', 
    kind: 'snippet' 
  },
  { 
    label: 'with open("file.txt", "r") as f:', 
    insertText: 'with open("file.txt", "r") as f:\n    content = f.read()\n', 
    detail: 'Safe file context manager', 
    kind: 'snippet' 
  },
  { 
    label: '[x for x in items if cond]', 
    insertText: '[x for x in items if condition]', 
    detail: 'List comprehension', 
    kind: 'snippet' 
  },
  { 
    label: '{k: v for k, v in items}', 
    insertText: '{k: v for k, v in dict_items}', 
    detail: 'Dictionary comprehension', 
    kind: 'snippet' 
  },

  // FastAPI Suggestions & Snippets
  { 
    label: 'FastAPI()', 
    insertText: 'from fastapi import FastAPI, HTTPException, Depends\n\napp = FastAPI(title="Cloud API", version="1.0.0")\n', 
    detail: 'FastAPI Application instance', 
    kind: 'snippet',
    doc: 'Creates a modern, high-performance ASGI FastAPI application.'
  },
  { 
    label: '@app.get("/path")', 
    insertText: '@app.get("/items/{item_id}")\nasync def get_item(item_id: int):\n    return {"item_id": item_id, "status": "active"}\n', 
    detail: 'FastAPI GET route handler', 
    kind: 'snippet',
    doc: 'Defines an HTTP GET endpoint with automatic parameter validation and OpenAPI schema.'
  },
  { 
    label: '@app.post("/path")', 
    insertText: '@app.post("/items")\nasync def create_item(payload: ItemSchema):\n    return {"message": "created", "data": payload}\n', 
    detail: 'FastAPI POST route handler', 
    kind: 'snippet' 
  },
  { 
    label: 'BaseModel (Pydantic)', 
    insertText: 'from pydantic import BaseModel, Field\n\nclass ItemModel(BaseModel):\n    name: str\n    price: float\n    is_available: bool = True\n', 
    detail: 'Pydantic Data Schema', 
    kind: 'snippet',
    doc: 'Pydantic model for automatic request body parsing, type-casting, and JSON serialization.'
  },
  { 
    label: 'HTTPException(status_code=404)', 
    insertText: 'raise HTTPException(status_code=404, detail="Item not found")', 
    detail: 'FastAPI HTTP Error Exception', 
    kind: 'function' 
  },
  { 
    label: 'uvicorn.run()', 
    insertText: 'import uvicorn\n\nif __name__ == "__main__":\n    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)\n', 
    detail: 'Uvicorn ASGI Server runner', 
    kind: 'snippet' 
  },

  // Django Suggestions & Snippets
  { 
    label: 'from django.http import HttpResponse, JsonResponse', 
    insertText: 'from django.http import HttpResponse, JsonResponse\n', 
    detail: 'Django HTTP response classes', 
    kind: 'snippet' 
  },
  { 
    label: 'from django.shortcuts import render, get_object_or_404', 
    insertText: 'from django.shortcuts import render, get_object_or_404\n', 
    detail: 'Django shortcut helpers', 
    kind: 'snippet' 
  },
  { 
    label: 'from django.urls import path', 
    insertText: 'from django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path("", views.home_view, name="home"),\n]\n', 
    detail: 'Django URL configuration pattern', 
    kind: 'snippet' 
  },
  { 
    label: 'models.Model (Django ORM)', 
    insertText: 'from django.db import models\n\nclass Product(models.Model):\n    name = models.CharField(max_length=100)\n    price = models.DecimalField(max_digits=8, decimal_places=2)\n    created_at = models.DateTimeField(auto_now_add=True)\n\n    def __str__(self):\n        return self.name\n', 
    detail: 'Django ORM Database Model', 
    kind: 'snippet' 
  },
  { 
    label: 'def view(request):', 
    insertText: 'def index(request):\n    context = {"title": "Django Workspace"}\n    return render(request, "index.html", context)\n', 
    detail: 'Django Function-based View', 
    kind: 'snippet' 
  },

  // Flask Suggestions & Snippets
  { 
    label: 'Flask app scaffold', 
    insertText: 'from flask import Flask, request, jsonify\n\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return jsonify({"message": "Hello from Flask!"})\n\nif __name__ == "__main__":\n    app.run(debug=True)\n', 
    detail: 'Complete Flask Application Template', 
    kind: 'snippet' 
  },
];

// 3. JavaScript & TypeScript Catalog
const JS_TS_SUGGESTIONS: ExtendedSuggestion[] = [
  // Core Keywords
  { label: 'const', insertText: 'const  = ;', detail: 'Declare block-scoped constant', kind: 'keyword' },
  { label: 'let', insertText: 'let  = ;', detail: 'Declare block-scoped mutable variable', kind: 'keyword' },
  { label: 'function', insertText: 'function name(params) {\n    \n}', detail: 'Function declaration', kind: 'snippet' },
  { label: 'async function', insertText: 'async function name(params) {\n    \n}', detail: 'Asynchronous function declaration', kind: 'snippet' },
  { label: 'arrow function', insertText: 'const func = (params) => {\n    \n};', detail: 'Arrow function expression', kind: 'snippet' },
  { label: 'import ... from ...', insertText: "import {  } from '';", detail: 'ES Module named import', kind: 'keyword' },
  { label: 'export default', insertText: 'export default ', detail: 'ES Module default export', kind: 'keyword' },
  { label: 'console.log()', insertText: 'console.log();', detail: 'Write message to web console', kind: 'function', doc: 'console.log(data, ...args);\nOutputs a message to the debugging console.' },
  { label: 'console.error()', insertText: 'console.error();', detail: 'Write error message to web console', kind: 'function' },
  { label: 'console.table()', insertText: 'console.table();', detail: 'Display tabular data in console', kind: 'function' },
  { label: 'console.time()', insertText: 'console.time("timer");\nconsole.timeEnd("timer");', detail: 'Measure code execution duration', kind: 'function' },
  { label: 'JSON.stringify()', insertText: 'JSON.stringify(obj, null, 2)', detail: 'Convert JS value to JSON string', kind: 'function' },
  { label: 'JSON.parse()', insertText: 'JSON.parse()', detail: 'Parse JSON string into JS object', kind: 'function' },
  { label: 'Promise.all()', insertText: 'await Promise.all([p1, p2]);', detail: 'Wait for all promises to resolve', kind: 'function' },
  { label: 'fetch() (GET)', insertText: 'const res = await fetch(url);\nconst data = await res.json();\n', detail: 'Fetch JSON API resource', kind: 'snippet' },
  { label: 'fetch() (POST JSON)', insertText: "const res = await fetch(url, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(payload)\n});\nconst data = await res.json();\n", detail: 'HTTP POST JSON Request', kind: 'snippet' },
  { label: '.map()', insertText: '.map(item => item)', detail: 'Transform array elements', kind: 'function' },
  { label: '.filter()', insertText: '.filter(item => item !== null)', detail: 'Filter array by predicate', kind: 'function' },
  { label: '.reduce()', insertText: '.reduce((acc, curr) => acc + curr, 0)', detail: 'Accumulate array elements', kind: 'function' },
  { label: '.find()', insertText: '.find(item => item.id === id)', detail: 'Find first matching element', kind: 'function' },
  { label: 'setTimeout()', insertText: 'setTimeout(() => {\n    \n}, 1000);', detail: 'Delayed execution timer', kind: 'function' },
  { label: 'setInterval()', insertText: 'const interval = setInterval(() => {\n    \n}, 1000);', detail: 'Repeated timer interval', kind: 'function' },
  { label: 'interface InterfaceName', insertText: 'interface User {\n    id: string;\n    name: string;\n    email: string;\n}', detail: 'TypeScript Interface', kind: 'type' },
  { label: 'type TypeAlias', insertText: 'type Status = "idle" | "loading" | "success" | "error";', detail: 'TypeScript Union / Type alias', kind: 'type' },
  { label: 'try ... catch', insertText: 'try {\n    \n} catch (err) {\n    console.error(err);\n}', detail: 'Try-catch error boundary', kind: 'snippet' },
];

// 4. SQL Catalog
const SQL_SUGGESTIONS: ExtendedSuggestion[] = [
  { label: 'SELECT * FROM table', insertText: 'SELECT * FROM ;', detail: 'Query rows from table', kind: 'keyword', doc: 'Retrieves all columns and rows from specified table.' },
  { label: 'SELECT ... WHERE ...', insertText: 'SELECT id, name FROM users WHERE active = 1 ORDER BY created_at DESC;', detail: 'Filtered query', kind: 'snippet' },
  { label: 'INSERT INTO table VALUES', insertText: 'INSERT INTO table_name (col1, col2) VALUES (val1, val2);', detail: 'Insert record', kind: 'keyword' },
  { label: 'UPDATE table SET ... WHERE', insertText: 'UPDATE users SET status = "verified" WHERE id = 1;', detail: 'Update record', kind: 'keyword' },
  { label: 'DELETE FROM table WHERE', insertText: 'DELETE FROM users WHERE id = 1;', detail: 'Delete record', kind: 'keyword' },
  { label: 'CREATE TABLE', insertText: 'CREATE TABLE users (\n    id INT PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);', detail: 'Create database table', kind: 'snippet' },
  { label: 'INNER JOIN', insertText: 'INNER JOIN orders ON orders.user_id = users.id', detail: 'Match matching rows across tables', kind: 'keyword' },
  { label: 'LEFT JOIN', insertText: 'LEFT JOIN orders ON orders.user_id = users.id', detail: 'Keep all left table rows', kind: 'keyword' },
  { label: 'GROUP BY ... HAVING', insertText: 'GROUP BY department HAVING count(*) > 5', detail: 'Group and filter aggregated results', kind: 'keyword' },
  { label: 'COUNT(*)', insertText: 'COUNT(*)', detail: 'Aggregate total row count', kind: 'function' },
  { label: 'SUM(column)', insertText: 'SUM()', detail: 'Aggregate sum total', kind: 'function' },
  { label: 'AVG(column)', insertText: 'AVG()', detail: 'Calculate average numeric value', kind: 'function' },
];

// 5. HTML & Web Catalog
const HTML_SUGGESTIONS: ExtendedSuggestion[] = [
  { label: '<!DOCTYPE html>', insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>', detail: 'HTML5 Boilerplate Template', kind: 'snippet' },
  { label: '<div className="">', insertText: '<div className="">\n  \n</div>', detail: 'Division container', kind: 'snippet' },
  { label: '<button className="">', insertText: '<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">\n  Click Me\n</button>', detail: 'Interactive Button', kind: 'snippet' },
  { label: '<input type="text" />', insertText: '<input type="text" placeholder="Enter text..." className="px-3 py-1.5 border rounded-lg" />', detail: 'Text input element', kind: 'snippet' },
  { label: '<form onSubmit={}>', insertText: '<form onSubmit={handleSubmit} className="space-y-4">\n  \n</form>', detail: 'Form container', kind: 'snippet' },
  { label: '<script src="">', insertText: '<script src="app.js"></script>', detail: 'JavaScript script tag', kind: 'snippet' },
  { label: '<link rel="stylesheet">', insertText: '<link rel="stylesheet" href="style.css">', detail: 'CSS Stylesheet link', kind: 'snippet' },
];

// 6. Java Catalog
const JAVA_SUGGESTIONS: ExtendedSuggestion[] = [
  { label: 'public class Main', insertText: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java!");\n    }\n}', detail: 'Java Application Class Scaffold', kind: 'snippet' },
  { label: 'System.out.println()', insertText: 'System.out.println();', detail: 'Print to stdout with newline', kind: 'function' },
  { label: 'Scanner sc = new Scanner(System.in)', insertText: 'Scanner sc = new Scanner(System.in);\nint n = sc.nextInt();\n', detail: 'Standard console input scanner', kind: 'snippet' },
  { label: 'ArrayList<Integer>', insertText: 'ArrayList<Integer> list = new ArrayList<>();', detail: 'Dynamic Array List', kind: 'type' },
  { label: 'HashMap<String, Integer>', insertText: 'HashMap<String, Integer> map = new HashMap<>();', detail: 'Key-Value Hash Map', kind: 'type' },
  { label: 'for (int i = 0; i < n; i++)', insertText: 'for (int i = 0; i < n; i++) {\n    \n}', detail: 'Indexed for loop', kind: 'snippet' },
];

// Map language keys to catalogs
export const LANGUAGE_INTELLISENSE: Record<string, ExtendedSuggestion[]> = {
  cpp: CPP_SUGGESTIONS,
  c: CPP_SUGGESTIONS,
  python: PYTHON_SUGGESTIONS,
  javascript: JS_TS_SUGGESTIONS,
  typescript: JS_TS_SUGGESTIONS,
  sql: SQL_SUGGESTIONS,
  html: HTML_SUGGESTIONS,
  css: [
    { label: 'display: flex;', insertText: 'display: flex;\njustify-content: center;\nalign-items: center;', detail: 'Flexbox center container', kind: 'snippet' },
    { label: 'display: grid;', insertText: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\ngap: 1rem;', detail: 'Responsive CSS Grid', kind: 'snippet' },
    { label: 'background-color:', insertText: 'background-color: #1e293b;', detail: 'Background color property', kind: 'keyword' },
    { label: 'border-radius:', insertText: 'border-radius: 0.5rem;', detail: 'Border radius property', kind: 'keyword' },
    { label: 'box-shadow:', insertText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);', detail: 'Drop shadow property', kind: 'keyword' },
  ],
  java: JAVA_SUGGESTIONS,
};

/**
 * Harvest user identifiers (variable names, functions, classes) from current buffer
 */
export function extractIdentifiersFromCode(code: string, language: Language): ExtendedSuggestion[] {
  const identifiers = new Set<string>();
  const results: ExtendedSuggestion[] = [];

  // Generic identifier extraction
  const idRegex = /[a-zA-Z_$][a-zA-Z0-9_$]{2,}/g;
  let match: RegExpExecArray | null;

  while ((match = idRegex.exec(code)) !== null) {
    const word = match[0];
    // Filter out obvious numbers or common language short keywords
    if (word.length >= 3 && !['true', 'false', 'null', 'void', 'this', 'self'].includes(word)) {
      identifiers.add(word);
    }
  }

  // Detect Python def functions
  const defRegex = /def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g;
  while ((match = defRegex.exec(code)) !== null) {
    const fnName = match[1];
    const params = match[2];
    results.push({
      label: `${fnName}(${params})`,
      insertText: `${fnName}()`,
      detail: 'User Function',
      kind: 'function',
      source: 'identifier',
      doc: `Locally defined Python function in current file.\nParameters: (${params})`
    });
    identifiers.delete(fnName);
  }

  // Detect JS/TS functions & const
  const jsFnRegex = /(?:function|const|let|var)\s+([a-zA-Z0-9_$]+)\s*(?:=\s*(?:async\s*)?\((.*?)\)|=\s*function|\((.*?)\))/g;
  while ((match = jsFnRegex.exec(code)) !== null) {
    const name = match[1];
    const params = match[2] || match[3] || '';
    results.push({
      label: params ? `${name}(${params})` : name,
      insertText: params ? `${name}()` : name,
      detail: 'Local Variable / Function',
      kind: params ? 'function' : 'variable',
      source: 'identifier'
    });
    identifiers.delete(name);
  }

  // Add remaining identifiers
  Array.from(identifiers).slice(0, 30).forEach(id => {
    results.push({
      label: id,
      insertText: id,
      detail: 'Identifier',
      kind: 'variable',
      source: 'identifier',
    });
  });

  return results;
}

/**
 * Smart fuzzy search & scoring of suggestions
 */
export function getSmartSuggestions(
  prefix: string,
  language: Language,
  codeBuffer: string
): ExtendedSuggestion[] {
  const cleanPrefix = prefix.trim().toLowerCase();
  if (!cleanPrefix) return [];

  const baseCatalog = LANGUAGE_INTELLISENSE[language] || LANGUAGE_INTELLISENSE['javascript'] || [];
  const localIdentifiers = extractIdentifiersFromCode(codeBuffer, language);
  const allCandidates = [...baseCatalog, ...localIdentifiers];

  const scored: Array<{ item: ExtendedSuggestion; score: number }> = [];

  for (const item of allCandidates) {
    const labelLower = item.label.toLowerCase();
    const insertLower = item.insertText.toLowerCase();

    let score = -1;

    // 1. Exact start match on label or insert text (e.g. "cou" -> "cout")
    if (labelLower.startsWith(cleanPrefix) || insertLower.startsWith(cleanPrefix)) {
      score = 100 - (item.label.length - cleanPrefix.length);
      if (labelLower === cleanPrefix) score += 50;
    } 
    // 2. Substring match inside label (e.g. "out" -> "cout")
    else if (labelLower.includes(cleanPrefix)) {
      score = 60 - labelLower.indexOf(cleanPrefix);
    } 
    // 3. Subsequence fuzzy match (e.g. "cst" -> "const")
    else {
      let pIdx = 0;
      let matchedChars = 0;
      for (let i = 0; i < labelLower.length && pIdx < cleanPrefix.length; i++) {
        if (labelLower[i] === cleanPrefix[pIdx]) {
          pIdx++;
          matchedChars++;
        }
      }
      if (pIdx === cleanPrefix.length) {
        score = 30 + matchedChars;
      }
    }

    if (score > 0) {
      // Prioritize snippets and keywords appropriately
      if (item.kind === 'keyword') score += 10;
      if (item.source === 'identifier') score += 5;
      scored.push({ item, score });
    }
  }

  // Sort descending by score and deduplicate by label
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const finalSuggestions: ExtendedSuggestion[] = [];

  for (const { item, score } of scored) {
    if (!seen.has(item.label)) {
      seen.add(item.label);
      finalSuggestions.push({ ...item, score });
    }
    if (finalSuggestions.length >= 10) break;
  }

  return finalSuggestions;
}

export interface HoverDocParam {
  name: string;
  type?: string;
  doc?: string;
}

export interface HoverInfo {
  name: string;
  kind: 'function' | 'class' | 'struct' | 'interface' | 'type' | 'keyword' | 'module' | 'variable' | 'method' | 'constant' | 'property' | 'snippet';
  signature: string;
  detail?: string;
  doc?: string;
  params?: HoverDocParam[];
  returns?: string;
  example?: string;
  source?: 'builtin' | 'user' | 'framework' | 'library';
  language?: string;
}

/**
 * Built-in standard library & framework hover documentation database
 */
const BUILTIN_HOVER_DOCS: Record<string, Record<string, HoverInfo>> = {
  cpp: {
    cout: {
      name: 'std::cout',
      kind: 'variable',
      signature: 'extern std::ostream cout;',
      detail: 'Standard character output stream',
      doc: 'std::cout is the standard output stream object of type std::ostream. Output is buffered and sent to stdout.',
      example: 'std::cout << "Value: " << x << std::endl;',
      source: 'builtin',
    },
    cin: {
      name: 'std::cin',
      kind: 'variable',
      signature: 'extern std::istream cin;',
      detail: 'Standard character input stream',
      doc: 'std::cin is the standard input stream object of type std::istream. Reads formatted data from stdin.',
      example: 'int a, b;\nstd::cin >> a >> b;',
      source: 'builtin',
    },
    endl: {
      name: 'std::endl',
      kind: 'function',
      signature: 'template<class CharT, class Traits>\nstd::basic_ostream<CharT, Traits>& endl(std::basic_ostream<CharT, Traits>& os);',
      detail: 'Insert newline and flush output stream',
      doc: 'Inserts a newline character into the output stream sequence and flushes the buffer.',
      source: 'builtin',
    },
    vector: {
      name: 'std::vector',
      kind: 'class',
      signature: 'template<class T, class Allocator = std::allocator<T>>\nclass vector;',
      detail: 'Sequence container representing a dynamic array',
      doc: 'std::vector is a sequence container that encapsulates dynamic size arrays with contiguous memory storage and automatic resizing.',
      example: 'std::vector<int> nums = {1, 2, 3};\nnums.push_back(4);',
      source: 'builtin',
    },
    sort: {
      name: 'std::sort',
      kind: 'function',
      signature: 'template<class RandomIt>\nvoid sort(RandomIt first, RandomIt last);',
      detail: 'Sorts elements in the range [first, last) in non-descending order',
      doc: 'Rearranges elements in the range [first, last) using Introsort (O(N log N) worst-case time complexity).',
      params: [
        { name: 'first', type: 'RandomIt', doc: 'Random-access iterator to the beginning of the range' },
        { name: 'last', type: 'RandomIt', doc: 'Random-access iterator to the end of the range' }
      ],
      example: 'std::vector<int> v = {5, 2, 8, 1};\nstd::sort(v.begin(), v.end());',
      source: 'builtin',
    },
    reverse: {
      name: 'std::reverse',
      kind: 'function',
      signature: 'template<class BidirIt>\nvoid reverse(BidirIt first, BidirIt last);',
      detail: 'Reverses the order of elements in the range [first, last)',
      doc: 'Reverses the order of the elements in the range [first, last) in O(N) linear time.',
      source: 'builtin',
    },
    min: {
      name: 'std::min',
      kind: 'function',
      signature: 'template<class T>\nconst T& min(const T& a, const T& b);',
      detail: 'Returns the smaller of two given values',
      source: 'builtin',
    },
    max: {
      name: 'std::max',
      kind: 'function',
      signature: 'template<class T>\nconst T& max(const T& a, const T& b);',
      detail: 'Returns the greater of two given values',
      source: 'builtin',
    },
    push_back: {
      name: 'vector::push_back',
      kind: 'method',
      signature: 'void push_back(const T& value);',
      detail: 'Appends given element value to the end of the container',
      doc: 'Adds an element to the end of the vector. Amortized constant time O(1).',
      source: 'builtin',
    },
    size: {
      name: 'size()',
      kind: 'method',
      signature: 'size_type size() const noexcept;',
      detail: 'Returns the number of elements in the container',
      returns: 'size_t (number of elements)',
      source: 'builtin',
    },
    printf: {
      name: 'printf',
      kind: 'function',
      signature: 'int printf(const char *format, ...);',
      detail: 'Formatted output conversion to stdout',
      doc: 'Writes the C string pointed by format to the standard output (stdout), replacing format specifiers (%d, %s, %f, etc.) with arguments.',
      returns: 'int (total number of characters written, or negative value on error)',
      source: 'builtin',
    },
    scanf: {
      name: 'scanf',
      kind: 'function',
      signature: 'int scanf(const char *format, ...);',
      detail: 'Read formatted data from stdin',
      doc: 'Reads data from stdin and stores them according to parameter format into the locations pointed by the additional arguments.',
      returns: 'int (number of successfully read and matched items)',
      source: 'builtin',
    },
    malloc: {
      name: 'malloc',
      kind: 'function',
      signature: 'void* malloc(size_t size);',
      detail: 'Allocate dynamic memory block',
      doc: 'Allocates a block of uninitialized memory of size bytes on the heap.',
      returns: 'void* (pointer to allocated block, or NULL on failure)',
      source: 'builtin',
    },
    free: {
      name: 'free',
      kind: 'function',
      signature: 'void free(void* ptr);',
      detail: 'Deallocate allocated memory block',
      doc: 'Deallocates the space previously allocated by malloc, calloc, or realloc.',
      source: 'builtin',
    },
  },
  python: {
    print: {
      name: 'print',
      kind: 'function',
      signature: 'print(*values: object, sep: str | None = " ", end: str | None = "\\n", file: SupportsWrite[str] | None = None, flush: bool = False) -> None',
      detail: 'Built-in print function',
      doc: 'Prints the values to a stream, or to sys.stdout by default. Optional keyword arguments:\n• sep: string inserted between values, default a space.\n• end: string appended after the last value, default a newline.\n• flush: whether to forcibly flush the stream.',
      example: 'print("Result:", total, sep=" -> ", flush=True)',
      returns: 'None',
      source: 'builtin',
    },
    len: {
      name: 'len',
      kind: 'function',
      signature: 'len(__obj: Sized) -> int',
      detail: 'Return the number of items in a container',
      doc: 'Return the length (the number of items) of an object. The argument may be a sequence (such as a string, bytes, tuple, list, or range) or a collection (such as a dictionary, set, or frozen set).',
      returns: 'int',
      source: 'builtin',
    },
    range: {
      name: 'range',
      kind: 'class',
      signature: 'class range(stop: int)\nclass range(start: int, stop: int, step: int = 1)',
      detail: 'Built-in immutable sequence of numbers',
      doc: 'Returns an object that produces a sequence of integers from start (inclusive) to stop (exclusive) by step.',
      example: 'for i in range(0, 10, 2):\n    print(i)',
      source: 'builtin',
    },
    enumerate: {
      name: 'enumerate',
      kind: 'class',
      signature: 'class enumerate(iterable: Iterable[T], start: int = 0) -> Iterable[tuple[int, T]]',
      detail: 'Yield pairs containing a count and the values from iterable',
      doc: 'Return an enumerate object. iterable must be another object that supports iteration. The __next__() method of the iterator returned by enumerate() returns a tuple containing a count (from start which defaults to 0) and the values obtained from iterating over iterable.',
      source: 'builtin',
    },
    zip: {
      name: 'zip',
      kind: 'function',
      signature: 'zip(*iterables: Iterable[Any], strict: bool = False) -> Iterator[tuple[Any, ...]]',
      detail: 'Iterate over several iterables in parallel',
      doc: 'Returns an iterator of tuples, where the i-th tuple contains the i-th element from each of the argument sequences or iterables.',
      source: 'builtin',
    },
    sum: {
      name: 'sum',
      kind: 'function',
      signature: 'sum(iterable: Iterable[T], start: T = 0) -> T',
      detail: 'Return the sum of a ' + 'sequence of numbers',
      doc: 'Sums start and the items of an iterable from left to right and returns the total.',
      source: 'builtin',
    },
    sorted: {
      name: 'sorted',
      kind: 'function',
      signature: 'sorted(iterable: Iterable[T], *, key: Callable[[T], SupportsLessThan] | None = None, reverse: bool = False) -> list[T]',
      detail: 'Return a new list containing all items from the iterable in ascending order',
      doc: 'Returns a new sorted list from the items in iterable with O(N log N) Timsort complexity.',
      source: 'builtin',
    },
    FastAPI: {
      name: 'FastAPI',
      kind: 'class',
      signature: 'class FastAPI(title: str = "FastAPI", version: str = "0.1.0", docs_url: str = "/docs", ...)',
      detail: 'FastAPI modern, high-performance web framework application',
      doc: 'FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints and Starlette.',
      example: 'from fastapi import FastAPI\napp = FastAPI(title="My API")\n\n@app.get("/items")\ndef get_items():\n    return [{"id": 1, "name": "Item"}]',
      source: 'framework',
    },
    BaseModel: {
      name: 'BaseModel',
      kind: 'class',
      signature: 'class BaseModel(*, **data: Any)',
      detail: 'Pydantic data validation and parsing model',
      doc: 'Base class for creating data schemas with automatic validation, serialization, and OpenAPI JSON schema generation.',
      example: 'from pydantic import BaseModel\n\nclass User(BaseModel):\n    id: int\n    name: str\n    email: str | None = None',
      source: 'framework',
    },
    APIRouter: {
      name: 'APIRouter',
      kind: 'class',
      signature: 'class APIRouter(prefix: str = "", tags: list[str] = None, ...)',
      detail: 'FastAPI modular route handler collection',
      doc: 'Use APIRouter to structure larger FastAPI applications into modular endpoint collections.',
      source: 'framework',
    },
    HTTPException: {
      name: 'HTTPException',
      kind: 'class',
      signature: 'class HTTPException(status_code: int, detail: Any = None, headers: dict | None = None)',
      detail: 'HTTP exception to return error responses with status codes',
      doc: 'Raise HTTPException inside endpoint functions to return standard HTTP error responses to the client.',
      example: 'raise HTTPException(status_code=404, detail="Item not found")',
      source: 'framework',
    },
    Depends: {
      name: 'Depends',
      kind: 'function',
      signature: 'def Depends(dependency: Callable[..., Any] | None = None, *, use_cache: bool = True) -> Any',
      detail: 'FastAPI Dependency Injection helper',
      doc: 'Declares a dependency for route handler functions (e.g. database sessions, authentication, permissions).',
      source: 'framework',
    },
    models: {
      name: 'django.db.models',
      kind: 'module',
      signature: 'from django.db import models',
      detail: 'Django ORM Database Models and Field Types',
      doc: 'Provides database field types (CharField, IntegerField, ForeignKey, DateTimeField) and Model base class for relational database ORM.',
      source: 'framework',
    },
    Model: {
      name: 'models.Model',
      kind: 'class',
      signature: 'class Model(models.Model)',
      detail: 'Django ORM base database model',
      doc: 'A Model in Django maps directly to a single database table, with class attributes representing table columns.',
      source: 'framework',
    },
    CharField: {
      name: 'models.CharField',
      kind: 'class',
      signature: 'CharField(max_length: int, **options)',
      detail: 'Django string field for small to medium length strings',
      source: 'framework',
    },
    IntegerField: {
      name: 'models.IntegerField',
      kind: 'class',
      signature: 'IntegerField(**options)',
      detail: 'Django integer column field',
      source: 'framework',
    },
    ForeignKey: {
      name: 'models.ForeignKey',
      kind: 'class',
      signature: 'ForeignKey(to: type[Model] | str, on_delete: Callable, **options)',
      detail: 'Django relational Many-To-One foreign key relationship',
      source: 'framework',
    },
    Flask: {
      name: 'Flask',
      kind: 'class',
      signature: 'class Flask(import_name: str, static_url_path: str = None, static_folder: str = "static", ...)',
      detail: 'Flask WSGI web application object',
      doc: 'The flask object implements a WSGI application and acts as the central object.',
      example: 'from flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return "Hello World"',
      source: 'framework',
    },
  },
  javascript: {
    log: {
      name: 'console.log',
      kind: 'method',
      signature: 'console.log(...data: any[]): void',
      detail: 'Prints informative messages to web console / stdout',
      doc: 'Outputs a message to the Web Console with newline termination.',
      example: 'console.log("Status:", status, { id: 101 });',
      source: 'builtin',
    },
    map: {
      name: 'Array.prototype.map()',
      kind: 'method',
      signature: 'map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]',
      detail: 'Creates a new array populated with results of calling function on every element',
      doc: 'The map() method of Array instances creates a new array populated with the results of calling a provided function on every element in the calling array.',
      example: 'const doubled = numbers.map(x => x * 2);',
      returns: 'A new array with each element being the result of the callback function.',
      source: 'builtin',
    },
    filter: {
      name: 'Array.prototype.filter()',
      kind: 'method',
      signature: 'filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[]',
      detail: 'Returns elements of an array that meet the condition specified in a callback function',
      doc: 'Creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test implemented by the provided function.',
      example: 'const evens = numbers.filter(n => n % 2 === 0);',
      source: 'builtin',
    },
    reduce: {
      name: 'Array.prototype.reduce()',
      kind: 'method',
      signature: 'reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U',
      detail: 'Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result',
      doc: 'Executes a user-supplied "reducer" callback function on each element of the array, in order, passing in the return value from the calculation on the preceding element.',
      example: 'const sum = numbers.reduce((acc, curr) => acc + curr, 0);',
      source: 'builtin',
    },
    forEach: {
      name: 'Array.prototype.forEach()',
      kind: 'method',
      signature: 'forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void',
      detail: 'Performs the specified action for each element in an array',
      source: 'builtin',
    },
    find: {
      name: 'Array.prototype.find()',
      kind: 'method',
      signature: 'find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined',
      detail: 'Returns the value of the first element in the array where predicate is true, and undefined otherwise',
      source: 'builtin',
    },
    includes: {
      name: 'Array.prototype.includes()',
      kind: 'method',
      signature: 'includes(searchElement: T, fromIndex?: number): boolean',
      detail: 'Determines whether an array includes a certain element, returning true or false as appropriate',
      source: 'builtin',
    },
    fetch: {
      name: 'fetch',
      kind: 'function',
      signature: 'fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>',
      detail: 'Starts the process of fetching a resource from the network',
      doc: 'The global fetch() method starts the process of fetching a resource from the network, returning a promise which is fulfilled once the response is available.',
      example: 'const res = await fetch("/api/data");\nconst data = await res.json();',
      returns: 'Promise<Response>',
      source: 'builtin',
    },
    useState: {
      name: 'useState',
      kind: 'function',
      signature: 'function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]',
      detail: 'React State Hook',
      doc: 'Returns a stateful value and a function to update it.',
      example: 'const [count, setCount] = useState<number>(0);',
      source: 'framework',
    },
    useEffect: {
      name: 'useEffect',
      kind: 'function',
      signature: 'function useEffect(effect: EffectCallback, deps?: DependencyList): void',
      detail: 'React Effect Hook',
      doc: 'Accepts a function that contains imperative, possibly effectful code.',
      example: 'useEffect(() => {\n  console.log("Mounted");\n  return () => console.log("Cleaned up");\n}, []);',
      source: 'framework',
    },
    useCallback: {
      name: 'useCallback',
      kind: 'function',
      signature: 'function useCallback<T extends Function>(callback: T, deps: DependencyList): T',
      detail: 'React Callback Memoization Hook',
      doc: 'Returns a memoized version of the callback that only changes if one of the dependencies has changed.',
      source: 'framework',
    },
    useMemo: {
      name: 'useMemo',
      kind: 'function',
      signature: 'function useMemo<T>(factory: () => T, deps: DependencyList): T',
      detail: 'React Memoized Value Hook',
      doc: 'Returns a memoized value generated by the factory function.',
      source: 'framework',
    },
    useRef: {
      name: 'useRef',
      kind: 'function',
      signature: 'function useRef<T>(initialValue: T): MutableRefObject<T>',
      detail: 'React Mutable Reference Hook',
      doc: 'Returns a mutable ref object whose .current property is initialized to the passed argument.',
      source: 'framework',
    },
    stringify: {
      name: 'JSON.stringify',
      kind: 'function',
      signature: 'JSON.stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string',
      detail: 'Converts a JavaScript value to a JSON string',
      source: 'builtin',
    },
    parse: {
      name: 'JSON.parse',
      kind: 'function',
      signature: 'JSON.parse(text: string, reviver?: (this: any, key: string, value: any) => any): any',
      detail: 'Parses a JSON string, constructing the JavaScript value or object described by the string',
      source: 'builtin',
    },
    setTimeout: {
      name: 'setTimeout',
      kind: 'function',
      signature: 'setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number',
      detail: 'Sets a timer which executes a function or specified piece of code once the timer expires',
      source: 'builtin',
    },
  },
  sql: {
    SELECT: {
      name: 'SELECT',
      kind: 'keyword',
      signature: 'SELECT column1, column2, ... FROM table_name WHERE condition;',
      detail: 'SQL Query statement to retrieve data from a database',
      doc: 'The SELECT statement is used to select data from a database table. The data returned is stored in a result table, called the result-set.',
      example: 'SELECT id, name, email FROM users WHERE active = true ORDER BY created_at DESC;',
      source: 'builtin',
    },
    JOIN: {
      name: 'JOIN / INNER JOIN',
      kind: 'keyword',
      signature: 'SELECT columns FROM table1 JOIN table2 ON table1.column = table2.column;',
      detail: 'Combine rows from two or more tables based on a related column',
      doc: 'Returns records that have matching values in both tables.',
      source: 'builtin',
    },
    COUNT: {
      name: 'COUNT()',
      kind: 'function',
      signature: 'COUNT(expression)',
      detail: 'Aggregate function returning the number of rows matching criteria',
      source: 'builtin',
    },
  },
  java: {
    println: {
      name: 'System.out.println',
      kind: 'method',
      signature: 'public void println(String x)',
      detail: 'Prints a String and then terminates the line',
      source: 'builtin',
    },
    ArrayList: {
      name: 'java.util.ArrayList',
      kind: 'class',
      signature: 'public class ArrayList<E> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, java.io.Serializable',
      detail: 'Resizable-array implementation of the List interface',
      source: 'builtin',
    },
  }
};

/**
 * Parses user-defined functions, classes, interfaces, and variables directly from the current code buffer
 */
export function extractUserSymbolHover(
  symbolName: string,
  language: Language,
  codeBuffer: string
): HoverInfo | null {
  if (!symbolName || symbolName.length < 2) return null;
  const cleanSym = symbolName.trim();

  const lines = codeBuffer.split('\n');

  // 1. Python Symbol Discovery (def func(...):, class ClassName(...):)
  if (language === 'python') {
    // Look for def symbol(...)
    const defRegex = new RegExp(`^\\s*def\\s+(${cleanSym})\\s*\\((.*?)\\)(\\s*->\\s*([a-zA-Z0-9_\\[\\], |]+))?:`);
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(defRegex);
      if (match) {
        const fnName = match[1];
        const params = match[2];
        const returnType = match[4] || 'Any';

        // Extract docstring if present directly under function def
        let docstring = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
            const quote = nextLine.slice(0, 3);
            let j = i + 1;
            const docLines: string[] = [];
            while (j < lines.length) {
              let l = lines[j].trim();
              if (j === i + 1) l = l.slice(3);
              if (l.endsWith(quote)) {
                docLines.push(l.slice(0, -3));
                break;
              }
              docLines.push(l);
              j++;
            }
            docstring = docLines.join('\n').trim();
          }
        }

        const paramList: HoverDocParam[] = params
          .split(',')
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => {
            const [pName, pType] = p.split(':').map(s => s.trim());
            return { name: pName, type: pType };
          });

        return {
          name: fnName,
          kind: 'function',
          signature: `(function) def ${fnName}(${params}) -> ${returnType}`,
          detail: `User-defined Python function (Line ${i + 1})`,
          doc: docstring || `Locally declared function in current module.`,
          params: paramList.length > 0 ? paramList : undefined,
          returns: returnType,
          source: 'user',
          language: 'python',
        };
      }

      // Look for class symbol(...)
      const classRegex = new RegExp(`^\\s*class\\s+(${cleanSym})(?:\\((.*?)\\))?:`);
      const classMatch = lines[i].match(classRegex);
      if (classMatch) {
        const className = classMatch[1];
        const baseClass = classMatch[2] || '';
        return {
          name: className,
          kind: 'class',
          signature: baseClass ? `(class) class ${className}(${baseClass}):` : `(class) class ${className}:`,
          detail: `User-defined Python class (Line ${i + 1})`,
          doc: `Locally declared class. Inherits from: ${baseClass || 'object'}.`,
          source: 'user',
          language: 'python',
        };
      }
    }
  }

  // 2. TypeScript / JavaScript Symbol Discovery
  if (language === 'typescript' || language === 'javascript' || language === 'html') {
    // Function declaration: function myFunc(...)
    const fnRegex = new RegExp(`(?:async\\s+)?function\\s+(${cleanSym})\\s*(?:<.*?>)?\\s*\\((.*?)\\)(?:\\s*:\\s*([a-zA-Z0-9_<>\\[\\], |&]+))?`);
    // Const arrow function: const myFunc = (...) => ...
    const arrowRegex = new RegExp(`(?:const|let|var)\\s+(${cleanSym})\\s*=\\s*(?:async\\s*)?(?:\\((.*?)\\)|([a-zA-Z0-9_$]+))\\s*(?:\\s*:\\s*([a-zA-Z0-9_<>\\[\\], |&]+))?\\s*=>`);
    // Class declaration: class MyClass
    const classRegex = new RegExp(`class\\s+(${cleanSym})(?:\\s+extends\\s+([a-zA-Z0-9_$]+))?`);
    // Interface declaration: interface MyInterface
    const interfaceRegex = new RegExp(`interface\\s+(${cleanSym})(?:\\s+extends\\s+([a-zA-Z0-9_$, ]+))?`);
    // Type declaration: type MyType = ...
    const typeRegex = new RegExp(`type\\s+(${cleanSym})(?:<.*?>)?\\s*=`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract JSDoc comment if preceding
      let jsDoc = '';
      if (i > 0 && lines[i - 1].trim().endsWith('*/')) {
        let k = i - 1;
        const docLines: string[] = [];
        while (k >= 0 && !lines[k].trim().startsWith('/**')) {
          docLines.unshift(lines[k].trim().replace(/^\*\s?/, ''));
          k--;
        }
        if (k >= 0) {
          docLines.unshift(lines[k].trim().replace(/^\/\*\*\s?/, ''));
        }
        jsDoc = docLines.join('\n').trim();
      }

      // Match function
      const fnMatch = line.match(fnRegex);
      if (fnMatch) {
        const fnName = fnMatch[1];
        const params = fnMatch[2] || '';
        const retType = fnMatch[3] || 'void';
        return {
          name: fnName,
          kind: 'function',
          signature: `(function) ${fnName}(${params}): ${retType}`,
          detail: `Local Function (Line ${i + 1})`,
          doc: jsDoc || 'User-defined function in current workspace.',
          returns: retType,
          source: 'user',
          language: language,
        };
      }

      // Match arrow function
      const arrowMatch = line.match(arrowRegex);
      if (arrowMatch) {
        const fnName = arrowMatch[1];
        const params = arrowMatch[2] || arrowMatch[3] || '';
        const retType = arrowMatch[4] || 'any';
        return {
          name: fnName,
          kind: 'function',
          signature: `(const function) ${fnName}: (${params}) => ${retType}`,
          detail: `Local Arrow Function (Line ${i + 1})`,
          doc: jsDoc || 'User-defined lambda function.',
          returns: retType,
          source: 'user',
          language: language,
        };
      }

      // Match Class
      const classMatch = line.match(classRegex);
      if (classMatch) {
        const className = classMatch[1];
        const ext = classMatch[2];
        return {
          name: className,
          kind: 'class',
          signature: ext ? `(class) class ${className} extends ${ext}` : `(class) class ${className}`,
          detail: `Local Class Declaration (Line ${i + 1})`,
          doc: jsDoc || `User-defined class declaration.`,
          source: 'user',
          language: language,
        };
      }

      // Match Interface
      const ifMatch = line.match(interfaceRegex);
      if (ifMatch) {
        const ifName = ifMatch[1];
        return {
          name: ifName,
          kind: 'interface',
          signature: `(interface) interface ${ifName}`,
          detail: `TypeScript Interface (Line ${i + 1})`,
          doc: jsDoc || `User-defined TypeScript contract type.`,
          source: 'user',
          language: language,
        };
      }

      // Match Type
      const typeMatch = line.match(typeRegex);
      if (typeMatch) {
        const typeName = typeMatch[1];
        return {
          name: typeName,
          kind: 'type',
          signature: `(type alias) type ${typeName}`,
          detail: `TypeScript Type Alias (Line ${i + 1})`,
          doc: jsDoc || `User-defined type alias definition.`,
          source: 'user',
          language: language,
        };
      }
    }
  }

  // 3. C / C++ Symbol Discovery
  if (language === 'c' || language === 'cpp') {
    const cppFnRegex = new RegExp(`^\\s*([a-zA-Z0-9_<>:*&]+)\\s+(${cleanSym})\\s*\\((.*?)\\)\\s*\\{?`);
    const cppStructRegex = new RegExp(`^\\s*(?:struct|class)\\s+(${cleanSym})\\s*\\{?`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fnMatch = line.match(cppFnRegex);
      if (fnMatch) {
        const retType = fnMatch[1];
        const fnName = fnMatch[2];
        const params = fnMatch[3];
        return {
          name: fnName,
          kind: 'function',
          signature: `${retType} ${fnName}(${params});`,
          detail: `User C/C++ Function (Line ${i + 1})`,
          doc: `Defined in current file. Return type: ${retType}`,
          returns: retType,
          source: 'user',
          language: language,
        };
      }

      const structMatch = line.match(cppStructRegex);
      if (structMatch) {
        const structName = structMatch[1];
        return {
          name: structName,
          kind: 'struct',
          signature: `struct ${structName};`,
          detail: `User-defined Struct/Class (Line ${i + 1})`,
          source: 'user',
          language: language,
        };
      }
    }
  }

  return null;
}

/**
 * Main Hover Documentation Lookup Engine
 */
export function getHoverDoc(
  token: string,
  language: Language,
  codeBuffer: string,
  _lineIdx?: number,
  _lineText?: string
): HoverInfo | null {
  if (!token || token.trim().length === 0) return null;
  const clean = token.replace(/^[#@]+/, '').replace(/[();,.:\s]+$/, '').trim();
  if (clean.length < 2) return null;

  // 1. Check user-defined code buffer first
  const userSymbol = extractUserSymbolHover(clean, language, codeBuffer);
  if (userSymbol) return userSymbol;

  // 2. Check language-specific built-in catalog
  const langKey = language === 'typescript' ? 'javascript' : language;
  const langDocs = BUILTIN_HOVER_DOCS[langKey] || BUILTIN_HOVER_DOCS['python'] || {};

  if (langDocs[clean]) {
    return langDocs[clean];
  }

  // Also check common global built-ins
  if (BUILTIN_HOVER_DOCS['javascript'][clean]) {
    return BUILTIN_HOVER_DOCS['javascript'][clean];
  }
  if (BUILTIN_HOVER_DOCS['python'][clean]) {
    return BUILTIN_HOVER_DOCS['python'][clean];
  }
  if (BUILTIN_HOVER_DOCS['cpp'][clean]) {
    return BUILTIN_HOVER_DOCS['cpp'][clean];
  }

  // 3. Fallback to suggestion catalog if detailed entry is available
  const catalog = LANGUAGE_INTELLISENSE[language] || [];
  const found = catalog.find(item => {
    const itemLabelClean = item.label.split(/[ (<]/)[0].replace(/^[#@]+/, '');
    return itemLabelClean.toLowerCase() === clean.toLowerCase();
  });

  if (found && (found.doc || found.detail)) {
    return {
      name: found.label,
      kind: found.kind || 'keyword',
      signature: found.insertText || found.label,
      detail: found.detail,
      doc: found.doc,
      source: 'builtin',
      language: language,
    };
  }

  return null;
}

