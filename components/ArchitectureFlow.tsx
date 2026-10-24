import type { architectureLayers } from './data/architectureData';

interface Props {
  layers: typeof architectureLayers;
}

export function ArchitectureFlow({ layers }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-arrows-spin text-cyan-400"></i>
          Data Flow & Module Boundaries
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Visual representation of data flow between architecture layers with boundary analysis
        </p>
      </div>

      {/* Main Flow Diagram */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
          <i className="fa-solid fa-diagram-project text-blue-400"></i>
          High-Level Production Flow
        </h3>

        <div className="min-w-[800px]">
          {/* Row 1: Input to Market */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlowNode label="Validated Market Inputs" sublabel="OHLCV, ticks, bid/ask, Greeks" color="#3B82F6" icon="fa-chart-line" />
            <FlowArrow />
            <FlowNode label="MarketView & Canvas" sublabel="Causal view with cutoff & quality" color="#3B82F6" icon="fa-eye" />
            <FlowArrow />
            <FlowNode label="Strategy Decision" sublabel="Typed Intent generation" color="#EF4444" icon="fa-brain" />
          </div>

          {/* Row 2: Cognition feeding in */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex flex-col items-center">
              <FlowNode label="Tier2 Cognition" sublabel="Proposals, reviews, advice" color="#8B5CF6" icon="fa-robot" />
              <div className="flex items-center gap-1 mt-1">
                <i className="fa-solid fa-arrow-up text-purple-400 text-[10px]"></i>
                <span className="text-[9px] text-purple-400">typed proposals</span>
              </div>
            </div>
          </div>

          {/* Row 3: Kernel Core */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlowNode label="Planning Port" sublabel="Versioned implementations" color="#EF4444" icon="fa-clipboard-list" />
            <FlowArrow />
            <FlowNode label="Admission & Safety" sublabel="Exact checks, account state" color="#EF4444" icon="fa-shield-halved" />
            <FlowArrow />
            <FlowNode label="Reservation" sublabel="Atomic identity & commit" color="#EF4444" icon="fa-lock" />
            <FlowArrow />
            <FlowNode label="Execution Coordinator" sublabel="Sole live execution owner" color="#EF4444" icon="fa-server" />
          </div>

          {/* Row 4: Broker & Effects */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlowNode label="OpenAlgo Adapter" sublabel="Sole broker boundary" color="#F59E0B" icon="fa-plug" />
            <FlowArrow />
            <FlowNode label="Broker Effects" sublabel="Fills, positions, P&L" color="#F59E0B" icon="fa-bolt" />
            <FlowArrow />
            <FlowNode label="Observations" sublabel="Validated, fresh, complete" color="#F59E0B" icon="fa-binoculars" />
          </div>

          {/* Row 5: Ledger & Supervisor */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <FlowNode label="SQLite WAL Ledger" sublabel="Hash-chained, verified" color="#10B981" icon="fa-database" />
            <FlowArrow />
            <FlowNode label="Evidence Export" sublabel="Causal with outcome class" color="#10B981" icon="fa-file-export" />
            <div className="w-8"></div>
            <FlowNode label="Supervisor" sublabel="Protection & reconciliation" color="#06B6D4" icon="fa-user-shield" />
          </div>

          {/* Row 6: Recovery & UI */}
          <div className="flex items-center justify-center gap-3">
            <FlowNode label="Backup & Restore" sublabel="WAL-aware, fenced" color="#14B8A6" icon="fa-cloud-arrow-down" />
            <div className="w-8"></div>
            <FlowNode label="Owner Governance" sublabel="Policy & session binding" color="#A855F7" icon="fa-user-lock" />
            <div className="w-8"></div>
            <FlowNode label="Operator UI" sublabel="Metrics, traces, alerts" color="#14B8A6" icon="fa-desktop" />
          </div>
        </div>
      </div>

      {/* Boundary Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i className="fa-solid fa-border-all text-blue-400"></i>
            Critical Boundaries
          </h3>
          <div className="space-y-3">
            {[
              { from: 'Market → Strategy', risk: 'Stale data can trigger wrong intents', mitigation: 'Quality cutoff + freshness check' },
              { from: 'Cognition → Decision', risk: 'Oscillation or excessive proposals', mitigation: 'Cooldown + rate limits + confidence threshold' },
              { from: 'Strategy → Planning', risk: 'Intent must be fully typed & validated', mitigation: 'Schema validation at boundary' },
              { from: 'Admission → Reservation', risk: 'Race conditions in concurrent admission', mitigation: 'Atomic reservation with identity' },
              { from: 'Coordinator → Broker', risk: 'Network failures create ambiguity', mitigation: 'Idempotency keys + reconciliation' },
              { from: 'Broker → Observations', risk: 'Stale or incomplete observations', mitigation: 'Identity + freshness + completeness validation' },
              { from: 'Ledger → Backup', risk: 'Inconsistent backup during writes', mitigation: 'WAL-aware consistent snapshot' },
              { from: 'Simulation → Production', risk: 'Shared code accidentally armed', mitigation: 'Capability-based isolation + runtime assertions' },
            ].map((boundary, i) => (
              <div key={i} className="p-2 rounded-lg bg-gray-800/20 border border-gray-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{boundary.from}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  <span className="text-red-400">Risk:</span> {boundary.risk}
                </p>
                <p className="text-[11px] text-gray-400">
                  <span className="text-green-400">Mitigation:</span> {boundary.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <i className="fa-solid fa-arrows-left-right text-purple-400"></i>
            Data Flow Patterns
          </h3>
          <div className="space-y-3">
            {[
              {
                pattern: 'Unidirectional Pipeline',
                description: 'Market data flows strictly forward: Ingest → Store → View → Canvas → Tools → Render',
                status: 'good',
                note: 'No backward dependencies. Clean separation.'
              },
              {
                pattern: 'Bidirectional Advisory',
                description: 'Cognition ↔ Decision: proposals flow up, state changes flow down',
                status: 'warning',
                note: 'Needs oscillation controls and rate limiting.'
              },
              {
                pattern: 'Request-Response with Async',
                description: 'Kernel → Broker: synchronous execution, asynchronous observations',
                status: 'warning',
                note: 'Ambiguous results need formal resolution protocol.'
              },
              {
                pattern: 'Append-Only with Verified Reads',
                description: 'Ledger writes are append-only; reads use verified projections',
                status: 'good',
                note: 'Strong integrity guarantees. Hash-chaining provides tamper evidence.'
              },
              {
                pattern: 'Mirror with Isolation',
                description: 'Simulation mirrors production code paths but is fully disarmed',
                status: 'warning',
                note: 'Disarming needs formal verification, not just convention.'
              },
              {
                pattern: 'Evidence Pipeline',
                description: 'Ledger → Export → Bundles → Custody → Experiments → Promotion',
                status: 'good',
                note: 'Clear unidirectional flow with immutable bundles.'
              },
              {
                pattern: 'Async Telemetry',
                description: 'Ledger → UI: asynchronous observability data',
                status: 'info',
                note: 'Needs structured metrics, tracing, and alerting rules.'
              },
            ].map((flow, i) => {
              const statusColors: Record<string, { dot: string; text: string }> = {
                good: { dot: 'bg-green-500', text: 'text-green-400' },
                warning: { dot: 'bg-yellow-500', text: 'text-yellow-400' },
                info: { dot: 'bg-blue-500', text: 'text-blue-400' },
              };
              const sc = statusColors[flow.status];
              return (
                <div key={i} className="p-2 rounded-lg bg-gray-800/20 border border-gray-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                    <span className="text-xs font-medium text-white">{flow.pattern}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-1">{flow.description}</p>
                  <p className={`text-[10px] ${sc.text}`}>{flow.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation vs Production Comparison */}
      <div className="bg-[#0d1220] border border-gray-800/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-code-compare text-amber-400"></i>
          Production vs Simulation Boundary Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800/50">
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Aspect</th>
                <th className="text-left py-2 px-3 text-red-400 font-medium">Production</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Simulation</th>
                <th className="text-left py-2 px-3 text-amber-400 font-medium">Shared?</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                ['Strategy Logic', 'Live decision & typed Intent', 'Same strategy, recorded clock', '✅ Yes'],
                ['Planning Port', 'Versioned implementations', 'Same port, same implementations', '✅ Yes'],
                ['Admission', 'Exact checks + account state', 'Same transitions, simulated account', '✅ Yes'],
                ['Reservation', 'Atomic identity + commit', 'Same reservation transitions', '✅ Yes'],
                ['Coordinator', 'Sole live execution owner', 'No live socket or credential', '⚠️ Different'],
                ['Broker', 'OpenAlgo live adapter', 'Local model (orders, fills, costs)', '❌ No'],
                ['Ledger', 'Hash-chained production', 'Separate simulation run ledger', '❌ No'],
                ['Lifecycle', 'Protection + settlement', 'Same functions, simulated effects', '✅ Yes'],
                ['Market Data', 'Live causal MarketView', 'Recorded clock, immutable bundle', '❌ No'],
                ['Credentials', 'Broker API keys', 'None (capability-removed)', '❌ No'],
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-800/20 hover:bg-gray-800/10">
                  <td className="py-2 px-3 font-medium text-white">{row[0]}</td>
                  <td className="py-2 px-3">{row[1]}</td>
                  <td className="py-2 px-3">{row[2]}</td>
                  <td className="py-2 px-3">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FlowNode({ label, sublabel, color, icon }: { label: string; sublabel: string; color: string; icon: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border min-w-[160px]"
      style={{
        borderColor: `${color}44`,
        backgroundColor: `${color}10`,
      }}
    >
      <i className={`fa-solid ${icon} text-sm`} style={{ color }}></i>
      <div>
        <div className="text-[11px] font-semibold text-white">{label}</div>
        <div className="text-[9px] text-gray-500">{sublabel}</div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center text-gray-600">
      <i className="fa-solid fa-arrow-right text-xs"></i>
    </div>
  );
}
