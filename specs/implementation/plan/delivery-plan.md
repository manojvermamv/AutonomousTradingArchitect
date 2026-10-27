# Delivery plan

* **Status:** proposed; revised after EGM stage 9 ([review](../egm/plan/review.md)).
* **Precedence:** the master phases (master `README.md:1176-1188`) and the ROADMAP delivery order (`ROADMAP.md:282`) win. This plan only orders work **inside** those phases and adds no gate. Production-sensitive steps stay in Phase 7 (D10, ATA-03).
* **Source of truth for slice contents:** each spec's Delivery table. This plan's proof and question columns are copied from them; where they disagree, the spec wins and this plan is corrected.
* **Depth rule:** only SLICE-01 has a full, zero-decision slice file. Every other slice lists its acceptance proofs here and gets its own file, with exact files, signatures and task IDs, when work on it starts. A slice with no task rows below is a stub slice: its spec deepens first (`README.md:1133`).

## Environment classes

| Class | Meaning |
|---|---|
| **S** synthetic | Uses fixtures, the simulated broker and temporary stores only |
| **R** recorded interface | Also reads permitted captured OpenAlgo responses; still no network or broker socket |
| **D** disarmed shadow | Phase 4: reads authorized production observations into a separate ledger, with no financial credential or broker socket |
| **P** production-sensitive | Phase 7: needs the owner's authorization at that step |

**Notation in the slice table.** "1/3" means the slice starts in master Phase 1 and finishes in Phase 3. "S → R" means early tasks run in class S and later tasks need class R. "PRF-SES-01…06" means every ID from PRF-SES-01 to PRF-SES-06. "Open items" lists the owner questions (Q-nnn) and master corrections (X-nnn) a slice applies, and the master's open policy records (POL-Onn, the `O`-status rows of the [policy inventory](../02-policy-inventory.md)). Every Q and X item was answered on 2026-10-27 ([owner answers](../decisions/owner-answers-2026-10-27.md)); the slice binds the answered value in config.

## Build order

SLICE-01 → 02 → 03 → 04 → 05 → 07 → 06, then 08 and 09 (in that order), 10 and 12 (in parallel with 08–09, against frozen contracts, `README.md:1185-1186`), 11, 13, 14. SLICE-06 follows SLICE-07 because protection needs fills and observations.

## Slices

