# Execution domain, observations and reconciliation

* **Status:** proposed (package spec), revised after EGM stages 5 and 6 ([review](../egm/execution-domain-and-observations/review.md)). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item, never an edit here.
* **Specified here (exclusive):** `adapters/openalgo.py`, `kernel/reconciliation.py`, `kernel/ports.py`, `contracts/evidence.py`.
* **Not specified here:** `TransportResult` and `LegResult` live in `contracts/execution.py`, specified in [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy). This spec defines what the adapter puts in them.
* **Consumers:**
  * `kernel/coordinator.py` uses the broker port ([dispatch](dispatch-and-coordination.md));
  * `kernel/lifecycle.py` turns reconciliation decisions into ledger events ([ledger](ledger-and-atomic-transaction.md#event-catalogue));
  * `operations/supervisor.py` uses the observation port and the pure reconciliation functions ([runtime spec](runtime-isolation-observability-deployment.md));
  * `kernel/protection.py` uses confirmed protection evidence ([protection](protection-and-safety.md)).
* **Master anchors:** D15 (`README.md:762`), ATA-06 (`:458`), Observation and Outcome rows (`:738-739`), A06-F2 (`:865`), A03-F4 (`:920-922`), Combined-F2 (`:790`), OpenAlgo contract scope (`:494-498`), execution sequence step 6 (`:748`).
* **Policy rows used:** POL-009 (foreign activity), POL-014 (broker level after modify), POL-016 (close without fill total), POL-021 (60 s observation bound), all in the [policy inventory](../02-policy-inventory.md). **Refusing parameters** (a policy field with no default; the loader refuses a policy that omits it) are REQ-XC-003 in [cross-cutting-invariants](cross-cutting-invariants.md).

## Overview

The adapter reports **what it observed and how complete that observation is**. Reconciliation decides **what the observation establishes**:

* matched;
* conflicting;
* unattributed (foreign, or not yet attributable);
* unknown.

Every request, outcome and observation carries execution-domain evidence: simulated, analyzer, live, unknown or conflicting. OpenAlgo selects analyzer or live on its own side. The target records the evidence it gets. It never refuses a send because of the mode, and it never settles a live obligation from analyzer evidence.

## The problem

The legacy system has four weaknesses here:

* It reads the analyzer/live mode only as a cached, informational query that cannot tell "live" from "could not ask" (LD-12). Tier-1 records no per-effect domain.
* Its schema cannot store unknown or conflicting attribution (LD-06).
* Upstream OpenAlgo returns basket results whose wrapper success can hide failed legs, and reports average prices that are not reliable partial-fill evidence (`README.md:496`).
* The broker order carries no project identity. Legacy ownership runs through the broker order ID recorded before sending, because OpenAlgo's order schema has no client tag (`OA/src/core/framework/execution/book.py:14-18`; `reconcile.py:111-112`). When a place times out, there is no broker ID, and legacy resolves the attempt by adopting a unique same-shape order (LD-20).

The master accepted the following:

* D15: coverage and identity-based reconciliation;
* ATA-06: explicit domain evidence;
* A06-F2: enforced read-only observation.

## Goals

1. Every effect and observation is attributable to a domain, or explicitly unknown or conflicting (ATA-06).
2. No obligation is resolved or released from an observation whose coverage cannot support the claim (D15).
3. Matching uses verified identities only (D15).
4. Foreign activity is recorded and never settles a project command (D15, POL-009).
5. Observation access cannot be turned into a write path (A06-F2).

## Non-goals

* Gating or refusing any send on analyzer mode (`README.md:458`, `:804`).
* Claiming deployed endpoint behaviour from source reading. Endpoint contracts are verified at the source for the supported deployment (REQ-DOM-014).
* Choosing a native or mediated observation mechanism before endpoint proof (A06-F2).
* Choosing how a timed-out place with no broker ID is resolved ([Q-007](../decisions/owner-questions.md#q-007)) or how non-live obligations count against capacity ([Q-008](../decisions/owner-questions.md#q-008)).
* Absence proven by corroborating evidence from other endpoints. D15 allows it (`README.md:762`); this package accepts only contract-backed coverage until TASK-S07-05 shows a need. That is stricter, never looser.

## Requirement keys

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-DOM-001 | Domain evidence is recorded per request, outcome and observation; a cached or session-level mode read is context, not proof of an individual effect | ATA-06 (`README.md:458`); LD-12 |
| REQ-DOM-002 | Domain values include explicit `unknown` and `conflicting`; an absent marker is not proof of live | ATA-06 (`README.md:458`); LD-06 |
| REQ-DOM-003 | No send is refused because of analyzer mode | ATA-06 (`README.md:458`); `README.md:804` |
| REQ-DOM-004 | Reconciliation validates domain and identity before settlement; no cross-domain settlement; analyzer results never count as live performance | ATA-06 (`README.md:458`); A03-F4 (`:922`) |
| REQ-DOM-005 | Observations carry account, source, endpoint, query interval, as-of, arrival, pages or cursors, watermark where available, raw evidence reference and matching-rule version; query success is not completeness | D15 (`README.md:762`); Observation row (`:738`) |
| REQ-DOM-006 | Matching uses verified identities; instrument and quantity similarity never settles a command | D15 (`README.md:762`); LD-20 |
| REQ-DOM-007 | Absence counts only when the endpoint's coverage contract supports it; an empty query is never "flat" | D15 (`README.md:762`); `README.md:745` |
| REQ-DOM-008 | Foreign activity and conflicting snapshots stay attributable and unresolved where necessary; an order an unresolved attempt could account for is never recorded as foreign | D15 (`README.md:762`); POL-009 |
| REQ-DOM-009 | The adapter exposes transport evidence classes and makes no hidden effect retries | D14 (`README.md:760`); §7 (`:1144`) |
| REQ-DOM-010 | Basket and status results are read per leg (role, quantity, identity); wrapper success does not mean every leg succeeded; a zero average price is not partial-fill evidence | OpenAlgo scope (`README.md:494-498`) |
| REQ-DOM-011 | Observation freshness 60 s for dependent decisions; a close without a filled quantity stays reserved; a modify proven by an orderbook row records the broker's level | POL-021, POL-016, POL-014 |
| REQ-DOM-012 | Observation is read-only by enforcement: proven native read-only credentials, otherwise an isolated typed observation mediator | A06-F2 (`README.md:865`) |
| REQ-DOM-013 | External evidence is durably published before a ledger reference to it commits | Combined-F2 (`README.md:790`) |
| REQ-DOM-014 | Consumed endpoint contracts are verified at the source for the supported deployment before broker-specific acceptance; this includes whether any project identity (client tag) round-trips | ATA-06 (`README.md:458`); `README.md:1352-1354` |

## Critical user journeys

### CUJ-DOM-1: Mode switched between request and observation

* **Given** an entry acknowledged with domain evidence `analyzer`.
* **When** the operator switches OpenAlgo to live, and the next orderbook observation carries domain `live`.
* **Then**:
  * the combined domain for that attempt is `conflicting`, so reconciliation emits `CONFLICT_RECORDED` and an escalation;
  * the analyzer obligation is not settled from the live book;
  * no live performance is credited;
  * later sends proceed unaffected.

### CUJ-DOM-2: Missing page

* **Given** an uncertain cancel.
* **When** the tradebook query returns page 1 of 2 and the page-2 request fails, and the target order is absent from page 1.
* **Then** the observation has `complete = no`, and the command stays `UNCERTAIN`. Absence is not proof (REQ-DOM-007).

### CUJ-DOM-3: Basket with one failed leg

* **Given** a two-leg structure entry sent as one basket call.
* **When** the wrapper reports success, one leg is rejected and one is acknowledged.
* **Then**:
  * the outcome records each leg's result, and the command class is `acknowledged`;
  * `RESERVATION_REDUCED` lowers the reservation by the rejected leg's planned amount;
  * the acknowledged leg is recorded as **residual exposure**: a position the plan did not intend on its own;
  * the wrapper's success is not used (REQ-DOM-010).

### CUJ-DOM-4: Timed-out place, no broker ID

* **Given** an entry place that timed out (`ambiguous`, no broker ID), and no verified client tag for the endpoint.
* **When** a fresh, complete orderbook shows one unattributed order of the same instrument, side and quantity inside the attempt window.
* **Then** the order is **not** adopted (shape never settles, LD-20) and **not** recorded as foreign (the attempt could account for it). Both stay unresolved and escalated, and the reservation is kept. How this is finally resolved is [Q-007](../decisions/owner-questions.md#q-007).

## Technical plan

### Evidence contract (`contracts/evidence.py`)

```text
DomainEvidence(value: simulated | analyzer | live | unknown | conflicting,
               basis: response_marker | account_binding | simulated_adapter | none,
               context_mode_read: ModeRead | None)        # context only
ModeRead(value: analyze | live | unknown, read_at: Timestamp, detail: str)
EvidenceRef(store, content_digest, published_at)          # published before reference
Coverage(endpoint, interval: Interval | None, pages_seen, pages_total | None,
         cursor | None, watermark | None, complete: yes | no | unknown)
Interval(start: Timestamp, end: Timestamp)
Observation(account_id, source, endpoint, as_of, arrived_at, coverage: Coverage,
            items: list[ObservedOrder | ObservedTrade | ObservedPosition],
            domain: DomainEvidence, raw: EvidenceRef, matching_rule_version)
ObservedOrder(broker_order_id, instrument, side, quantity, filled_quantity,
              status: open | filled | cancelled | rejected | expired | unknown,
              price | None, trigger_price | None, placed_at | None, client_tag | None)
ObservedTrade(fill_id, broker_order_id, instrument, side, quantity, price, traded_at)
ObservedPosition(instrument, net_quantity, average_price | None,   # average price is never fill evidence
                 realized_pnl | None, mtm_pnl | None)              # broker-reported; the latch's input
EndpointContract(endpoint, deployment_version, mode_marker_field | None,
                 coverage_rule: complete_when_all_pages | unknown,
                 client_tag_field | None, verified_by: EvidenceRef)
```

* **`basis`** is `none` exactly when the value is `unknown` or `conflicting`.
* **`ModeRead.value`** uses OpenAlgo's own word `analyze`; `DomainEvidence.value` uses `analyzer`. A `ModeRead` is consumed only by operator displays and the supervisor's reports. Admission, dispatch and reconciliation never read it (LD-12; `analyze_mode()` is informational).
* **Ledger envelope.** An event's `execution_domain` is the `DomainEvidence.value` it carries, or `none` for an event with no external effect ([ledger envelope](ledger-and-atomic-transaction.md#event-envelope-reuse-with-two-added-fields)).
* **`source`** names the adapter and the deployment (`"openalgo@<host>"`, or `"simulated"`). **`matching_rule_version`** is a constant in `kernel.reconciliation`, written by reconciliation when it assesses the observation.
* **`EvidenceRef.store`** is `evidence` (the content-addressed store, [ledger spec](ledger-and-atomic-transaction.md#evidence-references-req-led-014)) or `simulated` (inline evidence from the simulated broker). The digest covers the canonical JSON of the endpoint, the request parameters, the response body and `arrived_at`. Two polls with identical bodies therefore have different digests.
* **Observation identity** is `raw.content_digest`. The same observation delivered twice (same digest) is a no-op.
* **`EndpointContract`** records are produced by TASK-S07-05 from captured responses and bound with the release ([configuration spec](configuration-artifacts-release.md)). The adapter reads them when the composition is built. No record for an endpoint means: no mode marker, coverage `unknown`, no client tag.

**What the adapter fills into `TransportResult`.** One `LegResult` per plan leg: leg role, class, broker order ID if returned, reason. The command-level class is:

* `acknowledged` if any leg is acknowledged and none is ambiguous;
* `rejected` if every leg is rejected;
* `not_sent` only when the adapter can prove no request left the process;
* `ambiguous` otherwise.

A basket is one HTTP call, so its legs share one transport fate until a response arrives. A legacy `invalid` result (no parsable response, or no order ID, `openalgo_adapter.py:56-103`) maps to `ambiguous`, because the request was sent.

**Transport classes** (REQ-DOM-009):

| Failure | Class | Why |
|---|---|---|
| DNS failure, connection refused, TLS handshake failure | `not_sent` | No request bytes were written; the adapter raises `NotSent` internally |
| Any failure after request bytes started to be written | `ambiguous` | The broker may have received it |
| HTTP client timeout (`adapter.http_timeout_ms`, a measured refusing parameter) | `ambiguous` | Same |
| HTTP 5xx | `ambiguous` | Same |
| HTTP 2xx or 4xx with a parsable per-leg body | per leg, by the endpoint's captured mapping (TASK-S07-05) and the legacy classifier | — |

Retries are disabled in the HTTP client (zero retries) and no SDK retry wrapper is used.

### Ports (`kernel/ports.py`)

```text
BrokerPort.send(request: ActionRequest, plan: PlanRef | None, attempt_no: int) -> TransportResult
ObservationPort.orderbook(account, interval: Interval) -> Observation
ObservationPort.tradebook(account, interval: Interval) -> Observation
ObservationPort.positions(account) -> Observation          # a snapshot; interval is None
```

* `plan` is given for entries and `None` for the other verbs. One call per invocation, no retries.
* The adapter fetches every page of one query. If any page fails, it returns the pages it has with `complete = no`. Observations are never merged across calls.
* The simulated broker implements both ports with these signatures ([dispatch spec](dispatch-and-coordination.md#simulated-broker-adapterssimulated_brokerpy)). The production composition binds `adapters.openalgo`, and each simulation binds `adapters.simulated_broker`. No composition binds both (`README.md:802`).

### Domain attribution rules

| Situation | Recorded domain |
|---|---|
| Simulated adapter | `simulated` (basis `simulated_adapter`) |
| Response carries the endpoint contract's verified mode marker | That value (basis `response_marker`) |
| The bound account is verified to serve one domain only | That value (basis `account_binding`) |
| No per-effect marker and no verified account binding | `unknown`; any session mode read is attached as context only |

**Combining two pieces of evidence** (for example an attempt's recorded domain and an observation's). Order does not matter:

| One | Other | Combined | Basis |
|---|---|---|---|
| `unknown` | `unknown` | `unknown` | `none` |
| `unknown` | X (analyzer or live) | X | X's basis |
| X | X | X | the first's basis |
| X | Y, different, neither `unknown` | `conflicting` | `none` |
| `conflicting` | anything | `conflicting` | `none` |
| `simulated` | `simulated` | `simulated` | `simulated_adapter` |
| `simulated` | anything else | `conflicting` | `none` (cannot happen in a valid composition) |

`context_mode_read` of the combined value is the attempt's.

**Settlement rule (REQ-DOM-004):**

* A command settles from an observation only when **identity matches** and the combined domain is **not** `conflicting`.
* `conflicting` never settles. Reconciliation emits `CONFLICT_RECORDED` and an escalation.
* Whether a combined `unknown` may settle is the refusing parameter `reconciliation.unknown_domain_settlement` ([Q-006](../decisions/owner-questions.md#q-006)):
  * `forbid`: an `unknown` combination never settles; the obligation stays reserved and is escalated;
  * `accounting_only`: an identity-verified `unknown` combination settles obligations, and the effect stays labelled `unknown`.
* `analyzer`, `unknown` and `conflicting` effects never count as live performance, promotion or economics evidence, whatever the parameter says.
* Whether analyzer, unknown and conflicting obligations count against live capacity is [Q-008](../decisions/owner-questions.md#q-008). Until it is answered, they all count (they stay reserved), which is the conservative reading of D16.

**Escalation** means two things: `kernel.lifecycle` records `RECONCILIATION_ESCALATED` (command key or order, reason, observation digest), and the operator alert route ([runtime spec](runtime-isolation-observability-deployment.md)) reads it.

### Reconciliation (`kernel/reconciliation.py`)

Pure functions, shared with the supervisor (`README.md:922`):

```text
assess(observation, ledger_view, policy) -> Assessment
transitions(assessment, policy) -> list[Decision]          # ledger Decision objects
Assessment(matched: list[(command_key, attempt_no, item)],
           conflicting: list[(command_key | None, items, reason)],
           unattributed: list[(item, could_account_for: list[command_key])],
           unknown: list[(command_key, attempt_no)],        # unresolved, no usable evidence yet
           gaps: list[(endpoint, reason)])                  # why coverage could not be used
```

* **`ledger_view`** is a read-only snapshot, for one account, of the command, attempt, reservation and broker-identity index rows, plus each attempt's recorded domain and claim time.
* **`policy`** carries `unknown_domain_settlement`, the 60 s freshness bound (POL-021) and `reconciliation.clock_skew_secs` (a refusing parameter for the attempt window).
* `assess` never writes. `kernel.lifecycle` turns `transitions` into atomic commits. The supervisor only records assessments as non-authoritative evidence (A03-F4).

**Verified identity** means either a broker order ID recorded on the attempt, or a client tag whose round trip is recorded in the endpoint contract (REQ-DOM-014). The client-tag item defaults to **not available**: legacy evidence says OpenAlgo's order schema has no such field (`book.py:14-18`). If a later release binds a contract with a verified tag, attempts claimed under that release use it; attempts claimed earlier keep the rules they were claimed under.

**Attempt window** for an attempt: from its claim time minus `clock_skew_secs`, to the observation's `as_of`. Coverage counts for the window only if `Coverage.interval` contains it and `complete = yes`.

**An attempt could account for an order** when the attempt is unresolved, is on the same account, and the order's `placed_at` falls inside the attempt window (or is unknown), unless a verified identity already ties the order to another command.

**Evaluation order.** For each observation, reconciliation applies these steps in order. A step that decides an item removes it from later steps.

1. **Freshness.** An observation whose `arrived_at` is more than 60 s before now (wall clock, POL-021) is used for nothing dependent: no resolution, completion or absence. It may still record foreign activity.
2. **Domain gate.** For each attempt the observation could speak to, combine the attempt's domain with the observation's. `conflicting` gives `CONFLICT_RECORDED` plus escalation, and the attempt takes no further step. `unknown` continues only under `accounting_only`.
3. **Identity matches**, then **fills**, then **completion** (rows below). Completion uses the ledger's [verb-specific rules](ledger-and-atomic-transaction.md#command-and-attempt-state-machine).
4. **Absence** rows.
5. **Unattributed orders.** Re-assessed on every observation: once no unresolved attempt could account for one, it becomes `FOREIGN_RECORDED`.

| Case | Decision |
|---|---|
| Uncertain attempt; observed order carries the attempt's verified identity | `RESOLVED_REACHED` |
| New fill ID for a known order | `FILL` (counted once, ledger I-4) |
| Working command; its verb's completion rule is met | `COMPLETED` |
| Modify proven by a fresh orderbook row | `COMPLETED`, with the confirmed level = the row's level, even if it differs from the requested one (POL-014) |
| Close shows terminal with no filled quantity | No completion; reservation unchanged until a row with filled quantity arrives (POL-016) |
| Uncertain attempt with a verified identity; covered window shows no order with that identity | `RESOLVED_NEVER_REACHED` |
| Uncertain attempt with **no** verified identity; covered window shows that every order in it is tied by verified identity to another command | `RESOLVED_NEVER_REACHED` |
| Uncertain attempt with no verified identity; any order in the window it could account for | No change; both stay unresolved and escalated ([Q-007](../decisions/owner-questions.md#q-007)) |
| Uncertain attempt; window not covered | No change; gap recorded |
| Working order missing from a covered book of the same domain | No change; gap recorded and escalated (absence never completes a command) |
| Order with no verified identity that no unresolved attempt could account for | `FOREIGN_RECORDED`; never settles a command |
| Two snapshots disagree on the same order | `CONFLICT_RECORDED`; no settlement |

**Dependent decisions** that need a fresh observation: admission checks B1 and B2 ([intent spec](intent-to-admission.md#admission-kerneladmissionpy)), and every resolution, completion and absence decision above. The kernel's observation loop polls each bound account's orderbook, tradebook and positions at the bound poll interval; while the latest observation is stale, these decisions wait.

### Observation enforcement (A06-F2)

* **Native read-only credentials** are used only after endpoint-level proof (TASK-S07-06): a captured attempt to place an order with that credential is refused by the broker, and the evidence is recorded. Capturing it needs the owner's authorization.
* **Otherwise, a mediator.** A separate observation process holds the credential. It listens on a local socket for typed JSON requests and serves only `orderbook`, `tradebook` and `positions` for its bound account. Any other request returns `DOM-R01 not_allowlisted`. Callers cannot reach the credential or choose an endpoint. `ObservationPort` in the kernel is bound to this socket.
* The legacy read-only MCP endpoint excludes the order-capable domain altogether (`OA/src/interfaces/mcp/gateway.py:95-110`), so it serves no broker book queries either. It cannot serve observations; mediation is new work.

## Failure modes and crash points

| CP | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-O1 | Crash after evidence publication, before the ledger reference commits | The orphan published object is harmless and attributable; the retry reuses the same content digest (Combined-F2) | PRF-DOM-05 |
| CP-O2 | Crash during a reconciliation commit | Atomic: either the full transition or none (AUD-02) | PRF-DOM-05 |
| F-O3 | Observation older than 60 s | Not used for dependent decisions; the observation loop polls again (POL-021) | PRF-DOM-03 |
| F-O4 | OpenAlgo returns success with an empty book | Unknown coverage unless the endpoint contract proves completeness | PRF-DOM-02 |
| F-O5 | Observer process asked to place an order | Refused (`DOM-R01`); no write capability exists (A06-F2) | PRF-DOM-06 |
| F-O6 | The same observation delivered twice | Second delivery is a no-op (same digest) | PRF-DOM-02 |

## Policy inputs

| Input | Source | Default |
|---|---|---|
| Observation freshness | POL-021 (60 s) | Approved value in the bound policy |
| `reconciliation.unknown_domain_settlement` | [Q-006](../decisions/owner-questions.md#q-006) | None: refusing parameter |
| `reconciliation.clock_skew_secs` | Measured with the clock-quality evidence ([sessions spec](sessions-authority-lifecycle.md)) | None: refusing parameter |
| `adapter.http_timeout_ms` | Measured (A09-F4) | None for production; synthetic in tests |
| Non-live obligations against capacity | [Q-008](../decisions/owner-questions.md#q-008) | Counted until answered |
| Endpoint contracts, including client-tag round trip | Verified at source ([TASK-S07-05](../plan/delivery-plan.md)) | No record: no marker, coverage `unknown`, no tag |

## Reuse evidence

* **Coordinator/OpenAlgoAdapter/ports: extract/refactor** (`README.md:1144`). Candidates for normalization only where coverage and identity contracts fit (`README.md:248`, D15 row):
  * `src/tier1/openalgo_adapter.py` `classify` (`:56-103`) with `src/core/basket_observation.py` (`IDENTITY`, per-leg identity): the source of per-leg results, including the "basket leg identity is unresolved" case;
  * `src/tier1/ports.py` `BrokerObservationPort` (`:183`): the 60 s bound, the refusal to classify a commanded execution as non-owned (`:356-358`), and the `observation:{id}` idempotency key (`:368`);
  * `src/core/framework/execution/reconcile.py` `not_fresh` (`:693`) and `record_stop_levels` (`:778`): the POL-021 and POL-014 rules.
* **Gateway/JSONL registry/reconcile: refactor ownership** (`README.md:1146`). Strict identity joins (`reconcile.py` `mine`/`not_mine`, `:107-128`) are retained; JSONL writes are not.
* **Do not reuse:** shape-based adoption of `UNKNOWN` orders (`reconcile.py:130-182`, `resolve_unknown` from `:410`). See LD-20.
* **Divergences:** LD-06, LD-12 and LD-20 ([legacy-divergence](../legacy-divergence.md)).

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Attribute by a session mode read | Rejected by ATA-06; a cached read is context only |
| Refuse sends when the mode is analyzer | Forbidden (`README.md:804`) |
| Treat repeated identical polls as complete | Rejected by D15 |
| Adopt a unique same-shape order (legacy) | Instrument and quantity similarity cannot settle a command (D15); recorded as LD-20 |
| Record an unattributed order as foreign at once | It may be our own timed-out place; recording it foreign would release the reservation for a live position |
| A separate per-composition rule for `unknown` | One refusing parameter is simpler and is bound explicitly in every composition |
| Merge page observations across calls | Pages fetched at different times can describe different books |

## Proofs

| Proof | Class | Expected outcome | Break check |
|---|---|---|---|
| PRF-DOM-01 | T `tests/unit/test_domain_attribution.py` | The attribution and combination tables, row by row and in both orders; a missing marker gives `unknown`, never `live` | Defaulting to live fails |
| PRF-DOM-02 | T `tests/unit/test_reconciliation_rules.py` | Each reconciliation row gives its decision in the stated order; an incomplete page never resolves; a redelivered observation changes nothing; CUJ-DOM-4 leaves both unresolved; a held-back order becomes foreign once its attempt resolves | Treating empty as flat, or adopting by shape, fails |
| PRF-DOM-03 | T `tests/unit/test_reconciliation_rules.py` | POL-016/POL-014/POL-021 cases, including a stale observation used for nothing dependent | — |
| PRF-DOM-04 | T `tests/integration/test_openalgo_contract.py` | Recorded basket responses (permitted captures) give per-leg results and the tabled command class; wrapper success with a failed leg is caught; legacy `invalid` gives `ambiguous`; each transport-failure row gives its class | Reading only the wrapper fails |
| PRF-DOM-05 | T `tests/recovery/test_crash_boundaries.py` | CP-O1/CP-O2 behaviour | — |
| PRF-DOM-06 | T `tests/contracts/test_capabilities.py` | The observer exposes no write call; any other request gives `DOM-R01` | — |
| PRF-DOM-07 | M (deployed source check) | Actual OpenAlgo analyze and live responses captured and classified for each consumed endpoint, including whether a client tag round-trips; endpoint contracts produced | Operational; needs authorization |
| PRF-DOM-08 | T `tests/integration/test_shared_engine.py` | Mode toggled between request and observation (CUJ-DOM-1) gives `CONFLICT_RECORDED`, an escalation and no settlement; no send is refused; an unbound `unknown_domain_settlement` refuses to load | Settling across domains fails |

## Delivery

SLICE-01 records `simulated` domain evidence for every outcome and uses the broker order ID as the only identity. SLICE-07 builds the OpenAlgo adapter, reconciliation, coverage and attribution, recorded-interface tests and the observation mechanism decision. See [plan/delivery-plan.md](../plan/delivery-plan.md).
