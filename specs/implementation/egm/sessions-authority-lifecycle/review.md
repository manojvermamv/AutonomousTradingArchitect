# EGM review — sessions-authority-lifecycle

Process record (not normative). Target: [design/sessions-authority-lifecycle.md](../../design/sessions-authority-lifecycle.md). Resolution codes: **FIX**, **CONTEST**, **Q/X**.

## Stage 5 — initial zoom-out (1 Blocker, 3 Major, 4 Nit)

All applied in one rewrite: states reduced to `OPEN`/`CLOSED`; `SESSION_OPENED` initiated by `kernel.lifecycle` from calendar evidence and a standing `BINDING_AUTHORIZED`; an open session required for new entries only; CUJ-SES-4 (protective close after close); `Grant` moved to `contracts/identity.py`; `ordinal` dropped; SES-R06 removed in favour of `LED-R07`; epoch activation as the `INSPECTING → RECOVERY_WRITING` transition; `RECOVERY_ADVANCED` by a `recovery_advance` actor; reuse cites added.

## Stage 6 — comprehension (3 Blocker, 11 Major, 5 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-1 | Blocker | `session` table and session/binding/recovery event payloads undefined | FIX: event catalogue with payload fields and the `session` index columns; exact DDL in the SLICE-03 file |
| 6-2 | Blocker | Grant source, time, bounds, delegation, precedence, return types undefined | FIX: grants are ledger events; evaluation time and bounds; delegation meaning; check order; `Allowed`/`Refusal` defined |
| 6-3 | Blocker | Recovery stage persistence; every restart needs a human step; no backward transition | FIX: stage held in memory, every start at `INSPECTING`, transitions recorded; every restart needs a human `RECOVERY_ADVANCED`, which A04-F2 requires (no blanket automatic activation, `README.md:794`); `OPERATING` returns to `INSPECTING` on `LED-R05`. The operational cost of that rule is **Q-009** |
| 6-4 | Major | `FinancialSessionId` differs from SLICE-01; `EpochId` unlisted | FIX: SLICE-01 aligned; `EpochId` listed |
| 6-5 | Major | `authority.check` signature differs from intent spec | FIX: one signature `check(action, principal, account, at)`; intent spec aligned |
| 6-6 | Major | Session check point; admitted-not-dispatched entries at close; emitter of SES-R07/R09 | FIX: checked at admission and dispatch; at close such entries are refused at dispatch and released; `kernel.lifecycle` emits SES-R07, `kernel.recovery` SES-R09 |
| 6-7 | Major | No calendar contract | FIX: `Calendar` port, timezone, late open allowed, evaluation trigger |
| 6-8 | Major | Calendar unavailable at close; failed open recording | FIX: the close time is recorded at open, so closing needs no calendar; failed opens recorded as `SESSION_OPEN_FAILED` |
| 6-9 | Major | Binding resolution rules | FIX: latest authorized binding covering the date wins; inclusive range; revocation event; session records its binding |
| 6-10 | Major | Scope composition; mapping an entry to its calendar | FIX: calendar from the instrument's exchange segment in the plan's account binding; one composition in the first release |
| 6-11 | Major | Three owners of epoch activation; lock vs transaction | FIX: `kernel.recovery` performs it through `LedgerWriter.activate_epoch`; ledger and authority aligned |
| 6-12 | Major | Clock rules after restart not implementable | FIX: deadlines judged by wall time against the persisted origin; expiry recorded once; backward jump detected by wall vs monotonic delta; quality event |
| 6-13 | Major | Kernel-originated actions have no principal | FIX: `kernel:<module>` principals with built-in grants |
| 6-14 | Major | "Authorization continuity" undefined; circular dependency | FIX: defined; the owner root path re-establishes grants, so `recovery_advance` never depends on a restored grant |
| 6-15 | Nit | One close event guarantee | FIX: unique `(session_id)` on close |
| 6-16 | Nit | `S+1` notation | FIX: "the next trading date's session" |
| 6-17 | Nit | Empty meaning cells; SES-R06 gap | FIX |
| 6-18 | Nit | `README.md:1270` cite | FIX: `:1268` |
| 6-19 | Nit | Terms only as IDs | FIX: links to the policy inventory and divergence table |

