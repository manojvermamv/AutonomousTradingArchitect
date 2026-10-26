# Intent to admission

* **Status:** proposed (package spec), revised after EGM stages 5 and 6 ([review](../egm/intent-to-admission/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item, never an edit here.
* **Specified here (exclusive):** `kernel/policy.py`, `kernel/planner.py`, `kernel/selection.py`, `kernel/admission.py`, `contracts/decisions.py`.
* **Contributors:**
  * `cognition/review.py` produces review evidence ([strategies-and-cognition](strategies-and-cognition.md));
  * `strategies/*` produce intents;
  * `kernel/safety.py` supplies the conflict relation and the permission matrix ([protection-and-safety](protection-and-safety.md));
  * `kernel/authority.py` checks actor grants, and `kernel/lifecycle.py` supplies session state ([sessions-authority-lifecycle](sessions-authority-lifecycle.md));
  * `kernel/coordinator.py` supplies the busy count ([dispatch-and-coordination](dispatch-and-coordination.md));
  * `kernel/reservations.py` supplies the account state snapshot ([ledger](ledger-and-atomic-transaction.md)).
* **Not specified here:** `contracts/execution.py` (the action-request types) is specified in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy).
* **Commits through:** the atomic transaction in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md) (`COMMAND_ADMITTED`, `ADMISSION_REFUSED`, `PAUSE_STARTED`).
* **Master anchors:** D07 (`README.md:726`), D12 (`:752`), AUD-01 (`:754`), AUD-03 (`:756`), execution sequence steps 1–4 (`:743-746`), contract rows Intent / Review application / Plan / Action request / Admission (`:732-736`), existing AI entry policy (`:109-120`).
* **Terms:** a **candidate** is the bound strategy candidate, named by a `CandidateId` ([identity contract](sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)); a **view** is a stable market view named by `view_id` ([market-data-and-canvas](market-data-and-canvas.md)); the **bound policy** is the policy bound with the release ([configuration-artifacts-release](configuration-artifacts-release.md)); `EvidenceRef` is defined in the [execution-domain spec](execution-domain-and-observations.md#evidence-contract-contractsevidencepy); POL-nnn rows are in the [policy inventory](../02-policy-inventory.md); a **refusing parameter** is REQ-XC-003 in [cross-cutting-invariants](cross-cutting-invariants.md).

## Overview

Every broker-changing action reaches the kernel as a typed **action request**: entry, cancel, modify or close.

* **Entry** carries a reference to a strategy **intent** and, optionally, to review evidence. Admission runs in two stages around planning:
  1. **Eligibility** (stage A) asks whether this request may be considered at all. For an entry, `kernel.policy` applies the review evidence and the recorded pause state under the approved mode.
  2. The pure **planner** turns an eligible intent into an exact **plan**.
  3. **Serialized admission** (stage B) runs on the ledger's writer thread. It repeats the stage A state checks, checks the plan or the action's effect against current canonical state, and commits admission, reservation and command identity atomically.
* **Cancel, modify and close** skip intent, review and planning. They pass the same two stages for their actual effect.
* **Non-dispatch outcomes** (BLOCK, PAUSE, refusals) are recorded as decisions with no send authority.

## The problem

Today the legacy path has four problems:

* review application sits partly in cognition and partly in the gateway;
* the planner writes registry and latch state (LD-03);
* "close" and "cancel" labels are trusted more than their effects;
* gate order is incidental.

The master accepted four corrections:

* one review-policy owner in the kernel (D12);
* a pure planner (D07);
* action-specific admission (AUD-01);
* recorded non-dispatch decisions (AUD-03).

## Goals

1. Every entry route uses the same review-application function. The kernel produces the application itself; a caller can never supply one, so caller-supplied ALLOW is never approval (D12).
2. Planning reads explicit immutable inputs and returns a plan or a refusal, with no persistence or network effects (D07).
3. Admission validates the actual effect, exact targets, quantities, actor capability and the relevant current state for every verb. A label never establishes permission (AUD-01).
4. BLOCK, PAUSE and refusals are recorded with policy, cause and causal inputs, and never create send authority (AUD-03).
5. Live and replay apply the same functions. Replay applies them to recorded review evidence in its own ledger, not to fresh inference (D12).

## Non-goals

* Changing scores, thresholds, the review requirement or AI modes (POL-024, POL-027).
* Choosing cost-inclusive admission (POL-026 stays gross; `README.md:1342`).
* Choosing conflict priorities ([Q-004](../decisions/owner-questions.md#q-004)) or kill and hold permissions ([Q-001](../decisions/owner-questions.md#q-001)).
* A new rule refusing a cancel or modify that weakens protection. AUD-01 notes the risk; the permission matrix is where such a rule would live, and none is approved.
* Preserving legacy gate order (D11, `README.md:726`).

## Requirement keys

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-ADM-001 | Intent carries strategy/family/version, session/candidate, causal view, underlying, direction or abstention and evidence; no order identity or limit override | Intent row (`README.md:732`) |
| REQ-ADM-002 | `kernel.policy` alone interprets ALLOW/BLOCK/PAUSE, abstention, unavailable and timeout under the approved mode, and alone decides pause state; the application binds intent digest, strategy/candidate/session, evidence or cause, policy version and deadline | D12 (`README.md:752`); Review application row (`:733`); POL-027 |
| REQ-ADM-003 | The planner is a pure function of explicit inputs; no registry, ledger, latch, socket or configuration writes | D07 (`README.md:726`); LD-03 |
| REQ-ADM-004 | One planning port keeps the versioned one-leg and structure implementations, selected deterministically | `README.md:726`; §7 (`:1147`) |
| REQ-ADM-005 | The plan states exact instruments, leg roles, quantities, units, prices and rounding, plus policy/candidate/view digest, structure identity, residual exposure, protection policy and measured input ages | Plan row (`README.md:734`); POL-015, POL-020, POL-022, POL-008, POL-026 |
| REQ-ADM-006 | Action requests are explicit entry/cancel/modify/close variants with exact arguments, target identities, principal and account; a label never establishes the effect or permission | AUD-01 (`README.md:754`); Action request row (`:735`) |
| REQ-ADM-007 | Admission checks the actual effect, targets, quantities, actor grant, freshness, conflict dependencies and safety matrix, serialized per account against reconciled observations, pending reservations and uncertain effects | Execution sequence (`README.md:743-745`); POL-007, POL-018, POL-020, POL-021 |
| REQ-ADM-008 | Non-dispatch decisions (BLOCK, PAUSE, refusal) are recorded with policy, cause and causal input identities; PAUSE keeps its approved meaning | AUD-03 (`README.md:756`); POL-027 |
| REQ-ADM-009 | Final risk covers the resulting quantity, instruments and legs; the worst permitted intermediate obligation is reserved | `README.md:744`, `:776` |
| REQ-ADM-010 | Replay applies the same policy function to recorded evidence; fresh inference is a new evaluation | D12 (`README.md:752`); `README.md:802` |
| REQ-ADM-011 | Admission binds its dependency versions and dispatch deadline, and they are revalidated at dispatch without treating unrelated ledger events as invalidation | Admission row (`README.md:736`); D13 (`:758`) |

## Critical user journeys

### CUJ-ADM-1: Entries under enforce mode with a PAUSE

* **Given** AI management mode `enforce_entry_holds`.
* **When:**
  * at 10:00, strategy `X` emits an entry intent on underlying `U`, and its review says PAUSE with no requested duration;
  * at 10:02, `X` emits another entry intent on `U`;
  * at 10:03, a third intent's review says PAUSE again;
  * at 10:06, a fourth intent arrives, and its review says ALLOW.
* **Then:**
  * 10:00: the application is `paused`; admission commits `ADMISSION_REFUSED` (`ADM-R11`) and `PAUSE_STARTED` (expiry 10:05, POL-027 default 5 min) in one transaction;
  * 10:02 and 10:03: `paused` by the active pause; the 10:03 PAUSE starts nothing and does not extend the pause (POL-027);
  * 10:06: the pause has expired (expiry is exclusive); the intent proceeds to planning.

### CUJ-ADM-2: Mislabelled protective request

* **Given** an open long position of 50.
* **When** a close request asks to sell 100.
* **Then** stage B refuses with `ADM-R07 effect_exceeds_target` and records it. Nothing is reserved or sent.

### CUJ-ADM-3: Stale view

* **Given** a live entry whose decision bar stamp is 90.1 s old by the wall clock.
* **When** stage B runs.
* **Then** it refuses with `ADM-R05 view_too_old` and records the refusal. A replay composition does not apply this rule (POL-018).

### CUJ-ADM-4: Protective close after the session closed

* **Given** the financial session is `CLOSED` and an owned position is still open.
* **When** the owner requests a close.
* **Then** the session check does not apply (it applies to new entries only, `SES-R07`), and the close continues to stage B like any other close.

## Technical plan

### Contracts (`contracts/decisions.py`)

The action-request types live in `contracts/execution.py` and are specified in the [ledger spec](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy). An `EntryRequest` carries the command key, the authenticated principal, the account, the session, a reference to the intent and an optional `review_ref`. It carries **no** review application and **no** plan: the kernel produces both in-process during this pipeline and records them in the admission event.

```text
Intent(intent_id, strategy, family, strategy_version, session_id, candidate_id,
       view_id, underlying, as_of: Timestamp, direction: long_call | long_put | abstain,
       evidence_refs: list[EvidenceRef])             # intent_digest = digest(intent)
Review(review_id, purpose="entry_review", intent_digest, outcome:
       allow | block | pause | abstain | unavailable | invalid | timeout,
       pause_minutes: int | None, evidence_refs, produced_at)      # cognition output
PauseState(scope: (strategy, underlying, session_id), pause_id, review_id,
       started_at, expires_at, session_end, cleared_at | None, cleared_by | None,
       clear_reason | None)                          # read from PAUSE_* events
ReviewApplication(intent_digest, strategy, candidate_id, session_id,
       mode: off | observe | enforce_entry_holds,
       applied: proceed | blocked | paused | proceed_unavailable,
       basis: review | pause | cause, review_id | None, pause_id | None, cause | None,
       review_outcome | None, alert: bool, policy_version, deadline: Deadline)
Plan(plan_digest, planner_version, structure_id, intent_digest, candidate_id, view_id,
     policy_digest, legs: list[PlanLeg], amount, margin, worst_case_loss, currency,
     residual_exposure, protection_policy_ref, protective_levels: {stop, target | None},
     measured_ages: {view, spot, chain})
PlanLeg(leg_role, instrument, side, quantity, unit="contracts", lot_size,
        limit_price | None, amount, tick_size)
PlanRefusal(stage, reason)
```

* `intent_digest` is `digest(intent)` with the ledger's canonical rule. `underlying` comes from the view the intent was decided on; an intent never names an option contract.
* `ReviewApplication` and `Plan` are built only inside `kernel.policy` and `kernel.planner`. The capability test PRF-XC-02 checks that no other package constructs them.
* `review_outcome` is the review's raw outcome, kept even when `applied` is `proceed` (for example, BLOCK in `observe` mode). `alert` is true for every `proceed_unavailable`; the operator alert route ([runtime spec](runtime-isolation-observability-deployment.md)) reads it from the recorded application.
* `cause` values: `review_not_required`, `no_review`, `review_not_found`, `wrong_purpose`, `digest_mismatch`, `unavailable`, `invalid`, `timeout`, `abstain`, `pause_state_unreadable`, `pause_cleared`.
* `deadline` is the entry's dispatch deadline: origin = the stage A evaluation time, budget = `dispatch.deadline_ms.entry` ([dispatch spec](dispatch-and-coordination.md#policy-inputs)).
* `PlanRef` in the ledger spec is the subset of `Plan` the coordinator and adapter need.
* An intent with `direction = abstain` never becomes an `EntryRequest`: the strategy host records it as evidence ([strategies-and-cognition](strategies-and-cognition.md)). If one arrives, A1 refuses it with `ADM-R01`.

### Review application (`kernel/policy.py`)

This is the master's existing entry policy (`README.md:113-118`), applied by the kernel. `kernel.policy` is a pure function of explicit inputs: the intent, the review found by `review_ref` (or none), the `PauseState` for the intent's scope, the bound mode and review requirement, and the evaluation time. It returns the application and, when a pause must start, a `PAUSE_STARTED` decision for admission to commit.

**Finding the review:**

| Situation | Result used below |
|---|---|
| Mode `off`, or the bound policy requires no review | `proceed`, cause `review_not_required` |
| Review required; `review_ref` absent | `unavailable`, cause `no_review` |
| `review_ref` does not resolve | `invalid`, cause `review_not_found` |
| Review `purpose` is not `entry_review` | `invalid`, cause `wrong_purpose` |
| Review `intent_digest` differs from the intent's (A05-F3, `README.md:843`) | `invalid`, cause `digest_mismatch`; never `allow` |
| `produced_at` later than `intent.as_of + review.timeout_ms` | `timeout`; a late result never revives the intent (A03-F3, `README.md:918`) |
| Otherwise | The review's outcome |

**Applying it.** In `observe` mode the pause state is not read. In `enforce_entry_holds` it is, and the rules apply in this order:

1. An **active pause** for the scope gives `paused` (basis `pause`). This matches legacy `service.py:366-371`, which checks the pause before running a review.
2. Otherwise the outcome row below applies.
3. If the pause state could not be read: `allow` becomes `proceed_unavailable` (cause `pause_state_unreadable`, alert); `block` and `pause` keep their row. This keeps the legacy fail-open contract (`pause.py:233`, status `unavailable`) without letting it weaken a BLOCK.

| Outcome | Mode `observe` | Mode `enforce_entry_holds` |
|---|---|---|
| allow | proceed | proceed |
| block | proceed (`review_outcome=block` recorded) | blocked (this intent only) |
| pause | proceed (`review_outcome=pause` recorded) | paused; starts a pause unless the scope was cleared at or after the evaluation time (cause `pause_cleared`, then proceed) |
| unavailable, invalid, timeout, abstain | proceed_unavailable; alert | proceed_unavailable; alert |

* **Abstain** is in the unavailable row because the master says advisor backend failures abstain (`README.md:120`).
* **Pause bounds (POL-027).** Duration is `min(pause_minutes or 5, 60)` minutes. `expires_at = min(started_at + duration, session_end)`, where `session_end` is the session's calendar close time from `kernel.lifecycle`. A pause is **active** while `started_at ≤ now < expires_at` and it is not cleared (legacy `pause.py:88`). A PAUSE during an active pause neither extends nor replaces it.
* **Starting a pause.** `pause_id = digest({scope, review_id})`. Admission commits `PAUSE_STARTED` (`pause_id`, scope, `review_id`, requested and effective minutes, `started_at`, `expires_at`, `session_end`) in the same transaction as the paused entry's `ADMISSION_REFUSED`. Just before that commit, on the writer thread, admission reads the scope's pause state again; if a pause became active meanwhile, it commits only the refusal. Two PAUSE reviews therefore cannot both start a pause.
* **Clearing.** Only a human principal with the `pause_clear` grant action clears a pause, through the operator path ([security-and-operator](security-and-operator.md)). It records `PAUSE_CLEARED` (`pause_id`, actor, reason, `cleared_at`). This matches legacy `pause.py:298`.
* **Replay** runs `kernel.policy` over the recorded reviews and writes its own `PAUSE_*` events into the replay's own ledger. It never reads live pause events.

### Planning port (`kernel/planner.py`, `kernel/selection.py`)

```text
plan(intent, view: StableView, chain: ChainSnapshot, reference_facts: ReferenceFacts,
     policy: BoundPolicy, account: AccountStateSnapshot) -> Plan | PlanRefusal(stage, reason)
```

* **Inputs.** `StableView`, `ChainSnapshot` and `ReferenceFacts` come from the market-data port ([market-data-and-canvas](market-data-and-canvas.md)); `BoundPolicy` from the bound release; `AccountStateSnapshot` (open reservations, positions, account funds and their observation time) from `kernel.reservations`. Admission loads them all, at the stage A evaluation time, before calling `plan`. Their identities are recorded in the plan.
* Called only after eligibility returns `proceed` or `proceed_unavailable`.
* Pure: every input is passed in; nothing is read from or written to stores, clocks or sockets.
* **Implementations**, chosen by `policy.planner_version`:
  * `one_leg_v1`: the legacy one-leg orchestrator `plan()` (`src/core/framework/runtime/orchestrator.py:385`), keeping its planning stages `session_gates`, `strike`, `quantity`, `exposure`, `stop`, `loss_budget` and `request` (`:90`);
  * `structure_v1`: the legacy structure planner `plan_structure()` (`src/core/framework/structures/planner.py:104`), keeping its stages `resolve`, `exposure`, `economics`, `stop` and `loss_budget`;
  * any other value: `PlanRefusal("select", "unknown_planner_version")`.
* The legacy stages `kill_switch`, `freshness`, `view_freshness`, `view_lag` and `loss_latch` are **not** planner stages. They move to `kernel.safety` and admission (LD-03).
* Rules kept from approved behaviour:
  * lot size from the chain row, then the reference fact, else refuse with stage `lot_size` (POL-022; legacy `orchestrator.py:625-647`);
  * tick rounding, stop up and target down (POL-015);
  * long-only economics check (POL-008);
  * gross economics (POL-026).
* Their exact behaviour is fixed by the retained-scope parity proof PRF-ADM-07, not re-derived here.

### Admission (`kernel/admission.py`)

Admission runs in two stages. Each stage stops at its first failed check, and that check's code is the refusal. Every refusal of every verb is recorded as `ADMISSION_REFUSED` with its inputs, **except** `LED-R01`, `LED-R02` and `ADM-R12`, which are returned without a record (see the [ledger refusal rule](ledger-and-atomic-transaction.md#refusals-and-their-recording)).

**Stage A: eligibility (before planning).**

| # | Check | Applies to | Refusal |
|---|---|---|---|
| A1 | Request well-formed; command key present; an entry's intent resolves and does not abstain | all | ADM-R01 / LED-R01 |
| A1a | Command identity: same key and digest returns the existing state; same key with a different digest is refused; a key with no row (including one whose earlier request was refused) continues | all | LED-R02 |
| A2 | Actor grant: `authority.check(verb, principal, account, at="admission")` | all | SES-R01 … SES-R05, SES-R09 |
| A3 | Session `OPEN` for the account's session scope and trading date | entry only | SES-R07 |
| A4 | Safety matrix permits this verb and actor (kill, latch, hold) | all | PRT-R01, PRT-R03, PRT-R04, PRT-R06, PRT-R07 |
| A5 | `kernel.policy` application is `proceed` or `proceed_unavailable`; otherwise a non-dispatch decision is recorded (AUD-03) | entry | ADM-R11 `not_eligible` |

**Planning** (entries only). A `PlanRefusal` is recorded as `ADM-R13 plan_refused` with its stage and reason.

**Stage B: serialized admission (on the writer thread, after planning).**

Stage B first repeats A1a, A2, A3, A4 and the pause lookup, because another request with the same key, or a grant, session, safety or pause change, may have committed since stage A. Then:

| # | Check | Applies to | Refusal |
|---|---|---|---|
| B1 | Freshness (below) | all | ADM-R05 |
| B2 | Effect matches target (below) | cancel, modify, close | ADM-R07 |
| B3 | Conflict relation permits the action now ([protection-and-safety](protection-and-safety.md#conflict-relation-kernelsafetypy)) | all | PRT-R10 |
| B4 | Busy: the account's busy count is below `coordinator.max_pending_per_account` ([dispatch spec](dispatch-and-coordination.md#busy-count-supplied-to-admission)) | all | ADM-R12 `busy` |
| B5 | Capacity (below) | entry | ADM-R09 |
| B6 | Binding (below) | entry | ADM-R10 |

**B1 freshness.**

| Input | Bound | Applies to |
|---|---|---|
| View age: wall now minus the decision bar's stamp (the bar's open, [Q-003](../decisions/owner-questions.md#q-003)) | ≤ 90 s (POL-018) | Entries in a live composition only. A replay composition, flagged when it is built, does not apply it. A CP-A1 retry is a live entry and is judged |
| Spot and chain age | ≤ 2 × `market.poll_interval_secs` from the bound market-data policy (POL-020) | Entries |
| Broker observation of the account's orders and positions | `arrived_at` ≤ 60 s before now (POL-021) | All verbs |

The measured ages are written into `Plan.measured_ages` (POL-020).

**B2 effect.** An order or position is **owned** when it belongs to this account and a verified identity ties it to one of the account's commands ([execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)).

* **Cancel:** the target order is owned and open in the fresh observation.
* **Modify:** the target order is owned and open; `changes` uses only the `ModifyChanges` fields; a new quantity is not above the order's unfilled quantity.
* **Close:** `quantity` is not above the open position quantity; the side is derived as the side that reduces the position (for a long-only buyer, SELL).
* The resulting exposure (REQ-ADM-009) is recorded in the admission event, including when a cancel removes protection.

**B5 capacity.** The retained legacy rule (`src/core/framework/execution/reservations.py:352-437`), computed from `AccountStateSnapshot`:

* the snapshot is no older than `account.freshness_secs` (legacy `:362-367`);
* `amount ≤ available − (open reservation amounts + external capital commitments)`;
* `margin ≤ margin_available − (open reservation margins + external margin commitments)`;
* `worst_case_loss ≤ account.max_worst_case_loss`.

External commitments count broker-observed positions and working orders once, excluding protective orders and legs already reserved (legacy `_external_commitments`, `:473-497`). `account.freshness_secs` and `account.max_worst_case_loss` are refusing parameters, characterized from legacy values in TASK-S04-03. Which domains' obligations count is [Q-008](../decisions/owner-questions.md#q-008).

**B6 binding.** All of these must hold, or the entry is refused:

* `plan.plan_digest` equals the digest of the plan's other fields;
* `plan.intent_digest`, `application.intent_digest` and `request.intent_ref` all equal `digest(intent)`;
* the application's strategy, candidate and session equal the intent's;
* `application.policy_version` equals the bound policy version now.

It fails when the policy was rebound between stage A and stage B, or when a wiring fault pairs the wrong objects.

**On success**, stage B commits `COMMAND_ADMITTED` with the request digest, plan digest, application, reservation, resulting exposure and the dependency set that dispatch rechecks ([dispatch dependency table](dispatch-and-coordination.md#revalidation-at-dispatch-req-dsp-001)).

**Slot scope.** The POL-007 slot rule ("one open position at a time") is one row of the conflict relation, so B3 enforces it. Its scope is (account, underlying), matching legacy `max_positions_per_underlying = 1` (`OA/src/strategies/buyer_edge.py:687`). Admission has no separate slot check.

### Refusal codes

| Code | Meaning |
|---|---|
| ADM-R01 `malformed_request` | Missing or ill-typed field; unresolved or abstaining intent |
| ADM-R05 `view_too_old` | A freshness bound in B1 failed |
| ADM-R07 `effect_exceeds_target` | The effect does not match the target |
| ADM-R09 `capacity` | No capacity, or a capacity parameter is unbound |
| ADM-R10 `binding_mismatch` | A B6 condition failed |
| ADM-R11 `not_eligible` | Review application is `blocked` or `paused` |
| ADM-R12 `busy` | Account at the busy bound; returned before any commit |
| ADM-R13 `plan_refused` | The planner returned a refusal; stage and reason recorded |

Codes not listed (R02–R04, R06, R08) are unused.

## Failure modes and crash points

| CP | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-A1 | Crash after planning, before the admission commit | Nothing durable; a retry with the same command key re-plans and admits once | PRF-ADM-05 |
| F-A2 | Review arrives after its deadline | Treated as `timeout`; a late result never revives the intent | PRF-ADM-02 |
| F-A3 | Planner raises | Recorded as `ADM-R13` with stage `internal`; never a partial plan | PRF-ADM-03 |
| F-A4 | Reference fact missing for lot size | `ADM-R13` with stage `lot_size` (POL-022) | PRF-ADM-03 |
| F-A5 | Observation snapshot incomplete (pages missing) | Dependent checks refuse; empty is never taken as flat (`README.md:745`) | PRF-ADM-04 |
| F-A6 | Pause state unreadable | Rule 3 of the application order | PRF-ADM-01 |
| F-A7 | Kill recorded between stage A and stage B | Stage B's repeat of A4 refuses | PRF-ADM-04 |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| AI mode and review requirement | Bound policy (POL-027) | `observe` (approved default) |
| Pause duration | POL-027 | 5 min default, 60 min cap, session close |
| `review.timeout_ms` | Legacy AI-management configuration, characterized in TASK-S04-01 | None: refusing parameter |
| Freshness bounds | POL-018 (90 s), POL-020 (2× poll), POL-021 (60 s) | Approved values, carried in the bound policy |
| Busy bound | [dispatch spec](dispatch-and-coordination.md#policy-inputs) | None: refusing parameter |
| `account.freshness_secs`, `account.max_worst_case_loss` | Legacy values, characterized in TASK-S04-03 | None: refusing parameters |
| Reservation quantities and `money.rounding` | Plan computation under the legacy rule, characterized in TASK-S04-03 | None until characterized |

## Reuse evidence

* **One-leg orchestrator / structure planner: reuse behind one versioned planning port** (`README.md:1147`). Extraction must remove `orchestrator.py:528-548` latch I/O (LD-03).
* **Advisor/team/AI management: relocate review application** (`README.md:1152`). The legacy service at `src/runtime/ai_management/service.py:117`, `:430` (cited `README.md:111`) is the behavioural reference for the review table. Its active-pause check before the review runs is at `service.py:366-371`.
* **Pause store: reuse its rules, move its storage.** Legacy `src/runtime/ai_management/pause.py` `PauseStore` (`:61`) holds the rules kept above: 5/60 min constants (`:15-16`), activity test (`:88`), no extension while active and session-end cap (`request_pause`, `:233`), human-only clear (`clear`, `:298`). Its scope uses `management.instrument`, the underlying (`service.py:125`). The target records the same facts as ledger events.
* **Reservation and capacity:** legacy `reserve()` and `_external_commitments` (`reservations.py:377-437`, `:473-497`) are the retained capacity rule.
* **Gateway admission:** `src/runtime/execution_gateway/__init__.py:389` (shape/authority/holds checks, `README.md:96`) is evidence, not a template. The stage order above follows the target contracts.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Cognition applies its own review | Rejected by D12; it duplicates financial interpretation |
| Separate admission path per verb | Rejected by AUD-01; one kernel enforces all variants |
| Keep the latch inside the planner | Violates D07 (LD-03) |
| One admission table run after planning | Plans entries that are already blocked or paused, and mixes non-serialized checks into the serialized section |
| Run every check and report all failures | Later checks depend on earlier ones (a stale view makes the conflict check meaningless); first failure per stage is simpler to prove |
| PAUSE also in the safety matrix | Two owners for one rule; `kernel.policy` owns it (D12) |
| Trust stage A's state checks in stage B | A kill or pause can commit while the planner runs |

## Proofs

| Proof | Class | Expected outcome | Break check |
|---|---|---|---|
| PRF-ADM-01 | T `tests/unit/test_review_semantics.py` | Each row of the finding table and each cell of the outcome table gives its tabled result; the three ordering rules hold; unreadable pause state turns ALLOW into `proceed_unavailable` but keeps BLOCK | Treating a mismatched ALLOW as proceed fails |
| PRF-ADM-02 | T `tests/unit/test_review_semantics.py` | CUJ-ADM-1 at each time; a late review is `timeout`; expiry is exclusive; a non-human clear is refused; two concurrent PAUSE reviews start one pause | Extending the pause, or starting two, fails |
| PRF-ADM-03 | T `tests/unit/test_planner_rules.py` | Planner purity (no file, socket or clock access under a sandboxed fixture); POL-015/POL-022/POL-008 cases; unknown `planner_version` refused | Adding any I/O fails the sandbox |
| PRF-ADM-04 | T `tests/unit/test_admission_checks.py` | Each stage A and stage B row refuses with its code and is recorded or not as stated; CUJ-ADM-2; CUJ-ADM-4; F-A7; capacity cases against a hand calculation | Trusting the label passes |
| PRF-ADM-05 | T `tests/integration/test_entry_outcomes.py` | CP-A1 retry admits exactly once; a retry after a recorded refusal is evaluated afresh | — |
| PRF-ADM-06 | T `tests/integration/test_shared_engine.py` | The same recorded review gives the same application and pause events in live and replay compositions | Fresh inference in replay fails |
| PRF-ADM-07 | T (parity, retained scope only) `scripts/compare_parity.py` | Recorded-day plans from the target match legacy plans for retained behaviour (POL-024 scope), except listed corrections | Named scope only (A08-F3) |

## Delivery

SLICE-01 passes a fixed `ReviewApplication` and plan to the coordinator in-process (the test stands in for `kernel.policy` and `kernel.planner`), and implements A1, A1a, A5, B5 (with a synthetic capacity) and B6. SLICE-04 builds the policy module, the pause records, the planning port and both stages in full. See [plan/delivery-plan.md](../plan/delivery-plan.md).
