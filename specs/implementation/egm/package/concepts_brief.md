# AutonomousTrading specification and implementation-plan package

* **Author:** EGM synthesizer, for Manoj Verma
* **Date:** 2026-10-26
* **Mode:** BRAINSTORM. Six Goldfish lenses: design, codebase details, zoom-out, comprehension, implementation readiness, structural.
* **Status:** proposed. This brief is non-authoritative. It changes no decision, policy or permission.

## Overview

The package lives under `specs/implementation/` in the AutonomousTradingArchitect (ATA) repository. Its job is to turn the accepted target architecture into work that an engineer can build one slice at a time. That architecture is recorded in `README.md` and `ROADMAP.md` at `b9bb32c`. The system is a single-host Python options trading application. It sends orders only through OpenAlgo. The intended reader has never seen the project, and must be able to build without making a money or architecture decision.

The concept as proposed has about 20 documents:

* a policy inventory;
* requirements;
* capability scope;
* a canonical repository tree;
* 13 domain specifications;
* a traceability matrix;
* a slice plan;
* a test strategy.

The legacy repository (`OA` at `445eb116`) is read-only evidence and an optional source of reusable code. Open owner policies stay open.

All six lenses reached the same conclusion: the package as described would mislead implementers. The cause is not missing content. It would create **second copies of things the master already owns**: the policy inventory, the repository tree, the requirement rows, the reuse mapping and the delivery order. AGENTS.md:34 and :72 forbid that ("without inventing duplicate registers"; "cross-links instead of competing specifications"). The value the package can add is what the master lacks:

* transition tables and invariants;
* failure-mode tables;
* concrete slice tasks with typed interfaces;
* proofs whose expected outcomes are derived independently.

Everything else should be a link.

## Analysis

Findings are grouped by theme. Severity is the highest any lens assigned. Where the synthesizer checked a citation, it says so.

### 1. Duplicate authorities

**Blocker. The policy inventory would compete with README §9.** All six lenses raised this. README.md:440 says the inventory "belongs with the owner choices in §9, not in a new service or competing policy register". ROADMAP.md:255 says approvals are reconciled "into README §9". README is protected (AGENTS.md:79). 00-provenance.md:57 already points at a planned `02-policy-inventory.md`.

A package-owned inventory would become the copy an engineer actually opens. It would then drift once §9 is populated. (Synthesizer verified README.md:440 and AGENTS.md:34, :72, :79.)

Recommended treatment: the file becomes "Proposed README §9 rows, pending owner-authorized edit". Every row is marked non-normative. Requirement rows cite §9 or the decision ID, never this file. Once §9 holds the rows, the file shrinks to a pointer.

**Blocker. A second "canonical" repository tree, used as the checker's oracle.** Raised by design, zoom-out, structural, comprehension and implementation readiness. README §6 (README.md:947-1129) is already the canonical commented tree. AGENTS.md:70 makes README the owner of the layout.

01-ambition.md:61 makes `05-repository-tree.md` the reference for check J3. Specs and a copied tree could agree with each other while both drift from the master, and the check would still pass.

Recommended treatment:
* The checker parses the README §6 code block at the pinned commit.
* `05` becomes a derived index, one row per §6 module: module path, owning spec, first-release status (required, optional, deferred or open).
* A short "proposed tree deltas" table holds any paths the package needs that §6 lacks, as X items.
* No empty modules are scaffolded (README.md:1133, verified).

**Major. Requirement rows, scope and delivery order restate the master.** The master already has:
* the D11 requirement rows (README.md:23-39);
* the A10-F2 first-release table (README.md:1165-1172, verified);
* Phases 0-8 (README.md:1178-1188, verified);
* the delivery order (ROADMAP.md:282);
* the A08 test method (README.md:34).

Separate package files for each would be a third copy. A10-F2 also says first-release scope is recorded "through existing settings/bootstrap/deployment" and that strategy/account scope "remain explicit selection work; this decision does not silently choose them" (README.md:1165). A scope document that fills in cells would choose scope by accident.

