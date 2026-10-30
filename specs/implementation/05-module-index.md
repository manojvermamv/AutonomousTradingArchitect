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
| T-38 | `scripts/measure_protection.py` | SLICE-06 | The evaluation-cost measurement (PRF-PRT-10, class M): writes or checks the baseline, never part of the suite's timing ([SLICE-06 step 5](plan/slices/SLICE-06-protection-and-safety.md#step-5--gaps-continuity-cost-and-the-recovery-checks)) |
| T-39 | `tests/baselines/protection_eval.json` | SLICE-06 | The recorded baseline with its workload, machine and commit ([SLICE-06 step 5](plan/slices/SLICE-06-protection-and-safety.md#step-5--gaps-continuity-cost-and-the-recovery-checks)) |
| T-40 | `tests/unit/test_market_windows.py` | SLICE-08 | Calendar, windows, tick lifting and the fold, with POL-019 and Q-030 ([SLICE-08 step 1](plan/slices/SLICE-08-market-data-and-views.md#step-1--calendar-windows-and-bars)) |
| T-41 | `tests/fixtures/market/fold_golden.json` | SLICE-08 | Golden folds generated once from legacy's `_fold` ([SLICE-08 step 1](plan/slices/SLICE-08-market-data-and-views.md#tests)) |
| T-42 | `scripts/gen_fold_parity.py` | SLICE-08 | The golden-fold generator, run once against a legacy checkout, never in the suite ([SLICE-08 step 1](plan/slices/SLICE-08-market-data-and-views.md#tests)) |
| T-43 | `tests/unit/test_market_ingest.py` | SLICE-08 | The merge, coverage and publication ([SLICE-08 step 2](plan/slices/SLICE-08-market-data-and-views.md#step-2--store-ingestion-and-publication)) |
| T-44 | `tests/unit/test_market_view.py` | SLICE-08 | Stable views and corrections ([SLICE-08 step 3](plan/slices/SLICE-08-market-data-and-views.md#step-3--views-and-quality)) |
| T-45 | `tests/unit/test_market_quality.py` | SLICE-08 | Quality against declared requirements ([SLICE-08 step 3](plan/slices/SLICE-08-market-data-and-views.md#step-3--views-and-quality)) |
| T-46 | `tests/integration/test_market_port.py` | SLICE-08 | The kernel's port over the store ([SLICE-08 step 5](plan/slices/SLICE-08-market-data-and-views.md#step-5--the-kernels-port-outline)) |
| T-50 | `tests/unit/test_strategy_registry.py` | SLICE-09 | The registry (PRF-STR-01) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-51 | `tests/unit/test_strategy_invocation.py` | SLICE-09 | Invocations, one view per trigger, handoff (PRF-STR-02) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-52 | `tests/unit/test_buyer_edge_parity.py` | SLICE-09 | BuyerEdge parity walks (PRF-STR-04) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-53 | `tests/fixtures/strategies/buyer_edge_golden.json` | SLICE-09 | Golden walks generated once from legacy ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-54 | `scripts/gen_buyer_edge_parity.py` | SLICE-09 | The golden generator, run once against a legacy checkout, never in the suite ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-55 | `tests/unit/test_cognition_assembly.py` | SLICE-09 | Typed team assembly (PRF-STR-05) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-56 | `tests/unit/test_provider_records.py` | SLICE-09 | Provider and run records, replay (PRF-STR-06) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-57 | `tests/integration/test_review_producer.py` | SLICE-09 | The review producer (PRF-STR-07) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-58 | `tests/unit/test_model_strategy.py` | SLICE-09 | Model strategy proposals (PRF-STR-08) ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-59 | `deploy/systemd/at-strategy.service` | SLICE-11 | The strategy host's unit: README §6 has none; legacy's unit name ([SLICE-09](plan/slices/SLICE-09-strategies-and-cognition.md)) |
| T-60 | `tests/unit/test_operator_authorization.py` | SLICE-10 | Requests and confirmations (PRF-SEC-01, -02) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-61 | `tests/unit/test_secret_references.py` | SLICE-10 | Secret references (PRF-SEC-04) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-62 | `tests/integration/test_unix_channel.py` | SLICE-10 | The local sockets, Linux only (PRF-SEC-05) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-63 | `tests/integration/test_operator_commands.py` | SLICE-10 | Operator commands end to end (PRF-SEC-06) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-64 | `tests/integration/test_owner_api.py` | SLICE-10 | The owner API (PRF-SEC-07) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-65 | `tests/integration/test_mcp_surface.py` | SLICE-10 | The MCP surface (PRF-SEC-08) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-66 | `tests/contracts/test_operator_ui_routes.py` | SLICE-10 | The operator UI's routes (PRF-SEC-11) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-67 | `src/autonomous_trading/resources/migrations/007_security.sql` | SLICE-10 | The `operator_request` table; the number is the next free one at build ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-68 | `tests/integration/test_kill_inputs.py` | SLICE-10 | Kill inputs (PRF-SEC-12) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-69 | `tests/integration/test_operator_routes.py` | SLICE-10 | Legacy owner mutations (PRF-SEC-13) ([SLICE-10](plan/slices/SLICE-10-security-and-operator.md)) |
| T-70 | `src/autonomous_trading/kernel/host.py` | SLICE-11 | The kernel host loop (carried from SLICE-05, -06, -07) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-71 | `src/autonomous_trading/operations/observer.py` | SLICE-11 | The observation mediator, only if TASK-S07-06 proves no read-only credential ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-72 | `deploy/systemd/at-observer.service` | SLICE-11 | The mediator's unit, on the same condition ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-73 | `tests/unit/test_settings_resolver.py` | SLICE-11 | The settings resolver (PRF-CFG-02) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-74 | `tests/recovery/test_release_activation.py` | SLICE-11 | Release transitions and crash points (PRF-CFG-03) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-75 | `tests/integration/test_kernel_host.py` | SLICE-11 | The kernel host loop (PRF-OPS-01) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-76 | `tests/integration/test_supervisor.py` | SLICE-11 | The supervisor (PRF-OPS-02, -03) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-77 | `tests/contracts/test_rendered_units.py` | SLICE-11 | Rendered units (PRF-CFG-06, PRF-OPS-07) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-78 | `tests/unit/test_telemetry.py` | SLICE-11 | Telemetry (PRF-OPS-06) ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-79 | `deploy/systemd/at.slice` | SLICE-11 | One parent slice for optional work ([SLICE-11](plan/slices/SLICE-11-packaging-release-supervision.md)) |
| T-80 | `tests/unit/test_custody_ledger.py` | SLICE-12 | Custody (PRF-RES-01) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-81 | `tests/unit/test_research_attempts.py` | SLICE-12 | Trials and attempts (PRF-RES-04, -05) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-82 | `tests/unit/test_cognition_memory.py` | SLICE-12 | Memory and reflection (PRF-RES-13) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-83 | `tests/integration/test_research_worker.py` | SLICE-12 | Research workers (PRF-RES-06) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-84 | `tests/unit/test_dataset_fitting.py` | SLICE-12 | Datasets and fit records (PRF-RES-07) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-85 | `tests/unit/test_candidate_freeze.py` | SLICE-12 | Candidate freeze and identity (PRF-RES-08) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-86 | `tests/fixtures/research/legacy_identity_445eb116.json` | SLICE-12 | Legacy identity golden values ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-87 | `scripts/gen_research_parity.py` | SLICE-12 | The golden generator, run once against a legacy checkout ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-88 | `tests/unit/test_promotion_gate.py` | SLICE-12 | The directional gate and bar (PRF-RES-09) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-89 | `tests/unit/test_rl_research.py` | SLICE-12 | RL research (PRF-RES-11) ([SLICE-12](plan/slices/SLICE-12-research-rl-custody-promotion.md)) |
| T-90 | `src/autonomous_trading/adapters/lease_store.py` | SLICE-11 | The off-host send-lease store adapter ([SLICE-13](plan/slices/SLICE-13-disarmed-shadow-and-conversion.md)) |
| T-91 | `src/autonomous_trading/resources/migrations/008_import.sql` | SLICE-13 | The importer's accounting tables; the number is the next free one at build ([SLICE-13](plan/slices/SLICE-13-disarmed-shadow-and-conversion.md)) |
| T-92 | `tests/recovery/test_recovery_set.py` | SLICE-11 | The recovery set and restore verification ([SLICE-13](plan/slices/SLICE-13-disarmed-shadow-and-conversion.md)) |
| T-93 | `tests/fixtures/legacy_stores` | SLICE-13 | Small legacy store fixtures, generated once ([SLICE-13](plan/slices/SLICE-13-disarmed-shadow-and-conversion.md)) |
| T-94 | `scripts/gen_legacy_fixtures.py` | SLICE-13 | The legacy fixture generator, run once against a legacy checkout ([SLICE-13](plan/slices/SLICE-13-disarmed-shadow-and-conversion.md)) |
| T-95 | `tests/recovery/test_initial_cutover.py` | SLICE-14 | The cutover states, go-back and fence (PRF-MIG-13) ([SLICE-14](plan/slices/SLICE-14-initial-cutover.md)) |
| T-34 | `src/autonomous_trading/resources/migrations/006_protection.sql` | SLICE-06 | The `protection_state` and `protection_gap` tables (as T-24) |
| T-31 | `tests/fixtures/openalgo` | SLICE-07 | Byte-identical copies of the recorded OpenAlgo book and funds captures (2–4 August 2026) the adapter is proved against ([SLICE-07 step 4](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-4--the-openalgo-adapter)) |
| T-30 | `tests/unit/test_observation_loop.py` | SLICE-07 | The observation loop, publish-before-reference, the read budget and the simulated book ([SLICE-07 step 3](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-3--the-observation-loop)) |
| T-29 | `tests/integration/test_reconciliation_commits.py` | SLICE-07 | What `reconcile` and `attempt_resolve` commit to a composed ledger: the commit side of PRF-DOM-02, Q-006 and Q-007 ([SLICE-07 step 2 as built](plan/slices/SLICE-07-observations-reconciliation-domain.md#step-2-as-built)) |
