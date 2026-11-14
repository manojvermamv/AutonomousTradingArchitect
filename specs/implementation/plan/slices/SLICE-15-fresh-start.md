# SLICE-15 — Fresh start: a first install with no legacy, rehearsed on this PC

* **Status:** proposed (2026-11-13). Every step below is an outline in the standing rules' sense: each step's exact detail (files, signatures, test tables, break checks) is written just before it is built, then reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
* **Why this slice exists.** The production EC2 (`debian-oa`) was lost with all its data ([Server lost: start fresh](../../decisions/owner-answers-2026-10-27.md#server-lost-start-fresh-2026-11-13)). The owner chose a fresh start with the new system only. The steps that needed live legacy — SLICE-11 steps 9–11 (in part), SLICE-13 steps 6–7 and SLICE-14 steps 3–5 — are void or moved here. This slice replaces them with a fresh first install, rehearsed in full on the owner's Windows PC, then carried out on a new server.
* **Precedence:** the master README, then the ROADMAP, then this package. Authorities: the [configuration spec](../../design/configuration-artifacts-release.md) (installer, release transitions), the [runtime spec](../../design/runtime-isolation-observability-deployment.md) (isolation, measurement), the [migration spec](../../design/migration-recovery-rollback-continuity.md) (recovery set, backup, restore). Every intentional difference from legacy is marked **Deviation**; every money-touching fork keeps legacy's live behaviour at 445eb116 and is marked **Fork call** ([standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)). **No score, threshold, entry gate or money value is set or changed here.**
* **Owner answers applied:** Server lost: start fresh (2026-11-13); The new system's own root rules (2026-11-13); Unit names that clash with legacy (2026-11-13); Standing rules (2026-10-30); Margin limit when OpenAlgo reports none (2026-11-05).
* **Builds on:** OA_NEW `slice-08` at `bbbd768` (since 2026-11-14 pushed as `agentic-desk` at `f202caa`): SLICE-11 steps 1–8, SLICE-12, SLICE-13 steps 1–5, SLICE-14 steps 1–2 as built. Branch `slice-15`, cut from `slice-08`.
* **Environment.** Steps 1–6 run on the owner's Windows PC only: no WSL, no Linux, about 9 GB free on `C:`. No credential, no real key, no broker, no money. Backups go to a local folder or a local restic repository; OpenAlgo is a fake on loopback. Every check that needs Linux (real systemd, real users, POSIX modes, `sudo`, polkit, Unix sockets with `SO_PEERCRED`) becomes a row in [the waiting list](#linux-only-rows-waiting-for-the-new-server), run at step 7.
* **Environment classes.** Steps 1–6: S (this PC, temporary or scratch directories). Step 7: P, **owner's word** for every part.

**In plain words.** The old server is gone, so the new system will be installed on a clean new server with no old system beside it. Step 1 makes the installer understand "fresh host": it stops rendering the root rules that existed only to take over from the old system. Step 2 proves the operator's isolated-work command cannot be misused through its sudo wildcard before that rule is ever installed. Step 3 turns the five surviving market days into clean replay data. Step 4 rehearses the whole first install on this PC and then runs the new system over those days against a fake OpenAlgo, ending with the books and ledger agreeing. Step 5 backs that up and restores it. Step 6 records sizes and timings. Step 7 is the real server, step by step on the owner's word.

## Steps

| Step | Builds | Class | Reuses | Proofs |
|---|---|---|---|---|
| 1 | Fresh-host install profile: no `cutover-root` sudoers line, no `--shadow` copier line, no legacy polkit rule, no key probe; `cutover.legacy_units` not needed; `cutover`/`continue-legacy` refuse on a fresh host; research custody starts a new chain | S | `deploy/install.py` render, `FIRST_INSTALL`, `REPORTED_WHILE_UNBOUND`, `CustodyLedger` genesis | PRF-CFG-03/06 (fresh rows), new fresh-host rows |
| 2 | Proof that `scripts/isolated_work.py` refuses every unsafe argument reachable through `--work-dir *`; small hardening where it does not | S | `test_resource_storage_scope.py` sudo fixtures (`SudoSystem`, `sudo_copy`) | The owner's condition on the isolated-work line |
| 3 | Converter: the five validated days to replay data the market reader takes, in a separate labelled directory | S | `adapters/legacy_market.py` layout and `compatibility.read_market_file` | Converter tests; conversion report |
| 4 | Local first-install rehearsal (installer rehearsal mode), then the kernel, market host and BuyerEdge host over a fake OpenAlgo replaying the converted days; books and ledger reconciled each day | S | `install.py --rehearse`, `fake_systemctl`, `ShadowDriver` loop, `LegacyMarketFeed`, `OpenAlgoAdapter`/`OpenAlgoBooks`, captured analyze-mode books | Rehearsal record; per-day reconciliation |
| 5 | Backup and restore at real size on `DirectoryDestination` (owner: no restic on this PC); the restic anchor gap carried to step 7 | S | `operations/backup.py`, `operations/restore.py`, `scripts/verify_recovery.py` | REQ-MIG-006/007 at real size (local) |
| 6 | Measurement on the replayed days: store sizes, replay timing, backup size and reserve | S | `operations/verification.py` | PRF-OPS-08 (the PC part) |
| 7 | (Outline; owner and a server) New server: OpenAlgo, backup account, staging, one or two sessions in `analyze`, the owner switches to live; every Linux-only row | P | Steps 1–6 | PRF-CFG-09, D10 evidence, PRF-OPS-09 |

**Why this order (a refinement of the task's split).** The task listed backup before the rehearsal. The code says otherwise: a backup "at real size" needs real-size stores, and the only real-size stores this PC can have are the ledger, evidence and market store that step 4's replay writes. So the converter comes first (step 3), the replay second (step 4), and backup and restore run over its output (step 5). Step 2 is split out of step 1 because it is the owner's explicit condition on one sudoers line and has its own tests. Steps 1–2 and step 3 share no files and may be built in parallel by two agents.

## Fork calls

None is planned. Two places come close and are recorded so the owner can see them:

| # | Where | Legacy at 445eb116 | This slice |
|---|---|---|---|
| 1 | Account limits on a fresh host | Legacy's limits came from its drop-in (`MCP_LIMITS__*`) and `config/profiles/enforcing.yaml`; the installer's `limits_problems` compares the profile with that drop-in when present (`deploy/install.py:863`) | No drop-in exists on a fresh host, so `limits_problems` returns nothing. The owner binds `account.limits.*` in the profile with **legacy's values at 445eb116**, read from the legacy repository, not from a host. Nothing is chosen here |
| 2 | Replay fills | Legacy's live fills came from the broker; analyze fills from OpenAlgo's sandbox | The fake OpenAlgo fills at the recorded leg's price at the next minute, as OpenAlgo's sandbox fills a MARKET order at the current LTP (to be confirmed at the source, `./openalgo/` sandbox code, before step 4 is deepened). Test data only; no money behaviour of the system changes |

## Deviations

* **D-1 (step 1):** a fresh host gets no `cutover-root` line, no `--shadow` copier line and no legacy polkit rule; the configuration spec's rendering lists them for every host. The owner's answer of 2026-11-13 decides this.
* **D-2 (step 4):** hosts run in one process on Windows, not as separate units over the kernel channel. The channel server is Linux-only (`KernelChannelServer` refuses without `AF_UNIX` and `SO_PEERCRED`, `adapters/unix_channel.py:621`). The multi-process run is a waiting row.
* **D-3 (step 4):** the replay is not legacy-comparable. Bid/ask are missing, so BuyerEdge's spread checks cannot run; the reasons are given under step 3.

## Linux-only rows waiting for the new server

Recorded here, not run on this PC. Each one is run in step 7 or is marked as waiting there. None of them blocks building.

| Row | From |
|---|---|
| The rendered sudoers files pass `visudo -cqf` (`test_sudoers_visudo`) | SLICE-11 step 7 |
| `isolated_work.py` really started under `sudo` by an `%at-operators` member: the enforcement report holds every property (`PrivateNetwork`, `ProtectSystem`, `InaccessiblePaths`, `NoNewPrivileges`, the caps), runs as `SUDO_USER`, and the work directory's owner check runs against real uids | SLICE-11 step 6, this slice step 2 |
| The polkit rules evaluated by a real polkitd: `at-supervisor` may stop only `at.slice`; `at-installer` manages only the target's units | SLICE-11 steps 4, 7 |
| Real system users from the rendered `sysusers.d` file; the store read cases, the strategy store, the market heartbeat, the operator CLI socket, cognition's socket, the channel, the two-uid case | SLICE-11 step 7 "real-users rows" |
| The kernel, market and strategy hosts as separate units over the kernel channel (`SO_PEERCRED`, group modes) | SLICE-11 step 3a; this slice D-2 |
| POSIX modes and owners in restore (`test_a_restore_refuses_an_existing_directory_with_another_mode`) and the real-symlink case (`test_a_symlink_cannot_escape_the_shadow_root`), both skipped on Windows | SLICE-11 step 8 as built |
| The two-process `flock` race and the directory `fsync` of `DirectoryLeaseStore` | SLICE-11 step 8 |
| The installer's `apply-root`, `enable-units` and real `systemctl` through every `FIRST_INSTALL` state on a real host | SLICE-11 step 7 |
| The strategy timer's calendar `ExecCondition` and session preflight under real systemd | SLICE-09 |
| The backup timer and `ResticDestination` against the real B2 or R2 repository, with anchors | SLICE-11 step 8 carry |
| The supervisor's emergency stop of `at.slice` | SLICE-11 step 4 |
| The production-profile rows carried to the EC2: PRF-PRT-06's frozen-kernel half, real `systemctl show`, `SIGTERM` handling (`tests/contracts/test_capabilities.py:1210` skips with "Linux, the EC2"), the network fence, kill release across users, `install-root-copy` | SLICE-11 lines 1534, 2552 (added by the 2026-11-14 check) |
| Crash points CP-R2…CP-R7, the PRF-CFG-05 Rollback row and the PRF-CFG-07 Composition row through the real installer (SLICE-11's PRF-CFG-01…08 completion condition) | SLICE-11 line 2550 "not built, carried" (2026-11-14 check) |
| C-1 capture against the real OpenAlgo: option chain with Greeks and `multioptiongreeks`; un-skips `test_pe_delta_sign_at_the_source` (`tests/integration/test_openalgo_contract.py:1360`). Run in step 7.2 right after OpenAlgo starts | SLICE-08 status, pending (2026-11-14 check) |
| Measure `strategies.host.seal_wait_ms` and `strategies.host.review_retry_ms` (not produced by step 6) | SLICE-11 line 321 (2026-11-14 check) |

---

## Step 1 — the fresh-host install path

### Decisions

#### Where the legacy-only pieces are rendered today (OA_NEW `bbbd768`)

| Piece | Where | Rendered when |
|---|---|---|
| `cutover-root` sudoers line, one per root copy | `sudoers_files`, `deploy/install.py:279-296` (`for mode in ("apply-root", "enable-units", "cutover-root")`) | Always |
| `--shadow` copier sudoers line (`/etc/sudoers.d/autonomous-trading-shadow-copier`) | `sudoers_files`, `deploy/install.py:294-295` | Whenever a running copy exists |
| `cutover-root` accepted as a valid line ending | `sudoers_problems`, `deploy/install.py:307` | Always |
| Legacy polkit rule | `legacy_polkit_rule`, `operations/isolation.py:145` | **Not rendered by `install.py` today**: `polkit_files` (`:272-276`) renders only the supervisor and installer rules. The planning check found nothing that calls `legacy_polkit_rule` outside its definition. The deepening confirms whether the cutover was meant to render it; either way a fresh host never does |
| Key probe | `_key_probed` (`install.py:2813`), `operations/key_probe.py`, `key_probe_unit_properties` (`isolation.py:170`); `isolated_work.py` has **no** `--key-probe` option yet ("not yet wired") | Only inside the `cutover` state machine (`KEY_PROBED`) |
| `cutover.legacy_units` | `legacy_units(eff)` (`install.py:2213`), refusing `CFG-R08` when unbound; `unit_name_clash` (`:2538`) | Only inside `cutover`, `continue-legacy` and `cutover-root` |
| Legacy's senders at `OLD_WRITER_GONE` | `act.LEGACY_SENDERS` (`operations/activation.py`), checked in `FIRST_INSTALL` too (`install.py:1894-1898`) | Always; on a fresh host the units do not exist, so `_gone` passes (to confirm against a unit that does not exist under real systemd, a waiting row) |
| Legacy's limits drop-in | `limits_problems` (`install.py:863`) | Only when the file exists; on a fresh host it returns nothing (Fork call 1) |

`FIRST_INSTALL` (`operations/activation.py:20`) already describes a host with no running release. So the only things to switch off are the sudoers lines, plus a guard so the cutover commands cannot run on a fresh host.

#### How a fresh profile switches them off

* **The switch is a fact, not a new flag:** a host is fresh when the release's profile leaves `cutover.legacy_units` unbound. This setting already exists (`settings/schema.py:92`) and is already the cutover's precondition. No new setting is added. (Alternative rejected: a separate `install.fresh_host` boolean, which could disagree with `cutover.legacy_units`.)
* `render_release` passes `legacy=bool(eff.settings.cutover_legacy_units)` to `sudoers_files`, which renders the `cutover-root` line and the `--shadow` file only when `legacy` is true. `sudoers_problems` takes the same flag: on a fresh host a `cutover-root` line or a `--shadow` line is a problem (`CFG-R10`), not an accepted ending.
* `cutover`, `continue-legacy` and `cutover-root` refuse `CFG-R08 fresh_host: no legacy to cut over from` before writing any record, when `cutover.legacy_units` is unbound. They already refuse when it is unbound; this gives the refusal a clear reason and a test.
* `isolated_work.py --shadow` refuses on a fresh profile (`shadow.*` unbound and `cutover.legacy_units` unbound) even under its own rule. Step 2 tests this.
* `polkit_files` stays as it is: supervisor and installer rules only. A test pins that no rendered file contains the legacy rule's header text.

#### Research custody starts a new chain

`CustodyLedger._initialize_locked` (`research/custody.py:527-542`) writes a genesis into an empty `research.custody_root`. A fresh host has no imported chain. Step 1 adds a fresh-install test: after `CONVERGED` in the rehearsal, the custody root holds exactly one genesis event and its anchor, and `reconcile`/`adopt` are never called. Legacy's spent days are lost (owner's answer). No code changes unless the installer's directory table fails to create the custody root.

#### Backup while unbound

No change. The four `backup.*` items stay in `REPORTED_WHILE_UNBOUND` (`install.py:605`): reported at staging, never refusing. `convergence` reports `backup: unavailable` until the step 7 account exists (owner's answer: "Do the four backup settings block staging: No").

### Tests

| Test | Proves |
|---|---|
| `test_fresh_host_sudoers_have_no_cutover_or_shadow_line` | With `cutover.legacy_units` unbound: two lines per copy (`apply-root`, `enable-units`); no `--shadow` file; the isolated-work file present |
| `test_legacy_host_sudoers_unchanged` | With the setting bound: today's six lines and the shadow file (the existing `test_sudoers`, parametrized) |
| `test_sudoers_problems_flags_cutover_root_on_a_fresh_host` | A `cutover-root` or `--shadow` line on a fresh host is a problem |
| `test_fresh_host_renders_no_legacy_polkit_rule` | No rendered file comes from `legacy_polkit_rule` |
| `test_cutover_commands_refuse_on_a_fresh_host` | `cutover`, `continue-legacy`, `cutover-root`: `CFG-R08 fresh_host`, nothing written to the transition log |
| `test_fresh_first_install_converges_in_rehearsal` | `rehearse_init` with a fresh profile, `stage`, `check`, `activate` through `FIRST_INSTALL` to `CONVERGED`; `backup` reported unavailable; no `KEY_PROBED` record |
| `test_fresh_install_starts_a_new_custody_chain` | One genesis event; no adopt or reconcile |

**Break checks (at least):** render `cutover-root` unconditionally; render the shadow file unconditionally; accept `cutover-root` in `sudoers_problems` on a fresh host; drop the `cutover` refusal; seed a pre-existing custody chain.

### Files

`deploy/install.py`, `scripts/isolated_work.py` (the `--shadow` fresh refusal only), `tests/contracts/test_rendered_units.py`, `tests/recovery/test_release_activation.py`, `config/live.example.yaml` (a fresh-host comment: leave `cutover.*` and `shadow.*` unbound), `docs/operations.md` (fresh install section).

### Completion conditions (step 1)

The tests above pass twice with the affected files. The break checks fail their tests. No legacy-only rule is rendered for a fresh profile. "Step 1 as built" is recorded here.

### Step 1 as built

**Built** in OA_NEW `6d584c2` on `slice-08` (from `bbbd768`; local only, not pushed). Everything ran on Windows (`.venv-slice01`, Python 3.14), in temporary directories and the installer's rehearsal mode.

| Part | Files |
|---|---|
| `legacy_host(eff)` (`cutover.legacy_units` bound) and `refuse_fresh`. `sudoers_files(..., legacy=)` renders `cutover-root` and the `--shadow` copier file only for a legacy host. `sudoers_problems(..., legacy=)` flags either rule on a fresh host. `render_release(..., legacy=)`; `_render_for` and `render` derive it from the profile | `deploy/install.py` |
| `install-root-copy --with-legacy-rules` (default off, recorded as `legacy` in `applied.jsonl`); `apply-root` refuses `CFG-R10 legacy_rules_mismatch` when that record and the copy's profile disagree | `deploy/install.py` |
| `cutover` refuses `CFG-R08 fresh_host` before its `WORD` record; `continue-legacy` before anything; `cutover-root`'s existing `legacy_units` refusal now says `fresh_host` | `deploy/install.py` |
| `--shadow` refuses `fresh_host` when `shadow.*` is unbound, before any unit | `scripts/isolated_work.py` |
| The fresh-host text | `docs/operations.md`, `config/live.example.yaml` |
| Tests: `test_fresh_host_sudoers_have_no_cutover_or_shadow_line`, `test_sudoers_problems_flags_legacy_rules_on_a_fresh_host`, `test_fresh_host_renders_no_legacy_polkit_rule`, `test_sudoers` (now the legacy case), `test_fresh_first_install_converges_with_no_legacy_rules`, `test_apply_root_refuses_legacy_rules_on_a_fresh_profile`, `test_cutover_commands_refuse_on_a_fresh_host`, `test_fresh_install_starts_a_new_custody_chain`, `test_shadow_refused_on_a_fresh_profile` | `tests/contracts/test_rendered_units.py`, `tests/recovery/test_release_activation.py`, `tests/isolation/test_resource_storage_scope.py` |

**Run.** Targeted, twice: `tests/contracts`, `tests/isolation/test_resource_storage_scope.py`, and `tests/recovery/` `test_recovery_set`, `test_release_activation`, `test_release_continuity`, `test_restore_fencing`, `test_initial_cutover` (every file that loads the installer or `isolated_work.py`, plus the contract guards). **923 passed, 10 skipped** both times. `ast.parse` passes on both edited sources.

**Break checks** (`breaks.py` and `breaks_s1.json` in the session scratchpad): **8 of 8 caught**, every file restored and its md5 checked. The breaks: `cutover-root` rendered always; the shadow file rendered always; `cutover-root` accepted on a fresh host; the `--shadow` line accepted on a fresh host; `refuse_fresh` disabled; the `apply-root` mismatch check removed; `install-root-copy` recording `legacy` always true; the `--shadow` fresh refusal removed.

**Differences from the text above**, each smaller than a decision:

* **The switch is the owner's flag at the root copy, checked against the profile.** `install-root-copy` imports nothing from the release (`test_install_root_copy_imports_nothing_of_the_release`), so it cannot read `cutover.legacy_units`. The owner passes `--with-legacy-rules` on a legacy host, and `apply-root`, which can read the profile, refuses on a mismatch. The default is the fresh host.
* **The isolated-work rule is absent after a first install.** It names the running copy, and at the first `install-root-copy` nothing runs yet. It arrives with the next root copy made while a release runs (this was already true and is now tested). On the new server, step 7 makes that second root copy.
* **The legacy polkit rule was never rendered** by `install.py`; the test pins that.
* **Research custody needs no change:** a fresh root opens with one genesis. The installer's first release composes no research, so nothing creates the chain until research is composed.
* **The stale shadow-copier file is not removed** by `apply-root` (review item 7).

---

## Step 2 — isolated work through the sudo wildcard

The owner accepted `%at-operators ALL=(root) NOPASSWD: …/isolated_work.py --work-dir *` on one condition. A test must first prove that the script refuses every unsafe argument the wildcard lets through. Until that test passes, the line is not installed on any host. In practice no real host exists before step 7, so the test lands here and step 7 installs the line.

### Decisions

`sudo`'s `*` matches any further arguments, spaces included, so everything after `--work-dir` comes from the caller. Today's guard is `_sudo_args` and `_sudo_work_dir` (`scripts/isolated_work.py:197-240`), with tests in `tests/isolation/test_resource_storage_scope.py:891-967`. What is already covered and what is new:

| Unsafe argument | Today | Step 2 |
|---|---|---|
| `--profile` | Refused (tested) | Kept |
| `--run-as` another user; `SUDO_USER` root or a participant's user | Refused (tested) | Kept |
| `--shadow` through the work-dir rule | Refused, "its own rule" (tested) | Kept; plus `--shadow` refused on a fresh profile even through its own rule (step 1) |
| `--key-probe` | No such option, so argparse **exits 2 through `SystemExit`**, not the script's `Refused` 20 | Parse errors under sudo become `Refused(20)` with "under sudo: unknown argument"; test that `--key-probe` is refused on a fresh host and that no unit starts |
| Extra unit properties (`-p`, `--property=…`, `--setenv=…`, `--uid`, `--slice`) | No passthrough option exists; argparse rejects them with exit 2 | Same `Refused(20)` path; a parametrized test over each, asserting no `systemd-run` call |
| **Abbreviated options** (`--sha` for `--shadow`, `--pro` for `--profile`, `--run` for `--run-as`): argparse's `allow_abbrev` is on by default | Reach the same checks after expansion, but this is fragile | `allow_abbrev=False`; test that `--sha` and `--pro` are refused as unknown |
| `--work-dir` outside allowed roots: overlapping a protected root, `release.root`, the copies, the credentials directory, a key file, `paths.run` | Refused for overlap (tested for `release.root` only) | Parametrized over every guarded root; plus a relative path, a path with `..` that resolves into a guarded root, a symlinked parent, a directory not owned by `SUDO_USER`, a missing directory |
| `--work-dir` given twice (`--work-dir /ok --work-dir /etc`) | argparse keeps the last; the checks read the last | Refused outright under sudo: exactly one `--work-dir`, and it must be the first argument (it is, by the sudoers line) |
| `--unit` not `at-work-*.service`; `--oom` < 900; `--report` outside the work directory | Refused (tested) | Kept |
| `--memory-max` above the per-run cap; `--disk`/`--memory` beyond admission | Admission refuses past the envelope; `--memory-max` above the cap **not checked** | Refuse `--memory-max` above `per_run_caps`' ceiling under sudo |
| `--network` | **Allowed** under sudo, except with `--shadow` | Kept, per spec (runtime spec :207; SLICE-11 :1762, :1769, :2186): allowed under sudo except with `--shadow` (coordinator, 2026-11-13) |
| `--memory`, `--tasks`, `--disk` of zero or less | Not checked | Refused under sudo: each must be a positive integer (review item 5) |
| The command after `--` | Runs as `SUDO_USER` inside the unit, so it is no escalation | Test: the unit's user is `SUDO_USER` whatever the command is |

These are correctness and safety changes to a root entry point, not money changes.

### Tests

New cases in `tests/isolation/test_resource_storage_scope.py`, all through `SudoSystem` (Windows-safe). Each asserts exit 20, an "under sudo" message, and **no** `systemd-run` or `popen` call recorded. `test_under_sudo_wildcard_is_closed` walks one table of every row above. Its name goes into step 7's install record, as the owner's condition requires.

### Completion conditions (step 2)

Every row is refused with no unit started. The break checks pass: drop `allow_abbrev=False`; drop the duplicate `--work-dir` refusal; let a parse error escape as exit 2; drop the `--memory-max` ceiling; allow `--shadow` on a fresh profile. The real-`sudo` run stays a waiting row.

### Step 2 as built

**Built** in OA_NEW `5fc3ff5` on `slice-08` (after step 1's `6d584c2`; local only, not pushed). Windows, `SudoSystem` (effective uid 0, `SUDO_USER` set, `applied.jsonl` faked).

| Part | Where |
|---|---|
| `_Parser`: a usage error is `Refused(20)` "arguments: …", never argparse's exit 2; `allow_abbrev=False` | `scripts/isolated_work.py` |
| Under sudo: the first argument must be the rule's own (`--work-dir` or `--shadow`); exactly one `--work-dir` (including the `--work-dir=` form); `--memory`, `--tasks`, `--disk` positive when given (defaults 0, 1, 0 still apply when not given); `--memory-max` a size up to `PER_RUN_MEMORY_MAX` (1500M), never `infinity` | `_sudo_args` |
| `test_under_sudo_wildcard_is_closed`, a 21-row table: `--key-probe`, `-p User=root`, `--property=…`, `--setenv=…`, `--uid`, `--slice`, `--sha`, `--pro`, `--run`, `--shadow`, a second `--work-dir`, `--work-dir=`, the four amounts, three `--memory-max` values, `--run-as root`, `--profile`. Every row exits 20 and makes no `systemd-run`/`popen` call. Plus `test_under_sudo_the_first_argument_is_the_rules_own`; `test_under_sudo_a_work_dir_in_a_guarded_root_refuses` (ledger, evidence, market, assessments, run, `release.root`, and a `..` path resolving into it); `test_under_sudo_a_missing_or_linked_work_dir_refuses` (the symlink half skips where Windows denies symlinks, a waiting row); `test_under_sudo_the_command_runs_as_sudo_user_whatever_it_is`; `test_without_sudo_unknown_arguments_refuse_too` | `tests/isolation/test_resource_storage_scope.py` |

**The owner's condition is met in the suite.** The test to name in step 7's install record is `tests/isolation/test_resource_storage_scope.py::test_under_sudo_wildcard_is_closed`. `--network` stays allowed under sudo except with `--shadow`, per the spec. `--shadow` on a fresh profile refuses (step 1).

**Run.** Targeted, twice: `tests/contracts`, `tests/isolation`, `tests/recovery/test_release_activation.py`, `tests/recovery/test_recovery_set.py`. **695 passed, 10 skipped** both times. `ast.parse` passes.

**Break checks** (`breaks_s2.json`): **8 of 8 caught**, file restored and its md5 checked. The breaks: abbreviations allowed; the parse error escaping; a duplicate `--work-dir` accepted; non-positive amounts accepted; the `--memory-max` ceiling dropped; the first-argument rule dropped; the work-directory overlap check dropped; the `SUDO_USER` pin on `--run-as` dropped.

**Difference from the text above:** a usage error now exits 20 for every caller, not only under sudo. The docstring already listed "20 refused (admission or arguments)", and nothing depended on exit 2.

---

## Step 3 — converting the five days to replay data

**Conditional on validation, which is done** (coordinator, 2026-11-13; scripts and output in the session scratchpad `data-check/`). This step builds a converter. It never edits the originals in `OA/run/market-data/`.

### What validation found

| Data | Found | Treatment |
|---|---|---|
| Spot, NIFTY and BANKNIFTY, 2026-08-03…07 | 375/375 rows a day, no gaps or duplicates. Every row was **backfilled** from `openalgo.history` on 8 Aug about 21:00, not captured live. Volume and OI are 0 | Use 09:15–15:14. **Exclude from 15:15**: OHLC is frozen from about 15:16 to 15:28 every day, then the last bar jumps 0.6–1.0% |
| Chains | 385 one-minute snapshots × 17 strikes; bars run to 15:39; no IV, no Greeks, no bid/ask; 25 missing legs over the ten files; 54–1,109 flat zero-volume legs a day that look carried forward; each row's `d.spot` is the spot file's close | Exclude after 15:29 and the 25 missing legs; strip `d.spot` from 15:15. Keep the flat legs, counted and labelled `carried_suspect` in the report (not dropped: the strategy saw such legs live too; inference) |
| NIFTY expiry | `11-AUG-26` on every day. 3 and 4 Aug may hold next week's chain rather than the nearest one (inference) | Run, labelled `possible-wrong-expiry` (coordinator, 2026-11-13), never pooled with the other days' results |

### Why the market reader cannot take the files as they are

Four problems with `adapters/legacy_market.py`:

1. `src` is `openalgo.history`, but `MAPPING` accepts only `quotes`/`history` (spot) and `optionchain` (chain), so every row would become `interrupted` coverage.
2. A chain row holds **both legs of a strike**; the reader wants **one record per leg**, with `d.symbol`.
3. The origin should read `history`, not `live`.
4. Every row's arrival (`fetched_at`) is 8 Aug, so a minute-by-minute replay sees nothing in time.

### Decisions

* `scripts/convert_recorded_days.py` (new, test data tooling, imports no adapter) reads the originals read-only. It writes to `OA_NEW/run/replay-data/` (gitignored, never committed; it refuses any output path under the source directory) in legacy's market-store layout, so `LegacyMarketFeed` reads it:
  * `src` becomes `history` for spot and `optionchain` for chain legs. Each chain row is split into two leg records with `d.symbol`. Origin is `history`.
  * The arrival is the bar's close plus **7 s**, POL-019's approved `market.bar_confirm_lag_secs` (`02-policy-inventory.md` POL-019; legacy `config/defaults.yaml:885`), bound for the replay only. The original stamp is kept as `orig_fetched_at`.
  * The exclusions above are applied. Chain rows' `d.spot` from 15:15 to 15:29 is **stripped** (the spot file's frozen close); the legs stay.
  * **Provenance** lives in a sidecar `MANIFEST.json` beside the gzip files (label `converted-simulation/1`, each source file's sha256, the converter's version, every exclusion with its count, the lot-size sources). The records keep legacy's record shape.
  * **Lot size.** Converted legs carry no `lotsize`, so the planner would refuse `lot_size` (`kernel/planner.py:189-197`) and the replay would place no order. The converter writes `lotsize` into each chain leg, where OpenAlgo's live chain leg carries it (`market/view.py:859` reads `ce.lotsize`/`pe.lotsize`). It does so **only from a captured OpenAlgo answer for the same expiry**: BANKNIFTY 30, from `option_chain_banknifty_20260802…04.json` (expiry `25AUG26`, the converted chains' expiry). NIFTY: no capture exists for the `11-AUG-26` expiry (the only NIFTY capture, `option_chain_nifty_20261004.json`, is expiry `06OCT26`, lot 65). It is never guessed, so NIFTY legs carry no lot and NIFTY days refuse `lot_size` with that stated reason unless the owner accepts the October capture. **Deviation from the review's wording:** the fact goes in the leg, the route production's chain uses, not a separate reference record (the feed has no reference stream).
  * **Origin.** `LegacyMarketFeed` hard-codes `origin="live"` (`adapters/legacy_market.py:166`, `:177`). Chosen: a constructor option `origin` (default `"live"`, so the shadow is unchanged) that the replay sets to `"history"`. Nothing else in the feed changes.
* The coordinator's plan for **spot re-fetch and comparison** against a new OpenAlgo's history waits for step 7. Chains cannot be re-fetched.

### What BuyerEdge can and cannot use from this data

Checked in `strategies/buyer_edge.py`:

* **Greeks: no loss.** The port never prices Greeks, matching every recorded live bar (module docstring; SLICE-09 Fork call 21, characterization 3: `priced_legs` 0 on all 673 bars checked). `ce_delta`, `pe_delta` and `gex_levels` were never passed live either. Missing IV and Greeks change nothing compared with live legacy.
* **Bid/ask: a real loss** (accepted, coordinator 2026-11-13). `ABSENT_FROM_BACKFILL` (`buyer_edge.py:2037`) names `ce_bid`, `ce_ask`, `pe_bid`, `pe_ask`, `ce_delta`, `pe_delta`, `iv_rank` and `gex_levels`. Without bid/ask:
  * the synthetic-futures "wide option spread" zero score (`buyer_edge.py:1633-1645`) and the wide CE/PE spread **trap-score penalties** (`:1888-1893`) never apply;
  * the kernel's strike selection computes no spread (`kernel/selection.py:140-143`), so its spread score falls back to 0.5 (`:186-188`);
  * a structure entry is refused "bid is missing" (`_row_candidate`, `:431-432`).
  `max_entry_spread_pct`, `preflight_max_spread_pct` and `preflight_min_bid` (`buyer_edge.py:296`, `:307-308`) are configuration the port never reads. So the replay's decisions are **not legacy-comparable** (D-3). No BuyerEdge code, kernel code or threshold is changed for this; nothing is filled in or estimated.
* **OI and volume:** present per leg in the chain (bar OI from history). Spot has none, which is the same live. The day-over-day OI check (`dod_oi_enabled`) needs daily option history from OpenAlgo; the fake serves the captured `history_option_daily_*.json` shape only where a matching capture exists. Otherwise that input is unavailable and the report says so for each day.
* **`iv_rank`:** absent, as in every backfill.

### Tests

`tests/tools/test_convert_recorded_days.py` runs on small synthetic inputs shaped like the originals (the real files are never in the suite). It checks: one leg record per side with `d.symbol`; the `src` mapping; arrival = close + lag; spot cut at 15:15, chain cut after 15:29; missing legs dropped and counted; output read by `LegacyMarketFeed` with **zero** `interrupted` rows from mapping; the originals' bytes unchanged (sha256 before and after); refusal when the output directory is inside either repository.

### Step 3 as built

**Built** in OA_NEW `165788a` on `slice-08` (after `5fc3ff5`; local only, not pushed).

| Part | Where |
|---|---|
| The converter, as the decisions above, standard library only, importing no adapter | `scripts/convert_recorded_days.py` (new) |
| `LegacyMarketFeed(..., origin="live")`: the replay passes `"history"`; the shadow's default is unchanged | `adapters/legacy_market.py` |
| `run/replay-data/` ignored | `.gitignore` |
| 10 tests over synthetic backfill-shaped inputs | `tests/unit/test_convert_recorded_days.py` (new) |

**The real conversion** (output `OA_NEW/run/replay-data/2026-08/`, 31 MB, not tracked). Lot sizes came from the three BANKNIFTY captures `tests/fixtures/openalgo/option_chain_banknifty_20260802…04.json` (expiry `25AUG26`, lot 30). The originals' sha256 were identical before and after (`find … | sha256sum` compared). The counts match the validation report:

| Underlying | Spot records/day | Chain leg records/day | Excluded |
|---|---|---|---|
| BANKNIFTY | 360 | 12,750 (12,747 on 7 Aug) | 15 spot minutes and 170 chain rows a day; 3 missing legs (7 Aug) |
| NIFTY | 360 | 12,735 / 12,743 / 12,750 ×3 | the same; 15 + 7 missing legs (3–4 Aug); every leg without a lot (no `11AUG26` capture) |

The missing legs total 25, as validated. The carried-forward legs (zero volume, open = high = low = ltp) are counted and kept: 62–1,074 a day. These counts are lower than validation's 54–1,109 flat zero-volume legs because only legs through 15:29 count. NIFTY 3–4 August chain files carry `possible-wrong-expiry` in `MANIFEST.json`.

Read back through `LegacyMarketFeed(origin="history")`: for each underlying, 0 problems, 1,800 spot and 1,875 chain records, every coverage row `covered` (3,675), every origin `history`, and the first arrival at 09:16:07 IST on 3 August. Every present BANKNIFTY leg carries lot 30; the only legs without one are the 3 excluded ones.

**Run.** Targeted, twice: `tests/contracts`, `tests/unit/test_convert_recorded_days.py`, `test_legacy_market.py`, `test_settings_resolver.py`, `tests/integration/test_shadow_day.py`, `tests/recovery/test_crash_boundaries.py` (the feed's importers). **662 passed, 5 skipped** both times. After one fixture fix (below), the converter and feed unit files were run twice more: 15 passed both times.

**Break checks** (`breaks_s3.json`): **12 of 12 caught** after one test was tightened. Every file was restored and its md5 checked. The breaks: the feed ignores `origin`; the feed's default origin changed; chain `src` left as `openalgo.history`; arrival left as the backfill evening; the spot cut removed; the chain cut removed; a lot applied to every expiry; a capture with two lot sizes accepted; output inside the source allowed; missing legs kept; the chain's `spot` carried; a foreign output overwritten. **"Missing legs kept" first passed:** the fixture omitted the leg, but the backfill records it as an empty object. The fixture now uses `{}`, and the rerun failed the test.

**Differences from the text above**, each smaller than a decision:

* **The test lives in `tests/unit/`**, beside `test_legacy_market.py`, not in a new `tests/tools/`.
* **`spot` is dropped from every chain leg**, not only from 15:15 to 15:29. A live chain leg has no `spot` and the market view never reads one (`market/view.py:845-862`), so dropping it everywhere is the shape production sees.
* **One gzip member per record**, as legacy's appends wrote them.
* **NIFTY carries no lot**, so in step 4 NIFTY days refuse `lot_size` with that stated reason until the owner answers the open question.

### Completion conditions (step 3)

The converter runs on all ten files. `MANIFEST.json` counts match the validation report (25 missing legs; 10 out-of-hours chain snapshots a file; 15 excluded spot minutes a file). `LegacyMarketFeed` reads every converted day with no mapping problems.

---

## Step 4 — local first-install rehearsal and the replayed days

### Decisions

**Part A — the installer, unchanged, in rehearsal mode.** `rehearse_init` → `stage` → `check` → `activate` through `FIRST_INSTALL` to `CONVERGED` with a fresh profile (step 1), `fake_systemctl`, and a `DirectoryLeaseStore` under the rehearsal directory. On Windows `fake_systemctl` starts each unit's real command as a child process (`install.py:1532`). The kernel's channel cannot serve on Windows (D-2), so Part A proves the install path and the start order with the existing stand-in participants (`tests/recovery/test_release_activation.py` `rh` fixture), not the trading loop.

**Part B — the trading loop, in process, on the recorded clock.** No new composition where an existing one fits. **The replay fence:** `compose_replay` calls `rehearsal_guard(environ, base_url)` (`adapters/rehearsal.py:31`) before it builds the adapter, refuses a production profile, never calls `secrets.resolve`, and the fake binds `127.0.0.1:0`.

| Need | Reused | Change |
|---|---|---|
| Lockstep stepping of market commit → strategy pass → coordinator pass → observation cycle on a `RecordedClock` | `ShadowDriver` (`operations/shadow_run.py:168`) | None to the loop. Its copier-log input is satisfied by a **synthetic pass log** the replay harness writes (one pass a day covering the converted files, no stopped file), so `settle` works unchanged. An empty legacy registry is written for `read_inputs` |
| Market data | `LegacyMarketFeed` over step 3's output, through `MarketLoop.run_once(polled=…, poll=False)` | None |
| Strategy | The BuyerEdge strategy host as `compose_shadow` builds it | None |
| Kernel | `compose_shadow`'s `_compose_kernel` call with its `port_factory` | A `compose_replay` sibling (test support, `tests/replay/`, **never** in `COMPOSITIONS` and never production) that swaps the port and observation sources: `OpenAlgoAdapter` (sends) and `OpenAlgoBooks` (books) pointed at the fake OpenAlgo on `127.0.0.1`, with a synthetic key that is no key; the kill input a plain file under the rehearsal directory |
| Owner's acts (binding, grants) | `perform_owner_acts` with the BuyerEdge binding the first-release profile ships | None; the binding's values are legacy's (Fork rule) |
| Fake OpenAlgo | A loopback `ThreadingHTTPServer`, modelled on the fakes in `tests/unit/test_provider_records.py:279-295` and `tests/integration/test_openalgo_contract.py` | New test support: answers `placeorder`, `basketorder`, `cancelorder`, `modifyorder`, `orderbook`, `tradebook`, `positionbook`, `funds` in **analyze shape** (`"mode": "analyze"`; book shapes from the captured analyze-mode files in `OA/tests/fixtures/legacy-buyer-edge/openalgo/` `orderbook_/positionbook_/tradebook_/funds_2026080[2-4].json`). Fills a MARKET order at the converted leg's LTP for the next minute (Fork call 2); triggers SL legs on the converted bars; squares off open MIS at 15:15 as OpenAlgo's sandbox does (`upstream-findings.md`, the sandbox square-off row; confirmed at the source before deepening). Funds: `availablecash` only, no margin field, as captured (2026-11-05 answer applies) |

Why not the production `OpenAlgoMarketSource` for market reads: it stamps records with the poll instant and needs a live-shaped history and chain API answering in recorded time. The shadow already solved replay timing with `LegacyMarketFeed`, so market reads keep that route. The fake OpenAlgo serves orders and books, which is the boundary that matters for the ledger. **Alternative named:** serve market reads through `OpenAlgoMarketSource` too, with a clock-aware fake. That proves more of the production adapter but needs a new recorded-time poll path; it is left as an open question.

**Per day, the record and the reconciliation:**

* Each trading day requires **non-zero decision and fill counts**, or a stated reason (NIFTY: `lot_size` unsourced, unless the owner accepts the October capture).
* Each trading day: open session → run to 15:30 IST → session close. Then compare the ledger's positions, commands, attempts and fills with the fake's orderbook, tradebook and positionbook. Every order and fill must match one-to-one (broker order ID join), quantities and prices exactly, the account flat after the 15:15 square-off, and `funds` consistent with the realised P&L the fake computed. Any difference fails the day. Unknown or extra rows go through reconciliation's foreign-activity path, as in production.
* Days run as **separate ledgers**, one per day, plus one five-day ledger run in sequence. The second proves session transitions over days (SLICE-14 step 2's continuity, with real data).
* Every result is labelled "converted simulation data, not legacy-comparable (no bid/ask)". NIFTY 3–4 Aug carry the `possible-wrong-expiry` label.

### Tests

`tests/replay/test_replayed_days.py`, marked `replay` and **skipped unless `AT_REPLAY_DATA` points at step 3's output**, so the suite never needs the real data. Plus a unit-size version over a synthetic two-hour day that always runs. Both assert: no send outside the fake's loopback port; the reconciliation table above; no `ADM-R09 observation_field_missing` on an empty successful book (the 2026-11-05 and `e7fcf25` behaviour); no protection attempt after the close (`78650d3`).

### Completion conditions (step 4)

Part A reaches `CONVERGED` on a fresh profile. Part B runs all five days for both underlyings, each day reconciled, with the decision and fill counts recorded in `docs/migration.md` (renamed in the deepening if "migration" no longer fits) under the label above. The rehearsal directory, the fake's port and the synthetic key live under a temporary directory and are removed afterwards. The step records that list of temporary items and confirms each one is gone.

### Decision (coordinator, 2026-11-13): NIFTY's lot size

No capture states a lot for NIFTY's `11AUG26` expiry. The converted NIFTY legs carry the 4 October 2026 capture's 65
(`option_chain_nifty_20261004.json`, expiry `06OCT26`), labelled in every leg (`lot_label: lot_size_out_of_period`)
and in `MANIFEST.json` (`lot_sizes`, `expiry: other`, `capture_expiry`). BANKNIFTY keeps its same-expiry 30; an
out-of-period lot never overrides a same-expiry one. Simulation data only: production reads live lot sizes.

### Step 4 as built

**Built** in OA_NEW `3db6e8d` on `slice-08` (after `165788a`; local only, not pushed).

| Part | Where |
|---|---|
| `--lot-out-of-period FILE` (the Decision above); the real data reconverted with it | `scripts/convert_recorded_days.py`, `tests/unit/test_convert_recorded_days.py` |
| The fake OpenAlgo: `ThreadingHTTPServer` on `127.0.0.1:0` only, analyze-shaped answers to the four books and `placeorder`/`basketorder`/`cancelorder`/`modifyorder`; MARKET fills at the leg's bar for the arrival minute, SL-M and LIMIT SELL on later closed bars, the 15:15 MIS square-off, funds = start cash (2 Aug capture's `availablecash`) + realised − held premium | `tests/replay/fake_openalgo.py` |
| `compose_replay` (test support, never in `COMPOSITIONS`): `rehearsal_guard(environ, base_url)` first, production profile refused, root inside the rehearsal directory, a synthetic `Secret` built in place (no `secrets.resolve`), `OpenAlgoAdapter` + `OpenAlgoBooks` on the fake, a plain kill file. `ReplayDriver` = `ShadowDriver` with `refresh` reading the whole converted day; the per-day reconciliation | `tests/replay/replay_harness.py` |
| Tests: the fence (guard first; six refusals before anything opens), the fake on loopback port 0, a synthetic afternoon with the scripted rule reconciled, and the five converted NIFTY days (`-m replay`, skipped unless `AT_REPLAY_DATA`) | `tests/replay/test_replayed_days.py`; `replay` marker in `pyproject.toml` |
| The per-day table | `docs/migration.md` "The replayed days" |

**Part A** (installer rehearsal to `CONVERGED` on a fresh profile) is step 1's
`test_fresh_first_install_converges_with_no_legacy_rules`, run in both suite runs below; nothing new was needed.

**The replayed days** (labelled "converted simulation data, not legacy-comparable (no bid/ask)"; NIFTY 3–4 Aug also
`possible-wrong-expiry`). Each day its own ledger; every day reconciled with **no difference**: orders and fills one to
one by broker order ID, prices and quantities exact, flat (fake and ledger), funds = start + realised; no connection
but the fake's port; no `ADM-R09 observation_field_missing`; no command after the session close.

| Day | Decisions | Admitted | Refused by code | Fills | End of day | Realised (synthetic) |
|---|---|---|---|---|---|---|
| 2026-08-03 | 340 | 38 | 79 PRT-R10 | 16 | flat | −702.00 |
| 2026-08-04 | 340 | 23 | 80 PRT-R10 | 12 | flat | −5,063.50 |
| 2026-08-05 | 340 | 39 | 31 PRT-R10, 4 ADM-R09 `amount` | 16 | flat | −1,488.50 |
| 2026-08-06 | 340 | 29 | 45 PRT-R10 | 10 | flat | −1,140.75 |
| 2026-08-07 | 340 | 39 | 43 PRT-R10 | 18 | flat | −1,472.25 |

BANKNIFTY: 0 decisions on all five days, by construction, not a replay defect: BuyerEdge is bound to NIFTY only, in
the port's descriptor (`strategies/buyer_edge.py:2021` `"underlying": "NIFTY"`; `create` at `:2753` builds the
object for the descriptor's underlying) exactly as legacy's `SPEC` (`src/strategies/buyer_edge.py:2109`
`underlying="NIFTY"` @445eb116). The host reads only its descriptor's underlying, so a BANKNIFTY-only store gives it
no bar. Each day ran its
market loop (5,641 steps) and reconciled empty and flat. Wall time per NIFTY day 321–813 s (p50 step 39–58 ms,
other runs sharing the CPU); per BANKNIFTY day 86–156 s. Store sizes per NIFTY day: ledger ≈ 2.2 MB, market store
3.2 MB, the whole run directory ≈ 21 MB.

**Run.** Targeted, twice: `tests/contracts`, `tests/replay`, `tests/unit/test_convert_recorded_days.py`,
`test_legacy_market.py`, `tests/integration/test_shadow_day.py`, `tests/recovery/test_release_activation.py`:
**662 passed, 10 skipped** both times (the five `replay` days skip there; they ran in the table above). `ast.parse`
passes on every edited file.

**Break checks** (`breaks_s4.json`): **8 of 8 caught**, each file restored and its md5 checked: the guard skipped; a
production profile accepted; a secret resolved; the fake bound to any host; a MARKET order never filled; no history
bars; an out-of-period lot overriding a same-expiry one; the out-of-period lot unlabelled.

**Deviations and differences**, each smaller than a decision:

* **D-4: bars from history, not ticks.** The converted days hold one-minute history bars and no ticks; the replay
  adds each spot bar as a `history_bar` record and binds BuyerEdge's view with `bars: history` (legacy's
  `spot_minute_bars`). Live BuyerEdge bars come from ticks.
* **The bound policy is synthetic.** No first-release BuyerEdge policy exists to bind (production policies are the
  owner's); the replay binds the suite's labelled `conftest.planner_policy()`, no review, product MIS (legacy's
  default, `orchestrator.py:155` @445eb116). The settings are the shadow day's labelled synthetic set.
* **The fake's sandbox rules come from `upstream-findings.md`**, not the source: `./openalgo/` is empty on this PC.
* **The kernel squares off first.** Its own exit (`EXIT_STARTED square_off`) closes every position before the fake's
  15:15 sandbox square-off, which found nothing to close on every day.
* **Five-day single ledger:** run in step 5 (its stores are step 5's inputs).

**Finding for the owner (not tuned).** Under `reconciliation.unknown_domain_settlement: forbid` (Q-006) and
OpenAlgo's books, which always read domain `unknown`, every completed entry is `settlement_withheld` and **keeps its
reservation `HELD`**: 5–9 held reservations a day, one per entry. On 5 August the held reservations (₹61,389.25 after
eight entries; end-of-day cash ₹63,321.85) left less than the next entry's amount, so four entries refused `ADM-R09
amount`. Live, the same rule would shrink entry capacity with every trade of the day. Whether that is intended for
OpenAlgo accounts is the owner's call.

**Temporary items, all removed:** each run's rehearsal directory, fake port and synthetic key lived under a scratchpad
temporary directory deleted after the run (`batch.py`); the converted data stays in `OA_NEW/run/replay-data/`
(ignored).

---

## Step 5 — backup and restore at real size, on this PC

### Decisions

* **Inputs:** the five-day ledger, evidence store and market store step 4 wrote. Real size here means the size the system really produces from five days (the original market files are only about 3 MB; the stores are larger). If the stores are too small to show timing, a scaled set (N copies of the five days on later calendar dates, written by the same replay) is used, with N chosen so the whole run fits in **2 GB of free disk**. The PC has about 9 GB free, and legacy's 2 GiB storage floor must stay untouched.
* **Destination: `DirectoryDestination`** (`operations/backup.py:95`). The owner answered "no restic install" on this PC (owner-answers, "Restic on the development PC", 2026-11-13).
* **The restic anchor gap** (`ResticDestination.anchor_put` raises `restic_anchor`, `operations/backup.py:180-181`) stays open and moves to step 7, where it is built and proved against the B2/R2 repository.
* **`backup.py main`** still refuses `destination_unbound` in every case (step 8 as built). This step wires `scheduled` and `status` to a **bound local destination** through a rehearsal profile only. A production profile still has nothing bound until step 7.
* **Restore:** `operations/restore.py` into a fresh empty directory. Then `scripts/verify_recovery.py synthetic` checks over the restored set, with the exact candidate wheel installed into a blank venv (the step 8 shortcut "digest only" is lifted here, since this PC can build the wheel). Then the kernel is started on the restored ledger through `restore-start.json` and must reach the routine advance with the same heads.

### Tests and records

Records: backup duration, set size, read-back result, restore duration and verification result for each destination run.

### Completion conditions (step 5)

One full backup → read-back → clean restore → kernel start on the restored ledger, on the five-day stores, with every head matching. Run on `DirectoryDestination`; the restic anchor gap is recorded as carried to step 7.

### Step 5 as built

**Built** in OA_NEW `770e537` on `slice-08` (local only, not pushed).

| Part | Where |
|---|---|
| `backup main`: outside a rehearsal it still refuses `destination_unbound` (POL-O01); inside one (`rehearsal_guard`: `AT_REHEARSAL` with its nonce, no `CREDENTIALS_DIRECTORY`) `scheduled` and `status` run against `DirectoryDestination` at `<rehearsal>/backup-destination`, as `install.py _destination` does; `paths.run` (log) and `paths.scratch` (staging) must lie inside the rehearsal; sources are the ledger, `market.store_path`, the evidence root (`bootstrap.evidence_root`) and `security.journal` when bound. `backup.destination` stays unbound | `operations/backup.py`; `test_main_runs_against_a_directory_only_inside_a_rehearsal` |
| **The night skip** (harness only, not production behaviour): `ReplayDriver._next_instant` maps an instant inside a night to its resume instant; `nights(days, start)` = 15:45 IST each day but the last → the next day's start. The multi-day run that crawled the nights at the 20 s grid (16+ h, killed) now takes 50 min for five days | `tests/replay/replay_harness.py`; `test_nights_lie_after_each_close_and_end_at_the_next_start`, `test_two_days_on_one_ledger_skip_the_night_and_reconcile` (two synthetic afternoons, bounded at 3,000 steps) |
| `compose_replay` passes `restore=`/`gap=` (the previous helper's change, kept); per-pass timings (`pass_ms`, step 6's input) | same |
| The five days on one ledger, `-m replay`, skipped unless `AT_REPLAY_DATA` | `test_converted_five_nifty_days_on_one_ledger_reconcile` |
| D10's checks over a real-size ledger with the real wheel, `-m replay`, skipped unless `AT_REPLAY_LEDGER`/`AT_REPLAY_WHEEL` | `test_verify_recovery_synthetic_over_a_replayed_ledger` |
| The rehearsal: wheel → blank venv → set → full read-back → restore into empty directories (exact-artifact refusal first) → the replay's kernel on the restored ledger via `restore-start.json` → the unit entry `backup scheduled`/`status` in a rehearsal | `scripts/rehearse_fresh_start.py backup` (dev tool, never shipped) |
| Docs | `docs/operations.md` (backup paragraph; the real-size rehearsal), `docs/migration.md` (the five-day table) |

**The five-day ledger** (converted simulation data, not legacy-comparable): reconciled with no difference; 1,700
decisions, 41 admitted, 18 fills, 5 sessions opened and closed, flat, 4 nights skipped, 29,105 steps, head 2,860.
Day 1 equals its own-ledger run (38 admitted, 16 fills). Then 3 admitted on 4 August and none after: 225 entries
refused `ADM-R09 amount`. **Owner finding (step 4's, now across days):** under `unknown_domain_settlement: forbid` the 9
`HELD` reservations (₹63,228.75 of ≈₹64,800 cash) survive the session boundary, so one day's held entries block every
later day. Not tuned; it is the owner's call whether that is intended for OpenAlgo accounts.

**The rehearsal at real size** (Windows development PC, 4 CPUs; `step5.json`):

| Measured | Value |
|---|---|
| Sources | ledger 4,980,736 B; market store 15,998,976 B; evidence 2,737,811 B |
| Wheel | 927,694 B, sha256 `f6f02660…a359`, built 19.0 s; blank venv install 9.0 s (251 files) |
| Backup (stage, upload, read back, anchor) | 7.02 s; set 22,093,291 B in 225 objects; staging 22,216,289 B; space estimate 27,907,595 B; 1 gap (`security.journal` unbound, as designed) |
| Full read-back (all 225 objects) | 1.51 s, 0 mismatches |
| Restore into empty directories | 2.48 s; 22,128,159 B; head 2,860 `e76472fd…` = the set's; legacy fingerprint equal; market store restored; another bundle digest refused `CFG-R09` |
| Kernel start on the restored ledger | `RECOVERY_WRITING`; same head row; advance before the fence refused `fence_required`; fence then advance `Committed` → `OPERATING`; 0.87 s; no alerts |
| Unit entry `backup scheduled` (backup + restore test) | exit 0, 10.69 s, destination 21,741,460 B; `status` exit 1: backup and restore test `OK`, check `NEVER` (`DirectoryDestination` has no check), both custody lines `UNSURE` (unbound, as designed) |
| D10 over the five-day ledger, real wheel | every check `pass` except `custody: not_composed` (as before) and `unresolved_effects`: not applicable, the ledger has no attempt in flight at its end (the synthetic CP-L3a test proves it) |

"Routine advance" in the Decisions above: a restored ledger always needs the owner's fence and advance
(`SES-R09 fence_required`), so the start reached `OPERATING` that way, with the heads equal.

**Run.** Targeted, twice: `tests/contracts`, `tests/replay`, `tests/recovery/test_recovery_set.py`,
`test_restore_fencing.py`, `test_initial_cutover.py`: **810 passed, 14 skipped** both times. The `replay` tests ran
separately: the five-day test 1 passed (50 min), the D10 test 1 passed (46 s). `ast.parse` passes on every edited file.

**Break checks** (`breaks5.json`): **5 of 5 caught**, each file restored and its md5 checked: `main` without the
rehearsal guard; staging outside the rehearsal accepted; no night skipped; the night starting before the close; the
skip ignoring the nights.

**Carried:** the restic anchor gap (`ResticDestination.anchor_put` raises `restic_anchor`) moves to step 7, unchanged.
**Temporary items:** the kept run, the rehearsal work, the wheel and the blank venv lived under the scratchpad and were
deleted after step 6 read them.

---

## Step 6 — measurement on the replayed days

What SLICE-11 step 9 can still produce without a server. Its server half (legacy's read load on the account, copying recorded sessions on the EC2) is void.

| Measured | From | Feeds |
|---|---|---|
| Ledger, evidence and market store growth per day, by underlying | Step 4's stores | `storage.critical_reserve_bytes` proposal, disk sizing for the new server |
| Replay wall time per day; kernel pass time p50/p95/max; strategy pass time | Step 4 timing (`perf_counter` around each driver step) | `host.pass_interval_secs` headroom (a record only, never a change) |
| Backup set size, backup and restore duration, staging space used | Step 5 | `envelope.backup_reserve.*` proposal |
| Reader impact and supervisor impact | `measure_reader_impact`, `measure_supervisor_impact` (`operations/verification.py:67`, `:134`) on the five-day ledger | Supervisor caps |

Each value becomes a measurement record with its source, the command and the machine. The planning check found no `Measurement` record type in OA_NEW (`class Measurement` does not occur), so the deepening defines its form in `operations/verification.py`, or records it in `docs/` if the spec's form is a document. **Nothing is bound.** The owner approves values with the release binding at step 7. Windows timings are labelled as such: they are not the server's.

**Not producible here:** OpenAlgo's real request load and rate budget, broker latency, the market host's live poll cost, Linux I/O. All of these go to step 7.

### Step 6 as built

**Built** in OA_NEW `f202caa` on `slice-08` (after `770e537`; local only, not pushed).

| Part | Where |
|---|---|
| `Measurement(field, method, workload, environment, artifact, settings_revision, samples, source_ref, at)` as the runtime spec defines it; `samples` = count/p50/p95/p99/max (nearest rank) plus `unit`; `environment(host)` = the caller's label, OS, CPU, cores, memory, free disk, Python, SQLite (never the network name); incomplete records refused; `write_records`/`read_records` as JSON lines; `records_digest` (ordered sha256, the bundle's `measurements` field) | `operations/verification.py`; `tests/unit/test_measurement_record.py` |
| `measure_ledger_reads(path, accounts, cycles, budget_ms, now)`: the supervisor's snapshot (`read_model`) and a full event read over an existing ledger, read-only | same |
| `scripts/rehearse_fresh_start.py measure`: the records from step 4's per-day reports, the five-day run (pass timings from step 5's harness), `step5.json`, the reads over a copy of the five-day ledger, and the commit-side impact | the script |
| The records: **35**, digest `e024494c1bf921e1bb53165b31efd4c9a339e26a813da43d356b0013e2946c14`, artifact `git:770e537… wheel:f6f02660…` | `docs/measurements/slice-15-windows-rehearsal.jsonl`; `docs/operations.md` |

**Nothing is bound.** Every value below is evidence for the owner's approval at step 7. Machine: development PC,
Windows 11, 4 cores, 12.8 GB, Python 3.14.0, SQLite 3.54.1. **Windows timings, not the server's**; replayed workloads
are converted simulation data, not legacy-comparable.

| Measured | Value | Feeds |
|---|---|---|
| Ledger growth per NIFTY day (file, without WAL) | p50 2,199,552 B, max 2,285,568 B (5 days) | `storage.critical_reserve_bytes`, disk sizing |
| Market store per day | NIFTY 3,244,032 B; BANKNIFTY 2,416,640 B | same |
| Whole run directory per day | NIFTY p50 21.1 MB, max 21.2 MB; BANKNIFTY 8.75 MB (0 decisions, ledger 4 KB) | same |
| Five days on one ledger | ledger 4,980,736 B (2,860 events); evidence 2,737,811 B; market 15,998,976 B; whole run directory 39,379,717 B | same |
| Replay wall time | NIFTY day p50 509 s, max 813 s; BANKNIFTY p50 103 s; five days on one ledger 3,014 s | record only |
| Kernel (coordinator) pass, every scheduled and woken pass | 81,537 calls: p50 8.1 ms, p95 61.0, p99 136.9, max 593.5 | `host.pass_interval_secs` headroom (20 s bound) |
| Strategy host pass | 5,825: p50 35.8 ms, p95 204.9, p99 385.9, max 2,080.8 | `strategies.host.pass_secs` |
| Market commit | 1,874: p50 4.0 ms, p95 22.3, max 673.5 | `market.poll_interval_secs` |
| Observation read (fake OpenAlgo on loopback) | 23,285: p50 26.6 ms, p95 70.8, max 1,474.7 | `observation.poll_interval_secs` |
| One driver step (all of the above) | 29,105: p50 75.2 ms, p95 269.7, max 6,343 | `host.pass_interval_secs` |
| Backup set / staging / estimate / destination | 22,093,291 / 22,216,289 / 27,907,595 / 22,216,593 B | `envelope.backup_reserve.*` |
| Backup / full read-back / restore / unit `scheduled` | 7.02 / 1.51 / 2.48 / 10.69 s | same |
| Supervisor snapshot over the five-day ledger | 200 reads: p50 111.6 ms, p95 136.9, max 203.3; full event read p50 41.3 ms | `supervisor.read_budget_ms` |
| Commit latency, 400 synthetic open entries | with the supervisor reading: p50 26.9 ms, p95 87.5, max 635; without: p50 25.7, p95 33.6, max 278; WAL max 519,152 B; 400 of 400 checkpoints completed | `supervisor.poll_secs` |

**Finding (performance, not changed here).** The supervisor's snapshot cost grows with open commands on an account:
`lifecycle.ledger_view` runs one `FILL` lookup per open command (`SELECT … WHERE kind = 'FILL' AND command_key = ?`).
With 800 synthetic open entries on one account the snapshot exceeded a 2,000 ms budget (`SnapshotGap`); 400 stayed
inside it. Live accounts hold a handful of open commands, so this is not a present limit, but `supervisor.read_budget_ms`
should not be set from the five-day figure alone. Indexing or batching that lookup is a framework item (not a money gate),
recorded here for the coordinator to file.

**Deviation from the table above.** "Reader impact and supervisor impact on the five-day ledger": the measurement kernel
(`_measurement_kernel`) cannot advance the replayed ledger (it holds no lease store and the ledger's binding needs the
replay account's lease, `SES-R10 lease_held`), so it never writes into it. The reads were measured read-only on a copy
of the five-day ledger (`measure_ledger_reads`); the commit-side impact on a fresh ledger with synthetic entries,
stepped 50 → 800 until the budget broke.

**Run.** Targeted, twice: `tests/contracts`, `tests/unit/test_measurement_record.py`,
`tests/integration/test_supervisor.py`, `tests/recovery/test_restore_fencing.py`: **708 passed, 6 skipped** both
times. `ast.parse` passes on every edited file.

**Break checks** (`breaks6.json`): **5 of 5 caught**, each file restored and its md5 checked: p95 at the 90th rank; a
record without p99 accepted; the digest ignoring order; the machine's network name in the environment; the ledger read
counting one event.

**Temporary items, all removed:** the kept five-day run, step 5's work (wheel, blank venv, destination, restored host),
step 6's copies and impact ledgers, the per-day reports copy, and the old `s4` scratch (`rpl-*`, `s5`).

---

## Step 7 — the new server (outline; needs the owner and a server)

Every part is asked first. Order:

1. **The owner provides the server** (Debian, as before) and its access. Disk is sized from step 6.
2. **OpenAlgo** installed from upstream (the mirror in `./openalgo/` is read, never modified) and started in **`analyze`**. Re-fetch spot history for 2026-08-03…07 and compare it with the converted spot (step 3's deferred check).
3. **Backup account**: the owner creates the B2 or R2 bucket and key, puts the restic password and the storage credential off the machine, and binds `backup.destination`, `backup.retention` and both custody confirmations. Then `ResticDestination` gets its anchors (built here) and is run against the real repository once (SLICE-11 step 11's restore, now on this destination: back up, restore on a clean directory, verify).
4. **Staging (SLICE-11 step 10, moved here):** `install.py stage` and `check` to `VERIFIED_DISARMED` with the fresh profile. Bind `release.license`, `account.*`, `account.limits.*` (legacy's 445eb116 values, Fork call 1), `recovery.lease_store` and the lease timings, and the measured values the owner approves. Install the sudoers lines (step 2's test named in the record), the polkit rules and the sysusers file. Then `activate` through `FIRST_INSTALL` to `CONVERGED`.
5. **Every Linux-only row** in [the waiting list](#linux-only-rows-waiting-for-the-new-server) is run here and recorded pass or fail. A failure is fixed in the slice that owns it before step 7.6.
6. **One or two sessions with OpenAlgo in `analyze`.** The system trades for real through OpenAlgo's public API; OpenAlgo's sandbox decides that nothing reaches the broker. No gate in the code. The supervisor runs against the real ledger (PRF-OPS-09, from SLICE-13 step 7). The day's books and ledger are reconciled as in step 4.
7. **The owner switches OpenAlgo to live.** That switch is the moment of control (owner's answer: no strategy-timer binding hold). The first live session's sends are checked against OpenAlgo's books.

## Completion conditions

* Steps 1–6 are built, tested twice and break-checked, each recorded "as built" here.
* The isolated-work wildcard test (step 2) passes, and its name is recorded for step 7's install.
* Step 4's reconciled days and step 6's measurements are recorded with the "converted simulation, not legacy-comparable" label.
* Step 5 ran on `DirectoryDestination`; the restic anchor gap is carried to step 7.
* Step 7 is done on the owner's word, or recorded as waiting, with the server, the backup account and the licence named.

## Carried after the fresh check (2026-11-14)

A fresh reviewer read SLICE-08…15 against OA_NEW `f202caa`. Every step is built (all cited commits exist) or marked void/moved. Items that had no live home are carried here; Linux-only ones are rows in [the waiting list](#linux-only-rows-waiting-for-the-new-server).

* **Bundle candidate schema** (SLICE-12 line 1421): `operations/deployment.py:178-180` still writes `candidates_schema: None` and `readers.candidate: []` though `resources/candidates.schema.json` exists. Buildable on this PC; next framework item.
* **TASK-S12-09 golden file** (SLICE-12 lines 9, 34, 137): `tests/fixtures/research/legacy_identity_445eb116.json` does not exist, so `test_candidate_freeze.py:185` and `test_custody_ledger.py:213` always skip. The first half needs only the local legacy checkout at 445eb116 and synthetic inputs, so it is buildable here; the second half (the EC2 comparison) is void with the server.
* **Supervisor snapshot cost** (step 6 finding): one FILL lookup per open command; past the 2,000 ms budget at 800 open entries, inside it at 400. Live accounts hold a few. Framework item, not a present limit.
* **SLICE-14 "not built, carried" lists** (SLICE-14 lines 349-357, 480): void with the fresh start — key probe, shadow copier, legacy polkit, `REFUSAL_SIGNATURES`. Still live, carried to step 7.6: the `ops09-record/1` format for PRF-OPS-09, `verify_recovery.py` calling `projection_heads` (it does not today), and the spec-owner integration edits.
* **Stale text** (low): `config/live.example.yaml:35,47`, SLICE-13 line 1244, SLICE-14 lines 513-516 and SLICE-11 lines 2762-2765 still name SLICE-11 steps 9/10, the copier's EC2 dry start and cutover steps 4/5; read them as superseded by this slice. The "every step below is an outline" status lines of SLICE-09…15 predate the as-built notes.
* **Owner finding, not tuned** (step 5): `HELD` reservations under `forbid` carry across days; by the end of day 2 nine hold ₹63,228.75 of about ₹64,800 cash, and from day 3 every entry is refused for funds (225 refusals). Proposal only; the owner decides.

## Open questions for the owner

Closed 2026-11-13: restic on this PC (no; directory destination); `--network` (allowed per spec); NIFTY 3–4 Aug (run, labelled `possible-wrong-expiry`); missing bid/ask (accepted); market reads (`LegacyMarketFeed`, as planned).

1. ~~NIFTY lot size~~: closed 2026-11-13 (coordinator): the 4 October capture's 65, labelled `lot_size_out_of_period` (step 4 Decision).