**Major (synthesizer addition). The reuse mapping already exists in the master.** README §7 (README.md:1135-1161) already gives a disposition and effort for each legacy capability. Examples: Tier-1 ledger "Reuse/harden", coordinator "Extract/refactor against D13-D15", legacy tests "Write fresh; selectively reuse evidence". The package must cite these dispositions, not re-decide them. Its reuse sections should add only file:line evidence and known divergences.

### 2. The 13-domain split does not match module ownership

**Major. The split cuts across one financial transaction.** Raised by design and structural.
* D16 and AUD-02 make one atomic commit span reconciliation, lifecycle, reservations and the sole ledger writer (README.md:747-748, :764).
* `kernel.lifecycle` alone owns session, command, order, position and obligation transitions (README.md:1028), yet it would be split across the "kernel/sessions" and "ledger" domains.
* `kernel.reconciliation` appears in both "protection/reconciliation" and "execution domain" (ATA-06, README.md:458).
* `kernel.authority` overlaps "security and operator".

Each spec would describe part of the same transaction, and their crash-point tables would disagree. Recommended treatment:
* The module-to-owning-spec index is the primary map.
* The D02/D13-D16/AUD-02 transition table belongs to exactly one spec; the others cite it.
* Each spec header lists "Owns (exclusive)" and "Consumes" module paths.

**Major. The entry path has no owner, and the "shared engine" has no module.** No domain clearly owns the path intent, then review application, then pure plan, then admission:
* `kernel.policy`, planner, selection and admission;
* the decisions D07, D12, AUD-01 and AUD-03 (README.md:726, :752-756).

That path is the core of Phase 3 (README.md:1183). Domain 7, the "shared live/paper/replay engine", owns no module in §6. The master treats it as shared code instantiated separately (README.md:539-540, :566). A spec for it invites a new `engine` package or a second owner.

Recommended treatment:
* Add one intent-to-admission spec.
* Turn "shared engine" into a cross-cutting invariant section with parity tests, owning no module.

**Nit. "Exactly one owner per module" conflicts with joint responsibilities in the master.** Examples are admission with safety (README.md:454) and reconciliation, lifecycle and reservations committed by the single writer (README.md:764). The checker needs to tell "owner" from "contributor", or J3 will report false failures. "Owner" also means three things: the human policy Owner, the owning module, and the spec that owns a module. Name them differently.

### 3. Size, depth and YAGNI

**Major. Thirteen full specs written up front are documentation scaffolding.** All six lenses raised this. README.md:1133 forbids "empty future modules as a substitute for working slices". Writing every domain in full before SLICE-01 is the documentation version of that.
* Research/RL training "may be delivered independently" (README.md:1172).
* Richer Canvas, cognition and teams may be deferred (README.md:1171).
* Phases 5 and 6 are not prerequisites for Phase 7 (README.md:1174).

Full transition and failure-mode tables for those domains add maintenance work and serve no slice.

Recommended treatment:
* Full depth only for domains the early slices touch: kernel/sessions and lifecycle, ledger, the intent-to-admission path, dispatch/coordinator, the execution domain and observations, and protection/reconciliation.
* Deferred domains get a one-page stub: owning module, master links, open Q items, and "specify when slice X starts".
* Stateful property-based testing (Hypothesis) only for ledger, lifecycle and reservations.

**Major. The ambition adds volume where it should add proof.** Raised by zoom-out, design and implementation readiness. The checker (J2-J5) proves format, links and the presence of filled cells. It does not prove the design is right. A 100 % REQ-to-proof count passes with weak proofs. Line-content checks pass when an ID such as D13 or ATA-04 appears on many lines (README.md:454, :745, :758, :1181).

Recommended treatment:
* Define four proof classes: a named pytest node with an expected-outcome table; a check script; a review or owner decision; a deployment or broker measurement.
* Track proof status as specified, executable or passing. Never call an unbuilt test "proof".
* Each proof names an independently derived expected outcome and a way to break it (A08, README.md:34).
* The package README states plainly that passing the checker shows the documents are consistent, not that the design is correct.

