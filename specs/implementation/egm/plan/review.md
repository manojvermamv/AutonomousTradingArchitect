# EGM stage 9 — delivery plan and SLICE-01

* **Targets:** [plan/delivery-plan.md](../../plan/delivery-plan.md) and [SLICE-01](../../plan/slices/SLICE-01-disarmed-financial-core.md) (DetailedRange: both whole files).
* **Standard:** implementation-readiness (Zero-Decision Rule).
* **Reviewers (direct dispatch, fresh, read-only):** `egm:egm-implementation-readiness`, `egm:egm-codebase-details`, `egm:egm-style`.
* **Resolution codes:** FIX (applied), CONTEST (kept, with evidence), Q/X (raised for the owner).

## Round 1 (2026-10-26)

Counts: implementation readiness 5 Blocker, 22 Major, 17 Nit; codebase details 1 Blocker, 18 Major, 12 Nit; style 1 Blocker, 27 Major, 23 Nit. Many findings overlapped; they are merged below. SLICE-01 was rewritten as a whole to resolve them.

### Blockers

| # | Reviewer | Finding (short) | Resolution |
|---|---|---|---|
| 9-B1 | readiness, codebase | Payload schema and its validator undefined; a JSON Schema dependency would have to be chosen | FIX: `events.schema.json` is a declared field list (format given in full), checked by stdlib `validate_payload`; no new dependency |
| 9-B2 | readiness, codebase | Envelope columns, hash input and time format undefined | FIX: column-by-column table; payload enters the envelope as an object; `uuid4().hex` IDs; RFC 3339 `…Z` format; wire forms for every contract type |
| 9-B3 | readiness | Crash and commit-failure harness unbuildable | FIX: the crash test module doubles as the subprocess driver (argv stated); crash points use the ledger spec's meanings with CP-L3a/b sub-cases; commit failure uses the legacy fault VFS through `connect(vfs=)` |
| 9-B4 | readiness | Settings, composition and fixtures unspecified | FIX: `Settings` fields, resolver order, env names, `test` profile, `compose_simulation` steps, `Composition` fields, every fixture's return value |
| 9-B5 | readiness | `transact` API contradicts the ledger spec; refusal mechanism undefined | FIX: the ledger spec's `Decision`/`StateGuard`/`Committed`/`Existing`/`Refusal`/`CommitFailed` API adopted; steps 1–8 stated; `fold` built in SLICE-01 |
| 9-B6 | style | Raise versus return undefined for every refusal | FIX: a "Refusal convention" table; code and message stated separately; internal exceptions mapped inside `transact` |

### Majors (merged)

