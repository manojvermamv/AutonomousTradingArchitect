# 01 — Ambition and outside judges

Status: **proposed**. This is a process document, not on the reading path. The quality bar was set on 2026-10-26 with the be-ambitious skill; `dc116a3` is that skill's commit, not an ATA revision. It raises standards and proof only. It does not widen scope, change any policy or grant any permission. It was revised after the [package brainstorm](egm/package/concepts_brief.md) and the owner's choice to re-cut the package.

## Goal beyond the goal

An engineer who has never seen this project can build the AutonomousTrading target one slice at a time, without having to make a money or architecture decision. Every claim they rely on traces back to an accepted decision, a verified fact or an open question that is clearly marked.

## Types that fit

| Type | Used? | Why |
|---|---|---|
| Altitude | Yes | The package exists so implementation can start safely and stay aligned as the master documents change. |
| Depth | Yes | A wrong contract here becomes a wrong financial behaviour later. The work has to meet the standard of a safety-critical order-management specification. |
| Range | No, as a separate step | EGM's six brainstorm lenses and seven reviewer personas already bring the other perspectives. Adding a separate crew would make the work bigger, not better. |

## Altitude ladder

1. **Trace, do not redefine.** Every requirement key points at its accepted decision ID and anchor, owning module and proof. Specs cite the master instead of restating it, and add only what the master lacks: transition tables, failure-mode tables, typed interfaces, refusal codes, tasks and proofs.
2. **Zero-decision first slice.** The first vertical slice passes EGM stage 9 (implementation readiness): an unfamiliar engineer can execute it without choosing a schema, an API path, a dependency or an edge-case rule.
3. **Package that stays true.** The package can be checked mechanically, now and after future master edits:
   - every REQ has a decision, a module, a task and a proof;
   - every module path exists in README §6, parsed from the master itself;
   - every module is specified in exactly one spec (contributors are listed separately);
   - every relative link resolves;
   - every master citation names a decision ID that sits inside the cited section at the pin.

   The check is a read-only script run from outside the repository; this package's authorization covers Markdown only, so the script stays outside the repository and its full text and output are recorded in the cross-document check. Its results are recorded in [consistency/cross-document-check.md](consistency/cross-document-check.md).

The package aims at rung 3. Rung 2 is the minimum for calling the first slice "prepared".

## Depth (Felix's four questions)

1. **What a top professional would do that was not asked for.** A principal engineer for a broker-connected order-management system would do three things:
   - write explicit state-transition tables with invariants for sessions, commands, orders, positions, obligations and protection;
   - write a failure-mode table for every boundary where a crash, timeout or stale read can occur;
   - derive tests from those invariants and failure modes, rather than from examples.
2. **Rawest material.** Start from these, not from summaries:
   - the master README and ROADMAP text at the pinned lines;
   - the AT source at `445eb116`: Tier-1 ledger and coordinator, gateway route, execution gateway, sender kill matrix, protection trail, lifecycle session-close policy and planner;
   - the AT owner-decision record, verified against code;
   - the OpenAlgo contract pins recorded in the master README.
3. **Methods and tools.**
   - transition tables plus invariants, and FMEA-style failure tables;
   - crash-point enumeration at every durable boundary;
   - stateful property-based test design (Hypothesis rule-based state machines, planned);
   - CodeGraph and `rg` for evidence;
   - a scripted consistency checker for IDs, links, ownership and tree membership.
4. **What, other than the author, shows the result is right.**
   - zero-context EGM Goldfish reviewers;
   - the scripted consistency checker;
   - `git status --porcelain` showing that only `specs/implementation/` changed;
   - the owner's review of open questions.

## Hard targets (pass criteria)

| ID | Target | Judge |
|---|---|---|
| J1 | 0 unresolved 🔴 Blocker findings in every EGM review report; every 🟡 Major is fixed, contested with evidence, or logged as a Q or X item | EGM reports under [egm/](egm/) |
| J2 | 100 % of requirement keys **in full-depth specs** have a decision, a module, a task and a proof; every stub key names the master acceptance row its slice will turn into proofs (depth follows slices, owner choice 2026-10-26). Each full-depth proof has a proof class and an independently derived expected outcome; every executable proof names how to break it. Proof status is *specified*, *executable* or *passing*; nothing unbuilt is called passing | Checker over [traceability.md](traceability.md) |
| J3 | 0 module references outside README §6 (plus listed tree deltas); 0 modules specified in two specs (except the declared `kernel/lifecycle.py` split) | Checker that parses the README §6 code block at `b9bb32c` |
| J4 | 0 broken relative links; 0 duplicate IDs | Checker |
| J5 | Every master citation (`README.md:NNN`) falls inside the section that holds the cited decision ID or contract row | Checker against README/ROADMAP at `b9bb32c` |
| J6 | SLICE-01 passes EGM stage 9 with 0 Blockers | EGM implementation-readiness report |
| J7 | Only `specs/implementation/` paths change in the ATA repository | `git status --porcelain` |

Passing the checker (J2–J5) shows only that the documents agree with each other and with the master. It does not show the design is correct. Correctness evidence comes from the zero-context reviews (J1, J6), the owner's answers and, later, the executed proofs.

A missed target is reported with its real numbers in the [package README](README.md) and the cross-document check. It is never reported as passed.

## What it needs

| Need | Status |
|---|---|
| ATA clone at `b9bb32c` | there |
| AT checkout at `445eb116`, read-only | there |
| EGM plugin and reviewer agents (`egm:egm-*`) | there |
| Python for the read-only checker (run from the session scratchpad, outside both repos) | there |
| OpenAlgo upstream mirror | **missing** locally: upstream claims cite the master README's recorded pins |
| Deployed host configuration and broker evidence | **missing** and not authorized: dependent claims stay "unverified deployment claim" |

## Rewritten task (as executed)

```text
Produce the AutonomousTrading specification and implementation-plan package under
specs/implementation/ that traces, never redefines, the master README/ROADMAP at
b9bb32c. Start from the master text and the AT source at 445eb116, not summaries.
For every domain, write transition tables with invariants and a failure-mode table,
and derive acceptance tests from them. Keep every owner policy that is not yet
decided open. Pass = 0 unresolved EGM Blockers; 100 % REQ→decision→module→task→proof
coverage; 0 broken links, duplicate IDs, out-of-tree modules or double owners;
master citations verified; SLICE-01 passes EGM stage 9; only specs/implementation/
changed. Report real numbers, including any missed target.
```

## Next

Rung 3 is reachable with the access available now. The checker runs at the end of the package build.
