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
| Q-006 | An identity-verified effect of `unknown` domain never releases its reserved money. **Superseded 2026-11-14:** releases for accounting only ([Q-006 revisited](#q-006-revisited-release-held-money-for-bookkeeping-2026-11-14)) | `reconciliation.unknown_domain_settlement: accounting_only` (was `forbid`) |
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

## Margin limit when OpenAlgo reports none (2026-11-05)

OpenAlgo's `/api/v1/funds` carries no margin figure (captured `funds_20260802…04.json`: `availablecash`, `collateral`, `utiliseddebits` and P&L only), so the capacity check (B5) refused every entry, in production too (SLICE-07 funds row; SLICE-13 step 5 finding). Options put: available cash as the margin limit; OpenAlgo's margin endpoint per entry; no check, the broker decides; keep refusing.

| Topic | Answer | What it means |
|---|---|---|
| Margin when funds report none | Use available cash (recommended) | When the funds observation has no margin figure, `margin_available` is the observed `availablecash`, the rule legacy's reservation path uses (`src/runtime/ai_management/advice_orchestration.py:85` @445eb116, `funds.get("margins", available)`). Position rows and open orders with no amount follow legacy's treatment on the same path rather than refusing `observation_field_missing`. The broker remains the real margin boundary. Supersedes SLICE-07's "no guessed money field" for this one field |

## Unit names that clash with legacy (2026-11-13)

Legacy at 445eb116 ships `at-strategy.service/.timer`, `at-backup.service/.timer`, `at-research.slice`, `at-research-worker.service` and `at-research-model.service` (`deploy/systemd/`); the target rendered or started units under the same names, so `CUTOVER_STAGED` refused `CFG-R10 unit_name_collision` (SLICE-14 step 1 as built). Options put: rename the target's units; decide later.

| Topic | Answer | What it means |
|---|---|---|
| Clashing unit names | Rename the new units | The target's units become `at-strategy-host.service/.timer`, `at-ledger-backup.service/.timer`, `at-research-jobs.slice`, `at-research-job-offline.service`, `at-research-job-model.service`. Legacy's names are unchanged. Only unit names change: system users, groups, principals and console commands keep their names. The collision check also covers the transient units the target starts. `at-tier1-authority.service` is legacy's unit, named by the target only to stop it; unchanged |

## Server lost: start fresh (2026-11-13)

The production EC2 (`debian-oa`) is suspended permanently, with its data: legacy's ledgers, registry, Tier-1 ledger, research custody and records, recorded market days, and OpenAlgo's database. The off-box backup was never configured (`docs/INFRASTRUCTURE.md` in OA: "Not configured"), so nothing was copied off it. The code (both repositories) and this specification are intact. Five recorded market days survive in OA (`run/market-data/`, 2026-08-03…07, NIFTY and BANKNIFTY spot bars and chains, captured by legacy's code).

| Topic | Answer | What it means |
|---|---|---|
| How trading restarts | Fresh start with the new system only | No legacy on the new host. SLICE-13 steps 6–7 (the shadow against live legacy) and SLICE-14 steps 3–5 (the cutover from legacy) no longer apply; they are replaced by a fresh first install: backup destination, OpenAlgo, the new system's first install, one or two sessions with OpenAlgo in `analyze`, then the owner switches OpenAlgo to live. Research custody starts a new chain (legacy's spent days are lost). SLICE-13 steps 1–5 and SLICE-14 steps 1–2 stay built |
| Backup destination (POL-O01) | Cloud object storage: Backblaze B2 or Cloudflare R2, through restic | The owner creates the account and key only at go-live. Until then every build and rehearsal uses a local folder or a local restic repository: no credential blocks building or testing |
| Legacy root rules | Not installed | The legacy polkit rule and the `cutover-root` and `--key-probe` sudoers lines, and the `--shadow` copier line, exist only for a cutover from legacy; none is installed on a fresh host. The new system's own root rules are a separate question (asked next) |
| Do the four backup settings block staging | No: reported only, as built | `backup.destination`, `backup.retention`, `backup.passphrase_held_offbox`, `backup.storage_credential_held_offbox` are reported at staging and never refuse; nothing stops install, testing or trading without a backup (`REPORTED_WHILE_UNBOUND`, `deploy/install.py`). The trade-off was named to the owner: until a backup is configured, a host loss loses the data again |
| Strategy-timer binding hold | No hold, as the spec says | The strategy timer starts at the end of the install; the binding match is reported, never a refusal. The owner's switch of OpenAlgo to live is the moment of control |
| The five local days | Use them as simulation data, after validation | Before any use they are checked (gaps, duplicate minutes, impossible jumps, missing strikes, out-of-hours rows), and, once a new OpenAlgo exists, the spot bars are re-fetched from its history and compared (chains cannot be re-fetched). They serve backup and restore rehearsals at real size, a local first-install rehearsal with a fake OpenAlgo replaying them, and store-size and replay-timing measurement; not OpenAlgo's real load |

## The new system's own root rules (2026-11-13)

| Topic | Answer | What it means |
|---|---|---|
| Supervisor emergency stop (polkit, `at-supervisor` may only stop `at.slice`) | Accepted | As built (SLICE-11 step 4) |
| Installer manages its own units (polkit, `at-installer`, the target's units only) | Accepted | As built (SLICE-11 step 7) |
| Installer root steps (sudoers, `install.py apply-root` and `enable-units`, no argument after them) | Accepted | As built; the `cutover-root` line is not installed on a fresh host |
| Isolated work for operators (sudoers, `%at-operators … isolated_work.py --work-dir *`) | Accepted on one condition | A test must prove `scripts/isolated_work.py` refuses every unsafe argument it can be given through the wildcard (paths outside its allowed roots, extra unit properties, a different user, the `--shadow` and `--key-probe` modes on a fresh host) before this line is installed. The `--shadow` line is not installed on a fresh host |

## Restic on the development PC (2026-11-13)

| Topic | Answer | What it means |
|---|---|---|
| Install restic on the Windows PC for SLICE-15's backup rehearsal | No: use a folder | SLICE-15's backup and restore rehearsal uses `operations.backup`'s local-directory destination. `ResticDestination` (and its anchor gap) is first exercised on the new server with the B2/R2 repository, recorded there as waiting |

## Q-006 revisited: release held money for bookkeeping (2026-11-14)

| Topic | Answer | What it means |
|---|---|---|
| `reconciliation.unknown_domain_settlement` | `accounting_only` (was `forbid`, 2026-10-27) | An identity-verified effect of `unknown` domain releases its reservation for obligation accounting only. It is labelled `unknown` and never counts toward live performance, promotion or economics; `conflicting` never settles. Why: OpenAlgo's books carry no live/sandbox marker, so under `forbid` every completed entry kept its money `HELD`; in SLICE-15's five-day replay that refused every entry from the third day (225 refusals). The source check that `forbid` waited on (TASK-S07-05) can no longer run on the lost server. It also matches legacy at 445eb116, which released a sent reservation once the structure was `CLOSED` and its own orders terminal, with no domain check (`src/core/framework/execution/reservations.py:532`). Bound in `config/live.example.yaml` and the replay harness; `defaults.yaml` stays refusing until the profile binds it. |

## Q-029's approved row and `PRT-R06` (2026-11-14)

| Topic | Answer | What it means |
|---|---|---|
| Does Q-029's approved difference (`ADM-R05`) also cover `PRT-R06 check_inert` when funds are missing? | Void, closed | The approved-difference list existed only for the SLICE-13 comparison with live legacy, void since the server was lost (2026-11-13). No code change: either code refuses new entries while broker data is missing. |
