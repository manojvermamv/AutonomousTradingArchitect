# SLICE-03 — Sessions, authority, clocks and recovery stages

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-03-review-2026-10-27)). Built once on 2026-10-27 in a local repository (commit `13a8115`, branch `slice-03`): 146 tests passed, including every SLICE-01 and SLICE-02 test, and every break check failed as required. That is a build record, not production acceptance.
* **Precedence:** the master README, then the master ROADMAP, then this package. This slice adds no decision; where the [sessions spec](../../design/sessions-authority-lifecycle.md) leaves an engineering gap, the choice is named here, and each deviation from it is marked **Deviation**. No money policy, score or threshold is set: refusing settings are bound only to labelled synthetic values in tests.
* **Phase:** master Phase 1 (ATA-05, A04-F1/F2 local, A06-F1 kernel side, Combined-F1, Combined-F4 kernel side). It adds no gate.
* **Environment class:** S (synthetic). Disarmed. The lease store and the release receipt are test fakes.
* **Builds on:** [SLICE-02](SLICE-02-ledger-integrity-evidence-reads.md) as built; branch `slice-03` cut from `slice-02`.
* **Owner answers applied:** Q-001, Q-009, Q-010, Q-014, X-005.
* **Proofs it completes:** PRF-SES-01, -03, -04, -05, -06, -09, -10; PRF-SES-02 and PRF-SES-08 in part (below).

**Excluded, and where each part arrives:**

| Not in SLICE-03 | Stand-in here | Arrives in |
|---|---|---|
| `interfaces.authorization` | A declared authentication table in the simulation composition; it never yields the owner or an in-process path, and owner authority comes only from the explicit `owner_auth`. PRF-SES-02 is therefore **partial** until SLICE-10 | SLICE-10 |
| Admission check A3 and dispatch row 4 | `lifecycle.entry_session_check(...)`, tested directly | SLICE-04, SLICE-05 |
| Latch and pause records keyed by session | The `session` table and `Sessions.open_session`; PRF-SES-08 completes with them | SLICE-04, SLICE-06 |
| Identity-rule retry branch; kill and hold events | Their grant actions and stage cells exist | SLICE-05, SLICE-06 |
| Lease store adapter; release receipt and bundle | `LeaseStore` protocol; `FakeLeaseStore` in `tests/conftest.py`; a synthetic receipt dict | SLICE-11 |
| Carried-leg continuity at session open | A hook that always passes | SLICE-06 |

## Files

The slice commit changes exactly these **30 paths** (in master README §6 or tree deltas T-07, T-08, T-09).

| Path | New or changed | What |
|---|---|---|
| `src/autonomous_trading/contracts/identity.py` | changed | `Principal` kind `service`; `Grant`; `StandingBinding`; `GRANT_ACTIONS`, `SERVICE_ACTIONS`; `is_hex_id` |
| `src/autonomous_trading/contracts/execution.py` | changed | `wire` for `Grant`, `StandingBinding` |
| `src/autonomous_trading/contracts/__init__.py` | changed | Re-exports |
| `src/autonomous_trading/adapters/clocks.py` | changed | `RecordedClock.jump_wall`; `ClockWatch` |
| `src/autonomous_trading/kernel/authority.py` | new | Authentication paths, stage table, grant rule, administration, bindings |
| `src/autonomous_trading/kernel/lifecycle.py` | changed | Session part; clock-ratchet helpers; `DISPATCH_REFUSED` transition |
| `src/autonomous_trading/kernel/recovery.py` | new | Stages, the fence rule, routine checks, send lease, operator entry points |
| `src/autonomous_trading/kernel/ports.py` | changed | Calendar port |
| `src/autonomous_trading/kernel/coordinator.py` | changed | A2; stage and grant recheck before the claim; `DISPATCH_REFUSED` |
| `src/autonomous_trading/kernel/admission.py` | changed | `grant_id`; SES codes map to `A2` |
| `src/autonomous_trading/kernel/ledger/store.py` | changed | New tables and kinds; quoted table names; `rows`, `ledger_id`, `latest_time`, `events_of`; `activate_epoch(restore, gap)` |
| `src/autonomous_trading/kernel/ledger/schema.py` | changed | Migration 2; the empty file takes the whole bundle |
| `src/autonomous_trading/kernel/ledger/projections.py` | changed | Four tables and their fold rules |
| `src/autonomous_trading/resources/migrations/002_sessions_authority.sql` | new | The four tables |
| `src/autonomous_trading/resources/events.schema.json` | changed | The new kinds |
| `src/autonomous_trading/resources/defaults.yaml` | changed | `binding.revocation_effect`, `clock.jump_record_ms` (both `null`) |
| `src/autonomous_trading/settings/schema.py`, `settings/loader.py` | changed | Two settings and their variables |
| `src/autonomous_trading/bootstrap.py` | changed | Builds and runs recovery |
| `src/autonomous_trading/operations/verification.py` | changed | Its composition advances and grants |
| `tests/conftest.py` | changed | Fakes, constants, `build`, `prepare` |
| `tests/unit/test_authority_grants.py` | new (T-07) | PRF-SES-01, -02 |
| `tests/recovery/test_session_transitions.py` | new (T-08) | PRF-SES-03, -08 part, -09 |
| `tests/unit/test_clock_contract.py` | changed (T-09) | PRF-SES-04 |
| `tests/recovery/test_restore_fencing.py` | changed | PRF-SES-05, -06, -10 |
| `tests/unit/test_policy_parameters.py` | changed | The new refusing setting |
| `tests/recovery/test_crash_boundaries.py`, `tests/recovery/test_projection_integrity.py`, `tests/integration/test_entry_outcomes.py`, `tests/unit/test_ledger_invariants.py` | changed | Event lists and the composition's setup only |

