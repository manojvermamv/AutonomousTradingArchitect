# Delivery plan

* **Status:** proposed.
* **Precedence:** the master phases (`README.md:1176-1188`) and ROADMAP delivery order (`ROADMAP.md:282`) win. This plan only orders work **inside** those phases and adds no gate. Production-sensitive steps stay attached to Phase 7 (D10, ATA-03).
* **Depth rule:** only SLICE-01 has a full, zero-decision slice file. Every other slice lists its task IDs and acceptance proofs here, and gets its own file with exact files and signatures when it starts. This avoids writing ahead of working slices (`README.md:1133`).

## Environment classes

| Class | Meaning |
|---|---|
| **S** synthetic | Fixtures, simulated broker and temporary stores only |
| **R** recorded interface | Adds permitted captured OpenAlgo responses; still no network or broker |
| **D** disarmed shadow | Phase 4: reads authorized production observations into a separate ledger, with no financial credential or socket |
| **P** production-sensitive | Phase 7: needs owner authorization at that step |

## Slices

| Slice | Phase | Class | Decisions proved | Prerequisites | Open questions touched | Completion evidence |
|---|---|---|---|---|---|---|
| [SLICE-01](slices/SLICE-01-disarmed-financial-core.md) disarmed financial core | 3 (+2 minimal) | S | D01, D02, D13, D14, AUD-02; the SQLite safe-version rule | none | none | Its test table passes |
| SLICE-02 ledger integrity and independent reads | 1 | S | D04, A03-F4 reader side, Combined-F2 | SLICE-01 | none | PRF-LED-08, -09, -10, -14, -15; reader-impact measurement recorded |
| SLICE-03 sessions, authority, clocks, recovery stages | 1 | S | ATA-05, Combined-F1, A04-F1/F2 (local), A06-F1 kernel side, Combined-F4 kernel side | SLICE-01, SLICE-02 (D04 step) | Q-001 (session-close effects for holds only), Q-009 (operating procedure only), Q-010 | PRF-SES-01…06, PRF-SES-08…10 |
| SLICE-04 intent to admission | 3 | S | D07, D12, AUD-01, AUD-03, POL-007/015/018/020/021/022/027 | SLICE-01, SLICE-03 | Q-003 (stamp field only), Q-008 (capacity domains) | PRF-ADM-01…06 |
| SLICE-05 dispatch, conflicts and scheduling | 1 | S | D13 revalidation, A03-F1/F2/F3, ATA-04; kill and hold events (POL-002, POL-003) | SLICE-04 | Q-004, Q-001, Q-011 | PRF-DSP-01, -03…-11, PRF-LED-16, PRF-PRT-04 (kill and hold rows), PRF-PRT-11 |
| SLICE-06 protection and safety | 1/3 | S | ATA-01, POL-004…POL-006, POL-010…POL-015, A03-F5 kernel side, Combined-F6 protection part | SLICE-05, SLICE-07 | Q-001, Q-002, X-004 | PRF-PRT-01…10, PRF-PRT-12 |
| SLICE-07 observations, reconciliation, domain, OpenAlgo adapter | 1/3 | S → R | D15, D16, ATA-06, A06-F2 decision | SLICE-05 | Q-006, Q-007, Q-008 | PRF-DOM-01…05, -08, -09, PRF-LED-11; PRF-DOM-07 on authorization |
| SLICE-08 market data and views | 5 | S | A01-F1…F5, D08 | SLICE-03 | POL-O04 | Stub deepened; proofs from `README.md:1234-1236` |
| SLICE-09 strategies and cognition | 5 | S | A05-F1…F5, Combined-F5, D09, D12 evidence | SLICE-04, SLICE-08 | none | Stub deepened; proofs from `README.md:1243` |
| SLICE-10 security and operator | 2/5 | S | A06-F1…F5, Combined-F4; the observation mediator (A06-F2) | SLICE-03 | none | Stub deepened; proofs from `README.md:1244`; PRF-DOM-06 |
| SLICE-11 packaging, release, supervision, isolation, backup and restore | 2/7 (rehearsal only) | S → P (rehearsal on a real backup) | D05, D06, A02-F1…F4, A04-F3/F5, A03-F4/F5, A09-F1…F4, D10 | SLICE-02, SLICE-03, SLICE-07 | Q-005 (real rehearsal only), POL-O01 | Stub deepened; D10 rehearsal evidence |
| SLICE-12 research, RL, custody, promotion | 6 | S | A07-F1…F4, POL-038…POL-045 | SLICE-03 (binding) | none | Stub deepened; proofs from `README.md:1245` |
| SLICE-13 disarmed shadow, compatibility projections, conversion method | 4 | D | D02 ownership in shadow, A10-F3, AUD-05/A04-F4 comparison, A02-F5 | SLICE-07, SLICE-11 | X-002 | Same-head comparison (`README.md:1199`); conversion method recorded |
| SLICE-14 initial cutover | 7 | P | ATA-03, D10, A04-F2 cross-host, Combined-F6 | all required slices for the selected composition | Q-005 | Owner-authorized cutover record |

