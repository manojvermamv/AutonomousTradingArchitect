# EGM review — dispatch-and-coordination

Process record (not normative). Target: [design/dispatch-and-coordination.md](../../design/dispatch-and-coordination.md). Resolution codes: **FIX**, **CONTEST**, **Q/X**.

## Stage 5 — initial zoom-out (0 Blocker, 6 Major, 5 Nit)

| # | Finding (short) | Resolution |
|---|---|---|
| 1 | Conflict checked at eligibility and again at revalidation | FIX: eligibility only (a later conflict makes the command wait); revalidation row removed |
| 2 | Dependency list differed between admission and dispatch; observation head included | FIX: one dependency set recorded at admission and rechecked at dispatch; observation head dropped |
| 3 | `protective_first` defined a priority the owner has not chosen | FIX: ordering is a refusing parameter with only `admission_sequence` defined; other values wait for Q-004 |
| 4 | Busy check belonged to admission | FIX: `ADM-R12` at admission; the coordinator defines the count |
| 5 | A worker timer separate from the HTTP timeout created late in-process results | FIX: the HTTP client timeout is the bound; the slot is held until the worker returns |
| 6 | REQ-DSP-011 implied a fill model and a write path | FIX: scripted results only, injected versioned costs, no write path |
| 7 | `LATE_RESULT` evidence no longer reachable | FIX: dropped |
| 8 | `DSP-R05` had no caller | FIX: dropped |
| 9 | F-D3 specified supervisor behaviour | FIX: points to the runtime spec |
| 10 | Per-account worker assumes few accounts | FIX: assumption stated |
| 11 | Reuse cites missing; DSP code numbering | FIX: `NotSent :43`, `RETRYABLE :37`, `recover() :139-155`, `resolve() :157-170`; warning on `last_outcome :81-92`; DSP-R01/R02 renumbered |

## Follow-up from the ledger stage 6 review

Ledger finding 6-5: a rejected command is final. Eligibility and REQ-DSP-010 now allow a new attempt only after `not_sent`; a new try after rejection is a new command key. The legacy `RETRYABLE` set (which includes rejection) is a reuse candidate only for the not-sent case.

## Stage 6 — comprehension (1 Blocker, 12 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-1 | Blocker | A conflict-waiting command never reaches the deadline refusal | FIX: every wake first refuses all `ADMITTED` commands past their deadline, eligible or not; the timer wakes at the earliest pending deadline |
| 6-2 | Major | What is sent to the broker | FIX: `send(request, plan, attempt_no)`, same as the port |
| 6-3 | Major | Revalidation not atomic with the claim | FIX: every ledger write runs on the one writer thread, so nothing commits between revalidation and the claim; stated explicitly |
| 6-4 | Major | Dependency set schema and comparison | FIX: fields, comparison kind per row, check order, first failure recorded; conflict-relation version change is not a refusal |
| 6-5 | Major | Busy count defined three ways | FIX: commands in `ADMITTED` or `IN_FLIGHT`; key renamed; admission B4 aligned |
| 6-6 | Major | Re-dispatch after `RESOLVED_NEVER_REACHED` | FIX: that resolution sets the attempt `NOT_SENT`, so the one rule covers it |
| 6-7 | Major | Outcome-commit failures; dangling CP-L5 | FIX: `LED-R03` and `commit_failed` both end the process into recovery; reference corrected |
| 6-8 | Major | Hold code and meaning | FIX: `PRT-R04 held`; one hold condition (protection spec); "requested vs recorded" defined; proof added |
| 6-9 | Major | `ADM-R11` reused; two deadlines | FIX: `DSP-R03 policy_changed`; one deadline (the application's deadline is the dispatch deadline) |
| 6-10 | Major | Simulated broker not reproducible | FIX: per-account script, mapping table, book steps, a test-released stall, no seed |
| 6-11 | Major | Simulated broker signatures | FIX: aligned with the execution-domain ports |
| 6-12 | Major | Policy input names and unbound behaviour | FIX: named refusing parameters; the loader refuses an unbound value |
| 6-13 | Major | F-D3 proof does not test it | FIX: proof moved to the runtime slice; PRF-DSP-05 no longer cited |
| 6-14…21 | Nit | Queue; ordering wording; loop arguments; unexpected exceptions; terms; interfaces; PRT codes; two keys with no behaviour | FIX |

## Stage 7 — style (0 Blocker, 6 Major, 10 Nit) and structural (1 Blocker, 10 Major, 6 Nit)

| # | Lens | Sev | Finding (short) | Resolution |
|---|---|---|---|---|
| 7S-M1 | style | Major | Four names for the claim | FIX: "claim" for the event, "attempt" for the record |
| 7S-M2 | style | Major | "Busy" means three things; "slot" undefined | FIX: busy count only for admission; worker idle/in flight |
| 7S-M3 | style | Major | Five forms of "ambiguous" | FIX: mapping sentence; backticked forms |
| 7S-M4 | style | Major | Refusal code formats | FIX |
| 7S-M5 | style | Major | Key labels are paragraphs | FIX: one-sentence labels |
| 7S-M6 | style | Major | Passive voice on evidence and reservations | FIX: the worker publishes; the refusal transaction releases |
| 7T-1 | structural | Blocker | No Risks and limits | FIX |
| 7T-2…5 | structural | Major | No Proof column; CUJs name no proof; proof columns; Delivery not a table | FIX |
| 7T-6 | structural | Major | Timeout proof ID differs from SLICE-01 | FIX: PRF-DSP-02 covers the SLICE-01 timeout case; PRF-DSP-06 the worker case |
| 7T-7 | structural | Major | REQ-DSP-007 has no plan text | FIX |
| 7T-8 | structural | Major | REQ-DSP-008 has no plan text | FIX |
| 7T-9 | structural | Major | `command_status` defined nowhere | FIX: defined here (read-only query over index tables); the security stub points here |
| 7T-10 | structural | Major | Broken evidence anchor | FIX |
| 7T-11 | structural | Major | Goals miss A03-F3 and the simulated broker | FIX |
| 7S-N, 7T-12…17 | both | Nit | Wording, failure table shape, links, anchors, duplicated policy input, kill/latch ordering proof | FIX |

## Stage 7 — design

Recorded below when it reports.
