# 00 — Provenance

Status: **verified fact** (recorded 2026-10-26, 11:36 UTC, from read-only git commands in this session).

This package is derived from two pinned repositories. Every citation in it refers to these revisions unless a different revision is named next to the citation.

## Architecture repository (ATA) — the target-design baseline

| Field | Value |
|---|---|
| Local path | `C:\Users\Manoj\Desktop\Office_2016\AutonomousTradingArchitect` (fresh clone made for this package) |
| Remote | `https://github.com/manojvermamv/AutonomousTradingArchitect` |
| Branch | `main`, tracking `origin/main`, 0 ahead / 0 behind |
| Pinned HEAD | `b9bb32c2f29dfd7c49e059497aa89d7afd5ffe18` — "Align architecture diagrams contracts and roadmap with accepted decisions" (2026-10-26 10:33:31 UTC) |
| Working tree before this package | clean: no modified, untracked or ignored files, no stash |
| Other remote branch | `origin/autonomous-trading-architecture-audit-6e142` at `3902e1f1b34a1ee4ab0e0b97c2a8167c03e2e41d` — not part of `main`; not used |
| Additions made by this package | only files under `specs/implementation/` (proved in [consistency/cross-document-check.md](consistency/cross-document-check.md)) |

Baseline documents and their size at the pinned HEAD: `README.md` (1,374 lines), `ROADMAP.md` (470 lines), `AGENTS.md` (92 lines), `PROMPT-CLEAN-REBUILD-DESIGN.md` (protected, unchanged since `1a5cc1f`).

## Legacy repository (AT) — read-only evidence and reuse candidates

| Field | Value |
|---|---|
| Local path | `C:\Users\Manoj\Desktop\Office_2016\OA` (the EC2 path `~/AutonomousTrading` in older documents means this checkout) |
| Branch | `claude/openalgo-trading-architecture-uu1bxn` |
| Pinned HEAD | `445eb116514d97c2574c44d4d5374f938dec57a3` (committed 2026-10-23 12:47:53 UTC); equals the remote branch head per `git ls-remote` on 2026-10-26 |
| Untracked | `tests/test_invariance_harness.py` — a working-tree addition, **not** part of the pinned baseline; not used as evidence |
| Git-excluded (`.git/info/exclude`) | `.claude/skills/be-ambitious/` (a skill install), `.claude/worktrees/` — tooling, not evidence |
| Ignored build/cache output | `.pytest_cache/`, `admin_console/.next/`, `admin_console/node_modules/`, `docs/diagrams/out/`, `__pycache__/` trees — not evidence |
| Not used | `OA-damaged/`, `at-as1/` siblings (a damaged copy and a separate worktree) |
| Upstream mirrors | `./openalgo` and `./quantdinger` submodules are **not checked out** on this machine; upstream OpenAlgo claims therefore cite the master README's recorded pins, not fresh reads |

The master README audited this same AT revision (`README.md:3`, `:217`). Legacy findings cited here were re-read at `445eb116` in this session unless marked **historical**.

## Instruction files read

| File | Applies to |
|---|---|
| ATA `AGENTS.md` (92 lines) | All work in this package |
| AT `AGENTS.md` | Reading the legacy repository only (hard rules: never gate sends on mode, never change money policy, read-only) |
| `C:\Users\Manoj\.claude\CLAUDE.md` | Tool use (CodeGraph first for AT code questions) |
| EGM plugin `0.1.0` (`C:\Users\Manoj\.claude\plugins\cache\egm\egm\0.1.0\`): its `<plugin>/docs/claude.md`, `<plugin>/skills/egm_{brainstorm,draft,review,review_loop,resolve}/SKILL.md`, `<plugin>/skills/egm_draft/references/design_doc.md`, `<plugin>/resources/execution_instructions.md`, `<plugin>/resources/document_standards/*.md`, `<plugin>/agents/synthesizer.md`, `<plugin>/agents/zoom_out.md` | Drafting and review method |
| be-ambitious `SKILL.md` (`C:\Users\Manoj\.claude\skills\be-ambitious\`, commit `dc116a3`) | Setting the package's bar ([01-ambition.md](01-ambition.md)) |

## Owner choices made for this package run

| Date (UTC) | Choice | Effect |
|---|---|---|
| 2026-10-26 | EGM depth: **scoped autonomous** | One package-wide Goldfish brainstorm; specs drafted without per-section approval gates; EGM review stages 5–8 per domain spec in uninterrupted mode; stage 9 (implementation readiness) on the delivery plan and slices; a final zoom-out over the package. Findings that would change an accepted decision or money policy become X or Q items, never silent edits. |

## Evidence limits

- No application code was imported or executed. No tests of either repository were run.
- No broker, OpenAlgo endpoint, EC2 host, service or production store was contacted.
- No protected locked-OOS data was opened.
- `docs/OWNER-DECISIONS.md` in AT is a **historical record**: each policy row in [02-policy-inventory.md](02-policy-inventory.md) says whether its behaviour was re-verified in AT code at `445eb116` or rests on the record alone.
- Deployed-host values (for example promotion-bar overrides in a host `owner.yaml`) are not visible from the repository and are marked **unverified deployment claim**.