| # | Finding (short) | Resolution |
|---|---|---|
| 9-M1 | DDL omits ledger-spec columns; `ledger_meta` seeded instead of folded | FIX: columns added (nullable where unfilled); `ledger_meta` folded from `MIGRATION_APPLIED` |
| 9-M2 | Bootstrap order and transaction grouping; lost `MIGRATION_APPLIED` after a crash | FIX: `EPOCH_ACTIVATED`, `MIGRATION_APPLIED`, `RUNTIME_OPENED` in one transaction; "empty" means no events; the event is written on the next activation if missing |
| 9-M3 | Payloads diverge from the catalogue | FIX: every catalogue field present, with SLICE-01 values tabled; `reservation_after` used; leg object defined |
| 9-M4 | Serialization of contract types | FIX: wire-form table and a worked digest example |
| 9-M5 | `strategy` and `reservation_id` have no source | FIX: `strategy` on the application subset and in the fixture; `reservation_id = "<key>#R"` |
| 9-M6 | Crash-point IDs redefined; CP-L1 expectation ambiguous | FIX: spec meanings; exact event lists after reopen; CP-L1 retry and CP-L5 `Existing` tested |
| 9-M7 | `LED-R08` versus `LED-R09`; `REDUCED` state | FIX: transitions → `LED-R09`, I-3 → `LED-R08`; `REDUCED` removed |
| 9-M8 | Admission order and capacity code | FIX: A5, B5, B6 in the intent spec's order; reason `amount`; margin and worst-case terms deferred to TASK-S04-03 |
| 9-M9 | `LED-R01` unreachable | FIX: `command_key: CommandKey \| None`; tested with `None` |
| 9-M10 | Outcome construction and refused outcome commits | FIX: the ledger's Outcome rows; existing-command mapping; coordinator reaction per refusal; retry branch deferral stated |
| 9-M11 | Proofs owed by the design specs missing | FIX: PRF-DSP-12, PRF-SES-04 (T-09), PRF-XC-03 (T-19), PRF-ADM-05 retry cases, PRF-LED-01 chain recheck and break, PRF-LED-04 forced failure, PRF-LED-12 rows, PRF-LED-13 readback added; evidence-rebuild part deferred to SLICE-02 |
| 9-M12 | Simulated broker API contradicts the spec | FIX: `SimulatedBroker(ScriptResponder, clock, coverage)`, per-account consumption, `raise` step |
| 9-M13 | Tests need invented setup | FIX: each test's setup stated (digest recomputed; second command for capacity; broker wrappers) |
| 9-M14 | Repository undefined; git-status condition unmeetable | FIX: repository creation stated; `.gitignore` row; condition reworded |
| 9-M15 | `apsw` unpinned | FIX: `apsw>=3.51.3.0`, as legacy |
| 9-M16 | Test launcher interpreter and reuse | FIX: adapted from legacy `safe_pytest.py`; `sys.executable`; temp cleanup; what is not reused and why |
| 9-M17 | Types without modules or members | FIX: every type placed in a row; `close()` added |
| 9-M18…M22 | Delivery-plan proof and phase drift | FIX: plan rewritten from the spec Delivery tables; SLICE-01 relabelled Phase 1 (+2 minimal); build order stated |
| 9-M23 | Envelope field changes from legacy undocumented | FIX: LD-21 |
| 9-M24 | Money regex not canonical | FIX: `re.fullmatch` with ASCII digits, no leading zeros, no `-0.00`; `amount` positive |
| 9-M25 | Legacy reuse under-cited | FIX: runtime, envelope, ledger lock and transaction, epoch, fault VFS and test launcher cited with line ranges |
| 9-M26…M27 | Notation, ID-list forms, slices without tasks, open-items column, "projection" wording, bare legacy file names | FIX: notation key; full IDs; depth rule restated; "Open items" defined; "index-table rebuild"; full legacy paths |

### Nits

All FIX, except: none contested.

## Round 2 (2026-10-26) — J6 result

The rewritten SLICE-01 was re-reviewed by fresh `egm:egm-implementation-readiness` and `egm:egm-codebase-details` reviewers.

| Reviewer | Blocker | Major | Nit |
|---|---|---|---|
| implementation readiness | **0** | 16 | 20 |
| codebase details | **0** | 11 | 12 |

**J6 (SLICE-01 passes stage 9 with 0 Blockers): met.** The codebase reviewer confirmed every cited legacy line range and README line, the DDL's validity, the APSW names and exception classes, and that an armed `xWrite` fault on a WAL database raises at `COMMIT` with nothing persisted.

All Majors were resolved by FIX in the same session:

| # | Finding (short) | Resolution |
|---|---|---|
| R2-1 | `ADM-R09` message contradicts the convention | FIX: stated exception — the message is the intent spec's reason (`amount` or `capacity_rule_unbound`) |
| R2-2 | Claim, refusal-record, `activate_epoch` and `recover` results ignored | FIX: each call site's handling of `Refusal` and `CommitFailed` stated |
| R2-3 | `outcome_refused` fallback underspecified; returned effect wrong | FIX: fallback draft fully specified; returns `ambiguous` |
| R2-4 | `recover()` payload and return values open | FIX: `legs` `[]`; the returned `Outcome` stated |
| R2-5 | Existing outcome's order IDs had no source | FIX: from the latest attempt's `legs` JSON |
| R2-6 | `reservation_head` had no API | FIX: `LedgerWriter.head()` |
| R2-7 | `EntryRequest` wire form missing | FIX: `COMMAND_ADMITTED.request` is the digest object itself |
| R2-8 | Evidence-ref form check undefined | FIX: step 4 rule and a PRF-LED-12 test |
| R2-9 | Lock leaked on exceptions; Windows lock not unlocked | FIX: release on any refusal or exception; explicit `LK_UNLCK`; parent directory created |
| R2-10 | `test_cp_l1` reopen script; driver could not reach the fixture | FIX: per-test reopen steps; `load_fixture_entry` plain function; driver `sys.path` rule, clock and capacity stated |
| R2-11 | Tests needed broker wrappers and a revalidate hook | FIX: `wrap`/`port`; `Coordinator.revalidate_hook` method |
| R2-12 | Retired-epoch and I-3 test setups not derivable | FIX: in-process setups and exact decisions (attempt 2) |
| R2-13 | PRF-LED-07 "admits once" branch unasserted | FIX: same-key retry after the injected admission failure |
| R2-14 | Deferred proof parts owned by no slice | FIX: remainders placed in SLICE-02, -04, -07 and -11 rows |
| R2-15 | `EventDraft` mutable default; `RUNTIME_OPENED` payload; `RecordedClock` naive parse; `Existing` inside an open transaction | FIX: tuple default; three identity keys; aware datetimes; `ROLLBACK` on every non-commit exit |
| R2-16 | Adapted test launcher dropped legacy protections | FIX: `--basetemp` last, on-disk temp with `TMPDIR`/`TMP`/`TEMP`, `parse_known_args`, Windows priority, legacy memory figure, non-colliding exit codes |

