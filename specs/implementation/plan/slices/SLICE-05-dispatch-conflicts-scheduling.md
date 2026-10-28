# SLICE-05 — Dispatch, conflicts and scheduling

* **Status:** proposed; reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-05-review-2026-10-27)). Step 1 is built (OA_NEW `6f49827` on `slice-05`; [Step 1 as built](#step-1-as-built)). Step 2 is built (OA_NEW `68570b0`; [Step 2 as built](#step-2-as-built)). Step 3 is built (OA_NEW `a4c4516`; [Step 3 as built](#step-3-as-built)), so every step of the slice is built on `slice-05`.
* **Precedence:** the master README, then the ROADMAP, then this package. The authorities are the [dispatch spec](../../design/dispatch-and-coordination.md), the [protection spec](../../design/protection-and-safety.md) (kill and holds, the permission matrix, the conflict relation) and the [ledger spec](../../design/ledger-and-atomic-transaction.md) (the identity rule's retry branch, verb completion). Every deviation is marked **Deviation**. No score, threshold or money value is set: every refusing setting is bound only to labelled synthetic or owner-answered values in tests.
* **Phase:** master Phase 1 (D13 revalidation, A03-F1/F2/F3, ATA-04; kill and hold events, POL-002 and POL-003). Class S. Disarmed: the simulated broker only.
* **Builds on:** [SLICE-04](SLICE-04-intent-to-admission.md) as built; branch `slice-05` cut from `slice-04` (OA_NEW `36717dc`).
* **Owner answers applied:** Q-001 (`safety.hold_automatic_actions: allowed`), Q-004 (`protective_independence: same_group_only`; the fixed admission-order rule; `coordinator.busy_applies_to: entries_only`), Q-011 (`dispatch.deadline_ms_<verb>`, synthetic here), Q-014 (the owner and delegated human principals holding the named grant), Q-017 (conflict row 1 also counts a protective order not observed terminal), Q-021 (row 2 never excepts a raise of a protective stop).
* **Tasks and proofs:** step 1 is TASK-S05-03 and TASK-S05-07 (PRF-PRT-04's kill and hold rows, PRF-PRT-11); step 2 is TASK-S05-01, -02, -04, -06, -08, -09 (PRF-DSP-01, -03, -05…-08, -10, -11, and PRF-DSP-04's conflict half); step 3 is TASK-S05-05 (PRF-LED-16 for cancel, modify and close).

**Excluded, and where each part arrives:**

* **SLICE-06:** the daily-loss latch and its matrix row; the `SAFETY_CHECK_STATE` record, and with it PRF-DSP-04's inert half (no check can be inert before the latch exists); the recovery and protection holds (`recovery`, `overclose`, `sibling_failed`); PRF-PRT-04's F-P12, F-P14, F-P20 and ratchet clauses.
* **SLICE-11:** the kernel process's wake loop and the hand-off of other threads' decisions to the writer thread (step 2 builds `run_pass`, `next_wake` and the wake flag it calls); the supervisor that reports a worker past its total deadline (F-D6).
* **SLICE-07:** the observation loop; the real `positions` side of the holdings port (the `position` table); conflict terminality bound to durable ledger facts (below); dispatch row 6 against live observations and its wake on observation arrival (step 3 builds the row's logic); entry completion, `FILL` and the recorded-fills precondition for a close's completion; the OpenAlgo adapter and its total-deadline proof.
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

**Found while building — the row 2 modify exception never decides (Q-021).** Row 2 applies only when `sale_delta > 0` or `removes_stop` (a modify never sets `removes_stop`), and its modify exception needs `sale_delta == 0`, so it never applies: it is redundant, as in the protection spec, where it covers only a lowering modify. A raise of a protective stop to the owned quantity is therefore refused while the group has an unresolved effect. The owner chose to keep that ([Q-021](../../decisions/owner-questions.md#q-021), option A): a raise during an in-flight or uncertain close could oversell. `test_row_2_exceptions` proves both halves; the code keeps the redundant clause so it reads as the spec's row.

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

## Step 2 — the coordinator loop

TASK-S05-01, -02, -04, -06, -08, -09. Proofs: PRF-DSP-01, -03, -05, -06, -07, -08, -10, -11, and PRF-DSP-04's conflict half. Every rule here is the [dispatch spec](../../design/dispatch-and-coordination.md)'s unless marked **Deviation**. Reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-05-step-2-review-2026-10-28)).

### What legacy does, and what that decides

* **One lock, inline send.** Legacy holds one process-global `RLock` across the broker HTTP call (`src/tier1/gateway_route.py:84`, `:617-650` @445eb116; LD-08), so every account waits behind one slow request. The target sends from one I/O worker per account, outside any transaction.
* **Caller-driven retries.** `ExecutionCoordinator.send` (`src/tier1/coordinator.py:94-110` @445eb116) allows a new attempt only after a rejection or a proven non-delivery (`RETRYABLE`, `:37`, or `RESOLVED:never_reached_broker`), and only when a caller calls again. The target keeps the caller-driven rule, but a rejected command is final ([ledger identity rule](../../design/ledger-and-atomic-transaction.md#request-digest-and-the-identity-rule)).
* **No hidden late results.** `send` records the intent, calls the adapter once, and records whatever comes back; an exception after the call started is ambiguous (`:115-117`). `recover()` (`:139-155`) marks every intent with no outcome ambiguous and sends nothing. OA_NEW already has both rules (`Coordinator._claim_and_send`, `Coordinator.recover`); step 2 moves the send onto a worker without changing them.
* **No dispatch revalidation, no deadline, no ordering rule.** Legacy sends whichever request takes the lock first. These are new (D13, A03-F2, ATA-04).

### Decisions

* **Both front doors stop at `COMMAND_ADMITTED`.** `EntryAdmission.admit` no longer calls `_claim_and_send`; it returns the "admitted, awaiting dispatch" outcome `admit_action` already returns (`Outcome(key, None, "not_sent", "committed", "none", {}, None, False, None)`). The coordinator sends every admitted command. The [ledger spec's Outcome table](../../design/ledger-and-atomic-transaction.md#execution-contract-types-contractsexecutionpy) row for that outcome now reads "a command admitted by a front door; the coordinator dispatches it".
* **One dispatch path, two drivers.** Revalidation, the claim, the send and the outcome commit are one set of methods. `run_pass()` drives them with per-account worker threads. `dispatch_inline(key)` drives them for one command on the calling thread. It is used only by SLICE-01's private seam `_submit_admitted` (and so by `operations/verification.py` and the SLICE-01…03 tests), whose crash points CP-L2…CP-L5 keep their meaning. `test_capabilities.py`'s caller rule for `_submit_admitted` is unchanged, and `dispatch_inline` is added to it with the same callers.
* **Entries only, until step 3 (Deviation).** `BrokerPort.send` takes an `EntryRequest` until step 3 widens it. An admitted cancel, modify or close is therefore never eligible in step 2: it counts toward the busy count, and the sweep refuses it `DSP-R01` at its deadline. That record is literally true (its deadline passed) but hides why; no step 2 caller admits an action expecting it sent. Step 3 removes the verb filter, rebuilds an action's facts with `action_facts` against the latest observation (the kill row reads `remaining` and `resting`, which the payload alone cannot give), and reruns CUJ-DSP-1 with a cancel, as the dispatch spec states it. Step 2 proves CUJ-DSP-1 with two entries on two accounts.
* **The release dependency compares binding IDs**, as the spec says. `_bind_release` records a new `RELEASE_BOUND` only when the receipt digest changes (`kernel/recovery.py:169-175`), so a restart on the same bundle keeps the binding and passes. A bundle change refuses, even one later changed back (A → B → A), the conservative reading.
* **Deadlines keep their monotonic start in memory.** `wire(Deadline)` persists only `origin` and `budget_ms` (`contracts/execution.py:330-332`). Each front door, after its `COMMAND_ADMITTED` commits, registers the command's `Deadline` in `coordinator.deadlines[key]`. A command in that map is judged on the monotonic clock; one with a persisted deadline but no entry was admitted by an earlier process and is judged on the restart rule; one with none (SLICE-01's seam) never expires.
* **The host loop is SLICE-11's.** The kernel process that waits for wakes (ledger commit, worker return, deadline timer; observation arrival from SLICE-07) and hands other threads' decisions to the writer thread is built with supervision (SLICE-11, TASK-S11-03). Step 2 builds what that loop calls: `run_pass()`, `next_wake()` and the wake event. Tests are the writer thread and call `run_pass()` themselves.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/coordinator.py` | `run_pass`, `next_wake`, `woken`, `wait_woken`, `in_flight`, `command_status`, `dispatch_inline`, `deadlines`; the per-account workers; revalidation; eligibility and ordering; the shared claim, send and outcome methods |
| `src/autonomous_trading/kernel/admission.py` | The entry door stops at `COMMAND_ADMITTED`; both doors record `release_binding_id` and register the deadline; A1a, with its retry branch, runs before A0 in the entry door and in both doors |
| `src/autonomous_trading/kernel/ledger/store.py`, `projections.py` | `DISPATCH_RETRY_REQUESTED` (in `_COMMAND_KINDS`, family `dispatch`, touched rows, fold); reads `admitted_commands()`, `busy_count(account)`, `bound_release()` |
| `src/autonomous_trading/resources/events.schema.json` | `DISPATCH_RETRY_REQUESTED`; `DISPATCH_REFUSED` gains `message` |
| `src/autonomous_trading/contracts/execution.py` | `CommandStatus`; `entry_request_from_wire`, `plan_ref_from_wire` |
| `src/autonomous_trading/kernel/ports.py` | `AdmissionPorts.busy` typed `… \| None`; `DispatchPorts` |
| `src/autonomous_trading/adapters/simulated_broker.py` | The stall step, `release`, `wait_stalled`; a lock around `take` |
| `src/autonomous_trading/settings/schema.py`, `loader.py`, `resources/defaults.yaml` | `adapter.http_timeout_ms` (refusing) |
| `src/autonomous_trading/bootstrap.py` | Composes `DispatchPorts`; a `None` busy port means the store's count |
| `tests/conftest.py` | `dispatch(world)`; `two_accounts=True`; `kernel_busy=True`; `build_admission_world(...)` for child processes and reopens; the setting |
| `tests/integration/test_dispatch_revalidation.py` | New (T-11): PRF-DSP-01, -04 (conflict half), -08, -10, -11 |
| `tests/integration/test_bounded_io.py` | New (T-12): PRF-DSP-05, -06 |
| `tests/unit/test_scheduling.py` | New (T-13): PRF-DSP-07 |
| `tests/recovery/test_crash_boundaries.py` | PRF-DSP-03's CP-D1 |
| `tests/unit/test_review_semantics.py`, `test_conflict_relation.py`, `test_safety_matrix.py`, `test_admission_checks.py` | Entries reach the broker through `dispatch(world)`; `test_conflict_relation.py`'s in-flight probe becomes `run_pass`, `wait_stalled`, assert, `release` |
| `tests/unit/test_policy_parameters.py`, `tests/contracts/test_capabilities.py` | The setting; the seam's caller list |
| Spec amendments | The [ledger catalogue](../../design/ledger-and-atomic-transaction.md#event-catalogue)'s `DISPATCH_REFUSED` payload gains `message`, and its Outcome table row above |

No migration and no tree delta: `command_attempt.retry_requested_sequence` exists since SLICE-01, and every new test file is in the tree (T-11…T-13).

### Ledger: the retry branch, the reads, the round trip

* **`DISPATCH_RETRY_REQUESTED`**: family `dispatch` (as `DISPATCH_CLAIMED` and `DISPATCH_REFUSED`), and added to `_COMMAND_KINDS`, so the envelope carries `command_key` and the attempt row is loaded. Payload `attempt_no` (int), `principal` (array); `execution_id = "<key>#<attempt_no>"`. Fold: the command row must be `ADMITTED`; attempt `attempt_no` must be the command's highest, in `NOT_SENT`, with `retry_requested_sequence` null. It sets `retry_requested_sequence` to the event's sequence and leaves the command's state unchanged. Anything else raises `TransitionNotAllowed` (`LED-R09`).
* **A1a, before A0.** The entry door today runs A0 (busy) before A1a (`kernel/admission.py:573`, `:582`); a command waiting for its retry is `ADMITTED` and counts as busy, so at the bound its own resubmission would be refused `ADM-R12`, and a caller who lost its reply would get "busy" instead of its outcome. Step 2 runs A1 (the key and intent checks) and A1a first, then A0. A1a, in both doors and in the seam: when a row with the same request digest exists, the command is `ADMITTED`, and its latest attempt is `NOT_SENT` with no retry recorded, run A2 for the resubmitting principal (`authority.check(verb, auth, account)`). A refusal is returned unrecorded (`canonical = "unchanged"`). Otherwise commit `DISPATCH_RETRY_REQUESTED` and return the existing outcome. Every other identical resubmission returns the existing outcome, as today; a `REJECTED` command is final.
* **`admitted_commands()`** returns every `ADMITTED` command ordered by `first_sequence`: `command_key`, `account` (canonical), `verb`, `first_sequence`, the `COMMAND_ADMITTED` payload, and the latest attempt (`attempt_no`, `state`, `retry_requested_sequence`) or none.
* **`busy_count(account)`** counts the account's commands in `ADMITTED` or `IN_FLIGHT`.
* **`bound_release()`** returns the latest `RELEASE_BOUND`'s `binding_id`, or `None`.
* **`DISPATCH_REFUSED`** gains `message` (the refusal's message): payload `code`, `message`, `dependency`.
* **The round trip.** `entry_request_from_wire(d) -> EntryRequest` and `plan_ref_from_wire(d) -> PlanRef` rebuild the admitted request and plan from the payload's `request` and `plan_ref`. Before the claim the coordinator checks `request_digest(request) == command.request_digest` and `plan.plan_digest == payload["plan_digest"]`; a mismatch raises `RuntimeError` before anything is claimed (the kernel exits; it never sends a request other than the admitted one).

### Revalidation (in order; the first failure is recorded)

| # | Dependency | Check | Refused when | Code, `dependency` |
|---|---|---|---|---|
| — | Test seam | `revalidate_hook(command)` (SLICE-01) | never (returns `True`) | — |
| — | Stage (`dispatch_inline` only) | `stage() == "OPERATING"` | not operating | `SES-R09`, `stage` (SLICE-01's behaviour; `run_pass` does nothing when not operating, so admitted work waits) |
| 1 | Deadline | below | passed | `DSP-R01` (`deadline_passed`), `deadline` |
| 2 | Release | `bound_release()` against the payload's `release_binding_id`; a `None` recorded ID (the seam, or no binding at admission) skips the row | they differ | `DSP-R02` (`release_changed`), `release` |
| 3 | Grant | `authority.recheck(grant_id, verb, account)` | revoked, expired, chain broken | `SES-R03`/`-04`/`-05`, `grant` |
| 4 | Session (entries) | `lifecycle.entry_session_check(writer, clock, application.session_id, application.candidate_id, binding_revocation_effect)`, the first two from the payload's `application`; an application with no `session_id` (the seam) skips the row | not `OPEN`, the binding revoked under `stop_entries`, or the candidate no longer bound | `SES-R07` or `ADM-R14`, `session` |
| 5 | Safety | `safety.check(facts, None)`; for an entry, `ActionFacts("entry", principal, account, strategy, underlying)` from the payload (`principal` is `payload["request"]["principal"]`) | kill or hold forbids it | `PRT-R01`/`PRT-R04`, `safety` |

* A refusal commits `DISPATCH_REFUSED` (guard `ADMITTED`), which ends the command `REFUSED` and releases its reservation (the existing fold).
* **The deadline.** In `coordinator.deadlines`: `Deadline.expired(clock.elapsed())`. Else, with a persisted `dependencies.dispatch_deadline`: `lifecycle.restart_deadline_expired(Timestamp(origin, "wall"), budget_ms, writer, clock)`, which never extends it. Else never.
* Row 6 (the target against the latest observation) is SLICE-07's; step 2 sends no action.
* **Eligibility** (all of): `ADMITTED`; no attempt, or the latest `NOT_SENT` with `retry_requested_sequence` set; verb `entry` (step 2 only); the conflict relation passes — `conflicts.check(facts, observation=observations.latest(account), own_command_key=key)` with the row 5 facts — otherwise the command **waits**; its account's worker is idle. No safety check can be inert before SLICE-06, so that clause reads nothing yet.
* **Ordering.** Among an account's eligible commands, the lowest `first_sequence` first. A command that waits, or is refused, does not hold up the next; at most one claim per account per pass.

### `kernel/coordinator.py`

```text
DispatchPorts(safety, conflicts, observations, binding_revocation_effect, http_timeout_ms)   # kernel.ports
Coordinator(...)                                        # attribute dispatch: DispatchPorts | None, set by bootstrap
    deadlines: dict[str, Deadline]                      # this process's admitted deadlines
    run_pass() -> PassReport
    next_wake() -> Elapsed | None
    woken() -> bool; wait_woken(timeout_s) -> bool      # a threading.Event a worker sets after queuing
    in_flight() -> tuple[InFlight, ...]                 # InFlight(account, command_key, attempt_no, age_ms, over_deadline)
    command_status(command_key) -> CommandStatus | None
    dispatch_inline(command_key) -> Outcome             # SLICE-01's seam only
PassReport(returned: tuple[Outcome, ...], refused: tuple[Outcome, ...], claimed: tuple[str, ...],
           waiting: tuple[str, ...])
```

* **`DispatchPorts`** is composed by bootstrap from the admission ports **after** their `dataclasses.replace`, so it holds whatever A4 and B3 use. Dispatch tests compose with `kernel_safety=True, kernel_conflicts=True`; SLICE-04's fixture checks pass everything.
* **`run_pass()`**, on the writer thread; `RuntimeError("dispatch is not composed")` when `dispatch` is `None`.
  1. **Returns.** Clear the wake event, **then** take every queued result. For each, at CP-L3b, commit its outcome as `_claim_and_send` does today (`evidence_unpublished` when the adapter published nothing and `adapter_error` is false; `LED-R06`/`LED-R08` give `outcome_refused`; any other refusal raises `WriterLost`). `CommitFailed` propagates: the kernel exits, as the dispatch spec's outcome table says. Then the account's worker is idle.
  2. **Not operating:** stop here.
  3. **Sweep.** Every `ADMITTED` command whose deadline has passed, eligible or not: `DISPATCH_REFUSED` `DSP-R01`.
  4. **Claims.** For each account with an `ADMITTED` command, in canonical `AccountId` order, whose worker is idle: walk its eligible commands in order; revalidate; refuse or wait; otherwise rebuild the request and plan (the round trip), at CP-L2 claim attempt *n* (= latest + 1), and at CP-L3a record the hand-off `Elapsed` and give `(key, n, request, plan)` to the account's worker. A refused claim raises `WriterLost`; `CommitFailed` propagates; nothing is handed to the worker in either case. Stop at the account's first claim.
* **Workers.** One daemon thread per account, created on first use, with an inbox of one. It calls `broker.send(request, plan, n)` and queues `(key, n, result, adapter_error)`; an exception becomes `ambiguous`, reason `adapter_error`, with `adapter_error = True`. Then it sets the wake event. It never touches the ledger or the clock; the adapter publishes evidence inside its own call, as today.
* **`dispatch_inline(key)`** runs the hook, the stage check, rows 1–3, and rows 4–5 only when `dispatch` is composed; it applies no eligibility or conflict check (a seam entry has no `underlying`, which the relation counts on every underlying). It raises `RuntimeError` if a worker exists for the command's account, so one account never has two requests in flight. It keeps `_claim_and_send`'s returned outcomes, `CommitFailed` included.
* **`next_wake()`** is the earliest of: for each command in `deadlines`, `started + budget`; for each `ADMITTED` command with only a persisted deadline, `clock.elapsed() + max(0, origin + budget − effective_now)`, which can only come early. `None` when there is none.
* **`in_flight()`**: one `InFlight` per busy worker; `age_ms` from the hand-off `Elapsed`; `over_deadline` is `age_ms > dispatch.http_timeout_ms`. The supervisor that reports it (F-D6) is SLICE-11's.
* **`command_status(key)`** reads index tables and the command's own events: `CommandStatus(command_key, state, verb, attempt_no, effect, broker_order_ids, refusal)`. `attempt_no` and `effect` are the latest attempt's (`effect` its state in lower case, `claimed` while in flight); `broker_order_ids` are the command's `broker_identity` rows by leg role; `refusal` is `Refusal(code, message, key, "DISPATCH_CLAIMED")` from `DISPATCH_REFUSED` for a `REFUSED` command, else `None`. An unknown key gives `None`.
* **Busy count.** `AdmissionPorts.busy = None` means `writer.busy_count`.

### Settings added

| Setting | Values | Env (`test` profile) | Owner answer |
|---|---|---|---|
| `adapter.http_timeout_ms` (field `http_timeout_ms`) | int > 0 | `AT_HTTP_TIMEOUT_MS` | measured (A09-F4, TASK-S11-07); synthetic in tests |

It joins `ADMISSION_REQUIRED`. Only `in_flight()` reads it in step 2; the OpenAlgo adapter enforces it (SLICE-07).

### The simulated broker

* A step `{"result": …, "account": [broker, account], "stall": "until_released"}` blocks inside `send` until `release(account)`, as the [execution-domain spec](../../design/execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy) states. The stall waits on a per-account `threading.Event` **after** `take` returns, outside its lock, so one account's stall never blocks another's `take`. `wait_stalled(account, timeout_s) -> bool` returns when a call has reached the stall. A stall never released within 30 s raises (a test bug the worker turns into `adapter_error`).
* `ScriptResponder.take` holds a lock. In two-account scripts every step names its `account`.

### Step 2 tests

* **Fixtures** (conftest):
  * `dispatch(world)`: up to 20 passes; between passes, while a worker is busy and not stalled, `wait_woken(5)`; it fails the test if work remains after the bound. Returns the reports.
  * `two_accounts=True`: `ACCT_2 = sim:acct-two`, `SESSION_2`, binding `b-2`, grant `g-test-2` (entry) for the test principal, a `LOSS_LIMIT` entry for it, `recovery.tick()` to open its session, a planner fixture that plans on the request's account, `make_intent(session_id=SESSION_2)` and `world.request(..., account=ACCT_2)`. The fixture observation is shared.
  * `kernel_busy=True`: `busy=None`, the store's count.
  * `build_admission_world(ledger, clock, steps, *, two_accounts=False, reopen=False)`: module level, for crash children and restarts; `reopen` skips authorizing bindings and issuing grants already in the ledger.
* `test_dispatch_revalidation.py`:
  * PRF-DSP-01: one test per row: a deadline passed by the clock; a new release bound after admission; the grant revoked; the session closed; a kill, then a hold. With two failing rows the first is recorded. An unrelated append (an `ADMISSION_REFUSED`) refuses nothing. A restart on the same bundle passes row 2; A → B → A refuses it.
  * The deadline after a restart: a command admitted by the earlier process is judged on the ratchet, refused once passed, never extended; `next_wake()` is never later than its expiry.
  * PRF-DSP-04 (conflict half): the first entry scripted `ack` (so its worker is idle again, `WORKING`); a second entry on the same underlying, admitted while the first was `ADMITTED`, then waits on the conflict alone; it is refused `DSP-R01` at its deadline; another account's entry is claimed meanwhile.
  * PRF-DSP-08: CUJ-DSP-2 (a hold after admission, before the claim: `PRT-R04`, reservation released, no broker call); a hold and a kill engaged while the claimed send is stalled: it completes and its outcome commits.
  * PRF-DSP-10: with `kernel_busy=True`, `ADM-R12` at the bound counted from the ledger, before any commit; `UNCERTAIN` and `WORKING` not counted; `command_status` for `ADMITTED`, `IN_FLIGHT`, `WORKING`, `UNCERTAIN`, `REJECTED` and `REFUSED`, and `None` for an unknown key.
  * PRF-DSP-11: after `not_sent` no claim on later passes; an identical resubmission records `DISPATCH_RETRY_REQUESTED`, and the next pass sends attempt 2; also at the busy bound (two `ADMITTED` commands at the synthetic bound of 2); a second resubmission before that claim records nothing; one by a principal without the grant is refused and records nothing; a rejected command resubmitted returns its outcome and is never sent again.
  * The round trip: the rebuilt request and plan have the admitted digests.
* `test_bounded_io.py`:
  * PRF-DSP-05: CUJ-DSP-1: A's send stalled (`wait_stalled`), B's entry claimed and sent in a later pass while A is still in flight; A's next eligible command waits until A returns; `in_flight()` reports A's age and `over_deadline` once the synthetic timeout has passed.
  * PRF-DSP-06: CUJ-DSP-3 (a scripted `timeout`: `UNCERTAIN`, reservation kept, never claimed again); F-D3 (the admitting caller goes away: the command is sent; no cancel command exists).
* `test_scheduling.py` (PRF-DSP-07): the oldest eligible first; a blocked older command (waiting on a conflict behind an `ack`ed entry) does not stop a younger one; one claim per account per pass; accounts in canonical order; `dispatch_inline` refuses while the account has a worker.
* `test_crash_boundaries.py` (PRF-DSP-03, CP-D1): a child built by `build_admission_world(two_accounts=True)` admits A's entry, runs a pass, `wait_stalled(A)`, admits B's entry with no pass, and exits (`os._exit(86)`). The parent reopens: `recover()` commits A `AMBIGUOUS` (`interrupted`), the first pass sends nothing for A and sends B from the ledger alone. F-D4 and F-D5 keep SLICE-01's tests through the shared outcome method. The two-leg `reservation_after` and `RESIDUAL_RECORDED` clause waits for the first admitted structure ([Q-020](../../decisions/owner-questions.md#q-020) refuses every structure).
* **Break checks** (named in the docstrings; each must fail a named test):
  * send before the claim commits;
  * skip revalidation row 5 (a hold after admission is sent);
  * skip row 2 (a release bound after admission passes);
  * refuse on a conflict instead of waiting;
  * skip the sweep for ineligible commands;
  * one lock across all accounts (B waits behind A);
  * claim the newest eligible command first;
  * let a blocked older command stop the account;
  * retry after `not_sent` without a retry request;
  * run A0 before A1a (the retry at the bound is refused);
  * count `UNCERTAIN` in the busy count;
  * let the decoder drop a field (the round-trip test fails);
  * re-send a claim after restart.
* **Not break-checked:** clearing the wake event after draining. The lost wake needs a worker to queue between two writer-thread statements, which no test can schedule deterministically; the order is stated above and checked by reading.

### Step 2 as built

Commit `68570b0` on `slice-05`, after `02f9377`. It changes 22 paths: the step 2 files table's code and test files. The spec amendments are this repository's.

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| Crash point CP-L2 | In `run_pass` it sits after revalidation and the round trip, just before the claim. In `dispatch_inline` it stays where SLICE-01 put it, before revalidation |
| Eligibility before revalidation | `run_pass` checks the conflict relation (wait) before rows 1–5 (refuse), as the dispatch spec's loop does: a command that both conflicts and is held waits until the conflict clears or its deadline passes |
| `dispatch_inline` caller rule | `test_capabilities.py` allows `dispatch_inline` only in `kernel/coordinator.py`; `operations/verification.py` reaches it through `_submit_admitted`, which keeps its two callers |
| A0 after A1a | A1 (which records `INTENT_SEEN`) and A1a now run before A0, so a busy refusal leaves an `INTENT_SEEN` behind. It is still unrecorded as a refusal; `test_a0_busy_is_not_recorded` asserts no `COMMAND_ADMITTED` and no `ADMISSION_REFUSED` |
| Workers | Daemon threads, created on an account's first claim and never stopped; shutting them down belongs to the SLICE-11 host |
| `next_wake` for restart deadlines | `clock.elapsed()` plus the time left on the ratchet (`origin + budget − effective_now`, floored at 0) |
| Fixtures | `admission_ports`, `admission_calendar` and `open_admission_world` are shared by the `admission_world` fixture and `build_admission_world`. `make_plan` plans on the account whose session the intent names, and `admitted(out)` names the doors' "admitted, awaiting dispatch" outcome. A reopen in the same test uses a fresh `FakeLeaseStore`, because the closed process's lease is still held in the shared one |
| Migrated tests | Tests that read the entry door's send now assert `admitted(...)`, or call `dispatch(world)` and read `command_status`. In `test_conflict_relation.py`, the in-flight probe runs while a worker's send is stalled |
| An added test | `test_no_send_without_a_durable_claim`: a claim that fails to commit stops the pass with nothing sent. The "send before the claim commits" break check needed it |

**Tests** (415 passed with `scripts/safe_tests.py`, no broker variables; the full suite was run three times with the same result):

| File | Cases |
|---|---|
| `test_dispatch_revalidation.py` (22) | **Rows** (one test each): the deadline, a release bound after admission, A → B → A, the grant revoked, the session closed, a kill. The first failing row is recorded. An unrelated `ADMISSION_REFUSED` refuses nothing. **Restarts:** on the same bundle the command dispatches with no new `RELEASE_BOUND`; a restart deadline is never extended and `next_wake` comes no later than it; the in-process `next_wake`. **PRF-DSP-04:** a conflict waits, another account's entry is claimed meanwhile, and the deadline then refuses. **PRF-DSP-08:** CUJ-DSP-2; a hold and a kill after the claim leave the send in flight, and its outcome commits. **PRF-DSP-10:** the ledger busy count at the bound, with `UNCERTAIN` and `WORKING` not counted; `command_status` for `ADMITTED`, `IN_FLIGHT`, `WORKING`, `UNCERTAIN`, `REJECTED` and `REFUSED`, and an unknown key. **PRF-DSP-11:** no send loop after `not_sent`; the retry is recorded once and attempt 2 is sent; a retry at the busy bound; a retry needs the grant; a rejected command is final. **Other:** the round trip; no send without a durable claim |
| `test_bounded_io.py` (3) | CUJ-DSP-1, two accounts: B is sent while A's send is stalled; A's next command waits for A; `in_flight` reports A's age and `over_deadline` past the synthetic 2000 ms. CUJ-DSP-3: a timeout gives `UNCERTAIN`, keeps the reservation `HELD`, and is never sent again. F-D3: no cancel command is ever created |
| `test_scheduling.py` (4) | Oldest first, one claim per account per pass; a blocked older command does not stop a younger one; accounts are claimed in canonical order; `dispatch_inline` refuses beside a worker |
| `test_crash_boundaries.py` | CP-D1: the child exits while `a-1`'s send is stalled after its claim and `b-1` is admitted. On reopen, `a-1` is `AMBIGUOUS` (`interrupted`) and never sent again, and `b-1` is dispatched from the ledger alone |
| Migrated | `test_admission_checks.py`, `test_review_semantics.py`, `test_conflict_relation.py`; the setting in `test_policy_parameters.py`; the caller rule in `test_capabilities.py` |

**Break checks** (each applied, run, and reverted byte for byte with an md5 check; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Send before the claim commits | `test_no_send_without_a_durable_claim`, `test_no_send_loop_after_not_sent` |
| Skip revalidation row 5 | `test_row_5_kill`, `test_cuj_dsp_2_hold_before_the_claim` |
| Skip row 2 | both row 2 tests |
| Refuse on a conflict instead of waiting | `test_a_conflict_waits_then_the_deadline_refuses`, `test_a_blocked_older_command_does_not_stop_a_younger_one` |
| Skip the sweep | `test_a_conflict_waits_then_the_deadline_refuses` |
| One lock across all accounts | `test_cuj_dsp_1_a_slow_account_never_blocks_another`, `test_accounts_in_canonical_order` |
| Claim the newest eligible command first | 6 cases, among them `test_oldest_first_one_per_pass` |
| Let a blocked older command stop the account | `test_a_blocked_older_command_does_not_stop_a_younger_one` |
| Retry after `not_sent` without a retry request | the three retry tests |
| Run A0 before A1a | `test_retry_at_the_busy_bound` |
| Count `UNCERTAIN` in the busy count | `test_busy_count_from_the_ledger` |
| Let the decoder drop a field | 19 cases, among them `test_the_admitted_request_round_trips` |
| Re-send an uncertain claim after restart | `test_cp_d1_crash_with_a_worker_in_flight`, `test_cuj_dsp_3_a_timeout_is_ambiguous_and_never_retried` |

## Step 3 — cancel, modify and close: dispatch, ownership and completion

TASK-S05-05, with the step 2 obligations it inherits. Proof: PRF-LED-16 for cancel, modify and close (`tests/integration/test_verb_completion.py`, T-22), plus CUJ-DSP-1 rerun with a cancel as the dispatch spec states it. The authorities are the [ledger spec](../../design/ledger-and-atomic-transaction.md#command-and-attempt-state-machine) (verb-specific completion, the state table, `broker_identity`), the [execution-domain spec](../../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy) (the reconciliation finding table), the [dispatch spec](../../design/dispatch-and-coordination.md) and [SLICE-04 step 2](SLICE-04-intent-to-admission.md#ownership) (the holdings field table). Every deviation is marked **Deviation**. Reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-05-step-3-review-2026-10-28)).

### What legacy does, and what that decides

* **A broker ACK is acceptance, not completion.** Legacy's `cancel` records the broker's acceptance and leaves "whether the leg executed first" to the tradebook on the next settle pass (`src/runtime/execution_gateway/__init__.py:1265-1266` @445eb116). The target never completes a cancel, modify or close on its ACK (`README.md:750`; ledger spec, verb-specific completion).
* **A modify may name a replacement order.** Legacy takes the `orderid` of the `modifyorder` response as the replacement and records the moved level against the **same owner** (`record_stop_moved(our_id, …, replaces_broker_order_id=…)`, `__init__.py:1435-1462`). The ledger spec says the same: a replacement ID inherits the replaced order's `command_key` and `leg_role` (`broker_identity`; execution-domain finding table). Whether OpenAlgo ever returns a different ID is an endpoint fact for SLICE-07's endpoint contract.
* **A modify records its level.** Legacy records the requested trigger on ACK so the trail survives a restart (`__init__.py:1453-1463`). The target records a level only when it is observed (`confirmed_level` on `COMPLETED`); POL-014's broker level for a proven timed-out modify arrives with reconciliation (SLICE-07).
* **A close is a selective opposite-side order** capped at what is proven held (`__init__.py:1487-1499`, `:1512`). The target's close already is: a SELL of `quantity` on one owned position, capped by B2 (SLICE-04 step 2).

### Decisions

* **The broker port takes every verb.** `BrokerPort.send(request: EntryRequest | CancelRequest | ModifyRequest | CloseRequest, plan: PlanRef | None, attempt_no)`, `plan` `None` for an action ([execution-domain spec](../../design/execution-domain-and-observations.md#ports-kernelportspy)). An action's `LegResult.leg_role` is its verb. Both `adapter_error` sites (the worker and `dispatch_inline`) take the role from the verb when `plan` is `None`.
* **The verb filter goes.** Every `ADMITTED` command is eligible under step 2's rules.
* **For an action, the observation's age is checked first.** Before the conflict relation and rows 1–5, an action whose account observation fails B1's age rule (`observation_age(observation, now, max_observation_age_secs) is None`) **waits** (step 2's sweep still refuses it at its deadline). Then rows 5 and the conflict relation judge `admission.action_facts(request, order, position, observation)`: the kill row reads `remaining` and `resting` from the observation. An entry keeps step 2's payload facts.
* **Revalidation row 6 is built now (Deviation in timing).** The dispatch spec gives row 6 to SLICE-07 with the observation loop. Its logic is admission's B2 again and needs only the observation port, so it is built here; SLICE-07 binds the live observation and adds the wake on its arrival (PRF-DSP-09). Row 6 **refuses** only on proof: the target observed with a status other than `open`, `identity_mismatch`, `above_owned`, `not_owned`, or a close's position with observed `owned ≤ 0`. A target absent from the observation, `broker_net_unknown` and `filled_unknown` are observation gaps and make the command **wait** (absence is never terminal).
* **ACK identity rule (the `OUTCOME_ACKNOWLEDGED` fold).** For a **cancel**, an acknowledged leg must carry the command's `target` or no ID; it records nothing. For a **modify**, a leg carrying the `target` records nothing; a leg carrying an unknown ID is a **replacement** and records a row with the **target's** `command_key` and `leg_role` (ledger `broker_identity`; legacy `record_stop_moved`); `_load_touched` loads the target's row for this. Anything else — a cancel naming another ID, a modify naming an ID owned by another command, a replacement whose target has no row — raises `InvariantViolated` (`LED-R08`), which the coordinator records as `OUTCOME_AMBIGUOUS` `outcome_refused` for reconciliation. Entry and close legs are unchanged (an already-owned ID is `LED-R08`).
* **A replaced order leaves the group.** With the replacement owned by the same command and role, the holdings port takes, per (`command_key`, `leg_role`), only the row with the highest `first_sequence`; earlier rows were replaced and are not owned orders. So a moved protective stop stays protective (its command is still the close), and the replaced ID, which may vanish from the book, never stays "resting" for conflict rows 1, 3 and 5.
* **Ownership comes from the ledger.** `LedgerHoldings(writer, positions)` implements `HoldingsPort`: `order` and `orders` read the ledger by SLICE-04 step 2's field table; `position` and `positions` delegate to `positions` (a fixture until SLICE-07 binds the ledger's `position` table). `AdmissionPorts` gains a last keyword field `positions: object | None = None`. When it is set, `holdings` must be `None` (bootstrap raises `ValueError` if both are set), and bootstrap composes `LedgerHoldings(writer, positions)` **first** and gives the same object to `Conflicts`, both doors (`dataclasses.replace(admission, holdings=…)`) and `DispatchPorts.holdings`.
* **Capacity's `protective_order_ids`** (B5) becomes `{o.broker_order_id for o in holdings.orders(account) if is_protective(o)}`, as SLICE-04 step 2 planned. Before step 3 no protective order reached the ledger, so the set was empty.
* **Completion is a pure decision plus one recorder.** `lifecycle.completion(...)` decides a `WORKING` cancel, modify or close; `lifecycle.record_completions(writer, account, observation)` commits `COMPLETED`. SLICE-07's observation loop calls the recorder; step 3's tests call it. Entry completion needs `FILL` and stays SLICE-07's.
* **A close also completes when its order ends unfilled (Deviation).** The ledger spec completes a market close only when its order is observed filled. Observed `cancelled`, `rejected` or `expired`, it would stay `WORKING` for ever and, as an unresolved effect, block its group under conflict row 2. As the spec already does for an entry rejected after its ACK, it completes with `reason` `order_ended` — **only when `filled_quantity` is known**. With `filled_quantity` `None` the close stays `WORKING`, as the execution-domain finding table requires (escalation, POL-016, is SLICE-07's). The ledger's completion table is amended to say so.
* **A close completes before `FILL` is recorded (Deviation), with a freshness guard.** The spec's "its fills recorded by fill ID" needs `FILL` (SLICE-07). Until then a close completes on its order's observed status and `filled_quantity`, and **only when the completing observation's positions book is at least as new as its orders book** (`positions.as_of ≥ orders.as_of`). Completion ends conflict row 2's block, and the next close's B2 cap then rests on broker net, which this guard keeps no older than the fill it follows. SLICE-07 adds the recorded-fills precondition before any live composition, and must accept a late `FILL` for a `COMPLETED` close (the state table has no such row yet).
* **A limit close is resting** (SLICE-04 step 2's `action_facts`, `kernel/admission.py:363`, as built): the ledger table's "close (market or limit, not resting)" row applies to market closes only (Deviation, recorded so it is not mistaken for a gap).
* **Position IDs.** `position_id(entry_command_key, leg_role) = digest([entry_command_key, leg_role])`, one function in `kernel/ledger/projections.py`, which SLICE-07's `position` fold must use.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/execution.py` | `action_request_from_wire(d)` (cancel, modify, close) |
| `src/autonomous_trading/kernel/ports.py` | `BrokerPort.send` for every verb; `AdmissionPorts.positions` (last, keyword); `DispatchPorts` gains `holdings` and `max_observation_age_secs`, appended last |
| `src/autonomous_trading/adapters/simulated_broker.py` | `send` for cancel, modify and close (below) |
| `src/autonomous_trading/kernel/coordinator.py` | No verb filter; the action age check (wait); `_rebuild` for actions; action facts; row 6 and its wait result; both `adapter_error` roles |
| `src/autonomous_trading/kernel/admission.py` | `LedgerHoldings`; B5's `protective_order_ids` |
| `src/autonomous_trading/kernel/ledger/store.py`, `projections.py` | `COMPLETED` (family `lifecycle`, `_COMMAND_KINDS`) and its fold; the ACK identity rule and the target-row load; `position_id`; reads `owned_orders(account)` and `working_actions(account)` |
| `src/autonomous_trading/kernel/lifecycle.py` | `("WORKING", "COMPLETED"): "COMPLETED"`; `completion`; `record_completions` |
| `src/autonomous_trading/resources/events.schema.json` | `COMPLETED` |
| `src/autonomous_trading/bootstrap.py` | The `LedgerHoldings` composition order; the two `DispatchPorts` fields |
| `tests/conftest.py` | `kernel_holdings=True`; `owned_close(...)`; a cancel grant on the second account |
| `tests/integration/test_verb_completion.py` | New (T-22): PRF-LED-16 for cancel, modify and close |
| `tests/integration/test_dispatch_revalidation.py`, `test_bounded_io.py` | Action dispatch, row 6, the age wait, CUJ-DSP-1 with a cancel |
| `tests/unit/test_admission_checks.py`, `test_conflict_relation.py`, `tests/contracts/test_capabilities.py` | `LedgerHoldings` rows and capacity; the identity rule; completion freeing a group; the simulated broker's action rows |
| Spec amendments | The [ledger catalogue](../../design/ledger-and-atomic-transaction.md#event-catalogue)'s `COMPLETED` payload gains `reason` and `confirmed_quantity`; the ledger's completion table, close row, names `order_ended` (with `filled_quantity` known); the [execution-domain spec](../../design/execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy)'s script table gains the action rows |

No migration and no tree delta (T-22 is in the tree).

### The simulated broker for actions

* `send(request, None, n)` takes the account's next step as for an entry; `stall`, `not_sent`, `reject`, `timeout` and `raise` behave the same. The leg role is the verb.
* `ack` for a cancel returns the target's ID; an `order_id` on a cancel step is a test bug (it raises). `ack` for a modify returns the target's ID, or the step's `order_id` (a replacement). `ack` for a close needs `order_id` (its new order).
* The published evidence content is an entry's, with the request's own wire form.

### Ledger

* **`COMPLETED`** (family `lifecycle`, in `_COMMAND_KINDS`), principal `lifecycle.LIFECYCLE`. Payload `observation_digest` (string: the orders observation's digest), `filled_quantity` (integer or null), `confirmed_level` (string or null), `confirmed_quantity` (integer or null), `reason` (string: `cancelled`, `target_terminal`, `parameters_observed`, `filled`, `order_ended`, `resting_observed`). Guard `WORKING`. Fold: `WORKING → COMPLETED`; an entry's reservation (none for actions) `RELEASED`.
* **`owned_orders(account)`**: `broker_identity` rows of kind `order_id` with a non-null `leg_role`, joined to their `command_identity` on the account and to that command's `COMMAND_ADMITTED` payload: `broker_order_id`, `command_key`, `leg_role`, `verb`, `strategy`, `underlying`, `first_sequence`, the payload's `plan_ref`, `request` and `resulting_exposure`. A row whose `leg_role` is `NULL` (an unassigned leg) gives no owned order.
* **`working_actions(account)`**: the account's `WORKING` commands whose verb is not `entry`, with `command_key`, `verb`, the `COMMAND_ADMITTED` payload's `request` and `target`, and the latest attempt (its `legs` and `claimed_at`).
* **`LedgerHoldings.order` / `orders`** build `OwnedOrder` per row (after the per-command-and-role "latest row" rule above):

| `OwnedOrder` field | Entry leg | Close (and its replacements) |
|---|---|---|
| `verb`, `strategy`, `underlying`, `command_key`, `leg_role`, `account` | the command's | the command's (the close's, also for a replacement) |
| `instrument`, `side`, `order_kind` | the `plan_ref` leg of that role; `BUY`; `limit` with a limit price, else `market` | the single key of the close's `resulting_exposure` (its position's instrument, recorded at admission); `SELL`; `request.order.kind` |
| `position_id` | `position_id(command_key, leg_role)` | `request.position_id` |
| `managed_by_protection` | key prefix `prot:` | key prefix `prot:` |

  A basket's `stop` and `target` legs arrive with `PlanRef.protective_legs` in SLICE-06 ([Q-013](../../decisions/owner-answers-2026-10-27.md)).
* **Cost (A09-F4).** `orders(account)` reads every owned order of the account on each call; a one-leg buyer places tens a day. A per-pass cache is not built (its invalidation is a risk of its own); the read is measured with the other dispatch reads.

### Dispatch of actions and row 6

| Step | Check | Result |
|---|---|---|
| Age (actions) | `observation_age(observations.latest(account), now, max_observation_age_secs)` | `None`: wait |
| Conflicts, rows 1–5 | as step 2, with `action_facts` from that observation | as step 2 |
| 6 (actions) | the target absent from the observation, or `effect_check` giving `broker_net_unknown` or `filled_unknown` | wait |
| 6 (actions) | `effect_check` giving any other reason | `ADM-R07`, `dependency` `target`, message `effect_mismatch` |

* `_revalidate` returns a refusal, `None`, or `"wait"`; `run_pass` adds a waiting key to `waiting` and goes on to the next command. `dispatch_inline` (entries only) never reaches the action steps.
* `_rebuild` for an action: `action_request_from_wire(payload["request"])`, plan `None`; it checks `wire(request) == payload["request"]` and `request_digest(request) == payload["request_digest"]`.

### `kernel/lifecycle.py` — completion

```text
completion(verb, request, judged_order_id: str | None, observation) -> Completion | None
Completion(reason, filled_quantity: int | None, confirmed_level: str | None, confirmed_quantity: int | None,
           observation_digest)
record_completions(writer, account, observation) -> list[str]     # the command keys completed
```

* **The judged order:** a cancel's target; a modify's latest attempt leg's `broker_order_id` (the target or its replacement); a close's own order (its latest attempt leg's ID). Its observed row is the single `observation.orders.items` entry with that ID; none, or more than one, decides nothing (absence is never terminal). Terminal statuses: `filled`, `cancelled`, `rejected`, `expired`.

| Verb | Completes when | `reason` | `confirmed_level`, `confirmed_quantity` |
|---|---|---|---|
| cancel | the target is observed terminal | `cancelled` if `cancelled`, else `target_terminal` | — |
| modify | the judged order is observed `open` with every non-`None` requested field equal: `trigger_price`, `limit_price` (the row's `price`), `quantity` (the row's `quantity`) | `parameters_observed` | by the target's `order_kind`: a stop's `trigger_price`, a limit's `price`; the row's `quantity` |
| modify | the judged order is observed terminal | `target_terminal` | — |
| close, market | its order is observed `filled` with `filled_quantity` known | `filled` | — |
| close, market | its order is observed `cancelled`, `rejected` or `expired` with `filled_quantity` known | `order_ended` | — |
| close, stop or limit (resting) | its order is observed `open` with `quantity` equal to the request's and, for a stop, `trigger_price` (and `price` when it has a limit) equal; for a limit, `price` equal | `resting_observed` | a stop's trigger, a limit's price; the row's `quantity` |
| close, stop or limit | its order is observed terminal before it was seen resting, `filled_quantity` known | `filled` if `filled`, else `order_ended` | — |

* `filled_quantity` is the judged order's observed `filled_quantity`.
* A modify observed `open` at other levels stays `WORKING`; reconciliation escalates it in SLICE-07 (POL-014's proven level arrives there).
* Money values compare as decimals.
* **`record_completions`** decides nothing when the observation fails B1's age rule, or when its `orders.as_of` is not later than the command's latest `claimed_at` (a book read before the send proves nothing about it). A close also needs `positions.as_of ≥ orders.as_of` (the freshness guard). Each `Completion` is committed with guard `WORKING`; `LED-R09` (no longer `WORKING`) is skipped, any other refusal raises `WriterLost`. The caller supplies the account's latest observation.

### Step 3 tests

* **Fixtures** (conftest):
  * `kernel_holdings=True`: `holdings=None`, `positions=FixtureHoldings()`, seeded through `world.ports.positions.position_rows`; `action_world` is not used with it. With `two_accounts=True` it also issues `g-act-2` (cancel, modify, close) on the second account.
  * `owned_close(world, key, order, *, quantity=50, order_id="o-close", position=None) -> str`: seeds an owned position (owned 50, observed net 50) unless given; appends `{"result": "ack", "order_id": order_id}` to `world.comp.broker.responder.steps`; admits the close; `dispatch(world)`; adds `make_observed_order(broker_order_id=order_id, …)` (open, at the request's levels) to `world.orders`; `world.fresh()`; returns the key.
* `test_verb_completion.py` (PRF-LED-16), each verb dispatched through the loop:
  * never on the ACK alone: with the order still `open` at its old level, `record_completions` completes nothing; nor with an observation older than the claim;
  * cancel: target observed `cancelled` → `cancelled`; `filled` → `target_terminal`; absent → nothing;
  * modify: the requested trigger observed → `parameters_observed` with `confirmed_level` and `confirmed_quantity`; another trigger → stays `WORKING`; target terminal → `target_terminal`; a replacement ACK: the replacement is owned by the close with the stop's role, is protective, the replaced ID is no longer an owned order, and completion reads the replacement;
  * close, market: observed `filled` → `filled`; observed `rejected` with `filled_quantity` 0 → `order_ended`; with `filled_quantity` `None` → stays `WORKING`; a positions book older than the orders book → nothing;
  * close, resting stop: observed `open` at its trigger and quantity → `resting_observed`; at another quantity → nothing; observed `filled` first → `filled`;
  * a `COMPLETED` command is no longer an unresolved effect: the group's conflict clears;
  * the dispatched cancel, modify and close each end `WORKING` with no `OUTCOME_AMBIGUOUS`.
* `test_dispatch_revalidation.py`: a cancel, modify and close claimed and sent with `plan` `None`; row 6 refuses a cancel whose target is observed `cancelled` and a close whose position is observed at 0 (`ADM-R07`, `target`); a target absent from the observation waits; a stale observation makes an action wait (not refuse) before its facts are judged; under a kill, a cancel of an order whose observed remaining quantity is 0 is refused `PRT-R01` at row 5.
* `test_bounded_io.py`: CUJ-DSP-1 as the dispatch spec states it: account A's entry send stalled, account B's admitted cancel of its own acknowledged entry order is sent.
* `test_admission_checks.py`: `LedgerHoldings` rows for an entry leg and a close (each field of the table); a resting close's order is protective and excluded from B5's external commitments; a cancel ACK records no identity row; a cancel ACK naming another ID, and an entry ACK naming an owned ID, give `outcome_refused`; `positions` and `holdings` both set raise.
* `test_capabilities.py`: the simulated broker's action rows.
* **Break checks** (named in the docstrings):
  * complete a cancel on its ACK;
  * treat an order absent from the observation as terminal (completion, or row 6 refusing);
  * complete a modify on any open observation, whatever its level;
  * complete a close with `filled_quantity` `None`;
  * skip row 6;
  * refuse an action on a stale observation instead of waiting;
  * build an action's facts from the payload (the kill test);
  * record a cancel ACK's echoed ID as a new owner;
  * leave the identity fold unchanged (the cancel ends `UNCERTAIN`, `outcome_refused`);
  * give a replacement the modify's own command key (the moved stop is not protective);
  * keep a replaced order as an owned order;
  * drop `is_protective` from B5's `protective_order_ids`;
  * keep the entry-only filter.

### Step 3 as built

Commit `a4c4516` on `slice-05`, after `68570b0`. It changes 16 paths: the step 3 files table's code and test files. The spec amendments are this repository's.

**Choices made while building** (none sets a money value):

| Topic | As built |
|---|---|
| `record_completions` | The signature is `(writer, account, observation, *, max_age_secs)`. B1's age rule needs the limit, and the caller passes `reconciliation.max_observation_age_secs` |
| One row rule, two readers | `admission.owned_order_from_row(account, row)` builds an `OwnedOrder` from one `owned_orders` row. `LedgerHoldings` uses it, and so does completion's lookup of a modify target's `order_kind` (`lifecycle._target_kind`), which also reads replaced rows. A target with no ledger row (the fixture worlds) falls back to the requested field: trigger for a stop, else price |
| Order inside a pass | For an action, `run_pass` checks the round trip first, then the observation's age (wait), then the conflict relation, then rows 1–6. A request that does not round-trip stops the kernel before anything is judged |
| A completed resting close | Its order stays owned and protective after `COMPLETED`: the stop still guards the position, and conflict rows 1, 3 and 5 still see it (`test_resting_stop_close`) |
| One pass, several completions | `record_completions` judges every `WORKING` action of the account. A test that cancels or modifies a resting close's stop therefore also sees the close itself complete, and asserts membership of the command it judges |
| The negative identity case | No simulated step can make a cancel ACK name another order (a cancel step with `order_id` raises). `test_a_cancel_ack_naming_another_order_is_refused` wraps the simulated broker, keeps its published evidence, and rewrites the ACK's order ID, so the outcome reaches the fold |

**Tests** (441 passed with `scripts/safe_tests.py`, no broker variables; the full suite was run three times with the same result):

| File | Cases |
|---|---|
| `test_verb_completion.py` (12) | Never on the ACK alone, nor on a book read before the claim. **Cancel:** absent; `cancelled`; `target_terminal`; the unresolved effect clears. **Modify:** another level stays `WORKING`; `parameters_observed` with `confirmed_level` and `confirmed_quantity`; `target_terminal`; a replacement inherits the close, is protective, supersedes the old ID and is the one judged. **Market close:** `filled`; `order_ended`, with a `None` fill total staying `WORKING`; the positions-book freshness guard. **Resting stop close:** another quantity; `resting_observed` (the order still owned and protective); `filled` before it was seen resting |
| `test_dispatch_revalidation.py` (+6) | Cancel, modify and close sent with no plan, each leg's role its verb, each command `WORKING`. **Row 6:** refuses a cancel of an observed `cancelled` order; refuses a close of a position observed at 0; waits on an absent target. A stale observation makes an action wait. The kill row reads the observation at dispatch |
| `test_bounded_io.py` (+1) | CUJ-DSP-1 with a cancel: B's cancel of its own acknowledged entry order is sent while A's entry send is stalled |
| `test_admission_checks.py` (+6) | `LedgerHoldings` rows for an entry leg and a close (every field of the table); a resting close's 9000.00 is not counted as an external commitment; a cancel ACK records no owner; a cancel ACK naming another order, and an entry ACK naming an owned order, end `outcome_refused`; `holdings` and `positions` set together raise |
| `test_capabilities.py` (+1) | The simulated broker's action rows |

**Break checks** (each applied, run, and reverted byte for byte with an md5 check; every one failed its tests):

| Change | Tests that failed |
|---|---|
| Complete a cancel on its ACK | `test_never_on_the_ack_alone` |
| Treat an absent order as terminal (completion) | `test_cancel` |
| Treat an absent order as terminal (row 6 refuses) | `test_row_6_waits_on_an_absent_target` |
| Complete a modify on any open observation | `test_modify_parameters_observed` |
| Complete a close with `filled_quantity` `None` | `test_market_close_ended` |
| Skip row 6 | the three row 6 tests |
| Refuse an action on a stale observation | `test_a_stale_observation_makes_an_action_wait` |
| Build an action's facts from the payload | `test_kill_row_reads_the_observation_at_dispatch` |
| Record a cancel ACK's echoed ID as a new owner | 8 cases, among them `test_never_on_the_ack_alone` |
| Leave the identity fold unchanged | 11 cases |
| Give a replacement the modify's own key | `test_modify_replacement_inherits_the_close` |
| Keep a replaced order as an owned order | `test_modify_replacement_inherits_the_close` |
| Drop `is_protective` from B5's `protective_order_ids` | `test_a_resting_close_is_not_an_external_commitment` |
| Keep the entry-only filter | 23 cases |

## Completion conditions

1. Every SLICE-01…04 test and every test of the built steps passes in a clean environment with no broker variables.
2. The break checks named in each new test file's docstring were tried and reverted.
3. Each step's file list matches its commit.

## Prerequisites

SLICE-04 as built. No open owner question.
