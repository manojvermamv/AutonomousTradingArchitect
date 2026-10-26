# SLICE-01 — Disarmed financial core

* **Status:** proposed; **prepared for execution** once it passes EGM stage 9. Not implemented.
* **Precedence:** master README, then ROADMAP, then the package. This slice adds no decision.
* **Phase:** master Phase 3 subset, plus the minimal Phase 2 packaging it needs (`README.md:1182-1183`). It adds no gate to any phase.
* **Environment class:** synthetic and disarmed. There is no broker, no credentials, no legacy store and no network.
* **Decisions it proves:** D01 outcome truthfulness, D02 atomic admission, D13 claim-before-call, D14 identity, AUD-02 atomic outcome, Combined-F1 injected clock (types only), ATA-06 domain field (simulated only), REQ-XC-002/003.
* **Excluded:**
  * review application logic: the test passes a fixed `ReviewApplication` in-process, standing in for `kernel.policy` (SLICE-04);
  * planning: the test passes a fixed `PlanRef` in-process, standing in for `kernel.planner` (SLICE-04);
  * grants and sessions: no `Grant` type and no session check (SLICE-03);
  * dispatch revalidation (a pass-through hook; real checks arrive in SLICE-05) and per-account I/O workers (SLICE-05);
  * reconciliation (`UNCERTAIN` stays uncertain);
  * protection, conflicts, OpenAlgo, compatibility projections, real money values.

## Goal

Build the smallest end-to-end financial path in the target package. A fixed entry request is:

1. admitted, with its reservation and command identity, in one transaction;
2. claimed durably as attempt 1;
3. sent once to a scripted simulated broker, outside any transaction;
4. committed with its classified outcome in one transaction.

Crashes at every boundary leave a state the tests can name in advance.

## Files (all inside README §6 or the listed tree deltas T-01…T-05)

Paths are relative to the target repository root. The `src/autonomous_trading/` subdirectories other than the root and `contracts/` are **namespace packages**: no `__init__.py`. This follows README §6 (`README.md:949`) and the tree, which lists `__init__.py` only for the root and `contracts/`.

