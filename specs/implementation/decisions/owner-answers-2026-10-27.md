# Owner answers, 2026-10-27

* **Status:** owner decisions, recorded by the package. They answer [Q-001…Q-021](owner-questions.md) (Q-017 raised by the third basket review, Q-018 by the SLICE-04 step 2 build, Q-019 and Q-020 by the step 3 and step 4 deepenings, each answered the same day; Q-021 raised by the SLICE-05 step 1 build and answered 2026-10-28) and the master corrections [X-001…X-007](../consistency/master-contradictions.md).
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
