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

## Stage 8 — intermediate zoom-out (3 Blocker, 10 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 8-B1 | Blocker | A caller's `review_ref` can turn a BLOCK into proceed | FIX: `review_ref` removed from `EntryRequest` (intent, ledger, SLICE-01); the kernel finds the review by digest only |
| 8-B2 | Blocker | Host timing decides application: BLOCK can expire into proceed; PAUSE starts only if the intent returns | FIX: the first review is judged at arrival and applied once in the `REVIEW_RECORDED` transaction, which also commits `PAUSE_STARTED`; the application is frozen in the `review` row (legacy `service.py:418-423`, `:465-479`); A5 pause re-read removed |
| 8-B3 | Blocker | `SessionStats` cannot feed `session_gates`; structure path loses the gates; no producer | FIX: the full legacy `Session` field set; `structure_v1` runs the one-leg preflight; POL-023 owned through the planner; `kernel.policy` derives the stats, characterized in TASK-S04-06; an underivable field sets `unavailable`, which the gate refuses on as legacy |
| 8-M1 | Major | First sight not durable; intent body source; retries unbounded | FIX: `INTENT_SEEN` committed on first sight; header lists it and `PAUSE_CLEARED`; intent published as evidence and resolved by `intent_ref`; retries stop at the deadline |
| 8-M2 | Major | Ledger rule and Outcome table omit `ADM-R15` | FIX: ledger rule and Outcome row ("resend until the deadline"); this spec links to the rule |
| 8-M3 | Major | Invented `planner_version` selector | FIX: selection by `structure_id` (legacy `planner.py:114`); `structure_id`, `market_bias` on `Intent`; `planner_version` kept only as recorded evidence; refusing parameter dropped |
| 8-M4 | Major | Planner duplicates the slot and daily-loss rules | FIX: kept unchanged for parity (no gate changed); precedence stated: an earlier planner refusal is `ADM-R13`, B3 and A4 stay authoritative |
| 8-M5 | Major | Two-calendar check has two owners | FIX: B6 (`ADM-R10`) is the one owner; sessions wording aligned ("the request names the session, the kernel confirms it") |
| 8-M6 | Major | B2 restates conflict row 3 | FIX: removed; B3 alone |
| 8-M7 | Major | Planner inputs have no contract | FIX: minimal `StableView`, `ChainSnapshot`, `ReferenceFacts` defined in the market-data spec (its module); field list fixed by TASK-S04-04; poll interval is POL-020's bound value |
| 8-M8 | Major | Coverage `unknown` unhandled | FIX: accepted for snapshots and positive evidence; admission never concludes from absence |
| 8-M9 | Major | External margin has no input | FIX: optional broker-reported `amount`/`margin` fields and aggregate margins on the observation contract; characterized in TASK-S04-03/S07-05; a missing field refuses, never counts as zero |
| 8-M10 | Major | Delivery cannot be built as written | FIX: SLICE-04 uses named fixture ports; PRF-ADM-09 in SLICE-07, PRF-ADM-07 in SLICE-08 |
| 8-N1…N8 | Nit | A1a repeat; future-date check in B5; REQ-ADM-011 wording; position keying; `Plan.account`; `ADM-R09` reasons; Q-010 reference; inactive pause | FIX |

Cross-spec: `application.policy_version` renamed `policy_binding_id` (sessions 8-15), including SLICE-01.
