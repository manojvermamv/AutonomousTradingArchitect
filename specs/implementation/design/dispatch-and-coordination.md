# Dispatch and coordination

* **Status:** proposed (package spec), revised after EGM stages 5 and 6 ([review](../egm/dispatch-and-coordination/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item, never an edit here.
* **Specified here (exclusive):** `kernel/coordinator.py`, `adapters/simulated_broker.py`.
* **Consumes:**
  * the conflict relation and the permission matrix in `kernel/safety.py` ([protection-and-safety](protection-and-safety.md));
  * the broker port in `kernel/ports.py` and the transport classes ([execution-domain-and-observations](execution-domain-and-observations.md#ports-kernelportspy));
  * grants and session state ([sessions-authority-lifecycle](sessions-authority-lifecycle.md)).
* **Supplies:** the busy count that admission check B4 uses ([intent-to-admission](intent-to-admission.md#admission-kerneladmissionpy)).
* **Commits through:** the atomic transaction in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md) (`DISPATCH_REFUSED`, `DISPATCH_CLAIMED`, `OUTCOME_*`).
* **Master anchors:** D13 (`README.md:758`), D14 (`:760`), A03-F1 (`:914`), A03-F2 (`:916`), A03-F3 (`:918`), ATA-04 (`:454`), execution sequence step 5 (`:747`), shared engine (`:798-804`).
* **Terms** (also in the [package glossary](../README.md#id-glossary)): the **writer thread** is the one kernel thread that runs every ledger `transact` ([ledger spec](ledger-and-atomic-transaction.md#writer-runtime-and-readers)); **index tables** are the ledger's derived tables; a **disarmed** composition has no live adapter or credential; a **simulation ledger** is the separate ledger file of one simulation run; the **bundle** is the installed release artifact. LD-nn rows are in [legacy-divergence](../legacy-divergence.md).

## Overview

The coordinator is the sole live execution owner (`README.md:724`). It turns admitted commands into broker attempts:

1. It refuses admitted commands whose dispatch deadline has passed.
2. It picks an **eligible** admitted command for an account.
3. It **revalidates** the command's recorded dependencies on the writer thread.
4. It **claims** dispatch durably, in the next transaction on the same thread.
5. It calls the broker port **outside** any database transaction, with no hidden retries.
6. It hands the classified result to the atomic outcome commit.

Each account has one outbound request in flight. A slow broker call on one account never stops the kernel from processing other accounts' eligible work. The simulated broker is the disarmed adapter used by every simulation composition and by SLICE-01.

## The problem

The legacy route holds one process-global lock across the HTTP call (LD-08). That stalls every send behind one slow request and makes acquisition order incidental. Three more problems follow:

* a retry without a key gets a new identity (LD-01);
* dispatch never revalidates what admission checked;
* timeouts and caller disconnects are not distinguished from financial cancels.

The master accepted these fixes:

* dispatch revalidation (D13);
* stable identity (D14);
* bounded I/O (A03-F1);
* the ledger as the only durable queue (A03-F2);
* distinct cancellation meanings (A03-F3);
* separate ownership of conflicts and scheduling (ATA-04).

## Goals

1. An admitted command is sent only after its recorded dependencies are revalidated, with no other ledger write between that revalidation and its claim (D13).
2. A durable attempt record exists before every adapter call. Every possibly effective attempt stays attributable until reconciled (D13/D14).
3. One outbound request per account. No lock or transaction spans a broker call (A03-F1).
4. Admitted work survives restart through the ledger alone. Overload before acceptance is explicit (A03-F2).
5. Scheduling follows an explicit, bound ordering rule. Serialization is never mistaken for a conflict policy (ATA-04).

## Non-goals

* Choosing protective-vs-entry priority ([Q-004](../decisions/owner-questions.md#q-004)).
* A separate I/O process or a second sender (`README.md:914`).
* Remote exactly-once delivery (`README.md:760`). No endpoint deduplication is relied on until an endpoint contract proves one ([execution-domain spec](execution-domain-and-observations.md#evidence-contract-contractsevidencepy)).
* Deadline values or emergency treatment (`README.md:758`).
* Many accounts. The design assumes a small number of accounts per kernel (one today), so one I/O worker per account is affordable. A large account count needs a measured worker pool instead.

## Requirement keys

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-DSP-001 | Revalidate the dependencies recorded at admission (deadline, release, grant, session for entries, safety state, policy for entries) before the claim; a failed check is recorded and releases only demonstrably unsent obligations | D13 (`README.md:758`) |
| REQ-DSP-002 | A durable attempt and send intent is claimed before the adapter call; the adapter is called outside the transaction, without hidden retries | D13/D14 (`README.md:747`, `:760`) |
| REQ-DSP-003 | The conflict dependencies used for eligibility are explicit and versioned, and come from `kernel.safety`; one-request-per-account serialization is not a conflict policy | ATA-04 (`README.md:454`); LD-02 |
| REQ-DSP-004 | Eligible commands are scheduled under a bound ordering rule; no priority is inferred | ATA-04 (`README.md:454`) |
| REQ-DSP-005 | One outbound request in flight per account; slow I/O on one account does not block other accounts; no lock or transaction across HTTP | A03-F1 (`README.md:914`); LD-08 |
| REQ-DSP-006 | The ledger is the only durable queue for admitted commands; readiness is derived from index tables on every wake; overload before acceptance is an explicit refusal (ADM-R12); a lost acceptance reply never relabels a committed command | A03-F2 (`README.md:916`) |
| REQ-DSP-007 | The outcome commit names command, attempt and epoch; it applies only to the open attempt of the active epoch | A03-F1 (`README.md:914`) |
| REQ-DSP-008 | A caller disconnect is not a financial cancel; a broker cancel is its own admitted action | A03-F3 (`README.md:918`) |
| REQ-DSP-009 | A hold takes effect at the ledger sequence of its recorded event; a claim after that sequence is refused; a claim before it proceeds, and its in-flight request is not retracted | D13 (`README.md:758`); A03-F1 (`:914`) |
| REQ-DSP-010 | A new attempt needs the previous attempt to be `NOT_SENT` (a rejected command is final; trying again is a new command key), plus fresh revalidation; an ambiguous attempt is never blindly retried | D14 (`README.md:760`) |
| REQ-DSP-011 | The simulated broker returns scripted results through the same broker and observation ports, has no network or credential capability, and its composition binds only a simulation ledger; any cost it reports is an injected, versioned assumption | Shared engine (`README.md:798-804`); diagram 2 (`:568-720`); A07-F3 (`:889`) |

## Critical user journeys

### CUJ-DSP-1: Slow broker on one account

* **Given** account A has an attempt whose HTTP call has been stalled for 8 s, and account B has an eligible admitted cancel.
* **When** the coordinator runs.
* **Then** B's cancel is revalidated, claimed and sent while A's request is still in flight. A's next eligible command waits until A's worker returns.

### CUJ-DSP-2: Hold recorded before the claim

* **Given** an entry command is admitted at ledger sequence 100, and a hold for its strategy is recorded at sequence 105.
* **When** the coordinator tries to claim it after sequence 105.
* **Then** revalidation sees the hold and records `DISPATCH_REFUSED` with `PRT-R04 held`. The reservation is released because nothing was sent.

### CUJ-DSP-3: Timeout

* **Given** an attempt is claimed and sent.
* **When** the HTTP client's timeout expires with no response.
* **Then** the worker returns `ambiguous`, and the outcome is committed with the reservation kept. The command is not claimed again unless reconciliation resolves it `RESOLVED_NEVER_REACHED`.

## Technical plan

### Coordinator loop (on the writer thread; one I/O worker per account)

Every ledger write in the kernel runs on the one writer thread ([ledger spec](ledger-and-atomic-transaction.md#writer-runtime-and-readers)). The coordinator's revalidation and claim run there too, back to back, so no other decision can commit between them.

```text
on wake (any ledger commit, a worker's return, or the deadline timer):
  for each ADMITTED command whose dispatch deadline has passed:     # eligible or not
      commit DISPATCH_REFUSED(cmd, DSP-R01)
  for each bound account, in AccountId order, whose worker is idle:
    cmd = next_eligible(account)                    # reads index tables only
    if cmd is None: continue
    refusal = revalidate(cmd)                       # REQ-DSP-001
    if refusal: commit DISPATCH_REFUSED(cmd, refusal.code); continue
    n = (highest attempt_no of cmd, or 0) + 1
    commit DISPATCH_CLAIMED(cmd, attempt_no=n, epoch=writer's active epoch)  # durable before I/O
    worker[account].submit(cmd.request, cmd.plan, n)   # no transaction held
  set the deadline timer to the earliest dispatch deadline of any ADMITTED command

on worker return (attempt, result: TransportResult):
    commit OUTCOME_<CLASS>(attempt, legs, reason, raw)   # CLASS = upper-case result.cls
    worker[account] becomes idle
```

* **Readiness** is derived from index tables on every wake. There is no in-memory queue; the only in-memory state is the wake signal and each worker's busy flag, both rebuilt at start.
* A worker hands its result to the writer thread as a decision; that hand-off is the wake.
* The worker holds the account's slot from submit until it returns. It always returns:
  * the HTTP client timeout bounds the call;
  * the adapter's own `NotSent` becomes `not_sent` ([transport classes](execution-domain-and-observations.md#evidence-contract-contractsevidencepy));
  * any other exception raised after the call started becomes `ambiguous` with reason `adapter_error`.
* There are no in-process late results. Broker evidence that appears later reaches the kernel only through observations and reconciliation.
* **Evidence first.** Before the outcome commit, the adapter result is published to the evidence store under its `attempt_id` ([ledger evidence publication](ledger-and-atomic-transaction.md#evidence-publication-req-led-014)).
* **Outcome commit failures.** If the outcome commit is refused (`LED-R03`, `LED-R06`, `LED-R08`, `LED-R09`, `LED-R10`) or raises `CommitFailed`, the worker stays busy and the kernel exits. Recovery then commits the outcome from the published evidence, or marks the claim `AMBIGUOUS` (reason `interrupted`) when none was published (ledger CP-L3).
* A restart ends every worker with the process.

### Eligibility and scheduling

* **Eligible** means:
  * the command is `ADMITTED`;
  * it has no attempt, or its latest attempt is `NOT_SENT` (after `OUTCOME_NOT_SENT` or `RESOLVED_NEVER_REACHED`; a `REJECTED` command is final, see the [ledger state machine](ledger-and-atomic-transaction.md#command-and-attempt-state-machine));
  * the current conflict relation ([protection-and-safety](protection-and-safety.md#conflict-relation-kernelsafetypy)) permits it now;
  * its account's worker is idle.
* **Conflicts make a command wait; they never refuse it at dispatch.** Admission refuses a conflict that exists when the command is admitted (check B3). A conflict that appears later only keeps the command ineligible until it clears or its deadline passes (`DSP-R01`, step 1 of the loop). A change of the relation's version after admission is not a refusal; eligibility always uses the current relation.
* **The ordering rule** is the refusing parameter `dispatch.ordering_rule` (REQ-XC-003). This package defines one value:
  * `admission_sequence`: among the account's **eligible** commands, the one whose `COMMAND_ADMITTED` has the lowest ledger sequence. A blocked command does not hold up the ones behind it. A command that returns to `ADMITTED` keeps its original admission sequence.

  Any priority between protective actions and entries is an owner choice ([Q-004](../decisions/owner-questions.md#q-004)) and is added as a new value only after the answer.

### Revalidation at dispatch (REQ-DSP-001)

Admission records one dependency set per command in `COMMAND_ADMITTED.dependencies` ([intent-to-admission](intent-to-admission.md#admission-kerneladmissionpy)):

```text
Dependencies(dispatch_deadline: Deadline, release_binding_id, grant_id, grant_version,
             session_id | None, policy_version | None)     # session and policy for entries only
```

The coordinator checks them in this order and records the first failure:

| # | Dependency | How it is checked | Refused when | Code |
|---|---|---|---|---|
| 1 | Deadline | Wall time against the recorded deadline | It has passed (normally caught by loop step 1) | DSP-R01 `deadline_passed` |
| 2 | Release | Version comparison | The bound release binding differs from `release_binding_id` | DSP-R02 `release_changed` |
| 3 | Grant | Current state: `authority.check(verb, principal, account, at="dispatch")` | Revoked, expired or narrowed | SES-R02 / SES-R03 / SES-R04 |
| 4 | Session (entries only) | Current state | No longer `OPEN` | SES-R07 |
| 5 | Safety state | Current state: the permission matrix now | Kill, latch or hold forbids this verb and actor | PRT-R01, PRT-R03, PRT-R04, PRT-R06, PRT-R07 |
| 6 | Policy (entries only) | Version comparison | The bound policy version differs from `policy_version` | DSP-R03 `policy_changed` |

* The observation head is not a dependency. Observation freshness is an admission-time check (B1); reconciliation handles later evidence.
* An unrelated ledger append never invalidates a command (`README.md:736`).
* The review application's deadline **is** the dispatch deadline ([intent spec](intent-to-admission.md#contracts-contractsdecisionspy)), so there is one deadline per command.

### Holds and in-flight requests (REQ-DSP-009)

A hold, a kill or a latch is **requested** through its operator or kernel path and **takes effect** at the ledger sequence of its recorded event ([protection spec](protection-and-safety.md)). A claim committed before that sequence proceeds, and its in-flight request is never retracted. A claim attempted after it is refused by revalidation row 5.

### Bounded I/O

* Each account has one I/O worker.
* The bound is the HTTP client's own timeout, `adapter.http_timeout_ms`. The worker has no second timer.
* The worker never retries. The underlying HTTP client is configured with retries disabled (`README.md:760`).

### Busy count (supplied to admission)

* The **busy count** for an account is the number of its commands in state `ADMITTED` or `IN_FLIGHT`. `UNCERTAIN`, `WORKING` and final states do not count.
* `coordinator.max_pending_per_account` bounds it. It is a measured refusing parameter (A09-F4, `README.md:935`).
* Admission refuses with `ADM-R12 busy` at or above the bound, **before** any commit.
* A caller whose acceptance reply was lost asks the read-only query `command_status(command_key) -> Outcome` ([interfaces](security-and-operator.md)) and receives the committed state.

### Simulated broker (`adapters/simulated_broker.py`)

```text
SimulatedBroker(script: list[ScriptStep], clock: Clock)
  send(request, plan | None, attempt_no) -> TransportResult      # BrokerPort
  orderbook(account, interval) / tradebook(account, interval) / positions(account) -> Observation
ScriptStep = {"account"?: AccountId, "call": int, "result": not_sent | reject | ack | timeout,
              "order_id"?: str, "reason"?: str, "legs"?: list[per-leg result], "stall"?: "until_released"}
BookStep   = {"account"?: AccountId, "at": Timestamp, "kind": order_status | fill,
              "order_id": str, "status"?: str, "quantity"?: int, "price"?: str, "fill_id"?: str}
```

* **Consumption.** The n-th `send` for an account uses the step with that account (or no account, in a single-account script) and `"call": n`. A missing step raises `AssertionError`: it is a test bug, not a runtime path.
* **Result mapping:** `not_sent` → `cls="not_sent"`; `reject` → `rejected` with the reason; `ack` → `acknowledged` with `order_id`; `timeout` → `ambiguous` with reason `timeout`. Without `legs`, every plan leg gets the step's class.
* **Stall.** A step with `"stall": "until_released"` blocks that call until the test releases it. This is how CUJ-DSP-1 holds account A in flight.
* **Book.** `BookStep`s change the simulated order book when the clock reaches `at`. Observation calls return that book with `domain = DomainEvidence("simulated", "simulated_adapter")` and `Coverage(complete="yes")`.
* It has no network or credential capability. Its composition binds only a simulation ledger, and every effect it reports is committed by the kernel through the normal outcome transaction.
* Any cost it reports is an injected assumption with a version (A07-F3, `README.md:889`).
* `Clock` and `RecordedClock` are defined in the [sessions spec clock contract](sessions-authority-lifecycle.md).

### Refusal codes

| Code | Meaning |
|---|---|
| DSP-R01 `deadline_passed` | The dispatch deadline passed before the claim |
| DSP-R02 `release_changed` | The bound release changed since admission |
| DSP-R03 `policy_changed` | The bound policy version changed since admission (entries) |

The busy refusal is `ADM-R12`, returned by admission.

## Failure modes and crash points

The ledger crash points CP-L2…CP-L4 and failure F-L5 apply ([ledger spec](ledger-and-atomic-transaction.md#failure-modes-and-crash-points)). The coordinator adds:

| CP | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-D1 | Crash with workers busy | On restart, readiness is rebuilt from index tables only; every claim with no outcome becomes ambiguous; nothing is duplicated | PRF-DSP-03 |
| F-D3 | Whole-kernel hang (writer thread stalled) | A different failure from slow I/O. The independent supervisor reports stalled demand (A03-F5) | Proved with the supervisor ([runtime spec](runtime-isolation-observability-deployment.md)) |
| F-D4 | Caller disconnects mid-request | The committed command continues; no cancel is created | PRF-DSP-06 |
| F-D5 | Outcome commit refused or failed | The process exits; recovery rebuilds the outcome from published evidence, or marks the claim ambiguous | PRF-DSP-03 |

## Policy inputs

All four are refusing parameters (REQ-XC-003): a composition that leaves one unbound refuses to load.

| Input | Source | Default |
|---|---|---|
| `dispatch.ordering_rule` | `admission_sequence`, or a value added after [Q-004](../decisions/owner-questions.md#q-004) | None |
| `adapter.http_timeout_ms` | Measured (A09-F4) | None; synthetic in tests |
| `coordinator.max_pending_per_account` | Measured (A09-F4) | None; synthetic in tests |
| `dispatch.deadline_ms.<verb>` | Approved policy where it exists; otherwise open (`README.md:758`) | None; synthetic in tests |

## Reuse evidence

* **Coordinator/OpenAlgoAdapter/ports: extract/refactor against D13–D15** (`README.md:1144`). Legacy `src/tier1/coordinator.py` reuse candidates:
  * `NotSent` (`:43`): an adapter raises it only when it can prove no request left the process;
  * `RETRYABLE` (`:37`): legacy allows a new attempt after a rejected or not-sent outcome; the target keeps only the not-sent case, because a rejected command is final;
  * `recover()` (`:139-155`): every send intent with no outcome becomes ambiguous; it sends nothing;
  * `resolve()` (`:157-170`): an ambiguity closes only from fresh broker evidence.
* **Do not reuse:**
  * `last_outcome` (`:81-92`) scans the whole ledger per call; the target reads the attempt's index row;
  * the route lock (LD-08), the uuid fallback (LD-01), and scope scanning as an implicit conflict rule (LD-02).
* **Legacy and shared worker replay: keep compatibility, converge selectively** (`README.md:1151`). The `src/data/replay_engine` no-send adapter is evidence for the simulated broker's disarmed shape.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Global lock around send (legacy) | Stalls all accounts behind one request; rejected by A03-F1 |
| Separate I/O process | Not required initially; needs measured justification (`README.md:914`) |
| In-memory durable queue | The ledger is the only durable queue (A03-F2) |
| Automatic retry on timeout | Forbidden: a missing response after possible transport is ambiguous (D14) |
| A worker timer shorter than the HTTP timeout, freeing the slot early | Lets a second request start while the first may still reach the broker, and creates late in-process results to handle |
| Refuse a command when a conflict appears after admission | Turns a temporary conflict into a lost command; waiting until the deadline keeps one rule |
| Revalidate inside the claim's SQLite transaction | Equivalent here, because all writes run on one thread; the separate step keeps `transact` free of coordinator logic |

## Proofs

| Proof | Class | Expected outcome | Break check |
|---|---|---|---|
| PRF-DSP-01 | T `tests/integration/test_dispatch_revalidation.py` | Each dependency row: a change between admission and claim gives `DISPATCH_REFUSED` with that row's code, and the first failing row wins; an unrelated append does not refuse; a session close does not refuse a cancel | Skipping revalidation sends a stale command |
| PRF-DSP-02 | T `tests/integration/test_entry_outcomes.py` | The adapter is called only after `DISPATCH_CLAIMED` is durable; the simulated broker sees exactly one call per attempt | Calling before the claim fails |
| PRF-DSP-03 | T `tests/recovery/test_crash_boundaries.py` | CP-D1 and F-D5: rebuilt readiness equals the pre-crash readiness; the busy claim becomes ambiguous; no second call | Persisting readiness separately creates a second queue |
| PRF-DSP-04 | T `tests/integration/test_dispatch_revalidation.py` | A conflict appearing after admission keeps the command waiting; it is sent after the conflict clears, or refused with `DSP-R01` when the deadline timer fires while it still waits | Refusing on conflict at dispatch, or never firing the deadline, fails |
| PRF-DSP-05 | T `tests/integration/test_bounded_io.py` | CUJ-DSP-1: B's cancel is sent while A is stalled | A global lock blocks B |
| PRF-DSP-06 | T `tests/integration/test_bounded_io.py` | CUJ-DSP-3 and F-D4: timeout gives ambiguous; a disconnect creates no cancel | Retrying on timeout fails |
| PRF-DSP-07 | T `tests/unit/test_scheduling.py` | `admission_sequence` picks the oldest eligible command and skips a blocked older one; an unbound rule refuses to load | Head-of-line blocking or implicit FIFO fails |
| PRF-DSP-08 | T `tests/integration/test_dispatch_revalidation.py` | A hold recorded after a claim leaves that request in flight and its outcome committed; a hold recorded before the claim refuses it with `PRT-R04` | Retracting an in-flight request, or claiming after the hold, fails |

## Delivery

SLICE-01 builds the claim-then-call path with a synchronous call outside any transaction, timeout to ambiguous and the scripted simulated broker for entry outcomes. SLICE-05 adds per-account workers, the deadline sweep, revalidation, scheduling, the busy count, kill and hold records and the cancel/modify/close verbs. See [plan/delivery-plan.md](../plan/delivery-plan.md).
