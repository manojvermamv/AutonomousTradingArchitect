# Protection and safety

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/protection-and-safety/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `kernel/protection.py` | [Evaluation](#evaluation-kernelprotectionpy), [Protective stop and tick exits](#protective-stop-and-tick-exits), [Session-close exit](#session-close-exit) |
  | `kernel/safety.py` | [Kill and holds](#kill-and-holds-kernelsafetypy), [Permission matrix](#permission-matrix-kernelsafetypy), [Daily-loss latch](#daily-loss-latch-kernelsafetypy), [Conflict relation](#conflict-relation-kernelsafetypy), [Safety-check visibility](#safety-check-visibility) |

* **Consumes:** stable views with the feed-gap flag ([market-data-and-canvas](market-data-and-canvas.md)); session events ([sessions](sessions-authority-lifecycle.md)); the `position` index, fills, confirmed levels and command states ([ledger](ledger-and-atomic-transaction.md), [execution-domain](execution-domain-and-observations.md)); the plan's protective levels and the tick-rounding function ([intent-to-admission](intent-to-admission.md#planning-port-kernelplannerpy-kernelselectionpy)).
* **Produces:** typed action requests, submitted to admission synchronously on the writer thread ([intent-to-admission](intent-to-admission.md)).
* **Master anchors:** ATA-01 (`README.md:452`), ATA-04 (`:454`), safety precedence table (`:766-774`), A03-F2 (`:916`), A03-F5 (`:924`), Protection state row (`:731`), AUD-01 (`:754`), Combined-F6 (`:909`), §7 protection row (`:1148`), separate-worker analysis (`:460`).
* **Policy rows:** POL-002 … POL-015 in the [policy inventory](../02-policy-inventory.md). The **desk** is every account bound to this kernel. Legacy paths are at `OA@445eb116`.

## Overview

`kernel.protection` evaluates approved protection policy inside the kernel process: the trailing stop, tick-time exits (target and deep-OTM delta), structure lifecycle actions and the session-close exit. It is a bounded, deterministic function of attributable market views, canonical session events and reconciled obligations. Its output is ordinary typed action requests, which pass the same admission, safety, authorization and dispatch path as any other action.

`kernel.safety` holds the rules that decide whether an action may proceed under kill, the daily-loss latch, holds or unresolved effects.

## The problem

In the legacy system all automatic protection runs in the strategy host (trail cycles, structure supervision that sends through the gateway, session-close exits). That host is exactly the component the target strips of financial authority (LD-13). Trail state lives in process memory, and the planner writes the loss latch (LD-03).

The master accepted: bounded protection in the kernel with recoverable desired, attempted and confirmed states (ATA-01); an explicit conflict relation (ATA-04); and a safety precedence that separates capability integrity from owner-chosen action policy (`README.md:766`).

## Goals

1. Automatic protection keeps working when strategy workers, cognition or the supervisor are down. It stops when the kernel is down or not yet `OPERATING`; the broker-held stop remains then (ATA-01, A03-F5).
2. After a crash, the kernel never mistakes a desired ratchet for a stop the broker applied (ATA-01).
3. Every approved protection and safety rule is preserved exactly as recorded: kill, the latch, the session-close switch, trailing on by default, gap peaks recorded only, tick rounding, and the broker's level after a timed-out modify.
4. At most one resting protective order per position, so protection can never sell more than the position.
5. Conflicts are an explicit, versioned relation, not an accident of locking (ATA-04).

## Non-goals

* New stop formulas, cadences, emergency permissions or protective priorities (`README.md:452`, `:454`).
* Deciding the hold reading ([Q-001](../decisions/owner-questions.md#q-001)) or protective-vs-entry ordering ([Q-004](../decisions/owner-questions.md#q-004)).
* Automatic flattening for any reason other than an approved exit rule (POL-002: kill never flattens).
* Supervisor behaviour ([runtime spec](runtime-isolation-observability-deployment.md)).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-PRT-001 | Bounded, deterministic protection evaluation inside the kernel process, independent of strategy and cognition workers and the supervisor | ATA-01 (`README.md:452`); LD-13 | PRF-PRT-06, -09, -10 |
| REQ-PRT-002 | Inputs are attributable, view-identified market inputs, canonical session events and reconciled obligation state | ATA-01 | PRF-PRT-01 |
| REQ-PRT-003 | Desired protection is persisted through the sole writer; attempted and confirmed states are read from the linked command and reconciliation | ATA-01; Protection state row (`:731`); POL-014 | PRF-PRT-01, -03 |
| REQ-PRT-004 | The approved ladder moves the stop on a confirmed bar close; exits are tested on a tick; a gap peak is recorded, not applied | ATA-01; POL-012, POL-013; LD-05 | PRF-PRT-02, -08 |
| REQ-PRT-005 | Protective actions are typed requests through normal admission; the protective stop is one resting close per position | ATA-01; AUD-01 (`:754`); POL-008 | PRF-PRT-01, -06 |
| REQ-PRT-006 | Session-close exit follows the per-policy switch: omitted means `square_off`, which cancels the resting stop, confirms it terminal, then closes; refused under kill | POL-010 | PRF-PRT-07 |
| REQ-PRT-007 | Permission matrix per named action and actor under kill, latch and holds | Safety table row 3 (`:772`); POL-002…POL-004 | PRF-PRT-04, -05 |
| REQ-PRT-008 | This spec owns precedence row 3 (the permission matrix) and the conflict part of row 2. Row 1 (integrity) belongs to the ledger and authority, row 4 (stale evidence) to admission check B1, row 5 (cognition unavailable) to `kernel.policy` | Safety table (`:766-774`) | PRF-PRT-04, -11 |
| REQ-PRT-009 | Explicit, versioned conflict relation over typed actions, unresolved effects and shared exposure | ATA-04 (`:454`) | PRF-PRT-11 |
| REQ-PRT-010 | Protection is classified broker-held and observed, runtime-dependent, or uncertain; ACK alone is not active protection | A03-F5 (`:924`) | PRF-PRT-01, -06 |
| REQ-PRT-011 | The supervisor observes and escalates; it never sends | ATA-01; A03-F5 | PRF-XC-02 |
| REQ-PRT-012 | Every safety check reports its state as a recorded fact | LD-03; REQ-XC-004 | PRF-PRT-05 |
| REQ-PRT-013 | Protective prices use the planner's tick-rounding function | POL-015 | PRF-PRT-02 |
| REQ-PRT-014 | Protection obligations continue across release and session transitions with their original ladder and policy versions | Combined-F6 (`:909`) | PRF-PRT-12 |

## Critical user journeys

### CUJ-PRT-1: Trail ratchet with the strategy worker down

* **Given** an open long call whose stop leg is `CONFIRMED` at 80.00. The strategy worker is stopped.
* **When** a bar confirms that moves the ladder's stop to 84.85.
* **Then** the kernel records `PROTECTION_DESIRED(84.85)` and submits a modify of the stop (principal `kernel:protection`); the leg reads `PENDING`; when reconciliation completes the modify with a row showing 84.85, the leg reads `CONFIRMED` at 84.85 (PRF-PRT-06).

### CUJ-PRT-2: Crash between desired and confirmed

* **Given** `PROTECTION_DESIRED(84.85)` is committed and the modify is `UNCERTAIN`.
* **When** the kernel restarts and is advanced to `OPERATING`.
* **Then** the leg reads `PENDING`; the believed stop stays 80.00 until an observation proves otherwise; a fresh row at 84.85 confirms 84.85 (POL-014); no second modify is submitted while the first is unresolved (PRF-PRT-03).

### CUJ-PRT-3: Kill engaged during a ratchet

* **Given** kill is engaged and a stop rests for an open position.
* **When** a ratchet is computed.
* **Then** `PROTECTION_DESIRED` is recorded and no request is submitted (automatic writes are refused under kill). To exit, the owner cancels the stop (permitted, POL-002), which also stops protection from re-placing it, then closes the position once the stop is observed terminal. An owner close sent while the stop still rests is refused at admission (`PRT-R10`, conflict row 5) and recorded (PRF-PRT-04).

### CUJ-PRT-4: Session close with `square_off`

* **Given** policy `session_close: square_off` at 15:13 IST and an open position with a resting stop.
* **When** the clock reaches 15:13 or later while the session is `OPEN`.
* **Then** the kernel records `SQUARE_OFF_STARTED`, cancels the stop and, once it is observed terminal, submits a market close. Under kill nothing is sent, the position is escalated, and the broker's square-off remains the backstop. With `session_close: broker`, the project sends nothing (PRF-PRT-07).

## Technical plan

### Evaluation (`kernel/protection.py`)

```text
evaluate(trigger, view: StableView, session: SessionRow, position: PositionView,
         policy: ProtectionPolicy, leg: ProtectionLeg | None, now: Timestamp)
    -> (records: list[EventDraft], requests: list[ActionRequest])
```

| Type | Fields |
|---|---|
| Triggers | `BarConfirmed(view_id, bar)`; `Tick(instrument, price, delta, at)`; `SessionCloseTime(session_id)`; `ObservationChanged(observation_digest)` |
| `SessionRow` | The `session` index row ([sessions spec](sessions-authority-lifecycle.md#event-catalogue)) |
| `PositionView` | The ledger `position` row (owned quantity, strategy, instrument), its resting stop if any, and the stop leg's linked commands |
| `ProtectionPolicy` | `ladder_version`, ladder parameters (defaults below), `session_close`, `close_time`, stop order type |
| `ProtectionLeg` | The persisted `PROTECTION_DESIRED` fields |

* **Who calls it.** The kernel's protection loop calls `evaluate` on the writer thread, once per trigger per position, commits `records` through `transact`, then submits `requests` to admission synchronously. At the first evaluation after `OPERATING`, every position is evaluated (CP-P1).
* **Ticks are bounded.** Only the latest tick per position is kept between evaluations (A03-F2 allows replaceable updates to be coalesced). The tick exit test (`premium_exit`, below) runs off the writer thread; only an exit decision is handed to it.
* **Ladder.** The legacy `PremiumTrail` family (`OA/src/core/framework/protection/trail.py`, standard library only), behind `ladder_version`. Its parameters default to the approved shipped values in `TrailSettings` (`trail.py:113-149`; trailing on and live, POL-012: `config/defaults.yaml:73`, `:1832-1833`). A policy may override them; it never has to state them. `ladder_state` holds the `TrailPosition` fields (`trail.py:153-172`), listed exactly in the SLICE-06 file. The ladder's behaviour is proved by retained-scope parity (PRF-PRT-08).
* **Gaps.** When a feed gap ends, protection records one `GAP_PEAK_RECORDED` for that gap with the would-be stop, computed as legacy does by replaying the gap's bars only when the recovered peak exceeds the live peak (`scripts/run_framework_live.py:5371-5403`, POL-013). `ladder_state` is unchanged.
* **Continuity.** A leg is always evaluated with the `ladder_version` and `policy_version` recorded in its `PROTECTION_DESIRED`, never the current binding's (Combined-F6).

### Protective stop and tick exits

The retained exit function, `premium_exit`, tests three reasons on each tick in a fixed precedence: deep-OTM delta, then stop, then target (`trail.py:370-392`). The target system splits them by who executes each:

| Exit reason | Executed by | How |
|---|---|---|
| Stop | The broker | One resting stop order per position, moved by modifies as the ladder ratchets. The kernel does not also close on a stop tick |
| Target, deep-OTM delta | The kernel, on a tick | Cancel the resting stop, wait until it is observed terminal, then submit a market close of the owned quantity |

* **Placement.** On the **first** `FILL` of an entry, protection creates the stop leg and submits `CloseRequest(order = stop(trigger, limit | None))` for the filled quantity, with the trigger from `Plan.protective_levels.stop` ([intent spec](intent-to-admission.md#contracts-contractsdecisionspy)) and the order type from the protection policy. Later fills raise the stop's quantity by a modify (admission allows a protective close up to the owned position). An ACK alone never starts protection.
* **Desire.** `PROTECTION_DESIRED` records `leg_id`, `position_id`, `desired_level`, `desired_quantity` (the owned quantity), `ladder_state`, `ladder_version`, `policy_version` and `view_id`, only when one of them changes.
* **When a modify completes at a different broker level** (POL-014), the confirmed level is the broker's; the desire becomes the tighter of the newer desired level and the broker level, so a ratchet computed meanwhile is not lost.
* **Identity.** `leg_id = digest(position_id, "stop", placement_number)`. Command keys are `"prot:<leg_id>:<n>"`, where `n` counts the leg's earlier commands (admitted or refused) plus one; the latest linked command has the highest `n`.
* **Retries.** On a `NOT_SENT` attempt or `RESOLVED_NEVER_REACHED`, protection records `DISPATCH_RETRY_REQUESTED` at its next evaluation ([dispatch spec](dispatch-and-coordination.md#eligibility-and-scheduling)). A transport-rejected modify is not resent at the same level; the next ratchet to a new level submits again.
* **Nothing automatic is re-placed.** A stop the broker rejects or expires, and a desired level already through the market, are escalated (`RECONCILIATION_ESCALATED`), not retried: no approved rule covers automatic re-placement, and legacy behaviour is characterized in TASK-S06-01.
* **Owner actions win.** An owner cancel of the stop records that the owner took over the exit; protection does not re-place it.
* **Orphans.** When a position's owned quantity reaches zero by any route (broker square-off, owner close, foreign trade), protection cancels its remaining stop; under kill it escalates instead.
* **No requests under a refusing condition.** While kill, a refusing hold or a latch would refuse the request, protection records the desire and submits nothing.

**Derived leg state**, evaluated in this order; the first that holds wins:

| Order | State | Holds when |
|---|---|---|
| 1 | `ENDED` | The stop is observed terminal, or the position's owned quantity is zero; the reason is kept |
| 2 | `PENDING` | The latest linked command is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN`, or `WORKING` |
| 3 | `CONFIRMED` | The latest linked command `COMPLETED`, and the confirmed level and quantity equal the desired ones |
| 4 | `DESIRED` | Anything else: no command yet, the latest ended `REFUSED` or `REJECTED` or was refused at admission, or the confirmed level or quantity differs from the desire |

The `protection_state` index table holds the persisted fields and the latest linked command key, built by `fold`.

**Classification** (A03-F5) is computed **on read**, from the stored rows, the latest observation's `as_of` and the reader's clock; it is never stored:

| Classification | Holds when |
|---|---|
| broker-held, observed | A stop order rests at its last confirmed level, and its row appeared in an orderbook observation no older than 60 s (derived from POL-021 for reporting; it gates nothing) |
| runtime-dependent | The target and deep-OTM delta exits, which only the kernel executes |
| uncertain | Anything else |

### Kill and holds (`kernel/safety.py`)

| Event | Recorded by | Payload | Guard |
|---|---|---|---|
| `KILL_ENGAGED` / `KILL_RELEASED` | A human principal with `kill_engage` / `kill_release` | `principal`, `reason` | Engage only when released; release only when engaged |
| `HOLD_ENGAGED` / `HOLD_RELEASED` | A human principal with `hold_engage` / `hold_release` (reason `operator`), or `kernel:recovery` (reason `recovery`, characterized in TASK-S06-03) | `strategy`, `reason`, `principal` | One engagement per strategy and reason |

* These events are folded into the `safety_state` index table ([ledger](ledger-and-atomic-transaction.md#schema-and-migrations)).
* Kill applies to the whole desk and does not expire at session close (POL-002). A strategy is **held** while at least one reason is engaged.
* Each takes effect at its event's ledger sequence ([dispatch spec](dispatch-and-coordination.md#holds-kills-and-latches-against-in-flight-requests)).

### Permission matrix (`kernel/safety.py`)

| Condition | Entry | Cancel | Modify | Close | Source |
|---|---|---|---|---|---|
| Kill engaged | refused | owner only, owned unfilled order | refused | owner only, a non-resting close of an owned position; a new resting close is refused | POL-002 (`sender.py:281-292`) |
| Daily-loss latch tripped (this session, this strategy) | refused | not restricted by this condition | not restricted | not restricted | POL-004 |
| Strategy held | refused | owner: not restricted; automatic: per `safety.hold_automatic_actions` | same as cancel | same as cancel | POL-003 (`sender.py:293-296`) |

* An action matching no restricting row is not restricted by this table; grant, conflict and freshness checks still apply.
* "Owner only" means a human principal's command for exactly this action and target, with fresh revalidation. "Unfilled" follows POL-002's wording; whether a partly filled order counts is characterized from `sender.py` in TASK-S05-07.
* `safety.hold_automatic_actions` (`allowed` or `refused`) is a refusing parameter, [Q-001](../decisions/owner-questions.md#q-001). Legacy behaviour is `allowed` (`sender.py:293-296`), which is evidence, not a default.
* **Strategy of an action.** Every command records a `strategy` (ledger `command_identity`): an entry's comes from its intent; a cancel, modify or close takes the strategy of the position or order it targets.
* **Several conditions.** Admission check A4 and dispatch row 5 test only the checks that guard the action, in the order: inert checks (`PRT-R06`), kill (`PRT-R01`), hold (`PRT-R04`), latch (`PRT-R03`). The first that refuses gives the code. An AI-management pause is not a matrix condition; `kernel.policy` owns it.

### Daily-loss latch (`kernel/safety.py`)

* **Input.** `kernel.safety` computes session P&L itself, as legacy does next to the latch (`OA/src/runtime/session_state.py:171`):

  ```text
  session_pnl(strategy, session_id, now) -> SessionPnl(pnl, observation_digest, as_of) | Unavailable
  ```

  `pnl` sums, over the positions owned by the strategy in the session, the broker-reported P&L field the legacy code reads, or realised plus mark-to-market where the endpoint splits them; which fields the deployed endpoint carries is characterized in TASK-S06-04 against the endpoint contract. A position belongs to the strategy of its entry command (the ledger `position` row). It is gross of estimated charges, as legacy (`loss_latch.py:11-14`), and `Unavailable` when the position observation is older than 60 s (POL-021), incomplete, or lacks the field.
* **Budget.** `risk.max_daily_loss_amount` is required ([Q-002](../decisions/owner-questions.md#q-002)). If `risk.max_daily_loss_pct` and `risk.capital` are also bound, the budget is the smaller of the amount and that percent of capital (legacy `budget()`, `loss_latch.py:167-177`).
* **When.** `kernel.safety` evaluates the latch on every new position observation and at admission check A4.
* **Trip.** The first P&L at or below −budget records `LOSS_LATCH_TRIPPED` (`strategy`, `session_id`, `pnl`, `budget`, `observation_digest`). An already-tripped latch keeps its first trip (`trip`, `loss_latch.py:512`). Entries for that strategy are refused for the rest of the session.
* **Unlock.** A human principal with `latch_unlock` and a reason records `LOSS_LATCH_UNLOCKED` (only when tripped). As in legacy, the next P&L still at or below −budget trips it again (`unlock`, `loss_latch.py:576-583`).
* **Replay** has its own latch in its own ledger (POL-006).

### Conflict relation (`kernel/safety.py`)

* An **exposure group** is a position together with its resting stop.
* An **unresolved effect** is a command in `IN_FLIGHT` or `UNCERTAIN`, or in `WORKING` before its completion is observed. A modify or cancel whose target is observed terminal for another reason completes (reason `target_terminal`, [ledger verb rules](ledger-and-atomic-transaction.md#command-and-attempt-state-machine)), so it never freezes a group. A placed stop is a group member, not an unresolved effect. A request never conflicts with its own command.
* Rows are tested in order; the first matching row decides; a pair matching no row does not conflict.

| # | New action | Unresolved effect or state | Conflicts? | Source |
|---|---|---|---|---|
| 1 | Entry | Any open position, or any unresolved entry, in the same slot scope (account, underlying) | yes | POL-007 |
| 2 | An action on group G that could add sale quantity or remove G's stop | Any unresolved effect on any member of G | yes | ATA-04 shared exposure (`README.md:454`) |
| 3 | A non-resting close of position P | P's resting stop not observed terminal | yes; cancel it first | POL-010 sequence; POL-008 |
| 4 | Protective action on owned exposure | Unresolved entry elsewhere on the same account | per `protective_independence`: `same_group_only` (no conflict; Q-004 option A) or `account_wide` (conflict; option B) | ATA-04; [Q-004](../decisions/owner-questions.md#q-004) |

* Capacity effects of unresolved commands are handled by reservations and capacity (D16), not by this relation.
* **Version.** The relation's version is computed in code as the digest of this rule set plus the bound `protective_independence` value. Admission records it; it is evidence only, and a change after admission is not a refusal.
* Admission check B3 refuses an action the relation forbids when it is admitted. After admission, the coordinator applies the current relation as an eligibility condition, so a later conflict makes the command wait.

### Session-close exit

* With `square_off`, at `SessionCloseTime` protection records `SQUARE_OFF_STARTED` (`position_id`, `session_id`) once per position per session, cancels the resting stop, and, when it is observed terminal, submits a market close of the owned quantity.
* The sequence continues after `SESSION_CLOSED` if it has started (a close needs no open session) and after a restart. A restart after the close time and before `SESSION_CLOSED` starts it. A refused or conflicting step is retried at the next evaluation.
* If kill is engaged partway through, protection stops and escalates the position.

### Safety-check visibility

| Check | Inert when | Guards |
|---|---|---|
| Kill, hold | Never (state is in the ledger index; a damaged index is `LED-R05`, which stops all writes) | The actions their rows restrict |
| Latch | `session_pnl` is `Unavailable` | The strategy's entries |

A change of state is recorded as `SAFETY_CHECK_STATE` (`check`, `scope`, `state`, `reason`), only on change. An inert check refuses the actions it guards at admission; at dispatch eligibility the command waits ([dispatch spec](dispatch-and-coordination.md#eligibility-and-scheduling)). It never passes them silently (LD-03). Stale observations are admission check B1's and dispatch row 7's, not a conflict-check state.

### Refusal codes

| Code | Meaning |
|---|---|
| `PRT-R01` (`kill`) | Kill forbids this action for this actor (actor recorded) |
| `PRT-R03` (`latched`) | Entry refused by the daily-loss latch |
| `PRT-R04` (`held`) | Action refused by a hold |
| `PRT-R06` (`check_inert`) | A guarding check is inert |
| `PRT-R10` (`conflict`) | The conflict relation forbids the action now |

`PRT-R02`, `R05`, `R07`, `R08` and `R09` are unused: one kill code covers every actor; a paused entry is `ADM-R11`; a damaged index is `LED-R05`; one-attempt-per-leg is conflict row 2; an unbound budget refuses at load.

## Failure modes and crash points

| ID | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-P1 | Crash after `PROTECTION_DESIRED`, before admission | After the advance to `OPERATING`, the leg reads `DESIRED`; one request is submitted | PRF-PRT-03 |
| CP-P2 | Crash with the modify `UNCERTAIN` | CUJ-PRT-2 | PRF-PRT-03 |
| CP-P3 | Crash during the square-off sequence | `SQUARE_OFF_STARTED` makes it resume, not restart | PRF-PRT-07 |
| CP-P4 | Crash between a later fill and the quantity modify | The quantity mismatch reads `DESIRED`; the modify is submitted | PRF-PRT-03 |
| F-P5 | Kernel down or not `OPERATING` | The broker stop remains; tick exits do not run; reporting is the supervisor's | PRF-PRT-06 |
| F-P6 | Feed gap | One gap-peak record per gap (POL-013) | PRF-PRT-02 |
| F-P7 | No fresh session P&L | Latch check inert; entries refused with `PRT-R06` | PRF-PRT-05 |
| F-P8 | An older observation arrives after a newer one | It changes nothing (`observed_order` `as_of` order) | PRF-PRT-09 |
| F-P9 | The stop's target order fills while a modify is in flight | The modify completes with `target_terminal`; the group is free | PRF-PRT-11 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| A target or deep-OTM exit needs cancel, observation, then close: several observation cycles in a fast market | The broker stop holds throughout; whether to turn the stop marketable instead (modify its trigger through the market) is characterized in TASK-S06-01 and recorded as a decision before use |
| Under kill, a stop can exceed a position that changed | Escalated to the owner, who may cancel it (POL-002) |
| Broker P&L rows are per instrument and per broker day; sequential sharing of a contract by two strategies, or a session that is not the broker day, misattributes P&L | The slot rule prevents concurrent sharing; the field basis is characterized in TASK-S06-04; a mismatch makes the latch inert rather than wrong |
| A missing P&L field leaves the latch inert and refuses all entries | Characterized before production; the refusal is visible as `SAFETY_CHECK_STATE` |
| Tick load on the writer thread | Latest-tick coalescing; the exit test runs off the writer thread; PRF-PRT-10 measures queue delay |
| No automatic re-placement after a broker reject | Escalated at once; any re-placement rule is an owner decision |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Ladder version and parameters | Bound policy (POL-012) | The approved shipped values in `TrailSettings`; trailing on |
| Session-close switch and time | Bound policy (POL-010) | Omitted switch: `square_off`; omitted time: 15:13 |
| `risk.max_daily_loss_amount` (optional `risk.max_daily_loss_pct`, `risk.capital`) | Bound policy | None: refusing ([Q-002](../decisions/owner-questions.md#q-002)) |
| `safety.hold_automatic_actions` | [Q-001](../decisions/owner-questions.md#q-001) | None: refusing |
| `protective_independence` | [Q-004](../decisions/owner-questions.md#q-004) | None: refusing |

POL-010 also says a **misspelt** switch value means `square_off`. A02-F2 requires unknown-key and value-normalization behaviour to be defined in the resolver contract (`README.md:903`) and the package's resolver refuses unknown values; that tension is [X-004](../consistency/master-contradictions.md#x-004). Until it is decided, the loader refuses a misspelt value.

## Reuse evidence

* **Stops/trails/structure FSM/protection replay: reuse fitting pure logic; refactor hosting and state into kernel protection** (`README.md:1148`). `trail.py` (pure, standard library; `premium_exit` `:370-392`) and `structures.py` (action descriptions) are reuse candidates.
* **Loss latch:** `OA/src/core/framework/execution/loss_latch.py` `budget` (`:167-177`), `trip` (`:512`), `observe` (`:559`), `unlock` (`:576`): rules kept, file storage replaced by ledger events.
* **Gap peak:** `scripts/run_framework_live.py:5371-5403`.
* **Do not reuse:** the hosting in `run_framework_live.py` and `orchestrator.cycle` (LD-13); latch I/O in the planner (LD-03).
* **Sender kill matrix** `sender.py:281-296` is the behavioural reference for POL-002 and POL-003, not a module to copy.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Protection in a separate worker | Adds a failure point and a second state lineage without gaining availability, since sending needs the kernel (`README.md:460`) |
| Protection in the supervisor | The supervisor must not send (ATA-01, A03-F5) |
| Protection keeps its own attempted/uncertain/confirmed states | Duplicates the command lifecycle and reconciliation |
| Rest both stop and target at the broker | Two full-quantity sells can both fill and leave the account short (POL-008); legacy tests the target on a tick |
| Broker OCO or bracket orders | Not proven on the OpenAlgo endpoints in use; an endpoint-contract item for later |
| Place protection only when the entry completes | Leaves partial fills unprotected |
| Automatic re-placement after a broker reject | No approved rule; it would loop on a gap through the trigger |
| Store the classification in `fold` | It depends on the clock, so a rebuilt fold would disagree with the stored rows |

## Proofs

Class **T** is an automated test; **M** is a measurement.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-PRT-01 | T | `tests/unit/test_protection_states.py` | Each derived-state row in order; placement on the first fill and quantity raised on later fills; one resting stop per position; owner cancel stops re-placement; orphans cancelled | ACK is treated as confirmation, or a second resting order is placed |
| PRF-PRT-02 | T | `tests/unit/test_protection_states.py` | Ladder cases from POL-012/013/015 with default parameters (84.805 rounds to 84.85); one gap-peak record per gap; `premium_exit` precedence | a gap moves the stop |
| PRF-PRT-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-P1, CP-P2, CP-P4 | a restart resends |
| PRF-PRT-04 | T | `tests/unit/test_safety_matrix.py` | Every matrix cell and the code order; CUJ-PRT-3; Q-001 cells run both values, labelled pending | a cell is skipped |
| PRF-PRT-05 | T | `tests/unit/test_safety_matrix.py` | An inert latch refuses entries; the latch trips once, keeps its first trip and re-trips after unlock while P&L stays below; unlock needs a human and a reason | a check passes silently |
| PRF-PRT-06 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-1 with the worker stopped; F-P5 with the kernel frozen | protection depends on the worker |
| PRF-PRT-07 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-4 and CP-P3; a target tick exit follows cancel, terminal, close | the close is sent before the stop is terminal |
| PRF-PRT-08 | T (parity, retained scope) | `scripts/compare_parity.py` | Recorded days: target ladder moves equal legacy moves (POL-012 retained scope, A08-F3, LD-16) | moves differ outside listed corrections |
| PRF-PRT-09 | T | `tests/unit/test_protection_states.py` | F-P8; the same recorded inputs give the same records in live and replay | arrival order is used |
| PRF-PRT-10 | M | `tests/integration/test_protection_kernel.py` | Evaluation time and writer-queue delay of financial transitions under recorded tick rates, recorded with the workload (A09-F4) | — |
| PRF-PRT-11 | T | `tests/unit/test_conflict_relation.py` | ATA-04 matrix: uncertain entry, modify and cancel against later actions, same and different targets and accounts, stalled transport; F-P9; both `protective_independence` values, labelled pending | a blanket or per-target-only rule |
| PRF-PRT-12 | T | `tests/recovery/test_release_continuity.py` | A leg created under ladder `v1` keeps `v1` and its policy version after a binding to `v2`; a release that cannot run `v1` is refused activation while the leg lives ([configuration spec](configuration-artifacts-release.md)) | the new ladder is applied |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-05 | REQ-PRT-009 with a stub `position` row from synthetic fills; kill and hold events and their matrix rows | PRF-PRT-04 (kill and hold rows), PRF-PRT-11 |
| SLICE-06 (after SLICE-05 and SLICE-07) | REQ-PRT-001…008, -010, -012…014 | PRF-PRT-01…10, -12 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
