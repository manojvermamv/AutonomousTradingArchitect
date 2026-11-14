# SLICE-13 — Disarmed shadow, compatibility projections and conversion method

* **Status:** proposed (2026-10-30); not yet reviewed by fresh EGM design and implementation-readiness reviewers. Every step below is an outline: by the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30), each step's exact detail (files, signatures, test tables, break checks) is written just before it is built, then reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [migration spec](../../design/migration-recovery-rollback-continuity.md). Every intentional difference from legacy is marked **Deviation**; a money-touching fork would keep legacy's live behaviour and be marked **Fork call** (none arises here: [below](#fork-calls)). No score, threshold or money value is set here.
* **Phase:** master Phase 4 (`README.md:1184`): D02 ownership shown in a disarmed shadow, A10-F3 compatibility, the AUD-05/A04-F4 comparison, A02-F5 accounting. Environment class S for steps 1–5. Steps 2 and 6 read production legacy trading stores (never research records) into separate copies and ledgers on the EC2, which is class D and **pre-approved** by the standing rules ("the disarmed shadow (SLICE-13)"). Reading a copy of the production research records is not pre-approved ([combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30)) and is not done here. Step 7 needs **the owner's word** only when it starts a process holding an OpenAlgo key on the production host.
* **Builds on:** SLICE-07 (the reconciliation and the simulated broker), SLICE-11 (the participant contract, `scripts/isolated_work.py`, `at.slice`, the bundle; step 8's backup-API copy and the `DirectoryLeaseStore`), as the delivery plan says; and, a **Deviation from the delivery plan's prerequisites**, SLICE-08 (the market store and `MarketSource`) and SLICE-09 (the strategy host, BuyerEdge and recorded-response replay), which the shadow runs. The build order already puts both before SLICE-11. The branch `slice-13` is cut from the latest built slice on `agentic-desk`.
* **Owner answers applied:** [Q-005](../../decisions/owner-questions.md#q-005) (BuyerEdge on the current account: the shadow's scope); [X-002](../../consistency/master-contradictions.md#x-002) (schema 1 stays provisional until TASK-S13-01); [Q-016](../../decisions/owner-questions.md#q-016) (legacy orders the shadow never made are foreign activity, escalated); [Q-007](../../decisions/owner-questions.md#q-007) (no adoption by shape); the answers that record a difference from legacy (Q-003, Q-026, Q-027, Q-029, Q-030), which become the comparison's only approved differences; the [combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30) (one or two clean end-to-end shadow days are enough; nothing in code counts days or refuses on them); the standing rules (boundary: the shadow is pre-approved; fork rule).
* **Tasks and proofs:**
  * **Step 1:** TASK-S13-04: PRF-MIG-06.
  * **Step 2:** TASK-S13-01 (with the copier, TASK-S13-08): PRF-MIG-08, PRF-MIG-11 (copier rows).
  * **Step 3:** TASK-S13-05: PRF-MIG-07.
  * **Step 4:** TASK-S13-03: PRF-MIG-09, PRF-LED-06.
  * **Step 5:** TASK-S13-02: PRF-MIG-10, PRF-MIG-11 (composition rows).
  * **Step 6:** TASK-S13-06: PRF-MIG-12.
  * **Step 7 (owner's word when a key holder starts):** TASK-S13-07: PRF-OPS-09, which the cutover requires at `CUTOVER_STAGED` (SLICE-14).

**In plain words.** This slice lets the new system run beside the old one for real, without any way to trade, and checks that it would have done the same things. Step 1 teaches the new system to read every kind of file the old system writes, byte for byte, without ever touching them. Step 2 builds the locked-down copier that takes copies of the old system's files without any way to see its broker key, and decides, from evidence, how the old history moves into the new ledger: upgrade the old ledger file, or start a new one and copy the history in; the reason is written down. Step 3 builds that copy and counts every old record as moved, refused or set aside. Step 4 makes the new ledger write the old system's order file format, so the old reports and research tools keep working. Step 5 builds the "shadow": the new kernel and BuyerEdge fed from copies of the old system's price and order files, answering its own would-be orders with what the old system really got, holding no broker key. Step 6 runs it on the trading server every day and compares, each evening, plans, money held back, quantities, stops and unknown outcomes; every difference is either one the owner already approved, under the exact condition the owner's answer covers, or a defect. One or two clean days are enough for the owner; nothing counts them. Step 7 lets the supervisor check its view against the broker's books, which needs the owner's word if that means starting something that holds the broker key. Nothing here can place an order, and no trading rule changes.

**Excluded, and where each part arrives:**

* **SLICE-11:** the recovery set, backup, restore, anchors, the production lease store and the D10 rehearsal (steps 8 and 11); staging the candidate on the production host (step 10, owner's word). The shadow does not need step 10: it installs the candidate wheel under its own root.
* **SLICE-14:** the production ledger's import, the key replacement, the cutover and the retirement of the old route; legacy's units are never stopped here.
* **SLICE-12 and the owner:** importing the deployed research custody chain and trial records (research is deferred in the first release; reading research custody waits for the owner's word, [SLICE-12](SLICE-12-research-rl-custody-promotion.md)). The readers for those formats are SLICE-12's.
* **Integration edits outside this file and the spec,** made when each step is reviewed: the [ledger spec](../../design/ledger-and-atomic-transaction.md) event catalogue and `resources/events.schema.json` (`IMPORT_BOUNDARY_PINNED`, `LEGACY_RECORD_IMPORTED`, `LEGACY_RECORD_REJECTED`, `LEGACY_RECORD_QUARANTINED`, `IMPORT_COMPLETED`; the `import_manifest` row now specified); the [configuration spec](../../design/configuration-artifacts-release.md) composition table (`shadow`, the migration composition); the [runtime spec](../../design/runtime-isolation-observability-deployment.md) storage-class table (a derived class for `paths.compat` and the shadow root); the module index (tree deltas T-90…T-95, T-99…T-104, T-106, T-107 and T-112…T-117); the traceability rows for REQ-MIG-011…013 and every REQ-MIG proof; the delivery plan's SLICE-13 row and task rows.

## Steps

| Step | Builds | Class | Proofs |
|---|---|---|---|
| 1 | The legacy readers in `adapters/compatibility.py`; synthetic legacy fixtures generated once from legacy's own writers at 445eb116 (T-93) by a generator run against a legacy checkout, never in the suite (T-94); the characterization of what legacy's registry lines record about fills | S | PRF-MIG-06 |
| 2 | The copier with its lockdown (a command run through `scripts/isolated_work.py`, refusing to start when any property is unenforced); the upgrade-versus-import comparison: the mapping table over the fixtures and over a backup-API copy of the production legacy ledger that the copier takes, the criteria results, the decision in `docs/decisions.md`, `001_initial.sql` confirmed or replaced | S → D (pre-approved copy) | PRF-MIG-08, PRF-MIG-11 (copier rows) |
| 3 | `scripts/migrate_legacy.py` for the chosen route: the migration composition in `bootstrap.py`, the boundary pin, the per-record events, `010_import.sql` (T-91; 009 is taken by SLICE-12) and its fold into D04, batches, resume, anomalies, same-boundary validation | S | PRF-MIG-07 |
| 4 | The `orders/1` projection: its serializer in `adapters/compatibility.py`; the projector and its read-only refresher thread in `kernel/ledger/export.py`, requested by the host after every pass, never on the send path; the sidecar and its scoped rebuild; the forbidden roots; the consumer list in `docs/migration.md`; the import guard; parity proved with legacy's own readers | S | PRF-MIG-09, PRF-LED-06 |
| 5 | `compose_shadow` and `COMPOSITIONS["shadow"]`; one shadow process driven in legacy's recorded time (`operations/shadow_run.py`); `LegacyOutcomeResponder` and `LegacyBooks` (`adapters/legacy_responder.py`), `LegacyMarketFeed` (`adapters/legacy_market.py`); `scripts/compare_parity.py shadow` with the head pair, the exact comparison set, the gate table and the owner-only approved-difference table | S | PRF-MIG-10, PRF-MIG-11 (composition rows) |
| 6 | **Void (2026-11-13, server lost; see SLICE-15).** The shadow on the production host: the candidate wheel under `paths.shadow.root`, the copier and the shadow processes as transient units through `scripts/isolated_work.py`, the nightly import rehearsal, the daily comparison reports, the first night's measurement of the copy's effect on legacy's commits | D (pre-approved) | PRF-MIG-12 |
| 7 | **Void (2026-11-13, server lost; see SLICE-15).** The supervisor against the shadow ledger, reading the broker only through the observation route, within the read budget left after legacy's own load | D; **owner's word** when the route starts a key holder | PRF-OPS-09 |

**Why this order.** Every later step reads legacy's formats through step 1's readers, and the fixtures are the only legacy data the suite may use (A08-F4). The importer's handling of legacy's ledger depends on the route, so the comparison (step 2) comes before the importer (step 3); the readers and the mapping table are what the comparison measures, and its production census needs a copy of legacy's ledger, so the copier is built and proved in step 2, before its first production use, and reused unchanged by steps 5 and 6. The projection (step 4) is independent of the shadow but the shadow's kernel writes it, so it comes before step 5. Steps 6 and 7 run what steps 1–5 built, on production copies. Step 4 may be built in parallel with step 3 by a second agent owning `kernel/ledger/export.py` and the serializer only.

## Fork calls

None. The shadow holds no key and its responder cannot send (PRF-MIG-11); the projection feeds no decision (PRF-MIG-09's import guard); the importer never creates a target command, reservation or position. The comparison's approved differences are the owner's existing answers, each already recorded where it was decided; this slice adds none. Two were made after step 5, in "Fixes after step 5 (2026-11-12)": capacity's absent broker amounts count zero as on legacy's reservation path, and protection makes no attempt after the session's close.

## Deviations

* **The shadow decides as well as imports.** Legacy's own shadow only fed legacy's stores into a shadow ledger and compared the views folded from them (`src/tier1/shadow.py:1-21`; `src/tier1/compare.py:1-22`). The target's shadow also runs the target's kernel and BuyerEdge on the same inputs and compares their decisions, as `README.md:1199` requires.
* **The shadow reads copies.** Legacy's feeder read the live files in place (`src/tier1/shadow.py:13-17`). The target's copier is the one shadow process that runs as legacy's user, locked down so it sees no other process, only legacy's store directories (read-only), no settings or key file, no socket and no network; every other shadow process runs as `at-shadow` on the copies. Legacy's authority and strategy run as that user with the shared settings file in their environment (`deploy/systemd/at-tier1-authority.service:29-32`, `deploy/systemd/at-strategy.service:34-37`), which is why the lockdown is needed.
* **The JSONL is generated after the commit.** Legacy writes each registry line before the request leaves (`src/core/framework/execution/registry.py:15-22`, `:186-275`); the target's `orders/1` is written after the outcome commit and may lag (`compat_projection`). Only legacy's own money path needed write-before-send, and it is not served (the consumer list).
* **The projection lives in `paths.compat`,** never in legacy's run directory (no write to a legacy store).
* **Strategy decision records are not projected** in the first release; the target records decisions through the kernel (SLICE-09), and no retained consumer of legacy's decision files was found.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root.

* **The Tier-1 ledger.** Schema version 1 only, refusing any other (`src/tier1/schema.py:10-102`, `:130-136`); provenance limited to three values (`:24-25`); the hashed envelope (`src/tier1/envelope.py:42-50`, `:89-117`); the ledger at `run/tier1/authority.db` (`config/defaults.yaml:1869`).
* **The stores beside it.** Twenty-three surveyed stores with their writers, readers, locks and durability (`src/tier1/importer/authority-map.md:24-48`); the execution registry's line format, writer and fold (`src/core/framework/execution/registry.py:114-158`, `:186-275`, `:1858-1898`); the strategy decision files (`src/core/framework/observe/decisions.py:91-110`); the live market store's streams (`src/data/marketdata/store.py:1-39`).
* **The importer.** Read-only sources in two shapes, deferred trailing lines, chain checks (`src/tier1/importer/sources.py:1-16`, `:117-168`, `:238-282`); one event per record with the raw bytes' digest, one manifest row per import, resume by scanning the ledger, anomalies stop a file (`src/tier1/importer/__init__.py:1-21`, `:73-128`, `:165-217`); the manifest and its repair (`src/tier1/importer/manifest.py:1-100`).
* **The shadow feeder and comparator.** One writer pass per interval, 30 s by default, importing only new records (`src/tier1/shadow.py:40-73`); legacy views rebuilt by legacy's own readers against views folded from the imported events, every difference a defect unless a recorded migration explains it (`src/tier1/compare.py:1-60`).
* **The registry's readers** (the projection's consumer list): `monitoring/account_pnl_service.py:33`, `:88`; `monitoring/checks.py:278-281`; `monitoring/sources.py:102-103`; `src/interfaces/cli/orders.py:98`; `src/analysis/core/from_registry.py:80`; `src/analysis/datasets/__init__.py:2725-2733`; `scripts/acceptance_capture.py:180-188`; `scripts/determinism_gate.py:904-906`; `scripts/reconcile_costs.py:56`; and legacy's money path, `src/runtime/execution_gateway/__init__.py:575-580`, `src/runtime/session_state.py:52-53`, `src/runtime/tier1_authority/service.py:305-312`, `scripts/run_framework_live.py:5514-5517`.
* **Who can read legacy's stores.** The ledger directory is made `0700` for legacy's user (`src/tier1/activation.py:93-104`).

## Step 1 — legacy readers and fixtures

<a id="step-1--legacy-readers-and-fixtures-outline"></a>

The authority is the migration spec's [legacy readers](../../design/migration-recovery-rollback-continuity.md#legacy-readers-adapterscompatibilitypy) and PRF-MIG-06. Step 1 is TASK-S13-04. It reads legacy's formats and converts nothing: no record is given a target meaning here (that is step 2's mapping and step 3's importer), so under the coordinator's rule it is planned and built in one pass, with no separate review and no break checks. Legacy citations are at 445eb116.

**In plain words.** The new system learns to read every file the old system writes, exactly as the old system's own importer reads them, without changing, locking or creating anything. The test data is made once by the old system's own code, so the new readers are checked against the real format, and the tests never run old code.

### Decisions

* **One module, legacy's importer ported.** `adapters/compatibility.py` is the only target module that reads a legacy format. Its JSONL and snapshot readers are legacy's `src/tier1/importer/sources.py` ported line for line: the two shapes (`:1-16`), the source table with its patterns, fixed paths, identity keys, chains and store rows (`:117-168`), the dot-file skip (`:191-203`), canonical-JSON parsing (`:214-225`), the three integrity chains (`:228-266`), deferred trailing lines (`:269-282`), absence as state and the size-and-mtime cache (`:289-338`), and `source_digest` (`:79-83`). Each record is legacy's `LegacyRecord` (`:47-63`) plus one field, `reader` (the format name, for example `registry/1`). The canonical check is legacy's `envelope._check` and `canonical` (`src/tier1/envelope.py:27-46`), copied, because the target may not import legacy code.
* **Reader names.** `registry/1` (row 1, with its `STRUCTURE_STATE` rows), `reservations/1` (2), `reservation_markers/1` (3), `sender_lease/1` (4), `kill_file/1` (5), `holds/1` (6), `session_checkpoints/1` (7), `strategy_authority/1` (8), `structure_commands/1` (9), `ai_pauses/1` (10), `config_profiles/1` (12), `candidate_approvals/1` (13), `session_bindings/1` (14), `governance_evidence/1` (15), `arbitration/1` (16), `plans/1` (17), `loss_latch/1` (23). A record's `source` stays legacy's source name (`execution_registry`, ...), so it matches what legacy's importer already wrote into the Tier-1 ledger.
* **`tier1_ledger/1`.** Opens a backup-API copy through APSW with `file:<path>?mode=ro&immutable=1`, so no `-wal`, `-shm` or lock file is created and nothing is written. It refuses any `schema_version` other than 1 (legacy's `schema.check`, `src/tier1/schema.py:130-136`). Each `ledger_event` row is one record: `line` is its `sequence`, `raw` is the canonical JSON of the 25 stored columns with the three JSON columns kept as their stored text, and `record` is the envelope legacy's `_stored` rebuilds (`src/tier1/ledger.py:317-326`) plus `event_hash`. Every row gets a chain verdict by legacy's `verify` rules (sequence, link, recomputed hash; `src/tier1/ledger.py:299-314`); the read also returns legacy's own summary (`ok`, `count`, `head` or `first_break` and `problem`). Every other table, including any this code does not know, is returned whole as rows, so step 2's mapping can account for each.
* **`decisions/1` and `market_ndjson/1`** are gzip logs of one member per append (`src/core/framework/observe/decisions.py:91-110`, `src/data/marketdata/store.py:258-383`). The reader walks members as legacy's readers do (`decisions.member_lines`, `:113-140`; `store._members` and `_records_resyncing`, `:758-840`): each line of a complete member is one record (`line` counts lines in the file, `offset` is the member's byte offset, `raw` is the line's bytes); a member still being written at the end of the file is deferred, as `_members` defers it; a member that does not decode is one record with an error and its compressed bytes as `raw`, and the walk resumes at the next gzip header, as legacy resyncs. Patterns: `decisions/*/*.ndjson.gz` and legacy's doubled `decisions/decisions/*/*.ndjson.gz` (`decisions.py:174-180`) under the run directory; `{spot,chain,greeks,ticks}/*/*.ndjson.gz` under the market root. The `.seq` sidecars, `.lock` files and the market `journal/` are not records.
* **Never writes, never locks, never imports legacy.** Files are opened `rb` and read whole; the module calls no `flock`, `mkdir`, `chmod`, rename, unlink or write.

### Fixtures and their generator

* **`scripts/gen_legacy_fixtures.py`** (T-94) runs once, with `python -I`, against an export of OA at 445eb116, as `scripts/gen_fold_parity.py` does. On Windows it installs a no-op `fcntl` stand-in before importing legacy (the locks are not part of the bytes). It writes `tests/fixtures/legacy_stores/` (T-93) through legacy's own writers, with labelled synthetic values (account fingerprints, prices and quantities are invented, never production data):
  * `run/`: registry orders through `open_order`, `mark_sent`, `mark_ack`, `transition` (open, partial, filled with `price` and `filled_qty`), `mark_unknown`, `record_close` and `record_structure_state`; reservations through `reserve`, `hold` and `release` with their commit markers; holds through `place` and `clear`; the latch through `trip`; the sender lease through `claim`; structure commands; AI-management pauses; the strategy registry; config profiles, a candidate approval and a session binding; governance evidence; arbitration; plans; decisions through `observe.decisions.record`. The kill file is absent (absence is state); legacy has no writer for it.
  * `market-data/`: spot, chain, Greeks and ticks through `marketdata.store.append`.
  * `tier1/authority.db`: a ledger built by legacy's `epoch.activate`, legacy's importer over `run/`, and native events of every family through `Ledger.append`, then copied by legacy's `recovery.snapshot` (the backup API).
  * The planted cases, each labelled: a torn trailing registry line (written by appending bytes without a newline); a registry line with a state legacy's machine does not know (through legacy's `_append`, the only way to write it); a Tier-1 event of an unknown kind (through `Ledger.append` with the catalogue check bypassed); and under `variants/`, a changed registry line, a broken structure-command chain, a Tier-1 copy with one row's payload altered after its hash, a gzip day with a corrupt member in the middle and a torn member at the end, and a run directory holding a kill file.
  * `golden.json`: what legacy's own readers return over the same bytes: `importer.sources.read_source` per source (each record's file, line, offset, digest, error flag and chain verdict, the deferred lines, `source_digest`); `Ledger.verify()` and the table row counts for each ledger copy; `decisions.read_day` and `store.read_day` per file.
* **The suite never imports legacy** (A08-F4): the tests read `golden.json` and the bytes.

### Characterization (TASK-S13-04)

Read from legacy's writers, recorded in "as built": whether a registry line carries each fill's quantity and price, which the responder needs in step 5.

### Tests

`tests/contracts/test_legacy_schemas.py` (new), over a copy of the fixtures in `tmp_path`:

| Test | Proves |
|---|---|
| Parity per JSONL and snapshot reader | Every record's `(file, line, offset, record_digest, error?, chain)`, the deferred list and `source_digest` equal legacy's `read_source` in `golden.json` |
| No byte lost | For every log file, each record's `raw` is the file's bytes at its offset; records, blank lines and the deferred tail cover the file |
| The torn line and the unknown state | The torn line is deferred, not a record; the unknown-state line is a record with its parsed value (meaning is step 3's) |
| Chains | The broken variant's verdicts equal legacy's; the clean fixture's are all `ok` |
| Absence | The absent kill file is one `present: false` record with digest `absent`; the variant's kill file is a present record |
| `tier1_ledger/1` | Count, head and per-row verdicts equal `Ledger.verify()`; the altered copy breaks at legacy's `first_break`; `raw` parses back to the stored columns; every table is returned with legacy's row counts; the unknown kind is an ordinary record; a schema version 2 ledger is refused |
| `decisions/1`, `market_ndjson/1` | Parsed values equal legacy's `read_day`; the corrupt member is one error record holding its bytes and later members still read; the torn last member is deferred |
| Read-only | After every reader has run, each fixture file's bytes, mode and modification time are unchanged and no file was added (no lock, `-wal` or `-shm`) |
| The module's reach | `adapters/compatibility.py` imports only the standard library and `apsw`, no legacy module, and calls no lock, write, rename, unlink, chmod or mkdir |

The layering guards (`tests/contracts/`, `tests/unit/test_market_windows.py`, `tests/unit/test_canvas_causality.py`) run with them.

### Files

* **New:** `src/autonomous_trading/adapters/compatibility.py`; `scripts/gen_legacy_fixtures.py`; `tests/fixtures/legacy_stores/` with `golden.json`; `tests/contracts/test_legacy_schemas.py`; `.gitattributes` (the fixtures are bytes: `-text`).

### Fork calls and Deviations

* **Deviation:** `sender_lease/1` is added, which the spec's reader table omits; legacy's importer reads that store (row 4) and the comparison set names the sender lease.
* **Deviation:** a ledger row's `raw` is the canonical JSON of its stored columns, since a SQLite row has no bytes of its own; its digest is over that text.
* No Fork call: nothing here is given a money meaning.

### Completion conditions (step 1)

The tests above pass twice in a row with the layering guards; `ast.parse` passes on every edited file; the characterization is recorded.

### Step 1 as built

Commit `e7f7d13` on `slice-13`, on top of `8cc2373`: the five new paths above, 39 files, 3 793 lines added (the fixtures are 442 kB, of which two ledger copies are 155 kB each). Not pushed.

**As planned, with these findings:**

* **Writers.** Twelve stores were written by legacy's public writer. Five needed a whole session around the public writer, so the generator used the writer with one dependency replaced, each named in `golden.json["writers"]`: the strategy registry and governance evidence with their configured root pointed at the fixture; `candidate_activation.approve` with the advisor-bundle load replaced by a synthetic receipt; session checkpoints through `session_checkpoint.record`'s own row layout and `_integrity` chain, without its live-session attestation check (`src/runtime/session_checkpoint.py:314-345`); a session binding through `session_config._write` and `_integrity`, without `bind`'s activation (`src/runtime/session_config.py:370-392`, `:864`). The sender lease's `host` and `pid` are synthetic (`sender._identity` replaced), so no machine name is in the fixtures. On Windows the generator also gives legacy's directory `fsync` a stand-in descriptor, because Windows cannot open a directory; file bytes are unaffected.
* **Legacy's strict registry reads refuse the planted lines** (`registry.strict_digest`, used by `reservations.reserve`), so the unknown state and the torn line are planted after every strict reader has run. Step 3 meets the same refusal from legacy's own tools on any registry holding such a line.
* **Two legacy markers are not JSON.** A reservation commit marker holds `committed\n` and an operator's kill file is usually empty; legacy's importer reads both as records with a parse error (`sources.py:214-225`), and so does the target. Step 2's mapping has to treat the marker's presence, not its content, as the fact.
* **The ledger copy is a WAL-mode file.** `immutable=1` reads it with no `-wal` or `-shm` created; legacy's own reader leaves an empty `-wal` and a `-shm` beside it, which the generator deletes.

**Deviation (added at build):** for `decisions/1`, legacy's `decisions.member_lines` returns the decoded text of an unfinished last gzip member (`src/core/framework/observe/decisions.py:113-140`); the target defers it, as legacy's market reader `_members` does (`src/data/marketdata/store.py:804-840`) and as the spec's deferred-line rule says. `test_gzip_corrupt_and_torn_members` pins the difference: the target's records are legacy's minus that one line. No Fork call.

**Characterization (TASK-S13-04): registry lines carry each order's cumulative fill, not each fill.**

* An entry's fill is written by the live settle pass as a transition to `partial` or `filled` with `filled_qty`, the cumulative quantity, and `price`, the quantity-weighted average rounded to 4 places, folded over the trades of that order (`scripts/run_framework_live.py:6072-6119`). A lifecycle order (a close or modify with its own row) is written the same way (`:6128-6161`).
* A structure leg's fill carries `filled_qty` only, with no price (`src/runtime/execution_gateway/structures.py:298-316`).
* A protective leg has no row of its own. Its fill is the entry row's `closed_qty` (the absolute total closed), `close_price`, `close_broker_order_id`, `close_fill_id` and, for broker-initiated closes, `close_broker_allocations` and their notionals (`src/core/framework/execution/registry.py:601-757`).
* So the responder (step 5) can answer an order with its cumulative quantity and average price from the copied lines, but not with each trade's quantity, price and trade ID, and a structure leg's price is not there at all. Where it needs those, the end-of-day pass takes them from the ledger copy, and the in-session answer is labelled provisional, as the spec already provides. Whether legacy's Tier-1 ledger at 445eb116 records each trade (`TRADE_OBSERVED`) in production is **not checked**.

**Tests run (Windows, affected only):** `tests/contracts/` (with the new `test_legacy_schemas.py`, 89 cases), `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 339 passed, 6 skipped, twice in a row. `autonomous_trading.__file__` resolves inside `OA_NEW-s13`. `ast.parse` passes on every new Python file. No break checks, by the coordinator's rule for this step.

## Step 2 — upgrade or import

<a id="step-2--upgrade-or-import-outline"></a>

The authorities are the migration spec's [upgrade or import](../../design/migration-recovery-rollback-continuity.md#upgrade-or-import-task-s13-01), its [copier's lockdown](../../design/migration-recovery-rollback-continuity.md#the-copiers-lockdown), PRF-MIG-08 and PRF-MIG-11's copier rows. Step 2 is TASK-S13-01 with TASK-S13-08. It decides how legacy history enters the target ledger, which is what the cutover trusts, so the plan stops for review before anything is built. Legacy citations are at 445eb116; target citations are at `e7f7d13` on `slice-13`.

**In plain words.** Two things. First, the copier: the one small program allowed to run as the old system's user, locked down so it cannot see the broker key, other processes or the network, and can only copy the old system's record files into the shadow's own folder. It refuses to run at all unless the isolation tool hands it proof that every lock-down is in force. Second, a written decision, from measured evidence, on how the old history moves into the new ledger: convert the old ledger file in place ("upgrade"), or start the new ledger fresh and copy every old record in as evidence ("import"). The plan recommends import, says what production finding would reverse it, and lists every kind of old record and where it goes, including the old system's safety facts that exist only as an absence or inside its ledger.

**Rework (2026-11-04).** The first version of this plan was reviewed "Ready to build: no" with twelve findings. Each is answered below where it applies, marked *(R-n)*. The coordinator's decisions where the review left a choice are applied as given.

### Before building

* **The copier is built here, run through SLICE-11's `scripts/isolated_work.py` later** *(R-11, coordinator: accepted)*. `isolated_work.py` is SLICE-11 step 6, not built at `e7f7d13`. Step 2 builds the copier and its refusal; it has **no command-line path that runs without an `isolated_work` report** (below), so until SLICE-11 step 6 lands nothing can start it. The report's format is fixed here and given to SLICE-11 step 6's plan.
* **The decision is provisional on the fixtures** *(R-12)*. The builder of this step never reads production data, so the criteria are measured on step 1's fixtures. [X-002](../../consistency/master-contradictions.md#x-002) **stays open** until step 6's first-night census of the production ledger copy (below, "What would reverse it").
* **Migration number** *(R-12)*. `009_promotion.sql` is taken (SLICE-12 step 6), so T-91 lands as `010_import.sql`. The slice's step table, step 3's outline and the spec's history-import section now say so.

### Decisions

#### The `isolated_work` report (fixed here for SLICE-11 step 6) *(R-11)*

`isolated_work.py` writes one JSON file, `isolated_work.report/1`, before the copier may copy, and passes its path as `--lockdown-report PATH`:

```json
{"format": "isolated_work.report/1",
 "unit": "at-shadow-copier-<run>.service",
 "invocation_id": "<the unit's systemd InvocationID, 32 hex>",
 "user": "<the user the unit runs as>",
 "systemd_version": 252,
 "created_at": "<ISO-8601 UTC>",
 "properties": {"<Property>": {"requested": "<value as passed to systemd-run>",
                               "enforced": true,
                               "evidence": "<how isolated_work.py read it back: systemctl show, or a probe>"}}}
```

* The copier waits up to 30 s for the file, then refuses. It refuses unless: `format` is exactly `isolated_work.report/1`; `invocation_id` equals its own `INVOCATION_ID` environment variable (set by systemd for that unit only, so a hand-started copier, or one given another unit's report, refuses); every property of `copier_unit_properties(...)` is present with `requested` equal to the value the copier itself computed and `enforced: true`; no property is reported `enforced: false`. There is no `--no-lockdown` flag and no default path.
* **Where the report lives** *(re-review 11)*. Path rule: `<paths.shadow.root>/control/isolated-work/<unit>.json`, where `<unit>` is the report's `unit` field. `control/` is a sibling of `input/`, never inside it. `isolated_work.py` writes the file (as its own user, mode `0444`) before it starts the copier, and adds `BindReadOnlyPaths=<paths.shadow.root>/control` to the copier's unit, so the file is visible inside the sandbox and read-only to the copier. Legacy's home is hidden by `TemporaryFileSystem=`, so the copier also refuses a shadow root inside legacy's home. The copier refuses a `--lockdown-report` path that does not resolve to exactly that place for its unit, that resolves inside the input root, or that its own user can write (`os.access(path, W_OK)`).
* For other isolated work the same format is used and an `enforced: false` may proceed (runtime spec); only the copier refuses on it.

#### The copier (`adapters/legacy_copier.py`, new, TASK-S13-08) *(R-2)*

A separate module that imports step 1's readers; `adapters/compatibility.py` and its `test_module_reach` stay unchanged, so PRF-MIG-06 keeps its proof that the readers never write.

* **What it copies.** Every `shadow.copy_interval_secs`, the files every step 1 reader matches under `shadow.legacy_run_dir`, plus `decisions/1` under the same root and `market_ndjson/1` under `shadow.legacy_market_dir`, into `paths.shadow.root/input/run/` and `input/market-data/`, keeping relative paths. **Read method** *(R-10)*: each legacy file is read exactly as step 1's reader (and legacy's importer, `sources.py:289-338`) reads it: `stat`, then one whole-file `rb` read; nothing else is opened.
* **The cursor is the copy itself** *(R-3)*. For a log, the copier's position in a legacy file is the size of its own copy in the input root. On every pass it checks that the legacy file's first `size` bytes hash to the copy's bytes (`sha256`) before appending anything. `input/.copier.json` holds `(size, sha256, mtime_ns)` per file as a cache only, used to skip unchanged files; a missing or stale cache is rebuilt from the copies. Order on each append: write the new bytes to the copy, `fsync`, then update the cache. A crash between the two leaves a copy longer than the cache; the next pass trusts the copy, so nothing is appended twice.
  * **JSONL log:** the legacy bytes after the copy's size up to the last newline are appended; a trailing partial line stays behind (`sources.py:269-282`) until it is complete.
  * **gzip log:** only whole members are appended (`store._members`, `store.py:804-840`); an unfinished last member stays behind. A member in the middle that does not decode **stops that file**: nothing more is copied from it, and the copier records a gap (`gaps` in its status, with file, offset and the pass) *(R-3, coordinator)*. The comparison reports the gap; the copier never skips past it.
  * **Prefix mismatch or shrink:** an anomaly. Nothing more is copied from that file and the anomaly is recorded (legacy's importer rule, `importer/__init__.py:94-128`). The copy is never rewritten.
  * **Snapshot:** when its bytes differ from the copy, the new bytes are written to a dot-named temporary file in the copy's directory and renamed over the copy.
  * **A legacy file that disappears** *(R-4, coordinator)*: its copy is moved into `input/.history/<pass instant>/<relative path>`, so the input folder matches legacy and the step 1 readers see the absence, as legacy's importer records it (`importer/__init__.py:121-127`). This covers an operator removing `KILL`, `loss_latch.unlock` moving a damaged record aside (`src/core/framework/execution/loss_latch.py:600-608`) and `_migrate_legacy_files` renaming an old-name latch (`:125-132`). `.history/` is a sibling of `input/run/` and `input/market-data/`, so no reader's pattern reaches it (the readers' dot-name skip, `sources.py:191-203`, looks at file names only).
* **The Tier-1 ledger** *(R-10)*. Never during a session. Once after the close, by SQLite's backup API, the read method legacy's own `recovery._copy` uses (`src/tier1/recovery.py:138-149`), into a dot-named temporary file `input/tier1/.authority-<day>.db.<pid>.tmp`, checked with `read_tier1_ledger` (schema version 1 and the head read; a chain break is recorded, not refused, since the importer quarantines it), then renamed to `input/tier1/authority-<day>.db` *(re-review 10)*. A temporary file left by a crash is deleted at the next run's start; only an existing final `authority-<day>.db` refuses, so a crash never blocks a retry and a finished copy is never overwritten. `<day>` is the IST trading day of the session that closed, from the target's one exchange calendar, `contracts.market.CALENDARS["nse-fo/v1"]` (`contracts/market.py:229-275`): `exchange_date(now)`, refused when that date is not one of the calendar's weekdays or `now` is not after that day's `close` (15:30 IST). The calendar has no holiday list, so a copy taken on a weekday exchange holiday is named by that date (harmless: no session ran, and the copy is still legacy's ledger). `contracts` is not a kernel decision module, so the import-closure test allows it. **Deviation, flagged for the owner before step 6 runs on production:** a backup-API read of legacy's live WAL ledger takes SQLite's shared read lock for the copy's duration and opens legacy's `-shm`, which legacy's own readers also do (step 1 as built: legacy's reader leaves `-wal` and `-shm`). This is a read lock on a legacy store and a touch of its `-shm`, so it does not meet "never locks a legacy store" literally. The alternative is to copy only while legacy's units are stopped for the night. The owner chooses before step 6; step 2 does not block on it.
* **Its lockdown, as data.** `copier_unit_properties(legacy_roots, input_root, systemd_version)` returns the spec's list: `PrivatePIDs=yes` where the host's systemd has it, else `InaccessiblePaths=/proc` with `SystemCallFilter=~@debug`; `ProtectProc=invisible`; `TemporaryFileSystem=` over legacy's home and OpenAlgo's data and container directories with `BindReadOnlyPaths=` for legacy's store and market directories only; `ProtectSystem=strict` and `ReadWritePaths=` the input root; `PrivateNetwork=yes`, `RestrictAddressFamilies=none`, `NoNewPrivileges=yes`, `CapabilityBoundingSet=`; every credential name unset. `require_lockdown(report, properties)` applies the report rules above.
* **Its entry.** `python -m autonomous_trading.adapters.legacy_copier copy --once|--loop|--ledger --lockdown-report PATH`. Before reading anything it checks the report, refuses with any `BROKER_KEY_NAMES` set (`settings/schema.py:437`), refuses an input root inside a legacy root or a production root, and refuses while `shadow.copy_interval_secs` is unset. It imports no HTTP client, socket library or OpenAlgo code.
* **Settings** (`settings/schema.py`, `resources/defaults.yaml`; register `deployment`, no money value): `paths.shadow.root`, `shadow.legacy_run_dir`, `shadow.legacy_market_dir` (paths, unset); `shadow.copy_interval_secs` (`int_pos`, unset and refusing until step 6 measures it; legacy's 30 s, `src/tier1/shadow.py:59-62`, is evidence only).
* **A condition of step 6** *(R-10, coordinator)*: PRF-MIG-11's copier rows pass on Linux with systemd, including "the backup API copies a ledger while a stand-in writer process holds it through a read-only bind", before the copier runs against production.

#### The two routes, measured

Measured on step 1's fixtures (53 legacy events in 8 families and 13 kinds, 8 tables, 17 store sources) and on the target at `e7f7d13`. The criteria that decide are **structural**: they follow from the two envelopes and the index tables, not from what the data holds.

| Criterion | Upgrade (migrate legacy's file in place) | Import (new ledger, legacy records as events) |
|---|---|---|
| Original bytes, digests, identities | Legacy rows kept, but under a second envelope schema (`tier1.event/1`); store records still need the importer | Every record's bytes and `record_digest` in its event (step 1's `LegacyRecord`); legacy's file kept unchanged in the recovery set |
| Chain verification | Two hash rules for ever: legacy's envelope has no `execution_domain`, `clock_domain` or `command_key` and hashes `idempotency_key` (`src/tier1/envelope.py:89-117`); the target's (`001_initial.sql` `ledger_event`) differs, so legacy rows cannot be re-hashed | One rule, the target's |
| D04 | The target's index tables (`command_identity`, `command_attempt`, `reservation`, `broker_identity`) would fold legacy rows of another shape; legacy's `command_identity` has no verb, account or state (`src/tier1/schema.py:63-70`) | Index tables fold target events; `import_manifest` is folded from the import events (step 3) |
| Rollback and restore | Every future bundle carries legacy's envelope reader in its start path (A02-F4) | The legacy readers are needed only by the importer and the recovery set's evidence, never at kernel start |
| Recovery complexity | A crash mid-upgrade leaves a file of two schemas; legacy's schema has no migration path (`src/tier1/schema.py:130-136`) | CP-I1 and CP-I2 (spec); a partial import is set aside, never edited |
| Unknown records | A row of an unknown kind is already in the chain with no target meaning | `LEGACY_RECORD_QUARANTINED` with its bytes (the fixture's `FUTURE_KIND`) |
| ATA-06 attribution | Legacy rows carry `provenance` only (`native`, `legacy_import`, `broker_observation`); a domain would be invented, or `unknown` on every row | Import events are `execution_domain: none`; the legacy row's provenance stays inside the payload, uninterpreted |
| Effort | A second envelope, a dual-shape schema, changed folds in every slice's tests | The importer, `010_import.sql`, and the ledger module changes listed below *(R-12)* |

**Recommendation: import.** `001_initial.sql` is kept unchanged; step 3 adds `010_import.sql`. The upgrade route is rejected because its chain would carry two hash rules for ever and its domains would be invented or blanket `unknown`.

**What would reverse it** *(R-12)*. Because the deciding criteria are structural, step 6's census can normally only add mapping rows. The decision is reversed, and X-002 resolved the other way, only if the production copy holds something the import route cannot carry as an event with its bytes: a table or column the backup API does not copy, a row too large for one event under the ledger's limits, or a dependency of the cutover on a legacy table's own state that no event reproduces. Cost of a reversal then: steps 3–5 rebuilt on the upgrade route (a second envelope reader in every bundle). Until the census, X-002 stays open and this record says "provisional".

**Ledger module changes the import route needs** (listed now; built in step 3) *(R-12)*: `kernel/ledger/projections.py` gains `import_manifest` in `TABLES` (`:13`) and fold rules for `IMPORT_BOUNDARY_PINNED`, `LEGACY_RECORD_IMPORTED`, `LEGACY_RECORD_REJECTED`, `LEGACY_RECORD_QUARANTINED` and `IMPORT_COMPLETED` (the fold raises on an unknown kind, `:371`); `kernel/ledger/schema.py` registers migration 10 (its `MIGRATIONS` ends at 9, run in number order by `apply_migrations`, `:60-93`); `resources/events.schema.json` gains the five kinds; the ledger spec's event catalogue lists them. These are ledger-spec module changes reported to that spec's owner.

#### The mapping (written into `docs/decisions.md`; kept as data in `adapters/legacy_copier.py`'s sibling `adapters/legacy_mapping.py`, read-only, standard library only)

**Outcome rules per store** *(R-1, R-8)*. For each record exactly one outcome:

| Store (reader) | `IMPORTED` | `REJECTED` | `QUARANTINED` |
|---|---|---|---|
| Registry (`registry/1`) | Parsed, and either `state` in legacy's machine (`formed`, `sent`, `ack`, `open`, `partial`, `filled`, `rejected`, `cancelled`, `completed`, `unknown`, `ambiguous`; `src/core/framework/execution/states.py:27-59`), or no `state` key (a `record_close` row, `registry.py:601-757`, or a `STRUCTURE_STATE` row, `registry.py:2376-2410`) | Not JSON or not canonical | Parsed with a `state` outside that list (the fixture's `teleported`) |
| Structure commands (`structure_commands/1`) | Every row, when legacy's whole-file reader would accept the file | — | **Every row from the first row legacy's reader refuses; the file blocks `HISTORY_TRANSFERRED`** *(re-review 5)* |
| Session checkpoints (`session_checkpoints/1`) | The same | — | The same whole-file rule |
| AI pauses (`ai_pauses/1`) | The same | — | The same whole-file rule |
| Reservation markers (`reservation_markers/1`), kill file (`kill_file/1`) | **Every present file, with its parse error kept** *(R-1, coordinator; the blocker)*: the fact is the file's presence (legacy's importer imports such records with `error`, `importer/__init__.py:138-152`; legacy's kill switch tests existence only, authority map row 5; a marker's absence means uncertain, row 3). An absent fixed path is an `absent` record, also `IMPORTED` | Never | Never |
| Every other store | Parsed | Not JSON or not canonical | — |

**The three chained logs follow legacy's whole-file refusal** *(re-review 5, checked)*. Each legacy reader refuses the whole file at its first bad row, so no later row is trusted:

| Log | Legacy's reader and what refuses the file |
|---|---|
| Structure commands | `structure_commands._read` (`src/runtime/structure_commands.py:38-61`): a row that is not JSON, not an object, does not link to the previous `integrity_sha256`, or whose integrity does not match; then `_validate_advice_command` (`:256-300`): unknown or missing fields for `close_structure` or `adjust_protection`, empty identity fields, a protection command whose id does not match its advice, a state outside `requested`, `executing`, `held`, `unknown`, `refused`, `completed`. Legacy's cutover then refuses with "unreadable" (`src/tier1/cutover.py:195-200`) |
| Session checkpoints | `session_checkpoint._read_chain` (`src/runtime/session_checkpoint.py:245-290`): a blank row, a row that is not a JSON object, no `run_id`, `validate` failing (`:128-199`: schema version 1–4 and `kind`, integrity, strategy, run and day from the file's path, the stable identity fields per version with their `sha256:` prefixes, `availablecash`, the four broker books in canonical form, the startup anchor, `valid` and `reconciliation.agrees`, the version-4 heads), a broken predecessor link, or a run anchor changed alone or reused (`:232-243`) |
| AI pauses | `RecordStore._read_ledger` (`src/runtime/ai_management/store.py:139-196`): a row that is not JSON, not exactly the nine event fields, another `schema_version`, a `sequence` that is not its position, a broken link, a mismatched integrity, a payload that is not an object, an empty `record_id` or `kind`, a state outside `VALID_STATES` (`:24-26`), or an `at` that is not an instant |

`adapters/legacy_mapping.py` ports these row checks line for line, so the mapping finds the same first refused row without legacy code. Two nested validators are **not** ported, a **Deviation**: structure commands' `_advice_context` and `_close_progress_baseline` (the contents of an advice context and a close baseline), and checkpoints' `CandidateActivationIdentity.from_dict` and `CandidateLoadReceipt.from_dict` (`src/core/framework/runtime/identity.py`). A row whose only fault is inside one of those objects is imported where legacy would refuse the file. The fixtures hold none; step 6's nightly rehearsal also runs legacy's own readers over the copied files (legacy's code, on the EC2, outside the target) and reports any disagreement before the cutover.

**Snapshot versions** *(R-6)*. A snapshot rewritten in place (holds, `holds.py:157-185`; `strategies.json`; the sender lease) yields a new record per distinct content, as legacy's importer does (`importer/__init__.py:121-127`). Earlier versions found in legacy's Tier-1 `LEGACY_RECORD_IMPORTED` rows but no longer in the store are counted as `superseded`. Anomalies are limited to log lines: an imported log line whose digest changed or whose line is gone.

**The accounting equation names every outcome** *(re-review 6)*. For every source, `seen = transferred + rejected + quarantined + evidence_matched + superseded + anomaly + after_boundary`. For the 17 store sources the middle three are always 0. For `tier1_ledger`: a native row of a known kind before any break is `transferred`; a row from `first_break` on, or of an unknown kind, is `quarantined`; each of legacy's own `LEGACY_RECORD_IMPORTED` rows is `evidence_matched`, `superseded` or `anomaly`. Every counted row has an event with its bytes. The spec's equation and PRF-MIG-07 say the same.

**Source rows:**

| Legacy | Target |
|---|---|
| Each of the 17 store sources (rows 1–10, 12–17, 23) | One import event per record, by the outcome rules above, with source, store row, file, line, offset, `record_digest`, bytes and identity keys |
| Rows 11, 18–22 | Outside, as legacy's `OUTSIDE` (`sources.py:171-179`) |
| Tier-1 `ledger_event` rows before legacy's `first_break` (all rows when `verify` is `ok`), of a kind in legacy's catalogue (`src/tier1/events.py:16-92`), except `migration/LEGACY_RECORD_IMPORTED` | One `LEGACY_RECORD_IMPORTED` per row, source `tier1_ledger`, its `raw` (step 1) and verdict; legacy's sequence and hash as its identity; no target meaning |
| Tier-1 rows from `first_break` onward *(R-5, coordinator)* | `LEGACY_RECORD_QUARANTINED`, every one: legacy refuses every authority operation once `verify` fails anywhere (`src/tier1/gateway_route.py:398-413`), so no row after the break is trusted more than legacy trusts it. A `tier1_ledger` break **blocks the cutover's `HISTORY_TRANSFERRED`** (added to the spec's "What blocks") |
| A Tier-1 kind outside legacy's catalogue | `LEGACY_RECORD_QUARANTINED` |
| Tier-1 `migration/LEGACY_RECORD_IMPORTED` rows | One event each with its bytes, as evidence only: the record's meaning comes from the store itself. Each row's `record_digest` is looked up in the store's current records and the row is counted as exactly one of `evidence_matched` (found), `superseded` (a snapshot version the store no longer holds) or `anomaly` (a log line since changed or gone) *(re-review 6)* |
| Tier-1 index tables (`authority_epoch`, `command_identity`, `broker_identity`, `projection_checkpoint`, `legacy_import_manifest`, `release_binding`, `tier1_meta`) | Evidence only: folded by legacy from its events; their row counts and digests go in the boundary pin |
| `decisions/1` | Evidence only (the recovery set keeps the files); not imported: record-only, and no retained consumer (the spec's projection paragraph) |
| `market_ndjson/1` | Not imported: the shadow's market process reads it (step 5); the files stay in the recovery set |

**Derived safety state** *(R-7, coordinator)*. Legacy's safety facts that no single record states are named as **inputs to PRF-MIG-13** (the cutover's carry, SLICE-14), computed at the boundary from the imported records and recorded in the boundary pin:

| Derived fact | How legacy derives it | Carried as |
|---|---|---|
| A strategy with no hold file is held until its first reconciliation | `holds.engaged`: no record counts as held (`src/core/framework/execution/holds.py:236-251`); `holds.pass_check` writes `held: false` when reconciliation finds nothing and leaves an existing held record alone (`:137-155`), at every live start (authority map row 6) | For every strategy in the strategy registry snapshot with no hold record at the boundary: a hold of kind **`unreconciled`**, which the target's own startup reconciliation lifts when it finds nothing outstanding, exactly as `pass_check` does; never a hold only the owner can release *(re-review 7)* |
| A hold file that is torn or unreadable is held | `holds.engaged` reads `held` default true (`:250-251`); the authority map's row 6 | Held |
| The loss latch, kill and holds in legacy's Tier-1 Safety projection | Legacy's entry gate reads the latch from the verified Safety projection, not the file (`src/tier1/gateway_route.py:448-459`); `src/tier1/projections/safety.py` | The projection's `loss_latch`, `kill` and `holds` state at the ledger copy's head, recorded beside the file-derived values; where the two disagree, the stricter one (held, tripped, engaged) is carried and the disagreement is listed for the owner. **A latch is carried only when its legacy `day` equals the IST trading day of the target's first session** (the target keeps one latch per session); a latch of an earlier day is recorded as history and carries nothing *(re-review 7)* |
| An empty or unparsable `KILL` | Engaged by existence (row 5) | Engaged |

This mapping gives none of these a target meaning by itself; SLICE-14's carry engages the target's hold, kill and latch from them (PRF-MIG-13), and its tests use these rows as inputs.

**Identity map: moved out of step 2** *(R-9, coordinator)*. Mapping legacy broker order IDs so the target's reconciliation recognizes a legacy order needs a table that `broker_identity` cannot hold (it requires a `command_key` in `command_identity`, `001_initial.sql:40-42`) and changes how reconciliation treats an unidentified order (`kernel/reconciliation.py:554-570` treats it as foreign and may hold entries). That is a money-adjacent change. It is carried to step 3 as a **Deviation to be reviewed there**, with its table in `010_import.sql`, its reconciliation rule and its effect on the first day's gating stated before it is built. Step 2's mapping records only that registry rows carry `broker_order_id` as an identity key. **Resolved in step 3 (2026-11-04):** no map; every legacy order stays foreign (Q-016), and the identity keys are evidence only.

No row creates a target command, reservation, position, grant, hold or latch from legacy history (`README.md:1195`).

### Tests

| File | Test | Proves |
|---|---|---|
| `tests/contracts/test_legacy_schemas.py` | Mapping completeness | Every kind in legacy's catalogue (from `golden.json`, which the generator extends with legacy's `CATALOGUE`), every Tier-1 table and every authority-map row 1–23 has exactly one mapping row; no row names a target command, reservation or position event |
| same | Outcome per fixture record *(R-8)* | The generator records each fixture record's expected outcome, computed by the rules above from legacy's own vocabularies (`states.STATES`, the structure-command kinds and states, the chain verdicts); the mapping gives exactly those: the `teleported` line `QUARANTINED`, every known state `IMPORTED`, both commit markers and the variant's empty `KILL` `IMPORTED` with their parse errors, the absent `KILL` `IMPORTED` absent, the broken command chain's rows `QUARANTINED` from its first refused row, `FUTURE_KIND` `QUARANTINED` |
| same | Legacy's whole-file verdicts *(re-review 8)* | `golden.json` records, for every chained file in every fixture run directory, whether legacy's own reader accepts or refuses it and at which line (`structure_commands.history`, `session_checkpoint.latest`, `RecordStore._read_ledger`, run by the generator on a scratch copy since `RecordStore` creates and truncates); the mapping's first refused row equals legacy's for each. The fixtures hold an accepted file of each log, written by legacy's public writers, and under `variants/` a broken structure-command chain, a checkpoint with a broken link, one failing `validate` (no `availablecash`), and a pause with a wrong `sequence` |
| same | Tier-1 break *(R-5)* | Over the broken copy: every row from `first_break` (3) on is `QUARANTINED`, rows before it `IMPORTED`; the break is reported as blocking `HISTORY_TRANSFERRED` |
| same | Derived safety *(R-7, R-8)* | The generator records legacy's Tier-1 projection views at the copy's head (`Safety`, `Positions`, `Ambiguity`, `Reservations`, `Orders`; `src/tier1/projections/__init__.py:18`) and `holds.engaged` per registered strategy; the derived-safety rows equal them: `ema_cross` (cleared) not held, `buyer_edge` held, `orb_v1` (registered with no hold file, added to the generator) held as `unreconciled`, the 2026-11-02 latch tripped and carried for a first session on 2026-11-02, not carried for one on 2026-11-03 |
| same | Snapshot versions *(R-6)* | A hold rewritten in place: the earlier version is `superseded`, never an anomaly; a changed log line is an anomaly |
| `tests/contracts/test_legacy_copier.py` (new) | Growing store | Appends only complete lines and complete gzip members; a torn tail stays behind and is copied once complete; a changed snapshot replaces its copy; a second pass copies nothing; every legacy file's bytes, mode and mtime are unchanged |
| same | Crash between append and cache *(R-3)* | The copier killed (a subprocess, `os._exit` injected after the `fsync` and before the cache write) then rerun: the copy holds every legacy line once; with the cache deleted the same |
| same | Corrupt member *(R-3)* | A corrupt gzip member in the middle stops that file and records a gap; later members are not copied |
| same | Disappearance *(R-4)* | Removing `KILL` and renaming a latch file move their copies under `input/.history/`; step 1's readers over the input then show the kill file absent and the latch gone |
| same | Anomaly | A changed earlier line or a shrunk file stops that file; the copy is not rewritten |
| same | The ledger copy *(R-10)* | The backup API copies a ledger while a separate writer process appends (Windows and Linux); the temporary copy is read by `read_tier1_ledger` before the rename; `<day>` is `CALENDARS["nse-fo/v1"]`'s date, refused before 15:30 IST or on a weekend; a leftover temporary file does not block a retry; an existing final copy refuses |
| same | Refusals *(R-11)* | No report, a report outside `<root>/control/isolated-work/`, inside the input root or writable by the copier's user, a report of another format, an `invocation_id` not equal to `INVOCATION_ID`, a missing property, a `requested` value differing from the copier's own, or any `enforced: false`: each refuses before any file is read; so do a `BROKER_KEY_NAMES` value (labelled synthetic), an input root inside a legacy root, and an unset interval |
| `tests/contracts/test_capabilities.py` | Import closure | `adapters.legacy_copier` and `adapters.legacy_mapping` load no HTTP client, socket library, OpenAlgo code, sender or kernel decision module |
| same, skipped without `systemd-run` | PRF-MIG-11 copier rows | A stand-in user and a stand-in process carrying a fake key: the copier sees no other process, cannot read its environment or trace it, cannot open a stand-in settings file, the OpenAlgo snapshot directory or a socket under the run directory, cannot write a legacy path, opens no socket, refuses with any property unenforced, and copies a WAL ledger held by a stand-in writer through a read-only bind. **A condition of step 6** |

### Break checks

1. Copy the trailing partial line too: the growing-store test fails.
2. Accept a property reported `enforced: false`: the refusal test fails.
3. Skip the `INVOCATION_ID` match: the refusal test fails.
4. Update the cache before the `fsync` and trust the cache over the copy: the crash test fails.
5. Map a present `KILL` with a parse error to `REJECTED`: the outcome test fails.
6. Import Tier-1 rows after `first_break` as `IMPORTED`: the Tier-1 break test fails.
7. Treat a missing hold file as not held: the derived-safety test fails.
8. Drop the `transport` family from the mapping: the completeness test fails.

### Files

* **New:** `src/autonomous_trading/adapters/legacy_copier.py`, `src/autonomous_trading/adapters/legacy_mapping.py` (tree deltas listed for the module index with the step's review); `tests/contracts/test_legacy_copier.py`; the `docs/decisions.md` entry (PRF-MIG-08) in the new repository.
* **Changed:** `settings/schema.py`, `resources/defaults.yaml`, `tests/unit/test_settings_resolver.py` (the four settings); `scripts/gen_legacy_fixtures.py` and the `golden.json` in `tests/fixtures/legacy_stores` (legacy's catalogue, the expected outcomes, the projection views, `holds.engaged` per strategy, and a hold rewritten in place); `tests/contracts/test_legacy_schemas.py`; `tests/contracts/test_capabilities.py`. `adapters/compatibility.py` is not changed.
* **Spec (this slice's sections):** the migration spec's history import says `010_import.sql`, adds `superseded` to the equation and a `tier1_ledger` break to "What blocks".

### Fork calls and Deviations

* **Deviation:** the copier is built before `scripts/isolated_work.py` and refuses without its report (R-11, accepted).
* **Deviation:** the decision is measured on fixtures; X-002 stays open until step 6's census (R-12).
* **Deviation, for the owner before step 6:** the nightly backup-API copy takes a shared read lock on legacy's live ledger and opens its `-shm` (R-10).
* **Deviation:** legacy's Tier-1 `LEGACY_RECORD_IMPORTED` rows are evidence only; the records come from the stores, and their earlier snapshot versions are `superseded`.
* **Carried to step 3 as a Deviation to review there:** the legacy identity map and its reconciliation rule (R-9). Resolved in step 3: dropped.
* No Fork call: a present marker and kill file keep legacy's meaning (presence is the fact); a legacy order is not given a target meaning here.

### Completion conditions (step 2)

The tests pass twice in a row with the layering guards; every break check fails a listed test and every file is restored (md5); the decision record is in `docs/decisions.md` with the mapping, the measured criteria, the rejected route's reason, what would reverse it and the production census pending; X-002 stays open.

* **Produces:** PRF-MIG-08, provisional until step 6's census. The owner sees the record with the cutover request (SLICE-14).

### Step 2 as built

Commit `51e5a81` on `slice-13`, on top of `e7f7d13` (step 1): 33 files, 3 306 lines added, 153 removed (most of it the regenerated fixtures). Not pushed. Reviewed twice before building ("Ready to build: no", then "yes after fixes"); the fixes are in the plan above.

**As planned, with these choices and findings:**

* **The copier takes its paths as arguments.** It is not a settings participant: `--shadow-root`, `--legacy-run-dir`, `--legacy-market-dir`, `--legacy-home`, `--legacy-ledger`, `--openalgo-dir`, `--systemd-version`, `--copy-interval-secs`, `--unit` and `--lockdown-report`. The four settings exist (`paths.shadow.root`, `shadow.legacy_run_dir`, `shadow.legacy_market_dir`, `shadow.copy_interval_secs`), scoped to the installer, which with `isolated_work.py` passes them through. **Deviation (build):** adding a `copier` participant to `settings/schema.py`'s `PARTICIPANTS` is SLICE-11's; it is listed for SLICE-11 step 6.
* **Unit properties as built:** `PrivatePIDs=yes` from systemd 257 (the version that introduced it), else `InaccessiblePaths=/proc` with `SystemCallFilter=~@debug`; `ProtectProc=invisible`; `TemporaryFileSystem=` legacy's home and OpenAlgo's directories; `BindReadOnlyPaths=` legacy's store and market directories and `<shadow root>/control`; `ProtectSystem=strict`; `ReadWritePaths=` the input root; `PrivateNetwork=yes`; `RestrictAddressFamilies=none`; `NoNewPrivileges=yes`; `CapabilityBoundingSet=` (empty); `UnsetEnvironment=` every `BROKER_KEY_NAMES` entry.
* **The ledger copy** is made with `journal_mode=DELETE` on the temporary file before it is read and linked into place (`os.link`, which refuses if the final name exists), so the copy is one self-contained file.
* **The fixtures were regenerated:** checkpoints now through legacy's public `session_checkpoint.record` (schema 1 rows that legacy's `validate` accepts); a second AI pause; `orb_v1` registered with no hold file; the sender lease claimed a second time after legacy's importer ran, so its first version is `superseded`; and four variants (a checkpoint with a broken link, one with no `availablecash`, a pause with a wrong `sequence`, besides the broken command chain). The Tier-1 copy now holds 54 events. `golden.json` adds legacy's catalogue, its whole-file verdict per chained file, the expected outcome per record, the five Tier-1 projection views and `holds.engaged` per registered strategy.
* **AI-pause trailing row:** a row without its newline is treated as refused for all three chained logs. Legacy truncates an AI-pause tail that `state.json` never published, which the target cannot see; refusing is the stricter side. **Deviation (build, conservative).**
* **Finding, not fixed (another slice's tests):** `test_capabilities.py`'s `_modules_after` runs `python -I`, which ignores `PYTHONPATH`, so in a worktree its import-closure guards load the venv's installed package (the main `OA_NEW` checkout), not the code under test. The new closure test passes the worktree's `src` explicitly. The existing guards in that file should do the same; reported for the coordinator.

**Fork calls:** none. **Deviations:** as listed in the plan, plus the two marked "(build)" above.

**Tests run (Windows, affected only):** `tests/contracts/` (with `test_legacy_schemas.py`, `test_legacy_copier.py` and the new closure test), `tests/unit/test_settings_resolver.py`, `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 478 passed, 7 skipped, twice in a row. The skips include `test_copier_lockdown_rows`, the PRF-MIG-11 copier rows, which need Linux, `systemd-run` and root: **written, not run**, and a condition of step 6. `ast.parse` passes on every edited Python file.

**Break checks** (script `break_step2.py` in the session scratchpad), each failing its listed test, each file restored and its md5 confirmed:

| Break | Failed |
|---|---|
| 1. Copy the trailing partial line | `test_growing_store` |
| 2. Accept `enforced: false` | `test_require_lockdown` |
| 3. Skip the `INVOCATION_ID` match | `test_require_lockdown` |
| 4. Trust the cache over the copy | `test_crash_between_append_and_cache` |
| 5. A present `KILL` with a parse error `REJECTED` | `test_planted_outcomes` |
| 6. Tier-1 rows after `first_break` imported | `test_tier1_break_quarantines_from_first_break` |
| 7. A missing hold file not held | `test_derived_safety` (both cases) |
| 8. Drop the `transport` family | `test_mapping_is_complete` |

## Step 3 — the importer

<a id="step-3--the-importer-outline"></a>

The authorities are the migration spec's [history import](../../design/migration-recovery-rollback-continuity.md#history-import-scriptsmigrate_legacypy), PRF-MIG-07 and the crash points CP-I1 and CP-I2. Step 3 is TASK-S13-05. It writes legacy money records (orders, reservations, fills, latches) into a target ledger and decides what the cutover counts as transferred, so the plan stops for review before anything is built. Legacy citations are at 445eb116; target citations are at `51e5a81` on `slice-13`.

**In plain words.** The importer copies every old record into a new ledger as evidence, one event per record, with its exact bytes. It reads only the copier's copies, and only the exact bytes it fixed at the start, checked by hash. It counts every record under a named heading (moved, refused, set aside, matched, superseded, changed, stopped behind a change, or newer than the boundary) and refuses to call the import finished unless the counts add up and match the events. A crash halfway loses nothing and copies nothing twice. It also records, at the boundary, the old system's safety facts (holds, kill, latch) that the cutover must carry. Afterwards it rebuilds all thirteen of the old system's own comparison views from the imported events and checks them against what the old system's own code says. It cannot trade: it has no broker port, and it refuses a ledger where any order was ever claimed. Old broker orders stay "foreign" to the new system, as the owner decided (Q-016); nothing about them changes what the new system may do.

**Rework (2026-11-04).** The first version of this plan was reviewed "Ready to build: no" with twelve findings. Each is answered below where it applies, marked *(S3-n)*. The coordinator's decisions are applied as given.

### Decisions

#### Where the code lives

* **`src/autonomous_trading/operations/legacy_import.py`** (new, tree delta T-102): the importer. `scripts/migrate_legacy.py` (spec) is a thin command line over it, because the installer (SLICE-14) and the nightly rehearsal (step 6) call it from the installed wheel, where `scripts/` is not shipped.
* **The migration composition** `compose_migration(*, ledger_path, run_id, clock)` in `bootstrap.py` (a configuration-spec module change): a `LedgerWriter` with principal `migration:<run_id>` (kind `service`), no coordinator, no adapter, no session evaluation, no strategy host. **It refuses only a ledger holding a `DISPATCH_CLAIMED`** (`MIG-R01`), because SLICE-14's `continue-legacy` opens the production ledger through it after `KERNEL_STARTED` (spec, the initial cutover) *(re-review 8)*.
* **Epochs and resume** *(S3-11)*. Every run, first or resumed, opens the writer with a fresh `EpochId` and calls `activate_epoch`, which retires the previous epoch read from the chain (`kernel/ledger/store.py:483-500`); a resumed import therefore holds one `EPOCH_ACTIVATED` per run, each retiring the last. **The import command** (never the composition) refuses, at its start and again in every batch's `Decision.precheck` (run first inside the transaction, `store.py:656-660`): `MIG-R01`, a `DISPATCH_CLAIMED` or an `EPOCH_ACTIVATED` whose principal is not `migration:*`; and `MIG-R05`, below. The check is one function, `import_possible(writer, import_id)`, called in both places.
* **One import per ledger** (**`MIG-R05`**). A ledger already holding an `IMPORT_COMPLETED` refuses a new import (the import command only). The nightly rehearsal (step 6) imports into a fresh ledger each night, `<paths.shadow.root>/rehearsal/<day>/ledger.db`; the cutover imports into a new ledger path (SLICE-14). **Deviation:** legacy's importer adds to one ledger incrementally (`src/tier1/importer/__init__.py:206-217`, `import_run`); the target needs no incremental import, because its shadow is fed by the copier and the responder (step 5), not by the importer.

#### Inputs and the boundary *(S3-7)*

* **Who resolves its settings** *(re-review 6)*. `paths.shadow.root`, `shadow.legacy_run_dir`, `shadow.legacy_market_dir` and the new `migration.batch_records` are scoped to the `installer` participant (`settings/schema.py`, the step 2 rows); the installer (SLICE-14's cutover) and `isolated_work.py` (step 6's rehearsal) resolve them and pass them as `--shadow-root`, `--legacy-run-dir`, `--legacy-market-dir` and `--batch-records`, as for the copier (step 2 as built). No participant is added.
* **What it reads.** `migrate_legacy.py import --boundary pin|follow --day D --into LEDGER [--legacy-stopped-at T] [--reconcile-boundary REASON]`. The importer takes no input file argument. It reads only `<paths.shadow.root>/input/run/` (the copier's copies) and `<paths.shadow.root>/input/tier1/authority-<D>.db` (the copier's backup-API copy, step 2). **`MIG-R06`** refuses, before reading anything: any of the three paths unset; an input root or a ledger path that resolves inside `shadow.legacy_run_dir` or `shadow.legacy_market_dir` (legacy's ledger, `run/tier1/authority.db`, `config/defaults.yaml:1869`, is inside the run directory), or a ledger path inside the input root; a Tier-1 file whose header bytes 18–19 are not `1` (a WAL-mode file: the copier's copy is set to `journal_mode=DELETE`, step 2 as built), or with a `-wal` or `-shm` file beside it; `D` not a weekday of `CALENDARS["nse-fo/v1"]`. So `pin` can never open legacy's live WAL ledger, whose uncheckpointed frames `immutable=1` would silently drop (`adapters/compatibility.py:491-496`).
* **`pin` reads only what was copied after legacy stopped** *(re-review 7)*. `pin` requires `--legacy-stopped-at T`, the stop instant SLICE-14 records at `LEGACY_STOPPED`, and reads the Tier-1 copy `input/tier1/authority-<D>-final.db`, never the nightly `authority-<D>.db`. The copier gains `copy --ledger --final`, which writes that name (refusing if it exists, like the nightly one, so neither overwrites the other) and beside it `authority-<D>-final.db.taken`, `{"started_at": ...}`, the instant the backup began; and every completed copier pass writes `input/.copier-pass.json`, `{"started_at", "completed_at"}`. The final pass after the stop is one `copy --once`, run through `isolated_work.py` after `LEGACY_STOPPED`, then one `copy --ledger --final`. `pin` refuses (**`MIG-R08`**) unless both `started_at` values are later than `T`. `follow` reads the nightly copy and needs neither.
* **The pin reads exact prefixes.** At the pin the importer stages each input file once into `<ledger dir>/.import-<import_id>/` (dot-named, derived, deleted only after the comparison event, below): for a log, one whole-file `rb` read, cut at its last newline, the prefix written to staging and its size and SHA-256 recorded; for a snapshot, the whole bytes and their SHA-256, or `absent`; for the Tier-1 copy, its SHA-256 (not staged: the copy is final and never rewritten, step 2). Capture order: the Tier-1 copy first, then the stores in authority-map row order. `ai-management/pauses/state.json`, which legacy's `pauses` view reads but no reader imports, is staged and pinned as view-only (`view_files`), and the copier copies it for that reason. The step 1 readers then run over the staging directory only, so a line the copier appends after the pin is never read under this boundary. **On resume** each staged file is re-hashed against the pin; if staging is missing or damaged it is rebuilt from the input, where a log's first `size` bytes and a snapshot's whole bytes must hash to the pinned values, else **`MIG-R03`** (a changed boundary).
* **Legacy's absent records, ported** *(S3-7)*. A snapshot file imported under this import and no longer present at a superseding boundary yields one `absent` record (`present: false`, digest `absent`), as legacy's `_new_records` does (`src/tier1/importer/__init__.py:125-127`); a log file imported and now missing is a `line_anomaly` for each of its imported lines (`:118-119`). So a removed hold file's old content is never the last word.
* **`IMPORT_BOUNDARY_PINNED`** payload: `import_id`, `run_id`, `mode`, `converter_version`, `captured_at` (the import clock), `day`, `ledger` (`file`, `sha256`, `schema_version`, `head_sequence`, `head_hash`, `verify`, per table `[rows, digest]`), `files` (per source in row order: per file `[size, sha256]` for a log, `sha256` or `absent` for a snapshot), `readers`, `supersedes` (the superseded boundary event's sequence and `reconciled_reason`, or null), and *(S3-8)* `first_session_day` and `derived_safety`, below.
* **Derived safety in the pin** *(S3-8)*. `derived_safety` is step 2's `legacy_mapping.derived_safety(stores, tier1, first_session_day=...)` (`adapters/legacy_mapping.py:569-605`) over the staged stores and the Tier-1 copy, serialized as `{"holds": {strategy: "held"|"unreconciled"|"clear"}, "kill_engaged": bool, "latches": [[strategy, day, tripped]], "carried_latches": [[strategy, day]], "disagreements": [str]}`, sorted. **`first_session_day`** is the first IST date whose weekday is in `CALENDARS["nse-fo/v1"].weekdays` and whose close (15:30 IST) is after `captured_at` (`contracts/market.py:229-275`): before a weekday's close it is that day; after it, the next weekday. The calendar has no holiday list; a holiday so named carries nothing, because legacy holds no latch for a day it has not traded. A latch is carried only for that day, legacy's per-day meaning (step 2), so the import neither adds nor removes a first-day gate compared with legacy. SLICE-14's carry (PRF-MIG-13) reads this field.

#### The six events (ledger-spec catalogue, `resources/events.schema.json`)

Every one carries envelope `provenance: legacy_import`, `execution_domain: none` and family **`migration`** *(S3-5)*, legacy's family for its import events (`src/tier1/importer/__init__.py:158`).

| Kind | Payload |
|---|---|
| `IMPORT_BOUNDARY_PINNED` | As above. A superseding boundary carries the **same** `import_id` *(S3-6)* |
| `LEGACY_RECORD_IMPORTED`, `LEGACY_RECORD_REJECTED`, `LEGACY_RECORD_QUARANTINED` | `import_id`, `source`, `store_row`, `reader`, `file`, `line`, `offset`, `present`, `record_digest`, `raw_b64`, `outcome`, `reason`, `identity` (legacy's identity keys, including a registry row's `broker_order_id`, as evidence only), `chain`, `legacy_at` (the record's own `at`, verbatim, or null), `record` (the parsed record, null when it did not parse) |
| `IMPORT_COMPLETED` | `import_id`, per source the nine terms and `seen`, `unimported` and `vanished` (below), `stream_digest`, `blocks` |
| `IMPORT_VIEWS_COMPARED` | `import_id`, `legacy_views` (the file's SHA-256, `legacy_commit`, `run_digest`), `clean`, `defects`, `migrations`, `errors` *(re-review 9)* |

* **`event_time` is the import clock's** *(S3-4)*. `_append` writes every event's `event_time` from the writer's clock (`kernel/ledger/store.py:762`); `EventDraft` gains no time field. Legacy's `at` is an IST `+05:30` string; as an `event_time` it would sort after the UTC `Z` string of the same instant in `latest_time`'s string `max` (`store.py:464-469`) and push `effective_now` (`kernel/lifecycle.py:43-51`) up to 5 h 30 m ahead. **Deviation** from legacy's importer, which set `event_time` to `at` (`src/tier1/importer/__init__.py:157-161`): `at` is kept verbatim in the payload as `legacy_at`.
* **Which kind each outcome takes** *(S3-10)*. Store records: `IMPORTED` → `LEGACY_RECORD_IMPORTED`, `REJECTED` → `LEGACY_RECORD_REJECTED`, `QUARANTINED` → `LEGACY_RECORD_QUARANTINED` (step 2's `classify_store`). Tier-1 rows (step 2's `classify_tier1`): `transferred`, `evidence_matched`, `superseded` and `anomaly` → `LEGACY_RECORD_IMPORTED` with that `outcome`; `quarantined` → `LEGACY_RECORD_QUARANTINED`; a Tier-1 row is never rejected (its `raw` is built from stored columns, step 1). The manifest fold counts **by the payload's `outcome`, never by kind**.
* **Ledger module changes** *(S3-5)*: `EventDraft` gains `provenance` (default `native`), which `_append` writes instead of the fixed `"native"` (`store.py:759`), refusing `legacy_import` on any other kind and these five without it; `_FAMILY` (`store.py:32-50`) maps the five kinds to `migration`; `_PK` (`store.py:51-61`) gains `"import_manifest": ("import_id", "source")`; `_load_touched` (`store.py:792ff`) loads `import_manifest WHERE import_id = ?` for each of the five kinds, so a batch folds from the stored counts and never from empty rows; `kernel/ledger/projections.py` adds `import_manifest` to `TABLES` (`:13-17`) and fold rules for the five kinds (its fold raises on an unknown kind); `kernel/ledger/schema.py` registers `Migration(10, "import", "010_import.sql")` after `:38`; `resources/events.schema.json` gains the five kinds. No other table is added.

#### No identity map *(S3-1; S3-2 and S3-3 not applicable)*

* **Decision (coordinator):** every legacy order stays foreign (Q-016: "recorded and raises an operator alert; nothing else changes"). The registry rows' broker IDs stay inside the `IMPORTED` events as evidence only. There is no `legacy_order_identity` table, no change to `kernel/reconciliation.py`, and no `origin` field on `FOREIGN_RECORDED`.
* **Why it gates nothing.** `reconciliation.foreign_response` allows only `record_only` and `escalate` (`settings/schema.py:269-270`; `resources/defaults.yaml:38`), so `hold_entries` cannot be set; a `foreign_activity` escalation reaches only `kernel/lifecycle.py:526-528` and is not one of the safety module's hold reasons (`kernel/safety.py:207`, `:608-614`). The cutover runs after the close, so the next session's book should not show the cutover day's orders (the reviewer's reading of the broker's day-scoped book, **not checked** against OpenAlgo here); if one does appear, it is recorded, alerts, and gates nothing.
* **S3-2** (the map's ID set, conflicting claims, the IST day, "working") and **S3-3** (how the shadow would not see the map) are **not applicable**: there is no map.
* The migration spec's "Identities" bullet is rewritten to say the same.

#### `010_import.sql` (T-91) and its fold

* **`import_manifest`**, one row per `(import_id, source)`: `import_id`, `source`, `store_row`, `boundary` (the latest boundary event's sequence), `events`, `seen`, the nine terms below, `first_sequence`, `last_sequence`, `stream_digest`, `converter_version`, `state`. The boundary event creates or updates every source's row (`state` `interrupted`); each per-record event adds one to `events` and moves `first_sequence` and `last_sequence`; `IMPORT_COMPLETED` writes `seen`, the nine terms and `stream_digest` from its payload and sets `state` `complete` (the equation's terms, so an event outside the equation is never counted in them). D04 (`check_index`, `repair_index`) rebuilds and checks the table.
* **`stream_digest`** is legacy's (`src/tier1/importer/manifest.py:24-31`) over `[file, line, record_digest]` of this import's per-record events for the source, in sequence order; computed by the importer, stored in `IMPORT_COMPLETED`.

#### Accounting *(S3-6)*

* **The terms.** For every source, **`seen` is the number of records in the latest staged read** (with legacy's `absent` records for vanished snapshots), and `seen = transferred + rejected + quarantined + evidence_matched + superseded + anomaly + line_anomaly + stopped + after_boundary`, each record counted once *(re-review 6)*. An event of this import that covers no current record (the old version of a changed line, an earlier snapshot version) sits outside the equation; a line imported earlier and now gone is listed in `IMPORT_COMPLETED.vanished`, outside the equation, and its file blocks.
  * **Event-backed** (one per-record event each, counted by `outcome`): `transferred`, `rejected`, `quarantined`; and for the Tier-1 ledger `evidence_matched`, `superseded`, `anomaly` (step 2's meanings for legacy's own `LEGACY_RECORD_IMPORTED` rows).
  * **Not event-backed**, each listed record by record in `IMPORT_COMPLETED.unimported` as `[term, file, line, record_digest]`: `line_anomaly`, a current line (or Tier-1 sequence) that this import imported under a superseded boundary with another digest; `stopped`, every record of a file at or after its first `line_anomaly` that this import had not yet imported (legacy imports nothing more from such a file, `src/tier1/importer/__init__.py:107-116`); `after_boundary` (below). A file with a `line_anomaly` or `stopped` record is added to `blocks`.
  * This changes step 2's rule that the middle terms are 0 for store sources: `line_anomaly` and `stopped` can arise for any log source, and only under a superseding boundary.
* **`MIG-R02`** refuses `IMPORT_COMPLETED` unless, per source: the equation holds; each event-backed term equals a recount, inside the same transaction, of this import's events that cover a current record, by `outcome`; each non-event term equals its entries in `unimported`; and every record of the latest boundary's staged read is either matched by an event of this import with the same `(file, line, record_digest)` (for a snapshot, the file's last event) or listed in `unimported`.
* **One `import_id`** per ledger, across resumes and superseding boundaries, so the manifest has one row per source and every row reaches `complete`.

#### Batches, resume and a changed boundary

* **Batches.** Each source's records commit in batches of at most `migration.batch_records` (new setting, `int_pos`, engineering default 500, not a money value), one `Decision` and one transaction per batch. A crash inside a batch rolls it back (CP-I1).
* **What is already imported** is read from the ledger itself, never from a side file (legacy's `scan`, `src/tier1/importer/__init__.py:73-87`): this import's events give `file → {line: record_digest}` for a log, the last digest per file for a snapshot, and the sequences for the Tier-1 ledger. A resumed run imports nothing twice (CP-I2).
* **A changed boundary.** A resumed run whose re-staged inputs do not match the pin refuses with **`MIG-R03`**. In `follow` only, `--reconcile-boundary REASON` records a new `IMPORT_BOUNDARY_PINNED` with the same `import_id`, naming the one it supersedes and the reason, and continues: lines already imported and unchanged count by their events; changed or vanished ones are `line_anomaly` and the rest of their file `stopped`; snapshots follow legacy (a new version is a new record, a vanished file an `absent` record). **In `pin`, `--reconcile-boundary` is refused**: the ledger is set aside and a fresh one started (SLICE-14 sets aside an earlier attempt's ledger on retry).

#### `after_boundary`

* In `follow`, a record of a later-captured store that names an identity absent from an earlier-captured one is newer than the boundary: counted `after_boundary`, listed in `unimported`, not an error. The pairs: a reservation commit marker (row 3) whose `reservation_id` has no `RESERVED` event in row 2; a reservation event (row 2) whose `structure_instance_id` has no registry row (row 1); a structure command (row 9) whose `structure_instance_id` has no registry row. In `pin`, the same case refuses `IMPORT_COMPLETED` (**`MIG-R04`**).

#### Validation at the same boundary *(S3-9)*

All thirteen of legacy's comparator views are ported: `orders`, `structures`, `reservation_markers`, `reservations`, `holds`, `loss_latch`, `structure_commands`, `pauses`, `authority`, `kill_switch`, `sender_lease`, `checkpoints`, `records` (`src/tier1/compare.py:114-214`).

* **The target side** ports legacy's `load_shadow` and `shadow_views` (`compare.py:91-104`, `:114-214`) line for line, over this import's per-record events of all three kinds (legacy's shadow side reads every record it imported, `:91-104`), using each payload's `record`, `present` and `chain`.
* **The legacy side is a file, `legacy_views/1`** *(re-review 9)*: `{"format": "legacy_views/1", "legacy_commit", "run_digest", "views": {the thirteen}, "errors": [...]}`, produced by legacy's own `compare.legacy_views` (`compare.py:233-327`) run from legacy's checkout over the staged run directory (`<ledger dir>/.import-<import_id>/run`). `run_digest` is the SHA-256 over the sorted `[relative path, SHA-256]` of every staged file, computed by the importer's `run_digest()`; the file is refused (**`MIG-R07`**) unless its format, all thirteen view names and its `run_digest` match. **The production runner of legacy's code belongs to step 6** (the shadow on production: legacy's checkout on the EC2, through `isolated_work.py`); step 3 fixes the format and the importer's side. **In the tests the file is produced from the fixtures** by the generator (`scripts/gen_legacy_fixtures.py --views-only`, which stages each fixture run with the importer's own staging function and runs legacy's `legacy_views` over it), and `golden.json` gains legacy's own `shadow_views` and `compare` report over the same staged bytes, so the port is checked against legacy's shadow side too.
* **`migrate_legacy.py compare --into LEDGER --legacy-views FILE`** computes the target side, compares as legacy's `compare` does (`compare.py:355-384`; the chain check is the target's `verify_chain`), records **`IMPORT_VIEWS_COMPARED`** with `clean` true only when there is no defect, and only then deletes staging. It refuses before `IMPORT_COMPLETED`. **SLICE-14's `HISTORY_TRANSFERRED` requires a clean `IMPORT_VIEWS_COMPARED` for the cutover's import** (added to the spec's "What blocks").
* **Every difference is a defect** unless legacy's one `SEMANTIC_MIGRATIONS` row explains it (an active reservation without its commit marker shown as `uncertain`, `compare.py:48-61`), ported with its reason and reference. Step 5's approved-difference table is separate and adds nothing here.

### Tests

| File | Test | Proves |
|---|---|---|
| `tests/contracts/test_legacy_schemas.py` | Accounting (PRF-MIG-07) | Importing the fixtures: per source the equation holds; the event-backed counts equal step 2's `classify_store` and `classify_tier1`; `IMPORT_COMPLETED` refused (`MIG-R02`) when a count, an `unimported` entry or a coverage match is altered |
| same | Tier-1 kinds *(S3-10)* | Every Tier-1 `transferred`, `evidence_matched`, `superseded` and `anomaly` row is a `LEGACY_RECORD_IMPORTED` with that `outcome`; every `quarantined` row a `LEGACY_RECORD_QUARANTINED`; the manifest's counts come from `outcome` |
| same | Bytes kept | Every event's `raw_b64` decodes to the record's bytes and hashes to its `record_digest`; every legacy record has exactly one event or one `unimported` entry |
| same | Event time *(S3-4)* | With a recorded clock set before every fixture `at` in UTC terms, every import event's `event_time` is the clock's; `latest_time` after the import equals the clock's time; each `legacy_at` equals the record's `at` |
| same | Family and touched rows *(S3-5)* | Every import event's stored `family` is `migration`; after an import of three batches per source the manifest counts equal the record counts (not the last batch's) |
| same | Inputs *(S3-7)* | `MIG-R06` for: an input root inside a legacy run or market root; a ledger path inside the input root; a Tier-1 file in WAL mode (the step 1 fixture copy before its `journal_mode` change); a Tier-1 file with a `-wal` beside it; a weekend `--day` |
| same | Pinned prefixes *(S3-7)* | In `follow`, lines appended to an input log and a snapshot rewritten after the pin are not read; `seen` equals the pinned counts; a resume with a changed input log prefix refuses `MIG-R03` |
| same | Absent records *(S3-7)* | Under a superseding `follow` boundary with a hold file removed from the input: one `absent` `IMPORTED` event; the `holds` view no longer shows it; a removed registry file: each imported line `line_anomaly`, the file in `blocks` |
| same | Derived safety in the pin *(S3-8)* | The pin's `derived_safety` equals `golden.json`'s Tier-1 views and `holds.engaged`; `first_session_day` for `captured_at` 2026-11-02T08:30Z (Monday 14:00 IST) is 2026-11-02, for 2026-11-02T20:00Z (Tuesday 01:30 IST) is 2026-11-03, for 2026-11-06T12:00Z (Friday 17:30 IST) is 2026-11-09; the 2026-11-02 latch carried only in the first case |
| same | Repeat and resume | A second run on a completed ledger refuses `MIG-R05`; a run stopped after two sources resumes under the same `import_id` and imports the rest once; two `EPOCH_ACTIVATED`, the second retiring the first, both `migration:` principals |
| same | Changed boundary *(S3-6)* | `follow` with a changed registry line and `--reconcile-boundary`: one `import_id`, a superseding boundary event, the changed line `line_anomaly`, its file's later lines `stopped`, the file in `blocks`, every manifest row `complete`; without the flag `MIG-R03`; in `pin` with the flag refused |
| same | `after_boundary` | A marker with no reservation: `after_boundary` and listed in `unimported` in `follow`; `MIG-R04` in `pin` |
| same | Blocks | The quarantined registry line, `FUTURE_KIND`, a refused chained file and a `line_anomaly` file each appear in `IMPORT_COMPLETED.blocks` |
| same | Thirteen views *(S3-9)* | Per fixture run directory: the target's rebuilt views equal legacy's `shadow_views` in `golden.json`; `compare` against the fixture's `legacy_views/1` file records an `IMPORT_VIEWS_COMPARED` whose defects and migrations equal legacy's `compare` report, including `kill_switch` for the variant's `KILL`, `pauses` and `structure_commands`; staging is deleted only after it; a file with another `run_digest`, format or a missing view refuses `MIG-R07`; `compare` before `IMPORT_COMPLETED` refuses |
| same | `pin` freshness *(re-review 7)* | `pin` without `--legacy-stopped-at`, with only the nightly copy, with a final copy or a last pass started before the stop: each refuses (`MIG-R08`); with both after the stop it imports; the copier's `--final` copy and the nightly copy coexist |
| same | Continue-legacy composes *(re-review 8)* | `compose_migration` opens a ledger holding a kernel epoch (after a `KERNEL_STARTED`-like start, no claim) and one holding an `IMPORT_COMPLETED`; it refuses one with a `DISPATCH_CLAIMED`; the import command refuses the first two (`MIG-R01`, `MIG-R05`) |
| same | No identity map *(S3-1)* | After an import, `010_import.sql` created only `import_manifest`; a reconciliation over a book holding an imported registry `broker_order_id` (terminal, labelled synthetic) under `escalate` records it `foreign` and escalates `foreign_activity`; no hold is engaged and admission of a new entry is unchanged |
| same | Cannot dispatch *(S3-11)* | `MIG-R01` on a ledger with a `DISPATCH_CLAIMED` or a non-`migration:` epoch; between batches, the import's test hook closes the migration writer (releasing its lock), `conftest.build` commits a dispatched entry on the same path, and the resumed import refuses before its next batch with no import event after the claim; the composition holds no adapter or coordinator; `legacy_import` provenance refused on any other kind |
| same | D04 | `check_index` is clean after an import; deleting an `import_manifest` row is found and `repair_index` restores it |
| `tests/recovery/test_crash_boundaries.py` | CP-I1 | The import killed inside a batch (a child process exits 86 after the batch's events are built, before commit): the batch rolls back; the rerun imports every record once |
| same | CP-I2 | Killed between sources: the rerun keeps the boundary and the `import_id`, and imports the rest once |

### Break checks

1. Count a quarantined record as transferred: the accounting test fails.
2. Skip the equation check before `IMPORT_COMPLETED`: the altered-count test fails.
3. Resume from a side file instead of the ledger: the resume and CP-I2 tests fail.
4. Continue a file after a `line_anomaly`: the changed-boundary test fails.
5. Make `no_dispatch_possible` return nothing: the cannot-dispatch test fails.
6. Fold registry rows earlier-wins: the thirteen-views test fails (`orders`).
7. Use the record's `at` as `event_time`: the event-time test fails.
8. Classify an imported broker order as known in reconciliation (a lookup of `IMPORTED` registry IDs): the no-identity-map test fails.
9. Omit `derived_safety` from the pin: the derived-safety test fails.
10. Compute `first_session_day` from the UTC date: the derived-safety test fails (the 20:00Z case).
11. Leave `stopped` uncounted: the changed-boundary test fails (`MIG-R02`).
12. Drop the WAL header check: the inputs test fails.
13. Read whole input files instead of the pinned prefixes: the pinned-prefixes test fails.
14. Start a new `import_id` on `--reconcile-boundary`: the changed-boundary test fails (a row left `interrupted`).
15. Drop the absent record for a vanished snapshot: the absent-records test fails.
16. Count Tier-1 evidence rows by kind: the Tier-1 kinds test fails.
17. Drop the `kill_switch` view, or fold `pauses` first-wins: the thirteen-views test fails.
18. Leave `import_manifest` out of `_load_touched`: the family-and-touched-rows test fails.
19. Accept a final copy started before the stop: the `pin` freshness test fails.
20. Put the epoch clause in `compose_migration`: the continue-legacy test fails.
21. Skip the `run_digest` match on the legacy views file: the thirteen-views test fails.
22. Count a superseded line's old event in `seen`: the changed-boundary test fails.

### Files

* **New:** `src/autonomous_trading/operations/legacy_import.py` (T-102); `scripts/migrate_legacy.py`; `src/autonomous_trading/resources/migrations/010_import.sql` (T-91).
* **Changed:** `bootstrap.py` (`compose_migration`); `kernel/ledger/store.py` (`EventDraft.provenance`, `_FAMILY`, `_PK`, `_load_touched`), `kernel/ledger/projections.py` (`TABLES` and five fold rules), `kernel/ledger/schema.py` (migration 10), `resources/events.schema.json` (five kinds); `settings/schema.py`, `resources/defaults.yaml`, `tests/unit/test_settings_resolver.py` (`migration.batch_records`); `scripts/gen_legacy_fixtures.py` and `golden.json` (legacy's `legacy_views`, `shadow_views` and `compare` report per fixture run directory); the tests above. `kernel/reconciliation.py` and `FOREIGN_RECORDED` are **not** changed.
* **Specs (reported to their owners):** the ledger spec's catalogue (five kinds in family `migration`, `provenance` on drafts); the configuration spec (the migration composition); this slice's sections of the migration spec (inputs, the pin's fields, the terms, no identity map, thirteen views).

### Fork calls and Deviations

* **Deviation:** the importer lives in the package, with the script as its command line.
* **Deviation:** `event_time` is the import clock's; legacy's `at` is `legacy_at` in the payload (legacy set `event_time` to `at`, `src/tier1/importer/__init__.py:157-161`) *(S3-4)*.
* **Deviation:** one import per ledger (`MIG-R05`), where legacy imports incrementally into one ledger.
* **Deviation:** inputs are staged at their pinned prefixes and hash-checked; legacy's importer read the live stores whole (`src/tier1/importer/sources.py:289-338`).
* **Deviation:** `line_anomaly` and `stopped` are counted terms with each record listed; legacy reported an anomaly as text and did not count the stopped remainder (`src/tier1/importer/__init__.py:107-116`).
* **Deviation:** raw bytes are stored base64 in the payload (`raw_b64`), where legacy stored decoded text only for error records (`src/tier1/importer/__init__.py:147-149`).
* **Deviation (from the migration spec, not from legacy):** no legacy order identity map; legacy orders are foreign after the cutover (Q-016). It changes no gate (above).
* No Fork call: no imported record is given a target meaning; the views are rebuilt only to compare and feed no decision; the derived safety state is recorded, and only SLICE-14 engages anything from it, with legacy's per-day latch meaning.

### Completion conditions (step 3)

The tests pass twice in a row with the layering guards and the crash-boundary file; every break check fails a listed test and every file is restored (md5); D04 is clean after an import; the step is recorded "as built".

### Step 3 as built

Commit `3c49916` on `slice-13`, on top of `51e5a81` (step 2): 26 files, 2 520 lines added, 22 removed. Not pushed. Reviewed twice before building ("Ready to build: no", then "yes after fixes"); the fixes are in the plan above.

**As planned, with these choices and findings:**

* **Files.** New: `operations/legacy_import.py`, `scripts/migrate_legacy.py`, `resources/migrations/010_import.sql`, `tests/contracts/test_legacy_import.py` (the step's tests live in their own file, not in `test_legacy_schemas.py`), and the eight `legacy_views/1` files under `tests/fixtures/legacy_stores/legacy_views/`. Changed: `bootstrap.py` (`compose_migration`, `MigrationRefused`), `kernel/ledger/store.py`, `projections.py`, `schema.py`, `resources/events.schema.json`, `adapters/legacy_copier.py` (`VIEW_ONLY`, `.copier-pass.json`, `copy --ledger --final`), `settings/schema.py` and `defaults.yaml` (`migration.batch_records`, 500, installer-scoped), `scripts/gen_legacy_fixtures.py` (`--views-only`), `golden.json` (`views`), `tests/recovery/test_crash_boundaries.py` (CP-I1, CP-I2), and two tests that pin the bundle's last migration (`test_installed_artifact.py`, `test_custody_promotion.py`: 9 becomes 10).
* **The fixtures were not regenerated.** `--views-only` stages each fixture run directory with the importer's own `stage()`, runs legacy's `compare.legacy_views` over the staged bytes (the `legacy_views/1` file), and runs legacy's importer, `shadow_views` and `compare` over the same bytes (`golden.json["views"]`). Every other fixture file's md5 is unchanged.
* **Legacy's own comparator over the fixtures:** the main run and five variants are clean; `pause_sequence` has two `pauses` defects (legacy's own result, reproduced by the target). The target's port gives the same views and the same defects for every run except `broken_chain`, a sparse variant with no registry, whose three structure commands the target counts `after_boundary` (their structure has no registry row), so its `structure_commands` and `records` views differ from legacy's, which imported them. The test pins exactly that.
* **One `after_boundary` pair dropped (correction, found at build).** The plan paired a reservation event (row 2) with the registry (row 1). Legacy reserves before it opens an order, and a released reservation never has one (the fixture's `res-1`), so the pair counted legitimate records as newer than the boundary and would refuse every cutover (`MIG-R04`). Only the two pairs legacy always writes in order are kept: a commit marker after its `RESERVED` event, a structure command after its structure's registry rows. No money value or gate is touched; it makes the cutover refuse less, only where the plan's rule was wrong.
* **`outcome` holds the term name** (`transferred`, `rejected`, `quarantined`, `evidence_matched`, `superseded`, `anomaly`), and `record` is present in all three record kinds (null when the record did not parse), so the ported shadow views read every imported record as legacy's do.
* **`IMPORT_BOUNDARY_PINNED` also carries `store_rows`** (source to authority-map row), which the manifest fold needs.
* **`MIG-R08`** is also the code when `pin` finds no `-final.db` copy at all.
* **The between-batches claim is refused at the resumed run's composition** (`compose_migration` refuses on `DISPATCH_CLAIMED` before anything else), so the import command's in-batch precheck is defence in depth; `test_import_possible_rule` and `test_continue_legacy_composes` exercise `import_possible` itself.
* **No identity map, checked by state:** after an import, every index table a reconciliation or admission reads (`command_identity`, `command_attempt`, `reservation`, `broker_identity`, `position`, `safety_state`, `reconciliation_fact`, `grant`, `session`) is empty, so reconciliation, which identifies an order only through `broker_identity`, cannot recognise a legacy order. The reconciliation path itself is unchanged and keeps its SLICE-07 tests.
* **Trap (carried):** `tests/contracts/test_capabilities.py`'s `_modules_after` runs `python -I`, which checks the main `OA_NEW` checkout from this worktree; its guards were not relied on for the new module.

**Fork calls:** none. **Deviations:** as listed in the plan, plus the dropped pair above (a correction).

**Tests run (Windows, affected only):** `tests/contracts`, `tests/unit`, `tests/recovery` and `tests/integration/test_custody_promotion.py` (the ledger modules are shared, and the worktree has no code-graph index to narrow them). Run 1: 2 020 passed, 14 skipped, 1 failed, `test_cognition_assembly.py::test_capacity_with_threads`, a thread-and-deadline test of the cognition runtime that touches no changed module and passes alone (load-flaky). Run 2, after the last test edit: 2 021 passed, 14 skipped, 0 failed. The new `test_legacy_import.py` holds 38 tests; the crash file gains `test_import_crash_points[CP-I1|CP-I2]`. `ast.parse` passes on every edited Python file.

**Break checks** (script `break_step3.py` in the session scratchpad), each failing its listed test, each file restored and its md5 confirmed:

| Break | Failed |
|---|---|
| 1. Count a quarantined record as transferred | `test_accounting` |
| 2. Skip the equation check | `test_altered_count_refused` |
| 3. Resume from a side file, not the ledger | `test_repeat_and_resume` |
| 4. Continue a file after a `line_anomaly` | `test_changed_boundary` |
| 5. `import_possible` returns nothing | `test_continue_legacy_composes` |
| 6. Fold registry rows earlier-wins | `test_thirteen_views[run]` |
| 7. Legacy's `at` as `event_time` | `test_event_time_is_the_import_clock` |
| 8. An imported broker order folded into `broker_identity` | `test_no_identity_map` |
| 9. Omit `derived_safety` from the pin | `test_derived_safety_in_the_pin` |
| 10. `first_session_day` from the UTC date | `test_first_session_day_rule` |
| 11. Import the `stopped` remainder | `test_changed_boundary` |
| 12. Drop the WAL header check | `test_inputs_refused` |
| 13. Read the input, not the pinned prefixes | `test_reads_only_the_pinned_prefixes` (rewritten once: the first version grew the input after the stores were read and did not bite) |
| 14. A new `import_id` on `--reconcile-boundary` | `test_changed_boundary` |
| 15. Drop the absent record for a vanished snapshot | `test_absent_records_under_a_superseding_boundary` |
| 16. Count Tier-1 evidence rows by kind | `test_tier1_event_kinds` |
| 17. Drop the `kill_switch` view | `test_thirteen_views[run]` |
| 18. `import_manifest` out of `_load_touched` | `test_family_and_touched_rows` |
| 19. Accept a final copy started before the stop | `test_pin_freshness` |
| 20. The epoch clause in `compose_migration` | `test_continue_legacy_composes` |
| 21. Skip the `run_digest` match | `test_legacy_views_file_refusals` |
| 22. Count a superseded line's old event in `seen` | `test_changed_boundary` |
| 23. The copier skips the view-only file | `test_copier_pass_stamp_and_final_copy` |
| 24. A batch's events committed one by one | `test_import_crash_points[CP-I1]` |

## Step 4 — the `orders/1` projection

<a id="step-4--the-orders1-projection-outline"></a>

The authorities are the migration spec's [compatibility projections](../../design/migration-recovery-rollback-continuity.md#compatibility-projections-adapterscompatibilitypy), the ledger spec's REQ-LED-006 and CP-L4, PRF-MIG-09 and PRF-LED-06. Step 4 is TASK-S13-03. Legacy citations are at 445eb116; target citations are at `3c49916` (step 3) on `slice-13`.

**It stops for review before building, because it touches money facts.** The projected lines carry the fill and close facts (`filled_qty`, `price`, `closed_qty`, `close_price`, `closed_at`, `close_reason`) that legacy's P&L monitor, cost reconciliation and trade reader turn into money (`monitoring/account_pnl_service.py:71-109`; `src/analysis/core/cost_reconciliation.py:78-107`; `src/analysis/core/from_registry.py:132-194`), so by the fork rule each line gives legacy's readers exactly what legacy wrote. It no longer touches the send path (S4-8). It changes no score, threshold or entry gate.

**In plain words.** The new system writes the old system's order file, line for line in the old format, into its own folder, so the old reports keep working. A helper thread does the writing after each pass, reading the ledger on its own read-only connection; the part that sends orders never waits for it, and a failure there can never stop the kernel or cause a resend. Each order's lines go to the file of the day it was admitted, as the old system did. Fills, closes and their prices are computed exactly as the old system computed them, including its rounding. The proof runs the old system's own readers over the new file and over the file the old system itself wrote for the same story, and requires the same answers.

**Rework (2026-11-04).** The first version of this plan was reviewed "Ready to build: no" with twelve findings, marked *(S4-n)*; the re-review said "yes after fixes" with seven more, marked *(R2-n)*, and a note on the midnight case. Each is answered below where it applies. The coordinator's decisions are applied as given; the fork rule decides every mapping.

### Decisions

#### The serializer (`adapters/compatibility.py`, `OrdersSerializer`)

* **Shape.** `OrdersSerializer(exchange)` is a fold: `feed(event) -> list[tuple[day, bytes]]`, holding per command its admitted facts, attempts, cumulative fills and close accumulator in memory. Each line is legacy's registry line (`src/core/framework/execution/registry.py:186-275`, `:317-415`, `:601-757`, `:1254-1306`) plus `projection: {format: "orders/1", source_sequence, source_hash}`, canonical JSON, one `\n` per line. It builds bytes only and writes nothing (the module's reach test keeps every write and lock call refused; its import set gains `datetime` only).
* **Identity fields** *(S4-7)*. `our_order_id` = `<strategy>:<command_key>#<attempt_no>` (legacy's `owner:…#attempt` form, `registry.py:114-125`; `owner` = the strategy, which must match legacy's `OWNER_RE`, `:1922-1930`); `owner`; `symbol` (the plan's instrument); `action` (the side, upper case); `quantity` and `attempt` as legacy writes them (`float`, `int`; `registry.py:206-208`). **`exchange`** is `accounts.<name>.exchange` from settings (`settings/schema.py:16-21`), legacy's configured adapter value (`adapters/openalgo.py:654`); no event carries it. **`decision_id`**: for an entry, the admitted plan's `application.intent_digest` from its `COMMAND_ADMITTED` payload (`kernel/admission.py:70-90`; equal to `request.intent_ref`); for a close, cancel or modify, its own `command_key`, legacy's `action_id` role for a lifecycle row (`src/runtime/session_close.py:223-236`).
* **`day` and `at`** *(S4-4)*. `day` is `CALENDARS["nse-fo/v1"].exchange_date` (IST) of the `event_time` of the command's **`COMMAND_ADMITTED`**, fixed for every line of every attempt of that command, including the close fields written onto an entry: legacy fixes `day` at open and writes every later line to that file (`registry.py:211-214`, `:361`, `:411-414`, `:662`, `:756`), and its strict reader refuses a `day` that changes for one `our_order_id` (`:2147-2170`). `at` is the line's own event instant rendered in IST with offset (`isoformat`, legacy's form, `:110-111`, `:202`). IST is a fixed `+05:30` offset (no DST), checked in the tests against `exchange_date`.
* **The state mapping** *(S4-1, S4-2, S4-3)*. Target transitions from `kernel/lifecycle.py:17-36`; legacy's machine `src/core/framework/execution/states.py:27-82`. "Entry-like" means an entry or a close (each has a broker order of its own); a cancel or modify has none (it acts on its target's order, `lifecycle.py:470-472`).

  | Target event | Legacy line | Legacy source |
  |---|---|---|
  | `ADMISSION_REFUSED` | **none**: legacy never opened an order for a refused admission | |
  | `COMMAND_ADMITTED` | `formed` for attempt 1 (a close, cancel or modify also carries `parent_our_order_id` and `parent_broker_order_id`, below) | `open_order`, `registry.py:186-275` |
  | `DISPATCH_REFUSED` | `rejected` with `reason` = the refusal's code and message, on the would-be attempt's row (after its `formed`, below) | the fenced send, `src/runtime/execution_gateway/__init__.py:1041-1047` |
  | `DISPATCH_CLAIMED` | `sent`; for attempt 2 or later first that attempt's `formed`, then `sent` (legacy opens each attempt as its own row) | `mark_sent`, `:1049-1054` |
  | `OUTCOME_NOT_SENT` | `rejected`, `reason` `"not sent: <cause>"`; the command returns to `ADMITTED` and its next claim is attempt n+1, legacy's "retryable as a new attempt" | `:1082-1091`; `session_close.py:261-268` |
  | `OUTCOME_REJECTED` | `rejected`, `reason` from the broker's message | `:1123-1130` |
  | `OUTCOME_ACKNOWLEDGED`, entry-like | `ack`, `broker_order_id` = the entry (or close) leg's, and for an entry `protective_order_ids` (stop first, then by ID) and `protective_roles` `{id: role}` from the acknowledged legs | `:1119-1122` |
  | `OUTCOME_ACKNOWLEDGED`, cancel or modify *(R2-2)* | `ack` with `broker_order_id` = the ID the broker returned (a cancel: the cancelled order's; a modify: the replacement's), as the supervisor's `settle` writes when an ID comes back; plus a line on the **parent** with no `state`: for a cancel legacy's `record_cancel` (`cancelled_order_ids`, the accumulated sorted set, and `cancelled_at`); for a modify that moves a stop, legacy's `record_stop_moved` (`protective_order_ids` and `protective_roles` with the replacement in the old ID's place, `trail_stop` = `round(float(trigger), 2)`, `trail_stop_order_id`, `trail_stop_at`, `protection_reconciled_at`) | `structure_supervisor.py:1212-1218`; `execution_gateway/__init__.py:1268-1290`, `:1483-1485`; `registry.py:1177-1252`, `:1603-1846` |
  | `OUTCOME_AMBIGUOUS` | `unknown` | `mark_unknown`, `:1096-1102` |
  | `RESOLVED_REACHED`, entry-like | `ack` with `broker_order_id`, `protective_order_ids` and `protective_roles` from the event's legs | `src/core/framework/execution/reconcile.py:566-572`, `:605-611` |
  | `RESOLVED_REACHED`, cancel or modify | `ack` with the leg's ID and the parent line, as `OUTCOME_ACKNOWLEDGED` | as above |
  | `RESOLVED_NEVER_REACHED` | `rejected`, `reason` "never reached the broker" (`unknown → rejected` is legal, `states.py:78`); the next claim is a new attempt | `reconcile.py:269-270`, `:308-310`; `session_close.py:261-268` |
  | `LEG_ASSIGNED` (stop or target) | a line with **no `state`**: the merged `protective_order_ids`, `protective_roles` and `protection_reconciled_at` | `record_protection`, `registry.py:1254-1306` |
  | `FILL`, entry or close leg | `partial` or `filled` (below) | `scripts/run_framework_live.py:6072-6161` |
  | `FILL`, protective leg, or a close command's leg | also the close fields on the **entry's** line (below) | `:6175-6262`, `:6579-6602` |
  | `COMPLETED`, entry-like | **none**: legacy's entry ends `filled` (terminal, `states.py:82`); its cost tool and trade reader need `filled` (`cost_reconciliation.py:93`; `from_registry.py:132`) | |
  | `COMPLETED`, cancel or modify | **none**: legacy writes `completed` only for an action that returns no broker ID (`structure_supervisor.py:1219-1227`), and the target's cancel and modify always name one | |

  A `reason` is free text in legacy and no listed reader parses it. Legacy's structure supervisor sends a not-sent lifecycle action back to `formed` instead (`structure_supervisor.py:1229-1235`); the coordinator's decision follows the gateway (`rejected`), and the reader parity below proves the in-flight sets agree.
* **Fills on the order's own line** *(S4-6)*. For each committed decision that holds `FILL` events for an entry's (or a close's) own leg, one line: `filled_qty` = the cumulative quantity as a `float`, `price` = `round(notional / filled_qty, 4)` where `notional` is the sum of `float(quantity) * float(price)` over the order's own-leg `FILL` events **in ledger sequence order** (legacy's float computation, `run_framework_live.py:6087-6108`, `:6146-6151`); `state` `filled` when `filled_qty >= quantity`, else `partial`. No line once the row is `filled` (legacy's `states.can`, `:6101-6102`). The ledger keeps its exact decimals; only the projection repeats legacy's floats. A structure leg's fill carries `filled_qty` only, no price (`src/runtime/execution_gateway/structures.py:298-316`).
* **Close fields on the entry's line** *(S4-5)*. Every closing fill, from a protective leg or from a close command, accumulates onto the entry it closes (the close command's `target`; a protective leg's own entry), and each committed decision holding one writes a `record_close`-shaped line with **no `state`** (`registry.py:601-757`), to the entry's `day` file:
  * `closed_qty`: the cumulative closed quantity as a `float`, capped at the entry's `filled_qty` (legacy's `min`, `run_framework_live.py:6580-6583`); `closed_at`: the line's IST instant;
  * `close_price`: `notional / closed_qty`, **unrounded** (`:6593-6595`), the notional summed as floats in ledger sequence order;
  * `close_reason`: the last protective fill's role as `STOP_HIT` or `TARGET_HIT` in ledger order (`:6193-6195`); `TIER1_CLOSE` for a close command's fill only when no protective reason is set (legacy's `setdefault`, `:6260`);
  * `close_fill_id`: the sorted fill IDs joined with `|` (`:6597`);
  * for a close command's fills, `close_broker_order_id` (the close's broker ID), `close_broker_allocations` `{id: qty}` and `close_broker_allocation_notionals` `{id: notional}` (`:6250-6259`; `registry.py:705-735`).
  * The close command's own row also gets its `partial`/`filled` line with its own `price` and `filled_qty` (legacy's lifecycle rows, `:6128-6161`).
  * `SQUARE_OFF` (a broker flattening, `:6553`) is never written: the target records a broker close it did not send as foreign activity (Q-016), so no target event names it.
* **Parent fields** *(S4-7, R2-6)*. A close, cancel or modify row carries `parent_our_order_id` and `parent_broker_order_id` on every line, both or neither as legacy's strict reader requires (`registry.py:1954-1960`). A cancel or modify targets a broker ID (`contracts/execution.py:99-125`): the parent is the entry attempt that owns that ID (its own or a protective leg's). A close targets a position, not an order (`coordinator.py:562-567`): the parent is the one entry command whose own-leg `FILL` events carry that `position_id` (`lifecycle.py:424-427`), with that entry's broker ID. No match, or more than one, raises in the serializer, so the refresh ends `repair_scheduled` and writes nothing for it.
* **Fields omitted, listed** *(S4-7)*. Of legacy's `_CARRIED` (`registry.py:422-437`), the projection supplies `price`, `filled_qty`, `reason`, `exchange` and `action`, and omits: `provenance`, `producer_provenance`, `producer_provenance_status`, `ai_lineage`, `ai_lineage_status`, `session_checkpoint_sha256`, `strategy_family`, `plan_id`, `intent_id`, `broker_status`, `broker_code`, `broker_message`, `broker_response_sha256`, `tier1_command_digest`, `proposal_receipt`, `proposal_binding_digest`, `proposal_leg_binding_digest`, `root_decision_id`, `source_proposal_id`, `sent_by_kernel_identity`, `tier1_command_intents`, `structure_instance_id`, `structure_id`, `position_leg_id`, `feed_sequence`, `proposal_day`, `lifecycle_action_id`, `order_role`, `policy_digest`, `evidence_digest`; also `transition`'s other attribution defaults (`leg_id`, `lifecycle_action`, `lifecycle_role`, `action_id`, `order_attempt_id`, `reservation_id`, `:384-410`). No listed reader needs them (review finding 7). **Not served** as a consequence: `from_registry`'s `plans/` join (`final_sl`, `target`, `r_multiple`, `:123`, `:149-161`), because strategy decision records are not projected (slice Deviation), so no `plans/` file matches any `decision_id`; and *(R2-7)* `src/analysis/core/advisor_economics.py`'s join by `decision_id` in legacy's `strategy:day:seq` form (`:198-203`, `:246-260`), under which every projected trade is unattributed (research is deferred).

#### The projector and its refresher (`kernel/ledger/export.py`)

* **The sidecar** *(R2-1)*: `root/.orders-1.json`, `{"format": "orders-1-sidecar/1", "sequence", "event_hash", "files": {day: byte size}}`, the last projected event and every day file's size after it, written after the appends (temporary file and rename).
* **`CompatProjector(root, make_serializer, check_root)`.** `refresh(reader) -> "fresh"`:
  * **Start or after any failure** *(R2-1)*: it holds no serializer, so it makes a new one and feeds it every event from sequence 1 up to the sidecar's sequence, writing nothing, then **truncates each day file to the size the sidecar records** (a day file the sidecar does not name is removed); if the sidecar is missing or its hash is not the ledger's hash at its sequence, it **rebuilds**: removes every day file and starts from sequence 0. So a failure or a crash between an append and the sidecar move never counts a fill twice or leaves a duplicate line: the retry re-derives the totals and cuts the files back to the last recorded state.
  * **Then** it feeds the events after the sidecar's sequence, appends each day's lines to `root/orders/<day>.jsonl`, flushes, and moves the sidecar. No fsync (spec: rebuildable).
  * **Any exception** throws the serializer away before it propagates, so the next refresh starts as above.
  * **Paged reads** *(R2-3)*: events come through `LedgerReader.events_page(after, limit)` (`store.py:1000-1013`), 500 per page, each page its own read; between pages the projector yields (`time.sleep(0)`), so a full rebuild never holds the interpreter for longer than one page's decoding.
  * **`check_root`** *(R2-6)* re-checks `MIG-R09` (below) at the start of **every** refresh, on the real paths of `root` and `root/orders`, so a symlink created after composition is refused before anything is written.
* **Rebuild scope** *(S4-10)*. A rebuild or truncation touches only files named `root/orders/<YYYY-MM-DD>.jsonl` and the sidecar; it never creates, reads or removes anything else (not `orders/orders/`, `monitor/`, a reconciliation ledger or any other name).
* **`CompatRefresher(projector, open_reader)`** *(S4-8, S4-9)*: one daemon thread holding its own read-only connection (`kernel/ledger/runtime.py:71-94`, `connect(path, writer=False)`, wrapped as `LedgerReader`). `request()` sets an event and returns at once: no I/O, never raises. The thread waits for the event, runs `refresh`, and stores the result; **any `Exception`** becomes `repair_scheduled` (logged, one alert per failure episode), and the next request retries from sequence 1 as above. `status()` returns the last result from memory. `stop(timeout)` ends the thread.
* **When it runs** *(S4-8, S4-9, R2-3)*. The kernel host calls `refresher.request()` **after every `run_pass`**, whatever the pass committed (`kernel/host.py:242`, a new step after the pass), so fills, `COMPLETED` and `RESOLVED_*` from the observation loop and protection reach the file within one pass; and once at start. `_stop_sequence` stops the refresher **after the drain**, so the drained outcomes are requested and projected first. Nothing in `kernel/coordinator.py` calls `refresh` or `request`: not `_finish`, `_commit_outcome` or `_commit_returns` (`coordinator.py:386-456`). No projection I/O ever runs on the writer thread.
* **`compat_projection` is projection health at the commit** *(R2-4)*. `Outcome.compat_projection` widens from `"none"` to `"none" | "fresh" | "repair_scheduled"` (`contracts/execution.py:313-330`). The coordinator fills it with `refresher.status()`, a memory read, or `"none"` when no refresher is composed: `fresh` means the last completed refresh succeeded, `repair_scheduled` that it failed and the next pass rebuilds. It does **not** say whether this outcome's own lines are in the file yet; they follow after the pass. It is read by nothing that decides a send (the guard below), so a refresh failure never authorizes a resend (CP-L4). **Deviation from the ledger spec**, recorded there: REQ-LED-006, CUJ-LED-1, CP-L4 and PRF-LED-06 said the outcome reports its own projection's freshness; keeping that would put the refresh back on the send path (R2-4, S4-8).

#### Composition and the forbidden roots *(S4-10, R2-6)*

* **`paths.compat`** (new, installer- and kernel-scoped, derived storage class). `bootstrap` composes the projector and refresher only when it is set; unset, `compat_projection` stays `"none"`, as today. The shadow (step 5) sets it to `<paths.shadow.root>/compat/`.
* **The kernel is given the forbidden roots.** `shadow.legacy_run_dir` and `shadow.legacy_market_dir` widen from installer-only (step 3's "Who resolves its settings") to installer and kernel scope. **`MIG-R09`**: with `paths.compat` set, `bootstrap` refuses to compose when either forbidden root is unset, or when the real path (`os.path.realpath`, symlinks resolved) of `paths.compat` equals or lies inside either forbidden root's real path, or inside the ledger's directory; and the projector re-checks the same rule, for `root` and `root/orders`, at every refresh (a refusal there is `repair_scheduled`, nothing written). `MIG-R09` joins the migration spec's refusal catalogue. SLICE-14 decides the rule after legacy is retired.
* **Legacy's tools stay on legacy's run directory.** No legacy tool is pointed at `paths.compat` in this step: legacy's P&L monitor writes `monitor/` under its root and the cost tool writes its ledger under its root (`monitoring/account_pnl_service.py:36`, `:171-176`; `scripts/reconcile_costs.py:72`, `:76`), so pointing them there is a separate decision for step 6 or SLICE-14. The tests run legacy's readers only in the generator, over copies.

#### The consumer list and the guard

* `docs/migration.md` gains the spec's consumer table (purpose, consumer, after cutover), naming legacy's money path as **not served**, the omitted fields, and *(R2-7)* the not-served `plans/` join and `advisor_economics`'s `decision_id` join; the spec's table says `from_registry` is served except the `plans/` join.
* **Import guard** (PRF-MIG-09) *(S4-12)*, an AST test like `test_module_reach`:
  * no module under `kernel/`, `strategies/` or `market/` imports `adapters.compatibility` (`bootstrap` passes the serializer factory in);
  * no module under `strategies/` or `market/` names `paths.compat` or opens anything under it;
  * under `kernel/`, only `kernel/ledger/export.py` (named in the test) opens files under the projection root, and it reads nothing there but its own sidecar;
  * `compat_projection` appears under `kernel/` only where `kernel/coordinator.py` builds an `Outcome`, never in a condition.

### Tests

Labelled synthetic values only; no production data. A new file, `tests/contracts/test_orders_projection.py` (T-106).

| File | Test | Proves |
|---|---|---|
| `test_orders_projection.py` | Reader parity *(S4-11, R2-5)* | For every case below, `golden.json["orders_projection"]` holds the outputs of legacy's readers over the projected bytes and over the bytes legacy's own writers produced. **Exact equality** for the money and ownership readers: `cost_reconciliation.desk_fills`, every `from_registry.trades_for` field except `final_sl`, `target` and `r_multiple`, `account_pnl_service.owned_broker_ids` and `_expected_fill_ids`, `checks._owned_broker_ids`, `checks.orders(day)`'s findings, `registry.in_flight`. A listed difference is allowed only in an omitted field (above) within `fold(read_day)`, `all_orders` and `strict_rows` output, or in `final_sl`, `target` and `r_multiple`; any other difference fails |
| same | Projected bytes | The suite projects each case's target events and gets bytes whose SHA-256 equals the one the generator recorded |
| same | Line shape | Every line names `orders/1` with its source sequence and hash; `our_order_id`, `owner`, `exchange` (from settings) and `decision_id` (entry: the admitted plan's intent digest; close: its command key) as decided; `day` is IST and equals `exchange_date` at both sides of IST midnight |
| same | Close parent *(R2-6)* | A close whose position matches no entry, or two entries, raises in the serializer; through the refresher, `repair_scheduled` and no line for it |
| same | Import guard *(S4-12)* | The four guard clauses above |
| same | Not on the send path *(S4-8)* | With a refresher whose `refresh` blocks, `dispatch_inline` and `run_pass` return and commit their outcomes; no `refresh` runs on the writer thread (the thread's identity is recorded); `_commit_outcome` performs no file I/O under the projection root |
| same | Pass latency under a rebuild *(R2-3)* | While a CPU-bound rebuild of a ledger of 20 000 synthetic events runs on the refresher, each `run_pass` of a simulated kernel stays within a bound measured in the same test without the rebuild (median times three, plus 50 ms); the bound and both medians are printed |
| same | Any fault contained *(S4-8)* | `refresh` raising `OSError`, `ValueError` and a `SnapshotGap`: each gives `status()` `repair_scheduled`, the kernel keeps running, the next outcome carries `repair_scheduled`, nothing is resent, and the next request rebuilds |
| same | Retry after a partial append *(R2-1)* | A refresh that fails after appending the first of two day files: the retry's files equal a projection from scratch byte for byte (no doubled `filled_qty` or duplicate line) |
| same | Every pass *(S4-9)* | A fill committed by the observation loop in a pass with no dispatch outcome is in the file after that pass |
| same | Stop order *(R2-3)* | `_stop_sequence` drains, then stops the refresher; the drained outcome's lines are in the file |
| same | Forbidden roots *(S4-10, R2-6)* | `MIG-R09` at composition for `paths.compat` inside a legacy root, reached through a symlink, and inside the ledger directory, and with a forbidden root unset; an `orders` symlink into a legacy root created after composition is refused at the next refresh (`repair_scheduled`, nothing written there); a rebuild over a root holding `orders/orders/x.jsonl`, `monitor/x` and `reconciliations.jsonl` leaves those three byte-identical |
| `tests/recovery/test_crash_boundaries.py` | CP-L4 (PRF-LED-06) | Killed after the outcome commit and before the refresh: the outcome is not resent; the next start's refresh writes lines equal to a projection from scratch |
| same | Sidecar mismatch | A sidecar naming a hash the ledger does not hold rebuilds every file |

**The cases** *(S4-11)*, each a labelled synthetic history projected by the target and written by legacy's writers, in `golden.json`:

| Case | History |
|---|---|
| `entry_partial_filled_stop` | Entry acked with stop and target; two partial fills, then filled; the stop fills (`STOP_HIT`) |
| `target_then_stop` | Target fills part, stop fills the rest (last role wins: `STOP_HIT`) |
| `close_command` | Entry filled; a close command acked and filled in two fills (`TIER1_CLOSE`, allocations, the close row's own `partial`/`filled`) |
| `dispatch_refused` | Admitted, then `DISPATCH_REFUSED` (`formed → rejected`) |
| `not_sent_retry` | `OUTCOME_NOT_SENT` on attempt 1 (`rejected`), attempt 2 acked |
| `never_reached` | Ambiguous (`unknown`), `RESOLVED_NEVER_REACHED` (`rejected`), attempt 2 acked |
| `reached_resting` | Ambiguous, `RESOLVED_REACHED` with stop and target IDs (`ack`), resting unfilled |
| `rejected` | `OUTCOME_REJECTED` |
| `entry_completed` | Entry filled, then `COMPLETED` (no line; the row stays `filled`) |
| `cancel` *(R2-2)* | A cancel of the target leg acknowledged with its ID (`ack`, the parent's `record_cancel` line), then `COMPLETED` (no line) |
| `modify` *(R2-2)* | A stop modify acknowledged with a replacement ID (`ack`, the parent's `record_stop_moved` line) |
| `leg_assigned` | Entry acked with the stop only; `LEG_ASSIGNED` adds the target |
| `across_midnight` *(item 4 note)* | Admitted and filled in session on 2026-11-02; the stop's fill and the entry's `COMPLETED` arrive after IST midnight (2026-11-02T18:30:10Z, 00:00:10 IST): the close fields land in `orders/2026-11-02.jsonl`, not the next day's file |
| `tie_average` | 600 filled as 599 at 100.00 and 1 at 100.15 (notional 60 000.15, average 100.00025, a 5 in the 5th decimal), in a set order; the close at a price whose `close_price` is not 4-place |
| `structure_leg` | A structure leg's fill: `filled_qty`, no price |

**The generator** *(S4-11, R2-2, R2-5)*: `scripts/gen_legacy_fixtures.py --orders-projection`, run once against legacy's checkout at 445eb116, never in the suite. Per case it (1) projects the case's target events with `OrdersSerializer`; (2) writes the same story through legacy's own code at the same instants: `open_order`, `mark_sent`, `transition`, `mark_ack`, `mark_unknown`, `record_protection`; fills through `settle_fills` (`run_framework_live.py:5787`) with a stub trade book and order book and its registry root pointed at the case directory; a cancel and a modify through a live `Gateway.cancel` and `Gateway.modify` (`execution_gateway/__init__.py:1160`, `:1292`) with a stub client, their outcomes written by the structure supervisor's `settle` (`structure_supervisor.py:1195-1240`). Where one of those cannot run offline, the generator stops and says which; only then may that case use the registry writers with legacy's own expressions copied verbatim, recorded as `legacy_writer: direct` and named in "as built". (3) Runs every listed reader over both directories, roots pointed at them as step 3's `--views-only` points `compare`, **with the trade book stubbed and the clock fixed** for `checks.orders` (`checks.py:290`, `:305-315`); (4) records in `golden.json["orders_projection"]` the projected bytes' SHA-256, both reader outputs, and each allowed difference. Legacy-written bytes are kept as fixtures (`tests/fixtures/legacy_stores/orders_projection/<case>/`, T-107).

### Break checks *(S4-12, R2-1…R2-6)*

1. Project `OUTCOME_NOT_SENT` as no line (the row left `sent`): reader parity fails (`in_flight`, `checks.orders`).
2. Write `completed` for an entry's `COMPLETED`: reader parity fails (`trades_for`, `desk_fills`).
3. Project `DISPATCH_REFUSED` as no line (left `formed`): reader parity fails (`in_flight`).
4. Project `RESOLVED_NEVER_REACHED` as `cancelled`: reader parity fails (`never_reached`).
5. Write no line for `RESOLVED_REACHED`: reader parity fails (`owned_broker_ids`, `reached_resting`).
6. Take `day` from each event's own time: reader parity fails (`across_midnight`: `all_orders`, `strict_rows`).
7. Leave a close command's fills off the entry's line: reader parity fails (`close_command`: `trades_for`).
8. Round `close_price` to 4 places: reader parity fails (`tie_average`).
9. Average from exact decimals, or in broker-time order: reader parity fails (`tie_average`).
10. Omit `protective_order_ids`: reader parity fails (`_expected_fill_ids`, `checks._owned_broker_ids`).
11. Omit `parent_broker_order_id` on a close row: reader parity fails (`strict_rows`).
12. Call `refresh` from `_commit_outcome`: the not-on-the-send-path test fails.
13. Catch only `OSError` in the refresher: the any-fault test fails (`ValueError`).
14. Run `refresh` on the writer thread: the not-on-the-send-path test fails.
15. Request a refresh only after an outcome: the every-pass test fails.
16. Compare forbidden roots as strings, not real paths: the forbidden-roots test fails (symlink).
17. Rebuild by clearing the whole root: the forbidden-roots test fails (`monitor/x`).
18. Resend when `compat_projection` is `repair_scheduled`: CP-L4 fails.
19. Import the serializer from `kernel/`: the import guard fails.
20. Trust a stale sidecar: the sidecar test fails.
21. Keep the serializer after a failure (R2-1): the retry test fails (doubled `filled_qty`).
22. Skip the truncation to the sidecar's sizes (R2-1): the retry test fails (a duplicate line).
23. Write `completed` for a cancel's acknowledgement, or drop the parent's `record_cancel` line (R2-2): reader parity fails (`cancel`).
24. Read the whole ledger in one `events()` call, no yield (R2-3): the pass-latency test fails.
25. Stop the refresher before the drain (R2-3): the stop-order test fails.
26. Accept a listed difference in `desk_fills` (R2-5): reader parity fails (the allowed-fields check).
27. Pick the first entry when a close's position matches two (R2-6): the close-parent test fails.
28. Check `MIG-R09` only at composition (R2-6): the forbidden-roots test fails (late symlink).

### Files

* **New:** `tests/contracts/test_orders_projection.py` (T-106); `tests/fixtures/legacy_stores/orders_projection/` (T-107); `docs/migration.md` (consumer list).
* **Changed:** `adapters/compatibility.py` (`OrdersSerializer`; the reach test's import set gains `datetime`); `kernel/ledger/export.py` (`CompatProjector`, `CompatRefresher`); `contracts/execution.py` (`compat_projection` values); `kernel/coordinator.py` (the status copy only); `kernel/host.py` (the request after every pass, start and stop of the refresher); `bootstrap.py` (composition, `MIG-R09`); `settings/schema.py`, `resources/defaults.yaml`, `tests/unit/test_settings_resolver.py` (`paths.compat`; the two forbidden roots' kernel scope); `scripts/gen_legacy_fixtures.py`, `golden.json`; `tests/recovery/test_crash_boundaries.py`.
* **Specs** *(R2-4)*: the migration spec's compatibility section, PRF-MIG-09 and its refusal catalogue (`MIG-R01`…`MIG-R09`); the ledger spec's REQ-LED-006, CUJ-LED-1, CP-L4 and PRF-LED-06 rewritten as projection health at the commit, with the Deviation recorded there; **reported to its owner**: the configuration spec (the two settings' scope, `paths.compat`).

### Fork calls and Deviations

* **No Fork call:** every mapping keeps legacy's line for legacy's readers (the fork rule), and no target decision reads the projection.
* **Deviation (slice):** lines written after the pass, not before the send (already listed).
* **Deviation:** the projected `our_order_id` uses the command key where legacy's used the decision ID; `decision_id` is still carried (above).
* **Deviation:** the `_CARRIED` and attribution fields above are omitted; `SQUARE_OFF` is never written; `from_registry`'s `plans/` join and `advisor_economics`'s `decision_id` join are not served.
* **Deviation (ledger spec)** *(R2-4)*: `compat_projection` reports projection health at the commit, not this outcome's own lines.

### Completion conditions (step 4)

The tests pass twice with the layering guards and the crash-boundary file; every break check fails a listed test and every file is restored (md5); the step is recorded "as built".

### Step 4 as built

Commit `775f569` on `slice-13`, on top of `e8bb19a`: 32 files, 14 124 lines added, 16 removed. Not pushed. Reviewed twice before building ("Ready to build: no", then "yes after fixes"); the fixes are in the plan above.

**As planned, with these choices and findings:**

* **Files.** New: `tests/contracts/test_orders_projection.py` (T-106), `tests/fixtures/legacy_stores/orders_projection/` (T-107: `cases.json` and 15 legacy-written `orders/` directories), `docs/migration.md`. Changed: `adapters/compatibility.py` (`OrdersSerializer`, `project_orders`, `ProjectionError`), `kernel/ledger/export.py` (`CompatProjector`, `CompatRefresher`, `check_compat_root`, `ProjectionRefused`), `contracts/execution.py`, `kernel/coordinator.py` (`compat_status`, copied into the three committed dispatch outcomes), `kernel/host.py`, `bootstrap.py` (`_compose_compat`, `Composition.compat_refresher`), `settings/schema.py`, `resources/defaults.yaml`, `scripts/gen_legacy_fixtures.py` (`--orders-projection`), `golden.json` (`orders_projection` only; every other key unchanged), `tests/recovery/test_crash_boundaries.py` (CP-L4), and three tests pinning the changed scopes and the reach set (`test_settings_resolver.py`, `test_legacy_copier.py`, `test_legacy_schemas.py`).
* **Legacy's own code wrote the legacy side, through every path the plan names.** The generator ran legacy at 445eb116 offline (a fuller export with `scripts/` and `monitoring/`): the registry writers, `settle_fills` for every fill (one pass per FILL event, its clock fixed through `registry.now`), the structure supervisor's `execute_action` with a live `Gateway` and a stub client for the cancel and the close, and `Gateway.modify` for the stop modify. Two stubs, both recorded: `_cancel_resting_siblings` is a no-op (on Windows legacy's gateway factory needs `os.getuid`; the target's sibling cancel is its own command, covered by the `cancel` case), and the P&L monitor's MCP imports are stubbed (`owned_broker_ids` and `_expected_fill_ids` use neither). The structure leg's fill uses the structure executor's own rule through `transition` (`structures.py:298-316`), labelled `structure_fill:transition` in `golden.json`.
* **Parity: every money and ownership reader agrees exactly on all 15 cases** (`desk_fills`, `owned_broker_ids`, `_expected_fill_ids`, `checks._owned_broker_ids`, `checks.orders`, `in_flight`), and every fold, `all_orders`, `strict_rows` and `trades_for` output agrees except in omitted fields. Prices included: 118.3167 (three partials), 100.0003 (the tie: legacy's float rounding, where exact decimals give 100.0002), and the unrounded close prices (103.41666666666667, 95.075).
* **Corrections found by running legacy's code** (each makes the projection match legacy's bytes; no money rule or gate changes):
  * **A close command writes no `close_reason`.** Legacy treats a close row with parent IDs as a lifecycle close (`run_framework_live.py:6371-6433`): its fills close the parent with allocations and `close_broker_order_id`, and the reason stays empty. `TIER1_CLOSE` is written only on legacy's Tier-1 intent path, which the target does not have. The plan said `TIER1_CLOSE`.
  * **The parent pair is on the `formed` line only**, as `open_order` writes it; `transition` does not carry it (`registry.py:349-410`). The plan said every line.
  * **A cancel or modify row takes the parent's side** (`action`), as the supervisor's lifecycle row does (`structure_supervisor.py:1113-1131`), and the parent's `record_cancel` or `record_stop_moved` line comes before the action's `ack`, the order legacy writes them in.
  * **A structure leg's `decision_id`** is `<decision>.<leg>`, so each leg's `our_order_id` keeps legacy's `owner:decision_id#attempt` form.
  * **Fill lines** are one per FILL event (legacy writes one per settle pass); the folded state and every reader's output are the same.
* **Allowed differences, as built.** The plan's omitted fields, plus legacy writer extras the target has no source for (`product`, `sent_by`, `lifecycle_result`, `action_attempt_id`, `gateway_sent`), the generator's `label` and the projection's own `projection` key. `structure_instance_id`, an omitted field, also appears in `trades_for`'s output (`""` against absent), so omitted fields are allowed there too; every money field of `trades_for` matches exactly. In the cases, each intent digest equals its command key, so `decision_id` and `our_order_id` match by construction (the identity rule itself was reviewed).
* **Serializer breaks are caught by the projected-bytes test.** The suite cannot run legacy's readers; it re-projects each case and requires the exact bytes legacy's readers were run over. A serializer change therefore fails `test_projected_bytes` (or `test_money_values`), not the parity test, which checks the recorded outputs.
* **Paged reads have their own test.** A whole-ledger read with no yield does not fail the latency test, because Python's thread switch interval still lets the writer run. `test_paged_reads_yield` checks the page size and the yields directly. The latency test measured a median pass of 0.35 ms quiet and 0.58 ms during a 20 000-event rebuild, against a bound of 51 ms.
* **`compat_projection` before the first refresh is `repair_scheduled`** (nothing projected yet), then the last refresh's result.
* **`paths.compat` uses the `scratch` storage class**, the existing class closest to "derived" (rebuildable).
* **Trap (carried):** the system interpreter lacks `hypothesis`, and under `python -I` cannot see `apsw` (it is in the user site). The tests ran with `OA_NEW/.venv-slice01` (used read-only) and `PYTHONPATH=src`, where both resolve. The generator ran in a scratch virtual environment against a fuller export of legacy at 445eb116 (`src/`, `scripts/`, `monitoring/`, `config/`).
* **Line endings.** The fixtures legacy wrote are stored with LF, as legacy writes them on the EC2; on Windows its text-mode writes produced CRLF. The readers' recorded outputs are unaffected.

**Fork calls:** none. **Deviations:** as listed in the plan; the corrections above follow legacy's own bytes.

**Tests run (Windows, affected only):** `tests/contracts`, `tests/unit`, `tests/recovery`, `tests/integration/test_kernel_host.py`, `tests/integration/test_custody_promotion.py` (the ledger and composition modules are shared). Run 1: 2 140 passed, 15 skipped, 0 failed. Run 2, after the last test edit (three tests the break checks showed too weak: a close price longer than 4 places, a sidecar from another ledger, a crash with lines past the sidecar): 2 140 passed, 15 skipped, 0 failed. Line endings were then normalised to LF (the edits and legacy's Windows writers had produced CRLF) and the touched files rerun: 369 passed, 1 skipped. `test_orders_projection.py` holds 52 tests; the crash file gains `test_cp_l4` and `test_cp_l4_sidecar_mismatch`. `ast.parse` passes on every edited Python file.

**Break checks** (script `break_step4.py` in the session scratchpad), each failing its listed test, each file restored and its md5 confirmed:

| Break | Failed |
|---|---|
| 1. OUTCOME_NOT_SENT writes no line | `test_projected_bytes[not_sent_retry]` |
| 2. An entry's COMPLETED writes completed | `test_projected_bytes[entry_completed]` |
| 3. DISPATCH_REFUSED writes no line | `test_projected_bytes[dispatch_refused]` |
| 4. RESOLVED_NEVER_REACHED as cancelled | `test_projected_bytes[never_reached]` |
| 5. RESOLVED_REACHED writes no line | `test_projected_bytes[reached_resting]` |
| 6. Day from each event's own time | `test_projected_bytes[across_midnight]` |
| 7. A close command's fills off the entry's line | `test_money_values` |
| 8. Close_price rounded to 4 places | `test_money_values` |
| 9. Average from exact decimals | `test_money_values` |
| 10. Protective_order_ids omitted | `test_projected_bytes[entry_partial_filled_stop]` |
| 11. Parent_broker_order_id omitted | `test_decision_id_and_identity` |
| 12. Refresh from the send path (status does the I/O) | `test_not_on_the_send_path` |
| 13. The refresher catches only OSError | `test_any_fault_contained` |
| 14. Refresh on the writer thread | `test_every_pass_and_stop_after_drain` |
| 15. No refresh request after a pass | `test_every_pass_and_stop_after_drain` |
| 16. Forbidden roots compared without resolving links | `test_forbidden_roots` |
| 17. Rebuild clears the whole root | `test_rebuild_touches_only_its_files` |
| 18. A kernel branch on compat_projection | `test_import_guard` |
| 19. The serializer imported under kernel/ | `test_import_guard` |
| 20. A stale sidecar trusted | `test_sidecar_mismatch_rebuilds` |
| 21. The serializer kept after a failure | `test_retry_after_a_partial_append` |
| 22. No cut back to the sidecar's sizes | `test_retry_after_a_crash_between_append_and_sidecar` |
| 23. A cancel's acknowledgement written completed | `test_projected_bytes[cancel]` |
| 24. Whole-ledger read, no yield | `test_paged_reads_yield` |
| 25. Refresher stopped before the drain | `test_every_pass_and_stop_after_drain` |
| 26. A money field allowed to differ (golden's list) | `test_cases_and_allowed_lists` |
| 27. The first entry taken when two match | `test_close_parent_refused` |
| 28. MIG-R09 only at composition | `test_forbidden_root_checked_at_every_refresh` |

## Step 5 — the shadow composition and the comparison

<a id="step-5--the-shadow-composition-and-the-comparison-outline"></a>

The authorities are the migration spec's [disarmed shadow](../../design/migration-recovery-rollback-continuity.md#the-disarmed-shadow) and [same-head comparison](../../design/migration-recovery-rollback-continuity.md#same-head-comparison-scriptscompare_paritypy), PRF-MIG-10 and PRF-MIG-11 (composition rows). Step 5 is TASK-S13-02. Legacy citations are at 445eb116; target citations are at `775f569` (step 4) on `slice-13`. Class S: synthetic legacy fixtures and the simulation only; nothing here reads production data or runs on the EC2 (that is step 6).

**It stops for review before building**, because it decides what the shadow answers in place of a broker, and which differences from legacy the comparison may excuse. It sets no score, threshold or money value: the two new waits are unset and refusing until step 6 measures them.

**In plain words.** The shadow is the new system running beside the old one with no way to trade. It replays the old system's own price records and order records, in the old system's own time order, a little behind real time, so it never decides before the old system's records for that moment have been copied. When it decides to place an order, a stand-in broker answers at once with what the old system really got for the same order, or "not sent" when the old system placed no such order. Each evening a comparison lines up the two systems at one pinned point: decisions and refusals, money held back, quantities, stops and unknown outcomes. Money is compared to the last digit. Every difference is a defect unless one of the owner's own answers covers that exact case; a difference that follows from an earlier one is reported once, at its first cause.

**Rework (2026-11-04).** The first version of this plan was reviewed "Ready to build: no" with twelve findings, marked *(S5-n)* below. The open question is settled by the coordinator: an unmatched command is answered `not_sent` (`disarmed_unmatched`), as legacy's disarmed paths say "not sent" (`src/runtime/execution_gateway/__init__.py:993-1000`; `src/runtime/owner_exposure.py:125-127`; `src/tier1/coordinator.py:37`, `:113-114`), and the comparison always reports it as a defect; the conditional switch to `rejected` is removed. The fork rule decides every remaining choice: money and gate behaviour follow legacy; an accepted difference is a listed Deviation with an owner reference, never a tolerance.

**Re-review (2026-11-04): "yes after fixes"**, with six more findings, marked *(R5-n)* below and applied as the coordinator gave them.

### Before building

* **Fast-forward `slice-13` first** to the line that holds the `_modules_after` fix (`slice-08` at `5746567` or later), so `tests/contracts/test_capabilities.py`'s import-closure guards import the tree under test *(S5-10)*, and to the main line's `env_locators` fix below *(R5-5)*. The coordinator does the update and says "go"; nothing in step 5 is built before it.
* **The `env_locators` defect, fixed once, on the main line** *(S5-2, R5-5)*. `operations/isolation.py:333-336` reads `eff.secret_refs`, which holds identifier strings (`settings/loader.py:73`, `:658`), so it always returns `[]`; the parsed references are `eff.refs` (`:78`). The coordinator has the fix made in the main checkout, with its test; `slice-13` picks it up through the fast-forward above. Step 5 does not change `operations/isolation.py`; `MIG-R10` relies on the fixed function.
* **The lease store.** `compose_shadow` takes `leases` as an argument; the tests pass `FakeLeaseStore` (`tests/conftest.py:63`). `lease_store_for` still refuses at `bootstrap.py:1013-1015`, so step 6 needs SLICE-11 step 8's `DirectoryLeaseStore` first. Recorded, not worked around.

### Decisions

#### Where the code lives *(S5-11, S5-12)*

| Module | New or changed | Holds |
|---|---|---|
| `adapters/legacy_responder.py` (T-112) | New | `LegacyOutcomeResponder` (the kernel's `BrokerPort`, `kernel/ports.py:17-23`) and `LegacyBooks` (the observation port). Reach: the standard library and the target package only; no `socket`, `ssl`, `http`, `urllib`, `requests`, `httpx`, `websockets` or `adapters.openalgo*`; no write call (PRF-MIG-11). **Deviation** from the spec's "this module": `adapters/compatibility.py` imports `urllib.parse`, so a separate module keeps the no-network guard exact |
| `adapters/legacy_market.py` (T-116) | New | `LegacyMarketFeed`, which turns legacy's market records into `IncomingRecord`s (below). Not in `adapters/compatibility.py`: that module's reach test allows only the standard library and `apsw` (`tests/contracts/test_legacy_schemas.py:261-262`), and the feed needs `contracts.market` |
| `adapters/compatibility.py` | Changed | One reader, `read_market_file(path, start) -> (records, end)`: one `market_ndjson/1` file from byte `start`, whole gzip members only, by step 1's member walk; read with `Path.read_bytes`, so the reach test is unchanged. `read_market` (`:462-464`) takes no cursor and stays as it is |
| `operations/shadow_run.py` (T-117) | New | The shadow driver, its clock and its cursor file (below) |
| `operations/shadow_compare.py` (T-113) | New | The comparison; `scripts/compare_parity.py` (spec) is its command line, as step 3 did for the importer |
| `resources/approved_differences.json` (T-114) | New | The owner-only table, read-only |
| `bootstrap.py` | Changed | `compose_shadow` and its refusals `MIG-R10` and `MIG-R12` |
| `operations/deployment.py` | Changed | `COMPOSITIONS["shadow"]` beside `first_release` (`:40`) and its validation rule (below). **Correction to the spec**, which names `bootstrap`'s `COMPOSITIONS`: the table lives here |
| `adapters/legacy_copier.py` | Changed | The persisted pass log (below) |
| `operations/legacy_import.py` | Changed | `IMPORT_BOUNDARY_PINNED.prefixes` (below) |
| `kernel/host.py` | Changed | `PassSchedule`, factored out of `KernelHost` with its behaviour unchanged (below) |
| `settings/schema.py`, `resources/defaults.yaml` | Changed | Two settings and one scope (below) |

#### One process, in legacy's time *(S5-4, S5-5, S5-11)*

* **The shadow is one process,** besides the copier: the market feed, the BuyerEdge host and the kernel are composed in one process by `compose_shadow` and driven in lockstep by `ShadowDriver` (`operations/shadow_run.py`). **Deviation** from the spec's composition table, which lists a market process, a BuyerEdge host and a kernel as separate units: separate processes each read the copies on their own schedule, so copy lag would move legacy's timing between them, which is what S5-4 and S5-5 found. The copier stays a separate, locked-down unit (step 2). The strategy host reaches the kernel in process (`InProcessReviews` and the in-process kernel port, as the integration tests compose it), with no channel socket.
* **Legacy's time.** The driver's clock is the existing `RecordedClock` (`adapters/clocks.py:14-35`), moved forward only by the driver, never back. Its wall reading is a legacy stamp, so every age, deadline and view bound in the shadow is measured on legacy's time. Whether the production-shaped composition accepts a `recorded` clock domain is **not checked**; the build checks it first and stops if not.
* **What is settled.** The copier's pass log (below) gives, for each pass `p`, its `started_at` and every file's copy size after it. The driver has **consumed** pass `p` when each copy it reads is at least the size `p` records. The **settled instant** is `S = p.started_at − shadow.legacy_write_lag_secs` for the latest consumed pass with no stopped file among those the driver reads. `shadow.legacy_write_lag_secs` bounds the delay between a legacy stamp and its bytes being complete in legacy's file. A stopped file (a gap or anomaly, below) holds `S` at the last pass before it stopped: the shadow stalls for the day instead of reading absence as "no match".
* **The step.** The driver steps the clock through legacy's stamps in order, every stamp `t ≤ S − shadow.outcome_wait_secs`: market records by their `fetched_at`, registry lines by their `at`; it also steps to every grid and poll instant below that falls between two stamps. So when the shadow sends at `t`, legacy's records up to `t + shadow.outcome_wait_secs` are already copied and settled.
* **What runs at each step: the kernel host's schedule, on the recorded clock** *(R5-1)*. The driver does not re-write `KernelHost._serve` (`kernel/host.py:228-283`). Its scheduling is factored out of `KernelHost` into one `PassSchedule` in `kernel/host.py`, used by both: given the clock, the host's `period` and `lag` (`market.bar_confirm_lag_secs`), it answers whether the pass at an instant is **scheduled** (at or after the next grid instant from `seconds_to_next_pass`, `:32-40`, or after a grid wait timed out) or **woken**, and moves the grid after a scheduled pass, exactly as `:238-253` does. `KernelHost` keeps its behaviour, now through `PassSchedule`. At each step, in `_serve`'s order:
  1. at the first step only, `coordinator.refuse_admitted_entries("earlier_epoch")` (`:231`), as the host's start;
  2. `recovery.tick()` (`:241`), every step;
  3. the market commit for that stamp, then the strategy host's pass when its own schedule says so (below);
  4. `coordinator.run_pass(scheduled=…)` with `PassSchedule`'s answer, so protection, trails, tick exits and the square-off run only at grid instants (`kernel/coordinator.py:464-487`); then woken passes until no worker is busy and no return is queued;
  5. an observation cycle through `LegacyBooks` only when `observation.poll_interval_secs` has passed on the recorded clock since the last one, within `observation.max_requests_per_minute` measured on the recorded clock's monotonic time (`kernel/reconciliation.py:743-750`);
  6. the compat refresh request.

  At the day's end the driver runs the host's stop sequence (`:285ff`) through the same factored code, not a copy.
* **The strategy host keeps its own schedule** *(R5-1)*: `strategies.host.pass_secs` with `next_pass_delay` (`strategies/worker.py:160-166`, `:467`), legacy's grid, on the recorded clock. The driver runs the host's single pass at each of its grid instants, never at every stamp.
* **Two new settings** (`settings/schema.py`, `resources/defaults.yaml`; scope installer and kernel; register `measured`; `int_pos`, **unset and refusing** until step 6 measures them; no money value): `shadow.legacy_write_lag_secs` and `shadow.outcome_wait_secs`. Evidence for step 6, not a value: legacy's HTTP timeout and the copier's measured pass time. `compose_shadow` raises `RefusingParameterUnbound` for either.
* **`paths.shadow.root`** widens from installer to installer and kernel (`settings/schema.py:329`), so a kernel-scoped resolution can read it *(S5-1)*. The shadow resolves its settings once per participant whose fields it composes (kernel, market, strategy) from one profile, and passes the three effectives to `compose_shadow`.

#### What makes the shadow disarmed (PRF-MIG-11, composition rows)

* **Paths from the shadow root only** *(S5-1)*. `compose_shadow` takes `root = realpath(paths.shadow.root)` and builds every path from it: the ledger `root/ledger/shadow.db` (its evidence store `root/ledger/shadow.db.evidence`, `bootstrap.evidence_root`), the market store `root/market/`, the projection `root/compat/`, the cursor `root/state/`, the reports `root/reports/`, and the input it reads, `root/input/`. It builds the kernel's `Settings` as a copy with `ledger_path`, `market_store_path` and `paths_compat` replaced. The effective values of `ledger.path`, `market.store_path` and `paths.compat` are never opened; they serve only as forbidden roots.
* **`MIG-R12`** (new) refuses before anything opens when `paths.shadow.root` is unset, or when `root` is equal to, inside, or contains the real path of any forbidden root: the directories of `ledger.path`, `market.store_path` and `supervisor.assessment_path`; `release.root`, `paths.evidence`, `paths.run`, `research.custody_root`, `research.trial_root`; the environment's `AT_DEPLOYMENT_ROOT`; and `shadow.legacy_run_dir` and `shadow.legacy_market_dir`. It also refuses when `ledger.path`, `AT_DEPLOYMENT_ROOT` or either legacy root is unset, so the check is never vacuous. Real paths (`os.path.realpath`), compared both ways with `os.path.commonpath`. `MIG-R09` still applies to `root/compat/`.
* **`MIG-R10`** *(S5-2)* refuses, before anything opens, when the process environment holds any name in `key_names(env_locators(eff))` for any of the three effectives (`operations/isolation.py:322-336`: `BROKER_KEY_NAMES`, which are `AT__OPENALGO__AUTH__API_KEY`, `MCP_OPENALGO__AUTH__API_KEY` and `OPENALGO_API_KEY` (`settings/schema.py:465`), the key's aliases, the profile's env locators, and `CREDENTIALS_DIRECTORY`), or when any effective holds a secret reference whose service is `openalgo` (`eff.refs`). It resolves no secrets and composes the kernel with `credentials=None`.
* **The composition mode** *(S5-11)*: production-shaped. `_compose_kernel(settings, None, clock, port_factory=…, observation_port=books, contracts=…, relays=…, credentials=None, leases=leases, admission=…)`, as `_compose_production_kernel` calls it (`bootstrap.py:1206-1276`), so: no synthetic capacity (`capacity.synthetic_amount` is never read, `:161-162`), no Authorizer, the port built by `port_factory(evidence)` as the responder. The admission ports are built as production builds them (`:1258-1260`), with the ledger's positions and statistics.
  * **Kill input** *(R5-2)*: legacy's copied kill file only, never production's kill paths (`KillInputs.resolve(s.kill_switch, s.kill_switch_files, AT_DEPLOYMENT_ROOT)`, `bootstrap.py:1250-1255`, is not called). The kill input is a port with `KillInputs`' interface over `root/input/run/<legacy's kill file>` (step 1's `kill_file/1` fixed path). It reports `kill_file` at stamp `t` only when the copier's pass log shows the file present in the settled pass covering `t` (the latest consumed pass with `started_at − shadow.legacy_write_lag_secs ≥ t`), and absent otherwise. It never `stat`s a path at wall time, so it is never "unreadable" (`kernel/safety.py:43-52`). The kill flag is `false`. An empty or unparsable copied `KILL` counts as present, as legacy's existence test does (step 2).
  * **Contracts:** the same source as production, which passes `contracts={}` at `775f569` (`:1264`). The shadow calls one shared helper with production, so it changes only when production's does.
  * **Relays and the owner's acts** *(R5-6)*. Owner acts need an `owner_credential` authentication (`kernel/authority.py:228-231`), and the production-shaped composition has no Authorizer (`bootstrap.py:225`). The composition sets `relays` to the one principal `relay:shadow-driver` and `Composition.relay_peer` to it, so the existing in-process relay, `Composition.relay` over `accept_relay` (`bootstrap.py:87-93`), is the only path. At the first step the driver performs exactly two kinds of owner act. Each is an `OperatorRequest` with the owner as principal, a fresh nonce and the recorded clock's time, relayed through `Composition.relay(request, "owner_credential")` and executed in process:
    * **the standing binding:** `authority.authorize_binding(auth, StandingBinding(…))` (`kernel/authority.py:539`);
    * **the grants:** `authority.issue(auth, Grant(…))` (`:383`).

    **The session is not an owner act:** `Sessions.open_session(account, calendar_id)` (`kernel/lifecycle.py:136`) opens it on `recovery.tick` once the binding validates, as in production.

    **The values come from legacy's own binding for `D`, converted** (coordinator, 2026-11-04: the profile holds only `policies`, `settings/schema.py:438`, so it cannot supply them). `adapters/legacy_binding.py` (T-118), `convert_binding(input_run, day, *, account, calendar_id, registry, policies)`, reads `session_bindings/1` (step 1's reader; legacy's `configs/session-bindings/<strategy>/<day>.json`, `src/runtime/session_config.py:38-39`, `:864-975` at 445eb116) from the copier's input for day `D`, and returns one `StandingBinding` and its grants. Each rule is a **Deviation** from legacy, which bound per strategy and day inside its own process and had no grant:
    * **Which strategies:** every strategy with a binding file for `D` whose record parses, whose `strategy` and `day` equal its path, and whose `integrity_sha256` equals legacy's `_integrity` (`session_config.py:57-59`, the ported `compatibility._integrity`). Those are legacy's bound strategies.
    * **The binding:** `candidate_ids` are those strategies' target `CandidateId`s from the strategy registry (`Registration.candidate_id`), sorted; `first_date` and `last_date` are `D`; `requires_promotion` is `strategies.registry.requires_promotion(registration)` and `families` the descriptor's `family`, per candidate, SLICE-12 step 6's rule; the scope is `SessionScope(account from account.*, the calendar)`; `policy_binding_id` is the profile's one bound policy (`bound_policies_from`).
    * **The grants:** for each bound strategy whose registry authority is `trade`, one `Grant` to `strategy:<id>` (service) with actions `{"entry"}` only, the account, valid from `D`'s open to its close (09:15 to 15:30 IST, as UTC), `parent_grant_id` none and `delegation_limit` 0. A strategy whose authority is not `trade` gets no grant.
    * **Identities:** `binding_id = "shadow-binding-" + sha256(canonical([D, sorted (strategy, integrity_sha256)]))[:32]`, and `grant_id = "shadow-grant-" + sha256(canonical([binding_id, strategy]))[:32]`: the same legacy binding and day always give the same IDs.
    * **`MIG-R14`** (new) refuses, and nothing is bound or granted, when `D` has no binding file, a binding file fails a check above, a bound strategy is not in the target registry, or the profile binds no policy or more than one. It never invents a binding.
    * **Pinning:** the binding files of `D` are files the driver reads, so they are in the cursor's `files` and pinned by `B`'s `files` (step 3 pins `session_bindings`, store row 14).

    No channel, socket or listener is composed, so nothing outside the process reaches the relay.
* **The object-graph test** walks the composed objects and refuses any whose module is under `adapters.openalgo` or that imports `socket`, `ssl` or `http`.

#### `COMPOSITIONS["shadow"]` and its validation *(S5-12)*

* Rows: `copier` (status `transient`, its module entrypoint) and `shadow` (status `transient`, `operations.shadow_run`'s entrypoint). Supervisor `optional`.
* `validate_composition` looks up `PARTICIPANTS[p].unit`, which is `None` for the copier (`operations/deployment.py:76`; `settings/schema.py:541`), and transient units are never "enabled". The new `transient` status is checked for its entrypoint in the bundle only, never for an enabled unit. A test proves a `shadow` composition validates with no units enabled, and reports a missing entrypoint.

#### The responder (`LegacyOutcomeResponder.send`) *(S5-3, S5-4)*

* **It never waits.** `send` answers at once from the settled copy, so the account's only outbound worker is never held and protection on the account is never stopped (`kernel/coordinator.py:500-502`). The wait is the driver's: it does not step to `t` until `t + shadow.outcome_wait_secs` is settled.
* **Matching an entry** at clock `t`: the legacy registry row of day `D` (below) with the same `owner` (the strategy), decision bar, `symbol`, `action` and `quantity`, whose `formed` line's `at` is at or before `t + shadow.outcome_wait_secs`, not already matched; the earliest by `at`, then `our_order_id`. The shadow's bar is the admitted intent's (by `intent_ref`, from the evidence store). Legacy's bar is the one named by the decision record its `decision_id` points to (`decisions/1`). Whether every fixture registry row's decision record names its bar is **not checked**; the build checks it on step 1's fixtures and stops if not. A row whose bar cannot be found is never matched.
* **Matching a cancel, modify or close:** by the matched entry's legacy order and the verb, within the same bar; a close also by quantity. Attempt 2 or later of a command is matched to legacy's attempt row of the same number, if there is one.
* **Answers:**

  | Legacy, settled through `t + shadow.outcome_wait_secs` | Answer |
  |---|---|
  | Matched, first outcome line after `sent` is `ack` | `acknowledged` with legacy's `broker_order_id`, and `protective_order_ids` and `protective_roles` as the legs |
  | Matched, `rejected` after `sent` | `rejected` with legacy's reason |
  | Matched, `unknown` | `ambiguous` |
  | Matched, `sent` with no outcome line yet | `ambiguous` (`legacy_pending`); the comparison reports it |
  | Matched, `formed` then `rejected` with no `sent` (legacy did not send) | `not_sent` (`legacy_not_sent`) |
  | **No match** | **`not_sent` (`disarmed_unmatched`)**; the comparison reports it as a defect |

* **What follows an unmatched entry** (checked in the code, so not a build question). After `NOT_SENT` an entry is claimed again only once a retry is recorded (`kernel/coordinator.py:438-443`); the strategy host submits each intent once (`strategies/worker.py:722-739`). So the entry stays `ADMITTED` until the deadline sweep refuses it `DSP-R01` (`coordinator.py:488-492`). One attempt.
* **What bounds an unmatched protective action** *(S5-3)*. Protection resubmits a `NOT_SENT` cancel, modify or close identically under its key (`kernel/protection.py:1128-1140`), once per scheduled pass. The responder answers each attempt the same way, so the attempts stop at the first of: legacy's matching action appearing in the settled copy (then it is answered as matched); the subject ending (its target order terminal in the books, so `ended_target_commands` makes the action act on nothing; or the position flat); or the session's last scheduled pass. The bound is therefore one attempt per scheduled pass from the first cause to the end of the subject or the session. Whether protection's scheduled passes stop at the close (15:30 IST) is **not checked**; the build checks it in the shadow-day test and stops if attempts continue past it. The comparison reports the command **once**, at its first attempt, with the later attempts linked to it.
* **Fills** come only through `LegacyBooks`, never in a send result.

#### The books (`LegacyBooks`, the observation port) *(S5-6, S5-8)*

* **Scope.** Only registry rows whose `day` is `D` (legacy's per-row day, the file `orders/<D>.jsonl`, `registry.py:211-214`), at the clock's instant: lines whose `at`, parsed by `datetime.fromisoformat` to an aware instant, is at or before it. Never a string comparison: legacy's `+05:30` strings sort wrongly against UTC (step 3, S3-4). A line whose `at` has no offset is not used and is reported. Every legacy order of day `D` is in the book, so one the shadow never made is foreign activity (Q-016).
* **Numbers.** Every legacy number is taken from its JSON text, `json.loads(raw, parse_float=Decimal)` over the record's `raw` bytes (step 1), so it is exactly the digits legacy wrote (legacy writes floats with `repr`). No rounding, no float arithmetic.
* **Orderbook:** one row per legacy order of day `D`, its state and cumulative fill as folded from the lines so far.
* **Tradebook: one fill per increase of a cumulative quantity** *(S5-6)*. For an order's own fills (`filled_qty` with `price`, the average rounded to 4 places, step 1 as built) and for its closes (`closed_qty` with `close_price`, unrounded), (one source per fill, below) each line `k` that raises the cumulative quantity from `Q(k−1)` to `Q(k)`, with average `P(k)`, gives:
  * the notional increase `ΔN = P(k)·Q(k) − P(k−1)·Q(k−1)` and the quantity `Δq = Q(k) − Q(k−1)`, both exact decimals (`P(0)·Q(0) = 0`). A `Q` that is not integral is not used and is reported;
  * **one fill** of `Δq` at `ΔN / Δq` when that quotient is a finite decimal (exact division in `Decimal` with no inexact flag); **otherwise two fills**: `Δq − 1` at `ΔN / Δq` truncated to 4 places, and 1 at `ΔN − (Δq − 1)·that price`. Both are exact, so the ledger's cumulative notional after line `k` equals legacy's `P(k)·Q(k)` to the last digit;
  * **fill ID** `legacy:<broker_order_id>:<Q(k)>`, and `legacy:<broker_order_id>:<Q(k)>:b` for the second fill of a split. Deterministic, stable across rereads (the lines are append-only), never a real broker ID (the prefix);
  * **One source per fill** *(R5-3)*. A close command's fills come only from its **own row's** `partial`/`filled` lines (`filled_qty`, `price`), under its own `broker_order_id`. The entry's close fields (`closed_qty`, `close_price`) serve only protective-leg closes: an entry line whose close fields carry `close_broker_order_id` (a close command's, step 4 as built) gives no fill. So legacy's two records of one close never give two fills, or one fill ID at two prices (`kernel/reconciliation.py:413-419`).
  * `broker_order_id`: the order's own ID; for a protective close, the leg whose role the line's `close_reason` names (`STOP_HIT`, `TARGET_HIT`) in `protective_roles`. One settle line can hold fills of both protective legs; it is attributed to its `close_reason`'s leg, and any difference that causes is a defect, never approved. How often legacy writes such a line is **not checked**;
  * `traded_at`: the line's `at`, parsed as above.
  * A structure leg's fill (`filled_qty` with no price, `structures.py:298-316`) gives no trade row; its order ID goes in `Observation.dropped`, which reconciliation already escalates as `trade_without_id` (`kernel/reconciliation.py:404-408`).
* **No end-of-day rebuild** *(S5-6)*. Fills are committed to an append-only ledger and counted once by fill ID (`contracts/evidence.py:87-95`), so a later rebuild with legacy's real trade IDs would count them twice. The shadow's fills are only the ones above; legacy's Tier-1 copy is evidence for the comparison, never written into the shadow ledger. There is no "provisional" label (`Observation` has no such field, `:125-138`); every `LegacyBooks` observation carries `source="legacy_registry"` in the existing `source` field. **Deviation** from the spec's "the end-of-day pass takes them from the ledger copy".
* **Positions:** per instrument, the net quantity from the fills above. `day_pnl` and `ltp` come from the latest session checkpoint (`session_checkpoints/1`) at or before the clock whose positionbook names the instrument, the broker book legacy itself recorded (step 2's `validate` fields); otherwise `None`. With `None`, the kernel's own rules apply (`session_pnl` is unavailable, `kernel/safety.py:160-174`), and every P&L-capped refusal that follows is a defect, never approved. How often legacy writes a checkpoint with its positionbook is **not checked**; the build measures it on the fixtures.
* **Funds** *(S5-6)*. Legacy sizes from `latest_evidence("session_state_attestation", owner, day=D)`, falling back to `session_cap_snapshot`, and reads `evidence.funds.availablecash` (or `available_cash`, `cash`), or `capital` (`src/runtime/session_state.py:39-47`, `:185-188`). `LegacyBooks.funds` answers the same: the latest such governance evidence record (`governance_evidence/1`) for the strategy and `D` at or before the clock, by legacy's field order, as `ObservedFunds(available=<that value, exact>, None, None, None)`.
  * **Funds missing** (no such record yet, or a record with none of legacy's fields): `funds` raises, so the observation loop drops the whole cycle and counts a failure (`kernel/reconciliation.py:750-758`), as for an unreadable broker. The shadow then refuses the entry `PRT-R06` `check_inert`: with every cycle dropped the loss latch cannot be judged (`kernel/safety.py:644`; as built, step 5 part 2). Legacy refuses with "Session state unavailable" when caps are configured (`gates.py:182-184`). So the two refusal codes differ (the gate table below), and each such entry is a defect at its first cause. Whether legacy, with no caps configured, would trade with no funds evidence is **not checked**; the build checks it on the fixtures. If it would, the shadow's refusal is a difference from legacy that only the owner can approve, so it stays a defect.

#### The market feed (`LegacyMarketFeed`) *(S5-5, S5-12)*

* **Input** `root/input/market-data/` (the copier's path, `legacy_copier.py:211`, `:216`), read with `read_market_file` from each file's cursor offset. Only whole members are read; the copier never appends a partial one.
* **One record each, with legacy's stamps.** Each legacy record becomes exactly one `IncomingRecord` (`contracts/market.py:451-462`): `event_at` = legacy's `at`, `arrival_at` = legacy's `fetched_at` (legacy's envelope, `src/data/marketdata/store.py:291-293`), `key` by `MarketLoop._key`'s rule (`market/ingest.py:188-193`) with legacy's `at` in place of the poll instant, so two legacy polls never collide. The `source` is the name production's `OpenAlgoMarketSource.source_of(stream)` returns, so the view policies select the same rows; a legacy `src` that is not OpenAlgo's is not used and is reported. Payloads are built from legacy's stored OpenAlgo values by the same parse production's source applies to OpenAlgo's response (the builder cites that call), one mapping row per stream (spot, chain, Greeks, ticks), written as data and checked on step 1's fixture records.
* **Bar finality from legacy's stamps.** The driver commits through `MarketLoop.run_once(polled=(records, coverage), poll=False)` (`ingest.py:264-290`): never `poll`, which stamps every record with the poll instant as both times (`:243-259`). Each commit holds the records of one legacy `fetched_at` stamp (with the ticks up to it), with the clock at that stamp, so no commit crosses a confirmation instant and the store's `now` is always a legacy stamp. Coverage: one `covered` row per source, stream and instrument present at that stamp, as `_fetched` writes for a successful fetch (`:196-235`); a legacy record that does not map is an `interrupted` row with its reason.

#### The cursor and the copier's log *(S5-7)*

* **The copier's pass log.** Each pass appends one line to `root/input/.copier-log.jsonl`, fsynced before `.copier-pass.json` is replaced (`legacy_copier.py:293-298`): `{"format": "copier-pass/1", "pass": n, "started_at", "completed_at", "sizes": {rel: size}, "anomalies": [{"rel", "detail"}], "gaps": [{"rel", "offset", "detail"}], "moved": [rel]}`. `pass` counts up from 1 and survives restarts (read back from the log). `.copier-pass.json` gains `pass` and `stopped`, `{rel: {"kind": "anomaly"|"gap", "first_pass", "detail"}}`. The log replaces stdout as the record (`:267-277`, `:436` still print), so a file the copier stopped is visible to the shadow and the report. The log is a dot-file at the input root, outside every reader's pattern.
* **The shadow's cursor.** The driver alone writes `root/state/cursor.jsonl`, one fsynced line per step: `{"format": "shadow-cursor/1", "step": n, "clock": "<UTC>", "settled": "<UTC>", "copier_pass": p, "files": {rel: consumed size}, "ledger": [sequence, event_hash], "market_store": <the store's head after the commit>}`. `files` covers every input file the driver reads: the registry and governance-evidence and checkpoint copies, `decisions/1` and `market_ndjson/1`. No ledger event kind is added.
* **The pin covers what the comparison reads.** `IMPORT_BOUNDARY_PINNED` gains `prefixes`: for every `decisions/1` and `market_ndjson/1` copy in the input, `[size, sha256]` at the pin. They are not staged (a copy is never rewritten, step 2), but are re-hashed when read (`MIG-R03` if changed). Step 3's `files` already pin the run stores.

#### The comparison (`compare_parity.py shadow --day D`)

* **Day scope** *(S5-8)*. `D` must be a weekday of `CALENDARS["nse-fo/v1"]` (`contracts/market.py:229-275`), else `MIG-R11`. Shadow commands of `D`: those whose `COMMAND_ADMITTED` `event_time` has `exchange_date` `D` (step 4's rule). Legacy rows of `D`: those whose `day` is `D`. Every legacy instant is parsed, never compared as text.
* **The head pair** *(S5-7, R5-4)*. `B` is the latest `IMPORT_BOUNDARY_PINNED` for `D` in `root/rehearsal/<D>/ledger.db` (step 3). After `B` exists the driver consumes no byte beyond `B`'s sizes. Pairing is on **exactly the files the driver reads** (the cursor's `files`): each must be pinned by `B`, in `files` or `prefixes`, with a size equal to the cursor's. `H` is the `ledger` of the first cursor line where that holds for every file it names. `B`'s other pinned files (stores the driver does not read) are not checked by the pairing. **`MIG-R11`** refuses when there is no `B` for `D`, when a file the driver reads is not pinned by `B`, when no cursor line pairs (the reason names each file whose cursor falls short, and each stopped file from the copier's log), or when `H` and `B` are not both named in the report.
* **The comparison set:** the spec's seven rows (`migration spec :333-341`), each a function over legacy's views at `B` (step 3's `legacy_views/1` and the ported views) and the shadow's index tables at `H`.
* **Money is exact** *(S5-9)*. Legacy's numbers are read from their JSON text as `Decimal` (above); the target's are its decimal strings. Two values are equal only when the two `Decimal`s are equal (so `100.0` equals `100.00`), with no quantizing and no tolerance. Step 4's tie case (legacy's 100.0003 against an exact 100.0002) is therefore a defect wherever such a value is compared.
* **The legacy-gate-to-refusal-code table** *(S5-9)*, fixed here. A legacy refusal is the `refused_at` and `reason` of its plan record, `plans/1` (authority-map row 17; written at `src/core/framework/observe/plans.py:52`, `:108-109`; set by `src/core/framework/runtime/orchestrator.py:289-290`), never the `decisions/1` record *(R5-5)*; the comparison reads `plans/1` from the copies through step 1's reader. The stages are `STAGES` (`:90-92`) plus `intent` (`:427`).

  | Legacy stage | Target refusal | Equal when |
  |---|---|---|
  | `intent` | `ADM-R01` `malformed_request` | same code |
  | `kill_switch` | `PRT-R01` `kill` (`kernel/safety.py:654`) | same code |
  | `freshness` | `ADM-R05` `stale_input`, B1's spot or chain age (`kernel/admission.py:1010-1012`) | same code |
  | `view_freshness` | `ADM-R05` `stale_input`, B1's view age (`:1006-1009`) | same code (Q-003 may approve the case it names) |
  | `view_lag` | none found | always a defect, `unmapped_gate` |
  | `loss_latch` | `PRT-R03` `latched` (`safety.py:659`) | same code |
  | `session_gates` | `ADM-R13` `plan_refused`, stage `session_gates` (`kernel/planner.py:62-132`, legacy's `check` ported) | same code and stage, reason text byte-equal |
  | `strike` | `ADM-R13`, stage `strike` | the same |
  | `quantity` | `ADM-R13`, stage `quantity` or `lot_size` (the target splits legacy's stage; legacy's lot-size details, `orchestrator.py:632-650`) | the same; a legacy detail with no byte-equal target text is a defect |
  | `exposure` | none found | always a defect, `unmapped_gate` |
  | `stop` | `ADM-R13`, stage `stop` | as `session_gates` |
  | `loss_budget` | `ADM-R13`, stage `loss_budget` | as `session_gates` |
  | `request` | `ADM-R13`, stage `request` | as `session_gates` |
  | no legacy refusal | any target refusal (including `ADM-R12`, `ADM-R14`, `ADM-R15` past its deadline, `ADM-R16`, `PRT-R04`, `PRT-R06`, `PRT-R10`, and stages `economics`, `resolve`, `select`) | never: a defect |

* **The review** *(S5-11)*. Step 5 composes no review converter and no cognition. A review-required entry waits `review_deadline_secs`, then proceeds `proceed_unavailable` (`no_review`) with an alert, as legacy fails open (`kernel/policy.py:211-217`). Each such entry is a defect of class `review_not_replayed` at its first cause, never approved. If step 6's first day shows review-required entries, a converter from legacy's AI-management review records to `compose_cognition_replay`'s staged records (`bootstrap.py:567-577`) is planned then, not guessed now.
* **Approved differences** (`resources/approved_differences.json`) *(S5-5, S5-9)*. One row per owner answer that records a difference from legacy. Each row has its reference (the answer's anchor in `decisions/owner-answers-2026-10-27.md`), a named condition function, and the expected value on each side:

  | Row | Owner answer | Condition | Legacy expected | Shadow expected |
  |---|---|---|---|---|
  | Q-003 | View age from the bar's close | The view's age from the bar's open exceeds `max_view_age_secs`, and from its close does not | `view_freshness` refusal | Admitted |
  | Q-026 | Deep-OTM delta exit (option A) | The tick's delta is below `delta_exit_threshold` while legacy held | No exit at that tick | A close with reason `deep_otm_delta` (answered `not_sent`) |
  | Q-027.1 | A partial protective fill | A protective leg filled below its quantity while a sibling rests | The sibling cancelled whole (`_cancel_resting_siblings`) | A modify of the sibling to its recorded fills plus `q`, or a cancel only when `q` ≤ 0 (answered `not_sent`) |
  | Q-027.2 | The entry ends partly filled | The matched entry is terminal with its cumulative fill below its quantity | Legs left at the planned quantity; no trail; no square-off by legacy | Modifies shrinking both legs to `q`, the trail's modifies, a square-off close (each answered `not_sent`) |
  | Q-027.3 | The entry never fills, or is rejected, while its legs rest | The matched entry is terminal with no fill, and its protective legs rest in the books | No cancel of the legs | One cancel per resting leg (F-P15; answered `not_sent`) |
  | Q-027.4 | A sibling's cancel fails | Legacy's sibling cancel row is `rejected` | The strategy held at the rejection; no retry | Retries until `reconciliation.working_escalation_secs` after the first rejection, then the hold |
  | Q-027.5 | Roles cannot be proven | The matched entry is answered `ambiguous`, and no `protective_roles` appear in legacy's lines | The entry stays `unknown`; a strategy hold when it stays ambiguous | One `protective_roles_unassigned` escalation; nothing submitted for the subject until `LEG_ASSIGNED`; no hold |
  | Q-029 | No recovery hold on an unreadable broker | A restart while `LegacyBooks` cannot answer (funds missing, or a stopped file) | The strategy held | Entries refused `ADM-R05` until the books answer, then admitted |
  | Q-030 | A bar is final at its confirmation instant | A legacy record whose `at` lies in the bar and whose **legacy `fetched_at`** is after the bar's confirmation instant (its close plus `market.bar_confirm_lag_secs`) | Legacy's bar includes it | The shadow's final bar does not (a correction revision) |

  Q-030's condition reads legacy's arrival stamps only, never the shadow store's or the copier's times, so lateness the copier caused can never match it. For spot and chain, legacy's `fetched_at` equals `at`, the poll instant (`src/data/marketdata/store.py:278`, `:291-293`); **only ticks carry a separate arrival time, so Q-030 can match only ticks.** A difference matches a row only when the condition holds on the matched pair and both sides equal the expected values; it is then reported as a migration with its reference. The rows are copied from the owner's text (`decisions/owner-questions.md`, `decisions/owner-answers-2026-10-27.md`) and reviewed against it; no agent adds a row.
* **`MIG-R13`** (new): the table refuses to load, and the comparison with it, when a row has no reference to an owner answer, names a condition function that does not exist, or a slice Deviation is given as its reference. A slice Deviation that changes a compared value is never a row; its differences stay defects (spec).
* **One cause, reported once** *(S5-10)*. Each defect has an ID. A later difference is linked to an earlier defect, as `consequence_of`, when its subject descends from that defect's subject the same day: the same command or its attempts; an action whose target is that command's order or position; or the books row of that position. It is reported under its cause and not counted again. An unmatched protective action's later attempts are linked the same way. Session statistics that a cause changes (trade count, streak) are not traced; their refusals are separate defects.
* **No day counting.** The comparison reads one day's inputs and writes one report; no code lists `reports/` or counts days (the owner's combined answers).
* **Output:** `root/reports/<D>.json` (`B`, `H`, every row's pairs, migrations with their references, defects with their causes and both sides' inputs, the copier's stopped files), and the summary line for `docs/migration.md`'s shadow table.

### Tests

Labelled synthetic values only; no production data.

| File | Test | Proves |
|---|---|---|
| `tests/contracts/test_capabilities.py` | Shadow composition (PRF-MIG-11) | The composed graph holds no `adapters.openalgo` object and nothing that imports `socket`, `ssl` or `http`; the responder's and the market feed's module reach (no network module, no write call); the closure tests import the tree under test |
| same | `MIG-R10` per name *(S5-2)* | One case each: `AT__OPENALGO__AUTH__API_KEY`, `MCP_OPENALGO__AUTH__API_KEY`, `OPENALGO_API_KEY`, `CREDENTIALS_DIRECTORY`, an env locator named by the profile, and an `openalgo/api_key` reference; each refuses before any file opens; the kernel is composed with `credentials=None` |
| same | `MIG-R12` *(S5-1)* | Refused: the root equal to, inside, or containing the ledger directory, the deployment root, the market store or a legacy root, including through a symlink; with `ledger.path`, `AT_DEPLOYMENT_ROOT` or a legacy root unset. Accepted otherwise: every opened path is under the root, and an effective `ledger.path` pointing at a stand-in production ledger leaves that file byte-identical, with no `-wal` or `-shm` created and no epoch added |
| same | Settings *(S5-4)* | `shadow.outcome_wait_secs` or `shadow.legacy_write_lag_secs` unset: `RefusingParameterUnbound` |
| `tests/integration/test_shared_engine.py` | Shadow day (PRF-MIG-10, PRF-MIG-11) | Over a fixture day driven by `ShadowDriver`: a matched entry acknowledged with legacy's broker ID and filled from the books; **an unmatched entry answered `not_sent` (`disarmed_unmatched`), one attempt, then `DSP-R01`**; a legacy-only order `FOREIGN_RECORDED`; a `sent` line with no outcome answered `ambiguous` (`legacy_pending`); a worker never busy for longer than one `send` call |
| same | Late line *(S5-4)* | Legacy's `formed` and `ack` lines copied one pass after the market record of their bar: the shadow does not step past the bar until that pass is consumed, and the entry is matched, not `not_sent` |
| same | Stopped file *(S5-7)* | A gap in the registry copy holds `S`: no step after it, no unmatched answer inferred; the report names the file |
| same | Unmatched protective action *(S5-3)* | A stop modify legacy never sent: one attempt per scheduled pass until the position is flat in the books; none after; the report has one defect for it, its later attempts linked |
| same | Fills *(S5-6)* | Three partial lines (118.3167) and the tie case (100.0003 on 600): the trades' IDs and prices follow the rule; the ledger's cumulative notional after each line equals legacy's `P·Q` exactly; a reread adds no fill; a structure leg's fill goes to `dropped` |
| same | Funds *(S5-6)* | With an attestation record, funds equal its `availablecash` exactly; before it, the cycle is dropped and entries refused `PRT-R06` `check_inert`, reported as a defect |
| same | IST day *(S5-8)* | Shadow commands admitted at 2026-11-02T18:29:59Z and 18:30:00Z fall in 2026-11-02 and 2026-11-03; legacy rows at 15:29:59 and 15:30:01 IST both in `D`; a row at `09:00:00+05:30` sorts before one at `04:00:00Z`; an earlier day's order is not in the book; `D` on a Saturday refuses `MIG-R11` |
| same | Schedule *(R5-1)* | Over a day with ticks between grid instants: protection, trails and tick exits run only at `seconds_to_next_pass` grid instants (with `bar_confirm_lag_secs`), every other step's pass is woken; `recovery.tick` runs every step; observation cycles are `observation.poll_interval_secs` apart and none is skipped for budget; the strategy host passes only at its `pass_secs` grid. `tests/integration/test_kernel_host.py` passes unchanged over the factored `PassSchedule` |
| same | Kill input *(R5-2)* | Legacy's `KILL` appears in the copy mid-day: entries are refused `PRT-R01` from the first step whose settled pass shows it, not before. With production's configured kill path unreadable (a stand-in that raises `PermissionError`), the shadow still claims and dispatches, and that path is never `stat`ed |
| same | Close command *(R5-3)* | Step 4's `close_command` case: the close's fills come from its own row only, one fill per increase, no `fill_mismatch`, and the shadow's closed quantity equals legacy's |
| same | Pairing *(R5-4)* | A store the driver does not read (holds), pinned by `B` at another size than any cursor names, does not block pairing; a file the driver reads but `B` does not pin refuses `MIG-R11` |
| same | Owner acts *(R5-6)* | The binding and grants are relayed through `relay:shadow-driver` with `owner_credential` and recorded in the shadow ledger; the session opens on `recovery.tick`; the composed graph holds no channel, listener or socket object, and no socket is opened during the day (a `socket.socket` stand-in that raises) |
| `tests/contracts/test_legacy_binding.py` (T-119) | Binding converter | Over the fixture's `buyer_edge` binding for 2026-11-02: the converted strategy set equals legacy's bound strategies; the dates are `D`; one `entry` grant valid only within `D`'s session, no delegation; IDs are equal across two runs and change with `D`. `MIG-R14` when the day has no binding, a binding's integrity or path day is wrong, its strategy is unknown, or the profile binds zero or two policies |
| same | Gate source *(R5-5)* | Legacy refusals are read from `plans/1`; a fixture `decisions/1` record with a different reason does not change the comparison |
| same | Market timing *(S5-5)* | Two legacy polls copied in one pass keep two keys and their own `at` and `fetched_at`; a record copied late but fetched before confirmation is in the final bar and matches no Q-030 row; a tick fetched after confirmation matches Q-030; a spot or chain record (`fetched_at` equal to `at`) never does |
| same | Comparison | The head pair recorded; each of the seven rows detects a planted difference; one planted Q-003 difference matched, the same with the condition false a defect; a planted gate refusal mapped by the table, and a byte-different reason a defect; `MIG-R11` with a cursor short of `B`, with no `B`, and with a stopped file |
| same | One cause *(S5-10)* | An unmatched entry that legacy filled: one defect at the entry, its fills, protection and position differences linked to it, counted once |
| same | Deviation and table *(S5-10)* | A difference caused by a slice Deviation on a compared row (a planted agent-written row in a test copy of the table) refuses `MIG-R13`; with that row removed, the same difference is a defect; every row of the shipped table names an owner answer |
| same | No day counting *(S5-10)* | An AST check: no module of the comparison or driver lists `reports/` or reads another day's report; the report is byte-identical with zero and with three earlier reports present |
| same | Money exact *(S5-9)* | 100.0003 against 100.0002 is a defect; 100.0 against `100.00` is equal |
| `tests/unit/test_legacy_market.py` (T-115) | Market feed | Only whole members are read from the cursor; the stream mapping reproduces step 1's fixture records; legacy's stamps are kept |
| `tests/contracts/test_legacy_copier.py` | Pass log *(S5-7)* | Each pass appends one line with its sizes; a corrupt member and a prefix mismatch appear in `gaps` and `anomalies` and in `stopped` with their first pass; `pass` survives a restart |
| `tests/contracts/test_legacy_import.py` | Prefixes *(S5-7)* | `B` pins every `decisions/1` and market copy; a changed prefix refuses `MIG-R03` |
| `tests/contracts/test_capabilities.py` (where `validate_composition` is tested) | Transient rows *(S5-12)* | `shadow` validates with no unit enabled; a missing entrypoint is reported |

### Break checks

1. Import `socket` (or `adapters.openalgo`) in the responder: the composition test fails.
2. Drop `OPENALGO_API_KEY` from the names `MIG-R10` checks (use `AT__OPENALGO__*` only): the per-name test fails.
3. Open `effective.ledger_path` instead of the root's ledger: the `MIG-R12` test fails (the stand-in production ledger changes).
4. Compare roots as strings, not real paths: the `MIG-R12` test fails (symlink).
5. Answer an unmatched entry `rejected`: the shadow-day test fails.
6. Answer an unmatched entry `ack`: the shadow-day test fails.
7. Match an entry without the bar: the shadow-day test fails (a planted same-instrument entry at another bar).
8. Wait inside `send` for legacy's outcome: the worker check fails.
9. Step without waiting for the settled pass: the late-line test fails (`not_sent`).
10. Leave legacy-only orders out of the books: the foreign-activity assertion fails.
11. Price each fill at `P(k)`: the fills test fails (cumulative notional).
12. Fill IDs from line numbers that change on reread, or a rebuild from the ledger copy: the fills test fails (a fill counted twice).
13. Stamp market records with the driver's step time: the market-timing test fails.
14. Evaluate Q-030 on the shadow store's arrival time: the market-timing test fails (the late-copied record matches).
15. Compare `at` as strings: the IST-day test fails.
16. Compare money with a tolerance, or after rounding to 4 places: the money test fails.
17. Approve a difference whose condition is false: the comparison test fails.
18. Accept a table row with no owner reference: the Deviation-and-table test fails.
19. Compare latest against latest: `MIG-R11` fails.
20. Count a consequence as its own defect: the one-cause test fails.
21. Report every attempt of an unmatched protective action: the unmatched-protective test fails.
22. Keep the copier's gaps on stdout only: the pass-log test fails.
23. Read a market member past the cursor's whole members: the market-feed test fails.
24. Run a scheduled pass at every stamp *(R5-1)*: the schedule test fails (protection off the grid).
25. Read one observation cycle per stamp: the schedule test fails (budget skips).
26. Build the kill input with `KillInputs.resolve` over production's paths *(R5-2)*: the kill-input test fails (unreadable, nothing claimed).
27. Judge the copied `KILL` at wall time, not by the pass log: the kill-input test fails (refused before the settled pass).
28. Also take a close command's fills from the entry's close fields *(R5-3)*: the close-command test fails (`fill_mismatch`).
29. Pair on every file `B` pins *(R5-4)*: the pairing test fails.
30. Read legacy refusals from `decisions/1` *(R5-5)*: the gate-source test fails.
31. Compose a channel listener for the relay *(R5-6)*: the owner-acts test fails.
32. Bind every registered strategy instead of legacy's bound set: the binding-converter test fails (the strategy set).
33. Invent a binding when `D` has none: the binding-converter test fails (`MIG-R14`).
34. Skip the integrity check: the binding-converter test fails.

### Files

* **New:** `src/autonomous_trading/adapters/legacy_responder.py` (T-112), `src/autonomous_trading/operations/shadow_compare.py` (T-113), `src/autonomous_trading/resources/approved_differences.json` (T-114), `tests/unit/test_legacy_market.py` (T-115), `src/autonomous_trading/adapters/legacy_market.py` (T-116), `src/autonomous_trading/operations/shadow_run.py` (T-117), `src/autonomous_trading/adapters/legacy_binding.py` (T-118), `tests/contracts/test_legacy_binding.py` (T-119), `scripts/compare_parity.py`.
* **Changed:** `adapters/compatibility.py` (`read_market_file`); `adapters/legacy_copier.py` (the pass log, `pass`, `stopped`); `operations/legacy_import.py` (`prefixes`); `kernel/host.py` (`PassSchedule`, factored out of `KernelHost`, behaviour unchanged); `bootstrap.py` (`compose_shadow`, `MIG-R10`, `MIG-R12`, the shared contracts helper); `operations/deployment.py` (`COMPOSITIONS["shadow"]`, the `transient` status); `settings/schema.py`, `resources/defaults.yaml`, `tests/unit/test_settings_resolver.py` (two settings, `paths.shadow.root`'s scope); `scripts/gen_legacy_fixtures.py` and `golden.json` only if the fixture day needs records the fixtures lack (governance attestation, decision records naming bars), each named in "as built"; `tests/contracts/test_capabilities.py`, `tests/contracts/test_legacy_copier.py`, `tests/contracts/test_legacy_import.py`, `tests/integration/test_shared_engine.py`; `tests/integration/test_kernel_host.py` runs unchanged as the factoring's guard; `docs/migration.md` (the shadow table).
* **Specs (this slice's sections of the migration spec):** the composition table (one shadow process, the `transient` rows), the responder's text (no end-of-day rebuild; the answers table), the refusal catalogue (`MIG-R10` as built, `MIG-R11`, `MIG-R12`, `MIG-R13`, `MIG-R14`), the approved table with Q-027's sub-rows; **reported to their owners:** the configuration spec (the two settings, `paths.shadow.root`'s scope, the `shadow` composition). The `env_locators` fix is the main line's, not this step's.

### Fork calls and Deviations

* **No Fork call:** the shadow cannot send, nothing it decides reaches a broker, and every money and gate comparison follows legacy's values exactly.
* **Deviation:** the responder in its own module; the market feed in its own module.
* **Deviation:** one shadow process in legacy's recorded time, where the spec lists separate market, BuyerEdge and kernel units.
* **Deviation:** no end-of-day rebuild from the ledger copy and no "provisional" label; synthetic fill IDs by the rule above.
* **Deviation:** no review converter in step 5; review-required entries are defects.
* **Deviation:** the shadow's binding and grants are converted from legacy's session binding for `D` by the rules above (`src/runtime/session_config.py:38-39`, `:57-59`, `:864-975` at 445eb116).
* **Recorded dependency:** SLICE-11 step 8's lease store, before step 6.
* **Settled:** an unmatched command is `not_sent` (`disarmed_unmatched`), always a defect.

### Completion conditions (step 5)

The tests pass twice with the layering guards; every break check fails a listed test and every file is restored (md5); the step is recorded "as built".

### Step 5 as built (part 1 of 2)

Commit `a79450d` on `slice-13`, on top of `06a7235` (the fast-forward that holds SLICE-11 step 7 and the main line's `env_locators` fix, `3ec5623`). Not pushed. Reviewed twice before building ("Ready to build: no", then "yes after fixes"); the binding converter (coordinator, option 3) was added after the second review without another, as the coordinator directed.

**The gate first.** The plan said to check that the profile holds every field the owner acts need, and stop if not. It does not: the profile's sections are `channel`, `operator`, `policies` and `observer` (`settings/schema.py:438`), so it holds `policy_binding_id` but no binding ID, candidates, dates or grant fields. The build stopped. The coordinator chose to convert legacy's own session binding for `D` (option 3); the plan above now says so, with `MIG-R14`.

**Built, tested and break-checked in this commit (the self-contained parts):**

* **`adapters/legacy_binding.py`** (T-118): `convert_binding` and `BindingRefused` (`MIG-R14`), as planned, with one finding: `StandingBinding.families` holds **promotion** families (`contracts/identity.py:97`, `:169-175`), not a strategy's family, and comes from the candidate bundle, which the shadow does not hold. A rule strategy needs none (`""`). **Correction to the plan:** `families` is `""` per candidate, and a bound strategy that needs promotion refuses `MIG-R14` (`promotion_family_unknown`) instead of being given an invented family. Legacy's integrity is accepted in either of `compatibility._integrity`'s two encodings (they differ only for non-ASCII text; the fixture matches both).
* **`kernel/host.py`**: `PassSchedule`, factored out of `KernelHost._serve` (start, `scheduled`, `passed`, `timeout`); `_serve` now uses it and its behaviour is unchanged (the 36 existing kernel-host tests pass).
* **`adapters/legacy_copier.py`**: the pass log `input/.copier-log.jsonl` (`copier-pass/1`: `pass`, `started_at`, `completed_at`, `sizes`, `anomalies`, `gaps`, `moved`), fsynced before `.copier-pass.json`, which gains `pass` and `stopped` (`{rel: {kind, detail, offset?, first_pass}}`); `read_pass_log`. The pass number is read back from the log, so it survives a restart.
* **`bootstrap.py`**: `shadow_preflight(effectives, environ)`: `MIG-R10` (every name of `key_names(env_locators(eff))` in the environment; an `openalgo` secret reference) and `MIG-R12` (the shadow root's real path against the directories of `ledger.path`, `market.store_path` and `supervisor.assessment_path`, and `release.root`, `paths.evidence`, `paths.run`, the research roots, `AT_DEPLOYMENT_ROOT` and both legacy roots, both ways; refused when `ledger.path`, `AT_DEPLOYMENT_ROOT` or a legacy root is unset). Returns the root's real path.
* **`adapters/legacy_responder.py`** (T-112): `fills_from_cumulative`, the tradebook's fill rule as planned (one fill per increase, exact; two when the quotient does not terminate; IDs `legacy:<order>:<Q>[:b]`).
* **`operations/shadow_compare.py`** (T-113) and **`resources/approved_differences.json`** (T-114): `legacy_numbers` and `money_equal` (exact; a float raises), `GATE_TABLE` and `gate_matches` (the plan's table), `load_approved` (`MIG-R13`: no owner reference, an id not its answer's, an unknown condition), `CONDITIONS` (one per row; Q-030 reads legacy's `fetched_at` and matches ticks only) and `approve`.

**Tests** (new or extended): `tests/contracts/test_legacy_binding.py` (T-119, 12 cases); `tests/contracts/test_capabilities.py` (`MIG-R10` per name, the `openalgo` reference, `MIG-R12` in eight cases, the module reach of the responder and the converter); `tests/contracts/test_legacy_copier.py` (the pass log); `tests/integration/test_kernel_host.py` (`test_pass_schedule_grid_only`: stepped each second, scheduled only at 0, :07, :27, :47); `tests/integration/test_shared_engine.py` (money, gate table, approved table with Q-003 and Q-030, `MIG-R13`, fills). `tests/contracts/test_legacy_import.py`'s stamp test now expects the stamp's two new fields. `MIG-R12`'s symlink case skips on Windows (no symlink privilege) and runs on Linux.

**Tests run (Windows, affected only):** `tests/contracts`, `tests/recovery`, `tests/integration/test_kernel_host.py`, `tests/integration/test_shared_engine.py`. Run 1: 828 passed, 10 skipped, 1 failed (`test_copier_pass_stamp_and_final_copy`, which pinned the stamp's old two fields; updated). Run 2: 829 passed, 10 skipped, 0 failed. After break check 9 tightened `test_mig_r14`, that file was rerun: 12 passed. `ast.parse` passes on every edited Python file.

**Break checks** (script `break_step5.py` in the session scratchpad):

| Break | Failed |
|---|---|
| 1. Import `socket` in the responder | `test_shadow_modules_reach` |
| 2. `MIG-R10` by `AT__OPENALGO__*` names only | `test_shadow_mig_r10_names[MCP_OPENALGO__AUTH__API_KEY]` |
| 3. `MIG-R12` one way only (root inside, not containing) | `test_shadow_mig_r12[contains_legacy]` |
| 4. Each fill priced at `P(k)` | `test_shadow_fills_from_cumulative` |
| 5. Money compared with a tolerance | `test_shadow_money_exact` |
| 6. Approve with the condition false | `test_shadow_approved_table` |
| 7. Accept a row with no owner reference | `test_shadow_mig_r13[row0-no_owner_reference]` |
| 8. Bind every registered strategy | `test_strategy_set_equals_legacy` |
| 9. Invent a binding when `D` has none | `test_mig_r14[no_binding]` (the first run did not bite: a later check still refused; the test now also checks each refusal's reason) |
| 10. Skip the integrity check | `test_mig_r14[integrity]` |
| 11. A scheduled pass at every stamp | `test_pass_schedule_grid_only` |
| 12. Gaps only on stdout | `test_pass_log_records_sizes_and_stopped_files` |
| 13. Q-030 judged on the shadow's arrival | `test_shadow_approved_table` |
| 14. A planner stage matched without its reason | `test_shadow_gate_table` |
| 15. A split increase priced at its average | `test_shadow_fills_from_cumulative` |

The checks ran on a scratch copy of the tree (so the second test run was not disturbed), each file restored and its md5 confirmed.

**Not built yet: the continuation (part 2), in this order.** Each item is specified in the plan above; nothing in it is decided here.

1. `LegacyBooks` (orderbook, tradebook through `fills_from_cumulative` with the one-source rule for close commands, positions from checkpoints, funds from the attestation evidence, `dropped` for structure legs, `source="legacy_registry"`) and `LegacyOutcomeResponder` (matching and the answers table) in `adapters/legacy_responder.py`.
2. `adapters/legacy_market.py` (`LegacyMarketFeed`) and `compatibility.read_market_file`; `tests/unit/test_legacy_market.py` (T-115).
3. The kill-input port over the copied kill file and the pass log.
4. `compose_shadow` in `bootstrap.py` (calls `shadow_preflight` first; production-shaped `_compose_kernel` with the responder as `port_factory`, `LegacyBooks` as `observation_port`, `contracts={}` through a helper shared with production, `relays` and `relay_peer` set to `relay:shadow-driver`, `credentials=None`); the two settings `shadow.legacy_write_lag_secs` and `shadow.outcome_wait_secs` and `paths.shadow.root`'s kernel scope (`settings/schema.py`, `defaults.yaml`, `test_settings_resolver.py`).
5. `operations/shadow_run.py` (T-117): `ShadowDriver` on `RecordedClock` with `PassSchedule`, the settled instant from `read_pass_log`, the owner acts from `convert_binding`, the cursor file; first check that the production-shaped composition accepts a `recorded` clock domain, and stop if not.
6. `operations/legacy_import.py`: `IMPORT_BOUNDARY_PINNED.prefixes`.
7. The rest of `operations/shadow_compare.py`: the head pair (`MIG-R11`), the seven rows, one cause reported once, the report; `scripts/compare_parity.py`; `COMPOSITIONS["shadow"]` with the `transient` status; `docs/migration.md`.
8. The plan's remaining tests and break checks (shadow day, late line, stopped file, unmatched protective, funds, IST day, market timing, kill input, close command, pairing, owner acts, gate source, one cause, no day counting); then "Step 5 as built (part 2)".

### Step 5 as built (part 2 of 2)

Commits `8979f8c` and `3775586` on `slice-13`, on top of `ab92b01`. Not pushed. The eight continuation items are built in order; two stop conditions the plan named were met and are recorded below as findings, not worked around.

**The gates the plan set, checked first.**

* **A `recorded` clock domain in the production-shaped composition:** accepted. `compose_shadow` composes `_compose_kernel` with a `port_factory` (no synthetic capacity, no Authorizer) on a `RecordedClock`, and a whole synthetic day runs (`test_shadow_day_matched_unmatched_foreign`).
* **Decision records naming their bar** (step 1's fixtures): `d-1001`…`d-1003` carry `at` and `bar_index`; the registry's other rows (`d-1004` `teleported`, `d-1005`) have no decision record, so they are never matched, as planned. Legacy's bar is the decision record's `at`; the shadow's is the intent's `as_of` (the host's trigger). That the two name the same instant on production is **not checked**; a mismatch shows as every entry `disarmed_unmatched` on step 6's first day.
* **Checkpoints' positionbooks** (measured on the fixtures): legacy's `session_checkpoints/1` lines carry no write instant and their positionbooks are empty, so no checkpoint can be placed "at or before the clock". `day_pnl` and `ltp` are `None`; the latch goes inert (`pnl_field_missing`), as planned for `None`.
* **Funds with no caps configured:** not checked (the fixtures configure caps); the shadow refuses without funds evidence.

**Built:**

1. **`adapters/legacy_responder.py`**: `parse_registry` (whole lines, numbers as `Decimal`, `at` parsed to an aware instant, a stamp with no offset reported and not used, rows of `D` only); `LegacyInputs` and `read_inputs` (registry, governance evidence by `reviewed_at`, decision bars, each copy read only to the consumed size); `LegacyOutcomeResponder` (matching and the answers table as planned; never waits; publishes its `transport_result` through the kernel's evidence store); `LegacyBooks` (orderbook with protective legs, tradebook through `fills_from_cumulative` with the one-source rule for close commands, positions from the fills, funds from `session_state_attestation` then `session_cap_snapshot`, structure legs to `dropped`, `source="legacy_registry"`).
2. **`adapters/legacy_market.py`** (`LegacyMarketFeed`, also the `MarketLoop`'s source) and **`compatibility.read_market_file`**; legacy's chain legs of one poll are grouped into one target chain payload (expiry from the symbol); ticks lifted by production's `tick_record`; `tests/unit/test_legacy_market.py` (T-115, 5 cases).
3. **The kill input** (`LegacyKillInput` in `operations/shadow_run.py`, a `KillInputs` subclass, because `Safety` accepts only `KillInputs`): present at `t` when the first consumed pass covering `t` (`started_at − lag ≥ t`) recorded `run/KILL`. **Correction to the plan's wording** ("the latest consumed pass"): the latest pass would show a `KILL` written after `t`; the covering pass is the earliest.
4. **`compose_shadow`** in `bootstrap.py` (preflight first, the two waits refusing, paths from the root only, `production_contracts()` now shared with `_compose_production_kernel`, `relays` and `relay_peer` the one `relay:shadow-driver`, `credentials=None`); **settings** `shadow.legacy_write_lag_secs` and `shadow.outcome_wait_secs` (installer and kernel, `measured`, `int_pos`, unset) and `paths.shadow.root` widened to the kernel scope.
5. **`operations/shadow_run.py`** (T-117): `settle` (the latest pass before the first stop of a file the driver reads), `ShadowDriver` (the step order of the plan, `PassSchedule` for the kernel's grid, the host's own `next_delay`, observation cycles `poll_interval_secs` apart on the recorded clock, woken passes until nothing is in flight, the cursor line per step) and the owner acts. **Correction to the plan:** a fresh shadow ledger cannot routine-advance (routine check 2: no earlier epoch), so the owner's `recovery_advance` is relayed first, as the replay engine does; then the binding and the grant. Three owner acts, not two. The day's end refuses unsent entries and drains (the kernel host's stop sequence is not reused: it needs a `KernelHost`).
6. **`operations/legacy_import.py`**: `IMPORT_BOUNDARY_PINNED.prefixes` (`[size, sha256]` of every `decisions/1` and market copy, input-relative), re-hashed on resume (`MIG-R03`); `events.schema.json` gains the field.
7. **`operations/shadow_compare.py`**: `check_day`, `latest_boundary`, `pair_heads` (`MIG-R11`), `read_shadow`, the rows, `link_causes`, `compare_day` and the report `root/reports/<D>.json`; `scripts/compare_parity.py shadow --day D --shadow-root R`; `COMPOSITIONS["shadow"]` (`copier` and `shadow` `transient`, supervisor optional) with the `transient` rule in `validate_composition`; `docs/migration.md`'s shadow table. **Correction to the plan:** `H` is the **last** cursor line that pairs with `B`, not the first: when the copies are complete before the driver starts, the first line pairs before anything is processed.
   * **Rows compared:** decisions and refusals per bar (legacy from `plans/1` and the registry, never `decisions/1`; the shadow's from `COMMAND_ADMITTED` and the admission refusal after each `INTENT_SEEN`), order quantities (every `disarmed_unmatched` outcome a defect; fills per matched order), unknown outcomes, books (positions per instrument). **Not compared** (each reported `not_compared` with its reason, so no report is clean): `reservation_totals`, `protection_obligations`, `evidence_class`. The last needs an owner answer: the shadow's effects are `simulated` by construction, legacy's are live.
   * **One cause:** a later difference sharing a command, legacy order, instrument, or (for protection's `prot:<position>:…` keys) position with an earlier defect is linked `consequence_of` it.
8. **Tests:** a new integration file, `test_shadow_day.py` (a **Deviation** from the plan's file list, which put these in `test_shared_engine.py`, so that file's subprocess phases stay apart), `tests/contracts/test_capabilities.py` (`test_validate_shadow_composition`), `tests/contracts/test_legacy_import.py` (two prefix tests), `tests/unit/test_settings_resolver.py` (the scopes). The shadow-day tests use PRF-RES-10's scripted rule strategy, not BuyerEdge (a fixture day cannot make BuyerEdge decide on a chosen bar); the composition is the same.

**Findings (each stops its part; nothing was changed to get round it):**

* **Capacity refuses every entry, in production too.** Production's OpenAlgo funds parse yields `ObservedFunds(available, None, None, None)` (`adapters/openalgo_books.py` `_funds`), so the kernel's capacity check (B5) refuses every entry `ADM-R09 observation_field_missing` (`kernel/admission.py:150-178`): `funds.margin_available` and the empty books' aggregates are `None`. The shadow reproduces it (`test_capacity_refuses_without_margins`). The other shadow-day tests set labelled synthetic margins through `LegacyBooks.MARGINS`. A money gate: for the owner (open item).
* **The fill rule meets the ledger's money form.** The ledger accepts money with exactly two places (`envelope.is_money`, LED-R06), and a refused `FILL` stops the kernel (`WriterLost`). Legacy rounds averages to four places, so `fills_from_cumulative` gives prices such as 118.4501 the ledger refuses. As built, `LegacyBooks` reads each derived price by production's tradebook money rule: one that is not two-place money is not a trade row, its order goes to `dropped` (escalated `trade_without_id`) and it is reported. So the plan's "cumulative notional equals legacy's `P·Q` exactly" holds only when every derived price is two-place money. A money question: for the owner.
* **Unmatched protective attempts do not stop at the close.** The plan said to stop if they continue past 15:30 IST. They do: with legacy holding to the end (synthetic), the shadow's square-off close at 15:13 IST is unmatched and is retried under a **new** key (`prot:<position>:close:<n>`) at every scheduled pass, 141 attempts through 15:59:47 IST, after `SESSION_CLOSED`. The plan assumed one key resubmitted (S5-3). The comparison links them to the first (one cause); `test_unmatched_protective_attempts_stop_at_the_close` is `xfail(strict)` as the record.
* **Funds missing gives `PRT-R06`, not `ADM-R05`.** With every cycle dropped, the loss latch cannot be judged and the kernel refuses `PRT-R06 check_inert` (`kernel/safety.py:644`); the plan expected `ADM-R05`.
* **The shadow's calendar fact.** The kernel's sessions read the trading day from the market store's `reference` stream; legacy's market copy has none. The tests record it in the shadow store (labelled synthetic). Step 6 needs a source (open).
* **Entrypoints.** `COMPOSITIONS["shadow"]` names `at-shadow-copier` and `at-shadow`; the wheel declares neither yet, so the shipped manifest reports both missing until step 6 adds them (with a `main` for the driver).

**Tests run (Windows, affected only):** `tests/contracts`, `tests/recovery`, `tests/integration/test_kernel_host.py`, `tests/integration/test_shared_engine.py`, the new shadow-day file, `tests/unit/test_legacy_market.py`, `tests/unit/test_settings_resolver.py`. Run 1: 845 passed, 47 failed, 6 errors, 10 skipped, 1 xfailed. 45 failures and the 6 errors were `OSError: [Errno 28] No space left on device` (the C: drive filled, not from this tree: its pytest and scratch directories held under 1.5 GB). Two were real and fixed: the responder called `str.replace`, which the reach test bans by name (`aware` now slices), and `test_legacy_copier.py::test_settings_fields` pinned the shadow root's old scope. A test also left `-wal`/`-shm` files beside step 2's Tier-1 ledger fixture; the rehearsal now copies the fixture first, and the two empty files were removed. Run 2 (the same set, `--basetemp` under the scratchpad): 899 passed, 10 skipped, 1 xfailed (the protective-attempts finding), 0 failed. The funds test added after the break checks was run on its own: 1 passed. `ast.parse` passes on every edited Python file.

**Break checks** (script `break_part2.py` in the session scratchpad, on a scratch copy of the tree, each file restored and its md5 confirmed):

| Break | Failed |
|---|---|
| 1. Import `socket` in the responder | `test_shadow_modules_reach` |
| 3. Build the kernel's settings with the effective `ledger.path` | `test_shadow_never_opens_the_production_ledger` |
| 5. Answer an unmatched entry `rejected` | `test_shadow_day_unmatched_entry_is_not_sent_once` |
| 6. Answer an unmatched entry `acknowledged` | `test_shadow_day_unmatched_entry_is_not_sent_once` |
| 7. Match an entry without the bar | `test_shadow_day_matches_only_the_same_bar` |
| 8. Wait inside `send` (the clock moved) | `test_shadow_day_worker_never_waits` |
| 9. Step past the settled horizon | `test_late_line_waits_for_its_pass` |
| 10. Leave legacy-only orders out of the books | `test_shadow_day_matched_unmatched_foreign` |
| 12. Fill IDs that change on reread | `test_shadow_day_matched_unmatched_foreign` (a second FILL) |
| 13. Stamp market records with the read time | `test_mapping_keeps_legacy_stamps` |
| 15. Order lines by `at` as text | `test_books_at_the_clock_and_ist_day` |
| 19. Pair the latest cursor line unchecked | `test_comparison_refuses_unpaired_heads` |
| 20. Count a consequence as its own defect | `test_one_cause_links_by_subject` |
| 21. Report every attempt of an unmatched protective action | `test_comparison_of_a_matched_day` |
| 23. Read past the whole members | `test_whole_members_only_from_the_cursor` |
| 26. `KillInputs.resolve` over production's paths | `test_kill_input_follows_the_settled_pass` |
| 27. Judge the copied `KILL` at wall time | `test_kill_after_the_decision_does_not_refuse_it` |
| 28. Also take a close's fills from the entry's close fields | `test_close_command_fills_from_its_own_row` |
| 29. Pair on every file `B` pins | `test_pairing_checks_only_the_driver_files` |
| New: funds outside production's money rule | `test_funds_follow_productions_money_rule` (the first run did not bite with `test_shadow_day_matched_unmatched_foreign`; the test was added and the break rerun) |
| New: a fill price that is not ledger money | `test_four_place_average_is_not_ledger_money` |
| New: the pin without `prefixes` | `test_pin_holds_every_decision_and_market_prefix` |
| New: a transient row checked for an enabled unit | `test_validate_shadow_composition` |

Not run, with the reason: 25 (one observation cycle per stamp; the synthetic budget is never reached, so it cannot bite here), 30 (the comparison reads only `plans/1`; no path from `decisions/1` exists to break), 31 (no channel is composable through `compose_shadow`; the no-socket stand-in covers it). Breaks 2, 4, 11, 14, 16–18, 22, 24 and 32–34 ran in part 1.

**End-to-end, one fixture day** (`test_comparison_of_a_matched_day`): the matched synthetic day 2026-11-04 (one `scripted_rule` entry, 75 of `NIFTY26N0424000CE` at 100.00, filled; legacy-only order `B-9`), copied by the real copier in 14 passes, driven to 16:00 IST, rehearsed into `rehearsal/2026-11-04/ledger.db` and compared: `| 2026-11-04 | B 13 | H 602 | defects 1 (+140 linked) | migrations 0 | not clean |`. The plan, fill (`legacy:B-1:75` at 100.00), position and foreign order agree; the one defect is the shadow's 15:13 IST square-off close that synthetic legacy never sent, its 140 later attempts linked to it; not clean because three rows are not compared.

**Continuation:** the three rows not compared; a source for the shadow's calendar fact; the two console entrypoints and the driver's `main` (step 6); and the four findings above, which wait on the owner or the coordinator.

### Fixes after step 5 (2026-11-12)

Three commits on `slice-08` in OA_NEW, on top of `f3fe443`, one per fix: `bd8be0c` (margin), `78650d3` (protective attempts at the close), `5dfdd67` (entrypoints). Not pushed, not merged.

1. **Margin when OpenAlgo reports none** (owner, 2026-11-05, "Margin limit when OpenAlgo reports none"). `capacity_check` (`kernel/admission.py`) takes the funds' `available` as the margin limit when `margin_available` is `None`; a position row or open order with no `amount` or `margin`, and a complete empty book with no aggregate margin, count zero. A value that is present but malformed or negative still refuses, and the identity rule and "an empty book is flat only when complete" are unchanged. `openalgo_books._funds` reads a `margins` field when OpenAlgo sends one (legacy's key; no capture carries it), refusing the read when it is not exact money. `LegacyBooks.MARGINS` is removed: the shadow's funds are production-shaped (`ObservedFunds(available, None, None, None)`). Tests: `test_capacity_admits_within_cash_without_margins` (100000.00 against the 7500.00 entry: admitted, acknowledged) and `test_capacity_refuses_beyond_cash_without_margins` (5000.00: `ADM-R09 amount`, never sent) replace `test_capacity_refuses_without_margins`; `test_no_margin_figure_uses_available_cash`, `test_absent_amounts_count_zero_as_on_legacys_path`, `test_funds_margins_field_is_read_when_sent`.
   * **Fork call (capacity, external commitments).** Legacy's reservation path builds its only `AccountSnapshot` from the checkpoint's funds with no commitments (`src/runtime/ai_management/advice_orchestration.py:80-104` @445eb116), so `_external_commitments` (`src/core/framework/execution/reservations.py:473-497`) adds only the dataclass defaults, 0.0 (`:44-62`), and a row's missing margin is `0.0` (`:490`); `reserve` judges margin against `margin_available` (`:432-434`), which is `funds.get("margins", available)` (`advice_orchestration.py:85`). `src/runtime/execution_gateway/structures.py:168-191` only validates that snapshot and adds no commitment. The target matches that for absent values only: a row with an amount still counts it, as before.
   * **Still refuses in production** (found here; settled by item 4). `openalgo_books` reports every book `Coverage("unknown")`, and an empty book was flat only when complete, so an entry on a flat account was refused `ADM-R09 observation_field_missing` on production's OpenAlgo books.
4. **A successful empty book is flat** (commit `e7fcf25`; the coordinator, under the owner's standing fork rule, "Standing rules (2026-10-30)": money keeps legacy's live behaviour). `external_commitments` refuses an empty book only when its coverage is `no` (the read is known to have left rows out); an empty book of `unknown` coverage, as every successful OpenAlgo read is, counts flat and adds its aggregate margin, or zero. The kernel holds a book only from a successful read: a failed or false-success read raises `ReadFailed` in `openalgo_books` (`status` not `success`, `data.orders` or `data` not a list, PART 26's funds guard), the cycle is dropped and entries refuse on the stale book. Nothing else changed: reconciliation's absence routes and `_owned` still read coverage as before. Tests: `test_success_empty_book_is_flat`, `test_success_empty_books_admit_within_cash` (adapter-shaped: both books `success` and empty, funds 1000.00, no margin figure: 1000.00 admitted, 1000.01 refused `amount`), `test_a_failed_book_read_gives_no_flat_book` (six failed or false-success bodies); `test_missing_or_malformed_field_refuses` now refuses a `no` empty book.
   * **Fork call (capacity, empty books).** Legacy reads the broker books in its live loop through `rows` (`scripts/run_framework_live.py:335-350` @445eb116): a payload whose `status` is `success` and whose `data` (`data.orders` for the orderbook) is a list of objects is accepted, an empty list included; anything else raises and the snapshot fails (`:353-354`). `_orderbook_rows` takes the same envelope as "a successful, complete OpenAlgo orderbook" (`:5762-5777`), and `_historical_positionbook` indexes an empty positionbook as an empty, complete snapshot (`:1993-2010`). On the reservation path an empty commitment list adds only the 0.0 defaults (`src/core/framework/execution/reservations.py:491-496`). So a successful empty read is flat in legacy, with no coverage notion; the target matches it and keeps refusing a book it knows to be partial (`no`, produced only by a tradebook's dropped rows today), which legacy has no case for.
   * **Break checks** (`break_empty.py`, same routine): 5 of 5 caught after one test gained cases. (E1) the old "flat only when complete" rule: `test_success_empty_book_is_flat`; (E2) a `no` empty book counted flat: `test_missing_or_malformed_field_refuses`; (E3) a false-success orderbook read as empty, (E4) the same for the positionbook, (E5) a non-`success` status accepted: `test_a_failed_book_read_gives_no_flat_book`. E5 first passed (the error bodies also lacked `data`); two cases with a failed status and a well-formed empty list were added, and the rerun bit.
   * **Tests:** the targeted set (`tests/contracts`, `tests/recovery`, the admission, observation-loop, protection, safety, identity, conflict, grant and strategy-invocation unit files, and the OpenAlgo, shadow-day, entry, dispatch, shared-engine, supervisor, verb, reconciliation and kernel-host integration files) twice: 1640 passed, 8 skipped, 0 failed each run.
2. **Protective attempts at the close.** *Double-close check:* no risk found. Every key-minting site in `kernel/protection.py` (`_stop_requests`, `_basket_leg`, `_exit_sequence`, `_basket_exit`) first returns while any command of the leg is `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING` (`_PENDING`, `_pending`, `basket_state`'s PENDING row), resubmits a `NOT_SENT` attempt under its own key (`_retry`), and never mints after a `REJECTED` or `COMPLETED` close (escalated instead). A new key follows only a `REFUSED` command, reached only from `ADMITTED` (`lifecycle.COMMAND_TRANSITIONS`), whose attempts were `NOT_SENT` or resolved never-reached. The one residual is evidence, not minting: a never-reached resolution later contradicted by the broker (`blocked_commands`). *The fix:* `ProtectionLoop.run_once` evaluates no subject whose account has a `CLOSED` session and none `OPEN` (`_after_close`), so no new key and no retry follow `SESSION_CLOSED`. On the fixture day the unmatched square-off is now tried 51 times through 15:29:47 IST, none after (`| B 13 | H 243 | defects 1 (+50 linked) |`, was `H 602`, `+140`). `test_unmatched_protective_attempts_stop_at_the_close` passes (xfail removed); `test_no_attempt_after_the_close` (five session-state cases).
   * **Legacy, cited.** Legacy's session-close exit retries a refusal that never reached the broker under a new attempt number on a later pass (`src/runtime/session_close.py:24-31`, `:162-175`, `:225-236` @445eb116), so a new key per refused attempt matches legacy. It runs once per live pass (`scripts/run_framework_live.py:3738-3751`), and the live loop breaks once the IST clock reaches `stop_at` (`:8284-8286`), the configured market close (`_stop_at`, `:7417-7430`): no attempt after the close; the broker's square-off is the backstop (`session_close.py:21-22`). The target stops at its own `SESSION_CLOSED` (the session's `close_time`), the same instant on NSE. **Fork call:** the target judges "after the close" by its ledger's session state rather than a process ending; a later day's open session resumes protection, which legacy's next day's process also did.
3. **The shadow's entrypoints.** `pyproject.toml` declares `at-shadow-copier = autonomous_trading.adapters.legacy_copier:console_main` (the copier's `main`, a `CopierRefused` printed with exit 2, never a traceback) and `at-shadow = autonomous_trading.operations.shadow_run:main` (refuses before opening anything: the kernel's settings, `MIG-R10`/`MIG-R12` through `shadow_preflight`, the two waits, each exit 1; `--day` not a date, exit 64). With every setting bound it exits `EXIT_NO_LOOP` (78) saying the driver's production wiring is step 6's: the market loop, the strategy host and the converted binding are not composed by a `main` yet. Neither holds a key or sends. `test_shadow_entrypoints_declared_and_refuse_cleanly` (sockets refused); `test_installed_artifact.py` expects the ten commands. The editable install in `.venv-slice01` was reinstalled (`pip install -e . --no-deps`); `importlib.metadata` lists `at-shadow` and `at-shadow-copier`.

**Label only.** "Funds missing gives `PRT-R06`": the plan's text at the funds bullet (S5-6) and the tests table now say `PRT-R06` `check_inert`, as the code answers. Q-029's approved-difference row still says `ADM-R05`; it is an owner-approved row, so it is not edited here (open: does the approval cover `PRT-R06`?). **Closed 2026-11-14 (owner): void.** The approved-difference list served only the comparison with live legacy, which is void with the server (step 6); no code change. Either code refuses new entries while broker data is missing.

**Tests (Windows, OA_NEW, targeted):** `tests/contracts`, `tests/recovery`, the unit files for admission, protection (loop, basket, states), safety, command identity, conflicts, grants, strategy invocation, legacy market, secret references and the settings resolver, and the integration files for OpenAlgo, the shadow day, entry outcomes, dispatch revalidation, the shared engine, the supervisor, verb completion, reconciliation commits, the review producer, operator routes, the unix channel and the kernel host. Run 1: 1734 passed, 18 skipped, 0 failed. Run 2: 1734 passed, 18 skipped, 0 failed. After the break checks, the entrypoint test was tightened (break 13) and `tests/contracts/test_capabilities.py` rerun: 162 passed, 3 skipped. `ast.parse` passes on every edited Python file; `pyproject.toml` parses.

**Break checks** (`break_fixes.py` in the session scratchpad, in place, one at a time, each file restored and its md5 confirmed): 13 of 13 caught after one test was tightened. (1) no cash fallback: `test_no_margin_figure_uses_available_cash`; (2) a row with no amount refuses, (3) a row with no margin refuses, (4) an empty book with no aggregate margin refuses: `test_absent_amounts_count_zero_as_on_legacys_path`; (5) an empty book of unknown coverage counted flat: `test_missing_or_malformed_field_refuses`; (6) the cash term dropped: `test_capacity_refuses_beyond_cash_without_margins`; (7) the adapter ignores `margins`: `test_funds_margins_field_is_read_when_sent`; (8) a malformed `margins` read as absent: `test_a_read_that_cannot_be_mapped_exactly_fails`; (9) protection attempts after the close: `test_unmatched_protective_attempts_stop_at_the_close`; (10) an earlier closed session halts a later open one: `test_no_attempt_after_the_close`; (11) `at-shadow` undeclared, (12) the copier lets a refusal escape, (13) `at-shadow` skips the preflight: `test_shadow_entrypoints_declared_and_refuse_cleanly`. Break 13 first passed (the unset waits also exit 1); the test now requires the `MIG-R12` refusal, and the rerun bit.

**Open (owner):** the two Fork calls above for review; ~~whether Q-029's approved row covers `PRT-R06`~~ (void 2026-11-14, see above); ~~the fill rule's four-place averages~~ (closed 2026-11-14: void for the shadow; live keeps the two-place rule, watched in SLICE-15 step 7) and the calendar fact (unchanged from part 2).

## Step 6 — the shadow on production (outline; pre-approved)

**Void (2026-11-13, server lost; see SLICE-15).** No legacy is left to shadow; SLICE-15 step 4 replays the recorded days over a fake OpenAlgo instead.

Deepened after step 5 is built. Class D under the standing rules: it reads production observations into separate copies and ledgers, holds no credential and opens no broker socket.

* **Does:** installs the candidate wheel with its lock into a virtual environment under `paths.shadow.root` (isolated work, not a deploy: no unit file, no `current` link, nothing of legacy touched); runs the copier, the shadow market process, the BuyerEdge host and the kernel as transient units through `scripts/isolated_work.py` in `at.slice`; after each close, copies legacy's ledger once by the backup API, runs the import rehearsal into a separate rehearsal ledger, and runs `compare_parity.py shadow`; records each day in `docs/migration.md`.
* **Measures** on the first night the backup-API read's effect on legacy's commit latency and WAL (A03-F4), and the copier's I/O, for `shadow.copy_interval_secs` (refusing until measured).
* **Stops** at any sign of interference with legacy (a legacy commit slower than its recorded baseline, a lock wait): the shadow's units are stopped and the finding recorded; legacy is never touched.
* **Produces:** PRF-MIG-12. Defects found are fixed in the slice that owns the behaviour, then the comparison is re-run on the stored copies. The record lists the clean end-to-end days for the owner (one or two are enough, by the owner's answer); no code counts them.

## Step 7 — the supervisor against the shadow ledger (outline; owner's word when a key holder starts)

**Void (2026-11-13, server lost; see SLICE-15).** PRF-OPS-09 runs against the real ledger in the `analyze` sessions on the new server (SLICE-15 step 7).

Deepened when step 6 runs cleanly: the runtime spec's PRF-OPS-09.

* **Needs:** the observation route on the production host. If TASK-S07-06 proved a native read-only credential, the supervisor uses it; the owner creates that credential, so the step waits for the owner either way. If the route is the mediator (`at-observer`), starting it puts the account's broad key in a new production process, which is a deploy under the standing rules: **asked first**. The owner installs the account's current key as its credential; it is stopped and re-keyed at the cutover's `CREDENTIAL_ROTATED` (SLICE-14), when that key stops working, and stopped when the owner withdraws the word.
* **Does:** runs the supervisor read-only against the shadow ledger for whole sessions, within `observation.max_requests_per_minute` less legacy's measured load (TASK-S11-07); compares its assessments and protection classifications with OpenAlgo's books; every difference explained.
* **Produces:** PRF-OPS-09. The cutover's `CUTOVER_STAGED` requires this record (`README.md:1187`, `:1256`), so the cutover waits for this step.

## Completion conditions

* PRF-MIG-06, PRF-MIG-07, PRF-MIG-09, PRF-MIG-10, PRF-MIG-11 (both halves) and PRF-LED-06 pass; the copier's dry start on the EC2 records every lockdown property enforced; PRF-MIG-08's decision is recorded and `001_initial.sql` is confirmed or replaced.
* PRF-MIG-12's record holds the shadow days run so far, each with its report and every defect either fixed and re-compared or open with its owner named.
* PRF-OPS-09 is recorded, or recorded as waiting for the owner's word.
* The spec and this file record each step "as built", with every Deviation.
