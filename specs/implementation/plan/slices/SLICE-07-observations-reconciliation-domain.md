# SLICE-07 — Observations, reconciliation, domain and the OpenAlgo adapter

* **Status:** proposed. Step 1 is decision-complete below and not yet built. Steps 2–4 are scoped, and each is deepened once the step before it is built, as SLICE-04's and SLICE-05's were (the delivery plan's depth rule).
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [execution-domain spec](../../design/execution-domain-and-observations.md) (evidence contract, attribution and combination, reconciliation, the OpenAlgo adapter), with the [ledger spec](../../design/ledger-and-atomic-transaction.md) for the events findings become. Every deviation is marked **Deviation**. No score, threshold or money value is set: every refusing setting is bound only to labelled synthetic or owner-answered values in tests.
* **Phase:** master Phase 1/3 (D15, D16, ATA-06, the A06-F2 decision). Class S → R: steps 1–3 are disarmed (the simulated broker only); step 4 builds the real adapter and proves it against recorded responses and a local fake server, never a deployment.
* **Builds on:** [SLICE-05](SLICE-05-dispatch-conflicts-scheduling.md) as built; branch `slice-07` cut from `slice-05` (OA_NEW `a4c4516`).
* **Owner answers applied:** Q-006 (`reconciliation.unknown_domain_settlement: forbid`), Q-007 (`attempt_resolve`; never adopt by shape), Q-008 (`capacity.count_non_live_obligations: count`, bound since SLICE-04), Q-012 (a target-bound verb's effective domain is its target's), Q-016 (`reconciliation.foreign_response: escalate`).
* **Tasks and proofs:**
  * **Step 1:** TASK-S07-04's attribution and TASK-S07-02's pure core (PRF-DOM-01; PRF-DOM-02, -03 and -09 for the pure rules).
  * **Step 2:** the rest of TASK-S07-02, plus TASK-S07-03 and the commit side of TASK-S07-04 (PRF-LED-11, PRF-LED-12's redelivered fill, PRF-DOM-02's once-per-key and idempotence clauses).
  * **Step 3:** TASK-S07-07 and TASK-S07-08 (PRF-DSP-09, PRF-ADM-09, PRF-DOM-08).
  * **Step 4:** TASK-S07-01 (PRF-DOM-04).

**Excluded, and where each part arrives:**

* **On the owner's authorization only:** TASK-S07-05 and TASK-S07-06 (PRF-DOM-07 and PRF-DOM-10, class M). Both run against the deployed OpenAlgo; capturing a place attempt needs the owner's word. Until then no `EndpointContract` record exists, so every endpoint has the conservative values: no mode marker, coverage `unknown`, no visibility bound, no client tag. In particular, absence is never usable against a deployment.
* **SLICE-06:** `LEG_ASSIGNED` and the validated join for unassigned basket IDs (a basket's protective legs arrive with protection, Q-013; until then no multi-leg entry is admitted, Q-020); protection's escalation reasons.
* **SLICE-11:** the observation mediator, if TASK-S07-06 never proves native read-only credentials; the kernel host's loop that drives the observation loop.

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | The evidence contract at the spec's shape; domain attribution and combination; the pure `assess` and `findings` (this file, below) | PRF-DOM-01; PRF-DOM-02, -03, -09 (pure rules) |
| 2 | `kernel.lifecycle` turning findings into `RESOLVED_*`, `FILL`, `COMPLETED`, `CONFLICT_RECORDED`, `FOREIGN_RECORDED`, `RECONCILIATION_ESCALATED`; the `reconciliation_fact` and `position` tables (migration 005); fill and obligation accounting (D16) under Q-006; entry completion and the recorded-fills precondition of a close's completion (SLICE-05 step 3's Deviation ends); `attempt_resolve` (Q-007); the positions side of the holdings port; the reconciliation settings | PRF-LED-11, PRF-LED-12 (redelivered fill), PRF-DOM-02 (once per key, idempotence) |
| 3 | `ObservationLoop` (one reader per account, the latest observation per kind, an arrival wakes the coordinator, an older observation of an order is ignored); the simulated broker as `ObservationPort` with `BookStep`s; row 6 against those observations; capacity against real funds and positions | PRF-DSP-09, PRF-ADM-09, PRF-DOM-08 |
| 4 | `adapters/openalgo.py`: the REST backend, the total deadline, retries disabled, transport classes, per-leg basket results, pagination; the default endpoint contract | PRF-DOM-04 |

## Step 1 — the evidence contract, domain and the pure reconciliation

Reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-07-review-2026-10-28)).

