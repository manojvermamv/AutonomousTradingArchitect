# Dispatch and coordination

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/dispatch-and-coordination/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive):** `kernel/coordinator.py` and the read-only `command_status` query. The simulated broker it is tested against is specified with the other broker adapter ([execution-domain spec](execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy)).
* **Consumes:**
  * the conflict relation and the permission matrix in `kernel/safety.py` ([protection-and-safety](protection-and-safety.md));
  * the broker port and transport classes in `kernel/ports.py` ([execution-domain-and-observations](execution-domain-and-observations.md#ports-kernelportspy));
  * grants, sessions and recovery stages ([sessions-authority-lifecycle](sessions-authority-lifecycle.md)).
* **Supplies:** the busy count for admission checks A0 and B4 ([intent-to-admission](intent-to-admission.md#admission-kerneladmissionpy)).
* **Commits through:** the atomic transaction ([ledger-and-atomic-transaction](ledger-and-atomic-transaction.md)): `DISPATCH_REFUSED`, `DISPATCH_CLAIMED`, `OUTCOME_*`. `DISPATCH_RETRY_REQUESTED` is recorded by admission ([identity rule](ledger-and-atomic-transaction.md#request-digest-and-the-identity-rule)); the coordinator reads it.
* **Master anchors:** D13 (`README.md:758`), D14 (`:760`), A03-F1 (`:914`), A03-F2 (`:916`), A03-F3 (`:918`), A03-F5 (`:924`), A07-F3 (`:889`), A09-F4 (`:935`), ATA-04 (`:454`), execution sequence step 5 (`:747`), shared engine (`:798-804`), diagram 2 (`:568-720`), §7 rows (`:1144`, `:1151`).
* **Terms** (see the [package glossary](../README.md#terms-used-across-the-specs)):
  * the **claim** is the `DISPATCH_CLAIMED` event; it creates **attempt** *n*, the numbered record of one send;
  * the **writer thread** is the one kernel thread that runs every ledger write;
  * a worker is **idle** or **in flight**;
  * the **busy count** is admission's backpressure measure (below);
  * **disarmed**, **bundle** and **index tables** are glossary terms; LD-nn rows are in [legacy-divergence](../legacy-divergence.md).

## Overview

The coordinator is the sole live execution owner (`README.md:724`). It runs only in the `OPERATING` recovery stage. On every wake it:

1. refuses admitted commands whose dispatch deadline has passed;
2. picks an **eligible** admitted command for each account whose worker is idle;
3. **revalidates** the command's recorded dependencies and its target, on the writer thread;
4. **claims** it in the next transaction on the same thread;
5. hands the request to the account's worker, which calls the broker port outside any transaction, with no hidden retries;
6. commits the classified result when the worker returns.

Each account has one request in flight. A slow broker call on one account never stops other accounts. The simulated broker is the disarmed adapter used by tests and simulation runs.

## The problem

The legacy route holds one process-global lock across the HTTP call (LD-08), so every send waits behind one slow request and send order is whichever request takes the lock first. Three more problems follow:

* a retry without a key gets a new identity (LD-01);
* dispatch never revalidates what admission checked;
* timeouts and caller disconnects are not distinguished from financial cancels.

The master accepted these fixes: dispatch revalidation (D13), stable identity (D14), bounded I/O (A03-F1), the ledger as the only durable queue (A03-F2), distinct cancellation meanings (A03-F3), and separate ownership of conflicts and scheduling (ATA-04).

## Goals

1. An admitted command is sent only after its recorded dependencies and its target are revalidated, with no other ledger write between that revalidation and its claim (D13).
2. The claim is durable before every adapter call. Every attempt that may have reached the broker stays linked to its command until reconciliation resolves it (D13/D14).
3. One request in flight per account. No lock or transaction spans a broker call, and every call has a total deadline (A03-F1).
4. Admitted work survives restart through the ledger alone. Overload before acceptance is explicit (A03-F2).
5. Scheduling follows a configured ordering rule. One request per account is not a conflict rule (ATA-04).
6. A caller disconnect never becomes a cancel (A03-F3).
7. Tests and simulation runs use the same broker port as production, with no network or credential (shared engine, `README.md:798-804`).

## Non-goals

* Changing the decided protective-vs-entry rule or choosing deadline values before they are measured ([Q-004, Q-011 answers](../decisions/owner-answers-2026-10-27.md)).
* A separate I/O process or a second sender (`README.md:914`).
* Remote exactly-once delivery (`README.md:760`). No endpoint deduplication is relied on until an endpoint contract proves one.
* Many accounts (see [Risks and limits](#risks-and-limits)).

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-DSP-001 | Revalidate the recorded dependencies and the target before the claim | D13 (`README.md:758`) | PRF-DSP-01, -09 |
| REQ-DSP-002 | Commit the claim before the adapter call; call outside any transaction, with no hidden retries | D13/D14 (`README.md:747`, `:760`) | PRF-DSP-02 |
| REQ-DSP-003 | Conflicts come from `kernel.safety`'s versioned relation; serialization is not a conflict policy | ATA-04 (`README.md:454`); LD-02 | PRF-DSP-04, PRF-PRT-11 |
| REQ-DSP-004 | Schedule eligible commands under a configured ordering rule; infer no priority | ATA-04 (`README.md:454`) | PRF-DSP-07 |
| REQ-DSP-005 | One request in flight per account; slow I/O on one account does not block others; every call has a total deadline | A03-F1 (`README.md:914`); LD-08 | PRF-DSP-05, -06 |
| REQ-DSP-006 | The ledger is the only durable queue; overload is refused before acceptance; a lost reply never relabels a command | A03-F2 (`README.md:916`) | PRF-DSP-03, -10 |
| REQ-DSP-007 | An outcome commit names command, attempt and epoch, and applies only to that attempt | A03-F1 (`README.md:914`) | PRF-LED-12, PRF-DSP-03 |
| REQ-DSP-008 | A caller disconnect is not a cancel; a broker cancel is its own admitted action | A03-F3 (`README.md:918`) | PRF-DSP-06 |
| REQ-DSP-009 | Holds, kills and latches take effect at their ledger sequence; an in-flight request is never retracted | D13 (`README.md:758`); A03-F1 (`:914`) | PRF-DSP-08 |
| REQ-DSP-010 | A new attempt needs a `NOT_SENT` previous attempt and a recorded retry request; a rejected command is final; an ambiguous attempt is never retried blindly | D14 (`README.md:760`) | PRF-DSP-11 |
| REQ-DSP-011 | The simulated broker uses the same ports, has no network or credential, and binds only a simulation ledger; its costs and fills are injected, versioned assumptions | Shared engine (`README.md:798-804`); A07-F3 (`:889`) | PRF-DSP-12, PRF-XC-02 |

## Critical user journeys

### CUJ-DSP-1: Slow broker on one account

* **Given** account A's worker has been in flight for 8 s, and account B has an eligible admitted cancel.
* **When** the coordinator wakes.
* **Then** B's cancel is revalidated, claimed and sent while A's request is still in flight. A's next eligible command waits until A's worker returns (PRF-DSP-05).

### CUJ-DSP-2: Hold recorded before the claim

* **Given** an entry command is admitted at ledger sequence 100, and a hold for its strategy is recorded at sequence 105.
* **When** the coordinator tries to claim it after sequence 105.
* **Then** revalidation sees the hold, and the `DISPATCH_REFUSED` transaction (`PRT-R04`) releases the reservation, because nothing was sent (PRF-DSP-08).

### CUJ-DSP-3: Timeout

* **Given** an attempt is claimed and sent.
* **When** the call's total deadline passes with no response.
* **Then** the worker returns `ambiguous`; the outcome commit moves the attempt to `AMBIGUOUS` and the command to `UNCERTAIN`, and keeps the reservation. The command is never claimed again unless reconciliation records `RESOLVED_NEVER_REACHED` and a caller requests a retry before the dispatch deadline (PRF-DSP-06).

### CUJ-DSP-4: Position flattened before a close is sent

* **Given** an owner close for 50 is admitted, and waits behind a slow request on its account.
* **When** a fresh observation shows the position closed at the broker before the claim.
* **Then** revalidation row 6 refuses the close (`ADM-R07`), and nothing is sent (PRF-DSP-09).

## Technical plan

### What is stored for each command

`COMMAND_ADMITTED` carries the normalized request and, for an entry, the `PlanRef` ([ledger catalogue](ledger-and-atomic-transaction.md#event-catalogue)). The coordinator loads both from that event (located by the command's `first_sequence`), so nothing needed for a send lives only in memory.

### Coordinator loop (on the writer thread; one I/O worker per account)

Every ledger write in the kernel runs on the one writer thread ([ledger spec](ledger-and-atomic-transaction.md#writer-runtime-and-readers)). The coordinator's revalidation and claim run there too, back to back, so no other write can commit between them. The coordinator runs only in `OPERATING` ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)); before that, admitted work waits.

```text
on wake (ledger commit, worker return, observation arrival, or deadline timer);
wakes arriving during a pass are merged into one next pass:
  for each ADMITTED command whose dispatch deadline has passed (eligible or not):
      commit DISPATCH_REFUSED(cmd, DSP-R01)
  for each bound account, in AccountId order, whose worker is idle:
    for cmd in eligible(account):                   # ordering rule; reads index tables only
      result = revalidate(cmd)                      # rows 1–6 below: pass, refuse or wait
      if result is refuse: commit DISPATCH_REFUSED(cmd, result.code); continue
      if result is wait: continue                   # row 6 needs a fresher observation
      n = (highest attempt_no of cmd, or 0) + 1
      commit DISPATCH_CLAIMED(cmd, attempt_no=n, epoch=writer's active epoch)
      request, plan = load from cmd's COMMAND_ADMITTED event
      worker[account].submit(cmd, request, plan, n) # no transaction held
      break
  set the deadline timer to the earliest dispatch deadline of any ADMITTED command (monotonic clock)

on worker return (command_key, attempt_no, result: TransportResult):
    decision = outcome decision for result          # kernel.reservations: reservation_after for rejected legs;
                                                    # kernel.lifecycle: RESIDUAL_RECORDED for a partly reached entry
    commit OUTCOME_<CLASS>(command_key, attempt_no, epoch, legs, unassigned_order_ids, reason,
                           raw_digest) with the decision's records, in one transaction
    worker[account] becomes idle
```

`<CLASS>` is `result.cls` in upper case: `not_sent` → `OUTCOME_NOT_SENT`, and so on. An `ambiguous` result moves the attempt to `AMBIGUOUS` and the command to `UNCERTAIN` ([ledger state machine](ledger-and-atomic-transaction.md#command-and-attempt-state-machine)).

**The worker.**

* It calls `BrokerPort.send(request, plan, n)`.
* It only forwards the result. The adapter publishes its raw result inside its own bounded call, keyed by command key and attempt number ([evidence contract](execution-domain-and-observations.md#evidence-contract-contractsevidencepy)); if publishing fails, `raw` is empty and the outcome is committed with reason `evidence_unpublished` and the broker IDs in its payload.
* It always returns. The adapter's own `NotSent` becomes `not_sent` ([transport classes](execution-domain-and-observations.md#openalgo-adapter-adaptersopenalgopy)); any other exception raised after the call started becomes `ambiguous` with reason `adapter_error`.
* There are no in-process late results: once it returns, nothing more arrives for that attempt. Later broker evidence reaches the kernel only through observations and reconciliation.

**When the outcome commit is refused.**

| Refusal | Meaning | What the coordinator does |
|---|---|---|
| `LED-R06`, `LED-R08` | Deterministic: this payload would fail again | Commits `OUTCOME_AMBIGUOUS` for the attempt with reason `outcome_refused` (a different payload); the worker becomes idle; the kernel keeps running |
| `LED-R03`, `LED-R09`, `LED-R10`, `CommitFailed` | This process can no longer write, or the attempt's state or epoch no longer allows any outcome from it | The kernel exits; recovery rebuilds the outcome from the published evidence, or records `interrupted` ([sessions spec](sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy)) |

### Eligibility and scheduling

* **Eligible** means all of:
  * the command is `ADMITTED`;
  * it has no attempt yet, or its latest attempt is `NOT_SENT` **and** a `DISPATCH_RETRY_REQUESTED` was recorded after it;
  * the current conflict relation ([protection-and-safety](protection-and-safety.md#conflict-relation-kernelsafetypy)) permits it;
  * no safety check that guards it is inert ([safety-check visibility](protection-and-safety.md#safety-check-visibility-kernelsafetypy));
  * its account's worker is idle.
* **Retries are caller-driven**, as in legacy (`OA/src/tier1/coordinator.py:94-103`). After `OUTCOME_NOT_SENT` or `RESOLVED_NEVER_REACHED`, a principal holding the command's verb resubmits the identical request with the same command key. Admission rechecks the principal's grant and records `DISPATCH_RETRY_REQUESTED` instead of returning `Existing` ([ledger identity rule](ledger-and-atomic-transaction.md#request-digest-and-the-identity-rule)); `kernel.protection` does this for its own commands at its next evaluation. A retry is possible only before the original dispatch deadline; after it the command is refused (`DSP-R01`) and the caller submits a new command key. This prevents a send loop during a broker outage. A `REJECTED` command is final; a new try is a new command key.
* **Waiting instead of refusing.** A conflict, or an inert safety check that guards the command, keeps it waiting until it clears or the deadline passes (loop step 1). The coordinator reads the check's state, which `kernel.safety` alone records (`SAFETY_CHECK_STATE`), and never passes it silently. Admission check B3 refuses a conflict present at admission; after that, the relation's version changing is not a refusal.
* **Ordering** is fixed; the owner kept the admission-order rule ([Q-004 answer](../decisions/owner-answers-2026-10-27.md)), so it is not a parameter: among the account's eligible commands, the one whose `COMMAND_ADMITTED` has the lowest ledger sequence. A blocked command does not hold up the ones behind it, and a command that returns to `ADMITTED` keeps its original sequence. Any priority between protective actions and entries waits for [Q-004](../decisions/owner-questions.md#q-004).

### Revalidation at dispatch

Admission records one dependency set per command in `COMMAND_ADMITTED.dependencies`:

```text
Dependencies(dispatch_deadline: Deadline, release_binding_id, grant_id,
             session_id | None)                            # session for entries only
```

The coordinator checks, in this order, and records the first failure:

| # | Dependency | How it is checked | Refused when | Code |
|---|---|---|---|---|
| 1 | Deadline | The clock contract's deadline rule ([sessions spec](sessions-authority-lifecycle.md#clock-contract-contractsclockpy-adaptersclockspy)) | It has passed (normally caught by loop step 1) | `DSP-R01` (`deadline_passed`) |
| 2 | Release | Version comparison | The bound release binding differs from `release_binding_id` | `DSP-R02` (`release_changed`) |
| 3 | Grant | The admitted grant itself: `authority.recheck(grant_id, verb, account)`; no other grant substitutes | Revoked, expired, or its delegation chain broken | `SES-R03`, `SES-R04`, `SES-R05` |
| 4 | Session (entries only) | The recorded `session_id` is still `OPEN` | It closed | `SES-R07` |
| 5 | Safety state | The permission matrix now, in the order kill, hold, latch | Kill, hold or latch forbids this verb and actor | `PRT-R01`, `PRT-R04`, `PRT-R03` |
| 6 | Target (cancel, modify, close) | Admission's effect check (B2) again, against the kernel's latest observation of the account ([polling](execution-domain-and-observations.md#polling)) | The order is no longer open, or the requested remaining quantity (for a modify, the new total − filled) now exceeds the open position | `ADM-R07`; while that observation is older than 60 s (POL-021) the result is **wait** |

* An unrelated ledger append never invalidates a command (`README.md:736`).
* D13's policy dependency (`README.md:758`) is met by row 4: a session's policy binding is fixed when it opens ([sessions spec](sessions-authority-lifecycle.md), PRF-SES-09), so an entry whose session is still `OPEN` still has its admitted policy.
* A waiting command does not hold up the account's next eligible command; an observation arrival wakes the coordinator to try it again.
* The review application's deadline is the dispatch deadline ([intent spec](intent-to-admission.md#contracts-contractsdecisionspy)), so each command has one deadline.

### Holds, kills and latches against in-flight requests

Each is requested through its operator or kernel path and takes effect at the ledger sequence of its recorded event ([protection spec](protection-and-safety.md#kill-and-holds-kernelsafetypy)). A claim committed before that sequence proceeds, and its in-flight request is never retracted. Revalidation row 5 refuses a claim attempted after that sequence.

### Bounded I/O

* Each account has one I/O worker.
* Every call has a **total deadline**, `adapter.http_timeout_ms`, covering name resolution, connect, write and read together. Per-phase timeouts alone do not satisfy it. The OpenAlgo adapter enforces it ([execution-domain spec](execution-domain-and-observations.md#openalgo-adapter-adaptersopenalgopy)); PRF-DOM-04 proves it against a socket-level fake server that drips its response.
* The worker never retries. The HTTP client is configured with retries disabled (`README.md:760`).
* A worker in flight longer than its total deadline is reported to the supervisor with its age (A03-F5 "oldest pending work"); its account stays blocked rather than risk a second request ([runtime spec](runtime-isolation-observability-deployment.md)).

### Busy count (supplied to admission)

* The **busy count** for an account is the number of its commands in `ADMITTED` or `IN_FLIGHT`. `UNCERTAIN`, `WORKING` and final states do not count.
* `coordinator.max_pending_per_account` bounds it (a measured refusing parameter, A09-F4). Admission refuses with `ADM-R12` (`busy`) at or above the bound, **before** any commit.
* Whether the bound also applies to protective actions on owned exposure is the refusing parameter `coordinator.busy_applies_to` (`all` or `entries_only`); the first release binds `entries_only` ([Q-004 answer](../decisions/owner-answers-2026-10-27.md)), so protective actions never wait on the busy bound. A busy refusal is never recorded, including for `kernel:protection`, which simply submits again at its next evaluation.

### Command status (read-only)

```text
command_status(command_key) -> CommandStatus
```

`CommandStatus` is defined with the execution contract types ([ledger](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy)): the command's state, its latest attempt and outcome if any, broker order IDs, and its refusal if refused. It reads index tables only. A caller whose acceptance reply was lost uses it, and callers learn final outcomes the same way, or from the outcome events the interfaces stream ([security-and-operator](security-and-operator.md)).

### Refusal codes

| Code | Meaning |
|---|---|
| `DSP-R01` (`deadline_passed`) | The dispatch deadline passed before the claim |
| `DSP-R02` (`release_changed`) | The bound release changed since admission |

`DSP-R03` is unused: the policy dependency is met by row 4. Row 6 reuses admission's `ADM-R07`; the busy refusal is admission's `ADM-R12`.

## Failure modes and crash points

The ledger crash points CP-L2…CP-L4 and failure F-L5 apply ([ledger spec](ledger-and-atomic-transaction.md#failure-modes-and-crash-points)). The coordinator adds:

| ID | Crash or failure | Durable state | Required behaviour | Proof |
|---|---|---|---|---|
| CP-D1 | Crash with workers in flight | Claims without outcomes | On restart, readiness is rebuilt from index tables only; recovery commits each claim's published outcome, or marks it `AMBIGUOUS`; nothing is duplicated | PRF-DSP-03 |
| F-D2 | Whole-kernel hang (writer thread stalled) | Unchanged | Different from slow I/O; the independent supervisor reports stalled demand (A03-F5) | Proved with the supervisor ([runtime spec](runtime-isolation-observability-deployment.md)) |
| F-D3 | Caller disconnects mid-request | Command committed | The command continues; no cancel is created | PRF-DSP-06 |
| F-D4 | Outcome commit refused deterministically | Claim without outcome | `OUTCOME_AMBIGUOUS` (reason `outcome_refused`); the kernel keeps running | PRF-DSP-03 |
| F-D5 | Outcome commit fails fatally | Claim without outcome | The kernel exits; recovery rebuilds or marks `interrupted` | PRF-DSP-03 |
| F-D6 | A worker stuck past its total deadline | `IN_FLIGHT` | Reported to the supervisor with its age; the account stays blocked | PRF-DSP-05 |
| F-D7 | Broker outage returning `not_sent` | `ADMITTED` with a `NOT_SENT` attempt | No new attempt until a retry is requested; no send loop | PRF-DSP-11 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| One worker per account assumes few accounts (one today) | A large account count needs a measured worker pool, recorded as a decision first |
| Every write, including the deadline sweep, runs on the writer thread | Wakes are merged per pass; throughput is measured (A09-F4) |
| A fatal commit failure stops every account | Only fatal refusals exit; deterministic ones are recorded per attempt; claims with published evidence are rebuilt after restart |
| A stuck worker blocks its account | Total deadline on every call; stuck workers reported to the supervisor |
| The admission-to-dispatch window | Revalidation rows 1–6, including the target recheck |
| The simulated broker's fill model can differ from reality | It is a versioned, injected assumption; simulation results never count as live evidence (REQ-XC-007) |

## Policy inputs

All are refusing parameters (REQ-XC-003): a composition that leaves one unbound refuses to load.

| Input | Source | Default |
|---|---|---|
| `adapter.http_timeout_ms` (total deadline) | Measured (A09-F4) | None: refusing; synthetic in tests |
| `coordinator.max_pending_per_account` | Measured (A09-F4) | None: refusing; synthetic in tests |
| `coordinator.busy_applies_to` | [Q-004 answer](../decisions/owner-answers-2026-10-27.md) | None: refusing; first release binds `entries_only` |
| `dispatch.deadline_ms.<verb>` | [Q-011 answer](../decisions/owner-answers-2026-10-27.md): measured first (TASK-S11-07), then set per verb, longer for cancel and close (`README.md:758`) | None: refusing; synthetic labelled values in tests |

## Reuse evidence

* **Coordinator/OpenAlgoAdapter/ports: extract/refactor against D13–D15** (`README.md:1144`). Legacy `OA/src/tier1/coordinator.py`:
  * `NotSent` (`:43`): an adapter raises it only when it can prove no request left the process;
  * `send` (`:94-110`): the request is recorded with the send intent, and a new attempt needs a rejection or proven non-delivery and a caller's call; the target keeps the caller-driven rule but makes a rejected command final;
  * `recover()` (`:139-155`): every send intent with no outcome becomes ambiguous; it sends nothing;
  * `resolve()` (`:157-170`): an ambiguity closes only from fresh broker evidence.
* **Do not reuse:** `last_outcome` (`:81-92`), which scans the whole ledger per call; the route lock (LD-08), the uuid fallback (LD-01), and scope scanning as an implicit conflict rule (LD-02).
* **Legacy and shared worker replay: keep compatibility, converge selectively** (`README.md:1151`). `ReplayLifecycleAdapter` (`OA/src/data/replay_engine/producer.py:254-264`), whose `send` raises, is evidence for the "no network" part of the simulated broker only.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Global lock around send (legacy) | Every account waits behind one slow request (A03-F1) |
| Separate I/O process | Not required initially; needs measured justification (`README.md:914`) |
| In-memory durable queue | The ledger is the only durable queue (A03-F2); the request and plan are stored in `COMMAND_ADMITTED` |
| Automatic retry on timeout | A missing response after the request may have left the process is ambiguous (D14) |
| Automatic re-dispatch after `not_sent` | Loops during an outage; legacy left the new attempt to the caller |
| A worker timer shorter than the call's total deadline, freeing the slot early | Lets a second request start while the first may still reach the broker |
| Refuse a command when a conflict appears after admission | Turns a temporary conflict into a lost command; waiting until the deadline keeps one rule |
| Revalidate inside the claim's SQLite transaction | Equivalent here, because all writes run on one thread; the separate step keeps `transact` free of coordinator logic |
| Trust admission's target check until dispatch | The position can change in between; row 6 rechecks it |

## Proofs

Class **T** is an automated test. "Must fail if" names the defect the test must catch.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-DSP-01 | T | `tests/integration/test_dispatch_revalidation.py` | Rows 1–5: a change between admission and claim gives `DISPATCH_REFUSED` with that row's code, the first failing row wins; an unrelated append does not refuse; a session close does not refuse a cancel | revalidation is skipped |
| PRF-DSP-02 | T | `tests/integration/test_entry_outcomes.py` | The adapter is called only after `DISPATCH_CLAIMED` is durable; one call per attempt; a scripted `timeout` gives `ambiguous` (SLICE-01) | the adapter is called before the claim |
| PRF-DSP-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-D1, F-D4, F-D5: readiness rebuilt; a claim gets its published outcome, or `AMBIGUOUS`; a deterministic refusal gives `outcome_refused` without exiting; `LED-R09` exits; a partly rejected two-leg entry commits `reservation_after` and `RESIDUAL_RECORDED` with its outcome; no second call | readiness is persisted separately |
| PRF-DSP-04 | T | `tests/integration/test_dispatch_revalidation.py` | A conflict or an inert guarding safety check appearing after admission keeps the command waiting; it is sent after it clears, or refused with `DSP-R01` when the deadline timer fires | a conflict refuses at dispatch, or the deadline never fires |
| PRF-DSP-05 | T | `tests/integration/test_bounded_io.py` | CUJ-DSP-1: B's cancel is sent while A is stalled; F-D6 reports A's age | a global lock blocks B |
| PRF-DSP-06 | T | `tests/integration/test_bounded_io.py` | CUJ-DSP-3 and F-D3: a timeout gives `ambiguous`; a disconnect creates no cancel | a timeout is retried |
| PRF-DSP-07 | T | `tests/unit/test_scheduling.py` | the fixed rule picks the oldest eligible command and skips a blocked older one | head-of-line blocking or implicit FIFO |
| PRF-DSP-08 | T | `tests/integration/test_dispatch_revalidation.py` | CUJ-DSP-2; a hold, kill or latch recorded after a claim leaves that request in flight and its outcome committed | an in-flight request is retracted, or a claim follows the hold |
| PRF-DSP-09 | T | `tests/integration/test_dispatch_revalidation.py` | CUJ-DSP-4: row 6 refuses a close whose position is gone and a cancel whose order is terminal; a stale observation makes them wait without blocking the next eligible command; an observation arrival wakes the coordinator | the target is trusted from admission |
| PRF-DSP-10 | T | `tests/integration/test_dispatch_revalidation.py` | Busy count: `ADM-R12` before any commit at the bound; `UNCERTAIN` and `WORKING` not counted; `command_status` returns each pending state after a lost reply | the count includes uncertain commands |
| PRF-DSP-11 | T | `tests/integration/test_dispatch_revalidation.py` | F-D7: after `not_sent` no new attempt until `DISPATCH_RETRY_REQUESTED`; then attempt *n*+1 after fresh revalidation; a rejected command is never retried | a send loop occurs |
| PRF-DSP-12 | T | `tests/contracts/test_capabilities.py` | The [simulated broker](execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy) opens no socket and reads no credential; script steps map as tabled there; every result's domain is `simulated`; `RuleResponder` records its model version | a live adapter is reachable in simulation |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-01 | REQ-DSP-002, -011 (script responder), with a synchronous call outside any transaction and the revalidation hook before the claim | PRF-DSP-02, -12 |
| SLICE-05 | REQ-DSP-001, -003…-010: per-account workers, deadline sweep, revalidation, scheduling, busy count, retries, kill and hold records, the cancel/modify/close verbs | PRF-DSP-01, -03…-08, -10, -11 |
| SLICE-07 | The total-deadline proof against a socket-level fake (with the OpenAlgo adapter); row 6 with the observation loop | PRF-DOM-04, PRF-DSP-09 |
| SLICE-12 | `RuleResponder` with the research fill model | PRF-DSP-12 (rule part) |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
