# SLICE-06 — Protection and safety

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-06-review-2026-10-28)). Step 1 is built (OA_NEW `03bbbde` on `slice-06`; [Step 1 as built](#step-1-as-built)). Step 2 is built (OA_NEW `e27a436`; [Step 2 as built](#step-2-as-built); Q-024 and Q-025 option B, [Q-026](../../decisions/owner-questions.md#q-026) option A). Step 3 is built (OA_NEW `3e6d36a`, gaps closed in `84579d1`; [Step 3 as built](#step-3-as-built); [Q-027](../../decisions/owner-questions.md#q-027) option A). Steps 4–5 are scoped; each is deepened once the step before it is built, as in SLICE-04, SLICE-05 and SLICE-07 (the delivery plan's depth rule).
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
* **Legacy's live trail moves the broker stop through a `modify` callback** (`trail.py:451-456`; `src/analysis/core/eventsource.py:70-73`). When the callback returns False, because the gateway refused or rejected the modify (under kill or the rate limit, `src/runtime/execution_gateway/__init__.py:1377-1399`), the cycle does not advance `pos.sl` or `premium_trail_active`. It does advance `trail_peak_close`, `mfe` and `premium_trail_peak` (`:463-472`, `:558-561`, `:581-587`). The next cycle then retries from the old stop. The target keeps this exactly (the two outcomes, below). **Correction (2026-10-28):** that is the library's rule. The live host at 445eb116 never passes `modify`; it takes the move, sends the modify, and on failure puts back only `sl` (`scripts/run_framework_live.py:5221-5278`). Which rule the kernel keeps is [Q-025](../../decisions/owner-questions.md#q-025).
* **`PremiumTrail` holds one piece of instance state outside `TrailPosition`, used for logging only.** That is `_last_pl_pct` and `milestones`: `_lock_floor` computes the floor (`:606-620`) before reading `_last_pl_pct` (`:622`), which feeds only the milestone log (`:627-631`). So `TrailPosition`, together with the same inputs, is the whole ladder state.
* **The cycle reads more than `TrailPosition`:**
  * the confirmed bar history, since ATR's length guard reads the whole history and uses same-day bars only when there are enough (`:340-351`), and `_same_day` needs `Bar.ts.date()` (`:282-285`);
  * `delta`;
  * an `opposing_score`, which tightens the step (`:476-481`). **Correction (2026-10-28):** no legacy code supplies it; the live host passes none (`scripts/run_framework_live.py:5485`), and `src/analysis/core/eventsource.py:81-84` only describes it. See [Q-024](../../decisions/owner-questions.md#q-024).
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

## Step 2 — the protection loop

The authorities are:

* the protection spec's [Evaluation](../../design/protection-and-safety.md#evaluation-kernelprotectionpy), [Protective stop and tick exits](../../design/protection-and-safety.md#protective-stop-and-tick-exits-kernelprotectionpy), [Structures](../../design/protection-and-safety.md#structures-kernelprotectionpy) and [Session-close exit](../../design/protection-and-safety.md#session-close-exit-kernelprotectionpy) sections;
* the spec's crash points CP-P1…CP-P4;
* the owner's answers to [Q-024](../../decisions/owner-questions.md#q-024) and [Q-025](../../decisions/owner-questions.md#q-025), both option B, which is parity with legacy's live host.

The step builds on step 1 as built (OA_NEW `03bbbde`). Fresh EGM design and implementation-readiness reviewers reviewed it ([review](../../egm/plan/review.md#slice-06-step-2-review-2026-10-28)), and their findings are resolved in the text below.

**The rule for choices.** Where the live host and the package spec differ, step 2 follows the live host, as the owner's answers did, and says so. Where the spec decides something the host never did, the text marks it **Deviation (from the live host)** with the spec's reason.

**Scope.** Step 2 covers `stop_on_fill` only. In the first release that placement serves structure legs, which admission still refuses (Q-020). It also builds the per-leg rules that step 3's basket reuses. A composition bound to `basket_at_plan` composes no protection loop until step 3.

**Deviation:** the kernel host's loop is SLICE-11's. Step 2's tests drive the loop through `Coordinator.run_pass`. They prove PRF-PRT-06's "worker stopped" half; the "kernel frozen" half needs the host and is proved in SLICE-11.

### What legacy's live host does

All citations are at 445eb116. The live host is `scripts/run_framework_live.py`, read from OA's history with `git show 445eb116:scripts/run_framework_live.py` (the step 1 export holds only `src/`).

* **Cadence.** One sweep per poll steps each position that is `filled`, has quantity left and has a stop not cancelled, once (`sweep_trail`, `:5502-5555`). The poll is 20 s (`:4`, `:5248`).
  * Each step cycles the ladder on the latest bar only: `orch.on_bar(managed, bar_index=len(bars) - 1, bars=bars, emit=emit)` (`:5485`).
  * Cycling the same latest bar again on the next poll changes nothing once its move is taken: the ratchet needs a new high, and the activation path repeats the same arithmetic.
* **Bars** (`_premium_bars`, `:5062-5134`).
  * The held contract's `ltp`, one per 60 s chain snapshot, from the entry's first fill onward on the same day.
  * Each bar's open is the previous close, its high and low are that pair's extremes, and the first bar is flat.
  * The leg's own `open`, `high` and `low` are refused on purpose, because they are the day's. They made ATR fourteen times too wide (`:5108-5124`).
  * The ladder is first stepped at two bars (`:5454`). It never sees a bar from before its position existed (`:5070-5078`).
* **Inputs.** The host passes no `opposing_score`, no `delta` and no `modify` callback (`:5485`). With the shipped `sl_method: atr`, `delta` changes nothing in the cycle (`trail.py:356`). The settings are always `TrailSettings()` (`:5048`).
* **The seed** (`_build_ladder`, `:5163-5217`).
  * `entry_premium` is the plan's (`:5207-5208`), the stop is the plan's, and the target is the plan's.
  * The quantity is the filled quantity (`:5211`).
  * `entry_conviction` is never set, so it is 0.0.
* **The broker move.** The move is taken in the ladder first. Then `_apply_move` sends a modify of the remaining quantity at `round(after, 2)` (`:5221-5270`), which the gateway rounds up to the tick (`execution_gateway/__init__.py:1363-1371`).
  * On failure it puts back only `sl` (`:5277`).
  * Before every cycle, a higher broker stop recorded by the gateway replaces `sl` (`:5468-5470`). After a successful move, that is the tick-rounded level.
* **Restart.** The host rebuilds a cold ladder from the higher of the plan stop and the recorded `trail_stop`, and loses the peaks (`:5188-5196`, `:5457-5463`).
* **No tick exits run live.** Nothing in the host calls `premium_exit`, `check_exit` or `on_tick`. The target rested at the broker (the basket), and the deep-OTM delta exit never ran. The owner keeps it anyway ([Q-026](../../decisions/owner-questions.md#q-026), option A).
* **No re-placement.** No legacy code places a new stop after the broker rejects, expires or cancels one. A modify that returns a new order ID is a replacement of the same stop (`registry.py:1603`).
* **Square-off** (`src/runtime/session_close.py:92-270`), on every pass after `square_off_time` in IST.
  * It skips a partly filled entry (`:146-152`).
  * It waits while any exit order is in flight (`:165-169`), and never resends a close the broker rejected (`:170-175`).
  * It cancels each protective leg, then on a later pass with a fresh book closes only when every leg is cancelled or rejected. A leg found filled means no close (`:182-220`).
  * A refusal before the broker is retried (`:261-269`).
  * Under kill it sends nothing; the broker's square-off is the backstop (`:119-122`).

### Decisions

#### Owner answers applied, and the host's ladder inputs

* **Q-024 B.** The loop cycles with `opposing_score=None`. `trail.py` keeps the parameter because it is ported unchanged, and step 1's `opposing` golden case stays as a characterization of the library.
* **Q-025 B: the refused outcome is the host's put-back.**
  * `trail.step` changes: `refused` is a copy of `accepted` with `sl` set back to the stop before the cycle. Every other field keeps the move's value. The two outcomes are equal when `sl` did not move.
  * `scripts/gen_trail_parity.py` emulates that put-back for the `refused` state and regenerates `tests/fixtures/trail_parity_445eb116.json` against the same legacy checkout.
* **The host's ladder inputs, taken as the host's:**
  * no `delta`;
  * bars built from closes (below);
  * `entry_conviction` 0.0;
  * the seed quantity is the filled `q`;
  * the trailed level is `level_of(round(accepted.sl, 2), up=True, tick_size=…)`: the host's `round(after, 2)`, then the gateway's tick round up. Step 1's `level_of` is unchanged; the round is applied before the call.
* **Policy overrides.** The ladder uses `ProtectionPolicy.trail_settings()`. That equals the host's `TrailSettings()` unless a policy overrides a value, which the spec allows (POL-012).
* **Deviation (from the live host): restart.** The kernel resumes from the full recorded `ladder_state`, peaks included, as the spec requires (PRF-PRT-02, "a restarted kernel ratchets exactly as an uninterrupted one"). The host rebuilt cold and lost its peaks.

#### Where the loop runs

* **`ProtectionLoop(writer, clock, *, market, calendar, policy, safety, conflicts, holdings, observations, max_observation_age_secs, admit)`** in `kernel/protection.py`. `admit` is the coordinator's `admit_action`, and `policy` is `kernel.policy.Policy` (for `bound_policy`).
* **Composition.**
  * `bootstrap` composes it only when admission is composed and `protection_placement` is `stop_on_fill`.
  * It is held as `Coordinator.protection`, next to `observation_loop`, and exposed as `Composition.protection`. Under `basket_at_plan` both are `None`.
* **Test defaults.** `tests/conftest.py`'s `ADMISSION_SETTINGS` binds `protection_placement: basket_at_plan`. So no existing test, step 1's included, composes the loop. Step 2's tests bind `stop_on_fill` through `admission_settings`.
* **When it runs.** `Coordinator.run_pass` calls `self.protection.run_once()` after the observation drain, only when the stage is `OPERATING`, and before the deadline sweep, so a request it admits can be claimed in the same pass. Protection never runs before `OPERATING` (Goal 1); the broker-held stop stands meanwhile.
* **Level-triggered.** Each pass evaluates every protected subject from the ledger, the latest observation, the market port and the clock. That one evaluation stands for the spec's `ObservationChanged`, `LedgerChanged` and first-evaluation triggers (CP-P1). `BarConfirmed`, `Tick` and `SquareOffTime` are read from their sources at the same time.
* **The door.** Requests go to `admit(request, auth=Authenticated(PROTECTION, "in_process"))`. Admission, the permission matrix, the conflict relation and dispatch apply unchanged.
* **A refused protection event stops the kernel.** A `DesireRefused`, or a refused `EXIT_STARTED` or escalation other than `LED-R09`, is a payload bug. It is raised as `WriterLost`, as an outcome refusal is.

#### The subject and its inputs

A **protected subject** is each ledger `position` row that is `open`, or that has a stop leg with a live order not `ENDED`. For each one:

* **From the entry's `COMMAND_ADMITTED`** (`lifecycle._admitted`):
  * the plan (`payload["plan"]`);
  * the entry leg (`plan_ref.legs[0]`: instrument, product, `tick_size`);
  * `strategy`;
  * the session ID, as `session_id_for(SessionScope(AccountId(*account), calendar_id), trading_date)` from `dependencies.session_id`'s wire fields.
* **Levels:** `dict(plan["protective_levels"])` gives the stop and target as two-place strings, or `None`.
* **`q`, the account and the entry's end:**
  * `q` is the row's `owned_quantity`;
  * the account is `AccountId(*json.loads(row.account))`;
  * `entry_ended` is true when the entry command is `COMPLETED` or `REFUSED`.
* **The stop leg:** `leg_view(writer, pid, "stop", observation, now, max_age_secs=max_observation_age_secs, exit_open=…)`, with `observation = observations.latest(account)`.
* **`exit_open`:** the `protection_state` row's `exit_reason` is set, and the exit is not finished (below).
* **The policy:** the desire's recorded `policy`, through a new `ProtectionPolicy.from_resolved(d)` (the inverse of `resolved()`, refusing anything `protection_policy_from` refuses). Before the first desire it is the session's `BoundPolicy.protection`, else `ProtectionPolicy()`.

#### Step 1 changes to `leg_view` and the open exit (F-3, F-4)

* **The placement is the latest `close` command under the leg's prefix that obtained a broker order ID.** The live order and its chain follow from it, as before.
* **A placement that ended with no order ID** never placed a stop:
  * `DISPATCH_REFUSED`;
  * `REJECTED` with no ID;
  * resolved never reached and then refused.
* `LegView` gains `placement_failed: str | None`: `rejected` when the latest close ended `REJECTED` with no order ID, `refused` when it ended `REFUSED`, else `None`.
* **`ORPHANED` requires a live order** (`live_order_id` not `None`), not only a command.
* **An exit is open** while `q` > 0, or a live order exists and is not `ENDED`, or a placement or a cancel of the leg is pending. Step 1's rule ("`q` > 0 or the stop leg not `ENDED`") read a leg with no order as open for ever.

#### The seed and the first desire

At the first evaluation that finds `q` > 0 and no desire, protection records the first `PROTECTION_DESIRED`:

* **Level:** the plan's stop.
* **Quantity:** `q`.
* **Ladder:** `trail.seed(entry_premium=float(entry_facts.entry_premium), target=float(target), stop=float(stop), conviction=0.0, quantity=q)`. Both states are equal.
* **View:** the plan's `view_id`.

Two notes on the seed's values:

* **`entry_premium`.** The planner stores it as `format(premium, ".2f")` (`planner.py:253`), not `repr`. It is the chain LTP, a two-place price on a 0.05 tick, so `float()` returns the same value; the host read the plan's figure too.
* **The stop and target** are the planner's `to_tick` floats as text, and `float()` of them is exact.

**A plan with no `entry_facts` or no target gives no ladder.** Protection still places the stop at the plan level and records the desire with both states `{}`, which `_protection_shape` accepts for exactly this case. It never trails or tests tick exits on it, and it escalates once (`ladder_unseeded`).

#### The desire on every evaluation

Evaluated in this order. Each records through `record_desired`, which writes only when a field changed.

1. **Quantity.** When `q` differs from `desired_quantity` and `q` > 0, re-record with quantity `q` and every other field unchanged (CP-P4).
2. **A higher broker level** (POL-014, the host's adoption). When the leg is not `PENDING`, has a confirmed level, and `Decimal(confirmed_level) > Decimal(desired_level)`, re-record with that level, and with `ladder_state.sl = float(confirmed_level)` (only `sl` changes). This is how a human's completed modify that raises the stop is kept.
3. **The trail**, on a new bar (below).

#### The trail on a confirmed bar

* **The market port gains confirmed closes**, fixture-backed until SLICE-08: `MarketPort.closes(instrument, since: Timestamp) -> tuple[InstrumentClose, ...]`.
  * `InstrumentClose(instrument, ts: Timestamp, close: str)`, oldest first.
  * `ts` is the exchange time the close was confirmed, and `close` is a decimal string.
* **The bars** are built exactly as the host's `_premium_bars`. For the i-th close: `trail.Bar(ts=datetime.fromisoformat(close.ts.utc_iso), open=prev, high=max(prev, c), low=min(prev, c), close=c)`, with `c = float(close)`, `prev` the previous close, and the first bar flat. During NSE hours (03:45–10:00 UTC) the UTC and IST dates agree, so `_same_day` groups them as the host did.
* **History.** The closes with `ts` at or after the `event_time` of the entry's first `FILL` event (inclusive), as the host's `since`.
* **When a bar is cycled.** When there are at least two bars, and the latest close's `ts` is later than the last cycled bar's.
  * The last cycled bar is the desire's `view_id` when it has the form `bar:<instrument>:<utc_iso>`. Any other `view_id` (the plan's) means no bar has been cycled.
  * The quantity and adoption re-records keep the `view_id`.
* **Only the latest bar is cycled,** as the host. Bars skipped in between (a slow pass, or the kernel down) are a gap: step 5 records it, and it is never cycled.
* **The starting state.** `pos = from_state(ladder_state)`, then:
  * **While the leg is `PENDING`**, nothing more: the move may yet land. The live host never had a pending modify across a bar, so this case is this step's decision.
  * **Otherwise, when the desire's level is not confirmed** (the move was refused, rejected or withheld), `pos.sl` is put back to the highest of:
    * the `ladder_state` `sl` of the newest `PROTECTION_DESIRED` whose `desired_level` equals the leg's confirmed level;
    * `float(confirmed_level)`;
    * the plan stop, when nothing is confirmed.

    Only `sl` changes, which is Q-025 B applied across any number of bars.
* **The cycle.** `trail.step(settings, pos, bar_index=len(bars) - 1, bars=bars, delta=None, opposing_score=None)`. The new desire has:
  * level `level_of(round(st.accepted.sl, 2), up=True, tick_size=leg.tick_size)`;
  * quantity `q`;
  * `ladder_state = to_state(st.accepted)`, `ladder_state_if_refused = to_state(st.refused)` (evidence);
  * `view_id = bar:<instrument>:<ts>`.
* **No cycling** when the policy's `enabled` is false, the ladder is unseeded, the leg is `ENDED`, or an exit is open, as the host stops trailing a stop whose cancel was accepted (`:5537-5540`).

#### The stop leg's requests

Each evaluation acts on the leg, at most one request per leg per pass, in this order.

1. **A retry first.** When the leg's latest command is `ADMITTED` and its latest attempt is `NOT_SENT` with no retry requested (after `OUTCOME_NOT_SENT` or `RESOLVED_NEVER_REACHED`), protection rebuilds the request from its `COMMAND_ADMITTED`, using the coordinator's `action_request_from_wire`, not from the current desire. It then calls `admit`, which reaches `existing_or_retry` and records `DISPATCH_RETRY_REQUESTED`.
2. **Otherwise, nothing** while any of the leg's commands is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING`.
3. **Otherwise**, by the derived state (`account` and keys as above):

| Leg | Request (principal `kernel:protection`) |
|---|---|
| `DESIRED`, no live order, `placement_failed` `None`, `q` > 0 | `CloseRequest(prot:<p>:stop:<n>, account, pid, q, StopOrder(desired_level))` (`trigger_only`) |
| `DESIRED`, no live order, `placement_failed` `rejected` | none; escalate `stop_rejected` once. Nothing is re-placed |
| `DESIRED`, no live order, `placement_failed` `refused` | a fresh placement, as the first row, under the refusal memory (below) |
| `DESIRED`, live order; level or quantity differs | `ModifyRequest(prot:<p>:stop:<n>, account, live order, ModifyChanges(trigger_price=desired_level if the level differs, quantity=filled + q if the confirmed quantity differs from q))` |
| `ORPHANED` | `CancelRequest(prot:<p>:stop:<n>, account, live order)` |
| `ENDED` | none; the escalations below |
| `CONFIRMED` | none |

* **A rejected modify** (the latest command `REJECTED` with that same trigger and quantity) is not resent (F-P11). The next desire with a different level or quantity submits.
* **Through the market.** A trail modify whose level is at or above the close of the bar just cycled is not sent, and is escalated once (`level_through_market`). The placement is not checked, as the host's basket was not. A modify that only changes the quantity is not checked.
* **The pre-checks.** Before submitting, protection runs the read-only checks admission will apply, with `admission.action_facts(request, order, position, observation)` and the targets from `holdings`:
  * **Kill** (`Safety.check`). Under kill `kernel:protection` is always refused, so nothing is submitted. Escalated once by request type:
    * a placement or a quantity raise: `unprotected_under_kill`;
    * a cancel: `orphan_under_kill`;
    * a step of an exit: `exit_under_kill`, or `square_off_under_kill` for a square-off.
    * A trail level move under kill only records the desire (CUJ-PRT-3).
  * **A hold, with `safety.hold_automatic_actions: refused`.** Nothing is submitted. A placement or raise escalates `unprotected_under_hold` once (spec "No requests under a refusing condition"); other requests wait silently.
  * **The conflict relation** (`Conflicts.check`): the request waits, silently, and is retried at the next evaluation.
  * **B1's observation age and B2's `effect_check`** (`admission.py:393`): the request waits. That covers a positions book that lags the ledger's fill.
* **The refusal memory**, read from the ledger, so it survives a restart. After the leg's newest refusal (an `ADMISSION_REFUSED` with a `prot:<p>:stop:` key, or a `DISPATCH_REFUSED` of one of its commands), no request is made for that leg until one of these is committed after the refusal's sequence:
  * a safety event (`KILL_*`, `HOLD_*`);
  * any event of a command on the position or its live order;
  * a `FILL` on the position;
  * a desire with a different level or quantity.

  A freshness refusal (`ADM-R05`) also clears on a newer observation cycle, so at most once per poll interval. So a degraded system records at most one refusal per change of its inputs (PRF-PRT-09).

#### Escalations

* **A shared helper.** `lifecycle.escalate(writer, subject, reason, *, principal, observation_digest=None, excess=None, evidence=()) -> bool` replaces the closure inside `reconcile`. It records `RECONCILIATION_ESCALATED` with episode 0, returns True when it committed and False on `LED-R09` (already recorded), and raises `WriterLost` on any other refusal. `reconcile` keeps its behaviour, appending to its result when the call returns True.
* **Protection's escalations.**
  * The subject is the `position_id`, with the latest observation's digest when one was read.
  * Each reason is recorded once per position.
  * **Spec amendment:** the spec's "until its condition clears" needs episodes, which step 3 builds for the holds, so step 2 records once per position. A second kill episode on the same position is visible as `KILL_ENGAGED` in the ledger.
* **The reasons step 2 records:**
  * `stop_rejected` and `stop_expired`: the leg `ENDED` with reason `broker` and an observed status `rejected` or `expired`, or a placement `REJECTED` with no ID;
  * `protection_ended_external`: only when a fresh observation shows the live order `cancelled`, `rejected` or `expired` with no matching cancel command;
  * `level_through_market`, `ladder_unseeded`, `square_off_unscheduled`;
  * `exit_close_rejected`, `exit_close_incomplete` (the exit sequence);
  * `square_off_entry_working` (square-off);
  * the kill and hold reasons above.
* **New reasons are spec amendments** to the event catalogue's list: `ladder_unseeded`, `protection_ended_external`, `square_off_unscheduled`, `square_off_entry_working`, `exit_close_rejected`, `exit_close_incomplete` and `unprotected_under_hold`.
* **Ends that escalate nothing:**
  * `human:<key>`, `fill`, `exit` and `orphan`;
  * `fill_pending`, which waits for the fill;
  * a ledger end with no fresh row, which waits for one.

#### Tick exits (`stop_on_fill` only)

**Deviation (from the live host):** the live host ran no tick exits; under its basket the target rested at the broker. `stop_on_fill` has no resting target, so the spec's target tick exit is the only target it has.

* **The market port gains** `latest_tick(instrument) -> Tick | None`, with `Tick(instrument, price, delta, at)`: `price` in money form, `delta` a decimal string or `None`, and `at` in the `exchange` domain. Only the latest tick is read, so ticks are coalesced by construction.
* **A tick is used only when** `at` is at or after the entry's first `FILL` event time and within `max_observation_age_secs` of the clock, and the ladder is seeded. Any other tick is ignored.
* **The test.** `premium_exit(settings, from_state(ladder_state), float(price), delta)`:
  * `premium_sl_hit` does nothing, because the broker's stop executes.
  * `premium_target_hit` records `EXIT_STARTED` (reason `target`, cause `{"price": price, "at": at.utc_iso}`) once per position. It is not recorded while kill or a refusing hold would withhold the sequence; it escalates `exit_under_kill` once instead.
  * **Deep-OTM** ([Q-026](../../decisions/owner-questions.md#q-026), option A): the tick's `delta` (`float`, or `None` when the tick has none) is passed, and `DeepOTM_delta_…` records `EXIT_STARTED` (reason `deep_otm_delta`, the same cause shape) once per position, under the same kill and freshness rules. **Deviation (from the live host)**, by the owner's decision: the host never ran it.

#### The exit sequence

While an exit is open (above), it replaces the stop leg's own requests:

1. **Cancel the stop.** While a live order rests and is not `ENDED`, cancel it (`prot:<p>:stop:<n>`), by the same one-request, retry and refusal-memory rules.
2. **Close only when the whole chain is accounted for** (F-1). Every order in the leg's chain must have a fresh observed row (within `max_observation_age_secs`) that is terminal and whose `filled_quantity` equals the fills recorded for it, and the leg's end reason must not be `fill_pending`. So `q` includes every fill of the stop.
3. **Then, if `q` > 0,** submit `CloseRequest(prot:<p>:close:<n>, account, pid, q, MarketOrder())`.

* **The `close` role follows the same rules:** one request at a time, the retry first, and the refusal memory.
* **No close while a human principal's close of the position is unresolved.** Conflict row 2 already makes it wait.
* **A close that ends `REJECTED`** is escalated once (`exit_close_rejected`) and never resent, as `session_close.py:170-175`. The broker's square-off is the backstop.
* **A close that `COMPLETED` `order_ended` with `q` still > 0** is escalated once (`exit_close_incomplete`) and not resent.
* **The exit finishes** when `q` ≤ 0 and no live order rests. A stop found filled ends the leg with reason `fill`, and with `q` = 0 nothing is sent (`session_close.py:209-214`).
* **The sequence resumes** after a restart and after `SESSION_CLOSED` (CP-P3).
* **Under kill** it submits nothing and escalates once.

#### The session-close exit

* **The square-off instant** is the session's `trading_date` at `square_off_time` in exchange time.
  * Exchange time comes from a new field on the calendar port's `TradingDay`, after `_: KW_ONLY`: `utc_offset_minutes: int | None = None`. `FakeCalendar.day` sets 330.
  * A calendar of `None`, a `Holiday`, an `Unavailable` result or a `None` offset leaves square-off unscheduled. It is escalated once per position (`square_off_unscheduled`), and the broker's square-off is the backstop.
* **When.** On every evaluation at or after the instant, with `session_close: square_off`, while the session is `OPEN`, or after a restart before `SESSION_CLOSED`. Each subject with `q` > 0 or a resting stop, and no exit recorded, gets `EXIT_STARTED` (reason `square_off`, cause `{"session_id": …}`) and the exit sequence.
  * So a position that fills after the instant is still closed, as the host's every-pass check.
* **An entry still working** (`ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING`) is skipped, as the host skips a partly filled entry (`session_close.py:146-152`). It is escalated once (`square_off_entry_working`), and the broker's square-off is the backstop. It is evaluated again on later passes, after the entry ends.
* **With `session_close: broker`** nothing is recorded or sent.
* **Under kill:** see the exit sequence.

#### The structure-action map

No structure is admitted (Q-020), so step 2 adds no structure code. The spec's map rows are carried by the `stop_on_fill` rules above. `replace_protection` is not automatic: it falls under the no-re-placement rule.

#### TASK-S06-01's characterizations

* **Legacy re-placement:** none exists (above).
* **The marketable-stop alternative**, which modifies the trigger through the market instead of cancelling then closing: legacy never did it, and step 2 does not build it. It stays a recorded alternative in the spec's risks.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/protection.py` | `ProtectionLoop`; `leg_view`'s placement rule, `placement_failed`, `ORPHANED` needing a live order, the open-exit rule |
| `src/autonomous_trading/kernel/trail.py` | `step`'s refused outcome: the host's put-back (Q-025 B) |
| `src/autonomous_trading/kernel/lifecycle.py` | `escalate(...)`, shared; `reconcile` uses it |
| `src/autonomous_trading/kernel/coordinator.py` | `protection` attribute; `run_pass` calls `run_once()` after the drain in `OPERATING`; crash points `CP-P1`, `CP-P4` in `FaultPlan` |
| `src/autonomous_trading/kernel/ports.py`, `contracts/market.py` | `MarketPort.closes`, `MarketPort.latest_tick`, `InstrumentClose`, `Tick`; `TradingDay.utc_offset_minutes` |
| `src/autonomous_trading/contracts/decisions.py` | `ProtectionPolicy.from_resolved` |
| `src/autonomous_trading/kernel/ledger/store.py` | `_protection_shape` accepts both states `{}` together |
| `src/autonomous_trading/bootstrap.py` | Composes the loop under `stop_on_fill`; `Composition.protection` |
| `scripts/gen_trail_parity.py`, `tests/fixtures/trail_parity_445eb116.json` | The host's put-back for `refused`; regenerated |
| `tests/conftest.py` | `ADMISSION_SETTINGS` binds `basket_at_plan`; `FixtureMarket.closes`, `latest_tick`; `FakeCalendar.day` offset 330; `protected_plan` (below) |
| `tests/unit/test_protection_states.py` | The step's unit tests; step 1's `test_two_outcomes` updated |
| `tests/integration/test_protection_kernel.py` | New: CUJ-PRT-1 (no worker exists), CUJ-PRT-4, CP-P3, the exit sequence |
| `tests/recovery/test_crash_boundaries.py` | CP-P1, CP-P2, CP-P4 |
| Spec amendments | The protection spec: the new escalation reasons; once per position until step 3's episodes; the open-exit rule; the trail's host inputs (bars from closes, `round(sl, 2)`, conviction 0.0, filled quantity) |

### Step 2 tests

All values are labelled synthetic. **`protected_plan`** is `make_plan` with:

* `protective_levels (("stop", "15.00"), ("target", "30.00"))`;
* `entry_facts = EntryFacts("20.00", "0.5", "0.3", "1.0", "0.0", "5.0")`;
* the leg's `tick_size` `"0.05"`.

Worlds are `admission_world(policy=OFF, plan=protected_plan, kernel_positions=True, loop=True, admission_settings=dict(LOOP_SETTINGS, protection_placement="stop_on_fill"))`. The closes are fed through `FixtureMarket.closes`.

* **The ladder (PRF-PRT-02):**
  * the regenerated golden cases;
  * a moving bar's refused outcome differs from the accepted one only in `sl`;
  * bars from closes equal the host's `_premium_bars` on a fixed list, the first one flat.
* **The loop on a filled entry (PRF-PRT-01, `stop_on_fill`):**
  * **Placement and quantity:**
    * the first `FILL` records the seed desire (conviction 0.0, quantity `q`) and places one stop at 15.00 for `q`, while the entry is still `WORKING`;
    * a later fill re-records the quantity and raises the stop by a modify to `filled + q`.
  * **Trail modifies:**
    * a ratcheting bar records a desire at `level_of(round(sl, 2), up=True)` and submits one modify;
    * two new closes between passes cycle only the latest, and the desire equals `trail.step` on the latest bar alone;
    * a second bar while the modify is `PENDING` records a desire and submits nothing;
    * a modify `PENDING` over a bar, then rejected: the next bar starts with `sl` put back to the newest confirmed desire's `sl`, every other field from the latest state;
    * a rejected modify is not resent at that level;
    * a human's completed modify raising the stop is adopted at once, and protection never modifies it down;
    * an older or equal close cycles nothing, and fewer than two bars cycle nothing;
    * the history never includes a close before the first fill;
    * on the `opposing` golden path the desire equals the no-score step.
  * **Placement failures:**
    * a placement refused at dispatch is placed again under the refusal memory;
    * a placement rejected with no order ID escalates `stop_rejected` once and is never re-placed;
    * a broker-rejected resting stop escalates `stop_rejected` once and is never re-placed.
  * **Ends:**
    * an `ORPHANED` leg is cancelled, and a leg with no live order is never `ORPHANED`;
    * a human cancel ends the leg and nothing is re-placed.
  * **Other rules:**
    * a trail level through the market is escalated and not sent;
    * `NOT_SENT` is resubmitted under the same key with `DISPATCH_RETRY_REQUESTED`;
    * an unseeded plan places the stop, escalates `ladder_unseeded`, and never trails.
* **Tick exits:**
  * a fresh target tick records one `EXIT_STARTED` and runs the sequence to the close, even after the price moves back;
  * a stale tick, or one from before the fill, does nothing;
  * a stop tick does nothing;
  * a deep-OTM tick (delta 0.05) records `EXIT_STARTED` `deep_otm_delta` and runs the sequence, and beats a target tick at the same time;
  * a tick with no delta never starts a deep-OTM exit;
  * a target tick under kill records no exit and escalates once.
* **The exit sequence:**
  * the close is never submitted while the stop rests;
  * a stop that partly filled, was then cancelled and has its fill recorded late is closed only for the true `q`, after the fill is recorded;
  * a stop found filled sends no close;
  * a rejected close is escalated once and not resent;
  * a position whose stop was never placed (placement under kill) is still closed at square-off after the kill is released.
* **Session close (PRF-PRT-07):**
  * `square_off` at 15:13 IST runs the sequence;
  * a position filled after 15:13 is closed on a later pass;
  * an entry still working is skipped and escalated once;
  * `broker` sends nothing;
  * no offset escalates `square_off_unscheduled`.
* **Kill and holds:**
  * under kill, desires are recorded, nothing is submitted, and each kill reason is escalated once over ten passes;
  * a hold with `allowed` proceeds;
  * a hold with `refused` withholds the placement and escalates `unprotected_under_hold` once.
* **Degraded passes (PRF-PRT-09):**
  * ten passes with a conflicting command record no `ADMISSION_REFUSED`;
  * a refusal that does happen is recorded once until a change is committed;
  * desires cite their bar `view_id`, exits their tick or session, and escalations their observation digest.
* **Composition:** the loop is not composed under `basket_at_plan`, and does not run before `OPERATING`.
* **Crash points (PRF-PRT-03), in `test_crash_boundaries.py`.** They use the existing child-process pattern (`FaultPlan`, `_crash_point`, exit 86). The parent reopens the ledger and seeds the book with `queue_cycle` on a `ScriptedObservationPort` showing the stop:
  * **CP-P1:** a crash point between `record_desired` and `admit`. After `OPERATING`, exactly one request is admitted.
  * **CP-P2:** a modify left `UNCERTAIN` (the `unresolved` helper) before the reopen. No second modify is sent, and the leg confirms from the book.
  * **CP-P4:** a crash point after a fill's `FILL` commit and before the raise. One modify follows.
* **Break checks** (named in the docstrings), each failing a test above:
  * cycle every bar since the last one instead of the latest;
  * show the ladder closes from before the first fill;
  * pass an opposing score;
  * keep the library's refused outcome;
  * start from `ladder_state` after a rejected modify;
  * build bars from real OHLC instead of consecutive closes;
  * send `level_of(sl)` without `round(sl, 2)`;
  * submit while the leg is `PENDING`;
  * resend a rejected modify at the same level;
  * submit under kill;
  * re-place a rejected stop;
  * close before the chain is accounted for;
  * drop the refusal memory;
  * pass no delta to `premium_exit`;
  * run protection before `OPERATING`.

### Step 2 as built

Commit `e27a436` on `slice-06`, on top of step 1's `03bbbde`. It changes 15 paths (1,573 lines added, 48 removed). The files match the step's table, except where the table below says otherwise. The golden cases were regenerated against the same legacy checkout with the host's put-back for `refused`. All 120 refused outcomes differ from the accepted one only in `sl`. SHA-256 `985251fdc146df57fec541e36ed278dab23f2c3721406a35e66ba8817250f464`.

**Choices made while building** (none sets a money value; every test value is labelled synthetic):

| Topic | As built |
|---|---|
| `ProtectionLoop`'s constructor | `ProtectionLoop(coordinator, *, market, calendar, policy)`. Safety, conflicts, holdings, observations and settings are read through the coordinator's action admission, so protection's pre-checks use exactly the objects admission uses |
| The cycle's start | When the leg is not `PENDING` and its confirmed level is above the starting `sl`, `sl` takes it whether or not the last move landed. That is the host's adoption of the recorded, tick-rounded level before every cycle (`:5468-5470`); the text stated it only for the put-back case |
| `DSP-R01` in the refusal memory | Clears after one poll interval, like `ADM-R05`. A placement refused for its dispatch deadline would otherwise never be placed again |
| The session | Square-off and the pre-desire policy read the account's `OPEN` session row, not a parsed `dependencies.session_id` |
| `MarketPort.closes` | Takes `since` as a UTC ISO string: the `event_time` of the entry's first `FILL` |
| A plan with no stop | Escalates the spec's existing `no_stop_planned` once and records nothing more |
| The through-market check | Reads the latest close the pass read |
| The trailed level | One function, `protection.trail_level(sl, tick_size)`, which a test exercises at the tick boundary |
| `lifecycle.escalate` | `reconcile`'s inner function keeps its name and calls the shared one through the alias `_escalate` |
| `PassReport` | Gains `protected`: what the loop recorded and submitted that pass |
| Test files | The step's tests are in a new `tests/unit/test_protection_loop.py`, not `tests/integration/test_protection_kernel.py`. CP-P3 is a child-process test in `test_crash_boundaries.py` with the other crash points |
| Test worlds | Compose the kernel's own Safety and Conflicts (`kernel_safety`, `kernel_conflicts`), so kill, holds and conflict row 2 act as in production. Kill and holds are engaged after the entry is admitted, since they refuse the entry itself |
| Crash children | `build_admission_world` gains `build_options` (funds, book start, settings). After a reopen the new simulated broker's book is seeded as the old one stood, a test seam on the simulated book |

**Found while testing.** RISE (20.00 → 29.00) activates at 23.50. A ratchet's final stop depends only on the latest close, so the latest-close test uses a 30.00 peak then 27.00. A human's `UNCERTAIN` modify is resolved never reached on the next cycle, which frees the group, so the degraded-pass test uses a `WORKING` modify that the book never confirms.

**Tests** (763 passed, twice, with `pytest` in the slice's virtual environment on the development machine; no broker variables; nothing reached a deployment):

| File | Cases |
|---|---|
| `test_protection_loop.py` (44, new) | **Placement:** the first fill's seed and one stop. **Trail:** bars from closes; `trail_level`; a rising path equal to the host's step bar by bar; latest close only; no close before the fill; fewer than two bars; a pending modify; a rejected modify not resent, with only `sl` put back; a human raise adopted. **Quantity:** a later fill raised. **Placement failures:** refused at dispatch then re-placed; rejected and escalated; a resting stop rejected. **Ends:** a human cancel; an orphan cancelled. **Other rules:** through the market; `NOT_SENT` retried; an unseeded plan. **Tick exits:** target, deep-OTM and its precedence, four ticks that start nothing, kill. **Exit sequence:** a late partial fill, a stop found filled, a rejected close. **Square-off:** runs, after-the-instant fill, a working entry, `broker`, no offset. **Kill and holds:** under kill, after release, both hold settings. **Degraded:** no refusals; one refusal until a change. **Composition:** not composed under `basket_at_plan`; not run before `OPERATING`. **Policy:** `from_resolved` |
| `test_crash_boundaries.py` (+4) | CP-P1, CP-P2, CP-P3, CP-P4 in a child process exiting 86, reopened in the parent |
| `test_protection_states.py` | Step 1's `test_two_outcomes` for the host's put-back; the regenerated golden cases |

**Break checks** (each applied with every anchor checked first, run against `test_protection_loop.py` and `test_protection_states.py`, and reverted byte for byte with an md5 check; every one failed). Three survived the first run, because their tests could not tell the change apart. They were strengthened (the 30.00 peak; the oracle over every bar with a pre-fill close; a non-rising bar after the rejected modify), and then all failed:

| Change | Test that failed |
|---|---|
| Cycle every bar since the last one | `test_only_the_latest_close_is_cycled` |
| Show closes from before the fill | `test_closes_before_the_fill_are_never_shown` |
| Pass an opposing score | `test_a_rising_path_records_each_bar_and_moves_the_stop` |
| Keep the library's refused outcome | `test_every_golden_case_is_reproduced_exactly` |
| Start from `ladder_state` after a rejected modify | `test_a_rejected_modify_is_not_resent_and_the_next_bar_puts_back_only_sl` |
| Bars from real OHLC | `test_bars_are_built_from_consecutive_closes_as_the_host` |
| `level_of(sl)` without `round(sl, 2)` | `test_the_trailed_level_is_rounded_to_two_places_then_up_to_the_tick` |
| Submit while `PENDING` | `test_the_first_fill_seeds_the_desire_and_places_one_stop` |
| Resend a rejected modify at the same level | `test_a_rejected_modify_is_not_resent_and_the_next_bar_puts_back_only_sl` |
| Submit under kill | `test_under_kill_the_desire_is_recorded_and_nothing_is_submitted` |
| Re-place a rejected stop | `test_a_placement_rejected_by_the_broker_is_escalated_never_re_placed` |
| Close before the chain is accounted for | `test_a_partial_stop_fill_recorded_late_is_closed_only_for_the_true_quantity` |
| Drop the refusal memory | `test_a_placement_refused_at_dispatch_is_placed_again` |
| Pass no delta to `premium_exit` | `test_a_deep_otm_tick_starts_the_exit_and_beats_the_target` |
| Run protection before `OPERATING` | `test_protection_never_runs_before_operating` |

## Step 3 — basket placement

The authorities are:

* the protection spec's [Basket placement](../../design/protection-and-safety.md#basket-placement-basket_at_plan-kernelprotectionpy) section, its crash points CP-B1…CP-B6, and F-P15…F-P25;
* the execution-domain spec's [OpenAlgo adapter](../../design/execution-domain-and-observations.md#openalgo-adapter-adaptersopenalgopy) basket clauses and its `LEG_ASSIGNED` rule;
* the ledger spec's `PlanRef.protective_legs`, `ProtectiveLeg` and `LEG_ASSIGNED`.

The step builds on step 2 as built (OA_NEW `e27a436`). Fresh EGM design and implementation-readiness reviewers reviewed it ([review](../../egm/plan/review.md#slice-06-step-3-review-2026-10-28)), and their findings are resolved in the text below. `basket_at_plan` is the first-release placement ([Q-013](../../decisions/owner-answers-2026-10-27.md)).

**The rule for choices** is step 2's: where the live host and the spec differ, the text follows the host and says so. The exception is five rules the spec adds beyond the host. They are written as the spec says and each is marked **[Q-027 item n]**. The owner chose option A, the spec's rules, for all five ([Q-027](../../decisions/owner-questions.md#q-027)); the option B text stays as the recorded alternative.

### What legacy does

All citations are at 445eb116. `RFL` is `scripts/run_framework_live.py` (read with `git show`); the rest is under `src/`.

* **The basket** (`core/framework/execution/orders.py:155-214`).
  * The legs are `[entry, stop?, target?]`.
  * The protective legs take the side opposite the entry, the entry's full quantity and the entry's product (`:199-201`).
  * The stop is `SL-M`, `trigger_price` = the stop, `price` 0.0 (`:209-210`). The target is `LIMIT`, `price` = the target, `trigger_price` 0.0 (`:212-213`).
  * A stop or target of 0 or less adds no leg (`:173-175`).
  * Both are priced from the plan's premium, not the fill (`:179-186`). They are rounded the tight way (`:256-269`).
* **The send** (`runtime/execution_gateway/__init__.py`).
  * One `basketorder` call, `{"orders": [...], "strategy": …}` (`:678-689`, `:736-762`).
  * Roles come from one fresh `orderbook` read after a multi-leg response with IDs (`core/basket_observation.py:44-77`). The join (`core/framework/execution/basket_identity.py:48-180`) matches symbol, exchange, product, action, price type and quantity. Prices are compared within 0.05 (`:17`): the trigger for `SL-M`, the price for `LIMIT`, both for `SL` (`:57-65`).
  * **A join that is not fully valid** leaves the entry `UNKNOWN`. That covers a failed read, an unmatched ID, a count mismatch, a duplicate ID, a failed row that carries an ID, or a malformed row (`:96-147`; gateway `:1108-1139`). Reconciliation later re-runs the join on a fresh book (`core/framework/execution/reconcile.py:480-573`). One that stays ambiguous holds the strategy (RFL `:2921-2929`) **[Q-027 item 5]**.
  * **A proven entry with a protective leg missing** is accepted with reason `PARTIAL: …`, with no hold (`basket_identity.py:170-180`; gateway `:1810-1821`).
* **After fills (RFL).**
  * A protective fill is a close of the entry's position (`:6176-6204`).
  * Any recorded close cancels every other protective leg whole (`_cancel_resting_siblings`, `:4588-4664`, called at `:6647-6649`) **[Q-027 item 1]**.
  * A cancel that fails holds the strategy at once (`:4668-4687`) **[Q-027 item 4]**.
  * An overclose holds and sends nothing (`_report_overclose`, `:5631-5664`).
* **Partial and unfilled entries.**
  * The legs stay at the planned quantity. A partly filled row is neither trailed (`:5522`) nor squared off (`session_close.py:144-152`) **[Q-027 item 2]**.
  * An entry that never fills, or whose entry leg is rejected, leaves its legs resting **[Q-027 item 3]**.
* **The trail** modifies the basket stop (`stop_id` from `protective_roles`, `:5533-5534`) with quantity `filled − closed`, the position's remaining quantity (`:5236-5237`, `:5262-5268`).
* **The target is never modified** (gateway `:1356-1360`).
* **Square-off** cancels both legs, then closes on a later pass when both show cancelled or rejected; a leg found `complete` means no close (`session_close.py:182-220`).
* **Holds.** Legacy keeps one hold per strategy, which guards only new submits and is cleared only by a person (`core/framework/execution/holds.py:39`, `:57-59`, `:125-134`, `:188-209`). **Deviation (from the live host)**, already built in SLICE-05: the kernel keeps one hold per reason, released one reason at a time.

### Decisions

#### Contracts, the wire form and the plan

* **`ProtectiveLeg(leg_role, instrument, product, side, quantity, order)`** in `contracts/execution.py`. `leg_role` is `stop` or `target`, and `side` `SELL`, the only value. `order` is `StopOrder` for the stop and `LimitOrder` for the target. `PlanLeg` stays BUY-only.
* **`PlanRef.protective_legs: tuple = ()`**, a keyword field.
  * `wire()` gains `ProtectiveLeg`: `{leg_role, instrument, product, side, quantity, order: {kind, …}}`, the order as `wire` writes it today.
  * `wire(PlanRef)` omits `protective_legs` when it is empty, so every payload already written is unchanged.
  * `plan_ref_from_wire` parses it, defaulting to `()`.
  * `admission.plan_digest` removes `protective_legs` as well as `plan_digest`, so a basket's digest is its plan's (the spec).
  * The legs are recorded in `COMMAND_ADMITTED`'s `plan_ref`, and `Coordinator._rebuild` requires their byte-exact round trip like every other field. `request_digest` covers only the `EntryRequest`, as today.
* **`kernel.protection.basket_legs(plan, *, stop_order_type) -> tuple[ProtectiveLeg, ...]`**, legacy's `build_basket`. The spec writes `(plan, policy)`; placement and order type are settings, not policy fields, so the parameter is the setting.
  * `stop` when `Decimal(dict(plan.protective_levels)["stop"]) > 0`, as `StopOrder(trigger=stop)` (`trigger_only`: no limit).
  * `target` when the target is set and `> 0`, as `LimitOrder(price=target)`.
  * Each takes the entry leg's instrument, product and quantity.

  The planner has already rounded both the tight way (`planner.py:212-214`).

#### Admission

Under `self.s.protection_placement == "basket_at_plan"`, after planning and the reserved-role check:

* **A one-leg plan with `limit_price` set** is refused: `ADM-R13` `plan_refused`, check `P`, stage `placement`, reason `limit_entry_in_basket` (F-P23).
* **A one-leg plan** gets `dataclasses.replace(ref, protective_legs=basket_legs(plan, stop_order_type=self.s.protection_stop_order_type))`. A plan with more than one leg gets none: structure legs are `stop_on_fill`, and none is admitted (Q-020).
* **A subject is a basket** if and only if its admitted `plan_ref` has protective legs. Bootstrap composes the protection loop under both placements. Each subject follows its own admitted placement, so a rebinding never changes a live position's rules.
* **Capacity and exposure stay the entry leg's:** B5's plan totals, `resulting_exposure`, and the single reservation. A protective leg carries no capital, and its rejection reduces nothing (no I-6 change).
* **External commitments.** They skip every order ID under an entry command whose `plan_ref` has protective legs, whatever its role, as well as protective orders. So an unassigned basket ID is never counted as foreign capital.
* **A plan with no stop** sends the entry and the target, as legacy does, and protection escalates `no_stop_planned` once at the first fill.

#### The send

* **`TransportResult.unassigned_order_ids: tuple = ()`** is new. The coordinator's outcome draft writes it, in place of today's `[]`. Both adapters publish it in their evidence, and `recover` rebuilds it from that evidence.
* **One `LegResult` per role:** the entry, then each protective leg.
  * A role whose ID the join could not assign gets `LegResult(role, "ambiguous", None, "role_unassigned")`.
  * **Command class:** `acknowledged` if any leg is acknowledged and none is ambiguous; `rejected` if every leg is rejected; otherwise `ambiguous`. So any unassigned role makes the entry `UNCERTAIN`, as legacy's `UNKNOWN`.
* **Every ambiguous result the coordinator itself builds** for a basket entry lists every role of the admitted `plan_ref` with `None`: the adapter-error result, the interrupted `recover` result and the deadline result. So recovery and `resolve_attempt` can name each one.
* **`BasketTicket(entry: SendTicket, legs: tuple[SendTicket, ...])`.** `send_ticket` builds it for an entry with protective legs: the stop's ticket is `order_kind` `stop`, SELL, with the trigger; the target's is `limit`, SELL, with the price.
* **Products of protective legs.** `send_ticket`'s `_leg_product`, and `ledger_view`'s `target_level` for a modify of an entry-owned order, read `plan_ref.protective_legs` for the roles `stop` and `target`. So a basket leg's modify can be ticketed, and a timed-out one resolved (CP-B4).
* **The simulated broker** books the entry and each protective leg it acknowledges: the stop with its trigger, the target with its price, both SELL.
  * **`"legs": {"stop": "S1", "target": "T1"}`** names their IDs. A role mapped to `null` is rejected in the response.
  * **`"unassigned": {"X1": "target"}`** books `X1` as that role's order but returns it with no role. The tests use this for the later join.
  * **A step with no `"legs"` key** returns each protective leg `not_sent` (`unscripted`) and books none, so existing scripted tests keep their books.
  * **`timeout`** returns every role `ambiguous`.
* **The OpenAlgo adapter.** `_send` stops refusing `protective_legs` for a one-leg plan; more than one entry leg is still `basket_unsupported`.
  * **The call.** It sends `basketorder` with `{"strategy": …, "orders": [entry, stop, target]}`, each leg exactly as `orders.py:191-213`.
  * **The in-send read.** When more than one leg was sent and the response carries IDs, one `orderbook` read follows within the same total deadline. It is taken from a new constructor argument `read_budget: Callable[[AccountId], bool] | None`, the observation loop's per-account budget. An exhausted budget, a failed read or no read time left means every ID stays unassigned. The read is published with the send's evidence, under the attempt's key, as the request, the response and the book.
  * **The join** works on `ObservedOrder`'s fields. For each returned ID, its row must match exactly one unassigned requested leg on instrument, side and quantity, and on price type:
    * a non-zero `trigger_price` with no price is `SL-M`, the stop, compared on the trigger;
    * a price with no non-zero trigger is `LIMIT`, the target or a limit entry, compared on the price;
    * both set is `SL`, compared on both.

    Values match within 0.05 (legacy's `_PRICE_TOLERANCE`), and the BUY row at index 0 is the entry.
  * **Deviation (from the execution-domain spec)**, for live-host parity: the 0.05 tolerance replaces "exact, on the tick grid". **Deviation (from legacy):** exchange and product are not compared, because `ObservedOrder` does not carry them. TASK-S07-05 adds them to the contract if the endpoint gives them.
  * **What is ambiguous:**
    * a count mismatch, a duplicate ID, a failed row that carries an ID, or a malformed row, as legacy (`basket_identity.py:96-147`);
    * an ID with no match, which goes to `unassigned_order_ids`.
  * **The response shape** (`{"status", "results": [{"status", "orderid"}, …]}`) is read as legacy's `basket_observation.py:20-41`. No capture exists at 445eb116, so the body and response are confirmed against one in TASK-S07-05 before live use; the tests use labelled synthetic responses.

#### `LEG_ASSIGNED` and the role-less rows

* **The `OUTCOME_*` and `RESOLVED_REACHED` folds** insert a `broker_identity` row with `leg_role` `NULL` for each ID in `unassigned_order_ids`, under the command key.
* **`LEG_ASSIGNED`** is a new event: family `lifecycle`, principal `kernel:lifecycle`, payload `attempt_no`, `broker_order_id`, `leg_role` and `observation_digest`.
  * Its fold sets that row's `leg_role` and the attempt's `legs` entry, and removes the ID from `unassigned_order_ids`.
  * A row that already has a role, or no row, is `LED-R09`.
  * `_FAMILY`, `_load_touched` (the identity row, the attempt) and `events.schema.json` gain it.
* **Reconciliation commits it** when an unassigned ID's row matches exactly one unassigned role by the same join on a fresh, complete orderbook.
* **A fill on a role-less order waits** (`reconciliation.py:406-407`) and is recorded after the assignment.
* `RESIDUAL_RECORDED` is not needed: a basket has one entry leg, and protective legs never count.
* **[Q-027 item 5]** Under option A an unassigned role escalates `protective_roles_unassigned` once, and protection submits nothing for the subject until every role is assigned (the spec). Under option B, as legacy, an entry still `UNCERTAIN` with an unassigned role after `reconciliation.working_escalation_secs` also engages a hold (reason `basket_unresolved`).

#### Completion and resolution

* **The entry completes on its entry leg alone.** `_entry_completion` gains a rule: when the plan's only leg was rejected or never reached, the entry completes `order_ended` with `filled_quantity` 0. The reservation is then released, and conflict row 1 frees the underlying (F-P15's precondition).
* **`lifecycle.resolve_attempt`** takes its roles from the admitted `plan_ref` (the entry and protective roles), not the attempt's `legs`. It is one call that names every role, as an ID or `None` (CP-B2). An entry leg named `None` with protective legs named completes the entry `order_ended` at 0, and the legs become orphans **[Q-027 item 3]**.

#### Protective fills

A `FILL` on an order whose role is `stop` or `target`, under an entry command:

* **In `fill_draft`:**
  * The quantity is negative.
  * The position is the entry leg's (`position_id(entry key, plan_ref.legs[0].leg_role)`).
  * `reservation_before` and `reservation_after` are null.
  * No `late_fill`, `over_reduction` or settlement check applies. `ledger_view`'s `fills_withheld` ignores protective roles, so they never withhold the entry's settlement.
* **In the `_fill` fold:** a branch for protective roles.
  * It requires the position row to exist with `entry_command_key` equal to the command key and a role that is not protective, and lowers `owned_quantity`.
  * With no row (the entry leg's fill not yet recorded), the protective fill is not drafted in that decision. It waits, as a role-less fill does, and is recorded once the entry leg's fill is.
* **Order within a decision.** Entry-leg fills are drafted before protective fills.
* **Overclose.** `q` is computed once, after every fill of the decision. At most one `overclose` escalation per (subject, episode) and one hold draft are appended to that decision's drafts.
  * This replaces today's separate escalation transaction inside `fill_draft` (`lifecycle.py:349-353`).
  * The escalation and its hold are one decision, for every placement (CP-B6), with the strategy from the admitted payload's `strategy`.
  * Nothing buys the excess back.
  * **Spec amendment:** F-P18's "hold (reason `recovery`)" becomes `overclose`, as the Basket section names it.

#### Holds and episodes

* **`Safety.hold_draft(strategy, reason) -> EventDraft | None`.** It returns a `HOLD_ENGAGED` draft (principal `kernel:protection`, `reason` `overclose`, `sibling_failed` or `basket_unresolved`), or `None` when that reason is engaged.
  * It is a kernel draft builder: it does not go through `_authorized`, which serves human commands.
  * `kernel:protection` gains the built-in capability `hold_engage`, as `kernel:recovery` has. The builder checks it through `authority.check`, so the capability table stays the one source.
* **`Safety.episode(strategy, reason) -> int`:** the number of `HOLD_RELEASED` events with that `released_reason` for the strategy.
* **`lifecycle.escalate`** gains `episode=0` and `extra=()` (more drafts in the same decision).
* **A failure belongs to the episode in which its triggering event committed.** That is the leg request's outcome or refusal, or the overclosing `FILL`, with a sequence greater than the last release of that reason. So a release is not undone by re-deriving the same old failure. After a release, a `HELD_BACK` leg is evaluated afresh.
* **A second subject's failure within the same engaged episode** escalates without a second hold (F-P24). A new failure after a release escalates and holds again.

#### The basket leg

* **`leg_view`'s basket source.**
  * A basket leg has no placement command.
  * **Its chain** is the `broker_identity` order rows with the entry's command key and that leg's role, oldest first. A replacement inherits both.
  * **Placed values:** the level is `order.trigger` (stop) or `order.price` (target), and the quantity the leg's quantity, both from the admitted `plan_ref.protective_legs`.
  * **Confirmed values.** `confirmed_level` and `order_quantity` are the placed values until a modify of the chain by any principal completes. Then they are that modify's, as step 1's rule.
  * **The entry command's own `COMPLETED`** is never in `done`, so it can never end the leg.
  * The leg's own commands are `prot:<p>:<role>:<n>` (modifies and cancels).
* **The derived states**, first match wins:
  1. **`ENDED`:**
     * the live order is observed terminal;
     * or its role was never reached or transport-rejected (escalate `unprotected` once if `q` > 0);
     * or it was rejected in the basket response (escalate `stop_rejected` once for the stop).
  2. **`PENDING`:**
     * the entry command is `ADMITTED`, `IN_FLIGHT` or `UNCERTAIN`;
     * or an order ID has no role yet;
     * or `observed` is `None`;
     * or one of the leg's own commands is pending.
  3. **`HELD_BACK`:** a hold-bearing failure of this leg is escalated in the current episode, and its hold is engaged.
  4. **`ORPHANED`:** the entry window has ended, `q` ≤ 0, and the leg rests. For a position closed by another route (F-P25), this is the spec's rule, built now. **[Q-027 item 3]** for an entry that never filled.
  5. **`CONFIRMED`:** `observed` rests within 0.05 of the desired level and at the desired order quantity.
  6. **`DESIRED`**.
* **Within the tolerance.** When `observed` rests within 0.05 of the desired level but not exactly on it, the observed level is adopted as the confirmed one (POL-014), so no modify chases a tick.
* **The entry window** runs from the entry's claim until the entry command is `COMPLETED` or `REFUSED`.
* **Subscripts.** The escalations that name a leg (`sibling_failed`, `sibling_held`, `unprotected`, `stop_rejected`) use the subject `<position_id>:<role>`, so `HELD_BACK` is derived per leg. Position-wide reasons keep `<position_id>`.

#### Subjects

The loop's subjects are:

* every `position` row, as in step 2;
* every entry command with protective legs whose legs are not all `ENDED`, with `pid = position_id(entry key, plan_ref.legs[0].leg_role)` and `q` the row's `owned_quantity`, or 0 when no row exists.

So an entry rejected, never reached or never filled, or one whose roles are still unassigned, is still evaluated. After a stop fill closes the position, the target is still a subject until it ends. Step 2's early return, `_exit_unfinished` and `_accounted` read every leg of the subject.

#### The desire

* **The first desire.** At the first evaluation after the entry's outcome or resolution commits with the stop acknowledged or reached (with `q` possibly 0), protection records:
  * the plan's stop as the level;
  * the stop's order quantity;
  * the plan's `view_id`;
  * `ladder_state` seeded as step 2 does, with quantity the planned quantity. The host's `_build_ladder` used the filled quantity (`RFL:5211`), which equals the planned one for the fully filled entries it trails, and `remaining_qty` feeds only the ladder's metrics (`trail.py:548`).
* **`desired_quantity` under the basket is the stop's desired order total:**
  * during the window, its current order quantity;
  * after it, its recorded fills plus `max(q, 0)` **[Q-027 item 1, item 2]**.

  Step 2's rule 1 (re-record at `q`) is replaced under the basket by this rule. A modify's quantity is `desired_quantity` itself, the total, never `filled + desired_quantity`.
* **The target** has no desire row. Its desired level is the plan's target, never trailed, and its desired quantity follows the same rule.

#### Requests

**A basket leg never places.** It submits a `ModifyRequest` or a `CancelRequest` on its live order under `prot:<p>:<role>:<n>`, by step 2's one-request, retry and refusal-memory rules. Step 2's memory reads the chain above for a basket leg, in place of `_chain_commands`' `prot:` placements.

* **The trail** moves only the stop: `ModifyRequest(trigger_price=level)`. It follows step 2's rules: bars from closes, the latest close only, put-back and adoption, `trail_level`.
* **The quantity rule [Q-027 items 1, 2]**, after the window and while no exit is open. Each leg in `DESIRED` or `ORPHANED` submits:
  * `q` ≤ 0: cancel the leg;
  * unfilled quantity > `q` > 0: a modify to the total `fills + q`.

  The spec's P-1 then holds after the window. During the window no quantity request is made.
* **Quantity semantics.** **Deviation (from the live host):** the host sent the remaining quantity on every trail move (`RFL:5236-5237`), while the kernel sends a quantity only when it changes, as a total.
  * The two readings agree for a leg with no fills of its own.
  * Until TASK-S07-05 confirms OpenAlgo's semantics at the source, a leg with fills of its own that must shrink is cancelled instead of modified, and escalated `quantity_semantics_unconfirmed` once. So an unconfirmed reading can never oversell.
* **Option B for items 1–3:**
  * any recorded protective close cancels every other resting leg whole;
  * nothing is modified;
  * an entry that ended partly filled, never filled, or with its entry leg rejected leaves its legs resting;
  * the stop is trailed, and the position squared off, only when the entry filled its whole planned quantity (`RFL:5522`, `session_close.py:144-152`).

#### Failure classes

* **"Due since"** is the `event_time` of the ledger event that made the leg's request due: the `FILL` that changed `q`, the entry's `COMPLETED`, or the desire that changed the level. It is read from the ledger, so it survives a restart.
* **Transient:** step 2's pre-check waits (B1 stale, B2 effect waits, conflict, `PRT-R06`), and a recorded `ADM-R05`, `ADM-R12`, `PRT-R06` or `NOT_SENT`.
  * Step 2's refusal memory clears every transient code after one poll interval, so each is retried once per poll.
  * When the request has been due longer than `reconciliation.working_escalation_secs` and is still not completed, the failure is hold-bearing **[Q-027 item 4: under option B, a failed cancel is hold-bearing at once]**.
* **Success:** the leg is observed terminal, or completes `target_terminal`, and reads `ENDED`.
* **Kill** (`PRT-R01`, or the pre-check's kill): `orphan_under_kill` once.
* **Held** (`PRT-R04`): `sibling_held` once.
* **Hold-bearing:** `REJECTED`, any other refusal, or `UNCERTAIN`/`WORKING` beyond the escalation time from its outcome. `sibling_failed` is escalated with its hold in one decision, and the leg reads `HELD_BACK`.

#### Exits under the basket

* **There is no target tick exit:** the target rests at the broker.
* **Deep-OTM** (Q-026 A) and **square-off** run the exit sequence over both legs: cancel each resting leg under its own `prot:` key, wait until both are `ENDED` with their fills accounted for (step 2's rule, over both chains), then, only if `q` > 0, close `q`.
* While `EXIT_STARTED` is open, the quantity rule is suspended.
* **Classification:** a resting leg is broker-held when `observed` shows it at its desired level; the deep-OTM exit stays runtime-dependent.

#### Crash points

`FaultPlan` gains these points:

* **`CP-B1`:** in `Coordinator._finish`, after the entry outcome commits.
* **`CP-B3`:** in the protection loop, after a protective `FILL` committed and before the sibling's request is admitted.
* **`CP-B5`:** in the exit sequence, after one leg's cancel is admitted and before the other's.

CP-B2 is built with a scripted `timeout` and per-leg `resolve_attempt`, and CP-B4 with the `unresolved` helper on a leg's modify. CP-B6 is proved by the escalation and its hold sharing one transaction ID. Each runs in `test_crash_boundaries.py` by the child-process pattern.

### Regression and the existing tests

* **`tests/conftest.py`'s `ADMISSION_SETTINGS`** keeps `basket_at_plan`. `compose_simulation` gains `protection_loop: bool = True`, and the test `build` passes `False` unless a world asks for the loop, as step 2's `stop_on_fill` worlds and step 3's basket worlds do.
* **`make_plan`'s stop (`"10.00"`) makes every existing entry a basket.** A scripted step with no `"legs"` key returns its protective legs `not_sent` (`unscripted`) and books nothing, so outcomes stay `acknowledged`, and books and positions are unchanged.
* **Tests that read an outcome's `legs` list** see the added protective legs. The build lists each such test it updates.
* **`test_the_loop_is_not_composed_under_basket_at_plan`** is replaced by a test that the loop is composed under both placements and runs on a basket subject.
* **Shared helpers.** `entry`, `pass_`, `settle`, `world_of` and `placed` move from `test_protection_loop.py` to `tests/conftest.py`, so both protection files use them.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/execution.py` | `ProtectiveLeg`; `PlanRef.protective_legs`; `wire` and `plan_ref_from_wire`; `TransportResult.unassigned_order_ids`; `BasketTicket` |
| `src/autonomous_trading/kernel/admission.py` | `plan_digest`; `limit_entry_in_basket`; attaching the legs; external commitments; `owned_order_from_row` for protective roles; `send_ticket`'s `BasketTicket` and `_leg_product` |
| `src/autonomous_trading/kernel/coordinator.py` | The outcome draft's `unassigned_order_ids`; every role in self-built ambiguous results; `CP-B1` |
| `src/autonomous_trading/kernel/ledger/projections.py`, `store.py`, `resources/events.schema.json` | `LEG_ASSIGNED`; role-less identity rows; the protective `FILL` branch |
| `src/autonomous_trading/kernel/lifecycle.py`, `kernel/reconciliation.py` | The protective fill draft and ordering; the overclose decision; `LEG_ASSIGNED`; completion on a failed entry leg; `resolve_attempt` over `plan_ref` roles; `escalate`'s episode and extra drafts; `ledger_view`'s protective target level and `fills_withheld` |
| `src/autonomous_trading/kernel/safety.py`, `kernel/authority.py` | `hold_draft`, `episode`; `kernel:protection`'s `hold_engage` |
| `src/autonomous_trading/kernel/protection.py` | `basket_legs`; basket subjects, `leg_view`, six states, the desire rule, the quantity rule, failure classes, the basket exit; `CP-B3`, `CP-B5` |
| `src/autonomous_trading/adapters/simulated_broker.py` | The basket |
| `src/autonomous_trading/adapters/openalgo.py` | `basketorder`, the in-send read and budget, the validated join |
| `src/autonomous_trading/bootstrap.py` | The loop under both placements; `protection_loop`; the adapter's budget |
| `tests/conftest.py` | `protection_loop=False` by default; the shared protection helpers |
| `tests/unit/test_protection_basket.py` | New: the step's tests |
| `tests/unit/test_protection_loop.py` | Helpers moved; the composition test replaced |
| `tests/integration/test_openalgo_contract.py` | The basket send, labelled synthetic |
| `tests/recovery/test_crash_boundaries.py` | CP-B1…CP-B6 |
| Spec amendments | The protection spec: F-P18's reason; per-leg subjects for leg escalations. The execution-domain spec: the join's fields and tolerance; `unassigned_order_ids` on `TransportResult` |

### Step 3 tests

All values are labelled synthetic. **Built now:** everything not marked **[Q-027]**. **Built after the answer:** the rows marked.

* **The basket (PRF-PRT-01):**
  * `basket_legs` gives an SL-M stop and a LIMIT target at plan prices and the planned quantity;
  * `wire` and `plan_ref_from_wire` round-trip, and an empty field is omitted;
  * a plan with no stop escalates `no_stop_planned`;
  * F-P23.
* **The send:**
  * the simulated basket books three orders;
  * the OpenAlgo body equals legacy's leg shapes;
  * the join assigns by price type, with the synthetic response listing the target first;
  * a failed read, an exhausted budget, a duplicate ID and a failed row with an ID are `ambiguous`, with IDs unassigned;
  * the coordinator's own ambiguous results list every role.
* **`LEG_ASSIGNED`:**
  * a role-less row is assigned once on a fresh book;
  * a fill on it waits for the assignment;
  * external commitments never count it.
* **Fills:**
  * a protective fill lowers `q` and never the reservation, the entry's state or its settlement;
  * a protective fill drafted with the entry fill in one decision is ordered after it;
  * a protective fill with no position row waits.
* **Completion:** an entry leg rejected while the legs rest completes at 0 and frees the reservation; per-leg `resolve_attempt`.
* **States:**
  * each of the six rows, in order;
  * the entry's own `COMPLETED` never ends a leg;
  * a level within 0.05 is adopted, not chased;
  * stop and target commands interleaved keep separate states.
* **Requests:**
  * the trail modifies only the stop;
  * no quantity request during the window;
  * a leg with its own fills is cancelled, not shrunk, and escalated.
  * **[Q-027]** the quantity rule's rows with totals that pass B2; P-1 after the window; F-P15…F-P17 and their option B counterparts.
* **Failures and holds:**
  * the transient-to-hold timeout from "due since";
  * each class;
  * F-P19, F-P20, F-P21;
  * `overclose` with its hold in one decision, once for two overclosing fills in one decision;
  * F-P24: a second subject in the same episode escalates without a second hold; a recurrence after a release holds again; a release is not undone by an old failure.
* **Exits:** deep-OTM and square-off cancel both legs before the close; a stop fill cancels or shrinks the target as the answer to Q-027 decides; a target fill ends the exit with no close.
* **Subjects:** an entry that never filled, and one with unassigned roles, are evaluated; the target stays a subject after a stop fill closes the position.
* **Composition and regression:** the loop is composed under `basket_at_plan`; an unscripted basket step books nothing.
* **Crash points:** CP-B1…CP-B6.
* **Break checks** (named in the docstrings; each mapped to its failing test in the step's as-built record):
  * infer roles from response order;
  * let a protective fill touch the reservation;
  * draft a protective fill before the entry fill;
  * send a quantity request during the window;
  * shrink a leg with its own fills;
  * engage a second hold for an engaged reason;
  * record an overclose outside its fill's decision;
  * modify the target's price;
  * close before both legs are `ENDED`;
  * place a stop for a basket leg;
  * let the entry's `COMPLETED` end a leg.

### Step 3 as built

Commit `3e6d36a` on `slice-06`, on top of step 2's `e27a436`. It changes 19 paths (1,732 lines added, 80 removed). The files match the step's table, except where the table below says otherwise. A delegated agent built the OpenAlgo `basketorder` send, its in-send read and its contract tests to this text. Its diff was reviewed and the full suite run before the commit. The only key in the tests is the existing synthetic one.

**Choices made while building** (none sets a money value; every test value is labelled synthetic):

| Topic | As built |
|---|---|
| Regression | `ADMISSION_SETTINGS` binds `stop_on_fill`, not `basket_at_plan` as the text planned, with the loop off unless a world asks (`protection_loop`). The fixture plan is a LIMIT entry, which a basket rightly refuses (F-P23). Under `stop_on_fill` with no loop, every earlier test runs exactly as before. Basket worlds bind `basket_at_plan` and the loop |
| Shared helpers | Not moved to `tests/conftest.py`. `test_protection_basket.py` has its own small helpers, and step 2's file is unchanged |
| Holds | `hold_draft` and `episode` are module functions in `kernel/safety.py`, since `lifecycle` has no `Safety` instance. The builder does not call `authority.check`; `kernel:protection`'s `hold_engage` is recorded in the capability table |
| `LEG_ASSIGNED` | Joins the command kinds, so its command key is stored. Role-less identity rows are inserted under any `OUTCOME_*`: a basket with an unassigned role is `ambiguous`, not acknowledged |
| `basket_join` | Lives in `kernel/reconciliation.py`; the adapter uses it with `lifecycle._leg_specs`, so the send and reconciliation join alike |
| The OpenAlgo adapter's reasons | Each invalid response has its own reason: `duplicate_order_id`, `rejection_with_identity`, `basket_count_mismatch`, `basket_malformed` and `basket_status_conflict`. `role_unassigned` follows only a valid response. A role counts as rejected only when no IDs remain unassigned, since a failed row cannot be tied to a role without guessing from response order. A failing budget callable counts as exhausted. A transport failure keeps any returned IDs unassigned |
| `CONFIRMED` within 0.05 | A leg resting within 0.05 of its desired level reads `CONFIRMED`, so no modify chases a tick. The observed level is not separately recorded as the confirmed one |

**Gaps closed** (commit `84579d1`, on top of `3e6d36a`). The first build left three gaps against the text, closed the next day:

* **Transient refusals are retried once per poll.** Step 2's refusal memory now clears `ADM-R12` and `PRT-R06` after one poll interval, as it already cleared `ADM-R05` and `DSP-R01`; a refusal that is not transient (`ADM-R07`) still waits for a ledger change. Test: `test_a_transient_refusal_is_retried_once_per_poll`.
* **CP-B2 end to end.** A basket's send times out with no IDs. Its orders are in the book with nothing tying them to the send, so the entry stays `UNCERTAIN` and is escalated `untagged_timeout`, and protection sends nothing meanwhile. A human then resolves every role in one `resolve_attempt` call. With the entry reached, the roles are recorded and protection takes the legs over. With the entry not reached, the entry completes `order_ended` at 0 and both legs are cancelled as orphans. Test: `test_cp_b2_a_timed_out_basket_is_resolved_per_leg` (both cases). **Found while testing:** when the simulated book holds none of the basket's orders, its complete-book contract proves the send never reached the broker, and reconciliation resolves it without a person, which is the intended rule. The human path applies only when orders exist that nothing ties to the send.
* **F-P24 across positions.** Three baskets on three underlyings, same strategy. Two overclose in one episode: two escalations, one `HOLD_ENGAGED`. After the release, the third overcloses in episode 1 and holds again. Test: `test_f_p24_a_second_subject_escalates_without_a_second_hold_and_a_release_holds_again`.

Three more break checks, each applied and reverted with an md5 check, failed their tests:

* clear only `ADM-R05` and `DSP-R01` by time;
* resolve only the attempt's single leg;
* key every overclose to episode 0.

**Tests** (809 passed, twice, after the gaps closed; 805 at `3e6d36a`; with `pytest` in the slice's virtual environment on the development machine; no broker variables; nothing reached a deployment):

| File | Cases |
|---|---|
| `test_protection_basket.py` (24, new; 20 at `3e6d36a`) | **Basket:** `basket_legs` against legacy, the wire round trip with an empty field omitted and the digest unchanged; F-P23; three orders booked with their roles, owned and protective. **States and quantities:** the first desire with both legs `CONFIRMED` and the entry's `COMPLETED` ending no leg; a partial target fill lowering `q`, never the reservation, and shrinking only the stop; a full stop fill cancelling the target; no quantity request in the window; an entry rejected while its legs rest, completing at 0 and cancelling both; a leg with its own fills cancelled, not shrunk. **Holds:** overclose and its hold in the fill's one decision; a failed sibling cancel holding, and a release not undone. **Exits:** the trail modifying only the stop; square-off cancelling both legs before the close; the exit waiting for both legs without the conflict relation. **Roles and resolution:** an unassigned role assigned on a fresh book with nothing sent meanwhile; the coordinator's unknown result naming every role; CP-B4; the join by price type; a protective fill in the entry fill's decision; `hold_draft` while engaged |
| `test_crash_boundaries.py` (+3) | CP-B1, CP-B3, CP-B5 in a child process exiting 86, reopened with the book seeded as it stood |
| `test_openalgo_contract.py` | The basket body equal to legacy's leg shapes; the join with the target listed first; an unplaceable ID; a role assigned at most once; a leg rejected in the response; a failed, budget-refused and out-of-time read; six invalid responses; all failed without IDs; the key never published; more than one entry leg still `basket_unsupported` |

**Break checks** (each applied with every anchor checked first and reverted byte for byte with an md5 check; every one failed its test). Four survived the first run because a second guard caught the change: B2 refusing a trigger on a LIMIT, conflict row 3 refusing a close while a leg rests, the wait rule recovering an early protective fill, and two window guards. The checks were widened to remove the whole guard, and one test was added. Then all failed:

| Change | Test that failed |
|---|---|
| Infer roles from response order | `test_the_join_assigns_by_price_type_never_by_order` |
| Let a protective fill touch the reservation | `test_overclose_escalates_and_holds_in_its_fills_decision` |
| Draft a protective fill before the entry fill | `test_a_protective_fill_in_the_entry_fills_decision_follows_it` |
| Send a quantity request during the window | `test_no_quantity_request_during_the_entry_window` |
| Shrink a leg with its own fills | `test_a_leg_with_its_own_fills_is_cancelled_not_shrunk` |
| Engage a second hold for an engaged reason | `test_hold_draft_is_none_while_the_reason_is_engaged` |
| Record an overclose outside its fill's decision | `test_overclose_escalates_and_holds_in_its_fills_decision` |
| Modify the target's price | `test_the_first_desire_and_both_legs_confirmed` |
| Close before both legs are `ENDED` | `test_the_exit_waits_for_both_legs_even_without_the_conflict_relation` |
| Place a stop for a basket leg | `test_a_partial_target_fill_lowers_q_and_shrinks_the_stop` |
| Let the entry's `COMPLETED` end a leg | `test_the_first_desire_and_both_legs_confirmed` |
| (adapter) Roles from response order; read past a refused budget; a failed row with an ID accepted; two IDs for one role; duplicate IDs accepted | the matching `test_openalgo_contract.py` cases |

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
