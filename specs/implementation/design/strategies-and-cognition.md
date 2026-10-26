# Strategies and cognition (stub)

* **Status:** proposed **stub**. Full depth is written when SLICE-09 starts. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `strategies/*`, `cognition/*`.
* **Master anchors:** [Strategy extension](../../../README.md#strategy-extension-and-invocation-contracts) (`README.md:837-843`), [Cognitive Fabric](../../../README.md#cognitive-fabric) (`:845-859`), A05-F1…F5, Combined-F5 (`:841`), D09 (`:231`, `:847`), D12 evidence side (`:752`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-STR-001 | Explicit declarative registry; descriptors are validated before any code loads; registration grants nothing; a missing `authority` is refused; registry rows are never rewritten to match a file | A05-F1 (`README.md:839`); POL-030 |
| REQ-STR-002 | The worker owns invocation, input view, prior state and result identity, plus recoverable output handoff; dependent invocations within a state scope are serialized | A05-F2 (`README.md:841`); Combined-F5 |
| REQ-STR-003 | Intent generation and review of a fixed intent are distinct typed purposes; a review never replaces an intent | A05-F3 (`README.md:843`) |
| REQ-STR-004 | Typed team assembly distinguishes contribution, abstention, unavailable, invalid, timeout and cancellation; provider errors are recorded, never treated as ALLOW or BLOCK | A05-F4 (`README.md:851`); POL-037 |
| REQ-STR-005 | Provider and run records keep requested and effective model identity, prompts, context, tools, attempts and typed output; replay uses recorded responses | A05-F5 (`README.md:853`) |
| REQ-STR-006 | Cognition has no financial socket, broker key, live policy write or ordinary locked-OOS access; OS-enforced capabilities | D09 (`README.md:847`); POL-034 |
| REQ-STR-007 | Retained strategies keep approved scoring: BuyerEdge fixed floor; gamma, IV and volume research-only; greeks exact-minute rule | POL-024; §7 (`README.md:1149`) |
| REQ-STR-008 | Provider `Retry-After` pause ends no later than session close, with a warning past 15 min; no internal budget ceiling | POL-032, POL-033 |

## What early slices need now

* SLICE-01…SLICE-07 use a **fixed `Intent` and a recorded `Review`** from fixtures. No strategy or cognition code runs.
* `contracts/decisions.py` (owned by [intent-to-admission](intent-to-admission.md)) defines the `Intent` and `Review` shapes that this domain will produce.

## Reuse rows and divergences

* BuyerEdge/EMA/worker strategies: **keep/wrap** (`README.md:1149`).
* Advisor/team/AI management/records: **reuse cognition; relocate review application** (`README.md:1152`).
* Legacy `runtime/agent_team/__init__.py:176` strips credentials but does not by itself establish OS denial (`README.md:231`).

## Open items

* A2 committee risk-critic (POL-035), deferred.
* Provider fallback activation (POL-036), on the owner's word.

## To specify at SLICE-09

Descriptor schema; the invocation and state-scope state machine with crash points at state, output and acceptance; the review-purpose envelope; blueprint validation; provider record schema; capability enforcement tests (`README.md:1243`).