Nits: all FIX (integer revision compare, whole-file migration execute, disarm before close, fixture teardown, I-3 unchanged state, upsert order, base classes, label mapping, build-order checkpoints, stale row references in the ledger and execution-domain specs, completion condition wording, D02 phase citation).

## SLICE-02 review (2026-10-27)

The new [SLICE-02 slice file](../../plan/slices/SLICE-02-ledger-integrity-evidence-reads.md) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (direct dispatch, read-only), against the ledger, sessions, dispatch and execution-domain specs and the built SLICE-01 code. Design: 2 Blocker, 5 Major, 4 Nit. Readiness: 3 Blocker, 8 Major, 7 Nit. All resolved by FIX; the slice was then built (78 tests, every break check failing as required).

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-F1 | Blocker | Activation and pending migrations read index rows before D04 checks them; a tampered `migration_revision` or deleted active epoch row blocked repair forever | FIX: `retired_epoch_id` and `pending` come from the chain; fold refuses a second active epoch and skips a missing retired row; composition-path tamper tests |
| D-F2 | Blocker | Recovery could adopt another command's evidence (case-folding file names, stale records, no identity check) | FIX: digest-named attempt records naming their attempt; content carries `request_digest`; `recover()` adopts only exact matches, else `evidence_unusable` |
| D-F3 | Major | Windows rename durability and POSIX new-directory durability unbacked | FIX: `MoveFileExW` with write-through; parent `fsync` of each new directory; power-loss proof stated as not covered (SLICE-11) |
| D-F4 | Major | A commit between the `data_version` check and the lock went undetected | FIX: re-read after `BEGIN IMMEDIATE` |
| D-F5 | Major | `BEGIN` errors and unreadable evidence escaped without failing the writer | FIX: handled inside the transaction; `BusyError` → `external_change`, `OSError` → `evidence_unreadable`, both `LED-R10`; migrations share the error path |
| D-F6 | Major | D04 folded without verifying the chain; repair could adopt an edited event | FIX: `verify_chain` first; `chain_broken` and `events_unfoldable` are unrepairable `LED-R05` |
| D-F7 | Major | A torn object stayed forever; a torn record crashed recovery | FIX: rewrite on hash mismatch; unreadable record → `EvidenceMissing` → `evidence_unusable` |
| D-F8 | Nit | Possible `data_version` false positives | FIX by measurement: readers and `PASSIVE` checkpoints do not change it; an outside `TRUNCATE` does and is treated as external (only the writer may truncate); two tests |
| D-F9 | Nit | Migration text could end the writer's transaction | FIX: `refuse_transaction_control`; index-column changes ship with their fold change |
| D-F10 | Nit | Anchor checked at open, not activation | FIX: named as a deliberate, stricter deviation |
| D-F11 | Nit | `evidence_unpublished` order IDs outside `broker_identity`; `published_at` on republish | FIX: gap recorded until SLICE-07; republish rule stated |
| R-B1 | Blocker | `test_reservation_cannot_go_back` breaks under the external-write check | FIX: reworked (close, side edit, hand-opened writer) |
| R-B2 | Blocker | `test_external_write_detected` could never see `WriterLost` | FIX: a `t1` refusal `LED-R03`, `LED-R05` or `LED-R10` raises `WriterLost` |
| R-B3 | Blocker | A failed composition left the writer lock held | FIX: the composition closes the writer on any failure |
| R-M1 | Major | Build step 1 broke activation's tuple unpacking | FIX: activation change moved into step 1 |
| R-M2 | Major | `pending` read the index; fold's `current` undefined | FIX: as D-F1; fold rule for a missing row |
| R-M3 | Major | A break check named the wrong test file | FIX: moved to `test_command_identity.py` |
| R-M4 | Major | The measurement function was underspecified | FIX: row 11 fixes keys, order IDs, values and closing |
| R-M5 | Major | The export test was not buildable as written | FIX: the child driver takes an optional key; ref rebuild rule stated |
| R-M6 | Major | Case-insensitive attempt names | FIX: as D-F2 |
| R-M7 | Major | `published_at` on republish undefined | FIX: as D-F11 |
| R-M8 | Major | Migration refusal behaviour unstated | FIX: returned, and the composition raises `WriterLost` |
| R-N1…N7 | Nit | Test setup and closing; the probe decision; step 0 on a failed writer; Hypothesis capacity; reader wrapping only in `LedgerReader`; implicit expectations; file count | FIX |

