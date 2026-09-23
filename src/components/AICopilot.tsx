import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  FileCode, 
  Wand2, 
  Bug, 
  Zap, 
  TestTube2, 
  ArrowRightLeft,
  X,
  Loader2,
  Crown
} from 'lucide-react';
import { FileItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface AICopilotProps {
  activeFile: FileItem;
  onApplyCode: (newCode: string) => void;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  suggestedCode?: string;
  timestamp: number;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  activeFile,
  onApplyCode,
  onClose,
}) => {
  const { isPremium, requirePremium, setAuthModalOpen } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `👋 Hi! I'm your Gemini AI coding copilot. I can explain your code, fix bugs, optimize algorithms, or write comprehensive tests for **${activeFile.name}**.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const executeAiAction = async (action: 'explain' | 'fix' | 'optimize' | 'test' | 'convert', userPromptText?: string) => {
    if (isLoading) return;

    const userMessageId = `usr_${Date.now()}`;
    const userText = userPromptText || (
      action === 'explain' ? `Explain ${activeFile.name}` :
      action === 'fix' ? `Find and fix bugs in ${activeFile.name}` :
      action === 'optimize' ? `Optimize ${activeFile.name}` :
      action === 'test' ? `Generate tests for ${activeFile.name}` :
      `Convert ${activeFile.name} to TypeScript`
    );

    setMessages(prev => [
      ...prev,
      { id: userMessageId, sender: 'user', content: userText, timestamp: Date.now() }
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt: userText,
          code: activeFile.content,
          language: activeFile.language,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.response || data.error || 'No response generated.';

      // Extract code block if present
      const codeBlockMatch = aiResponseText.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
      const extractedCode = codeBlockMatch ? codeBlockMatch[1].trim() : undefined;

      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          content: aiResponseText,
          suggestedCode: extractedCode,
          timestamp: Date.now(),
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Failed to reach AI service: ${err.message || String(err)}`,
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: 'explain' | 'fix' | 'optimize' | 'test' | 'convert', userPromptText?: string) => {
    requirePremium('AI Code Explain', () => {
      executeAiAction(action, userPromptText);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const p = inputPrompt.trim();
    setInputPrompt('');
    handleAction('explain', p);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 select-text overflow-hidden">
      {/* Header */}
      <div className="h-10 px-3 border-b border-slate-800 flex items-center justify-between shrink-0 select-none bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200">Gemini AI Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Action Pills */}
      <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap gap-1.5 shrink-0 select-none">
        <button
          onClick={() => handleAction('explain')}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Wand2 className="w-3 h-3 text-cyan-400" />
          <span>Explain</span>
        </button>

        <button
          onClick={() => handleAction('fix')}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Bug className="w-3 h-3 text-red-400" />
          <span>Find Bugs</span>
        </button>

        <button
          onClick={() => handleAction('optimize')}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Optimize</span>
        </button>

        <button
          onClick={() => handleAction('test')}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
        >
          <TestTube2 className="w-3 h-3 text-emerald-400" />
          <span>Unit Tests</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {msg.suggestedCode && (
                <div className="mt-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Suggested Code</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(msg.suggestedCode!, msg.id)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => onApplyCode(msg.suggestedCode!)}
                        className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileCode className="w-2.5 h-2.5" />
                        <span>Apply to File</span>
                      </button>
                    </div>
                  </div>
                  <pre className="bg-slate-900/90 p-2 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800/80 max-h-48">
                    {msg.suggestedCode}
                  </pre>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 p-2 bg-slate-950/40 rounded-lg border border-slate-800/50">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span className="text-xs">Gemini is reasoning & analyzing your code...</span>
          </div>
        )}
      </div>

      {/* Input Prompt Form */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Ask about ${activeFile.name}...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputPrompt.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
