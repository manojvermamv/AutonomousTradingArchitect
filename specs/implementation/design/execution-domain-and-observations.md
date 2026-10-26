# Execution domain, observations and reconciliation

* **Status:** proposed (package spec), revised after EGM stages 5–7 ([review](../egm/execution-domain-and-observations/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive):** `adapters/openalgo.py`, `adapters/simulated_broker.py`, `kernel/reconciliation.py`, `kernel/ports.py`, `contracts/evidence.py`.
* **Not specified here:** `TransportResult` and `LegResult` live in `contracts/execution.py` ([ledger](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy)); this spec defines what the adapter puts in them. `kernel.lifecycle` turns reconciliation findings into ledger decisions, and `kernel.reservations` computes their amounts.
* **Consumers:** the coordinator ([dispatch](dispatch-and-coordination.md)); `kernel.lifecycle` ([ledger](ledger-and-atomic-transaction.md#event-catalogue)); the supervisor, through a native read-only adapter or the observation mediator ([below](#observation-enforcement-a06-f2)); `kernel.protection` and `kernel.safety` ([protection](protection-and-safety.md)).
* **Commits through:** `kernel.lifecycle`, which turns reconciliation findings into `RESOLVED_*`, `FILL`, `COMPLETED`, `CONFLICT_RECORDED`, `FOREIGN_RECORDED` and `RECONCILIATION_ESCALATED` ([ledger catalogue](ledger-and-atomic-transaction.md#event-catalogue); payloads [below](#reconciliation-events)). `RESIDUAL_RECORDED` is derived by `kernel.lifecycle` from outcomes and resolutions, not from a finding.
* **Master anchors:** D15 (`README.md:762`), ATA-06 (`:458`), Observation and Outcome rows (`:738-739`), A06-F2 (`:865`), A03-F4 (`:920-922`), Combined-F1 (`:786`), Combined-F2 (`:790`), OpenAlgo contract scope (`:494-498`), execution sequence step 6 (`:748`), outcome classes and analyzer (`:802`).
* **Terms:** see the [package glossary](../README.md#terms-used-across-the-specs). An attempt or leg is **unresolved** while its command is `UNCERTAIN` or it has no outcome; this spec uses only that word for the condition. **Resolve** applies to commands (reached or never reached); **release** applies to obligations (lowering or freeing a reservation). Domain values and assessment buckets are always written in backticks and qualified ("domain `unknown`", "the assessment's `unknown` list").
* **Policy rows:** POL-007, POL-009, POL-014, POL-016, POL-021 in the [policy inventory](../02-policy-inventory.md). **Refusing parameters** (no shipped default; the loader refuses a composition that leaves one unbound) are REQ-XC-003 in [cross-cutting-invariants](cross-cutting-invariants.md). Legacy paths are at `OA@445eb116`.

## Overview

The adapter reports **what it observed and how complete that observation is**. Reconciliation decides **what the observation establishes**: matched, conflicting, unattributed (foreign, or not yet attributable) or unknown.

Every request, outcome and observation carries execution-domain evidence: simulated, analyzer, live, unknown or conflicting. OpenAlgo selects analyzer or live on its own side. The target system records the evidence it gets. It never refuses a send because of the mode, and it never releases a live obligation on analyzer evidence.

## The problem

The legacy system has four weaknesses here:

* It reads the analyzer/live mode only as a cached, informational query that cannot tell "live" from "could not ask" (LD-12). Tier-1 records no per-effect domain.
* Its schema cannot store unknown or conflicting attribution (LD-06).
* OpenAlgo returns basket results whose wrapper success can hide failed legs, in completion order, and reports average prices that are not reliable partial-fill evidence (`README.md:496`).
* The broker order carries no project identity. Legacy ownership runs through the broker order ID recorded before sending, because OpenAlgo's order schema has no client tag (`OA/src/core/framework/execution/book.py:14-18`). When a place times out, there is no broker ID, and legacy adopts a unique same-shape order (LD-20).

The master accepted D15 (coverage and identity-based reconciliation), ATA-06 (explicit domain evidence) and A06-F2 (enforced read-only observation).

## Goals

1. Every effect and observation is attributable to a domain, or explicitly unknown or conflicting (ATA-06).
2. No obligation is released on an observation whose coverage, timing or domain cannot support the claim (D15).
3. Matching uses verified identities only (D15).
4. Facts about our own orders (reached, filled, completed) are always recorded once identity is verified, so protection and accounting never wait on a domain policy.
5. Foreign activity is recorded and never resolves a command of this system (D15, POL-009).
6. Observation access for processes other than the kernel cannot be turned into a write path (A06-F2).

## Non-goals

* Gating or refusing any send on analyzer mode (`README.md:458`, `:802`).
* Claiming deployed endpoint behaviour from source reading. Endpoint contracts are verified at the source (REQ-DOM-014).
* Choosing how a timed-out place with no broker ID is resolved ([Q-007](../decisions/owner-questions.md#q-007)), how a timed-out attempt of unknown domain is resolved ([Q-012](../decisions/owner-questions.md#q-012)), or how non-live obligations count against capacity ([Q-008](../decisions/owner-questions.md#q-008)).
* Absence proven by corroborating evidence from other endpoints. D15 allows it (`README.md:762`); this package accepts only contract-backed coverage until TASK-S07-05 shows a need. That is stricter, never looser.

## Requirement keys

| Key | Label | Decision (anchor) | Proof |
|---|---|---|---|
| REQ-DOM-001 | Domain evidence is recorded per request, outcome and observation; a cached or session-level mode read is context, not proof | ATA-06 (`README.md:458`); LD-12 | PRF-DOM-01 |
| REQ-DOM-002 | Domain values include explicit `unknown` and `conflicting`; an absent marker is not proof of live | ATA-06; LD-06 | PRF-DOM-01 |
| REQ-DOM-003 | No send is refused because of analyzer mode | ATA-06; `README.md:802` | PRF-DOM-08 |
| REQ-DOM-004 | Releasing obligations and performance claims need a verified identity and a non-conflicting domain; analyzer results never count as live performance | ATA-06; A03-F4 (`:922`) | PRF-DOM-08 |
| REQ-DOM-005 | Observations carry account, source, endpoint, covered interval, as-of, arrival, pages or cursors, watermark, raw evidence; query success is not completeness | D15; Observation row (`:738`) | PRF-DOM-02 |
| REQ-DOM-006 | Matching uses verified identities; similarity never resolves a command | D15; LD-20 | PRF-DOM-02 |
| REQ-DOM-007 | Absence counts only over a window that the endpoint's coverage contract supports, observed after the result could be visible | D15; `README.md:745` | PRF-DOM-09 |
| REQ-DOM-008 | Foreign activity and conflicts stay attributable; an order an unresolved attempt or leg could account for is never recorded as foreign | D15; POL-009 | PRF-DOM-02 |
| REQ-DOM-009 | The adapter exposes transport classes, enforces a total deadline, and makes no hidden retries | D14 (`:760`); A03-F1 (`:914`) | PRF-DOM-04 |
| REQ-DOM-010 | Basket and status results are read per leg; wrapper success does not mean every leg succeeded; a zero average price is not fill evidence | OpenAlgo scope (`:494-498`) | PRF-DOM-04 |
| REQ-DOM-011 | Observation freshness 60 s for dependent decisions; a close without a fill total stays working; a modify proven by a changed row records the broker's level | POL-021, POL-016, POL-014 | PRF-DOM-03 |
| REQ-DOM-012 | Observation by processes other than the kernel is read-only by enforcement: proven native read-only credentials, otherwise a typed mediator | A06-F2 (`:865`) | PRF-DOM-06, -10 |
| REQ-DOM-013 | External evidence is durably published before a ledger reference to it commits | Combined-F2 (`:790`) | PRF-DOM-05 |
| REQ-DOM-014 | Consumed endpoint contracts, including client-tag round trip and visibility bounds, are verified at the source before broker-specific acceptance | ATA-06; `README.md:1352-1354` | PRF-DOM-07 |
| REQ-DOM-015 | Reach, fills and completion are recorded for every identity-matched item, whatever its domain | Goal 4; D16 (`:764`) | PRF-DOM-08 |

## Critical user journeys

### CUJ-DOM-1: Mode switched between request and observation

* **Given** an entry acknowledged with domain evidence `analyzer` and broker order ID `A1`.
* **When** the operator switches OpenAlgo to live, and the next orderbook observation (domain `live`) shows no `A1`.
* **Then** the live book says nothing about `A1`: no absence finding, no conflict, nothing released. Later sends proceed unaffected. If a `live` book ever shows `A1`, that identity match in another domain is a `CONFLICT_RECORDED` with escalation (PRF-DOM-08).

### CUJ-DOM-2: Missing page

* **Given** an uncertain cancel.
* **When** the tradebook query returns page 1 of 2 and the page-2 request fails.
* **Then** the observation has `complete = no`, and the command stays `UNCERTAIN` (PRF-DOM-02).

### CUJ-DOM-3: Basket with one failed leg

* **Given** a two-leg structure entry sent as one basket call.
* **When** the response shows one leg rejected and one acknowledged with an order ID our response returned.
* **Then** the adapter returns each leg's result and the command class `acknowledged`, and ignores the wrapper's success (PRF-DOM-04). The ledger effects (the rejected leg's reservation released, the acknowledged leg recorded as residual) are proved by PRF-LED-11.

### CUJ-DOM-4: Timed-out place, no broker ID

* **Given** an entry place that timed out (`ambiguous`, no broker ID), and no verified client tag.
* **When** a fresh, complete orderbook shows one unattributed order of the same instrument, side and quantity inside the attempt window.
* **Then** the order is **not** adopted (LD-20) and **not** recorded as foreign. Both stay unresolved and escalated, and the reservation is kept. The final resolution is [Q-007](../decisions/owner-questions.md#q-007) (PRF-DOM-02).

## Technical plan

### Evidence contract (`contracts/evidence.py`)

```text
DomainEvidence(value: simulated | analyzer | live | unknown | conflicting)
ModeRead(value: analyze | live | unknown, read_at: Timestamp, detail: str)   # a separate display reading
EvidenceRef(store, content_digest, published_at)
Interval(start: Timestamp, end: Timestamp)
Coverage(endpoint, interval: Interval | None, pages_seen, pages_total | None,
         cursor | None, watermark | None, complete: yes | no | unknown)
Observation(account_id, source, endpoint, as_of, arrived_at, coverage: Coverage,
            items: list[ObservedOrder | ObservedTrade | ObservedPosition | ObservedFunds],
            domain: DomainEvidence, raw: EvidenceRef)
ObservedOrder(broker_order_id, instrument, side, quantity, filled_quantity | None,
              status: open | filled | cancelled | rejected | expired | unknown,
              price | None, trigger_price | None, placed_at | None, client_tag | None)
ObservedTrade(fill_id, broker_order_id, instrument, side, quantity, price, traded_at)
ObservedPosition(instrument, net_quantity, average_price | None,   # average price is never fill evidence
                 realized_pnl | None, mtm_pnl | None)              # broker-reported; the latch's input
ObservedFunds(available, margin_available, as_of)        # broker-reported; capacity's input
EndpointContract(endpoint, deployment_version, mode_marker_field | None,
                 coverage_rule: complete_when_all_pages | unknown, covers: trading_day_to_read | None,
                 visibility_secs | None,
                 client_tag_field | None, status_mapping, verified_by: EvidenceRef)
```

* **`as_of`** is stamped immediately **before** the read (legacy `not_fresh`, `reconcile.py:693-711`); `arrived_at` when the response arrived.
* **`ModeRead.value`** uses OpenAlgo's own word `analyze`; `DomainEvidence.value` uses `analyzer`. A `ModeRead` is its own reading, never attached to an effect; only operator displays and the supervisor read it. Admission, dispatch and reconciliation never read it (LD-12; `analyze_mode()` is informational).
* **Ledger envelope.** An event's `execution_domain` is the `DomainEvidence.value` it carries, or `none` for an event with no external effect.
* **`EvidenceRef.store`** is `evidence` (production) or `simulated` (inline). The adapter is the evidence owner for transport results and observations (Combined-F2): its digest is computed over the normalized JSON of the endpoint, request parameters, response body and `arrived_at`, so each poll has its own digest even when the body is unchanged. An observation is **published only when a decision is about to reference it** (publish-before-reference, Combined-F2); the loop holds the raw response in memory until then; storage classes and retention are the [runtime spec](runtime-isolation-observability-deployment.md)'s (A09-F3).
* **`Coverage.interval`** is set from the endpoint contract's `covers`: for `trading_day_to_read` it is the trading day's start to `as_of`. With no contract it is `None`, and absence is never usable. Pages and cursors are filled where the endpoint has them.
* **Observation identity** is `raw.content_digest`. Redelivering one published observation (same digest) is a no-op.
* **Transport-result evidence.** The adapter publishes a transport result inside its own total deadline, with `command_key` and `attempt_no` in the published document; the store finds it by that pair, which is recovery's lookup (REQ-LED-014). If publishing fails, the result's `raw` is empty.
* **`EndpointContract`** records are produced by TASK-S07-05 from captured responses and bound with the release ([configuration spec](configuration-artifacts-release.md)). No record for an endpoint means: no mode marker, coverage `unknown`, no visibility bound, no client tag, and the legacy status classifier.

### OpenAlgo adapter (`adapters/openalgo.py`)

**What the adapter puts in `TransportResult`.**

* One `LegResult` per plan leg for an entry; one leg with role equal to the verb (`cancel`, `modify`, `close`) otherwise.
* **Leg roles in a basket.** OpenAlgo returns basket results in completion order, not plan order (`README.md:496`). The adapter assigns a returned order ID to a leg only through the legacy validated join: a fresh orderbook row for that ID whose instrument, side and quantity match exactly one unassigned leg (`OA/src/tier1/openalgo_adapter.py:25-28`, `:85-90`). That row comes from an `ObservationPort.orderbook` call made inside the send's total deadline, published as evidence like any other observation; no other read happens inside `send`. This is not D15 similarity matching: the ID itself came from our own response. IDs the join cannot assign are kept as `unassigned_order_ids` on the attempt, so they are never lost.
* **Command class:** `acknowledged` if any leg is acknowledged and none is ambiguous; `rejected` if every leg is rejected; `not_sent` only when the adapter can prove no request left the process; `ambiguous` otherwise. A legacy `invalid` result maps to `ambiguous`.

**Transport classes** (REQ-DOM-009):

| Failure | Class | Why |
|---|---|---|
| DNS failure, connection refused, TLS handshake failure | `not_sent` | No request bytes were written; the adapter raises `NotSent` internally |
| Any failure after request bytes started to be written | `ambiguous` | The broker may have received it |
| Total deadline `adapter.http_timeout_ms` passed (covering resolution, connect, write and read) | `ambiguous` | Same |
| HTTP 5xx, or 4xx without a parsable body | `ambiguous` | Same |
| HTTP 429 from OpenAlgo's rate limiter | per the captured `status_mapping`; `ambiguous` until characterized | Whether OpenAlgo forwarded the request is not yet proven |
| HTTP 2xx or 4xx with a parsable per-leg body | per leg, by `status_mapping` and the legacy classifier | — |

The adapter uses the REST backend, not the SDK client, because a timed-out synchronous SDK call can outlive its cancellation (legacy note at `OA/src/interfaces/mcp/core/openalgo.py:509-518`). It disables HTTP-client retries and uses no retry wrapper. It fetches every page of one query; if any page fails, it returns the pages it has with `complete = no`. Observations are never merged across calls.

### Simulated broker (`adapters/simulated_broker.py`)

```text
SimulatedBroker(responder: ScriptResponder | RuleResponder, clock: Clock,
                coverage: "yes" | "no" | "unknown" = "yes")
  send(request, plan | None, attempt_no) -> TransportResult                         # BrokerPort
  orderbook(account) / tradebook(account) -> Observation                            # ObservationPort
  positions(account) / funds(account) -> Observation
```

* **`ScriptResponder`** (tests and SLICE-01). Its steps are consumed per account in call order; the step format is fixed in the SLICE-01 file ([row 10](../plan/slices/SLICE-01-disarmed-financial-core.md)), and a missing step is a test bug.

  | Script `result` | `cls` | Carries |
  |---|---|---|
  | `not_sent` | `not_sent` | — |
  | `reject` | `rejected` | reason |
  | `ack` | `acknowledged` | `order_id`; the order enters the book as open |
  | `timeout` | `ambiguous` | reason `timeout` |
  | `raise` | — | raises inside the adapter, to exercise `adapter_error` |

  A `"stall": "until_released"` step blocks the call until the test releases it (CUJ-DSP-1). `BookStep`s (fills and status changes at a clock time) refer to acknowledged orders, so the book stays coherent with the sends.
* **`RuleResponder`** (simulation runs). It accepts every request and fills it under a versioned fill and cost model injected by the run (A07-F3, `README.md:889`; owned by the [research spec](research-rl-custody-promotion.md)), so an open-ended run needs no script.
* Every result and observation carries domain `simulated`; nothing can configure another domain. `coverage` lets tests exercise incomplete coverage; domain conflicts are tested on constructed values at the reconciliation unit level.
* `funds` returns one `ObservedFunds` from the responder (a fixed amount for scripts, the run's capital for `RuleResponder`), so admission check B5 can run in simulation.
* It has no network or credential capability. Its composition binds only a simulation ledger, and every effect it reports is committed by the kernel through the normal outcome commit.

### Ports (`kernel/ports.py`)

```text
BrokerPort.send(request: ActionRequest, plan: PlanRef | None, attempt_no: int) -> TransportResult
ObservationPort.orderbook(account) -> Observation          # the endpoint's own coverage (Coverage.interval)
ObservationPort.tradebook(account) -> Observation
ObservationPort.positions(account) -> Observation          # a snapshot; interval is None
ObservationPort.funds(account) -> Observation              # one ObservedFunds item; a snapshot
```

* The [simulated broker](#simulated-broker-adapterssimulated_brokerpy) implements both ports with these signatures; its observations cover the run so far.
* The production composition binds `adapters.openalgo`; each simulation binds `adapters.simulated_broker`. No composition binds both (`README.md:800`).

### Domain attribution and combination

| Situation | Recorded domain |
|---|---|
| Simulated adapter | `simulated` |
| Response carries the endpoint contract's verified mode marker | That value |
| No per-effect marker | `unknown`; a session mode read is never attached |

**Combining** an attempt's domain with an observation's applies only to an **identity-matched** item. The table is symmetric: either value may be in the first column.

| One | Other | Combined |
|---|---|---|
| `unknown` | `unknown` | `unknown` |
| `unknown` | X (analyzer or live) | X |
| X | X | X |
| X | Y, different, neither `unknown` | `conflicting` |
| `conflicting` | anything | `conflicting` |
| `simulated` | `simulated` | `simulated` |
| `simulated` | anything else | `conflicting` (cannot happen in a valid composition) |

**Identity is the broker value alone** (ledger `broker_identity` is keyed by kind and value; the domain is an attribute). An observation of one domain says nothing about the **absence** of an attempt of another domain or of `unknown` domain.

**What the domain gates.**

* **Always recorded** for an identity-matched item, whatever the domain: reach (`RESOLVED_REACHED`), fills, completion. Each is labelled with the combined domain. So protection and accounting proceed for any order we can identify.
* **Gated:** releasing an obligation (lowering or freeing a reservation) and any performance, promotion or economics claim.
  * `conflicting` never releases and is escalated.
  * `unknown` releases only if `reconciliation.unknown_domain_settlement` is `accounting_only` ([Q-006](../decisions/owner-questions.md#q-006)); under `forbid` the obligation stays reserved.
  * `analyzer`, `unknown` and `conflicting` never count as live performance.
* Whether analyzer, unknown and conflicting obligations count against **live capacity** is the refusing parameter `capacity.count_non_live_obligations` ([Q-008](../decisions/owner-questions.md#q-008)). D16 keeps them reserved either way.

**Escalation** means `kernel.lifecycle` records `RECONCILIATION_ESCALATED` ([payload below](#reconciliation-events)), once per subject and reason, and the operator alert route reads it ([runtime spec](runtime-isolation-observability-deployment.md)).

### Reconciliation (`kernel/reconciliation.py`)

```text
assess(observation, ledger_view, policy, now: Timestamp) -> Assessment
findings(assessment) -> list[Finding]        # kernel.lifecycle turns findings into ledger decisions
Finding(kind: reached | never_reached | fill | completed | conflict | foreign | escalate,
        command_key | None, attempt_no | None, leg_role | None, item | None,
        observation_digest, reason)
Assessment(matched: list[(command_key, attempt_no, leg_role | None, item)],
           conflicting: list[(command_key | None, items, reason)],
           unattributed: list[(item, could_account_for: list[(command_key, leg_role | None)])],
           unknown: list[(command_key, attempt_no)],   # unresolved, no usable evidence yet
           gaps: list[(endpoint, reason)])              # why coverage could not be used; kept in the assessment only
```

* **Pure.** `assess` reads only its arguments; `now` comes from the injected clock (Combined-F1). It never writes. The supervisor records its assessments only as non-authoritative evidence (A03-F4).
* **`ledger_view`** is a read-only snapshot, for one account, of the command, attempt (with each attempt's `claimed_at`, domain, endpoint-contract version and `unassigned_order_ids`), reservation, broker-identity and `reconciliation_fact` index rows.
* **No regression, no repeats.** The ledger's state guards already make findings idempotent: `RESOLVED_*` applies only from `UNCERTAIN`, `COMPLETED` only from `WORKING`, and a fill ID counts once (I-4). `kernel.lifecycle` drops a finding those guards would refuse, without recording a refusal. `CONFLICT_RECORDED`, `FOREIGN_RECORDED` and `RECONCILIATION_ESCALATED` are recorded once per key in the `reconciliation_fact` index table. The observation loop keeps, in memory, the latest `as_of` per broker order ID and ignores an older observation of that order, so a reordered poll never produces a finding.
* **`policy`** carries `unknown_domain_settlement`, the 60 s bound, `reconciliation.clock_skew_secs`, `reconciliation.working_escalation_secs` and the endpoint contracts.

**Verified identity** is a broker order ID recorded on the attempt (assigned to a leg, or in `unassigned_order_ids`), or a client tag whose round trip the endpoint contract records. The client-tag item defaults to **not available** (`book.py:14-18`). Attempts claimed under a later contract with a verified tag use it; earlier attempts keep the contract version they were claimed under.

**Attempt window** for an attempt or leg: from `claimed_at − clock_skew_secs` to the attempt's outcome time plus the endpoint's `visibility_secs` plus `clock_skew_secs`.

**Absence is usable** only when all hold:

* the endpoint contract makes coverage `complete` and `Coverage.interval` contains the window;
* `as_of` is at or after the window's end (with no `visibility_secs` recorded, absence is never usable);
* the window is not empty or inverted;
* the attempt's own recorded domain is known and equal to the observation's domain. An attempt with no usable response has domain `unknown`, so this rarely holds for a timed-out attempt; such attempts are escalated and their resolution is [Q-012](../decisions/owner-questions.md#q-012). Until Q-012 is decided, the never-reached rows below apply only to attempts whose domain is known.

**An attempt or leg could account for an order** when it is unresolved, on the same account, and the order's `placed_at` falls inside its window (or is unknown), unless a verified identity already ties the order to another command.

**Evaluation order** for each observation:

1. **Freshness.** If `abs(now − as_of)` exceeds 60 s (POL-021), reconciliation ignores the observation: no finding of any kind.
2. **Identity matches**, per command and per leg (an item may match more than one command, for example an entry and a cancel of it; each is judged on its own), then the **domain** of each match.
3. **Per-verb evidence** (below), fills, and completion by the ledger's [verb rules](ledger-and-atomic-transaction.md#command-and-attempt-state-machine).
4. **Absence** findings, where absence is usable.
5. **Unattributed orders**: an order no unresolved attempt or leg could account for becomes `FOREIGN_RECORDED`, once per order ID. It is an audit fact; capacity counts external activity from broker observations, not from this record ([intent spec](intent-to-admission.md#admission-kerneladmissionpy)).

**Per-verb evidence:**

| Verb | Reached | Never reached (absence usable) |
|---|---|---|
| entry | Its order ID or tag appears | No order with its identity in the window |
| cancel | The target order is observed terminal after the claim | The target is observed open and unchanged |
| modify | The target shows the requested parameters, or a level different from the recorded one (POL-014; legacy requires a change, `reconcile.py:756-757`); a response that replaced the order ID records the new ID as a replacement | The target is observed unchanged |
| close | Its order ID appears | No order with its identity in the window |


**Rules table:**

| Case | Finding |
|---|---|
| Uncertain attempt or leg; reached evidence | `RESOLVED_REACHED` |
| New fill ID for a known order | `FILL` (counted once, ledger I-4) |
| Working command; its verb's completion rule is met | `COMPLETED` (a modify with its confirmed level) |
| Close shows terminal with no fill total (`filled_quantity` is `None`) | No completion; the close stays `WORKING` and is escalated after `reconciliation.working_escalation_secs` (POL-016) |
| Uncertain attempt with verified identity; absence usable; never-reached evidence | `RESOLVED_NEVER_REACHED` (per leg for a basket) |
| Uncertain attempt with no verified identity; absence usable; every order in the window tied by verified identity to another command | `RESOLVED_NEVER_REACHED` |
| Uncertain attempt with no verified identity; an order it could account for | No change; escalated ([Q-007](../decisions/owner-questions.md#q-007)) |
| Uncertain attempt of domain `unknown` with no reached evidence | No change; escalated (`unknown_domain_unresolved`, [Q-012](../decisions/owner-questions.md#q-012)) |
| Absence not usable | No change; the reason stays in the assessment's gaps |
| Identity-matched order whose combined domain is `conflicting` | `CONFLICT_RECORDED` and escalation |
| Identity-matched order of a command recorded `REJECTED` or `RESOLVED_NEVER_REACHED` | `CONFLICT_RECORDED` and escalation; capacity counts the order through broker observations |
| An order ID recorded under one domain appears in another domain's book | `CONFLICT_RECORDED` and escalation (CUJ-DOM-1); a genuine cross-domain ID collision lands here too, which only escalates |
| Order no unresolved attempt or leg could account for | `FOREIGN_RECORDED`; never resolves a command |
| Position quantities | Corroboration only; a close never completes from a netted position |
| `WORKING` command with no completion `reconciliation.working_escalation_secs` after its last change | Escalation, so an unconfirmed cancel cannot silently block its exposure group |

#### Reconciliation events

| Event | Payload | Recorded once per |
|---|---|---|
| `CONFLICT_RECORDED` | `command_key` or none, `broker_order_id`, `attempt_domain`, `observed_domain`, `reason` (`domain_conflict`, `after_rejected`, `after_never_reached`, `cross_domain_id`), `observation_digest` | (`broker_order_id`, `reason`) |
| `FOREIGN_RECORDED` | `broker_order_id`, `account`, `instrument`, `side`, `quantity`, `observation_digest` | `broker_order_id` |
| `RECONCILIATION_ESCALATED` | `subject` (command key, broker order ID, or `position_id` for protection's reasons), `reason` (`domain_conflict`, `untagged_timeout` (Q-007), `unknown_domain_unresolved` (Q-012), `close_without_fill_total`, `working_without_completion`, or a protection reason from the [protection catalogue](protection-and-safety.md#event-catalogue)), `observation_digest` or none | (`subject`, `reason`) |

All three fold into the `reconciliation_fact` index table, keyed as shown, which is how each is recorded once.

### Observation enforcement (A06-F2)

* **The kernel observes directly** through its own adapter: it already holds the trading credential to send, so a mediator would add a hop with no security gain.
* **Every other process** (the supervisor, operator tools) observes read-only, by one of two routes, chosen by the deployment (A06-F2, `README.md:865`):
  * **native read-only credentials**, when TASK-S07-06 proves at the endpoint that the credential cannot place (a captured place attempt is refused; capturing it needs the owner's authorization). The supervisor then uses a read-only `ObservationPort` adapter directly and no mediator is built;
  * otherwise, the **observation mediator**, specified here (the runtime spec only supervises its process):
  * a separate, supervised process that holds a read credential and serves only `orderbook`, `tradebook` and `positions` for its bound accounts, from an allowlist like legacy `SdkBackend.READ_ENDPOINTS` (`OA/src/interfaces/mcp/core/openalgo.py:314-323`);
  * callers authenticate on its local socket (`DOM-R02` (`unauthenticated`) otherwise); any request outside the three queries returns `DOM-R01` (`not_allowlisted`); callers cannot reach the credential or choose an endpoint;
  * it checks account, domain and coverage on every response (`README.md:865`) and keeps serving while the kernel is down.
* The legacy read-only MCP endpoint excludes the order-capable domain altogether (`OA/src/interfaces/mcp/gateway.py:95-110`), so it serves no broker book queries either; the mediator reuses the read allowlist above, and the socket and authentication are new work.

### Polling

* **Owner.** The observation loop is part of `kernel/reconciliation.py` (a small `ObservationLoop` beside the pure `assess`). It runs one reader thread per bound account, separate from the account's send worker, so reads continue during slow sends (A03-F1 allows bounded reads). Each arrival is queued to the writer thread, which runs `assess`, `findings`, `kernel.lifecycle` and `transact`. It commits in `RECOVERY_WRITING` (after recovery steps 1–3; A04-F1) and `OPERATING` ([sessions stage table](sessions-authority-lifecycle.md#actions-per-stage)).
* The kernel's observation loop polls each bound account's orderbook, tradebook, positions and funds every `observation.poll_interval_secs` (a measured refusing parameter). The supervisor polls through the mediator and never faster.
* Both stay inside `observation.max_requests_per_minute` per account (a measured refusing parameter, A09-F4), so OpenAlgo's rate limits are respected (`README.md:922`).
* **Dependent decisions** that need a fresh observation: admission refuses (`ADM-R05`, [intent spec](intent-to-admission.md#admission-kerneladmissionpy)), dispatch revalidation row 6 waits, and reconciliation ignores the stale observation. The observation loop keeps each account's latest observation of every kind in memory, with its `as_of`, for these reads, and each arrival wakes the coordinator.

### Refusal codes

| Code | Meaning |
|---|---|
| `DOM-R01` (`not_allowlisted`) | The mediator was asked for anything but its three queries |
| `DOM-R02` (`unauthenticated`) | The mediator's caller did not authenticate |

## Failure modes and crash points

| ID | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-O1 | Crash after evidence publication, before the ledger reference commits | The orphan object is harmless; the retry reuses the same digest (Combined-F2) | PRF-DOM-05 |
| CP-O2 | Crash during a reconciliation commit | Atomic: the full transition or none (AUD-02) | PRF-DOM-05 |
| F-O3 | Observation older than 60 s, or stamped in the future | Used for nothing (POL-021) | PRF-DOM-03 |
| F-O4 | OpenAlgo returns success with an empty book | Unknown coverage unless the endpoint contract proves completeness | PRF-DOM-02 |
| F-O5 | Mediator asked to place an order | Refused (`DOM-R01` (`not_allowlisted`)) | PRF-DOM-06 |
| F-O6 | The same observation delivered twice | No-op (same digest) | PRF-DOM-02 |
| F-O7 | An observation stamped (`as_of`) before an attempt's timeout arrives after the timeout | Absence not usable (window and visibility rules) | PRF-DOM-09 |
| F-O9 | A page fails (CUJ-DOM-2) | `complete = no`; nothing resolves | PRF-DOM-02 |
| F-O10 | The mediator is down | Only non-kernel observers lose observations; the kernel is unaffected; the supervisor reports it | PRF-DOM-06 |
| F-O11 | Publishing an observation fails | The decision that would reference it is not committed; later observations are unaffected | PRF-DOM-05 |
| F-O8 | A slow-drip response | The total deadline ends the call; `ambiguous` | PRF-DOM-04 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| Under Q-007, a timed-out untagged place holds its reservation and its POL-007 slot until the owner acts | Escalated at once; resolving it is Q-007 |
| Under `forbid`, obligations of unmarked effects never release | Facts are still recorded and protection proceeds; Q-006 states the capacity cost |
| Evidence and event volume from polling | Edge-triggered findings; only referenced observations kept; request budget per account |
| Clock skew between the broker and the host | Windows widened by `clock_skew_secs` on both ends |
| The mediator is a single process for non-kernel observers | Built only without native read-only proof; supervised and restarted; the kernel does not depend on it |
| Timed-out attempts of unknown domain stay unresolved (Q-012), including protective modifies | Escalated once at once; protection escalates a frozen stop; the broker stop still rests |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Observation freshness | POL-021 (60 s) | Approved value in the bound policy |
| `reconciliation.unknown_domain_settlement` | [Q-006](../decisions/owner-questions.md#q-006) | None: refusing |
| `capacity.count_non_live_obligations` | [Q-008](../decisions/owner-questions.md#q-008) | None: refusing |
| `reconciliation.clock_skew_secs` | Measured with the clock-quality evidence | None: refusing |
| `reconciliation.working_escalation_secs` | Measured (A09-F4) | None: refusing |
| `observation.poll_interval_secs`, `observation.max_requests_per_minute` | Measured (A09-F4) | None: refusing |
| Endpoint contracts (mode marker, coverage rule, `covers`, `visibility_secs`, client tag, status mapping) | Verified at source (TASK-S07-05) | No record: the conservative values above |

`adapter.http_timeout_ms` is owned by the [dispatch spec](dispatch-and-coordination.md#policy-inputs).

## Reuse evidence

* **Coordinator/OpenAlgoAdapter/ports: extract/refactor** (`README.md:1144`), under `OA/src/`:
  * `tier1/openalgo_adapter.py` `classify` (`:56-103`) with `core/basket_observation.py`: per-leg results and the validated join;
  * `tier1/ports.py` `BrokerObservationPort` (`:183`): the 60 s bound, the refusal to classify a commanded execution as non-owned (`:356-358`);
  * `core/framework/execution/reconcile.py` `not_fresh` (`:693-711`) and `record_stop_levels` (`:778`; changed-level rule `:756-757`).
* **Gateway/JSONL registry/reconcile: refactor ownership** (`README.md:1146`). Strict identity joins (`reconcile.py` `mine`/`not_mine`, `:107-128`) are retained; JSONL writes are not.
* **Do not reuse:** shape-based adoption of `UNKNOWN` orders (`reconcile.py:130-182`, `resolve_unknown` from `:410`); see LD-20.
* **Divergences:** LD-06, LD-12, LD-20 ([legacy-divergence](../legacy-divergence.md)).

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Attribute by a session mode read | A cached read is context only (ATA-06) |
| Refuse sends when the mode is analyzer | Forbidden (`README.md:802`) |
| Treat repeated identical polls as complete | D15 |
| Adopt a unique same-shape order (legacy) | Similarity cannot resolve a command (D15); LD-20 |
| Record an unattributed order as foreign at once | It may be our own timed-out place |
| Gate all findings on domain | Leaves real positions without protection or accounting |
| Use any observation's domain to prove an unmarked attempt absent | A different-domain book says nothing about it |
| Route the kernel's own observations through the mediator | The kernel already holds the trading credential; the mediator protects other processes |
| Re-emit findings on every poll | Unbounded event volume; state guards and `reconciliation_fact` carry the same facts once |
| An `observed_order` index of the latest state per order | No event would write it, so D04 could not rebuild it; the state guards already prevent regression |
| A `foreign_order` table for capacity | Capacity already reads broker observations; two sources would double-count |
| Publish every poll | Combined-F2 needs publish-before-reference only; eager publishing makes an evidence-store fault stall everything |

## Proofs

Class **T** is an automated test; **M** is a measurement or deployment record.

| Proof | Class | Test file | Expected outcome | Must fail if |
|---|---|---|---|---|
| PRF-DOM-01 | T | `tests/unit/test_domain_attribution.py` | Attribution and combination tables, both orders; a missing marker gives `unknown`; combination applies only to identity matches; a mode read is never attached to an effect | live is assumed by default |
| PRF-DOM-02 | T | `tests/unit/test_reconciliation_rules.py` | Each rules-table row and the evaluation order; per-verb evidence; each conflict, foreign record and escalation once per key; older observations ignored; a redelivered observation is a no-op (F-O6); observation fields complete; the liveness row with `working_escalation_secs`; an unknown-domain timeout escalates once; CUJ-DOM-2 and -4; unresolved legs account for orders | empty is taken as flat, or shape adopts |
| PRF-DOM-03 | T | `tests/unit/test_reconciliation_rules.py` | POL-016 (no fill total), POL-014 (changed level only), POL-021 (`abs(age)`, future stamps) | a stale or future observation is used |
| PRF-DOM-04 | T | `tests/integration/test_openalgo_contract.py` | Recorded basket responses give per-leg results, the validated join through a published orderbook observation inside the deadline, unassigned IDs and the command class; transport-failure rows; a zero average price is never fill evidence; a socket-level fake that drips its response is cut off at the total deadline | the wrapper alone is read, or a call outlives its deadline |
| PRF-DOM-05 | T | `tests/recovery/test_crash_boundaries.py` | CP-O1, CP-O2, F-O11 | a ledger reference commits before its evidence is published |
| PRF-DOM-06 | T | `tests/contracts/test_capabilities.py` | Built only when native read-only proof is absent. The mediator exposes no write call; other requests get `DOM-R01` (`not_allowlisted`) and unauthenticated callers `DOM-R02` (`unauthenticated`); it serves with the kernel down; the credential is unreachable | a caller can route a write or read the credential |
| PRF-DOM-07 | M | deployment record | OpenAlgo analyze and live responses captured and classified for each consumed endpoint; endpoint contracts produced, including visibility bounds and tag round trip | — (needs authorization) |
| PRF-DOM-08 | T | `tests/integration/test_shared_engine.py` | CUJ-DOM-1; an identity match in another domain gives `CONFLICT_RECORDED`; no send is refused; facts are recorded under `forbid` while releases wait; an unbound parameter refuses to load | an obligation is released across domains, or a fact is dropped |
| PRF-DOM-09 | T | `tests/unit/test_reconciliation_rules.py` | F-O7: windows that are empty, inverted, not contained in the covered interval, or observed before the window's end give no absence finding; boundary cases at exactly the bound | absence is accepted too early |
| PRF-DOM-10 | M | deployment record | Native read-only credential proof: a captured place attempt with that credential is refused by the broker (TASK-S07-06; needs the owner's authorization) | the broker accepts the place |

## Delivery

| Slice | Keys | Proofs |
|---|---|---|
| SLICE-01 | REQ-DOM-002 (domain `simulated` on every outcome); the broker order ID as the only identity | PRF-DSP-12 |
| SLICE-02 | REQ-DOM-013 (with the evidence store) | PRF-DOM-05 |
| SLICE-07 | REQ-DOM-001, -002 (`unknown`, `conflicting`), -003…-011, -014, -015; the native read-only branch of REQ-DOM-012 | PRF-DOM-01…04, -08, -09; PRF-DOM-07 and -10 on authorization |
| SLICE-11 (only without native read-only proof) | REQ-DOM-012: the mediator | PRF-DOM-06 |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
