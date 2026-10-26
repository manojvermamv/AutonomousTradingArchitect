# EGM review — intent-to-admission

Process record (not normative). Target: [design/intent-to-admission.md](../../design/intent-to-admission.md). Resolution codes: **FIX**, **CONTEST**, **Q/X**.

## Stage 5 — initial zoom-out (1 Blocker, 4 Major, 2 Nit)

| Finding | Resolution |
|---|---|
| Blocker: session `OPEN` required for every verb | FIX: entries only |
| PAUSE had two owners (policy and safety matrix) | FIX: `kernel.policy` only; recorded pause state is an explicit input; no extension; human clear; protection matrix row and `PRT-R05` removed |
| Slot check duplicated the conflict relation | FIX: check 7 / `ADM-R08` deleted |
| One admission table mixed eligibility and serialized checks | FIX: stage A (eligibility, before planning) and stage B (serialized, after planning); first failure per stage |
| Request carried the review application | FIX: request carries the intent and an optional review reference; `kernel.policy` produces the application in-process |
| Abstain row | FIX: abstain gives `proceed_unavailable` with alert (`README.md:120`) |
| Planner took the application | FIX: removed from the signature |

## Stage 6 — comprehension (3 Blocker, 17 Major, 4 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-1 | Blocker | Who writes pause state, when; race between two PAUSE reviews | FIX: `kernel.policy` returns a pause decision; admission commits `PAUSE_STARTED` in the same transaction as the paused entry's refusal; the write rechecks inside the transaction; pause starts only when an entry is evaluated |
| 6-2 | Blocker | Pause scope needs an instrument the intent lacks | FIX: `Intent.underlying` (from the view); scope is (strategy, underlying, session), matching legacy `management.instrument` |
| 6-3 | Blocker | Plan contract missing | FIX: `Plan` and `PlanLeg` in `contracts/decisions.py`; input types named with owners; `planner_version` values; legacy algorithm cites |
| 6-4 | Major | Application lacks strategy/candidate/session; union notation; deadline | FIX: fields added; `basis` field; cause list; deadline is the entry's dispatch deadline |
| 6-5 | Major | Absent review; late-review rule; precedence; pause outside enforce | FIX: rows added; `review.timeout` refusing parameter; precedence stated |
| 6-6 | Major | "recorded" and "alert" undefined | FIX: application carries `review_outcome` and `alert` |
| 6-7 | Major | Two event names for not eligible | FIX: `ADMISSION_REFUSED` only |
| 6-8 | Major | What is recorded | FIX: every refusal of every verb is recorded except `LED-R01`, `LED-R02`, `ADM-R12` |
| 6-9 | Major | Planner refusal code | FIX: `ADM-R13 plan_refused` with stage and reason lists |
| 6-10 | Major | Freshness B1 underspecified | FIX: per-verb inputs; poll interval source; replay flag from the composition; a CP-A1 retry is judged |
| 6-11 | Major | B2 modify/close details | FIX: `ModifyChanges` schema; derived close side; "owned" defined; no new protective-cancel rule (would be a policy) |
| 6-12 | Major | B6 mechanism | FIX: digest and field comparisons listed |
| 6-13 | Major | Gap between stage A and stage B | FIX: stage B repeats the stage A state checks under serialization |
| 6-14 | Major | Idempotency position | FIX: identity lookup right after A1; refusals not sticky |
| 6-15 | Major | Reservation and capacity open | FIX: linked to TASK-S04-03 and the legacy capacity check (`reservations.py:352-400`) as the characterized rule |
| 6-16 | Major | Pause timing and clearing | FIX: expiry exclusive (legacy `pause.py:88`); session-end source; clear semantics; `reason` field |
| 6-17 | Major | Replay and pause events | FIX: replay derives its own pause events in its own ledger |
| 6-18 | Major | Abstaining intent | FIX: no entry request; recorded by the host as evidence; admission refuses one with `ADM-R01` |
| 6-19 | Major | SLICE-01 reads `request.application` | FIX: SLICE-01 rewritten (application and plan are separate in-process arguments) |
| 6-20 | Nit | A2 signature and code range | FIX |
| 6-21 | Nit | A4 code range | FIX |
| 6-22 | Nit | Undefined terms; slot scope | FIX: links and a slot-scope definition |
| 6-23 | Nit | ADM code gaps | FIX: note on unused codes |

## Stages 7–8

Recorded below as they run.
