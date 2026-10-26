# Test strategy

* **Status:** proposed.
* **Precedence:** master README, then ROADMAP, then this file. The method is the master's accepted A08 decisions (`README.md:1205-1215`); this file only applies them to the package's proofs.
* **Scope:** the target repository's `tests/` tree (README §6, `README.md:1101-1121`) and the package's proof IDs (`PRF-*`).

## Proof classes and status

| Class | What it is | Counts as proof of |
|---|---|---|
| **T** | A named pytest node plus a table of expected outcomes written in the spec before the code exists | Engineering behaviour under synthetic or recorded inputs |
| **K** | A check script (read-only) | Document or artifact consistency only |
| **R** | A recorded review or owner decision | That a choice was made, not that code works |
| **M** | A deployment or broker measurement under its own authorization | Behaviour of the real deployment |

| Status | Meaning |
|---|---|
| *specified* | Expected outcomes are written; no code yet. **All package proofs are at this status on 2026-10-26.** |
| *executable* | The test exists and runs |
| *passing* | The test passed on a named commit, recorded with that commit |

Nothing *specified* is ever reported as *passing*.

## Rules (A08 applied)

1. **Fresh, requirement-owned tests** (A08-F1). Every test names its requirement key. Legacy tests are read for scenarios only; none is ported in bulk.
2. **Behaviour and justified boundaries** (A08-F2). Structural checks exist only for proven constraints. Examples: no live adapter in a simulation (PRF-XC-02), no I/O in the planner (PRF-ADM-03), no write path in the observer (PRF-DOM-06).
3. **Independent expected outcomes** (A08-F3).
   * Expected values come from the decision text or a hand calculation written in the test, never from calling the implementation.
   * Each test file states the rule whose removal makes it fail (its **break check**).
   * Legacy comparisons (PRF-ADM-07, PRF-PRT-08) cover only named retained behaviour.
4. **Self-contained composition** (A08-F4).
   * Fixtures create temporary ledgers and inject `RecordedClock`.
   * `scripts/safe_tests.py` refuses broker variables.
   * No test reads the legacy checkout, a production store or a credential.
   * Synthetic policy values carry a `synthetic` label (REQ-XC-003).
5. **Lean risk coverage** (A08-F5). Three groups:
   * fast `unit/`;
   * focused `integration/` and `contracts/`;
   * separately run `recovery/` and `isolation/` campaigns.

   A process crash is a real crash (a subprocess calls `os._exit` at a named fault point), not an exception. Power loss is not claimed.

## Fault injection

* **Mechanism.** Crash points are named in the specs (CP-L*, CP-D*, CP-S*, CP-P*, CP-O*). A test-only `FaultPlan`, accepted only by the simulation composition (PRF-XC-02), calls `os._exit(86)` at the named point inside a subprocess.
* **What the test then does.** It reopens the ledger in the test process, runs recovery and compares the state with the crash-point table.
* **Persistence failures.** SLICE-01 injects a commit failure with the legacy fault VFS (`apsw.FullError` from `xWrite`, PRF-LED-07). TASK-S02-04 adds the I/O-error and read-only-remount variants in the `isolation/` group.

## Stateful property tests

Hypothesis rule-based state machines (planned dependency, test-only) are used **only** for ledger, lifecycle and reservations (PRF-LED-09). That is where interleavings matter most:

* **Rules:** admit, claim, outcome, fill, resolve and crash/recover.
* **Invariants:** I-1…I-6 from the [ledger spec](../design/ledger-and-atomic-transaction.md#command-and-attempt-state-machine).

## Coverage map (prompt areas → proofs)

| Risk area | Proofs |
|---|---|
| Concurrency | PRF-LED-09, PRF-DSP-05, PRF-SES-05 |
| Partial fills | PRF-LED-09, PRF-DOM-02 (SLICE-07) |
| Uncertain broker effects | PRF-LED-05, PRF-DSP-06, PRF-PRT-03 |
| Delayed and conflicting observations | PRF-DOM-02, PRF-DOM-08, PRF-DSP-04 |
| Process, storage and host failure | PRF-LED-05/07, PRF-PRT-06, PRF-SES-07 (M) |
| Clock and session transitions | PRF-SES-03, PRF-SES-04 |
| Kernel failure and protection continuity | PRF-PRT-06, REQ-MIG-008 proofs (SLICE-11/14) |
| Restored authorization and evidence custody | PRF-SES-06, REQ-RES-005 proofs (SLICE-12) |
| Schema and artifact compatibility | PRF-LED-08, REQ-CFG-005 proofs (SLICE-11) |
| Release rollback limits | REQ-CFG-005, REQ-MIG-002 proofs (SLICE-11/14) |

## Legacy scenarios worth reading (not porting)

The master names these as useful scenarios (`README.md:389`). They are read when the matching slice starts.

| Legacy test @445eb116 | Read for | Slice |
|---|---|---|
| `tests/test_tier1_crash_matrix.py:100` | No-resend recovery scenarios | SLICE-01/02 |
| `tests/test_tier1_durability.py:117` | Killing a real writer process | SLICE-02 |
| `tests/test_trials.py:151` with `src/analysis/core/trials.py:666` | Failed-attempt accounting | SLICE-12 |
| `tests/test_framework_trail_replay.py` | Retained ladder behaviour (named scope only) | SLICE-06 |

The master also names legacy tests that encode legacy constraints and are **not** target requirements: `tests/test_packaging.py:119`, `:135`, `tests/test_pattern_centralisation.py:209` and `tests/test_temporary_changes.py:15` (`README.md:389`).
