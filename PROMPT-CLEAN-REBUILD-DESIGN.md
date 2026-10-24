# AutonomousTrading — Complete Architecture Research and Clean-Rebuild Design Prompt

Act as a senior software architect, software-reuse specialist, and critical code reviewer. **Use your own engineering judgment.** Inspect my existing **AutonomousTrading** project and the user-attached research materials, investigate strong and recently maintained open-source implementations, and design the final **production-ready target architecture** for a new, cleanly structured AutonomousTrading project that retains and reuses as much proven functionality as practical. This architecture is the blueprint for a later build; do not implement the trading system in the existing project during this assignment.

**This is architecture research, audit, and design only—not approval to rewrite code, mutate live state, change financial policy, or place orders.** The objective is the **fastest safe route to a complete, understandable, maintainable system**, not a costly from-zero reimplementation of capabilities already built.

## 1. Read and classify my supplied sources first

Read **all user-attached files and images** related to AutonomousTrading as raw source material: current/historical architecture diagrams, the detailed Mermaid flow, consolidated external research, prior agent discussions, implementation/evidence notes, proposed repository structures, and the deterministic Market Canvas/Sketchpad image or descriptions. Build a brief source inventory listing what each attachment contributes and its date, provenance, and limitations. If an attachment cannot be accessed, report it rather than pretending to have reviewed it.

Treat these sources as **context and hypotheses—not validated implementation or mandatory design**. Separate:

- **Current-state claims** to verify against production code and effective deployment/runtime evidence;
- **Historical findings/proofs**, valid only for their exact time, revision, and environment;
- **Proposed concepts**, including the Agentic Cognitive Fabric, market scratchpad, target diagrams, and repository trees;
- **External consolidated research**, useful for discovering ideas and comparisons but not proof about my code;
- **Open decisions/unknowns**, especially financial policies and missing broker/research evidence.

Do not quietly merge contradictory documents into invented facts. Resolve what production code proves, label remaining conflicts, and prefer the simplest design that satisfies verified requirements.

## 2. Research practical implementation references

Start with `@AbuZar-Ansarii/Ultron/files/README.md` and its repository, particularly the readable project tree, modular tool/action capabilities, coordination, memory, and operator interface. **Ultron is a desktop-agent reference, not an authoritative trading-engine template.**

Find other relevant GitHub projects for event-driven trading, options and OpenAlgo integration, market-data and deterministic charting, shared live/replay engines, agent teams, research/RL, event persistence, recovery, and modular Python systems. Shortlist repositories with **verified source-code updates in the 30 days preceding the research date**. Record the checked date, commit SHA, actual relevant paths, license, trade-offs, and maintenance evidence. If a category has no suitable recently updated repository, say so explicitly.

Inspect each shortlisted repository's available recursive tree using `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch_or_commit_sha}?recursive=true`, preferably against a resolved SHA; traverse subtrees when the API truncates output. Read relevant implementation files rather than relying on folder names or README claims. Compare practical **reuse versus adoption versus custom building**. Prefer well-supported existing libraries where they genuinely lower cost or risk, but do not add frameworks because they are popular, copy unsafe authority models, or copy code without checking its license.

## 3. Independently audit my current AutonomousTrading implementation

Systematically inspect production code, modules, configuration, database schemas, providers/adapters, service definitions, deployment entrypoints, and broker-changing paths. Maintain an audit coverage record. The project's **master `README.md` may be used only for higher-level module boundaries and its Mermaid diagrams**, not proof. Exclude other in-repository documentation/Markdown, changelogs, and test directories from the code-first audit; treat code comments as unverified assertions. **Explicitly supplied user attachments and external-reference READMEs are exceptions for context/research, but remain non-authoritative.** Do not assume an attached target design describes implemented behavior.

