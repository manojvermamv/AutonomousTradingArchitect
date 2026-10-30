# Configuration, artifacts and release

* **Status:** proposed (package spec), deepened when SLICE-11 started (2026-10-30) from the stub this file was. Not yet reviewed by EGM; it is reviewed with the [SLICE-11 slice file](../plan/slices/SLICE-11-packaging-release-supervision.md). Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `pyproject.toml`, `requirements.lock` | [Packaging](#packaging-pyprojecttoml-requirementslock) |
  | `settings/schema.py` | [The settings contract](#the-settings-contract-settingsschemapy), [The participant contract](#the-participant-contract-settingsschemapy), [Boundary handshakes](#boundary-handshakes-settingsschemapy) |
  | `settings/loader.py`, `resources/defaults.yaml` | [The resolver](#the-resolver-settingsloaderpy) |
  | `bootstrap.py` | [Bundle manifest](#bundle-manifest-bootstrappy), [Loaded-artifact verification](#loaded-artifact-verification-bootstrappy), [Compositions](#compositions-bootstrappy), [Account limits](#account-limits-bootstrappy), [History compatibility](#history-compatibility-bootstrappy) |
  | `resources/*` other than migrations (each migration is specified by the spec that adds its tables; `001_initial.sql` by the [ledger spec](ledger-and-atomic-transaction.md)) | [Packaging](#packaging-pyprojecttoml-requirementslock) |
  | `config/*`, `.github/workflows/verify.yml`, `.pre-commit-config.yaml`, `docs/*` | [Repository files](#repository-files) |

* **Contributes to:** `deploy/install.py` (specified in the [runtime spec](runtime-isolation-observability-deployment.md#installer-deployinstallpy)): the [release transitions](#release-transitions) it records and the [activation boundary](#the-activation-boundary) it checks. `kernel/admission.py` ([intent spec](intent-to-admission.md)): the account layer of the session limits and legacy's merge rule ([Account limits](#account-limits-bootstrappy)). `adapters/unix_channel.py` ([security spec](security-and-operator.md)) and `market/store.py` ([market spec](market-data-and-canvas.md)): the [handshake](#boundary-handshakes-settingsschemapy) they exchange. `operations/deployment.py`, `operations/backup.py` and `operations/restore.py` stay in the [migration spec](migration-recovery-rollback-continuity.md); this spec gives them the manifest fields they read.
* **Consumes:** `kernel.recovery`'s `RELEASE_BOUND` and its routine-advance checks ([sessions spec](sessions-authority-lifecycle.md#send-lease-kernelrecoverypy)); `kernel.ledger.schema` (the stored migration revision); `settings.secrets` (credential references, [security spec](security-and-operator.md)).
* **Consumed by:** every process at start (`bootstrap`); the installer; the supervisor (the effective revision and the release identity it reports).
* **Master anchors:** D05 (`README.md:895`), A04-F3 (`README.md:897`), D06 (`README.md:899`), A02-F1 (`README.md:901`), A02-F2 (`README.md:903`), A02-F3 (`README.md:905`), A02-F4 (`README.md:907`), Combined-F6 (`README.md:909`), A09-F1 (`README.md:929`), A10-F2 (`README.md:1165`); the reuse row for config and packaging (`README.md:1158`); the acceptance rows (`README.md:1221`, `README.md:1225-1227`, `README.md:1233`, `README.md:1248`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root. The built target code cited as `OA_NEW` is at `536f857`.

## Overview

**In plain words.** Today the trading system runs straight out of a git checkout. A deploy fast-forwards that checkout, reinstalls packages into it, and restarts the services. Settings are merged from four layers of files and environment variables, and two names for the same setting can disagree without anyone noticing. The new design builds one installable package and installs it, with its exact locked dependencies, into a new numbered release folder. A small manifest file lists every file and fingerprint that release must have. Each process checks, when it starts, that what it actually loaded matches that manifest, and refuses to start if not. Settings come from three layers only: the packaged defaults, one profile file, then a short list of allowed environment variables. A process reads them once when it starts and never re-reads them. Switching to a new release is one recorded step that can be resumed after a crash. Nothing here changes a trading rule or limit. Every value that touches money stays exactly as the old live system has it, or stays unset, so the system refuses to start until the owner sets it.

## The problem

* **The checkout is the runtime.** Legacy finds its configuration at `parents[2]` of its own file (`src/config/__init__.py:52-55`). It lists its packages by hand (`pyproject.toml:112-167`, LD-19), and it deploys by fast-forwarding the live checkout and running `pip install -e` in it (`deploy/deploy_tier1.py:618-659`, `:661-702`). An installed wheel run from another directory is unsupported.
* **Settings conflicts resolve silently.** Environment overrides are applied in `os.environ` order (`src/config/__init__.py:452-462`), so `AT_OPENALGO_CONTAINER` and `MCP_OPENALGO_CONTAINER`, two aliases of one setting (`:64-65`), resolve by accident. An explicit `null` reads as "use the default" (`:466-472`). An unknown key is accepted. An owner-managed `owner.yaml` layer sits between the profile and the environment (`:428-439`).
* **Two settings contracts.** The research worker's environment allowlist (`src/analysis/jobs/policy.py:33-37`, `:95-107`) refuses the `AT_RUN_DIR` its own unit sets (`deploy/systemd/at-research-worker.service:13`). That is LD-18 (F5).
* **The release identity is the git revision.** Legacy's release binding digests the checkout revision, the source tree, the effective config, the units, the service start records, the SQLite runtime, the schema version and the epoch (`src/tier1/release.py:54-79`). Each of those reflects what the checkout says or a service last wrote. None of them verifies the bytes a process actually loaded (A02-F4).
* **Rollback is a manual procedure.** After the first new-authority request, legacy prints the steps of a hand rollback: stop, check out an older commit, reinstall, start (`deploy/deploy_tier1.py:1561-1570`). Nothing checks that the older code can read the current ledger before it starts.

## Goals

* One installable application, discovered packages, resources loaded through package-resource APIs, runnable from any directory with no checkout and no `.git` (REQ-CFG-001).
* One typed contract for each participant's settings, used both to render its unit and to validate its environment at start (REQ-CFG-002).
* One resolver with explicit precedence and explicit rules for omission, `null`, unknown keys and aliases; a recorded effective identity without secrets (REQ-CFG-003).
* An immutable resolved revision per process lifetime (REQ-CFG-004).
* An exact bundle manifest; loaded artifacts verified at start; rollback refused when the older bundle cannot read the current history (REQ-CFG-005).
* Recorded, resumable release transitions (REQ-CFG-006), the first-release composition (REQ-CFG-007), and activation only on the owner's word (REQ-CFG-008).
* Money behaviour exactly as the legacy live system has it, including its two-layer entry limits; owner-only items left unbound (REQ-CFG-009).
* Convergence proved at every process boundary, not assumed from a deploy (REQ-CFG-010).

## Non-goals

* **No new money value.** Every refusing field keeps its register entry ([refusing-parameter register](cross-cutting-invariants.md#refusing-parameter-pattern-req-xc-003)); measured ones stay unbound until TASK-S11-07 measures them and the owner approves them with the release binding.
* **No licence choice** (`README.md:1131`). The field `release.license` stays unbound, and a production bundle refuses to stage without it (below).
* **No hot reload.** No file watcher, no reload signal, no settings API that changes a running process (A02-F3).
* **No mixed-version operation.** Rolling upgrades are not selected (A04-F3); every participant of a release runs that release.
* **Not the recovery set.** The backup manifest, the backup and restore commands, the lease store adapter and the cutover are in the [migration spec](migration-recovery-rollback-continuity.md).
* **Not secrets.** How a credential reference resolves, and how credentials rotate, is `settings/secrets.py` ([security spec](security-and-operator.md)). This spec only says which participant may hold which reference.

## Requirement keys

<a id="requirement-keys-pointers"></a>

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-CFG-001 | One installable application; package discovery; packaged immutable resources; runs without the checkout or `.git` | D05 (`README.md:895`); LD-19 |
| REQ-CFG-002 | One typed worker settings contract feeds unit rendering and runtime validation | D06 (`README.md:899`); LD-18 |
| REQ-CFG-003 | Same resolver per process: packaged defaults, then profile, then scoped environment; conflicting alias and replacement is an error | A02-F2 (`README.md:903`) |
| REQ-CFG-004 | Resolved settings are immutable per process lifetime; changes happen at restart or session boundaries | A02-F3 (`README.md:905`) |
| REQ-CFG-005 | Exact tested bundle manifest binds artifacts, resources, schema identities and migration revision; rollback is refused when the older bundle cannot read current history | A02-F4 (`README.md:907`) |
| REQ-CFG-006 | Staged release transitions are recorded; partial activation resumes from recorded facts | A04-F3 (`README.md:897`) |
| REQ-CFG-007 | One explicit first-release composition with required, optional and deferred participants; nothing chosen silently | A10-F2 (`README.md:1165`); A09-F1 (`README.md:929`); [Q-005](../decisions/owner-questions.md#q-005) |
| REQ-CFG-008 | Deploy only on the owner's explicit word for that deploy | POL-050 |
| REQ-CFG-009 | Money behaviour in packaging and release keeps legacy's live behaviour; owner-only items (licence, account, backup destination, RTO) stay refusing | [Standing rules](../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30); REQ-XC-003 |
| REQ-CFG-010 | Running processes prove convergence at each boundary: every handshake carries the bundle digest, the contract and its exact version, and the relevant projection digests; a mismatch or an unknown required variant refuses | A02-F1 (`README.md:901`); A02-F2 (`README.md:903`) |

## Critical user journeys

### CUJ-CFG-1: A release is staged and switched

The owner's word is recorded for release `0.4.0+3f1c2a9d0b11`. The installer builds `releases/0.4.0+3f1c2a9d0b11/` from the wheel and the locked dependencies, installs them with every hash checked, and writes `bundle.json`. It runs each entrypoint's `--check` from the new release in a blank environment with no credential. Every check passes, so the release is `VERIFIED_DISARMED`. After the close, with the broker flat and nothing unsettled, it stops the participants that act (the strategy host, the operator relay, the kernel, the market process) and keeps the observation route running. It reads the books again through that route: still flat. It confirms the old kernel has no process and released its leases `clean`, writes the new unit set beside the old one, checks the boundary a third time and swaps the `current` link. It starts the observation route and the supervisor first and waits for their identity records, then the market process, then the kernel. The kernel verifies the bytes it loaded against `bundle.json` and binds the release (`RELEASE_BOUND`). The installer records `CONVERGED` only once each operation's required participants have published identity records naming this bundle, and the backup timer is enabled and waiting.

### CUJ-CFG-2: A profile file is edited during the session

At 11:05 an operator edits the profile and changes `supervisor.poll_secs`. Nothing running notices: every process resolved its settings at start. The next start of the supervisor (a restart, or the next release) reads the new value, and its effective revision changes. The kernel's revision and `RELEASE_BOUND` are unchanged until the kernel itself restarts.

### CUJ-CFG-3: A rollback that the history forbids

Release B added migration 008. After B has run, the owner asks to go back to release A, whose bundle supports migrations up to 007. The installer reads the ledger read-only and finds revision 8. It refuses with `CFG-R09` (`incompatible_history`) and changes nothing. The ledger is never restored to an older copy to make the rollback pass (A02-F4).

### CUJ-CFG-4: A crash between the switch and the start

The installer's process is killed after it swapped the `current` link and before it started any unit. On `--resume`, the host's transition log shows `SWITCHED` with no later step. The installer does not infer success from the link: it starts the units in order and waits for their identity records, then records `CONVERGED` or the failure position. Had the owner chosen `--restore` instead, it would first stop every unit of the new set and verify none runs, then put back the old unit set and link, reload systemd and start the old set, so old and new never run side by side (A04-F3). Once the new kernel has migrated the schema, `--restore` is refused (`CFG-R09`) and only roll-forward remains.

## Technical plan

### Packaging (`pyproject.toml`, `requirements.lock`)

* **As built (SLICE-01):** `setuptools>=69`, `[tool.setuptools.packages.find] where = ["src"]` with namespaces, package data for `resources/*.yaml`, `resources/*.json` and `resources/migrations/*.sql`, Python `>=3.11` (OA_NEW `pyproject.toml`).
* **Entrypoints** (`[project.scripts]`), each a function in `bootstrap.py` that resolves settings, verifies the bundle and composes one participant:
  * `at-kernel`: the ledger writer, coordinator, admission, protection and observation loop, and the host loop that drives them ([runtime spec](runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy));
  * `at-market`: the market process ([market spec](market-data-and-canvas.md#ingestion-and-merge-marketingestpy));
  * `at-supervisor`: the independent supervisor;
  * `at-observer`: the observation mediator, declared only when it is built (TASK-S11-06);
  * `at-strategy`: the strategy host (`strategies/worker.py`, SLICE-09), one strategy per process, BuyerEdge in the first release;
  * `at-operator`: the owner API relay (`interfaces/api.py`, SLICE-10), and `at`, the operator CLI (`interfaces/cli.py`, SLICE-10), which also carries the recovery commands (D05);
  * `at-cognition`, only when BuyerEdge's bound review policy needs cognition (SLICE-09).

  SLICE-09 and SLICE-10 are built before this slice, so step 2 declares all of these at once. Research entrypoints wait for SLICE-12.

  Each entrypoint accepts `--check`, which resolves, verifies, validates the composition and exits without opening any writable store, socket or broker connection. The installed-artifact test runs every declared command this way (`README.md:1221`).
* **Extras:** `test` (pytest, hypothesis, as built). Optional capabilities (research, RL) add their own extras when built; no placeholder extra is declared.
* **`requirements.lock`** pins every runtime distribution with `--hash=sha256:` lines, in pip's requirements format. Its header names the generator and the Python version it was resolved for. The installer installs with `--require-hashes --no-deps`, so an unpinned or substituted distribution fails the install. Legacy pinned with an optional constraints file (`deploy/deploy_tier1.py:95-97`), without hashes.
* **Python.** The target keeps `>=3.11`. The EC2's interpreter version is **not checked** here; legacy declares `>=3.10` (`pyproject.toml:9`), and its clean-host rehearsal script says it needs 3.12+ (`deploy/rehearse_clean_host.py:15`). The bundle records the exact interpreter (below), and step 10 of the slice records the production host's.
* **Resources** are loaded only through `importlib.resources` (as `settings/loader.py` already does for `defaults.yaml`). `resources/candidates.schema.json` and `resources/canvas.schema.json` are packaged when the slices that write them add them.

### The settings contract (`settings/schema.py`)

* **One table, `FIELDS`,** declares every setting. Each entry is `Field(key, kind, env, scope, aliases, secret, register)`:
  * `key`: the dotted name (`market.poll_interval_secs`);
  * `kind`: one of `int_pos`, `int_nonneg`, `enum(values)`, `money` (a canonical money string, `kernel/ledger/envelope.py`'s `is_money`), `decimal`, `bool`, `path(storage_class)`, `text`, `credential_ref`;
  * `env`: the one environment name that may override it, or none. The SLICE-04 to SLICE-07 names (`AT_DEADLINE_MS_ENTRY` and the others in `settings/loader.py:68-98`) are kept unchanged;
  * `scope`: either `shared:<projection>` (the field must agree between participants; projections below) or the participants that read it;
  * `aliases`: deprecated names, each with its replacement;
  * `secret`: true only for `credential_ref` fields, whose value is a reference such as `credential:openalgo-trading`, never the secret;
  * `register`: the refusing-parameter register's row, when the field is refusing.
* **Today's 27 fields** (the four in `settings/loader.py:26-45` and the 23 of `_ADMISSION`, `settings/loader.py:68-98`) move into `FIELDS` with their names, kinds and environment names unchanged. `Settings` stays a frozen dataclass and `Settings.ADMISSION_REQUIRED` stays.
* **New fields** are listed in [Policy inputs](#policy-inputs) here and in the runtime spec's [Policy inputs](runtime-isolation-observability-deployment.md#policy-inputs). Every one is refusing or deployment-specific; none gets a shipped value.
* **Projections.** A projection is the set of fields two participants must agree on:
  * `market`: `market.poll_interval_secs`, `market.bar_confirm_lag_secs`, `market.calendar`, `market.views.*` (kernel, market process, supervisor);
  * `observation`: `observation.poll_interval_secs`, `observation.max_requests_per_minute`, `supervisor.max_requests_per_minute` (kernel, supervisor, mediator);
  * `recovery`: `recovery.routine_advance`, `recovery.routine_advance_limit`, `recovery.lease_secs`, `recovery.lease_renew_secs` (kernel, installer).

  `projection_digest(name)` is the SHA-256 of the canonical JSON (`kernel/ledger/envelope.py`'s `canonical`) of the projection's keys and normalized values. Paths and credential references are never in a projection, so service-specific paths and credentials cannot cause a false mismatch (A02-F2).
* **The shared budget.** The kernel's reads (four per cycle, `settings/loader.py:56`) plus the supervisor's must fit `observation.max_requests_per_minute` per account: `4 × ceil(60 / observation.poll_interval_secs) + supervisor.max_requests_per_minute ≤ observation.max_requests_per_minute`. The loader refuses a pair that does not (`CFG-R03`). This extends today's `budget_check` (`settings/loader.py:59-64`) and sets no value.

### The participant contract (`settings/schema.py`)

* **`PARTICIPANTS`** declares, per participant, the one contract both the unit renderer and the participant's own start check read (D06):

  ```text
  Participant(name, entrypoint, unit, fields_required, path_fields,
              env_allowed, credentials_allowed, credentials_forbidden, storage)
  ```

  * `env_allowed`: the only environment names the process may receive: `AT_PROFILE`, `AT_RELEASE`, the field `env` names in its scope, and the system names systemd sets (`INVOCATION_ID`, `JOURNAL_STREAM`, `CREDENTIALS_DIRECTORY` and the like, as legacy's `_SERVICE_ENV_KEYS`, `src/analysis/jobs/policy.py:33-37`);
  * `path_fields`: the non-secret paths the unit passes (LD-18's `AT_RUN_DIR` case is a path field, so it is both rendered and accepted);
  * `credentials_allowed`: the credential references it may load;
  * `credentials_forbidden`: names it must never see. Every participant but the kernel, the market process and the mediator forbids the account's OpenAlgo key and every legacy name that sets it (`OPENALGO_API_KEY`, `MCP_OPENALGO__AUTH__API_KEY`, `AT__OPENALGO__AUTH__API_KEY`; legacy's own list is `src/config/__init__.py:213-229`). **Fork call (the market process keeps the key):** OpenAlgo issues one key per user, and legacy's market poller ran inside the MCP gateway with the shared settings file that holds it (`deploy/systemd/mcp-gateway.service:40`). The target keeps that: the market process holds the account's key, composes only the market half of the adapter, and is isolated by its unit. Routing market reads through the mediator is listed as a spec-only improvement; the mediator serves only the books (execution spec);
  * `uid`: the participant's own system user. Each service runs as its own user; read access to another's store is through a read-only group, and channel access is as SLICE-10 settles it (socket group access);
  * `storage`: the storage classes it writes ([runtime spec](runtime-isolation-observability-deployment.md#storage-classes-operationsisolationpy)).
* **The start check.** `bootstrap.check_environment(participant, os.environ)` refuses with `CFG-R07` (`forbidden_credential`) when a forbidden name is present, and with `CFG-R01` (`unknown_key`) when an `AT_` or `MCP_` name is outside `env_allowed`. The renderer writes only `env_allowed` names into the unit. So a unit rendered from the contract always passes its own start check, and a hand-edited unit that adds a credential fails it.
* **First-release participants** are in [Compositions](#compositions-bootstrappy).

### Boundary handshakes (`settings/schema.py`)

Deploying participants together does not prove that the running processes converged (A02-F1). Each boundary therefore checks a handshake when it opens, and again when the peer reconnects.

* **The record:** `Handshake(bundle_digest, contract, contract_version, projections: {name: digest})`. `contract` names the exchange (`channel`, `market_store`, `observation`); `contract_version` is that exchange's exact version in this bundle; `projections` holds the digests of the projections the boundary shares ([settings contract](#the-settings-contract-settingsschemapy)).
* **The check:** `check_handshake(local, remote, *, needs) -> list[str]`. It compares the bundle digest, the contract and its exact version, and each projection in `needs`. Any difference refuses the connection with `CFG-R14` (`handshake_mismatch`), naming the field. A contract or variant the local side does not know is refused, never guessed into a valid action (A02-F1). Paths and credentials are not in a handshake, so they cannot cause a false mismatch (A02-F2).
* **Where it runs:**

  | Boundary | Who sends | Who checks | Needs |
  |---|---|---|---|
  | The kernel's local channel (operator relay, CLI, strategy host, cognition) | The client, in its first frame | The kernel; SLICE-10 already checks the contract version and release digest there (PRF-SEC-05) | `market`, `recovery` as the caller reads them |
  | The mediator's socket | The supervisor | The mediator | `observation` |
  | The market store | The market process, recorded in the store when it opens it for writing | `StoreMarket` when the kernel opens the store, and the supervisor | `market` |
  | The ledger | The kernel, as `RELEASE_BOUND` | The supervisor, before it assesses | `observation`; a mismatch is a recorded `ledger_gap: release`, never a guess |

  The channel and market-store rows change modules other specs own (`adapters/unix_channel.py`, `market/store.py`, `market/view.py`). This slice makes those changes in step 2 and lists them for those specs.
* **Historical readers are separate.** Retained evidence of older bundles is read through the supported readers ([history compatibility](#history-compatibility-bootstrappy)); a live exchange accepts only the exact version (Combined-F3, `README.md:1197`).

### The resolver (`settings/loader.py`)

* **Signature.** `resolve(profile: str, env: Mapping[str, str], *, participant: str | None = None) -> Effective`. `profile` is `"test"` (the built-in profile SLICE-01 uses, kept) or the path of a profile file outside the package (from `AT_PROFILE`). `participant` selects the scope; `None` resolves every field (tests).
* **Layers, in order:**
  1. the packaged `resources/defaults.yaml` (every refusing field is `null` there, as today);
  2. the profile file. Its first key is `profile:` with one of `test`, `simulation`, `production`, `research`. A `production` profile may not set `capacity.synthetic_amount` (`CFG-R03`), so the tests-only capacity value can never reach production;
  3. the environment: for each `FIELDS` entry in the participant's scope, its `env` name, if present.

  There is no `owner.yaml` layer. **Deviation (from legacy):** legacy merges an owner-managed `owner.yaml` between the profile and the environment (`src/config/__init__.py:428-439`). In the target, owner-managed money values live in the bound policy (`kernel.policy`, SLICE-04's `PolicyStore`), which is session-bound and recorded in the ledger; deployment values live in the profile. No value changes: the slice carries every legacy `owner.yaml` and drop-in value into one of those two homes.
* **Rules,** each tested (PRF-CFG-02):

  | Case | Result |
  |---|---|
  | A key omitted from a layer | The layer below stands |
  | A key set to `null` | Unbound from that layer up: a refusing field set to `null` in the profile is unbound even if an earlier layer bound it |
  | A key not in `FIELDS`, in any layer | `CFG-R01` (`unknown_key`), naming the key and the layer |
  | An `AT_` or `MCP_` environment name that is no field's `env`, no alias and not in the launcher set (`AT_PROFILE`, `AT_RELEASE`, `AT_TEST_ROOT`) | `CFG-R01` |
  | An alias and its replacement both supplied, in one layer or in two | `CFG-R02` (`alias_conflict`); precedence never resolves it (A02-F2) |
  | An alias alone | Its value is used for the replacement, and the provenance records the alias |
  | A value of the wrong kind (a bool for an int, `"7.0"` where the canonical text is `"7"`, an unknown enum) | `CFG-R03` (`bad_value`), as today's `_check` (`settings/loader.py:101-112`) |
  | A literal secret where a `credential_ref` is expected, or a credential name in the environment of a participant that forbids it | `CFG-R04` (`secret_in_settings`) or `CFG-R07` |
  | A refusing field unbound | Accepted by the resolver; the composition that needs it refuses (`RefusingParameterUnbound`, as today in `bootstrap.py:73-84`) |

* **The effective result.** `Effective(settings, revision, provenance, projections, defaults_digest, profile_digest)`:
  * `provenance` maps each bound key to the layer that bound it (`defaults`, `profile`, `env:<NAME>`, `alias:<NAME>`);
  * `projections` maps each projection name to its digest;
  * `revision` is the SHA-256 of the canonical JSON of `{defaults_digest, profile_digest, env overrides by name with normalized values}`, credential references included by name only. No secret value enters `revision`, a snapshot or a diagnostic (A02-F2).
* **Immutability (REQ-CFG-004).** `Effective` and `Settings` are frozen. `bootstrap` resolves once per process and passes the result down; no module calls `resolve` after composition, and nothing watches a file. A changed file takes effect at the next start of that process, under the [release transitions](#release-transitions) when it is part of a release. Holds, kill, latch and session-bound policy are state transitions in the ledger, not settings, so they are unaffected (A02-F3).
* **Replay resolves what was used.** At kernel start, `bootstrap` publishes the effective snapshot (non-secret values and provenance) to the evidence store and puts its reference and `revision` into the release receipt, so replay reads the revision actually used, not current files.

### Bundle manifest (`bootstrap.py`)

* **`bundle.json`** sits in each release directory. The installer writes it at staging; nothing changes it after. Its fields:

  ```text
  format            "at-bundle/1"
  artifact:                                  # the identity: bundle_digest = sha256(canonical(artifact))
    distribution    {name, version, wheel_sha256, record_sha256}
    dependencies    [{name, version, sha256}] from requirements.lock
    resources       {"defaults.yaml": sha256, "events.schema.json": sha256, "migrations/006_protection.sql": sha256, ...}
    schema          {migration_revision, events_schema, candidates_schema | null, canvas_schema | null}
    readers         {"event": [[kind, version], ...], "candidate": [...]}   # supported historical readers
    runtime         {python: "3.11.x", sqlite_binding: "apsw", sqlite_version}
    participants    {kernel: "required", market: "required", ...}           # the composition's table
    deploy          {install_sha256, templates: {"at-kernel.service": sha256, ...}}   # the installer and unit templates
    endpoint_contracts  sha256 of the TASK-S07-05 records it carries, or null
    measurements    sha256 of the approved measurement records (TASK-S11-07), or null
    ui_assets       null until SLICE-10 ships the operator UI; then its shipping manifest
  provenance:                                # outside the digest
    git_sha, built_at, builder
  license           release.license, or null
  ```

  The Git SHA is provenance only (D05): two builds of the same artifacts have one `bundle_digest`.
* **The release receipt** is what `kernel.recovery` records as `RELEASE_BOUND` (OA_NEW `kernel/recovery.py:175-181`). `bootstrap` builds it at kernel start: `{bundle_digest, release_id, verified: {record, resources, dependencies, runtime}, settings_revision, settings_snapshot_ref, projections, deployment: {recovery.routine_advance, recovery.routine_advance_limit, recovery.lease_secs, recovery.lease_renew_secs}}`. The `deployment` keys are the ones the routine-advance checks already read (`kernel/recovery.py:125-127`, `:312-314`). A restart on the same bundle and settings produces the same digest, so no new `RELEASE_BOUND` is recorded (`kernel/recovery.py:175-181`).
* **Production staging refuses** a bundle whose `license` is `null` (`CFG-R08`, `owner_item_unbound`): the licence is the owner's (`README.md:1131`). Test and simulation bundles carry `null` and are not refused.

### Loaded-artifact verification (`bootstrap.py`)

* **`verify_loaded(manifest) -> list[str]`** runs at every production process start, before anything opens a store. Each line is one problem:
  * the running interpreter's `sys.prefix` is the release's own environment, and `autonomous_trading.__file__` lies inside it (not in a checkout);
  * the installed distribution's version and the SHA-256 of its `RECORD` equal `artifact.distribution`, and every file `RECORD` lists hashes to its recorded value (through `importlib.metadata`);
  * the installed distributions are exactly `artifact.dependencies`, with their versions;
  * every resource in `artifact.resources` hashes, through `importlib.resources`, to its value;
  * the SQLite runtime identity (`kernel/ledger/runtime.py`'s `runtime_identity`) equals `artifact.runtime`.
* Any problem refuses the start with `CFG-R06` (`artifact_mismatch`) and the list. Verification reads the loaded files, not an intended path or a Git SHA (A02-F4). Test and simulation compositions skip it and report `artifact: unverified`.

### History compatibility (`bootstrap.py`)

* **`compatible(manifest, ledger) -> list[str]`** reads the ledger read-only (`LedgerReader`):
  * the stored migration revision must be at most `artifact.schema.migration_revision`;
  * every distinct `(kind, version)` of the stored events must be in `artifact.readers.event`;
  * likewise for stored candidate representations, once SLICE-12 records any.
* A longer history at a higher sequence is not by itself incompatible (A02-F4). Any problem refuses with `CFG-R09` (`incompatible_history`). It is checked by the kernel before it opens the writer, and by the installer before it activates an older release (rollback), so an incompatible rollback is refused before anything is stopped. The ledger's own schema check (`kernel/ledger/schema.py`, PRF-LED-10) stays as the last guard.
* **Obligation continuity (Combined-F6)** is checked at the same two points: a release whose code cannot run a live leg is refused (`CFG-R11`, `obligation_unrunnable`). The kernel already reports unrunnable legs (`kernel.protection.unrunnable_legs`, from `kernel/recovery.py:170-173`) and refuses a session that carries one (`carried_runnable`, `bootstrap.py:106-109`). Under the first release's [activation boundary](#the-activation-boundary) the account is flat at every release change, so the set is empty by construction; the check is still run.

### Compositions (`bootstrap.py`)

* **`compose_production(effective, manifest, *, participant)`** builds one participant's production composition. For the kernel it is `compose_simulation`'s shape (`bootstrap.py:65-176`) with:
  * the OpenAlgo adapter for the configured account, with its credential from `settings.secrets` and its endpoint contracts only from the bundle's TASK-S07-05 records (as SLICE-07 requires: never from an adapter method);
  * the market port over the store (`StoreMarket`, [market spec](market-data-and-canvas.md#the-kernels-market-port-marketviewpy));
  * the send-lease store adapter ([migration spec](migration-recovery-rollback-continuity.md), TASK-S11-05). Without a lease store, and without `recovery.lease_secs` and `recovery.lease_renew_secs` in the receipt, the kernel refuses even a human advance (`SES-R10`, `kernel/recovery.py:312-315`). So `recovery.lease_store` is a refusing setting, and a production composition refuses until it is bound. Its location goes with the off-host recovery set, which waits for the backup destination (POL-O01). Until the adapter exists (slice step 8), tests compose the kernel with SLICE-03's fake lease store;
  * the release receipt above;
  * the account's limits ([below](#account-limits-bootstrappy));
  * every refusing setting the composed participants read bound, else `RefusingParameterUnbound`.

  A simulation composition still cannot import or construct the live adapter (PRF-XC-02); this slice adds PRF-XC-02's production part: a production composition binds exactly the adapter its account names.
* **The first-release composition** ([Q-005](../decisions/owner-answers-2026-10-27.md): BuyerEdge on the current account), declared as `COMPOSITIONS["first_release"]` (A10-F2, A09-F1):

  | Participant | Status | Depends on | Without it |
  |---|---|---|---|
  | Kernel (`at-kernel`) | required | ledger, evidence store, lease store, OpenAlgo for the account | Nothing sends; broker-held stops remain (A03-F5) |
  | Market process (`at-market`) | required | OpenAlgo market endpoints, market store | Admission refuses on stale views, as today (POL-018, POL-020) |
  | BuyerEdge strategy host (`at-strategy`) | required | market views; its descriptor (SLICE-09) | No intents; protection and reconciliation continue |
  | Entry review (cognition) | as BuyerEdge's bound review policy says (SLICE-04 `kernel.policy`, SLICE-09) | its provider | The policy's approved unavailable behaviour; never silently removed (A09-F1) |
  | Supervisor (`at-supervisor`) | required (`README.md:1170`) | read-only ledger access; the observation route | No independent outage report; the kernel is unaffected |
  | Observation route for non-kernel readers | required: native read-only credential if TASK-S07-06 proves one, else the mediator (`at-observer`) | the deployed OpenAlgo | The supervisor reports an observation gap |
  | Operator interface (`at-operator`, `at`, SLICE-10), with the UI assets its shipping manifest names | required | the kernel's channel | Owner commands (kill, `attempt_resolve`, `recovery_advance`) unavailable |
  | Backup (`at-backup`) | required for production (`README.md:1170`) | `backup.destination` (POL-O01, open) | The composition refuses to activate (`CFG-R08`) |
  | Canvas tools | optional | market views | No inspection tools; no entry input changes (`README.md:833`) |
  | Telemetry sink | optional | its local file | Diagnostics dropped and counted; nothing else changes |
  | Research, RL | deferred | — | — |

  `validate_composition(composition, effective, ledger) -> list[str]` refuses activation (`CFG-R10`, `participant_missing`) when a required participant has no entrypoint in the bundle or no enabled unit, or when a dependency the selected strategy's descriptor declares is absent. It never refuses because a deferred or optional participant is absent, and an unrelated research outage is never a trading gate (A09-F1).
* **The account** is deployment configuration: `accounts.<name>.{broker, account_id, exchange}` plus `account.max_worst_case_loss` (Q-015). All are refusing; the owner binds them at deployment. The OpenAlgo adapter's `exchange` comes from here (SLICE-07).

### Account limits (`bootstrap.py`)

* **Legacy has two layers of entry limits, both live.** The account layer is the `limits.*` configuration section (`Limits.from_env`, `src/core/framework/sizing/gates.py:64-106`). The live unit sets it through a drop-in: trades per session 5, entries per desk 10, open structures 1, fresh setup required, cooldown 300 s, daily loss 4000, drawdown-rate gate on at 3000 over 15 minutes (`deploy/systemd/at-strategy-entry-limits.conf:2-11`). The strategy layer is the bound policy's `risk.*` and `capital.*` (`src/core/framework/policy/compat.py:39-44`). The live driver passes the account layer to every desk and to the proof, planner and gateway limits (`scripts/run_framework_live.py:3556`, `:7255-7262`), and the two merge field by field (`gates.py:109-149`; `compat.py:44-47`):
  * each count, amount and percentage: the lower of the values that are set (0 means "not set", never "switch off");
  * `entry_cooldown_secs`: the larger;
  * `require_fresh_setup`: either;
  * `drawdown_rate_enabled`: either; its window from the account layer when the account enables it, else from the strategy;
  * `no_new_trade_after`: the earliest by clock time.

  So with Q-002's ₹3,600 in the strategy layer (BuyerEdge's own value, `src/strategies/buyer_edge.py:492`), the live daily-loss limit is the lower of 4000 and 3600: **₹3,600, with both layers live.** A third control sits above both: the gateway's `daily_loss_limit` of 5000 in the enforcing profile, a backstop meant to fire only if the strategy's gate fails (`config/profiles/enforcing.yaml:104`; `config/parameters.yaml:328-331`). Whether the target carries that backstop is SLICE-04's and SLICE-06's to settle; it is listed for them, not decided here.
* **Fork call (keep both layers and the merge).** The target's `SessionLimits` has one layer (OA_NEW `contracts/decisions.py:431-446`). Moving the drop-in into it "unchanged" would bind 4000 and loosen the limit. So the deployment configuration carries the account layer as `account.limits.<field>` (the drop-in's values, bound by the owner at deployment), the bound policy keeps the strategy layer, and admission applies legacy's `effective_limits`, ported unchanged into `kernel/admission.py` (an intent-spec module change this slice makes in step 2). No unit carries a limit.
* **Not checked:** whether legacy's deployed `owner.yaml` or profile on the EC2 sets other `limits.*` leaves. Step 10 reads the deployed configuration (read-only) and records the account layer actually in force before the owner binds it.

### Release transitions

The installer (`deploy/install.py`, [runtime spec](runtime-isolation-observability-deployment.md#installer-deployinstallpy)) executes these; this section is their contract (A04-F3).

* **Layout.** `release.root/<release_id>/` holds `venv/`, `bundle.json` and `units/` (the rendered unit set). `release.root/current` is a symbolic link to the active release. `release.root/transitions.jsonl` is **one host-level log**, outside every release directory, so deleting a partial release directory (CP-R1) never deletes its history. The previous unit set stays in its own release directory until the next release converges, so a restore can put it back. Mutable roots (ledger, evidence, market store, run directory) are settings outside every release directory (D05).
* **States.** Each step appends `{release_id, state, intent | done | failed, at, by, facts}` to the host log and flushes it with `fsync` before the step acts (`intent`) and after it (`done`). Participants are grouped as **actors** (the strategy host, the operator relay, the kernel, the market process, the backup timer) and **observers** (the observation route and the supervisor). Steps:

  | State | Entered when | Changes the running system? |
  |---|---|---|
  | `STAGING` → `STAGED` | The directory, the environment (`--require-hashes --no-deps`) and `bundle.json` are written | No |
  | `VERIFIED_DISARMED` | Every entrypoint's `--check` passes from the release, in a blank environment with no credential; `compatible` and `validate_composition` pass against the live ledger, read-only; `facts` records whether the release migrates the schema (`from_revision`, `to_revision`) | No |
  | `AUTHORIZED` | The owner's word for this `release_id` is recorded: who, when, which release, and that it migrates when it does (REQ-CFG-008, POL-050) | No |
  | `BOUNDARY_QUIET` | The [activation boundary](#the-activation-boundary) holds, before anything stops | No |
  | `STOPPING` → `STOPPED` | The actors are stopped, timers first and the kernel last (legacy's order, `deploy/deploy_tier1.py:575-604`); the stopped set is recorded before each stop, as legacy's `stopped-units.json` (`deploy/deploy_tier1.py:474-490`). The observers keep running on the old release | Yes |
  | `QUIET_AFTER_STOP` | The boundary is checked again on fresh observations through the still-running route. A refusal restarts the recorded stopped set on the unchanged release, then ends `FAILED` (legacy's `restore_after_flat`, `deploy/deploy_tier1.py:1471-1499`) | Yes, back to the old release on refusal |
  | `OLD_WRITER_GONE` | The old kernel unit is inactive with no process left, and every bound account's send lease is released `clean` by the old epoch (legacy refuses while a sender is alive, `src/tier1/cutover.py:203-205`) | No |
  | `UNITS_WRITTEN` | The new unit set is written beside the old one and systemd reloaded; the old set is kept for a restore | Unit files only; nothing started |
  | `QUIET_BEFORE_SWITCH` | The boundary once more, as legacy's recheck after its code moved (`deploy/deploy_tier1.py:1424-1425`) | No |
  | `SWITCHED` | The old observers are stopped and `current` is replaced atomically (a new link renamed over the old, one `rename(2)`): the exclusive activation boundary (D05) | Yes |
  | `OBSERVERS_STARTED` | The new observation route and supervisor are started and each has published its identity record and passed its handshake; the supervisor has published one assessment (A04-F3: independent observation before the writer or the schema changes) | Yes |
  | `MARKET_STARTED` | The market process is started and has published its identity record and its store handshake | Yes |
  | `MIGRATION_PENDING` | Only when the release migrates: recorded just before the kernel starts. **The point of no return:** once the new kernel has applied the migration, the old bundle cannot read the ledger and `--restore` is refused (`CFG-R09`) | Yes |
  | `KERNEL_STARTED` | The kernel is started; `facts` records the stored schema revision read back after its recovery, and `MIGRATED` when it rose | Yes |
  | `STARTED` | The strategy host, the operator relay and the timers are started | Yes |
  | `CONVERGED` | Judged per operation, from the composition's dependencies: each long-running required participant runs with an identity record, from its own process, naming this `bundle_digest` and its `settings.revision` (as legacy's start records, `deploy/deploy_tier1.py:1321-1348`); the kernel recorded `RELEASE_BOUND` with this bundle; each timer unit is enabled and waiting (its oneshot service is not expected to run). `facts` lists each operation (trading, protection, observation, owner commands, backup) as available or not, with the missing participant | — |
  | `FAILED` | A step refused; `facts` names the step and why | — |

* **Resume** (`--resume`) reads the last record and checks the facts, never inferring success from a switched link or a running process (A04-F3): which release `current` names, which units run under which release, which identity records exist, which schema revision is stored.
* **Restore** (`--restore`) returns to the previous release:
  1. stop every unit of the new set, and verify that none has a process left;
  2. put back the old unit set, reload systemd, and put back the old link;
  3. start the old set in the same order (observers, market, kernel, the rest), and judge convergence as above.

  Before `SWITCHED` only step 3 applies to the stopped actors. After `MIGRATED`, restore is refused unless the old bundle is still `compatible` (`CFG-R09`); roll forward instead. Old and new participants never run side by side: no step starts a unit of one set while a unit of the other set runs. The ledger's writer lock prevents two kernels, but not an old market process feeding a new kernel; the handshakes ([above](#boundary-handshakes-settingsschemapy)) refuse that pair if the stop order is ever broken.
* **A staging failure leaves the prior release intact:** nothing before `STOPPING` touches the running system (`README.md:1221`).
* **Rollback** is the same flow towards an older release directory, refused first by `compatible` (`CFG-R09`) and the continuity check (`CFG-R11`). It keeps the current financial history; it never restores a database (A02-F4).
* **These records are operational receipts,** not a second financial journal; financial activation is still `kernel.recovery`'s (A04-F3).

### The activation boundary

* **Fork call (keep legacy's live rule).** A release is activated only when, for every bound account:
  * the session calendar confirms the market closed (unknown refuses);
  * the broker shows no open position and no working order;
  * the ledger holds no unresolved attempt, no command `IN_FLIGHT`, `UNCERTAIN` or `WORKING`, and no held reservation;
  * no old sender is alive: before the switch, the old kernel has no process and its leases are released `clean`.

  Legacy applies this list to **every** deploy, not only the first cutover, and applies it three times: before anything stops (`deploy/deploy_tier1.py:545-573`), after the stop, restarting the stopped set on the unchanged release when it refuses (`deploy/deploy_tier1.py:1099-1112`, `:1471-1499`), and again before the cutover step (`deploy/deploy_tier1.py:1404-1436`). The check is the cutover preflight (`src/tier1/activation.py:86-90` calling `src/tier1/cutover.py:155-209`): market not confirmed closed (`src/tier1/cutover.py:171-172`), open positions (`:173-176`), working orders (`:177-181`), unsettled orders and held reservations (`:186-194`), pending cancel, close or protection commands (`:195-202`), a legacy sender still alive (`:203-205`). The target runs it at `BOUNDARY_QUIET`, `QUIET_AFTER_STOP` and `QUIET_BEFORE_SWITCH`, with `OLD_WRITER_GONE` for the sender. The installer reads the broker through the read-only observation route (A06-F2), which stays up through the stop, and the ledger read-only. A refusal is `CFG-R13` (`boundary_not_quiet`).
* **POL-050's wording** ("deploy immediately, stopping the whole system first if the market is live") is recorded as approved, but legacy's code refuses an in-session deploy before stopping anything, and the code is the live behaviour the fork rule keeps. Combined-F6 allows a release change over open obligations once continuity is proved (`README.md:909`); that is listed as a **spec-only improvement** for the owner, not built as the first-release path.
* **Deviation (from legacy):** legacy's `--accept-unsettled` lifts the unsettled-order refusal for orders the owner names (`deploy/deploy_tier1.py:1117-1156`), because legacy's stores could hold an order only a newer release could match. The target has no such escape: an unresolved attempt is resolved by reconciliation or by the owner's recorded `attempt_resolve` (Q-007) before activation.

### Repository files

* `config/live.example.yaml` (a `production` profile with every refusing field `null` and a comment naming its register row), `config/simulation.yaml`, `config/research.yaml` (when SLICE-12 builds research), `config/policies.example.yaml` (the bound-policy shape SLICE-04 reads, no values). No example carries a credential or a money value.
* `.github/workflows/verify.yml`: builds the wheel, runs `tests/contracts/test_installed_artifact.py` outside the checkout, runs the unit and contract suites through `scripts/safe_tests.py`, and runs `gitleaks`. It deploys nothing and holds no secret.
* `.pre-commit-config.yaml`: `gitleaks` and the source hygiene checks, as legacy's secret guards.
* `docs/operations.md`: releases, resume and restore, the activation boundary, and the owner-only items; `docs/decisions.md` gets each Fork call above.

## Failure modes and crash points

| Point | What happens | Recovery |
|---|---|---|
| CP-R1: crash during `STAGING` | A partial release directory; `current` unchanged; the host log keeps the attempt | `--resume` deletes and rebuilds the directory; nothing running changed |
| CP-R2: crash after `VERIFIED_DISARMED` or `AUTHORIZED` | Nothing changed | Resume continues from the boundary check |
| CP-R3: crash during `STOPPING` or before `QUIET_AFTER_STOP` is done | Some actors stopped; the stopped set recorded before each stop; observers still run | `--restore` restarts the recorded set on the unchanged release; `--resume` finishes the stop and re-runs the check |
| CP-R4: crash after `UNITS_WRITTEN`, before `SWITCHED` | New unit files present beside the old; nothing of the new set runs | `--resume` continues; `--restore` reinstates the old unit set and starts the stopped set |
| CP-R5: crash after `SWITCHED`, before `KERNEL_STARTED` | `current` names the new release; some new units may run | `--resume` starts the rest in order; `--restore` stops every new unit, verifies, then reinstates the old set and link |
| CP-R6: crash after `MIGRATION_PENDING` | The schema may have migrated | `--resume` reads the stored revision; if migrated, only roll-forward remains (`CFG-R09` refuses restore) |
| CP-R7: crash after `KERNEL_STARTED`, before `CONVERGED` | Units run; convergence unproven | `--resume` re-checks the identity records, handshakes and `RELEASE_BOUND` per operation |
| F-C1: a process loaded a substituted file or dependency | Start refused, `CFG-R06` | The release is restaged; `--restore` meanwhile |
| F-C2: the older bundle cannot read the history | Rollback or restore refused before any stop, `CFG-R09` | A compatible bundle, or roll forward |
| F-C3: a profile edited during operation | No running process changes (CUJ-CFG-2) | The next start of that process |
| F-C4: the boundary is not quiet, before or after the stop | Refused, `CFG-R13`; after the stop, the stopped set restarts on the unchanged release | The owner clears the exposure through the operator interface or OpenAlgo; rerun |
| F-C5: an owner-only item unbound (licence, account, lease store, backup destination) | Production staging or activation refused, `CFG-R08` | The owner binds it |
| F-C6: a participant of another bundle connects | Its handshake is refused, `CFG-R14` | Stop the stray unit; resume |

## Risks and limits

* **The activation boundary keeps every release change after the close and flat,** as legacy. A defect found during the session is fixed in the next post-close release; the broker-held stop and the running kernel stand meanwhile.
* **`RECORD` verification proves integrity of what is installed,** not that the wheel was built from reviewed source; provenance (Git SHA, builder) is recorded but not verified.
* **Same-host activation only.** The `current` link is exclusive on one host; moving a host is the migration spec's fenced handoff, never this flow (A04-F2).
* **The licence gate blocks production staging** until the owner chooses one, by the standing rules.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `release.license` | The owner's licence for owned code (`README.md:1131`) | Refusing; owner only. Production staging refuses unbound |
| `release.root` | Where release directories live | Deployment path |
| `accounts.<name>.broker`, `.account_id`, `.exchange` | The current account (Q-005) | Refusing; the owner binds them at deployment |
| `account.max_worst_case_loss` | Per-account loss limit (Q-015) | As the register: set in the account's config at deployment |
| `account.limits.<field>` (the 13 `SessionLimits` fields) | The account layer of the entry limits, merged with the policy layer by legacy's rule | **Fork call:** the live drop-in's values (`deploy/systemd/at-strategy-entry-limits.conf:2-11`), bound by the owner at deployment after step 10 records what is in force; refusing until then |
| `recovery.lease_store` | Where the send leases live, with the off-host recovery set | Refusing; follows the backup destination (POL-O01) |
| `composition` | The selected composition | `first_release` (Q-005) |
| `recovery.routine_advance`, `recovery.routine_advance_limit`, `recovery.lease_secs`, `recovery.lease_renew_secs` | Carried in the release receipt for the routine-advance checks | As the register: `standing` (Q-009); the others measured and approved at TASK-S11-07 |
| `paths.ledger`, `paths.evidence`, `paths.market_store`, `paths.run`, `paths.scratch` | Mutable roots, each with its storage class | Deployment paths; outside every release directory |

## Reuse evidence

* Config and root scaffolding: **replace packaging; preserve effective semantics** (`README.md:1158`). Kept: the layered idea, the `__` dotted environment convention for new fields, the broker-key withholding list (`src/config/__init__.py:213-229`), the profile-conflict refusal (`src/config/__init__.py:366-383`), the shipped-defaults file. Not inherited: checkout-relative roots, the `owner.yaml` layer, order-dependent alias resolution, `null`-means-default, accept-anything keys.
* Release, receipt and rehearsal: **reuse/prove** (`README.md:1159`). Kept: the ordered stop (`deploy/deploy_tier1.py:575-604`), the recorded stopped set and restore (`deploy/deploy_tier1.py:474-499`, `deploy/deploy_tier1.py:1471-1524`), per-process start records matched by PID (`deploy/deploy_tier1.py:1321-1348`), the boundary refusal list (`src/tier1/cutover.py:155-202`), receipts per step (`deploy/deploy_tier1.py:457-467`). Not inherited: in-place checkout updates, `pip install -e`, Git SHA as identity, the hand rollback text.

## Alternatives considered

* **Keep the checkout as the release.** Rejected by D05: a checkout cannot prove what a process loaded, and the next deploy edits the code the running system executes.
* **A container image per release.** Not selected: D05 asks for a wheel and a locked environment in a release directory; an image adds a runtime and registry the host does not need now.
* **Verify only the wheel's digest at install.** Rejected: A02-F4 asks for the loaded artifacts; a file changed after install would pass.
* **Allow in-session releases with Combined-F6 continuity.** Kept as a later owner choice (above): it changes when money-bearing code may change, which the fork rule leaves to the owner.

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-CFG-01 | T | `tests/contracts/test_installed_artifact.py` | The wheel installed with `--require-hashes` into a blank environment in a temporary directory with no checkout and no `.git`; every declared entrypoint's `--check` runs there from another working directory; every packaged resource loads; the D05 row (`README.md:1221`) | an import or a resource needs the checkout, or a declared command fails |
| PRF-CFG-02 | T | `tests/unit/test_settings_resolver.py` | Each rule-table row; precedence over the three layers; provenance per key; `null` unbinds; an alias and its replacement refused in one layer and across two; secrets absent from `revision`, the snapshot and every projection; two participants with different paths and credentials share each projection digest; the shared read budget; the A02-F2/F3 row (`README.md:1226`) | a conflict resolves by precedence, an unknown key loads, or a secret reaches a digest |
| PRF-CFG-03 | T | `tests/recovery/test_release_activation.py` | A profile edited under a running kernel subprocess leaves its `revision` (heartbeat) and `RELEASE_BOUND` unchanged; a restart picks the new value; an activation killed at CP-R1…CP-R7 resumes from the host log's facts; a deleted release directory leaves the log intact; `--restore` after `SWITCHED` stops every new unit and verifies none runs before any old unit starts, and puts back the old unit set; restore after `MIGRATED` is refused; the observers start and publish before the kernel; `CONVERGED` is reached with the backup timer enabled and its oneshot service idle, and reports each operation's availability | a running process changes a value, success is inferred from the link, or old and new units run together |
| PRF-CFG-04 | T | `tests/contracts/test_installed_artifact.py` | A substituted resource, dependency or code file refuses the production start with `CFG-R06` naming it; the manifest names the exact schema identities and migration revision; two builds of the same artifacts with different Git SHAs share one `bundle_digest`; the A02-F4/F5 row's bundle half (`README.md:1227`) | a substituted artifact starts |
| PRF-CFG-05 | T | `tests/recovery/test_release_activation.py` | Rollback refused for an older migration revision and for an unread `(kind, version)`; allowed for a compatible older bundle over a longer history; no database restored; a staging failure at each step leaves `current` and the running units unchanged | an incompatible rollback starts, or a database is replaced |
| PRF-CFG-06 | T | `tests/contracts/test_rendered_units.py` | Every participant's unit rendered from `PARTICIPANTS`; each participant's `--check` passes with exactly the rendered environment; a forbidden credential or an unlisted `AT_` name refuses; LD-18's path setting passes; the D06 row (`README.md:1233`) for the render and refuse half | the renderer and the start check disagree |
| PRF-CFG-07 | T | `tests/recovery/test_release_activation.py` | The first-release composition activates with every deferred participant absent; removing a required one refuses with `CFG-R10`; removing an optional one does not; an unrunnable live leg refuses with `CFG-R11`; the A10-F1–F3 row's composition clause (`README.md:1248`) | a deferred participant is required, or a required one is silently dropped |
| PRF-CFG-08 | T | `tests/recovery/test_release_activation.py` | Activation refuses without an owner authorization record naming the release (`CFG-R12`); refuses with the market not confirmed closed, an open position, a working order, an unresolved attempt or a held reservation (`CFG-R13`), each alone; a position that appears during the stop is refused at `QUIET_AFTER_STOP` and the stopped set restarts on the unchanged release; an old kernel still running, or a lease not released `clean`, refuses at `OLD_WRITER_GONE`; a position before the switch refuses at `QUIET_BEFORE_SWITCH`; an unbound owner-only item refuses (`CFG-R08`) | any one of those activates, or a post-stop refusal leaves the system stopped |
| PRF-CFG-09 | M | deployment record | On the owner's word, the candidate release staged on the production host to `VERIFIED_DISARMED`, with its `bundle.json`, receipts, the host's interpreter and systemd versions, and the account limits in force recorded (slice step 10) | the staged release differs from the tested bundle |
| PRF-CFG-10 | T | `tests/unit/test_settings_resolver.py` (`check_handshake`); `tests/integration/test_supervisor.py` (the mediator socket and the ledger); `tests/integration/test_market_port.py` (the store) | A bundle digest, a contract version or a needed projection digest one character off refuses with `CFG-R14` at each boundary; an unknown contract or variant refuses; differing paths or credentials do not; the A02-F1 row (`README.md:1225`) | a process of another bundle or version is served |
| PRF-CFG-11 | T | `tests/unit/test_admission_checks.py` | Legacy's merge, each rule against independent expectations: account 4000 with policy 3600 gives 3600; a 0 in either layer never switches off the other; cooldown the larger; fresh setup either; the drawdown window from the account when it enables the gate; the earliest cutoff by clock time ("9:30" before "15:00"); golden cases generated once from legacy's `effective_limits` | the account layer loosens or overrides a tighter policy value |

Break checks are written with each test file, as the other slices do.

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-01 | The minimal package, `ledger.path` and the `test` profile | (PRF-LED-* use them) |
| SLICE-11 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-11-packaging-release-supervision.md#steps) | PRF-CFG-01…11; PRF-XC-02 (production composition part) |
