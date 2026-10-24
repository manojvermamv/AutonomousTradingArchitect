export type FindingSeverity = 'high' | 'medium' | 'low' | 'boundary';

export interface CodeFindingSource {
  path: string;
  line: number;
}

export interface CodeVerifiedFinding {
  id: `F${number}`;
  evidenceClass: 'C-code-verified';
  title: string;
  severity: FindingSeverity;
  summary: string;
  evidenceLimit: string;
  sources: CodeFindingSource[];
}

export const codeAuditRevision = '445eb116514d97c2574c44d4d5374f938dec57a3';
export const codeAuditBranch = 'claude/openalgo-trading-architecture-uu1bxn';
export const codeAuditDate = '24 October 2026 (UTC)';
export const codeAuditRepository = 'https://github.com/manojvermamv/AutonomousTrading';

// These findings and source locations mirror the dated audit already documented in README.md.
// This presentation data does not claim a new source inspection in the current phase.
export const codeVerifiedFindings: CodeVerifiedFinding[] = [
  {
    id: 'F1',
    evidenceClass: 'C-code-verified',
    title: 'ACK success can outlive local persistence failure',
    severity: 'high',
    summary: 'The audited gateway path ignores the registry ACK persistence result and can return success while local ownership persistence is unresolved.',
    evidenceLimit: 'Canonical ACK identity is retained; the audit did not establish a duplicate send, canonical-history loss, or financial loss.',
    sources: [
      { path: 'src/core/framework/execution/registry.py', line: 139 },
      { path: 'src/core/framework/execution/registry.py', line: 414 },
      { path: 'src/runtime/execution_gateway/__init__.py', line: 1151 },
    ],
  },
  {
    id: 'F2',
    evidenceClass: 'C-code-verified',
    title: 'Cancel and modify intents do not settle locally',
    severity: 'medium',
    summary: 'The inspected lifecycle settles close intents but leaves cancel/modify reservations unresolved after their canonical outcome.',
    evidenceLimit: 'The audit says canonical identity still constrains resend; the impact is stale local lifecycle/recovery state.',
    sources: [
      { path: 'src/runtime/execution_gateway/__init__.py', line: 691 },
      { path: 'src/runtime/execution_gateway/__init__.py', line: 1237 },
      { path: 'src/runtime/execution_gateway/__init__.py', line: 1403 },
      { path: 'src/runtime/execution_gateway/__init__.py', line: 1580 },
    ],
  },
  {
    id: 'F3',
    evidenceClass: 'C-code-verified',
    title: 'Mutable authority indexes sit outside chain validation',
    severity: 'medium',
    summary: 'The ledger verifies event rows, while mutable epoch/command/broker indexes are trusted by selected read and write paths.',
    evidenceLimit: 'Normal writers are transactional; no current incident was observed. This is a consistency/integrity gap under scoped conditions.',
    sources: [
      { path: 'src/tier1/schema.py', line: 51 },
      { path: 'src/tier1/schema.py', line: 63 },
      { path: 'src/tier1/schema.py', line: 71 },
      { path: 'src/tier1/ledger.py', line: 299 },
    ],
  },
  {
    id: 'F4',
    evidenceClass: 'C-code-verified',
    title: 'The wheel omits required packages',
    severity: 'medium',
    summary: 'The explicit packaging list omits regular packages imported by included runtime modules.',
    evidenceLimit: 'Checkout behavior can mask this packaging gap; the audit did not execute an installed-wheel build.',
    sources: [
      { path: 'pyproject.toml', line: 112 },
      { path: 'src/runtime/session_state.py', line: 14 },
      { path: 'src/data/replay_engine/proposal_receipt.py', line: 11 },
    ],
  },
  {
    id: 'F5',
    evidenceClass: 'C-code-verified',
    title: 'Service environment conflicts with the research guard',
    severity: 'medium',
    summary: 'The research worker service injects AT_RUN_DIR, while the environment allowlist rejects that variable.',
    evidenceLimit: 'The source-level blocker is documented; installed service behavior and queue progress were not inspected.',
    sources: [
      { path: 'deploy/systemd/at-research-worker.service', line: 13 },
      { path: 'src/analysis/jobs/policy.py', line: 33 },
      { path: 'src/analysis/jobs/policy.py', line: 95 },
      { path: 'src/analysis/jobs/policy.py', line: 199 },
    ],
  },
  {
    id: 'F6',
    evidenceClass: 'C-code-verified',
    title: 'Informational mode authentication differs from REST auth',
    severity: 'low',
    summary: 'The REST path accepts configured header/body authentication, while analyze_mode uses a hardcoded apikey body field.',
    evidenceLimit: 'The mismatch can make status appear unknown; it does not gate order sends.',
    sources: [
      { path: 'src/interfaces/mcp/core/openalgo.py', line: 164 },
      { path: 'src/interfaces/mcp/core/openalgo.py', line: 576 },
    ],
  },
  {
    id: 'F7',
    evidenceClass: 'C-code-verified',
    title: 'Legacy replay records omit the replay marker',
    severity: 'low',
    summary: 'The multi-leg formation includes replay=true while the legacy formation omits it; the registry accepts extra fields.',
    evidenceLimit: 'The audit treats this as inconsistent provenance metadata, not a send risk under the disarmed adapter.',
    sources: [
      { path: 'src/data/replay_engine/producer.py', line: 266 },
      { path: 'src/data/replay_engine/producer.py', line: 282 },
      { path: 'src/core/framework/execution/registry.py', line: 186 },
    ],
  },
  {
    id: 'F8',
    evidenceClass: 'C-code-verified',
    title: 'Dormant duplicate checkpoint API can persist a bad digest',
    severity: 'low',
    summary: 'The checkpoint API assumes new events while ledger append may skip duplicates and still store the supplied checkpoint.',
    evidenceLimit: 'No production caller was found in the audited scope; this is a dormant hazard, not a current runtime failure.',
    sources: [
      { path: 'src/tier1/projections/base.py', line: 174 },
      { path: 'src/tier1/ledger.py', line: 217 },
      { path: 'src/tier1/ledger.py', line: 253 },
    ],
  },
  {
    id: 'F9',
    evidenceClass: 'C-code-verified',
    title: 'Cross-host fencing remains an operational boundary',
    severity: 'boundary',
    summary: 'Local flock and epoch fencing cannot revoke an old host’s broker credential by themselves.',
    evidenceLimit: 'This is a boundary requiring external incapability/revocation and reconciliation, not a detected exploit or approval for active-active execution.',
    sources: [
      { path: 'src/tier1/ledger.py', line: 83 },
      { path: 'src/tier1/ledger.py', line: 150 },
    ],
  },
];

export function sourceUrl(path: string, line: number): string {
  return `${codeAuditRepository}/blob/${codeAuditRevision}/${path}#L${line}`;
}
