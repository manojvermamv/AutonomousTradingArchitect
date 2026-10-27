# SLICE-01 — Disarmed financial core

* **Status:** proposed; revised after EGM stage 9 ([review](../../egm/plan/review.md)). Not implemented.
* **Precedence:** the master README (`AutonomousTradingArchitect/README.md`), then the master ROADMAP, then this package. This slice adds no decision.
* **Phase:** master Phase 1 (D01, D13 and D14 "in isolated target slices", master `README.md:1181`), plus the minimal Phase 2 packaging it needs (`README.md:1182`). D02's atomic commit is also proved here, in a disarmed simulation ledger only; Phase 4 (`README.md:1184`) proves D02 ownership in the disarmed shadow (SLICE-13). It adds no gate to any phase.
* **Environment class:** S (synthetic). The composition is **disarmed** (package glossary): no broker, no credentials, no legacy store, no network.
* **Decisions it proves:** D01 outcome truthfulness, D02 atomic admission, D13 claim-before-call, D14 identity, AUD-02 atomic outcome, Combined-F1 injected clock (types only), ATA-06 domain field (`simulated` only), and the SQLite safe-version rule (`README.md:782`).
* **Requirements it proves:** REQ-XC-002 (simulation cannot reach a live adapter), REQ-XC-003 (refusing parameters), REQ-DOM-002 (domain `simulated` on every outcome).
* **Who builds it:** one engineer, in a new repository (below), from this file and the specs it links. Every choice is made here; a question this file does not answer is a defect in this file.

**Excluded, and where each part arrives:**

| Not in SLICE-01 | Stand-in here | Arrives in |
|---|---|---|
| Review application (`kernel.policy`) | The test passes a fixed `ReviewApplication` | SLICE-04 |
| Planning (`kernel.planner`) | The test passes a fixed `PlanRef` | SLICE-04 |
| Grants, sessions, `authority.check` | None: no grant check; the session ID is carried, not checked | SLICE-03 |
| The retry branch of the identity rule (`DISPATCH_RETRY_REQUESTED`) | A same-key resubmission of a `NOT_SENT` command returns `Existing` and records nothing | SLICE-05 (needs `authority.check`) |
| Dispatch revalidation, per-account workers, deadlines | `revalidate_hook` always allows; the broker call is synchronous | SLICE-05 |
| Reconciliation, fills, reductions | `UNCERTAIN` stays uncertain | SLICE-07 |
| The durable evidence store; rebuilding an outcome from published evidence | Evidence refs use store `simulated` and are checked for form only | SLICE-02 |
| D04 comparison and repair; the per-`transact` `PRAGMA data_version` check for external writes | `fold` exists and is used in-transaction only; no external-write detection | SLICE-02 |
| `requirements.lock` | Minimum versions in `pyproject.toml` | SLICE-11 (TASK-S11-01) |
| Protection, conflicts, OpenAlgo, compatibility projections, real money values | None | SLICE-05…SLICE-13 |

## Goal

Build the smallest end-to-end financial path in the target package. For one fixed entry request:

1. the coordinator admits it, writing its event, command identity and reservation in one transaction;
2. the coordinator claims attempt 1 durably;
3. the coordinator sends it once to a scripted simulated broker, outside any transaction;
4. the coordinator commits the classified outcome in one transaction.

A crash at each crash point (CP-L1, CP-L2, CP-L3a, CP-L3b, CP-L5 below) and an injected commit failure each leave the state the crash-test table names.

## The target repository

* Create it with `git init -b main AutonomousTrading` (the root name in master README §6, `README.md:951`), outside this repository and outside any legacy checkout.
* Work on a branch `slice-01`. Commit the 37 files below and nothing else.
* All paths below are relative to that repository's root.

## Refusal convention (applies to every row)

| Mechanism | Used by | Meaning |
|---|---|---|
| Return a `Refusal` | `LedgerWriter.open` (`LED-R04`, `LED-R07`); `LedgerWriter.transact` (`LED-R01`, `LED-R02`, `LED-R03`, `LED-R06`, `LED-R08`, `LED-R09`, `LED-R10`); `admission.check` (`ADM-R09`, `ADM-R10`, `ADM-R11`) | The request was refused; nothing was written by that call |
| Raise `CommitFailed` | `LedgerWriter.transact` | An SQLite I/O error happened inside the transaction; whether it persisted is unknown; the writer is now failed |
| Raise `EnvelopeError` | `envelope.canonical` | A value that is not JSON data; `transact` maps it to `LED-R06` |
| Raise `UnsafeRuntime` | `runtime.require_safe`, `runtime.connect` | The SQLite library or connection settings are unsafe |
| Raise `WriterLost` | `Coordinator` | An outcome commit was refused with `LED-R03`, `LED-R09` or `LED-R10`; the caller must reopen and recover |
| Raise `RefusingParameterUnbound` | `bootstrap.compose_simulation` | A refusing parameter the composition needs is unbound |
| Raise `ValueError` | Contract-type constructors | A programming error: a malformed value was built |

