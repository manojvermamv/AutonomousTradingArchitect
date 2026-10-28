# Protection and safety

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/protection-and-safety/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `kernel/protection.py` | [Evaluation](#evaluation-kernelprotectionpy), [Protective stop and tick exits](#protective-stop-and-tick-exits-kernelprotectionpy), [Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy), [Structures](#structures-kernelprotectionpy), [Session-close exit](#session-close-exit-kernelprotectionpy) |
  | `kernel/safety.py` | [Kill and holds](#kill-and-holds-kernelsafetypy), [Permission matrix](#permission-matrix-kernelsafetypy), [Daily-loss latch](#daily-loss-latch-kernelsafetypy), [Conflict relation](#conflict-relation-kernelsafetypy), [Safety-check visibility](#safety-check-visibility-kernelsafetypy), [Refusal codes](#refusal-codes-kernelsafetypy) |
  | both | [Event catalogue](#event-catalogue) |

* **Consumes:**
  * stable views with the feed-gap flag ([market-data-and-canvas](market-data-and-canvas.md));
  * session events ([sessions](sessions-authority-lifecycle.md));
  * the `position` index, fills, confirmed levels and command states ([ledger](ledger-and-atomic-transaction.md), [execution-domain](execution-domain-and-observations.md));
  * the plan's protective levels and the tick-rounding function ([intent-to-admission](intent-to-admission.md#planning-port-kernelplannerpy-kernelselectionpy)).
* **Produces:** typed action requests, submitted to admission synchronously on the writer thread ([intent-to-admission](intent-to-admission.md)), and the events in the [event catalogue](#event-catalogue).
* **Commits through:** `transact` on the writer thread ([ledger](ledger-and-atomic-transaction.md#the-atomic-transaction)).
* **Terms:** see the [package glossary](../README.md#terms-used-across-the-specs). To **escalate** is to record `RECONCILIATION_ESCALATED` with a reason; that raises an owner alert and sends nothing. A **human principal** is any runtime actor of kind `human` ([sessions spec](sessions-authority-lifecycle.md)); **the owner** is the person who decides policy. The **exit sequence** is: cancel the resting stop, wait until it is observed terminal, then submit a market close of the owned quantity; it is defined once, [below](#protective-stop-and-tick-exits-kernelprotectionpy).
* **Master anchors:** ATA-01 (`README.md:452`), ATA-04 (`:454`), safety precedence table (`:766-774`), A03-F2 (`:916`), A03-F5 (`:924`), Protection state row (`:731`), AUD-01 (`:754`), Combined-F6 (`:909`), §7 protection row (`:1148`), separate-worker analysis (`:460`).
* **Policy rows:** POL-002 … POL-015 and POL-021 in the [policy inventory](../02-policy-inventory.md). The **desk** is every account bound to this kernel. Legacy paths are at `OA@445eb116`.

## Overview

`kernel.protection` evaluates approved protection policy inside the kernel process: the trailing stop, tick-time exits (target and deep-OTM delta), the lifecycle actions of multi-leg structures, and the session-close exit. It is a bounded, deterministic function of attributable market views, canonical session events and reconciled obligations. Its output is ordinary typed action requests, which pass the same admission, safety, authorization and dispatch path as any other action.

`kernel.safety` holds the rules that decide whether an action may proceed under kill, the daily-loss latch, holds or unresolved effects.

## The problem

In the legacy system all automatic protection runs in the strategy host (trail cycles, structure supervision that sends through the gateway, session-close exits). That host is exactly the component the target strips of financial authority (LD-13). Trail state lives in process memory, and the planner writes the loss latch (LD-03).

The master accepted: bounded protection in the kernel with recoverable desired, attempted and confirmed states (ATA-01); an explicit conflict relation (ATA-04); and a safety precedence that separates capability integrity from owner-chosen action policy (`README.md:766`).

## Goals

1. Automatic protection keeps working when strategy workers, cognition or the supervisor are down. It stops when the kernel is down or not yet `OPERATING`; the broker-held stop remains then (ATA-01, A03-F5).
2. After a crash, the kernel never mistakes a desired ratchet for a stop the broker applied (ATA-01).
3. Every approved protection and safety rule is preserved exactly as recorded:
   * kill and the daily-loss latch;
   * the session-close switch;
   * trailing on by default;
   * gap peaks recorded, never applied;
   * tick rounding;
   * the broker's level after a timed-out modify.
4. Protection never leaves more resting sell quantity than the position can absorb: under `stop_on_fill`, one resting protective order per position; under `basket_at_plan`, the quantity invariant P-1 once the entry has ended, with the one-cancels-other race detected and held ([Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy)).
5. Conflicts are an explicit, versioned relation, not an accident of locking (ATA-04).

## Non-goals

* New stop formulas, cadences, emergency permissions or protective priorities (`README.md:452`, `:454`).
* Changing the decided hold reading or protective-vs-entry ordering ([owner answers](../decisions/owner-answers-2026-10-27.md) Q-001, Q-004).
* Automatic flattening for any reason other than an approved exit rule (POL-002: kill never flattens).
* Supervisor behaviour ([runtime spec](runtime-isolation-observability-deployment.md)).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-PRT-001 | Bounded, deterministic protection evaluation inside the kernel process, independent of strategy and cognition workers and the supervisor | ATA-01 (`README.md:452`); LD-13 | PRF-PRT-06, -09, -10 |
| REQ-PRT-002 | Inputs are attributable, view-identified market inputs, canonical session events and reconciled obligation state | ATA-01 | PRF-PRT-09 |
| REQ-PRT-003 | Desired protection is persisted through the sole writer; attempted and confirmed states are read from the linked command and reconciliation | ATA-01; Protection state row (`:731`); POL-014 | PRF-PRT-01, -03 |
| REQ-PRT-004 | The approved ladder moves the stop on a confirmed bar close; exits are tested on a tick; a gap peak is recorded, not applied | ATA-01; POL-012, POL-013; LD-05 | PRF-PRT-02, -08 |
| REQ-PRT-005 | Protective actions are typed requests through normal admission; the protective stop is one resting close per position | ATA-01; AUD-01 (`:754`); POL-008 | PRF-PRT-01, -06 |
| REQ-PRT-006 | Session-close exit follows the per-policy switch: omitted means `square_off`, which runs the exit sequence; under kill nothing is sent | POL-010 | PRF-PRT-07 |
| REQ-PRT-007 | Permission matrix per named action and actor under kill, latch and holds | Safety table row 3 (`:772`); POL-002…POL-004 | PRF-PRT-04, -05 |
| REQ-PRT-008 | This spec owns precedence row 3 (the permission matrix) and the conflict part of row 2. Row 1 (integrity) belongs to the ledger and authority, row 4 (stale evidence) to admission check B1, row 5 (cognition unavailable) to `kernel.policy` | Safety table (`:766-774`) | PRF-PRT-04, -11 |
| REQ-PRT-009 | Explicit, versioned conflict relation over typed actions, unresolved effects and shared exposure | ATA-04 (`:454`) | PRF-PRT-11 |
| REQ-PRT-010 | Protection is classified broker-held and observed, runtime-dependent, or uncertain, on read; ACK alone is not active protection | A03-F5 (`:924`) | PRF-PRT-01, -13 |
| REQ-PRT-011 | The supervisor observes and escalates; it never sends (owned with REQ-OPS-001, [runtime spec](runtime-isolation-observability-deployment.md)) | ATA-01; A03-F5 | PRF-PRT-14 |
| REQ-PRT-012 | Every safety check reports its state as a recorded fact | LD-03; REQ-XC-004 | PRF-PRT-05 |
| REQ-PRT-013 | Protective prices use the planner's tick-rounding function | POL-015 | PRF-PRT-02 |
| REQ-PRT-014 | Protection obligations continue across release and session transitions with their original ladder and policy versions | Combined-F6 (`:909`) | PRF-PRT-12 |
| REQ-PRT-015 | Each leg of a multi-leg structure is protected by the same rules; the legacy structure actions map to typed requests, and none adds sale quantity beyond an owned leg | §7 protection row (`:1148`); POL-008 | PRF-PRT-01 |

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
* **Then** `PROTECTION_DESIRED` is recorded and no request is submitted (automatic writes are refused under kill). To exit, a human principal cancels the stop (permitted, POL-002), then closes the position once the stop is observed terminal. A human principal's close sent while the stop still rests is refused at admission (`PRT-R10` (`conflict`), conflict row 3) and recorded (PRF-PRT-04).

### CUJ-PRT-4: Session close with `square_off`

* **Given** policy `session_close: square_off` at 15:13 IST and an open position with a resting stop.
* **When** the clock reaches 15:13 or later while the session is `OPEN`.
* **Then** the kernel records `EXIT_STARTED` (reason `square_off`) and runs the exit sequence ([session-close exit](#session-close-exit-kernelprotectionpy), which also covers kill). With `session_close: broker`, the project sends nothing (PRF-PRT-07).

## Technical plan

### Evaluation (`kernel/protection.py`)

```text
evaluate(trigger, view: StableView, session: SessionRow, position: PositionView,
         policy: ProtectionPolicy, leg: ProtectionLeg | None, now: Timestamp)
    -> (records: list[EventDraft], requests: list[ActionRequest])
```

| Type | Fields |
|---|---|
| Triggers | `BarConfirmed(view_id, bar)`; `Tick(instrument, price, delta, at)`; `SquareOffTime(session_id)`, raised by the protection loop from its clock; `ObservationChanged(observation_digest)`; `LedgerChanged(command_key)`, raised after a commit of `OUTCOME_*`, `RESOLVED_*`, `LEG_ASSIGNED`, `FILL` or `COMPLETED` for a protected entry or one of its protective legs |
| `SessionRow` | The `session` index row ([sessions spec](sessions-authority-lifecycle.md#event-catalogue)) |
| `PositionView` | The **protected subject**: the ledger `position` row (signed owned quantity `q`, state, strategy, instrument), or, before the entry's first fill, the same `position_id` with `q` = 0; its `EXIT_STARTED` record if any; and, per protective leg (role `stop`, or `stop` and `target` under `basket_at_plan`): the leg's **live order** (below), its commands (key prefix `prot:<position_id>:<role>:` in `command_identity`), its recorded fills, and `observed`: the order's row in the latest fresh, complete orderbook (`status`, `trigger`, `price`, `quantity`, `filled_quantity`, `observation_digest`, `as_of`), or `None` when that observation is older than 60 s (POL-021) or does not show the order |
| `ProtectionPolicy` | `ladder_version`, ladder parameters (defaults below), `session_close`, `square_off_time`, `stop_order_type` |
| `ProtectionLeg` | The persisted `PROTECTION_DESIRED` fields |

* **Who calls it.** The kernel's protection loop calls `evaluate` on the writer thread, once per trigger per protected subject, commits `records` through `transact`, then submits `requests` to admission synchronously. The **protected subjects** are every `position` row that is not `closed`, every position (of any state) with a protective order not observed terminal, and every entry command whose `PlanRef.protective_legs` is not empty and whose protective legs are not all `ENDED` (so a basket whose entry never filled is still evaluated). At the first evaluation after `OPERATING`, every subject is evaluated (CP-P1).
* **A leg's live order** is the broker order ID that currently carries it: for a basket leg, the order recorded with its role under the entry's command key; for a `stop_on_fill` stop, the order acknowledged for the leg's placing `CloseRequest`; in both cases followed through replacements, because a modify that replaces an order ID records the new ID with the replaced order's command key and `leg_role` ([execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)).
* **One request at a time per leg.** A leg submits a new request only when none of its own commands is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING`. A request that ended `NOT_SENT` is resubmitted identically under the same key (admission records `DISPATCH_RETRY_REQUESTED`) until it ends otherwise; only then is the leg's next request computed.
* **When a `DESIRED` leg submits.** Only on `BarConfirmed`, `ObservationChanged`, `LedgerChanged`, `SquareOffTime` or that first evaluation, never on `Tick`; a tick can only start an exit. Each escalation reason is recorded once per subject until its condition clears (the `reconciliation_fact` key, [execution-domain spec](execution-domain-and-observations.md#reconciliation-events)). So a degraded system does not fill the ledger with repeated refusals or escalations.
* **Ticks are bounded.** Only the latest tick per position is kept between evaluations (A03-F2 allows replaceable updates to be coalesced). The tick exit test (`premium_exit`, below) is a few comparisons and runs on the writer thread; PRF-PRT-10 measures whether that ever needs to change.
* **Ladder.** The legacy `PremiumTrail` (`OA/src/core/framework/protection/trail.py`, standard library only), behind `ladder_version`; it is ported unchanged, in floats, to `kernel/trail.py` with `ladder_version` `premium@445eb116`. The kernel steps it as legacy's live host did ([Q-024](../decisions/owner-questions.md#q-024), [Q-025](../decisions/owner-questions.md#q-025), [SLICE-06 step 2](../plan/slices/SLICE-06-protection-and-safety.md#step-2--the-protection-loop)): no opposing score and no delta, bars built from consecutive closes, the trailed level `round(sl, 2)` then rounded up to the tick, and after a refused or failed modify only `sl` put back. `PROTECTION_DESIRED` records the resolved policy, `EXIT_STARTED`'s open state is derived on read, and a leg's level and quantity count completed commands on its live order by any principal ([SLICE-06 step 1](../plan/slices/SLICE-06-protection-and-safety.md#decisions)). Its parameters default to the approved shipped values in `TrailSettings` (`trail.py:113-149`; trailing on and live, POL-012: `config/defaults.yaml:73`, `:1832-1833`). A policy may override them; it never has to state them. This package binds only the premium ladder (the shipped `tracking_mode: premium`): a policy selecting `tracking_mode: spot` or `sl_method: key_level` (legacy `ladder()`, `trail.py:964-976`; `SpotTrail` keeps a stop on the underlying that cannot rest at the broker) refuses to load until a later slice specifies its exits. `ladder_state` is the complete serialized `TrailPosition` (`trail.py:153-205`), every field normalized (decimal strings for prices), so a restarted kernel ratchets exactly as an uninterrupted one. The ladder's behaviour is proved by retained-scope parity (PRF-PRT-08).
* **Gaps.** When a feed gap ends, protection records one `GAP_PEAK_RECORDED` for that gap. If the recovered peak exceeds the live peak, the record carries the would-be stop, computed as legacy does by replaying the gap's bars (`scripts/run_framework_live.py:5371-5403`, POL-013); otherwise it carries none. `ladder_state` is unchanged.
* **Continuity.** A leg is always evaluated with the `ladder_version` and `policy_version` recorded in its `PROTECTION_DESIRED`, never the current binding's (Combined-F6).

### Protective stop and tick exits (`kernel/protection.py`)

The retained exit function, `premium_exit`, tests three reasons on each tick in a fixed precedence: deep-OTM delta, then stop, then target (`trail.py:370-392`). The target system splits them by who executes each:

| Exit reason | Executed by | How |
|---|---|---|
| Stop | The broker | One resting stop order per position, moved by modifies as the ladder ratchets. The kernel does not also close on a stop tick |
| Target (under `stop_on_fill`), deep-OTM delta | The kernel, on a tick | Protection records `EXIT_STARTED` (reason `target` or `deep_otm_delta`, with the tick's price and time) once per position, then runs the **exit sequence**: cancel every resting protective order of the position, wait until each is observed terminal, then submit a market close of the owned quantity. Under `basket_at_plan` the target is a resting LIMIT order at the broker instead ([below](#basket-placement-basket_at_plan-kernelprotectionpy)). The record drives the sequence to the end, even if the price moves back or the kernel restarts. Under kill, protection submits nothing and escalates (reason `exit_under_kill`) |

* **Placement.** The refusing parameter `protection.placement` selects among `basket_at_plan`, `stop_on_fill` and `fill_priced`. The owner chose `basket_at_plan` for the first release ([Q-013 answer](../decisions/owner-answers-2026-10-27.md)): entry, SL-M stop and LIMIT target sent together at plan prices, as legacy (`OA/src/core/framework/execution/orders.py:155-214`); it is specified in full in [Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy). `stop_on_fill` is specified below because two cases use it whatever the setting: the legs of a multi-leg structure (legacy sends each structure leg alone, `OA/src/runtime/execution_gateway/structures.py:497` @445eb116) and the per-leg rules shared by both values (desire, trail modifies, confirmed level, retries, orphans). `fill_priced` (protection after the fill, priced from the executed price) remains a listed alternative; its exact rules are written only if the owner rebinds the setting ([LD-22](../legacy-divergence.md)).
* **Placement (`stop_on_fill`).** On the **first** `FILL` of an entry, protection creates the stop leg and submits `CloseRequest(order = stop(trigger, limit | None))` for the filled quantity, with the trigger from `Plan.protective_levels.stop` ([intent spec](intent-to-admission.md#contracts-contractsdecisionspy)) and the order type from `protection.stop_order_type` ([policy inputs](#policy-inputs)). Later fills raise the stop's quantity by a modify (admission allows a protective close up to the owned position). An ACK alone never starts protection.
* **Desire.** `PROTECTION_DESIRED` records `position_id`, `desired_level`, `desired_quantity`, `ladder_state`, `ladder_version`, `policy_version` and `view_id`, only when one of them changes. `desired_quantity` is the stop's desired order quantity: under `stop_on_fill` the owned quantity; under `basket_at_plan` the rule in [Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy).
* **Order quantity** of a leg is the quantity of its placement, replaced by the quantity of its latest `prot:` modify that carried a quantity and whose live order was then observed at that quantity. **Confirmed quantity** is the order quantity minus the fills recorded against the live order (ledger `FILL`), so a partly filled stop is not re-sent.
* **When a modify completes at a different broker level** (POL-014), the confirmed level is the broker's; the desire becomes the tighter of the newer desired level and the broker level, so a ratchet computed meanwhile is not lost.
* **Identity.** A protective leg is (`position_id`, role), with role `stop` or `target` (`stop_on_fill` has only `stop`). Its command keys are `"prot:<position_id>:<role>:<n>"`, where `n` is the number of that leg's admitted commands plus one; the leg's latest command has the highest `n`. An exit's market close uses `"prot:<position_id>:close:<n>"`. Each leg's derived state and confirmed quantity read only its own role's commands. Nothing stores the link: the commands are read by key prefix. The role names `stop`, `target` and `close` are reserved: a plan leg may not use them.
* **Retries.** On a `NOT_SENT` attempt or `RESOLVED_NEVER_REACHED`, protection resubmits the identical request with the same key at its next evaluation, and admission records `DISPATCH_RETRY_REQUESTED` ([dispatch spec](dispatch-and-coordination.md#eligibility-and-scheduling)). A transport-rejected modify is not resent at the same level; the next ratchet to a new level submits again.
* **Nothing automatic is re-placed.** Protection escalates, and does not retry, a stop the broker rejects or expires (reason `stop_rejected` or `stop_expired`) and a desired level already through the market (reason `level_through_market`). No approved rule covers automatic re-placement; legacy behaviour is characterized in TASK-S06-01.
* **Human principals win.** When a human principal cancels a protective leg, that leg ends with that cancel's command key as its reason; its `COMMAND_ADMITTED` is the record that a human took over the exit. An ended leg is never re-placed. A human's replacement resting stop is refused by conflict row 5 while another protective leg of the position (under `basket_at_plan`, the target) still rests; the human cancels it first.
* **Orphans.** When a protected subject's owned quantity is zero or below and its entry has ended (by any route: broker square-off, a human principal's close, a foreign trade, or an entry that never filled), protection cancels every remaining resting protective leg; under kill it escalates instead (reason `orphan_under_kill`).
* **No requests under a refusing condition.** While kill, a refusing hold or a latch would refuse the request, protection records the desire and submits nothing. A position that is unprotected or under-protected because of this (for example, fills arriving under kill) is escalated once (reason `unprotected_under_kill`).

**Derived leg state**, evaluated in this order; the first that holds wins:

| Order | State | Applies when |
|---|---|---|
| 1 | `ENDED` | The stop is observed terminal. The reason is derived on read: a human principal's cancel, protection's own exit cancel (the exit continues while `EXIT_STARTED` is open), a fill, or a broker reject or expiry |
| 2 | `PENDING` | The leg's latest command is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN`, or `WORKING` |
| 3 | `ORPHANED` | The entry has ended, the owned quantity is zero or below, and the leg still rests: protection cancels it (escalates under kill) |
| 4 | `CONFIRMED` | The latest command `COMPLETED`, and the confirmed level and quantity equal the desired ones |
| 5 | `DESIRED` | Anything else: no command yet, the latest ended `REFUSED` or `REJECTED`, or the confirmed level or quantity differs from the desire |

The `protection_state` index table holds the persisted `PROTECTION_DESIRED` fields and the open `EXIT_STARTED` record per position, built by `fold`.

**Classification** (A03-F5) is computed **on read**, from the stored rows, the latest observation's `as_of` and the reader's clock; it is never stored:

| Classification | Applies when |
|---|---|
| broker-held, observed | A stop order rests at its last confirmed level, and its row appeared in an orderbook observation no older than 60 s (derived from POL-021 for reporting; it gates nothing) |
| runtime-dependent | The target and deep-OTM delta exits, which only the kernel executes |
| uncertain | Anything else |

### Basket placement (`basket_at_plan`, `kernel/protection.py`)

This section is the authority for the first-release placement ([Q-013 answer](../decisions/owner-answers-2026-10-27.md)). It applies to **one-leg MARKET entries** (`structure_id` `single_long_option`, `PlanLeg.limit_price` `None`), which is every entry the legacy one-leg planner builds (`OA/src/core/framework/runtime/orchestrator.py:775-778` calls `orders.build`, whose default is MARKET, `OA/src/core/framework/execution/orders.py:98`). Admission refuses a one-leg plan with a limit price under `basket_at_plan` (`ADM-R13`, stage `placement`, reason `limit_entry_in_basket`), because a resting LIMIT buy with resting sells could sell before it buys. Structure legs keep `stop_on_fill`, as legacy. Every per-leg rule above applies unless a rule here replaces it.

**Terms.** The **entry window** runs from the entry's claim until the entry command has ended (its entry leg observed terminal, never reached, or transport-rejected). **Owned quantity `q`** is the subject's signed `position.owned_quantity` (0 before any fill); it falls with every protective fill and may go below zero (**overclosed**). A leg's order quantity, confirmed quantity and live order are as defined above; its **unfilled quantity** is its order quantity minus its recorded fills.

**What is sent.** At admission, `kernel.protection.basket_legs(plan, policy)` adds up to two protective legs to `PlanRef.protective_legs` ([ledger contract](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy)), as legacy `build_basket` (`orders.py:155-214`). The legs are evidence of what is sent: `Plan.plan_digest` does not cover them, and `basket_legs` recomputes them from the plan.

| Leg role | Order | Price | Quantity | Sent when |
|---|---|---|---|---|
| `stop` | SELL, `protection.stop_order_type` (`trigger_only` is SL-M, the first-release value; `trigger_with_limit` adds a limit price = trigger − the bound offset in rupees, tick-rounded down) | trigger = `Plan.protective_levels.stop`, tick-rounded by the planner (POL-015) | the entry leg's planned quantity | `protective_levels.stop` > 0 |
| `target` | SELL LIMIT | price = `Plan.protective_levels.target`, tick-rounded | the entry leg's planned quantity | `protective_levels.target` is set and > 0 |

* `instrument` and `product` are the entry `PlanLeg`'s. A plan with no stop sends the entry and target only, as legacy; protection escalates once at the first fill (reason `no_stop_planned`).
* The adapter sends the entry leg and the protective legs in **one** basket call and returns one `LegResult` per `PlanRef.legs` entry and then per `PlanRef.protective_legs` entry, in that order. Each acknowledged order ID is recorded in `broker_identity` under the entry's command key, with its `leg_role` when the validated join assigned one and `NULL` otherwise ([execution-domain spec](execution-domain-and-observations.md#openalgo-adapter-adaptersopenalgopy)).
* The protective legs carry no capital: check B5 counts only the entry leg, and for reservations the basket is a single-leg entry. Check B2 does not apply to them.
* The entry command completes on its entry leg alone; a protective leg still unresolved then can still be resolved later, from `COMPLETED` ([ledger](ledger-and-atomic-transaction.md#command-and-attempt-state-machine)). A fill on a `stop` or `target` order lowers `q` and never touches the entry's reservation or state.
* Two endpoint-contract items are characterized in TASK-S07-05 before live use: the order in which OpenAlgo places a basket's legs, and how the broker margins SELL legs that rest before the BUY fills.

**Derived state of each basket leg** (first match wins):

| Order | State | Applies when |
|---|---|---|
| 1 | `ENDED` | The live order is observed terminal; or the leg was never reached or transport-rejected (escalate `unprotected` once if `q` > 0); or the basket response rejected the leg (escalate `stop_rejected` once for the stop) |
| 2 | `PENDING` | The entry command is `ADMITTED`, `IN_FLIGHT` or `UNCERTAIN`; or the leg has an order ID whose role is not yet assigned; or `observed` is `None`; or one of the leg's own commands is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING` |
| 3 | `HELD_BACK` | A hold-bearing failure of this leg is escalated and its hold has not been released (no automatic request until a human releases the hold or acts on the leg) |
| 4 | `ORPHANED` | The entry window has ended, `q` ≤ 0, and the leg rests: cancel it (escalate `orphan_under_kill` under kill) |
| 5 | `CONFIRMED` | `observed` shows the order resting at the desired level and the desired order quantity |
| 6 | `DESIRED` | Anything else |

* **Desired level:** for `stop`, `PROTECTION_DESIRED.desired_level`; for `target`, the plan's target price, never trailed.
* **Desired order quantity:** during the entry window, the leg's current order quantity (no quantity request). After it, the leg's recorded fills plus `max(q, 0)`. This is the stop's `PROTECTION_DESIRED.desired_quantity` under this placement, re-recorded when it changes.
* A basket leg in `DESIRED` or `ORPHANED` submits a `ModifyRequest` or a `CancelRequest` on its live order, never a placement.
* **First desire.** At the first evaluation after the entry's outcome or resolution commits with the stop leg acknowledged or reached, protection records `PROTECTION_DESIRED` with `desired_level` = the plan's stop, `desired_quantity` = the stop's order quantity, `view_id` = the plan's `view_id`, and `ladder_state` seeded as legacy seeds `TrailPosition` at entry (`entry_premium` = the plan premium the basket was priced from, `Plan.entry_facts.entry_premium` ([SLICE-04 step 3](../plan/slices/SLICE-04-intent-to-admission.md#the-plan-it-returns)); the exact seed is characterized in TASK-S06-01).

**The quantity rule.** Level-triggered: after the entry window, and while no `EXIT_STARTED` is open for the subject, at each evaluation (on `LedgerChanged`, a changed `observed`, or the first evaluation) each basket leg in `DESIRED` or `ORPHANED` submits:

| Condition | Request | Legacy |
|---|---|---|
| `q` ≤ 0 | cancel the leg: the **one-cancels-other** step when the other leg's fill closed the position, the orphan rule when the entry never filled | `run_framework_live.py:4588-4660` (`_cancel_resting_siblings`) |
| unfilled quantity > `q` > 0 | modify the leg's quantity to a new **total** = its recorded fills + `q` | new: keeps each leg within `q` |

* `ModifyChanges.quantity` is the new total order quantity, OpenAlgo's modify semantics; TASK-S07-05 confirms it at the source. Admission check B2 and dispatch row 6 judge it in total terms ([intent spec](intent-to-admission.md#b2-effect)).
* During the entry window no quantity request is made: both legs keep the planned quantity, as legacy sizes them. A protective fill inside the window is acted on when the window ends.
* **Invariant P-1.** After the entry window, once the leg's requests have completed, each resting leg's unfilled quantity is at most `max(q, 0)`. Two sells of up to `q` can still rest together (stop and target); a filled sell beyond `q` is the race below.
* **Known exposure.** During the entry window both legs rest at the planned quantity while `q` is lower, and after it two sells of `q` rest together. Both are legacy's accepted cost of the basket ([Q-013 answer](../decisions/owner-answers-2026-10-27.md)).
* **Conflict relation.** Conflict row 2 never blocks these requests: a cancel or a quantity-reducing modify of a protective order only removes sale quantity ([Conflict relation](#conflict-relation-kernelsafetypy)).

**When a leg's request fails.** Each outcome is classed as follows:

| Outcome of the leg's cancel or modify | Class | What follows |
|---|---|---|
| Admission refusal `ADM-R05`, `ADM-R12`, `PRT-R06`; `NOT_SENT` | transient | Retried as the one-request rule allows (a `NOT_SENT` identically), until the transient condition has lasted `reconciliation.working_escalation_secs` from the first refusal's event time; then hold-bearing |
| `ADM-R07` because the live order is already terminal; or completion with `target_terminal` | success | The leg is `ENDED` |
| `PRT-R01` (kill) | kill | Not resubmitted; `orphan_under_kill` once (one reason for the leg, whichever path found it); the owner or a delegated principal may cancel it |
| `PRT-R04` (a hold refuses automatic actions, under `safety.hold_automatic_actions: refused`) | held | Not resubmitted until the hold is released; escalated `sibling_held` once |
| `REJECTED`; any other refusal; `UNCERTAIN` or `WORKING` beyond `reconciliation.working_escalation_secs` from its outcome's event time (the persisted-deadline rule of the [clock contract](sessions-authority-lifecycle.md#clock-contract-contractsclockpy-adaptersclockspy)) | hold-bearing | Escalated `sibling_failed` and held (below); the leg then reads `HELD_BACK` |

This retries transient refusals, which legacy never did (`run_framework_live.py:4615-4616`), and holds on every lasting failure, as legacy did after the 15 October 2026 incident (`:4612-4620`).

**The race (overclose).** If the other leg fills before its cancel or modify lands, `q` goes below zero. Protection then escalates `overclose` (payload `excess_quantity` = −`q`) and holds. Nothing is sent to buy the excess back: no approved rule covers it, as legacy `_report_overclose` (`run_framework_live.py:5631-5660`). Automatic protection continues under the hold (`safety.hold_automatic_actions: allowed`, [Q-001 answer](../decisions/owner-answers-2026-10-27.md)).

**Holds from this section.** `sibling_failed` and `overclose` are hold reasons of their own. Each escalation is recorded once per subject, reason and **episode** (the number of times that hold reason has been released for the strategy), so a recurrence after a release is escalated and held again. In the same decision as its escalation, `kernel.safety` records `HOLD_ENGAGED` for that reason only if it is not already engaged for the strategy; the escalation is recorded either way. A human principal releases one reason at a time through `safety.release_hold` ([Kill and holds](#kill-and-holds-kernelsafetypy)); `HELD_BACK` legs are recomputed after the release.

**Roles not yet assigned.** An order ID the send's validated join could not assign stays in `unassigned_order_ids` with a `NULL` role; reconciliation assigns it later by the same join on a fresh complete orderbook (`LEG_ASSIGNED`), and fills on it wait for the assignment ([execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)). Until every protective leg that has an order ID has its role, protection submits nothing for the subject and escalates once (reason `protective_roles_unassigned`).

**The trail.** The ladder moves only the `stop` leg, by `ModifyRequest` (key `prot:<position_id>:stop:<n>`, `broker_order_id` = the stop's live order, `changes.trigger_price` = the desired level, and `changes.quantity` only when the quantity rule needs a change at the same time). The `target` leg is changed only by the quantity rule.

**Exits.** The target exit is the resting LIMIT order; protection runs no target tick exit. The deep-OTM delta exit and the session-close square-off run the exit sequence: cancel both resting legs (each under its own `prot:` key), wait until both are `ENDED`, then, only if `q` > 0, submit the market close of `q` (`prot:<position_id>:close:<n>`). While `EXIT_STARTED` is open the quantity rule is suspended. `EXIT_STARTED` closes when `q` ≤ 0 and every protective leg is `ENDED`.

**Classification** (A03-F5): each resting leg is broker-held when `observed` shows it at its desired level; the deep-OTM delta exit stays runtime-dependent.

**Crash points:**

| ID | Crash or failure | Durable state | Required behaviour |
|---|---|---|---|
| CP-B1 | After the entry outcome commits (basket acknowledged), before protection evaluates | Outcome with three leg results; order IDs with roles in `broker_identity` | On restart the subject is evaluated from the outcome and observations; nothing is resent |
| CP-B2 | The basket call timed out (`ambiguous`) | Entry command `UNCERTAIN`; every leg unresolved | With no verified tag (the default), each leg stays unresolved and escalated (`untagged_timeout`) until a human principal resolves it per leg with `lifecycle.resolve_attempt` ([execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)); conflict row 1 holds the underlying meanwhile; then the rules above apply (an entry leg never reached with protective legs reached is the orphan case) |
| CP-B3 | After a protective fill is recorded, before the other leg's request is admitted | `FILL` committed | On restart the quantity rule submits the request once |
| CP-B4 | With a leg's request `UNCERTAIN` | Request unresolved | No new request for that leg (one request at a time); reconciliation resolves it, or the hold-bearing timeout applies; a later fill of that leg is the race |
| CP-B5 | During the exit sequence with one leg cancelled and the other not | `EXIT_STARTED` open | The sequence resumes: cancels the remaining leg, waits for both, then closes if `q` > 0 |
| CP-B6 | Between detecting an overclose or a hold-bearing failure and recording it | `FILL` or the request's outcome committed | The escalation and the hold are one decision; on restart the condition is re-derived from the ledger and recorded once for its episode |

### Structures (`kernel/protection.py`)

A multi-leg structure entry creates one position per leg (ledger `position` row). Until the owner adopts a per-leg level rule, no structure entry is admitted ([Q-020 answer](../decisions/owner-answers-2026-10-27.md): the planner refuses `structure_protection_unbound`). Each leg gets its own stop leg under `stop_on_fill` rules, whatever `protection.placement` says (legacy sends each structure leg alone), and exits by the rules above; nothing is evaluated structure-wide beyond them. The legacy structure actions (`OA/src/core/framework/protection/structures.py`) map as follows:

| Legacy action | Target system |
|---|---|
| `stop`, `trail` | The leg's resting stop and its modifies |
| `target` | The target tick exit |
| `cancel`, `close` | `CancelRequest`, `CloseRequest` through admission |
| `retain_known_protection` | POL-014: the broker's level is kept after a timed-out or rejected modify |
| `replace_protection` | Not automatic: escalated (no approved re-placement rule) |
| `reduce_short` | Not built: the package admits buy legs only |
| `hold` | The safety hold (`HOLD_ENGAGED`) |

### Kill and holds (`kernel/safety.py`)

| Event | Recorded by | Payload | Guard |
|---|---|---|---|
| `KILL_ENGAGED` / `KILL_RELEASED` | A human principal with `kill_engage` / `kill_release` | `principal`, `reason` | Engage only when released; release only when engaged |
| `HOLD_ENGAGED` / `HOLD_RELEASED` | Engaged by a human principal with `hold_engage` (reason `operator`), by `kernel:recovery` (reason `recovery`, the legacy recovery-hold trigger characterized in TASK-S06-03), or by `kernel.safety` for protection (reasons `overclose`, `sibling_failed`, [Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy)). Released by a human principal holding `hold_release`, through `safety.release_hold(principal, strategy, released_reason, justification)`, one reason at a time | Engaged: `strategy`, `reason`, `principal`. Released: `strategy`, `released_reason`, `justification`, `principal` | Engage only when that reason is not engaged; release only when it is |

* Kill applies to the whole desk and does not expire at session close (POL-002). A strategy is **held** while at least one reason is engaged.
* Each takes effect at its event's ledger sequence ([dispatch spec](dispatch-and-coordination.md#holds-kills-and-latches-against-in-flight-requests)).

### Permission matrix (`kernel/safety.py`)

| Condition | Entry | Cancel | Modify | Close | Source |
|---|---|---|---|---|---|
| Kill engaged | refused | human principal with the grant, owned unfilled order | refused | human principal with the grant, a non-resting close of an owned position; a new resting close is refused | POL-002, as superseded by the [Q-014 answer](../decisions/owner-answers-2026-10-27.md) |
| Daily-loss latch tripped (this session, this strategy) | refused | not restricted by this condition | not restricted | not restricted | POL-004 |
| Strategy held | refused | human principal: not restricted; automatic: per `safety.hold_automatic_actions` (first release `allowed`) | same as cancel | same as cancel | POL-003 (`sender.py:293-296`) |

* An action matching no restricting row is not restricted by this table; grant, conflict and freshness checks still apply.
* "Human principal with the grant" means a command from the owner, or from a delegated human principal holding the named grant action (`cancel` or `close`), for exactly this action and target, with fresh revalidation. The owner's 2026-10-27 decision ([Q-014 answer](../decisions/owner-answers-2026-10-27.md)) widens legacy's owner-only `OwnerCommand` (`OA/src/core/framework/execution/sender.py:281-296`) and supersedes the "authenticated owner" wording of POL-002; kernel principals never qualify. "Unfilled" follows POL-002's wording; whether a partly filled order counts is characterized from `sender.py` in TASK-S05-07.
* `safety.hold_automatic_actions` (`allowed` or `refused`) is a refusing parameter. The first release binds `allowed`, the legacy behaviour (`sender.py:293-296`; [Q-001 answer](../decisions/owner-answers-2026-10-27.md)).
* **Strategy of an action.** Every command records a `strategy` (ledger `command_identity`): an entry's comes from its intent; a cancel, modify or close takes the strategy of the position or order it targets.
* **Several conditions.** Admission check A4 tests only the checks that guard the action, in the order: inert checks (`PRT-R06`), kill (`PRT-R01`), hold (`PRT-R04`), latch (`PRT-R03`); the first that refuses gives the code. Dispatch row 5 uses the same order without the inert test, because an inert check makes a command wait at dispatch eligibility instead. An AI-management pause is not a matrix condition; `kernel.policy` owns it.

### Daily-loss latch (`kernel/safety.py`)

* **Input.** `kernel.safety` computes session P&L itself, as legacy does next to the latch (`OA/src/runtime/session_state.py:171`):

  ```text
  session_pnl(strategy, session_id, now) -> SessionPnl(pnl, observation_digest, as_of) | Unavailable
  ```

  `pnl` sums, over the positions owned by the strategy in the session, the broker-reported P&L field the legacy code reads, or realised plus mark-to-market where the endpoint splits them; which fields the deployed endpoint carries is characterized in TASK-S06-04 against the endpoint contract. A position belongs to the strategy of its entry command (the ledger `position` row). It is gross of estimated charges, as legacy (`loss_latch.py:11-14`), and `Unavailable` when the position observation is incomplete or lacks the field. A stale observation is not a latch state: reconciliation ignores it, and admission check B1 refuses entries on it (`ADM-R05`).
* **Budget.** `risk.max_daily_loss_amount` is a refusing parameter; the first release binds `"3600.00"` for BuyerEdge ([Q-002 answer](../decisions/owner-answers-2026-10-27.md)). If `risk.max_daily_loss_pct` and `risk.capital` are also bound, the budget is the smaller of the amount and that percent of capital (legacy `budget()`, `loss_latch.py:167-177`).
* **When.** `kernel.safety` evaluates the latch on every new fresh position observation, and only then. Admission check A4 reads the tripped state from `safety_state`; admission never trips the latch.
* **Trip.** The first P&L at or below −budget records `LOSS_LATCH_TRIPPED` (`strategy`, `session_id`, `pnl`, `budget`, `observation_digest`). An already-tripped latch keeps its first trip (`trip`, `loss_latch.py:512`). Entries for that strategy are refused for the rest of the session.
* **Unlock.** The owner or a delegated human principal holding `latch_unlock` ([Q-014 answer](../decisions/owner-answers-2026-10-27.md)), with a reason, records `LOSS_LATCH_UNLOCKED` (only when tripped). As in legacy, the next P&L still at or below −budget trips it again (`unlock`, `loss_latch.py:576-583`).
* **Replay** has its own latch in its own ledger (POL-006).

### Conflict relation (`kernel/safety.py`)

* An **exposure group** is a position together with its resting protective orders: the stop, and under `basket_at_plan` also the target.
* An **unresolved effect** is a command in `IN_FLIGHT` or `UNCERTAIN`, or in `WORKING` before its completion is observed. A modify or cancel whose target is observed terminal for another reason completes (reason `target_terminal`, [ledger verb rules](ledger-and-atomic-transaction.md#command-and-attempt-state-machine)), so it never freezes a group. A placed stop is a group member, not an unresolved effect. The group's own entry command is not an unresolved effect for row 2: it only adds owned quantity, and admission check B2 caps a protective close at the owned quantity, so the stop can be placed on the first fill. A request never conflicts with its own command.
* Rows are tested in order; the first matching row decides; a pair matching no row does not conflict.

| # | New action | Unresolved effect or state | Conflicts? | Source |
|---|---|---|---|---|
| 1 | Entry | On the same account and underlying: any open position, any position with a protective order not observed terminal, or any unresolved entry | yes | POL-007, with the [Q-017 answer](../decisions/owner-answers-2026-10-27.md) |
| 2 | An action on group G that could add sale quantity or remove G's stop, except: a cancel of a protective order when `q` ≤ 0; a modify that lowers a protective order's total to its recorded fills plus `q` (redundant: lowering adds no sale quantity; a raise is never excepted, [Q-021](../decisions/owner-questions.md#q-021)); a human principal's cancel of a protective order | Any unresolved effect on any member of G | yes | ATA-04 shared exposure (`README.md:454`) |
| 3 | A non-resting close of position P | Any of P's resting protective orders not observed terminal | yes; cancel them first | POL-010 sequence; POL-008 |
| 4 | Protective action on owned exposure | Unresolved entry elsewhere on the same account | per `protective_independence`: `same_group_only` (no conflict; first-release value, [Q-004 answer](../decisions/owner-answers-2026-10-27.md)) or `account_wide` (conflict) | ATA-04; [Q-004 answer](../decisions/owner-answers-2026-10-27.md) |
| 5 | A new resting close of position P, from any principal | P already has a resting protective order not observed terminal | yes (Goal 4) | POL-008 |

* Capacity effects of unresolved commands are handled by reservations and capacity (D16), not by this relation.
* **Version.** The relation's version is computed in code as the digest of this rule set plus the bound `protective_independence` value. Admission records it; it is evidence only, and a change after admission is not a refusal.
* Admission check B3 refuses an action the relation forbids when it is admitted. After admission, the coordinator applies the current relation as an eligibility condition, so a later conflict makes the command wait.

### Session-close exit (`kernel/protection.py`)

This section is the authority for the session-close exit and for kill during it.

* With `square_off`, at `SquareOffTime` protection records `EXIT_STARTED` (reason `square_off`, cause `session_id`) once per position and runs the exit sequence.
* The sequence (for any exit reason) continues after `SESSION_CLOSED` if it has started (a close needs no open session) and after a restart. A restart after the square-off time and before `SESSION_CLOSED` starts it. A refused or conflicting step is retried at the next evaluation.
* Under kill, protection submits nothing and escalates the position (reason `square_off_under_kill`), whether kill was engaged before or partway through; the broker's own square-off remains the backstop.

### Safety-check visibility (`kernel/safety.py`)

| Check | Inert when | Guards |
|---|---|---|
| Kill, hold | Never (state is in the ledger index; a damaged index is `LED-R05`, which stops all writes) | The actions their rows restrict |
| Latch | `session_pnl` is `Unavailable` | The strategy's entries |
| Conflict | Never (its inputs are ledger index tables and a bound `protective_independence`; a damaged index is `LED-R05`) | The actions its rows forbid |

A change of state is recorded as `SAFETY_CHECK_STATE` (`check`, `scope`, `state`, `reason`), only on change. An inert check refuses the actions it guards at admission; at dispatch eligibility the command waits ([dispatch spec](dispatch-and-coordination.md#eligibility-and-scheduling)). It never passes them silently (LD-03). Stale observations are admission check B1's and dispatch row 6's, not a safety-check state.

### Refusal codes (`kernel/safety.py`)

| Code | Meaning |
|---|---|
| `PRT-R01` (`kill`) | Kill forbids this action for this actor (actor recorded) |
| `PRT-R03` (`latched`) | Entry refused by the daily-loss latch |
| `PRT-R04` (`held`) | Action refused by a hold |
| `PRT-R06` (`check_inert`) | A guarding check is inert |
| `PRT-R10` (`conflict`) | The conflict relation forbids the action now |

Unused codes, kept so numbers are never reused:

| Code | Why unused |
|---|---|
| `PRT-R02` | One kill code covers every actor |
| `PRT-R05` | A paused entry is `ADM-R11` |
| `PRT-R07` | A damaged index is `LED-R05` |
| `PRT-R08` | One attempt per leg is conflict row 2 |
| `PRT-R09` | An unbound budget refuses at load |

### Event catalogue

Every event below is committed through `transact` and folded by the ledger's `fold`.

| Event | Recorded by | Payload | Index table |
|---|---|---|---|
| `PROTECTION_DESIRED` | `kernel.protection` | `position_id`, `desired_level`, `desired_quantity`, `ladder_state`, `ladder_version`, `policy_version`, `view_id` | `protection_state` |
| `GAP_PEAK_RECORDED` | `kernel.protection` | `position_id`, `view_id`, `gap_started_at`, `gap_ended_at`, `live_peak`, `recovered_peak`, `would_be_stop` (or none) | none (evidence only) |
| `EXIT_STARTED` | `kernel.protection` | `position_id`, `reason` (`square_off`, `target`, `deep_otm_delta`), `cause` (the tick's `price` and `at`, or the `session_id`) | `protection_state` (open while `q` > 0, a live protective order rests, or a placement or cancel is pending; [SLICE-06 step 2](../plan/slices/SLICE-06-protection-and-safety.md#step-2--the-protection-loop)) |
| `KILL_ENGAGED`, `KILL_RELEASED` | `kernel.safety`, on a human principal's command | `principal`, `reason` | `safety_state` |
| `HOLD_ENGAGED`, `HOLD_RELEASED` | `kernel.safety`, on a human principal's command or `kernel:recovery` | `strategy`, `reason`, `principal` | `safety_state` |
| `LOSS_LATCH_TRIPPED` | `kernel.safety` | `strategy`, `session_id`, `pnl`, `budget`, `observation_digest` | `safety_state` |
| `LOSS_LATCH_UNLOCKED` | `kernel.safety`, on a human principal's command | `strategy`, `session_id`, `principal`, `reason` | `safety_state` |
| `SAFETY_CHECK_STATE` | `kernel.safety` | `check`, `scope`, `state`, `reason` | `safety_state` |

Protection also records the ledger's `RECONCILIATION_ESCALATED` ([ledger catalogue](ledger-and-atomic-transaction.md#event-catalogue)) with the reasons named above: `stop_rejected`, `stop_expired`, `level_through_market`, `orphan_under_kill`, `exit_under_kill`, `square_off_under_kill`, `unprotected_under_kill`, and for basket placement `unprotected`, `no_stop_planned`, `overclose` (with `excess_quantity`), `sibling_failed`, `sibling_held`, `protective_roles_unassigned`. `overclose` and `sibling_failed` are committed with their `HOLD_ENGAGED` (when not already engaged) in one decision and are keyed by subject, reason and episode. The subject is the `position_id`; each is recorded once per subject and reason. [SLICE-06 step 2](../plan/slices/SLICE-06-protection-and-safety.md#step-2--the-protection-loop) adds `ladder_unseeded`, `protection_ended_external`, `square_off_unscheduled`, `square_off_entry_working`, `exit_close_rejected`, `exit_close_incomplete` and `unprotected_under_hold`, and records each once per position until step 3's episodes.

## Failure modes and crash points

| ID | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-P1 | Crash after `PROTECTION_DESIRED`, before admission | After the advance to `OPERATING`, the leg reads `DESIRED`; one request is submitted | PRF-PRT-03 |
| CP-P2 | Crash with the modify `UNCERTAIN` | CUJ-PRT-2 | PRF-PRT-03 |
| CP-P3 | Crash during an exit sequence (square-off, target or delta) | `EXIT_STARTED` makes it resume, not restart, and the close is still sent after the stop ends | PRF-PRT-07 |
| CP-P4 | Crash between a later fill and the quantity modify | The quantity mismatch reads `DESIRED`; the modify is submitted | PRF-PRT-03 |
| F-P5 | Kernel down or not `OPERATING` | The broker stop remains; tick exits do not run; reporting is the supervisor's | PRF-PRT-06 |
| F-P6 | Feed gap | One gap-peak record per gap (POL-013) | PRF-PRT-02 |
| F-P7 | Session P&L field missing, or the position observation incomplete | Latch check inert; entries refused with `PRT-R06` | PRF-PRT-05 |
| F-P8 | An older observation arrives after a newer one | It changes nothing (the observation loop ignores an older `as_of` per order; the ledger state guards refuse a regression) | PRF-PRT-09 |
| F-P9 | The stop order fills while a modify of it is in flight | The modify completes with `target_terminal`; the group is free | PRF-PRT-11 |
| F-P10 | The broker rejects or expires the stop, or the desired level is already through the market | Escalated; nothing re-placed | PRF-PRT-01 |
| F-P11 | A modify is rejected by transport | Not resent at the same level; the next ratchet to a new level submits again | PRF-PRT-01 |
| F-P12 | The position goes to zero under kill with its stop still resting | Escalated (`orphan_under_kill`); not cancelled | PRF-PRT-04 |
| F-P13 | Kill engaged partway through the exit sequence or square-off | Nothing further is sent; escalated | PRF-PRT-07 |
| F-P14 | Entry fills arrive under kill | The stop is not placed or raised; escalated once (`unprotected_under_kill`) | PRF-PRT-04 |
| CP-B1…CP-B6 | Basket placement crash points ([Basket placement](#basket-placement-basket_at_plan-kernelprotectionpy)) | As tabled there | PRF-PRT-03, PRF-PRT-07 |
| F-P15 | Basket: the entry leg is rejected, never reached, or ends unfilled while protective legs rest | Both protective legs cancelled (escalated under kill) | PRF-PRT-01 |
| F-P16 | Basket: a protective leg partly fills, or the entry ends partly filled | After the entry window, each leg is modified to its filled quantity + `q` | PRF-PRT-01 |
| F-P17 | Basket: one protective leg fills the whole position | The other leg is cancelled (one-cancels-other) | PRF-PRT-01 |
| F-P18 | Basket: both protective legs fill (race) | `overclose` escalated; hold (reason `recovery`); nothing sent to buy back | PRF-PRT-01 |
| F-P19 | Basket: a leg's cancel or modify fails non-transiently, or a transient refusal lasts beyond the escalation time | `sibling_failed` escalated with a hold in one decision; the leg reads `HELD_BACK` | PRF-PRT-01 |
| F-P20 | Basket: a leg's cancel is due under kill | Not sent; `orphan_under_kill` once | PRF-PRT-04 |
| F-P21 | Basket: the stop leg is rejected in the basket response, or rejected or expired by the broker after acknowledgement | `stop_rejected` once; nothing re-placed; the target still rests | PRF-PRT-01 |
| F-P22 | Basket: order IDs returned without roles | Fills on them wait; `LEG_ASSIGNED` on a later fresh orderbook; until every leg with an order ID has its role, nothing submitted and `protective_roles_unassigned` once | PRF-PRT-01 |
| F-P23 | Basket: a one-leg plan with a limit price | Admission refuses (`ADM-R13`, stage `placement`, reason `limit_entry_in_basket`) | PRF-PRT-01 |
| F-P24 | Basket: a second overclose or failure for the same strategy while its hold is engaged | Escalation recorded for the new episode or subject; no second `HOLD_ENGAGED` | PRF-PRT-03 |
| F-P25 | A position closed by a square-off, a human close or a foreign trade while its protective order rests | The position stays a protected subject until the order is `ENDED`; the order is cancelled (escalated under kill); a new entry on the same account and underlying is refused (`PRT-R10`, conflict row 1) until then | PRF-PRT-01, PRF-PRT-04 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| A target or deep-OTM exit needs cancel, observation, then close: several observation cycles in a fast market | The broker stop holds throughout; whether to turn the stop marketable instead (modify its trigger through the market) is characterized in TASK-S06-01 and recorded as a decision before use |
| Under kill, a stop can exceed a position that changed | Escalated to the owner, who may cancel it (POL-002) |
| Broker P&L rows are per instrument and per broker day; sequential sharing of a contract by two strategies, or a session that is not the broker day, misattributes P&L | The slot rule prevents concurrent sharing; the field basis is characterized in TASK-S06-04; a mismatch makes the latch inert rather than wrong |
| A missing P&L field leaves the latch inert and refuses all entries | Characterized before production; the refusal is visible as `SAFETY_CHECK_STATE` |
| Tick load on the writer thread | Latest-tick coalescing; ticks never submit a `DESIRED` leg; PRF-PRT-10 measures queue delay |
| No automatic re-placement after a broker reject | Escalated at once; any re-placement rule is an owner decision |
| Under `basket_at_plan`, two resting sells exist per position, at the planned quantity during the entry window and at `q` after it, and both can fill before the sibling's request lands | The level-triggered quantity rule shrinks or cancels the sibling; the race is detected (`overclose`), escalated and held in one decision, as legacy; no automatic buy-back |
| Under `basket_at_plan`, SELL legs rest before the BUY fills | MARKET entries only; leg ordering and the broker's margin treatment of early SELL legs are endpoint-contract items in TASK-S07-05 |
| Under `basket_at_plan`, protective legs are priced from the plan, not the fill, so a MARKET entry that fills away from the plan price is protected at plan levels | The owner's chosen trade for one round trip (legacy `orders.py:177-186`); `fill_priced` remains the alternative setting |
| Security: kill release, latch unlock, pause clear and the cancel or close allowed under kill are escape hatches for the owner and delegated human principals ([Q-014 answer](../decisions/owner-answers-2026-10-27.md)) | Each needs its named grant action ([sessions spec](sessions-authority-lifecycle.md)), a reason, and fresh revalidation; kernel principals hold none of `kill_release` or `latch_unlock` |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Ladder version and parameters | Bound policy (POL-012) | The approved shipped values in `TrailSettings`; trailing on; only the premium ladder loads |
| Session-close switch and `square_off_time` | Bound policy (POL-010) | Omitted switch: `square_off`; omitted time: 15:13; a misspelt switch refuses to load |
| `risk.max_daily_loss_amount` (optional `risk.max_daily_loss_pct`, `risk.capital`) | Bound policy; [Q-002 answer](../decisions/owner-answers-2026-10-27.md) | None: refusing; first release binds `"3600.00"` (BuyerEdge) |
| `safety.hold_automatic_actions` | [Q-001 answer](../decisions/owner-answers-2026-10-27.md) | None: refusing; first release binds `allowed` |
| `protective_independence` | [Q-004 answer](../decisions/owner-answers-2026-10-27.md) | None: refusing; first release binds `same_group_only` |
| `protection.placement` | [Q-013 answer](../decisions/owner-answers-2026-10-27.md) | None: refusing; first release binds `basket_at_plan` |
| `protection.stop_order_type` (`trigger_only` or `trigger_with_limit`, with its limit offset) | Bound policy; [Q-013 answer](../decisions/owner-answers-2026-10-27.md); legacy sends SL-M, that is `trigger_only` (`orders.py:170`, `:209`) | None: refusing; first release binds `trigger_only` |

A **misspelt** `lifecycle.session_close` value refuses to load, like every other unknown value (A02-F2, `README.md:903`). The owner's X-004 decision of 2026-10-27 ([answers](../decisions/owner-answers-2026-10-27.md)) supersedes POL-010's "misspelt means `square_off`" clause; an omitted value still means `square_off`.

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
| `stop_on_fill` for one-leg entries | One resting sell instead of two, and no race; but a different unprotected window and exit-slippage profile than legacy. The owner kept the legacy basket ([Q-013 answer](../decisions/owner-answers-2026-10-27.md)) |
| `fill_priced` | Protection priced from the executed price (the earlier BuyerEdge baseline, `orders.py:177-186`); one more round trip after the fill. Not chosen for the first release |
| Buy back an overclose automatically | No approved rule; legacy holds and alerts instead (`run_framework_live.py:5631-5660`) |
| Broker OCO or bracket orders | Not proven on the OpenAlgo endpoints in use; an endpoint-contract item for later |
| Place protection only when the entry completes | Leaves partial fills unprotected |
| Automatic re-placement after a broker reject | No approved rule; it would loop on a gap through the trigger |
| Store the classification in `fold` | It depends on the clock, so a rebuilt fold would disagree with the stored rows |

## Proofs

Class **T** is an automated test; **M** is a measurement; **P** is a parity comparison run by a script over recorded days.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-PRT-01 | T | `tests/unit/test_protection_states.py` | Under `basket_at_plan`: the basket carries the entry, an SL-M stop and a LIMIT target at plan prices and planned quantity; a missing stop escalates `no_stop_planned`; F-P23; each basket derived-state row in order, including `PENDING` before `ORPHANED` and `HELD_BACK`; one request at a time per leg (no second request while one is unresolved; a `NOT_SENT` request resubmitted identically); interleaved stop and target commands keep separate states; the trail modifies only the stop; no quantity request during the entry window; the quantity rule's two rows, with totals (fills + `q`) that pass B2; each row of the failure-class table; F-P15…F-P22, F-P25; P-1 after the entry window; a protective fill lowers `q` and never the entry's reservation; a replacement order ID keeps the leg; the exit sequence with `q` ≤ 0 sends no close and closes `EXIT_STARTED`; a structure leg uses `stop_on_fill`. Under `stop_on_fill`: each derived-state row in order; placement on the first fill while the entry is still `WORKING`, and quantity raised on later fills; one resting stop per position. Both: a partly filled stop is not re-sent; a human principal's cancel ends the leg; orphans cancelled; F-P10 and F-P11; the structure-action map | ACK is treated as confirmation, P-1 fails after the entry window, two requests for one leg are live at once, the other leg survives a full fill, a lasting failure goes unheld, or anything is re-placed or bought back automatically |
| PRF-PRT-02 | T | `tests/unit/test_protection_states.py` | Ladder cases from POL-012/013/015 with default parameters (84.805 rounds to 84.85); one gap-peak record per gap; `premium_exit` precedence; a restart mid-ratchet resumes from the full `ladder_state`; a spot or key-level policy refuses to load | a gap moves the stop |
| PRF-PRT-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-P1, CP-P2, CP-P4, CP-B1…CP-B6; F-P24 (a second overclose while the hold is engaged records its escalation without a second hold; a recurrence after a release escalates and holds again) | a restart resends, an overclose is recorded without its hold, or a decision is refused because the hold is already engaged |
| PRF-PRT-04 | T | `tests/unit/test_safety_matrix.py` | Every matrix cell and the code order, for the owner and for a delegated human principal with and without the grant; CUJ-PRT-3; F-P12; F-P14; F-P20; conflict row 5 refuses a human principal's resting close while any protective leg rests; conflict row 1 refuses an entry while a closed position on the same account and underlying has a protective order not observed terminal, and admits it once that order is observed terminal (Q-017); the `safety.hold_automatic_actions` cells run both values | a cell is skipped |
| PRF-PRT-05 | T | `tests/unit/test_safety_matrix.py` | An inert latch refuses entries; the latch trips once, keeps its first trip and re-trips after unlock while P&L stays below; unlock needs a human principal holding `latch_unlock` and a reason | a check passes silently |
| PRF-PRT-06 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-1 with the worker stopped; F-P5 with the kernel frozen | protection depends on the worker |
| PRF-PRT-07 | T | `tests/integration/test_protection_kernel.py` | CUJ-PRT-4, CP-P3, CP-B5 and F-P13; the exit sequence cancels every resting protective leg before the close; a `stop_on_fill` target tick exit runs to the close even when the price moves back; an omitted switch gives `square_off`; a misspelt value refuses to load (X-004 decision) | the close is sent before the stop is terminal |
| PRF-PRT-08 | P (retained scope) | `scripts/compare_parity.py` | Recorded days: target ladder moves equal legacy moves (POL-012 retained scope, A08-F3, LD-16) | moves differ outside listed corrections |
| PRF-PRT-09 | T | `tests/unit/test_protection_states.py` | F-P8; every record cites the `view_id`, tick, observation digest or session event it came from; repeated triggers in a degraded state record no repeated refusal or escalation; the same recorded inputs give the same records in live and replay | arrival order is used, or a record has no attributable input |
| PRF-PRT-10 | M | `tests/integration/test_protection_kernel.py` | Evaluation time and writer-queue delay of financial transitions under recorded tick rates, recorded with the workload as a baseline (A09-F4) | no baseline is recorded with its workload, or a later run exceeds the baseline by more than the tolerance stated in it |
| PRF-PRT-11 | T | `tests/unit/test_conflict_relation.py` | ATA-04 matrix: uncertain entry, modify and cancel against later actions, same and different targets and accounts, stalled transport; F-P9; both `protective_independence` values, labelled pending; in SLICE-05 the stop is a synthetic resting order on the stub position | a blanket or per-target-only rule |
| PRF-PRT-12 | T | `tests/recovery/test_release_continuity.py` | A leg created under ladder `v1` keeps `v1` and its policy version after a binding to `v2`; a release that cannot run `v1` is refused activation while the leg lives ([configuration spec](configuration-artifacts-release.md)) | the new ladder is applied |
| PRF-PRT-13 | T | `tests/unit/test_protection_states.py` | Each classification row; the 60 s observation-age boundary; the classification is absent from every stored row and recomputed by a reader with a later clock | the classification is stored, or an older observation reads as broker-held |
| PRF-PRT-14 | T | `tests/contracts/test_capabilities.py` | The supervisor composition cannot construct a sending adapter, open the authority socket for writing or read a broker key | the supervisor can send |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-05 | REQ-PRT-009 with a stub `position` row and a synthetic resting stop from synthetic fills; kill and hold events and their matrix rows | PRF-PRT-04 (kill and hold rows), PRF-PRT-11 |
| SLICE-06 (after SLICE-05 and SLICE-07) | REQ-PRT-001…008, -010, -012…015; extends `contracts/market.py` with fixture fields for the feed-gap interval and its bars and for `Tick.delta`, whose real producer is the market-data spec (SLICE-08) | PRF-PRT-01…10, -12, -13 |
| SLICE-11 | REQ-PRT-011 (with REQ-OPS-001) | PRF-PRT-14 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
