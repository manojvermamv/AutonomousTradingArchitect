# Owner answers, 2026-10-27

* **Status:** owner decisions, recorded by the package. They answer [Q-001…Q-021](owner-questions.md) (Q-017 raised by the third basket review, Q-018 by the SLICE-04 step 2 build, Q-019 and Q-020 by the step 3 and step 4 deepenings, each answered the same day; Q-021 raised by the SLICE-05 step 1 build and answered 2026-10-28; Q-024 and Q-025 raised by SLICE-06 and answered 2026-10-28; Q-026 and Q-027 raised by SLICE-06 and answered 2026-10-28; Q-028 and Q-029 raised by SLICE-06 step 4 and answered 2026-10-29; Q-022 and Q-023 stay open) and the master corrections [X-001…X-007](../consistency/master-contradictions.md).
* **Rule for every value below (Q-015):** every limit and switch stays a **configurable** setting. An answer gives the value bound in config for the first release; nothing is hard-coded, and the loader still refuses a live composition that leaves a setting unbound.

## Owner questions

| ID | Decision | Config setting and value |
|---|---|---|
| Q-001 | Automatic protection keeps running during a recovery hold (legacy behaviour); entries stay blocked | `safety.hold_automatic_actions: allowed` |
| Q-002 | Daily-loss limit for BuyerEdge is ₹3,600 (the strategy's own value, startup banner "Daily Loss Limit: ₹3600"; `OA/config/parameters.yaml:45`, `:317-325`) | `risk.max_daily_loss_amount: "3600.00"` |
| Q-003 | View freshness (90 s, POL-018) is measured from the decision bar's **close**, not its open. More lenient than legacy by one bar | `market.view_age_stamp: bar_close` |
| Q-004 | Protective actions never wait on unrelated unresolved entries (option A); priority between protection and entries stays the fixed admission-order rule | `protective_independence: same_group_only`; `coordinator.busy_applies_to: entries_only` |
| Q-005 | First release: BuyerEdge on the current account | composition scope for SLICE-11/SLICE-14 |
| Q-006 | An identity-verified effect of `unknown` domain never releases its reserved money | `reconciliation.unknown_domain_settlement: forbid` |
| Q-007 | First test at the source whether a place field round-trips as our tag (TASK-S07-05); if not, the owner resolves each such timeout by a recorded action (`attempt_resolve`). Never adopt by shape | `attempt_resolve` grant action added in SLICE-03/07 |
| Q-008 | Analyzer, unknown and conflicting obligations count against live capacity | `capacity.count_non_live_obligations: count` |
| Q-009 | A routine same-host restart whose checks are clean resumes automatically under a standing authorization; a restore, host change or `RECOVERY_GAP` still needs a human `RECOVERY_ADVANCED` and the fence | `recovery.routine_advance: standing` |
| Q-010 | Revoking a standing binding mid-session refuses new entries at once; open positions stay protected | `binding.revocation_effect: stop_entries` |
| Q-011 | Dispatch deadlines are measured first (TASK-S11-07), then set per verb, with longer deadlines for cancel and close; tests use labelled synthetic values | `dispatch.deadline_ms.<verb>`: measured |
| Q-012 | A timed-out cancel, modify or close takes its domain from its target order's recorded domain (option A); entries stay under Q-007 | rule in the execution-domain spec |
| Q-013 | Protection is placed as legacy does: entry, SL-M stop and LIMIT target in one basket at plan prices | `protection.placement: basket_at_plan`; `protection.stop_order_type: trigger_only` |
| Q-014 | The owner **and** delegated human principals holding the named grant may use the kill exceptions (cancel, close), `kill_release`, `latch_unlock` and `pause_clear`. This supersedes the "authenticated owner only" wording of POL-002 and POL-004 | grant actions, per principal |
| Q-015 | Every loss limit is configurable per account; none is hard-coded. The value of `account.max_worst_case_loss` is set in the account's config at deployment | `account.max_worst_case_loss`: per-account config |
| Q-016 | Foreign broker activity is recorded and raises an operator alert; nothing else changes | `reconciliation.foreign_response: escalate` |
| Q-017 | Option A: conflict row 1 also blocks an entry while any position on the same account and underlying has a protective order not observed terminal | rule in the protection spec (conflict row 1) |
| Q-018 | Option A: in the first release a modify may not raise an entry order's limit (legacy parity: legacy never modifies an entry order); revisit when a strategy places limit entries | rule in the intent spec (B2, `ADM-R07` `wrong_field`); no setting |
| Q-019 | Option B: a long-only plan carries `amount = margin = worst_case_loss` = the full premium debit at the LTP. Options A (debit at the ask) and C (loss to the stop) stay documented and selectable by configuration for later adoption | bound policy `planner.debit_price: ltp`, `planner.worst_case_loss: full_debit` (alternatives `ask`, `to_stop`) |
| Q-020 | Option C: `structure_v1` plans and gates as legacy, then refuses every structure (`structure_protection_unbound`) until a per-leg protection rule is adopted. Options A (the one-leg stop rule per leg) and B (the template's declared points) are recorded for later adoption | rule in SLICE-04 step 4; no setting |
| Q-021 | Option A (2026-10-28): while a position's group has an unresolved effect, a modify that raises its protective order's quantity is refused by conflict row 2; lowering, and the excepted cancels, still pass. Option B (except a raise to the owned quantity) is recorded | rule in the protection spec (conflict row 2); no setting |
| Q-024 | Option B (2026-10-28, after a correction: legacy's live host passes no opposing score, `scripts/run_framework_live.py:5485`): the kernel cycles the ladder with no opposing score, as live. Option A (a worker-reported score) was first chosen on the wrong premise and is not built | no setting |
| Q-025 | Option B (2026-10-28): after a refused or failed stop modify the ladder puts back only `sl` and keeps the move's other fields, as the live host (`scripts/run_framework_live.py:5221-5278`); option A, the library rule step 1 built, is replaced | no setting |
| Q-026 | Option A (2026-10-28): the kernel runs the deep-OTM delta exit as the protection spec says (`premium_exit` with the tick's delta; reason `deep_otm_delta`), although legacy's live host at 445eb116 never ran it. Option B (not run, live parity) is recorded | rule in SLICE-06 step 2; threshold `delta_exit_threshold` (policy, default 0.10) |
| Q-027 | Option A (2026-10-28): the spec's five basket rules: a partial protective fill shrinks the sibling to `q`; a partly filled entry's legs shrink to `q` and it is trailed and squared off; an unfilled or rejected entry's legs are cancelled; a failed sibling cancel is retried for `reconciliation.working_escalation_secs` before the hold; unproven roles escalate and wait, with no hold. Option B (legacy's live host) is recorded | rules in SLICE-06 step 3; no setting |
| Q-028 | Option A (2026-10-29): the daily-loss latch sums the `pnl` of every row of the account's position book, including trades the system did not make, as legacy's live host (`scripts/run_framework_live.py:7983-7988`). Option B (only the session's own positions, as the spec wrote) is recorded | rule in SLICE-06 step 4; budget from `risk.max_daily_loss_amount` (Q-002) |
| Q-029 | Option B (2026-10-29): a restart that cannot read the broker engages no recovery hold; admission check B1 refuses entries on a stale book (`ADM-R05`) and stops once the broker answers. Legacy's hold (`scripts/run_framework_live.py:3141-3144`, option A) is recorded. The recommendation was A while the kernel does not compare positions; the owner accepted that gap until step 5 | rule in SLICE-06 step 4; no setting |
| Q-030 | Option A (2026-10-29): a bar holds the prices that arrived by its confirmation instant (POL-019); a later price is kept as a correction revision, seen only by a view that includes corrections. Legacy's refold at every read (`src/data/marketdata/ticks.py:511-560`, option B) is recorded | rule in SLICE-08 step 1; the lag is `market.bar_confirm_lag_secs` (POL-019) |
| Q-022 | Option B with C's upstream report (2026-10-30): legacy's hashed identity for a trade with no trade ID; a report to OpenAlgo drafted for the owner to post | rule in the OpenAlgo adapter; replaced when trade IDs arrive |
| Q-023 | Option C (2026-10-30): contracts first (TASK-S07-05), human `attempt_resolve` for closes, cancels and modifies otherwise | rule in SLICE-07's reconciliation, built with the adapter's composition |
| Q-031 | Option A (2026-10-30): `latest_tick` for a held option comes from the chain poll's `ltp` and delta | rule in SLICE-08 step 5 |

## Master corrections

| ID | Decision |
|---|---|
| X-001 | Accepted: the "Owner choices retained" rows in master §9 now point at the decided parts (done in the master README) |
| X-002 | Accepted: schema 1 stays provisional and test-only until TASK-S13-01 |
| X-003 | Accepted, stronger: every test file the slices need is listed in the master §6 tree (done in the master README) |
| X-004 | Decided: a misspelt `session_close` value refuses to load, like every other unknown value (supersedes POL-010's misspelt-value clause) |
| X-005 | Decided: a session is keyed by account and exchange calendar; the policy is bound inside it |
| X-006 | Accepted: the 54 rows and statuses of the [policy inventory](../02-policy-inventory.md) are the accepted scoped baseline (recorded in master §9) |
| X-007 | Accepted: `kernel/ledger/evidence_store.py` is added to the master §6 tree |

## What follows from these answers

The specs still name each setting as a refusing parameter; that is unchanged and intended (Q-015). The values above are what the first release binds. The spec sections that described only one option of an answered question (for example protection placement, Q-013) are deepened in their slice files using the chosen value.

## Standing rules (2026-10-30)

The owner answered four combined questions so the remaining slices can be built without stopping (the recommended option each time):

| Topic | Answer | What it means |
|---|---|---|
| Run mode | Design every remaining slice now; write each step's exact detail just before it is built | One session, up to three helper agents at a time; every step keeps the cycle: deepen, two fresh EGM reviews, fix, build, the suite twice, break checks, "as built" record |
| Fork rule | The old live system wins on money | A fork touching entries, exits, stops, sizes, limits or thresholds keeps legacy's live behaviour at 445eb116; a spec-only improvement to money is listed, not made. Every such call is logged in the slice file as **Fork call** for the owner's review. Owner-only items (licence, backup destination, RTO, POL-035, POL-036) stay open behind refusing settings |
| Live-readiness package | A: works live like today | Q-022 B with an upstream report drafted (not posted); Q-023 C; Q-031 A; POL-O04: every start-time behaviour stays today's (OD-AS-2…OD-AS-13 unanswered) |
| Boundary | Read-only steps pre-approved | Allowed without asking: reading recorded market days on the EC2 into an isolated copy; read-only OpenAlgo captures with no order (TASK-S07-05 reads); the disarmed shadow (SLICE-13). Still asked first: any order, the real restore rehearsal, any deploy, the cutover (SLICE-14), and posting anything outside the repository |

## Combined answers, slices 09–14 (2026-10-30)

The owner answered four more combined questions after every remaining slice was designed:

| Topic | Answer | What it means |
|---|---|---|
| Production blockers | Decide later | The licence, the backup destination (POL-O01) and the restore target and failover authority (POL-047) stay open behind refusing settings. They block only production staging (SLICE-11 step 10), the real restore rehearsal (step 11) and the cutover (SLICE-14); every other step is built and proved first |
| Stricter behaviours | Accept all four | Deleting the kill file no longer releases kill alone; `at kill-switch off` confirms, removes and releases (SLICE-10). Only listed login users are the owner on the command line (SLICE-10). A busy refusal is retried with the same key while the trigger's bar is within admission's view age, then abandoned (SLICE-09 Deviation 6). The post-crash no-trail gap (restart delay plus the remaining lease) is accepted (SLICE-11 Fork call 3) |
| Promotion | The old system's rules | An approval is used only by a session opened after it, so in practice before that date's open; a revocation also applies from the next session; approval is owner-only; `promotion.enforce` stays, set to true; the gate keeps today's statistic (POL-O03 unanswered) (SLICE-12) |
| Shadow before cutover | No hard gate on days | One or two clean end-to-end shadow days are enough; nothing in the code counts days or refuses on them (SLICE-13, SLICE-14). Reading a copy of the production research records and a cutover rehearsal on the shadow's copies were not approved by this answer: each is asked first |
