Act as lead architect and implementation planner for the future AutonomousTrading project. Build its specification and implementation-plan package in AutonomousTradingArchitect, using the be-ambitious skill to set the bar and the Elephant-Goldfish Model (EGM) to draft and stress-test every specification.

EGM artifact directory: specs/implementation/egm

## 1. Machine paths (Windows; the shell is Git Bash)

| Role | Path | Access |
|---|---|---|
| Architecture repo (ATA) | `C:\Users\Manoj\Desktop\Office_2016\AutonomousTradingArchitect` (`/c/Users/Manoj/Desktop/Office_2016/AutonomousTradingArchitect`), branch `main` | Write **only** under `specs/implementation/` |
| Legacy evidence (AT) | `C:\Users\Manoj\Desktop\Office_2016\OA`, branch `claude/openalgo-trading-architecture-uu1bxn` | Read-only |
| EGM plugin root | `C:\Users\Manoj\.claude\plugins\cache\egm\egm\<version>\` (resolve the one installed version directory; it is 0.1.0 today) | Read-only |
| be-ambitious skill | `C:\Users\Manoj\.claude\skills\be-ambitious\SKILL.md` | Read-only |

- If the ATA directory does not exist, clone it with `git clone https://github.com/manojvermamv/AutonomousTradingArchitect "C:\Users\Manoj\Desktop\Office_2016\AutonomousTradingArchitect"`. If it does exist, check that `git status` is clean, then fast-forward only.
- Never use a temporary or scratchpad clone. Never use `OA-damaged`, `at-as1` or `~/AutonomousTrading`; those paths are EC2 or stale copies.
- `~/AutonomousTradingArchitect` and `~/AutonomousTrading` in AGENTS.md or older documents mean the two paths in the table above.

## 2. Authority and permissions

- **Instructions to follow:** ATA `AGENTS.md`, and AT `AGENTS.md` only where it governs reading that repository.
- **Target-design baseline:** ATA `README.md` and `ROADMAP.md` at the pinned commit. This includes:
  - D01–D16, AUD-01–AUD-05, A01–A10 and Combined-F1–F6;
  - the scoped policy-baseline direction;
  - the accepted ATA-05/01/04/03/06 refinements, and the recorded ATA dispositions (ATA-07 rejected; ATA-08 and O-1 optional; ATA-09 corrected).
- **Role of the generated package:** it implements and traces the baseline. It never redefines it.
  - If the package and a master document disagree, the master document wins. Record the disagreement with file:line citations in `consistency/master-contradictions.md`, and never repair it silently.
  - No external audit recommendation becomes an accepted decision.
- **Authorized:**
  - creating and revising Markdown files under ATA `specs/implementation/`;
  - read-only git, `rg` and codegraph commands;
  - running EGM reviewer subagents.
- **Not authorized:**
  - editing any other ATA path, including root files, `README.md`, `ROADMAP.md`, `AGENTS.md`, `PROMPT-CLEAN-REBUILD-DESIGN.md`, `src/`, `components/`, `data/`, `index.html`, the package and build files, and `.github/`;
  - running `npm`;
  - any edit to AT;
  - commits or pushes;
  - application code, production changes or broker-changing requests;
  - access to protected locked-OOS data.
- **Repo-root safety:** the Vite/Pages build bundles only `index.html`, `src/`, `README.md` and `ROADMAP.md`, so Markdown under `specs/` cannot affect it. Prove that at the end with `git status --porcelain`: only `specs/implementation/` paths may appear.

## 3. Package layout (create exactly this; extend only inside it)

```text
specs/implementation/
├── README.md                    # Index, reading order, status legend, ID scheme, provenance summary
├── 00-provenance.md             # Both repos: branch, full SHA, dirty/untracked/excluded files, instructions read
├── 01-ambition.md               # be-ambitious plan: goal beyond goal, ladder, depth answers, outside judges
├── 02-policy-inventory.md       # Scoped policy baseline rows (POL-*)
├── 03-requirements.md           # Scoped requirements (REQ-<area>-NNN)
├── 04-capabilities-and-scope.md # Capability inventory, full target vs first release vs deferred, exclusions
├── 05-repository-tree.md        # The one canonical, fully commented target tree (documentation only)
├── design/                      # One finalized spec per domain, each EGM-reviewed
│   ├── kernel-authority-and-sessions.md
│   ├── ledger-transactions-identity-accounting.md
│   ├── dispatch-conflicts-scheduling.md
│   ├── protection-and-reconciliation.md
│   ├── execution-domain-and-observations.md
│   ├── market-data-and-canvas.md
│   ├── shared-live-paper-replay-engine.md
│   ├── strategies-and-cognition.md
│   ├── research-rl-custody-promotion.md
│   ├── security-and-operator.md
│   ├── configuration-artifacts-release.md
│   ├── runtime-isolation-observability-deployment.md
│   └── migration-recovery-rollback-continuity.md
├── traceability.md              # REQ → decision → POL → module → TASK → proof
├── plan/
│   ├── delivery-plan.md         # Dependency-ordered vertical slices
│   └── slices/SLICE-NN-<name>.md
├── tests/test-strategy.md       # Fresh A08 suite design and selective reuse evidence
├── decisions/owner-questions.md # Q-NNN with Requirement/Owner/Proof, options, recommendation, dependent tasks
├── consistency/
│   ├── master-contradictions.md # X-NNN with exact README/ROADMAP citations
│   └── cross-document-check.md  # Results of the final consistency pass
└── egm/                         # EGM working artifacts (concept briefs, drafts, review reports)
```