### What legacy does, and what that decides

* **Ownership by recorded ID.** Legacy filters the orderbook against the IDs it recorded (`mine`, `not_mine`: `src/core/framework/execution/reconcile.py:107-128` @445eb116). Rows it has no record of are "not necessarily an error". The target keeps the strict ID join and records such rows as foreign only when no unresolved attempt could account for them (D15, POL-009).
* **Freshness both ways.** `not_fresh` rejects a stamp more than the bound away from now in **either** direction (`abs(age)`, `reconcile.py:693-711`). The target keeps it (POL-021, 60 s).
* **Changed level needs a recorded level.** Legacy treats a stop resting at the recorded level as unchanged, and with no recorded level it has nothing to compare (`reconcile.py:754-757`, `require_recorded`). A different level is evidence that a timed-out modify reached the broker (POL-014).
* **A commanded execution is never non-owned** (`src/tier1/ports.py:356-358`). The target's equivalent: an order an unresolved attempt could account for is never foreign.
* **Shape adoption is not reused** (`reconcile.py:130-182`; LD-20): similarity never resolves a command.

### Decisions

* **Step 1 is pure.** It adds no event, table, setting or thread. `assess` and `findings` read only their arguments; step 2 turns findings into ledger decisions, and step 3 feeds them observations. Tests build the inputs directly.
* **The contract grows compatibly.** New fields are keyword-only with defaults, so every existing constructor call (conftest, `test_admission_checks.py`; none in `src`) stays valid. Three Deviations from the spec's field lists keep code that already exists:
  * `Coverage` keeps `complete` as its first positional field;
  * `Observation` keeps `digest` as its identity field, which must equal `raw.content_digest` when `raw` is set;
  * `ObservedPosition` keeps `identity`, the broker's position key that capacity's count-once rule uses (SLICE-04 step 2).