| # | Path | Create | What it holds |
|---|---|---|---|
| 1 | `pyproject.toml` | create | Project metadata and package discovery (below) |
| 2 | `src/autonomous_trading/__init__.py` | create | `__version__ = "0.1.0.dev0"` and nothing else |
| 3 | `src/autonomous_trading/contracts/__init__.py` | create | Re-exports the types in rows 4–8 |
| 4 | `src/autonomous_trading/contracts/identity.py` | create | `CommandKey`, `AccountId`, `Principal`, `EpochId`, `SessionScope`, `FinancialSessionId` |
| 5 | `src/autonomous_trading/contracts/clock.py` | create | `Timestamp`, `Elapsed`, `Deadline`, `Clock` protocol |
| 6 | `src/autonomous_trading/contracts/decisions.py` | create | `ReviewApplication` (fields used in SLICE-01) |
| 7 | `src/autonomous_trading/contracts/evidence.py` | create | `DomainEvidence`, `EvidenceRef` (SLICE-01 subset) |
| 8 | `src/autonomous_trading/contracts/execution.py` | create | `EntryRequest`, `PlanRef`, `LegResult`, `TransportResult`, `Outcome`, `Refusal` |
| 9 | `src/autonomous_trading/adapters/clocks.py` | create | `RecordedClock`, `LiveClock` |
| 10 | `src/autonomous_trading/adapters/simulated_broker.py` | create | `SimulatedBroker` driven by a script |
| 11 | `src/autonomous_trading/resources/defaults.yaml` | create | `ledger: {path: null}` |
| 12 | `src/autonomous_trading/resources/events.schema.json` | create | JSON Schema for the SLICE-01 event kinds and payloads (below) |
| 13 | `src/autonomous_trading/resources/migrations/001_initial.sql` | create | Provisional schema v1, SLICE-01 tables (below; [X-002](../../consistency/master-contradictions.md#x-002)) |
| 14 | `src/autonomous_trading/settings/loader.py` | create | `resolve(profile: str, env: Mapping[str, str]) -> Settings` |
| 15 | `src/autonomous_trading/settings/schema.py` | create | `Settings` dataclass and validation |
| 16 | `src/autonomous_trading/kernel/ledger/runtime.py` | create | `runtime_identity()`, `require_safe()`, `connect(path, writer: bool) -> apsw.Connection` with the WAL and FULL readback (legacy `src/tier1/runtime.py`) |
| 17 | `src/autonomous_trading/kernel/ledger/envelope.py` | create | `canonical`, `digest`, `EventDraft`, `envelope`, `GENESIS_HASH` |
| 18 | `src/autonomous_trading/kernel/ledger/schema.py` | create | `apply_migrations(conn)`, `check(conn)`, `SCHEMA_REVISION = 1` |
| 19 | `src/autonomous_trading/kernel/ledger/store.py` | create | `LedgerWriter`, `LedgerReader`, `Txn` |
| 20 | `src/autonomous_trading/kernel/lifecycle.py` | create | Command and attempt transition functions (command part only) |
| 21 | `src/autonomous_trading/kernel/reservations.py` | create | `reserve(plan) -> ReservationDraft`, `hold`, `release` |
| 22 | `src/autonomous_trading/kernel/admission.py` | create | `admit(request, application, plan, txn, synthetic_capacity) -> Admitted \| Refusal` (checks A1, A5, B5, B6 only) |
| 23 | `src/autonomous_trading/kernel/ports.py` | create | `BrokerPort` protocol |
| 24 | `src/autonomous_trading/kernel/coordinator.py` | create | `Coordinator` (claim, call, commit; startup recovery) |
| 25 | `src/autonomous_trading/bootstrap.py` | create | `compose_simulation(settings, broker, clock, fault_plan=None) -> Composition` |
| 26 | `scripts/safe_tests.py` | create | Isolated test launcher (below) |
| 27 | `tests/conftest.py` | create (T-04) | Fixtures: `tmp_ledger`, `recorded_clock`, `fixture_entry` |
| 28 | `tests/fixtures/slice01_entry.json` | create (T-05) | The fixed request, application and plan |
| 29 | `tests/unit/test_event_envelope.py` | create (T-01) | PRF-LED-01, PRF-LED-02 |
| 30 | `tests/unit/test_command_identity.py` | create (T-02) | PRF-LED-03 |
| 31 | `tests/integration/test_entry_outcomes.py` | create (T-03) | PRF-LED-04, PRF-DSP-02, PRF-ADM-05 |
| 32 | `tests/recovery/test_crash_boundaries.py` | create (README §6) | PRF-LED-05, PRF-LED-07 |
| 33 | `tests/contracts/test_capabilities.py` | create (README §6) | PRF-XC-02 (SLICE-01 part), PRF-LED-13 |

### Row 1 — `pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=69"]
build-backend = "setuptools.build_meta"

[project]
name = "autonomous-trading"
version = "0.1.0.dev0"
requires-python = ">=3.11"
dependencies = ["PyYAML>=6.0", "apsw"]

[project.optional-dependencies]
test = ["pytest>=8.0"]

[tool.setuptools.packages.find]
where = ["src"]
namespaces = true

[tool.setuptools.package-data]
"autonomous_trading" = ["resources/*.yaml", "resources/*.json", "resources/migrations/*.sql"]
```

### Rows 4–8 — contract types (frozen dataclasses; `slots=True`)

A **decimal string** below is a canonical INR decimal: an optional `-`, digits, `.` and exactly two digits, with no exponent (`^-?\d+\.\d{2}$`). Arithmetic converts it with `decimal.Decimal`. SLICE-01 converts no floats, so the `money.rounding` parameter is not used yet ([ledger spec](../../design/ledger-and-atomic-transaction.md#money-and-quantity-representation)).

```text
CommandKey(value: str)            # 1–128 chars, [A-Za-z0-9._:-]; else ValueError
AccountId(broker: str, account: str)
Principal(value: str, kind: Literal["human", "kernel"] = "human")   # value non-empty
EpochId(value: str)               # non-empty
SessionScope(account_id: AccountId, calendar_id: str)
FinancialSessionId(scope: SessionScope, trading_date: str)          # trading_date "YYYY-MM-DD"

Timestamp(utc_iso: str, domain: Literal["wall", "exchange", "recorded"], uncertainty_ms: int | None = None)
Elapsed(monotonic_ns: int)
Deadline(origin: Timestamp, budget_ms: int)
class Clock(Protocol):
    def now(self) -> Timestamp: ...
    def elapsed(self) -> Elapsed: ...

ReviewApplication(intent_digest: str, mode: Literal["off","observe","enforce_entry_holds"],
                  applied: Literal["proceed","blocked","paused","proceed_unavailable"],
                  review_id: str | None, cause: str | None, policy_version: str)

DomainEvidence(value: Literal["simulated","analyzer","live","unknown","conflicting"],
               basis: Literal["response_marker","account_binding","simulated_adapter","none"])
EvidenceRef(store: str, content_digest: str, published_at: Timestamp)

EntryRequest(command_key: CommandKey, principal: Principal, account: AccountId,
             session_id: FinancialSessionId, intent_ref: str, review_ref: str | None = None)
PlanLeg(leg_role: str, instrument: str, side: Literal["BUY"], quantity: int,
        limit_price: str | None)                                       # SLICE-01 subset of the intent spec's PlanLeg
PlanRef(plan_digest: str, account: AccountId, legs: tuple[PlanLeg, ...], amount: str, margin: str,
        worst_case_loss: str, currency: Literal["INR"])                # money fields: decimal strings
LegResult(leg_role: str, cls: Literal["not_sent","rejected","acknowledged","ambiguous"],
          broker_order_id: str | None, reason: str | None)
TransportResult(cls: Literal["not_sent","rejected","acknowledged","ambiguous"],
                legs: tuple[LegResult, ...], domain: DomainEvidence, raw: EvidenceRef)
Outcome(command_key: CommandKey, attempt_no: int | None,
        effect: Literal["not_sent","rejected","acknowledged","ambiguous","refused"],
        canonical: Literal["committed","unchanged","commit_failed"],
        compat_projection: Literal["none","fresh","repair_scheduled"],
        broker_order_ids: Mapping[str, str], domain: DomainEvidence | None, sent: bool,
        refusal: "Refusal | None")
Refusal(code: str, message: str, command_key: str | None, decision: str)
```

* `EntryRequest` carries no review application and no plan ([ledger spec](../../design/ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy)). In SLICE-01 the test passes them to `submit_entry` as separate in-process arguments.
* `Outcome.compat_projection` is always `"none"` in SLICE-01: no compatibility projection exists yet.

`request_digest(EntryRequest)` is `digest()` (row 17) of this object:

```text
{"verb": "entry", "command_key", "principal", "account": [broker, account],
 "session_id": [[[broker, account], calendar_id], trading_date],
 "intent_ref", "review_ref"}
```

This is the [ledger rule](../../design/ledger-and-atomic-transaction.md#request-digest-and-the-identity-rule) for an entry.

`plan_digest` check (B6): `digest()` of the `PlanRef` fields other than `plan_digest`, with `account` as `[broker, account]` and each leg as an object.

### Row 9 — clocks

* `RecordedClock(start_utc_iso: str)`:
  * `now()` returns the current recorded instant with `domain="recorded"`;
  * `advance(ms: int)` moves both the instant and `elapsed()`.
* `LiveClock()`:
  * `now()` uses `datetime.now(timezone.utc)` with `domain="wall"`;
  * `elapsed()` uses `time.monotonic_ns()`.

### Row 10 — simulated broker

```text
ScriptStep = {"call": int, "result": "not_sent" | "reject" | "ack" | "timeout", "order_id"?: str, "reason"?: str}
SimulatedBroker(script: list[ScriptStep], clock: Clock)
    send(request: EntryRequest, plan: PlanRef, attempt_no: int) -> TransportResult   # one call per invocation
    calls: list[dict]                                             # test-visible call log
```

Each step maps to one result with one leg, named by the plan's single leg role (`"entry"` in the fixture):

| Step | Result |
|---|---|
| `not_sent` | `cls="not_sent"` (the adapter proves nothing left the process) |
| `reject` | `cls="rejected"` with the reason |
| `ack` | `cls="acknowledged"` with `order_id` as the leg's broker order ID |
| `timeout` | `cls="ambiguous"`, reason `timeout`, after recording the call. This stands in for the HTTP client timeout that the live adapter classifies as ambiguous ([dispatch spec](../../design/dispatch-and-coordination.md#bounded-io)) |

* Every result has `domain=DomainEvidence("simulated", "simulated_adapter")` and `raw=EvidenceRef("simulated", digest(step), clock.now())`.
* A call number with no script step raises `AssertionError` (a test bug, not a runtime path).
* The broker imports nothing from `adapters.openalgo` and opens no socket.
* No client tag is sent or recorded. The broker order ID is the only identity ([execution-domain spec](../../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)).

### Row 12 — event kinds (SLICE-01)

| Kind | Payload fields | `execution_domain` |
|---|---|---|
| `EPOCH_ACTIVATED` | `epoch_id`, `principal`, `retired_epoch_id` | `none` |
| `RUNTIME_OPENED` | `binding`, `binding_version`, `sqlite_version` | `none` |
| `MIGRATION_APPLIED` | `migration_number` (1), `name`, `file_digest` | `none` |
| `COMMAND_ADMITTED` | `verb`, `strategy`, `request_digest`, `plan_digest`, `account`, `reservation_id`, `amount`, `margin`, `worst_case_loss`, `currency`, `application` | `none` |
| `ADMISSION_REFUSED` | `request_digest`, `code`, `message` | `none` |
| `DISPATCH_CLAIMED` | `attempt_no`, `epoch_id` | `none` |
| `OUTCOME_NOT_SENT` | `attempt_no`, `reason`, `raw_digest` | from the result |
| `OUTCOME_REJECTED` | `attempt_no`, `legs`, `raw_digest`, `reservation_released: true` | from the result |
| `OUTCOME_ACKNOWLEDGED` | `attempt_no`, `legs`, `raw_digest` | from the result |
| `OUTCOME_AMBIGUOUS` | `attempt_no`, `reason` (`timeout` \| `interrupted`), `raw_digest` (null when `interrupted`) | from the result, or `unknown` when `interrupted` |

Money fields are decimal strings.

### Row 13 — `001_initial.sql` (provisional; SLICE-01 tables only)

```sql
CREATE TABLE ledger_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE ledger_event (
  sequence INTEGER PRIMARY KEY, event_id TEXT NOT NULL UNIQUE, schema_revision INTEGER NOT NULL,
  family TEXT NOT NULL, kind TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('native','legacy_import','broker_observation')),
  execution_domain TEXT NOT NULL CHECK (execution_domain IN ('none','simulated','analyzer','live','unknown','conflicting')),
  epoch_id TEXT NOT NULL, transaction_id TEXT NOT NULL, causation_id TEXT, correlation_id TEXT,
  event_time TEXT, observed_time TEXT, append_time TEXT NOT NULL, clock_domain TEXT NOT NULL,
  actor_type TEXT NOT NULL, principal TEXT NOT NULL, service TEXT NOT NULL,
  command_key TEXT, request_digest TEXT, external_ids TEXT NOT NULL, evidence TEXT NOT NULL,
  payload TEXT NOT NULL, prev_hash TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE);
CREATE TRIGGER ledger_event_no_update BEFORE UPDATE ON ledger_event BEGIN SELECT RAISE(ABORT,'append-only'); END;
CREATE TRIGGER ledger_event_no_delete BEFORE DELETE ON ledger_event BEGIN SELECT RAISE(ABORT,'append-only'); END;
CREATE TABLE authority_epoch (epoch_id TEXT PRIMARY KEY, principal TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active','retired')), activated_sequence INTEGER NOT NULL);
CREATE UNIQUE INDEX authority_epoch_one_active ON authority_epoch(state) WHERE state='active';
CREATE TABLE command_identity (command_key TEXT PRIMARY KEY,
  verb TEXT NOT NULL CHECK (verb IN ('entry','cancel','modify','close')), target TEXT, strategy TEXT NOT NULL,
  request_digest TEXT NOT NULL, plan_digest TEXT,
  principal TEXT NOT NULL, account TEXT NOT NULL, first_sequence INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('ADMITTED','REFUSED','IN_FLIGHT','REJECTED','WORKING','UNCERTAIN','COMPLETED')),
  updated_sequence INTEGER NOT NULL);
CREATE TABLE command_attempt (attempt_id TEXT PRIMARY KEY, command_key TEXT NOT NULL REFERENCES command_identity(command_key),
  attempt_no INTEGER NOT NULL, epoch_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CLAIMED','NOT_SENT','REJECTED','ACKNOWLEDGED','AMBIGUOUS')),
  claimed_sequence INTEGER NOT NULL, outcome_sequence INTEGER, UNIQUE(command_key, attempt_no));
CREATE UNIQUE INDEX command_attempt_one_unresolved ON command_attempt(command_key)
  WHERE state IN ('CLAIMED','AMBIGUOUS');
CREATE TABLE reservation (reservation_id TEXT PRIMARY KEY, command_key TEXT NOT NULL UNIQUE REFERENCES command_identity(command_key),
  account TEXT NOT NULL, amount TEXT NOT NULL, margin TEXT NOT NULL, worst_case_loss TEXT NOT NULL,
  currency TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('RESERVED','HELD','RELEASED')), updated_sequence INTEGER NOT NULL);
