import type { ArchitectureModule, ArchitectureIssue, Recommendation } from '../data/architectureData';
import { architectureLayers } from '../data/architectureData';

interface Props {
  modules: ArchitectureModule[];
  issues: ArchitectureIssue[];
  recommendations: Recommendation[];
  layers: typeof architectureLayers;
}

export function ArchitectureOverview({ modules, issues, recommendations, layers }: Props) {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  const verifyFirstRecs = recommendations.filter(r => r.priority === 'verify-first');
  const measureFirstRecs = recommendations.filter(r => r.priority === 'measure-first');
  const ownerDecisionRecs = recommendations.filter(r => r.priority === 'owner-decision');

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-gray-800/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <i className="fa-solid fa-clipboard-check text-blue-400"></i>
          Executive Summary
        </h2>
        <p className="text-gray-300 leading-relaxed text-sm">
          Your architecture demonstrates <span className="text-green-400 font-semibold">strong foundational thinking</span> with
          clear separation of concerns between Tier1 (execution) and Tier2 (cognition), hash-chained ledger integrity,
          and a well-designed simulation/production code sharing model. However, several <span className="text-red-400 font-semibold">critical
          resilience gaps</span> and <span className="text-orange-400 font-semibold">transaction safety concerns</span> must be addressed
          before production deployment. The architecture is conceptually sound but needs hardening for real-money operation.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Modules"
          value={modules.length}
          icon="fa-cubes"
          color="blue"
          subtitle="Distinct boundaries"
        />
        <MetricCard
          label="Issues Found"
          value={issues.length}
          icon="fa-triangle-exclamation"
          color="red"
          subtitle={`${criticalIssues.length} critical, ${highIssues.length} high`}
        />
        <MetricCard
          label="Recommendations"
          value={recommendations.length}
          icon="fa-lightbulb"
          color="green"
          subtitle={`${verifyFirstRecs.length} verify · ${measureFirstRecs.length} measure · ${ownerDecisionRecs.length} owner decision`}
        />
        <MetricCard
          label="Architecture Layers"
          value={layers.length}
          icon="fa-layer-group"
          color="purple"
          subtitle="End-to-end coverage"
        />
      </div>

      {/* Architecture Strengths */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
          <h3 className="text-base font-bold text-green-400 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-shield-check"></i>
            Architecture Strengths
          </h3>
          <ul className="space-y-3">
            {[
              { text: 'Sole execution ownership eliminates ambiguity in the kernel', icon: 'fa-lock' },
              { text: 'Hash-chained ledger provides tamper-evident financial records', icon: 'fa-link' },
              { text: 'Clear Tier1/Tier2 separation prevents cognition from direct execution', icon: 'fa-shield-halved' },
              { text: 'Shared code between production and simulation reduces divergence', icon: 'fa-code-branch' },
              { text: 'Supervisor is proposal-only, preserving kernel authority', icon: 'fa-user-shield' },
              { text: 'Immutable research bundles with content hashes ensure reproducibility', icon: 'fa-fingerprint' },
              { text: 'WAL-aware backup ensures consistent recovery points', icon: 'fa-database' },
              { text: 'Versioned planning port enables safe evolution', icon: 'fa-code-pull-request' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <i className={`fa-solid ${item.icon} text-green-500 mt-0.5 text-xs`}></i>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
          <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            Critical Gaps
          </h3>
          <ul className="space-y-3">
            {[
              { text: 'Single Tier-1 writer; measure availability needs before proposing redundancy', icon: 'fa-server' },
              { text: 'Missing idempotency guarantees at transaction boundaries', icon: 'fa-copy' },
              { text: 'Single broker vendor dependency (OpenAlgo) with no fallback', icon: 'fa-plug-circle-xmark' },
              { text: 'Ambiguous result handling lacks formal state machine', icon: 'fa-question' },
              { text: 'Simulation disarming not formally verified', icon: 'fa-flask' },
              { text: 'No backpressure mechanism in market data pipeline', icon: 'fa-gauge-high' },
              { text: 'Owner governance is single-person dependency', icon: 'fa-user-lock' },
              { text: 'SQLite scalability ceiling for growing transaction volumes', icon: 'fa-chart-line' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <i className={`fa-solid ${item.icon} text-red-500 mt-0.5 text-xs`}></i>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Architecture Layer Overview */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-purple-400"></i>
          Architecture Layers & Boundaries
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="rounded-lg p-3 border transition-all hover:scale-[1.02]"
              style={{
                borderColor: `${layer.color}33`,
                backgroundColor: `${layer.color}08`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.color }}
                ></div>
                <span className="text-sm font-semibold text-white">{layer.name}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {layer.components.slice(0, 4).map((comp) => (
                  <span
                    key={comp}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400"
                  >
                    {comp}
                  </span>
                ))}
                {layer.components.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-500">
                    +{layer.components.length - 4}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">{layer.dataFlow}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Readiness Assessment */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-gavel text-amber-400"></i>
          Transaction Readiness Assessment
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ReadinessBlock
            title="Currently Ready"
            color="green"
            items={[
              'Market data ingestion with provenance',
              'Hash-chained ledger integrity',
              'Simulation/production code sharing',
              'Supervisor independence model',
              'Typed proposal/review system',
            ]}
          />
          <ReadinessBlock
            title="Needs Hardening"
            color="yellow"
            items={[
              'Idempotency at all boundaries',
              'Ambiguous result resolution',
              'Backpressure & rate limiting',
              'Observability & alerting',
              'Formal simulation isolation',
            ]}
          />
          <ReadinessBlock
            title="Not Ready"
            color="red"
            items={[
              'Kernel high availability',
              'Multi-broker support',
              'Database scaling path',
              'Multi-signature governance',
              'Disaster recovery automation',
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, subtitle }: {
  label: string; value: number; icon: string; color: string; subtitle: string;
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <i className={`fa-solid ${icon} ${textColors[color]} text-sm`}></i>
      </div>
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ReadinessBlock({ title, color, items }: { title: string; color: string; items: string[] }) {
  const colors: Record<string, { border: string; text: string; bg: string; dot: string }> = {
    green: { border: 'border-green-500/20', text: 'text-green-400', bg: 'bg-green-500/5', dot: 'bg-green-500' },
    yellow: { border: 'border-yellow-500/20', text: 'text-yellow-400', bg: 'bg-yellow-500/5', dot: 'bg-yellow-500' },
    red: { border: 'border-red-500/20', text: 'text-red-400', bg: 'bg-red-500/5', dot: 'bg-red-500' },
  };
  const c = colors[color];

  return (
    <div className={`${c.bg} border ${c.border} rounded-lg p-4`}>
      <h4 className={`text-sm font-bold ${c.text} mb-3`}>{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`}></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
