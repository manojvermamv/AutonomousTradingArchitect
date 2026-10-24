import type { ArchitectureModule, ArchitectureIssue, Recommendation } from './data/architectureData';

interface Props {
  modules: ArchitectureModule[];
  issues: ArchitectureIssue[];
  recommendations: Recommendation[];
}

interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  color: string;
  details: string;
  factors: { label: string; status: 'good' | 'warning' | 'bad'; note: string }[];
}

export function Scorecard({ modules, issues, recommendations }: Props) {
  const dimensions: DimensionScore[] = [
    {
      dimension: 'Separation of Concerns',
      score: 8.5,
      maxScore: 10,
      color: '#10B981',
      details: 'Excellent tier separation between execution, cognition, and safety',
      factors: [
        { label: 'Tier1/Tier2 boundary', status: 'good', note: 'Clear, enforced separation' },
        { label: 'Supervisor independence', status: 'good', note: 'Proposal-only model' },
        { label: 'Simulation isolation', status: 'warning', note: 'Shared code, disarming not verified' },
        { label: 'Module count', status: 'good', note: '9 well-defined modules' },
      ]
    },
    {
      dimension: 'Transaction Safety',
      score: 5.5,
      maxScore: 10,
      color: '#EF4444',
      details: 'Missing idempotency and ambiguous result handling are critical gaps',
      factors: [
        { label: 'Idempotency guarantees', status: 'bad', note: 'Not visible at boundaries' },
        { label: 'Atomic reservations', status: 'good', note: 'Explicit atomic commit' },
        { label: 'Ambiguous result handling', status: 'bad', note: 'No formal state machine' },
        { label: 'Hash-chained integrity', status: 'good', note: 'Tamper-evident ledger' },
      ]
    },
    {
      dimension: 'Resilience & HA',
      score: 4.0,
      maxScore: 10,
      color: '#EF4444',
      details: 'Single kernel SPOF and single broker dependency are critical',
      factors: [
        { label: 'Kernel redundancy', status: 'bad', note: 'Single instance, no failover' },
        { label: 'Broker redundancy', status: 'bad', note: 'OpenAlgo only, no fallback' },
        { label: 'Backpressure', status: 'bad', note: 'No visible mechanism' },
        { label: 'Recovery path', status: 'warning', note: 'Exists but complex fencing' },
      ]
    },
    {
      dimension: 'Scalability',
      score: 5.0,
      maxScore: 10,
      color: '#F59E0B',
      details: 'SQLite ceiling and single-node architecture limit growth',
      factors: [
        { label: 'Database scaling', status: 'bad', note: 'SQLite WAL single-writer' },
        { label: 'Horizontal scaling', status: 'bad', note: 'Single-node design' },
        { label: 'Multi-region', status: 'bad', note: 'No replication strategy' },
        { label: 'Code evolution', status: 'good', note: 'Versioned ports enable growth' },
      ]
    },
    {
      dimension: 'Observability',
      score: 4.5,
      maxScore: 10,
      color: '#F59E0B',
      details: 'UI observability mentioned but architecture under-specified',
      factors: [
        { label: 'Structured logging', status: 'warning', note: 'Not explicitly detailed' },
        { label: 'Metrics & tracing', status: 'bad', note: 'No OTel or equivalent' },
        { label: 'Alerting rules', status: 'bad', note: 'Not defined' },
        { label: 'Operator dashboard', status: 'warning', note: 'Mentioned but not detailed' },
      ]
    },
    {
      dimension: 'Safety & Governance',
      score: 7.0,
      maxScore: 10,
      color: '#10B981',
      details: 'Strong safety model but single-owner governance is a risk',
      factors: [
        { label: 'Execution authority', status: 'good', note: 'Sole kernel ownership' },
        { label: 'Cognitive credentials', status: 'good', note: 'Explicitly excluded' },
        { label: 'Owner governance', status: 'warning', note: 'Single-person dependency' },
        { label: 'Audit trail', status: 'good', note: 'Hash-chained ledger' },
      ]
    },
    {
      dimension: 'Research & Evolution',
      score: 8.0,
      maxScore: 10,
      color: '#10B981',
      details: 'Excellent evidence pipeline with custody and protected evaluation',
      factors: [
        { label: 'Evidence export', status: 'good', note: 'Complete with outcome class' },
        { label: 'Immutable bundles', status: 'good', note: 'Content-hashed' },
        { label: 'Protected evaluation', status: 'good', note: 'One-use locked exam' },
        { label: 'RL integration', status: 'warning', note: 'Reward signal definition critical' },
      ]
    },
    {
      dimension: 'Operational Readiness',
      score: 5.5,
      maxScore: 10,
      color: '#F59E0B',
      details: 'Backup/restore exists but RTO/RPO targets and automation are missing',
      factors: [
        { label: 'Backup consistency', status: 'good', note: 'WAL-aware approach' },
        { label: 'RTO/RPO targets', status: 'bad', note: 'Not explicitly defined' },
        { label: 'Recovery automation', status: 'warning', note: 'Manual fence proof' },
        { label: 'Deployment strategy', status: 'warning', note: 'Not specified' },
      ]
    },
  ];

  const overallScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;
  const totalIssues = issues.length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getOverallGrade = (score: number) => {
    if (score >= 8.5) return { grade: 'A', label: 'Production Ready', color: 'text-green-400' };
    if (score >= 7) return { grade: 'B', label: 'Near Production', color: 'text-yellow-400' };
    if (score >= 5.5) return { grade: 'C', label: 'Needs Hardening', color: 'text-orange-400' };
    return { grade: 'D', label: 'Not Ready', color: 'text-red-400' };
  };

  const grade = getOverallGrade(overallScore);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-chart-bar text-indigo-400"></i>
          Architecture Scorecard
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Multi-dimensional assessment of architecture readiness for production transaction processing
        </p>
      </div>

      {/* Overall Score */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-800" />
              <circle
                cx="64" cy="64" r="56"
                stroke="currentColor" strokeWidth="8" fill="none"
                className={grade.color.replace('text-', 'text-')}
                strokeDasharray={`${(overallScore / 10) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${grade.color}`}>{overallScore.toFixed(1)}</span>
              <span className="text-[10px] text-gray-500">/ 10.0</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className={`text-4xl font-bold ${grade.color} mb-1`}>Grade {grade.grade}</div>
            <div className="text-lg text-gray-300">{grade.label}</div>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span><span className="text-red-400 font-bold">{criticalCount}</span> Critical</span>
              <span><span className="text-orange-400 font-bold">{highCount}</span> High</span>
              <span><span className="text-gray-300 font-bold">{totalIssues}</span> Total Issues</span>
              <span><span className="text-green-400 font-bold">{recommendations.length}</span> Recommendations</span>
            </div>
          </div>
          <div className="md:ml-auto text-center md:text-right bg-gray-800/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Production Readiness Summary</p>
            <p className="text-sm text-gray-300 max-w-sm">
              Strong conceptual architecture with clear boundaries. Critical gaps in resilience (HA),
              transaction safety (idempotency), and scalability must be addressed before live trading.
            </p>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid md:grid-cols-2 gap-4">
        {dimensions.map(dim => (
          <div key={dim.dimension} className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">{dim.dimension}</h4>
              <span className={`text-lg font-bold ${getScoreColor(dim.score)}`}>
                {dim.score.toFixed(1)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(dim.score / dim.maxScore) * 100}%`,
                  backgroundColor: dim.color,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">{dim.details}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {dim.factors.map((factor, i) => {
                const statusColors: Record<string, string> = {
                  good: 'bg-green-500',
                  warning: 'bg-yellow-500',
                  bad: 'bg-red-500',
                };
                return (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[factor.status]} mt-1 shrink-0`}></span>
                    <div>
                      <span className="text-gray-300">{factor.label}</span>
                      <span className="text-gray-500 block">{factor.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Module Coverage */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-cubes-stacked text-blue-400"></i>
          Module Coverage Analysis
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {modules.map(module => {
            const moduleIssueCount = issues.filter(i => i.affectedModules.includes(module.id)).length;
            const criticalModuleIssues = issues.filter(i => i.affectedModules.includes(module.id) && i.severity === 'critical').length;
            const highModuleIssues = issues.filter(i => i.affectedModules.includes(module.id) && i.severity === 'high').length;

            let healthColor = 'green';
            if (criticalModuleIssues > 0) healthColor = 'red';
            else if (highModuleIssues > 0) healthColor = 'orange';
            else if (moduleIssueCount > 1) healthColor = 'yellow';

            const healthColors: Record<string, { bg: string; border: string; text: string }> = {
              green: { bg: 'bg-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
              yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-400' },
              orange: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400' },
              red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400' },
            };

            const hc = healthColors[healthColor];

            return (
              <div key={module.id} className={`${hc.bg} border ${hc.border} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white">{module.name}</span>
                  <span className={`text-[10px] ${hc.text}`}>{moduleIssueCount} issues</span>
                </div>
                <div className="flex gap-1">
                  {criticalModuleIssues > 0 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {criticalModuleIssues} critical
                    </span>
                  )}
                  {highModuleIssues > 0 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {highModuleIssues} high
                    </span>
                  )}
                  {moduleIssueCount === 0 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      healthy
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Verdict */}
      <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-gray-800/50 rounded-xl p-6">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <i className="fa-solid fa-gavel text-amber-400"></i>
          Final Verdict & Path Forward
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-xs font-bold text-red-400 mb-2">🔴 Must Fix Before Live</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-300">
              <li>• Idempotency at all external boundaries</li>
              <li>• Formal ambiguous result resolution</li>
              <li>• Kernel failover mechanism</li>
              <li>• Simulation disarming verification</li>
            </ul>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-xs font-bold text-yellow-400 mb-2">🟡 Should Fix Soon</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-300">
              <li>• Comprehensive observability stack</li>
              <li>• Backpressure & rate limiting</li>
              <li>• Multi-sig governance</li>
              <li>• RTO/RPO targets & testing</li>
            </ul>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-xs font-bold text-blue-400 mb-2">🔵 Future Enhancement</h4>
            <ul className="space-y-1.5 text-[11px] text-gray-300">
              <li>• Multi-broker adapter abstraction</li>
              <li>• Database scaling migration</li>
              <li>• Horizontal kernel scaling</li>
              <li>• API versioning strategy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
