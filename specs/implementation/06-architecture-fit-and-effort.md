# Architecture fit, effort and upkeep

* **Status:** proposed guidance (evidence class **D**, recommendation). It mints no decision ID and changes no accepted decision; where it disagrees with the [master README](../../README.md) or [ROADMAP](../../ROADMAP.md), they win.
* **Written:** 2026-10-27, against ATA `claude/spec-implementation-package` at `311571e` (master README §5, §7 and the [delivery plan](plan/delivery-plan.md)).
* **Purpose:** one place to answer "which hybrid architecture fits first", "how much work is it" and "what must I know" before weighing a new pattern, framework or agent design.

## When to read this

Read it before any task that:

* proposes an architecture style, agent pattern (multi-agent, debate, reflection, RL, regime detection) or new infrastructure (Kafka, Redis, a vector database, Kubernetes, a workflow engine);
* estimates development, restructuring or maintenance work;
* compares the target against an outside "AI trading desk" blueprint.

## 1. Which hybrid fits first

**Answer:** a **deterministic kernel with advisory AI**: the safe core of the "institutional multi-pod" pattern, plus human-in-the-loop control. The master already selects it (`README.md:502-510`, target diagram 1 at `:512-566`).

```text
Market data ──► Strategy ──► Intent ──► KERNEL (rules, no AI) ──► OpenAlgo ──► Broker
                   ▲                       │  admission, risk, stop/target,
                   │                       │  kill / hold / loss latch
            AI team (advice only)          ▼
            no broker key           One ledger (SQLite WAL, every event kept)
                                           │
                                    Operator UI, replay, research (separate compositions)
```

| Layer | Pattern | Where in the target |
|---|---|---|
| Overall shape | Modular monolith, boundary-first | One installable Python application (D05) |
| Broker link | Ports and adapters | OpenAlgo adapter; another broker is a new adapter |
| Money decisions | Deterministic gate, never AI | `kernel.*`: admission, protection, safety |
| Memory and audit | Event sourcing | SQLite WAL ledger, one source of truth (D01–D04) |
| Same code everywhere | Clean layers | Live, paper, replay and backtest share code (`README.md:798-804`) |
| AI | Small advisory team | Cognition: review evidence, typed intents, record-only exit advice; no broker credential (D09, D12) |
| Human | Human in the loop | Owner grants, approvals, kill and hold release, exit advice |

### Why it lasts into the AI era

* **AI grows without touching money code.** AI speaks only through typed intents and review evidence (A05-F3); models, agents or debate can change while the kernel stays the same.
* **No lock-in to one model.** Provider records keep the effective model and prompt (A05-F5); exact replay uses recorded answers.
* **Workflow engines later, by choice.** `CognitiveWorkflowPort` is "interface now, adopt later" (`README.md:859`, `:941`); Temporal, Restate or Pydantic AI are adopted only after measured need.
* **Learning stays offline.** Reflection and RL produce frozen candidates; promotion needs protected evaluation and owner governance (A07-F4). No live self-training (`README.md:883`).

### Why not the other blueprints first

| Blueprint | Verdict | Reason |
|---|---|---|
| Autonomous alpha factory (debate, selection, reflection) | Later, offline only (Phase 6) | Useful for research; candidates never promote themselves |
| Adaptive RL engine (actors, sub-millisecond path) | No for live | OpenAlgo is HTTP with one request in flight per account (A03-F1); live self-training is excluded |
| Kafka / Kappa streaming | Deferred | "No current measured need" (`README.md:945`) |
| Redis blackboard | Not needed | The ledger is already the shared, durable state |
| Full taxonomy (every a-1…c-5 block) | Long-term map, not step one | Highest build and upkeep for no added money safety |

### Agent taxonomy against the plan

| Block | Status |
|---|---|
| a-1 sequential, a-4 orchestration | Now: a single specialist is a valid first team (A05-F4) |
| a-5 human collaboration | Now: grants, approvals, exit advice |
| a-3 hierarchical, b-3 debate, b-4 selection | Later: variants that must beat the simple team (`README.md:855`, Phase 5) |
| b-2 aggregation | Now: typed team assembly |
| b-5 gating | Now: the kernel; never an LLM |
| c-1 memory | Planned: partitioned memory; protected evaluation outside retrieval (`README.md:857`) |
| c-2 reflection, c-4 performance | Offline research; proposals only |
| c-3 reward (RL) | Offline (Phase 6); never trains live |
| c-5 regime detection | Research candidate; entry use is a governed policy change |

## 2. Effort: development, restructuring, upkeep

The master rates effort as **low** (narrow adapter or move), **medium** (several callers, parity) or **high** (authority, schema or lifecycle migration). It gives no schedule (`README.md:1162`). Ratings below come from that scale; "my estimate" marks anything else.

### Development (new work)

| Area | Effort | Driver |
|---|---|---|
| Kernel: admission, dispatch, conflicts | High | Every money rule written fresh with proofs |
| Protection: basket, trail, exits | High | Crash and race cases (overclose, sibling failure, kill) |
| Reconciliation and execution domain | High | Timeouts, late fills, analyze versus live |
| Recovery, send lease, backup and restore | High | Routine-restart checks, single sender, clean-host rehearsal |
| Market Canvas | Medium, new | The main new capability; runs in parallel |
| Cognition | Medium | Reused; review application moves to the kernel (D12) |
| Research and RL | Low to medium | Reused, offline |
| Tests | High, spread through every slice | Fresh requirement-based tests (A08), not a port of the legacy suite |

