# Runtime isolation, observability and deployment (stub)

* **Status:** proposed **stub**. SLICE-01 uses only `scripts/safe_tests.py`. Full depth is written when SLICE-11 starts (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `operations/supervisor.py`, `isolation.py`, `verification.py`, `telemetry.py`, `deploy/install.py`, `deploy/systemd/*`, `scripts/safe_tests.py`, `scripts/isolated_work.py`.
* **Master anchors:** A03-F4/F5 (`README.md:920-924`), A09-F1…F4 (`:929-935`), D09 enforcement (`:847`), [Activity-to-dependency matrix](../../../README.md#activity-to-dependencyisolation-matrix) (`:1284-1306`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-OPS-001 | The independent supervisor reads committed ledger state through bounded, read-only access, plus enforced read-only broker observations; it records assessments and never settles or sends | A03-F4 (`README.md:920-922`); REQ-PRT-011 |
| REQ-OPS-002 | Progress is measured against demand; protection status is classified; process failure and host failure are separate cases | A03-F5 (`README.md:924`) |
| REQ-OPS-003 | Aggregate host resource envelopes and admission for optional background work, including descendants, from measurements | A09-F2 (`README.md:931`) |
| REQ-OPS-004 | Storage classes (authoritative, required evidence, reproducible, scratch) with capacity separation; truthful disk-full behaviour | A09-F3 (`README.md:933`) |
| REQ-OPS-005 | Measurement before optimization; no invented capacity, latency or RPO/RTO numbers | A09-F4 (`README.md:935`) |
| REQ-OPS-006 | No hard memory cap on the kernel; soft caps on optional services | POL-052 |
| REQ-OPS-007 | Telemetry is bounded, asynchronous and drop-capable; it never blocks or authorizes money | `README.md:35`, `:942` |
| REQ-OPS-008 | Tests run isolated with their own stores, no broker key and resource limits, at any time | REQ-XC-006; POL-051; §7 jobs row (`README.md:1156`) |

## What early slices need now

SLICE-01 runs its tests through `scripts/safe_tests.py`, a thin launcher, with these rules:

* it creates a temporary `ledger.path` under the system temp directory;
* it refuses to run when any `OPENALGO_*` or broker credential variable is set;
* it runs `pytest` with `-p no:cacheprovider` and a temporary base directory.

These rules are fixed in [SLICE-01](../plan/slices/SLICE-01-disarmed-financial-core.md).

## Reuse rows and divergences

* Jobs/leases/cgroup containment: **retain/simplify configuration** (`README.md:1156`). The legacy `scripts/safe_pytest.py` is the behavioural reference for resource and production-store protection (`README.md:1269-1270`).

## To specify at SLICE-11

Supervisor read model and polling ownership; observation mechanism (with [execution-domain spec](execution-domain-and-observations.md#observation-enforcement-a06-f2)); unit templates for each participant; resource envelope measurement plan; disk-full matrix; proofs from `README.md:1240`, `:1247`.
