export type EvidenceClass = 'H-dashboard' | 'C-code-verified';

export interface ArchitectureIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidenceClass: EvidenceClass;
  relatedFindingIds: string[];
  category: string;
  description: string;
  impact: string;
  recommendation: string;
  affectedModules: string[];
}

export interface ArchitectureModule {
  id: string;
  name: string;
  tier: string;
  responsibility: string;
  concerns: string[];
  strengths: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  priority: 'verify-first' | 'measure-first' | 'owner-decision';
  category: string;
  description: string;
  implementationSteps: string[];
  benefits: string[];
  tradeoffs: string[];
}

export const modules: ArchitectureModule[] = [
  {
    id: 'market',
    name: 'Market Data & Canvas',
    tier: 'Infrastructure',
    responsibility: 'Ingest, validate, normalize, and provide causal market views with quality cutoffs',
    concerns: [
      'Single ingestion path creates bottleneck risk',
      'No explicit backpressure mechanism visible',
      'Quality cutoff semantics need formal specification'
    ],
    strengths: [
      'Clear provenance tracking',
      'Versioned facts with geometry and evidence',
      'Bounded tooling with as-of overlay'
    ]
  },
  {
    id: 'cognition',
    name: 'Tier2 Cognition',
    tier: 'Advisory',
    responsibility: 'Cognitive agents providing typed proposals, reviews, and advice without financial credentials',
    concerns: [
      'Feedback loop with decision layer could create oscillation',
      'Memory partitioning strategy unclear',
      'No explicit timeout/circuit-breaker for cognitive delays'
    ],
    strengths: [
      'Clear separation from financial credentials',
      'Typed proposals enable verification',
      'Blueprint with roles, budgets, dependencies'
    ]
  },
  {
    id: 'kernel',
    name: 'Production Tier1 Kernel',
    tier: 'Core',
    responsibility: 'Sole live execution owner with planning, admission, reservation, and coordination',
    concerns: [
      'Single kernel is a critical SPOF',
      'Reservation atomicity needs WAL-level guarantees',
      'No explicit replay/recovery protocol visible'
    ],
    strengths: [
      'Sole execution ownership eliminates ambiguity',
      'Hash-chained ledger provides integrity',
      'Versioned planning port enables evolution'
    ]
  },
  {
    id: 'broker',
    name: 'OpenAlgo Broker Boundary',
    tier: 'External',
    responsibility: 'Sole live broker interface handling execution, observations, and effects',
    concerns: [
      'Single broker dependency creates vendor lock-in',
      'No fallback broker adapter visible',
      'Ambiguous result handling needs explicit taxonomy'
    ],
    strengths: [
      'Single boundary simplifies testing',
      'Validated observations with identity and freshness',
      'Analyzer sandbox for non-live analysis'
    ]
  },
  {
    id: 'ledger',
    name: 'SQLite WAL Ledger',
    tier: 'Persistence',
    responsibility: 'Production hash-chained financial ledger with verified projections',
    concerns: [
      'SQLite single-file limits horizontal scaling',
      'WAL mode still has single-writer constraint',
      'No explicit replication strategy visible'
    ],
    strengths: [
      'WAL enables concurrent reads',
      'Hash-chaining provides tamper evidence',
      'Verified projections ensure consistency'
    ]
  },
  {
    id: 'supervisor',
    name: 'Protection & Reconciliation',
    tier: 'Safety',
    responsibility: 'Independent supervisor providing action proposals only (never direct execution)',
    concerns: [
      'Proposal-only model may delay critical interventions',
      'No explicit escalation path for urgent cases',
      'Reconciliation frequency not specified'
    ],
    strengths: [
      'Independence from execution path',
      'Proposal-only ensures kernel authority',
      'Separate observation validation'
    ]
  },
  {
    id: 'simulation',
    name: 'Disarmed Simulation',
    tier: 'Research',
    responsibility: 'Paper replay and backtest using same code paths but with no live capability',
    concerns: [
      'Disarming guarantee needs formal verification',
      'Clock recording may miss edge cases',
      'Cost model fidelity affects validity'
    ],
    strengths: [
      'Shared code reduces divergence risk',
      'Separate ledger prevents contamination',
      'Frozen policy ensures reproducibility'
    ]
  },
  {
    id: 'research',
    name: 'Research & Promotion',
    tier: 'Evolution',
    responsibility: 'Evidence export, custody, RL experiments, and protected evaluation pipeline',
    concerns: [
      'One-use locked evaluation is fragile',
      'Custody role separation needs audit trail',
      'RL reward signal definition is critical'
    ],
    strengths: [
      'Immutable bundles with content hashes',
      'Global custody with purge/embargo',
      'Protected evaluation prevents gaming'
    ]
  },
  {
    id: 'operations',
    name: 'Operations & Recovery',
    tier: 'Infrastructure',
    responsibility: 'Backup, restore, fence verification, and observability',
    concerns: [
      'Fence proof complexity may have edge cases',
      'Recovery gap reconciliation is non-trivial',
      'No explicit RTO/RPO targets visible'
    ],
    strengths: [
      'WAL-aware backup ensures consistency',
      'Isolated restore prevents contamination',
      'Authority proof before activation'
    ]
  }
];

