# Protection and safety

* **Status:** proposed (package spec), revised after EGM stages 5 and 6 ([review](../egm/protection-and-safety/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item, never an edit here.
* **Specified here (exclusive):** `kernel/protection.py`, `kernel/safety.py`. The latter covers the permission matrix, kill, holds, the daily-loss latch and the conflict relation.
* **Consumes:**
  * stable views, including the feed-gap flag ([market-data-and-canvas](market-data-and-canvas.md));
  * session events ([sessions-authority-lifecycle](sessions-authority-lifecycle.md));
  * reconciled fills, confirmed levels and command states ([execution-domain-and-observations](execution-domain-and-observations.md), [ledger](ledger-and-atomic-transaction.md));
  * `session_pnl` from `kernel.reservations` ([ledger](ledger-and-atomic-transaction.md#reservations-and-session-pl-kernelreservationspy));
  * the plan's protective levels and the tick-rounding function of `kernel.selection` ([intent-to-admission](intent-to-admission.md#planning-port-kernelplannerpy-kernelselectionpy)).
* **Produces:** typed action requests to admission ([intent-to-admission](intent-to-admission.md)).
* **Commits through:** the atomic transaction ([ledger-and-atomic-transaction](ledger-and-atomic-transaction.md)).
* **Master anchors:** ATA-01 (`README.md:452`), ATA-04 (`:454`), safety precedence table (`:766-774`), A03-F5 (`:924`), Protection state row (`:731`), AUD-01 (`:754`), Combined-F6 (`:909`), §7 protection row (`:1148`), separate-worker analysis (`:460`).
* **Policy rows:** POL-002 … POL-015 in the [policy inventory](../02-policy-inventory.md). The **desk** is every account bound to this kernel.

## Overview

`kernel.protection` evaluates approved protection policy inside the kernel process:

* trailing stops;
* structure lifecycle actions;
* time-based exits;
* the session-close exit.

It is a bounded, deterministic function of attributable market views, canonical session events and reconciled obligations. Its output is ordinary typed action requests. Those requests pass the same admission, safety, authorization and dispatch path as any other action.

`kernel.safety` holds the rules that decide whether an action may proceed under kill, daily-loss latch, holds or unresolved effects.

## The problem

In the legacy system all automatic protection runs in the strategy host:

* trail cycles;
* structure supervision that sends through the gateway;
* session-close exits.

That host is exactly the component the target strips of financial authority (LD-13). Trail state lives in process memory, and the planner writes the loss latch (LD-03).

The master accepted these corrections:

* moving bounded protection into the kernel, with recoverable desired, attempted and confirmed states (ATA-01);
* an explicit conflict relation (ATA-04);
* a safety precedence that separates capability integrity from owner-chosen action policy (`README.md:766`).

## Goals

1. Automatic protection keeps working when strategy workers, cognition or the supervisor are down. It stops when the kernel is down or not yet `OPERATING`; broker-held stops remain then (ATA-01, A03-F5).
2. After a crash, the kernel never mistakes a desired ratchet for a stop the broker applied (ATA-01).
3. Every approved protection and safety rule is preserved exactly as recorded, including kill, the latch, the session-close switch, trailing on by default, gap peaks recorded only, tick rounding, and the broker's level after a timed-out modify.
4. Conflicts are an explicit, versioned relation, not an accident of locking (ATA-04).

## Non-goals

* New stop formulas, cadences, emergency permissions or protective priorities (`README.md:452`, `:454`).
* Deciding the hold reading ([Q-001](../decisions/owner-questions.md#q-001)) or protective-vs-entry ordering ([Q-004](../decisions/owner-questions.md#q-004)).
* Automatic flattening for any reason other than an approved session-close rule (POL-002: kill never flattens; Combined-F6, `README.md:909`).
* Supervisor behaviour ([runtime spec](runtime-isolation-observability-deployment.md)).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-PRT-001 | Bounded, deterministic protection evaluation inside the kernel process, independent of strategy and cognition workers and the supervisor | ATA-01 (`README.md:452`); LD-13 | PRF-PRT-06, -09, -10 |
| REQ-PRT-002 | Inputs are attributable, view-identified market inputs, canonical session events and reconciled obligation state under applicable policy | ATA-01 (`README.md:452`) | PRF-PRT-01 |
| REQ-PRT-003 | Desired protection is persisted through the sole writer; attempted and confirmed states are read from the linked command and reconciliation; all are recoverable | ATA-01 (`README.md:452`); Protection state row (`:731`); POL-014 | PRF-PRT-01, -03 |
| REQ-PRT-004 | Triggers come from policy; the approved ladder moves the stop on a confirmed bar close and is hit on a tick; a gap peak is recorded, not applied | ATA-01 (`README.md:452`); POL-012, POL-013; LD-05 | PRF-PRT-02, -08 |
| REQ-PRT-005 | Protective actions are typed requests through normal admission, safety, authorization and dispatch; a protective order is a resting close of the filled position | ATA-01 (`README.md:452`); AUD-01 (`:754`) | PRF-PRT-01, -06 |
| REQ-PRT-006 | Session-close exit follows the per-policy switch: an omitted value means `square_off`, which cancels resting protection, confirms it terminal, then closes; it is refused under kill | POL-010 | PRF-PRT-07 |
| REQ-PRT-007 | Permission matrix per named action and actor under kill, daily-loss latch and holds | Safety table row 3 (`README.md:772`); POL-002, POL-003, POL-004 | PRF-PRT-04, -05 |
| REQ-PRT-008 | This spec owns precedence row 3 (the permission matrix) and the conflict part of row 2 (reconcile before a conflicting action). Row 1 (integrity) is owned by the ledger and authority, row 4 (stale evidence) by admission check B1, row 5 (cognition unavailable) by `kernel.policy` | Safety table (`README.md:766-774`) | PRF-PRT-04, -11 |
| REQ-PRT-009 | Explicit, versioned conflict relation over typed actions, unresolved effects and shared exposure; neither blanket blocking nor per-target independence is inferred | ATA-04 (`README.md:454`) | PRF-PRT-11 |
| REQ-PRT-010 | Protection is classified broker-held and observed, runtime-dependent, or uncertain; ACK alone is not active protection | A03-F5 (`README.md:924`) | PRF-PRT-01, -06 |
| REQ-PRT-011 | The supervisor observes and escalates; it never sends | ATA-01 (`README.md:452`); A03-F5 (`:924`) | PRF-XC-02 |
| REQ-PRT-012 | Every safety check reports active, inert or damaged as a recorded state | LD-03; REQ-XC-004 | PRF-PRT-05 |
| REQ-PRT-013 | Protective prices use the planner's tick-rounding function (stop up, target down; inverted for a seller) | POL-015 | PRF-PRT-02 |
| REQ-PRT-014 | Protection obligations continue across release and session transitions with their original ladder and policy versions | Combined-F6 (`README.md:909`) | PRF-PRT-12 |

## Critical user journeys

### CUJ-PRT-1: Trail ratchet with the strategy worker down

* **Given** an open long call whose stop leg is `CONFIRMED` at 80.00 (its placement completed when the order was observed resting at 80.00). The strategy worker is stopped.
* **When** a bar confirms that moves the ladder's stop to 84.85.
* **Then**:
  * the kernel records `PROTECTION_DESIRED(84.85)`;
  * it submits a modify of the stop order (principal `kernel:protection`); admission and dispatch handle it;
  * the leg reads `PENDING` while that command is unresolved;
  * when reconciliation completes the modify with an orderbook row showing 84.85, the leg reads `CONFIRMED` at 84.85.

### CUJ-PRT-2: Crash between desired and confirmed

* **Given** `PROTECTION_DESIRED(84.85)` is committed and the modify is `UNCERTAIN`.
* **When** the kernel restarts and is advanced to `OPERATING`.
* **Then**:
  * the leg reads `PENDING` (its linked command is unresolved);
  * the believed broker stop stays 80.00 until an observation proves otherwise;
  * if a fresh row shows 84.85, the confirmed level is 84.85 (POL-014);
  * no second modify is submitted while the first is unresolved.

### CUJ-PRT-3: Kill engaged during a ratchet

* **Given** kill is engaged and a stop order rests for an open position.
* **When** a ratchet is computed.
* **Then:**
  * `PROTECTION_DESIRED` is recorded, and the automatic modify is refused (`PRT-R01 kill`, actor `automatic`) and recorded;
  * to exit, the owner first cancels the stop (an owner cancel of an owned unfilled order is permitted, POL-002), then closes the position once the stop is observed terminal;
  * an owner close sent while the stop still rests is refused at admission (`PRT-R10`, conflict row 5) and recorded.

### CUJ-PRT-4: Session close with `square_off`

* **Given** policy `session_close: square_off` at 15:13 IST and an open position with resting stop and target orders.
* **When** the clock reaches 15:13 or later while the session is still `OPEN`.
* **Then**:
  * the kernel records `SQUARE_OFF_STARTED` for the position and submits cancels for the stop and target;
  * when both are observed terminal, it submits a market close of the position;
  * under kill, nothing is sent and the broker's square-off remains the backstop.
* With `session_close: broker`, the project sends nothing; the broker's square-off is the only exit.

## Technical plan

### Evaluation (`kernel/protection.py`)

```text
evaluate(trigger, view: StableView, session: SessionRow, position: PositionView,
         policy: ProtectionPolicy, legs: list[ProtectionLeg])
    -> (records: list[EventDraft], requests: list[ActionRequest])
```

| Type | Fields |
|---|---|
| Triggers | `BarConfirmed(view_id, bar)`; `Tick(instrument, price, at)`; `SessionCloseTime(session_id)`; `ObservationChanged(observation_digest)` |
| `SessionRow` | The `session` index row ([sessions spec](sessions-authority-lifecycle.md#bindings-and-session-transitions-kernellifecyclepy-session-part)) |
| `PositionView` | Position ID, strategy, instrument, net quantity, its resting protective orders, and the linked commands of each leg, read from the ledger index |
| `ProtectionPolicy` | `ladder_version`, ladder parameters (defaults below), `exit_owner`, `session_close`, `close_time`, protective order types |
| `ProtectionLeg` | The persisted `PROTECTION_DESIRED` fields plus the derived state below |
| `ActionRequest` | The ledger's request types ([contract types](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy)) |

* **Who calls it.** The kernel's protection loop calls `evaluate` on the writer thread, once per trigger per position. It commits `records` through `transact`, then submits `requests` to admission. At the first evaluation after `OPERATING` (an `ObservationChanged` trigger), every leg is evaluated, which is how CP-P1 resumes.
* **Pure and bounded:** no I/O inside `evaluate`.
* **On `ObservationChanged`** the leg states are re-derived; a leg that became `DESIRED` gets its request.
* **Ladder.** The legacy `PremiumTrail` family (`OA/src/core/framework/protection/trail.py`, standard library only), behind `ProtectionPolicy.ladder_version`. Its parameters default to the approved shipped values in legacy `TrailSettings` (`trail.py:113-149`; trailing on and live, POL-012: `config/defaults.yaml:73`, `:1832-1833`). A policy may override them; it never has to state them. `ladder_state` holds the legacy `TrailPosition` fields (`trail.py:153-172`); the SLICE-06 file lists them exactly. The ladder's behaviour is proved by retained-scope parity (PRF-PRT-08), not restated here.
* **Triggers:**
  * the ladder ratchets on `BarConfirmed` (with POL-019's 7 s confirmation lag);
  * it evaluates its exit on `Tick` when `exit_owner = kernel_tick`; with `broker_stop`, ticks only update the classification;
  * `SessionCloseTime` fires once per position when the clock is at or after the policy's close time while the session is `OPEN`; an omitted close time uses the approved 15:13 (`lifecycle.py:31`, POL-010).
* **Gaps.** A bar flagged as inside a feed gap by the stable view records `GAP_PEAK_RECORDED` (`leg_id`, `bar`, `would_be_level`) and no request; `ladder_state` is left unchanged (POL-013; legacy "recorded, not sent").
* **Exit owner.** Each ladder version states `exit_owner`: `broker_stop` (the exit is the resting stop order, moved by modifies) or `kernel_tick` (the kernel closes on a tick). Legacy has both a tick exit test and a broker stop (`trail.py:15-20`); which owns the retained ladder's exit is characterized in TASK-S06-01. Either way, a kernel close runs only after the position's resting protective orders are cancelled and observed terminal (conflict row 5), so a broker stop and a kernel close never both sell.
* **Rounding.** Protective prices use `kernel.selection`'s tick-rounding function (POL-015).
* **No request while pending.** `evaluate` emits no request for a leg whose linked command is unresolved. It records a newer desired level instead and emits the request at the first evaluation after the linked command resolves. This avoids a refusal on every bar; the conflict relation (row 2) remains the enforcement.

### Protective orders and leg states

* **Placement.** When an entry command `COMPLETED` with a filled quantity above zero, protection creates one leg per protective order in the plan (roles `stop` and, if planned, `target`), records `PROTECTION_DESIRED` at the plan's protective levels (`Plan.protective_levels`, [intent spec](intent-to-admission.md#contracts-contractsdecisionspy)), and submits each as a **resting close** of the filled quantity: `CloseRequest(order = stop(trigger, limit | None) | limit(price))`, with the order types from the protection policy (AUD-01 close variant). Partial fills before completion are not protected by the project; the broker's square-off and the owner remain the backstop (see [Risks and limits](#risks-and-limits)).
* **Pairing.** When one resting close of a position fills in full, protection cancels the others. When it fills in part, protection modifies the others' quantity down to the remaining position.
* **Under kill** automatic placement, pairing and modifies are refused (POL-002). Protection then records `RECONCILIATION_ESCALATED` for the position so the owner sees that a stop is missing or larger than the position.
* **Re-placement.** A protective order observed terminal without a fill, and not cancelled by protection itself (for example rejected or expired by the broker), ends its leg with that reason; if the position is still open, protection creates a new leg and places it again.
* **Identity.** `leg_id = digest(position_id, role, placement_number)`. A leg's command keys are `"prot:<leg_id>:<n>"`, where `n` is the number of commands already recorded for the leg plus one, counted from the ledger (`COMMAND_ADMITTED` and `ADMISSION_REFUSED` both carry the key). The **latest linked command** is the one with the highest `n`.

**Persisted.** Protection records only what it alone knows, in `PROTECTION_DESIRED` (`leg_id`, `position_id`, `role`, `desired_level`, `ladder_state`, `ladder_version`, `policy_version`, `view_id`). It records it only when the desired level or ladder state changes.

**Derived leg state.** Evaluated in this order; the first that holds wins:

| Order | State | Holds when |
|---|---|---|
| 1 | `ENDED` | The protective order is observed terminal (filled, cancelled, rejected or expired), or the position is closed; the reason is kept |
| 2 | `PENDING` | The latest linked command is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN`, or `WORKING` (not yet `COMPLETED`) |
| 3 | `CONFIRMED` | The latest linked command `COMPLETED` and its confirmed level equals the desired level |
| 4 | `DESIRED` | Anything else: no linked command yet, or the latest one ended `REFUSED` or `REJECTED`, or was refused at admission, or completed at a level different from the desire |

* When a modify completes at the broker's level instead of the requested one (POL-014), protection records a new `PROTECTION_DESIRED` at that broker level, so the leg reads `CONFIRMED` and the next ratchet starts from the real level.
* `RESOLVED_NEVER_REACHED` returns the command to `ADMITTED`, so the leg stays `PENDING` and the coordinator, not protection, sends again.
* A busy refusal (`ADM-R12`) leaves no record; the leg stays `DESIRED` and the next evaluation submits again.

**The `protection_state` index table** holds, per leg, the persisted fields, the latest linked command key, the derived state and the classification. `fold` builds it from `PROTECTION_DESIRED`, `GAP_PEAK_RECORDED`, the linked commands' events and order observations, so the D04 comparison can rebuild it.

**Classification** (A03-F5), per leg, in this order:

| Classification | Holds when |
|---|---|
| broker-held, observed | `CONFIRMED`, `exit_owner = broker_stop`, and the order's own row appears in an orderbook observation that arrived no more than 60 s ago. The 60 s is derived from POL-021 for reporting only; admission's B1 check uses the same bound for its own purpose |
| runtime-dependent | `exit_owner = kernel_tick` |
| uncertain | Anything else, including `PENDING`, `DESIRED` and stale observations |

### Kill and holds (`kernel/safety.py`)

| Event | Recorded by | Payload | Guard |
|---|---|---|---|
| `KILL_ENGAGED` / `KILL_RELEASED` | A human principal with `kill_engage` / `kill_release` | `principal`, `reason` | Engage only when released; release only when engaged |
| `HOLD_ENGAGED` / `HOLD_RELEASED` | A human principal with `hold_engage` / `hold_release` (reason `operator`), or `kernel:recovery` (reason `recovery`) where the legacy recovery path holds a strategy (characterized in TASK-S06-03) | `strategy`, `reason`, `principal` | One engagement per strategy and reason |

* Kill applies to the whole desk and does not expire at session close (POL-002).
* A strategy is **held** while at least one reason is engaged. The master's "explicit operator hold" (`README.md:772`) and the legacy recovery hold (POL-003) are the two reasons.
* Each takes effect at its event's ledger sequence ([dispatch spec](dispatch-and-coordination.md#holds-and-in-flight-requests-req-dsp-009)).

### Permission matrix (`kernel/safety.py`)

| Condition | Entry | Cancel | Modify | Close | Source |
|---|---|---|---|---|---|
| Kill engaged | refused | owner only, owned unfilled order | refused | owner only, owned position | POL-002 (`sender.py:281-292`) |
| Daily-loss latch tripped (this session, this strategy) | refused | not restricted by this condition | not restricted | not restricted | POL-004 (entries only) |
| Strategy held | refused | owner: not restricted; automatic: per `safety.hold_automatic_actions` | same as cancel | same as cancel | POL-003 (`sender.py:293-296`) |

* An action matching no restricting row is not restricted by this table; grant, conflict and freshness checks still apply.
* "Owner only" means a human principal's command for exactly this action and target, with fresh revalidation. Automatic, AI, workflow and supervisor actors carry no owner command (POL-002). "Unfilled" follows POL-002's wording; whether a partly filled order counts is characterized from `sender.py` in TASK-S05-07.
* `safety.hold_automatic_actions` (`allowed` or `refused`) is a refusing parameter, [Q-001](../decisions/owner-questions.md#q-001). Legacy behaviour is `allowed` (`sender.py:293-296`), but that is evidence, not a default.
* **Strategy of an action.** Every command records a `strategy` (ledger `command_identity`): an entry's comes from its intent; a cancel, modify or close takes the strategy of the position or order it targets; a position takes its entry's.
* **Several conditions at once.** Admission check A4 and dispatch revalidation row 5 test, in order: damaged checks (`PRT-R07`), inert checks (`PRT-R06`), kill (`PRT-R01`), hold (`PRT-R04`), latch (`PRT-R03`). The first that refuses gives the code. An AI PAUSE is not a matrix condition; `kernel.policy` owns it ([intent-to-admission](intent-to-admission.md#review-application-kernelpolicypy)).

### Daily-loss latch (`kernel/safety.py`)

* **Input.** `kernel.reservations.session_pnl(strategy, session_id)`: broker-reported realised plus mark-to-market P&L of the strategy's positions in the session (legacy basis, `OA/src/core/framework/execution/loss_latch.py:11-14`). It is gross of estimated charges, as legacy, and `Unavailable` when the position observation is older than 60 s.
* **Budget.** `risk.max_daily_loss_amount` is required ([Q-002](../decisions/owner-questions.md#q-002)); a policy without it refuses to load. If `risk.max_daily_loss_pct` and `risk.capital` are also bound, the budget is the smaller of the amount and that percent of capital (legacy `budget()`, `loss_latch.py:167-177`).
* **When.** `kernel.safety` evaluates the latch on every new position observation and at admission check A4.
* **Trip.** The first P&L at or below −budget records `LOSS_LATCH_TRIPPED` (`strategy`, `session_id`, `pnl`, `budget`, `observation_digest`). An already-tripped latch keeps its first trip (`trip`, `loss_latch.py:512`). Entries for that strategy are refused for the rest of the session.
* **Unlock.** A human principal with `latch_unlock` and a reason records `LOSS_LATCH_UNLOCKED` (`principal`, `reason`; only when tripped). As in legacy, the next P&L still at or below −budget trips it again (`unlock`, `loss_latch.py:576-583`).
* **Replay** has its own latch in its own ledger (POL-006).

### Conflict relation (`kernel/safety.py`)

* An **exposure group** is a position together with its resting protective orders.
* An **unresolved effect** is a command in `IN_FLIGHT` or `UNCERTAIN`, or in `WORKING` before its completion is observed. A protective order whose placement `COMPLETED` is a group member, not an unresolved effect.
* A request never conflicts with its own command.

| # | New action | Unresolved effect or state | Conflicts? | Source |
|---|---|---|---|---|
| 1 | Entry | Any open position, or any unresolved entry, in the same slot scope (account, underlying) | yes | POL-007 |
| 2 | Any action on a member of exposure group G | Any unresolved effect on any member of G | yes | ATA-04 shared exposure (`README.md:454`) |
| 3 | Any action | An effect whose resolution could change account capacity | no; handled by reservation and capacity | D16 (`README.md:764`) |
| 4 | Protective action on owned exposure | Unresolved entry elsewhere on the same account | per `protective_independence`: `same_group_only` (no conflict; Q-004 option A) or `account_wide` (conflict; option B) | ATA-04; [Q-004](../decisions/owner-questions.md#q-004) |
| 5 | A non-resting close of position P | Any resting protective order of P not observed terminal | yes; cancel it first | POL-010 sequence; POL-008 (no net sale beyond the position) |

* A pair matching no row does not conflict.
* **Version.** The relation's version is the digest of this table's rule set plus the bound `protective_independence` value. It is recorded in the bound policy and in each admission.
* Admission check B3 refuses an action the relation forbids when it is admitted. After admission, the coordinator applies the current relation as an eligibility condition: a conflict that appears later makes the command wait, not fail ([dispatch spec](dispatch-and-coordination.md#eligibility-and-scheduling)).

### Session-close exit

* With `square_off`, at `SessionCloseTime` protection records `SQUARE_OFF_STARTED` (`position_id`, `session_id`) once per position per session, cancels the position's resting protective orders, and, when all are observed terminal, submits a market close of the remaining quantity.
* The sequence continues after `SESSION_CLOSED` if it has started (a close needs no open session) and after a restart (the event records that it started).
* A restart after the close time and before `SESSION_CLOSED` starts it.
* A refused or conflicting step is retried at the next evaluation.

### Safety-check visibility

| Check | Inert when | Damaged when | Guards |
|---|---|---|---|
| Kill | — (state is in the ledger) | Its index row fails D04 (then `LED-R05` also applies) | Every action the kill row restricts |
| Hold | — | Same | The held strategy's actions per its row |
| Latch | `session_pnl` is `Unavailable` | Same | The strategy's entries |
| Conflict | The observation needed for the target is stale | Same | The action being checked |

A change of state is recorded as `SAFETY_CHECK_STATE` (`check`, `scope`, `state`, `reason`). An `inert` or `damaged` check refuses the actions it guards. It never passes them silently (LD-03).

### Refusal codes

| Code | Meaning |
|---|---|
| `PRT-R01 kill` | Kill forbids this action for this actor (actor recorded) |
| `PRT-R03 latched` | Entry refused by the daily-loss latch |
| `PRT-R04 held` | Action refused by a hold |
| `PRT-R06 check_inert` | Guarding check is inert |
| `PRT-R07 check_damaged` | Guarding check is damaged |
| `PRT-R10 conflict` | Conflict relation forbids the action now |

`PRT-R02`, `R05`, `R08` and `R09` are unused: one kill code covers every actor; a paused entry is `ADM-R11`; one-attempt-per-leg is conflict row 2; an unbound budget refuses at load.

## Failure modes and crash points

| ID | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-P1 | Crash after `PROTECTION_DESIRED`, before admission | After the advance to `OPERATING`, the leg reads `DESIRED`; one request is submitted | PRF-PRT-03 |
| CP-P2 | Crash with the modify `UNCERTAIN` | CUJ-PRT-2 | PRF-PRT-03 |
| CP-P3 | Crash during the square-off sequence | `SQUARE_OFF_STARTED` makes the sequence resume, not restart | PRF-PRT-07 |
| F-P4 | Kernel down or not `OPERATING` | No automatic protection advances; broker-held stops remain; reporting is the supervisor's ([runtime spec](runtime-isolation-observability-deployment.md)) | PRF-PRT-06 |
| F-P5 | Feed gap | Gap peak recorded only (POL-013) | PRF-PRT-02 |
| F-P6 | No fresh session P&L | Latch check `inert`; entries refused with `PRT-R06` | PRF-PRT-05 |
| F-P7 | An older observation arrives after a newer one | It changes no confirmed level (observation `as_of` order) | PRF-PRT-09 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| Partial fills before an entry completes are not protected by the project | Usually brief for the buyer's orders; the broker square-off and the owner remain the backstop. Protecting partial fills is a later design choice, recorded first |
| Under kill, a stop can remain after its target filled | Escalated to the owner, who may cancel it (POL-002) |
| `exit_owner` for the retained ladder is not yet characterized | The double-sell guard (row 5) holds for either value |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Ladder version and parameters | Bound policy (POL-012) | The approved shipped values in legacy `TrailSettings`; trailing on |
| `exit_owner` per ladder version | Characterized in TASK-S06-01 | Fixed by the ladder version |
| Session-close switch and time | Bound policy (POL-010) | Omitted switch: `square_off`; omitted time: 15:13 |
| `risk.max_daily_loss_amount` (with optional `risk.max_daily_loss_pct`, `risk.capital`) | Bound policy | None: refusing ([Q-002](../decisions/owner-questions.md#q-002)) |
| `safety.hold_automatic_actions` | [Q-001](../decisions/owner-questions.md#q-001) | None: refusing |
| `protective_independence` | [Q-004](../decisions/owner-questions.md#q-004) | None: refusing |

POL-010 also says a **misspelt** switch value means `square_off`, which conflicts with the master's rule that unknown configuration values are refused (A02-F2, `README.md:903`). That is [X-004](../consistency/master-contradictions.md#x-004); until it is decided, the loader refuses a misspelt value.

## Reuse evidence

* **Stops/trails/structure FSM/protection replay: reuse fitting pure logic; refactor hosting and state into kernel protection** (`README.md:1148`). `trail.py` (pure, standard library) and `structures.py` (action descriptions, stop/target pairing) are reuse candidates.
* **Loss latch:** `loss_latch.py` `budget` (`:167-177`), `trip` (`:512`), `observe` (`:559`), `unlock` (`:576`): rules kept, file storage replaced by ledger events.
* **Do not reuse:** the hosting in `run_framework_live.py` and `orchestrator.cycle` (LD-13); latch I/O in the planner (LD-03).
* **Sender kill matrix** `sender.py:281-296` is the behavioural reference for POL-002 and POL-003, not a module to copy.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Protection in a separate worker | Adds a failure point and a second state lineage without gaining availability, since sending needs the kernel (ATA-01 analysis, `README.md:460`) |
| Protection in the supervisor | The supervisor must not send (ATA-01, A03-F5) |
| Keep protection in the strategy host | Strategies emit intent only (Intent row `README.md:732`; diagram 2, `:568-720`) |
| Protection keeps its own attempted/uncertain/confirmed states | Duplicates the command lifecycle and reconciliation; two lineages can disagree after a crash |
| A separate "place protection" action | Not one of the four accepted variants (`README.md:735`); a resting close is |
| Treat resting protective orders as unresolved effects | Every modify of its own stop would conflict with itself; the group would deadlock |

## Proofs

Class **T** is an automated test; **M** is a measurement.

| Proof | Class | Test file | Expected outcome | Break check |
|---|---|---|---|---|
| PRF-PRT-01 | T | `tests/unit/test_protection_states.py` | Each derived-state row in order; placement on entry completion, not ACK; a resting close is `CONFIRMED` once observed resting; re-placement after a broker cancel | Treating ACK as confirmed fails |
| PRF-PRT-02 | T | `tests/unit/test_protection_states.py` | Ladder cases from POL-012/013/015 with default parameters (tick rounding: 84.805 to 84.85); a gap bar leaves `ladder_state` unchanged | — |
| PRF-PRT-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-P1/P2: one request, believed level unchanged until observed | Re-sending on restart fails |
| PRF-PRT-04 | T | `tests/unit/test_safety_matrix.py` | Every matrix cell and the code order; Q-001 cells run both values, labelled pending | — |
| PRF-PRT-05 | T | `tests/unit/test_safety_matrix.py` | Each check's inert and damaged cases refuse; the latch trips once, keeps its first trip, re-trips after unlock while P&L stays below; unlock needs a human and a reason | A silent pass fails |
| PRF-PRT-06 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-1 with the worker stopped; F-P4 with the kernel frozen | Protection in the worker fails |
| PRF-PRT-07 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-4 order and CP-P3 resume; a `kernel_tick` exit follows the same order; `broker` sends nothing | Closing first fails |
| PRF-PRT-08 | T (parity, retained scope) | `scripts/compare_parity.py` | Recorded days: target ladder moves equal legacy ladder moves (POL-012 retained behaviour) | Named scope only (A08-F3, LD-16) |
| PRF-PRT-09 | T | `tests/unit/test_protection_states.py` | Late observations change nothing; the same recorded inputs give the same records in live and replay | Using arrival order fails |
| PRF-PRT-10 | M | `tests/integration/test_protection_kernel.py` | Evaluation time per trigger is measured and recorded with the workload identity (A09-F4); no threshold is set here | — |
| PRF-PRT-11 | T | `tests/unit/test_conflict_relation.py` | ATA-04 matrix: uncertain entry, modify and cancel against each later action, on the same and different targets and accounts, with stalled transport and pending protection; a modify of a placed stop does not conflict with that stop; both `protective_independence` values, labelled pending | A blanket or per-target-only rule fails |
| PRF-PRT-12 | T | `tests/recovery/test_release_continuity.py` | A leg created under ladder `v1` keeps `v1` after a binding to `v2`; a release that cannot run `v1` is refused activation while the leg lives (release compatibility, [configuration spec](configuration-artifacts-release.md)) | Re-evaluating with the new ladder fails |

## Delivery

SLICE-05 builds the conflict relation (PRF-PRT-11) and the kill and hold events with their matrix rows (PRF-PRT-04 for those rows). SLICE-06, which depends on SLICE-05 and SLICE-07, builds protection evaluation and legs, the latch, the session close, check visibility, and PRF-PRT-01…10 and -12. See [plan/delivery-plan.md](../plan/delivery-plan.md).
