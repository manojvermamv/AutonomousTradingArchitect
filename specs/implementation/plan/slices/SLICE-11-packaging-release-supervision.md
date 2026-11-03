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

## Step 1 — the settings contract and the resolver

<a id="step-1--the-settings-contract-and-the-resolver-outline"></a>The authorities are the configuration spec's [settings contract](../../design/configuration-artifacts-release.md#the-settings-contract-settingsschemapy), [participant contract](../../design/configuration-artifacts-release.md#the-participant-contract-settingsschemapy), [resolver](../../design/configuration-artifacts-release.md#the-resolver-settingsloaderpy), [packaging](../../design/configuration-artifacts-release.md#packaging-pyprojecttoml-requirementslock) and [policy inputs](../../design/configuration-artifacts-release.md#policy-inputs) sections, the runtime spec's [policy inputs](../../design/runtime-isolation-observability-deployment.md#policy-inputs), the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30), and legacy's loader, limits and live driver at 445eb116. Step 1 is TASK-S11-02's resolver part and TASK-S11-01's `requirements.lock` (PRF-CFG-02). It builds on OA_NEW `75420a6` or later (the branch head when the build starts; `75420a6` changed no file this step touches) and changes `settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml`, `interfaces/cli.py` (one call), and adds `requirements.lock`, `tests/unit/test_settings_resolver.py` (T-73) and the lock group of `tests/contracts/test_installed_artifact.py`. No entrypoint, unit, composition, alert route, event kind or migration changes; those are steps 2 and 7. **The resolver never opens a secret:** it reads the `secrets` section's references, never their values.

**In plain words.** Every program of the new system will read its settings the same way: the shipped defaults, then one settings file (which may build on a base file, as today), then the environment variables that program is meant to see. A program reads them once when it starts. Only three things stop a program at start, the same three that stop today's system: a settings file that is missing or unreadable, two settings files named that disagree, and a base file that does not exist. Everything else that is wrong (a name nobody declared, two names for one setting, a value of the wrong type, a pasted password, a broker key where it does not belong) is set aside, reported and alerted, and the program starts as the old system would have. A pasted password is dropped without being read, and a broker key in the wrong program is blanked. This step also writes down, for each program, the system user it will run as and which credentials it may hold. The account's entry limits get their settings here, read exactly as the old system read them. If one cannot be read, new entries stop while exits, the trail and settlement go on, as today. Step 7 puts today's live values in the example settings file, and step 2 merges them with the strategy's own limits as the old system does, so the live daily loss limit stays ₹3,600. Nothing here changes when or how the system trades.

### Decisions

#### What legacy does here

* **Four layers, later wins:** `config/defaults.yaml`, the profile and the chain it `extends:` (base first, `src/config/__init__.py:288-322`), the owner file (`:428-439`), then every environment name `env_path` maps (`:397-450`). Environment overrides apply in `os.environ` order (`:452-462`); `null` reads as "default" (`:466-472`); any key loads; a value is coerced by shape unless its key is in `_STRING_KEYS` (`:167-194`, `:232-261`). **Legacy refuses to start only** on an `extends:` cycle (`:301-304`), a missing `extends:` base (`:315-319`), conflicting profile selectors (`:366-383`, `:408-413`) and a missing profile file (`:416-419`); PyYAML absent or an unreadable file raises from `_load_yaml` (`:274-285`). The broker key is withheld from children by name (`:213-229`).
* **The account's entry limits** are the `limits.*` section, all "not set" when shipped (`config/defaults.yaml:888-902`), read by `Limits.from_env` (`src/core/framework/sizing/gates.py:64-106`): a missing, `null` or `""` value stays 0; counts are `int(float(raw))`; seconds, percentages and amounts `float(raw)`; a flag is true only for `1`, `true`, `yes`, `on`; `no_new_trade_after` must be `H:MM` or `HH:MM`; any value that does not parse raises for the whole set. **The live driver contains that:** "unreadable caps block entries; they never stop the process". At start the account limits become `None` and no entry is taken until they parse, while exits, settlement, supervision and the trail keep running (`scripts/run_framework_live.py:7594-7606`); on each pass a failed parse is a fault that blocks every entry and keeps the last caps that parsed (`:7798-7804`). The live unit sets nine of them through a drop-in of `MCP_LIMITS__*` names (`deploy/systemd/at-strategy-entry-limits.conf:2-11`), merged field by field with the strategy layer (`gates.py:109-149`).

#### The settings contract (`settings/schema.py`)

* **`Field(key, attr, kind, env, scope, aliases, secret, register)`**, frozen. `attr` is the `Settings` attribute (new; the spec's tuple plus the attribute that already names each value). `aliases` is a tuple of deprecated environment names, each replaced by `key`. `secret` is true only for the `secrets` section. `register` is the basis text (`"Q-003"`, `"measured"`, `"owner only"`, `"legacy"`, `None`).
* **Kinds and their normalized values.** Every kind check returns the normalized value, the one `Settings` holds and every digest uses: `int_pos` (an int ≥ 1; a `bool`, a float or text that is not ASCII digits is wrong, as `settings/loader.py:254-259`) → `int`; `int_nonneg` (≥ 0) → `int`; `enum(values)` → the `str`; `money` (`kernel/ledger/envelope.py`'s `is_money`) → the `str`; `decimal` (POL-019's canonical decimal, `contracts.market._LAG`; an int is first written as its decimal text, as built) → the `str`; `path(class)` (a non-empty `str`, absolute in a `production` profile) → the `str`; `text` (a non-empty `str`) → the `str`. Five carry built behaviour unchanged: `json_text` (`cognition.providers_budgets`, `_budgets_text`: never wrong) → its canonical text; `legacy_flag`, `legacy_paths`, `legacy_text_lower`, `legacy_body_cap` (the kill inputs and owner-API keys, SLICE-10 steps 4 and 6: every environment name whose `secrets.env_path` is the key is read, by `_kill_inputs` and `_console` unchanged, resolving towards stopping as built) → per name: `_engages(text)`'s `bool`, the stripped text, the stripped lower-cased text, the cap as an `int`. Account limits: `limit_int` → `int`, `limit_float` → `float`, `limit_bool` → `bool`, `limit_hm` → the stripped `str` (legacy's parse, below). Sections: `section` → the mapping; `accounts` → `{name: {broker, account_id, exchange}}`; `credential_refs` (the `secrets` section, checked by `settings.secrets.parse_references`) → the sorted identifiers (`service/name@version`).
* **Today's 42 fields move unchanged** (the outline said 27; SLICE-08 to SLICE-10 added 15; `75420a6` adds none). Their keys are the built `section.name` pairs, their environment names and `Settings` attributes are unchanged: the four leading fields (`ledger.path` `AT_LEDGER_PATH` `path(authoritative)`, `capacity.synthetic_amount` `AT_SYNTHETIC_CAPACITY` `money`, `binding.revocation_effect` `AT_BINDING_REVOCATION_EFFECT` `enum(stop_entries)`, `clock.jump_record_ms` `AT_CLOCK_JUMP_RECORD_MS` `int_pos`), the 23 of `_ADMISSION`, the two of `_MARKET`, `market.store_path` (`AT_MARKET_STORE_PATH`, `path(required_evidence)`), the three of `_SECURITY`, the four of `_COGNITION`, the two kill inputs and the three owner-API keys. Built kind → field kind: `int` → `int_pos`, `"non_negative"` → `int_nonneg`, a tuple → `enum`, `"lag"` → `decimal`, `"budgets"` → `json_text`.
* **`_ADMISSION`, `_MARKET`, `_SECURITY` and `_COGNITION` stay** as views derived from `FIELDS`, with the same 5-tuples in the same order, so `bootstrap.py:152` and `tests/unit/test_policy_parameters.py` are unchanged. `_defaults()` stays the one hook that reads `resources/defaults.yaml` (two test files monkeypatch it).
* **New fields.** No new field has an environment name except the path fields (the renderer passes paths; "no unit carries a limit"). Nothing below is a score or threshold set here: each ships `null` except where the cell says otherwise.

  | Key | Kind | Env | Scope | Ships | Basis |
  |---|---|---|---|---|---|
  | `release.license` | `text` | — | installer | `null` | owner only; production staging refuses unbound (step 2, `CFG-R08`), which is not a start of trading |
  | `release.root` | `path(reproducible)` | `AT_RELEASE_ROOT` | installer | `null` | deployment path |
  | `paths.evidence` | `path(required_evidence)` | `AT_EVIDENCE_PATH` | kernel, supervisor, backup | `null` | deployment path |
  | `paths.run` | `path(scratch)` | `AT_RUN_DIR` (legacy's name, LD-18) | every service | `null` | deployment path |
  | `paths.scratch` | `path(scratch)` | `AT_SCRATCH_DIR` | installer, backup | `null` | deployment path |
  | `accounts` | `accounts` | — | kernel, market, supervisor, observer, installer | `null` | Q-005; the owner binds |
  | `account.max_worst_case_loss` | `money` | — | kernel | `null` | Q-015, the register's row; admission already refuses an entry while it is unbound (`kernel/admission.py:157-158`), unchanged |
  | `account.limits.<field>`, the 13 `SessionLimits` fields (`contracts/decisions.py:466-480`) | `limit_*` | aliases `MCP_LIMITS__<FIELD>`, `AT__LIMITS__<FIELD>` | kernel | legacy's "not set": 0, `0.0`, `false`, `""` | **Fork call A** below |
  | `composition` | `enum(first_release)` | — | installer | `null` | Q-005 |
  | `recovery.routine_advance` | `enum(standing)` | — | `shared:recovery` | `null` | Q-009, bound by the profile |
  | `recovery.routine_advance_limit` | `int_pos` | — | `shared:recovery` | `null` | approved at TASK-S11-07 |
  | `recovery.lease_secs`, `recovery.lease_renew_secs` | `int_pos` | — | `shared:recovery` | `null` | measured |
  | `recovery.lease_store` | `text` | — | kernel, installer | `null` | owner only, follows POL-O01 |
  | `recovery.rto_secs` | `int_pos` | — | installer | `null` | owner only, POL-047 |
  | `security.journal` | `text` | — | kernel | `null` | owner only, follows POL-O01 (SLICE-10 step 9) |
  | `host.pass_interval_secs` | `int_pos` | — | kernel | `20` | **Fork call B** below (the slice's Fork call 2) |
  | `supervisor.poll_secs`, `supervisor.read_budget_ms`, `supervisor.stall_secs` | `int_pos` | — | supervisor | `null` | measured |
  | `supervisor.max_requests_per_minute` | `int_pos` | — | `shared:observation` | `null` | measured |
  | `storage.critical_reserve_bytes` | `int_pos` | — | supervisor, installer | `null` | measured |
  | `envelope.backup_reserve.memory`, `.tasks`, `.disk` (bytes, count, bytes) | `int_pos` | — | installer, supervisor | `null` | measured |
  | `envelope.optional.cpu_quota` (percent), `.memory_high`, `.memory_max` (bytes), `.tasks_max`, `.io_weight` (1 to 10000, systemd's range; outside it is a wrong value) | `int_pos` | — | installer | `null` | measured |
  | `envelope.supervisor.memory_high`, `.memory_max`, `envelope.observer.memory_high`, `.memory_max` (bytes) | `int_pos` | — | installer | `null` | measured |
  | `install.min_memory_mb` | `int_pos` | — | installer | `null` | measured |
  | `telemetry.max_items`, `telemetry.max_bytes` | `int_pos` | — | kernel, market, supervisor | `null` (telemetry off) | measured |
  | `strategies.host.pass_secs`, `.seal_wait_ms`, `.review_retry_ms` | `int_pos` | — | strategy | `null` | SLICE-09 step 2 (`bootstrap.HostSettings`); the last two measured, `pass_secs` from step 3 |
  | `secrets` | `credential_refs` | — | every participant (each resolves only its scope) | absent | SLICE-10 step 3 |
  | `channel` | `section` | — | kernel | absent | SLICE-10 step 5's `parse_peers` reads it at composition |
  | `operator` | `section` | — | operator, at | absent | SLICE-10 step 6's `parse_operator` reads it at composition |

  The spec's `paths.ledger` and `paths.market_store` are the built `ledger.path` and `market.store_path`, names unchanged.
* **Scopes of the moved fields.** The 23 admission fields except `market.poll_interval_secs` (`shared:market`), `market.view_age_stamp` and `market.max_view_age_secs` (kernel, strategy), and `observation.poll_interval_secs` and `observation.max_requests_per_minute` (`shared:observation`): kernel. The four leading fields: kernel. `market.bar_confirm_lag_secs`: `shared:market`. `market.store_path`: kernel, market, strategy, supervisor. `market.http_timeout_ms`: market. The three `interfaces.*`: kernel, operator. The three `cognition.*`: kernel, cognition. `operations.advisor_pause_warn_minutes`: cognition. `risk_guard.*`: kernel, operator, at, mcp. `console.*`: operator. `shared:market` is kernel, market and supervisor; `shared:observation` is kernel, supervisor and observer; `shared:recovery` is kernel and installer.
* **`Settings`** stays a frozen dataclass; every new attribute is appended after the built ones with default `None`, so positional constructions (`tests/conftest.py:361`, `operations/verification.py:44`) still work. The exceptions: `account: Account | None` (`Account(name, broker, account_id, exchange)`, frozen, in `settings/schema.py`) and `account_limits: SessionLimits | None = NO_ACCOUNT_LIMITS` (`NO_ACCOUNT_LIMITS` is every field 0, `0.0`, `False` or `""`; `None` means unreadable, Fork call A). Attribute names are the key with dots as underscores (`supervisor_poll_secs`, `envelope_optional_cpu_quota`, `strategies_host_seal_wait_ms`).
* **`accounts`:** a mapping of exactly one name (Q-005) to exactly `{broker, account_id, exchange}`, each a non-empty `str`. Anything else is a wrong value: set aside, so `account` stays `None` and step 2's production composition reports the owner item unbound.
* **Projections** (`SHARED_PROJECTIONS`, so the name does not collide with `interfaces/mcp.py`'s disclosure `PROJECTIONS`): `market` = `market.poll_interval_secs`, `market.bar_confirm_lag_secs`; `observation` = `observation.poll_interval_secs`, `observation.max_requests_per_minute`, `supervisor.max_requests_per_minute`; `recovery` = `recovery.routine_advance`, `recovery.routine_advance_limit`, `recovery.lease_secs`, `recovery.lease_renew_secs`. `projection_digest(name) = digest({key: normalized value})` over the projection's keys, `None` for unbound (`kernel/ledger/envelope.py`'s `digest`). **Deviation:** the spec's `market.calendar` and `market.views.*` are not settings today (the market loop's calendar is `"nse-fo/v1"` in `market/ingest.py`; views are a composition argument); each joins the projection when it becomes a field.
* **The shared budget.** `budget_check(poll, max, supervisor=None)` keeps its built refusal for the kernel's pair (`4 × ceil(60 / poll) > max`), which `bootstrap.py:155` runs at the kernel's composition, unchanged. The supervisor's share (`4 × ceil(60 / poll) + supervisor > max`) is refused only by the supervisor's own composition (step 4), which passes `supervisor`. The resolver refuses neither: with a participant, either failure is a problem (below).

#### The participant contract (`settings/schema.py`)

* **`Participant(name, entrypoint, unit, user, groups, credential_scopes, launcher_env, fields_required, storage, profile_problems_only)`**, frozen; `PARTICIPANTS` is a mapping by name. `credential_scopes` names keys of `settings.secrets.SCOPES` (SLICE-10's table stays the one source; `credentials_allowed` is their union). `credentials_forbidden` is derived: every participant except kernel, market and observer forbids the broker key's names, which are exactly `OPENALGO_API_KEY`, `AT__OPENALGO__AUTH__API_KEY` and `MCP_OPENALGO__AUTH__API_KEY` (every name whose `secrets.env_path` is `BROKER_KEY_PATH`; legacy's list, `src/config/__init__.py:213-229`).

  | Participant | User | Groups | Entrypoint | Unit | Credential scopes | Launcher names | Writes | `fields_required` (today's compositions; step 2 adds production's) |
  |---|---|---|---|---|---|---|---|---|
  | kernel | `at-kernel` | `at-market-readers` | `at-kernel` | `at-kernel.service` | `kernel` | `AT_PROFILE`, `AT_RELEASE`, `AT_DEPLOYMENT_ROOT` | authoritative, required evidence, scratch | `Settings.ADMISSION_REQUIRED`, `binding.revocation_effect`, the three `interfaces.*` |
  | market | `at-market` | — | `at-market` | `at-market.service` | `market` (**Fork call 8**) | `AT_PROFILE`, `AT_RELEASE` | required evidence, scratch | `market.bar_confirm_lag_secs`, `market.poll_interval_secs`, `market.store_path` |
  | supervisor | `at-supervisor` | `at-ledger-readers`, `at-market-readers` | `at-supervisor` | `at-supervisor.service` | none | `AT_PROFILE`, `AT_RELEASE` | required evidence, scratch | the four `supervisor.*` |
  | observer | `at-observer` | — | `at-observer` | `at-observer.service` | none until step 5 adds its row | `AT_PROFILE`, `AT_RELEASE` | scratch | — |
  | strategy | `at-strategy` | `at-channel`, `at-market-readers` | `at-strategy` | `at-strategy.service` (T-59) | none (SLICE-09: no `SCOPES` key starts with `strategy`) | `AT_PROFILE`, `AT_RELEASE` | required evidence | `market.view_age_stamp`, `market.max_view_age_secs`, the three `strategies.host.*` |
  | cognition | `at-cognition` | `at-channel` | `at-cognition` | `at-cognition.service` | `cognition` | `AT_PROFILE`, `AT_RELEASE` | required evidence | the three `cognition.*` |
  | operator | `at-operator` | `at-channel`, `at-ledger-readers` | `at-operator` | `at-operator.service` | `operator` | `AT_PROFILE`, `AT_RELEASE`, `AT_OPERATOR_CONFIG`, `AT_DEPLOYMENT_ROOT` | scratch | the three `interfaces.*` |
  | at (the CLI) | the invoking login user | `at-operators` | `at` | — | none | `AT_PROFILE`, `AT_DEPLOYMENT_ROOT`, `AT_OPERATOR_SOCKET`, `AT_OPERATOR_UID`, `AT_OPERATOR_GID` | — | — |
  | mcp | `at-mcp` | `at-ledger-readers` | `python -m autonomous_trading mcp serve` | `at-mcp.service` (a new name: legacy's is `mcp-gateway.service`) | `mcp`, `mcp_token` | `AT_PROFILE`, `AT_RELEASE`, `AT_DEPLOYMENT_ROOT`, `MCP_CONFIG_FILE`; every other `MCP_` name is `interfaces/mcp.py`'s own legacy vocabulary (`MCP_ALIASES`, `:158-213`), so the check passes `MCP_` names here | scratch | — |
  | console | `at-console` | — | none (the Node server) | `at-console.service` | `console` | not checked: no Python start | — | — |
  | backup | `at-backup` | `at-ledger-readers`, `at-market-readers` | step 8 names it | `at-backup.service` | none until step 8 | `AT_PROFILE`, `AT_RELEASE` | scratch | — |
  | installer | the application user | — | `deploy/install.py` | — | none | `AT_PROFILE`, `AT_RELEASE` | reproducible, required evidence | — |

  Every participant also accepts `AT_CONFIG_FILE`, legacy's profile selector (below). The groups: `at-channel` (the kernel's channel socket, SLICE-10 step 5), `at-operators` (the CLI socket and the kill-file directory, SLICE-10 steps 4 and 6), `at-ledger-readers` and `at-market-readers` (read-only access to those stores). Only `at` has `profile_problems_only` (below). Every unit user is distinct.
* **The environment check** is part of resolving with a participant; step 2's `bootstrap.check_environment` calls it. It never refuses (R-2). With `participant=p`:
  * a forbidden name with a non-empty value is a `CFG-R07` problem and joins `Effective.masked`; step 2 sets each masked name to `""` in the process environment before anything is composed, so the key never reaches a composition. The check reads only whether the value is empty; it never copies, hashes or prints it. An empty value is the mask `child_environment` writes into every child (`settings/secrets.py:410`), and is no problem;
  * an `AT_` or `MCP_` name that is not a launcher name of `p`, not the `env` or an alias of a field in `p`'s scope, not the `env` locator of a reference in `p`'s credential scopes, and not read by a `legacy_*` field in scope, is a `CFG-R01` problem and is ignored; a known name of a field outside `p`'s scope likewise, its text naming the field and its participants (so legacy's drop-in names in the strategy host are reported and ignored);
  * other names (`PATH`, `CREDENTIALS_DIRECTORY`, `INVOCATION_ID`) are not checked.

  With `participant=None` (tests and today's callers), every field's names, every alias and every launcher name are known, and every field is in scope.

#### The resolver (`settings/loader.py`)

* **Signatures.** `effective(profile: str, env: Mapping[str, str], *, participant: str | None = None) -> Effective` is the spec's resolver. `resolve(profile, env, *, participant=None) -> Settings` stays and returns `effective(…).settings`. **Deviation (from the spec's signature):** the spec names `resolve` as returning `Effective`; five test files and three callers read `resolve(…)` as `Settings`, so the name keeps its return type and the spec's result is `effective`.
* **What still refuses (R-2), exactly legacy's start refusals,** each `ConfigRefused(SettingsError)` with `code` `CFG-R03`, `label` `bad_value`, `key` and `layer`, text `f"{code} {label}: {key} [{layer}]: {detail}"`, never a value:
  * the profile: `"test"` is the built-in `{"profile": "test"}`; anything else is an absolute path, and a relative text (detail `unknown profile`), a missing file, an unreadable file, YAML that does not parse, or a document that is not a mapping refuses (key `AT_PROFILE`);
  * conflicting selectors: `AT_CONFIG_FILE` in the environment naming a file other than `profile` (compared after `os.path.realpath`) refuses (key `AT_CONFIG_FILE`), as legacy's `profile_conflict`. Alone, or naming the same file, it is accepted. `MCP_CONFIG_FILE` is not a selector here: it names the MCP process's own file (SLICE-10 step 8);
  * `extends:`: a profile's `extends` names a base resolved against the profile's own directory (or absolute), merged base-first by legacy's `_deep_merge` with the leaf winning (`src/config/__init__.py:264-271`, `:288-322`). A missing base or a cycle refuses (key `extends`). `extends` is a loader directive, never a field or a problem;
  * **kept as built for `participant=None` only:** a wrong value of one of the 42 built fields, and the kernel's budget pair, raise as `settings/loader.py` raises at `9067a24`, which five test files assert. Only tests and, until step 2 passes their participants, the two `serve` functions of `interfaces/api.py` and `interfaces/mcp.py` call it so; that is today's behaviour, not a new refusal.
  `SecretUnresolvable` (`SEC-R18`) from `parse_references` is a malformed `secrets` section: with a participant it is a problem and the section is set aside; with `None` it propagates, as built.
* **Problems.** Everything else is a `Problem(code, label, key, layer)`, frozen, whose `text` holds no value, in `Effective.problems` in the order found (defaults walk, profile walk, environment names in code-point order). Step 2 logs each and raises one operator alert `settings_problem` per problem per start through SLICE-10's alert route (carried). Codes: `CFG-R01` `unknown_key`, `CFG-R02` `alias_conflict`, `CFG-R03` `bad_value`, `CFG-R04` `secret_in_settings`, `CFG-R07` `forbidden_credential`.
* **Walking a layer** (defaults, then the merged profile). At each dotted path, in this order (R-4): a `FIELDS` key is a leaf, its value taken whole (so the `secrets` section, whose last part legacy's redaction names, is kept); else a path whose last part `settings.secrets._is_secret` names (legacy's redaction key set) is dropped without its value being read, copied or digested, with a `CFG-R04` problem naming the path; else a mapping recurses; else the path is ignored with a `CFG-R01` problem. A leaf whose value is not JSON data (a YAML date, a non-finite float) is a wrong value. The profile's `profile` key reads `test`, `simulation`, `production` or `research`; missing or another value is a `CFG-R03` problem and the profile is treated as `production` (its rules are the strictest).
* **Layers and rules,** in order: defaults, profile, environment (scoped as above):
  * omitted: the layer below stands;
  * `null` in the profile: unbound from that layer up (for `account.limits.*`, unbound is legacy's "not set");
  * a wrong value: a `CFG-R03` problem, and the layer below stands for that key;
  * an alias or its key's `env` in the environment, against the key in the profile: **the environment wins**, as legacy's layer order; a `CFG-R02` problem when the normalized values differ;
  * two environment names of one `account.limits.*` field (its two aliases): **the stricter wins** by legacy's merge rule (`gates.py:115-149`): of counts, amounts and percentages the lower value that is set (0 is not set); of `entry_cooldown_secs` the larger; of a flag `True`; of `no_new_trade_after` the earliest by clock time; of `drawdown_rate_window_mins` the larger set value (a longer window counts more loss against the same cap; legacy's merge has no rule for two values of the window, so this is this step's choice). A `CFG-R02` problem when they differ. No other field has two environment names except the `legacy_*` kinds, which keep their built rules;
  * an alias alone: its value binds the key, provenance `alias:<NAME>`;
  * a `production` profile binding `capacity.synthetic_amount` in any layer: the value is set aside with a `CFG-R03` problem;
  * a refusing field unbound: accepted; the composition that reads it refuses (`RefusingParameterUnbound`, as built).
* **Account limits, legacy's parse and containment (Fork call A).** Only the winning value of each field is parsed. `limit_int` (`max_trades_per_session`, `max_entries_per_desk`, `max_open_structures`, `max_consecutive_losses`, `drawdown_rate_window_mins`): `int(float(raw))`. `limit_float` (`entry_cooldown_secs`, `max_daily_loss_pct`, `max_daily_loss_amount`, `max_daily_profit_amount`, `drawdown_rate_max_loss`): `float(raw)`. `limit_bool` (`require_fresh_setup`, `drawdown_rate_enabled`): a `bool` as is, else `str(raw).lower() in ("1", "true", "yes", "on")`. `limit_hm` (`no_new_trade_after`): `""`, or a value legacy's `_hm` reads (`H:MM` or `HH:MM`, hour below 24, minute below 60), kept stripped. `null`, absent and `""` stay legacy's zero. **If any field fails legacy's parse, `account_limits` is `None`** (legacy's whole-set failure), with a `CFG-R03` problem naming that field, for every participant including `None`. Step 2's admission refuses new entries while it is `None`; exits, the trail, protection and settlement do not read it (legacy, `scripts/run_framework_live.py:7594-7606`, `:7798-7804`).
* **The result.** `Effective(settings, revision, provenance, projections, defaults_digest, profile_digest, profile_kind, participant, secret_refs, sections, masked, problems)`, frozen:
  * `provenance`: `(key, layer)` pairs for bound keys, sorted by key; layer `defaults`, `profile`, `env:<NAME>` (for a `legacy_*` field, the contributing names in sorted order joined by `,`), or `alias:<NAME>` (for two aliases, both, joined by `,`);
  * `projections`: `(name, digest)` in name order; `projection(name) -> str`;
  * `defaults_digest = digest(_defaults())` with dropped paths removed; `profile_digest = digest(merged profile mapping)` with `extends` removed, dropped paths removed and the `secrets` section replaced by its sorted identifiers, so a reference enters only by name and a dropped value never enters;
  * `revision = digest({"defaults": defaults_digest, "profile": profile_digest, "env": {NAME: normalized value}})` over every in-scope environment name read for a field, winning or not, each with its own normalized value. Ignored, masked and credential names never enter;
  * `secret_refs`: the identifiers; `sections`: `(name, canonical text)` for `channel` and `operator`, and `section(name)` returns a fresh `json.loads` copy;
  * `masked`: the forbidden names to blank, sorted;
  * `snapshot() -> dict`: `{"format": "at-settings/1", "profile", "participant", "revision", "values": {bound key: normalized value}, "provenance", "secrets": identifiers, "sections": {name: value}, "problems": [text]}`, for step 2 to publish.
* **`at` has `profile_problems_only`.** For `at` alone, even the profile refusals above become problems: an unusable profile is skipped (defaults and environment stand). `interfaces/cli.py:835-836` becomes `effective(environ.get("AT_PROFILE", "test"), environ, participant="at")`, prints `settings: <problem>` through `say` for each problem, then reads `.settings`. **Reason:** `at kill-switch` stops trading; nothing in a profile may keep it from engaging. Refusing nothing here is the direction R-2 asks for.
* **Immutability (REQ-CFG-004).** `Effective` and `Settings` are frozen; `effective` reads files once per call and holds no cache; nothing watches a file.

#### `resources/defaults.yaml`

The built file keeps every line. Appended, in this order (comments as shown):

```yaml
interfaces:                          # SLICE-10 step 2's three fields, named here for the first time
  request_ttl_secs: null             # refusing; legacy 120, bound by the profile
  session_ttl_secs: null             # refusing; bound per release
  sessions_per_identity: null        # refusing; bound per release
cognition:                           # SLICE-09 steps 4 and 5's three fields, named here for the first time
  committee_risk_critic: null        # refusing; only deferred accepted (POL-035 open)
  providers_fallback: null           # refusing; only inactive accepted (POL-036 open)
  providers_budgets: null            # refusing; "{}" when unlimited
paths:
  evidence: null                     # deployment path (step 7 renders it)
  run: null                          # deployment path; AT_RUN_DIR, legacy's name (LD-18)
  scratch: null                      # deployment path
release:
  license: null                      # owner only; production staging refuses unbound
  root: null                         # deployment path
composition: null                    # Q-005 binds first_release in the profile
accounts: null                       # Q-005: exactly one account; the owner binds it
account:
  max_worst_case_loss: null          # Q-015: per account, set at deployment
  limits:                            # legacy's "not set" (config/defaults.yaml:888-902 @445eb116)
    max_trades_per_session: 0        # the live values go in the profile (Fork call A; step 7's example)
    max_entries_per_desk: 0
    max_open_structures: 0
    require_fresh_setup: false
    max_consecutive_losses: 0
    entry_cooldown_secs: 0
    max_daily_loss_pct: 0
    max_daily_loss_amount: 0
    max_daily_profit_amount: 0
    drawdown_rate_enabled: false
    drawdown_rate_max_loss: 0
    drawdown_rate_window_mins: 0
    no_new_trade_after: ""
recovery:
  routine_advance: null              # Q-009 binds standing in the profile
  routine_advance_limit: null        # approved with the release binding (TASK-S11-07)
  lease_secs: null                   # measured (TASK-S11-07)
  lease_renew_secs: null             # measured (TASK-S11-07)
  lease_store: null                  # owner only; follows the backup destination (POL-O01)
  rto_secs: null                     # owner only (POL-047)
security:
  journal: null                      # owner only; follows the backup destination (SLICE-10 step 9)
host:
  pass_interval_secs: 20             # legacy's live 20 s, phase-locked (Fork call 2)
supervisor:
  poll_secs: null                    # measured
  max_requests_per_minute: null      # measured; shares the account's read budget
  read_budget_ms: null               # measured
  stall_secs: null                   # measured
storage:
  critical_reserve_bytes: null       # measured
envelope:
  backup_reserve: {memory: null, tasks: null, disk: null}                     # measured
  optional: {cpu_quota: null, memory_high: null, memory_max: null, tasks_max: null, io_weight: null}   # measured
  supervisor: {memory_high: null, memory_max: null}                           # measured
  observer: {memory_high: null, memory_max: null}                             # measured
install:
  min_memory_mb: null                # measured
telemetry:
  max_items: null                    # measured; unbound turns telemetry off
  max_bytes: null                    # measured
strategies:
  host: {pass_secs: null, seal_wait_ms: null, review_retry_ms: null}          # SLICE-09; measured or step 3
```

Every top-level section in this block is new at `75420a6` (the built file has no `interfaces` or `cognition` section: those six fields resolved from absence until now, and still resolve to `None`).

#### `requirements.lock`

* **Generated by** pip-tools' `pip-compile --generate-hashes --allow-unsafe --strip-extras --extra operator --extra mcp --output-file requirements.lock pyproject.toml`, run with Python 3.11 in a throwaway virtual environment. The `test` extra is not runtime and is left out. pip-tools records every published file's hash of each pinned version, so the lock serves any platform; the EC2's architecture is **not checked** (step 10 records it).
* **Header,** the first three lines exactly: `# requirements.lock: generated by pip-compile; do not edit.`, `# Generator: pip-tools <version>, Python <major.minor.patch>, <sys.platform>` (the values of the generating run), `# Command: <the command above>`. pip-compile's own header follows.

#### Fork calls in this step

* **A. The account's entry limits keep legacy's fields, parse, zero meaning, containment and live mechanism.** The 13 fields; legacy's parse (`int(float(raw))` included, so `"5.7"` reads 5, and a flag outside the four true words reads false); "not set" when unbound; an unparseable value blocks new entries only (`account_limits` `None`), never the process; the live drop-in's names accepted as aliases, the environment winning over the profile and the stricter of two aliases winning. The live values (5, 10, 1, fresh setup, 300 s, ₹4,000, the drawdown gate at 3,000 over 15 minutes) go into step 7's `config/live.example.yaml` (R-5), and the installer carries the host's drop-in values into the kernel's profile (step 7, R-6). Step 2 merges them with the strategy layer by legacy's `effective_limits` and tests that the account layer equals legacy's `SessionLimits(5, 10, 1, True, 0, 300.0, 0.0, 4000.0, 0.0, True, 3000.0, 15, "")` and that the effective daily loss limit is the lower of 4000 and ₹3,600 = **₹3,600**. **Deviation (from the configuration spec's "refusing until then"):** unbound is legacy's "not set", not a refusal. *Listed, not made:* reading a flag word outside legacy's eight as a problem.
* **B. `host.pass_interval_secs` ships 20,** the slice's Fork call 2, legacy's live value; step 3 reads it.
* **C. The market process may hold the account's key** (Fork call 8): its participant row carries the `market` scope.

#### Deviations in this step

* **The spec's refusals `CFG-R01`, `CFG-R02`, `CFG-R04` and `CFG-R07` are problems and alerts, not refusals,** and an unknown key is ignored (R-2): legacy accepted any key and resolved names by layer and order, and a refusal there would stop a start legacy made. The only start refusals are legacy's own (above). The spec's A02-F2 "conflicting alias and replacement is an error" is met as a recorded problem and an alert, with a fixed winner instead of an order-dependent one.
* **`extends:` is kept,** legacy's; the slice's settings Deviation ("no `owner.yaml` layer", "an unknown key refuses") is narrowed here: no `owner.yaml`, and an unknown key is ignored with a problem.
* **Two layers of legacy names keep SLICE-10's rules,** not `CFG-R02`: the kill inputs (any engaging name engages; every file watched) and the owner-API keys (first name in code-point order).
* **`at` never refuses on settings** (above).
* **Launcher names are per participant,** beyond the spec's `AT_PROFILE`, `AT_RELEASE` and `AT_TEST_ROOT`: the names today's entrypoints already read, and legacy's `AT_CONFIG_FILE`.
* **`resolve` keeps its return type;** `effective` returns `Effective` (above).

#### Carried to later steps

* **Step 2:** `bootstrap.check_environment`, `--check` and `compose_production` per participant: blanking every `Effective.masked` name before composing; logging each problem and raising one `settings_problem` operator alert per problem per start; `resolve(parse_references(…), SCOPES[…], live=True, environ=…)` for the kernel, market and cognition processes, the adapters' `api_key` and `secrets`, `credentials=` to the kernel, `log_filter()` on every handler with `sys.excepthook` and `threading.excepthook` through it; `interfaces/api.py` and `interfaces/mcp.py` passing their participant; `ChannelCore` from `parse_peers(effective.section("channel"))` with `Authority.relays`, and the projection digests in the channel and market-store handshakes; the account-limits merge (`effective_limits`, `kernel/admission.py`), with admission refusing new entries only while `account_limits` is `None` and an alert raised, and the R-5 test (the account layer equal to legacy's `SessionLimits(5, 10, 1, True, 0, 300.0, 0.0, 4000.0, 0.0, True, 3000.0, 15, "")`, the effective daily loss ₹3,600); production `fields_required` (`ledger.path`, `market.store_path`, `accounts`, `recovery.lease_store`); the MCP `market` and `configuration` owner ports, `ticks.watch`; the operator UI's shipping manifest in the bundle; `.github/workflows/verify.yml` and `.pre-commit-config.yaml`; the snapshot's publication and receipt.
* **Step 3:** `strategies.host.pass_secs`'s characterization; `run_pass` on every wake; the host's use of `host.pass_interval_secs`.
* **Step 4:** the supervisor's composition refusing its read share (`budget_check` with `supervisor`); the `kill_file_unwatched` alert and push delivery of alerts.
* **Step 5:** the observation route (TASK-S07-06, TASK-S11-06) and the observer's `SCOPES` row.
* **Step 6:** SLICE-09's pause warning through telemetry; the strategy host's egress, mount and ledger-file denial (D09's OS part).
* **Step 7:** rendering every unit, user, group and polkit rule from `PARTICIPANTS`, the key file `0600` owned by its unit's user, the fixed deployment root and the kill-file and socket directories; `config/live.example.yaml` completed with a `profile` key, the `interfaces.*` session values, every Q-answer binding and **the drop-in's nine account limits** (R-5; this supersedes the configuration spec's "no example carries a money value" for these nine, which are legacy's live values, not new ones); the MCP profiles' `process` sections, `{"mcp:*": ["*"]}`, only the read-only profile enabled; the console's `OWNER_API_URL`, `MCP_GATEWAY_URL`, uid, build and headers; `operator.playbooks`; the remaining `at` commands (install, update, restart, deploy, config, approver); configuration staging; stopping OpenAlgo's access log from recording query strings (`docs/operations.md`). **Legacy's drop-in (R-6):** legacy's `at-strategy.service.d/` drop-in survives on the host under the name T-59 reuses. The installer reads its `MCP_LIMITS__*` values, carries them into the kernel's profile as `account.limits.*`, refuses the installation (not trading) when the profile already binds a different value, and then removes the drop-in. Until it is removed, the strategy host ignores those names and alerts (`CFG-R01` problems).
* **Step 8:** the backup participant's credential scope; the off-host security-journal adapter (`security.journal`), `RestoreMarker.journal_trusted` in the restore tooling, the backup command.
* **Step 9:** measuring `strategies.host.seal_wait_ms` and `review_retry_ms` with every other measured field.
* **Step 10:** recording the account limits in force for the owner to compare with the profile.

### Tests

Every value is labelled synthetic. `SYNTH = "SYNTHETIC-SECRET-" + uuid.uuid4().hex`, never a literal. Profiles are YAML files written under `tmp_path` (absolute paths); `prod(**sections)` writes `{"profile": "production", **sections}` with `yaml.safe_dump` and returns the path. `codes(e)` is `[(p.code, p.key, p.layer) for p in e.problems]`. Unless a case says otherwise the participant is `kernel` and nothing raises. Digests below were computed with Python at deepening (re-run for this revision, unchanged) with `hashlib.sha256` over `json.dumps(…, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`, which is `kernel/ledger/envelope.py`'s `canonical`, over the normalized values defined above.

**`tests/unit/test_settings_resolver.py` (T-73), PRF-CFG-02:**

| Group | Cases |
|---|---|
| Kept | `resolve("test", {})`: `advisor_pause_warn_minutes == 15`, `kill_switch is False`, `kill_switch_files == ()`, `owner_api_max_body_bytes == 1048576`, `deadline_ms_entry is None`, `host_pass_interval_secs == 20`, `account_limits == NO_ACCOUNT_LIMITS`, `account is None`. `_ADMISSION`'s first four elements equal the 23 built rows in order (copied into the test from `75420a6`); `_MARKET`, `_SECURITY`, `_COGNITION` likewise. With `participant=None`: `{"AT_MAX_VIEW_AGE_SECS": "90.0"}`, `{"AT_BAR_CONFIRM_LAG_SECS": "7.0"}`, `{"AT_VIEW_AGE_STAMP": "bar_middle"}` and `{"AT_OBSERVATION_POLL_INTERVAL_SECS": "5", "AT_OBSERVATION_MAX_REQUESTS_PER_MINUTE": "47"}` raise `SettingsError`, as built |
| Fields | The 42 built `(key, attr, env)` triples are in `FIELDS` exactly (golden list copied from `75420a6`); every `env` and alias is unique across `FIELDS`; no launcher name is a field's `env`; every field but `secrets`, `channel` and `operator` is named exactly once in `resources/defaults.yaml`; every field whose `register` is `measured` or `owner only` ships `null`; the only non-null shipped values are `risk_guard.*`, `console.*`, `operations.advisor_pause_warn_minutes` 15, `host.pass_interval_secs` 20 and the 13 limits at legacy's zero; the scopes of the 23 admission fields are kernel except the five named above |
| Precedence | Profile `market: {poll_interval_secs: 60}`, env `{"AT_POLL_INTERVAL_SECS": "61"}` → 61, provenance `env:AT_POLL_INTERVAL_SECS`, no problem; without the env → 60, `profile`; neither → `None`, key absent from `provenance` |
| `null` unbinds | `_defaults` monkeypatched to the real mapping with `market.max_view_age_secs: 90`: no profile key → 90, `defaults`; profile `market: {max_view_age_secs: null}` → `None` |
| Profiles refuse | Each raises `ConfigRefused` with `code == "CFG-R03"`: `effective("config/live.yaml", {})` (key `AT_PROFILE`, detail contains `unknown profile`); an absolute path that does not exist; a file holding `": : :"` (YAML that does not parse); a file holding `- a` (not a mapping); env `{"AT_CONFIG_FILE": <another existing profile>}` (key `AT_CONFIG_FILE`); a leaf with `extends: missing.yaml` (key `extends`); `a.yaml` extending `b.yaml` extending `a.yaml` (key `extends`). Passes: env `{"AT_CONFIG_FILE": <the same path>}`; `base.yaml` = `{market: {max_view_age_secs: 90, poll_interval_secs: 61}}` and leaf `{profile: production, extends: base.yaml, market: {poll_interval_secs: 60}}` → `max_view_age_secs == 90`, `poll_interval_secs == 60`, `profile_kind == "production"`, no problem |
| Unknown names (`CFG-R01`) | Profile `market: {poll_interval: 60}` → `codes == [("CFG-R01", "market.poll_interval", "profile")]`, `poll_interval_secs is None`; `_defaults` plus `extra: {x: 1}` → `("CFG-R01", "extra.x", "defaults")`. Env `{"AT_POLL_INTERVAL": "60"}` → `("CFG-R01", "AT_POLL_INTERVAL", "env")`; `{"MCP_FOO__BAR": "1"}` → one `CFG-R01`; `participant=None` with `{"AT_POLL_INTERVAL": "60"}` → one `CFG-R01`; `{"PATH": "/usr/bin", "AT_PROFILE": <path>, "AT_RELEASE": "r1", "AT_DEPLOYMENT_ROOT": "/srv/at"}` → no problem. Strategy with `{"AT_MAX_PENDING": "3"}` → one `CFG-R01` whose text names `coordinator.max_pending_per_account` and `kernel`, `max_pending_per_account is None`; strategy with the drop-in's nine `MCP_LIMITS__*` names (values as in Fork call A) → nine `CFG-R01`, `account_limits == NO_ACCOUNT_LIMITS`, none of the names in `revision`'s input; mcp with `{"MCP_PORT": "8000"}` → no problem, with `{"AT_POLL_INTERVAL": "60"}` → one `CFG-R01`. A profile without `profile` → `("CFG-R03", "profile", "profile")`, `profile_kind == "production"` |
| `CFG-R02` | `prod(account={"limits": {"max_trades_per_session": 5}})` with env `{"MCP_LIMITS__MAX_TRADES_PER_SESSION": "4"}` → 4 (the environment wins), one `CFG-R02`; with `"5"` → 5, no problem. Env `{"MCP_LIMITS__MAX_TRADES_PER_SESSION": "5", "AT__LIMITS__MAX_TRADES_PER_SESSION": "4"}` → 4; `"0"` and `"4"` → 4; `ENTRY_COOLDOWN_SECS` `"300"` and `"600"` → 600.0; `REQUIRE_FRESH_SETUP` `"false"` and `"true"` → `True`; `NO_NEW_TRADE_AFTER` `"15:00"` and `"9:30"` → `"9:30"`; `DRAWDOWN_RATE_WINDOW_MINS` `"15"` and `"30"` → 30; each pair one `CFG-R02`, provenance `alias:AT__LIMITS__<F>,MCP_LIMITS__<F>`. Env `{"MCP_LIMITS__MAX_DAILY_LOSS_AMOUNT": "4000"}` alone → `max_daily_loss_amount == 4000.0`, provenance `alias:MCP_LIMITS__MAX_DAILY_LOSS_AMOUNT`, no problem |
| Wrong values (`CFG-R03`) | Each is one `CFG-R03` problem and the layer below stands: profile `market: {max_view_age_secs: 90}` with env `{"AT_MAX_VIEW_AGE_SECS": "90.0"}` → 90 (`profile`); profile `market: {max_view_age_secs: true}` → `None`; `market: {view_age_stamp: bar_middle}` → `None`; env `{"AT_BAR_CONFIRM_LAG_SECS": "7.0"}` → `None`; the raw text `profile: production\nledger:\n  path: 2026-11-02\n` (a YAML date) → `ledger_path is None`; `prod(capacity={"synthetic_amount": "1000.00"})` and production with env `{"AT_SYNTHETIC_CAPACITY": "1000.00"}` → `capacity_synthetic_amount is None`; `envelope: {optional: {io_weight: 10001}}` → `None`; `accounts` with two names, with `exchange` missing, with an extra key → `account is None`. A file `{"profile": "test", "capacity": {"synthetic_amount": "1000.00"}}` → `"1000.00"`, no problem |
| Secret-looking names (`CFG-R04`, R-4) | `prod(openalgo={"auth": {"api_key": SYNTH}})` → `codes == [("CFG-R04", "openalgo.auth.api_key", "profile")]`, `profile_digest == "9ef0d3e139b7e12c905aa80900cf10f7ad18a034eaa681cfd686407dab10b2b0"` (of `{"profile":"production"}`); `prod(telegram={"bot_token": SYNTH})` → `("CFG-R04", "telegram.bot_token", "profile")`; `SYNTH` absent from every problem text, `revision`, `canonical(snapshot())`. `prod(secrets={"openalgo": {"api_key": {"source": "env", "locator": "SYN_KEY_ENV", "version": None}}})` → no problem: the `secrets` key is a field and is kept (its last part is secret-looking, so the field check must come first) |
| Masking (`CFG-R07`) | Strategy with `{"OPENALGO_API_KEY": SYNTH}` → one `CFG-R07`, `masked == ("OPENALGO_API_KEY",)`, `SYNTH` absent from problem texts, `revision` and `canonical(snapshot())`; with `{"MCP_OPENALGO__AUTH__API_KEY": SYNTH}` → `masked == ("MCP_OPENALGO__AUTH__API_KEY",)`; with `{"AT__OPENALGO__AUTH__API_KEY": ""}` → no problem, `masked == ()`. Kernel with `{"OPENALGO_API_KEY": SYNTH}` → no problem, `masked == ()`; with `{"AT__OPENALGO__AUTH__API_KEY": SYNTH}` and no reference → one `CFG-R01`, `masked == ()`; with that name as an `env` reference's locator in the profile → no problem |
| Account limits (Fork call A) | `prod(account={"limits": L})` with `L` the drop-in's nine, `{"max_trades_per_session": 5, "max_entries_per_desk": 10, "max_open_structures": 1, "require_fresh_setup": True, "entry_cooldown_secs": 300, "max_daily_loss_amount": 4000, "drawdown_rate_enabled": True, "drawdown_rate_max_loss": 3000, "drawdown_rate_window_mins": 15}` → `SessionLimits(5, 10, 1, True, 0, 300.0, 0.0, 4000.0, 0.0, True, 3000.0, 15, "")`. `max_trades_per_session: "5.0"` → 5; `"5.7"` → 5; `require_fresh_setup: "maybe"` → `False`; `no_new_trade_after: "9:30"` → `"9:30"`; `max_daily_loss_amount: null` → `0.0`; no `account` key → `NO_ACCOUNT_LIMITS` |
| Unreadable limits (R-1) | `L` with `max_trades_per_session: "abc"` → `account_limits is None`, `codes == [("CFG-R03", "account.limits.max_trades_per_session", "profile")]`, and every other setting resolves (`host_pass_interval_secs == 20`); the same with `participant=None` → `None`, no raise; `no_new_trade_after: "930"` and `"24:00"` → `None`; profile `"abc"` with env `{"MCP_LIMITS__MAX_TRADES_PER_SESSION": "5"}` → 5 (only the winner is parsed), one `CFG-R02`; profile 5 with that env `"abc"` → `None` |
| Accounts | `prod(accounts={"main": {"broker": "openalgo", "account_id": "SYN-ACCT-1", "exchange": "NFO"}})` → `Account("main", "openalgo", "SYN-ACCT-1", "NFO")` |
| Secrets stay out | `prod(secrets={"openalgo": {"api_key": {"source": "env", "locator": "SYN_KEY_ENV", "version": None}}})`, env `{"SYN_KEY_ENV": SYNTH}` → no problem; `secret_refs == ("openalgo/api_key@unversioned",)`; `profile_digest == "9ce35c0545e1260beb7c431446b9a50711a20c3eee9b4378c88296f0776118ea"` (of `{"profile":"production","secrets":["openalgo/api_key@unversioned"]}`); `SYNTH` absent from `revision`, `canonical(snapshot())`, every projection digest's input and every `provenance` entry |
| Projections | `prod(market={"poll_interval_secs": 60, "bar_confirm_lag_secs": "7"})` → `projection("market") == "81b7a216da6b97aa3d770cf39e59affb72fc137bff6b1314f45458801140c0d5"`; `prod()` → `"77fc2e4c575bd50c1f70c38239c293bf9438b84cb48d91c6f580921c847530c4"`; `prod(observation={"poll_interval_secs": 5, "max_requests_per_minute": 60}, supervisor={"max_requests_per_minute": 12})` → `projection("observation") == "c13e694c8120851f0ae227ea91c9aad8acc76f7602fc46beada64617c093e262"`; `prod()` → `projection("recovery") == "124ae94ea48f80fc82b50ef611b43ba0bd0f7269dc0560d05046eb3abfafe41d"`. Two participants: the market profile above, kernel with env `{"AT_MARKET_STORE_PATH": "/srv/k/market.sqlite"}` and supervisor with `/srv/s/market.sqlite` → equal `market` digests (`81b7a2…`), different `revision`s |
| Revision | `_defaults` monkeypatched to `lambda: {}`, `participant=None`: `effective("test", {})` → `defaults_digest == "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a"`, `profile_digest == "5cb5c06d0a1b0ee8828fc4079563b70b0e7e2c4cb000f871f3d2720c7c9e3712"`, `revision == "3200d18b479522db233080b2d6ed14966a1631b7a66fda0cf3c078fd3ca35d36"`; with `{"AT_POLL_INTERVAL_SECS": "60"}` (normalized to the int 60) → `"0d6f74938733c7ba85c3c2a46f95cc4082b63bd25b4fe2c79fc0f287a8a40cd2"`; with `"61"` → `"7373e0b93eae19d8bf75b6ec171bcb000349a1dc279e551830c1ae9d5e46d2a7"`; the same call twice → the same value |
| Shared budget (R-3) | Kernel, `prod(observation={"poll_interval_secs": 5, "max_requests_per_minute": 60}, supervisor={"max_requests_per_minute": 13})` → no raise, one `CFG-R03` naming `supervisor.max_requests_per_minute`; with 12 → no problem (48 + 12 = 60); strategy with 13 → no raise, the same problem reported. `budget_check(5, 60, 13)` raises; `budget_check(5, 60, 12)` and `budget_check(5, 48)` do not; `budget_check(5, 47)` raises (built) |
| Immutable | Assigning `settings.poll_interval_secs` or `revision` raises `FrozenInstanceError`; mutating `section("channel")`'s result leaves a second call's result unchanged |
| `at` | A profile file `{"profile": "production", "market": {"max_view_age_secs": -1}, "foo": 1}`, env `{"MCP_KILL_SWITCH": "1", "AT_WHATEVER": "x"}`: `participant="at"` → `kill_switch is True`, `codes` = one `CFG-R03` (`market.max_view_age_secs`) and two `CFG-R01` (`foo`, `AT_WHATEVER`); `participant="kernel"` → the same three problems, no raise. A missing profile path: `participant="at"` → one `CFG-R03` problem (key `AT_PROFILE`), `kill_switch is True`; `participant="kernel"` → raises |
| Participants | Names exactly kernel, market, supervisor, observer, strategy, cognition, operator, at, mcp, console, backup, installer. Unit users distinct. Every credential scope is a `SCOPES` key. Exactly kernel and market hold `("openalgo", "api_key")`. Every participant but kernel, market and observer forbids exactly `("AT__OPENALGO__AUTH__API_KEY", "MCP_OPENALGO__AUTH__API_KEY", "OPENALGO_API_KEY")`. Group members: `at-channel` = operator, strategy, cognition; `at-operators` = at; `at-ledger-readers` = supervisor, operator, mcp, backup; `at-market-readers` = kernel, strategy, supervisor, backup. Every `fields_required` entry is a `FIELDS` key shipping `null`. Every field scope names known participants or a projection. Only `at` has `profile_problems_only` |

**`tests/contracts/test_installed_artifact.py`, the lock group** (step 2 adds the rest of the file):

| Group | Cases |
|---|---|
| Lock | The first three lines match the header above (`<version>`, `<major.minor.patch>` and `<sys.platform>` by pattern; the Python version starts `3.11.`); each requirement is `name==version` followed by at least one `--hash=sha256:<64 hex>` line; no `-e`, URL or `--index-url` line; the pinned set includes, by normalized name, every name of `[project] dependencies` and of the `operator` and `mcp` extras, with `numpy==2.5.3`, `pandas==3.0.6`, `openalgo==2.0.5`, `uvicorn==0.54.0`, `fastmcp==3.4.7`, `mcp==1.30.0`, `httpx==0.28.1`, `starlette==1.7.0`; `pytest` and `hypothesis` are absent |

**Changed existing tests:** none. `tests/integration/test_kill_inputs.py`, `tests/unit/test_policy_parameters.py`, `tests/unit/test_cognition_assembly.py`, `tests/unit/test_provider_records.py` and `tests/unit/test_market_ingest.py` call `resolve("test", …)` with no participant or monkeypatch `_defaults`, and pass unchanged.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence), one at a time, and restored byte for byte with an md5 check. At least:

| Change | Test that must fail |
|---|---|
| `settings/loader.py`: the environment layer applied before the profile | Precedence; `CFG-R02` |
| `settings/loader.py`: a profile `null` skipped instead of unbinding | `null` unbinds |
| `settings/loader.py`: two aliases resolved by the first name in code-point order | `CFG-R02` (stricter) |
| `settings/loader.py`: an unknown profile key raises | Unknown names |
| `settings/loader.py`: a missing `extends:` base skipped | Profiles refuse |
| `settings/loader.py`: the secret-looking check made before the field check | Secret-looking names (`secrets` kept) |
| `settings/loader.py`: a masked name left out of `masked` | Masking |
| `settings/loader.py`: `revision` built over the whole environment mapping | Secrets stay out; Masking; Revision |
| `settings/loader.py`: account-limit counts parsed with `int(raw)` | Account limits (`"5.0"`) |
| `settings/loader.py`: an unparseable limit read as 0 | Unreadable limits |
| `settings/loader.py`: a wrong value with a participant raises | Wrong values; `at` |
| `settings/loader.py`: the resolver raises on the supervisor's share | Shared budget |
| `settings/schema.py`: `strategy` removed from the broker-forbidding participants | Masking; Participants |
| `settings/schema.py`: `ledger.path` added to the `market` projection | Projections (two participants) |
| `settings/schema.py`: `profile_problems_only` cleared for `at` | `at` |
| `resources/defaults.yaml`: `account.limits.max_daily_loss_amount: 4000` | Fields (shipped values); Kept |
| `resources/defaults.yaml`: `host.pass_interval_secs: 21` | Kept; Fields |
| `requirements.lock`: one `--hash` line deleted | Lock |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/settings/schema.py` | `Field`, `FIELDS`, `Participant`, `PARTICIPANTS`, `SHARED_PROJECTIONS`, `Account`, `NO_ACCOUNT_LIMITS`; `Settings`'s new attributes |
| `src/autonomous_trading/settings/loader.py` | `effective`, `Effective`, `Problem`, `ConfigRefused`, the layers, `extends:`, selectors, rules and environment check; `resolve` over `effective`; `_ADMISSION` and its siblings derived from `FIELDS`; `budget_check`'s supervisor share |
| `src/autonomous_trading/resources/defaults.yaml` | The appended block |
| `src/autonomous_trading/interfaces/cli.py` | The kill-switch's resolve as `participant="at"`, printing `problems` |
| `requirements.lock` | New, generated |
| `tests/unit/test_settings_resolver.py` | New (T-73) |
| `tests/contracts/test_installed_artifact.py` | New, the lock group only |

**No new tree delta:** every file is in README §6 or the module index. `settings/secrets.py` does not change (its `SCOPES` gains the observer's row in step 5).

### Completion conditions (step 1)

* **Targeted tests only,** twice in a row: `tests/unit/test_settings_resolver.py`, `tests/contracts/test_installed_artifact.py`, and the files that read the loader or its callers: `tests/integration/test_kill_inputs.py`, `tests/integration/test_operator_commands.py`, `tests/integration/test_mcp_surface.py`, `tests/unit/test_policy_parameters.py`, `tests/unit/test_cognition_assembly.py`, `tests/unit/test_provider_records.py`, `tests/unit/test_market_ingest.py`, `tests/unit/test_secret_references.py`, `tests/contracts/test_capabilities.py`. Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file, and `yaml.safe_load` on `resources/defaults.yaml`.
* **One full suite, run by the owner:** `settings/` is read by every composition, so this is a wide change.
* `git diff --stat` against the step's start names only the files above.
* PRF-CFG-02's clauses each pass a group: every rules-table row (Profiles refuse, Unknown names, `CFG-R02`, Wrong values, Secret-looking names, Masking, `null` unbinds, Precedence); provenance per key (Precedence; `CFG-R02`); secrets absent from `revision`, the snapshot and every projection (Secrets stay out; Secret-looking names; Masking); two participants sharing projection digests (Projections); the shared read budget (Shared budget); immutability (Immutable). The spec's "refused" for an alias conflict and an unknown key is met as a recorded problem and alert (Deviations).

### Step 1 as built

**Built** in OA_NEW `a4e6fbc` on `slice-08` (from `75420a6`), one commit: `settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml` (the block above, verbatim), `interfaces/cli.py` (the kill switch's one call), `requirements.lock`, `tests/unit/test_settings_resolver.py` (24 tests) and `tests/contracts/test_installed_artifact.py` (the two lock tests). No other file changed.

**Run** locally on Windows, Python 3.14 (`.venv-slice01`), through `scripts/safe_tests.py`: the targeted set of the completion conditions, twice, 460 passed and 5 skipped each time. `ast.parse` passes on the five Python files; `yaml.safe_load` on `resources/defaults.yaml`. The 18 break checks (`s11a_breaks.py` in the session scratchpad) each fail a listed test, and every file was restored (md5). Not run: Linux, and the full suite (the owner's, for this wide change).

**Differences from the text above**, each smaller than a decision:

| Text | As built | Why |
|---|---|---|
| `requirements.lock` by pip-tools under Python 3.11 | `uv pip compile pyproject.toml --extra operator --extra mcp --generate-hashes --universal --python-version 3.12` (uv 0.11.15). Header line 2 reads `# Generator: uv 0.11.15, Python 3.12 (--python-version), universal (every platform's markers)`; the lock test checks that | `numpy==2.5.3` (SLICE-09's live pin) requires Python ≥ 3.12, so no 3.11 lock exists; pip-tools resolves only for the running interpreter, and uv resolves one lock with every platform's markers. **For step 2:** `pyproject.toml` still says `requires-python = ">=3.11"`, which the pins contradict |
| Break check: one `--hash` line deleted | Every `--hash` line of the lock's first requirement deleted | Every requirement has at least two hashes, so deleting one leaves a valid lock |
| `Field(key, attr, kind, env, scope, aliases, secret, register)` | Plus `group`, which marks the moved `_ADMISSION`, `_MARKET`, `_SECURITY` and `_COGNITION` rows those views derive from; `io_weight` is its own kind tag (an `int_pos` from 1 to 10000) | Derivation without a second table |
| `_ADMISSION` and its siblings kept | Also the built `_check(key, value, kind)`, now over the new kind checks | `tests/unit/test_market_ingest.py:470` imports it |
| "Problems in the order found" | Walk problems (`CFG-R01`, `CFG-R04`), then environment problems (`CFG-R01`, `CFG-R07`), then value problems (`CFG-R03`, `CFG-R02`); the `at` test compares the codes as a set | Values are checked after every layer is walked |
| The rules list: "an alias or its key's `env`" against the profile gives `CFG-R02` | Only an alias (today, the account limits' legacy names) gives `CFG-R02`; a field's own `env` over the profile is plain precedence, no problem | The Precedence row of the tests says so; the two lines disagreed, and the test was followed |
| Projections test: kernel at `/srv/k/market.sqlite`, supervisor at `/srv/s/market.sqlite` | Paths under `tmp_path`, and the test also asserts no problem | On Python 3.13 and later under Windows, `/srv/...` is not absolute, so a production profile set the path aside |
| Break check "`revision` over the whole environment" fails Secrets stay out, Masking and Revision | It fails Revision only | A synthetic secret cannot be seen inside a digest; Revision's expected values catch it |
| With no participant, a wrong built value raises as at `9067a24` | Same codes and cases; the text of `binding.revocation_effect`'s error is now `binding_revocation_effect must be one of stop_entries` (was `binding.revocation_effect must be stop_entries`) | One kind check for every enum; no test matched the old text |

**Carried, unchanged:** every item in "Carried to later steps" above, plus the `requires-python` line for step 2.

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
