# SLICE-11 — Packaging, release, supervision, isolation, backup and restore

* **Status:** proposed (2026-10-30); revised the same day after the coordinator's design review (findings F-1…F-14, each resolved in this file and the two specs). Every step below is an outline: by the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30), each step's exact detail is written just before it is built, then reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
* **Precedence:** the master README, then the ROADMAP, then this package. The authorities are the [configuration spec](../../design/configuration-artifacts-release.md) and the [runtime spec](../../design/runtime-isolation-observability-deployment.md); for step 8, the [migration spec](../../design/migration-recovery-rollback-continuity.md). Every intentional difference from legacy is marked **Deviation**; every money-touching fork keeps legacy's live behaviour and is marked **Fork call** ([table](#fork-calls)). No score, threshold or money value is set here: measured values stay unbound until step 9 measures them and the owner approves them.
* **Phase:** master Phase 2 (D05, A02-F1…F4, D06), with Phase 7's D10 rehearsal only (steps 10 and 11). Environment class S for steps 1–8; step 9 reads recorded sessions in an isolated copy on the EC2 (class R, pre-approved read-only work); steps 10 and 11 are production-sensitive (class P) and **need the owner's word**.
* **Builds on:** SLICE-02, SLICE-03, SLICE-06, SLICE-07 and SLICE-10 as built (the delivery plan's prerequisites), and SLICE-08 and SLICE-09 as built (the build order puts both before SLICE-11). The branch `slice-11` is cut from the latest built slice on `agentic-desk`.
* **Owner answers applied:** [Q-002](../../decisions/owner-questions.md#q-002) (₹3,600, merged with the account layer as legacy does); [Q-005](../../decisions/owner-questions.md#q-005) (BuyerEdge on the current account); [Q-009](../../decisions/owner-questions.md#q-009) (routine restarts resume automatically); [Q-011](../../decisions/owner-questions.md#q-011) and the register's measured fields (step 9); [Q-015](../../decisions/owner-questions.md#q-015) (every loss limit per account, in config); the standing rules (fork rule; boundary). **Open, behind refusing settings:** the licence (`release.license`), the backup destination (POL-O01) and with it the lease store's location (`recovery.lease_store`), the RTO and failover authority (POL-047).
* **Tasks and proofs:**
  * **Step 1:** TASK-S11-02 (resolver part), TASK-S11-01 (`requirements.lock`): PRF-CFG-02.
  * **Step 2:** TASK-S11-01, TASK-S11-02 (manifest and handshake parts), TASK-S11-10: PRF-CFG-01, PRF-CFG-04, PRF-CFG-10, PRF-CFG-11, PRF-XC-02 (production composition part).
  * **Step 3:** TASK-S11-03 (host part): PRF-OPS-01, PRF-PRT-06 (kernel frozen half).
  * **Step 4:** TASK-S11-03 (supervisor part): PRF-OPS-02, PRF-OPS-03, PRF-PRT-14.
  * **Step 5 (conditional):** TASK-S11-06: PRF-DOM-06.
  * **Step 6:** TASK-S11-04, TASK-S11-11: PRF-OPS-04, PRF-OPS-05, PRF-OPS-06.
  * **Step 7:** TASK-S11-08, TASK-S11-09: PRF-CFG-03, PRF-CFG-05, PRF-CFG-06, PRF-CFG-07, PRF-CFG-08, PRF-OPS-07.
  * **Step 8:** TASK-S11-05 (synthetic part, with the send-lease store adapter): the migration spec's REQ-MIG-006 and REQ-MIG-007 proofs off production.
  * **Step 9:** TASK-S11-07: PRF-OPS-08.
  * **Step 10 (owner's word):** TASK-S11-12: PRF-CFG-09.
  * **Step 11 (owner's word):** TASK-S11-05 (real part): the D10 rehearsal evidence (`README.md:1232`).

**In plain words.** This slice turns the new system from code that only tests run into something that can be installed and watched on the trading server. Step 1 builds the one way every process reads its settings. Step 2 builds the installable package, the manifest that lists every file a release must have, the check each process makes when it starts, and the check two processes make when they connect. It also keeps today's two layers of entry limits, so the stricter of the account's and the strategy's limits still applies. Step 3 builds the loop that keeps the kernel running: a pass on every event, and otherwise on today's schedule, every 20 seconds lined up with the moment each minute's bar becomes final. Step 4 builds the supervisor, which watches the ledger and the broker read-only and says whether each position is protected, and which can never place an order. Step 5, only if needed, builds the read-only gateway the supervisor uses to see the broker's books. Step 6 caps tests, research and backups as one group, keeps room for the nightly backup, and keeps them away from the live files and the broker key. Step 7 builds the installer and the service files, and the recorded, resumable switch from one release to the next, which checks three times that nothing is open and never runs old and new side by side. Step 8 builds backup, restore and the off-machine lease store against test data. Step 9 measures, on copies of real recorded days, the timing values nobody has measured yet, for the owner to approve. Steps 10 and 11 touch the real server and wait for the owner's word: staging a release there without switching to it, and a real restore rehearsal on a clean machine. No trading rule, limit or threshold changes.

**Excluded, and where each part arrives:**

* **SLICE-09:** where the BuyerEdge strategy host runs (its unit, `at-strategy.service`, is SLICE-09's tree delta T-59, rendered from this slice's participant contract); its seal wait; whether its timer keeps legacy's calendar `ExecCondition` and session preflight (`deploy/session_preflight.py:1-25`), which refuse a session start. Those are money-touching start gates, so SLICE-09 keeps them or records a Fork call.
* **SLICE-10:** `settings/secrets.py` (how a `credential:` reference resolves), the operator relay's and CLI's content, the operator alert route, the local channel and its peer and group rules, which this slice's per-unit users follow.
* **SLICE-12:** the D06 acceptance row's "claim and complete one isolated job each" half (**Deviation:** research is deferred in the first release, so PRF-CFG-06 proves rendering and refusal only) and the research units.
* **SLICE-13:** PRF-OPS-09, the supervisor's deployed check, runs against the disarmed shadow's ledger; before the shadow, the target ledger on the production host holds no live obligation to assess.
* **SLICE-14:** activating the target as the production writer (the first `SWITCHED` on the production host), and retiring the old route.
* **SLICE-04 and SLICE-06:** whether the target carries legacy's gateway backstop `daily_loss_limit` 5000 (`config/profiles/enforcing.yaml:104`), which sits above both limit layers.
* **The migration spec's deepening** (the SLICE-13/14 owner): the recovery-set manifest, `operations/backup.py`, `operations/restore.py`, `scripts/verify_recovery.py`, `scripts/check_release.py` and the send-lease store adapter. Step 8 is deepened only after those sections exist; this slice does not specify them.
* **PRF-ADM-07 and PRF-PRT-08:** they run through `scripts/compare_parity.py` (migration spec) on the recorded sessions step 9 captures, before any live use, as SLICE-06 and SLICE-08 recorded.

## Steps

| Step | Builds | Class | Proofs |
|---|---|---|---|
| 1 | `FIELDS` and the participant contract with per-participant users (`settings/schema.py`); the three-layer resolver with the rules table, provenance, projections and the effective revision (`settings/loader.py`); `resources/defaults.yaml`; `requirements.lock` with hashes | S | PRF-CFG-02 |
| 2 | Entrypoints with `--check` for every first-release participant: `at-kernel`, `at-market`, `at-supervisor`, `at-strategy`, `at-operator`, `at`, and `at-cognition` when composed (`pyproject.toml`); `bundle.json` with the UI shipping manifest, and the release receipt; `verify_loaded`, `compatible`, `validate_composition`, `compose_production`, `COMPOSITIONS["first_release"]` (`bootstrap.py`); the handshakes (`settings/schema.py`, with the channel's and the market store's sides); the account limits layer and legacy's merge (`kernel/admission.py`); the installed-artifact test outside the checkout | S | PRF-CFG-01, PRF-CFG-04, PRF-CFG-10, PRF-CFG-11, PRF-XC-02 (production part) |
| 3 | The kernel host loop (`kernel/host.py`, T-70): phase-locked passes, hand-offs, heartbeat, stop and drain (`Coordinator.drain_returns`), the exception policy, the lease-expiry wait in `bootstrap` | S | PRF-OPS-01, PRF-PRT-06 (kernel frozen half) |
| 4 | The supervisor (`operations/supervisor.py`): the bounded read model (`LedgerReader.snapshot`), reader impact, observations through a read-only port, assessment, classification, verdicts, publication, alerts, the reserve check and its polkit rule | S | PRF-OPS-02, PRF-OPS-03, PRF-PRT-14 |
| 5 | Only if TASK-S07-06 has not proved native read-only credentials: the mediator's process (`operations/observer.py`, T-71) and unit (T-72) | S | PRF-DOM-06 |
| 6 | Storage classes, the reserve, the disk-full matrix, `at.slice` (T-79) with the backup's reserve, and admission (`operations/isolation.py`); `scripts/isolated_work.py`; `scripts/safe_tests.py` over it; telemetry (`operations/telemetry.py`) | S | PRF-OPS-04, PRF-OPS-05, PRF-OPS-06 |
| 7 | The installer (`deploy/install.py`): render (units, users, polkit), stage, check, activate through every transition state with the three boundary checks and the ordered start, resume, restore, the host-level log, the rehearsal mode; the unit templates (`deploy/systemd/*`); `config/live.example.yaml`; `docs/operations.md` | S (rehearsal directory, fake `systemctl`) | PRF-CFG-03, PRF-CFG-05, PRF-CFG-06, PRF-CFG-07, PRF-CFG-08, PRF-OPS-07 |
| 8 | The recovery set, backup, clean-host restore and the send-lease store adapter, as the migration spec specifies them, against synthetic stores | S | The migration spec's proofs for REQ-MIG-006 and REQ-MIG-007 (synthetic) |
| 9 | Recorded sessions copied read-only into an isolated directory on the EC2; `Measurement` records for every measured refusing field, including legacy's own read load on the account (`operations/verification.py`) | R (pre-approved) | PRF-OPS-08 |
| 10 | **Owner's word.** The candidate release staged on the production host to `VERIFIED_DISARMED`, not switched; the host's versions and the account limits in force recorded | P | PRF-CFG-09 |
| 11 | **Owner's word, after POL-O01 is answered.** A real backup restored with the exact candidate artifact and schema on an isolated clean host; crashes, unresolved effects, identity, custody and refusal before fencing exercised | P | D10 rehearsal evidence (`README.md:1232`) |

Steps 1 and 2 come first because every process start, every unit and every test of later steps goes through the resolver, the bundle check and the handshakes. **Step 2 depends on step 8 for production use:** a production kernel needs the send-lease store adapter and bound lease settings, or it refuses even a human advance (`SES-R10`, OA_NEW `kernel/recovery.py:312-315`). Step 2 therefore builds and tests `compose_production` with SLICE-03's fake lease store, and a production composition refuses until `recovery.lease_store` is bound (step 8 builds the adapter; POL-O01 chooses its place). Step 3 comes before step 4 because the supervisor reads the heartbeat the host writes. Step 7 comes after 3–6 because it renders every unit those steps define.

## Fork calls

The owner's fork rule keeps legacy's live behaviour wherever a choice touches entries, exits, stops, sizes, limits or thresholds. Each call below is for the owner's review; the improvement column is listed, not built.

| # | Choice | Legacy at 445eb116 | First release | Listed improvement |
|---|---|---|---|---|
| 1 | When a release may be activated | Every deploy checks the boundary three times: before anything stops (`deploy/deploy_tier1.py:545-573`); after the stop, restarting the stopped set on the unchanged release when it refuses (`deploy/deploy_tier1.py:1099-1112`, `:1471-1499`); and before the cutover step (`deploy/deploy_tier1.py:1404-1436`). The check refuses an unconfirmed-closed market, an open position, a working order, anything unsettled, held or pending, and a legacy sender still alive (`src/tier1/cutover.py:155-209`) | The same list at `BOUNDARY_QUIET`, `QUIET_AFTER_STOP` (refusal restarts the stopped set on the unchanged release) and `QUIET_BEFORE_SWITCH`, with `OLD_WRITER_GONE` for the sender: the old kernel has no process and released its leases `clean`. The observation route stays up for the checks. POL-050's "stop first if live" is moot under this refusal, as in legacy's code | Combined-F6 in-session releases over open obligations with continuity proved (`README.md:909`) |
| 2 | When the kernel runs a pass with nothing waking it | Every 20 s, phase-locked to bar confirmation (passes at :07, :27, :47), the owner's decision of 16 October 2026 (`scripts/run_framework_live.py:3431-3450`, `:7400`, `:7472`; `deploy/systemd/at-strategy.service:51`) | Legacy's `seconds_to_next_pass` ported unchanged, with `host.pass_interval_secs` = 20 and `market.bar_confirm_lag_secs` (POL-019), both configurable | A measured cadence |
| 3 | What happens after a kernel crash | The loop that ran the trail, latch and entries was the strategy session: restart on failure after 60 s, at most 3 in 900 s, not started at boot (`deploy/systemd/at-strategy.service:9-11`, `:23-26`, `:55-56`); the authority only executed sends | The kernel host takes the session's restart values (60 s, 3 in 900 s); `bootstrap` waits for the crashed epoch's lease to expire, then the routine advance (Q-009) resumes it. No trail move or tick exit for 60 s plus the remaining lease; the broker-held stop covers it. systemd's 3-in-900 s and `recovery.routine_advance_limit` both fall back to a human; the smaller wins. The kernel starts at boot as the authority did (`deploy/systemd/at-tier1-authority.service:45-46`) and opens no session by starting | A shorter restart, once the lease time is measured |
| 4 | A frozen kernel | No watchdog (`deploy/systemd/at-tier1-authority.service:27-43`) | No watchdog; the supervisor reports it and a human acts | A `WatchdogSec` kill and restart |
| 5 | Entries on a day the calendar cannot confirm | The strategy unit does not start (`deploy/systemd/at-strategy.service:46-48`) | No financial session opens on a day whose status is `unknown` (sessions spec); the strategy host's timer condition is SLICE-09's | — |
| 6 | Memory limits and the kill order | Trading, the session and the recorder uncapped; the kill order fixed, the owner's exposure path at -400 (`deploy/unit_envelope.py:67-84`, `:100-107`) | The kernel, strategy and market units uncapped (POL-052), with legacy's kill order; the operator relay at -400 | — |
| 7 | The entry limits | Two live layers: the account's `limits.*`, set by a drop-in (trades per session 5, entries per desk 10, open structures 1, fresh setup, cooldown 300 s, daily loss 4000, drawdown rate 3000 over 15 min; `deploy/systemd/at-strategy-entry-limits.conf:2-11`), read by `Limits.from_env` (`src/core/framework/sizing/gates.py:64-106`) and passed by the live driver (`scripts/run_framework_live.py:3556`, `:7255-7262`); merged with the policy layer field by field: lower set value, larger cooldown, either fresh-setup, the account's drawdown window, the earliest cutoff (`gates.py:109-149`; `src/core/framework/policy/compat.py:39-47`). Live daily loss: the lower of 4000 and ₹3,600 = **₹3,600** | Both layers kept: `account.limits.*` in the deployment configuration (the drop-in's values, bound by the owner after step 10 records what is in force) and the bound policy's layer, merged by legacy's `effective_limits` ported unchanged into admission. OA_NEW's one-layer `SessionLimits` (`contracts/decisions.py:431-446`) alone would have bound 4000 and loosened the limit | — |
| 8 | Which process holds the account's OpenAlgo key | The market poller ran in the MCP gateway with the shared settings file and the key (`deploy/systemd/mcp-gateway.service:40`) | The market process holds the account's key and composes only the market half of the adapter; its unit runs as its own user | Market reads through a read-only route, once one exists for market endpoints |

## Deviations

* **The supervisor holds no trading key and no sending code;** legacy's monitor reads with the trading-capable client and the shared key (`monitoring/sources.py:294-313`; `deploy/systemd/at-monitor-v2-sweep.service:10`). Required by A03-F4 and A06-F2.
* **Per-unit users and per-unit credentials.** Each service runs as its own user, loads only its own credentials through `LoadCredential=`, and every non-kernel unit hides the others' credential directories and processes. Legacy runs every unit as one application user sharing one settings file with the broker key (`deploy/systemd/at-tier1-authority.service:29-32`, `deploy/systemd/mcp-gateway.service:37-40`). Consistent with SLICE-10's per-uid channel peers.
* **Settings:** no `owner.yaml` layer (`src/config/__init__.py:428-439`); an alias conflict refuses instead of resolving by environment order (`:452-462`); `null` unbinds instead of meaning "default" (`:466-472`); an unknown key refuses. Every legacy owner-file and drop-in value is carried into the profile, the account limits or the bound policy unchanged.
* **Releases** are a wheel and locked environment in a release directory switched by one link; legacy fast-forwards the live checkout and runs `pip install -e` (`deploy/deploy_tier1.py:618-702`).
* **Release identity** is the bundle digest and a verification of loaded files; legacy binds the checkout revision and source-tree digest (`src/tier1/release.py:54-79`). The Git SHA is provenance.
* **Convergence is checked at every boundary by handshake** (A02-F1), not only at deploy time.
* **No `--accept-unsettled`** (`deploy/deploy_tier1.py:1117-1156`): unresolved attempts are resolved by reconciliation or the owner's `attempt_resolve` (Q-007) before activation.
* **Tests consult no calendar** (`scripts/safe_pytest.py:147-153`); isolation is verified instead (`README.md:1269`).
* **The supervisor gets its one right through polkit,** not sudo: its unit runs with `NoNewPrivileges`.
* **Host loss raises no alert:** no off-host participant exists; tied to POL-047.

**Open, not a deviation:** the kernel does not ingest the supervisor's outage observations in the first release, against A03-F4's "Kernel ingestion deduplicates observations" (`README.md:922`). Raised as [X-008](../../consistency/master-contradictions.md#x-008); until the master's owner decides, it stays an open gap.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root; `monitoring/` is legacy's top-level monitoring package.

* **Packaging.** A hand-listed package set (`pyproject.toml:112-167`), with the ledger's `apsw` as an optional extra (`:43-45`); Python `>=3.10` (`:9`). The configuration root is two directories above `src/config/__init__.py` (`:52-55`).
* **Settings.** Four layers, later wins: shipped defaults, the profile (with `extends:`), `owner.yaml`, then the environment (`src/config/__init__.py:8-15`, `:398-450`). Environment names map by `AT__` and `MCP_` with `__` separators plus a table of aliases (`:58-80`, `:197-210`); conflicting profile selectors refuse (`:366-383`); the broker key is withheld from children by name (`:213-229`).
* **Entry limits.** Two layers merged field by field, the account layer from the `limits.*` section and its drop-in (Fork call 7).
* **Deploy** (`deploy/deploy_tier1.py:1-68`, `:1401-1469`): preflight and resource checks (memory 1024 MB, disk 2048 MB, `:517-543`); the boundary check before anything stops (`:545-573`); an ordered stop, timers first and the authority last, with the stopped set recorded (`:575-604`, `:474-490`); the flat check again after the stop, restoring the old release on refusal (`:1099-1112`, `:1471-1499`); fast-forward of the checkout and `pip install` (`:618-702`); the flat recheck (`:1424-1425`); the cutover or the rebind of a later release (`:1178-1232`); start, with each gateway's start record matched by its PID (`:1265-1311`, `:1321-1348`); a receipt per step (`:457-467`); the rehearsal mode with a fake `systemctl` (`:1755-1880`); the post-first-request rollback text (`:1561-1570`).
* **Release binding** (`src/tier1/release.py:54-129`): code revision, source-tree digest, effective config digest, unit identity, service start records, SQLite runtime, schema version and epoch; bound only when converged.
* **Units.** The authority: always on, restart on failure after 5 s, 5 in 300 s, `UMask=0077`, stop timeout 60 s, the shared settings file (`deploy/systemd/at-tier1-authority.service:19-46`). The strategy session, which ran the trail, latch and entries: started by a weekday timer, skipped on a holiday or an unknown calendar, phase-locked passes every 20 s, restart on failure after 60 s, 3 in 900 s (`deploy/systemd/at-strategy.service:9-11`, `:23-26`, `:46-56`; `scripts/run_framework_live.py:3431-3450`). The monitor sweep: always on, `Nice=19`, idle I/O, `MemoryHigh=768M`, `MemoryMax=1200M` (`deploy/systemd/at-monitor-v2-sweep.service:12-23`). The backup: oneshot, `Nice=10`, idle I/O, the broker key stripped, nightly at 11:45 UTC (`deploy/systemd/at-backup.service:21-27`, `deploy/systemd/at-backup.timer:9-11`). The research slice and worker (`deploy/systemd/at-research.slice:4-12`, `deploy/systemd/at-research-worker.service:17-35`).
* **Envelopes.** Per-unit memory envelopes empty by default; a fixed kill order; three intentionally uncapped units (`deploy/unit_envelope.py:14-18`, `:67-84`, `:100-107`).
* **Monitoring.** A loop every 90 s in session and 600 s outside (`monitoring/service.py:369-450`), reading OpenAlgo's books through `execution_client` (`monitoring/sources.py:294-313`).
* **Tests.** One run per host and user, a memory and load check, a market-hours gate for the live checkout, a user-scope cgroup when available, on-disk temporaries, protected run directories (`scripts/safe_pytest.py:13-35`, `:141-160`, `:163-181`, `:268-294`).
* **Backup.** Restic over classes A and B, class C never; a restore is confirmed by reading it back (`deploy/offbox_backup.py:2-47`); a clean-host fingerprint comparison (`deploy/rehearse_clean_host.py:2-17`).
* **The research environment allowlist** omits the run directory its own unit sets (`src/analysis/jobs/policy.py:33-37`, `:95-107`; `deploy/systemd/at-research-worker.service:13`), LD-18.

## Step 1 — the settings contract and the resolver (outline)

Deepened just before it is built. The authority is the configuration spec's [settings contract](../../design/configuration-artifacts-release.md#the-settings-contract-settingsschemapy), [participant contract](../../design/configuration-artifacts-release.md#the-participant-contract-settingsschemapy) and [resolver](../../design/configuration-artifacts-release.md#the-resolver-settingsloaderpy) sections.

* **Builds:** `FIELDS` with today's 27 fields moved unchanged (names, kinds, environment names) and the new fields of both specs' policy-input tables; `PARTICIPANTS` with each participant's user and credentials (the market process's key is Fork call 8); `resolve(profile, env, *, participant=None) -> Effective`; the shared-budget check; `requirements.lock` with hashes and its generator header.
* **Kept working:** `resolve("test", env)` and every existing caller (`bootstrap.compose_simulation`, the test fixtures), so the whole suite passes unchanged.
* **Test file:** `tests/unit/test_settings_resolver.py` (T-73), one test per rules-table row, with independent expectations.

## Step 2 — the bundle, its verification, handshakes, limits and compositions (outline)

Deepened after step 1 is built: the configuration spec's [bundle manifest](../../design/configuration-artifacts-release.md#bundle-manifest-bootstrappy), [loaded-artifact verification](../../design/configuration-artifacts-release.md#loaded-artifact-verification-bootstrappy), [history compatibility](../../design/configuration-artifacts-release.md#history-compatibility-bootstrappy), [compositions](../../design/configuration-artifacts-release.md#compositions-bootstrappy), [account limits](../../design/configuration-artifacts-release.md#account-limits-bootstrappy) and [boundary handshakes](../../design/configuration-artifacts-release.md#boundary-handshakes-settingsschemapy).

* **Builds:** `[project.scripts]` for every first-release participant (SLICE-09 and SLICE-10 are built), each with `--check`; a build step that writes `bundle.json` from the built wheel, the lock, the installer and templates, and SLICE-10's UI shipping manifest; the receipt `kernel.recovery` binds; `compose_production` for each participant, with the OpenAlgo order half bound only in the kernel and the market half only in the market process, endpoint contracts only from the bundle, and the lease store required; the first-release table.
* **Changes in modules other specs own,** each listed in the step's files and reported to that spec: the handshake in `adapters/unix_channel.py` (projection digests beside SLICE-10's version and release checks) and in `market/store.py` and `market/view.py` (the store records the market process's handshake; `StoreMarket` checks it); the account layer and legacy's `effective_limits` in `kernel/admission.py`.
* **The production composition is exercised class S:** the OpenAlgo adapter talks to the local fake server SLICE-07 built, the lease store is SLICE-03's fake, and no credential exists.
* **Test files:** `tests/contracts/test_installed_artifact.py` (builds the wheel and installs it into a temporary environment outside the checkout); `tests/contracts/test_capabilities.py` gains PRF-XC-02's production part; `tests/unit/test_admission_checks.py` gains PRF-CFG-11, with golden cases generated once from legacy's `effective_limits`.

## Step 3 — the kernel host (outline)

Deepened after step 2 is built: the runtime spec's [kernel host](../../design/runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy) and Fork calls 2–4.

* **Builds:** `serve`, `submit`, the phase-locked schedule ported from legacy's `seconds_to_next_pass`, the heartbeat, the stop sequence with `Coordinator.drain_returns` (a dispatch-spec module change, listed in the step's files), the exception policy, the lease-expiry wait in `bootstrap`.
* **Closes:** SLICE-05's host-loop exclusion, SLICE-06's PRF-PRT-06 "kernel frozen" half and its carried L2/L4/L7 gap, SLICE-07's "host drives the observation loop".
* **Test files:** `tests/integration/test_kernel_host.py` (T-75), with the kernel in a subprocess on a recorded clock, including the :07, :27, :47 schedule and golden cases from legacy's function; `tests/integration/test_protection_kernel.py` gains the frozen-kernel case (the simulated broker's book lives outside the kernel process, so the stop can be observed while the kernel is stopped).

## Step 4 — the supervisor (outline)

Deepened after step 3 is built: the runtime spec's [supervisor](../../design/runtime-isolation-observability-deployment.md#the-supervisor-operationssupervisorpy).

* **Builds:** the cycle, `LedgerReader.snapshot(budget_ms)` (a ledger-spec module change, listed in the step's files), the verdicts, the publication to its own evidence root, alerts once per change through a test alert sink until SLICE-10's route is composed, `check_reserve` and its polkit rule.
* **Reader impact** (A03-F4): the supervisor polls a kernel that commits, with SLICE-02's measurement extended; WAL growth, checkpoint progress and commit latency recorded.
* **Observations** through a read-only `ObservationPort` that the test composes over the simulated broker's books; the real route is the native read-only adapter (TASK-S07-06) or step 5's mediator.
* **PRF-PRT-14** in `tests/contracts/test_capabilities.py`: the supervisor composition imports no order code, constructs no writer and no channel command client, and refuses to start with any broker credential name in its environment (`CFG-R07`); on Linux with systemd, its unit, under its own user, cannot read the kernel's credential or environment.
* **Test file:** `tests/integration/test_supervisor.py` (T-76).

## Step 5 — the observation mediator, only if needed (outline)

Built only when TASK-S07-06 has not proved native read-only credentials when this step starts; otherwise it is recorded as not needed and the supervisor composes the read-only adapter. Deepened then: the execution spec's [observation enforcement](../../design/execution-domain-and-observations.md#observation-enforcement-a06-f2) for its behaviour, the runtime spec's [observation route](../../design/runtime-isolation-observability-deployment.md#the-observation-route) for its process and unit (`operations/observer.py`, T-71; `deploy/systemd/at-observer.service`, T-72). Its socket checks the supervisor's handshake (PRF-CFG-10).

## Step 6 — isolation, storage and telemetry (outline)

Deepened after step 4 is built: the runtime spec's [storage classes](../../design/runtime-isolation-observability-deployment.md#storage-classes-operationsisolationpy), [aggregate envelopes](../../design/runtime-isolation-observability-deployment.md#aggregate-envelopes-operationsisolationpy), [isolated work](../../design/runtime-isolation-observability-deployment.md#isolated-work-scriptsisolated_workpy-scriptssafe_testspy) and [telemetry](../../design/runtime-isolation-observability-deployment.md#telemetry-operationstelemetrypy).

* **Builds:** `admit` with the backup's reserve, `check_reserve`, the disk-full rows not already proved by their owners, `scripts/isolated_work.py`, `scripts/safe_tests.py` over it with its SLICE-01 rules kept, `at.slice` (T-79), `Telemetry`.
* **Tests that need systemd** (a user manager, namespaces) run on Linux and record their coverage limit elsewhere, never a silent pass (A08-F4, `README.md:1213`).
* **Test files:** `tests/isolation/test_resource_storage_scope.py`; `tests/unit/test_telemetry.py` (T-78).

## Step 7 — the installer, units and release transitions (outline)

Deepened after step 6 is built: the configuration spec's [release transitions](../../design/configuration-artifacts-release.md#release-transitions) and [activation boundary](../../design/configuration-artifacts-release.md#the-activation-boundary) (Fork call 1); the runtime spec's [installer](../../design/runtime-isolation-observability-deployment.md#installer-deployinstallpy) and [units](../../design/runtime-isolation-observability-deployment.md#units-deploysystemd).

* **Builds:** every command of `deploy/install.py`; the host-level transition log; every state, including `QUIET_AFTER_STOP` with its automatic restart of the stopped set, `OLD_WRITER_GONE`, `UNITS_WRITTEN` with the old unit set kept, `QUIET_BEFORE_SWITCH`, the observers-first start and `MIGRATION_PENDING`; restore that stops and verifies the new set before starting the old; convergence judged per operation, with timers judged enabled and waiting; the rehearsal mode; the unit templates, system users and polkit rule for every first-release participant (the kernel, market, supervisor, strategy host and its timer, operator, backup and timer, `at.slice`; the observer when step 5 built it; cognition when SLICE-09 composed it); `config/live.example.yaml`; `docs/operations.md` and the Fork calls in `docs/decisions.md`.
* **Crash points CP-R1…CP-R7** are proved by killing the installer process at each, in the rehearsal directory.
* **Test files:** `tests/recovery/test_release_activation.py` (T-74); `tests/contracts/test_rendered_units.py` (T-77), with PRF-OPS-07 run for each unit.

## Step 8 — recovery set, backup, restore and the lease store, off production (outline)

Deepened only after the migration spec's SLICE-11 sections are written by their owner: the recovery-set manifest (A04-F5, `README.md:796`), the restore verification, the anchored heads, the send-lease store adapter (which every production kernel needs, step 2) and the clean-host rehearsal procedure. This step builds them against synthetic stores in temporary directories and a local stand-in for the off-host store, and composes `at-backup.service` from step 7's template. Test files are named by the migration spec (`tests/recovery/test_restore_fencing.py` exists in the tree).

## Step 9 — measurement on recorded sessions (outline)

Deepened after step 7 is built: the runtime spec's [measurement](../../design/runtime-isolation-observability-deployment.md#measurement-operationsverificationpy).

* **Pre-approved read-only work** (standing rules): copying recorded market days and legacy's records on the EC2 into an isolated directory, and reading the deployed OpenAlgo's settings with no order. Runs through `scripts/isolated_work.py` in `~/claude-desktop/` or the separate development checkout, never in the live checkout.
* **Produces** one `Measurement` per measured field in the register and in both specs' policy inputs, including the backup's reserve, SLICE-09's strategy-host waits and legacy's own read load on the account; the owner approves values with the release binding. Nothing is bound before that approval.
* **Feeds** PRF-ADM-07 and PRF-PRT-08 (their owners run them) and the PRF-PRT-10 baseline's recorded tick rates (SLICE-06 step 5).

## Step 10 — staging on the production host (outline; needs the owner's word)

Production-sensitive: "any deploy" is asked first under the standing rules. Deepened, then held until the owner says so for this release.

* **Does:** `deploy/install.py stage` and `check` for the exact candidate on the production host, ending at `VERIFIED_DISARMED`. No `activate`: nothing running is stopped or switched, and the legacy system keeps trading. Records the host's interpreter and systemd versions, `bundle.json`, and the account limits actually in force (the drop-in and any `limits.*` leaves of the deployed configuration, read without any credential file) for the owner to bind as `account.limits.*`.
* **No supervisor run here.** Before SLICE-13's shadow, the target ledger on this host has no live obligation, so a supervisor assessment would prove nothing; PRF-OPS-09 runs with the shadow (SLICE-13).
* **Read budget.** `check` makes no broker call. Any broker read made in this step goes through the observation route and fits in what is left of the account's rate budget after legacy's own load, which step 9 measured.
* **Blocked until bound** (`check` refuses otherwise): `release.license`; the account settings; `recovery.lease_store` and the lease timings, which wait for the backup destination (POL-O01); every measured value step 9 produced.

## Step 11 — the real restore rehearsal (outline; needs the owner's word)

Production-sensitive: "the real restore rehearsal" is asked first under the standing rules, and it needs POL-O01 (the backup destination) answered. Deepened then from the migration spec's procedure: restore a real backup with the exact candidate artifact and schema on an isolated clean host; exercise crashes, unresolved effects, identity preservation, monotonic custody and refusal before fencing (D10, `README.md:1201`). The rehearsal reports its restore duration; it is judged against `recovery.rto_secs` only if the owner binds one (POL-047). Rehearsal evidence grants no activation.

## Completion conditions

* Every step's completion conditions hold, as written when it is deepened.
* PRF-CFG-01…08, PRF-CFG-10, PRF-CFG-11, PRF-OPS-01…07, PRF-PRT-14, PRF-PRT-06's frozen half and PRF-XC-02's production part pass; PRF-DOM-06 passes if step 5 was built.
* PRF-OPS-08's records exist and the owner has approved the values the release binds.
* Steps 10 and 11 are done on the owner's word, or recorded as waiting for it (with POL-O01 and the licence named). PRF-OPS-09 is carried to SLICE-13.
* Both specs and this file record each step "as built", with every Deviation and Fork call.
