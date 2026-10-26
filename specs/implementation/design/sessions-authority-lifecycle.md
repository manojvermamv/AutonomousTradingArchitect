# Sessions, authority and recovery stages

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/sessions-authority-lifecycle/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `contracts/identity.py` | [Identity contract](#identity-contract-contractsidentitypy) |
  | `kernel/authority.py` | [Grants and the authority check](#grants-and-the-authority-check-kernelauthoritypy) |
  | `kernel/lifecycle.py` (session part) | [Bindings and sessions](#bindings-and-sessions-kernellifecyclepy-session-part) |
  | `contracts/clock.py`, `adapters/clocks.py` | [Clock contract](#clock-contract-contractsclockpy-adaptersclockspy) |
  | `kernel/recovery.py` | [Recovery stages](#recovery-stages-kernelrecoverypy) |

* **Contributors:** `interfaces/authorization.py` authenticates human and service principals and carries grant requests ([security-and-operator](security-and-operator.md)). `operations/backup.py` and `restore.py` supply recovery-set evidence and anchored heads ([migration-recovery-rollback-continuity](migration-recovery-rollback-continuity.md)).
* **Commits through:** the atomic transaction in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md); epoch activation through `LedgerWriter.activate_epoch()` in the same spec.
* **Master anchors:** ATA-05 (`README.md:450`); Combined-F1 (`:786`); A04-F1/F2 (`:792-794`); A06-F1 and Combined-F4 (`:863`, `:359-366`); A07-F4 (`:891`); A02-F3 (`:905`); Combined-F6 (`:909`); A03-F5 (`:924`); D13 (`:758`); AUD-01 (`:754`); Financial session row (`:730`).
* **Terms:** see the [package glossary](../README.md#terms-used-across-the-specs). The kill switch (POL-002), hold (POL-003), daily-loss latch (POL-004) and AI-management pause (POL-027) are rows of the [policy inventory](../02-policy-inventory.md). **D04** is the ledger's comparison of index tables with event-derived state. A **standing binding** is a `BINDING_AUTHORIZED` record; a **policy binding** is the bound policy document it names; the **release binding** is the ledger's record of the installed bundle. Legacy paths are at `OA@445eb116`; LD-nn rows are in [legacy-divergence](../legacy-divergence.md).

## Overview

Before the kernel acts, it must know four things:

1. **Who is acting, and what they may do.** Grants, recorded in the ledger and checked by `kernel.authority` (A06-F1).
2. **Whether this process is the one writer, and whether the old owner is excluded.** The writer lock and the active epoch prove local exclusivity; fence evidence proves the old owner cannot send (A04-F2).
3. **Which financial session a new entry belongs to.** A canonical, scoped session whose transitions `kernel.lifecycle` records (ATA-05).
4. **What time it is, in which clock domain** (Combined-F1).

Recovery stages separate "the process is running" from "the process may send" (A04-F1).

## The problem

In the legacy system these facts are implicit:

* A "session" is whatever the systemd start, the driver's calendar check and the IST date say. The daily-loss latch is keyed by IST trading date (LD-04).
* A restart re-creates in-memory state.
* Wall-clock readings and bar stamps are mixed.

The master accepted scoped financial sessions owned by the kernel (ATA-05), explicit clock domains (Combined-F1) and staged recovery (A04-F1).

## Goals

1. Every financial action is checked against a current grant at admission, and the admitted grant is checked again at dispatch (A06-F1 with D13).
2. Exactly one process writes a given ledger on its host, proved by the lock and the epoch; a replacement on another host sends only after fence evidence (A04-F2).
3. New entries are scoped to one canonical financial session. A restart continues the open session and never invents a new one (ATA-05).
4. Protective and owner actions on existing exposure never depend on a session being open. Their own rules decide them (AUD-01, `README.md:754`, `:773`).
5. Timed rules use declared clock domains. Deadlines survive restart without reset or extension (Combined-F1).

## Non-goals

* First-release accounts or strategies ([Q-005](../decisions/owner-questions.md#q-005)).
* New emergency permissions or kill/latch matrix changes ([protection-and-safety](protection-and-safety.md)).
* Whether a standing authorization may advance routine restarts ([Q-009](../decisions/owner-questions.md#q-009)), and what revoking a binding mid-session does ([Q-010](../decisions/owner-questions.md#q-010)); RTO values (`README.md:333`).
* Cross-host fencing mechanisms themselves (operational; F9, `README.md:203`). This spec only requires their evidence.

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-SES-001 | Grants are checked for actor, action, account, validity, revocation and delegation at admission; the admitted grant is rechecked at dispatch | A06-F1 (`README.md:863`); D13 (`:758`) | PRF-SES-01, -02 |
| REQ-SES-002 | One active epoch per ledger. The writer lock and active-epoch check prove local exclusivity (`LED-R07`, `LED-R03`) | A04-F2 (`README.md:794`); F9 (`:203`) | PRF-SES-05 |
| REQ-SES-003 | Canonical scoped financial session: identity, scope, calendar version, bindings and transition evidence | ATA-05 (`README.md:450`); Financial session row (`:730`) | PRF-SES-03 |
| REQ-SES-004 | A restart is not a new session. A session transition resets only the safety conditions an approved rule names, and never activates a staged binding implicitly | ATA-05 (`README.md:450`) | PRF-SES-03 |
| REQ-SES-005 | Session-scoped safety state (daily-loss latch, AI-management pause) is keyed by the canonical session | POL-004, POL-027; LD-04 | PRF-SES-08 |
| REQ-SES-006 | Clock contract: persisted times carry their domain and uncertainty; waits use a monotonic domain in process; deadlines persist origin and budget and are never extended; replay uses recorded clock advances | Combined-F1 (`README.md:786`) | PRF-SES-04 |
| REQ-SES-007 | Calendar and clock evidence trigger session transitions but grant no authority; the standing binding does | ATA-05 (`README.md:450`); `README.md:829` | PRF-SES-09 |
| REQ-SES-008 | Recovery stages: inspection, then exclusive recovery writing (never dispatches), then authorized operation; no blanket automatic activation | A04-F1 (`README.md:792`); A04-F2 (`:794`) | PRF-SES-05 |
| REQ-SES-009 | Proving old-owner exclusion is separate from resolving effects the old owner started; without that proof the replacement has no send authority | A04-F2 (`README.md:794`) | PRF-SES-10, PRF-SES-07 |
| REQ-SES-010 | After a restore, authorization is verified against its authoritative source, or the affected restored authorization is invalidated | Combined-F4 (`README.md:863`, `:365`) | PRF-SES-06 |
| REQ-SES-011 | A candidate or policy binding becomes effective only at a validated session opening | A07-F4 (`README.md:891`); A02-F3 (`:905`) | PRF-SES-09 |

## Critical user journeys

All times are IST (`Asia/Kolkata`). The NSE F&O calendar in the examples opens at 09:15 and closes at 15:30.

### CUJ-SES-1: Mid-session restart

* **Given:**
  * session `S` for scope `(acct-1, NSE-FO)` on 2026-11-02 is `OPEN`;
  * the daily-loss latch for strategy `X` in `S` is tripped;
  * one command is `UNCERTAIN`.
* **When** the kernel restarts at 11:20 on the same date, on the same host.
* **Then:**
  * the process starts in `INSPECTING`, activates its epoch into `RECOVERY_WRITING`, and waits there for a human `RECOVERY_ADVANCED` (A04-F2; [Q-009](../decisions/owner-questions.md#q-009));
  * while it waits, nothing is sent; broker-held stops remain the protection (A03-F5);
  * after the advance, the kernel continues in `S`; the latch stays tripped; the command stays `UNCERTAIN`; no session event is written (PRF-SES-03).

### CUJ-SES-2: Kernel down over the session close

* **Given** `S` (2026-11-02) is `OPEN`, and the kernel stops at 15:00. It returns at 09:05 on 2026-11-03, the next trading date.
* **When** recovery reaches its session step in `RECOVERY_WRITING`.
* **Then** lifecycle records `SESSION_CLOSED` for `S` with reason `closed_in_recovery` and `closed_at` set to the `close_time` recorded when `S` opened. In the same transaction it applies the approved close effects: the latch for `S` ends (POL-004); pauses in `S` end (POL-027); outstanding obligations and their protection carry over unchanged (Combined-F6). The session for 2026-11-03 opens only in `OPERATING`, at or after 09:15 (PRF-SES-03).

### CUJ-SES-3: Grant revoked between admission and dispatch

* **Given** an admitted command whose admission recorded grant `G` (version 4).
* **When** `GRANT_REVOKED` for `G` commits before the dispatch claim.
* **Then** the dispatch recheck of `G` returns `SES-R03` (`grant_revoked`), even if another grant would cover the action; the coordinator records `DISPATCH_REFUSED`, and the reservation is released (PRF-SES-01).

### CUJ-SES-4: Protective close after the session closed

* **Given** `S` is `CLOSED` and a position carried from `S` is open.
* **When** an authenticated owner closes it.
* **Then** admission does not require an open session for a close. The safety matrix and the grant decide (POL-002 still applies under kill) (PRF-SES-03).

### CUJ-SES-5: Restore on a new host

* **Given** the ledger is restored from backup onto a new host after the old host failed.
* **When** recovery reaches `RECOVERY_WRITING`.
* **Then** it records a recovery gap for the host change, and `RECOVERY_ADVANCED` is refused until `OLD_HOST_FENCED` is recorded after that gap (PRF-SES-10).

## Technical plan

### Identity contract (`contracts/identity.py`)

| Type | Fields | Rule |
|---|---|---|
| `AccountId` | `broker`, `account` | Preserved from legacy configuration until authority scope is confirmed (`README.md:724`) |
| `SessionScope` | `account_id`, `calendar_id` (exchange-segment calendar) | Fixed by this spec (ATA-05: scoped, no universal ID). Changing the scope's fields needs a recorded decision |
| `FinancialSessionId` | `scope`, `trading_date` (`YYYY-MM-DD` in the calendar's timezone) | One session per scope per trading date; written as `"<broker>:<account>:<calendar_id>:<trading_date>"` |
| `PolicyBindingId` | SHA-256 of the normalized policy document ([configuration spec](configuration-artifacts-release.md)) | Never changes once recorded |
| `CandidateId` | SHA-256 of the normalized candidate manifest ([research spec](research-rl-custody-promotion.md)) | Never changes once recorded |
| `CommandKey` | Caller-supplied string | REQ-LED-004 |
| `EpochId` | Non-empty string chosen at writer open | One active per ledger |
| `Principal` | `value`; `kind`: `human`, `service` or `kernel` | Never taken from a payload claim (`README.md:863`) |
| `Grant` | `grant_id`, `principal`, `actions`, `accounts`, `valid_from`, `valid_until`, `delegated_by`, `delegation_limit`, `version` | Shared by `interfaces.authorization` and `kernel.authority` (A06-F1) |

**Grant actions**, grouped:

* trading: `entry`, `cancel`, `modify`, `close`;
* safety controls: `kill_engage`, `kill_release`, `hold_engage`, `hold_release`, `latch_unlock`, `pause_clear`;
* administration: `binding_authorize`, `grant_admin`, `recovery_advance`.

For `recovery_advance`, which acts on the whole ledger, the grant's `accounts` must include every bound account.

**Principals:**

| Kind | Who | Authenticated by | Grants |
|---|---|---|---|
| `human` | The owner and delegated operators | `interfaces.authorization` | Recorded grants |
| `service` | Strategy workers and other processes outside the kernel | `interfaces.authorization` over the local authenticated channel (`adapters/unix_channel.py`) | Recorded grants, issued by a human with `grant_admin`; a strategy worker typically holds `entry` for its bound accounts |
| `kernel` | `kernel:protection`, `kernel:recovery`, `kernel:lifecycle` | In process, by construction | Built-in, defined in code, covering every bound account, never expiring or revocable; only the safety matrix limits them. `kernel:protection`: `cancel`, `modify`, `close`. `kernel:recovery`: `hold_engage`, and `hold_release` only if TASK-S06-03 shows the legacy recovery path releases holds itself. `kernel:lifecycle`: none (its session events are not action requests) |

### Grants and the authority check (`kernel/authority.py`)

* **Source.** Grants are ledger events. `kernel.authority` records `GRANT_ISSUED` and `GRANT_REVOKED`, folded into the `grant` index table (`grant_id` PK, the `Grant` fields, `revoked_sequence`, `parent_grant_id`).
* **Administration.** Only a principal holding `grant_admin` issues or revokes grants. A delegated grant may be issued only by the holder of its parent, within the parent's actions, accounts, validity window and `delegation_limit`. The issuer of a grant, or the owner, may revoke it.
* **Owner root.** The owner's root grant comes from the owner credential path in `interfaces.authorization` ([security-and-operator](security-and-operator.md)), not from another grant. The same path re-establishes grants after a restore (REQ-SES-010).
* **Revocation** takes effect at the ledger sequence of `GRANT_REVOKED`, not at a wall time. Revoking or expiring a grant invalidates every grant delegated from it.
* **Expiry** is judged against the clock contract's ratchet: a grant is in its window while `valid_from ≤ effective_now < valid_until`. A backward wall jump therefore never revives an expired grant; a forward jump can only expire one early, which refuses and never permits.

```text
authority.check(verb, principal, account, at: "admission") -> Allowed(grant_id, grant_version) | Refusal
authority.recheck(grant_id, grant_version, verb, account)   -> Allowed | Refusal      # at dispatch
authority.validate_binding(scope, trading_date) -> BindingRef(binding_id, policy_binding_id, candidate_ids) | Refusal
authority.writer_state() -> WriterState(lock_held: bool, writer_epoch, active_epoch)   # read from the ledger
```

`Refusal` is the ledger's `Refusal` type.

**`check` at admission.**

1. `SES-R01` (`unauthenticated_actor`) if the principal was not authenticated by its path in the principals table.
2. `SES-R09` (`recovery_stage`) if the current stage forbids the verb ([stage table](#actions-per-stage)).
3. Collect the principal's grants whose actions include the verb and whose accounts include the account. None: `SES-R02` (`grant_scope`).
4. A grant **passes** when it is not revoked, is in its window, and every ancestor also passes and contains it. If at least one passes, return `Allowed` for the passing grant with the highest `version`, ties broken by the lowest `grant_id`.
5. If none passes, test each collected grant's conditions in the order revoked, window, delegation, and return the code of the grant that got furthest: `SES-R03` (`grant_revoked`), `SES-R04` (`grant_expired`) or `SES-R05` (`delegation_exceeded`).

**`recheck` at dispatch** re-validates exactly the admitted grant: `SES-R03` if it was revoked, `SES-R04` if its window has closed, `SES-R05` if an ancestor no longer passes, and `SES-R02` if its `version` changed (the grant was narrowed). Another covering grant never substitutes for it.

Revocation affects only queued, unattempted work. It never retracts an effect already started or erases reconciliation duties (`README.md:863`).

### Bindings and sessions (`kernel/lifecycle.py`, session part)

#### Standing bindings

An actor holding `binding_authorize` records `BINDING_AUTHORIZED`: scope, policy binding ID, candidate IDs, and an inclusive range of trading dates. It is recorded once per binding change, not daily, and ended by `BINDING_REVOKED`. For a scope and date, the binding that applies is the **latest** unrevoked `BINDING_AUTHORIZED` whose range covers the date (index table `standing_binding`, keyed by `binding_id`, with scope, range and `revoked_sequence`).

* A standing binding recorded while a session is open is **staged**: it applies from the next `SESSION_OPENED` (REQ-SES-011).
* **The session's binding is the only source** that consumers use. Admission checks that the intent's candidate is in the session's `candidate_ids` and that the application's policy version is the session's `policy_binding_id` ([intent spec](intent-to-admission.md#admission-kerneladmissionpy)); dispatch compares against the same.
* What `BINDING_REVOKED` does to an open session is an owner choice (A07-F4 leaves revocation consequences to the owner, `README.md:891`): the refusing parameter `binding.revocation_effect` ([Q-010](../decisions/owner-questions.md#q-010)).
* The release binding (which installed bundle runs) is separate; both are checked, and neither implies the other.

#### Calendar port

```text
Calendar.trading_day(calendar_id, date) -> TradingDay(open_time, close_time, version) | Holiday | Unavailable
```

Times are exchange-domain timestamps in the calendar's timezone (IST for NSE), converted to UTC for storage.

#### Session transitions

| From | Event | To | When | Validated by |
|---|---|---|---|---|
| — | `SESSION_OPENED` | `OPEN` | In `OPERATING`: the clock is at or after the trading day's `open_time` and before its `close_time`, and no session exists for the scope and date. A late start opens late | `validate_binding`; carried-obligation continuity when a staged binding takes effect (below) |
| `OPEN` | `SESSION_CLOSED` | `CLOSED` | The clock reaches the `close_time` recorded at open: reason `calendar_close` when the kernel was `OPERATING` at that time, else `closed_in_recovery` | State guard: only from `OPEN` |
| — | `SESSION_OPEN_FAILED` | (none) | The calendar is unavailable, the date is a holiday inside a standing binding's range, `validate_binding` refuses, or the continuity check fails; recorded once per scope, date and reason | — |

* **Evaluation.** `kernel.lifecycle` evaluates sessions on every kernel tick: closes in `RECOVERY_WRITING` and `OPERATING`, opens only in `OPERATING`. In one evaluation it closes before it opens. While a date in a binding's range has no session and no holiday answer, each tick retries the calendar; the tick is the kernel's existing loop interval, not a new threshold.
* Because the close time is recorded at open, closing never needs the calendar again.
* **Clock for boundaries.** Boundaries are judged in the wall domain. While a forward clock jump is recorded and the host's time sync has not yet reported a known uncertainty, boundary transitions wait, so a jump cannot close a session early.
* **Continuity hook** (Combined-F6, `README.md:909`). When `SESSION_OPENED` would activate a staged binding, lifecycle first checks that every carried protected leg can still run its recorded ladder and policy versions ([protection spec](protection-and-safety.md), PRF-PRT-12; REQ-MIG-008). If not, it records `SESSION_OPEN_FAILED` with reason `continuity`.

#### Event catalogue

| Event | Decided by | Payload | Index effect |
|---|---|---|---|
| `BINDING_AUTHORIZED` | `kernel.authority` | `binding_id`, `scope`, `policy_binding_id`, `candidate_ids`, `first_date`, `last_date`, `principal` | `standing_binding` |
| `BINDING_REVOKED` | `kernel.authority` | `binding_id`, `principal`, `reason` | `standing_binding` |
| `GRANT_ISSUED` / `GRANT_REVOKED` | `kernel.authority` | the `Grant` fields / `grant_id`, `principal`, `reason` | `grant` |
| `SESSION_OPENED` | `kernel.lifecycle` | `session_id`, `scope`, `trading_date`, `calendar_version`, `open_time`, `close_time`, `opened_at`, `binding_id`, `policy_binding_id`, `candidate_ids` | `session` |
| `SESSION_CLOSED` | `kernel.lifecycle` | `session_id`, `reason`, `closed_at`, `effects` (the close-effect rows applied) | `session` |
| `SESSION_OPEN_FAILED` | `kernel.lifecycle` | `scope`, `trading_date`, `reason` (`calendar_unavailable`, `holiday`, `SES-R08`, `continuity`) | none |
| `RECOVERY_STAGE` | `kernel.recovery` | `from`, `to`, `principal` (for an advance), `gaps` | none |
| `OLD_HOST_FENCED` | `kernel.recovery`, on an owner command | old host `state` (stopped or isolated), `host`, `method`, `checked_at`; credential `rotated_at`, `attested_by`; a fresh book observation digest; `accounted` items (legacy `recovery.py:808-851`) | none |
| `CLOCK_QUALITY` | `kernel.recovery` (clock adapter) | `kind` (`backward_jump`, `forward_jump`), `wall_delta_ms`, `monotonic_delta_ms`, `detected_at` | none |

`RECOVERY_ADVANCED` is the `RECOVERY_STAGE` record whose `to` is `OPERATING`.

**`session` index table:** `session_id` (PK), `account`, `calendar_id`, `trading_date`, `state`, `binding_id`, `policy_binding_id`, `candidate_ids`, `close_time`, `opened_sequence`, `closed_sequence`. A partial unique index on (`account`, `calendar_id`) where `state = 'OPEN'` enforces I-S1. Exact DDL is written in the SLICE-03 slice file when that slice starts.

#### Close effects

Recorded in the same transaction as `SESSION_CLOSED`, only where an approved rule says so:

| State | At session close | Rule |
|---|---|---|
| Daily-loss latch for that session | Ends | POL-004 |
| AI-management pause in that session | Ends | POL-027 |
| Kill switch | Unchanged | POL-002 (no session expiry) |
| Holds | Unchanged | POL-003; [Q-001](../decisions/owner-questions.md#q-001) |
| Uncertain commands, open positions, protection | Carried unchanged | REQ-SES-004; Combined-F6 |
| Admitted entries not yet claimed | Refused at dispatch (revalidation row 4 of the [dispatch spec](dispatch-and-coordination.md#revalidation-at-dispatch-req-dsp-001), `SES-R07`) when they next become eligible, or at their deadline; the coordinator releases their reservations then | REQ-DSP-001 |
| Staged bindings | Take effect only at the next `SESSION_OPENED` | REQ-SES-011 |

Session-close **exits** (square-off) belong to `kernel.protection`, which runs them while the session is still `OPEN` (POL-010).

#### Which session an entry belongs to

* The **kernel** decides, not the request: the session is the `OPEN` session for the account and the calendar of the plan's instruments.
* Admission check A3 tests the request's `session_id` before planning ([intent spec](intent-to-admission.md#admission-kerneladmissionpy)); check B6 confirms after planning that all plan legs belong to that session's calendar. A plan whose legs span two calendars is refused (`ADM-R13`, stage `calendar`).
* Only new entries need an `OPEN` session (`SES-R07` at admission check A3 and at dispatch). Cancel, modify, close, owner actions, protection and reconciliation follow their own safety, grant and conflict rules.

#### Invariants

* **I-S1:** at most one `OPEN` session per scope.
* **I-S2:** every session-scoped safety record (latch, pause) names a `FinancialSessionId`.
* **I-S3:** no `SESSION_OPENED` without a standing binding that, at that sequence, covers the scope and date, is unrevoked, and is not staged.

Opening sessions automatically from a standing binding preserves the legacy behaviour: the desk starts each trading date from the calendar (production session calendar row, `README.md:1268`). This is a daily session transition, not financial activation after recovery.

### Clock contract (`contracts/clock.py`, `adapters/clocks.py`)

```text
Timestamp(utc_iso, domain: wall | exchange | recorded, uncertainty_ms: int | None)
Elapsed(monotonic_ns)                       # per-process origin; never persisted as a time of day
Deadline(origin: Timestamp (wall or recorded domain), budget_ms: int, started: Elapsed)
Clock.now() -> Timestamp ; Clock.elapsed() -> Elapsed
LiveClock     # now(): wall domain; elapsed(): time.monotonic_ns()
RecordedClock # now() and elapsed() advance only from a recorded list of (Timestamp, Elapsed) pairs
```

* `utc_iso` is RFC 3339 UTC with microseconds and `Z`. `uncertainty_ms` comes from the host's time-sync status when available; `None` means unknown. Exchange time comes from market data (bar stamps) and is never produced by `LiveClock`.
* **Deadlines in process** are judged on the monotonic clock: expired when `elapsed() − started ≥ budget`. A wall jump, in either direction, does not move them.
* **Deadlines after a restart** (the monotonic origin is gone): elapsed so far = `max(wall now, latest wall time recorded in the ledger) − origin`, with `origin` in the wall domain. This never extends a deadline; a forward jump across a restart can only expire one early, which refuses and never permits.
* **The ratchet** `effective_now = max(wall now, latest wall-domain event_time recorded in the ledger)` is used for grant windows and after restarts only, never for in-process deadlines.
* **Jumps.** On every kernel tick the clock adapter compares the wall delta with the monotonic delta since the previous tick. A difference above `clock.jump_record_ms` records `CLOCK_QUALITY`. It is a measured value with no shipped default; it records and gates nothing except the session-boundary wait above (`README.md:786`: no clock-health money gate).
* Ordering uses ledger sequence and causal IDs, never wall time alone.

### Recovery stages (`kernel/recovery.py`)

Every process start begins at `INSPECTING`. The stage is held in memory; each transition is recorded as `RECOVERY_STAGE`. A running kernel never re-enters an earlier stage: a detected external write or a failed commit makes it exit, and the restart begins at `INSPECTING`.

| Stage | Purpose | Leaves by |
|---|---|---|
| `INSPECTING` | Read storage, chain, index tables, release compatibility, evidence and the anchored head | Epoch activation |
| `RECOVERY_WRITING` | Make the ledger consistent and record what happened while down; no dispatch | `RECOVERY_ADVANCED` by a human |
| `OPERATING` | Normal admission and dispatch; the coordinator runs only here | Process exit |

* **`INSPECTING` → `RECOVERY_WRITING`.** `kernel.recovery` calls `LedgerWriter.activate_epoch()`: one transaction that retires the previous epoch and activates this one (legacy `epoch.activate`). The writer lock was taken at open. An anchored head, if supplied, is checked then (`LED-R11`).
* **`RECOVERY_WRITING` does these steps, in this order:**
  1. apply pending migrations (`MIGRATION_APPLIED`);
  2. run the D04 comparison and, on a mismatch, repair (`INDEX_REPAIRED`) before any other write;
  3. for each `CLAIMED` attempt, commit its outcome from the adapter result published under its `attempt_id`, or `OUTCOME_AMBIGUOUS` (reason `interrupted`) when none exists ([ledger CP-L3](ledger-and-atomic-transaction.md#failure-modes-and-crash-points));
  4. commit owed session closes (CUJ-SES-2);
  5. check authorization continuity after a restore (below);
  6. record gaps: anything recovery could not verify, such as an unresolved attempt, a missing evidence object, a grant without continuity evidence, a restore, or a host change.
* **`RECOVERY_WRITING` → `OPERATING`** (`RECOVERY_ADVANCED`). `kernel.recovery` records it only when all hold:
  * a human principal holds `recovery_advance` (`authority.check("recovery_advance", ...)`);
  * D04 is clean;
  * if this epoch follows a restore, a host change, or any recorded gap, `OLD_HOST_FENCED` is recorded after the latest such gap. This is the legacy fence rule (`OA/src/tier1/recovery.py:117-133`): without old-owner exclusion the replacement has no send authority (A04-F2).
  * A04-F2 also forbids blanket automatic activation; whether a narrower standing authorization may advance routine restarts is [Q-009](../decisions/owner-questions.md#q-009).
* **Authorization continuity** (REQ-SES-010). After a restore, each restored grant must be confirmed by `interfaces.authorization`'s authoritative store. For each unconfirmed grant, `kernel.recovery` records `GRANT_REVOKED` (reason `restore_unverified`), which also invalidates grants delegated from it. The owner root path re-establishes grants, so `recovery_advance` never depends on a restored grant.
* While no stage dispatches, broker-held stops are the only protection (A03-F5); the supervisor reports this ([runtime spec](runtime-isolation-observability-deployment.md)).
* Process liveness, repair access and send permission are three separate facts (`README.md:792`). Unrelated market warm-up is not a recovery gate.

#### Actions per stage

| Action | `INSPECTING` | `RECOVERY_WRITING` | `OPERATING` |
|---|---|---|---|
| `entry`, `cancel`, `modify`, `close` | refused (`SES-R09`) | refused (`SES-R09`); the coordinator does not run, so admitted work waits | allowed |
| `kill_engage`, `hold_engage`, `grant_admin` (revoke only) | refused (no writes before activation) | allowed | allowed |
| `kill_release`, `hold_release`, `latch_unlock`, `pause_clear`, `binding_authorize`, `grant_admin` (issue) | refused | refused (`SES-R09`) | allowed |
| `recovery_advance` | refused | allowed | not applicable |

Restrictions can be added while recovering; permissions are widened only in `OPERATING`.

### Refusal codes

| Code | Meaning | Emitted by |
|---|---|---|
| `SES-R01` (`unauthenticated_actor`) | The principal was not authenticated by its path | `authority.check` |
| `SES-R02` (`grant_scope`) | No grant covers the verb and account, or the admitted grant was narrowed | `check`, `recheck` |
| `SES-R03` (`grant_revoked`) | The grant (or the admitted grant) is revoked | `check`, `recheck` |
| `SES-R04` (`grant_expired`) | The grant is outside its validity window | `check`, `recheck` |
| `SES-R05` (`delegation_exceeded`) | The delegation chain is broken or too deep | `check`, `recheck` |
| `SES-R07` (`session_not_open`) | A new entry with no `OPEN` session for its scope and date | Admission check A3 and dispatch row 4, from `kernel.lifecycle` state |
| `SES-R08` (`binding_not_authorized`) | No standing binding covers the scope and date | `validate_binding`, at session open |
| `SES-R09` (`recovery_stage`) | The current stage forbids the action | `authority.check` |

`SES-R06` is unused (its earlier meaning moved to the ledger's `LED-R07`).

## Failure modes and crash points

| ID | Crash or failure | Durable state | Required behaviour | Proof |
|---|---|---|---|---|
| CP-S1 | During `SESSION_CLOSED` commit | `OPEN` | Re-evaluated after restart; the state guard allows exactly one close event | PRF-SES-03 |
| CP-S2 | Between `SESSION_CLOSED` and the next trading date's `SESSION_OPENED` | `CLOSED` | New entries refused (`SES-R07`); every other action follows its own rules (CUJ-SES-4) | PRF-SES-03 |
| CP-S3 | During epoch activation | Previous epoch active, or none | Activation is one transaction; no half-activated epoch | PRF-SES-05 |
| CP-S4 | During restore-time grant invalidation | Some grants revoked | Each revocation is its own transaction; recovery repeats the check and finishes | PRF-SES-06 |
| F-S4 | Two processes start as writer | One holds the lock | The second gets `LED-R07` and writes nothing | PRF-SES-05 |
| F-S5 | Restore of a snapshot taken before a grant revocation | Restored grant looks valid | Without continuity evidence: `GRANT_REVOKED` (reason `restore_unverified`); consumed confirmations never revive | PRF-SES-06 |
| F-S6 | Wall clock jumps back 10 min | Deadlines in flight | In process: unaffected (monotonic); grants: no revival (ratchet); `CLOCK_QUALITY` recorded | PRF-SES-04 |
| F-S7 | Wall clock jumps forward 10 min | Deadlines and sessions | In process: unaffected; session boundaries wait for time sync; `CLOCK_QUALITY` recorded | PRF-SES-04 |
| F-S8 | Calendar data unavailable at open | No session for the date | `SESSION_OPEN_FAILED`; retried each tick; no new entries meanwhile; other actions continue | PRF-SES-03 |
| F-S9 | Calendar unavailable at close | Session `OPEN` | Closes at the `close_time` recorded at open | PRF-SES-03 |
| F-S10 | Holiday inside a binding's range; binding missing or revoked | No session | `SESSION_OPEN_FAILED` (`holiday` or `SES-R08`) | PRF-SES-09 |
| F-S11 | Restore or host change without fence evidence | `RECOVERY_WRITING` | `RECOVERY_ADVANCED` refused | PRF-SES-10 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| Cross-host exclusion cannot be proved by a local lock or epoch | Fence evidence (`OLD_HOST_FENCED`) is required before advance after any restore, host change or gap; the mechanism itself is operational (PRF-SES-07) |
| Every restart waits for a human advance, during which only broker-held stops protect positions | The supervisor alerts at once; [Q-009](../decisions/owner-questions.md#q-009) asks whether a narrower standing authorization is acceptable |
| Grant expiry uses a wall-clock ratchet | Errors only expire early, which refuses; revocation does not depend on wall time |
| A forward clock jump delays session boundaries until time sync recovers | Boundaries are rare and the wait is visible as a recorded `CLOCK_QUALITY` |
| Gaps do not block the advance on their own | The fence rule and the dependent checks (D04, reconciliation, admission) still apply; gaps are visible to the human who advances |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Calendar data and version | Recorded exchange calendar (OpenAlgo calendar in legacy) | None: no session opens without it |
| Standing binding | Recorded by an authorized actor | None |
| `binding.revocation_effect` | [Q-010](../decisions/owner-questions.md#q-010) | None: refusing parameter |
| `clock.jump_record_ms` | Measured | None: refusing parameter (records only) |
| Routine-restart advance | [Q-009](../decisions/owner-questions.md#q-009) | A human `RECOVERY_ADVANCED` on every restart |

## Reuse evidence

* **Reuse/harden** (`README.md:1145`), all under `OA/src/tier1/`:
  * `epoch.py` `activate()` (`:22`), a single commit of state and events (`:54`): epoch activation (CP-S3);
  * `ledger.py` `_lock()` (`:83`) and `Ledger.open(mode="writer")`: one writer (F-S4);
  * `recovery.py` `fence_refusal` (`:117-133`) and `fence()` (`:808-851`): the fence rule and its evidence; `status()` (`:1060`): stage evidence;
  * `proposal_contract.py` `validate_proposal(..., granted_kind, granted_principal)` (`:140`): starting point for `authority.check`.
* **Not reused:** process-start-as-session and in-memory session counters.
* **Divergences to keep in view:** LD-04 (the legacy latch keyed per IST date keeps its behaviour for the shipped calendar; the session ID is new).

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Session = process lifetime | A mid-session restart would reset session state (ATA-05) |
| Session derived from the calendar only, never recorded | The calendar would become activation authority (ATA-05) |
| An operator opens each session daily | Adds a daily manual workflow the legacy desk does not have; a standing binding keeps the legacy behaviour |
| A separate "closing" session state | Square-off is per strategy policy (protection), so the extra state had no effect of its own |
| Advance to `OPERATING` automatically when recovery finds no gaps | A blanket automatic activation, which A04-F2 forbids; raised as Q-009 |
| Persist the recovery stage | A restart must re-inspect anyway; persisting would let a process that crashed in `OPERATING` resume without inspection |
| Deadlines judged by a wall-clock ratchet in process | A backward jump would stretch a deadline's real duration |
| Revocation by `revoked_at` wall time | A backward jump would revive a revoked grant |
| Accept any covering grant at dispatch | A revoked grant's command would still be sent under a different grant |
| Session scope including the policy | One session per account and calendar keeps the latch and pause scope simple; the policy is recorded in the session and fixed for its life |

## Proofs

Class **T** is an automated test; **M** is a measurement. "Must fail if" names the defect the test must catch.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-SES-01 | T | `tests/unit/test_authority_grants.py` | Each check step fires for its case; a revoked G1 plus an expired G2 gives no `Allowed`; the grant choice is deterministic; CUJ-SES-3; a parent's revocation invalidates its children | authority is checked only at admission, or another grant substitutes at dispatch |
| PRF-SES-02 | T | `tests/unit/test_authority_grants.py` | A principal named in the payload but not authenticated gives `SES-R01`; kernel principals have only their built-in actions | the payload principal is trusted |
| PRF-SES-03 | T | `tests/recovery/test_session_transitions.py` | CUJ-SES-1, -2 and -4, CP-S1/S2, F-S8/F-S9 give exactly the tabled events; close before open; a late start opens late; the close reason is right | a session check applies to non-entry actions |
| PRF-SES-04 | T | `tests/unit/test_clock_contract.py` | Recorded and live clocks give identical deadline outcomes; backward and forward jumps leave in-process deadlines unchanged; after a restart no deadline is extended | a wall-clock ratchet is used in process |
| PRF-SES-05 | T | `tests/recovery/test_restore_fencing.py` | Second writer refused (`LED-R07`); activation atomic; `INSPECTING` writes nothing; the actions-per-stage table, cell by cell; no `OPERATING` without a human `RECOVERY_ADVANCED` | the lock or stage check is removed |
| PRF-SES-06 | T | `tests/recovery/test_restore_fencing.py` | A restored pre-revocation grant and its children are invalidated without continuity evidence; CP-S4 resumes; the owner root path still works | the snapshot grant is accepted |
| PRF-SES-07 | M | deployment record | Cross-host fencing: the old host cannot send after cutover | — (operational; SLICE-14) |
| PRF-SES-08 | T | `tests/recovery/test_session_transitions.py` | Latch and pause records carry the session ID (I-S2) and end at that session's close only | state is keyed by IST date |
| PRF-SES-09 | T | `tests/recovery/test_session_transitions.py` | A binding staged mid-session applies only at the next open; an unbound candidate is refused at admission; the calendar alone never opens a session without a binding (I-S3); I-S1 refuses a second open; F-S10 | a staged binding takes effect early |
| PRF-SES-10 | T | `tests/recovery/test_restore_fencing.py` | CUJ-SES-5 and F-S11: advance refused until `OLD_HOST_FENCED` follows the gap | a replacement advances without fence evidence |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-01 | `contracts/identity.py` (without `Grant`), `contracts/clock.py`, `adapters/clocks.py` | PRF-SES-04 (clock types only) |
| SLICE-03 | REQ-SES-001…011: authority, grants, bindings, sessions, the calendar port, the clock rules and recovery stages | PRF-SES-01…06, -08…10 |
| SLICE-14 | Cross-host fencing in the real deployment | PRF-SES-07 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
