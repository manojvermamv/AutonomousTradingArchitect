# SLICE-04 — Intent to admission

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-04-review-2026-10-27)). **Step 1 built** on 2026-10-27 in a local repository (commit `2ed1c39`, branch `slice-04`): 235 tests passed, including every SLICE-01…03 test, and every break check failed as required ([as built](#step-1-as-built)). That is a build record, not production acceptance. Step 2 is deepened to decision depth below and is under EGM review; step 3 is deepened before it is built.
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

Deepened after step 1 landed (OA_NEW `2ed1c39`). It closes the five gaps the readiness review named: the owned-position and owned-order fields, how a resting protective close is identified, the `COMMAND_ADMITTED` payload for non-entry verbs, the not-sent `Outcome`, and the modify capital increase. Dispatch of these verbs is SLICE-05, so step 2 admits and does not send.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/execution.py` | `CancelRequest`, `ModifyRequest`, `ModifyChanges`, `CloseRequest`, `MarketOrder`, `LimitOrder`, `StopOrder`; their wire forms; `OwnedOrder`, `OwnedPosition` (ledger-derived ownership, beside the ledger's execution types) |
| `src/autonomous_trading/contracts/evidence.py` | `ObservedOrder` gains the spec's `price` and `trigger_price` (keyword, default `None`) |
| `src/autonomous_trading/kernel/ports.py` | `HoldingsPort`; `AdmissionPorts.holdings` |
| `src/autonomous_trading/kernel/admission.py` | `ActionAdmission`; `action_admitted_decision`; B2 as `effect_check` |
| `src/autonomous_trading/kernel/coordinator.py` | `Coordinator.admit_action(request, *, auth=None) -> Outcome` |
| `src/autonomous_trading/kernel/ledger/store.py`, `projections.py` | The entry-only fields of `COMMAND_ADMITTED` are null for other verbs; no reservation row without a `reservation_id` |
| `src/autonomous_trading/resources/events.schema.json` | `COMMAND_ADMITTED`: entry-only fields nullable; adds `effect` |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `dispatch.deadline_ms_cancel`, `_modify`, `_close` (refusing) |
| `tests/conftest.py` | `FixtureHoldings`; owned-order and owned-position builders |
| `tests/unit/test_admission_checks.py` | The action rows of PRF-ADM-04, CUJ-ADM-2, CUJ-ADM-4 (a section after the entry rows) |
| `tests/contracts/test_capabilities.py` | The step 1 capability test also covers `admit_action` |

### Contracts

```text
CancelRequest(command_key, principal, account, broker_order_id)
ModifyRequest(command_key, principal, account, broker_order_id, changes: ModifyChanges)
ModifyChanges(trigger_price | None, limit_price | None, quantity | None)
CloseRequest(command_key, principal, account, position_id, quantity: int, order: MarketOrder | LimitOrder | StopOrder)
MarketOrder()    LimitOrder(price)    StopOrder(trigger, limit | None)
OwnedOrder(broker_order_id, command_key, verb, leg_role, account, strategy, underlying, instrument,
           side: BUY | SELL, position_id | None, protective: bool)
OwnedPosition(position_id, entry_command_key, leg_role, account, strategy, underlying, instrument,
              owned_quantity: int)                     # signed; the ledger `position` row's columns
HoldingsPort.order(account, broker_order_id) -> OwnedOrder | None
HoldingsPort.position(account, position_id) -> OwnedPosition | None
```

* **Construction rules.** `ModifyChanges` needs at least one field; prices are canonical decimal strings above zero; `quantity` is an int above zero and is the new **total** order quantity (filled + remaining). `CloseRequest.quantity` is an int above zero. A violation raises `ValueError` at construction and never reaches admission.
* **Wire forms** (the request digest's input): `{"verb": "cancel", "command_key", "principal", "account", "broker_order_id"}`; modify adds `"changes": {"trigger_price", "limit_price", "quantity"}`; close is `{"verb": "close", …, "position_id", "quantity", "order": {"kind": "market"} | {"kind": "limit", "price"} | {"kind": "stop", "trigger", "limit"}}`.
* **There is no side field.** The package admits long positions only, so every close and every protective order is a SELL; a request cannot name a side, so it cannot name the wrong one.

### Ownership in step 2

* `HoldingsPort` is a **fixture** (`FixtureHoldings`) in step 2: no close or protective order can reach the ledger before SLICE-05 dispatches it, and the `position` table arrives with `FILL` in SLICE-07. `OwnedPosition` carries exactly the ledger `position` row's columns that admission reads, so binding the real port in SLICE-05 (orders: `broker_identity` kind `order_id` joined to `command_identity` of the same account) and SLICE-07 (positions: the `position` row) changes no admission code.
* **Owned** means the port returns a row for that account. A row of another account is not owned.
* **Protective** (`OwnedOrder.protective`) is derived from the ledger, never from a broker flag: the order's command key has the prefix `prot:<position_id>:stop:` or `prot:<position_id>:target:` ([protection spec, Identity](../../design/protection-and-safety.md#protective-stop-and-tick-exits-kernelprotectionpy)), or the order is a basket's `stop` or `target` leg (`broker_identity.leg_role`) of an entry command. A **resting protective close** is a protective order whose fresh observation shows status `open`.
* **The `prot:` prefix is reserved.** A request whose command key starts with `prot:` from any principal other than `kernel:protection` is `ADM-R01` (A1, recorded). Without this, a caller could make its own close look protective.

### `Coordinator.admit_action(request, *, auth=None) -> Outcome`

One front door for the three verbs; `admit_entry` stays the entry door. Each check stops at its first failure; every refusal is recorded `ADMISSION_REFUSED` with `inputs.check` except `LED-R01`, `LED-R02` and `ADM-R12`.

| # | Check | Refusal |
|---|---|---|
| A0 | Busy, only when `coordinator.busy_applies_to` is `all` (the first release binds `entries_only`, so actions never wait: Q-004) | `ADM-R12` (not recorded) |
| A1 | Key present; the `prot:` rule | `LED-R01`; `ADM-R01` |
| A1a | Identity pre-check (SLICE-01) | `LED-R02` / existing outcome |
| A2 | `authority.check(verb, auth, account)` | `SES-R01…R05`, `SES-R09` |
| A4 | `safety.check(verb, auth, strategy)`, `strategy` = the target's owned strategy, or `None` when the target is not owned (B2 then refuses it) | its refusal |
| B | Inside the `COMMAND_ADMITTED` transaction (`Decision.precheck`, as step 1): repeat A2 and A4 (records `B:A2`, `B:A4`), then B1–B5 | as above |
| B1 | The account observation exists; orders, positions and funds each complete or `unknown`, age 0 … `reconciliation.max_observation_age_secs`. No view and no spot or chain limit | `ADM-R05` |
| B2 | `effect_check` (below) | `ADM-R07` with a reason |
| B3 | `conflicts.check(verb, account, underlying)`, `underlying` from the owned target | its refusal |
| B4 | As A0 | `ADM-R12` (not recorded) |
| B5 | Only a modify that raises committed capital (below) | `ADM-R09` |

There is no A3: an action needs no open session, so a close after the session's `CLOSED` is admitted (CUJ-ADM-4; the protection spec's session-close exits depend on it). There is no A5, planning or B6.

### B2 effect (`effect_check`)

Notation: `o` is the target's row in the fresh orders observation (by `broker_order_id`); `filled = o.filled_quantity`; `remaining = o.quantity − filled`. `owned(p)` is `min(p.owned_quantity, net)`, where `net` is the `net_quantity` of the position observation row for `p.instrument`. With no such row, `net` is 0 when the positions observation's coverage is `yes`, and unknown otherwise.

| Verb | Admitted only when | Reason on refusal |
|---|---|---|
| cancel | the order is owned; `o` exists with status `open` | `not_owned`, `not_open` |
| modify | the order is owned; `o` exists with status `open`; `filled` is not `None` | `not_owned`, `not_open`, `filled_unknown` |
| | `trigger_price` is set only on an order with `o.trigger_price` not `None` (legacy refuses a target moved as a stop, `execution_gateway/__init__.py:1356-1360` @445eb116); `limit_price` only on an order with `o.price` not `None` | `wrong_field` |
| | `quantity` (new total) ≥ `filled` | `below_filled` |
| | new remaining (`quantity − filled`) ≤ `remaining`; **except** a resting protective close, whose new remaining may reach `owned(p)` of its `position_id` and no more | `above_remaining`, `above_owned`, `broker_net_unknown` |
| close | the position is owned; `owned(p)` is known and above 0 | `not_owned`, `broker_net_unknown`, `not_open` |
| | `quantity` ≤ `owned(p)` (market, limit or stop alike) | `above_owned` |

* `ADM-R07`'s message is `effect_mismatch`; the reason goes in `inputs.reason`. CUJ-ADM-2 (sell 100 against an owned 50) is `above_owned`.
* Two closes against one position are each judged alone here; whether the second may run while the first is unresolved is conflict row 2, at B3 (SLICE-05).
* **Resulting exposure** (REQ-ADM-009): `{instrument: owned(p) − quantity}` for a close; for a cancel or modify, `{instrument: owned(p)}` of the order's position, or `{}` when the order has no `position_id` (an entry order).

### B5 for a modify (Q-018 open)

A modify raises committed capital only when its target is a non-protective **BUY** order (an entry leg) and `limit_price` rises above `o.price`; only an entry order can, since B2 forbids raising its quantity. The intent spec says such a modify is checked on the increase and the entry's reservation raised in the same commit, but legacy never modifies an entry order (its `modify` moves resting protective legs only, `execution_gateway/__init__.py:1292-1300` @445eb116), so there is no retained arithmetic for the increase in amount, margin and worst-case loss. That is a money rule, so it is the owner's: [Q-018](../../decisions/owner-questions.md#q-018). Until it is answered, B5 refuses such a modify with `ADM-R09`, reason `modify_increase_unbound`, like any refusing setting. No first-release entry can hit this: every one-leg entry is a MARKET order with no limit to raise ([protection spec, basket placement](../../design/protection-and-safety.md#basket-placement-basket_at_plan-kernelprotectionpy)).

### `COMMAND_ADMITTED` for an action

| Field | Value |
|---|---|
| `verb`, `target` | the verb; the `broker_order_id` (cancel, modify) or `position_id` (close) |
| `strategy` | the owned target's strategy |
| `request`, `request_digest`, `account` | as for an entry |
| `plan_ref`, `plan_digest`, `plan`, `application`, `reservation_id`, `amount`, `margin`, `worst_case_loss`, `currency` | `null` (the schema allows `null` for these; the writer refuses `LED-R06` when `verb` is `entry` and any is `null`, or `verb` is not `entry` and any is set) |
| `dependencies` | `{dispatch_deadline: {origin, budget_ms: dispatch.deadline_ms_<verb>}, release_binding_id: null, grant_id, session_id: null}` |
| `state_heads` | `{reservation_head, orders_observation, positions_observation, funds_observation}` (each observation's own digest), as step 1 |
| `measured_ages` | `{observation_ms}` (the oldest of the three) |
| `resulting_exposure` | as B2 |
| `effect` (new, `null` for entries) | cancel `{remaining}`; modify `{before: {quantity, filled, price, trigger_price}, after: {quantity, price, trigger_price}, protective}`; close `{quantity, order (wire), owned_quantity, broker_net}` |

The fold writes `command_identity` (`verb`, `target`, `plan_digest` null, state `ADMITTED`) and no reservation row.

### The not-sent `Outcome`

`admit_action` returns `Outcome(command_key, attempt_no=None, effect="not_sent", canonical="committed", compat_projection="none", broker_order_ids={}, domain=None, sent=False, refusal=None)`. `not_sent` with no attempt means "admitted, no attempt yet", the same reading `_existing_outcome` already gives an admitted command with no attempt, so the same request again returns that outcome with `canonical="unchanged"`. `Coordinator.recover` reads `CLAIMED` attempts only, so an admitted action stays `ADMITTED` across a restart until SLICE-05 dispatches it.

### Settings added

| Setting | Type | Env (`test` profile) | Notes |
|---|---|---|---|
| `dispatch.deadline_ms_cancel`, `_modify`, `_close` | int > 0 | `AT_DEADLINE_MS_CANCEL`, `_MODIFY`, `_CLOSE` | Q-011: measured (TASK-S11-07); refusing, in `Settings.ADMISSION_REQUIRED` |

### Step 2 tests (`tests/unit/test_admission_checks.py`, action section)

* Each row: `LED-R01`; the `prot:` prefix from a human → `ADM-R01` (A1); A1a same request → existing outcome, other request → `LED-R02`; A2 → `SES-R01`; A4 and B3 fixture refusals recorded with their checks; B1 incomplete or old orders observation → `ADM-R05`; under `entries_only` a busy account still admits an action.
* B2, one test per row of the table, each against a hand-worked observation: cancel of another account's order; modify below filled; a non-protective remaining increase; a resting stop raised to `owned(p)` admitted and one more refused; a trigger change on a target leg (`wrong_field`); a limit raise on an entry order → `ADM-R09` `modify_increase_unbound`; CUJ-ADM-2; a close capped by a smaller broker net; a close of an overclosed position; coverage `unknown` with no position row → `broker_net_unknown`.
* CUJ-ADM-4: the session `CLOSED`, a market close of the owned quantity is admitted.
* The `COMMAND_ADMITTED` fields above, no reservation row, the `Outcome` above, the same request again `unchanged`, and a reopen leaves the command `ADMITTED`.
* Break checks (added to the file's docstring): cap a protective raise at `remaining` instead of `owned(p)`; accept a trigger change on a target; record `ADM-R12`; accept the `prot:` prefix from a human.

## Step 3 — the planning port (deepened before build)

`one_leg_v1` and `structure_v1` extracted pure from `orchestrator.py:385` and `structures/planner.py:104` @445eb116, with `kernel.selection` choosing by `structure_id`; `SessionStats` derived field by field (TASK-S04-06); PRF-ADM-03. The legacy one-leg planner is about 1,000 lines with registry, kill-switch-file and desk-configuration couplings; its line-by-line extraction map is written into this section before step 3 starts, and step 3 is not built until then.

## Completion conditions (steps 1–2)

1. Every SLICE-01…03 test and every step 1–2 test passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. The steps' file lists match the commits.

## Prerequisites

SLICE-01…03. No open owner question.
