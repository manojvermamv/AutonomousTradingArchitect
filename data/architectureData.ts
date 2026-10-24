export interface ArchitectureIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
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
  priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
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
    category: 'Resilience',
    description: 'The production Tier1 kernel is the sole execution owner with no visible hot standby or failover mechanism. If the kernel process crashes or becomes unresponsive, all live trading halts with no automatic recovery.',
    impact: 'Complete trading halt during kernel failure. Recovery depends on manual intervention and the backup/restore path which has non-trivial RTO.',
    recommendation: 'Implement active-passive kernel replication with automatic failover. Use a leader election protocol (e.g., etcd/Consul) and ensure the passive kernel maintains state via ledger replay. Define explicit RTO/RPO targets.',
    affectedModules: ['kernel', 'ledger', 'operations']
  },
  {
    id: 'spo2',
    title: 'Single Broker Vendor Lock-in',
    severity: 'high',
    category: 'Extensibility',
    description: 'OpenAlgo is the sole broker boundary with no adapter abstraction visible. This creates complete dependency on OpenAlgo availability, API stability, and business continuity.',
    impact: 'If OpenAlgo service is down, changes API, or goes out of business, the entire execution path is blocked. No fallback execution capability exists.',
    recommendation: 'Introduce a BrokerAdapter port with multiple implementations. Start with OpenAlgo as primary but design the interface to support additional brokers. Implement circuit breaker pattern with degraded-mode operation.',
    affectedModules: ['broker', 'kernel']
  },
  {
    id: 'db1',
    title: 'SQLite Scalability Ceiling',
    severity: 'high',
    category: 'Scalability',
    description: 'SQLite WAL, while excellent for single-node deployments, has fundamental limitations: single writer, file-level locking, no built-in replication, and practical size limits for high-throughput financial workloads.',
    impact: 'As transaction volume grows, write contention will become a bottleneck. No path to horizontal scaling or multi-region deployment.',
    recommendation: 'Consider a migration path to PostgreSQL with logical replication, or implement a sharding strategy. Alternatively, use SQLite for hot state with a write-ahead log shipped to a distributed store (e.g., FoundationDB, CockroachDB) for durability and scaling.',
    affectedModules: ['ledger', 'operations']
  },
  {
    id: 'cog1',
    title: 'Cognition-Decision Feedback Oscillation',
    severity: 'medium',
    category: 'Stability',
    description: 'The bidirectional flow between Tier2 cognition and the decision layer creates potential for oscillation: cognition proposes changes → decision applies → new state triggers new cognition → potentially contradictory proposals.',
    impact: 'Rapid oscillation between proposals could lead to excessive trading activity, missed signals, or resource exhaustion in the cognitive layer.',
    recommendation: 'Implement explicit cooldown periods between cognition cycles. Add a proposal deduplication/stability check. Define maximum proposal rate limits. Consider a "proposal confidence" threshold that must be met before application.',
    affectedModules: ['cognition', 'kernel']
  },
  {
    id: 'tx1',
    title: 'Missing Idempotency Guarantees',
    severity: 'high',
    category: 'Transaction Safety',
    description: 'While the ledger is hash-chained, the architecture does not explicitly show idempotency keys at transaction boundaries. Network retries, process restarts, or duplicate observations could lead to double-execution.',
    impact: 'Duplicate orders, double-fills, or inconsistent state between kernel and broker. Financial loss potential.',
    recommendation: 'Implement idempotency keys at every external boundary (broker calls, observation ingestion). Use the ledger as the idempotency store. Ensure the execution coordinator checks for duplicate intent before adapter invocation.',
    affectedModules: ['kernel', 'broker', 'ledger']
  },
  {
    id: 'tx2',
    title: 'Ambiguous Result Taxonomy Incomplete',
    severity: 'high',
    category: 'Transaction Safety',
    description: 'The "ACK, rejection, not sent, or ambiguous" result taxonomy needs formal specification. Ambiguous results (timeout, partial network failure) are the hardest to handle correctly and require explicit reconciliation protocols.',
    impact: 'Ambiguous results without clear resolution protocol can lead to phantom positions, missed fills, or incorrect P&L calculations.',
    recommendation: 'Define a formal result state machine with explicit transitions. For ambiguous results, implement a mandatory reconciliation query to the broker before proceeding. Add timeout-based escalation to the supervisor.',
    affectedModules: ['broker', 'kernel', 'supervisor']
  },
  {
    id: 'sec1',
    title: 'Owner Governance Single Point',
    severity: 'medium',
    category: 'Governance',
    description: 'Authenticated owner governance is the sole source of policy approval and session candidates. If the owner is unavailable, no new policies can be deployed and no emergency interventions can occur.',
    impact: 'System may be unable to respond to market events requiring policy changes. Emergency close or cancel operations may be blocked.',
    recommendation: 'Implement multi-signature governance with defined quorum. Add pre-approved emergency policies that can be activated by the supervisor under specific conditions. Consider time-locked delegation for owner absence.',
    affectedModules: ['kernel', 'supervisor']
  },
  {
    id: 'sim1',
    title: 'Simulation Disarming Verification Gap',
    severity: 'medium',
    category: 'Safety',
    description: 'The "disarmed" simulation kernel must be guaranteed to never have live execution capability. However, the architecture shows shared code paths, and the disarming mechanism is not formally specified or verified.',
    impact: 'If disarming fails or is bypassed (configuration error, code change), simulation could accidentally execute live trades. Catastrophic financial risk.',
    recommendation: 'Implement formal capability-based security: the simulation kernel should not have access to broker credentials at the OS/process level. Use separate process isolation, credential-free environments, and compile-time guarantees where possible. Add runtime assertions.',
    affectedModules: ['simulation', 'kernel', 'broker']
  },
  {
    id: 'obs1',
    title: 'Missing Backpressure & Rate Limiting',
    severity: 'medium',
    category: 'Resilience',
    description: 'The market data ingestion path has no visible backpressure mechanism. During high-volatility events, data volume can spike dramatically, potentially overwhelming the pipeline.',
    impact: 'Pipeline saturation leads to stale data, missed signals, or cascading failures. The "quality cutoff" may be triggered too late.',
    recommendation: 'Implement explicit backpressure at each pipeline stage. Add rate limiting at ingestion. Use bounded queues with overflow policies. Define maximum processing latency SLOs with automatic degradation.',
    affectedModules: ['market', 'kernel']
  },
  {
    id: 'rec1',
    title: 'Recovery Fence Complexity',
    severity: 'medium',
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
    title: 'Implement Broker Adapter Abstraction',
    priority: 'immediate',
    category: 'Extensibility',
    description: 'Create a formal BrokerAdapter port that abstracts execution, observation, and lifecycle operations. This enables multi-broker support and eliminates single-vendor dependency.',
    implementationSteps: [
      'Define BrokerAdapter interface with execute, observe, reconcile, and lifecycle methods',
      'Create OpenAlgoAdapter as the first implementation',
      'Add adapter registry with health checking and failover logic',
      'Implement circuit breaker pattern per adapter',
      'Add integration test suite that all adapters must pass'
    ],
    benefits: [
      'Eliminates single broker dependency',
      'Enables broker diversification for risk management',
      'Simplifies testing with mock adapters',
      'Future-proofs against broker API changes'
    ],
    tradeoffs: [
      'Abstraction may not capture all broker-specific features',
      'Additional complexity in adapter management',
      'Testing matrix grows with each adapter'
    ]
  },
  {
    id: 'rec2',
    title: 'Add Idempotency Layer',
    priority: 'immediate',
    category: 'Transaction Safety',
    description: 'Implement idempotency keys at every external boundary to prevent duplicate execution from retries, restarts, or network issues.',
    implementationSteps: [
      'Generate UUID idempotency keys at intent creation',
      'Store keys in ledger before external calls',
      'Check idempotency store before every broker call',
      'Implement idempotent observation ingestion',
      'Add reconciliation queries for ambiguous results'
    ],
    benefits: [
      'Prevents duplicate orders and fills',
      'Enables safe retries without side effects',
      'Simplifies error recovery',
      'Provides audit trail for all operations'
    ],
    tradeoffs: [
      'Additional storage for idempotency keys',
      'Slight latency increase for key lookup',
      'Key expiry/cleanup strategy needed'
    ]
  },
  {
    id: 'rec3',
    title: 'Kernel High Availability',
    priority: 'short-term',
    category: 'Resilience',
    description: 'Implement active-passive kernel replication with automatic failover to eliminate the single kernel SPOF.',
    implementationSteps: [
      'Design passive kernel that replays ledger to maintain state',
      'Implement leader election using distributed lock service',
      'Add health checking and automatic failover triggers',
      'Define RTO (< 30s) and RPO (0 for committed transactions) targets',
      'Test failover scenarios regularly with chaos engineering'
    ],
    benefits: [
      'Eliminates single kernel SPOF',
      'Near-zero downtime for kernel failures',
      'Enables rolling upgrades without trading halt',
      'Improves overall system resilience'
    ],
    tradeoffs: [
      'Increased infrastructure complexity',
      'Replication lag must be monitored',
      'Failover testing requires careful coordination'
    ]
  },
  {
    id: 'rec4',
    title: 'Formal Simulation Isolation',
    priority: 'short-term',
    category: 'Safety',
    description: 'Implement capability-based security to formally guarantee simulation cannot access live broker credentials or execution paths.',
    implementationSteps: [
      'Separate simulation into distinct process/container',
      'Remove all broker credentials from simulation environment',
      'Add compile-time capability checks (no broker imports)',
      'Implement runtime assertions for network access restrictions',
      'Add automated verification in CI/CD pipeline'
    ],
    benefits: [
      'Formal guarantee against accidental live execution',
      'Simplifies compliance and audit',
      'Enables safer experimentation',
      'Reduces operational risk'
    ],
    tradeoffs: [
      'More complex build/deployment pipeline',
      'Cannot share some optimizations between prod/sim',
      'Additional testing for isolation guarantees'
    ]
  },
  {
    id: 'rec5',
    title: 'Comprehensive Observability Stack',
    priority: 'short-term',
    category: 'Operations',
    description: 'Implement structured observability with metrics, distributed tracing, and intelligent alerting across all system components.',
    implementationSteps: [
      'Add structured logging with correlation IDs at all boundaries',
      'Implement OpenTelemetry for distributed tracing',
      'Define key metrics: latency percentiles, throughput, error rates per stage',
      'Create alerting rules for critical conditions (stale data, high latency, errors)',
      'Build operator dashboard with real-time system health view'
    ],
    benefits: [
      'Rapid issue detection and diagnosis',
      'Data-driven performance optimization',
      'Improved incident response time',
      'Better capacity planning'
    ],
    tradeoffs: [
      'Additional infrastructure for metrics/traces',
      'Performance overhead from instrumentation',
      'Alert fatigue risk if not tuned carefully'
    ]
  },
  {
    id: 'rec6',
    title: 'Database Migration Path',
    priority: 'medium-term',
    category: 'Scalability',
    description: 'Plan and implement a migration path from SQLite to a more scalable database while maintaining the hash-chained integrity model.',
    implementationSteps: [
      'Evaluate PostgreSQL vs. distributed DB (CockroachDB, FoundationDB)',
      'Implement dual-write phase with consistency verification',
      'Migrate read paths first, then write paths',
      'Add replication for multi-region deployment',
      'Maintain hash-chaining as application-level integrity check'
    ],
    benefits: [
      'Removes write bottleneck',
      'Enables horizontal scaling',
      'Supports multi-region deployment',
      'Better concurrent access patterns'
    ],
    tradeoffs: [
      'Migration complexity and risk',
      'Increased operational overhead',
      'Additional infrastructure costs',
      'Learning curve for new database'
    ]
  },
  {
    id: 'rec7',
    title: 'Cognitive Layer Stability Controls',
    priority: 'medium-term',
    category: 'Stability',
    description: 'Add explicit stability controls to the cognition-decision feedback loop to prevent oscillation and resource exhaustion.',
    implementationSteps: [
      'Implement cooldown periods between cognition cycles',
      'Add proposal deduplication with similarity threshold',
      'Define maximum proposal rate limits per time window',
      'Add proposal confidence scoring with minimum threshold',
      'Implement circuit breaker for cognition layer'
    ],
    benefits: [
      'Prevents oscillation and excessive proposals',
      'Improves signal quality',
      'Protects against resource exhaustion',
      'Enables graceful degradation'
    ],
    tradeoffs: [
      'May slow response to genuine opportunities',
      'Tuning parameters requires experimentation',
      'Additional complexity in cognition runtime'
    ]
  },
  {
    id: 'rec8',
    title: 'Multi-Signature Governance',
    priority: 'medium-term',
    category: 'Governance',
    description: 'Evolve owner governance to support multi-signature approval and emergency protocols for improved availability and security.',
    implementationSteps: [
      'Define governance roles with different permission levels',
      'Implement multi-sig approval for policy changes',
      'Add pre-approved emergency policies with activation conditions',
      'Implement time-locked delegation for owner absence',
      'Add comprehensive audit trail for all governance actions'
    ],
    benefits: [
      'Eliminates single-person dependency',
      'Enables faster emergency response',
      'Improved security through separation of duties',
      'Better compliance and audit capabilities'
    ],
    tradeoffs: [
      'Slower policy changes due to approval process',
      'More complex governance configuration',
      'Risk of governance deadlock in edge cases'
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
