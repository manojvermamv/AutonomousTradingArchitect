# EGM review — protection-and-safety

Process record (not normative). Target: [design/protection-and-safety.md](../../design/protection-and-safety.md). Reviewers ran with fresh context and direct dispatch ([egm/README](../README.md)). Resolution follows `egm_resolve`: **FIX** (applied), **CONTEST** (kept, with evidence), **Q/X** (raised to the owner or the master's owner).

## Pre-review change

Before stage 5, the AI PAUSE row and `PRT-R05` were removed: `kernel.policy` owns PAUSE (intent-to-admission stage 5, finding 2).

## Stage 5 — initial zoom-out (0 Blocker, 13 Major, 12 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 5-1 | Major | Protection states duplicate the command lifecycle and reconciliation's confirmed level | FIX: protection persists only desired level, ladder state, policy/view identity and the linked command key; attempt and confirmation are read from the ledger and reconciliation |
| 5-2 | Major | One-attempt-per-leg enforced three times; `PRT-R08` never raised | FIX: `PRT-R08` dropped; the conflict relation enforces it. CONTEST in part: `evaluate` still emits no request while the linked command is unresolved, to avoid a refusal on every bar; this is evaluation logic, not a second gate |
| 5-3 | Major | State machine gaps: no ratchet from `CONFIRMED`, no terminal state, no resend trigger, `desired_pending` not persisted | FIX: derived states with `ENDED`; resend on the next evaluation after the linked command resolves; desired level persisted |
| 5-4 | Major | No accepted action variant places the first protective order; `NONE → DESIRED` fires on ACK | FIX: a protective order is a resting **close** (stop or limit) of the filled position (AUD-01 close variant); desired starts on fill evidence |
| 5-5 | Major | Broker-held stop and kernel tick exit on one leg, no ownership rule | FIX: `exit_owner` per ladder version (characterized in TASK-S06-01); a kernel close first cancels and confirms resting protection terminal (POL-010 sequence) |
| 5-6 | Major | Conflict relation separates a position from its protective orders | FIX: exposure group (position plus its resting protective orders) is one conflict target (ATA-04 shared exposure) |
| 5-7 | Major | Ladder defaults turned into a refusing parameter, against POL-012 | FIX: approved shipped values are the default |
| 5-8 | Major | Kill and holds have no lifecycle; operator vs recovery hold unclear; slice split | FIX: kill and hold events, actors and grant actions; one hold condition with a recorded reason; kill and hold events built in SLICE-05 |
| 5-9 | Major | Latch reads a P&L nobody supplies | FIX: session P&L supplied by `kernel.reservations` (D16 owner) with the legacy basis cited; trip event named |
| 5-10 | Major | REQ-PRT-008 claims the whole precedence table | FIX: narrowed to the matrix and the conflict part; other rows point to their owners |
| 5-11 | Major | Missing proofs: late observations, replay, evaluation cost, ATA-04 matrix | FIX: PRF-PRT-09 … PRF-PRT-11 |
| 5-12 | Major | Combined-F6 has no design or proof | FIX: protected legs keep their ladder and policy versions across binding changes; PRF-PRT-12 |
| 5-13 | Major | SLICE-06 needs SLICE-07 evidence | FIX: SLICE-06 depends on SLICE-07; PRF-PRT-08 listed |
| 5-14 | Nit | `PRT-R01`/`R02` overlap | FIX: one kill code, actor recorded |
| 5-15 | Nit | `PRT-R09` unreachable | FIX: dropped (refusing parameter refuses at load) |
| 5-16 | Nit | `inert` is a legacy leftover | CONTEST: kept; a check's input (for example session P&L) can be unavailable inside the kernel; F-P5 reworded |
| 5-17 | Nit | Tick rounding owned twice | FIX: protection calls the planner's rounding function |
| 5-18 | Nit | 60 s reused for classification | FIX: marked as derived from POL-021, reporting only |
| 5-19 | Nit | "misspelt" dropped from POL-010; conflicts with A02-F2 | X-004 raised; omitted close time uses the approved 15:13 |
| 5-20 | Nit | Kill cancel cell broader than POL-002 | FIX: "owned unfilled order" |
| 5-21 | Nit | "allowed" reads as blanket permission | FIX: "not restricted by this condition" |
| 5-22 | Nit | Owner actions under a hold marked pending | FIX: owner cancel/close not restricted (legacy `sender.py:293-296`); Q-001 covers automatic only |
| 5-23 | Nit | "proposes"; F-P3 specifies supervisor behaviour | FIX: "observes and escalates"; F-P3 points to the runtime spec |
| 5-24 | Nit | Two wrong master cites | FIX: `:1187` → POL-002 / Combined-F6; `:1148` → `:460` |
| 5-25 | Nit | Inventory names `kernel.admission` as POL-007 owner | FIX: inventory row updated |

## Stage 6 — comprehension (2 Blocker, 21 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-1 | Blocker | A resting protective close never completes, so a leg never reaches `CONFIRMED` | FIX: a resting close completes when its order is observed resting at the requested parameters (ledger completion rule changed); later fills are order events |
| 6-2 | Blocker | "Unresolved effect" undefined; a resting order could deadlock row 2 | FIX: defined (commands `IN_FLIGHT`, `UNCERTAIN`, or `WORKING` before completion); a placed resting order is a group member, not an unresolved effect; a request never conflicts with itself |
| 6-3 | Major | `RESOLVED_NEVER_REACHED` and refusals mapped to leg states wrongly | FIX: never-reached stays `PENDING` (coordinator re-dispatches); refusals and final states return to `DESIRED` |
| 6-4 | Major | Leg states overlap; `ENDED` cases missing | FIX: precedence order; broker-level completion resets desire; `ENDED` with reason; re-placement rule |
| 6-5 | Major | Command key `n`, `leg_id` | FIX: derived deterministically from the ledger |
| 6-6 | Major | Initial levels, quantities, order types, roles | FIX: from `Plan.protective_levels`; placed when the entry completes with its filled quantity; order types from the protection policy; roles `stop`, `target` |
| 6-7 | Major | Partial pairing; pairing and placement under kill | FIX: partial fill modifies the other close down; under kill automatic placement and pairing are refused and escalated for the owner (POL-002 consequence stated) |
| 6-8 | Major | Types and the caller of `evaluate` undefined | FIX: types defined; evaluation loop on the writer thread; record-then-request order |
| 6-9 | Major | Ladder algorithm delegated to legacy | CONTEST in part: the retained ladder is reused code proved by parity (PRF-PRT-08); `TrailSettings` and `TrailPosition` cited by line; exact fields in the SLICE-06 file |
| 6-10 | Major | `exit_owner` deferred | CONTEST in part: legacy has both a tick exit and a broker stop; which owns the exit is a characterization (TASK-S06-01), and the double-sell guard holds either way |
| 6-11 | Major | Square-off sequence state, order type, timing | FIX: `SQUARE_OFF_STARTED`; once per position per session; market close; continues after session close; `broker` value means no project action |
| 6-12 | Major | Gap source and ladder state | FIX: gap flag from the stable view; ladder state unchanged on a gap bar |
| 6-13 | Major | Event payloads and guards; `protection_state` fold inputs | FIX: event table with guards; fold inputs listed; desire recorded only on change |
| 6-14 | Major | `kernel:recovery` hold grant; overlapping holds | FIX: built-in grant added in the sessions spec; a strategy is held while any reason is engaged |
| 6-15 | Major | Hold parameter name and values | FIX: `safety.hold_automatic_actions` (`allowed`, `refused`), refusing |
| 6-16 | Major | Strategy attribution of non-entry commands and positions | FIX: every command records a strategy; positions inherit the entry's |
| 6-17 | Major | Session P&L contract missing; trigger, fields, re-trip | FIX: `session_pnl` defined (later moved to `kernel.safety` by ledger stage 8); evaluated on each position observation; legacy re-trip after unlock kept (`loss_latch.py:576-583`) |
| 6-18 | Major | Percent-only budget vs Q-002 | FIX: amount required; percent optional |
| 6-19 | Major | Combining matrix rows; code order | FIX: order damaged, inert, kill, hold, latch |
| 6-20 | Major | Inert/damaged per check | FIX: per-check table |
| 6-21 | Major | No-row result; relation version; parameter values | FIX |
| 6-22 | Major | CUJ-PRT-3 sequencing | FIX: the owner cancels first; an early owner close is refused at B3 |
| 6-23 | Major | Classification overlaps | FIX: per-leg rules in order |
| 6-24…31 | Nit | Mapping, delivery split, boundary, B1 note, desk, wording, link, `broker` value | FIX |

## Stage 7 — design (3 Blocker, 14 Major, 10 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-1 | Blocker | A modify or cancel whose target ends never completes and freezes the group | FIX: completes with reason `target_terminal` (ledger verb table) |
| 7D-2 | Blocker | No position identity or index | FIX: `position` index table in the ledger, maintained by fills |
| 7D-3 | Blocker | Stop and target both rest at full quantity; double sale | FIX: only the stop rests at the broker; target and deep-OTM delta are kernel tick exits, as legacy (`trail.py:370-392`) |
| 7D-4 | Major | Retry after `NOT_SENT` / never reached | FIX: protection records `DISPATCH_RETRY_REQUESTED` |
| 7D-5 | Major | Busy refusal recorded or not | FIX: not recorded; dispatch spec aligned |
| 7D-6 | Major | Clock-dependent classification stored by `fold` | FIX: computed on read |
| 7D-7 | Major | Quantity not in the desire | FIX: desired quantity persisted; mismatch reads `DESIRED` |
| 7D-8 | Major | POL-014 rewrite drops a newer ratchet | FIX: desire becomes the tighter of the two |
| 7D-9 | Major | Unbounded re-placement; stop already crossed | FIX: no automatic re-placement after a broker reject or expiry; escalated; a level already through the market is escalated, not sent |
| 7D-10 | Major | Owner cannot exit without kill; orphaned orders | FIX: an owner cancel of a stop stops re-placement; orphaned stops are cancelled (escalated under kill) |
| 7D-11 | Major | Kill cell ambiguous for resting closes | FIX: under kill only non-resting owner closes; placing a new resting close is refused |
| 7D-12 | Major | One `exit_owner` per ladder does not fit three exit reasons | FIX: per reason: stop at the broker; target and delta by tick; latency in Risks; marketable-stop alternative for TASK-S06-01 |
| 7D-13 | Major | Conflict rows overlap; row 2 too coarse; version ownership | FIX: row 3 is a note; row 2 narrowed to actions that can add sale or remove the last stop; version computed in code |
| 7D-14 | Major | P&L attribution and fields | FIX: legacy single P&L field or realised plus mark-to-market, characterized against the endpoint; limits in Risks |
| 7D-15 | Major | Tick evaluation unbounded on the writer thread | FIX: latest tick per position; exit test off the writer thread; PRF-PRT-10 measures queue delay |
| 7D-16 | Major | Unprotected partial-fill window | FIX: placed on the first fill; quantity raised on later fills (admission B2 allows a protective close up to the owned position) |
| 7D-17 | Major | `damaged` unreachable | FIX: dropped with `PRT-R07`; `LED-R05` covers it; `safety_state` index table |
| 7D-18…27 | Nit | Gap peak once per gap; no requests under kill; guarding checks only; conflict-inert duplicate; continuity policy version; square-off kill escalation; synchronous admission; SLICE-05 stub; X-004 wording; record fix | FIX |

## Stage 7 — style (0 Blocker, 7 Major, 7 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7S-1 | Major | Refusal code format; shortened unused codes | FIX |
| 7S-2 | Major | Unused codes paired by position | FIX: table |
| 7S-3 | Major | "Owner" means the decision-maker and any human principal | FIX: "human principal" for runtime actors |
| 7S-4 | Major | Exposure group defined differently in the glossary | FIX: one definition in both |
| 7S-5 | Major | Run-on lists in the header and Goal 3 | FIX |
| 7S-6 | Major | Gap-peak sentence ambiguous | FIX: one record per gap; the would-be stop only when the recovered peak exceeds the live peak, otherwise none |
| 7S-7 | Major | "Escalate" undefined and passive | FIX: defined once; active voice |
| 7S-N | Nit | "holds" as a verb; pronoun; check names; actor names; ID ranges; long P&L sentence; slot jargon | FIX |

## Stage 7 — structural (0 Blocker, 10 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7T-1 | Major | Structure lifecycle promised, never specified | FIX: Structures section maps every legacy `structures.py` action; REQ-PRT-015; one ledger `position` per entry leg |
| 7T-2 | Major | CUJ-PRT-3 cites conflict row 5 | FIX: row 3 |
| 7T-3 | Major | REQ-PRT-011 proved by an unrelated proof; not delivered | FIX: PRF-PRT-14 (supervisor cannot send), SLICE-11 with REQ-OPS-001 |
| 7T-4 | Major | Classification and REQ-PRT-002 have nominal proofs | FIX: PRF-PRT-13 (classification on read, 60 s boundary, never stored); REQ-PRT-002 → PRF-PRT-09 with attribution |
| 7T-5 | Major | Owned events scattered; no catalogue; no Commits-through | FIX: Event catalogue with payloads and index tables; escalation reasons named; header bullet |
| 7T-6 | Major | `ladder_state` deferred to a missing SLICE-06 file | FIX: fields listed |
| 7T-7 | Major | Dispatch row 5 still uses `PRT-R07` and "damaged" | FIX: dispatch updated |
| 7T-8 | Major | Conflict-check inert state undefined | FIX: visibility row: never inert (ledger inputs; damaged index is `LED-R05`); dispatch wording |
| 7T-9 | Major | Stop reject, transport-rejected modify, orphan under kill, kill in square-off lack rows and proofs | FIX: F-P10…F-P13 with proofs |
| 7T-10 | Major | Stop order type not a policy input | FIX: `protection.stop_order_type`, refusing until characterized (TASK-S06-01) |
| 7T-N | Nit | Heading suffixes; POL-021 header; Terms; class P; PRF-PRT-10 must-fail; switch default and misspelt-value proofs; security risk row; F-P9 wording and SLICE-05 setup; exit sequence defined once | FIX |

## Stage 8 — intermediate zoom-out (1 Blocker, 9 Major, 11 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 8-1 | Blocker | Tick exits have no durable "exit in progress" record | FIX: `SQUARE_OFF_STARTED` replaced by `EXIT_STARTED` (reason `square_off`, `target`, `deep_otm_delta`; cause tick or session), folded into `protection_state`, input to `evaluate`; one exit sequence for all three; CP-P3 and PRF-PRT-07 cover tick exits |
| 8-2 | Major | `ladder_state` lists the wrong fields | FIX: the complete serialized `TrailPosition` (`trail.py:153-205`) |
| 8-3 | Major | Spot and key-level ladders have unspecified exits | FIX: only the premium ladder loads; others refuse until specified |
| 8-4 | Major | Conflict row 2 blocks placement on the first fill | FIX: the group's own entry is not an unresolved effect for row 2 |
| 8-5 | Major | Linked command and counter have no source | FIX: one leg per position; commands read by key prefix; `n` = admitted commands + 1 |
| 8-6 | Major | Confirmed quantity undefined; partial stop fills re-send | FIX: latest completed command's quantity minus fills on the stop order |
| 8-7 | Major | Unprotected position under kill is silent | FIX: `unprotected_under_kill` escalation; F-P14; PRF-PRT-04 |
| 8-8 | Major | Refusals and escalations repeat on every trigger | FIX: ticks never submit a `DESIRED` leg; escalations once per subject and reason |
| 8-9 | Major | Goal 4 only enforced for protection | FIX: conflict row 5 refuses a second resting close from any principal |
| 8-10 | Major | SLICE-06 market inputs undefined before SLICE-08 | FIX: SLICE-06 adds fixture fields to `contracts/market.py`; producer named |
| 8-N1…N11 | Nit | `leg_id` constant parts; off-thread exit test; two check-state writers; PRF-DSP-04 wording; escalation subject; `close_time` name clash; `ENDED`/orphan; latch staleness; latch trip at A4; intent B2 restating row 3; plan drift | FIX (N10 in the intent resolution; N3, N4 already fixed by dispatch 8-4) |

## Post-answer review — `basket_at_plan` (2026-10-27)

After the owner's answers, the new basket section was reviewed by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (direct dispatch, read-only). Merged findings: 7 Blocker, 14 Major, 6 Nit. All resolved by FIX.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| B-1 | Blocker | Protective-leg fills had no ledger rule: they would reduce the entry's reservation, raise owned quantity, or escalate as late fills | FIX (ledger): `FILL` carries `leg_role`; a `stop`/`target` fill lowers `owned_quantity` and never touches the entry's reservation or state; `owned_quantity` is signed with state `overclosed`; the late-fill row is entry-leg only; basket is single-leg for reservations; protective legs excluded from `RESIDUAL_RECORDED` |
| B-2 | Blocker | No recorded leg role for protective order IDs | FIX: `broker_identity.leg_role` (SLICE-01 DDL), folded from outcome, resolution and `LEG_ASSIGNED` |
| B-3 | Blocker | Stop and target shared one command-key prefix | FIX: leg = (`position_id`, role); keys `prot:<position_id>:<role>:<n>`; close key `prot:<position_id>:close:<n>`; roles reserved |
| B-4 | Blocker | Target leg had no desire or full state set; orphan rule covered only the stop | FIX: one basket derived-state table for both legs; desired level and quantity defined; orphan rule covers every resting protective leg |
| B-5 | Blocker | Nothing evaluated a basket whose entry never filled (naked resting sells) | FIX: protected subjects include entries with live protective legs before any fill; first `PROTECTION_DESIRED` defined |
| B-6 | Major | P-1 false during the entry window; proof contradicted the rule | FIX: entry window defined; no quantity request inside it; P-1 holds after it; known exposure stated; Goal 4 restated |
| B-7 | Major | A LIMIT entry in a basket could sell before it buys | FIX: basket for MARKET entries only, as the legacy planner always builds (`orchestrator.py:775-778`, `orders.py:98`); a limit-price plan is refused (`ADM-R13`, stage `placement`); leg ordering and early-SELL margining are TASK-S07-05 items |
| B-8 | Major | "First fill of either" had no defined input | FIX: level-triggered rule over unfilled quantity versus `q` |
| B-9 | Major | Modify quantity meaning and failed sibling modify undefined | FIX: `ModifyChanges.quantity` is the new total; `sibling_modify_failed` path |
| B-10 | Major | Escalation and hold not atomic; reasons missing; `recovery` hold unreleasable | FIX: one decision (CP-B6); reasons added; a human with `hold_release` releases any reason |
| B-11 | Major | Timed-out basket could not be resolved per leg | FIX: per-leg `attempt_resolve`; per-leg `RESOLVED_*` from `WORKING`; CP-B2 rewritten |
| B-12 | Major | IDs left unassigned by the join had no later role assignment | FIX: `LEG_ASSIGNED` by reconciliation; protection waits and escalates `protective_roles_unassigned` |
| B-13 | Major | Missing stop, `LegResult` count, entry completion with protective legs, transient-refusal retry, sibling-timeout clock | FIX: `no_stop_planned`; results per `legs` then `protective_legs`; completion on `PlanRef.legs` only (never-reached counts terminal); transient refusals retried; clock from `OUTCOME_AMBIGUOUS` event time |
| B-N | Nit | Row 5 exemption dead; leg field sources; human replacement stop; join price normalization | FIX |

## Post-answer review, round 3 — `basket_at_plan` (2026-10-27)

The rewritten basket section was reviewed again by fresh `egm:egm-design` and `egm:egm-implementation-readiness` reviewers (direct dispatch, read-only). Across the basket section and the routine-restart checks, readiness reported 3 Blocker, 23 Major and 10 Nit, and design 2 Blocker, 14 Major and 8 Nit; the basket findings are merged below. Resolved by FIX, except one Q.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| C-1 | Blocker | A leg could submit a second request while its first was unresolved (`ORPHANED` outranked `PENDING`); a `NOT_SENT` request had no identical retry | FIX: one request at a time per leg; `PENDING` above `ORPHANED` in both state tables; a `NOT_SENT` request is resubmitted identically under its key |
| C-2 | Blocker | A second overclose or failure while held collided with the hold guard; escalation once per subject and reason could never recur | FIX: distinct hold reasons `overclose`, `sibling_failed`; `HOLD_ENGAGED` only when the reason is not engaged, escalation recorded either way; escalation keyed by subject, reason and episode (`episode` on `RECONCILIATION_ESCALATED`); `HOLD_RELEASED` payload and `safety.release_hold` defined; F-P24 |
| C-3 | Blocker | Conflict row 2 blocked the one-cancels-other or orphan cancel behind an unresolved modify forever; `PRT-R10` transient forever | FIX: row 2 exempts a cancel when `q` ≤ 0, a modify to fills plus `q`, and a human principal's cancel; transient refusals become hold-bearing after `reconciliation.working_escalation_secs` |
| C-4 | Blocker | A cloned host passed the routine checks | FIX in the sessions spec (send lease, round 3 there) |
| C-5 | Major | Failure classes incomplete (`ADM-R07` on a terminal target, `PRT-R01`, `PRT-R04`, long `WORKING`) | FIX: one classification table for every outcome |
| C-6 | Major | A position closed by square-off, a human or a foreign trade dropped out of protection with a SELL still resting | FIX: protected subjects include any position with a protective order not observed terminal; F-P25 |
| C-7 | Major | Entries may be admitted while that residual SELL rests | Q-017 raised (an entry gate is the owner's); row 1 unchanged meanwhile |
| C-8 | Major | Exit sequence fought the quantity rule and could close a zero or negative `q` | FIX: quantity rule suspended while `EXIT_STARTED` is open; close only if `q` > 0; `EXIT_STARTED` closes when `q` ≤ 0 and every leg is `ENDED` |
| C-9 | Major | B2 and dispatch row 6 judged a modify by remaining quantity while `ModifyChanges.quantity` is a total | FIX: both restated in total terms (total ≥ filled; total − filled within the owned position) |
| C-10 | Major | A protective leg unresolved at entry completion could never be resolved | FIX: per-leg `RESOLVED_*` from `COMPLETED` (ledger state table) |
| C-11 | Major | Role wait blocked on legs never reached; fills on unassigned IDs had no rule; replacement IDs lost the leg | FIX: the wait covers legs with an order ID; fills wait for `LEG_ASSIGNED`; a replacement ID inherits command key and `leg_role`; a leg's live order defined |
| C-12 | Major | `PositionView` had no order observation; staleness undefined | FIX: `observed` per leg from the latest fresh complete orderbook (60 s, POL-021); stale reads `PENDING` |
| C-13 | Major | Order quantity after a modify, and basket `desired_quantity`, undefined | FIX: order quantity is the latest observed modify quantity, else the placement's; basket `desired_quantity` is the stop's desired order quantity |
| C-14 | Major | `excess_quantity` not in the payload | FIX: field on `RECONCILIATION_ESCALATED` (execution-domain spec) |
| C-15 | Major | F-P21 merged a basket reject with a never-reached leg | FIX: reject gives `stop_rejected`; never reached or transport-rejected gives `unprotected` |
| C-16 | Major | Kill path named both `PRT-R01` refusal and no submission | FIX: protection submits nothing; one reason `orphan_under_kill` |
| C-17 | Major | `attempt_resolve` had no entry point | FIX: `lifecycle.resolve_attempt(principal, command_key, attempt_no, legs, observation_digest)` |
| C-18 | Major | Proofs missed the new cases | FIX: PRF-PRT-01 and PRF-PRT-03 extended |
| C-19…C-25 | Major | Hold-bearing `HELD_BACK` state; `PRT-R04` path under `refused`; `HOLD_ENGAGED` actor for protection; sibling clock from event time; legacy citations for retry and hold; CP-B4 wording; CP-B6 re-derivation | FIX |
| C-N | Nit | `ADM-R13` reason `limit_entry_in_basket`; protective legs outside `plan_digest`; `trigger_with_limit` offset unit; `LegResult` count wording; F-P16, PRF-PRT-01 "only a missing stop escalates"; table order; anchors | FIX |
