import React, { useState, useEffect } from 'react';
import { ApiEndpoint, ApiResponse } from '../types';
import { 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Code2, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  Server,
  Zap,
  Play
} from 'lucide-react';

interface ApiExplorerProps {
  code: string;
  language: string;
  onExecuteRequest: (method: string, path: string, headers: Record<string, string>, body: string) => Promise<ApiResponse>;
  onInsertCodeSnippet?: (snippet: string) => void;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({
  code,
  language,
  onExecuteRequest,
  onInsertCodeSnippet,
}) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [path, setPath] = useState<string>('/api/v1/items');
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true }
  ]);
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'limit', value: '10', enabled: false },
    { key: 'category', value: 'electronics', enabled: false }
  ]);
  const [body, setBody] = useState<string>('{\n  "name": "Mechanical Keyboard",\n  "price": 89.99,\n  "in_stock": true\n}');
  const [activeReqTab, setActiveReqTab] = useState<'params' | 'headers' | 'body'>('body');
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [detectedEndpoints, setDetectedEndpoints] = useState<ApiEndpoint[]>([]);
  const [history, setHistory] = useState<Array<{ method: string; path: string; status: number; timeMs: number }>>([]);

  // Auto-discover endpoints from FastAPI / Django / Express / Flask code
  useEffect(() => {
    const endpoints: ApiEndpoint[] = [];
    const lines = code.split('\n');

    // 1. FastAPI / Flask decorators: @app.get("/items"), @router.post("/users")
    const fastapiRegex = /@(app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/i;
    // 2. Django URL patterns: path('items/', views.items), path('api/v1/users/<int:id>/', ...)
    const djangoRegex = /path\s*\(\s*["']([^"']+)["'],\s*([a-zA-Z0-9_.]+)/i;
    // 3. Express: app.get('/items', ...), router.post('/users', ...)
    const expressRegex = /(app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/i;

    lines.forEach((line, idx) => {
      const faMatch = line.match(fastapiRegex);
      if (faMatch) {
        const m = faMatch[2].toUpperCase() as any;
        const p = faMatch[3];
        endpoints.push({
          id: `ep_${idx}`,
          method: m,
          path: p.startsWith('/') ? p : `/${p}`,
          summary: `FastAPI route at line ${idx + 1}`,
          framework: 'fastapi'
        });
        return;
      }

      const djMatch = line.match(djangoRegex);
      if (djMatch) {
        let p = djMatch[1];
        if (!p.startsWith('/')) p = `/${p}`;
        endpoints.push({
          id: `ep_${idx}`,
          method: p.includes('create') || p.includes('add') ? 'POST' : 'GET',
          path: p,
          summary: `Django view \`${djMatch[2]}\` at line ${idx + 1}`,
          framework: 'django'
        });
        return;
      }

      const exMatch = line.match(expressRegex);
      if (exMatch) {
        const m = exMatch[2].toUpperCase() as any;
        const p = exMatch[3];
        endpoints.push({
          id: `ep_${idx}`,
          method: m,
          path: p.startsWith('/') ? p : `/${p}`,
          summary: `Express route at line ${idx + 1}`,
          framework: 'express'
        });
      }
    });

    if (endpoints.length > 0) {
      setDetectedEndpoints(endpoints);
    } else {
      // Default sample endpoints if code hasn't defined any yet
      setDetectedEndpoints([
        { id: 'ep-def-1', method: 'GET', path: '/api/v1/health', summary: 'Health Check endpoint', framework: 'fastapi' },
        { id: 'ep-def-2', method: 'GET', path: '/api/v1/items', summary: 'List items query', framework: 'fastapi' },
        { id: 'ep-def-3', method: 'POST', path: '/api/v1/items', summary: 'Create new item', framework: 'fastapi', requestBodySample: '{\n  "name": "Wireless Mouse",\n  "price": 29.99,\n  "in_stock": true\n}' },
        { id: 'ep-def-4', method: 'GET', path: '/api/v1/items/1', summary: 'Get item by ID', framework: 'fastapi' },
      ]);
    }
  }, [code]);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      // Build final URL with active query params
      const activeQueries = queryParams.filter(q => q.enabled && q.key.trim());
      let finalPath = path;
      if (activeQueries.length > 0) {
        const queryString = activeQueries.map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&');
        finalPath = `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
      }

      const activeHeaders: Record<string, string> = {};
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        activeHeaders[h.key.trim()] = h.value.trim();
      });

      const res = await onExecuteRequest(method, finalPath, activeHeaders, method === 'GET' ? '' : body);
      setResponse(res);
      setHistory(prev => [
        { method, path: finalPath, status: res.status, timeMs: res.timeMs },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: 'Internal Error',
        timeMs: 0,
        headers: {},
        body: { error: err?.message || String(err) },
        rawText: JSON.stringify({ error: err?.message || String(err) }, null, 2),
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setMethod(ep.method);
    setPath(ep.path);
    if (ep.requestBodySample) {
      setBody(ep.requestBodySample);
      setActiveReqTab('body');
    } else if (ep.method === 'GET') {
      setActiveReqTab('params');
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.rawText || JSON.stringify(response.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'POST': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'PUT': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DELETE': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'PATCH': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (status >= 300 && status < 400) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (status >= 400 && status < 500) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans text-xs select-text overflow-hidden">
      {/* Top Banner / Framework Indicator */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-slate-200">FastAPI & Django Microservice Runner</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px]">
            {detectedEndpoints.length} Routes Discovered
          </span>
        </div>

        {/* Quick Snippet Generator */}
        {onInsertCodeSnippet && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const snippet = `\n@app.get("/api/v1/stats")\ndef get_stats():\n    return {"status": "online", "uptime": 3600, "active_users": 42}\n`;
                onInsertCodeSnippet(snippet);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              <span>+ Add FastAPI Route</span>
            </button>
            <button
              onClick={() => {
                const snippet = `\nclass UserViewSet(viewsets.ModelViewSet):\n    queryset = User.objects.all()\n    serializer_class = UserSerializer\n`;
                onInsertCodeSnippet(snippet);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>+ Add Django View</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Split Layout: Left Endpoint List + Center Request/Response Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Discovered Endpoints & Quick Selector */}
        <div className="w-full md:w-56 bg-slate-900/40 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden select-none">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Discovered Routes</span>
            <Globe className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {detectedEndpoints.map(ep => {
              const isSelected = method === ep.method && path === ep.path;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getMethodBadgeClass(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] text-slate-200 truncate flex-1">{ep.path}</span>
                  </div>
                  {ep.summary && (
                    <p className="text-[10px] text-slate-400 truncate">{ep.summary}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Request History */}
          {history.length > 0 && (
            <div className="p-2 border-t border-slate-800 bg-slate-950/60">
              <span className="text-[10px] font-semibold text-slate-500 block mb-1">Recent Executions</span>
              <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                {history.slice(0, 4).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-[120px]">{h.method} {h.path}</span>
                    <span className={`px-1 py-0.2 rounded ${getStatusBadgeClass(h.status)}`}>{h.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center & Right: Request Builder & Response Inspector */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* URL & Method Bar */}
          <div className="p-3 bg-slate-900/30 border-b border-slate-800 flex items-center gap-2 select-none">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${getMethodBadgeClass(method)}`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <div className="flex-1 relative">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v1/resource"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Invoking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Split: Request Config (Left) and Response View (Right) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Request Parameters / Headers / Body */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 select-none">
                <button
                  onClick={() => setActiveReqTab('body')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    activeReqTab === 'body'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Body (JSON)
                </button>
                <button
                  onClick={() => setActiveReqTab('params')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    activeReqTab === 'params'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Query Params ({queryParams.filter(q => q.enabled).length})
                </button>
                <button
                  onClick={() => setActiveReqTab('headers')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    activeReqTab === 'headers'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Headers ({headers.filter(h => h.enabled).length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-3 overflow-y-auto">
                {activeReqTab === 'body' && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1 text-[11px] text-slate-500">
                      <span>JSON Request Payload</span>
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(body);
                            setBody(JSON.stringify(parsed, null, 2));
                          } catch {}
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Beautify JSON
                      </button>
                    </div>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder='{ "key": "value" }'
                      className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                      rows={6}
                    />
                  </div>
                )}

                {activeReqTab === 'params' && (
                  <div className="space-y-2">
                    {queryParams.map((param, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => {
                            const updated = [...queryParams];
                            updated[idx].enabled = e.target.checked;
                            setQueryParams(updated);
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => {
                            const updated = [...queryParams];
                            updated[idx].key = e.target.value;
                            setQueryParams(updated);
                          }}
                          placeholder="Key"
                          className="w-1/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => {
                            const updated = [...queryParams];
                            updated[idx].value = e.target.value;
                            setQueryParams(updated);
                          }}
                          placeholder="Value"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => setQueryParams(queryParams.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setQueryParams([...queryParams, { key: '', value: '', enabled: true }])}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Parameter</span>
                    </button>
                  </div>
                )}

                {activeReqTab === 'headers' && (
                  <div className="space-y-2">
                    {headers.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={h.enabled}
                          onChange={(e) => {
                            const updated = [...headers];
                            updated[idx].enabled = e.target.checked;
                            setHeaders(updated);
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={h.key}
                          onChange={(e) => {
                            const updated = [...headers];
                            updated[idx].key = e.target.value;
                            setHeaders(updated);
                          }}
                          placeholder="Header Name"
                          className="w-1/3 bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={h.value}
                          onChange={(e) => {
                            const updated = [...headers];
                            updated[idx].value = e.target.value;
                            setHeaders(updated);
                          }}
                          placeholder="Value"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setHeaders([...headers, { key: '', value: '', enabled: true }])}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Header</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Response Inspector */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* Response Header Status */}
              <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Response</span>
                  {response && (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border ${getStatusBadgeClass(response.status)}`}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {response.timeMs}ms
                      </span>
                    </div>
                  )}
                </div>

                {response && (
                  <button
                    onClick={handleCopyResponse}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {/* Response Content View */}
              <div className="flex-1 p-3 overflow-auto font-mono text-xs custom-scrollbar">
                {response ? (
                  <div className="space-y-3">
                    {/* Pretty JSON Response Body */}
                    <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 overflow-x-auto select-text whitespace-pre-wrap">
                      {typeof response.body === 'object'
                        ? JSON.stringify(response.body, null, 2)
                        : (response.rawText || String(response.body))}
                    </pre>

                    {/* Response Headers */}
                    {response.headers && Object.keys(response.headers).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px]">
                        <span className="text-slate-500 font-bold block mb-1">Response Headers:</span>
                        {Object.entries(response.headers).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-indigo-400">{k}:</span>
                            <span className="text-slate-300">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                    <Server className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
                    <p className="font-sans font-medium text-xs">Ready to test FastAPI / Django routes</p>
                    <p className="text-[11px] text-slate-600 mt-1">Select an endpoint or enter a path and click Send Request</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
