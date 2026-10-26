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

## Stage 7 — design (2 Blocker, 8 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-1 | Blocker | No dispatch recheck of a cancel/modify/close target; a stale close could sell a flat position | FIX: revalidation row 7 re-runs the effect check against a fresh observation |
| 7D-2 | Blocker | The ledger does not hold the request and plan to send | FIX: `COMMAND_ADMITTED` carries the normalized request and `PlanRef`; `next_eligible` loads them from it |
| 7D-3 | Major | `command_status -> Outcome` cannot show pending states | FIX: `CommandStatus` type in `contracts/execution.py` |
| 7D-4 | Major | Automatic re-dispatch after `not_sent` spins and is new behaviour | FIX: caller-driven, as legacy (`coordinator.py:94-99`): a new attempt needs `DISPATCH_RETRY_REQUESTED`; protection requests it at its next evaluation |
| 7D-5 | Major | Uniform busy bound decides protective-vs-entry priority | Q-004 extended; refusing parameter `coordinator.busy_applies_to` |
| 7D-6 | Major | HTTP timeout is not a total deadline; a stuck worker blocks its account | FIX: total-deadline requirement including resolution; stuck-worker failure row reported to the supervisor; socket-level proof in PRF-DOM-04 |
| 7D-7 | Major | Refused outcome commit exits the kernel and recovery can loop | FIX: deterministic refusals give `OUTCOME_AMBIGUOUS` (reason `outcome_refused`) without exiting; only fatal ones exit; recovery falls back to `evidence_unusable`; ledger guard allows recovery's rebuilt outcomes |
| 7D-8 | Major | Inert conflict check at eligibility undefined | FIX: the command waits and the check state is recorded; protection spec aligned |
| 7D-9 | Major | Simulated broker unfit for simulation runs; untestable paths | FIX: scripted responder for tests plus a versioned rule responder for simulation runs (fill model owned by the research spec, A07-F3); `raise`, coverage and domain knobs; acks enter the book |
| 7D-10 | Major | No Risks and limits | FIX (with 7T-1) |
| 7D-11…18 | Nit | Deadline clock; deadline values (**Q-011**); line 166; session row; evidence publication thread and failure; wake coalescing; replay cite; SLICE-01 hook order | FIX |

## Stage 8 — intermediate zoom-out (0 Blocker, 8 Major, 3 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 8-1 | Major | Two owners for transport evidence; lookup by attempt undefined | FIX: the adapter publishes inside its bounded call with command key and attempt number; the store finds it by that pair; `TransportResult.raw` optional; the worker only forwards |
| 8-2 | Major | Outcome commit skips reservations and lifecycle | FIX: worker return builds the outcome decision with `kernel.reservations` and `kernel.lifecycle`; PRF-DSP-03 covers a partly rejected two-leg entry |
| 8-3 | Major | No way to request a retry | FIX: identical same-key resubmission of a `NOT_SENT` command records `DISPATCH_RETRY_REQUESTED` after `authority.check` (ledger identity rule), as legacy |
| 8-4 | Major | Inert check both waits and refuses; two recorders of check state | FIX: inert check is an eligibility condition (wait); row 5 tests kill, hold, latch only; `kernel.safety` is the only recorder |
| 8-5 | Major | Row 6 (`policy_changed`) can never fire | FIX: row and `DSP-R03` dropped (code left unused); D13 policy dependency met by row 4 with PRF-SES-09 |
| 8-6 | Major | Target row: no source, no wake, head-of-line block, slice order | FIX: the kernel's in-memory latest observation is the source; observation arrival wakes; **wait** result skips to the next eligible command; PRF-DSP-09 moved to SLICE-07 |
| 8-7 | Major | Simulated broker in the wrong spec; drifted (no `funds`) | FIX: moved to the execution-domain spec with `funds`; script format left to SLICE-01 |
| 8-8 | Major | `domain` setting lets the simulator report a live domain | FIX: removed; always `simulated` |
| 8-9 | Nit | `LED-R09` fallback fails again | FIX: `LED-R09` is fatal |
| 8-10 | Nit | Retry after `RESOLVED_NEVER_REACHED` rarely reachable | FIX: retries only before the original deadline; then a new command key |
| 8-11 | Nit | A0 consumer; `raw_digest` name; TASK-S05-06 proof | FIX |

Cross-spec consequence carried into the sessions resolution: `grant_version` dropped from `Dependencies` (grants become immutable, sessions 8-7).