CREATE TABLE broker_identity (kind TEXT NOT NULL CHECK (kind IN ('order_id','fill_id')), value TEXT NOT NULL,
  command_key TEXT NOT NULL REFERENCES command_identity(command_key), first_sequence INTEGER NOT NULL,
  PRIMARY KEY (kind, value));
INSERT INTO ledger_meta(key, value) VALUES ('schema_revision', '1'), ('migration_revision', '1');
```

* `schema.check(conn)` refuses with `LED-R04` when `schema_revision` is missing or not `1`, or `migration_revision` is above `1`. `apply_migrations(conn)` applies `001` only to an empty database.
* `attempt_id` is `"<command_key>#<attempt_no>"`.
* Later slices add their tables in later migrations (`release_binding` in SLICE-03, per the [ledger spec](../../design/ledger-and-atomic-transaction.md#schema-and-migrations)).
* `amount`, `margin` and `worst_case_loss` hold decimal strings; the writer refuses a non-canonical value with `LED-R06`.

### Row 16 — runtime

This reuses the legacy rule (`OA/src/tier1/runtime.py:1-80` @445eb116):

* `runtime_identity()` asks the loaded APSW library for its SQLite version.
* `require_safe()` raises `UnsafeRuntime` unless the version is at least 3.51.3 or one of the backports 3.44.6 and 3.50.7. A writer calls it before opening.
* `connect(path, writer=True)` sets `journal_mode=WAL` and `synchronous=FULL`, reads both back (FULL reads back as `2`), and raises `UnsafeRuntime("ledger runtime settings")` on a mismatch. The identity is recorded as `RUNTIME_OPENED` after epoch activation.
* A reader opens read-only, verifies `journal_mode=WAL`, and runs each read in its own short transaction.

### Row 17 — envelope

This is the legacy rule verbatim (`OA/src/tier1/envelope.py:42-48` @445eb116):

* `canonical(value)` is `json.dumps(value, sort_keys=True, separators=(",",":"), ensure_ascii=False, allow_nan=False)`, after a recursive check that keys are strings and numbers are finite;
* `digest(value)` is `hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()`;
* `GENESIS_HASH` is `"0" * 64`.

The envelope dict holds exactly the `ledger_event` columns except `event_hash`, with `external_ids` (a dict) and `evidence` (a list) as JSON values. `event_hash` is `digest(envelope)`.

### Row 19 — store

```text
LedgerWriter.open(path: Path, principal: Principal, epoch: EpochId, clock: Clock) -> LedgerWriter
    # takes an exclusive lock on f"{path}.writer.lock" (fcntl.flock LOCK_EX|LOCK_NB on POSIX;
    #   msvcrt.locking on Windows); failure -> Refusal LED-R07
    # applies migrations on an empty file; then schema.check
