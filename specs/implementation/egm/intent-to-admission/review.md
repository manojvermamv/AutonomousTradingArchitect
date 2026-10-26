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

## Stage 7 — style (0 Blocker, 8 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7S-M1 | Major | Refusal codes written five ways | FIX: `ADM-Rnn` (`name`) everywhere |
| 7S-M2 | Major | Review values written three ways | FIX: backticked enum values |
| 7S-M3 | Major | "Bound" means binding and numeric limit | FIX: "limit" for numbers |
| 7S-M4 | Major | AI mode and "eligibility" have several names | FIX: "AI mode"; "stage A passes" |
| 7S-M5 | Major | Terms line is one run-on sentence | FIX: table |
| 7S-M6 | Major | Pause cell unreadable | FIX: cell plus a bullet rule |
| 7S-M7 | Major | Two code names narrower than their use | FIX: `ADM-R05` (`stale_input`), `ADM-R07` (`effect_mismatch`) |
| 7S-M8 | Major | Break-check column inconsistent | FIX: "Must fail if" column |
| 7S-N1…N8 | Nit | Table names, failure header, stage B sentence, B1 cell, pronouns, overview structure, problem table, link labels | FIX |

## Stage 7 — structural (0 Blocker, 7 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7T-1 | Major | No Risks and limits | FIX |
| 7T-2 | Major | No Proof column; REQ-ADM-001/005/009/011 unproved | FIX: Proof column; PRF-ADM-08 (intent and plan contracts), PRF-ADM-04 extended (exposure), PRF-DSP-01 cited for -011 |
| 7T-3 | Major | CUJs name no proof; CUJ-ADM-3 unproved; CUJ-ADM-4 has no observable outcome | FIX |
| 7T-4 | Major | Proof table columns | FIX |
| 7T-5 | Major | Delivery not a table | FIX |
| 7T-6 | Major | Codes do not line up (A3 with `ADM-R10`; `ADM-R05` name; incomplete observation) | FIX: `ADM-R14` (`candidate_not_bound`) for A3; renamed codes; F-A5 gives `ADM-R05` |
| 7T-7 | Major | Failure table shape and proofs | FIX |
| 7T-8…15 | Nit | Header shape; `selection.py`; contract restatement; repeated pause cites; stage B repeats; bold labels; policy inputs; busy exception | FIX |

## Stage 7 — design (3 Blocker, 17 Major, 5 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-B1 | Blocker | The caller picks or omits the review | FIX: reviews are recorded by the kernel (`REVIEW_RECORDED`) and found by intent digest, first by kernel arrival; with a review required and none yet, admission returns `ADM-R15` (`review_pending`) until the blueprint deadline from the kernel's first sight of the intent |
| 7D-B2 | Blocker | Capacity against a pre-planning snapshot | FIX: B5 reads reservations and funds on the writer thread and binds the state heads in `COMMAND_ADMITTED` |
| 7D-B3 | Blocker | Planner signature misses legacy inputs | FIX: `SessionStats`, intent scores, Greeks and `now` are explicit inputs with named owners |
| 7D-M1 | Major | Pause race and timing | FIX: every stage A refusal commits on the writer thread with a pause re-read; `started_at` is the commit time; kernel arrival order |
| 7D-M2 | Major | No pause index; rule 3 fails open on the ledger | FIX: `pause` index table; rule 3 removed (an unreadable ledger is integrity failure, no send) |
| 7D-M3 | Major | Cleared-pause and unavailable consequences changed | FIX: cleared gives `proceed_unavailable` with alert, as legacy (`service.py:487-493`); cite corrected |
| 7D-M4 | Major | Review timing untrusted; missing validity checks; timeout origin | FIX: kernel clock; `valid_until`; configuration and lineage checks (legacy `service.py:390-429`); blueprint `deadline_seconds` |
| 7D-M5 | Major | Measured ages inside the plan digest | FIX: recorded in `COMMAND_ADMITTED` |
| 7D-M6 | Major | Two session sources | FIX: A1 refuses a mismatch |
| 7D-M7 | Major | Close check: position identity; aggregate | FIX: owned position from the ledger `position` table; a non-resting close needs resting closes cancelled (conflict row 5) |
| 7D-M8 | Major | Modify of a working entry bypasses capacity | FIX: B5 applies to a modify that raises committed capital |
| 7D-M9 | Major | Worst intermediate obligation not designed | FIX: the structure planner's phase and cover rules (legacy `structures/planner.py:33-76`) give the worst intermediate state |
| 7D-M10 | Major | Busy check decides Q-004; runs late | FIX: reads `coordinator.busy_applies_to`; cheap pre-check in stage A |
| 7D-M11 | Major | Alert lost on unrecorded refusals | FIX: `kernel.policy` raises the alert when it applies, not via the admission record |
| 7D-M12 | Major | Freshness vs POL-018, two owners for stale observations, spot/chain scope | FIX: "re-plans of a past day" quoted from the record; B1 is the only owner; live entries |
| 7D-M13 | Major | Pause after admission | FIX: stated as kept legacy behaviour (pause checked only at review time) |
| 7D-M14 | Major | Account snapshot and funds source | FIX: `ObservationPort.funds`; legacy double-count statement |
| 7D-M15 | Major | Product missing | FIX: `PlanLeg.product` (POL-017) |
| 7D-M16, M17 | Major | Risks; alternatives | FIX |
| 7D-N1…N5 | Nit | Non-entries skip stage A planning; deadline origin per verb; future snapshot; cleared basis; recorded grant | FIX |
