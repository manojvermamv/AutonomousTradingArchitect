# Roadmap

This document tracks the audit and architecture path toward a later production-ready AutonomousTrading build. It is directional: dates describe evidence windows and review snapshots, not delivery promises. A roadmap status follows the default branch of this repository; a source-code audit always names the separate source repository, branch, and revision it actually inspected.

**Scope and change control:** audits here optimize the module boundaries and architecture of the future AutonomousTrading project, using current and historical source audits as evidence; `AutonomousTradingArchitect` is the documentation workspace, not the implementation target. Prefer an available local source directory and/or GitHub repository for code claims. If neither is available in context, the published [target architecture review](https://manojvermamv.github.io/AutonomousTradingArchitect/) may clarify diagrams and ongoing design documents, but it is not implementation evidence. For audit-only work, report findings first and make no file edits until the user confirms them point by point. After confirmation, record accepted target decisions in this roadmap; update the protected master README only when the user's active-turn confirmation explicitly authorizes that edit.

As of **24 October 2026 (Asia/Kolkata)**, this roadmap lives on `AutonomousTradingArchitect` branch `main`, at baseline revision `cd40cfc07e57899e2aabb643cbc80228dc433322`. For future source audits, use `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn/` as the default target branch, consistent with that repository's `AGENTS.md`, unless the user names another branch. The current code-audit snapshot described by the existing master README inspected `AutonomousTrading` branch `claude/openalgo-trading-architecture-uu1bxn` at revision `445eb116514d97c2574c44d4d5374f938dec57a3` on 24 October 2026 UTC. Those are different repositories and different revisions.

The supplied React/TypeScript and HTML files are a 24 October audit presentation bundle. Their assessment is useful for tracing how the dashboard grouped findings; it is not proof that an issue exists in the source code. The current code-first audit and later evidence control finding status. This roadmap does not track presentation-page or UI/UX work.

**Status tracks the audited source branch at the dated revision:** ✅ supported by the current source audit or evidence; 🟡 present in part or still awaiting proof; ⚪ planned or dependent on a measured need/owner decision. Severity and roadmap status are different: a High finding can remain open while unrelated design work proceeds.

**Contents:** [At a glance](#at-a-glance) · [Milestones](#milestones) · [Open work and evidence](#open-work-and-evidence) · [Audit history](#audit-history) · [Direction changes](#direction-changes) · [How this roadmap evolves](#how-this-roadmap-evolves) · [Working on the roadmap](#working-on-the-roadmap)

## At a glance

| | |
|---|---|
| 🎯 **Target** | A production-oriented, reuse-first architecture around deterministic financial authority, one live execution owner, OpenAlgo as the current live boundary, isolated simulation/replay, bounded cognition, reproducible research, and explainable recovery. |
| 🧭 **Roadmap and audit branches** | This roadmap follows `AutonomousTradingArchitect/main`. Future source audits default to `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn/`; the latest recorded audit is explicitly tied to the feature branch and SHA shown above. |
| 🔎 **Current source audit** | `AutonomousTrading` at `445eb116514d97c2574c44d4d5374f938dec57a3`, branch `claude/openalgo-trading-architecture-uu1bxn`; 24 October 2026 UTC. The audit report remains in the master README and is not edited by this roadmap task. |
| 📅 **Current evidence window** | Historical audit and design records run from 25 August–4 September, 10–11 October, 20 October, and 24 October 2026. The dashboard files were downloaded on 24 October at 19:12–19:13 IST; that timestamp does not establish the audit's actual creation time. |
| 🧱 **Delivery shape** | Correct verified defects, prove behavior in isolation, package retained code, consolidate authority only after parity and fencing proof, then add the new Canvas and research capabilities in measured slices. |
| 🛡 **Decision boundary** | No roadmap item changes scores, thresholds, entry policy, emergency permissions, or live activation without the required evidence and owner decision. No audit label alone authorizes a broker-changing action. |

## Milestones

### ✅ Establish a dated, evidence-grounded audit baseline

The 24 October code-first report identifies what the inspected source proves and records the scope limits. It is the current baseline for this roadmap, not proof of deployment, broker behavior, or production acceptance. Keep the full source branch and SHA beside each future snapshot so a later audit can show what changed.

The attached dashboard reports 12 issues across eight modules and proposes eight recommendations. These remain dashboard assessments. The code-first report narrows or qualifies several of them; the mapping below preserves that distinction instead of carrying dashboard severities forward as source facts.

### 🟡 Correct and prove the verified reliability findings

Address the current code-audit findings by demonstrated impact and dependency. First establish explicit caller-visible outcomes when an external order is accepted but local persistence fails (F1), then settle cancel/modify intents for every submitted, rejected, ambiguous, or never-reached result (F2). Verify authority indexes against event-derived state (F3), fix package discovery and prove the installed artifact outside the checkout (F4), and align the research worker's allowed nonsecret environment with its service template (F5).

Handle the lower-severity findings with bounded scope: share the authentication builder for informational mode status (F6); verify legacy replay provenance (F7); remove or correct the dormant duplicate-checkpoint API hazard before adoption (F8). Keep cross-host fencing (F9) explicit as an operational activation requirement; a local epoch does not fence an old host.

Do not add a new idempotency system or retry protocol based only on the dashboard wording. The inspected source already has durable identity and ambiguous-outcome machinery; preserve it, investigate exact identity consistency, and prove it at each relevant boundary. Never reset deduplication because a principal or epoch changed.

### 🟡 Preserve behavior while producing an installable target

Inventory current contracts, schemas, entrypoints, and acceptance evidence before extraction. Reuse existing Tier-1 ledger, planner, gateway, replay, cognition, research, and operational code where parity supports it. Keep compatibility readers during migration. Build a disarmed vertical slice and compare exact plans, refusals, reservations, lifecycle transitions, identities, and evidence before moving any financial authority.

The current report's implementation sequence is the working outline: preserve and characterize; correct active defects; create an installable package; prove an isolated vertical slice; consolidate financial ownership in a disarmed replacement; add Canvas and cognition; package research/RL; prove exclusive cutover; then measure recovery and growth needs. The phases are directional, not a blanket dependency gate for independent work.

### ⚪ Build the deterministic Market Canvas on the existing market seam

The supplied module assessment describes a Canvas as if versioned geometry and bounded tools already exist. Treat that as a target proposal until source evidence proves otherwise. Extend the existing provider and causal MarketView contracts; version facts, algorithms, inputs, and availability; distinguish computed facts from agent interpretation; and test that later bars cannot alter earlier as-of views. Keep chart rendering downstream of structured evidence.

### ⚪ Extend bounded cognition and research only where measured value supports it

Retain current typed review, abstention, unavailable, timeout, and human-application behavior. Keep cognition proposal-only and without broker credentials. Add rate limits, deduplication, or workflow durability only when measured proposal churn or lost work demonstrates the need; do not add arbitrary cooldowns or confidence thresholds to money decisions.

Preserve research custody and RL as non-authoritative. Candidate artifacts remain frozen and governed. Any locked evaluation, promotion, or activation follows its own custody and owner-approval rules; it does not become a prerequisite for unrelated development.

### ⚪ Scale or add providers only after an evidenced trigger

Start with the measured single-host SQLite WAL design and OpenAlgo boundary. Benchmark actual write contention, retained data volume, latency, outage frequency, and recovery objectives before selecting PostgreSQL, replication, another broker, or a distributed workflow service. A second broker is an extension decision, not an automatic response to “vendor lock-in.” Distributed or active-passive Tier-1 requires a proven exclusive-authority and split-brain prevention design, not a shared SQLite file or an unmeasured leader-election service.

## Open work and evidence

The order below reflects the current audit's risk and dependencies. It is not a serial release gate. Isolated implementation, debugging, architecture review, and synthetic testing can proceed while a separate production proof is pending.

| Priority | Work or observation | Evidence needed to close it |
|---|---|---|
| 1 | **F1 — broker acceptance versus local persistence** | Deterministic fault injection at the persistence boundary; prove the returned result preserves broker acceptance, sent state, canonical identity, and unresolved projection state without inviting a resend. |
| 2 | **F2 — command-intent settlement** | Exact identity tests for cancel, modify, close, reject, ambiguous, and never-reached paths; prove restart/reconciliation leaves no stale reservation or unsafe retry. |
| 3 | **F4 — installed package completeness** | Build the wheel and exercise declared entrypoints from an empty directory; compare imports and required package data with the source checkout. |
| 4 | **F5 — research worker environment contract** | Render the service environment; prove the permitted run-directory setting is accepted and broker/protected credentials remain denied; observe queue claim and completion in an isolated environment. |
| 5 | **F3 — derived authority state integrity** | Rebuild/compare mutable indexes and epochs against event-derived truth after startup, recovery, and external modification; preserve existing release-binding and projection checks. |
| 6 | **F9 — old-host fencing and recovery** | Rehearse restoration on a separate host; prove the old writer cannot act, reconcile accepted/pending/unknown commands, preserve identities, and activate only one writer. |
| 7 | **F6–F8 — bounded compatibility and dormant API cleanup** | Auth contract tests; exact legacy replay shape/provenance checks; production-caller search and checkpoint consistency proof or removal. |
| 8 | **Dashboard claims that are conditional or unverified** | Claim-specific load, runtime, custody, observability, or resilience evidence before changing their status. No implementation is implied by a scorecard number. |
| 9 | **Production and broker acceptance** | Release-specific session evidence, exact broker observations, protection/reconciliation outcomes, resource use, and recovery proof. Analyze-mode evidence does not establish a real-broker lifecycle. |
| 10 | **Owner decisions** | Explicit choices for gross/net admission, emergency permissions, policy changes, and any multi-person governance requirement. Keep unresolved choices open; do not infer defaults from a dashboard recommendation. |

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
| **Next audit: date TBD** | Re-audit the then-current source default branch and append a dated snapshot with the exact branch and SHA. | Compare every open finding to changed code and runtime evidence. Record status transitions and reasons; retain prior dates and findings. |

## Direction changes

This log records when newer dated evidence changes what the roadmap asks for. Do not backdate a conclusion to the date of an older attachment, and do not delete a prior row when an assessment is later corrected.

| Date | Prior view | Updated view | Evidence and roadmap effect |
|---|---|---|---|
| **24 October 2026** | The attached presentation lists 12 findings, including critical kernel HA, missing idempotency, absent ambiguous-result handling, missing broker abstraction, and an immediate multi-broker recommendation. | The current code-first audit records F1–F8 plus F9 as a known operational boundary. It finds existing coordinator outcome checks and explicit ambiguous outcomes; identifies specific persistence, intent-settlement, index-integrity, packaging, and worker-environment defects; and leaves HA, scale, multi-broker, governance, and observability claims conditional or unresolved. | Treat the dashboard as a dated claim inventory, not an additive defect list. Prioritize the code-cited F1–F5 and evidence-bound F9; measure other claims before changing architecture. Source revision: `445eb116514d97c2574c44d4d5374f938dec57a3`. Exact ordering of same-day artifact generation is not established. |
| **Next dated audit: TBD** | Statuses and evidence from the 24 October baseline. | To be recorded after an audit of a named source branch and SHA. | Add a row with the observed date/time range, old and new finding statuses, evidence, and affected milestone. Keep the prior baseline visible. |

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
5. Update milestone status from the audited default-branch head, not from a planned fix, a local-only change, or an older session. Runtime and broker claims name their exact release/session and environment.
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
