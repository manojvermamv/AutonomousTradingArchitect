# Strategies and cognition

* **Status:** proposed (package spec), deepened from the stub this file was when the SLICE-09 design was written (2026-10-30), together with the [SLICE-09 slice file](../plan/slices/SLICE-09-strategies-and-cognition.md). Not yet reviewed by fresh EGM reviewers; the slice file's cycle does that before step 1 is built. Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here. The owner's [standing rules](../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) apply: where a choice touches money, legacy's live behaviour at 445eb116 is kept, and the slice file logs it as a **Fork call**.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `strategies/registry.py` | [Descriptors and the registry](#descriptors-and-the-registry-strategiesregistrypy) |
  | `strategies/worker.py` | [The strategy host](#the-strategy-host-strategiesworkerpy), [Invocations and state](#invocations-and-state-strategiesworkerpy), [Handoff to the kernel](#handoff-to-the-kernel-strategiesworkerpy) |
  | `strategies/buyer_edge.py`, `strategies/ema_cross.py` | [Retained strategies](#retained-strategies-strategiesbuyer_edgepy-strategiesema_crosspy) |
  | `strategies/model_strategy.py` | [Model-generated intents](#model-generated-intents-strategiesmodel_strategypy) |
  | `cognition/blueprint.py`, `cognition/runtime.py` | [Blueprints and typed assembly](#blueprints-and-typed-assembly-cognitionblueprintpy-cognitionruntimepy) |
  | `cognition/tools.py` | [Role-scoped tools](#role-scoped-tools-cognitiontoolspy) |
  | `cognition/providers.py`, `cognition/records.py` | [Providers and run records](#providers-and-run-records-cognitionproviderspy-cognitionrecordspy) |
  | `cognition/review.py` | [Entry review](#entry-review-cognitionreviewpy) |
  | `cognition/advice.py` | [Exit advice](#exit-advice-cognitionadvicepy) |
  | `cognition/memory.py`, `cognition/reflection.py` | Not built in SLICE-09 ([Non-goals](#non-goals)) |

* **Consumes:** stable views, input requirements and window seals ([market-data spec](market-data-and-canvas.md#stable-views-marketviewpy)); the entry route, `ADM-R15` and command status ([intent spec](intent-to-admission.md#review-application-kernelpolicypy), [dispatch spec](dispatch-and-coordination.md)); the evidence store (T-23); sessions, bindings and `CandidateId` ([sessions spec](sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)); the review route `kernel.policy.record_review`.
* **Consumed by:** `kernel/policy.py` (reviews), `kernel/admission.py` (intents), the operator interface (advice and records, SLICE-10).
* **Master anchors:** [Strategy extension](../../../README.md#strategy-extension-and-invocation-contracts) (`README.md:837-843`), [Cognitive Fabric](../../../README.md#cognitive-fabric) (`:845-859`), the A05 rows (`:341-345`), Combined-F5 (`:366`, `:841`), D09 (`README.md:231`, `:847`), D12 (`README.md:245`, `:752`), the reuse rows (`:1149`, `:1152`), the acceptance rows (`:1237`, `:1243`), Phase 5 (`:1185`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root.

## Overview

**In plain words.** A strategy looks at the market once a minute and says "buy a call", "buy a put" or "nothing". Today BuyerEdge does that inside the same program that also sends orders. In the new design the strategy runs in its own program with no broker key. Each minute it reads one fixed market snapshot, decides, writes its decision down safely, and hands it to the kernel, which alone decides whether money moves. If the program crashes mid-decision, the written record says exactly how far it got, so a decision is never lost silently and never sent twice. BuyerEdge's scoring is copied unchanged and checked against the old code bar by bar.

The AI side ("cognition") reviews an entry before it is admitted, as today: a small team of model roles answers ALLOW, BLOCK, PAUSE or "unavailable". Cognition only produces that answer and a full record of how it was reached (which model really answered, which prompt, each retry). The kernel alone applies it, under the mode the owner chose. Cognition has no route to orders, no broker key and no way to change a setting. Nothing here changes a score, a threshold or a review rule.

## The problem

* **The strategy runs inside the order sender.** Legacy runs BuyerEdge in-process in the live host (`scripts/run_framework_live.py:8119-8127`), the same process that submits plans to the gateway (`:3321`). The target strips that host of financial authority (LD-13).
* **No durable invocation identity.** A decision's only identity is its bar index in an append-only file; restart safety is "the highest bar index written" (`scripts/run_framework_live.py:108-122`). A decision written but not yet planned when the host crashes is never planned after restart, because planning starts at the same cursor (`:6834`, `:7728`, `:8103`), and nothing records that it was dropped. Workers' duplicate guards live in memory for the life of the process (`:6938-6943`).
* **A crashed model worker decides again.** The worker commits its cursor after the step, so a crash re-runs the bar and re-consults the model, "by design" (`src/runtime/worker_host/__init__.py:111-114`, `:528-533`): a second, possibly different decision for the same bar.
* **Registration is implicit.** Descriptors are read from strategy files by `ast` (`src/runtime/strategy_host/autoregister.py:102-106`) without importing them, which is right, but the decision method, process placement and authority share one `kind` field (`src/runtime/strategy_host/registry.py:332-340`), and an unknown kind silently becomes `worker` (`:353-362`).
* **Review purposes are distinguished by type only.** Proposal and review are separate classes, with no purpose field (`src/runtime/ai_management/contracts.py:307-381`); a role's abstention and an invalid output both become `failed` (`src/runtime/agent_team/child.py:41-54`; `contracts.py:24`), so records cannot say which happened.
* **Provider evidence is partial.** The reply is kept to 2,000 characters (`src/runtime/advisor/backends/http.py:1001`); the team's replay re-runs models live (`src/runtime/ai_management/team.py:1260-1278`).
* **Capabilities are process conventions.** The team child gets a fresh minimal environment with the broker key withheld and rlimits (`src/runtime/agent_team/__init__.py:176-190`; `child.py:21-25`), which D09 says supplements but does not prove an OS boundary (`README.md:231`).

## Goals

* An explicit, declarative registry validated before any strategy code loads; registration grants nothing (REQ-STR-001).
* One durable identity per invocation; one state lineage per scope; no lost, doubled or regenerated output across crashes (REQ-STR-002).
* Intent generation and fixed-intent review as distinct typed purposes (REQ-STR-003).
* Typed role outcomes and pinned-blueprint assembly, with legacy's consequences (REQ-STR-004).
* Provider and run records that support replay from recorded responses (REQ-STR-005).
* No financial capability anywhere in strategies or cognition (REQ-STR-006).
* BuyerEdge's live scoring unchanged and proved against legacy (REQ-STR-007).
* Today's decision timing and review timing kept (REQ-STR-009).

## Non-goals

* **No change to any score, floor, coverage gate, review requirement, AI mode, pause rule or deadline.** Every one is legacy's or an approved policy row (POL-024, POL-027).
* **No new review requirement, independent reviewer, voting threshold or fallback** (`README.md:1243`). The committee's risk critic (POL-035) and provider fallback activation (POL-036) stay open.
* **Memory and reflection are not built.** `cognition/memory.py` and `cognition/reflection.py` need the research-job port and custody (SLICE-12); POL-029's guard (no settings or policy write) is proved here by the capability test, since no write path exists.
* **No OS enforcement here.** Service identities, mounts, egress and descendant limits for D09 are composed by SLICE-11 (`operations/isolation.py`, `deploy/systemd/at-cognition.service`, the [runtime spec](runtime-isolation-observability-deployment.md)); this slice proves the Python and process boundary.
* **No transport.** The strategy host and cognition reach the kernel through ports; in this slice the ports are in-process (environment class S). The authenticated local channel is SLICE-10's (`adapters/unix_channel.py`).
* **No live model strategy.** `model_strategy.py` is built and proved on recorded responses; legacy's model worker is registered disabled at authority `none` (`src/strategies/ai_ema_cross.py:129-131`).
* **Not ported as strategies:** legacy's two worker specs, `ema_cross_spot` (a `rule`-backend worker, `src/strategies/ema_cross_spot.py:82-99`) and `ai_ema_cross`, both disabled at authority `none`. Reintroducing either is a new descriptor.
* **No comparison of simple and specialist teams.** Phase 5's comparison (`README.md:1185`) is a research evaluation of blueprint variants, deferred to SLICE-12's evaluation; this slice ships legacy's bound blueprint only.

<a id="requirement-keys-pointers"></a>

## Requirement keys

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-STR-001 | Explicit declarative registry; descriptors are validated before any code loads; registration grants nothing; a missing `authority` is refused; registry rows are never rewritten to match a file | A05-F1 (`README.md:839`); POL-030 |
| REQ-STR-002 | The worker owns invocation, input view, prior state and result identity, plus recoverable output handoff; dependent invocations within a state scope are serialized | A05-F2 (`README.md:841`); Combined-F5 |
| REQ-STR-003 | Intent generation and review of a fixed intent are distinct typed purposes; a review never replaces an intent | A05-F3 (`README.md:843`) |
| REQ-STR-004 | Typed team assembly distinguishes contribution, abstention, unavailable, invalid, timeout and cancellation; provider errors are recorded, never treated as ALLOW or BLOCK | A05-F4 (`README.md:851`); POL-037 |
| REQ-STR-005 | Provider and run records keep requested and effective model identity, prompts, context, tools, attempts and typed output; replay uses recorded responses | A05-F5 (`README.md:853`) |
| REQ-STR-006 | Cognition has no financial socket, broker key, live policy write or ordinary locked-OOS access; OS-enforced capabilities | D09 (`README.md:847`); POL-034 |
| REQ-STR-007 | Retained strategies keep approved scoring: BuyerEdge fixed floor; gamma, IV and volume research-only; greeks exact-minute rule | POL-024; §7 (`README.md:1149`) |
| REQ-STR-008 | Provider `Retry-After` pause ends no later than session close, with a warning past 15 min; no internal budget ceiling | POL-032, POL-033 |
| REQ-STR-009 | A decision pass decides each confirmed window once, on a pinned view, in window order, at legacy's pass timing | A05-F2 (`README.md:841`); POL-019 |
| REQ-STR-010 | Exit advice is record-only; a human application becomes one typed action through normal admission | POL-028; D12 (`README.md:752`) |
| REQ-STR-011 | Every decision, abstentions included, is recorded with the kernel, so the retained fresh-setup gate reads the strategy's previous decision as legacy did, across restarts | POL-023; A05-F2 (`README.md:841`) |

## Critical user journeys

### CUJ-STR-1: BuyerEdge decides on the 10:41 bar

At 10:42:07 (the 10:41 window's confirmation instant) the strategy host's pass runs. The market store sealed the window at 10:42:07.2; the host waited for that seal, then resolved the view for trigger `10:41` with its cutoff at 10:42:07, so the view's newest bar is 10:41 and its chain is the 10:41 poll. BuyerEdge scored 47 against its floor of 40: `EXECUTE`, direction CE. The host committed, in one transaction of its own store, the invocation's new state revision and its output: an intent `long_call` with `signal_score` `"47.0"` and `conviction` `"0.47"`. It published the intent as evidence, recorded the decision with the kernel, asked cognition for the review, and submitted the entry with the invocation's command key. Admission answered `ADM-R15` (review pending); the host retried with the same key; cognition recorded an ALLOW at 10:42:11; the next retry was admitted, its view age measured from the 10:41 bar.

### CUJ-STR-5: A catch-up window

The market process restarts and the 10:41 window is sealed only at 10:43:40. The next pass resolves 10:41's own view (cutoff 10:42:07) and decides it. Admission measures the view's age from the 10:41 bar, 93 s, and refuses it `ADM-R05` (stale), as legacy measured from the decision's own bar; the planner never sees a newer minute's chain.

### CUJ-STR-2: The host crashes after deciding, before submitting

The host is killed after committing the 10:52 output and before publishing it. On restart, recovery finds the output with no handoff, asks the kernel for its command key, and finds none. The output is marked `abandoned` with cause `host_restart` and is not submitted, as legacy, which never planned a decision written before a crash. The next pass decides 10:53 on a fresh BuyerEdge state, as legacy restarts empty. Nothing is decided twice, and the record says why 10:52 sent nothing.

### CUJ-STR-3: A required review role times out

The bound blueprint has a lead and one required specialist. The specialist's provider answers 429 with `Retry-After: 21600` at 14:00. The provider record keeps the 429, the hint and the clamp to the 15:30 close, and a warning is raised (pause over 15 min). The role's outcome is `unavailable` (`provider_error`); the required role failed, so the review's outcome is `unavailable` with cause `required_role_failed`. The kernel applies `proceed_unavailable` with an alert, as legacy fails open.

### CUJ-STR-4: A review arrives for a changed intent

A review produced for intent digest `d1` is submitted for an entry whose intent is `d2`. The kernel judges it `invalid` (`digest_mismatch`) and never `allow` (intent spec). Cognition never builds a replacement intent: a changed intent needs its own review (A05-F3).

## Technical plan

### Descriptors and the registry (`strategies/registry.py`)

* **A descriptor is data**, declared in the strategy module as a literal and read with `ast.literal_eval` without importing the module, as legacy's auto-registration (`src/runtime/strategy_host/autoregister.py:102-106`, `:155-220`):

  ```text
  StrategyDescriptor(id, family, implementation: "strategies.<module>:create", version,
      decision_method: deterministic | model,      # does a model generate intents
      hosting: process,                            # the only supported placement
      underlying, timeframe, higher_timeframes, warmup_bars,
      input: InputRequirement + view_policy name,  # contracts/market.py (SLICE-08)
      output: purpose "entry_intent", score_source: signal_score | conviction_x100,
      state: {scope: (strategy, underlying, session), kind: stateless | in_memory | checkpointed,
              restoration: recompute | reset_on_restart | checkpoint},
      requested_capabilities: subset of {market.read, evidence.publish, kernel.entry_submit,
              kernel.command_status, cognition.review_request, cognition.propose},
      requested_authority: none | plan | trade)
  ```

* **Axes are independent** (A05-F1): `decision_method`, `hosting` and authority. Legacy's `kind` maps on read: `library` and `worker` to `deterministic`, `ai_worker` to `model`, every one to `process` (`registry.py:332-346`, `:365-377`). **Deviation:** an unknown value is refused, not mapped to `worker` (`:353-362`): registration grants nothing, so refusing costs nothing and hides no typo.
* **Validation before load.** The registry refuses, before any import: a missing or unknown field; an `implementation` outside the `strategies` package; a capability outside the set above; a `model` method without `cognition.propose`; a `checkpointed` state without `checkpoint` restoration; a missing `requested_authority` on a new row, with legacy's text (`autoregister.py:352-359`, POL-030). Only a validated descriptor's module is imported, by the host, in its own process.
* **Rows are the operator's.** A registry row (`enabled`, `authority`, `account`) lives in the bound release settings, `strategies.registry.<id>`, written by the owner when a release binds the strategy; a row needs a descriptor of the same id. **Deviation:** legacy created rows itself at each live startup from file declarations (`scripts/run_framework_live.py:7494-7502`; `autoregister.py:356-384`); the target creates none, and a descriptor without a row runs nothing. **The ceiling** is `strategies.registry.ceiling` (legacy `strategy_host.default_authority`, `trade`, `config/defaults.yaml:1238`): as in legacy it applies only where a declaration would set authority, so a descriptor's `requested_authority` above it is reported and capped, and an unknown value counts as `none` (`autoregister.py:364-384`); **a row's authority is never rewritten** from a file, only reported (`:421-432`). BuyerEdge's file declares `none` while its live row holds `trade` (`autoregister.py:421-426`; `src/strategies/buyer_edge.py:2116`): the row, read from the live registry by TASK-S09-08 and carried unchanged, decides.
* **A test-only strategy package.** The simulation composition alone may add one test package of descriptors and implementations (as it alone accepts a `FaultPlan`); the production composition refuses it.
* **Authority keeps legacy's meaning** (`registry.py:386-388`): `none` decides and records; `plan` may be carried to a request; `trade` may have that request submitted. Only `trade` submits. The kernel's grants still decide every submission (SLICE-03). **Deviation:** under `plan` the host records the intent only; the kernel has no plan-without-send route.
* **Candidate identity.** The registry computes the `CandidateId` manifest the sessions spec defines (`{"strategy", "strategy_version", "code_digest"}`, over the implementation module and the modules it declares as its code) so the intent's `candidate_id` matches the session binding.

### The strategy host (`strategies/worker.py`)

* **One strategy per host process**, as legacy refuses a second library strategy in one process (`scripts/run_framework_live.py:7546-7564`). The host process holds no broker credential and no ledger writer; it is spawned with the broker key removed from its environment, as legacy's `_child_env` (`src/runtime/strategy_host/process.py:326-330`).
* **Pass timing (legacy, Fork call).** Passes are phase-locked to each window's confirmation instant, `window end + market.bar_confirm_lag_secs`, with the cadence `strategies.host.pass_secs` between them, by legacy's `seconds_to_next_pass` (`scripts/run_framework_live.py:3424-3450`; default poll 20 s, `:7472`). The pass at the confirmation instant decides the window that just closed.
* **Which windows a pass walks.** Every base window after the scope's last decided trigger, oldest first, once sealed ([market-data spec](market-data-and-canvas.md#bars-and-finality-marketviewpy)); the pass waits for the newest confirmed window's seal for at most `strategies.host.seal_wait_ms`. A window still unsealed is walked by a later pass, before any newer window. Legacy walked a bar once its clock confirmed it, with the ticks flushed by then; deciding on the sealed bar is the owner-approved Q-030 rule applied by SLICE-08 ([Q-030](../decisions/owner-questions.md#q-030)), not a fork.
* **One view per trigger (Fork call).** Each window is decided on its own view, resolved with its cutoff at that window's confirmation instant, so the view's newest confirmed bar is the trigger's and its exact-minute chain is the trigger minute's poll. Admission then measures B1's view age from the trigger's own bar and the planner prices from the trigger minute's chain, as legacy measured age from the decision's own stamp and planned from that minute's exact chain (`scripts/run_framework_live.py:6840-6846`, `:6894-6902`). A catch-up window decided late is therefore refused as stale when its bar is past B1's bound, never admitted with a newer view's age. This needs two things from SLICE-08's view, carried into its step 3: resolution with a cutoff earlier than the resolution instant, and the `exact_minute` chain join anchored at the newest confirmed base window by the cutoff.
* **Warm-up.** A window whose index in the session is below the descriptor's `warmup_bars` is walked and recorded as `warmup`, with no invocation, as legacy's runner (`src/core/framework/runtime/runner.py:96-102`).
* **A pass that cannot read** the market view or reach the kernel walks no window; the next pass walks them, as legacy's faulted pass (`scripts/run_framework_live.py:8103-8117`).

### Invocations and state (`strategies/worker.py`)

* **The strategy store.** One SQLite file per host, written only by that host, separate from the ledger and the market store: `invocation`, `scope_head` and, for `checkpointed` strategies, `state` rows. The host takes an exclusive lock at start; a second host for the same strategy exits.
* **Identity.** `invocation_id = "inv1:" + sha256_hex(canonical(candidate_id, session_id, scope, view_policy_name, view_policy_version, trigger))`, 69 characters, where `trigger` is the decided window's start and interval. It is fixed before anything is read, so a retry can never mint a new identity (A05-F2), and a different view policy (research, replay with corrections) is a different invocation. It uses only `[0-9a-f:]` and is at most 128 characters, so it is a valid `CommandKey` (`contracts/identity.py`) and is used unchanged as the intent's `intent_id` and the entry's command key; the kernel's D14 identity deduplicates any resubmission. It never starts with the kernel's reserved `prot:`.
* **States.** `PLANNED → RESOLVED → COMPLETED → HANDED_OFF | RECORDED | ABANDONED`:

  | Transition | Written in one transaction |
  |---|---|
  | `RESOLVED` | the pinned `view_id` and the predecessor revision `r` read from `scope_head` |
  | `COMPLETED` | the output (intent, or abstention with its cause), its `result_id` digest, the new state revision `r + 1` (its digest, and its body when `checkpointed`), and `scope_head` moved to `r + 1` only if it still reads `r` |
  | `HANDED_OFF` | the command key and the kernel's outcome (admitted or refused) |
  | `RECORDED` | an abstention, or an intent under authority `none` or `plan`: evidence only, no submission |
  | `ABANDONED` | the recovery cause; no submission |

* **Invariants.**
  * I-W1: per scope, at most one `COMPLETED` invocation per predecessor revision; a second is refused `predecessor_moved` and leaves no state (Combined-F5: no last-writer-wins).
  * I-W2: a `COMPLETED` output never changes; a recomputation with a different `result_id` is refused and recorded as a conflict, never overwritten.
  * I-W3: at most one kernel command per invocation (the derived key).
  * I-W4: a state revision is published only with its output (A05-F2: they cannot separate across a crash).
  * I-W5: a new session starts a new scope instance (the session is in the scope); the old head is frozen. Strategy state never holds what an open position needs: protection state is the kernel's (Combined-F6, SLICE-06).
* **Serialization.** Invocations within one scope run one at a time, in trigger order, as legacy's single-flight loop (`src/runtime/worker_host/__init__.py:515-519`); different scopes and stateless strategies may run concurrently.
* **Restoration per descriptor** (A05-F2):
  * `recompute` (stateless; EMA cross): any invocation is recomputed from its view.
  * `reset_on_restart` (BuyerEdge, Fork call): state lives in process memory and restarts empty at the resume point, as legacy restarts a fresh strategy and walks only bars after its cursor (`scripts/run_framework_live.py:7728`; `runner.py:96-99`). The reset is recorded as `STATE_RESET(cause: host_restart)` so the lineage stays explainable.
  * `checkpoint`: the predecessor's stored body is loaded and checked against its digest.
* **Corrections.** A live view policy excludes corrections, so a later revision of a decided window never re-invokes it, as legacy's cursor never re-walks a bar. A research or replay composition with corrections has a different view policy and so different invocations.
* **Errors.** A strategy that raises completes with an abstention, cause `strategy_error` and the exception text, as legacy's runner (`runner.py:112-115`).

### Handoff to the kernel (`strategies/worker.py`)

* **Order of operations** for every `COMPLETED` invocation:
  1. publish the output (intent or abstention) as evidence; content-addressed, so repeating it is harmless;
  2. **record the decision with the kernel** (below), for every invocation, abstentions included;
  3. for an intent, whatever the strategy's authority, **request the review** from cognition. Legacy reviews every ENTER decision it plans before any gate (`scripts/run_framework_live.py:4027-4036`, before the planner's gates at `:4199`) and before the gateway's authority check (`:6904-6913`), so a PAUSE starts even when the entry is later refused (Fork call). The request does not depend on the kernel's answer to the entry;
  4. for an intent under authority `trade`, submit the `EntryRequest` and act on the kernel's answer (table below);
  5. record `HANDED_OFF` or `RECORDED`.
* **The decision record (Fork call).** The retained fresh-setup gate (POL-023) reads `SessionStats.setup_fresh` (`kernel/planner.py`, as built). Legacy computes it from the strategy's own decisions file, durable across restarts: an ENTER is fresh only when the decision recorded just before it is not an ENTER, abstentions and strategy errors included, and a decision not found in the file is not fresh (`scripts/run_framework_live.py:6790-6798`, `:6891-6893`). So the host records each decision with the kernel, `record_decision(invocation_id, strategy, session_id, trigger, kind: ENTER | NOTHING, evidence_ref)`, idempotent by `invocation_id`; the kernel commits it to its own ledger and derives `setup_fresh` for an intent from the latest recorded decision of that strategy and session with an earlier trigger, `False` when the intent's own decision is not recorded. The kernel reads its own record, not a field the strategy supplies. Warm-up windows and windows not walked are not decisions, as legacy records neither (`runner.py:100-102`). The kernel route and the derivation are a change to the [intent spec](intent-to-admission.md#planning-port-kernelplannerpy-kernelselectionpy)'s `SessionStats` row, carried there for integration.
* **The kernel's answers** to an entry, and the host's action (each retry uses the same command key; the **retry bound** is the moment the trigger's bar is older than admission's own `max_view_age_secs` setting, measured from the stamp B1 uses (`kernel/admission.py`, `_b1`), so no new value is introduced):

  | Answer | Meaning | Host action |
  |---|---|---|
  | Admitted, or a recorded refusal (any check) | Terminal | `HANDED_OFF` with the outcome |
  | `ADM-R15` `review_pending` | Nothing recorded; review not yet in | Retry every `strategies.host.review_retry_ms`; the kernel's review deadline ends the wait |
  | `ADM-R12` `busy` | Not recorded (`kernel/admission.py`, A0) | Retry every `strategies.host.review_retry_ms` until the retry bound; then `ABANDONED` (`busy_until_stale`). **Deviation**, for the owner's review: legacy had no busy refusal; this keeps the entry going while its bar is valid, which is the closest to legacy |
  | `LED-R02` `idempotency_conflict` | The key exists with another request | `ABANDONED` (`idempotency_conflict`) with an alert; never a new key (the request is deterministic, so this is a defect) |
  | `commit_failed` | The ledger reports nothing committed | Retry until the retry bound; then `ABANDONED` (`commit_failed`) |
  | Writer lost, channel error or timeout | Outcome unknown | Ask the kernel's command status for the key: known, adopt it; unknown, retry until the retry bound, then ask once more and `ABANDONED` (`outcome_unknown`) if still unknown |

* **The submitter.** The host acts as one service principal, `Principal("strategy:<id>", "service")`, authenticated over SLICE-10's channel (a test principal with a synthetic grant in class S). Its `entry` grant for the row's account is recorded by a human holding `grant_admin` ([sessions spec](sessions-authority-lifecycle.md)). The `EntryRequest` (`contracts/execution.py`) carries that principal, `account` from `strategies.registry.<id>.account` (first release: the current account, Q-005), `session_id` = the financial session of (account, the view policy's calendar) on the trigger's exchange date, and `intent_ref` = the published intent's digest.
* **The intent** (`contracts/decisions.py`, as built): `strategy`, `family`, `strategy_version`, `session_id`, `candidate_id`, `view_id`, `underlying`, `as_of` (the window's start, exchange domain), `direction`, `structure_id`, `market_bias`, `scores` and the evidence references of the decision record. The score mapping is the descriptor's `score_source`, legacy's per path (Fork call): `signal_score` is the scorer's signed score for a library strategy (`scripts/run_framework_live.py:4211`), and `conviction × 100` for a worker (`:7115-7125`); `iv_rank` is `None`, as the planner passes none.
* **Recovery** of each invocation not in a terminal state, before the first pass:

  | Point | Found | Result |
  |---|---|---|
  | CP-W1: after `RESOLVED`, before `COMPLETED` | no output | Re-run the trigger on the same `view_id` (re-opened by identity), as attempt 2 of the same invocation, from the restored state (`reset_on_restart`: empty, with `STATE_RESET`) |
  | CP-W2: after `COMPLETED`, before the evidence is published | output, no handoff | Publish and record the decision (legacy's decision row was already durable); request no review; ask the kernel for the command key; none: `ABANDONED` (`host_restart`), not submitted (Fork call) |
  | CP-W3: after publishing, before the decision record | as CP-W2 | as CP-W2 |
  | CP-W4: after submitting, before `HANDED_OFF` | as CP-W2 | Record the decision if missing; the kernel has the key: adopt its outcome as `HANDED_OFF`, never resubmit as new (A05-F2: a lost acknowledgement resolves the original output); none: `ABANDONED` |
  | CP-W5: during the retries of `ADM-R15`, `ADM-R12`, `commit_failed` or an unknown outcome | as CP-W2 | As CP-W4: adopt a known outcome, else `ABANDONED` |

  **Fork call:** legacy never plans a decision written before a crash (`scripts/run_framework_live.py:6834`, `:7728`, `:8103`); the target keeps that and records it. A decision is recorded with the kernel even when abandoned, as legacy's decision row stayed in the file the fresh-setup gate reads. Submitting the entry after recovery, under B1's unchanged view-age check, is a spec-only improvement, listed in the slice file and not made.

### Retained strategies (`strategies/buyer_edge.py`, `strategies/ema_cross.py`)

* **BuyerEdge's scorer is ported unchanged**, with strategy version `buyer_edge@445eb116`: `SignalEngine.score` and its components, `BotConfig` and its defaults (`src/strategies/buyer_edge.py:289-357`, `buyer_edge.py:777-810`, `buyer_edge.py:864-876`, `buyer_edge.py:1862-2045`), `to_intent`'s mapping (`buyer_edge.py:2228-2322`) and the strategy's `on_bar` (`buyer_edge.py:2388-2406`). The floor is the code's `min_score` 40 (`buyer_edge.py:294`), clamped to 1…100 (`buyer_edge.py:1988-1992`), since the live scorer is built from `BotConfig()` defaults (`buyer_edge.py:2454`); a different floor is a new strategy version, never a setting. `WATCH` never acts (`buyer_edge.py:2124-2127`). This is the §7 keep/wrap row (`README.md:1149`).
* **Research-only parts stay as coded** (POL-024, Fork call): the session-adjusted floor is computed and recorded as `effective_min_score_shadow`, never applied (`:2204-2225`, `:2506-2512`); RVOL and the OI shadows carry `score_max=0` and so never score (`:1405-1409`, `:1951`); the fuller gamma profile is a record-only tag (`src/runtime/market_view.py:155-160`). **Found, kept, listed for the owner:** `GAMMA_REGIME` (`score_max=2`) and `IV_REGIME` (`score_max` 1.0) are fast-tier live components (`buyer_edge.py:1568`, `:1027`, `:1641-1644`). Without a net GEX total or an IV rank they score 0 or are unavailable, and an unavailable fast component lowers the coverage the 0.70 gate reads (`:1998-2007`, `:810`). The port keeps that; POL-024 calls both research-only.
* **The scorer's inputs, assembled over the view** as legacy's `MarketView.scoring_at` and `RealScorer` (`src/runtime/market_view.py:740-795`; `src/data/replay_engine/scorer.py:111-173`):
  * the chain poll whose minute equals the bar's minute, else no score ("no chain for this minute", `market_view.py:774-776`, `:848-860`);
  * the spot series through the bar, as an OHLCV frame (`:956-993`), else no score;
  * a rolling history of the last `chain_smooth_bars` chain minutes, 5 by default (`scorer.py:77-80`), appended only after a minute's whole assembly succeeds (`market_view.py:789-791`), smoothed by the engine's own smoother; the spot and straddle of the previous minute whose chain assembled, which is kept even when that minute's spot frame then fails (`market_view.py:783-787`);
  * the scorer's clock: `RealScorer` binds the engine module's `get_ist_now` to the bar's stamp for the call (`scorer.py:129-143`), and the engine reads it to cut the day's frame (`buyer_edge.py:1353`), so the bound clock is an input of every bar;
  * Greeks by the exact-minute rule: keyed by `(minute, strike, side)`, the newest batch at or before the stamp within that minute, a minute without its own batch unpriced (`src/data/marketdata/scans.py:273-282`, `:316-331`); ATM deltas, bids, asks, the synthetic future and GEX by strike from them (`market_view.py:627-663`);
  * no age bound: the library scoring view is unbounded (`market_view.py:214-217`, `:333-338`), so BuyerEdge's view policy binds `stale: report`; admission's ages are unchanged (Fork call).

  These need three market-view reads SLICE-08 step 3 does not yet name: the spot records through the cutoff, the chain poll of one exact minute, and the Greeks records of the day through the cutoff. With the two view needs of [one view per trigger](#the-strategy-host-strategiesworkerpy), they are carried into SLICE-08 step 3; the market spec owns their signatures.
* **State.** BuyerEdge carries state across bars: the engine's OI z-score buffers and zone state, created on first use per symbol (`buyer_edge.py:1839-1842`, `:1898-1899`), and the assembly's previous assembled minute and chain history (above). This is its `in_memory` state, restored by `reset_on_restart`. Its parity is therefore proved on contiguous walks from a fresh engine, from the session's start and from restart points, with gap minutes (no chain for the minute, no spot frame) inside them, comparing every bar.
* **Output.** `EXECUTE` with a direction becomes an intent: `CE` → `long_call`, `PE` → `long_put`, `structure_id` `single_long_option`, `market_bias` from the direction (`src/core/framework/runtime/types.py:57-59`), `conviction = min(1, |score| / 100)` (`buyer_edge.py:2297`). Anything else, including a zero score ("no direction", `:2306-2311`) and a bar with no close (`:2394-2398`), is an abstention carrying legacy's reason, components and tags (`:2280-2304`), recorded and never submitted.
* **EMA cross** (`strategies/ema_cross.py`) ports legacy's library `EmaCrossover` (`src/strategies/ema_crossover.py:105`, `:164-185`) unchanged, registered disabled at authority `none`. It is the stateless example (`recompute`) the invocation protocol is proved with.

### Model-generated intents (`strategies/model_strategy.py`)

* A model strategy sends a `ProposalRequest(purpose: "intent_proposal", invocation_id, view_id, descriptor, prompt identity)` to cognition and receives a `ProposalResult` (direction, conviction, reason, or an explicit abstention) under the same run records as a review (A05-F3).
* It converts the result into an `Intent` or an abstention; nothing else. A `ProposalResult` can never be submitted as a review: the purposes differ, and the kernel refuses a review whose `purpose` is not `entry_review`, cause `wrong_purpose`.
* On recovery the invocation's recorded proposal is reused; a new provider call is a new attempt of the same invocation, recorded as such. **Deviation:** legacy re-consults the model after a crash (`src/runtime/worker_host/__init__.py:111-114`).

### Blueprints and typed assembly (`cognition/blueprint.py`, `cognition/runtime.py`)

* **Blueprints keep legacy's validation** (`src/runtime/ai_management/blueprint.py`): roles with backend, profile, instruction version, input scope, output schema, required flag and deadline; one required lead that is the only member of the final synthesis stage; every specialist reaching the lead; cycles and self-edges refused; caps of 120 s per role and 300 s per team (`blueprint.py:118-121`). The per-role model, endpoint and prompt resolve from profiles and are pinned into the team digest (`src/runtime/ai_management/team.py:156-292`). The blueprint digest and lineage digests are the ones the session's binding records; a review with others is `invalid` (`lineage_mismatch`) at the kernel.
* **Budgets and bounds** (`README.md:849`). A blueprint keeps legacy's limits: task, round and concurrency limits and the team's memory, CPU and output-byte bounds (`blueprint.py:348-366`), per-role memory, CPU and output bytes, and the pool of four (`src/runtime/agent_team/__init__.py:24`). The token budget is each role's pinned `max_tokens` from its profile (`team.py:237-251`). Legacy's roles receive their input scope as supplied context and make no tool calls (`src/runtime/agent_team/__init__.py:22`), so the first release's tool-call budget is 0; a blueprint that grants a role callable tools must name a `tool_call_budget` (refusing, no default) and a per-result byte bound. Descendant-wide limits are SLICE-11's OS work; until then the child rlimits apply.
* **Committee roles.** Legacy's committee accepts exactly `ce_case` and `pe_case` ("risk is deferred", `src/runtime/advisor/backends/committee.py:192-193`). A risk-critic role is refused while `cognition.committee.risk_critic` is `deferred` (POL-035, open).
* **The runtime** (`CognitiveAgentRuntime`) reuses legacy's team supervision: roles run as child processes with a fresh minimal environment and the broker key withheld (`src/runtime/agent_team/__init__.py:176-190`, `:824-830`), parent-death kill and rlimits (`child.py:17-25`), killed at their deadline.
* **Role outcomes are typed** (A05-F4): `contribution`, `abstention`, `unavailable` (with the provider status: `provider_error`, `backend_error`, `not_configured`, `budget_exhausted`, `held`, from `src/runtime/advisor/__init__.py:313-314`), `invalid` (`invalid_output`, `invalid_typed_output`), `timeout`, `cancelled`. **Deviation:** legacy records abstention and invalid output as `failed` (`child.py:41-54`); the consequences below are legacy's.
* **The assembly validator** checks, independently of any narrative: every required role contributed; nothing passed the team deadline; the lead's output matches the result schema. A second result for a role is recorded `duplicate` and ignored; a result after its deadline is recorded `late` and excluded.
* **Consequences (legacy, Fork call):** a required role that does not contribute, whatever its outcome, makes the result `unavailable`, cause `required_role_failed`; a passed team deadline, `deadline_expired`; an invalid lead output, `failed_lead` (`team.py:916-925`, `:1435-1473`). An optional role that does not contribute is omitted and named (`unavailable_optional_workers`). No voting threshold, default ALLOW or BLOCK, or extra time exists. A single specialist is a valid team.

### Role-scoped tools (`cognition/tools.py`)

* Each role reads only its declared input scope (`blueprint.py:252-258`) through read-only tools: market reads through one pinned view (SLICE-08) and Canvas facts; the kernel's read models through the independent reader (SLICE-02). Every result carries its view identity or source, as-of instant and partition (`README.md:849`).
* Management context sources keep legacy's 300 s freshness and its unavailable rule (`scripts/run_framework_live.py:4491-4497`; `src/runtime/ai_management/service.py:254-269`).
* No tool writes, submits, reads a credential or reads locked out-of-sample evidence.

### Providers and run records (`cognition/providers.py`, `cognition/records.py`)

* **Backends** keep legacy's: `rule`, `http` (an OpenAI-compatible endpoint), `chain`, `replay` (`src/runtime/advisor/backends/`). `http` makes one request per call with no in-call retry, except one retry without `response_format` after a 400 (`http.py:698-710`).
* **Retry-After (POL-032).** A finite hint is honoured in full but never past the session close, recorded as `provider_retry_after_clamped`; a 429 opens the circuit at once; a non-finite hint takes the capped backoff (`http.py:770-795`, `:1055-1076`). A pause longer than `operations.telemetry.advisor_pause_warn_minutes` (approved 15) raises one warning through `operations/telemetry.py`, as legacy's monitor (`monitoring/advisor_availability.py:142`, `:154`; `config/defaults.yaml:1792`).
* **Budgets (POL-033).** `cognition.providers.budgets` is `{}`: with no call or amount cap nothing is refused for budget (`src/runtime/advisor/budget.py:131-151`, `:183-186`).
* **Fallback (POL-036, open).** The chain backend is built; it falls through only on `provider_error`, `timeout`, `backend_error`, `not_configured` or `budget_exhausted` (`chain.py:17-18`, `:112-118`). Whether any blueprint may name it is `cognition.providers.fallback`, a refusing setting: the loader refuses a composition that does not bind it, and the first release binds `inactive`.
* **A 429 or any provider failure** is recorded as an `unavailable` contribution with status `provider_error`, never as ALLOW or BLOCK (POL-037; `src/runtime/advisor/__init__.py:323-341`).
* **The run record** (A05-F5), published to the evidence store before any record refers to it (Combined-F2):

  ```text
  RunRecord(run_id, purpose: entry_review | intent_proposal, request_digest, intent_ref | invocation_id,
            blueprint_digest, configuration_digest, lineage_digests, started_at, deadline,
            roles: [RoleRecord(role, required, outcome, cause, output_ref, output_digest, late, duplicate,
                   attempts: [Attempt(n, backend, provider, requested_model, effective_model | "unknown",
                              response_id, system_fingerprint, prompt_version, prompt_digest,
                              context_refs (view_id, tool result refs), settings_digest,
                              started_at, ended_at, status, failure_class, retry_after,
                              clamped, tokens, cost, response_ref)])],
            synthesis: (lead, output_digest, parser_version), result, terminal_state)
  ```

  `effective_model` is the provider-reported model (`http.py:983-993`), recorded `unknown` when the provider reports none: a requested alias is not proof of what ran. Chain attempts keep their order (`chain.py:112-118`). **Deviation:** the response body and the parsed typed output are kept whole, as evidence, where legacy kept 2,000 characters of the reply (`http.py:1001`); retention and access follow Combined-F2 and SLICE-11.
* **Records** keep legacy's append-only, hash-chained `RecordStore` (`src/runtime/ai_management/store.py:74-84`), in cognition's own store, never the ledger.
* **Replay** consumes recorded responses: the replay backend answers each attempt from its `response_ref`; a missing one is `unavailable`, cause `replay_gap` (legacy abstains, `src/runtime/advisor/backends/replay.py:57-63`). A replay composition is given only the replay backend, so a fresh inference cannot happen in it; re-running a team live on recorded inputs (legacy `team.py:1260-1278`) is a new evaluation with a new `run_id`.

### Entry review (`cognition/review.py`)

* **What it does.** Legacy's `EntryReviewService._review_entry` (`src/runtime/ai_management/service.py:211-436`) up to the team result, and nothing after: the application under the mode, the pause store and the BLOCK refusal (`:437-504`) are the kernel's (D12; `kernel/policy.py`, as built).
* **Request.** `ReviewRequest(purpose: "entry_review", intent_ref, context)`, idempotent by `intent_ref`: a second request for the same intent returns the first run. The host requests one for every intent it publishes, whatever the strategy's authority and whatever admission answers the entry ([handoff](#handoff-to-the-kernel-strategiesworkerpy), step 3), so a PAUSE recorded for an entry refused at A4 still starts its pause in `enforce_entry_holds`, as legacy's review ran before any gate.
* **It always answers** (Fork call). Every failure produces a `Review` with outcome `unavailable` at once rather than silence: no bound team, unreadable context, a pinned configuration that does not match, as legacy's fail-open `_unavailable` (`service.py:117-138`, `:230-274`). The kernel then applies `proceed_unavailable` with an alert, without waiting out its deadline. A mode of `off` produces no review; the kernel's application is `review_not_required`.
* **The result.** `Review(review_id, purpose: "entry_review", intent_digest = intent_ref, outcome, pause_minutes, configuration_digest, blueprint_digest, lineage_digests, started_at, completed_at, valid_until, evidence_refs = (run record))`, with legacy's actions mapped: `ALLOW` → `allow`, `BLOCK` → `block`, `PAUSE` → `pause` with its requested minutes, `AI_UNAVAILABLE` → `unavailable` (`src/runtime/ai_management/contracts.py:22`). Legacy's reason code (`required_role_failed`, `deadline_expired`, `context_unavailable` and the rest) is kept in the run record. Cognition never emits `abstain` for an entry review; legacy has no such action.
* **Deadline.** The run's deadline is the blueprint's `deadline_seconds`, at most 300 (`service.py:279-282`); the kernel's review deadline is the session binding's same value, from its first sight of the intent.
* **Submission.** Cognition records the review through `kernel.policy.record_review`; it never builds a `ReviewApplication` (PRF-XC-02).

### Exit advice (`cognition/advice.py`)

* Legacy's exit advice is a recommendation, recorded with its position and evidence identity (`src/runtime/ai_management/advice.py:868-897`); it never produces an action by itself (POL-028).
* `application_request(advice_id, principal, reason)` turns an authenticated human's application into one typed close or protection-modify request, as legacy's `apply_advice` issues one close or protection request (`advice.py:899-991`), which then passes normal admission, where the position is revalidated. The human route and its confirmation are SLICE-10's (`interfaces/authorization.py`).

## Failure modes and crash points

| Point | What happens | Recovery |
|---|---|---|
| CP-W1 … CP-W5 | The strategy host dies inside an invocation or its handoff | [Handoff to the kernel](#handoff-to-the-kernel-strategiesworkerpy): re-run on the same view, adopt the kernel's outcome, or abandon with a recorded cause |
| CP-C1: cognition dies after recording a run, before `record_review` | The run exists; the kernel has no review | On restart cognition resubmits the recorded review for every finished run without one; the kernel keeps the first by arrival, so a repeat changes nothing |
| CP-C2: cognition dies mid-run | No review | A request found unfinished is completed as `unavailable` (`cancelled`), never re-run past its deadline |
| A role's child exceeds its deadline or resources | The child is killed; the role is `timeout` or `unavailable` | Assembly applies legacy's consequence |
| The kernel is unreachable | No submission | The pass walks no window (legacy's faulted pass) |
| The market view is unavailable or unsealed past the wait | No invocation for that window | A later pass walks it; B1 judges its age |
| Two hosts for one strategy | The second cannot take the store lock and exits | The supervisor (SLICE-11) |

## Risks and limits

* **Parity is per bar, on generated and recorded inputs.** It shows the port computes what legacy computed from the same inputs; the input assembly over the new store is proved separately, and recorded-day decision parity needs recorded sessions (slice file).
* **The pass waits for a seal.** A late seal delays a decision by up to `strategies.host.seal_wait_ms`; B1's view age still bounds the entry.
* **BuyerEdge state after a restart is thinner** than an uninterrupted run's for the next few bars (the five-minute chain smoothing, the previous straddle), exactly as legacy's.
* **Provider identity can be unknown.** A provider that reports no model leaves `effective_model` `unknown`; replay never claims more.
* **Process limits are not an OS boundary.** Until SLICE-11 composes service identities and mounts, D09 is proved only at the Python and process level.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `strategies.registry.<id>` | `enabled`, `authority` and `account` per registered strategy, written by the owner in the release binding | No default; `authority` required (POL-030); first release carries the live rows unchanged (TASK-S09-08) |
| `strategies.registry.ceiling` | The highest authority a descriptor's request is registered at | Legacy's `strategy_host.default_authority`, `trade` (`config/defaults.yaml:1238`) |
| `strategies.host.pass_secs` | Cadence between passes | Refusing; legacy's: the shipped unit passes `--poll 20` (`deploy/systemd/at-strategy.service:51`, the script default `scripts/run_framework_live.py:7472`), which an operator may override (`deploy/at:6301`); the deployed value is characterized before binding (slice file) |
| `strategies.host.seal_wait_ms` | How long a pass waits for the newest window's seal | Refusing; measured (TASK-S11-07) |
| `strategies.host.review_retry_ms` | Interval between `ADM-R15` resubmissions | Refusing; measured (TASK-S11-07) |
| `market.views.buyer_edge` | BuyerEdge's view policy: exact-minute chain and Greeks, spot at or before, `stale: report`, corrections excluded | Every field named (D08); values from legacy (above) |
| `cognition.review.blueprint` | The bound team blueprint, in `config/teams.yaml` | Bound per session (its digest is in the binding) |
| `cognition.providers.budgets` | Provider call and amount caps | `{}` (POL-033) |
| `cognition.providers.fallback` | Whether a blueprint may name the chain backend | Refusing; first release `inactive` (POL-036 open) |
| `cognition.committee.risk_critic` | The committee's risk role | Refusing; the only accepted value is `deferred` (POL-035 open) |
| `operations.telemetry.advisor_pause_warn_minutes` | Warn when a provider pause exceeds this | Approved 15 (POL-032) |

## Reuse evidence

* BuyerEdge, EMA and worker strategies: **keep/wrap** (`README.md:1149`). Ported unchanged: the scorer and its configuration, the intent mapping, the scoring input assembly, the EMA crossover, the pass timing, warm-up. Not inherited: the in-memory deduplication, the decision cursor as restart identity, `kind` as a combined axis, the fallback of an unknown kind.
* Advisor, team, AI management and records: **reuse cognition; relocate review application** (`README.md:1152`). Reused: blueprint validation, team supervision and child environment, profiles, backends, Retry-After handling, budgets, the chain, the record store, the review up to its result, exit advice. Relocated to the kernel (built in SLICE-04): mode application, pauses, the BLOCK refusal. `src/runtime/agent_team/__init__.py:176` strips credentials but does not establish OS denial (`README.md:231`).

## Alternatives considered

* **Restore BuyerEdge's state after a restart by re-walking the session's bars.** Deterministic and closer to an uninterrupted run, but it changes which entries follow a restart; the fork rule keeps legacy's reset. Listed in the slice file.
* **Submit a decided-but-unsent intent after recovery.** Rejected for the same reason (Fork call); B1 would still bound it.
* **Checkpoint every strategy's state.** Not needed: the retained strategies are stateless or reset; `checkpoint` exists for an extension that declares it.
* **One host process for several strategies.** Rejected, as legacy rejects it: a crash or leak in one stops them all.
* **Let cognition apply the mode itself.** Rejected by D12.

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-STR-01 | T | `tests/unit/test_strategy_registry.py` | Each refusal before load, with no module imported; a missing authority refused on create only, with legacy's text; a row's authority never rewritten, a disagreement reported; the ceiling lowers a request; legacy kinds mapped; an unknown kind refused; `CandidateId` equals a hand-computed digest | a refused descriptor's module is imported, or a row's authority changes |
| PRF-STR-02 | T | `tests/unit/test_strategy_invocation.py` | Identity stable across retries and changed by the view policy's name or version; the ID is a valid command key; I-W1…I-W5; two invocations from one predecessor give one lineage; reverse completion order; a session reset; a correction does not re-invoke; warm-up; abstentions and authority `none` and `plan` never submit; each kernel answer in the handoff table, with the retry bound; one view per trigger: with the SLICE-04 kernel, a catch-up window whose bar is older than B1's bound is refused `ADM-R05`, and the plan reads the trigger minute's chain, not a newer one; the decision record: an ENTER after an abstention is fresh, after an ENTER is not, across a host restart and after an abandoned decision; a review is requested for an intent refused at A4; the pass schedule, the seal wait and window order on a recorded clock | a second state revision from one predecessor, a new identity on retry, a submission without authority `trade`, a late window admitted with a newer bar's age, or `setup_fresh` differing from legacy's rule |
| PRF-STR-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-W1…CP-W5 (including a crash during `ADM-R12` and unknown-outcome retries, and a catch-up window recovered after its bar went stale) and CP-C1, CP-C2 by killing the host or cognition at each point: the recovery table's result; every completed decision recorded with the kernel once; at most one kernel command per invocation; every output terminal and attributable | an output is lost without a record, sent twice, or regenerated under a new identity |
| PRF-STR-04 | T | `tests/unit/test_buyer_edge_parity.py` | On contiguous walks generated once from legacy, each from a fresh engine (from the session's start and from restart points) with gap minutes inside, every bar's score, signal, direction, conviction, components, tags and intent or abstention equal legacy's, field by field, with the bound clock as an input; the shadow floor recorded and never applied; the exact-minute chain and Greeks rules; the coverage gate; bars at the seal boundary (a tick on time but after legacy's flush) | any field of any bar differs from legacy's for the same inputs |
| PRF-STR-05 | T | `tests/unit/test_cognition_assembly.py` | Blueprint refusals (cycles, lead, synthesis, caps); each role outcome; required and optional failures with legacy's consequences; duplicates, late results, malformed synthesis; varied completion order gives one result; the risk role refused; the deadline never extended | a non-contributing required role yields anything but `unavailable`, or an optional failure changes the outcome |
| PRF-STR-06 | T | `tests/unit/test_provider_records.py` | Requested and effective model, `unknown` when unreported; prompt identity; chain attempt order; Retry-After clamped at the close, one warning past 15 min, a non-finite hint backed off; `{}` budgets refuse nothing; the chain refused while `inactive`; a 429 is `provider_error`; replay answers from records with network access raising, a gap is `replay_gap` | a provider error reads as ALLOW or BLOCK, or replay calls a provider |
| PRF-STR-07 | T | `tests/integration/test_review_producer.py` | In a simulation composition: legacy's actions mapped to reviews the kernel applies; no team and bad context answer `unavailable` at once; a review for a mutated or swapped intent is `digest_mismatch`; a proposal sent as a review is `wrong_purpose`; in `enforce_entry_holds`, a PAUSE reviewed for an entry refused at A4 starts its pause and the next intent in scope is `paused`; differing bound review requirements without any extra review; replay of recorded reviews gives the same applications (`README.md:1237`) | cognition builds an application, or a review replaces an intent |
| PRF-STR-08 | T | `tests/unit/test_model_strategy.py` | A proposal becomes an intent or an explicit abstention; the worker score mapping; on recovery the recorded proposal is reused | a proposal result is accepted as a review, or a crash re-consults as a new invocation |
| PRF-STR-09 | T | `tests/contracts/test_capabilities.py` | No module under `strategies` or `cognition` imports the ledger writer, an order adapter or the simulated broker, or constructs `ReviewApplication` or `Plan`; spawned host and role environments carry no broker key; no settings, policy or locked-evidence write path exists (POL-029, POL-034); exit advice alone produces no action | any of these appears |
| PRF-STR-10 | T (recorded inputs) | `scripts/compare_parity.py` | BuyerEdge's decisions over recorded days through the target store equal the shipped scorer's (POL-024's acceptance) | a decision differs |
| PRF-STR-11 | T | `tests/integration/test_shared_engine.py` | A replay composition re-run over a recorded session (market store, recorded reviews and proposals, recorded `STATE_RESET`s) gives the same invocation IDs, state revision digests, outputs and decision records as the recorded run, with no provider reachable (Combined-F5 `README.md:366`; `:800`) | any identity, revision or output differs, or a provider is called |

The OS part of D09 (service identity, mounts, egress, descendant limits) is proved by `tests/isolation/test_resource_storage_scope.py` in SLICE-11.

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-01…SLICE-08 | A fixed `Intent` and recorded `Review` from fixtures; the kernel's review application (SLICE-04) | (PRF-ADM-01, PRF-ADM-02) |
| SLICE-09 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-09-strategies-and-cognition.md#steps); the kernel's decision record and `setup_fresh` derivation, once carried into the intent spec | PRF-STR-01…09, PRF-STR-11; PRF-STR-10 with recorded sessions (slice file) |
| SLICE-10 | The authenticated channel for the host and cognition; the human route for exit advice | (SLICE-10's) |
| SLICE-11 | The services for the strategy host and cognition; D09's OS enforcement | `tests/isolation/test_resource_storage_scope.py` |
| SLICE-12 | Memory, reflection, the research-job port | (SLICE-12's) |