## Contracts and clocks

* `Principal.kind` ∈ `human`, `service`, `kernel`.
* `Grant(grant_id, principal, actions, accounts, valid_from, valid_until, parent_grant_id, delegation_limit)`: `grant_id` follows the `CommandKey` pattern; `actions` non-empty ⊆ `GRANT_ACTIONS`; a `service` principal may hold only `SERVICE_ACTIONS` (`entry`, `cancel`, `modify`, `close`), because safety controls and administration are human actions (Q-014); a `kernel` principal holds no grant; validity strings are `format_utc` form; `delegation_limit ≥ 0`.
* `StandingBinding(binding_id, scope, policy_binding_id, candidate_ids, first_date, last_date)`: IDs are 64-hex digests; `candidate_ids` sorted and unique; `first_date ≤ last_date`.
* Wire forms: `Grant` → its fields with `principal` as `[value, kind]`, `actions` sorted, `accounts` sorted wire accounts; `StandingBinding` → its fields with `scope` as wire.
* `RecordedClock.jump_wall(ms)` moves only the wall reading. `ClockWatch(clock, threshold_ms)`: the first `observe()` only stores; later calls return `{"kind": backward_jump | forward_jump, wall_delta_ms, monotonic_delta_ms, detected_at}` when `|wall − monotonic| > threshold_ms`; `threshold_ms` `None` never reports.

## `kernel/authority.py`

```text
Authenticated(principal, path: owner_credential | operator_credential | local_channel | in_process)
Allowed(grant_id)
Authority(writer, clock, *, owner, stage: Callable[[], str], lease_hook=None)
    check(verb, auth, account, *, use=None)   recheck(grant_id, verb, account)
    issue(auth, grant)   revoke(auth, grant_id, reason)   _revoke_unverified(grant_id)   # the last: kernel.recovery only
    authorize_binding(auth, binding)   revoke_binding(auth, binding_id, reason)   validate_binding(scope, date)
    bound_accounts()     # accounts of unrevoked bindings
    lease_accounts()     # accounts of every binding ever authorized (the send-lease set)
```

* **Paths (SES-R01):** `owner_credential` only for the configured owner; `operator_credential` for other humans; `local_channel` for services; `in_process` for kernel principals.
* **Stage (SES-R09):** `ACTIONS_PER_STAGE` encodes the sessions spec table; `grant_admin` is checked as `grant_admin:issue` (needs `OPERATING`) or `grant_admin:revoke` (`RECOVERY_WRITING` or `OPERATING`) through the `use` argument. Everything is refused in `INSPECTING` and in `STOPPED`.
* **Order:** paths; stage; owner root (`Allowed("owner-root")`); kernel built-ins (`builtin:<value>`; an unknown kernel value or verb gives `SES-R02`); otherwise the grant rule: collect by principal, verb and account (`account=None` for whole-ledger actions); a grant passes when unrevoked, in its window on the **ratchet**, and its parent passes and contains it (actions, accounts, window — a child with no end under a bounded parent fails — and a smaller `delegation_limit`); lowest passing `grant_id` wins; otherwise the furthest failure (`R05 > R04 > R03`) with ties to the lowest ID.
* **`recheck`:** owner root and built-ins pass; otherwise exactly the admitted grant, by the same tests. No other grant substitutes.
* **Issue:** needs `grant_admin:issue` for every account of the grant. **Only the owner root issues a grant with no parent**; anyone else delegates from a parent they hold (it passes, contains the child, and has `delegation_limit ≥ 1`), so revoking an issuer's grant invalidates what it issued. Violations give `SES-R05`.
* **Revoke:** needs `grant_admin:revoke`; only the grant's issuer or the owner. The issuer is compared by principal value (principals are unique by value in a deployment; the kind is not stored, a recorded limit).
* **Bindings:** `authorize_binding` needs `binding_authorize` and, for an account not yet in `lease_accounts()`, takes its lease first through `lease_hook` (`SES-R10` when held). `validate_binding` returns the unrevoked binding with the highest `authorized_sequence` covering the scope and date, else `SES-R08`.

