# SLICE-04 — Intent to admission

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-04-review-2026-10-27)). Step 1 is decision-complete with the review's decisions below and is being built (checkpoint commit `bac5777` on branch `slice-04`: the capacity rule, the in-transaction stage-B check, the policy events and tables, the contracts; 161 tests). Steps 2 and 3 are deepened after step 1 lands (delivery-plan depth rule) and stay proposed until then.
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [intent spec](../../design/intent-to-admission.md); every deviation is marked **Deviation**. No score, threshold or money value is set: every refusing setting is bound only to labelled synthetic values in tests.
* **Phase:** master Phase 1, finishing in Phase 3 with real views (SLICE-08). Class S.
* **Builds on:** [SLICE-03](SLICE-03-sessions-authority-recovery.md) as built; branch `slice-04` cut from `slice-03`.
* **Owner answers applied:** Q-003 (`market.view_age_stamp: bar_close`), Q-008 (`capacity.count_non_live_obligations: count`), Q-010 (A3 reads binding revocation), Q-011 (`dispatch.deadline_ms.<verb>`, synthetic here), Q-015 (`account.max_worst_case_loss`, synthetic here), Q-017 (slot rule is conflict row 1, a SLICE-05 fixture here).
* **Proofs:** PRF-ADM-01, -02, -04, -05, -06 (policy part), -08 in steps 1–2; PRF-ADM-03 and PRF-LED-03's stage-B twin in step 3.

