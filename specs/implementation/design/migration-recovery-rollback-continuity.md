# Migration, recovery, rollback and continuity (stub)

* **Status:** proposed **stub**. Full depth is written when SLICE-11 (release and restore) and SLICE-13/SLICE-14 (shadow and cutover) start (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `operations/deployment.py`, `backup.py`, `restore.py`, `adapters/compatibility.py`, `scripts/migrate_legacy.py`, `compare_parity.py`, `verify_recovery.py`, `check_release.py`.
* **Master anchors:** ATA-03 (`README.md:456`), Phase 7 text (`:1203`), A04-F3…F5 (`:796`, `:897`), D10 (`:1201`), AUD-05 / A02-F5 / A04-F4 (`:1195`), A10-F3 (`:1192`), Combined-F3 (`:1197`), Combined-F6 (`:909`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-MIG-001 | Initial legacy-to-target migration only at a naturally flat, freshly reconciled scope (no open positions, working orders or unresolved effects); never flatten to create it; defer when not established | ATA-03 (`README.md:456`); POL-001 |
| REQ-MIG-002 | After the target's first broker-changing attempt, the old route is permanently retired; rollback is target-to-target only | ATA-03 (`README.md:456`, `:1203`) |
| REQ-MIG-003 | No pre-cutover slice writes to legacy stores; JSONL becomes a generated projection with a versioned format and a named consumer list | `README.md:1184`; A10-F3 (`:1192`); brainstorm |
| REQ-MIG-004 | History import pins source boundaries and digests and accounts for 100 % of source records (transferred, rejected or quarantined); unknown authoritative records block dependent activation | A02-F5 / A04-F4 (`README.md:1195`) |
| REQ-MIG-005 | Upgrade-versus-import is decided from compared evidence and the reason is recorded; initial open-obligation import is excluded | AUD-05 (`README.md:1195`); [X-002](../consistency/master-contradictions.md#x-002) |
| REQ-MIG-006 | Recovery set manifest covers the ledger boundary, required evidence objects, compatible artifacts and custody continuity; restore grants no activation | A04-F5 (`README.md:796`) |
| REQ-MIG-007 | Clean-host restore rehearsal with the exact candidate artifact and schema before Phase 7 activation | D10 (`README.md:1201`) |
| REQ-MIG-008 | Outstanding obligations keep executable continuity across target release and session transitions | Combined-F6 (`README.md:909`); REQ-PRT-014 |
| REQ-MIG-009 | Nightly backup after close, including OpenAlgo's volume; a mid-session loss appends a recovery-gap record and rebuilds that session from broker evidence, labelled rebuilt | POL-047 |
| REQ-MIG-010 | Compatibility readers for retained history; no older live internal protocol | Combined-F3 (`README.md:1197`) |

## What early slices need now

Nothing beyond the rule REQ-MIG-003: SLICE-01…SLICE-12 never open or write a legacy store.

## Reuse rows and divergences

* Backup/release/restore: **reuse/prove** (`README.md:1159`).
* Gateway/JSONL registry: **refactor ownership; compatibility projection** (`README.md:1146`).

## Open items

* Backup destination (POL-O01).
* RTO and failover authority (POL-047).
* First-release scope for the real rehearsal and cutover ([Q-005](../decisions/owner-questions.md#q-005)).

## To specify at SLICE-11/13/14

Recovery manifest format; restore verification state machine; the upgrade-versus-import comparison method (TASK-S13-01); importer accounting tables; shadow comparison set (`README.md:1199`); the cutover checklist and old-route retirement marker; proofs from `README.md:1232`, `:1242`, `:1253`, `:1255`.
