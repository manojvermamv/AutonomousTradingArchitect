# EGM working records (process; not on the reading path)

These files record how the package was stress-tested with the Elephant-Goldfish Model (EGM plugin `0.1.0`). They are process evidence. They are not requirements and do not count as decisions.

## How EGM was applied in this run

The owner chose **scoped autonomous** EGM on 2026-10-26 ([00-provenance](../00-provenance.md)). That choice gives standing approval for these steps:

| EGM step | As run here |
|---|---|
| Brainstorm (`egm_brainstorm`) | One package-wide run with six lenses → [package/concepts_brief.md](package/concepts_brief.md). The owner then chose to re-cut the package as the brief recommended. |
| Draft (`egm_draft`) | Specs drafted section by section without per-section approval gates; the owner reviews the finished package. |
| Review (`egm_review`) | Stages 5–8 (Feature spec only) run uninterrupted, using **direct dispatch** of fresh `egm:egm-*` reviewers: never forked, never resumed, with bounded context. Stage 9 runs on the delivery plan and SLICE-01. A final zoom-out covers the package. |
| Resolve (`egm_resolve`) | Each finding is classified PROPOSE FIX or CONTEST. A fix that stays inside accepted decisions is applied. A finding that would change an accepted decision or a money policy becomes a Q or X item. Contested findings keep their evidence. |

## Files

* **One folder per reviewed spec.** Each holds `review.md`, with the stage 5–8 findings by reviewer and the resolution table with what was applied, contested or turned into a Q or X item.
* **`plan/`** holds the stage 9 review of the delivery plan and SLICE-01.
* **`package/`** holds the brainstorm brief and the final package zoom-out.
