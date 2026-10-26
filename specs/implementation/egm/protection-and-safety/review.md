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
| 6-17 | Major | Session P&L contract missing; trigger, fields, re-trip | FIX: `kernel.reservations.session_pnl` defined in the ledger spec; evaluated on each position observation; legacy re-trip after unlock kept (`loss_latch.py:576-583`) |
| 6-18 | Major | Percent-only budget vs Q-002 | FIX: amount required; percent optional |
| 6-19 | Major | Combining matrix rows; code order | FIX: order damaged, inert, kill, hold, latch |
| 6-20 | Major | Inert/damaged per check | FIX: per-check table |
| 6-21 | Major | No-row result; relation version; parameter values | FIX |
| 6-22 | Major | CUJ-PRT-3 sequencing | FIX: the owner cancels first; an early owner close is refused at B3 |
| 6-23 | Major | Classification overlaps | FIX: per-leg rules in order |
| 6-24…31 | Nit | Mapping, delivery split, boundary, B1 note, desk, wording, link, `broker` value | FIX |

## Stages 7–8

Recorded below as they run.