**Major. Process material sits on the reading path.** 01-ambition, the `egm/` reports and `consistency/` describe how the package was made. A new engineer must wade through them. Put them in a `process/` area, or label them non-authoritative, and keep them out of the reading order.

### 4. "Zero-decision" against "keep policies open"

**Major (Blocker for the plan if unaddressed). SLICE-01 cannot be zero-decision if it touches an open policy.** All six lenses raised this. Four lines in the master keep the relevant policies open:
* README.md:758 keeps deadlines and emergency permissions open.
* README.md:772 keeps the kill/daily-loss permission matrix open.
* README.md:452-454 keep protection triggers, session-close behaviour and conflict priorities open.
* README.md:1165 keeps strategy and account scope open.

01-ambition.md:20 and J6 require an implementer to choose no edge-case rule. Both conditions can hold only if:
* SLICE-01 avoids every open policy; and
* every later slice takes open policy as an injected input.

Recommended treatment:
* SLICE-01 is a synthetic, disarmed Phase 3 subset against the simulated broker (README.md:1183). It needs no open policy.
* Every open policy becomes a typed parameter loaded from the policy schema (`config/policies.example.yaml`, README.md:967). It ships with no default, and the loader refuses a missing value.
* Tests use values labelled "synthetic test value, not a default" and exercise every branch of a matrix.
* A slice can be "engineering-complete, blocked on Q-n for production values only".
* Never fill an open policy with a legacy value (README.md:442).

**Blocker (implementation readiness). Phase 3 is too big to be SLICE-01.** README.md:1183 bundles in one phase: review, plan, admission, dispatch, simulated broker, lifecycle and accounting, multi-day sessions, partial fills, protection and domain evidence.

Proposed SLICE-01 contents:
* contract types;
* the event envelope with its canonicalization and digest rule;
* the single ledger writer;
* command identity: the same key with changed content is refused, and the same content returns the existing state (D01, README.md:737);
* one entry from a fixed recorded review, sent to the simulated broker, covering not-sent, rejected, acknowledged and ambiguous outcomes;
* the atomic outcome commit (AUD-02).

Each item needs:
* paths in §6;
* typed signatures;
* a refusal-code table;
* transaction boundaries;
* numbered crash points;
* named tests.

SLICE-01 excludes protection, sessions across day boundaries, conflicts and real money values.

**Blocker (implementation readiness). No ledger schema is fixed, and the master leaves the question open.** The §6 entry for `001_initial.sql` reads "Define target schema after upgrade versus import evaluation" (README.md:987). ROADMAP.md:276 calls the method "evidence-dependent". The legacy Tier-1 schema has three gaps:
* It has no tables for session, protection state, reservation or execution domain.
* Its provenance CHECK allows only `native`, `legacy_import` and `broker_observation` (`OA/src/tier1/schema.py:25`), so it cannot hold the unknown or contradictory attribution that ATA-06 requires.
* It refuses any version mismatch and has no migration path (`schema.py:130-136`).

Recommended treatment:
* SLICE-01 defines a target-native schema v1, used only by a disarmed simulation ledger, and states "no legacy database is opened".
* Fix the version rule: forward-only numbered migrations; readers refuse unknown versions.
* Upgrade-versus-import becomes a Q item that blocks only the Phase 4 and Phase 7 slices.

**Major. Phases and slices are not mapped.** A separate dependency-ordered plan could reorder or gate work differently from Phases 0-8 and ROADMAP.md:282. Each slice should declare:
* its phase;
* the decision IDs it proves;
* the contracts it consumes and their versions;
* its environment class: synthetic, disarmed shadow (Phase 4) or production-sensitive (Phase 7).

The plan may add finer ordering inside a phase. It must not add new gates. ATA-03 cutover and D10 stay attached to Phase 7.

