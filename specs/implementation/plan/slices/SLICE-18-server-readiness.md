# SLICE-18 — Server readiness: what the new server needs before its first install

* **Status:** planned 2026-11-16 and revised the same day after a fresh review (14 findings, all accepted; see [Review applied](#review-applied-2026-11-16)). Steps 2–6 and 8 built 2026-11-16 (steps 3 and 4 on `slice-18b`, merged into `agentic-desk` at `9b05d6f`); step 7 built for day one (the mapping and the kernel's advice port); candidate approval and the legacy console reads wait, by the owner's answers of 2026-11-16, for the release that installs cognition and the console; F-7a and the merge leftovers built after the merge (see [After the merge](#after-the-merge-2026-11-16)). Step 1 (the audit) is this file's [Step 1 — audit](#step-1--audit-as-found). Steps 2–8 are outlines in the standing rules' sense: each step's exact detail (signatures, test tables, break checks) is written just before it is built, reviewed by two fresh EGM reviewers, built, run twice with the targeted tests, break-checked and recorded "as built". Its waiting rows are being run on the deployed host since 18 Nov 2026 (R-3 done; R-6 partly done).
* **Why this slice exists.** An independent review of OA_NEW found seven gaps that would stop or quietly weaken the first install on the new server (SLICE-15 step 7). Each was re-opened in the code for this plan, and every claim below cites the line it was read at. The reading and the second review found more blockers: the strategy unit names no strategy (A-8), there are no channel peer rows (A-10), and the market host's required source fields are unbound (A-11).
* **Precedence:** the master README, then the ROADMAP, then this package. Authorities:
  * the [migration spec](../../design/migration-recovery-rollback-continuity.md) (the send-lease store);
  * the [sessions spec](../../design/sessions-authority-lifecycle.md#send-lease-kernelrecoverypy) (the send lease);
  * the [configuration spec](../../design/configuration-artifacts-release.md) (installer, units);
  * the [strategies spec](../../design/strategies-and-cognition.md) and the [research spec](../../design/research-rl-custody-promotion.md) (promotion);
  * SLICE-10's owner-ports table.

  **No score, threshold, entry gate or money value is set or changed here.** Where a gap needs one, it is an owner fork. Nothing gates or mocks real trading, and OpenAlgo's mode is never read to gate a send.
* **Owner answers applied:**
  * Q-001…Q-031 as listed in [owner answers](../../decisions/owner-answers-2026-10-27.md);
  * Standing rules (2026-10-30);
  * Combined answers, slices 09–14, "Promotion: the old system's rules", which decides step 5;
  * Server lost: start fresh (2026-11-13; backup on B2 or R2 through restic) (restic replaced by plain objects over S3: D-017, 21 Nov 2026);
  * SLICE-16 and SLICE-17 choices (2026-11-14).
* **Builds on:** OA_NEW `agentic-desk` at `7d18e6d`. Branch `slice-18`, cut from `agentic-desk`.
* **Environment.** Steps 2–8 are built on the owner's Windows PC with fakes only: a local fake object store and the SLICE-15 fake OpenAlgo. No credential, broker or money is involved. Every check that needs Linux, a real bucket or a real session is a row for [SLICE-15's waiting list](SLICE-15-fresh-start.md#linux-only-rows-waiting-for-the-new-server), collected in [Rows for SLICE-15's waiting list](#rows-for-slice-15s-waiting-list). This file does not edit SLICE-15.
* **Environment classes.** Steps 2–8: S. Their waiting rows: P (SLICE-15 step 7, owner's word).

**In plain words.** The new system is built, but these things stop it from running properly on the new server:

1. The kernel will not start in production. There is no off-server place to hold its "only one sender" lock (the send lease).
2. The installer has no unit files for the AI service, the read-only MCP gateway or the console. The strategy unit does not say which strategy to run. The kernel has no list of the processes allowed to talk to it.
3. A promoted AI strategy can never start in production, because the strategy host is never told the promotion answer.
4. The docs say promotion goes one step at a time (none, then plan, then trade). Nothing checks that, and the old system did not check it either. You already chose the old system's rules, so the text is corrected.
5. Most owner actions (applying AI advice, approving a candidate, the MCP read tools) answer "not available" in production.
6. The example production profile binds two of your answers and none of the market host's required settings.
7. The comparisons with the old system's money behaviour were meant to run on recorded sessions, which died with the old server.

Each step is built and tested on this PC first. What needs the server waits for it.

## Steps

| Step | Builds | Class | Reuses | Proofs |
|---|---|---|---|---|
| 1 | **Audit (as found), below.** Each gap re-opened at its line, with legacy's behaviour where money or authority is touched | — | — | This file |
| 2 | The example profile binds every owner-answered first-release value and legacy's market source values, each cited. A test holds it to the answers. `market.source.backfill_on_start` is recorded as a defect | S | `config/live.example.yaml`, `settings/schema.py` `FIELDS`, the `policies` section | `test_example_binds_every_owner_answer` |
| 3 | The production send-lease store. An object-store adapter with conditional writes (F-1), in its own bucket. An ambiguous write is resolved by re-reading. An unreachable store at start is retried, not a crash. Protective sends follow F-7 | S / P | `LeaseStore` (`kernel/recovery.py:36-46`), PRF-MIG-03's tests, `ReadOnlyLeases` | PRF-MIG-03 over both adapters; REQ-MIG-013 on the real bucket (waiting) |
| 4 | The promotion flag over the channel. A read-only `promotion_flag` operation; `serve_strategy` passes `binding_flag` | S / P | `binding_flag_reader` (`bootstrap.py:452-465`), `_propose`'s self-only check (`unix_channel.py:948-957`) | In-process channel tests; real-socket row (waiting) |
| 5 | Correct the "one step at a time" claim to legacy's rule (decided by "Promotion: the old system's rules") | S | `requires_promotion` (`strategies/registry.py:445-448`) | `test_requires_promotion_is_legacys_rule` |
| 6 | Units. One strategy-host unit and timer per enabled strategy, naming its strategy. `at-cognition`, `at-mcp` and `at-console` templates. The composed set from F-2. The channel peer rows for every composed unit | S / P | `render_release`, `sysusers`, `polkit_files`, `directory_table` (`deploy/install.py`), `PARTICIPANTS` (`settings/schema.py:541-593`), `parse_peers` (`unix_channel.py:108-123`) | Render tests; `test_key_holders` unchanged; real systemd rows (waiting) |
| 7 | Owner ports in production. Compose or map every `OwnerPorts` and `McpPorts` field (F-4). The kernel's advice port reads advice that cognition published into the kernel's own evidence | S | `OwnerPorts` (`interfaces/api.py:146-157`), `ROUTED` (`:159-172`), `cognition/advice.py:112`, `McpPorts` (`interfaces/mcp.py:783-790`) | SLICE-10's cutover condition as a test |
| 8 | Legacy parity without legacy running. `compare_parity.py` gains `strategy`, `planner` and `ladder` modes that run legacy's pure code from a `git archive 445eb116` export over a recorded day (F-6) | S / P | The `gen_*_parity.py` isolated-export pattern, SLICE-15 step 3's converted days, the golden fixtures | PRF-STR-10, PRF-ADM-07, PRF-PRT-08 (partial on the August days, full on the server's analyze days) |

**Why this order.**

* Step 2 is small, and every later test reads the profile.
* Step 3 is the hardest blocker: without it no production kernel starts (A-1).
* Step 4 precedes the twin's unit being useful at `plan`.
* Step 6 needs F-2. Its peer rows are needed by every channel process, the kernel included.
* Step 7 needs step 6's composed set, because advice needs cognition.
* Step 8 is independent and long-running, so a second agent may build it alongside steps 3–7. Steps 3 and 8 share no files.

## Owner forks

Nothing here is chosen by the slice. Each fork blocks only the step it names.

| # | Blocks | Question (plain words) | Options | Recommendation |
|---|---|---|---|---|
| F-1 | Step 3 | You chose B2 or R2 for backups (2026-11-13). Which one holds the "one sender" lock? | **A.** Cloudflare R2, using its "write only if unchanged" uploads (`If-Match` / `If-None-Match`), in a bucket of its own. **B.** Backblaze B2, only if its S3 interface honours the same conditional uploads. That is **not confirmed**, and must be tested at the source first. | **A.** R2 serves backups and the lock with one provider. Conditional writes are exactly what the lock needs. R2's support is still checked at the source (R-1) before step 3 is deepened. |
| F-2 | Steps 6, 7 | Which extra services go into the first release? | **A.** As built: no AI service, MCP gateway or console. The twin and exit advice wait. **B.** Add the AI service (`at-cognition`): it holds the model key, never the broker key, and cannot send. Build and test the MCP and console unit files, but leave them out. This has two effects. First, BuyerEdge's review requests then go to a running service (up to a 360 s reply wait, `unix_channel.py:52-54`) instead of failing at once (`FailedReviews`, `bootstrap.py:1502-1521`). With no review team bound, the service answers at once (`bootstrap.py:1653`, `teams={}`), and a test proves entry timing is unchanged when cognition is down. Second, cognition will not start until its three settings are bound (`schema.py:562-565`). With no model key, the twin abstains `not_configured` (SLICE-17 answers). **C.** B plus the read-only MCP gateway, which legacy ran live (`mcp-gateway.service` @445eb116). That needs step 7's read ports. | **B.** The twin's live-observe rows (SLICE-17 step 6) and advice need cognition. The gateway serves nothing until step 7 (A-5), and is added in the next release without a reinstall. The console needs Node and a build step on the server, so it comes later. |
| F-4 | Step 7 | Which owner actions work in production on day one? | **A.** Reads, advice application and candidate approval (owner only) are connected. Live configuration, registry and policy edits are mapped to "stage a new release", with the reasoning written down; SLICE-10's cutover rule allows that. **B.** Every legacy owner action, including live configuration edits (legacy's console wrote settings live). **C.** Leave them answering "not available" (`SEC-R22`). | **A.** Settings are bound to the release and checked at staging; a live write would bypass that check. |
| F-5 | Step 2 | Besides your answers, should the example carry values that were approved but not answered? | **A.** Bind the policy-inventory approvals POL-018 90 s, POL-019 7 s and POL-021 60 s (`resources/defaults.yaml:12`, `:14`, `:34`; inventory accepted by X-006). Port BuyerEdge's policy block from legacy at 445eb116. The block's fields come three ways:<br>• **from legacy, cited line by line:** `planner`, `protection`, `product`;<br>• **from your answers:** `risk` = ₹3,600 (Q-002), `planner.debit_price: ltp` and `planner.worst_case_loss: full_debit` (Q-019), `protection.delta_exit_threshold: 0.10` (Q-026);<br>• **derived by a script** from the shipped blueprint (none bound for BuyerEdge, as legacy live): `configuration_digest`, `blueprint_digest`, `lineage_digests`, `review_required`, `review_deadline_secs`.<br>`ai_mode` (`off`, `observe` or `enforce_entry_holds`, `contracts/decisions.py:144-146`) is **your explicit value**. You confirm all of it at staging (SLICE-15 step 7.4). **B.** Bind only your answers; everything else waits for step 7.4. The partial `policies.buyer_edge` block is then unreadable: the kernel alerts `policy_unreadable buyer_edge` (`bootstrap.py:1332`) and refuses entries. | **A.** Under the Fork rule legacy wins on money, so legacy's values are the only candidates. Citing each one makes them checkable. For `ai_mode`, legacy live ran BuyerEdge with no review team, which points to `off`; that is inferred from SLICE-17's note and is to be confirmed in legacy's config. |
| F-6 | Step 8 | How do we prove the money behaviour matches the old system, now that it cannot run beside the new one? | **A.** Run legacy's own code offline from git, never installed. Run it now on the five August days, labelled partial (no bid/ask, history bars, two days with a possibly wrong expiry). Then run it on each analyze-session day the new server records, and put the report in front of you before you switch OpenAlgo to live. Nothing in the code blocks on it. **B.** August days only, with live days compared later. **C.** Skip it and rely on the golden unit tests. | **A.** B and C weaken the spec's proofs (PRF-STR-10 fails on "a decision differs"). Only A compares full days with bid/ask. |
| F-7 | Step 3 | If the lock store cannot be reached mid-session, may the kernel still send its own stop, trail and square-off orders? Today it may not, from the first failed renewal until one succeeds (Fork call 13, `kernel/recovery.py:566-576`, `kernel/coordinator.py:337-339`). Only your own manual cancel or close still goes through (`coordinator.py:86-94`). Legacy had the same rule, but its lock was a file on local disk that practically never failed (`src/core/framework/execution/sender.py:120-140` @445eb116), so a cloud lock makes this a new risk to exits. | **A.** Keep it as built. Entries and the kernel's exits wait until a renewal succeeds, and you can still close by hand. **B.** Protective sends (stop modify, trail move, square-off close) continue while the lock is still valid by the kernel's own clock (`confirmed_until`, `recovery.py:574-575`): no other server can take an unexpired lock. Entries keep today's strict rule. After expiry, everything waits. **C.** Protective sends never wait for the lock. That risks two senders if a copy of the server is running. | **B.** It keeps the "only one sender" guarantee, since the lock cannot change hands before it expires, and it does not leave positions unprotected during a short cloud outage. It changes Fork call 13 for protective verbs only, so the choice is yours. R-3 measures how often the store fails, not only how long it takes. |

**Decided, not a fork.** One-step promotion: the answer "Promotion: the old system's rules" (owner answers, Combined answers, 2026-10-30) keeps legacy, which has no one-step rule. Step 5 corrects the text. Enforcing one step (refusing a row more than one step above its last approved authority) is listed as a spec improvement, not made.

**Information:** `account.limits.max_daily_loss_amount` is 4000 in the example (`config/live.example.yaml:48`, legacy's drop-in), and Q-002's policy budget is 3600. The kernel uses the lower of the two (`kernel/safety.py:197`), so ₹3,600 is effective. Nothing changes.

---

### Owner answers (2026-11-16)

Recorded in [owner answers](../../decisions/owner-answers-2026-10-27.md#slice-18-server-readiness-choices-2026-11-16). F-7 **B**; F-1 **A** (R2, its own bucket); F-2 **A** (first release as built; templates built and tested, not installed: step 6's composed set is unchanged, and F-2 B's timing test is not needed); F-4 **A**; F-5 **A** with `ai_mode: observe` (legacy's value, `config/defaults.yaml:847-850` @445eb116, not the `off` inferred above); F-6 **the owner's own answer**: no August-days partial run; the golden unit tests now, and step 8's three modes run on each analyze-session day, the report to the owner before live. F-3 decided by the 2026-10-30 answer.

## Step 1 — audit (as found)

Re-read 2026-11-16 against OA_NEW `7d18e6d`; every line below was read directly (OA_NEW has no `.codegraph/` index). Legacy was read with `git -C OA show 445eb116:<path>`. **Inferred** marks a claim not checked at a source.

| # | Gap | Where (OA_NEW) | What the code does |
|---|---|---|---|
| A-1 | No production lease store | `bootstrap.py:1049-1072`, refusals `:1066-1070`; callers `:1179-1180` (`serve_kernel`), `:1336-1338` (`compose_production`) | Production accepts only `rehearsal:`. A `directory:` is refused by the code as "not off-host evidence", and everything else as "no lease-store adapter in this release". The spec would accept a directory on a filesystem the owner names as off-host (`migration-recovery-rollback-continuity.md:167`); the code refuses all directories. The example has `recovery.lease_store: null` (`config/live.example.yaml:34`). The adapters are `DirectoryLeaseStore` (`adapters/lease_store.py:87`) and its rehearsal subclass (`adapters/rehearsal.py:94`). `lease_store_for` takes no secrets. |
| A-2 | What a lease store must do, and what a failure does | `migration-recovery-rollback-continuity.md:165-173`; `sessions-authority-lifecycle.md:322-338`; `kernel/recovery.py:424-448`, `:566-614` | The contract: `cas` linearizable per account, `True` durable, `now()` the store's clock, off the host, its own credential only, every call timed out (a timeout is unreachable). The kernel's behaviour today:<br>• **A lost answer.** A renewal `cas` that raises leaves the old lease in `held` (`:606-610`). If the store did write, the next renewal sends the old lease as `expected`, gets `False`, raises `LeaseLost` and the kernel stops (`:611-613`).<br>• **Gated sends.** Unconfirmed leases block every claim except an owner's manual cancel, close or modify (`may_send` `:566-576`; `coordinator.py:86-94`, `:337-339`).<br>• **An unreachable store at start.** `_take` has no exception handler (`:431-437`; called from `:205`, `:500`), so the start raises. `at-kernel.service` allows 3 starts in 900 s (`StartLimitBurst=3`), so an outage at the open can leave the kernel down for the day (inferred from the unit's limits).<br>• **Unused readers.** The backup could read leases, but its unit passes none (`operations/backup.py:549-555`, `main` `:657`). |
| A-3 | No cognition, MCP or console units | `deploy/systemd/` (10 files); `deploy/install.py:30` `FIRST_RELEASE`, `:33` `KEY_HOLDER_UNITS` | No template exists for `at-cognition`, `at-mcp` or `at-console`, though all are participants (`settings/schema.py:562-565`, `:572-574`). `read_write_paths` has no `mcp` or `console` key (`install.py:124-130`). `console` has no command (`schema.py:574`), and `operator_ui/` is a Next.js app. Every render takes `composed=FIRST_RELEASE`, and `_render_for` never passes another set (`install.py:638-648`). `run/cognition` is mode 2750, group `at-channel` (`install.py:116`). |
| A-4 | `binding_flag` never passed | `bootstrap.py:1595-1600`, `:414-417`, `:452-465` | A model strategy above `none` gets `None`, so `STR-R16`. `binding_flag_reader` needs the in-process `authority`. No channel operation answers the flag (`unix_channel.py:45-51`). `strategies.registry` is scoped to `strategy` only (`schema.py:440`), so the kernel cannot read which candidate a strategy runs. The host computes its own `CandidateId`. |
| A-5 | Owner ports unwired | `interfaces/api.py:146-157`, `:1772-1776`; `interfaces/mcp.py:783-790`, `:871`, `:1326`; `bootstrap.py:1370`; `kernel/admission.py:847-852` | The operator's `serve` composes only `playbooks`; MCP's `serve` passes no ports. 128 non-proxy MCP tools (115 `observe`, counted from `mcp.CATALOGUE` on this PC) answer `SEC-R22`. The production kernel has no `advice` admission port, so `advice_apply` is refused `SEC-R22`. The kernel checks an applied advice's action itself (`admission.py:851`). There is no `approval_binding` implementation. |
| A-6 | One-step promotion claimed, not enforced | `docs/operations.md:190`; SLICE-17 lines 40, 147; `strategies/registry.py:128-131`, `:445-448`; `kernel/authority.py:690-731` | The row's authority is the profile's. `requires_promotion` = model-driven and authority ≠ none. `research/promotion.py` contains no `authority` (grep). Legacy is the same (`src/runtime/strategy_host/lifecycle.py:220-226` @445eb116). |
| A-7 | Example binds two answers | `config/live.example.yaml:26-34` | Only Q-006 and Q-009 are bound. Resolving the example on this PC left 26 of the kernel's 27 required fields unbound. Q-002, Q-019 and Q-026 are bound-policy fields (`contracts/decisions.py:128-147`, `:296-326`, `:496-497`, `:168`), read from the `policies` section (`bootstrap.py:1324-1332`), and the example has none. `promotion.enforce` defaults to `true` already (`resources/defaults.yaml:180`). No `market.source.backfill_on_start` setting exists in `src/` (grep). |
| A-8 | The strategy unit names no strategy | `deploy/systemd/at-strategy-host.service@7d18e6dd5:20`, `.timer:9`; `bootstrap.py:928-930` | `ExecStart=…/at-strategy` has no argument, so `run` exits `EXIT_USAGE`. The check test skips the strategy unit (`tests/contracts/test_rendered_units.py:398-399`). The timer names `Unit=at-strategy-host.service`. |
| A-9 | Parity proofs have no recorded sessions | `scripts/compare_parity.py:19-25`; `strategies-and-cognition.md:357`; `intent-to-admission.md:402`; `protection-and-safety.md:477` | Only the `shadow` mode exists, void with legacy gone. Stand-ins: BuyerEdge golden walks (30 Oct 40 bars, 23 Oct 30 bars; `tests/unit/test_buyer_edge_parity.py:1-9`), 57 planner cases, the trail golden. |
| A-10 | No channel peers | `unix_channel.py:108-123` (`parse_peers`), `:339-347` (`_admit`); `bootstrap.py:707-709`, `:1151`, `:1360`, `:1659` | The kernel and cognition admit a caller by unit name, `MainPID`, uid and one principal per unit. `parse_peers` refuses anything but `{relays, services}`. The example has no `channel` section, so neither the kernel nor cognition starts. Each strategy instance needs its own `services` row, `strategy:<id>`. |
| A-11 | Market host's required fields | `operations/deployment.py:367-373`; `resources/defaults.yaml:18-32` | Production requires `openalgo.base_url`, `market.http_timeout_ms`, the eight `market.source.*` and four `market.ticks.*` fields. The example binds none. Legacy's values are in the comments at `defaults.yaml:19-25` and `:29-32`. `instruments` is "set per deployment" (`:26`). |

---

## Step 2 — the example binds every owner answer (outline)

**Decisions.**

* **Settings bound in `config/live.example.yaml`, each commented with its answer:**
  * `safety.hold_automatic_actions: allowed` (Q-001);
  * `market.view_age_stamp: bar_close` (Q-003);
  * `coordinator.busy_applies_to: entries_only` and `protection.protective_independence: same_group_only` (Q-004);
  * `capacity.count_non_live_obligations: count` (Q-008);
  * `binding.revocation_effect: stop_entries` (Q-010);
  * `protection.placement: basket_at_plan` and `protection.stop_order_type: trigger_only` (Q-013);
  * `reconciliation.foreign_response: escalate` (Q-016);
  * `promotion.enforce: true` (Combined answers, "Promotion", explicit though it is the default);
  * Q-006 and Q-009 kept.
* **Policy answers.** `policies.buyer_edge`:
  * `risk.max_daily_loss_amount: "3600.00"` (Q-002);
  * `planner.debit_price: ltp` and `planner.worst_case_loss: full_debit` (Q-019);
  * `protection.delta_exit_threshold: 0.10` (Q-026).

  The rest of the block follows F-5. Under F-5 B the expected alert is `policy_unreadable buyer_edge` (`bootstrap.py:1332`), not `policies_unbound`.
* **Market source (A-11, under the Fork rule: legacy's live values).**
  * `market.source`: `strike_count: 8`, `chain_interval_secs: 60`, `greeks_batch: 10`, `tick_mode: 1`, `greeks: false`, `repair_live: true`, `tick_symbols: [BANKNIFTY, NIFTY]`. Each line cites `resources/defaults.yaml:19-25` and, through it, legacy's `config/defaults.yaml` line; each is re-read at 445eb116 before binding.
  * `market.ticks`: `connect_timeout_secs: 10`, `backoff_initial_secs: 1`, `backoff_max_secs: 30`, `stale_after_secs: 15` (`:29-32`).
  * `market.source.instruments`, `openalgo.base_url` and `market.http_timeout_ms` stay `null`: they are deployment, owner or measured values.
* **`market.source.backfill_on_start`** (S16 answer `false`) has no setting in `src/`. Its behaviour (no backfill) is today's. It is recorded in `defects.md`-style text here as "the answer has no setting to bind", not built.
* **Left unbound.** Q-011 (measured), Q-015 (per account, at deployment), and the measured and owner-only fields stay `null`, with their register named.
* **Stale comments fixed:** `:34` and `:40-41`.
* **The answer table is data.** `tests/fixtures/owner_answers_first_release.json` maps each key or policy path to its value and its answer ID, copied by hand from the owner-answers file (its path and date stated in it). It covers Q-001, Q-002, Q-003, Q-004, Q-006, Q-008, Q-009, Q-010, Q-013, Q-016, Q-019, Q-026 and "Promotion".

**Tests** (`tests/unit/test_example_profile.py`, new).

| Test | Proves |
|---|---|
| `test_example_binds_every_owner_answer` | Every fixture row is bound to exactly its value, in settings or in `policies.buyer_edge` |
| `test_example_binds_nothing_unanswered_as_answered` | Every `Q-0xx` comment names a fixture row |
| `test_example_market_fields_are_legacys` | Every bound `market.source.*` and `market.ticks.*` value equals its legacy comment in `defaults.yaml` |
| `test_example_resolves` | The example resolves; each answered field leaves the kernel's unbound list. The market participant's unbound list holds only the three deployment fields |

**Break checks:** `placement: stop_on_fill`; drop `binding.revocation_effect`; `strike_count: 10`; `"3600"` as `3600.0`.
**Files:** `config/live.example.yaml`, `tests/unit/test_example_profile.py`, `tests/fixtures/owner_answers_first_release.json`. **Waiting rows:** none.

### Step 2 as built (2026-11-16)

OA_NEW `f85ac8e` (and a comment-only `channel` note in step 6's commit).

* **Bound, each with its answer in the comment:** Q-001, Q-003, Q-004 (both), Q-005 (`composition: first_release`; `accounts` stays null), Q-006, Q-008, Q-009, Q-010, Q-013 (both), Q-016, "Promotion" (`promotion.enforce: true`), and F-5 A's POL-018 90, POL-019 7, POL-021 60 (`market.max_view_age_secs`, `market.bar_confirm_lag_secs`, `reconciliation.max_observation_age_secs`).
* **Market source (A-11):** `strike_count 8` (`config/defaults.yaml:1299`), `chain_interval_secs 60` (`:1348`), `greeks_batch 10` (`:1361`), `tick_mode 1` (`:1785`, `monitoring.autowatch_mode`), `greeks false` (`:1325`), `repair_live true` (`:1374`), `tick_symbols [BANKNIFTY, NIFTY]` (`config/profiles/enforcing.yaml:236`; `defaults.yaml@445eb116:1431` ships `[]`), ticks `10/1/30/15` (`:587-589`, `:1778`), all @445eb116.
* **`policies.buyer_edge` (F-5 A).** Legacy live bound no stored policy (`docs/OWNER-DECISIONS.md:141`) and built its desk from defaults (`scripts/run_framework_live.py:3557-3569`), so every planner and protection value is that desk's, cited line by line: `strikes.Policy()` (`strikes.py:46-63`), `SizingConfig()` (`quantity.py:22-29`), the desk's stop fields and `max_held`, `stance`, `product: MIS` (`orchestrator.py:117-155`), `limits` all zero (`gates.py:30-42`; legacy's live caps were the environment drop-in, which is `account.limits`, and `effective_limits` takes the lower non-zero), the ladder at `TrailSettings()` defaults. Owner values: `risk.max_daily_loss_amount "3600.00"` (Q-002), `debit_price ltp`, `worst_case_loss full_debit` (Q-019), `protection.ladder.delta_exit_threshold 0.10` (Q-026), `ai_mode: observe` (F-5, `config/defaults.yaml:847-850`).
* **Derived by a script** (`scripts/derive_policy_digests.py`): with no review team for BuyerEdge (legacy's service answered `required_role_failed` with `team is None`, `service.py:270-274`), `review_required: false`, `lineage_digests: []`, the blueprint digest of "no team" and the configuration digest by `bootstrap.proposal_teams`'s formula. `review_deadline_secs: 30` is legacy's team deadline default (`blueprint.py:239`), unused while `review_required` is false. A test holds the example's digests to the script.
* **Fork call (legacy wins), bound: `broker` (18 Nov 2026 release):** `protection.session_close: broker`. Legacy live left the close to the broker's square-off: no stored policy means no framework close (`src/runtime/session_close.py:109-111`), and the owner chose "broker for now" for shipped policies (`docs/OWNER-DECISIONS.md:132-133`, 21 October). `square_off` at 15:13 (`lifecycle.py:31`) is the per-policy switch. SLICE-16's F-2 answer ("the policy's fixed time") holds whenever the switch is `square_off`.

  > **Owner amendment — 19 November 2026 (D-014, OA_NEW `docs/decisions.md`).** Bound now: `protection.session_close: square_off` (release `20261119T100828Z-91a2667a6d14`); the kernel squares off at 15:13 IST, before the broker's 15:15. Positions opened under `broker` keep it.
* **Tests** (`tests/unit/test_example_profile.py`, 5): the plan's four plus `test_example_policy_digests_are_derived`. Two runs, 93 passed and 1 skipped each with `test_secret_references`, `test_settings_resolver` and `test_policy_parameters`; `tests/contracts` 530 passed, 5 skipped, 1 failed (`test_prf_str_09_the_run_time_watch`, an order-dependent subprocess count; it passes alone, 163 passed, and reads nothing step 2 touched).
* **Break checks, all caught:** `placement: stop_on_fill`; drop `binding.revocation_effect` (3 tests); `strike_count: 10`; `"3600.00"` as `3600.0`.
* **Deviations.** The fixture also carries Q-005 and the four F-5 rows. `test_example_resolves` leaves out the `/srv/...` paths a Windows host reads as relative (the loader's own CFG-R03); the market participant's unbound list is the three deployment fields plus `market.poll_interval_secs` (POL-020: the rule is approved, its value is not).
* **Left unbound, with reason:** `market.poll_interval_secs` (POL-020 value unanswered), `market.http_timeout_ms`, `adapter.http_timeout_ms`, `dispatch.deadline_ms_*` (Q-011, measured), `coordinator.max_pending_per_account`, `reconciliation.clock_skew_secs`, `working_escalation_secs`, `observation.*` (measured), `money.rounding`, `interfaces.*`, `recovery.lease_store` (step 3), `market.views`, `strategies.registry` and `accounts` (the account is the owner's at deployment), `account.max_worst_case_loss` (Q-015), `market.source.instruments`, `openalgo.base_url`, `channel` (step 6). Of the kernel's production-required fields, 19 stay unbound on Linux (26 of 27 before; counted on this PC, where two `/srv` paths also read as unbound).
* **Defect, not built:** `market.source.backfill_on_start` (S16 answer `false`) has no setting in `src/`; the behaviour (no backfill) is today's. The answer has no setting to bind.
* **Row for SLICE-15's waiting list:** run `tests/unit/test_example_profile.py` on Linux (the Ubuntu test server will do), where the `/srv` paths count; the market participant's unbound list must then be exactly the four named above.

## Step 3 — the production send-lease store (outline; F-1, F-7)

**Decisions** (for F-1 A; B uses the same adapter if B2 passes R-1).

* **`ObjectStoreLeaseStore`** in `adapters/lease_store.py` (T-90). It speaks the S3 API over HTTPS. The deepening chooses a standard-library SigV4 signer or a pinned client in `requirements.lock`.
  * It uses **its own bucket**, never the restic bucket (21 Nov 2026, D-017: the backup's bucket; restic is removed), with its own tokens: a read-write token for the kernel, a read-only token for the backup.
  * Layout: `leases/<account_file>` and `once/<sha256(key)[:32]>`.
* **`cas(expected, new)`:**
  * `GET` the object and its ETag. If the body is not `expected`, return `False`.
  * Otherwise `PUT` with `If-Match: <etag>`, or `If-None-Match: *` when `expected` is `None` and nothing exists.
  * `412` is `False`. `2xx` is `True`, durable at the store (confirmed at the source, R-1).
* **Release** writes a tombstone `{"absent": true}` under `If-Match`, so it never needs a conditional `DELETE`. `read` maps a tombstone to `None`.
* **`now()`** is the `Date` header of a `GET` to the store: the store's clock, with one-second resolution, stated beside `recovery.lease_secs`. No write is made for the time.
* **Failures.** Every request has a timeout. A timeout, a 5xx, a TLS failure or a damaged body is `LeaseStoreUnreachable` (`lease_store.py:31`), never `False` or `None`.
* **`put_once`** uses `If-None-Match: *`.
* **An ambiguous write is resolved (finding 1; correctness, no fork).** In `kernel/recovery.py` `_renew`, when a `cas` raises, the attempted `new` is remembered. The next renewal, when its `cas` returns `False`, re-reads the stored lease:
  * if the stored lease has this ledger and epoch (`holder_ledger`, `holder_epoch`) and equals a lease this epoch attempted, it is adopted as `held` and the renewal retries;
  * only a lease held by another holder or epoch raises `LeaseLost`.

  `_take`'s rollback loop gets the same rule.
* **Unreachable at start (finding 2; correctness).** `_take` catches `OSError` and `ConnectionError`, releases what it took, and returns `SES-R10 lease_store_unreachable`. The kernel host retries the advance within the process every `recovery.lease_renew_secs` and alerts. The process stays up, so an outage at the open does not use up `StartLimitBurst=3`.
* **Retry within one renewal interval.** A failed renewal is retried on every pass, not after a full `lease_renew_secs`. The existing `not self.unconfirmed` clause at `:589` already allows this; a test pins it.
* **F-7.** Under B, `may_send` gains a protective case: a kernel stop modify, trail move or square-off close is claimed while `lease_clock < confirmed_until`, even if a renewal failed. Entries keep "false from the first failed renewal". Under A nothing changes. The verbs are listed in one literal beside `OWNER_LEASE_EXEMPT` (`coordinator.py:86-94`).
* **Location and credentials.** The location is `recovery.lease_store: s3:<endpoint host>/<bucket>/<prefix>`. The secret references are:
  * `secrets.lease_store.credential`, in the kernel's scope only;
  * `secrets.lease_store.read_credential`, in a new `backup` scope (`settings/secrets.py:255-268` has none today).

  The backup's `main` composes `ReadOnlyLeases` over the read-only token and passes it to `scheduled` (`operations/backup.py:549-555`), so each set records lease heads (`:412`) as the spec's gap computation expects. No new key-holder unit: `KEY_HOLDER_UNITS` concerns the broker key and is unchanged.
* **`lease_store_for`** gains `secrets=`. Production accepts `s3:` and `rehearsal:`. It still refuses `directory:`; the spec's "a directory the owner names off-host" route stays unbuilt, since the owner chose object storage.
* **The fake** (`tests/fakes/object_store.py`): a local threaded HTTP server with conditional `PUT`, ETags, a `Date` clock, and injectable stalls, 503s and lost replies (the write lands, the reply is dropped). Its behaviour follows the provider's documentation, not this code.

**Tests** (`tests/recovery/test_restore_fencing.py`, PRF-MIG-03 parametrized over `directory` and `object_store`; `tests/recovery/test_lease_failures.py`, new).

| Test | Proves |
|---|---|
| `test_cas_one_winner` (both adapters) | Two threads `cas` with the same `expected`: exactly one `True` |
| `test_now_is_the_stores` | `now()` follows the fake's `Date` |
| `test_timeout_is_unreachable` | A stall or a 503 is `LeaseStoreUnreachable`, never `False` |
| `test_release_is_a_tombstone` | Released, then `read` is `None`; a stale `expected` is `False` |
| `test_put_once_lands_once` | The second `put_once` is `False` |
| `test_damaged_object_is_unreachable` | A non-JSON body raises |
| `test_ambiguous_put_then_renew_is_not_lease_lost` | The write lands and the reply is lost. The next renewal adopts it and the kernel keeps `OPERATING` |
| `test_foreign_holder_is_still_lease_lost` | A stored lease of another epoch after an ambiguous write: `LeaseLost` |
| `test_unreachable_at_start_retries_in_process` | The store is down at start, so the advance is refused `SES-R10` and nothing raises. When the store returns, the next pass advances |
| `test_unreachable_mid_session_gates_sends` | Under F-7 A, entries and kernel exits wait and an owner close passes. Under B, kernel exits pass until `confirmed_until`, then wait |
| `test_failed_renewal_retries_next_pass` | The retry comes before `lease_renew_secs` elapses |
| `test_production_accepts_object_store_only` | `s3:` with a credential is accepted; without one, `directory:` and unbound are refused |
| `test_lease_credentials_scoped` | The read-write credential resolves only for `kernel`; the read-only one only for `backup` |
| `test_backup_records_lease_heads` | A scheduled backup over the fake records each account's lease head |
| `test_kernel_advances_on_the_object_store` | The routine advance (Q-009) over the fake: taken, renewed with the head, released `clean` |

**Break checks:** drop `If-Match`; map a timeout to `False`; adopt any stored lease after an ambiguous write (not only ours); remove the `_take` handler; `now()` from `time.time()`.
**Files:** `adapters/lease_store.py`, `kernel/recovery.py` (`_renew`, `_take`, `may_send` under F-7 B), `kernel/coordinator.py` (F-7 B literal), `kernel/host.py` (the in-process advance retry), `bootstrap.py`, `settings/secrets.py`, `settings/schema.py`, `operations/backup.py` (`main`), the test files above, `docs/operations.md`. **Waiting rows:** R-1…R-4.

### R-1 desk check at the source (2026-11-16, before step 3's code)

Read on Cloudflare's own pages; nothing was created, no credential used.

| Question | What the docs say | Source |
|---|---|---|
| Conditional `PutObject` | `If-Match`, `If-None-Match`, `If-Modified-Since`, `If-Unmodified-Since` are supported on PutObject (and GetObject), "evaluated atomically against the committed bucket state" | https://developers.cloudflare.com/r2/api/s3/api/ |
| 412 on a failed condition | Stated for `If-None-Match: *` on an existing key: of concurrent writes to an absent key at most one succeeds, the others fail `412 PreconditionFailed`. For a **stale `If-Match`** only indirectly: CopyObject's destination conditions are rejected `412` and "work akin to" PutObject's (the direct sentence appeared only on a mirror of the docs, not counted). So a stale `If-Match` → 412 is **inferred**; R-1 checks it on the real bucket | https://developers.cloudflare.com/r2/reference/consistency/ ; https://developers.cloudflare.com/r2/api/s3/api/ ; https://developers.cloudflare.com/r2/api/s3/extensions/ |
| Competing conditional writes | R2 "serializes competing conditional writes to the same key" against the committed state | https://developers.cloudflare.com/r2/reference/consistency/ |
| Read-after-write | Strongly consistent: after a write "readers will immediately see the latest object globally"; deletes, metadata and listings likewise | https://developers.cloudflare.com/r2/reference/consistency/ |
| Caveat | A 404 shows absence only when the read ran; an earlier in-flight write can still commit afterwards. The adapter never infers "no write" from a 404 after a failed PUT (finding 1) | https://developers.cloudflare.com/r2/reference/consistency/ |
| Is a 2xx durable | R2 "indicates success only when data has been persisted to disk" | https://developers.cloudflare.com/r2/reference/durability/ |
| Region, endpoint | Region `auto`; endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | https://developers.cloudflare.com/r2/api/s3/api/ |
| `Date` header | **Not stated** on R2's S3 pages. HTTP requires an origin server with a clock to send `Date` (RFC 9110 §6.6.1, general knowledge). **Inferred, not confirmed**: R-1 checks it before `recovery.lease_store` is bound. A reply without `Date` is `LeaseStoreUnreachable`, so a missing header fails safe | — |
| SigV4 | Not described on R2's S3 page; the adapter signs SigV4 (`AWS4-HMAC-SHA256`, service `s3`, region `auto`), checked against AWS's published S3 example signature (`test_sigv4_matches_the_published_example`) | — |

Conclusion: F-1 A holds on the documentation for conditional writes, 412, serialization, read-after-write and durability. The `Date` header and a stale `If-Match` → 412 are left for the real-bucket row (R-1).

### Step 3 as built (2026-11-16)

OA_NEW `b2e58d5` (built on `slice-18b`, merged into `agentic-desk` at `9b05d6f`).

* **`ObjectStoreLeaseStore`** (`adapters/lease_store.py`): S3 over HTTPS with a standard-library SigV4 signer (region `auto`). `cas` is a GET then a conditional PUT (`If-Match: <ETag>` / `If-None-Match: *`): 412 is False, 2xx True. Release writes the tombstone `{"absent": true}` under `If-Match`. `now()` is a GET's `Date` header. A timeout, a connection or TLS failure, a 5xx, any other status, a missing ETag or `Date`, and a damaged body are `LeaseStoreUnreachable`. `put_once` is `If-None-Match: *`. Layout `<prefix>/leases/<account_file>`, `<prefix>/once/<sha256(key)[:32]>.json`, `<prefix>/clock` (read only).
* **`kernel/recovery.py`.** A renewal `cas` that raises remembers the attempted lease; the next renewal that gets False re-reads and adopts only a stored lease of this ledger, this epoch, equal to one it attempted, then renews from it; anything else is `LeaseLost`. `_take` and the routine lease check catch an unreachable store (`SES-R10 lease_store_unreachable`, an alert) and roll back what was taken, best effort, never raising. `run` sets `retry_routine` only when the decline is `[6]` caused by the store; `tick` retries the routine advance every `recovery.lease_renew_secs` on the lease clock (no ledger event until it succeeds).
* **F-7 B.** `may_send(account, protective=False)`; `coordinator.KERNEL_PROTECTIVE_VERBS = ("modify", "close")` for principal `kernel:protection`, beside `OWNER_LEASE_EXEMPT`; the claim path passes `protective=lease_protective(cmd)`.
* **Composition.** `lease_store_for(..., secrets=)` accepts `s3:<endpoint host>/<bucket>/<prefix>` in production with `lease_store/credential` (`<access key id>:<secret>`); `directory:` is still refused. `kernel_secret_scope` adds the lease token to the kernel's scope only for an `s3:` location (start, `--check`, `compose_production`). `settings/secrets.py`: scopes `lease_store` (read-write) and `backup` (read-only); `recovery.lease_store` is also scoped to `backup`. `operations/backup.py`: `lease_view` (a read-only view over the read token, or the rehearsal store); `main` passes `leases` and the ledger's bound accounts to `scheduled`. Fake: `tests/fakes/object_store.py` (threaded HTTP, ETags, a `Date` clock, stall, 503, lost reply). `docs/operations.md`: the send-lease section.
* **Tests.** `tests/recovery/test_lease_failures.py`, 33: the plan's 15 names, the store contract over both adapters (`test_cas_one_winner`, `test_release_is_a_tombstone`, `test_put_once_lands_once`, ×2 each), conditional headers, a lost race is False, a 403 is unreachable, the read-only view, AWS's SigV4 example, an own lease never attempted is `LeaseLost`, a decline for another reason is not retried, a human advance with the store down, a part-way take rolls back, the protective-verb literal, the coordinator passing `protective=`. Run 1 (the touched suites): 960 passed, 16 skipped, 2 failed (a guard matching the old refusal text, fixed by keeping its stem; `test_secret_references::test_boundary`, `adapters/lease_store.py` added with its reason), then 326 passed, 5 skipped. Run 2: 427 passed, 7 skipped.
* **Break checks (7, each caught, restored byte-identical):** drop `If-Match`; a timeout mapped to False; adopt any stored lease; remove the routine check's handler; remove `_take`'s `now()` handler; `now()` from this machine's clock; `may_send` ignores `protective`.
* **Deviations.** The retry lives in `Recovery.tick` (the host calls it every pass), not `kernel/host.py`. The store-contract tests are parametrized in the new file, not in `test_restore_fencing.py`. `test_unreachable_mid_session_gates_sends` tests F-7 B only (F-7 A is not built). The token is one secret, `<access key id>:<secret access key>`; the endpoint is always HTTPS in production (`scheme="http"` only for the local fake, by constructor). The backup's token is resolved after logging is set up and is not added to a scrub filter (the backup prints no token). The owner item found while building (the exit's own cancel) became F-7a, built after the merge. The installer's lease reads and the units' credential wiring were left for the merge (both built after it, below).
* **Rows:** R-1 (two items now named, both inferred from the docs: the `Date` header, and a stale `If-Match` → 412), R-2, R-3, R-4 (with the backup recording lease heads on the real bucket through `lease_store/read_credential`).

## Step 4 — the promotion flag over the channel (outline)

**The design** (finding 3). The kernel cannot work out a strategy's candidate or scope by itself (A-4). There are two ways:

* **(a)** Widen `strategies.registry`'s scope to `("strategy", "kernel")` (`schema.py:440`). That changes the kernel's projection and handshake digests, and every registry edit becomes a kernel restart.
* **(b) Recommended.** The request carries `strategy`, `account`, `calendar_id` and `candidate_id`. The kernel checks the peer's principal is `strategy:<strategy>`, as `_propose` does (`unix_channel.py:956-957`), then answers `binding_flag_reader` for that scope and candidate. A strategy could ask about a candidate it does not run and learn one boolean. It cannot trade on it: admission still refuses an unbound or unpromoted candidate (`ADM-R14`, `ADM-R16`). Choose (b) because it changes no digest.

**Decisions.**

* `promotion_flag` joins `ROLE_OPS["service"]` (`unix_channel.py:45-47`). It is read-only and writes no event. `ChannelKernel.binding_flag` is the client.
* `serve_strategy` passes `binding_flag=` (`bootstrap.py:1595-1600`). The check stays at start, as legacy's (`bootstrap.py:413-417`).
* A refused or ambiguous answer is `None`, so `STR-R16`.
* **Timer before binding.** If the timer starts the host before the session binding exists, `validate_binding` answers a refusal and the flag is `None`: a promoted twin is refused `STR-R16`, and `Restart=on-failure` retries within `StartLimitBurst`. This is recorded and tested. The binding's timing is SLICE-15 step 7.6's to observe.

**Tests** (`tests/integration/test_custody_promotion.py`, beside `:493`).

| Test | Proves |
|---|---|
| `test_promotion_flag_over_the_kernel_core_in_process` | The core's handler answers the binding's `requires_promotion` |
| `test_promotion_flag_refuses_another_strategys_name` | A peer `strategy:a` asking as `b` is refused `SEC-R11` |
| `test_serve_strategy_passes_binding_flag` | A promoted twin starts; an unpromoted one gets `STR-R16` |
| `test_flag_before_the_binding_exists_is_none` | No binding yet, so `None` and `STR-R16` |
| `test_channel_failure_reads_none` | An ambiguous reply gives `STR-R16` |

**Break checks:** `serve_strategy` drops `binding_flag`; the op defaults to `True`; the principal check removed.
**Files:** `adapters/unix_channel.py`, `bootstrap.py`, `docs/operations.md` (P-7 closed). **Waiting rows:** R-5.

### Step 4 as built (2026-11-16)

OA_NEW `db916e2` (on `slice-18b`, merged at `9b05d6f`).

* **What.** `adapters/unix_channel.py`: `promotion_flag` joins `ROLE_OPS["service"]` (not cognition's set, not the relay's); body `{strategy, account: [broker, account], calendar_id, candidate_id}`; the peer's principal must be `strategy:<strategy>` (else `SEC-R11 strategy`); then `binding_flag_reader(...)` answers `{"flag": True|False|None}` on the writer thread; read-only, no event. `KernelChannelClient.promotion_flag`. `bootstrap.py`: `ChannelKernel.binding_flag(strategy, account, calendar_id)`; only an answered boolean counts, anything else (refused, ambiguous, malformed, channel down) is None. `_channel_binding_flag` takes the registry row's account and the view policy's calendar; `serve_strategy` passes `binding_flag=`. The check stays at start (legacy's place).
* **Tests.** `tests/integration/test_custody_promotion.py`, 12 new: `test_promotion_flag_over_the_kernel_core_in_process`, `test_promotion_flag_refuses_another_strategys_name` (also: the relay gets `SEC-R10`, a short body `SEC-R11`), `test_channel_kernel_binding_flag`, `test_flag_before_the_binding_exists_is_none` (None, then `STR-R16`), `test_channel_failure_reads_none` ×6, `test_serve_strategy_passes_binding_flag`; `promotion_world` gained an optional `receipt`. Run 1 (with step 7's suites): 252 passed, 8 skipped. Run 2: 125 passed, 11 skipped.
* **Break checks (3, caught, restored):** `serve_strategy` drops `binding_flag`; a non-boolean answer defaults to True; the principal check removed.
* **Deviations.** `serve_strategy` is tested with its POSIX pieces monkeypatched (`_platform_ok`, `_channel_ids`, `strategy_review_port`, `KernelChannelClient`): Windows has no `pwd` or `SO_PEERCRED`. The guide's "(P-7)" sentence was left for the merge (it sat in the paragraph step 5 corrected) and is closed after it.
* **Rows:** R-5 (`promotion_flag` over the real socket with `SO_PEERCRED`; a strategy may ask only under its own name).

## Step 5 — promotion steps (outline; decided)

* Correct `docs/operations.md:190`, SLICE-17 lines 40 and 147, and the strategies spec to legacy's rule. A model strategy whose row is above `none` needs an approved `PromotionRecord` for its exact `CandidateId` in the session's binding. The owner sets the row's authority.
* Add `test_requires_promotion_is_legacys_rule` (`tests/unit/test_strategy_registry.py`): a row moved straight from `none` to `trade` with an approved record starts, and without one it gets `STR-R16`.
* **Break:** treat `plan` as not needing promotion.
* **Spec improvement, listed and not made:** one-step enforcement.
* **Files:** `docs/operations.md`, `tests/unit/test_strategy_registry.py`, and the spec text above (spec repository). **Waiting rows:** none.

### Step 5 as built (2026-11-16)

OA_NEW `5dd7785`. Text only; nothing is enforced (F-3, decided 2026-10-30).

* `docs/operations.md` (the AI twin's "Promotion" item) now states legacy's rule: a model strategy above `none` needs one owner-approved `PromotionRecord` for its exact `CandidateId` in the session's binding; the owner sets the row's authority; there is no one-step rule. No code docstring claimed enforcement (grep over `src/`).
* `test_requires_promotion_is_legacys_rule` (`tests/unit/test_strategy_registry.py`): `requires_promotion` is false at `none` and true at `plan` and `trade`, never for a rule strategy; a row moved straight from `none` to `trade` starts on the binding's flag, and gets `STR-R16` with the flag false or the binding missing; the kernel admits the entry on one approved record (which names no authority) and refuses `ADM-R16` without one; and the guide states the rule. Red first (the guide's "per step"), then green. Two runs with `tests/integration/test_custody_promotion.py`: 102 passed each.
* **Break checks, both caught:** `plan` treated as not needing promotion; a one-step rule (`requires_promotion` only at `plan`, so a straight-to-`trade` row escapes).
* **Spec text to correct (left to the owner's spec pass, not edited here):** SLICE-17 line 40 ("Promotion later only to `plan`, then `trade`") and line 147 ("lowest authority first"). The strategies and research specs carry no such claim (grep). **Spec improvement, listed, not made:** one-step enforcement.

## Step 6 — units, the composed set and channel peers (outline; F-2)

**Decisions.**

* **A strategy host per strategy (A-8).**
  * `at-strategy-host@.service` with `ExecStart=__RELEASE__/venv/bin/at-strategy %i`.
  * `at-strategy-host@.timer` with `Unit=at-strategy-host@%i.service` in the template (finding 14).
  * One instance per enabled `strategies.registry` row: BuyerEdge (Q-005), and `ai_buyer_edge` under F-2 B or C when the owner's row exists.
  * `TIMERS`, `polkit_files` and SLICE-16's rows name the instances. The `at-strategy-host` prefix keeps clear of legacy's names.
* **`at-cognition.service`:**
  * user `at-cognition`, groups `at-channel` and `at-identity`;
  * the advisor key only, never `openalgo_*` (`install.py:240-241`);
  * paths from `read_write_paths("cognition")`; `Restart=on-failure`.
* **`at-mcp.service`** (built and tested; installed only under F-2 C): `…/venv/bin/python -m autonomous_trading mcp serve`, groups `at-ledger-readers` and `at-identity`, `MCP_CONFIG_FILE`, loopback, the read-only profile, and new `read_write_paths` and directory rows.
* **`at-console`:** deferred (it needs Node and an `operator_ui` build in the bundle). Recorded, not built.
* **`FIRST_RELEASE`** becomes the F-2 set. `sysusers`, `polkit_files` and `directory_table` already follow `composed` (`install.py:98-121`, `:257-276`). `KEY_HOLDER_UNITS` and the sudoers lines are unchanged.
* **Channel peers (finding 4).** Every composed caller of the kernel's and cognition's sockets needs a `channel` row (`parse_peers`):
  * `relays`: the operator;
  * `services`: each `at-strategy-host@<id>.service` as `strategy:<id>`, cognition as `cognition`, and the others that call (listed at deepening from `ROLE_OPS`).

  The uids exist only after `sysusers` runs on the host. **The deepening's recommendation:** the installer renders the `channel` section from the composed units and the uids it created at `apply-root`, as a release-owned file the profile includes. The alternative is that the owner binds it at 7.4 and `check` compares it with the composed units. Whether the loader supports an included fragment is **inferred** and checked at deepening. Either way, `check` refuses a composed channel caller with no row.

**Tests** (`tests/contracts/test_rendered_units.py`).

| Test | Proves |
|---|---|
| `test_strategy_host_unit_names_its_strategy` | Each instance's `exec_argv` ends with its id and passes `run`'s usage check; its timer names its own service |
| `test_check_with_each_rendered_environment` (changed) | The `strategy` skip at `:398-399` is removed |
| `test_cognition_unit_renders_without_broker_key` | No `openalgo_` credential; groups and paths from the contract |
| `test_mcp_unit_renders_read_only` | Loopback, read-only, no key, its rows |
| `test_first_release_is_the_owners_set` | `FIRST_RELEASE` equals F-2; the users, units and directory rows match |
| `test_channel_peers_name_every_instance` | Each `at-strategy-host@<id>.service` has a `services` row `strategy:<id>`; cognition and the operator rows exist; a missing one fails `check` |
| `test_buyer_edge_timing_unchanged_with_cognition_down` | With cognition installed and its socket absent, BuyerEdge's intent is admitted on the same pass as with `FailedReviews` |
| `test_key_holders` (existing, `:93`) | Unchanged |

**Break checks:** drop `%i`; the timer names the template; give cognition the broker credential; add `at-mcp` to `KEY_HOLDER_UNITS`; omit one instance's peer row.
**Files:** `deploy/systemd/`, `deploy/install.py`, `tests/contracts/test_rendered_units.py`, `tests/recovery/test_release_activation.py`, `docs/operations.md`. **Waiting rows:** R-6…R-8.

### Step 6 as built (2026-11-16)

OA_NEW `e397f37`. Under F-2 A: `FIRST_RELEASE` and `KEY_HOLDER_UNITS` unchanged.

* **Strategy instances (A-8).** The templates are `at-strategy-host@.service` (`ExecStart=…/at-strategy %i`) and `at-strategy-host@.timer` (`Unit=at-strategy-host@%i.service`). `render_release(strategies=…)` renders one `at-strategy-host@<id>.service` and timer per enabled `strategies.registry` row (`enabled_strategies`, from the profile), `%i` replaced. The render checks refuse an instance whose `ExecStart` does not end with its id, a timer naming another unit, a leftover `%i`, a non-registry id, and a release composing the strategy host with no enabled row. `PARTICIPANTS["strategy"].unit` is the template; `participant_of`, `polkit_files`, `validate_composition` and the convergence facts know instances. The start and stop orders, the restore set and the cutover's target units follow the installed instance files (`installed_strategies`), so they are functions of the host now (`start_order`, `stop_order`, `target_units`).
* **Channel peers (A-10), the plan's alternative.** The installer cannot render rows whose uids exist only after `sysusers`, and the loader's `extends` makes the profile's base the fragment, not an include; so the owner binds `channel` at 7.4 and `install.py check` refuses (`CFG-R10`) a composed caller with no row, another principal or, on the host (`pwd`), another uid (`channel_rows`, `channel_problems`). Rows: the operator relay; each instance as `strategy:<id>`; cognition when composed. The example documents the shape and leaves `channel` unbound.
* **Templates built, not composed:** `at-cognition.service` (advisor key only, `run/cognition`, on-failure 5 s) and `at-mcp.service` (no broker key; token mode's `mcp_tokens` credential; legacy's `Restart=always`, `RestartSec=5`; `MCP_CONFIG_FILE=<release>/current/profile/mcp.yaml`, loopback from its profile). New directory rows (`credentials/cognition`, `credentials/mcp`) and `read_write_paths("mcp")` appear only when composed. The polkit rule accepts an instance name, never the template.
* **Tests** (`tests/contracts/test_rendered_units.py`, 7 new; existing ones moved to instance names): `test_strategy_host_unit_names_its_strategy`, `test_strategy_instance_render_checks`, `test_cognition_unit_renders_without_broker_key`, `test_mcp_unit_renders_read_only`, `test_first_release_is_the_owners_set`, `test_channel_peers_name_every_instance`, `test_orders_follow_the_installed_instances`; `test_check_with_each_rendered_environment` no longer skips the strategy (`at-strategy buyer_edge --check` passes); `test_key_holders` unchanged. Run 1: `tests/recovery` with the render file and `test_validate_composition`, 504 passed, 4 skipped. Run 2: the render file, `test_release_activation`, `test_initial_cutover`, `test_validate_composition` and `test_example_profile`, 262 passed, 1 skipped.
* **Break checks, all caught:** drop `%i` (5 tests); the timer names the template (4); cognition given the broker key (1); `at-mcp` in `KEY_HOLDER_UNITS` (2); one instance's peer row omitted (1).
* **Deviations.** `at-console` has no template: its participant has no command (the console is a Next.js build needing Node), as the plan's outline says; the owner's F-2 note named it with the others. F-2 B's timing test is not built (F-2 A). Order: the code was drafted before the new tests, so their red was shown by the break checks, not by a first run.
* **Rows for SLICE-15's waiting list:** R-6 (now: each `at-strategy-host@<id>.timer` starts its own instance, and `install.py check` on the host compares each `channel` row's uid with `id -u` of its user), R-7 (cognition's unit as rendered, when a later release composes it) and R-8 (the polkit rule's instance names, evaluated by polkitd).

## Step 7 — owner ports in production (outline; F-4)

* **Inventory first.** At deepening, one table: for each `ROUTED` name (`api.py:159-172`) and `McpPorts` field, legacy's live use at 445eb116 and whether it is composed, mapped or refused.
* **F-4 A composes:**
  * **Advice.** `OwnerPorts.advice` is cognition's advice store, read by the operator. The kernel never opens a cognition-written file. Cognition publishes each advice record into the kernel's evidence store over its existing `publish` operation (`unix_channel.py:49`). The kernel's `AdmissionPorts.advice` (`bootstrap.py:1370`) reads `action` from that published record, so the kernel's own check (`admission.py:851`) reads only its own evidence. An `advice_apply` while kill is engaged or a hold covers the position follows the existing rules for closes; row checked below.
  * **Candidates.** `OwnerPorts.candidates` is `approval_binding` over the kernel's `promotion_verify`, **owner only**. Combined answers, "Promotion": approval is owner-only. Q-014's delegated grants cover kill exceptions, `kill_release`, `latch_unlock` and `pause_clear`, not approval. `promotion_verify` already refuses anyone but the owner, or the research service in automatic mode (`kernel/authority.py:709-718`).
  * **Reads.** The MCP and operator read ports over the ledger and store readers.
  * **`playbooks`** as today.
* **F-4 A maps** configuration, registry and policy writes and cognition config staging to `install.py stage`, with the reasoning in `docs/operations.md`, as SLICE-10 allows.
* **The cutover condition becomes a test.** SLICE-10's "no row may still answer `SEC-R22`" was to be checked at SLICE-14, which is void.

**Tests** (`tests/integration/test_operator_owner_ports.py`, new).

| Test | Proves |
|---|---|
| `test_production_operator_composes_or_maps_every_owner_port` | Every field is composed, or mapped with a reason |
| `test_production_mcp_observe_tools_answer` | No `observe` tool answers `SEC-R22` |
| `test_advice_apply_reaches_admission` | An applied advice is a `CloseRequest`, checked against the published `action` |
| `test_advice_apply_under_kill_and_hold` | Under kill and under a hold it behaves as the same owner close does |
| `test_candidate_approval_is_owner_only` | A delegated human with any grant is refused `SES-R13`; the owner's approval commits |

**Break checks:** drop `advice` from the composition; a mapped name with no reason; let a delegated principal approve; the kernel reads cognition's records directory.
**Files:** `interfaces/api.py`, `interfaces/mcp.py`, `bootstrap.py`, `cognition/advice.py` (publish), new port adapters beside their owners, `docs/operations.md`. **Waiting rows:** R-9.

### Step 7 as built (2026-11-16)

Built in two parts: `49cff2f` on `slice-18b` (the mapping and the owner-only guard), then `48c21bf` on `agentic-desk` after the merge (the kernel's advice port). Candidate approval and the reads are **not built**: each needs a decision the plan does not settle (below).

* **The mapping (`49cff2f`).** `interfaces/api.py`: `STAGE_REASON`; `STAGED_NAMES` (every `strategies` and `configuration` routed name, and `ai.config.*`, `ai.blueprint.*`, `ai.exit-blueprint.*`); `StagedRelease` answers each staged name `{"ok": false, "status": "mapped", "mapped_to": "deploy/install.py stage", "reason": …}`, every other name and its reads `SEC-R22`; `production_owner_ports()`, which `serve` composes; `ROUTED_WAITING` (each routed name still `SEC-R22`, with its reason) and `PRODUCTION_OWNER_PORTS` (every `OwnerPorts` field composed, mapped or waiting, with a reason). `build_call` takes the door's `owner` and refuses `candidate_approve` from anyone else `SES-R13 owner_only` before the port is asked or a request minted. Tests (`tests/integration/test_operator_owner_ports.py`, 4): `test_production_operator_composes_or_maps_every_owner_port`, `test_every_staged_name_is_an_edit_of_configuration_registry_policy_or_cognition_config`, `test_a_staged_write_answers_through_the_door`, `test_candidate_approval_is_owner_only`. Runs as step 4's. Break checks (3, caught): a delegate may approve; a waiting row with no reason; `serve` composing bare `OwnerPorts`.
* **The kernel's advice port (`48c21bf`; the evidence-ref design was decided by the orchestrating session, not the owner).** The advice application carries the digest of the advice record beside its advice id; the kernel resolves that digest from its **own** evidence store, and admits only when the record is `kind: exit_advice` of that advice id and account and its `action_wire` is the request's; anything else, no digest included, is `SEC-R09`. It never opens a file cognition wrote.
  * `cognition/advice.py`: `generate` publishes `published_advice(advice, position, action_wire)` through its `publish` hook (cognition's channel operation) and keeps the digest in the record (`evidence_ref`); `AdviceBook.evidence_ref(advice_id)`; CLOSE_STRUCTURE's request built once (`_close`) for both the published action and the application. `AdviceBook.action` (the old in-process port that read cognition's records) is removed.
  * `kernel/admission.py`: `PublishedAdvice(evidence, clock)`; `human_args` (the bound arguments, with `evidence` only when present, so requests without one keep their digests); `admit(..., evidence=)` and `_human` pass it to the port. `Coordinator.admit_action(..., evidence=)`. `adapters/unix_channel.py`: `advice_apply` accepts an optional string `evidence`. `interfaces/api.py`: the call carries `evidence` when the advice port answers `evidence_ref`. `bootstrap._compose_production_kernel` composes `advice=PublishedAdvice(EvidenceStore(evidence_root(s.ledger_path), clock), clock)`.
  * Kill and hold unchanged: under kill an advice application is `SEC-R20` while the owner's close is admitted (legacy; the security spec's row 9); under a hold both are admitted.
  * `PRODUCTION_OWNER_PORTS["advice"]` stays **waiting**, reason rewritten: the operator's side reads cognition's advice records, and the first release installs no cognition (F-2 A).
  * **Tests.** `tests/integration/test_operator_owner_ports.py`, 6 new: `test_advice_apply_reaches_admission` (7 refusals: no digest, unknown digest, another advice's, another account's, another position account, another kind, another action; then the good one admitted with `args.evidence` recorded), `test_the_kernel_advice_port_reads_only_its_own_evidence`, `test_advice_apply_under_kill_and_hold` ×4. `tests/integration/test_review_producer.py::test_advice_is_record_only_and_applied_by_a_human_once` now runs generation → publish → application → the kernel's `PublishedAdvice` (no digest `SEC-R09`; with it admitted). `FixtureAdvice.action` takes `evidence=None`.
  * **Break checks (6, caught, restored):** another advice's record accepted; another account's accepted (first missed, masked by the action comparison; a position-account case added, then caught); another kind accepted; the operator drops the digest; production composes no advice port (first missed, the test matched the import line; tightened to the composition, then caught); generation does not publish.
* **Candidate approval: stopped for a decision.** The route (legacy's `/strategies/{strategy}/candidate-activation/approve`, fields `candidate_digest`, `profile_version`, `profile_digest`, `reason`) expects `approval_binding` to return a `StandingBinding` it authorizes (`binding_authorize`). The plan says "over `promotion_verify`", which needs `binding_id`, `CandidateId` and the `PROMOTION_RECORDED` digest, returns no binding, and is not reachable through the channel today. Legacy's candidate activation approved an advisor/research-policy candidate with a profile tuple, which the new system has no counterpart for. Options: **A.** A new owner door `promotion_approve` (CLI and API) with `binding_id`, `candidate_id`, `record_digest`, `reason`, sent to the kernel's `promotion_verify` (already owner-only on the owner credential), and legacy's candidate-activation route answering "mapped" to it; **B.** keep the legacy route's fields and have the operator resolve strategy → the registry's `CandidateId` (must equal `candidate_digest`), the one binding holding it and that binding's latest `PROMOTION_RECORDED` digest, ignoring the profile pair; **C.** leave it waiting (`SEC-R22`, reason written). Recommendation **A**: it names exactly what the kernel approves and guesses nothing; B picks a record silently.
* **Reads: stopped for a decision.** Legacy's reads delegate to whole subsystems (`strategy_registry.listing()`, `settings.grouped()` with provenance and `.env` sources, the dated decision journals; `src/interfaces/console/routes.py:378-420`, `:521-545`, `api/routes/strategies.py` @445eb116), and the console consumes their shapes. Cognition, research and market reads have no data source in the first release (F-2 A), and the MCP gateway (115 `observe` tools) is not installed (F-2 A). Options: **A.** A deepened step that ports the routed reads whose sources exist in the first release, in legacy's shapes (`strategies`: registry rows, config, decisions from the profile and the strategy-host store; `configuration`: settings, config, system, deployment, governance from the effective profile, masked), with the rest written down as waiting; the MCP tools wait for the release that composes `at-mcp`; **B.** only the configuration reads first; **C.** all reads stay `SEC-R22`, each with its reason, for day one (the kernel reads `/positions`, `/orders`, `/commands`, `/kill`, `/holds`, `/alerts` are already composed). Recommendation **A**, as its own step with its own review.
* **Rows:** R-9, narrowed: a mapped write from the CLI and API answers the staging reason; candidate approval refused for a delegate; an advice application end to end once a release composes cognition.

## Step 8 — parity without legacy running (outline; F-6)

**Decisions.**

* **Legacy is never installed or run as a service** (owner, 2026-11-13). Its pure code runs offline from a `git archive 445eb116` export in an isolated `python -I` process (BuyerEdge's scorer, `plan()`, `plan_structure()`, `PremiumTrail`), as the `gen_*_parity.py` generators already do.
* **`compare_parity.py` modes** over one recorded day directory:
  * `strategy` (PRF-STR-10): each bar's decision, field by field;
  * `planner` (PRF-ADM-07): each admitted intent's plan, excluding SLICE-04's listed corrections by name;
  * `ladder` (PRF-PRT-08): stop and target per bar.

  Each report names the commit pair, the day, the label and every difference.
* **PC run (partial).** The five converted August days, labelled `converted-simulation, not legacy-comparable`. They cannot prove spread checks (no bid/ask), tick-bar behaviour (history bars, SLICE-15 D-4), expiry on 3–4 August (`possible-wrong-expiry`) or lot size (`lot_size_out_of_period`). Differences in those areas are reported, not failed.
* **Server run (full).** Each analyze-session day (with bid/ask and ticks) is exported read-only to an isolated checkout (`~/at-dev`, or this PC on the owner's word), and the three modes run there. Under F-6 A the report goes to the owner before the live switch. No code reads it.

**Tests** (`tests/unit/test_compare_parity_modes.py`, new).

| Test | Proves |
|---|---|
| `test_strategy_mode_on_golden_stretch` | The mode reproduces the 30-Oct walk's 40 equal bars |
| `test_planner_mode_on_golden_cases` | The 57 planner cases agree through the mode |
| `test_ladder_mode_on_trail_golden` | The trail golden agrees through the mode |
| `test_listed_corrections_only` | A difference outside the list fails; one inside is reported |

Plus a by-hand run over the five August days, with its run time.

**Break checks:** perturb one score weight in the target copy; drop a listed correction; compare the latest heads instead of the pinned pair.
**Files:** `scripts/compare_parity.py`, `operations/parity.py` (new), the test file, `docs/operations.md`. **Waiting rows:** R-10.

* **Owner answers (2026-11-16) on the two stops above.** Candidate approval is built with the AI service (no model strategy runs in the first release, F-2 A; a rule strategy never needs promotion, `registry.requires_promotion`). The legacy console's strategy and settings reads are ported with the console; day-one checks work from `at`. Both stay SEC-R22 with their reasons ([owner answers](../../decisions/owner-answers-2026-10-27.md#slice-18-server-readiness-choices-2026-11-16)).

### Step 8 as built (2026-11-16)

OA_NEW `3f6c920`. Under the owner's F-6 answer: no August-days run; the golden tests now; the modes run on each analyze-session day.

* **`operations/parity.py`:** each mode's row form (`strategy` a bar's decision, `planner` an intent's plan or refusal, `ladder` a trail cycle and its state), `compare` field by field, the listed corrections by name (`unscored_tag` for `strategy`; `lot_size_stage` and `q020_structure_refused` for `planner`; none for `ladder`), `report` (proof, day, label, pinned commit pair, every difference; a branch name or `HEAD` refuses), `export_legacy` (`git archive <commit> src`, extracted, never installed) and `run_legacy` (an isolated `python -I` child).
* **`scripts/legacy_parity_driver.py`:** the child. `ladder` runs legacy's `trail.py` through `gen_trail_parity.run`; `planner` runs legacy's `plan()`/`plan_structure()` through the planner generator's own converters (its source, embedded in the fixture, executed up to its output step).
* **`scripts/compare_parity.py`:** `ladder`, `planner`, `strategy` beside `shadow`; exit 0 pass, 1 a difference outside the list, 2 a refusal. `strategy`'s legacy side is `gen_buyer_edge_parity.py`'s walk (`--walk` picks one).

  > **Owner amendment, 20 November 2026 (D-015).** The `shadow` mode was removed in `d0133c5`; `scripts/compare_parity.py` has the three modes only.

* **Tests** (`tests/unit/test_compare_parity_modes.py`, 10): the 30-October walk, 40 bars, no failing difference (the target's `unscored` tag reported as a correction); the 57 planner cases, none failing (lot-size stage and Q-020 structure refusals reported); every trail-golden cycle identical; listed corrections only; the commit pair pinned (4 cases); the CLI over recorded legacy output; and legacy's own ladder (4 cases) and planner (5 cases) from a real `git archive 445eb116` export in an isolated child, reproducing the goldens (runs when the legacy repository is beside OA_NEW, else skips). Three runs: 10 passed each (the third with `test_protection_states`, 67 passed).
* **Break checks, all caught:** a score weight in the target copy (`slow_disagree_weight` 0.5 → 0.6: the strategy test); `lot_size_stage` dropped (2 tests); the pinned-commit check removed (4 tests).
* **Not built (deviation):** reading a recorded day directory into each mode's cases and target rows. No analyze-session day exists in the new system's format to build it against; the modes take cases and target rows as files, and the reader is built from the first day. Until then R-10 cannot run end to end.
* **Rows for SLICE-15's waiting list:** R-10, preceded by a new row: build the day reader from the first analyze-session day (the target's market store, ledger and strategy-host store, read-only in an isolated checkout), then run the three modes and give the reports to the owner before 7.7.

---

### After the merge (2026-11-16)

`slice-18b` (steps 3, 4, 7-partial) merged into `agentic-desk` at `9b05d6f`, then three commits on `agentic-desk`, not pushed.

* **The merged tree, before any change.** `tests/contracts` in its own process (its import guards run `python -I` against the main checkout, so they count here): 538 passed, 5 skipped. The touched suites (`tests/recovery`, custody promotion, operator owner ports, dispatch revalidation, kernel host, MCP surface, operator commands and routes, owner API, protection kernel, twin proposals, unix channel, operator authorization, protection basket and loop, safety matrix, secret references, settings resolver, compare-parity modes, example profile, strategy registry): 1098 passed, 15 skipped. No merge breakage.
* **F-7a (`eed4425`; owner, 2026-11-16).** `coordinator.exit_cancel(writer, cmd, order)`: a `kernel:protection` cancel keyed `prot:<position>:<role>:<n>`, admitted after that position's `EXIT_STARTED` (`protection_state.exit_sequence`), of an order of that position (the claim's target). The claim path asks `lease_gate(account, protective=lease_protective(cmd) or exit_cancel(...))`, so the exit's own cancel is claimed while `lease_clock < confirmed_until`, as F-7 B's sends; an orphan or sibling cancel, one admitted before the exit, or anyone else's keeps the strict rule; entries and owner actions unchanged. `KERNEL_PROTECTIVE_VERBS` is unchanged. Tests (`tests/unit/test_protection_loop.py`, 3): `test_square_off_with_a_live_stop_goes_through_an_outage_before_confirmed_until` (the cancel, then the close, claimed during the outage), `test_square_off_cancel_waits_once_the_lease_may_have_changed_hands` (waits after `confirmed_until`; goes when the store answers), `test_only_a_cancel_of_its_own_started_exit_is_protective`. Red first (the cancel stayed `ADMITTED`; the helper was first wrong: the renewal was not yet due, so no failure had happened, fixed to wait for the first failed renewal). Break checks (4, caught): any `prot:` cancel of an exiting position; the claim path not asking `exit_cancel`; another position's order; a protective send ignoring `confirmed_until`.
* **Merge leftovers (`8d8c2ab`).** (a) `deploy/install.py` `_lease_store(host, eff, *, write=False)`: with an `s3:` location its reads (`check`'s reasons, the boundary's lease heads) open the store through `operations.backup.lease_view` with `lease_store/read_credential` resolved from the backup's credentials directory; `continue-legacy`'s release (`write=True`) still needs the kernel's token and is refused without it. (b) `lease_credentials(participant, lease_store)`: with an `s3:` location `render_release(lease_store=…)` renders `LoadCredential=lease_store_credential:…/credentials/kernel/…` into the kernel's unit and `LoadCredential=lease_store_read_credential:…/credentials/backup/…` into the backup's, and the directory row `credentials/backup` (root, 0700); `_render_for` and `render` pass the profile's location; nothing changes for any other location. The kernel's line was not in the brief: without it an `s3:` kernel whose token is a `credential` reference cannot start, so it is the same leftover. `KEY_HOLDER_UNITS` and the backup's `credential_scopes` are unchanged. Tests: `tests/contracts/test_rendered_units.py::test_lease_tokens_load_only_under_an_object_store`, `tests/recovery/test_lease_failures.py::test_the_installer_reads_an_object_store_with_the_read_token`. Break checks (3 caught, 1 not): every unit loads the read token; tokens loaded whatever the location; the installer reads `s3:` the old way (refused without the kernel's token). Not caught: `continue-legacy` passing through the read view (no test reaches it; it would fail safe on `PermissionError`). Also closed: the guide's "(P-7)" sentence (step 4's leftover).

  > **Owner amendment, 20 November 2026 (D-015).** `continue-legacy` was removed in `d0133c5`, so nothing asks `_lease_store` for a writable store now (`deploy/install.py`).

* **Correction (2026-11-17, `3aec1a4`).** (a) above read the token from root's `credentials/backup` (0700), which at-installer, who runs `activate`, cannot traverse, and which exists only when the backup is composed (the owner deferred it). Owner chose an installer-owned location: `INSTALLER_CREDENTIALS = /etc/autonomous-trading/installer-credentials` (at-installer, 0700), a directory row for any `s3:` location; the backup unit still loads its own copy from `credentials/backup`. Tests: `test_the_installer_holds_its_own_lease_read_token_without_the_backup` (new), the two above updated. Break check: reading the backup's directory again fails `test_the_installer_reads_an_object_store_with_the_read_token`.
* **Step 7's advice port (`48c21bf`)**: above, under Step 7 as built.
* **Each piece's runs.** Run 1 (all three pieces together: protection loop, basket, states and kernel, lease failures, dispatch revalidation, safety matrix, rendered units, installed artifact, capabilities, release activation, initial cutover, operator owner ports and routes, review producer, unix channel, owner API, operator commands and authorization, authority grants, MCP surface, secret references, settings resolver): 1058 passed, 16 skipped. Run 2 (protection loop, lease failures, dispatch revalidation, rendered units, operator owner ports and routes, review producer, unix channel, safety matrix, strategy registry): 393 passed, 10 skipped. Every edited `.py` file parsed with `ast.parse`; line endings LF, as the files were. Order: F-7a, the render test and the kernel's advice side were red first; the installer's read path and the cognition publish were drafted before their tests, so their red was shown by break checks.
* **Rows for SLICE-15's waiting list from SLICE-18 (the full set).**
  * R-1: the F-1 provider checked at the source on the real bucket. A stale `If-Match` and `If-None-Match: *` on an existing key both answer 412 (the stale `If-Match` inferred from the docs); a 2xx is durable; a `GET` right after a `PUT` returns the new body and ETag; the `Date` header is present (not stated in R2's docs). Recorded before the bucket is bound. **18 Nov 2026:** the desk check is in [R-1 desk check at the source](#r-1-desk-check-at-the-source-2026-11-16-before-step-3s-code) (16 Nov); confirmation on the real bucket is not recorded.
  * R-2: two processes on the server race `cas` on the real bucket: one winner; an isolated second checkout reads the lease; `now()` is the bucket's.
  * R-3: over at least one full session on the real bucket, the round trip and the failure rate (timeouts, 5xx, lost replies per hour), for `recovery.lease_secs`, `recovery.lease_renew_secs` and F-7; bound in 7.4 with `recovery.lease_store`. **Done 18 Nov 2026** on the bound R2 bucket: 774 rounds, 772 ok, two 5 s timeouts (11:08 and 11:10, not back to back) and one lost reply at 14:45 (the write landed; the next renewal adopted it), no R2 5xx; p95 write 1.78 s, read 0.56 s. Bound: `lease_secs` 120, `lease_renew_secs` 20.
  * R-4: a kernel restart under systemd over the real bucket (`wait_for_lease`, the routine advance, `clean` release); the bucket blocked at start: the kernel stays up, retries and advances when unblocked, without using up `StartLimitBurst`. Added: the rendered kernel and backup units load their lease tokens (`LoadCredential`) and the backup records lease heads through `lease_store/read_credential`; `install.py check` reads the lease with the read token; the bucket blocked mid-session in an analyze session: the kernel's stop modify, trail move, square-off close and the exit's own cancel go until `confirmed_until`, entries wait (F-7 B, F-7a). **Owner amendment, 18 Nov 2026 (D-007):** a restart after the open ends that day. R-4's routine advance holds, but entries stay refused `SES-R07`.
  * R-5: `promotion_flag` over the real kernel socket with `SO_PEERCRED`; a strategy may ask only under its own name.
  * R-6: each `at-strategy-host@<id>.timer` starts its own instance (BuyerEdge runs, no usage exit); `install.py check` on the host compares each `channel` row's uid with `id -u` of its user. **18 Nov 2026:** the 09:00 start failed on the `evidence/` folder's permission, fixed in OA_NEW `452790c`; after activation the instance started through `OnActiveSec=1s` (D-009). The first 09:00 start after the fix is 19 Nov. **19 Nov 2026:** the 09:00 IST timer start ran (journal 03:30:01 UTC).
  * R-7: `at-cognition.service` as rendered, as a real system user, when a later release composes it: no broker key; `review.sock` reachable by `at-channel` members, a non-peer refused `SEC-R12`.
  * R-8: the installer's polkit rule, evaluated by polkitd, for the instance and cognition unit names.
  * R-9: from the operator's CLI and API on the server: a mapped write answers the staging reason; candidate approval refused for a delegate; one advice applied in an analyze session once a release composes cognition.
  * R-10a (new, before R-10): build step 8's day reader from the first analyze-session day (the target's market store, ledger and strategy-host store, read-only, in an isolated checkout).
  * R-10: after each analyze session, export the day, run the three `compare_parity.py` modes, and give the reports to the owner before 7.7.
* **Candidate approval and the reads:** answered 2026-11-16 (above).

---

## Rows for SLICE-15's waiting list

These are added to SLICE-15 when each step is recorded "as built".

| Row | From |
|---|---|
| R-1 The F-1 provider checked at the source. A stale `If-Match` and `If-None-Match: *` on an existing key both answer 412. A 2xx is durable. A `GET` right after a `PUT` returns the new body and ETag (read-after-write). The `Date` header is present. Recorded before the bucket is bound. **18 Nov 2026:** the desk check is in [R-1 desk check at the source](#r-1-desk-check-at-the-source-2026-11-16-before-step-3s-code) (16 Nov); confirmation on the real bucket is not recorded. | Step 3 |
| R-2 Two processes on the server race `cas` on the real bucket: one winner. An isolated second checkout reads the lease. `now()` is the bucket's | Step 3 |
| R-3 Over at least one full session on the real bucket, measure the round trip and the **failure rate** (timeouts, 5xx, lost replies per hour), for `recovery.lease_secs` and `recovery.lease_renew_secs` (TASK-S11-07) and for F-7. Bound in 7.4 with `recovery.lease_store`. **Done 18 Nov 2026** on the bound R2 bucket: 774 rounds, 772 ok, two 5 s timeouts (11:08 and 11:10, not back to back) and one lost reply at 14:45 (the write landed; the next renewal adopted it), no R2 5xx; p95 write 1.78 s, read 0.56 s. Bound: `lease_secs` 120, `lease_renew_secs` 20. | Step 3 |
| R-4 A kernel restart under systemd over the real bucket: `wait_for_lease`, the routine advance (Q-009), `clean` release. The bucket blocked at start: the kernel stays up, retries and advances when unblocked, without using up `StartLimitBurst`. **Owner amendment, 18 Nov 2026 (D-007):** a restart after the open ends that day. R-4's routine advance holds, but entries stay refused `SES-R07`. | Step 3 (joins SLICE-16 R1/R2's row) |
| R-5 `promotion_flag` over the real kernel socket with `SO_PEERCRED`: a strategy may ask only under its own name | Step 4 |
| R-6 `at-strategy-host@buyer_edge.timer` starts its service, BuyerEdge runs, no usage exit. A second instance for the twin under F-2 B, each admitted by its own peer row. **18 Nov 2026:** the 09:00 start failed on the `evidence/` folder's permission, fixed in OA_NEW `452790c`; after activation the instance started through `OnActiveSec=1s` (D-009). The first 09:00 start after the fix is 19 Nov. **19 Nov 2026:** the 09:00 IST timer start ran (journal 03:30:01 UTC). | Step 6 |
| R-7 `at-cognition.service` as a real system user: no broker key in its environment or credentials. `review.sock` is reachable by members of `at-channel` (`run/cognition` 2750, `install.py:116`); only the peer check admits a caller, so a non-peer `at-channel` member is refused `SEC-R12` | Step 6 |
| R-8 The installer's polkit rule, evaluated by polkitd, for the instance and cognition unit names | Step 6 |
| R-9 From the operator's CLI and API on the server: apply one advice in an analyze session; candidate approval by the owner and refused for a delegate; every owner route read, none `SEC-R22` unless mapped | Step 7 |
| R-10 After each analyze session (7.6): export the day, run the three `compare_parity.py` modes, and give the reports to the owner before 7.7 | Step 8 |

## Noticed, not planned

* **Unbound fields that are not answers.** Beyond the answered fields, the kernel's required set still includes measured or owner-only fields:
  * deadlines, `max_pending`, timeouts, clock skew, working escalation, the observation rate;
  * `money.rounding` ("no production value", `defaults.yaml:64`) and the `interfaces.*` lifetimes;
  * the kernel's production additions `accounts` and `openalgo.base_url` (`operations/deployment.py:368`);
  * the strategy host's `strategies.host.*` and the supervisor's four values.

  These are SLICE-15 step 7.4's "measured values the owner approves". Bound provisionally 18 Nov 2026; dispatch, queue and reconciliation timings still unmeasured.
* **Cognition's three settings** (`schema.py:562-565`) need binding under F-2 B, as SLICE-09 asks. Any real budget cap refuses (SLICE-17 P-1).
* **`market.source.backfill_on_start`** has no setting (step 2 records it). Behaviour is today's: no backfill.

## Review applied (2026-11-16)

A fresh reviewer's 14 findings were each re-opened in the code and accepted:

| Findings | Where the plan now handles them |
|---|---|
| 1, 2 | Step 3, F-7 |
| 3 | Step 4 design (b) |
| 4 | Step 6 peers, A-10 |
| 5, 6 | Step 2, F-5 |
| 7 | F-2 B, step 6 timing test |
| 8 | Step 3 credentials, `now()`, R-1 |
| 9 | Step 7 |
| 10 | Step 2, A-11 |
| 11 | Step 5 is decided |
| 12 | F-1 narrowed, A-1 wording |
| 13 | Citations |
| 14 | Step 6 timer, R-7 |

Correction to the reviewer's finding 8: the backup does accept leases (`scheduled(..., leases=)`, `operations/backup.py:549-555`); its `main` passes none. So step 3 composes them rather than dropping the token.

## Completion conditions

* Steps 2–8 are built, tested twice and break-checked, each recorded "as built" here.
* Each owner fork is answered or recorded as waiting. A step blocked by a waiting fork is recorded as blocked, not built on a guess.
* `lease_store_for` accepts a production object store and still refuses a directory. An ambiguous write never stops the kernel. An unreachable store at start never crash-loops it.
* No production participant reaches `STR-R16`, `SEC-R22`, `SEC-R12` or `EXIT_USAGE` through a wiring gap. Any that remains is the owner's choice, with its reason written down.
* The example profile passes `test_example_binds_every_owner_answer`, and the market host's only unbound fields are deployment values.
* Per F-6: no August run; the three modes run on each analyze-session day (R-10).
* Rows R-1…R-10 are added to SLICE-15's waiting list.
* No score, threshold, entry gate or money value was set or changed.
