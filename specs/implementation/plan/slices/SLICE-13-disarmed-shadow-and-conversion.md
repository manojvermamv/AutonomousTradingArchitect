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
* **Integration edits outside this file and the spec,** made when each step is reviewed: the [ledger spec](../../design/ledger-and-atomic-transaction.md) event catalogue and `resources/events.schema.json` (`IMPORT_BOUNDARY_PINNED`, `LEGACY_RECORD_IMPORTED`, `LEGACY_RECORD_REJECTED`, `LEGACY_RECORD_QUARANTINED`, `IMPORT_COMPLETED`; the `import_manifest` row now specified); the [configuration spec](../../design/configuration-artifacts-release.md) composition table (`shadow`, the migration composition); the [runtime spec](../../design/runtime-isolation-observability-deployment.md) storage-class table (a derived class for `paths.compat` and the shadow root); the module index (tree deltas T-90…T-95 and T-99…T-102); the traceability rows for REQ-MIG-011…013 and every REQ-MIG proof; the delivery plan's SLICE-13 row and task rows.

## Steps

| Step | Builds | Class | Proofs |
|---|---|---|---|
| 1 | The legacy readers in `adapters/compatibility.py`; synthetic legacy fixtures generated once from legacy's own writers at 445eb116 (T-93) by a generator run against a legacy checkout, never in the suite (T-94); the characterization of what legacy's registry lines record about fills | S | PRF-MIG-06 |
| 2 | The copier with its lockdown (a command run through `scripts/isolated_work.py`, refusing to start when any property is unenforced); the upgrade-versus-import comparison: the mapping table over the fixtures and over a backup-API copy of the production legacy ledger that the copier takes, the criteria results, the decision in `docs/decisions.md`, `001_initial.sql` confirmed or replaced | S → D (pre-approved copy) | PRF-MIG-08, PRF-MIG-11 (copier rows) |
| 3 | `scripts/migrate_legacy.py` for the chosen route: the migration composition in `bootstrap.py`, the boundary pin, the per-record events, `010_import.sql` (T-91; 009 is taken by SLICE-12) and its fold into D04, batches, resume, anomalies, same-boundary validation | S | PRF-MIG-07 |
| 4 | The `orders/1` projection: its serializer in `adapters/compatibility.py`, the projector hook and `compat_projection` freshness in `kernel/ledger/export.py`, the sidecar and its rebuild, the consumer list in `docs/migration.md`, the import guard | S | PRF-MIG-09, PRF-LED-06 |
| 5 | `compose_shadow` and `COMPOSITIONS["shadow"]` (`bootstrap.py`); `LegacyMarketSource` and `LegacyOutcomeResponder` (`adapters/compatibility.py`); `scripts/compare_parity.py shadow` with the head pair, the comparison set and the owner-only approved-difference table | S | PRF-MIG-10, PRF-MIG-11 (composition rows) |
| 6 | The shadow on the production host: the candidate wheel under `paths.shadow.root`, the copier and the shadow processes as transient units through `scripts/isolated_work.py`, the nightly import rehearsal, the daily comparison reports, the first night's measurement of the copy's effect on legacy's commits | D (pre-approved) | PRF-MIG-12 |
| 7 | The supervisor against the shadow ledger, reading the broker only through the observation route, within the read budget left after legacy's own load | D; **owner's word** when the route starts a key holder | PRF-OPS-09 |

**Why this order.** Every later step reads legacy's formats through step 1's readers, and the fixtures are the only legacy data the suite may use (A08-F4). The importer's handling of legacy's ledger depends on the route, so the comparison (step 2) comes before the importer (step 3); the readers and the mapping table are what the comparison measures, and its production census needs a copy of legacy's ledger, so the copier is built and proved in step 2, before its first production use, and reused unchanged by steps 5 and 6. The projection (step 4) is independent of the shadow but the shadow's kernel writes it, so it comes before step 5. Steps 6 and 7 run what steps 1–5 built, on production copies. Step 4 may be built in parallel with step 3 by a second agent owning `kernel/ledger/export.py` and the serializer only.

## Fork calls

