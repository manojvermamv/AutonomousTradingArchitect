import { useState } from 'react';
import type { ArchitectureIssue } from '../data/architectureData';
import { codeVerifiedFindings, sourceUrl } from '../data/codeVerifiedFindings';

interface Props {
  issues: ArchitectureIssue[];
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type CategoryFilter = 'all' | string;

export function IssueAnalysis({ issues }: Props) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const categories = ['all', ...new Set(issues.map(i => i.category))];

  const filtered = issues.filter(i => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    return true;
  });

  const severityConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'fa-circle-exclamation' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'fa-exclamation' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'fa-minus' },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'fa-info' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
            Issue Analysis
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {filtered.length} of {issues.length} issues shown. H-dashboard labels are presentation assessments, not code-verified findings.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Severity:</span>
          <div className="flex gap-1">
            {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  severityFilter === s
                    ? s === 'all' ? 'bg-gray-700 text-white' : `${severityConfig[s]?.bg} ${severityConfig[s]?.color} border ${severityConfig[s]?.border}`
                    : 'text-gray-500 hover:text-gray-300 bg-gray-800/30'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filtered.map(issue => {
          const config = severityConfig[issue.severity];
          const isExpanded = expandedIssue === issue.id;

          return (
            <div
              key={issue.id}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${config.border} ${config.bg}`}
            >
              <button
                onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} border ${config.border}`}>
                  <i className={`fa-solid ${config.icon} ${config.color} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border} uppercase font-bold`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{issue.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400">
                      {issue.category}
                    </span>
                    {issue.affectedModules.map(m => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/30 text-gray-500">
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 font-semibold text-sky-200">
                      {issue.evidenceClass} · presentation assessment
                    </span>
                    {issue.relatedFindingIds.length > 0 ? (
                      <span className="text-gray-400">
                        Related code context only (does not verify this claim):{' '}
                        {issue.relatedFindingIds.map((findingId, index) => {
                          const finding = codeVerifiedFindings.find(item => item.id === findingId);
                          const source = finding?.sources[0];
                          if (!finding || !source) return null;
                          return (
                            <span key={findingId}>
                              {index > 0 ? ', ' : ''}
                              <a
                                className="text-blue-300 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-200"
                                href={sourceUrl(source.path, source.line)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {findingId}
                              </a>
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-500">No mapped code finding; verify separately.</span>
                    )}
                  </div>
                </div>
                <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-500 text-xs mt-1`}></i>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-800/30 mt-0">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{issue.description}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Impact</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{issue.impact}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Recommendation</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="fa-solid fa-check-circle text-3xl mb-3 text-green-500/50"></i>
          <p>No issues match the current filters.</p>
        </div>
      )}
    </div>
  );
}
