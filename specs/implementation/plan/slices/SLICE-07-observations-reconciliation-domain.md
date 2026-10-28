# SLICE-07 — Observations, reconciliation, domain and the OpenAlgo adapter

* **Status:** proposed. Steps 1–3 are built (OA_NEW `9bc4529`, `ee2225a` and `c58f10e` on `slice-07`; [Step 1 as built](#step-1-as-built), [Step 2 as built](#step-2-as-built), [Step 3 as built](#step-3-as-built)). Step 4 is scoped, and each is deepened once the step before it is built, as SLICE-04's and SLICE-05's were (the delivery plan's depth rule).
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

### Step 1 as built

Commit `9bc4529` on `slice-07`, cut from `slice-05` at `a4c4516`. It changes 6 paths. The step 1 files table also listed `test_verb_completion.py`, which needed no change: it calls `record_completions`, not `completion` directly.

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| One evaluator | `assess` and `findings` share one private `_evaluate(observation, view, policy, now)`. `assess` returns its buckets, and `findings` re-runs it from the assessment's own inputs, so both stay pure and always agree |
| Whose attempt an identity row belongs to | Found by scanning every entry and close attempt's leg and unassigned IDs, first seen wins. A row no attempt names (a modify replacement) keeps its own domain and has no attempt |
| `hold_entries` | Produces the same `escalate` finding as `escalate`. Acting on it is step 2's |
| A modify's request "differs" | It does when its level field (trigger for a stop target, else limit) differs from `target_level`, or when it requests a quantity |
| Working escalation of a resting close | Step 6 also escalates a `WORKING` close that has waited `working_escalation_secs`. Until step 2 routes close completion through findings, `record_completions` completes a resting close well within that time; the escalation is the safety net, not a substitute |
| An added test | `test_an_echoed_id_never_becomes_the_cancels_identity`. Without it, the "a cancel's echoed ACK ID as identity" break check survived, because the other test's target already had an identity row |

**Tests** (526 passed with `scripts/safe_tests.py`, no broker variables; the full suite was run three times with the same result):

| File | Cases |
|---|---|
| `test_domain_attribution.py` (43) | Every attribution row; all 25 `combine` pairs in both orders; every `conflict_reason` case; no field of `Observation`, `TransportResult`, `LegResult` or `Outcome` is a `ModeRead`; the digest rule and the `unknown` default; combination only for identity matches |
| `test_reconciliation_rules.py` (42) | **Inputs:** unknown endpoint and account mismatch; freshness both ways at and across 60 s; positions corroborate only. **Identity and domain:** reached by identity; CUJ-DOM-1's `cross_domain_id` with no `reached`; a `domain_conflict` that still records `reached`; `after_rejected`, and `after_never_reached` on a retry's attempt 1; a cancel's echoed ID never identity (two tests). **Evidence:** cancel reached only after the claim; an entry and a cancel judged on one item; POL-014's level rule; no `target_level`; fills on the tradebook (unassigned role, a known fill ID); no absence on a tradebook; a working cancel completed. **Absence:** never reached when usable and at exactly the window's end; all nine absence gaps; an unknown effective domain escalated once; cancel and modify never reached. **Attribution:** CUJ-DOM-4; an untagged entry resolved when every order is another command's; foreign and its escalation (`record_only` too); an in-flight attempt's window. **Escalation:** working escalation at and across 300 s; POL-016's close without a fill total. **Keys:** facts suppress each kind; determinism |

**Break checks** (each applied to `kernel/reconciliation.py`, run against both files, and reverted byte for byte with an md5 check; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Treat a missing marker as `live` | 5 attribution cases |
| Combine `simulated` with `unknown` as `simulated` | 3 cases |
| `as_of − now` without `abs` | `test_freshness_both_ways` (a future stamp) |
| Accept absence without a contract | `test_absence_gaps[no_contract]` |
| Accept absence before the window's end | `test_absence_gaps[early]` |
| Shape adoption | `test_cuj_dom_4_untagged_timeout` |
| Record an in-flight attempt's order as foreign | `test_an_in_flight_attempt_keeps_a_new_order_from_being_foreign` |
| Treat a cancel's echoed ACK ID as identity | `test_an_echoed_id_never_becomes_the_cancels_identity` |
| Count an unchanged level as reached | 2 cases |
| Count a missing `target_level` as reached | `test_modify_without_a_recorded_level_finds_nothing` |
| Drop facts on a `domain_conflict` match | `test_domain_conflict_still_records_facts` |
| Ignore `facts` | 2 cases |
| Run absence on a tradebook | `test_no_absence_on_a_tradebook` |

## Step 2 — lifecycle commits, fills, positions, settlement and `attempt_resolve`

TASK-S07-02 (commits; `attempt_resolve`), TASK-S07-03, and the commit side of TASK-S07-04. Proofs: PRF-LED-11; PRF-LED-12's redelivered fill; PRF-LED-09's fill terms (I-4, I-6); PRF-DOM-02's once-per-key and idempotence clauses; PRF-LED-16's entry row. The authorities are the [ledger spec](../../design/ledger-and-atomic-transaction.md) (catalogue, state table, reservations, I-4, I-6) and the [execution-domain spec](../../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy) (what domain gates, the events, `attempt_resolve`). Reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-07-step-2-review-2026-10-28)).

### What legacy does, and what that decides

* **A fill reduces the reservation proportionally, in floats.** Legacy `_fold_events` takes the fill's amount off `amount` and scales `margin` and `worst_case_loss` by `ratio = (amount − r) / amount`, with no rounding (`src/core/framework/execution/reservations.py:205-216` @445eb116; `reduce()` at `:644`). The target keeps the rule in exact decimals, so it needs a rounding rule where legacy had none: `money.rounding`, a refusing parameter. Any rounding differs from legacy's floats, so binding a production value needs the owner's confirmation (the [register](../../design/cross-cutting-invariants.md#refusing-parameter-pattern-req-xc-003)'s rule). Tests bind a labelled synthetic value.
* **A reduction needs fill evidence attributed to the reservation's own order** (`reservations.py:670-675`, "fill is not attributed to reservation"). It also refuses when the reservation head changed since it was read (`:664-665`). The target keeps both: a `FILL` reduces only its own entry's reservation, and carries the amount it read.
* **Legacy refuses a reduction larger than the remaining amount** (`reservations.py:209-210`). The target clamps it instead (a **Deviation**, below).

### Decisions

* **`kernel.lifecycle.reconcile` is the one entry point.**
  * `reconcile(writer, account, observation, policy, *, rounding) -> list[tuple[str, str | None]]` builds the ledger view, runs `assess` and `findings`, commits each finding, and returns the committed (event kind, command key) pairs. `now` is `writer.clock.now()`.
  * SLICE-05's `record_completions` is removed and its tests move to `reconcile`.
  * Close completion now runs through `findings` with the recorded-fills precondition, and fills now lower owned quantity, so SLICE-05 step 3's positions-book freshness guard ends. The `order_ended` rule stays a standing amendment.
