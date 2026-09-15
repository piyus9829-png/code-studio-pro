import React, { useState } from 'react';
import { STARTER_TEMPLATES } from '../data/templates';
import { ProjectTemplate } from '../types';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  FileCode, 
  Binary, 
  Layers, 
  Terminal, 
  Database,
  Code2,
  Zap,
  Server
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'FastAPI', 'Django', 'Python', 'Java', 'C / C++', 'JavaScript', 'TypeScript', 'React', 'Data & SQL', 'Web/HTML'];

  const filtered = selectedCategory === 'All' 
    ? STARTER_TEMPLATES 
    : STARTER_TEMPLATES.filter(t => t.category === selectedCategory);

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'FastAPI':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Django':
        return <Server className="w-5 h-5 text-emerald-400" />;
      case 'Java':
        return <Code2 className="w-5 h-5 text-rose-400" />;
      case 'C / C++':
        return <Terminal className="w-5 h-5 text-blue-400" />;
      case 'JavaScript':
        return <FileCode className="w-5 h-5 text-yellow-300" />;
      case 'TypeScript':
        return <Binary className="w-5 h-5 text-blue-400" />;
      case 'React':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'Python':
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'Data & SQL':
        return <Database className="w-5 h-5 text-emerald-400" />;
      default:
        return <Code2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Starter Project Templates</h2>
              <p className="text-xs text-slate-400">Launch a production-ready code sandbox with instant output</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="group p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-950 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/40 transition-colors">
                    {getTemplateIcon(tmpl.category)}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    {tmpl.files.length} {tmpl.files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Load Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