* **An observation without a domain is `unknown`** (REQ-DOM-002). The test fixtures and the simulated broker (step 3) set `simulated`.
* **`combine` is the spec's table as written.** `simulated` with anything but `simulated`, `unknown` included, gives `conflicting`; `unknown` with X gives X only for X `analyzer` or `live`.
* **Order IDs are the only verified identity.** The client-tag route needs an endpoint contract recording the tag's round trip, which only TASK-S07-05 can produce; until then `assess` never matches by tag (the spec's default, "not available").
* **No endpoint contract exists yet.** Without one, no absence is usable (no `visibility_secs`, coverage `unknown`). "The default endpoint contract" means *no record*, never a contract written from source reading (the spec's non-goal).
* **Conflicts and facts (the spec read whole).** The rules table says a cross-domain ID collision "only escalates", and REQ-DOM-015 records reach, fills and completion "whatever its domain". Both hold:
  * a `cross_domain_id` match may be a different order, so it gives the conflict and its escalation and **no** fact;
  * a `domain_conflict` match is our order with conflicting evidence, so it gives the conflict, its escalation, **and** the facts, each labelled `conflicting`.
* **`completion` moves to the pure module.** `Completion` and `completion` move from `kernel/lifecycle.py` to `kernel/reconciliation.py`, with `orders: Observation` in place of the account observation (`orders.items`, `orders.digest`). `lifecycle.record_completions` passes `observation.orders` and keeps its guards. There is no import cycle: lifecycle imports reconciliation inside its function.
* **What step 1 leaves to step 2.**
  * Entry completion, and close completion through findings: these need recorded `FILL`s and the positions book's `as_of` beside the orders book's. Until then `record_completions` stays the close's path.
  * The reconciliation table's episodes.
  * Ignoring an older observation of an order (the loop's memory) and redelivery (the ledger's guards).

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/evidence.py` | `Interval`, `ModeRead`, `ObservedTrade`, `EndpointContract`; new keyword fields on `Coverage`, `Observation`, `ObservedOrder`, `ObservedPosition`, `ObservedFunds` |
| `src/autonomous_trading/kernel/reconciliation.py` | New (in the tree): `attribute`, `combine`, `conflict_reason`, `ReconciliationPolicy`, the view rows, `Assessment`, `Finding`, `assess`, `findings`; `Completion` and `completion` (moved) |
| `src/autonomous_trading/kernel/lifecycle.py` | `record_completions` calls the moved `completion` with `observation.orders` |
| `tests/conftest.py` | `make_observation` stamps domain `simulated` and the account; the view builders (below) |
| `tests/unit/test_domain_attribution.py` | New (T-17): PRF-DOM-01 |
| `tests/unit/test_reconciliation_rules.py` | New (T-18): PRF-DOM-02, -03, -09 (pure rules) |
| `tests/integration/test_verb_completion.py` | Imports `completion` from its new home (no behaviour change) |

No migration and no tree delta.

### `contracts/evidence.py`

```text
Interval(start: Timestamp, end: Timestamp)                                   # start <= end
Coverage(complete, *, endpoint=None, interval: Interval | None = None, pages_seen: int | None = None,
         pages_total: int | None = None, cursor: str | None = None, watermark: str | None = None)
Observation(endpoint, as_of, coverage, items, digest, *, account_id: AccountId | None = None,
            source: str = "kernel", arrived_at: Timestamp | None = None,
            domain: DomainEvidence = DomainEvidence("unknown"), raw: EvidenceRef | None = None)
ObservedOrder(..., *, price=None, trigger_price=None, placed_at: Timestamp | None = None,
              client_tag: str | None = None)
ObservedTrade(fill_id, broker_order_id, instrument, side, quantity: int, price: str, traded_at: Timestamp | None)
ObservedPosition(identity, instrument, net_quantity, amount, margin, *, average_price=None,
                 realized_pnl=None, mtm_pnl=None)                            # average price is never fill evidence
ObservedFunds(available, margin_available, position_margin, working_margin, *, as_of: Timestamp | None = None)
ModeRead(value: "analyze" | "live" | "unknown", read_at: Timestamp, detail: str)
EndpointContract(endpoint, deployment_version, mode_marker_field: str | None,
                 coverage_rule: "complete_when_all_pages" | "unknown",
                 covers: "trading_day_to_read" | None, visibility_secs: int | None,
                 client_tag_field: str | None, status_mapping: tuple[tuple[str, str], ...],
                 verified_by: EvidenceRef)
```

* **Construction checks.**
  * `Interval.start ≤ end`, compared as parsed times.
  * Every count is an int and not a bool (`pages_seen`, `pages_total`, `quantity`, `visibility_secs`), and is ≥ 0; `pages_seen ≤ pages_total` when both are known.
  * `Observation.digest == raw.content_digest` when `raw` is set.
  * `ModeRead.value`, `coverage_rule` and `covers` are in their sets.
* `ModeRead` is the annotation of no field of `Observation`, `TransportResult`, `LegResult` or `Outcome` (LD-12).

### `kernel/reconciliation.py` — attribution and combination

```text
attribute(response: Mapping | None, contract: EndpointContract | None, *, simulated: bool) -> DomainEvidence
combine(a: DomainEvidence, b: DomainEvidence) -> DomainEvidence
conflict_reason(recorded: DomainEvidence, observed: DomainEvidence) -> str | None
```

* **`attribute`:** `simulated` gives `simulated`, whatever the response. Otherwise, a contract `mode_marker_field` whose response value is `analyze` or `live` gives `analyzer` or `live`. Anything else gives `unknown`: no contract, no marker field, the field missing, or any other value.
* **`combine`**, symmetric and in this order:
  * `conflicting` with anything gives `conflicting`;
  * `simulated` with `simulated` gives `simulated`, and `simulated` with anything else gives `conflicting`;
  * `unknown` with `unknown` gives `unknown`;
  * `unknown` with `analyzer` or `live` gives that value;
  * X with X gives X;
  * `analyzer` with `live` gives `conflicting`.
* **`conflict_reason`** is `None` unless `combine` gives `conflicting`. It is `cross_domain_id` when both values are definite (`simulated`, `analyzer`, `live`) and differ. In every other case (either value `conflicting`, or `simulated` against `unknown`) it is `domain_conflict`.
* `assess` calls `combine` only for identity-matched items; an unattributed or foreign order keeps the observation's domain.

### `kernel/reconciliation.py` — the inputs

```text
ReconciliationPolicy(freshness_secs: int, clock_skew_secs: int, working_escalation_secs: int,
                     foreign_response: "record_only" | "escalate" | "hold_entries",
                     unknown_domain_settlement: "forbid" | "accounting_only",
                     contracts: Mapping[str, EndpointContract])
LedgerView(account: AccountId, commands: tuple[CommandView, ...], identities: tuple[IdentityView, ...],
           fill_ids: frozenset[str], facts: frozenset[tuple])
CommandView(command_key, verb, state, target: str | None, request: dict, updated_at: str,
            attempts: tuple[AttemptView, ...], target_level: str | None, target_kind: str | None,
            target_domain: str | None)
AttemptView(attempt_no, state, claimed_at: str, outcome_at: str | None, domain: str | None,
            legs: tuple[LegView, ...], unassigned_order_ids: tuple[str, ...])
LegView(leg_role, cls, broker_order_id: str | None)
IdentityView(broker_order_id, command_key, leg_role: str | None, domain: str | None)
```

* **Policy:** the counts are ints ≥ 0 and not bools; the two strings are in their sets. `freshness_secs` is POL-021's approved 60 (`reconciliation.max_observation_age_secs`).
* **Commands:** every command of the account not in a final state (`ADMITTED`, `IN_FLIGHT`, `UNCERTAIN`, `WORKING`), plus `REJECTED` commands and commands with a `NOT_SENT` attempt, which `after_*` conflicts need. `attempts` holds **every** attempt, oldest first (a retry's attempt 1 stays visible).
* **`target_level`** (a modify's): the latest `COMPLETED` `confirmed_level` on its target, else the creating close's trigger (stop) or price (limit), else `None` (a target created by an entry, or by a market close).
* **`target_kind`:** the target order's `order_kind` (SLICE-05 step 3's rule), or `None`.
* **`target_domain`** is the effective domain of a target-bound verb (Q-012):
  * for a cancel or modify, the target order's `IdentityView.domain`;
  * for a close, the domain recorded for the entry order behind its position (the close's target is a position; Q-012 names the target order, and that is the order the position came from);
  * `None` when unknown.
* **`identities`:** every `broker_identity` order row of the account's commands, replaced rows included.
* **`facts`:** the keys already in `reconciliation_fact` (step 2): (`conflict`, order ID, reason), (`foreign`, order ID), (`escalate`, subject, reason).
* **Times:** event times and `Timestamp.utc_iso`, parsed with `datetime.fromisoformat` (a trailing `Z` as UTC) wherever they are compared or added.

### `kernel/reconciliation.py` — the outputs

```text
Finding(kind: "reached" | "never_reached" | "fill" | "completed" | "conflict" | "foreign" | "escalate",
        command_key: str | None, attempt_no: int | None, leg_role: str | None, item: object | None,
        observation_digest: str, reason: str | None, *, subject: str | None = None,
        domain: str | None = None, recorded_domain: str | None = None, observed_domain: str | None = None,
        completion: Completion | None = None)
Assessment(matched, conflicting, unattributed, unknown, gaps, *, observation, view, policy, now)
assess(observation, view: LedgerView, policy, now: Timestamp) -> Assessment
findings(assessment) -> list[Finding]
```

* `matched`: (command key, attempt number or `None`, leg role or `None`, item, combined domain). `conflicting`: (command key or `None`, item, reason). `unattributed`: (item, could account for: (command key, attempt number)). `unknown`: (command key, attempt number). `gaps`: (endpoint, subject or `None`, reason).
* `domain` is the combined domain of a reached, fill or completed finding (step 2 labels its event with it and gates releases on it). A conflict carries `recorded_domain` and `observed_domain`.
* An escalation carries its `subject`.
* Findings are ordered by rule step, then by item order, then by command order (first sequence).

### `assess` and `findings` — the rules

**0. Kind and account.** The kind is `observation.endpoint`: `orderbook`, `tradebook`, `positionbook` or `funds`; any other value is a gap `unknown_endpoint`. An `account_id` other than `view.account` (or `None`) is a gap `account_mismatch`. Either gap means no finding.

**1. Freshness.** If `abs(now − as_of) > freshness_secs` (a future stamp too), the observation gives the gap `stale` and no finding.

**2. Identity and domain** (orderbook and tradebook items; a trade is matched through its `broker_order_id`).

* **An item's identity** is its order ID found:
  * as an `IdentityView`, giving its command and role;
  * or as an attempt leg's ID or unassigned ID of an **entry or close** attempt, giving that attempt.

  A cancel's or modify's own ACK leg is never identity: it echoes the target. A modify's replacement is an `IdentityView` row of the close.
* An order may also match a cancel or modify as its `target`. That is **target evidence**, not identity.
* **Recorded domain:** the `IdentityView.domain`, else the attempt's `domain`, else `unknown`. `combine(recorded, observation.domain)` gives the match's domain.
* **In order, for each identity match:**
  * with a `conflict_reason`, a `conflict` finding (that reason), then an `escalate` finding (subject the order ID, reason `domain_conflict`). For `cross_domain_id` nothing else follows; for `domain_conflict`, the facts below follow with domain `conflicting`;
  * otherwise, a match on an attempt that is `REJECTED` gives `conflict` `after_rejected`, and a match on one that is `NOT_SENT` (its ID could be recorded only by a later never-reached resolution) gives `conflict` `after_never_reached`. Each is followed by an `escalate` finding with subject the order ID and the conflict's reason (a reason the [execution-domain catalogue](../../design/execution-domain-and-observations.md#reconciliation-events) gains).

**3. Per-verb evidence, fills and completion.**

| Case (the endpoint) | Finding |
|---|---|
| An `UNCERTAIN` entry or close: an order ID of its latest attempt appears (orderbook) | `reached` (the leg's role) |
| An `UNCERTAIN` cancel: its target is observed terminal, with `as_of` after the latest `claimed_at` (orderbook) | `reached` |
| An `UNCERTAIN` modify with a `target_level`: its target is observed `open` at a level other than `target_level`, or with every requested field equal while the request differs from `target_level` (orderbook) | `reached` |
| An `UNCERTAIN` modify without a `target_level` | nothing; gap `no_recorded_level` |
| A trade whose `fill_id` is not in `view.fill_ids`, on an identity whose `leg_role` is set (tradebook) | `fill` (the trade, the command and role) |
| The same with `leg_role` `NULL` (tradebook) | nothing yet |
| A `WORKING` cancel or modify that `completion` completes, judged on the order its SLICE-05 rule names, with `orders.as_of` after its latest `claimed_at` (orderbook) | `completed` (`completion` attached) |

* **"Level"** compares as a decimal: the observed `trigger_price` for a stop `target_kind`, else its `price`.
* **Close completion** stays with `record_completions` until step 2: it needs recorded fills and the positions book's `as_of`.

**4. Absence** (orderbook only).

* **The window** is a pair (start, end), kept even when it is inverted. Start is `claimed_at − clock_skew_secs`; end is `outcome_at + visibility_secs + clock_skew_secs`. With `outcome_at` or `visibility_secs` unknown, the window has **no end**.
* **Usable** only when all hold. They are checked in this order, and the first failure is the attempt's one gap:
  1. a contract for the endpoint (`no_contract`) with `coverage_rule` `complete_when_all_pages` (`coverage_unknown`);
  2. `coverage.complete` is `yes` (`incomplete`);
  3. the window has an end (`window_unbounded`);
  4. the window is neither empty nor inverted (`empty_window`);
  5. `coverage.interval` contains the window, bounds included (`window_not_covered`);
  6. `as_of` is at or after the window's end (`too_early`);
  7. the effective domain is known (`domain_unknown`) and equals the observation's domain (`domain_differs`).
* **The effective domain** of an entry or close attempt is its attempt's domain. For a cancel or modify it is `target_domain`; for a close, `target_domain` when the attempt's own domain is unknown (Q-012). `None` is `unknown`.

| Case | Finding |
|---|---|
| An `UNCERTAIN` entry or close with an order ID on its latest attempt; absence usable; the ID is absent | `never_reached` |
| An `UNCERTAIN` cancel; absence usable; its target is observed `open` | `never_reached` |
| An `UNCERTAIN` modify with a `target_level`; absence usable; its target is observed `open` at `target_level` with no requested field already equal | `never_reached` |
| An `UNCERTAIN` entry or close with no order ID; absence usable; every order in the window is tied by identity to another command | `never_reached` |
| An `UNCERTAIN` entry with no order ID, and an order it could account for (step 5) | `escalate` (`untagged_timeout`; subject the command key) |
| An `UNCERTAIN` attempt whose effective domain is `unknown`, with no reached evidence | `escalate` (`unknown_domain_unresolved`; subject the command key) |

* An untagged entry of `unknown` domain gives both escalations, each once by its own key. The CUJ-DOM-4 fixture uses `simulated`.
* An order's `placed_at` that is unknown counts as inside a window.

**5. Unattributed orders** (orderbook only).

* **Unresolved** means the latest attempt is `CLAIMED` (command `IN_FLIGHT`) or `AMBIGUOUS` (command `UNCERTAIN`).
* An attempt **could account for** an order with no identity match when it is unresolved, of an entry or close, and the order's `placed_at` is at or after the window's start and, when the window has an end, at or before it. A window with no end (no outcome yet, or no visibility bound) is open-ended for this test only.
* Such an order goes to `unattributed` and gives no `foreign` finding. Otherwise it gives `foreign`; with `foreign_response` `escalate`, an `escalate` finding follows (subject the order ID, reason `foreign_activity`). `hold_entries` is acted on by step 2 (the first release binds `escalate`, Q-016).

**6. Working escalation** (orderbook only; cancel, modify and close in step 1).

* A `WORKING` close whose order is observed terminal with `filled_quantity` `None`, and `now − updated_at ≥ working_escalation_secs`, gives `escalate` `close_without_fill_total`.
* Any other `WORKING` cancel, modify or close with `now − updated_at ≥ working_escalation_secs` and no `completed` finding in this call gives `escalate` `working_without_completion`.
* The subject is the command key.

**Once per key.** A finding whose key is already in `view.facts` is not produced, and within one call each key is produced once:

* `conflict`: (order ID, reason);
* `foreign`: (order ID);
* `escalate`: (subject, reason).

### Step 1 tests

* **Builders (conftest):**
  * `rview(commands=(), identities=(), fill_ids=(), facts=(), account=ACCT) -> LedgerView`;
  * `rcommand(key, verb, state, *, target=None, request=None, attempts=(), updated_at=START, target_level=None, target_kind=None, target_domain=None) -> CommandView`;
  * `rattempt(n=1, state="AMBIGUOUS", *, claimed_at=START, outcome_at=None, domain="simulated", legs=(), unassigned=()) -> AttemptView`;
  * `rpolicy(**changes) -> ReconciliationPolicy` (synthetic: freshness 60, skew 2, working escalation 300, `escalate`, `forbid`, no contracts);
  * `rcontract(endpoint="orderbook", visibility_secs=5) -> EndpointContract` (complete, `trading_day_to_read`, labelled synthetic).
* `test_domain_attribution.py` (PRF-DOM-01):
  * every attribution row;
  * every pair of `combine`, both orders;
  * every `conflict_reason` case;
  * no field annotation of `Observation`, `TransportResult`, `LegResult` or `Outcome` names `ModeRead`;
  * the digest rule; an observation built without a domain is `unknown`;
  * combination is applied only to identity matches (a foreign order keeps the book's domain).
* `test_reconciliation_rules.py` (PRF-DOM-02, -03, -09, pure):
  * one test per table row and per numbered rule, each giving exactly its findings in order;
  * the endpoint split (a tradebook gives no absence; a positionbook gives nothing);
  * the account check;
  * an entry and a cancel of it judged on one item;
  * a retried command whose attempt-1 order appears (`after_never_reached`, not `reached` for attempt 2);
  * CUJ-DOM-1: an `analyzer` attempt and a `live` book without it give no absence; with it, `cross_domain_id` and no `reached`;
  * a `domain_conflict` match still gives `reached`, labelled `conflicting`;
  * CUJ-DOM-2; CUJ-DOM-4 (`untagged_timeout`, not `foreign`, never `reached`); F-O4;
  * F-O7 and PRF-DOM-09: every absence gap, at and across each bound;
  * POL-021 (`abs(age)`, a future stamp); POL-014 (an unchanged level, and no `target_level`); POL-016;
  * an in-flight attempt's window keeps a new order from being foreign;
  * `facts` suppress each kind;
  * the same inputs give the same findings.
* **Break checks** (named in the docstrings):
  * treat a missing marker as `live`;
  * combine `simulated` with `unknown` as `simulated`;
  * use `as_of − now` without `abs`;
  * accept absence without a contract;
  * accept absence when `as_of` is before the window's end;
  * record a same-shape order as `reached` (shape adoption);
  * record an order an in-flight attempt could account for as `foreign`;
  * treat a cancel's echoed ACK ID as identity;
  * count an unchanged level, or a missing `target_level`, as reached;
  * drop facts on a `domain_conflict` match;
  * ignore `facts`;
  * run absence on a tradebook.

## Step 2 — lifecycle commits (scoped; deepened after step 1)

* **Events:** `RESOLVED_REACHED` and `RESOLVED_NEVER_REACHED` (per leg), `FILL`, `CONFLICT_RECORDED`, `FOREIGN_RECORDED`, `RECONCILIATION_ESCALATED` with the ledger catalogue's payloads; the `reconciliation_fact` and `position` tables (migration 005, with its tree delta as T-27 had).
* **Accounting:** fills lower an entry's reservation by `reservation_after` (D16), released only on verified identity and a non-conflicting domain, with `unknown` held under `forbid` (Q-006).
* **Completion:** entry completion; close completion through `findings`, with the recorded-fills precondition and the positions book's `as_of` (ending SLICE-05 step 3's pre-`FILL` Deviation; `order_ended` is a standing amendment); `record_completions` routed through `findings`; a late `FILL` accepted for a `COMPLETED` close (SLICE-05 step 3's obligation).
* **Also:** the `attempt_resolve` grant action; a replacement ID seen in an observation (the spec's rules table); an `UNCERTAIN` modify whose target ended; `hold_entries`; the escalation episode in `reconciliation_fact`'s key.
* **`attempt_resolve`** (Q-007) and the positions side of the holdings port (`LedgerHoldings` over the `position` table).
* **Settings:** `reconciliation.unknown_domain_settlement`, `clock_skew_secs`, `working_escalation_secs` and `foreign_response`.

## Step 3 — the observation loop (scoped)

`ObservationLoop` with one reader thread per bound account and the latest observation per kind, an older observation of an order ignored, and every arrival waking the coordinator. Also:

* the simulated broker as `ObservationPort`, with `BookStep`s;
* row 6 and capacity read those observations (PRF-DSP-09, PRF-ADM-09);
* PRF-DOM-08's shared engine (CUJ-DOM-1, facts recorded under `forbid` while releases wait);
* `observation.poll_interval_secs` and `max_requests_per_minute`.

## Step 4 — the OpenAlgo adapter (scoped)

`adapters/openalgo.py` over the REST backend, with retries disabled, the total deadline `adapter.http_timeout_ms` covering resolution to read, and the transport-class table. Also:

* per-leg basket results; pagination with `complete = no` on a failed page;
* proof against recorded responses (the legacy captures at `OA/tests/fixtures/legacy-buyer-edge/openalgo/`, read-only) and a socket-level fake that drips its response (PRF-DOM-04). No call reaches a deployment. With no endpoint contract recorded, the adapter uses *no record* (the spec's conservative values); it never derives a contract from source reading.

## Completion conditions

1. Every earlier test and every test of the built steps passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. Each step's file list matches its commit.

## Prerequisites

SLICE-05 as built. No open owner question. TASK-S07-05 and TASK-S07-06 wait for the owner's authorization and block no step.
