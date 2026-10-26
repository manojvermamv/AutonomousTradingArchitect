# Intent to admission

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/intent-to-admission/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `contracts/decisions.py` | [Contracts](#contracts-contractsdecisionspy) |
  | `kernel/policy.py` | [Review application](#review-application-kernelpolicypy) |
  | `kernel/planner.py` | [Planning port](#planning-port-kernelplannerpy-kernelselectionpy) |
  | `kernel/selection.py` | Planner-version selection, strike selection and tick rounding, in the [planning port](#planning-port-kernelplannerpy-kernelselectionpy) |
  | `kernel/admission.py` | [Admission](#admission-kerneladmissionpy) |

* **Consumes:** review evidence from `cognition/review.py` ([strategies-and-cognition](strategies-and-cognition.md)); intents from `strategies/*`; the conflict relation and permission matrix ([protection-and-safety](protection-and-safety.md)); grants, sessions and recovery stages ([sessions-authority-lifecycle](sessions-authority-lifecycle.md)); the busy count ([dispatch-and-coordination](dispatch-and-coordination.md)); the ledger's reservation, position and pause rows ([ledger](ledger-and-atomic-transaction.md)); funds and position observations ([execution-domain](execution-domain-and-observations.md)).
* **Supplies:** the plan (`PlanRef`), the dependency set and the dispatch deadline to the coordinator; `Plan.protective_levels` to protection.
* **Commits through:** the atomic transaction: `COMMAND_ADMITTED`, `ADMISSION_REFUSED`, `REVIEW_RECORDED`, `PAUSE_STARTED`.
* **Master anchors:** D07 (`README.md:726`), D12 (`:752`), AUD-01 (`:754`), AUD-03 (`:756`), execution sequence steps 1–4 (`:743-746`), contract rows Intent / Review application / Plan / Action request / Admission (`:732-736`), D16 (`:764`), `:776`, existing AI entry policy (`:109-120`), blueprint deadlines (`:849`).
* **Terms** (see also the [package glossary](../README.md#terms-used-across-the-specs)):

  | Term | Meaning |
  |---|---|
  | AI mode | The bound AI-management mode: `off`, `observe` or `enforce_entry_holds` (POL-027) |
  | Candidate | The bound strategy candidate, named by a `CandidateId` ([identity contract](sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)) |
  | View | A stable market view named by `view_id` ([market-data-and-canvas](market-data-and-canvas.md)) |
  | Bound policy | The policy bound to the session ([sessions spec](sessions-authority-lifecycle.md#standing-bindings)) |
  | Refusing parameter | A policy field with no shipped default; the loader refuses a composition that leaves it unbound (REQ-XC-003, [cross-cutting-invariants](cross-cutting-invariants.md)) |
  | Limit | A numeric bound, such as a freshness limit |

* POL-nnn rows are in the [policy inventory](../02-policy-inventory.md). Legacy paths are at `OA@445eb116`.

## Overview

Every broker-changing action reaches the kernel as a typed **action request**: entry, cancel, modify or close. Admission runs in two stages:

1. **Stage A (eligibility)** asks whether the request may be considered at all. For an entry, `kernel.policy` applies the recorded review and pause state under the AI mode. A refusal in stage A is committed on the writer thread.
2. **Planning** (entries only): the pure planner turns an eligible intent into an exact plan.
3. **Stage B (serialized admission)** runs on the ledger's writer thread. It repeats the state checks of stage A, checks the plan or the action's effect against current ledger and observed state, and commits admission, reservation and command identity atomically.

Cancel, modify and close skip review and planning and go from stage A's identity, grant and safety checks to stage B. Non-dispatch outcomes (BLOCK, PAUSE, refusals) are recorded as decisions with no send authority.

## The problem

| Problem in legacy | Correction | Decision |
|---|---|---|
| Review application sits partly in cognition, partly in the gateway | One review-policy owner in the kernel | D12 |
| The planner writes registry and latch state (LD-03) | A pure planner | D07 |
| "Close" and "cancel" labels are trusted more than their effects | Action-specific admission | AUD-01 |
| Refusals are not consistently recorded | Recorded non-dispatch decisions | AUD-03 |
| Gate order is incidental | Order follows the target contracts, not legacy | D11 (`README.md:726`) |

## Goals

1. Every entry route uses the same review-application function. The kernel finds the review itself and produces the application itself; a caller can neither supply nor choose one, so caller-supplied ALLOW is never approval (D12).
2. Planning reads explicit immutable inputs and returns a plan or a refusal, with no persistence, clock or network effects (D07).
3. Admission validates the actual effect, exact targets, quantities, actor capability and the relevant current state for every verb. A label never establishes permission (AUD-01).
4. BLOCK, PAUSE and refusals are recorded with policy, cause and causal inputs, and never create send authority (AUD-03).
5. Capacity is checked against the ledger and observed state at the moment of commit, and the state heads used are bound in the admission (`README.md:736`, `:746`).
6. Live and replay apply the same functions; replay applies them to recorded review evidence in its own ledger (D12).

## Non-goals

* Changing scores, thresholds, the review requirement or AI modes (POL-024, POL-027).
* Choosing cost-inclusive admission (POL-026 stays gross; `README.md:1342`).
* Choosing conflict priorities ([Q-004](../decisions/owner-questions.md#q-004)) or kill and hold permissions ([Q-001](../decisions/owner-questions.md#q-001)).
* A new rule refusing a cancel or modify that weakens protection (AUD-01 notes the risk; none is approved).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-ADM-001 | The intent carries strategy, version, session, candidate, view, underlying, direction or abstention, scores and evidence; no order identity or limit override | Intent row (`README.md:732`) | PRF-ADM-08 |
| REQ-ADM-002 | `kernel.policy` alone interprets reviews and pause state under the AI mode; the kernel finds the review; the application binds intent, strategy, candidate, session, evidence or cause, policy version and deadline | D12 (`:752`); Review application row (`:733`); POL-027 | PRF-ADM-01, -02 |
| REQ-ADM-003 | The planner is a pure function of explicit inputs | D07 (`:726`); LD-03 | PRF-ADM-03 |
| REQ-ADM-004 | One planning port keeps the versioned one-leg and structure implementations, selected deterministically | `:726`; §7 (`:1147`) | PRF-ADM-03, -07 |
| REQ-ADM-005 | The plan states exact instruments, products, leg roles, quantities, prices and rounding, plus policy, candidate and view digests, structure identity, residual exposure and protection levels | Plan row (`:734`); POL-008, -015, -017, -022, -026 | PRF-ADM-08 |
| REQ-ADM-006 | Action requests are explicit variants with exact arguments, targets, principal and account; a label never establishes the effect | AUD-01 (`:754`); Action request row (`:735`) | PRF-ADM-04 |
| REQ-ADM-007 | Stage B checks effect, targets, quantities, grant, freshness, conflicts, safety and capacity, serialized per account against ledger and observed state | Execution sequence (`:743-745`); POL-007, -018, -020, -021 | PRF-ADM-04 |
| REQ-ADM-008 | Non-dispatch decisions are recorded with policy, cause and causal inputs | AUD-03 (`:756`); POL-027 | PRF-ADM-04, -05 |
| REQ-ADM-009 | Final risk covers the resulting quantity, instruments and legs; the worst intermediate obligation is reserved | `:744`, `:776` | PRF-ADM-04, -09 |
| REQ-ADM-010 | Replay applies the same policy function to recorded evidence | D12; `:802` | PRF-ADM-06 |
| REQ-ADM-011 | Admission binds dependency versions, state heads and the dispatch deadline for revalidation at dispatch | Admission row (`:736`); D13 (`:758`) | PRF-DSP-01 ([dispatch](dispatch-and-coordination.md#proofs)), PRF-ADM-09 |

## Critical user journeys

### CUJ-ADM-1: Entries under enforce mode with a PAUSE

* **Given** AI mode `enforce_entry_holds`.
* **When:**
  * at 10:00, strategy `X` emits an entry intent on underlying `U`, and the first review recorded for it says PAUSE with no requested duration;
  * at 10:02, `X` emits another entry intent on `U`;
  * at 10:03, a third intent's review says PAUSE again;
  * at 10:06, a fourth intent's review says ALLOW.
* **Then:**
  * 10:00: `ADMISSION_REFUSED` (`ADM-R11`) and `PAUSE_STARTED` (expiry 10:05, POL-027 default 5 min) commit in one transaction;
  * 10:02 and 10:03: refused by the active pause; the 10:03 PAUSE neither starts nor extends a pause;
  * 10:06: the pause has expired (expiry is exclusive); the intent proceeds to planning (PRF-ADM-02).

### CUJ-ADM-2: Mislabelled protective request

* **Given** an owned long position of 50.
* **When** a close request asks to sell 100.
* **Then** stage B refuses with `ADM-R07` (`effect_mismatch`) and records it. Nothing is reserved or sent (PRF-ADM-04).

### CUJ-ADM-3: Stale view

* **Given** a live entry whose decision bar stamp is 90.1 s old by the wall clock.
* **When** stage B runs.
* **Then** it refuses with `ADM-R05` (`stale_input`) and records the refusal. A replay composition does not apply this limit (POL-018) (PRF-ADM-04).

### CUJ-ADM-4: Protective close after the session closed

* **Given** the financial session is `CLOSED` and an owned position is open.
* **When** the owner requests a market close, and the position's stop has already been cancelled.
* **Then** no session check applies (only new entries need one), and the close is admitted with `COMMAND_ADMITTED` (PRF-ADM-04).

### CUJ-ADM-5: An entry submitted before its review

* **Given** AI mode `enforce_entry_holds`, a policy that requires a review, and a review not yet recorded for the intent.
* **When** the strategy host submits the entry.
* **Then** admission returns `ADM-R15` (`review_pending`) without a record. The host retries with the same key. Once the review is recorded, it is applied; if none is recorded by the deadline (the blueprint's `deadline_seconds` from the kernel's first sight of the intent), the application is `proceed_unavailable` with cause `no_review` and an alert (PRF-ADM-01).

## Technical plan

### Contracts (`contracts/decisions.py`)

```text
Intent(intent_id, strategy, family, strategy_version, session_id, candidate_id,
       view_id, underlying, as_of: Timestamp, direction: long_call | long_put | abstain,
       scores: {signal_score, iv_rank, conviction}, evidence_refs: list[EvidenceRef])
Review(review_id, purpose="entry_review", intent_digest, outcome:
       allow | block | pause | abstain | unavailable | invalid | timeout,
       pause_minutes | None, configuration_digest, blueprint_digest, lineage_digests,
       started_at, completed_at, valid_until, evidence_refs)        # cognition output
PauseState(scope: (strategy, underlying, session_id), pause_id, review_id,
       started_at, expires_at, cleared_at | None, cleared_by | None, clear_reason | None)
ReviewApplication(intent_digest, strategy, candidate_id, session_id, mode,
       applied: proceed | blocked | paused | proceed_unavailable,
       basis: review | pause | cause, review_id | None, pause_id | None, cause | None,
       review_outcome | None, alert: bool, policy_version, deadline: Deadline)
Plan(plan_digest, planner_version, structure_id, intent_digest, candidate_id, view_id,
     policy_digest, legs: list[PlanLeg], amount, margin, worst_case_loss, currency,
     residual_exposure, protection_policy_ref, protective_levels: {stop, target | None})
PlanLeg(leg_role, instrument, product, side, quantity, unit="contracts", lot_size,
        limit_price | None, amount, tick_size)
SessionStats(trade_count, consecutive_losses, consecutive_wins, daily_pnl, capital,
             open_stop_risk, entry_in_flight: bool, held_exposure)
PlanRefusal(stage, reason)
```

* `intent_digest` is `digest(intent)` with the ledger's normalization. `underlying` comes from the view; an intent never names an option contract.
* `ReviewApplication` and `Plan` are built only inside `kernel.policy` and `kernel.planner`; the capability test PRF-XC-02 checks that no other package constructs them.
* `review_outcome` keeps the review's raw outcome even when `applied` is `proceed` (BLOCK in `observe` mode). `alert` is true for every `proceed_unavailable`.
* `cause` values: `review_not_required`, `no_review`, `invalid`, `digest_mismatch`, `wrong_purpose`, `expired`, `lineage_mismatch`, `unavailable`, `timeout`, `abstain`, `pause_cleared`.
* `deadline` is the command's dispatch deadline: origin = the time stage A started on the kernel clock, budget = `dispatch.deadline_ms.<verb>` ([dispatch](dispatch-and-coordination.md#policy-inputs)); every verb has one.
* `PlanLeg.product` comes from the bound policy (POL-017).
* `PlanRef` (ledger spec) is the subset of `Plan` the coordinator and adapter need. An intent with `direction = abstain` never becomes an `EntryRequest`; the host records it as evidence. If one arrives, A1 refuses it.

### Review application (`kernel/policy.py`)

This is the master's existing entry policy (`README.md:113-118`), applied by the kernel.

**Recording reviews.** Cognition submits each finished review to the kernel. `kernel.policy` records it as `REVIEW_RECORDED` with the kernel's arrival time, folded into the `review` index table keyed by intent digest. The kernel also records the first time it sees each intent digest. **The review used** for an intent is the first recorded for its digest, by kernel arrival. A caller never names one: `EntryRequest.review_ref`, if present, is only a hint and must match the first recorded review, or the cause is `invalid`.

**Finding the review:**

| Situation | Result |
|---|---|
| AI mode `off`, or the bound policy requires no review | `proceed`, cause `review_not_required` |
| Review required; none recorded; the deadline (the bound blueprint's `deadline_seconds`, from the kernel's first sight of the intent; legacy `service.py:278-282`) has not passed | `ADM-R15` (`review_pending`), not recorded; the caller retries with the same key |
| Review required; none recorded by the deadline | `unavailable`, cause `no_review` |
| `purpose` is not `entry_review` | `invalid`, cause `wrong_purpose` |
| Review `intent_digest` differs from the intent's (A05-F3, `README.md:843`) | `invalid`, cause `digest_mismatch`; never `allow` |
| Configuration, blueprint or lineage digests differ from the session's binding (legacy `service.py:390-411`) | `invalid`, cause `lineage_mismatch` |
| `started_at > completed_at`, or arrival after the deadline, or `valid_until` before the kernel's evaluation time (legacy `service.py:413-429`) | `timeout` or `invalid` (cause `expired`); a late result never revives the intent (A03-F3) |
| Otherwise | The review's outcome |

**Applying it.** The pause state is read from the ledger's `pause` index table. In `observe` mode it is not consulted. In `enforce_entry_holds`:

1. An **active pause** for the intent's scope gives `paused` (basis `pause`), as legacy checks the pause before the review (`service.py:366-371`).
2. Otherwise the outcome row below applies.

| Outcome | `observe` | `enforce_entry_holds` |
|---|---|---|
| `allow` | `proceed` | `proceed` |
| `block` | `proceed` (`review_outcome` = `block`) | `blocked` (this intent only) |
| `pause` | `proceed` (`review_outcome` = `pause`) | `paused`, and a pause starts (rules below) |
| `unavailable`, `invalid`, `timeout`, `abstain` | `proceed_unavailable`; alert | `proceed_unavailable`; alert |

* **Abstain** is in the unavailable row because advisor backend failures abstain (`README.md:120`).
* **A cleared scope.** If the scope has a `PAUSE_CLEARED` whose `cleared_at` is at or after the evaluation time, a PAUSE review starts nothing and the application is `proceed_unavailable` with cause `pause_cleared` and an alert, as legacy (`service.py:487-493`).
* **Pause bounds** (POL-027): duration `min(pause_minutes or 5, 60)` minutes. `started_at` is the commit time on the writer thread; `expires_at = min(started_at + duration, session_end)`, with `session_end` the session's recorded close time. A pause is active while `started_at ≤ now < expires_at` and not cleared, judged by the clock contract's deadline rule (legacy `pause.py:88`). A PAUSE during an active pause neither extends nor replaces it.
* **Alerts.** `kernel.policy` raises the alert on the operator route when it produces a `proceed_unavailable` application, so the alert is not lost if admission later refuses without a record (POL-027).
* **Clearing.** Only a human principal with `pause_clear` clears a pause ([security-and-operator](security-and-operator.md)); it records `PAUSE_CLEARED` (`pause_id`, actor, reason, `cleared_at`), as legacy `pause.py:298`.
* **Replay** runs `kernel.policy` over the recorded reviews in its own ledger.

### Planning port (`kernel/planner.py`, `kernel/selection.py`)

```text
plan(intent, view: StableView, chain: ChainSnapshot, reference_facts: ReferenceFacts,
     policy: BoundPolicy, stats: SessionStats, now: Timestamp) -> Plan | PlanRefusal(stage, reason)
```

| Input | Owner | Source |
|---|---|---|
| `view`, `chain` (with delta and gamma per row), `reference_facts` | [market-data-and-canvas](market-data-and-canvas.md) | Market-data port |
| `policy` | [sessions spec](sessions-authority-lifecycle.md#standing-bindings) | The session's binding |
| `stats` | `kernel.safety` (from the ledger and position observations) | Legacy session statistics (`orchestrator.py:419-424`, `:575`, `:655`, `:676`, `:752-765`) |
| `intent.scores` | The strategy | The intent |
| `now` | The injected clock | Stage A evaluation time |

* Called only after stage A passes. Pure: every input is passed in; nothing is read from or written to stores, clocks or sockets.
* **Implementations**, chosen by `policy.planner_version` (`kernel.selection`):
  * `one_leg_v1`: the legacy one-leg `plan()` (`src/core/framework/runtime/orchestrator.py:385`), keeping its planning stages `session_gates`, `strike`, `quantity`, `exposure`, `stop`, `loss_budget` and `request` (`:90`);
  * `structure_v1`: the legacy `plan_structure()` (`src/core/framework/structures/planner.py:104`), keeping `resolve`, `exposure`, `economics`, `stop` and `loss_budget`, and its phase and cover rules (`:33-76`): long legs that cover a short precede it, so the worst intermediate state is the one before the covering longs fill, and `worst_case_loss` is the maximum over the phase sequence;
  * any other value: `PlanRefusal("select", "unknown_planner_version")`.
* The legacy stages `kill_switch`, `freshness`, `view_freshness`, `view_lag` and `loss_latch` are not planner stages; they move to `kernel.safety` and admission (LD-03).
* Kept rules: lot size from the chain row, then the reference fact, else refuse with stage `lot_size` (POL-022; `orchestrator.py:625-647`); tick rounding, stop up and target down (POL-015); long-only economics (POL-008); gross economics (POL-026). Their exact behaviour is fixed by parity, PRF-ADM-07.

### Admission (`kernel/admission.py`)

Each stage stops at its first failed check. Every refusal of every verb is recorded as `ADMISSION_REFUSED`, committed on the writer thread, **except** `LED-R01`, `LED-R02`, `ADM-R12` and `ADM-R15`, which are returned without a record.

#### Stage A (eligibility)

| # | Check | Applies to | Refusal |
|---|---|---|---|
| A0 | Busy pre-check: the account's busy count is below the limit, if `coordinator.busy_applies_to` covers this verb | as bound | `ADM-R12` (`busy`) |
| A1 | Well-formed; command key present; for an entry, the intent resolves, does not abstain, and its `session_id` equals the request's | all | `ADM-R01` (`malformed_request`), `LED-R01` |
| A1a | Command identity: same key and digest returns the existing state; different digest refused; a key with no row continues | all | `LED-R02` |
| A2 | Grant: `authority.check(verb, principal, account, at="admission")` | all | `SES-R01` … `SES-R05`, `SES-R09` |
| A3 | The request's session is `OPEN`, and the intent's candidate is in that session's `candidate_ids` | entry | `SES-R07`; `ADM-R14` (`candidate_not_bound`) |
| A4 | Safety matrix for this verb and actor | all | `PRT-R06`, `PRT-R01`, `PRT-R04`, `PRT-R03` |
| A5 | Review application is `proceed` or `proceed_unavailable` | entry | `ADM-R11` (`not_eligible`), `ADM-R15` (`review_pending`) |

* Cancel, modify and close run A0–A2 and A4, then go to stage B; they have no review or planning.
* An A5 refusal is committed on the writer thread. There, `kernel.policy` re-reads the scope's pause row: if a pause became active meanwhile, the refusal is `paused`; a `PAUSE_STARTED` is committed with the refusal only if no pause is active at that moment. Two PAUSE reviews can therefore never start two pauses.

**Planning** (entries only). A `PlanRefusal` is recorded as `ADM-R13` (`plan_refused`) with its stage and reason; a planner exception is stage `internal`.

#### Stage B (serialized admission, on the writer thread)

Stage B first repeats A1a, A2, A3, A4 and the pause read, since another request with the same key, or a grant, session, safety or pause change, may have committed during planning. The grant recorded is the one stage B's check returns. Then:

| # | Check | Applies to | Refusal |
|---|---|---|---|
| B1 | Freshness (below) | all | `ADM-R05` (`stale_input`) |
| B2 | Effect matches target (below) | cancel, modify, close | `ADM-R07` (`effect_mismatch`) |
| B3 | The conflict relation permits the action now ([protection](protection-and-safety.md#conflict-relation-kernelsafetypy)) | all | `PRT-R10` |
| B4 | Busy: below `coordinator.max_pending_per_account`, if `coordinator.busy_applies_to` covers the verb ([dispatch](dispatch-and-coordination.md#busy-count-supplied-to-admission)) | as bound | `ADM-R12` (`busy`) |
| B5 | Capacity (below) | entry; a modify that raises committed capital | `ADM-R09` (`capacity`) |
| B6 | Binding (below) | entry | `ADM-R10` (`binding_mismatch`) |

#### B1 freshness

| Input | Limit | Applies to |
|---|---|---|
| View age: wall-clock time minus the decision bar's stamp (the bar's open, [Q-003](../decisions/owner-questions.md#q-003)) | ≤ 90 s (POL-018) | Live entries only |
| Spot and chain age, in the wall domain | ≤ 2 × `market.poll_interval_secs` (POL-020) | Live entries |
| Broker observation of the account's orders, positions and funds | `abs(now − as_of)` ≤ 60 s, `as_of` stamped before the read (POL-021; legacy `not_fresh`) | All verbs |

* POL-018's record says "replays and re-plans **of a past day** are not judged" (`OA/docs/OWNER-DECISIONS.md:405-431`). A replay composition is flagged when built and skips the view limit. A same-day retry after CP-A1 is a live entry and is judged.
* An incomplete observation (pages missing) is also `ADM-R05`; empty is never taken as flat (`README.md:745`).
* B1 is the only admission owner of stale or incomplete observations.

#### B2 effect

* **Owned** positions are the ledger's `position` rows ([ledger](ledger-and-atomic-transaction.md#schema-and-migrations)), keyed by their entry command; owned orders are tied to the account's commands by verified identity ([execution-domain](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)).
* **Cancel:** the target order is owned and open in the fresh observation.
* **Modify:** the target is owned and open; `changes` uses only the `ModifyChanges` fields; a new quantity is not above the order's unfilled quantity, except that a resting protective close may be raised up to the owned position.
* **Close:** a non-resting close's quantity is not above the owned position (the smaller of the ledger's owned quantity and the broker's net quantity); the side reduces the position (SELL for a long-only buyer); the position's resting stop must be terminal first (conflict row 3). A resting protective close is not above the owned position.
* The resulting exposure (REQ-ADM-009) is recorded in the admission.

#### B5 capacity

Computed on the writer thread from the ledger's open reservations and the latest funds and position observations, using the retained legacy rule (`src/core/framework/execution/reservations.py:352-437`):

* the funds observation is fresh (B1) and not dated in the future (legacy `:366`);
* `amount ≤ available − (open reservation amounts + external capital commitments)`;
* `margin ≤ margin_available − (open reservation margins + external margin commitments)`;
* `worst_case_loss ≤ account.max_worst_case_loss`.

External commitments count broker-observed positions and working orders once, excluding protective orders and reserved legs (legacy `_external_commitments`, `:473-497`). Legacy subtracts these from broker-reported `available`; whether the broker figure already deducts them is checked in TASK-S07-05, and until then the legacy rule (conservative if it double-counts) is kept. `account.max_worst_case_loss` is a refusing parameter, characterized in TASK-S04-03. Which domains count is `capacity.count_non_live_obligations` ([Q-008](../decisions/owner-questions.md#q-008)). A modify that raises a working entry's limit is checked on the increase, and `kernel.reservations` raises the entry's reservation in the same commit.

The admission binds the state heads it used: the reservation head (ledger sequence) and the funds and position observation digests (`README.md:736`, `:746`).

#### B6 binding

* `plan.plan_digest` equals the digest of the plan's other fields;
* `plan.intent_digest`, `application.intent_digest` and `request.intent_ref` all equal `digest(intent)`;
* the application's strategy, candidate and session equal the intent's;
* `application.policy_version` equals the session's `policy_binding_id`;
* every plan leg belongs to the session's calendar ([sessions](sessions-authority-lifecycle.md#which-session-an-entry-belongs-to)).

B6 catches wiring faults that pair the wrong objects or name the wrong session.

#### On success

Stage B commits `COMMAND_ADMITTED` with the normalized request, the plan, the application, the reservation, the resulting exposure, the measured input ages (POL-020), the state heads, and the dependency set that dispatch rechecks ([dispatch](dispatch-and-coordination.md#revalidation-at-dispatch)). A pause started after admission does not stop an admitted entry: legacy checks the pause only when the review is applied, and that is kept.

**Slot scope.** POL-007's "one open position at a time" is conflict row 1, with scope (account, underlying), matching legacy `max_positions_per_underlying = 1` (`OA/src/strategies/buyer_edge.py:687`).

### Refusal codes

| Code | Meaning |
|---|---|
| `ADM-R01` (`malformed_request`) | Missing or ill-typed field; unresolved or abstaining intent; session mismatch |
| `ADM-R05` (`stale_input`) | A B1 limit failed, or an observation is incomplete |
| `ADM-R07` (`effect_mismatch`) | The effect does not match the target: not owned, not open, too large, wrong side or field |
| `ADM-R09` (`capacity`) | No capacity |
| `ADM-R10` (`binding_mismatch`) | A B6 condition failed |
| `ADM-R11` (`not_eligible`) | Review application is `blocked` or `paused` |
| `ADM-R12` (`busy`) | Account at the busy limit; returned before any commit |
| `ADM-R13` (`plan_refused`) | The planner refused; stage and reason recorded |
| `ADM-R14` (`candidate_not_bound`) | The intent's candidate is not in the session's binding |
| `ADM-R15` (`review_pending`) | A required review is not yet recorded and its deadline has not passed; returned without a record |

Codes not listed (`R02`–`R04`, `R06`, `R08`) are unused.

## Failure modes and crash points

The ledger crash points CP-L1 and CP-L5 apply ([ledger](ledger-and-atomic-transaction.md#failure-modes-and-crash-points)).

| ID | Failure | Durable state | Required behaviour | Proof |
|---|---|---|---|---|
| CP-A1 | Crash after planning, before the admission commit | Nothing | A retry with the same key re-plans and admits once | PRF-ADM-05 |
| F-A2 | Review arrives after its deadline | `REVIEW_RECORDED` (late) | `timeout`; never revives the intent | PRF-ADM-02 |
| F-A3 | Planner raises | — | `ADM-R13` with stage `internal`; never a partial plan | PRF-ADM-03 |
| F-A4 | Reference fact missing for lot size | — | `ADM-R13` with stage `lot_size` (POL-022) | PRF-ADM-03 |
| F-A5 | Observation incomplete | — | `ADM-R05`; empty is never flat | PRF-ADM-04 |
| F-A6 | Kill or pause recorded during planning | Kill or pause committed | Stage B's repeat refuses | PRF-ADM-04 |
| F-A7 | Two entries on one account for different underlyings | — | Each B5 sees the other's committed reservation; no over-commit | PRF-ADM-09 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| Stage B runs on the writer thread, so admissions serialize with every other write | Planning stays off the writer thread; stage B is a bounded set of index reads; throughput measured (A09-F4) |
| A required review that never arrives delays entries by the blueprint deadline | `ADM-R15` is cheap and unrecorded; after the deadline the master's unavailable rule applies |
| Broker `available` may already deduct positions, making the legacy capacity rule double-count | Conservative; checked in TASK-S07-05 before any change, which would be an owner decision |
| Capacity for many accounts | One account today; per-account capacity is independent |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| AI mode and review requirement | Bound policy (POL-027) | `observe` (approved default) |
| Pause duration | POL-027 | 5 min default, 60 min cap, session close |
| Review deadline | The bound blueprint's `deadline_seconds` (`README.md:849`; legacy default 30 s, capped at 300 s) | From the blueprint |
| Freshness limits | POL-018 (90 s), POL-020 (2× poll), POL-021 (60 s) | Approved values |
| `policy.planner_version` | Bound policy | None: refusing |
| `dispatch.deadline_ms.<verb>`, `coordinator.busy_applies_to` | [Q-011](../decisions/owner-questions.md#q-011), [Q-004](../decisions/owner-questions.md#q-004) | None: refusing |
| `account.max_worst_case_loss` | Legacy value, characterized in TASK-S04-03 | None: refusing |
| `capacity.count_non_live_obligations` | [Q-008](../decisions/owner-questions.md#q-008) | None: refusing |
| Reservation amounts and `money.rounding` | Plan computation under the legacy rule, characterized in TASK-S04-03 | None: refusing |

## Reuse evidence

* **One-leg orchestrator / structure planner: reuse behind one versioned planning port** (`README.md:1147`). Extraction removes `orchestrator.py:528-548` latch I/O (LD-03).
* **Advisor/team/AI management: relocate review application** (`README.md:1152`). `src/runtime/ai_management/service.py` (`:117`, `:430`; pause first `:366-371`; deadline `:278-282`; lineage `:390-411`; validity `:413-429`; cleared pause `:487-493`) is the behavioural reference.
* **Pause store: reuse its rules, move its storage.** `src/runtime/ai_management/pause.py`: constants (`:15-16`), activity test (`:88`), unavailable status (`:229-231`), `request_pause` (`:233`), human-only `clear` (`:298`). The target records the same facts as ledger events with a `pause` index table.
* **Reservation and capacity:** `reserve()` and `_external_commitments` (`reservations.py:352-437`, `:473-497`).
* **Gateway admission** (`src/runtime/execution_gateway/__init__.py:389`, `README.md:96`) is evidence, not a template.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Cognition applies its own review | D12: it duplicates financial interpretation |
| The caller names the review | The caller could omit or choose evidence; the kernel finds it by intent digest |
| Separate admission path per verb | AUD-01: one kernel enforces all variants |
| One admission table after planning | Plans entries that are already blocked or paused |
| Run every check and report all failures | Later checks depend on earlier ones; first failure per stage is simpler to prove |
| PAUSE also in the safety matrix | Two owners for one rule (D12) |
| Pause state as an event scan | A full scan per call; the `pause` index table is folded and checked by D04 |
| Capacity from a snapshot taken before planning | Two concurrent entries could both pass; stage B reads and binds the heads |
| Run planning on the writer thread | Removes the stage B repeats but lengthens every write; planning stays off the thread |

## Proofs

Class **T** is an automated test.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-ADM-01 | T | `tests/unit/test_review_semantics.py` | Each finding-the-review row and each outcome cell; CUJ-ADM-5; the first recorded review wins; a `review_ref` naming a later ALLOW is `invalid` | a caller-chosen or missing review lets a BLOCK through |
| PRF-ADM-02 | T | `tests/unit/test_review_semantics.py` | CUJ-ADM-1 at each time; expiry exclusive; a non-human clear refused; two PAUSE reviews start one pause; a cleared scope gives `proceed_unavailable` with an alert | a pause is extended or started twice |
| PRF-ADM-03 | T | `tests/unit/test_planner_rules.py` | Planner purity under a sandbox; `SessionStats` gates; POL-015/022/008; unknown `planner_version` refused; F-A3, F-A4 | any I/O inside the planner |
| PRF-ADM-04 | T | `tests/unit/test_admission_checks.py` | Each stage A and B row refuses with its code and is recorded or not as stated; CUJ-ADM-2, -3, -4; F-A5; F-A6; resulting exposure recorded | admission trusts the label |
| PRF-ADM-05 | T | `tests/integration/test_entry_outcomes.py` | CP-A1 retry admits once; a retry after a recorded refusal is evaluated afresh | — |
| PRF-ADM-06 | T | `tests/integration/test_shared_engine.py` | The same recorded reviews give the same applications and pause events in live and replay | replay runs fresh inference |
| PRF-ADM-07 | T (parity, retained scope) | `scripts/compare_parity.py` | Recorded-day plans match legacy plans for retained behaviour (POL-024 scope, A08-F3), except listed corrections | plans differ outside listed corrections |
| PRF-ADM-08 | T | `tests/unit/test_planner_rules.py` | The intent and plan contracts carry exactly the listed fields, including product and protective levels, and no order identity | a field is missing or an order ID is accepted |
| PRF-ADM-09 | T | `tests/unit/test_admission_checks.py` | F-A7; capacity cases against a hand calculation; heads bound in `COMMAND_ADMITTED`; a structure's worst intermediate state reserved | capacity uses a stale snapshot |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-01 | A fixed application and plan passed in-process by the test; checks A1, A1a, A5, B5 (synthetic capacity), B6 | via PRF-LED-03, -04 and PRF-ADM-05 |
| SLICE-04 | REQ-ADM-001…011 | PRF-ADM-01…09 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
