# 05 — Module index (derived from README §6)

Status: **proposed**, non-normative. The canonical, fully commented target tree is [README §6](../../README.md#6-fully-commented-target-repository) at `b9bb32c` (`README.md:951-1129`). This file does not copy it. It adds, for each module, the spec that details it, its first-release treatment and its first slice. If this index and README §6 disagree, README §6 wins and the difference is an X item. The package checker reads the module list from README §6 itself, never from this file.

## Columns

| Column | Meaning |
|---|---|
| Module | Path relative to `src/autonomous_trading/` (master shorthand, `README.md:949`), or a top-level path |
| Specified in | The one package spec that details this module's behaviour. Other specs may *consume* it but do not re-specify it |
| First release | The A10-F2 treatment (`README.md:1167-1172`). **R** required for any selected workflow · **RP** required for dependent production use · **WC** required where the selected workflow consumes it · **I** independent lane. None of these selects a workflow ([Q-005](decisions/owner-questions.md#q-005)) |
| First slice | The slice that first creates or changes the module ([plan](plan/delivery-plan.md)) |
| §7 reuse row | The master's reuse disposition (`README.md:1141-1161`), cited and not re-decided |

## Index

| Module | Specified in | First release | First slice | §7 reuse row |
|---|---|---|---|---|
| `bootstrap.py` | [configuration-artifacts-release](design/configuration-artifacts-release.md) | R | SLICE-01 | Config/root/package scaffolding (`:1158`) |
| `contracts/identity.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) | R | SLICE-01 | — (new) |
| `contracts/market.py` | [market-data-and-canvas](design/market-data-and-canvas.md) | R | SLICE-04 (minimal), SLICE-08 | Providers/MarketView (`:1150`) |
| `contracts/decisions.py` | [intent-to-admission](design/intent-to-admission.md) | R | SLICE-01 | Advisor/team/AI management (`:1152`) |
| `contracts/execution.py` | [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) | R | SLICE-01 | Gateway/JSONL registry (`:1146`) |
| `contracts/evidence.py` | [execution-domain-and-observations](design/execution-domain-and-observations.md) | R | SLICE-01 (subset), SLICE-07 | — (new) |
| `contracts/clock.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) | R | SLICE-01 | — (new) |
| `resources/defaults.yaml`, `events.schema.json`, `candidates.schema.json`, `canvas.schema.json` | [configuration-artifacts-release](design/configuration-artifacts-release.md) | R | SLICE-01 (events schema only) | Config scaffolding (`:1158`) |
| `resources/migrations/001_initial.sql` | [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) | R | SLICE-01 (**provisional**, see [X-002](consistency/master-contradictions.md#x-002)) | Tier-1 schema (`:1143`) |
| `settings/loader.py`, `settings/schema.py` | [configuration-artifacts-release](design/configuration-artifacts-release.md) | R | SLICE-01 (minimal) | Config scaffolding (`:1158`) |
| `settings/secrets.py` | [security-and-operator](design/security-and-operator.md) | RP | SLICE-10 | — |
| `market/ingest.py`, `providers.py`, `store.py`, `sources.py`, `view.py`, `quality.py` | [market-data-and-canvas](design/market-data-and-canvas.md) | R | SLICE-08 | Providers/MarketView (`:1150`) |
| `market/canvas/*` | [market-data-and-canvas](design/market-data-and-canvas.md) | WC | SLICE-08 | Canvas algorithms (`:1160`) |
| `strategies/registry.py`, `worker.py` | [strategies-and-cognition](design/strategies-and-cognition.md) | R | SLICE-09 | BuyerEdge/EMA/worker strategies (`:1149`) |
| `strategies/buyer_edge.py`, `ema_cross.py`, `model_strategy.py` | [strategies-and-cognition](design/strategies-and-cognition.md) | WC | SLICE-09 | BuyerEdge/EMA/worker strategies (`:1149`) |
| `cognition/review.py` | [strategies-and-cognition](design/strategies-and-cognition.md) | WC (R when policy requires review) | SLICE-09 | Advisor/team/AI management (`:1152`) |
| `cognition/runtime.py`, `blueprint.py`, `tools.py`, `providers.py`, `advice.py`, `records.py`, `memory.py`, `reflection.py` | [strategies-and-cognition](design/strategies-and-cognition.md) | WC | SLICE-09 | Advisor/team/AI management (`:1152`) |
| `kernel/authority.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) | R | SLICE-03 | Authority service/channel/release/fence (`:1145`) |
| `kernel/policy.py` | [intent-to-admission](design/intent-to-admission.md) | R | SLICE-04 | Advisor/team/AI management, relocated application (`:1152`) |
| `kernel/planner.py`, `kernel/selection.py` | [intent-to-admission](design/intent-to-admission.md) | R | SLICE-04 | One-leg orchestrator/structure planner (`:1147`) |
| `kernel/admission.py` | [intent-to-admission](design/intent-to-admission.md) | R | SLICE-01 (minimal), SLICE-04 | Gateway/JSONL registry (`:1146`) |
| `kernel/reservations.py` | [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) | R | SLICE-01 (minimal), SLICE-07 | Gateway/JSONL registry (`:1146`) |
| `kernel/lifecycle.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) (session transitions); [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) (command, order, position, obligation transitions) | R | SLICE-01 | Gateway/JSONL registry (`:1146`) |
| `kernel/protection.py` | [protection-and-safety](design/protection-and-safety.md) | R | SLICE-06 | Stops/trails/structure FSM (`:1148`) |
| `kernel/safety.py` | [protection-and-safety](design/protection-and-safety.md) | R | SLICE-05 (conflict relation; the matrix's kill and hold rows), SLICE-06 (the rest of the matrix) | — |
| `kernel/coordinator.py` | [dispatch-and-coordination](design/dispatch-and-coordination.md) | R | SLICE-01 (minimal), SLICE-05 | Coordinator/OpenAlgoAdapter/ports (`:1144`) |
| `kernel/reconciliation.py` | [execution-domain-and-observations](design/execution-domain-and-observations.md) | R | SLICE-07 | Gateway/JSONL registry/reconcile (`:1146`) |
| `kernel/recovery.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) | RP | SLICE-03 | Authority service/release/fence (`:1145`) |
| `kernel/ports.py` | [execution-domain-and-observations](design/execution-domain-and-observations.md) | R | SLICE-01 | Coordinator/OpenAlgoAdapter/ports (`:1144`) |
| `kernel/ledger/runtime.py`, `envelope.py`, `store.py`, `schema.py`, `projections.py`, `export.py` | [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md) | R | SLICE-01 (envelope, store, schema, runtime, the `fold` in projections), SLICE-02 (D04 comparison and repair, export) | Tier-1 envelope/runtime/ledger/schema/projections (`:1143`) |
| `adapters/openalgo.py` | [execution-domain-and-observations](design/execution-domain-and-observations.md) | RP | SLICE-07 | Coordinator/OpenAlgoAdapter/ports (`:1144`) |
| `adapters/simulated_broker.py` | [execution-domain-and-observations](design/execution-domain-and-observations.md) | R (proof lane) | SLICE-01 | Legacy and shared worker replay (`:1151`) |
| `adapters/unix_channel.py` | [security-and-operator](design/security-and-operator.md) | RP | SLICE-10 | Authority service/channel (`:1145`) |
| `adapters/clocks.py` | [sessions-authority-lifecycle](design/sessions-authority-lifecycle.md) | R | SLICE-01 | — (new) |
| `adapters/compatibility.py` | [migration-recovery-rollback-continuity](design/migration-recovery-rollback-continuity.md) | RP | SLICE-13 | Gateway/JSONL registry (`:1146`); Combined-F3 (`:1197`) |
| `research/*` (excluding `rl/`) | [research-rl-custody-promotion](design/research-rl-custody-promotion.md) | I (custody and binding R for a selected candidate) | SLICE-12 | Custody/trials/datasets (`:1153`) |
| `research/rl/*` | [research-rl-custody-promotion](design/research-rl-custody-promotion.md) | I | SLICE-12 | RL environment/lab (`:1154`) |
| `operations/supervisor.py` | [runtime-isolation-observability-deployment](design/runtime-isolation-observability-deployment.md) | RP | SLICE-11 | — (A03-F4 readers) |
| `operations/deployment.py`, `backup.py`, `restore.py` | [migration-recovery-rollback-continuity](design/migration-recovery-rollback-continuity.md) | RP | SLICE-11 | Backup/release/restore (`:1159`) |
| `operations/isolation.py`, `verification.py`, `telemetry.py` | [runtime-isolation-observability-deployment](design/runtime-isolation-observability-deployment.md) | RP | SLICE-11 | Jobs/leases/cgroup containment (`:1156`) |
| `interfaces/cli.py`, `api.py`, `mcp.py`, `authorization.py` | [security-and-operator](design/security-and-operator.md) | R | SLICE-10 | CLI/MCP/console/frontend (`:1157`) |
| `operator_ui/*` | [security-and-operator](design/security-and-operator.md) | WC | SLICE-10 | CLI/MCP/console/frontend (`:1157`) |
| `deploy/install.py`, `deploy/systemd/*` | [runtime-isolation-observability-deployment](design/runtime-isolation-observability-deployment.md) | RP | SLICE-11 | Backup/release/restore (`:1159`) |
| `scripts/safe_tests.py`, `isolated_work.py` | [runtime-isolation-observability-deployment](design/runtime-isolation-observability-deployment.md) | R | SLICE-01 (`safe_tests.py`) | Jobs/leases/cgroup containment (`:1156`) |
| `scripts/migrate_legacy.py`, `compare_parity.py` | [migration-recovery-rollback-continuity](design/migration-recovery-rollback-continuity.md) | RP | SLICE-13 | Gateway/JSONL registry (`:1146`) |
| `scripts/verify_recovery.py`, `check_release.py` | [migration-recovery-rollback-continuity](design/migration-recovery-rollback-continuity.md) | RP | SLICE-11 | Backup/release/restore (`:1159`) |
| `tests/*` | [tests/test-strategy.md](tests/test-strategy.md) | R | every slice | Legacy test suite and fixtures (`:1155`) |
| `pyproject.toml`, `requirements.lock`, `config/*`, `.github/workflows/verify.yml`, `.pre-commit-config.yaml`, `docs/*` | [configuration-artifacts-release](design/configuration-artifacts-release.md) | R | SLICE-01 (`pyproject.toml` only) | Config/root/package scaffolding (`:1158`) |

`kernel/lifecycle.py` is the one module split across two specs. Session transitions and order/position transitions are specified separately because they change on different triggers. **Both commit through the single transaction defined in [ledger-and-atomic-transaction](design/ledger-and-atomic-transaction.md)**, which is the only spec that defines the atomic commit.

## Cross-cutting, owning no module

[design/cross-cutting-invariants.md](design/cross-cutting-invariants.md) holds the invariants that span modules: the shared live/paper/replay engine rule (`README.md:798-804`), the precedence rule, refusing policy parameters, and safety-check visibility. It owns no module and creates no package.

## Proposed tree deltas

These are files the slices need that README §6 does not list (T-01…T-23). T-01…T-22 are test files: README §6 shows example test files, not an exhaustive list. T-23 is a source module ([X-007](consistency/master-contradictions.md#x-007)). README §6 shows example test files, not an exhaustive list. Each delta stays inside an existing §6 test directory and adds no package. Together they are [X-003](consistency/master-contradictions.md#x-003) for the master's owner.

| Delta | Path | Slice | Why |
|---|---|---|---|
| T-01 | `tests/unit/test_event_envelope.py` | SLICE-01 | Canonicalization, digest and identity rules |
| T-02 | `tests/unit/test_command_identity.py` | SLICE-01 | D14 key/content rules |
| T-03 | `tests/integration/test_entry_outcomes.py` | SLICE-01 | Four entry outcomes through the simulated broker |
| T-04 | `tests/conftest.py` | SLICE-01 | Temporary stores and injected clocks (A08-F4) |
| T-05 | `tests/fixtures/slice01_entry.json` | SLICE-01 | Fixed recorded review and plan fixture |
| T-06 | `tests/unit/test_ledger_invariants.py` | SLICE-02 | Hypothesis state machine for I-1…I-6 (PRF-LED-09) |
| T-07 | `tests/unit/test_authority_grants.py` | SLICE-03 | Grant matrix (PRF-SES-01/02) |
| T-08 | `tests/recovery/test_session_transitions.py` | SLICE-03 | Session transitions and restarts (PRF-SES-03) |
| T-09 | `tests/unit/test_clock_contract.py` | SLICE-01 (types), SLICE-03 | Clock domains and deadlines (PRF-SES-04) |
| T-10 | `tests/unit/test_admission_checks.py` | SLICE-04 | Admission table (PRF-ADM-04) |
| T-11 | `tests/integration/test_dispatch_revalidation.py` | SLICE-05 | Revalidation and late results (PRF-DSP-01/04) |
| T-12 | `tests/integration/test_bounded_io.py` | SLICE-05 | Slow I/O, timeouts, disconnects (PRF-DSP-05/06) |
| T-13 | `tests/unit/test_scheduling.py` | SLICE-05 | Ordering rules (PRF-DSP-07) |
| T-14 | `tests/unit/test_protection_states.py` | SLICE-06 | Protection state machine (PRF-PRT-01/02) |
| T-15 | `tests/unit/test_safety_matrix.py` | SLICE-05 (kill and hold rows), SLICE-06 | Permission matrix and visibility (PRF-PRT-04/05) |
| T-16 | `tests/integration/test_protection_kernel.py` | SLICE-06 | Protection in the kernel process (PRF-PRT-06/07) |
| T-17 | `tests/unit/test_domain_attribution.py` | SLICE-07 | Domain attribution table (PRF-DOM-01) |
| T-18 | `tests/unit/test_reconciliation_rules.py` | SLICE-07 | Reconciliation rules (PRF-DOM-02/03) |
| T-19 | `tests/unit/test_policy_parameters.py` | SLICE-01 (extended later) | Refusing parameters (PRF-XC-03) |
| T-20 | `tests/unit/test_conflict_relation.py` | SLICE-05 | ATA-04 conflict matrix (PRF-PRT-11) |
| T-21 | `tests/recovery/test_release_continuity.py` | SLICE-06 | Protected legs across release changes (PRF-PRT-12) |
| T-22 | `tests/integration/test_verb_completion.py` | SLICE-05 | Verb-specific completion (PRF-LED-16) |
| T-23 | `src/autonomous_trading/kernel/ledger/evidence_store.py` | SLICE-02 | Durable evidence store ([ledger spec](design/ledger-and-atomic-transaction.md#evidence-references-req-led-014); X-007) |
| T-24 | `src/autonomous_trading/resources/migrations/002_sessions_authority.sql` | SLICE-03 | The grant, standing-binding, session and release-binding tables (the master tree shows only `001`; migrations are numbered files under `resources/migrations/`, ledger spec "Schema and migrations") |
| T-25 | `src/autonomous_trading/resources/migrations/003_policy.sql` | SLICE-04 | The `review` and `pause` tables of `kernel.policy` (as T-24) |
| T-26 | `tests/fixtures/planner_parity_445eb116.json` | SLICE-04 | Legacy planner inputs and outputs generated once from `OA@445eb116`: the step 3 golden parity cases (PRF-ADM-03) |
| T-27 | `src/autonomous_trading/resources/migrations/004_safety.sql` | SLICE-05 | The `safety_state` table of `kernel.safety` (as T-24) |
| T-28 | `src/autonomous_trading/resources/migrations/005_reconciliation.sql` | SLICE-07 | The `position` and `reconciliation_fact` tables (as T-24) |
| T-32 | `src/autonomous_trading/kernel/trail.py` | SLICE-06 | The premium ladder ported unchanged from legacy `trail.py`, kept apart from `kernel/protection.py` so its parity is checked on its own ([SLICE-06 step 1](plan/slices/SLICE-06-protection-and-safety.md#step-1--the-ladder-protection-state-and-the-derived-leg)) |
| T-33 | `tests/fixtures/trail_parity_445eb116.json` | SLICE-06 | Golden ladder cases generated once from `OA@445eb116` (as T-26) ([SLICE-06 step 1](plan/slices/SLICE-06-protection-and-safety.md#step-1--the-ladder-protection-state-and-the-derived-leg)) |
| T-35 | `scripts/gen_trail_parity.py` | SLICE-06 | The golden-case generator, run once against a legacy checkout, never in the suite ([SLICE-06 step 1](plan/slices/SLICE-06-protection-and-safety.md#step-1--the-ladder-protection-state-and-the-derived-leg)) |
| T-36 | `tests/unit/test_protection_loop.py` | SLICE-06 | The protection loop's tests under `stop_on_fill`, in place of the step's planned `tests/integration/test_protection_kernel.py` ([SLICE-06 step 2 as built](plan/slices/SLICE-06-protection-and-safety.md#step-2-as-built)) |
| T-37 | `tests/unit/test_protection_basket.py` | SLICE-06 | The basket placement's tests ([SLICE-06 step 3](plan/slices/SLICE-06-protection-and-safety.md#step-3--basket-placement)) |
| T-34 | `src/autonomous_trading/resources/migrations/006_protection.sql` | SLICE-06 | The `protection_state` and `protection_gap` tables (as T-24) |
| T-31 | `tests/fixtures/openalgo` | SLICE-07 | Byte-identical copies of the recorded OpenAlgo book and funds captures (2–4 August 2026) the adapter is proved against ([SLICE-07 step 4](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-4--the-openalgo-adapter)) |
| T-30 | `tests/unit/test_observation_loop.py` | SLICE-07 | The observation loop, publish-before-reference, the read budget and the simulated book ([SLICE-07 step 3](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-3--the-observation-loop)) |
| T-29 | `tests/integration/test_reconciliation_commits.py` | SLICE-07 | What `reconcile` and `attempt_resolve` commit to a composed ledger: the commit side of PRF-DOM-02, Q-006 and Q-007 ([SLICE-07 step 2 as built](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-2-as-built)) |
