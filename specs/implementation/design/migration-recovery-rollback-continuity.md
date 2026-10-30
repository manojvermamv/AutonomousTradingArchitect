# Migration, recovery, rollback and continuity

* **Status:** proposed (package spec), deepened on 2026-10-30 from the 46-line stub this file was, when SLICE-13 and SLICE-14 were planned; it also writes the parts SLICE-11 step 8 builds (the recovery set, backup, restore, anchors, the send-lease store adapter, the release check). Not yet reviewed by EGM; it is reviewed with the [SLICE-13](../plan/slices/SLICE-13-disarmed-shadow-and-conversion.md) and [SLICE-14](../plan/slices/SLICE-14-initial-cutover.md) slice files and with [SLICE-11](../plan/slices/SLICE-11-packaging-release-supervision.md) step 8. Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `operations/backup.py` | [The recovery set](#the-recovery-set-operationsbackuppy), [Backup](#backup-operationsbackuppy) |
  | `operations/restore.py` | [Anchored heads](#anchored-heads-operationsrestorepy), [Restore verification](#restore-verification-operationsrestorepy), [A host lost during a session](#a-host-lost-during-a-session-req-mig-009) |
  | `adapters/lease_store.py` (proposed tree delta T-90) | [The send-lease store adapter](#the-send-lease-store-adapter-adapterslease_storepy) |
  | `operations/deployment.py` | [Transition log and convergence](#transition-log-and-convergence-operationsdeploymentpy), [The initial cutover](#the-initial-cutover-operationsdeploymentpy) |
  | `adapters/compatibility.py` | [Legacy readers](#legacy-readers-adapterscompatibilitypy), [Compatibility projections](#compatibility-projections-adapterscompatibilitypy), [The disarmed shadow](#the-disarmed-shadow) (its legacy inputs) |
  | `scripts/migrate_legacy.py`, `resources/migrations/008_import.sql` (proposed tree delta T-91) | [History import](#history-import-scriptsmigrate_legacypy), [Upgrade or import](#upgrade-or-import-task-s13-01) |
  | `scripts/compare_parity.py` | [Same-head comparison](#same-head-comparison-scriptscompare_paritypy) |
  | `scripts/verify_recovery.py` | [The clean-host rehearsal](#the-clean-host-rehearsal-scriptsverify_recoverypy) |
  | `scripts/check_release.py` | [Transition log and convergence](#transition-log-and-convergence-operationsdeploymentpy) |
  | `docs/migration.md` | [Records this spec keeps](#records-this-spec-keeps) |

* **Contributes to:** `bootstrap.py` ([configuration spec](configuration-artifacts-release.md#compositions-bootstrappy)): `compose_shadow`, `COMPOSITIONS["shadow"]`, the migration composition, the anchor read at kernel start and the lease store's composition. `kernel/ledger/export.py` ([ledger spec](ledger-and-atomic-transaction.md)): the projection hook behind `compat_projection`. `deploy/install.py` ([runtime spec](runtime-isolation-observability-deployment.md#installer-deployinstallpy)): it records every step through `operations.deployment`, and gains the `cutover` and `continue-legacy` commands. `kernel/recovery.py` ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)): two fence-rule triggers, a ledger holding `MIGRATION_GENESIS` needs a fence after it and a ledger holding `ROLLBACK_CONTINUATION` refuses every advance, built in SLICE-14 step 1; `RECOVERY_GAP.superseded_heads` for anchors a restore supersedes. `kernel/host.py` ([runtime spec](runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy)): writing the `RouteRetirement` record after the first claim. Each change is listed in the slice step that makes it and reported to that spec's owner.
* **Consumes:** `LeaseStore`, `FenceEvidence`, the restore marker and `RECOVERY_GAP` ([sessions spec](sessions-authority-lifecycle.md#send-lease-kernelrecoverypy)); `LedgerWriter.open(..., anchor=)`, `LedgerReader`, the evidence store ([ledger spec](ledger-and-atomic-transaction.md#event-envelope-reuse-with-two-added-fields)); `bundle.json`, `compatible`, the release transitions and the activation boundary ([configuration spec](configuration-artifacts-release.md#release-transitions)); storage classes, `at.slice` and `scripts/isolated_work.py` ([runtime spec](runtime-isolation-observability-deployment.md#storage-classes-operationsisolationpy)); the market store and `MarketSource` ([market spec](market-data-and-canvas.md)); the strategy host and recorded-response replay (SLICE-09).
* **Consumed by:** every production kernel start (anchors and the lease store); the installer; SLICE-11 step 8 and step 11; SLICE-13; SLICE-14.
* **Master anchors:** ATA-03 (`README.md:456`); A04-F2 (`README.md:794`); A04-F3 (`README.md:897`); A04-F4 (`README.md:330`); A04-F5 (`README.md:796`); D02 (`README.md:224`); D10 (`README.md:1201`); AUD-05 and A02-F5 (`README.md:1195`); A10-F3 (`README.md:1192`); Combined-F3 (`README.md:1197`); Combined-F6 (`README.md:909`); Combined-F2 (`README.md:790`); the event-envelope anchoring rule (`README.md:784`); the WAL backup rule (`README.md:782`); the Phase 4 and Phase 7 rows (`README.md:1184`, `:1187`); the shadow paragraph (`README.md:1199`); the cutover paragraph (`README.md:1203`); the reuse rows (`README.md:1146`, `:1159`); the acceptance rows (`README.md:1227`, `:1232`, `:1242`, `:1253`, `:1255`, `:1256`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root. `monitoring/` is legacy's top-level monitoring package. The built target code cited as `OA_NEW` is at `42879dd` (the `slice-08` branch head).

## Overview

**In plain words.** Four jobs live here. First, a nightly backup that leaves the machine: a list of exactly what was copied (the ledger at a named point, the evidence it points to, the price store, OpenAlgo's own databases), and a way to put it all back on a fresh machine and check it before anything trusts it. A restored copy never gets to trade on its own: the kernel waits until a person proves the old machine can no longer send. Second, a "shadow": the new system runs beside the old one on the trading server, reading copies of the old system's files and price data, with no broker key and no way to send. Every evening its decisions, money held back, orders, stops and unknown outcomes are compared with what the old system really did; every difference must be explained or it counts as a defect. Third, a one-time move of the old history into the new system, counting every old record as moved, refused or set aside, never lost or invented. Fourth, the cutover itself: on an evening the owner chooses, with nothing open at the broker, the old system is stopped and locked out, its broker key is replaced, and the new kernel starts. Until the new system's first order, the owner can still go back to the old one; after it, the old route is gone for good and any rollback is to an older new-system release. Nothing here changes a trading rule, and the cutover never happens without the owner's word.

## The problem

* **Legacy backs up its live ledger as plain files.** The nightly job hands the whole run directory to restic (`deploy/offbox_backup.py:136-173`), and the Tier-1 ledger lives inside it (`run/tier1/authority.db`, `config/defaults.yaml:1869`). Only OpenAlgo's databases are copied with SQLite's backup API (`deploy/offbox_backup.py:664-735`). A WAL database copied as files is not a consistent state (`README.md:782`). Whether a WAL file is present at 17:15 IST on the EC2 is **not checked**.
* **No off-host head anchor.** Nothing outside the host records the Tier-1 ledger's head (no `anchor` in `src/tier1/*.py`), so an older restored file or a truncated tail cannot be detected (`README.md:784`).
* **A restore proves bytes, not a set.** Legacy's restore test compares event counts and file hashes in scratch (`deploy/offbox_backup.py:28-37`), and `recovery.restore` copies and verifies one ledger (`src/tier1/recovery.py:195-209`). Nothing lists which evidence objects, artifacts and custody state a restored ledger needs (A04-F5).
* **Two authorities' stores.** At 445eb116 the Tier-1 authority writes its ledger, and the gateway still writes the JSONL execution registry before every send (`src/core/framework/execution/registry.py:186-275`) that the authority itself reads back (`src/runtime/tier1_authority/service.py:305-312`). Many readers fold that JSONL (list below). The target has one ledger (D02), so the JSONL must become a generated projection with a named format and named readers, or those readers break silently.
* **The target schema is provisional** until the upgrade-versus-import comparison ([X-002](../consistency/master-contradictions.md#x-002)).
* **Legacy's own cutover is the precedent.** On 13 October 2026 legacy moved from its JSONL stores to the Tier-1 ledger with an importer, a shadow feeder, a comparator, a sealed genesis and a retirement marker (`src/tier1/activation.py:123-152`). The target needs the same discipline for its move from the Tier-1 ledger, without writing any legacy store.

## Goals

* A verified recovery set and nightly backup, restored on a clean host with the exact candidate artifact; a restore grants no activation (REQ-MIG-006, REQ-MIG-007, REQ-MIG-009).
* Off-host anchors and the send-lease store, so a clone, an old copy or a second ledger cannot send (REQ-MIG-012, REQ-MIG-013).
* Legacy history read by versioned readers and imported with 100 % accounting at pinned boundaries (REQ-MIG-004, REQ-MIG-010).
* The upgrade-versus-import choice made from compared evidence and recorded (REQ-MIG-005).
* The legacy JSONL kept as a generated, versioned projection with a consumer list (REQ-MIG-003).
* A disarmed shadow on production observations, and a same-head comparison where every difference is explained or is a defect (REQ-MIG-011).
* An initial cutover only at a naturally flat, freshly reconciled scope, on the owner's word, with the old route retired at the target's first broker-changing attempt (REQ-MIG-001, REQ-MIG-002).
* Outstanding obligations keep executable continuity across later releases and sessions (REQ-MIG-008).

## Non-goals

* **No automatic cutover, flattening or failover.** The cutover runs on the owner's word only (standing rules; POL-050); nothing closes a position to create a flat scope (ATA-03); no off-host failover is built (POL-047 open).
* **No open-obligation import.** The initial transfer happens at a flat scope; open positions are never translated (`README.md:456`).
* **No write to any legacy store, ever.** Legacy files are read, copied and kept as evidence; the target never creates, locks, renames or edits them, not even at cutover (REQ-MIG-003).
* **No owner-only value chosen.** The backup destination (POL-O01), RTO and failover authority (POL-047) and the licence stay unbound; the steps that need them refuse.
* **No new money behaviour.** The shadow compares; it decides nothing. Approved differences come only from the owner's recorded answers.
* **No research custody move in the first release.** Research is deferred (configuration spec composition); the deployed custody chain stays in the recovery set as evidence and is imported when research is composed, on the owner's word ([research spec](research-rl-custody-promotion.md)).

## Requirement keys

<a id="requirement-keys-pointers"></a>

The decision text is the requirement; the label is a reminder. REQ-MIG-011…013 are added by this deepening.

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-MIG-001 | Initial legacy-to-target migration only at a naturally flat, freshly reconciled scope (no open positions, working orders or unresolved effects); never flatten to create it; defer when not established | ATA-03 (`README.md:456`); POL-001 | PRF-MIG-13, PRF-MIG-14 |
| REQ-MIG-002 | After the target's first broker-changing attempt, the old route is permanently retired; rollback is target-to-target only | ATA-03 (`README.md:456`, `:1203`) | PRF-MIG-13, PRF-SES-07 |
| REQ-MIG-003 | No slice writes to a legacy store; JSONL becomes a generated projection with a versioned format and a named consumer list | Phase 4 (`README.md:1184`); A10-F3 (`README.md:1192`) | PRF-MIG-06, PRF-MIG-09, PRF-LED-06 |
| REQ-MIG-004 | History import pins source boundaries and digests and accounts for 100 % of source records (transferred, rejected or quarantined); unknown authoritative records block dependent activation | AUD-05 / A02-F5 (`README.md:1195`) | PRF-MIG-07 |
| REQ-MIG-005 | Upgrade-versus-import is decided from compared evidence and the reason is recorded; initial open-obligation import is excluded | AUD-05 (`README.md:1195`); [X-002](../consistency/master-contradictions.md#x-002) | PRF-MIG-08 |
| REQ-MIG-006 | Recovery set manifest covers the ledger boundary, required evidence objects, compatible artifacts and custody continuity; restore grants no activation | A04-F5 (`README.md:796`) | PRF-MIG-01, PRF-MIG-02 |
| REQ-MIG-007 | Clean-host restore rehearsal with the exact candidate artifact and schema before Phase 7 activation | D10 (`README.md:1201`) | PRF-MIG-04, PRF-MIG-05 |
| REQ-MIG-008 | Outstanding obligations keep executable continuity across target release and session transitions | Combined-F6 (`README.md:909`); REQ-PRT-014 | PRF-MIG-15, PRF-PRT-12 |
| REQ-MIG-009 | Nightly backup after close, including OpenAlgo's volume; a mid-session loss appends a recovery-gap record and rebuilds that session from broker evidence, labelled rebuilt | POL-047 | PRF-MIG-17 |
| REQ-MIG-010 | Compatibility readers for retained history; no older live internal protocol | Combined-F3 (`README.md:1197`) | PRF-MIG-06 |
| REQ-MIG-011 | Before cutover the target only shadows, with an independent ledger, a disarmed adapter and no financial credential or socket; exact identities, reservations, quantities, protection obligations, unknown outcomes and evidence class are compared at one head; an unexplained difference is a defect | `README.md:1199`; D02 (`README.md:224`) | PRF-MIG-10, PRF-MIG-11, PRF-MIG-12 |
| REQ-MIG-012 | Ledger heads are anchored off the host, and every production writer open is checked against the latest anchor | Event envelopes (`README.md:784`) | PRF-MIG-03 |
| REQ-MIG-013 | The send lease lives in an off-host store with compare-and-swap; a replacement or copy cannot take it while the live kernel renews it | A04-F2 (`README.md:794`) | PRF-MIG-03 |

## Critical user journeys

### CUJ-MIG-1: The nightly backup

At 17:15 IST the backup timer starts `at-backup.service`. The backup copies the ledger with SQLite's backup API while the kernel keeps running, reads its head back (sequence 48 211, hash `9c1e…`), copies the evidence objects the ledger references up to that head, the market store, the operator's authorization store and OpenAlgo's two databases, and writes a manifest naming every object and its SHA-256. It uploads the set, reads a sample back, and records the head in the manifest as an off-host anchor. One evidence object referenced at sequence 47 900 is missing: the manifest lists it under `gaps`, and the backup alerts. The kernel is never stopped or slowed beyond one read transaction.

### CUJ-MIG-2: The server dies at 11:40 during a session

The owner starts a clean host and runs the restore. It fetches last night's set, checks every object's hash, restores the ledger into an empty directory and checks its head against the manifest, then checks that the candidate bundle can read it. The lease store shows the dead kernel's last renewal at 11:39:40 with head 49 020. The restore hands the kernel a restore marker and a gap from the backup's head to now. The kernel records `EPOCH_ACTIVATED` with the marker and `RECOVERY_GAP`, marks the claimed attempts ambiguous, records the broker's current books as rebuilt observations, and stops in `RECOVERY_WRITING`. It sends nothing. Two broker orders placed between the backup and 11:40 appear with no ledger record; the owner lists them in the fence evidence, confirms the old server is off and the OpenAlgo key replaced, records `OLD_HOST_FENCED`, and advances by hand.

### CUJ-MIG-3: A shadow day

Legacy trades all day. Every 30 seconds a copier, running as legacy's user with no key in its environment, appends the new complete lines of legacy's registry and market files into the shadow's input directory. The shadow market process turns the market lines into its own store; the shadow BuyerEdge host decides on the same bars; the shadow kernel admits and reserves in its own ledger. At 10:21 the shadow plans the same 75-lot PE entry legacy placed; the disarmed responder answers with legacy's recorded acknowledgement and fills. At 13:05 the shadow refuses an entry legacy took. The refusal matches none of the owner's approved differences, so it is a defect, reported with both sides' inputs. After the close the copier takes legacy's ledger by the backup API, the comparison pins both heads and reports one defect and three approved differences.

### CUJ-MIG-4: The cutover evening

The owner says "cut over tonight" for release `0.9.0+5be0…`, the bundle the shadow ran. After the close the installer checks the boundary through the observation route: no position, no working order, nothing unsettled in legacy's stores, no legacy sender alive. It stops legacy's units in legacy's order and checks again with fresh books, masks the units, pins the capture, imports the history into the new ledger (41 902 records: 41 902 transferred, 0 quarantined), and asks the owner to replace the OpenAlgo key. The owner does, and installs the new key for the kernel, the market process and the broker-book reader. A one-shot probe confirms OpenAlgo now refuses the old key. The installer seals `MIGRATION_GENESIS`, takes and anchors a backup of the new ledger, switches, starts the observers, the market process and the kernel, and the kernel waits in `RECOVERY_WRITING`. The owner records the fence naming legacy and advances. The next morning BuyerEdge's first order is claimed; from that commit on, going back to legacy is refused.

### CUJ-MIG-5: The owner wants to go back

Case one: before any target order, the owner runs `continue-legacy`. The installer checks that no claim, no off-host retirement record and no restore exists for this ledger and that the lease head is in the file; stops the target units, checks that none runs and masks them; removes the target's key files; records `ROLLBACK_CONTINUATION`, after which the kernel refuses every advance in that ledger; marks the lease released `abnormal`; checks the boundary again; unmasks legacy's units and tells the owner to put the current key back in legacy's settings file before starting them. A target kernel started by hand afterwards has no key and cannot advance. Case two: one order was already claimed. `continue-legacy` refuses and prints what a rollback now means: an older, compatible target release over the current ledger.

### CUJ-MIG-6: An unknown legacy record

The import meets a Tier-1 event of a kind no reader knows. It is not dropped and not guessed: it is stored as `LEGACY_RECORD_QUARANTINED` with its bytes and digest, and the import manifest counts it. The cutover refuses at `HISTORY_TRANSFERRED` while any quarantined record is authoritative; shadow work and development continue.

## Technical plan

### The recovery set (`operations/backup.py`)

A recovery set is one manifest plus the objects it names. A single archive is optional packaging, not the consistency guarantee (A04-F5).

```text
format          "at-recovery-set/1"
set_id          sha256 of the canonical manifest without set_id
created_at      UTC, from the backup host's clock; host_id (runtime.host_identity())
release         {release_id, bundle_digest, settings_revision}        # what wrote the stores
ledger          {head_sequence, head_hash, first_event_id, migration_revision, schema_revision,
                 event_count, method: "sqlite_backup_api", integrity_check, object}
evidence        [{ref, sha256, bytes, present: true | false}]          # every reference up to head
market_store    {head_seq, method: "sqlite_backup_api", integrity_check, object} | null
authorization   {source, snapshot_object, continuity: "snapshot_only"} # Combined-F4: a snapshot never proves current grants
openalgo        {databases: {name: {object, integrity_check}}} | {enabled: false}
custody         {composed: false} | {chain_head, anchor, object}      # research deferred in the first release
leases          {account: {holder_ledger, holder_epoch, head_sequence, head_hash, expires_at}}  # read, never taken
objects         [{object, class, sha256, bytes}]                      # every file in the set
excluded        ["scratch", "telemetry", "derived", "staging"]        # by storage class
gaps            [{kind: evidence_missing | market_unreadable | openalgo_failed, detail}]
```

* **What it is for.** A restore of this set reproduces the ledger at `ledger.head_*` and every object the ledger references up to that head, and says exactly what it lacks. A missing object limits only what depends on it (A04-F5): a missing evidence object becomes a recovery `unverified` item ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)); a missing market store means views are unavailable until the market process refills them; neither blocks activation on its own.
* **Storage classes.** The ledger, evidence store and authorization store are authoritative or required evidence; the market store and OpenAlgo's databases are required evidence for replay and reconciliation; the compatibility projections and telemetry are derived and are not copied ([runtime spec](runtime-isolation-observability-deployment.md#storage-classes-operationsisolationpy)). Legacy's run directory is included read-only, unchanged, as evidence until the owner retires it.
* **The secret settings are not in the set.** No credential file, environment file or OpenAlgo key table is copied: legacy copied `.env` under class A (`deploy/offbox_backup.py:153`), and that is a **Deviation**. OpenAlgo's databases do hold its auth tables (`deploy/rehearse_clean_host.py:9-15`); they are copied as legacy does (POL-047's "including OpenAlgo's database volume") and the rehearsal deletes its copies at the end, as legacy's procedure says.

### Backup (`operations/backup.py`)

* **When.** `at-backup.timer` (runtime spec's unit table: daily 11:45 UTC, randomized 15 min, persistent, legacy's timing, POL-047). The backup is a required participant of a production composition; without `backup.destination` the composition refuses activation (configuration spec, `CFG-R08`).
* **How, in order**, each step logged to `paths.run/backups/backup.jsonl` with `intent` and `done`:
  1. stage in `paths.scratch/backup-<set>/`, inside `envelope.backup_reserve.*` (runtime spec);
  2. copy the ledger with the SQLite backup API from a read-only connection, in steps, then open the copy, verify the chain, read its head and run `integrity_check` (legacy's snapshot method for the Tier-1 ledger, `src/tier1/recovery.py:138-163`, `:185-192`); the head read from the copy is the set's head;
  3. list every evidence reference in events up to that head (the ledger's `evidence` column) and copy each object from the evidence store; a missing object is a `gap`, never a failure of the set;
  4. copy the market store with the backup API;
  5. copy OpenAlgo's databases with the backup API inside its container and check `integrity_check`, legacy's method unchanged (`deploy/offbox_backup.py:682-735`);
  6. copy the authorization store (SLICE-10's) with its source named;
  7. read each bound account's lease (never take one);
  8. write the manifest, upload the set through the destination adapter, read the manifest and a sample of objects back from the destination and compare hashes (legacy's read-back rule, `deploy/offbox_backup.py:28-37`);
  9. record the set's head as an anchor at the destination (below), then delete the staging directory.
* **Destination adapter.** `Destination(put, get, list, anchor_put, anchor_get)`. Two adapters: a local directory (tests and rehearsals) and restic, legacy's tool and POL-047's approved one (`deploy/offbox_backup.py:1-17`), which brings encryption, deduplication and retention. The repository, its storage credential and the passphrase are POL-O01, open: `backup.destination` is refusing and the restic adapter refuses to run without it.
* **What the backup never does.** It holds no broker key (its unit loads only the destination's credential, runtime spec), stops nothing, takes no lease, and opens no store for writing. A backup failure is logged and alerted; it never changes trading.
* **Disk full while staging** (the runtime spec's "Backup staging" row): the step fails, staging is deleted, the failure is logged and alerted; no live store is touched.

### Anchored heads (`operations/restore.py`)

The ledger writer refuses a file that lacks a supplied anchor (`LED-R11`, OA_NEW `kernel/ledger/store.py:305-320`). This section decides where anchors come from and when they are written ([ledger spec](ledger-and-atomic-transaction.md#event-envelope-reuse-with-two-added-fields)).

* **Written** (a) by every lease renewal and clean release, which carry `head_sequence` and `head_hash` and name `holder_epoch` ([sessions spec](sessions-authority-lifecycle.md#send-lease-kernelrecoverypy)); (b) by every backup, at the destination, as `{ledger: first_event_id, epoch_id, sequence, event_hash, set_id, at}`, where `epoch_id` is the epoch active at the copied head.
* **Which anchors count.** A restore starts a new branch of the same ledger: the restored file keeps its first event ID, while the dead kernel's lease head and any later backup anchor lie on the lost branch, whose events the file will never contain. So an anchor counts only when its epoch is activated in this file, or when the file holds no restore marker. An anchor from an epoch not activated in this file is **superseded** when the restore that produced this file listed it (`GAP_COMPUTED` below); the list is carried in the file's `RECOVERY_GAP` as `superseded_heads` (a sessions-spec field, integration item) and, until that field exists, read from the restore log. Any other such anchor is evidence of a missing tail and still refuses.
* **Read at kernel start** by `restore.anchor_for_start(paths.ledger, lease_store, destination) -> AnchoredHead | None`, which `bootstrap` calls before `LedgerWriter.open`:
  * **ordinary start:** the highest counting anchor (lease heads whose `holder_ledger` is this ledger's first event ID, read through a `LedgerReader`, and this ledger's backup anchors); a file behind it refuses with `LED-R11` (OA_NEW `kernel/ledger/store.py:317-320`), which means the file is older than what was last seen running: restore, never resume;
  * **restore start:** the restored set's own `ledger.head_*`, so the writer proves it opened the restored file; the newer lease head defines the recovery gap ([below](#restore-verification-operationsrestorepy));
  * **a restart after a restore and before the advance:** the dead kernel's lease head is superseded, so the restored file opens again (without this rule it would refuse with `LED-R11` forever, since only an advance replaces the lease);
  * **nothing reachable:** no anchor; `bootstrap` adds `anchor_unavailable` to recovery's `unverified` list, so only a human can advance (routine check 6 already needs the lease store).
* **Limit.** A rollback inside one renewal interval is not detected (sessions spec risk); the backup anchor is the nightly backstop.

### The send-lease store adapter (`adapters/lease_store.py`)

Implements `LeaseStore.read`, `cas` and `now` (OA_NEW `kernel/recovery.py:38-43`) off the host. Proposed tree delta **T-90**.

* **Contract every adapter meets:** `cas` is linearizable per account (two concurrent `cas` with the same `expected` cannot both succeed); a `True` result is durable at the store before it returns; `now()` is the store's clock, never the caller's; the store is reachable from a replacement host and does not live on the trading host's disk; it holds no secret but its own access credential; every call has a timeout, and a timeout is reported as unreachable, never as success.
* **`DirectoryLeaseStore(root)`:** one file per account, `cas` under an exclusive `flock` on a lock file, write to a temporary file, `fsync`, rename, `fsync` the directory. Used by tests, the synthetic rehearsal and the disarmed shadow (its leases bind nothing real). A production composition refuses it unless its root is on a filesystem the owner names as off-host (`recovery.lease_store`), because a local directory is not off-host evidence.
* **The production adapter** is built when POL-O01 chooses the destination; it must meet the contract above on that service (for example an object store with conditional writes, or a small remote database with a compare-and-swap row). Until then `recovery.lease_store` is unbound and a production composition refuses (configuration spec), so production kernels cannot advance (`SES-R10`, OA_NEW `kernel/recovery.py:309-333`).
* **The route-retirement record.** The same store keeps one write-once record per production ledger, `RouteRetirement(ledger_first_event_id, genesis_digest, first_claim_sequence, at)`, written by `put_once` (succeeds only when absent). After the first `DISPATCH_CLAIMED` that follows `MIGRATION_GENESIS` commits, the kernel host writes it on its next pass and retries every pass until it lands, alerting meanwhile (a `kernel/host.py` change, runtime spec integration item); it never holds back a send. `continue-legacy` refuses when it exists ([the initial cutover](#the-initial-cutover-operationsdeploymentpy)), so a ledger restored from before the first claim cannot bring the old route back.
* **Lease timings** `recovery.lease_secs` and `recovery.lease_renew_secs` are measured against the chosen store (TASK-S11-07).

### Restore verification (`operations/restore.py`)

A restore is a recorded, resumable sequence in the host log `release.root/restores.jsonl` (outside every release directory, like the transition log). Each step records `intent` before it acts and `done` or `failed` after, with `fsync`.

| State | Entered when | On failure |
|---|---|---|
| `FETCHED` | The named set (or the newest at the destination) is downloaded into an empty restore directory | `FAILED`; nothing in place was touched |
| `MANIFEST_VERIFIED` | `set_id` matches the manifest; every object exists with its SHA-256 | Missing or changed objects named; required ones (ledger) fail, others become gaps |
| `LEDGER_RESTORED` | The ledger target and its `-wal` and `-shm` do not exist; the ledger is copied with the backup API (legacy: a restore starts from no ledger and never overwrites, `src/tier1/recovery.py:195-209`); the chain verifies and the head equals the manifest's | `FAILED`; the partial target is moved aside, never deleted |
| `STORES_RESTORED` | Evidence, market store and authorization store copied into their empty roots; OpenAlgo's databases copied only where the owner restores OpenAlgo itself | Gaps recorded per store |
| `READERS_COMPATIBLE` | The candidate bundle's `compatible(manifest, ledger)` passes (configuration spec) and the bundle digest is the one named for this restore | `FAILED` (`CFG-R09`); restore with a compatible bundle |
| `CUSTODY_CHECKED` | When custody is composed: SLICE-12's restore reconciliation reports `current`, `stale`, `conflict`, `additive` or `missing` (legacy `deploy/offbox_backup.py:406-541`); stale custody never revives consumed evidence. Otherwise `not_composed` | The dependent research claim is blocked, nothing else |
| `GAP_COMPUTED` | The lease store and the destination's anchors are read: `last_restored_sequence` = the set's head; `lost_from` = the set's `created_at`; `lost_to` = now; every lease head and backup anchor of this ledger not contained in the restored file is listed as superseded, with its epoch and holder | Lease store unreachable: the gap runs to now and `anchor_unavailable` is listed |
| `READY` | The kernel's start arguments are written: `RestoreMarker(source_backup=set_id, old_host=<manifest host_id>)` and `RecoveryGap(...)` (OA_NEW `kernel/recovery.py:59-69`) | — |

* **What `READY` grants:** nothing. The kernel records the restore marker and the gap at epoch activation (OA_NEW `kernel/ledger/store.py:466-479`), runs recovery, and stays in `RECOVERY_WRITING` until `OLD_HOST_FENCED` and a human `RECOVERY_ADVANCED` (sessions spec fence rule; legacy's rule, `src/tier1/recovery.py:117-133`). Grants restored without continuity evidence are revoked `restore_unverified` (REQ-SES-010).
* **Resume.** `restore --resume` reads the last record and re-checks its facts (files present, hashes, head), never trusting a record alone.
* **The restore holds no broker key.** Fresh books for reconciliation are read by the kernel after it starts, through its own adapter, in `RECOVERY_WRITING` (reads only).

### A host lost during a session (REQ-MIG-009)

* The newest set is the previous night's. Everything the ledger committed after it is lost; the lease head shows how far the dead kernel got.
* The restore records `RECOVERY_GAP` from the set's head to now. In `RECOVERY_WRITING` the kernel's recovery marks every `CLAIMED` attempt `AMBIGUOUS` (`interrupted`), and the first observation pass records the broker's books with `basis: rebuilt` (legacy's `REBUILT_OBSERVATION`, `src/tier1/recovery.py:19-24`); nothing is resent.
* Broker orders and trades inside the gap have no ledger record. Reconciliation lists them; they are not adopted by shape (Q-007). The human who fences lists each in `FenceEvidence.accounted` with why (legacy's fence rule 3, `src/tier1/recovery.py:41-46`), and may read the dead host's own ledger copy read-only when it is reachable, as legacy does.
* POL-047's RTO and failover authority stay open: the rehearsal reports a duration, judged only against `recovery.rto_secs` if the owner binds it (runtime spec).

### The clean-host rehearsal (`scripts/verify_recovery.py`)

* **`verify_recovery.py synthetic --artifact WHEEL`** (SLICE-11 step 8, class S): builds a synthetic production-shaped history with the simulation composition (admitted, claimed, acknowledged, filled, ambiguous and protected commands; evidence objects; a market store), takes a set with `operations.backup` into a local destination, restores it into a second empty directory standing in for a clean host, and exercises D10's list (`README.md:1201`):
  * **exact artifact:** the restore runs the wheel under test, installed in a blank environment, and refuses a different `bundle_digest`;
  * **crashes:** the restore killed at each state resumes; the kernel killed in `RECOVERY_WRITING` restarts into it again;
  * **unresolved effects:** a command `IN_FLIGHT` at the backup is `AMBIGUOUS` after the restore and never resent;
  * **identity preservation:** a fingerprint (chain, count, head, active epoch, `integrity_check`, every projection's state digest; legacy's `fingerprint`, `src/tier1/recovery.py:166-182`) is equal on both sides;
  * **monotonic custody:** reported `not_composed` until SLICE-12's custody is composed, then SLICE-12's restore check runs;
  * **refusal before fencing:** `RECOVERY_ADVANCED` is refused until `OLD_HOST_FENCED`; a second ledger copy cannot take the lease the first holds.
* **`verify_recovery.py rehearse --set ID --artifact WHEEL`** (SLICE-11 step 11, class P, the owner's word, after POL-O01): the same checks over a real set on an isolated clean host that holds no broker key and reaches no broker. It reports the restore's duration, every gap and every check's result. It grants no activation (`README.md:1232`).

### Transition log and convergence (`operations/deployment.py`)

* **`TransitionLog(release_root)`** writes and reads `release.root/transitions.jsonl`, the configuration spec's host-level log: `append(release_id, state, phase: intent | done | failed, by, facts)` flushes and `fsync`s before it returns; `last()`, `history(release_id)`. The installer records every transition through it (A04-F3), including the cutover's states below. These are operational receipts, not a financial journal.
* **`convergence(manifest, *, units, identity_records, ledger_reader) -> Convergence`**: per operation (trading, protection, observation, owner commands, backup), available or not and the missing participant, judged exactly as the configuration spec's `CONVERGED` row; the installer and `scripts/check_release.py` call the same function, so they cannot disagree.
* **`scripts/check_release.py [--json]`** answers at any time, reading only: the release `current` names, its `bundle.json`, the last transition, each running participant's identity record and the bundle it names, the kernel's latest `RELEASE_BOUND`, and the convergence per operation. Exit 0 only when converged. Legacy's `release_check.py` asks the same question of the checkout revision (`deploy/release_check.py:1-20`), after 25 sends were refused on 14 October 2026 because a process ran newer code; the target asks it of the bundle digest (**Deviation**, following the configuration spec's release identity).

### Legacy readers (`adapters/compatibility.py`)

The only target module that reads legacy formats (Combined-F3). Every reader opens files read-only and reads whole files; it never creates, locks, renames or `chmod`s anything (legacy's importer rule, `src/tier1/importer/sources.py:14-16`, kept). It imports no legacy module: the bytes are the contract.

| Reader | Format and version | Shape | Source |
|---|---|---|---|
| `tier1_ledger/1` | Legacy Tier-1 ledger, `SCHEMA_VERSION` 1 (`src/tier1/schema.py:10-102`) | SQLite, read through a read-only copy; the chain verified by legacy's rule (`src/tier1/envelope.py:42-50`, `:89-117`) | `config/defaults.yaml:1869` |
| `registry/1` | Execution registry lines and `STRUCTURE_STATE` rows (`src/core/framework/execution/registry.py:132-158`, `:1858-1898`) | Log | Authority map row 1 (`src/tier1/importer/authority-map.md:26`) |
| `reservations/1`, `reservation_markers/1` | Rows 2 and 3 | Log, snapshot | `src/tier1/importer/sources.py:131-134` |
| `holds/1`, `kill_file/1`, `loss_latch/1`, `strategy_authority/1` | Rows 6, 5, 23, 8 | Snapshot; absence is state | `src/tier1/importer/sources.py:137-146`, `:166-167` |
| `structure_commands/1`, `session_checkpoints/1`, `ai_pauses/1` | Rows 9, 7, 10, with their integrity chains | Log, chain verified (`src/tier1/importer/sources.py:238-266`) | |
| `config_profiles/1`, `candidate_approvals/1`, `session_bindings/1`, `governance_evidence/1`, `arbitration/1`, `plans/1` | Rows 12–17 | As legacy's source table | `src/tier1/importer/sources.py:154-165` |
| `decisions/1` | Strategy evaluation records, gzipped day files (`src/core/framework/observe/decisions.py:91-110`) | Log | |
| `market_ndjson/1` | Legacy's live market store: spot, chain, Greeks and tick streams (`src/data/marketdata/store.py:1-39`) | Log | Market spec |

* **Each record** carries `source`, `file`, `line` or `null`, `offset`, `raw` bytes, `record_digest` (`sha256:` of the raw bytes), the parsed value or a parse error, and a chain verdict where the store has one: legacy's `LegacyRecord` (`src/tier1/importer/sources.py:47-63`), kept.
* **A trailing line without its newline** is a write in progress: deferred, never read half-written (`src/tier1/importer/sources.py:269-282`).
* **Retirement.** A reader is retired only when no retained evidence of its format is needed for recovery, audit or declared replay (A10-F3); the import's quarantine and the recovery set keep legacy's original files, so a reader's removal never removes the bytes.

### History import (`scripts/migrate_legacy.py`)

`migrate_legacy.py import --boundary pin|follow --into LEDGER [--scope ACCOUNTS]`. One run imports the records of every legacy source at one pinned boundary into a target ledger through the migration composition: a writer with principal `migration:<run>` and no coordinator, adapter or session evaluation, so it cannot dispatch. It never imports into a ledger that holds a `DISPATCH_CLAIMED`.

* **The capture boundary** (A04-F4). `IMPORT_BOUNDARY_PINNED` records, in capture order: the legacy ledger's head (`sequence`, `event_hash`) from its backup-API copy; then for each log file its size up to the last newline and the SHA-256 of those bytes, and for each snapshot its SHA-256 or `absent`; the reader version per source; the converter version. At cutover legacy is stopped, so the stores are mutually consistent; in a shadow rehearsal legacy is running, so a record in a later-captured store that names an identity absent from an earlier one is classed `after_boundary`, counted, and not an error. At cutover the same case is an error.
* **Per record, exactly one event,** each with `provenance: legacy_import`, `execution_domain: none`, and the record's source, file, line, offset, `record_digest`, original bytes and the import ID:
  * `LEGACY_RECORD_IMPORTED`: parsed and of a kind the mapping table knows (the payload keeps the parsed record and its legacy identity keys, as legacy's importer does, `src/tier1/importer/__init__.py:138-152`);
  * `LEGACY_RECORD_REJECTED`: not a record (not JSON, not canonical, a broken chain), with the reason; the bytes are kept;
  * `LEGACY_RECORD_QUARANTINED`: a valid record whose authoritative meaning is unknown (an unknown Tier-1 kind, an unknown registry state); kept with its bytes, never mapped or dropped (A02-F5).
* **Accounting.** The `import_manifest` table (migration `008_import.sql`, proposed tree delta **T-91**; the number is the next free one at build) is an index folded from these events, so D04 rebuilds and checks it: `import_id`, `source`, `store_row`, `boundary` (file, size, SHA-256 or ledger head), `seen`, `transferred`, `rejected`, `quarantined`, `after_boundary`, `first_sequence`, `last_sequence`, `stream_digest` (legacy's digest over `(file, line, record_digest)` in order, `src/tier1/importer/manifest.py:24-31`), `converter_version`, `state` (`complete` or `interrupted`). For every source, `seen = transferred + rejected + quarantined + after_boundary`; the run refuses to record `IMPORT_COMPLETED` otherwise.
* **Batches and repeats.** Each source's records commit in batches of at most `migration.batch_records`, each batch with its events in one transaction. What was imported is read back from the ledger itself (file and line for a log, last digest for a snapshot; legacy's `scan`, `src/tier1/importer/__init__.py:73-87`), so a repeated or resumed run imports nothing twice. A line imported earlier that changed or vanished is an anomaly: nothing more is imported from that file until a person reconciles it (legacy, `src/tier1/importer/__init__.py:94-128`). A changed boundary between runs is recorded and reconciled explicitly, never continued silently.
* **Identities.** For each legacy order, the import records the mapping from legacy's `idempotency_key` and `our_order_id` to its broker order IDs, so the target's reconciliation recognizes a legacy broker order as `origin: legacy_import` (known, never foreign, never settled by the target). It never creates a target command, reservation or position from legacy history: imported evidence stays distinct from target-derived state (`README.md:1195`).
* **Validation at the same boundary.** For each source, the views legacy's own readers would give at the pinned boundary (orders, reservations, holds, latch, sender lease, structure state: legacy's comparator set, `src/tier1/compare.py:1-22`) are rebuilt from the imported events and compared; every difference is a defect unless the [comparison's](#same-head-comparison-scriptscompare_paritypy) migration table explains it.
* **What blocks.** Any quarantined record of an authoritative store (rows 1–10, 12–15, 23 of the authority map) blocks the cutover's `HISTORY_TRANSFERRED` step until a person resolves it with a recorded reason. It blocks nothing else.

### Upgrade or import (TASK-S13-01)

AUD-05 leaves the conversion method to compared evidence (`README.md:1195`); X-002 keeps schema 1 provisional until then. TASK-S13-01 builds the actual mapping and records the choice and reason as an engineering decision in `docs/decisions.md` (PRF-MIG-08); the owner sees it with the cutover request.

* **The two routes.**
  * **Upgrade:** a backup-API copy of legacy's Tier-1 ledger is migrated in place to the target schema; legacy rows stay under a legacy envelope reader, and the target's events continue the same chain.
  * **Import:** a new target ledger whose history starts with the import's events; legacy's ledger file stays unchanged as evidence in the recovery set. Under either route legacy's own file is never written.
* **Facts the comparison starts from** (each checked again on the production copy):
  * legacy's schema accepts exactly version 1 and has no migration path (`src/tier1/schema.py:130-136`, LD-07);
  * legacy's provenance check admits only `native`, `legacy_import` and `broker_observation` and cannot express ATA-06's unknown or conflicting domains (`src/tier1/schema.py:24-25`, LD-06);
  * legacy's hashed envelope covers `family`, `idempotency_key`, `execution_id`, `external_ids` and its own schema name and version (`src/tier1/envelope.py:89-117`); the target's adds `execution_domain` and `clock_domain` inside the hash and uses `command_key` (ledger spec). An upgrade therefore cannot re-hash legacy rows: every bundle that verifies the chain would carry a second hash rule forever;
  * the JSONL registry and the other stores are not in legacy's ledger at all, so both routes need the importer for them.
* **Criteria, each measured on the actual mapping table:**

  | Criterion | Measured as |
  |---|---|
  | Original bytes, digests and identities preserved | Every legacy record's bytes and digest retrievable; every legacy identity mapped |
  | Chain verification | Hash rules a target bundle must carry to verify its own ledger |
  | D04 | Whether the index tables can be rebuilt from events with no legacy rows inside them |
  | Rollback and restore | Readers every future bundle needs in its start path (A02-F4); what a restore of each route restores |
  | Recovery complexity | Steps and crash points of the cutover under each route |
  | Unknown records | How each route keeps a record it cannot map |
  | ATA-06 attribution | Whether each legacy event's domain can be stated without invention |
  | Effort | Code and proofs per route |
* **The decision record** names the chosen route, the mapping table (legacy table or event kind or store row → target event or reader, or "evidence only"), the criterion results, the rejected route's reason, and whether `001_initial.sql` is confirmed or replaced ([X-002](../consistency/master-contradictions.md#x-002)). If it is replaced, the replacement lands before any production use and the slices' built tests run against it.

### Compatibility projections (`adapters/compatibility.py`)

D02 makes the ledger the only authority; JSONL is a generated view (`README.md:788`).

* **`orders/1`.** One line per target command transition, in legacy's registry line shape, so legacy's readers fold it unchanged (`src/core/framework/execution/registry.py:1858-1898`): `at`, `our_order_id` (`<strategy>:<command_key>#<attempt_no>`, legacy's `owner:decision_id#attempt` form, `registry.py:114-125`), `owner`, `decision_id` (the command key), `broker_order_id`, `state` (legacy's vocabulary, by a fixed mapping from the target's attempt and leg states written in the slice step), `symbol`, `exchange`, `action`, `quantity`, `attempt`, `day`, plus `projection: {format: "orders/1", source_sequence, source_hash}`. Files are `paths.compat/orders/<day>.jsonl`; `paths.compat` is a derived storage class, never inside legacy's run directory.
* **Refresh.** After an outcome commit, outside the transaction, the kernel's projector (`kernel/ledger/export.py` hook, composed by `bootstrap` with this module's serializer) appends the lines for the new events and flushes; it keeps its last projected `(sequence, hash)` in a sidecar. The outcome reports `compat_projection: fresh` when the append succeeded and `repair_scheduled` when it failed; the host's next pass rebuilds from the sidecar's sequence. A projection failure never authorizes a resend (CP-L4, [ledger spec](ledger-and-atomic-transaction.md#failure-modes-and-crash-points); PRF-LED-06). No fsync: the projection is rebuildable from the ledger at any time.
* **Never an input.** No module under `kernel/`, `strategies/` or `market/` reads a projection, and no target decision reads legacy's JSONL (an import guard in PRF-MIG-09).
* **Consumer list** (A10-F3: purpose, consumer, obligation). At 445eb116 these read the registry through `registry.read_day` and `fold`:

  | Consumer | Purpose | After cutover |
  |---|---|---|
  | `monitoring/account_pnl_service.py:33`, `:88`; `monitoring/checks.py:278-281`; `monitoring/sources.py:102-103` | Legacy monitor's P&L and checks | Served by `orders/1` while the owner keeps legacy's monitor; retired when the target supervisor's reports replace it |
  | `src/interfaces/cli/orders.py:98` | The owner's `at orders` view | Served until SLICE-10's operator views cover it |
  | `src/analysis/core/from_registry.py:80`; `src/analysis/datasets/__init__.py:2725-2733` | Research and analysis over traded days | Served; retired with the research move (SLICE-12, on the owner's word) |
  | `scripts/acceptance_capture.py:180-188`; `scripts/determinism_gate.py:904-906`; `scripts/reconcile_costs.py:56` | Acceptance, determinism and cost tools | Served while used |
  | `src/runtime/execution_gateway/__init__.py:575-580`; `src/runtime/session_state.py:52-53`; `src/runtime/tier1_authority/service.py:305-312`; `scripts/run_framework_live.py:5514-5517` | Legacy's own money path | **Not served:** retired with the old route; pointing any of them at the projection is refused by the cutover checklist |

  `decisions/1` (strategy evaluation records) is not projected in the first release: the target records decisions through the kernel's `record_decision` route (SLICE-09), and no retained consumer was found that needs legacy's file format; a consumer found later gets a new projection format, never an edit to `orders/1`.

### The disarmed shadow

The shadow is the target running beside legacy on production observations, holding no financial credential and no broker socket (`README.md:1199`), in master Phase 4 (`README.md:1184`). It is pre-approved by the owner's standing rules.

* **`COMPOSITIONS["shadow"]`** (a `bootstrap` composition, listed for the configuration spec):

  | Participant | In the shadow |
  |---|---|
  | Copier | The one shadow process that runs as legacy's application user, because only that user can read legacy's stores (legacy makes the ledger directory `0700`, `src/tier1/activation.py:93-104`). That user's other processes carry the broker key in their environment (the authority and the strategy run as that user and load the shared settings file, `deploy/systemd/at-tier1-authority.service:29-32`, `deploy/systemd/at-strategy.service:34-37`), and its files include the key, so the copier runs locked down ([below](#the-copiers-lockdown)). Every `shadow.copy_interval_secs` it appends the new complete lines of legacy's log stores and market files into `paths.shadow.root/input/` and copies changed snapshots. It never opens legacy's SQLite ledger during a session; after the close it copies it once with the backup API |
  | Market process | `LegacyMarketSource` (this module) reads `market_ndjson/1` from the shadow input and feeds a shadow market store through the market spec's merge; no OpenAlgo adapter is composed |
  | BuyerEdge host | As in production, on shadow views |
  | Review | The recorded-response provider (SLICE-09) answering from legacy's recorded AI-management review for the same intent; with no recorded review, the policy's unavailable behaviour applies and the difference is reported |
  | Kernel | Its own ledger, evidence store and paths under `paths.shadow.root`; the broker port is `LegacyOutcomeResponder` (below); the lease store is a `DirectoryLeaseStore` under the shadow root (its leases bind nothing real); principals and grants live only in the shadow ledger |
  | Projector | `orders/1` into `paths.shadow.root/compat/`, so PRF-LED-06 runs on real activity |
  | Supervisor | Optional: run against the shadow ledger for PRF-OPS-09, reading broker books only through the observation route (runtime spec) |

* **`LegacyOutcomeResponder`** implements the kernel's broker port and cannot send: the module imports no HTTP client, socket library or OpenAlgo code (PRF-MIG-11). For each shadow command it looks for legacy's matching command in the copied registry: an entry by strategy, decision bar, instrument, side and quantity; a cancel, modify or close by the matched target order and verb within the same bar. A match is answered with legacy's recorded outcome, broker order ID and fills, as they appear in the copied lines; a match whose outcome has not yet appeared stays pending until it appears or the shadow's deadline passes (then the shadow records ambiguity, which the comparison reports). No match is answered `not_sent` (`disarmed_unmatched`). Legacy orders the shadow never made appear in the shadow's book as foreign activity (Q-016). Whether legacy's registry lines carry every fill quantity the responder needs is **not checked**; TASK-S13-04 characterizes it, and where lines lack them, the end-of-day pass takes them from the ledger copy and the in-session state is labelled provisional.
* **Isolation.** Every shadow process runs as a transient unit through `scripts/isolated_work.py` in `at.slice`, with no credential and `PrivateNetwork=yes`; every one except the copier runs as the shadow's own user (`at-shadow`) and reads only the shadow root (the supervisor alone, when composed, reaches the observation route's socket).
* <a id="the-copiers-lockdown"></a>**The copier's lockdown.** Same-user processes can read each other's `/proc/<pid>/environ` and be traced, and the user's files hold the key. So the copier's transient unit has, and refuses to start unless `isolated_work.py` reports each one enforced (a refusal, not the `enforced: false` report other isolated work may proceed with):
  * no view of other processes: `PrivatePIDs=yes` where the host's systemd supports it, otherwise `InaccessiblePaths=/proc` with `SystemCallFilter=~@debug` (no `ptrace` or `process_vm_readv`), plus `ProtectProc=invisible`;
  * an allow-list view of legacy's files: `TemporaryFileSystem=` over legacy's home and OpenAlgo's data and container directories, with only legacy's store directories and its market directory bound back by `BindReadOnlyPaths=`; legacy's settings and environment files, `run/openalgo-snapshot/` (OpenAlgo's copied databases with their auth tables, `deploy/offbox_backup.py:661-664`) and every socket under the run directory stay unreachable;
  * read-only legacy roots and one writable path, `paths.shadow.root/input/` (`ProtectSystem=strict`, `ReadWritePaths=`), so it cannot write a legacy store;
  * `PrivateNetwork=yes`, `RestrictAddressFamilies=none`, `NoNewPrivileges=yes`, an empty capability bounding set, and every credential name removed from its environment.

  Which of these the EC2's systemd supports is **not checked** (SLICE-11 step 10 records its version); the copier is built and proved with them in SLICE-13 step 2. `paths.shadow.root` is refused at load when it lies inside a production root or legacy's run directory. The candidate wheel is installed with its lock into a virtual environment under the shadow root, so the shadow runs the exact `bundle_digest` that would be cut over, without a deploy.
* **Read load.** The shadow makes no broker call. The copier's reads of legacy's files and its one nightly backup-API read of legacy's ledger are its whole load on legacy; the nightly read is measured beside legacy's commit latency the first night (A03-F4), and `shadow.copy_interval_secs` is refusing and measured, with legacy's own feeder interval of 30 s as evidence (`src/tier1/shadow.py:59-62`).
* **Nightly import rehearsal.** After the close, `migrate_legacy.py` imports the day's copied stores into a separate rehearsal ledger at a pinned boundary, so the importer's accounting is proved on real records every day before it is used once at cutover.

### Same-head comparison (`scripts/compare_parity.py`)

`compare_parity.py shadow --day D` compares legacy and the shadow at one pinned pair of heads, never "latest against latest". Its other modes run the retained-behaviour parity proofs PRF-ADM-07, PRF-PRT-08 and PRF-STR-10 on recorded sessions (their owners' specs).

* **The head pair.** Legacy's boundary `B` is the import boundary pinned after the close (ledger head and file prefixes). The shadow's head `H` is the shadow ledger's head after it has processed every input whose arrival is at or before `B`'s capture instant. The report names both; a comparison over unpaired heads is refused.
* **The comparison set** (`README.md:1199`):

  | Item | Legacy at `B` | Shadow at `H` | Equal when |
  |---|---|---|---|
  | Plan, refusal, candidate and policy identity | Planner rows and plans (rows 1, 17), decision records, session binding and profile version (rows 12, 14) | `COMMAND_ADMITTED` plan fields and digests, admission refusals, `CandidateId`, `PolicyBindingId` | Same decisions per bar: same instrument, side, quantity, prices as decimal strings, refusal class by a fixed legacy-gate-to-refusal-code table, same strategy code digest and policy values |
  | Reservation totals | Legacy's reservation fold (row 2) | The `reservation` table | Per account, the sums of amount, margin and worst-case loss |
  | Order and leg quantities | Registry fold (row 1) | Attempts, legs, broker identities | Per matched order |
  | Protection obligations | Registry stop moves and structure state | `protection_state`: desired, attempted, confirmed | Stop and target per bar, in PRF-PRT-08's retained scope |
  | Unknown outcomes | Legacy `UNKNOWN` and ambiguous rows | `AMBIGUOUS` attempts | The same set |
  | Evidence class | Legacy's provenance and recorded mode | `execution_domain`, outcome class | The same domain per effect |
  | Books | Legacy's own readers' views | The `position` table | Positions per instrument |
* **Approved differences come only from the owner.** The table of approved differences holds one row per owner answer whose own text records a difference from legacy's live behaviour, and nothing else: Q-003 (age from the bar's close), Q-026 (deep-OTM delta exit), Q-027 (basket rules), Q-029 (no recovery hold on an unreadable broker), Q-030 (final bars), and any later owner answer of that kind. Each row carries its reference, the **condition** under which it applies and the **expected value** on each side (for example Q-003: condition, the view's age measured from the bar's open exceeds the bound while its age from the bar's close does not; expected, legacy refused as stale and the shadow admitted). A difference matches a row only when its condition holds and both sides equal the expected values; otherwise it is a defect. The table is written at TASK-S13-02 from the [owner answers](../decisions/owner-answers-2026-10-27.md) alone and reviewed against them; agents add no row.
* **A Deviation on a compared row is an owner question.** When a slice file's Deviation (written by an agent, not answered by the owner) changes a value in the comparison set, its differences are defects until the owner answers a question about it; the comparison never approves its own differences. Legacy's comparator follows the same rule: a disagreement is a defect unless a recorded migration explains it, and then it is still reported (`src/tier1/compare.py:18-21`, `:40-60`).
* **Defects.** Every other difference is a defect, reported with both sides' inputs (view identity, legacy record digests). A difference caused by the shadow's own divergence earlier the same day (an unmatched entry that legacy filled) is reported once at its first cause, with its consequences linked.
* **Output.** One report per day in `paths.shadow.root/reports/`, and a summary line in `docs/migration.md`'s shadow table at the slice's record. The cutover request lists the shadow days and their defect counts. The owner answered (2026-10-30, [combined answers](../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30)): one or two clean end-to-end days are enough, and nothing in the code counts days or refuses on them.

### The initial cutover (`operations/deployment.py`)

The cutover is a release transition with the old system as legacy instead of an older target release. `deploy/install.py cutover --authorized-by NAME --instruction TEXT` walks these states through `TransitionLog`, each with `intent` and `done`, resumable from recorded facts like every transition (configuration spec):

| State | Entered when | Changes the running system |
|---|---|---|
| `CUTOVER_STAGED` | The candidate release is `VERIFIED_DISARMED` on this host (SLICE-11 step 10); its `bundle_digest` is the one the shadow ran and the one the D10 rehearsal record names (SLICE-11 step 11); PRF-OPS-09's record exists (independent outage assessment and protection status proved first, `README.md:1187`, `:1256`); no owner-only item is unbound (licence, account, limits, lease store, backup destination). The shadow days and their defect counts are listed for the owner; no count is checked | No |
| `CUTOVER_AUTHORIZED` | The owner's word is recorded: who, when, which release, the account scope (Q-005: the current account), the instruction text, and the owner's statement of legacy's `risk_guard.kill_switch` value (below) | No |
| `OBSERVER_READY` | The candidate's observation route runs from the staged release and has passed its handshake and one book read: the native read-only credential if TASK-S07-06 proved one, otherwise the mediator (`at-observer`) with the account's current key, which the owner installs as its credential. It may already run from SLICE-13 step 7; either way it was started on the owner's word | The route only |
| `LEGACY_QUIET` | The activation boundary holds (the configuration spec's Fork call: market confirmed closed, no position, no working order, nothing unsettled, held or pending), checked against fresh books through the observation route and against legacy's stores read-only, with legacy's own refusal list (`src/tier1/cutover.py:155-209`): unsettled registry orders, held reservations, pending structure commands, a legacy sender alive | No |
| `LEGACY_STOPPING` → `LEGACY_STOPPED` | Legacy's units stopped in legacy's order (timers first, the strategy, the rest, the authority last; `deploy/deploy_tier1.py:575-604`), the stopped set recorded before each stop | Yes |
| `LEGACY_QUIET_AFTER_STOP` | The boundary again on fresh books (freshly reconciled). A refusal restarts legacy's recorded set unchanged and ends `FAILED` | Yes, back to legacy on refusal |
| `LEGACY_WRITER_GONE` | Legacy's authority unit is inactive with no process, legacy's sender lease names no live process (`src/tier1/cutover.py:203-205`), and every legacy unit that can reach the broker is masked (the authority, gateways, strategy and its timer, monitors that hold the key) | Units masked |
| `CAPTURE_PINNED` | `IMPORT_BOUNDARY_PINNED` for every legacy store; with legacy stopped the capture is consistent | No |
| `HISTORY_TRANSFERRED` | The route TASK-S13-01 chose has run into a new production ledger at a path where no ledger exists (an earlier attempt's ledger was set aside, below): accounting complete for every source, no authoritative record quarantined, the same-boundary validation clean | The new ledger only |
| `CREDENTIAL_ROTATED` | The owner has replaced the account's OpenAlgo key and attests when. The installer stops the observation route; the owner installs the new key as the credential of the kernel, the market process and, when the route is the mediator, `at-observer` (`LoadCredential=`); a native read-only credential is re-issued if the replacement invalidated it (**not checked** whether it does); the route restarts and passes its handshake and one book read with the new key. The old key now lives only where it already was: legacy's settings file and any copy of it, including legacy's own backups of that file (`deploy/offbox_backup.py:153`), and OpenAlgo refuses it everywhere. The installer never reads or prints a key | Credentials; the route restarts |
| `KEY_PROBED` | A one-shot probe confirms OpenAlgo refuses the old key (below) | No |
| `GENESIS_SEALED` | `MIGRATION_GENESIS` is committed in the new ledger with the digests of the import manifests, the pinned boundary, the fresh books, the release receipt and the projection heads (legacy's genesis, `src/tier1/cutover.py:100-147`), and in the same transaction the carried safety state (below) | The new ledger only |
| `BACKUP_ANCHORED` | A recovery set of the new ledger is taken, uploaded, anchored at the destination and read back (`operations.backup`), so the first head the kernel will build on is anchored off the host before any advance | No |
| `QUIET_BEFORE_SWITCH` | The boundary once more | No |
| `SWITCHED`, `OBSERVERS_STARTED`, `MARKET_STARTED`, `KERNEL_STARTED` | As the configuration spec's transitions; at `SWITCHED` the route started at `OBSERVER_READY` is stopped and started again under `current`. The kernel's first epoch has no predecessor, so the routine advance declines and the kernel waits in `RECOVERY_WRITING`; its first observation of the books must show the account flat | Yes |
| `LEGACY_FENCED` | The owner records `OLD_HOST_FENCED` through `recovery.record_fence` naming legacy (`old_host: legacy:<host_id>`, `old_host_state: stopped`, the method "units stopped and masked; key replaced; old key refused by probe", `credential_rotated_at`, the digest of a book observed after the key change, and `accounted`) | The ledger |
| `ADVANCED` | A human `RECOVERY_ADVANCED`, which takes the account's lease. The kernel itself refuses it without `LEGACY_FENCED`'s event (below), whichever route the request comes by | The kernel may send |
| `STARTED` → `CONVERGED` | The strategy host, the operator relay and the timers start; convergence per operation | Yes |
| `FAILED` | A refusal before `CREDENTIAL_ROTATED`: legacy's recorded set is restarted on its unchanged key (before `LEGACY_WRITER_GONE`), or left masked for `continue-legacy` (after it) | — |
| `FAILED_AFTER_ROTATION` | A refusal at or after `CREDENTIAL_ROTATED` and before `ADVANCED`: the target cannot send (no advance), legacy is masked and holds a refused key, the account is flat. The installer alerts and stops; the owner chooses `--resume` (after fixing the cause) or `continue-legacy` | — |

* **The key probe** (`KEY_PROBED`). One transient unit through `scripts/isolated_work.py`, running as legacy's application user (the only user that can read legacy's settings file), with network access to the deployed OpenAlgo only: it reads the old key from that file in memory, makes one call to a read-only endpoint of the account's TASK-S07-05 contracts (for example the funds book), and records only the HTTP status and OpenAlgo's error class, never the key or the response body. An authentication refusal passes; anything else is `FAILED_AFTER_ROTATION`. It runs on the cutover word only. If the owner prefers not to have code read legacy's settings file, the state records the owner's attestation instead, labelled `attested, not probed`, and PRF-SES-07 is then attestation evidence only.
* **Carried safety state** (**Fork call**: legacy's engaged safety state stays engaged across the switch). Legacy's cutover checks neither its kill inputs nor holds (`src/tier1/cutover.py:155-209`), and its importer turned them into legacy events only (`src/tier1/importer/authority-map.md:30-31`, `:35`). In the target, imported events are evidence, so engaged legacy state would be lost. The genesis transaction therefore records, with principal the authorizing owner and reason `carried_from_legacy`:
  * `kill_engage` when legacy's kill file exists, or when legacy's `risk_guard.kill_switch` flag is on (the flag is configuration, not a file, `src/tier1/importer/sources.py:120-122`; it is read from legacy's configuration files read-only, and because an environment override would sit in legacy's settings file, which the installer does not read, the owner states its value in the cutover word);
  * `hold_engage` for each `holds/<strategy>.json` that reads as held, including a torn or unreadable file, which legacy reads as held (`src/tier1/importer/authority-map.md:31`);
  * a pause with the same scope and expiry for each AI-management pause not yet expired (row 10, `src/tier1/importer/authority-map.md:35`);
  * the latch for each latched loss-latch file of a day not yet over.

  Releasing them is the owner's ordinary action afterwards (Q-014). The cutover request tells the owner that after the switch touching or deleting `run/KILL` no longer does anything; the target's kill is the operator command (SLICE-10).
* **Strategy authority** (**Fork call**). BuyerEdge's standing binding in the new ledger must carry the authority legacy's live registry row gives it (`RUN/strategies/strategies.json`, row 8); the cutover reports the row and refuses `GENESIS_SEALED` when the owner's binding differs, unless the owner's word names the difference. The row is reported, never changed.
* **The old-route retirement marker** is derived from the ledger and recorded off the host. The old route is retired from the commit of the first `DISPATCH_CLAIMED` after `MIGRATION_GENESIS` in the production ledger (ATA-03, `README.md:1203`; legacy's rule, `src/tier1/cutover.py:12-16`, `:55-57`); because it is one event, no crash can separate the first attempt from the retirement. The kernel host then writes the write-once `RouteRetirement` record to the lease store ([adapter](#the-send-lease-store-adapter-adapterslease_storepy)), so a ledger restored from before that claim still shows the route retired. Legacy's own `LEGACY_RETIRED.json` is never written (no write to a legacy store); legacy's route is held incapable by its masked units and, decisively, by the replaced key.
* **Going back before the first attempt** (`deploy/install.py continue-legacy --reason TEXT`, legacy's `continue_legacy`, `src/tier1/cutover.py:82-97`, `src/tier1/activation.py:177-190`). It refuses when any of these holds: a `DISPATCH_CLAIMED` after genesis in the ledger; a `RouteRetirement` record for this ledger; a restore marker or `RECOVERY_GAP` after genesis; the lease store or the backup destination unreachable, or a counting lease head or backup anchor of this ledger not contained in the file (a copy may lack a claim); the boundary not quiet on fresh books. Otherwise, in order:
  1. stop every target unit and verify none has a process left; **mask** every target unit;
  2. remove the target's credentials: the credential files of the kernel, the market process and the mediator are unlinked from their credential directories, never read;
  3. with the kernel stopped, open the ledger through the migration composition and record `ROLLBACK_CONTINUATION`; from that event on, the kernel refuses every `RECOVERY_ADVANCED` in this ledger, human or routine (a kernel-side check, built in SLICE-14 step 1, below);
  4. `cas` each account's lease from the target's last state to `released: abnormal` with the final head, so the routine check 6 fails even before the kernel reads the ledger (sessions spec);
  5. unmask legacy's units. Before `CREDENTIAL_ROTATED` was ever reached, the installer restarts legacy's recorded set, whose key still works. After it, the installer stops here: legacy's restart is the owner's key action (the owner puts the current key into legacy's settings file and starts legacy), since the installer never handles a key.

  A target restarted by hand afterwards has no credential, its units are masked, and its kernel refuses to advance: there is never a second writer.
* **A retry after a failed or continued attempt** starts a new ledger. The earlier attempt's ledger is set aside with its WAL files, renamed with a timestamp, never deleted (legacy's `set_aside`, `src/tier1/activation.py:72-83`; legacy refuses a first cutover over an existing ledger, `:128-129`), and the retry walks every state again from `CUTOVER_STAGED`.
* **After the first attempt** `continue-legacy` refuses and prints what rollback now means: a compatible older target bundle over the current ledger (configuration spec), never legacy (legacy's equivalent text, `deploy/deploy_tier1.py:1561-1570`).
* **No flattening, ever.** The cutover issues no order verb; a non-flat boundary refuses and defers the cutover (`README.md:456`).
* **The fence and the continuation are enforced in the kernel**, not only by the installer, because a human `RECOVERY_ADVANCED` can also arrive through the operator relay. SLICE-14 step 1 adds to `kernel/recovery.py` (a sessions-spec module change, reported to its owner as two new fence-rule triggers): an epoch of a ledger holding `MIGRATION_GENESIS` needs an `OLD_HOST_FENCED` recorded after the genesis before any advance; a ledger holding `ROLLBACK_CONTINUATION` refuses every advance. Both are completion conditions of that step and rows of PRF-MIG-13.

### Continuity across later releases (REQ-MIG-008)

* Under the first release's activation boundary (configuration spec Fork call) every release change happens flat, so the outstanding-obligation set at a release change is empty; `compatible` and the obligation-continuity check (`CFG-R11`) still run.
* Kernel restarts and session transitions do happen over open obligations: protection keeps each obligation's bound semantics across them (PRF-PRT-12, protection spec), and recovery reports unrunnable legs (`kernel.protection.unrunnable_legs`).
* In-session releases over open obligations (Combined-F6, `README.md:909`) stay a listed spec-only improvement for the owner.

### Records this spec keeps

`docs/migration.md` keeps: the consumer list of each projection and each consumer's retirement; the shadow days and their defect counts; the import runs and their accounting; the conversion decision's pointer into `docs/decisions.md`; the D10 rehearsal records; the cutover record with every state's facts; the old route's retirement (the sequence of the first claim).

## Failure modes and crash points

| Point | What happens | Recovery |
|---|---|---|
| CP-B1: backup killed while copying the ledger | Staging holds a partial copy; no manifest | The next run starts over; staging is deleted at start |
| CP-B2: killed after the manifest, before upload | Local set only | The next run uploads or rebuilds; the destination's newest set is unchanged |
| CP-B3: killed after upload, before the anchor | Set present at the destination without its anchor | The next run writes the anchor for the newest verified set |
| CP-V1…CP-V7: restore killed in each state | The restore log shows the last `done` | `restore --resume` re-checks the facts and continues; a partial ledger target is moved aside |
| CP-I1: import killed inside a batch | The batch's transaction rolls back | Resume reads what the ledger holds and imports the rest |
| CP-I2: import killed between sources | Some sources complete | Resume continues; the boundary is unchanged, or the change is reconciled explicitly |
| CP-X1: cutover killed after `LEGACY_STOPPED` | Legacy stopped, nothing switched | `--restore` restarts legacy's recorded set; `--resume` re-runs the check |
| CP-X2: killed after `LEGACY_WRITER_GONE`, before `CREDENTIAL_ROTATED` | Legacy masked with its key still valid; the new ledger may hold a partial import | `--resume` finishes the import from the ledger's own record; or `continue-legacy` unmasks legacy and restarts its recorded set (its key still works), and a later retry sets the partial ledger aside, never deleting it (legacy's `set_aside`, `src/tier1/activation.py:72-83`) |
| CP-X2a: killed at or after `CREDENTIAL_ROTATED`, before `ADVANCED` | `FAILED_AFTER_ROTATION` on resume: legacy masked with a refused key; the target not advanced; the account flat | `--resume` continues from the recorded facts; or `continue-legacy` unmasks legacy and stops, and the owner re-keys and starts legacy |
| CP-X3: killed after `SWITCHED`, before `ADVANCED` | New units may run; the kernel cannot send | `--resume` starts the rest; `continue-legacy` still allowed, and masks the target, removes its credentials and records `ROLLBACK_CONTINUATION` |
| CP-X3a: `continue-legacy` killed between its steps | Target units stopped or masked, credentials partly removed, the continuation possibly recorded | Re-running it repeats each step idempotently (stop, mask, unlink, the event's guard, the lease `cas` from its current value); the kernel cannot advance once `ROLLBACK_CONTINUATION` is recorded |
| CP-X4: killed just before the first claim commits | No `DISPATCH_CLAIMED` | Going back is still allowed, subject to the lease and restore checks |
| CP-X5: killed just after the first claim commits | The claim is recorded; the request may or may not have left; the `RouteRetirement` record may not be written yet | The old route is retired (the claim is in the file); the restarted host writes the record on its first pass; the attempt is resolved by recovery and reconciliation, never resent |
| CP-X6: the production ledger restored from a copy taken after genesis and before the first claim, after the live kernel had sent | The restored file has no claim | `continue-legacy` refuses: the `RouteRetirement` record exists, the file carries a restore marker after genesis, and the lease head is not in the file |
| F-M1: an authoritative legacy record quarantined | The cutover refuses at `HISTORY_TRANSFERRED` | A person resolves it with a recorded reason |
| F-M2: a recovery-set object missing | A gap in the manifest | Only the dependent operation or claim is limited |
| F-M3: the lease store unreachable at start | No anchor from it | The latest backup anchor; human advance only |
| F-M4: the shadow's copier falls behind | The shadow's head lags | The comparison waits for its head to reach the boundary, or reports the day incomplete |
| F-M5: a projection write fails | `repair_scheduled` | Rebuilt from the sidecar's sequence; never resent |
| F-M6: the old key still works after "rotation" | The key probe gets no authentication refusal | `FAILED_AFTER_ROTATION`; `LEGACY_FENCED` is not recorded; the owner replaces the key again |
| F-M7: a restart after a restore and before the advance | The dead kernel's lease head is not in the restored file | It is superseded by the restore's record, so the file opens; any other unmatched head still refuses (`LED-R11`) |

## Risks and limits

* **The key replacement is the real fence.** Masked units can be unmasked by any administrator; OpenAlgo refusing the old key, checked by the probe, is what stops a forgotten copy of legacy, on this host or a clone. It depends on OpenAlgo issuing one key per user (runtime spec), which a future OpenAlgo could change. After the replacement the new key exists in three places (the kernel, the market process and, with the mediator, `at-observer`) and in the owner's own custody; the probe is the one moment code reads legacy's settings file, and it records no key.
* **The shadow sees legacy's records, not the broker.** It proves the target decides and accounts as legacy did on the same inputs; it does not prove the target's adapter against the broker (SLICE-07's captured contracts and the first live session do).
* **Copy cadence.** The in-session shadow lags legacy by up to one copy interval; the end-of-day comparison does not depend on it.
* **Restore loses the day's ledger events after the last backup** (RPO one day, POL-047's cadence). The lease head bounds what was lost; the broker books rebuild positions, not the decisions behind them.
* **OpenAlgo's copied databases hold its auth tables.** They are in the off-host set (POL-047); the destination's encryption and the owner's custody of it are the protection (POL-O01).
* **Legacy's registry may not record every fill quantity** the responder needs (not checked); the in-session shadow is then provisional until the end-of-day pass.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `backup.destination` | Where recovery sets and backup anchors go (restic repository, its credential reference, the passphrase's off-box custody) | Refusing; owner only (POL-O01, open) |
| `backup.retention` | How many sets the destination keeps | Refusing; owner only, with POL-O01 |
| `backup.openalgo.container`, `.databases`, `.db_dir` | OpenAlgo's databases to snapshot | Deployment configuration; legacy's defaults `openalgo.db`, `sandbox.db`, `/app/db` as evidence (`deploy/offbox_backup.py:664-696`) |
| `recovery.lease_store` | The lease store's adapter kind and location (configuration spec's row) | Refusing; follows POL-O01 |
| `recovery.rto_secs` | Restore-time objective (runtime spec's row) | Owner only; unbound, reported "not judged" (POL-047) |
| `migration.scope` | Accounts the cutover covers | The current account (Q-005) |
| `migration.batch_records` | Records per import transaction | Engineering default chosen at build; not a money value |
| `paths.shadow.root`, `shadow.legacy_run_dir`, `shadow.legacy_market_dir` | The shadow's own root and legacy's read-only inputs | Deployment paths; the shadow root refused inside any production or legacy root |
| `shadow.copy_interval_secs` | Copier cadence | Refusing; measured (legacy's feeder 30 s as evidence) |
| `paths.compat`, `compat.projections` | Projection root and enabled formats | Deployment path; `[orders/1]` |

## Reuse evidence

* **Backup/release/restore: reuse/prove** (`README.md:1159`). Kept: restic and its read-back rule, the OpenAlgo snapshot through its container, the nightly timing, the no-broker-key unit (`deploy/offbox_backup.py:1-47`, `:682-735`; `deploy/systemd/at-backup.service`; `deploy/systemd/at-backup.timer`), the ledger snapshot by the backup API, restore into an empty target, the fingerprint and the fence rule (`src/tier1/recovery.py:117-209`), the clean-host comparison (`deploy/rehearse_clean_host.py:1-17`). Not inherited: the live ledger copied as files inside the run directory, `.env` in the set, no off-host anchor.
* **Gateway/JSONL registry: refactor ownership, compatibility projection** (`README.md:1146`). Kept: legacy's importer (sources, record digests, manifest, scan-and-resume, anomalies; `src/tier1/importer/`), its shadow feeder's shape (`src/tier1/shadow.py:1-21`), its comparator's defect-or-migration rule (`src/tier1/compare.py:1-22`), its cutover order (`src/tier1/activation.py:123-152`), genesis (`src/tier1/cutover.py:100-147`), the continuation-until-first-attempt rule (`src/tier1/cutover.py:82-97`). Not inherited: writing the retirement marker into the legacy run directory, the registry written before each send.

## Alternatives considered

* **Restore the old live system's way: restic over live files.** Rejected: a WAL database copied as files is not a consistent state (`README.md:782`).
* **Litestream continuous replication.** Deferred by POL-047; it would shorten the RPO but adds a running replicator and a second restore path.
* **A shadow that calls OpenAlgo read-only for its own market data and books.** Rejected for the shadow kernel: it would need a broad key on a non-production participant (A06-F2) and add load on the account legacy is trading; the shadow reads legacy's records instead. The supervisor's PRF-OPS-09 run uses the observation route, which exists for exactly that.
* **Write `LEGACY_RETIRED.json` into legacy's run directory, as legacy's own cutover did.** Rejected: no write to a legacy store (REQ-MIG-003); the masked units and the replaced key retire the route more strongly, and the target's marker is derived from its own ledger.
* **Import open obligations to cut over in session.** Excluded by ATA-03.
* **Choose the import route now.** Rejected: AUD-05 requires the comparison on actual mappings first.

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-MIG-01 | T | `tests/recovery/test_recovery_set.py` (T-92) | A backup under a committing kernel subprocess restores to a consistent head (backup API); the manifest names the ledger head and schema, every evidence object up to the head with its digest, the bundle and settings identities, the authorization source, OpenAlgo's snapshot integrity; a missing evidence object is a gap and the set is still taken; no credential file, scratch, telemetry or projection is in the set; the backup holds no broker credential name in its environment; the recovery-set clauses of the A04 acceptance row (`README.md:1242`) | the copy is torn, an object is missing unreported, or a secret file is copied |
| PRF-MIG-02 | T | `tests/recovery/test_recovery_set.py` | Each restore state's refusal rows: a changed object, a missing ledger, an existing target, a head differing from the manifest, an incompatible bundle (`CFG-R09`), stale custody when composed; the restore killed at each state resumes from its facts; `READY` leads to `RECOVERY_WRITING` with the restore marker and the gap, never `OPERATING` | a restore overwrites, trusts a record without checking, or grants activation |
| PRF-MIG-03 | T | `tests/recovery/test_restore_fencing.py` | The directory adapter under two processes: concurrent `cas` with one `expected` gives one winner; `now` is the store's; a timeout is unreachable; `put_once` lands once; a production composition refuses it unless its root is named off-host. Anchors: an ordinary start on a file truncated below the lease head refuses with `LED-R11`; a restore start is anchored to the set's head; a restart after a restore and before the advance opens the restored file although the dead kernel's lease head is not in it (superseded), while a head of an epoch neither in the file nor superseded still refuses; no reachable anchor lists `anchor_unavailable` and the routine advance declines | two holders, a local lease store accepted in production, a short file opens, or a restored file refuses forever |
| PRF-MIG-04 | T | `tests/recovery/test_recovery_set.py` running `scripts/verify_recovery.py synthetic` | Each D10 check of the synthetic rehearsal: exact artifact, crashes, unresolved effects ambiguous and not resent, equal fingerprints, refusal before fencing, a second ledger copy refused the lease; the synthetic half of the D10 row (`README.md:1232`) | any check passes by assumption |
| PRF-MIG-05 | M | rehearsal record | On the owner's word, after POL-O01: a real set restored with the exact candidate artifact and schema on an isolated clean host, every check of PRF-MIG-04 recorded with its result and the duration (SLICE-11 step 11) | the rehearsal ran another artifact, or a failed check is recorded as passed |
| PRF-MIG-06 | T | `tests/contracts/test_legacy_schemas.py` | Every reader over the generated legacy fixtures (T-93): records, digests of the raw bytes, deferred trailing lines, chain verdicts as legacy's rules give them, absence as state for snapshots; reading leaves every fixture file's bytes, mode and modification time unchanged and takes no lock; no reader imports a legacy module | a reader writes, guesses a torn line, or loses bytes |
| PRF-MIG-07 | T | `tests/contracts/test_legacy_schemas.py` | Per source `seen = transferred + rejected + quarantined + after_boundary`; an interrupted batch and a repeated run import nothing twice; a changed imported line is an anomaly and stops that file; a changed boundary is recorded, not continued; an unknown authoritative kind is quarantined with its bytes and blocks `HISTORY_TRANSFERRED`; views rebuilt from imported events equal independent expectations at the boundary; the import half of the A02-F4/F5 row (`README.md:1227`) | a record is dropped, duplicated or given an invented meaning |
| PRF-MIG-08 | R | decision record in `docs/decisions.md` | The upgrade-versus-import decision names the route, the full mapping table, each criterion's measured result, the rejected route's reason, and confirms or replaces `001_initial.sql` (X-002) | a route is chosen without the mapping or the reason |
| PRF-MIG-09 | T | `tests/contracts/test_legacy_schemas.py` | `orders/1` from a synthetic target history folds, by legacy's documented fold rule applied in the test, to the same per-order state as golden lines legacy's writer produced for the same history (T-93); each line names its format and source sequence; no module under `kernel/`, `strategies/` or `market/` imports a projection reader | a consumer's fold differs, or a decision path reads a projection |
| PRF-MIG-10 | T | `tests/integration/test_shared_engine.py` | On synthetic legacy and shadow heads: each comparison row detects a planted difference; a difference matching an owner-answer row's condition and expected values is reported as a migration with its reference; the same kind of difference outside the condition, or with another value, is a defect; a planted agent-written Deviation on a compared row is a defect; the approved table holds no row without an owner-answer reference; unpaired heads are refused; one early divergence is reported once with its consequences linked; no code path counts shadow days or refuses on them; the shadow clause of `README.md:1199` | a difference passes silently, a defect is reported as approved, or a row without an owner answer approves anything |
| PRF-MIG-11 | T | `tests/contracts/test_capabilities.py`; the copier's rows on Linux with systemd | The shadow composition imports no order adapter, HTTP client or socket library in the kernel and responder; it refuses to start with any broker credential name in its environment; its paths refuse inside production or legacy roots; `LegacyOutcomeResponder` answers `not_sent` to an unmatched command. The copier, started as a stand-in for legacy's user beside a stand-in process of that user carrying a fake key in its environment: sees no other process and cannot read that environment or trace it; cannot open the stand-in settings file, the OpenAlgo snapshot directory or a socket under the run directory; cannot write any legacy path; opens no socket; and refuses to start when any lockdown property is unenforced | the shadow can construct a sender, or any shadow process can read a key or write a legacy store |
| PRF-MIG-12 | M | shadow record | Class D on production: shadow days with their head pairs and reports; the import rehearsal's accounting each night; the nightly read's effect on legacy's commit latency recorded; every defect listed with its cause or open | a day's defects are left unreported |
| PRF-MIG-13 | T | `tests/recovery/test_initial_cutover.py` (T-95) | In the installer's rehearsal mode with a fake `systemctl`, a simulated broker and synthetic legacy stores: refusal on an open position, a working order, an unsettled registry order, a held reservation, a pending command, a live legacy sender, each alone, before and after the stop (a post-stop refusal restarts legacy's set); refusal at `CUTOVER_STAGED` without PRF-OPS-09's record; refusal at `HISTORY_TRANSFERRED` with a quarantined authoritative record; refusal at `KEY_PROBED` when the stand-in OpenAlgo accepts the old key; refusal before `QUIET_BEFORE_SWITCH` without `BACKUP_ANCHORED`; each state killed and resumed, with `FAILED_AFTER_ROTATION` reached from every state after the key change; a direct human `RECOVERY_ADVANCED` sent to the kernel (not through the installer) refused without the legacy fence; `continue-legacy` allowed with no claim and refused after the first `DISPATCH_CLAIMED` (including when killed just after that commit), when the `RouteRetirement` record exists, after a restore marker or gap after genesis, and when the lease head is not in the file; after `continue-legacy`, the target's units are masked, its credential files gone, its lease `abnormal`, and a kernel restarted by hand refuses every advance, routine or human; a retry sets the old ledger aside and starts a new one; legacy's kill file, kill flag, held and torn holds, unexpired pauses and the day's latch carried; no order verb issued by the cutover; the ATA-03 row (`README.md:1253`) | a non-flat scope activates, the cutover flattens, two writers can exist after going back, or legacy can be reactivated after the first attempt |
| PRF-MIG-14 | M | cutover record | On the owner's word: every cutover state's facts on the production host, the import accounting, the key probe's recorded status (or the owner's attestation, labelled), the genesis digest, the anchored backup of the new ledger, the fence evidence, the human advance, convergence, and the sequence of the first claim with its `RouteRetirement` record; the operational acceptance row (`README.md:1256`) | any state is skipped or a fact is missing |
| PRF-MIG-15 | T | `tests/recovery/test_release_continuity.py` | A release change with an open position refused before any stop (`CFG-R13`); kernel restarts and a session transition over a partial fill, an uncertain cancel and active protection keep each obligation's semantics and command identity, with a late fill and a crash at the handoff; with the boundary check disabled in a test-only composition, a bundle that cannot run a live leg refuses (`CFG-R11`); the Combined-F6 row (`README.md:1255`) as far as the first release allows | an obligation changes semantics or identity across a restart or session |
| PRF-MIG-16 | T | `tests/recovery/test_release_activation.py` | `scripts/check_release.py` and the installer judge convergence from the same facts; a participant of another bundle is reported; a stale `RELEASE_BOUND` is reported; the script opens no store for writing | the check reports converged when the installer would not |
| PRF-MIG-17 | T | `tests/recovery/test_recovery_set.py` | A set taken before a synthetic session's later activity, restored: `RECOVERY_GAP` from the set's head to now with the superseded lease head recorded; claimed attempts `AMBIGUOUS`; the books recorded `rebuilt`; broker orders inside the gap listed unadopted; nothing resent; a kernel restarted before the advance reopens the restored file; advance refused until fenced | an order inside the gap is adopted or resent, or the restored kernel cannot restart |

PRF-LED-06 (the projection rebuilt after CP-L4) is the [ledger spec's](ledger-and-atomic-transaction.md#failure-modes-and-crash-points), delivered with SLICE-13. PRF-SES-07 (cross-host fencing in the real deployment) is the [sessions spec's](sessions-authority-lifecycle.md#send-lease-kernelrecoverypy), delivered with SLICE-14. PRF-OPS-09 (the supervisor against the shadow ledger) is the runtime spec's, delivered with SLICE-13.

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-11 | Step 8: the recovery set, backup, restore verification, anchors, the lease store adapter, the synthetic rehearsal, `operations.deployment`'s log and convergence (with step 7's installer) and `scripts/check_release.py`. Step 11: the real rehearsal | PRF-MIG-01…04, PRF-MIG-16, PRF-MIG-17; PRF-MIG-05 |
| SLICE-13 | Legacy readers, the importer, the conversion decision, the `orders/1` projection, the shadow composition and comparison, the shadow on production, in the [slice file's steps](../plan/slices/SLICE-13-disarmed-shadow-and-conversion.md#steps) | PRF-MIG-06…12; PRF-LED-06; PRF-OPS-09 |
| SLICE-14 | The cutover states, the kernel-side fence and continuation checks, the `RouteRetirement` record, continuity proofs, the cutover rehearsal on copies (owner's word), the production cutover, in the [slice file's steps](../plan/slices/SLICE-14-initial-cutover.md#steps) | PRF-MIG-13…15; PRF-SES-07 |