First explain the **verified current system**: real capabilities, module ownership, dependency flow, data/contracts, supported live/replay/paper modes, AI-management behavior, risk/planner rules, execution identity and lifecycle, OpenAlgo effects, reconciliation, evidence/research, operations, and current deployment. Clearly distinguish **implemented**, **partially implemented**, **proposed**, and **not verified**. Include a concise source-grounded current-state Mermaid diagram.

Then identify genuine problems in correctness, money-changing paths, validation, security, concurrent authority, data quality, crash recovery, performance, evidence custody, maintainability, and incomplete behavior. For each confirmed finding include severity, file/line evidence, root cause, impact, and a realistic correction. If code cannot prove a claim, record the verification gap. Do not invent functionality or assume a file is correct because of its name.

**Audit drift and unintended constraints as first-class architectural issues.** The current system was built incrementally and may have drifted from its original goals: code order, module ownership, dependencies, production wiring, authority boundaries, AI/research freedoms, and verification procedures may be misplaced, duplicated, incomplete, or unnecessarily restrictive. Independently reconstruct the project's real objectives from source behavior, supplied historical context, and my stated target direction; distinguish intended design from accidents of earlier implementation. Trace each meaningful guard or prerequisite to the operation it actually protects. Identify requirements incorrectly imposed on unrelated work (for example, waiting for market close, production readiness, external credentials, or a broker proof before performing isolated debugging, model research, or ordinary coding). Separate **necessary production safety controls** from **routine health checks, evidence collection, release gates, and historical workflow conventions**. Recommend simplifying or relocating unjustified constraints without weakening genuine financial safety, research custody, or resource isolation. Do not assume that an existing guard is correct merely because it exists.

**Important rebuild constraint:** Much of this project is already built. Identify which implementations and contracts can be **kept unchanged, extracted, refactored in place, wrapped behind a boundary, reused in a new package, selectively replaced with a proven library, or genuinely rebuilt**. Avoid translating “clean rebuild” into “rewrite everything.” Present evidence, cost/risk, migration effort and expected payoff for major choices.

## 4. Target design context — supplied here because this idea is new to the project

The following are **design goals to research, challenge, refine, and selectively adopt**, not a prescribed architecture, module list, or assertion that the code already supports them. You may improve, merge, replace, or reject individual proposed components when source evidence and engineering trade-offs justify it. Preserve the safety invariants while choosing the simplest effective design.

### A. Financial authority and overall architecture

My desired direction is a **governed, evidence-driven agentic trading platform around a deterministic financial kernel**, not a model that trades by itself:

> Many bounded components may observe, retrieve, analyze, debate, learn, remember, reflect, select, adapt, and propose; only one canonical deterministic Tier-1 risk/admission authority determines financial admissibility, one durable single-writer execution owner controls broker-changing effects, OpenAlgo remains the sole live broker boundary, and all decisions, outcomes, recovery, and learning transitions are explainable from immutable causal evidence.

- **Tier-1** owns the project-specific financial semantics: policy/admission, reconciled account/risk state, reservations, lifecycle, execution identity, protection and uncertain-broker-effect recovery. The target direction includes a **single-writer hash-chained append-only event ledger with verified projections**, transactionally persisted in a **tested, WAL-safe SQLite runtime** where justified. This is sole **internal** financial authority; validated fresh OpenAlgo/broker observations remain external truth. No workflow engine, model registry, backup or telemetry backend can grant financial authority.
- **Tier-2** contains bounded AI cognition, tool use, research, memory, RL experiments, and improvement proposals. It may never independently write canonical financial state, bypass risk, acquire broker-changing credentials, silently alter live policy, or self-promote.
- Maintain one shared deterministic strategy/decision/intent/planning/lifecycle foundation across live, paper, replay and backtest, with clocks, inputs and broker adapters explicitly separated. Simulated modes must be structurally unable to send live broker commands.
- Keep human/owner governance and unresolved money policies explicit. In particular, do not silently choose daily-loss latching or kill/recovery permissions for risk-reducing actions.

Illustrative flow, **not mandatory package or process layout**:

