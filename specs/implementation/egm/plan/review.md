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
