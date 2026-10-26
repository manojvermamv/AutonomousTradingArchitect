# Sessions, authority and recovery stages

* **Status:** proposed (package spec), revised after EGM stages 5 and 6 ([review](../egm/sessions-authority-lifecycle/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item, never an edit here.
* **Specified here (exclusive):** `kernel/authority.py`, `kernel/recovery.py`, the **financial-session transitions** of `kernel/lifecycle.py`, `contracts/identity.py`, `contracts/clock.py`, `adapters/clocks.py`.
* **Contributors:** `interfaces/authorization.py` authenticates principals and carries the owner's grant requests ([security-and-operator](security-and-operator.md)). `operations/backup.py` and `restore.py` supply recovery-set evidence ([migration-recovery-rollback-continuity](migration-recovery-rollback-continuity.md)).
* **Commits through:** the atomic transaction in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md); epoch activation through `LedgerWriter.activate_epoch()` in the same spec.
* **Master anchors:** ATA-05 (`README.md:450`); Combined-F1 (`README.md:786`); A04-F1/F2 (`README.md:792-794`); A06-F1 and Combined-F4 (`README.md:863`, `:359-366`); Financial session row (`README.md:730`).
* **Terms:** the kill switch (POL-002), recovery hold (POL-003), daily-loss latch (POL-004) and AI-management PAUSE (POL-027) are rows of the [policy inventory](../02-policy-inventory.md); LD-nn rows are in [legacy-divergence](../legacy-divergence.md).

## Overview

Before the kernel acts, it must know four things:

1. **Who is acting, and what they may do.** Grants, recorded in the ledger and checked by `kernel.authority` (A06-F1).
2. **Whether this process is the one writer.** The writer lock and the active epoch (A04-F2). The ledger enforces both; `kernel.recovery` activates the epoch; authority reports the state.
3. **Which financial session a new entry belongs to.** A canonical, scoped session whose transitions `kernel.lifecycle` records (ATA-05).
4. **What time it is, in which clock domain** (Combined-F1).

Recovery stages separate "the process is running" from "the process may send" (A04-F1).

## The problem

In the legacy system these facts are implicit:

* A "session" is whatever the systemd start, the driver's calendar check and the IST date say. The daily-loss latch is keyed by IST trading day (LD-04).
* A restart re-creates in-memory state.
* Wall-clock readings and bar stamps are mixed.

The master accepted scoped financial sessions owned by the kernel (ATA-05), explicit clock domains (Combined-F1) and staged recovery (A04-F1).

## Goals

1. Every financial action is checked against a current grant at admission and again at dispatch (A06-F1 with D13).
2. Exactly one process writes a given ledger, and that is proved (A04-F2).
3. New entries are scoped to one canonical financial session. A restart continues the open session and never invents a new one (ATA-05).
4. Protective and owner actions on existing exposure never depend on a session being open. Their own rules decide them (AUD-01, `README.md:754`, `:773`).
5. Timed rules use declared clock domains. Deadlines survive restart without reset or extension (Combined-F1).

## Non-goals

* First-release accounts or strategies ([Q-005](../decisions/owner-questions.md#q-005)).
* New emergency permissions or kill/latch matrix changes ([protection-and-safety](protection-and-safety.md)).
* Whether a standing authorization may advance routine restarts to `OPERATING` ([Q-009](../decisions/owner-questions.md#q-009)); RTO values (`README.md:333`).
* Cross-host fencing mechanisms (operational; F9, `README.md:203`).

## Requirement keys

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-SES-001 | Grants are checked for actor, action, account, validity, revocation and delegation, at admission and again at dispatch with the same function | A06-F1 (`README.md:863`); D13 (`:758`) |
| REQ-SES-002 | One active epoch per ledger. The ledger's writer lock and active-epoch check prove local exclusivity (`LED-R07`, `LED-R03`). Cross-host exclusion needs separate fencing evidence | A04-F2 (`README.md:794`); F9 (`:203`) |
| REQ-SES-003 | Canonical scoped financial session: identity, scope, calendar version, policy bindings and transition evidence | ATA-05 (`README.md:450`); Financial session row (`:730`) |
| REQ-SES-004 | A restart is not a new session. Session transitions follow applicable approved rules and do not reset every safety condition or activate a staged binding implicitly | ATA-05 (`README.md:450`) |
| REQ-SES-005 | Session-scoped safety state (daily-loss latch, AI pause) is keyed by the canonical session | POL-004, POL-027; LD-04 |
| REQ-SES-006 | Clock contract: persisted times carry their domain and uncertainty; elapsed waits use a monotonic domain; deadlines persist origin, domain and budget; replay uses recorded clock advances | Combined-F1 (`README.md:786`) |
| REQ-SES-007 | Calendar and clock evidence trigger session transitions but grant no authority; authority validates the binding | ATA-05 (`README.md:450`); `README.md:829` |
| REQ-SES-008 | Recovery stages: inspection, then exclusive recovery writing (never dispatches), then authorized operation; no blanket automatic activation | A04-F1 (`README.md:792`); A04-F2 (`:794`) |
| REQ-SES-009 | Proving old-owner exclusion is separate from resolving effects the old owner started | A04-F2 (`README.md:794`) |
| REQ-SES-010 | After a restore, authorization is verified against its authoritative source, or the affected restored authorization is invalidated | Combined-F4 (`README.md:863`, `:365`) |
| REQ-SES-011 | A candidate or policy binding becomes effective only at a validated session opening | A07-F4 (`README.md:891`); A02-F3 (`:905`) |

## Critical user journeys

All times are IST (`Asia/Kolkata`). The NSE F&O calendar in the examples opens at 09:15 and closes at 15:30.

### CUJ-SES-1: Mid-session restart

* **Given:**
  * session `S` for scope `(acct-1, NSE-FO)` on 2026-11-02 is `OPEN`;
  * the daily-loss latch for strategy `X` in `S` is tripped;
  * one command is `UNCERTAIN`.
* **When** the kernel restarts at 11:20 on the same date.
* **Then:**
  * the process starts in `INSPECTING`, activates its epoch into `RECOVERY_WRITING`, and waits there for an authorized `RECOVERY_ADVANCED` (A04-F2; [Q-009](../decisions/owner-questions.md#q-009) asks whether a standing authorization may cover this);
  * while it waits, nothing is sent; broker-held stops remain the protection (A03-F5);
  * after the advance, the kernel continues in `S`; the latch stays tripped; the command stays `UNCERTAIN`; no session event is written.

### CUJ-SES-2: Kernel down over the session close

* **Given** `S` (2026-11-02) is `OPEN`, and the kernel stops at 15:00. It returns at 09:05 on 2026-11-03, the next trading date.
* **When** recovery reaches `RECOVERY_WRITING`.
* **Then** lifecycle records `SESSION_CLOSED` for `S`, with reason `closed_in_recovery` and the close time recorded when `S` opened. In the same transaction it applies the approved close effects:
  * the latch for `S` ends (POL-004);
  * pauses in `S` end (POL-027);
  * outstanding obligations and their protection carry over unchanged (Combined-F6).

  The session for 2026-11-03 opens only in `OPERATING`, at or after 09:15, when the calendar shows the date open and a standing binding covers it.

### CUJ-SES-3: Grant revoked between admission and dispatch

* **Given** an admitted command whose grant is valid at admission.
* **When** `GRANT_REVOKED` for that grant commits before the dispatch claim.
* **Then** the dispatch check returns `SES-R03 grant_revoked`, the coordinator records `DISPATCH_REFUSED`, and the reservation is released.

### CUJ-SES-4: Protective close after the session closed

* **Given** `S` is `CLOSED` and a position carried from `S` is open.
* **When** an authenticated owner closes it.
* **Then** admission does not require an open session for a close. The safety matrix and the grant decide (POL-002 still applies under kill).

## Technical plan

### Identity contract (`contracts/identity.py`)

| Type | Fields | Rule |
|---|---|---|
| `AccountId` | `broker`, `account` | Preserved from legacy configuration until authority scope is confirmed (`README.md:724`) |
| `SessionScope` | `account_id`, `calendar_id` (exchange-segment calendar) | Fixed by this spec (ATA-05: scoped, no universal ID). An entry's calendar is the exchange segment of its plan's instruments, from reference facts. Changing the composition needs a recorded decision |
| `FinancialSessionId` | `scope`, `trading_date` (`YYYY-MM-DD` in the calendar's timezone) | One session per scope per trading date; written as the string `"<broker>:<account>:<calendar_id>:<trading_date>"` |
| `PolicyBindingId` | SHA-256 of the canonical bound policy document ([configuration spec](configuration-artifacts-release.md)) | Immutable once bound |
| `CandidateId` | SHA-256 of the canonical candidate manifest ([research spec](research-rl-custody-promotion.md)) | Immutable once bound |
| `CommandKey` | Caller-supplied string | REQ-LED-004 |
| `EpochId` | Non-empty string chosen at writer open | One active per ledger |
| `Principal` | `value`; `kind`: `human` or `kernel` | Never taken from a payload claim (`README.md:863`) |
| `Grant` | `grant_id`, `principal`, `actions`, `accounts`, `valid_from`, `valid_until`, `revoked_at`, `delegated_by`, `delegation_limit`, `version` | Shared by `interfaces.authorization` and `kernel.authority` (A06-F1) |

**Grant actions:** `entry`, `cancel`, `modify`, `close`, `latch_unlock`, `pause_clear`, `kill_engage`, `kill_release`, `hold_engage`, `hold_release`, `binding_authorize`, `recovery_advance`. `accounts` lists the accounts a grant covers; for `recovery_advance`, which acts on the whole ledger, it must cover every bound account.

### Grants and the authority check (`kernel/authority.py`)

* **Source.** Grants are ledger events. `kernel.authority` records `GRANT_ISSUED` and `GRANT_REVOKED` on requests that arrive through `interfaces.authorization`. A grant index table holds the current rows.
* **Owner root.** The owner's root grant is established through the owner credential path in `interfaces.authorization` ([security-and-operator](security-and-operator.md)), not by another grant. That path is also how authorization is re-established after a restore (REQ-SES-010).
* **Kernel principals.** Each kernel module that originates actions has a fixed principal of kind `kernel` and a built-in grant defined in code: `kernel:protection` has `cancel`, `modify`, `close`; `kernel:recovery` has `hold_engage` and `hold_release` (for recovery holds); `kernel:lifecycle` has none (its session events are not action requests). Their actor type is `automatic` for the safety matrix.
* **Time.** Grants are evaluated at wall-clock now. A grant is valid when `valid_from ≤ now < valid_until` and `revoked_at` is null or later than now.
* **Delegation.** `delegated_by` names the parent grant. A delegated grant's actions and accounts must be subsets of its parent's. `delegation_limit` is how many further levels a grant may delegate (0: none).

```text
authority.check(verb, principal, account, at: "admission" | "dispatch") -> Allowed(grant_id, grant_version) | Refusal
authority.validate_binding(scope, trading_date) -> BindingRef(binding_id, policy_binding_id, candidate_ids) | Refusal
authority.writer_state() -> WriterState(lock_held: bool, writer_epoch, active_epoch)   # read from the ledger
```

`Refusal` is the ledger's `Refusal` type. `check` runs these steps in order and returns the first failure:

| Step | Code | Meaning |
|---|---|---|
| 1 | SES-R01 `unauthenticated_actor` | The principal was not authenticated by `interfaces.authorization` |
| 2 | SES-R09 `recovery_stage` | The current recovery stage forbids this verb (table below) |
| 3 | SES-R02 `grant_scope` | No grant of this principal covers this verb and account |
| 4 | SES-R03 `grant_revoked` | Every covering grant is revoked |
| 5 | SES-R04 `grant_expired` | Every covering grant is outside its validity range |
| 6 | SES-R05 `delegation_exceeded` | Every covering grant breaks its delegation chain (not a subset, or depth above a `delegation_limit`) |

Other session codes:

| Code | Meaning | Emitted by |
|---|---|---|
| SES-R07 `session_not_open` | A new entry with no `OPEN` session for its scope and date | Admission (A3) and dispatch (row 4), from `kernel.lifecycle` state |
| SES-R08 `binding_not_authorized` | No standing binding covers the scope and date | `validate_binding`, at session open |

SES-R06 is unused. Revocation affects only queued, unattempted work. It never retracts an effect already started or erases reconciliation duties (`README.md:863`).

### Bindings and session transitions (`kernel/lifecycle.py`, session part)

**Standing binding.** An actor holding `binding_authorize` records `BINDING_AUTHORIZED`: scope, policy binding ID, candidate IDs, and an inclusive range of trading dates. It is recorded **once per binding change**, not daily, and ended by `BINDING_REVOKED`. For a scope and date, the binding that applies is the **latest** unrevoked `BINDING_AUTHORIZED` whose range covers the date. A binding recorded while a session is open is **staged**: it applies from the next `SESSION_OPENED` (REQ-SES-011).

A policy binding (which strategy policy and candidate) is different from the ledger's `release_binding` (which installed release runs). Both are checked; neither implies the other.

**Calendar port.**

```text
Calendar.trading_day(calendar_id, date) -> TradingDay(open_time, close_time, version) | Holiday | Unavailable
```

Times are exchange-domain timestamps in the calendar's timezone (IST for NSE), converted to UTC for storage.

**Evaluation.** `kernel.lifecycle` evaluates sessions at process start (after `OPERATING`), and on a timer set to the next open or close time it knows.

| From | Event | To | When | Validated by |
|---|---|---|---|---|
| — | `SESSION_OPENED` | `OPEN` | In `OPERATING`, the clock is at or after the trading day's `open_time` and before its `close_time`, and no session exists for the scope and date. A late start opens late | `validate_binding` |
| `OPEN` | `SESSION_CLOSED` | `CLOSED` | The clock reaches the `close_time` recorded at open (reason `calendar_close`), or recovery finds it passed (reason `closed_in_recovery`) | — |
| — | `SESSION_OPEN_FAILED` | (none) | The calendar is unavailable, the date is a holiday with a binding expecting it, or `validate_binding` refuses; recorded once per scope, date and reason | — |

Because the close time is recorded at open, closing never needs the calendar again.

**Event payloads** (validated by `resources/events.schema.json`):

| Event | Payload |
|---|---|
| `BINDING_AUTHORIZED` | `binding_id`, `scope`, `policy_binding_id`, `candidate_ids`, `first_date`, `last_date`, `principal` |
| `BINDING_REVOKED` | `binding_id`, `principal`, `reason` |
| `GRANT_ISSUED` / `GRANT_REVOKED` | the `Grant` fields / `grant_id`, `revoked_at`, `principal`, `reason` |
| `SESSION_OPENED` | `session_id`, `scope`, `trading_date`, `calendar_version`, `open_time`, `close_time`, `opened_at`, `binding_id`, `policy_binding_id`, `candidate_ids` |
| `SESSION_CLOSED` | `session_id`, `reason`, `closed_at`, `effects` (the close-effect rows applied) |
| `SESSION_OPEN_FAILED` | `scope`, `trading_date`, `reason` (`calendar_unavailable`, `holiday`, `SES-R08`) |
| `RECOVERY_STAGE` | `from`, `to`, `principal` (for an advance), `gaps` |
| `CLOCK_QUALITY` | `kind` (`backward_jump`, `forward_jump`), `wall_delta_ms`, `monotonic_delta_ms`, `detected_at` |

**`session` index table:** `session_id` (PK), `account`, `calendar_id`, `trading_date`, `state`, `binding_id`, `close_time`, `opened_sequence`, `closed_sequence`. A partial unique index on (`account`, `calendar_id`) where `state = 'OPEN'` enforces I-S1. `SESSION_CLOSED` carries a ledger guard requiring state `OPEN`, so a session closes once (CP-S1). Exact DDL is in the SLICE-03 file.

**Effects recorded in the same transaction as `SESSION_CLOSED`** (only where an approved rule says so):

| State | At session close | Rule |
|---|---|---|
| Daily-loss latch for that session | Ends | POL-004 |
| AI-management PAUSE in that session | Ends | POL-027 |
| Kill switch | Unchanged | POL-002 (no session expiry) |
| Holds | Unchanged | POL-003; [Q-001](../decisions/owner-questions.md#q-001) |
| Uncertain commands, open positions, protection | Carried unchanged | REQ-SES-004; Combined-F6 (`README.md:909`) |
| Admitted entries not yet claimed | Refused at dispatch by revalidation row 4 (`SES-R07`), and their reservations released | REQ-DSP-001 |
| Staged bindings | Take effect only at the next `SESSION_OPENED` | REQ-SES-011 |

Session-close **exits** (square-off) belong to `kernel.protection`. It runs them per strategy policy while the session is still `OPEN` (POL-010).

**Who needs an open session:**

| Action | Needs an `OPEN` session? |
|---|---|
| New entry | **Yes**: checked at admission (A3) and at dispatch (`SES-R07`) |
| Cancel, modify, close, owner actions, protection, reconciliation | **No.** Their own safety, grant and conflict rules apply |

**Invariants:**

* **I-S1:** at most one `OPEN` session per scope.
* **I-S2:** every session-scoped safety record names a `FinancialSessionId`.
* **I-S3:** no `SESSION_OPENED` without a covering `BINDING_AUTHORIZED` earlier in the ledger.

Opening sessions automatically from a standing binding preserves today's operation: the legacy desk starts each trading day from the calendar (production session calendar row, `README.md:1268`). This is a daily session transition. It is not financial activation after recovery, which stays under A04-F1/F2.

### Clock contract (`contracts/clock.py`, `adapters/clocks.py`)

```text
Timestamp(utc_iso, domain: wall | exchange | recorded, uncertainty_ms: int | None)
Elapsed(monotonic_ns)                       # per-process origin; never persisted as a time of day
Deadline(origin: Timestamp, budget_ms: int) # persisted as written
Clock.now() -> Timestamp ; Clock.elapsed() -> Elapsed
LiveClock     # now(): wall domain; elapsed(): time.monotonic_ns()
RecordedClock # now() and elapsed() advance only from a recorded list of (Timestamp, Elapsed) pairs
```

* `utc_iso` is RFC 3339 UTC with microseconds and `Z`. `uncertainty_ms` comes from the host's time-sync status when available; `None` means unknown.
* **Exchange time** comes from market data (bar stamps) and is never produced by `LiveClock`.
* `Elapsed` values compare only within one process.
* **Deadlines** are judged in the wall domain: expired when `effective_now ≥ origin + budget`. `effective_now` is the larger of wall now and the latest wall time already recorded in the ledger. A backward wall jump therefore neither revives an expired deadline nor expires a valid one early, and a restart neither resets nor extends one.
* **Jumps.** On every kernel tick the clock adapter compares the wall delta with the monotonic delta since the previous tick. A difference above `clock.jump_record_ms` records `CLOCK_QUALITY`. This only records; no clock-health money gate is introduced (`README.md:786`).
* Ordering uses ledger sequence and causal IDs, never wall time alone.

### Recovery stages (`kernel/recovery.py`)

Every process start begins at `INSPECTING`. The stage is held in memory and each transition is recorded as `RECOVERY_STAGE`.

| Stage | Allowed | Forbidden (SES-R09) | Transition out |
|---|---|---|---|
| `INSPECTING` | Read storage, chain, index tables, release compatibility, evidence | Any other write; every action request | **Epoch activation**: `kernel.recovery` calls `LedgerWriter.activate_epoch()`, one transaction that retires the previous epoch and activates this one (legacy `epoch.activate`). The writer lock was already taken at open |
| `RECOVERY_WRITING` | Pending migrations (`MIGRATION_APPLIED`); D04 comparison and repair; outcomes rebuilt from published evidence; interrupted-attempt marking; validated reconciliation and recovery records; owed session closes (CUJ-SES-2); authorization continuity checks | Every action request (entry, cancel, modify, close), so no dispatch | `RECOVERY_ADVANCED` recorded by a human principal holding `recovery_advance`, after D04 is clean and gaps are recorded (A04-F1; A04-F2: no blanket automatic activation; see [Q-009](../decisions/owner-questions.md#q-009)) |
| `OPERATING` | Normal admission and dispatch | — | Back to `INSPECTING` on `LED-R05` (a detected index mismatch) |

* **Gaps** are anything recovery could not verify: an unresolved attempt, a missing evidence object, a grant without continuity evidence. They are recorded in `RECOVERY_STAGE` and do not block the advance on their own; the dependent checks still apply (`README.md:792`).
* **Authorization continuity** (REQ-SES-010): after a restore, each restored grant must be confirmed by `interfaces.authorization`'s authoritative store. An unconfirmed grant is invalidated with `GRANT_REVOKED` (reason `restore_unverified`). The owner root path re-establishes grants, so `recovery_advance` never depends on a restored grant.
* While no stage allows dispatch, broker-held stops are the only protection (A03-F5). The supervisor reports this ([runtime spec](runtime-isolation-observability-deployment.md)).
* Process liveness, repair access and send permission are three separate facts (`README.md:792`). Unrelated market warm-up is not a recovery gate.

## Failure modes and crash points

| CP | Crash or failure | Durable state | Required behaviour | Proof |
|---|---|---|---|---|
| CP-S1 | During `SESSION_CLOSED` commit | `OPEN` | Re-evaluated after restart; the state guard allows exactly one close event | PRF-SES-03 |
| CP-S2 | Between `SESSION_CLOSED` and the next trading date's `SESSION_OPENED` | `CLOSED` | New entries refused (`SES-R07`); every other action follows its own rules (CUJ-SES-4) | PRF-SES-03 |
| CP-S3 | During epoch activation | Previous epoch active, or none | Activation is one transaction; no half-activated epoch | PRF-SES-05 |
| F-S4 | Two processes start as writer | One holds the lock | The second gets `LED-R07` and writes nothing | PRF-SES-05 |
| F-S5 | Restore of a snapshot taken before a grant revocation | Restored grant looks valid | Without continuity evidence: `GRANT_REVOKED (restore_unverified)`; the owner root path re-establishes grants; consumed confirmations never revive | PRF-SES-06 |
| F-S6 | Wall clock jumps back 10 min | Deadlines in flight | Expired deadlines stay expired; `CLOCK_QUALITY` recorded | PRF-SES-04 |
| F-S7 | Calendar data unavailable at open | No session for the date | `SESSION_OPEN_FAILED`; no new entries; observation, reconciliation and protective actions continue | PRF-SES-03 |
| F-S8 | Calendar unavailable at close | Session `OPEN` | Closes at the `close_time` recorded at open | PRF-SES-03 |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Calendar data and version | Recorded exchange calendar (OpenAlgo calendar in legacy) | None: no session opens without it |
| Standing binding | Recorded by an authorized actor | None |
| `clock.jump_record_ms` | Proposed recording threshold (records only; gates nothing) | 1000 ms, labelled proposed |
| Routine-restart advance | [Q-009](../decisions/owner-questions.md#q-009) | A human `RECOVERY_ADVANCED` on every restart |

## Reuse evidence

**Authority service/channel/release/fence: wrap/extract** (`README.md:1145`). Verified at @445eb116:

| Legacy code | Use |
|---|---|
| `src/tier1/epoch.py:22` `activate()`, a single commit of state and events (`:54`) | CP-S3 and epoch activation |
| `src/tier1/ledger.py:83` `_lock()` and `Ledger.open(mode="writer")` | F-S4 |
| `src/tier1/recovery.py:117` `fence_refusal`, `:808` `fence()`, `:1060` `status()` | Recovery-stage evidence |
| `src/tier1/proposal_contract.py:140` `validate_proposal(..., granted_kind, granted_principal)` | Starting point for `authority.check` |

The legacy latch keyed per IST day (LD-04) keeps its behaviour for the shipped calendar. The session ID is new.

**Not reused:** process-start-as-session and in-memory session counters.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Session = process lifetime | A mid-session restart would reset session state (rejected by ATA-05) |
| Session derived from the calendar only, never recorded | The calendar would become activation authority (ATA-05) |
| An operator opens each session daily | Adds a daily manual workflow the legacy does not have; a standing binding keeps today's behaviour |
| A separate "closing" session state | Square-off is per strategy policy (protection), so the extra state had no effect of its own |
| Advance to `OPERATING` automatically when recovery finds no gaps | A blanket automatic activation, which A04-F2 forbids; raised as Q-009 instead |
| Persist the recovery stage | A restart must re-inspect anyway; persisting would let a crashed `OPERATING` resume without inspection |

## Proofs

| Proof | Class | Expected outcome | Break check |
|---|---|---|---|
| PRF-SES-01 | T `tests/unit/test_authority_grants.py` | Grant matrix: each code fires for its case in the stated order; validity bounds are inclusive start, exclusive end; a revocation between admission and dispatch refuses at dispatch; kernel principals have only their built-in actions | Checking only at admission fails |
| PRF-SES-02 | T `tests/unit/test_authority_grants.py` | A principal named in the payload but not authenticated gives SES-R01 | Trusting the payload passes |
| PRF-SES-03 | T `tests/recovery/test_session_transitions.py` | CUJ-SES-1/2/4, CP-S1/S2, F-S7/F-S8 give exactly the tabled events; a late start opens late; an admitted entry is refused at dispatch after close | A session check on non-entry actions fails |
| PRF-SES-04 | T `tests/unit/test_clock_contract.py` | Recorded and live clocks give identical deadline outcomes for the same advances; a backward jump revives nothing and expires nothing early | Wall-time expiry without `effective_now` fails |
| PRF-SES-05 | T `tests/recovery/test_restore_fencing.py` | Second writer refused (`LED-R07`); epoch activation atomic; `INSPECTING` writes nothing; `RECOVERY_WRITING` refuses every action request with `SES-R09`; no `OPERATING` without `RECOVERY_ADVANCED` | Removing the lock or stage check fails |
| PRF-SES-06 | T `tests/recovery/test_restore_fencing.py` | A restored pre-revocation grant is invalidated without continuity evidence; the owner root path still works | Accepting the snapshot grant fails |
| PRF-SES-07 | M (deployment) | Cross-host fencing: the old host cannot send after cutover | Operational; SLICE-14 |

## Open items

* [Q-001](../decisions/owner-questions.md#q-001): the hold reading (close effects for holds only).
* [Q-005](../decisions/owner-questions.md#q-005): first-release accounts and scope.
* [Q-009](../decisions/owner-questions.md#q-009): standing authorization for routine-restart advance.

## Delivery

* **SLICE-01:** `contracts/identity.py` (without `Grant`), `contracts/clock.py` and `adapters/clocks.py`.
* **SLICE-03:** authority, `Grant`, bindings, session transitions, the calendar port and recovery stages.

See [plan/delivery-plan.md](../plan/delivery-plan.md).
