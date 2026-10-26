# EGM review — execution-domain-and-observations

Process record (not normative). Target: [design/execution-domain-and-observations.md](../../design/execution-domain-and-observations.md). Resolution codes: **FIX**, **CONTEST**, **Q/X**.

## Stage 5 — initial zoom-out (1 Blocker, 6 Major, 4 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| B1 | Blocker | A client tag is assumed but OpenAlgo's order schema has none (`OA/src/core/framework/execution/book.py:14-18`, re-read at `445eb116`) | FIX: tag round-trip is an endpoint-contract item defaulting to not available; `RESOLVED_NEVER_REACHED` needs a verified identity or a window where every order is tied to another command; an order an unresolved attempt could account for is never recorded as foreign; SLICE-01 drops `client_tag`; **Q-007** for the case with no identity; **LD-20** for legacy shape adoption |
| M1 | Major | No rule for combining domain evidence | FIX: combination table |
| M2 | Major | Analyzer and conflicting obligations vs live capacity | **Q-008**; counted until answered |
| M3 | Major | `unknown` settlement split per composition | FIX: one refusing parameter `reconciliation.unknown_domain_settlement`; Q-006 reworded |
| M4 | Major | Two `TransportResult` definitions; basket mapping; legacy `invalid` | FIX: one type in `contracts/execution.py` with per-leg results; command-level class rule; `invalid` → `ambiguous` |
| M5 | Major | Reuse of `tier1/ports.py` and `reconcile.py` helpers missing; shape-based resolution not flagged | FIX: cites added; LD-20 |
| M6 | Major | Observation identity and redelivery | FIX: identity is the evidence digest; redelivery is a no-op |
| N1 | Nit | `account_binding` basis had no row | FIX: row added with verification requirement |
| N2 | Nit | `ModeRead` consumer unclear | FIX: operator displays and supervisor only |
| N3 | Nit | Four broker port methods | FIX: one `send(typed_request)` |
| N4 | Nit | Observation port names differ from the simulated broker | FIX: aligned |

## Stage 6 — comprehension (4 Blocker, 11 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-B1 | Blocker | Combination table incomplete; simulated settlement unclear | FIX: symmetric full table; simulated combines only with simulated; `basis` of a combined value |
| 6-B2 | Blocker | Domain absent from the reconciliation rules; CUJ-DOM-1 has no row | FIX: an observation is used only for attempts whose combined domain is not `conflicting`; cross-domain rows; `WORKING` order missing from a book |
| 6-B3 | Blocker | "Attempt window" undefined | FIX: defined from claim time to outcome time plus a skew allowance (refusing parameter) |
| 6-B4 | Blocker | Observed item types and pagination undefined | FIX: field lists; the adapter fetches all pages; partial pages give incomplete coverage |
| 6-M1 | Major | `Assessment`, `ledger_view`, `Decision`, policy inputs | FIX |
| 6-M2 | Major | Rule order; `COMPLETED`; held-back unattributed orders | FIX: evaluation order; completion via the ledger's verb rules; re-assessment |
| 6-M3 | Major | Cancel with no fill vs ledger completion; modify level | FIX: only a **close** without filled quantity stays reserved (POL-016); cancel follows the ledger; modify completes at the broker's level (POL-014) |
| 6-M4 | Major | Per-leg release and "residual" | FIX: `RESERVATION_REDUCED` by the rejected legs' plan amounts; residual defined |
| 6-M5 | Major | OpenAlgo response mapping | CONTEST in part: per-endpoint mapping comes from the recorded captures (TASK-S07-05) and the legacy classifier; transport-error classes and the not-sent proof are stated here |
| 6-M6 | Major | `EvidenceRef` store and digest bytes; identical polls | FIX: store defined; observation digest covers arrival metadata, so repeated polls are distinct |
| 6-M7 | Major | Endpoint contract has no representation | FIX: `EndpointContract` record in the bound release |
| 6-M8 | Major | "Escalated", `accounting_only`, refusing parameter | FIX: escalation is a recorded event plus operator alert; `accounting_only` defined; REQ-XC-003 linked |
| 6-M9 | Major | Mediator interface | FIX: allowlisted query set, transport, refusal; acceptance criteria for native read-only |
| 6-M10 | Major | Freshness base and refresh | FIX: measured from `arrived_at` on the wall clock; dependent decisions listed; refresh by the observing loop |
| 6-M11 | Major | Simulated broker port signatures differ | FIX: dispatch spec aligned |
| 6-N1…N8 | Nit | `analyze`/`analyzer`; `basis: none`; envelope mapping; cursors; corroborating evidence; links; README Q range; switching identity mode | FIX |

## Stages 7–8

Recorded below as they run.