## SLICE-03 review (2026-10-27)

The new [SLICE-03 slice file](../../plan/slices/SLICE-03-sessions-authority-recovery.md) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the sessions, intent, dispatch and ledger specs, the owner answers and the built SLICE-02 code. Design: 4 Blocker, 11 Major, 6 Nit. Readiness: 5 Blocker, 12 Major, 3 Nit. Resolved by FIX except one CONTEST; the slice was then built (146 tests, every break check failing as required).

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | The ratchet used the newest event's time, so a write after a backward jump lowered it (grant revival, session kept open) | FIX: `latest_time` is the maximum `event_time` in the domain; the no-revival test writes after the jump |
| D-B2 | Blocker | The default authenticator could yield the owner or an in-process path from the payload principal | FIX: it never does; owner authority only through `owner_auth`; PRF-SES-02 marked partial until SLICE-10 |
| D-B3 | Blocker | A non-owner `grant_admin` holder could issue an unbounded root grant that survives its own revocation | FIX: only the owner root issues grants without a parent |
| D-B4 | Blocker | An interrupted restore continuity check was skipped on the next start | FIX: it runs while a restore-marked activation has no later advance |
| D-M1 | Major | Service principals could hold safety and administration actions; non-humans could advance or fence | FIX: `SERVICE_ACTIONS`; advance and fence need a human |
| D-M2 | Major | Check 6 passed with no lease store; a revoked binding's account left the lease set | FIX: no store fails check 6; the lease set is every account ever bound (deviation named) |
| D-M3 | Major | No-store behaviour of a human advance unstated | FIX: succeeds only with no lease accounts; otherwise `SES-R10` |
| D-M4 | Major | `RELEASE_BOUND` written before D04 | FIX: after D04 and repair (deviation named) |
| D-M5 | Major | A repeated receipt digest collided on the release binding key | FIX: `release-<epoch_id>` |
| D-M6 | Major | Renewal on wall time; renew interval not below the lease | FIX: monotonic scheduling; `renew < lease` required to take a lease |
| D-M7 | Major | `shutdown(clean)` trusted the caller | FIX: clean only when the writer has not failed |
| D-M8 | Major | A claim was possible outside `OPERATING` | FIX: `DISPATCH_REFUSED` `SES-R09` (dependency `stage`) before the claim |
| D-M9 | Major | Entries passed A3 between the close time and the next tick | FIX: `entry_session_check` refuses at or after the recorded close |
| D-M10 | Major | Activation might record a migration it had not run | CONTEST: it records migrations only when the ledger has no `MIGRATION_APPLIED` event (the empty-file path); now stated explicitly |
| D-M11, R-M1 | Major | `contracts/execution.py` missing from the file list; counts wrong | FIX: listed; 30 paths |
| D-N1…N6 | Nit | Own lease not takeable; scopes of revoked bindings never recorded `SES-R08`; a fence for any host cleared every obligation; containment of open-ended children; private restore revocation; unverified grants; late-bound stage; `STOPPED` | FIX (issuer kind not stored: recorded limit) |
| R-B1 | Blocker | The CUJ-SES-3 test's second grant sorted first | FIX: `g-zz-other` |
| R-B2 | Blocker | No way to start the clock before the open | FIX: `simulation(clock=...)`; tests state UTC times |
| R-B3 | Blocker | Lease store clock and sharing undefined | FIX: `FakeLeaseStore` keeps its own clock; one store per test |
| R-B4 | Blocker | Migration recording on a non-empty ledger | as D-M10 |
| R-B5 | Blocker | `Asia/Kolkata` needs `tzdata` on Windows | FIX: fixed `+05:30` offset |
| R-M2…M12 | Major | Command kinds, table keys, the `grant_admin` split, late wiring, decline lists, the second-ledger setup, restore test setup, older-test changes, the child driver, break checks that could not fail, mixed test details | FIX in the build and the rewritten slice file; the measurement count is now `7 + 3n` |
| R-N1…N3 | Nit | Prime the clock watch; hex IDs; repeated receipts | FIX |