**Fixture ports** (what later slices build; the intent spec's Delivery row names them):

| Port | Here | Built in |
|---|---|---|
| `SafetyPort.check(verb, auth, strategy) -> Refusal \| None` (A4) | `FixtureSafety`: returns a configured refusal or `None` | SLICE-05/06 |
| `ConflictPort.check(action) -> Refusal \| None` (B3) | `FixtureConflicts` | SLICE-05 |
| `busy(account) -> int` (A0, B4) | A fixture count | SLICE-05 |
| `ObservationPort.latest(account) -> AccountObservation \| None` (B1, B2, B5) | `FixtureObservations` holding synthetic observations | SLICE-07 |
| `PositionPort.owned(position_id) -> OwnedPosition \| None`, `owned_order(broker_order_id) -> OwnedOrder \| None` (B2) | Fixture rows | SLICE-07 |
| `PlannerPort.plan(...)` | Step 1–2: `FixturePlanner` returning a configured `Plan` or `PlanRefusal`; step 3: `one_leg_v1`, `structure_v1` | Step 3 of this slice |
| `PolicyStore.get(policy_binding_id) -> BoundPolicy \| None` | A dict of synthetic policies | SLICE-11 (bundle) |
| `MarketPort.view(view_id) -> StableView \| None` | Fixture views | SLICE-08 |

## Step 1 — review application and entry admission

### Files

| Path | New or changed | What |
|---|---|---|
| `src/autonomous_trading/contracts/decisions.py` | changed | `Intent`, `Review`, `ReviewApplication` (full), `Plan`, `PlanLeg` (full), `SessionStats`, `PlanRefusal`, `BoundPolicy` |
| `src/autonomous_trading/contracts/market.py` | new | `StableView` (the minimal market record of this step) |
| `src/autonomous_trading/contracts/evidence.py` | changed | `Coverage`, `ObservedOrder`, `ObservedPosition`, `ObservedFunds`, `Observation`, `AccountObservation` |
| `src/autonomous_trading/contracts/execution.py` | changed | `wire` for the new types |
| `src/autonomous_trading/kernel/policy.py` | new | Recording reviews, applying them, pauses |
| `src/autonomous_trading/kernel/planner.py` | new | `PlannerPort`, `FixturePlanner`, `plan_digest_of(plan)` |
| `src/autonomous_trading/kernel/admission.py` | changed | `Admission` (stages A and B for entries), `capacity_check` (the legacy rule) |
| `src/autonomous_trading/kernel/ports.py` | changed | The fixture-port protocols above |
| `src/autonomous_trading/kernel/coordinator.py` | changed | `admit_entry` front door; the SLICE-01 `submit_entry` becomes the kernel-internal dispatch path |
| `src/autonomous_trading/kernel/ledger/store.py`, `src/autonomous_trading/kernel/ledger/projections.py`, `src/autonomous_trading/kernel/ledger/schema.py`, `src/autonomous_trading/resources/events.schema.json`, `src/autonomous_trading/resources/migrations/003_policy.sql` | changed / new | `INTENT_SEEN`, `REVIEW_RECORDED`, `REVIEW_DEADLINE_PASSED`, `PAUSE_STARTED`, `PAUSE_CLEARED`; `review` and `pause` tables; `Decision.precheck` |
| `src/autonomous_trading/settings/schema.py`, `src/autonomous_trading/settings/loader.py`, `src/autonomous_trading/resources/defaults.yaml`, `src/autonomous_trading/bootstrap.py`, `src/autonomous_trading/operations/verification.py` | changed | The step's refusing settings; the composition wires the ports; the measurement uses `_submit_admitted` |
| `tests/unit/test_review_semantics.py` | new | PRF-ADM-01, -02, -06 (policy part) |
| `tests/unit/test_admission_checks.py` | new (T-10) | PRF-ADM-04 (entry rows), -09 (capacity cases) |
| `tests/unit/test_planner_rules.py` | new | PRF-ADM-08 (contracts) |
| `tests/conftest.py`, `tests/fixtures/slice01_entry.json` | changed | Full contract fields; fixture ports |

`resources/migrations/003_policy.sql` needs tree delta **T-25** (like T-24).

### Contracts (`contracts/decisions.py`)

The intent spec's field lists are adopted exactly (its "Contracts" block). Engineering choices this step fixes:

* `Intent.scores` is a frozen mapping with exactly `signal_score`, `iv_rank`, `conviction` (decimal strings or `null`); `direction ∈ {long_call, long_put, abstain}`; `as_of` is the bar stamp the strategy decided on.
* `ReviewApplication` gains its full fields as keyword arguments **without defaults** (`candidate_id`, `session_id`, `basis`, `pause_id`, `review_outcome`, `alert`, `deadline`); SLICE-01's positional subset changes, as SLICE-01 said it would.
* `PlanLeg` gains `unit="contracts"`, `lot_size`, `amount`, `tick_size` as keyword arguments without defaults.
* `Plan` is the intent spec's `Plan`; `PlanRef` stays the SLICE-01 subset and is built from a `Plan` by `planner.plan_ref(plan)`.
* `BoundPolicy(policy_binding_id, ai_mode, review_required, review_deadline_secs, configuration_digest, blueprint_digest, lineage_digests, product)`: `ai_mode ∈ {off, observe, enforce_entry_holds}`; `review_deadline_secs` is the blueprint's `deadline_seconds` (legacy default 30, capped 300, **a policy input, synthetic in tests**).
* `StableView(view_id, underlying, calendar_id, bar_open: Timestamp, bar_close: Timestamp, spot_as_of: Timestamp, chain_as_of: Timestamp)`.
* `Observation(account_id, endpoint, as_of, coverage: Coverage(complete: yes|no|unknown), items)`, `AccountObservation(orders, positions, funds)`; `ObservedFunds(available, margin_available | None, position_margin | None, working_margin | None)`; `ObservedPosition(instrument, net_quantity, amount | None, margin | None, identity)`; `ObservedOrder(broker_order_id, instrument, side, quantity, filled_quantity | None, status, amount | None, margin | None, protective: bool)`. Money fields are decimal strings.

### Where the intent lives

The strategy host publishes the intent's wire form to the evidence store before submitting; `EntryRequest.intent_ref` is that object's digest. **A1** resolves it: `evidence.resolve(EvidenceRef("evidence", intent_ref, ...))`; unresolvable, not an intent, `direction == "abstain"`, or `session_id` differing from the request's → `ADM-R01 malformed_request`.

### `kernel/policy.py`

```text
Policy(writer, clock, *, policies: PolicyStore, sessions)
    record_intent(intent) -> None                 # INTENT_SEEN the first time per intent digest
    record_review(review, session_id) -> Committed | Refusal
    application(intent, request_session) -> ReviewApplication | Refusal   # ADM-R15 while pending
    clear_pause(auth, pause_id, reason) -> Committed | Refusal
    active_pause(strategy, underlying, session_id) -> pause row | None
```

* **Events and tables** (migration `003_policy.sql`): `INTENT_SEEN {intent_digest, strategy, underlying, session_id, seen_at}`; `REVIEW_RECORDED {review (wire), intent_digest, arrival_at, first: bool, application (wire) | null}`; `PAUSE_STARTED {pause_id, strategy, underlying, session_id, review_id, started_at, expires_at}`; `PAUSE_CLEARED {pause_id, principal, reason, cleared_at}`. Tables `review (intent_digest PK, review_id, application, seen_sequence, recorded_sequence)` and `pause (pause_id PK, strategy, underlying, session_id, review_id, started_at, expires_at, cleared_at, cleared_by, clear_reason)`. `INTENT_SEEN` folds `review.seen_sequence`; the first `REVIEW_RECORDED` folds `review_id`, `application`, `recorded_sequence`; later ones fold nothing.
* **Finding and applying** follow the intent spec's two tables exactly, judged at the review's **arrival** (kernel clock at `record_review`), in the same transaction as the first `REVIEW_RECORDED`; a PAUSE in `enforce_entry_holds` adds `PAUSE_STARTED` to that transaction unless a pause is active for the scope (no extension) or it would be inactive (`expires_at ≤ started_at` → `proceed_unavailable`, cause `pause_inactive`, alert).
* **Pause bounds:** `min(pause_minutes or 5, 60)` minutes; `expires_at = min(started_at + duration, session close_time)`; active while `started_at ≤ effective_now < expires_at` and not cleared (exclusive expiry).
* **`application(intent)`:** `ai_mode == off` or `not review_required` → `proceed` (`review_not_required`). Otherwise, in `enforce_entry_holds`, an active pause for the scope → `paused` (basis `pause`). Otherwise the frozen application; with none recorded: before `seen_at + review_deadline_secs` → `ADM-R15 review_pending` (no record); after it → `proceed_unavailable`, cause `no_review`, alert, frozen by recording it (a `REVIEW_RECORDED` is not invented; the `review` row's `application` is written by a `REVIEW_DEADLINE_PASSED {intent_digest, application}` event — **Deviation**: the spec says the application is frozen at the deadline but names no event; one event makes it durable and D04-checkable).
* **Alerts** go to `policy.alerts` (the operator route arrives in SLICE-10).
* **Clearing** needs a human principal with `pause_clear` (`authority.check`); a cleared or expired pause gives `LED-R09`.

### Entry admission (`kernel/admission.py`, `Admission.admit_entry`)

`Coordinator.admit_entry(request, *, auth=None) -> Outcome` is the front door. In order, each stopping at its first failure, every refusal recorded `ADMISSION_REFUSED` (with `inputs.check`) except `LED-R01`, `LED-R02`, `ADM-R12`, `ADM-R15`:

| # | Check | Refusal |
|---|---|---|
| A0 | `busy(account) < coordinator.max_pending_per_account` when `coordinator.busy_applies_to` covers entries | `ADM-R12` (not recorded) |
| A1 | Key present; the intent resolves (above) | `LED-R01`; `ADM-R01` |
| A1a | Identity pre-check (SLICE-01) | `LED-R02` / existing outcome |
| A2 | `authority.check("entry", auth, account)` (SLICE-03) | `SES-R01…R05, R09` |
| A3 | `lifecycle.entry_session_check(writer, clock, session_id, candidate_id, binding.revocation_effect)`; the session's calendar equals the view's | `SES-R07`, `ADM-R14` |
| A4 | `safety.check("entry", auth, strategy)` | its refusal |
| A5 | `policy.application(intent)`: `blocked`/`paused` → `ADM-R11`; pending → `ADM-R15` (not recorded) | |
| P | `planner.plan(...)`; a `PlanRefusal` → `ADM-R13` with stage and reason; an exception → stage `internal` | `ADM-R13` |
| B | Repeat A2, A3, A4 and the pause read | as above |
| B1 | View age `wall now − view.bar_close` (`bar_close` bound) or `bar_open` ≤ `market.max_view_age_secs`; spot and chain age ≤ `2 × market.poll_interval_secs`; the account observation exists, is complete or `unknown`, and `0 ≤ now − as_of ≤ reconciliation.max_observation_age_secs` | `ADM-R05` |
| B3 | `conflicts.check(...)` | its refusal |
| B4 | As A0 | `ADM-R12` |
| B5 | `capacity_check` (below) | `ADM-R09` |
| B6 | The intent spec's B6 list | `ADM-R10` |

Then `COMMAND_ADMITTED` with the plan (`plan_ref` and the full plan), application, `grant_id`, `dependencies {dispatch_deadline: {origin, budget_ms}, release_binding_id: null, grant_id, session_id}`, `state_heads {reservation_head, funds_observation: digest, position_observation: digest}`, `measured_ages {view_ms, spot_ms, chain_ms, observation_ms}`; then the SLICE-01 claim and send.

The numeric limits (`market.max_view_age_secs` 90, POL-018; `market.poll_interval_secs`; `reconciliation.max_observation_age_secs` 60, POL-021) are **approved policy values carried as refusing settings**; this slice binds them only in tests, with the approved values labelled as such.

### `capacity_check` (B5, the legacy rule, `reservations.py:352-497` @445eb116)

```text
capacity_check(plan, observation, open_reservations, *, max_worst_case_loss, reserved_order_ids) -> Refusal | None
```

1. `worst_case_loss ≤ max_worst_case_loss` (`account.max_worst_case_loss` for the account; unbound → `capacity_rule_unbound`) — else reason `worst_case_loss`.
2. **External commitments:** over the observation's positions and working orders, skip rows marked `protective`, rows whose identity was already counted, and orders in `reserved_order_ids`; add each row's `amount` and `margin` (a missing `amount` refuses with reason `observation_field_missing`; a missing row `margin` counts 0, as legacy `row.get("margin", 0.0)`). If there are no position rows, add `funds.position_margin` (missing → refuse) to margin; if there are no working rows, add `funds.working_margin` likewise. **Deviation, recorded:** legacy also added aggregate `position_exposure` and `working_exposure` to capital when the row lists were empty; the observation contract has no aggregate exposure field, so an empty row list adds 0 capital here. This is the one place the target could count less than legacy; it is flagged for TASK-S07-05, which compares against the deployed endpoint, and is not a new money rule (the rows, when present, count exactly as legacy).
3. `amount ≤ available − (Σ open reservation amounts + external capital)` — else `amount`.
4. `margin_available` present and `margin ≤ margin_available − (Σ open margins + external margin)` — else `margin`.
5. With `capacity.count_non_live_obligations: count` (the only accepted value) every open reservation counts.

Arithmetic is `Decimal` on the decimal strings; nothing is rounded.

### Step 1 tests

* `test_review_semantics.py`: every finding-the-review row; every outcome cell for `observe` and `enforce_entry_holds`; CUJ-ADM-5 (pending → `ADM-R15`, one `INTENT_SEEN`, deadline → `proceed_unavailable` `no_review` with an alert); first review wins and later ones change nothing; a BLOCK cannot be waited out after `valid_until`; CUJ-ADM-1 at 10:00, 10:02, 10:03, 10:06; a pause starts with the review even if the intent never returns; two PAUSEs start one pause; a PAUSE at or after the session end → `pause_inactive`; a non-human clear refused; the same recorded reviews give the same applications in two fresh ledgers (PRF-ADM-06 policy part).
* `test_admission_checks.py`: each entry row A0–B6 refuses with its code and is recorded or not as stated; CUJ-ADM-3 (view 90.1 s old → `ADM-R05`); F-A5 (incomplete observation); F-A6 (a kill or pause committed during planning refuses at stage B); capacity cases against hand calculations (protective and reserved rows skipped, duplicate identities counted once, aggregate margin only without rows, missing fields refuse); F-A7 (two entries on different underlyings each see the other's reservation); state heads and ages recorded.
* `test_planner_rules.py`: the `Intent` and `Plan` contracts carry exactly the listed fields and no order identity (PRF-ADM-08).

### Step 1 decisions from the EGM review (binding; they override the text above where they differ)

The [review](../../egm/plan/review.md#slice-04-review-2026-10-27) found step 1 not yet decision-complete. These rules close it:

| Topic | Rule |
|---|---|
| Stage B atomicity | Stage B's repeat and B1–B6 run inside the `COMMAND_ADMITTED` transaction as `Decision.precheck` (after the identity rule and guard); a refusal rolls back, and the caller then records `ADMISSION_REFUSED` in its own transaction. A kill, pause, grant change or reservation committed after planning is therefore always seen (F-A6, F-A7) |
| Front door and D12 | `Coordinator.admit_entry(request, *, auth=None)` is the only entry route for callers. The SLICE-01 path becomes `Coordinator._submit_admitted(request, application, plan)` (private), kept as the test seam for SLICE-01…03 mechanics and for `operations/verification.py`'s measurement; both stay in the file list. A capability test (PRF-XC-02, step 1 part) fails if any `src` module other than `kernel/policy.py` and `kernel/planner.py` constructs `ReviewApplication(` or `Plan(`, or any module other than `kernel/coordinator.py` and `operations/verification.py` references `_submit_admitted` |
| Planner port in steps 1–2 | `PlannerPort.plan(intent, view, policy, now) -> Plan \| PlanRefusal`; `FixturePlanner(result: Plan \| PlanRefusal \| Exception, on_plan=None)` runs `on_plan()` during planning (the F-A6 hook). Step 3 widens the signature with chain, reference facts and `SessionStats` |
| Finding a review's intent | `Policy.record_review(review)` resolves the intent from the evidence store **by `review.intent_digest`** (the intent's evidence digest equals `digest(wire(intent))`); no intent → `ADM-R01`, nothing recorded. It commits `INTENT_SEEN` in the same transaction when absent. The session, strategy, underlying and candidate always come from the resolved intent, never from the caller. The `digest_mismatch` row is unreachable by construction and is kept only as a guard |
| `record_intent` call site | Right after A1 resolves the intent, so `INTENT_SEEN` (the review deadline's start) is written even when A2–A4 refuse |
| Clocks | Stamps (`seen_at`, arrival, `started_at`) are `clock.now()`. The review deadline, `valid_until` and pause activity are judged on `effective_now`. **Deviation:** the spec names the clock contract's deadline rule; the ratchet is the restart-safe form of it and never extends a deadline. B1 ages use `clock.now()` in any domain and must be ≥ 0 |
| Freezing | The frozen row holds `applied, basis, review_id, pause_id, cause, review_outcome, alert`; no deadline. Whichever freezes first (`REVIEW_RECORDED` or `REVIEW_DEADLINE_PASSED`) wins; a later one folds nothing. `application()` adds `deadline = Deadline(stage-A now, dispatch.deadline_ms.entry, clock.elapsed())`, whose wire form is `{origin, budget_ms}`. Judging: arrival ≥ `seen_at + review_deadline_secs` → `timeout`/`timeout`; `started_at > completed_at` or `valid_until ≤ arrival` → `invalid`/`expired` |
| Pause | `pause_id = "pause-" + review_id`; `Review.pause_minutes` must be an int ≥ 1 or `None` (legacy `pause.py:248`); a review violating it cannot be constructed and is refused `ADM-R01` |
| `REVIEW_DEADLINE_PASSED` | Added to the file list, the payload schema and the [ledger spec's event catalogue](../../design/ledger-and-atomic-transaction.md#event-catalogue) |
| Capacity | As built in `kernel/admission.py` (no new module): identity = position `identity` or order `broker_order_id`, one namespace; working = status `open`; "no rows" = the raw list; `funds.items == (ObservedFunds,)`; `reserved_order_ids` = `broker_identity` order IDs of commands whose reservation is `RESERVED` or `HELD`; `protective_order_ids` = order IDs of the ledger's protective commands (empty until SLICE-06; a broker flag never counts). Stricter than legacy, as the intent spec requires: a missing row `margin` refuses (legacy counted 0); numbers must be finite and ≥ 0 and the plan amount > 0; an empty book counts as flat only when its coverage is `yes` |
| B1 | A missing view → `ADM-R05`; each of the orders, positions and funds observations must exist, be complete or `unknown`, and have age 0 … `reconciliation.max_observation_age_secs` |
| `COMMAND_ADMITTED` | Adds `plan` (the full plan wire form), `resulting_exposure {instrument: quantity}` from the plan legs, and `state_heads {reservation_head, orders_observation, positions_observation, funds_observation}` (each observation's own digest); `measured_ages` are integer milliseconds, `observation_ms` the oldest of the three |
| Records | Stage-B repeats are recorded with `inputs.check` `"B:A2"`, `"B:A3"`, `"B:A4"`, `"B:A5"`. `ADM-R15` returns `canonical="unchanged"` even when `INTENT_SEEN` committed |

**Refusing settings of step 1** (all `None` in `defaults.yaml`; tests bind labelled synthetic values; the composition refuses an unbound one with `RefusingParameterUnbound`):

| Setting | Type | Env (`test` profile) | Notes |
|---|---|---|---|
| `market.view_age_stamp` | `bar_open` \| `bar_close` | `AT_VIEW_AGE_STAMP` | Q-003 binds `bar_close` |
| `market.max_view_age_secs` | int > 0 | `AT_MAX_VIEW_AGE_SECS` | POL-018 approved 90 |
| `market.poll_interval_secs` | int > 0 | `AT_POLL_INTERVAL_SECS` | POL-020 (2× is the limit) |
| `reconciliation.max_observation_age_secs` | int > 0 | `AT_MAX_OBSERVATION_AGE_SECS` | POL-021 approved 60 |
| `dispatch.deadline_ms.entry` | int > 0 | `AT_DEADLINE_MS_ENTRY` | Q-011: measured (TASK-S11-07); other verbs join in step 2 |
| `coordinator.max_pending_per_account` | int > 0 | `AT_MAX_PENDING` | |
| `coordinator.busy_applies_to` | `entries_only` | `AT_BUSY_APPLIES_TO` | Q-004 |
| `account.max_worst_case_loss` | mapping account wire → money | (composition argument only) | Q-015: per account, set at deployment; unbound for an account → `ADM-R09 capacity_rule_unbound` at admission, not at load |
| `capacity.count_non_live_obligations` | `count` | `AT_COUNT_NON_LIVE` | Q-008; any other value refuses to load |

`capacity.synthetic_amount` stays for the `_submit_admitted` seam only.

## Step 2 — cancel, modify and close admission (deepened after step 1)

The readiness review found step 2 underspecified (the owned-position and owned-order fields, how a resting protective close is identified, the `COMMAND_ADMITTED` payload for non-entry verbs, the not-sent `Outcome`, and the modify capital increase). Step 2 is rewritten to decision depth after step 1 lands, as step 3 is. The text below is its scope, not its specification.

`CancelRequest`, `ModifyRequest(ModifyChanges)`, `CloseRequest` (ledger spec types) and `Coordinator.admit_action(request, *, auth=None) -> Outcome`, running A0–A2, A4, then stage B with B1 (observation only), B2 against the fixture position and order ports exactly as the intent spec states (cancel: owned and open; modify: total ≥ filled and remaining ≤ current remaining, except a resting protective close up to the owned position; close: quantity ≤ min(owned, broker net), side SELL), B3, B4, and B5 only for a modify raising committed capital. Admission records `COMMAND_ADMITTED` (`verb`, `target`); dispatch of these verbs is SLICE-05, so step 2 admits without sending. Tests: CUJ-ADM-2 (sell 100 against 50 → `ADM-R07`), CUJ-ADM-4 (close with the session `CLOSED` admitted), each B2 rule.

## Step 3 — the planning port (deepened before build)

`one_leg_v1` and `structure_v1` extracted pure from `orchestrator.py:385` and `structures/planner.py:104` @445eb116, with `kernel.selection` choosing by `structure_id`; `SessionStats` derived field by field (TASK-S04-06); PRF-ADM-03. The legacy one-leg planner is about 1,000 lines with registry, kill-switch-file and desk-configuration couplings; its line-by-line extraction map is written into this section before step 3 starts, and step 3 is not built until then.

## Completion conditions (steps 1–2)

1. Every SLICE-01…03 test and every step 1–2 test passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. The steps' file lists match the commits.

## Prerequisites

SLICE-01…03. No open owner question.
