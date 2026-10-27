# SLICE-04 — Intent to admission

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-04-review-2026-10-27)). **Step 1 built** on 2026-10-27 in a local repository (commit `2ed1c39`, branch `slice-04`): 235 tests passed, including every SLICE-01…03 test, and every break check failed as required ([as built](#step-1-as-built)). That is a build record, not production acceptance. **Step 2 built** the same day (commit `575c897`): 252 tests passed and every break check failed as required ([as built](#step-2-as-built)). **Step 3 built** (`one_leg_v1`, commit `1aa02b8`): 308 tests passed, including 43 golden cases generated from legacy `plan()` at `OA@445eb116`, and every break check failed as required ([as built](#step-3-as-built)). `structure_v1` is step 4, deepened before it is built.
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

Then `COMMAND_ADMITTED` with the plan (`plan_ref` and the full plan), application, `grant_id`, `dependencies {dispatch_deadline: {origin, budget_ms}, release_binding_id: null, grant_id, session_id}`, `state_heads` (as the decisions table below states), `measured_ages {view_ms, spot_ms, chain_ms, observation_ms}`; then the SLICE-01 claim and send.

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

### Step 1 as built

Commit `2ed1c39` on `slice-04` (checkpoint `bac5777` before it). The commit pair changes 33 paths: the files table above, less `tests/fixtures/slice01_entry.json` (unchanged), plus ten SLICE-01…03 test files that now call the private seam `_submit_admitted` or read the migration count (`tests/contracts/test_capabilities.py`, `tests/integration/test_entry_outcomes.py`, `tests/recovery/test_crash_boundaries.py`, `test_projection_integrity.py`, `test_restore_fencing.py`, `tests/unit/test_authority_grants.py`, `test_command_identity.py`, `test_event_envelope.py`, `test_ledger_invariants.py`, `test_policy_parameters.py`).

**Choices made while building** (none sets a money value; each is named so a reader can check it):

| Topic | As built |
|---|---|
| Front door | `kernel.admission.EntryAdmission(coordinator, policy, ports, settings).admit(request, auth)`, reached only through `Coordinator.admit_entry`; the composition sets it when `compose_simulation(..., admission=AdmissionPorts(...))` is given, and refuses any unbound step-1 setting then (`RefusingParameterUnbound`, naming `section.key`) |
| Observation digests | `Observation` gains `digest` (each book's own), so `state_heads` can name `orders_observation`, `positions_observation` and `funds_observation` as the decisions table requires |
| Seam application | `kernel.policy.not_required_application(intent_digest, strategy, policy_binding_id)` builds the `proceed` / `review_not_required` application the measurement in `operations/verification.py` passes to `_submit_admitted`, so only `kernel.policy` builds applications (the capability test found the old direct construction) |
| Two-calendar check | A3 compares the session's calendar with the view's. B6's leg-calendar condition needs each instrument's calendar from reference facts, which arrive with the step 3 planner; B6 adds it then. **Deviation until step 3** |
| Setting key | `dispatch.deadline_ms_entry` (flat key under `dispatch`) for the spec's `dispatch.deadline_ms.entry`; the loader table names it |
| Fixture refusal codes | `FIX-R03` (conflict) and `FIX-R04` (safety) are labelled test stand-ins for the SLICE-05 and SLICE-06 codes |

**Tests** (235 passed with `scripts/safe_tests.py`, no broker variables):

| File | Cases |
|---|---|
| `test_admission_checks.py` | The 15 capacity cases; the front door: admitted payload (full plan, exposure, the four state heads, integer ages, grant, dispatch deadline), A0 busy unrecorded, A1 (unpublished, abstaining, other-session intent), missing key unrecorded, A1a identity, A2 recorded after `INTENT_SEEN`, A3 candidate and calendar, A4, A5 pending unrecorded and BLOCK recorded, planning refusal and exception, F-A6 kill and pause during planning (`B:A4`, `B:A5`), CUJ-ADM-3 (90.1 s refused, 90.0 s admitted), F-A5 and the other B1 inputs, B3, B4 unrecorded, F-A7, the per-account loss limit and its absence, three B6 mismatches |
| `test_review_semantics.py` | Review not required; every finding row; arrival after the deadline; the ten mode × outcome cells; CUJ-ADM-5; first review wins; a BLOCK outlives `valid_until`; CUJ-ADM-1 at 10:00, 10:02, 10:03, 10:06; exclusive expiry; a pause starts without the intent returning (60-minute cap, session close); two PAUSEs, one pause; a PAUSE at the session end; clearing; two fresh ledgers, the same applications |
| `test_planner_rules.py` | The `Intent`, `Plan`, `PlanLeg` and `ReviewApplication` field sets; no order identity; an intent published with an order ID does not resolve; product and protective levels in the plan digest |
| `test_capabilities.py` | Only `kernel/policy.py` builds `ReviewApplication(`, only `kernel/planner.py` builds `Plan(`, only the coordinator and the measurement reach `_submit_admitted` |
| `test_policy_parameters.py` | The eight step-1 settings resolve, are null by default and refuse malformed values; the composition refuses each one unbound |

**Break checks** (each applied to the build, run, and reverted byte for byte; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Ignore the stage-B precheck's refusal | both F-A6 tests |
| Record `ADM-R12` at B4 | `test_b4_busy_during_planning_is_not_recorded` |
| Accept an incomplete observation | `test_b1_inputs_f_a5` |
| Let a later review replace the first | `test_first_review_wins` |
| Start a second pause on a second PAUSE | `test_two_pauses_start_one_pause`, `test_cuj_adm_1` |
| Skip the arrival-deadline judgement | `test_arrival_after_the_deadline_is_timeout` |
| Build a `ReviewApplication` in `kernel/admission.py` | the capability test |
| Give `Intent` an order identity | three `test_planner_rules.py` tests |
| Give `market.view_age_stamp` a default | `test_admission_settings_resolved_and_null_by_default` |

## Step 2 — cancel, modify and close admission

Deepened after step 1 landed (OA_NEW `2ed1c39`), then reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-04-step-2-review-2026-10-27)); this text includes their fixes. It closes the five gaps the first readiness review named: the owned-position and owned-order fields, how a protective order is identified, the `COMMAND_ADMITTED` payload for non-entry verbs, the not-sent `Outcome`, and the modify capital increase (answered by the owner: [Q-018](#a-limit-raise-on-an-entry-order-q-018)). Dispatch of these verbs is SLICE-05, so step 2 admits and does not send.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/execution.py` | `CancelRequest`, `ModifyRequest`, `ModifyChanges`, `CloseRequest`, `MarketOrder`, `LimitOrder`, `StopOrder`, their wire forms; `OwnedOrder`, `OwnedPosition`, `ActionFacts` |
| `src/autonomous_trading/contracts/evidence.py` | `ObservedOrder` gains the spec's `price` and `trigger_price` (keyword, default `None`) |
| `src/autonomous_trading/kernel/ports.py` | `HoldingsPort`; `SafetyPort.check(facts, auth)` and `ConflictPort.check(facts)` replace the step-1 signatures; `AdmissionPorts.holdings` (last field, no default) |
| `src/autonomous_trading/kernel/admission.py` | `ActionAdmission`; `effect_check`; `action_facts`; `action_admitted_decision`; the `prot:` rule (`prot_key_check`) at A1 of both doors; `refused_decision` takes the verb from `wire(request)["verb"]`; `admitted_decision` adds `"effect": None` and `"underlying"` |
| `src/autonomous_trading/kernel/coordinator.py` | `Coordinator.action_admission = None`; `admit_action(request, *, auth=None) -> Outcome`, raising `RuntimeError` when not composed, as `admit_entry` |
| `src/autonomous_trading/bootstrap.py` | Sets `coordinator.action_admission = ActionAdmission(coordinator, ports=admission, settings=settings)` beside `EntryAdmission` |
| `src/autonomous_trading/kernel/ledger/store.py`, `projections.py` | The `COMMAND_ADMITTED` shape check (below) in `_inside` step 4, after `validate_payload`, raising `PayloadInvalid` (`LED-R06`); the fold writes a reservation only when `reservation_id` is not `null` |
| `src/autonomous_trading/resources/events.schema.json` | `COMMAND_ADMITTED`: the entry-only fields nullable (the validator accepts a type list, `envelope.py:94-97`); adds `effect` (`["object","null"]`) and `underlying` (`string`) |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `dispatch.deadline_ms_cancel`, `_modify`, `_close` (refusing) |
| `tests/conftest.py` | `FixtureHoldings`; `make_observed_order(**changes)`, `make_owned_order`, `make_owned_position`; the action fixture issues a second grant `g-act` (`cancel`, `modify`, `close`) |
| `tests/unit/test_admission_checks.py` | The action rows of PRF-ADM-04, CUJ-ADM-2, CUJ-ADM-4 (a section after the entry rows); the entry door's `prot:` refusal |
| `tests/unit/test_policy_parameters.py` | The three new settings; `AdmissionPorts` built with `holdings` |
| `tests/contracts/test_capabilities.py` | `"ActionAdmission(": {"bootstrap.py"}` and `".action_admission.admit": {"kernel/coordinator.py"}` join `_BUILDERS` |

### Contracts

```text
CancelRequest(command_key, principal, account, broker_order_id)
ModifyRequest(command_key, principal, account, broker_order_id, changes: ModifyChanges)
ModifyChanges(trigger_price | None, limit_price | None, quantity | None)
CloseRequest(command_key, principal, account, position_id, quantity: int, order: MarketOrder | LimitOrder | StopOrder)
MarketOrder()    LimitOrder(price)    StopOrder(trigger, limit | None)
OwnedOrder(broker_order_id, command_key, verb, leg_role, account, strategy, underlying, instrument,
           side: BUY | SELL, position_id, order_kind: market | limit | stop, managed_by_protection: bool)
OwnedPosition(position_id, entry_command_key, leg_role, account, strategy, underlying, instrument,
              owned_quantity: int)                     # signed
ActionFacts(verb, principal, account, strategy, underlying, position_id | None, target_order_id | None,
            order_kind | None, resting: bool, target_protective: bool, target_unfilled: bool | None,
            owned_quantity: int | None, filled: int | None, new_total: int | None, sale_delta: int,
            removes_stop: bool)
HoldingsPort.order(account, broker_order_id) -> OwnedOrder | None
HoldingsPort.position(account, position_id) -> OwnedPosition | None
SafetyPort.check(facts: ActionFacts, auth) -> Refusal | None
ConflictPort.check(facts: ActionFacts) -> Refusal | None
```

* **Construction rules.** `ModifyChanges` needs at least one field; its prices and `LimitOrder.price`, `StopOrder.trigger` and `StopOrder.limit` satisfy `is_money(v)` and are above zero; `quantity` is an int above zero and is the new **total** order quantity (filled + remaining). `CloseRequest.quantity` is an int above zero. A violation raises `ValueError` at construction and never reaches admission.
* **Wire forms** (the request digest's input): `{"verb": "cancel", "command_key", "principal", "account", "broker_order_id"}`; modify adds `"changes": {"trigger_price", "limit_price", "quantity"}`; close is `{"verb": "close", …, "position_id", "quantity", "order": {"kind": "market"} | {"kind": "limit", "price"} | {"kind": "stop", "trigger", "limit"}}`.
* **There is no side field.** The package admits long positions only, so every close is a SELL; a request cannot name a side, so it cannot name the wrong one.
* **Entries use `ActionFacts` too.** Step 1's ports change signature: the entry door passes `ActionFacts(verb="entry", principal, account, strategy, underlying, position_id=None, …, resting=False, target_protective=False, sale_delta=0, removes_stop=False)`, all other fields `None`. The fixture ports ignore the extra fields; SLICE-05 and SLICE-06 bind the real relation and matrix without changing admission (design review D-B1, D-B2).

### Ownership

* **Where each field comes from** (the real port, bound in SLICE-05 for orders and SLICE-07 for positions; `FixtureHoldings` supplies the same fields in step 2, since no close or protective order reaches the ledger before SLICE-05 dispatches it):

  | Field | Source |
  |---|---|
  | `OwnedOrder.command_key`, `leg_role`, `account` | `broker_identity` (kind `order_id`) joined to `command_identity` of the same account |
  | `verb`, `strategy` | `command_identity` |
  | `underlying` | the command's `COMMAND_ADMITTED.underlying` (an entry: its intent's; an action: its target's) |
  | `instrument`, `side`, `order_kind` | an entry leg: `plan.legs` by role, BUY, `limit` if the leg has a limit price else `market`; a basket `stop` or `target` leg: `PlanRef.protective_legs` by role, SELL, `stop` or `limit`; a close: the position's instrument, SELL, `request.order.kind` |
  | `position_id` | an entry leg or basket leg: digest(entry `command_key`, the **entry** leg's role) (ledger `position` rule); a close: `request.position_id`. Never null |
  | `managed_by_protection` | the command key has the prefix `prot:` |
  | `OwnedPosition.*` | the ledger `position` row; `underlying` from its entry's `COMMAND_ADMITTED.underlying`. Before the entry's first fill the port returns the same `position_id` with `owned_quantity` 0, as the protection spec's `PositionView` does |

* **Owned** means the port returns a row for that account. A row of another account is not owned.
* **Protective** is one predicate, `is_protective(order)`: an owned **SELL** whose `order_kind` is `stop` or `limit`, created by a close (from any principal) or as a basket `stop` or `target` leg. It is never a broker flag. B2, the facts given to the conflict relation, and from SLICE-05 capacity's `protective_order_ids` all use it (design review D-M2). For every order legacy could place (its protective legs and trail stops) it gives the same set as legacy's `protective_order_ids`; until SLICE-05 no such order exists, so capacity's set stays empty, as built. A **resting protective order** is a protective order whose fresh observation shows status `open`.
* **The `prot:` key rule** (`prot_key_check`, A1 of **both** doors, `ADM-R01` recorded): a command key starting `prot:` is admitted only when `request.principal == Principal("kernel:protection", "kernel")` (A2 then also requires `auth.principal == request.principal`, in stage A and in the stage-B repeat), the verb is not `entry`, and the key `prot:<position_id>:<role>:<n>` matches the request: a close's `position_id` equals the key's, and role `stop` goes with `StopOrder`, `target` with `LimitOrder`, `close` with `MarketOrder`; a cancel's or modify's target order has that `position_id`, and its `leg_role` or its command's key role equals the key's role. Otherwise a caller could make its order look like a protection leg and corrupt the leg state protection reads by key prefix (design review D-M1, D-M3).

### `Coordinator.admit_action(request, *, auth=None) -> Outcome`

One front door for the three verbs; `admit_entry` stays the entry door. Each check stops at its first failure; every refusal is recorded `ADMISSION_REFUSED` (`verb` from the request's wire form, `inputs.check`, and for B2 `inputs.reason`) except `LED-R01` and `LED-R02`.

| # | Check | Refusal |
|---|---|---|
| A1 | Key present; `prot_key_check` | `LED-R01`; `ADM-R01` |
| A1a | Identity pre-check (SLICE-01) | `LED-R02` / existing outcome |
| A2 | `authority.check(verb, auth, account)` | `SES-R01…R05`, `SES-R09` |
| A4 | `safety.check(facts, auth)`, `facts = action_facts(...)` built from the latest observation read outside the transaction (a target that is not owned gives `strategy = None`; B2 then refuses it) | its refusal |
| B | Inside the `COMMAND_ADMITTED` transaction (`Decision.precheck`, as step 1), in this order: B:A2, B1, B2, B:A4, B3 | as above, `B:A2`, `B:A4` |
| B1 | The account observation exists; orders, positions and funds each complete or `unknown`, age 0 … `reconciliation.max_observation_age_secs`. No view and no spot or chain limit | `ADM-R05` |
| B2 | `effect_check` (below) on the fresh observation | `ADM-R07`, reason in `inputs.reason` |
| B:A4 | `safety.check(facts, auth)` with the facts B2 computed from the fresh observation; the kill exceptions (an owned unfilled order; a non-resting close) are judged here | its refusal |
| B3 | `conflicts.check(facts)` | its refusal |

* **No busy check for actions.** The first release binds `coordinator.busy_applies_to: entries_only` (Q-004), the only value the loader accepts, so actions never wait on the busy bound. If the owner ever binds `all`, the loader, `_busy` (given the verb) and a test arrive together (readiness review R-M1).
* **No A3, A5, planning, B5 or B6.** An action needs no open session, so a close after the session's `CLOSED` is admitted (CUJ-ADM-4; the protection spec's session-close exits depend on it).
* **Deviation (order of stage B):** the intent spec repeats A4 before B1. For actions B:A4 runs after B2, because the kill exceptions need the facts only the fresh observation gives (design review D-B2). Only which refusal code wins changes when two checks fail together.

### B2 effect (`effect_check`)

```text
effect_check(request, order: OwnedOrder | None, position: OwnedPosition | None, observation)
    -> tuple[str | None, dict, dict]          # (refusal reason or None, resulting_exposure, effect)
```

A pure function, so each row is tested directly. `action_facts` reuses its intermediate values.

Notation: `o` is the target's row in the fresh orders observation (by `broker_order_id`); `filled = o.filled_quantity`; `remaining = o.quantity − filled`. `net` is the `net_quantity` of the single position-observation row whose `instrument` is `p.instrument`: with no row, `net` is 0 when the positions observation's coverage is `yes` and unknown otherwise; with more than one row, unknown. `owned(p) = min(p.owned_quantity, net)`, unknown when `net` is.

| Verb | Admitted only when | Reason on refusal |
|---|---|---|
| all orders | the order is owned; `o` exists; `o.instrument` and `o.side` equal the owned order's | `not_owned`, `not_open`, `identity_mismatch` |
| cancel | `o.status` is `open` | `not_open` |
| modify | `o.status` is `open`; when `changes.quantity` is set, `filled` is not `None` | `not_open`, `filled_unknown` |
| | `trigger_price` is set only on a `stop` order, `limit_price` only on a `limit` order, or a `stop` order with a limit (legacy refuses a target moved as a stop, `src/runtime/execution_gateway/__init__.py:1356-1360` @445eb116) | `wrong_field` |
| | a non-protective BUY order's limit is not raised above `o.price` ([Q-018](#a-limit-raise-on-an-entry-order-q-018)) | `wrong_field` |
| | `quantity` (new total) ≥ `filled` | `below_filled` |
| | new remaining (`quantity − filled`) ≤ `remaining`; **except** a resting protective order, whose new remaining may reach `owned(p)` of its `position_id` and no more | `above_remaining`, `above_owned`, `broker_net_unknown` |
| close | the position is owned; `owned(p)` is known and above 0 | `not_owned`, `broker_net_unknown`, `not_open` |
| | `quantity` ≤ `owned(p)` (market, limit or stop alike) | `above_owned` |

* `ADM-R07`'s message is `effect_mismatch`. CUJ-ADM-2 (sell 100 against an owned 50) is `above_owned`.
* Two closes against one position are each judged alone here; whether the second may run while the first is unresolved is conflict row 2, at B3 (SLICE-05).
* **Resulting exposure** (REQ-ADM-009): `{instrument: owned(p) − quantity}` for a close; `{instrument: owned(p)}` of the order's position for a cancel or modify, with `null` in place of the number when `owned(p)` is unknown.
* **`ActionFacts`** from B2: `order_kind` (close: the request's order kind; cancel, modify: the target's); `resting` (a close with a `LimitOrder` or `StopOrder`; a modify of a resting order); `target_protective` (`is_protective`); `target_unfilled` (`filled == 0`, `None` when `filled` is `None`); `owned_quantity` = `owned(p)`; `filled`; `new_total` (modify); `sale_delta` (close: `quantity`; a modify of a SELL: `max(0, new remaining − remaining)`; otherwise 0); `removes_stop` (a cancel of a protective `stop`).

### A limit raise on an entry order (Q-018)

A modify could raise committed capital only by raising a non-protective **BUY** order's (an entry leg's) `limit_price` above `o.price`, since B2 forbids raising its quantity. Legacy never modifies an entry order (its `modify` moves resting protective legs only, `src/runtime/execution_gateway/__init__.py:1292-1300` @445eb116), so there was no retained arithmetic for the increase. The owner answered [Q-018](../../decisions/owner-questions.md#q-018) with option A (legacy parity): in the first release such a modify is refused at B2 with `ADM-R07`, reason `wrong_field`. Lowering a limit, or keeping it, is admitted. So no action reaches B5 and no reservation is raised. No first-release **one-leg** entry can reach the rule, since each is a MARKET order ([protection spec, basket placement](../../design/protection-and-safety.md#basket-placement-basket_at_plan-kernelprotectionpy)); a structure entry's legs may carry limits, and their raise is refused.

### `COMMAND_ADMITTED` for an action

| Field | Value |
|---|---|
| `verb`, `target` | the verb; the `broker_order_id` (cancel, modify) or `position_id` (close) |
| `strategy`, `underlying` | the owned target's |
| `request`, `request_digest`, `account` | as for an entry |
| `plan_ref`, `plan_digest`, `plan`, `application`, `reservation_id`, `amount`, `margin`, `worst_case_loss`, `currency` | `null` |
| `dependencies` | `{dispatch_deadline: {origin, budget_ms: dispatch.deadline_ms_<verb>}, release_binding_id: null, grant_id, session_id: null}` |
| `state_heads` | `{reservation_head, orders_observation, positions_observation, funds_observation}` (each observation's own digest), as step 1 |
| `measured_ages` | `{observation_ms}` (the oldest of the three) |
| `resulting_exposure` | as B2 |
| `effect` (`null` for entries) | cancel `{remaining}` (`null` when `filled` is `None`); modify `{before: {quantity, filled, price, trigger_price}, after: {quantity, price, trigger_price}, protective}`, an unchanged field copying its `before` value; close `{quantity, order (wire), owned_quantity: owned(p), broker_net: net}` |

* **Shape check** (writer, `_inside` step 4, after `validate_payload`; `LED-R06` on failure): `verb == "entry"` requires every entry-only field above and `effect is None`; any other verb requires every entry-only field `null`, `effect` an object and `target` set. `admitted_decision` writes `"effect": None`, which also covers `_submit_admitted`.
* The fold writes `command_identity` (`verb`, `target`, `plan_digest` null, state `ADMITTED`) and no reservation row.

### The not-sent `Outcome`

`admit_action` returns `Outcome(command_key, attempt_no=None, effect="not_sent", canonical="committed", compat_projection="none", broker_order_ids={}, domain=None, sent=False, refusal=None)`: **admitted, awaiting dispatch**. The [ledger spec's `Outcome` table](../../design/ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy) gains this row (`attempt_no` `None`; resend: no, dispatch runs it), so a caller never reads it as the adapter's `not_sent` retry cue (design review D-M6). The same request again returns it with `canonical="unchanged"`, which is what `_existing_outcome` already gives an admitted command with no attempt. `Coordinator.recover` reads `CLAIMED` attempts only, so an admitted action stays `ADMITTED` across a restart until SLICE-05 dispatches it.

### Settings added

| Setting | Type | Env (`test` profile) | Notes |
|---|---|---|---|
| `dispatch.deadline_ms_cancel`, `_modify`, `_close` | int > 0 | `AT_DEADLINE_MS_CANCEL`, `_MODIFY`, `_CLOSE` | Q-011: measured (TASK-S11-07); refusing, in `Settings.ADMISSION_REQUIRED`. **Deviation (naming):** the dispatch spec writes `dispatch.deadline_ms.<verb>`; the loader keeps one flat key per verb under `dispatch`, as step 1 did for `deadline_ms_entry` |

### Step 2 tests (`tests/unit/test_admission_checks.py`, action section)

* `LED-R01`; the `prot:` rule: a human's `prot:` key, a protection key naming another position, and a role that does not fit the order each `ADM-R01` (A1, recorded), and an entry with a `prot:` key `ADM-R01`; A1a same request → existing outcome, other request → `LED-R02`; A2 → `SES-R01`; A4, B:A4 and B3 fixture refusals recorded with their checks, and the facts each received; B1 with only the orders book incomplete or old (`dataclasses.replace(observation, orders=...)`) → `ADM-R05`; a busy account still admits an action.
* `effect_check` directly, one test per row against a hand-worked observation: another account's order (`not_owned`); a filled order (`not_open`); an observed side that differs (`identity_mismatch`); modify below filled (`below_filled`); a quantity change with `filled` unknown (`filled_unknown`) while a trigger-only change with `filled` unknown is admitted; a non-protective remaining increase (`above_remaining`); a resting stop raised to `owned(p)` admitted and one more refused (`above_owned`); a trigger change on a target (`wrong_field`); CUJ-ADM-2 (`above_owned`); a close capped by a smaller broker net (`above_owned`); an overclosed position (`not_open`); coverage `unknown` with no position row, and two rows for one instrument (`broker_net_unknown`).
* Through the door: a limit raise on an entry order → `ADM-R07` `wrong_field` at B2, lowering it admitted; CUJ-ADM-4 (the clock past 10:00 UTC, `recovery.tick()`, `world.fresh()`; a market close of the owned quantity admitted).
* The `COMMAND_ADMITTED` fields above, the shape check refusing an action with a `reservation_id` and an entry with an `effect`, no reservation row, the `Outcome` above, the same request again `unchanged`, and a reopen leaves the command `ADMITTED`.
* Break checks (added to the file's docstring): cap a protective raise at `remaining` instead of `owned(p)`; accept a trigger change on a target; accept a `prot:` key from a human; apply the busy bound to an action under `entries_only`; build `ActionAdmission` in `operations/verification.py` (the capability test).

### Step 2 as built

Commit `575c897` on `slice-04`, after `2ed1c39`. It changes exactly the 16 paths of the step 2 files table. The owner's Q-018 answer was applied in `0affceb` (`kernel/admission.py` and `tests/unit/test_admission_checks.py`: the refusal moved from `ADM-R09` at B5 to `ADM-R07` `wrong_field` at B2; 252 tests passed; its break check failed as required).

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| `underlying` | Nullable in the schema: the private SLICE-01 seam `_submit_admitted` has no intent and writes `null`; the shape check requires it for actions, and the entry door writes the intent's. **Deviation** from the payload table's `string` |
| Price form | `contracts/execution.py` checks prices against its own copy of the ledger's money pattern (above zero), because `contracts` never imports `kernel` |
| `FixtureHoldings` | Returns a row by ID whatever its account, so `effect_check`'s own account test is exercised |
| Observed order | `effect_check` uses the target's row only when exactly one orders-observation row has its ID; none or several → `not_open` |
| `prot:` role for cancel and modify | The key's role must equal the target order's `leg_role`, or the role in its own `prot:` command key |
| Deadlines in tests | `deadline_ms_cancel` and `_modify` 8000, `_close` 9000: labelled synthetic values |

**Tests** (252 passed with `scripts/safe_tests.py`, no broker variables; the step 1 tests unchanged):

| File | Cases |
|---|---|
| `test_admission_checks.py`, action section | `effect_check` directly: ownership, not open, missing row, identity mismatch; modify below filled, `filled_unknown` only with a quantity, a target's trigger and an SL-M stop's limit (`wrong_field`); a protective raise to 50 admitted and 51 refused, an entry order's increase `above_remaining`; CUJ-ADM-2, a smaller broker net, overclosed, unknown and ambiguous nets, another account's position. Through the door: the admitted payload, no reservation, the admitted-awaiting-dispatch `Outcome`, same request `unchanged`, `LED-R02`; the command stays `ADMITTED` across a reopen; A2, A4, B3 and B2 records with verb and reason; the facts the safety and conflict ports receive; B1 on the orders book alone; a busy account still admits an action; the `prot:` rule on both doors (a human's key, another position, a role that does not fit, protection's valid modify, an entry); a limit raise on an entry order `ADM-R07` `wrong_field` (B2) and a lowering admitted; CUJ-ADM-4 after the session `CLOSED`; the shape check refusing an action with a reservation and an entry-shaped field set |
| `test_policy_parameters.py` | The three deadlines resolve and refuse unbound |
| `test_capabilities.py` | `ActionAdmission(` only in `bootstrap.py`; `.action_admission.admit` only in the coordinator |

**Break checks** (each applied, run, and reverted byte for byte; every one failed its test):

| Change | Test that failed |
|---|---|
| Cap a protective raise at `remaining` | `test_b2_protective_raise_reaches_owned_and_no_more` |
| Accept a trigger change on a target | `test_b2_modify_rows` |
| Accept a `prot:` key from a human | `test_prot_key_rule_both_doors` |
| Apply the busy bound to an action | `test_busy_never_holds_an_action` |
| Accept an ambiguous broker net | `test_b2_close_rows` |
| Remove the shape check | `test_shape_check_refuses_mixed_admissions` |
| Admit a modify that raises an entry order's limit | `test_entry_limit_raise_refused_q018` |
| Build `ActionAdmission` in `operations/verification.py` | the capability test |

## Step 3 — the planning port (`one_leg_v1`)

Deepened after step 2 landed, from two line-by-line reads of the legacy planners at `OA@445eb116`, then reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-04-step-3-review-2026-10-27)); this text includes their fixes. Abbreviations: **O** `src/core/framework/runtime/orchestrator.py`, **G** `sizing/gates.py`, **Q** `sizing/quantity.py`, **S** `selection/strikes.py`, **P** `protection/stops.py`, **R** `execution/orders.py`, **SP** `structures/planner.py`, all under `src/core/framework/`; **L** `scripts/run_framework_live.py`; **SS** `src/runtime/session_state.py`; **RF** `src/data/reference/store.py`. The owner's [Q-019 answer](../../decisions/owner-answers-2026-10-27.md) fixes the plan's money figures.

### What legacy does, and what that decides

* **The shipped strategy plans one way only.** BuyerEdge emits only `structure_id = "single_long_option"` (`src/strategies/buyer_edge.py:2313-2322`); live calls `plan_structure` only for other ids (L:4123). Every first-release entry goes through the one-leg `plan()` (O:385-845). Step 3 builds that path, `one_leg_v1`, and the dispatch.
* **`structure_v1` moves to step 4**, deepened before it is built. Legacy's structure definitions are untyped mappings (`src/core/framework/policy/types.py:14-44`) whose resolution runs evidence checks inline, the only shipped structures with more than one leg are test fixtures with SELL legs (which the package does not admit), and the [protection spec](../../design/protection-and-safety.md#structures-kernelprotectionpy) gives each structure leg its own stop, so the structure path needs its own decisions. Until step 4, `implementation_for` refuses every id other than `single_long_option` with `PlanRefusal("select", "structure_planner_not_built")`. No shipped strategy emits such an id; the build is disarmed, and nothing live changes.
* **Legacy computes no plan money figures for a one-leg entry** and reserved none: its capacity reservation existed only for structure plans (`structure_reservation_snapshot`, L:437-553), with `margin` from OpenAlgo's margin preview (L:480-509). The figures are the owner's [Q-019](../../decisions/owner-questions.md#q-019) answer (below).
* **Legacy is impure in ways the port removes** (D07): events, the kill-switch file, wall clocks, the loss-latch file read and **write** mid-plan (O:538-563), the greeks store and reference-facts file through callables, and the order registry (table below).

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/market.py` | `StableView` gains `spot`; new `ChainSnapshot`, `ChainRow`, `OptionQuote`, `ReferenceFacts`, `ReferenceMissing` |
| `src/autonomous_trading/contracts/decisions.py` | `PlannerPolicy`, `StrikePolicy`, `SizingPolicy`, `StopPolicy`, `SessionLimits`; `EntryFacts`; `Plan.entry_facts` (keyword, last, default `None`); `BoundPolicy.planner` (keyword, last, default `None`); `SessionStats.seconds_since_last_entry` becomes `float \| None` (legacy G:171) |
| `src/autonomous_trading/contracts/execution.py` | `wire` for finite floats and the new dataclasses |
| `src/autonomous_trading/kernel/selection.py` | The extracted pure functions: `select` (S:131-287), `quantity_for` (Q:31-102), `entry_stop` (P:124-163), `to_tick` (R:218-270), `legacy_rows`, `implementation_for(structure_id)` |
| `src/autonomous_trading/kernel/planner.py` | `Planner` (the object composed into `AdmissionPorts.planner`) with `.plan(intent, *, account, view, chain, reference_facts, policy, stats, now)`; `one_leg_v1`, `session_gates` (G:180-256 with O:575-589), `money_figures`; `FixturePlanner` takes the same signature |
| `src/autonomous_trading/kernel/ports.py` | `MarketPort.chain(view_id)`, `MarketPort.reference_facts(underlying, decision_at)`; `SessionStatsPort.stats(intent, now)`; `AdmissionPorts.stats` (last field) |
| `src/autonomous_trading/kernel/admission.py` | Reads view, chain, reference facts, stats after the view check; the chain must match the view; passes `account` |
| `src/autonomous_trading/bootstrap.py` | Unchanged signature; the ports carry the planner |
| `tests/conftest.py` | `make_intent` defaults `structure_id = "single_long_option"`; `planner_policy(**changes)`, `make_chain`, `make_stats(**changes)` (G:164-176 defaults), `FixtureStats`; `FixtureMarket` serves chains and reference facts |
| `tests/unit/test_planner_rules.py` | PRF-ADM-03, the golden cases, Q-019 |
| `tests/unit/test_admission_checks.py`, `tests/unit/test_policy_parameters.py` | The planning inputs at the door; `AdmissionPorts` built with `stats` |
| `tests/fixtures/planner_parity_445eb116.json` | New: the golden cases (tree delta **T-26**) |

### Inputs

```text
Planner.plan(intent, *, account, view: StableView, chain: ChainSnapshot,
             reference_facts: ReferenceFacts | ReferenceMissing, policy: BoundPolicy, stats: SessionStats,
             now: Timestamp) -> Plan | PlanRefusal
StableView(view_id, underlying, calendar_id, bar_open, bar_close, spot_as_of, chain_as_of, spot: str)
ChainSnapshot(underlying, expiry, as_of: Timestamp, rows: tuple[ChainRow, ...])    # one expiry; provider's row order
ChainRow(strike: str, lotsize: int | None, tick_size: str | None, ce: OptionQuote | None, pe: OptionQuote | None)
OptionQuote(symbol, ltp, bid, ask, oi, volume, delta, gamma, tick_size)   # each a finite decimal string or None, symbol a str
ReferenceFacts(underlying, trading_date, lot_size: int | None)            # the fact in force and known at decision_at
ReferenceMissing(reason: no_fact | not_yet_available | not_in_force)      # RF:190-206's reasons
```

* **`account`** joins the spec's signature (a named deviation in the intent spec): the planner seals the plan, and `Plan.account` is the request's.
* **Number forms.** Prices and tick sizes are money strings with exactly two decimals (the ledger's form); `strike`, `oi`, `volume`, `delta`, `gamma` and `spot` are finite decimal strings. The provider writes every number as Python's `repr` of the float it read, so `float(s)` inside the extracted code returns the very float legacy computed with, and selection arithmetic stays legacy's (floats) bit for bit. A record that violates a form cannot be constructed.
* **`legacy_rows(chain)`** builds legacy's flat-chain row dicts, in chain order, always emitting every key (`None` when absent): `strike` (`float`), `lotsize` (`int` or `None`), `tick_size`, and for `ce` and `pe`: `{p}_symbol` (`str` or `None`), `{p}_ltp`, `{p}_bid`, `{p}_ask`, `{p}_oi`, `{p}_volume`, `{p}_delta`, `{p}_gamma`, `{p}_tick_size` (each `float` or `None`). The keys are those legacy reads (S:177-210, O:626, O:853-869); per-symbol `delta` and `gamma` replace the `delta_of`/`gamma_of` callables (O:596-599, O:693).
* **One expiry.** A snapshot holds one expiry, as the market spec states; the one-leg selector normalizes OI and volume over the whole snapshot (S:245-246), so which expiry the host supplies is part of the input, as live (inference: live passed the nearest expiry's chain).
* **Values legacy live never passed** keep legacy-live values: `iv_rank = None` (S:164, S:233), no `gex_levels` (S:263, neutral 0.5), `consecutive_wins = 0` (O:393), `held = None` (L:4199-4224, so the exposure stage is INERT). Using the intent's `iv_rank` would change which entries pass `iv_rank_max`, so it is the owner's, and not done.
* **From the intent:** `direction` (`long_call` → `"CE"`, `long_put` → `"PE"`), `scores.signal_score` (`float`, `None` → 0.0, O:390), `scores.conviction` (to sizing, which ignores it, Q:59-64), `as_of` (rendered as its `utc_iso` in reason texts; legacy printed its own ISO string, a named text deviation), `candidate_id`, `view_id`.

**At the door** (`EntryAdmission`, after the view check, in this order): `chain = market.chain(intent.view_id)`; `None`, or `chain.underlying != view.underlying`, or `chain.as_of != view.chain_as_of` → `ADM-R05` (`B1`, reason `chain_missing` or `chain_mismatch`), so the planner never prices from a chain B1 did not age; then `reference_facts = market.reference_facts(intent.underlying, intent.as_of)`; then `stats = stats_port.stats(intent, now)`.

**Reference facts at the decision instant.** The market port applies legacy's rule (RF:190-206): the fact in force on the exchange date of `decision_at` and already known at it, the latest by availability and revision; otherwise `ReferenceMissing(reason)`. The time-zone conversion happens in the port, not in the pure planner.

### `PlannerPolicy` (the bound policy's planner part)

Every value is a policy value from the bound bundle (SLICE-11); none is set by this slice; tests bind labelled synthetic values through `planner_policy(**changes)`. Types are legacy's.

| Contract | Fields and types |
|---|---|
| `StrikePolicy` (S:44-63, defaults S:31-40) | `min_oi`, `min_volume`, `max_spread_pct`, `asym_threshold`, `iv_rank_max`: `float`; `min_score`: `int`; `delta_base`, `delta_pivot`, `delta_max`, `score_pivot`, `delta_band`, `max_delta_gap`, `delta_weight_base`, `delta_weight_range`, `range_pct`: `float`. `activate_at_max_pts` (S:52) is the trail's, not selection's, and goes to SLICE-06 |
| `SizingPolicy` (Q:21-29) | `base_lots`, `adaptive_win_streak_trigger`, `adaptive_win_streak_step`, `adaptive_max_lot_mult`: `int`; `adaptive_enabled`: `bool`; `max_notional`: `float`. `lot_size` is dropped: the plan always requires a proven lot (O:658) |
| `StopPolicy` (O:119-155; P:30-48, 66, 83) | `moneyness_bands`: `tuple[tuple[float, str, float, float, float], ...]` (|delta| floor, label, stop width %, target multiple, activation multiple; empty → `MONEYNESS`, P:34-41); `min_sl_pts`, `fallback_sl_pct`, `max_sl_pts`: `float \| None` (`None` → 10, 30, 40); `target_pts`: `float` |
| `SessionLimits` (G:28-42) | `max_trades_per_session`, `max_entries_per_desk`, `max_open_structures`, `max_consecutive_losses`, `drawdown_rate_window_mins`: `int`; `require_fresh_setup`, `drawdown_rate_enabled`: `bool`; `entry_cooldown_secs`, `max_daily_loss_pct`, `max_daily_loss_amount`, `max_daily_profit_amount`, `drawdown_rate_max_loss`: `float`; `no_new_trade_after`: `str` (`"HH:MM"` IST or `""`) |
| `PlannerPolicy` | `stance`: `"buyer"` only (the seller stance is documented unbuilt, R:52-94); `max_held`: `float` (O:136); `strikes`, `sizing`, `stops`, `limits`; `debit_price`: `ltp` \| `ask`; `worst_case_loss`: `full_debit` \| `to_stop`. Construction refuses `ask` with `to_stop`, a pairing the owner did not sanction |

* `BoundPolicy.planner` defaults to `None`, so step 1–2 fixtures are unchanged; `one_leg_v1` with `planner is None` refuses `PlanRefusal("select", "planner_policy_unbound")`.
* `Plan.policy_digest = digest(wire(policy.planner))`. Legacy's digest (O:378-382) also hashed non-planner desk fields; **Deviation**, recorded for PRF-ADM-07. `wire` writes a finite float as itself (the ledger's canonical JSON writes it with `repr`).
* The leg product is `BoundPolicy.product` (POL-017); legacy's `desk.product` (O:155) maps to it. `fallback_sl_pts` (O:119) is not carried: its only path (P:163) is unreachable from `plan()` (O:611, O:696).

### The plan's money figures (Q-019 answer: option B)

`money_figures(leg, policy.planner, stop)`, in `Decimal` on the strings, results written with exactly two decimals:

| Setting | Value | Figure |
|---|---|---|
| `debit_price` | `ltp` (**first release**) | `amount = Decimal(ltp) × quantity`, legacy's entry premium (`_premium_of`, O:845-858) |
| | `ask` (documented alternative A) | `amount = Decimal(ask) × quantity`; no ask → `PlanRefusal("request", "no ask price for <symbol>")` |
| `worst_case_loss` | `full_debit` (**first release**) | `worst_case_loss = amount` |
| | `to_stop` (documented alternative C, only with `ltp`) | `(Decimal(ltp) − Decimal(format(stop, ".2f"))) × quantity`, legacy's `proposed_risk` (O:757) |

`margin = amount` for every value: a long option's margin is its premium. The owner chose B and asked that A and C stay documented and selectable by configuration; both are implemented and tested, and only the bound values are in force.

### `one_leg_v1` (O:385-845)

| Legacy stage (lines) | Target | Refusal (`PlanRefusal(stage, reason)`) |
|---|---|---|
| setup (O:407-424) | Nothing; legacy's identity and context fields are not carried (below) | — |
| `intent` (O:426-429) | Unreachable: A1 refuses an abstaining intent | — |
| `kill_switch`, `freshness`, `view_freshness`, `view_lag`, `loss_latch` (O:431-565) | **Moved out** (LD-03): `kernel.safety` (A4) and admission B1 | — |
| `session_gates` (O:575-589 → G:180-256) | `session_gates(limits, stats, view.underlying)` in G's order, first refusal wins; with no cap configured a refusal's text gains `" (0 caps configured — INERT)"` (O:577-579) | `session_gates`, G:184-254's texts, verbatim |
| `strike` (O:595-617 → S:131-287) | `select(rows, spot, direction, signal_score, strikes, iv_rank=None)`; premium = the leg's `ltp` (O:607) | `strike`: `"no contract in the chain passed the selection policy"`, plus `": " + why_not[-1]` when `why_not` is not empty (O:601-603); the non-positive premium text (O:611-615) |
| lot size (O:625-653) | The chosen row's `lotsize`; else `reference_facts.lot_size` | **`lot_size`** (the spec's stage, F-A4, POL-022; legacy wrote stage `quantity`, a named deviation): `ReferenceMissing` → O:634-637's text with `exc` = its `reason` (legacy printed its exception, a named text deviation); a lot that is not a positive integer → O:640-644's text. O:648-652's text is unreachable (the port always answers) |
| `quantity` (O:654-663 → Q:42-102) | `quantity_for(..., require_lot_size=True)` | `quantity`: `sized["reason"]` or `"sizing refused"` (O:661) |
| `exposure` (O:676-689) | Kept, `held = None`, so INERT | `exposure` (O:679-683) |
| `stop` (O:693-744 → P:124-163, R:52-94, R:234-270) | `entry_stop` with the chosen row's delta; `stop = premium − stop_pts`, `target = premium + target_pts`; tick from the row (`{p}_tick_size`, then `tick_size`), else 0.05 (O:861-876, R:218), as legacy, with no reference tick; stop rounded up, target down (R:268-270) | `stop`: O:723-742's three texts |
| `loss_budget` (O:749-771) | Kept exactly | `loss_budget` (O:761-766) |
| `request` (O:775-785) | Build the leg and the plan | `request`: `"no ask price for <symbol>"` (`ask` only) |

* **Reason texts** are legacy's, produced by the same f-strings on the same floats, except the two named deviations above.
* **Exceptions legacy let escape** (an unknown stance, R:86; an empty symbol, R:107-108; a string strike, S:183) cannot reach the planner: the contracts refuse them at construction. Any other exception is `ADM-R13`, stage `internal` (built).
* **Strike ties:** the first row in chain order wins (S:225, S:276); the market port keeps the provider's order.
* **Verify at the source** (unchanged here): legacy compares the raw delta with a positive band (S:199-205); if the greeks store gives PE deltas as negative, no PE row passes. Parity keeps it; SLICE-08's PRF-ADM-07 checks it against the greeks source.

### The `Plan` it returns

| Field | Value |
|---|---|
| `planner_version` | `"one_leg_v1+OA@445eb116"` |
| `structure_id`, `candidate_id`, `view_id` | the intent's |
| `account`, `intent_digest`, `policy_digest` | the input; `kernel.policy.intent_digest(intent)`; above |
| `legs` | one `PlanLeg("entry", symbol, BoundPolicy.product, "BUY", quantity, None, unit="contracts", lot_size=lot, amount=<the leg's debit>, tick_size=format(tick, ".2f"))`; MARKET (R:98, R:124-126) |
| `amount`, `margin`, `worst_case_loss`, `currency` | Q-019 above; `"INR"` |
| `residual_exposure` | `str(quantity)` (the exposure stage's `after` with `held` unknown) |
| `protection_policy_ref` | legacy's `stop_source` (O:705) |
| `protective_levels` | `(("stop", format(stop, ".2f")), ("target", format(target, ".2f")))`; both lie on the tick grid (R:247-253) |
| `entry_facts` (new) | `EntryFacts(entry_premium, entry_delta, target_delta, asym_score, trail_conviction, sl_pts)`: the LTP premium the stop and target were priced from, and the selection values protection's trail seeds from ([protection spec, first desire](../../design/protection-and-safety.md#protective-stop-and-tick-exits-kernelprotectionpy); O:607, O:617, O:826-841); premium as a two-decimal string, the rest as `repr` strings or `None` |
| `plan_digest` | `seal(plan)` (built) |

`Plan`'s field list in the intent spec and PRF-ADM-08 gain `entry_facts`. **Not carried**, and why: `plan_id`, `decision_id`, `attempt`, `our_order_id`, the proposal receipt and binding digest (identity is the command key); `stage_results`, `inert_at`, `not_evaluated`, `refused_at` (a refusal is the `PlanRefusal`, recorded by admission); `operating_limits`, `context` (the policy digest and `SessionStats` stand in); the ENTRY event's `spot`, `lot_source` and `signal_score` (the view and intent carry them).

### `SessionStats` (TASK-S04-06)

The planner takes `SessionStats` as a value. Step 3 adds `SessionStatsPort` with `FixtureStats(stats)`; deriving it from the ledger needs fills, positions and session P&L, which arrive in SLICE-07 and SLICE-06, so the real port is bound there. Until then a fixture states each value. The derivation each field must keep:

| Field | Read at | Legacy derivation |
|---|---|---|
| `trade_count` | O:421, G:204 | SS:63-68, 105 |
| `desk_trade_count`, `desk_open_structures` | G:189, G:194 | SS:69-80 |
| `setup_fresh` | G:199 | L:6790-6798, L:6891-6893 (default `True`) |
| `open_stop_risk` | O:759 | SS:114-147 |
| `consecutive_losses` | O:420, G:209 | SS:88-103 |
| `entry_in_flight` | G:185 | SS:86 |
| `seconds_since_last_entry` | G:214-216 | SS:81-85, 235-238 |
| `daily_pnl` | O:758, G:221-238 | SS:212 |
| `capital` | O:752-753, G:220 | SS:185-188 |
| `window_pnl_change`, `pnl_history_len` | G:231-233 | SS:227-234 (a process global; the target keeps the history in the ledger, so a restart no longer resets it: a correction for PRF-ADM-07) |
| `now_hm` | G:244-254 | the exchange-local `HH:MM` of `now`, computed by the stats port (live used the wall clock, L:7969) |
| `unavailable` | G:182-184 | SS:203-225, 250-251 |

### Moved couplings

| Legacy (lines) | Target |
|---|---|
| `emit` (O:291-296, O:826-841) | none: admission records the result |
| kill switch (O:433); freshness, view age and lag, wall clocks (O:446-517, O:81) | `kernel.safety` (A4); admission B1; the `now` input |
| loss latch read and **write** (O:538-563) | `kernel.safety` (A4 reads; only safety trips) |
| greeks store, reference-facts file (L:6774-6787, L:222-227) | `ChainSnapshot`; the market port's `reference_facts` |
| `Session` from the registry, governance evidence, broker positions, a process global and the wall clock (SS) | the `SessionStats` input |
| registry `open_order` write (O:789-813) | none (live passed `write_registry=False`, L:4217) |
| `Limits.from_env` (G:64-106) | `PlannerPolicy.limits` |

### Golden parity cases (the outside judge)

`tests/fixtures/planner_parity_445eb116.json`:

```text
{"legacy_commit": "445eb116",
 "generator": {"sha256": <of source>, "source": <the generator's full Python text>},
 "cases": [{"id", "inputs": {"intent", "view", "chain", "reference_facts", "planner_policy", "stats", "now"},   # target wire forms
            "legacy_rows": [<the row dicts legacy's plan() received>],
            "legacy": {"stage", "reason", "symbol", "quantity", "stop", "target"}}]}       # stop, target: format(x, ".2f")
```

* **Generation**, once, in an isolated checkout of `OA@445eb116` with no broker variables: the generator reads each case's target-form inputs, converts them to legacy's forms with its own code (it never imports OA_NEW), stores the row dicts it built as `legacy_rows`, runs legacy's `plan()` with `write_registry=False`, no kill-switch file, no latch directory and a fixed clock, and records the first refusal's stage and reason or the result. The source is embedded, so the fixture can be audited and regenerated.
* **The test**, one parametrized case each: `legacy_rows(chain) == case.legacy_rows` (the adapter is judged against the generator's independent conversion), then `Planner.plan(...)` gives the same stage (with legacy's `quantity` mapped to `lot_size` for the lot texts), reason, symbol, quantity and two-decimal stop and target.
* **Cases:** each strike refusal (six `why_not` texts, the non-positive premium) and a pass with a tie; each session gate, with and without configured caps; each lot path; each stop path (delta band, premium fallback, floor, cap, tick up and down, the three refusals); the loss budget pass and refusal; an intent with `iv_rank` `"99"` against an `iv_rank_max` of 50 that legacy still admits (legacy-live parity); a chain whose ltp and ask differ.

### Step 3 tests (`tests/unit/test_planner_rules.py`)

* **PRF-ADM-03 purity:** every module is imported first; during `plan` the sandbox makes `builtins.open`, `io.open`, `os.open`, `socket.socket`, `time.time`, `time.monotonic`, `time.perf_counter` raise, replaces `os.environ` with a mapping that raises on read, and swaps the `datetime` name in `kernel.planner` and `kernel.selection` for a raising stub (the C type cannot be patched).
* Every session gate, `unavailable` with and without configured caps; dispatch (`single_long_option`, any other id refused `structure_planner_not_built`, `planner_policy_unbound`); POL-015 (stop up, target down); POL-022 and F-A4 (row lot, then reference facts, each refusal); F-A3; `ask` with `to_stop` refused at construction.
* The golden cases.
* **Q-019:** for `ltp`/`full_debit`, `ask`/`full_debit` and `ltp`/`to_stop`, `amount`, `margin` and `worst_case_loss` against hand calculations on a chain whose ltp and ask differ; `ask` with no ask refused.
* **Through the door:** `chain_missing`, `chain_mismatch` (another underlying, another `as_of`); a `one_leg_v1` plan from fixture market data admitted, its `plan` and `entry_facts` recorded.
* **Break checks** (named in the docstring): read the wall clock in the planner (the sandbox fails); pass the intent's `iv_rank` (the `"99"` case fails); round the stop down (the tick-up case fails); use `reference_facts.lot_size` ahead of the row's (the lot case with both fails); price `amount` at the ask under `ltp` (the differing ltp/ask case fails); drop the chain-to-view check (`chain_mismatch` fails).

### Step 3 as built

Commit `1aa02b8` on `slice-04`, after `0affceb`. It changes 12 paths: the step 3 files table less `bootstrap.py`, which needed no change (the ports carry the planner).

**The golden fixture.** `tests/fixtures/planner_parity_445eb116.json` holds 43 cases, generated once by running legacy `plan()` from a `git archive` export of `OA@445eb116` in the session's scratch folder, isolated from both repositories. The generator's source and SHA-256 are embedded. It neutralises only stages that moved out of the planner: the kill switch reads as disengaged, there is no latch directory, the view-age and view-lag limits are off, and there is no freshness record or registry write. It also registers an import-only `fcntl` stub that raises if called, because Windows has no `fcntl` and the path it runs never locks. Every case reaches the stage it was written for.

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| Sizing | `selection.quantity_for` keeps only legacy's proven-lot path (`require_lot_size=True`), the only path the planner calls; the max-notional cap to zero still yields `"sizing refused"` |
| Golden refusals | A refused case compares stage and reason only. Legacy's `Plan` also carries the symbol and quantity it had reached; the target's `PlanRefusal` does not |
| PE deltas | Legacy compares raw deltas with a positive band (S:199-205). The golden case `pe_negative_delta` shows that with negative PE deltas legacy still chooses a contract, through its gap fallback and then the unfiltered candidates. The target matches, and the source check stays with SLICE-08's PRF-ADM-07 |
| `iv_rank` text | The `IV rank … at or above iv_rank_max` refusal is unreachable in the target and in legacy live, because neither passes an IV rank. The case `intent_iv_rank_99_ignored` pins that |
| Score scale | Legacy's `signal_score` is on a 0–100 scale (S:158-169). An intent scored 0–1, like the step 1 fixtures' `0.8`, is refused at the selection floor (`|score| 0.8 is below the selection floor 1`). The strategy host must publish legacy's scale, and the step 3 tests do |
| Stats fixture | `make_stats()` takes legacy `Session`'s defaults, with `now_hm` `14:45`, START's IST time |

**Tests** (308 passed with `scripts/safe_tests.py`, no broker variables):

| File | Cases |
|---|---|
| `test_planner_rules.py` | 43 golden cases: the adapter's rows equal the generator's own conversion, and stage, reason, symbol, quantity and two-decimal stop and target equal legacy's. Also: the fixture's embedded generator digest; purity under the sandbox; dispatch (`structure_planner_not_built`, `planner_policy_unbound`); `ask` with `to_stop` refused; Q-019's three sanctioned settings against hand calculations; `ask` with no ask refused; the plan's fields and `entry_facts` |
| `test_admission_checks.py` | `chain_missing` and `chain_mismatch` (another underlying, another `as_of`), each recorded at B1; a `one_leg_v1` plan built from fixture market data admitted and acknowledged, its plan and entry facts recorded |
| `test_policy_parameters.py` | `AdmissionPorts` built with `stats` |

**Break checks** (each applied, run, and reverted byte for byte; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Read the wall clock in the planner | `test_planner_is_pure` |
| Pass the intent's `iv_rank` to selection | golden `intent_iv_rank_99_ignored` |
| Round the stop down | golden `stop_tick_up_target_down` |
| Use the reference lot ahead of the row's | golden `lot_row_over_reference` |
| Price `amount` at the ask under `ltp` | `test_q019_money_figures` (two of three) |
| Drop the chain-to-view check | `test_chain_must_match_the_aged_view` (two of three) |

## Step 4 — `structure_v1` (deepened before build)

The legacy structure planner (SP:104-276, with `structures/resolve.py`, `structures/payoff.py` and the structure templates of `policy/types.py:14-44` and `policy/defaults.py`) is extracted after step 3, with its own deepening and EGM review. That deepening must settle: typed structure templates (the `strike_rule`, `expiry_rule`, `risk` and `evidence` mappings); which of resolution's evidence checks (RS:65-144: completeness, source, digest binding, field state, delta presence) move to B1 or the market port and which stay; the strategy-level `policy.risk["max_loss"]` (SP:231) and `strategy_family` (SP:213, 227) as policy fields; per-leg protective levels to match the protection spec's per-leg stops; and how Q-019's figures price a multi-leg plan against legacy's maximum loss at the ask (RS:325), which may need the owner.

## Completion conditions

1. Every SLICE-01…03 test and every step 1–3 test passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. The steps' file lists match the commits.

## Prerequisites

SLICE-01…03. No open owner question.