None. The shadow holds no key and its responder cannot send (PRF-MIG-11); the projection feeds no decision (PRF-MIG-09's import guard); the importer never creates a target command, reservation or position. The comparison's approved differences are the owner's existing answers, each already recorded where it was decided; this slice adds none.

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

The authorities are the migration spec's [compatibility projections](../../design/migration-recovery-rollback-continuity.md#compatibility-projections-adapterscompatibilitypy), the ledger spec's REQ-LED-006 and CP-L4, PRF-MIG-09 and PRF-LED-06. Step 4 is TASK-S13-03. Legacy citations are at 445eb116; target citations are at the step 3 commit on `slice-13`.

**It stops for review before building, because it touches money facts and the send path.** Two of its parts decide what a money record says: the projected lines carry fill quantities and prices (`filled_qty`, `price`, `closed_qty`, `close_price`) that legacy's P&L monitor and cost reconciliation read (`monitoring/account_pnl_service.py:33`, `:88`; `scripts/reconcile_costs.py:56`), so their meaning must stay legacy's exactly; and `compat_projection` is a field of the dispatch `Outcome` (`contracts/execution.py:313-330`), set on the send path after the outcome commit, where a mistake could be read as a reason to resend. Neither changes a score, threshold or entry gate, but both are money-adjacent, so the plan is reviewed first.

**In plain words.** After each order outcome is saved, the new system writes the same order lines the old system wrote, in the old file format, into a separate folder, so the old reports and research tools keep working. The lines are generated from the new ledger, so they can always be rebuilt. If writing them fails, the order outcome says "projection needs repair" and the next pass rebuilds them; it never sends anything again.

### Decisions

#### The serializer (`adapters/compatibility.py`, `orders_lines(events) -> list[bytes]`)

* **One line per target command transition**, in legacy's registry line shape (`src/core/framework/execution/registry.py:186-275`): the fields of the spec (`at`, `our_order_id` = `<strategy>:<command_key>#<attempt_no>`, `owner`, `decision_id`, `broker_order_id`, `state`, `symbol`, `exchange`, `action`, `quantity`, `attempt`, `day`) plus `projection: {format: "orders/1", source_sequence, source_hash}`, canonical JSON, one `\n` per line. `day` is `CALENDARS["nse-fo/v1"].exchange_date` of the event's `event_time` (IST); `at` is that instant rendered in IST with offset, legacy's form (`registry.py:111`, `:202`).
* **The state mapping, for review** (target attempt and command states, `kernel/lifecycle.py`, to legacy's machine, `src/core/framework/execution/states.py:27-59`):

  | Target event | Legacy `state` | Note |
  |---|---|---|
  | `COMMAND_ADMITTED` | `formed` | `open_order` |
  | `DISPATCH_CLAIMED` | `sent` | `mark_sent`, written before the request leaves in legacy; after the commit here (slice Deviation) |
  | `OUTCOME_ACKNOWLEDGED` | `ack` | with `broker_order_id` |
  | `OUTCOME_REJECTED` | `rejected` | |
  | `OUTCOME_NOT_SENT`, `DISPATCH_REFUSED`, `ADMISSION_REFUSED` | none | legacy never wrote a line for a request that did not leave; **no line** |
  | `OUTCOME_AMBIGUOUS` | `unknown` | `mark_unknown` |
  | `FILL` (cumulative below quantity) | `partial` | `filled_qty` cumulative, `price` the quantity-weighted average rounded to 4 places, as the settle pass writes (`scripts/run_framework_live.py:6072-6119`) |
  | `FILL` (cumulative equal to quantity) | `filled` | same fields |
  | `RESOLVED_NEVER_REACHED` | `cancelled` | **for review**: legacy's nearest is `cancelled`; `rejected` is the alternative |
  | `RESOLVED_REACHED` | none | the fills that follow carry the state |
  | `COMPLETED` | `completed` | |

  A close or modify is its own row with its own `our_order_id`, as legacy writes a lifecycle order (`run_framework_live.py:6128-6161`). A protective leg's fill is projected on the entry's line as `closed_qty`, `close_price`, `close_broker_order_id`, `close_fill_id` (`registry.py:601-757`). A structure leg's fill carries `filled_qty` only, no price (`src/runtime/execution_gateway/structures.py:298-316`). Each of these follows step 1's characterization exactly; any field legacy derives that the target cannot derive is omitted, never invented, and listed.
* **Money values.** The target's money strings (`money` fields, two decimals) are written as legacy's floats for `price` and `close_price`, rounded to 4 places as legacy rounds; quantities as integers. This is a representation change only, listed as a **Deviation** for review (legacy wrote floats computed from floats; the target computes the same average from exact decimals, which can differ in the 4th place).

#### The projector (`kernel/ledger/export.py`)

* `CompatProjector(paths_compat, serializer)` with `refresh(reader) -> "fresh" | "repair_scheduled"`: reads the events after its sidecar `paths.compat/.orders-1.json` (`{"sequence", "event_hash"}`), checks the sidecar's event hash still matches the ledger (else rebuilds every file from sequence 1), appends the new lines to `paths.compat/orders/<day>.jsonl`, flushes, and moves the sidecar after the append (temporary file and rename). No fsync: rebuildable at any time (spec). Any `OSError` returns `repair_scheduled`.
* **The send path.** `contracts.execution.Outcome.compat_projection` widens from `"none"` to `"none" | "fresh" | "repair_scheduled"` (a dispatch-contract change, ledger spec). The coordinator calls `refresh` only after the outcome commit and only when a projector is composed; the result is copied into the outcome and **read by nothing that decides a send** (a test and an import guard: no branch on `compat_projection` anywhere under `kernel/` except where the coordinator copies it into the outcome). The kernel host's next pass calls `refresh` when the last outcome said `repair_scheduled` (CP-L4).
* **Composition.** `bootstrap` composes the projector only when `paths.compat` is set (a new installer- and kernel-scoped path, derived storage class), never inside legacy's run directory (refused) and never inside a legacy root; the shadow (step 5) points it at `paths.shadow.root/compat/`. Unset: `compat_projection` stays `none`, as today.

#### The consumer list and the guard

* `docs/migration.md` gains the spec's consumer table (purpose, consumer, after cutover), naming legacy's money path as **not served**.
* **Import guard** (PRF-MIG-09): no module under `kernel/`, `strategies/` or `market/` imports `adapters.compatibility` or reads `paths.compat`, enforced by an AST test like `test_module_reach`.

### Tests

| File | Test | Proves |
|---|---|---|
| `tests/contracts/test_legacy_schemas.py` | Fold parity (PRF-MIG-09) | A synthetic target history (the simulation composition: an entry acked, two partial fills, a close; an ambiguous then reached order; a rejected order; a structure leg) projected and folded by legacy's fold rule ported in the test equals, per order, the golden state legacy's writer produced for the same history; the generator adds those golden lines (`gen_legacy_fixtures.py`, a legacy run of the same history) |
| same | Line shape | Every line names `orders/1`, its source sequence and hash; `our_order_id` has legacy's form; `day` is IST |
| same | Import guard | No decision module imports the serializer or reads `paths.compat` |
| `tests/recovery/test_crash_boundaries.py` | CP-L4 (PRF-LED-06) | Killed after the outcome commit and before the refresh: the outcome is not resent; the next refresh rebuilds lines equal to a projection from scratch; a refresh failure gives `repair_scheduled` and still no resend |
| same | Sidecar mismatch | A sidecar naming a hash the ledger does not hold rebuilds every file |

### Break checks

1. Project `OUTCOME_NOT_SENT` as `sent`: fold parity fails. 2. Average price unrounded: fold parity fails. 3. Skip the refresh after the outcome: CP-L4 fails. 4. Resend when `compat_projection` is `repair_scheduled`: CP-L4 fails. 5. Import the serializer from `kernel/`: the guard fails. 6. Trust a stale sidecar: the sidecar test fails.

### Files

* **New:** `docs/migration.md` (consumer list).
* **Changed:** `adapters/compatibility.py` (serializer; its reach test allows it to build lines but still no write: the writer is the projector); `kernel/ledger/export.py` (`CompatProjector`); `contracts/execution.py` (`compat_projection` values); `kernel/coordinator.py` and `kernel/host.py` (call and repair pass); `bootstrap.py`; `settings/schema.py`, `resources/defaults.yaml` (`paths.compat`); `scripts/gen_legacy_fixtures.py`, `golden.json`; the tests above.

### Fork calls and Deviations

* **For review:** the state mapping's `RESOLVED_NEVER_REACHED -> cancelled`; the 4-place average from exact decimals; the omitted fields.
* **Deviation (slice):** lines written after the commit, not before the send (already listed).
* No Fork call proposed: legacy's money path is not served, and no target decision reads the projection.

### Completion conditions (step 4)

The tests pass twice with the layering guards and the crash-boundary file; every break check fails a listed test and every file is restored (md5); the step is recorded "as built".

## Step 5 — the shadow composition and the comparison (outline)

Deepened after steps 3 and 4 are built: the migration spec's [disarmed shadow](../../design/migration-recovery-rollback-continuity.md#the-disarmed-shadow) and [same-head comparison](../../design/migration-recovery-rollback-continuity.md#same-head-comparison-scriptscompare_paritypy).

* **Builds:** `compose_shadow` (a configuration-spec module change, listed); `LegacyMarketSource` over `market_ndjson/1`; `LegacyOutcomeResponder` with its matching rules, pending outcomes and `not_sent` for unmatched commands; `compare_parity.py shadow --day D` with the head pair, every row of the comparison set and the legacy-gate-to-refusal-code table; the approved-difference table, written from the owner answers alone, each row with its reference, condition and expected values. A slice Deviation that changes a compared value is not a row: its differences stay defects and it is raised as an owner question.
* **Proved on synthetic legacy and shadow heads only** (fixtures from step 1, the simulation composition for the shadow side).
* **Test files:** `tests/integration/test_shared_engine.py` (PRF-MIG-10); `tests/contracts/test_capabilities.py` (PRF-MIG-11).

## Step 6 — the shadow on production (outline; pre-approved)

Deepened after step 5 is built. Class D under the standing rules: it reads production observations into separate copies and ledgers, holds no credential and opens no broker socket.

* **Does:** installs the candidate wheel with its lock into a virtual environment under `paths.shadow.root` (isolated work, not a deploy: no unit file, no `current` link, nothing of legacy touched); runs the copier, the shadow market process, the BuyerEdge host and the kernel as transient units through `scripts/isolated_work.py` in `at.slice`; after each close, copies legacy's ledger once by the backup API, runs the import rehearsal into a separate rehearsal ledger, and runs `compare_parity.py shadow`; records each day in `docs/migration.md`.
* **Measures** on the first night the backup-API read's effect on legacy's commit latency and WAL (A03-F4), and the copier's I/O, for `shadow.copy_interval_secs` (refusing until measured).
* **Stops** at any sign of interference with legacy (a legacy commit slower than its recorded baseline, a lock wait): the shadow's units are stopped and the finding recorded; legacy is never touched.
* **Produces:** PRF-MIG-12. Defects found are fixed in the slice that owns the behaviour, then the comparison is re-run on the stored copies. The record lists the clean end-to-end days for the owner (one or two are enough, by the owner's answer); no code counts them.

## Step 7 — the supervisor against the shadow ledger (outline; owner's word when a key holder starts)

Deepened when step 6 runs cleanly: the runtime spec's PRF-OPS-09.

* **Needs:** the observation route on the production host. If TASK-S07-06 proved a native read-only credential, the supervisor uses it; the owner creates that credential, so the step waits for the owner either way. If the route is the mediator (`at-observer`), starting it puts the account's broad key in a new production process, which is a deploy under the standing rules: **asked first**. The owner installs the account's current key as its credential; it is stopped and re-keyed at the cutover's `CREDENTIAL_ROTATED` (SLICE-14), when that key stops working, and stopped when the owner withdraws the word.
* **Does:** runs the supervisor read-only against the shadow ledger for whole sessions, within `observation.max_requests_per_minute` less legacy's measured load (TASK-S11-07); compares its assessments and protection classifications with OpenAlgo's books; every difference explained.
* **Produces:** PRF-OPS-09. The cutover's `CUTOVER_STAGED` requires this record (`README.md:1187`, `:1256`), so the cutover waits for this step.

## Completion conditions

* PRF-MIG-06, PRF-MIG-07, PRF-MIG-09, PRF-MIG-10, PRF-MIG-11 (both halves) and PRF-LED-06 pass; the copier's dry start on the EC2 records every lockdown property enforced; PRF-MIG-08's decision is recorded and `001_initial.sql` is confirmed or replaced.
* PRF-MIG-12's record holds the shadow days run so far, each with its report and every defect either fixed and re-compared or open with its owner named.
* PRF-OPS-09 is recorded, or recorded as waiting for the owner's word.
* The spec and this file record each step "as built", with every Deviation.
