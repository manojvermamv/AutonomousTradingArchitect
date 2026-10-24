import { useState } from 'react';
import type { Recommendation } from '../data/architectureData';

interface Props {
  recommendations: Recommendation[];
}

export function Recommendations({ recommendations }: Props) {
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = priorityFilter === 'all'
    ? recommendations
    : recommendations.filter(r => r.priority === priorityFilter);

  const priorityConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
    immediate: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Immediate', icon: 'fa-bolt' },
    'short-term': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Short-term', icon: 'fa-clock' },
    'medium-term': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Medium-term', icon: 'fa-calendar' },
    'long-term': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Long-term', icon: 'fa-hourglass' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-road text-green-400"></i>
          Improvement Roadmap
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Prioritized recommendations to make the architecture production-ready and future-proof
        </p>
      </div>

      {/* Priority Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'immediate', 'short-term', 'medium-term', 'long-term'].map(p => {
          const config = p === 'all' ? null : priorityConfig[p];
          return (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                priorityFilter === p
                  ? p === 'all' ? 'bg-gray-700 text-white' : `${config?.bg} ${config?.color} border ${config?.border}`
                  : 'text-gray-500 hover:text-gray-300 bg-gray-800/30 border border-gray-800/30'
              }`}
            >
              {config && <i className={`fa-solid ${config.icon} text-[10px]`}></i>}
              {p === 'all' ? 'All Priorities' : config?.label}
            </button>
          );
        })}
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        {filtered.map((rec, index) => {
          const config = priorityConfig[rec.priority];
          const isExpanded = expandedRec === rec.id;

          return (
            <div
              key={rec.id}
              className="relative"
            >
              {/* Timeline connector */}
              {index < filtered.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-gray-800/50 -mb-4"></div>
              )}

              <div className={`border rounded-xl overflow-hidden transition-all ${config.border} bg-[#0d1220]`}>
                <button
                  onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} border ${config.border}`}>
                    <i className={`fa-solid ${config.icon} ${config.color}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border} uppercase font-bold`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{rec.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400">
                        {rec.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                        {rec.benefits.length} benefits
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
                        {rec.tradeoffs.length} tradeoffs
                      </span>
                    </div>
                  </div>
                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-500 text-xs mt-1`}></i>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800/30">
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      {/* Implementation Steps */}
                      <div>
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <i className="fa-solid fa-list-check text-[10px]"></i>
                          Implementation Steps
                        </h4>
                        <ol className="space-y-2">
                          {rec.implementationSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check text-[10px]"></i>
                          Benefits
                        </h4>
                        <ul className="space-y-2">
                          {rec.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <i className="fa-solid fa-plus text-green-500 text-[8px] mt-1 shrink-0"></i>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tradeoffs */}
                      <div>
                        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <i className="fa-solid fa-scale-balanced text-[10px]"></i>
                          Tradeoffs
                        </h4>
                        <ul className="space-y-2">
                          {rec.tradeoffs.map((tradeoff, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <i className="fa-solid fa-minus text-orange-500 text-[8px] mt-1 shrink-0"></i>
                              <span>{tradeoff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