Plan size: 8 phases, 14 slices. SLICE-01, SLICE-02 and SLICE-03 have full slice files (each built once, 2026-10-27); the other slices are deepened when they start, which is itself work.

### Restructuring (legacy OA, about 950 Python files)

Reuse what fits, rewrite what does not (`README.md:1164-1184`):

| Legacy part | Disposition | Effort |
|---|---|---|
| Tier-1 ledger | Reuse and harden | Medium |
| Coordinator, OpenAlgo adapter | Extract and refactor | Medium |
| Authority, release, fence | Wrap and extract | Medium–high |
| **Gateway and JSONL registry** | Ownership moves to the ledger; JSONL becomes a compatibility projection | **High: largest risk and payoff** |
| Planner and payoff | One planning port; pure calculation split from effects | Medium–high |
| Stops and trails | Reuse logic; host it in `kernel.protection` | Medium |
| Strategies (BuyerEdge, EMA) | Keep and wrap | Low–medium |
| Market providers and views | Extract and extend | Medium |
| Replay | Keep; converge selectively | Medium–high |
| Advisor, team, AI management | Reuse; relocate review application | Medium |
| Config and packaging | Replace packaging, keep effective meaning | Medium |
| CLI, MCP, UI | Keep surfaces; migrate reads | Medium |
| Full engine rewrite | Rejected | Very high risk |

**Hidden cost: running two systems.** The legacy owner keeps trading until Phase 7 while the target runs disarmed in shadow (Phases 3–4); results must be compared at the same ledger head.

### Upkeep (maintenance)

| Item | Target plan | Full blueprint |
|---|---|---|
| Moving parts | One application, one host, SQLite, systemd | Plus Kafka, Redis, Postgres, a vector database, an agent graph, maybe Kubernetes |
| Upgrades to track | Python packages, SQLite safe version, OpenAlgo | Those plus every added service |
| Where bugs hide | Few: one sender, one ledger | Many: messaging, retries, duplicates between services |
| Debugging | Replay the ledger | Trace across services |
| AI upkeep | Model changes recorded; old answers replay | Many agents to retune per model change |
| Recovery drills | Backup, restore, single sender | One per stateful service |
| Skills | Python, SQLite, Linux | Plus streaming, caches, distributed systems, MLOps |

**Overall (my estimate):**

| | Target plan | Full blueprint |
|---|---|---|
| Build | High, mostly money-safety work | About 2–3× more |
| Restructure | Medium–high (the gateway hand-over) | Higher: every part split into services |
| Upkeep | Low | High, and growing |

### Where the work concentrates

1. **Proofs, not features.** Each slice ships named proofs (`PRF-…`); crash and race cases are most of the effort.
2. **The gateway hand-over** from the JSONL registry to the ledger.
3. **Cutover (Phase 7):** recovery rehearsal, proof the old writer cannot send, a naturally flat start (ATA-03).
4. **Deepening stub slices** before coding them.
5. **Owner decisions mid-way** (for example Q-017) pause only the dependent work.

### What keeps the work low

* Follow the build order (`SLICE-01 → 02 → 03 → 04 → 05 → 07 → 06`, then 08–09, with 10 and 12 in parallel, then 11, 13, 14).
* Reuse before rewriting; rewrite only where legacy code fights the boundaries.
* Add infrastructure only after a measurement shows the need (A09-F4); every added service is permanent upkeep.
* Keep AI outside the money path, so AI changes need no kernel work.
* One test style: synthetic, requirement-based tests first.

### Gaps worth deciding (suggestions, not gates)

* **No budget figure exists.** Capacity, latency, RPO/RTO and AI economics are unselected until Phase 8 (`README.md:935`, `:1211`). Setting a monthly AI and hosting budget before Phase 5 adds agents is an owner choice.
* **One host is one failure domain** (`README.md:927`); off-host backup and recovery drills are the remedy.
* **AI never extends a deadline:** a decision's view must be fresh (90 s, POL-018); more reasoning cannot stretch it.
* **First release is narrow on purpose:** BuyerEdge on the current account (Q-005).

## 3. Terms

| Term | Meaning |
|---|---|
| Kernel (Tier-1) | The rule engine; the only part allowed to send orders |
| Ledger | The permanent record of every event; the single truth |
| Admission | Checks an action passes before it is accepted |
| Dispatch | Re-checking just before sending, then sending |
| Reconciliation | Matching our records with what the broker reports |
| Protection, basket | Entry, stop and target sent together; the stop trails |
| Kill, hold, loss latch | Kill stops the desk; a hold pauses a strategy; the latch stops entries after the daily loss limit |
| Analyze versus live | OpenAlgo's mode; never gates a send |
| Disarmed, shadow | Running with no ability to trade, only reading and comparing |
| Cutover | The one-time switch to the new owner; the riskiest step |
| Send lease, fence | Proof that only one host can send for an account |
| Refusing setting | A setting with no default; the application will not start without it |
| Parity, replay | Proving the same inputs give the same decisions |
| Compatibility projection | Legacy JSONL kept as a read-only view during migration |
| Slice, stub slice | A buildable piece with its proofs; a stub is not yet detailed |
| Proof (`PRF-…`) | A named test a slice must pass |
| Locked evaluation (OOS) | Protected data used once for a final claim |
| Promotion | Moving a frozen candidate to live, with owner approval |
| Cognition (Tier-2) | The AI side: advice only, no broker credential |
| RPO / RTO | Data you can afford to lose; how fast you must recover. Not chosen yet |