| Slice | Phase | Class | Decisions and rules proved | Prerequisites | Open items | Completion evidence |
|---|---|---|---|---|---|---|
| [SLICE-01](slices/SLICE-01-disarmed-financial-core.md) disarmed financial core | 1 (+2 minimal) | S | D01, D02, D13, D14, AUD-02, Combined-F1 (types), ATA-06 (`simulated`); the SQLite safe-version rule; REQ-XC-002, REQ-XC-003 | none | none | REQ-DOM-002 (`simulated`); PRF-LED-01, PRF-LED-02, PRF-LED-03 (SLICE-01 part), PRF-LED-04, PRF-LED-05 (SLICE-01 part), PRF-LED-07, PRF-LED-12 (SLICE-01 rows), PRF-LED-13, PRF-DSP-02, PRF-DSP-12 (script part), PRF-ADM-05 (SLICE-01 part), PRF-SES-04 (types), PRF-XC-02 (SLICE-01 part), PRF-XC-03 (SLICE-01 part) |
| SLICE-02 ledger integrity, evidence store and independent reads | 1 | S | D04, A03-F4 reader side, Combined-F2 | SLICE-01 | X-007 | PRF-LED-08, PRF-LED-09, PRF-LED-10, PRF-LED-14, PRF-LED-15, PRF-DOM-05; PRF-LED-05 and PRF-LED-12 (evidence-store parts); reader-impact measurement recorded |
| SLICE-03 sessions, authority, clocks, recovery stages | 1 | S | ATA-05, Combined-F1, A04-F1/F2 (local), A06-F1 kernel side, Combined-F4 kernel side | SLICE-01, SLICE-02 (TASK-S02-01) | Q-001 (holds at session close only), Q-009 (routine path built and proved with a fake lease store; usable in production from SLICE-11), Q-010, Q-014, X-005 | PRF-SES-01…06, PRF-SES-08…10 |
| SLICE-04 intent to admission | 1/3 | S | D07, D12, AUD-01, AUD-03, POL-007, POL-015, POL-018, POL-020…POL-023, POL-027 | SLICE-01, SLICE-03; later inputs as the fixture ports in the [intent spec's Delivery](../design/intent-to-admission.md#delivery) | Q-003 (stamp field only), Q-008, Q-010, Q-011, Q-015 | PRF-ADM-01…06, PRF-ADM-08; PRF-LED-03 (stage B twin) |
| SLICE-05 dispatch, conflicts and scheduling | 1 | S | D13 revalidation, A03-F1/F2/F3, ATA-04; kill and hold events (POL-002, POL-003) | SLICE-04 | Q-001, Q-004, Q-011, Q-014 | PRF-DSP-01, PRF-DSP-03…08, PRF-DSP-10, PRF-DSP-11, PRF-LED-16, PRF-PRT-04 (kill and hold rows), PRF-PRT-11 |
| SLICE-07 observations, reconciliation, domain, OpenAlgo adapter | 1/3 | S → R | D15, D16, ATA-06, A06-F2 decision | SLICE-05 | Q-006, Q-007, Q-008, Q-012, Q-016 | PRF-DOM-01…04, PRF-DOM-08, PRF-DOM-09, PRF-DSP-09, PRF-ADM-09, PRF-LED-11, PRF-LED-12 (redelivered fill); PRF-DOM-07 and PRF-DOM-10 on authorization |
| SLICE-06 protection and safety | 1/3 | S | ATA-01, POL-004…POL-006, POL-010…POL-015, A03-F5 kernel side, Combined-F6 protection part | SLICE-05, SLICE-07 | Q-001, Q-002, Q-012, Q-013, Q-014, X-004 | PRF-PRT-01…10, PRF-PRT-12, PRF-PRT-13 |
| SLICE-08 market data and views | 5 | S | A01-F1…F5, D08 | SLICE-03, SLICE-04 | POL-O04 | Stub deepened; proofs from `README.md:1234-1236`; PRF-ADM-07 (planner parity with real views) |
| SLICE-09 strategies and cognition | 5 | S | A05-F1…F5, Combined-F5, D09, D12 evidence | SLICE-04, SLICE-08 | none | Stub deepened; proofs from `README.md:1243` |
| SLICE-10 security and operator | 2/5 | S | A06-F1…F5, Combined-F4 | SLICE-03 | Q-014 | Stub deepened; proofs from `README.md:1244` |
| SLICE-11 packaging, release, supervision, isolation, backup and restore | 2/7 (rehearsal only) | S → P (rehearsal on a real backup) | D05, D06, A02-F1…F4, A04-F3/F5, A03-F4/F5, A09-F1…F4, D10; the observation mediator only without native read-only proof (A06-F2) | SLICE-02, SLICE-03, SLICE-06, SLICE-07, SLICE-10 | Q-005 (real rehearsal only), POL-O01 | Stub deepened; D10 rehearsal evidence; PRF-PRT-14; PRF-XC-02 (production composition); measured refusing values recorded (TASK-S11-07); PRF-DOM-06 when the mediator is built |
| SLICE-12 research, RL, custody, promotion | 6 | S | A07-F1…F4, POL-038…POL-045 | SLICE-03 (binding) | none | Stub deepened; proofs from `README.md:1245`; PRF-DSP-12 (rule part) |
| SLICE-13 disarmed shadow, compatibility projections, conversion method | 4 | D | D02 ownership in shadow, A10-F3, AUD-05/A04-F4 comparison, A02-F5 | SLICE-07, SLICE-11 | X-002 | Same-head comparison (`README.md:1199`); conversion method recorded; PRF-LED-06 |
| SLICE-14 initial cutover | 7 | P | ATA-03, D10, A04-F2 cross-host, Combined-F6 | SLICE-01…SLICE-13 as the selected composition needs them (Q-005) | Q-005 | Owner-authorized cutover record; PRF-SES-07 |

## Task index

Task IDs are stable. SLICE-01 tasks are its file rows. Tasks of a stub slice are written into its slice file when that slice starts.

| Task | Slice | Work | Proof |
|---|---|---|---|
| TASK-S01-01 … TASK-S01-37 | 01 | Rows 1–37 of the SLICE-01 file | The SLICE-01 test tables |
| TASK-S02-01 | 02 | Index-table rebuild (`fold`) and D04 comparison at startup, recovery and detected change; repair | PRF-LED-08 |
| TASK-S02-02 | 02 | Bounded independent reader and reader-impact measurement (WAL growth, checkpoint progress) | PRF-LED-14; A03 runtime row (`README.md:1240`) |
| TASK-S02-03 | 02 | Evidence store (T-23), publication before reference, attempt lookup, export with outcome class | PRF-DOM-05, REQ-LED-014 |
| TASK-S02-04 | 02 | Disk-full, I/O-error and read-only-remount variants of commit-failure truthfulness | PRF-LED-07 (extension) |
| TASK-S02-05 | 02 | Ledger invariant state machine test | PRF-LED-09 |
| TASK-S02-06 | 02 | Schema check and migrations beyond `001`; anchored heads | PRF-LED-10, PRF-LED-15 |
| TASK-S03-01 | 03 | Grant model and checks at admission and dispatch; the kill exceptions and unlocks for the owner and delegated grant holders (Q-014); the `attempt_resolve` action (Q-007) | PRF-SES-01, PRF-SES-02 |
| TASK-S03-02 | 03 | Financial session transitions | PRF-SES-03 |
| TASK-S03-03 | 03 | Clock contract, deadlines and clock-quality events | PRF-SES-04 |
| TASK-S03-04 | 03 | Exclusive writer, epoch activation and recovery stages; the fence rule; the routine-restart advance (`recovery.routine_advance`, Q-009); the send lease against a fake store; the operator entry points | PRF-SES-05, PRF-SES-10 |
| TASK-S03-05 | 03 | Restored-authorization continuity | PRF-SES-06 |
| TASK-S03-06 | 03 | Standing bindings, the session's binding and candidate identity | PRF-SES-08, PRF-SES-09 |
| TASK-S04-01 | 04 | Review application (`kernel.policy`) | PRF-ADM-01, PRF-ADM-02 |
| TASK-S04-02 | 04 | Planning port with `one_leg_v1` and `structure_v1` extracted pure | PRF-ADM-03 |
| TASK-S04-03 | 04 | Characterize the legacy capacity and account-validation rule (`OA/src/core/framework/execution/reservations.py:352-442`, `_external_commitments` `:473-497` @445eb116) and the reservation amounts; report the legacy `max_worst_case_loss` as evidence (Q-015) | PRF-ADM-04 |
| TASK-S04-04 | 04 | Freshness checks (POL-018, POL-020, POL-021), the bar-close stamp (`market.view_age_stamp`, Q-003); minimal `contracts/market.py` field list from the legacy planner | PRF-ADM-04 |
| TASK-S04-05 | 04 | Full admission table and non-dispatch recording | PRF-ADM-04, PRF-ADM-06 |
| TASK-S04-06 | 04 | `SessionStats` derivation, field by field against legacy `OA/src/core/framework/runtime/orchestrator.py` @445eb116 | PRF-ADM-03 |
| TASK-S05-01 | 05 | Dispatch revalidation | PRF-DSP-01 |
| TASK-S05-02 | 05 | Bounded I/O per account | PRF-DSP-05, PRF-DSP-06 |
| TASK-S05-03 | 05 | Conflict relation in `kernel.safety` (exposure groups, `protective_independence`) | PRF-PRT-11 |
| TASK-S05-04 | 05 | Scheduler with the fixed ordering rule | PRF-DSP-07 |
| TASK-S05-05 | 05 | Cancel, modify and close verbs with completion rules | PRF-LED-16 |
| TASK-S05-06 | 05 | Busy count and acceptance-reply lookup | PRF-DSP-10 |
| TASK-S05-07 | 05 | Kill and hold events with their matrix rows; hold-versus-claim ordering; characterize whether a partly filled order counts as "unfilled" under kill (`OA/src/core/framework/execution/sender.py:281-296` @445eb116) | PRF-PRT-04 (kill and hold rows), PRF-DSP-08 |
| TASK-S05-08 | 05 | Deadline sweep and timer | PRF-DSP-04 |
| TASK-S05-09 | 05 | Caller-driven retries (the identity rule's retry branch), command status | PRF-DSP-03, PRF-DSP-11 |
| TASK-S07-01 | 07 | OpenAlgo adapter with retries disabled and transport classes | PRF-DOM-04 |
| TASK-S07-02 | 07 | Reconciliation `assess` and `findings`; foreign response `escalate` (Q-016); effective domain of target-bound verbs (Q-012); `attempt_resolve` resolutions if TASK-S07-05 finds no tag (Q-007) | PRF-DOM-02, PRF-DOM-03 |
| TASK-S07-03 | 07 | Fills, partial fills and obligation accounting (D16) | PRF-LED-11 |
| TASK-S07-04 | 07 | Domain attribution and the settlement rule (Q-006 for production) | PRF-DOM-01, PRF-DOM-08 |
| TASK-S07-05 | 07 | Capture and classify deployed analyze and live responses at the source (needs authorization) | PRF-DOM-07 |
| TASK-S07-06 | 07 | Native read-only credential proof (on authorization); without it, the mediator is built in SLICE-11 | PRF-DOM-10 |
| TASK-S07-07 | 07 | Target recheck at dispatch against real observations (revalidation row 6) | PRF-DSP-09 |
| TASK-S07-08 | 07 | Capacity against real funds and position observations | PRF-ADM-09 |
| TASK-S06-01 | 06 | Protection evaluation, legs, `basket_at_plan` placement with the quantity rule (Q-013), exits and structure legs; characterize re-placement and the marketable-stop alternative | PRF-PRT-01, PRF-PRT-02, PRF-PRT-09 |
| TASK-S06-02 | 06 | Protection crash recovery | PRF-PRT-03 |
| TASK-S06-03 | 06 | Hold rows per Q-001; characterize the legacy recovery-hold trigger | PRF-PRT-04 |
| TASK-S06-04 | 06 | Daily-loss latch with the bound budget (Q-002); characterize the deployed P&L fields against the endpoint contract | PRF-PRT-05 |
| TASK-S06-05 | 06 | Session-close exit and kill interaction | PRF-PRT-07 |
| TASK-S06-06 | 06 | Safety-check visibility; protection classification on read | PRF-PRT-05, PRF-PRT-13 |
| TASK-S06-07 | 06 | Release continuity of protected legs; evaluation-cost measurement | PRF-PRT-10, PRF-PRT-12 |
| TASK-S11-01 | 11 | Installable artifact, entrypoints outside the checkout, `requirements.lock` | `README.md:1221` |
| TASK-S11-02 | 11 | Settings resolver, immutability, bundle manifest | `README.md:1226-1227` |
| TASK-S11-03 | 11 | Supervisor and protection-status reporting | `README.md:1240`; PRF-PRT-14 |
| TASK-S11-04 | 11 | Resource envelopes and storage classes | `README.md:1247` |
| TASK-S11-05 | 11 | Recovery manifest, backup and clean-host restore rehearsal; the send-lease store adapter | `README.md:1232`; D10 |
| TASK-S11-06 | 11 | Observation mediator for non-kernel processes, only if TASK-S07-06 does not prove native read-only credentials | PRF-DOM-06 |
| TASK-S11-07 | 11 | Measure each measured refusing value in the [register](../design/cross-cutting-invariants.md#refusing-parameter-pattern-req-xc-003) on recorded sessions (A09-F4); record the measurement with the release binding for the owner's approval | Measurement records |
| TASK-S13-01 | 13 | Compare upgrade versus import with actual mappings; record the choice and reason; confirm or replace the provisional schema | REQ-MIG-005; X-002 |
| TASK-S13-02 | 13 | Disarmed shadow and same-head comparison | `README.md:1199` |
| TASK-S13-03 | 13 | Generated JSONL projection with versioned format and consumer list | REQ-MIG-003; PRF-LED-06 |
| TASK-S14-01 | 14 | Flat-scope check (ATA-03), exclusive handoff, old-route retirement marker | REQ-MIG-001, REQ-MIG-002 |

## First slice prepared for execution

[SLICE-01](slices/SLICE-01-disarmed-financial-core.md). It needs no answer from the owner. Its stage 9 result is in the [plan review](../egm/plan/review.md).
