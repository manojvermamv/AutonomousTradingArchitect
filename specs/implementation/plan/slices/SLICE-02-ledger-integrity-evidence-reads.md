# SLICE-02 — Ledger integrity, evidence store and independent reads

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-02-review-2026-10-27)). Built once on 2026-10-27 in a local repository (commit `b1c4002`, branch `slice-02`): 78 tests passed, including SLICE-01's, and every break check failed as required. That is a build record, not production acceptance.
* **Precedence:** the master README, then the master ROADMAP, then this package. This slice adds no decision; where it fills a gap the specs leave, the choice is named here and is engineering, not money policy.
* **Phase:** master Phase 1 (D04 and the ledger rules "in isolated target slices", `README.md:1181`). It adds no gate.
* **Environment class:** S (synthetic). The composition stays **disarmed**: no broker, no credentials, no legacy store, no network.
* **Builds on:** [SLICE-01](SLICE-01-disarmed-financial-core.md) as built (branch `slice-01`). Work on a branch `slice-02` cut from it.
* **Decisions and rules it proves:** D04, A03-F4 reader side, Combined-F2; REQ-LED-002 (anchoring), REQ-LED-003 (readers), REQ-LED-008, REQ-LED-009, REQ-LED-014, REQ-DOM-013; [X-007](../../consistency/master-contradictions.md#x-007).
* **Proofs it completes:** PRF-LED-08, PRF-LED-09 (SLICE-02 part), PRF-LED-10, PRF-LED-14, PRF-LED-15, PRF-DOM-05 (SLICE-02 part), PRF-LED-05 and PRF-LED-12 (evidence-store parts), PRF-LED-07 (TASK-S02-04 variants); the reader-impact measurement (TASK-S02-02).

**Excluded, and where each part arrives:**

| Not in SLICE-02 | Stand-in here | Arrives in |
|---|---|---|
| `kernel.recovery`, its stages and `RECOVERY_STAGE` | `bootstrap.compose_simulation` runs `RECOVERY_WRITING` steps 1–3 in the sessions spec's order | SLICE-03 |
| Where anchored heads are stored and when they are written | The caller passes `anchor=` | SLICE-03 and SLICE-11 |
| Fills, reductions, resolutions, I-4 and the fill terms of I-6 | PRF-LED-09 runs on the SLICE-01 events | SLICE-07 |
| Order IDs of an `evidence_unpublished` outcome in `broker_identity` | They stay in the outcome's `legs` only, so one-command-per-order-ID does not yet cover them | SLICE-07 (reconciliation assigns them) |
| Live outcome classes in export | `ExportUnsupported` for a `live` outcome | SLICE-07 |
| Evidence retention and storage classes; power-loss proof of evidence durability | One local root per ledger; process-crash tests only | SLICE-11 |

## Goal

1. Index tables are compared with `fold(empty, all events)` at every start, after the chain is verified; a difference refuses every write except the repair (D04), and a broken chain or unfoldable events refuse the repair too.
2. Pending migrations are applied forward, one transaction each; an unknown revision refuses the open.
3. A file without a supplied anchored head refuses the open.
4. Readers hold no snapshot between calls; a commit by any other connection is detected before the next commit.
5. Adapter evidence is published durably before the ledger may refer to it, and recovery rebuilds a lost outcome from it only when the evidence names that exact attempt and request.
6. Committed outcomes are exported with their outcome class.

## Files

New paths are in master README §6 (`README.md:1035-1042`, `:1070`, `:1102-1139`) or tree delta T-06. The slice commit changes exactly these **17 paths**.

| # | Path | New or changed | What changes |
|---|---|---|---|
| 1 | `pyproject.toml` | changed | `test` extra adds `"hypothesis>=6.100"` |
| 2 | `src/autonomous_trading/kernel/ledger/evidence_store.py` | new (T-23, X-007) | `EvidenceStore`, `EvidenceMissing`, `EvidenceConflict`, `attempt_file_name`, `atomic_write` |
| 3 | `src/autonomous_trading/kernel/ledger/export.py` | new | `export_outcomes`, `outcome_class`, `ExportUnsupported`, `ExportResult` |
| 4 | `src/autonomous_trading/kernel/ledger/store.py` | changed | Open with `evidence=`, `anchor=`; `AnchoredHead`; external-change detection; `apply_pending_migrations`; `verify_chain`, `read_index`, `check_index`, `repair_index`; activation from the chain; bounded `LedgerReader` |
| 5 | `src/autonomous_trading/kernel/ledger/schema.py` | changed | `Migration`, `KNOWN_SCHEMA_REVISIONS`, `pending`, `refuse_transaction_control` |
| 6 | `src/autonomous_trading/kernel/ledger/projections.py` | changed | `StoredEvent` gains `event_hash`, `evidence`; `INDEX_REPAIRED`; epoch and migration fold rules; `index_digest`, `rows_equal` |
| 7 | `src/autonomous_trading/resources/events.schema.json` | changed | `INDEX_REPAIRED` |
| 8 | `src/autonomous_trading/adapters/simulated_broker.py` | changed | Optional `evidence` store; publishes each result for its attempt |
| 9 | `src/autonomous_trading/kernel/coordinator.py` | changed | `evidence_unpublished`; `recover()` rebuilds from matching evidence; writer-loss refusals at admission raise |
| 10 | `src/autonomous_trading/bootstrap.py` | changed | `evidence_root`; `RECOVERY_WRITING` steps; closes the writer on failure |
| 11 | `src/autonomous_trading/operations/verification.py` | new | `measure_reader_impact` |
| 12 | `tests/conftest.py` | changed | Brokers built with the evidence store; `simulation(..., anchor=)` |
| 13 | `tests/unit/test_ledger_invariants.py` | new (T-06) | PRF-LED-09 |
| 14 | `tests/recovery/test_projection_integrity.py` | new | PRF-LED-08, PRF-LED-10, PRF-LED-15 |
| 15 | `tests/recovery/test_restore_fencing.py` | new | PRF-LED-14; the measurement run |
| 16 | `tests/recovery/test_crash_boundaries.py` | changed | Evidence parts of PRF-LED-05 and -07; TASK-S02-04; PRF-DOM-05; export |
| 17 | `tests/unit/test_command_identity.py` | changed | PRF-LED-12 evidence part; `test_reservation_cannot_go_back` reworked |

`operations/` is a namespace package. The master tree names no export test; the export cases live in `test_crash_boundaries.py`.

## Row 2 — `evidence_store.py`

```text
EvidenceMissing(Exception); EvidenceConflict(Exception)
EvidenceStore(root: Path, clock: Clock)
    publish(content: dict, *, attempt: tuple[str, int] | None = None) -> EvidenceRef
    resolve(ref: EvidenceRef) -> dict
    for_attempt(command_key: str, attempt_no: int) -> EvidenceRef | None
attempt_file_name(command_key, attempt_no) -> str     # sha256(canonical([command_key, attempt_no])).hexdigest()
atomic_write(path: Path, body: bytes) -> None
```

Three gaps in the [ledger spec](../../design/ledger-and-atomic-transaction.md#evidence-references-req-led-014) are filled here: the store takes a `Clock` for `published_at`; the attempt record is named by a digest, because command keys may differ only in case (NTFS folds case), may be long, and may contain `:`; and the record names its own attempt.

1. **Object.** `body = canonical(content)` as UTF-8; `d = sha256(body)`; path `<root>/objects/<d[0:2]>/<d>.json`. If the file exists **and** its bytes hash to `d`, it is kept; otherwise (absent, torn or altered) it is written with `atomic_write`.
2. **Attempt record** (`attempt=(key, n)`): `<root>/attempts/<attempt_file_name>`, holding `canonical({"command_key", "attempt_no", "content_digest", "published_at", "clock_domain"})`, written after the object. An existing readable record with digest `d` is kept; with another digest, `EvidenceConflict`; an unreadable one is rewritten.
3. **`published_at`:** with an attempt, the record's time (so a republish returns the first time); without one, `clock.now()` of this call.
4. **`atomic_write`:** create missing directories (on POSIX `fsync` each new directory's parent); write a `NamedTemporaryFile(dir=parent, delete=False, prefix=".tmp-")`; `flush`; `os.fsync`; close; rename into place: on Windows `MoveFileExW(src, dst, MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)` through `ctypes`, on POSIX `os.replace` then `fsync` of the directory. Any exception removes the temporary file and propagates. Process-crash safety is tested; power-loss durability is **not** proven by any test (SLICE-11).
5. **`resolve(ref)`:** `ref.store` must be `"evidence"` with a 64-character digest, else `EvidenceMissing`. A missing object (`FileNotFoundError`) or bytes that do not hash to the digest raise `EvidenceMissing`. Any **other** `OSError` (the object exists but cannot be read) propagates.
6. **`for_attempt(key, n)`:** no record → `None`; a record that is not valid JSON, or names another key or attempt → `EvidenceMissing`; otherwise `EvidenceRef("evidence", content_digest, Timestamp(published_at, clock_domain))`.

## Row 3 — `export.py`

```text
ExportUnsupported(Exception)
ExportResult(count: int, last_sequence: int, digest: str)
outcome_class(kind, execution_domain) -> str
export_outcomes(reader: LedgerReader, dest: Path, *, from_seq: int = 1) -> ExportResult
```

* `outcome_class`: `simulated`, `analyzer`, `unknown`, `conflicting` map to themselves; `live` raises `ExportUnsupported` (REQ-XC-007's live classes need reconciliation); anything else raises `ValueError`.
* One record per `OUTCOME_*` event, in sequence order: `{"sequence", "event_hash", "command_key", "attempt_no", "kind", "outcome_class", "evidence"}` (`evidence` is the stored array). The file is `canonical(record) + "\n"` per record, written with `atomic_write`. `digest` is the file's SHA-256; `last_sequence` is the last exported sequence, or `from_seq - 1`.

## Row 4 — `store.py`

### Open

```text
AnchoredHead(sequence: int, event_hash: str)
LedgerWriter.open(path, principal, epoch, clock, *, vfs=None, evidence: EvidenceStore | None = None,
                  anchor: AnchoredHead | None = None) -> LedgerWriter | Refusal
```

After SLICE-01's steps 0–4: if `anchor` is given and no event has that `sequence` **and** `event_hash`, return `LED-R11 head_behind_anchor` (closing and unlocking first). The sessions spec checks the anchor at activation; checking at open is earlier and stricter, a deliberate deviation. The writer then reads `PRAGMA data_version` as its baseline. `LedgerWriter` gains `evidence`, `failure_reason` (`None`, `"commit_failed"`, `"external_change"`, `"evidence_unreadable"`), `mismatch` and `unrepairable`.

### Activation

`activate_epoch` takes `retired_epoch_id` from the **last `EPOCH_ACTIVATED` event**, not from `authority_epoch`, because the index is not yet checked. The SLICE-01 tuple unpacking of `MIGRATIONS[0]` becomes attribute access (`first.number`, `first.name`, `first.file_name`).

### Transaction steps (changes to SLICE-01's)

* **Step 0, external change.** Only while the writer has not failed: if `PRAGMA data_version` differs from the baseline, mark it failed (`external_change`) and return `LED-R10 writer_failed`. It is read again right after `BEGIN IMMEDIATE`; a change there rolls back with the same result, so a commit between the check and the lock is never judged against changed rows.
* **Step 2, D04.** While `mismatch` is not empty, every decision except `INDEX_REPAIRED` returns `LED-R05 derived_state_mismatch`.
* **Step 4, evidence.** Every ref needs a 64-hex digest. A `simulated` ref is checked for form only. An `evidence` ref must resolve through `self.evidence`; no store, or `EvidenceMissing`, gives `LED-R06`.
* **Errors.** `BEGIN IMMEDIATE` is inside the error handling. `apsw.IOError`, `apsw.FullError` and `apsw.ReadOnlyError` (a read-only remount) give `CommitFailed` (`commit_failed`). `apsw.BusyError` (only a connection outside the writer lock can hold the write lock) fails the writer as `external_change`. An `OSError` from evidence that exists but cannot be read fails it as `evidence_unreadable`. Both return `LED-R10`; the kernel exits, as the [dispatch spec](../../design/dispatch-and-coordination.md#coordinator-loop-on-the-writer-thread-one-io-worker-per-account) requires.

**What changes `data_version`** (measured on SQLite 3.54.1): a commit by another connection does; a reader opening, reading or closing does not; another connection's `PASSIVE` checkpoint does not; another connection's `TRUNCATE` checkpoint **does**. So only the writer may run `RESTART` or `TRUNCATE` checkpoints. One from any other connection is treated as an external change: the kernel restarts through recovery, which costs a restart, never money.

### Migrations (TASK-S02-06)

```text
LedgerWriter.apply_pending_migrations() -> list[Committed] | Refusal
```

For each of `schema.pending(conn)`, in order: `schema.refuse_transaction_control(text)` (raises `ValueError`), then one transaction through the step 0–3 checks: execute the text, append and fold `MIGRATION_APPLIED`, commit. The first refusal is returned; an SQL error rolls back and propagates (CP-L6). A migration that changes an index table's columns ships with the matching `fold` change, or D04 reports every start.

### D04 (TASK-S02-01)

```text
LedgerWriter.verify_chain() -> bool
LedgerWriter.read_index() -> IndexRows
LedgerWriter.check_index() -> list[str]
LedgerWriter.repair_index() -> Committed | Refusal
```

* `verify_chain` recomputes every `prev_hash` link and `event_hash = digest(envelope(row))`.
* `check_index`: if the chain is broken, `unrepairable = "chain_broken"`; else if `fold({}, all events)` raises `TransitionNotAllowed` or `InvariantViolated`, `unrepairable = "events_unfoldable"`; in either case `mismatch = [unrepairable]`. Otherwise `mismatch` = the `TABLES` whose rows differ (`rows_equal`). Returns `mismatch`.
* `repair_index`: with `unrepairable` set, `Refusal("LED-R05", unrepairable, None, "INDEX_REPAIRED")` and nothing is written: an edited chain is never adopted. Otherwise one transaction: append `INDEX_REPAIRED {"tables", "before_digest" (current index), "after_digest" (rebuilt)}` (family `recovery`), `DELETE FROM` each table in reverse `TABLES` order, insert `fold({}, all events)`, commit, clear `mismatch`.

### Readers

Only `LedgerReader` wraps its methods (`events`, `command`, `latest_attempt`, `attempts`, `reservation`, `head`) in `BEGIN` … `COMMIT`, every cursor consumed; the shared `_Reads` methods stay bare, because the writer calls them inside its own transaction. `events` returns `event_hash` and `evidence`.

## Row 5 — `schema.py`

* `Migration(number, name, file_name)` (frozen dataclass); `MIGRATIONS = [Migration(1, "initial", "001_initial.sql")]`; `KNOWN_SCHEMA_REVISIONS = {"1"}`.
* `pending(conn)`: bundle migrations above the highest integer `migration_number` among `MIGRATION_APPLIED` **events** (default 1; an edited payload is skipped, D04's to report).
* `check`: `LED-R04` unless `schema_revision ∈ KNOWN_SCHEMA_REVISIONS` and `int(migration_revision) <= max(m.number)`.
* `refuse_transaction_control(text)`: after removing `CREATE TRIGGER … END` bodies, any `BEGIN`, `COMMIT`, `END`, `ROLLBACK`, `SAVEPOINT`, `RELEASE` or `VACUUM` word raises `ValueError`.

## Row 6 — `projections.py`

* `StoredEvent` gains `event_hash: str = ""` and `evidence: tuple = ()`.
* `EPOCH_ACTIVATED`: a `retired_epoch_id` of `null` while any row is `active` raises `TransitionNotAllowed` (a second active epoch); a named retired epoch with no row is skipped, an index fault for D04, so activation is never blocked by the index.
* `MIGRATION_APPLIED`: `migration_revision` = `max(current row value, migration_number)`, or `migration_number` when no row exists.
* `INDEX_REPAIRED` folds to no rows. `index_digest(rows)` = `digest({t: sorted((canonical(list(k)), canonical(r)))})`; `rows_equal` compares keys and values exactly.

## Row 7 — `events.schema.json`

Adds `"INDEX_REPAIRED": {"tables": "array", "before_digest": "string", "after_digest": "string"}`.

## Row 8 — simulated broker

`SimulatedBroker(responder, clock, coverage="yes", evidence=None)`. With a store it publishes, keyed `(key, n)`: `{"kind": "transport_result", "command_key", "attempt_no", "request_digest": digest(wire(request)), "cls", "legs", "domain": "simulated", "step"}`; `raw` is the returned ref, or `None` if `publish` raises `OSError` or `EvidenceConflict` (F-O11). A `raise` step publishes nothing.

## Row 9 — coordinator

`Coordinator(..., evidence=None)`.

* **Admission refusal from a lost writer.** A `t1` refusal `LED-R03`, `LED-R05` or `LED-R10` raises `WriterLost`; other `t1` refusals return as in SLICE-01.
* **Unpublished evidence.** With a store, `result.raw is None` and not the coordinator's own `adapter_error` path: commit `OUTCOME_AMBIGUOUS`, reason `evidence_unpublished`, legs re-classed `ambiguous` with broker IDs kept, no evidence ref.
* **`recover()`**, per retired-epoch `CLAIMED` attempt in `claimed_sequence` order, guard `StateGuard({"IN_FLIGHT"}, n, "retired")`, payload `epoch_id` = the attempt's epoch:

  | Evidence | Commits |
  |---|---|
  | No store, or `for_attempt` is `None` | `OUTCOME_AMBIGUOUS`, `interrupted`, domain `unknown` |
  | `for_attempt` or `resolve` raises `EvidenceMissing` | `OUTCOME_AMBIGUOUS`, `evidence_unusable`, domain `unknown` |
  | Content's `(command_key, attempt_no, request_digest)` ≠ the attempt's key, number and the command row's `request_digest` | `OUTCOME_AMBIGUOUS`, `evidence_unusable` (evidence from another command or request is never adopted) |
  | Matches | The rebuilt `OUTCOME_<CLS>` with `(ref,)` as evidence; if refused `LED-R06` or `LED-R08`, `OUTCOME_AMBIGUOUS` `evidence_unusable` |

  Never calls the broker.

## Row 10 — bootstrap

`evidence_root(path) = Path(path).with_name(name + ".evidence")`; `Composition` gains `evidence` and `recovery`. Steps: settings checks; store; open (refusal → `SettingsError`); `activate_epoch`; `apply_pending_migrations`; `check_index` and, on a mismatch, `repair_index`; `Coordinator(..., evidence)`; `recover()`. Any refusal in these steps raises `WriterLost`; any exception or refusal closes the writer before propagating. `recovery = {"migrations", "repaired", "recovered"}`.

## Row 11 — `operations/verification.py`

`measure_reader_impact(path, *, entries, reads_per_entry, clock) -> dict`: a composition on `path` with capacity `entries × 1500.00` and a broker publishing to `evidence_root(path)`; entry `i` uses key `measure-<i>`, order ID `M<i>`, and the SLICE-01 fixture's values (account `["sim", "acct-sim"]`, application `proceed`, one 75-lot leg, `"1500.00"` each); after each entry, `reads_per_entry` calls of `LedgerReader.events()` on one reader. Returns `entries`, `events`, `wal_bytes_max`, `checkpoint` (`PRAGMA wal_checkpoint(TRUNCATE)` on the writer with the reader open), `fold_seconds` (one `check_index`), `sqlite_version`. Reader and writer are closed before it returns. No threshold is set.

## Tests and expected outcomes

### `tests/recovery/test_projection_integrity.py`

| Test | Expected outcome | Proof |
|---|---|---|
| `test_altered_command_row_refused` | After an ack entry, a side `UPDATE command_identity SET state='ADMITTED'`; a hand-opened writer after `activate_epoch`: `check_index() == ["command_identity"]`; any decision `LED-R05`; head unchanged | PRF-LED-08 |
| `test_altered_meta_row_refused` | `migration_revision='0'`: `["ledger_meta"]` | PRF-LED-08 |
| `test_repair_clears_mismatch` | `INDEX_REPAIRED` with `tables == ["command_identity"]` and differing digests; then `[]`; command `WORKING`; a fresh-key `ADMISSION_REFUSED` decision commits | PRF-LED-08 |
| `test_composition_repairs_at_start` | Through the composition: last event `INDEX_REPAIRED`; `recovery["repaired"] == ["command_identity"]` | PRF-LED-08 |
| `test_composition_repairs_index_it_reads_first` | Parametrized: `migration_revision='0'` → `["ledger_meta"]`; the active `authority_epoch` row deleted → `["authority_epoch"]`; both clean afterwards | PRF-LED-08 (design review F1) |
| `test_broken_chain_is_not_repaired` | An edited event (triggers dropped): `check_index() == ["chain_broken"]`; `repair_index` refused `LED-R05 chain_broken`; the composition raises `WriterLost` | PRF-LED-08 (F6) |
| `test_migration_transaction_control_refused` | A migration containing `COMMIT`: the composition raises `ValueError` | CP-L6 (F9) |
| `test_unknown_schema_refused` | `schema_revision='9'` or `migration_revision='2'`: open `LED-R04`; event count unchanged | PRF-LED-10 |
| `test_pending_migration_applied` | A test migration 2 (monkeypatched bundle): applied once after the reopen events; table exists; revision `"2"`; a second reopen applies nothing | PRF-LED-10 |
| `test_crash_mid_migration` | Failing text: `apsw.SQLError`; no table; revision `"1"`; the good text then applies once | PRF-LED-10 (CP-L6) |
| `test_anchor_behind` | Last head anchored, then events above `sequence − 2` deleted: `LED-R11 head_behind_anchor` | PRF-LED-15 |
| `test_anchor_present` | Accepted; with another hash, `LED-R11` | PRF-LED-15 |

The bundle helper always starts from the shipped `MIGRATIONS`, so patching twice never adds migration 2 twice.

### `tests/recovery/test_restore_fencing.py`

| Test | Expected outcome | Proof |
|---|---|---|
| `test_second_writer_refused` | `LED-R07` | PRF-LED-14 |
| `test_reader_holds_no_snapshot` | After every reader method `get_autocommit()` is `True`; after an ack entry, the writer's `TRUNCATE` checkpoint returns `busy == 0`, `log == checkpointed` with the reader open | PRF-LED-14 |
| `test_external_write_detected` | A side `INSERT INTO ledger_meta`: `submit_entry` raises `WriterLost` (`LED-R10`); `failure_reason == "external_change"` | PRF-LED-14 |
| `test_reader_close_and_passive_checkpoint_are_not_writes` | A reader closing and a side `PASSIVE` checkpoint: the next entry is acknowledged; `failure_reason is None` | PRF-LED-14 (F8) |
| `test_outside_truncate_checkpoint_counts_as_external` | A side `TRUNCATE` checkpoint: `WriterLost`; `external_change` | PRF-LED-14 |
| `test_reader_impact_measured` | 50 entries, 3 reads each: `checkpoint[0] == 0`, `checkpoint[1] == checkpoint[2]`, `events == 153` | TASK-S02-02 |

### `tests/unit/test_ledger_invariants.py`

A Hypothesis `RuleBasedStateMachine` (`max_examples=25`, `stateful_step_count=12`, `deadline=None`), each example on a fresh ledger under `AT_TEST_ROOT`, capacity `"6000.00"` so four entries always fit; `teardown` closes the writer. Rules: `submit(n ∈ 1..4, result ∈ {ack, reject, not_sent, timeout, raise})` (a step is scripted only when key `inv-<n>` has no command; ack order IDs are unique) and `restart()`. Invariants after every rule: I-2; I-3 by command state; I-5 (`check_index() == []`); I-6 SLICE-02 part (each reservation's amount equals its admitted amount); the chain recomputes.

### `tests/recovery/test_crash_boundaries.py`

The child driver builds its broker with the evidence store and takes an optional fourth argument, another command key.

| Test | Expected outcome | Proof |
|---|---|---|
| `test_cp_l3a` | Unchanged: `interrupted` | PRF-LED-05 |
| `test_cp_l3b` | Rebuilt `OUTCOME_ACKNOWLEDGED` after the reopen events; `raw_digest` = `for_attempt(key, 1)`'s digest; `WORKING`, `ACKNOWLEDGED`, `HELD`; one `broker_identity` row `ORD1`; 0 broker calls | PRF-LED-05, PRF-DOM-05 (CP-O1) |
| `test_commit_failure` | Parametrized `FullError`, `IOError`, `ReadOnlyError`; the reopen is the `test_cp_l3b` result | PRF-LED-07, TASK-S02-04 |
| `test_republish_is_noop` | Same digest twice, one object file; other content → `EvidenceConflict`; `for_attempt` equals the first ref | PRF-DOM-05 |
| `test_unpublished_evidence` | `publish` raising `OSError`: `ambiguous`; reason `evidence_unpublished`; evidence `[]`; legs keep `ORD1` | PRF-DOM-05 (F-O11) |
| `test_unusable_evidence` | After CP-L3b, objects overwritten: `evidence_unusable` | PRF-LED-05 |
| `test_evidence_for_another_request_is_unusable` | After CP-L3a, a record for the attempt with another `request_digest`: `evidence_unusable`; no `broker_identity` row | PRF-LED-05 (F2) |
| `test_torn_object_rewritten_and_torn_record_unusable` | A torn object is rewritten whole by a republish; a torn record makes `for_attempt` raise `EvidenceMissing` | F7 |
| `test_export_classes` | An ack entry, then a CP-L3a crash on key `slice01-entry-0002`, reopen: export classes `["simulated", "unknown"]` in sequence order; the first record's ref resolves when rebuilt as `EvidenceRef("evidence", d, Timestamp(published_at, "recorded"))`; `digest` = file SHA-256 | REQ-LED-014 |
| `test_export_live_unsupported` | `ExportUnsupported` | REQ-LED-014 |

### `tests/unit/test_command_identity.py`

* `test_reservation_cannot_go_back` (reworked): after the `LED-R09` claim, **close** the composition's writer, make the side `UPDATE`, open a writer by hand (new epoch, `activate_epoch`, no `check_index`), and the claim returns `LED-R08`. (With the writer open, the side write now gives `LED-R10`.)
* `test_evidence_ref_resolves`: a ref published through `composition.evidence` passes step 4 (the decision then fails its guard, `LED-R09`); an unpublished digest gives `LED-R06`.

**Break checks** (each tried once on the build and reverted; all failed their tests):

| Change | Test file that fails |
|---|---|
| The composition skips `check_index`; or `check_index` reports no tables | `test_projection_integrity.py` |
| Remove **both** `data_version` reads; or leave the reader transaction open | `test_restore_fencing.py` |
| `fold` leaves the reservation `RESERVED` on `DISPATCH_CLAIMED` | `test_ledger_invariants.py` |
| Commit an `evidence` ref without resolving it in step 4 | `test_command_identity.py` |
| `recover()` ignores published evidence | `test_crash_boundaries.py` |

## Build order and checkpoints

| Step | Rows | Passes before the next step |
|---|---|---|
| 1 | 2, 5, 6, 7, and row 4's activation change | the SLICE-01 suite |
| 2 | the rest of 4 | `test_projection_integrity.py`, `test_restore_fencing.py` without the measurement |
| 3 | 8, 9, 10, 12, 16, 17 | `test_crash_boundaries.py`, `test_command_identity.py` |
| 4 | 1, 3, 11, 13 | the full suite through `scripts/safe_tests.py` |

## Completion conditions

1. Every SLICE-01 and SLICE-02 test passes in a clean virtual environment with no broker variables.
2. The slice commit changes exactly the 17 paths.
3. Each break check was tried and reverted.
4. The measurement is recorded below.

## Measurement record

2026-10-27, Windows 11, Python 3.14, APSW with SQLite 3.54.1, local SSD; `measure_reader_impact(entries=500, reads_per_entry=3)`:

| `events` | `wal_bytes_max` | `checkpoint` (busy, log, checkpointed) | `fold_seconds` |
|---|---|---|---|
| 1503 | 4,169,472 | (0, 0, 0) | 0.173 |

The WAL stays near SQLite's default auto-checkpoint size (1000 pages) while a reader polls between commits, and the final `TRUNCATE` checkpoint completes with the reader open. D04's full fold of 1503 events took 0.17 s. These are one run's evidence (class M), not limits; the production host's numbers belong to TASK-S11-07.

## Migration and rollback

* **Legacy data:** none.
* **Rollback:** delete the `slice-02` branch.

## Prerequisites

SLICE-01. No open owner question; X-007 is answered.