## `kernel/lifecycle.py`

* **`effective_now(writer, clock)`** = the later of `clock.now()` and `writer.latest_time(domain)`, where `latest_time` is the **maximum** `event_time` ever recorded in that clock domain (`recorded` behaves like `wall`), so a write after a backward jump never lowers it.
* **`restart_deadline_expired(origin, budget_ms, writer, clock)`** judges on `effective_now`.
* **`Sessions.evaluate(stage)`:** nothing in `INSPECTING` or `STOPPED`. Closes every `OPEN` session whose `close_time ≤ effective_now` (`calendar_close` in `OPERATING`, `closed_in_recovery` in `RECOVERY_WRITING`; `closed_at` = the recorded close). Opens only in `OPERATING` with a calendar, over **every scope ever bound** (so a scope whose binding was revoked records `SES-R08` once): skip an existing session; else `validate_binding` (`SES-R08`), calendar (`holiday`, `calendar_unavailable`), the open window on wall now, the continuity hook when the binding changed; else `SESSION_OPENED`. Each `SESSION_OPEN_FAILED` once per scope, date and reason.
* **`entry_session_check(writer, clock, session_id, candidate_id, revocation_effect)`:** `SES-R07` unless the row is `OPEN` **and** its `close_time` is after `effective_now` (an entry past the close is refused even before the tick records it); `SES-R07` when the binding is revoked under `stop_entries`; `ADM-R14` for an unbound candidate.

## `kernel/recovery.py`

```text
Lease(holder_ledger, holder_epoch, head_sequence, head_hash, renewed_at, expires_at, released)
LeaseStore: now() / read(account) / cas(account, expected, new)
FenceEvidence(...), RestoreMarker(source_backup, old_host), RecoveryGap(last_restored_sequence, lost_from, lost_to)
Recovery(writer, clock, *, authority, sessions, coordinator, leases, receipt, restore=None, gap=None,
         confirm_grant=None, clock_watch=None)
    run() advance(auth) record_fence(auth, evidence) tick() shutdown(clean) fence_needed() routine_failures() lease_hook(account)
```

### `run()`