export const issues: ArchitectureIssue[] = [
  {
    id: 'spo1',
    title: 'Single Kernel Point of Failure',
    severity: 'critical',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Resilience',
    description: 'The production Tier1 kernel is the sole execution owner with no visible hot standby or failover mechanism. If the kernel process crashes or becomes unresponsive, all live trading halts with no automatic recovery.',
    impact: 'Complete trading halt during kernel failure. Recovery depends on manual intervention and the backup/restore path which has non-trivial RTO.',
    recommendation: 'Measure outage frequency, duration, and recovery impact first. Any future redundancy proposal must preserve one execution owner and prove old-host fencing before activation; recovery objectives remain an owner decision.',
    affectedModules: ['kernel', 'ledger', 'operations']
  },
  {
    id: 'spo2',
    title: 'Single Broker Vendor Lock-in',
    severity: 'high',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Extensibility',
    description: 'OpenAlgo is the sole broker boundary with no adapter abstraction visible. This creates complete dependency on OpenAlgo availability, API stability, and business continuity.',
    impact: 'If OpenAlgo service is down, changes API, or goes out of business, the entire execution path is blocked. No fallback execution capability exists.',
    recommendation: 'OpenAlgo is the current live boundary by design. Establish a concrete second-broker requirement and inspect existing ports before proposing a scoped adapter extension.',
    affectedModules: ['broker', 'kernel']
  },
  {
    id: 'db1',
    title: 'SQLite Scalability Ceiling',
    severity: 'high',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Scalability',
    description: 'SQLite WAL, while excellent for single-node deployments, has fundamental limitations: single writer, file-level locking, no built-in replication, and practical size limits for high-throughput financial workloads.',
    impact: 'As transaction volume grows, write contention will become a bottleneck. No path to horizontal scaling or multi-region deployment.',
    recommendation: 'Measure write contention, retained volume, latency, outage frequency, and recovery objectives before selecting a migration. The single-writer limit is real; a current workload bottleneck is not established.',
    affectedModules: ['ledger', 'operations']
  },
  {
    id: 'cog1',
    title: 'Cognition-Decision Feedback Oscillation',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Stability',
    description: 'The bidirectional flow between Tier2 cognition and the decision layer creates potential for oscillation: cognition proposes changes → decision applies → new state triggers new cognition → potentially contradictory proposals.',
    impact: 'Rapid oscillation between proposals could lead to excessive trading activity, missed signals, or resource exhaustion in the cognitive layer.',
    recommendation: 'Measure proposal churn, resource use, and lost work first. Preserve bounded tools and proposal-only behavior; add controls only for demonstrated workload gaps, without arbitrary cooldown or confidence thresholds.',
    affectedModules: ['cognition', 'kernel']
  },
  {
    id: 'tx1',
    title: 'Missing Idempotency Guarantees',
    severity: 'high',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: ['F1', 'F2'],
    category: 'Transaction Safety',
    description: 'While the ledger is hash-chained, the architecture does not explicitly show idempotency keys at transaction boundaries. Network retries, process restarts, or duplicate observations could lead to double-execution.',
    impact: 'Duplicate orders, double-fills, or inconsistent state between kernel and broker. Financial loss potential.',
    recommendation: 'The code audit found existing durable identity machinery. Verify exact identity consistency across boundaries and correct the cited F1/F2 persistence and intent-settlement defects; do not add a duplicate idempotency subsystem or reset dedupe across epochs.',
    affectedModules: ['kernel', 'broker', 'ledger']
  },
  {
    id: 'tx2',
    title: 'Ambiguous Result Taxonomy Incomplete',
    severity: 'high',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: ['F1', 'F2'],
    category: 'Transaction Safety',
    description: 'The "ACK, rejection, not sent, or ambiguous" result taxonomy needs formal specification. Ambiguous results (timeout, partial network failure) are the hardest to handle correctly and require explicit reconciliation protocols.',
    impact: 'Ambiguous results without clear resolution protocol can lead to phantom positions, missed fills, or incorrect P&L calculations.',
    recommendation: 'The code audit found explicit ambiguous outcomes and observation-based resolution. Verify end-to-end settlement and persistence at the cited F1/F2 boundaries; never retry an ambiguous command blindly.',
    affectedModules: ['broker', 'kernel', 'supervisor']
  },
  {
    id: 'sec1',
    title: 'Owner Governance Single Point',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Governance',
    description: 'Authenticated owner governance is the sole source of policy approval and session candidates. If the owner is unavailable, no new policies can be deployed and no emergency interventions can occur.',
    impact: 'System may be unable to respond to market events requiring policy changes. Emergency close or cancel operations may be blocked.',
    recommendation: 'Treat multi-person governance, emergency permissions, and delegation as open owner decisions. Do not infer a quorum, emergency policy, or automatic authority from this dashboard assessment.',
    affectedModules: ['kernel', 'supervisor']
  },
  {
    id: 'sim1',
    title: 'Simulation Disarming Verification Gap',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Safety',
    description: 'The "disarmed" simulation kernel must be guaranteed to never have live execution capability. However, the architecture shows shared code paths, and the disarming mechanism is not formally specified or verified.',
    impact: 'If disarming fails or is bypassed (configuration error, code change), simulation could accidentally execute live trades. Catastrophic financial risk.',
    recommendation: 'Verify credential, process/network, ledger, and lifecycle boundaries for the shared disarmed simulation path. Add isolation only where a concrete boundary gap is demonstrated.',
    affectedModules: ['simulation', 'kernel', 'broker']
  },
  {
    id: 'obs1',
    title: 'Missing Backpressure & Rate Limiting',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Resilience',
    description: 'The market data ingestion path has no visible backpressure mechanism. During high-volatility events, data volume can spike dramatically, potentially overwhelming the pipeline.',
    impact: 'Pipeline saturation leads to stale data, missed signals, or cascading failures. The "quality cutoff" may be triggered too late.',
    recommendation: 'Measure queue growth, stale-data behavior, and processing latency under representative load. Add bounded backpressure or rate controls only where a measured gap exists; keep policy thresholds owner-approved.',
    affectedModules: ['market', 'kernel']
  },
  {
    id: 'rec1',
    title: 'Recovery Fence Complexity',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: ['F9'],
    category: 'Operations',
    description: 'The recovery path requires proving the old host is "incapable" before activating the new one. This distributed consensus problem (preventing split-brain) is notoriously difficult to implement correctly.',
    impact: 'If fence verification fails or has edge cases, both old and new kernels could operate simultaneously, leading to double-trading or state corruption.',
    recommendation: 'Use a well-tested distributed lock service (etcd, ZooKeeper) for fencing. Implement lease-based activation with automatic expiry. Add explicit split-brain detection in the supervisor. Test recovery scenarios regularly.',
    affectedModules: ['operations', 'kernel', 'supervisor']
  },
  {
    id: 'mon1',
    title: 'Observability Architecture Under-specified',
    severity: 'medium',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Operations',
    description: 'The "Operator UI and observability" receives asynchronous telemetry but the metrics, traces, and alerting architecture is not detailed. For a financial system, comprehensive observability is critical.',
    impact: 'Without proper observability, issues may go undetected until they cause financial loss. Debugging production issues becomes extremely difficult.',
    recommendation: 'Implement structured logging with correlation IDs. Add metrics for all pipeline stages (latency, throughput, error rates). Define alerting rules for critical conditions. Implement distributed tracing across all components.',
    affectedModules: ['operations', 'kernel', 'market']
  },
  {
    id: 'api1',
    title: 'No API Versioning Strategy',
    severity: 'low',
    evidenceClass: 'H-dashboard',
    relatedFindingIds: [],
    category: 'Extensibility',
    description: 'The OpenAlgo adapter and internal ports lack explicit versioning strategy. As the system evolves, breaking changes to interfaces could cause coordination failures.',
    impact: 'Difficulty upgrading components independently. Risk of breaking production during deployments.',
    recommendation: 'Implement semantic versioning for all ports and adapters. Use capability negotiation at connection time. Maintain backward compatibility for at least N-1 versions. Add contract testing.',
    affectedModules: ['broker', 'kernel', 'simulation']
  }
];