LedgerWriter.activate_epoch() -> None      # test/bootstrap only in SLICE-01: EPOCH_ACTIVATED + authority_epoch row,
                                           #   then RUNTIME_OPENED and (empty file) MIGRATION_APPLIED(001)
LedgerWriter.transact(fn: Callable[[Txn], T]) -> T
    # BEGIN IMMEDIATE; require active epoch == writer epoch (else LED-R03);
    # fn(txn); check I-3 on touched reservation rows (else LED-R08); COMMIT;
    # on a guard failure ROLLBACK and return LED-R09; on any other exception ROLLBACK and re-raise;
    # a failed COMMIT marks the writer failed: later calls return LED-R10
Txn.append(draft: EventDraft) -> int       # returns sequence
Txn.command(key: CommandKey) -> CommandRow | None
Txn.put_command(row) / put_attempt(row) / put_reservation(row) / put_broker_id(kind, value, seq)
Txn.open_reservations(account) -> list[ReservationRow]      # state RESERVED, HELD or REDUCED
LedgerReader.open(path) -> LedgerReader ; .events(from_seq=1) ; .command(key) ; .attempts(key) ; .reservation(key)
```

In SLICE-01 the index rows are written directly by the transition code in rows 20–22, inside the same transaction as the events. The single `fold` function and the D04 comparison arrive in SLICE-02 (PRF-LED-08).

### Rows 20–22 — lifecycle, reservations, admission

`admission.admit(request, application, plan, txn, synthetic_capacity: str | None)` runs these steps in order and stops at the first failure. Step numbers name the [intent-to-admission](../../design/intent-to-admission.md#admission-kerneladmissionpy) checks they implement:

1. **A1 key.** `request.command_key` must be present. Otherwise refuse with `LED-R01 missing_command_key` (not recorded).
2. **Existing command.** Call `txn.command(key)`. Same digest: return `Admitted(existing=True, state=row.state)` and write nothing. Different digest: refuse with `LED-R02 idempotency_conflict` (not recorded).
3. **A5 review application.** If `application.applied` is not `proceed` or `proceed_unavailable`, append `ADMISSION_REFUSED` with code `ADM-R11 not_eligible` and return the refusal.
4. **B6 binding.** Refuse with `ADM-R10 binding_mismatch`, recorded, unless `application.intent_digest == request.intent_ref`, `plan.account == request.account`, and the recomputed plan digest equals `plan.plan_digest`.
5. **B5 capacity.** If `synthetic_capacity is None`, refuse with `ADM-R09 capacity_rule_unbound`, recorded (REQ-XC-003). If `Decimal(plan.amount) > Decimal(synthetic_capacity) - sum(Decimal(r.amount) for r in txn.open_reservations(account))`, refuse with `ADM-R09 insufficient_capacity`, recorded.
6. **Commit.** Append `COMMAND_ADMITTED`, then `put_command(verb="entry", target=None, plan_digest=plan.plan_digest, state="ADMITTED")` and `put_reservation(state="RESERVED")` with `amount`, `margin` and `worst_case_loss` copied from the plan, all in the caller's transaction.

* `reservations.reserve(plan)` copies the plan's three money fields. SLICE-01 uses the fixture's synthetic values; the real rule is TASK-S04-03.
* `reservations.hold(row)` moves `RESERVED` to `HELD` at the claim; `release(row)` moves to `RELEASED`. There is no reduction in SLICE-01.
* `lifecycle` exposes pure transition functions that return the next state, or raise `InvariantViolation` (`LED-R08`). The transition table is the command and attempt table in the [ledger spec](../../design/ledger-and-atomic-transaction.md#command-and-attempt-state-machine), restricted to the SLICE-01 events.

### Row 24 — coordinator

```text
Coordinator(writer, broker: BrokerPort, clock: Clock, fault_plan: FaultPlan | None)
Coordinator.submit_entry(request, application, plan, synthetic_capacity) -> Outcome
    t1: writer.transact(admission.admit ...)                   # CP-L1 before, CP-L2 after
    if refused or existing: return Outcome(effect="refused" | existing state, ...)
    t2: writer.transact(claim attempt n = max+1: DISPATCH_CLAIMED, attempt CLAIMED,
                        command IN_FLIGHT, reservation HELD)                # CP-L3 after
    revalidate_hook(cmd) -> Allowed                            # SLICE-01: always Allowed; SLICE-05 replaces
    result = broker.send(request, plan, n)                     # no transaction held; CP-L4 inside
    # CP-L5 here: result in memory, not yet committed
    t3: writer.transact(OUTCOME_<cls>, attempt state, command state, reservation RELEASED if rejected)
        on commit exception -> Outcome(effect=cls, canonical="commit_failed", sent=True)
    return Outcome(effect=cls, canonical="committed", compat_projection="none",
                   sent=(cls != "not_sent"), ...)
