# SLICE-18 — Server readiness: what the new server needs before its first install

* **Status:** planned 2026-11-16 and revised the same day after a fresh review (14 findings, all accepted; see [Review applied](#review-applied-2026-11-16)). Nothing is built yet. Step 1 (the audit) is this file's [Step 1 — audit](#step-1--audit-as-found). Steps 2–8 are outlines in the standing rules' sense: each step's exact detail (signatures, test tables, break checks) is written just before it is built, reviewed by two fresh EGM reviewers, built, run twice with the targeted tests, break-checked and recorded "as built".
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
  * Server lost: start fresh (2026-11-13; backup on B2 or R2 through restic);
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
| A-8 | The strategy unit names no strategy | `deploy/systemd/at-strategy-host.service:20`, `.timer:9`; `bootstrap.py:928-930` | `ExecStart=…/at-strategy` has no argument, so `run` exits `EXIT_USAGE`. The check test skips the strategy unit (`tests/contracts/test_rendered_units.py:398-399`). The timer names `Unit=at-strategy-host.service`. |
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

## Step 3 — the production send-lease store (outline; F-1, F-7)

**Decisions** (for F-1 A; B uses the same adapter if B2 passes R-1).

* **`ObjectStoreLeaseStore`** in `adapters/lease_store.py` (T-90). It speaks the S3 API over HTTPS. The deepening chooses a standard-library SigV4 signer or a pinned client in `requirements.lock`.
  * It uses **its own bucket**, never the restic bucket, with its own tokens: a read-write token for the kernel, a read-only token for the backup.
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

## Step 5 — promotion steps (outline; decided)

* Correct `docs/operations.md:190`, SLICE-17 lines 40 and 147, and the strategies spec to legacy's rule. A model strategy whose row is above `none` needs an approved `PromotionRecord` for its exact `CandidateId` in the session's binding. The owner sets the row's authority.
* Add `test_requires_promotion_is_legacys_rule` (`tests/unit/test_strategy_registry.py`): a row moved straight from `none` to `trade` with an approved record starts, and without one it gets `STR-R16`.
* **Break:** treat `plan` as not needing promotion.
* **Spec improvement, listed and not made:** one-step enforcement.
* **Files:** `docs/operations.md`, `tests/unit/test_strategy_registry.py`, and the spec text above (spec repository). **Waiting rows:** none.

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

---

## Rows for SLICE-15's waiting list

These are added to SLICE-15 when each step is recorded "as built".

| Row | From |
|---|---|
| R-1 The F-1 provider checked at the source. A stale `If-Match` and `If-None-Match: *` on an existing key both answer 412. A 2xx is durable. A `GET` right after a `PUT` returns the new body and ETag (read-after-write). The `Date` header is present. Recorded before the bucket is bound | Step 3 |
| R-2 Two processes on the server race `cas` on the real bucket: one winner. An isolated second checkout reads the lease. `now()` is the bucket's | Step 3 |
| R-3 Over at least one full session on the real bucket, measure the round trip and the **failure rate** (timeouts, 5xx, lost replies per hour), for `recovery.lease_secs` and `recovery.lease_renew_secs` (TASK-S11-07) and for F-7. Bound in 7.4 with `recovery.lease_store` | Step 3 |
| R-4 A kernel restart under systemd over the real bucket: `wait_for_lease`, the routine advance (Q-009), `clean` release. The bucket blocked at start: the kernel stays up, retries and advances when unblocked, without using up `StartLimitBurst` | Step 3 (joins SLICE-16 R1/R2's row) |
| R-5 `promotion_flag` over the real kernel socket with `SO_PEERCRED`: a strategy may ask only under its own name | Step 4 |
| R-6 `at-strategy-host@buyer_edge.timer` starts its service, BuyerEdge runs, no usage exit. A second instance for the twin under F-2 B, each admitted by its own peer row | Step 6 |
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

  These are SLICE-15 step 7.4's "measured values the owner approves".
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
* The August partial parity reports are written with their labels.
* Rows R-1…R-10 are added to SLICE-15's waiting list.
* No score, threshold, entry gate or money value was set or changed.