- **IDs:** POL, REQ, CAP, TASK-S<slice>-NN, Q and X. IDs are stable and never reused.
- **Status labels:** accepted (master) · verified fact (with evidence) · proposed · pending proof · open owner decision · historical · rejected · deferred · superseded.
- **Links:** relative links only.
- **Target-tree placement:** `05-repository-tree.md` describes the future AutonomousTrading repository. Never create it as real folders in ATA, where the root `src/` is the preview site.

## 4. Workflow

### Phase 0 — Provenance
- Record branch, full HEAD SHA, upstream status, uncommitted, untracked and git-excluded files for both repositories. AT currently has an untracked `tests/test_invariance_harness.py` and an excluded `.claude/skills/be-ambitious`.
- Separate the pinned baseline from working-tree additions.
- List the instruction files read.

### Phase 1 — Set the bar with be-ambitious
- Invoke the `be-ambitious` skill on: "Produce the AutonomousTrading specification and implementation-plan package defined in this prompt."
- Treat this as a task, but stop after the plan and record it in `01-ambition.md`:
  - the goal beyond the goal;
  - the Altitude ladder;
  - Felix's four Depth answers;
  - the outside judges and pass criteria for the package.
- **Better, not bigger:** it may raise standards and proof, never scope, policy or permissions.

### Phase 2 — Policy inventory first
- Populate `02-policy-inventory.md` before any dependent spec claims completeness.
- Each row gives:
  - the policy or behavior;
  - the decision ID and date, with pinned evidence (AT `docs/OWNER-DECISIONS.md` is a historical record, verified against code where possible);
  - its scope (strategy, family, account, environment);
  - any supersession;
  - code-verified behavior, versus unverified deployment claims;
  - the target owner module;
  - its status (applicable approval, historical or host-specific, superseded, conflict, or open);
  - an independent expected outcome.
- Do not turn host values into universal defaults. A backup cadence does not settle RTO, failover or evidence reconstruction.

### Phase 3 — EGM per domain
For each `design/` spec, run the EGM loop.

