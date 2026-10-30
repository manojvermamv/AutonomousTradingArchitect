# Research, RL, custody and promotion

* **Status:** proposed (package spec), deepened from the stub this file was when the SLICE-12 design was written (2026-10-30), together with the [SLICE-12 slice file](../plan/slices/SLICE-12-research-rl-custody-promotion.md). Not yet reviewed by fresh EGM reviewers; the slice file's cycle does that before step 1 is built. Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here. The owner's [standing rules](../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) apply: where a choice touches money or a promotion gate (what a candidate must prove before it may trade, custody consumption, the statistics of the gate), legacy's behaviour at 445eb116 is kept, and the slice file logs it as a **Fork call**.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `research/bundles.py` | [Bundles and evidence scopes](#bundles-and-evidence-scopes-researchbundlespy) |
  | `research/custody.py` | [Custody](#custody-researchcustodypy) |
  | `research/trials.py` | [Trials and attempts](#trials-and-attempts-researchtrialspy) |
  | `research/jobs.py` | [Jobs and the research-job port](#jobs-and-the-research-job-port-researchjobspy) |
  | `research/datasets.py` | [Datasets and fitting provenance](#datasets-and-fitting-provenance-researchdatasetspy) |
  | `research/candidates.py` | [Candidate freeze](#candidate-freeze-researchcandidatespy) |
  | `research/replay.py` | [Replay and the simulated fill model](#replay-and-the-simulated-fill-model-researchreplaypy) |
  | `research/evaluation.py` | [Evaluation](#evaluation-researchevaluationpy) |
  | `research/promotion.py` and the kernel's check | [Promotion and the kernel's check](#promotion-and-the-kernels-check-researchpromotionpy) |
  | `research/rl/environment.py`, `research/rl/reward.py` | [RL transitions and reward](#rl-transitions-and-reward-researchrlenvironmentpy-researchrlrewardpy) |
  | `research/rl/training.py`, `research/rl/policy.py` | [RL training and frozen policies](#rl-training-and-frozen-policies-researchrltrainingpy-researchrlpolicypy) |
  | `cognition/memory.py`, `cognition/reflection.py` | [Memory and reflection](#memory-and-reflection-cognitionmemorypy-cognitionreflectionpy), moved here from the [strategies spec](strategies-and-cognition.md#non-goals) because both need custody and the job port |

* **Consumes:** standing bindings, grants, the owner principal and `CandidateId` ([sessions spec](sessions-authority-lifecycle.md#standing-bindings)); the simulated broker's `RuleResponder` seam ([execution-domain spec](execution-domain-and-observations.md#simulated-broker-adapterssimulated_brokerpy)); research view policies over the market store ([market spec](market-data-and-canvas.md#stable-views-marketviewpy)); the registry's decision method and authority, the advisor run records (`cognition/records.py`, SLICE-09) and the model strategy ([strategies spec](strategies-and-cognition.md)); the simulation composition that `bootstrap.py` builds; the participant contract, storage classes and `at.slice` ([configuration spec](configuration-artifacts-release.md#the-participant-contract-settingsschemapy), [runtime spec](runtime-isolation-observability-deployment.md)); the evidence store (T-23).
* **Consumed by:** `kernel/authority.py` and `kernel/admission.py` (promotion approvals, approval modes and custody witnesses, through the kernel's own checks, below); `strategies/model_strategy.py` (a candidate's identity, including its inference configuration); restore (SLICE-11, the custody reconciliation); the operator interface (SLICE-10: promotion, approval, mode and lineage-repair commands).
* **Master anchors:** [Research, RL and promotion](../../../README.md#research-rl-and-promotion) (`README.md:873-891`), A07-F1 (`README.md:885`), A07-F2 (`README.md:887`), A07-F3 (`README.md:889`), A07-F4 (`README.md:891`), the A07 table and its open choices (`README.md:374-381`), memory and reflection (`README.md:857`), A06-F5 (`README.md:871`), D06 (`README.md:899`), D10 (`README.md:1201`), the reuse rows (`README.md:1153`, `:1154`, `:1156`), the first-release row (`README.md:1172`), Phase 6 (`README.md:1186`), the acceptance rows (`README.md:1233`, `:1238`, `:1239`, `:1245`), the promotion owner choice (`README.md:1348`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root. `custody.py` is `src/analysis/core/custody.py`, `trials.py` is `src/analysis/core/trials.py`, `promotion.py` is `src/runtime/advisor/promotion.py`, `promotion_bar.py` is `src/runtime/advisor/promotion_bar.py`, `promotion_approval.py` is `src/authoring/capabilities/promotion_approval.py`.

## Overview

**In plain words.** Research is where new strategy ideas, trained models and AI prompts are tried. Today it has a strong rule set, and this design keeps it: try as many settings as you like, but every attempt is written down before it runs and counted even when it fails; and before a new idea may touch money it must pass one final exam on market days nobody looked at while building it. Those exam days can be read exactly once, and a second read, a restored backup or a new search name can never make them fresh again. A candidate that passes is frozen by its exact files and settings, and an owner approves it for named trading days. The kernel then checks that the exact frozen candidate is the one approved before it accepts any of its orders.

What changes is record-keeping, not the rules. Each attempt is tied to the job that ran it, so a crashed or resumed run is attributable. A learned transformation records which data it was fitted on and which data it was applied to. An RL step records what the agent proposed, whether the system would have allowed it, what the simulated broker did and where that left the position, and its reward shows money separately from any training bonus. A memory store and a reflection step, which legacy never built, are added for research only: reflection can suggest an experiment, never change a live setting. Nothing here trades, and no score, threshold or gate value changes.

## The problem

* **Fitting provenance is a role label, not an artifact.** Training records `data_roles={"fit": "development", "evaluation": "validation"}` and a definition digest (`src/analysis/training/__init__.py:579-584`; `src/analysis/candidates/contracts.py:18-23`). Nothing records the fitted artifact (a scaler's learned values, a selected feature list) or the population it was later applied to, so evaluation cannot show it applied a frozen fit rather than refitting (A07-F1).
* **Attempts and jobs are not joined.** The trial ledger and the job store are separate stores. A retried job forms a request-identity chain (`src/analysis/jobs/runner.py:161-182`), but the trial the job opened names no job, lease or attempt receipt. RL training restarts from scratch: each `train` opens a fresh trial (`src/analysis/rl/lab.py:386-458`), with no checkpoint or compatibility record (A07-F2).
* **A trial's close is check-then-write.** `close` reads the record, refuses unless it is `running`, then writes `{id}.{outcome}.json` (`trials.py:574-616`). Two concurrent closes both pass the check and write two endings; `get` silently picks the later (`trials.py:634-652`). `all_records` skips any file it cannot parse (`trials.py:622-632`), so a damaged attempt leaves the search count with no trace, the selection bias the count exists to stop.
* **An RL step is not a reconciled transition.** The info record keeps the action, the simulated outcomes and the closed positions (`src/analysis/rl/environment.py:405-453`), but not an admission decision or the resulting state, and the reward is one economic number with no place for shaping terms (`src/analysis/rl/reward.py:64-79`). Its simulator is its own next-open bar fill, not the shared engine (A07-F3).
* **Promotion is checked by the strategy host only.** A model-driven strategy with `plan` or `trade` authority may start only with a same-day promotion receipt matching its file hash, identity and prompt (`src/runtime/strategy_host/lifecycle.py:142-185`, `:220-226`; `promotion.py:470-524`). The receipt lives in a governance file the kernel never reads (`src/core/governance/evidence.py:263-284`), so the authority that sends orders cannot verify it (A07-F4).
* **Restore reconciliation is a backup-tool report.** The comparison of restored custody with the current chain exists only inside the off-box backup tool, as a dry plan (`deploy/offbox_backup.py:406-541`).
* **Memory and reflection do not exist.** Legacy lists memory as planned and reflection as deferred (`src/authoring/taxonomy.py:104-109`); its one outcomes provider is "declared by nothing that ships" (`src/runtime/providers/adaptation.py:1-21`).

## Goals

* Fitting population, fitted artifact and application population recorded for every learned transformation; evaluation applies the frozen artifact (REQ-RES-001).
* Every attempt registered before execution, joined to the job attempt that ran it, retained on failure and resumable only from a compatible checkpoint (REQ-RES-002, REQ-RES-012).
* RL transitions that reconcile proposed action, admission, simulated execution and resulting state, with economic and shaping reward separate (REQ-RES-003, REQ-RES-013).
* A promotion approved by an authenticated principal at the kernel, binding the exact candidate (its inference configuration included), its evidence and its session scope, and used only by a session opened after it (REQ-RES-004).
* Locked out-of-sample evidence that stays one-use across crashes, aliases, new search names and restores (REQ-RES-005, REQ-RES-010, REQ-RES-016).
* Candidate identities that match legacy byte for byte (REQ-RES-009).
* Memory partitions with as-of and scope filters, and reflection that only proposes (REQ-RES-011).
* Legacy's gate, bar, evidence track, lineage repair and benchmark kept exactly (REQ-RES-006, REQ-RES-007, REQ-RES-014, REQ-RES-015).

## Non-goals

* **No change to any gate, bar, statistic or threshold.** The directional gate, the promotion bar and the evidence-track rules are legacy's (Fork calls). The serial correction of the directional interval (AUDIT-WILSON-SERIAL-1, POL-O03) stays open; legacy's statistic is kept.
* **No candidate is promoted in the first release.** The first release runs BuyerEdge, a hand-written strategy ([Q-005](../decisions/owner-questions.md#q-005)), which needs no promotion (Fork call). The promotion path is built and proved in simulation.
* **No live self-training and no learning from simulated outcomes as if realized** (POL-034, `README.md:883`).
* **No import of the production custody chain or trial records.** SLICE-12 builds and proves the readers on synthetic copies; moving the deployed chain (including POL-039's holdout) is migration work (REQ-MIG-003), done with SLICE-13/14.
* **No pipeline framework, experiment tracker or workflow engine** (`README.md:1133`; A07-F2 "no mandatory experiment framework").
* **No OS enforcement here.** The research units, their slice and their storage scope are SLICE-11's; this slice proves the Python and process boundary.
* **No remote research or accelerators** (`README.md:944`, adopt later if needed).

<a id="requirement-keys-pointers"></a>

## Requirement keys

The decision text is the requirement; the label is a reminder.

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
| REQ-RES-009 | A frozen candidate's identity covers its exact code, model, prompt, data and environment; a mutable alias never suffices; serializers never alter an existing identity | `README.md:883`; reuse row `README.md:1153` |
| REQ-RES-010 | Restore reconciles custody with the authoritative monotonic chain; an older backup or a new search ID cannot reset consumption | `README.md:879`; D10 (`README.md:1201`) |
| REQ-RES-011 | Memory partitions with purpose, session, as-of, license, strategy and account filters; protected evaluation outside retrieval; reflection creates proposals only | `README.md:857`; POL-029 |
| REQ-RES-012 | Research workers render from the shared participant contract and claim and complete one isolated job each; duplicate delivery never overwrites a result | D06 (`README.md:899`); A07-F2 (`README.md:887`) |
| REQ-RES-013 | The simulated broker's fill and cost model is versioned, injected and declared by each run; partial and delayed fills follow the declared rule | A07-F3 (`README.md:889`); REQ-DSP-011 |
| REQ-RES-014 | An AI candidate's comparison names `rule:ema_cross` as its baseline | POL-044 |
| REQ-RES-015 | Lineage repair is owner-only and uses only the strategy's own advisor records for the repaired days | POL-045 |
| REQ-RES-016 | The current holdout declaration and its consumption state migrate intact | POL-039 |

## Critical user journeys

### CUJ-RES-1: A lab search with failures, then the locked exam

A researcher runs 40 Optuna attempts of an RL policy under one `search_id` in the `research_lab` role. Six crash, two are abandoned. All 40 stay in the trial ledger, and the count used for deflation is 40. The best attempt's policy is frozen into a candidate bundle; a `locked_oos` exam trial in the same search reserves the declared partition, claims its one read, builds the locked dataset and consumes the reservation. The evaluation over that dataset passes the gate. The lab attempt now has a promotion lineage through the exam (`trials.py:685-729`); without the exam it cannot be promoted.

### CUJ-RES-2: A crash between the read claim and consumption

The locked dataset build claims its read and then the process is killed before consumption. The reservation now has its one read claim and no consumption. Nobody can claim it again, and no other reservation may cover the same scope: the partition is spent although nothing was evaluated, as in legacy (Fork call). Even if the manifest was already written, evaluation refuses the dataset, because it needs the consumption on both the custody chain and the access ledger. The exam trial is closed `crashed` by job recovery, and stays counted.

### CUJ-RES-3: An old backup is restored

A host is restored from a backup taken before a partition was consumed. Restore reconciles the restored custody chain with the authoritative chain and with the latest custody witness in the kernel ledger, whose head is anchored off the host. The restored chain is shorter than the witnessed tail, so reconciliation reports `stale` and research refuses to start on it; the partition stays consumed. Restoring with a new search name changes nothing: reservations are bound to scopes, not names.

### CUJ-RES-4: A frozen artifact is swapped after approval

A research-policy candidate is approved by the owner for 4 November before the open, and the session opened at 09:15 carries the approval. Someone replaces the policy weights in the strategy host's candidate directory. The loaded bundle's digest no longer equals the candidate identity in the session's binding, so the host refuses to load it; if it were loaded under another identity, admission would refuse its intents (`candidate_not_bound`, as built in SLICE-03). Changing a model strategy's prompt has the same effect, because its prompt and model identity are part of its `CandidateId`. Open positions keep their protection.

### CUJ-RES-5: An evaluation with a broken lineage

An evaluation finds three closed trades whose advisor lineage is incomplete. It records `DEFERRED_INCOMPLETE_LINEAGE` and is not eligible. The owner runs the lineage repair dry run, confirms the store files it names, and records the repair from the strategy's own advisor records for those days. The evaluation is re-run over the same consumed dataset with the repair digest. No new partition is read.

## Technical plan

### Bundles and evidence scopes (`research/bundles.py`)

* **Evidence scope.** One contamination identity per calendar day and underlying, shared by every source: `EvidenceScope(calendar, day, underlying)`, `scope_id` the canonical digest of `{"schema": "EvidenceScope/v1", calendar, day, underlying}`, as legacy (`src/data/historical/contracts.py:65-116`). Two sources, a copy or an alias of the same day are the same scope, which is what makes locked-OOS source-neutral (POL-038).
* **Bundles.** A bundle is an immutable, content-addressed set of market rows with a source specification: source, dataset, provider version, acquisition method, license and retention classification, time fields, sequence rules, field mappings, adapter and code digests (`src/data/historical/contracts.py:199-238`). `publish(spec, rows) -> BundleId` validates the license classification against the bound list of permitted classes, writes once into a directory named by the digest and never overwrites. `scopes(bundle_id)` returns the evidence scopes its rows cover, as legacy's `evidence_scopes_for_bundle` (`custody.py:167-181`).
* **From the target market store.** Research bundles are built from the market store through a research view policy (`availability: event`, `corrections: include`, labelled research-only), so the A01 view identity of every row is recorded (`README.md:885`, "existing A01 view provenance … remain in force").

### Custody (`research/custody.py`)

**Reused unchanged, with identity parity** (`README.md:1153`). The chain format, the event kinds and every check are legacy's, so the deployed chain and its holdout (POL-039) can be read and continued without conversion.

* **Store.** One append-only hash chain `events.ndjson` (`HistoricalCustodyEvent/v1`) under the research custody root, and a trusted tail anchor (`HistoricalCustodyAuthority/v2`) in a separate directory, both service-owned and outside Git (`custody.py:24-36`; `README.md:1131`). Each event's `event_hash` is the canonical digest of its body with `previous_hash` and `sequence` (`custody.py:1437-1468`).
* **The legacy-compatible hasher.** Legacy hashes with `json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)` (`src/_canonical.py:10-14`): it accepts integer mapping keys (sorted after conversion to strings), turns any non-JSON value into its `str`, and writes `NaN` and `Infinity`. The kernel's canonical form refuses all three (`kernel/ledger/envelope.py:45-56`). So every research identity carried over from legacy (custody events and anchors, bundle, dataset, evaluation and candidate digests, reward digests, `json_form`) uses one function, `research.custody.legacy_digest`, a byte-for-byte port of legacy's, and never the kernel's. TASK-S12-09's golden cases cover integer keys, a `default=str` value and a non-finite float.
* **Append.** Under the exclusive lock: announce the new event as `pending` in the anchor, append and fsync the event, then move the tail (`custody.py:1437-1509`). A reader accepts exactly one announced, appended, untailed event and rolls it forward; any other mismatch with the tail is corruption, and every custody operation refuses (`custody.py:1183-1256`).
* **States** of a scope: `unopened`, `reserved`, `consumed`, `ineligible` (`custody.py:30`, `:1969-2014`). Of a locked partition: `unopened`, `reserved`, `consumed`, `ineligible` (`custody.py:2038-2066`).

  | Operation | Allowed when | Records |
  |---|---|---|
  | `declare(scopes, role, partition_id)` | No overlap with another declaration of a conflicting role; `locked_oos` only over scopes never exposed or spent (`custody.py:1669-1703`) | `declaration` |
  | `expose_ordinary(scopes, actor, search_id, source)` | No overlap with `locked_oos`, a reservation, a consumption or an ineligible scope (`custody.py:1721-1740`) | `ordinary_exposure` |
  | `reserve(scopes, frozen_identity, actor, search_id)` | Every scope covered by a `locked_oos` declaration; none spent; exactly one partition identity per declaration (`custody.py:1755-1806`) | `reservation` with a fresh `reservation_id` |
  | `claim_read(reservation_id, scopes, frozen_identity, actor, search_id, trial_id)` | The reservation exists once, has no claim and no consumption; scopes, identity, search and actor equal the reservation's exactly (`custody.py:1825-1876`) | `read_claimed`; returns a capability valid only in this process (`custody.py:96`, `:1874-1885`) |
  | `consume(reservation_id, claim_id, trial_id, search_id, frozen_identity)` | One matching claim, no prior consumption (`custody.py:1909-1951`) | `consumption` |

* **Reserve before read.** Protected rows are opened only by the holder of a live claim capability (`custody.py:1878-1907`). A claim is spent when it is recorded: a crash before consumption leaves the reservation claimed and never claimable again (CUJ-RES-2, Fork call).
* **Previously inspected history** can never become locked: any `ordinary_exposure` or `development`/`validation` declaration over a scope refuses its `locked_oos` declaration (`custody.py:1689-1696`), and a `prospective_future` partition must be declared before its first day (`trials.py:995-1000`). Imported history is eligible only with verified immutable bundles and a lock attestation naming the frozen identity (`trials.py:978-1004`).
* **The custody witness** (REQ-RES-010, new; `README.md:875`, `:879`). After every `reservation`, `read_claimed` and `consumption` event, research asks the kernel to record `CUSTODY_WITNESSED(authority_id, sequence, event_hash, kind)` under the `custody_witness` grant held by the research service principal. The kernel ledger's head is anchored off the host (SLICE-02, PRF-LED-15), so the witness gives custody a monotonic reference that a restore of the research files alone cannot rewind. The witness is a record, not a gate: a kernel that cannot be reached leaves the event unwitnessed, the next successful witness covers it (the chain is a prefix), and nothing in research or promotion waits on it.
* **Restore reconciliation** (REQ-RES-010). `reconcile(current, restored, witness) -> Reconciliation(status, reason, events)` compares a restored chain and anchor, validated in a scratch location, with the authoritative chain, as legacy's backup tool (`deploy/offbox_backup.py:406-541`), and additionally with the latest `CUSTODY_WITNESSED` in the authoritative ledger:

  | Restored versus authoritative | Status | Research may start |
  |---|---|---|
  | Neither chain initialized | `not_initialized` | Yes, on a new genesis (legacy `:492-494`, `:498-500`) |
  | Restored initialized, current not (a clean host) | `restored_only` | Only if the restored chain contains the witnessed `(sequence, event_hash)`; otherwise `stale` |
  | Another `authority_id` or root | `conflict` | No |
  | An event ID or hash differs at some sequence | `conflict` | No |
  | A strict prefix, or shorter than the witnessed sequence | `stale` | No |
  | Equal, and containing the witnessed event | `current` | Yes |
  | Longer, with the authoritative chain as its prefix | `additive` | **No, on either chain,** until the owner adopts the longer chain after verification (below) |
  | Current initialized, restored missing | `missing` | No |

  Legacy reported `additive` as a dry plan and let the current chain continue (`deploy/offbox_backup.py:537-541`); continuing on the shorter chain could re-reserve a scope the longer chain already spent, so here both chains stop. **Adopting** is the owner's recorded act: the longer chain must verify end to end, contain the witnessed event and extend the current chain; it then becomes the authority, under the same `authority_id`. The authoritative chain for a restore is the one the recovery set names (SLICE-11's recovery manifest); restore calls this function and refuses research start on anything but `current`, `not_initialized` or a witnessed `restored_only`. A new search ID cannot reset anything, because every check keys on scope and reservation, never on search name.
* **Legacy declarations** from older trial directories are imported once by `migrate_legacy` (`custody.py:2068-2070`), kept as a supported reader (Combined-F3, `README.md:1197`).

### Trials and attempts (`research/trials.py`)

**Reused, with attempt links added.** A legacy trial is one attempt: "one research choice evaluated once against one identified dataset" (`trials.py:51-82`). The experiment is its `search_id`; selection history is the ledger.

* **Open before run.** `open(parameters, dataset, …)` writes the record before any work (`trials.py:290-572`; `tests/test_trials.py:151-155`). Its validation is legacy's: the `research_lab` role only with a `search_id` and never with a locked partition; one lever for `parameter`, two with a stated interaction for `parameter_grid` (a convention the master says is not a custody requirement, `README.md:389`, kept because it is legacy behaviour); a dataset is required; locked partitions are read only by a `locked_oos` trial (`trials.py:311-409`).
* **Attempt link** (new, in the record's `extensions.attempt`): the job ID, the job attempt number and lease generation, and the attempt receipt ID (below). A trial opened outside a job (a notebook, a test) records `job: null`; ordinary exploration needs no job (`README.md:887`).
* **Close once, exclusively.** `close(trial_id, outcome, score)` takes the ledger lock, writes the closing record to a temporary file and fsyncs it, then publishes it with a no-replace link to the trial's single closing name `{id}.closed.json`, which fails if that name exists; it then removes the temporary and fsyncs the directory. A concurrent or repeated close therefore refuses (`trial_already_closed`), and a crash leaves either no closing record or one complete one. Legacy's own records, `{id}.{outcome}.json` written with an atomic replace (`trials.py:615`, `:266-288`), stay readable; a trial with two legacy closing records reads as `conflicting_close` and is reported, never resolved by recency. `completed` needs a score (`trials.py:590-593`). Outcomes: `running`, `completed`, `neutral`, `abandoned`, `crashed` (`trials.py:26`).
* **Count everything.** `count(dataset, search_id)` counts every trial by its latest record, all outcomes included (`trials.py:666-683`; `tests/test_trials.py:158-167`). An unreadable record file is reported in `unreadable` and makes the count `incomplete: true`, so a claim built on it says so.
* **Resume.** A resumed run opens a new trial with `parent_id` the interrupted one and `extensions.resume = {checkpoint_digest, compatibility}`, where `compatibility` is the tuple a continuation needs: the specification digest (parameters, code reference, seed), the input and artifact identities (dataset, bundles, environment and reward digests), and the execution-state digest of the checkpoint (`README.md:887`). `resume(parent, checkpoint)` refuses unless every element equals the parent's recorded values; a changed parameter or assumption is a new attempt, never a resume. Restarting from scratch stays possible, with the history retained.
* **Promotion lineage.** A `research_lab` trial reaches promotion only through a completed `locked_oos` trial in the same search whose frozen evaluation names it and hashes to its `candidate_trial_identity` (`trials.py:685-729`).
* **The locked-access ledger** (ported). Beside the custody chain, the trial root keeps `locked-oos-access/`, one record per access event, `{kind: locked_oos_access, id, partition_ids, trial_id, status: reserved | consumed | denied, actor, search_id, reason, dates, custody_reservation_id, recorded_at}` (`trials.py:1281-1298`). A locked read touches three stores in a fixed order:

  | Phase | Order of writes | Legacy |
  |---|---|---|
  | Open the exam trial | custody `reservation` → access row `reserved` → the trial record | `trials.py:487-547` |
  | Read | custody `read_claimed` (the in-process capability) | `src/analysis/datasets/__init__.py:1998-2016` |
  | Build and consume | dataset manifest → custody `consumption` → access row `consumed` → trial closed `completed` | `src/analysis/datasets/__init__.py:2448-2456`; `trials.py:1300-1336` |

  A partition is "used" if any trial names it as `locked_oos` or any `reserved` or `consumed` access row names it, across every search (`trials.py:455-486`, `:1221-1239`); a refused open records a `denied` row. Evaluation accepts a locked dataset only when the exam trial is `completed`, both access rows name the custody reservation, and the custody chain holds the matching reservation and consumption (`src/analysis/evaluation/candidate.py:700-738`). Each crash between two of these writes is a numbered point in [Failure modes](#failure-modes-and-crash-points).
* **Metric disclosures** (new; `README.md:879`, "records failures and metric disclosures"). Every evaluation run over locked rows, whatever its result (eligible, ineligible, deferred, failed after reading), appends one record to `metric-disclosures/` in the trial root: `{evaluation_identity | null, dataset_identity, custody_reservation_id, exam_trial_id, metrics_digest, outcome, actor, recorded_at}`, written before the evaluation result is returned. Legacy kept no such record; re-running an evaluation over a consumed dataset is allowed, and each run is now disclosed.

### Jobs and the research-job port (`research/jobs.py`)

**Retained, simplified configuration** (`README.md:1156`).

* **Records and the slot.** A `JobRecord` per job (`src/analysis/jobs/store.py:55-83`) and one shared execution slot lease (`store.py:424-483`). `claim(job_id, lease_seconds)` writes the lease first, then the job row, and appends an attempt receipt (`receipt_id`, attempt, generation, owner host, boot and process identity). A crash between the two leaves the slot blocked until the lease expires, never a running job that looks claimable (`store.py:460-462`).
* **Expiry.** An expired lease is reconciled: the recorded process tree is terminated and reaped, the job is marked `failed` (or `cancelled` if cancellation was requested) and `interrupted` (`store.py:494-526`). **New:** the same reconciliation closes the job's running trial `crashed` with `extensions.interrupted = true`, so an interrupted attempt is retained and attributed.
* **Retries and duplicate delivery.** A retry is a new job with `retry_of` and the stable `request_identity`; the chain must be one linear sequence of attempt numbers, and only the chain's tail may be retried (`src/analysis/jobs/runner.py:161-182`, `:407-451`). A delivery whose `request_identity` already names a non-terminal or completed job returns that job, never a second run; a result is written once per job attempt and a second write refuses.
* **The research-job port** (`README.md:859`, added at its first consumer seam, reflection): `submit(JobRequest) -> JobRef`, `cancel(JobRef)`, `observe(JobRef) -> JobStatus`, `recover() -> list[JobStatus]`. A `JobRequest` names a registered job type, its bound arguments and its `request_identity`; the port grants no authority beyond running that job in the research participant.
* **Worker profiles** (D06, `README.md:899`). Two research participants, rendered from the participant contract ([configuration spec](configuration-artifacts-release.md#the-participant-contract-settingsschemapy)): `research-offline` and `research-model`, as legacy's offline and advisor workers (`src/analysis/jobs/policy.py:11-13`). Both forbid the trading credential; only `research-model` may load the model-provider credential (legacy `_ADVISOR_KEYS`, `policy.py:31-32`). Each worker's `--check` passes with exactly its rendered environment, and each claims and completes one isolated job (`README.md:1233`). SLICE-11 proved the render-and-refuse half (PRF-CFG-06).

### Datasets and fitting provenance (`research/datasets.py`)

* **Build.** `build(spec) -> DatasetManifest` writes rows and a manifest whose `identity` is the digest of its identity seed (strategy, days, roles, partitions, sources, builder code digest, rows digest, folds, baseline section and evidence claims), as legacy (`src/analysis/datasets/__init__.py:2420-2450`). The baseline strategy is named in the manifest at build (POL-043; `:2426`).
* **Walk-forward leakage.** Partitions are chronological and disjoint, roles ordered development, validation, locked_oos, with locked partitions terminal; purge and embargo default to the largest of the outcome horizon, holding period and cross-session state, and a smaller value refuses (`datasets/__init__.py:201-258`). No universal number is set (`README.md:877`).
* **Locked rows.** A dataset that includes locked days opens (or reuses) its exam trial with its reservation, claims the one read, builds the rows, writes the manifest, then consumes (custody, then the access row) and closes the exam trial `completed`, in the order of the [locked-access table](#trials-and-attempts-researchtrialspy) (`datasets/__init__.py:1960-2016`, `:2448-2456`). The manifest is written **before** consumption, as legacy; a manifest without a consumption is never evaluable. Any exception in the process closes the exam trial `crashed` (`:2458-2464`). Consumption happens here, at the build, not at evaluation (Fork call); evaluation may run any number of times over the consumed dataset, each run disclosed.
* **Consumption after a crash.** Legacy's `consume` needs only the recorded claim ID, not the process capability (`custody.py:1909-1951`), but no shipped legacy path completes a consumption after a crash: both callers use the claim from the same process (`datasets/__init__.py:2451-2454`; `src/interfaces/cli/historical.py:2254-2255`). The target keeps `consume`'s signature and adds no completion path, so a build interrupted after its claim leaves the partition claimed and unconsumed (Fork call).
* **Fit records** (A07-F1, new). Every learned transformation (normalizer, feature selection, model fit) records

  ```text
  FitRecord(transform_id, algorithm, config_digest,
            fit_population: {dataset_identity, partition_ids, rows_digest},
            fitted_artifact_digest,
            applications: [{dataset_identity, partition_ids, rows_digest, applied_at}])
  ```

  `fit(...)` refuses a population that includes a `locked_oos` row, as legacy training refuses (`src/analysis/training/__init__.py:564-565`), and reads only eligible development and validation rows (`:573-574`). `apply(fit_record, rows)` uses the stored artifact by digest and appends an application; it never refits. An evaluation records the fit records it applied; changing evaluation-only rows changes no `fitted_artifact_digest`. An alternative research variant is a new `transform_id`.

### Candidate freeze (`research/candidates.py`)

**Reused unchanged, with identity parity.**

* **The bundle.** `CandidateBundle/v1` with its family, capability, twelve identity digests (dataset, feature, preprocessing, source tree, dependency, runtime, seed, search, trial, acceptance rule, expiry, rollback), search family, tried-choice counts, artifacts and the family identity, and the fixed prohibited capabilities (`src/analysis/candidates/contracts.py:18-108`, `:359-546`). Families and their artifacts: `strategy_config`, `local_model`, `advisor`, `ai_management`, `research_policy` (`contracts.py:24-30`). A field naming a credential, an order or an authority refuses (`contracts.py:82-108`, `:395-397`).
* **The freeze.** Artifacts are written once into a directory named by the bundle digest; verification re-hashes every artifact and refuses any difference (legacy `CandidateRegistry`, `src/analysis/candidates/registry.py`; its loader is **not checked** line by line here and is characterized in TASK-S12-09). A mutable name ("latest", a registry alias) never identifies a candidate (`README.md:883`).
* **`CandidateId`, extending the [sessions spec](sessions-authority-lifecycle.md)'s manifest by decision method:**

  | Candidate | Manifest | Why |
  |---|---|---|
  | Hand-written, rule decision method (BuyerEdge, EMA cross) | The sessions spec's `{strategy, strategy_version, code_digest}`, unchanged | No inference configuration exists |
  | Hand-written, model decision method (a worker that consults a model) | `{strategy, strategy_version, code_digest, model_identity, prompt_digest}`, where `model_identity` is legacy's five-field identity bundle (`strategy_family`, `model_spec_digest`, `model_artifact_digest`, `candidate_generator_identity`, `acceptance_rule_digest`, normalized as `promotion.py:38-53`) and `prompt_digest` the active prompt's | Legacy's start check compares exactly these two with the receipt (`promotion.py:482-497`; `src/runtime/strategy_host/lifecycle.py:148-152`), Fork call |
  | Frozen candidate bundle | Legacy's `CandidateBundle.digest` without its `sha256:` prefix (`contracts.py:544-546`), by the legacy-compatible hasher | The family identity already holds the prompt, model, adapter, policy, observation, environment, reward and assumption digests |

  So substituting any inference setting changes the candidate's identity: a binding names the old identity, admission refuses the new one (`candidate_not_bound`), and a new identity needs a new binding, which applies from the next opening, as legacy's changed profile waited for the next session boundary. The strategy host computes the identity from what it actually loaded (SLICE-09, integration) and refuses to run a candidate whose identity is not in its session's binding.

### Replay and the simulated fill model (`research/replay.py`)

* **The shared engine, behind a port.** Research never imports the kernel. `bootstrap.py` builds the simulation composition (PRF-XC-02): a copy of a recorded market store, the strategy host or a frozen candidate, the kernel's own admission, planner, protection and lifecycle, its own simulation ledger, and the simulated broker with a `RuleResponder` (`README.md:800`). It hands research an `EnginePort` with `start(ReplaySpec) -> RunRef`, `step(RunRef, until) -> StepResult` (the decisions, admissions, refusals, simulated effects and resulting positions since the last step) and `finish(RunRef) -> ReplayResult`. `research/replay.py` drives runs only through that port and imports only `contracts` and research modules (PRF-RES-14). Every outcome is labelled `simulated` (`README.md:802`). Consequential claims (promotion evidence, an RL claim beyond exploration) come only from replay (A07-F3).
* **The fill and cost model** the `RuleResponder` injects (REQ-RES-013), versioned and declared by every run, with legacy's `historical-fill-v2` semantics (`src/analysis/execution/historical.py:21-28`, `:96-129`): fills at the causal next bar's open; size and volume required; queue, broker latency, intra-bar execution and bar spread not modelled; partial fills refused, so an order is filled whole or not at all; slippage in basis points, non-negative and finite. Charges come from the dated estimate model, labelled estimated (POL-025). The model's identity and digest are on every result (PRF-DSP-12, rule part).
* **A test-only declared rule.** The A07 acceptance row asks to "reject/delay/partially fill simulated actions" (`README.md:1245`). Tests inject a `scripted_partial_delay/test` fill rule that may reject an order, fill part of it, fill the rest after a declared number of bars, or leave it unfilled at episode end. It is accepted only by a composition labelled `test` (as the `FaultPlan`), never by a research run, so the shipped model's semantics stay legacy's (Fork call); it exists so the transition and reward rules for partial, delayed and open-at-end exposure are proved.
* **Inputs.** Replay reads only retained, ordered inputs and recorded A01 view identities; a fresh historical model call is a new evaluation, not a replay (`README.md:804`).

### Evaluation (`research/evaluation.py`)

**Reused unchanged** (`README.md:1153`). `evaluate(candidate, dataset, champion, baseline, …) -> Evaluation` follows legacy's sequence (`src/analysis/evaluation/candidate.py:912-1038`):

1. Read the manifest; resolve the locked evidence and, for a frozen candidate's exam, the frozen evaluation definitions from the consumed trial and the lock attestation, never from a caller argument (`candidate.py:853-909`). A supplied acceptance rule must equal the frozen one (`candidate.py:941-944`).
2. Check the dataset's strategy, prompt identity and candidate binding against the frozen candidate (`candidate.py:945-962`).
3. Economics from the frozen economic book (or one owner-recorded lineage repair, below); the baseline's economics from the same manifest.
4. **Select the evidence track** (POL-043): `locked_oos_estimated`, point-in-time estimated charges over the one-use locked partition, is the default; `real_broker_track_record`, complete broker-reconciled allocations, is opt-in (`promotion_bar.py:30-34`; `candidate.py:1005-1021`). Candidate and baseline must share the partition, bundle and session sources, fill model and assumptions, and rate sets (`promotion.py:76-103`).
5. **The gate** (`promotion.py:61-146`): a named baseline; locked-OOS evidence; on the real track, reconciled costs; at every horizon, at least the minimum scored observations and a directional interval whose lower bound is above 0.5; positive net; every closed trade net-priced; on the estimated track, dated statutory estimate economics. **The statistic, pinned** (Fork call; POL-O03 stays open):
   * the hit rate's Wilson score interval with `z` = 1.96 (`src/analysis/core/corrections.py:245`), bound as the refusing setting `promotion.directional.z`;
   * its `n` is the session-clustered effective sample size `n / (1 + (m − 1)·rho)`, with sessions as clusters, `m` the mean cluster size and `rho` the measured intracluster correlation; one value per session gives a design effect of exactly 1 (`corrections.py:176-242`);
   * when `rho` cannot be measured, the interval is **unavailable**, never computed on the raw count (`src/runtime/advisor/value.py:225-241`), and the gate refuses that horizon, because an unavailable interval has no lower bound (`promotion.py:113-120`, `:149-170`).
6. **Disclosure.** The run's metric disclosure is recorded ([Trials and attempts](#trials-and-attempts-researchtrialspy)) before its result is returned.
7. **Lineage status.** Any closed trade with incomplete advisor lineage makes the gate ineligible with `DEFERRED_INCOMPLETE_LINEAGE` (`candidate.py:577-592`). Nothing is consumed again: the evaluation is re-run over the same dataset after a repair.
8. **Advisory statistics.** The deflated Sharpe ratio uses every attempt of the search, failures included, and is reported as `available_advisory`, never a gate (`src/analysis/core/selection.py:165-218`).

* **Benchmarks.** An AI candidate's comparison names `rule:ema_cross` (POL-044); the bound baselines list is legacy's `["rule:breakout", "rule:ema_cross"]` (`config/defaults.yaml:761`).
* **Lineage repair** (POL-045). `plan_lineage_repair(dataset)` is a dry run; `record_lineage_repair(dataset, actor, reason, expected_evidence)` appends a derived repair file bound by digest, using only the dataset strategy's advisor record store for the repaired trades' days (in the target, that strategy's run records in the cognition record store built by SLICE-09, `cognition/records.py`), refusing a consultation after its trade's entry or naming the other option family, and refusing if the store changed since the dry run (`src/analysis/datasets/__init__.py:2971-3008`). It is reachable only through the owner's authenticated command with the dataset identity typed back (legacy `src/interfaces/console/api/routes/lineage_repair.py:1-61`; the command is SLICE-10's).
* **The evaluation record's identity** is the digest of its JSON form without the identity field (`promotion.py:321-330`).

### Promotion and the kernel's check (`research/promotion.py`)

**Which candidates need promotion.** A candidate whose registry row's decision method is model-driven and whose authority is `plan` or `trade`, as legacy's start check (`lifecycle.py:220-226`). A hand-written rule strategy's candidate needs none (BuyerEdge; Fork call).

* **The flag the kernel trusts** (`requires_promotion`). The kernel has no registry; a `StandingBinding` carries only candidate IDs (`contracts/identity.py:127-149`; `kernel/authority.py:249-258`). So `BINDING_AUTHORIZED` gains `requires_promotion: {candidate_id: bool}`, one entry per bound candidate, written by the principal holding `binding_authorize` from the candidate's registry row (decision method and authority, SLICE-09) at the moment it authorizes the binding, and recorded in the `standing_binding` row. `validate_binding` returns it in `BindingRef`, and the session's copy is fixed at `SESSION_OPENED` with the rest of the binding. The first release's BuyerEdge binding records `false` (rule decision method), so no new check ever reaches BuyerEdge (PRF-RES-12). The strategy host (SLICE-09) refuses to start a model-driven `plan` or `trade` strategy whose candidate's flag is `false`, mirroring where legacy checked (`lifecycle.py:200-227`). How events recorded before this field existed are read is the sessions spec's integration choice; no model-driven candidate can have been bound before SLICE-12.
* **The record** (schema `PromotionRecord/v1` in `resources/candidates.schema.json`), research's evidence claim, not an approval:

  ```text
  PromotionRecord(candidate_id, family, strategy, evaluation_identity,
                  claim: {evidence_track, partition_ids, reservation_id, consumption_event_id},
                  gate, bar: {passed, values, reasons},
                  scope: {account, calendar_id, trading_date},
                  reviewer, recorded_at)
  ```

  Its digest is the legacy-compatible digest of the record. It carries no approval field: an approval is a kernel event (below), never a claim inside record bytes.
* **Recording** (`record(evaluation, reviewer, scope)`), as legacy's `record_from_evaluation` and `record_promotion` (`promotion.py:181-278`, `:333-467`): the evaluation's identity matches its content; a source verifier rebuilds every verified section; a v2 evaluation's lineage verifies; the recomputed gate equals the recorded gate under the frozen rule, which must equal the current rule (`promotion.py:288-318`); locked consumption is verified; the gate is eligible; the promotion bar passes; and `scope.trading_date` is the exchange date at recording (legacy's same-day receipt, `promotion.py:212-215`). The reviewer is an authenticated principal, as legacy required a named reviewer (`src/core/governance/evidence.py:136-138`).
* **The bar** (POL-042): `min_net_rupees`, `min_margin_over_baseline`, `min_trades` (matched AI trades), each compared with `>=`; an unset or malformed value refuses every promotion with a reason naming it (`promotion_bar.py:1-19`, `:61-83`, `:357-412`). The repository ships them unset.
* **Approval modes** (POL-041). Per candidate family, `owner_approval` or `automatic_when_bar_passes`; absent state reads `owner_approval` (`promotion_approval.py:37-40`, `:146-152`). Only the owner switches a mode, with a reason (`promotion_approval.py:172-202`). Because the kernel must trust the mode it applies, a switch is the kernel event `PROMOTION_MODE_SET(family, mode, principal, reason)`, accepted only from the owner principal (authenticated over the owner credential path, `kernel/authority.py:119-122`); legacy kept a JSON file in which damage read as `owner_approval` (`:113-132`), and the ledger keeps that meaning: no event, `owner_approval`.
* **The approval is the kernel's `promotion_verify`** (A07-F4, "Tier-1 verifies that binding before use"; A06-F1). The kernel never imports research; it validates the record against `resources/candidates.schema.json`.

  ```text
  authority.promotion_verify(auth, binding_id, record_bytes, reason)
      -> PROMOTION_VERIFIED(approval_id, binding_id, policy_binding_id, candidate_id,
                            trading_date, record_digest, approver, approval_path, reason) | Refusal
  ```

  * **Checks:** the record parses and its digest matches; the candidate is in the binding's `candidate_ids` and flagged `requires_promotion`; the scope's account and calendar equal the binding's; the trading date is in the binding's range and equals the kernel's exchange date now; the binding is the one `validate_binding` would choose for that date (a newer binding for the date makes the approval name a superseded binding, as legacy's approval became invalid when a newer gating profile was staged, `src/authoring/capabilities/candidate_activation.py:271-276`); the gate is eligible and the bar passed.
  * **Who approves.** The calling principal is recorded as `approver`; nothing in the record bytes is trusted for it:

    | Record's track and family mode | Who may call | `approval_path` | Legacy |
    |---|---|---|---|
    | `locked_oos_estimated`, any mode | The owner only | `owner` | Always waits for the owner (`promotion_approval.py:303-304`, `:336-340`) |
    | `real_broker_track_record`, `owner_approval` | The owner only | `owner` | "Nothing activates until you approve" (`promotion_approval.py:358-363`; `candidate_activation.py:283-302`) |
    | `real_broker_track_record`, `automatic_when_bar_passes` (per the latest `PROMOTION_MODE_SET`) | The owner, or the research service principal holding the `promotion_approve` grant | `owner` or `automatic` | `after_promotion` approves as `automatic_when_bar_passes:<family>` (`promotion_approval.py:316-326`) |

    In automatic mode research submits only after legacy's checks: the bar is set now and its values equal those the record was made under (`promotion_approval.py:305-312`).
  * **The approval artifact** is the `PROMOTION_VERIFIED` event; the kernel publishes the record bytes to its evidence store before committing it (publication before reference). It binds the record digest, the candidate (whose identity covers the code and, for a model strategy, its prompt and model identity), the standing binding and its `policy_binding_id`, which together play the part of legacy's staged gating-profile version and digest (`candidate_activation.py:309-334`). A repeated call with the same record and binding is a no-op.
  * **When it applies: only to a session opened after it** (Fork call). Legacy approvals are recorded for the `NEXT_SESSION` boundary and activated at a session start (`candidate_activation.py:319-335`, `:368-407`; `src/runtime/session_config.py:884`), and the sessions spec fixes a session's binding at `SESSION_OPENED`. So admission accepts a model-driven candidate's entry only if a `PROMOTION_VERIFIED` for the session's trading date, binding and candidate has a ledger sequence **before** the session's `SESSION_OPENED`. Because the record must also be made on its own trading date (same-day), it must be approved before that date's open. **Consequence:** legacy's "session" was the strategy's own session start, which could be later in the day; the target's session opens at the market open, so an approval made after the open waits for a new record on a later date.
  * **At admission**, an entry intent for a candidate flagged `requires_promotion` in the session's binding is refused (`candidate_not_promoted`, its code assigned in the intent spec) unless the condition above holds. Protective and owner actions are never refused by this check.
  * `promotion.enforce` (refusing; first release `true`, legacy `advisor.promotion.enforce`, `config/defaults.yaml:766`): `false` skips the admission check, as legacy's `may_promote` returned allowed (`promotion.py:477-478`). The binding check of SLICE-03 is unaffected. This contradicts the master's "a candidate cannot bypass its applicable promotion rules" (`README.md:1172`); it is kept under the fork rule and raised as an X item for the master's owner.
* **Revocation.** Revoking the standing binding follows Q-010 (`stop_entries`). An approval is valid for one trading date only, so it lapses at the next date. Whether an approval can be revoked within its date stays the owner's choice (`README.md:381`).

### RL transitions and reward (`research/rl/environment.py`, `research/rl/reward.py`)

**Reused** (`README.md:1154`), with the transition completed.

* **Two tiers.** The `abstract` tier is legacy's environment, ported (`src/analysis/rl/environment.py:1-58`): one immutable bundle and one session; causal observations refused on any look-ahead; actions are direction (`CE`, `PE`, `WAIT`) and conviction only, and any field naming a strike, quantity, price, stop or order refuses (`environment.py:103-171`); the contract is the at-the-money strike of the visible chain, the size one declared quantity or the point-in-time lot size; fills next-open, rounded adversely to the point-in-time tick; one position at a time, closed at the penultimate bar's decision; custody before any payload (`environment.py:302-345`). Its claims are labelled `abstract` and limited to exploration (A07-F3). The `shared` tier steps a replay run (above) bar by bar, so the admission decision is the kernel's own. Consequential claims use the `shared` tier only.
* **The transition record** (`research_transition/v2`), every step:

  ```text
  {bar_index, decision_at,
   proposed: {direction, conviction, reason},
   admission: {decision: admitted | refused | not_applicable, reason, source: environment | kernel},
   execution: [outcome: {kind, evidence_class, outcome_class: simulated, available, reason,
                         fill_price, fill_at, quantity_filled, fill_assumptions_digest}],
   pending: [order still working under a delaying rule],
   closed: [...], state_after: {position | null, open_quantity, mark_points | null},
   reward: {economic: {...}, shaping: {...}, total},
   terminated: bool, truncated: bool, end_reason, digests…}
  ```

  `not_applicable` is a `WAIT` with nothing to close. A refused or unfilled entry leaves `state_after.position` null. Under the shipped model an entry never fills partly (partial fills refused); under the test-only rule a partial fill opens `state_after.open_quantity` equal to the filled quantity and the remainder appears in `pending` until it fills or is cancelled. An exit that cannot fill at session end keeps the position open in `state_after` until the declared worst-case close is booked (below). `terminated` is true when the session ends (the penultimate bar's decision, `environment.py:411`, `:425`); `truncated` is true when the run stops the episode early at a step limit it declared, with `end_reason` naming it (a missing reference fact makes the run ineligible but does not end the episode, as legacy, `environment.py:21-30`). Legacy's Gymnasium wrapper returns `terminated = done` and `truncated` always false (`src/analysis/rl/gym_env.py:104-109`); with no step limit declared the target gives the same. Legacy's v1 fields are a subset, so its stream digests are reproducible by the v1 reader.
* **Reward.** A `RewardSpec` keeps legacy's identity: `name/version`, parameters and a digest over the function's source, so editing the arithmetic changes the digest (`src/analysis/rl/reward.py:23-61`). `reward(transition) -> RewardValue(economic, shaping, total)`; `economic` holds the closed net points per position and the booked worst cases; `shaping` holds every non-economic term by name; `total` is their sum. The shipped `net_points_after_charges/v1` is legacy's arithmetic unchanged, with an empty `shaping` (`reward.py:64-88`): each close pays gross points minus charges, and an unfillable session-end exit is charged the whole entry premium plus the entry leg's charges.

### RL training and frozen policies (`research/rl/training.py`, `research/rl/policy.py`)

* **Training** wraps legacy's lab (`src/analysis/rl/lab.py`): a tiny SB3 PPO policy on CPU, single-threaded, from a fixed seed (`lab.py:217-231`); every training run is one `research_lab` trial opened before it runs and closed `completed`, `abandoned` or `crashed` (`lab.py:386-458`); a seeded Optuna TPE search records every Optuna trial as one attempt, pruned and failed included (`lab.py:469-509`). Stable-Baselines3, PyTorch and Optuna are the optional `rl` extra.
* **Checkpoints** (new): a checkpoint is `{attempt_id, step, payload_digest, settings_digest, observation_digest, environment_digest, reward_digest, rng_state_digest}`, written once by digest. A resume follows the trials rule (compatibility tuple equal, else refused).
* **Frozen policies.** `freeze` binds the weights payload, the settings that rebuild the network, the observation definition, the reward and assumption digests, the reference facts used and the producing trial under one digest; `write_frozen` writes once into a directory named by it; `load_frozen` refuses a payload or manifest that does not match (`lab.py:295-369`). A frozen policy becomes a `research_policy` candidate bundle.
* **Inference** (`research/rl/policy.py`): the strategy host loads a verified frozen policy on CPU, deterministically, and maps an action index to a direction and conviction from the frozen action set; any failure, an out-of-range or non-scalar action, or `WAIT` is an abstention with the candidate and policy digests (`src/runtime/research_policy_view.py:30-48`; `src/runtime/advisor/backends/research_policy.py:156-162`, `:215-257`). Action constraints grant no live permission (`README.md:881`).

### Memory and reflection (`cognition/memory.py`, `cognition/reflection.py`)

* **Partitions** (`README.md:857`): `working` (one run's scratch, never persisted past it); `episodes` (immutable, versioned outcome episodes); `research` (research, design and proposal records); `protected` (locked-evaluation outputs, never returned by retrieval). Every item carries its partition, source references, `as_of`, license class, strategy, account and version.
* **Episodes** keep legacy's memory rule (`src/runtime/providers/adaptation.py:15-21`, `:176-212`): only reconciled live outcomes, each visible from its settlement instant and never before; a replay or simulated outcome is never an episode (POL-034). The lookback in calendar days is `cognition.memory.outcome_days` (refusing; legacy's `OUTCOME_DAYS` is 5, `adaptation.py:40`, recorded as evidence).
* **Recall.** `recall(MemoryQuery(purpose, session, as_of, strategy, account, license_scope, partitions)) -> list[MemoryItem]` returns only items whose filters all match the caller's scope; a cache entry is keyed by the full scope, so one caller's result never serves another (A06-F5, `README.md:871`). The `protected` partition is never returned. As in legacy, memory is an optional input declared by no shipped strategy; declaring it is a strategy version change (Fork call).
* **Reflection** produces `Proposal(kind: experiment | candidate, rationale, evidence_refs, justification: statistical | mechanical, measured_sample)` records in the `research` partition and submits an experiment as a job through the research-job port. It carries legacy's evidence-quality rule for proposals: a statistical claim states its measured sample and reliability band, a mechanical claim cites its evidence (`src/interfaces/mcp/core/proposals.py:1-60`). It never writes settings, prompts, weights, limits, registry rows, bindings or promotion records (POL-029). `cognition.improvement.mode` binds `read_only`, legacy's default (`config/defaults.yaml:864-869`).

## Failure modes and crash points

| Point | What happens | Recovery |
|---|---|---|
| CP-R1: crash after a custody event is fsynced, before the tail moves | The anchor holds it as `pending` | The next reader rolls it forward (`custody.py:1245-1255`) |
| CP-R2: crash after the custody `reservation`, before the `reserved` access row or the exam trial record | An orphan reservation: custody shows the scopes reserved; no trial names them | The scopes stay spent: `reserve` refuses them again (`custody.py:1793-1794`), as legacy (Fork call). A consistency scan reports `orphan_reservation` (custody reservations no access row names); nothing reuses it |
| CP-R3: crash after the `reserved` access row, before the exam trial record | The access row names a trial ID with no record | The partition counts as used (`trials.py:1230-1236`); the scan reports `orphan_access`; as CP-R2 |
| CP-R4: crash after `read_claimed`, before the manifest | Claimed, unconsumed; the capability died with the process | Never claimable again (`custody.py:1847-1849`); the partition is spent (Fork call); the exam trial is closed `crashed` by job recovery |
| CP-R5: crash after the manifest, before custody `consumption` | A complete-looking dataset with no consumption | Evaluation refuses it (no consumption on either store, `candidate.py:724-732`); as CP-R4. No completion path is added (Fork call) |
| CP-R6: crash after custody `consumption`, before the `consumed` access row | Custody consumed; the trial side shows only `reserved` | Evaluation refuses (`candidate.py:727-732`); the scan reports `consumption_unrecorded`; the partition is consumed in custody and never re-readable |
| CP-R7: crash after the `consumed` access row, before the exam trial closes | The trial is `running` | Job recovery closes it `crashed`; evaluation needs `completed` and refuses (`candidate.py:700-701`), as legacy, where the trial stayed `running` and evaluation refused alike |
| CP-R8: crash during a trial close | The no-replace link either happened or not; a leftover temporary is ignored | A running trial is closed `crashed` by job recovery; a second close refuses |
| CP-R9: crash after the job lease is written, before the job row | The slot is held by a lease naming a queued job | Expiry reconciliation releases it; the job stays claimable (`store.py:460-462`) |
| CP-R10: crash while freezing a candidate or a policy | A temporary directory, no digest-named directory | Verification refuses anything not complete; the temporary is ignored |
| CP-R11: crash after the record bytes are published, before `PROMOTION_VERIFIED` commits | Nothing approved; bytes in the evidence store unreferenced | Resubmission with the same record and binding commits once |
| CP-R12: crash after a custody spend, before `CUSTODY_WITNESSED` | The spend is unwitnessed | The next witness covers it; restore before that relies on the authoritative chain alone |
| A tampered or truncated custody chain or anchor | Every custody operation refuses | Restore from the recovery set and reconcile |
| An older backup restored | Reconciliation reports `stale` (shorter than the authoritative chain or the witness) | Research does not start on it; the authoritative chain stands |
| A restored chain longer than the authoritative one | `additive` | Research stops on both until the owner adopts the verified longer chain |
| Two research workers start | The second cannot take the slot | It waits; the supervisor (SLICE-11) reports |
| An unreadable trial record | Reported; counts marked incomplete | The owner inspects; nothing is dropped |

## Risks and limits

* **Synthetic proof only.** Every proof runs on synthetic custody chains, datasets and runs. New checks cannot certify contaminated history (`README.md:1238`), and they establish no profitability (`README.md:1245`).
* **A claim spent without a consumption burns the partition.** That is legacy's conservative choice: an exam that may have seen its data is never repeated on it.
* **The custody chain is a local file.** Its integrity rests on the anchor, the service-owned storage and the ledger's custody witness; a spend made while the kernel was unreachable is unwitnessed until the next witness. A host loss without the recovery set loses research history, not money.
* **Approvals are made before the open.** A same-day record that applies only to a later-opened session must be approved between midnight and the open of its date; legacy's later strategy-session starts have no equivalent (Fork call).
* **The directional interval ignores serial correlation beyond within-session clustering** (POL-O03). Legacy's statistic is kept until the owner decides.
* **The simulated fill model is coarse.** Next-open fills with no partial fills or queue are labelled assumptions; simulated outcomes never count as live evidence (REQ-XC-007).
* **RL dependencies are heavy.** PyTorch and SB3 run only in the research participant, under `at.slice`.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `promotion.bar.min_net_rupees`, `.min_margin_over_baseline`, `.min_trades` | The promotion bar (POL-042) | Refusing; the repository ships them unset (`config/defaults.yaml:747-751`). The managed host binds ₹0, ₹0 and 30 in its own configuration (POL-042, host values) |
| `promotion.directional.min_scored_per_horizon` | Minimum scored observations per horizon in the gate | Refusing; legacy's 30 (`config/defaults.yaml:767`) bound in config (Fork call). Legacy's in-code fallback to 30 (`promotion.py:107-109`, `:315`) is not kept |
| `promotion.directional.horizons` | Gate horizons, in bars | Refusing; legacy's 5, 15 and 30 (`config/defaults.yaml:768`; `value.py:55`) |
| `promotion.directional.z` | The Wilson interval's `z` | Refusing; legacy's 1.96 (`src/analysis/core/corrections.py:245`) bound in config (Fork call) |
| `promotion.enforce` | Whether admission checks promotion records | Refusing; legacy's `true` (`config/defaults.yaml:766`) |
| `promotion.baselines` | Deterministic baselines available to evaluation | Legacy's `["rule:breakout", "rule:ema_cross"]` (`config/defaults.yaml:761`); `rule:ema_cross` for AI candidates (POL-044) |
| Promotion approval modes | Per family | Kernel events (`PROMOTION_MODE_SET`), not a setting; none recorded reads `owner_approval` (POL-041) |
| `research.bundles.permitted_licenses` | License classes a bundle may carry | Refusing; owner-bound |
| `research.custody_root`, `research.custody_anchor`, `research.trial_root`, `research.job_root` | Service-owned paths | Path fields of the research participants (SLICE-11) |
| `research.jobs.lease_seconds`, `research.jobs.max_pending` | Slot lease and queue bound | Refusing; legacy's 15 s and 16 (`src/analysis/jobs/worker.py:34`; `runner.py:24`) recorded as evidence |
| `cognition.memory.outcome_days` | Episode lookback | Refusing; legacy 5 as evidence; bound only when a strategy declares memory |
| `cognition.improvement.mode` | Improvement mode (POL-029) | `read_only`; `automatic` refuses to load |
| Fill model fields | Per run | Declared by each run; no shipped default |

## Reuse evidence

* Custody, trials, datasets, freeze and evaluation: **reuse with identity parity** (`README.md:1153`). Ported unchanged: the custody chain, its event kinds, checks and anchor; the legacy hasher; the trial record, its validation and counting; the locked-access ledger and the three-store locked-read order; the dataset build and walk-forward leakage rule; `CandidateBundle/v1`; the evaluation sequence, gate, statistic, bar, track selection, approval modes and lineage repair. Added: attempt links, exclusive close, unreadable reporting, metric disclosures, fit records, the custody witness, the kernel's approval and check. Not inherited: the governance receipt file as the promotion store, the Telegram client inside approval.
* RL environment, lab, Gym, reward and policy: **reuse optional libraries** (`README.md:1154`). Ported: the abstract environment, `RewardSpec`, the lab's training, search and freeze, frozen inference with abstention. Added: the v2 transition, reward components, checkpoints, the shared tier.
* Jobs, leases and containment: **retain, simplify configuration** (`README.md:1156`). Ported: the job record, the slot lease, attempt receipts, retry chains, expiry reconciliation. The containment and slice are SLICE-11's.
* Memory and reflection: **new**; legacy's outcomes rule and proposal evidence rule are reused.

## Alternatives considered

* **Move custody into the kernel ledger.** Rejected: the master keeps evidence-access authority apart from financial authority, and the ledger references custody receipts but cannot allocate an OOS claim (`README.md:875`).
* **Convert the custody chain to SQLite.** Rejected: identity parity forbids a serializer that changes event hashes (`README.md:1153`), and the deployed holdout must continue on its own chain (POL-039).
* **Record promotions in the release bundle.** Allowed by A07-F4, but a promotion valid for one trading date would force a release per day; a kernel-verified record per date keeps legacy's validity without that.
* **Refuse the whole session when one candidate is unpromoted.** Rejected: legacy refuses only that strategy (`lifecycle.py:220-226`); the admission check keeps that scope.
* **A workflow engine or experiment tracker** (Temporal, MLflow). Rejected for now (`README.md:1133`); the job port is the seam if one is adopted.

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-RES-01 | T | `tests/unit/test_custody_ledger.py` | Each row of the operation table, with hand-built chains; one-use: a second claim, a second consumption and a reservation over a spent scope refuse; two sources and a copy of one day are one scope; an exposed scope cannot be declared locked; a prospective partition naming a past day refuses; the pending roll-forward; a truncated, reordered or re-hashed chain refuses every operation | a scope is read twice, an alias escapes custody, or a damaged chain is accepted |
| PRF-RES-02 | T | `tests/recovery/test_crash_boundaries.py` | CP-R1…CP-R12 by killing a real research subprocess at each named point; the state after restart matches the table, including the consistency scan's `orphan_reservation`, `orphan_access` and `consumption_unrecorded` reports | a crash leaves a re-readable partition, an evaluable unconsumed dataset, a lost attempt or a double approval |
| PRF-RES-03 | T | `tests/recovery/test_restore_fencing.py` | Every reconciliation status on constructed chains, `not_initialized` and `restored_only` included; a restored chain shorter than the ledger's latest `CUSTODY_WITNESSED` is `stale` even on a clean host; `additive` stops research on both chains until the owner's adoption, and adoption refuses a chain that does not verify or extend; a stale restore leaves the partition consumed; a new search ID reserves nothing new (`README.md:1238`, consumed-state restore) | an older backup or a longer unverified chain resets or forks consumption |
| PRF-RES-04 | T | `tests/unit/test_research_attempts.py` | Open before run; every outcome counted (legacy scenario `tests/test_trials.py:158-167`); concurrent closes: exactly one wins; an unreadable record marks the count incomplete; a resume with an equal tuple links its parent and any changed element refuses; lab promotion lineage only through a naming exam | a failure leaves the count or a close is replaced |
| PRF-RES-05 | T | `tests/unit/test_research_attempts.py` | One slot; lease-first claim; expiry closes the job and its running trial; duplicate delivery returns the existing job; a non-linear retry chain refuses; a second result write refuses; the job port's four calls | two attempts run at once or a result is overwritten |
| PRF-RES-06 | T | `tests/integration/test_research_worker.py` | Both worker profiles rendered from the participant contract pass their own start check and claim and complete one isolated job each; a forbidden trading credential refuses (`README.md:1233`) | a worker runs with a credential its profile forbids, or completes nothing |
| PRF-RES-07 | T | `tests/unit/test_dataset_fitting.py` | Changing evaluation-only rows leaves every `fitted_artifact_digest` unchanged; a fit over locked rows refuses; `apply` never refits; walk-forward order and purge and embargo as legacy, on hand-built partitions (`README.md:1245`, mutated evaluation data) | evaluation refits or reads locked rows unclaimed |
| PRF-RES-08 | T | `tests/unit/test_candidate_freeze.py` | Bundle digests, custody event hashes and the other carried identities equal the golden values generated from legacy (`tests/fixtures/research/legacy_identity_445eb116.json`), including inputs with integer keys, a `default=str` value and a non-finite float; substituting any artifact, or a model strategy's prompt or model identity, changes `CandidateId`; a rule strategy's identity is the sessions spec's manifest; an alias or a prohibited field refuses | an identity differs from legacy's or a substitution keeps the identity |
| PRF-RES-09 | T | `tests/unit/test_promotion_gate.py` | The gate and bar on hand-computed cases: each reason, each `>=` boundary, unset values, track mismatches, `DEFERRED_INCOMPLETE_LINEAGE`, the AI baseline, DSR present and never gating. The statistic by hand: Wilson bounds at `z` = 1.96 on the session-clustered effective n for one-per-session, clustered and unmeasurable-`rho` samples; an unavailable interval refuses its horizon; a raw-count interval that would pass is never used. Lineage repair by a non-owner or from another day's records refuses (POL-045) | a reason is missed, a boundary flips, the raw count replaces the effective n, or DSR decides |
| PRF-RES-10 | T | `tests/integration/test_shared_engine.py` | A replay driven through the `EnginePort` that `bootstrap.py` composes, with the `RuleResponder`, gives the plans, admissions and simulated outcomes of the hand-computed fill model; every outcome `simulated`; the model's identity on every result; a research run that names the test-only rule is refused | a simulated result lacks its model, is labelled live, or a research run uses the test rule |
| PRF-RES-11 | T | `tests/unit/test_rl_research.py` | With the shipped model: rejected and unfilled actions leave no position, and an unfillable session-end exit stays open until its worst case is booked. With the test-only rule: a rejected order, a partial fill (open quantity equals the filled part, the rest `pending`), a fill delayed by declared bars and an order still open at episode end each reconcile state and reward by hand. Economic plus shaping equals total; `terminated` at session end and `truncated` only at a declared step limit; same seed, same stream digest; frozen policy tampering refuses; inference failures abstain (`README.md:1245`, reject, delay, partially fill) | a rejected action implies a position, a partial fill is booked whole, or reward and state disagree |
| PRF-RES-12 | T | `tests/integration/test_custody_promotion.py` | End to end in simulation, with in-test authenticated principals (the owner over the owner credential path, a delegated human, the research service): substituting the artifact, the prompt or model identity, or the session scope between approval and activation refuses the candidate's entries while existing obligations stay protected; an approval used only by a session opened after it, never by the session open when it was recorded; a record for another date or a superseded binding refused; the approver is the calling principal, the owner alone for the estimated track and for `owner_approval`, the research service only in a family the owner set to automatic; mode switches by anyone but the owner refused; BuyerEdge's binding records `requires_promotion: false` and no BuyerEdge entry meets the new check, while an unflagged-but-model candidate is refused by the host; every evaluation over locked rows leaves exactly one metric disclosure, failed and repeated runs included (`README.md:879`, `:1238`, `:1245`) | a substituted, unapproved or self-approved candidate's entry is admitted, BuyerEdge meets a new check, or an evaluation goes undisclosed |
| PRF-RES-13 | T | `tests/unit/test_cognition_memory.py` | An episode is invisible before its settlement instant; simulated outcomes never enter episodes; a caller outside the filters sees nothing; the protected partition is never returned; reflection writes only proposals and job requests | memory leaks the future or protected data, or reflection writes a setting |
| PRF-RES-14 | T | `tests/contracts/test_capabilities.py` | An `ast` scan of `research` (including `research/replay.py`, which reaches the engine only through the injected `EnginePort`) and the memory and reflection modules finds no import of the ledger writer, an order adapter, the kernel or `bootstrap`; no broker key in research environments; no write path to settings, policy, bindings or the custody chain outside `research/custody.py`. The OS part is SLICE-11's (`tests/isolation/test_resource_storage_scope.py`, `README.md:1239`) | research can reach an order path or rewrite custody |

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-03 | Standing bindings, grants, the owner principal, `CandidateId` for hand-written strategies, `candidate_not_bound` at admission | (PRF-SES-08, PRF-SES-09) |
| SLICE-09 | Decision method and authority on registry rows; the advisor run records lineage repair reads; the host's identity computation | (PRF-STR-01, PRF-STR-06) |
| SLICE-10 | The operator commands for promotion, approval, mode switching, witness grants and lineage repair (this slice proves the kernel side with in-test principals) | (SLICE-10's) |
| SLICE-07 | The simulated broker's `RuleResponder` seam | (PRF-DSP-12, script part) |
| SLICE-11 | The participant contract (render and refuse), `at.slice`, research storage classes, the restore that calls custody reconciliation | (PRF-CFG-06) |
| SLICE-12 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-12-research-rl-custody-promotion.md#steps) | PRF-RES-01…14; PRF-DSP-12 (rule part) |
| SLICE-13/14 | Importing the deployed custody chain and trial records, with POL-039's holdout | REQ-RES-016 at migration |
