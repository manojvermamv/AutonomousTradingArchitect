# Final package zoom-out

* **Target:** the whole package, excluding `process/` and SLICE-01 (reviewed at stage 9).
* **Reviewer (direct dispatch, fresh, read-only):** `egm:egm-zoom-out` with the zoom-out standard.
* **Date:** 2026-10-26.
* **Verdict as reported:** the package shape is close to the simplest that serves the goal; one money decision was being made silently, some ownership gaps would force architecture choices, and the derived index documents had drifted.

Counts: 1 Blocker, 10 Major, 8 Nit.

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| P-B1 | Blocker | Protection placement silently decides the master's open "planned vs fill-based protection" choice; legacy basket misstated | Q-013 raised with the refusing parameter `protection.placement`; LD-22; the alternatives row corrected; SL-M recorded as legacy evidence; SLICE-06 and TASK-S06-01 depend on Q-013 |
| P-M1 | Major | The cross-document check does not exist | FIX: [consistency/cross-document-check.md](../../consistency/cross-document-check.md) written with the checker's text and output |
| P-M2 | Major | Traceability matrix malformed (phantom column) and proof lists diverged | FIX: generator fixed to take each key's proofs from its spec; regenerated |
| P-M3 | Major | "Authenticated owner" widened to any human principal | Q-014 raised; matrix and grants keep owner-only (the approved wording and legacy `OwnerCommand`) until answered |
| P-M4 | Major | `account.max_worst_case_loss` value taken from legacy | Q-015 raised; the legacy value is evidence only |
| P-M5 | Major | Foreign-exposure response decided silently | Q-016 raised with the refusing parameter `reconciliation.foreign_response` |
| P-M6 | Major | Policy-inventory acceptance untracked | X-006 raised |
| P-M7 | Major | Durable evidence store has no module | X-007 raised; contract specified in the ledger spec; tree delta T-23 |
| P-M8 | Major | Candidate identity depends on the research lane | FIX: the identity contract defines a retained strategy's candidate manifest |
| P-M9 | Major | Refusing-parameter register incomplete; no task produces measured values | FIX: single register in cross-cutting invariants with producing task and approver; TASK-S11-07 |
| P-M10 | Major | Slice, proof and question mapping drifted across five places | FIX: spec Delivery tables declared the source; plan rewritten from them; build order stated |
| P-N1 | Nit | Three deciders of `DISPATCH_RETRY_REQUESTED` | FIX: admission records it; dispatch and protection cite it |
| P-N2 | Nit | `PAUSE_STARTED` commit point | FIX: ledger catalogue aligned |
| P-N3 | Nit | X-005 reach | FIX: blocks TASK-S03-02 |
| P-N4 | Nit | Count and name drift | FIX: T-01…T-23, I-1…I-6 |
| P-N5 | Nit | YAGNI: one-value ordering parameter; clock-quality recording | FIX: ordering fixed until Q-004; clock recording kept (it gates nothing and is off until bound) |
| P-N6 | Nit | Duplicate legacy-name maps | CONTEST: the README map is the newcomer's one-page index; the module index and spec reuse sections carry the line-level evidence |
| P-N7 | Nit | "Unresolved" has two meanings | FIX: "unresolved attempt" and "unresolved effect" in the glossary |
| P-N8 | Nit | Stage 9 record missing | FIX: [plan/review.md](../plan/review.md) |
