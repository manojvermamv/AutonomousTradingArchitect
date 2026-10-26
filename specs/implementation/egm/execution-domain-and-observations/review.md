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

## Stage 7 — design (3 Blocker, 15 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-B1 | Blocker | Absence over an empty, inverted or too-early window gives `RESOLVED_NEVER_REACHED` | FIX: `as_of` must be at least the outcome time plus a visibility bound (endpoint-contract item, measured refusing parameter); empty or inverted windows are not covered |
| 7D-B2 | Blocker | An unmarked attempt "proven" absent by another domain's book | FIX: `unknown + X → X` only on a positive identity match; absence needs the attempt's own known domain to equal the book's |
| 7D-B3 | Blocker | The domain gate blocked recording facts, so `forbid` left live positions unprotected | FIX: reach, fills and completion are recorded for any identity match, labelled; the gate applies only to releasing obligations and to performance claims; Q-006 consequences restated |
| 7D-M1 | Major | Basket leg roles; returned IDs without a role lost | FIX: attempt-level unassigned IDs recorded; role assigned only by the legacy validated join on our own returned IDs (`openalgo_adapter.py:25-28`, `:85-90`) |
| 7D-M2 | Major | Cancel/modify resolution wrong; modify level; replaced IDs; shared items | FIX: per-verb reached and never-reached evidence; modify proven only by a changed level (legacy `reconcile.py:756-757`); replacement IDs; per-command evaluation; liveness escalation |
| 7D-M3 | Major | Unresolved legs could not account for orders | FIX: unresolved legs count; per-leg absence |
| 7D-M4 | Major | Freshness base differs from legacy; `assess` impure | FIX: pre-read `as_of` with `abs(age)` (legacy `not_fresh`, `:693-711`); `now` passed in; admission B1 aligned |
| 7D-M5 | Major | Skew only at the window start | FIX: window end `as_of + skew` |
| 7D-M6 | Major | Ledger cannot supply attempt domain and claim time; double reduction; reconciliation built ledger decisions | FIX: attempt columns added; `RESERVATION_REDUCED` removed (reductions ride on the outcome or resolution); reconciliation returns findings, lifecycle decides |
| 7D-M7 | Major | POL-016 unrepresentable | FIX: optional `filled_quantity`; the close stays working and escalates |
| 7D-M8 | Major | Close completion by netted position bypasses identity | FIX: a close completes by its own order's fills; positions only corroborate |
| 7D-M9 | Major | Late order for a rejected or never-reached attempt; snapshot conflict; ordering | FIX: `CONFLICT_RECORDED` and escalation; `observed_order` index table holds the latest `as_of` per order; older observations ignored |
| 7D-M10 | Major | Different-domain books produce conflicts; circular order; event storms | FIX: identity first, then domain; only an identity-matched order in another domain conflicts; edge-triggered recording against index tables |
| 7D-M11 | Major | Q-008 interim answer built in | FIX: refusing parameter `capacity.count_non_live_obligations` |
| 7D-M12 | Major | `account_binding` cannot be verified | FIX: basis removed |
| 7D-M13 | Major | Mediator mis-targeted | FIX: the kernel observes directly; the mediator serves the supervisor, with caller authentication, supervision and kernel-down availability proofs |
| 7D-M14 | Major | Polling and evidence volume | FIX: refusing poll interval and request budget; supervisor never polls faster; only referenced observations are kept as evidence |
| 7D-M15 | Major | No Risks and limits | FIX |
| 7D-N1…N8 | Nit | Basis order; cites; anchor; 429 and bodiless 4xx; non-entry legs; ID domain; simulated interval; stale foreign | FIX |

## Stage 7 — style (0 Blocker, 8 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7S-1 | Major | "Settle" means resolve and release | FIX: "resolve" for commands, "release" for obligations |
| 7S-2 | Major | Four words for one condition; "unknown" names five things | FIX: "unresolved" defined once; assessment buckets qualified |
| 7S-3 | Major | "Order" used for operand order | FIX |
| 7S-4 | Major | Poll digest vs redelivery reads as a contradiction | FIX |
| 7S-5 | Major | Liveness escalation sentence | FIX |
| 7S-6 | Major | F-O7 unbuildable | FIX |
| 7S-7 | Major | Identifier formatting | FIX |
| 7S-8 | Major | Refusal code format | FIX |
| 7S-N | Nit | Header lists; problem bullet; "place"; ownership words; passive voice; pronouns; long cells; filler | FIX |

## Stage 7 — structural (0 Blocker, 7 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7T-1 | Major | The OpenAlgo adapter has no section of its own; dispatch links point at the evidence contract | FIX: "OpenAlgo adapter (`adapters/openalgo.py`)" section; dispatch links repointed |
| 7T-2 | Major | `Finding` type undefined | FIX: defined beside `findings()` |
| 7T-3 | Major | `Observation.items` omits `ObservedFunds` | FIX |
| 7T-4 | Major | CUJ-DOM-3 asserts ledger effects PRF-DOM-04 cannot see | FIX: CUJ limited to adapter output; ledger effects cite PRF-LED-11 |
| 7T-5 | Major | PRF-DOM-05 has no must-fail | FIX |
| 7T-6 | Major | No proof for the native-credential branch or the liveness rule | FIX: PRF-DOM-10 (manual, on authorization); liveness is a rules-table row proved in PRF-DOM-02 |
| 7T-7 | Major | Delivery table misaligned with the plan | FIX: SLICE-01 via PRF-DSP-12; SLICE-02 PRF-DOM-05; SLICE-07 incl. native proof; SLICE-10 mediator only; TASK-S07-02/06 updated |
| 7T-N | Nit | Header Commits through and Terms; refusal-code table; POL rows; Goal-4 key (REQ-DOM-015); failure rows F-O9…F-O11; zero-price and F-O6 proof coverage | FIX |
