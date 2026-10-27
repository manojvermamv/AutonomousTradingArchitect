# SLICE-05 — Dispatch, conflicts and scheduling

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-05-review-2026-10-27)). Step 1 is built (OA_NEW `6f49827` on `slice-05`; [Step 1 as built](#step-1-as-built)). Steps 2 and 3 are deepened next, as SLICE-04's later steps were (the delivery plan's depth rule).
* **Precedence:** the master README, then the ROADMAP, then this package. The authorities are the [dispatch spec](../../design/dispatch-and-coordination.md), the [protection spec](../../design/protection-and-safety.md) (kill and holds, the permission matrix, the conflict relation) and the [ledger spec](../../design/ledger-and-atomic-transaction.md) (the identity rule's retry branch, verb completion). Every deviation is marked **Deviation**. No score, threshold or money value is set: every refusing setting is bound only to labelled synthetic or owner-answered values in tests.
* **Phase:** master Phase 1 (D13 revalidation, A03-F1/F2/F3, ATA-04; kill and hold events, POL-002 and POL-003). Class S. Disarmed: the simulated broker only.
* **Builds on:** [SLICE-04](SLICE-04-intent-to-admission.md) as built; branch `slice-05` cut from `slice-04` (OA_NEW `36717dc`).
* **Owner answers applied:** Q-001 (`safety.hold_automatic_actions: allowed`), Q-004 (`protective_independence: same_group_only`; the fixed admission-order rule; `coordinator.busy_applies_to: entries_only`), Q-011 (`dispatch.deadline_ms_<verb>`, synthetic here), Q-014 (the owner and delegated human principals holding the named grant), Q-017 (conflict row 1 also counts a protective order not observed terminal).
* **Tasks and proofs:** step 1 is TASK-S05-03 and TASK-S05-07 (PRF-PRT-04's kill and hold rows, PRF-PRT-11); step 2 is TASK-S05-01, -02, -04, -06, -08, -09 (PRF-DSP-01, -03, -05…-08, -10, -11, and PRF-DSP-04's conflict half); step 3 is TASK-S05-05 (PRF-LED-16 for cancel, modify and close).

**Excluded, and where each part arrives:**

* **SLICE-06:** the daily-loss latch and its matrix row; the `SAFETY_CHECK_STATE` record, and with it PRF-DSP-04's inert half (no check can be inert before the latch exists); the recovery and protection holds (`recovery`, `overclose`, `sibling_failed`); PRF-PRT-04's F-P12, F-P14, F-P20 and ratchet clauses.
* **SLICE-07:** the observation loop; the real `positions` side of the holdings port (the `position` table); conflict terminality bound to durable ledger facts (below); dispatch row 6 against live observations; the OpenAlgo adapter and its total-deadline proof.
* **Step 3 of this slice:** the real `order` and `orders` side of the holdings port (`broker_identity` joined to `command_identity`), as SLICE-04 step 2 planned, together with capacity's `protective_order_ids`, because step 3 is when the kernel first dispatches closes that create orders.

## Step 1 — kernel safety: kill, holds and the conflict relation

### What legacy does, and what that decides

* **Kill.** Legacy's send boundary reads one table on every call (`src/core/framework/execution/sender.py:281-296` @445eb116): under kill an entry and a modify are refused, and a cancel or close passes only with an owner command for exactly that action, strategy and broker order ID. The switch is a flag or a file (`execution/killswitch.py:58-100`). The target records it as `KILL_ENGAGED` / `KILL_RELEASED` in the ledger (POL-002). The [Q-014 answer](../../decisions/owner-answers-2026-10-27.md) widens "the owner" to a delegated human principal holding the named grant.
* **"Owned unfilled order" (TASK-S05-07, characterized).** Under kill, legacy's gateway reads the broker's order book first, and the order must still be "resting and unfilled" (`src/runtime/execution_gateway/__init__.py:1180-1182`). `_resting_refusal` (`:1702-1730`) refuses an order that is missing from the book or finished. It also refuses one whose `pending_quantity` is known and ≤ 0. An order with an unknown pending quantity passes. Parity: under kill a human principal may cancel an owned order that is **open** in the observation (B2) and, when its filled quantity is known, has **remaining quantity above 0**. A partly filled order with quantity still pending qualifies; cancelling it only stops further fills.
* **Holds.** A recovery hold refuses a held strategy's entries and leaves its automatic cancels, closes and stop moves working (`sender.py:294-297`). The [Q-001 answer](../../decisions/owner-answers-2026-10-27.md) keeps that: `safety.hold_automatic_actions: allowed`. Step 1 builds the `operator` hold; the `recovery`, `overclose` and `sibling_failed` triggers are SLICE-06's.
* **Conflicts.** Legacy has no conflict relation: one process-global lock serialized every send, and scope scanning stood in for a rule (LD-02, LD-08). The target's relation is the protection spec's five rows, owned by `kernel.safety` (ATA-04).

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/resources/migrations/004_safety.sql` | New: the `safety_state` table (tree delta **T-27**, as T-24 and T-25) |
| `src/autonomous_trading/kernel/ledger/schema.py`, `store.py`, `projections.py` | Migration 4; the safety kinds in family `safety`; `_PK["safety_state"]`; their touched-row loading and fold rules; `safety_state` in `TABLES`; a store read `unresolved_commands(account)` |
| `src/autonomous_trading/resources/events.schema.json` | `KILL_ENGAGED`, `KILL_RELEASED`, `HOLD_ENGAGED`, `HOLD_RELEASED` |
| `src/autonomous_trading/contracts/execution.py` | `ActionFacts.remaining: int \| None = None` (TASK-S05-07's pending quantity) |
| `src/autonomous_trading/kernel/safety.py` | New (in the tree): `Safety` (kill and holds; the matrix's kill and hold rows) and `Conflicts` (the five rows) |
| `src/autonomous_trading/kernel/ports.py` | `HoldingsPort.positions(account)` and `orders(account)`; `ConflictPort.check(facts, *, observation, own_command_key=None)`; `AdmissionPorts.safety` and `.conflicts` typed `… \| None`; the docstring's binding slices corrected |
| `src/autonomous_trading/kernel/admission.py` | `action_facts` sets `remaining`; A4, B:A4 and B3 call the composed `Safety` and `Conflicts` unless the ports override them; B3 passes the observation B1 judged |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `hold_automatic_actions` and `protective_independence` (refusing) |
| `src/autonomous_trading/bootstrap.py` | Composes `Safety` and `Conflicts`; `Composition.safety`, `Composition.conflicts` (`None` without admission) |
| `tests/conftest.py` | `FixtureHoldings` dicts renamed `order_rows` and `position_rows`, with `positions(account)` and `orders(account)`; the settings; a helper `unresolved(world, key, state)` |
| `tests/unit/test_admission_checks.py` | The renamed holdings dicts |
| `tests/unit/test_safety_matrix.py` | New (T-15): PRF-PRT-04's SLICE-05 clauses |
| `tests/unit/test_conflict_relation.py` | New (T-20): PRF-PRT-11 |
| `tests/unit/test_policy_parameters.py` | The two settings |

### `safety_state` and the events

```sql
CREATE TABLE safety_state (kind TEXT NOT NULL, scope TEXT NOT NULL, reason TEXT NOT NULL, state TEXT NOT NULL,
  principal TEXT NOT NULL, note TEXT NOT NULL, updated_sequence INTEGER NOT NULL,
  PRIMARY KEY (kind, scope, reason));
```

No `CHECK` on `kind` or `state`: SLICE-06 adds latch rows (per strategy and session; `tripped` / `unlocked`) and check rows to the same table without a rebuild. The code validates the values.

| Event | Payload (types for `events.schema.json`) | Fold (raises `TransitionNotAllowed`, the writer's `LED-R09`, when the guard fails) |
|---|---|---|
| `KILL_ENGAGED` | `principal` (array), `reason` (string) | row (`kill`, `desk`, `""`) must be absent or `released`; becomes `engaged`, `note` = reason |
| `KILL_RELEASED` | `principal` (array), `reason` (string) | the row must be `engaged`; becomes `released`, `note` = reason |
| `HOLD_ENGAGED` | `strategy`, `reason` (strings), `principal` (array) | row (`hold`, strategy, reason) must be absent or `released`; becomes `engaged`, `note` = `""` |
| `HOLD_RELEASED` | `strategy`, `released_reason`, `justification` (strings), `principal` (array) | row (`hold`, strategy, released_reason) must be `engaged`; becomes `released`, `note` = justification |

* The `principal` column holds `principal[0]`, as the pause fold does. `updated_sequence` is the event's sequence. Family `safety`; touched rows are loaded by (`kind`, `scope`, `reason`).
* The guards live in the fold, as `PAUSE_CLEARED`'s do, so D04 replay enforces them too.
* **Effect at the ledger sequence.** Every reader reads `safety_state` as committed: admission's stage A, its in-transaction stage B, and dispatch row 5 in step 2. A kill or hold therefore takes effect from its event's sequence ([dispatch spec](../../design/dispatch-and-coordination.md#holds-kills-and-latches-against-in-flight-requests)).

### `kernel/safety.py` — `Safety`

```text
Safety(writer, clock, authority, *, hold_automatic_actions: "allowed" | "refused")
    engage_kill(auth, reason) -> Committed | Refusal          # use "kill_engage"
    release_kill(auth, reason) -> Committed | Refusal         # use "kill_release"
    engage_hold(auth, strategy) -> Committed | Refusal        # use "hold_engage"; reason "operator"
    release_hold(auth, strategy, released_reason, justification) -> Committed | Refusal   # use "hold_release"
    killed() -> bool
    holds(strategy) -> tuple[str, ...]                        # engaged reasons, sorted
    check(facts: ActionFacts, auth) -> Refusal | None         # the SafetyPort
```

* **Who may command**, in this order:
  1. `auth` must authenticate (`SES-R01` otherwise, `authority`'s own check).
  2. `auth.principal.kind` must be `"human"` (`SES-R02`, `grant_scope`, as `Policy.clear_pause`).
  3. `authority.check(use, auth, account)` must pass for **every** bound account (`authority.bound_accounts()`). With no bound account, one check with `account = None`. Kill is desk-wide, and a hold has no account of its own, so a grant covering only some accounts cannot command them. This is the whole-ledger rule `recovery_advance` already follows (`recovery.py:351`). The stage table applies inside `check`: engage is allowed in `RECOVERY_WRITING` and `OPERATING`, release only in `OPERATING` (`authority.py:29-36`). The owner passes as owner-root; a delegated human needs a grant naming the action on every bound account (Q-014).
* `reason` and `justification` must be non-empty strings (`ADM-R01`). `release_hold` releases exactly one reason. Any engaged reason may be named, so a SLICE-06 `recovery` hold is released the same way.
* **Commit:** `Decision(kind, None, None, [EventDraft(kind, payload, auth.principal)], None)`. A fold guard's `LED-R09` is returned. Any other `Refusal` raises `WriterLost`, and `CommitFailed` propagates (`Policy._transact`'s rule).
* **`check(facts, auth)`** applies the matrix rows in the protection spec's order. Inert checks come first, but none exists before the latch (SLICE-06). Then kill, then hold. The latch row is SLICE-06's. The first refusal wins; refusals are `Refusal(code, name, None, "COMMAND_ADMITTED")`, re-keyed by the caller:

| Condition | entry | cancel | modify | close |
|---|---|---|---|---|
| Kill engaged | `PRT-R01` (`kill`) | allowed only for a human principal (`facts.principal.kind == "human"`) and an order with `facts.remaining` not ≤ 0 (`None` passes, as legacy). The grant is A2's; ownership and `open` are B2's | `PRT-R01` | allowed only for a human principal and a non-resting close (`not facts.resting`); a new resting close is `PRT-R01` |
| `facts.strategy` held (any reason engaged) | `PRT-R04` (`held`) | a human principal: not restricted; any other principal: per `hold_automatic_actions` (`allowed`: not restricted; `refused`: `PRT-R04`) | as cancel | as cancel |

* `action_facts` sets `remaining = o.quantity − filled` when the target order and its filled quantity are known, else `None`.
* A target that is not owned gives `facts.strategy = None`. Then no hold applies, and B2 refuses the action (`not_owned`).

### `kernel/safety.py` — `Conflicts`

```text
Conflicts(writer, holdings, *, protective_independence: "same_group_only" | "account_wide")
    check(facts: ActionFacts, *, observation, own_command_key=None) -> Refusal | None   # PRT-R10, "conflict"
    version -> str            # digest({"rule_set": "conflict-v1", "protective_independence": <value>})
```

**Terms:**

* An **unresolved effect** is a command on the account in `IN_FLIGHT`, `UNCERTAIN` or `WORKING`, read by the store's `unresolved_commands(account)`: `command_identity` joined to its `COMMAND_ADMITTED` event (by `first_sequence`) for `verb`, `target` and `underlying`. A command never conflicts with itself (`own_command_key`, used by dispatch in step 2). A `WORKING` command stays unresolved until its completion is recorded, which happens from step 3 and SLICE-07 on. An entry admitted through SLICE-01's private seam has no `underlying`; it is counted on every underlying, the conservative reading.
* **Position P's group** is P plus its **resting protective orders**: `holdings.orders(account)` rows with `position_id == P` and `is_protective(order)` (SLICE-04 step 2) that the observation does **not** show terminal. Statuses `filled`, `cancelled`, `rejected` and `expired` are terminal. An order the observation does not show, or shows `open` or `unknown`, is not terminal, because absence is never taken as terminal. This is the spec's "not observed terminal" (rows 1, 3, 5), wider than SLICE-04 B2's "resting" (shown `open`), on purpose.
* An unresolved effect is **on a member of G** when its `target` is P (a close) or one of G's order IDs (a cancel or modify).
* **Deviation (terminality source).** The protection spec's visibility table says the conflict check's inputs are ledger index tables, so the check is never inert. Until SLICE-07 records order terminality durably (reconciliation's order records, a leg's `ENDED`), "observed terminal" is read from the **same observation B1 and B2 judged** (`observation=` argument), so B2 and B3 never see different books. With no observation, every order counts as not terminal. SLICE-07 rebinds terminality to the ledger and removes this deviation. An order that drops off the broker's daily order book would otherwise never become terminal; SLICE-07's durable record also closes that gap.

**The rows**, tested in order. A row **decides only when both its action condition and its conflict condition hold**; otherwise the next row is tried, and when no row decides there is no conflict:

| # | Action | Conflicts when | Source |
|---|---|---|---|
| 1 | an entry | on the same account and `facts.underlying`: a position with `owned_quantity > 0`, or a position with a protective order not observed terminal (Q-017), or an unresolved entry | POL-007; Q-017 |
| 2 | an action on group G (`facts.position_id`) with `facts.sale_delta > 0` or `facts.removes_stop`, **except**: a cancel of a protective order when `owned_quantity` is known and ≤ 0; a modify of a protective order with `sale_delta == 0` and `new_total == filled + owned_quantity` (all known); a cancel of a protective order by a human principal | any unresolved effect on any member of G | ATA-04 |
| 3 | a close with `not facts.resting` | P has a resting protective order not observed terminal | POL-010, POL-008 |
| 4 | a cancel, modify or close | `account_wide` only: an unresolved entry on the same account other than P's own entry (`entry_command_key`); `same_group_only` (the first release, Q-004) never decides | ATA-04; Q-004 |
| 5 | a close with `facts.resting` | P already has a resting protective order not observed terminal | POL-008 |

* "The group's own entry command" never counts for row 2: an entry has no `target`, so it is never "on a member".
* `owned_quantity` unknown voids row 2's two `q`-based exceptions.
* **`version`** is recorded as evidence by dispatch (step 2). A change after admission is not a refusal (protection spec).

### Composition and admission

* `AdmissionPorts.safety` and `AdmissionPorts.conflicts` stay positional, typed `… | None`: `None` means the kernel's `Safety` and `Conflicts`, which `compose_simulation` builds and puts in place with `dataclasses.replace(admission, safety=…, conflicts=…)` before it builds the admissions. SLICE-04's tests keep their fixture refusals (`FIX-R03`, `FIX-R04`).
* A4, B:A4 and B3 are unchanged in place and order; B3 now passes `observation=` the observation B1 judged.
* `compose_simulation` refuses an unbound `hold_automatic_actions` or `protective_independence` when it composes admission (`RefusingParameterUnbound`, as SLICE-04's settings).

### Settings added

| Setting | Values | Env (`test` profile) | Owner answer |
|---|---|---|---|
| `safety.hold_automatic_actions` (field `hold_automatic_actions`) | `allowed`, `refused` | `AT_HOLD_AUTOMATIC_ACTIONS` | Q-001 binds `allowed` |
| `protection.protective_independence` (field `protective_independence`) | `same_group_only`, `account_wide` | `AT_PROTECTIVE_INDEPENDENCE` | Q-004 binds `same_group_only` |

**Deviation (naming):** the spec writes `protective_independence` with no section; the loader keeps every setting under a section, so it lives under `protection`. Both join `ADMISSION_REQUIRED`, conftest's `ADMISSION_SETTINGS` and `_ADMISSION_ENV`.

### Step 1 tests

* **`unresolved(world, key, state)`** (conftest) makes an unresolved effect. For an action it admits with `admit_action`, then commits `DISPATCH_CLAIMED` (execution id `key#1`, guard `ADMITTED`) for `IN_FLIGHT`, and adds `OUTCOME_AMBIGUOUS` for `UNCERTAIN` or `OUTCOME_ACKNOWLEDGED` for `WORKING`. For an entry it admits through the front door with the simulated broker's `timeout` step, which gives `UNCERTAIN`.
* `test_safety_matrix.py` (PRF-PRT-04's SLICE-05 clauses):
  * every cell of the kill and hold rows for the owner, a delegated human with the grant on every bound account, one with the grant on only one of two bound accounts (refused as a commander), one without it (A2's `SES-R02` comes before A4), and `kernel:protection`; these cells use `conflicts=FixtureCheck()`, so only the matrix decides;
  * the code order (kill before hold); a resting close under kill refused `PRT-R01` at `A4`;
  * a kill engaged during planning refuses at `B:A4`;
  * **CUJ-PRT-3's admission part**, with the kernel's conflicts: under kill a human's cancel of the resting stop is admitted, and a human's market close while the stop rests is refused `PRT-R10` (row 3);
  * conflict rows 5 and 1 as PRF-PRT-04 names them: a human's resting close while a protective leg rests is refused (row 5); an entry while a closed position's stop rests is refused and, once the stop is observed `cancelled`, admitted (Q-017);
  * the engage and release guards (`LED-R09`); `auth=None` (`SES-R01`); a non-human commander (`SES-R02`); `release_hold` releasing one reason while a `recovery` reason, engaged by appending `HOLD_ENGAGED` for `kernel:recovery`, stays engaged;
  * both values of `hold_automatic_actions`; a kill under a partly filled open order (cancel admitted) and one with remaining 0 (refused);
  * an action admitted before the kill stays admitted.
* `test_conflict_relation.py` (PRF-PRT-11), on a stub position from `FixtureHoldings` with a synthetic resting stop:
  * the ATA-04 matrix: an in-flight (stalled transport), uncertain and working entry, modify and cancel against later actions, on the same and different targets and accounts;
  * row 1 with a closed position whose stop rests, then observed `cancelled` (Q-017), and with the stop missing from the observation (still refused: absence is not terminal);
  * row 2's three exceptions, and `owned_quantity` unknown voiding the two `q`-based ones;
  * rows 3 and 5 against a resting stop with nothing unresolved;
  * F-P9's precondition: once the stop is observed `filled`, the group is free;
  * both `protective_independence` values, labelled pending (row 4);
  * a command never conflicts with itself.
* `test_policy_parameters.py`: the two settings resolve, are null by default, refuse other values, and the composition refuses each unbound.
* **Break checks** (named in the docstrings):
  * let a non-human cancel under kill;
  * let a resting close pass under kill (`PRT-R01` at `A4` must fail);
  * let a remaining-0 order be cancelled under kill;
  * check a commander on one bound account only;
  * read hold reasons across strategies;
  * count an order the observation does not show as terminal;
  * let a close with nothing unresolved skip row 3 (first match decides);
  * drop row 2's human-cancel exception;
  * make row 4 decide under `same_group_only`;
  * replace the relation with a blanket rule (any unresolved effect on the account);
  * replace it with a per-target-only rule.

### Step 1 as built

Commit `6f49827` on `slice-05`, cut from `slice-04` at `36717dc`. It changes 18 paths: the step 1 files table's code and test files, plus `tests/unit/test_admission_checks.py` (a fixture rename).

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| Unresolved effects | `LedgerWriter.unresolved_commands(account)` joins `command_identity` to the command's own `COMMAND_ADMITTED` event (its `first_sequence`) and returns `command_key`, `state`, `verb`, `target` and `underlying` for `IN_FLIGHT`, `UNCERTAIN` and `WORKING` |
| Kill cancel parity | `ActionFacts` gains `remaining` (observed quantity − filled, `None` when unknown); the kill row refuses a cancel only when it is known and ≤ 0 |
| Commander order | `SES-R01` unauthenticated, then `SES-R02` non-human, then the grant on each bound account (`[None]` when none is bound); the first refusal wins |
| Command refusals | the fold's guard comes back as `LED-R09`; an empty reason, strategy or justification is `ADM-R01`; any other writer refusal raises `WriterLost` |
| Composition | `Composition` gains `safety` and `conflicts`; bootstrap builds both whenever admission is composed and fills only the ports passed as `None` |
| Fixture names | `FixtureHoldings`'s dicts are renamed `order_rows` and `position_rows`, so they no longer shadow the port's new `orders()` and `positions()` methods |
| Entry effects in tests | An entry is sent through the simulated broker: `timeout` gives `UNCERTAIN`, `ack` gives `WORKING`, and `IN_FLIGHT` is probed inside a stalled send (the broker's `send` wrapped). The entry worlds observe the stop with amount and margin `0.00`, so the entry passes B5 |
| `unresolved()` helper | takes `auth` (protection's own commands) and asserts no refusal: a recorded refusal also commits |

**Found while building — the row 2 modify exception cannot apply.** Row 2's action condition needs `sale_delta > 0` (a modify never sets `removes_stop`), and its modify exception needs `sale_delta == 0`, so no modify ever meets both. A resize that keeps the stop equal to the position (`new_total == filled + owned_quantity`) with `sale_delta > 0` is therefore refused while the group has an unresolved effect. `test_row_2_exceptions` pins today's behaviour. Changing it alters which protective actions pass, so it is proposed, not made: drop `sale_delta == 0` from the exception (the protection spec's resize case). It is carried into the step 2 review.

**Tests** (384 passed with `scripts/safe_tests.py`, no broker variables):

| File | Cases |
|---|---|
| `test_safety_matrix.py` (15) | The kill row (entry and modify refused; a human's cancel and market close admitted; a resting close and protection's cancel and close refused `PRT-R01` at `A4`); a partly filled cancel admitted and a remaining-0 cancel refused; the hold row under both `hold_automatic_actions` values; `SES-R02` at `A2` before the kill; kill before hold; a kill during planning at `B:A4`; an admitted command stays admitted; commanders (`auth=None`, protection, an ungranted human, a granted human, the same human after a second account is bound, the owner); the guards; `release_hold` leaving a `recovery` reason; CUJ-PRT-3's admission part; rows 5 and 1 at the front door |
| `test_conflict_relation.py` (25) | The ATA-04 matrix: an unresolved cancel or modify in each state against protection's cancel and a raising modify (refused), a close of another position, an entry on another underlying and an action on another account (free); an unresolved entry in each state against an entry on the same underlying (refused), another underlying and another account (free); the group, not only the target; row 1 with the stop resting, absent, `unknown` and `cancelled`, and an open position; row 2's exceptions; rows 3 and 5 with nothing unresolved; F-P9 (a `filled` stop frees the group); row 4 under both `protective_independence` values and P's own entry; a command never conflicting with itself; `version` naming the rule set |
| `test_policy_parameters.py` | The two settings resolve from `AT_HOLD_AUTOMATIC_ACTIONS` and `AT_PROTECTIVE_INDEPENDENCE` and refuse other values; null by default and the composition's unbound refusal come through `ADMISSION_REQUIRED` |

**Break checks** (each applied to `kernel/safety.py`, run against both new files, and reverted byte for byte with an md5 check; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Let a non-human cancel under kill | `test_kill_row` |
| Let a resting close pass under kill | `test_kill_row` |
| Let a remaining-0 order be cancelled under kill | `test_kill_cancel_needs_remaining_quantity` (remaining 0) |
| Accept a commander granted on one bound account | `test_commanders` |
| Read hold reasons across strategies | `test_release_one_reason` |
| Count an order the observation does not show as terminal | `test_row_1_closed_position_q017` (absent) |
| Let a close with nothing unresolved skip row 3 | `test_cuj_prt_3_admission_part`, `test_rows_3_and_5_with_nothing_unresolved` |
| Drop row 2's human-cancel exception | `test_row_2_exceptions` |
| Make row 4 decide under `same_group_only` | `test_row_4_protective_independence` (`same_group_only`) |
| A blanket rule (any unresolved effect on the account) | 12 cases, among them every `test_ata_04_unresolved_action` case |
| A per-target-only rule | `test_the_group_not_only_the_target`, `test_row_2_exceptions` |

## Step 2 — the coordinator loop (deepened after step 1)

Per the [dispatch spec](../../design/dispatch-and-coordination.md):
* **The loop:** one I/O worker per account, the deadline sweep and its timer, eligibility (ADMITTED; no attempt or a `NOT_SENT` one followed by `DISPATCH_RETRY_REQUESTED`; the conflict relation; no inert guarding check), the fixed admission-order rule, revalidation rows 1–5 (row 6 waits for SLICE-07's observation loop), the claim, the send outside any transaction, and the outcome commit with its refusal table (`outcome_refused`, or the kernel exits).
* **Read side:** the busy count from command states (replacing SLICE-04's fixture), `command_status`, and the identity rule's retry branch (`DISPATCH_RETRY_REQUESTED`).
* **Proofs:** PRF-DSP-01, -03, -05…-08, -10, -11, and PRF-DSP-04's conflict half (its inert half needs SLICE-06's latch). The simulated broker gains a scripted delay so CUJ-DSP-1 can be shown.

## Step 3 — cancel, modify and close dispatch and completion (deepened after step 2)

* **Dispatch:** `BrokerPort.send` widened to cancel, modify and close requests, and the simulated broker's script for them.
* **Ownership:** the holdings port's `order` and `orders` bound to `broker_identity` joined to `command_identity` (positions stay a fixture until SLICE-07), and capacity's `protective_order_ids` from the same join.
* **Completion:** the verb-specific completion rules of the ledger spec as pure decisions over an observation (`COMPLETED` with `confirmed_level` for a modify and a resting close; `target_terminal`), which SLICE-07's loop calls.
* **Proof:** PRF-LED-16 (`tests/integration/test_verb_completion.py`, T-22).

## Completion conditions

1. Every SLICE-01…04 test and every test of the built steps passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. Each step's file list matches its commit.

## Prerequisites

SLICE-04 as built. No open owner question.