## Stage 7 — style (0 Blocker, 7 Major, 10 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7S-M1 | Major | Refusal codes formatted five ways | FIX: one form, `SES-R03` (`grant_revoked`) |
| 7S-M2 | Major | "Binding" names three things; line 158 wrong | FIX: "standing binding", "policy binding", "release binding" in full; definition corrected |
| 7S-M3 | Major | "Composition" clashes with the glossary | FIX |
| 7S-M4 | Major | Paragraphs in recovery-table cells | FIX: short labels; prose under the table |
| 7S-M5 | Major | "Break check" column meaning flips | FIX: column renamed "Must fail if", every cell a defect |
| 7S-M6 | Major | REQ-SES-004 ambiguous negative | FIX |
| 7S-M7 | Major | Passive voice hides actors, notably who revokes unconfirmed grants | FIX: `kernel.recovery` records it |
| 7S-N1…N10 | Nit | Principals table, A3/row 4 links, D04 gloss, trading date/day, pause spelling, close time, paragraph split, phrases, "today's", grant action list | FIX |

## Stage 7 — structural (1 Blocker, 11 Major, 8 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7T-1 | Blocker | No Risks and limits section | FIX |
| 7T-2 | Major | No Proof column on the key table | FIX |
| 7T-3 | Major | REQ-SES-003/005/007/009/011 and I-S2 unproved | FIX: proofs added (PRF-SES-08, -09) and existing ones extended |
| 7T-4 | Major | `SES-R08`, holiday open failure, I-S1, I-S3, forward jump, restore-invalidation crash unexercised | FIX: failure rows and proofs |
| 7T-5 | Major | PRF-SES-01/02/07 cited nowhere; CUJs name no proof | FIX |
| 7T-6 | Major | Broken "(table below)"; stage table covers four verbs only; "any other write" is not an authority outcome | FIX: per-stage action table for all twelve grant actions |
| 7T-7 | Major | `RECOVERY_ADVANCED` used but not defined | FIX: defined as the `RECOVERY_STAGE` record that advances to `OPERATING`, checked with `authority.check("recovery_advance", ...)` |
| 7T-8 | Major | `grant` and binding tables missing; catalogue lacks decider and index effect | FIX |
| 7T-9 | Major | Session evaluation "after `OPERATING`" vs closes in recovery | FIX: closes are evaluated in `RECOVERY_WRITING` too; opens only in `OPERATING` |
| 7T-10 | Major | Grant validity uses raw wall time; deadlines use `effective_now` | FIX: grants use `effective_now` too |
| 7T-11 | Major | Goal 2 overstates (local exclusivity only) | FIX |
| 7T-12 | Major | Delivery has no keys or proofs | FIX: table |
| 7T-13…20 | Nit | Open items section; header shape; proof columns; unlinked references; overloaded subsection; refusal codes scattered; reuse format; `clock.jump_record_ms` default | FIX; the 1000 ms default becomes a measured value with no shipped default (it gates nothing, but the package does not ship thresholds) |

## Stage 7 — design (3 Blocker, 13 Major, 6 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-1 | Blocker | Advance possible with no old-owner exclusion proof | FIX: `OLD_HOST_FENCED` required after any restore, host change or gap (legacy `recovery.py:117-133`, `:808-851`, re-read at `445eb116`); CUJ-SES-5; PRF-SES-10 |
| 7D-2 | Blocker | Wall ratchet stretches deadlines; forward jumps spread | FIX: in-process deadlines on the monotonic clock; wall time only across restarts, never extending; ratchet kept only for grant windows; session boundaries wait out an unconfirmed forward jump |
| 7D-3 | Blocker | Check lets an invalid grant set pass | FIX: `Allowed` only when one grant passes every condition; deterministic choice; refusal code by furthest grant |
| 7D-4 | Major | Validity and revocation on raw wall time | FIX: revocation at ledger sequence; expiry on the ratchet |
| 7D-5 | Major | Dispatch not tied to the admitted grant | FIX: `authority.recheck(grant_id, version, ...)`; dispatch row 3 aligned |
| 7D-6 | Major | Delegation and grant administration incomplete | FIX: `grant_admin` action; parent revocation cascades; child window within parent |
| 7D-7 | Major | Principal model vs strategy workers and kernel principals | FIX: `service` kind; kernel principals authenticated by construction with built-in grants on all bound accounts |
| 7D-8 | Major | Stage table covers four actions | FIX: actions-per-stage table for all thirteen |
| 7D-9 | Major | Recovery writes would refuse queued work | FIX: the coordinator runs only in `OPERATING`; admitted work waits |
| 7D-10 | Major | In-process re-entry undefined | FIX: exit and restart (shared with ledger stage 8) |
| 7D-11 | Major | Consumers not tied to the session's binding | FIX: session binding is the only source; admission checks candidate and policy against it |
| 7D-12 | Major | Binding revocation mid-session undefined | **Q-010**; refusing parameter `binding.revocation_effect` |
| 7D-13 | Major | Who decides an entry's session | FIX: the kernel, from the plan's calendar; B6 confirms; multi-calendar plans refused |
| 7D-14 | Major | Calendar failure loses the day | FIX: retry on every kernel tick |
| 7D-15 | Major | Transition triggers and order; boundary clock | FIX: evaluated each tick; closes before opens; close reason rule; forward-jump wait |
| 7D-16 | Major | Target did not yet contain the recorded stage-7 fixes | Explained: the record was written before the rewrite; the rewrite now contains them |
| 7D-17…22 | Nit | Alternatives; hold release; close-effects row; I-S3; deadline domain; Combined-F6 hook | FIX |