Coordinator.recover() -> list[Outcome]       # at startup, before any submit
    for each attempt in state CLAIMED with no outcome: commit OUTCOME_AMBIGUOUS(reason="interrupted",
        execution_domain="unknown"); command -> UNCERTAIN    # never calls the broker
```

The broker call is synchronous in SLICE-01. The bound comes from the broker itself (the scripted `timeout` step). Per-account workers arrive in SLICE-05.

Command and reservation states after each outcome:

| Outcome | Command | Attempt | Reservation |
|---|---|---|---|
| `not_sent` | `ADMITTED` | `NOT_SENT` | `HELD` |
| `rejected` | `REJECTED` | `REJECTED` | `RELEASED` |
| `acknowledged` | `WORKING` | `ACKNOWLEDGED` | `HELD` |
| `ambiguous` | `UNCERTAIN` | `AMBIGUOUS` | `HELD` |

`FaultPlan(point: Literal["CP-L1","CP-L2","CP-L3","CP-L4","CP-L5"])` calls `os._exit(86)` at the named point. It is constructed only by `bootstrap.compose_simulation(..., fault_plan=...)` in tests. Production compositions do not accept it (PRF-XC-02 checks that).

### Row 26 — `scripts/safe_tests.py`

```text
usage: python scripts/safe_tests.py [pytest args...]
```

* Refuses (exit 2) when any environment variable starts with `OPENALGO_`, `BROKER_` or `AT_LIVE_`.
* Creates a temp directory and sets `AT_TEST_ROOT` to it.
* Runs `python -m pytest -p no:cacheprovider --basetemp <tmp>/pt <args>`.
* Exits with pytest's code.

### Row 28 — fixture

```json
{"request": {"command_key": "slice01-entry-0001", "principal": "test-principal",
             "account": ["sim", "acct-sim"],
             "session_id": [[["sim", "acct-sim"], "NSE-FO-sim"], "2026-11-02"],
             "intent_ref": "f00d", "review_ref": "rev-1"},
 "application": {"intent_digest": "f00d", "mode": "observe", "applied": "proceed",
                 "review_id": "rev-1", "cause": null, "policy_version": "synthetic-1"},
 "plan": {"account": ["sim", "acct-sim"],
          "legs": [{"leg_role": "entry", "instrument": "NIFTY-SIM-CE", "side": "BUY",
                    "quantity": 75, "limit_price": null}],
          "amount": "1500.00", "margin": "1500.00", "worst_case_loss": "1500.00", "currency": "INR"},
 "synthetic_capacity": "5000.00", "_label": "synthetic test values, not defaults"}
