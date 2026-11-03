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

Steps 1 and 2 come first because every process start, every unit and every test of later steps goes through the resolver, the bundle check and the handshakes. **Step 2 depends on step 8 for production use:** a production kernel needs the send-lease store adapter and bound lease settings, or it refuses even a human advance (`SES-R10`, OA_NEW `kernel/recovery.py:400`, `:409`). Step 2 therefore builds and tests `compose_production` with SLICE-03's fake lease store, and a production composition refuses until `recovery.lease_store` is bound (step 8 builds the adapter; POL-O01 chooses its place). Step 3 comes before step 4 because the supervisor reads the heartbeat the host writes. Step 7 comes after 3–6 because it renders every unit those steps define.

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
| 7 | The entry limits | Two live layers: the account's `limits.*`, set by a drop-in (trades per session 5, entries per desk 10, open structures 1, fresh setup, cooldown 300 s, daily loss 4000, drawdown rate 3000 over 15 min; `deploy/systemd/at-strategy-entry-limits.conf:2-11`), read by `Limits.from_env` (`src/core/framework/sizing/gates.py:64-106`) and passed by the live driver (`scripts/run_framework_live.py:3556`, `:7255-7262`); merged with the policy layer field by field: lower set value, larger cooldown, either fresh-setup, the account's drawdown window, the earliest cutoff (`gates.py:109-149`; `src/core/framework/policy/compat.py:39-47`). Live daily loss: the lower of 4000 and ₹3,600 = **₹3,600** | Both layers kept: `account.limits.*` in the deployment configuration (the drop-in's values, bound by the owner after step 10 records what is in force) and the bound policy's layer, merged by legacy's `effective_limits` ported unchanged into admission. OA_NEW's one-layer `SessionLimits` (`contracts/decisions.py:466-480`) alone would have bound 4000 and loosened the limit | — |
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

## Step 2 — the bundle, its verification, handshakes, limits and compositions

<a id="step-2--the-bundle-its-verification-handshakes-limits-and-compositions-outline"></a>The authorities are the configuration spec's [packaging](../../design/configuration-artifacts-release.md#packaging-pyprojecttoml-requirementslock), [bundle manifest](../../design/configuration-artifacts-release.md#bundle-manifest-bootstrappy), [loaded-artifact verification](../../design/configuration-artifacts-release.md#loaded-artifact-verification-bootstrappy), [history compatibility](../../design/configuration-artifacts-release.md#history-compatibility-bootstrappy), [compositions](../../design/configuration-artifacts-release.md#compositions-bootstrappy), [account limits](../../design/configuration-artifacts-release.md#account-limits-bootstrappy) and [boundary handshakes](../../design/configuration-artifacts-release.md#boundary-handshakes-settingsschemapy) sections, the runtime spec's [units](../../design/runtime-isolation-observability-deployment.md#units-deploysystemd), the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) (the fork rule, and the live-readiness answer that every start-time behaviour stays today's), [step 1 as built](#step-1-as-built), and legacy at 445eb116. Step 2 is TASK-S11-01 (entrypoints, the bundle), TASK-S11-02 (manifest and handshake parts) and TASK-S11-10: PRF-CFG-01, PRF-CFG-04, PRF-CFG-10 (`check_handshake`, the channel and the market store; the mediator and ledger rows are steps 5 and 4), PRF-CFG-11 and PRF-XC-02's production part. It builds on OA_NEW `a4e6fbc` or later. Every OA_NEW citation below is at `a4e6fbc`. **Nothing here opens a secret:** `--check` reads only the `secrets` section's references, and every test value is synthetic, made at run time (`SYNTH` as in step 1).

**In plain words.** This step makes the new system installable and lets each of its programs answer "are you ready?". Each program gets its own command (`at-kernel`, `at-market`, `at-strategy` and the rest). Each command has a `--check` mode. It reads the settings, checks the installed files and lists what is missing. It opens no ledger, no market store, no socket, no broker connection and no key, so it never changes a running system. A release now carries a list of every file it is made of, with a fingerprint of each. When a program starts for real on the trading server, it compares the files it actually loaded with that list. The kernel refuses to start on a mismatch, as today's trading authority refuses an unattested release. The market process and the operator relay only report a mismatch: stopping them would stop the trail or the owner's commands, and today's system never stops them for that. Programs that talk to each other also compare the settings they must share. A difference is reported and alerted, never refused, because today nothing compares settings. The account's entry limits from step 1 are merged with the strategy's own limits exactly as today, so the live daily loss limit stays ₹3,600, and an unreadable limit stops new entries only. Nothing here changes when or how the system trades.

### Decisions

#### What legacy does here

* **Start attestation.** The trading authority binds itself to the release before it serves. It refuses to start when the bound receipt is not backed by its digest and `RELEASE_BOUND` event, or when the release in force differs from the one bound (`src/tier1/gateway_route.py:360-399`, called at start, `src/runtime/tier1_authority/service.py:800-808`). "The release" includes the effective configuration: `release.compare` checks the code revision and source digest, **the effective config digest**, the units, the SQLite runtime, the schema and the epoch (`src/tier1/release.py:82-93`, the config at `:87-90`), so a settings change the deploy did not bind refuses the authority's start. Nothing else attests at start. A process started from other code ran, and the authority refused its sends: 25 of them on 14 October 2026 (`deploy/release_check.py:7-11`).
* **`--check` only reads.** `at update --check` "change[s] nothing" (`deploy/at:1679-1683`); `deploy/session_units.py --check` reads the installed units and says whether they agree (`deploy/session_units.py:32`, `:180`); the release check opens the ledger as a reader and writes nothing (`deploy/release_check.py:20`).
* **The limits merge.** `effective_limits(account, strategy)` (`src/core/framework/sizing/gates.py:109-149`): of each count, amount and percentage the lower value that is set; the larger cooldown; either fresh-setup; the drawdown gate on when either layer turns it on, its window the account's when the account turns it on, else the strategy's, else 0; the earliest cutoff by clock time, an unparseable one sorted first so the gate refuses on it (`:132`). The live driver merges the account layer into every desk's limits (`src/core/framework/policy/compat.py:39-47`).
* **Handshakes.** The authority's channel compared the client's code revision only, so a setting change never turned a peer away (SLICE-10's record of `service.py:291-297`). The market poller wrote its records with no check of who reads them.

#### Python and the commands (`pyproject.toml`, `__main__.py`)

* **`requires-python = ">=3.12"`.** Step 1 resolved the lock for 3.12, because `numpy==2.5.3` needs it. **Deviation** from the configuration spec's "keeps `>=3.11`". `version` stays `0.1.0.dev0`; the dependencies, extras and package data are unchanged.
* **`[project.scripts]`,** exactly these seven:

  | Command | Function | Participant |
  |---|---|---|
  | `at-kernel` | `autonomous_trading.bootstrap:main_kernel` | kernel |
  | `at-market` | `autonomous_trading.bootstrap:main_market` | market |
  | `at-supervisor` | `autonomous_trading.bootstrap:main_supervisor` | supervisor |
  | `at-strategy` | `autonomous_trading.bootstrap:main_strategy` | strategy |
  | `at-cognition` | `autonomous_trading.bootstrap:main_cognition` | cognition |
  | `at-operator` | `autonomous_trading.bootstrap:main_operator` | operator |
  | `at` | `autonomous_trading.__main__:main` | at |

  Each `main_<p>()` returns `run("<p>", sys.argv[1:], os.environ)`. `at-cognition` is declared now; the composition table decides whether it runs. No `at-observer` (step 5) and no research command (SLICE-12). `python -m autonomous_trading operator serve` and `mcp serve` stay; `__main__.main` sends both through `run("operator", …)` and `run("mcp", …)`, so they take `--check` too. `at --check` goes to `check("at", …)`; every other `at` argument is the built CLI.
* **`at-strategy` takes one positional argument,** the strategy id (`at-strategy buyer_edge`; one strategy per process, SLICE-09). A missing or second id is a usage error.
* **Exit codes,** for every command: 0 done; 1 the start (or the check) refused; 64 a usage error; 78 composed, but this release has no service loop for the participant (below).

#### `--check` (`bootstrap.check`)

`check(participant, argv, environ, out) -> int` runs these in order, and every one runs (a refusal does not stop the later checks):

1. **Settings:** `eff = check_environment(participant, environ)`, which is `effective(environ.get("AT_PROFILE", "test"), environ, participant=participant)`. A `ConfigRefused` is a refusal; nothing after this step runs, because nothing is resolved.
2. **Artifact,** only for a `production` profile: `load_manifest(environ)`, then `verify_loaded(manifest)` (below). Each problem is a refusal for a participant that refuses on `CFG-R06`, and a problem line for one that reports it (Fork call E). Otherwise the line reads `artifact: unverified (<kind> profile)`.
3. **Required settings:** every key of `required_fields(participant, eff.profile_kind)` (below) left unbound is the refusal `unbound <key>`.
4. **Credential references:** for the kernel and the market process with a `production` profile, a scope entry of `SCOPES[<participant>]` with no reference in the `secrets` section is the refusal `no credential reference openalgo/api_key`. Only the identifier is compared; no value is read.
5. **The participant's own read-only checks:**

   | Participant | Checks |
   |---|---|
   | kernel | `budget_check(observation.poll_interval_secs, observation.max_requests_per_minute)`; in production, `parse_peers(eff.section("channel"))` (a `ValueError` refuses `channel`); `market.views` names `protection` (else `unbound market.views.protection`); `AT_DEPLOYMENT_ROOT` set and absolute, else the problem `kill_file_root_unset` (Fork call F) |
   | market | `market.poll_interval_secs == 60` (`market.ingest.compose`'s built refusal); `market.source.greeks_batch` at most `GREEKS_BATCH_MAX` (50, `market/sources.py`); each `market.source.instruments` row builds a `MarketInstrument` |
   | supervisor | `budget_check(poll, max, supervisor.max_requests_per_minute)` |
   | strategy | exactly one id; `HostSettings(pass_secs, seal_wait_ms, review_retry_ms)` builds; `load([PRODUCTION], parse_registry(<strategies.registry>), composition=c)` with `c` `"production"` for a production profile, else `"simulation"`; the id's registration is runnable (else `STR-R14 not_runnable`); its descriptor's `view_policy` is a key of `market.views` |
   | cognition | `_cognition_refusals(settings)`, as built |
   | operator | `parse_operator` of `eff.section("operator")`, or, when the profile has no `operator` section, of the file `AT_OPERATOR_CONFIG` names (the built route); neither is `unbound operator` |
   | mcp | `parse_mcp` and `auth_mode` over the file `MCP_CONFIG_FILE` names, as `mcp.serve` reads it, without resolving a token |
   | at | none: `at --check` always exits 0 (step 1: nothing may keep the kill switch from engaging) |

   `load` reads the strategy package's source files only; it opens no store.

**Output,** one line each, in this order, to `out`:

```text
participant: <name>
profile: <test | simulation | production | research>
settings: <eff.revision>
artifact: verified <bundle_digest> | unverified (<kind> profile) | mismatch <count>
problem: <text>        (each Effective problem, then each reported check, in order found)
refused: <text>        (each refusal, in order found)
check: ok | check: refused
```

A problem never changes the exit code (R-2). Every text names a key, a code, a file path or a count, never a value.

**`--check` never:** opens the ledger (writer or reader), the evidence store, the market store or the strategy store; opens a socket or an HTTP connection; calls `settings.secrets.resolve`; imports `adapters.openalgo`; sets or blanks an environment name; creates, writes or deletes a file or directory. The history check against the live ledger (`compatible`) is the installer's, read-only, at `VERIFIED_DISARMED` (step 7).

#### The start sequence (`bootstrap.run`)

`run(participant, argv, environ) -> int`. With `--check` in `argv` it returns `check(…)`. Otherwise:

1. **`prepare(participant, environ) -> Effective`:** `check_environment`; a `ConfigRefused` exits 1 with its text on stderr (never for `at`). Each `eff.masked` name is set to `""` in `os.environ` and in `environ`. The process's `Secrets` are resolved: `resolve(<refs in scope>, SCOPES[<scope>], live=eff.profile_kind == "production", environ=environ)` for the kernel, the market process and cognition; the operator and MCP processes keep their built resolution; every other participant holds `Secrets(())`. Logging: when the root logger has no handler, `logging.basicConfig(level=INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")` to stderr (journald under systemd); then `secrets.log_filter()` is added to every root handler, and `sys.excepthook` and `threading.excepthook` are replaced by functions that log the exception at CRITICAL through the root logger with `exc_info`, so the filter scrubs a traceback too (SLICE-10's hand-off). Then each problem is logged at WARNING as `settings: <text>`.
2. **Artifact,** production only: `load_manifest` and `verify_loaded`. A refusing participant exits 1 with each line on stderr; a reporting one logs each at WARNING and goes on.
3. **Required settings:** an unbound key raises `RefusingParameterUnbound(key)`; exit 1. Not for `at`.
4. **Compose:** kernel and market through `compose_production` (below); operator through `api.serve(environ, settings=eff.settings, release=<bundle_digest or None>, projections=dict(eff.projections))`, which passes `projections` to its `KernelChannelClient`; MCP through `mcp.serve(environ, settings=eff.settings)`; `at` through the built `cli.main`. `api.serve` and `mcp.serve` gain those keyword arguments (and `api.serve` also `projections`), default `None`, which keeps today's `resolve(environ["AT_PROFILE"], environ)`. With `release` given, the operator's `KernelChannelClient` takes it instead of the config's `kernel.release`, and a config value that differs is the problem `CFG-R03 bad_value: operator.kernel.release` (SLICE-10's hand-off: every client presents its own release's digest).
5. **Identity record:** when `paths.run` is bound, `<paths.run>/identity/<participant>.json`, written to a temporary name and moved over with `os.replace`, mode `0640`: `{"format": "at-identity/1", "participant", "pid", "bundle_digest" (or null), "artifact": "verified" | "unverified" | "mismatch", "settings_revision", "settings": eff.snapshot(), "problems": [text], "started_utc"}`. Unbound `paths.run` logs one WARNING and writes nothing. Steps 4 and 7 read it.
6. **Serve,** or exit 78. In this step only the operator, MCP and `at` paths serve. The kernel's loop is step 3 and the supervisor's is step 4. The market, strategy and cognition loops have no step yet (Open, below). Until each exists, `run` composes, writes the identity record, closes what it opened, logs `no service loop in this release`, and exits 78.

#### Required settings (`bootstrap.required_fields`)

`required_fields(p, kind)` is `PARTICIPANTS[p].fields_required`, plus, for a `production` profile:

| Participant | Production adds |
|---|---|
| kernel | `ledger.path`, `market.store_path`, `accounts`, `recovery.lease_store`, `openalgo.base_url`, `market.views` |
| market | `openalgo.base_url`, `market.http_timeout_ms`, the eight `market.source.*` |
| strategy | `market.store_path`, `market.views`, `strategies.registry` |

The lease timings stay out: without them recovery refuses even a human advance (`SES-R10`, as built), and the kernel cannot send either way. `account.max_worst_case_loss` stays out: admission already refuses entries while it is unbound (`kernel/admission.py:157-158`), and a start refusal would also stop exits.

#### New fields (`settings/schema.py`, `resources/defaults.yaml`)

Each ships `null`, has no environment name, and is appended to `resources/defaults.yaml` inside the mapping its key names (`market:`, `strategies:`) or as a new `openalgo:` mapping. Step 7's example profile carries legacy's values.

| Key | Kind | Scope | Basis |
|---|---|---|---|
| `openalgo.base_url` | `text` | kernel, market | Deployment; legacy's `openalgo.rest.base_url`, set by `OPENALGO_API_URL` (`config/defaults.yaml:512`) |
| `market.views` | `views` (new) | kernel, strategy | SLICE-08: policies bound per release by name. **Joins the `market` projection** (step 1's rule: it joins once it is a field) |
| `market.source.strike_count`, `.chain_interval_secs`, `.greeks_batch`, `.tick_mode` | `int_pos` | market | SLICE-08's hand-off; legacy 8, 60, 10, 1 (`config/defaults.yaml:1299`, `:1348`, `:1361`) |
| `market.source.greeks`, `.repair_live` | `bool` (new) | market | Legacy `false`, `true` (`config/defaults.yaml:1325`, `:1374`) |
| `market.source.tick_symbols` | `text_list` (new) | market | Legacy `[BANKNIFTY, NIFTY]` (SLICE-08) |
| `market.source.instruments` | `instruments` (new) | market | Set per deployment; empty in legacy's defaults (SLICE-08) |
| `strategies.registry` | `section` | strategy | Read by `parse_registry` at composition (SLICE-09) |

The new kinds and their normalized values: `bool` → a YAML boolean only (text, 0 and 1 are wrong values); `text_list` → a list of non-empty, stripped `str`, kept in order; `instruments` → a list of mappings of exactly `{name, spot_exchange, option_exchange, live}`, each normalized as `MarketInstrument` normalizes (`market/sources.py`); `views` → a mapping of name to a mapping of exactly the `ViewPolicy` fields (`contracts/market.py`), with `join`, `max_age_secs` and `stale` as lists of `[stream, value]` pairs and `wdef` as `{interval_secs, confirm_lag_secs, alignment}`. The check builds each `ViewPolicy` and requires its `name` to equal its key; any failure is one `CFG-R03` problem and the field stays unbound. Settings holds `market_views` as `{name: ViewPolicy}`; the canonical mapping enters `values`, `revision` and the `market` projection. `openalgo.base_url` is a `text` whose last part is not secret-looking, so the `openalgo.auth.api_key` drop of step 1 is unchanged. **`Effective` gains `refs: tuple[SecretRef, ...]`** (appended, default `()`): the parsed references, which `prepare` needs to resolve. They hold a source and a locator, never a value, and enter no digest or snapshot.

#### The manifest and verification (`bootstrap.py`)

* **`build_manifest(*, wheel, lock, deploy_dir, ui_root, composition, provenance, license) -> dict`** runs inside the release's own interpreter (the installer, step 7, calls it from `<release>/venv` at staging; the tests do the same). `artifact`:
  * `distribution`: `{name: "autonomous-trading", version, wheel_sha256: sha256 of the wheel file, record_sha256: sha256 of the installed `RECORD` file's bytes}`;
  * `dependencies`: every installed distribution but the project's, sorted by normalized name, `{name, version, sha256}`, where `sha256` is the SHA-256 of that distribution's installed `RECORD`. Each must be pinned in `requirements.lock` at that version, else `ValueError` naming it. **Deviation:** the spec's "sha256 from requirements.lock"; the lock holds several files' hashes per pin, while `--require-hashes` already enforced them at install, and the `RECORD` hash names what is installed;
  * `resources`: `{path relative to resources/: sha256}` for every file under the packaged `resources/` (`defaults.yaml`, `events.schema.json`, `canvas.schema.json`, `migrations/001_initial.sql` … `008_decisions.sql` at `a4e6fbc`);
  * `schema`: `{migration_revision: max number of kernel.ledger.schema.MIGRATIONS (8), events_schema: sha256 of events.schema.json, candidates_schema: null, canvas_schema: sha256 of canvas.schema.json}`;
  * `readers`: `{"event": sorted [[kind, 1] for every kind in events.schema.json], "candidate": []}`. Every event is written with `schema_version` 1 (`kernel/ledger/store.py:744`);
  * `runtime`: `{python: platform.python_version(), sqlite_binding: "apsw", sqlite_version: runtime_identity()["sqlite_version"]}`;
  * `participants`: `{name: status}` from `COMPOSITIONS[composition]`;
  * `entrypoints`: `{command: "module:function"}` from the installed distribution's console scripts. **Deviation:** a field the spec does not list; `validate_composition` reads it;
  * `deploy`: `{install_sha256: sha256 of <deploy_dir>/install.py or null, templates: {file name: sha256} for <deploy_dir>/systemd/*}` (`deploy/install.py` is step 7's, so it is `null` until then);
  * `endpoint_contracts: null` and `measurements: null` until TASK-S07-05's records and TASK-S11-07's approvals exist;
  * `ui_assets`: with `ui_root`, `{"files": {path: sha256}}` over the files `git ls-files -z operator_ui` lists in the checkout, read from the working tree; else `null`. **This is the UI shipping manifest:** SLICE-10 named none.

  Outside the digest: `provenance` `{git_sha, built_at, builder}` and `license` (`release.license` or `null`). `format` is `"at-bundle/1"`. `bundle_digest(manifest) = digest(manifest["artifact"])` (`kernel/ledger/envelope.py`). `write_manifest(path, manifest)` writes canonical JSON and a newline, and raises `FileExistsError` if the file exists: nothing changes a manifest once written.
* **Installs use `--no-compile`.** No `.pyc` is in any `RECORD`, so a byte-code file Python writes later can never fail verification. A `.pyc` row in `RECORD` is itself a verification problem.
* **`load_manifest(environ) -> tuple[dict | None, list[str]]`:** the release directory is `Path(sys.prefix).resolve().parent`, and its name must equal `AT_RELEASE`; the manifest is its `bundle.json`. A missing `AT_RELEASE`, another name, a missing or unreadable file, text that is not JSON, or a `format` other than `at-bundle/1` is one problem, `CFG-R06 artifact_mismatch: bundle.json <reason>`.
* **`verify_loaded(manifest) -> list[str]`,** each line `CFG-R06 artifact_mismatch: <what>`, checked in this order and all reported:
  1. `location`: `sys.prefix` resolved is a directory named `venv`, and `autonomous_trading.__file__` resolved lies inside it;
  2. `version`, `record`, then `file <path>` per `RECORD` row whose `sha256=` hash (URL-safe base64, unpadded) differs from its file's bytes, or whose file is missing;
  3. `dependency <name>` for each name and version that differs between `importlib.metadata.distributions()` (the project excluded) and `artifact.dependencies`, either way, and for a `RECORD` hash that differs;
  4. `resource <path>` for each manifest resource whose bytes, through `importlib.resources`, hash differently, and for each packaged resource file the manifest does not list;
  5. `runtime` when the three runtime values differ.

  It reads files only; it opens no store.
* **The kernel's bound settings revision (Fork call E, legacy's config binding).** The manifest is immutable, so the settings revision the installer binds for a release lives beside it: `<release>/settings.json`, `{"format": "at-settings-binding/1", "revisions": {participant: revision}}`, which step 7 writes at `VERIFIED_DISARMED` from each `--check`'s `settings:` line. `bound_revision(environ, participant) -> str | None` reads it from the release directory `load_manifest` uses. **At a production kernel start,** an absent file, an absent `kernel` entry, or an entry other than `eff.revision` is the refusal `CFG-R06 artifact_mismatch: settings_revision`, as legacy's authority refused a config digest other than the one bound (`src/tier1/release.py:87-90`). In the kernel's `--check`, an absent file or entry is the problem line `CFG-R06 artifact_mismatch: settings_revision unbound` (the installer runs `--check` before it writes the file), and a differing entry is a refusal. No other participant checks it: legacy bound the configuration only at the authority.
* **`compatible(manifest, reader) -> list[str]`** over a `LedgerReader`: the stored `migration_revision` (`ledger_meta`) above `artifact.schema.migration_revision` is `CFG-R09 incompatible_history: migration_revision <stored> > <supported>`; each stored `(kind, schema_version)` (`SELECT DISTINCT kind, schema_version FROM ledger_event`) not in `readers.event` is `CFG-R09 incompatible_history: event <kind>/<version>`. The continuity check (`CFG-R11`) is the installer's (step 7); the kernel's own `carried_runnable` stays as built.

#### Which start refuses on `CFG-R06` (Fork call E)

| Participant | On a verification problem | Why |
|---|---|---|
| kernel | refuses, and also on `settings_revision` (above) | Legacy's authority refused to start unattested, including on an unbound config digest (above) |
| strategy | refuses | Withholds new intents only; legacy's authority refused an unattested process's sends |
| cognition | refuses | The bound review policy's unavailable behaviour applies (A09-F1); no new gate |
| supervisor | refuses | Holds no money path |
| market | reports | Refusing would stop the views that protection and the trail read; legacy's poller had no such check |
| operator | reports | Refusing would remove the owner's API commands (kill, close); legacy's owner API had no such check |
| mcp | reports | Read-only live; legacy's gateway had no such check |
| at | reports | Never refuses (step 1) |

"Reports" is a WARNING per line, the identity record's `"artifact": "mismatch"`, and the problem lines of `--check`.

#### Compositions (`bootstrap.py`)

* **`COMPOSITIONS["first_release"]`,** `{participant: (status, commands)}`, in this order: kernel (`required`, `at-kernel`); market (`required`, `at-market`); strategy (`required`, `at-strategy`); cognition (`policy`, `at-cognition`); supervisor (`required`, `at-supervisor`); observation (`required`, `at-observer`, or the native read-only credential, step 5); operator (`required`, `at-operator` and `at`); backup (`required`, none until step 8 names it); canvas (`optional`); telemetry (`optional`); research (`deferred`); rl (`deferred`).
* **`validate_composition(name, manifest, *, enabled_units, cognition_required, native_observation) -> list[str]`.** For each row, in order, that is `required`, or `policy` with `cognition_required`: each command missing from `artifact.entrypoints` is `CFG-R10 participant_missing: <participant> entrypoint <command>`; the participant's unit (from `PARTICIPANTS`; observation's is `at-observer.service`) missing from `enabled_units` is `CFG-R10 participant_missing: <participant> unit <unit>`. Observation is satisfied by `native_observation` alone. An unknown name is `CFG-R10 participant_missing: composition <name>`. `optional` and `deferred` rows are never reported. **Deviation (signature):** the spec's `(composition, effective, ledger)`; the installer (step 7) supplies the enabled units it rendered and reads the bound review policy through `LedgerReader` for `cognition_required`. BuyerEdge's descriptor declares one market view input (`strategies/buyer_edge.py`), which the market row already requires.
* **`compose_production(effective, manifest, *, participant, clock, environ, leases=None, policies=None, stats=None)`** composes `kernel` or `market`; any other participant, or a profile kind other than `production`, raises `ValueError`. Both first raise `RefusingParameterUnbound` for each unbound `required_fields` key.
* **The kernel.** `compose_simulation`'s body (`bootstrap.py:134-285`) moves unchanged into `_compose_kernel(settings, broker, clock, *, <the same keywords>, port_factory=None, contracts=None, relays=None)`. `compose_simulation` keeps its signature and calls it with those three `None`, so every simulation test and PRF-XC-02's simulation test are unchanged. Only when `port_factory` is given (production) does the body differ: the `capacity.synthetic_amount` refusal is skipped (step 1 sets it aside in production, and the coordinator accepts `None`, `kernel/coordinator.py:122`); `port = port_factory(evidence)` right after the `EvidenceStore` is built, and the observation loop reads that port; the reconciliation contracts are `contracts`; `Authority` takes `relays`; no `Authorizer` is built (SLICE-10: a live kernel composes none). `compose_production` passes:
  * `port_factory`: `lambda ev: OpenAlgoAdapter(settings.openalgo_base_url, secrets["openalgo/api_key"], AccountId(account.broker, account.account_id), clock, ev, http_timeout_ms=settings.http_timeout_ms, exchange=account.exchange, read_budget=None, secrets=secrets)`, imported inside the function; `broker=None`;
  * `contracts={}` while `artifact.endpoint_contracts` is `null`: the open visibility window, as the loop has today with no contract (`kernel/reconciliation.py:294-300`);
  * `relays = parse_peers(effective.section("channel")).relays()`, and `authenticated` with every service peer's principal on `local_channel`;
  * `leases`: the argument when given (tests: SLICE-03's `FakeLeaseStore`); otherwise `lease_store_for(settings.recovery_lease_store)`, which in this step raises `RefusingParameterUnbound("recovery.lease_store")` with the text `no lease-store adapter in this release` (step 8 replaces it);
  * `receipt = release_receipt(manifest, effective, environ["AT_RELEASE"])`: `{bundle_digest, release_id, verified: {record: true, resources: true, dependencies: true, runtime: true}, settings_revision: effective.revision, settings_snapshot_ref: content_digest(effective.snapshot()), projections: dict(effective.projections), deployment: {the four recovery.* keys: their values or null}}`. After `recovery.run()`, `comp.evidence.publish(effective.snapshot())` stores the snapshot under that digest;
  * `credentials=secrets` (`Recovery` binds the identifiers, SLICE-10 step 3);
  * `kill_inputs = KillInputs.resolve(settings.kill_switch, settings.kill_switch_files, environ["AT_DEPLOYMENT_ROOT"])`; with `AT_DEPLOYMENT_ROOT` unset, `KillInputs(settings.kill_switch, <the absolute file texts only>)` and the alert `kill_file_root_unset` (Fork call F);
  * `admission = AdmissionPorts(safety=None, conflicts=None, busy=None, observations=None, market=None, planner=Planner(), policies=policies, max_worst_case_loss={canonical(wire(account)): settings.account_max_worst_case_loss} or {} when unbound, holdings=None, stats=stats, positions=LEDGER_POSITIONS)`; `policies` and `stats` are required here (`ValueError` when `None`): no step builds the ledger's `SessionStatsPort` or the bundle's bound policies yet (Open, below), so the tests pass the conftest fixtures;
  * `view_policies = settings.market_views`, and `StoreMarket` takes `handshake=Handshake(bundle_digest, "market_store", CONTRACTS["market_store"], effective.projections)`;
  * before the writer opens: when `ledger.path` exists, `compatible(manifest, LedgerReader.open(path))`; any line raises `HistoryIncompatible` (a `SettingsError`) with the lines. The ledger's own schema check already refuses a newer migration revision (`kernel/ledger/schema.py:112`); the event check cannot fire for a ledger this or an older bundle wrote.

  After composing, the kernel's `recovery.alerts` gains, each once: `settings_problem <code> <key>` per problem; `account_limits_unreadable` when `settings.account_limits is None`; `handshake_mismatch market_store <field>` per `StoreMarket.handshake_problems` line; `kill_file_root_unset` as above. The channel's `alerts` read (`adapters/unix_channel.py:464-467`) serves them, as built.
* **The market process.** `secrets` resolved for the `market` scope; `source = OpenAlgoMarketSource(settings.openalgo_base_url, secrets["openalgo/api_key"], clock, http_timeout_ms=settings.market_http_timeout_ms, instruments=<the MarketInstrument rows>, strike_count=…, chain_interval_secs=…, greeks=…, greeks_batch=…, repair_live=…, tick_mode=…, tick_symbols=tuple(…), secrets=secrets)`; `loop = market.ingest.compose(settings, clock, source, instruments=[i.name for i in rows], streams=source.streams(), handshake=Handshake(bundle_digest, "market_store", CONTRACTS["market_store"], effective.projections))`. It returns `MarketComposition(loop, source)`, frozen. It never imports or builds `OpenAlgoAdapter` (PRF-XC-02, production part), and the kernel never builds `OpenAlgoMarketSource`.

#### Handshakes (`settings/schema.py`, `adapters/unix_channel.py`, `market/store.py`, `market/view.py`, `market/ingest.py`)

* **`CONTRACTS = {"channel": "kernel-channel/1", "market_store": "market-store/1", "observation": "observation/1"}`.** The channel's version is `adapters/unix_channel.py`'s `CONTRACT`, unchanged.
* **`Handshake(bundle_digest: str | None, contract: str, contract_version: str, projections: tuple[tuple[str, str], ...])`,** frozen; `as_dict()` and `Handshake.from_dict(mapping)` (a wrong shape raises `ValueError`). `bundle_digest` is `None` for an unverified participant; two `None`s are equal.
* **`check_handshake(local, remote, *, needs) -> list[str]`,** each line `CFG-R14 handshake_mismatch: <field>`. A `remote.contract` not in `CONTRACTS`, or not equal to `local.contract`, is the single line `contract`, and nothing else is compared. Then, in order: `contract_version`; `bundle_digest`; `projection <name>` for each name of `needs` in sorted order whose digests differ (a name missing on either side differs). A name in `needs` that is not a key of `SHARED_PROJECTIONS` raises `ValueError`. Paths and credentials are in no projection (step 1), so they never differ here.
* **The channel.** `_MESSAGE_KEYS` gains `projections` (`adapters/unix_channel.py:52`); check 5 also requires it to be a mapping of `str` to 64 lower-case hex. `KernelChannelClient(…, projections: Mapping[str, str] | None = None)` sends it (`{}` when `None`). `ChannelCore(…, projections: Mapping[str, str] | None = None)`: when given, after check 8 (`release`), `check_handshake(Handshake(self.release, "channel", CONTRACT, local), Handshake(message["release"], "channel", CONTRACT, sent), needs=("market", "recovery"))`. Each line is logged at WARNING once per peer unit and line, and `handshake_mismatch <unit> <field>` joins `comp.recovery.alerts` once. **The call proceeds** (Fork call E). With `None` (today's tests) nothing is compared. A different contract or release stays refused with `SEC-R11`, as SLICE-10 built it. **Deviation:** the spec's `CFG-R14` refusal on the channel is SLICE-10's `SEC-R11` for the code, and a report for the settings.
* **The market store.** `MarketStore.open(path, clock, *, fault_point=None, handshake=None)`: with a handshake, after the open or upgrade and in one transaction, `CREATE TABLE IF NOT EXISTS writer_handshake (id INTEGER PRIMARY KEY CHECK (id = 1), handshake TEXT NOT NULL, recorded_at TEXT NOT NULL)` and `INSERT OR REPLACE` row 1 with `canonical(handshake.as_dict())` and `clock.now().utc_iso`. `STORE_SCHEMA` stays 2: a table no reader requires changes no reader's schema rule. `_Reads.writer_handshake() -> Handshake | None` (`None` when the table or row is absent). `market.ingest.compose` gains `handshake=None` and passes it on. `StoreMarket(store_path, policies, clock, *, handshake=None)`: with a handshake, at construction `self.handshake_problems = tuple(check_handshake(handshake, recorded, needs=("market",)))`, or `("CFG-R14 handshake_mismatch: absent",)` when none is recorded; without one, `()`. **Reads never depend on it:** a mismatch makes nothing `Unavailable` (Fork call E). The supervisor's check of the store is step 4's.

#### The account limits (`kernel/admission.py`) — Fork call A, completed

* **`effective_limits(account: SessionLimits, strategy: SessionLimits) -> SessionLimits`,** legacy's body (`gates.py:109-149`) ported line for line over `SessionLimits`' field order, with `kernel.planner._hm` (`kernel/planner.py:54-59`, legacy's `_hm`).
* **`with_account_limits(bound, account)`:** `bound` unchanged when it or its `planner` is `None`; else `dataclasses.replace(bound, planner=dataclasses.replace(bound.planner, limits=effective_limits(account, bound.planner.limits)))`.
* **`EntryAdmission.admit`,** just before planning (`kernel/admission.py:856-859`): when `self.s.account_limits is None`, `record(Refusal("ADM-R13", "plan_refused", key, "COMMAND_ADMITTED"), "P", stage="session_gates", reason="account_limits_unreadable")`, and the planner is not called. Otherwise the planner gets `policy=with_account_limits(self.policy.bound_policy(intent.session_id), self.s.account_limits)`. `ActionAdmission`, protection, the trail and settlement never read either layer (legacy, `scripts/run_framework_live.py:7594-7606`, `:7798-7804`).
* **The daily-loss latch reads the merged loss limit too (`kernel/safety.py`).** Legacy's latch, every pass, takes its budget from the merged limits (`effective_limits_for(owner, account_limits)`, `scripts/run_framework_live.py:7984-7988`, into `src/runtime/session_state.py:150-176`). The target's latch takes `budget(risk)` from the policy alone (`kernel/safety.py:177-183`, `:494`). `Safety(…, account_limits: SessionLimits | None = None)` gains the argument, and `_compose_kernel` passes `settings.account_limits`. `latch_budget(risk, account)` is `budget(risk)` with the amount replaced by the lower set value of `Decimal(risk.max_daily_loss_amount)` and `Decimal(account.max_daily_loss_amount)` (the float as is, so 3000.0 is `Decimal("3000")`), and the percentage by the lower set value of `risk.max_daily_loss_pct` and `account.max_daily_loss_pct` (0 or `None` is not set). A percentage applies only with the policy's capital, as `budget` does today. With `account` `None` (unreadable) or `NO_ACCOUNT_LIMITS`, it equals `budget(risk)`: entries are refused anyway while unreadable, and the policy's latch keeps running. `:494` calls `latch_budget(risk, self.account_limits)`. What a trip does, and the unlock, are unchanged.
* **With `NO_ACCOUNT_LIMITS`** (every test profile), the merge is legacy's normalization of the policy layer alone: a drawdown window with the gate off becomes 0 (case M5c), as legacy's live driver always merged.

#### Repository files

* **`.pre-commit-config.yaml`:** legacy's secrets and accident hooks, same pins: `gitleaks` `v8.21.2`; `pre-commit-hooks` `v5.0.0` with `check-added-large-files` (`--maxkb=2048`), `detect-private-key`, `check-merge-conflict`, `end-of-file-fixer`, `trailing-whitespace`. No lint, determinism or knowledge-map hook (OA_NEW has none of their scripts).
* **`.github/workflows/verify.yml`,** on push and pull request, `ubuntu-latest`: `actions/checkout@v4` with `fetch-depth: 0`; `actions/setup-python@v5` with `3.12`; `python -m pip install -e ".[test,operator,mcp]"`; `python scripts/safe_tests.py tests/unit tests/contracts` (which includes the installed-artifact test, run outside the checkout by its own fixture); `gitleaks/gitleaks-action@v2` with `GITLEAKS_ENABLE_COMMENTS: "false"` (legacy's). It deploys nothing and holds no project secret; the gitleaks action reads only GitHub's built-in token.

#### Fork calls in this step

* **A (completed).** Legacy's merge, ported unchanged, for the planner's gates and for the daily-loss latch's budget; an unreadable account limit refuses new entries only, with one alert. The R-5 case below proves ₹3,600.
* **E. Start and boundary checks keep legacy's reach.** `CFG-R06` refuses only where legacy refused, or where the refusal withholds only new entries (the table above). A projection difference on the channel or at the market store, and a bundle difference at the market store, are reported and alerted, never refused: legacy compared only the code revision, and only on the authority's channel. *Listed, not made:* refusing a peer whose settings differ.
* **F. A kill file with no deployment root is reported,** not refused: the kernel watches the flag and the absolute file paths and raises `kill_file_root_unset`, as legacy started even when it watched nothing (SLICE-10's `kill_file_unwatched`). The installer always sets the root (step 7).

#### Deviations in this step

* `requires-python = ">=3.12"`; `entrypoints` added to the manifest; `dependencies[].sha256` is the installed `RECORD`'s; installs use `--no-compile`; `validate_composition`'s signature; the channel's contract and release refusals stay `SEC-R11`; the UI shipping manifest is defined here (each above).
* **`market.views` joins the `market` projection,** so step 1's two `market` digests change (Tests). `market.calendar` is still not a field (step 1).
* **The market store's handshake is an added table** with no schema number change.

#### Open, not built in this step

* **The market host loop** (SLICE-08's `run_once` schedule, the reference-day recording, the ticks socket and its re-subscribe, the MCP `market` port with `ticks.watch`) **and the channel `KernelPorts` client** for the strategy host and cognition: [step 3a](#step-3a--the-market-host-loop-and-the-channel-kernelports-client-for-strategy-and-cognition-outline) (TASK-S11-13).
* **The ledger's `SessionStatsPort` and the bundle's bound policies** (`AdmissionPorts.stats` and `.policies`, `kernel/ports.py:109-127`): step 3. `compose_production` takes them as arguments until then.

Still open, raised for the coordinator:

* **The adapter's in-send read budget:** `ObservationLoop` has no public budget callable, so `read_budget` is `None`, as the adapter's default.
* **The operator's registry and the MCP `configuration` port** (SLICE-10's `OwnerPorts`) stay `None`.

Carried as built: step 3 runs the kernel host, the channel server (`ChannelCore` with `submit=host.submit` and the kernel's projections) and the lease-expiry wait; step 4 runs the supervisor, its read share and the store and ledger handshakes; step 7 runs `compatible`, `validate_composition` and `CFG-R11` at activation.

### Tests

Every value is synthetic. `prod(**sections)` and `SYNTH` are step 1's. `VIEW` is the mapping form of the synthetic `protection` policy `tests/integration/test_market_port.py` builds, and `VIEWS = {"protection": VIEW, "buyer_edge": VIEW with name "buyer_edge"}`. `L9` is Fork call A's nine. `Z(**f)` is `NO_ACCOUNT_LIMITS` with the fields `f` replaced. Digests are SHA-256 over `canonical`, computed with Python at deepening.

**`tests/unit/test_admission_checks.py`, PRF-CFG-11.** Each expected tuple was worked by hand from the rules above and agrees with legacy's `effective_limits` run on the same inputs. The tuples are in `SessionLimits`' order: trades, desk entries, open structures, fresh setup, losses, cooldown, loss %, loss amount, profit amount, drawdown on, drawdown loss, drawdown window, cutoff.

| Case | Account | Policy | Expected |
|---|---|---|---|
| M1 (R-5) | `SessionLimits(5, 10, 1, True, 0, 300.0, 0.0, 4000.0, 0.0, True, 3000.0, 15, "")` | `Z(max_daily_loss_amount=3600.0)` | `(5, 10, 1, True, 0, 300.0, 0.0, 3600.0, 0.0, True, 3000.0, 15, "")` |
| M2a | `Z()` | `Z(max_daily_loss_amount=3600.0)` | loss amount 3600.0, all else zero |
| M2b | `Z(max_daily_loss_amount=4000.0)` | `Z()` | loss amount 4000.0: a 0 never switches the other off |
| M3 | cooldown 300.0 / 600.0 | 600.0 / 300.0 | 600.0 both ways |
| M4 | `Z()` | `Z(require_fresh_setup=True)` | fresh setup `True` |
| M5a | drawdown on, 3000.0, 15 | drawdown on, 1000.0, 30 | on, 1000.0, **15** |
| M5b | `Z()` | drawdown on, 1000.0, 30 | on, 1000.0, 30 |
| M5c | `Z()` | drawdown off, 1000.0, 30 | off, 1000.0, **0** |
| M6a | cutoff `"15:00"` | `"9:30"` | `"9:30"` |
| M6b | `"9:30"` | `""` | `"9:30"` |
| M6c | `"15:00"` | `"abc"` | `"abc"` (kept, so the gate refuses on it) |
| M7 | trades 5, loss % 2.0 | trades 10, losses 8, loss % 1.5, profit 5000.0 | trades 5, losses 8, loss % 1.5, profit 5000.0 |

Then, through admission:

| Group | Cases |
|---|---|
| R-5 end to end | `resolve(prod(account={"limits": L9}), {}).account_limits == SessionLimits(5, 10, 1, True, 0, 300.0, 0.0, 4000.0, 0.0, True, 3000.0, 15, "")`. Merged with M1's policy, the planner's `_gate` with `S = SessionStats(0, 0, 0, True, "0", 0, 0, None, "-3600.00", "0", "0", 0, "10:00", None)` refuses with text starting `Daily loss limit hit (₹3600)`; with `S`'s `daily_pnl` `"-3599.99"` it passes. With the account layer alone, `S` passes: the merge is what tightens it |
| The merged layer reaches the planner | An admission fixture whose bound policy's limits are `Z()`, `account_limits = Z(max_trades_per_session=1)`, stats `trade_count=1`: the entry is refused `ADM-R13` at `P`, stage `session_gates`, reason starting `Max trades/session reached (1/1)` |
| Unreadable limits stop entries only | `account_limits=None`: an entry the fixture otherwise admits is refused `ADM-R13` at `P` with stage `session_gates` and reason `account_limits_unreadable`, and a planner that raises if called is never called; a close request through `ActionAdmission` on the same composition is admitted as without the change |

**`tests/unit/test_safety_matrix.py`, the latch with the account layer (Fork call A).** The existing latch fixture, policy risk `max_daily_loss_amount` `"3600"` with no percentage:

| Case | Account layer | Session P&L | Expected |
|---|---|---|---|
| Latch with the account layer | `Z(max_daily_loss_amount=3000.0)` | `"-3000.00"` | `LOSS_LATCH_TRIPPED` with `budget` `"3000"` |
| | the same | `"-2999.99"` | no trip |
| | `NO_ACCOUNT_LIMITS` | `"-3000.00"` | no trip (budget 3600, as built) |
| | `NO_ACCOUNT_LIMITS` | `"-3600.00"` | trip, `budget` `"3600"` |
| | `None` (unreadable) | `"-3600.00"` | trip, `budget` `"3600"` |
| | `Z(max_daily_loss_amount=4000.0)` | `"-3600.00"` | trip, `budget` `"3600"`: the account never loosens the policy |

`latch_budget` unit cases: risk 3600 and account 3000 → `Decimal("3000")`; risk 3600 and account 0 → `Decimal("3600")`.

**`tests/unit/test_settings_resolver.py`, PRF-CFG-10 (`check_handshake`) and the new fields.** `M60 = "23b9c51d72175d2562e536a14cc008654a849cb2a40d62685ea866c516500813"` (the `market` projection of `prod(market={"poll_interval_secs": 60, "bar_confirm_lag_secs": "7"})`), `MNONE = "43d64126fa21bb912ad42ddd8c4dd9312c67dca93eebcadb2d42fc3c4b201de3"` (of `prod()`), `RNONE = "124ae94ea48f80fc82b50ef611b43ba0bd0f7269dc0560d05046eb3abfafe41d"`, `RSET = "158f1e92e8cc9bbeca23d7fd9147e22b7d336955b22ca07e6edc80d84630d6de"` (recovery `standing`, 3, 90, 30). `H = Handshake("a" * 64, "channel", "kernel-channel/1", (("market", M60), ("recovery", RNONE)))`; `needs = ("market", "recovery")` unless named.

| Group | Cases |
|---|---|
| Projections (changed from step 1) | `prod(market={"poll_interval_secs": 60, "bar_confirm_lag_secs": "7"})` → `projection("market") == M60` (was `81b7a2…`); `prod()` → `MNONE` (was `77fc2e…`); the two-participant case now expects `M60` for both. Binding `market.views` to `VIEWS` changes the `market` digest |
| Handshake | `check_handshake(H, H)` → `[]`; remote `bundle_digest` `"b" * 64` → `["CFG-R14 handshake_mismatch: bundle_digest"]`; remote version `"kernel-channel/2"` → `[… contract_version]`; remote contract `"ledger"` → `[… contract]` only, even with a different digest; remote `market` `MNONE` → `[… projection market]`; the same with `needs=("recovery",)` → `[]`; remote `recovery` `RSET` → `[… projection recovery]`; remote without `recovery` → `[… projection recovery]`; both `bundle_digest` `None` → `[]`; remote bundle `"b" * 64` and market `MNONE` → `[… bundle_digest, … projection market]` in that order; `needs=("calendar",)` → `ValueError` |
| Paths and credentials | The kernel resolved over `prod(market=…60/"7", ledger={"path": <tmp>/a.sqlite}, secrets=<an env reference>)` and the market process over the same `market` section with `ledger.path` `<tmp>/b.sqlite` and no `secrets`: both `market` digests are `M60`, and `check_handshake` of their handshakes with `needs=("market",)` is `[]` |
| New fields | `market.views` with a policy missing `wdef`, and with a name differing from its key → one `CFG-R03` each, `market_views is None`; `market: {source: {greeks: "yes"}}` and `{greeks: 1}` → `CFG-R03`; `instruments` row without `option_exchange` → `CFG-R03`; `tick_symbols: ["NIFTY", ""]` → `CFG-R03`; `openalgo: {base_url: ""}` → `CFG-R03`; `strategies: {registry: [1]}` → `CFG-R03`. `openalgo: {base_url: "http://127.0.0.1:5000", auth: {api_key: SYNTH}}` → `openalgo_base_url == "http://127.0.0.1:5000"` and one `CFG-R04` (`openalgo.auth.api_key`), as step 1 |

The step 1 Fields row still holds: every new field is named once in `resources/defaults.yaml` and ships `null`.

**`tests/contracts/test_capabilities.py`, PRF-XC-02 (production part), `--check` and compositions.** The production compositions run in a child (`python -I`), so the test process never loads the live adapter. The test reads the child's printed JSON. `PROD` is a production profile under `tmp_path` that binds, with synthetic values, every field the kernel, market, strategy, supervisor, cognition and operator need, including:

* `accounts: {main: {broker: openalgo, account_id: SYN-ACCT-1, exchange: NFO}}`;
* `openalgo.base_url` `http://127.0.0.1:<p>`, a listening socket the test owns that fails the test on any accept;
* `market.views: VIEWS` and `recovery.lease_store: synthetic`;
* `strategies.registry: {ceiling: trade, buyer_edge: {enabled: true, authority: trade, account: {broker: openalgo, account: SYN-ACCT-1}}}`;
* a `channel` section and an `operator` section in the shapes `tests/integration/test_unix_channel.py` and `tests/integration/test_operator_commands.py` already use;
* the `secrets` reference `openalgo/api_key` with source `env` and locator `SYN_KEY_ENV`. The child's environment sets `SYN_KEY_ENV=SYNTH`.

`A0` is this synthetic artifact: `{"distribution": {"name": "autonomous-trading", "version": "0.1.0", "wheel_sha256": "a" * 64, "record_sha256": "b" * 64}, "dependencies": [{"name": "pyyaml", "version": "6.0.2", "sha256": "c" * 64}], "resources": {"defaults.yaml": "d" * 64}, "schema": {"migration_revision": 8, "events_schema": "e" * 64, "candidates_schema": None, "canvas_schema": None}, "readers": {"event": [["FILL", 1]], "candidate": []}, "runtime": {"python": "3.12.7", "sqlite_binding": "apsw", "sqlite_version": "3.51.3"}, "participants": {"kernel": "required"}, "deploy": {"install_sha256": "f" * 64, "templates": {}}, "endpoint_contracts": None, "measurements": None, "ui_assets": None}`. `bundle_digest({"artifact": A0})` is `"1079ed5610d46b82773548bacc7d791109588a9d0b3334512c33ba0bc8fbb4fb"`; with `resources` `{"defaults.yaml": "0" + "d" * 63}` it is `"0ad68e1755be9bea7c7829e74e3cc7765040de91b04b576ca8b7fd0ab02512bb"`. `MAN` is `{"format": "at-bundle/1", "artifact": A0 with readers.event set to every kind of the packaged events schema at version 1 and entrypoints set to the seven commands, "provenance": {...}, "license": None}`; its digest is computed in the test with `bundle_digest`.

| Group | Cases |
|---|---|
| Kernel binds the order half | `compose_production(eff, MAN, participant="kernel", …, leases=FakeLeaseStore(), policies=<fixture>, stats=<fixture>)`: the coordinator's port is an `OpenAlgoAdapter` with `exchange == "NFO"` and account `("openalgo", "SYN-ACCT-1")`; `OpenAlgoMarketSource.__init__` and `SimulatedBroker.__init__`, patched to raise, were never called; the socket saw no connection; `SYNTH` is absent from the child's output and from every ledger event's payload |
| Market binds the market half | `participant="market"`: `MarketComposition`; `OpenAlgoAdapter.__init__`, patched to raise, never called; `"autonomous_trading.adapters.openalgo"` loaded only for `OpenAlgoMarketSource`; the store's `writer_handshake()` equals the handshake built from `MAN` and the effective projections |
| Bundle digest | The two `A0` digests above; `provenance` and `license` changed leave the digest unchanged |
| Receipt | The kernel's `RELEASE_BOUND` receipt has `bundle_digest == bundle_digest(MAN)`, `release_id` `r-synth-1` (`AT_RELEASE`), `settings_revision == eff.revision`, the four `deployment` keys, and `settings_snapshot_ref == content_digest(eff.snapshot())`, which resolves in the evidence store. A second composition over the same ledger, manifest and profile records no second `RELEASE_BOUND` |
| Refusals | A `test` profile → `ValueError`; `recovery.lease_store` unbound → `RefusingParameterUnbound("recovery.lease_store")`; bound with no `leases` argument → the same, text `no lease-store adapter in this release`; `policies=None` → `ValueError`; after one composition, a second with `MAN`'s `readers.event` lacking `["EPOCH_ACTIVATED", 1]` → `HistoryIncompatible` whose text contains `CFG-R09 incompatible_history: event EPOCH_ACTIVATED/1`, and no second `EPOCH_ACTIVATED` was written (the writer was not opened). `compatible` over that ledger with `artifact.schema.migration_revision` 7 → contains `CFG-R09 incompatible_history: migration_revision 8 > 7` |
| Alerts | The profile with `account.limits.max_trades_per_session: "abc"` → `recovery.alerts` contains `account_limits_unreadable` and `settings_problem CFG-R03 account.limits.max_trades_per_session`, once each |
| `--check` opens nothing | In process, with `socket.socket`, `LedgerWriter.open`, `LedgerReader.open`, `MarketStore.open`, `MarketReader.open`, `EvidenceStore.__init__` and `settings.secrets.resolve` patched to raise, `check(p, …)` for each of kernel, market, supervisor, strategy (`["buyer_edge"]`), cognition and operator over `PROD` with its `profile` key set to `test` (so no manifest is read) returns 0, prints `check: ok`, leaves `os.environ` equal to a copy taken before, and leaves the `tmp_path` listing unchanged. `"autonomous_trading.adapters.openalgo" not in sys.modules` afterwards |
| `--check` lines | Kernel over `PROD` without `accounts` → exit 1, lines `refused: unbound accounts` and `check: refused`; strategy with no id → 64; strategy `["no_such"]` → `refused: STR-R14 not_runnable`; supervisor with `observation` 5/60 and `supervisor.max_requests_per_minute` 13 → `refused:` naming `supervisor.max_requests_per_minute`; `at` over a missing profile path → exit 0 with one `problem:` line; kernel with `{"OPENALGO_API_KEY": SYNTH}` → no `CFG-R07`, and strategy with it → one `problem: CFG-R07 …`, `SYNTH` printed nowhere |
| Masking and logging | `prepare("strategy", env)` with `{"OPENALGO_API_KEY": SYNTH}` → `env["OPENALGO_API_KEY"] == ""` and `os.environ` the same; `prepare("kernel", …)` leaves it. After `prepare("kernel", …)` with the env reference, an exception whose text contains `SYNTH`, raised in a thread, is logged with `SYNTH` absent from the formatted record |
| Composition | `MAN` with all seven commands and `enabled_units` = every unit of the table: `validate_composition("first_release", …, cognition_required=False, native_observation=False)` → `["CFG-R10 participant_missing: observation unit at-observer.service"]` when that unit is left out, `[]` when present; without `at-supervisor.service` → `[… supervisor unit at-supervisor.service]`; without the command `at-market` → `[… market entrypoint at-market]`; no cognition unit with `cognition_required=False` → `[]`, with `True` → `[… cognition unit at-cognition.service]`; `native_observation=True` and no observer unit → `[]`; no `at-backup.service` → `[… backup unit at-backup.service]`; no research or telemetry anything → `[]`; `"other"` → `[… composition other]` |

**`tests/integration/test_unix_channel.py`, the channel half of PRF-CFG-10.** A `ChannelCore` with `projections={"market": M60, "recovery": RNONE}` and a strategy peer:

* the client sending the same → answered, no alert;
* `market` one character off (`"0"` replacing the first) → answered with the same result; after two calls `comp.recovery.alerts` holds `handshake_mismatch at-strategy.service projection market` exactly once, and one WARNING was logged;
* a frame without `projections` → `SEC-R11` `shape`; a release one character off → `SEC-R11` `release`, as built;
* a `ChannelCore` built without `projections` and a client sending `{}` → answered, no alert;
* an operator (relay) peer: a `KernelChannelClient` built as `api.serve` builds it, with `projections={"market": M60, "recovery": RSET}`, calls `now` → answered; `comp.recovery.alerts` holds `handshake_mismatch at-operator.service projection recovery` once, and no `market` line. The same client with `{"market": M60, "recovery": RNONE}` → no alert.

**`tests/integration/test_market_port.py`, the store half of PRF-CFG-10.** `HS = Handshake("a" * 64, "market_store", "market-store/1", (("market", M60),))`:

* `MarketStore.open(path, clock, handshake=HS)` → `writer_handshake() == HS` and `schema() == 2`; reopened with another handshake, the row is replaced;
* `StoreMarket(path, policies, clock, handshake=HS)` → `handshake_problems == ()`; with the local bundle one character off → `("CFG-R14 handshake_mismatch: bundle_digest",)`, and `view(...)` returns the same view as with `HS`; with the local `market` `MNONE` → `("CFG-R14 handshake_mismatch: projection market",)`; over a store opened without a handshake → `("CFG-R14 handshake_mismatch: absent",)`.

**`tests/contracts/test_installed_artifact.py`, PRF-CFG-01 and PRF-CFG-04,** beside step 1's lock group. A module fixture, under `tmp_path_factory`: `python -m pip wheel . --no-deps --no-build-isolation -w <t>/dist`; `python -m venv --without-pip <t>/releases/r-synth-1/venv`; `python -m pip --python <venv python> install --no-compile --require-hashes --no-deps -r requirements.lock -r <t>/wheel.txt`, where `wheel.txt` is `autonomous-trading @ <the wheel's file URL> --hash=sha256:<its hash>`; then, with the venv's interpreter and `-I`, `write_manifest(<t>/releases/r-synth-1/bundle.json, build_manifest(wheel=…, lock=requirements.lock, deploy_dir=None, ui_root=None, composition="first_release", provenance={"git_sha": "1" * 40, "built_at": "synthetic", "builder": "test"}, license=None))`. Pip downloads through the lock's hashes; a run with no network fails, it never skips. Each command runs from `<t>/elsewhere` with only `PATH` (the venv's scripts directory and the system's), `SYSTEMROOT` on Windows, `AT_PROFILE` (`PROD` as above, written under `<t>`, with the `env` reference whose variable is **not** set), `AT_RELEASE=r-synth-1`, `AT_DEPLOYMENT_ROOT=<t>/root`, and for the MCP command `MCP_CONFIG_FILE` naming a synthetic read-only MCP profile:

| Group | Cases |
|---|---|
| Every command | `at-kernel`, `at-market`, `at-supervisor`, `at-strategy buyer_edge`, `at-cognition`, `at-operator`, `at` and `python -m autonomous_trading mcp serve`, each with `--check` → exit 0, `artifact: verified <D>` where `D` is `digest(artifact)` the test computes from `bundle.json`, `check: ok`, no `refused:` line. The interpreter's `autonomous_trading.__file__` lies under `<t>/releases/r-synth-1/venv`, and no parent of it holds `.git` |
| Resources and schema | In the venv, `verify_loaded(manifest) == []`; every manifest resource loads through `importlib.resources`; `artifact.schema.migration_revision == 8`; `events_schema` is the SHA-256 of the installed `events.schema.json`; `["RELEASE_BOUND", 1]` is in `readers.event`; `pyproject.toml`'s `requires-python` is `">=3.12"` and its scripts are exactly the seven |
| Substitution | Each alone, restored byte for byte after: one byte appended to the installed `resources/defaults.yaml` → `at-kernel --check` exits 1 with `refused: CFG-R06 artifact_mismatch: resource defaults.yaml` and `refused: CFG-R06 artifact_mismatch: file autonomous_trading/resources/defaults.yaml`; one byte changed in the installed `kernel/admission.py` → `… file autonomous_trading/kernel/admission.py`; a line appended to PyYAML's installed `RECORD` → `… dependency pyyaml`. With the first substitution, `at-market --check` and `at-operator --check` exit 0 with the same texts as `problem:` lines (Fork call E). Settings revision: with no `settings.json`, `at-kernel --check` exits 0 with `problem: CFG-R06 artifact_mismatch: settings_revision unbound`; with `settings.json` binding the kernel to the revision its `--check` printed, no such line; with that entry one character off, exit 1 with `refused: CFG-R06 artifact_mismatch: settings_revision`; with the file correct and the profile's `market.poll_interval_secs` changed afterwards, the kernel's revision moves and the same refusal appears. In-process, `run("kernel", …)` over the last two states exits 1 before anything opens, and `at-market --check` never prints a `settings_revision` line |
| One identity per artifact set | `build_manifest` run again with `git_sha` `"2" * 40` → the same `bundle_digest`, a different `provenance` |
| From the checkout | In the test process, `verify_loaded` over the fixture's manifest → contains `CFG-R06 artifact_mismatch: location` |

**Changed existing tests:** `tests/unit/test_settings_resolver.py`'s Projections row (two digests, above). The four helpers that build a channel frame by hand gain `"projections": {}`, because check 5 now requires the key: `LoopbackClient.call` (`tests/integration/test_operator_commands.py:83`), `call` (`tests/integration/test_operator_routes.py:88`, `tests/integration/test_owner_api.py:71`) and `frame` (`tests/integration/test_unix_channel.py:108`). Every other existing test passes unchanged: `compose_simulation`, `KernelChannelClient`, `ChannelCore`, `MarketStore.open`, `StoreMarket`, `market.ingest.compose`, `api.serve` and `mcp.serve` keep their signatures with new keyword arguments defaulting to today's behaviour.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence), one at a time, and restored byte for byte with an md5 check. At least:

| Change | Test that must fail |
|---|---|
| `kernel/admission.py`: `effective_limits` keeps the larger loss amount | M1; R-5 end to end |
| `kernel/admission.py`: the cooldown takes the smaller | M3 |
| `kernel/admission.py`: the drawdown window from the strategy when the account turns the gate on | M5a |
| `kernel/admission.py`: cutoffs sorted as text | M6a |
| `kernel/admission.py`: `account_limits is None` read as `NO_ACCOUNT_LIMITS` | Unreadable limits stop entries only |
| `bootstrap.py`: `verify_loaded` skips resources | Substitution (resource) |
| `bootstrap.py`: `RECORD` rows not hashed | Substitution (code file) |
| `bootstrap.py`: the market process refuses on `CFG-R06` | Substitution (market reports) |
| `bootstrap.py`: the kernel skips the `settings_revision` check | Substitution (settings revision) |
| `kernel/safety.py`: the latch reads the policy budget alone | Latch with the account layer |
| `interfaces/api.py`: `serve` passes no `projections` | The channel cases (operator peer) |
| `bootstrap.py`: `check` calls `settings.secrets.resolve` | `--check` opens nothing |
| `bootstrap.py`: `provenance` inside `bundle_digest` | One identity per artifact set |
| `bootstrap.py`: `compose_production("market")` builds `OpenAlgoAdapter` | Market binds the market half |
| `bootstrap.py`: `validate_composition` reports an `optional` row | Composition |
| `settings/schema.py`: `check_handshake` ignores `needs` | Handshake |
| `adapters/unix_channel.py`: a projection mismatch refuses | The channel cases |
| `market/view.py`: a handshake mismatch makes the view `Unavailable` | The store cases |
| `pyproject.toml`: `requires-python = ">=3.11"` | Resources and schema |

### Files

| File | Change |
|---|---|
| `pyproject.toml` | `requires-python`, `[project.scripts]` |
| `src/autonomous_trading/__main__.py` | `--check`, and `operator serve` and `mcp serve` through `run` |
| `src/autonomous_trading/bootstrap.py` | `main_*`, `run`, `prepare`, `check`, `check_environment`, `required_fields`, `build_manifest`, `write_manifest`, `bundle_digest`, `load_manifest`, `verify_loaded`, `compatible`, `HistoryIncompatible`, `COMPOSITIONS`, `validate_composition`, `compose_production`, `_compose_kernel`, `release_receipt`, `lease_store_for`, `MarketComposition` |
| `src/autonomous_trading/settings/schema.py` | The new fields; `CONTRACTS`, `Handshake`, `check_handshake`; `Settings`' new attributes |
| `src/autonomous_trading/settings/loader.py` | The `bool`, `text_list`, `instruments` and `views` kinds; `Effective.refs` |
| `src/autonomous_trading/resources/defaults.yaml` | The new fields, `null` |
| `src/autonomous_trading/kernel/admission.py` | `effective_limits`, `with_account_limits`, the unreadable-limits refusal (an intent-spec module; reported to it) |
| `src/autonomous_trading/adapters/unix_channel.py` | `projections` in the frame, client and core (SLICE-10's module; reported to the security spec) |
| `src/autonomous_trading/market/store.py`, `market/view.py`, `market/ingest.py` | The writer's handshake, `StoreMarket.handshake_problems`, `compose(handshake=)` (market spec modules; reported to it) |
| `src/autonomous_trading/kernel/safety.py` | `Safety(account_limits=)`, `latch_budget` (a protection-spec module; reported to it) |
| `src/autonomous_trading/interfaces/api.py`, `interfaces/mcp.py` | `serve(…, settings=None, release=None, projections=None)`; `serve(…, settings=None)` |
| `.pre-commit-config.yaml`, `.github/workflows/verify.yml` | New |
| `tests/unit/test_admission_checks.py`, `tests/unit/test_settings_resolver.py`, `tests/contracts/test_capabilities.py`, `tests/contracts/test_installed_artifact.py`, `tests/integration/test_unix_channel.py`, `tests/integration/test_market_port.py`, `tests/unit/test_safety_matrix.py` | The groups above |
| `tests/integration/test_operator_commands.py`, `tests/integration/test_operator_routes.py`, `tests/integration/test_owner_api.py` | `"projections": {}` in the frame helper |

**No new tree delta:** every file is in README §6 or the module index.

### Completion conditions (step 2)

* **Targeted tests only,** twice in a row: the seven test files above, and the files that exercise the changed modules: `tests/integration/test_owner_api.py`, `tests/unit/test_protection_basket.py`, `tests/unit/test_planner_rules.py`, `tests/unit/test_market_ingest.py`, `tests/unit/test_market_view.py`, `tests/unit/test_market_windows.py`, `tests/integration/test_operator_commands.py`, `tests/integration/test_operator_routes.py`, `tests/integration/test_mcp_surface.py`, `tests/integration/test_kill_inputs.py`.
* Every break check fails a listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file; `yaml.safe_load` on `resources/defaults.yaml` and `.pre-commit-config.yaml`; `tomllib` on `pyproject.toml`.
* `git diff --stat` against the step's start names only the files above.
* PRF-CFG-01 (Every command; Resources and schema), PRF-CFG-04 (Substitution; One identity per artifact set), PRF-CFG-10's resolver, channel and store parts (Handshake; Paths and credentials; the channel and store cases), PRF-CFG-11 (M1–M7; R-5 end to end) and PRF-XC-02's production part (Kernel binds the order half; Market binds the market half) each pass a named group.

### Step 2 as built

**Built** in OA_NEW `3b891d0` on `slice-08` (from `b8574eb`), one commit, 27 files: `pyproject.toml`, `.pre-commit-config.yaml`, `.github/workflows/verify.yml`, `__main__.py`, `bootstrap.py`, `settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml`, `kernel/admission.py`, `kernel/safety.py`, `adapters/unix_channel.py`, `market/store.py`, `market/view.py`, `market/ingest.py`, `interfaces/api.py`, `interfaces/mcp.py`, and eleven test files (the Files table's, plus `tests/conftest.py`).

**Run** locally on Windows, Python 3.14 (`.venv-slice01`), through `scripts/safe_tests.py`: the targeted set of the completion conditions plus step 1's loader readers (`tests/unit/test_policy_parameters.py`, `tests/unit/test_cognition_assembly.py`, `tests/unit/test_provider_records.py`, `tests/unit/test_secret_references.py`), twice in a row after the last change: 973 passed and 14 skipped each time. An earlier run had one failure in `tests/unit/test_cognition_assembly.py::test_capacity_with_threads`; it passed alone three times and in every later run. SLICE-09 recorded that test as timing-sensitive, and step 2 touches no code it runs. The installed-artifact test built the wheel, installed it with `--require-hashes` from PyPI into a release directory outside the checkout, and ran every command's `--check`; a run takes about three minutes. `ast.parse` passes on every edited Python file; `yaml.safe_load` passes on `resources/defaults.yaml`, `.pre-commit-config.yaml` and `verify.yml`; `tomllib` passes on `pyproject.toml`. The 19 break checks (`s11b_breaks.py` in the session scratchpad: the Break checks table's 19 rows) each fail a listed test, and every file was restored (md5). Not run: Linux, the full suite, and the workflow on GitHub.

**Differences from the text above**, each smaller than a decision:

| Text | As built | Why |
|---|---|---|
| `run` calls `prepare` first, which resolves the secrets | `run` resolves and masks, then makes every start refusal (artifact, `settings_revision`, required settings), and only then resolves the secrets and installs logging. `prepare` keeps the spec's whole order for its callers and tests. A secret that cannot be resolved is the stderr line `refused: SEC-R18 …`, exit 1 | A refused start should open no secret. The first installed run hit the missing synthetic key before the `settings_revision` refusal |
| `COMPOSITIONS`: observation's command is `at-observer` | Observation has no command until step 5 declares `at-observer`; its row checks the unit only (or `native_observation`) | Otherwise every first-release check reports a command this release does not declare. The text's own composition cases expect `[]` with the unit present |
| `at --check` over a missing profile prints one `problem:` line | It also prints `CFG-R06 artifact_mismatch: bundle.json …`, and the test asserts that the `AT_PROFILE` line is present | An unreadable profile reads as `production` (step 1), so `at` reports the artifact check too. `at` still never refuses |
| The latch cases' budget text `"3600"` | `"3600.00"` with no account layer: the policy's `RiskPolicy("3600.00")` text, as before. `"3000"` with the account's `3000.0` | `budget` returns the policy's own decimal; only the account's float becomes `Decimal("3000")` |
| The installed wheel built with `--no-build-isolation` | `pip wheel <copy> --no-deps` with build isolation, over a copy of `pyproject.toml` and `src/` under the test's temporary directory | `.venv-slice01` has no setuptools. Building from the checkout left a `build/` directory there; the copy writes nothing into the checkout |
| The Files table | Also `tests/conftest.py`: `prod_profile`, `write_profile`, `SYN_VIEW(S)`, `SYN_ACCOUNT`, shared by the capabilities and installed tests | One production profile for both |
| `_compose_kernel`'s three new keywords | A fourth, `store_handshake`, passed to `StoreMarket`; `compose_production` also takes `secrets=` (the process's resolved scope; resolved there when absent); `api.serve` also takes `section=` (the profile's `operator` section) | Wiring the text describes; no new behaviour |
| The kernel test asserts the composition's port | It also asserts the alert `handshake_mismatch market_store absent`: no market process wrote the store in that test | The kernel reports the absent handshake, as the text says |

**Left in OA_NEW, untracked:** a `build/` directory from the first installed-artifact runs, before the fixture built from a copy. It is not in the commit. Deleting it is the owner's call.

**Carried, unchanged:** every item under "Open, not built in this step" and the step 3, step 3a, step 4 and step 7 hand-offs above.

## Step 3 — the kernel host

<a id="step-3--the-kernel-host-outline"></a>The authorities are the runtime spec's [kernel host](../../design/runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy), [failure modes](../../design/runtime-isolation-observability-deployment.md#failure-modes-and-crash-points) and PRF-OPS-01, the slice's Fork calls 2–4, the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) (the fork rule), [step 1 as built](#step-1-as-built), [step 2 as built](#step-2-as-built), and legacy's live loop at 445eb116 (`scripts/run_framework_live.py`, `src/runtime/session_state.py`, `src/core/framework/execution/health.py`, `src/runtime/tier1_authority/service.py`, `deploy/systemd/at-strategy.service`, `deploy/systemd/at-tier1-authority.service`). Step 3 is TASK-S11-03's host part: PRF-OPS-01 and PRF-PRT-06's "kernel frozen" half. It builds on OA_NEW `d9536ce` or later; every OA_NEW citation below is at `d9536ce`. It also builds the two inputs step 2 left as arguments, the ledger's `SessionStatsPort` and the bound policies, so `at-kernel` composes with no test fixture. It closes SLICE-05's host-loop exclusion, SLICE-07's "the host drives the observation loop", and what SLICE-06 step 5 left of the L2/L4/L7 gap (code that raises outside `drain` and the position check). **This step drives admission, protection (stops, trails, square-off) and the latch:** every timing, order, failure and stop choice below is a **Fork call** that keeps legacy's live behaviour, and no score, threshold or gate is added or set.

**In plain words.** This step builds the kernel's heartbeat loop: the part that makes the kernel actually run, all day, by itself. Every 20 seconds, lined up so a pass lands 7 seconds after each minute's bar closes (:07, :27, :47), it settles what came back from the broker, checks the loss limit, moves stops and trails, runs the square-off, and sends what is waiting. It also runs a shorter pass at once when something arrives (a broker reply, a fresh broker book, a request from the strategy or the owner, or a deadline): that pass settles, checks the loss limit and sends, but moves no stop or trail and takes no tick exit, so stops, trails and exits are judged only on today's 20-second schedule. After every pass it writes a small "I am alive" file that the supervisor (step 4) reads. When one part of a pass fails with an unexpected error, the kernel notes it, raises an alert and carries on with the next pass, as today's loop does; it stops only when its ledger or its send lease can no longer be trusted. When it is told to stop, it cancels every entry not yet sent, takes no new order, waits for the order already at the broker to answer and be written down, hands back its send lease and exits. After a crash, the next start waits until the crashed process's send lease runs out before taking over, so two senders never overlap, then resumes by itself as today's loop did, cancelling any entry the crashed process had not sent. A missing or broken market feed or strategy connection never stops the loop: stops, trails and the square-off keep running on what the kernel has. The step also teaches the kernel to count today's trades, losses, open positions and P&L from its own ledger the way today's system counts them, so the entry limits work without test stand-ins, and to read the strategy's bound policy from the settings. Where this differs from today, the difference is listed under Deviations.

### Decisions

#### What legacy does here

* **The loop.** The live session's `main` loops forever (`scripts/run_framework_live.py:7778`): each pass reads the broker once, settles, latches, supervises structures, runs the session-close exit, walks new bars and plans entries, trails, drains workers, writes a heartbeat (`:7915-8250`), stops at the configured close (`:8282-8286`), and sleeps `seconds_to_next_pass(args.poll, time.time())` (`:8287`). The unit passes `--poll 20` (`deploy/systemd/at-strategy.service:51`; default `:7472`). `seconds_to_next_pass` (`:3431-3450`) phase-locks to `BAR_CLOSE_LAG_SECS`, the same `market.bar_confirm_lag_secs` setting (`:3418-3428`): `poll = max(1.0, poll)`, `since = (now - lag) mod 60`, `to_close = 60 - since`, `to_grid = poll - (since mod poll)`, result `max(0.05, min(to_close, to_grid))`. Sends were synchronous inside the pass, so a send's result was handled in the pass that made it.
* **Failure containment.** Every stage runs in its own `try`; a failure is recorded by `_record_pass_fault` (`:7433-7455`), printed and emitted, and the pass carries on. A faulted stage blocks new entries for that pass only when it says so (`:7457-7462`); exits, settlement, structure supervision and the trail never read the fault (`:7782-7790`). The trail is contained per owner (`:8176-8192`, `blocks_entries=False`) and per position (`:5481`, `:5497`); a dead tick feed is a non-blocking fault (`:8014-8017`). An exception outside every `try` leaves `main` with a traceback; the unit restarts a failed process after 60 s, at most 3 starts in 900 s (`deploy/systemd/at-strategy.service:23-26`, `:55-56`).
* **Heartbeat.** One beat per pass, never failing the pass (`:8241-8250`): `health.beat` replaces `<run>/health/<strategy>.json` atomically with `{strategy, at, pid, bar_index, faults}` and swallows `OSError` (`src/core/framework/execution/health.py:37-51`). A stale beat under a live pid is "STUCK" (`:61-104`, 180 s default `:30`).
* **Stop.** The session installs no signal handler (no `signal` use in `scripts/run_framework_live.py`), so `SIGTERM` ends it mid-pass. The sender, the Tier-1 authority, stops cleanly: `SIGTERM` and `SIGINT` set an event (`src/runtime/tier1_authority/service.py:852-860`), the socket server stops accepting and waits for every accepted request, including one whose broker call is in flight, to finish and be recorded (`:862-873`; `block_on_close`, `:182-185`), bounded only by systemd's 60 s stop timeout (`deploy/systemd/at-tier1-authority.service:35-37`).
* **Entry statistics.** `session_state.snapshot` (`src/runtime/session_state.py:176-252`) derives the gates' `Session` per owner and day from the order registry and a fresh positions book: counts of filled opening orders (`:63-80`, `:105-107`), orders in flight (`:86`, the state set `src/core/framework/execution/states.py:67`), the loss streak (`:88-103`), the last fill time (`:81-85`, `:235-238`), the open downside to each leg's stop (`:114-147`), the book's P&L (`:206-212`), a per-process P&L history over the drawdown window (`:19`, `:227-234`) and the first error as `unavailable` (`:183-225`).

#### The host (`kernel/host.py`, T-70)

* **`KernelHost(comp, *, stop: threading.Event, pass_interval_secs: int, lag_secs: float, heartbeat: Path | None, identity: Mapping[str, str | None], channel_alive: Callable[[], bool] | None = None, exit=os._exit)`**, with `submit(fn) -> concurrent.futures.Future` (any thread) and `serve() -> int` (the writer thread, which is the process's main thread). `identity` is `{"settings_revision", "bundle_digest"}`. `exit` is the process exit for the three stopping paths below (tests pass a recorder). `serve(comp, **kw) = KernelHost(comp, **kw).serve()` is kept as the spec's name. Constants: `EXIT_CRASH = 70`, `EXIT_LEDGER = 71`, `EXIT_LEASE_LOST = 72`.
* **`seconds_to_next_pass(period, now, lag) -> float`,** a pure function: legacy's body (`scripts/run_framework_live.py:3443-3450`) line for line, with `lag` required (no import-time default). `now` is POSIX seconds from `comp.clock.now().utc_iso`. The host passes `settings.host_pass_interval_secs` and `float(Decimal(settings.bar_confirm_lag_secs))`.
* **`submit(fn)`** puts `(fn, future)` on a `queue.SimpleQueue` and calls `comp.coordinator.wake()`. Nothing else in the host takes a lock.
* **Start of `serve`:** `comp.coordinator.refuse_admitted_entries("earlier_epoch")` (below, Fork call K); `comp.observation_loop.start()` when the loop is composed; `next_grid = now` (legacy's first pass ran at start); then the iterations.
* **Each iteration, in this order** (Fork call G):
  1. `comp.recovery.tick()`;
  2. **hand-offs:** take `n = queue.qsize()` at this moment and run exactly those `n`, in order; each `fn()`'s value or exception goes to its future (`set_result`, `set_exception`). Later submissions wait for the next iteration;
  3. **the pass:** `scheduled = (the last wait timed out) or now >= next_grid`, with `now` POSIX seconds from `comp.clock.now()`; `comp.coordinator.run_pass(scheduled=scheduled)`; after a scheduled pass, `next_grid = now + seconds_to_next_pass(period, now, lag)` (a wake pass leaves `next_grid` alone);
  4. `pass_seq += 1`; the heartbeat (below), which records `scheduled`;
  5. **channel check:** when `channel_alive` is given and returns `False`, the alert `channel_down` (once per process);
  6. **wait,** unless `stop` is set or the hand-off queue is not empty (then the next iteration starts at once): `timeout = max(0.0, next_grid - now)`; then `nw = comp.coordinator.next_wake()`, and when `nw` is not `None`, `timeout = min(timeout, max(0.0, (nw.monotonic_ns - comp.clock.elapsed().monotonic_ns) / 1e9))`. A non-stopping exception from `next_wake` is contained as stage `wait` (below) and the grid timeout stands. Then `timed_out = not comp.coordinator.wait_woken(timeout)`. A return, an observation arrival (both already call `wake`), a hand-off and the stop all end the wait.
  
  The loop ends when `stop` is set at the end of step 6; a pass in progress always completes.
* **`Coordinator.run_pass(scheduled: bool = True)`** (`kernel/coordinator.py`). With `scheduled=False` it does everything a pass does (returns, observation drain, kill inputs, the latch, the recovery hold, the position check, the deadline sweep and the claim) except `self.protection.run_once()`: stops, trails, tick exits and the square-off are judged only on the grid, as legacy judged them only on its scheduled passes (Fork call G). The default keeps every existing caller and test unchanged.
* **`Coordinator.refuse_admitted_entries(dependency: str) -> tuple[Outcome, ...]`** (`kernel/coordinator.py`). On the writer thread: every command with verb `entry` in `ADMITTED` (with `"earlier_epoch"`, only those whose admitting event's `epoch_id` is not `writer.epoch.value`) is refused by `_refuse_dispatch(key, Refusal("DSP-R05", "stopping", key, "DISPATCH_CLAIMED"), dependency, strict=True)`. `DSP-R05` (`stopping`) is a new dispatch code, reported to the dispatch spec. Cancels, modifies and closes, including every protective command, are never refused here.
* **Signals.** `bootstrap` (below) installs `SIGTERM` and `SIGINT` handlers that only `stop.set()` and, once the kernel is composed, `comp.coordinator.wake()`, as the authority's (`service.py:855-856`). `KernelHost` installs none, so tests drive `stop` directly.
* **The heartbeat** (REQ-OPS-009 diagnostics; nothing in the kernel reads it, and it authorizes nothing). After each pass, and once more on every exit path, `heartbeat` (when not `None`) is replaced atomically: written to `.<name>.tmp` beside it, `chmod 0640`, `os.replace`. Content, canonical JSON: `{"format": "at-heartbeat/1", "state": "running" | "stopping" | "stopped" | "failed", "pid", "epoch_id", "stage": comp.recovery.stage, "settings_revision", "bundle_digest", "pass_seq", "scheduled", "pass_ended_utc": clock.now().utc_iso, "pass_ms": the pass's duration from clock.elapsed(), "ledger_head": [sequence, event_hash] of the last event, "in_flight": [asdict(i) for i in coordinator.in_flight()], "observation_health": {canonical account wire: asdict(loop.health(account)) with last_as_of as its utc_iso or null} over writer.observed_accounts(), "unrunnable_legs": protection.unrunnable_legs(writer) as lists, "faults": count this process, "last_fault": {"stage", "type", "pass_seq"} or null, "exit_code": null or the code}`. An `OSError` writing it logs one WARNING per run of failures and never fails the pass (legacy `health.py:42-50`). Its path is `<paths.run>/health/kernel.json` (legacy's `health/` directory); unbound `paths.run` passes `None` and logs one WARNING.
* **Exceptions (Fork call I).** Three sets, judged by `kernel.protection._stops_the_kernel`, extended:
  * **The ledger set:** `WriterLost`, `CommitFailed`, `DesireRefused`, any `apsw.Error`. Exit 70's crash path with its own code: heartbeat `failed` with `exit_code` 71, cancel every queued hand-off's future, `comp.recovery.held.clear()`, then `comp.recovery.shutdown(clean=False)` (so no lease is released; it expires), `exit(71)`. The restart then waits for the lease and advances routinely, as legacy's loop resumed by itself after any failure (`deploy/systemd/at-strategy.service:52-56`); releasing `abnormal`, as the sessions spec says, would have left the restart waiting for a human (Fork call J);
  * **`LeaseLost`** (another holder has the lease): heartbeat `failed`, cancel the queue, `comp.recovery.held.clear()`, then `comp.recovery.shutdown(clean=False)` (so no lease is touched; the writer closes), `exit(72)`;
  * **`DispatchStateLost`** (new, below): heartbeat `failed`, cancel the queue, `comp.recovery.held.clear()`, `shutdown(clean=False)`, `exit(70)`: the crash path, leases unreleased, so the attempt `IN_FLIGHT` is recovered after the restart as built;
  * **anything else** from `tick`, a hand-off or `run_pass` is **contained**: logged at ERROR with its traceback (through the scrubbing filter step 2 installed), `faults += 1`, `last_fault` set, the alert `pass_fault <stage> <TypeName>` (stage `tick`, `handoff`, `pass` or `wait`) once per process, and the loop goes on to step 4 (heartbeat) and the next iteration. A hand-off's exception also goes to its future, so the channel replies `ambiguous` as built (`adapters/unix_channel.py:460-466`).
  
  An exception inside `shutdown` on these paths is logged and ignored. `exit` is `os._exit` so no lingering channel thread can hold the process open after a stopping exception.
* **`DispatchStateLost(Exception)`** (`kernel/coordinator.py`, added to `kernel/protection.py`'s `_STOPS`). Containing an exception is safe only while the coordinator's memory agrees with the ledger. Two places break that, and both now raise `DispatchStateLost` from the original: (1) a non-stopping exception from `_finish` while committing a popped return (the return is gone and its worker would stay `busy` forever, which would stop that account's protective sends); (2) a non-stopping exception after `_claim` committed and before `worker.inbox.put` returned (an attempt claimed that no worker is sending). Stopping exceptions pass through unchanged.
* **The stop sequence (Fork call K),** when `stop` is set:
  1. heartbeat `stopping`; no further `tick` or `run_pass`, so nothing new is claimed and no lease is renewed; `comp.coordinator.refuse_admitted_entries("stopping")`;
  2. when a channel server is running, `server.shutdown()` runs on a helper thread; while it runs, the writer thread keeps running hand-offs only (step 2 of an iteration, with a 0.2 s wait on the queue between rounds), so every request the channel already accepted is answered, as the authority finished accepted requests; when the helper thread ends, every hand-off still queued is cancelled (`future.cancel()`), which the channel answers `ambiguous`, and `refuse_admitted_entries("stopping")` runs again, so an entry those requests admitted is refused too;
  3. `comp.observation_loop.stop()`;
  4. `outcomes, left = comp.coordinator.drain_returns(None)`: no bound of its own; systemd's stop timeout (step 7 renders legacy's 60 s, `deploy/systemd/at-tier1-authority.service:37`) is the bound, as legacy's. A call still in flight when systemd kills the process stays `IN_FLIGHT` (F-H3);
  5. when `left` is empty: `comp.recovery.shutdown(clean=True)` (leases released `clean`), heartbeat `stopped`, `serve` returns 0. When `left` is not empty (only a test passes a bound), the crash path: heartbeat `failed`, `held.clear()`, `shutdown(clean=False)`, `exit(70)`.
* **`Coordinator.drain_returns(deadline_s: float | None) -> tuple[tuple[Outcome, ...], tuple[InFlight, ...]]`** (`kernel/coordinator.py`, a dispatch-spec module change). It loops: clear `_wake`; commit every queued return exactly as `run_pass` does (both now call one private `_commit_returns()`, which holds the `DispatchStateLost` wrapping); when no worker is busy, return `(outcomes, ())`; when `deadline_s` is given and has passed (measured with `clock.elapsed()`), return `(outcomes, self.in_flight())`; else `_wake.wait(remaining or None)`. It never drains observations, runs safety or protection, sweeps deadlines or claims.
* **Before `OPERATING`** the host loops the same way: `run_pass` already commits returns and drains observations only (`kernel/coordinator.py:455-456`), so no protection or claim runs until recovery advances; a human advance arrives as a hand-off.

#### `bootstrap.run` for the kernel

Step 2's exit 78 for the kernel is replaced; every earlier start step is unchanged. After secrets and logging:

1. `leases = lease_store_for(settings.recovery_lease_store)`; in this release it raises `RefusingParameterUnbound` (`no lease-store adapter in this release`), printed, exit 1, until step 8.
2. `stop = threading.Event()`; the `SIGTERM` and `SIGINT` handlers above.
3. **`wait_for_lease(ledger_path, leases, *, lease_secs, stop) -> float`** (Fork call J), returning the seconds waited. No ledger file: 0. Else, read-only (`LedgerReader.open`): this ledger's id (the first event's `event_id`), the last `EPOCH_ACTIVATED`'s `epoch_id`, and every distinct `standing_binding.account`; then the reader closes. For each account in sorted order, `lease = leases.read(account)`; it needs a wait when `lease` is not `None`, `lease.released is None`, `lease.holder_ledger` is this ledger, `lease.holder_epoch` is that last epoch, and `lease.expires_at > leases.now()`. The wait is the largest `expires_at - now` in seconds, capped at `lease_secs` when it is bound, logged at INFO, and taken as `stop.wait(seconds)`. There is no re-read: recovery's check 6 judges what it then finds. A lease held by another ledger or epoch, released, or expired needs no wait (recovery declines and a human acts, as built). Any exception from the store is logged at WARNING and means no wait (recovery reads the store again and fails the start as built if it still cannot). When `stop` is set after the wait, exit 0 without composing.
4. `comp = compose_production(eff, manifest, participant="kernel", clock=LiveClock(), environ=environ, leases=leases, secrets=secrets)`, with `policies` and `stats` left `None` (below).
5. **The channel (Fork call H).** When `paths.run` is bound and the platform has `AF_UNIX` and `SO_PEERCRED`: `ChannelCore(comp, peers=parse_peers(eff.section("channel")), submit=host.submit, main_pid=systemd_main_pid, identity_of=process_identity, projections=dict(eff.projections))` and `KernelChannelServer(core, <paths.run>/kernel/channel.sock, socket_gid=grp.getgrnam("at-channel").gr_gid)`, `serve_in_thread()`; `channel_alive` is that thread's `is_alive`. Any failure to build or start it (`paths.run` unbound, the platform, `ChannelError`, an unknown group) is the alert `channel_down <reason>` and the kernel serves without a channel. Step 7 renders the operator's and strategy host's socket path to the same file.
6. `host = KernelHost(comp, stop=stop, pass_interval_secs=settings.host_pass_interval_secs, lag_secs=…, heartbeat=…, identity={"settings_revision": eff.revision, "bundle_digest": digest_}, channel_alive=…)`; `return host.serve()`.

`required_fields("kernel", …)` gains `host.pass_interval_secs` and `market.bar_confirm_lag_secs` for every profile kind: the schedule cannot be computed without them, and `host.pass_interval_secs` ships 20 (step 1), so only a profile that unbinds it refuses.

#### The ledger's session statistics (`kernel/admission.py`)

* **`LedgerSessionStats(writer, *, market, observations, policy, account_limits, max_observation_age_secs, clock)`**, the `SessionStatsPort` (`kernel/ports.py:109-111`), and the sentinel `LEDGER_STATS`. `_compose_kernel` replaces `admission.stats == LEDGER_STATS` with it right after `policy` is built and before `RecordedSetup` wraps it (`bootstrap.py:277-280`), as it replaces `LEDGER_POSITIONS`. `compose_production` passes `LEDGER_STATS` when `stats` is `None`; step 2's `ValueError` for `None` goes.
* **Scope of `stats(intent, now)`.** `S` = `intent.strategy`; the session row of `intent.session_id` gives account `A` and trading date `D`; no row gives every count 0 and `unavailable` `session_unknown`. A command is **on D** when the `event_time` of its first event (`command_identity.first_sequence`) falls on `D` in IST (`market.sources.IST`), as legacy's registry is read per day (`session_state.py:52`). An **opening fill** is a `FILL` of an entry command whose `leg_role` is not `stop` or `target`; an **exit fill** of position P is any other `FILL` with `position_id` P (a basket's protective leg or a close, `kernel/ledger/projections.py:473-494`). **Active** command states are `ADMITTED`, `IN_FLIGHT`, `WORKING`, `UNCERTAIN` (legacy's in-flight set: formed, sent, ack, open, partial, unknown, ambiguous). **Limits** are `effective_limits(account_limits or NO_ACCOUNT_LIMITS, bound.planner.limits)` for `bound = policy.bound_policy(intent.session_id)`, or the account layer alone when there is no bound planner; **P&L caps** are set when any of `max_daily_loss_pct`, `max_daily_loss_amount`, `max_daily_profit_amount`, `drawdown_rate_enabled` is set (`session_state.py:206-207`).
* **Each field**, legacy's derivation ported:

  | Field | Value |
  |---|---|
  | `trade_count` | Entry commands of S on A and D with at least one opening fill (`:63-68`, `:105`) |
  | `desk_trade_count` | The same over every strategy on A (`:69-73`) |
  | `desk_open_structures` | Entry commands on A and D, any strategy, that are active or have an opening-leg position with `owned_quantity > 0` (`:74-80`) |
  | `setup_fresh` | `True` (legacy's default); `RecordedSetup` replaces it, as built |
  | `open_stop_risk` | Over every position on A whose entry is on D, opening leg, `owned_quantity > 0`: `max(Decimal(0), mark - stop) × owned_quantity`, summed, then quantized to `Decimal("0.01")` with `ROUND_HALF_EVEN` (so no risk reads `"0.00"`); stop = `protection_state.desired_level`, else the admitted plan's protective `stop` level (legacy's `trail_stop`, else `stop`); mark = the `ltp` of the latest positions observation's row for the instrument, legacy's `ltp`/`last_price` (`:118-122`). A missing or non-finite mark or stop sets legacy's error `open <instrument> has no fresh mark and recorded protective stop` and the value `"0.00"` (`:136-142`) |
  | `consecutive_losses` | Only when the limits' `max_consecutive_losses > 0`, else 0: S's positions on A and D in state `closed`, latest `closed_sequence` first; each is a loss when the quantity-weighted exit price is below the quantity-weighted opening price; count until the first non-loss (`:88-103`) |
  | `entry_in_flight` | Commands of S on A and D, any verb, that are active (`:86`, every owned row) |
  | `seconds_since_last_entry` | `max(0, now - t)` for `t` the latest **completing fill** of any command of S on A and D, else `None`. A completing fill is the `FILL` at which the cumulative `FILL` quantity of one `(command_key, leg_role)` first reaches that order's quantity (an opening or protective leg: its quantity in the admitted `plan_ref`; a close: the request's quantity), as legacy timed only rows that reached `FILLED` (`:81-85`, `:235-238`) |
  | `daily_pnl` | Legacy's sum (`:212`): over every row of the latest positions observation of A, `Decimal(row.day_pnl)`, a row without the field counting 0, as `_number`'s default (`:22-31`); `"0"` with no observation. The latch keeps its own rule (`kernel/safety.py:160-174`), unchanged |
  | `capital` | The account's observed available cash, as `_reviewed_capital` reads the funds' available cash (`:39-47`): `available` of the first funds item of the latest observation of A; `"0"` with no observation or no item |
  | `window_pnl_change`, `pnl_history_len` | Legacy's per-process history keyed `(S, D)`: when P&L caps are set and no error, append `(now, daily_pnl)`, then keep the samples at most `max(1, drawdown_rate_window_mins) × 60` s old; change = last − first as `Decimal` (two-decimal inputs give a two-decimal result) when at least 2, else `"0"` (`:227-234`) |
  | `now_hm` | `now` in IST as `HH:MM` |
  | `unavailable` | The first of, in legacy's order (`:183-225`): the streak error (none can arise from the ledger); with P&L caps: no observation `fresh broker P&L was not supplied`, an observation older than `max_observation_age_secs` (`admission.observation_age`) `fresh broker P&L unavailable: stale`, the stop-risk error; with `max_daily_loss_pct > 0` and capital ≤ 0 `reviewed capital is absent or non-positive`; else `None` |

* **`ObservedPosition` gains `ltp: str | None = None`** (`contracts/evidence.py`, keyword-only after `day_pnl`): the OpenAlgo adapter's position row sets it from the row's `ltp` through `_positive_money` (`adapters/openalgo.py:802-812`), `None` when absent or not positive; the simulated broker sets it to its last price for the instrument (`adapters/simulated_broker.py:206-213`). Nothing else reads it. An execution-spec contract change, reported to it.

#### The bound policies (`contracts/decisions.py`, `settings/schema.py`)

* **A new field `policies`,** kind `section`, scope kernel, no environment name, shipping absent like `channel` and `operator`: `{policy_binding_id: <policy>}`. It is part of the profile, so it enters the settings revision the release binds (step 2's Fork call E): a policy changed outside a release refuses the kernel's start, as legacy's authority refused an unbound config digest.
* **`bound_policies_from(section) -> tuple[dict[str, BoundPolicy], list[str]]`.** Each entry is a mapping whose keys are exactly `BoundPolicy`'s fields, the optional ones (`planner`, `protection`, `risk`) omissible; its `policy_binding_id` must equal its key; `protection` goes through `protection_policy_from` and `risk` through `risk_policy_from` as built; `planner` through `planner_policy_from`, which builds `PlannerPolicy` and its `StrikePolicy`, `SizingPolicy`, `StopPolicy`, `SessionLimits` and `structures` by the same rule (exact field names, defaulted fields omissible, lists to tuples recursively, an `int` field refuses `bool` and `float`, a `float` field takes an `int` as its float, `bool` and `str` fields take only their type), then each dataclass's own checks. Nothing is computed or defaulted beyond the dataclasses' own defaults. A failing entry is left out with the line `policies.<id>: <reason>`.
* **`compose_production`** with `policies=None` parses `eff.section("policies")`; an absent section is `{}` with the alert `policies_unbound`; each line is the alert `policy_unreadable <id>`. A session bound to a missing policy takes no entry (`planner_policy_unbound`, as built) and its positions keep the protection policy recorded with them (`kernel/protection.py:865-877`): unreadable policies stop entries only, as Fork call A's unreadable limits. The kernel's `--check` prints each line as `problem:` and `policies_unbound` when absent.

#### Fork calls in this step

* **G. Pass timing and order: legacy's.** Scheduled passes every `host.pass_interval_secs` (20, Fork call B), phase-locked to `market.bar_confirm_lag_secs` by legacy's function unchanged. Protection (stops, trails, tick exits, square-off) runs only on scheduled passes, as legacy judged them only there; wake passes, which dispatch needs, commit returns, drain observations, run the latch and claim, as legacy handled a send's result in the pass that made it. Inside a scheduled pass, `run_pass`'s built order (returns, observation drain, kill inputs, latch, recovery hold, position check, protection with its trail and square-off, deadline sweep, claim), which keeps legacy's settle → latch → session-close exit → trail order (`scripts/run_framework_live.py:7929-8199`); hand-offs before the pass, so an entry the strategy hands over is claimed in the same pass, as legacy planned and sent in one pass. The kernel does not stop at the market close: it is the authority's successor (Fork call 3).
* **H. An unhealthy market feed, broker book or channel never stops or delays a pass.** No pass is skipped or postponed for market or broker health; what each stage does without data is as built (protection holds new levels on an unreadable store and escalates once, and the square-off still runs, `kernel/protection.py:783-796`, `:1249-1278`; actions wait on a stale book), as legacy's loop ran every stage with dead ticks (`:8014-8017`). A channel that cannot start or dies is an alert, and passes go on; only requests that come through it stop. Here protection keeps running with the channel down, where legacy's loop could send nothing while the authority's socket was down: the loop and the sender are one process now, and a protective send is never gated.
* **I. Unexpected exceptions are contained, as legacy contained each stage.** The kernel exits only when its ledger, its lease or its dispatch memory can no longer be trusted (the three sets above); everything else is recorded, alerted and retried on the next pass, so a fault in one position's trail never stops another's stop or the square-off.
* **J. Crash and restart: legacy's restart of the loop that trailed.** Every stopping exception, the ledger set included, exits non-zero without releasing a lease; systemd restarts it after 60 s, at most 3 in 900 s (rendered in step 7 from `deploy/systemd/at-strategy.service:23-26`, `:55-56`); the start waits for the crashed epoch's lease (above), then the routine advance (Q-009), as legacy resumed by itself. The gap stays the runtime spec's: no trail move or tick exit for 60 s plus the rest of the lease, with the broker-held stop in place.
* **K. Stop and drain: legacy's.** Entries not yet sent are refused (`DSP-R05`), as legacy's session, ended by `SIGTERM`, sent nothing more; a start after a crash refuses the earlier epochs' unsent entries the same way. Then the authority's stop: stop accepting, answer what was accepted, wait for the call at the broker to be recorded, release, exit 0, bounded by systemd's 60 s. Protective and close commands are never refused.
* **L. The entry statistics keep legacy's derivation:** the P&L is legacy's sum with a missing field as 0, the mark is the broker row's last price, the capital is the observed available cash, the cooldown starts at the fill that completes an order, and the P&L history stays per process. These feed entry gates only.

#### Deviations in this step

* **From the runtime spec's exception policy** ("an unexpected exception exits 70"): Fork call I contains it, and only the three stopping sets exit; PRF-OPS-01's "an injected exception exits 70" becomes "a non-stopping exception is contained and the next pass runs; a `DispatchStateLost` exits 70 without releasing the leases". Reported to the runtime spec.
* **From the sessions spec's `abnormal` release** on `CommitFailed` and the other ledger exits: no lease is released, so the restart advances routinely (Fork call J). Reported to the sessions spec.
* **From the runtime spec's passes "on every wake"** running protection: wake passes skip it (Fork call G). REQ-OPS-009's "at least as often as legacy" still holds for protection. Reported to the runtime spec.
* **The statistics:** capital is the latest observed available cash, where legacy read the funds attested at the session's start; the attestation check (`session_state.py:189-204`) has no counterpart (the session binding replaces it, SLICE-04's moved couplings). SLICE-04's ledger-kept P&L history correction is listed, not made.
* **Names:** `KernelHost` with `serve` kept; no `telemetry` argument until step 6; the heartbeat adds `format`, `state`, `scheduled`, `faults`, `last_fault` and `exit_code`, and lives in `health/`; the new dispatch code `DSP-R05`.

#### Carried to later steps

* **Step 4:** reads `health/kernel.json` and the identity record; `kernel_stalled`, `dispatch_overdue`, `pass_fault` and `channel_down` in its verdicts.
* **Step 6:** `telemetry=` and the pass record.
* **Step 7:** the kernel's unit (`Restart=on-failure`, `RestartSec=60`, `StartLimitBurst=3` over 900 s, `TimeoutStopSec=60`, started at boot), the socket path in the operator and strategy configurations, and `config/live.example.yaml`'s `policies` carrying legacy's bound values.
* **Step 8:** the lease-store adapter, which turns step 1 of `bootstrap.run` into a real wait.

### Tests

Every value is synthetic. `BASE = 1_800_000_000.0` (POSIX seconds, `BASE mod 60 == 0`). `RecordedClock`, `FakeLeaseStore`, `build` and `bound()` are `tests/conftest.py`'s. `stub(...)` is a composition stand-in whose coordinator's `wait_woken(t)` advances the recorded clock by `t` and returns, and whose `run_pass` records the clock's second within the minute. `FileLeaseStore` (new in `tests/conftest.py`) is `FakeLeaseStore` kept in a JSON file with wall-clock time, so two processes share it. `kernel_child(...)` (new in `tests/conftest.py`) starts `python -I -c` with code that composes `compose_simulation` over a ledger and a `FileLeaseStore` under `tmp_path`, runs `wait_for_lease`, then `KernelHost(...).serve()` with the bootstrap's signal handlers; its receipt binds `recovery.lease_secs` 3 and `lease_renew_secs` 1.

**`tests/integration/test_kernel_host.py` (T-75), PRF-OPS-01:**

| Group | Cases |
|---|---|
| Legacy's function (worked by hand from `run_framework_live.py:3443-3450`) | Period 20, lag 7: `BASE` → 7.0; `BASE+7` → 20.0; `BASE+27` → 20.0; `BASE+47` → 20.0; `BASE+50` → 17.0; `BASE+6.99` → 0.05. Period 25, lag 7: `BASE+7` → 25.0; `BASE+32` → 25.0; `BASE+57` → 10.0. Period 1, lag 7: `BASE+7.5` → 0.5. Period 20, lag 0: `BASE+10` → 10.0 |
| Schedule | `stub` from `BASE+0.5`, period 20, lag 7, nothing waking, 7 passes, each `scheduled=True`: the first at `+0.5` (start), then seconds 7, 27, 47, 7, 27, 47. Period 25: 7, 32, 57, 7, 32 (a pass at every :07) |
| One pass per wake | After the :07 pass, `submit(f)` at :12 → a pass at :12 with `scheduled=False`, then the next at :27 with `scheduled=True`. `next_wake()` returning `Elapsed` 3 s ahead at :07 → a wake pass at :10, then :27. A worker return and an observation `wake()` at :15 → a wake pass at :15 each. `next_wake` raising `ValueError` → alert `pass_fault wait ValueError`, the next pass at :27 |
| Wake passes skip protection (Fork call G) | Over `build`, `run_pass(scheduled=False)` with the protection loop's `run_once` patched to count: 0 calls, while a queued return is committed and an admitted command claimed; `run_pass()` → 1 call |
| Tick exit only on the grid (Fork call G) | Over `build` with an open position whose tick-exit level is 90 and the host on a recorded clock: ticks 95 at :07 (scheduled pass), 89.5 at :10 with an observation wake (wake pass), 92 at :27 (scheduled pass) → no `EXIT_STARTED` through :27. Control: the same with the 89.5 tick still the latest at :27 → `EXIT_STARTED` at :27 |
| Hand-offs | Three `fn`s submitted from another thread each record `threading.get_ident()` and their index: all equal the serving thread's id, order 1, 2, 3; each future holds its value. A hand-off submitted by `run_pass` itself (after step 2, before the wait) runs in the next iteration with no clock advance. Over `build`: an entry submitted as a hand-off is claimed in the same pass |
| Heartbeat | After each pass the file parses, `format` `at-heartbeat/1`, `state` `running`, `pass_seq` 1, 2, 3, `stage` `OPERATING`, `in_flight` lists a blocked send with its command key; with the heartbeat's parent being a file, three passes run and one WARNING is logged |
| Containment (Fork call I) | `run_pass` raising `ValueError` on passes 2 and 4: passes 3 and 5 run on schedule, `comp.recovery.alerts` holds `pass_fault pass ValueError` once, the heartbeat shows `faults` 2 and `last_fault.type` `ValueError`, `exit` never called. A hand-off raising `KeyError`: its future holds `KeyError`, alert `pass_fault handoff KeyError`, the loop goes on. `tick` raising `RuntimeError`: alert `pass_fault tick RuntimeError`, `run_pass` still runs that iteration |
| Stopping paths | Over `build` with `FakeLeaseStore`, `exit` a recorder: `CommitFailed` from `run_pass` → `exit(71)`, the lease unreleased (`released is None`) and unexpired, heartbeat `failed` with `exit_code` 71; `LeaseLost` → `exit(72)`, the lease unchanged; `_finish` patched to raise `ValueError` while committing a return → `DispatchStateLost`, `exit(70)`, the lease unreleased and unexpired, the attempt `IN_FLIGHT` in the ledger. In each, queued futures are cancelled |
| Stop (Fork call K) | Over `build`, a broker whose `send` blocks on an event: one entry claimed, a second entry and a close admitted. `stop.set()`; the send released 0.5 s later → `serve` returns 0; the first command's outcome is committed after the stop; no `DISPATCH_CLAIMED` has a sequence after the stop was set; the second entry is `REFUSED` by `DISPATCH_REFUSED` with code `DSP-R05`, message `stopping`, dependency `stopping`; the close is still `ADMITTED`; the lease reads `released == "clean"`; heartbeat `stopped`. A start whose ledger holds an `ADMITTED` entry from an earlier epoch and one from its own → only the earlier one refused, dependency `earlier_epoch`. `drain_returns(0.1)` with the send still blocked → `((), (InFlight(...),))`, nothing claimed; the host then takes the crash path, `exit(70)` |
| Not before `OPERATING` | A composition whose routine advance is declined (receipt `routine_advance` unbound): ten passes, the protection loop's `run_once` (patched to count) is never called; after a human `advance` handed off, the next scheduled pass calls it once |
| Unhealthy inputs (Fork call H) | `channel_alive` returning `False`: alert `channel_down` once over five passes, every pass on schedule. A market store path that does not exist: passes still at 7, 27, 47 |
| Lease wait (Fork call J), `FakeLeaseStore` at time T | Holder this ledger and last epoch, unreleased, expires T+45, `lease_secs` 90 → 45.0; expires T+200 → 90.0; `lease_secs` unbound → 200.0; released `clean` → 0.0; another ledger → 0.0; an older epoch → 0.0; expired T−1 → 0.0; `read` raising → 0.0 and one WARNING; no ledger file → 0.0; `stop` set during the wait → it returns at once |
| Crash and restart (subprocesses) | `kernel_child` operating with a bound account, killed (`SIGKILL`; `TerminateProcess` on Windows). A second `kernel_child` at once: it waits at least 1.5 s and at most 3.5 s, then its report reads `routine: advanced`, stage `OPERATING`, and its first lease is held by its own epoch. Linux only: `SIGTERM` to a running child → exit 0 and the lease `released == "clean"` |

**`tests/integration/test_protection_kernel.py`, PRF-PRT-06's frozen half (F-P5),** Linux only (`SIGSTOP`; on Windows the test reports `skipped: needs SIGSTOP`, the recorded coverage limit). A `kernel_child` with a filled entry and its broker stop confirmed, and its market store under `tmp_path` written by the test. Control: an unfrozen child given a tick the test chose → `EXIT_STARTED` within two passes. Frozen: `SIGSTOP`, the same tick written; for 45 s (more than two intervals) the heartbeat's `pass_seq` and the ledger head (`LedgerReader`) do not change and no `EXIT_STARTED` is recorded, while the stop leg reads `CONFIRMED` resting; `SIGCONT` → `EXIT_STARTED` within two passes.

**`tests/unit/test_admission_checks.py`, the ledger's statistics.** Account A, `D` = 2026-11-03, S = `buyer_edge`, W another strategy, every quantity 50, written through the ledger fixtures in this order: E0, S, admitted 2026-11-02T05:00:00Z, filled and closed at a loss; E1, S, admitted 03:50:00Z (09:20 IST), opening fill at `"100.00"` 03:51Z, stop-leg fill at `"90.00"` 04:10Z; E2, S, admitted 04:30Z, opening fill `"120.00"` 04:31Z, close-command fill `"110.00"` 05:00Z; E3, S, admitted 05:30Z, opening fill `"80.00"` 05:31Z, open, `desired_level` `"70.00"`, one protection command of S on it `WORKING`; E4, W, admitted 05:40Z, `ADMITTED`. Limits: the account layer `Z(max_daily_loss_amount=4000.0, drawdown_rate_enabled=True, drawdown_rate_max_loss=3000.0, drawdown_rate_window_mins=15, max_consecutive_losses=8)`. The latest observation (as of 05:49:50Z, `max_observation_age_secs` 30) holds three position rows with day P&L `"-500.00"`, `"-500.00"`, `"-250.00"`, E3's row with `ltp` `"78.00"`, and one funds item with `available` `"250000.00"`.

| Case | Expected |
|---|---|
| `stats(intent of S, 05:50:00Z)` | `trade_count` 3, `desk_trade_count` 3, `desk_open_structures` 2, `consecutive_losses` 2, `entry_in_flight` 1, `seconds_since_last_entry` 1140.0, `daily_pnl` `"-1250.00"`, `open_stop_risk` `"400.00"` (E3: (78.00 − 70.00) × 50), `capital` `"250000.00"`, `window_pnl_change` `"0"`, `pnl_history_len` 1, `now_hm` `"11:20"`, `unavailable` `None` |
| Same, `max_consecutive_losses` 0 | `consecutive_losses` 0 |
| Then at 05:55:00Z with the rows summing `"-1600.00"` | `window_pnl_change` `"-350.00"`, `pnl_history_len` 2 |
| Then at 06:06:00Z, `"-1700.00"` | the 05:50 sample is 16 min old and dropped: `"-100.00"`, 2 |
| E3's `ltp` `"65.00"` | `open_stop_risk` `"0.00"`: `max(Decimal(0), Decimal("-5.00")) × 50` is `Decimal("0")`, quantized to `0.01` |
| E3's row without `ltp` | `open_stop_risk` `"0.00"`, `unavailable` `open <E3 instrument> has no fresh mark and recorded protective stop` |
| The `"-250.00"` row without day P&L | `daily_pnl` `"-1000.00"` (the row counts 0), `unavailable` `None` |
| No observation; as of 05:49:00Z | `fresh broker P&L was not supplied` with `daily_pnl` `"0"`; `… unavailable: stale` with `daily_pnl` `"-1250.00"` |
| E3's opening fill split into 30 at 05:31Z and 20 at 05:33Z | `seconds_since_last_entry` 1020.0 (the 05:33 fill completes 50) |
| E3 filled 30 of 50 at 05:31Z only | `seconds_since_last_entry` 3000.0 (E2's close at 05:00 is the latest completing fill) |
| The account layer `NO_ACCOUNT_LIMITS` and a policy without limits, no observation | `unavailable` `None` |
| `max_daily_loss_pct` 2.0, no funds item | `capital` `"0"`, `reviewed capital is absent or non-positive` |
| The scenario above composed with `LEDGER_STATS` and the account layer adding `max_open_structures` 1, a new entry of S through admission | refused `ADM-R13` with reason starting `Desk already has an open option structure (2/1)` under `max_open_structures` 1 |

**`tests/unit/test_policy_parameters.py`, the bound policies.** `P` is the mapping form of `bound()` (every field, `planner` with its nested policies, `protection` and `risk` as their `_from` functions read them). `bound_policies_from({"pb-syn-1": P})` → `({"pb-syn-1": bound()}, [])`. Each alone: an extra key `x` → `{}` and `["policies.pb-syn-1: unknown key x"]`; `policy_binding_id` `"other"` → a line naming the key mismatch; `review_deadline_secs` 301 → a line; `planner.limits.max_trades_per_session` `true` → a line; `planner.limits.entry_cooldown_secs` 300 → `300.0` and no line; `planner` omitted → `planner is None`, no line. `compose_production` over `PROD` without `policies` → `recovery.alerts` holds `policies_unbound`; with an unreadable entry → `policy_unreadable pb-syn-1`.

**Changed existing tests:** `tests/contracts/test_capabilities.py`'s Refusals row loses "`policies=None` → `ValueError`" and its compositions pass no `policies` or `stats` (with `policies` in `PROD`); `tests/unit/test_settings_resolver.py`'s Fields row adds `policies` beside `secrets`, `channel` and `operator`; the coordinator tests run unchanged over `_commit_returns`.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence), one at a time, and restored byte for byte with an md5 check. At least:

| Change | Test that must fail |
|---|---|
| `kernel/host.py`: `min(to_close, to_grid)` replaced by `to_grid` | Legacy's function (period 25); Schedule |
| `kernel/host.py`: the wait ignores `next_wake()` | One pass per wake (deadline) |
| `kernel/host.py`: the wait taken with a non-empty hand-off queue | Hand-offs (the hand-off from `run_pass`) |
| `kernel/host.py`: hand-offs run after `run_pass` | Hand-offs (claimed in the same pass) |
| `kernel/host.py`: a non-stopping exception exits 70 | Containment |
| `kernel/host.py`: `DispatchStateLost` contained | Stopping paths |
| `kernel/host.py`: one more `run_pass` after `stop` | Stop (no claim after the stop) |
| `kernel/host.py`: every pass passed `scheduled=True` | Tick exit only on the grid; One pass per wake |
| `kernel/coordinator.py`: `run_pass(scheduled=False)` still calls `run_once` | Wake passes skip protection; Tick exit only on the grid |
| `kernel/coordinator.py`: `refuse_admitted_entries` not called at stop | Stop (`DSP-R05`) |
| `kernel/coordinator.py`: `refuse_admitted_entries` also refuses a close | Stop (the close stays `ADMITTED`) |
| `kernel/coordinator.py`: `drain_returns` calls `run_pass` | Stop |
| `kernel/coordinator.py`: `_finish` not wrapped in `_commit_returns` | Stopping paths |
| `bootstrap.py`: `wait_for_lease` ignores `holder_epoch` | Lease wait (an older epoch) |
| `bootstrap.py`: `wait_for_lease` returns 0 always | Crash and restart |
| `kernel/admission.py`: `trade_count` counts entries without an opening fill | The statistics (3 becomes 4) |
| `kernel/admission.py`: `desk_open_structures` leaves out `ADMITTED` | The statistics (2 becomes 1); through admission |
| `kernel/admission.py`: the P&L history keeps samples older than the window | The statistics (06:06) |
| `kernel/admission.py`: `open_stop_risk` measured from the opening price | The statistics (`"400.00"`) |
| `kernel/admission.py`: a row without day P&L makes the P&L unavailable | The statistics (`"-1000.00"`) |
| `kernel/admission.py`: the cooldown timed from any fill | The statistics (3000.0) |
| `contracts/decisions.py`: an unknown key accepted | The bound policies |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/host.py` | New (T-70): `KernelHost`, `serve`, `seconds_to_next_pass`, the exit codes |
| `src/autonomous_trading/kernel/coordinator.py` | `run_pass(scheduled=)`, `refuse_admitted_entries` with `DSP-R05`, `drain_returns`, `_commit_returns`, `DispatchStateLost` (a dispatch-spec module; reported to it) |
| `src/autonomous_trading/contracts/evidence.py` | `ObservedPosition.ltp` (an execution-spec contract; reported to it) |
| `src/autonomous_trading/adapters/openalgo.py`, `src/autonomous_trading/adapters/simulated_broker.py` | The position row's `ltp` |
| `src/autonomous_trading/kernel/safety.py` | Unchanged: the latch keeps its own P&L rule |
| `src/autonomous_trading/kernel/protection.py` | `_STOPS` gains `DispatchStateLost` (a protection-spec module; reported to it) |
| `src/autonomous_trading/kernel/admission.py` | `LedgerSessionStats`, `LEDGER_STATS` (an intent-spec module; reported to it) |
| `src/autonomous_trading/contracts/decisions.py` | `bound_policies_from`, `planner_policy_from` |
| `src/autonomous_trading/settings/schema.py` | The `policies` field; the kernel's two added required fields |
| `src/autonomous_trading/bootstrap.py` | The kernel's `run` path, `wait_for_lease`, the channel start, `LEDGER_STATS` in `_compose_kernel`, `policies` and `stats` defaults in `compose_production`, the kernel's `--check` policy lines |
| `tests/integration/test_kernel_host.py` | New (T-75) |
| `tests/integration/test_protection_kernel.py`, `tests/unit/test_admission_checks.py`, `tests/unit/test_policy_parameters.py`, `tests/conftest.py` | The groups above; `FileLeaseStore`, `kernel_child` |
| `tests/contracts/test_capabilities.py`, `tests/unit/test_settings_resolver.py` | The changed rows |
| `tests/integration/test_openalgo_contract.py` | A position row with `ltp` `"78.00"` maps to `ltp == "78.00"`; without it, or `"0"`, to `None` |

**No new tree delta:** `kernel/host.py` is T-70 and `tests/integration/test_kernel_host.py` is T-75.

### Completion conditions (step 3)

* **Targeted tests,** twice in a row: the nine test files above, and those that run the changed modules: `tests/recovery/test_crash_boundaries.py`, `tests/recovery/test_session_transitions.py`, `tests/integration/test_unix_channel.py`, `tests/integration/test_market_port.py`, `tests/unit/test_safety_matrix.py`, `tests/unit/test_planner_rules.py`, `tests/unit/test_protection_basket.py`, `tests/contracts/test_installed_artifact.py`. The Linux-only cases run once on the development checkout on the EC2 (`~/at-dev`, `scripts/safe_pytest.py`); on Windows they report their skip.
* Every break check fails a listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file.
* `git diff --stat` against the step's start names only the files above.
* **One full suite, run by the owner:** the coordinator, protection, admission and bootstrap are read by every kernel test, so this is a wide change.
* PRF-OPS-01's clauses each pass a group: the :07, :27, :47 schedule and period 25 (Schedule); legacy's function (Legacy's function); one pass per wake, without protection (One pass per wake; Wake passes skip protection; Tick exit only on the grid); hand-offs in order on the writer thread (Hand-offs); the heartbeat after each pass (Heartbeat); `SIGTERM` claims nothing new, drains returns and releases `clean` (Stop; Crash and restart's `SIGTERM` case); the exception policy as this step's Deviation states it (Containment; Stopping paths); a restart waits for the lease, then advances routinely (Lease wait; Crash and restart); no protection pass before `OPERATING` (Not before `OPERATING`). PRF-PRT-06's frozen half passes on Linux.

### Step 3 as built

**Built** in OA_NEW `e58ab2f` on `slice-08` (from `e7c0aec`), one commit, 19 files: `kernel/host.py` (new), `kernel/coordinator.py`, `kernel/protection.py`, `kernel/admission.py`, `contracts/decisions.py`, `contracts/evidence.py`, `adapters/openalgo.py`, `adapters/simulated_broker.py`, `bootstrap.py`, `settings/schema.py`, `settings/loader.py`, `tests/integration/test_kernel_host.py` (new) and seven existing test files (`tests/conftest.py`, `tests/contracts/test_capabilities.py`, `tests/integration/test_openalgo_contract.py`, `tests/unit/test_admission_checks.py`, `tests/unit/test_policy_parameters.py`, `tests/unit/test_protection_loop.py`, `tests/unit/test_settings_resolver.py`). `kernel/safety.py` is unchanged: the latch keeps its own P&L rule.

**Run** locally on Windows, Python 3.14 (`.venv-slice01`), through `scripts/safe_tests.py`. The targeted set was run twice in a row after the last change, with 930 passed and 8 skipped each time. It is the files above plus `tests/recovery/test_crash_boundaries.py`, `tests/recovery/test_session_transitions.py`, `tests/integration/test_unix_channel.py`, `tests/integration/test_market_port.py`, `tests/unit/test_safety_matrix.py`, `tests/unit/test_planner_rules.py`, `tests/unit/test_protection_basket.py`, `tests/integration/test_dispatch_revalidation.py`, `tests/integration/test_protection_kernel.py`, `tests/integration/test_reconciliation_commits.py`, `tests/unit/test_protection_states.py`, `tests/unit/test_conflict_relation.py` and `tests/contracts/test_installed_artifact.py`. An earlier run had three wall-clock failures: `test_openalgo_contract.py`'s recorded books and drip deadline, and `test_crash_boundaries.py::test_cp_r9_lease_without_row`. Each passed alone and in every later run, and this step touches none of their timing. `ast.parse` passes on all 19 files. The 23 break checks (`s11c_breaks.py` in the session scratchpad) each fail a listed test, and every file was restored (md5). Ten of them cover the money Fork calls: R-1 twice, R-2, R-4, R-5, R-6, R-7 and R-8 three times. Not run: Linux, and the full suite (the owner's).

**Differences from the text above**, each smaller than a decision:

| Text | As built | Why |
|---|---|---|
| `scheduled = (the last wait timed out) or now >= next_grid` | A wait that times out counts as scheduled only when its timeout was the grid's; a wait cut short by `next_wake()` (a dispatch deadline) is a wake pass | Otherwise a deadline would run protection off the grid, against R-1 |
| `next_grid = now + seconds_to_next_pass(…)` | Computed from the time after the pass | As legacy, which slept `seconds_to_next_pass(poll, time.time())` after the pass (`scripts/run_framework_live.py:8287`) |
| `drain_returns` measures its deadline with `clock.elapsed()` | With `time.monotonic()` | A recorded clock never advances, so the bound never ended; it is a real wait, like `wait_woken` |
| The simulated broker's `ltp` is its last price | Its last fill price, unless a test sets it with the new `set_ltp` | The statistics tests need a mark that differs from the fill |
| The statistics tests are "written through the ledger fixtures" | Written directly into an in-memory SQLite built from every migration; the row "through admission with `LEDGER_STATS`" is not built | The hand-computed scenario needs exact fill times and states; the composition path is covered by `test_capabilities.py`, whose kernel now composes `LEDGER_STATS` |
| The tick example: exit 90, prices 95, 89.5 (wake), 92 | The fixture's target exit at 30.00, prices 29.00, 30.00 (wake), 29.50, in `tests/unit/test_protection_loop.py` beside the wake-pass case | The built tick exit is the target or deep-OTM rule; the shape of the example is kept |
| PRF-PRT-06's frozen half: a `SIGSTOP` subprocess on Linux | In process, in `tests/unit/test_protection_loop.py`: no pass for 45 s with a target tick present, no exit, ledger head unchanged, stop leg `CONFIRMED`; the next pass starts the exit | No Linux run in this step. **Carried:** the `SIGSTOP` subprocess case goes with step 4's frozen-kernel supervisor test (PRF-OPS-03) |
| Crash and restart as subprocesses; a `SIGTERM` subprocess | In process: the first composition clears `held` and shuts down unreleased; `wait_for_lease` returns 30 s; without the wait the next start declines (check 6 only), with the store advanced 30 s it advances routinely | **Carried:** the signal handlers in `serve_kernel` are not exercised by a test; step 7's rehearsal starts the unit |
| `required_fields("kernel")` gains two keys | Added in `bootstrap.required_fields`, not in `PARTICIPANTS` | Step 1's test requires every `fields_required` entry to ship `null`; `host.pass_interval_secs` ships 20 |
| — | `KernelHost` also takes `channel=` and `drain_deadline_s=`; `stopping_code` is public; `serve_kernel` exits 78 outside a production profile; `settings/schema.py` gains `SECTIONS`, and the loader serves `policies` as a section and keeps it out of the snapshot's values | Wiring the text describes |

**Left in OA_NEW, untracked:** the `build/` directory recorded in step 2.

## Step 3a — the market host loop and the channel `KernelPorts` client for strategy and cognition

<a id="step-3a--the-market-host-loop-and-the-channel-kernelports-client-for-strategy-and-cognition-outline"></a>The authorities are the market spec's [ingestion and merge](../../design/market-data-and-canvas.md#ingestion-and-merge-marketingestpy), SLICE-08's hand-offs to SLICE-11 (its steps 2, 4 and 5: the host's `run_once` schedule, the websocket host, the reference schedule), SLICE-10's channel hand-offs (the six service operations, the `KernelPorts` client rule, row 17), SLICE-09's `KernelPorts`, `ReviewPort` and review producer as built, [step 2 as built](#step-2-as-built), [step 3](#step-3--the-kernel-host)'s text (being built), the owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30), and legacy at 445eb116: the poller and its scheduler (`src/interfaces/mcp/core/marketpull.py:810-897`, `src/interfaces/mcp/core/scheduler.py:174-278`, `:663-749`), the socket (`src/interfaces/mcp/domains/monitoring/client.py:105-291`), the watch (`src/interfaces/mcp/domains/monitoring/autowatch.py:40-254`), the calendar gate (`src/interfaces/mcp/core/market_calendar.py:28-200`) and the live session's loop (`scripts/run_framework_live.py:8282-8287`). It is TASK-S11-13. It builds on OA_NEW at step 3's commit or later; every OA_NEW citation below is at `e7c0aec`, re-read on the head the build starts from. It replaces step 2's exit 78 for `at-market`, `at-strategy` and `at-cognition` with a production profile; a test or simulation profile still exits 78. **The market process holds the account's key for reads only and never constructs `OpenAlgoAdapter` (PRF-XC-02); a strategy process holds no broker key and no `Secret`.** No gate on real trading is added and no threshold is set: every new timing value is a refusing setting whose example value (step 7) is legacy's.

### In plain words

This step makes three programs run by themselves on the trading server. The market program fetches prices from OpenAlgo once a minute from 09:00 to the close, as today, and keeps the live index ticks flowing in through a websocket. A slow minute never holds up the ticks: the minute's fetch runs on its own, and a fetch that runs past the next minute skips that minute, as today's scheduler does. Every five minutes while the market is open it checks the index subscriptions and rebuilds the socket when ticks have stopped twice in a row, as today. From 09:05 each weekday it records the day's reference facts (expiries, lot sizes, the day's trading hours) and tries again every minute until they are stored. The strategy program decides on each finished bar and hands its entry to the kernel through the kernel's local socket. If that socket is down, it hands over nothing and tries again on the next pass; stops, trails and exits are the kernel's and keep running. It stops after the session's close, as today's session does. The AI review program answers each review request from the strategy and records the answer with the kernel. If it cannot be reached, the strategy records "review unavailable" and goes on, as today. Nothing here changes a limit, a score or when an order is sent.

### Decisions

#### What legacy does here

* **Polls.** APScheduler runs `market_pull` on the cron line `* 9-15 * * mon-fri` in `Asia/Kolkata` (`config/defaults.yaml:1043-1045`; `src/interfaces/mcp/core/scheduler.py:174-215`), `max_instances=1`, `coalesce=True`, `misfire_grace_time` 900 (`:700-712`): a trigger that fires while the previous poll still runs is skipped with a WARNING, and a late start runs once. `poll_once_sync` skips after the close (`marketpull.py:888-896`). Each instrument's calls are sequential (`:837-846`); a failed call is journalled and the next minute polls again. Polls run on a scheduler thread; the socket runs on the gateway's event loop, so a slow poll never delays a tick (`client.py:121-139`).
* **The socket.** `MarketDataStream._run` connects (`open_timeout` 10 s), sends `{"action": "authenticate", "api_key": …}`, marks itself connected without waiting for a reply, clears what was sent and re-sends every wanted subscription, then reads frames until the socket fails; it then sleeps a backoff from 1 s doubling to 30 s, reset on a connect (`client.py:230-268`; `config/defaults.yaml:587-589`). It runs with the `websockets` library's keepalive defaults (a ping after 20 s, closed when no pong within 20 s). `subscribe` adds to `desired` and sends only what was not sent on this socket (`client.py:185-218`). `reconnect` cancels the reader and starts a fresh one at once (`:141-170`). The URL is `openalgo.websocket.url`, or derived: `https` to `wss://<host>/ws`, otherwise `ws://<host>:8765` (`client.py:46-63`; `config/defaults.yaml:585-586`).
* **The watch.** `tick_watch` runs on `*/5 9-15 * * mon-fri` (`config/defaults.yaml:1039-1041`). Per target (each index at its spot exchange, the recording scope its ceiling, `autowatch.py:63-94`) it asks the calendar gate per exchange; it counts a run as stale when any open target's last tick is older than `monitoring.stale_after_secs` 15 (`config/defaults.yaml:1778`; `state.py:147-162`, a target never seen is stale) while the socket is up, and on the second such run in a row it reconnects (`autowatch.py:51`, `:113-147`); then each open target is "already" when the socket is up, the target fresh and wanted at its mode, else it is subscribed (`:175-234`). **Measured in the code, kept:** for a target already sent on the current socket, "subscribe" sends no frame (`client.py:211-213`), so the reconnect is what recovers a dead feed. The strategy unit also ran `ticks_cli.py watch` before each session (`deploy/systemd/at-strategy.service:49`).
* **The gate.** `market_status` asks OpenAlgo's `/api/v1/market/timings` for the date, caches a successful answer per `(date, exchange)`, never caches a failure, maps `NSE_INDEX` to `NSE` and `BSE_INDEX` to `BSE`, and reads open as `start_time <= now_ms <= end_time`; a failure is `unknown` and closed (`market_calendar.py:67-200`).
* **The session loop.** One pass at start, then after each pass: stop when the IST time is at or after the configured close (15:30), else sleep `seconds_to_next_pass` (`scripts/run_framework_live.py:8282-8287`). No signal handler: `SIGTERM` ends it mid-pass (step 3's record). The review ran inside the session process, synchronously, and failed open (`src/runtime/ai_management/service.py:117-138`).

#### The market host (`market/ingest.py`)

* **`MarketLoop` split (a market-spec module change, reported to it).** `poll() -> tuple[list[IncomingRecord], list[CoverageEntry]] | None` is `run_once`'s poll block moved unchanged: `None` when `_poll_due(instant(clock.now()))` is false, else the minute is marked and the records and coverage of one poll are returned. `run_once(*, polled: tuple[list, list] | None = None, poll: bool = True)`: the polled records and coverage are `polled`'s, or empty; then, when `poll` is true, `self.poll()`'s are appended (the built path, so every existing caller and test is unchanged); then the drain, the JSON check and the commit as built. The host calls `run_once(poll=False, polled=…)`.
* **`_Reads.unsealed_windows(instrument, *, through) -> list[str]`** (`market/store.py`, R-1), `_seal`'s rule (`market/store.py:415-424`) for one instrument at one head, reading no payload: `SELECT DISTINCT r.window_start FROM record r WHERE r.stream = 'tick' AND r.instrument = ? AND r.seq <= ? AND NOT EXISTS (SELECT 1 FROM seal s WHERE s.instrument = r.instrument AND s.interval_secs = ? AND s.window_start = r.window_start AND s.seq <= ?) ORDER BY r.window_start`, with `BASE_INTERVAL_SECS`; the `record_window` index and the seal's unique key serve it. `next_wake` keeps its minute candidate and maps each returned window to `confirm_at(instant(Timestamp(w, "exchange")), wdef)`, replacing its loop over every stored tick and revision-1 seal (`market/ingest.py:293-299`).
* **Constants** (each legacy's, cited where defined): `WATCH_EVERY_MINUTES = 5`, `WATCH_HOURS = (9, 15)` (the cron line); `STALE_RUNS_BEFORE_RECONNECT = 2` (`autowatch.py:51`); `REFERENCE_FROM = time(9, 5)`, `REFERENCE_EXCHANGE = "NFO"`, `REFERENCE_UNDERLYINGS = ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")` (`scripts/record_reference.py:7-8`, `:35`, `:171`).
* **Pure schedule functions,** all in IST over `calendar("nse-fo/v1")`: `next_minute_start(now) -> datetime`, the first IST minute boundary strictly after `now`; `next_watch(now) -> datetime`, the first instant strictly after `now` whose IST weekday is in `calendar.weekdays`, hour in 9..15, minute a multiple of 5 and second 0 (09:00 … 15:55); `reference_due(now, recorded: bool) -> bool`, true when the IST weekday is in `calendar.weekdays`, the IST time is at or after 09:05 and `recorded` is false.
* **`MarketHost(comp: MarketComposition, *, socket, settings, stop: threading.Event, heartbeat: Path | None, identity: Mapping[str, str | None], store_path: str)`** with `submit(fn) -> Future` and `offer(batch)` (any thread) and `serve() -> int` (the main thread). `submit` and `offer` put on a `queue.SimpleQueue` and set the wake event. Four daemon threads, each one at a time, as legacy's scheduler ran each job with `max_instances=1`; each catches `Exception` per iteration, logs it at ERROR with its traceback (through step 2's scrubbing filter), counts it in `faults` and `last_fault`, and goes on:
  1. **poll:** `target = next_minute_start(now)`; `stop.wait(seconds to target)`; `started = clock.now()`; `batch = loop.poll()`; `ended = clock.now()`; a batch goes to `offer`. Each IST minute start in `(started, ended]` is logged once at WARNING as `market poll <HH:MM> skipped: the <HH:MM> poll was still running`, as APScheduler's skip. The next target is computed from `ended`, so an overrun minute is never polled late (Fork call M).
  2. **ticks:** `socket.run(stop)` (below).
  3. **watch:** once at start, then at each `next_watch(now)`: `watch_once(at)` (below).
  4. **reference:** at each `next_minute_start(now)`: open `MarketReader.open(store_path)` read-only, `recorded = trading_day_recorded(reader, "NFO", calendar.exchange_date(now))`, close it; when `reference_due(now, recorded)`, `record_reference_day(source, _HandOffStore(self), clock, exchange="NFO", underlyings=REFERENCE_UNDERLYINGS, snapshot_root=Path(store_path).parent / "reference", calendar=calendar("nse-fo/v1"))`. `_HandOffStore.record_reference(facts)` is `self.submit(lambda: loop.store.record_reference(facts)).result()`, so the writer connection stays on the main thread. Any exception (`StaleMaster`, `FetchWindowError`, `MarketReadFailed`, others) is one WARNING and `reference.last_error`; the next minute tries again (SLICE-08's Fork call F-9). The reads run beside the polls, as legacy's recorder was its own process.
* **Where `stop` is checked (R-8).** The poll, watch and reference threads leave when their `stop.wait(…)` returns true, before any work; the ticks thread at each connect attempt, each backoff wait and each frame or receive timeout of the read loop; the main thread after each run.
* **`serve()`:** start the four threads; then loop: run every queued `submit` function in order (its value or exception to its future); join every queued poll batch in arrival order (records then coverage, concatenated); `loop.run_once(poll=False, polled=joined)`; the heartbeat; when `stop` is set, leave the loop; else `next_wake = loop.next_wake()` and wait on the wake event for `max(0, next_wake - now)` seconds. **A fault (R-2):** an `Exception` from `run_once` or `next_wake` is logged at ERROR with its traceback, counted in `faults` and `last_fault`, and the wait is until `next_minute_start(now)` instead (a hand-off or `stop` still ends it), so a failing store is retried once a minute, never in a tight loop; a commit failure keeps the drained ticks, as built.
* **Stop (R-3), in this order:** `socket.close()` (the read loop ends at once); every queued and every later `submit` future gets `set_exception(HostStopping())`, so a thread waiting in `_HandOffStore` returns with that exception (the reference run is retried after the restart); join each thread for at most `market.http_timeout_ms` (the longest single read a thread can be in), and a thread still alive is logged at WARNING and left (daemon; its poll is lost, as a killed legacy poll was); then, in a `finally` that runs whatever the joins did, one last `run_once(poll=False, polled=…)` so no polled record or drained tick is lost, `loop.store.close()`, heartbeat `stopped` (or `failed` when that commit raised); return 0.
* **The watch, `watch_once(at)`** (legacy's `ensure_subscribed`, `autowatch.py:150-254`): `targets = source.subscribe_frames()`; `gate = {x: source.market_open(x, at)}` for each distinct target exchange; `open_ = [t for t in targets if gate[t.exchange].is_open]`. **Escalation first** (`autowatch.py:113-147`): when any target of `open_` is `source.stale(name, after_secs)` and `socket.connected`, `stale_runs += 1`, and at 2 `socket.reconnect()` and `stale_runs = 0`; otherwise `stale_runs = 0`. Then per target: closed → `closed` gets `"<NAME>: <reason>"`; connected, not stale and wanted at its mode → `already`; else (connected and stale → also `revived`) `socket.subscribe(frame)` and `subscribed`. The result `{"at", "subscribed", "already", "revived", "reconnected", "closed"}` goes to the heartbeat and, when `subscribed` or `reconnected` is not empty, one INFO line.
* **The heartbeat** (diagnostic only; nothing reads it to decide): `<paths.run>/health/market.json`, replaced atomically after each `run_once` and on exit, mode `0640`, as step 3's: canonical JSON `{"format": "at-market-heartbeat/1", "state": "running" | "stopped" | "failed", "pid", "settings_revision", "bundle_digest", "run_seq", "run_ended_utc", "store_head", "poll": {"last_started_utc", "last_ms", "skipped"}, "ticks": {"connected", "connect_attempts", "last_error", "desired", "sent", "ignored", "dropped", "stale_runs", "last_watch"}, "reference": {"day", "recorded", "last_error"}, "faults", "last_fault"}`. An `OSError` logs one WARNING per run of failures. Unbound `paths.run` passes `None` with one WARNING. Step 4's supervisor may read it.

#### The source and the socket (`adapters/openalgo.py`)

* **`OpenAlgoMarketSource.market_open(exchange, at) -> tuple[bool, str | None]`,** legacy's `market_status` and `window_for` ported: `FEED_EXCHANGES = {"NSE_INDEX": "NSE", "BSE_INDEX": "BSE"}`; `CRYPTO` is open; the window comes from `_call("market/timings", [("date", <IST date>)], self._deadline())`, a success being a body whose `status` (default `success`) lower-cased is `success` or `ok` and whose `data` is a list; the row is the one whose upper-cased `exchange` is the mapped exchange, or none. A success (a row or none) is cached under `(date, exchange)`; a failure is not cached and answers `(False, "unknown")`. No row: `(False, "weekend")` on Saturday or Sunday, else `(False, "holiday")`. A row: open when `start_time` and `end_time` are set and `start_time <= at_ms <= end_time`, else `(False, "before_market")` below the start, `(False, "after_market")` above. The cache is touched by the watch thread only.
* **Freshness.** `on_frame` records, under its lock, `last_arrival[name] = arrival` for every frame of a target, before the record is built (a dropped tick still shows the feed alive, as legacy's cache recorded every frame, `state.py:69-78`). `stale(name, after_secs) -> bool`: no arrival, or `instant(clock.now()) - last_arrival[name]` greater than `after_secs` seconds (strictly, as `state.py:160`).
* **`auth_frame() -> str`:** `json.dumps({"action": "authenticate", "api_key": self._http.key})`, the source's one revealed key; nothing else reads it.
* **`OpenAlgoTickSocket(source, url, *, connect_timeout_secs, backoff_initial_secs, backoff_max_secs, connect=websocket.create_connection)`** over `websocket-client` (already installed and hashed as `openalgo==2.0.5`'s dependency, `requirements.lock`; no dependency change). State under one lock: `ws`, `connected`, `desired` (an ordered mapping of `(symbol, exchange)` to its frame), `sent`, `connect_attempts`, `last_error`, `_reconnect`.
  * `run(stop)`: `backoff = backoff_initial_secs`; while `stop` is not set (checked before each connect attempt): `connect_attempts += 1`; `ws = connect(url, timeout=connect_timeout_secs)`; `ws.send(source.auth_frame())`; `connected = True`, `last_error = None`, `sent` cleared, `backoff = backoff_initial_secs`; `source.connected()`; each `desired` frame sent in order and added to `sent`; then the read loop. Any exception: `last_error` = the source's scrub of `"<Type>: <text>"`, cut to 200 characters, one WARNING. Always after: `connected = False`, `ws` closed and `None`, `sent` cleared. Then, when `stop` is set, return; when `_reconnect` is set, clear it and connect again at once; else `stop.wait(backoff)` and `backoff = min(2 × backoff, backoff_max_secs)`.
  * **The read loop:** `ws.settimeout(KEEPALIVE_SECS)` with `KEEPALIVE_SECS = 20` (the `websockets` library's `ping_interval` and `ping_timeout` defaults legacy ran under); frames by `ws.recv_data_frame(True)`: text or binary data to `source.on_frame`, a pong only as activity, a close ends the loop; a receive timeout sends `ws.ping()` the first time and ends the loop as `keepalive` when a ping is already outstanding; any frame clears the outstanding ping. Before each receive and after each frame or timeout it checks `stop` and ends when set.
  * `subscribe(frame)`: `desired[(symbol, exchange)] = frame`; when connected and the key is not in `sent`, `ws.send(json.dumps(frame))` and add it; a send failure is one WARNING (legacy's `_send`). `reconnect() -> bool` (R-7, legacy's `client.py:161-170`): under the lock, when `ws` is set: `_reconnect = True`, `connected = False`, `sent` cleared, then `ws.close()` (the reader ends), True; else False. So a watch reading the socket right after a reconnect sees it down, as legacy's `reconnect` dropped `connected` before returning. `close()`: under the lock `connected = False`, `sent` cleared, `ws.close()` when set; used at stop. `wanted(key, mode) -> bool` reads `desired`.
* **`ws_url(base_url, override) -> str`:** `override` when set; else `https` gives `wss://<netloc>/ws`, anything else `ws://<hostname>:8765`.
* **Reads only.** The market source calls only `quotes`, `history`, `expiry`, `optionchain`, `multioptiongreeks`, `/api/v1/market/holidays`, `/api/v1/market/timings` and `instruments`; the socket sends only `authenticate` and `subscribe` frames.

#### The channel clients (`bootstrap.py`, `adapters/unix_channel.py`)

* **`bootstrap.ChannelKernel(client: KernelChannelClient)`,** the `KernelPorts` over the channel (SLICE-10's rule, one client call per method). `alive()`: `True` only for an `answered` reply; `False` for a `refused` or `ambiguous` reply and on `ChannelRefused` or `ChannelAmbiguous`. Every other method raises `KernelUnavailable` on either exception and on any reply but `answered`, and otherwise decodes: `publish` → `result["digest"]`; `record_decision`, `record_unavailable` and `submit` → `result_from_wire(result)`; `command_status` → `status_from_wire(result["status"])`. A decode error (`KeyError`, `TypeError`, `ValueError`) is `KernelUnavailable`: nothing proves the kernel did not act, and the host's recovery asks `command_status`, as built.
* **Decoders** (`adapters/unix_channel.py`), the inverses of the built wires: `refusal_from_wire`; `result_from_wire`: `answer` → its `str`, `refusal` → `Refusal`, `committed` → `Committed(tuple(sequences))`, `outcome` → `outcome_from_wire`, anything else `ValueError`; `outcome_from_wire` → `Outcome(command_key, attempt_no, effect, canonical, "none", dict(broker_order_ids), None, sent, refusal)`, **`domain` not carried** (the wire holds only its value and no host reads it); `status_from_wire` → `CommandStatus` or `None`; `review_wire(review)` and `review_from_wire(obj)` (exactly `Review`'s fields; `lineage_digests` lists to tuples recursively, `evidence_refs` to a tuple).
* **Four cognition operations** join `ROLE_OPS["service"]`: `resolve_intent {intent_ref}` → `{"intent": wire(intent) | None}` (`policy.resolve_intent`); `review_binding {session_id}` → `{"binding": None | {policy_binding_id, ai_mode, review_required, review_deadline_secs, configuration_digest, blueprint_digest, lineage_digests}}` (`policy.bound_policy`); `resolve {ref}` → `{"content": …}` (the evidence store, as `InProcessReviews.resolve`); `record_review {review}` → `result_wire(coordinator.record_review(review_from_wire(…), p.principal, auth=svc_auth))`. They join `OPS` (check 9).
* **Operations per principal (R-4).** Check 10 becomes: a `relay` peer may call `ROLE_OPS["relay"]`; a `service` peer may call `PRINCIPAL_OPS[principal]` when its principal is `cognition`, which is exactly `alive`, `publish`, `resolve_intent`, `review_binding`, `resolve` and `record_review`, and otherwise (`strategy:<id>`) `ROLE_OPS["service"]`, the six built operations unchanged. Anything else is `SEC-R10 role`. So a strategy cannot read or record a review, and cognition cannot submit, record a decision or record an unavailable review. `bootstrap.ChannelReviews(client)` is `KernelReviewPort` over them (`bound` returns a frozen `ReviewBinding` with those seven attributes; `publish` as `ChannelKernel.publish`), raising `KernelUnavailable` as `ChannelKernel` does.
* **The review socket.** `KernelChannelClient` gains `contract=CONTRACT` and `reply_timeout_s=REPLY_TIMEOUT_S` keywords (the reply's `contract` is checked against `contract`). `REVIEW_CONTRACT = "review-channel/1"` (joins `settings.schema.CONTRACTS` as `review`), `REVIEW_REPLY_TIMEOUT_S = MAX_REVIEW_SECONDS + REPLY_TIMEOUT_S` (360.0: legacy's longest review plus the channel's reply bound). **`_admit(peer, frame, *, contract, peers, main_pid, identity_of, release) -> tuple[Peer, dict] | Refusal` (R-5)** is `ChannelCore.handle`'s checks 1 to 8 moved unchanged (uid, unit, uid match, frame, shape with `projections`, process identity, `contract`, `release`), returning the matched peer and the message or the refusal code and reason; `ChannelCore.handle` calls it with `CONTRACT` and then runs 8a to 13 as built. `ReviewCore(producer, *, peers, main_pid, identity_of, release)` calls it with `REVIEW_CONTRACT` against the `strategy:` service peers only, ignores the `projections` it carries (none are compared on this socket), then: the op must be `review_request` (else `SEC-R11 op`), the body exactly `{intent_ref: str}` (else `SEC-R11 call`); `producer.request(intent_ref)` → `answered {"refusal": refusal_wire(r) | None}`; any exception → `ambiguous`. Every `ReviewCore` reply's `contract` is `REVIEW_CONTRACT`, and its `epoch` is a `uuid4().hex` made at start. `ReviewChannelClient` sends `"projections": {}`.
* **Concurrent reviews (R-6, Fork call R).** Legacy reviewed each strategy's intents in that strategy's own session process, so two strategies' reviews ran at once. `ReviewCore` therefore serves requests in parallel (one server thread per connection, as built) and serializes only requests for the same `intent_ref`, with a lock per `intent_ref` taken from a dictionary guarded by one lock and dropped when no request holds it. That suffices because the producer is thread-safe for different intents: every `RecordStore` read and write holds its file lock (`cognition/records.py:130-153`, `current` and `create` included), the runtime bounds its processes with a shared semaphore (`cognition/runtime.py:480`), each run has its own `run_id` directory, and `alerts.append` is atomic. The one race, `current` then `create` for the same `record_id` (`cognition/review.py:202-209`), is closed by the per-`intent_ref` lock; the producer is not changed. `KernelChannelServer` serves it unchanged at `<paths.run>/cognition/review.sock`. `ReviewChannelClient(path, *, server_uid, server_gid, release)` is the strategy's `ReviewPort`: `request(intent_ref)` returns `None` or the `Refusal`, and raises on any channel exception or a reply other than `answered`; the host then records `review_request_failed` (SLICE-09's Fork call 16, as built).

#### The services (`bootstrap.run`, `strategies/worker.py`)

* **`at-market`:** after step 2's start steps, `stop` and the `SIGTERM`/`SIGINT` handlers as the kernel's (step 3); `comp = compose_production(eff, manifest, participant="market", …)`; `socket = OpenAlgoTickSocket(comp.source, ws_url(settings.openalgo_base_url, settings.market_ticks_url), …)`; `MarketHost(comp, …).serve()`.
* **`at-strategy <id>`:** `kernel = ChannelKernel(KernelChannelClient(<paths.run>/kernel/channel.sock, server_uid=pwd.getpwnam("at-kernel").pw_uid, server_gid=grp.getgrnam("at-channel").gr_gid, release=<this bundle's digest>, projections=dict(eff.projections)))`; `reviews = ReviewChannelClient(<paths.run>/cognition/review.sock, server_uid=<at-cognition's uid>, server_gid=<at-channel's gid>, release=…)`; `compose_strategy_host(…, registry=load([PRODUCTION], parse_registry(settings.strategies_registry), composition="production"), market_path=settings.market_store_path, view_policies=settings.market_views, store_path=<paths.evidence>/strategies/<id>/host.sqlite, clock=LiveClock(), sleep=time.sleep)`. A `Refusal` prints its code and exits 1; a platform without `AF_UNIX` and `SO_PEERCRED` exits 1 with `refused: channel platform`. Then `host.serve()`. **No signal handler** (Fork call Q). A model strategy still refuses `STR-R15` (no proposals route; Open).
* **`StrategyHost.serve() -> int`** (legacy's loop order): `run_pass()`; when the IST time is at or after `self.calendar.close`, return 0; else `self.sleep(self.next_delay())`; repeat. The built `run(stop)` stays for its tests.
* **`at-cognition`:** `client` as the strategy's, with `contract` the kernel's; `cog = compose_cognition(settings, work_root=<paths.evidence>/cognition/work, record_root=<paths.evidence>/cognition/records, publish=ChannelReviews(client).publish, clock=time.time, sleep=time.sleep, secrets=<the cognition scope>)`; `producer = compose_review_producer(ChannelReviews(client), cognition=cog, teams={}, context=None, record_root=…, work_root=…, clock=time.time)` (no team bound in the first release, as SLICE-09; the production `ContextPort` is open); `ReviewCore` and `KernelChannelServer(…, socket_gid=<at-channel>)` in a thread; the main thread waits on `stop` (the kernel's handlers); then `server.shutdown()` (accepted requests are answered) and exit 0. A kernel unreachable during `recover()` gives `FailedReviews`, whose every request is refused, so each intent records `review_request_failed` (fails open, as built).
* **Settings** (`settings/schema.py`, `resources/defaults.yaml`), each shipping `null`, scope market, no environment name: `market.ticks.url` (`text`; null derives), `market.ticks.connect_timeout_secs`, `market.ticks.backoff_initial_secs`, `market.ticks.backoff_max_secs`, `market.ticks.stale_after_secs` (`int_pos`). `required_fields` for a production profile adds the four `int_pos` keys to `market`; `paths.run` and `paths.evidence` to `strategy` and `cognition`. The `channel` field's scope gains `cognition`. Step 7's example profile carries legacy's 10, 1, 30 and 15.
* **Row 17 is mapped** (`interfaces/api.py`): the market host subscribes at its start, so `ticks.watch` answers `Mapped({"ok": true, "started": false, "note": TICKS_WATCH_NOTE})`, `TICKS_WATCH_NOTE = "nothing to start: the market process opens the tick socket at start and re-subscribes every five minutes while the market is open"`, and calls no port. `OwnerPorts.market` stays `None`.

#### Fork calls in this step

* **M. Poll timing: legacy's.** A poll at each IST minute start from 09:00 through the close, on its own thread, one at a time; a poll that runs past a minute start skips that minute with a WARNING and is never run late (`max_instances=1`, `coalesce=True`); a late wake still polls its own minute. Ticks are drained and windows sealed on the main thread at `next_wake`, never behind a poll, as legacy's socket never waited for the poller.
* **N. Market hours: legacy's.** Polls 09:00 to the close (SLICE-08 as built); the subscription gate asks OpenAlgo's timings, fails closed on `unknown`, caches only a success per day; the reference read from 09:05 on weekdays, every minute until the day's `trading_day` fact is stored.
* **O. OpenAlgo slow or down: legacy's.** A failed or slow REST read is an `interrupted` coverage row within `market.http_timeout_ms` (SLICE-08) and the next minute polls again; no REST backoff. The socket reconnects after 1 s doubling to 30 s, with a 10 s connect bound and a 20 s keepalive; two stale watch runs in a row rebuild it; a target already sent gets no second frame. Nothing here stops the kernel or protection.
* **P. Re-subscribe: legacy's five-minute watch,** 09:00 to 15:55 on weekdays, plus one run at the host's start, which replaces the strategy unit's pre-start `ticks_cli.py watch` and makes row 17 mapped.
* **Q. A channel failure withholds new intents only.** `alive()` false makes the pass decide and send nothing; the next pass retries; the kernel's stops, trails and square-off are untouched. The strategy host keeps the session loop's order (a pass at start, stop after the first pass at or after the close) and its lack of a signal handler.
* **R. The review fails open.** Cognition unreachable, refused or timed out is `review_request_failed`, recorded as `proceed_unavailable` (or `not_required` when the policy needs no review), as legacy's in-process review failed open. Reviews for different intents run at once, as legacy's per-session reviews did; one intent's requests run one at a time.

#### Deviations in this step

* **Ticks and polls share one store commit,** where legacy wrote ticks and polls to separate files; a poll's records reach the store at the next main-thread run, within one wake.
* **The socket library** is `websocket-client` with an explicit 20 s keepalive, where legacy used `websockets` and its defaults; the same timings.
* **The review runs in its own process** behind `review-channel/1`, where legacy reviewed inside the session process.
* **The market process finishes its run on `SIGTERM`** and commits what it holds; legacy's gateway was killed.
* **Row 17's answer carries a note, not the live state** (SLICE-10 named "the host's subscription state"): the state is in the market heartbeat, which the operator's user cannot read.
* **`Outcome.domain` is not carried** over the channel.

#### Open, carried

* `McpPorts.market` (the `live` reads) stays `None` (`SEC-R22`); the proposals route for a model strategy (none in the first release); the production `ContextPort`; retention.
* **Step 7** renders `at-market` (`Restart=always`, 5 s, legacy's gateway, `deploy/systemd/mcp-gateway.service:42-43`), `at-strategy` and `at-cognition`, the `at-channel` group and the socket directories.

### Tests

Every value is synthetic. Times are IST on Tuesday 3 November 2026 unless named (Friday 6, Saturday 7). `RecordedClock` is `tests/conftest.py`'s. `stub_stop(clock, n)` is an event whose `wait(t)` advances the clock by `t`; its first `n - 1` waits return false, and its `n`-th sets the event and returns true, which ends the thread (R-8). `FakeSocket` records frames and `connect` calls; `FakeHttp` records endpoints and answers from a script. Window epochs: 09:15 is `1793677500000` ms, 15:30 is `1793700000000` ms.

**`tests/unit/test_market_ingest.py`, the host:**

| Group | Cases |
|---|---|
| The split | Over the built `run_once` cases: `run_once()` and `run_once(poll=False, polled=loop.poll())` commit the same records and coverage; `poll()` at 08:59:59 is `None`; at 09:30:00 twice, the second is `None` |
| Poll schedule (Fork call M) | `next_minute_start`: 09:30:00 → 09:31:00; 09:30:00.5 → 09:31:00. Poll thread from 09:29:30, `stub_stop(…, 4)`, polls lasting 5, 70, 5 s: starts 09:30:00, 09:31:00, 09:33:00; one WARNING `market poll 09:32 skipped: the 09:31 poll was still running` |
| Watch schedule | `next_watch`: 09:12:30 → 09:15:00; 09:15:00 → 09:20:00; 08:59:59 → 09:00:00; 15:52:00 → 15:55:00; 15:55:00 → Wednesday 09:00:00; Friday 15:57 → Monday 09:00:00; Saturday 10:00 → Monday 09:00:00 |
| Watch (Fork calls O, P) | Targets BANKNIFTY and NIFTY at `NSE_INDEX`, the gate open, connected, both sent. 09:20, NIFTY's last arrival 09:19:30: `stale_runs` 1, `revived` `["NIFTY"]`, no frame sent. 09:25, still: `reconnected` true, `stale_runs` 0, after reconnect frames `authenticate`, `subscribe BANKNIFTY`, `subscribe NIFTY`. A NIFTY tick at 09:24:50 instead: `stale_runs` 0 at 09:25. Age exactly 15.0 s with `stale_after_secs` 15: not stale; 15.001: stale. At 09:05 (before 09:15): `closed` `["BANKNIFTY: before_market", "NIFTY: before_market"]`, no frame, `stale_runs` 0 |
| Reference (Fork call N) | `reference_due`: 09:04:59 false; 09:05:00 true; recorded true → false; Saturday 09:05 false. A recorder raising `MarketReadFailed` at 09:05:00: one WARNING, a second attempt at 09:06:00; success then: no attempt at 09:07:00. Its facts are written on the main thread (the store's thread id equals `serve`'s) |
| Unsealed windows (R-1) | Instrument NIFTY, ticks in windows 09:30, 09:31 and 09:32, BANKNIFTY ticks in 09:31; seals: NIFTY 09:30 revision 1, NIFTY 09:31 revision 1 at a sequence above `through`: `unsealed_windows("NIFTY", through=…)` → `[09:31, 09:32]` as `utc` text (`2026-11-03T04:01:00…`, `2026-11-03T04:02:00…`), BANKNIFTY's absent; the SQL reads no `payload` column (the statement text, asserted). `next_wake` at 09:32:30 with lag 7 → 09:31:07 (the 09:31 window's confirmation, earlier than the 09:33:00 minute) |
| Main loop | A batch offered at 09:30:03 is committed by the next iteration: one spot record and one `covered` row; `run_once` raising `ValueError` once: one ERROR, `faults` 1, the next wake commits the kept ticks; the heartbeat parses with `format` `at-market-heartbeat/1` |
| A fault waits a minute (R-2) | At 09:30:10, `run_once` raising `ValueError` with an unsealed window whose confirmation (09:30:07) has passed: the next `run_once` is at 09:31:00, not at once; `next_wake` raising `RuntimeError` at 09:30:10: one ERROR, the next run at 09:31:00; a batch offered at 09:30:20 still ends the wait at 09:30:20 |
| Stop (R-3) | A real `OpenAlgoTickSocket` over a `FakeSocket` that is connected and sends nothing, a reference thread blocked on a `_HandOffStore` write, a batch queued: `stop.set()` at 09:30:05 → `socket.close()` is the first call; the ticks thread ends without waiting for `KEEPALIVE_SECS`; the blocked write's future raises `HostStopping`, and a `submit` after the stop raises it too; a poll thread stubbed to hang is joined for `market.http_timeout_ms`, then one WARNING; the queued batch is committed, `store.close` runs and `serve` returns 0. The same with that last commit raising: `store.close` still runs and the heartbeat reads `failed` |

**`tests/integration/test_openalgo_contract.py`, the source and socket:**

| Group | Cases |
|---|---|
| Gate | Row NSE 09:15–15:30: 09:14:59.999 `(False, "before_market")`; 09:15:00 open; 15:30:00 open; 15:30:00.001 `(False, "after_market")`. `NSE_INDEX` reads the NSE row. No row on Tuesday `holiday`, on Saturday `weekend`. A failing timings read then a success: `(False, "unknown")`, then open; three asks the same day after a success: one `/api/v1/market/timings` call |
| Socket | `ws_url`: `http://127.0.0.1:5000` → `ws://127.0.0.1:8765`; `https://oa.example.test` → `wss://oa.example.test/ws`; override `ws://h:9000` kept. Seven failed connects: waits 1, 2, 4, 8, 16, 30, 30; a connect then a failure: the next wait 1. 20 s silent: one ping; 20 s more: the loop ends `keepalive`; a pong in between: it stays. `reconnect()` connects again with no wait, and right after it returns `connected` is false and `sent` empty (R-7) |
| Reads only | Over a poll of both instruments with `greeks` on, a watch and `reference_reads`: every endpoint `FakeHttp` saw is in the eight named; every frame the socket sent has `action` `authenticate` or `subscribe` |

**`tests/unit/test_strategy_invocation.py`, `serve` (Fork call Q):** policy lag 7, `pass_secs` 20, started 15:29:40: passes at 15:29:40, 15:29:47, 15:30:07, then `serve` returns 0. Started 15:35:00: one pass, return 0. `alive()` false: the pass is faulted, no store row changes, the next pass runs on schedule.

**`tests/integration/test_unix_channel.py` (PRF-SEC-05's file):**

| Group | Cases |
|---|---|
| `ChannelKernel` (any platform, a fake client) | `alive`: `answered` → True; `ChannelRefused("missing")`, `ChannelAmbiguous("send")`, outcome `refused` → False. `publish` `{"digest": "ab"*32}` → that text; `ambiguous` → `KernelUnavailable`. `record_decision` `{"kind": "answer", "answer": "recorded", "replayed": false}` → `"recorded"`; a refusal wire → the equal `Refusal`. `submit` an outcome wire (`acknowledged`, `committed`, `{"entry": "B1"}`, attempt 1, sent) → the `Outcome` with `domain` `None`. `command_status` `{"status": null}` → `None`; a status wire `WORKING` → the equal `CommandStatus` |
| Cognition operations (Linux) | From the cognition peer: `resolve_intent` of an unknown ref → `{"intent": null}`; of a published intent → round-trips equal; `review_binding` for a session bound with `ai_mode` `observe` → the seven fields; `record_review` → the same answer as in process. From a strategy peer: each of the four → `SEC-R10` `role`. From the cognition peer (R-4): `alive` and `publish` answered; `submit`, `record_decision`, `record_unavailable` and `command_status` → `SEC-R10` `role` |
| Review socket (Linux) | Strategy peer, `ai_mode` `off`: `request` → `None`, nothing recorded; the reply's `contract` is `review-channel/1` and the frame sent carried `"projections": {}` (R-5). A frame with contract `kernel-channel/1` → `SEC-R11 contract`; an unlisted uid → `SEC-R12 uid`, both from `_admit`. Another op → `SEC-R11 op`. **Two at once (R-6):** a producer stub whose `request` blocks on a barrier of 2; requests for intents A and B from two threads both enter `request` (the barrier releases) and both answer; two requests for A: the second enters only after the first returns. With the real producer over a `RecordStore` under `tmp_path` and `ai_mode` `observe`, two concurrent requests for A leave one `review_request:A` record and one review recorded with the kernel. No cognition socket: `ChannelRefused("missing")`, the host journals `review_request_failed` and the kernel answers `not_required` |
| Strategy host against a kernel subprocess (Linux) | Step 3's `kernel_child` serving the channel; SLICE-09's in-process NOTHING scenario run over `ChannelKernel`: the same host store rows and kernel `decision` rows as in process. The child killed: the next pass is faulted and changes nothing |

**Others.** `tests/contracts/test_capabilities.py`: the market composition and host never construct `OpenAlgoAdapter` (its `__init__` patched to raise); a strategy start holds `Secrets(())`, and in a subprocess `autonomous_trading.adapters.openalgo` is not in `sys.modules` after composing. `tests/integration/test_operator_routes.py`: `POST /ticks/watch` → 200 with `TICKS_WATCH_NOTE`. `tests/unit/test_settings_resolver.py`: the five fields ship `null`; the required-field rows above.

### Break checks

Each applied with its anchor checked first, one at a time, restored and checked by md5:

| Change | Test that must fail |
|---|---|
| `market/ingest.py`: the poll thread's next target from `started` | Poll schedule (09:32 polled late) |
| `market/ingest.py`: `next_watch` allows hour 16 | Watch schedule |
| `market/ingest.py`: reconnect after one stale run | Watch (09:20 reconnects) |
| `market/ingest.py`: the reference read on Saturday | Reference |
| `market/ingest.py`: `serve` returns without the last `run_once` | Stop (queued batch) |
| `market/store.py`: `unsealed_windows` drops `AND s.seq <= ?` | Unsealed windows (09:31 missing) |
| `market/ingest.py`: after a fault the wait is `next_wake` | A fault waits a minute |
| `market/ingest.py`: stop joins before `socket.close()` | Stop (the ticks thread waits) |
| `market/ingest.py`: `submit` futures left pending at stop | Stop (`HostStopping`) |
| `adapters/openalgo.py`: `reconnect` leaves `connected` true | Socket (R-7) |
| `adapters/unix_channel.py`: cognition given `ROLE_OPS["service"]` too | Cognition operations (`submit` answered) |
| `adapters/unix_channel.py`: `ReviewCore` replies with `CONTRACT` | Review socket (reply contract) |
| `adapters/unix_channel.py`: one lock for every `intent_ref` | Review socket (two at once: the barrier never releases, the test times out as a failure) |
| `adapters/openalgo.py`: a failed timings read cached | Gate (`unknown` then open) |
| `adapters/openalgo.py`: `stale` with `>=` | Watch (15.0 s) |
| `adapters/openalgo.py`: backoff not reset after a connect | Socket |
| `adapters/openalgo.py`: `subscribe` resends a sent key | Watch (no frame at 09:20) |
| `adapters/openalgo.py`: the source calls `placeorder` | Reads only |
| `bootstrap.py`: `alive()` true on `ambiguous` | `ChannelKernel` |
| `bootstrap.py`: `submit` returns `None` on `ambiguous` | `ChannelKernel` |
| `adapters/unix_channel.py`: the four operations open to every service peer | Cognition operations |
| `strategies/worker.py`: `serve` checks the close before the pass | `serve` (no 15:30:07 pass) |
| `interfaces/api.py`: row 17 routed | `test_operator_routes.py` |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/market/ingest.py` | `MarketLoop.poll`, `run_once(polled=, poll=)`, `next_wake` over `unsealed_windows`, the constants and schedule functions, `MarketHost`, `HostStopping`, `watch_once` (a market-spec module; reported to it) |
| `src/autonomous_trading/market/store.py` | `_Reads.unsealed_windows` (a market-spec module; reported to it) |
| `src/autonomous_trading/adapters/openalgo.py` | `market_open`, `last_arrival`, `stale`, `auth_frame`, `OpenAlgoTickSocket`, `ws_url` |
| `src/autonomous_trading/adapters/unix_channel.py` | The decoders, the four cognition operations, `PRINCIPAL_OPS`, `_admit`, the per-`intent_ref` locks, `KernelChannelClient(contract=, reply_timeout_s=)`, `ReviewCore`, `ReviewChannelClient`, `REVIEW_CONTRACT` (SLICE-10's module; reported to the security spec) |
| `src/autonomous_trading/bootstrap.py` | `ChannelKernel`, `ChannelReviews`, `ReviewBinding`; the market, strategy and cognition `run` paths; the required fields |
| `src/autonomous_trading/strategies/worker.py` | `StrategyHost.serve` |
| `src/autonomous_trading/settings/schema.py`, `src/autonomous_trading/resources/defaults.yaml` | The five fields; `channel`'s scope; `CONTRACTS["review"]` |
| `src/autonomous_trading/interfaces/api.py` | Row 17 mapped, `TICKS_WATCH_NOTE` |
| `tests/unit/test_market_ingest.py`, `tests/integration/test_openalgo_contract.py`, `tests/unit/test_strategy_invocation.py`, `tests/integration/test_unix_channel.py`, `tests/contracts/test_capabilities.py`, `tests/integration/test_operator_routes.py`, `tests/unit/test_settings_resolver.py`, `tests/conftest.py` | The groups above; `stub_stop`, `FakeSocket`, `FakeHttp` |

No new file and no new tree delta.

### Completion conditions (step 3a)

* **Targeted tests,** twice in a row: the eight test files above, and those that run the changed modules: `tests/integration/test_market_port.py`, `tests/unit/test_market_view.py`, `tests/recovery/test_crash_boundaries.py` (CP-M1…CP-M3, CP-W1…CP-W5, CP-C1, CP-C2), `tests/integration/test_review_producer.py`, `tests/integration/test_owner_api.py`, `tests/contracts/test_installed_artifact.py`. The Linux-only groups run once on the EC2 development checkout through `scripts/safe_pytest.py`; on Windows they report their skip.
* Every break check fails its listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file; `yaml.safe_load` on `resources/defaults.yaml`.
* `git diff --stat` against the step's start names only the files above.

### Step 3a as built

**Built** in OA_NEW `3529f24` on `slice-08`, one commit, the 17 files of the Files table, after two step 3 commits the full suite asked for: `ca530b7` (`kernel/admission.py` read `market.sources.IST`, which `tests/unit/test_market_windows.py`'s layering guard forbids; it now keeps its own IST constant, and the guard is unchanged) and `829b038` (the missing `serve_kernel` `SIGTERM` case in `tests/contracts/test_capabilities.py`, Linux only, and the statistics-through-admission row in `tests/unit/test_admission_checks.py`, where another strategy's admitted entry is the desk's open structure and a new entry is refused `ADM-R13` with `Desk already has an open option structure (1/1)`).

**Run.** Windows, Python 3.14 (`.venv-slice01`), through `scripts/safe_tests.py`: the completion conditions' files plus `tests/unit/test_market_windows.py`, `tests/integration/test_kernel_host.py`, `tests/unit/test_admission_checks.py` and `tests/contracts/test_operator_ui_routes.py`, twice in a row after the last source change: 813 passed and 12 skipped each time. Linux, on the EC2, once, in a throwaway folder with its own Python 3.13 venv built by `uv` from `requirements.lock` (removed afterwards): `tests/integration/test_unix_channel.py` and the two Linux-relevant `tests/contracts/test_capabilities.py` cases, 37 passed, none skipped. The 22 break checks (`s11d_breaks.py` in the session scratchpad) each fail a listed test, and every file was restored (md5). `ast.parse` passes on all 16 edited Python files; `yaml.safe_load` on `resources/defaults.yaml`. Not run: the full suite.

**Differences from the text above**, each smaller than a decision:

| Text | As built | Why |
|---|---|---|
| `_admit(…) -> tuple[Peer, dict] \| Refusal` | Returns the module's own `_Refused` (code and reason), as `ChannelCore` already raised internally | The refused reply needs the code and the label, not a ledger `Refusal` |
| `REVIEW_REPLY_TIMEOUT_S = MAX_REVIEW_SECONDS + REPLY_TIMEOUT_S` | `adapters/unix_channel.py` keeps its own `MAX_REVIEW_SECONDS = 300.0`, labelled as `cognition.review`'s; a test asserts 360.0 | The channel client loads no module outside `contracts` (`test_boundary`) |
| `KernelChannelClient` gains two keywords | Also four methods, `resolve_intent`, `review_binding`, `resolve`, `record_review`, one per new operation | One client call per method, as the six service operations |
| `MarketHost(…)` | Also `wait=` (a test seam for the main thread's wait) and `start_threads()`; the services are `bootstrap.serve_market`, `serve_strategy` and `serve_cognition`, reached from `run` for a production profile | Wiring; no new behaviour |
| `OpenAlgoTickSocket(…, connect=websocket.create_connection)` | `connect(url, timeout)`; `keepalive_secs` keyword (default 20); a `waits` list and `state()` for the heartbeat | Test seams and the heartbeat's `ticks` object |
| The review peers are the `strategy:` service peers | Filtered on `principal.value` | `Peer.principal` is a `Principal` |
| `ReviewChannelClient.request` raises on a reply other than `answered` | It raises `ChannelAmbiguous` with the outcome | The host's `_request_review` treats any exception as a failed request, as built |
| Row 17 mapped | `ticks.watch` also leaves `ROUTED`; `tests/integration/test_operator_routes.py`'s re-listing row 17 reads `mapped` | One kind per row |
| Tests: the watch's reconnect re-sends `authenticate` and both subscriptions | The watch group uses a stand-in socket; the re-send after a reconnect is proved in the socket group (`test_authenticate_resubscribe_and_reconnect`) | One owner per behaviour |
| Tests: unsealed windows `[09:31, 09:32]`, `next_wake` 09:31:07 | `[09:31, 09:32]` at `through` and `[09:32]` at the head; `next_wake` at 09:32:30 is 09:33:00 (the minute before 09:32's 09:33:07) | The text's two expectations used two different heads |
| Tests: the stop group through `serve` | The stop group calls `_stop_sequence` directly, with the socket connected and silent and a write blocked in `_HandOffStore`; the reference writer thread is a daemon | `serve`'s loop would run the queued write before stopping; a non-daemon writer hung pytest under the break check that leaves futures pending |
| Tests: the strategy host against a kernel subprocess | Linux: `ChannelKernel` and `ReviewChannelClient` over sockets served in the test process (the strategy's grant issued first, as `test_services` does); the cognition operations and the review core run on every platform through `handle` | `tests/conftest.py` has no kernel child; the in-process server exercises the same socket, peer and frame path |
| Tests: `serve_kernel`'s `SIGTERM` releases the lease `clean` | Exit 0 and the heartbeat `stopped` with `exit_code` 0; the lease is `None` or `clean` | The child binds no account, so it takes no lease |
| `tests/conftest.py` | `prod_profile` gains `market.ticks` (legacy's 10, 1, 30, 15, labelled synthetic) and `paths` (`run`, `evidence`) | The new required fields |
| EC2 runs through `scripts/safe_pytest.py` | `~/at-dev`'s runner imports legacy's `src.config` and runs `~/at-dev/.venv`; OA_NEW's own `scripts/safe_tests.py` refuses below 2012 MB available, and the host had 1.84–1.93 GB. The run used `systemd-run --user --scope` with `MemoryMax=1G`, no swap, `CPUQuota=50%`, `nice 19` and idle I/O, one run at a time | The coordinator's throwaway venv, with the legacy runner's limits |

**Left in OA_NEW, untracked:** the `build/` directory from step 2's first runs (unchanged; deleting it is the owner's call).

**Carried, unchanged:** every item under "Open, carried" above.

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

Deepened after steps 3a and 6 are built (it renders and starts the market, strategy and cognition loops step 3a builds): the configuration spec's [release transitions](../../design/configuration-artifacts-release.md#release-transitions) and [activation boundary](../../design/configuration-artifacts-release.md#the-activation-boundary) (Fork call 1); the runtime spec's [installer](../../design/runtime-isolation-observability-deployment.md#installer-deployinstallpy) and [units](../../design/runtime-isolation-observability-deployment.md#units-deploysystemd).

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