Recovery's ordered steps (migrate, compare, repair, rebuild outcomes, owed closes, continuity, gaps) moved here from the ledger spec (ledger stage 8, finding 10).

## Stage 8 — intermediate zoom-out (1 Blocker, 10 Major, 4 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 8-1 | Blocker | Fence rule broader than legacy and the master; no gap event; restore not detectable | FIX: legacy scope only — a restore-marked epoch (marker on `EPOCH_ACTIVATED`, set by the restore path) needs `OLD_HOST_FENCED` in that epoch, and any `RECOVERY_GAP` needs a later fence; `RECOVERY_GAP` defined (legacy `events.py:86`); other unverified items listed for the human, resolved by D13–D16; citation corrected |
| 8-2 | Major | Nothing authorizes `OLD_HOST_FENCED` | FIX: a human principal holding `recovery_advance`, in `RECOVERY_WRITING`; stage table row |
| 8-3 | Major | `kernel:recovery` revokes without `grant_admin` | FIX: listed as that principal's one built-in revocation (`restore_unverified`), decided through `kernel.authority`; catalogue aligned |
| 8-4 | Major | Close effects duplicate session-keyed state | FIX: "Ends" rows and the `effects` payload dropped; I-S2 says no session reads another's state |
| 8-5 | Major | Boundary wait after a clock jump is a new clock gate and may never end | FIX: closes judged on the ratchet (early close only refuses); opens on wall now as legacy; no wait; unbound `clock.jump_record_ms` disables recording only |
| 8-6 | Major | Contract types differ from SLICE-01 | FIX: array wire form with derived string key; SLICE-01 builds `human`/`kernel`, SLICE-03 adds `service`; `Deadline.started` added to SLICE-01; `RecordedClock.advance` defined as appending a recorded step |
| 8-7 | Major | Grant version and narrowing have no producer | FIX: grants immutable; `version` dropped from `Grant`, `check`, `recheck` and dispatch `Dependencies`; one `parent_grant_id` |
| 8-8 | Major | Two close triggers; one before repair | FIX: tick evaluation in `RECOVERY_WRITING` starts after steps 1–3; step 4 is its first run |
| 8-9 | Major | "Staged" is redundant; I-S3 ambiguous | FIX: dropped; I-S3 is "covering and unrevoked"; continuity hook fires when the binding differs from the previous session's |
| 8-10 | Major | Scope omits the master's "policy contracts" | X-005 raised; scope row cites it |
| 8-11 | Major | SLICE-03 needs SLICE-02 | FIX: plan dependency added |
| 8-12 | Nit | `writer_state()` unused | FIX: removed |
| 8-13 | Nit | First `RECOVERY_STAGE` duplicates `EPOCH_ACTIVATED` | FIX: `EPOCH_ACTIVATED` records that transition |
| 8-14 | Nit | `at` parameter; "bound accounts" undefined | FIX: `at` dropped; bound accounts defined |
| 8-15 | Nit | Neighbour references | FIX: ledger catalogue row lists the recovery and clock events and `standing_binding`; dispatch policy row already removed; the policy-version name is aligned in the intent resolution |
