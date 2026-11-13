# SLICE-14 — Initial cutover

* **Status:** proposed (2026-10-30); not yet reviewed by fresh EGM design and implementation-readiness reviewers. Every step below is an outline: by the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30), each step's exact detail is written just before it is built, then reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [migration spec](../../design/migration-recovery-rollback-continuity.md#the-initial-cutover-operationsdeploymentpy), with the [configuration spec's](../../design/configuration-artifacts-release.md#release-transitions) release transitions and activation boundary and the [sessions spec's](../../design/sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy) fence rule and send lease. Every money-touching fork keeps legacy's live behaviour and is marked **Fork call** ([table](#fork-calls)); every other difference from legacy is marked **Deviation**.
* **Phase:** master Phase 7 (`README.md:1187`): ATA-03, D10, A04-F2 across hosts, Combined-F6. Environment class S for steps 1 and 2. Step 3 runs the real installer and kernel on the production host against the shadow's copies; it changes nothing that trades, but it is not covered by the shadow's pre-approval and the owner did not pre-approve it ([combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30)), so it **needs the owner's word**. Steps 4 and 5 are production-sensitive (class P) and **need the owner's word**. **The cutover is never automatic:** no command, timer or agent starts step 4.
* **Builds on:** SLICE-01…SLICE-13 as the first-release composition needs them (Q-005), with SLICE-11 step 10 (the candidate staged on the production host) and step 11 (the D10 rehearsal of that candidate, `README.md:1201`) done on the owner's word, and SLICE-13's shadow having run the same `bundle_digest`. The branch `slice-14` is cut from the latest built slice on `agentic-desk`.
* **Owner answers applied:** [Q-005](../../decisions/owner-questions.md#q-005) (BuyerEdge on the current account: the cutover's scope); [Q-009](../../decisions/owner-questions.md#q-009) (routine restarts resume automatically; the cutover's first start is not routine and waits for a human advance); [Q-014](../../decisions/owner-questions.md#q-014) (who may release a carried kill or hold); the [combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30) (one or two clean end-to-end shadow days are enough, and nothing counts them; the licence, POL-O01 and POL-047 block only production staging, the real restore and this cutover); the standing rules (fork rule; the cutover is asked first). **Open, behind refusing settings:** the licence (`release.license`, production staging refuses), the backup destination (POL-O01) and with it the lease store (`recovery.lease_store`; a production kernel cannot advance without it), the RTO and failover authority (POL-047; the rehearsal's duration is "not judged").
* **Tasks and proofs:**
  * **Step 1:** TASK-S14-01: PRF-MIG-13.
  * **Step 2:** TASK-S14-02: PRF-MIG-15.
  * **Step 3 (owner's word):** TASK-S14-03: the cutover rehearsal record.
  * **Step 4 (owner's word):** TASK-S14-04: PRF-MIG-14, PRF-SES-07.
  * **Step 5 (owner's word):** TASK-S14-05: the retirement record in PRF-MIG-14.

**In plain words.** This slice is the evening the new system takes over from the old one, and everything needed to make that evening safe and undoable until the new system's first order. Step 1 builds the cutover as a recorded, resumable list of states: check that nothing is open at the broker or unsettled in the old system's files, stop the old system in its own order, check again with fresh broker books, lock its services so they cannot start, move the history into the new ledger with every record counted, have the owner replace the broker key so the old system's key stops working anywhere, check that the old key is really refused, seal a record of all of it, back up and anchor the new ledger, start the new system, and wait for the owner to confirm the old system is shut out and to give the go; the kernel itself refuses the go without that confirmation. It also carries over a kill switch, hold, pause or loss latch the old system had on. Going back before the first new order shuts the new system out the same way: its services are locked, its key removed and its ledger can never give the go again. Step 2 proves that open positions keep their protection across later restarts and sessions. Step 3 runs the whole evening on copies, on the owner's word, with nothing that trades touched. Step 4 is the real cutover, only on the owner's word. Step 5, after the first trading day, records the moment the old route was retired for good and points the old reports at the new order file. Until the new system's first order, the owner can go back to the old one; after it, only to an older release of the new one.

**Excluded, and where each part arrives:**

* **SLICE-11:** staging the candidate on the production host (step 10) and the D10 rehearsal (step 11), each on the owner's word; the installer's release transitions this slice extends; the production lease store adapter, built once POL-O01 is answered.
* **SLICE-13:** the importer, the conversion route and the shadow; this slice runs the importer once more, at the cutover boundary.
* **SLICE-12 and the owner:** the research custody move (research is deferred in the first release).
* **Integration edits outside this file and the spec,** made when step 1 is reviewed: the [sessions spec](../../design/sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy) (the two fence-rule triggers this slice builds in `kernel/recovery.py`: a fence after `MIGRATION_GENESIS`, and no advance in a ledger holding `ROLLBACK_CONTINUATION`; `RECOVERY_GAP.superseded_heads`); the [runtime spec](../../design/runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy) (`kernel/host.py` writes the `RouteRetirement` record after the first claim); the [ledger spec](../../design/ledger-and-atomic-transaction.md) event catalogue and `resources/events.schema.json` (`MIGRATION_GENESIS`, `ROLLBACK_CONTINUATION`; the carried kill, hold and latch reasons); the [runtime spec](../../design/runtime-isolation-observability-deployment.md#installer-deployinstallpy) installer commands (`cutover`, `continue-legacy`); the module index (T-95); the traceability rows; the delivery plan's SLICE-14 row and task rows.

## Steps

| Step | Builds | Class | Proofs |
|---|---|---|---|
| 1 | The cutover states in `operations/deployment.py` and the `cutover` and `continue-legacy` commands of `deploy/install.py`, including `OBSERVER_READY`, the observation route's re-key at `CREDENTIAL_ROTATED`, `KEY_PROBED`, `BACKUP_ANCHORED` and `FAILED_AFTER_ROTATION`; legacy's refusal list over legacy's stores; masking; the carried safety state and the strategy-authority check in the genesis; the derived retirement and the `RouteRetirement` record (`kernel/host.py`); `continue-legacy`'s refusals, target masking, credential removal, `ROLLBACK_CONTINUATION` and the `abnormal` lease; setting aside an earlier attempt's ledger; the kernel-side fence and continuation checks in `kernel/recovery.py` | S (rehearsal directory, fake `systemctl`, simulated broker, step 1 fixtures of SLICE-13) | PRF-MIG-13 |
| 2 | The continuity proofs of REQ-MIG-008 over the built kernel and installer | S | PRF-MIG-15 |
| 3 | **Owner's word.** The whole cutover walked in rehearsal mode on the EC2 against the shadow's copies of production legacy stores, isolated as step 3 says, with the copied books standing in for the broker and a fake `systemctl`; the go-back walked from two points | D (owner's word; nothing that trades is touched) | Rehearsal record |
| 4 | **Owner's word.** The production cutover, `CUTOVER_STAGED` to `CONVERGED`, with the owner's key replacement, fence and advance | P | PRF-MIG-14, PRF-SES-07 |
| 5 | **Owner's word.** After the first session: the first claim's sequence and the `RouteRetirement` record confirmed as the old route's retirement; legacy's retained tools pointed at `paths.compat`, each running keyless with no broker network; legacy's run directory kept read-only in the recovery set | P | PRF-MIG-14 (retirement part) |

**Why this order.** Step 1 is the code of the cutover; step 2 proves the release machinery it reuses keeps obligations whole; step 3 proves the whole evening on real data without risk; step 4 does it; step 5 can only follow a first trading day. Step 2 may be built in parallel with step 1 by a second agent owning `tests/recovery/test_release_continuity.py` only.

## Fork calls

The owner's fork rule keeps legacy's live behaviour wherever a choice touches who may send, entries, exits, stops or limits. Each call is for the owner's review; the improvement column is listed, not built.

| # | Choice | Legacy at 445eb116 | First release | Listed improvement |
|---|---|---|---|---|
| 1 | When the cutover may happen | Legacy's own cutover refused a session that is not confirmed closed, an open position, a working order, an unsettled registry order, a held reservation, a pending cancel, close or protection command, a live legacy sender, or an unsealed genesis (`src/tier1/cutover.py:155-209`), checked before anything stopped, after the stop (restarting the stopped set on refusal) and again after the code moved (`deploy/deploy_tier1.py:16-46`) | The same list, read through the observation route and legacy's stores, at `LEGACY_QUIET`, `LEGACY_QUIET_AFTER_STOP` (refusal restarts legacy's recorded set) and `QUIET_BEFORE_SWITCH`, plus the configuration spec's boundary; no flattening, a refusal defers the cutover (ATA-03) | — |
| 2 | Safety state at the switch | Legacy's cutover did not check its kill inputs or holds (`src/tier1/cutover.py:155-209`); kill is a configuration flag and a file (`src/tier1/importer/authority-map.md:30`; the flag is not imported, `src/tier1/importer/sources.py:120-122`), a torn or missing hold file reads as held (`src/tier1/importer/authority-map.md:31`), AI-management pauses block AI-reviewed entries (`:35`), and the importer kept all of them only as legacy events | Recorded as native events in the genesis transaction, reason `carried_from_legacy`: kill when legacy's kill file exists or its `risk_guard.kill_switch` flag is on (the owner states the flag's value in the cutover word, since an environment override would sit in the settings file the installer does not read); a hold for each hold file that reads as held, torn ones included; each unexpired AI-management pause with its scope and expiry; each latched loss latch of a day not yet over. Released only by the owner's ordinary actions (Q-014). The cutover request tells the owner that after the switch touching `run/KILL` does nothing; the target's kill is the operator command (SLICE-10) | — |
| 3 | BuyerEdge's authority after the switch | The live strategy registry row decides it (`src/tier1/importer/authority-map.md:33`); a row is reported, never changed to match a file | The owner's standing binding must carry the same authority; a difference refuses `GENESIS_SEALED` unless the owner's word names it | — |
| 4 | Going back | Allowed only before the new authority's first attempt, with a fresh flat boundary, recorded as `ROLLBACK_CONTINUATION`; refused for good after it (`src/tier1/cutover.py:12-16`, `:82-97`; `src/tier1/activation.py:177-190`; `deploy/deploy_tier1.py:1526-1570`) | The same rule, the first attempt being the first `DISPATCH_CLAIMED` after `MIGRATION_GENESIS`; after it, rollback is to a compatible older target bundle only | — |
| 5 | Order of stopping | Timers, the strategy, the rest, the authority last; the stopped set recorded (`deploy/deploy_tier1.py:575-604`) | Legacy's units stopped in the same order at `LEGACY_STOPPING`, the set recorded before each stop | — |

## Deviations

* **No write to legacy's run directory.** Legacy's own cutover wrote `LEGACY_RETIRED.json` there to make its old send path incapable (`src/tier1/cutover.py:60-79`). The target never writes a legacy store: the old route is held incapable by masked units and by the replaced broker key, and the target's retirement marker is derived from its own ledger.
* **The broker key is replaced at the cutover.** Legacy's cutover kept the same key and switched its route on in the shared settings file (`deploy/deploy_tier1.py:47-51`). The replacement is what makes the old route incapable on this host and on any copy of it (A04-F2 across hosts); the owner performs it, and the installer never reads or prints a key.
* **The old route is fenced like an old host.** Legacy's cutover revoked and did not fence; the target records `OLD_HOST_FENCED` naming legacy before the human advance, so the advance carries the same evidence a restore's would.
* **No `--accept-unsettled`** (configuration spec): an unresolved legacy order refuses the cutover until it settles.
* **The cutover is a recorded installer transition** in the host log, read back on resume; legacy kept one receipt per deploy step (`deploy/deploy_tier1.py:12-15`).
* **Going back shuts the target out, not only down.** Legacy's go-back recorded the continuation, switched its route off in the settings file and disabled the authority unit (`deploy/deploy_tier1.py:1526-1555`). The target's `continue-legacy` also masks every target unit, removes the target's credential files, marks its lease `abnormal`, and its kernel refuses every advance in a ledger holding `ROLLBACK_CONTINUATION`, so a target restarted by hand can never become a second writer.
* **The old key is probed.** Legacy's fence took the key rotation by attestation (`src/tier1/recovery.py:33-40`); the target adds a one-shot probe that reads the old key from legacy's settings file in memory, makes one read-only call and records only the status. If the owner declines the probe, the record says `attested, not probed`.
* **A backup of the new ledger is taken and anchored before the first advance;** legacy's cutover took none.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root.

* **Legacy's own cutover (13 October 2026).** Eight steps, each refusing at its first failure with a receipt: boundary and stop, the flat check after the stop with a restart on refusal, code, dependencies, service users, the flat recheck, the cutover, the start (`deploy/deploy_tier1.py:1-68`); the cutover step's states and its refusal before revocation (`:1178-1232`); the ledger steps in order: epoch, import, release binding, genesis, the full preflight, and only then revocation (`src/tier1/activation.py:1-18`, `:123-152`).
* **The genesis.** Digests of every import manifest, the reconciliation receipt, the release binding, every projection head and the proposed epoch (`src/tier1/cutover.py:100-147`).
* **Going back.** The continuation before the first attempt, and the hand-rollback text after it (`src/tier1/cutover.py:82-97`; `deploy/deploy_tier1.py:1526-1570`).
* **The fence.** A recovery epoch or an unfenced `RECOVERY_GAP` refuses every broker-changing request (`src/tier1/recovery.py:117-133`); the fence requires the old host stopped or isolated, the key rotated by attestation, and a book observed after both (`src/tier1/recovery.py:33-50`).
* **Legacy's units** at 445eb116 include the authority, three gateways, the strategy and its timer, the monitors, the session reset and the backup (`deploy/systemd/`); the session reset stops only session units after the close and never touches a broker (`deploy/session_reset.py:1-34`).

## Step 1 — the cutover states

<a id="step-1--the-cutover-states-outline"></a>The authorities are the migration spec's [initial cutover](../../design/migration-recovery-rollback-continuity.md#the-initial-cutover-operationsdeploymentpy), its crash points CP-X1…CP-X6, CP-X2a, CP-X3a and F-M1, F-M6, its [send-lease store adapter](../../design/migration-recovery-rollback-continuity.md#the-send-lease-store-adapter-adapterslease_storepy) (the `RouteRetirement` record), PRF-MIG-13, the configuration spec's [release transitions](../../design/configuration-artifacts-release.md#release-transitions) and [activation boundary](../../design/configuration-artifacts-release.md#the-activation-boundary), and the sessions spec's fence rule. Step 1 is TASK-S14-01. Legacy citations are at 445eb116 (re-read with `git show 445eb116:<path>`). Target citations are OA_NEW's **working tree on `slice-08` as of 12 November 2026** (head `ab92b01` plus SLICE-11 step 8's uncommitted files); `deploy/install.py`, `operations/deployment.py`, `kernel/recovery.py`, `operations/backup.py`, `operations/restore.py` and `adapters/lease_store.py` were in flux while this was written, so the builder re-reads each cited line before changing it. Class S: a rehearsal directory, the fake `systemctl`, `RehearsalBroker`, a stand-in OpenAlgo on loopback and SLICE-13 step 1's synthetic legacy fixtures. **Nothing in this step touches the EC2, a key, a broker or money;** steps 3–5 stay the owner's word.

**It stops for review before building:** it adds root-written rules (a polkit rule for legacy's units, one sudoers line per copy), a kernel-side refusal in `kernel/recovery.py`, and decides what the owner does on the evening. It sets no score, threshold or money value. The fork rule decides every money-touching choice (the slice's Fork calls 1–5); each one this step implements is restated below.

**In plain words.** One command, `cutover`, walks the old system out and the new one in, writing every step to the host log before and after it acts, so a crash anywhere can be picked up from what is written. It pauses where only the owner can act (replacing the broker key, recording that the old system is shut out, giving the go) and carries on when the owner runs `resume`. A second command, `continue-legacy`, puts the old system back and shuts the new one out for good, but only until the new system's first order. The kernel itself refuses to start trading in a ledger whose old system was never recorded as shut out, and in a ledger that was handed back to the old system.

### Decisions

#### Where the code lives

* **`src/autonomous_trading/operations/deployment.py`** gains a section *the initial cutover*, pure functions with no kernel import at load (the spec places the cutover here): `CUTOVER_STATES`, `legacy_store_reasons`, `cutover_boundary`, `genesis_payload`, `carried_safety_drafts`, `authority_reasons`, `continue_refusals`, `projection_heads`, `route_retirement_key`. **Spec and code:** SLICE-11 step 7 put the release states in a new `operations/activation.py` (a recorded decision of that step's Files table, not a Deviation of the cutover); this step reuses `activation.calendar_reasons`, `assessment_reasons`, `ledger_reasons` and `sender_reasons` from there and keeps the cutover's own functions where the spec names them.
* **`deploy/install.py`** acts: the commands `cutover`, `attest-rotation`, `continue-legacy`, the cutover branches of `resume`, `restore` and `status`, the root mode `cutover-root`, and the rehearsal seams.
* **`src/autonomous_trading/operations/key_probe.py`** (new): the probe, run only inside its transient unit.
* **`kernel/recovery.py`**, **`kernel/host.py`**, **`kernel/ledger/store.py`**, **`resources/events.schema.json`**: the two new event kinds, the kernel-side refusals and the `RouteRetirement` write.

#### Commands (`deploy/install.py`)

| Command | Runs as | Does | Writes to the host log |
|---|---|---|---|
| `cutover --release R --authorized-by NAME --instruction TEXT --legacy-kill-flag on\|off --evidence FILE --binding FILE --key-probe run\|declined [--authority-difference TEXT]` | `at-installer` | `CUTOVER_STAGED` to the first owner pause | Yes, op `cutover-<R>-<stamp>` |
| `attest-rotation --rotated-at T --by NAME` | `at-installer` | Records the owner's key-replacement attestation on the open cutover, then resumes | Yes |
| `resume` | `at-installer` | Continues the last unfinished transition (now also `cutover-` and `continue-` ops) from its facts | Yes |
| `restore` | `at-installer` | On a `cutover-` op: before `LEGACY_WRITER_GONE` `intent`, restarts legacy's recorded set (CP-X1); at or after that `intent` (masking may have run), refuses and names `continue-legacy` | Yes |
| `continue-legacy --reason TEXT` | `at-installer` | Fork call 4's go-back | Yes, op `continue-<stamp>` |
| `status` | `at-installer` | Adds the open cutover's last state, its pause reason and what the owner must do next | No |
| `cutover-root` | root (sudo from `at-installer`, the copy's third exact line; no arguments) | Reads the host log's last record and acts only on one of five `intent` records (below); idempotent | `applied.jsonl` |

**Exit codes:** the existing 0, 2, 3, 4, plus **5 waiting for the owner** (`EXIT_WAITING`): the transition stopped at an owner pause; standard error names the pause and the exact next command. A waiting op is not a crash: `resume` before the owner acts re-checks the facts and exits 5 again.

**Refusal codes.** The installer's existing `CFG-R08` (owner item unbound), `CFG-R12` (authorization, release not `VERIFIED_DISARMED`), `CFG-R13` (boundary not quiet, a stop or start failed). The importer's `MIG-R02`…`MIG-R08` pass through unchanged. New, continuing SLICE-13's numbering:

| Code | Name | When |
|---|---|---|
| `MIG-R15` | `cutover_evidence` | The evidence file is missing or unreadable; the D10 record or the shadow's runs name another `bundle_digest`; no PRF-OPS-09 record, or one naming another bundle |
| `MIG-R16` | `ledger_present` | A file at `ledger.path` that no earlier cutover op of this host log created, or one holding a `DISPATCH_CLAIMED`; never set aside |
| `MIG-R17` | `history_blocked` | `IMPORT_COMPLETED.blocks` not empty (F-M1, a quarantined authoritative record), or `IMPORT_VIEWS_COMPARED.clean` false |
| `MIG-R18` | `old_key_not_refused` | The probe's call was not classified an authentication refusal (F-M6), or the probe could not run |
| `MIG-R19` | `authority_differs` | Fork call 3: legacy's row and the owner's binding disagree and `--authority-difference` does not name it |
| `MIG-R20` | `fence_incomplete` | `LEGACY_FENCED`: no `OLD_HOST_FENCED` after the genesis naming `legacy:<host_id>`, or one whose `credential_rotated_at` is not the attested instant or whose `book_observation_digest` is null |
| `MIG-R21` | `backup_unanchored` | `BACKUP_ANCHORED`: the backup row not `ok`, or no anchor at the destination naming the genesis head |
| `MIG-R22` | `continue_refused` | `continue-legacy`, with the reason (below) |

Kernel side: `SES-R09` (`recovery_stage`) with the new reasons `fence_required: migration_genesis` and `rollback_continued` (below).

#### The states (`cutover`)

Every state appends `intent` before it acts and `done` (with its facts) after, through `append` (OA_NEW `deploy/install.py:518-528`, which already `fsync`s and carries the rehearsal crash hook `AT_REHEARSAL_CRASH=<state>:<phase>`). Owner pauses append `waiting` and exit 5. `CUTOVER_STATES` in `deployment.py` is the order below; `resume` uses it as `_order` uses `activation.STATES` (`install.py:1920`).

| # | State | Inputs | Acts | `done` facts | Refusal |
|---|---|---|---|---|---|
| 1 | `CUTOVER_STAGED` | The host log; `--evidence FILE` (`cutover-evidence/1`: paths of the D10 record, PRF-OPS-09's record and each shadow day's record) | Reads only: `VERIFIED_DISARMED` `done` for R; `owner_only_unbound(eff)` (`install.py:591`) plus `account`, `recovery.lease_store`, `backup.destination`; each evidence file parsed and its `bundle_digest` compared with R's `manifest_digest`; no `current` link exists (a first install), **or** `current` names R and was set by an earlier `cutover-` op of this host log that ended `FAILED` or `FAILED_AFTER_ROTATION`, or was followed by a completed `continue-` op (a retry walks every state again from here, as the spec says; that op's units stay masked until state 3) | `bundle_digest`, each evidence file's path and SHA-256, the shadow days **listed** with their defect counts as the records give them (never counted or compared to a number) | `CFG-R12`, `CFG-R08`, `MIG-R15`; any other `current` link (another release, or R set by an `activate` or a converged cutover) → `CFG-R12 not_a_first_install` |
| 2 | `CUTOVER_AUTHORIZED` | The command's arguments | Records the word | `authorized_by`, `instruction`, `release_id`, `account` (Q-005, the settings' one account), `legacy_kill_flag`, `key_probe`, `binding_sha256`, `authority_difference` | `CFG-R12` when any argument is empty or the binding file does not parse as a `StandingBinding` for that account |
| 3 | `OBSERVER_READY` | R's rendered units | After an earlier op was continued, `sudo cutover-root` first unmasks the target's units; then `sudo apply-root` from R's copy (units written, nothing enabled), `set_current(R)`, then starts `at-observer.service` and `at-supervisor.service` through `_start_verified` (`install.py:1741`) and waits for one assessment published after this `intent` whose books are fresh (`activation.assessment_reasons` with no reasons other than counts) | `written`, the two identity records, the assessment's path and SHA-256 | `CFG-R13 not_converged` (route did not hand-shake or read). The owner installed the mediator's credential (the account's current key) beforehand; the installer never checks the file, only the handshake and the book read |
| 4 | `LEGACY_QUIET` | A fresh assessment; one copier pass; legacy's sender lease | `cutover_boundary(phase="before_stop")` (below) | The assessment's SHA-256; the copier pass's id; every legacy view count | `CFG-R13` with every reason (legacy's list reports all, not the first) |
| 5 | `LEGACY_STOPPING` → `LEGACY_STOPPED` | `cutover.legacy_units` (new deployment setting, ordered rows `{unit, group: timer\|strategy\|other\|authority, reaches_broker}`; the builder fills `config/live.example.yaml` from `deploy/systemd/` at 445eb116) | Stops in legacy's order (`deploy/deploy_tier1.py:575-604`): timers, the strategy, the rest, the authority last; `legacy-stopped.json` written before each stop (as `_write_stopped`, `install.py:1766`); each stop verified gone (`_gone`, `install.py:1688`) | `stopped`, `legacy_stopped_at` (the instant after the last verified stop; the importer's `--legacy-stopped-at`) | `CFG-R13 stop_failed`; then the `FAILED` row below |
| 6 | `LEGACY_QUIET_AFTER_STOP` | As state 4, books fetched after this `intent` | `cutover_boundary(phase="after_stop")`, plus every `authority`-group unit inactive with `MainPID=0` and no process (legacy's writer gone, checked here so that a refusal still restarts legacy) | As state 4 | `CFG-R13` (`old_writer_running` among the reasons); `FAILED`, legacy's recorded set restarted |
| 7 | `LEGACY_WRITER_GONE` | — | After its `intent`: `sudo cutover-root` masks every `reaches_broker` row; each is read back `masked` | `masked` | `CFG-R13 mask_failed`; `FAILED` with legacy left stopped and treated as masked (keyed on this `intent`, never on `done`); `continue-legacy` unmasks and restarts |
| 8 | `CAPTURE_PINNED` | — | The copier's final pass and its `--ledger --final` copy (through the `Host.copier` seam); then `legacy_import.pin_boundary(...)` (new public wrapper of `check_inputs`, `stage` and `_pin`, `legacy_import.py:105-154`, `:611-624`) into the new ledger at `ledger.path`, after the set-aside rule (below) | `import_id`, `run_id`, the `IMPORT_BOUNDARY_PINNED` sequence and event hash, `set_aside` | Importer `MIG-R06`, `MIG-R08`; `MIG-R16` |
| 9 | `HISTORY_TRANSFERRED` | The pin | `run_import(mode="pin", legacy_stopped_at=…)` (resumes under the pinned `import_id`, `legacy_import.py:542-603`); the legacy-views file through the `Host.legacy_views` seam; `run_compare` | `IMPORT_COMPLETED`'s `terms`, `unimported`, `blocks`, its sequence; `IMPORT_VIEWS_COMPARED.clean` | Importer `MIG-R02`…`MIG-R05`, `MIG-R07`; `MIG-R17` |
| 10 | `CREDENTIAL_ROTATED` | — | Stops `at-observer.service` (verified gone), appends `waiting` with the instruction text, exits 5. The owner replaces the OpenAlgo key, installs the new key as the credential of the kernel, the market process and `at-observer`, then runs `attest-rotation --rotated-at T --by NAME`. That command appends `attested` with `T` and `NAME` and resumes: the installer starts the observer, waits for a fresh assessment (handshake and one book read with the new key) | `credential_rotated_at`, `attested_by`, `book_observation_digest` (SHA-256 of the assessment object read after the restart; printed for the owner's fence) | Observer not converged → `FAILED_AFTER_ROTATION`. `T` earlier than `LEGACY_WRITER_GONE` `done` → `CFG-R12` (attestation refused, still waiting) |
| 11 | `KEY_PROBED` | `key_probe` from the word | `run`: the probe unit (below), result read from its report; `declined`: records `attested, not probed` | `probe: {status, error_class, verdict}` or `attested_not_probed: true` | `MIG-R18` → `FAILED_AFTER_ROTATION` |
| 12 | `GENESIS_SEALED` | The ledger; the assessments of states 6 and 10; legacy's views at the pin | `authority_reasons`; then through `compose_migration` one transaction: `MIGRATION_GENESIS` plus `carried_safety_drafts` | `genesis_sequence`, `genesis_hash`, `carried` (each event kind and scope) | `MIG-R19` → `FAILED_AFTER_ROTATION`; a second genesis is never written (resume reads the existing one) |
| 13 | `BACKUP_ANCHORED` | The closed ledger (`ledger_mode="immutable"`, no kernel runs) | `operations.backup.backup(...)` (`backup.py:453-489`) into `destination_for(eff, host)`; then `anchor_get(ledger_first_event_id)` must hold the genesis head | `set_id`, `head` | `MIG-R21` → `FAILED_AFTER_ROTATION`; in production `CFG-R08` until POL-O01 |
| 14 | `QUIET_BEFORE_SWITCH` | As state 6, plus the new ledger's read model | `cutover_boundary(phase="before_switch")` | As state 6 | `CFG-R13` → `FAILED_AFTER_ROTATION` |
| 15 | `SWITCHED` | — | As the spec: the route started at `OBSERVER_READY` (`at-observer`, `at-supervisor`) is stopped and verified gone; `current` is checked to name R (set at state 3, so no rename) | `current`, `stopped` | `CFG-R13` → `FAILED_AFTER_ROTATION` |
| 15a | `OBSERVERS_STARTED` | — | As `_step`'s `OBSERVERS_STARTED` (`install.py:1831`): each observer started and verified (its identity record from its own `MainPID` naming this bundle, its handshake), and one assessment published after this `intent` | Identity records; the assessment's SHA-256 | `CFG-R13` → `FAILED_AFTER_ROTATION` |
| 16 | `MARKET_STARTED`, `KERNEL_STARTED` | — | As `_step` (`install.py:1831`). The kernel's first epoch retires a migration epoch with no advance, so routine check 2 declines and it waits in `RECOVERY_WRITING`; the installer reads its `RECOVERY_STAGE` with `to: null` | Identity records; `declined` | `CFG-R13` → `FAILED_AFTER_ROTATION` |
| 17 | `OPERATOR_STARTED` | — | Starts `at-operator.service` (not enabled) | Identity record | As 16 |
| 18 | `LEGACY_FENCED` | The ledger, read `readonly` | Appends `waiting` and exits 5 until an `OLD_HOST_FENCED` after the genesis exists; the owner records it through `at` (the operator relay to `recovery.record_fence`), naming `old_host: legacy:<host_id>`, `old_host_state: stopped`, the method text, the attested `credential_rotated_at`, the digest printed at state 10, and `accounted` | The fence's sequence and payload digest | `MIG-R20` (stays waiting; the owner records a corrected fence) |
| 19 | `ADVANCED` | The ledger | Waits (exit 5) for a `RECOVERY_STAGE` to `OPERATING`, basis `human`, after the fence | Its sequence and principal | — (the kernel refuses a premature advance itself) |
| 20 | `STARTED` → `CONVERGED` | — | As `_step` and the spec: `enable-units`, the strategy timer, the backup timer when bound; convergence (`install.py:1817`). Nothing here waits on a binding; `CONVERGED`'s facts report the ledger's unrevoked standing binding for the account and whether it equals the binding file named in the word (reported, never a refusal) | `operations`, `binding_matches_word` | — |

**Spec and code: units and the link before the switch.** The spec starts the observation route "from the staged release" at `OBSERVER_READY` and restarts it under `current` at `SWITCHED`. The rendered units always run `__RELEASE__` = `release.root/current` (`install.py:164`), so no unit can run from a staged release without the link. SLICE-11 step 7 decided the first-install order for this reason (units written and the link set before the observers start, nothing enabled; recorded in that step's `activate` text). The cutover is a first install, so it follows that recorded decision: units and link at state 3; `SWITCHED` still stops the route and `OBSERVERS_STARTED` starts it again, as the spec says, with no link rename. Safe because no target unit that could send is started before state 16, nothing is enabled before state 20, and the kernel and market have no credential until the owner installs one at state 10.

**Spec gap: the route for the fence and the advance.** The spec has the owner record the fence and advance before `STARTED`, which is where the configuration spec starts the operator relay; the kernel accepts both only from the operator relay (OA_NEW `adapters/unix_channel.py:587-592`). State 17 starts the relay right after the kernel. The relay sends nothing to the broker. Reported to the configuration spec's owner as a cutover-only order.

#### The boundary for the cutover (`cutover_boundary`)

`cutover_boundary(*, phase, day, now, assessment, accounts, since, max_age_secs, legacy_views, sender_lease_alive, active_units, model)` returns every reason, joining:

* `activation.calendar_reasons` and `activation.assessment_reasons` (the broker part, from the supervisor's assessment; the installer makes no broker call), at every phase;
* **legacy's stores**, `legacy_store_reasons(views)`, at every phase: legacy's preflight rules exactly (`src/tier1/cutover.py:183-202`): an order whose state is not in `{filled, rejected, cancelled, completed}`; a reservation in `{reserved, held}`; a structure command in `{requested, executing, held, unknown}`; a store unreadable. The views come from `legacy_import.views_of_reads(stores)` (new: the copier's copies read by the compatibility readers, shaped as import payloads, then `target_views`, `legacy_import.py:678-781`). **Fork call 1 detail:** `target_views` marks a reservation without its commit marker `uncertain` (legacy's shadow side); legacy's preflight read legacy's own views, where it is still `reserved` or `held`, so `legacy_store_reasons` counts `uncertain` as held. A test checks the three rules against every fixture variant's `legacy_views/1` file;
* **a legacy sender alive**: the sender lease's pid alive (legacy's rule, `src/tier1/cutover.py:203-205`, its `_alive` ported), at every phase as legacy did (`src/tier1/activation.py:84-88`: legacy's pre-stop boundary ran the same preflight); `activation.sender_reasons` over `activation.LEGACY_SENDERS` unit states only at `after_stop` and `before_switch`;
* **the target ledger**: `activation.ledger_reasons(model)` only at `before_switch` (no ledger exists earlier; the imported events are evidence and hold no command).

Legacy's stores are read through the copier's copies, not in place: `at-installer` cannot read legacy's run directory, and only the copier runs as legacy's user (SLICE-13's lockdown). Each check runs one copier pass first (production: `isolated_work.py --shadow … copy --once` through the existing sudoers line; rehearsal: `Copier.pass_once()` in process). **Not checked:** whether legacy's sender lease names a live gateway while legacy is idle after the close. If it does, legacy's own rule refuses `LEGACY_QUIET` every evening; step 3 finds out on the copies, and the finding goes to the owner.

#### The genesis (`MIGRATION_GENESIS`) and the carried safety state

* **New kinds** in `resources/events.schema.json` and `kernel/ledger/store.py` `_FAMILY`, family `migration`, provenance `native`:
  * `MIGRATION_GENESIS`: `{legacy_host, cutover_op, import_id, boundary: {sequence, event_hash}, import_completed: {sequence, event_hash}, views_compared: {sequence, event_hash}, books_digest, books_after_rotation_digest, release: {release_id, bundle_digest, receipt_digest}, projection_heads, authority: {legacy_row_digest, binding_digest, difference}, carried: array, authorized_by, legacy_kill_flag}`; `legacy_host` is `"legacy:" + runtime.host_identity()`. `receipt_digest` is `digest(bootstrap.release_receipt(manifest, eff, R))` (`bootstrap.py:1017`), the receipt and digest the kernel records in `RELEASE_BOUND` at its start (`kernel/recovery.py:227-233`), so the genesis names the release receipt as the spec and legacy's genesis (`src/tier1/cutover.py:100-147`) do; a test checks the kernel's later `RELEASE_BOUND.receipt_digest` equals it.
  * `ROLLBACK_CONTINUATION`: `{genesis_sequence, reason, principal, cutover_op, key_replaced: boolean}`.
* **`IMPORT_KINDS` becomes an explicit set** of the six import kinds (`store.py:57` derives it from the family today; `:675` then demands `legacy_import` provenance for every `migration` kind, which would refuse the two new native kinds). Same content as today.
* **`projection_heads(conn)`**: each table's rows hashed in key order, the same rule as `scripts/verify_recovery.py:33-55` (which then calls it).
* **`carried_safety_drafts(derived, pauses, *, legacy_kill_flag, principal, scope, first_session_day, now)`** (Fork call 2, legacy's engaged state stays engaged), from the pin's `derived_safety` (already in `IMPORT_BOUNDARY_PINNED`, `legacy_import.py:620`, built by `legacy_mapping.derived_safety`, `adapters/legacy_mapping.py:569-605`) and the imported pause records:
  * `KILL_ENGAGED {principal: wire(owner), reason: "carried_from_legacy"}` when `kill_engaged` (the kill file, or the Tier-1 fold) or `--legacy-kill-flag on`;
  * `HOLD_ENGAGED {strategy, reason: "carried_from_legacy", principal: wire(owner)}` for each strategy whose hold is `held` (a torn file reads held, `adapters/legacy_mapping.py:582`); `unreconciled` is not carried (no file, legacy's startup reconciliation lifts it);
  * `PAUSE_STARTED` for each pause record whose last state is `active` and `expires_at` is after now: `pause_id` the legacy `record_id`, `strategy`, `underlying` its `instrument`, `review_id` its `review_id`, `started_at`, `expires_at` as recorded, `session_id` `session_id_for(scope, first_session_day)`;
  * `LOSS_LATCH_TRIPPED {session_id, account, pnl, budget, observation_digest, principal}` for each of `derived.carried_latches`: `session_id` `session_id_for(scope, day)`, `account` `wire(scope.account_id)` (the cutover's one account, Q-005), `pnl` and `budget` the file's `daily_pnl` and `budget` as canonical decimal text, `observation_digest` the legacy record's digest, `principal` `wire(owner)`.
  * Every payload is checked against `resources/events.schema.json` (`PAUSE_STARTED` `:49`, `KILL_ENGAGED` `:51`, `HOLD_ENGAGED` `:53`, `LOSS_LATCH_TRIPPED` `:54`) by the writer's `validate_payload`; a test commits each.

  Every draft's envelope principal and every payload `principal` is the authorizing owner, `owner = Principal(authorized_by, "human")`. **Spec and code:** the spec carries "each latched loss-latch file of a day not yet over"; `derived_safety` carries latches of the first target session's day. They agree: the cutover runs after the close, so today's legacy day is over. The installer's cutover output tells the owner that touching `run/KILL` does nothing after the switch.
* **`authority_reasons(legacy_authority, binding)`** (Fork call 3): legacy's row 8 (`strategies/strategies.json`, the pin's `authority` view) gives `buyer_edge` `trade` exactly when BuyerEdge's candidate is in the owner's binding's `candidate_ids`; every other legacy value (`observe` in the fixtures) means absent. Any other registered strategy with `trade` and no candidate in the binding is also a difference. A difference refuses `MIG-R19` unless `--authority-difference` names that strategy. The row is reported, never changed.

#### The key probe (`KEY_PROBED`)

* **`operations/key_probe.py`**: `probe(settings_file, key_names, base_url, *, http) -> dict` reads the file in memory, takes the first of `BROKER_KEY_NAMES` (`install.py:34`) present, makes one `POST /api/v1/funds` with it (a TASK-S07-05 read-only endpoint), and returns only `{status, error_class, verdict}`; the key and the body are never written, logged or returned. `verdict` is `refused` only when `(status, error_class)` matches the captured authentication-refusal response, `accepted` on a 2xx, otherwise `inconclusive` (which refuses `MIG-R18`, fail closed).
* **No capture of OpenAlgo's answer to a wrong key exists** (`tests/fixtures/openalgo/` holds only good-key reads; `upstream-findings.md` has none for the REST API). By the house rule the classification is taken from a capture, not from code that consumes it: a read-only call with a deliberately wrong key against the deployed OpenAlgo, `funds_invalid_key_<date>.json`, is a TASK-S07-05-style read (pre-approved by the standing rules), made when the EC2 is reachable and before step 3. Until it exists, the classifier table is empty and a real probe is `inconclusive`; step 1's tests use a stand-in server answering a synthetic refusal.
* **The unit:** `isolated_work.py --key-probe` (new mode, like `--shadow`): fixed properties from `operations.isolation.key_probe_unit_properties(legacy_settings_file, openalgo_address)`: `User=` `shadow.legacy_user`, `IPAddressDeny=any` with `IPAddressAllow=` the OpenAlgo address only, every protected root inaccessible except that one file read-only, no writable path but its report, the environment stripped of every key name. One new sudoers line in the copy (`--key-probe *`), rendered by `sudoers_files` (`install.py:267-284`). In rehearsal the `Host.key_probe` seam runs `probe` in process against the stand-in.

#### Going back (`continue-legacy`)

* **Refusals** (`continue_refusals(...)`, each alone, all reported, `MIG-R22` with the reason): `claimed` (a `DISPATCH_CLAIMED` after the genesis); `retired` (a `RouteRetirement` for this ledger in the lease store); `restored` (an `EPOCH_ACTIVATED` with `restore` or a `RECOVERY_GAP` after the genesis); `store_unreachable` (its own check: `leases.read(account)`, `leases.get_once(route_retirement_key(...))` and `destination.anchor_get(ledger_first_event_id)` each called directly; any exception or timeout is this reason. `restore.anchor_alerts` is not used: it swallows lease-read errors, `restore.py:383-386`); `lease_head` (its own check: the account's lease names this ledger and its `(head_sequence, head_hash)` is not in the file, **whatever its epoch**; `anchor_alerts` skips other-epoch heads after a restore, `restore.py:392-394`, which is exactly CP-X6's case); `unanchored` (a backup anchor of this ledger whose head is not in the file, checked directly over `anchor_get`, every epoch); `not_quiet` (`cutover_boundary(phase="after_stop")` on fresh books); `no_cutover` (no open or failed cutover op in the host log). After `claimed` or `retired` it prints what rollback now means (legacy's text, `deploy/deploy_tier1.py:1561-1570`): an older compatible target bundle, never legacy. No ledger at all (CP-X2 before any import) checks only the last three.
* **Steps**, each a state of op `continue-<stamp>` with `intent` and `done`, each idempotent on re-run (CP-X3a):
  1. `CONTINUE_TARGET_STOPPED`: every target unit in reverse `START_ORDER` stopped and verified gone;
  2. `CONTINUE_TARGET_MASKED`: `sudo cutover-root` masks every target unit;
  3. `CONTINUE_CREDENTIALS_REMOVED`: `sudo cutover-root` unlinks every file under `/etc/autonomous-trading/credentials/{kernel,market,observer}/` (never opened or read; missing is done);
  4. `CONTINUE_RECORDED`: through `compose_migration` (`bootstrap.py:2312-2333`, which itself refuses a claimed ledger, `MIG-R01`), `ROLLBACK_CONTINUATION` unless one with this `cutover_op` exists; `skipped: no ledger` when none;
  5. `CONTINUE_LEASE_RELEASED`: for the account, `cas` from the current lease to `released: abnormal` with the final head, when the current lease names this ledger and is not already `abnormal`;
  6. `CONTINUE_LEGACY_UNMASKED`: `sudo cutover-root` unmasks the legacy rows;
  7. `CONTINUE_LEGACY_RESTARTED` only when the cutover's log has no `CREDENTIAL_ROTATED` `intent`: legacy's recorded set restarted in the reverse of its recorded stop order, each verified active. Otherwise `waiting_for_owner_key` and exit 5: the owner puts the current key in legacy's settings file and starts legacy (the installer never handles a key).
* **`cutover-root`** acts only when the host log's last record is the `intent` of `LEGACY_WRITER_GONE` (mask legacy's `reaches_broker` rows), `CONTINUE_TARGET_MASKED` (mask the target's rendered units), `CONTINUE_CREDENTIALS_REMOVED` (unlink) or `CONTINUE_LEGACY_UNMASKED` (unmask legacy's rows), and a new cutover's `OBSERVER_READY` after a continued op (unmask the target's units). The unit sets come from the copy's own `units/plan.json` (which gains `legacy_units`), never from the log. **It does not trust log order alone:** before unmasking legacy's rows it checks, itself, that every target unit of the copy's plan reads `masked` (`systemctl show -p UnitFileState`) and that each of `/etc/autonomous-trading/credentials/{kernel,market,observer}/` (`install.py:25`; the `LoadCredential=` sources, `:164`) holds no file; either failing refuses and changes nothing. Before unmasking the target's units (a retry's state 3) it checks that legacy's `reaches_broker` rows are masked again or legacy's recorded set is stopped, so both sets are never unmasked together. Starting and stopping legacy's units goes through `legacy_polkit_rule(user, units)` (new in `operations/isolation.py`: exact names from the rendered list, verbs `start` and `stop`; legacy's gateway names do not match the installer rule's `at-*` pattern, `isolation.py:121`).

#### Failure ends

| Refused at | Then |
|---|---|
| States 1–4 | Nothing to undo; `FAILED` |
| States 5–6 (from `LEGACY_STOPPING` `intent` to before `LEGACY_WRITER_GONE` `intent`) | Legacy's recorded set restarted, each verified active (legacy's `restore_after_flat`, `deploy/deploy_tier1.py:1471-1499`); `FAILED` |
| States 7–9 (from `LEGACY_WRITER_GONE` `intent`, whether or not its `done` was written) | Legacy left stopped and treated as masked on its working key; `FAILED`; standard error names `continue-legacy` (or `resume` once the cause is fixed) |
| States 10–19 | `FAILED_AFTER_ROTATION`: the observer stopped; the kernel, market and operator stopped if started; nothing is unmasked; alert line on standard error; the owner chooses `resume` or `continue-legacy` |
| State 20 | As the configuration spec: `CONVERGED` lists what is unavailable; the target has advanced, so `continue-legacy` refuses only once the first claim exists |

`activation.refusal_actions` gains a `cutover=True` branch returning these actions from the `(state, phase)` records, so `resume` after a crash mid-undo finishes the same row.

#### A retry (setting aside)

At `CAPTURE_PINNED` of a new `cutover-` op, a ledger at `ledger.path` is set aside (renamed `<name>.set-aside-<stamp>` with its `-wal` and `-shm`, legacy's `set_aside`, `src/tier1/activation.py:72-83`, never deleted) only when the host log shows an earlier `cutover-` op that ended `FAILED`, `FAILED_AFTER_ROTATION` or was followed by a completed `continue-` op, and the ledger holds no `DISPATCH_CLAIMED`. Any other file there refuses `MIG-R16`. A `resume` of the same op never sets aside: it finishes the import under the pinned `import_id` (CP-X2).

#### The kernel side (`kernel/recovery.py`)

* **`fence_needed`** (`recovery.py:308-322`) adds an owing entry for each `MIGRATION_GENESIS`: `(genesis.sequence, payload["legacy_host"])`. The existing rule then needs an `OLD_HOST_FENCED` after it naming that host. **For a genesis-owed entry only, a fence counts only when its `credential_rotated_at` and `book_observation_digest` are both non-null** (`FenceEvidence` allows `None`, `recovery.py:47-57`, and `fence_needed` matches the host alone today, `:308-322`): the owing entry carries a `strict` flag and its match reads both fields. A weak fence is still recorded (`record_fence` unchanged) but does not discharge the genesis, so a fence sent straight through the relay cannot open the advance. This covers the human advance (`advance`, `:475`, `SES-R09 fence_required`) and the routine path (check 4), whichever route the request came by. The reason text gains `migration_genesis` when the genesis is the owing event.
* **`ROLLBACK_CONTINUATION`**: `advance` refuses `SES-R09 rollback_continued` before the fence check; `run` (`:171-210`) records `declined` with the new routine check `9` (`ROUTINE_CHECKS` becomes `1…9`, check 9 "no `ROLLBACK_CONTINUATION` in the ledger"). `record_fence` is not changed.
* Both are sessions-spec changes, reported to that spec's owner as two fence-rule triggers and one routine check.
* **`LeaseStore`** (`:38-43`) gains `put_once` and `get_once`; `DirectoryLeaseStore` has them (`lease_store.py:168-196`); `FakeLeaseStore` (`tests/conftest.py`) gains them.

#### The route retirement (`kernel/host.py`)

`KernelHost._serve` (`host.py:249-303`) runs, after each pass, `self._stage("retirement", self._route_retirement)`: when the ledger holds a `MIGRATION_GENESIS` and a later `DISPATCH_CLAIMED`, and no record is known written, it calls `leases.put_once(route_retirement_key(ledger_first_event_id), {ledger_first_event_id, genesis_digest, first_claim_sequence, at: leases.now()})`; `False` (already present) counts as written; an exception alerts `route_retirement_unwritten` and retries next pass. It never holds back a send. No genesis, no write.

#### The rehearsal seams

`Host` (`install.py:418-480`) gains `copier`, `legacy_views`, `key_probe` and `backup_destination`, each defaulting to the production call and replaced under `--rehearse` only: the in-process copier over `DIR/legacy/`, the fixture's `legacy_views/1` writer (`scripts/gen_legacy_fixtures.py --views-only`'s function), the in-process probe against the stand-in, and `DirectoryDestination(DIR/backup)`. `fake_systemctl` (`install.py:1511`) gains `mask` and `unmask` (`UnitFileState: masked`; `start` of a masked unit fails as systemd does), and the rehearsal's legacy units are stand-in sleepers rendered into `DIR/root/etc/systemd/system/` by the test helper. `rehearse_init` adds `cutover.legacy_units`, `shadow.*` paths inside `DIR` and the stand-in OpenAlgo address.

#### Fork calls in this step

* **1.** Legacy's list at `LEGACY_QUIET`, `LEGACY_QUIET_AFTER_STOP` and `QUIET_BEFORE_SWITCH`, with `uncertain` reservations counted as held and the sender lease checked at all three, as legacy did.
* **2.** The carried kill, holds, pauses and latch, with the owner's principal and reason `carried_from_legacy`.
* **3.** The authority check at `GENESIS_SEALED` (the spec's rule). The binding authorized afterwards is reported at `CONVERGED`, never gated.
* **4.** `continue-legacy` until the first claim; refused for good after it.
* **5.** Legacy's stop order.

#### Deviations in this step

* **Legacy's stores are read through a fresh copier pass,** not in place (user isolation; the bytes are the same).
* **Units and the `current` link before the observers** (SLICE-11 step 7's first-install order); `SWITCHED` renames nothing.
* **The operator relay starts after the kernel,** before the fence (the only route to it).
* **The native read-only credential route is not built.** The spec lets `OBSERVER_READY` use a native read-only credential if TASK-S07-06 proved one, re-issued at `CREDENTIAL_ROTATED` if the replacement invalidated it. TASK-S07-06 has not proved one, so the mediator (`at-observer` with the account's key) is the only route this step builds, at both states; the native route waits on TASK-S07-06 and is added then.

#### Carried and open

* **Carried to other slices:** SLICE-13 step 6 builds the production `legacy_views/1` runner the `Host.legacy_views` seam calls; SLICE-13 step 7 emits PRF-OPS-09's record as `ops09-record/1` `{format, bundle_digest, sessions, result}` (this step reads that shape); SLICE-11 step 11 emits the D10 record with its `bundle_digest`; the production lease store and backup destination wait for POL-O01. Until each exists, `CUTOVER_STAGED` refuses in production (`MIG-R15`, `CFG-R08`); the rehearsal supplies fixtures.
* **Integration edits** (the slice's list): the sessions spec (two triggers, check 9), the runtime spec (`kernel/host.py`'s retirement write; the installer's four commands and `cutover-root`; `isolated_work.py --key-probe`), the ledger spec's catalogue (two kinds, the carried reasons), the configuration spec (the cutover's state list, the operator relay's place, exit code 5).
* **Owner questions** (asked, not decided):
  * **Proposal only, not built:** hold the strategy timer at `STARTED` until the owner has authorized the standing binding named in the word, refusing a different one. It would be a new entry gate the spec does not have, so the plan keeps the spec's behaviour (the match is only reported at `CONVERGED`) unless the owner asks for it.
  * The root-written additions (the legacy polkit rule, the `cutover-root` and `--key-probe` sudoers lines): accept as listed?

### Tests

**`tests/recovery/test_initial_cutover.py`** (T-95, PRF-MIG-13), every row in a `--rehearse` directory with the fake `systemctl`, `RehearsalBroker` and SLICE-13 step 1's fixtures. The `Rehearsal` helper of `tests/recovery/test_release_activation.py:320-440` moves to `tests/recovery/rehearsal_support.py` and gains `legacy_units()`, `legacy_store(variant)`, `stand_in_openalgo(refuses=True)` and `owner(...)` (the owner's acts: install a fake credential file, `attest-rotation`, fence and advance through the channel).

| Group | Test names |
|---|---|
| Whole evening | `test_cutover_walks_every_state_to_converged`; `test_every_state_writes_intent_then_done`; `test_owner_pauses_exit_5_and_resume_waits_again`; `test_no_order_verb_is_issued` (the broker's send log and every ledger kind checked) |
| `CUTOVER_STAGED` | `test_refused_without_ops09_record`; `test_refused_when_d10_or_shadow_names_another_bundle`; `test_refused_with_an_owner_item_unbound`; `test_refused_when_not_verified_disarmed`; `test_refused_when_a_current_link_exists[another_release\|set_by_activate\|converged_cutover]`; `test_retry_after_failed_or_continued_cutover_accepts_its_current_link[FAILED\|FAILED_AFTER_ROTATION\|continued]`; `test_shadow_days_are_listed_not_counted` |
| Boundary, each reason alone, before and after the stop | `test_quiet_refuses[open_position\|working_order\|unsettled_registry_order\|held_reservation\|uncertain_reservation\|pending_command\|live_sender_lease\|market_open\|calendar_unknown\|stale_books]`; `test_post_stop_refusal_restarts_legacys_recorded_set`; `test_legacy_store_rules_match_legacy_views_on_every_fixture_variant` |
| Stop and mask | `test_legacy_stops_in_legacys_order_recording_before_each`; `test_writer_gone_masks_only_broker_reaching_units`; `test_masked_legacy_unit_cannot_start` |
| Import | `test_pin_imports_into_a_new_ledger`; `test_refused_at_history_transferred_with_a_quarantined_record`; `test_refused_when_views_compare_is_not_clean`; `test_unknown_ledger_at_path_refuses`; `test_retry_sets_the_old_ledger_aside_and_starts_new` |
| Key | `test_attest_rotation_before_writer_gone_is_refused`; `test_observer_restarts_with_the_new_key_and_reads_books`; `test_refused_at_key_probed_when_stand_in_accepts_old_key`; `test_inconclusive_probe_refuses`; `test_declined_probe_records_attested_not_probed`; `test_probe_records_no_key_and_no_body` |
| Genesis | `test_genesis_carries_kill_from_file_from_flag_and_from_tier1`; `test_genesis_carries_held_and_torn_holds_not_unreconciled`; `test_genesis_carries_unexpired_pauses_only`; `test_genesis_carries_the_first_sessions_latch`; `test_carried_state_is_released_by_owner_commands`; `test_authority_difference_refuses_unless_named`; `test_genesis_is_written_once_across_resume` |
| Backup | `test_refused_before_quiet_before_switch_without_backup_anchored`; `test_anchor_names_the_genesis_head` |
| Kernel side | `test_direct_human_advance_without_legacy_fence_is_refused` (sent through the channel, not the installer); `test_routine_advance_declines_without_legacy_fence`; `test_fence_naming_another_host_does_not_count`; `test_weak_fence_then_advance_through_the_channel_is_refused[no_rotation\|no_book_digest]` (an `OLD_HOST_FENCED` naming `legacy:<host_id>` with one field `None`, then an advance, both sent as operator frames through `adapters/unix_channel.py:587-592`; expects `SES-R09 fence_required`); `test_genesis_receipt_digest_equals_release_bound`; `test_advance_allowed_after_legacy_fence`; `test_every_advance_refused_after_rollback_continuation[human\|routine]` |
| Failure ends | `test_failed_after_rotation_from_every_state_after_the_key_change[CREDENTIAL_ROTATED…LEGACY_FENCED]` (a refusal injected at each; legacy masked, no advance, account flat); `test_failed_after_rotation_then_resume_converges`; `test_failed_after_rotation_then_continue_legacy_waits_for_owner_key` |
| `continue-legacy` | `test_continue_allowed_before_any_claim`; `test_continue_refused[claimed\|retired\|restored\|gap\|lease_head_not_in_file\|lease_head_of_another_epoch\|anchor_not_in_file\|lease_read_raises\|anchor_get_raises\|not_quiet]` (each alone); `test_after_continue_target_masked_credentials_gone_lease_abnormal`; `test_cutover_root_refuses_unmask_while_a_target_unit_is_unmasked_or_a_credential_file_remains` (log forged to the `CONTINUE_LEGACY_UNMASKED` intent); `test_target_restarted_by_hand_after_continue_refuses_every_advance`; `test_continue_restarts_legacy_only_when_key_never_replaced`; `test_continue_after_claim_prints_rollback_meaning` |
| Route retirement | `test_host_writes_route_retirement_after_first_claim`; `test_route_retirement_retries_and_alerts_while_store_unreachable`; `test_no_retirement_without_genesis` |
| Crash points (the installer killed with `AT_REHEARSAL_CRASH`, as `test_release_activation.py:608-624`) | `test_cp_x1_killed_after_legacy_stopped[restore\|resume]`; `test_cp_x2_killed_mid_import[resume_finishes\|continue_then_retry_sets_aside]` (the importer's `after_batch` hook kills); `test_cp_x2a_killed_at_each_state_after_rotation_resumes[...]`; `test_cp_x3_killed_after_switched[resume\|continue]`; `test_cp_x3a_continue_killed_between_each_step_reruns_idempotently[...]`; `test_cp_x4_kernel_killed_before_first_claim_commit_continue_allowed`; `test_cp_x5_kernel_killed_after_first_claim_commit_continue_refused_and_retirement_written_on_restart`; `test_cp_x6_restored_pre_claim_copy_continue_refused[retirement\|restore_marker\|lease_head]` |

**Changed existing:** `tests/recovery/test_release_activation.py` (imports the moved helper; `cutover-root` and the polkit rule in the rendered set); `tests/contracts/test_rendered_units.py` (the legacy polkit rule, three sudoers lines per copy, `plan.json`'s `legacy_units`); `tests/isolation/test_resource_storage_scope.py` (`--key-probe` properties, refused without enforcement on Linux); `tests/recovery/test_restore_fencing.py` (`FakeLeaseStore.put_once`; check 9 in `declined`); `tests/contracts/test_legacy_import.py` (`pin_boundary` then `run_import` resumes under the same `import_id`; `IMPORT_KINDS` unchanged in content); `tests/unit/test_settings_resolver.py` (`cutover.legacy_units`).

### Files

| File | Change |
|---|---|
| `deploy/install.py` | `cutover`, `attest-rotation`, `continue-legacy`, `cutover-root`; cutover branches of `resume`, `restore`, `status`; `EXIT_WAITING`; `Host` seams; `fake_systemctl` `mask`/`unmask`; `sudoers_files` third line; `rehearse_init` additions |
| `src/autonomous_trading/operations/deployment.py` | The initial cutover section (functions above) |
| `src/autonomous_trading/operations/activation.py` | `refusal_actions(..., cutover=True)` |
| `src/autonomous_trading/operations/key_probe.py` | New |
| `src/autonomous_trading/operations/isolation.py` | `key_probe_unit_properties`, `legacy_polkit_rule` |
| `src/autonomous_trading/operations/legacy_import.py` | `pin_boundary`, `views_of_reads` |
| `scripts/isolated_work.py` | `--key-probe` |
| `src/autonomous_trading/kernel/recovery.py` | `fence_needed`'s genesis entry; `rollback_continued`; check 9; `LeaseStore.put_once`/`get_once` |
| `src/autonomous_trading/kernel/host.py` | `_route_retirement` |
| `src/autonomous_trading/kernel/ledger/store.py`, `src/autonomous_trading/resources/events.schema.json` | The two kinds; explicit `IMPORT_KINDS` |
| `src/autonomous_trading/settings/schema.py`, `config/live.example.yaml` | `cutover.legacy_units` (installer scope, deployment) |
| `scripts/verify_recovery.py` | `fingerprint` uses `projection_heads` |
| `docs/operations.md` | The cutover evening, the owner pauses, exit 5, `continue-legacy` |
| `tests/recovery/test_initial_cutover.py` (T-95), `tests/recovery/rehearsal_support.py` | New |
| The six test files under "Changed existing" | As listed |

### Completion conditions (step 1)

* The new tests, every test file importing a changed module, and the layering and import guards pass twice on Windows, Linux-only rows skipped with their reason. No full suite.
* PRF-MIG-13 passes in the rehearsal, including the two kernel-side refusals reached through the channel, not the installer.
* Every crash point of the spec's table (CP-X1…CP-X6, CP-X2a, CP-X3a) has a passing test that kills a real process.
* The builder writes the break checks and their results in the as-built note; each fails a listed test; every file restored (md5).
* Nothing touched the EC2, a key, a broker or money. The integration edits are listed for their spec owners, and the two owner questions above are recorded as asked.

### Step 1 as built

**Built** in OA_NEW `cbacf4d` on `slice-14` (from `slice-08` `f3fe443`), one commit, not merged, not pushed. Built in the worktree `OA_NEW-s14` with `PYTHONPATH` set to its `src` (checked before each run: `autonomous_trading.__file__` in `OA_NEW-s14`).

| Part | Files |
|---|---|
| The two event kinds (`migration` family, `native`); `IMPORT_KINDS` an explicit set; the fold ignores both | `kernel/ledger/store.py`, `kernel/ledger/projections.py`, `resources/events.schema.json` |
| The kernel side: the genesis owes a fence naming `legacy:<host_id>` that counts only with `credential_rotated_at` and `book_observation_digest`; `SES-R09 rollback_continued` on the human advance; routine check 9; `LeaseStore.put_once`/`get_once`; `route_retirement_key` | `kernel/recovery.py` |
| The `RouteRetirement` write after the first claim that follows the genesis, retried and alerted | `kernel/host.py` |
| The pure rules: `CUTOVER_STATES`, `OWNER_PAUSES`, `CONTINUE_STATES`, `legacy_store_reasons`, `cutover_boundary`, `cutover_failure_end`, `authority_reasons`, `carried_safety_drafts`, `projection_heads`, `genesis_payload`, `continue_refusals` | `operations/deployment.py` |
| `pin_boundary`, `views_of_reads`; `scan` reads import kinds only | `operations/legacy_import.py` |
| The probe (classification table empty until a capture) | `operations/key_probe.py` (new) |
| `legacy_polkit_rule`, `key_probe_unit_properties` | `operations/isolation.py` |
| `cutover`, `attest-rotation`, `continue-legacy`, `cutover-root`; the cutover branches of `resume` and `restore`; exit 5; the `Host` seams; `fake_systemctl` `mask`/`unmask`; the third sudoers line | `deploy/install.py` |
| `cutover.legacy_units`, `cutover.legacy_ledger`, `cutover.legacy_settings_file` | `settings/schema.py`, `resources/defaults.yaml`, `config/live.example.yaml` |
| The cutover evening for the owner | `docs/operations.md` |
| Tests | `tests/recovery/test_initial_cutover.py` (new, 124), `tests/recovery/cutover_support.py` (new: the rehearsal and the child driver), `tests/conftest.py` (`FakeLeaseStore.put_once`/`get_once`), `tests/contracts/test_rendered_units.py` (three lines per copy) |

**Run.** Windows, Python 3.14 (`.venv-slice01`), plain pytest, affected only: the 44 test files importing a changed module plus `tests/unit/test_secret_references.py`, twice: **1972 passed, 25 skipped, 1 xfailed** both times. After two tests were tightened (below), `test_initial_cutover.py` alone twice: **124 passed** both times. The `tests/contracts` guards that run `python -I` check the main checkout, not this worktree; the coordinator re-runs them after the merge. No full suite. The first run found three failures, fixed before the counted runs: `defaults.yaml` lacked the new fields (`test_fields`); a second production `lease_store_for` call site (now one helper, `_lease_store`); the host's retirement stage on a stub composition with no ledger (now: no writer, nothing to retire).

**Break checks** (`s14_breaks.py` in the session scratchpad): **30, each failing its listed test**; every file restored (md5 checked against a list taken before). The first pass caught 28. B22 (the name-collision refusal removed) was also refused later by `apply-root`, and B24 (the anchor check removed) failed earlier at the read-back of a fake destination. Both tests were tightened: the first now asserts the refusal comes before `OBSERVER_READY`, the second uses a real directory destination that hides only the anchor. Both are now caught.

| # | Broken | Caught by |
|---|---|---|
| B01–B04 | the genesis fence owed; a weak fence counting; the human advance and routine check 9 after a continuation | the kernel-side tests |
| B05–B06 | the retirement never written; written before the first claim | `test_host_writes_route_retirement_after_first_claim` |
| B07–B10 | `uncertain` not held; the sender lease ignored; the failure end keyed on `done`; a named authority difference ignored | the pure-rule tests |
| B11–B13 | the kill flag not carried; an `unreconciled` hold carried; an expired pause carried | the carried-state tests |
| B14–B15 | the claim and the lease head unchecked by `continue_refusals` | `test_continue_refused` |
| B16–B17 | any 4xx taken as a refusal; the probe's verdict ignored | the probe tests; `test_refused_at_key_probed_when_stand_in_accepts_old_key` |
| B18–B24 | `cutover-root` trusting the log; a weak fence accepted by the installer; an unknown ledger set aside; no legacy restart after a post-stop refusal; the collision allowed; no PRF-OPS-09 record needed; no anchor check | the rehearsal tests |
| B25–B26 | `IMPORT_KINDS` from the family; `scan` reading native kinds | `test_every_carried_payload_commits`; `test_native_migration_kinds_leave_the_import_scan_alone` |
| B27–B30 | the lease left unreleased; credentials kept; legacy restarted on a replaced key; `restore` keyed on `done` | `test_after_continue_…_lease_abnormal`; `test_cp_x1_restore_refused_once_masking_may_have_run` |

**Crash points, each killing a real process** (the installer in a child, `AT_REHEARSAL_CRASH`, or `CUT_CRASH_BATCH` inside the import): CP-X1 (`restore` and `resume`, plus `restore` refused after the `LEGACY_WRITER_GONE` intent), CP-X2 (resume finishes the import; `continue-legacy` then a retry sets the ledger aside), CP-X2a (killed at each of ten states after the rotation, resumed to the fence pause, one genesis), CP-X3 (resume; continue), CP-X3a (continue-legacy killed after each of its six steps, re-run idempotently). CP-X4/X5 at the ledger: continue allowed with no claim; with a real dispatched claim continue refuses and the migration composition refuses (`MIG-R01`). The retirement written on the restarted host's first pass is shown at the host level, not with a killed kernel process. CP-X6: each of its reasons alone (a restore marker or gap after the genesis, the retirement record, a lease head of another epoch) over a real ledger.

**Differences from the text above**, each smaller than a decision:

* **The binding file** is `cutover-binding/1`, `{binding: {candidate_ids}, strategies: {legacy name: candidate id}}`: the owner states which candidate is which legacy strategy, because the installer does not compose the strategy registry.
* **`OBSERVER_READY` unmasking on a retry** checks that the kernel and market hold no credential file, not that legacy is stopped. On a retry legacy runs again on its key, which is expected; the plan's check would refuse every retry.
* **`continue-legacy` starts the observation route** when a crash or refusal left it stopped (CP-X3 after `SWITCHED`), so its boundary has fresh books. `FAILED_AFTER_ROTATION` stops the kernel, market and relay, and leaves the route running.
* **`continue-legacy` straight after a crash** of an open cutover op is allowed (CP-X2's row); that op then counts as ended for a new `cutover`.
* **The `fence_required` message is unchanged** (no `: migration_genesis` suffix); existing tests and the operator surface read it exactly.
* **The rehearsal's Tier-1 ledger** is the fixture cut before its planted `FUTURE_KIND` row (step 1's quarantine case), so `HISTORY_TRANSFERRED` is not blocked. The rehearsal's day is today's IST day: the copier names the final copy by it. Rehearsal rows skip on a weekend because the importer refuses a weekend day.
* **The rehearsal helper is imported** from `test_release_activation.py`, not moved.

**Deviations** (recorded for review):

* **Unit names collide (resolved 13 November 2026).** Legacy at 445eb116 ships `at-strategy.service`, `at-strategy.timer`, `at-backup.service`, `at-backup.timer`, `at-research.slice`, `at-research-worker.service` and `at-research-model.service` (`deploy/systemd/`), names the target rendered or started. Writing the target's units would have replaced a running legacy unit file, and masking one name masks both. The owner renamed the target's units ([decision](../../decisions/owner-answers-2026-10-27.md#unit-names-that-clash-with-legacy-2026-11-13)): `at-strategy-host.service`/`.timer`, `at-ledger-backup.service`/`.timer`, `at-research-jobs.slice`, `at-research-job-offline.service`, `at-research-job-model.service`. `CUTOVER_STAGED` keeps the `CFG-R10 unit_name_collision` check, now over the rendered units and the transient ones (`install.unit_name_clash`), so it refuses only if a future legacy list clashes again; `tests/contracts/test_rendered_units.py::test_unit_names_disjoint_from_legacy` holds the target's set disjoint from legacy's list at 445eb116.
* **Masking on a real systemd is not checked.** `systemctl mask` refuses a unit whose file is in `/etc/systemd/system`, where legacy's units live. The fake `systemctl` does not model that, so step 3 must check it on copies.

**Not built, carried:**

* the production runners: `isolated_work.py --key-probe` (the unit properties are built, the mode is not wired); the copier pass and the `legacy_views/1` runner (SLICE-13 step 6). Each refuses in production (`MIG-R18` or `CFG-R08`) until composed.
* rendering `legacy_polkit_rule` into `apply-root`'s files (the function exists and is tested).
* the production backup destination and lease store (POL-O01).
* `scripts/verify_recovery.py` calling `projection_heads`.
* the record formats SLICE-13 step 7 (`ops09-record/1`) and SLICE-11 step 11 (the D10 record's `bundle_digest`) must emit, as this step reads them.
* the wrong-key capture for `REFUSAL_SIGNATURES`.
* the integration edits listed for the spec owners.

**Open for the owner:** the unit-name collision (rename one set, or another way to tell them apart); the two owner questions above (the binding hold proposal; the root-written additions).

## Step 2 — continuity

<a id="step-2--continuity-outline"></a>The authorities are the migration spec's [continuity across later releases](../../design/migration-recovery-rollback-continuity.md#continuity-across-later-releases-req-mig-008) and PRF-MIG-15, the configuration spec's [history compatibility](../../design/configuration-artifacts-release.md#history-compatibility-bootstrappy) (`CFG-R11`, "checked at the same two points") and [activation boundary](../../design/configuration-artifacts-release.md#the-activation-boundary), the protection spec's PRF-PRT-12 (which names the same test file), and Combined-F6 (`README.md:909`). Step 2 is TASK-S14-02. Target citations are OA_NEW `slice-08` at `97ef7c0` (step 1 merged), read on 12 November 2026; the builder re-reads each cited line before using it. Class S: temporary directories, the simulated broker, the installer's rehearsal mode with the fake `systemctl`. **Nothing touches the EC2, a key, a broker or money.** No score, threshold or money value is set.

**In plain words.** This step proves that work the system still owes (a half-filled order, a cancel nobody knows landed, a stop protecting a position) keeps its meaning and its name through a restart, a crash and a night between two sessions, and that a new release cannot be switched in while such work is open. It also builds one missing refusal: a release whose code cannot run a live position's protection is refused before it is switched in.

### Decisions

#### What is built and what is only proved

* **Built (production change, small):** `CFG-R11`. The configuration spec runs it at activation and SLICE-11 step 7 planned it (`check`, the Composition row of PRF-CFG-07), but step 7 as built carried it: `grep CFG-R11` finds no code in OA_NEW. Under the first release's activation boundary the account is flat at every release change, so `CFG-R11` finds nothing by construction and changes no live behaviour; the spec says it still runs. It sets no score, threshold or entry gate.
* **Only proved:** everything else. The kernel's restart, session and protection behaviour exists (SLICE-03, SLICE-06 steps 2 and 5, SLICE-13 step 5's after-close rule); this step adds no kernel code.
* **Built on the coordinator's decision** (below): `restore` after a converged activation runs the activation boundary.

#### `CFG-R11` (`operations/deployment.py`, `deploy/install.py`)

* **`continuity_reasons(reader) -> list[str]`** in `operations/deployment.py`, beside `compatible` (`deployment.py:322-335`): `kernel.protection.unrunnable_legs` (`protection.py:131-144`) over the reader's connection (passed as an object with `connection = reader.conn`, so the kernel function is unchanged), each `(position_id, reason)` as `CFG-R11 obligation_unrunnable: <position_id> <reason>` (`ladder_version_unknown` or `policy_unloadable`, `protection.py:116-128`).
* **Whose code judges.** `runnable` reads `SUPPORTED_LADDERS` and `ProtectionPolicy` of the interpreter that runs it. Every `at-installer` command runs as `<release>/venv/bin/python -I <release>/deploy/install.py` (OA_NEW `docs/operations.md:19`), so `check R` and `activate R` judge R's own code. **Spec and code:** the spec's manifest-only `compatible` needs no code of R; `CFG-R11` does, and gets it from this rule. Not added to the manifest.
* **Where it runs.** **Deviation (from the configuration spec's "two points": the kernel before it opens the writer, and the installer before it activates an older release):** the kernel's start does not refuse, by SLICE-06 step 5's recorded Deviation (`SLICE-06-protection-and-safety.md`, "At the advance: report, never refuse": refusing the advance would stop every position's protection; the kernel reports `unrunnable` and isolates the leg). The installer runs it for every release change, forward or rollback, not only towards an older release:
  1. `check` (`install.py:869`), after `compatible` (`:902-907`), through the same `_ledger_reader`: `found += [("CFG-R11", x) for x in continuity_reasons(reader)]`; `VERIFIED_DISARMED` `done` gains `unrunnable: []`.
  2. `_step` (`install.py:1848`) at `BOUNDARY_QUIET` and `QUIET_BEFORE_SWITCH`, after `_boundary` passes: a new `_continuity(ctx)` reads the ledger again (Combined-F6: "verify the actual head at activation", since the head may have moved since `check`) and raises `Refused("CFG-R11", …)`; the `done` facts gain `unrunnable: []`. It runs after the boundary, so in production a non-flat ledger refuses `CFG-R13` first; `CFG-R11` is reached only when the boundary is disabled (a test) or a later in-session release (Combined-F6, the owner's listed improvement) removes it. The refusal actions are the state's (`activation.refusal_actions`): at `BOUNDARY_QUIET` nothing stops; at `QUIET_BEFORE_SWITCH` the stopped set restarts.
* **Not added:** the kernel's own start (the Deviation above); the cutover's `cutover_boundary` (its ledger holds only imported history, no native `protection_state`, before the switch); `restore` (it runs the current release's code, not the previous one's, so it cannot judge the previous code; a converged op's `restore` runs the boundary only, below).
* **The "test-only composition"** is `monkeypatch.setattr(inst, "boundary_reasons", lambda *a, **k: [])` inside the test. No production flag or seam disables the boundary.

#### Decision: `restore` after `CONVERGED` is a rollback (coordinator, 12 November 2026)

`restore` (`install.py:2076-2117`) stops the new set, re-applies the previous copy and starts it, checking `compatible` only after a migration; it never ran the activation boundary. Its purpose is undoing a failed or crashed transition, which began at a quiet boundary. After a `CONVERGED` activation it is a rollback and would switch releases over open obligations. **Decided:** legacy applies its flat list to every deploy (Fork call 1 of SLICE-11 and of this slice) and the migration spec says every release change happens flat, so `restore` of an op whose last record is `CONVERGED` runs the same boundary as `activate` (`boundary_reasons`) before stopping anything, refusing `CFG-R13` with the refusal recorded on the `restore-` op (`RESTORING` `refused`). `_continuity` is not run there (the bullet above). A mid-transition crash or failed op restores as before (CP-R3…CP-R5 unchanged).

#### The obligation world (test helpers in `tests/recovery/test_release_continuity.py`)

Labelled synthetic, on the protection loop worlds of `tests/unit/test_protection_loop.py` (imported, not copied): `world_of` (`:56`), `entry` (`:64`), `pass_` (`:80`), `settle` (`:86`), `add_close` (`:106`), `leg` (`:111`), `desires` (`:116`), `admitted_keys` (`:125`), `RISE` (`:151`), `bar` (`:168`); from `tests/conftest.py`: `admission_world` (`:929`), `build_admission_world` (`:918`), `admit_human` (`:231`), `owner_authorize` (`:283`), `book_step` (`:1141`), `observe` (`:1134`), `FakeCalendar` (`:146`), `FakeLeaseStore` (`:63`), `CAL`, `SCOPE`, `CANDIDATE`, `POLICY_ID`, `bound` (`:528-540`).

* **`story(world) -> pid`**, the obligations open at once:
  1. **Partial fill:** `entry(world, fill=25)`: E1 for 75 acknowledged, 25 filled; the stop placed for 25 (`stop_on_fill`) and confirmed at 15.00 after `settle` (the shape of `test_a_later_fill_raises_the_stop`, `test_protection_loop.py:320-337`).
  2. **Active protection:** `bar` over `RISE[:3]` with `settle` after each: the trail active at 23.50, one level modify of S1 confirmed.
  3. **Uncertain cancel:** `admit_human(world.comp, CancelRequest(CommandKey("k-cancel"), TEST_PRINCIPAL, ACCT, "E1"))` (E1's working remainder of 50), the responder step `{"result": "timeout"}`, `dispatch`: `k-cancel` is `UNCERTAIN` with one `DISPATCH_CLAIMED`. A real dispatch, not `unresolved`'s written events (`conftest.py:989`); if admission refuses the test principal, the builder uses the owner and says so.
* **`late_fill(world)`:** `book_step(kind="fill", order_id="E1", quantity=50, fill_id="F-E1b")`: the cancel lost the race.
* **`obligations(writer) -> dict`**, what must not change: for every command not terminal, `(command_key, verb, state, request digest, attempt count, last attempt state)`; every position not closed, `(position_id, owned_quantity, state)`; every `protection_state` row, `(position_id, ladder_version, policy_version, exit_reason)`; the last `PROTECTION_DESIRED` per position, `(desired_level, desired_quantity, ladder_state, ladder_version, policy_version)`; the broker order IDs of each live leg. No sequences or times, so two runs compare.
* **`carry(old, new)`:** the broker outlives a kernel restart, so the new composition's simulated broker takes the old one's `_orders`, `_trades` and `_last_price` (the seams `test_crash_boundaries.py:374-383` sets), and the new `FixtureMarket` the old `close_rows` and `ticks`. After a killed child the parent seeds the book as the child left it, as `_reopen_protected` does (`test_crash_boundaries.py:362-384`).
* **Restarts:** clean is `comp.recovery.shutdown(True)` (`recovery.py:620`), the loop stopped, then `world_of(admission_world, reopen=True)` on the shared `FakeLeaseStore` (routine advance, as `test_restart_mid_session`, `test_session_transitions.py:72-81`). A kill is a child process: this test file is also the driver (`__main__`, as `test_crash_boundaries.py:1600-1663`), building with `build_admission_world(…, fault_plan=FaultPlan(point))` and exiting 86; the parent reopens with a fresh `FakeLeaseStore` (the lease after a crash is PRF-SES's subject, not this one's).
* **The session transition:** the policy `bound(ai_mode="off", review_required=False, protection=ProtectionPolicy(session_close="broker"))` (as `test_session_close_broker_sends_nothing`, `test_protection_loop.py:597-605`), so the position is still open at the 15:30 IST close (labelled synthetic: in production the broker's square-off is the backstop and a day order would lapse). The close is `recovery.tick()` after 10:00Z; the next day is `world.comp.sessions.calendar.days[(CAL, "2026-11-03")] = FakeCalendar.day("2026-11-03")` (the dictionary `test_close_survives_calendar_outage` edits, `test_session_transitions.py:125-131`); a second binding `b-2` is authorized before it, so the continuity hook runs (`lifecycle.py:194-199`: only on a changed `binding_id`). `b-2` names a second bound policy whose `ProtectionPolicy` differs from 2 November's (`protection_policy_from({"ladder": {"atr_mult": 2.5}})`, as `test_a_leg_keeps_its_policy_after_the_binding_changes`, `test_protection_loop.py:890-900`), so a leg taking the new policy changes `policy_version` and the assertion can fail. Its ladder version cannot differ: this code runs one ladder (`SUPPORTED_LADDERS`, `contracts/decisions.py:154`), and a leg on an unsupported one is the unrunnable case. After the close, protection makes no attempt (`ProtectionLoop._after_close`, `protection.py:903`). If the simulated book is day-scoped, the test seeds the 3 November book as the carried state and says so.
* **The installer rehearsal:** `Rehearsal` imported from `tests/recovery/test_release_activation.py:320` (as step 1 did), subclassed as `ContinuityRehearsal` whose `build` adds the readers a real bundle has (`readers.event` as `deployment.py:180` makes them, `schema.migration_revision` the highest migration), so `compatible` passes over a real ledger. `obligation_ledger(path, *, older_ladder=False)` runs `story` in a world at `path` (`trail.LADDER_VERSION` patched to `premium@older` while it runs, as `test_protection_loop.py:903-912`, when `older_ladder`), shuts it down cleanly and returns the pid; the file is copied to `{DIR}/srv/ledger/ledger.sqlite` (`rehearse_init`, `install.py:1454`) **after** `rh.ready()`, except where a test checks over it.

### Tests

**`tests/recovery/test_release_continuity.py`** (new, PRF-MIG-15 and PRF-PRT-12's session part; as built, 18 with `test_restore_after_a_crash_mid_transition_is_unchanged`):

| Group | Test | Asserts |
|---|---|---|
| Release change refused | `test_release_change_over_open_obligations_refused_before_any_stop[forward\|rollback]×[broker_and_ledger\|ledger_only]` | A converged; B ready; the obligation ledger placed; `rh.set_broker(positions=1, orders=2)` or flat; `activate` B (forward) or, with B current, A again (rollback) → `CFG-R13`; the reasons name the broker's position and working orders (first variant) and `command(s) in flight, uncertain or working` (both); no `STOPPING` record; every unit active on the current release; `current` unchanged; `projection_heads` (`deployment.py:778`) of the ledger equal before and after |
| | `test_restore_after_a_converged_activation_over_open_obligations` | A then B converged, the obligation ledger placed, `restore` → refused `CFG-R13`, nothing stopped, `current` is B; with the ledger flat `restore` converges on A (as `test_first_install_then_a_release_then_restore`) |
| `CFG-R11` | `test_check_refuses_a_release_that_cannot_run_a_live_leg` | The older-ladder ledger in place before `check` → `CFG-R11 obligation_unrunnable: <pid> ladder_version_unknown`; refused record; no `VERIFIED_DISARMED` `done`; with `decisions.SUPPORTED_LADDERS` patched to include the older ladder the same `check` passes (the running code judges) |
| | `test_activation_with_the_boundary_disabled_refuses_an_unrunnable_leg[forward\|rollback]` | B checked (rollback: B converged, then A again) over a flat ledger; the older-ladder ledger placed; boundary disabled (test-only) → `activate` refuses `CFG-R11` at `BOUNDARY_QUIET`; nothing stopped; `current` is A |
| | `test_continuity_is_still_run_on_a_flat_change` | A flat ledger (the story run to its exit, position closed) → `VERIFIED_DISARMED`, `BOUNDARY_QUIET` and `QUIET_BEFORE_SWITCH` facts carry `unrunnable: []`; `CONVERGED` |
| Restarts | `test_a_clean_restart_keeps_every_obligation` | `obligations` equal before shutdown and after the reopen's advance, before any observation; no `COMMAND_ADMITTED` or `DISPATCH_CLAIMED` written by recovery; `recovery.report["unrunnable"]` empty |
| | `test_a_restart_then_a_late_fill_equals_the_continuous_run` | Two worlds (own ledger path and `RecordedClock`), the same steps: `story`; [restart]; `late_fill`; `bar` over `RISE[3:5]`; `settle`. `obligations` equal; `k-cancel` has one claim in each; the raise is one modify of S1 to 75; the trail levels after the restart equal the continuous run's (the ladder state carried) |
| Session transition | `test_a_session_transition_carries_the_obligations[running\|down_over_the_close]` | `story`; the close (`calendar_close`, or the kernel shut down before 10:00Z and reopened at 09:05 IST, `closed_in_recovery`); `late_fill` after the close: the `FILL` recorded, no new `prot:` key while closed; `b-2` authorized; 09:20 IST: `SESSION_OPENED` for 3 November with `b-2`; then one desire at 75 and one raise of S1, each with the 2 November `ladder_version` and `policy_version`; `k-cancel` one claim; the `command_identity` row of the placement unchanged |
| | `test_a_session_with_an_unrunnable_carried_leg_does_not_open` | The older-ladder story across the close: `SESSION_OPEN_FAILED` reason `continuity` on 3 November, once over several ticks; no `SESSION_OPENED`; `recovery.report["unrunnable"]` names the leg |
| Crash at the handoff (a killed process) | `test_killed_at_the_handoff_then_resumed[in_session\|next_session]` | Child: `story`, (`next_session`: through the close and the next open), `late_fill`, killed at `CP-P4` (`protection.py:1125`: the desire at 75 committed, the raise not admitted). Parent: reopen, seed the book, passes → one desire at 75 (not recorded again), one raise of S1 to 75, `k-cancel` one claim, no other new key; `obligations` equal to the continuous run taken to the same point |
| | `test_killed_between_the_close_and_the_next_open` | Child: `story`, the tick that commits `SESSION_CLOSED`, `os._exit(86)`. Parent: reopen next morning → no second `SESSION_CLOSED`; the 3 November session opens; carried as above |

**Changed existing:** none expected. Existing rehearsal rows have no ledger at `ledger.path`, so `check` and the quiet states see `unrunnable: []`.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/operations/deployment.py` | `continuity_reasons` |
| `deploy/install.py` | `CFG-R11` in `check`; `_continuity` at `BOUNDARY_QUIET` and `QUIET_BEFORE_SWITCH`; the boundary in `restore` of a converged op |
| `docs/operations.md` | `CFG-R11` in the release and rollback text |
| `tests/recovery/test_release_continuity.py` | New, with its child driver |
| Integration edits (for the spec owners) | The configuration spec: the kernel-start Deviation and the installer-code rule; `restore` of a converged op is a rollback under the boundary; **spec drift:** PRF-MIG-15 cites "the Combined-F6 row (`README.md:1255`)", but `:1255` is the D10 row and the Combined-F6 row is `README.md:432`; the protection spec's PRF-PRT-12 file column lists `tests/unit/test_protection_loop.py` (SLICE-06's rows) beside this file; SLICE-11's carried PRF-CFG-07 Composition row (`CFG-R11`) is met here |

### Completion conditions (step 2)

* The new tests, `tests/recovery/test_release_activation.py`, `tests/recovery/test_initial_cutover.py`, `tests/unit/test_protection_loop.py`, `tests/recovery/test_crash_boundaries.py` and the layering and import guards pass twice on Windows, Linux-only rows skipped with their reason. No full suite.
* Each crash row kills a real process.
* Break checks, written in the as-built note, each failing a listed test, every file restored (md5): `continuity_reasons` returns `[]`; `_continuity` skipped at `BOUNDARY_QUIET`; the obligation ledger's uncertain cancel dropped from `ledger_reasons`; the after-close rule removed (a raise sent while closed); the continuity hook made always true; `CP-P4`'s desire written twice on resume.
* Nothing touched the EC2, a key, a broker or money.

### Step 2 as built

**Built** in OA_NEW `9972386` on `slice-14` (from `slice-08` `97ef7c0`), one commit, then fast-forwarded onto `slice-08`; not pushed. Built in the worktree `OA_NEW-s14` with `PYTHONPATH` set to its `src`.

| Part | Files |
|---|---|
| `continuity_reasons(reader)` (`CFG-R11 obligation_unrunnable`) | `operations/deployment.py` |
| `CFG-R11` in `check` (`VERIFIED_DISARMED` facts gain `unrunnable`); `_continuity` after the boundary at `BOUNDARY_QUIET` and `QUIET_BEFORE_SWITCH` (`QUIET_AFTER_STOP` keeps the boundary only); `restore` of a `CONVERGED` op (called without `op`) runs `boundary_reasons` before anything stops, refusing `CFG-R13` as `RESTORING` `refused` | `deploy/install.py` |
| Release, rollback and `CFG-R11` text | `docs/operations.md` |
| Tests: 18 | `tests/recovery/test_release_continuity.py` (new, with its child driver) |

**Run.** Windows, Python 3.14 (`.venv-slice01`), plain pytest, affected only, twice: `tests/contracts`, the new file, `test_release_activation.py`, `test_initial_cutover.py`, `test_recovery_set.py`, `test_restore_fencing.py`, `test_crash_boundaries.py`, `tests/integration/test_supervisor.py`, `tests/unit/test_protection_loop.py`: **1050 passed, 12 skipped** both times. After the fast-forward, `tests/contracts` in the main checkout (whose `python -I` guards read it): **525 passed, 5 skipped**. No full suite.

**Break checks** (`s14_step2_breaks.py` in the session scratchpad): **8, each failing its listed test**; every file restored (md5 checked).

| # | Broken | Caught by |
|---|---|---|
| B1 | `continuity_reasons` returns nothing | `test_check_refuses_a_release_that_cannot_run_a_live_leg` |
| B2 | `_continuity` skipped | `test_activation_with_the_boundary_disabled_refuses_an_unrunnable_leg` |
| B3 | uncertain and working commands dropped from the boundary | `test_release_change_over_open_obligations_refused_before_any_stop` |
| B4 | the after-close rule removed | `test_a_session_transition_carries_the_obligations` |
| B5 | the session continuity hook always true | `test_a_session_with_an_unrunnable_carried_leg_does_not_open` |
| B6 | the converged `restore`'s boundary removed | `test_restore_after_a_converged_activation_over_open_obligations` |
| B7 | the boundary on every `restore`, mid-transition too | `test_restore_after_a_crash_mid_transition_is_unchanged` (added for this break) |
| B8 | `check` skips `CFG-R11` | `test_check_refuses_a_release_that_cannot_run_a_live_leg` |

**Crash rows kill a real process:** CP-P4 at the late fill in session and after the next day's open, and a kill right after `SESSION_CLOSED`; the installer killed at `SWITCHED:intent` before the mid-transition `restore`.

**Differences from the text above**, each smaller than a decision:

* **The restart's broker** is seeded through `build`'s `wrap` before the reopened composition's first read (the old book copied), so the first read never sees an empty book; after a killed child, the book is the in-process reference run's at the same point.
* **Two worlds on one account** each take their own `FakeLeaseStore` (one store would refuse the second `SES-R10 lease_held`).
* **`ContinuityRehearsal`** overrides `build_copy` too, so the root copy's bundle matches the staged one.
* **`test_continuity_reasons_judge_the_running_code`** was merged into the `check` test (the review's item 5): the same `check` passes with `SUPPORTED_LADDERS` widened.
* **Added:** `test_restore_after_a_crash_mid_transition_is_unchanged` (CP-R3…R5 keep their restore with a position open).
* **The session test asserts** b-2's `policy_version` differs from 2 November's before checking the leg kept 2 November's.

**Deviations** (recorded for review): the kernel's start does not refuse `CFG-R11` (SLICE-06 step 5's Deviation; Decisions above); `CFG-R11` runs at every release change, not only towards an older release; `restore` judges no `CFG-R11` (it runs the current code).

**Not built, carried:** the integration edits listed in Files (configuration spec, protection spec PRF-PRT-12 file column, the `README.md:1255` → `:432` spec drift, SLICE-11's PRF-CFG-07 Composition row met here).

## Step 3 — the cutover rehearsal on copies (outline)

Deepened after step 1 is built; held until the owner's word, which the owner has not pre-approved. It changes nothing that trades, but it runs the real installer and kernel on the production host, so it runs under this isolation:

* a new directory under `paths.shadow.root/rehearsal-<n>/`, holding the candidate wheel installed with its lock, its own `release.root`, its own ledger, evidence store, market store, compat root and a `DirectoryLeaseStore`; nothing under the production `release.root`, no unit file written, no `current` link touched, no `systemctl` but the installer's fake one;
* every process a transient unit through `scripts/isolated_work.py` in `at.slice`, as `at-shadow`, with no credential, `PrivateNetwork=yes`, the production and legacy roots inaccessible except the shadow's own copies, which it reads;
* the broker played by the simulated broker loaded with the copied books, so no OpenAlgo call and no key probe is made (the probe step records `skipped: rehearsal`);
* stopped at once, with the finding recorded, on any sign of load on legacy or the host beyond the measured shadow load.

* **Does:** walks every cutover state in the installer's rehearsal mode on the EC2, in an isolated directory, with a fake `systemctl` standing in for legacy's units and the copied books standing in for the broker; imports the full copied history into a rehearsal ledger with complete accounting; seals a genesis; starts the candidate's kernel in that directory to `RECOVERY_WRITING`; walks `continue-legacy` once before a simulated first claim and once after it.
* **Records:** the duration of each state, the import accounting, every refusal met and why, in `docs/migration.md`.

## Step 4 — the production cutover (outline; needs the owner's word)

Production-sensitive: "the cutover (SLICE-14)" is asked first under the standing rules. Deepened, then held until the owner names the release and the evening.

* **Before the word, ready or not** (a list for the owner): the candidate `VERIFIED_DISARMED` on the host and the same bundle in the shadow and the D10 rehearsal; the licence, account, account limits, lease store and backup destination bound; PRF-OPS-09's record (which `CUTOVER_STAGED` checks); the shadow days and their defect counts (one or two clean end-to-end days are enough, by the owner's answer, and nothing counts them); step 3's record if the owner chose to run it; the conversion decision (PRF-MIG-08); the carried safety state the genesis will record, and the note that `run/KILL` stops working after the switch; the open items above.
* **Does:** `deploy/install.py cutover` from `CUTOVER_STAGED` to `CONVERGED` after the close. The owner: states legacy's kill flag in the word; installs the current key for the observation route at `OBSERVER_READY` when the route is the mediator; replaces the OpenAlgo key at `CREDENTIAL_ROTATED`, attests it and installs the new key for the kernel, the market process and the mediator; records the fence naming legacy (old host `legacy:<host_id>`, stopped, units masked and key replaced, the probe's status, a book read after the replacement); and advances by hand. A refusal before the key change leaves legacy running or restarts it on its unchanged key; a refusal after it ends `FAILED_AFTER_ROTATION`, where nothing can send and the account is flat, and the owner chooses `--resume` or `continue-legacy` (legacy's restart is then the owner's key action). A retry another evening starts a new ledger, the old one set aside.
* **Produces:** PRF-MIG-14 and PRF-SES-07: the cutover record, and the evidence that the old route cannot send (the probe's refusal, or the owner's attestation labelled as such; the old units masked).

## Step 5 — after the first session (outline; needs the owner's word)

Deepened after step 4. Production-sensitive because it changes the configuration of tools on the production host.

* **Records** the sequence of the first `DISPATCH_CLAIMED` after the genesis as the old route's retirement in `docs/migration.md`; from that commit `continue-legacy` refuses.
* **Points** the retained consumers of the registry format (legacy's monitor, the `at orders` view, analysis and acceptance tools, as the migration spec lists) at `paths.compat`, on the owner's word per consumer; legacy's money-path readers stay retired. Legacy's monitor and gateways were masked because they hold the key (`deploy/systemd/at-monitor-v2-sweep.service:10` loads the shared settings file, as the runtime spec cites); a retained legacy tool runs only as a transient unit through `scripts/isolated_work.py` with no credential and no broker network (`PrivateNetwork=yes`), or, where it must read the broker, through the observation route only. A tool that cannot run that way stays masked. Whether legacy's monitor runs at all without its key is **not checked**.
* **Keeps** legacy's run directory and ledger read-only in the next recovery set, as evidence; nothing of it is deleted (A10-F3).

## Completion conditions

* PRF-MIG-13 and PRF-MIG-15 pass, including the kernel-side refusals of a direct advance without the legacy fence and of any advance after `ROLLBACK_CONTINUATION`.
* Step 3 is done on the owner's word with its record, or recorded as not asked for.
* Steps 4 and 5 are done on the owner's word, with PRF-MIG-14 and PRF-SES-07 recorded, or recorded as waiting for it, with the licence, POL-O01 and POL-047 named.
* The spec and this file record each step "as built", with every Deviation and Fork call.
