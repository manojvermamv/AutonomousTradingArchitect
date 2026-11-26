# AutonomousTrading — specification and implementation-plan package

* **Status (2026-11-26 UTC):** three releases after the close, on the owner's word: the host update fix (needrestart
  never restarts `at-*`; Ubuntu's upgrade after the close), then the 15:10 entry cutoff and the `at.slice` limits, then
  an installer fix that lets the bound `envelope.*` values reach the units. The 15:13 square-off is proven by
  simulation. The running release, its build and what is open are written once, in the ROADMAP's
  [current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-26-utc).
* **Status (2026-11-25 UTC, history):** release `20261125T121017Z-31af10d63d50` ran from that evening: messages through OpenAlgo's channels (D-022,
  D-023, off until a channel is named), the owner's taflow indicators behind `autonomous_trading.indicators` (D-024), the
  `at.slice` and kill-switch fixes and an installer fix. The first entry since PRT-R10 and the owner's three drills ran on
  25 November. Every slice and design file opens with a dated status note checked against the code. See the ROADMAP's
  [current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-24-utc).
* **Status (2026-11-23 UTC, history):** an earlier exchange day's protective orders no longer block entries (PRT-R10); D-019
  reads live Upstox funds strings as money; D-020 compresses the backup sets and market day files with zstd; D-021 keeps
  10 trading days in the live market store, every older day a checked file in the bucket; the backup's off-machine
  setting is removed (A1) and an owner restore command exists (A2). The running release is in the ROADMAP's
  [current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-21-utc).
* **Status (2026-11-21 UTC, history):** D-016 (20 Nov) counts an analyze session as a live-broker check. D-017: the nightly
  backup goes to Cloudflare R2 as plain objects (no restic); it is proved on the real bucket and runs nightly. D-018:
  kernel evidence files are 0640. The running release is in the ROADMAP's [current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-21-utc).
