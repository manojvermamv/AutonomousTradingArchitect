# Security and operator (stub)

* **Status:** proposed **stub**. Full depth is written when SLICE-10 starts (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `interfaces/*`, `settings/secrets.py`, `adapters/unix_channel.py`, `operator_ui/*`.
* **Contributes to:** `kernel/authority.py` (specified in [sessions-authority-lifecycle](sessions-authority-lifecycle.md)). This domain establishes the authenticated actor; the kernel validates grants.
* **Master anchors:** [Security boundaries and operator control](../../../README.md#security-boundaries-and-operator-control) (`README.md:861-871`), A06-F1…F5, Combined-F4 (`:863`, `:365`).

## Requirement keys (pointers)

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-SEC-001 | Interfaces authenticate the principal and verify delegation; payload names are claims; a relay cannot widen scope | A06-F1 (`README.md:863`) |
| REQ-SEC-002 | Privileged requests and any policy-required confirmation bind actor, operation, target or account, argument digest and validity; consumed confirmations never revive | A06-F4 (`README.md:869`); Combined-F4 |
| REQ-SEC-003 | Owner actions (including KILL-CANCEL-1 cancel and close, and latch unlock) are recorded in the kernel ledger, not a side file | AUD-01, AUD-03 (`README.md:754-756`); LD-15; POL-002, POL-004 |
| REQ-SEC-004 | Secrets resolve from protected references; replacement only through supported process transitions; identifiers are recorded, never values | A06-F3 (`README.md:867`) |
| REQ-SEC-005 | Read scope and disclosure destinations are enforced separately, including caches, model context and telemetry | A06-F5 (`README.md:871`) |
| REQ-SEC-006 | MCP exposes no order-capable tool; inferred or proxied `auth.mode: none` refuses | POL-009, POL-053 |
| REQ-SEC-007 | Local authenticated channel validates exact contract versions | A02-F1 (`README.md:901`); `adapters/unix_channel.py` tree comment (`:1045`) |

## Interfaces the full-depth specs already rely on

These are named now so the kernel specs can point at them; their full design is written at SLICE-10.

| Interface | Used by |
|---|---|
| Owner credential path: authenticates the owner and issues the root grant; re-establishes grants after a restore | [sessions spec](sessions-authority-lifecycle.md#grants-and-the-authority-check-kernelauthoritypy) |
| Grant requests that `kernel.authority` records as `GRANT_ISSUED` / `GRANT_REVOKED` | sessions spec |
| Operator commands, each needing its grant action: `kill_engage`, `kill_release`, `hold_engage`, `hold_release`, `latch_unlock`, `pause_clear`, `binding_authorize`, `recovery_advance` | [protection spec](protection-and-safety.md#kill-and-holds-kernelsafetypy), [intent spec](intent-to-admission.md#review-application-kernelpolicypy), sessions spec |
| Read-only `command_status(command_key) -> CommandStatus` for a caller whose acceptance reply was lost | [dispatch spec](dispatch-and-coordination.md#command-status-read-only) |
| The operator alert route for recorded alerts and escalations | intent and execution-domain specs |

## What early slices need now

SLICE-01…SLICE-09 use a **test principal with a synthetic grant**, injected by fixtures. No interface runs.

## Reuse rows and divergences

* CLI/MCP/console/frontend: **retain surface; migrate imports and read models** (`README.md:1157`).
* Authority service/channel: **wrap/extract**; keep Linux peer attestation initially (`README.md:1145`).
* LD-15: the owner-send audit is in a side JSONL file.

## To specify at SLICE-10

Session and confirmation records; the grant schema shared with `kernel.authority`; the CSRF and replay rules; the disclosure projection list; secret reference format; restore continuity checks (Combined-F4); proofs from `README.md:1244`.