## SLICE-04 review (2026-10-27)

The new [SLICE-04 slice file](../../plan/slices/SLICE-04-intent-to-admission.md) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the intent spec, the legacy capacity rule and the built SLICE-03 code. Design: 3 Blocker, 10 Major, 2 Nit. Readiness: 5 Blocker, 10 Major, 5 Nit. Step 1 is resolved by FIX (decisions written into the slice file and partly built, checkpoint `bac5777`); step 2's findings are resolved by deferring step 2 to its own deepening, as step 3.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | Stage B was not atomic with the commit, so a change after the checks could slip through | FIX: `Decision.precheck` runs stage B inside the transaction (built) |
| D-B2, R-B3 | Blocker | The caller chose the session a review is judged under; a review with no seen intent could not be judged | FIX: the intent is resolved from evidence by the review's own digest; `INTENT_SEEN` in the same transaction |
| D-B3, R-B1 | Blocker | `submit_entry(request, application, plan)` stayed public; its relation to `admit_entry` undefined | FIX: `_submit_admitted` private seam; `admit_entry` the only route; PRF-XC-02 capability test |
| R-B2 | Blocker | The planner port needed step-3 inputs | FIX: `plan(intent, view, policy, now)` until step 3; `FixturePlanner(result, on_plan)` |
| R-B4 | Blocker | Step 1's refusing settings were not listed | FIX: a nine-row settings table |
| R-B5 | Blocker | Step 2 underspecified | Deferred: step 2 is deepened after step 1 |
| D-M1…M4 | Major | Missing row margin counted zero; aggregate exposure dropped on unknown coverage; observation-contract drift and a broker `protective` flag; weak number validation | FIX (built): a missing field refuses; an empty book is flat only when complete; protective orders only from ledger protective commands; finite, non-negative numbers, positive amount |
| D-M5 | Major | Pause minutes bounds | FIX: int ≥ 1 or `None` |
| D-M6, R-M3, R-M5 | Major | A late review could overwrite a frozen application; the frozen deadline | FIX: first freeze wins; the deadline is added per admission |
| D-M7, R-M6 | Major | `record_intent` call site | FIX: right after A1 |
| D-M8, R-M8 | Major | `COMMAND_ADMITTED` incomplete; digests and ages | FIX: plan, resulting exposure, three observation digests, integer ages |
| D-M9 | Major | Missing view; future stamps; three observations | FIX: `ADM-R05`; ages ≥ 0; each observation checked |
| D-M10 | Major | Step 2 modify capital | Deferred with step 2 |
| R-M1 | Major | Capacity identities, statuses, sources | FIX: stated (as built) |
| R-M2 | Major | Which clock | FIX: stamps `clock.now()`; deadlines and pauses on `effective_now` (deviation named) |
| R-M4 | Major | `pause_id` | FIX: `"pause-" + review_id` |
| R-M7, R-M9, R-M10 | Major | Wire forms and test publishing; refusal records; evidence contract versions | FIX: the built contracts win; stage-B repeats recorded as `B:A2…B:A5` |
| D-1 | Nit | `REVIEW_DEADLINE_PASSED` missing from the ledger catalogue | FIX: added to the ledger spec's event catalogue |
| N | Nit | Proof list; T-25; naming; F-A7 wording; lineage equality | FIX: T-25 registered; lineage is exact equality; others in the slice text |
