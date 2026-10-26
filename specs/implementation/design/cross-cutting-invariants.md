# Cross-cutting invariants

* **Status:** proposed (package spec). It owns **no module** and creates no package. It states rules every spec and slice must keep.
* **Precedence:** master README, then ROADMAP, then this file.

## Requirement keys

| Key | Rule | Decision (anchor) |
|---|---|---|
| REQ-XC-001 | **Master wins.** The master README, then ROADMAP, then this package. A package/master disagreement becomes an X item; the package never repairs the master silently, and never mints decision IDs | `AGENTS.md:29`, `:72`; `README.md:436-444` |
| REQ-XC-002 | **Shared engine, separate instances.** Live, paper, replay and backtest run the same versioned intent, policy, planning, admission, reservation, lifecycle and protection code, each composition with its own clock, inputs, broker adapter and ledger. A simulated composition has no live adapter, authority socket, broker key or writable production store. OS restrictions supplement Python ports | `README.md:798-804`; diagram 1 note (`:566`) |
| REQ-XC-003 | **Open policy is a refusing parameter.** Every owner-controlled value that is not decided is a typed policy field with no shipped default. The loader refuses a composition that needs it and lacks it. Tests use values labelled `synthetic` and exercise every branch | `README.md:442`; brainstorm decision 6 ([concepts brief](../egm/package/concepts_brief.md)) |
| REQ-XC-004 | **Visible safety, traceable refusals.** Every safety check reports active, inert or damaged as a recorded state. Every refusal carries the command key, the decision or check ID, the policy version and the evidence heads it used | LD-03; AUD-03 (`README.md:756`) |
| REQ-XC-005 | **Legacy is evidence.** Legacy code, defaults, docstrings and tests are class C evidence and reuse candidates. They become a requirement only through a master decision or an approved policy row. Legacy tests are never the proof oracle, except for named retained behaviour | `README.md:15`, `:1155`; A08-F3 (`:1211`); [legacy-divergence](../legacy-divergence.md) |
| REQ-XC-006 | **Independent work stays independent.** Development, tests, research and simulation never wait for market close, unrelated broker evidence or production readiness. Only operations with real financial, authority, privileged-access, isolation or custody effects carry gates | `README.md:1284-1306`; POL-051 |
| REQ-XC-007 | **Outcome classes.** Every exported outcome is one of simulated, OpenAlgo analyzer, live acknowledged or live broker-reconciled, or is explicitly `unknown` or `conflicting` (ATA-06). The classes are never mixed in an economics claim | `README.md:802`; ATA-06 (`:458`) |
| REQ-XC-008 | **Exact internal versions.** Live internal contracts are exact-version within one release; only supported history, frozen bundles and external interfaces have converters | A02-F1 (`README.md:901`); Combined-F3 (`:1197`) |

## Shared-engine parity proof

Parity is checked by **behavioural invariants**, not identical call graphs (AUD-03, `README.md:756`). For the same recorded inputs, recorded review evidence and scripted broker responses, the production-style composition (with the simulated broker substituted) and the simulation composition must produce the same:

* review applications;
* non-dispatch decisions;
* plans or refusals;
* admissions and reservations;
* lifecycle transitions;
* protection states.

Only these may differ:

* outcome class;
* clock domain label;
* ledger identity.

Proof: PRF-XC-01, `tests/integration/test_shared_engine.py` (README §6 path). Break check: a composition-specific branch in any shared function fails it.

## Refusing-parameter pattern (REQ-XC-003)

```text
policy field:   daily_loss_budget_inr: Decimal | None   # no default
loader:         if composition.requires("loss_latch") and field is None:
                    refuse(PolicyUnbound("daily_loss_budget_inr", question="Q-002"))
tests:          @synthetic(value=Decimal("1000"))      # label shows in every report
```

This pattern is used by these refusing fields:

| Field | Question | Spec |
|---|---|---|
| `risk.max_daily_loss_amount` | Q-002 | [protection-and-safety](protection-and-safety.md#daily-loss-latch-kernelsafetypy) |
| `safety.hold_automatic_actions` | Q-001 | [protection-and-safety](protection-and-safety.md#permission-matrix-kernelsafetypy) |
| `dispatch.ordering_rule` | Q-004 | [dispatch-and-coordination](dispatch-and-coordination.md#policy-inputs) |
| `protective_independence` | Q-004 | [protection-and-safety](protection-and-safety.md#conflict-relation-kernelsafetypy) |
| `reconciliation.unknown_domain_settlement` | Q-006 | [execution-domain-and-observations](execution-domain-and-observations.md#domain-attribution-rules) |
| `reconciliation.clock_skew_secs` | measured | [execution-domain-and-observations](execution-domain-and-observations.md#policy-inputs) |
| `adapter.http_timeout_ms` | measured (A09-F4) | [dispatch-and-coordination](dispatch-and-coordination.md#policy-inputs) |
| `coordinator.max_pending_per_account` | measured (A09-F4) | [dispatch-and-coordination](dispatch-and-coordination.md#policy-inputs) |
| `dispatch.deadline_ms.<verb>` | open (`README.md:758`) | [dispatch-and-coordination](dispatch-and-coordination.md#policy-inputs) |
| `account.freshness_secs`, `account.max_worst_case_loss` | TASK-S04-03 (legacy values) | [intent-to-admission](intent-to-admission.md#policy-inputs) |
| `review.timeout_ms` | TASK-S04-01 (legacy value) | [intent-to-admission](intent-to-admission.md#policy-inputs) |
| `money.rounding` | TASK-S04-03 (legacy behaviour) | [ledger-and-atomic-transaction](ledger-and-atomic-transaction.md#money-and-quantity-representation) |

## Proofs

| Proof | Class | Expected outcome | Break check |
|---|---|---|---|
| PRF-XC-01 | T `tests/integration/test_shared_engine.py` | Parity invariants above | A composition branch fails it |
| PRF-XC-02 | T `tests/contracts/test_capabilities.py` | A simulated composition cannot import or construct the live adapter, open the authority socket or read a broker key | Adding a live adapter to the simulation fails |
| PRF-XC-03 | T `tests/unit/test_policy_parameters.py` | Each refusing field refuses when unbound, and every synthetic value is reported as synthetic | A shipped default passes silently and fails the test |
| PRF-XC-04 | K (package checker) | Every package file states the precedence rule, and no package file mints a decision ID | — |