export const recommendations: Recommendation[] = [
  {
    id: 'rec1',
    title: 'Assess a Second Broker Requirement',
    priority: 'measure-first',
    category: 'Extensibility',
    description: 'OpenAlgo is the current live boundary by design. Establish a concrete second-broker need and inspect the existing ports before proposing additional adapter work.',
    implementationSteps: [
      'Identify a user or operational requirement that needs another broker',
      'Inventory the current broker ports, adapters, and lifecycle contracts',
      'Compare the concrete requirement against existing contracts',
      'If justified, define a scoped adapter contract and isolated contract tests',
      'Keep broker selection and live authority an explicit owner decision'
    ],
    benefits: [
      'Prevents premature abstraction work',
      'Keeps the current live boundary explicit',
      'Provides evidence for a focused extension',
      'Avoids implying unapproved broker failover'
    ],
    tradeoffs: [
      'A concrete requirement must be established first',
      'A second adapter adds contract and operational work',
      'No broker diversification benefit is assumed'
    ]
  },
  {
    id: 'rec2',
    title: 'Verify Existing Transaction Identity & Dedupe',
    priority: 'verify-first',
    category: 'Transaction Safety',
    description: 'The current source audit found durable identity and ambiguous-outcome machinery. Verify identity consistency and settlement at each boundary before considering any additions.',
    implementationSteps: [
      'Trace the existing intent and broker-command identity lifecycle',
      'Verify exact identity behavior for submit, cancel, modify, and restart paths',
      'Exercise ambiguous outcomes and reconciliation without resending',
      'Check that epoch or principal changes do not reset deduplication',
      'Only propose a narrow correction if a reproducible gap remains'
    ],
    benefits: [
      'Preserves proven identity mechanisms',
      'Targets verified gaps rather than a duplicate subsystem',
      'Protects ambiguous external outcomes from blind retries',
      'Produces reproducible boundary evidence'
    ],
    tradeoffs: [
      'Requires exact lifecycle and restart tests',
      'Current source audit identifies open boundary defects to resolve',
      'No new retry semantics are implied'
    ]
  },
  {
    id: 'rec3',
    title: 'Measure Kernel Availability Before HA Design',
    priority: 'measure-first',
    category: 'Resilience',
    description: 'Keep one Tier-1 execution owner. Measure availability needs and recovery objectives before proposing redundancy; any future activation requires proven exclusive fencing of the old host.',
    implementationSteps: [
      'Measure outage frequency, duration, and recovery impact',
      'Have the owner define required recovery objectives',
      'Rehearse restoration on an isolated second host',
      'Prove the old writer is disabled and accepted or pending commands are reconciled',
      'Consider redundancy only after exclusive authority and split-brain controls are demonstrated'
    ],
    benefits: [
      'Bases resilience work on observed need',
      'Avoids unsupported RTO/RPO promises',
      'Preserves single-writer financial authority',
      'Makes any later failover decision evidence-led'
    ],
    tradeoffs: [
      'Availability targets require owner input',
      'Recovery rehearsal needs isolated infrastructure',
      'No active-passive or automatic failover is authorized by this assessment'
    ]
  },
  {
    id: 'rec4',
    title: 'Verify Simulation and Live Boundaries',
    priority: 'verify-first',
    category: 'Safety',
    description: 'The source audit notes shared code and disarmed adapters. Verify credentials, process and network capabilities, ledgers, and lifecycle boundaries before labeling an isolation defect.',
    implementationSteps: [
      'Inventory simulation and live entrypoints and their shared dependencies',
      'Check credential availability and process or network permissions',
      'Verify simulation ledger and lifecycle effects stay disarmed',
      'Add a focused test for any boundary that cannot be demonstrated',
      'Change architecture only when a concrete boundary failure is reproduced'
    ],
    benefits: [
      'Distinguishes existing safeguards from unverified boundaries',
      'Targets isolation tests at actual execution seams',
      'Avoids duplicate infrastructure without evidence',
      'Makes safety claims auditable'
    ],
    tradeoffs: [
      'Requires environment-specific verification',
      'Some boundaries may need deployment-level proof',
      'Shared code alone does not establish unsafe access'
    ]
  },
  {
    id: 'rec5',
    title: 'Measure Observability Coverage',
    priority: 'measure-first',
    category: 'Operations',
    description: 'The dashboard does not establish missing observability. Inventory current asynchronous telemetry, metrics, traces, and alert coverage, then close evidence-backed gaps.',
    implementationSteps: [
      'Inventory existing logs, asynchronous telemetry, metrics, traces, and alerts',
      'Identify unobserved failure modes through incident and recovery exercises',
      'Define operator questions and required signals for those failure modes',
      'Add instrumentation only for demonstrated visibility gaps',
      'Review signal quality and alert burden after isolated validation'
    ],
    benefits: [
      'Makes telemetry work proportional to demonstrated gaps',
      'Preserves existing asynchronous observations',
      'Improves evidence for performance and recovery decisions',
      'Avoids an unscoped observability rebuild'
    ],
    tradeoffs: [
      'Coverage inventory and exercises take time',
      'New instrumentation adds runtime and storage cost',
      'Alert design needs operator validation'
    ]
  },
  {
    id: 'rec6',
    title: 'Benchmark Storage Before Migration',
    priority: 'measure-first',
    category: 'Scalability',
    description: 'SQLite WAL has a single-writer limit, but the current workload bottleneck is not established. Measure contention, data volume, latency, and recovery needs before selecting another store.',
    implementationSteps: [
      'Benchmark current write contention and latency under representative load',
      'Measure retained data volume, outage frequency, and recovery objectives',
      'Define a trigger that current storage cannot meet',
      'Compare candidate stores only if the trigger is observed',
      'If migration is justified, prove parity and integrity before cutover'
    ],
    benefits: [
      'Avoids migration without a demonstrated bottleneck',
      'Provides workload evidence for storage selection',
      'Preserves the existing integrity model during evaluation',
      'Keeps operational complexity proportional to need'
    ],
    tradeoffs: [
      'Representative benchmarks require realistic workloads',
      'Migration remains a substantial project if triggered',
      'No horizontal or multi-region scale benefit is presumed'
    ]
  },
  {
    id: 'rec7',
    title: 'Cognitive Layer Stability Controls',
    priority: 'measure-first',
    category: 'Stability',
    description: 'Keep cognition bounded and proposal-only. Measure proposal churn, resource pressure, and lost work before adding rate limits, deduplication, or workflow durability.',
    implementationSteps: [
      'Measure proposal volume, duplicate rate, resource use, and timeout/loss behavior',
      'Preserve current bounded tools, abstention, and unavailable outcomes',
      'Identify a concrete churn or lost-work threshold from observed workloads',
      'Add the narrowest operational control supported by that evidence',
      'Do not add arbitrary cooldowns or confidence thresholds to money decisions'
    ],
    benefits: [
      'Keeps cognition resource-bounded',
      'Preserves explicit proposal and abstention semantics',
      'Avoids arbitrary policy thresholds',
      'Lets measured workload determine any added controls'
    ],
    tradeoffs: [
      'Measurement needs representative workloads',
      'Additional controls can delay useful work',
      'No fixed cooldown or confidence policy is implied'
    ]
  },
  {
    id: 'rec8',
    title: 'Resolve Governance Requirements with the Owner',
    priority: 'owner-decision',
    category: 'Governance',
    description: 'Multi-person approval, emergency permissions, and timed delegation are open owner decisions. Do not implement or assume a governance policy from the dashboard assessment.',
    implementationSteps: [
      'Record the owner decision on who may authorize policy changes',
      'Resolve gross/net admission, emergency permissions, and policy-change authority explicitly',
      'If multi-person governance is required, define its scope and failure handling with the owner',
      'Specify and test the approved authorization flow before implementation',
      'Keep unresolved choices open and preserve the current authority boundary'
    ],
    benefits: [
      'Makes authority policy explicit and owner-approved',
      'Prevents inferred emergency behavior',
      'Keeps governance changes tied to defined requirements',
      'Retains an auditable decision trail'
    ],
    tradeoffs: [
      'Implementation remains open until requirements are decided',
      'Multi-person approval may add operational latency',
      'No availability or security benefit is assumed before design and proof'
    ]
  }
];

