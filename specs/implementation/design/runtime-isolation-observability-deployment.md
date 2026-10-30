# Runtime isolation, observability and deployment

* **Status:** proposed (package spec), deepened when SLICE-11 started (2026-10-30) from the stub this file was. Not yet reviewed by EGM; it is reviewed with the [SLICE-11 slice file](../plan/slices/SLICE-11-packaging-release-supervision.md). Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `kernel/host.py` (proposed tree delta T-70) | [The kernel host](#the-kernel-host-kernelhostpy) |
  | `operations/supervisor.py` | [The supervisor](#the-supervisor-operationssupervisorpy) |
  | `operations/observer.py` (proposed tree delta T-71), process only | [The observation route](#the-observation-route) |
  | `operations/isolation.py`, `scripts/isolated_work.py`, `scripts/safe_tests.py` | [Storage classes](#storage-classes-operationsisolationpy), [Aggregate envelopes](#aggregate-envelopes-operationsisolationpy), [Isolated work](#isolated-work-scriptsisolated_workpy-scriptssafe_testspy) |
  | `operations/telemetry.py` | [Telemetry](#telemetry-operationstelemetrypy) |
  | `operations/verification.py` | [Measurement](#measurement-operationsverificationpy) |
  | `deploy/install.py` | [Installer](#installer-deployinstallpy) |
  | `deploy/systemd/*`, with `at-observer.service` (T-72) and `at.slice` (T-79) proposed | [Units](#units-deploysystemd) |

* **Not specified here:** the observation mediator's behaviour (allowlist, refusals) is in the [execution-domain spec](execution-domain-and-observations.md#observation-enforcement-a06-f2); the backup content, restore and send-lease store are in the [migration spec](migration-recovery-rollback-continuity.md); the release transitions the installer executes are in the [configuration spec](configuration-artifacts-release.md#release-transitions).
* **Consumes:** `Coordinator.run_pass`, `next_wake`, `wait_woken`, `in_flight` ([dispatch spec](dispatch-and-coordination.md)); `ObservationLoop.start`, `stop`, `health`; `Recovery.tick`, `shutdown` ([sessions spec](sessions-authority-lifecycle.md#send-lease-kernelrecoverypy)); `LedgerReader` ([ledger spec](ledger-and-atomic-transaction.md)); `kernel.protection.classify` (PRF-PRT-13) and `kernel.reconciliation.assess`; the participant contract and `bootstrap` ([configuration spec](configuration-artifacts-release.md#the-participant-contract-settingsschemapy)).
* **Master anchors:** ATA-01 (`README.md:452`), A03-F1 (`README.md:914`), A03-F4 (`README.md:920-922`), A03-F5 (`README.md:924`), the initial deployment paragraph (`README.md:927`), A09-F1 (`README.md:929`), A09-F2 (`README.md:931`), A09-F3 (`README.md:933`), A09-F4 (`README.md:935`), D09 (`README.md:847`), A06-F2 (`README.md:865`), A06-F3 (`README.md:867`), the jobs row (`README.md:1156`), the control rows (`README.md:1268-1270`), the [activity-to-dependency matrix](../../../README.md#activity-to-dependencyisolation-matrix) (`README.md:1284-1306`); the acceptance rows (`README.md:1239-1240`, `README.md:1247`, `README.md:1256`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root. `monitoring/` is legacy's top-level monitoring package. The built target code cited as `OA_NEW` is at `536f857`.

## Overview

**In plain words.** Today the trading service, the monitor, the market recorder and the research workers are all started by systemd straight from the checkout, and almost all of them load one shared settings file that holds the broker key. The monitor reads the broker's books with the same client that can place orders. The new design runs the kernel, the one process that may send orders, as an always-on service. A small loop inside it does a full pass whenever something happens, and otherwise on today's schedule: every 20 seconds, lined up with the moment each minute's bar becomes final (at :07, :27 and :47 past each minute). A separate supervisor reads the ledger read-only and the broker read-only. It says, for each open position, whether its protection is held at the broker, depends on the kernel, or is uncertain, and it raises an alert. It cannot send: it never gets the broker key or the code that sends. Tests, research and backups run in one capped group that cannot touch the live files or the key. Diagnostics are dropped rather than ever slowing trading. Every timing or capacity number that nobody has measured stays unset until it is measured on recorded sessions and the owner approves it.

## The problem

* **The observer can trade.** Legacy's monitor reads OpenAlgo's books through `execution_client`, the trading-capable client (`monitoring/sources.py:294-313`), and its unit loads the shared settings file (`deploy/systemd/at-monitor-v2-sweep.service:10`). Only convention keeps it from placing orders (A03-F4, A06-F2).
* **One credential file for everything.** The authority (`deploy/systemd/at-tier1-authority.service:32`), the gateway (`deploy/systemd/mcp-gateway.service:40`), the strategy session (`deploy/systemd/at-strategy.service:37`) and the monitor load the same file. Only the backup strips the key, by environment edits (`deploy/systemd/at-backup.service:23-27`).
* **No kernel loop yet.** The target's dispatch, observation and protection run only when a caller calls `Coordinator.run_pass` (OA_NEW `kernel/coordinator.py:399-479`). SLICE-05, SLICE-06 and SLICE-07 left the process that calls it to this slice ([SLICE-06 Excluded](../plan/slices/SLICE-06-protection-and-safety.md)).
* **Isolation by the clock.** Legacy's test launcher refuses the live checkout in session (`scripts/safe_pytest.py:141-160`) and only warns when it cannot cap memory (`:280-285`). The master replaces that with verified isolation (`README.md:1269-1270`).
* **No aggregate envelope.** Legacy caps research in one slice (`deploy/systemd/at-research.slice:4-12`) and per-unit envelopes are "empty by default" (`deploy/unit_envelope.py:14-18`). Tests, builds and backups share the host with no combined limit (A09-F2).
* **Disk reserves are checked only at the door.** The deploy refuses below 2048 MB free (`deploy/deploy_tier1.py:517-543`), and the research claim below 2 GiB (`src/analysis/jobs/policy.py:14`, `:177-188`). Nothing watches growth afterwards, and no table says what each store does when its disk is full (A09-F3).

## Goals

* An independent supervisor with bounded read-only ledger access and enforced read-only broker observation; it records assessments and never settles or sends (REQ-OPS-001).
* Progress measured against demand, protection classified, process failure and host failure kept apart (REQ-OPS-002).
* Aggregate envelopes and admission for optional work, descendants included (REQ-OPS-003).
* Storage classes with capacity separation and truthful disk-full behaviour (REQ-OPS-004).
* No unmeasured capacity, latency or RPO/RTO number (REQ-OPS-005).
* No hard memory cap on the kernel or the market recorder (REQ-OPS-006).
* Bounded, asynchronous, drop-capable telemetry (REQ-OPS-007).
* Isolated tests and work at any time (REQ-OPS-008).
* A kernel host loop that drives dispatch, observation and protection at least as often as legacy's live host, and stops truthfully (REQ-OPS-009).
* Each service holds only its own credentials, enforced by the operating system (REQ-OPS-010).

## Non-goals

* **No new restart or emergency behaviour.** No watchdog kill of a frozen kernel, no automatic failover, no emergency sender (A03-F5). Restart settings are legacy's (Fork calls below).
* **No off-host alerting or failover.** Host loss is not detected by a same-host supervisor (A03-F5); RTO and failover authority stay open (POL-047).
* **No telemetry backend.** OTel, Logfire and the like are "interface now, adopt later" (`README.md:942`); the first release writes a local file.
* **No change to who may act.** The supervisor proposes; only the owner and delegated humans act, through the operator interface (Q-014).

## Requirement keys

<a id="requirement-keys-pointers"></a>

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-OPS-001 | The independent supervisor reads committed ledger state through bounded, read-only access, plus enforced read-only broker observations; it records assessments and never settles or sends | A03-F4 (`README.md:920-922`); REQ-PRT-011 |
| REQ-OPS-002 | Progress is measured against demand; protection status is classified; process failure and host failure are separate cases | A03-F5 (`README.md:924`) |
| REQ-OPS-003 | Aggregate host resource envelopes and admission for optional background work, including descendants, from measurements | A09-F2 (`README.md:931`) |
| REQ-OPS-004 | Storage classes (authoritative, required evidence, reproducible, scratch) with capacity separation; truthful disk-full behaviour | A09-F3 (`README.md:933`) |
| REQ-OPS-005 | Measurement before optimization; no invented capacity, latency or RPO/RTO numbers | A09-F4 (`README.md:935`) |
| REQ-OPS-006 | No hard memory cap on the kernel; soft caps on optional services | POL-052 |
| REQ-OPS-007 | Telemetry is bounded, asynchronous and drop-capable; it never blocks or authorizes money | `README.md:35`, `README.md:942` |
| REQ-OPS-008 | Tests run isolated with their own stores, no broker key and resource limits, at any time | REQ-XC-006; POL-051; §7 jobs row (`README.md:1156`) |
| REQ-OPS-009 | The kernel host runs bounded passes that drive dispatch, observation and protection inside the kernel process, at least as often as legacy's live host, and stops truthfully | ATA-01 (`README.md:452`); A03-F1 (`README.md:914`) |
| REQ-OPS-010 | Each service holds only its own credentials, enforced by the operating system rather than by convention | D09 (`README.md:847`); A06-F3 (`README.md:867`) |

## Critical user journeys

### CUJ-OPS-1: The kernel freezes with an open position

At 11:40 the kernel process stops responding (in the test, `SIGSTOP`). Its heartbeat stops updating. The SL-M stop rests at the broker. At its next cycle the supervisor reads a consistent ledger head, reads the books through the read-only route, and finds the heartbeat older than `supervisor.stall_secs` while a position is open. It records `kernel_stalled`. It classifies the stop `broker_held` (resting at its confirmed level in a fresh observation) and the target and delta exits `runtime_dependent`, not running. It alerts once and names the owner's options. No process sends anything. This is PRF-PRT-06's "kernel frozen" half.

### CUJ-OPS-2: A broker call hangs

An entry's send hangs on the account's worker thread. Passes continue on the writer thread: the observation drain, protection and the deadline sweep run (A03-F1). The heartbeat lists the in-flight call with its age. Past `adapter.http_timeout_ms` the supervisor reports it (F-D6). The adapter's total deadline then returns `ambiguous`, as built (SLICE-07).

### CUJ-OPS-3: Tests during the session

At 10:30 a developer runs `scripts/safe_tests.py` in a separate checkout on the trading host. The launcher starts pytest in a transient unit inside `at.slice`, with the live roots inaccessible, no network unless asked, and no credential. No calendar is consulted. If the aggregate envelope has no room, the run is refused with the reason, and nothing live is slowed.

### CUJ-OPS-4: Scratch fills the disk

A research job writes until free space on the filesystem that also holds the ledger reaches `storage.critical_reserve_bytes`. The supervisor stops `at.slice` (every optional unit) and alerts; nothing is deleted. Ledger commits continue. If the critical store itself fails to write, the ledger's commit failure is truthful: the kernel exits on `CommitFailed`, as built (PRF-LED-07).

### CUJ-OPS-5: A restart after a code error

At 10:05 an unexpected exception escapes a pass. The host stops dispatch and exits with code 70 without releasing the send lease. systemd restarts the unit after 60 s, as legacy restarted its session. `bootstrap` sees that this ledger's previous epoch still holds the lease, unreleased and unexpired, so it waits until the lease expires. Recovery then runs. The routine checks pass (a crash, Q-009), within `recovery.routine_advance_limit`, and the kernel reaches `OPERATING`. For those 60 s plus the rest of the lease, the trail does not move and no tick exit runs; the broker-held stop protects the position, as it did when legacy's session restarted.

## Technical plan

### The kernel host (`kernel/host.py`)

* **What it is.** The kernel process's main loop, on the writer thread. `bootstrap`'s `at-kernel` entrypoint composes the kernel (recovery runs at composition, `bootstrap.py:163-168`), then calls `serve`.

  ```text
  serve(comp, *, stop: threading.Event, pass_interval_secs: int,
        heartbeat: Path, telemetry: Telemetry | None) -> int     # the exit code
  submit(fn) -> Future        # any thread: run fn on the writer thread before the next pass, and wake
  ```

* **Start.** `comp.observation_loop.start()` (SLICE-07 left it to the host, `kernel/reconciliation.py:779-782`).
* **Each iteration:**
  1. `comp.recovery.tick()`: lease renewal while `OPERATING` (`kernel/recovery.py:392-425`);
  2. the queued hand-offs from `submit`, in order. This is the hand-off of other threads' decisions to the writer thread that SLICE-05 left here: the operator channel and the strategy-worker returns call `submit` (SLICE-09, SLICE-10);
  3. `comp.coordinator.run_pass()`;
  4. the heartbeat (below), then telemetry's pass record;
  5. wait: `comp.coordinator.wait_woken(min(seconds_to_next_pass(now), seconds until next_wake()))`.
* **Fork call (keep legacy's phase-locked cadence).** Besides every wake (a worker return, an observation arrival, a hand-off, a deadline), a pass runs on legacy's schedule: every `host.pass_interval_secs` (first-release value **20**), phase-locked to the bar confirmation point `market.bar_confirm_lag_secs` (7 s, POL-019) after each minute. With 20 and 7 the scheduled passes land at :07, :27 and :47; a period that does not divide the minute still gets a pass at every confirmation point. `seconds_to_next_pass(now) = max(0.05, min(to_close, to_grid))` with `since = (now - lag) mod 60`, `to_close = 60 - since`, `to_grid = period - (since mod period)`, ported unchanged from legacy (`scripts/run_framework_live.py:3431-3450`, the owner's decision of 16 October 2026; used at `:7400`; default poll `:7472`; the unit passes `--poll 20`, `deploy/systemd/at-strategy.service:51`). Legacy's trail and latch ran on these passes (`scripts/run_framework_live.py:5248`), and protection is level-triggered on each pass (SLICE-06 step 2), so this keeps today's timing. The kernel host does not wait for a window's seal; the strategy host does (SLICE-09). Both values are configurable settings, not constants.
* **The heartbeat** is a small JSON file in `paths.run`, replaced atomically (`os.replace`) after each pass: `{pid, epoch_id, stage, settings_revision, bundle_digest, pass_seq, pass_ended_utc, pass_ms, ledger_head, in_flight: [...], observation_health: {account: ...}, unrunnable_legs}`. `in_flight` is `Coordinator.in_flight()` (`kernel/coordinator.py:526-536`) and `observation_health` is `ObservationLoop.health` (`kernel/reconciliation.py:809-812`). It is diagnostics: nothing in the kernel reads it back, and it authorizes nothing.
* **Stop** (`SIGTERM`, or the operator's stop through the unit):
  1. set `stop`; no further `run_pass`, so nothing new is claimed;
  2. `comp.observation_loop.stop()`;
  3. `Coordinator.drain_returns(timeout)`, a method this slice adds: it commits the worker returns already queued and claims nothing. It waits while a worker is busy, up to `adapter.http_timeout_ms` plus one commit, because the adapter's total deadline bounds every call (SLICE-07);
  4. `comp.recovery.shutdown(clean=True)` releases the leases `clean` (`kernel/recovery.py:427`), then the writer closes; exit 0.

  If systemd's stop timeout kills the process first, a call still in flight is `IN_FLIGHT` in the ledger and recovery treats it as after a crash, as built. Legacy's authority waits the same way (`deploy/systemd/at-tier1-authority.service:35-37`).
* **An unexpected exception** from a pass or a hand-off (anything but the ledger's `CommitFailed` and external-write paths, which already exit `abnormal`): the host records nothing further, writes the heartbeat with `failed` if it can, and exits with code 70 **without** releasing the leases, so the next start sees a crash. This closes SLICE-06's carried L2/L4/L7 gap: an exception escaping `drain` stops the process instead of continuing to send.
* **Fork call (keep legacy's restart of the loop that trailed).** In legacy the loop that ran the trail, the latch and the entries was the strategy session (`deploy/systemd/at-strategy.service:51`), not the authority, which only executed sends. The kernel host takes the session's restart values: on failure only, after 60 s, at most 3 starts in 900 s (`deploy/systemd/at-strategy.service:23-26`, `:55-56`). On a restart, `bootstrap` reads the lease store before recovery: when this ledger's previous epoch holds a bound account's lease, unreleased and unexpired, it waits until `expires_at` (at most `recovery.lease_secs`). Recovery's routine check 6 then sees an expired lease (a crash) and can advance under Q-009, as legacy's driver resumed by itself after a failure (`deploy/systemd/at-strategy.service:52-54`).
  * **The gap this keeps:** after a crash, no trail move and no tick exit for 60 s plus whatever remains of the lease; the broker-held stop protects positions meanwhile (A03-F5), as during legacy's 60 s restart. The lease adds to legacy's delay; how much is TASK-S11-07's measurement of `recovery.lease_secs`, reported to the owner with it.
  * **Two limits, the smaller wins:** systemd gives up after 3 failed starts in 900 s; `recovery.routine_advance_limit` falls back to a human after that many routine advances in 24 hours (sessions spec). Either one leaves the kernel waiting for a person. The owner approves `routine_advance_limit` knowing that systemd allows at most 3 automatic restarts per 15 minutes.
  * **Starting at boot.** Legacy's session was not started at boot (`deploy/systemd/at-strategy.service:9-11`), but the authority was (`deploy/systemd/at-tier1-authority.service:45-46`). The kernel is the authority's successor and starts at boot; it opens no financial session by starting, because sessions open only on the calendar (sessions spec), so a 02:00 reboot starts no trading. The strategy host keeps the session's timer start (SLICE-09).
* **Fork call (no watchdog).** Legacy's authority unit has no watchdog (`deploy/systemd/at-tier1-authority.service:27-43`). The target adds none: a frozen kernel is reported by the supervisor, and a human acts. A watchdog kill is listed as a spec-only improvement.
* **Threads** are as built: the writer thread is the host's main thread; one dispatch worker and one observation reader per account. Telemetry's writer is the only thread the host adds.

### The supervisor (`operations/supervisor.py`)

* **Composition** (`bootstrap`, participant `supervisor`): a `LedgerReader` (read-only open, `kernel/ledger/runtime.py:71-82`); the read-only observation route ([below](#the-observation-route)); its own `EvidenceStore` root (`kernel/ledger/evidence_store.py`, storage class *required evidence*); the operator alert route (SLICE-10); a wall clock. It never composes `LedgerWriter`, `Coordinator`, the authority channel's command client or the OpenAlgo order half. PRF-PRT-14 proves that.
* **A cycle every `supervisor.poll_secs`** (refusing, measured; legacy's monitor polls every 90 s in session and 600 s outside, `monitoring/service.py:374-377`, as evidence only):
  1. **Ledger read model** (A03-F4). One read transaction, `LedgerReader.snapshot(budget_ms)`, a method this slice adds to the reader: a single `BEGIN`…`COMMIT` with an SQLite progress handler that interrupts the query at `supervisor.read_budget_ms`. Inside it: the head (`sequence`, `event_hash`) and the schema check; open sessions; positions; protection legs (the protection spec's leg read); commands `ADMITTED`, `IN_FLIGHT`, `UNCERTAIN` or `WORKING`, with their ages; unresolved attempts; held reservations; kill, holds, latch and the latest `SAFETY_CHECK_STATE`; the recovery stage; the latest `RELEASE_BOUND`. The transaction ends before any broker call. A budget overrun, a busy timeout or an unknown schema is a recorded `ledger_gap` with its reason, never a guess. A raw copy of the database file is never read (`README.md:920`).
  2. **Kernel liveness:** the heartbeat; the unit's `ActiveState` and `MainPID` (`systemctl show`); the kernel's identity record.
  3. **Observations:** `orderbook`, `tradebook` and `positions` for each bound account through the read-only route, within `supervisor.max_requests_per_minute`. Account, broker and domain are checked on each response; an analyzer-domain observation never matches a live obligation and is reported `unknown` (ATA-06). Simultaneous calls are not treated as one atomic snapshot (`README.md:922`).
  4. **Assessment:** the shared pure `kernel.reconciliation.assess` over the read model and the observations gives matched, conflicting, unmatched and unknown effects.
  5. **Protection status** per open leg: `kernel.protection.classify` (`kernel/protection.py:375-387`): `broker_held`, `runtime_dependent` or `uncertain`, with the 60 s observation-age rule (PRF-PRT-13). When the kernel is not `OPERATING`, stalled or down, a `runtime_dependent` leg is reported "not running" (A03-F5).
  6. **Progress against demand** (A03-F5). Demand is any open position, admitted command, unresolved attempt or open session. The measures: the oldest admitted command's age; the oldest unresolved attempt's age; the heartbeat's age; each account's observation age (the kernel's, from the heartbeat, and the supervisor's own); persistence failures (a heartbeat `failed`, an `abnormal` lease release, a `CommitFailed` exit); host and unit resource pressure. The verdicts:

     | Verdict | When |
     |---|---|
     | `kernel_down` | The unit is not active, or its `MainPID` is gone: a process failure |
     | `kernel_stalled` | The unit is active, the heartbeat is older than `supervisor.stall_secs`, and there is demand |
     | `kernel_quiet` | As above with no demand: a quiet ledger is not a stall; no alert |
     | `dispatch_overdue` | A heartbeat `in_flight` entry is over its deadline (F-D6) |
     | `observation_gap` | An account's books are older than the observation age rule, or the route is down |
     | `recovery_declined` | The latest `RECOVERY_STAGE` declined the routine advance (sessions spec) |

     **Host failure is not observed:** the supervisor runs on the same host and dies with it. No alert is raised then; the broker-held stop remains. Off-host alerting depends on the open RTO and failover decision (POL-047) and is not built.
  7. **Publish, then alert** (Combined-F2). The assessment (read-model head, observations' `as_of`, verdicts, classifications, coverage gaps) is published to the supervisor's evidence store before its index line is written. An alert is raised when a subject's verdict or classification changes, once per change, with the owner's possible actions named in words. Nothing the supervisor writes releases a reservation, settles a command or grants a permission.
* **The storage reserve.** Each cycle the supervisor also runs `isolation.check_reserve()` ([below](#storage-classes-operationsisolationpy)). Its one action is to stop `at.slice` and alert; it deletes nothing (A09-F3). A polkit rule lets the supervisor's user stop that one unit and nothing else. sudo is not used: the unit runs with `NoNewPrivileges`, which forbids it. Legacy granted narrow rights the same way through sudoers (`deploy/deploy_tier1.py:942-975`).
* **Reader impact** (A03-F4: "Test reader impact on checkpoint progress, WAL growth and financial latency"). The supervisor's snapshot is measured against a kernel committing, with SLICE-02's measurement (`operations/verification.py:34-69`) extended to the supervisor's read pattern: WAL size, checkpoint completion and the kernel's commit latency, with and without the supervisor polling.
* **Deviation (from legacy):** the legacy monitor reads the books with the trading-capable client and the shared key (`monitoring/sources.py:294-313`). The supervisor never holds the trading credential or the order code (A03-F4, A06-F2; PRF-PRT-14).
* **Open: a gap against A03-F4, raised as a proposed master correction (X item) by the package coordinator.** A03-F4 says "Kernel ingestion deduplicates observations and commits accepted transitions through D15–D16" for the supervisor's outage observations (`README.md:922`). The first release does not build that ingestion. After a restart, the kernel's own observation loop reads the same books again, including the day's tradebook, and reconciles from them; the supervisor's evidence is kept for people and audit. Until the master's owner decides, this is an open gap, not a settled deviation.

### The observation route

* **Chosen by the deployment** (A06-F2, [execution spec](execution-domain-and-observations.md#observation-enforcement-a06-f2)): a native read-only credential when TASK-S07-06 proves one at the endpoint (PRF-DOM-10, owner's authorization), otherwise the mediator.
* **The mediator's process** (`operations/observer.py`, T-71; unit `at-observer.service`, T-72) is built only without that proof (TASK-S11-06). It composes `adapters/openalgo.py`'s read half for the bound accounts, serves the execution spec's allowlist on a Unix socket in its own runtime directory, and authenticates callers by the local channel's peer check (`adapters/unix_channel.py`, SLICE-10). It holds the account's broad key, so it is itself isolated (A06-F2): its unit loads that credential alone and its callers cannot read it. It keeps serving while the kernel is down.

### Storage classes (`operations/isolation.py`)

* **Every mutable root is a path field with a class** (A09-F3):

  | Class | Roots | Written by | Deletion |
  |---|---|---|---|
  | Authoritative | `paths.ledger` | The kernel only | Never |
  | Required evidence | `paths.evidence` (the ledger's evidence store), `paths.market_store`, the supervisor's assessment store, release directories' `transitions.jsonl` and receipts | Their owners | Only by a retention rule that respects every committed reference (Combined-F2); none is selected for the first release |
  | Reproducible | Release environments, built wheels, caches | The installer, builds | Allowed; rebuilt on demand |
  | Scratch | `paths.scratch`, test and research temporaries | Optional work | Allowed |

* **Retention.** The first release deletes nothing from the authoritative and required-evidence classes, as SLICE-08 built the market store. The supervisor reports their growth. A retention period is an owner decision, taken from measured growth (A09-F4).
* **Capacity separation.** Separate directories do not stop one filesystem filling (A09-F3). The first release enforces it three ways:
  1. **Admission:** `isolation.admit(work)` refuses optional work when free space on any filesystem holding an authoritative or required-evidence root is below `storage.critical_reserve_bytes`;
  2. **Watching:** each supervisor cycle runs `check_reserve()` and stops `at.slice` when that reserve is crossed;
  3. **Placement:** `paths.scratch` may be a separate filesystem, recorded in the composition. It is supported, not required; physical separation needs capacity evidence first (A09-F3).
* **Disk-full behaviour at each persistence boundary** (A09-F3), each truthful:

  | Boundary | On a write failure | Owner and proof |
  |---|---|---|
  | Ledger commit | `CommitFailed`; the kernel exits, releasing the lease `abnormal`; no send follows a failed commit | Ledger spec; PRF-LED-07 (SLICE-02 TASK-S02-04) |
  | Evidence publication | `EvidenceUnpublished`; the referencing decision is not committed | Ledger spec, Combined-F2 |
  | Market store commit | The batch rolls back; coverage `interrupted`; the next poll retries | Market spec, CP-M2 |
  | Supervisor assessment | Not published; the cycle records a counted gap and still alerts | This spec, PRF-OPS-05 |
  | Telemetry | Dropped and counted | This spec, PRF-OPS-06 |
  | Release staging | `FAILED`; the prior release untouched | Configuration spec, PRF-CFG-05 |
  | Backup staging | The migration spec's rule | Migration spec |
  | Tests and scratch | The job fails; critical stores unaffected | This spec, PRF-OPS-05 |

### Aggregate envelopes (`operations/isolation.py`)

* **One parent slice for all optional work:** `at.slice` (T-79). systemd nests slices by name, so `at-research.slice` is its child and inherits its limits; tests, isolated work, builds and backups run as transient units or services with `Slice=at.slice`. Its `CPUQuota`, `MemoryHigh`, `MemoryMax`, `TasksMax` and `IOWeight` are the aggregate envelope (A09-F2): refusing, measured (TASK-S11-07). Legacy's research-only values (`deploy/systemd/at-research.slice:5-12`, `src/analysis/jobs/policy.py:16-22`) are evidence, not values.
* **Admission.** `isolation.admit(work) -> Admit | Refusal`, called by `scripts/isolated_work.py` before it starts anything: refuses when the slice's current memory or task use plus the work's declared need exceeds the envelope less the backup's reserve, or when the storage reserve fails. A per-job limit alone does not prove combined fit (A09-F2).
* **The backup is never refused.** The backup is a required participant (configuration spec), so `admit` is never asked about it. Instead, optional work is admitted only into the envelope minus `envelope.backup_reserve.*` (the backup's measured peak memory, tasks and staging disk; refusing, TASK-S11-07), so the nightly backup always has room. The storage reserve counts the backup's staging need the same way.
* **Descendants count.** A transient unit puts every descendant in its cgroup; the slice limits apply to the sum.
* **The kernel and the market recorder are never in `at.slice`** and carry no `MemoryMax` or `MemoryHigh` (POL-052).

### Isolated work (`scripts/isolated_work.py`, `scripts/safe_tests.py`)

* **`scripts/isolated_work.py -- <command>`** runs a command in a transient unit (`systemd-run --user`, or the system manager on a production host) with:
  * `Slice=at.slice`;
  * `ProtectSystem=strict`, `ReadWritePaths=` its own work directory only, `InaccessiblePaths=` every authoritative, required-evidence and credential root of the host's composition (read from the profile);
  * `PrivateNetwork=yes` unless the work declares a network need;
  * an environment with every credential name in the participant contract removed;
  * `Nice=19`, `IOSchedulingClass=idle`, `OOMScoreAdjust=900`, as legacy's research units (`deploy/unit_envelope.py:82-83`).
* **It reports what it enforced.** On a host without a user manager or namespaces (a developer's laptop, Windows), it runs the command with the checks it can make and records `enforced: false` for each property it could not apply; it never claims isolation it did not get (`README.md:1270`). Legacy only warned (`scripts/safe_pytest.py:280-285`).
* **`scripts/safe_tests.py`** keeps its SLICE-01 rules (no broker variables, the lock, the memory check, the on-disk temporary root, low priority, `-p no:cacheprovider`, the launcher's `--basetemp` last; OA_NEW `scripts/safe_tests.py:52-80`) and runs pytest through `isolated_work.py` where it can. **No calendar check:** an isolated run proceeds at any time (`README.md:1269`; POL-051). **Deviation (from legacy):** legacy refused the live checkout in session (`scripts/safe_pytest.py:147-153`); the target's guarantee is the isolation itself.

### Telemetry (`operations/telemetry.py`)

* `Telemetry(sink, *, max_items, max_bytes)`. `emit(record)` puts a typed record on a bounded queue with `put_nowait`; when full, the record is dropped and a counter rises. One daemon thread writes to the sink. A sink error drops the record and counts it. `emit` never blocks and never raises into its caller.
* **Records are typed:** each kind declares its fields, and no free-form mapping is accepted, so no environment dump or credential can be emitted. Credential references from the settings contract are rejected by name.
* **The first sink** is a day-partitioned JSON-lines file in `paths.run/telemetry/` (scratch class: disposable). An OTel exporter is a later adoption behind the same `emit` (`README.md:942`).
* **Unbound means off.** With `telemetry.max_items` or `telemetry.max_bytes` unbound, every `emit` is a counted drop. These are budgets, so they are measured, never invented (A03-F2).
* **Nothing reads telemetry to decide.** Only `kernel/host.py` among kernel modules imports it, and no module reads the sink. An import guard proves it (PRF-OPS-06).

### Measurement (`operations/verification.py`)

* **As built:** `measure_reader_impact` (SLICE-02, OA_NEW `operations/verification.py:34-69`).
* **The record:** `Measurement(field, method, workload, environment, artifact, settings_revision, samples: {count, p50, p95, p99, max}, source_ref, at)`, where `environment` holds the host, CPU, memory, disk, Python and SQLite versions, and `artifact` the `bundle_digest` or Git SHA. It proposes no value: the owner reads it and approves a value with the release binding. The approved records' digest goes into the bundle's `measurements` field ([configuration spec](configuration-artifacts-release.md#bundle-manifest-bootstrappy)).
* **What TASK-S11-07 measures, and from what** (A09-F4):

  | Fields | Source |
  |---|---|
  | `dispatch.deadline_ms.<verb>`, `adapter.http_timeout_ms` | Broker-call durations in the recorded sessions' legacy Tier-1 ledger and order registry, copied read-only into an isolated directory on the EC2 (pre-approved). Whether those records carry per-call durations is **not checked** |
  | `coordinator.max_pending_per_account` | Concurrent pending commands per account in the same records |
  | `observation.poll_interval_secs`, `observation.max_requests_per_minute`, `supervisor.max_requests_per_minute` | The deployed OpenAlgo's rate-limit settings, read without any order (pre-approved), and legacy's polling in the recorded sessions |
  | `reconciliation.clock_skew_secs`, `reconciliation.working_escalation_secs`, `clock.jump_record_ms` | Broker timestamps against the host clock in the recorded books; the host's clock-discipline records (**not checked** which exist) |
  | `recovery.lease_secs`, `recovery.lease_renew_secs` | The lease store's round-trip times, once its location is chosen with the backup destination (POL-O01, open) |
  | `supervisor.poll_secs`, `supervisor.read_budget_ms`, `supervisor.stall_secs` | Pass and read durations of the target's disarmed composition replaying the recorded sessions on the EC2 copy |
  | `storage.critical_reserve_bytes`, the `at.slice` envelope, `envelope.backup_reserve.*`, `envelope.supervisor.*` | Host capacity and the measured peak use of the kernel, market process, backup and optional work under representative overlap (A09-F2) |
  | `strategies.host.seal_wait_ms`, `strategies.host.review_retry_ms` (SLICE-09's) | The strategy host's waits over the recorded sessions |
  | Legacy's own read load on the account | OpenAlgo's request log and legacy's polling in the recorded sessions; the budget left for the target's reads while legacy still trades (step 10, SLICE-13) |
  | `recovery.routine_advance_limit` | Not measured: approved by the owner with the release binding (sessions spec) |

* **Recorded sessions** captured here also feed PRF-ADM-07 and PRF-PRT-08, which run through `scripts/compare_parity.py` before any live use (SLICE-06 and SLICE-08 exclusions).

### Installer (`deploy/install.py`)

* **Commands:** `render`, `stage`, `check`, `activate --authorized-by NAME --instruction TEXT`, `resume`, `restore`, `status`. Each writes its step to the host-level transition log ([configuration spec](configuration-artifacts-release.md#release-transitions)). It prints no credential.
* **`render`** writes each composition participant's unit from `PARTICIPANTS` and the templates (below). Only `env_allowed` names and path fields are written; credentials only as `LoadCredential=` lines. The installer and the templates travel with the wheel in the release artifacts, with their digests in the bundle (`artifact.deploy`), so the installer never runs from a checkout.
* **Root writes are narrow.** Rendering runs as the application user. One root step writes only the planned unit files, the participants' system users (a `sysusers.d` file) and the supervisor's polkit rule, each checked line by line, then reloads systemd. Legacy plans as the app user and writes through checked `sudo tee`, refusing any directive outside a fixed list (`deploy/unit_envelope.py:25-27`, `deploy/deploy_tier1.py:996-1003`).
* **`stage`** refuses when memory available is below `install.min_memory_mb` or free disk below the release's size plus `storage.critical_reserve_bytes`, before writing anything. Legacy refused below 1024 MB and 2048 MB (`deploy/deploy_tier1.py:517-543`); those are evidence for the measured values.
* **`activate`** walks the configuration spec's transition states: the [activation boundary](configuration-artifacts-release.md#the-activation-boundary) (the Fork call there) before the stop, after it and before the switch, with the observation route kept running for those checks; the old writer gone; the new unit set written; the switch; then the start in dependency order (observers, market process, kernel, the rest), each verified before the next; and convergence judged per operation.
* **Account read budget.** Every broker read the installer makes goes through the observation route and counts against the account's `observation.max_requests_per_minute`. On a host where legacy still trades, legacy's own polling counts too: the budget for these checks is what remains after legacy's measured load (TASK-S11-07).
* **A rehearsal mode** runs every command inside a disposable directory with a fake `systemctl`, as legacy's (`deploy/deploy_tier1.py:1755-1880`). The tests use it; it never touches the host's units.

### Units (`deploy/systemd/*`)

Every unit is rendered from the participant contract (D06). None loads a shared settings file: each gets `AT_PROFILE`, `AT_RELEASE`, its path fields and its own credentials through `LoadCredential=` (REQ-OPS-010). Each runs as **its own system user**, named after its participant; read access to another's store is through a read-only group with directory permissions, and access to the kernel's channel is as SLICE-10 settles it (socket group access). **Every unit other than the kernel** also carries `InaccessiblePaths=` over the other units' credential directories (`/run/credentials/<unit>`) and credential files, and `ProtectProc=invisible`, so it can neither read another unit's credential nor another process's environment.

**Deviation (from legacy):** legacy runs every unit as one application user and loads one shared `EnvironmentFile` with the broker key (problem above). `LoadCredential=` needs systemd 247 or later, and `ProtectProc=` 247 as well; the EC2's version is **not checked** (step 10 records it).

| Unit | Runs | Start and restart | Memory and kill order | Credentials | Filesystem | Basis |
|---|---|---|---|---|---|---|
| `at-kernel.service` | `at-kernel` | At boot; `on-failure`, 60 s, at most 3 in 900 s; `TimeoutStopSec=60` | No cap (POL-052); `OOMScoreAdjust=-800` | The account's trading key | Writes ledger, evidence, run; reads the market store; `UMask=0077`, `ProtectSystem=strict`, `PrivateTmp`, `NoNewPrivileges` | Restart: legacy's session loop (`deploy/systemd/at-strategy.service:23-26`, `:55-56`); boot start and stop timeout: the authority (`deploy/systemd/at-tier1-authority.service:37`, `:45-46`); kill order (`deploy/unit_envelope.py:67-69`) |
| `at-market.service` | `at-market` | At boot; `always`, 5 s | No cap (POL-052); `OOMScoreAdjust=-600` | The account's OpenAlgo key (**Fork call**, configuration spec), market half only | Writes the market store | Legacy gateway, the market poller's host (`deploy/systemd/mcp-gateway.service:40-43`); the recorder uncapped (`deploy/unit_envelope.py:100-107`) |
| `at-strategy.service` (SLICE-09's T-59) and its timer | `at-strategy` | By the session timer, never at boot; `on-failure`, 60 s, at most 3 in 900 s | As legacy's session: no hard cap, `OOMPolicy=stop`, `OOMScoreAdjust=-800` | None of the broker's | Writes its own state | Legacy (`deploy/systemd/at-strategy.service:9-11`, `:23-26`, `:55-59`); kill order (`deploy/unit_envelope.py:69`) |
| `at-supervisor.service` | `at-supervisor` | At boot; `always`, 10 s | `MemoryHigh`, `MemoryMax` refusing, measured; `OOMScoreAdjust=500`; `Nice=19`, `IOSchedulingClass=idle` | The read-only credential if proven; otherwise none (mediator socket) | Reads ledger and evidence; writes its assessment store; `NoNewPrivileges`; the polkit rule for `at.slice` | Legacy monitor sweep (`deploy/systemd/at-monitor-v2-sweep.service:12-23`) |
| `at-observer.service` (T-72) | `at-observer` | At boot; `always`, 5 s | Soft cap, refusing, measured | The account's broad key | Its socket directory only | Only without native read-only proof |
| `at-operator.service` | The owner API relay (SLICE-10) | As SLICE-10 sets | Soft cap; `OOMScoreAdjust=-400`, legacy's owner exposure path (`deploy/unit_envelope.py:71`) | SLICE-10's own | SLICE-10's | Rendered from the contract |
| `at-backup.service`, `at-backup.timer` | The backup (migration spec) | Oneshot; timer daily 11:45 UTC, `RandomizedDelaySec=15min`, `Persistent=true` | In `at.slice`, inside its reserve; `Nice=10`, `IOSchedulingClass=idle`; `OOMScoreAdjust=300` | The backup destination's only; never the broker key | Reads stores; writes its staging | Legacy (`deploy/systemd/at-backup.service:21-27`, `deploy/systemd/at-backup.timer:9-11`, `deploy/unit_envelope.py:74`); POL-047's nightly cadence |
| `at.slice` (T-79), `at-research.slice` | Optional work; research under it (SLICE-12) | — | The aggregate envelope, refusing, measured | — | — | A09-F2 |
| `at-cognition.service`, `at-research.service` | When SLICE-09 or SLICE-12 composes them | — | Soft caps | Their own | Their own | Rendered from the contract |

* **Retained from legacy:** the restart settings, the boot and timer starts, the kill order, the uncapped kernel, recorder and session, the backup's timing and niceness. Each touches continuity of trading, so each keeps the live value (Fork calls in the [slice file](../plan/slices/SLICE-11-packaging-release-supervision.md#fork-calls)).
* **No entries on a day the calendar cannot confirm.** Legacy's strategy unit skips a holiday, and skips when the calendar cannot answer (`deploy/systemd/at-strategy.service:46-48`). In the target the kernel and market units are always on, and the sessions spec opens no financial session on a day whose status is `unknown`. Whether the strategy host's timer keeps legacy's `ExecCondition` as well is SLICE-09's; this slice renders what SLICE-09 decides (`README.md:1268`).
* **The market process's unit** is SLICE-08's carried item; its process is the market spec's live loop.

## Failure modes and crash points

| Point | What happens | Recovery | Proof |
|---|---|---|---|
| F-H1: an unexpected exception in a pass | Exit 70, leases not released, nothing claimed after | systemd restart; `bootstrap` waits for lease expiry; routine advance (Q-009) | PRF-OPS-01 |
| F-H2: the kernel frozen | No passes; broker stops rest; tick exits and the trail do not run | The supervisor reports `kernel_stalled`; a human acts | PRF-PRT-06 (frozen half), PRF-OPS-03 |
| F-H3: stopped with a call in flight past the stop timeout | The call stays `IN_FLIGHT` | Recovery after restart, as built | PRF-OPS-01 |
| F-H4: the lease store unreachable while `OPERATING` | The kernel keeps running and alerts (sessions spec) | — | Sessions spec |
| F-S1: a ledger read over its budget | `ledger_gap` recorded with its reason | Next cycle | PRF-OPS-02 |
| F-S2: the ledger's schema unknown to the supervisor | `ledger_gap: schema` | A compatible supervisor release | PRF-OPS-02 |
| F-S3: the observation route down | `observation_gap`; the kernel is unaffected | systemd restarts the mediator | PRF-OPS-02 |
| F-S4: the supervisor down | No independent report; the kernel unaffected; the operator interface shows the last assessment's age | systemd restart | PRF-OPS-03 |
| F-S5: the host lost | Nothing reports | Off-host recovery (migration spec); alerting not built (POL-047) | Limit, not proved |
| F-I1: the storage reserve crossed | `at.slice` stopped; alert; nothing deleted | Free space by hand | PRF-OPS-05 |
| F-I2: the aggregate envelope full | New optional work refused | Later | PRF-OPS-04 |
| F-T1: the telemetry sink unavailable | Records dropped and counted | — | PRF-OPS-06 |

## Risks and limits

* **The market process holds a key OpenAlgo accepts for orders,** unless TASK-S07-06 proves a read-only one: it needs OpenAlgo's market endpoints, OpenAlgo issues one key per user, and legacy's market poller held the same key (Fork call, configuration spec). It is a trusted broad-credential holder (A06-F2). The market composition never constructs the order half (a structural test like PRF-XC-02), and its unit runs as its own user, but the key itself is broad.
* **After a kernel crash, the trail is still for the restart delay plus the remaining lease** (Fork call 3). The broker-held stop covers it, as in legacy.
* **A same-host supervisor** cannot report host loss (F-S5).
* **The heartbeat is not proof of progress.** A pass can run and do nothing useful; the supervisor's demand measures (oldest admitted command, unresolved attempt ages) carry that.
* **Read-only WAL access under hardened units.** A reader needs the `-wal` and `-shm` files present and readable; proved on Linux in step 4, **not checked** yet.
* **Telemetry off by default** until its budgets are measured; the heartbeat and the supervisor's assessments do not depend on it.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `host.pass_interval_secs` | The kernel's scheduled pass period, phase-locked to `market.bar_confirm_lag_secs` | **Fork call:** 20, legacy's live poll (`scripts/run_framework_live.py:7472`), with legacy's phase lock (`scripts/run_framework_live.py:3431-3450`); configurable |
| `envelope.backup_reserve.memory`, `.tasks`, `.disk` | Headroom in `at.slice` and on disk kept for the required backup | Refusing; measured |
| `supervisor.poll_secs` | Supervisor cycle | Refusing; measured (legacy 90 s and 600 s as evidence) |
| `supervisor.max_requests_per_minute` | The supervisor's share of the per-account read budget | Refusing; measured; checked against the kernel's share at load |
| `supervisor.read_budget_ms` | Longest ledger read transaction | Refusing; measured |
| `supervisor.stall_secs` | Heartbeat age that counts as a stall under demand | Refusing; measured |
| `storage.critical_reserve_bytes` | Free space kept on filesystems holding authoritative or required-evidence roots | Refusing; measured (legacy 2 GiB and 2048 MB as evidence) |
| `envelope.optional.cpu_quota`, `.memory_high`, `.memory_max`, `.tasks_max`, `.io_weight` | The `at.slice` aggregate envelope | Refusing; measured (legacy research slice as evidence) |
| `envelope.supervisor.memory_high`, `.memory_max`; the same for the observer | Soft caps on non-trading services (POL-052) | Refusing; measured |
| `install.min_memory_mb` | Staging precheck | Refusing; measured (legacy 1024 MB as evidence) |
| `telemetry.max_items`, `telemetry.max_bytes` | Telemetry queue bounds | Unbound turns telemetry off; measured |
| `recovery.rto_secs` | Restore-time objective (POL-047) | Owner only; unbound, the rehearsal reports its duration as "not judged" |

The refusing ones join the [refusing-parameter register](cross-cutting-invariants.md#refusing-parameter-pattern-req-xc-003) at integration, with TASK-S11-07 as their producing task.

## Reuse evidence

* Jobs, leases and cgroup containment: **retain/simplify configuration** (`README.md:1156`). Kept: the slice and the research unit's hardening (`deploy/systemd/at-research-worker.service:17-35`), the OOM kill order (`deploy/unit_envelope.py:67-84`), the uncapped list (`deploy/unit_envelope.py:100-107`), the checked root-side writes (`deploy/unit_envelope.py:25-27`), the test lock, the on-disk temporary root and the low priority (`scripts/safe_pytest.py:207-224`, `scripts/safe_pytest.py:268-272`, `scripts/safe_pytest.py:227-231`). Not inherited: the calendar gate for tests, per-unit envelopes that default to empty, the research-only allowlist that contradicts its unit (LD-18).
* Monitoring: the classifications and alert-once-per-change follow legacy's findings and alert state (`monitoring/service.py:369-450`); the trading-capable reads do not.
* Recovery acceptance: the D10 rehearsal is the migration spec's; legacy's clean-host check (`deploy/rehearse_clean_host.py:2-17`) is its evidence.

## Alternatives considered

* **The supervisor reads the kernel's channel instead of the ledger.** Rejected: A03-F4 requires independence from the kernel's responsiveness.
* **A watchdog that kills a frozen kernel.** Not selected: it adds automatic restart behaviour legacy does not have (Fork call); listed for the owner.
* **One application user for every unit, as legacy.** Rejected: a process of the same user can read another's environment and files unless every unit is hardened perfectly. Per-unit users, consistent with SLICE-10's per-uid channel peers, put the boundary in the operating system (D09); inaccessible paths and hidden processes are kept on top.
* **One slice per kind of optional work.** Rejected: separate caps do not prove combined fit (A09-F2); one parent with children does.

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-OPS-01 | T | `tests/integration/test_kernel_host.py` | With a recorded clock: with period 20 and lag 7 and nothing waking, passes at :07, :27 and :47 of each minute; with period 25, still one pass at every :07; `seconds_to_next_pass` equal to cases generated once from legacy's function; one pass per wake (return, observation, hand-off, deadline); hand-offs run on the writer thread in order; the heartbeat after each pass; `SIGTERM` claims nothing new, drains returns and releases the leases `clean`; an injected exception exits 70 without releasing them; a restart waits for the lease to expire, then advances routinely; no protection pass before `OPERATING` | a stopped host claims, an exception keeps sending, or a restart advances on an unexpired lease |
| PRF-OPS-02 | T | `tests/integration/test_supervisor.py` | The read model is one transaction at one head, ended before any broker call; a read over budget, a busy database and an unknown schema each give a recorded `ledger_gap`; partial, conflicting and wrong-domain observations give the right assessment buckets; an analyzer observation never matches a live obligation; assessments are published before they are indexed; reader impact measured against a committing kernel, with and without the supervisor polling: WAL size stays bounded, checkpoints complete, and the kernel's commit latency is recorded (A03-F4); the A03-F1–F5 row's supervisor clauses (`README.md:1240`) | the supervisor guesses past a gap, matches across domains, or stops checkpoints completing |
| PRF-OPS-03 | T | `tests/integration/test_supervisor.py` | Each verdict row, from independent expectations: `kernel_quiet` without demand; `kernel_stalled` with a frozen kernel subprocess and an open position; `kernel_down` for a dead process; `dispatch_overdue` from the heartbeat; each leg's classification as `classify` gives it, and "not running" for runtime-dependent legs while the kernel is stalled; one alert per change | a quiet ledger alerts, or a stall is missed |
| PRF-OPS-04 | T | `tests/isolation/test_resource_storage_scope.py` | A native descendant of isolated work cannot write a protected root, open a network socket or see a credential; descendants count against the `at.slice` envelope; admission refuses past the envelope or the reserve; a test run proceeds with no calendar consulted; on a host without enforcement the report says `enforced: false` per property; the isolation row (`README.md:1239`) | a descendant reaches production, or unenforced isolation is reported as enforced |
| PRF-OPS-05 | T | `tests/isolation/test_resource_storage_scope.py` | Each disk-full row: a full scratch filesystem fails only its job; the reserve crossing stops `at.slice` and deletes nothing; a full critical store fails its commit truthfully (with PRF-LED-07); a failed assessment write is a counted gap; the A09-F1–F4 row's storage clauses (`README.md:1247`) | scratch exhaustion breaks a critical write, or anything is deleted |
| PRF-OPS-06 | T | `tests/unit/test_telemetry.py` | With the sink blocked, failing or slow, `emit` returns within a bound measured in the test, the queue never exceeds its bounds, drops are counted; untyped records and credential names are refused; unbound budgets mean every emit is a drop; no kernel module but `kernel/host.py` imports telemetry and none reads the sink | telemetry blocks, grows without bound, or reaches a decision |
| PRF-OPS-07 | T | `tests/contracts/test_rendered_units.py` | For **each** unit of the table: its own user; only its contract's credentials through `LoadCredential=` and no shared settings file; every non-kernel unit has `InaccessiblePaths=` over every other unit's credential directory and file, and `ProtectProc=invisible`; the kernel, market and strategy units carry no `MemoryMax` or `MemoryHigh`; optional units carry soft caps; restart settings, start mode and kill order as the table. On Linux with systemd, each non-kernel unit, started in the rehearsal, cannot read the kernel's credential or another process's environment | a unit can read another's credential, or the kernel is capped |
| PRF-OPS-08 | M | measurement records | Each measured refusing field has a `Measurement` with its workload, environment, artifact and samples, and the owner's approved value recorded with the release binding (TASK-S11-07) | a measured field is bound without a record |
| PRF-OPS-09 | M | deployment record | Run with SLICE-13's disarmed shadow, against the shadow ledger, which carries the live account's obligations (before that, the target ledger has none to assess): the supervisor runs read-only, within the read budget left after legacy's own load, and a session's assessments and protection classifications match OpenAlgo's books, with every difference explained; the operational acceptance row (`README.md:1256`) | the supervisor's account view disagrees with OpenAlgo unexplained |

PRF-PRT-14 (the supervisor cannot construct a sending adapter, open the authority channel for writing or read a broker key) is the [protection spec's](protection-and-safety.md#requirement-keys) proof, delivered here in `tests/contracts/test_capabilities.py`. PRF-PRT-06's "kernel frozen" half is delivered here in `tests/integration/test_protection_kernel.py`. PRF-DOM-06 (the mediator) is the [execution spec's](execution-domain-and-observations.md#observation-enforcement-a06-f2), delivered here when the mediator is built.

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-01 | `scripts/safe_tests.py` (thin launcher) | (every SLICE-01 test runs through it) |
| SLICE-02 | `operations/verification.py`'s reader-impact measurement | (PRF-LED-14's measurement) |
| SLICE-11 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-11-packaging-release-supervision.md#steps) | PRF-OPS-01…08; PRF-PRT-14; PRF-PRT-06 (kernel frozen half); PRF-DOM-06 when the mediator is built |
| SLICE-13 | The supervisor run against the disarmed shadow's ledger | PRF-OPS-09 |
