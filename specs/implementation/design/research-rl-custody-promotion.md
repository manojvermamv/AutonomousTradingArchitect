# Research, RL, custody and promotion (stub)

* **Status:** proposed **stub**. Independent lane; full depth is written when SLICE-12 starts (`README.md:1172`, `:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `research/*`, including `research/rl/*`.
* **Master anchors:** [Research, RL and promotion](../../../README.md#research-rl-and-promotion) (`README.md:873-891`), A07-F1…F4 (`:885-891`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-RES-001 | Fitting population, learned transformation identity and application population are recorded; evaluation applies frozen fitted artifacts | A07-F1 (`README.md:885`) |
| REQ-RES-002 | Trials own attempts registered before execution; jobs own leases and resources; resumes link compatible checkpoints; every attempt is retained | A07-F2 (`README.md:887`); POL-040 |
| REQ-RES-003 | RL transitions keep proposed action, admission decision, simulated execution and resulting state; reward separates economics from shaping | A07-F3 (`README.md:889`) |
| REQ-RES-004 | Promotion binds the exact candidate, inference configuration, evidence and session scope; Tier-1 verifies it; the per-family approval mode follows POL-041 | A07-F4 (`README.md:891`); POL-041 |
| REQ-RES-005 | Locked-OOS is source-neutral, one-use and reserve-before-read; consumed status survives restore | POL-038; `README.md:877` |
| REQ-RES-006 | Bar values fail closed in the repository; host values are configuration | POL-042 |
| REQ-RES-007 | Promotion evidence uses the estimated-cost track by default; the baseline is named at dataset build; lineage gaps defer without consuming custody; DSR is advisory | POL-043, POL-025 |
| REQ-RES-008 | No live self-training; simulated outcomes are labelled and never counted as realized | POL-034; `README.md:883` |

## What early slices need now

Nothing. SLICE-01…SLICE-11 do not depend on research. The kernel's binding check (A07-F4) is specified with sessions ([REQ-SES-011](sessions-authority-lifecycle.md#requirement-keys)).

## Reuse rows and divergences

* Custody/trials/datasets/freeze/evaluation: **reuse with identity parity** (`README.md:1153`).
* RL environment/lab/Gym/reward/policy: **reuse optional libraries** (`README.md:1154`).
* The current holdout declaration and its consumption state must migrate intact (POL-039).

## Open items

* Revocation consequences for promotion (`README.md:381`).
* AUDIT-WILSON-SERIAL-1 (POL-O03).

## To specify at SLICE-12

Custody state machine (reserve, read, consume) with restore behaviour; trial and attempt schemas; candidate freeze manifest (`candidates.schema.json`); approval binding format; RL transition record; proofs from `README.md:1245`.