**Major. The migration and rollback window has no representation yet.** ATA-03 (README.md:456) imposes four requirements:
* Rollback to the old route is allowed only before the target's first broker-changing attempt, and only with proved exclusive ownership.
* After that attempt, recovery is target-to-target only.
* JSONL becomes a generated projection (README.md:1184).
* A naturally flat boundary is never manufactured.

The migration spec needs:
* a "no pre-cutover slice writes to legacy stores" rule;
* a versioned projection format with a named list of consumers;
* a test that refuses reactivation of the old route.

### 5. Legacy code as a hidden second authority

**Blocker (codebase details). Some legacy behaviour conflicts with, or needs reconciling against, accepted decisions.** Copying it would make old code the authority. The synthesizer checked two of the cases below.

| Legacy behaviour at `445eb116` | Decision it meets | Status |
|---|---|---|
| `gateway_route.py:135` mints a new `uuid4` when the caller gives no command ID, so a retry gets a new identity | D14 command identity (README.md:760) | Conflict. Synthesizer verified line 135. |
| `gateway_route.py:524` `_next_execution` blocks the whole scope while anything is unresolved | ATA-04: blanket blocking must not be inferred (README.md:454) | Conflict reported by the reviewer; worth confirming |
| `runtime/orchestrator.py:534-545`: the planner writes latch files, and skips the check as "INERT" when no latch store exists | D07 pure planner (README.md:726) | Conflict reported by the reviewer; worth confirming |
| `execution/loss_latch.py:96`, `:142-143`: the latch is keyed by IST trading day | ATA-05: calendar is not activation authority, and sessions do not implicitly reset safety (README.md:450) | **Reconcile, not confirmed conflict.** "Blocked that day" may be the approved LOSS-LATCH-1 policy, and ATA-05 defers to "applicable approved rules". Synthesizer verified the keying. |
| `protection/trail.py:16-20`: the stop moves only on confirmed bar close | ATA-01: no confirmed-bar-only cadence is imposed (README.md:452) | **Reconcile, not confirmed conflict.** ATA-01 says triggers are policy-defined. Bar-close may be the approved trail policy. |

Recommended treatment: add one "known legacy divergence" table: legacy path:line@445eb116, decision, target behaviour, and status (conflict or reconcile). No spec cites legacy code as the source of a required behaviour.

**Major. Legacy docstrings and defaults look like policy.** Examples:
* `policy/lifecycle.py:3-16`, `:31-44`: hardcoded 15:13/15:15, a fixed IST offset, and unknown values treated as `square_off`.
* `execution/sender.py:282-297`: the kill matrix.
* `execution/loss_latch.py:167-177`: the budget rule.

README.md:442 forbids importing "configuration error handling ... or incidental execution order as policy". Everything harvested from legacy code is labelled code-evidence (class C, README.md:15), "historical or host-specific, open", until it maps to a §9 row. 01-ambition.md:40-41 lists the sender kill matrix and session-close policy as "rawest material". That wording needs this guard next to it.

**Major. Reuse fitness varies, and "reuse" must not mean "already meets the target".**
* Good extraction candidates: `tier1/ledger.py` and `tier1/coordinator.py` import only within their own package. The ledger already refuses the same key with changed content (`ledger.py:267-272`), which matches D01. `trail.py` uses only the standard library.
* High coupling: `runtime/execution_gateway/__init__.py` lazily imports the JSONL registry, holds, reservations and arbitration. `gateway_route.py:88-110` hardcodes `at-tier1-authority.service`, while the target unit is `at-kernel.service` (README.md:1085).
* Gap: the coordinator records send intent but does not commit admission and reservation atomically (D02/D13).

Each reuse row cites the README §7 disposition and adds only the coupling to break.

**Major. Legacy tests must not become the proof oracle.** `trail.py:8-12` gates on "identical exit prices and reasons" against the old engine. A08 allows old/new comparison only for behaviour explicitly retained (README.md:34). README.md:1155 says legacy tests are "write fresh". Every expected outcome comes from a requirement row.