* **Status (2026-11-19 UTC, history):** the first analyze-mode day with entries ran on 19 November (five BuyerEdge trades).
  D-011 to D-014 (leftover protective orders cancelled under a hold, stop and target anchored to the fill, entries
  priced from the newest chain, the kernel's own square-off at 15:13) are built and activated. The running release and its
  build are written once, in the ROADMAP's current delivery status (below), not here.
  D-015 removed legacy history import and cutover. See [current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-20-utc).
* **Status (2026-11-18 UTC, history):** the first release is installed on the Ubuntu host in analyze mode; the early close
  (D-007), activation without the market-hours check (D-008), late starts (D-009) and the owner's read access (D-010)
  are built and activated (18 November, 17:29 IST); BuyerEdge holds an entry grant for 19 November. Release `20261118T115832Z-bb7baf172aaa` is active; kernel `OPERATING`. See [delivery status](../../ROADMAP.md#delivery-status--2026-11-18-utc-history-superseded-by-19-november-above).
* **Status (2026-11-17 UTC, history):** shared restore fingerprints, the offline OPS09 verifier, deferred staging bindings, the installer's own lease token, main-disk assessment storage, the OpenAlgo-login account and the owner's worst-case loss are implemented and pushed. The host deployment (SLICE-15 step 7) and genuine session evidence remain open. See [current delivery status](../../ROADMAP.md#delivery-status--2026-11-17-utc-history-superseded-by-18-november-above).
* **Workspace:** former ATA is now `OA_NEW/.workspace/specifications`, a separate repository on `claude/spec-implementation-package`. Historical ATA references do not require another directory.
* **Pinned to:** ATA `main` at `b9bb32c` and legacy AT at `445eb116` ([provenance](00-provenance.md)).

* **Owner storage correction (2026-11-17):** main-disk assessments are allowed; optional volume, ongoing capacity entry gate and local post-close sealed copies replace the separate-filesystem hard blocker. See [decision and verification status](../../ROADMAP.md#assessment-storage-correction--owner-decision-2026-11-17-utc).

## The rule that comes first

**The master wins.** The [master README](../../README.md), then [ROADMAP](../../ROADMAP.md), then this package:

* This package implements and traces accepted decisions. It never redefines them and never mints a decision ID.
* A disagreement with the master is recorded as an X item in [consistency/master-contradictions.md](consistency/master-contradictions.md). It is never a silent edit.
* Before starting a slice, its owner re-checks the package against the current master.

**What the package adds:**

* transition tables with invariants;
* failure-mode tables with numbered crash points;
* typed interfaces and refusal codes;
* concrete slice tasks;
* proofs whose expected outcomes are derived independently.

**What it does not add:** policies, thresholds, accounts, workflows or permissions. Open ones stay open as [owner questions](decisions/owner-questions.md).

## Reading order for SLICE-01 (about one hour)

1. Master [Recommendation and required behavior](../../README.md#recommendation) (`README.md:1-42`).
2. Master [target diagram 1](../../README.md#primary-target-diagram-1--higher-level-architecture) (`README.md:514-572`).
3. Master [financial authority and executable contracts](../../README.md#financial-authority-and-executable-contracts) (`README.md:732-787`).
4. The status legend and glossary below.
5. [Delivery plan](plan/delivery-plan.md), then [SLICE-01](plan/slices/SLICE-01-disarmed-financial-core.md).
6. Only the specs SLICE-01 uses:
   * [ledger and atomic transaction](design/ledger-and-atomic-transaction.md);
   * [dispatch and coordination](design/dispatch-and-coordination.md);
   * the admission checks in [intent to admission](design/intent-to-admission.md#admission-kerneladmissionpy).

## Files

| File | What it is | Status |
|---|---|---|
| [00-provenance.md](00-provenance.md) | Pins, working-tree state, instruction files, evidence limits | verified fact |
| [02-policy-inventory.md](02-policy-inventory.md) | Proposed README §9 policy rows (staging; non-normative) | proposed |
| [05-module-index.md](05-module-index.md) | README §6 modules → the spec that details each, first-release treatment, first slice, §7 reuse row; tree deltas | proposed |
| [06-architecture-fit-and-effort.md](06-architecture-fit-and-effort.md) | Which hybrid architecture fits first; development, restructuring and upkeep effort; terms | proposed (guidance) |
| [legacy-divergence.md](legacy-divergence.md) | Where legacy code disagrees with accepted decisions | proposed (evidence) |
| [traceability.md](traceability.md) | Requirement key → decision → module → spec → task → proof (generated) | proposed |
| [design/](design/) | 13 full-depth specs, 1 cross-cutting invariants file | proposed |
| [plan/delivery-plan.md](plan/delivery-plan.md) | the slices (SLICE-01 to SLICE-18) inside the master phases, plus the task index | built (SLICE-14 replaced by SLICE-15) |
| [plan/slices/SLICE-01-disarmed-financial-core.md](plan/slices/SLICE-01-disarmed-financial-core.md) | First slice, prepared for execution | proposed |
| [tests/test-strategy.md](tests/test-strategy.md) | Proof classes, A08 rules, fault injection, coverage map | proposed |
| [decisions/owner-questions.md](decisions/owner-questions.md) | Owner questions (Q-nnn) with their dependent tasks | answered 2026-10-27 |
| [consistency/master-contradictions.md](consistency/master-contradictions.md) | Proposed master corrections (X-nnn) for the master's owner | answered 2026-10-27 |

**Specs.** Full depth (early slices need these):

* [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md)
* [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) (the only spec that defines the atomic commit)
* [intent-to-admission](design/intent-to-admission.md)
* [dispatch-and-coordination](design/dispatch-and-coordination.md)
* [execution-domain-and-observations](design/execution-domain-and-observations.md)
* [protection-and-safety](design/protection-and-safety.md)
* [market-data-and-canvas](design/market-data-and-canvas.md) (deepened at SLICE-08)
* [strategies-and-cognition](design/strategies-and-cognition.md) (deepened at SLICE-09)
* [security-and-operator](design/security-and-operator.md) (deepened at SLICE-10)
* [configuration-artifacts-release](design/configuration-artifacts-release.md) (deepened at SLICE-11)
* [runtime-isolation-observability-deployment](design/runtime-isolation-observability-deployment.md) (deepened at SLICE-11)
* [research-rl-custody-promotion](design/research-rl-custody-promotion.md) (deepened at SLICE-12)
* [migration-recovery-rollback-continuity](design/migration-recovery-rollback-continuity.md) (deepened at SLICE-13 and SLICE-14)
* [cross-cutting-invariants](design/cross-cutting-invariants.md) (owns no module)

**Specs.** Stubs (deepened when their slice starts):


**Process records** (not on the reading path; they describe how the package was made):

* [process/PROMPT-spec-package.md](process/PROMPT-spec-package.md): the owner-adopted prompt that commissioned this package;
* [01-ambition.md](01-ambition.md);
* [egm/](egm/) brainstorm and review reports;
* [consistency/cross-document-check.md](consistency/cross-document-check.md).

## Status legend (two axes)

| Axis | Values | Source |
|---|---|---|
| Evidence class | **C** source-verified · **O** runtime observation · **H** historical claim · **P** proposed direction · **R** external reference · **D** recommendation · **U** unverified | `README.md:17` |
| Lifecycle state | proposed · accepted design · implemented · tested · production-accepted | `AGENTS.md:72` |
| Proof status (this package) | *specified* · *executable* · *passing* | [test strategy](tests/test-strategy.md#proof-classes-and-status) |

This package labels its own content **proposed**. A master decision it cites is **accepted design**. Since November the slices are implemented and tested in `agentic-desk`, and the first release is installed (analyze mode); none is production-accepted.

## ID glossary

| ID family | Meaning | Owner |
|---|---|---|
| D01–D16, A01-Fn … A10-Fn, Combined-F1–F6, AUD-01–05, ATA-01–09 | Accepted (or dispositioned) master decisions | Master README/ROADMAP |
| D-001 … D-024 | The owner's decisions during the build (from 17 November 2026), not the master's D01–D16 | OA_NEW `docs/decisions.md` |
| F1–F9 | Legacy defects found by the 24 Oct audit (`README.md:195-205`) | Master |
| POL-nnn | Proposed README §9 policy row (staging) | This package |
| REQ-XXX-nnn | Requirement key: a pointer to a decision or POL row; three-letter domain codes (LED, SES, ADM, DSP, DOM, PRT, XC, MKT, STR, RES, SEC, CFG, OPS, MIG) | This package |
| PRF-XXX-nn | Proof | This package |
| SLICE-nn, TASK-Snn-nn | Delivery slice and task | This package |
| CP-xn, F-xn | Crash point and failure mode in a spec | This package |
| LD-nn | Known legacy divergence | This package |
| T-nn | Proposed tree delta | This package |
| Q-nnn | Open owner question | Owner answers |
| X-nnn | Proposed correction for the master | Master's owner decides |
| J1–J7 | Package quality targets ([01-ambition](01-ambition.md)) | This package |

## Terms that mean two things

| Term | Here it means | Not |
|---|---|---|
| ATA | The AutonomousTradingArchitect repository (paths) **or** the ATA-01…09 audit findings (IDs with a number) | — |
| AutonomousTrading | The **target** application | The legacy checkout, which is "AT" or "legacy" (`OA@445eb116`) |
| Tier-1 | The legacy `src/tier1@445eb116` package, or the master's authority tier in diagrams | The target module name (`kernel.*`) |
| Obligation | A financial obligation (reservation or exposure, D16; continuity, Combined-F6) | A proof obligation, which is called a "proof" here |
| Session | A **financial session** (ATA-05): scoped, recorded and validated by the kernel | A process lifetime or a calendar day by itself |
| Owner | The human **Owner** (decisions); "specified in" (the spec that details a module); "owning module" (code) | — |
| Canvas | The new deterministic market scratchpad (`README.md:816`); no legacy code exists | — |
| Hold | One per-strategy condition with a recorded reason (`operator` or `recovery`) | Two separate mechanisms |

## Terms used across the specs

| Term | Meaning |
|---|---|
| Composition | One assembled runtime: production, or one simulation run, each with its own ledger (`README.md:570`, `:812`) |
| Disarmed | A composition with no live adapter, credential or broker socket |
| Principal | The authenticated identity behind an action: a human, or a `kernel:<module>` principal ([sessions spec](design/sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)) |
| Writer thread | The one kernel thread that runs every ledger write ([ledger spec](design/ledger-and-atomic-transaction.md#writer-runtime-and-readers)) |
| Sequence | A ledger event's position in the chain; ordering never relies on wall time alone |
| Index tables | Tables in the ledger database derived from events by `fold`, written in the same transaction |
| Compatibility projection | A derived file outside the database for legacy readers; may lag (none exists before SLICE-13) |
| Send intent / claim | The durable `DISPATCH_CLAIMED` event written before any broker call |
| Revalidation | Re-checking an admitted command's recorded dependencies before its claim ([dispatch spec](design/dispatch-and-coordination.md#revalidation-at-dispatch)) |
| Bundle | The installed release artifact, including its migrations and endpoint contracts |
| Receipt | The release binding's evidence that a bundle was installed and verified ([configuration spec](design/configuration-artifacts-release.md)) |
| Refusing parameter | A policy field with no shipped default; the loader refuses a composition that needs it unbound (REQ-XC-003) |
| Unresolved attempt | An attempt in `CLAIMED` or `AMBIGUOUS` ([ledger](design/ledger-and-atomic-transaction.md#command-and-attempt-state-machine)) |
| Unresolved effect | A command in `IN_FLIGHT` or `UNCERTAIN`, or `WORKING` before its completion is observed ([protection spec](design/protection-and-safety.md#conflict-relation-kernelsafetypy)); used by conflicts, ATA-03 flatness and Q-004 |
| Exposure group | A position together with its resting protective orders: the stop, and under `basket_at_plan` also the target ([protection spec](design/protection-and-safety.md#conflict-relation-kernelsafetypy)) |
| Hypothesis | The Python property-based testing library, used only for the ledger and lifecycle state-machine tests |

## Legacy-to-target name map (proposed; reuse is conditional on the specs)

| Legacy @445eb116 | Target module | Basis |
|---|---|---|
| `src/tier1/envelope.py`, `ledger.py`, `schema.py` | `kernel/ledger/envelope.py`, `store.py`, `schema.py` + `resources/migrations/001_initial.sql` | §7 reuse/harden (`README.md:1176`) |
| `src/tier1/coordinator.py`, `openalgo_adapter.py` | `kernel/coordinator.py`, `adapters/openalgo.py` | §7 extract/refactor (`README.md:1177`) |
| `src/runtime/tier1_authority/*`, `src/tier1/recovery.py` | `kernel/authority.py`, `kernel/recovery.py`, `adapters/unix_channel.py` | §7 wrap/extract (`README.md:1178`) |
| `src/runtime/execution_gateway/*`, `src/core/framework/execution/{registry,reservations,reconcile}.py` | `kernel/admission.py`, `kernel/reservations.py`, `kernel/reconciliation.py` | §7 refactor ownership (`README.md:1179`) |
| `src/core/framework/runtime/orchestrator.py`, `structures/planner.py` | `kernel/planner.py`, `kernel/selection.py` | §7 one planning port (`README.md:1180`) |
| `src/core/framework/protection/trail.py`, `structures.py` | `kernel/protection.py` | §7 (`README.md:1181`) |
| `src/core/framework/execution/sender.py` (kill matrix), `loss_latch.py` | `kernel/safety.py` | POL-002, POL-004 |
| `src/runtime/ai_management/service.py` | `kernel/policy.py` (application) and `cognition/review.py` (evidence) | §7 (`README.md:1185`); D12 |

## Re-pinning

When the master moves, follow these steps:

1. Re-run the read-only checker against the new commit.
2. Diff every cited master section between the old pin and the new one.
3. Mark the specs that cite a changed section **stale** in the cross-document check, and update them before their slice starts.
4. Record the new pin in [00-provenance](00-provenance.md).

## Results against the package targets

Run on 2026-10-26; the numbers and the checker's full text are in [consistency/cross-document-check.md](consistency/cross-document-check.md).

| Target | Result |
|---|---|
| J1 EGM reviews: no unresolved Blocker | pass: stages 5–8 on the six full specs, stage 9 on the plan and SLICE-01, and the final package zoom-out ([egm/](egm/README.md)) |
| J2 traceability | pass: 87 full-depth keys, each with decision, module, task and proof; 56 stub keys pointing at master acceptance rows |
| J3 tree membership | pass: 0 paths outside README §6 and the tree deltas T-01…T-23 |
| J4 links and IDs | pass: 0 broken links, 0 duplicate IDs |
| J5 master citations | pass |
| J6 SLICE-01 stage 9 | pass: round 2 found 0 Blockers |
| J7 scope | pass: only `specs/implementation/` changed |

Passing the checker shows only that the documents agree with each other and with the master. It does not show the design is correct. No proof is *executable* or *passing* yet (26 October). Proofs are now executable and passing in `agentic-desk`; see [ROADMAP current delivery status](../../ROADMAP.md#current-delivery-status--2026-11-20-utc).

**Owner decisions:** every question ([Q-001…Q-016](decisions/owner-questions.md)) and master correction ([X-001…X-007](consistency/master-contradictions.md)) was answered on 2026-10-27; the [answers](decisions/owner-answers-2026-10-27.md) give each config setting and its first-release value, and the specs carry them. Every limit and switch stays a configurable refusing setting. SLICE-01 depends on none of them.