`Validated market data → causal MarketView + deterministic Market Canvas → strategies / bounded cognitive review → typed intent → deterministic planning and canonical risk → Tier-1 admission/reservation → one execution coordinator and durable lifecycle → OpenAlgo → broker → validated reconciliation/protection → immutable evidence → research, RL evaluation, frozen candidates, and governed next-session promotion.`

### B. Agentic Cognitive Fabric (new target concept)

Design a **Tier-2 cognitive coordination and learning fabric** that preserves useful existing AI-management/team contracts where possible:

- Read-only, role-scoped capability/tools access to market views, Canvas functions, outcome evidence, research, retrieval, quantitative analysis and permitted external content; no broker-write/Tier-1 command capability and no general access to protected holdouts.
- Versioned team blueprints with specialist roles, dependencies, required/optional workers, budgets, deadlines, pinned versions and a designated synthesis lead with typed outputs.
- Optional hierarchical orchestration, parallel specialists, debate, aggregation, selection, gating, memory, reflection, performance and regime analysis—**only when they demonstrably add value** over simpler flows.
- Partitioned, causal memory: working memory; versioned outcome memory; research/design/proposal memory; protected locked-OOS evidence outside ordinary retrieval.
- Typed proposals, reviews and advice, including existing entry-review behavior (`ALLOW`, `BLOCK`, `PAUSE`) and record-only exit advice where supported. `ALLOW` never bypasses deterministic admission. Preserve measured behavior for `AI_UNAVAILABLE`, abstention and timeouts rather than silently changing live rules.
- Learning and reflection create experiments or frozen candidates, not live self-modification.
- Distinguish bounded **CognitiveAgentRuntime** from an optional durable **CognitiveWorkflowPort**. Research Temporal, Restate, Pydantic AI and the existing runtime as alternatives, **not required dependencies**. Their use must be measurable, reversible and external to Tier-1 authority.

### C. Deterministic Market Canvas / full Market Sketchpad (new target concept)

Design a reproducible market-intelligence **scratchpad tool for agentic use**, analogous in *purpose* to a coding agent's analytical scratchpad, but **grounded in deterministic, point-in-time market data rather than LLM guesses or chart screenshots**.

Pipeline: `OHLCV/ticks/trades/order book/bid-ask/spot/options-chain/Greeks → validation, ordering, event/arrival time, candle finality, provenance and data quality → deterministic anchors, swing levels, support/resistance zones, trends, ranges, patterns and other defensible geometry → structured market representation → causal MarketView + bounded Canvas tools → strategies and cognitive specialists`.

Allow permitted specialists to inspect an as-of slice, call deterministic sketchpad/overlay operations, compare timeframes, keep attributable annotations and scratchpad history, and link every conclusion to evidence. Separate **computed market facts** from subjective agent interpretation. Use versioned algorithms and inputs, confirmation/availability timestamps, and reproducible outputs; guard against future-bar leakage, repainting, hindsight signals and unavailable fields. Visual charts should render structured data and geometry, not become the source of financial truth. Prefer extending existing `MarketView` and provider contracts rather than adding a competing ingestion path.

### D. Research, reinforcement learning and promotion

Design an expandable **research-side RL capability**, not live self-training authority. Include environment/observation/action/reward interfaces; market and broker-cost simulation; risk/action constraints; training and evaluation; reproducible seeds/artifacts; leakage controls; robustness/regime tests; shadow/paper checks; and managed candidate promotion. Evaluate Gymnasium, Stable-Baselines3 and other warranted libraries rather than reimplementing everything. RL-produced policies remain research candidates until explicitly governed and safely session-bound.

Evidence lifecycle: `licensed source validation → immutable bundles → global evidence custody (development, validation, locked OOS) → point-in-time causal datasets → reproducible experiments and all trial attempts → freeze exact candidate → protected claim-specific locked evaluation → economic/robustness evidence → governed promotion → next-session binding → Tier-1 candidate-identity verification`. Guard against alias/copy leakage, purge/embargo violations, restored consumed evidence, changing model artifacts and conflating simulated with broker-reconciled outcomes.