```

`conftest.fixture_entry` computes `plan_digest` with row 17's `digest` and adds it, so the fixture never stores a digest by hand.

## Tests and expected outcomes (derived from the specs, not from the code)

| Test | Expected outcome | Proof |
|---|---|---|
| `test_event_envelope.py::test_digest_matches_hand_canonical` | `digest({"b":1,"a":[1,"é"]})` equals `hashlib.sha256('{"a":[1,"é"],"b":1}'.encode()).hexdigest()`, with the literal written in the test | PRF-LED-01 |
| `test_event_envelope.py::test_nan_refused` | `canonical({"x": float("nan")})` raises | PRF-LED-01 |
| `test_event_envelope.py::test_append_only` | `UPDATE ledger_event …` and `DELETE …` raise an APSW error whose message contains `append-only` | PRF-LED-02 |
| `test_event_envelope.py::test_chain_links` | After 3 appends, each `prev_hash` equals the previous `event_hash`; the first is `GENESIS_HASH` | PRF-LED-01 |
| `test_command_identity.py::test_same_key_same_content` | A second `submit_entry` returns the first command's state; the broker call count stays 1; the ledger event count is unchanged | PRF-LED-03 |
| `test_command_identity.py::test_same_key_changed_content` | Changing `intent_ref` under the same key gives refusal `LED-R02`; no events are appended | PRF-LED-03 |
| `test_command_identity.py::test_missing_key` | An empty key gives `LED-R01`; no events are appended | PRF-LED-03 |
| `test_entry_outcomes.py::test_ack` | Script `ack/ORD1`: outcome `acknowledged`, `sent=True`, `broker_order_ids={"entry": "ORD1"}`, command `WORKING`, reservation `HELD`, events `[EPOCH_ACTIVATED, RUNTIME_OPENED, MIGRATION_APPLIED, COMMAND_ADMITTED, DISPATCH_CLAIMED, OUTCOME_ACKNOWLEDGED]` | PRF-DSP-02 |
| `test_entry_outcomes.py::test_reservation_states` | After admission the reservation is `RESERVED` with `amount == "1500.00"`; after the claim it is `HELD` | PRF-LED-04 |
| `test_entry_outcomes.py::test_reject` | Command `REJECTED`, reservation `RELEASED`, `sent=True` | PRF-LED-04 |
| `test_entry_outcomes.py::test_not_sent` | Command `ADMITTED`, attempt `NOT_SENT`, reservation `HELD`, `sent=False` | PRF-LED-04 |
| `test_entry_outcomes.py::test_timeout` | Outcome `ambiguous`, command `UNCERTAIN`, reservation `HELD`, broker calls = 1 | PRF-DSP-02 |
| `test_entry_outcomes.py::test_capacity_unbound` | `synthetic_capacity=None` gives a recorded `ADM-R09 capacity_rule_unbound`; nothing reserved | PRF-XC-03 |
| `test_entry_outcomes.py::test_insufficient_capacity` | With capacity `"2000.00"`, a second distinct command of `"1500.00"` is refused; the first stays reserved | PRF-LED-04 |
| `test_entry_outcomes.py::test_not_eligible_recorded` | `applied="blocked"` gives an `ADMISSION_REFUSED` event with `ADM-R11` and no reservation | PRF-ADM-05 |
| `test_entry_outcomes.py::test_binding_mismatch` | An application whose `intent_digest` differs from `intent_ref` gives a recorded `ADM-R10`; nothing reserved | PRF-ADM-05 |
| `test_entry_outcomes.py::test_non_canonical_money_refused` | A plan with `amount="1.5e3"` or `"1500"` gives `LED-R06`; no events are appended | PRF-LED-04 |
| `test_entry_outcomes.py::test_outcome_from_wrong_state` | Committing a second `OUTCOME_ACKNOWLEDGED` for an attempt already `ACKNOWLEDGED` gives `LED-R09`; nothing is appended | PRF-LED-12 |
| `test_crash_boundaries.py::test_commit_failure` | A fault that makes the outcome `COMMIT` raise returns `canonical="commit_failed"` with the adapter's class; the next `transact` returns `LED-R10`; after reopen and `recover()` the attempt is `AMBIGUOUS(interrupted)` and the broker sees no second call | PRF-LED-07 |
| `test_capabilities.py::test_unsafe_sqlite_refused` | With `runtime_identity` monkeypatched to report 3.46.1, opening a writer raises `UnsafeRuntime`; reporting 3.50.7 opens | PRF-LED-13 |
| `test_crash_boundaries.py::test_cp_l1` … `test_cp_l5` | Run `submit_entry` in a subprocess with the fault point; reopen; call `recover()`. Expected: CP-L1 no events after the three bootstrap events; CP-L2 command `ADMITTED`, reservation `RESERVED`, no attempt; CP-L3/L4/L5 attempt `AMBIGUOUS(interrupted)`, command `UNCERTAIN`, reservation `HELD`, and a new broker in the recovering process records **0** calls | PRF-LED-05 |
| `test_capabilities.py::test_simulation_has_no_live_adapter` | `compose_simulation` returns an object graph with no `adapters.openalgo` module in `sys.modules` and no socket opened (monkeypatched `socket.socket` raises) | PRF-XC-02 |

Each test file states which rule it breaks to prove it can fail:

* removing the append-only trigger;
* removing the digest comparison;
* calling the broker before the claim commit;
* retrying on timeout.

## Verification commands (planned, not executed)

```bash
python -m venv .venv-slice01
.venv-slice01/bin/pip install -e ".[test]"
.venv-slice01/bin/python scripts/safe_tests.py tests/unit tests/integration tests/recovery tests/contracts -q
```

On Windows the interpreter path is `.venv-slice01\Scripts\python.exe`.

## Completion conditions

1. Every test in the table passes in a clean virtual environment, with no network and no broker variables.
2. `git status` in the target repository shows only the 33 listed paths.
3. No file outside README §6 and tree deltas T-01…T-05 exists.
4. The ledger file produced by `test_ack` passes a chain recheck. The test recomputes each `event_hash` with its own copy of the hand rule.

## Migration and rollback

* **Migration:** none. No legacy store is opened (REQ-MIG-003).
* **Rollback:** delete the slice's files. No production state exists.

## Prerequisites

None. This slice depends on no open owner question.