- **How to invoke EGM skills:** read the skill file under `<EGM root>\skills\` and follow it in this thread. EGM skills refuse the Skill tool by design.
- **Brainstorm** (`egm_brainstorm/SKILL.md`): writes `egm/<domain>/concepts_brief.md`. It frames boundaries and failure modes before deciding what to reuse.
- **Draft** (`egm_draft/SKILL.md`): writes `egm/<domain>/design_draft.md`. Finalize it into `design/<domain>.md`.
- **Review** (`egm_review/SKILL.md`, with `egm_review_loop` and `egm_resolve`):
  - Each reviewer is a NEW `egm:egm-*` subagent: zoom-out, comprehension, design, codebase-details, structural, style, implementation-readiness. Use `egm:egm-synthesizer` where useful.
  - Never fork or resume a reviewer.
  - Pass only absolute target, persona and standard paths, plus explicit Goldfish context. Reviewers cannot open URLs, so save any needed page as a file under `egm/`.
  - Keep stages sequential; parallelize only within a stage.
  - Write the reports to `egm/<domain>/`.
- **Resolve findings:**
  - Accept findings that agree with the baseline.
  - A finding that would change an accepted decision or a money policy becomes an X or Q item. It is not an edit.
- If a reviewer is blocked reading its persona under the plugin cache, approve the read; it is a known Windows hook limitation.

### Phase 4 — Cross-cutting documents
Build `03-requirements.md`, `04-capabilities-and-scope.md`, `05-repository-tree.md`, `traceability.md`, `tests/test-strategy.md` and `plan/`. Package names, owners, contracts and task paths must be identical across all of them.

### Phase 5 — Package review and consistency pass
- Run one final EGM zoom-out and implementation-readiness review over the whole package.
- Then cross-check every document against the master baseline and against each other. Look for:
  - missing owners;
  - duplicate authorities;
  - contradictions;
  - unsupported guarantees;
  - stale summaries;
  - misleading dependencies.
- Record the results in `consistency/`.

## 5. Content that must be carried exactly

- **Authority and sessions:**
  - `interfaces.authorization` establishes actors and delegation.
  - `kernel.authority` validates actor grants, exclusive-writer authority and session binding and activation.
  - `kernel.lifecycle` owns financial-session, command, order, position and obligation transitions, through the sole ledger writer.
  - Calendar and clock evidence grants no authority, and a restart is not a new session.
- **Clocks:** live and simulated compositions receive explicit injected clocks (Combined-F1).
- **Protection (ATA-01):** bounded, deterministic evaluation inside the kernel process.
  - Desired, attempted and broker-confirmed protection are distinct, with recoverable state.
  - Protective actions go through normal admission and safety.
  - The supervisor observes and proposes, and never sends.
- **Conflicts and scheduling (ATA-04):** admission and safety own the conflict dependencies; the coordinator owns scheduling. Keep one outbound request per account and no inherited lock ordering.
- **Execution domain (ATA-06):** per-request, outcome and observation domain evidence, with explicit unknown or conflicting states. Never refuse a send because of analyzer mode.
- **Simulation:** keep the accepted simulation isolation. Local simulated adapters are distinct from OpenAlgo's externally selected analyzer/live domain.
- **Migration (ATA-03):** the initial handoff happens at a naturally flat, freshly reconciled boundary, and the old route retires at the target's first broker-changing attempt. Keep this separate from the still-undecided database upgrade-versus-import method (AUD-05/A04-F4). Combined-F6 governs later target transitions.
- **Unresolved items:** never silently choose a workflow, account, threshold, emergency permission, service level, priority or other owner policy.

## 6. Required coverage

The package must cover all of the following:

- requirements and policy inventory;
- capabilities and exclusions;
- module ownership and dependency rules;
- typed contracts and version compatibility;
- financial and session state machines;
- transaction and persistence boundaries;
- identity, idempotency and accounting;
- market data and deterministic Canvas;
- the shared live, paper and replay engine;
- protection and reconciliation;
- strategy and cognition interfaces;
- research, RL, custody and promotion;
- security and operator permissions;
- configuration and artifact binding;
- scheduling, backpressure and resource isolation;
- observability and deployment;
- migration, recovery and rollback;
- outstanding-obligation continuity.

Design around justified boundaries first. Then decide, for each component, whether to reuse, extract, refactor, wrap, replace or rebuild. Cite AT revision, path and line, plus license evidence for any upstream. Treat names, comments, diagrams and historical reports as claims to verify. Do not inherit legacy layouts, coupling, limitations or obsolete tests.

## 7. Delivery plan and tests

**Each slice** in `plan/slices/` gives:

- stable task IDs;
- exact proposed target files;
- prerequisites;
- contract changes;
- reuse evidence;
- expected outputs;
- independently derived acceptance criteria;
- failure scenarios;
- verification commands, labelled **planned, not executed**;
- migration implications;
- rollback limits;
- measurable completion conditions.

**The test strategy** follows A08:

- a fresh, requirement-based suite;
- reuse only of inspected, justified scenarios and fixtures;
- no bulk migration of the legacy suite, and no exhaustive classification of it.

The suite must cover:

- concurrency;
- partial fills;
- uncertain broker effects;
- delayed and conflicting observations;
- process, storage and host failure;
- clock and session transitions;
- kernel failure and protection continuity;
- restored authorization and evidence custody;
- schema and artifact compatibility;
- release rollback limits.

Keep isolated work independent of market-close checks and unrelated production evidence. Keep the controls justified by real financial effects, cutover, privileged access, isolation and custody.

## 8. Owner questions

- Resolve routine engineering details yourself, within accepted boundaries.
- For a genuine conflict or a new owner choice:
  - add a Q item with a short Requirement/Owner/Proof block, two or three viable options with the recommended one first, and the exact dependent task IDs;
  - ask one question at a time;
  - continue all independent work while the answer is pending.

## 9. Finish with

- The file index.
- Pinned provenance.
- The `git status --porcelain` proof that only `specs/implementation/` changed.
- be-ambitious judge results against `01-ambition.md`: pass or miss, with real evidence.
- EGM review coverage per spec.
- Consistency results.
- Open Q and X items with their dependent tasks.
- The first slice, prepared for execution.

Claim no implementation completion or production readiness.