### E. Reliability, operations and extensibility

Preserve independent protection/reconciliation supervision, conservative uncertain OpenAlgo outcomes, durable idempotency and epochs/fencing, explicit safety-condition precedence, least-privilege access, release convergence, crash-at-every-boundary tests, resource isolation, off-box recovery and clean-host restoration. Asynchronous OpenTelemetry/Logfire/OpenLLMetry may observe, but cannot block or authorize financial decisions.

**Design for low cost now and greater scale later:** assume a modest initial deployment (for example, one well-isolated Linux host and local durable Tier-1 storage) unless evidence justifies more. Keep clean replaceable seams for optional growth—Temporal/Restate, Pydantic AI/provider changes, more agent workers, research compute, MLflow, richer observability, object storage, backup/replication, event buses, remote workers and distributed deployment—but **do not install, implement, or create placeholder packages for all of them today**. Explicitly differentiate **build now**, **interface now / adopt later**, and **defer entirely**. Each optional component needs a real trigger, compatibility/cost evaluation and proof that it cannot become a second financial authority. Scaling Tier-1 or moving it between hosts requires a separately proven exclusive-authority/failover design, not shared-network SQLite WAL.

### F. Development freedom, market-hours isolation, and necessary gates

**Do not turn routine verifications into blanket prerequisites for independent work.** Routine readiness checks, market-close checks, deployment receipts, proof collection, missing external inputs, and unrelated production conditions must not automatically block development, coding, debugging, fixes, testing, research, simulation, analysis, AI experimentation, or other independent work. A check should gate an activity **only when there is a demonstrated correctness, safety, data-custody, resource, or real dependency for that specific activity**. A missing proof is an explicitly recorded gap, not an excuse to stop unrelated progress.

**Permit work during live-market sessions when it is provably isolated.** Design safe development and experimentation paths using separate processes, workspaces, data copies, temporary state, disarmed broker adapters, scoped credentials, quotas and CPU/memory/I/O limits where needed. Market-close verification remains available for session-sensitive release/cutover, reconciliation and other truly dependent operations, but it should not become a global schedule lock on independent activity. Avoid shared mutable production files, protected research evidence, live configuration, and resource contention. If isolation cannot be established, defer **only that risky activity** until a safe condition is met, and record the actual dependency.

**Never weaken live trading safeguards.** Production execution/admission, broker-changing tests, authority cutover, restore/activation, money-policy changes, privileged access, evidence custody and protection/reconciliation must still enforce the safety controls justified by their real effects. Distinguish ordinary development/test verification from mandatory production acceptance. Do not bypass a necessary control to gain speed: provide a safe non-production route instead.

In the final design, explain which existing guards should be **kept**, **scoped to production**, **made advisory/observable**, **replaced by isolation**, or **removed if unjustified**. Give an evidence-based dependency matrix showing which operations can run while the market is open and which genuinely require quiescence or production approval. Do not hard-code a universal market-hours ban or approval requirement into the architecture merely because an earlier implementation used one.

## 5. Design the best new project with fast, safe reuse

Produce a clean, full-featured **target AutonomousTrading architecture and repository** while leveraging verified, reusable code from the existing project. Treat the exercise as a **fresh design and clean packaging/recomposition**, not a mandate for a greenfield rewrite. Optimize for correctness, speed of delivery, manageable boundaries, low operational cost and future extensibility.

Use modularity at **financial authority, data, strategy, cognition, research and operations** boundaries. Avoid duplicate planners, risk definitions, gateways, journals, broker senders, configuration ownership or orchestrators. Do not require microservices or package splits without a concrete need. Prefer a small deployable core with optional adapters and independently supervised critical protection functions; leave room for larger deployment later. Design the development workflow so that **safe isolated work and AI/research evolution can continue regardless of whether a live session, production acceptance proof, or market-close routine is in progress**; keep truly dependent live financial operations gated.