`INSPECTING` writes nothing. Then: activation (one transaction: `EPOCH_ACTIVATED` with the restore marker, `RECOVERY_GAP`, the empty file's `MIGRATION_APPLIED` events, `RUNTIME_OPENED`), stage `RECOVERY_WRITING`; step 1 pending migrations; step 2 D04 and repair; **then `RELEASE_BOUND`** when the receipt's digest differs from the latest recorded one; step 3 `coordinator.recover()`; step 4 `sessions.evaluate("RECOVERY_WRITING")`; step 5 restore continuity; step 6 the unverified list; the routine attempt. A refusal in any step raises `WriterLost`.

* **Deviation (release binding):** the sessions spec records `RELEASE_BOUND` in the activation transaction. Here it is its own transaction after D04 and any repair, because a pending migration may create `release_binding` and D04 must precede every other write. Its `binding_id` is `"release-<epoch_id>"`, one per epoch, so a return to an earlier receipt is a new row.
* **Restore continuity:** runs while any restore-marked `EPOCH_ACTIVATED` has no later advance (an advance needs a finished run), so an interrupted check resumes on the next start even without a restore marker (CP-S4). Each grant `confirm_grant` does not confirm gets `GRANT_REVOKED` (`restore_unverified`, principal `kernel:recovery`), each its own transaction.
* **Unverified items:** `attempt:<id>` for `CLAIMED` or `AMBIGUOUS` attempts; `evidence:<id>` for this epoch's `evidence_unusable` outcomes; `grant:<id>` for this epoch's `restore_unverified` revocations.

### Fence rule

`fence_needed()` lists each owing event with no `OLD_HOST_FENCED` after it **naming the right host**: a restore-marked activation owes a fence naming the marker's `old_host`; a host change owes one naming the previous `host_id`; a `RECOVERY_GAP` accepts any later fence.

### Routine checks (all evaluated; the decline lists every failure)

| # | Holds when |
|---|---|
| 1 | The current receipt's `recovery.routine_advance` is `standing` |
| 2 | A previous epoch exists and an advance was recorded in it |
| 3 | No restore marker, a previous `EPOCH_ACTIVATED` exists, and the `host_id`s match |
| 4 | `fence_needed()` is empty |
| 5 | A previous advance exists; this epoch recorded no `INDEX_REPAIRED` or `MIGRATION_APPLIED`; the current receipt digest equals the one recorded before the previous advance |
| 6 | A lease store is configured (none → fails), and for every account in `lease_accounts()` the lease names this ledger and the previous epoch, was released `clean` or expired unreleased, and its head is in the file |
| 7 | No `evidence:` unverified item |
| 8 | Fewer than `recovery.routine_advance_limit` routine advances in the 24 h before `effective_now` |

Expected decline lists, as built: a fresh ledger declines `[2, 3, 5]` (the first `RECOVERY_STAGE` of `FRESH`, before the owner's advance); setting `human` with a new receipt `[1, 5]`, with the same receipt `[1]`; previous epoch never operated `[2, 5]`; restore marker `[3, 4]`; other host `[3, 4]`; unfenced gap `[4]`; repair, migration or new receipt `[5]`; lease unexpired, `abnormal`, of another ledger, or with its head missing `[6]`; missing evidence `[7]`; limit reached `[8]`.

### Send lease

* **Lease accounts** are those of every binding ever authorized: every obligation's account is among them, because an entry needs a session and a session needs a binding. **Deviation:** the sessions spec says "bound accounts"; a revoked binding with exposure left would otherwise drop out of the lease.
* **Take:** needs a store and `recovery.lease_secs` and `recovery.lease_renew_secs` from the receipt with `renew < lease`, else `SES-R10`. A human takes a lease that is absent, released, expired, its own (this ledger and epoch), or named in this epoch's `OLD_HOST_FENCED`; otherwise `SES-R10`. Any failed `cas` undoes the leases already taken.
* **Renew:** scheduled on the monotonic clock (`clock.elapsed()`), so a wall jump never delays it; a `cas` showing another holder sets `STOPPED` and raises `LeaseLost`; an unreachable store appends `lease_store_unreachable` to `alerts`.
* **Shutdown:** `clean` only when the caller says so **and** the writer has not failed; the kernel calls `shutdown(False)` on `WriterLost`, `LeaseLost` and `CommitFailed` exits.
* With no store: no routine advance; a human advance succeeds only when there are no lease accounts.

### Operator entry points

`advance(auth)` and `record_fence(auth, evidence)` need stage `RECOVERY_WRITING`, a **human** principal (`SES-R02` otherwise) and `recovery_advance` for every lease account. `advance` also needs D04 clean (`LED-R05`) and no owed fence (`SES-R09`, message `fence_required`), then takes the leases. An identical `OLD_HOST_FENCED` already recorded in this epoch is refused `LED-R09`.

## Coordinator and admission

* **A2**, after the identity pre-check: `auth` from the call, or from `authenticate(request.principal)`, which never yields the owner or `in_process`. A missing `auth` or one whose principal differs from the request's is `SES-R01`. A refusal is recorded `ADMISSION_REFUSED` with `inputs.check = "A2"`. The `Allowed.grant_id` is recorded in `dependencies.grant_id`.
* **Before the claim:** `revalidate_hook` (the test seam), then `SES-R09` unless the recovery stage is `OPERATING`, then `authority.recheck(grant_id, ...)`. A refusal commits `DISPATCH_REFUSED {code, dependency: "stage" | "grant"}`: command `REFUSED`, reservation `RELEASED`.

## Ledger

* Migration `002_sessions_authority.sql`: `"grant"`, `standing_binding`, `session` (with the partial unique index `session_one_open` on `(account, calendar_id) WHERE state = 'OPEN'`), `release_binding`; columns as in the build. Table names are quoted in every generated statement.
* **Empty file:** `apply_migrations` runs the whole bundle in one transaction; activation records `MIGRATION_APPLIED` for every bundled migration only when the ledger has **no** `MIGRATION_APPLIED` event, so a non-empty ledger never records a migration it has not run.
* Fold rules: grant and binding issue/revoke (a repeat is `TransitionNotAllowed`); `SESSION_OPENED` refuses an existing session ID or another `OPEN` row for the scope (I-S1); `SESSION_CLOSED` only from `OPEN`; `RELEASE_BOUND` inserts; `DISPATCH_REFUSED` moves the command and releases the reservation; the recovery and clock events fold to nothing. I-S3 (no open without a covering binding) is enforced by `Sessions`, not by the fold.

## Settings and bootstrap

* `Settings(ledger_path, capacity_synthetic_amount, binding_revocation_effect=None, clock_jump_record_ms=None)`. `AT_BINDING_REVOCATION_EFFECT` must be `stop_entries`; `AT_CLOCK_JUMP_RECORD_MS` a positive integer. The composition refuses an unbound `binding.revocation_effect` (after capacity); `clock.jump_record_ms` stays optional.
* `compose_simulation(..., owner, authenticated, leases, receipt, calendar, restore, gap, confirm_grant)` builds the authority (its `stage` and `lease_hook` bound late to the recovery), the sessions, the coordinator and the recovery, then runs `recovery.run()`; any failure closes the writer. `Composition` gains `report`, `authority`, `sessions`, `recovery`, `owner_auth`.

## Test support (`tests/conftest.py`)

* `OWNER`, `TEST_PRINCIPAL`, `ACCT`, `AUTHENTICATED = {"test-principal": "operator_credential"}`, `RECEIPT` (synthetic: `standing`, limit 3, lease 30 s, renew 10 s), `IST` as a fixed `+05:30` offset (Windows has no timezone database).
* `FakeLeaseStore(start_iso)` keeps its own `RecordedClock`; `fail = True` makes `cas` raise. One `lease_store` per test, shared by every composition the test builds.
* `FakeCalendar(days)`; `FakeCalendar.day(date)` gives 09:15–15:30 IST.
* `build(ledger, steps, clock, ...)` composes as the fixture and the crash-test child do; `prepare(comp)` lets the owner advance a waiting recovery and issue `g-test` once. The `simulation` factory takes `clock=`, `leases=`, `advance=`, `grant=` and composition arguments.
* `FRESH` = activation (4 events), `RELEASE_BOUND`, the routine decline, the owner's advance, `GRANT_ISSUED`; `REOPEN` = `EPOCH_ACTIVATED, RUNTIME_OPENED`; `ADVANCED` = the reopen's own routine advance. A reopen is `REOPEN + recovered outcomes + ADVANCED`.

## Tests (as built)

| File | Cases |
|---|---|
| `test_authority_grants.py` | Unauthenticated paths; the payload principal not trusted; scope; revoked plus expired; deterministic choice; delegation (wider, deeper, rootless, revoked parent); service grants trading only; every stage cell; kernel built-ins; CUJ-SES-3 with a second covering grant `g-zz-other`; the claim needs `OPERATING`; A2 recorded; `grant_id` recorded |
| `test_session_transitions.py` | Opens in `OPERATING` only; late start; CUJ-SES-1; CUJ-SES-2; no open in `RECOVERY_WRITING`; close before open across a day; F-S9; F-S8; holiday; unbound date; binding mid-session; I-S1; `entry_session_check`; refused past the close before the tick; the session key; CP-S1; a backward jump does not keep a session open; CUJ-SES-4 |
| `test_clock_contract.py` | Jump reports; in-process deadlines ignore jumps; restart deadline not extended; grant no revival after a write following a backward jump; `CLOCK_QUALITY` by tick |
| `test_restore_fencing.py` | `INSPECTING` writes nothing; CP-S3; the `human` setting; the routine advance; 14 decline cases (lists above); a second ledger refused `SES-R10`; a clone refused while the original renews; lease lost stops; unreachable store alerts; a restore needs a fence naming the old host and carries the obligation; host change; same-host restart needs no fence; only a `recovery_advance` holder fences; restore revokes unverified grants; CP-S4 resumes |
| `test_policy_parameters.py` | `binding.revocation_effect` refusing; the two settings resolve and refuse malformed values |

**Break checks** (each tried on the build and reverted; every one failed its file):

| Change | File that fails |
|---|---|
| Skip the recheck before the claim; or accept any covering grant at the recheck; or trust the payload principal | `test_authority_grants.py` |
| Open sessions in `RECOVERY_WRITING`; or close on wall now instead of the ratchet | `test_session_transitions.py` |
| Remove the fence rule from `advance`; or skip routine check 6 | `test_restore_fencing.py` |
| Judge grant windows on `clock.now()` | `test_clock_contract.py` |

## Completion conditions

1. Every SLICE-01, -02 and -03 test passes in a clean virtual environment with no broker variables.
2. The slice commit changes exactly the 30 paths above.
3. Each break check was tried and reverted.

## Migration and rollback

* **Legacy data:** none. Migration `002` is provisional with `001` (X-002).
* **Rollback:** delete the `slice-03` branch.

## Prerequisites

SLICE-01, SLICE-02. No open owner question.