export const architectureLayers = [
  {
    id: 'market-data',
    name: 'Market Data & Canvas',
    color: '#3B82F6',
    components: ['Ingest', 'Validate', 'Normalize', 'Store', 'MarketView', 'Canvas', 'Tools', 'Render'],
    dataFlow: 'Unidirectional: Input → View → Canvas → Tools → Render'
  },
  {
    id: 'cognition',
    name: 'Tier2 Cognition',
    color: '#8B5CF6',
    components: ['Blueprint', 'CognitiveAgentRuntime', 'Memory', 'Workflow', 'Review', 'Apply'],
    dataFlow: 'Bidirectional with Decision: Proposals ↔ Application'
  },
  {
    id: 'kernel',
    name: 'Production Tier1 Kernel',
    color: '#EF4444',
    components: ['Strategy', 'Planning', 'Admission', 'Reservation', 'Coordinator', 'Execution', 'Lifecycle'],
    dataFlow: 'Strict pipeline: Strategy → Plan → Admit → Reserve → Execute → Lifecycle'
  },
  {
    id: 'broker',
    name: 'Broker Boundary',
    color: '#F59E0B',
    components: ['OpenAlgo Adapter', 'Effects', 'Observations', 'Results'],
    dataFlow: 'Request-Response with async observations'
  },
  {
    id: 'persistence',
    name: 'Ledger & State',
    color: '#10B981',
    components: ['SQLite WAL', 'Hash Chain', 'Projections', 'Backup'],
    dataFlow: 'Append-only writes with verified read projections'
  },
  {
    id: 'simulation',
    name: 'Disarmed Simulation',
    color: '#6B7280',
    components: ['Recorded Clock', 'Sim Strategy', 'Sim Planning', 'Sim Broker', 'Sim Ledger'],
    dataFlow: 'Mirrors production but fully isolated and disarmed'
  },
  {
    id: 'research',
    name: 'Research & Promotion',
    color: '#EC4899',
    components: ['Export', 'Bundles', 'Custody', 'Experiments', 'RL', 'Freeze', 'Evaluate'],
    dataFlow: 'Evidence pipeline: Ledger → Bundles → Custody → Experiments → Promotion'
  },
  {
    id: 'operations',
    name: 'Operations & Recovery',
    color: '#14B8A6',
    components: ['Backup', 'Restore', 'Fence', 'Observability', 'UI'],
    dataFlow: 'Async telemetry with manual recovery activation'
  }
];
