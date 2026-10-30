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

## SLICE-04 step 2 review (2026-10-27)

After step 1 was built (OA_NEW `2ed1c39`), [step 2](../../plan/slices/SLICE-04-intent-to-admission.md#step-2--cancel-modify-and-close-admission) was deepened and reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the intent, ledger, protection, dispatch and execution-domain specs and the built code. Design: 2 Blocker, 6 Major, 5 Nit. Readiness: 0 Blocker, 7 Major, 6 Nit. The design reviewer could not run `git show`, so its note that the legacy citations were unverified was checked by hand: `execution_gateway/__init__.py:1292-1300` (modify moves resting protective legs only) and `:1356-1360` (a target cannot be moved as a stop) at `445eb116` say what the slice cites. All findings are resolved by FIX in the slice file; Q-018 stays the owner's.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | `conflicts.check(verb, account, underlying)` cannot express conflict rows 2, 3, 5 | FIX: `ConflictPort.check(facts: ActionFacts)`; entries pass `ActionFacts` too |
| D-B2 | Blocker | `safety.check(verb, auth, strategy)` cannot judge the kill exceptions; stage A has no observation | FIX: `SafetyPort.check(facts, auth)`; facts from the latest observation at A4, from the fresh one at B:A4, after B2 (deviation named) |
| D-M1 | Major | `prot:` rule only in the action door; an entry could look protective | FIX: `prot_key_check` at A1 of both doors; protective = SELL of a close or basket leg |
| D-M2 | Major | Two protective definitions (B2 vs capacity) | FIX: one `is_protective`; `managed_by_protection` separate; equals legacy's set on every legacy-reachable order |
| D-M3 | Major | A `prot:` key need not match the request | FIX: position and role must match, else `ADM-R01` |
| D-M4 | Major | Ownership field sources wrong; `position_id` null for entry orders | FIX: a source table; `underlying` added to `COMMAND_ADMITTED`; `position_id` never null; q = 0 before the first fill |
| D-M5 | Major | Instrument is not a unique position key | FIX: more than one row → `net` unknown → `broker_net_unknown` |
| D-M6 | Major | "Admitted, no attempt" read as the adapter's `not_sent` | FIX: a new row in the ledger spec's `Outcome` table (resend: no) |
| D-N1…N5 | Nit | Deadline key naming; `filled` needed only for quantity; principal on the `prot:` rule; exposure when unknown and identity mismatch; Q-018 scope and I-6 | FIX: naming deviation marked; `filled_unknown` only with `quantity`; principal equality plus A2; `null` exposure, `identity_mismatch`; Q-018 narrowed to one-leg entries, option B names `reservation_after` and I-6 |
| R-M1 | Major | Actions' busy check could never fire; its break check could not fail | FIX: no busy check for actions under `entries_only`; the break check now applies busy to an action |
| R-M2 | Major | Bootstrap wiring and `action_admission` missing | FIX: in the file list, as `entry_admission` |
| R-M3 | Major | `ADMISSION_REFUSED.verb` hard-coded `entry` | FIX: from `wire(request)["verb"]` |
| R-M4 | Major | Exposure and `effect` gaps | FIX: `null` exposure when unknown; `remaining: null`; unchanged fields copy `before`; `owned(p)` and `broker_net` |
| R-M5 | Major | `effect_check` had no signature | FIX: a pure function returning (reason, exposure, effect) |
| R-M6 | Major | The test grant covers `entry` only | FIX: a second grant `g-act` in the action fixture |
| R-M7 | Major | Capability rule unnamed | FIX: two `_BUILDERS` needles |
| R-N1…N6 | Nit | `holdings` field order; shape check placement; money format; duplicate rows; reason names and builders; principal equality | FIX: in the slice text |

## SLICE-04 step 3 review (2026-10-27)

[Step 3](../../plan/slices/SLICE-04-intent-to-admission.md#step-3--the-planning-port-one_leg_v1) was deepened from two line-by-line reads of the legacy planners at `OA@445eb116` (the reads' citations were spot-checked by hand at that commit, and four line numbers corrected), then reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only). Design: 1 Blocker, 10 Major, 4 Nit. Readiness: 2 Blocker, 8 Major, 6 Nit. Both reviewers read the legacy working tree, whose head only adds an empty test file on top of `445eb116`; the five design claims that decide the resolution were re-checked at the commit and hold. The owner answered Q-019 (option B, with A and C kept selectable) during the deepening. All findings are resolved by FIX; the structure-planner findings are resolved by moving `structure_v1` to its own step 4, with each finding listed there as a decision that step must make.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | The plan dropped `entry_premium` and the selection values protection's trail seeds from | FIX: `Plan.entry_facts`; intent spec contract, PRF-ADM-08 and the protection spec's first desire updated |
| R-B1 | Blocker | Golden fixture unspecified | FIX: schema pinned; generator source and digest embedded; target-form inputs plus the generator's own legacy rows; adapter judged against them |
| R-B2, D-M4, D-M5, D-M7, D-M8(b, c) | Blocker / Major | Structure templates untyped; `max_loss` and `strategy_family` misplaced; evidence checks wrongly called age checks; structure protection contradicts the per-leg spec; structure money figures | Step 4: `structure_v1` deepened before build, each finding named there; until then other structure ids refuse `structure_planner_not_built` |
| D-M1 | Major | Lot refusals' stage `quantity` vs the spec's `lot_size` | FIX: stage `lot_size` (spec, F-A4), named deviation from legacy |
| D-M2, R-M3 | Major | Reference facts without `known_at`; impure date conversion; text mapping | FIX: the market port applies legacy's in-force and known-at rule at the decision instant; `ReferenceMissing(reason)`; text mapping stated |
| D-M3 | Major | A reference tick legacy never read | FIX: removed; legacy's row-then-0.05 rule |
| D-M6, R-M2 | Major | Adapter keys and types | FIX: every key always emitted, types stated, delta and gamma included |
| D-M8(a) | Major | `ask` with `to_stop` never sanctioned | FIX: refused at construction |
| D-M9 | Major | Chain not tied to the aged view | FIX: `chain_mismatch` at the door |
| D-M10 | Major | Fixture could not judge the adapter | FIX: as R-B1 |
| R-M1 | Major | Policy types; `wire` of floats | FIX: legacy types listed; `wire` extended, `execution.py` in the files |
| R-M4 | Major | `BoundPolicy.planner` default | FIX: keyword `None`; `planner_policy_unbound` |
| R-M5 | Major | The planner object, read order, `AdmissionPorts.stats` | FIX: `kernel.planner.Planner`; the order stated; `test_policy_parameters.py` in the files |
| R-M6 | Major | Sandbox mechanics | FIX: imports first; the patched calls listed; a raising `datetime` stub |
| R-M7 | Major | Break checks that could not fail | FIX: each names the case that fails |
| R-M8, D-N2 | Major / Nit | Money and level string forms | FIX: `Decimal` on strings; `format(x, ".2f")` |
| D-N1, R-N3 | Nit | Exact strike text; INERT suffix | FIX: quoted exactly; suffix kept |
| D-N3, R-N5 | Nit | Snapshot shape and number forms | FIX: one expiry, as the market spec; flat-chain rows named there; forms stated |
| D-N4 | Nit | Score strings and `as_of` rendering | FIX: `repr` strings; `utc_iso`, a named text deviation |
| R-N1, R-N2, R-N4, R-N6 | Nit | `make_intent` default; `activate_at_max_pts`; `seconds_since_last_entry` type and the stats fixture; completion conditions | FIX |

## SLICE-04 step 4 review (2026-10-27)

[Step 4](../../plan/slices/SLICE-04-intent-to-admission.md#step-4--structure_v1) was deepened from the legacy structure path at `OA@445eb116` (an isolated export), after the owner answered Q-020 (option C, with A and B recorded), then reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only). Both read the export and confirmed the citations, apart from the anchor attribution fixed below. Design: 1 Blocker, 7 Major, 7 Nit. Readiness: 1 Blocker, 10 Major, 4 Nit. Neither found a way for a structure to be admitted. All findings are resolved by FIX.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | `max_loss` defaulted to `0.0`, turning a money gate off when unbound | FIX: `float \| None = None`; unbound refuses `planner_policy_unbound`; a bound `0.0` keeps legacy's "no limit"; break check added |
| R-B1, D-M6 | Blocker / Major | The golden harness had nothing to compare for passing structures | FIX: `resolve_structure` and `structure_loss` named, with `ResolvedLeg`; the fixture records legacy's legs and executable loss |
| D-M1, R-N1 | Major / Nit | BUY-only legs on two expiries classify `undefined` | FIX: claim corrected; a golden case added |
| D-M2 | Major | Declared evidence age and source were given to B1, which does not enforce them | FIX: the loader refuses them until SLICE-08; adopting Q-020 A or B needs SLICE-08's evidence |
| D-M3 | Major | Dropped fields left the loader and Q-020's options unbindable | FIX: the loader skips the `single_long_option` template; protection points kept as inert typed fields; `ResolvedLeg` carries LTP, delta and tick |
| D-M4 | Major | Unknown ids refused before the session gates, unlike legacy | FIX: legacy's order and text kept |
| D-M5, R-M5 | Major | Multi-expiry input and the read order | FIX: `dte` defined; empty → `chain_missing`; duplicate or mismatched → `chain_mismatch`; a structure skips `chain`; read order stated; market spec amended |
| D-M7, R-M9 | Major | Break checks that could not fail | FIX: tie, ATM-tie and LTP ≠ ask cases; the mismatch on the farther expiry |
| R-M1 | Major | `legacy_rows` without `expiry` and `dte` | FIX: always emitted; the 43 one-leg cases regenerated with them |
| R-M2, R-M3 | Major | Refusal types; untestable SELL and unsupported-key tests | FIX: `ValueError`; `opening_position` field; `CandidateRule.from_mapping` |
| R-M4, D-N1 | Major / Nit | Anchor check misattributed and moved | FIX: kept at resolution, lower-cased, as legacy |
| R-M6, R-M7 | Major | Fixture attribute shadowing; `wire` and the digest change | FIX: `expiry_chains`; `execution.py` in the files; digest change recorded |
| R-M8 | Major | The generator's legacy envelope and call | FIX: every field, the digest and the call stated |
| R-M10 | Major | The `None`-bias text cannot come from legacy | FIX: a named deviation with a unit test |
| D-N2 | Nit | Load-time refusal of a bad candidate key stopped the whole policy | FIX: unsupported keys refuse at resolution, as legacy; structural invalidity fails the whole policy, as legacy validation |
| D-N3, D-N4 | Nit | Structure lot rule; phase and cover text; PRF-ADM-09's structure clause | FIX: intent spec amended; the clause deferred |
| D-N5, D-N6, D-N7 | Nit | `to_stop` for structures; negative PE deltas under a delta rule; unbound planner before dispatch | FIX: `to_stop` refused for structures; carried to PRF-ADM-07; checked first |
| R-N2, R-N3, R-N4 | Nit | Two-expiry case; `KW_ONLY` and helpers; `dte` type | FIX |

## SLICE-05 review (2026-10-27)

The new [SLICE-05 slice file](../../plan/slices/SLICE-05-dispatch-conflicts-scheduling.md) (step 1 at decision depth; steps 2–3 scoped) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the protection, dispatch, ledger and sessions specs, the built SLICE-04 code and the legacy export at `OA@445eb116`. Design: 1 Blocker, 8 Major, 5 Nit. Readiness: 0 Blocker, 6 Major, 8 Nit. The design reviewer corrected the TASK-S05-07 characterization; the correction was checked by hand at `src/runtime/execution_gateway/__init__.py:1180-1182` and `:1702-1730`. All findings are resolved by FIX.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-B1 | Blocker | Read literally, row 2 or row 4 decided a close before rows 3 and 5 ran, so a market close passed with its stop resting | FIX: a row decides only when both its conditions hold; a break check added |
| D-M1 | Major | Row 2's modify exception also excepted a raise; unknown `q` unhandled | FIX: requires `sale_delta == 0`; unknown `q` voids the `q`-based exceptions |
| D-M2 | Major | Terminality from a live observation contradicts the never-inert visibility rule and could differ from B2's book | FIX: a named deviation; B3 uses B1's observation; SLICE-07 rebinds to durable ledger facts |
| D-M3 | Major | The holdings port's binding moved without comment | FIX: orders and capacity's protective set bound in step 3; positions in SLICE-07 |
| D-M4 | Major | "Legacy never checks fill state under kill" was false | FIX: the gateway's "resting and unfilled" rule; parity is open with remaining > 0 when known; `ActionFacts.remaining` |
| D-M5 | Major | PRF-PRT-04 clause coverage, CUJ-PRT-3 mislabelled, SLICE-06 clauses undeclared | FIX: clauses listed and deferred; CUJ-PRT-3's admission part; rows 1 and 5 in the proof's file |
| D-M6 | Major | A grant for one account could command the desk-wide kill | FIX: every bound account, as `recovery_advance` |
| D-M7 | Major | PRF-DSP-04's inert half needs SLICE-06 | FIX: deferred |
| D-N1…N5 | Nit | Table CHECKs block SLICE-06; row 4 "elsewhere"; setting naming and task IDs; break checks for blanket and per-target rules and the stalled-transport case; `auth=None` order and a citation | FIX |
| R-M1 | Major | `FixtureHoldings` dicts would shadow the new port methods | FIX: renamed `order_rows`, `position_rows`; methods filter by account |
| R-M2 | Major | Safety's commit path undefined | FIX: guards in the fold (`LED-R09`), as `PAUSE_CLEARED`; the return and raise rule stated |
| R-M3 | Major | Matrix "allowed" close cells unreachable with the kernel's conflicts | FIX: the matrix cells use a fixture conflict port; row interplay tested separately |
| R-M4 | Major | No way stated to create unresolved effects | FIX: the `unresolved(world, key, state)` helper |
| R-M5 | Major | A second hold reason could not be engaged in step 1 | FIX: the test appends a `recovery` `HOLD_ENGAGED`; any engaged reason may be released |
| R-M6 | Major | The "absent is not terminal" break check could not fail | FIX: a test with the stop missing from the observation |
| R-N1…N8 | Nit | Override wiring; the `unresolved_commands` read; payload types and principal column; setting fields and test settings; break-check assertion; `WORKING` stays unresolved; `version` input and refusal fields; port docstring | FIX |

## SLICE-05 step 2 review (2026-10-28)

[SLICE-05 step 2](../../plan/slices/SLICE-05-dispatch-conflicts-scheduling.md#step-2--the-coordinator-loop) (the coordinator loop) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the dispatch, ledger, protection, sessions and execution-domain specs, the code built through step 1 and the legacy export at `OA@445eb116`. Design: 0 Critical, 5 Major, 6 Minor. Readiness: 2 Critical, 10 Major, 4 Minor. The release deviation rested on a false reading of `kernel/recovery.py:169-175` (a same-bundle restart records no new binding) and was withdrawn. Every finding is resolved by FIX; the claims that changed the design were checked by hand in the code first.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| R-1 | Critical | `wire(Deadline)` drops the monotonic start, so neither deadline call could be computed | FIX: each door registers its `Deadline` in `coordinator.deadlines`; a missing entry with a persisted deadline is judged on the restart rule |
| R-2 | Critical | The seam records `release_binding_id: None`, so every seam dispatch would be refused `DSP-R02` | FIX: a `None` recorded ID skips row 2 |
| D-1, R-3 | Major | The release deviation's premise was false; its break check could never fail | FIX: compare binding IDs as the spec says; A → B → A refuses (stated); break check "skip row 2" |
| D-2, R-8 | Major | A0 (busy) runs before A1a, so a retry at the bound is refused and a lost reply gets "busy" | FIX: A1 and A1a first, then A0; a retry test at the bound and a break check |
| D-3 | Major | The wake flag could lose a return if cleared after draining | FIX: a `threading.Event` cleared before the drain; `wait_woken`; not break-checkable (stated) |
| D-4 | Major | No timer for deadlines of commands admitted by an earlier process | FIX: `next_wake` includes them, early never late |
| D-5, R-4 | Major | Nothing rebuilds the request and plan from the payload | FIX: `entry_request_from_wire`, `plan_ref_from_wire`; a digest check before the claim; mismatch exits before claiming |
| R-5 | Major | `DISPATCH_RETRY_REQUESTED` would not carry `command_key`; its family | FIX: in `_COMMAND_KINDS`, family `dispatch`; the fold's guards spelled out |
| R-6 | Major | `dispatch_inline` under SLICE-01 compositions and seam entries without `underlying` | FIX: hook, stage, rows 1–3; rows 4–5 only when composed; no eligibility or conflict check |
| R-7 | Major | Which safety and conflicts objects dispatch uses | FIX: taken from the admission ports after `replace`; dispatch tests use the kernel's |
| R-9 | Major | `test_review_semantics.py` missing; the in-flight probe would run on the worker thread | FIX: added to the files; the probe becomes `run_pass`, `wait_stalled`, assert, `release` |
| R-10 | Major | A second account would be refused at admission by the fixtures | FIX: `two_accounts=True` spelled out (session, binding, grant, loss limit, planner, intents) |
| R-11 | Major | No way to build an admission world in a crash child or reopen one | FIX: module-level `build_admission_world(..., reopen)`; the child sequence stated |
| R-12 | Major | The conflict-wait test was blocked by the busy worker, so its break check could not fail | FIX: the first entry scripted `ack`, so only the conflict holds the second |
| D-6…D-11 | Minor | Adapter-error flag and hand-off time; `dispatch_inline` with a busy worker; `ADM-R14` in row 4 and the stage row's scope; step 3's action facts; the stall outside `take`'s lock and per-step accounts; a failed claim and the actions' `DSP-R01` record | FIX |
| R-13…R-16 | Minor | `dispatch(world)` blocking and bound; a `kernel_busy` option; the payload's `principal` path; one `wait_stalled` signature, the stall step shape, the `DISPATCH_REFUSED` catalogue row, `CommitFailed` on a return exits | FIX |

## SLICE-05 step 3 review (2026-10-28)

[SLICE-05 step 3](../../plan/slices/SLICE-05-dispatch-conflicts-scheduling.md#step-3--cancel-modify-and-close-dispatch-ownership-and-completion) (cancel, modify and close dispatch, ownership and completion) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the ledger, dispatch, protection and execution-domain specs, SLICE-04's ownership rules, the code built through step 2 and the legacy export at `OA@445eb116`. Design: 1 Critical, 5 Major, 6 Minor. Readiness: 0 Critical, 5 Major, 6 Minor. The Critical was checked by hand: the ledger's `broker_identity` row and the execution-domain finding table both give a replacement the replaced order's command key and role, which the draft contradicted. Every finding is resolved by FIX except D-12 (CONTEST).

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-1 | Critical | A modify replacement owned by the modify made a moved protective stop non-protective: rows 1, 3 and 5 stopped seeing it, so a position could be oversold | FIX: the replacement inherits the target's command key and role (ledger, execution-domain, legacy `record_stop_moved`); break check |
| D-2 | Major | The replaced ID, absent from the book, would stay a resting protective order for ever and block every close | FIX: per command and role only the latest row is an owned order; break check |
| D-3, R-1 | Major | The ACK identity rule was too loose, and wrong in fixture worlds where the target has no ledger row | FIX: a cancel's leg carries the target or nothing; a modify's the target or a new replacement; anything else `LED-R08` → `outcome_refused`; tests |
| D-4 | Major | Completing a close with `filled_quantity` `None` contradicted the execution-domain finding table | FIX: every close completion needs a known filled quantity; the ledger's completion row amended |
| D-5 | Major | Completing a close before `FILL` lowers no owned quantity, so a stale positions book could let a second close oversell | FIX: a close completes only when the positions book is at least as new as the orders book; SLICE-07's late-`FILL` obligation named |
| D-6 | Major | Row 6 refused on observation gaps (absence, unknown net, unknown fills) | FIX: those wait; only proof refuses |
| R-2 | Major | The fold could not read the target's role | FIX: `_load_touched` loads the target's row for cancel and modify |
| R-3 | Major | A replacement's `verb` was unstated, so it could lose protective status | FIX: resolved with D-1 (the row is the close command's) |
| R-4 | Major | `kernel_holdings` composition and seeding unspecified; `Conflicts` built from the wrong holdings | FIX: `positions` field, composition order, `ValueError` if both set, seeding through `world.ports.positions` |
| R-5 | Major | The owned-close helper and CUJ-DSP-1's cancel grant were unspecified | FIX: `owned_close(...)` specified; `g-act-2` on the second account |
| D-7, D-8 | Minor | `confirmed_level` chosen by request field, quantity not confirmed; a resting close ignored quantity | FIX: level by order kind; `confirmed_quantity`; quantity required |
| D-9 | Minor | No age or after-claim check on the completing observation | FIX: B1 age rule and `orders.as_of` later than `claimed_at` |
| D-10 | Minor | A close's row depended on the positions fixture | FIX: the instrument from the close's recorded `resulting_exposure` |
| D-11, R-9 | Minor | Composition order; `NULL` leg roles; both `adapter_error` sites; `DispatchPorts` field order | FIX |
| D-12 | Minor | `owned_orders` reads every order on every check | CONTEST: tens of orders a day for a one-leg buyer; a cache's invalidation is a risk of its own; measured with the dispatch reads (A09-F4) |
| R-6, R-7, R-10 | Minor | Row 6's wait result; a `working_actions` read, the judged order, the principal; stale facts before row 6 | FIX: `_revalidate` returns `"wait"`; the read and rules named; the action age check runs first |
| R-8 | Minor | Four break checks missing | FIX: added |
| R-11 | Minor | Every limit close treated as resting, unmarked | FIX: marked, citing SLICE-04's `action_facts` |

## SLICE-07 review (2026-10-28)

The new [SLICE-07 slice file](../../plan/slices/SLICE-07-observations-reconciliation-domain.md) (step 1 at decision depth; steps 2–4 scoped) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the execution-domain and ledger specs, the owner answers, the code built through SLICE-05 and the legacy export at `OA@445eb116`. Design: 1 Critical, 10 Major, 4 Minor. Readiness: 1 Critical, 12 Major, 7 Minor. D-5 was checked by hand: the spec's combination table gives `simulated` with `unknown` as `conflicting`, which the draft had reversed. Every finding is resolved by FIX.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-1, R-2 | Critical | Rules not tied to an endpoint: absence on a tradebook could resolve a command never-reached and allow a duplicate order | FIX: kind from `observation.endpoint`; identity, per-verb, absence, unattributed and working escalation on the orderbook; identity, domain and fills on the tradebook; nothing on positions or funds |
| R-1, D-8 | Critical | The could-account-for window undefined without `visibility_secs` or an outcome, so an in-flight send's order could be recorded foreign; "unresolved" undefined | FIX: unresolved defined; the could-account-for window is open-ended when its end is unknown; absence needs an end (gap `window_unbounded`); test |
| D-2, R-6, R-12 | Major | A cancel's or modify's echoed ACK ID taken as identity; the no-ID absence row applied to them; which IDs are identity | FIX: identity is an `IdentityView` or an entry or close attempt's ID; target evidence separate; rows limited by verb |
| D-3, R-4, R-5 | Major | A missing `target_level` counted as a changed level; "unchanged" had no baseline | FIX: no `target_level` means no level evidence (gap `no_recorded_level`); requested-field equality counts only when the request differs; cancel's and modify's never-reached evidence defined |
| D-4, R-9 | Major | A close's effective domain contradicted Q-012 | FIX: `target_domain` — for a close, the domain of the entry order behind its position |
| D-5 | Major | `simulated` with `unknown` reversed from the spec | FIX: the spec's table; the break check inverted |
| D-6 | Major | Suppressing facts on any domain conflict contradicted REQ-DOM-015 | FIX: `cross_domain_id` only escalates (it may be another order); `domain_conflict` records the facts labelled `conflicting` |
| D-7 | Major | Only the latest attempt in the view: a retry's attempt-1 order misread | FIX: every attempt; `after_never_reached` on the attempt the ID belongs to; test |
| D-9 | Major | No account check | FIX: gap `account_mismatch`, no findings |
| D-10, R-13 | Major | `Finding` lacked domains and the completion | FIX: `domain`, `recorded_domain`, `observed_domain`, `subject`, `completion` |
| D-11, R-3 | Major | `completion` reused against the wrong input and without its guards or `target_kind` | FIX: moved to the pure module over the orders observation; guards stated; `target_kind`; close completion stays with `record_completions` until step 2 |
| R-7, R-8, D-12 | Major | Working-escalation timing, subjects and reasons; `after_*` escalation reason; reason for every domain pair | FIX: all stated; `conflict_reason` total; the catalogue gains `after_rejected` and `after_never_reached` |
| R-10, R-11 | Major | Recorded domain when both are unknown; both untagged and unknown-domain escalations | FIX: `unknown`; both produced, each once; CUJ-DOM-4 uses `simulated` |
| D-13, D-14, D-15 | Minor | Step 2 scope wording and missing obligations; "default contract" readable as source-derived; time comparison; episode; the identity-only combination test | FIX |
| R-14…R-20 | Minor | Unknown `placed_at`; time parsing and window as a pair; gap precedence; account; validation and the `ModeRead` test; `after_never_reached` wording; builders and finding order | FIX |

## SLICE-07 step 2 review (2026-10-28)

[SLICE-07 step 2](../../plan/slices/SLICE-07-observations-reconciliation-domain.md#step-2--lifecycle-commits-fills-positions-settlement-and-attempt_resolve) (lifecycle commits, fills, positions, settlement and `attempt_resolve`) was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (read-only) against the ledger, execution-domain and cross-cutting specs, the owner answers, SLICE-05's hand-offs, the code built through step 1 and legacy `reservations.py`. Design: 3 Critical, 8 Major, 4 Minor. Readiness: 2 Critical, 8 Major, 4 Minor. The two Criticals they share were checked by hand: `reached` comes only from an orderbook and `fill` only from a tradebook (`reconciliation.py:365-375`), and fill rows carry no order ID (`001_initial.sql`). Every finding is resolved by FIX.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| D-1, R-1 | Critical | Reach and fill could never meet; a filled order could be judged never reached and resent | FIX: a tradebook fill on an uncertain attempt's order gives `reached` first, committed with the `FILL`; no `never_reached` after fills; break checks |
| D-2 | Critical | Entry completion vacuous after a reach by resolution (no `acknowledged` legs), releasing money on no evidence | FIX: judged over `PlanRef.legs`, at least one; `RESOLVED_REACHED` rewrites the attempt's legs and domain; break check |
| D-3 | Critical | A later marked book released money held back for `unknown` fills (Q-006) | FIX: completion releases only when every `FILL` reduced and the completing domain passes; break check |
| R-2 | Critical | Fill rows had no order ID, so per-order totals and I-4's same-order check were impossible | FIX: `broker_identity.broker_order_id` (migration 005) |
| D-4, D-5, R-3 | Major | I-4 differed from the ledger spec unmarked; corrections silently ignored; three break checks could not fail | FIX: the writer drops identical duplicates per I-4, `LED-R08` `fill_mismatch` otherwise; `fill_records` in the view, a correction escalated; direct-decision tests |
| D-6 | Major | Fills of a completed resting close had no rule | FIX: a fill never changes command state; the state table row added; test |
| D-7 | Major | No reservation-head guard on `reservation_after` | FIX: `reservation_before` checked by the fold; fills chained in one decision |
| D-8, R-9 | Major | The clamp departed from legacy unmarked; divide by zero at 0.00; two signatures | FIX: Deviation with reason; 0.00 rule; `over_reduction`; one signature; the boundary case |
| D-9, R-10 | Major | I-6 silently redefined; the state machine extension too thin to write | FIX: the ledger's I-6 restated; the machine's rules and invariants named |
| D-10, R-6 | Major | Positions unchecked; the entry and role not derivable from a digest; execution ID and instrument sources | FIX: only entry fills create, with `position_id(key, role)` checked; a close's `target` and instrument checked; sources named |
| D-11 | Major | `resolve_attempt`'s recorded domain, evidence, attempt guard and legs | FIX: the attempt's domain; the evidence resolves and contains the order (`DOM-R05`); guard with the attempt number; one leg until SLICE-06 |
| R-4, R-5, R-7, R-8 | Major | Touched rows for the new events; the reached attempt's legs; the test migration; `late_fill`'s source | FIX: each `_load_touched` branch; legs rewritten; `filled_entry` and the return shape; late is the command's state at commit |
| D-12…D-15, R-11…R-14 | Minor | Overclose silent; `target_ended`'s route; rule 6 for entries; signatures; settings fields and the non-negative kind; `underlying`; the always-passed `settlement_withheld`; `now` and subjects; PRF-LED-16's file | FIX |

## SLICE-07 step 2 second review (2026-10-28)

A second fresh `egm:egm-design` review of the revised [SLICE-07 step 2](../../plan/slices/SLICE-07-observations-reconciliation-domain.md#second-round-decisions) checked each first-round resolution and looked for new defects: 1 Critical, 4 Major, 10 Minor. D-1, D-3, D-6, D-7, D-11 and D-13's resolutions did not fully hold; the rest held. E-1 was checked by hand against SLICE-05's tested `outcome_refused` path, which keeps leg IDs another command owns. Every finding is resolved by FIX in the step's second-round decisions.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| E-1 | Critical | An ambiguous attempt's ID owned by another command made `RESOLVED_REACHED` refuse `LED-R08`, and lifecycle raised `WriterLost` (a crash loop on restart) | FIX: resolution only by IDs this command owns or no one owns; `conflict` `order_owned`; `LED-R08` escalated, never `WriterLost` |
| E-2 | Major | A never-reached untagged timeout had no `untagged_timeout` fact, so `attempt_resolve` refused it and its reservation was held forever | FIX: every untagged timeout escalates |
| E-3 | Major | `target_ended` "blocks nothing" was false: row 2 could refuse every close for good | FIX: the conflict relation excludes such commands |
| E-4 | Major | Ledger state table, reservations, late-fill and `FILL` lines did not match | FIX: amended |
| E-5 | Major | A fill after `never_reached` could leave the order resendable | FIX: `after_never_reached` blocks eligibility and retries (`DOM-R06`); escalated |
| E-6…E-15 | Minor | Decision grouping; a lost close fill; zero fills; instrument before an identity row; nested money checks; I-6 and expected states; the 0.00 rule; evidence checks; an unbounded read; the ACK row's column | FIX |


## SLICE-07 step 3 review (2026-10-28)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-07 step 3](../../plan/slices/SLICE-07-observations-reconciliation-domain.md#step-3--the-observation-loop), the observation loop, before it was built. Design: 1 Critical, 4 Major, 10 Minor (F-1…F-15). Readiness: 1 Critical, 13 Major, 14 Minor (R-1…R-28). Several overlap (F-4 with R-3, F-6 with R-6, F-7 with R-11, F-8 with R-2). Both reviewers checked the PRF-ADM-09 hand calculation and found it correct. Every finding is resolved by FIX in the step's text, which was rewritten rather than amended, since nothing was built.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Critical | Kinds stored separately let a tradebook commit a fill while capacity still read older positions, admitting beyond capacity | FIX: a reader cycle (all four reads) is stored or dropped whole; budget per cycle |
| R-1 | Critical | Every send changing the book broke every earlier close, cancel and modify test, whose orders and positions are fixtures | FIX: an effect the book cannot place leaves it unchanged; the send result is unaffected |
| F-2 | Major | No route published the orderbook an `attempt_resolve` must cite once its order appeared after the escalation (`DOM-R05` for ever) | FIX: `publish_latest(account)` for the operator's route; tested |
| F-3 | Major | Publish-before-reference rested on call order alone; a `None` content or a stale memo committed an unresolvable digest | FIX: `publish` and `cite` return refs placed in events' `evidence`, which the writer resolves; no memo |
| F-4, R-3 | Major | A failed `cite` inside stage B could fail the writer (`OSError`) or escape `admit` | FIX: `EvidenceUnpublished(Exception)`; stage B returns `ADM-R05` `evidence_unpublished`; tested with `writer.failed` |
| F-5 | Major | `observed_accounts()` left an account with a position or resting order unread after a restart or revocation | FIX: every account in `command_identity` too |
| R-4 | Major | Setting field names unnamed, and the obvious one collided with `market.poll_interval_secs` | FIX: `observation_poll_interval_secs`, `observation_max_requests_per_minute`; where the budget check runs |
| R-5, R-7, R-8, R-9 | Major | Loop world plumbing, `funds`, `BookStep` and `ScriptedObservationPort` were not buildable as written | FIX: each specified (types, registration, times, injection through `compose_simulation(..., observation_port=…)`) |
| R-6, F-6 | Major | Dropping by wall-clock `as_of` halted on a clock jump and silently dropped equal stamps under the recorded clock | FIX: per-reader cycle numbers plus digest equality; a stamp beyond `now + skew` fails the cycle; `observe` advances the clock; the Deviation marked |
| R-10 | Major | The budget test could not hold at the stated values | FIX: a loop built with 60 s and 4 per minute |
| R-11, F-7 | Major | The "drain before returns" break survived its test | FIX: the test asserts a `FILL` committed in the same pass |
| R-12 | Major | The redelivery break was masked by the `as_of` clause | FIX: redelivery is equal digests at a later `seq`; a reconcile counter observes it |
| R-13 | Major | "Release across domains" named no mutation; CUJ-DOM-1's test was vacuous for a working entry | FIX: a cross-domain filled book with a trade; the mutation "`cross_domain_id` records facts" |
| R-14 | Major | The stale-close test collided with the 9 s close deadline | FIX: a timeline (55 s, then 6 s) |
| F-8…F-15, R-15…R-28 | Minor | INSPECTING contradiction; recovery-step predicate; unbounded queue and stale reconcile; kind and endpoint validation; same-account blocking; tagged CUJ-DOM-1 variant; contracts only in simulation; the latest read off-thread; publish-failure counts and step 4's in-send read; wire forms; endpoint names; `AccountObservation` field names; publish semantics; `ReadHealth`; `observed_accounts` return; simulated data fields; the coverage interval's start (`book_start`); spec drift; `observation_loop` attribute; positions break via a spy; files row; CUJ-DSP-4 numbers; how to get `unknown` | FIX |

## SLICE-07 step 4 review (2026-10-28)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-07 step 4](../../plan/slices/SLICE-07-observations-reconciliation-domain.md#step-4--the-openalgo-adapter), the OpenAlgo adapter, before it was built. Design: 1 Critical, 9 Major, 11 Minor (F-1…F-21). Readiness: 3 Critical, 12 Major, 6 Minor (R-1…R-21). Several overlap (F-1 with R-2, F-3 with R-10, F-4 with R-4, F-7 with R-12, F-19 with R-1). Both checked the captures' field names, the 4 August example row and 15:15 IST = 09:45 UTC, and found them correct. Every finding is resolved by FIX in the step's text, which was rewritten. Two findings needed the owner: they became [Q-022](../../decisions/owner-questions.md#q-022) (rewritten with its real consequences) and [Q-023](../../decisions/owner-questions.md#q-023) (new). Both block only the adapter's production composition.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1, R-2 | Critical | The modify ticket rebuilt the whole order from the admitted order plus one confirmed level, so it could resend a lowered quantity, lose a stop-limit's limit, miss a `WORKING` modify and lose history after a replacement: an oversell | FIX: the unchanged fields come from the observed row row 6 has just validated; modifies of one target go out one at a time (`WAIT`) |
| R-1 | Critical | No rule turned broker JSON numbers into money strings; rounding would have been the implementer's money choice | FIX: literal-preserving parse; exact two-place values only, never rounded; otherwise `None`, a dropped trade or `ReadFailed` |
| R-3 | Critical | The wire bodies, `pricetype` mapping and JSON types were unspecified | FIX: the write-mapping table and an exact example body |
| F-2 | Major | `_finish` turned a provable `not_sent` with no evidence into `ambiguous` | FIX: `_finish` keeps `not_sent`; dispatch spec amended; end-to-end test |
| F-3, R-10 | Major | An adapter exception was recorded with domain `simulated` | FIX: `send` never raises; the coordinator's fallback uses the broker's `error_domain` |
| F-4, R-4 | Major | A cancel's `strategy` had no source | FIX: every ticket carries `strategy` from the command; a cancel's ticket carries only that |
| F-5 | Major | Q-022 misstated its consequences (no live position ever, every close refused, silent loss of a late stop fill, an unused `complete = no`) | FIX: Q-022 rewritten; `Observation.dropped` and the `trade_without_id` escalation |
| F-6 | Major | `mtm_pnl` came from a field that repeats the realized loss | FIX: `None` until TASK-S07-05 |
| F-7, R-12 | Major | Applying contracts was claimed to be "data, not code" but needed a trading-day source and had no test | FIX: no contracts in step 4; applied with TASK-S07-05 |
| F-8 | Major | The basket guard counted only `plan.legs`, so SLICE-06 could send an entry without its stop | FIX: protective legs also give `basket_unsupported` |
| F-9 | Major | A timed-out close through this adapter can never be resolved, which was not disclosed | FIX: disclosed; [Q-023](../../decisions/owner-questions.md#q-023) |
| F-10 | Major | The key could leak through a response, a message or an exception; `http` to a remote host sent it in clear text | FIX: the key scrubbed from every string; `http` only to loopback; an echo test |
| R-5 | Major | The deadline's time source and the timestamps were unstated | FIX: `time.monotonic_ns()`; `as_of`/`arrived_at`; domain `exchange` for broker times |
| R-6, R-7 | Major | Existing `send` wrappers and PRF-XC-02's module check would break | FIX: wrappers listed; the adapter imported in a fixture |
| R-8, R-9 | Major | An ambiguous leg's ID and "an ID present" were undefined | FIX: both defined |
| R-11 | Major | Malformed rows had no rule | FIX: `ReadFailed` for orders, positions and funds; trades dropped and named |
| R-13, R-14 | Major | No test proved the ticket reaches `send`; the 0-trigger break could not fail | FIX: a recording wrapper; an `SL` row test |
| F-11…F-21, R-15…R-21 | Minor | Publishing inside the deadline; non-finite JSON; `filled_quantity` only when consistent; `request_digest`; `ticket_missing` spending an attempt (now `DSP-R04` before the claim); the trade price; flat-row money; HTTP details and a body bound; one account per adapter; the error mapping as a composition precondition; stale plan lines; test seams; build timing; the product path; concrete test values; `availablecash` types | FIX |

## SLICE-06 review (2026-10-28)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of the new [SLICE-06 slice file](../../plan/slices/SLICE-06-protection-and-safety.md): the step split, and step 1 in depth. Design: 1 Critical, 13 Major, 9 Minor (F-1…F-23). Readiness: 1 Critical, 13 Major, 7 Minor (R-1…R-20). Both confirmed three points: legacy `PremiumTrail`'s only state outside `TrailPosition` is for logging; `to_tick` matches legacy; and the 60 s boundary matches POL-021. Every finding is resolved by FIX in the rewritten step 1 and the step scopes, except the opposing-signal input. That became [Q-024](../../decisions/owner-questions.md#q-024), which is open and must be answered before step 2 is deepened.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Critical | Never passing legacy's `modify` callback would change ladder moves after a rejected or withheld modify: legacy keeps the stop and advances only the peaks | FIX: each bar records the accepted and the refused outcome; step 2 adopts the refused one when the modify is rejected or withheld |
| R-1, F-16 | Critical / Minor | The golden cases were neither buildable nor reproducible | FIX: generator, seeds, paths, grid, extra cases, stored bars, JSON shape |
| F-2 | Major | The ladder's other inputs (bar history, `ts`, delta, opposing score) were undecided | FIX: decided; the opposing score is Q-024 |
| F-3, R-2 | Major | The `sl_method` set was not legacy's | FIX: `fixed_pct`, `fixed_pts`, `atr`, `delta`; `key_level` refused |
| F-4 | Major | Policy values were not validated | FIX: legacy's ranges and types at load; `policy_version` over the resolved values |
| F-5 | Major | `protection = None` had no meaning | FIX: the all-defaults policy; no new gate |
| F-6 | Major | Continuity data was only a digest | FIX: the resolved policy is recorded with each desire |
| F-7, R-12 | Major | `ORPHANED` was out of order and underspecified | FIX: the spec's five rows in order, with required inputs |
| F-8, R-5 | Major | `ENDED` depended on a fresh observation, and its reasons were partial | FIX: a sticky ledger end; a complete reason order with `fill_pending`, `orphan` and `external` |
| F-9, R-9 | Major | The `observed` rule was looser than admission's | FIX: `observation_age` and the single-row rule, with the bound 60 s setting |
| F-10, F-12, F-13, F-14, F-22, R-20 | Major / Minor | Hand-offs, characterizations, the gap guard, the host loop, structures, POL-006 and basket classification had no step | FIX: each assigned; the host-loop half of PRF-PRT-06 is a Deviation to SLICE-11 |
| F-11 | Major | PRF-PRT-08's deferral was unmarked | FIX: marked Deviation; run with TASK-S11-07's recorded sessions before live use |
| R-3, R-4, R-6, R-7, R-8, R-10, R-11 | Major | The live order's role, `LegView`, `Desire`, the float-to-money conversion, the quantity rule, the migration and fold wiring, and the event schema were underspecified | FIX: each specified |
| F-15, F-17…F-21, F-23, R-13…R-19 | Minor | Restart test, `ladder_state` encoding, level and quantity rules, policy fields, fold shapes, gap dedupe, tick source, citations, test construction, the reserved-role check's place, break wording, `commands_with_prefix`, types, an unused parameter | FIX |

## SLICE-06 step 2 review (2026-10-28)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-06 step 2](../../plan/slices/SLICE-06-protection-and-safety.md#step-2--the-protection-loop), the protection loop, after the owner's answers to Q-024 and Q-025 (option B, live-host parity). Design: 2 Critical, 10 Major, 1 Minor (F-1…F-13). Readiness: 2 Critical, 11 Major, 4 Minor (R-1…R-17). The design reviewer checked every cited line of legacy's live host (`scripts/run_framework_live.py` @445eb116). Every finding is resolved by FIX in the rewritten step. Where the live host and the spec differ, the step follows the host as the owner's answers did, and marks what it does not take as a Deviation. The deep-OTM delta exit, which the live host never ran, is [Q-026](../../decisions/owner-questions.md#q-026) (open).

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Critical | The exit's close could sell more than held: an `ENDED` stop with an unrecorded or partial fill leaves `q` stale | FIX: close only when every order in the chain has a fresh terminal row whose filled quantity equals the recorded fills, never on `fill_pending` |
| F-3, R-2 | Critical | A placement with no broker order left the position unprotected, or built a modify or cancel of `None` | FIX: the placement is the latest close with an order ID; `placement_failed` (`rejected`: `stop_rejected`, no re-place; `refused`: placed again); `ORPHANED` needs a live order |
| R-1 | Critical | Composing the loop under the test settings changes every existing world | FIX: `ADMISSION_SETTINGS` binds `basket_at_plan`; step 2's tests bind `stop_on_fill` |
| F-2, R-13 | Major | The close role had no pending, rejected or competing rules | FIX: one request, retry and refusal memory on the close role; `exit_close_rejected` and `exit_close_incomplete` once, never resent, as legacy |
| F-4 | Major | Square-off waited for ever on a stop never placed | FIX: the open-exit rule waits only on a live order, a pending placement or cancel, or `q` > 0 (step 1's rule amended) |
| F-5 | Major | The trailed level skipped the host's `round(after, 2)` | FIX: `level_of(round(sl, 2), up=True)`, as the host and gateway |
| F-6 | Major | Real OHLC candles instead of the host's bars from consecutive closes | FIX: the port serves closes; bars are built as `_premium_bars`, the first flat |
| F-7 | Major | A modify pending over a bar then rejected put the ladder back to the wrong stop | FIX: `sl` is put back to the newest confirmed desire's `sl` or the confirmed level |
| F-8 | Major | Seed and loop departures from the host were unmarked | FIX: conviction 0.0 and the filled quantity, as the host; policy overrides as POL-012 allows; restart from the full state marked a Deviation; no cycling once `ENDED` or exiting |
| F-9, R-4 | Major | Refusals could be recorded on nearly every pass, including dispatch refusals | FIX: a ledger-derived refusal memory per leg, cleared only by a named change; B2's `effect_check` added to the pre-checks |
| F-10 | Major | Escalation rules differed from the spec without an amendment; false `external` ends | FIX: once per position until step 3's episodes, listed as a spec amendment with the new reasons; `external` only from a fresh row; `unprotected_under_hold` |
| F-11 | Major | Square-off was one-shot and closed entries still working | FIX: every pass after the instant; a working entry skipped and escalated, as the host |
| F-12 | Major | Tick exits had no freshness bound, fired under kill, and the target exit was unmarked | FIX: fresh ticks after the fill only; no exit recorded under kill; the target tick exit marked a Deviation |
| R-3 | Major | The one-request gate blocked the `NOT_SENT` retry | FIX: the retry is checked first, rebuilt from `COMMAND_ADMITTED` |
| R-5 | Major | `entry_premium` is a two-place string, not `repr` | FIX: stated; the chain LTP on a 0.05 tick reads back exactly, and the host read the plan's figure too |
| R-6, F-13 | Major / Minor | The first bar comparison and the through-market check were undefined | FIX: a non-`bar:` `view_id` means none cycled; the check reads the bar just cycled, and the placement is unchecked, as the host |
| R-7 | Major | The desire was never re-recorded when `q` changed | FIX: the quantity re-record on every evaluation |
| R-8 | Major | A modify cannot complete at a different level; the adoption test was unbuildable | FIX: adoption of a higher confirmed level on every evaluation; the test uses a human's modify |
| R-9 | Major | Wire shapes of the levels, session and recorded policy were unnamed | FIX: each parsing step named; `ProtectionPolicy.from_resolved` |
| R-10 | Major | The shared `escalate` dropped `evidence` and the result list; citation claim too wide | FIX: `evidence=()` and a bool result; the citation test narrowed to what each event carries |
| R-11 | Major | The crash tests could not rebuild the book or reach a crash point | FIX: the child-process pattern with `CP-P1` and `CP-P4` crash points and a scripted book in the parent |
| R-12 | Major | Three break checks failed no test | FIX: tests for two closes between passes and the no-score level; "escalate on every pass" replaced by "drop the refusal memory" |
| R-14…R-17 | Minor | Types, boundaries, wiring, the calendar offset, the account, the tick's money form, the unseeded ladder, `DesireRefused`, the fixture plan | FIX: each specified |

## SLICE-06 step 3 review (2026-10-28)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-06 step 3](../../plan/slices/SLICE-06-protection-and-safety.md#step-3--basket-placement), basket placement. Design: 2 Critical, 9 Major, 1 Minor (F-1…F-12). Readiness: 3 Critical, 13 Major, 5 Minor (R-1…R-21). Every finding is resolved by FIX in the rewritten step. The design reviewer found one more place legacy differs from the spec: legacy holds the strategy when a basket's roles cannot be proven. That became item 5 of [Q-027](../../decisions/owner-questions.md#q-027) (open), with the other four rules the spec adds beyond legacy's live host.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1, R-8 | Critical / Major | The loop's subjects were position rows only: an unfilled basket, and the target after a stop fill closed the position, were never evaluated | FIX: subjects add every entry with protective legs not all `ENDED`; the early return and exit checks read every leg |
| F-2, R-9 | Critical / Major | The basket `leg_view` would let the entry's `COMPLETED` end the stop, or leave the confirmed level `None`; `CONFIRMED` was exact while the join tolerates 0.05 | FIX: no placement command; the chain by entry key and role; placed values until a modify completes; the entry's `COMPLETED` excluded; a level within 0.05 adopted (POL-014) |
| R-1 | Critical | The `PlanRef` wire form and digest would break every rebuild | FIX: `wire` and `plan_ref_from_wire` for `ProtectiveLeg`, omitted when empty; excluded from `plan_digest`; the `request_digest` claim corrected |
| R-2, F-3 | Critical / Major | Unassigned IDs had no path into the ledger; their class was undefined; the divergence from legacy's hold was unmarked | FIX: `TransportResult.unassigned_order_ids`, through the outcome, evidence and `recover`; role-less identity rows; the class `ambiguous`; legacy's hold is Q-027 item 5 |
| R-3 | Critical | Existing tests would all become baskets with a running loop | FIX: a `protection_loop` composition flag, off in tests unless asked; unscripted basket legs `not_sent`; the tests that change listed at build |
| F-4 | Major | CP-B2 could not name the protective legs | FIX: self-built ambiguous results list every role; `resolve_attempt` takes roles from `plan_ref`, one call naming all |
| F-5, R-7 | Major | An entry whose entry leg failed never completed | FIX: completion `order_ended` at 0 when the only plan leg is rejected or never reached |
| F-6, R-6 | Major | The overclose was not one decision; several fills in one decision could hold twice or drop the decision | FIX: entry fills first; `q` once per decision; one escalation and one hold appended to the fill decision |
| F-7, R-5 | Major | Protective fills tripped `late_fill`, the sign, the fold's position check and `fills_withheld` | FIX: a protective branch in `fill_draft` and the fold; excluded from settlement checks; a fill with no position row waits |
| F-8, R-14 | Major | A hold could re-engage at once after its release; the hold mechanics and F-P24 text were unclear | FIX: a failure belongs to the episode of its triggering event; `hold_draft` and `episode` named; F-P24 restated |
| F-9, R-12, R-11 | Major | The transient-to-hold clock had no anchor; the memory never cleared on basket orders | FIX: "due since" from a ledger event; transient codes cleared each poll; the chain by entry key and role |
| F-10, R-17 | Major / Minor | The desired quantity's meaning differed from step 2's; the seed quantity contradicted step 2 | FIX: one stored total for the basket, replacing step 2's rule 1; the seed explained (`remaining_qty` is metrics only) |
| F-11 | Major | The modify-quantity semantics diverged from the host, unmarked, with an oversell risk | FIX: marked; a leg with its own fills is cancelled, not shrunk, until TASK-S07-05 confirms the semantics |
| R-4, F-12 | Major / Minor | The join used fields `ObservedOrder` lacks; legacy compares the trigger or price by type | FIX: the join on observed fields by price type, exchange and product a marked Deviation; malformed rows classed |
| R-10 | Major | Basket-leg modifies could not be ticketed or resolved | FIX: `_leg_product` and `target_level` read `protective_legs` |
| R-13 | Major | `HELD_BACK` could not be derived per leg | FIX: per-leg subjects `<position_id>:<role>` |
| R-15 | Major | The in-send read's budget, failure and evidence were undefined | FIX: a `read_budget` constructor argument; exhausted means unassigned; the evidence shape |
| R-16 | Major | Crash points were unnamed | FIX: `CP-B1`, `CP-B3`, `CP-B5` call sites; CP-B2, CP-B4 and CP-B6 by state |
| R-18…R-21 | Minor | Admission details, the simulated basket, break-check mapping, the helpers, Q-027 coverage | FIX: each specified; the Q-027 rows marked by item, and which tests build now |

## SLICE-06 step 4 review (2026-10-29)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-06 step 4](../../plan/slices/SLICE-06-protection-and-safety.md#step-4--the-latch-safety-visibility-and-the-recovery-hold): the daily-loss latch, safety visibility and the recovery hold. Design: 1 Blocker, 11 Major, 6 Minor (F-1…F-18). Readiness: 2 Blockers, 5 Major, 7 Minor (R-1…R-14). Every finding was checked against the code or the legacy export before it was taken, and each is resolved by FIX in the rewritten step. The design reviewer found that legacy keeps one latch per strategy fed with the whole account's P&L. The step now keys the latch by session, marked Deviation (the kernel binds one budget per session), and [Q-028](../../decisions/owner-questions.md#q-028) asks only what is summed. F-12's corrections changed [Q-029](../../decisions/owner-questions.md#q-029)'s recommendation from B to A: the kernel does not compare positions yet. Both questions are open.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1, R-2 | Blocker | The check row put the inert reason in the key, so an active row never replaced an inert one, and no row carried a session | FIX: rows keyed by the session ID, the inert reason in `note`; every column and the schema payloads given |
| R-1, F-3 | Blocker / Major | `drain` returns reconcile results, not observations; staleness unhandled; the stage check unplaced | FIX: evaluate each pass from the dispatch port's `latest(account)`, fresh by B1's age rule, new digest only, after the `OPERATING` check |
| F-2 | Major | A fresh book before the session's first evaluation let an entry pass unchecked | FIX: `not_evaluated` is inert until the session's first `SAFETY_CHECK_STATE` |
| F-4 | Major | OpenAlgo positionbook coverage is always `unknown`: the latch would be inert, and every entry refused, in production | FIX: only coverage `no` is incomplete; `unknown` accepted as legacy accepts a successful read; marked Deviation; a test |
| F-5 | Major | Episode-0 escalations never re-hold after a release; legacy re-places the hold every pass | FIX: the recovery hold is a sweep each pass while an entry stays unresolved |
| F-6 | Major | L1 (broker unreadable) was mapped to an escalation that cannot occur without a read | FIX: L1 moved under Q-029 with L5 |
| F-7 | Major | `unknown_domain_unresolved` on a cancel, modify or close would hold; legacy never holds these | FIX: entries only; a test that a timed-out modify holds nothing |
| F-8 | Major | Legacy is per strategy over account P&L; option A changed the scope and gave no budget source | FIX: one latch per session, the session's bound policy as the budget, marked Deviation; Q-028 narrowed to the sum |
| F-9 | Major | Q-028 B lines unmarked; B dropped realised losses once a position closed | FIX: B is now only the summing rule; it counts every position of the session, open or closed |
| F-10 | Major | Capital from policy, not legacy's reviewed cash, unmarked | FIX: marked Deviation, as the spec states it; flagged for the owner, no value proposed |
| F-11 | Major | "Stricter than a hold" for exceptions was unproven | FIX: stated as a gap carried to step 5, with SLICE-11's host handling |
| F-12 | Major | Q-029 misread legacy (it re-read every pass) and assumed a slow broker every morning | FIX: the question rewritten; the positions gap named; recommendation A |
| R-3 | Major | `Safety` had no policy, and `ActionFacts` no session | FIX: `Safety` takes `admission.policies`; an entry's session is its account's `OPEN` session |
| R-4 | Major | The synthetic budget was put on `build`, which builds no policy | FIX: on `bound()`; `build` passes `latch=False` unless a world asks |
| R-5 | Major | Callers missed: `protection._blocked`, `SafetyPort`, `FixtureCheck`, `dispatch_inline` | FIX: each named, with the default stage, `FixtureCheck.inert`, and `PRT-R06` inline |
| R-6, F-13 | Major / Minor | `escalate` already has `extra`; RECONCILIATION_ESCALATED has no strategy | FIX: the sweep reads the strategy from `COMMAND_ADMITTED`; none means no hold |
| R-7 | Major | Q-029 A's read: both advance paths, which loop, what a failed read looks like, which strategies | FIX: each specified; `read_once` returning `()` is a failed read; no loop means no read |
| F-15 | Minor | Where the inert wait sits | FIX: after row 5, so after row 4's session refusal |
| F-14 | Minor | `kernel:safety` and `kernel:recovery`'s `hold_release` belong in the sessions spec | FIX: both in the spec amendments; `hold_release` settled as no |
| F-16 | Minor | CP-B2's behaviour changes | FIX: listed under regression |
| F-17 | Minor | `_money` refuses more than two decimals | FIX: a separate exact `_pnl`, never rounded; a three-decimal test |
| F-18 | Minor | `_number`'s line | FIX: `:22-31` |
| R-8 | Minor | Flat simulated rows raise `KeyError`; coverage is one value for all endpoints | FIX: `amount` and `margin` `None`; `set_positions_coverage` |
| R-9 | Minor | `day_pnl`'s form; the contract test; digests | FIX: keyword-only, default `None`; both noted |
| R-10 | Minor | `Unavailable(reason)` collided with `ports.Unavailable`; `budget` unspecified | FIX: `PnlUnavailable`; `budget(risk) -> Decimal` |
| R-11 | Minor | The unlock checked every bound account | FIX: the session's account only |
| R-12 | Minor | The calendar has one day | FIX: a two-day calendar helper in `conftest.py` |
| R-13 | Minor | Break checks missed `risk=None`, admission trips, dispatch order | FIX: rows added |
| R-14 | Minor | Settings and schema coverage | FIX: no settings key, said explicitly; the schema payloads given |

## SLICE-06 step 5 review (2026-10-29)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-06 step 5](../../plan/slices/SLICE-06-protection-and-safety.md#step-5--gaps-continuity-cost-and-the-recovery-checks): the gap peak, continuity, the position check, the reconciliation-failure hold and the cost baseline. Design: 1 Blocker, 8 Major, 4 Minor (F-1…F-13). Readiness: 1 Blocker, 8 Major, 3 Minor (R-1…R-13; R-13 a values check, no finding). Every finding was checked against the code or the legacy export, and each is resolved by FIX in the rewritten step. No owner question was raised. The largest change: the first text refused the advance when a leg could not run, which would have stopped protection of every position; the leg is now isolated instead, a marked Deviation from PRF-PRT-12's wording.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Blocker | Refusing the advance on one unrunnable leg stops all protection; check 9 repeats check 5 | FIX: the advance proceeds; `report["unrunnable"]`; the leg isolated; check 9 and `SES-R11` dropped; marked Deviation |
| F-4, R-1 | Blocker / Major | `missing_minutes` can never record without the day-high source; its test and break check could not fail | FIX: not ported, with the day high, until SLICE-08 |
| F-2 | Major | Skipping the whole subject also skipped square-off and exits | FIX: a frozen policy: the trail and tick exits off, everything else runs |
| F-3 | Major | The spec records one per gap, with no stop when the peak does not exceed | FIX: the spec's rule, marked Deviation from legacy |
| F-6, R-5 | Minor / Major | The record in a later decision could be lost on a crash; the restart test tested nothing | FIX: in the desire's own decision; the restart test and break check dropped |
| F-7 | Major | "Touched" from position rows misses a missed fill | FIX: entry commands' instruments in any state, plus open positions; others on the same account |
| F-8 | Major | False holds from read order, stale-skipped reconciliation, unresolved commands, incomplete books | FIX: only a cycle reconciled in full; instruments with unresolved commands skipped; coverage `no` passed over |
| F-9, R-10 | Major | The catch swallowed `CommitFailed` and database errors; the hold scope was unmarked; re-holding unstated | FIX: `WriterLost`, `CommitFailed`, `LeaseLost`, `apsw.Error`, `EvidenceUnpublished` pass; scope marked Deviation; re-hold stated; `reconcile_failures` counted apart |
| F-10 | Major | L7's counterpart is the position check, which had no exception path | FIX: caught per strategy, `position_check_failed` and the hold |
| R-2 | Major | No last seen bar on a first step made every first step `multi_bar` | FIX: with no last seen close only `rebuild` applies |
| R-3, F-5 | Major / Minor | The counterfactual loop was unspecified and misread legacy (bars before the peak are history; earliest on a tie) | FIX: the loop written out (`bars[:i + 1]`, from the peak's index); earliest on a tie; legacy description corrected |
| R-4 | Minor | Peak conversion and comparison | FIX: `str(Decimal(repr(x)))`, compared as `Decimal` |
| R-6 | Major | "Live leg" needed an observation; the skip's place and escalation call unstated | FIX: a ledger-only rule for `carried_runnable`; the frozen policy in `_policy`; `lifecycle.escalate` named |
| R-7 | Major | The session hook runs only on a binding change; the adapter unstated | FIX: both stated; the lambda given; composed with or without admission; the test changes the binding |
| R-8 | Minor | `SES-R11`'s place and the routine table | FIX: moot, both dropped |
| R-9, F-11 | Major / Minor | The position check's lifecycle, coverage, session link and one-decision refusal | FIX: the book's conditions, `_position_checked`, the session by the request's `session_id`, one decision per instrument |
| R-11, F-12 | Major / Minor | The script's command line, figure, world and timing; the test asserted timing; cross-machine baselines; queue delay understated | FIX: flags given; evaluation p95 compared; conftest builders reused; a pure `compare` tested; other machines refused; the delay bounded by two passes |
| R-12 | Major | Regression left to the builder | FIX: `test_only_the_latest_close_is_cycled` named; the rules that keep the rest unchanged stated |
| F-13 | Minor | Two ladder-version constants; exact match in `ProtectionPolicy` | FIX: one constant, imported by `trail.py`; membership in `SUPPORTED_LADDERS` |

## SLICE-08 review (2026-10-29)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of the deepened [market-data spec](../../design/market-data-and-canvas.md) and the new [SLICE-08 slice file](../../plan/slices/SLICE-08-market-data-and-views.md): the step split, and step 1 in depth. Design: 13 Major, 1 Minor (F-1…F-14). Readiness: 9 Major, 7 Minor (R-1…R-16). Both confirmed every "as legacy" citation, the strict late comparison, epoch-floored windows (a one-hour window at :30 IST), the fold, the session hours and Q-030's revision rule. Every finding was checked against the code and is resolved by FIX in the rewritten texts. The tick source for a held option (F-5) is an owner question, to be asked when step 5 is deepened.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Major | Which bar a live view shows for a confirmed, unsealed window was unstated; lateness measured at the flush, not receipt, unmarked | FIX: a view shows a window only once sealed; prompt sealing; the decision pass waits for the seal (SLICE-09's bound); receipt-time lateness marked Deviation |
| F-2 | Major | Lateness judged per window broke legacy's resampled higher timeframes | FIX: one-minute base windows only; `resample` ported from legacy's `_resample`; lateness on the base window |
| F-3 | Major | The view identity named no store; separator and lag text ambiguous | FIX: `store_id` and schema version in the identity, refused on mismatch; a pipe separator no field may contain; one canonical lag text |
| F-4 | Major | Protection's reads could not share or record one view | FIX: `MarketPort.resolve`, a `view_id` on `closes` and `latest_tick`, `market_view` on protection's events (step 5) |
| F-5 | Major | `latest_tick`'s source unspecified | FIX: exact-at-two-decimals or refused; the source is an owner question at step 5 |
| F-6 | Major | Legacy's live views drop stale prices (OD-16); the spec made it report-only | FIX: `stale: drop` per stream for the live strategy policy, `report` for the kernel's |
| F-7 | Major | Two calendars; the view's `calendar_id` undefined | FIX: one `Calendar` with `calendar_id` `NSE-FO`; it implements the kernel's calendar port (step 5) |
| F-8 | Major | Merge keys broke fold parity and CUJ-MKT-4; table incomplete | FIX: keys per stream (a receipt number for ticks); CUJ-MKT-4 corrected; `outdated` row; compared against every revision |
| F-9 | Major | The port preceded the Greeks and PE-delta characterization; step 3 too large | FIX: six steps: views and quality (3), source and characterizations (4), port (5), Canvas (6) |
| F-10 | Major | The day-high gap source under-designed | FIX: `InstrumentClose.high`, legacy's candidate and synthetic bar in `_gap_draft`, parity cases (step 5) |
| F-11 | Major | Clock steps, version refusal and row 1236's incremental clause had no proof | FIX: PRF-MKT-06 clock step; PRF-MKT-04 refusals; PRF-MKT-09 fresh and restarted agree, no incremental path by design |
| F-12, F-13 | Minor | `chains()` and the poll instant not pinned to legacy | FIX: the polled expiries with one `as_of` and legacy's fallback; the poll's start instant; pre-open polls kept |
| F-14 | Minor | CP-M3 lost revision 2; `ticks_else_history` one-minute only; reference facts and corrections | FIX: each clarified |
| R-1, R-9, R-10 | Major / Minor | `bars`' `revisions` argument, instruments, empty windows, `first_seq` | FIX: signature and rules stated |
| R-2, R-14, R-15 | Major / Minor | `to_epoch_ms`'s error paths, `datetime` values, the `strptime` formats, infinity | FIX: ported in full; non-finite values a Deviation; formats listed; a strptime-only test case |
| R-3 | Major | `sum()` rounds differently from Python 3.12 on | FIX: `+=` in order |
| R-4 | Major | The golden generator underspecified | FIX: import, row shape, day, arrival draw, window keys, metadata |
| R-5, R-6, R-8, R-11 | Major / Minor | Lag text, `late_max_secs` format, refusals, naive datetimes | FIX: regex, format, every refusal listed and tested |
| R-7 | Major | A recorded clock's arrivals would be refused | FIX: `arrival_at` in `wall` or `recorded` |
| R-12, R-13 | Minor | Spec and plan disagreed on `WindowDef` and window facts; the import check vague | FIX: one signature; `sealed_revision`; an `ast` check |
| R-16 | Minor | No capture for `multioptiongreeks` or websocket ticks | FIX: proved on synthetic responses, capture carried to TASK-S07-05 (Deviation) |

## SLICE-08 step 2 review (2026-10-30)

Fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviews of [SLICE-08 step 2](../../plan/slices/SLICE-08-market-data-and-views.md#step-2--store-ingestion-and-publication), the store, ingestion and publication. Design: 1 Critical, 10 Major, 5 Minor (F-1…F-16). Readiness: 3 Blocker, 8 Major, 1 Nit (R-1…R-12). Both confirmed the head design (one sequence, one transaction) meets Combined-F2. Every finding was checked against the code and resolved by FIX in the rewritten step; two are fork calls that keep legacy's timing.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1, R-2 | Critical / Blocker | Revision 1 held every on-time tick only under an unstated drain rule; a straggler could change it; seal rules double-fired | FIX: a tick committed into a sealed window, on time or late, makes the next revision; `bars` takes revision 1's `through_seq`; the drain rule stated; seal rules rewritten |
| F-2, R-5 | Major | `when` was the minute's start; legacy's is the poll's actual instant, which B1's ages read | FIX (fork call): the actual instant |
| F-3 | Major | The 15:30 poll differed from legacy's strict skip | FIX (fork call): `local.time() <= close` to the microsecond |
| F-4, F-5 | Major | A restart could repoll a minute or reuse tick keys | FIX: the polled minute rebuilt from coverage; a `uuid4` connection id per start and reconnect |
| F-6 | Major | One bad record could lose a batch | FIX: the source drops unwritable ticks; the loop drops unwritable payloads with coverage; a raising commit keeps the ticks |
| F-7, F-8 | Major | Quiet windows never final; sealing cadence unstated | FIX: per-instrument watermarks; `next_wake` and running past the close |
| F-9 | Major | A process stop left no coverage | FIX: `process_stopped` coverage when a loop opens |
| F-10 | Major | The market package imported the ledger writer module | FIX: `WriterLock` moved to `runtime.py`; Deviation marked; boundary test |
| F-11, R-7, R-8 | Major | Reference normalisation, equality and ordering not legacy's | FIX: legacy's normalisation, `==` on decoded values, instants, first-stored ties; parity cases |
| F-12, R-4 | Minor / Major | Merge table gaps | FIX: first match wins; equal or missing orders conflict; same-batch inserts count |
| F-13, F-14 | Minor | Tick time recorded twice; coverage source mismatched | FIX: `tick_record` lifts once and the store checks; coverage uses the records' source |
| F-15 | Minor | Per-instrument streams and cadence | Carried to step 4 with the OpenAlgo source |
| F-16, R-3 | Minor / Blocker | CP-M3 impossible as written; no seams or child branch | FIX: seams on store and loop, the points redefined, a child branch |
| R-1 | Blocker | The reader had no read interface | FIX: the reads listed with signatures |
| R-6, R-9, R-10, R-11, R-12 | Major / Nit | Loop record fields, the raising-commit test, DDL types, the settings pattern, an unused argument | FIX: each specified |

## SLICE-09 design review (2026-10-30)

A fresh `egm:egm-design` review of the deepened [strategies spec](../../design/strategies-and-cognition.md) and the new [SLICE-09 slice file](../../plan/slices/SLICE-09-strategies-and-cognition.md), written by a helper under the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30); steps are outlines, each deepened just before it is built (its readiness review then). 2 Critical, 4 Major, 7 Minor (F-1…F-12, one merged). The reviewer confirmed Fork calls 1, 3, 4, 7, 9, 10, 12–15 in legacy code. Every finding was checked against the code by the helper and resolved in the texts.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Critical | One view per pass let a late-decided old window pass B1 with a fresh age and price from the newest chain | Fork call: one view per trigger window, cut off at its confirmation instant; CUJ-STR-5; PRF-STR-02/03 cases |
| F-2 | Critical | The fresh-setup gate had no source: abstentions were host-only | Fork call: every decision recorded with the kernel (`record_decision`); `setup_fresh` derived by legacy's rule across restarts; REQ-STR-011, TASK-S09-09 |
| F-3 | Major | Handoff covered only `ADM-R15` | Deviation 6 for the owner: busy, commit-failed and unknown outcomes retry the same key while the bar is within admission's view age; `LED-R02` terminal with an alert; CP-W5 |
| F-4 | Major | Per-minute golden cases cannot prove a stateful scorer | Contiguous golden walks from a fresh engine, from session start and restart points; the clock an input |
| F-5 | Major | No replay proof (Combined-F5) | PRF-STR-11, TASK-S09-10 |
| F-6 | Major | When the review is requested was ambiguous | Fork call: every published intent is reviewed, whatever the admission answer |
| F-7 | Minor | Invocation identity | `inv1:` plus a digest including the view policy; a valid command key |
| F-8 | Minor | The sealed-bar decision was labelled legacy | Relabelled as the owner's Q-030 change |
| F-9, F-10 | Minor | Registry rows; who creates them | Every live row carried (TASK-S09-08); rows written by the owner in the release binding; `ema_cross_spot`, `ai_ema_cross` not ported |
| F-11 | Minor | Cross-slice carries | Five market reads carried into SLICE-08 step 3; a test-only strategy package |
| F-12 | Minor | Master items unassigned | "Simple vs specialists" to SLICE-12; budgets; the host's principal and grant specified |

## SLICE-10 design review (2026-10-30)

A fresh `egm:egm-design` review of the deepened [security spec](../../design/security-and-operator.md) and the [SLICE-10 slice file](../../plan/slices/SLICE-10-security-and-operator.md), written by a helper under the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30). 3 Blocker, 7 Major, 3 Minor (F-1…F-13). The reviewer confirmed MCP stays read-only for orders, the console cannot lift kill or a hold, the typed confirmations and the owner API's reachability and CSRF rules. Every finding was checked and resolved by the helper.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Blocker | The kill file could never engage kill | `kernel:safety` engages it (reason `kill_file`), holding only `kill_engage`; PRF-SEC-12 |
| F-2 | Blocker | `at kill-switch off` always failed; `on` depended on the socket | Fork call: `on` writes the file first; `off` confirms, removes, releases |
| F-3 | Major | Kill-input keys renamed | Fork call: legacy keys and alias kept; an empty path refuses a live composition (Deviation) |
| F-4 | Blocker | The catalogue omitted legacy owner mutations | A table of every legacy mutation and its route (Fork calls); exit-advice application, step 7, PRF-SEC-13 |
| F-5 | Major | The OS user alone made a CLI caller the owner | Per-unit users; humans use the operator's socket from a listed login uid (Deviation, owner item) |
| F-6 | Major | The 120 s window counted typing time | Fork call: the request is minted at execute; expiry also refused at admission |
| F-7 | Major | Replay and retry rules contradicted | Same nonce and digest returns the recorded result; retry identity on the principal; `SEC-R19` |
| F-8 | Major | Restore continuity could resurrect a revoked grant | Journal first when reachable, else `journal: pending` with an alert; catch-up never a start gate |
| F-9 | Major | Refused attempts and attribution lost | `OPERATOR_REQUEST_REFUSED`; `channel_identity`; legacy attribution kept |
| F-10 | Major | Secret paths open | Fork call on the MCP proxy token; broker key never from the environment in live; kernel scrubbing |
| F-11, F-12, F-13 | Minor | Sessions, step split, citations | Bound sessions, real legacy files; kill inputs and legacy routes their own steps; citations corrected |

## SLICE-11 design review (2026-10-30)

A fresh `egm:egm-design` review of the deepened [configuration spec](../../design/configuration-artifacts-release.md), [runtime spec](../../design/runtime-isolation-observability-deployment.md) and [SLICE-11 slice file](../../plan/slices/SLICE-11-packaging-release-supervision.md). 10 Major, 4 Minor (F-1…F-14). The reviewer confirmed the boundary check before every deploy, the 20 s poll, the authority's restart settings, the absence of a watchdog and the monitor's read path. Every finding was checked and resolved by the helper.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Major | The release boundary checked once | Fork call: checked before the stop, after it and before the switch; `OLD_WRITER_GONE` |
| F-2 | Major | The pass schedule not phase-locked | Fork call: legacy's `seconds_to_next_pass` ported (:07, :27, :47) |
| F-3 | Major | Restart values from the wrong unit | Fork call: at-strategy's 60 s, 3 in 900 s; the no-trail gap stated (owner item) |
| F-4 | Major | 4000 vs 3600 | Fork call: legacy's field-by-field merge kept, live daily loss ₹3,600; PRF-CFG-11 |
| F-5 | Major | A release could be left half-switched | `UNITS_WRITTEN`, `MIGRATION_PENDING`, `KERNEL_STARTED`; restore stops the new set first; CP-R1…CP-R7 |
| F-6 | Major | A04-F3's start order missing | Observers first, then market, then kernel; convergence per operation |
| F-7 | Major | Credentials disagreed | Fork call: the market process keeps the OpenAlgo key; per-unit users and hardening; PRF-OPS-07 per unit |
| F-8 | Major | Deployed supervision before the shadow | PRF-OPS-09 moved to SLICE-13 |
| F-9 | Major | A hidden lease-store dependency | Fake lease store in tests; production refuses until `recovery.lease_store`; POL-O01 blocks step 10 |
| F-10 | Major | A02-F1 had no key or proof | REQ-CFG-010, PRF-CFG-10, `CFG-R14` |
| F-11 | Minor | A master gap recorded as a Deviation | Open, as an X item to raise |
| F-12, F-13, F-14 | Minor | Entrypoints, the transition log, backup and kill order | Each fixed |

## SLICE-12 design review (2026-10-30)

A fresh `egm:egm-design` review of the deepened [research spec](../../design/research-rl-custody-promotion.md) and the [SLICE-12 slice file](../../plan/slices/SLICE-12-research-rl-custody-promotion.md). 3 Blocker, 9 Major, 1 Minor, 1 Nit (F-1…F-14). The reviewer confirmed the custody state machine, claim-burns-partition, the bar's `>=` comparisons, the approval-mode defaults and the enforce default. Every finding was checked and resolved by the helper.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Blocker | Mid-session activation loosened the promotion gate | Fork call 11: an approval is used only by a session opened after it, on its date (owner item: approvals before the open) |
| F-2 | Blocker | No trusted source for "model-driven" at admission | `requires_promotion` per candidate in `BINDING_AUTHORIZED`; BuyerEdge `false`, proved |
| F-3 | Blocker | Inference configuration not enforced | Fork call 20: a model strategy's `CandidateId` covers prompt digest and model identity, as legacy's start check |
| F-4 | Major | Approval was a claim in record bytes | `promotion_verify` is the approval act; the caller recorded; owner-only for the estimated track |
| F-5 | Major | Restore could resurrect spent exam days | `not_initialized`, `restored_only`; `additive` stops both chains; `CUSTODY_WITNESSED` in the ledger |
| F-6 | Major | The locked read's three stores | The access ledger and order ported; CP-R2…CP-R7; a consistency scan; Fork call 21 (no completion after a crash) |
| F-7 | Major | The gate statistic not pinned | Wilson, `z` 1.96, clustered n, refuse when unmeasured; `promotion.directional.z` |
| F-8 | Major | The enforce switch vs the master | Fork call 12 kept; X item to raise |
| F-9 | Major | Metric disclosures not recorded | A disclosure log per evaluation over locked rows |
| F-10 | Major | A07-F3 acceptance not exercisable | A test-only reject/delay/partial rule; `pending`, `terminated`, `truncated` |
| F-11 | Major | Research imported the kernel | `bootstrap.py` composes an `EnginePort` |
| F-12, F-13, F-14 | Minor / Nit | Dependencies, digest parity, CP-R4 | In-test principals; `legacy_digest`; a no-replace link close |

## SLICE-08 step 3 review (2026-10-30)

A fresh `egm:egm-design` review of [SLICE-08 step 3](../../plan/slices/SLICE-08-market-data-and-views.md#step-3--views-and-quality), text **and code**: the code had been written before this review, against the package's usual order, and the review found what that order exists to catch. 3 Blocker, 12 Major, 2 Nit (F-1…F-17). An implementer reworked text and code; 1,020 tests passed twice and 31 break mutations each failed a test.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Blocker | Bars and corrections past the cutoff (lookahead) | Only windows confirmed by the cutoff; under `include`, the highest revision whose ticks all arrived by it |
| F-2 | Blocker | Revision 1 changed when a tick record was revised after its seal | Each window read as its seal saw it (`seq <= through_seq`) |
| F-14 | Blocker | SLICE-09's five reads missing | `chain`, `chains(minute)`, `spot_series`, `greeks_day`, `greeks_at`, with a cutoff earlier than resolution |
| F-3 | Major | Reopen not reproducible under a re-bound policy | A policy digest in the identity (`policy_changed`) |
| F-4 | Major | Selection not legacy's | Fork calls: the usable-spot filter, one exchange date, ties by value then sequence |
| F-5, F-6 | Major | Exact-minute rules and expiry order not legacy's | The oldest poll's records for the chain; `greeks_at`; expiries parsed in legacy's format |
| F-7 | Major | History bars not legacy's | Confirmation, one-minute only, legacy's defaults (Deviation: `ticks` 1) |
| F-8, F-9 | Major | `final` past the cutoff; quality under exact-minute | `min(watermark, cutoff)`; an anchor minute |
| F-10, F-11 | Major | Requirement fields unused; counts wrong | `interval_secs` used (Deviations for `session_reset`, `partial_bars`, zero classes); counts by visibility, `conflicted`, steps per stream |
| F-12 | Major | Every read scanned the whole store | Four bounded reads and a per-view cache |
| F-13 | Major | No spot fallback | Fork call: legacy's chain-poll join when the spot is dropped as stale |
| F-15, F-16, F-17 | Nit / Major | Reopen reasons, edge cases, thin tests | Precise reasons (`gone` not built: nothing is deleted yet); durations; 15:30 expected; the missing tests added |

## SLICE-13 and SLICE-14 design review (2026-10-30)

A fresh `egm:egm-design` review of the deepened [migration spec](../../design/migration-recovery-rollback-continuity.md) and the [SLICE-13](../../plan/slices/SLICE-13-disarmed-shadow-and-conversion.md) and [SLICE-14](../../plan/slices/SLICE-14-initial-cutover.md) slice files. 2 Blocker, 12 Major (F-1…F-14). The reviewer confirmed the legacy claims it could read and found no route from the shadow to the production order path. Every finding was checked and resolved by the helper, with the owner's 2026-10-30 answer (no hard gate on shadow days; the rehearsal on copies needs the owner's word).

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| F-1 | Blocker | Going back could leave two writers | `continue-legacy` masks every target unit, unlinks its key files, releases the lease `abnormal`; the kernel refuses every advance after `ROLLBACK_CONTINUATION` |
| F-2 | Blocker | A restore could bring the old route back | An off-host `RouteRetirement` at the first claim; `continue-legacy` refuses after it, after a restore marker or gap, or without the anchors; CP-X6 |
| F-3, F-4, F-5 | Major | The observer's key, the fence's check, the fence's enforcement | `OBSERVER_READY` and re-keying; `KEY_PROBED` (or "attested, not probed"); the kernel-side fence a step 1 completion condition |
| F-6 | Major | The copier could reach the broker key | The copier's lockdown; it refuses to start unless enforced; the rest runs as `at-shadow` |
| F-7 | Major | The comparison could approve its own differences | Approved differences from owner answers only, each with a condition and expected values |
| F-8 | Major | Required checks before cutover missing | PRF-OPS-09 in `CUTOVER_STAGED`; `BACKUP_ANCHORED` before any advance |
| F-9, F-10 | Major | Post-restore restarts; retries after a failed cutover | Superseded heads skipped; `FAILED_AFTER_ROTATION`, the old ledger set aside, the legacy restart the owner's action |
| F-11, F-12 | Major | Carried safety state; retained legacy tools | The kill flag, torn holds as held, pauses carried; retained tools keyless or through the observation route |
| F-13, F-14 | Major | Step order; the rehearsal's approval | The copier built in SLICE-13 step 2; SLICE-14 step 3 on the owner's word, with its isolation specified |
