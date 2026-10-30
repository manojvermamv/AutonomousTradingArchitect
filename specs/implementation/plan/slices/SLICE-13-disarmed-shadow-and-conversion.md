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
* **Integration edits outside this file and the spec,** made when each step is reviewed: the [ledger spec](../../design/ledger-and-atomic-transaction.md) event catalogue and `resources/events.schema.json` (`IMPORT_BOUNDARY_PINNED`, `LEGACY_RECORD_IMPORTED`, `LEGACY_RECORD_REJECTED`, `LEGACY_RECORD_QUARANTINED`, `IMPORT_COMPLETED`; the `import_manifest` row now specified); the [configuration spec](../../design/configuration-artifacts-release.md) composition table (`shadow`, the migration composition); the [runtime spec](../../design/runtime-isolation-observability-deployment.md) storage-class table (a derived class for `paths.compat` and the shadow root); the module index (tree deltas T-90…T-95); the traceability rows for REQ-MIG-011…013 and every REQ-MIG proof; the delivery plan's SLICE-13 row and task rows.

## Steps

| Step | Builds | Class | Proofs |
|---|---|---|---|
| 1 | The legacy readers in `adapters/compatibility.py`; synthetic legacy fixtures generated once from legacy's own writers at 445eb116 (T-93) by a generator run against a legacy checkout, never in the suite (T-94); the characterization of what legacy's registry lines record about fills | S | PRF-MIG-06 |
| 2 | The copier with its lockdown (a command run through `scripts/isolated_work.py`, refusing to start when any property is unenforced); the upgrade-versus-import comparison: the mapping table over the fixtures and over a backup-API copy of the production legacy ledger that the copier takes, the criteria results, the decision in `docs/decisions.md`, `001_initial.sql` confirmed or replaced | S → D (pre-approved copy) | PRF-MIG-08, PRF-MIG-11 (copier rows) |
| 3 | `scripts/migrate_legacy.py` for the chosen route: the migration composition in `bootstrap.py`, the boundary pin, the per-record events, `008_import.sql` (T-91) and its fold into D04, batches, resume, anomalies, same-boundary validation | S | PRF-MIG-07 |
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

## Step 1 — legacy readers and fixtures (outline)

Deepened just before it is built: the migration spec's [legacy readers](../../design/migration-recovery-rollback-continuity.md#legacy-readers-adapterscompatibilitypy).

* **Builds:** one reader per row of the spec's table, each returning legacy's record shape (source, file, line, offset, raw bytes, digest, parsed value or error, chain verdict); `tier1_ledger/1` reads a backup-API copy, never the live file.
* **Fixtures (T-93):** small synthetic legacy stores written by legacy's own writers at 445eb116 (`registry.open_order` and its transitions, reservations, holds, the kill file, the latch, a Tier-1 ledger through legacy's `Ledger`), including torn trailing lines, a broken chain, an unknown kind and a changed line. The generator (T-94) runs once against a legacy checkout in an isolated directory, as SLICE-04's and SLICE-06's golden generators do; the suite never imports legacy code (A08-F4).
* **Characterization (TASK-S13-04):** whether registry lines carry each fill's quantity and price, read from legacy's writers; recorded in the step's "as built" for the responder (step 5).
* **Test file:** `tests/contracts/test_legacy_schemas.py`.

## Step 2 — upgrade or import (outline)

Deepened after step 1 is built: the migration spec's [upgrade or import](../../design/migration-recovery-rollback-continuity.md#upgrade-or-import-task-s13-01).

* **Builds the copier first:** the lockdown of the migration spec's [copier's lockdown](../../design/migration-recovery-rollback-continuity.md#the-copiers-lockdown); proved by PRF-MIG-11's copier rows on Linux with systemd (a stand-in user and a stand-in process carrying a fake key), and on the EC2 by a dry start that records each property enforced before any production copy; the EC2's systemd version decides between `PrivatePIDs=yes` and the `/proc` fallback.
* **Does:** builds the mapping table (each legacy table, event kind and store row to a target event, a reader, or "evidence only"); measures each criterion for both routes on the fixtures; repeats the kind census on a backup-API copy of the production legacy ledger, taken after the close by the copier into the shadow root (pre-approved read-only copy of a trading store; the copy is read, never written); records the decision, the mapping and the reason in `docs/decisions.md`; confirms or replaces `001_initial.sql` ([X-002](../../consistency/master-contradictions.md#x-002)). If replaced, the replacement migration and the re-run of every built slice's tests land in this step.
* **Produces:** PRF-MIG-08. The owner sees the record with the cutover request (SLICE-14).

## Step 3 — the importer (outline)

Deepened after step 2 is built: the migration spec's [history import](../../design/migration-recovery-rollback-continuity.md#history-import-scriptsmigrate_legacypy).

* **Builds:** `scripts/migrate_legacy.py` with `pin` and `follow` boundaries; the migration composition (a writer with principal `migration:<run>`, no coordinator, refusing a ledger that holds a `DISPATCH_CLAIMED`); the five import events; `008_import.sql` (T-91) and `import_manifest` folded from the events so D04 checks it; the identity map for legacy broker order IDs; the same-boundary validation against independent expectations.
* **Crash points** CP-I1 and CP-I2 by killing the import process.
* **Test file:** `tests/contracts/test_legacy_schemas.py` (the accounting rows); `tests/recovery/test_crash_boundaries.py` gains CP-I1 and CP-I2.

## Step 4 — the `orders/1` projection (outline)

Deepened after step 1 is built: the migration spec's [compatibility projections](../../design/migration-recovery-rollback-continuity.md#compatibility-projections-adapterscompatibilitypy) and the ledger spec's CP-L4.

* **Builds:** the serializer with the fixed state mapping to legacy's vocabulary; the projector hook in `kernel/ledger/export.py` (a ledger-spec module change, listed in the step's files); `compat_projection` set to `fresh` or `repair_scheduled` on the outcome; the sidecar and rebuild on the host's next pass; the consumer list in `docs/migration.md`; the import guard.
* **Test files:** `tests/contracts/test_legacy_schemas.py` (PRF-MIG-09, against step 1's golden lines); `tests/recovery/test_crash_boundaries.py` (PRF-LED-06, CP-L4).

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