* A refusal **code** is the bare ID, for example `LED-R02`. Its **message** is the name after it in the spec tables, for example `idempotency_conflict`. Tests assert both: `refusal.code == "LED-R02"` and `refusal.message == "idempotency_conflict"`. One exception: for `ADM-R09` the message is the intent spec's **reason**, the failing term (`amount`) or `capacity_rule_unbound`, because the table name (`capacity`) alone does not say which check failed.
* `Refusal.decision` is the event kind the refused decision would have written (for example `COMMAND_ADMITTED`), or `"open"` for `LedgerWriter.open`.
* Internal checks that fail inside `transact` raise exceptions that `transact` maps to a code: `PayloadInvalid` and `EnvelopeError` → `LED-R06`, `TransitionNotAllowed` → `LED-R09`, `InvariantViolated` → `LED-R08`. They never leave `transact`.
* Base classes: `UnsafeRuntime(RuntimeError)` (as legacy); `EnvelopeError(ValueError)`; `PayloadInvalid(ValueError)`; `TransitionNotAllowed(Exception)`; `InvariantViolated(Exception)`; `CommitFailed(Exception)`; `WriterLost(Exception)`; `RefusingParameterUnbound(Exception)`; `SettingsError(ValueError)`.
* The R-code families are listed in the [ledger](../../design/ledger-and-atomic-transaction.md#refusals-and-their-recording) and [intent](../../design/intent-to-admission.md#refusal-codes) specs.

## Files

All 37 paths are inside master README §6 or the tree deltas T-01…T-05, T-09 and T-19 in [05-module-index](../../05-module-index.md). In `src/autonomous_trading/`, only the package root and `contracts/` have an `__init__.py`. Every other directory (`adapters/`, `kernel/`, `kernel/ledger/`, `settings/`, `resources/`) is a **namespace package**, as the tree lists `__init__.py` only for those two (`README.md:949`).

| # | Path | Basis | What it holds |
|---|---|---|---|
| 1 | `pyproject.toml` | §6 | Project metadata and package discovery (below) |
| 2 | `.gitignore` | §6 | Generated paths (below) |
| 3 | `src/autonomous_trading/__init__.py` | §6 | Only `__version__ = "0.1.0.dev0"`; the public contracts are imported from `autonomous_trading.contracts` (a narrowing of the tree comment until SLICE-04) |
| 4 | `src/autonomous_trading/contracts/__init__.py` | §6 | Re-exports every type in rows 5–9 |
| 5 | `src/autonomous_trading/contracts/identity.py` | §6 | `CommandKey`, `AccountId`, `Principal`, `EpochId`, `SessionScope`, `FinancialSessionId` |
| 6 | `src/autonomous_trading/contracts/clock.py` | §6 | `Timestamp`, `Elapsed`, `Deadline`, `Clock` |
| 7 | `src/autonomous_trading/contracts/decisions.py` | §6 | `ReviewApplication`, `PlanLeg` (SLICE-01 subsets) |
| 8 | `src/autonomous_trading/contracts/evidence.py` | §6 | `DomainEvidence`, `EvidenceRef` |
| 9 | `src/autonomous_trading/contracts/execution.py` | §6 | `EntryRequest`, `PlanRef`, `LegResult`, `TransportResult`, `Outcome`, `Refusal` |
| 10 | `src/autonomous_trading/adapters/clocks.py` | §6 | `RecordedClock`, `LiveClock`, `format_utc` |
| 11 | `src/autonomous_trading/adapters/simulated_broker.py` | §6 | `SimulatedBroker`, `ScriptResponder` |
| 12 | `src/autonomous_trading/resources/defaults.yaml` | §6 | Packaged defaults (below) |
| 13 | `src/autonomous_trading/resources/events.schema.json` | §6 | Payload field lists for the SLICE-01 event kinds (below) |
| 14 | `src/autonomous_trading/resources/migrations/001_initial.sql` | §6 | Provisional schema v1 ([X-002](../../consistency/master-contradictions.md#x-002)) |
| 15 | `src/autonomous_trading/settings/loader.py` | §6 | `resolve`, `SettingsError` |
| 16 | `src/autonomous_trading/settings/schema.py` | §6 | `Settings` |
| 17 | `src/autonomous_trading/kernel/ledger/runtime.py` | §6 | `runtime_identity`, `require_safe`, `connect`, `host_identity`, `UnsafeRuntime` |
| 18 | `src/autonomous_trading/kernel/ledger/envelope.py` | §6 | `canonical`, `digest`, `is_money`, `GENESIS_HASH`, `envelope`, `validate_payload`, `EnvelopeError`, `PayloadInvalid` |
| 19 | `src/autonomous_trading/kernel/ledger/schema.py` | §6 | `apply_migrations`, `check`, `MIGRATIONS`, `SCHEMA_REVISION = 1` |
| 20 | `src/autonomous_trading/kernel/ledger/projections.py` | §6 | `fold`, `IndexRows`, `StoredEvent`, `TransitionNotAllowed`, `InvariantViolated` |
| 21 | `src/autonomous_trading/kernel/ledger/store.py` | §6 | `LedgerWriter`, `LedgerReader`, `Decision`, `EventDraft`, `StateGuard`, `Committed`, `Existing`, `CommitFailed`, `CommandRow`, `AttemptRow`, `ReservationRow` |
| 22 | `src/autonomous_trading/kernel/lifecycle.py` | §6 | `COMMAND_TRANSITIONS`, `ATTEMPT_TRANSITIONS` (the SLICE-01 rows of the ledger state table) |
| 23 | `src/autonomous_trading/kernel/reservations.py` | §6 | `reserve(plan) -> ReservationDraft`, `ReservationDraft` |
| 24 | `src/autonomous_trading/kernel/admission.py` | §6 | `request_digest`, `plan_digest`, `request_wire`, `check`, `admitted_decision`, `refused_decision` (checks A5, B5, B6; A1 is in the coordinator) |
| 25 | `src/autonomous_trading/kernel/ports.py` | §6 | `BrokerPort` |
| 26 | `src/autonomous_trading/kernel/coordinator.py` | §6 | `Coordinator`, `FaultPlan`, `WriterLost` |
| 27 | `src/autonomous_trading/bootstrap.py` | §6 | `compose_simulation`, `Composition`, `RefusingParameterUnbound` |
| 28 | `scripts/safe_tests.py` | §6 | Test launcher adapted from legacy `OA/scripts/safe_pytest.py` (below) |
| 29 | `tests/conftest.py` | T-04 | Fixtures, `load_fixture_entry` and the fault VFS (below) |
| 30 | `tests/fixtures/slice01_entry.json` | T-05 | The fixed request, application, plan and synthetic capacity |
| 31 | `tests/unit/test_event_envelope.py` | T-01 | PRF-LED-01, PRF-LED-02 |
| 32 | `tests/unit/test_command_identity.py` | T-02 | PRF-LED-03, PRF-LED-12 (SLICE-01 rows) |
| 33 | `tests/unit/test_clock_contract.py` | T-09 | PRF-SES-04 (clock types only) |
| 34 | `tests/unit/test_policy_parameters.py` | T-19 | PRF-XC-03 (SLICE-01 part) |
| 35 | `tests/integration/test_entry_outcomes.py` | T-03 | PRF-LED-04, PRF-DSP-02, PRF-ADM-05 (SLICE-01 part) |
| 36 | `tests/recovery/test_crash_boundaries.py` | §6 | PRF-LED-05 (SLICE-01 part), PRF-LED-07 |
| 37 | `tests/contracts/test_capabilities.py` | §6 | PRF-XC-02 (SLICE-01 part), PRF-LED-13, PRF-DSP-12 (script part) |

### Row 1 — `pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=69"]
build-backend = "setuptools.build_meta"

[project]
name = "autonomous-trading"
version = "0.1.0.dev0"
requires-python = ">=3.11"
dependencies = ["PyYAML>=6.0.1", "apsw>=3.51.3.0"]

[project.optional-dependencies]
test = ["pytest>=8.0"]

[tool.setuptools.packages.find]
where = ["src"]
namespaces = true

[tool.setuptools.package-data]
"autonomous_trading" = ["resources/*.yaml", "resources/*.json", "resources/migrations/*.sql"]
```

APSW's version tracks the SQLite it bundles, so `apsw>=3.51.3.0` installs a safe library, as legacy pins it (`OA/pyproject.toml:43-45`). The runtime check in row 17 still refuses an unsafe library at writer open. No JSON Schema library is used: row 13 is checked by stdlib code in row 18.

### Row 2 — `.gitignore`

```text
.venv*/
*.egg-info/
__pycache__/
.pytest_cache/
*.sqlite
*.sqlite-wal
*.sqlite-shm
*.writer.lock
```

### Rows 5–9 — contract types

Every type except the `Clock` protocol is a `@dataclass(frozen=True, slots=True)`. Constructors raise `ValueError` for the malformed values named in the comments.

```text
# row 5, contracts/identity.py
CommandKey(value: str)            # 1–128 chars from [A-Za-z0-9._:-]
AccountId(broker: str, account: str)                       # both non-empty
Principal(value: str, kind: Literal["human", "kernel"])    # value non-empty; "service" arrives in SLICE-03
EpochId(value: str)               # non-empty
SessionScope(account_id: AccountId, calendar_id: str)
FinancialSessionId(scope: SessionScope, trading_date: str)  # "YYYY-MM-DD"

# row 6, contracts/clock.py
Timestamp(utc_iso: str, domain: Literal["wall", "exchange", "recorded"], uncertainty_ms: int | None = None)
Elapsed(monotonic_ns: int)
Deadline(origin: Timestamp, budget_ms: int, started: Elapsed)
    expired(now_elapsed: Elapsed) -> bool    # now_elapsed.monotonic_ns - started.monotonic_ns >= budget_ms * 1_000_000
class Clock(Protocol):
    def now(self) -> Timestamp: ...
    def elapsed(self) -> Elapsed: ...

# row 7, contracts/decisions.py
ReviewApplication(intent_digest: str, strategy: str, mode: Literal["off","observe","enforce_entry_holds"],
                  applied: Literal["proceed","blocked","paused","proceed_unavailable"],
                  review_id: str | None, cause: str | None, policy_binding_id: str)
PlanLeg(leg_role: str, instrument: str, product: str, side: Literal["BUY"], quantity: int,
        limit_price: str | None)

# row 8, contracts/evidence.py
DomainEvidence(value: Literal["simulated","analyzer","live","unknown","conflicting"])
EvidenceRef(store: Literal["evidence","simulated"], content_digest: str, published_at: Timestamp)

# row 9, contracts/execution.py
EntryRequest(command_key: CommandKey | None, principal: Principal, account: AccountId,
             session_id: FinancialSessionId, intent_ref: str)     # None reaches admission as LED-R01
PlanRef(plan_digest: str, account: AccountId, legs: tuple[PlanLeg, ...], amount: str, margin: str,
        worst_case_loss: str, currency: Literal["INR"])
LegResult(leg_role: str, cls: Literal["not_sent","rejected","acknowledged","ambiguous"],
          broker_order_id: str | None, reason: str | None)
TransportResult(cls: Literal["not_sent","rejected","acknowledged","ambiguous"],
                legs: tuple[LegResult, ...], domain: DomainEvidence, raw: EvidenceRef | None)
Refusal(code: str, message: str, command_key: str | None, decision: str)
Outcome(command_key: str | None, attempt_no: int | None,
        effect: Literal["not_sent","rejected","acknowledged","ambiguous","refused"],
        canonical: Literal["committed","unchanged","commit_failed"],
        compat_projection: Literal["none"],
        broker_order_ids: Mapping[str, str], domain: DomainEvidence | None, sent: bool,
        refusal: Refusal | None)
```

* `ReviewApplication` and `PlanLeg` are SLICE-01 subsets of the [intent spec](../../design/intent-to-admission.md#contracts-contractsdecisionspy) types. SLICE-04 adds the remaining fields as keyword arguments with no defaults, which changes their constructors; this is expected.
* **Money** is a decimal string accepted by `envelope.is_money(s)`: `isinstance(s, str)`, `re.fullmatch(r"-?(0|[1-9][0-9]*)\.[0-9]{2}", s)` matches (the explicit `[0-9]` admits ASCII digits only, unlike `\d`), and `s != "-0.00"`. Arithmetic uses `decimal.Decimal`. SLICE-01 converts no floats, so `money.rounding` is not used yet ([ledger spec](../../design/ledger-and-atomic-transaction.md#money-and-quantity-representation)).

**Wire forms** (used inside payloads and digests; `canonical` in row 18 then serializes them):

| Type | Wire form | Example |
|---|---|---|
| `CommandKey` | its `value` string | `"slice01-entry-0001"` |
| `AccountId` | `[broker, account]` | `["sim", "acct-sim"]` |
| `Principal` | `[value, kind]` | `["test-principal", "human"]` |
| `FinancialSessionId` | `[[[broker, account], calendar_id], trading_date]` | `[[["sim","acct-sim"],"NSE-FO-sim"],"2026-11-02"]` |
| `Timestamp` | `utc_iso` string | `"2026-11-02T09:15:00.000000Z"` |
| `EvidenceRef` | `{"store": …, "content_digest": …, "published_at": <utc_iso>}` | |
| `PlanLeg`, `LegResult`, `ReviewApplication` | an object with exactly the dataclass field names; `None` as `null` | |
| `EntryRequest` | the request object below, **with** `"verb": "entry"`; `COMMAND_ADMITTED.request` holds exactly this object, so `request_digest == digest(request)` | |
| `PlanRef` | an object with every field; `account` and `legs` in their wire forms | |

**TEXT columns** hold: `principal` → the principal's `value`; `account` → `canonical([broker, account])`; `command_key` → the key's `value`.

**`admission.request_wire(request)`** returns `obj` and **`admission.request_digest(request)`** returns `digest(obj)`, where

```text
obj = {"verb": "entry", "command_key": <CommandKey wire>, "principal": <Principal wire>,
       "account": <AccountId wire>, "session_id": <FinancialSessionId wire>, "intent_ref": <str>}
```

For the fixture this is `{"account":["sim","acct-sim"],"command_key":"slice01-entry-0001","intent_ref":"f00d","principal":["test-principal","human"],"session_id":[[["sim","acct-sim"],"NSE-FO-sim"],"2026-11-02"],"verb":"entry"}` after canonicalization. This is the [ledger rule](../../design/ledger-and-atomic-transaction.md#request-digest-and-the-identity-rule).

**`admission.plan_digest(plan)`** is `digest(` the `PlanRef` wire object without the `plan_digest` key `)`.

### Row 10 — clocks

* `format_utc(dt: datetime) -> str` returns `dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")`, the sessions spec's RFC 3339 form ([clock contract](../../design/sessions-authority-lifecycle.md#clock-contract-contractsclockpy-adaptersclockspy)). Every stored time uses it.
* `RecordedClock(start_utc_iso: str)` keeps a list of recorded steps `(aware UTC datetime, Elapsed)`, starting with `(datetime.fromisoformat(start_utc_iso), Elapsed(0))` (Python 3.11 accepts the `Z` suffix and returns an aware UTC value):
  * `now()` returns `Timestamp(format_utc(last datetime), "recorded")`;
  * `elapsed()` returns the last step's `Elapsed`;
  * `advance(ms: int)` appends a step with `datetime + timedelta(milliseconds=ms)` and `monotonic_ns + ms * 1_000_000`.
* `LiveClock()`: `now()` is `Timestamp(format_utc(datetime.now(timezone.utc)), "wall")`; `elapsed()` is `Elapsed(time.monotonic_ns())`.

### Row 11 — simulated broker

The SLICE-01 subset of the [execution-domain spec's simulated broker](../../design/execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy):

```text
ScriptResponder(steps: list[dict])
SimulatedBroker(responder: ScriptResponder, clock: Clock, coverage: Literal["yes","no","unknown"] = "yes")
    send(request: EntryRequest, plan: PlanRef | None, attempt_no: int) -> TransportResult    # BrokerPort
    calls: list[dict]      # one {"command_key": str, "attempt_no": int, "account": [broker, account]} per send
```

* A step is `{"account"?: [broker, account], "result": "not_sent" | "reject" | "ack" | "timeout" | "raise", "order_id"?: str, "reason"?: str}`. Steps are consumed in order: each `send` takes the first remaining step whose `account` equals the request's account, or that has no `account`. No matching step raises `AssertionError` (a test bug).
* `send` appends to `calls` first, then builds the result. Each result has one leg, whose `leg_role` is the plan's single leg's role:

  | Script `result` | `cls` | Leg carries |
  |---|---|---|
  | `not_sent` | `not_sent` | reason `scripted_not_sent` |
  | `reject` | `rejected` | the step's `reason` (default `scripted_reject`) |
  | `ack` | `acknowledged` | `broker_order_id` = the step's `order_id` |
  | `timeout` | `ambiguous` | reason `timeout` |
  | `raise` | — | `send` raises `RuntimeError("scripted")` |

  `timeout` stands in for the HTTP client's total deadline, which the live adapter classifies as `ambiguous` ([dispatch spec](../../design/dispatch-and-coordination.md#bounded-io)).
* Every result has `domain=DomainEvidence("simulated")` and `raw=EvidenceRef("simulated", digest(step), clock.now())`.
* The module imports nothing from `adapters.openalgo`, opens no socket, and never reads `os.environ`. No client tag is sent: the broker order ID is the only identity.
* The `ObservationPort` methods, `RuleResponder`, the `stall` step and book steps arrive in SLICE-05, SLICE-07 and SLICE-12.

### Row 12 — `defaults.yaml`

```yaml
ledger:
  path: null
capacity:
  synthetic_amount: null     # refusing parameter; tests bind a labelled synthetic value
```

### Row 13 — `events.schema.json`

This file is a **field list**, not a JSON Schema document. `envelope.validate_payload` (row 18) checks a payload against it. Each kind maps to `{field: type}`; every listed field is required, and no other field is allowed. A type is one of `"string"`, `"integer"`, `"boolean"`, `"object"`, `"array"`, `"money"` (passes `is_money`), `"money_positive"` (passes `is_money` and is above zero), or a list of these with `"null"` (any one may match).

```json
{
  "format": "autonomous_trading.payload_fields/1",
  "kinds": {
    "EPOCH_ACTIVATED": {"epoch_id": "string", "principal": "array", "retired_epoch_id": ["string", "null"], "restore": ["object", "null"], "host_id": "string"},
    "MIGRATION_APPLIED": {"migration_number": "integer", "name": "string", "file_digest": "string"},
    "RUNTIME_OPENED": {"binding": "string", "binding_version": "string", "sqlite_version": "string"},
    "COMMAND_ADMITTED": {"verb": "string", "target": ["string", "null"], "strategy": "string",
      "request": "object", "request_digest": "string", "plan_ref": "object", "plan_digest": "string",
      "account": "array", "application": "object", "dependencies": "object", "state_heads": "object",
      "measured_ages": "object", "resulting_exposure": ["object", "null"], "reservation_id": "string",
      "amount": "money_positive", "margin": "money", "worst_case_loss": "money", "currency": "string"},
    "ADMISSION_REFUSED": {"verb": "string", "request_digest": "string", "code": "string", "message": "string", "inputs": "object"},
    "DISPATCH_CLAIMED": {"attempt_no": "integer", "epoch_id": "string"},
    "OUTCOME_NOT_SENT": {"attempt_no": "integer", "epoch_id": "string", "legs": "array", "unassigned_order_ids": "array", "reason": ["string", "null"], "raw_digest": ["string", "null"], "reservation_after": ["object", "null"]},
    "OUTCOME_REJECTED": {"attempt_no": "integer", "epoch_id": "string", "legs": "array", "unassigned_order_ids": "array", "reason": ["string", "null"], "raw_digest": ["string", "null"], "reservation_after": ["object", "null"]},
    "OUTCOME_ACKNOWLEDGED": {"attempt_no": "integer", "epoch_id": "string", "legs": "array", "unassigned_order_ids": "array", "reason": ["string", "null"], "raw_digest": ["string", "null"], "reservation_after": ["object", "null"]},
    "OUTCOME_AMBIGUOUS": {"attempt_no": "integer", "epoch_id": "string", "legs": "array", "unassigned_order_ids": "array", "reason": ["string", "null"], "raw_digest": ["string", "null"], "reservation_after": ["object", "null"]}
  }
}
```

The field names are the [ledger catalogue's](../../design/ledger-and-atomic-transaction.md#event-catalogue). Nested objects are not checked by this file; they are built from the typed dataclasses in rows 5–9, so their shape is fixed by construction. Later slices extend this file; they never remove a field.

**SLICE-01 payload values** for the fields with no SLICE-01 data:

| Event | Field | SLICE-01 value |
|---|---|---|
| `EPOCH_ACTIVATED` | `retired_epoch_id` | the previously active epoch, or `null` for the first |
| | `restore` | `null` (no restore path yet) |
| | `host_id` | `runtime.host_identity()` (read by the SLICE-03 fence rule and routine check) |
| `COMMAND_ADMITTED` | `target` | `null` (entries have none) |
| | `strategy` | `application.strategy` |
| | `request`, `plan_ref`, `application` | the wire forms |
| | `dependencies` | `{"dispatch_deadline": null, "release_binding_id": null, "grant_id": null, "session_id": <wire>}` |
| | `state_heads` | `{"reservation_head": <highest ledger sequence before this transaction>, "funds_observation": null, "position_observation": null}` |
| | `measured_ages` | `{}` |
| | `resulting_exposure` | `null` (SLICE-04 fills it) |
| | `reservation_id` | `"<command_key>#R"` |
| `ADMISSION_REFUSED` | `inputs` | `{"check": "A5" \| "B5" \| "B6"}` |
| `OUTCOME_*` | `legs` | the `LegResult` wire objects |
| | `unassigned_order_ids` | `[]` |
| | `reason` | the single leg's reason, or for `_AMBIGUOUS` the reason in the coordinator |
| | `raw_digest` | `raw.content_digest`, or `null` when `raw` is `None` or for `interrupted` |
| | `reservation_after` | `null` (no SLICE-01 event changes reservation amounts) |

### Row 14 — `001_initial.sql` (provisional; SLICE-01 tables only)

```sql
CREATE TABLE ledger_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE ledger_event (
  sequence INTEGER PRIMARY KEY, event_id TEXT NOT NULL UNIQUE,
  schema_name TEXT NOT NULL, schema_version INTEGER NOT NULL,
  family TEXT NOT NULL, kind TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('native','legacy_import','broker_observation')),
  execution_domain TEXT NOT NULL CHECK (execution_domain IN ('none','simulated','analyzer','live','unknown','conflicting')),
  epoch_id TEXT NOT NULL, transaction_id TEXT NOT NULL, causation_id TEXT, correlation_id TEXT,
  event_time TEXT, observed_time TEXT, append_time TEXT NOT NULL,
  clock_domain TEXT NOT NULL CHECK (clock_domain IN ('wall','exchange','recorded')),
  actor_type TEXT NOT NULL, principal TEXT NOT NULL, service TEXT NOT NULL,
  command_key TEXT, execution_id TEXT, request_digest TEXT,
  external_ids TEXT NOT NULL, evidence TEXT NOT NULL, payload TEXT NOT NULL,
  prev_hash TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE);
CREATE TRIGGER ledger_event_no_update BEFORE UPDATE ON ledger_event BEGIN SELECT RAISE(ABORT,'append-only'); END;
CREATE TRIGGER ledger_event_no_delete BEFORE DELETE ON ledger_event BEGIN SELECT RAISE(ABORT,'append-only'); END;
CREATE TABLE authority_epoch (epoch_id TEXT PRIMARY KEY, principal TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active','retired')), activated_sequence INTEGER NOT NULL);
CREATE UNIQUE INDEX authority_epoch_one_active ON authority_epoch(state) WHERE state='active';
CREATE TABLE command_identity (command_key TEXT PRIMARY KEY,
  verb TEXT NOT NULL CHECK (verb IN ('entry','cancel','modify','close')), target TEXT, strategy TEXT NOT NULL,
  request_digest TEXT NOT NULL, plan_digest TEXT, principal TEXT NOT NULL, account TEXT NOT NULL,
  first_sequence INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('ADMITTED','REFUSED','IN_FLIGHT','REJECTED','WORKING','UNCERTAIN','COMPLETED')),
  updated_sequence INTEGER NOT NULL);
CREATE TABLE command_attempt (attempt_id TEXT PRIMARY KEY,
  command_key TEXT NOT NULL REFERENCES command_identity(command_key), attempt_no INTEGER NOT NULL,
  epoch_id TEXT NOT NULL, claimed_at TEXT NOT NULL, domain TEXT, contract_version TEXT,
  state TEXT NOT NULL CHECK (state IN ('CLAIMED','NOT_SENT','REJECTED','ACKNOWLEDGED','AMBIGUOUS')),
  legs TEXT NOT NULL DEFAULT '[]', unassigned_order_ids TEXT NOT NULL DEFAULT '[]',
  retry_requested_sequence INTEGER, claimed_sequence INTEGER NOT NULL, outcome_sequence INTEGER,
  UNIQUE (command_key, attempt_no));
CREATE UNIQUE INDEX command_attempt_one_unresolved ON command_attempt(command_key)
  WHERE state IN ('CLAIMED','AMBIGUOUS');
CREATE TABLE reservation (reservation_id TEXT PRIMARY KEY,
  command_key TEXT NOT NULL UNIQUE REFERENCES command_identity(command_key),
  account TEXT NOT NULL, amount TEXT NOT NULL, margin TEXT NOT NULL, worst_case_loss TEXT NOT NULL,
  currency TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('RESERVED','HELD','RELEASED')),
  updated_sequence INTEGER NOT NULL);
CREATE TABLE broker_identity (kind TEXT NOT NULL CHECK (kind IN ('order_id','fill_id')), value TEXT NOT NULL,
  domain TEXT NOT NULL, command_key TEXT NOT NULL REFERENCES command_identity(command_key), leg_role TEXT,
  first_sequence INTEGER NOT NULL, quantity INTEGER, price TEXT, PRIMARY KEY (kind, value));
```

* The columns are the ledger spec's [table catalogue](../../design/ledger-and-atomic-transaction.md#schema-and-migrations) for these tables. `domain`, `contract_version` and `retry_requested_sequence` stay `NULL` until the slices that fill them; `quantity` and `price` until fills (SLICE-07).
* `ledger_meta` has no rows in the migration: it is an index table folded from `MIGRATION_APPLIED` (row 20).
* `schema.MIGRATIONS = [(1, "initial", "001_initial.sql")]`. `apply_migrations(conn)` runs only when the file has **no `ledger_event` table**: `BEGIN IMMEDIATE`, then the whole file text in one `conn.execute` (APSW runs consecutive statements; never split on `;`, which would break the trigger bodies), then `COMMIT`; on any error `ROLLBACK` and re-raise (legacy `OA/src/tier1/schema.py:118-126`).
* A migration's `file_digest` is `hashlib.sha256(text.replace("\r\n", "\n").encode("utf-8")).hexdigest()`, so a Windows checkout gives the same digest.
* `schema.check(conn) -> Refusal | None`: when `ledger_event` holds no rows, `None` (bootstrap pending). Otherwise `LED-R04 schema_unknown` unless `ledger_meta` has `schema_revision` equal to `"1"` and `int(migration_revision) <= 1`.
* `attempt_id` is `"<command_key>#<attempt_no>"`.
* The envelope columns keep the legacy names (`OA/src/tier1/envelope.py:92-117`) with three changes, recorded as [LD-21](../../legacy-divergence.md): `idempotency_key` becomes `command_key` (ledger spec), `execution_id` holds the `attempt_id`, and `execution_domain` and `clock_domain` are added. `schema_name` is `"autonomous_trading.event"` and `schema_version` is `1`.

### Row 15–16 — settings

```text
Settings(ledger_path: str | None, capacity_synthetic_amount: str | None)    # row 16
resolve(profile: str, env: Mapping[str, str]) -> Settings                   # row 15
SettingsError(ValueError)
```

`resolve` follows the [configuration spec's](../../design/configuration-artifacts-release.md) order (packaged defaults, then profile, then scoped environment), with SLICE-01's only profile:

1. Load `resources/defaults.yaml` (row 12) with `yaml.safe_load` through `importlib.resources`.
2. `profile` must be `"test"`; anything else raises `SettingsError("unknown profile")`. The `test` profile changes nothing in SLICE-01.
3. `env["AT_LEDGER_PATH"]`, if present, sets `ledger.path`; `env["AT_SYNTHETIC_CAPACITY"]`, if present, sets `capacity.synthetic_amount`. Other variables are ignored.
4. `capacity.synthetic_amount`, when not `None`, must pass `is_money`; otherwise `SettingsError`.

### Row 17 — runtime

Adapted from the legacy runtime (`OA/src/tier1/runtime.py:1-112` @445eb116):

* `host_identity() -> str` never raises. On Linux it returns the stripped text of `/etc/machine-id`. On Windows (`sys.platform == "win32"`, with `winreg` imported only there) it returns `winreg.QueryValueEx(winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography", 0, winreg.KEY_READ | winreg.KEY_WOW64_64KEY), "MachineGuid")[0]`. If the value is missing, empty or unreadable, or on any other platform, it returns `"unknown:" + uuid.uuid4().hex`, which never equals another value.
* `runtime_identity() -> dict` returns `{"binding": "apsw", "binding_version": apsw.apsw_version(), "sqlite_version": apsw.sqlite_lib_version(), "safe": bool, "minimum": "3.51.3"}`.
* "Safe" means the version tuple is ≥ (3, 51, 3), or is exactly (3, 44, 6) or (3, 50, 7).
* `require_safe() -> dict` returns the identity, or raises `UnsafeRuntime` when `safe` is false.
* `connect(path, *, writer: bool, busy_timeout_ms: int = 5000, vfs: str | None = None) -> apsw.Connection`:
  * writer: `require_safe()`; open read-write and create; `PRAGMA journal_mode=WAL` must return `wal`;
  * reader: the file must exist; open read-only; `PRAGMA journal_mode` must return `wal` (the ledger spec's reader rule; legacy did not check it). The reader also sets and reads back `synchronous=FULL`, as legacy; harmless on a read-only connection;
  * both: `set_busy_timeout(busy_timeout_ms)`; `PRAGMA synchronous=FULL`, read back as `2`; `PRAGMA foreign_keys=ON`;
  * any readback mismatch closes the connection and raises `UnsafeRuntime`;
  * `vfs` exists only for the fault VFS in `tests/conftest.py`.

### Row 18 — envelope

The legacy rule (`OA/src/tier1/envelope.py:17`, `:27-50` @445eb116):

* `canonical(value)` first checks recursively that every dict key is a string, every float is finite, and every value is `None`, `str`, `int`, `float`, `bool`, `list`, `tuple` or `dict` (else `PayloadInvalid`). It then returns `json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)`.
* `digest(value)` is `hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()`.
* `GENESIS_HASH = "0" * 64`.
* `validate_payload(kind, payload, fields)` raises `PayloadInvalid` for an unknown kind, a missing or extra field, or a type mismatch (row 13). `bool` is not accepted as `integer`.
* `envelope(columns: dict) -> dict` returns the dict that is hashed: every `ledger_event` column except `event_hash`, with `payload` and `external_ids` as JSON objects and `evidence` as a JSON array (not their stored text). `event_hash = digest(envelope(columns))`. The stored TEXT columns hold `canonical(...)` of those three values.

**How each column is filled** (by `LedgerWriter.transact`, from the `EventDraft` and the writer's state):

| Column | Value |
|---|---|
| `sequence` | Previous highest sequence + 1 |
| `event_id` | `uuid.uuid4().hex` |
| `schema_name`, `schema_version` | `"autonomous_trading.event"`, `1` |
| `family` | `"authority"` for `EPOCH_ACTIVATED`, `MIGRATION_APPLIED`, `RUNTIME_OPENED`; `"admission"` for `COMMAND_ADMITTED`, `ADMISSION_REFUSED`; `"dispatch"` for `DISPATCH_CLAIMED` and `OUTCOME_*` |
| `kind` | The draft's kind |
| `provenance` | `"native"` |
| `execution_domain` | The draft's `execution_domain` (default `"none"`) |
| `epoch_id` | The writer's epoch |
| `transaction_id` | One `uuid.uuid4().hex` per `transact` call |
| `causation_id`, `correlation_id` | The draft's values: `correlation_id` is the command key for command events; `causation_id` is `null` in SLICE-01 |
| `event_time` | `writer.clock.now().utc_iso` once per transaction |
| `observed_time` | `null` in SLICE-01 |
| `append_time` | The same value as `event_time` |
| `clock_domain` | `writer.clock.now().domain` |
| `actor_type`, `principal` | The draft's principal: `kind` and `value` |
| `service` | `"kernel"` |
| `command_key` | The command key for `COMMAND_ADMITTED`, `ADMISSION_REFUSED`, `DISPATCH_CLAIMED`, `OUTCOME_*`; else `null` |
| `execution_id` | The `attempt_id` for `DISPATCH_CLAIMED` and `OUTCOME_*`; else `null` |
| `request_digest` | For `COMMAND_ADMITTED` and `ADMISSION_REFUSED`; else `null` |
| `external_ids` | `{"order:<leg_role>": <broker_order_id>}` for each acknowledged leg of `OUTCOME_ACKNOWLEDGED`; else `{}` |
| `evidence` | The draft's `EvidenceRef` wire objects (`[raw]` for an outcome with `raw`); else `[]` |
| `payload` | The draft's payload |
| `prev_hash` | The previous event's `event_hash`, or `GENESIS_HASH` |

The draft's principal is the request's principal for `COMMAND_ADMITTED` and `ADMISSION_REFUSED`, and the writer's principal otherwise.

### Row 20 — `projections.fold`

```text
StoredEvent(sequence: int, kind: str, command_key: str | None, execution_id: str | None,
            principal: str, epoch_id: str, event_time: str, execution_domain: str, payload: dict)
IndexRows = dict[str, dict[tuple, dict]]          # table -> primary key tuple -> column dict
fold(rows_before: IndexRows, events: list[StoredEvent]) -> IndexRows
```

`fold` is pure. It applies each event in order and raises `TransitionNotAllowed` when a command or attempt is not in a state the event may leave (the rows of `lifecycle.COMMAND_TRANSITIONS` and `ATTEMPT_TRANSITIONS`). Its effects in SLICE-01:

| Event | Rows written |
|---|---|
| `EPOCH_ACTIVATED` | the retired epoch's row → `retired`; a new `authority_epoch` row `active` with `activated_sequence` |
| `MIGRATION_APPLIED` | `ledger_meta`: `schema_revision` = `"1"`, `migration_revision` = `str(migration_number)` |
| `RUNTIME_OPENED` | none |
| `COMMAND_ADMITTED` | `command_identity` (`state` `ADMITTED`, `first_sequence`, `updated_sequence`); `reservation` (`RESERVED`, amounts copied from the payload) |
| `ADMISSION_REFUSED` | none |
| `DISPATCH_CLAIMED` | `command_attempt` (`CLAIMED`, `epoch_id`, `claimed_at` = `event_time`, `claimed_sequence`); command `IN_FLIGHT`; reservation `HELD` |
| `OUTCOME_*` | attempt and command per the [ledger state table](../../design/ledger-and-atomic-transaction.md#command-and-attempt-state-machine); attempt `domain` = `execution_domain`, `legs`, `outcome_sequence`; reservation `RELEASED` for `_REJECTED`; one `broker_identity` row per acknowledged leg (`domain` = `execution_domain`, `leg_role` = the leg's role) |

`kernel/lifecycle.py` holds the transition tables as data (`{(from_state, event_kind): to_state}`), restricted to the events above.

### Row 21 — store

```text
# all store types are @dataclass(frozen=True, slots=True)
EventDraft(kind: str, payload: dict, principal: Principal, command_key: str | None = None,
           execution_id: str | None = None, request_digest: str | None = None,
           execution_domain: str = "none", external_ids: dict | None = None,
           evidence: tuple[EvidenceRef, ...] = (), causation_id: str | None = None, correlation_id: str | None = None)
StateGuard(command_state_in: frozenset[str], attempt_no: int | None, attempt_epoch: Literal["active","retired"] | None)
    # a None field skips that check
Decision(kind: str, command_key: str | None, request_digest: str | None,
         events: list[EventDraft], guard: StateGuard | None)
Committed(sequences: list[int]); Existing(command: CommandRow, latest_attempt: AttemptRow | None)
CommitFailed(Exception)
CommandRow, AttemptRow, ReservationRow       # frozen dataclasses with exactly the table columns

LedgerWriter.open(path, principal: Principal, epoch: EpochId, clock: Clock, *, vfs: str | None = None)
    -> LedgerWriter | Refusal
LedgerWriter.activate_epoch() -> Committed | Refusal
LedgerWriter.transact(decision: Decision) -> Committed | Existing | Refusal      # raises CommitFailed
LedgerWriter.command(key: str) -> CommandRow | None          # reads on the writer connection
LedgerWriter.latest_attempt(key: str) -> AttemptRow | None
LedgerWriter.open_reservations(account: AccountId) -> list[ReservationRow]   # state RESERVED or HELD
LedgerWriter.attempts_in_state(state: str) -> list[AttemptRow]
LedgerWriter.head() -> int                                   # highest sequence, 0 when empty (legacy ledger.py:187-190)
LedgerWriter.connection: apsw.Connection                     # read-only use by tests
LedgerWriter.close() -> None                                 # closes the connection, then unlocks and closes the lock file

LedgerReader.open(path) -> LedgerReader
LedgerReader.events(from_seq: int = 1) -> list[StoredEvent]
LedgerReader.command(key) -> CommandRow | None
LedgerReader.attempts(key) -> list[AttemptRow]
LedgerReader.reservation(key) -> ReservationRow | None       # LedgerReader.open also runs schema.check
LedgerReader.close() -> None
```

**`LedgerWriter.open`**, in order:

0. `Path(path).parent.mkdir(parents=True, exist_ok=True)` (legacy `ledger.py:121`).
1. Lock `f"{path}.writer.lock"` (legacy `OA/src/tier1/ledger.py:83-94`). On POSIX: `open(lock, "a+")`, then `fcntl.flock(fd, LOCK_EX | LOCK_NB)`; on `BlockingIOError` close the handle and return `LED-R07 writer_lock_held`. On Windows (new; legacy is POSIX-only): `open(lock, "a+")`, `seek(0)`, `msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)`; on `OSError` close the handle and return `LED-R07`. `close()` unlocks explicitly (`seek(0)`; `msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)` on Windows) before closing the handle. The lock file is never deleted.
2. `connect(path, writer=True, vfs=vfs)`.
3. `schema.apply_migrations(conn)` (only on a file with no `ledger_event` table).
4. `schema.check(conn)`; a `Refusal` is returned.

Any refusal or exception in steps 2–4 first closes the connection if it is open and releases the lock, then is returned or re-raised (legacy `ledger.py:123-132`).

**`activate_epoch()`** commits one transaction (legacy `OA/src/tier1/epoch.py:22`) holding, in this order: `EPOCH_ACTIVATED`; then, if no `MIGRATION_APPLIED` event exists yet, `MIGRATION_APPLIED(1, "initial", file_digest)`; then `RUNTIME_OPENED` with `{k: identity[k] for k in ("binding", "binding_version", "sqlite_version")}` from `runtime_identity()`. This is the ledger spec's order. It is the only write allowed before the writer's epoch is active. A crash between the migration and this transaction leaves tables with no events; the next open sees "no events" and the next `activate_epoch` writes `MIGRATION_APPLIED`, so the event is never lost.

**`transact(decision)`** follows the [ledger spec's steps](../../design/ledger-and-atomic-transaction.md#the-atomic-transaction):

1. If the writer has failed: `LED-R10 writer_failed`.
2. (D04, `LED-R05`, arrives in SLICE-02.)
3. If the writer's epoch is not the active `authority_epoch` row: `LED-R03 epoch_not_active`.
4. `BEGIN IMMEDIATE`. Validate every draft payload (row 18), and check every draft `EvidenceRef`: `store` is `"simulated"` and `content_digest` matches `[0-9a-f]{64}` (an `evidence`-store ref is refused until SLICE-02). Any failure → `LED-R06 invalid_payload`.
5. Identity rule, for `COMMAND_ADMITTED` and `ADMISSION_REFUSED` only: if `decision.command_key` is `None`, `LED-R01 missing_command_key`. If a `command_identity` row exists with the same `request_digest`, return `Existing`; with a different digest, `LED-R02 idempotency_conflict`. (The retry branch arrives in SLICE-05.)
6. Guard, if `decision.guard` is not `None`: the command's state is in `command_state_in`, the latest attempt number equals `attempt_no`, and that attempt's epoch is the writer's epoch (`"active"`) or a retired one (`"retired"`). Otherwise `LED-R09 transition_not_allowed`.
7. Append the events (columns per row 18), load the touched rows, compute `fold(touched rows, new events)` (`TransitionNotAllowed` → `LED-R09`), and check I-3 on every touched reservation: a new row must be `RESERVED`; an existing row may stay in its state or move `RESERVED → HELD`, `HELD → RELEASED` or `RESERVED → RELEASED`; anything else raises `InvariantViolated` → `LED-R08 invariant_violation`. Then write the rows with `INSERT … ON CONFLICT (<primary key>) DO UPDATE SET …`, parents before children (`authority_epoch`, `ledger_meta`, `command_identity`, then `command_attempt`, `reservation`, `broker_identity`). For `EPOCH_ACTIVATED`, update the retired row before inserting the new active one, so the one-active index never sees two.
8. `COMMIT`.

Every exit from steps 4–7 other than a commit (a refusal, or `Existing` at step 5) runs `ROLLBACK` before returning. An `apsw.IOError` or `apsw.FullError` raised in steps 4–8 runs `ROLLBACK` (ignoring a second error, as legacy `ledger.py:164-183`), marks the writer failed and raises `CommitFailed`. Any other exception runs `ROLLBACK` and propagates.

### Rows 22–24 — lifecycle, reservations, admission

* `reservations.reserve(plan) -> ReservationDraft(reservation_id, amount, margin, worst_case_loss, currency)` copies the plan's three money fields unchanged. The real amount rule is TASK-S04-03.
* `admission.check(request, application, plan, synthetic_capacity, open_reservations) -> Refusal | None` runs these checks in this order and returns the first refusal. The labels are the [intent spec's admission checks](../../design/intent-to-admission.md#admission-kerneladmissionpy):

  | Order | Check | Refusal |
  |---|---|---|
  | 1 | **A5** `application.applied` is `proceed` or `proceed_unavailable` | `ADM-R11` `not_eligible` |
  | 2 | **B5** `synthetic_capacity` is not `None` | `ADM-R09` `capacity_rule_unbound` |
  | 3 | **B5** `Decimal(plan.amount) ≤ Decimal(synthetic_capacity) − Σ Decimal(r.amount)` over `open_reservations` | `ADM-R09` `amount` |
  | 4 | **B6** `application.intent_digest == request.intent_ref`, `plan.account == request.account`, and `plan_digest` recomputes to `plan.plan_digest` | `ADM-R10` `binding_mismatch` |

  Only the B5 `amount` term is checked; the `margin` and `worst_case_loss` terms arrive with TASK-S04-03.
* `admission.admitted_decision(request, application, plan, draft, state_head: int) -> Decision` builds `Decision("COMMAND_ADMITTED", key, request_digest, [one draft], guard=None)` with the payload of row 13.
* `admission.refused_decision(request, refusal) -> Decision` builds `Decision("ADMISSION_REFUSED", key, request_digest, [one draft], guard=None)`, with `inputs = {"check": {"ADM-R11": "A5", "ADM-R09": "B5", "ADM-R10": "B6"}[refusal.code]}`.

### Row 25 — `BrokerPort`

```text
class BrokerPort(Protocol):
    def send(self, request: EntryRequest, plan: PlanRef | None, attempt_no: int) -> TransportResult: ...
```

`EntryRequest` is SLICE-01's only action request; `CancelRequest`, `ModifyRequest` and `CloseRequest` join the union in SLICE-05.

### Row 26 — coordinator

```text
FaultPlan(point: Literal["CP-L1","CP-L2","CP-L3a","CP-L3b","CP-L5"])
WriterLost(Exception)            # carries the Refusal
Coordinator(writer: LedgerWriter, broker: BrokerPort, clock: Clock, synthetic_capacity: str | None,
            fault_plan: FaultPlan | None = None)
Coordinator.submit_entry(request, application, plan) -> Outcome
Coordinator.recover() -> list[Outcome]
Coordinator.revalidate_hook(command: CommandRow) -> bool   # SLICE-01: returns True; SLICE-05 replaces it
```

The crash points are the ledger spec's ([failure table](../../design/ledger-and-atomic-transaction.md#failure-modes-and-crash-points)); CP-L3a and CP-L3b are the "before" and "after the adapter call" cases of its CP-L3. At a crash point named by `fault_plan`, the coordinator calls `os._exit(86)`.

`submit_entry`:

Below, `key` is `request.command_key.value`.

1. **A1.** If `request.command_key is None`: return `Outcome(None, None, "refused", "unchanged", "none", {}, None, False, Refusal("LED-R01", "missing_command_key", None, "COMMAND_ADMITTED"))`.
2. **Identity.** `row = writer.command(key)`. If it exists with the same `request_digest`: return the **existing** outcome (below). With a different digest: return a refused outcome with `LED-R02`, `canonical="unchanged"`.
3. **Checks.** `refusal = admission.check(..., open_reservations=writer.open_reservations(request.account))`. If refused: `writer.transact(admission.refused_decision(request, refusal))`; `Committed` → return `Outcome(key, None, "refused", "committed", "none", {}, None, False, refusal)`; `CommitFailed` → the same with `canonical="commit_failed"`; a `Refusal` → raise `WriterLost`.
4. **CP-L1** crash point. Then `t1 = writer.transact(admission.admitted_decision(..., state_head=writer.head()))`. `Existing` → the existing outcome; `Refusal` → a refused outcome with `canonical="unchanged"`; `CommitFailed` → `Outcome(key, None, "refused", "commit_failed", "none", {}, None, False, None)`.
5. **CP-L2.** `self.revalidate_hook(writer.command(key))`; it returns `True` in SLICE-01 and runs before the claim.
6. `n = (latest attempt number, or 0) + 1`. `t2 = writer.transact(Decision("DISPATCH_CLAIMED", key, None, [draft], StateGuard(frozenset({"ADMITTED"}), None, None)))`. `CommitFailed` → return `Outcome(key, n, "not_sent", "commit_failed", "none", {}, None, False, None)` without sending; a `Refusal` → raise `WriterLost`.
7. **CP-L3a.** `result = broker.send(request, plan, n)`, outside any transaction. If `send` raises, `result = TransportResult("ambiguous", (LegResult(role, "ambiguous", None, "adapter_error"),), DomainEvidence("simulated"), None)`.
8. **CP-L3b.** Let `ids = {leg.leg_role: leg.broker_order_id}` for the acknowledged legs of `result`. `t3 = writer.transact(Decision("OUTCOME_" + result.cls.upper(), key, None, [draft], StateGuard(frozenset({"IN_FLIGHT"}), n, "active")))` with `execution_domain = result.domain.value` and `evidence = (result.raw,)` when `raw` is not `None`.
   * `Refusal` `LED-R06` or `LED-R08`: commit the **fallback**, an `OUTCOME_AMBIGUOUS` with reason `outcome_refused`, the same guard, `legs` = the result's legs re-classed `ambiguous` (each keeps its `broker_order_id`), `raw_digest` `null`, `external_ids` `{}`, `evidence` `()`, `execution_domain` = `result.domain.value`. No `broker_identity` row is written (fold writes them only for acknowledged legs). If the fallback commits, return `Outcome(key, n, "ambiguous", "committed", "none", {}, result.domain, result.cls != "not_sent", None)`. If it is refused, raise `WriterLost`; if it raises `CommitFailed`, return the `commit_failed` outcome below.
   * `Refusal` `LED-R03`, `LED-R09` or `LED-R10`: raise `WriterLost(refusal)`.
   * `CommitFailed`: return `Outcome(key, n, result.cls, "commit_failed", "none", ids, result.domain, result.cls != "not_sent", None)`.
9. **CP-L5.** Return `Outcome(key, n, result.cls, "committed", "none", ids, result.domain, result.cls != "not_sent", None)`.

**The existing outcome** (identity found): `canonical="unchanged"`, `refusal=None`. With no attempt: `effect="not_sent"`, `attempt_no=None`, `sent=False`. Otherwise from the latest attempt: `effect` = its state in lower case (`ACKNOWLEDGED` → `acknowledged`, and so on; `CLAIMED` → `ambiguous`), `attempt_no`, `sent = effect != "not_sent"`, `broker_order_ids` = `{leg["leg_role"]: leg["broker_order_id"]}` for the legs in the attempt's `legs` JSON whose `cls` is `acknowledged`, `domain` = `DomainEvidence(attempt.domain)` or `None` when the column is `NULL`.

`recover()` runs once, right after `activate_epoch()` and before any `submit_entry`. For each attempt in state `CLAIMED` whose epoch is retired, it commits `OUTCOME_AMBIGUOUS` (reason `interrupted`, `legs` `[]`, `raw_digest` `null`, `execution_domain` `unknown`, payload `epoch_id` = the attempt's epoch) with `StateGuard(frozenset({"IN_FLIGHT"}), n, "retired")`, and returns one `Outcome(key, n, "ambiguous", "committed", "none", {}, DomainEvidence("unknown"), True, None)` per attempt. A `Refusal` raises `WriterLost`; `CommitFailed` propagates. It never calls the broker. Rebuilding from published evidence arrives with the evidence store (SLICE-02).

States after each outcome:

| Outcome | Command | Attempt | Reservation |
|---|---|---|---|
| `not_sent` | `ADMITTED` | `NOT_SENT` | `HELD` |
| `rejected` | `REJECTED` | `REJECTED` | `RELEASED` |
| `acknowledged` | `WORKING` | `ACKNOWLEDGED` | `HELD` |
| `ambiguous` | `UNCERTAIN` | `AMBIGUOUS` | `HELD` |

### Row 27 — `bootstrap.compose_simulation`

```text
Composition(settings: Settings, writer: LedgerWriter, coordinator: Coordinator, broker: SimulatedBroker,
            clock: Clock, synthetic_values: dict[str, str])
compose_simulation(settings: Settings, broker: SimulatedBroker, clock: Clock, *,
                   port: BrokerPort | None = None, fault_plan: FaultPlan | None = None,
                   vfs: str | None = None) -> Composition
# port: what the coordinator calls (default: broker); tests pass a wrapper around broker
```

In order:

1. `settings.ledger_path` is `None` → `SettingsError("ledger.path is required")`.
2. `settings.capacity_synthetic_amount` is `None` → `RefusingParameterUnbound("capacity.synthetic_amount")` (REQ-XC-003).
3. `writer = LedgerWriter.open(settings.ledger_path, Principal("kernel:slice01", "kernel"), EpochId("epoch-" + uuid4().hex), clock, vfs=vfs)`; a `Refusal` raises `SettingsError(str(refusal))`.
4. `writer.activate_epoch()`; a `Refusal` raises `WriterLost`.
5. `coordinator = Coordinator(writer, port or broker, clock, settings.capacity_synthetic_amount, fault_plan)`; `coordinator.recover()`.
6. Return the composition with `synthetic_values = {"capacity.synthetic_amount": <value>}`.

`compose_simulation` is the only composition in SLICE-01, so `FaultPlan` and `vfs` are accepted nowhere else.

### Row 28 — `scripts/safe_tests.py`

Adapted from legacy `OA/scripts/safe_pytest.py` @445eb116 (README §6 calls for reusing its protection, `README.md:1096`):

```text
usage: python scripts/safe_tests.py [--timeout SECONDS] [pytest args...]     # parse_known_args, as legacy :245
```

Exit codes 10–13 are the launcher's own, so they never collide with pytest's 0–5.

1. Refuse (exit 10) when any environment variable name starts with `OPENALGO_`, `BROKER_` or `AT_LIVE_`.
2. Create `~/.cache` if missing and take a per-user lock, `~/.cache/autonomous-trading-test.lock`, with the legacy `_lock` (POSIX `flock`; on Windows no lock, as legacy). Held → exit 11.
3. On Linux, refuse (exit 12) when `MemAvailable` in `/proc/meminfo` is under 2012 MB (legacy's default 1500 MB cap plus its 512 MB reserve, `safe_pytest.py:53`, `:155`).
4. Create `tempfile.TemporaryDirectory(dir=Path.home() / ".cache" / "autonomous-trading-test-tmp")` (on disk, never a RAM-backed `/tmp`, as legacy); set `AT_TEST_ROOT`, `TMPDIR`, `TMP` and `TEMP` to it for the child; delete it afterwards.
5. Run `[sys.executable, "-m", "pytest", "-p", "no:cacheprovider", *args, "--basetemp", f"{tmp}/pt"]` (`--basetemp` last, so a caller's cannot win, as legacy `:167-170`), at the lowest priority: `preexec_fn=lambda: os.nice(19)` on POSIX, `creationflags=subprocess.BELOW_NORMAL_PRIORITY_CLASS` on Windows (legacy `:286`); `timeout=args.timeout or 1800`. Exit with pytest's code, or 13 on timeout.

Not reused: the legacy live-checkout session-calendar check and the cgroup limits, because a SLICE-01 checkout has no live services. `tests/conftest.py` puts every ledger under `AT_TEST_ROOT` when it is set, else under pytest's `tmp_path`.

### Row 29 — `tests/conftest.py`

| Fixture | Returns |
|---|---|
| `recorded_clock` | `RecordedClock("2026-11-02T09:15:00.000000Z")` |
| `tmp_ledger` | A `Path` to `ledger.sqlite` in a fresh directory (not created) |
| `fixture_entry` | `load_fixture_entry()`: a plain function in `conftest.py` returning `FixtureEntry(request, application, plan, synthetic_capacity)` from row 30, with `plan_digest` computed by `admission.plan_digest` |
| `simulation` | A factory `simulation(steps, *, capacity="5000.00", fault_plan=None, vfs=None, path=None, wrap=None) -> Composition` that builds `broker = SimulatedBroker(ScriptResponder(steps), recorded_clock)` and calls `compose_simulation(Settings(str(path or tmp_ledger), capacity), broker, recorded_clock, port=wrap(broker) if wrap else None, ...)`. When reopening a path after a crash it retries `LED-R07` up to 50 times, 100 ms apart (a Windows lock left by a killed process is released by the OS after a delay). At teardown it disarms any fault VFS and closes every writer it built, before the VFS is unregistered |
| `fault_vfs` | A `FaultVFS` registered under a unique name, unregistered after the test |

`FaultVFS` and `FaultFile` are the legacy durability suite's `_FaultVFS` and `_FaultFile` (`OA/tests/test_tier1_durability.py:52-73` @445eb116): an `apsw.VFS` whose files raise `self.error` (default `apsw.FullError`) from `xWrite` once `armed` is true. A test always disarms before `writer.close()`, because closing a WAL connection checkpoints through `xWrite`.

### Row 30 — fixture

```json
{"request": {"command_key": "slice01-entry-0001", "principal": ["test-principal", "human"],
             "account": ["sim", "acct-sim"],
             "session_id": [[["sim", "acct-sim"], "NSE-FO-sim"], "2026-11-02"],
             "intent_ref": "f00d"},
 "application": {"intent_digest": "f00d", "strategy": "synthetic-strategy", "mode": "observe",
                 "applied": "proceed", "review_id": "rev-1", "cause": null,
                 "policy_binding_id": "synthetic-1"},
 "plan": {"account": ["sim", "acct-sim"],
          "legs": [{"leg_role": "entry", "instrument": "NIFTY-SIM-CE", "product": "SIM", "side": "BUY",
                    "quantity": 75, "limit_price": null}],
          "amount": "1500.00", "margin": "1500.00", "worst_case_loss": "1500.00", "currency": "INR"},
 "synthetic_capacity": "5000.00", "_label": "synthetic test values, not defaults"}
```

`fixture_entry` builds the typed objects from the wire forms (row 9 table) and never stores a digest by hand.

## Tests and expected outcomes

Expected outcomes are derived from the specs, not from the code. Each test's docstring names its requirement key and proof. "Bootstrap events" are `[EPOCH_ACTIVATED, MIGRATION_APPLIED, RUNTIME_OPENED]`; a reopen appends `[EPOCH_ACTIVATED, RUNTIME_OPENED]`.

### Unit

| Test | Setup and expected outcome | Proof |
|---|---|---|
| `test_event_envelope.py::test_digest_matches_hand_canonical` | `digest({"b": 1, "a": [1, "é"]})` equals `hashlib.sha256('{"a":[1,"é"],"b":1}'.encode("utf-8")).hexdigest()`, the literal written in the test | PRF-LED-01 |
| `test_event_envelope.py::test_nan_refused` | `canonical({"x": float("nan")})` and `canonical({1: "a"})` raise `PayloadInvalid` | PRF-LED-01 |
| `test_event_envelope.py::test_chain_links_and_recheck` | After `simulation([{"result": "ack", "order_id": "ORD1"}])` and one `submit_entry`, the test recomputes every `event_hash` with its own copy of the rule (`hashlib`, `json.dumps` with the row 18 arguments, the row 18 envelope) and each `prev_hash` equals the previous `event_hash` (the first is `"0" * 64`). Then it opens the file with plain `apsw`, drops the `ledger_event_no_update` trigger, changes one payload, and the recheck fails | PRF-LED-01 |
| `test_event_envelope.py::test_append_only` | `UPDATE ledger_event SET kind='X'` and `DELETE FROM ledger_event` raise `apsw.ConstraintError` whose message contains `append-only` | PRF-LED-02 |
| `test_command_identity.py::test_same_key_same_content` | Script `[ack ORD1]`. A second `submit_entry` with the same request returns `effect="acknowledged"`, `canonical="unchanged"`, `attempt_no=1`, `broker_order_ids={"entry": "ORD1"}`; `broker.calls` has 1 entry; the event count is unchanged | PRF-LED-03 |
| `test_command_identity.py::test_same_key_changed_content` | Changing `intent_ref` under the same key returns `refusal.code == "LED-R02"`, `canonical="unchanged"`; no events are appended | PRF-LED-03 |
| `test_command_identity.py::test_missing_key` | `command_key=None` returns `refusal.code == "LED-R01"`; no events are appended | PRF-LED-03 |
| `test_command_identity.py::test_outcome_from_wrong_state` | After an `ack` entry, `writer.transact` of a second `OUTCOME_ACKNOWLEDGED` decision with `StateGuard({"IN_FLIGHT"}, 1, "active")` returns `LED-R09`; nothing is appended | PRF-LED-12 |
| `test_command_identity.py::test_retired_epoch_guard` | In-process: build a composition; commit the fixture's `COMMAND_ADMITTED` (`admission.admitted_decision`) and its `DISPATCH_CLAIMED` (attempt 1) with `writer.transact`, without sending; `writer.close()`. Open a new `LedgerWriter` on the path with a new epoch and `activate_epoch()`. `transact(Decision("OUTCOME_AMBIGUOUS", key, None, [draft with attempt_no 1, reason "timeout", legs [], raw_digest null], StateGuard(frozenset({"IN_FLIGHT"}), 1, "active")))` returns `LED-R09`. `Coordinator(...).recover()` then commits `OUTCOME_AMBIGUOUS(interrupted)` | PRF-LED-12 |
| `test_command_identity.py::test_reservation_cannot_go_back` | After a `reject` entry (reservation `RELEASED`), `writer.transact(Decision("DISPATCH_CLAIMED", key, None, [draft: attempt_no 2, execution_id "slice01-entry-0001#2", payload epoch_id = the writer's], guard=None))` returns `LED-R09` from `fold` (command `REJECTED`); with the command row forced to `ADMITTED` through a plain `apsw` connection, the same decision returns `LED-R08` (I-3: `RELEASED → HELD`) | PRF-LED-12 |
| `test_command_identity.py::test_evidence_ref_form` | An outcome draft whose `EvidenceRef` has store `"evidence"` or a 63-character digest returns `LED-R06` | PRF-LED-12 |
| `test_command_identity.py::test_non_canonical_money_refused` | With `plan_digest` recomputed after each change: `amount` of `"1.5e3"`, `"1500"`, `"01500.00"`, `"-0.00"`, `"١٥٠٠.٠٠"` and `"0.00"` each return `LED-R06`; no events are appended | PRF-LED-12 |
| `test_clock_contract.py::test_recorded_clock` | `RecordedClock` starts at `Elapsed(0)`; `advance(1500)` moves `now()` by 1.5 s and `elapsed()` by 1_500_000_000 ns; `now().utc_iso` ends in `Z` and has six fractional digits | PRF-SES-04 |
| `test_clock_contract.py::test_deadline_uses_elapsed` | A `Deadline(origin, 1000, started=clock.elapsed())` is not expired at `clock.elapsed()` after `advance(999)`, and is expired after `advance(1)`; `expired` reads only `Elapsed` | PRF-SES-04 |
| `test_capabilities.py::test_host_identity` | Two calls return the same value; with `/etc/machine-id` (or the registry read) monkeypatched to fail, the value starts with `unknown:` and two calls differ | PRF-LED-13 |
| `test_clock_contract.py::test_live_clock_domains` | `LiveClock().now().domain == "wall"` and the format matches `format_utc` | PRF-SES-04 |
| `test_policy_parameters.py::test_capacity_is_refusing` | `compose_simulation` with `capacity_synthetic_amount=None` raises `RefusingParameterUnbound("capacity.synthetic_amount")`; `defaults.yaml` holds `null` for it | PRF-XC-03 |
| `test_policy_parameters.py::test_synthetic_values_reported` | A composition built with `"5000.00"` reports `synthetic_values == {"capacity.synthetic_amount": "5000.00"}` | PRF-XC-03 |
| `test_policy_parameters.py::test_resolver_order` | `resolve("test", {"AT_LEDGER_PATH": "x", "AT_SYNTHETIC_CAPACITY": "1.00"})` sets both; `resolve("live", {})` raises `SettingsError`; `AT_SYNTHETIC_CAPACITY="1"` raises `SettingsError` | PRF-XC-03 |

### Integration

| Test | Setup and expected outcome | Proof |
|---|---|---|
| `test_entry_outcomes.py::test_ack` | Script `[ack ORD1]`: outcome `acknowledged`, `sent=True`, `canonical="committed"`, `broker_order_ids={"entry": "ORD1"}`, `domain.value == "simulated"`; command `WORKING`; reservation `HELD`; events = bootstrap + `[COMMAND_ADMITTED, DISPATCH_CLAIMED, OUTCOME_ACKNOWLEDGED]`; `OUTCOME_ACKNOWLEDGED.execution_domain == "simulated"`; one `broker_identity` row with `kind` `order_id`, `value` `ORD1`, `domain` `simulated` and `leg_role` `entry` | PRF-DSP-02 |
| `test_entry_outcomes.py::test_claim_precedes_call` | `simulation([ack ORD1], wrap=…)` with a wrapper whose `send` opens a `LedgerReader` on the path before delegating: it sees `DISPATCH_CLAIMED` already committed | PRF-DSP-02 |
| `test_entry_outcomes.py::test_reservation_states` | Monkeypatch `Coordinator.revalidate_hook` to read the reservation (it runs after admission, before the claim): `RESERVED` with `amount == "1500.00"`; a `wrap` broker reads it inside `send`: `HELD` | PRF-LED-04 |
| `test_entry_outcomes.py::test_reject` | Script `[reject]`: command `REJECTED`, attempt `REJECTED`, reservation `RELEASED`, `sent=True` | PRF-LED-04 |
| `test_entry_outcomes.py::test_not_sent` | Script `[not_sent]`: command `ADMITTED`, attempt `NOT_SENT`, reservation `HELD`, `sent=False` | PRF-LED-04 |
| `test_entry_outcomes.py::test_timeout` | Script `[timeout]`: outcome `ambiguous`, command `UNCERTAIN`, reservation `HELD`, `len(broker.calls) == 1` | PRF-DSP-02 |
| `test_entry_outcomes.py::test_adapter_raises` | Script `[raise]`: outcome `ambiguous`, attempt `AMBIGUOUS`, the leg reason `adapter_error` | PRF-DSP-02 |
| `test_entry_outcomes.py::test_capacity_unbound_at_admission` | `admission.check(..., synthetic_capacity=None, ...)` returns `ADM-R09` / `capacity_rule_unbound` | PRF-XC-03 |
| `test_entry_outcomes.py::test_insufficient_capacity` | Capacity `"2000.00"`; first entry `slice01-entry-0001` with script `[ack ORD1]` (reservation `HELD`); a second entry `slice01-entry-0002` of `"1500.00"` returns a recorded refusal `ADM-R09` / `amount`; `ADMISSION_REFUSED` is appended; the first reservation stays `HELD` | PRF-ADM-05 |
| `test_entry_outcomes.py::test_not_eligible_recorded` | `applied="blocked"`: refusal `ADM-R11` / `not_eligible`, `canonical="committed"`, one `ADMISSION_REFUSED` event, no reservation | PRF-ADM-05 |
| `test_entry_outcomes.py::test_binding_mismatch` | `application.intent_digest="beef"`: recorded `ADM-R10`; no reservation | PRF-ADM-05 |
| `test_entry_outcomes.py::test_refusal_then_fresh_evaluation` | Script `[ack ORD1]`. After a recorded `ADM-R11`, the same key with `applied="proceed"` is admitted and acknowledged (a recorded refusal creates no identity row) | PRF-ADM-05 |
| `test_entry_outcomes.py::test_admission_failure_leaves_nothing` | `simulation([ack ORD1], vfs=fault_vfs.name)`; arm `fault_vfs` from inside `admission.check` via a monkeypatch: `submit_entry` returns `canonical="commit_failed"`. Disarm, `writer.close()`, reopen with `simulation([ack ORD1], path=…)`: no `COMMAND_ADMITTED`, no identity row, no reservation; a same-key `submit_entry` then admits exactly once (one `COMMAND_ADMITTED`, one broker call) | PRF-LED-04, PRF-LED-07 |

### Recovery

Each crash test runs `submit_entry` in a child process. `test_crash_boundaries.py` doubles as the driver: `python tests/recovery/test_crash_boundaries.py <ledger_path> <fault_point> <steps_json>`. In its `if __name__ == "__main__":` block it inserts `Path(__file__).parents[1]` into `sys.path`, imports `load_fixture_entry` from `conftest`, builds `compose_simulation(Settings(ledger_path, fixture.synthetic_capacity), SimulatedBroker(ScriptResponder(json.loads(steps_json)), clock), clock, fault_plan=FaultPlan(fault_point))` with `clock = RecordedClock("2026-11-02T09:15:00.000000Z")`, and calls `submit_entry`. The parent runs it with `subprocess.run([sys.executable, __file__, ...])` and the child steps `[{"result": "ack", "order_id": "ORD1"}]`, asserts exit code 86, then reopens through `simulation(<reopen steps>, path=ledger_path)` (a new epoch, then `recover()`). The reopen steps are `[{"result": "ack", "order_id": "ORD1"}]` for `test_cp_l1` and `[]` for the others.

| Test | Fault point | Events after reopen | Command | Attempt | Reservation | Then |
|---|---|---|---|---|---|---|
| `test_cp_l1` | `CP-L1` | bootstrap + reopen | none | none | none | A same-key `submit_entry` with script `[ack ORD1]` admits once and acknowledges |
| `test_cp_l2` | `CP-L2` | bootstrap + `COMMAND_ADMITTED` + reopen | `ADMITTED` | none | `RESERVED` | The new broker has 0 calls (dispatch after restart arrives in SLICE-05) |
| `test_cp_l3a` | `CP-L3a` | … + `DISPATCH_CLAIMED` + reopen + `OUTCOME_AMBIGUOUS` | `UNCERTAIN` | `AMBIGUOUS` (`interrupted`) | `HELD` | The new broker has 0 calls |
| `test_cp_l3b` | `CP-L3b` | same as `CP-L3a` | `UNCERTAIN` | `AMBIGUOUS` (`interrupted`) | `HELD` | The new broker has 0 calls |
| `test_cp_l5` | `CP-L5` | … + `OUTCOME_ACKNOWLEDGED` + reopen | `WORKING` | `ACKNOWLEDGED` | `HELD` | A same-key `submit_entry` returns `canonical="unchanged"`, `effect="acknowledged"`, and the new broker has 0 calls |
| `test_commit_failure` | none, in-process: `simulation([ack ORD1], vfs=…, wrap=…)`, the wrapper arming `fault_vfs` right after `send` returns | bootstrap + `COMMAND_ADMITTED` + `DISPATCH_CLAIMED` + reopen + `OUTCOME_AMBIGUOUS` | `UNCERTAIN` | `AMBIGUOUS` (`interrupted`) | `HELD` | `submit_entry` returned `canonical="commit_failed"`, `effect="acknowledged"`, `sent=True`; the next `transact` returned `LED-R10`; then disarm, `writer.close()`, reopen |

`test_cp_l5` and `test_commit_failure` together prove PRF-LED-07's two branches: a commit that persisted is found by the same-key retry, and one that did not persist is recovered without a resend.

### Contracts

| Test | Setup and expected outcome | Proof |
|---|---|---|
| `test_capabilities.py::test_unsafe_sqlite_refused` | With `apsw.sqlite_lib_version` monkeypatched to return `"3.46.1"`, `LedgerWriter.open` on a path raises `UnsafeRuntime` and leaves the lock free; with `"3.50.7"`, open on the same path succeeds | PRF-LED-13 |
| `test_capabilities.py::test_settings_read_back` | On `writer.connection`, `PRAGMA journal_mode` is `wal` and `PRAGMA synchronous` is `2`; `RUNTIME_OPENED.payload.sqlite_version` equals `apsw.sqlite_lib_version()` | PRF-LED-13 |
| `test_capabilities.py::test_simulation_has_no_live_adapter` | With `socket.socket` monkeypatched to raise, a full `ack` entry runs; `"autonomous_trading.adapters.openalgo"` is not in `sys.modules`; `simulated_broker.py`'s source contains no `os.environ`, `getenv` or `openalgo` | PRF-XC-02 |
| `test_capabilities.py::test_script_mapping` | Each script result maps as in the row 11 table, and every result's `domain.value == "simulated"` | PRF-DSP-12 |

**Break checks.** Each test file's module docstring names the change that must make it fail; the slice is complete only after each was tried once by hand and reverted:

| File | Change that must fail it |
|---|---|
| `test_event_envelope.py` | Drop the append-only triggers, or call `json.dumps` without `sort_keys` |
| `test_command_identity.py` | Remove the digest comparison in the identity rule, or the guard in step 6 |
| `test_entry_outcomes.py` | Call `broker.send` before the claim `transact` |
| `test_crash_boundaries.py` | Make `recover()` resend a `CLAIMED` attempt |
| `test_capabilities.py` | Import a stub `autonomous_trading.adapters.openalgo` from `bootstrap.py` |
| `test_clock_contract.py`, `test_policy_parameters.py` | Judge `Deadline` on `now()`; give `capacity.synthetic_amount` a default |

## Build order and checkpoints

| Step | Rows | Tests that must pass before the next step |
|---|---|---|
| 1 | 1–13 (packaging, contracts, clocks, broker, resources) | `test_clock_contract.py` |
| 2 | 17–21 (runtime, envelope, schema, projections, store) | `test_event_envelope.py`; the store-level tests of `test_command_identity.py` |
| 3 | 22–27 (lifecycle, reservations, admission, ports, coordinator, bootstrap) and 14–16 | `test_entry_outcomes.py`, `test_policy_parameters.py`, all of `test_command_identity.py` |
| 4 | 28–37 (launcher, recovery and contract tests) | the full suite through `scripts/safe_tests.py` |

## Verification commands (planned, not executed)

Run from the target repository root. Installing needs network once; the tests need none.

```bash
python -m venv .venv-slice01
```

```bash
.venv-slice01/bin/python -m pip install -e ".[test]"
```

```bash
.venv-slice01/bin/python scripts/safe_tests.py tests/unit tests/integration tests/recovery tests/contracts -q
```

On Windows use `.venv-slice01\Scripts\python.exe` in place of `.venv-slice01/bin/python`.

## Completion conditions

1. Every test above passes in a clean virtual environment, with no broker variables set.
2. `git show --name-only --format= HEAD` of the slice commit lists exactly the 37 paths above, and `git status --porcelain` is then empty (the `.gitignore` excludes the venv, egg-info, caches and ledgers).
3. No tracked file lies outside master README §6 and the tree deltas named in the files table.
4. Each break check was tried and reverted.

## Migration and rollback

* **Legacy data migration:** none. No legacy store is opened (REQ-MIG-003). The schema migration `001` is row 14.
* **Rollback:** delete the target repository's `slice-01` branch. No production state exists.

## Prerequisites

None. This slice depends on no open owner question.