Lanes that may run in parallel once their prerequisites are done: SLICE-08/09, SLICE-10 and SLICE-12, each against frozen contracts (`README.md:1185-1186`).

## Task index

Task IDs are stable. SLICE-01 tasks are its file rows. Other tasks get exact files when their slice file is written.

| Task | Slice | Work | Proof |
|---|---|---|---|
| TASK-S01-01 … TASK-S01-33 | 01 | Rows 1–33 of the SLICE-01 file | SLICE-01 test table |
| TASK-S02-01 | 02 | Projection rebuild and compare at startup, recovery and detected change | PRF-LED-08 |
| TASK-S02-02 | 02 | Bounded independent reader and reader-impact measurement (WAL growth, checkpoint progress) | A03 runtime/outage proof row (`README.md:1240`) |
| TASK-S02-03 | 02 | Evidence publication and reference commit; export with outcome class | PRF-DOM-05, REQ-LED-014 |
| TASK-S02-04 | 02 | Disk-full and commit-failure truthfulness | PRF-LED-07 |
| TASK-S02-05 | 02 | Ledger invariant state machine test | PRF-LED-09 |
| TASK-S03-01 | 03 | Grant model and checks at admission and dispatch | PRF-SES-01/02 |
| TASK-S03-02 | 03 | Financial session transitions and session-close effects | PRF-SES-03 |
| TASK-S03-03 | 03 | Clock contract, deadlines and clock-quality events | PRF-SES-04 |
| TASK-S03-04 | 03 | Exclusive writer, epoch activation and recovery stages | PRF-SES-05 |
| TASK-S03-05 | 03 | Restored-authorization continuity | PRF-SES-06 |
| TASK-S04-01 | 04 | Review application (`kernel.policy`) | PRF-ADM-01/02 |
| TASK-S04-02 | 04 | Planning port with `one_leg_v1` and `structure_v1` extracted pure | PRF-ADM-03 |
| TASK-S04-03 | 04 | Characterize the legacy reservation-amount rule (`reservations.py:377`) and bind it as the policy rule | PRF-ADM-04 |
| TASK-S04-04 | 04 | Freshness checks (POL-018/020/021), stamp field per Q-003 | PRF-ADM-04 |
| TASK-S04-05 | 04 | Full admission table and non-dispatch recording | PRF-ADM-04, PRF-ADM-06 |
| TASK-S05-01 | 05 | Dispatch revalidation | PRF-DSP-01 |
| TASK-S05-02 | 05 | Bounded I/O per account | PRF-DSP-05/06 |
| TASK-S05-03 | 05 | Conflict relation in `kernel.safety` (exposure groups, the `protective_independence` parameter) | PRF-PRT-11 |
| TASK-S05-04 | 05 | Scheduler with the bound ordering rule | PRF-DSP-07 |
| TASK-S05-05 | 05 | Cancel, modify and close verbs with completion rules | PRF-LED-* verb rows |
| TASK-S05-06 | 05 | Busy count and acceptance-reply lookup | PRF-DSP-10 |
| TASK-S05-07 | 05 | Kill and hold events with their matrix rows; hold-versus-claim ordering | PRF-PRT-04 (kill and hold rows), PRF-DSP-08 |
| TASK-S05-08 | 05 | Deadline sweep and timer | PRF-DSP-04 |
| TASK-S05-09 | 05 | Target recheck at dispatch, caller-driven retries, command status | PRF-DSP-09, -10, -11 |
| TASK-S06-01 | 06 | Protection evaluation, legs, placement and structure legs; characterize the legacy stop order type and re-placement behaviour | PRF-PRT-01/02/09 |
| TASK-S06-02 | 06 | Protection crash recovery | PRF-PRT-03 |
| TASK-S06-03 | 06 | Hold rows per Q-001; characterize the legacy recovery-hold trigger | PRF-PRT-04 |
| TASK-S06-04 | 06 | Daily-loss latch with bound budget (Q-002) | PRF-PRT-04 |
| TASK-S06-05 | 06 | Session-close exit and kill interaction | PRF-PRT-07 |
| TASK-S06-06 | 06 | Safety-check visibility; protection classification on read | PRF-PRT-05, PRF-PRT-13 |
| TASK-S06-07 | 06 | Release continuity of protected legs; evaluation-cost measurement | PRF-PRT-10, PRF-PRT-12 |
| TASK-S07-01 | 07 | OpenAlgo adapter with retries disabled and transport classes | PRF-DOM-04 |
| TASK-S07-02 | 07 | Reconciliation `assess` and `findings` | PRF-DOM-02/03 |
| TASK-S07-03 | 07 | Fills, partial fills and obligation accounting (D16) | PRF-LED-09 |
| TASK-S07-04 | 07 | Domain attribution and settlement rule (Q-006 for production) | PRF-DOM-01, PRF-DOM-08 |
| TASK-S07-05 | 07 | Capture and classify deployed analyze and live responses at the source (needs authorization) | PRF-DOM-07 |
| TASK-S07-06 | 07 | Native read-only credential proof (on authorization); the mediator itself is built in SLICE-10 | PRF-DOM-10 |
| TASK-S10-01 | 10 | Observation mediator for non-kernel processes (authenticated socket, three queries) | PRF-DOM-06 |
| TASK-S11-01 | 11 | Installable artifact and entrypoints outside the checkout | `README.md:1221` |
| TASK-S11-02 | 11 | Settings resolver, immutability, bundle manifest | `README.md:1226-1227` |
| TASK-S11-03 | 11 | Supervisor and protection-status reporting | `README.md:1240`; PRF-PRT-14 |
| TASK-S11-04 | 11 | Resource envelopes and storage classes | `README.md:1247` |
| TASK-S11-05 | 11 | Recovery manifest, backup and clean-host restore rehearsal | `README.md:1232`; D10 |
| TASK-S13-01 | 13 | Compare upgrade versus import with actual mappings; record the choice and reason; confirm or replace the provisional schema | REQ-MIG-005; X-002 |
| TASK-S13-02 | 13 | Disarmed shadow and same-head comparison | `README.md:1199` |
| TASK-S13-03 | 13 | Generated JSONL projection with versioned format and consumer list | REQ-MIG-003 |
| TASK-S14-01 | 14 | Naturally flat scope check, exclusive handoff, old-route retirement marker | REQ-MIG-001/002 |

## First slice prepared for execution

[SLICE-01](slices/SLICE-01-disarmed-financial-core.md). It needs no answer from the owner, so it can start as soon as it passes EGM stage 9.
