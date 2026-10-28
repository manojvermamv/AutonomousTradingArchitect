# SLICE-06 — Protection and safety

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-06-review-2026-10-28)). Step 1 is built (OA_NEW `03bbbde` on `slice-06`; [Step 1 as built](#step-1-as-built)). Step 2 waits on [Q-024](../../decisions/owner-questions.md#q-024) before it is deepened. Steps 2–5 are scoped; each is deepened once the step before it is built, as in SLICE-04, SLICE-05 and SLICE-07 (the delivery plan's depth rule).
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [protection spec](../../design/protection-and-safety.md), with the [ledger spec](../../design/ledger-and-atomic-transaction.md) for the events and index tables and the [execution-domain spec](../../design/execution-domain-and-observations.md) for the observations protection reads. Every deviation is marked **Deviation**. No score, threshold or money value is set here: the ladder's parameters are the approved shipped values (POL-012), and every refusing setting is bound only to labelled synthetic or owner-answered values in tests.
* **Phase:** master Phase 1 (ATA-01, POL-004…POL-006, POL-010…POL-015, A03-F5 kernel side, Combined-F6 protection part). Class S: the simulated broker only.
* **Builds on:** [SLICE-07](SLICE-07-observations-reconciliation-domain.md) as built (fills, positions, observations, the OpenAlgo adapter's single orders). The branch `slice-06` is cut from `slice-07` (OA_NEW `1b42505`). SLICE-06 follows SLICE-07 because protection needs fills and observations (delivery plan).
* **Owner answers applied:** Q-001 (`safety.hold_automatic_actions: allowed`), Q-002 (`risk.max_daily_loss_amount: "3600.00"` for BuyerEdge), Q-012, Q-013 (`protection.placement: basket_at_plan`; `protection.stop_order_type: trigger_only`), Q-014 (delegated human principals), X-004 (a misspelt `session_close` refuses to load). The owner answers are in [owner-answers-2026-10-27.md](../../decisions/owner-answers-2026-10-27.md).
* **Tasks and proofs:**
  * **Step 1:** the ladder half of TASK-S06-01 and TASK-S06-06's classification (PRF-PRT-02's ladder, rounding, `premium_exit` and restart cases; PRF-PRT-13; the `stop_on_fill` derived-state rows of PRF-PRT-01).
  * **Step 2:** the rest of TASK-S06-01 for `stop_on_fill` and exits, TASK-S06-02 and TASK-S06-05 (PRF-PRT-01's `stop_on_fill` and shared rules, PRF-PRT-03's CP-P points, PRF-PRT-06, PRF-PRT-07, PRF-PRT-09).
  * **Step 3:** the basket half of TASK-S06-01 (PRF-PRT-01's basket rows, PRF-PRT-03's CP-B points, PRF-DOM-04's basket clauses).
  * **Step 4:** TASK-S06-03, TASK-S06-04 and the rest of TASK-S06-06 (PRF-PRT-04, PRF-PRT-05).
  * **Step 5:** TASK-S06-07 and the gap peak (PRF-PRT-02's gap case, PRF-PRT-10, PRF-PRT-12).

**Excluded, and where each part arrives:**

* **SLICE-08:** the real stable views, bars, ticks and the feed-gap flag. SLICE-06 reads them through `MarketPort`, extended with labelled synthetic fixture fields (the protection spec's delivery row).
* **SLICE-11:** PRF-PRT-14 (the supervisor cannot send), and the kernel host's loop that drives the protection loop (with PRF-PRT-06's "kernel frozen" half, a Deviation recorded in step 2).
* **PRF-PRT-08 (Deviation from the delivery plan's SLICE-06 row):** the parity comparison over recorded days (`scripts/compare_parity.py`, class P) runs once recorded sessions are captured with TASK-S11-07, before any live use. Step 1's golden cases, generated once from the legacy ladder and run in every suite, are its unit-level stand-in.
* **TASK-S07-05:** the order in which OpenAlgo places a basket's legs, and how the broker margins SELL legs that rest before the BUY fills. Both are endpoint-contract items needed before live use; they block no step.

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | The premium ladder ported from legacy (`kernel/trail.py`) with its golden cases; `ladder_state`; `ProtectionPolicy` on the bound policy; migration 006 with `protection_state` and the events `PROTECTION_DESIRED`, `GAP_PEAK_RECORDED` and `EXIT_STARTED`; the leg view, the derived `stop_on_fill` leg state and the on-read classification (this file, below). Nothing is sent | PRF-PRT-02 (ladder), PRF-PRT-13, PRF-PRT-01 (derived-state rows) |
| 2 | The protection loop on the writer thread: triggers, `evaluate`, `stop_on_fill` placement on the first fill, trail modifies, one request at a time per leg, retries, orphans, the tick exits and the exit sequence, the session-close exit, kill and hold interaction, escalations once per subject; crash points CP-P1…CP-P4 | PRF-PRT-01 (`stop_on_fill`, shared rules), PRF-PRT-03 (CP-P), PRF-PRT-06, PRF-PRT-07, PRF-PRT-09 |
| 3 | `basket_at_plan`: `basket_legs`, `PlanRef.protective_legs`, `ADM-R13`, the simulated broker's basket, the OpenAlgo basket call with the in-send validated join, `LEG_ASSIGNED`, the basket derived states, the quantity rule, the failure classes, `overclose` and `sibling_failed` holds by episode; CP-B1…CP-B6 | PRF-PRT-01 (basket), PRF-PRT-03 (CP-B), PRF-DOM-04 (basket clauses) |
| 4 | The daily-loss latch (`session_pnl`, the budget settings, trip and unlock), `SAFETY_CHECK_STATE` and the inert check, the recovery hold trigger, and the permission matrix's remaining cells | PRF-PRT-04, PRF-PRT-05 |
| 5 | The gap peak (`GAP_PEAK_RECORDED` from a replay of the gap's bars), release continuity of a leg's ladder and policy versions, and the evaluation-cost baseline | PRF-PRT-02 (gap), PRF-PRT-10, PRF-PRT-12 |

## Step 1 — the ladder, protection state and the derived leg

The authorities are the protection spec's [Evaluation](../../design/protection-and-safety.md#evaluation-kernelprotectionpy) and [Protective stop and tick exits](../../design/protection-and-safety.md#protective-stop-and-tick-exits-kernelprotectionpy) sections, and its [event catalogue](../../design/protection-and-safety.md#event-catalogue). Fresh EGM design and implementation-readiness reviewers reviewed it ([review](../../egm/plan/review.md#slice-06-review-2026-10-28)), and their findings are resolved in the text below.

Step 1 sends nothing. Its one admission change is the reserved-role check (below).

### What legacy does, and what that decides

All legacy citations are at 445eb116.

* **The premium ladder is pure standard-library Python** (`src/core/framework/protection/trail.py`, 985 lines). It holds:
  * `TrailSettings`, with the shipped defaults (`:113-149`), which equal BuyerEdge's `TrailConfig` (`src/strategies/buyer_edge.py:539-575`);
  * `TrailPosition` (`:153-212`);
  * the arithmetic (`:242-367`);
  * `premium_exit` (`:370-394`);
  * `PremiumTrail.cycle`, `_advance` and `_lock_floor` (`:397-632`).

  It computes in floats. The target ports it unchanged, in floats, so that its moves are exactly legacy's.
* **Legacy's live trail moves the broker stop through a `modify` callback** (`trail.py:451-456`; `src/analysis/core/eventsource.py:70-73`). When the callback returns False, because the gateway refused or rejected the modify (under kill or the rate limit, `src/runtime/execution_gateway/__init__.py:1377-1399`), the cycle does not advance `pos.sl` or `premium_trail_active`. It does advance `trail_peak_close`, `mfe` and `premium_trail_peak` (`:463-472`, `:558-561`, `:581-587`). The next cycle then retries from the old stop. The target keeps this exactly (the two outcomes, below).
* **`PremiumTrail` holds one piece of instance state outside `TrailPosition`, used for logging only.** That is `_last_pl_pct` and `milestones`: `_lock_floor` computes the floor (`:606-620`) before reading `_last_pl_pct` (`:622`), which feeds only the milestone log (`:627-631`). So `TrailPosition`, together with the same inputs, is the whole ladder state.
* **The cycle reads more than `TrailPosition`:**
  * the confirmed bar history, since ATR's length guard reads the whole history and uses same-day bars only when there are enough (`:340-351`), and `_same_day` needs `Bar.ts.date()` (`:282-285`);
  * `delta`;
  * an `opposing_score`, which legacy's strategy supplies from its fresh opposing signal (`src/analysis/core/eventsource.py:81-84`) and which tightens the step (`:476-481`). The kernel has no such signal yet: [Q-024](../../decisions/owner-questions.md#q-024).
* **Validation** (`src/strategies/buyer_edge.py:612-655`; `src/core/framework/policy/schema.py:186-198`):
  * `sl_method` in `fixed_pct`, `fixed_pts`, `atr`, `delta`, `key_level`, after `.strip().lower()` (`:583`);
  * `activation_lock_pct` in [0, 1);
  * `gamma_speed_step_floor` in (0, 1];
  * `atr_period` ≥ 1;
  * the step, ATR-multiplier and delta step values > 0;
  * `activate_at_pct` ≥ 0 and `activate_at_max_pts` > 0;
  * the buffer and improvement values ≥ 0;
  * `delta_exit_threshold` in [0, 1);
  * a `trail.enabled` flag, default true.

  `PremiumTrail.__init__` refuses `tracking_mode` `spot` and `sl_method` `key_level` (`trail.py:405-420`).
* **Legacy seeds the ladder from the plan** (`src/core/framework/runtime/orchestrator.py:916-925`): `entry_premium`, `tgt` = the target, `sl` and `initial_sl` = the stop, `entry_conviction` = `trail_conviction`, `remaining_qty` = the quantity, and `trail_act_mult` left at 1.0.
* **Session close** (`src/core/framework/policy/lifecycle.py:40-75`): the clock is `^([01]?\d|2[0-3]):([0-5]\d)$` in exchange time (IST), and the default is 15:13 (`:31`). Legacy's "anything but `broker` means `square_off`" is superseded by X-004: a misspelt value refuses.
* **Rounding:** stops round up and targets round down to the tick (POL-015). That is `orders.py:203-207` for placement and `execution_gateway/__init__.py:1363-1371` for a trailed stop. OA_NEW has the same function as `to_tick` in `kernel/selection.py`, which returns a float.

### Decisions

* **`kernel/trail.py`: the premium ladder, ported** (tree delta **T-32**).
  * It carries `Bar`, `TrailSettings` (the premium fields), `TrailPosition`, `TrailEvent`, `true_range`, `wilder_atr`, `efficiency_ratio`, `speed_tier`, `step_points`, `premium_exit` and `PremiumTrail`, unchanged in logic and floats, with legacy's names and constants. `SpotTrail`, `KeyLevelTrail` and the key-level settings are not ported.
  * `LADDER_VERSION = "premium@445eb116"`.
  * `Bar.ts` is a `datetime` in exchange time, so `_same_day` groups by day as legacy does.
* **Two outcomes per bar** (F-1). `trail.step(settings, pos, *, bars, delta, opposing_score) -> Step` runs `PremiumTrail(settings).cycle` twice on copies of `pos`. One run passes `modify=lambda level: True`, so the move is taken. The other passes `modify=lambda level: False`, so the move is refused and only the peak and MFE fields advance, as in legacy. The result is `Step(event, accepted: TrailPosition, refused: TrailPosition)`, and the two are equal when the cycle attempted no move.
  * The kernel records both.
  * Step 2 adopts `refused` when the leg's modify for that move ends `REJECTED`, `REFUSED`, or is not submitted (kill, hold, conflict), and adopts `accepted` otherwise.
  * That is legacy's partial update exactly, so a rejected or withheld move leaves the ladder where legacy's would be.
  * A fresh `PremiumTrail` per call is correct, since its instance state is logging-only.
* **`ladder_state`** is `trail.to_state(pos) -> dict` and `trail.from_state(d) -> TrailPosition`, driven by a fixed table of each `TrailPosition` field's type, built from its annotations.
  * A float is stored as `repr(x)`, the shortest form that reads back to the identical float. It may use exponent notation, which reads back exactly too.
  * A non-finite float refuses (`ValueError`).
  * `None` is `null`; ints, bools and strs are themselves.
  * `from_state` coerces each field by the table, so `from_state(to_state(pos)) == pos` for every reachable state.
* **The seed.** `trail.seed(*, entry_premium, target, stop, conviction, quantity) -> TrailPosition`, as `orchestrator.py:916-925`, with floats taken from the exact values given.
  * Step 2 supplies them from the plan. It must take the exact values the planner computed, not a two-place display string.
  * Any difference from legacy's floats is a Deviation for the owner, characterized in step 2 (TASK-S06-01).
* **Ladder inputs.** `step` takes the confirmed bars of the position's instrument, in order, ending with the bar being acted on, with the prior history the view holds. It also takes the tick-time `delta` (or `None`) and the `opposing_score` (or `None`). Step 2 sources them:
  * the bars and delta from `MarketPort` fixtures;
  * the catch-up of bars missed while the kernel was down, keyed by the recorded `view_id`;
  * the opposing score per the owner's answer to [Q-024](../../decisions/owner-questions.md#q-024). Until then step 2 refuses to build the trail loop (step 2's scope).
* **Golden cases from legacy** (`tests/fixtures/trail_parity_445eb116.json`, tree delta **T-33**). They are generated once by `scripts/gen_trail_parity.py` (tree delta **T-35**), run with `python -I` against a legacy checkout of OA@445eb116 named by `--legacy <path>`. The generator never runs in the test suite.
  * **Paths:** `random.Random(seed)` with only `.random()`, seeds 1–4.
    * Each path has 40 one-minute bars on one exchange day, starting 09:15, except seed 4, which has 25 bars on the prior day and then 40.
    * Each close is the previous close times `(1 + (r − 0.45) × 0.06)`, rounded to 0.05.
    * Open is the previous close; high and low are max/min of open and close, ± `r × 1.0`, rounded to 0.05.
    * Delta is `0.3 + 0.4 r` per bar.
  * **Grid:** seeds × `sl_method` in `atr`, `fixed_pts`, `delta`, `fixed_pct` × `entry_conviction` in 0.0, 0.8.
    * The seed position is `entry_premium=100.0`, `tgt=150.0`, `sl=70.0`, `remaining_qty=75`.
    * Extra cases: `opposing_score=-70` on bars 20–25; `activation_lock_pct=0.25`; `trail_act_mult=1.5`; `delta_exit_threshold=0.0`; a target at or below entry (`tgt=100.0`); ATR with 10 bars (too few); one bar with close 0.
    * At least one case must have an efficiency factor below 1 that changes a recorded step.
  * **Each cycle runs both outcomes,** as the kernel does. Each cycle records the event kind, reason, `prev_sl`, `new_sl` and step, plus `to_state` of both outcomes.
  * **At the end** it records `premium_exit` for ticks at `sl − 0.05`, `sl`, `sl + 0.05`, `tgt − 0.05`, `tgt`, `0.0`, and a delta of 0.05.
  * **Shape:** `{"generator": <the script's text>, "legacy_commit": "445eb116", "python": <version>, "cases": [{"id", "settings", "seed", "bars": [{"ts", "open", "high", "low", "close", "delta", "opposing_score"}], "cycles": [...], "exits": [...]}]}`. Every float is a `repr` string and every `ts` is ISO. The bars are stored, so the cases never depend on a Python version's random numbers.
* **`ProtectionPolicy`** (in `contracts/decisions.py`, on `BoundPolicy` as keyword field `protection: ProtectionPolicy | None = None`).
  * **`None` means the all-defaults policy:** trailing on, the shipped ladder, `square_off` at 15:13. A policy never has to state protection (the spec's policy inputs), and no gate is added.
  * **Fields:**
    * `ladder_version`: only `premium@445eb116`;
    * `enabled`: bool, default true. With false, the stop is placed and never trailed, as legacy's `trail.enabled`;
    * `ladder`: a sorted tuple of `(name, value)` for the premium `TrailSettings` fields that the policy overrides;
    * `session_close`: `square_off` or `broker`, matched after `.strip().lower()`; omitted or `null` means `square_off`;
    * `square_off_time`: `HH:MM` or `H:MM` matching legacy's clock pattern; omitted means `15:13`.
  * `protection_policy_from(mapping) -> ProtectionPolicy` refuses (`ValueError`) for each of the following:
    * an unknown key, or a key-level or spot setting;
    * a `tracking_mode` other than `premium`;
    * an `sl_method` other than `fixed_pct`, `fixed_pts`, `atr` or `delta`;
    * a value of the wrong type (`atr_period` must be an int, and every other numeric field an int or float, coerced to float);
    * any of legacy's validation ranges above;
    * a misspelt `session_close`, or a malformed time.
  * `policy.trail_settings() -> TrailSettings`.
  * `policy.resolved() -> dict`: every premium field with its value, plus `ladder_version`, `enabled`, `session_close` and `square_off_time`.
  * `policy_version` is the SHA-256 of `canonical(resolved())`. So `25` and `25.0` give one version.
* **Placement settings** (F-19). The refusing settings `protection_placement` (`basket_at_plan` or `stop_on_fill`; `fill_priced` refuses until its rules are written) and `protection_stop_order_type` (`trigger_only`; `trigger_with_limit` refuses until its offset has a home) join `_ADMISSION` and `ADMISSION_REQUIRED` now, so step 2 changes no binding. Tests bind `stop_on_fill` and `trigger_only`, labelled synthetic for placement. Until step 3, a `basket_at_plan` composition composes no protection loop.
* **Migration 006** (`resources/migrations/006_protection.sql`, tree delta **T-34**):

  ```sql
  CREATE TABLE protection_state (position_id TEXT PRIMARY KEY, desired_level TEXT, desired_quantity INTEGER,
    ladder_state TEXT, ladder_state_if_refused TEXT, ladder_version TEXT, policy TEXT, policy_version TEXT,
    view_id TEXT, desired_sequence INTEGER, exit_reason TEXT, exit_cause TEXT, exit_sequence INTEGER);
  CREATE TABLE protection_gap (position_id TEXT NOT NULL, gap_started_at TEXT NOT NULL,
    first_sequence INTEGER NOT NULL, PRIMARY KEY (position_id, gap_started_at));
  ```

  * `schema.py` gains `Migration(6, "protection", "006_protection.sql")`.
  * `TABLES` gains both tables. `_PK` gains `("position_id",)` and `("position_id", "gap_started_at")`.
  * `_load_touched` loads the subject's `protection_state` row for `PROTECTION_DESIRED` and `EXIT_STARTED`, and its `protection_gap` row for `GAP_PEAK_RECORDED`.
  * `policy` holds the resolved policy, so a leg is always evaluated with its recorded policy, even after a rebinding (F-6, PRF-PRT-12; step 5 adds only the release refusal).
* **Events** (family `protection`; principal `kernel:protection`; no command key):

  | Event | Payload | Fold |
  |---|---|---|
  | `PROTECTION_DESIRED` | `position_id`, `desired_level` (money > 0), `desired_quantity` (int ≥ 0), `ladder_state`, `ladder_state_if_refused` (objects), `ladder_version`, `policy` (object), `policy_version`, `view_id` | Upsert the desire columns, creating the row if absent; keep the exit columns |
  | `GAP_PEAK_RECORDED` | `position_id`, `view_id`, `gap_started_at`, `gap_ended_at` (ISO), `live_peak`, `recovered_peak` (prices as `repr` strings, evidence), `would_be_stop` (money or null) | Insert a `protection_gap` row; a second one for the same (position, gap start) raises `TransitionNotAllowed` (`LED-R09`), so one record per gap |
  | `EXIT_STARTED` | `position_id`, `reason` (`square_off`, `target`, `deep_otm_delta`), `cause` (`{"price": money, "at": ISO}` or `{"session_id": string}`) | Set the exit columns, creating the row with null desire columns if absent; a second `EXIT_STARTED` for a position with exit columns set raises `TransitionNotAllowed` (`LED-R09`) |

  * `events.schema.json`: `PROTECTION_DESIRED` has `desired_level` `money_positive`, `desired_quantity` `integer`, the two states and `policy` `object`, and the others `string`. `EXIT_STARTED` has `cause` `object`. `GAP_PEAK_RECORDED` has `would_be_stop` `["money", "null"]` and the rest `string`.
  * The writer's `_protection_shape` refuses `LED-R06` for:
    * a negative `desired_quantity`;
    * an `EXIT_STARTED` reason outside the three;
    * a `cause` that is not exactly one of its two shapes (with a money `price`);
    * a non-finite float field in a `ladder_state`.
  * **The exit's open state is derived on read** (no event closes it): open while `q` > 0 or any protective leg is not `ENDED`. A late entry fill after an exit reopens it, and the exit sequence resumes, which is the intent. One `EXIT_STARTED` per position, ever: a later exit for the same position continues the recorded one.
* **`kernel/protection.py` (step 1 part):**
  * **`Desire`** (frozen dataclass): `desired_level: str`, `desired_quantity: int`, `ladder_state: dict`, `ladder_state_if_refused: dict`, `ladder_version: str`, `policy: dict`, `policy_version: str`, `view_id: str`.
  * **`level_of(price: float, *, up: bool, tick_size) -> str`:** the tick-rounded price from `to_tick`, as `Decimal(repr(...))` quantized to two places. It raises `ValueError` unless the quantization is exact, which a 0.05 or 0.01 tick always is. The tick size is the entry `PlanLeg.tick_size`, else `to_tick`'s 0.05 default. `ladder_state` keeps the unrounded `sl`.
  * **`record_desired(writer, position_id, desire) -> str`:** compares each field with the row (states and policy as `canonical` JSON, the level as `Decimal`). When any differs, it commits `Decision("PROTECTION_DESIRED", None, None, [EventDraft(..., Principal("kernel:protection", "kernel"))], None)` and returns `"recorded"`; otherwise it returns `"unchanged"`.
  * **The writer's `commands_with_prefix(prefix) -> list[CommandRow]`** reads `command_key >= prefix AND command_key < prefix || char(1114111)` (no `LIKE`), sorted by the integer after the last colon. Refused keys have no command row and do not count.
  * **`next_key(writer, position_id, role) -> str`** is `prot:<position_id>:<role>:<k+1>`, with `k` the number of admitted commands under the prefix, as the spec says. A key refused at admission records no command identity, so it may be reused (the ledger identity rule allows it).
  * **`LegView`** (frozen dataclass): `position_id`, `role`, `commands: tuple[CommandRow, ...]`, `latest_key`, `latest_state`, `live_order_id`, `order_ids` (the replacement chain), `placed_level`, `placed_quantity`, `confirmed_level`, `order_quantity`, `filled`, `confirmed_quantity`, `observed: ObservedOrder | None`, `observed_as_of`, `observation_digest`, `ledger_ended: str | None`, `ended_reason: str | None`.
  * **`leg_view(writer, position_id, role, observation, now, *, max_age_secs, exit_open=False) -> LegView`:**
    * **Commands:** the leg's commands by prefix. The placement is the first `CloseRequest` among them. `placed_level` is its `COMMAND_ADMITTED` `request.order.trigger`, and `placed_quantity` its `request.quantity`.
    * **Live order:** the newest `broker_identity` order row with the placement's command key, ordered by `first_sequence`. Its `leg_role` is `close`, the verb, which a replacement inherits. `order_ids` is every such row.
    * **`confirmed_level`:** the latest non-null `confirmed_level` among `COMPLETED` commands whose target is in `order_ids`, together with the placement's own completion. It is `None` until one exists.
    * **`order_quantity`:** the latest `COMPLETED` command among those whose request carried a quantity (the placement, or a modify with `changes.quantity`), taking its non-null `confirmed_quantity`, else `placed_quantity`.
    * **`filled`:** the recorded fills over every ID in `order_ids`. `confirmed_quantity` is `order_quantity` minus `filled`.
    * **These rules count any principal's completed commands on the live order, not only `prot:` ones.** That is how `ledger_view` already reads a target's level (`kernel/lifecycle.py:234-240`): a human's completed modify moves the order too. It departs from the spec's own-role wording, which the spec is amended to match.
    * **`observed`:** the single row with the live order's ID in `observation.orders`. It is `None` when there are zero or several such rows, when `admission.observation_age(observation, now, max_age_secs)` is `None` (a book incomplete, or an age outside 0 … the limit), or when `observation` is `None`. `max_age_secs` is the bound `max_observation_age_secs` setting (POL-021).
    * **`ledger_ended`, sticky** (F-8): `filled` or `order_ended` when the placement `COMPLETED` with that reason; `cancelled` when a cancel of any ID in `order_ids` `COMPLETED` `cancelled`; `target_terminal` when a cancel or modify completed so; `filled` also when the recorded fills over `order_ids` reach `order_quantity` ([as built](#step-1-as-built)). Otherwise `None`.
    * **`ended_reason`, the first that holds:**
      1. `fill` when the order is filled (`ledger_ended` `filled`, or `observed.status` `filled`) and `filled` > 0;
      2. `fill_pending` when it is filled by those signs and no fill is recorded yet;
      3. `human:<key>` for a `COMPLETED` cancel whose `COMMAND_ADMITTED` `request.principal[1]` is `human`;
      4. `exit` for a `prot:` cancel committed while `exit_open`;
      5. `orphan` for any other `prot:` cancel;
      6. `broker` when `observed.status` is `rejected` or `expired`;
      7. `external` for anything else terminal (a cancel at the broker or by its risk system), which step 2 escalates.
  * **`derived_state(leg, desire, *, entry_ended: bool, q: int) -> (state, reason)`:** the spec's five rows in order, first match wins, all arguments required:
    1. `ENDED` when `leg.ledger_ended` is set, or `observed.status` is terminal (`filled`, `cancelled`, `rejected`, `expired`). The reason is `ended_reason`. Once the ledger records the end, a stale observation never brings the leg back.
    2. `PENDING` when the latest command is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING`.
    3. `ORPHANED` when `entry_ended` and `q` ≤ 0 and the leg rests (not `ENDED`). So a confirmed stop on a flat position is cancelled, never left to oversell.
    4. `CONFIRMED` when the latest command `COMPLETED` and `confirmed_level` and `confirmed_quantity` are not `None` and equal the desire (levels as `Decimal`).
    5. `DESIRED` otherwise, including `desire` `None`.

    States other than `ENDED` have reason `None`.
  * **`classify(leg, kind, now, *, max_age_secs) -> str`**, on read and never stored:
    * `kind` is `stop`, `target_exit` or `delta_exit`;
    * `runtime_dependent` for the two exits;
    * `broker_held` for a stop whose `observed` row is `open` at `confirmed_level` (`Decimal(trigger_price) == Decimal(confirmed_level)`), with the age from `observed_as_of` to `now` within 0 … `max_age_secs` (60 s is broker-held; 60.001 s is not);
    * `uncertain` otherwise.
* **Reserved roles.** After planning, before stage B, a plan leg whose `leg_role` is `stop`, `target` or `close` is refused and recorded: `Refusal("ADM-R01", "malformed_request", key, "COMMAND_ADMITTED")`, check `P`, reason `reserved_leg_role`. The planner names its leg `entry` (`kernel/planner.py:251`), so nothing in use is refused.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/trail.py` | New (T-32): the premium ladder, `step`, `seed`, `to_state`/`from_state`, `LADDER_VERSION` |
| `src/autonomous_trading/kernel/protection.py` | New: `Desire`, `level_of`, `record_desired`, `next_key`, `LegView`, `leg_view`, `derived_state`, `classify` |
| `src/autonomous_trading/contracts/decisions.py` | `ProtectionPolicy`, `protection_policy_from`, `BoundPolicy.protection` |
| `src/autonomous_trading/resources/migrations/006_protection.sql` | New (T-34) |
| `src/autonomous_trading/kernel/ledger/schema.py`, `store.py`, `projections.py` | Migration 6; the events, family, `_PK`, `_load_touched`, `_protection_shape`; the folds; `commands_with_prefix` |
| `src/autonomous_trading/resources/events.schema.json` | The three events |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `protection_placement`, `protection_stop_order_type` |
| `src/autonomous_trading/kernel/admission.py` | The reserved-role refusal |
| `scripts/gen_trail_parity.py` | New (T-35): the golden-case generator, run once against legacy |
| `tests/fixtures/trail_parity_445eb116.json` | New (T-33) |
| `tests/conftest.py`, `tests/unit/test_policy_parameters.py` | The two settings |
| `tests/unit/test_protection_states.py` | New: the step's tests |
| Spec amendments | The protection spec: the ladder in `kernel/trail.py` with its two outcomes; `ladder_version`; the recorded resolved policy; `EXIT_STARTED`'s open state derived on read; the live order's commands counted by any principal |

### Step 1 tests

`tests/unit/test_protection_states.py` covers the following:

* **The port against legacy (PRF-PRT-02, the unit stand-in for PRF-PRT-08):**
  * every golden case reproduced exactly: each cycle's kind, reason, `prev_sl`, `new_sl`, step, and both outcomes' states;
  * the exits;
  * `premium_exit`'s precedence: delta, then stop, then target, and none at 0.
* **Two outcomes:** on an activating bar, `refused` keeps `sl` and `premium_trail_active` but advances `trail_peak_close`, and `accepted` moves `sl`. On a holding bar the two are equal.
* **Rounding (POL-015):** `level_of(84.805, up=True, tick_size="0.05")` is `"84.85"` and `level_of(120.12, up=False, ...)` is `"120.10"`.
* **Restart mid-ratchet** (F-15): for the `atr`, `fixed_pct` and `delta` paths that cross each lock milestone, cycling with a new `PremiumTrail` and `from_state(to_state(pos))` after every bar equals one uninterrupted run.
* **`ladder_state`:** the round trip holds for every reachable state, an int-valued float comes back a float, and a non-finite float refuses.
* **The policy:**
  * each refusal: spot, key-level, an unknown key, a wrong type, each of legacy's ranges, a misspelt `session_close` and `25:00`;
  * `None`, omitted and `null` give defaults; ` Broker ` and `9:30` load;
  * equal values give one `policy_version`, `25` and `25.0` give one, and a changed parameter changes it.
* **Events:**
  * `record_desired` records once, then gives `unchanged` for the same desire and records again for a new level, with `check_index()` clean;
  * a second `EXIT_STARTED` is `LED-R09`, and an `EXIT_STARTED` before any desire creates the row;
  * a second `GAP_PEAK_RECORDED` for one gap is `LED-R09`;
  * `desired_level` `"84.8"` and a `cause` without `at` are `LED-R06`.
* **Derived state,** on a ledger built through `admission_world(policy=bound(ai_mode="off", review_required=False), kernel_positions=True, loop=True)`. `loop_filled_entry` gives a position of 75. Protection's requests are admitted with `auth=Authenticated(Principal("kernel:protection", "kernel"), "in_process")` and `next_key` keys, then dispatched, with `book_step` and `observe`:
  * a stop placed and `WORKING` reads `PENDING`;
  * after the book shows it resting and reconciliation completes it, it reads `CONFIRMED` at the desire, and `DESIRED` when the desire moves;
  * a modify ending `UNCERTAIN` reads `PENDING`;
  * a human cancel observed reads `ENDED` with `human:<key>`;
  * a stop filled and recorded reads `ENDED` with `fill`;
  * `CONFIRMED` with `entry_ended=True, q=0` reads `ORPHANED`;
  * after the end, a 61 s old observation still reads `ENDED`;
  * a replacement ID keeps the leg, and its fills count in `filled`;
  * an observation 61 s old gives `observed` `None`.
* **Classification (PRF-PRT-13):** each row; the 60 s / 60.001 s boundary; no `protection_state` column holds it, and a reader with a later clock reads `uncertain`.
* **Reserved roles:** a plan leg named `stop` is refused `ADM-R01` with reason `reserved_leg_role`.
* **Break checks** (named in the docstring):
  * drop the efficiency factor from the step;
  * advance `sl` in the refused outcome;
  * round the ratchet down;
  * serialize floats with `str(round(x, 2))`;
  * record an unchanged desire;
  * store the classification;
  * read `CONFIRMED` or `broker_held` from an `ACK` (a `WORKING` placement);
  * read `ENDED` from a stale observation only;
  * evaluate `ORPHANED` after `CONFIRMED`;
  * read `observed` from an observation older than 60 s;
  * accept `sl_method: key_level`;
  * accept `atr_period: 0`.

### Step 1 as built

Commit `03bbbde` on `slice-06`, on top of `slice-07`'s `1b42505`. It changes 17 paths (1,767 lines added, 11 removed). The files match the step's table. `kernel/trail.py` is legacy `src/core/framework/protection/trail.py` lines 1–633 at 445eb116 (everything before the spot ladder), copied byte for byte by a script under a provenance header, followed by the kernel's additions.

**A correction to the step's text.** A stop that rests is `COMPLETED` once, and its later fill commits no command event. Under the step's rule its end then rested only on a fresh observation, so a 61 s old book would read the filled leg as resting again. `ledger_ended` is therefore also `filled` when the recorded fills over `order_ids` reach `order_quantity`; the rule above is amended to say so.

**Choices made while building** (none sets a money value; every test value is labelled synthetic):

| Topic | As built |
|---|---|
| The golden cases' shape | A cycle's `refused` is `null` when it equals `accepted`, and each cycle also records legacy's `ker_factor`. The JSON is compact (1.7 MB). Generated with Python 3.14.0, recorded in the file; SHA-256 `26f3281c739bfad2fe3092d412c062fda4e48fc19e2bb7c802ccfe27b51b03bd` |
| The extra cases' path | Seed 2's path from a conviction-0.8 seed, which activates at bar 17 and ratchets. Separate seeds never activated, so the extra cases would have tested nothing. The zero close is bar 20; "ATR with 10 bars" is that path's first 10 bars |
| What the cases cover | 39 cases, 1,730 cycles: 27 activations, 93 ratchets, 40 blocked, 120 where the refused outcome differs, and 108 moves with an efficiency factor below 1. The opposing score changes the stop from bar 20 |
| `TrailSettings` and `TrailPosition` | Ported whole, key-level fields included, so the port stays verbatim. The policy refuses those keys |
| The policy block | `protection_policy_from` takes `ladder_version`, `enabled`, `ladder` (a mapping of premium settings), `session_close` and `square_off_time`; any other top-level key refuses. `ProtectionPolicy` checks itself again on construction, so a hand-built policy cannot hold an uncoerced or out-of-range value |
| `contracts` reading the ladder | `ProtectionPolicy.trail_settings()` and `resolved()` import `kernel.trail` inside the call, and `policy_version` uses the ledger's `digest`. So the contract module loads nothing from the kernel at import |
| A refused desire | `record_desired` raises `DesireRefused` carrying the writer's refusal |
| Ladder states in the writer | `_protection_shape` runs `trail.from_state` on both states, so a missing field, a wrong type or a non-finite float is `LED-R06` |
| Ended reasons for cancels | `human:<key>`, `exit` and `orphan` read only `COMPLETED` cancels on the chain |
| Classification without a trigger | An observed row with no `trigger_price` is `uncertain` |
| The reserved-role check | After a plan is returned and before the admitted decision is built, recorded with check `P` |

**Tests** (715 passed, twice, with `pytest` in the slice's virtual environment on the development machine; no broker variables; nothing reached a deployment):

| File | Cases |
|---|---|
| `test_protection_states.py` (57, new) | **Port:** every golden cycle (kind, reason, `prev_sl`, `new_sl`, step, both states); the fixture is not vacuous; the exits and their precedence; two outcomes; POL-015 rounding; restart mid-ratchet over six paths; the `ladder_state` round trip. **Policy:** 30 refusals; defaults, ` Broker `, `9:30`, and one version for `25` and `25.0`. **Events:** record once, unchanged, record again, `check_index()` clean; one exit per position; one record per gap; `LED-R06` payloads. **Derived leg:** `PENDING` from `WORKING`; `CONFIRMED`, `DESIRED` and broker-held after the book; a later clock reads `uncertain`; `ORPHANED` before `CONFIRMED`; a modify `UNCERTAIN` reads `PENDING`; a human cancel `ENDED human:<key>`, sticky past 61 s; protection's own cancel `exit` or `orphan`; a replacement keeps the leg, its fill ends it `fill`, sticky past 61 s; an observed rejection ends it only while fresh. **Classification:** each row and the 60 s / 60.001 s boundary; no column holds it. **Reserved roles:** a leg named `stop` is `ADM-R01` |
| `test_policy_parameters.py` | The two placement settings resolve, are null by default, refuse `fill_priced` and `trigger_with_limit`, and refuse the front door when unbound |

**Break checks** (each applied with every anchor checked first, run against `test_protection_states.py`, and reverted byte for byte with an md5 check; every one failed):

| Change | Test that failed |
|---|---|
| Drop the efficiency factor from the step | `test_every_golden_case_is_reproduced_exactly` |
| Advance `sl` in the refused outcome | the same |
| Round the ratchet down | `test_rounding_pol_015` |
| Serialize floats with `str(round(x, 2))` | `test_every_golden_case_is_reproduced_exactly` |
| Record an unchanged desire | `test_record_desired_records_once` |
| Store the classification (a column) | `test_record_desired_records_once` (the index check, first under `-x`) |
| Read `CONFIRMED` or broker-held from an ACK | `test_a_stop_reads_pending_then_confirmed_then_desired` |
| Read `ENDED` from a stale observation only | `test_a_human_cancel_reads_ended_and_the_end_is_sticky` |
| Evaluate `ORPHANED` after `CONFIRMED` | `test_a_stop_reads_pending_then_confirmed_then_desired` |
| Read `observed` from an observation older than 60 s | the same |
| Accept `sl_method: key_level` | `test_policy_refusals` |
| Accept `atr_period: 0` | `test_policy_refusals` |

## Step 2 — the protection loop (scoped)

`evaluate(trigger, view, session, position, policy, leg, now)` and the protection loop on the writer thread, for `stop_on_fill`:

* the triggers and the protected subjects;
* the ladder seed from the plan's exact values;
* the bars, `delta` and catch-up after a restart from `MarketPort` fixtures;
* the feed-gap guard, which never cycles gap bars (PRF-PRT-02's must-fail case), with its fixture fields;
* placement on the first `FILL`, and later fills raising the stop's quantity;
* trail modifies on `BarConfirmed`, adopting the accepted or refused outcome;
* a modify that completes at a different broker level (POL-014);
* one request at a time per leg, and retries under the same key;
* nothing automatic re-placed, and human principals winning;
* orphans, with `external` and `orphan` ends escalated;
* the target and deep-OTM tick exits, with latest-tick coalescing;
* the exit sequence;
* the session-close exit at `square_off_time`;
* kill and hold interaction (records only), and escalations once per subject;
* the structure-action map;
* crash points CP-P1…CP-P4;
* TASK-S06-01's characterizations: legacy re-placement and the marketable-stop alternative.

**Before it is deepened:** the owner's answer to [Q-024](../../decisions/owner-questions.md#q-024) on the opposing-signal input.

**Deviation:** the kernel host's loop is SLICE-11's. Step 2's tests drive the loop directly. They prove PRF-PRT-06's "worker stopped" half; the "kernel frozen" half needs the host and is proved in SLICE-11.

## Step 3 — basket placement (scoped)

`basket_at_plan`, as the [Basket placement](../../design/protection-and-safety.md#basket-placement-basket_at_plan-kernelprotectionpy) section specifies:

* `basket_legs` and `PlanRef.protective_legs`, and `ADM-R13`;
* the simulated broker's basket, and the OpenAlgo `basketorder` call with the in-send validated join (PRF-DOM-04's basket clauses);
* the SLICE-07 hand-offs: `LEG_ASSIGNED`, `RESIDUAL_RECORDED` and partial resolution, `resolve_attempt` per leg (for CP-B2), and multi-leg I-6 reductions;
* the basket derived states and classification;
* the quantity rule and P-1;
* the failure classes;
* `overclose` and `sibling_failed` holds by episode, resolving the spec's F-P18 wording, which names hold reason `recovery` where the Basket section names `overclose`;
* CP-B1…CP-B6.

## Step 4 — the latch and safety visibility (scoped)

* `session_pnl` and the budget settings;
* `LOSS_LATCH_TRIPPED` and `LOSS_LATCH_UNLOCKED`;
* `SAFETY_CHECK_STATE`, the inert check and PRF-DSP-04's inert half;
* the recovery hold trigger;
* the remaining matrix cells (F-P12, F-P14, F-P20);
* POL-006: a replay keeps its own latch in its own ledger.

## Step 5 — gaps, continuity and cost (scoped)

* `GAP_PEAK_RECORDED` from a replay of the gap's bars (POL-013);
* the release refusal while a leg's recorded ladder version lives (PRF-PRT-12);
* the evaluation-cost baseline (PRF-PRT-10).

## Completion conditions

1. Every earlier test and every test of the built steps passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. Each step's file list matches its commit.

## Prerequisites

SLICE-07 as built. [Q-024](../../decisions/owner-questions.md#q-024) is answered before step 2 is deepened; it blocks no other step. Q-022 and Q-023 concern only the OpenAlgo adapter's production composition.