**Major (observability). Safety checks fail open quietly.** A missing latch store is only noted as "INERT" (`orchestrator.py:534-536`). The owner-send audit is a side JSONL file (`sender.py:225-247`). The target specs should require:
* every safety check in a visible state (active, inert or damaged), recorded as an event;
* owner-action audit in the kernel ledger;
* every refusal carrying command ID, decision ID and policy version, so an incident can be traced from command to attempt to observation.

### 6. Citations, names and the reading path

**Major. Line-number citations will rot.** All six lenses raised this. The README header changes often (README.md:3). Several pins appear side by side: `b9bb32c` (package), `a85c5f1` (README.md:438), `461f9c2` (README.md:448), legacy `445eb116`, OpenAlgo `b9d155f`.

Recommended treatment:
* Cite by decision ID plus heading anchor at the pinned commit. The line number is secondary.
* Contract-table rows have no IDs (README.md:728-739), so cite them by anchor plus row name.
* The checker confirms the ID sits inside the cited section. It diffs that section between the pin and the current master, and marks dependent specs stale when it changed.
* Write down a re-pin procedure.
* Record pins once, in 00-provenance, with one sentence explaining how the master's evidence pins relate to the package pin.
* Pin legacy citations as `path:line@445eb116`, read with `git show`, not from the working tree. The working tree has one untracked file.

**Major. No rule says which document wins.** Recommended rule: master README, then ROADMAP, then the package. The package never wins. A conflict becomes an X item, not an edit. The rule goes in every file header, with the slice owner named as the person who re-checks the package against the current master before starting each slice.

**Major. Status vocabularies and ID families collide.** There are three status vocabularies:
* README evidence letters C/O/H/P/R/D/U (README.md:15);
* AGENTS lifecycle states: proposed, accepted design, implemented, tested, production-accepted (AGENTS.md:71);
* the package's own "verified fact" and "unverified deployment claim".

There are also many ID families: D01-D16, A01-A10-Fn, Combined-F1-F6, AUD, ATA, G-41, a bare "F1-F5" (README.md:1181), plus the package's REQ, SLICE, J, Q and X.

Recommended treatment:
* One legend with two axes: evidence class and lifecycle state.
* The package labels its own content only "proposed".
* One ID glossary.
* The package never mints decision IDs.
* REQ IDs use `REQ-<DOM>-NNN` with three-letter domain codes, so they do not collide with D01-D16.
* Define Q (open owner question) and X (proposed master correction or tree delta).

**Major. Overloaded terms.**
* "ATA" names both the documentation repository and the ATA-01..09 audit findings.
* "AutonomousTrading" names both the legacy checkout and the target.
* "Tier-1" is both a legacy package and a diagram tier.
* "Obligations" means proof obligations, financial exposure and Combined-F6 obligations.
* "Canvas" is defined only by a tree comment (README.md:999). Grep finds no Canvas code in legacy `src`, so it is new work.

A glossary should link each term to its master anchor. A short legacy-to-target name map is also needed, for example `src/tier1` to `kernel.ledger`, with each mapping marked verified or proposed.

**Major. The reading path for SLICE-01 is too long.** Recommended order:
1. README.md:1-40.
2. The target diagram (README.md:512-566).
3. The contracts (README.md:722-776).
4. The glossary and status legend.
5. The slice plan.
6. Only the two or three specs SLICE-01 depends on.

**Nit (synthesizer correction).** The zoom-out lens read `dc116a3` in 01-ambition.md:3 as a competing baseline. 00-provenance.md:44 shows it is the commit of the be-ambitious skill, not an ATA revision. The wording in 01-ambition should make that clear.

**Nit.** J7 ("only `specs/implementation/` changed") checks the scope of the edit, not quality. It belongs in process notes. Also, if the checker runs only from the session scratchpad (01-ambition.md:28), later readers cannot re-run it. Committing it under `specs/implementation/tools/` keeps J7 satisfied and makes the "stays true" claim repeatable.

