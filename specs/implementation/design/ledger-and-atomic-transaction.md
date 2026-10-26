# Ledger and the atomic financial transaction

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/ledger-and-atomic-transaction/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `kernel/ledger/runtime.py`, `store.py` | [Writer, runtime and readers](#writer-runtime-and-readers), [The atomic transaction](#the-atomic-transaction) |
  | `kernel/ledger/schema.py`, `resources/migrations/*` | [Schema and migrations](#schema-and-migrations) |
  | `kernel/ledger/envelope.py` | [Event envelope](#event-envelope-reuse-with-two-added-fields) |
  | `kernel/ledger/projections.py` (the fold, repair and D04 comparison) | [One fold, three uses](#one-fold-three-uses) |
  | `kernel/ledger/export.py` | [Evidence references](#evidence-references-req-led-014) (export itself is written with SLICE-02) |
  | `kernel/reservations.py` | [Reservations](#reservations-kernelreservationspy) |
  | `kernel/lifecycle.py` (command and attempt part) | [Command and attempt state machine](#command-and-attempt-state-machine) |
  | `contracts/execution.py` | [Execution contract types](#execution-contract-types-contractsexecutionpy) |

* **Deciders (they decide; the writer commits their decisions):** listed per event in the [event catalogue](#event-catalogue).
* **Consumes:** `contracts/identity.py`, `contracts/clock.py` ([sessions spec](sessions-authority-lifecycle.md)).
* **Master anchors:** [Financial authority and executable contracts](../../../README.md#financial-authority-and-executable-contracts) (`README.md:722-776`), [Ledger, SQLite and recovery](../../../README.md#ledger-sqlite-and-recovery) (`README.md:778-796`), plus the decisions cited per key below.
* **Terms:** the package glossary ([README](../README.md#terms-used-across-the-specs)) defines composition, refusing parameter, bundle, writer thread and index tables. **Characterized** means "measured from legacy code and confirmed before use". LD-nn rows are in [legacy-divergence](../legacy-divergence.md). Legacy paths are at `OA@445eb116`.

## Overview

The target system has one canonical financial history: an append-only, hash-chained SQLite event ledger with one writer. These facts are committed in it:

* admission;
* monetary reservation;
* command identity;
* dispatch attempts;
* classified outcomes;
* lifecycle transitions;
* obligation accounting.

All of them are committed **together whenever they belong to the same transition**. This spec is the one place that defines that atomic transaction. Every other spec hands its decision to this transaction and never commits on its own.

Two kinds of derived data are kept apart:

* **Index tables** live inside the ledger database. They are written in the same transaction as their events, so a commit cannot leave them stale. An external edit can; the D04 comparison detects it.
* **Compatibility projections** live outside the database, for example generated JSONL for legacy readers. They are refreshed after a commit and can lag. None exists before SLICE-13.

## The problem

The legacy system splits one financial lifecycle across a JSONL registry and a SQLite ledger with no shared transaction (`README.md:13`). That split produces the defects the master records:

* an ACK reported as success after local persistence failed (LD-09);
* cancel and modify intents that never settle (LD-10);
* indexes that can disagree with the chain while the chain stays valid (LD-11);
* a retry that receives a new identity (LD-01).

The master's answer is one canonical admission and outcome commit: D02, D01/D03, D04, D13–D16 and AUD-02.

## Goals

1. Exactly one durable financial history per composition: production, or each separate simulation run (`README.md:567`).
2. Admission, reservation and command identity commit atomically (D02).
3. Every authoritative outcome transition commits its lifecycle and accounting changes atomically, whatever triggered it (AUD-02).
4. Caller-visible outcomes are truthful: broker effect, canonical persistence and compatibility-projection freshness are separate facts (D01).
5. Retries keep one logical identity across process, release and epoch changes (D14).
6. A disagreement between index tables and event-derived state is detected before financial authority proceeds (D04).
7. Legacy money semantics are kept during extraction unless a recorded decision changes them (`README.md:780`).

## Non-goals

* Choosing a valuation, cost, capacity or rounding formula (`README.md:764`, `:780`); these are refusing parameters (REQ-XC-003).
* Choosing upgrade versus import for legacy history (AUD-05, TASK-S13-01, [X-002](../consistency/master-contradictions.md#x-002)).
* Remote exactly-once delivery (`README.md:760`).
* A second journal, a JSONL authority or a distributed writer (`README.md:764`, `:945`).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-LED-001 | Append-only, hash-chained events; the database refuses UPDATE and DELETE | `README.md:780`, `:784`; §7 (`:1143`) | PRF-LED-01, PRF-LED-02 |
| REQ-LED-002 | Normalized envelope bytes and chain digest; head digests anchored off the file | Event envelopes (`README.md:784`) | PRF-LED-01, PRF-LED-15 |
| REQ-LED-003 | One writer per ledger file; independent bounded readers | `README.md:780`; A03-F4 (`:920`); A04-F2 (`:794`) | PRF-LED-14 |
| REQ-LED-004 | Caller-supplied logical command key; same key and content returns the existing state; same key and changed content is refused; a missing key is refused | D14 (`README.md:760`); Command row (`:737`); LD-01, LD-17 | PRF-LED-03 |
| REQ-LED-005 | Admission, monetary reservation, command identity and index-table changes commit in one transaction | D02 (`README.md:746`) | PRF-LED-04 |
| REQ-LED-006 | The outcome separates effect class, canonical persistence and compatibility-projection freshness; a projection failure after a canonical ACK never authorizes resend | D01/D03 (`README.md:750`); Outcome row (`:739`) | PRF-LED-07; PRF-LED-06 from SLICE-13 |
| REQ-LED-007 | One command lifecycle with verb-specific completion for entry, cancel, modify and close | D01/D03 (`README.md:750`); AUD-01 (`:754`) | PRF-LED-16 |
| REQ-LED-008 | Versioned schema, forward-only numbered migrations, unknown versions refused | A02-F4 (`README.md:907`); LD-07; [X-002](../consistency/master-contradictions.md#x-002) | PRF-LED-10 |
| REQ-LED-009 | Index tables are compared with event-derived state at writer open, after recovery and after detected external change; a mismatch refuses financial authority | D04 (`README.md:780`) | PRF-LED-08 |
| REQ-LED-010 | Every authoritative transition commits outcome, lifecycle and accounting together; a commit failure reports what is known about persistence | AUD-02 / D16 (`README.md:764`) | PRF-LED-04, PRF-LED-07 |
| REQ-LED-011 | Obligations reconcile at every committed head; no double-counted fills; release only demonstrated unused obligations | D16 (`README.md:764`) | PRF-LED-09, PRF-LED-11 |
| REQ-LED-012 | No database transaction or writer lock spans a broker call | `README.md:746`, `:758` | PRF-DSP-02 ([dispatch](dispatch-and-coordination.md#proofs)) |
| REQ-LED-013 | Money and quantity units are explicit; amounts are exact decimals; rounding follows a bound rule; no silent numeric change from legacy | `README.md:780` | PRF-LED-11, PRF-LED-12 |
| REQ-LED-014 | Committed evidence export carries its outcome class; external evidence references commit only after durable publication | Combined-F2 (`README.md:790`); `README.md:567` | PRF-DOM-05 ([execution-domain](execution-domain-and-observations.md#proofs)), PRF-LED-12 |
| REQ-LED-015 | Identity survives release, process and epoch rotation; command, attempt, broker order and position identities stay distinct | `README.md:776`, `:737` | PRF-LED-05, PRF-LED-12 |
| REQ-LED-016 | One ledger file per composition; no composition writes another's ledger | Goal 1; `README.md:567` | PRF-XC-02 |

## Critical user journeys

### CUJ-LED-1: ACK committed; the compatibility projection fails to refresh (from SLICE-13)

* **Given** an entry whose `OUTCOME_ACKNOWLEDGED` is committed.
* **When** writing the JSONL compatibility projection fails.
* **Then** the outcome returned is `effect=acknowledged`, `canonical=committed`, `compat_projection=repair_scheduled`, `sent=True`, with the broker order ID; nothing is resent (PRF-LED-06).

### CUJ-LED-2: Response lost after a possible send

* **Given** a dispatch claim is committed for attempt 1.
* **When** the process dies before any outcome is committed, and no adapter result was published.
* **Then** on restart attempt 1 is `AMBIGUOUS` (reason `interrupted`); the reservation is kept; the command waits for reconciliation; a caller retry returns the `UNCERTAIN` state and does not send (PRF-LED-05).

### CUJ-LED-3: Retry with changed content

* **Given** command key `K` was admitted with request digest `d1`.
* **When** a caller submits `K` with digest `d2`.
* **Then** the writer returns `LED-R02 idempotency_conflict` and the ledger is unchanged (PRF-LED-03). See [refusal recording](#refusals-and-their-recording).

## Technical plan

### Writer, runtime and readers

* **Binding and safe library.** The ledger opens SQLite through APSW, reusing the legacy runtime rule (`OA/src/tier1/runtime.py:1-80`). A writer refuses a loaded SQLite below 3.51.3 unless it is an official backport (3.44.6, 3.50.7), because of the WAL-reset defect (`README.md:782`). A writer connection sets `journal_mode=WAL` and `synchronous=FULL` and reads both back; a reader connection only verifies `journal_mode=WAL`. A mismatch refuses the open.
* **One writer.** A writer process takes an exclusive file lock on `<ledger path>.writer.lock` when it opens and holds it until it exits. If the lock is held, the open returns `LED-R07`. The lock is advisory: it excludes other processes of this system, not arbitrary SQLite clients (see [Risks and limits](#risks-and-limits)).
* **The writer thread.** Inside the process, one writer thread runs every `transact` call. Code already running on that thread (the coordinator loop, admission stage B, recovery) calls `transact` directly; other threads hand it a decision and wait for the result. This is the single writer thread of the [dispatch spec](dispatch-and-coordination.md#coordinator-loop-on-the-writer-thread-one-io-worker-per-account).
* **Writer epoch.** The writer is opened with a new `EpochId`. Until that epoch is active, the only write it accepts is `activate_epoch()`, which `kernel.recovery` calls at the `INSPECTING → RECOVERY_WRITING` transition ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)). `activate_epoch()` appends `EPOCH_ACTIVATED`, retires the previously active epoch and activates this one, in one transaction. It then records `RUNTIME_OPENED` with the loaded library's identity.
* **Readers.** Readers open read-only connections. Each read runs in its own short read transaction that is closed before the call returns, so no reader holds a snapshot open between calls ("bounded readers", A03-F4).
* **External change.** Before each `transact`, the writer reads `PRAGMA data_version`. A change since its last commit means another connection wrote the file. The kernel then exits and restarts through recovery, which runs the D04 comparison. A running kernel never re-enters recovery in place.

### Schema and migrations

* **`ledger_meta`** holds `schema_revision` and `migration_revision`. It is an index table folded from `MIGRATION_APPLIED` events, so the chain shows every schema change and D04 checks the table.
* **Migrations** are files `resources/migrations/NNN_<name>.sql` shipped inside the bundle. Pending ones are applied in `NNN` order during `RECOVERY_WRITING`, after epoch activation and before the D04 comparison, each in its own transaction with its `MIGRATION_APPLIED` event. They only move forward. The recovery order is in the [sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy).
* **An empty file** is the one exception: there is no history to protect, so the writer applies `001` when it opens an empty file, and records `MIGRATION_APPLIED` for it right after the first `EPOCH_ACTIVATED`.
* **`schema.check`** runs at every writer and reader open. It refuses with `LED-R04` when `migration_revision` is higher than the highest migration the bundle ships, or when `schema_revision` is unknown to this bundle after pending migrations would be applied.
* **Tables.** This spec fixes each table's columns and meaning. The exact DDL is written in the slice file that adds the table ([SLICE-01 row 13](../plan/slices/SLICE-01-disarmed-financial-core.md) for the SLICE-01 tables), following the delivery plan's depth rule.

| Table | Columns and meaning | Written by events | Added in |
|---|---|---|---|
| `ledger_meta` | `key`, `value` (above) | `MIGRATION_APPLIED` | SLICE-01 |
| `ledger_event` | One row per event: the envelope fields below, plus `event_hash`; append-only triggers refuse UPDATE and DELETE | every event | SLICE-01 |
| `authority_epoch` | `epoch_id`, `principal`, `state` (`active`/`retired`), `activated_sequence`; a partial unique index allows one active row (legacy `OA/src/tier1/schema.py:48-57`) | `EPOCH_ACTIVATED` | SLICE-01 |
| `command_identity` | `command_key` (PK), `verb`, `target` (broker order ID or position ID; null for entries), `strategy`, `request_digest`, `plan_digest` (entries), `principal`, `account`, `first_sequence`, `state`, `updated_sequence` | `COMMAND_ADMITTED` and every command transition | SLICE-01 |
| `command_attempt` | `attempt_id` (= `"<command_key>#<attempt_no>"`), `command_key`, `attempt_no`, `epoch_id`, `claimed_at`, `domain`, `contract_version`, `state`, `legs` (per-leg state), `unassigned_order_ids`, `retry_requested_sequence`, `claimed_sequence`, `outcome_sequence`; a partial unique index allows one unresolved attempt per command ([I-2](#invariants)) | `DISPATCH_CLAIMED`, `OUTCOME_*`, `RESOLVED_*`, `DISPATCH_RETRY_REQUESTED` | SLICE-01 |
| `reservation` | `reservation_id`, `command_key` (unique; entries only), `account`, `amount`, `margin`, `worst_case_loss`, `currency`, `state`, `updated_sequence` | `COMMAND_ADMITTED`, `DISPATCH_CLAIMED`, and any event carrying `reservation_after` | SLICE-01 |
| `broker_identity` | `kind` (`order_id`, `fill_id`), `value`, `domain`, `command_key`, `first_sequence`, and for fills `quantity`, `price`; PK (`kind`, `value`, `domain`) | `OUTCOME_ACKNOWLEDGED`, `RESOLVED_REACHED` (order IDs); `FILL` (fill IDs) | SLICE-01 |
| `release_binding` | `binding_id`, `epoch_id`, `receipt`, `receipt_digest`, `bound_sequence`; keeps the legacy check (`README.md:780`; `OA/src/tier1/schema.py:96-101`, `OA/src/tier1/gateway_route.py:360`) | `RELEASE_BOUND` | SLICE-03 |
| `session`, `grant` | [Sessions spec](sessions-authority-lifecycle.md) | session, binding and grant events | SLICE-03 |
| `protection_state` | [Protection spec](protection-and-safety.md) | protection events | SLICE-06 |
| `observed_order`, `foreign_order` | Latest observed state and `as_of` per broker order ID; foreign orders for capacity ([execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)) | Reconciliation findings | SLICE-07 |
| `import_manifest` | Legacy import accounting, defined with the AUD-05 method | import events | SLICE-13 |

`schema_revision 1` and its migration `001_initial.sql` are **provisional** until the AUD-05 comparison (TASK-S13-01, [X-002](../consistency/master-contradictions.md#x-002)). Before then only disarmed simulation and test ledgers use them.

`command_key` replaces the legacy `idempotency_key`. The legacy key embeds the action and a minted execution ID (`f"{action}:{execution_id}"`, `OA/src/tier1/gateway_route.py:652`). The target key is the caller's logical command key (D14). The importer maps one to the other (REQ-MIG-004). Columns whose meaning is unchanged keep their legacy names.

### Event envelope (reuse with two added fields)

Reuse the legacy rule (`OA/src/tier1/envelope.py:42-48`, `:84-115`):

* `normalized(value)` is JSON with sorted keys, separators `,` and `:` with no spaces, `ensure_ascii=False`, UTF-8 bytes, and no NaN or infinity;
* `event_hash` is the lowercase hex SHA-256 of `normalized(envelope)`, where the envelope is every `ledger_event` column except `event_hash` itself;
* the first event's `prev_hash` is 64 zeros.

Two fields are added, and both are inside the hashed envelope:

* `execution_domain`: `none`, `simulated`, `analyzer`, `live`, `unknown` or `conflicting`. ATA-06 needs explicit unknown and conflicting attribution (`README.md:458`), and the legacy provenance CHECK cannot express them (LD-06). Events with no external effect carry `none`.
* `clock_domain`: `wall`, `exchange` or `recorded`, the domain of `event_time` ([sessions spec clock contract](sessions-authority-lifecycle.md#clock-contract-contractsclockpy-adaptersclockspy)).

`provenance` keeps its legacy meaning as a separate axis.

**Head anchoring** (`README.md:784`). A valid chain cannot show that its tail was not truncated or that an older file was restored. When `kernel.recovery` supplies an anchored head (`sequence`, `event_hash`), the writer refuses with `LED-R11 head_behind_anchor` if the file does not contain that sequence with that hash. Where anchors come from, and when they are written, belongs to the [migration spec](migration-recovery-rollback-continuity.md) with the A04-F5 recovery set.

### Event catalogue

The writer validates each payload against `resources/events.schema.json`, which each slice extends for the events it adds. Money fields are normalized decimal strings.

| Kind | Decided by | Payload fields | Index effect |
|---|---|---|---|
| `EPOCH_ACTIVATED` | `kernel.recovery` | `epoch_id`, `principal`, `retired_epoch_id` | `authority_epoch` |
| `RUNTIME_OPENED` | `kernel.recovery` | binding, binding version, SQLite version | none |
| `MIGRATION_APPLIED` | `kernel.recovery` | `migration_number`, `name`, `file_digest` | `ledger_meta` |
| `RELEASE_BOUND` | `kernel.authority` | `binding_id`, `receipt`, `receipt_digest` | `release_binding` |
| `COMMAND_ADMITTED` | `kernel.admission` | `verb`, `target`, `strategy`, `request` (normalized), `request_digest`, `plan_ref` and `plan_digest` (entries), `account`, `application`, `dependencies`, `resulting_exposure`, reservation amounts (entries) | identity row; reservation `RESERVED` |
| `ADMISSION_REFUSED` | `kernel.admission` | `verb`, `request_digest`, `code`, `message`, `inputs` | none |
| `PAUSE_STARTED`, `PAUSE_CLEARED` | `kernel.policy`; committed by admission (start) or on an owner command (clear) | [intent spec](intent-to-admission.md#review-application-kernelpolicypy) | none |
| `DISPATCH_REFUSED` | `kernel.coordinator` | `code`, `dependency` | command `REFUSED`; reservation `RELEASED` |
| `DISPATCH_RETRY_REQUESTED` | `kernel.coordinator`, on a request from a principal holding the command's verb | `attempt_no` (the `NOT_SENT` one), `principal` | attempt `retry_requested_sequence` |
| `DISPATCH_CLAIMED` | `kernel.coordinator` | `attempt_no`, `epoch_id` | attempt `CLAIMED`; command `IN_FLIGHT`; reservation `HELD` |
| `OUTCOME_NOT_SENT` / `_REJECTED` / `_ACKNOWLEDGED` / `_AMBIGUOUS` | `kernel.coordinator`; `kernel.recovery` for outcomes rebuilt from published evidence and for `_AMBIGUOUS` | `attempt_no`, `epoch_id`, `legs`, `unassigned_order_ids`, `reason` (for `_AMBIGUOUS`: `timeout`, `adapter_error`, `interrupted`, `outcome_refused`, `evidence_unusable`, `evidence_unpublished`), `raw_digest`, `reservation_after` when legs were rejected | per the state table; `broker_identity` order IDs |
| `RESOLVED_REACHED`, `RESOLVED_NEVER_REACHED` | `kernel.lifecycle` from reconciliation | `attempt_no`, `legs` (per-leg resolution), `observation_digest`, `broker_order_ids`, `reservation_after` | per the state table |
| `FILL` | `kernel.lifecycle` from reconciliation | `fill_id`, `broker_order_id`, `quantity`, `price`, `observation_digest`, `reservation_after` | `broker_identity` (`fill_id`); reservation reduced |
| `RESIDUAL_RECORDED` | `kernel.lifecycle` | `legs` that reached the broker while others did not | none (read by reconciliation and protection) |
| `COMPLETED` | `kernel.lifecycle` from reconciliation | `observation_digest`, `filled_quantity`, `confirmed_level` (modify and resting close) | command `COMPLETED`; reservation per the state table |
| `CONFLICT_RECORDED`, `FOREIGN_RECORDED`, `RECONCILIATION_ESCALATED` | `kernel.lifecycle` from reconciliation; `kernel.protection` also escalates missing protection under kill | [execution-domain spec](execution-domain-and-observations.md#reconciliation-kernelreconciliationpy) | none (foreign orders are read by capacity's external commitments) |
| `INDEX_REPAIRED` | `kernel.recovery` | `tables`, `before_digest`, `after_digest` | rebuilt rows |
| Session, binding, grant and recovery-stage events | `kernel.lifecycle`, `kernel.authority`, `kernel.recovery` | [sessions spec](sessions-authority-lifecycle.md#bindings-and-sessions-kernellifecyclepy-session-part) | `session`, `grant` |
| Protection, kill, hold and latch events | `kernel.protection`, `kernel.safety` | [protection spec](protection-and-safety.md) | `protection_state` |

Every event that changes a reservation carries `reservation_after`: the post-change `amount`, `margin` and `worst_case_loss`, exactly as `kernel.reservations` decided them. The fold copies them; it never computes or rounds money.

### Request digest and the identity rule

* **`request_digest`** is `digest({"verb": <verb>, **<all fields of the request>})` with the envelope's normalization. It covers `command_key` and `principal`. Identity types are written as arrays (`AccountId` as `[broker, account]`).
* The **identity rule** applies to `COMMAND_ADMITTED` and `ADMISSION_REFUSED`:
  * no row for the key: continue;
  * a row with the same digest: append nothing and return `Existing(row)`; the caller builds its `Outcome` from the row and the latest attempt;
  * a row with a different digest: return `LED-R02`.
* `ADMISSION_REFUSED` creates no row, so a later request with the same key is evaluated afresh. A missing key is `LED-R01` and is never recorded.

Because the rule also applies to `ADMISSION_REFUSED`, two concurrent requests with the same key and content cannot end with one admitted and one recorded as refused: the second gets `Existing`.

### The atomic transaction

```text
Decision(kind, command_key | None, events: list[EventDraft], guard: StateGuard | None)
EventDraft(kind, payload, causation_id | None, correlation_id | None, evidence: list[EvidenceRef])
StateGuard(command_state_in: set[str], attempt_no: int | None, attempt_epoch: "active" | "retired" | None)
transact(decision) -> Committed(sequences: list[int]) | Existing(row) | Refusal
```

Steps 1–3 run before `BEGIN IMMEDIATE`; steps 4–8 inside it. The first failure returns its refusal, rolls back, and writes nothing.

1. The writer has not failed (`LED-R10 writer_failed`).
2. No unresolved D04 mismatch (`LED-R05`), unless the decision is `INDEX_REPAIRED` or a recovery-stage record that does not advance to `OPERATING`. Recovery repairs before any other write, so no other decision is ever judged against wrong index rows.
3. The writer epoch is the active epoch (`LED-R03`).
4. Every payload matches `events.schema.json`, is finite JSON, has normalized decimal money fields, and every `EvidenceRef` resolves to a published object (`LED-R06`).
5. Identity rule (`LED-R01`, `LED-R02`, or `Existing`).
6. The guard (`LED-R09 transition_not_allowed`): the command's state is in `command_state_in` (the "From" column of the [state table](#command-and-attempt-state-machine)), the attempt number matches, and the attempt's epoch is the active one for the coordinator's outcomes, or a retired one for recovery's outcomes (rebuilt from evidence, or `_AMBIGUOUS`).
7. Load the **touched rows** (the rows whose keys appear in the events: the command key, its attempts and reservation, any broker IDs), compute `rows = fold(touched rows, new events)`, then check I-3 and I-4 (`LED-R08`).
8. Commit.

**Commit failure.** If SQLite raises at step 8, whether the commit persisted is unknown to the caller. `transact` raises `CommitFailed`, the writer marks itself failed (every later call returns `LED-R10`), and the kernel exits; the supervisor restarts it through recovery (A09-F3, `README.md:933`). After restart the identity rule makes a same-key retry safe either way.

The broker call happens **between** two transactions, never inside one (REQ-LED-012).

### One fold, three uses

```text
fold(rows_before: IndexRows, events: list[StoredEvent]) -> IndexRows
IndexRows:   table name -> {primary key -> row}
StoredEvent: an envelope with its sequence and event_hash
```

One pure function folds events into index-table rows. It is used in three places:

1. **In-transaction apply.** Step 7 above.
2. **Repair.** During `RECOVERY_WRITING`, `kernel.recovery` rebuilds the index tables from `fold(empty, all events)` and appends `INDEX_REPAIRED`. That clears `LED-R05`.
3. **D04 comparison.** Every start runs it in `RECOVERY_WRITING`, after pending migrations, so it covers startup, recovery and a detected external change (which forces a restart). The writer compares each table `fold` produces (all except `ledger_event`) with `fold(empty, all events)`. Any difference gives `LED-R05`. While `LED-R05` stands, only the decisions listed in step 2 are accepted.

The legacy `reservations._fold_events` (`OA/src/core/framework/execution/reservations.py:160-224`) has this shape for reservations and is the reuse candidate for the reservation part of `fold`.

### Money and quantity representation

* `amount`, `margin` and `worst_case_loss` are **exact decimals**, stored as normalized decimal strings: an optional `-`, digits, `.`, and exactly two fractional digits for INR (`"1500.00"`); no exponent. Arithmetic uses Python `Decimal`.
* The ledger performs **no rounding**. It refuses a value that is not normalized (`LED-R06`).
* `kernel.reservations` produces normalized values. Where a computation yields more digits, it applies the bound `money.rounding` rule, a refusing parameter. Its value is characterized against legacy behaviour in TASK-S04-03.
* **Meanings** (legacy `ReservationRequest`, `reservations.py:26-40`): `amount` is the capital the entry commits; `margin` is the broker margin it needs; `worst_case_loss` is the largest loss the plan permits. The three stay separate fields even where they are equal.
* Quantities are integers in contract units (lots × lot size), as in legacy plans.

### Reservations (`kernel/reservations.py`)

Reservations exist for entries only. Their states are the legacy ones:

| State | Meaning |
|---|---|
| `RESERVED` | Admitted; nothing sent |
| `HELD` | A send was attempted |
| `RELEASED` | Terminal |

A reduction lowers the amounts and keeps the state. Every change is decided here and carried in the event as `reservation_after`:

* **On a fill** (legacy `reduce()`, `reservations.py:644`; event checks at `:130-133`): the fill's amount (quantity × price) is removed from `amount`. For a **single-leg** entry, `margin` and `worst_case_loss` scale by `ratio = (amount − r) / amount` (legacy `:205-216`), with `money.rounding` applied. The filled part becomes position exposure, which capacity counts through broker observations; removing it here avoids counting it twice (D16).
* **On rejected or never-reached legs** of a multi-leg entry (carried by the outcome or the resolution that found them, never a separate event): `amount` drops by those legs' planned amounts; `margin` and `worst_case_loss` stay at the plan's values until the structure completes or closes, because a spread with a missing hedge can need more margin, not less (`README.md:776`). The reached legs are recorded with `RESIDUAL_RECORDED`.
* **On completion or dispatch refusal:** `RELEASED` (the demonstrated unused part).

I-6 below states the head rule these changes keep.

### Command and attempt state machine

Command states:

| State | Meaning |
|---|---|
| `ADMITTED` | Admitted; no attempt, or the latest attempt is `NOT_SENT` |
| `REFUSED` | Refused at dispatch; nothing was sent (final) |
| `IN_FLIGHT` | An attempt is claimed and its outcome not yet committed |
| `REJECTED` | The broker rejected every leg (final; a new try is a new command key) |
| `WORKING` | At least one leg reached the broker; completion not yet observed |
| `UNCERTAIN` | The latest attempt is ambiguous |
| `COMPLETED` | The verb's completion rule was observed (final) |

Attempt states: `CLAIMED`, `NOT_SENT`, `REJECTED`, `ACKNOWLEDGED`, `AMBIGUOUS`. An attempt is **unresolved** while `CLAIMED` or `AMBIGUOUS`. Each leg of a multi-leg attempt carries its own state in `legs`.

| From | Event | To | Attempt | Reservation (entries) |
|---|---|---|---|---|
| — | `COMMAND_ADMITTED` | `ADMITTED` | — | `RESERVED` |
| — | `ADMISSION_REFUSED` | none (no row) | — | none |
| `ADMITTED` | `DISPATCH_REFUSED` | `REFUSED` | — | `RELEASED` |
| `ADMITTED` | `DISPATCH_CLAIMED` (attempt *n*) | `IN_FLIGHT` | *n* `CLAIMED` | `HELD` |
| `IN_FLIGHT` | `OUTCOME_NOT_SENT` | `ADMITTED` (a new claim needs `DISPATCH_RETRY_REQUESTED`) | `NOT_SENT` | `HELD` |
| `IN_FLIGHT` | `OUTCOME_REJECTED` | `REJECTED` | `REJECTED` | `RELEASED` |
| `IN_FLIGHT` | `OUTCOME_ACKNOWLEDGED` | `WORKING` | `ACKNOWLEDGED` | `HELD`, reduced by any rejected legs |
| `IN_FLIGHT` | `OUTCOME_AMBIGUOUS` | `UNCERTAIN` | `AMBIGUOUS` | `HELD` |
| `UNCERTAIN` | `RESOLVED_REACHED` (some or all legs) | `WORKING` | `ACKNOWLEDGED` | `HELD`, reduced by never-reached legs |
| `UNCERTAIN` | `RESOLVED_NEVER_REACHED` (every leg) | `ADMITTED` | `NOT_SENT` | `HELD` |
| `WORKING` | `FILL` | `WORKING` | — | reduced |
| `WORKING` | `COMPLETED` | `COMPLETED` | — | `RELEASED` |
| `COMPLETED` | late fill or correction | `COMPLETED` | — | unchanged; `RECONCILIATION_ESCALATED` instead |

* Reductions ride on `OUTCOME_*`, `RESOLVED_*` and `FILL` as `reservation_after`; there is no separate reduction event, so nothing is reduced twice.
* A fill seen for an `UNCERTAIN` command proves the order reached the broker: lifecycle commits `RESOLVED_REACHED` and `FILL` in one decision.
* A multi-leg attempt with some legs reached and others never reached is resolved per leg; the command goes to `WORKING` and is **never** resent, because resending would duplicate the reached legs.
* If the broker rejects an entry after an ACK, reconciliation observes the order as terminal. The command ends `COMPLETED` and its reservation is released. `REJECTED` comes only from a transport outcome.
* The adapter raises `NotSent` internally (legacy `OA/src/tier1/coordinator.py:43`) and returns `TransportResult(cls="not_sent")`. The coordinator only sees the result.

**Verb-specific completion** (D03; AUD-01):

| Verb | Completes when | Never completes on |
|---|---|---|
| entry | The broker order is observed terminal (filled, cancelled, rejected or expired), with fills accounted | Transport ACK alone |
| cancel | The target order is observed terminal | Cancel ACK (`README.md:750`) |
| modify | The observed order shows the requested parameters, or the broker's level for a proven timed-out modify (POL-014) | Modify ACK (`README.md:750`) |
| close (market or limit, not resting) | The close's own order is observed filled, its fills recorded by fill ID; position quantities only corroborate | Close ACK; cancel completion; a netted position change alone |
| close (resting stop or limit protective order) | The order is observed resting at the requested parameters; its later fill or cancel is recorded by `FILL` and order observations | Close ACK alone |

#### Invariants

* **I-1:** one identity row per command key. Enforced by the primary key.
* **I-2:** at most one unresolved attempt per command. Enforced by the partial unique index.
* **I-3:** a reservation changes state only along `RESERVED → HELD → RELEASED` or `RESERVED → RELEASED`, on the events in the state table. The writer compares each touched reservation's old and new state with this list.
* **I-4:** a fill ID counts once. A `FILL` whose `fill_id` exists with the same `broker_order_id`, `quantity` and `price` is a no-op: that event is dropped from the decision and the rest proceeds. Different values give `LED-R08`.
* **I-5:** index tables equal `fold(empty, all events)`. Checked at the D04 points; it holds by construction otherwise.
* **I-6:** for every entry reservation, at every committed head: admitted `amount` = current `amount` + Σ fill amounts + Σ leg reductions + (released remainder, if `RELEASED`). This is D16's "reconcile at every committed head".

### Execution contract types (`contracts/execution.py`)

```text
EntryRequest(command_key, principal, account, session_id, intent_ref, review_ref | None)
CancelRequest(command_key, principal, account, broker_order_id)
ModifyRequest(command_key, principal, account, broker_order_id, changes: ModifyChanges)
CloseRequest(command_key, principal, account, position_id, quantity,
             order: market | limit(price) | stop(trigger, limit | None))
ModifyChanges(trigger_price | None, limit_price | None, quantity | None)
PlanRef(plan_digest, account, legs: list[PlanLeg], amount, margin, worst_case_loss, currency)
CommandStatus(command_key, state, verb, attempt_no | None, effect | None,
              broker_order_ids, refusal: Refusal | None)                 # read by command_status
TransportResult(cls: not_sent | rejected | acknowledged | ambiguous, legs: list[LegResult],
                domain: DomainEvidence, raw: EvidenceRef)                   # produced by an adapter
LegResult(leg_role, cls: not_sent | rejected | acknowledged | ambiguous,
          broker_order_id | None, reason)                                   # one per plan leg
Outcome(command_key, attempt_no | None, effect: not_sent | rejected | acknowledged | ambiguous | refused,
        canonical: committed | unchanged | commit_failed,
        compat_projection: none | fresh | repair_scheduled,
        broker_order_ids: dict[leg_role, str], domain: DomainEvidence | None, sent: bool,
        refusal: Refusal | None)
Refusal(code, message, command_key, decision)
```

| Field | Type and meaning |
|---|---|
| `command_key` | `CommandKey` ([identity contract](sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)) |
| `principal`, `account`, `session_id` | `Principal`, `AccountId`, `FinancialSessionId` (identity contract) |
| `intent_ref` | The intent's digest ([intent spec](intent-to-admission.md#contracts-contractsdecisionspy)) |
| `review_ref` | A `Review.review_id`: a pointer to review evidence, which `kernel.policy` reads. It is not a review result or an approval |
| `broker_order_id`, `position_id` | Strings from `broker_identity` and the position index |
| `PlanLeg` | Defined in the [intent spec](intent-to-admission.md#contracts-contractsdecisionspy); `PlanRef` is the subset the coordinator and adapter need |
| money fields, `price`, `trigger` | Normalized decimal strings |
| `DomainEvidence`, `EvidenceRef` | [Execution-domain spec](execution-domain-and-observations.md#evidence-contract-contractsevidencepy) |
| `Refusal.decision` | The decision kind that was refused, for example `COMMAND_ADMITTED` |

A request never carries a review result or a plan. `kernel.policy` and `kernel.planner` produce those in-process.

**Building an `Outcome`:**

| Situation | `effect` | `canonical` | `sent` | Resend? |
|---|---|---|---|---|
| Refused and recorded (admission or dispatch) | `refused` | `committed` | `False` | No |
| Refused and not recorded (`LED-R01`, `LED-R02`, `ADM-R12`) | `refused` | `unchanged` | `False` | No |
| Admission commit failed (persistence unknown) | `refused` | `commit_failed` | `False` | No; after restart the caller retries with the **same** key, which returns `Existing` if the commit persisted, and never resubmits under a new key |
| Adapter returned `not_sent`; outcome committed | `not_sent` | `committed` | `False` | Only through the normal loop after fresh revalidation |
| Adapter returned another class; outcome committed | that class | `committed` | `True` | No |
| Adapter returned a result; outcome commit failed | the adapter's class, with its broker IDs | `commit_failed` | `True` unless the class is `not_sent` | No; recovery rebuilds the outcome from published evidence |
| Same key and content as an existing command | from the row and its latest attempt | `unchanged` | from the latest attempt | No |

`compat_projection` is `none` until a compatibility projection exists (SLICE-13).

### Evidence references (REQ-LED-014)

The ledger enforces two rules about external evidence (Combined-F2, `README.md:790`):

* the evidence owner publishes durably before any decision refers to it; the writer refuses, in step 4, a reference that does not resolve (`LED-R06`);
* the adapter's published result for an attempt can be found by its `attempt_id`, so recovery can rebuild a lost outcome ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)).

Who publishes what, and how the store keeps referenced content, belong to the evidence owners: the adapters for transport results and observations ([execution-domain spec](execution-domain-and-observations.md#evidence-contract-contractsevidencepy)), with storage classes from the [runtime spec](runtime-isolation-observability-deployment.md). Export of committed evidence (`kernel/ledger/export.py`) is written with SLICE-02.

### Refusals and their recording

| Code | Meaning |
|---|---|
| `LED-R01 missing_command_key` | No caller-supplied logical key |
| `LED-R02 idempotency_conflict` | Same key, different request digest |
| `LED-R03 epoch_not_active` | The writer epoch is not the active epoch |
| `LED-R04 schema_unknown` | Stored schema or migration revision unknown to this bundle |
| `LED-R05 derived_state_mismatch` | Index tables differ from event-derived state (D04) |
| `LED-R06 invalid_payload` | Schema mismatch, non-finite JSON, non-normalized money, or an unresolved evidence reference |
| `LED-R07 writer_lock_held` | Another process holds the writer lock; no other code signals a lost lock |
| `LED-R08 invariant_violation` | I-3 or I-4 would fail |
| `LED-R09 transition_not_allowed` | The command or attempt is not in a state the decision may leave |
| `LED-R10 writer_failed` | A commit failed earlier; the writer accepts nothing until restart |
| `LED-R11 head_behind_anchor` | The file does not contain the anchored head |

**Recording rule (the one place it is stated).** The writer returns refusals and never records them. The deciding caller records a refusal as a non-dispatch decision in its own `transact` call when its spec says to (AUD-03, `README.md:756`). Admission records `ADMISSION_REFUSED` for an ineligible request, but never for `LED-R01`, `LED-R02` or `ADM-R12`.

How the coordinator reacts to a refused outcome commit is in the [dispatch spec](dispatch-and-coordination.md#coordinator-loop-on-the-writer-thread-one-io-worker-per-account).

## Failure modes and crash points

| ID | Crash or failure at | Durable state afterwards | Required behaviour | Proof |
|---|---|---|---|---|
| CP-L1 | Before the admission commit | Nothing | A caller retry with the same key admits once | PRF-LED-04 |
| CP-L2 | After admission, before the dispatch claim | `ADMITTED`, reservation `RESERVED` | Revalidate on restart; dispatch or refuse (D13) | PRF-LED-05 |
| CP-L3 | After the claim commit, before the outcome commit (before, during or after the adapter call) | Attempt `CLAIMED` | Recovery commits the outcome from published evidence if any, otherwise `AMBIGUOUS` (reason `interrupted`); never resent (D13). `_AMBIGUOUS` on a retired-epoch attempt passes the guard | PRF-LED-05 |
| CP-L4 | After the outcome commit, before the compatibility projection refresh (from SLICE-13) | Events and index tables committed | Refresh from events; `repair_scheduled`; no resend | PRF-LED-06 |
| CP-L5 | After a commit, before the caller receives the reply | Committed | A same-key retry returns `Existing` | PRF-LED-03 |
| CP-L6 | During a migration | Previous revision (each migration is one transaction) | Re-applied on the next start | PRF-LED-10 |
| CP-L7 | During `activate_epoch` or `INDEX_REPAIRED` | Previous state (one transaction each) | Repeated on the next start | PRF-SES-05, PRF-LED-08 |
| F-L5 | Disk full or I/O error at commit | Unknown to the caller | `commit_failed`; writer failed (`LED-R10`); kernel restarts through recovery; same-key retry is safe; no resend (A09-F3, `README.md:933`) | PRF-LED-07 |
| F-L6 | External edit of an index table | Chain valid, index wrong | Detected at a D04 point; `LED-R05`; authority refused until repaired | PRF-LED-08 |
| F-L7 | Older file restored, or tail truncated | Valid but short chain | `LED-R11` against the anchored head | PRF-LED-15 |
| F-L8 | Unsafe SQLite, settings mismatch, lock held, unknown schema | Unchanged | Open refused (`LED-R07`, `LED-R04`, or the runtime error) | PRF-LED-13, PRF-LED-14, PRF-LED-10 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| The hash chain is unkeyed: anyone who can write the file can rewrite it consistently | File permissions limit writers to the kernel's service user ([runtime spec](runtime-isolation-observability-deployment.md)); head anchoring detects rollback and truncation; hashes alone never establish truth (`README.md:784`) |
| The writer lock is advisory | Only this system's processes honour it; `data_version` detects other writers and forces recovery |
| `CommandKey` is a caller-supplied global namespace | A key is bound to its first request digest and principal; a different principal or content gets `LED-R02`; keys are never reused for a new meaning |
| D04 folds the whole history on one thread at writer open | Measured in TASK-S02-02 (A09-F4); if it exceeds the startup budget, a verified checkpoint of index tables is the planned extension, recorded as a decision first |
| Every write in the kernel runs on one thread | The single-account assumption of the [dispatch spec](dispatch-and-coordination.md#non-goals); throughput is measured, not assumed |
| A crash between claim and adapter call makes an unsent attempt ambiguous when no evidence was published | Conservative by D13: the reservation stays held until reconciliation; the cost is capacity, not money |

## Policy inputs

Both are refusing parameters (REQ-XC-003).

| Input | Source | Default |
|---|---|---|
| Reservation amounts per entry | The plan's amount, margin and worst-case loss under approved policy (`README.md:776`); the legacy rule is characterized in TASK-S04-03 | None: refusing |
| `money.rounding` | TASK-S04-03 characterization, then the owner's confirmation if it differs from legacy | None: refusing |

## Reuse evidence

* **Reuse/harden** (`README.md:1143`), all under `OA/src/tier1/`:
  * `runtime.py`: APSW binding, safe-version rule, settings readback;
  * `envelope.py`;
  * `ledger.py`: `append`, `_transaction`, `_idempotent`, `_lock`;
  * `schema.py`: append-only triggers, single active epoch, `release_binding`.
* **Refactor:** `OA/src/core/framework/execution/reservations.py`: `_fold_events` becomes the reservation part of `fold`; `reduce()` (`:644`) keeps its fill-driven reduction and proportional rule.
* **Do not reuse:**
  * the free-form `statements` hook of `ledger.append` (typed writes replace it);
  * the float money fields as storage.
* **Divergences to fix:** LD-01, LD-06, LD-07, LD-09, LD-10, LD-11; LD-17 is a match to keep.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Keep the JSONL registry as a co-authority | Two stores with no shared transaction produced LD-09 and LD-10; one ledger cannot disagree with itself |
| Separate apply, repair and comparison code | Three implementations of one meaning can disagree; one fold cannot |
| Separate transactions for outcome and accounting | A crash between them leaves an outcome without its accounting, the state AUD-02 forbids |
| Keep the reservation whole until completion | Counts filled capital twice against broker funds (D16); legacy reduces on each fill |
| Fold computes reduced amounts itself | It would depend on `money.rounding`, and a rebinding would change history at the next D04 check |
| Rely on SQLite locking alone for one writer | SQLite allows a second writer to wait and then write; the file lock refuses it at open |
| Detect external writes by file time or size | WAL writes do not reliably change them; `data_version` is SQLite's own counter |
| Integer paise for money | Equivalent precision; decimal strings keep payloads readable and avoid a units field on every value |
| Index tables refreshed outside the transaction | They could lag the events, which D04 would then report as a mismatch after every crash |
| One writer per account | Admission must serialize against account-wide state, and the system runs one account today |

## Proofs

Proof class **T** is an automated test; **M** is a measurement. The file named is where the test lives.

| Proof | Class | Test file | Expected outcome (derived independently) | Break check |
|---|---|---|---|---|
| PRF-LED-01 | T | `tests/unit/test_event_envelope.py` | The digest of a fixed envelope equals `sha256` of a hand-written normalized string; after three appends each `prev_hash` equals the previous `event_hash`; editing one row breaks the chain check | Reordering keys or allowing NaN changes the digest or raises |
| PRF-LED-02 | T | `tests/unit/test_event_envelope.py` | UPDATE or DELETE on `ledger_event` raises at the database | Dropping the trigger fails the test |
| PRF-LED-03 | T | `tests/unit/test_command_identity.py` | Same key and digest returns the first state (also after CP-L5 and for a concurrent twin refused at stage B); changed digest gives `LED-R02`; missing key gives `LED-R01` | Removing the digest comparison passes a changed request |
| PRF-LED-04 | T | `tests/integration/test_entry_outcomes.py` | Admission writes the event, identity and reservation together; a forced failure before commit leaves none of them | Splitting the transaction leaves an orphan reservation |
| PRF-LED-05 | T | `tests/recovery/test_crash_boundaries.py` | CP-L2 and CP-L3 restart states as tabled; with published evidence the outcome is rebuilt; zero adapter calls during recovery | A retry path that calls the adapter again fails |
| PRF-LED-06 | T | `tests/recovery/test_crash_boundaries.py` | From SLICE-13: CP-L4 projection rebuilt and equal to the event-derived content; `repair_scheduled` | Skipping the refresh leaves it stale |
| PRF-LED-07 | T | `tests/recovery/test_crash_boundaries.py` | An injected error at commit gives `commit_failed`; the next call returns `LED-R10`; after restart a same-key retry returns `Existing` when the commit had persisted and admits once when it had not; no resend | Treating it as `not_sent` fails |
| PRF-LED-08 | T | `tests/recovery/test_projection_integrity.py` | An altered `command_identity` or `ledger_meta` row gives `LED-R05` before any other write; repair clears it | Comparing only the chain misses it |
| PRF-LED-09 | T | `tests/unit/test_ledger_invariants.py` | Hypothesis state machine: I-1…I-6 hold after any sequence of admit, claim, outcome, fill, reduction and resolve; incremental rows equal the full fold | Double-counting a fill breaks I-4 or I-6 |
| PRF-LED-10 | T | `tests/recovery/test_projection_integrity.py` | An unknown `schema_revision`, or a migration revision above the bundle's, gives `LED-R04` before any write; a crash mid-migration re-applies it | Skipping `schema.check` lets the writer open |
| PRF-LED-11 | T | `tests/unit/test_ledger_invariants.py` | A partial fill of a single-leg entry gives `reservation_after` equal to a hand calculation with the legacy rule and a synthetic `money.rounding`; a multi-leg rejected leg lowers `amount` only | Using floats, or scaling a spread's margin down, fails |
| PRF-LED-12 | T | `tests/unit/test_command_identity.py` | A decision from the wrong state gives `LED-R09`; a coordinator outcome naming a retired epoch's attempt gives `LED-R09`, a recovery `interrupted` for it commits; a redelivered identical fill is dropped; non-normalized money or an unresolved evidence reference gives `LED-R06`; I-3 refuses `RELEASED → HELD` | Dropping the guard lets a second claim through |
| PRF-LED-13 | T | `tests/contracts/test_capabilities.py` | An unsafe SQLite version refuses the writer open; WAL and FULL are read back; `RUNTIME_OPENED` records the identity | Trusting the requested PRAGMA passes |
| PRF-LED-14 | T | `tests/recovery/test_restore_fencing.py` | A second writer gets `LED-R07`; a reader holds no snapshot between calls; a write by another connection is detected through `data_version` | Removing the lock check fails |
| PRF-LED-15 | T | `tests/recovery/test_projection_integrity.py` | A file truncated below a supplied anchored head gives `LED-R11` | Trusting a valid chain passes |
| PRF-LED-16 | T | `tests/integration/test_entry_outcomes.py` (entry), `tests/integration/test_verb_completion.py` (other verbs) | Each verb's completion row: completes on its observed condition and never on ACK alone | Completing on ACK fails |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-01 | REQ-LED-001, -003 (lock, runtime), -004, -005, -006 (without projections), -008, -010, -012, -013, -015, -016, for one single-leg entry against the simulated broker. Evidence references with store `simulated` are checked for form only | PRF-LED-01…05, -07, -12 (SLICE-01 rows), -13 |
| SLICE-02 | REQ-LED-002 (anchoring), -003 (readers), -009, -014 | PRF-LED-08, -09, -10, -14, -15 |
| SLICE-05 | REQ-LED-007 for cancel, modify and close | PRF-LED-16 |
| SLICE-07 | REQ-LED-011: fills, reductions, multi-leg outcomes | PRF-LED-11 |
| SLICE-13 | Compatibility projections (REQ-LED-006 fully) | PRF-LED-06 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