For major existing capabilities, show whether to **reuse, extract, refactor, wrap, replace, or rebuild**, and how to preserve behavior and evidence while transitioning. Explain minimal migration and parity-testing steps, and retain a **no-dual-authority** cutover/recovery invariant.

## 6. Deliver the master README and fully commented repository layout

The sole deliverable is the repository-root **`README.md`**, which is the new project's master README and the final architecture result. Read the existing root README only for the permitted higher-level boundaries and Mermaid diagrams described in Section 3; do not treat its prior conclusions as authoritative or append a second competing report. Replace it with the researched, evidence-grounded master README. Do not create a differently named report or change the repository's current directory structure as part of this architecture-only assignment.

In that master README, include:

1. **Source inventory and evidence precedence:** list reviewed attached files, production evidence, historical context, verified code and external reference research; explicitly state inaccessible items and contradictions.
2. **Current architecture:** concise implemented-system summary, code-grounded current-state Mermaid diagram, module/authority map and inspection coverage.
3. **Audit findings:** prioritized, source-backed issues with severity, file/line, root cause, impact, recommended correction and unknowns.
4. **GitHub reference comparison:** recent SHA/path evidence; useful/unsafe patterns; license, maintenance, operational costs and build-versus-adopt conclusions.
5. **Exactly two primary TARGET Mermaid diagrams:** **(1) higher-level architecture** and **(2) detailed end-to-end architecture**. Show deterministic Canvas, Tier-2 cognition, Tier-1 gates, OpenAlgo, broker observations, protection, shared live/replay, research/RL, custody/promotion, and recovery. Label proposals versus authority and keep contract/data flows semantically accurate. The separate current-state diagram is allowed in addition to these two target diagrams.
6. **One full clean Python repository tree** inspired by Ultron's readable layout, with **one short `#` end-of-line comment on every shown directory and file**. Include core interfaces, config, schemas/migrations, deployment, tests, scripts, documentation, market/Canvas, strategy, cognition, Tier-1, broker adapters, research/RL, evidence and operations. **Do not pad the tree with speculative adapters or dummy modules**; put deferred integration points in a separate future-extension note. Use names consistent with the detailed target diagram, but choose the actual names and boundaries yourself.
7. **Current-to-target mapping and roadmap:** feature inventory, reuse/extract/refactor/adopt/rebuild decisions, incremental implementation order, safest low-cost initial deployment, optional growth triggers, compatibility strategy, trade-offs and acceptance proof.
8. **Constraint and independence audit:** identify architectural drift, duplicated/misplaced responsibilities, accidental over-bounding, and routine checks that unnecessarily stop unrelated development or AI research. Include a concise activity-to-dependency/isolation table distinguishing safe market-hours work from production-sensitive operations that require quiescence, authorization, or release proof.
9. **Unresolved items:** owner money-policy choices, unavailable live/broker evidence, historical research-custody limitations and any architecture decisions requiring measured proof.

Keep the final file **full-featured but clean, direct and easy to navigate**, with concise explanations and tables where useful. Distinguish **verified current implementation**, **user-proposed target ideas**, **external research**, and **your own recommendations**. Challenge my source materials and diagrams if they are incorrect. Cite current code by file/line and external repositories by URL/commit/path. **Use your intelligence; none of my example modules, tools, diagrams, or external references must be adopted exactly.**

**This assignment is read-only architecture work:** Do not change the current source tree, running services, live configuration, broker state, financial records, or owner policies. Do not send broker-changing requests or consume protected locked-OOS data. The only file to write is the repository-root `README.md` master architecture deliverable. **This restriction applies to this audit assignment, not to the future development workflow you are designing.** The target architecture must allow independently safe work to proceed without unrelated production gates while retaining all justified live-trading protections.
