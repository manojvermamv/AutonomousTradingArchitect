# Roadmap

This document tracks the audit and architecture path toward a later production-ready AutonomousTrading build. It is directional: dates describe evidence windows and review snapshots, not delivery promises. A roadmap status follows the default branch of this repository; a source-code audit always names the separate source repository, branch, and revision it actually inspected.

**Scope and change control:** audits here optimize the module boundaries and architecture of the future AutonomousTrading project, using current and historical source audits as evidence; `AutonomousTradingArchitect` is the documentation workspace, not the implementation target. Prefer an available local source directory and/or GitHub repository for code claims. If neither is available in context, the published [target architecture review](https://manojvermamv.github.io/AutonomousTradingArchitect/) may clarify diagrams and ongoing design documents, but it is not implementation evidence. For audit-only work, report findings first and make no file edits until the user confirms the recommendations; a confirmed batch may be applied together when document edits are authorized. After confirmation, record accepted target decisions in this roadmap; update the protected master README only when the user's active-turn confirmation explicitly authorizes that edit.

Historical baseline: as of **24 October 2026 (Asia/Kolkata)**, this roadmap lives on `AutonomousTradingArchitect` branch `main`, at baseline revision `cd40cfc07e57899e2aabb643cbc80228dc433322`. For future source audits, use `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn/` as the default target branch, consistent with that repository's `AGENTS.md`, unless the user names another branch. The current code-audit snapshot described by the existing master README inspected `AutonomousTrading` branch `claude/openalgo-trading-architecture-uu1bxn` at revision `445eb116514d97c2574c44d4d5374f938dec57a3` on 24 October 2026 UTC. Those are different repositories and different revisions.

**25 October 2026 UTC update:** the owner accepted all ten target recommendations and explicitly authorized updates to both README.md and ROADMAP.md. Architecture pre-update baseline: `AutonomousTradingArchitect/main` at `a4c6308641d12b1a15898c05ce2bbd022cd46822`. Follow-up source audit: `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn` at unchanged revision `445eb116514d97c2574c44d4d5374f938dec57a3`. Design acceptance is recorded; implementation, tests and production acceptance remain pending. No source fixes or money-policy changes were authorized by this document update.

**25 October 2026 UTC — subsequent target-review decisions:** the owner accepted option A for requirements, option A for review ownership, and option A for the connected transaction contracts, then explicitly authorized both documents. D11–D16 map to audit items 1–6. Architecture review baseline: `AutonomousTradingArchitect/main` at `ecf39ad731ad20b9e541b238225f9ca8d1213537`, including subsequent local requirements-table and working-style edits. This is target design reasoning, not another source audit; the historical source revision above remains unchanged. Status: **proposed → accepted design; implementation, tests and production acceptance pending**. Approved money policies and source files remain unchanged.

The supplied React/TypeScript and HTML files are a 24 October audit presentation bundle. Their assessment is useful for tracing how the dashboard grouped findings; it is not proof that an issue exists in the source code. The current code-first audit and later evidence control finding status. This roadmap does not track presentation-page or UI/UX work.

**Status tracks the audited source branch at the dated revision:** ✅ supported by the current source audit or evidence; 🟡 present in part or still awaiting proof; ⚪ planned or dependent on a measured need/owner decision. Severity and roadmap status are different: a High finding can remain open while unrelated design work proceeds.

**Contents:** [At a glance](#at-a-glance) · [Accepted decisions and delivery order](#accepted-decisions-and-delivery-order) · [Remaining target audit order](#remaining-target-audit-order) · [Milestones](#milestones) · [Open work and evidence](#open-work-and-evidence) · [Audit history](#audit-history) · [Direction changes](#direction-changes) · [How this roadmap evolves](#how-this-roadmap-evolves) · [Working on the roadmap](#working-on-the-roadmap)

**Current design status — 25 October 2026 UTC:** A01–A03 are accepted design with implementation proof pending. A03 includes the source-grounded kernel-failure re-audit and owner-selected corrections; A04 recovery/release lifecycle is next. This update preserves the historical rows below.

## At a glance

| | |
|---|---|
| 🎯 **Target** | A boundary-first architecture with selective reuse around deterministic financial authority, one live execution owner, OpenAlgo as the current live boundary, isolated simulation/replay, bounded cognition, reproducible research, and explainable recovery. |
| 🧭 **Roadmap and audit branches** | This roadmap follows `AutonomousTradingArchitect/main`. Future source audits default to `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn/`; the latest recorded audit is explicitly tied to the feature branch and SHA shown above. |
| 🔎 **Current source audit** | `AutonomousTrading` at `445eb116514d97c2574c44d4d5374f938dec57a3`, branch `claude/openalgo-trading-architecture-uu1bxn`; 24 October baseline and 25 October follow-up UTC. Historical findings remain dated; accepted target changes are integrated in the master README. |
| 📅 **Current evidence window** | Historical audit and design records run from 25 August–4 September, 10–11 October, 20 October, and 24 October 2026. The dashboard files were downloaded on 24 October at 19:12–19:13 IST; that timestamp does not establish the audit's actual creation time. |
| 🧱 **Delivery shape** | Define justified boundaries, select reusable code, prove isolated target slices, and consolidate authority only after parity, recovery and fencing proof. Canvas and research may progress in parallel against stable contracts. |
| 🛡 **Decision boundary** | No roadmap item changes scores, thresholds, entry policy, emergency permissions, or live activation without the required evidence and owner decision. No audit label alone authorizes a broker-changing action. |

## Accepted decisions and delivery order

**Design around the best justified boundaries, then reuse code only where it fits. Preserve approved money policies and useful contracts—not accidental directory layouts, coupling, or implementation limitations. These are recommended improvements; implementation tests and measurements must establish their correctness and practical benefit.**

The [master README](README.md#25-october-follow-up-audit-and-accepted-target-decisions) owns target behavior, evidence and the clean Python layout. This roadmap owns work order and acceptance status. D01–D10 and the later D11–D16 refinements are **accepted as design on 25 October 2026 UTC; implementation and acceptance proof are pending**. [D11–D16 in the master README](README.md#accepted-requirements-and-transaction-refinements--25-october-2026-utc) map to the six later audit items and define their behavior. D01–D10 retain the original discussion IDs and D11–D16 identify the six later choices; the order below groups work by dependencies. Existing F1–F9 audit identities are retained, not replaced or renumbered.

| Delivery order | Accepted decision and target owner | Practical acceptance proof |
|---|---|---|
| 1 — define boundaries | **D07: pure planning and explicit effects** — `kernel.planner`, neutral contracts and application composition | Plan computation performs no state/network writes; both versioned planners retain approved financial outputs, required precedence and identity contracts; incidental source call order is not a requirement (D11). Corrected defects have explicit changed expectations. Activation proof seals retain their security meaning. |
| 2 — define financial outcomes | **D01: truthful outcomes** — `contracts.execution`, coordinator and projections | After broker acceptance, inject projection failure: expose accepted/unresolved status and IDs; no resend. Separately test canonical outcome-write failure and conservative reconciliation. |
| 2 — share lifecycle | **D03: one command lifecycle** — `kernel.lifecycle` | Entry/cancel/modify/close each cover not-sent, rejected, acknowledged, ambiguous and reconciled outcomes across restart; no stale command intent. ACK is not fill or settlement. |
| 3 — establish installable composition | **D05: packaged application and versioned releases** — packaging, settings and operations | Shipping manifest, packaged defaults/schemas/migrations, declared commands and external mutable roots work without checkout/`.git`; failed staging leaves prior release untouched; rollback preserves current financial history. |
| 3 — share configuration | **D06: one worker settings contract** — `settings.schema`, deployment renderer and jobs | Both rendered research profiles accept intentional settings, complete an isolated job and reject forbidden credentials. No blanket market-hours gate. |
| 4 — consolidate financial state | **D02: canonical monetary admission** — `kernel.admission`, reservations and ledger | One transaction binds admission, amount/margin, account/state heads and command identity. Concurrent insufficient-capacity requests cannot both pass; crashes leave no orphan acceptance/reservation; JSONL is a verified projection. |
| 4 — prove integrity | **D04: event-derived state verification** — `kernel.ledger.projections` | Alter epoch/command/broker indexes without changing events: mismatch is detected before financial authority proceeds. Clean reconstruction agrees at the required head. |
| Parallel after contracts | **D08: explicit causal Canvas** — market/view/Canvas | Explicit cutoff, availability and freshness policies; late corrections and future bars cannot change earlier as-known facts. Geometry and interpretation remain distinct. |
| Parallel after contracts | **D09: enforced cognition capabilities** — cognition ports and operations isolation | Native descendants cannot reach financial sockets/keys, mutable production files or protected evidence; permitted egress and resource caps work; job submission does not require mutual implementation imports. |
| Before activation | **D10: recovery proof before cutover** — operations/recovery | Restore the candidate artifact/schema/backup on a clean isolated host; prove crash recovery, identity/custody continuity, refusal before fencing and exclusive activation. Actual cutover still needs fresh reconciliation and external old-writer fencing. |

The six later choices refine the delivery order above; they do not add six serial release gates or replace the original decisions:

| Dependency order | Accepted choice and target owner | Acceptance proof and real dependency |
|---|---|---|
| **First: D11 / audit item 1** | Requirements before source parity. Each domain owns its behavior; composition connects it. Classify approved policy, supported compatibility, architectural choice, historical behavior and unknowns before selecting code. | Every meaningful requirement names its reason, owner and independent expected outcome. Source tests/fixtures are assessed for fit and provenance; changed expectations are explained. No need to repair the source first. |
| **Next: D12 / audit item 2** | Cognition produces review evidence; `kernel.policy` applies approved rules and `kernel.admission` verifies the exact binding. | All entry routes reject bypass and mismatched evidence; recorded live/replay application agrees, including approved timeout/unavailable behavior. Reuse generation code and relocate application logic without duplicating it. |
| **Together: D13 / audit item 3** | Coordinator revalidates relevant dependencies and durably claims dispatch through the sole writer. | Pause/crash between admission and dispatch, change relevant state/deadline/hold/authority, and verify stale admission cannot send. Distinguish demonstrably unsent work from possibly sent attempts; specify hold ordering without inventing new policy. |
| **Together: D14 / audit item 4** | One logical command retains linked attempt identities across caller retries and recovery; adapter/client cannot secretly repeat effective requests. | Recording endpoint plus disconnect/crash injection proves existing-state responses to duplicates and no blind retry after possible transport. Remote deduplication claims require endpoint-specific evidence. |
| **Together: D15 / audit item 5** | Adapter reports coverage evidence; reconciliation owns identity matching and resolution. | Missing pages, delayed fills, inconsistent snapshots and unrelated manual orders cannot resolve an uncertain command merely by omission or similarity. Synthetic checks proceed independently; deployed completeness claims wait for their own evidence. |
| **Together: D16 / audit item 6** | Lifecycle determines transitions, reservations computes approved accounting consequences, and the existing ledger writer commits them with evidence atomically. | Duplicate/reordered fills, partial cancellation and multi-leg outcomes cannot double-count or release unproved capacity. Define capacity measures, corrections and revaluation explicitly; keep command, order and position lifetimes distinct. |

Specify D13–D16 as one connected contract after D11–D12, then prove it in the disarmed vertical slice and canonical-state work. Retain the clean package structure: no new financial journal, sender or service. Lower-level deadlines, valuation changes and emergency permissions are not implicitly approved. Existing D10 recovery/fencing proof remains attached to activation; independent development and research do not wait for broker acceptance or market close.

This order does not require patching `~/AutonomousTrading` before building the target. That source remains read-only under the current instruction. Work on a later implementation needs its own authorized workspace; these files do not create one. Candidate reuse mappings may change when evidence supports a better implementation. A broad rewrite is not assumed, and an existing implementation is not presumed best merely because it exists.

### Independent-review agreements

**25 October 2026 UTC:** independent report reviewed against `AutonomousTradingArchitect/main` at `70e1e539f1dc8a890b12d68525d125df8dd14012`, with the local module-shorthand clarification preserved. Owner accepted corrected options A for AUD-01–AUD-05. [README contracts and disposition](README.md#accepted-independent-review-refinements) own behavior; no new source inspection or implementation proof is implied.

| Finding | Accepted direction | Delivery and acceptance |
|---|---|---|
| **AUD-01** | Explicit entry/cancel/modify/close variants with kernel-side validation of actual effects, targets and actor permissions. | Refine D12/D13 contracts before implementation; test mislabelled protective requests, oversized closes, wrong targets and stale relevant state. Non-entry is not assumed risk-reducing. |
| **AUD-02** | Atomic classified outcome, lifecycle and applicable accounting transition. | Refine D01/D03/D16 together; fault-inject each commit boundary and prove complete transition or preceding recoverable state. No fixed transaction count per command lifetime. |
| **AUD-03** | Label review-binding evidence and record non-dispatch decisions consistently. | Refine D12 and shared-engine proof; compare approved decisions/evidence across modes without demanding identical call graphs or new PAUSE semantics. |
| **AUD-04** | Compare storage-read and observation-polling choices; selection remains open. | Add focused A03/A06 measurements for bounded reads/IPC, independent polling, progress, latency and log growth; no zero-delay or unverified credential guarantees. |
| **AUD-05** | Compare in-place upgrades with verified import; selection remains open. | Add A02/A04 migration proofs preserving original event bytes, identities/provenance and checked derived state; expose historical gaps and choose schema files only after evaluation. |

AUD-01–AUD-03 are accepted design clarifications awaiting implementation proof, not newly proven source defects. AUD-04–AUD-05 accept investigation work, not a database-access topology or migration mechanism. AUD-06 was rejected as stated: retain the historical research date and actual commit history. Existing money permissions, the clean package layout and independent development remain unchanged.

### A01 design acceptance and delivery

**25 October 2026 UTC:** owner accepted the recommended options for A01-F1–F5 following target-only review of `AutonomousTradingArchitect/main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e`. Status: proposed findings → accepted design; implementation/tests/production proof pending. [README A01 decisions](README.md#accepted-a01-time-and-market-data-decisions) own behavior and alternatives. No new source inspection or money-policy choice is implied.

| Decision | Delivery dependency and owner | Acceptance evidence |
|---|---|---|
| **A01-F1** | Define stable view identity and retained input references first; `market.view/store` and shared contracts. | Interleave reads/ingestion/corrections, reopen the same identity and reproduce inputs and geometry; a new view may see newer data. |
| **A01-F2** | Define source identity/coverage and history/live overlap against F1; sources and ingestion. | Duplicates, conflicting revisions, interrupted backfill/retry and missing intervals preserve attributable selection and cannot invent earlier application knowledge. |
| **A01-F3** | Define small consumer requirement/assessment contracts alongside F4; strategies/algorithms, view and quality. | Warm-up, optional/missing/stale inputs, gaps, duplicates and join skew have independent expected assessments scoped to each operation. |
| **A01-F4** | Pin shared calendar/window semantics for F1/F3; market contracts/view. | Boundary, break, shortened-session, partial-window and late-finalization checks distinguish closure, coverage and usability. |
| **A01-F5** | Recompute derived results from resolved F1/F2/F4 inputs; algorithms and Canvas history. | Old views remain reproducible; corrected new facts match independent calculations and any incremental/restart path. |

Implement these within the existing market/Canvas packages and disarmed proof lanes; do not create a second ingestion path or a global readiness gate. Exact thresholds and financial consequences remain governed. A02 subsequently accepted the compatibility/configuration contracts below; preserve A01 decisions as their inputs rather than repeating them by default.

### A02 design acceptance and delivery

**25 October 2026 UTC:** owner accepted A02-F1–F5 with precise internal-version, per-process resolver, immutable-settings, exact-bundle and migration-accounting formulations. Target review baseline: `AutonomousTradingArchitect/main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local accepted A01 edits. Status: accepted design, implementation and production proof pending. [README A02 decisions](README.md#accepted-a02-compatibility-and-configuration-decisions) own behavior; no trading-source audit or financial-policy change is implied.

| Decision | Implementation owner and dependency | Acceptance proof |
|---|---|---|
| **A02-F1** | Domain contracts and authenticated boundaries validate exact internal versions; compatibility adapters support only named persisted-history, frozen-bundle and external operator/MCP interfaces. | Mixed same-release processes, unknown variants and supported conversions yield explicit correct interpretation or scoped incompatibility. Cognition receives no financial socket capability. |
| **A02-F2** | `settings.loader/schema` first defines shared deterministic defaults → profile → scoped env resolution and canonical shared projections. | Reject simultaneous old/new aliases; verify null/omission, unknown keys, changed defaults, scoped digest agreement and redaction. Whole-process settings need not match. |
| **A02-F3** | Bootstrap/operations activates immutable per-process revisions at restart/session boundaries using F2. | File changes cannot alter active settings; partial activation/restart exposes applicable revisions. Runtime safety controls, orders and reconciliation remain state operations; research stages candidates and Tier-1 verifies session binding. |
| **A02-F4** | Operations validates an exact tested artifact/resource/dependency/schema bundle using F1–F3; ledger schema owner checks database capability. | Missing/substituted artifacts or unsupported current schema/event formats prevent dependent activation/rollback. Event-sequence growth alone does not invalidate rollback, and history is never rewound. |
| **A02-F5** | Ledger migration/recovery and compatibility code define pinned source boundaries and record accounting before A04 selects upgrade/import. | Every captured record has an attributable disposition; original evidence remains intact, derived state reconciles and unknown authoritative records block dependent financial activation. Quarantine alone is not successful migration. |

Apply these within D05/D06 packaging/settings and D10/AUD-05 recovery work. A02 design scope is complete; no schema/import route or new migration file is selected. A03 is now design accepted, and A04 next retains capture/resume/cutover and migration-route proof. All isolated work remains independent of unrelated production readiness.

### Accepted runtime and outage contracts — A03

**25 October 2026 UTC — design accepted, implementation proof pending.** The [master runtime contracts](README.md#runtime-progress-and-kernel-failure-behavior) own behavior and module boundaries. Review baseline was architecture `main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02 edits. Read-only re-audit inspected trading branch `claude/openalgo-trading-architecture-uu1bxn` at `445eb116514d97c2574c44d4d5374f938dec57a3` and OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. No broker calls, live fault tests or production-readiness claim. Source mechanisms are optional reuse, not inherited architecture.

| Decision | Delivery responsibility | Acceptance evidence still required |
|---|---|---|
| **A03-F1** | Coordinator separates bounded I/O from serialized state processing; one outbound request per account initially. | Slow HTTP versus whole-kernel failure, requested/applied holds, late results and uncertain conflicting dispatch; no hidden retries. |
| **A03-F2** | Canonical ledger owns admitted durable work; memory triggers are reconstructible; each producer owns overload handling. | Queue saturation/restart, lost acceptance replies and identity lookup, explicit unaccepted BUSY, memory bounds and ingestion coverage gaps. |
| **A03-F3** | Jobs own detached leases; cognition owns deadline/cancellation containment; financial cancel remains an authorized action. | Disconnect and late-result matrix; no expired intent revival, orphan descendants or premature resource release. |
| **A03-F4** | Supervisor uses bounded independent committed-ledger reads, enforced read-only OpenAlgo observations and non-authoritative outage evidence. Ordinary reads remain scoped IPC/API. | Last commit newer than export, consistent head/projections, query/checkpoint/WAL budgets, wrong domain/partial observations, denied observer writes and deduplicated recovery ingestion. A06 verifies native permissions or the restricted observation boundary. |
| **A03-F5** | Supervisor measures demand-aware progress/protection status; recovery retains one financial owner. | Idle versus stalled demand, broker-held versus local/uncertain protection, resource exhaustion, old-process termination and uncertain attempts. A04 selects restart eligibility/fencing/activation details; host failure is a separate recovery case. |

**Direction correction:** snapshot-only preference was superseded by independently verified committed reads with explicitly limited snapshot fallback. Independent assessments do not settle financial state; stale or missing evidence remains visible. Controlled recovery of the same kernel is accepted in principle, not automatic restart permission. Keep A03 IDs stable, existing packages coherent, approved money policies unchanged and independent development ungated.

## Remaining target audit order

**25 October 2026 UTC:** the owner requested a corrected remaining audit plan and additional production-boundary questions. The previous broad requirements/ownership and financial-transaction audits are complete as documented design work (D11–D16); their implementation and production proof remain pending. They are removed from this queue, not marked production-ready. A01 has completed its reviewed design scope through accepted A01-F1–F5; its implementation proof remains open. A02 likewise has accepted A02-F1–F5 with implementation proof pending; A03-F1–F5 are likewise design accepted; A04–A10 remain audit work, not new D-decisions. The [master README audit table](README.md#remaining-deep-audit-directions) owns their scope and corrected questions.

| Order | Audit and current status | Expected result and proof to design |
|---|---|---|
| **1 · A01** | **Design accepted: time, data and market intelligence; proof pending** | Define clock/session/data-quality ownership and causal view contracts. Trace mid-session start, insufficient warm-up, partial bars, gaps, late arrivals and corrections; prove that later data cannot change an earlier as-known decision. |
| **2 · A02** | **Design accepted: contract evolution, configuration and artifact compatibility; proof pending** | Map schema/configuration owners and supported version transitions. Define producer/consumer mismatch, changed defaults, migration and artifact-binding checks without recreating D05–D06. A02-F1–F5 accepted exact internal contracts, scoped settings identity, process-lifetime immutability, exact bundles and complete migration accounting; AUD-05 route selection continues in A04. |
| **3 · A03** | **Design accepted: runtime scheduling, backpressure and failure containment; proof pending** | Define queue and cancellation ownership, bounded work, slow-I/O handling and progress observations. Specify overload/starvation tests and measure service progress; do not invent unapproved action priorities. AUD-04 now specifies independent committed reads and read-only observation capability; prove polling ownership, checkpoint progress and log growth. |
| **4 · A04** | Next: recovery and release lifecycle | Complete startup/catch-up/restart/migration/restore/rollback states using A01–A03 contracts and existing authority rules. Specify interrupted upgrade, incompatible artifact and mid-session recovery scenarios; D10 still requires recovery proof before activation. AUD-05 proves the selected migration route without manufacturing missing historical evidence. |
| **5 · A05** | Planned: strategy and cognitive extensibility | Define minimal plugin/worker/team contracts, version identity and cancellation behavior. Demonstrate representative deterministic and model-driven flows, missing optional workers and provider failures without importing historical worker assumptions or duplicating review policy. |
| **6 · A06** | Planned: security boundaries and operator control — new focus | Map principals, capabilities, privileged entry points and evidence attribution. Define unauthorized access, expired/revoked credentials, confused-deputy and operator-action checks. AUD-04/A03-F4 require enforced read-only observation capability and independently scoped polling; verify the concrete mechanism. Emergency money permissions remain owner decisions. |
| **7 · A07** | Planned: research and governed improvement | Define data/experiment/evaluation/custody ownership and the exact candidate handoff. Specify leakage, trial omission, artifact substitution, overlapping evidence and resumed-experiment checks; no protected holdout consumption is needed to design them. |
| **8 · A08** | Throughout every audit; later consolidate verification architecture | Assemble requirement-to-proof coverage, independent oracles, controllable clocks/adapters, fault injection and evidence classes. Distinguish engineering correctness, broker compatibility and economic claims; source tests remain optional reuse. |
| **9 · A09** | Planned: deployment simplicity and measured optimization | Choose the smallest justified process/storage topology and identify measurements for latency, resource interference, recovery and operating cost. Optional infrastructure needs a measured trigger, not a placeholder package. |
| **10 · A10** | Final integration review after the preceding relevant decisions | Walk one complete production/simulation/recovery/research handoff through contracts, diagrams, tree and roadmap. Resolve duplicate ownership, dependency cycles and incompatible versions; distinguish the minimum complete production slice from deferred features. |

**Order follows dependencies, not a global work gate.** Proceed to A04 using accepted A01-F1–F5, A02-F1–F5 and A03-F1–F5; define controlled restart eligibility, exclusive recovery and protection continuity. A06 capability analysis should accompany earlier boundary work rather than wait for its consolidated review. A08 contributes failure scenarios and acceptance questions from the start. A10 consolidates reviewed outcomes and reopens only specific evidence-backed conflicts. This audit order is distinct from the implementation phases and does not require finishing all research or optional cognition before useful isolated implementation.

For each audit, report target gaps, recommended behavior, alternatives/trade-offs, affected owners and acceptance evidence. Use the agreed Requirement/Owner/Proof block and recommended choices when an owner decision is needed. Only accepted recommendations become new design decisions; reconcile affected prose, diagrams, clean layout, reuse mapping and acceptance criteria when authorized. Unavailable broker or production evidence limits the associated claim, not independent analysis or development.

## Milestones

### ✅ Establish a dated, evidence-grounded audit baseline

The 24 October code-first report identifies what the inspected source proves and records the scope limits. It remains the historical baseline, supplemented by the 25 October follow-up; neither is proof of deployment, broker behavior, or production acceptance. Keep the full source branch and SHA beside each future snapshot so a later audit can show what changed.

The attached dashboard reports 12 issues across eight modules and proposes eight recommendations. These remain dashboard assessments. The code-first report narrows or qualifies several of them; the mapping below preserves that distinction instead of carrying dashboard severities forward as source facts.

### 🟡 Implement accepted reliability contracts in isolated target slices

Use F1–F5 as evidence for D01–D06, not as instructions to copy the source implementation or patch the read-only source first. With D11–D12 ownership established, implement D13–D16 together with the existing reliability work. Establish explicit caller-visible outcomes when an external order is accepted but local persistence fails (F1), then settle cancel/modify intents for every submitted, rejected, ambiguous, or never-reached result (F2). Verify authority indexes against event-derived state (F3), establish installable resources/entrypoints and versioned deployment as well as package completeness (F4/D05), and share one typed environment contract across both research profiles and their renderer (F5/D06).

Handle the lower-severity findings with bounded scope: share the authentication builder for informational mode status (F6); verify legacy replay provenance (F7); remove or correct the dormant duplicate-checkpoint API hazard before adoption (F8). Keep cross-host fencing (F9) explicit as an operational activation requirement; a local epoch does not fence an old host.

Do not add a new idempotency system or retry protocol based only on the dashboard wording. The inspected source already has durable identity and ambiguous-outcome machinery; reuse it where it satisfies D13–D16, prove attempt identity and transport behavior, and refactor where those target contracts require it. Never reset deduplication because a principal or epoch changed.

### 🟡 Preserve behavior while producing an installable target

Define target ownership and pure/effect boundaries first, then inventory current contracts, schemas, entrypoints and evidence to decide what fits. Reuse existing Tier-1 ledger, planner, gateway, replay, cognition, research, and operational code where target requirements and named compatibility proofs support it; source parity alone is insufficient. Keep compatibility readers during migration. Build a disarmed vertical slice and compare exact plans, refusals, reservations, lifecycle transitions, identities, and evidence before moving any financial authority.

The master README phases now implement the accepted sequence: establish D11 requirements and D12 review ownership; specify D13–D16 together and establish outcome/lifecycle/integrity contracts; build the installable target; prove a disarmed vertical slice; consolidate canonical monetary admission; develop Canvas/cognition and research in parallel where independent; prove crash recovery and clean-host restoration before exclusive cutover; then tune recovery objectives, economics and growth. The phases are directional, not a blanket dependency gate for independent work.

### ⚪ Build the deterministic Market Canvas on the existing market seam

The supplied module assessment describes a Canvas as if versioned geometry and bounded tools already exist. Treat that as a target proposal until source evidence proves otherwise. Adopt D08 explicit cutoff/availability/freshness policy for new APIs, using existing provider and MarketView implementations only where they satisfy it; implement accepted A01-F1–F5 stable views, history/live handoff, consumer quality/window semantics and correction reconstruction; version facts, algorithms, inputs, and availability; distinguish computed facts from agent interpretation; and test that later bars cannot alter earlier as-of views. Keep chart rendering downstream of structured evidence.

### ⚪ Extend bounded cognition and research only where measured value supports it

Retain approved typed review, abstention, unavailable, timeout, and human-application behavior. D12 places deterministic entry-review application in the kernel; cognition supplies bound evidence and record-only exit advice. Keep cognition proposal-only and without broker credentials. D09 adds OS-enforced filesystem/socket/egress/resource boundaries and a narrow job submission port; stripped environments alone are not proof of isolation. Add rate limits, deduplication, or workflow durability only when measured proposal churn or lost work demonstrates the need; do not add arbitrary cooldowns or confidence thresholds to money decisions.

Preserve research custody and RL as non-authoritative. Candidate artifacts remain frozen and governed. Any locked evaluation, promotion, or activation follows its own custody and owner-approval rules; it does not become a prerequisite for unrelated development.

### ⚪ Scale or add providers only after an evidenced trigger

Start with the measured single-host SQLite WAL design and OpenAlgo boundary. Benchmark actual write contention, retained data volume, latency, outage frequency, and recovery objectives before selecting PostgreSQL, replication, another broker, or a distributed workflow service. A second broker is an extension decision, not an automatic response to “vendor lock-in.” Distributed or active-passive Tier-1 requires a proven exclusive-authority and split-brain prevention design, not a shared SQLite file or an unmeasured leader-election service.

## Open work and evidence

The order below reflects the current audit's risk and dependencies. It is not a serial release gate. Isolated implementation, debugging, architecture review, and synthetic testing can proceed while a separate production proof is pending.

| Priority | Work or observation | Evidence needed to close it |
|---|---|---|
| 1 | **F1 — broker acceptance versus local persistence** | Deterministic fault injection at the persistence boundary; prove the returned result preserves broker acceptance, sent state, canonical identity, and unresolved projection state without inviting a resend. |
| 2 | **F2 — command-intent settlement** | Exact identity tests for cancel, modify, close, reject, ambiguous, and never-reached paths; prove restart/reconciliation leaves no stale reservation or unsafe retry. |
| 3 | **F4 / D05 — installable application and deployment portability** | Explicit shipping manifest, resources and executable entrypoints without checkout/`.git`; versioned artifact/environment staging and failure-safe handoff; preserve current history on software rollback. |
| 4 | **F5 / D06 — shared worker configuration contract** | Render both offline and advisor service environments from the shared schema; intentional paths pass, forbidden credentials refuse, and one job per profile completes in isolation. |
| 5 | **F3 — derived authority state integrity** | Rebuild/compare mutable indexes and epochs against event-derived truth after startup, recovery, and external modification; preserve existing release-binding and projection checks. |
| 6 | **F9 / D10 — recovery before cutover** | Before production activation, rehearse the candidate artifact/schema/backup restoration on a clean separate host; prove the old writer cannot act, reconcile accepted/pending/unknown commands, preserve identities, and activate only one writer. |
| 7 | **F6–F8 — bounded compatibility and dormant API cleanup** | Auth contract tests; exact legacy replay shape/provenance checks; production-caller search and checkpoint consistency proof or removal. |
| 8 | **Dashboard claims that are conditional or unverified** | Claim-specific load, runtime, custody, observability, or resilience evidence before changing their status. No implementation is implied by a scorecard number. |
| 9 | **Production and broker acceptance** | Release-specific session evidence, exact broker observations, protection/reconciliation outcomes, resource use, and recovery proof. Analyze-mode evidence does not establish a real-broker lifecycle. |
| 10 | **Owner decisions** | Explicit choices for gross/net admission, emergency permissions, policy changes, and any multi-person governance requirement. Keep unresolved choices open; do not infer defaults from a dashboard recommendation. |

D02/D07 ownership and planning, D08/D09 Canvas/capabilities, and D11–D16 requirements and transaction refinements have their own acceptance rows above; they are target gaps, not newly numbered F-defects. None of these tasks is closed by accepting the design.

### Attachment-to-source-audit disposition

| Dashboard claim | Current disposition |
|---|---|
| Single kernel point of failure; automatic HA required | Single-writer authority is intentional in the current design. HA is not an automatic correction. Measure availability needs and prove exclusive fencing before any failover proposal. |
| No broker abstraction; add multiple brokers | OpenAlgo is the only live boundary by design. Existing ports/adapters and the code audit must be checked before claiming no abstraction. A second broker needs a concrete requirement and separate contract evidence. |
| SQLite cannot scale | The single-writer limit is real; a current workload bottleneck was not established. Measure before selecting a migration. |
| Missing idempotency | Too broad as stated. The inspected coordinator checks prior outcomes and namespaced IDs. Audit identity scope and retry boundaries; do not reset keys across epochs. |
| Ambiguous-result taxonomy missing | The code has explicit ambiguous outcomes and observation-based resolution. Verify end-to-end callers and persistence behavior; do not replace working recovery with blind retries. |
| Single-person owner governance is an architecture defect | Owner availability and emergency policy are unresolved governance choices, not authority to invent multi-signature or automatic emergency behavior. |
| Simulation isolation unverified | Shared code and disarmed adapters exist. Verify credentials, process/network capability, ledgers, and lifecycle boundaries before changing status. |
| Missing backpressure, observability, cognitive stability | Treat as measurement questions until queue growth, stale data, unobserved incidents, or proposal churn are shown. Preserve bounded tools and asynchronous telemetry. |
| API versioning absent | Track compatibility on the concrete public/internal contracts. Do not add generic semantic versioning or N-1 support without consumers and a migration need. |

## Audit history

Dates are preserved as evidence windows. The date of a report, the date of a source revision, and a downloaded file's timestamp are separate facts. Earlier audit counts are historical and are not added to current findings unless an issue remains open with current evidence.

| Date or range | Snapshot | How it affects the current direction |
|---|---|---|
| **19 June–October 2026** | The source project's history records the evolution from a strategy script to the current framework, Tier-1 authority, replay, custody, operations, and North Star architecture. | Context for reuse and why “clean rebuild” means packaging/recomposition, not deleting proven behavior. This roadmap does not restate the full implementation chronology. |
| **25 August–4 September 2026** | The source roadmap records an eight-lens audit with 99 findings and subsequent consolidation into live specifications and registers. | Historical baseline only. Old counts and retired audit documents do not define today's defects; use current source evidence and preserved git history. |
| **10–11 October 2026** | The research attachment summarized C01–C29 and external references; it explicitly did not establish a private code audit or live fault test. | North Star context and hypotheses. Keep its claims separate from later source verification. |
| **20 October 2026** | The source roadmap refers to a production-code audit and corrective work. | Historical evidence for changes made before the current source snapshot; check the exact source revision when asserting a fix is present. |
| **24 October 2026, 19:12–19:13 IST** | Downloaded `ArchitectureOverview.tsx`, `ArchitectureFlow.tsx`, `App.tsx`, `index.html`, `architectureData.ts`, `Scorecard.tsx`, `Recommendations.tsx`, `ModuleDetails.tsx`, and `IssueAnalysis.tsx`. The data defines 8 modules, 12 issues, and 8 recommendations; the scorecard presents a 5.5/10 grade. | Current presentation bundle. Keep its six review areas and findings taxonomy as a claim inventory; its hand-authored flow, numerical grade, severities, and recommendations are not source-code or operational proof. File modification times bound local acquisition only. |
| **24 October 2026 UTC** | Current code-first audit recorded in the master README; target source revision `445eb116514d97c2574c44d4d5374f938dec57a3` on branch `claude/openalgo-trading-architecture-uu1bxn`. It reports F1–F8 and F9 as a known operational boundary, qualifies dashboard claims, and records audit limitations. | Current evidence baseline for this roadmap. It supersedes dashboard statements only where source evidence directly resolves them; unknowns remain unknown. |
| **25 October 2026 UTC** | Follow-up audit at the unchanged source SHA `445eb116514d97c2574c44d4d5374f938dec57a3`, branch `claude/openalgo-trading-architecture-uu1bxn`; architecture baseline `a4c6308641d12b1a15898c05ce2bbd022cd46822` on `main`. Targeted traces and 528-file import scan; no application execution or live evidence. | F1–F5 remain open; monetary admission is still split, packaging includes deployment/resource concerns, F5 affects both research profiles, and pure planning/Canvas/OS isolation remain target work. Owner subsequently accepted D01–D10 for both documents, not implementation or financial policy. |
| **25 October 2026 UTC — subsequent target review** | Requirements, module ownership and financial boundaries reviewed at architecture `main` revision `ecf39ad731ad20b9e541b238225f9ca8d1213537` with subsequent local explanatory edits; no new source audit or runtime execution. | Owner accepted D11–D16, mapping audit items 1–6, and authorized coherent README/ROADMAP changes. No historical F-finding is closed by this acceptance. |
| **25 October 2026 UTC — A03 failure re-audit** | Target `main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02; read-only source `claude/openalgo-trading-architecture-uu1bxn` at `445eb116514d97c2574c44d4d5374f938dec57a3`, OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. Inspected lock/dispatch, ledger reader/backup, supervision, book routing and restart code. | A03-F1–F5 and subsequent failure corrections accepted; no deployed-broker or fault-test proof. Independent committed reads supersede snapshot preference; A04/A06 retain recovery activation and observation capability proof. |
| **Next audit: date TBD** | Re-audit the then-current named source branch and append a dated snapshot with the exact branch and SHA. | Compare every open finding to changed code and runtime evidence. Record status transitions and reasons; retain prior dates and findings. |

## Direction changes

This log records when newer dated evidence changes what the roadmap asks for. Do not backdate a conclusion to the date of an older attachment, and do not delete a prior row when an assessment is later corrected.

| Date | Prior view | Updated view | Evidence and roadmap effect |
|---|---|---|---|
| **24 October 2026** | The attached presentation lists 12 findings, including critical kernel HA, missing idempotency, absent ambiguous-result handling, missing broker abstraction, and an immediate multi-broker recommendation. | The current code-first audit records F1–F8 plus F9 as a known operational boundary. It finds existing coordinator outcome checks and explicit ambiguous outcomes; identifies specific persistence, intent-settlement, index-integrity, packaging, and worker-environment defects; and leaves HA, scale, multi-broker, governance, and observability claims conditional or unresolved. | Treat the dashboard as a dated claim inventory, not an additive defect list. Prioritize the code-cited F1–F5 and evidence-bound F9; measure other claims before changing architecture. Source revision: `445eb116514d97c2574c44d4d5374f938dec57a3`. Exact ordering of same-day artifact generation is not established. |
| **25 October 2026 UTC** | Reuse-first extraction could be read as preserving source boundaries; baseline recovery appeared after cutover. | Owner accepted D01–D10: boundaries first, selective reuse, approved-policy compatibility, explicit defect corrections, canonical monetary admission, installable releases and recovery proof before activation. | README contracts, diagrams, clean layout and phases now reflect the accepted direction; implementation acceptance remains pending. F1–F5 are not closed and no source/live behavior changed. |
| **25 October 2026 UTC — D11–D16** | Source-parity wording could preserve incidental behavior; review application sat in cognition; dispatch, observation and accounting contracts lacked precise shared responsibilities. | Requirements first; kernel-owned review application; revalidated dispatch, durable attempt identity, evidenced reconciliation and atomic obligation accounting. | Owner selected A for items 1 and 2 and A for items 3–6 together. Master contracts, both target diagrams, tree comments, reuse mapping and acceptance checks now agree. Implementation proof and unresolved money-policy choices remain pending. |
| **25 October 2026 UTC — remaining audit agenda** | The older eight-item order included the now-recorded requirements and transaction reviews and did not separate runtime progress, schema evolution or operator security. | Exclude completed design scope, start with A01 time/data, add focused A02/A03/A06/A10 questions, and carry verification throughout. | Owner requested the revised plan. README owns scope/questions; this roadmap owns dependencies and expected evidence. The agenda is planned work, not newly completed audits or production acceptance. |
| **25 October 2026 UTC — independent-review agreements** | Diagram edges left authoritative outcome commits and review evidence/control flow ambiguous; action variants and two later audit questions needed sharper scope. | Accept corrected AUD-01–AUD-03 contracts and AUD-04–AUD-05 investigation tasks; reject AUD-06 as stated. | Owner selected A for all five corrected choices. Design changes remain unimplemented; storage-access and migration mechanisms remain open. README and roadmap updated from `70e1e539f1dc8a890b12d68525d125df8dd14012`; no source audit or money-policy change. |
| **25 October 2026 UTC — A01 acceptance** | Time/data audit was next; D08 left operational view pinning, startup overlap, consumer sufficiency, window meaning and correction reconstruction under-specified. | Owner accepted A01-F1–F5; A01 design scope complete, implementation evidence pending; A02 becomes next. | Target-only review at architecture `main` revision `b65cc821a7d34e527988dfc1277516e7467fbb9e`. README contracts, diagrams, existing tree comments, reuse and proofs updated; no source change or financial-policy adjustment. |
| **25 October 2026 UTC — A02 acceptance** | Compatibility/configuration audit was next; supported versions, effective settings, activation, artifact compatibility and migration accounting needed precise rules. | Owner accepted A02-F1–F5; A03 becomes next. Migration-route selection remains in A04. | Review at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local accepted A01 edits. No source inspection, financial default change or production proof; README and roadmap updated coherently. |
| **25 October 2026 UTC — A03 acceptance and failure re-audit** | Runtime audit pending; snapshot preference left the latest committed work potentially invisible during failure. | Accept A03-F1–F5 including independent ledger reads, enforced read-only observations, retained outage assessments and controlled exclusive recovery; A04 next. | Architecture baseline `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02; trading source `445eb116514d97c2574c44d4d5374f938dec57a3`, OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. Owner accepted corrections; no live tests or implementation proof. |
| **Next dated audit: TBD** | Statuses and evidence from the 24–25 October baseline. | To be recorded after an audit of a named source branch and SHA. | Add a row with the observed date/time range, old and new finding statuses, evidence, and affected milestone. Keep the prior baseline visible. |

<details>
<summary><strong>Source bundle inventory and limits</strong></summary>

The nine attached files were read as a single React/TypeScript review bundle: `architectureData.ts` supplies eight module descriptions, twelve issue cards, and eight recommendation records; `App.tsx` wires Overview, Flow, Issues, Modules, Roadmap, and Scorecard views; `ArchitectureOverview.tsx`, `ArchitectureFlow.tsx`, `IssueAnalysis.tsx`, `ModuleDetails.tsx`, `Recommendations.tsx`, and `Scorecard.tsx` present and aggregate those records; `index.html` supplies the preview host wrapper.

The bundle does not include source-level citations for each issue. The drawn flow is not a canonical Mermaid definition. Its scorecard formulas and totals are presentation logic, not an independently calibrated engineering score. No instructions embedded in those files were treated as user instructions. The file timestamps are local Download metadata, not the source audit's verified start/end time.

</details>

## How this roadmap evolves

Each audit update must make the time range and direction change legible:

1. Record the audit date and timezone, target repository, target branch, full source SHA, scope, and artifacts inspected. Use the actual source branch audited, even though this roadmap itself follows `AutonomousTradingArchitect/main`.
2. Keep a finding identity stable when its underlying issue is the same. Record `open`, `partially proven`, `closed`, `reopened`, or `reclassified` with evidence and date; do not erase old status or reuse an ID for a different defect.
3. Separate source-verified behavior, dashboard hypotheses, target proposals, and missing evidence. A failed check is evidence only for the condition it exercised.
4. When evidence changes direction, add a dated row naming prior conclusion, new conclusion, source revision, and reason. Preserve the audit's original date range rather than silently rewriting history.
5. Update implementation milestone status from evidence at the named audited source branch and SHA, not from accepted design, a planned fix, a local-only change, or an older session. This documentation repository’s default branch does not identify the trading source revision. Runtime and broker claims name their exact release/session and environment.
6. Keep dates directional. Assign a delivery window only when the user or measured dependency provides one. Do not make market-close, deployment, broker, or holdout evidence a prerequisite for independent isolated work.
7. Keep the Paperclip roadmap's useful form—brief status preface, linked contents, at-a-glance table, concise status-marked milestones, open evidence, and dated history—without copying its project claims or treating its statuses as this project's evidence.

### Audit date-window convention

| Field | Meaning |
|---|---|
| **Audit window** | Start and end of actual source review, with timezone. If only a date is known, record date precision; do not invent times. |
| **Artifact date** | When a report or attachment says it was created/revised. Keep separate from source commit time. |
| **Acquired** | When a file was downloaded or supplied locally. File mtime is only a local provenance clue. |
| **Source revision** | Full branch and commit SHA against which implementation claims were checked. |
| **Status effective date** | Date a fix or evidence is verified on the target branch. A merge, deploy, and natural-session proof are distinct transitions. |

## Working on the roadmap

Use this document to choose the next evidence-backed architecture or implementation slice. Link each future correction to an audit finding and its target acceptance proof. Keep source-code changes in the `AutonomousTrading` repository when requested; keep this repository's work to architecture and audit documents. Do not edit the master README or the rebuild prompt unless the active user turn explicitly requests it. An owner-policy question remains an open decision until answered.

The [Paperclip roadmap](https://github.com/paperclipai/paperclip/blob/master/ROADMAP.md) is a formatting and tone reference only. Statuses, milestones, claims, and dates here are specific to this project's audit evidence.
