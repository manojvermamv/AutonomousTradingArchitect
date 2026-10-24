import { useState } from 'react';
import type { ArchitectureModule, ArchitectureIssue } from './data/architectureData';

interface Props {
  modules: ArchitectureModule[];
  issues: ArchitectureIssue[];
}

export function ModuleDetails({ modules, issues }: Props) {
  const [selectedModule, setSelectedModule] = useState<string>(modules[0]?.id || '');

  const currentModule = modules.find(m => m.id === selectedModule);
  const moduleIssues = issues.filter(i => i.affectedModules.includes(selectedModule));

  const tierColors: Record<string, string> = {
    'Infrastructure': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Advisory': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Core': 'text-red-400 bg-red-500/10 border-red-500/20',
    'External': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Persistence': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Safety': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    'Research': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    'Evolution': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    'Operations': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-cubes text-purple-400"></i>
          Module Deep Dive
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Detailed analysis of each architectural module with concerns, strengths, and related issues
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Module Selector */}
        <div className="space-y-2">
          {modules.map(module => {
            const issueCount = issues.filter(i => i.affectedModules.includes(module.id)).length;
            const isSelected = selectedModule === module.id;

            return (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                    : 'bg-[#0d1220] border-gray-800/50 hover:border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {module.name}
                  </span>
                  {issueCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {issueCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded border ${tierColors[module.tier] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {module.tier}
                </span>
              </button>
            );
          })}
        </div>

        {/* Module Details */}
        {currentModule && (
          <div className="space-y-4">
            {/* Module Header */}
            <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{currentModule.name}</h3>
                  <span className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded border ${tierColors[currentModule.tier] || ''}`}>
                    {currentModule.tier} Tier
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{currentModule.responsibility}</p>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-circle-check"></i>
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {currentModule.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <i className="fa-solid fa-check text-green-500 text-[8px] mt-1"></i>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  Concerns
                </h4>
                <ul className="space-y-2">
                  {currentModule.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <i className="fa-solid fa-exclamation text-orange-500 text-[8px] mt-1"></i>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related Issues */}
            {moduleIssues.length > 0 && (
              <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
                  Related Issues ({moduleIssues.length})
                </h4>
                <div className="space-y-2">
                  {moduleIssues.map(issue => {
                    const sevColors: Record<string, string> = {
                      critical: 'text-red-400 bg-red-500/10 border-red-500/20',
                      high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                      medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                      low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    };
                    return (
                      <div key={issue.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-800/20">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sevColors[issue.severity]} uppercase font-bold shrink-0`}>
                          {issue.severity}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white">{issue.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{issue.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