* **A fill proves reach, in one decision.** On a tradebook, a trade whose order is named by the latest `AMBIGUOUS` attempt of an `UNCERTAIN` entry or close gives `reached` (that leg, the trade's domain) before its `fill`. Lifecycle commits that `RESOLVED_REACHED` and the command's `FILL`s in one decision, as the ledger spec requires. Rule 4 never gives `never_reached` for an attempt whose order IDs have recorded fills, so a filled order is never resent.
* **Corrections are seen, duplicates are dropped (I-4).**
  * `LedgerView.fill_records` maps each recorded fill ID to its (order ID, quantity, price). A trade whose fill ID is recorded with the same values gives nothing. One recorded with other values gives `escalate` (`fill_mismatch`, subject the fill ID) and no `FILL`, so a broker correction is never silently ignored.
  * The writer applies I-4 as the ledger spec states it. A `FILL` draft whose fill ID exists with the same order, quantity and price is dropped from the decision and the rest proceeds. Different values refuse the decision with `LED-R08`, message `fill_mismatch`.
* **The reservation read is guarded.** An entry `FILL` that reduces carries `reservation_before` (the `amount` it read) beside `reservation_after`. The fold refuses (`TransitionNotAllowed`, `LED-R09`) when the current `amount` differs, so a stale read never overwrites a reduction; the next poll recomputes. Several fills in one decision are chained: each one's `before` is the previous one's `after`.
* **What domain gates (Q-006).** Facts are always committed. Only lowering or freeing a reservation is gated. A **domain passes** when it is `simulated`, `analyzer` or `live`, or `unknown` under `accounting_only`. Under `forbid`, `unknown` fails, and `conflicting` always fails.
  * An entry fill whose domain fails carries `reservation_after` and `reservation_before` `null`: the reservation keeps that money.
  * An entry's `COMPLETED` releases its reservation only when the completing domain passes **and** every recorded `FILL` of the entry reduced (none was withheld). Otherwise it completes with `settlement_withheld` true, the reservation stays `HELD`, and it is escalated (`settlement_withheld`, subject the command key). Money held back for an `unknown` fill is never released by a later marked book.
* **Over-reduction clamps (Deviation from legacy).** A fill amount above the remaining `amount` takes the reservation to 0.00 instead of being refused. Legacy refuses, but here the fill is a broker fact: refusing would lose the `FILL` and the position change. The excess is escalated (`over_reduction`, subject the fill ID). At an `amount` of 0.00 all three fields stay 0.00 (no ratio is taken).
* **I-6 is restated (ledger amendment).** With withheld and clamped fills, "Σ fill amounts" is not what moved the reservation. I-6 becomes: admitted `amount` = current `amount` + Σ (`reservation_before.amount` − `reservation_after.amount`) over the events that carried a reduction, in any state. It is checked by the invariant test against the events; the fold still computes no money.
* **Fills on any state; late entry fills escalate.** A `FILL` never changes a command's state.
  * A fill on a `COMPLETED` close's order (a resting stop that triggers after `resting_observed`) is recorded and lowers the position, as SLICE-05 step 3 handed over. The state table gains that row.
  * A fill on an entry whose command is `COMPLETED` at commit is recorded with no reduction and escalated (`late_fill`, subject the fill ID).
  * Rule 6's working escalation now covers `WORKING` entries too (`working_without_completion`), so an entry with missing fills never holds its reservation silently.
* **Positions are created by entry fills and checked.**
  * Only an entry `FILL` creates a `position` row. The fold requires `position_id == position_id(command_key, leg_role)` (the projections function).
  * A close `FILL` requires its `position_id` to equal the close command's `target` and its `instrument` to equal the row's. It lowers the row. A close fill on a missing position refuses with `TransitionNotAllowed`.
  * Any other mismatch raises `InvariantViolated` (`LED-R08`); lifecycle escalates it (`fill_mismatch`).
  * `instrument` comes from the order's `OwnedOrder` (`owned_order_from_row`). Lifecycle also compares the trade's instrument and side with the order's, and on a difference escalates `fill_mismatch` instead of committing.
  * A position going below zero commits its `FILL` (`overclosed`) and an escalation (`overclose`, subject the position ID, `excess_quantity`); SLICE-06 adds the protection hold.
* **The positions side of the holdings port.** `LedgerPositions(writer)` serves `position` and `positions` from the `position` table, with `underlying` from the entry's `COMMAND_ADMITTED`. Before an entry's first fill it serves each entry leg that has an acknowledged order as a position with `owned_quantity` 0, as SLICE-04 step 2 specifies. `AdmissionPorts.positions` set to `kernel.admission.LEDGER_POSITIONS` (the string `"ledger"`) composes it.
* **`hold_entries` is refused at load (Deviation).** Acting on it needs an account-level hold that the protection spec has not defined, and Q-016 binds `escalate`.
* **Publish-before-reference waits for the loop (Deviation in timing).** Every event carries the observation's digest as `observation_digest`. Publishing the raw observation before that reference commits (Combined-F2) needs the raw response, which the loop holds (step 3). In step 2, observations are built by tests (disarmed).
* **An `UNCERTAIN` modify whose target ended** is escalated (`target_ended`, subject the command key) and stays `UNCERTAIN`. A terminal order is no member of its group (the conflict relation already excludes it), and `UNCERTAIN` is not busy, and the second-round decisions below remove it from the conflict relation. No machine route resolves it; the escalation reaches the operator.
* **Not in step 2:** a replacement ID seen in an observation (it needs an endpoint field only TASK-S07-05 can verify); multi-leg rows (`LEG_ASSIGNED`, `RESIDUAL_RECORDED`, partial resolution), which are SLICE-06's.

### Second-round decisions

A second fresh design review of the revised step ([review](../../egm/plan/review.md#slice-07-step-2-second-review-2026-10-28)) found a crash loop, two dead ends and a resend path. Where these decisions differ from the text above, they win.

* **An order another command owns never resolves this one (E-1).** `reached`, `never_reached` and fill-proves-reach apply to an attempt's order ID only when the ID's `IdentityView` belongs to this command or no `IdentityView` exists for it. When another command owns it, rule 2 gives `conflict` (`order_owned`) and its escalation, and nothing else for that ID. Lifecycle escalates a `LED-R08` on any decision (`order_owned` for `RESOLVED_*`, `fill_mismatch` for `FILL`) instead of raising `WriterLost`. Only `LED-R03`, `LED-R05`, `LED-R10` and `CommitFailed` stop the kernel, as for every other writer path.
* **Every untagged timeout escalates (E-2).** Rule 4 gives `escalate` (`untagged_timeout`) for every `UNCERTAIN` entry whose latest `AMBIGUOUS` attempt has no order ID, whether or not an order could account for it. Absence is never usable without an endpoint contract, so this escalation is the route Q-007 names. `resolve_attempt` step 2 then always has its fact.
* **An action whose target ended leaves the conflict relation (E-3).** `Conflicts` (SLICE-05 `kernel/safety.py`) excludes from its unresolved effects every command with a recorded `target_ended` escalation: such a command can no longer act on its group. The earlier claim that it "blocks nothing" was wrong (`UNCERTAIN` is unresolved for the relation), and this rule is what makes it true.
* **A never-reached command whose order then appears is never resent (E-5).** A `CONFLICT_RECORDED` with reason `after_never_reached` for a command blocks it:
  * the coordinator treats it as ineligible;
  * the identity rule's retry branch refuses its resubmission with `DOM-R06` (`resend_blocked`), unrecorded.
  The trades of that order are not recorded as `FILL` (the order has no identity row). They stay escalated, and capacity counts the position through broker observations. The same holds after `after_rejected`. A human route for both arrives with the operator interfaces (SLICE-10).
* **One decision per command per observation (E-6).** Lifecycle builds, for each command, one decision: `RESOLVED_REACHED` when present, then its `FILL`s, after dropping fill IDs already recorded identically. The fills are chained, each `reservation_before` the previous `after`. A refusal drops the whole decision; the next observation re-reads the view. A `LED-R08` escalates (`fill_mismatch`, subject the command key).
* **Smaller corrections:**
  * a close fill on a position not yet recorded is `InvariantViolated` (`LED-R08`, escalated), not a retryable `LED-R09` (E-7);
  * an order with no recorded fills counts as 0 in `fills` (E-8);
  * the order a fill belongs to is built from the command's own `COMMAND_ADMITTED` (the `plan_ref` leg, or the close's `resulting_exposure` and request), with the attempt leg's ID and role, so it never needs a `broker_identity` row to exist first (E-9);
  * the writer checks a `FILL`'s nested `reservation_before` and `reservation_after` for the ledger's money form (`LED-R06`), as it does `COMMAND_ADMITTED`'s (E-10);
  * I-6 sums `before − after` over `FILL` events (single-leg entries; multi-leg reductions are SLICE-06's), and the invariant test expects `HELD` or `RELEASED` for `COMPLETED` by `settlement_withheld` (E-11);
  * at an `amount` of 0.00, `margin` and `worst_case_loss` stay **unchanged** (E-12);
  * `resolve_attempt` also checks that the cited observation is an `orderbook` of the command's account. A published observation's content is `{"kind": "observation", "endpoint", "account", "as_of", "domain", "items"}`, items in their wire form (E-13);
  * `ledger_view` loads `COMPLETED` commands only from the account's current session onward (since its open session's `opened_sequence`, or all when none is open), so the read stays bounded (E-15).

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/resources/migrations/005_reconciliation.sql` | New: `position`, `reconciliation_fact`, and `broker_identity.broker_order_id` (tree delta **T-28**) |
| `src/autonomous_trading/kernel/ledger/schema.py`, `store.py`, `projections.py` | Migration 5; families, command kinds, `TABLES`, `_PK` and touched-row loading; the folds; the writer's I-4 drop; reads for the view and positions |
| `src/autonomous_trading/kernel/lifecycle.py` | Transition rows; `ledger_view`; `reconcile`; `resolve_attempt`; `record_completions` removed |
| `src/autonomous_trading/kernel/reservations.py` | `reduce_on_fill` |
| `src/autonomous_trading/kernel/reconciliation.py` | Fill-proves-reach; corrections; entry completion; close completion's fills precondition; no `never_reached` after fills; `target_ended`; rule 6 for entries; the view fields |
| `src/autonomous_trading/kernel/admission.py` | `LedgerPositions`, `LEDGER_POSITIONS` |
| `src/autonomous_trading/resources/events.schema.json` | The seven events |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | Five settings; a non-negative int kind |
| `src/autonomous_trading/bootstrap.py` | `LedgerPositions`; `Composition.reconciliation` and `Composition.money_rounding` |
| `tests/conftest.py` | The settings; `kernel_positions=True`; `filled_entry(...)`; a `tradebook(...)` builder |
| `tests/unit/test_reconciliation_rules.py` | The commit side of PRF-DOM-02 and the new pure rules |
| `tests/unit/test_ledger_invariants.py`, `test_command_identity.py` | PRF-LED-09's fill terms and PRF-LED-11; PRF-LED-12's redelivered fill |
| `tests/integration/test_verb_completion.py` | Moves to `reconcile`; closes fill a ledger position; the positions-age test is removed |
| `tests/integration/test_entry_outcomes.py` | PRF-LED-16's entry row (the ledger spec's file for it) |
| `tests/unit/test_policy_parameters.py` | The settings |
| `tests/integration/test_reconciliation_commits.py` | New ([as built](#step-2-as-built)): the commit side of PRF-DOM-02, Q-006 and Q-007 against a composed ledger |
| `tests/unit/test_conflict_relation.py` | E-3: an action whose target ended leaves the relation |
| `src/autonomous_trading/adapters/simulated_broker.py` | A step may name a tagged timeout's `order_id` and a `domain` (test adapter only) |
| `src/autonomous_trading/kernel/safety.py`, `coordinator.py` | E-3's exclusion; E-5's ineligibility |
| Spec amendments | The ledger catalogue (`FILL`, `RESOLVED_*`, `COMPLETED`), the state table (a fill on a completed close), I-6, and `broker_identity`'s new column. The execution-domain spec's reasons, refusal codes and `hold_entries` |

### Migration 005

```sql
CREATE TABLE position (position_id TEXT PRIMARY KEY, entry_command_key TEXT NOT NULL, leg_role TEXT NOT NULL,
  account TEXT NOT NULL, instrument TEXT NOT NULL, strategy TEXT NOT NULL, owned_quantity INTEGER NOT NULL,
  state TEXT NOT NULL, opened_sequence INTEGER NOT NULL, closed_sequence INTEGER);
CREATE TABLE reconciliation_fact (kind TEXT NOT NULL, key TEXT NOT NULL, reason TEXT NOT NULL,
  first_sequence INTEGER NOT NULL, PRIMARY KEY (kind, key, reason));
ALTER TABLE broker_identity ADD COLUMN broker_order_id TEXT;     -- the order a fill row belongs to; NULL on order rows
```

* **`reconciliation_fact.key`** is canonical JSON: a conflict's `[order ID]`; a foreign record's `[order ID]` (reason `""`); an escalation's `[subject, episode]`.

### Events and folds

| Event | Payload (new fields in **bold**) | Guard and fold |
|---|---|---|
| `RESOLVED_REACHED` | `attempt_no`, `legs` (`[{leg_role, broker_order_id}]`), `observation_digest`, `broker_order_ids`, `reservation_after` (`null`, single-leg), **`basis`** (`observation`, `attempt_resolve`), **`principal`** (array or `null`) | `StateGuard({UNCERTAIN}, attempt_no, None)`; command → `WORKING`; attempt `AMBIGUOUS` → `ACKNOWLEDGED`, its `legs` rewritten with `cls` `acknowledged` where an ID is named and `not_sent` otherwise, its `domain` the event's `execution_domain`; a `broker_identity` order row per named ID, with its role and that domain (owned by another command: `InvariantViolated`) |
| `RESOLVED_NEVER_REACHED` | as above, `broker_order_ids` `[]`; its `legs` keep the attempt's order IDs ([as built](#step-2-as-built)) | the same guard; command → `ADMITTED`; attempt → `NOT_SENT`, every leg `cls` `not_sent` with its ID kept, and no `broker_identity` row (a retry then needs `DISPATCH_RETRY_REQUESTED`) |
| `FILL` | `fill_id`, `broker_order_id`, `leg_role`, `quantity`, `price`, `observation_digest`, `reservation_after`, **`reservation_before`**, **`position_id`**, **`instrument`** | no command guard and no state change; the writer's I-4 drop; a `broker_identity` row (`fill_id`, `quantity`, `price`, `command_key` the order's, `broker_order_id`); the position checks above; `reservation_before` against the current `amount`, then `reservation_after` copied (entry fills only) |
| `COMPLETED` | as SLICE-05 step 3, plus **`settlement_withheld`** (boolean; every writer passes it) | `WORKING` → `COMPLETED`; an entry's reservation `RELEASED` unless `settlement_withheld` |
| `CONFLICT_RECORDED`, `FOREIGN_RECORDED`, `RECONCILIATION_ESCALATED` | the catalogue's payloads | a `reconciliation_fact` row; an existing key raises `TransitionNotAllowed` |

* **Families and envelopes.** The reconciliation events' family is `lifecycle`. `RESOLVED_*`, `FILL` and `COMPLETED` are command kinds, so the envelope carries the order's command key. A `FILL`'s `execution_id` is `"<key>#<n>"` for the attempt whose IDs name the order, else `null` (a modify replacement).
* **Touched rows (`_load_touched`).**
  * `FILL` loads `broker_identity` (`fill_id`, its value), the order row (`order_id`, `broker_order_id`), the `position` row by `position_id`, the command, and its reservation.
  * `RESOLVED_*` loads the command, the attempt, and the order rows of the named IDs.
  * Each fact event loads its `reconciliation_fact` row by (kind, key, reason).
  * `position` and `reconciliation_fact` join `TABLES` and `_PK`.
* **The state table** gains: `WORKING` or `COMPLETED` close, `FILL` of its order: unchanged; position lowered.

### `kernel/reservations.py`

```text
reduce_on_fill(amount: str, margin: str, worst_case_loss: str, fill_amount: str, *, rounding: str)
    -> tuple[dict, str]                        # ({amount, margin, worst_case_loss}, excess amount)
```

* All arithmetic is `Decimal`. `fill_amount = quantity × price`, quantized to 0.01 with `rounding` (`half_even`, `half_up` or `down`, i.e. `ROUND_HALF_EVEN`, `ROUND_HALF_UP`, `ROUND_DOWN`).
* When `amount` is 0.00, all three stay unchanged and the whole fill is excess.
* Otherwise the reduction is `min(fill_amount, amount)`, the new `amount` is `amount − reduction`, and `margin` and `worst_case_loss` are each multiplied by `new / amount` and quantized the same way. The excess is `fill_amount − reduction`.

### `kernel/reconciliation.py` changes

* **New `LedgerView` fields:**
  * `fills: Mapping[order ID, int]` (recorded quantity per order);
  * `fill_records: Mapping[fill ID, (order ID, quantity, price)]`;
  * on `CommandView`, `plan_legs: tuple[str, ...]` (the entry's `PlanRef.legs` roles) and `fills_withheld: bool` (an entry has a `FILL` without a reduction).
* **On a tradebook:** a recorded fill ID with the same values gives nothing, and with other values `escalate` `fill_mismatch`. A new fill on the latest `AMBIGUOUS` attempt's order of an `UNCERTAIN` entry or close gives `reached`, then `fill`.
* **Rule 4** gives no `never_reached` for an attempt any of whose order IDs has `fills`.
* **Entry completion** (a `WORKING` entry, orderbook) needs at least one planned leg. For every role in `plan_legs`, either:
  * the command's identity order of that role is observed terminal, with `filled_quantity` known and equal to `fills[order]`;
  * or the latest attempt's leg of that role is `not_sent` or `rejected`.

  That gives `completed`, with reason `filled` if every reached leg's order is `filled`, else `order_ended`. The `Completion` carries `filled_quantity` as the sum.
* **Close completion:** the SLICE-05 rule, plus `fills[order] == filled_quantity` for `filled` and `order_ended`. A resting close's `resting_observed` needs no fills.
* **`target_ended`:** an `UNCERTAIN` modify whose target is observed terminal gives `escalate` (`target_ended`, subject the command key).
* **Rule 6** includes `WORKING` entries.

### `kernel/lifecycle.py`

```text
ledger_view(writer, account) -> LedgerView
reconcile(writer, account, observation, policy, *, rounding) -> list[tuple[str, str | None]]
resolve_attempt(writer, authority, auth, command_key, attempt_no, legs: Mapping[str, str | None],
                observation: EvidenceRef) -> Committed | Refusal
```

* **`ledger_view`** reads index tables and the commands' own events:
  * commands: those not final, plus `REJECTED` ones, commands with a `NOT_SENT` attempt, and `COMPLETED` commands of the account (a fill may still arrive);
  * `target_level`, `target_kind`, `target_domain`, `updated_at`, `facts`, `fills`, `fill_records`, `plan_legs` (from `plan_ref`) and `fills_withheld` (from the entry's `FILL` events).
* **`reconcile`** commits:

| Finding | Decision |
|---|---|
| `reached` with the same command's `fill`s | `RESOLVED_REACHED` (`basis` `observation`) followed by the `FILL`s, one decision |
| `reached` alone | `RESOLVED_REACHED` |
| `never_reached` | `RESOLVED_NEVER_REACHED` (`basis` `observation`) |
| `fill` | `FILL`, reduced through `reduce_on_fill` when the order is an entry leg, the command is not `COMPLETED`, and the domain passes; plus the escalations above (`late_fill`, `over_reduction`, `overclose`, `fill_mismatch`) as their own decisions |
| `completed` | `COMPLETED`; for an entry, `settlement_withheld` per the gate, with its escalation |
| `conflict`, `foreign`, `escalate` | `CONFLICT_RECORDED`, `FOREIGN_RECORDED`, `RECONCILIATION_ESCALATED` |

* Every envelope's `execution_domain` is the finding's domain (`none` for an event with no external effect). The principal is `lifecycle.LIFECYCLE`.
* A decision refused `LED-R09` is dropped, `LED-R08` on a `FILL` is escalated (`fill_mismatch`), and any other refusal raises `WriterLost`.
* **`resolve_attempt`** (Q-007), in order:
  1. `SES-R01` unauthenticated; `SES-R02` not human; then `authority.check("attempt_resolve", auth, account)`.
  2. The command is an `UNCERTAIN` entry whose latest attempt is `attempt_no`, `AMBIGUOUS`, with an `untagged_timeout` escalation recorded (`DOM-R04`, `not_untagged`).
  3. `legs` names exactly the attempt's one leg role (`ADM-R01`; more than one leg waits for SLICE-06).
  4. `observation` resolves in the evidence store (`DOM-R05`, `evidence_unresolved`), and a named order appears in its items (`DOM-R05` too).
  5. No named order is tied to another command (`DOM-R03`, `order_owned`).

  It then commits `RESOLVED_REACHED` or `RESOLVED_NEVER_REACHED` with `basis` `attempt_resolve`, the principal, and guard `UNCERTAIN` with that attempt number. The named identity is recorded with the attempt's domain (`unknown` when the attempt has none), which the settlement gate then reads. The machine never names an order itself.

### Settings added

| Setting (field) | Values | Env (`test` profile) | Owner answer |
|---|---|---|---|
| `reconciliation.unknown_domain_settlement` (`unknown_domain_settlement`) | `forbid`, `accounting_only` | `AT_UNKNOWN_DOMAIN_SETTLEMENT` | Q-006 binds `forbid` |
| `reconciliation.clock_skew_secs` (`clock_skew_secs`) | int ≥ 0 (a new non-negative kind) | `AT_CLOCK_SKEW_SECS` | measured; synthetic in tests |
| `reconciliation.working_escalation_secs` (`working_escalation_secs`) | int > 0 | `AT_WORKING_ESCALATION_SECS` | measured; synthetic in tests |
| `reconciliation.foreign_response` (`foreign_response`) | `record_only`, `escalate` (`hold_entries` refused) | `AT_FOREIGN_RESPONSE` | Q-016 binds `escalate` |
| `money.rounding` (`money_rounding`) | `half_even`, `half_up`, `down` | `AT_MONEY_ROUNDING` | none yet: it differs from legacy's floats, so the production value needs the owner's confirmation; synthetic `half_even` in tests |

All five join `ADMISSION_REQUIRED`. The composition carries `reconciliation` (a `ReconciliationPolicy` from them and `reconciliation.max_observation_age_secs`, with no endpoint contracts) and `money_rounding`.

### Step 2 tests

* **Fixtures (conftest):**
  * `kernel_positions=True` (`positions` = `LEDGER_POSITIONS`, with `kernel_holdings`);
  * `tradebook(world, *trades, as_of=None)`, which builds a tradebook `Observation` stamped one second before now;
  * `filled_entry(world, key, *, order_id="E1", quantity=75, price="20.00")`, which admits an entry, acknowledges it, and reconciles one tradebook fill, so the position exists in the ledger. It returns the position ID.
* `test_ledger_invariants.py` (PRF-LED-09's fill terms, PRF-LED-11):
  * the state machine gains rules: a tradebook fill (fill IDs drawn from a small pool, so redelivery and corrections happen), an orderbook reach, absence with `rcontract`, and completion;
  * I-4 holds, and the restated I-6 holds;
  * `EXPECTED_RESERVATION` gains `COMPLETED`, and `amounts_unchanged` is replaced by I-6;
  * PRF-LED-11: a partial fill gives `reservation_after` equal to a `Decimal` hand calculation; the boundary amount 2.00, fill 1.00, margin 0.01 gives `half_even` 0.00 where floats give 0.01; a clamp; an `amount` of 0.00.
* `test_command_identity.py` (PRF-LED-12): a redelivered identical `FILL` draft is dropped by the writer (the rest of the decision commits); other values give `LED-R08` `fill_mismatch`.
* `test_reconciliation_rules.py`:
  * the commit of each kind;
  * reconciling twice commits nothing new;
  * each fact key once (also through a direct second `Decision`, which gives `LED-R09`);
  * reach and fill in one decision;
  * no `never_reached` after fills;
  * a correction escalated;
  * Q-006 under `forbid` and `accounting_only`, `conflicting`, and a withheld fill keeping its completion withheld;
  * `late_fill`, a fill on a completed resting close, `over_reduction`, `overclose`, position checks, `target_ended`;
  * the `reservation_before` guard;
  * `resolve_attempt`: each refusal, reached, never reached, the recorded domain;
  * `LedgerPositions` before and after the first fill.
* `test_verb_completion.py`: the SLICE-05 tests through `reconcile`, with closes against `filled_entry` positions; a close completes only after its fills are recorded.
* `test_entry_outcomes.py` (PRF-LED-16's entry row): completes when its order is terminal with fills accounted, never on its ACK, not while fills are missing, and never vacuously after a reach by resolution.
* `test_policy_parameters.py`: the five settings resolve, are null by default, refuse other values (`hold_entries` included, and `-1` for skew), and the composition refuses each unbound.
* **Break checks** (named in the docstrings):
  * give `never_reached` after fills exist;
  * skip the fill's reach;
  * let the writer keep a duplicate fill;
  * ignore a fill correction;
  * reduce an `unknown` fill under `forbid`;
  * reduce a `conflicting` fill;
  * release a completion whose fills were withheld;
  * complete an entry vacuously (no legs judged);
  * complete a close before its fills are recorded;
  * drop the `reservation_before` check;
  * scale a reservation with a float;
  * skip the position-ID check;
  * let `resolve_attempt` name an order another command owns;
  * let a non-human resolve;
  * record a foreign order twice.

### Step 2 as built

Commit `ee2225a` on `slice-07`, on top of step 1's `9bc4529`. It changes 25 paths (1,421 lines added, 144 removed).

**A correction the tests found.** As first written, `RESOLVED_NEVER_REACHED` cleared its legs' order IDs. A tagged timeout judged never reached then lost its ID, so when that order appeared later it was recorded as *foreign*, not `after_never_reached`. The resend block (E-5) never fired, and the command could be sent again. Now the event's `legs` keep the attempt's IDs, and the fold marks every leg `not_sent` without creating an identity row. The events table above is amended to match. `test_never_reached_releases_nothing_and_blocks_a_resend_once_its_order_appears` proves it, and so does its break check.

**Choices made while building** (none sets a money value; `money.rounding` still has no production value, and tests bind the synthetic `half_even`):

| Topic | As built |
|---|---|
| Where the commit-side tests live | In a new file, `tests/integration/test_reconciliation_commits.py`, because they need a composed ledger world. The pure rule they add, no `never_reached` after fills, is in `test_reconciliation_rules.py` |
| E-3's proof | In `test_conflict_relation.py`. The exclusion is visible only while the ended target still counts as resting in the admission observation. That observation is the action world's: an uncertain modify of `o-stop` blocks protection's cancel until `target_ended` is recorded. The commits file checks only that the escalation is recorded and the modify stays `UNCERTAIN` |
| The simulated broker | A `timeout` step may name an `order_id` (a tagged timeout), and any step may name a `domain`. This is test-adapter only; both default to the old behaviour |
| `resolve_attempt`'s human check | A second layer: the grant model refuses `attempt_resolve` to a service (`a service principal may hold only trading actions`), and a kernel principal's built-ins never include it. The check is tested with an authority stub that allows every action |
| A `LED-R08` on a reconciliation decision | Escalated with reason `fill_mismatch` when the decision holds a `FILL`, else `order_owned`, with the command key as subject. `LED-R09` is dropped, and the next observation re-reads the view; any other refusal raises `WriterLost` |
| The invariant machine | Its timeouts are tagged, so its new `book` rule can reach them and its `absence` rule (an empty book past every window) can judge them never reached. A fixed-order test, `test_a_fill_sequence_keeps_every_invariant`, runs every invariant after each step. 25 random examples did not always reach a reduced fill, so a break of I-6 could survive a run |

**Tests** (566 passed, twice, with `pytest` in the slice's virtual environment on the development machine; no broker variables):

| File | Cases |
|---|---|
| `test_reconciliation_commits.py` (25, new) | **Fills:** a reduction and its position; reconciling twice; a correction escalated; reach and fill in one transaction; over-reduction clamped; another instrument; overclose with its excess; a fill on a completed resting close. **Resolution:** never reached, then the order appears, then `DOM-R06`; `order_owned` (E-1). **Q-006:** `unknown` under `forbid` and `accounting_only`; `conflicting`; a withheld completion stays withheld; a live completion releases. **Facts and guards:** a foreign order once, with `LED-R09` on a direct second decision; the fold's `reservation_before` and position-ID checks. **Holdings:** `LedgerPositions` before and after the first fill. **Q-007:** reached with the recorded domain; never reached; every refusal; the untagged fact required |
| `test_ledger_invariants.py` (6) | The machine with fill, book and absence rules; I-6 restated; I-4 and positions; `EXPECTED_RESERVATION` keyed on `settlement_withheld`; the fixed-order sequence; PRF-LED-11's hand calculation, the 2.00/1.00/0.01 boundary (`half_even` 0.00 where floats give 0.01), the clamp, and the 0.00 rule |
| `test_command_identity.py` (10) | PRF-LED-12: a redelivered identical `FILL` dropped while the rest of its decision commits, a decision of only that fill committing nothing, and other values refused `LED-R08` `fill_mismatch` |
| `test_entry_outcomes.py` (16) | PRF-LED-16's entry row: never on its ACK or an open order, not while fills are missing, then on the terminal order; cancelled unfilled; never vacuously after a reach by resolution |
| `test_conflict_relation.py` (26) | E-3: an action whose target ended leaves the relation |
| `test_verb_completion.py` (11), `test_policy_parameters.py` (25), `test_reconciliation_rules.py` (43) | Migrated through `reconcile`; the five settings; no `never_reached` after fills |

**Break checks** (each applied to the source, run against the named tests, and reverted byte for byte with an md5 check; every one failed its tests):

| Change | Tests that failed |
|---|---|
| `never_reached` after fills exist | `test_no_never_reached_after_fills` |
| Skip the fill's reach | `test_a_tagged_timeout_reaches_and_fills_in_one_decision` |
| The writer keeps a duplicate fill | `test_redelivered_fill` |
| Ignore a fill correction | `test_a_correction_is_escalated_never_recorded` |
| Reduce an `unknown` fill under `forbid` | `test_an_unknown_fill_reduces_only_under_accounting_only` |
| Reduce a `conflicting` fill | `test_a_conflicting_fill_never_reduces` |
| Release a completion whose fills were withheld | `test_a_withheld_fill_keeps_its_completion_withheld` |
| Complete an entry vacuously (unobserved legs skipped, no judged leg required) | `test_entry_completes_on_a_terminal_order_with_its_fills` |
| Count a missing fill as accounted | `test_entry_outcomes.py` |
| Complete a close before its fills are recorded | `test_verb_completion.py` |
| Drop the `reservation_before` check | `test_the_fold_checks_reservation_before` |
| Scale a reservation with a float | `test_the_boundary_rounds_half_even_where_floats_do_not` |
| Skip the position-ID check | `test_the_fold_checks_the_position_id` |
| Let `resolve_attempt` name an order another command owns | `test_resolve_refusals` |
| Let a non-human resolve | `test_resolve_refusals` |
| Record a foreign order twice | `test_a_foreign_order_is_recorded_once` |
| Keep an action whose target ended in the relation | `test_an_action_whose_target_ended_leaves_the_relation` |
| Resend a command whose order appeared after never reached | `test_never_reached_releases_nothing_and_blocks_a_resend_once_its_order_appears` |
| Never-reached clears the attempt's IDs | the same test |
| Let an ID another command owns resolve this one | `test_an_order_another_command_owns_is_a_conflict_not_a_crash` |
| The fold ignores a fill's reduction | `test_ledger_invariants.py` |
| A fill leaves its position unchanged | `test_ledger_invariants.py` |
| Keep every completed reservation held | `test_ledger_invariants.py` |

Against the machine alone, three breaks from the list above survive: a duplicate fill, a stale `reservation_before` and a withheld completion. In the machine another layer refuses the duplicate (the fold rejects a known fill ID), and the other two never arise: one process never reads a stale reservation, and every machine fill is `simulated`. The files named above catch all three.

## Step 3 — the observation loop

TASK-S07-07 and TASK-S07-08, with PRF-DOM-08's shared engine. Proofs:

* PRF-DSP-09: row 6 against the loop's observations, and an arrival waking the coordinator;
* PRF-ADM-09: B5 against the loop's funds and positions, with step 2's ledger positions;
* PRF-DOM-08: CUJ-DOM-1, and facts recorded under `forbid` while releases wait;
* PRF-DOM-02's older-observation and redelivery (F-O6) clauses, now at the loop.

The authorities are the execution-domain spec's [polling](../../design/execution-domain-and-observations.md#polling), [ports](../../design/execution-domain-and-observations.md#ports-kernelportspy) and [simulated broker](../../design/execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy) sections, and the dispatch spec's [coordinator loop](../../design/dispatch-and-coordination.md#coordinator-loop-on-the-writer-thread-one-io-worker-per-account). The step builds on step 2 as built (OA_NEW `ee2225a`). Fresh EGM design and implementation-readiness reviewers reviewed it ([review](../../egm/plan/review.md#slice-07-step-3-review-2026-10-28)), and their findings are resolved in the text below.

### What legacy does, and what that decides

* **Legacy has no standing observation loop.** Each consumer reads the books when it needs them:
  * recovery is handed the books by its caller (`src/tier1/recovery.py:390-416`, `:540` @445eb116);
  * the basket path joins one fresh orderbook read (`src/tier1/openalgo_adapter.py:26`, `src/core/basket_observation.py:59`);
  * the operator CLI reads its own (`src/interfaces/cli/orders.py:46`).

  So two consumers can judge one order on different books. The target keeps one reader per account and the latest observation in memory, and every consumer reads that.
* **Legacy limits only its MCP gateway's request rate** (`src/interfaces/mcp/gateway.py:371-388`, 10 per second by default), not its broker reads. The target gives each account a read budget, `observation.max_requests_per_minute`, a measured refusing parameter.
* **Legacy recovery records the books it rebuilt from as events** (`REBUILT_OBSERVATION`, `src/tier1/recovery.py:22`, `:287`). The target publishes an observation to the evidence store only when a decision is about to cite it (publish-before-reference, Combined-F2), and the writer checks the citation.

### Decisions

* **A reader cycle is the unit.** A cycle reads, in order, `orderbook`, `tradebook`, `positions` and `funds` for one account, and is stored or dropped whole.
  * If any read fails, the whole cycle fails. Failing means it raised, returned another account's or another endpoint's observation, held items of the wrong type, or was stamped beyond `now + clock_skew_secs`. Nothing of it is stored or reconciled, and `health(account).failures` rises.
  * So the latest positions and funds are never older than the books whose fills or completions they sit beside. A fill can never lower a reservation while capacity still reads positions from before it, which would admit beyond capacity. Because positions and funds are read after the books, a fill in the tradebook is in that cycle's positions, as far as the broker's own books agree. Whether OpenAlgo's positionbook can lag its tradebook is characterized in TASK-S07-05.
  * `latest(account)` returns the newest stored cycle as `AccountObservation(orders=…, positions=…, funds=…, digest=…)`, the existing type, with `orders=` unchanged. Its `digest` is the SHA-256 of the canonical list of the three digests. Before the first cycle it returns `None`: admission refuses `ADM-R05`, and row 6 waits. The tradebook of the cycle is kept beside it for reconciliation.
  * Each account's latest is one immutable snapshot reference, swapped whole. A read from another thread (action admission's stage A, `admission.py:534`, which is advisory; stage B reads again) always sees one whole cycle.
* **Ordering and redelivery.**
  * Each reader numbers its cycles (`seq`, per account, from 1). `drain` drops a cycle whose `seq` is not above the stored one (an older cycle), or whose four digests equal the stored cycle's (a redelivery, F-O6). Either way the cycle is neither stored nor reconciled.
  * Ordering never compares wall-clock `as_of`, so a forward clock jump cannot halt the loop.
  * **Deviation:** the execution-domain spec keeps the latest `as_of` per broker order ID. Each book is a whole cumulative snapshot, so the newest cycle per account carries every order's newest state, and the spec is amended to say so.
* **Pending cycles.** Readers do not queue. Each account has one pending slot, and a new cycle replaces an unprocessed one, since books are cumulative. After filling the slot, the reader calls `wake()` (the coordinator's). `drain` takes the slots in `AccountId` order. A writer stall therefore leaves at most one cycle per account waiting.
* **The read budget.**
  * Each account keeps a sliding window of read times over the last 60 seconds (`(now − 60 s, now]` on `clock.elapsed()`). A cycle starts only if four reads fit in the window; otherwise it is skipped whole, and `health(account).budget_skips` rises. A read that raises still counts.
  * The settings loader refuses a budget below one full cycle per interval: `4 × ceil(60 / observation_poll_interval_secs) > observation_max_requests_per_minute` is a `SettingsError`. It applies after both are resolved and only when both are bound, and `compose_simulation` applies the same check before composing the loop. The check sets no value: it refuses an owner pair that would starve the reads.
  * The budget counts the kernel's book reads. Step 4's in-send orderbook read (the basket's validated join) also counts against the same per-account budget. The supervisor's reads go through the mediator (SLICE-11).
* **Every citing decision publishes first, and the writer checks it.**
  * The loop's `publish(observation) -> EvidenceRef` publishes `observation.content`. It raises `EvidenceUnpublished` when `content` is `None`, when publishing raises anything, or when the returned digest differs from `observation.digest`. `class EvidenceUnpublished(Exception)` is not an `OSError`, so it never marks the writer failed. Nothing is remembered between calls: `EvidenceStore.publish` already skips an intact object.
  * **Reconciliation:** `lifecycle.reconcile(..., publish=None)` calls `publish` exactly once, before its first `transact`, if and only if `findings` is non-empty. It then puts the returned ref in every draft's `evidence`, so the writer resolves it inside the transaction (`store.py:643-650`). `EvidenceUnpublished` propagates out of `reconcile`; `drain` catches it, counts `health(account).publish_failures`, keeps the cycle as the latest, and moves on. The next cycle is judged afresh (F-O11). With `publish=None` (step 2's callers), drafts carry no ref, as now.
  * **Admission:** both front doors cite the three books' digests in `COMMAND_ADMITTED`'s `state_heads`. Inside stage B, after the last check passes, the door calls `observations.cite(observation) -> tuple[EvidenceRef, ...]` and puts the refs in `COMMAND_ADMITTED`'s `evidence`. The loop's `cite` publishes the three books. On `EvidenceUnpublished`, stage B returns `stop(Refusal("ADM-R05", "stale_input", key, "COMMAND_ADMITTED"), "B1", reason="evidence_unpublished")`. A fixture's `cite` returns `()`.
  * **The operator's route (Q-007):** `publish_latest(account) -> EvidenceRef` publishes the latest cycle's orderbook on the writer thread. A human resolving an untagged timeout cites it in `attempt_resolve`. Without it, an order that appeared after the escalation sits in books that cite nothing, so they are never published, and `attempt_resolve` would refuse `DOM-R05` forever. SLICE-10's interface calls it; step 3 tests it.
  * Dispatch revalidation cites no observation (`DISPATCH_REFUSED`'s payload is `{code, message, dependency}`, `coordinator.py:503-504`), so row 6 publishes nothing.
* **Draining on the writer thread.**
  * `Coordinator.observation_loop` is an attribute, `None` by default, set by bootstrap. `run_pass` calls `drain()` only when it is set, after it commits worker returns and before its stage check. So an acknowledgement is committed before a book that shows its order is judged.
  * `drain` stores each accepted cycle. Then, only while `reconcile_allowed()` holds, it reconciles the cycle's orderbook and then its tradebook. Positions and funds are never reconciled, since they corroborate only (step 1).
  * Bootstrap passes `reconcile_allowed = lambda: recovery.stage in ("RECOVERY_WRITING", "OPERATING")`. `RECOVERY_WRITING` is entered only after recovery's steps 1–3, which `Recovery.run()` completes during composition, before any drain ([sessions spec](../../design/sessions-authority-lifecycle.md#actions-per-stage)).
  * In `INSPECTING` a cycle is stored as the latest and not reconciled. Findings are edge-triggered on ledger state, so the next cycle carries the same facts.
  * A cycle whose orderbook is older than the freshness bound (`max_observation_age_secs`) is stored and not reconciled, so no `ledger_view` is built for it.
  * `PassReport` gains `reconciled: tuple = ()`, the committed (kind, command key) pairs, on both of its returns.
* **Two port names.**
  * `kernel/ports.py`'s `ObservationPort` becomes the spec's four reads: `orderbook`, `tradebook`, `positions` and `funds`, each `(account) -> Observation`.
  * The current one-method port is renamed `LatestObservations` (`latest`, `cite`). `AdmissionPorts.observations` and `DispatchPorts.observations` keep their names and take a `LatestObservations`.
  * `AdmissionPorts.observations = None` means the kernel's `ObservationLoop`, composed by bootstrap, as `safety` and `conflicts` already are. A fixture stays allowed for tests.
* **An observation carries its publishable content.**
  * `Observation` gains a keyword field `content: Mapping | None = field(default=None, compare=False)`. The adapter sets `digest` to `content_digest(content)`, the evidence store's SHA-256 of canonical JSON, so publishing returns `digest`. The adapter never publishes.
  * `contracts/evidence.py` gains `observation_content(observation_fields..., items) -> dict`. Its shape is `{"kind": "observation", "endpoint", "account", "as_of", "arrived_at", "domain", "coverage": {"complete", "interval"}, "items"}`, with each item as `{field: value}` over its dataclass fields, `Timestamp`s as their `utc_iso`, `account` as its wire, and `interval` `{"start", "end"}` or `null`. That is step 2's E-13 form plus `arrived_at` (each poll its own digest) and `coverage`. The simulated broker and `ScriptedObservationPort` both use it. Step 4's OpenAlgo `content` carries the same E-13 fields.
* **Endpoint names.** The reads return `endpoint` `orderbook`, `tradebook`, `positionbook` and `funds` (the pure core's names, `reconciliation.py:20`). The cycle's keys are `orderbook`, `tradebook`, `positions` and `funds`.
* **Which accounts have readers.** The writer gains `observed_accounts() -> list[AccountId]`, sorted, covering:
  * every account named by a grant with `revoked_sequence IS NULL` (`valid_until` ignored);
  * every account of a standing binding with `revoked_sequence IS NULL`;
  * every account in `command_identity`, whatever the state.

  The last clause keeps a reader for every account that has, or once had, a position or a resting order, after a restart or a revocation; it reads more than the minimum. `start()` (the host's; tests call it explicitly) spawns a daemon reader for each such account. Each `drain` spawns one for any new account while started. `stop()` sets every reader's stop event and joins each with a 5-second timeout. The `simulation` fixture's teardown calls `stop()`. `read_once(account) -> tuple[str, ...]` runs one cycle on the calling thread and returns the four kinds, or `()` when the cycle was skipped or failed.
* **`ReadHealth`** has fields `last_as_of: Timestamp | None` (the newest stored cycle's orderbook `as_of`), `failures: int`, `budget_skips: int` and `publish_failures: int`. Readers update it under a lock, and `health(account)` returns a copy.
* **Endpoint contracts in simulation only.** `compose_simulation(..., observation_port=None)` takes its observation port (by default the broker), and reads `endpoint_contracts()` from it into `ReconciliationPolicy.contracts` when it composes the loop. The production composition (step 4, SLICE-11) takes contracts only from release-bound TASK-S07-05 records, never from an adapter method. A fixture composition keeps `{}`, so step 2's tests are unchanged.
* **The simulated broker keeps a book.** It implements `ObservationPort`. The book has its own lock, never held across a stall, so reads continue while a send is stalled (A03-F1).
  * **Constructor:** `SimulatedBroker(responder, clock, coverage="yes", evidence=None, *, funds: ObservedFunds | None = None, book_start: Timestamp | None = None)`.
    * `funds` serves every account, and `set_funds(funds)` replaces it under the book lock. A funds read without funds raises, which is a failed cycle.
    * `book_start` is the start of the orderbook and tradebook coverage interval (default `clock.now()` at construction). The test builders pass the trading day's open, `2026-11-02T03:45:00.000000Z`, so a claim at the test clock's start lies inside the covered interval.
  * **Sends change the book where it can place them.**
    * An entry `ack` adds an open order from the plan's first leg (instrument, side, quantity, limit price), with `placed_at` `clock.now()`. A `timeout` that names an `order_id` (step 2's tagged timeout) adds it too. An untagged `timeout`, and a plan of `None`, add nothing.
    * A close `ack` adds an open order for the request's quantity and order. It takes the step's `instrument` and `side` when named. Otherwise it takes the account's one open book position, with the opposite side.
    * A cancel `ack` marks its target `cancelled`. A modify `ack` changes its target's level or quantity, and a named replacement `order_id` cancels the target and adds the replacement, open.
    * **When the book cannot place the effect,** it is left unchanged and the send result is unaffected. That covers a close with no single open book position and no named `instrument` and `side`, and a cancel or modify whose target is not in the book. This keeps every earlier test, whose orders and positions are fixtures, working.
  * **`BookStep`** is a frozen dataclass in `adapters/simulated_broker.py` with fields `at: str` (UTC ISO, recorded clock), `account: AccountId`, `kind: Literal["fill", "status", "foreign"]` and `order_id: str`. It also has `quantity`, `price`, `fill_id`, `status`, `instrument` and `side`, each `None` unless its kind uses it. `add_step(step)` appends one. At every read, each due step (`clock.now() ≥ at`) of any account is applied, in list order. The kinds:
    * `fill`: the order must be in the book; a missing order is a test bug. Its filled quantity rises, a trade is recorded with `traded_at` `at`, and the order becomes `filled` when complete. A quantity above the remaining is a test bug.
    * `status`: sets `cancelled`, `rejected` or `expired`.
    * `foreign`: adds an open order this broker never sent, with `placed_at` `at`. This is CUJ-DOM-4's unattributed order and Q-016's foreign activity; later `fill` steps can fill it.
  * **What the reads return.** `as_of` is stamped before the read and `arrived_at` after. The domain is always `simulated`. Each item:
    * an order: one `ObservedOrder`, with `amount` and `margin` equal to quantity × limit price, or `None` without one, and `placed_at`;
    * a trade: one `ObservedTrade`;
    * a position: one `ObservedPosition` per traded instrument, with `identity` `pos-<instrument>`. `net_quantity` is BUY fills minus SELL fills, and a flat instrument stays as a row at 0. `amount` and `margin` are |net| × the instrument's last fill price, a simulation rule labelled synthetic in a code comment;
    * funds: one `ObservedFunds`, the broker's `funds` with `as_of` the read's.

    The coverage is the configured `coverage` for every book. The orderbook and tradebook interval runs from `book_start` to `as_of`; positions and funds have no interval.
  * **Domain.** Step 2's per-step `domain` stays a seam for send results in tests only. The execution-domain spec is amended to say so, and that funds come from the constructor, not the responder.
  * **`endpoint_contracts() -> dict[str, EndpointContract]`** returns contracts for `orderbook` and `tradebook`: deployment version `simulated-1`, coverage rule `complete_when_all_pages`, `covers` `trading_day_to_read`, `visibility_secs` 0, no mode marker, no client tag, no status mapping, and `verified_by` `EvidenceRef("simulated", "0" * 64, <construction time>)`. These are properties of the simulated adapter, not owner parameters.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/reconciliation.py` | `ObservationLoop`, `ReadHealth`, `EvidenceUnpublished` |
| `src/autonomous_trading/kernel/lifecycle.py` | `reconcile(..., publish=None)`; refs into drafts' `evidence` |
| `src/autonomous_trading/kernel/ports.py` | `ObservationPort` (four reads); `LatestObservations` (renamed, with `cite`) |
| `src/autonomous_trading/contracts/evidence.py` | `Observation.content`; `observation_content(...)` |
| `src/autonomous_trading/kernel/ledger/evidence_store.py` | `content_digest(content)`, the digest `publish` returns |
| `src/autonomous_trading/kernel/ledger/store.py` | `observed_accounts()` |
| `src/autonomous_trading/adapters/simulated_broker.py` | The book, `BookStep`, `add_step`, `set_funds`, the four reads, `endpoint_contracts()` |
| `src/autonomous_trading/kernel/coordinator.py` | `wake()`; `observation_loop`; `drain` in `run_pass`; `PassReport.reconciled` |
| `src/autonomous_trading/kernel/admission.py` | `cite` in both doors' stage B; refs in `COMMAND_ADMITTED`'s `evidence`; `evidence_unpublished` |
| `src/autonomous_trading/bootstrap.py` | Compose the loop when `observations` is `None`; `compose_simulation(..., observation_port=None)`; contracts in simulation only; the budget check; `Composition.observation_loop` |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `observation_poll_interval_secs`, `observation_max_requests_per_minute`; the budget check |
| `tests/conftest.py` | The two settings; `FixtureObservations.cite`; `admission_ports(..., loop=False)`; `fresh()` leaves a loop alone; `build(..., funds=None, book_start=None)`; `observe(...)`; `book_step(...)`; `loop_filled_entry(...)`; `ScriptedObservationPort` and `scripted(...)`; `stop()` at teardown |
| `tests/unit/test_observation_loop.py` | New (tree delta **T-30**): the loop, publishing, the budget, the simulated book |
| `tests/integration/test_bounded_io.py` | Reads continue during a stalled send; an arrival wakes the coordinator |
| `tests/integration/test_dispatch_revalidation.py` | PRF-DSP-09 through the loop |
| `tests/unit/test_admission_checks.py` | PRF-ADM-09 through the loop |
| `tests/integration/test_shared_engine.py` | New: PRF-DOM-08 |
| `tests/unit/test_policy_parameters.py` | The two settings and the budget check |
| Spec amendments | The execution-domain spec: the simulated broker (the book, the domain sentence, funds from the constructor), ports (`LatestObservations`), polling (cycles, drain order, failures, the budget check) and the per-order-ID sentence (the Deviation). The dispatch spec's loop (drain after returns). The intent spec's `ADM-R05` row (a cited observation that could not be published) |

### `ObservationLoop` (`kernel/reconciliation.py`)

```text
ObservationLoop(port: ObservationPort, writer, clock, evidence, policy: ReconciliationPolicy, *,
                rounding: str, poll_interval_secs: int, max_requests_per_minute: int,
                wake: Callable[[], None], reconcile_allowed: Callable[[], bool])
  latest(account) -> AccountObservation | None        # LatestObservations; one whole cycle
  cite(observation: AccountObservation) -> tuple[EvidenceRef, ...]   # raises EvidenceUnpublished
  publish_latest(account) -> EvidenceRef              # the latest orderbook, for attempt_resolve
  read_once(account) -> tuple[str, ...]               # one cycle on the calling thread
  drain() -> tuple[tuple[str, str | None], ...]       # writer thread; the committed pairs
  start() / stop()
  health(account) -> ReadHealth
```

The pure `assess` and `findings` are unchanged; the loop only feeds them.

### Settings added

| Field (section, key, environment) | Kind | Test value (labelled synthetic) |
|---|---|---|
| `observation_poll_interval_secs` (`observation`, `poll_interval_secs`, `AT_OBSERVATION_POLL_INTERVAL_SECS`) | positive integer, refusing | 5 |
| `observation_max_requests_per_minute` (`observation`, `max_requests_per_minute`, `AT_OBSERVATION_MAX_REQUESTS_PER_MINUTE`) | positive integer, refusing; at least `4 × ceil(60 / poll)` | 60 |

Both join `_ADMISSION` (kind `int`), `ADMISSION_REQUIRED` and the conftest `ADMISSION_SETTINGS`, and both are null by default. The existing `poll_interval_secs` (`market`, POL-020, view age) is unrelated.

### Step 3 tests

* **Fixtures (conftest):**
  * `admission_ports(..., loop=True)` sets `observations=None`. `AdmissionWorld.fresh()` then refreshes the views only.
  * `build(..., funds=None, book_start=None)` forwards both to `SimulatedBroker`. Loop worlds pass `funds=ObservedFunds("10000.00", "8000.00", "0.00", "0.00")` and `book_start` the day's open.
  * `observe(world, advance_ms=1_000, account=ACCT)` advances the clock, runs `read_once(account)` and one `run_pass()`, and returns the `PassReport`. Every test that reads twice reads through it.
  * `book_step(world, after_ms=0, account=ACCT, **fields)` adds a `BookStep` at `now + after_ms`.
  * `loop_filled_entry(world, key="k-entry", *, order_id="E1", quantity=75, fill=25, price="20.00", fill_id="F-E1")` admits and dispatches an entry acknowledged as `order_id`, adds a `fill` step, and observes. It returns the position ID.
  * `ScriptedObservationPort(contracts)` has `queue(kind, observation)`; a read of an empty kind raises, which is a failed cycle. `scripted(kind, items, *, domain, as_of, account=ACCT)` builds an `Observation` through `observation_content`, with its `digest`. Scripted funds are `ObservedFunds("10000.00", "8000.00", "0.00", "0.00")`. The world composes it through `compose_simulation(..., observation_port=…)` with `rcontract()` contracts.
* `test_observation_loop.py`:
  * `latest` is `None` before the first cycle, then one whole cycle;
  * a cycle with any failed read stores nothing and reconciles nothing (raising, another account, another endpoint, a stamp beyond `now + skew`). In particular, a tradebook showing a fill whose positions read fails never commits that `FILL`;
  * an older cycle (lower `seq`: the first cycle put back in the pending slot after the second is drained) and a redelivered one (equal digests, read twice with no clock advance) are neither stored nor reconciled. A counting wrapper around `lifecycle.reconcile` (monkeypatched) sees only `orderbook` and `tradebook`;
  * a cycle with findings publishes once, before its commit. Each committed event's `evidence` holds the ref, and the store resolves it to the observation's `content`. A cycle with no findings publishes nothing;
  * F-O11: a publish failure, or a digest mismatch, commits nothing for that cycle, keeps it the latest, counts `publish_failures`, and the next cycle commits;
  * `INSPECTING`: `latest()` is set and `PassReport.reconciled == ()`;
  * the budget, on a loop built directly with `poll_interval_secs=60, max_requests_per_minute=4`: a second `read_once` at the same elapsed time returns `()` with `budget_skips == 1`, and after `advance(60_000)` the cycle runs;
  * `cite` publishes the three books, and `COMMAND_ADMITTED`'s `evidence` holds their refs. A publish that raises `OSError` records `ADM-R05` with `reason: evidence_unpublished`, `writer.failed` stays False, and the next admission commits;
  * `publish_latest`: an untagged timeout is escalated, a `foreign` step then shows `E7`, and `attempt_resolve` citing `publish_latest(ACCT)` resolves `RESOLVED_REACHED`;
  * the simulated book:
    * each send effect, including the unplaceable ones left alone;
    * each `BookStep` kind at its time;
    * positions with a flat row at 0;
    * coverage and its interval from `book_start`;
    * the domain always `simulated`;
    * `digest == content_digest(content)`;
    * `endpoint_contracts()`'s two contracts.
* `test_bounded_io.py`: with the loop started and a send stalled on the account, a cycle is still drained and `wait_woken(5)` returns True on its arrival. `stop()` ends the readers.
* `test_dispatch_revalidation.py` (PRF-DSP-09):
  * **CUJ-DSP-4.** `loop_filled_entry(fill=75)` gives a position of 75. An entry stalled on a second underlying holds the account's worker. A market close of 75 is admitted. A `foreign` step adds `X1` SELL 75 at 20.00, with a `fill` of 75 (`F-X1`). The broker position is then 0, so the next `observe` makes row 6 refuse the close `ADM-R07`, and nothing is sent.
  * **Stale.** A cycle at T0. Advance 55 000 ms, refresh the views, and admit a close of 50 on a `loop_filled_entry(fill=75)` position and an entry on `BANKNIFTY` on the same account. Advance 6 000 ms; with no new cycle, `run_pass` gives `waiting == ("k-close",)` and `claimed == ("k-bn",)`.
  * **Returns before observations.** Claim an entry, wait for its return to be queued (`wait_woken`), add a `fill` step for its order, `read_once`, then `run_pass`. `("FILL", key)` is in that pass's `reconciled`.
* `test_admission_checks.py` (PRF-ADM-09), with the loop's observations:
  * `loop_filled_entry` leaves entry A's reservation at 1000.00 and its broker position at 500.00 (25 × 20.00);
  * `set_funds(ObservedFunds("3000.00", "8000.00", "0.00", "0.00"))` and an observe; entry B, on underlying `BANKNIFTY` so row 1 cannot refuse it first, passes B5 (1500.00) at exactly the boundary;
  * with available `"2999.99"` it refuses `amount`. Without step 2's reduction, the boundary would be 3500.00, which shows the count is not doubled;
  * F-A7 through the loop, with the existing numbers.
* `test_shared_engine.py` (PRF-DOM-08), through `ScriptedObservationPort`:
  * **CUJ-DOM-1.** An entry is acknowledged as `analyzer` (send step `domain`) with `A1`. A complete `live` orderbook without `A1` gives no absence, no conflict and no release, and a later entry is sent.
  * **The tagged variant.** An `analyzer` tagged timeout naming `A2`, then a complete `live` orderbook without `A2` past the window, gives no `RESOLVED_NEVER_REACHED` (`domain_differs`).
  * **Cross-domain identity.** A `live` orderbook showing `A1` `filled`, with a `live` tradebook trade on it, gives `CONFLICT_RECORDED` (`cross_domain_id`) and its escalation, no `FILL`, no `COMPLETED`, an unchanged reservation, and no refused send.
  * **Under `forbid`.** An entry acknowledged with send step `domain: unknown` and a scripted `unknown` tradebook: its fill is recorded, and the reservation is not reduced.
  * Each of the two settings unbound refuses the composition.
* `test_policy_parameters.py`: the two settings resolve, are null by default, and refuse non-positive values. The budget check refuses 5 s with 47 per minute and accepts 48.
* **Break checks** (named in the docstrings; each fails the test named):

  | Break | Test |
  |---|---|
  | Store a partial cycle | the failed-cycle test |
  | Store an older cycle | the older-cycle test |
  | Drop the digest clause (reconcile a redelivered cycle) | the redelivery test's reconcile counter |
  | Reconcile positions | the reconcile counter |
  | Commit before publishing | the publish-once test (resolution order) |
  | Commit after a failed publish | F-O11 |
  | Attach no ref to a reconciliation draft | the publish-once test |
  | Reconcile in `INSPECTING` | the `INSPECTING` test |
  | Ignore the budget | the budget test |
  | Store another account's cycle | the failed-cycle test |
  | Admit without citing | the `cite` test |
  | Let `EvidenceUnpublished` escape stage B | the `cite` test (`writer.failed`) |
  | Drain before worker returns | returns before observations |
  | Hold the book lock across a stall | `test_bounded_io.py` |
  | Let `cross_domain_id` record facts | the cross-domain test (no `FILL`) |
  | Drop a fact under `forbid` | the `forbid` test |
  | Skip row 6 for a close | CUJ-DSP-4 |

### Step 3 as built

Commit `c58f10e` on `slice-07`, on top of step 2's `ee2225a`. It changes 20 paths (1,258 lines added, 37 removed). The files match the step's table.

**A gap the tests found.** As first written, a send placed its effect on the book without first applying the book steps already due. So a close sent after a fill step's time saw no open position, and was left out of the book. A send now applies every due step first, under the same lock. `test_sends_change_the_book_where_it_can_place_them` proves it.

**Choices made while building** (none sets a money value; the test values are labelled synthetic):

| Topic | As built |
|---|---|
| The loop worlds' budget | `LOOP_SETTINGS` binds `observation_max_requests_per_minute` 6000, not the step's 60. A test reads many cycles within one recorded minute, and at 60 some would be skipped silently. The budget itself is proved on a loop built directly with 60 s and 4 per minute, as the step says. `ADMISSION_SETTINGS` keeps 60 |
| The first cycle | `open_admission_world` reads one cycle for each account of a loop world and drains it. A failed first read only counts: the scripted port has nothing queued yet, so `test_shared_engine.py` queues its own first cycle. In a loop world `world.fresh()` refreshes the market views only |
| `loop_filled_entry` | Has no `quantity` parameter, since the plan fixes 75. It asserts that its fill was committed in the same pass |
| A close's tagged timeout | Places its order in the book, as an entry's does. The step named only the entry |
| Escalations | `reconcile` puts the observation's ref in a `RECONCILIATION_ESCALATED` event's `evidence` too, not only in command drafts |
| Q-007's test | With the simulated contracts, an empty book would judge an untagged timeout never reached. So the foreign `E7` is in the book before the first cycle after the timeout, and the test proves the route (`publish_latest` gives `attempt_resolve` a book to cite), not a late appearance |
| The break check "commit before publishing" | Implemented as publishing after the commits, with no ref. A commit that cited an unpublished digest would be refused by the writer (`LED-R06`), which is the guard the step relies on |

**Tests** (603 passed, twice, with `pytest` in the slice's virtual environment on the development machine; no broker variables):

| File | Cases |
|---|---|
| `test_observation_loop.py` (20, new) | **Cycles:** `latest` before and after a drained cycle; a failed cycle (a raising read, another account, another endpoint, a future stamp) stores and reconciles nothing, including a fill whose positions read failed; an older and a redelivered cycle; only the books reconciled. **Publishing:** once, before the commit, with the ref in the event's `evidence` resolving to the tradebook's content; nothing published without findings; a raising publish and a digest mismatch (F-O11). **Gates:** `INSPECTING`; the budget at 4 per minute across the 60 s boundary. **Admission:** the three books cited; a failed citation records `ADM-R05` `evidence_unpublished`, leaves the writer working, and the next admission commits. **Q-007:** `publish_latest` for `attempt_resolve`. **The book:** every send effect, including the ones left alone; each `BookStep` kind at its time; a flat position row; coverage, domain, digest and contracts; funds required |
| `test_shared_engine.py` (7, new) | CUJ-DOM-1; a tagged analyzer timeout never judged by a live book; a cross-domain identity match (a conflict, no facts, an unchanged reservation, no refused send); a fill recorded under `forbid` with no reduction; each observation setting unbound; a budget below one cycle |
| `test_dispatch_revalidation.py` (+3) | CUJ-DSP-4 through the loop; a stale book makes a close wait while the same account's entry is claimed; returns committed before the books are judged |
| `test_admission_checks.py` (+3) | PRF-ADM-09's boundary at 3000.00 and 2999.99; F-A7 through the loop |
| `test_bounded_io.py` (+1), `test_policy_parameters.py` (+1) | Reads continue while a send is stalled; the two settings and the budget check |

**Break checks** (each applied to the source, run against the named test, and reverted byte for byte with an md5 check; every one failed its test):

| Change | Test that failed |
|---|---|
| Store a partial cycle | `test_a_failed_read_fails_the_whole_cycle` |
| Store an older cycle | `test_an_older_cycle_is_neither_stored_nor_reconciled` |
| Drop the digest clause | `test_a_redelivered_cycle_is_neither_stored_nor_reconciled` |
| Reconcile positions | `test_only_the_books_are_reconciled` |
| Commit before publishing | `test_a_cycle_with_findings_is_published_once_before_its_commit` |
| Attach no ref to a reconciliation draft | the same test |
| Commit after a failed publish | `test_a_failed_publish_commits_nothing_and_the_next_cycle_does` |
| Reconcile in `INSPECTING` | `test_inspecting_stores_and_reconciles_nothing` |
| Ignore the budget | `test_the_budget_skips_a_whole_cycle_until_the_window_moves` |
| Store another account's cycle | `test_a_failed_read_fails_the_whole_cycle` |
| Admit without citing | `test_admission_publishes_the_three_books_it_cites` |
| Let an `OSError` escape the loop's publish in stage B | `test_a_failed_citation_refuses_without_failing_the_writer` |
| Drain before worker returns | `test_returns_are_committed_before_the_books_are_judged` |
| Hold the book lock across a stall | `test_reads_continue_while_a_send_is_stalled` |
| Let `cross_domain_id` record facts | `test_an_identity_match_in_another_domain_is_a_conflict_and_records_no_facts` |
| Drop a fact under `forbid` | `test_facts_are_recorded_under_forbid_while_releases_wait` |
| Reduce an `unknown` fill under `forbid` | the same test |
| Skip row 6 for a close | `test_cuj_dsp_4_a_position_flattened_before_the_claim` |
| Skip the fill's reduction (capacity counts it twice) | `test_b5_through_the_loop_counts_a_filled_entry_once` |

One run of the break script left a mutation in place. Its second anchor did not match after the first edit had been written, so `kernel/lifecycle.py` stayed changed. It was restored by hand and checked against the md5 recorded before the run. The script now checks every anchor before it writes anything. The suite runs above came after the restore.

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