### Strongest counter-argument

One could argue that a self-contained package is easier to read than one that sends the engineer back to a 1,374-line master. That cost is real, and the reading path and glossary above address it. The lenses still agree that a restated contract is worse than a long one. A paraphrase can pass every format check while changing the meaning, and README.md:3 shows the master is still being amended. Restating is the larger risk.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * A short package README: reading order, precedence rule (master wins), status legend, ID glossary, pin, and J-target results with real numbers.
  * A module-to-owning-spec index derived from README §6, plus a proposed-tree-deltas list (X items).
  * Full-depth specs only for domains on the early slices. Each spec has: transition tables with invariants, failure-mode tables with numbered crash points, typed interfaces, refusal codes, Q and X lists, reuse evidence citing README §7, and proofs.
  * One intent-to-admission spec. The D02/D13-D16/AUD-02 atomic transaction is owned by exactly one spec.
  * A single plan file holding requirement keys (non-normative pointers to master IDs), the slice order inside ROADMAP phases, policy inputs per slice, and proofs per slice with proof class and status.
  * SLICE-01 as a synthetic, disarmed, zero-policy subset with a target-native schema v1.
  * A "proposed README §9 rows" staging file and a "known legacy divergence" table, both marked non-normative.
  * A committed, read-only consistency checker that validates against README §6 and master anchors at the pin.
* **Out-of-Scope Non-Goals:**
  * Any package-owned policy register, canonical tree, decision ID, or requirement that is not traced to the master.
  * Choosing thresholds, emergency permissions, conflict priorities, kill/latch matrices, session-close behaviour, accounts, strategy scope, RTO or failover authority.
  * Full specs for research/RL, richer Canvas, cognition teams or deployment tuning before a slice needs them.
  * Treating legacy code, docstrings, defaults or tests as requirements or as a proof oracle.
  * Editing README.md or ROADMAP.md. Corrections are reported as X items for the owner.
  * Claiming implementation, test or production status for anything in the package.

## Key Decisions & Staging for Next Steps

Decisions the package author can settle now, because they follow from the master and AGENTS.md:

1. **Master wins.** Every file states the precedence rule. Conflicts become X items.
2. **No second inventory or tree.** `02` becomes "proposed README §9 rows"; `05` becomes a derived module index plus deltas. Update 00-provenance.md:57 and 01-ambition.md:61 (J3) to match.
3. **Cite by ID and anchor at the pin**, with the line number secondary. The checker diffs cited sections against the current master.
4. **Depth follows slices.** Write full specs for first-release domains on SLICE-01..N. Other domains get one-page stubs.
5. **Re-cut the domains by module ownership.** Add the intent-to-admission spec. Make the "shared engine" a cross-cutting invariant section. Give the atomic financial transaction one owner.
6. **Open policy is an injected, refusing parameter.** Each slice has a policy-inputs table and synthetic labelled test values.
7. **Legacy is evidence, labelled C.** Add the divergence table and reuse rows that cite the README §7 dispositions.
8. **Proof classes with status.** Change J2 so it requires a proof with an independent expected outcome and a break check, not just a filled cell.

Questions for the owner (the package must not answer these):

* **Q-A.** Should the package's proposed §9 rows be moved into README §9 now, which needs a protected-document edit, or stay staged in the package until reconciliation completes?
* **Q-B.** Is the existing example strategy acceptable as an engineering fixture for SLICE-01? The alternative is that strategy selection waits for the A10-F2 selection work.
* **Q-C.** The daily IST loss-latch reset and bar-close trail cadence: approved policy that ATA-05 and ATA-01 carry forward, or legacy behaviour to reconcile?

Suggested next step: revise 01-ambition.md (J2, J3, J5 and the depth targets) and the planned file list to match decisions 1-8. Then run `/egm-draft` on the package README and the SLICE-01 plan first, before any domain spec.
