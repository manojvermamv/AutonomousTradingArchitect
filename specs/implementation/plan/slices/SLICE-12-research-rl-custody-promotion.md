# SLICE-12 — Research, RL, custody and promotion

* **Status:** proposed (2026-10-30), revised the same day after the first design review (findings F-1…F-14, below). Not yet re-reviewed. Every step below is an outline. By the owner's run-mode rule ([standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)) each step's exact detail (files, signatures, test tables, break checks) is written just before that step is built, then reviewed, built, run twice with the suite, break-checked and recorded "as built".
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [research spec](../../design/research-rl-custody-promotion.md). Every call that touches money or a promotion gate keeps legacy's behaviour at 445eb116 and is logged below as **Fork call**; every other intentional difference from legacy is marked **Deviation**. No score, threshold, statistic or money value is set here.
* **Phase:** master Phase 6 (A07-F1…F4; `README.md:1186`), an independent lane that may run in parallel with Phases 5 and 7 against frozen contracts. Environment class S. TASK-S12-09's golden cases are generated once from a legacy checkout on synthetic inputs; its second half reads production research metadata only on the owner's word (Excluded).
* **Builds on:** SLICE-03 (bindings, grants, the owner principal, `CandidateId`, `candidate_not_bound`) for steps 1–3 and 7. Step 2's worker profiles need SLICE-11 step 1 (the participant contract) as built. Steps 4 and 5's shared tier need SLICE-07 (the simulated broker) and SLICE-08 (the market store) as built. Step 4's lineage repair reads the advisor run records of SLICE-09 step 5 (`cognition/records.py`). Step 6 needs SLICE-09 step 1 (decision method and authority on registry rows) as built; it proves the kernel side with in-test authenticated principals (the owner over the owner credential path, a delegated human, the research service), as SLICE-03's tests do, so it does not wait for SLICE-10, whose operator commands call it later. The branch is cut from the latest built slice.
* **Owner answers applied:** [Q-005](../../decisions/owner-questions.md#q-005) (the first release runs BuyerEdge, which needs no promotion); [Q-010](../../decisions/owner-questions.md#q-010) (revoking a candidate's standing binding stops its entries at once); the standing rules (fork rule, run mode, boundary). POL-O03 (AUDIT-WILSON-SERIAL-1) stays open: legacy's statistic is kept.
* **Tasks and proofs:**
  * **Before step 1:** TASK-S12-09 (characterizations; the golden fixture for PRF-RES-08).
  * **Step 1:** TASK-S12-01 (PRF-RES-01, PRF-RES-03; PRF-RES-02 row CP-R1).
  * **Step 2:** TASK-S12-02 (PRF-RES-04, PRF-RES-05, PRF-RES-06; PRF-RES-02 rows CP-R8, CP-R9).
  * **Step 3:** TASK-S12-03 (PRF-RES-07, PRF-RES-08; PRF-RES-02 rows CP-R2…CP-R7, CP-R10).
  * **Step 4:** TASK-S12-04 (PRF-RES-09, PRF-RES-10; PRF-DSP-12 rule part).
  * **Step 5:** TASK-S12-05 (PRF-RES-11).
  * **Step 6:** TASK-S12-06 (PRF-RES-12; PRF-RES-02 rows CP-R11, CP-R12; the witness rows of PRF-RES-03).
  * **Step 7:** TASK-S12-07 (PRF-RES-13).
  * **Step 8:** TASK-S12-08 (PRF-RES-14).

**In plain words.** This slice rebuilds the research workshop so that no shortcut can lead an untested idea to real money. Step 1 rebuilds the record of which market days have been looked at, including the one-time "exam" days, and the check that a restored backup cannot make used exam days fresh again. Step 2 rebuilds the log of every research attempt and the queue that runs them, so a crashed or retried run is always written down and counted. Step 3 builds research datasets and freezes a finished candidate by the exact fingerprint of its files and settings, the same fingerprint the old system computes. Step 4 rebuilds the exam itself: the replay through the real trading rules with a simulated broker, and the pass-or-fail rule, unchanged. Step 5 rebuilds the reinforcement-learning lab and makes every step's record add up. Step 6 lets the owner approve a candidate for one trading day, before the market opens, at the kernel itself; the kernel then refuses orders from an unapproved or swapped candidate. Step 7 adds research memory and a reflection step that can only suggest experiments. Step 8 proves none of this can reach orders, the broker key or the settings. No trading rule, gate value or limit changes, and BuyerEdge meets none of the new checks.

**Excluded, and where each part arrives:**

* **SLICE-10:** the operator commands that call this slice: recording a promotion, `promotion_verify` (approval), `PROMOTION_MODE_SET` (mode switch), adopting a longer custody chain, the lineage-repair dry run and write; issuing the `promotion_approve` and `custody_witness` grants; the alert route that carries approval requests.
* **SLICE-11:** the research units and their unit files, `at.slice` and the research storage classes (the OS half of PRF-RES-14, `tests/isolation/test_resource_storage_scope.py`); the restore that calls custody reconciliation; measuring the job lease and queue bound if the owner wants them measured rather than carried.
* **SLICE-13/14:** importing the deployed custody chain, its anchor, the access ledger and the trial records, including POL-039's holdout (REQ-RES-016). REQ-MIG-003 forbids SLICE-12 from opening a legacy store.
* **Integration edits outside this file and the spec,** made when the slice's first step is reviewed (listed for the coordinator):
  * module index: memory and reflection now specified in the research spec; tree deltas **T-80…T-89**;
  * sessions spec: `requires_promotion` in `BINDING_AUTHORIZED`, the `standing_binding` row and `BindingRef`, and how earlier events read it; `PROMOTION_VERIFIED`, `PROMOTION_MODE_SET` and `CUSTODY_WITNESSED`; the grant actions `promotion_approve` and `custody_witness`; the `CandidateId` manifest for model-method strategies;
  * intent spec: the `candidate_not_promoted` admission refusal and its code;
  * `resources/events.schema.json` and `resources/candidates.schema.json`;
  * strategies spec: the host computes `CandidateId` from what it loaded and refuses a model-driven `plan`/`trade` strategy whose binding flag is `false`;
  * configuration spec: `bootstrap.py` composes the `EnginePort` for research;
  * traceability rows for REQ-RES-009…016.
* **TASK-S12-09, second half:** running the custody, access-ledger and trial readers over a read-only copy of the production custody chain, anchor and trial records (metadata only; no protected payload opened). The boundary rule pre-approves reading recorded market days, not research custody, so this waits for the owner's word; without it the readers are first run on production data at SLICE-13. **Void (2026-11-14):** the EC2 and every production record on it were lost on 13 November and the owner chose a fresh start (SLICE-15), so there is no production custody chain, anchor or trial record to read. The first half is built (below, "TASK-S12-09 first half as built").

## Review resolution (2026-10-30)

| Finding | Resolution |
|---|---|
| F-1 approval boundary | Verified (`src/authoring/capabilities/candidate_activation.py:319-335`, `:368-407`; called at session start, `src/runtime/session_config.py:884`). An approval is used only by a session opened after it; Fork call 11 rewritten |
| F-2 no trusted model flag | Verified (`contracts/identity.py:127-149`; `kernel/authority.py:249-258`). `requires_promotion` per candidate in `BINDING_AUTHORIZED`; BuyerEdge `false` proved in PRF-RES-12 |
| F-3 inference configuration | Verified (`src/runtime/advisor/promotion.py:482-497`; `src/runtime/strategy_host/lifecycle.py:148-152`). Prompt digest and model identity join the `CandidateId` manifest for model-method strategies; Fork call 20 |
| F-4 approval as a claim | `promotion_verify` is the approval act; the caller is the approver; owner-only for the estimated track and `owner_approval`; the research service only in automatic mode; modes are owner-only kernel events; Fork calls 8, 9 |
| F-5 restore | `additive` stops both chains until owner adoption (withdrawn 2026-11-03: legacy's `ok: true` kept, Fork call 22); `not_initialized` and `restored_only` added; `CUSTODY_WITNESSED` in the ledger |
| F-6 three stores | Verified (`src/analysis/core/trials.py:487-547`, `:1281-1336`; `src/analysis/datasets/__init__.py:2448-2456`; `src/analysis/evaluation/candidate.py:700-738`; second consumer `src/interfaces/cli/historical.py:2254-2255`). Access ledger ported; CP-R2…CP-R7; CP-R3 corrected (manifest before consumption); Fork calls 2, 21 |
| F-7 statistic | Verified (`src/analysis/core/corrections.py:176-245`; `src/runtime/advisor/value.py:225-241`). Pinned in Fork call 5 and PRF-RES-09; `promotion.directional.z` bound to 1.96 |
| F-8 enforce switch | Kept, Fork call 12; X item for the coordinator |
| F-9 metric disclosure | `metric-disclosures/` record per evaluation over locked rows; counted in PRF-RES-12 |
| F-10 reject/delay/partial | Test-only declared rule; `terminated`, `truncated`, `pending` in the transition (legacy truncated always false, `src/analysis/rl/gym_env.py:104-109`); Fork call 17 |
| F-11 research importing the kernel | `bootstrap.py` composes; `research/replay.py` uses an injected `EnginePort`; PRF-RES-14 scans for it |
| F-12 dependencies | Step 6 proved with in-test principals; lineage repair reads SLICE-09's run records |
| F-13 hasher | Verified (`src/_canonical.py:10-14`). `research.custody.legacy_digest` for every carried identity; TASK-S12-09 covers integer keys, `default=str`, non-finite floats |
| F-14 close semantics | No-replace link to `{id}.closed.json`; CP-R8 |

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | Evidence scopes and bundles (`research/bundles.py`); the legacy hasher, the custody chain, anchor, operations, states, restore reconciliation with adoption, and the witness client over a port (`research/custody.py`) | PRF-RES-01, PRF-RES-03, PRF-RES-02 (CP-R1) |
| 2 | The trial ledger with attempt links, no-replace close, counting and resume (`research/trials.py`); the job store, slot lease, attempt receipts, retries, expiry, the research-job port and the two worker profiles (`research/jobs.py`) | PRF-RES-04, PRF-RES-05, PRF-RES-06, PRF-RES-02 (CP-R8, CP-R9) |
| 3 | The locked-access ledger, metric disclosures and the consistency scan (`research/trials.py`); dataset build, walk-forward leakage, the three-store locked read and fit records (`research/datasets.py`); `CandidateBundle/v1`, the write-once freeze and `CandidateId` by decision method (`research/candidates.py`) | PRF-RES-07, PRF-RES-08, PRF-RES-02 (CP-R2…CP-R7, CP-R10) |
| 4 | The fill and cost model behind `RuleResponder`, the test-only declared rule, the `EnginePort` and the replay driver (`research/replay.py`, with its composition in `bootstrap.py`); the evaluation sequence, the pinned statistic, track selection, gate, disclosure, lineage status and repair, benchmarks (`research/evaluation.py`) | PRF-RES-09, PRF-RES-10, PRF-DSP-12 (rule part) |
| 5 | The abstract and shared environment tiers with the v2 transition (`terminated`, `truncated`, `pending`), `RewardSpec` with components (`research/rl/environment.py`, `research/rl/reward.py`); training, search, checkpoints and freeze (`research/rl/training.py`); frozen inference with abstention (`research/rl/policy.py`) | PRF-RES-11 |
| 6 | The promotion record, recording, the bar and automatic-mode submission (`research/promotion.py`); `PromotionRecord/v1` (`resources/candidates.schema.json`); the kernel's `requires_promotion` flag, `promotion_verify`, `PROMOTION_MODE_SET`, `CUSTODY_WITNESSED` and the admission check (`kernel/authority.py`, `kernel/admission.py`) | PRF-RES-12, PRF-RES-02 (CP-R11, CP-R12), PRF-RES-03 (witness rows) |
| 7 | Memory partitions, episodes and recall (`cognition/memory.py`); reflection proposals through the job port (`cognition/reflection.py`) | PRF-RES-13 |
| 8 | The capability boundary over `research` and the memory and reflection modules | PRF-RES-14 |

**Why this order.** Every later step reads or writes custody (1 first). Datasets open trials and run as jobs (2 before 3). Evaluation needs consumed datasets and frozen candidates (3 before 4). RL's shared tier steps a replay run and its freeze is a candidate bundle (4 before 5). Promotion records evaluations, and the kernel's witness completes step 1's client (4 before 6). Memory and reflection need custody and the job port only, so step 7 may be built in parallel after step 2 by a second agent owning `cognition/memory.py` and `cognition/reflection.py` only. Step 8 checks the finished packages.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root. `custody.py` is `src/analysis/core/custody.py`; `trials.py` is `src/analysis/core/trials.py`.

* **Custody.** One hash chain `events.ndjson` with a trusted-tail anchor in another directory (`custody.py:24-36`, `:184-206`); appends announce `pending`, fsync the event, then move the tail, and a reader rolls forward exactly one announced event (`custody.py:1183-1256`, `:1437-1509`). Operations: declare (`:1669-1703`), expose ordinary (`:1721-1740`), reserve (`:1755-1806`), claim the one read with a process-local capability (`:96`, `:1825-1876`), consume with the claim ID alone (`:1909-1951`); states per scope and partition (`:1969-2014`, `:2038-2066`). Evidence scopes are calendar-day-underlying identities shared by every source (`src/data/historical/contracts.py:65-116`). Identities hash with `default=str` (`src/_canonical.py:10-14`).
* **Restore.** The off-box backup tool compares a restored chain with the current one and reports `not_initialized`, `restored_only`, `missing`, `conflict`, `stale`, `current` or `additive`, never copying; `additive` is a plan and the current chain continues (`deploy/offbox_backup.py:406-541`).
* **Trials and locked access.** One JSON file per record; open before run (`trials.py:290-572`); lab, one-lever and grid rules (`:311-343`); a locked open writes the custody reservation, then the `reserved` access row, then the trial (`:487-547`); close appends `{id}.{outcome}.json` after a check, with an atomic replace (`:574-616`, `:266-288`); unreadable files skipped (`:622-632`); every outcome counted (`:666-683`); lab promotion only through a naming exam (`:685-729`); access rows and partition use (`:1221-1298`); consumption writes custody, then the `consumed` row (`:1300-1336`); prospective partitions declared before their days (`:995-1000`). Legacy scenarios: `tests/test_trials.py:151-176`.
* **Jobs.** Job records (`src/analysis/jobs/store.py:55-83`); one slot, lease written before the row (`store.py:424-483`); expiry terminates the tree and fails the job (`:494-526`); retry chains by request identity (`src/analysis/jobs/runner.py:161-182`, `:407-451`); offline and advisor workers (`src/analysis/jobs/policy.py:11-13`, `:31-37`).
* **Datasets and training.** Walk-forward leakage rule (`src/analysis/datasets/__init__.py:201-258`); locked reads claim, build, write the manifest, then consume and close the trial (`:1960-2016`, `:2448-2464`); the manifest identity and baseline section (`:2420-2450`); training refuses locked rows and records role labels (`src/analysis/training/__init__.py:546-619`).
* **Candidates.** `CandidateBundle/v1`, its families, identities and prohibited fields; digest over `to_dict()` (`src/analysis/candidates/contracts.py:18-108`, `:359-546`).
* **Evaluation and gate.** The evaluation sequence (`src/analysis/evaluation/candidate.py:853-1038`) and its locked-evidence checks (`:690-738`); lineage status (`:577-592`); the gate (`src/runtime/advisor/promotion.py:61-146`) with the Wilson interval at `z` 1.96 (`src/analysis/core/corrections.py:245`) on the session-clustered effective n (`corrections.py:176-242`), unavailable when `rho` is unmeasured (`src/runtime/advisor/value.py:225-241`), horizons 5, 15, 30 (`value.py:55`), minimum 30 per horizon (`config/defaults.yaml:765-768`); DSR advisory (`src/analysis/core/selection.py:213-218`); lineage repair (`src/analysis/datasets/__init__.py:2971-3008`; `src/interfaces/console/api/routes/lineage_repair.py:1-61`). No metric-disclosure record exists.
* **Promotion and approval.** Records require an eligible, source-verified evaluation, a passing bar, a named reviewer and the same day (`promotion.py:181-278`, `:333-467`; `src/core/governance/evidence.py:133-148`); the bar ships unset and refuses (`src/runtime/advisor/promotion_bar.py:1-19`, `:357-412`; `config/defaults.yaml:739-751`); a model-driven strategy with `plan` or `trade` authority starts only with a same-day receipt matching its file, model identity and prompt (`src/runtime/strategy_host/lifecycle.py:142-185`, `:200-227`; `promotion.py:470-524`; `evidence.py:263-284`); `advisor.promotion.enforce: false` lets any start (`promotion.py:477-478`). The owner's approval names the newest staged gating profile for `NEXT_SESSION` and is activated at a session start (`src/authoring/capabilities/candidate_activation.py:283-365`, `:368-407`; `src/runtime/session_config.py:884`). Approval modes, owner-only switching and the estimated-track rule (`src/authoring/capabilities/promotion_approval.py:37-40`, `:113-202`, `:270-372`).
* **RL.** The environment and its contract (`src/analysis/rl/environment.py:1-58`, `:103-171`, `:302-345`, `:405-631`); the Gymnasium wrapper's `terminated = done`, `truncated = False` (`src/analysis/rl/gym_env.py:104-109`); the reward spec (`src/analysis/rl/reward.py:23-107`); the lab's training, search and freeze (`src/analysis/rl/lab.py:217-231`, `:295-369`, `:386-509`); the fill model (`src/analysis/execution/historical.py:96-129`); frozen inference and abstention (`src/runtime/research_policy_view.py:30-48`; `src/runtime/advisor/backends/research_policy.py:215-257`).
* **Memory and reflection.** Not built (`src/authoring/taxonomy.py:104-109`); an outcomes provider shipped but declared by nothing (`src/runtime/providers/adaptation.py:1-49`, `:176-227`); config-change proposals with an evidence-quality rule (`src/interfaces/mcp/core/proposals.py:1-60`); improvement `read_only` (`config/defaults.yaml:864-869`).

## Fork calls

Each keeps legacy's behaviour because it touches money or a promotion gate. Each is for the owner's review.

1. **The custody state machine and its checks, unchanged:** reserve, one claim bound to scope, identity, actor, search and trial, then consume (`custody.py:1755-1951`).
2. **Every interrupted locked read burns the partition:** an orphan reservation with no trial (`trials.py:520-547`; `custody.py:1793-1794`), a claim with no consumption (`custody.py:1847-1849`), a manifest with no consumption, or a consumption with no access row; none is ever re-readable, and none is evaluable (`candidate.py:700-732`).
3. **Locked-OOS is consumed at the locked dataset build,** after the manifest is written, not at evaluation; evaluation re-runs over the consumed dataset (`src/analysis/datasets/__init__.py:1960-2016`, `:2448-2456`).
4. **Source neutrality by evidence scope:** any source, copy or alias of a calendar day and underlying is the same scope (`src/data/historical/contracts.py:65-116`; `custody.py:1587-1593`).
5. **The directional gate and its statistic, unchanged:** at every horizon (5, 15, 30), at least 30 scored observations and a Wilson interval at `z` = 1.96 whose lower bound is above 0.5, computed on the session-clustered effective n `n / (1 + (m − 1)·rho)`; when `rho` is unmeasurable the interval is unavailable and the horizon refuses, never falling back to the raw count; plus a named baseline, locked-OOS only, positive net with every closed trade priced (`promotion.py:61-146`; `corrections.py:176-245`; `value.py:225-241`). The three numbers move into refusing settings bound to legacy's values. POL-O03 stays open.
6. **The promotion bar unchanged:** three values, `>=`, matched AI trades, unset refuses (`promotion_bar.py:357-412`).
7. **Evidence track:** `locked_oos_estimated` by default, real broker track opt-in; candidate and baseline must share every assumption (`promotion.py:76-103`; `candidate.py:1005-1021`).
8. **Owner-only approval where legacy waited for the owner:** every `locked_oos_estimated` record, whatever the mode (`promotion_approval.py:303-304`, `:336-340`), and every record in an `owner_approval` family (`:358-363`). The approver is the principal calling `promotion_verify`, never a value inside the record.
9. **Approval modes:** none recorded reads `owner_approval`; only the owner switches; automatic approval only on the real broker track, while the bar is set and unchanged since the record, submitted by the research service as legacy's `after_promotion` acted as `automatic_when_bar_passes:<family>` (`promotion_approval.py:113-152`, `:172-202`, `:303-326`).
10. **Only model-driven candidates with `plan` or `trade` authority need promotion;** rule strategies such as BuyerEdge need none (`lifecycle.py:220-226`). The kernel learns which from `requires_promotion`, written by the binding's authorizer from the registry row; BuyerEdge's is `false`.
11. **An approval and the day's receipt serve every entry admitted after they are recorded** (revised 2026-11-04, step 6 review item 1). Legacy checked at each strategy start for a same-day receipt from any named reviewer, and the owner's approval stayed on the active profile across days (`src/runtime/strategy_host/lifecycle.py:167-184`, `:200-227`; `src/core/governance/evidence.py:263-269`; `src/runtime/session_config.py:864-899`). So the owner's approval holds for the binding's date range, the daily act is the same-date record, and a record or approval made after the open, or before a restart, counts from then on.
12. **The enforcement switch is kept:** `promotion.enforce`, first release `true` (`promotion.py:477-478`; `config/defaults.yaml:766`). It contradicts the master's "a candidate cannot bypass its applicable promotion rules" (`README.md:1172`); raised as [X-009](../../consistency/master-contradictions.md#x-009) for the master's owner.
13. **The frozen acceptance rule must equal the current rule** (`promotion.py:288-318`).
14. **Lineage gaps defer, and repair is owner-only from the strategy's own records for those days, confirmed by a dry run** (`candidate.py:577-592`; `src/analysis/datasets/__init__.py:2983-3008`).
15. **DSR is advisory only** (`selection.py:213-218`).
16. **A lab trial is promoted only through a completed exam that names it** (`trials.py:685-729`).
17. **The exam's simulated fill model is legacy's replay producer path:** `HistoricalExecutionAdapter` with the default `FillAssumptions()` (0 bps) and `SIMULATED_QUOTE`: the entry at the ask of the first causal quote whose ask size covers the quantity, the exit at the bid of the last causal quote available at or before the session close, partial fills refused, no tick rule; an exit that cannot fill books no trade (`src/data/replay_engine/producer.py:806-818`, `:1006-1022`, `:1097-1115`; `historical.py:96-129`). Bar next-open fills and the tick rule are the abstract RL tier's (`src/analysis/rl/environment.py`). The partial-and-delayed rule exists only in tests.
18. **Frozen research-policy inference abstains on any failure** (`backends/research_policy.py:256-257`; `research_policy_view.py:37-44`).
19. **Memory stays undeclared by every shipped strategy** (`adaptation.py:1-7`).
20. **A model strategy's prompt and model identity are part of its candidate identity,** so a changed prompt or model needs a new binding and a new approval, as legacy's start check refused a receipt whose prompt or identity no longer matched (`promotion.py:482-497`; `lifecycle.py:148-152`).
21. **No completion of a consumption after a crash:** `consume` keeps legacy's signature (the claim ID, no capability), but no path calls it after a crash, as in legacy, where both callers consume in the claiming process (`src/analysis/datasets/__init__.py:2451-2454`; `src/interfaces/cli/historical.py:2254-2255`).
22. **A longer restored custody chain (`additive`) lets research continue on the current chain,** as legacy's `ok: true`, nothing merged (`deploy/offbox_backup.py:537-542`); the owner may adopt the longer chain when they choose (step 1 review R-2).
23. **No licence check when a bundle is published,** as legacy, which publishes any `license_classification`; the licence decision stays the owner's (step 1 review R-2).

**Spec-only improvements, listed, not made:** an approval required before the open of its date (call 11; the first step 6 plan's rule, a new gate on trading); an approval covering a range of dates, or usable later on its own date (call 11); removing `promotion.enforce` (call 12); a serial correction to the directional interval (call 5, owner's POL-O03); a recorded `disclosed_unconsumed` state and an owner-run completion of a crashed build whose manifest verifies (calls 2 and 21); simulating partial fills in research runs (call 17); refusing research on `additive` until the owner adopts the longer chain, because continuing on the shorter one could let exam days the longer chain already spent be reserved and read a second time (call 22); a licence check at bundle publication against an owner-bound list (call 23).

## Deviations

1. **A trial closes with a no-replace link** to `{id}.closed.json`, so a concurrent or repeated close refuses; legacy checked, then replaced (`trials.py:581-589`, `:266-288`). Legacy closing files stay readable; two of them read as `conflicting_close`.
2. **Unreadable trial records are reported** and mark a count incomplete; legacy skipped them (`trials.py:622-632`).
3. **Attempts link to the job attempt** and resumes record a checkpoint compatibility tuple; legacy's trials name no job and the lab restarts from scratch (`src/analysis/rl/lab.py:386-458`).
4. **Expiry reconciliation also closes the job's running trial `crashed`;** legacy marked only the job (`store.py:494-526`).
5. **Duplicate delivery returns the existing job,** and a second result write refuses; legacy did not refuse a duplicate request identity at enqueue (`runner.py:185-232`).
6. **Fit records** add the fitted artifact and the application population; legacy recorded role labels and definition digests (`src/analysis/training/__init__.py:579-584`).
7. **Metric disclosures** are recorded for every evaluation over locked rows; legacy recorded none (`README.md:879`).
8. **A consistency scan reports** orphan reservations, orphan access rows and unrecorded consumptions; legacy left them silent.
9. **The custody witness:** custody spends are witnessed in the kernel ledger, and restore compares with the latest witness; legacy compared two file chains only.
10. **Withdrawn (2026-11-03, step 1 review R-2; now Fork call 22).** It made `additive` stop research on both chains until the owner adopted the longer chain. Under the fork rule, legacy's `ok: true` is kept, and the stricter rule is listed under spec-only improvements.
11. **The approval is the kernel's `promotion_verify`,** with the caller recorded as approver, and modes are owner-only kernel events (`PROMOTION_MODE_SET`); legacy kept approvals and modes in files under the run directory (`candidate_activation.py:336-358`; `promotion_approval.py:24-26`). Who may approve is unchanged (Fork calls 8, 9).
12. **The kernel trusts `requires_promotion` in the binding;** legacy read the registry in the strategy host (`lifecycle.py:220-226`).
13. **The RL transition is `research_transition/v2`** with `admission`, `pending`, `state_after`, `terminated` and `truncated`, and the reward returns economic and shaping components; legacy's v1 is a subset and its arithmetic is unchanged (`environment.py:427-453`; `reward.py:64-79`).
14. **Consequential RL and evaluation claims run through the shared engine,** reached through an `EnginePort` that `bootstrap.py` composes; legacy's environment stays as the `abstract` tier with limited claims.
15. **RL runs declare their fill assumptions** (the abstract tier and the shared tier's bar model), with no slippage default; legacy's lab defaulted to 0 bps (`historical.py:101-102`; `src/analysis/rl/lab.py:115`). The exam's replay keeps legacy's default `FillAssumptions()` (Fork call 17).
16. **Approval requests go through the operator alert route** (SLICE-10); legacy sent them from a Telegram client inside the approval module (`promotion_approval.py:215-228`).
17. **Restore reconciliation is a library function** called by restore; legacy's lived inside the backup tool (`deploy/offbox_backup.py:406-541`).
18. **No in-code fallback for gate parameters:** they come from bound settings; legacy fell back to 30 and to `z` = 1.96 by default argument (`promotion.py:107-109`, `:315`; `corrections.py:245`).
19. **Memory and reflection are built** (legacy has neither); `cognition.improvement.mode` builds only `read_only`, and `automatic` refuses to load (legacy accepted the value, `config/defaults.yaml:866`; whether legacy implemented it is **not checked**).

## Before step 1 — characterizations (TASK-S12-09, outline)

Deepened before step 1. `scripts/gen_research_parity.py` (**T-87**), run once against a legacy checkout and never in the suite, as SLICE-06's and SLICE-08's generators, writes `tests/fixtures/research/legacy_identity_445eb116.json` (**T-86**): on synthetic inputs, legacy's `json_sha256` and `json_form` over inputs with integer keys, a `default=str` value (a date, a `Path`), `NaN` and `Infinity`; custody event hashes and anchors for a scripted sequence of operations, the locked-access rows it writes; `CandidateBundle.digest` for one bundle per family; a dataset manifest identity; an evaluation identity; a `RewardSpec` digest; Wilson bounds at `z` 1.96 and clustered effective n for three sample shapes. Provenance goes in `tests/fixtures/manifests.json`. It also records whether legacy's `CandidateRegistry` load re-hashes every artifact (the spec marks it **not checked**). The second half (production metadata) waits for the owner's word (Excluded). **The second half is void (2026-11-14):** the server and its production records are gone (SLICE-15).

### TASK-S12-09 first half as built (2026-11-14)

**In plain words.** The test file that pins the old system's fingerprints now exists. It was made by running the old system's own code, at the 445eb116 commit, on invented inputs on this PC. The three tests that compare the new code with it no longer skip, and all pass. Nothing from the lost server was needed or read.

* **Generator** `scripts/gen_research_parity.py` (T-87). Command, in its docstring: `git -C <OA> archive 445eb116 src config pyproject.toml | tar -x -C <export>`, then `python -I scripts/gen_research_parity.py --legacy <export> --out tests/fixtures/research/legacy_identity_445eb116.json`. Two runs wrote identical bytes (30,171). Provenance is in `tests/fixtures/manifests.json`.
* **Golden** `tests/fixtures/research/legacy_identity_445eb116.json` (T-86), format `legacy-identity/1`, every input synthetic:
  * `hasher`: ten inputs (integer keys, a date and a `PurePosixPath` under `default=str`, `NaN`, `±Infinity`, a tuple, nested, empty, float forms), each with legacy's `json_sha256` and its `json_form` digest. Values JSON cannot hold are tagged (`$int_keys`, `$date`, `$path`, `$tuple`).
  * `custody`: the step 1 scripted chain through legacy's `CustodyLedger`, with the authority root at legacy's default (the custody root, as `CustodyLedger.configured` passes it). It gives each event hash, the chain's SHA-256 and length (3,926 bytes, no CR), and the anchor as a template with `{root}`.
  * `locked_access`: a holdout declared, opened, claimed and completed through legacy's `TrialLedger`, with its custody chain and both `locked-oos-access` rows (`reserved`, `consumed`).
  * `bundles`: one per family (five). `dataset_manifest`: an identity that legacy's `read_manifest` accepts. `evaluation`: an identity over integer horizon keys. `reward_spec`: `NET_POINTS_AFTER_CHARGES`. `wilson` at z 1.96 and `clustered_effective_n`: three shapes each.
  * `registry_load_rehashes`: **true**, read from `registry.py` `_verify_at`, which re-hashes every listed artifact (lines 372-381). It was not run, because its directory descriptors do not open on Windows. This answers the spec's "not checked".
* **Cross-check.** The generator's custody hashes, chain digest and five bundle digests equal the values step 1 and step 3 computed from legacy on 2026-11-03.
* **Windows shims.** The generator uses four, and only on Windows: no-op `fcntl.flock`, `os.register_at_fork` stubbed, directory `os.open` with fsync skipped, and `O_BINARY`. `uuid4`, `datetime.now` and `time.time` are scripted in the legacy modules on every OS.
* **Deviation.** The step 1 constants put `/srv/at/research-custody` in the anchor. At 445eb116, legacy refuses a second operation when `_authority_root` differs from the root ("configured custody root changed"), so the golden's chain uses legacy's default. The event hashes do not depend on the root.
* **Recorded, not compared.** The `locked_access` section is not compared, because the target's trial ledger is a port with its own ids. Its hashes that cover legacy's migration events are `null`: those events record the trial directory's path, so they differ between two directories. The `access_rows`, declaration and trial are equal across runs.
* **Consumers.** The three tests are `tests/unit/test_custody_ledger.py::test_golden` (hasher, custody), `tests/unit/test_candidate_freeze.py::test_golden` (bundles, dataset manifest, evaluation identity) and `tests/unit/test_promotion_gate.py::test_golden` (Wilson, effective n, reward; new).
* **Tests.** The three files ran twice: 91 passed, 0 skipped each time. Before this, the two golden tests skipped.
* **Breaks.** Four, each caught by its golden test, every file restored (md5):
  * `json_form` with `default=repr`;
  * Wilson's low bound rounded to 3 places;
  * `evaluation_identity` without `json_form`;
  * one golden bundle digest altered.

## Step 1 — custody and bundles

<a id="step-1--custody-and-bundles-outline"></a>

The authorities are the spec's [Bundles and evidence scopes](../../design/research-rl-custody-promotion.md#bundles-and-evidence-scopes-researchbundlespy) and [Custody](../../design/research-rl-custody-promotion.md#custody-researchcustodypy) sections, CP-R1, PRF-RES-01, PRF-RES-03 and PRF-RES-08's identity rows. Step 1 is TASK-S12-01. It builds on OA_NEW `75420a6` (or the branch head when the build starts) and needs nothing from SLICE-03 at run time: research imports no kernel module, and the witness goes through a port that step 6 implements in the kernel. Every legacy citation is at 445eb116: `custody.py` is `src/analysis/core/custody.py`; `HC` is `src/data/historical/contracts.py`, `EQ` is `src/data/historical/equivalence.py`, `MF` is `src/data/historical/manifest.py`, `IM` is `src/data/historical/importer.py`; the backup tool is `deploy/offbox_backup.py`, read with `git show 445eb116:deploy/offbox_backup.py` (it is not in the session's `src/` snapshot). Every hex value below was computed on 2026-11-03 by running legacy's own code on the synthetic inputs shown: its hasher and bundle functions, and its `CustodyLedger` driven through the scripted chain with `uuid` and `datetime` scripted (Windows shims only: `fcntl.flock` a no-op in one process, directory `fsync` skipped, `os.register_at_fork` stubbed, `IM`'s `ZoneInfo` replaced by the fixed +05:30 offset). No production record was read. **Found while recomputing:** on Windows, legacy's `os.open` writes of `events.ndjson` (`custody.py:1171`, `:1454`) are text mode and turn every `\n` into `\r\n` (3,931 bytes instead of 3,926); normalized to `\n`, the bytes equal the Linux values below.

**In plain words.** This step rebuilds the record that says which market days research has looked at, and the "exam" days that may be read only once. It is a chain of entries, each sealed by a fingerprint of the one before, with a second file that remembers where the chain ends. The fingerprints are computed exactly as the old system computes them, so the chain already on the server can be read and continued as it is. Every rule about the exam days is the old system's: declare them before use, reserve them, read them once, mark them used. A crash in the middle never makes them fresh again. The step also adds two things the old system lacked. Each time exam days are spent, research asks the trading kernel to note it, so a restore of old research files alone cannot hide the spend. And after a restore, a check compares the restored chain with the current one and with that note. As in the old system, research may start when they agree or when the restored chain is longer; an older or conflicting copy refuses. Nothing here can place, block or change a trade.

### Decisions

#### The legacy hasher and the evidence scope (`research/bundles.py`)

* **One hasher, ported byte for byte** (`src/_canonical.py:10-23`): `legacy_digest(value) -> str` is `sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str).encode("utf-8")).hexdigest()`; `json_form(value)` is `json.loads(json.dumps(value, ensure_ascii=False, default=str))`; `require_sha256_digest(value, name)` as legacy. Also ported: `canonical_bytes` (no `default=str`, `HC:44-49`) and `canonical_digest(v) = "sha256:" + legacy_digest(v)` (`HC:52-53`). Consequences kept on purpose: integer keys sort as integers before conversion (`{5,15,30}` hashes differently from its `json_form`), a `date` or `Path` hashes as its `str`, `NaN` and `Infinity` are written. Event *bytes* on disk still use legacy's `_json_bytes` (`allow_nan=False`, no `default=str`, `custody.py:99-104`), so a non-finite value can be hashed but never stored.
* **Placement (Deviation).** The hasher and `EvidenceScope` live in `research/bundles.py`, which imports only the standard library; `research/custody.py` imports them and re-exports `legacy_digest` and `json_form`, so `research.custody.legacy_digest` stays the name every later module imports (spec). The other order would be a circular import, because custody validates scopes.
* **`EvidenceScope`** (`HC:56-116`), unchanged: `calendar` and `underlying` stripped and upper-cased, `day` a canonical ISO date, `scope_id = canonical_digest({"schema": "EvidenceScope/v1", calendar, day, underlying})`, `from_dict` refusing a mismatched `scope_id`. `derive_evidence_scopes(calendar, sessions, instruments)` crosses every session date with every underlying, sorted (`EQ:27-53`). **Fork call** (slice Fork call 4): any source, copy or alias of a day and underlying is one scope.

#### Bundles (`research/bundles.py`)

* **Ported unchanged:** `HistoricalSourceSpec` with its validation and credential-field refusal (`HC:177-195`, `:198-388`); `MarketEvidenceBundle` with `bundle_id = canonical_digest(identity_body())`, timestamps outside the identity (`HC:391-481`); `semantic_validation_identity`, `build_scope_sidecar`, `validate_scope_sidecar` (`EQ:56-104`); `verify_bundle`, the inventory and normalized-row checks and `load_evidence_scopes` (`MF:30-237`). `scopes(bundle_path)` is legacy's `evidence_scopes_for_bundle` (`custody.py:167-181`).
* **`publish(spec, rows, store_root, *, acquired_by, acquired_at, created_at) -> MarketEvidenceBundle`**, legacy's import tail (`IM:757-841`) over rows that are already canonical schema-2 rows:
  1. `_validate_order(rows, spec)` (`IM:130-163`); at least one row, else `BundleRefused("no_rows")`.
  2. Normalized objects written as `IM:530-559` (one `normalized/<stream>.ndjson` per stream, `canonical_bytes(row) + "\n"`, legacy's sort key); `sessions`, `instruments`, `coverage` as `IM:452-527`; `calendar_digest = canonical_digest({"calendar": spec.trading_calendar, "timezone": spec.timezone})`; `contract_regime_digest = canonical_digest(spec.contract_regime_mapping)`; `normalizer_identity = {adapter, code_digest, config_digest, "canonical_market_schema": 2, "evidence_scopes": "EvidenceScopes/v1"}`; `raw_objects = ()`, `raw_retention = "provider_identity_only"`.
  3. Scope sidecar, `source-spec.json` and `manifest.json` written into `store_root/staging/<new_id()>/bundle`, verified, then `os.rename` to `store_root/bundles/<bundle_id>`. An existing destination is verified and returned (`IM:817-835`).
* **No license check (Fork call 23, review R-2).** Legacy publishes any `license_classification` (`IM:644-841` reads none), and the licence decision is the owner's, deferred (standing rules). The spec's Bundles bullet and Policy inputs say the same.
* **Timezones (Deviation).** `_sessions` resolves `"Asia/Kolkata"` to `timezone(timedelta(minutes=330))`, as every OA_NEW module does (`market/store.py`, `market/sources.py`), because the target ships no `tzdata`; any other name goes to `ZoneInfo` and refuses where it is missing. India has had no daylight saving since 1945, so every session date equals legacy's.
* **Not ported in step 1:** the adapter registry, raw inputs, the resume journal, quarantine and the maintenance lock (`IM:631-849`); the option-contract checks (`IM:228-450`), which belong with step 3's mapping from market-store rows; `EvidencePartition` and `HistoricalLockAttestation` (`HC:484-730`), which step 3's trials need. Read-only sealing (`IM:577-584`) is applied on POSIX only, as `cognition/records.py` limits its POSIX calls.

#### The chain and the anchor (`research/custody.py`)

* **`CustodyLedger(root, anchor, *, authority_root=None, witness=None, clock=None, new_id=None)`.** `authority_root` defaults to `str(root)` and every anchor read is checked against it, as legacy's `_authority_root` (`custody.py:187-206`, `:310-314`, `:596-611`). **Deviation (review R-1): the anchor that genesis creates records `authority_root`;** legacy's records `str(self.root)` (`custody.py:336`). Verified by running legacy: with its defaults the two are the same string and the anchor bytes are identical; with a non-default `_authority_root`, legacy's freshly created anchor fails its own next check ("configured custody root changed; the existing authority remains active"), so legacy never produced a usable anchor that way. `clock` defaults to `datetime.now(timezone.utc)` and `new_id` to `uuid.uuid4().hex`; every `recorded_at` is `clock().isoformat()` and every event ID, reservation ID, claim ID and `authority_id` is `new_id()`, in legacy's call order. **Deviation:** legacy had no injection; the defaults are its values. The anchor path is required (legacy derived a sibling path when absent).
* **Ported unchanged:** the constants and event kinds (`custody.py:24-36`), `safe_custody_path` (`:49-93`), `_refs` (`:135-152`), genesis and anchor creation on a pristine authority (`:286-363`, `:1162-1181`; the anchor's `root` excepted, above), `_probe_authority` and `authority_status` (`:1091-1160`), `_read_locked` with the one-event roll-forward (`:1183-1256`), `_validate_event` for every kind including legacy kinds and `global_ineligible` (`:1264-1435`), `_append_locked` and `_write_tail_locked` (`:1437-1509`), `events`, `checkpoint`, `inspect_checkpoint` (`:1511-1568`). **Fork call** (slice Fork call 1): the format, every check and every message are legacy's, so the deployed chain reads without conversion.
* **Portability (Deviation, no behaviour change on Linux).** Locks use `fcntl.flock` on POSIX and `msvcrt.locking` on Windows, as `cognition/records.py:130-153`; directory `fsync` and `O_DIRECTORY` only on POSIX; every `os.open` that writes `events.ndjson` adds `getattr(os, "O_BINARY", 0)`, so Windows writes legacy's `\n` bytes (legacy's code writes `\r\n` there, above); `checkpoint`'s file signature drops `st_ctime_ns` on Windows (creation time there).
* **Not ported:** `configured()` (`:237-267`; SLICE-11 passes the paths) and the old-anchor redirect migration (`:568-1086`: `migrate_legacy_authority`, its rollback, `legacy_migration_needed`, `_require_legacy_migration_complete`). The target never configures the old anchor location; SLICE-13's import supplies a v2 anchor. **Deviation**, migration plumbing only.

#### Operations and states

* **Ported unchanged, with their messages** (**Fork calls**, slice Fork calls 1, 2 and 21): `assert_declaration`, `declare`, `assert_ordinary`, `expose_ordinary`, `reserve`, `reservation`, `claim_read` with the process-local capability (`:96`, `:1874-1876`), `assert_claimed`, `consume` (claim ID, no capability), `assert_reserved`, `state`, `scopes_for_partitions`, `partition_state` (`custody.py:1633-2066`), and `_matches` with its day-wildcard rule (`:1587-1593`). A recorded claim with no consumption is never claimable again; no completion path is added.
* **`migrate_legacy(trial_root)`** (`:2068-2514`), ported unchanged: the once-only import of `locked-oos/`, `locked-oos-access/` and trial records, idempotent by `migration_source`, ending in one `migration_checkpoint` per source digest.

#### The witness client

* **The port.** `class CustodyWitness(Protocol)` with `witness(authority_id: str, sequence: int, event_hash: str, kind: str) -> None` and `latest(authority_id: str) -> int | None`, the highest witnessed sequence for that `authority_id` (`None`: none yet). `Witnessed(authority_id, sequence, event_hash)`, frozen. **The latest witness of a chain is the `Witnessed` with the highest `sequence` for its `authority_id`** (review R-3); step 6's kernel fold keeps exactly that, and it is what `reconcile` receives. Step 6 implements the port over `CUSTODY_WITNESSED`; here a test fake.
* **Never waits (review R-4).** The ledger never calls the port itself. `WitnessClient(port)` owns one daemon thread and an unbounded `queue.SimpleQueue`; `submit(authority_id, sequence, event_hash, kind)` is `put_nowait` and returns at once. The thread, per job in FIFO order: if `acked` has no entry for the `authority_id`, it sets one from `port.latest(...)` (`None` or an exception: 0); if `sequence > acked[authority_id]`, it calls `port.witness(...)` and on return sets `acked[authority_id] = sequence`. Any exception adds 1 to `client.errors` and the job is dropped; nothing retries, because the next submission covers it (the chain is a prefix). `drain(timeout) -> bool` waits until the queue is empty and the thread idle (tests and orderly shutdown only; no custody operation calls it). A slow or hung port therefore delays only later witnesses, never a custody operation.
* **What is submitted.** (1) `CustodyLedger.open(root, anchor, **kw)`, the constructor every production caller uses, reads the verified tail once (`checkpoint()`; a pristine authority submits nothing) and submits it: so a spend left unwitnessed by a crash is witnessed at the next open. (2) Inside `reserve`, after `_read_locked` and before its append, the tail it read is submitted (once per `reserve`, catch-up before a new spend). (3) After a `reservation`, `read_claimed` or `consumption` commits, that event. Submission happens while the chain lock is held, so jobs follow chain order; a job at or below `acked` is skipped by the thread. Declarations, exposures and `migrate_legacy`'s events are witnessed only as a tail. **Deviation 9** of the slice.
* **Step 6 carries this forward:** the kernel's `CUSTODY_WITNESSED` write never delays admission. It is a non-trading event that admission neither reads nor waits for, and a witness that cannot commit is a refusal to the research client, never a hold on the writer's trading work.

#### Restore reconciliation and adoption

* **`reconcile(current_root, current_anchor, restored_root, restored_anchor, *, authority_root, witness) -> Reconciliation(status, reason, may_start, authority_id, current_events, restored_events)`**, pure (writes nothing), `witness` the latest `Witnessed` for the authoritative chain's `authority_id` (or `None`), legacy's order (`deploy/offbox_backup.py:406-542`) with the witness checks added. The first rule that applies wins:

  | # | Condition | Status |
  |---|---|---|
  | 1 | An unsafe path, or either authority `corrupt` | `invalid` (legacy, `:478-488`) |
  | 2 | Neither initialized, no witness | `not_initialized` |
  | 3 | Neither initialized, a witness exists | `missing` (**Deviation:** the ledger says custody existed) |
  | 4 | Current initialized, restored not | `missing` |
  | 5 | Either checkpoint raises | `invalid` |
  | 6 | Witness `authority_id` differs from the restored chain's, or the restored event at the witnessed sequence has another `event_hash` | `conflict` |
  | 7 | Witness sequence beyond the restored chain | `stale` |
  | 8 | Current not initialized (rules 6–7 passed) | `restored_only` |
  | 9 | Another `root` or `authority_id`, or an `event_id` or `event_hash` differs at a shared sequence | `conflict` |
  | 10 | Restored shorter than current | `stale` |
  | 11 | Equal length | `current` |
  | 12 | Restored longer | `additive` |

  `may_start` is true for `not_initialized`, `restored_only`, `current` and `additive`. **Fork call (review R-2):** legacy's `ok` is kept for every status: `invalid`, `missing`, `conflict` and `stale` refuse (`ok: false`); `additive` is `ok: true` and research continues on the current chain, nothing merged (`deploy/offbox_backup.py:537-542`). This is Fork call 22; slice Deviation 10 is withdrawn and the spec's restore table says the same. SLICE-11's restore calls `reconcile` and starts research only when `may_start`.
* **Spec improvements listed, not made (for the owner),** in the slice's spec-only list: a license check at bundle publication (Fork call 23); refusing research on `additive` until the owner adopts, because continuing on the shorter chain could let exam days the longer chain already spent be reserved and read a second time (Fork call 22).
* **`adopt(current_root, current_anchor, restored_root, restored_anchor, *, authority_root, witness, actor, reason) -> Reconciliation`** is the library half of an owner's adoption, kept so the owner can take the longer chain when they choose; nothing requires it. Authenticating the owner is SLICE-10's command. It proceeds when `reconcile` is `additive`, or when resuming an interrupted adoption: the current `events.ndjson` already equals the restored one byte for byte, the restored checkpoint verifies, and the restored chain contains the witness. Otherwise `CustodyError("adoption refused: <status>")`. Holding the anchor lock and then the chain lock, it copies the restored chain to a temporary in the current root, fsyncs it and replaces `events.ndjson`; then it replaces the anchor with the restored anchor's value. It appends `{"schema": "CustodyAdoption/v1", authority_id, actor, reason, from_sequence, to_sequence, tail, recorded_at}` to `adoptions.ndjson` beside the anchor, and returns `reconcile(...)`, which must be `current`. A crash between the two replaces leaves the current authority `invalid` (research refuses), and running `adopt` again finishes it. If research has written to the current chain since the restore, the restored chain no longer extends it, `reconcile` is `conflict` and `adopt` refuses.

### Tests

Every value is synthetic. `S1 = EvidenceScope(" nse", "2026-11-04", "nifty ")`, `S2 = EvidenceScope("NSE", "2026-11-05", "NIFTY")`, `S3 = EvidenceScope("NSE", "2026-11-04", "BANKNIFTY")`, `P = "sha256:" + "a"*64`, `FROZEN = {"candidate_digest": "sha256:" + "c"*64}`, `AUTH = "/srv/at/research-custody"`. **The scripted chain:** a ledger with `authority_root=AUTH`, `clock` giving `2026-11-04T03:30:00+00:00`, `03:31`, `03:32`, `03:33`, `03:34` in turn, and `new_id` giving `"1"*32, "8"*32, "2"*32, "4"*32, "3"*32, "6"*32, "5"*32, "7"*32` in turn; then `declare([S1], role="locked_oos", partition_id=P, actor="owner", reason="synthetic")`, `reserve([S1], FROZEN, "research", "search-1")`, `claim_read("4"*32, [S1], frozen_identity=FROZEN, actor="research", search_id="search-1", trial_id="trial-1")`, `consume("4"*32, claim_id="6"*32, trial_id="trial-1", search_id="search-1", frozen_identity=FROZEN)`.

**`tests/unit/test_custody_ledger.py` (T-80), PRF-RES-01 and PRF-RES-08's identity rows:**

| Group | Cases |
|---|---|
| Hasher | `legacy_digest({"b": 1, "a": "é"})` = `aa58fba8483623bed37c1b02edfccbdd9a53123837c20bfa4cb4049993a2872e` (text `{"a":"é","b":1}`). `{5: "x", 15: "y", 30: "z"}` → `27aab6af3d58cc79aae01e306ea84b5c2230a7983dc4beb5720c7fa665d765d5` (text `{"5":"x","15":"y","30":"z"}`); its `json_form` → `df5dbd4defc0138d099acd135e1c63dc49cf6a2df8699aeccd7da0b91c18099c` (text `{"15":"y","30":"z","5":"x"}`). `{"d": date(2026, 11, 4)}` → `97e34b848d5d89ce5689ea7146edf7dbe09717c39418bdcde1bb0a12b6f445e5`. `{"p": PurePosixPath("/srv/at/research")}` → `71d5fe73695ff6610cb03efd546374cdb99fe25fc70dda201a5a1410f741f35c`. `{"x": nan}` → `c238cb6e9ac5407491b0988102620ab9445290d2ed7713c516a2b28bd2388968` (text `{"x":NaN}`). `{"x": inf, "y": -inf}` → `19937f3ed0ef33e7e5e8f746b5633a7879d77b6efad363ddf57c05ab22f6a367`. `{"t": (1, 2)}` and `{"t": [1, 2]}` → both `ffe123b7f9907d93f3878dc605913bd7b83eed2938122e84abff011238e727d8`. The kernel's `digest` (`kernel/ledger/envelope.py:49-56`) raises `NotJsonData` on the integer-key, `date` and `nan` inputs (two different functions) |
| Scopes | `S1.to_dict()` = `{"schema": "EvidenceScope/v1", "calendar": "NSE", "day": "2026-11-04", "underlying": "NIFTY", "scope_id": "sha256:fd12ca7e5644aa0e1d8e5c08d8a24efd71d5c8b26b499d51405991c29084fa15"}`; `S2.scope_id` = `sha256:e8d46b6a6c109289f0b1740c99fc3ff78c7293022d607fbe7b05c3210fd507e8`; `S3.scope_id` = `sha256:fad9ce25eb1b3986af777fb58dcb41cb3cd35f1613779749ca15a50dc5de1051`. Day `"2026-11-4"` and an empty underlying refuse; `from_dict` with the last hex digit of `scope_id` changed refuses |
| Scripted chain | Event hashes: genesis `1028ae8ece117eee6bd75def0aa8b32cd339631eee6378a5dc574b3c4be2b3d6`, declaration `3b63f411611c0ccc30a165ee96cf8cb641eaa800717b0d1af1aef611da175de9`, reservation `9111d07c355ec5296cba6c169a956f90f661b6be83cbee69023597f2a52a6854`, read_claimed `92d819876c13f1bb237ead6df78cd6d8a8371aa372e7c9f8241812028c920fe2`, consumption `452fc69e1bfa6ab8b539f5a075b271ec5d1a6546417d8ad3e92b624e3bee284b`. The first line of `events.ndjson` is exactly `{"event_hash":"1028…b3d6","event_id":"111…111","kind":"genesis","previous_hash":"","recorded_at":"2026-11-04T03:30:00+00:00","schema":"HistoricalCustodyEvent/v1","sequence":1}` (full values). The file is 3,926 bytes with SHA-256 `f685ff786420bc970e3e1bb3b8b1ec267512bb7a2eb63a708c36a78e3aa55ed5` on every platform (no `\r`). The anchor file is `{"authority_id":"888…888","root":AUTH,"schema":"HistoricalCustodyAuthority/v2","tail":{"event_hash":"452f…284b","event_id":"777…777","sequence":5}}` and a newline, SHA-256 `6f80acca22cb5772bded3c020ed7cd9ccfe8417c019d54bf1be78355dbee7a8b` (legacy's `_json_bytes` over that value; the R-1 Deviation case). **Defaults:** the same script with `authority_root` omitted gives the same five event hashes and chain bytes, and anchor bytes equal to legacy's `_json_bytes` of the same value with `root` = `str(root)` of the test's own directory, plus a newline (legacy's run in a scratch directory gave exactly that) |
| Golden | Every hasher, custody and bundle entry of `tests/fixtures/research/legacy_identity_445eb116.json` (T-86, written by TASK-S12-09 before this step; its entry format is that task's) recomputes equal |
| States | Along the scripted chain, `state(S1.scope_id)` is `ineligible`, `unopened`, `reserved`, `reserved`, `consumed` (before the declaration, then after each operation); `partition_state(P)` is `ineligible`, `unopened`, `reserved`, `reserved`, `consumed`. After `expose_ordinary([S2], actor="a", search_id="s", source="x")`, `state(S2.scope_id)` is `consumed` (legacy: exposed is spent) |
| One use | After the scripted chain: a second `claim_read` → "reservation already has its one-time read claim" (also before consumption, on a chain stopped after the claim); a second `consume` → "reservation is already consumed"; `reserve([S1], FROZEN, "research", "search-2")` → "locked scope is already reserved, consumed, or ineligible"; `reserve([{"day": "2026-11-04"}], FROZEN, "research", "search-2")` → "locked reservation refs are not all covered by locked_oos declarations: 2026-11-04" (a day-only reference needs a day-only declaration). On a fresh chain up to the reservation: `claim_read` with `search_id="search-2"` → "read claim search_id does not match reservation"; with `actor="other"` → "read claim actor does not match reservation"; with another `FROZEN` digest → "read claim frozen identity does not match reservation"; with `[S1, S3]` → "read claim scopes must exactly equal the complete reservation". `consume` with `trial_id="trial-2"` → "consumption does not match its reservation and read claim"; `consume` with no claim recorded → "consumption has no unique matching read claim". `assert_claimed({"claim_id": "6"*32}, …)` without the returned capability → "read claim capability is missing or belongs to another process" |
| Source neutrality | `S1` rebuilt from another bundle's manifest (Bundles group, below) has the same `scope_id` and `reserve` over it refuses after the chain. Before any reservation: `expose_ordinary([{"day": "2026-11-04"}], …)` → "ordinary access overlaps locked_oos custody" (day wildcard); `declare([S2], role="locked_oos", partition_id="sha256:" + "b"*64)` after `expose_ordinary([S2], …)` → "locked_oos scope overlaps prior ordinary exposure"; after `declare([S3], role="development", partition_id="sha256:" + "d"*64)`, a `locked_oos` declaration of `S3` refuses the same way |
| Damage | Each damage makes `declare`, `reserve` and `events` raise `CustodyError` with the message given: the last newline removed → "custody chain has a truncated final event"; lines 3 and 4 swapped → "custody chain event 3 conflicts with its history"; line 4's `actor` changed and its `event_hash` recomputed → "custody chain event 5 conflicts with its history"; a sixth valid event appended by hand without `pending` → "custody chain does not match its trusted tail"; the anchor's `root` changed → "configured custody root changed; the existing authority remains active"; a second `genesis` line → "custody chain contains a second genesis event" |
| Pending (in process) | `_write_tail_locked` patched to raise `OSError` on its non-pending call during `reserve`: the call raises `CustodyError`; the anchor holds `pending` = the reservation's tail; `events()` returns 3 events and leaves the anchor bytes unchanged; the next `expose_ordinary([S2], …)` succeeds and the anchor's tail is then sequence 4 with no `pending` |
| Witness | A recording fake whose `latest` returns `None`: the scripted chain, then `client.drain(10)`; `witness` calls are exactly `[("8"*32, 2, "3b63…5de9", "declaration"), ("8"*32, 3, "9111…6854", "reservation"), ("8"*32, 4, "92d8…0fe2", "read_claimed"), ("8"*32, 5, "452f…284b", "consumption")]` (the first is `reserve`'s catch-up of the tail) and `latest` was called once. **Open:** `CustodyLedger.open` on that chain with a fake whose `latest` returns 5 makes no `witness` call; returning 4, exactly one, `("8"*32, 5, "452f…284b", "consumption")`; `latest` raising, the same single call (one job, the tail) and `client.errors == 1`. **Raising:** a fake whose `witness` raises `RuntimeError`: the scripted chain gives the same event hashes, and after `drain`, `client.errors == 4`. **Never waits (R-4):** a fake whose `witness` sleeps 5 s: each of `reserve`, `claim_read` and `consume` returns within 0.5 s (`time.monotonic`), and `drain(30)` then shows all four calls |
| Legacy import | A synthetic trial root: `locked-oos/p1.json` `{"kind": "locked_oos_declaration", "dates": ["2026-11-04"], "declared_by": "owner"}`; `locked-oos-access/a1.json` `{"id": "acc-1", "trial_id": "t-exam", "status": "consumed", "partition_ids": [P0], "dates": ["2026-11-04"], "actor": "research", "search_id": "s-1"}`; `t-dev.json` `{"id": "t-dev", "extensions": {"dates": ["2026-11-03"]}, "data_roles": {}}`; `t-exam.json` `{"id": "t-exam", "extensions": {"partition_ids": [P0]}, "data_roles": {P0: "locked_oos"}}`, with `P0 = "sha256:b050ae7958a90ec5910b4ac66d4b14f1448231ab1d9d7e3de6659bb31270a122"` (legacy's prospective ID for `["2026-11-04"]`). On a fresh ledger `migrate_legacy` appends, after genesis, exactly `legacy_declaration` (partition `P0`, `legacy_days ["2026-11-04"]`), `legacy_reservation` (reservation `"legacy:t-exam"`, `frozen_identity {"legacy_trial_id": "t-exam"}`), `legacy_consumption`, `legacy_ordinary` (`legacy_days ["2026-11-03"]`, trial `t-dev`), `migration_seen`, `migration_checkpoint`. `partition_state(P0)` is `consumed`; `expose_ordinary([S1], actor="a", search_id="s", source="x")` → "ordinary access overlaps locked_oos custody" (an exact scope matches a day-only declaration); a second `migrate_legacy` appends nothing |
| Bundles | `SPEC`: source `market_store`, dataset `nifty_index_bars`, provider version `slice-08`, acquisition `research_view`, license `synthetic`, retention `research`, timezone `Asia/Kolkata`, calendar `NSE`, event, arrival and sequence fields `ts`, `arrived`, `seq`, bar close `bar_end`, sequence scope `session`, tie-breaking `arrival_then_seq`, `schema_mapping` `{"stream": "stream", "session_id": "session", "event_time": "ts", "arrival_time": "arrived", "sequence": "seq", "instrument": "inst", "close": "c"}`, `instrument_mapping` `{}`, `contract_regime_mapping` `{}`, `direct_fields` `("close",)`, `reconstructed_fields` `()`, `unsupported_fields` `()`, `zero_semantics` `{}`, adapter `market_store_view`, code digest `sha256:` + `d`×64, config digest `sha256:` + `e`×64, `quality_mapping` `{}`, `offbox_backup_decision` `"unspecified"`, `extensions` `{}` (the last three are legacy's dataclass defaults, `HC:227-229`, passed explicitly; the hashes below were recomputed with every field explicit). `ROW`: `{"schema": 2, "stream": "index_bar", "session_id": "NSE-2026-11-04", "instrument": "NIFTY", "seq": 0, "event_time": "2026-11-04T09:15:00+05:30", "arrival_time": "2026-11-04T09:16:00+05:30", "d": {"close": 24000.0}, "quality": {"fields": {"close": {"state": "observed"}}}}`. `SPEC.source_spec_id` = `sha256:e22ee6b5ccbeee3927b08ac11ff26471b88e2f37e9220ae1c82826592ca51750`. `publish(SPEC, [ROW], root, acquired_by="research", acquired_at="2026-11-04T10:00:00+00:00", created_at="2026-11-04T10:00:00+00:00")`: the normalized object is `{"path": "normalized/index_bar.ndjson", "size": 251, "rows": 1, "sha256": "sha256:d6710d906cc9f3cb924436bf45aab25755651a31706b60c9b311af9a868f082c", "stream": "index_bar"}`; `bundle_id` = `sha256:594be8c7b2e0df5f23b7fd1c5d5f6098d772c5f113bf52e1fd6d37f6d2d84779`; `calendar_digest` = `sha256:1779ec959e5ea5e301f8dcb198674029fd1d6ffacf9a272558c4e48c8935a345`; `contract_regime_digest` = `sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`; semantic identity `sha256:5b2de2f7eb791235d5af219d9cfa9fa91abc3ebaf3229329baa2fa11a9bb257a`; sidecar ID `sha256:15bba547d697b47c2d60f63dde35f764c688a313a4cf7cdd53fae420b8e7364e`; one session `{session_id: "NSE-2026-11-04", date: "2026-11-04", event_start = event_end = "2026-11-04T09:15:00+05:30", sequence_min = sequence_max = 0, rows: 1}`; `scopes(...)` = `(S1,)`. Published again with `acquired_at` `2026-11-05T10:00:00+00:00`: the same `bundle_id`, the existing directory returned. `SPEC` with `license_classification="unlicensed-x"` publishes (no license check, Fork call). A row at `2026-11-04T00:10:00+05:30` gives session date `2026-11-04`. One byte of the normalized file changed (made writable first on POSIX) → `verify_bundle` raises "bundle object digest changed: normalized/index_bar.ndjson". `instrument_mapping={"api_key": "x"}` → "source specification may not contain credential field api_key" |

**`tests/recovery/test_restore_fencing.py`, PRF-RES-03 (custody part)**, added to the existing file. Chains are built in `tmp_path` with the scripted chain's clock and IDs; `FULL` is the scripted chain (5 events), `PRE3` a copy of both files taken after the reservation (3 events). `W4 = Witnessed("8"*32, 4, "92d8…0fe2")`. A "copy" copies `events.ndjson` and the anchor file into a fresh root and anchor directory.

| Case | Current | Restored | Witness | Status, `may_start` |
|---|---|---|---|---|
| R1 | pristine | pristine | none | `not_initialized`, true |
| R2 | pristine | pristine | `W4` | `missing`, false |
| R3 | `FULL` | pristine | `W4` | `missing`, false |
| R4 | pristine | `FULL` | none | `restored_only`, true |
| R5 | pristine | `FULL` | `W4` | `restored_only`, true |
| R6 | pristine | `PRE3` | `W4` | `stale`, false (a clean host gets no fresh start) |
| R7 | pristine | `FULL` | `W4` with `event_hash` `"0"*64` | `conflict`, false |
| R8 | `FULL` | `FULL` | `W4` | `current`, true |
| R9 | `PRE3` | `PRE3` | `W4` | `stale`, false |
| R10 | `FULL` | `PRE3` | none | `stale`, false; afterwards, on `FULL`, `reserve([S1], FROZEN, "research", "search-2")` still refuses "locked scope is already reserved, consumed, or ineligible" |
| R11 | `PRE3` | `FULL` | none | `additive`, true (legacy `ok: true`); research continues on `PRE3`, where `claim_read("4"*32, [S1], …)` still succeeds: the second read the listed improvement would stop |
| R12 | `FULL` | the scripted chain built with `new_id`'s second value `"9"*32` | none | `conflict`, false |
| R13 | `FULL` | the scripted chain with reservation ID `"0"*32` in place of `"4"*32` (and in the claim and consumption that name it) | none | `conflict`, false (event 3 differs) |
| R14 | `FULL` | `FULL` with the anchor truncated to `{}` | none | `invalid`, false |

**Adoption:** from R11, `adopt(..., witness=None, actor="owner", reason="synthetic")` returns `current`, `may_start` true; the current `events.ndjson` then hashes to `f685…55ed`; `adoptions.ndjson` holds one line with `from_sequence` 3, `to_sequence` 5 and the consumption's tail. From R10 (`stale`), R12 (`conflict`) and R14 (`invalid`), `adopt` raises "adoption refused: …" and changes no current file (md5). From R11 with the restored chain's line 5 altered: refused. From R11 with `W4` replaced by `Witnessed("8"*32, 6, "0"*64)`: refused (`stale`). From R11 after a `claim_read` on the current `PRE3`: refused (`conflict`). **Interrupted:** `os.replace` patched to raise `OSError` on its second call: `adopt` raises, `reconcile` then reports `invalid`, and a second `adopt` returns `current`.

**`tests/recovery/test_crash_boundaries.py`, CP-R1 (PRF-RES-02 row), by killing a real process.** `_cp_r1_child(base)` builds the scripted chain's ledger under `base` up to the declaration, patches `CustodyLedger._write_tail_locked` so that a call with `pending=False` for sequence 3 runs `os._exit(86)`, then calls `reserve([S1], FROZEN, "research", "search-1")`; reaching the next line exits 1. The `__main__` gains `if sys.argv[2] == "CP-R1": _cp_r1_child(sys.argv[1])`. The parent asserts exit 86; the anchor's `tail` is sequence 2 and its `pending` is `{"sequence": 3, "event_hash": "9111…6854", "event_id": "333…333"}`; a fresh ledger's `events()` returns 3 events, `checkpoint()["tail"]["sequence"] == 3`, and the anchor bytes are unchanged; `claim_read("4"*32, …)` then succeeds and the anchor's tail is sequence 4 with no `pending`.

**Same file, the unwitnessed spend (review R-3; client side of CP-R12).** `_cp_rw_child(base)` builds the scripted chain with a `WitnessClient` over a fake that appends each call as a JSON line to `<base>/witness.log`, and patches `WitnessClient.submit` so that a job whose kind is `consumption` runs `os._exit(86)` before queueing (the event is committed, the witness never called). Before `consume`, it calls `drain(10)`. The `__main__` gains `if sys.argv[2] == "CP-RW": _cp_rw_child(sys.argv[1])`. The parent asserts exit 86, that `events.ndjson` holds 5 events with the consumption's hash `452f…284b`, and that `witness.log` ends at sequence 4. It then calls `CustodyLedger.open(root, anchor, authority_root=AUTH, witness=client)` with a fake whose `latest("8"*32)` returns 4 (the log's last line) and `drain(10)`: exactly one `witness` call, `("8"*32, 5, "452f…284b", "consumption")`. A second `open` with `latest` returning 5 makes none.

**Existing tests that change:** none.

### Break checks

The minimum set. Each anchor is checked present exactly once, one mutation at a time, each file restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| `claim_read`: the existing-claim check removed | One use |
| `consume`: the claim match removed | One use (no claim recorded) |
| `_matches`: `or scope.day in dates` removed | Legacy import (exact scope against a day-only declaration) |
| `_matches`: `or wanted in set(scope_days.values())` removed | Source neutrality (day wildcard) |
| `_read_locked`: the `tail == self._tail_of(rows[-2])` condition removed | Damage (unannounced event) |
| `_read_locked`: roll-forward accepted without `pending` | Damage (unannounced event) |
| `legacy_digest` built on `kernel/ledger/envelope.py`'s `canonical` rules (`allow_nan=False`, no `default=str`) | Hasher |
| `legacy_digest` hashes `json_form(value)` | Hasher (integer keys) |
| `reconcile`: `may_start` true for `stale` | R9, R10 |
| `reconcile`: `may_start` false for `additive` | R11 |
| `reconcile`: witness rules 6–7 skipped | R6, R7 |
| A witness exception propagates | Witness (raising fake) |
| `WitnessClient.submit` calls the port in the caller's thread | Witness (never waits) |
| `CustodyLedger.open` submits no tail | Witness (open); CP-RW |
| `reserve`'s tail catch-up removed | Witness (first call is the declaration) |
| `O_BINARY` dropped from the chain writes | Scripted chain (on Windows: 3,931 bytes) |
| `publish` refuses an unlisted license | Bundles (`unlicensed-x` publishes) |
| `_sessions`: the day taken in UTC | Bundles (00:10 row) |
| `adopt`: the status precondition removed | Adoption (R10 refused, files unchanged) |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/research/bundles.py` | New: the hasher, `EvidenceScope`, scope derivation, sidecar, `HistoricalSourceSpec`, `MarketEvidenceBundle`, verification, `publish`, `scopes`, `BundleRefused` |
| `src/autonomous_trading/research/custody.py` | New: `CustodyLedger` (with `open`) and every operation, `migrate_legacy`, `CustodyWitness`, `Witnessed`, `WitnessClient`, `reconcile`, `Reconciliation`, `adopt`; re-exports `legacy_digest` and `json_form` |
| The `research` package's `__init__.py` | New, empty |
| `tests/unit/test_custody_ledger.py` | New (T-80) |
| `tests/recovery/test_restore_fencing.py` | R1–R14 and adoption |
| `tests/recovery/test_crash_boundaries.py` | `_cp_r1_child` and `_cp_rw_child`, their tests and their `__main__` branches |

No setting, schema, event kind, kernel module or migration changes.

### Completion conditions (step 1)

* **Targeted tests only:** `tests/unit/test_custody_ledger.py`, `tests/recovery/test_restore_fencing.py` and `tests/recovery/test_crash_boundaries.py` (whole files: the driver changes), and `tests/contracts/` (its package scans now see `research`), twice in a row on Windows. No case needs Linux.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file. Every hex value in the tests is recomputed from legacy's functions as above.
* `git diff --name-only` names exactly the files above; one commit in OA_NEW; nothing pushed.
* This file records step 1 "as built", with any Fork call or Deviation the build adds.

### Step 1 as built

**In plain words.** The record of which market days research has looked at, and of the one-time exam days, now exists in the new system. It writes exactly the bytes and fingerprints the old system writes, so the chain on the server can be continued as it is. Each spend of exam days is handed to the kernel for a note without ever waiting for it. A restored copy is checked against the current chain and that note before research starts. Nothing here touches trading.

Commit `b8574eb` on `slice-08`, on top of `a4e6fbc` (SLICE-11 step 1). It adds the research package (its `__init__.py`, `research/bundles.py`, `research/custody.py`) and `tests/unit/test_custody_ledger.py`, and extends `tests/recovery/test_restore_fencing.py` and `tests/recovery/test_crash_boundaries.py`: 6 files, 3,691 lines added, none removed. Not pushed.

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Golden fixture | T-86 does not exist yet (TASK-S12-09 has not run). The Golden group skips while the file is absent and compares its `hasher` entries once it exists. Every other value is the hand-computed one above, all equal on the first run |
| `authority_root` | Kept as the string given, not normalized lexically as legacy did (`custody.py:195-196`). On Windows, legacy's normalization turns `/srv/at/research-custody` into a drive path. For a normalized absolute POSIX path the two are the same string. **Deviation** |
| Bundle directory name | `bundles/<bundle_id>` on POSIX, as legacy. On Windows the `:` of `sha256:` is written as `_`, because Windows forbids it in a name. `verify_bundle` checks the name the platform writes. **Deviation**, Windows only |
| `publish` refusals | No rows gives `BundleRefused("no_rows")`. A contract error raised while building is re-raised as `BundleRefused`, and its staging directory is removed. Legacy quarantined it instead (`IM:587-602`, not ported) |
| Witness client | `acked` is kept per `authority_id` for the client's life; `latest` is called once per authority per client. The thread is a daemon started at the first submission |
| An added damage case | Removing `tail == self._tail_of(rows[-2])` from `_read_locked` failed no listed test. The Damage group gained a case: the anchor's `pending` names the last event, but its `tail` is two events behind. That case refuses with "custody chain does not match its trusted tail" |
| Break checks | 19, the listed set plus a second `_matches` row; each fails a listed test, and every file is restored (md5). Script: `s12a_breaks.py` in the session scratchpad |

**Tests run (Windows, targeted only):** `tests/unit/test_custody_ledger.py`, `tests/recovery/test_restore_fencing.py`, `tests/recovery/test_crash_boundaries.py` and `tests/contracts/`. Result: 243 passed, 1 skipped (Golden). The last two runs, after the final test edit, were clean in a row. CP-R1 and CP-RW killed a real child process each (exit 86). `ast.parse` passes on the six files. **Flake seen once:** SLICE-10's `test_stopping_never_touches_the_journal` failed in the first full run (`broker.calls` empty). It passed alone, with its file alone, and in the three full runs after. It is untouched by this step, and it is recorded here for SLICE-10's owner.

## Step 2 — trials and jobs

<a id="step-2--trials-and-jobs-outline"></a>

The authorities are the spec's [Trials and attempts](../../design/research-rl-custody-promotion.md#trials-and-attempts-researchtrialspy) (without the locked-access ledger and disclosures, which are step 3's) and [Jobs and the research-job port](../../design/research-rl-custody-promotion.md#jobs-and-the-research-job-port-researchjobspy), PRF-RES-04, PRF-RES-05, PRF-RES-06 and CP-R8, CP-R9. Step 2 is TASK-S12-02. It builds on step 1 as built (`b8574eb`) and SLICE-11 step 1's participant contract (`a4e6fbc`). Every legacy citation is at 445eb116: `trials.py` is `src/analysis/core/trials.py`; `store.py`, `runner.py`, `worker.py` and `policy.py` are under `src/analysis/jobs/`. Every hex value below was computed on 2026-11-03 by running legacy's own `TrialLedger` and hasher on the synthetic inputs shown, with `uuid` and `time` scripted and step 1's Windows shims (plus the bundle maintenance lock replaced by a no-op, below). Legacy writes trial files in text mode, so on Windows its bytes carry `\r\n`; every length and hash below is of the `\n` form, which is what legacy writes on Linux. No production record was read.

**In plain words.** This step rebuilds the log of research attempts and the queue that runs them. Every attempt is written down before it runs, and it stays counted whether it finished, crashed or was abandoned. An attempt now records which queued job ran it, and a run that was cut short can continue only from a saved point taken under exactly the same settings. Closing an attempt can happen only once: a second close, even one racing the first, is refused instead of overwriting it. A damaged attempt file is reported, not silently skipped. The queue runs one research job at a time. If a worker dies, the slot is freed when its time runs out, and the job and its open attempts are marked as interrupted. Two research workers exist, one without a network and one that may call the AI model, and each checks its own settings and credentials before it takes a job. Nothing here touches trading.

### Decisions

#### The trial ledger (`research/trials.py`)

* **`TrialLedger(directory, custody, *, clock=None, new_id=None)`.** `custody` is a step 1 `CustodyLedger` and is required (**Deviation:** legacy built `CustodyLedger(self.dir)` when none was given, `trials.py:91-96`; step 1's ledger needs an anchor). `clock` returns epoch seconds and defaults to `time.time`; `new_id` returns a trial or row ID and defaults to `uuid.uuid4().hex[:12]`, legacy's values in legacy's call order. `configured()` is not ported; the caller passes the paths (SLICE-11).
* **Ported unchanged, with their messages:** `OUTCOMES`, `DATA_ROLES`, `LAB_ROLE`, `TRIAL_DATA_ROLES`, `SCHEMA_VERSION = 2`, `PARTITION_ROLES`, `PARTITION_ELIGIBILITY`, `LOCK_ACCESS_STATES`, `TrialError`, `is_lab_trial`, the `Trial` dataclass with its field order (`trials.py:26-85`); `_as_mapping`, `_session_dates`; `assert_ordinary`, `expose_ordinary`; `open`'s validation and its ordinary branch (`:311-454`, `:548-572`); `get` with `_recency`, `latest_per_trial`, `count` (`:634-683`); `promotion_lineage` (`:685-729`, **Fork call**, slice Fork call 16); the declaration readers and the prospective declaration: `_prospective_partition_id`, `_declaration_rows`, `_partition_days`, `normalize_partition_declaration`, `partitions`, `partition`, `declare_locked_oos`, `locked_oos_dates`, `locked_oos_evidence` (`:733-801`, `:1129-1219`).
* **`_migrate_custody` is called at exactly legacy's call points** (every method above that calls it, `trials.py:98-102`). Each call runs step 1's `migrate_legacy(self.dir)`, which records each new trial and declaration file once (`migration_seen`, `migration_checkpoint`). The same call points give the same chain as legacy for the same operations. Its `migration_checkpoint` events name the trial root's absolute path, so event hashes after the first checkpoint depend on where the test directory is; tests pin kinds and sequence numbers there, not hashes.
* **Locked opens wait for step 3.** In step 2, `open` with a `locked_oos` role, `partition_ids`, `custody_scopes` or `locked_oos_identity` raises `TrialError("locked_oos trials open through the locked-access ledger (step 3)")`. Step 3 replaces this with legacy's branch (`trials.py:455-547`). An ordinary open over a declared locked day still refuses with legacy's message.
* **The serializer.** `_write_json(path, row)` writes `json.dumps(dict(row), indent=2, default=str)` as UTF-8 with `\n` line ends on every platform. The file is written in binary through `tempfile.mkstemp(prefix=f".{name}.", suffix=".tmp", dir=...)`, fsynced, moved into place with `os.replace`, and the directory fsynced on POSIX (`trials.py:265-288`). **Deviation (portability, no change on Linux):** legacy's text-mode write gives `\r\n` on Windows. The bundle maintenance lock legacy took around every write (`configured_maintenance_lock`, `trials.py:22`, `:265`) is not ported, as step 1 did not port it (**Deviation**).
* **The attempt link (slice Deviation 3).** `AttemptRef(job_id, attempt, lease_generation, receipt_id)`, frozen. `attempt_context(ref)` is a context manager that sets a module `contextvars.ContextVar`; the job child (below) enters it before calling the job. `open(..., attempt=<the context's value>)` writes `extensions["attempt"]` as the first key of `extensions`, before the caller's keys and before legacy's `dates`: `{"job": null}` outside a job, else `{"job": {"job_id", "attempt", "lease_generation", "receipt_id"}}`. A caller-supplied `extensions["attempt"]` refuses: "extensions.attempt is written by the ledger".
* **Inputs.** `open(..., inputs=None)` accepts a mapping of input name to `sha256:` digest (bundles, environment, reward and so on), stored sorted as `extensions["inputs"]` after the caller's keys. A value that is not a canonical digest refuses with legacy's `require_sha256_digest` message.
* **Close once, by a no-replace link (slice Deviation 1, spec "Close once, exclusively").** `close(trial_id, outcome, score=None, note="", extensions=None)` keeps legacy's checks and messages in order (`trials.py:577-593`), including "trial {id!r} is already closed as {outcome!r}; a closing record is never replaced", and builds the same closing `Trial` (`:594-614`), with `decided_at = clock()`. Then, holding `_file_lock(dir / ".trials.lock")` (step 1's lock in `research/custody.py`), it calls `_publish_once(dir / f"{id}.closed.json", record)`. **`_publish_once(path, row)`** is the one no-replace writer, used by `close` here and by step 3's `disclose`: it writes the serializer's bytes to `mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)`, fsyncs it, publishes it with `os.link(temporary, path)`, and in every case then removes the temporary and fsyncs the directory (POSIX). An existing `path` raises `FileExistsError`, which `close` turns into `TrialError(f"trial_already_closed: {id}")`. A crash leaves either no closing file or one complete one; a leftover `.tmp` is never read.
* **Reading the files.** `scan()` reads every `*.json` directly in the directory whose name does not start with a dot, and returns `TrialScan(records, unreadable)`. A file that cannot be read, is not JSON, or is not an object goes to `unreadable` by its file name (**slice Deviation 2**; legacy skipped it, `trials.py:622-632`). A trial's records are its open record (`outcome: running`) and its closing records: `{id}.closed.json`, and legacy's `{id}.{outcome}.json`, which stay readable. More than one closing record is `conflicting_close`, never resolved by `decided_at`: `get` raises `TrialError(f"conflicting_close: {id}")`, and `latest_per_trial` leaves the trial out. `all_records()` keeps its legacy name and returns the readable records, newest first. The readers never call `_migrate_custody`, as legacy's `get`, `latest_per_trial` and `count` do not. **A corrupt file stops the writers, as in legacy:** every method that calls `_migrate_custody` (`open` among them) runs step 1's `migrate_legacy`, which reads every top-level `*.json`, `locked-oos/*.json` and `locked-oos-access/*.json` and raises on one that is not a JSON object ("legacy custody record is corrupt: …" or "legacy custody record is invalid: …", `research/custody.py`); the ledger reports it as `TrialError("historical custody is ineligible: …")` (`trials.py:98-102`). Reading keeps working, so the owner can see the count and the damaged file's name; research writes nothing until the file is removed or repaired.
* **Counting.** `count(dataset=None, *, search_id=None)` returns legacy's keys and values, plus `unreadable` (sorted file names), `conflicting` (sorted trial IDs) and `incomplete` (true when either is non-empty). A conflicting trial counts in `total` and `trials_for_deflation`, because it was attempted, and in no `by_outcome` bucket. A claim built on an incomplete count says so (step 4).
* **Resume (spec "Resume").** `compatibility(trial) -> {"specification_digest", "inputs_digest"}`, where `specification_digest = "sha256:" + legacy_digest({"parameters": …, "code_ref": …, "seed": …})` and `inputs_digest = "sha256:" + legacy_digest({"dataset": …, "inputs": extensions.get("inputs", {})})`, both over the trial's recorded values. `Checkpoint(checkpoint_digest, specification_digest, inputs_digest, state_digest)`, frozen, all four canonical `sha256:` digests; whoever saved the checkpoint computed the first three. `resume(parent_id, checkpoint, *, note="")` refuses, in this order:
  1. the parent is missing or `conflicting_close`;
  2. a parent `data_roles` value is `locked_oos`: "a locked_oos exam is never resumed";
  3. the parent's outcome is not `crashed` or `abandoned`: "resume needs an interrupted parent; {id} is {outcome}";
  4. either digest differs from `compatibility(parent)`: "resume refused: {name} differs; a changed parameter or assumption is a new attempt".

  It then calls `open` with the parent's parameters, dataset, metric, tags, search, kind, data roles, code reference, seed, inputs and five identity fields, `parent_id = parent`, and `extensions={"resume": {"checkpoint_digest", "compatibility": {"specification_digest", "inputs_digest", "state_digest"}}}`. Restarting from scratch is an ordinary `open`.

#### The job store (`research/jobs.py`)

* **Ported unchanged, with their messages:** `DONE`, `INLINE_RESULT_BYTES = 64_000`, `LEASE_SCHEMA_VERSION = 1`, `JOB_SCHEMA_VERSION = 2`; `JobStoreError`, `JobStateError`, `JobLeaseError`; `JobRecord` with every field (`store.py:54-100`); `JobStore`'s `locked` (the lock taken with step 1's `_file_lock` on `.queue.lock`), `path`, `result_path`, `create`, `save`, `mark`, `load`, `result`, `list`, `snapshot`, `active_lease`, the lease validation (without `process_tree` parsing, below), `claim` with the lease written before the row and the attempt receipt (`store.py:424-483`), `reconcile_expired`, `set_process`, `begin_process_tree` (without `containment`), `heartbeat`, `cancel_requested`, `mark_interrupted`, `request_cancel`, `release`, `purge`, `_lease_matches`. Row and lease bytes are legacy's (`json.dumps(..., indent=2, default=str)` and `json.dumps(lease, indent=2)`), written in binary through step 1's `_replace_bytes`.
* **Injection.** `JobStore(root, *, trials=None, clock=None, new_id=None, probe=None)`. `clock` defaults to `time.time`; `new_id` defaults to `uuid.uuid4().hex`, and a job ID is `new_id()[:12]` (legacy, `store.py:168-173`), the owner token and receipt ID the whole value; `trials` is the `TrialLedger` whose running trials expiry closes; `probe` is the process probe below.
* **The process probe (Deviation, portability).** `ProcessProbe.start_id(pid) -> str | None`: on Linux field 22 of `/proc/<pid>/stat` (legacy `_proc_stat`, `store.py:1072-1095`); on Windows the process creation time from `GetProcessTimes` through `ctypes`, as a decimal string, or `None` when the process has exited; elsewhere `None`. `alive(pid, start_id)` is `start_id(pid) == start_id`. `terminate(pid, group)` sends the kill: on POSIX `os.killpg(pid, SIGKILL)` when `group` (the job child leads its own session) and `os.kill(pid, SIGKILL)` otherwise; on Windows `os.kill(pid, signal.SIGTERM)` (TerminateProcess) either way. Expiry signals only through `probe.terminate`, so a test injects a fake probe and no real process is touched. `boot_id()` is legacy's `/proc/sys/kernel/random/boot_id` on Linux and the constant `"non-linux"` elsewhere (a test host; the start ID still catches PID reuse). `pgid` and `session_id` are `os.getpgrp()` and `os.getsid(0)` on POSIX and the PID on Windows.
* **Expiry without the process-tree machinery (Deviation).** Legacy terminated an expired lease's whole process tree through `/proc` walks, a child subreaper, a freeze with `SIGSTOP` and per-attempt cgroups (`store.py:726-925`; `containment.py`; `process_tree.py`). The target keeps legacy's refusals (another host: "expired lease for job {id} belongs to another host; refusing reclaim"; another boot: nothing to terminate; this process: "expired lease for job {id} is owned by this process") and then terminates only the two recorded identities: the job child (`process_pid`, `process_start_id`) and the supervisor (`pid`, `process_start`), each only while `probe.alive` says it is the same process, by `probe.terminate(process_pid, True)` for the child and `probe.terminate(pid, False)` for the supervisor. It then polls every 20 ms for up to `_TERMINATION_WAIT_SECS = 5.0`; an identity still alive raises `JobLeaseError(f"expired lease for job {id} still has a live process")` and the slot stays held. Descendants the job spawned itself are contained by the research unit's slice (SLICE-11, `at.slice`). `release` likewise refuses while the recorded child is alive: "cannot release job {id}: its process is still alive"; the spawn-window refusal is legacy's.
* **Expiry closes the job's running trials (slice Deviation 4).** After the expired job's row is saved `failed` (or `cancelled`) and `interrupted` (legacy, `store.py:507-523`) and before the lease is cleared, every trial whose latest record is `running` and whose `extensions.attempt.job` names this `job_id` and the expired `lease_generation` is closed `crashed` with `extensions={"interrupted": true}`. A `TrialError` from a trial closed meanwhile is ignored. Without `trials`, nothing is closed.
* **CP-R9, corrected against legacy.** A crash after the lease write and before the running row leaves the slot held by a lease naming a `queued` job. At expiry, legacy marks that job `failed` and `interrupted` like any other (`store.py:511-523`). The spec's failure-mode row says "the job stays claimable"; legacy's behaviour is kept and the row is read as: the slot is released, the job is `failed` and `interrupted`, and it runs again only through `retry`.
* **A result is written once (slice Deviation 5).** A result larger than `INLINE_RESULT_BYTES` goes to `{id}.result.json` through a temporary and `os.link`; an existing file raises `JobStateError("result_already_written")`. A second `release` with the same token returns `None` and changes no byte (legacy, the lease no longer matches). Legacy's `import_result_bytes` (a migration helper, `store.py:223-248`) is not ported.
* **Job types.** `JobType(name, target, profile, params, timeout_secs, retry_policy, resumable)`, where `profile` is `offline` or `model` and `retry_policy` is `none` or `same_request`. `JOB_TYPES` ships one type per profile: `research.noop` (offline) and `research.noop_model` (model), both targeting `jobs.noop(sleep_secs=0.0, fail=False, trial_dir="", custody_root="", custody_anchor="")`, timeout 120 s, `same_request`, resumable. `noop` returns `{"ok": true}`; with `fail` it raises `RuntimeError("noop failed")`; with the three paths it opens one trial `({"noop": 1}, "noop", search_id="noop")` through a `CustodyLedger.open` and `TrialLedger` on them; then it sleeps `sleep_secs` (at most 60). It is the liveness job the worker test and the crash tests use. Steps 3, 5 and 7 add their own types. `bind(type, args)` refuses an unknown argument ("unknown argument {name} for {type}") and any value that is not JSON data.

#### Retries, duplicates and the port

* **Retries, ported** (`runner.py:161-182`, `:298-451`): a retry is a new job with `attempt + 1`, `retry_of` and the same `request_identity`, refused unless the job is `failed`, `timeout` or `cancelled`, its type is `same_request` and `resumable`, and it is its chain's tail. Legacy's messages are kept: "retry identity has duplicate attempt numbers", "retry identity does not form one linear attempt chain", "job {id} is not the current retry tail; latest attempt is {tail}". The `import`, `training` and `ordinary_replay` policies are not ported (their jobs are not built).
* **Duplicate delivery.** `submit` takes the store lock and looks for rows of the same job type and `request_identity`. If any exists, it returns the chain's tail, whatever its state, and creates nothing; running the same request again is only `retry`. `request_identity` is required, 1–128 characters of `[A-Za-z0-9_.:-]`, starting alphanumeric.
* **The queue bound.** Before creating, `submit` counts rows not in `DONE`; at or above `research.jobs.max_pending` it refuses with legacy's text: "{n} research jobs are already queued or running (limit {limit}); wait for them to finish" (`runner.py:217-223`).
* **The port** (`README.md:859`). `JobRequest(job_type, args, request_identity)`, `JobRef(job_id)`, `JobStatus(job_id, job_type, state, attempt, request_identity, retry_of, interrupted, has_result)`. `ResearchJobs(store)` implements `submit(JobRequest) -> JobRef`, `cancel(JobRef) -> JobStatus` (legacy `request_cancel`), `observe(JobRef) -> JobStatus` (after `reconcile_expired`), `recover() -> list[JobStatus]` (runs `reconcile_expired` and returns every job that is `queued` or `running`, plus any job this call made terminal), and `retry(JobRef) -> JobRef`. The port runs registered job types in the research participant and grants nothing else.

#### The two workers

* **The participants.** `settings/schema.py` gains two `PARTICIPANTS` rows and six `FIELDS`. The rows: `research-offline` (unit `at-research-job-offline.service`, user `at-research`, no credential scope) and `research-model` (unit `at-research-job-model.service`, user `at-research-model`, credential scope `cognition`, so it may hold the advisor key and nothing else). Both have entrypoint `python -m autonomous_trading.research.jobs`, no groups, launcher names `AT_PROFILE` and `AT_RELEASE`, the six fields as `fields_required`, and storage `required_evidence` and `scratch`. Neither holds the broker key, so both forbid `BROKER_KEY_NAMES` (legacy `policy.py:31-37`, as a contract). The fields, each scoped to both participants and unset in `resources/defaults.yaml`: `research.custody_root`, `research.custody_anchor` and `research.trial_root` (path, `required_evidence`), `research.job_root` (path, `scratch`), `research.jobs.lease_seconds` and `research.jobs.max_pending` (`int_pos`, register `legacy`: 15 and 16 are recorded as evidence, `worker.py:34`, `runner.py:24`). Environment names are `AT_RESEARCH_CUSTODY_ROOT`, `AT_RESEARCH_CUSTODY_ANCHOR`, `AT_RESEARCH_TRIAL_ROOT`, `AT_RESEARCH_JOB_ROOT`, `AT_RESEARCH_JOBS_LEASE_SECONDS` and `AT_RESEARCH_JOBS_MAX_PENDING`. Legacy's unit names and `at-research.slice` were kept, until the owner renamed them apart from legacy's (`at-research-job-offline.service`, `at-research-job-model.service`, `at-research-jobs.slice`; 13 November 2026). Rendering the unit files is SLICE-11 step 7's renderer reading these rows.
* **The worker's start check (`check(profile, environ) -> list[str]`), every check run, the problems listed in this order:**
  1. **Settings:** `effective(environ.get("AT_PROFILE", "test"), environ, participant=…)`. A `ConfigRefused` ends the check. Every `CFG-R07` problem (a broker-key name with a value) and every `CFG-R01` problem for an `AT_` or `MCP_` name is a problem, written `"<code> <name>"`.
  2. **Required settings:** each unbound required field is `unbound <key>`.
  3. **Environment:** legacy's allowlist check (`policy.py:95-107`), with the allowlist taken from the contract instead of legacy's fixed set (LD-18). The allowed names are `BASE_ENV`, names with a `BASE_PREFIXES` prefix, `COMMON_LAUNCHER`, the participant's launcher names, the environment names of its in-scope fields, `INVOCATION_ID`, `JOURNAL_STREAM` and `SYSTEMD_EXEC_PID`, the locators of its in-scope `env` secret references, and the broker-key names with an empty value. Anything else is "worker environment has disallowed keys: {names}" (legacy's text).
  4. **Unit:** legacy `_research_unit_health` (`policy.py:63-92`), reading `systemctl show` through the module attribute `SHOW` and the process's cgroups through `CGROUPS`; `PrivateNetwork` is `yes` for offline and `no` for model.
  5. **Queue** readable, **custody** `pristine` or `initialized` (`policy.py:149-174`, over the bound paths), **the slice envelope**, and **free space** of at least `MIN_FREE_BYTES = 2 GiB` on the job root (`:177-188`), legacy's messages.

  **The slice envelope is legacy's, unchanged (Fork call):** `_research_resource_health` (`policy.py:138-146`, called in `research_eligibility` at `:204`) reads `systemctl show at-research-jobs.slice` through `SHOW` and refuses "research slice limit drift: {names}" unless `CPUQuotaPerSecUSec` is `250ms`, `MemoryHigh` `805306368`, `MemoryMax` `1258291200`, `TasksMax` `64` and `IOWeight` `1` (`_SLICE_LIMITS`, `policy.py:16-22`). These are legacy's research-slice values, not the `at.slice` aggregate envelope, which stays SLICE-11's (refusing, measured); if SLICE-11 renders other values for `at-research-jobs.slice`, this check refuses and the difference goes to the owner. Market time is not checked, as legacy (`policy.py:191-196`). `python -m autonomous_trading.research.jobs check --profile P` prints one problem per line and exits 0 with none, else 1.
* **Serving.** `once JOB --profile P --store ROOT` and `serve --profile P --store ROOT [--burst]` are legacy's `_supervise_one` and `_serve` for research jobs (`worker.py:480-561`, `:603-641`), without the local backend and the after-close gate. A job of the other profile returns "job belongs to a different research worker profile". **Before every claim** the supervisor runs `check(profile, os.environ)` (legacy's `research_eligibility` at the same point, `worker.py:516-519`); any problem is written to the job's `progress` and the job stays `queued`, with no claim, no lease and no receipt. The supervisor claims with `research.jobs.lease_seconds`, heartbeats every 0.4 s (legacy), and spawns the job child `python -m autonomous_trading.research.jobs child JOB --store ROOT --outcome PATH --parent PID --profile P` in a new session (POSIX `start_new_session=True`, Windows `CREATE_NEW_PROCESS_GROUP`), with the supervisor's own environment, which is the checked one. The child checks legacy's handoff (`ResearchChildHandoff/v1`, `worker.py:268-310`; the process-group and session comparisons only on POSIX), enters `attempt_context(AttemptRef(job_id, rec.attempt, generation, receipt_id))` with the receipt the claim appended, runs the target, and writes the outcome file. Before running the target, the child reruns `check(profile, os.environ)` without the unit check (legacy reran all of `research_eligibility` in the child, `worker.py:254-265`, `:328`; **Deviation:** the child's own cgroup is the attempt's, which the supervisor's unit check already proved); a problem is written to the outcome file as a failure. The supervisor then releases the job (`worker.py:355-458`).
* **Tests fake `systemctl`** by replacing `SHOW` and `CGROUPS` in the worker process, from the test file's own `__main__` (SLICE-11 step 7's fake `systemctl` is not built yet).

### Tests

Every value is synthetic. `E0 = 1793763000.0` (2026-11-04T03:30:00Z). Unless a case says otherwise, a trial ledger's `clock` returns `E0`, `E0 + 60`, `E0 + 120`, … in turn and its `new_id` returns `"a00000000001"`, `"a00000000002"`, …; its custody ledger is a step 1 ledger in `tmp_path`. A job store's `clock` is a list the case names, its `new_id` returns `f"{n:012d}" + "0"*20` for n = 1, 2, … (so a job ID, the first 12 characters, is `"000000000001"`, `"000000000002"`, …), and `probe` is a fake whose live set the case names.

**`tests/unit/test_research_attempts.py` (T-81), PRF-RES-04 and PRF-RES-05:**

| Group | Cases |
|---|---|
| Open | `open({"lookback": 20}, "ds-1", metric="sharpe", search_id="s-1", seed=7, code_ref="research.test")` writes `a00000000001.json`: 628 bytes, SHA-256 `15df12e440704ee02bccec2a9aa79242a7e6aa6e975dc3723644b4ae1a4d73c8`, `extensions` exactly `{"attempt": {"job": null}}`. **Method:** legacy's `TrialLedger.open` called with the same arguments plus `extensions={"attempt": {"job": None}}`, which legacy stores as given, so its file is the target's record; the closing hash below is legacy's `close` of that trial. Inside `attempt_context(AttemptRef("j1", 1, 1, "r1"))`, `extensions.attempt` is `{"job": {"job_id": "j1", "attempt": 1, "lease_generation": 1, "receipt_id": "r1"}}`. Refusals: `{}` → "parameters must be a non-empty dict of what was varied."; `{"a": 1, "b": 2}` → starts "parameter trials vary exactly one lever; got 2."; `data_roles={"x": "research_lab"}` with no search → starts "research_lab trials require search_id"; a lab trial with `partition_ids=["p"]` → "a research_lab trial never consumes a locked partition"; dataset `" "` → starts "dataset is required"; `extensions={"attempt": 1}` → "extensions.attempt is written by the ledger"; `data_roles={P0: "locked_oos"}` → "locked_oos trials open through the locked-access ledger (step 3)". After `declare_locked_oos(["2026-11-04"], declared_by="owner", reason="synthetic", today=date(2026, 11, 3))`, whose `partition_id` is `P0 = sha256:b050ae7958a90ec5910b4ac66d4b14f1448231ab1d9d7e3de6659bb31270a122`, `open({"lookback": 20}, "ds-2", search_id="s-3", dates=["2026-11-04"])` → "these sessions are declared locked out-of-sample and may only be read by the locked evaluation: 2026-11-04. Tuning or validating against them spends the holdout." |
| Close | `close("a00000000001", "completed", 1.25)` writes `a00000000001.closed.json`: 638 bytes, SHA-256 `77a0ca4e278d77cda5c5e7e6d49df0cedebc11ca3e148661bc8d38d219764168` (`decided_at` `E0 + 60`), and leaves no `.tmp`. A second close → "trial 'a00000000001' is already closed as 'completed'; a closing record is never replaced". **Race:** with `get` patched to return the running record, a second close raises "trial_already_closed: a00000000001" and the closing file is byte-identical. `close(id, "completed")` without a score → starts "a completed trial needs a score"; `close(id, "running")` → "close() records an ending; 'running' is not one." |
| Legacy closings | A hand-written `t0.json` (running) and `t0.abandoned.json` read as `abandoned`. Adding `t0.completed.json`: `get("t0")` raises "conflicting_close: t0", `latest_per_trial()` omits `t0`, and `count()` has `total` 1, every `by_outcome` value 0, `conflicting` `["t0"]` and `incomplete` true |
| Count | Four trials in search `s-1` over `ds-1`: the closed `a00000000001`, then `{"lookback": 30}` closed `crashed`, `{"lookback": 40}` closed `abandoned` and `{"lookback": 50}` left running. `count("ds-1", search_id="s-1")` equals legacy's: `total` 4, `trials_for_deflation` 4, `by_outcome` `{running: 1, completed: 1, neutral: 0, abandoned: 1, crashed: 1}`, legacy's `note`, plus `unreadable` `[]`, `conflicting` `[]`, `incomplete` false. Writing `zzz.json` containing `{` adds `unreadable` `["zzz.json"]` and `incomplete` true, with `total` still 4; an `open` then raises a `TrialError` starting "historical custody is ineligible: legacy custody record is corrupt:" and writes no file |
| Lineage | A lab trial `b00000000001` (`data_roles {"lab": "research_lab"}`, search `s-lab`) and a hand-written completed exam record `e00000000001` in `s-lab` (`data_roles {P0: "locked_oos"}`), whose `extensions` carry `frozen_evaluation.trial_definition = {"schema": "CandidateTrialSet/v1", "search_id": "s-lab", "records": [{"trial_id": "b00000000001", "dataset_identity": "sha256:" + "d"*64, "parameters": {"lr": 0.001, "gamma": 0.99}, "outcome": "completed", "score": 0.5, "metric": "reward", "seed": 7}]}`, `candidate_trial_identity = sha256:eed4b9755777ad11cdfcd0baf4acfef6f1ad98127e54356934c500392814b904` and `candidate_bundle_digest = "sha256:" + "c"*64`. `promotion_lineage("b00000000001")` returns `exam_trial_id "e00000000001"`. With the identity's last hex digit changed → "research_lab trial b00000000001 cannot be promoted directly: freeze its candidate into a CandidateBundle and pass the one-use locked exam first". An ordinary trial returns `research_lab: false` |
| Resume | The case's first trial `a00000000001`, opened as `{"lookback": 20}`, `ds-1`, `code_ref "research.test"`, seed 7, `inputs={"environment": "sha256:" + "e"*64, "reward": "sha256:" + "f"*64}`, then closed `crashed`. `compatibility` is `specification_digest sha256:06473863a6786b67940227c4dc53287a2026160a6f55fef9e992de8832156646`, `inputs_digest sha256:500358a9bf6e95d566d0fd86c01428357a5042a038c49bcc6222a63c9e3ea680`. `resume` with those two and `checkpoint_digest`, `state_digest` `"sha256:" + "1"*64`, `"sha256:" + "2"*64` opens `a00000000002`, running, with `parent_id "a00000000001"`, the same parameters, seed and inputs, and `extensions.resume` holding the three digests. A checkpoint whose `specification_digest` is the seed-8 value `sha256:26a2c5c5e22c08d67a1a112b5e3f0cb1dcfa84cee059bbe0a5f49606e8912d9b` → "resume refused: specification_digest differs; a changed parameter or assumption is a new attempt". Resuming the still-running new trial → "resume needs an interrupted parent; {id} is running" |
| Jobs: slot and expiry | The clock is a value the case sets (every `enqueued_at` is `clock()`): 1000 for the submits and the first claim, 1010 for the second claim, 1016 after; lease 15 s. `submit` two noop requests `q-1`, `q-2`. `claim(job1, lease_seconds=15)` writes `lease.json` before the row (a spy on `_replace_bytes` sees the lease path first): `generation` 1, `expires_at` 1015.0, `owner_token` `"000000000003" + "0"*20`, and the row `running` with `lease_generation` 1 and one receipt `{receipt_id: "000000000004" + "0"*20, attempt: 1, generation: 1, started_at: 1000.0, owner_host, owner_boot_id, owner_pid, owner_process_start}`. `claim(job2)` at 1010 → `None`. Inside `attempt_context` for job1's receipt, a trial `a00000000001` is opened; a second trial with job `"other"` is opened too. At 1016, with the probe reporting nothing alive, `claim(job2)` reconciles: job1 `failed`, `interrupted` true, error "worker lease expired; the recorded process tree was terminated and reaped"; `a00000000001` closed `crashed` with `extensions.interrupted` true; the other trial still running; job2 `running` with `generation` 2. **A live child:** on a fresh store, after `claim(job1, lease_seconds=15)` at 1000, `set_process(job1, token, 1, process_pid=4242, process_start="s1", pgid=4242, lease_seconds=15)` (legacy's parameter names) at 1000, a fake probe whose `alive(4242, "s1")` stays true and whose `terminate` records its calls, and `_TERMINATION_WAIT_SECS` patched to 0.1: at 1016, `reconcile_expired()` raises `JobLeaseError` "expired lease for job {job1} still has a live process"; the fake's calls include `(4242, True)`; `lease.json` is byte-identical and job1 stays `running` |
| Jobs: rules | `request_cancel` on a queued job → `cancelled`, "cancelled before it started". `release(job, token, 1, state="finished", result={"ok": True})` frees the slot; the same call again returns `None` with the row bytes unchanged; `release(..., state="running")` → "lease release requires a terminal job state". A result of 70,000 bytes is written to `{id}.result.json`; a second write of that file → `JobStateError("result_already_written")`. A row saved `running` with no lease → `claim` of another job raises "running job {id} has no active queue lease; refusing claim" |
| Jobs: retries and duplicates | Submitting `q-1` again returns job1's ID and creates no file. Job1 `failed` → `retry` creates job3 with `attempt` 2, `retry_of` job1, `request_identity "q-1"`, and `submit(q-1)` now returns job3. `retry(job1)` → "job {job1} is not the current retry tail; latest attempt is {job3}". A hand-edited job3 with `retry_of "x"` → "retry identity does not form one linear attempt chain". With `max_pending` 2 and two jobs open, a third distinct request → "2 research jobs are already queued or running (limit 2); wait for them to finish" |
| Port | `submit`, `observe`, `cancel`, `recover` over the store: `observe` after expiry shows `interrupted` true; `recover` returns the queued jobs and the job it just failed |

**`tests/integration/test_research_worker.py` (T-83), PRF-RES-06,** with real worker processes. Each case writes a test profile in `tmp_path` binding the six research fields (lease 2 s, `max_pending` 4), as `tests/unit/test_settings_resolver.py` writes profiles. The rendered environment is `PATH`, `SYSTEMROOT` on Windows, `HOME`, `LANG`, `AT_PROFILE`, `AT_RELEASE`. The model profile also binds `secrets: {advisor: {api_key: {source: env, locator: ADVISOR_API_KEY}}}` with `ADVISOR_API_KEY=k` in its environment. The file's `__main__` (`worker` mode) installs a fake `SHOW` (`ActiveState active`, `SubState running`, `MainPID` its PID, `Slice at-research-jobs.slice`, `ControlGroup /at-research-jobs.slice/<unit>`, `PrivateNetwork` per profile; for `at-research-jobs.slice`, legacy's five `_SLICE_LIMITS` values) and a fake `CGROUPS` returning that group, then calls `jobs.main(argv)`.

| Case | Expected |
|---|---|
| Check | For each profile, `check` with exactly its rendered environment → no problem (exit 0) |
| One isolated job each | Submit `research.noop` for offline and `research.noop_model` for model; each worker runs `once <id>`: the job ends `finished` with result `{"ok": true}`, one attempt receipt, a child PID different from the supervisor's, and no `lease.json` `active`. With `trial_dir` and the custody paths set, the noop trial is `running` with `extensions.attempt.job` naming the job, generation 1 and the receipt |
| Refusals | `AT__OPENALGO__AUTH__API_KEY=x` → exit 1, a line `CFG-R07 AT__OPENALGO__AUTH__API_KEY`; `AT_FOO=1` → `CFG-R01 AT_FOO`; offline with `ADVISOR_API_KEY=k` → "worker environment has disallowed keys: ADVISOR_API_KEY"; `PrivateNetwork no` for offline → "PrivateNetwork does not match the offline profile"; the fake slice with `TasksMax 128` → "research slice limit drift: TasksMax"; `once <id>` with `AT__OPENALGO__AUTH__API_KEY=x` → the job stays `queued` with `progress` naming `CFG-R07 AT__OPENALGO__AUTH__API_KEY`, no attempt receipt and no `lease.json` `active`; the offline worker given the model job → its record carries "job belongs to a different research worker profile" and stays `queued` |
| Timeout and cancel | `research.noop` with `sleep_secs` 30, the file's `__main__` setting the type's timeout to 1 s when given `--short-timeout` → `timeout`, `interrupted` true; with `request_cancel` during the sleep → `cancelled` |

**`tests/recovery/test_crash_boundaries.py`, CP-R8 and CP-R9, by killing a real process** (step 1's pattern: a child function, `os._exit(86)`, a `__main__` branch per point):

* **CP-R8a** `_cp_r8a_child(base)`: opens `a00000000001`, patches `os.link` to `os._exit(86)` and closes it `completed`. The parent asserts exit 86, no `a00000000001.closed.json`, one `.a00000000001.closed.json.*.tmp`, `get` returns `running` and `count()` `total` 1, `unreadable` `[]`. A close then succeeds, and the leftover temporary is still ignored.
* **CP-R8b** `_cp_r8b_child(base)`: as CP-R8a, but `os.unlink` of the temporary runs `os._exit(86)`. The parent sees the closing file present (638 bytes, `77a0…4168`) and a leftover temporary; `get` returns `completed`; a second close refuses with legacy's "already closed" text.
* **CP-R9** `_cp_r9_child(base)`: a store with one queued noop job; `JobStore._save_locked` is patched so saving a row whose state is `running` runs `os._exit(86)`; then `claim(job, lease_seconds=0.5)`. The parent asserts exit 86, `lease.json` `active.job_id` the job with `generation` 1, and the row `queued` with no receipt. A second queued job's `claim` returns `None`. After 0.6 s, `reconcile_expired()` finds the dead owner, marks the first job `failed` and `interrupted`, and clears the lease; the second job's `claim` then gets `generation` 2; `retry` of the first creates its attempt 2.

**Existing tests that change:** `tests/unit/test_settings_resolver.py::test_participants` adds `research-offline` and `research-model` to its participant set; its other assertions hold unchanged (distinct users, scopes in `SCOPES`, broker names forbidden, required fields unset in the defaults).

### Break checks

The minimum set. Each anchor is checked present exactly once, one mutation at a time, each file restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| `close`: `os.link` replaced by `os.replace` | Close (race: the file is replaced) |
| `close`: the legacy pre-check removed | Close (the second close's message) |
| `count`: `crashed` left out of `by_outcome` and `total` | Count |
| `scan`: unreadable files skipped without being listed | Count (`zzz.json`) |
| Several closing records resolved by `_recency` | Legacy closings |
| `compatibility`: `seed` left out of the specification | Resume (seed 8) |
| `promotion_lineage`: the identity hash comparison removed | Lineage |
| `claim`: the row saved before the lease | Jobs: slot and expiry (spy order); CP-R9 |
| Expiry: the running-trial close removed | Jobs: slot and expiry |
| `submit`: no duplicate lookup | Jobs: retries and duplicates |
| The result file written with `os.replace` | Jobs: rules |
| `check`: `CFG-R07` problems ignored | T-83 refusals |
| The environment allowlist taken from legacy's fixed set | T-83 check (`AT_PROFILE` refused) |
| Supervisor skips `check` before the claim | T-83 refusals (`once` with the broker key claims the job) |
| `check`: the slice-envelope check removed | T-83 refusals (`TasksMax 128`) |
| Expiry: `probe.terminate` not called for a live child | Jobs: slot and expiry (a live child) |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/research/trials.py` | New: the ledger, the serializer, the no-replace close, scanning and counting, resume, lineage, declarations, `AttemptRef` and `attempt_context` |
| `src/autonomous_trading/research/jobs.py` | New: the store, the probe, expiry, retries, the port, the job types, the start check, the supervisor and the job child, `main` |
| `src/autonomous_trading/settings/schema.py` | Six `FIELDS` and two `PARTICIPANTS` rows |
| `src/autonomous_trading/resources/defaults.yaml` | The six keys, unset |
| `tests/unit/test_research_attempts.py` | New (T-81) |
| `tests/integration/test_research_worker.py` | New (T-83) |
| `tests/recovery/test_crash_boundaries.py` | `_cp_r8a_child`, `_cp_r8b_child`, `_cp_r9_child`, their tests and `__main__` branches |
| `tests/unit/test_settings_resolver.py` | `test_participants`'s set |

No kernel module, schema, event kind or migration changes.

### Completion conditions (step 2)

* **Targeted tests only:** `tests/unit/test_research_attempts.py`, `tests/integration/test_research_worker.py`, `tests/recovery/test_crash_boundaries.py` (the whole file: its driver changes), `tests/unit/test_settings_resolver.py` and `tests/contracts/`, twice in a row on Windows. The Linux branch of the process probe (`/proc`, `killpg`) is **not checked** on Windows; it runs first when SLICE-11 runs the suite on the EC2.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file. Every trial-file length and hash in the tests is recomputed from legacy's `TrialLedger` as above.
* `git diff --name-only` names exactly the files above; one commit in OA_NEW; nothing pushed.
* This file records step 2 "as built", with any Fork call or Deviation the build adds.

### Step 2 as built

**In plain words.** The log of research attempts and the one-at-a-time research queue now exist in the new system. Every attempt is written before it runs, closes once, and is counted however it ends; a damaged file is named, not hidden. A worker that dies has its job and its open attempts marked as interrupted when its time runs out. Both research workers check their settings, credentials and service before every job, and each ran one real job in a separate process in the tests. Nothing here touches trading.

Commit `d4e8cb2` on `slice-08`, on top of `e3805f1` (step 1's absolute-import fix for the Canvas guard) and `3b891d0` (SLICE-11 step 2). It adds `research/trials.py`, `research/jobs.py`, `tests/unit/test_research_attempts.py` and `tests/integration/test_research_worker.py`, and changes `settings/schema.py`, `resources/defaults.yaml`, `tests/recovery/test_crash_boundaries.py` and `tests/unit/test_settings_resolver.py`: 8 files, 2,730 lines added, 1 removed. Not pushed.

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Legacy values | Every trial-file length and hash in T-81 equalled legacy's on the first run (`15df…73c8`, `77a0…4168`, the lineage and resume digests) |
| Windows job child (**Deviation**, Windows test hosts only) | A venv's `python.exe` on Windows is a launcher that runs the interpreter as its own child, so the PID the supervisor records is the launcher's. The child's handoff check accepts the recorded identity as its own process or, on Windows only, its parent. `ProcessProbe.terminate(pid, True)` on Windows runs `taskkill /T /F /PID`, so the launcher and the interpreter both end. POSIX is unchanged: `os.killpg` |
| The child's check | The child reruns `check` without both systemd reads, the unit and the slice envelope (the text named the unit only); both describe the unit the supervisor already checked. **Deviation** |
| A job of the other profile | Its `progress` is set to "job belongs to a different research worker profile" so the record shows it; legacy returned the text without writing it |
| Lineage test | The exam record is written by hand after the case's opens. Step 1's `migrate_legacy` reads a locked record with no access row as globally ineligible, so a later `open` refuses (legacy's fail-closed reading); the test documents it |
| Resume test | Break check "seed left out" first survived: the seed-8 checkpoint's digest was fixed in the test, and it still differed. The test now builds the checkpoint from a real seed-8 attempt's `compatibility`, so dropping the seed makes it equal and the resume is accepted |
| Break checks | 16, the listed set: each fails a listed test, every file restored (md5). Script: `s12b_breaks.py` in the session scratchpad |

**Tests run (Windows, targeted only):** `tests/unit/test_research_attempts.py`, `tests/integration/test_research_worker.py`, `tests/recovery/test_crash_boundaries.py`, `tests/unit/test_settings_resolver.py`, `tests/contracts/` and `tests/unit/test_canvas_causality.py`: 231 passed, twice in a row; T-81 twice more after its last edit. CP-R8a, CP-R8b and CP-R9 killed a real child process each (exit 86); T-83 ran real supervisor and job-child processes. `ast.parse` passes on every edited file. The Linux branch of the probe is **not checked**. **Flake seen once, not this step's:** `tests/contracts/test_installed_artifact.py::test_settings_revision` forges a wrong revision as `"0" + revision[1:]`, which equals the real one whenever the revision starts with `0` (about one run in 16); it passed alone and in both full runs after. Recorded for SLICE-11's owner.

## Step 3 — locked access, datasets and the freeze

<a id="step-3--locked-access-datasets-and-the-freeze-outline"></a>

The authorities are the spec's [Trials and attempts](../../design/research-rl-custody-promotion.md#trials-and-attempts-researchtrialspy) (the locked-access ledger and metric disclosures), [Datasets and fitting provenance](../../design/research-rl-custody-promotion.md#datasets-and-fitting-provenance-researchdatasetspy) and [Candidate freeze](../../design/research-rl-custody-promotion.md#candidate-freeze-researchcandidatespy), PRF-RES-07, PRF-RES-08 and CP-R2…CP-R7, CP-R10. Step 3 is TASK-S12-03. It is written assuming step 2 is built exactly as its text says; a decision that leans on a step 2 detail is marked **(re-check at build)**. Every legacy citation is at 445eb116: `trials.py` as in step 2; `datasets/__init__.py` is `src/analysis/datasets/__init__.py`; `selection.py` is `src/analysis/core/selection.py`; `training/__init__.py` is `src/analysis/training/__init__.py`; `candidate.py` is `src/analysis/evaluation/candidate.py`; `contracts.py` and `registry.py` are under `src/analysis/candidates/`; `HC` is `src/data/historical/contracts.py`. Every hex value below was computed on 2026-11-03 by running legacy's own code on the synthetic inputs shown, as step 2's were: `TrialLedger` and `CustodyLedger` for the exam, `walk_forward_metadata`, `_row_eligibility` and `purged_folds` (taken out of the legacy files with `ast` and run unchanged), `EvidencePartition`, and `CandidateBundle`. The values that have no legacy counterpart (the model `CandidateId`, fit records, disclosures) are computed with the hasher each names. No production record was read.

**In plain words.** This step builds the one-time exam on locked market days and the records around it. Opening an exam writes three records in a fixed order: the custody chain's reservation, a row in the access log, then the attempt itself. Reading the exam days spends them, and the exam's dataset is written before the spend is recorded, exactly as the old system does. If anything crashes in between, those days stay spent and the half-built dataset can never be evaluated. A new check lists the leftovers such a crash can leave, so the owner can see them. Every evaluation over exam days now leaves a note of what it measured, even when it fails. Learned settings, such as a normaliser's mean, record which rows they were learned from, and applying them to exam rows never learns again. A finished candidate is frozen by the fingerprint of its exact files, computed as the old system computes it, and a strategy that asks an AI model now has its prompt and model in its fingerprint. Nothing here touches trading.

### Decisions

#### The locked-access ledger (`research/trials.py`)

* **Ported unchanged, with their messages** (**Fork calls**, slice Fork calls 1, 2, 3 and 21): the locked branch of `open` (`trials.py:455-547`), replacing step 2's refusal: under `_locked_oos_open`, the reuse check across every search, the denied rows, then custody `reserve`, then the `reserved` access row, then the trial record. Also `declare_partition` and `assert_partition_custody` (`:803-1127`), `locked_oos_uses`, `_locked_access_rows`, `locked_oos_reservation`, `locked_oos_consumption`, `_audit_locked_oos_access`, `complete_locked_oos_access`, `claim_locked_oos_read`, `assert_locked_oos_claim`, `assert_locked_reservation`, `locked_oos_reads`, `locked_oos_access_state` (`:104-182`, `:1221-1360`). Access rows and declarations are written by step 2's serializer (`\n` bytes, atomic replace), new IDs and times from the ledger's `new_id` and `clock` **(re-check at build)**.
* **`_locked_oos_open`** takes step 1's `_file_lock` on `.locked-oos-open.lock` in the trial root (legacy `trials.py:205-227`); the bundle maintenance lock is not ported, as in step 2 **(re-check at build)**.
* **`EvidencePartition` and `HistoricalLockAttestation`** (`HC:484-730`) are ported unchanged into `research/bundles.py`, which step 1 deferred to this step; `declare_partition` uses them.
* **Unreadable access rows and declarations** are listed by the consistency scan (below), as step 2 lists unreadable trial files (**slice Deviation 2**). Legacy's `_locked_access_rows` and `_declaration_rows` skip such a file (`trials.py:746-757`, `:1241-1254`), but they are never reached with one: every locked operation first calls `_migrate_custody`, whose `migrate_legacy` reads every file under `locked-oos/` and `locked-oos-access/` and raises on a corrupt one. So a corrupt access row or declaration makes `open` (and every other locked operation, `declare_locked_oos` and `declare_partition` included) refuse with "historical custody is ineligible: legacy custody record is corrupt: …", as legacy; research writes nothing until the file is removed or repaired (step 2, re-check at build). Custody stays the authority either way: `reserve` refuses a spent scope whatever the access log says.

#### Metric disclosures (slice Deviation 7)

* **`TrialLedger.disclose(*, evaluation_identity, dataset_identity, custody_reservation_id, exam_trial_id, metrics, outcome, actor) -> dict`.** `outcome` is one of `eligible`, `ineligible`, `deferred`, `failed`; `evaluation_identity` may be `None` (a run that failed before it had one). The record is `{"schema": "MetricDisclosure/v1", "id": new_id(), "evaluation_identity", "dataset_identity", "custody_reservation_id", "exam_trial_id", "metrics_digest": "sha256:" + legacy_digest(metrics), "outcome", "actor", "recorded_at": clock()}`. It is published to `metric-disclosures/{id}.json` in the trial root by step 2's `_publish_once(path, row)`; its `FileExistsError` becomes `TrialError("disclosure_exists: {id}")` **(re-check at build)**. `disclosures(dataset_identity=None)` reads them back, oldest first. Step 4's evaluation calls `disclose` before it returns any result over locked rows; step 3 builds and proves the record only.

#### The consistency scan (slice Deviation 8)

* **`TrialLedger.consistency() -> ConsistencyReport(orphan_reservation, orphan_access, claim_unconsumed, consumption_unrecorded, unreadable)`**, read-only, each list sorted. It reads the files and `custody.events()` directly and never calls `_migrate_custody`, so it still answers when a corrupt file stops the writers:
  * `orphan_reservation`: custody `reservation` event IDs that no access row names as `custody_reservation_id` (CP-R2);
  * `orphan_access`: IDs of `reserved` access rows whose `trial_id` has no trial record (CP-R3);
  * `claim_unconsumed`: reservation IDs with a custody `read_claimed` and no `consumption` (CP-R4, CP-R5; the partition is spent, slice Fork call 2);
  * `consumption_unrecorded`: reservation IDs with a custody `consumption` and no `consumed` access row (CP-R6);
  * `unreadable`: file names under `locked-oos/`, `locked-oos-access/` and `metric-disclosures/` that do not read as a JSON object.

  Nothing reuses or repairs what it reports.

#### Datasets (`research/datasets.py`)

* **Ported unchanged, with their messages:** `DatasetError`, `SCHEMA_VERSION = "1.4.0"`, `BASELINE_FILE`, `IDENTITY_FIELDS`, `OPTIONAL_IDENTITY_FIELDS`, `MODEL_IDENTITY_FIELDS`, `candidate_identity`, `_roles`, `_partition_days`, `_locked_custody_scopes` (the imported branch reading scopes with step 1's `scopes(bundle_root)`), `walk_forward_metadata`, `_semantic_row_digest`, `_manifest_role_transitions`, `_aware_timestamp`, `_row_eligibility`, `_validated_row_eligibility`, `evidence_claims`, `reserve_locked_evaluation`, `_existing_locked_evaluation`, `read`, `read_manifest`, `read_for_roles`, `read_baseline`, `_verified_baseline_rows` (`datasets/__init__.py:55-860`, `:2467-2596`); `purged_folds` and `boundary_exclusion_positions` (`selection.py:39-100`). Walk-forward and purge and embargo are legacy's exactly; no universal number is set (`README.md:877`).
* **`build(strategy, days, *, ledger, out, source, settings, label_horizons, roles=None, partition_roles=None, underlying="NIFTY", champion="", candidate, locked_oos_actor="", search_id="", locked_oos_identity=None, outcome_horizon=None, holding_period=None, cross_session_state=0, purge=None, embargo=None, evidence_requirements=None, bundle_roots=None, locked_oos_trial_id="", locked_oos_custody_claim=None, baseline_strategy="") -> dict`** is legacy's `build` (`datasets/__init__.py:1840-2061`, `:2344-2464`) in the same order:
  1. checks and roles; the walk-forward record over declared partitions;
  2. for locked days: reserve, or reuse a named exam trial, through `reserve_locked_evaluation`; the already-consumed refusal; then `claim_locked_oos_read`, and the consumption block with `custody_reservation_digest` and `read_claim_digest`;
  3. ordinary exposure;
  4. **the rows from `source`**;
  5. row eligibility, folds, `dataset.ndjson` and the optional `baseline.ndjson`, the identity seed with legacy's keys, the identity `"sha256:" + legacy_digest(seed)`, `manifest.json`;
  6. then `complete_locked_oos_access` (custody `consumption`, then the `consumed` row), then the exam closed `completed` with `float(len(rows))`.

  Any exception after the reservation closes a running exam `crashed` (`:2458-2464`). The manifest is written **before** consumption (**Fork call**, slice Fork call 3), and nothing completes a consumption after a crash (**Fork call**, slice Fork call 21).
* **The row source (Deviation).** Legacy produced rows from advisor consultations, market slices, orders and replay evidence inside `build` (`datasets/__init__.py:2056-2343`). Those readers need SLICE-09's run records and arrive with step 4's evaluation. Step 3's `build` takes `source: RowSource` with one method, `rows(*, strategy, days, roles, underlying, baseline_strategy) -> RowBatch`, called after the read claim and inside the crash handler. `RowBatch` holds `rows`, `observations`, `sources` (`[{path, digest}]`), `economic_cost_days`, `economic_book`, and, when a baseline is named, `baseline_rows`, `baseline_declared_advisor`, `baseline_economic_book` and `baseline_cost_days`. `build` sorts `rows` by `(day, seq)`, orders `observations` by `(day, seq)` with `data_role` set from the assigned roles (legacy `:2344-2350`), and computes everything else itself. `store`, `root`, `order_root`, `trial_dir` and `replay_roots` are not parameters; the source owns them. No dataset job type is registered in step 3; step 4 registers it with its source.
* **The horizons come from a bound setting (Fork call; slice Deviation 18 for the missing in-code default).** Legacy took `value.HORIZONS = (5, 15, 30)` (`src/runtime/advisor/value.py:55`): the outcome horizon defaulted to its maximum, and the purge and embargo floor was `max(horizon, holding, cross_session_state, *value.HORIZONS)` (`datasets/__init__.py:1856-1861`). Step 3 adds the field `promotion.directional.horizons` to `settings/schema.py` (kind `horizons`: a non-empty list of distinct positive integers in ascending order, anything else a `CFG-R03` wrong value; no environment name; scope `research-offline` and `research-model`; register `legacy`; unset in `resources/defaults.yaml`). `build` reads it from `settings` (the research participant's resolved `Settings`) and refuses before any read, with "unbound promotion.directional.horizons" when it is unset and "label_horizons {caller} differ from promotion.directional.horizons {bound}" when the caller's `label_horizons` is not exactly the bound value. The outcome horizon defaults to its maximum, and the floor is legacy's formula over the bound value: `max(horizon, holding, cross_session_state, *horizons)`. Production binds 5, 15, 30, so the floor is at least 30 exactly as in legacy. The field is not in either participant's `fields_required`; only `build` needs it.
* **`builder_code_digest`** is the `sha256:` of `research/datasets.py`'s bytes with `\r\n` read as `\n`; legacy hashed its own file (`:2385`). **No Parquet sidecar (Deviation):** legacy wrote one when `duckdb` imported (`:2391-2399`); the target ships no `duckdb`, so `sidecars` is always `[]`.
* **`locked_evidence(ledger, manifest, days, identity) -> dict`** is legacy's `_locked_evidence` (`candidate.py:667-839`), ported unchanged with every message. Evaluation (step 4) accepts a locked dataset only through it: the exam `completed`, both access rows naming the custody reservation, and the chain holding the matching reservation, one claim and one consumption.

#### Fit records (slice Deviation 6, A07-F1)

* **`Transform`** has `algorithm: str`, `fit(rows, config) -> bytes` and `apply(artifact, rows, config) -> list[dict]`. One is built in: `ZScore`, `algorithm "zscore/v1"`, `config {"feature": name}`. Its `fit` takes the mean and the population standard deviation of `float(row[feature])` and returns `canonical_json({"feature", "mean", "std"})` bytes; a zero deviation refuses: "zscore needs a non-zero spread". Its `apply` returns copies of the rows with `row[feature + "_z"] = (x - mean) / std`.
* **`FitStore(root)`**, one directory per transform, named by the hex of its `transform_id`: `fit.json` (the record, written once with no-replace), `artifact.bin` (written once), and `applications.ndjson` (one fsynced line per application). The record is `{"schema": "FitRecord/v1", "transform_id", "algorithm", "config_digest", "fit_population": {"dataset_identity", "partition_ids", "rows_digest"}, "fitted_artifact_digest", "applications": [...]}`, with `applications` read back from the lines. `config_digest = "sha256:" + legacy_digest(config)`, `rows_digest = "sha256:" + legacy_digest(rows)`, and `transform_id = "sha256:" + legacy_digest({"algorithm", "config_digest", "fit_population"})`, so a variant with another configuration or population is a new `transform_id`.
* **`fit(transform, config, manifest_path, *, store) -> FitRecord`** refuses a manifest whose roles or partition roles include `locked_oos`: "fit refuses datasets containing locked_oos rows" (as legacy training, `training/__init__.py:563-565`). It reads the eligible rows through `read_for_roles(..., {"development", "validation"}, eligible_only=True)` (`:572-576`) and fits on the `development` rows alone, as legacy's `_split` fits on development and keeps validation for scoring (`training/__init__.py:293-307`, `:589`); no development row refuses: "fit needs at least one eligible development row". (The review's `read_for_roles(..., {"development"}, …)` would refuse every development-and-validation dataset, "dataset role is not allowed for this reader", `datasets/__init__.py:2545-2548`; reading both and selecting by `data_role` is legacy's way.) `fit_population.partition_ids` and `rows_digest` describe those development rows.
* **`apply(record, rows, *, dataset_identity, partition_ids, store) -> list[dict]`** reads `artifact.bin`, refuses unless its SHA-256 equals `fitted_artifact_digest` ("fitted artifact changed: {transform_id}"), calls `transform.apply` and appends `{dataset_identity, partition_ids, rows_digest, applied_at}`. It never calls `fit`. An evaluation records the `transform_id`s it applied (step 4).

#### The candidate freeze (`research/candidates.py`)

* **`CandidateBundle/v1`, ported unchanged** (`contracts.py:14-546`): the constants, families, artifact formats, capabilities, the prohibited-field and credential-field rules, `CandidateArtifact`, `CandidateBundle.from_dict` and `to_dict`, with artifacts kept in their given order. `digest` is `"sha256:" + legacy_digest(self.to_dict())`, step 1's hasher. **Fork call** (slice Fork call 13 for the frozen acceptance rule inside `evaluation_freeze`); identity parity (REQ-RES-009).
* **`CandidateRegistry(root)`, ported** (`registry.py:21-405`): `publish` writes `bundle.json` (`json.dumps(..., ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"`) and each artifact into a `.candidate-<hex>` stage directory with exclusive creates, fsyncs, and renames the stage to the digest's hex. An existing destination is verified and returned when its bytes match. `verify` and `load` re-hash every artifact on every call (read here at `registry.py:372-383`, answering the spec's **not checked**), refuse missing or extra files, and refuse a non-digest name with "candidate digest must be canonical sha256:<hex>"; a mutable alias therefore never identifies a candidate. **Deviation (portability, no change on POSIX):** Windows has no `dir_fd`, so there the same steps run on joined paths after an `lstat` that refuses links. A leftover stage directory is never read (CP-R10).
* **Family payload checks.** The generic checks are ported unchanged: JSON parsed with duplicate keys and non-finite numbers refused, prohibited fields inside JSON artifacts, text artifacts in UTF-8. The `local_model` binding to `ModelSpec` and `ModelArtifact`, and the `research_policy` `check_bundle` (`registry.py:75-131`), need step 5's model contracts. Until then, `publish` and `verify` refuse those two families: "candidate family {family} is verified from step 5" (**Deviation**, fails closed; their `digest` is computed already).
* **`CandidateId` by decision method** (spec table; **Fork call**, slice Fork call 20): `candidate_id(method, *, strategy="", strategy_version="", code_digest="", model_identity=None, prompt_digest="", bundle=None) -> str`, 64 hex:

  | `method` | Value |
  |---|---|
  | `rule` | `sha256(canonical_json({"strategy", "strategy_version", "code_digest"}))`, the sessions spec's manifest, as `strategies/registry.py` computes it |
  | `model` | `sha256(canonical_json({"strategy", "strategy_version", "code_digest", "model_identity", "prompt_digest"}))`, where `model_identity` passes legacy's `normalize_identity` (`promotion.py:42-53`, ported with its messages) and `prompt_digest` passes `require_sha256_digest` |
  | `bundle` | `bundle.digest` without `sha256:` |

  `canonical_json` is `contracts/identity.py`'s (research imports no kernel module). Any other `method` refuses. The strategy host's own computation is SLICE-09's integration edit; step 6 makes the kernel use it.

### Tests

Every value is synthetic. `E0 = 1793763000.0` as in step 2. **The scripted exam:** a fresh trial ledger whose `new_id` returns `"c00000000001"`, `"c00000000002"`, … and whose `clock` returns `E0`, `E0 + 10`, `E0 + 20`, …; its custody ledger's `new_id` returns `f"{0xC0570D7:016x}{n:016x}"` for n = 1, 2, … and its `clock` 2026-11-03T10:00:00+00:00 and one minute later on each call. `CAND = {"strategy_family": "options_buyer", "model_spec_digest": "sha256:" + "1"*64, "model_artifact_digest": "sha256:" + "2"*64, "candidate_generator_identity": "sha256:" + "3"*64, "acceptance_rule_digest": "sha256:" + "4"*64}`. Then `declare_locked_oos(["2026-11-04"], declared_by="owner", reason="synthetic", today=date(2026, 11, 3))` (partition `P0`, step 2), and `build("s3", ["2026-11-04"], partition_roles={P0: "locked_oos"}, candidate=CAND, locked_oos_actor="research", search_id="s-1", label_horizons=(5, 15, 30), source=LOCKED_SRC, settings=…)`, the settings binding `promotion.directional.horizons: [5, 15, 30]` (legacy's value). `LOCKED_SRC` returns two rows, `{"day": "2026-11-04", "seq": 0, "data_role": "locked_oos", "x": 5.0, "labels": {"economics": {"available": false}}}` and the same with `seq 1`, `x 6.0`, plus the two matching observations, no sources and no baseline. Each file length and hash is of the file the target writes, equal to legacy's `\n` bytes.

**`tests/unit/test_dataset_fitting.py` (T-84), PRF-RES-07 and the locked-access rows:**

| Group | Cases |
|---|---|
| Three stores | The declaration file is 547 bytes, SHA-256 `3721da95508b48a46569193988a5083bf3e6f2d31955d4fb3445d5e5773c164f`. A recording wrapper sees, in order: custody `reservation`, the `reserved` row, the exam trial file, custody `read_claimed`, the source's `rows`, `manifest.json`, custody `consumption`, the `consumed` row, the exam's closing file. The exam is `c00000000002`, dataset `locked-oos:a0678a2b4e8fcb6d0fde330d5a87e768cbcfdd6e33df6053dc9e522e148d6833`, its open file 2,064 bytes, SHA-256 `f194d9ce99102ab22e8bf56d63155e3506bea57b1767f6236bd8f17141d23f42`, with `extensions` keys in the order `attempt`, `actor`, `strategy`, `partition_ids`, `candidate_bundle_digest`, `candidate_trial_identity`, `frozen_evaluation`, `dates`, `locked_oos_access_id`, `custody_reservation_id`, `custody_frozen_identity` (= `CAND`) **(re-check at build)**. The `reserved` row `c00000000003` (474 bytes, `f4ea93f78d0686dd98a0d0de72184ceea80900b91ac6e307bf1139ed0ab6e2f7`) and the `consumed` row `c00000000004` (464 bytes, `0239096a8c8aa5cdea905409dec99e8120646354361a4017126a1ea7d62698bf`) both name `custody_reservation_id "000000000c0570d70000000000000007"`. The closing file `c00000000002.closed.json` is 2,121 bytes, SHA-256 `9815ab725585c86abe431247c1ab3d36781fca0c16a843d17b6df97eed191daa` (score 2.0, `decided_at` `E0 + 40`). **Method for the exam's two file hashes (open and closing):** legacy's `TrialLedger.open` called with exactly the arguments legacy's `reserve_locked_evaluation` passes (`datasets/__init__.py:832-852`: parameters `{"locked_oos_dataset": "s3"}`, the `locked-oos:` dataset name, `metric "dataset_rows"`, `kind "locked_oos_evaluation"`, search, data roles, dates, `partition_ids`, `custody_scopes` from `scopes_for_partitions([P0])` filtered to the day, actor, `locked_oos_identity {}`, the six extensions and the five `CAND` fields) with two substitutions, both the target's own values: `code_ref "autonomous_trading.research.datasets"` (the target module's `__name__`; legacy's is `src.analysis.datasets`) and `{"attempt": {"job": None}}` as the first extensions key; then legacy's `claim_locked_oos_read`, `complete_locked_oos_access` and `close(…, "completed", 2.0, note="locked-OOS dataset built by reviewed consumption")`. The access rows and the declaration are legacy's unchanged calls. The chain's kinds, by sequence 1–11: `genesis`, `declaration`, `migration_checkpoint`, `migration_seen`, `migration_checkpoint`, `reservation`, `migration_seen`, `migration_seen`, `migration_checkpoint`, `read_claimed`, `consumption`; `partition_state(P0)` is `consumed` |
| Manifest | `locked_oos` true, `rows` 2, `missing_economics` 2, `sidecars` `[]`; `locked_oos_consumption` has `trial_id "c00000000002"`, `reused` false, `custody_reservation_id` as above, `read_claim_id "000000000c0570d7000000000000000c"`, `read_claim_digest sha256:1a3f6423994a552f33cfb5882d8099d88a3b8248c041cda15d1e38f6f199291d` (legacy's, path-independent), and `custody_reservation_digest` equal to `"sha256:" + legacy_digest(custody.reservation(…))` (the event holds hashes that depend on the test directory, step 2). `identity` equals `"sha256:" + legacy_digest(seed)`, where `seed` is the manifest without `identity`, `rows`, `data_file`, `locked_oos`, `missing_economics` and `output_digest`. `read()` returns both rows; one byte of `dataset.ndjson` changed → "dataset content digest does not match its manifest" |
| One use | After the build: a second exam `open` over `P0` in search `s-2` → "locked out-of-sample partition already consumed: sha256:b050…a122. Start a new, prospectively identified dataset instead of tuning against the holdout.", and the last access row is `denied`: `c00000000006`, trial `c00000000005`, reason "partition already reserved or consumed", `dates` `[]`. `complete_locked_oos_access("c00000000002", claim)` again → "locked_oos reservation is already consumed". The same build again → refused before any read |
| Locked evidence | `locked_evidence(ledger, manifest, ["2026-11-04"], CAND)` returns `locked_oos` true and `consumption_verified` true. With `c00000000004.json` deleted → "locked_oos custody reservation or consumption is absent"; with the exam's closing file deleted → "locked_oos consumption trial is absent or incomplete" |
| Partitions | On a fresh ledger (`new_id` `"d00000000001"`, …; same clocks), `declare_partition(PD, declared_by="owner", reason="synthetic", today=date(2026, 11, 3))`, where `PD` is the `EvidencePartition` `{role development, eligibility prospective_future, sessions [{"session_id": "NSE-2026-11-05", "date": "2026-11-05"}], bundle_ids [], declared_at "2026-11-03T10:00:00+00:00", declared_by owner, reason synthetic, access_policy ordinary, access_state unopened}`: its `partition_id` is `sha256:e25ae1d8d2ffc7af2706dd8380318e3343e1cb393d55428e7e4935d5175f3454`, and the declaration file is 721 bytes, SHA-256 `3d64892390c38a9996770a0e1600d74ad86ad5ad08bbd73f6ac5905855b0e666`. `declare_locked_oos(["2026-11-05"], …)` then → "locked_oos scope overlaps prior ordinary exposure" (a locked alias of an ordinary day). The same partition with the session on `2026-11-03` → "2026-11-03 is not in the future on 2026-11-03; a prospective partition must be named before it can be inspected" |
| Walk-forward | Partitions `p-dev` (development: 2026-10-26, 2026-10-27), `p-val` (validation: 2026-10-28) and `P0` (locked_oos: 2026-11-04), `outcome_horizon 5`, `holding_period 3`: `partition_order [p-dev, p-val, P0]`, `required_exclusion` 5, `purge` 5, `embargo` 5, `units "observations"`. With `purge=4` → "purge and embargo must each cover the maximum outcome horizon, holding period and cross-session state". `p-val` on 2026-10-27 → "session 2026-10-27 leaks across partitions p-dev and p-val". A validation partition before `p-dev`, or a validation partition after a locked one → "walk-forward roles must be chronological: development, validation, locked_oos" |
| Purging | `purged_folds(10, 5, purge=1, embargo=1)` fold 2: `train [0, 1, 2, 7, 8, 9]`, `test [4, 5]`, `purged [3]`, `embargoed [6]`. `_row_eligibility` over eight bars, `2026-10-27` seq 0–3 development and `2026-10-28` seq 0–3 validation, rows `{day, seq, data_role, "x": i}` for i = 0…7, with `outcome_horizon 1`, `holding_period 1`, `cross_session_state 0`, `purge 1`, `embargo 1`: one boundary `{position 4, day 2026-10-28, seq 0, from development, to validation}`; excluded `sha256:60396de4955708cb5907554b9ef586733ba33e87468cde128377501a15ab1a78` "purge: label window crosses validation boundary" (row 3) and `sha256:8039982d11868717f2703eea3529f6c7a9744827b6d51b9883665092148fe213` "embargo after development boundary" (row 4); six included; `observation_digest sha256:fbb639371ebddfa7521eb376c9b7fe69f87228d24343aa5ae088bf602117fb59`. With `outcome_horizon 2` → "purge and embargo must each cover the outcome horizon, holding period, label horizon and cross-session state before a role boundary" |
| Fits | The test profile binds `promotion.directional.horizons: [1]` (synthetic, not legacy's value). An ordinary build (`roles {"2026-10-27": "development", "2026-10-28": "validation"}`, `label_horizons (1,)`, `outcome_horizon 1`, `holding_period 1`, `purge 1`, `embargo 1`) over six rows, seq 0–2 on each day, each `{day, seq, data_role, x, "labels": {"economics": {"available": false}}}`, with `x` 1, 3, 99 and 50, 60, 70: rows 2 and 3 are excluded, so `fit(ZScore, {"feature": "x"}, manifest)` learns from the development `x` 1 and 3 only. The artifact is `{"feature":"x","mean":2.0,"std":1.0}`, `fitted_artifact_digest sha256:fbf8f579b0f145e9ad76e7e3f8af02be40de3a37827ef4ca06bee599d89e6147`, `config_digest sha256:f1b30a02d3d263e97f67f3c15303604d3e43d7e6501a8432fa28b56c12a21325`, `rows_digest sha256:d72acad75fff3b50a27d12d6a7234782342c43167a294ac1f9e579a74665beed` (the hasher over the two development rows as the source gave them). The same build with `label_horizons (2,)` → "label_horizons [2] differ from promotion.directional.horizons [1]"; with the setting unbound → "unbound promotion.directional.horizons". `apply` to the scripted exam's rows gives `x_z` 3.0 and 4.0; to the same rows with `x` 7.0 and 8.0 gives 5.0 and 6.0. `fitted_artifact_digest` and `fit.json` are unchanged, `applications` has two entries, and a spy on `ZScore.fit` sees one call. `fit` over the scripted exam's manifest → "fit refuses datasets containing locked_oos rows". One byte of `artifact.bin` changed → `apply` raises "fitted artifact changed: {transform_id}" |
| Disclosures | Over the scripted exam: `disclose(evaluation_identity="sha256:" + "e"*64, dataset_identity=manifest identity, custody_reservation_id, exam_trial_id "c00000000002", metrics={"rows": 2}, outcome="eligible", actor="research")` and a second with `evaluation_identity None`, `outcome "failed"` leave two files under `metric-disclosures/`; `metrics_digest` is `sha256:19b98918aa59c26ee086d8a818e64fded188be8b6e213ac21eea6ec19fa3bc00`; `disclosures(identity)` returns both, in order. Publishing an existing ID → "disclosure_exists: {id}" |
| Consistency | On a fresh declared `P0`: a custody `reserve` made directly → `orphan_reservation` `[its ID]`; a `reserved` row for trial `"zz0000000000"` written by `_audit_locked_oos_access` → `orphan_access` `[its ID]`; a claim made directly with no consumption → `claim_unconsumed` `[its reservation ID]`; a claim and a custody `consume` made directly on an exam whose reservation has a row → `consumption_unrecorded` `[its reservation ID]`; `locked-oos-access/bad.json` containing `[` → `unreadable` `["bad.json"]`, while an exam `open` refuses with a message starting "historical custody is ineligible: legacy custody record is corrupt:". After the scripted exam alone, all five lists are empty |

**`tests/unit/test_candidate_freeze.py` (T-85), PRF-RES-08.** `IDS` is the twelve identities in legacy's order, valued `"sha256:" + c*64` for c in `123456789abc`; `PROH` is the fixed v1 list. Each bundle below is legacy-valid:

| Group | Cases |
|---|---|
| Digests | **strategy_config:** artifacts `source_snapshot` (`strategy.py`, `python-source/v1`, bytes `def run():\n    return 1\n`) then `configuration` (`config.json`, `application/json`, bytes `{"lookback":20}`); `family_identity {entrypoint "strat.module:run", source_snapshot_digest, configuration_digest}`; `capability deterministic_strategy`, `search_family strategy_grid`, counts `{candidate 3, parameter 12}` → `sha256:d29cccc7879ad3290d0706b6f98f19959f422eed1cd8c08ef13c13d48196332e`, `bundle.json` 2,010 bytes, SHA-256 `d40b9d83b33de9e8d37b0c515bd62d8b5b4354aebe32294cc660311fe58a15ee`; the two artifacts in reverse order → `sha256:6fd814f0b55f73eb0accc8ff58e9318f6e9f33982f3155070027fda690240a85`. **advisor:** `prompt` (`prompt.txt`, `You are a cautious advisor.\n`), `advisor_config` (`advisor.json`, `{"temperature":0}`), `prompt_version v1`, `model_identity_digest "sha256:" + "d"*64`, `adapter_identity_digest "sha256:" + "e"*64`, `advisor_search`, `{2, 0}` → `sha256:ffe96ebd40338245ddf3b543515608d8ec3cee0d4fba1cf4c11a14517d0628d7`. **ai_management:** `blueprint` `{"lead":"a"}`, `members` `["a","b"]`, `edges` `[["a","b"]]`, `lead_policy` `{"policy":"lead_decides"}` (files `blueprint.json`, `members.json`, `edges.json`, `lead.json`), `team_decision`, `management_search`, `{1, 0}` → `sha256:15b8ff29358c66e24497f8dde5b9470a96672fd4fbcddec5b1a180ca5550e03c`. **local_model:** `model_spec` `{"spec":1}`, `model_artifact` `{"artifact":1}`, `model_payload` `{"weights":[0.5]}` (`spec.json`, `artifact.json`, `model.json` as `safe-json-model/v1`), `family_identity {model_spec_digest "d"*64, model_artifact_digest "e"*64, data_identity = IDS dataset, classifier, safe-json-model/v1, regime}`, `regime`, `model_search`, `{4, 8}` → `sha256:49997e638f0c6054ebdd13b3426bc03bafd31325d208d6a615c7d87289afb94f`. **research_policy:** `policy_manifest` `{"policy":"ppo"}` (`policy.json`), `policy_weights` bytes `\x00\x01weights` (`weights.bin`, `research-policy-weights/v1`), `policy_digest "d"*64`, `observation_digest "e"*64`, `environment_digest "f"*64`, `reward_digest "0"*64`, `assumptions_digest "1"*64`, `reference_digest "2"*64`, `policy_view`, `model_search`, `{40, 40}` → `sha256:1752e3ff3661fa2cad8f9731d350296c749df4157226829c5875054fdc41c5fe` |
| Refusals | strategy_config with `family_identity.api_key "x"` → "candidate may not contain prohibited field api_key"; with the `configuration` artifact's digest `"sha256:" + "0"*64` → "configuration_digest must match configuration artifact" |
| Registry | `publish` the strategy_config bundle with its two byte strings → `sha256:d29c…332e`, directory `d29c…332e` holding exactly `bundle.json`, `strategy.py`, `config.json`; `load` returns the same bytes; publishing again returns the digest and writes nothing. One byte of `config.json` changed (made writable first on POSIX) → "candidate artifact configuration digest mismatch: expected sha256:…, got sha256:…"; an extra file → "candidate bundle directory has missing or unexpected files"; `load("latest")` → "candidate digest must be canonical sha256:<hex>"; publishing the local_model bundle → "candidate family local_model is verified from step 5" |
| CandidateId | `candidate_id("rule", strategy="model_s", strategy_version="1", code_digest="a"*64)` = `07b131249ea51fd9959c14a98878f5a9fb8700c6260e5d51cdc7c474ce05be97`. `candidate_id("model", …, model_identity=CAND, prompt_digest="sha256:" + "5"*64)` = `a7281fd358cf1888171486e008d718bd33208b78f610e67087b6690b9b99b740`; with prompt `"6"*64` → `74bd7bf62a074d8a8eda39a8b79015bd4eb4add013a6fe1cbac329ab10eea5bf`; with `model_artifact_digest "sha256:" + "7"*64` → `830f72a8022e8568f4a7774f388b89da2ea6894a2f063aac81a56fdc92003702`; with no prompt → "prompt_digest must be canonical sha256:<hex>"; with family `"x"` → "promotion identity bundle has unsupported strategy_family". `candidate_id("bundle", bundle=…)` for the strategy_config bundle = `d29cccc7879ad3290d0706b6f98f19959f422eed1cd8c08ef13c13d48196332e`. These three values have no legacy counterpart; they are `contracts/identity.py`'s `canonical_json` hashed with SHA-256 |
| Golden | Every bundle and identity entry of `tests/fixtures/research/legacy_identity_445eb116.json` (T-86) recomputes equal; the group skips while the file is absent, as step 1's does |

**`tests/recovery/test_crash_boundaries.py`, CP-R2…CP-R7 and CP-R10, by killing a real process.** Each child runs the scripted exam's setup under `base` and exits with `os._exit(86)` at its point; the parent asserts exit 86, then:

| Point | Child patch | Parent asserts |
|---|---|---|
| CP-R2 | `_audit_locked_oos_access` exits when `status == "reserved"` | `partition_state(P0)` `reserved`; no access row, no exam file; a new exam `open` → the custody message "locked scope is already reserved, consumed, or ineligible", with a `denied` row; `consistency().orphan_reservation` names the reservation |
| CP-R3 | `_write` exits for the exam's trial | a `reserved` row naming `c00000000002`, no exam file; a new exam → "locked out-of-sample partition already consumed: …"; `orphan_access` names the row |
| CP-R4 | `LOCKED_SRC.rows` exits | `read_claimed` with no `consumption`; `consistency().claim_unconsumed` is `["000000000c0570d70000000000000007"]`; `claim_read` again → "reservation already has its one-time read claim". The child ran the build inside a job it claimed (lease 0.5 s, `attempt_context`); after 0.6 s the parent's `reconcile_expired()` closes the exam `crashed` with `extensions.interrupted` true **(re-check at build)** |
| CP-R5 | `complete_locked_oos_access` exits on entry | `manifest.json` present and `read()` verifies; `locked_evidence` → "locked_oos consumption trial is absent or incomplete"; no `consumption` in custody; `consistency().claim_unconsumed` is `["000000000c0570d70000000000000007"]` |
| CP-R6 | `_audit_locked_oos_access` exits when `status == "consumed"` | custody `consumption` present, no `consumed` row; `consumption_unrecorded` names the reservation; `locked_evidence` refuses; `complete_locked_oos_access` again → "reservation is already consumed" |
| CP-R7 | `TrialLedger.close` exits for outcome `completed` | both rows present; the exam `running`; `locked_evidence` → "locked_oos consumption trial is absent or incomplete" |
| CP-R10 | the stage-to-digest `os.rename` in `publish` exits | one `.candidate-*` directory, no digest directory; `verify(digest)` → starts "candidate bundle is missing"; `publish` again succeeds and leaves the stage untouched |

**Existing tests that change:** T-81's step 2 case "`data_roles={P0: "locked_oos"}` refuses (step 3)" becomes a case that the locked open succeeds and writes its `reserved` row.

### Break checks

The minimum set. Each anchor is checked present exactly once, one mutation at a time, each file restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| `build`: `complete_locked_oos_access` moved before the manifest write | Three stores (order); CP-R5 |
| `locked_evidence`: the access-row checks removed | Locked evidence (`c00000000004.json` deleted) |
| `open`'s locked branch: the trial written before the `reserved` row | Three stores; CP-R3 |
| `locked_oos_uses`: access rows ignored | CP-R3 |
| The `denied` row not written | One use |
| `apply` calls `fit` | Fits (spy, digest unchanged) |
| `fit` reads rows without `eligible_only` | Fits (`x` 99 learned) |
| `fit` reads validation (fits on development and validation rows) | Fits (mean and `rows_digest`) |
| `build`: the bound-horizons comparison removed | Fits (`label_horizons (2,)`) |
| `consistency`: `claim_unconsumed` not computed | Consistency; CP-R4 |
| `candidate_id("model")`: `prompt_digest` left out | CandidateId (prompt 6) |
| `to_dict`: artifacts sorted by name | Digests (reverse order) |
| `verify`: no re-hash of artifacts | Registry (one byte changed) |
| `consistency`: `consumption_unrecorded` not computed | Consistency; CP-R6 |
| `disclose` writes no record for `failed` | Disclosures |
| `walk_forward_metadata`: the purge comparison removed | Walk-forward (`purge=4`) |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/research/trials.py` | The locked branch of `open`, the access ledger, `declare_partition`, disclosures, the consistency scan |
| `src/autonomous_trading/research/bundles.py` | `EvidencePartition`, `HistoricalLockAttestation` |
| `src/autonomous_trading/research/datasets.py` | New: the build, the row source, walk-forward and purging, reads, `locked_evidence`, fit records, `ZScore` |
| `src/autonomous_trading/research/candidates.py` | New: `CandidateBundle/v1`, the registry, `candidate_id` |
| `tests/unit/test_dataset_fitting.py` | New (T-84) |
| `tests/unit/test_candidate_freeze.py` | New (T-85) |
| `tests/unit/test_research_attempts.py` | The locked-open case |
| `tests/recovery/test_crash_boundaries.py` | Seven children (CP-R2…CP-R7, CP-R10), their tests and `__main__` branches |
| `src/autonomous_trading/settings/schema.py` | The field `promotion.directional.horizons` and its kind `horizons` (with the loader's check for that kind) |
| `src/autonomous_trading/resources/defaults.yaml` | `promotion.directional.horizons`, unset |

No kernel module, schema, event kind or migration changes.

### Completion conditions (step 3)

* **Targeted tests only:** `tests/unit/test_dataset_fitting.py`, `tests/unit/test_candidate_freeze.py`, `tests/unit/test_research_attempts.py`, `tests/recovery/test_crash_boundaries.py` (the whole file), `tests/unit/test_settings_resolver.py` (the new field) and `tests/contracts/`, twice in a row on Windows. No case needs Linux.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file. Every legacy-derived hex value in the tests is recomputed from legacy's code as above.
* `git diff --name-only` names exactly the files above; one commit in OA_NEW; nothing pushed.
* This file records step 3 "as built", with any Fork call or Deviation the build adds.

### Step 3 as built

**In plain words.** The one-time exam now works in the new system exactly as in the old one: three records written in a fixed order, the dataset written before the spend is recorded, and every crash point leaving the exam days spent and the half-built dataset unusable. A read-only check lists what a crash leaves behind. Every evaluation over exam days can leave its note. A learned normaliser records what it learned from and never relearns on exam rows. Finished candidates are frozen by the old system's fingerprint, and a model strategy's prompt and model are part of its identity. Nothing here touches trading.

Commit `d9536ce` on `slice-08`, on top of `d4e8cb2` (step 2). It adds `research/datasets.py`, `research/candidates.py`, `tests/unit/test_dataset_fitting.py` and `tests/unit/test_candidate_freeze.py`, and changes `research/trials.py`, `research/bundles.py`, `settings/schema.py`, `settings/loader.py` (the `horizons` kind), `resources/defaults.yaml`, `tests/recovery/test_crash_boundaries.py` and `tests/unit/test_research_attempts.py`: 11 files, 3,758 lines added, 8 removed. Not pushed.

**Re-checked against step 2 as built, before building:** every "(re-check at build)" decision held unchanged: `_publish_once`, `_locked_oos_open` on `.locked-oos-open.lock`, the `.closed.json` name, the ledger's `clock` and `new_id`, the attempt-first extensions order, and expiry closing a job's running trials (CP-R4).

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Legacy values | Every legacy-derived length and hash in T-84 and T-85 equalled legacy's on the first run: the declaration, the exam's open and closing files, both access rows, `read_claim_digest`, the walk-forward, purging and row-eligibility values, the partition declaration and all five bundle digests |
| The baseline's advisor | `RowSource` gained `baseline_advisor(strategy) -> str`, which `build` calls before any read, as legacy checked the baseline's declared advisor before reading (`datasets/__init__.py:1843-1852`). The text put the advisor in the `RowBatch`, which arrives after the read claim and would spend the partition on a refusal. **Deviation** from the text, legacy's order kept |
| The registry on POSIX | The registry uses joined paths with an `lstat` that refuses links on every platform, POSIX included; the text kept `dir_fd` on POSIX. **Deviation:** a narrower race window is left open on POSIX between the check and the open; research-only, no money path |
| `EvaluationError` | Defined in `research/datasets.py` for `locked_evidence`; step 4's evaluation imports it from there |
| `build`'s settings | `build` reads `settings.promotion_directional_horizons`; the tests pass a stand-in object with that one attribute, legacy's `(5, 15, 30)` for the scripted exam and the synthetic `(1,)` for the fits |
| Break checks | 16, the listed set: each fails a listed test, every file restored (md5). Script: `s12c_breaks.py` in the session scratchpad |

**Tests run (Windows, targeted only):** `tests/unit/test_dataset_fitting.py`, `tests/unit/test_candidate_freeze.py`, `tests/unit/test_research_attempts.py`, `tests/integration/test_research_worker.py`, `tests/recovery/test_crash_boundaries.py`, `tests/unit/test_settings_resolver.py`, `tests/contracts/` and `tests/unit/test_canvas_causality.py`: 259 passed, 1 skipped (Golden, T-86 absent), twice in a row. CP-R2…CP-R7 and CP-R10 killed a real child process each (exit 86). `ast.parse` passes on every edited file.

## Step 4 — replay and evaluation

<a id="step-4--replay-and-evaluation-outline"></a>

The authorities are the spec's [Replay and the simulated fill model](../../design/research-rl-custody-promotion.md#replay-and-the-simulated-fill-model-researchreplaypy) and [Evaluation](../../design/research-rl-custody-promotion.md#evaluation-researchevaluationpy), PRF-RES-09, PRF-RES-10 and the rule part of PRF-DSP-12. Step 4 is TASK-S12-04. It builds on step 3 as built (`d9536ce`), SLICE-07's simulated broker as built (only `ScriptResponder` exists; this step adds `RuleResponder`), SLICE-08's market store and SLICE-09's run records and replay composition (`compose_cognition_replay`, PRF-STR-11 in `tests/integration/test_shared_engine.py`). A decision that leans on a step 3 or SLICE-07/09 detail not re-read here is marked **(re-check at build)**. Every legacy citation is at 445eb116: `historical.py` is `src/analysis/execution/historical.py`; `charges.py` is `src/analysis/core/charges.py`; `trades.py` is `src/analysis/core/trades.py`; `corrections.py`, `metrics.py`, `selection.py`, `advisor_economics.py`, `promotion_evidence.py` and `cost_reconciliation.py` are under `src/analysis/core/`; `value.py`, `promotion.py` and `promotion_bar.py` are under `src/runtime/advisor/`; `candidate.py` is `src/analysis/evaluation/candidate.py`; `environment.py` is `src/analysis/rl/environment.py`; `datasets/__init__.py` as in step 3. Every number below was computed on 2026-11-03 by running legacy's own functions (`charges.round_trip`, `HistoricalExecutionAdapter.execute`, `clustered_effective_n`, `wilson_interval`, `deflated_sharpe_ratio`) on the synthetic inputs shown, with `src.config` stubbed to return nothing and the rate histories passed as legacy's shipped constants, which equal its 19 October `costs.*` defaults (`config/defaults.yaml` `costs:` section). The script is `s12d_values.py` in the session scratchpad. No production record was read.

**In plain words.** This step rebuilds the exam itself. A candidate is replayed through the real trading rules, the same kernel that trades, but against a simulated broker that fills orders from recorded market bars. The broker's fill rule and the cost rule are the old system's exactly: an exam buy fills at the first recorded asking price after the decision, the position is sold at the last recorded bid before the session close, only when the quote covers the whole quantity and never in part, and a position that cannot be sold counts as no trade; charges are the dated statutory estimates the owner chose on 19 October. A second, test-only fill rule can reject, delay or part-fill orders, and only a test setup accepts it. The replay never reaches the network or the broker. The pass-or-fail rule is the old one, unchanged: the same confidence interval, the same correction for days that look alike, the same minimum counts, and an unmeasurable correlation still fails. Every evaluation over exam days leaves its note, even when it fails. Nothing here can place, block or change a real trade.

### Decisions

#### The cost model (`research/replay.py`)

* **Ported unchanged (Fork call: POL-025 and the owner's 19 October estimated-cost defaults):** `STATUTORY_KEYS`, `TARIFF_KEYS`, `SETTLEMENTS`, `REPRICING_POLICIES`, `STATUTORY_RATE_HISTORY`, `BROKER_TARIFF_HISTORY`, `DEFAULT_*`, `RATE_HISTORY`, `_digest`, `_selected`, `rates_for`, `statutory_rates_for`, `broker_tariff_for` (`charges.py:30-113`); `rate_set_for` (`:194-237`); `SOURCES`, `Leg`, `_brokerage`, `_leg` with its GST basis, `_exercise_leg`, `_combined`, `leg`, `round_trip`, `charges_points`, `verify_against` (`:240-428`), with every message. The cost model's identity is `COST_MODEL_IDENTITY = "option_execution_costs_v2"` and its charges source `"dated_statutory_estimate"` (legacy `trades.py:514-517`).
* **Settings in place of the global config (Deviation, plumbing only).** Legacy's `configured_statutory_history`, `configured_broker_tariff_history` and `configured_overrides` read `config.section("costs")` (`charges.py:116-171`). The target passes a `CostSettings(use_estimates, repricing, contract_notes_enabled, statutory_history, broker_tariff_history, overrides)`, built from the participant's `Settings`, as the keyword `costs=` of `rate_set_for`, `leg` and `round_trip`. `costs=None` is legacy's `use_config=False` (the code constants). An empty history falls back to the code constants, as legacy (`charges.py:121-122`). `source(costs)` returns `"estimate"` when `use_estimates`, else `"broker"` (`charges.py:243-253`); legacy's older alias key `charges.source` and the flattened `configured_rates()` view are not ported.
* **Six settings, shipped with legacy's 19 October values (Fork call; register `legacy`; scope `research-offline` and `research-model`; no environment names):** `costs.use_estimates` (`bool`, `true`); `costs.repricing` (`enum` `point_in_time`, `current`; `point_in_time`); `costs.contract_notes.enabled` (`bool`, `false`); `costs.statutory_history` (new kind `rate_history`: a non-empty list of mappings, each an ISO `as_of` text plus the six `STATUTORY_KEYS` as finite numbers of at least 0; anything else `CFG-R03` with legacy's texts "costs.statutory_history contains an invalid rate set" and "costs.statutory_history is missing {key}"), legacy's three rows (`2024-10-01`, `2026-03-01`, `2026-04-01`); `costs.broker_tariff_history` (new kind `tariff_history`, the same rule over `TARIFF_KEYS`), legacy's one row (`2024-10-01`, `brokerage_per_order` 20.0, `brokerage_rate` 0.0); `costs.rates` (new kind `rate_overrides`: a mapping whose keys are among `as_of`, the six statutory keys and the two tariff keys, numbers finite and at least 0), shipped `{}`. Legacy shipped a flattened `rates:` block too, but it counted only when `config.is_overridden` (`charges.py:156-160`), so its shipped values were never overrides; `{}` is the same behaviour. All six are written into `resources/defaults.yaml`; none is in `fields_required`.

#### The fill model (`research/replay.py`)

* **Ported unchanged (Fork call, slice Fork call 17):** `DIRECT_RECORDED`, `SIMULATED_QUOTE`, `SIMULATED_BAR`, `UNAVAILABLE`, `EVIDENCE_CLASSES`, `FILL_MODEL_VERSION = "historical-fill-v2"` (`historical.py:21-28`); `FillAssumptions` and its checks (`:96-129`); `ExecutionResult`, `PositionResult` (`:132-267`); `HistoricalExecutionAdapter` (`:270-434`, `send` raises "historical execution is disarmed and cannot send orders"); `_order`, `_direct_fill`, `_quote_fill`, `_bar_fill`, `_adverse`, `_positive`, `_first_causal`, `_event_at`, `_available_at`, `_instant`, `_digest`, `_event`, `_lifecycle` (`:437-620`). Legacy's `states` constants become the literals `"formed"`, `"sent"`, `"ack"`, `"filled"` (`src/core/framework/execution/states.py:27-41`).
* **`FillAssumptions` is `@dataclass(frozen=True, kw_only=True)`,** legacy's fields in legacy's order (so `asdict`, and every digest over it, is legacy's). The exam constructs `FillAssumptions()`, legacy's defaults (0 bps, Fork call 17). RL runs pass both slippage values explicitly (slice Deviation 15): `rl_fill_assumptions(*, quote_slippage_bps, bar_slippage_bps)` has no defaults and raises `TypeError` without them.
* **The exam model (Fork call 17).** `QuoteFillModel()`: `identity = FILL_MODEL_VERSION`, `evidence_class = SIMULATED_QUOTE`, `assumptions = FillAssumptions()`, `digest = "sha256:" + legacy_digest(dataclasses.asdict(assumptions))` (legacy's `fill_assumptions_digest`, `environment.py:260`). `decide(order, quotes)` is `execute(order, quotes, evidence_class=SIMULATED_QUOTE)`: the ask (a buy) or bid (a sell) of the first quote whose event is at or after the decision and whose size covers the quantity, filled at its `available_at`, no tick rule. Quotes are legacy's `_quote_evidence` rows (`src/data/replay_engine/producer.py:883-927`, ported unchanged) over the market store's chain records (`ce_`/`pe_` `bid`, `ask`, `bid_size`, `ask_size`) **(re-check at build: the store's chain payload names)**. The exit time is legacy's session-close boundary (`producer.py:930-965`, ported unchanged): the last causal quote after entry available at or before the bound strategy policy's session close.
* **The bar model (shared RL tier only).** `BarFillModel(assumptions)`: `evidence_class = SIMULATED_BAR`, `decide` is `execute(order, rows, evidence_class=SIMULATED_BAR)` (next-open, volume covering the quantity), no tick rule. `ReplaySource` and every dataset build refuse any model but `QuoteFillModel`: `ReplayRefused("exam_replays_use_the_quote_model")`.
* **The tick rule stays in the abstract tier.** `on_tick` and `round_to_tick` (`environment.py:655-667`) are step 5's; neither replay model applies them.

#### The test-only declared rule (`research/replay.py`)

* **`ScriptedPartialDelay(script: Mapping[int, Mapping], bar_slippage_bps: float)`**, `identity = "scripted_partial_delay/test"`, `digest = "sha256:" + legacy_digest({"identity", "script", "bar_slippage_bps"})`. The key is the order's 1-based send number in the run. Each value is exactly one of `{"reject": reason}` (the order is refused at once), `{"fill": [[bars_after, quantity], ...]}` (each part fills at the open of the `bars_after`-th causal bar after the decision, with the slippage, no tick rule, no volume check) or `{"never": true}` (acknowledged, never filled). An order the script does not name fills whole at the next bar, as the shipped model but without the volume check. Parts must sum to at most the order's quantity, else `ValueError("scripted parts exceed the order")`.
* **Accepted only by a test composition (slice Fork call 17).** `compose_replay_engine(..., label)` takes `label` `"research"` or `"test"`. `start` refuses a `ReplaySpec` whose fill model's identity ends with `/test` unless the label is `"test"`: `ReplayRefused("test_rule_outside_test_composition")`. Every research job composes with `"research"`; nothing in `src` composes `"test"`.

#### The `RuleResponder` (`adapters/simulated_broker.py`)

* **`RuleResponder(model, evidence, *, clock)`.** `model` has `identity`, `digest`, `evidence_class` and `decide`; `evidence(instrument: str) -> list[dict]` returns that instrument's recorded rows in the model's legacy shape: quotes `{"symbol", "at", "available_at", "bid", "ask", "bid_size", "ask_size"}` for the quote model, one-minute bars `{"symbol", "at", "available_at", "open", "volume"}` (bar start, bar end) for the bar model. The adapter never imports research: `bootstrap.py` passes both objects.
* **Every request is accepted.** `respond(request, plan, account) -> dict` returns a step dict that `SimulatedBroker.send` uses in place of `responder.take(account)` when the responder has `respond`: `{"result": "ack", "order_id": f"R{n:06d}", "fill_model": identity, "fill_model_digest": digest}` with `n` the run's send number from 1; a cancel acknowledges its target; a modify acknowledges in place. An entry's protective legs are acknowledged as `R{n:06d}-{role}` resting orders and are never filled (intra-bar execution is not modelled, slice Fork call 17). An entry or close order is held as pending: `{order_id, instrument, side, quantity, decision_at: clock.now().utc_iso, n}`.
* **Fills happen when their bar has arrived.** `due(now_iso) -> list[BookStep]`, called by `SimulatedBroker._apply_due` before it applies its own steps (one added call, when the responder has `due`): for each pending order whose first causal row (legacy `_first_causal`, `strictly_after` false for quotes and true for bars, `historical.py:497-534`) has `available_at <= now`, `model.decide`; an available decision gives `BookStep(at=fill_at in UTC, kind="fill", quantity, price=<the price's eight-decimal text with trailing zeros trimmed, keeping at least two decimals: 100.0 → "100.00", 104.052 → "104.052">, fill_id=f"F{n:06d}")`; an unavailable one gives `BookStep(kind="status", status="rejected")` and records `{order_id, reason}` in `responder.outcomes`. `expire(at)` (called by `finish`) marks every pending order `cancelled` with the model's legacy reason ("no causal quote exists for the requested symbol" or "no later option bar exists for a causal next-open fill"). The test rule is driven through the same three calls.
* **What every result carries.** The `TransportResult`'s published evidence content gains `"fill_model"` and `"fill_model_digest"`, and its domain is always `simulated` (PRF-DSP-12, rule part). `funds` returns the run's capital through `set_funds` (execution spec).

#### The `EnginePort` and the driver (`research/replay.py`, composed in `bootstrap.py`)

* **The types**, frozen dataclasses in `research/replay.py`, which imports only the standard library, `autonomous_trading.contracts` and research modules:
  * `ReplaySpec(strategy, package, candidate_id, market_store, day, account, capital, fill, costs, session_open, session_close, bar_secs=60, replay_root=None)`, `fill` a `QuoteFillModel`, `BarFillModel` or `ScriptedPartialDelay`, `candidate_id` the 64-hex identity the run must load, `replay_root` a staged cognition replay directory or `None`; `spec_digest = "sha256:" + legacy_digest(spec.as_dict())`.
  * `RunRef(run_id)`, `run_id = spec_digest`; a second `start` of the same spec in one engine refuses `ReplayRefused("run_exists")`.
  * `StepResult(run_id, until, decisions, admissions, effects, positions, pending)`: the kernel's decision rows, `COMMAND_ADMITTED` and `ADMISSION_REFUSED` (with the refusal code), each FILL and status change, the open positions with their owned quantity, and the responder's still-pending orders, all since the previous step; every effect has `outcome_class "simulated"`, `fill_model` and `fill_model_digest`.
  * `ReplayResult(run_id, spec_digest, fill_model, fill_model_digest, cost_model, positions, outcomes, receipt, result_digest)`.
  * `EnginePort(Protocol)`: `start(spec) -> RunRef`, `step(run, until, proposal=None) -> StepResult`, `close(run, at) -> StepResult`, `finish(run) -> ReplayResult`. **Deviation:** the spec names three methods; `proposal` (the RL shared tier's action for a model strategy's next decision) and `close` (an exit at a chosen instant) are added here so step 5 needs no port change.
* **`compose_replay_engine(settings, *, work_root, label, registry, packages, view_policies) -> ReplayEngine`** in `bootstrap.py`, the only place that touches the kernel. Per `start`: copy `spec.market_store` into `work_root/<run hex>/market.sqlite` with SQLite's online backup; a `RecordedClock` at `session_open` less one second; `compose_simulation` over `work_root/<run hex>/ledger.sqlite` with a `SimulatedBroker(RuleResponder(spec.fill, bars, clock=clock), clock, evidence=...)`, the production planner and admission ports, `protection_loop=True`, and the owner's in-process authority binding the spec's strategy candidate and issuing its grant (as `_kernel` in `tests/integration/test_shared_engine.py` does, through the authority's own methods rather than the test helpers) **(re-check at build: the non-test calls that equal `owner_authorize` and `owner_issue`)**. Then `compose_strategy_host(settings, HostSettings(settings.strategies_host_pass_secs, settings.strategies_host_seal_wait_ms, settings.strategies_host_review_retry_ms), registry=registry, strategy_id=spec.strategy, kernel=InProcessKernel(comp, Principal(f"strategy:{spec.strategy}", "service")), reviews=reviews, market_path=<the copy>, view_policies=view_policies, store_path=work_root/<run hex>/host.sqlite, clock=clock, sleep=<a sleeper that advances the recorded clock>, packages=packages, proposals=...)`, every parameter the function takes. `reviews` is `compose_review_producer(InProcessReviews(comp), cognition=c, record_root=work_root/<run hex>/records, work_root=work_root/<run hex>/work, clock=<epoch of the recorded clock>)`, where `c` is `compose_cognition_replay(settings, work_root=..., record_root=..., replay_root=spec.replay_root, publish=..., clock=..., sleep=...)` when `spec.replay_root` is set (no credential, every role answered from staged records) and `None` otherwise **(re-check at build: how a `None` cognition answers a required review)**. **The loaded candidate is the spec's.** After composing, the host's `candidate_id`, computed from the files it loaded, must equal `spec.candidate_id`, else `ReplayRefused("candidate_mismatch")` and nothing runs. A model strategy's `proposals` port is `QueuedProposals`, whose `propose` returns the `ProposalResult` the last `step(..., proposal=)` queued, or an abstention `("no_proposal", "external_proposer_idle")`. The composition binds no OpenAlgo adapter and has no `port` or `port_factory` parameter: **replay never sends**.
* **`step(run, until)`** advances the clock one `bar_secs` at a time to `until`; at each boundary it runs the host's `run_pass()`, the coordinator's `run_pass()` and the observation loop's `read_once(account)`, then reads the ledger events after its cursor. **`close(run, at)`** submits the kernel's close of every open position of the run's strategy as the owner (`comp.owner_auth`), then steps to `at`. **`finish(run)`** calls `responder.expire`, books each position (below), writes the `ReplayResult` to `work_root/<run hex>/result.json` (legacy digest form) and closes the store and ledger.
* **Booking a position (Fork call 17).** A closed position books `gross_points = round(exit - entry, 8)` and `round_trip(entry, quantity, exit_premium=exit, entry_side="buy", entry_day, exit_day, costs=spec.costs)`; `net_points = round(gross_points - charges_points, 8)`, `net_rupees = round(gross_points * quantity - charges_rupees, 2)`. **An exam exit that cannot fill books no trade,** as legacy wrote only the base outcome when the completion was unavailable (`producer.py:806-818`, `:1021-1022`): the position appears in `outcomes` with its reason and in no economic row. Only the shared RL tier (step 5) books an unfilled end-of-episode exit at legacy's research worst case. Each booked trade carries an `economic_outcome` projection with the fields `promotion_evidence.py:132-156` and `:273-330` read (`cost_source "dated_statutory_estimate"`, `cost_complete`, `estimate_model`, `repricing`, `rates_as_of`, `rates_in_force`, `rate_set`, `rate_set_digest`, `entry_stamp`, `execution_evidence_class "simulated_bar"`, `raw_outcome_digest`, gross, charges and net rupees) and `projection_digest = "sha256:" + legacy_digest(<the projection without projection_digest>)` (**Deviation:** legacy's projection builder in `economic_outcomes.py` is not ported; the fields are the ones the track selection reads).
* **The receipt.** `receipt = {"partition_id", "bundle_id", "day", "replay_run_id": run_id, "fill_model_identity", "strategy", "code_identity", "config_identity", "prompt_identity", "planner_identity", "candidate_bundle_digest", "input_digest", "clock_identity", "cost_model_identity"}`, the fields `_replay_receipt_identity` reads (`promotion_evidence.py:159-187`), each digest `sha256:`: `code_identity` the strategy's `candidate_id` as `sha256:`; `config_identity` the legacy digest of the strategy's registry row; `prompt_identity` the prompt digest for a model strategy and `"sha256:" + legacy_digest("")` for a rule strategy; `planner_identity` the legacy digest of the bound planner policy; `candidate_bundle_digest` is `"sha256:" + <the candidate_id the host computed from the files it loaded>` (checked equal to `spec.candidate_id` at `start`, and for a bundle candidate equal to the bundle digest); `input_digest` the copied store's file SHA-256; `clock_identity` the legacy digest of `{session_open, session_close, bar_secs}`.
* **The dataset row source.** `ReplaySource(engine, spec_for)` implements step 3's `RowSource`: `baseline_advisor(name)` is `f"rule:{name}"` for a rule strategy (legacy's two baselines are `rule:breakout` and `rule:ema_cross`, `config/defaults.yaml:761`), `""` otherwise; `rows(...)` replays each day once through the engine and returns one row per decision `{day, seq, strategy, data_role, answer, labels: {directional, economics}}`, the directional labels by legacy's rule (`value.py:72-84`, `:192-222`, `FLAT = 0.0002`) over the run's own underlying closes, `labels.economics` the decision's economic row with `decision_id` (`advisor_economics.decision_id_for`, `:26-29`), its trades, `replay_receipt` and `replay_outcome`; `economic_book` the run's booked trades; `sources` each `result.json` with its SHA-256. A new job type `research.dataset_build` (offline profile, timeout 3600 s, `retry_policy none`, not resumable) runs `build` with this source. **(re-check at build: step 3's `build` signature as built.)**

#### Evaluation (`research/evaluation.py`)

* **The statistic, ported unchanged (Fork call, slice Fork call 5):** `intracluster_rho` (`metrics.py:353-386`), `clustered_effective_n` (`corrections.py:176-242`), `wilson_interval` (`:245-279`, `z` now a required argument, slice Deviation 18), `_interval` (`value.py:225-241`), `report_from_labels` and `_move_fields` (`:341-426`, with `horizons` and `z` required), `directional_from_report` (`promotion.py:149-170`).
* **The gate and the frozen rule, ported unchanged (Fork calls 5, 7, 13):** `evaluate_gate` (`promotion.py:61-146`) with `horizons` and `minimum_scored_per_horizon` required, and no config fallback (slice Deviation 18); `_frozen_rule_parameters` (`:288-318`) comparing with the bound settings; `evaluation_identity` (`:321-330`).
* **The bar's verdict, ported unchanged (Fork call, slice Fork call 6):** `promotion_bar.py:30-412` as `bar(candidate, baseline, *, values, evidence_track, promotion_evidence)`: `values` required (step 6 binds `promotion.bar.*`; `configured_values` is not ported), every `>=` and every reason text kept. Step 6's recording imports it from here.
* **Economics and track, ported unchanged (Fork call 7):** `decision_id_for`, `summarize_rows` (`advisor_economics.py:26-37`, `:310-439`), `summarize_observed_rows` (`:1362` to its end); `promotion_evidence.py:26-522` (`select_track` and its helpers; `gate_from_records` is not ported); `cost_reconciliation.py:248-307` (`ledger_dir`, `records`, `reconciled_days`) over `cost_root`, which is `<research.trial_root>/cost-reconciliation` (**Deviation:** legacy's default location). With contract notes off (`costs.contract_notes.enabled: false`) the ledger is empty and `costs_reconciled` is false, so the real track refuses and the estimated track is the one that can pass, as legacy.
* **Selection, advisory only (Fork call, slice Fork call 15):** `selection.py:19-37`, `:103-163`, `:165-219`, `:222-360`; `_selection`, `_selection_statistics`, `_dsr_bootstrap_interval`, `_sharpe` (`candidate.py:395-574`). Nothing in the gate reads `selection`.
* **The rest of the sequence, ported unchanged:** `_unavailable_baseline`, `_baseline_economics`, `_calibration` (`candidate.py:304-392`), `_apply_lineage_status` (`:577-592`), `_agreement`, `_candidate` (`:595-664`), `_locked_freeze` (`:853-909`) over step 3's `CandidateRegistry` and its frozen-evaluation check **(re-check at build: step 3's name for legacy's `validate_locked_evaluation`)**.
* **`evaluate(candidate, dataset, *, champion, baseline, ledger, settings, cost_root, clock, actor, frozen_acceptance_rule=None, lineage_repair_digest="") -> dict`** follows `candidate.py:928-1074` in order, with these changes:
  1. Before any read: `promotion.directional.horizons`, `.min_scored_per_horizon` and `.z` must be bound, else `EvaluationError("unbound promotion.directional.<name>")`.
  2. `ledger` is passed; `locked_evidence` is step 3's.
  3. A manifest with `evidence_claims` refuses: `EvaluationError("claim-bound evidence is not evaluable in this release")` (**Deviation**, fails closed: legacy's claim economics, `candidate.py:124-206`, need its load receipts).
  4. **The candidate binding (Deviation).** Legacy's v2 load-receipt binding (`:63-121`) becomes: every row's `replay_receipt.candidate_bundle_digest` is one value, and for a frozen locked candidate it equals the frozen bundle digest, else `EvaluationError("dataset CandidateBundle is not the frozen locked candidate")`. The v2 `ResearchLineage` record (`:1075` on) is not built; `schema_version` is `"1.0.0"`.
  5. **The baseline is the caller's, unchecked against a list (Fork call).** Legacy's `evaluate` takes any non-empty `baseline` and checks it only against the dataset's declared baseline advisor (`candidate.py:310-338`) and the gate's "a named baseline is required"; it enforces neither POL-044's `rule:ema_cross` for AI candidates nor a baselines list. Neither is added, and no `promotion.baselines` setting is built.
  6. `evaluated_at` is `clock()`; `record["identity"] = evaluation_identity(record)`.
  7. **Disclosure (slice Deviation 7).** Once `locked_evidence` has returned `locked_oos` true, exactly one `ledger.disclose(...)` is written before `evaluate` returns or raises: on success `evaluation_identity` the record's identity, `metrics {"skill": <per-horizon rows>, "economics": <economics>, "eligible": <bool>}`, `outcome` `deferred` when the status is `DEFERRED_INCOMPLETE_LINEAGE`, else `eligible` or `ineligible`; on an `EvaluationError` after that point, `evaluation_identity None`, `metrics {"error": str(exc)}`, `outcome "failed"`, then the error is re-raised. An ordinary dataset writes none.
* **Two settings (refusing, register `legacy`, unset in `resources/defaults.yaml`, scope `research-offline` and `research-model`):** `promotion.directional.min_scored_per_horizon` (`int_pos`; legacy 30, `config/defaults.yaml:767`) and `promotion.directional.z` (`decimal`; legacy 1.96, `corrections.py:245`). The profile binds them; the repository sets no value.
* **Improvements listed, not made (for the owner):** refusing an AI candidate whose baseline is not `rule:ema_cross` (POL-044, spec Benchmarks), and refusing a baseline outside a bound `promotion.baselines` list (legacy shipped `advisor.baselines`, `config/defaults.yaml:761`, read only by the quality report `src/runtime/advisor/quality.py:26`, never by evaluation). Both would add a promotion refusal legacy never had.

#### Lineage repair (`research/datasets.py`)

* **Ported unchanged (Fork call, slice Fork call 14):** `read_economic_book`, `LINEAGE_REPAIR_SCHEMA`, `_store_consultations`, `_assert_unchanged`, `_lineage_repair_plan`, `_plain`, `_checked_plan`, `plan_lineage_repair`, `record_lineage_repair` (`datasets/__init__.py:2603-3030`), with every message, including "lineage repair evidence {path} is outside {strategy}'s advisor record store ({root}) for the repaired days {days}" and "advisor record store changed since the dry run; nothing was written".
* **The two stores (Deviation, POL-045 kept).** The advisor record store is the strategy's SLICE-09 run records (`cognition/records.py`): one file per strategy and day, whose consultations are the `intent_proposal` runs of that strategy on that day **(re-check at build: the record store's file layout)**. The entry time of a trade (legacy's order registry, `:2722-2757`) is the entry FILL's `at` in the dataset's retained `result.json`, hashed before it is read.
* **Owner-only.** `record_lineage_repair(path, *, actor: Principal, owner: Principal, reason, ...)` refuses `DatasetError("lineage repair is owner-only")` unless `actor == owner`. Authenticating the owner is SLICE-10's command.

### Tests

Every value is synthetic. `ROWS` are three recorded one-minute bars of `NIFTY26N0424000CE`: start `2026-11-04T09:16:00+05:30`, end `09:17:00`, open 100.00, volume 150; start `09:17`, end `09:18`, open 104.00, volume 50; start `09:18`, end `09:19`, open 110.00, volume 300. `FA5 = FillAssumptions(quote_slippage_bps=0.0, bar_slippage_bps=5.0)`. `QUOTES` are two chain quotes of the same contract: event and arrival `09:15:30`, ask 100.00, ask size 150, bid 99.50, bid size 150; event and arrival `09:20:00`, ask 110.50, ask size 150, bid 110.00, bid size 150. Charges are on `2026-11-04` with the shipped histories.

**`tests/unit/test_promotion_gate.py` (T-88), PRF-RES-09:**

| Group | Cases |
|---|---|
| Costs | `round_trip(100.0, 75, exit_premium=110.0, day="2026-11-04")`: legs buy 26.98 (brokerage 20.0, exchange 2.6648, sebi 0.0075, stamp 0.23, gst 4.0797) and sell 39.44 (stt 12.38, exchange 2.9312, sebi 0.0083, gst 4.1276); `rupees` 66.42, `points` 0.8856, `rates_as_of` `2026-04-01`, `rates_in_force` true, `rate_set_digest` `sha256:6b615b300dd02da28c904f347cf00ca4780c40bb3a2cee96bd3842d0d7d82452`. On `2026-03-15`: 62.29, 0.8306, `2026-03-01`, `sha256:2cb495adc9552330b2a234142dd18643d0e7c1cb5fdc01a1602969c25cdce360`. On `2024-01-02`: 62.2, 0.8293, `2024-10-01`, `rates_in_force` false. `repricing="current"` on `2026-03-15`: 66.42, `2026-04-01`. `round_trip(100.05, 75, exit_premium=109.90)`: 66.41, 0.8854; `leg("buy", 100.05, 75).total` 26.98 (0.3597 a unit). `source` with `use_estimates` false is `"broker"`. A `costs.statutory_history` row without `gst` → `CFG-R03` "costs.statutory_history is missing gst" |
| Fill model | **Exam (`QuoteFillModel()`)**, orders of 75 over `QUOTES`: BUY decided `09:15:00` fills 100.00 at `09:15:30+05:30`; SELL decided `09:20:00` fills 110.00 at `09:20:00+05:30`; with the second quote's bid size 40 → "quote size cannot support the full requested quantity"; SELL decided `09:21:00` → "no causal quote exists for the requested symbol". `QuoteFillModel().digest` = `FillAssumptions()`'s = `sha256:ea9e2fdf7e18c02c6dc8f2d89300dc386dd6a615386cfd9537b968829b4fbf7f`; with the first quote's ask 100.01, BUY fills 100.01 (no tick rule). **Bar (`BarFillModel(FA5)`)**, orders of 75 over `ROWS`: BUY decided `09:15:30` fills 100.05 at `09:17:00+05:30`; SELL decided `09:16:30` → "option bar volume cannot support the full requested quantity"; SELL decided `09:17:30` → 109.945 at `09:19:00+05:30`; SELL decided `09:18:30` → "no later option bar exists for a causal next-open fill"; digest `sha256:16be64ea28c0991179ea067e30a13a7f500b3ec73ed03ffdd969e0b5169aef14`. `bar_slippage_bps=-1.0` → "historical slippage must be finite and nonnegative"; `partial_fill_policy="allow"` → "unsupported historical partial_fill_policy"; `rl_fill_assumptions()` without slippage → `TypeError`; `FillAssumptions(0.0, 5.0)` (positional) → `TypeError`. A dataset build whose source names `BarFillModel` → `ReplayRefused("exam_replays_use_the_quote_model")` |
| Statistic | **One per session:** 30 sessions, one value each, 24 right: `effective_n` 30.0, design effect 1.0, `rho` None; Wilson at 0.8 → low 0.6269, high 0.905. **Clustered:** 10 sessions of 4, six `[1,1,1,0]` and four `[1,0,0,0]`: `rho` 0.2424, design effect 1.7273, `effective_n` 23.16, hit 0.55, low 0.3551 (the raw count 40 would give 0.3983). **Raw count would pass:** seven sessions `[1,1,1,1]`, three `[0,0,0,0]`: `rho` 1.0, design effect 4.0, `effective_n` 10.0, hit 0.7, low 0.3968, and the horizon refuses although the raw count 40 would give 0.5457. **Independent:** ten sessions `[1,1,1,0]`: `rho` 0.0, `effective_n` 40.0, low 0.5981. **Unmeasurable:** 50 values in one session and one in another → `effective_n` None, the interval `available` false with a reason starting "effective n unmeasured:", and the horizon refuses |
| Gate | Base: every horizon (5, 15, 30) `{scored 30, hit_rate_interval (0.5212, 0.8)}` (21 of 30), economics `{net_rupees 672.34, closed_trades 1, net_priced_trades 1}`, `locked_oos` true, `costs_reconciled` true, baseline `rule:ema_cross`, real track, minimum 30 → eligible, no reason. One change each gives exactly one more reason: h=15 scored 29 (low 0.6237) → "h=15 has 29/30 scored observations"; h=5 low 0.4878 (20 of 30) → "h=5 directional interval lower bound is not above 0.5"; h=5 low exactly 0.5 → the same; h=30 interval `None` → "h=30 directional interval lower bound is not above 0.5"; baseline `""` → "a named baseline is required"; `costs_reconciled` false → "costs are not reconciled to contract-note evidence"; net 0 → "net observed economics are not positive"; priced 0 → "not every closed trade has reconciled net pricing"; track `"x"` → "unknown promotion evidence track 'x'". Estimated track with `charges_source "broker"` → the reasons include "locked estimated track requires dated statutory estimate economics" |
| Bar | `values {min_net_rupees 0, min_margin_over_baseline 0, min_trades 30}` (synthetic), real track. Candidate and baseline economics `{charges_source "broker_reconciled_allocation", closed_trades 30, net_priced_trades 30, matched_ai_trades 30, net_rupees 0}`, and a complete `EconomicPromotionEvidence/v1` real-track pair whose `projection_digests`, `allocation_digests` and `reconciliation_record_digests` each hold 30 `sha256:` values: `passed` true at net 0 and margin 0 (`>=`). One change each gives exactly one reason: 29 matched → "29 matched AI trades is below min_trades 30"; candidate and baseline net both −0.01 → "net -0.01 is below min_net_rupees 0.0"; baseline net 0.01 → "margin over baseline -0.01 is below min_margin_over_baseline 0.0". `values` all `None` → three reasons "promotion.bar.<key> is unset; the owner has not chosen it" and `unset` true |
| Lineage status | Economics with `incomplete_lineage_trades 3` over an eligible gate → `DEFERRED_INCOMPLETE_LINEAGE`, `eligible` false, reason "3 closed trade(s) have incomplete advisor lineage; repair retained records and re-verify this evaluation" |
| DSR | `deflated_sharpe_ratio(1.2, 10, 30, 0.04)`: `expected_max_sharpe_under_null` 0.31491966, `test_statistic` 3.63427235, `deflated_sharpe` 0.99986062, `dsr_status "available_advisory"`. The same evaluation with `selection` replaced by an unavailable one has the same `gate` |
| Identity | A record with `skill {5: {...}}` has the same `evaluation_identity` as its `json.loads(json.dumps(...))` form (string key `"5"`) |
| Evaluate | Over step 3's scripted exam dataset with economics and labels added by a stub source: with `z` unbound → "unbound promotion.directional.z" and no disclosure; a baseline other than the dataset's declared one → legacy's "baseline strategy … declares advisor …" refusal and one `failed` disclosure; an AI candidate with baseline `rule:breakout` (the dataset declaring it) evaluates, with no baseline refusal; a passing run → one disclosure whose `evaluation_identity` is the record's; the same evaluation run twice → two disclosures |
| Lineage repair | `record_lineage_repair` with `actor` a delegated human → "lineage repair is owner-only"; with an evidence path for `2026-11-05` when the repaired trade is on `2026-11-04` → the "is outside … for the repaired days ['2026-11-04']" message; a record store file changed after the dry run → "advisor record store changed since the dry run; nothing was written" |

**`tests/integration/test_shared_engine.py`, PRF-RES-10**, added to the existing file, in a child process whose first act is `_refuse_sockets` (as PRF-STR-11). A test package `replaypkg.scripted_rule` declares a rule strategy that emits ENTER CE at its first decision and NOTHING after; `compose_replay_engine(..., label="research")`, capital `"100000.00"`, costs the shipped values, `candidate_id` the package's own. The admitted entry's first leg is `NIFTY26N0424000CE`, quantity 75 **(re-check at build: the planner fixture's choice; the market rows are written for that leg)**. Every case below expects every effect `outcome_class "simulated"`, every send's evidence naming the model, and an empty refusal log.

* **The bar model, its own bars:** one-minute bars of the contract starting `09:16` (open 100.00, volume 150), `09:18` (open 104.00, volume 50) and `09:19` (open 110.00, volume 300), each available at its end; `fill=BarFillModel(rl_fill_assumptions(quote_slippage_bps=0.0, bar_slippage_bps=0.0))`. The clock at `09:15:30`: the entry is admitted and sent; `close(run, "09:17:30")`, `close(run, "09:18:30")`, `step(run, "09:20:00")`, `finish`. Expected: the entry FILL 75 at `"100.00"`, `at` `2026-11-04T03:47:00Z`; the first close's order `rejected` once the `09:18` bar has arrived, `responder.outcomes` naming "option bar volume cannot support the full requested quantity", the position still 75; the second close's FILL at `"110.00"`, `at` `03:50:00Z`; the booked trade `gross_points` 10.0, `charges_rupees` 66.42, `charges_points` 0.8856, `net_points` 9.1144, `net_rupees` 683.58, `rate_set_digest` `sha256:6b61…2452`, `cost_model "option_execution_costs_v2"`, `fill_model "historical-fill-v2"`, `fill_model_digest` `sha256:ea9e…bf7f`; `broker.calls` 3.
* **The exam model:** `QUOTES` in the store, `fill=QuoteFillModel()`, `session_close` `09:21`. The clock at `09:15:00`: the entry FILL 75 at `"100.00"`, `at` `03:45:30Z`; at the session-close boundary (the `09:20:00` quote) the engine's close FILL at `"110.00"`, `at` `03:50:00Z`; the same booked trade as above. With the second quote's bid size 40: the close is refused, the position appears in `outcomes` with "entry supported but terminal exit unavailable: quote size cannot support the full requested quantity" (legacy `historical.py:401-407`), and no trade is booked (`economic_book` empty).
* **A model strategy:** the PRF-STR-11 package `replaypkg.sim_model` with `QueuedProposals`, a `CE` proposal queued for its first decision, the exam model, `spec.replay_root` unset: the entry is admitted through a review producer composed with `cognition=None` **(re-check at build: the policy fixture needs no review, or the staged PRF-STR-11 records are passed as `replay_root`)**, and the refusal log stays empty.
* **Refusals:** a spec whose `fill` is `ScriptedPartialDelay` → `ReplayRefused("test_rule_outside_test_composition")`, and the same spec in a `"test"` composition starts; a spec whose `candidate_id` differs from the loaded package's by one hex digit → `ReplayRefused("candidate_mismatch")` and `broker.calls` 0.

**`tests/contracts/test_capabilities.py`, PRF-DSP-12 (rule part):** an `ast` scan finds that `adapters/simulated_broker.py` imports no `socket`, `http`, `urllib`, `ssl`, `autonomous_trading.adapters.openalgo` or `autonomous_trading.research`, and that `research/replay.py` and `research/evaluation.py` import only the standard library, `autonomous_trading.contracts` and `autonomous_trading.research`.

**Existing tests that change:** `tests/unit/test_settings_resolver.py` gains the eight new fields' kinds and the `defaults.yaml` values for the six `costs.*` keys **(re-check at build: the file's per-field assertions)**.

### Break checks

The minimum set. Each anchor is checked present exactly once, one mutation at a time, each file restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| The bar's `min_trades` comparison `<` made `<=` (so `>=` passing becomes `>`) | Bar (29 and 30 matched) |
| `report_from_labels` passes the raw count to `_interval` | Statistic (raw count would pass) |
| `_interval` falls back to the raw count when `effective_n` is None | Statistic (unmeasurable) |
| The gate's `<= 0.5` made `< 0.5` | Gate (low exactly 0.5) |
| `evaluate_gate` refuses when `selection.dsr.deflated_sharpe` is below 0.5 | DSR |
| `_lineage_repair_plan`'s outside-the-store check removed | Lineage repair (another day) |
| `start` accepts a `/test` rule in a research composition | PRF-RES-10 (refusal) |
| `_bar_fill`'s volume check removed | Fill model; PRF-RES-10 (first close fills) |
| `QuoteFillModel` applies legacy's tick rule | Fill model (ask 100.01) |
| An unfilled exam exit booked at the worst case | PRF-RES-10 (exam model, `economic_book` empty) |
| `start` skips the `candidate_id` comparison | PRF-RES-10 (refusals) |
| A dataset build accepts `BarFillModel` | Fill model |
| `_leg`'s GST basis includes SEBI and stamp | Costs |
| `rate_set_for` selects the latest set whatever the day | Costs (`2026-03-15`) |
| `evaluate` writes no disclosure on a failure | Evaluate (`failed`) |
| The RuleResponder's evidence content omits `fill_model` | PRF-RES-10 |

### Files

| File | Change |
|---|---|
| `research/replay.py` | New: the cost model, `FillAssumptions`, `QuoteFillModel`, `BarFillModel`, the session-close boundary, `ScriptedPartialDelay`, the `EnginePort` types, `ReplayRefused`, booking, the receipt, `ReplaySource` |
| `research/evaluation.py` | New: the statistic, the gate, the bar's verdict, economics, track selection, selection statistics, `evaluate` with its disclosure |
| `research/datasets.py` | `read_economic_book` and lineage repair |
| `research/jobs.py` | The job type `research.dataset_build` |
| `adapters/simulated_broker.py` | `RuleResponder`; `send` uses `respond`, `_apply_due` pulls `due` |
| `bootstrap.py` | `compose_replay_engine`, `ReplayEngine`, `QueuedProposals` |
| `settings/schema.py` | Eight fields; the kinds `rate_history`, `tariff_history`, `rate_overrides` |
| `settings/loader.py` | The checks for the three kinds |
| `resources/defaults.yaml` | The six `costs.*` values; the two `promotion.directional.*` keys, unset |
| `tests/unit/test_promotion_gate.py` | New (T-88) |
| `tests/integration/test_shared_engine.py` | PRF-RES-10 and its child phase |
| `tests/contracts/test_capabilities.py` | PRF-DSP-12 (rule part) |
| `tests/unit/test_settings_resolver.py` | The new fields |

No kernel module, schema, event kind or migration changes.

### Completion conditions (step 4)

* **Targeted tests only:** `tests/unit/test_promotion_gate.py`, `tests/integration/test_shared_engine.py` (the whole file: PRF-STR-11 shares its helpers), `tests/contracts/`, `tests/unit/test_settings_resolver.py`, `tests/unit/test_dataset_fitting.py` and `tests/integration/test_research_worker.py` (their modules change), twice in a row on Windows.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file. Every legacy-derived number in the tests is recomputed from legacy's functions as above.
* `git diff --name-only` names exactly the files above; one commit in OA_NEW; nothing pushed.
* This file records step 4 "as built", with any Fork call or Deviation the build adds.

### Step 4 as built

**In plain words.** The exam now exists in the new system. A candidate is replayed through the same kernel that trades, against a simulated broker that fills from recorded quotes or bars by the old system's rule and prices every trade by the old system's dated charges. A position the exam cannot sell counts as no trade. The pass-or-fail rule is the old one, number for number, and every evaluation over exam days leaves its note, even a failed one. The replay cannot reach the network or the broker. Nothing here can place, block or change a real trade.

Commit `ce5f08d` on `slice-12` (worktree `OA_NEW-s12`), on top of `3529f24` (SLICE-11 step 3a). It adds `research/replay.py`, `research/evaluation.py` and `tests/unit/test_promotion_gate.py`, and changes `adapters/simulated_broker.py`, `bootstrap.py`, `research/datasets.py`, `research/jobs.py`, `settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml`, `tests/integration/test_shared_engine.py`, `tests/contracts/test_capabilities.py` and `tests/unit/test_settings_resolver.py`: the 13 files listed above, 6,861 lines added, 7 removed. Not pushed.

**Re-checked at build:**

| Item | Found |
|---|---|
| The store's chain payload names | The market store keeps OpenAlgo's shape, `response.data[].ce.{symbol, bid, ask, bid_qty, ask_qty}`, not legacy's `ce_bid` rows; the quote evidence maps it to legacy's `_quote_evidence` rows. Bar evidence comes from the `history_bar` stream |
| The owner's binding and grant | An owner action needs a bound request, so `comp.owner_auth` alone is refused. The engine goes through `operator_call` at its own CLI door, then `recovery.advance`, `authority.authorize_binding` and `authority.issue` |
| A `None` cognition | It answers a required review `required_role_failed`; with the policy's AI mode `off` no review is asked, so the model-strategy case needs neither a review nor staged records |
| The planner's leg | ATM 24000 CE, quantity 75, entry premium 100.00, as written. Admission's freshness bounds needed two test settings: `poll_interval_secs` 60 and `max_view_age_secs` 120 (labelled synthetic) |
| Step 3's `build` and `validate_locked_evaluation` | `build` as built is what `run_dataset_build` calls. Legacy's `validate_locked_evaluation` was not in step 3; it is ported into `research/evaluation.py` with `current_acceptance_rule` |
| The record store's file layout | Not as assumed: SLICE-09's `cognition/records.py` keeps one hash-chained `events.jsonl` per root, with no per-strategy-day file. See the lineage-repair row below |

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Legacy values | Every cost, leg, rate-set digest, fill, fill-assumption digest, Wilson bound, effective n, DSR and gate value in T-88 equalled legacy's on the first run, except the two PRF-RES-10 values below |
| Projection evidence class (spec text corrected) | The text wrote `execution_evidence_class "simulated_bar"`. Legacy writes the fill model's own class, so an exam projection carries `simulated_quote`. Legacy's kept |
| Worst-case-loss cap in the replay (**Fork call**) | The engine uses the bound `account.max_worst_case_loss` exactly as production composes it, and none when unbound, so admission refuses `capacity_rule_unbound`. A first build fell back to the run's capital; removed before commit as an invented limit. PRF-RES-10 binds `"100000.00"` (labelled synthetic) |
| Closing in the replay (**Deviation**) | The kernel refuses a market close while the basket's stop and target rest, so `close` has the owner cancel them first. `broker.calls` is 5 in the bar case and 4 in the exam case, not 3. `close` steps the clock before it submits (the entry must have filled), and exits run before the host's pass (the host's seal wait moves the recorded clock 500 ms) |
| The bar case's exit time | The kernel refuses a second close while the first is unresolved, and the first close's refusal is known only at 09:19. The second close is decided at 09:19:30 against a bar starting 09:20, so the exit FILL is at `03:51:00Z`, not `03:50:00Z`. Gross 10.0, charges 66.42 and net 683.58 are unchanged |
| `ReplayResult.fills` (**Deviation**) | Added: each fill's `our_order_id`, `at`, owner and `decision_id`. Lineage repair reads a trade's entry time from it, hashing the file before it reads |
| `ReplaySource` arguments (**Deviation**) | `ReplaySource(engine, spec_for, *, horizons, closes, rule_strategies=(), partition_of=None)`: the gate's horizons are bound (slice Deviation 18), the underlying's closes come from the caller. `specs(strategy, days)` refuses a non-quote model; `run_dataset_build` calls it before `build`, because `build` reads rows only after the locked claim and a later refusal would spend exam days |
| Lineage repair's advisor store (**Deviation**, open) | Built over legacy's `<advisor_root>/<strategy>/<day>.ndjson` consultation layout with `_store_consultations` unchanged, because SLICE-09's records have no per-strategy-day file. Nothing in the target writes that file yet; whoever builds the operator's repair command (SLICE-10) or SLICE-09's records must write it. `advisor_root` is required (legacy defaulted to the run directory); `order_root` leaves the repair record |
| The evaluator digest | Over `research/evaluation.py` with CRLF normalised. A bundle frozen under legacy's evaluator digest refuses (fails closed) |
| The candidate registry root | The proof's `registry_root` or `settings.research_candidate_root`; evaluation refuses without either. No such setting exists yet; only a frozen-bundle exam needs it |
| Disclosure | Once the locked evidence is verified, any exception (a `DatasetError` too, not only `EvaluationError`) writes the one `failed` disclosure. The claim-bound refusal runs before the locked evidence is read, so it writes none. Legacy's "candidate bundle digest does not match dataset load receipt" is kept beside change 4 |
| Cost settings | The history kinds refuse extra keys, a non-ISO `as_of` and negative or non-finite numbers with legacy's "contains an invalid rate set" text; legacy dropped extra keys and checked only a non-empty `as_of` (**Deviation**, stricter). `promotion.directional.z` uses the `decimal` kind, so the profile writes `"1.96"` as text. Booking reprices by `costs.repricing` on the IST dates of the entry and exit stamps, as legacy's `attach_economics`; with `use_estimates` false, `cost_source` is `"broker"` and the net `None` |
| The replay composition | `compose_replay_engine` also takes `policies` and an optional `policy_id` (bound policies are a profile section, not a `Settings` field). The replay ledger uses an in-process lease store and a replay-only receipt. A model strategy's receipt carries the empty prompt digest (`QueuedProposals` carries no prompt). A decision's `seq` is its IST minute of the day. The broker holds a responder fill until its order is in the book (a fill due at once crashed the send) |
| Not tested | `run_dataset_build` has no test of its own; it needs `capacity.synthetic_amount` bound in the research profile |
| Break checks | Under the owner's fast routine only the promotion-gate rows ran: bar `<` to `<=`, the raw count into `_interval`, the raw-count fallback, the gate's `<= 0.5`, a DSR refusal, the outside-the-store check and the failure disclosure. Seven, each failing its listed test, every file restored (md5). Script: `s12d_eval_breaks.py` in the session scratchpad. The other nine rows were not run |

**Tests run (Windows, targeted only):** `tests/unit/test_promotion_gate.py`, `tests/integration/test_shared_engine.py`, `tests/contracts/`, `tests/unit/test_settings_resolver.py`, `tests/unit/test_dataset_fitting.py`, `tests/integration/test_research_worker.py`, `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 342 passed, 6 skipped, twice in a row (the skips are platform skips: SIGTERM is Linux-only, the operator-UI routes need Node). PRF-RES-10 runs in a child process whose sockets are refused; the refusal log stayed empty. `ast.parse` passes on every edited file. **Seen once, not traced:** in a worker's run two `research.noop_model` jobs in `test_research_worker.py` failed and passed alone and in every run after; drive C: had about 2.6 GB free against the worker's 2 GiB free-space check, the likely cause.

## Step 5 — RL

<a id="step-5--rl-outline"></a>

The authorities are the spec's [RL transitions and reward](../../design/research-rl-custody-promotion.md#rl-transitions-and-reward-researchrlenvironmentpy-researchrlrewardpy) and [RL training and frozen policies](../../design/research-rl-custody-promotion.md#rl-training-and-frozen-policies-researchrltrainingpy-researchrlpolicypy) and PRF-RES-11. Step 5 is TASK-S12-05. It is written assuming step 4 is built exactly as its text says; a decision that leans on a step 4 detail is marked **(re-check at build)**. Legacy citations are at 445eb116: `environment.py`, `reward.py`, `gym_env.py` and `lab.py` are under `src/analysis/rl/`; `history.py` is `src/runtime/research_policy_history.py`; `runtime.py` is `src/runtime/research_policy_runtime.py`; `view.py` is `src/runtime/research_policy_view.py`; `backend.py` is `src/runtime/advisor/backends/research_policy.py`; `rp.py` is `src/analysis/candidates/research_policy.py`. The reward digests and every price, charge and reward below were computed on 2026-11-03 by running legacy's `RewardSpec`, `HistoricalExecutionAdapter`, `round_to_tick` and `charges` on the synthetic inputs shown (`s12d_values.py` in the session scratchpad); the episode values follow legacy's `step` (`environment.py:405-453`) by hand from them. No production record was read.

**In plain words.** This step rebuilds the training lab for learning agents. An agent practises on recorded days and may only say "buy a call", "buy a put" or "wait", with a confidence; the system, not the agent, picks the contract, the size and the price, exactly as before. Each step of practice now writes down four things together: what the agent asked for, whether the system allowed it, what the simulated broker did, and where the position stood afterwards. The reward shows the money part separately from any practice bonus, so a bonus can never pass for profit. The old quick simulator stays for exploring ideas only. Anything that may count as evidence steps through the real trading rules from step 4 instead, where test-only rules prove that rejected, delayed and part-filled orders add up. Every training run is logged before it starts and counted however it ends, can continue from a saved point only under identical settings, and a finished agent is frozen so that any changed byte is refused. Nothing here can place, block or change a real trade.

### Decisions

#### The reward (`research/rl/reward.py`)

* **Ported unchanged (identity parity, REQ-RES-009):** `REWARD_SCHEMA = "research_reward/v1"`, `RewardSpec` with `identity`, `code_digest`, `digest`, `as_dict` and `__call__` (`reward.py:20-61`), `_net_points_after_charges` and `NET_POINTS_AFTER_CHARGES` (`:64-88`), `REWARDS`, `reward_spec` (`:90-103`). `_net_points_after_charges` is copied byte for byte, docstring included, because `code_digest` hashes its source: the shipped digest stays legacy's.
* **Components (slice Deviation 13).** `RewardSpec` gains `shaping: Mapping[str, Callable[[Mapping, Mapping], float]] = field(default_factory=dict)`, copied to a plain `dict` in `__post_init__` as legacy copies `parameters`. `as_dict` adds `"shaping": {name: <sha256 of that function's source>}` only when `shaping` is non-empty, so the shipped spec's digest is unchanged. `value(transition) -> RewardValue(economic, shaping, total)`: `economic = {"positions": [...], "worst_cases": [...], "total": <the legacy function's value>}`, where each closed position with a fill gives `round(gross_points - charges_points, 8)` to `positions` and each without one gives `round(-(entry_price + charges_points), 8)` to `worst_cases`; `shaping = {name: float(fn(transition, parameters))}` (a non-finite value raises legacy's "reward {identity} produced a non-finite value"); `total = round(economic.total + sum(shaping.values()), 8)`. `__call__` returns `value(...).total`, so a spec without shaping returns legacy's number. A shaping term is never added to `economic`.

#### The abstract tier (`research/rl/environment.py`)

* **Ported unchanged (Fork call; limited claims, slice Deviation 14):** `OBSERVATION_SCHEMA`, `TRANSITION_SCHEMA` (the v1 name), `ENVIRONMENT_VERSION = "research-environment-v3"`, `WAIT`, `DIRECTIONS`, `OUTCOME_CLASS`, `STRIKE_RULE`, `SESSION_END_RULE`, `PRICE_RULE`, `ACTION_FIELDS`, `FRAMEWORK_OWNED_FIELDS`, the four error classes, `Action`, `normalize_action` (`environment.py:90-171`, the `View` branch reading step 4's `ProposalResult` fields); `ResearchEnvironment`'s `_resolve_session`, `_admit`, `reset`, `step`, `_observe`, `_visible_chain`, `_order`, `_outcome`, `_enter`, `_priced`, `_close` (`:282-631`); `assumptions_for`, `on_tick`, `round_to_tick`, `_ms`, `_bar_dict`, `_chain_summary`, `observation_horizon`, `_assert_causal`, `_sha` (`:634-744`). Fills go through step 4's `HistoricalExecutionAdapter` with the run's declared `FillAssumptions` and `SIMULATED_BAR`, then this tier's tick rule (`_priced`), as legacy; charges are step 4's `round_trip` and `leg(..., rates=rates_for(charges_as_of))`, with `costs=` the run's `CostSettings` **(re-check at build)**. This is the only tier with the tick rule (Fork call 17). Custody is step 2/3's `TrialLedger.expose_ordinary` and `assert_locked_oos_claim`, before any payload is read, as legacy.
* **Inputs from a step 1 bundle (Deviation, plumbing only).** Legacy read a `BundleReader` through `HistoricalCapture` and `CausalHistory` (`environment.py:241-250`). The target reads the bundle's normalized streams: `index_bar` rows of the underlying are the base bars, `option_chain` rows the chains (`d.rows` as legacy's chain body), `option_bar` rows the option bars, each as an `_Arrival(t=ms(event_time), available_at=ms(arrival_time), available_iso=arrival_time, sequence=seq, body=d)` sorted by `(available_at, t, sequence)` as `_arrivals` (`:677-687`); an option bar becomes the legacy row `{"symbol": instrument, "at": event_time, "available_at": arrival_time, "open", "volume"}`. `CausalHistory.window` is a list slice of the arrivals seen so far.
* **Declared quantity and tick (Deviation).** `quantity: int` and `tick_size: str` are required constructor arguments; legacy's point-in-time `ReferenceStore` (lot size, tick size) is not ported. `reference` in every record is `{"eligible": true, "used_digest": "sha256:" + legacy_digest({"quantity", "tick_size"}), "missing": []}`. `facts_from_chain_records` is not ported.
* **The observation vector, ported unchanged:** `history_contract`, `validate_history_contract`, `session_clock_vector` (`history.py:15-88`) with `Asia/Kolkata` as the fixed +05:30 offset (step 1's timezone Deviation); `vector_source_digest` hashes the target module's own bytes (**Deviation**: the identity of a new policy, not of a legacy one).
* **The Gymnasium view, ported unchanged:** `ACTIONS`, `SESSION_CLOCK`, the two observation versions, `ResearchGymEnv` (`gym_env.py:38-109`), except that `step` returns the environment's `terminated` and `truncated` (legacy returned `done` and `False`, `:104-109`). Gymnasium is in the `rl` extra.

#### The v2 transition (slice Deviation 13)

* **`step(action)` returns `(observation, reward_total, terminated, info)`,** `info` the v1 record exactly as legacy built it (`environment.py:427-451`, with `stream_digest`), plus `info["v2"]`, the `research_transition/v2` record:

  | Field | Abstract tier |
  |---|---|
  | `bar_index`, `decision_at` | legacy's |
  | `proposed` | `{direction, conviction, reason}` of the normalized action |
  | `admission` | `{decision, reason, source: "environment"}`: `not_applicable` for `WAIT` with nothing held and for the held direction; `refused` with the reason of a legacy outcome whose `result` is `None` (no visible chain, a contradicted or non-positive price); `admitted` otherwise |
  | `execution` | one entry per legacy outcome with a `result`: `{kind, evidence_class, outcome_class: "simulated", available, reason, fill_price, fill_at, quantity_filled, fill_assumptions_digest}`, the price after the tick rule |
  | `pending` | `[]` (the shipped model refuses partial fills) |
  | `closed` | legacy's `closed` records |
  | `state_after` | `{position: {direction, symbol, quantity, entry_price} or null, open_quantity, mark_points: null}` |
  | `reward` | `RewardValue` as a mapping |
  | `terminated` | legacy's `done` (the penultimate bar's decision) |
  | `truncated`, `end_reason` | below |
  | digests | `reward_digest`, `assumptions_digest`, `fill_assumptions_digest`, `stream_digest` (v1), `stream_digest_v2` |

* **`truncated` only at a declared step limit.** `ResearchEnvironment(..., step_limit: int | None = None)`. When `step_limit` is set and this is transition number `step_limit` and not `terminated`, `truncated` is true, `end_reason` is `"step_limit:{n}"`, and the episode is done (a further `step` raises legacy's "the episode is done; call reset()"). `terminated` gives `end_reason "session_end"`; otherwise `end_reason` is `null`. With no limit `truncated` is always false, as legacy.
* **The v1 stream stays reproducible.** `stream_digest` is legacy's chain over the v1 `info` (`:449-451`); `stream_digest_v2 = _sha({"previous": <previous v2>, "v1": stream_digest, "v2": <the v2 record without its digests>})`, starting from the reset's stream. `as_v1(info)` drops `info["v2"]`.

#### The shared tier (`research/rl/environment.py`)

* **`SharedEnvironment(engine: EnginePort, spec: ReplaySpec, *, reward, step_limit=None)`** steps a step 4 replay of a model strategy bar by bar **(re-check at build: step 4's `EnginePort`, `ReplaySpec` and `QueuedProposals`)**. `reset()` starts the run and steps to the first decision boundary. `step(action)`: a `CE` or `PE` with nothing held is queued as `ProposalResult("intent_proposal", "propose", direction, conviction, reason, None, None, None)` and the engine steps one bar; `WAIT` or the opposite direction while holding calls `engine.close(run, <the next boundary>)`; the held direction and `WAIT` with nothing held step with no proposal. At the penultimate bar's decision it closes whatever is open (legacy `SESSION_END_RULE`), and the last step calls `finish`.
* **The transition from the `StepResult`:** `admission` is the kernel's: `admitted` for `COMMAND_ADMITTED`, `refused` with the refusal code for `ADMISSION_REFUSED`, source `kernel`; `not_applicable` when no intent was formed. `execution` holds each FILL, rejection and cancellation of the step; `pending` holds the responder's working orders with their remaining quantity; `state_after.open_quantity` is the kernel position's owned quantity; `closed` holds positions booked by step 4's rule in this step; at `finish`, an open quantity is booked at legacy's research worst case (`environment.py:621-629`): `gross_points None`, `charges_points = round(leg("buy", entry, open_quantity, rates=rates_for(day)).total / open_quantity, 4)`, `charges_rupees` that total rounded to 2. The shared tier's model is `BarFillModel` with the run's declared assumptions (no tick rule), or the test rule in a `"test"` composition; its claims are still marked `shared`. A partial fill opens only the filled quantity: the book never shows the whole order filled.
* **Claims.** Every record of the abstract tier carries `"tier": "abstract"`, of the shared tier `"tier": "shared"`. A claim beyond exploration (a frozen policy offered for a locked exam) requires a shared-tier run (slice Deviation 14); `freeze` records the tier.

#### Training, checkpoints and freeze (`research/rl/training.py`)

* **Ported unchanged (Fork call 16 for the exam route):** `ARTIFACT_SCHEMA`, `REFERENCE_SCHEMA`, `PAYLOAD_FORMAT`, `EVIDENCE_CLASS`, `TRIAL_KIND = "rl_training"`, the file names, `DEFAULT_SETTINGS`, `DEFAULT_SPACE`, `LabError`, `LabData`, `Trained`, `FrozenPolicy`, `LabRun`, `settings_for`, `payload_from_state`, `fit`, `restore`, `evaluate`, `observation_definition`, `freeze`, `write_frozen`, `load_frozen`, `train`, `SearchResult`, `search` (`lab.py:60-511`); `build_model` and `state_from_payload` (`runtime.py:9-59`). `LabData` gains `quantity`, `tick_size` and `costs` (the abstract tier's declared values) and its `fills` has no default (step 4's slice Deviation 15).
* **The attempt link and inputs.** `train` opens its `research_lab` trial with step 2's `inputs={"environment": environment_digest, "observation": observation_digest, "reward": reward_digest}` and, inside a job, the job's `attempt_context` (step 2). A new job type `research.rl_train` (offline profile, timeout 3600 s, `same_request`, resumable) runs `train`.
* **Checkpoints (new).** `train(..., checkpoint_every: int | None = None, checkpoints: Path | None = None)` writes, every `checkpoint_every` timesteps, a record `{"schema": "ResearchCheckpoint/v1", "attempt_id", "step", "payload_digest", "settings_digest", "observation_digest", "environment_digest", "reward_digest", "rng_state_digest"}` and its payload into `checkpoints/<hex of "sha256:" + legacy_digest(record)>/` (`checkpoint.json`, `payload.bin`), once, by `write_frozen`'s staging and replace, refusing different content with legacy's "{target} already holds different content". `resume_training(parent_id, checkpoint_dir, ...)` builds step 2's `Checkpoint(checkpoint_digest, specification_digest, inputs_digest, state_digest=payload_digest)` from the parent's `compatibility` and calls `ledger.resume`, so any changed parameter, seed, reward, observation or environment refuses with step 2's message; it then loads the payload and learns the remaining `total_timesteps - step`.
* **Freeze into a candidate.** `rp.py:60-576` is ported unchanged into `research/rl/policy.py` (`check_manifest`, `identities_for`, `check_bundle`, `exam_definitions`, `freeze_candidate`, with their messages), so step 3's registry verifies the `research_policy` family through it: step 3's refusal "candidate family research_policy is verified from step 5" is removed. `local_model` keeps refusing, now "candidate family local_model is not verified in this release" (**Deviation**, fails closed; legacy's `ModelSpec` contracts are not ported).

#### Frozen inference (`research/rl/policy.py`)

* **Ported unchanged (Fork call, slice Fork call 18):** `ResearchPolicyViewCandidate` (`view.py:21-63`), `flat_entry_vector`, `compatibility_digest` and `ResearchPolicyAdvisor` (`backend.py:23-257`), with `Asia/Kolkata` as the fixed offset. Any failure, an out-of-range or non-scalar action, or `WAIT` is an abstention carrying the candidate and policy digests.
* **`PolicyProposals(advisor)`** is the model strategy's `proposals` port: `propose(request)` returns a `ProposalResult` of kind `propose` from a non-abstaining view, else kind `abstain` with cause `policy_abstained` and the advisor's reason. Weights load on CPU, deterministically; nothing here grants a live permission (`README.md:881`).

#### The `rl` extra

* `pyproject.toml` gains the optional extra `rl` with legacy's packages (`stable-baselines3`, `torch`, `optuna`, `gymnasium`, `numpy`), each pinned in `requirements.lock` to the version legacy's lock resolves at 445eb116 (read at build from legacy's lock file). Only the research participants install it. Every import of these packages is inside a function, as legacy (`lab.py:86-104`).

### Tests

Every value is synthetic. **The abstract session:** a step 1 bundle for `2026-11-04` with five `index_bar` rows of `NIFTY` at 09:15 … 09:19 IST (each `arrival_time` one minute after its `event_time`); one `option_chain` row at 09:15 (arrival 09:15:30) with spot 24010 and strikes 24000 (`ce_symbol` `NIFTY26N0424000CE`, `pe_symbol` `NIFTY26N0424000PE`) and 24050; and three `option_bar` rows of `NIFTY26N0424000CE`: event 09:17 open 100.00 volume 150, event 09:18 open 104.00 volume 50, event 09:19 open 110.00 volume 300 (each arriving one minute later). No `PE` bars. `ResearchEnvironment(bundle, "2026-11-04", reward=NET_POINTS_AFTER_CHARGES, fills=FillAssumptions(quote_slippage_bps=0.0, bar_slippage_bps=5.0), charges_as_of="2026-11-04", seed=7, quantity=75, tick_size="0.05", costs=<shipped>)`, ordinary custody. The four decisions are at 09:16, 09:17, 09:18 and 09:19.

**`tests/unit/test_rl_research.py` (T-89), PRF-RES-11:**

| Group | Cases |
|---|---|
| Reward | `NET_POINTS_AFTER_CHARGES.digest` = `sha256:37b8f30fad52cf755f1f86be5d3ca9312cd8898aef0a74a4cfa453bae8aed94f`, `code_digest` = `sha256:d1a7188d3523c859eea7208e76ec8f02bae87a90644a757dc282a1a6511e46de` (legacy's). Over `closed` = one close `{gross_points 10.0, charges_points 0.8856, entry_price 100.0}` and one worst case `{gross_points None, charges_points 0.3597, entry_price 100.0}`: `economic.positions` `[9.1144]`, `economic.worst_cases` `[-100.3597]`, `economic.total` −91.2453, `shaping` `{}`, `total` −91.2453. The same spec with `shaping {"hold": -0.01 always}`: `economic` unchanged, `shaping {"hold": -0.01}`, `total` −91.2553, and a different `digest` |
| Episode A | Actions CE, WAIT, WAIT, PE. Step 0: `admission admitted`; execution entry available, `fill_price` 100.05, `fill_at` 09:18; `state_after.position` CE 75 at 100.05; reward 0; the next observation's `position.entry_price` is `None` (the fill at 09:18 is after the 09:17 decision). Step 1: `admitted`; execution exit unavailable, "option bar volume cannot support the full requested quantity"; position still CE 75; reward 0. Step 2: `admitted`; exit 109.90 at 09:20; `closed` gross 9.85, `charges_points` 0.8854, `charges_rupees` 66.41; `state_after.position` null; reward 8.9646. Step 3: `admitted`; entry PE unavailable, "no later option bar exists for a causal next-open fill"; position null; `terminated` true, `truncated` false, `end_reason "session_end"`, reward 0 |
| Episode B | Actions CE, CE, CE, CE: steps 1 and 2 `not_applicable`; step 3 closes at session end, the exit unavailable ("no later option bar exists …"), `closed` with `gross_points None` and `charges_points` 0.3597; reward −100.4097 = −(100.05 + 0.3597), all in `economic.worst_cases` |
| Refusals | A chain-less session: CE at step 0 → `admission refused`, reason "no visible chain names an at-the-money contract", `execution` `[]`, position null. `{"direction": "CE", "conviction": 1.0, "strike": 24000}` → `ActionRefused` "action names ['strike']; the action space is direction and conviction only — the framework selects strike, quantity, price and stop", and no transition is recorded. The session declared `locked_oos` and no reservation → `LockedPartitionRefused` starting "this session is in locked custody" |
| Limits and determinism | `step_limit=2`: after step 1 `truncated` true, `terminated` false, `end_reason "step_limit:2"`; a third step raises "the episode is done; call reset()". Without a limit every `truncated` is false. Two resets with seed 7 give equal v1 and v2 stream digests at every step; `as_v1(info)` equals legacy's record shape (no `v2` key). `ResearchGymEnv(env, window=4).step(1)` returns five values, `truncated` false, a vector of length 10 |
| Shared tier | A `"test"` composition (step 4), the abstract session's bars in a market store, quantity 75 **(re-check at build: the planner's leg)**. **Reject:** script `{1: {"reject": "scripted"}}`, CE → `admission admitted` (kernel), execution `[rejected, "scripted"]`, `open_quantity` 0, position null, reward 0. **Partial, then open at the end:** `{1: {"fill": [[1, 25]]}}`, CE → after one bar a FILL 25 at 100.05, `open_quantity` 25, `pending` `[{remaining 50}]`; held to the end → at `finish` the remainder cancelled and the 25 booked at the worst case −(100.05 + 0.989) = −101.039 a unit (`leg("buy", 100.05, 25).total` 24.73). **Delayed:** `{1: {"fill": [[2, 75]]}}`, CE → after one bar `open_quantity` 0 and `pending` `[{remaining 75}]`, after two bars a FILL 75 at `"104.052"` (104.00 × 1.0005, no tick rule in the shared tier). The same script in a `"research"` composition → `ReplayRefused("test_rule_outside_test_composition")` |
| Lab | A stub trainer (`Trained(payload=b"\x00\x01", act=lambda v: 1)`): one `train` → its trial `completed` with `score` the mean episode reward and `selection_outcomes`; a trainer raising `ResearchEnvironmentError` → `abandoned` (legacy, `lab.py:445-447`); one raising `RuntimeError` → `crashed`. `count(search_id=…)` `total` 3, `completed` 1, `abandoned` 1, `crashed` 1. Each trial's `extensions.inputs` holds the three digests |
| Checkpoints | With `checkpoint_every=128` and a stub trainer that raises after its first checkpoint: the trial `crashed`, one checkpoint directory whose name is its digest. `resume_training` opens a child with `parent_id` and `extensions.resume`; with the reward spec changed → "resume refused: inputs_digest differs; a changed parameter or assumption is a new attempt". Writing the same checkpoint again writes nothing; different bytes → "… already holds different content" |
| Frozen policy | `write_frozen`, then one byte of `policy.weights` changed → `load_frozen` "frozen policy payload does not match its manifest"; the directory renamed → "frozen policy manifest does not match its directory digest". `freeze_candidate` gives a `research_policy` bundle that step 3's registry publishes and verifies |
| Inference | A loaded policy whose `act` returns 3 → abstention naming the candidate and policy digests; `act` raising → abstention; index 0 (`WAIT`) → abstention; index 1 → `propose` `CE` with conviction 1.0 |
| Slow | Marked `slow`, skipped when the `rl` extra is absent: two `fit` runs with seed 7 over the abstract session give equal payload digests |

**Existing tests that change:** `tests/unit/test_candidate_freeze.py`: "publishing the local_model bundle" now expects "candidate family local_model is not verified in this release", and the `research_policy` bundle publishes.

### Break checks

The minimum set. Each anchor is checked present exactly once, one mutation at a time, each file restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| `_enter` opens the position when the fill is unavailable | Episode A (step 3); Refusals |
| The shared tier sets `open_quantity` to the order quantity on a partial fill | Shared tier (partial) |
| `value` adds shaping terms to `economic.total` | Reward (shaping) |
| `truncated` set when `terminated` is true without a limit | Limits and determinism |
| `load_frozen` skips the payload digest check | Frozen policy |
| `_net_points_after_charges` edited (one comment changed) | Reward (`code_digest`) |
| `as_dict` always writes `shaping` | Reward (shipped `digest`) |
| `WAIT` with nothing held recorded `admitted` | Episode B |
| `resume_training` skips `ledger.resume` | Checkpoints |
| An inference exception propagates | Inference |

### Files

| File | Change |
|---|---|
| `research/rl/reward.py` | New: `RewardSpec` with components, `RewardValue`, the shipped reward |
| `research/rl/environment.py` | New: the abstract tier, the session-clock vector, the Gymnasium view, the v2 transition, the shared tier |
| `research/rl/training.py` | New: the lab, search, checkpoints, freeze |
| `research/rl/policy.py` | New: the `research_policy` family checks, frozen inference, `PolicyProposals` |
| The `rl` package's `__init__.py` | New, empty |
| `research/candidates.py` | The `research_policy` family verified through `research/rl/policy.py`; the `local_model` message |
| `research/jobs.py` | The job type `research.rl_train` |
| `pyproject.toml`, `requirements.lock` | The `rl` extra |
| `tests/unit/test_rl_research.py` | New (T-89) |
| `tests/unit/test_candidate_freeze.py` | The two changed cases |

No kernel module, setting, schema, event kind or migration changes.

### Completion conditions (step 5)

* **Targeted tests only:** `tests/unit/test_rl_research.py`, `tests/unit/test_candidate_freeze.py`, `tests/integration/test_research_worker.py` (the new job type) and `tests/contracts/`, twice in a row on Windows; the `slow` case once with the `rl` extra installed, or recorded **not checked** when it cannot be installed.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file. The reward digests are recomputed from legacy's `RewardSpec` as above.
* `git diff --name-only` names exactly the files above; one commit in OA_NEW; nothing pushed.
* This file records step 5 "as built", with any Fork call or Deviation the build adds.

### Step 5 as built

**In plain words.** The training lab for learning agents now exists in the new system. An agent still only says "call", "put" or "wait"; the system picks the contract, size and price as before. Each practice step records what the agent asked, whether it was allowed, what the simulated broker did and where the position stood, and the reward keeps the money part apart from any practice bonus. The quick simulator is kept for exploring; the evidence tier steps through the real kernel, where rejected, delayed and part-filled orders were shown to add up. Training runs are logged and counted, resume only under identical settings, and a frozen agent refuses any changed byte. Nothing here can place, block or change a real trade.

Commit `fa533d8` on `slice-12`, on top of `ce5f08d` (step 4). It adds the `rl` package's `__init__.py`, `research/rl/reward.py`, `research/rl/environment.py`, `research/rl/training.py`, `research/rl/policy.py` and `tests/unit/test_rl_research.py`, and changes `research/candidates.py`, `research/jobs.py`, `adapters/simulated_broker.py`, `pyproject.toml` and `tests/unit/test_candidate_freeze.py`: 11 files, 3,997 lines added, 11 removed. Not pushed. `requirements.lock` is unchanged and `adapters/simulated_broker.py` is added (both below).

**Re-checked at build:**

| Item | Found |
|---|---|
| Step 4's cost and fill model | `round_trip` and `leg` take `costs=`; `rates_for` reads the code constants, as legacy; `FillAssumptions` is keyword-only with legacy's fields; `HistoricalExecutionAdapter`, `SIMULATED_BAR` and `fill_assumptions_digest` are in `research/replay.py` |
| `EnginePort`, `ReplaySpec`, `QueuedProposals` | As step 4 built them: `step(run, until, proposal=None)`, `close(run, at)`, `finish(run)`. One engine runs one spec once (`run_exists`), so a shared episode needs a new engine and a second `reset()` refuses |
| The planner's leg | ATM 24000 CE, quantity 75, as step 4 |
| `ProposalResult` | It lives in `cognition/review.py`; `contracts` has none. `research/rl` may not import cognition, so the shared tier queues a local dataclass with its fields, and `PolicyProposals` imports it inside one function (`result_type=` overrides it). Step 8's scan must allow that import, or `ProposalResult` moves to `contracts` |
| Step 4's acceptance rule | `current_acceptance_rule` takes `settings`, so `exam_definitions` and `freeze_candidate` gained `settings=` |
| Legacy's lock | Legacy's `deploy/constraints.txt` at 445eb116 pins none of `gymnasium`, `stable-baselines3`, `optuna` or `torch`; there is no locked version to carry |

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Legacy values | Both shipped reward digests (`sha256:37b8…d94f`, `sha256:d1a7…46de`) and every Episode A and B price, charge and reward equalled the spec on the first run |
| The `rl` extra (**Deviation**) | `pyproject.toml` gains `rl` with legacy's ranges (`gymnasium>=1.1`, `stable-baselines3>=2.4`, `optuna>=4.0`; torch through SB3, numpy already a base dependency) and registers the `slow` marker. Nothing is added to `requirements.lock`, whose command locks only `operator` and `mcp` and whose contract test checks that command |
| The shared tier's book price (**Deviation**, money form in simulation only, for the owner) | The kernel's ledger accepts a FILL price only in money form (LED-R06), so the delayed part-fill at `104.052` reaches the kernel as `104.05` (half-even); the responder's record keeps `104.052` and the research booking reads it. `adapters/simulated_broker.py` also records a scripted immediate reject as an effect. Kernel and schema are unchanged |
| Shared-tier timing | A recorded bar is available one minute after it starts and decisions sit 10 s after a seal: the partial FILL 25 at 100.05 is seen at the second step, the delayed FILL 75 at the last decision, not "after one bar". Worst case −101.039 a unit and `leg("buy", 100.05, 25).total` 24.73 hold |
| Shared-tier digests (**Deviation**) | `reference_store_digest` is the legacy digest of the spec digest; `assumptions_digest` the legacy digest of `{tier, fill identity and digest, costs, bar_secs}`; the text named none |
| Tiers | Every record carries `tier`; v1 `info` carries it only in the shared tier, so the abstract v1 stream stays legacy's. `freeze` records the tier and refuses mixed tiers ("every session of one run must run in one environment tier"). The lab's `LabData` still builds only abstract environments |
| Abstract tier (**Deviations**) | The environment definition adds `tier` and `costs_digest`, so a changed cost schedule cannot resume as compatible; a tick contradiction marks the run's reference ineligible, as legacy's `ReferenceUse` (the text fixed `eligible: true`; the fill is refused either way); the reference `used_digest` is over the per-session used digests; `ResearchEnvironment` requires its `ledger`; rows are filtered to a session's `sequence_from`/`sequence_to` when named; v2 adds `transition_index` |
| Source hashes | `vector_source_digest`, the observation `source_digest` and the observation contract hash with CRLF normalised, as step 4 |
| Inference | `ResearchPolicyAdvisor(candidate, *, adapter_receipt, act=None)`; `act` stands in for the network in tests, else the weights load on CPU through SB3. `View`, `AdvisorContext` and `CandidateLoadReceipt` are local ports. `from_candidate` takes step 3's `VerifiedCandidate`; legacy's candidate replay methods (`rp.py:577-694`) are outside the ported range and not ported. `PolicyProposals` builds its context from the request's `bars` |
| Labels | `research_lab_runner` is `"research.rl.training"`; the custody source label stays legacy's `"analysis.rl.environment"`, so the chain reads as legacy's |
| The job type | `research.rl_train` targets `research.rl.training:rl_train_job` with JSON parameters (`RL_TRAIN_PARAMS`); not run, it needs the `rl` extra |
| Break checks | None, under the owner's fast routine (research-only, no money path) |

**Tests run (Windows, targeted only):** `tests/unit/test_rl_research.py`, `tests/unit/test_candidate_freeze.py`, `tests/integration/test_research_worker.py`, `tests/integration/test_shared_engine.py`, `tests/unit/test_promotion_gate.py`, `tests/unit/test_dataset_fitting.py`, `tests/contracts/`, `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 338 passed, 8 skipped, twice in a row. The `slow` case is **not checked**: the `rl` extra is not installed (disk C: had about 2 GB free). `ast.parse` passes on every edited file.

## Step 6 — promotion and the kernel's checks

<a id="step-6--promotion-and-the-kernels-checks-outline"></a>

**Authorities.** The spec's [Promotion and the kernel's check](../../design/research-rl-custody-promotion.md#promotion-and-the-kernels-check-researchpromotionpy), the witness bullet of [Custody](../../design/research-rl-custody-promotion.md#custody-researchcustodypy), PRF-RES-12, PRF-RES-02 rows CP-R11 and CP-R12, and the witness rows of PRF-RES-03. Step 6 is TASK-S12-06.

**What it builds on:**
* step 5 as built (`fa533d8`);
* step 4's `research/evaluation.py`: `bar`, `evaluate_gate`, `_frozen_rule_parameters`, `evaluation_identity`, `select_track`, `current_acceptance_rule`, `validate_locked_evaluation`;
* step 1's `CustodyWitness` port, `Witnessed` and `WitnessClient`;
* SLICE-03's bindings and grants (`kernel/authority.py`);
* SLICE-04's admission check A3 (`kernel/admission.py` `_a3`, `kernel/lifecycle.py` `entry_session_check`, `ADM-R14 candidate_not_bound`);
* SLICE-09 step 1's `decision_method` and `authority` on registrations (`strategies/registry.py`).

It is built in the main OA_NEW checkout (branch `slice-08`) after slice-12 is merged into it. A decision that leans on a detail not re-read here is marked **(re-check at build)**.

**Citations.** Every legacy citation is at 445eb116:

| Short name | File |
|---|---|
| `promotion.py`, `promotion_bar.py` | under `src/runtime/advisor/` |
| `evidence.py` | `src/core/governance/evidence.py` |
| `host_lifecycle.py` | `src/runtime/strategy_host/lifecycle.py` |
| `host_registry.py` | `src/runtime/strategy_host/registry.py` |
| `activation.py` | `src/authoring/capabilities/candidate_activation.py` |
| `approval.py` | `src/authoring/capabilities/promotion_approval.py` |
| `session_config.py` | `src/runtime/session_config.py` |
| `defaults.yaml` | `config/defaults.yaml` |

Every value below is synthetic or is legacy's own rule applied by hand. No production record was read.

**Revised 2026-11-04 after review ("yes after fixes", items 1–10).** The fork rule settles every item: legacy wins, and no new gate is put on trading.

**In plain words.** This step lets a model-driven candidate trade only when two things hold, as in the old system.
* **The approval.** The candidate was approved once for its binding. The owner approves it, or, only where the owner has switched that kind of candidate to automatic and the evidence is real broker evidence, the research service does. The approval holds for every day of the binding.
* **The day's receipt.** A promotion receipt exists for that same trading day. Any named reviewer may write it, and it must pass the old checks and the old bar.

The kernel records who approved; it never trusts a name written inside the record. The kernel also knows each candidate's family from the binding itself, so research cannot relabel a candidate to approve itself. An approval or receipt recorded during the day counts from then on, after a restart too, exactly as the old system let a strategy start once its receipt existed. BuyerEdge is a rule strategy, flagged "no promotion needed", and meets none of this. The kernel also keeps a witness of the research custody chain. No gate value, bar value or limit is set here.

### Decisions

#### Which candidates need promotion, and their family (`strategies/registry.py`, `kernel/authority.py`, `bootstrap.py`)

* **The rule, unchanged (Fork call, slice Fork call 10).** A candidate needs promotion when its registration's `decision_method` is `"model"` and its row's authority is not `"none"` (`host_lifecycle.py:220-226`). Legacy's authorities are exactly `none`, `plan` and `trade` (`host_registry.py:394-397`), so "not none" means "plan or trade". New: `requires_promotion(registration) -> bool` in `strategies/registry.py`.
* **The flags the kernel trusts (slice Deviation 12; review item 3).** `StandingBinding` gains two mappings, each keyed by exactly `candidate_ids`, else `ValueError`:
  * `requires_promotion: Mapping[str, bool] | None = None`;
  * `families: Mapping[str, str] | None = None`, where each value is in `PROMOTION_FAMILIES` or `""` (none).

  Both are filled in by the binding's authorizer from the registry row and the candidate bundle's family. `None` reads as every candidate `false` and `""`.

  Where they travel: `BINDING_AUTHORIZED` carries both (`resources/events.schema.json` lists them), the `standing_binding` row stores them, `BindingRef` returns them, and `SESSION_OPENED` copies them into the `session` row.

  Legacy looked the family up in the candidate registry by digest (`approval.py:258-267`, `:293-294`). Binding it does the same, without letting the caller being judged write the family.
* **Earlier events and upgraded ledgers (review item 5).**
  * An event recorded before these fields folds as `p.get("requires_promotion") or {}` and `p.get("families") or {}`.
  * A row from an upgraded ledger reads its column's default `'{}'`.
  * Any `NULL`, missing key or unparsable value reads as `false` / `""`.

  So BuyerEdge's existing binding never needs promotion. This is a **Deviation**: no model-driven candidate can have been bound before SLICE-12.
* **The host's refusal (strategies spec integration edit).**
  * `compose_strategy_host` gains `binding_flag: Callable[[str], bool | None]`. It returns the current binding's flag for a candidate ID, and `bootstrap.py` composes it from `authority.validate_binding(scope, today)`.
  * The refusal fires when all three hold: `requires_promotion(registration)`, `promotion_enforce`, and a flag for the host's computed `candidate_id` that is not `True`. The host then returns `Refusal("STR-R16", "promotion_flag_false", None, "open")` before anything opens.
  * This mirrors where legacy checked, at start (`host_lifecycle.py:200-227`).
  * **(re-check at build:** how the host learns its scope and today's date.)

#### The record and recording (`research/promotion.py`)

* **`PromotionRecord/v1`** is defined in a new `resources/candidates.schema.json`, in the `autonomous_trading.payload_fields/1` format that `events.schema.json` uses (an exact key set, no extra key). Its fields:
  * `schema` `"PromotionRecord/v1"`, `candidate_id` (64 hex), `family`, `strategy`;
  * `identity`: legacy's model identity bundle;
  * `prompt_digest` (`sha256:`), `evaluation_identity` (`sha256:`);
  * `claim {evidence_track, partition_ids, reservation_id, consumption_event_id}`;
  * `gate` (object), `bar {passed, values, reasons}`;
  * `scope {account, calendar_id, trading_date}`;
  * `reviewer` (wire principal), `recorded_at`.

  There is no approval or approver field. **Deviation:** the explicit `schema` key. Legacy's receipt fields `code_ref`, `candidate_activation` and `candidate_receipt` (`promotion.py:216-270`) are not carried, because `CandidateId` covers them (slice Fork call 20).
* **Bytes and digest.**
  * `record_bytes(record)` is the canonical JSON (sorted keys, `,`/`:` separators, `ensure_ascii=False`) of `json_form(record)`.
  * A non-finite number raises `ValueError("promotion record is not finite JSON")`.
  * `record_digest = "sha256:" + legacy_digest(json_form(record))`. One test asserts that it equals the kernel's digest of the same bytes and the evidence store's content digest.
* **`record(evaluation, *, strategy, reviewer, scope, values, settings, source_verifier, lineage_verifier=None, today) -> PromotionRecord`** ports `record_from_evaluation` and `record_promotion` (`promotion.py:181-278`, `:333-467`). **Fork call**, slice Fork calls 6, 7 and 13. The checks run in legacy's order with legacy's messages:
  1. The identity matches its content (`:345-347`).
  2. The candidate is the strategy's (`:348-350`).
  3. A v2 record needs the lineage verifier (`:351-363`).
  4. The required sections are present (`:364-370`).
  5. The source verifier rebuilds every verified section (`:373-396`).
  6. The locked consumption is verified, else "evaluation has no verified locked-OOS consumption" (`:416-418`).
  7. The frozen rule equals the bound rule (`:419`).
  8. The recomputed gate equals the recorded one, else "evaluation gate does not match the current promotion rule" (`:420-434`).
  9. The evaluation is eligible, else "cannot record promotion: the evaluation is not eligible" (`:435-436`).
  10. **The model identity bundle (review item 4).** No `identity` mapping raises "evaluation candidate has no model identity bundle" (`:438-439`). The bundle must have exactly legacy's `IDENTITY_FIELDS`, else "promotion identity bundle is incomplete". Its `strategy_family` must be in `{options_buyer, options_seller}`, else "promotion identity bundle has unsupported strategy_family". The four other fields go through `require_sha256_digest` (`normalize_identity`, `:38-53`).
  11. `candidate.prompt_digest` goes through `require_sha256_digest(..., "candidate.prompt_digest")` (`:440-444`).
  12. The gate is eligible (`:198-199`).
  13. The bar passes through step 4's `bar(..., values=values)`. Otherwise it raises "cannot record promotion: the promotion bar refuses: " followed by the reasons joined by "; " (`:205-211`).
  14. `scope.trading_date` must be the exchange date of `today()`, in Asia/Kolkata's fixed +05:30. A scope for another date raises "cannot record promotion for another day; review and receipt must be same-day" (`:56-58`, `:212-215`).
  15. **The reviewer (review item 10).** `reviewer` must be an instance of `contracts.identity.Principal`, else "reviewer is required; a self-created anonymous receipt is not a review" (`evidence.py:136-138`). Legacy required only a non-empty name; research cannot authenticate, and the kernel records who submitted the record.

  When `_frozen_rule_parameters` returns no frozen minimum, the bound `promotion.directional.min_scored_per_horizon` is passed, as legacy read its config (`promotion.py:315`).
* **Kept on disk once.** `save(record, root)` writes `<research.trial_root>/promotions/<digest hex>.json` through a temporary file and a no-replace link (step 2's idiom). Other bytes already at that path raise `PromotionError("promotion record already written with other content")`. **Deviation 11**: legacy wrote a governance receipt (`promotion.py:277-278`).

#### The kernel's two acts (`kernel/authority.py`)

Legacy had two separate things, both kept (review items 1 and 2):
* **The daily receipt:** a same-day record by any named reviewer (`evidence.py:263-269`; `host_lifecycle.py:167-184`).
* **The owner's activation approval:** made once, stays on the active profile and is reused on later days (`session_config.py:889-899`; `activation.py:319-343`).

* **`Authority.promotion_record(auth, binding_id, record_bytes) -> Committed | Replayed | Refusal`: the day's receipt.** Callers are the owner, or a service principal holding the `promotion_record` grant. In order:
  1. Stage `OPERATING`, else `SES-R09`.
  2. The bytes parse, equal their canonical form, pass `PromotionRecord/v1`, and have `gate.eligible` and `bar.passed` both `true`. Else `SES-R11 promotion_record_invalid`.
  3. The binding and scope checks; any failure is `SES-R12 promotion_scope`:
     * the binding exists and is unrevoked;
     * `candidate_id` is in its `candidate_ids` and its flag is `true`;
     * the record's `family` equals the binding's family for it (review item 3);
     * `scope.account` and `scope.calendar_id` equal the binding's;
     * `trading_date` lies within `first_date…last_date`;
     * `trading_date` equals the kernel's exchange date now, `calendar.today(calendar_id, now)`. That date is computed in IST, never UTC. `Authority` gains a `today` callable; when it is `None`, the call refuses.
  4. Publish the record to the evidence store, then commit one `PROMOTION_RECORDED {binding_id, candidate_id, family, trading_date, record_digest, evidence_track, reviewer, recorder}`. `recorder` is `auth.principal`.

  The same bytes again return `Replayed`. Another record for the same `(binding_id, candidate_id, trading_date)` is recorded too, as legacy kept every receipt; admission needs only one.
* **`Authority.promotion_verify(auth, binding_id, candidate_id, record_digest, reason) -> Committed | Replayed | Refusal`: the approval.** It is valid for every date of the binding. A human call is bound first: `bind(auth, "promotion_verify", target_of(account, binding_id), {"candidate_id", "record_digest", "reason"})`. In order:
  1. Stage `OPERATING` (`SES-R09`).
  2. `record_digest` names a `PROMOTION_RECORDED` row for this binding and candidate, else `SES-R12`. That row supplies the evidence track. The family comes from the binding, never from the bytes.
  3. **Who approves (Fork call, slice Fork calls 8 and 9; slice Deviation 11).** The approver is `auth.principal`.
     * The owner, over `owner_credential`, may approve any record (`approval_path "owner"`).
     * Any other human, delegated grants included, is refused.
     * The research service is accepted only when all three hold: the record's track is `real_broker_track_record`, the binding's family for the candidate has a latest `PROMOTION_MODE_SET` of `automatic_when_bar_passes`, and `check("promotion_approve", auth, account)` passes (`approval_path "automatic"`).
     * Anything else refuses `SES-R13 approver_not_permitted`. A missing, revoked or expired grant keeps `check`'s own `SES-R02…R05`.
  4. **One approval per binding and candidate (Fork call, slice Fork call 9).** `approval_id = digest({"binding_id", "candidate_id"})`.
     * The same `record_digest` again returns `Replayed` and writes nothing (`activation.py:338-341`).
     * Another `record_digest` refuses `SES-R12`, as legacy's "this profile version already has a different approval" (`:342-343`).
     * A new binding needs a new approval, as a new staged profile did (`activation.py:271-276`, `:310-317`).
  5. Commit one transaction: `PROMOTION_VERIFIED {approval_id, binding_id, candidate_id, family, record_digest, approver, approval_path, reason}`, plus the human's `OPERATOR_REQUEST` draft.
* **`Replayed` for a service caller (review item 9).** It is `Replayed(request_id=None, decision="PROMOTION_VERIFIED" or "PROMOTION_RECORDED", sequence=<the stored event's sequence>)`. A human caller gets the existing `Replayed` with its request ID.
* **The stage table and `check` (review item 8).** `ACTIONS_PER_STAGE["OPERATING"]` gains the exact strings `"promotion_record"`, `"promotion_verify"`, `"promotion_approve"`, `"promotion_mode_set"` and `"custody_witness"`. `check` is called with verb `promotion_record` or `promotion_approve` for a service caller, and `custody_witness` for the witness. The owner path calls `check` only through `bind`, as other owner operations do.
* **Grants and operations.** `GRANT_ACTIONS` and `SERVICE_ACTIONS` gain `promotion_record`, `promotion_approve` and `custody_witness`. `OPERATIONS` gains `promotion_record`, `promotion_verify` and `promotion_mode_set`, with their doors (`interfaces/authorization.py:220-221`).
* **Refusal codes.** `SES-R11…SES-R15`, `ADM-R16` and `STR-R16` are unused (review check). Each refusal carries its label; legacy's text stays in the research-side message.

#### `PROMOTION_MODE_SET` (`kernel/authority.py`)

**`Authority.set_promotion_mode(auth, family, mode, reason)`** ports legacy's `switch` (`approval.py:172-202`; **Fork call**, slice Fork call 9). It is bound as `promotion_mode_set`.

Each of these refuses `SES-R13`:
* a caller that is not `auth.principal == owner` over `owner_credential`.

Each of these refuses `SES-R14 mode_switch_invalid`:
* `family` not in `PROMOTION_FAMILIES` (`advisor`, `ai_management`, `local_model`, `research_policy`, `strategy_config`; legacy's families less the research-only ones, `approval.py:50-56`);
* `mode` not in `("owner_approval", "automatic_when_bar_passes")` (`:37-40`);
* an empty `reason`;
* a switch to the current mode (`:193-194`).

The payload is `{family, from, to, principal, reason}` (`:195-196`). A family with no event reads `owner_approval` (`:146-152`). **Deviation 11**: this is a ledger event, not `modes.json`.

#### The admission check (`kernel/lifecycle.py`, `kernel/admission.py`)

* **`promotion_session_check(writer, session_id, candidate_id, enforce) -> Refusal | None`** is run by `_a3` after `entry_session_check`, so at stage A and again at stage B. It returns `None` when:
  * `enforce` is false;
  * the session row's `requires_promotion` for the candidate is not `true` (BuyerEdge, slice Fork call 10);
  * or, the candidate being flagged, both legacy acts exist:
    * **the approval:** a `promotion_approval` row for `(session.binding_id, candidate_id)`;
    * **the day's receipt:** a `promotion_record` row for `(session.binding_id, candidate_id, session.trading_date)`.

  Otherwise it returns `Refusal("ADM-R16", "candidate_not_promoted", None, "COMMAND_ADMITTED")`, recorded as every A3 refusal is.
* **When they count (Fork call, slice Fork call 11 revised; review item 1).** Both rows serve every entry admitted after they are recorded, including after the open and after a restart. This is legacy's behaviour: a strategy (re)started once its same-day receipt existed (`host_lifecycle.py:167-184`, `:200-227`; `evidence.py:263-269`), and a day's binding was written at its first start, not at the open (`session_config.py:864-887`).
* **Only entries are checked.** The check lives in `_a3` alone. `ActionAdmission` and dispatch row 4 (`kernel/coordinator.py:328-332`) never call it, so cancels, modifies, closes and protective actions are never gated by promotion.

#### `promotion.enforce` (Fork call, slice Fork call 12; X-009; review item 6)

* `Settings.promotion_enforce: bool = True` is a non-refusing setting, like `kill_switch` (`settings/schema.py:65`). Its `Field` is `promotion.enforce`, register `legacy`, scope kernel and strategy host, and it ships `true` in `resources/defaults.yaml`. It is **not** in `_ADMISSION` (`settings/loader.py:870`).
* The legacy profile key `advisor.promotion.enforce` is accepted as an alias. A profile that sets both to different values refuses `CFG-R03`. **(re-check at build:** the loader's profile-key alias mechanism; add a minimal one if none exists.)
* This matches legacy, which shipped `true` (`defaults.yaml:765-766`) and read a missing key as `true` (`promotion.py:477`).
* `false` skips `promotion_session_check` and the host's `STR-R16`, as legacy's `may_promote` returned `(True, "")` before any receipt check (`promotion.py:477-478`). The binding checks stay: `ADM-R14` still refuses a candidate outside the session (`host_lifecycle.py:156-166`).

#### Approval modes and automatic submission (`research/promotion.py`)

* **The port.** `PromotionPort(Protocol)` has `record(record_bytes, binding_id) -> dict`, `verify(binding_id, candidate_id, record_digest, reason) -> dict` and `mode(family) -> dict`. `bootstrap.py` implements it over the kernel as the research service. Research never imports the kernel.
* **`after_record(record, *, port, binding_id, values_now) -> dict`** ports legacy's `after_promotion` (`approval.py:270-372`; **Fork call**, slice Fork call 9):
  * An estimated-track record returns `{"outcome": "awaiting_owner_approval", "reason": "locked-OOS estimated evidence always requires explicit owner approval for NEXT_SESSION"}` and never calls `verify` (`:303-304`, `:336-340`).
  * `owner_approval` mode returns `awaiting_owner_approval`.
  * In `automatic_when_bar_passes` on the real track, it refuses "the promotion bar is unset; automatic approval never runs without it: …" when the bar's values are unset (`:305-308`). It refuses "the promotion bar changed since the receipt was minted" when the values differ from `record.bar.values` (`:309-312`).
  * Otherwise it calls `verify` once, with reason `"automatic_when_bar_passes for family <family>: promotion bar passed; mode set by <by> at <at>"` (`:320-326`), and returns `approved_for_next_session`.
  * A kernel refusal is returned as `{"outcome": "refused", ...}`, never raised (`:278-280`).
* **Not ported:** the Telegram request (`approval.py:215-228`, `:346-371`). It moves to SLICE-10's alert route (slice **Deviation 16**).

#### The custody witness (`kernel/authority.py`, `bootstrap.py`; slice Deviation 9)

* **`Authority.custody_witness(auth, authority_id, sequence, event_hash, kind)`.** The caller is a service principal whose `check("custody_witness", auth, None)` passes, at stage `OPERATING`. The inputs: `authority_id` 32 hex, `sequence` ≥ 1, `event_hash` 64 hex, `kind` a custody event kind. Against the stored witness for that authority:

  | Input | Result |
  |---|---|
  | A higher sequence | Commits `CUSTODY_WITNESSED` |
  | The same sequence and hash | Returns `Replayed(None, "CUSTODY_WITNESSED", seq)` |
  | A lower sequence, or the same sequence with another hash | Refuses `SES-R15 witness_regressed` (**Deviation**) |

  Admission never reads or waits for it.
* **`KernelCustodyWitness(comp, principal)`** in `bootstrap.py` implements step 1's port: `witness`, `latest` and `latest_witnessed`, which feeds `reconcile`.

#### Migration 9 (`kernel/ledger/schema.py` and migration 9's SQL file; review item 5)

```sql
ALTER TABLE standing_binding ADD COLUMN requires_promotion TEXT NOT NULL DEFAULT '{}';
ALTER TABLE standing_binding ADD COLUMN families TEXT NOT NULL DEFAULT '{}';
ALTER TABLE session ADD COLUMN requires_promotion TEXT NOT NULL DEFAULT '{}';
ALTER TABLE session ADD COLUMN families TEXT NOT NULL DEFAULT '{}';
CREATE TABLE promotion_record (record_digest TEXT NOT NULL, binding_id TEXT NOT NULL, candidate_id TEXT NOT NULL,
  family TEXT NOT NULL, trading_date TEXT NOT NULL, evidence_track TEXT NOT NULL, reviewer TEXT NOT NULL,
  recorder TEXT NOT NULL, recorded_sequence INTEGER NOT NULL, PRIMARY KEY (binding_id, record_digest));
CREATE INDEX promotion_record_day ON promotion_record(binding_id, candidate_id, trading_date);
CREATE TABLE promotion_approval (approval_id TEXT PRIMARY KEY, binding_id TEXT NOT NULL, candidate_id TEXT NOT NULL,
  family TEXT NOT NULL, record_digest TEXT NOT NULL, approver TEXT NOT NULL, approval_path TEXT NOT NULL
  CHECK (approval_path IN ('owner','automatic')), verified_sequence INTEGER NOT NULL, UNIQUE (binding_id, candidate_id));
CREATE TABLE promotion_mode (family TEXT PRIMARY KEY, mode TEXT NOT NULL
  CHECK (mode IN ('owner_approval','automatic_when_bar_passes')), principal TEXT NOT NULL, set_sequence INTEGER NOT NULL);
CREATE TABLE custody_witness (authority_id TEXT PRIMARY KEY, sequence INTEGER NOT NULL, event_hash TEXT NOT NULL,
  kind TEXT NOT NULL, witnessed_sequence INTEGER NOT NULL);
```

Readers parse the two JSON columns with a helper that maps `NULL`, an empty or unparsable value, or a missing key to `false` / `""`; nothing calls `json.loads` on a raw column. The projections (`kernel/ledger/projections.py`) fold the five new and two changed kinds. `store.py`'s `_FAMILY`, `_PK` and the per-kind load (`store.py:793`) list the new tables. **(re-check at build:** the projection-integrity guard's table list.)

#### Settings (`settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml`)

* `promotion.enforce`, as above.
* `promotion.bar.min_net_rupees` and `.min_margin_over_baseline` (`decimal`) and `.min_trades` (`int_nonneg`): register `legacy`, scope research, unset as legacy shipped them null (`defaults.yaml:747-751`). Unset, every recording refuses "promotion.bar.<key> is unset; the owner has not chosen it" (`promotion_bar.py:61-70`; slice Fork call 6).
* The repository binds none of the three bar values.

#### Integration edits (from Excluded)

* **The sessions spec:**
  * both flags in `BINDING_AUTHORIZED`, the `standing_binding` and `session` rows, `BindingRef`, and how earlier events read them;
  * the events `PROMOTION_RECORDED`, `PROMOTION_VERIFIED`, `PROMOTION_MODE_SET` and `CUSTODY_WITNESSED`;
  * the grant actions;
  * the codes `SES-R11…R15`.
* **The intent spec:** `ADM-R16`.
* **The strategies spec:** `STR-R16`.
* `resources/events.schema.json` and `resources/candidates.schema.json`.

### Tests

**Shared fixtures.** Every value is synthetic.
* **Account and calendar:** `A = AccountId("sim", "ACC1")`, calendar `NSE`.
* **Dates and times:** trading dates `D1 = 2026-11-04` and `D2 = 2026-11-05`. The open is `09:15` IST (`03:45:00Z`). **(re-check at build:** the scripted calendar fixture.)
* **Candidates:** `BE = "be"*32` (BuyerEdge, rule); `M = "a1"*32` (model, authority `plan`, family `advisor`); `M2 = "a2"*32` (`M` with one prompt byte changed).
* **Binding `B1`:** binding `bind-1`, candidates `[M, BE]`, `requires_promotion {M: true, BE: false}`, `families {M: "advisor", BE: ""}`, dates `D1…2026-11-06`.
* **Principals:** the owner (through `operator_call`); `ops` (a delegated human holding `entry`, `promotion_approve`); `research` (a service holding `promotion_record`, `promotion_approve`, `custody_witness`); `strategy:m` and `strategy:be` (services holding `entry`).
* **Records:** `REC(track, date)` is a passing `PromotionRecord/v1` for `M`, family `advisor`, scope `(A, NSE, date)`.

**`tests/integration/test_custody_promotion.py` (new), PRF-RES-12.** It runs in `compose_simulation` with admission composed and `promotion_enforce` `True` unless a case says otherwise. **(re-check at build:** the shared entry helper.)

| Group | Cases |
|---|---|
| Two acts | `research` records `REC(estimated, D1)` at `08:30` and the owner verifies it. An entry of `M` at `09:20` is admitted. One `PROMOTION_RECORDED` and one `PROMOTION_VERIFIED` (`approver ["owner","human"]`); the evidence object's SHA-256 equals `record_digest`. On `D2` with no `D2` record, `M`'s entry → `ADM-R16`. `research` records `REC(estimated, D2)` at `10:00` on `D2`, with no new approval: an entry at `10:05` is admitted (the approval holds for the binding's range) |
| After the open (review item 1) | No record before the open on `D1`. `M`'s entry at `09:20` → `ADM-R16`. The record and the approval are made at `09:30`. An entry at `09:35` is admitted. After a kernel restart (a new composition over the same ledger) an entry at `09:40` is admitted |
| Exchange date (review item 7) | At `2026-11-04T00:10+05:30` (`2026-11-03T18:40Z`) `research` records `REC(estimated, D1)` → recorded. `REC(estimated, 2026-11-03)` at that instant → `SES-R12` |
| Binding and family | `B2` is authorized after `B1`. Verifying `B1`'s approval against a session opened on `B2` → `M`'s entry `ADM-R16` until `B2`'s own approval. A record for `BE` → `SES-R12`. A scope naming another account → `SES-R12`. **Family (review item 3):** a record of `M` with `family "research_policy"`, while the owner has set `research_policy` to automatic and `advisor` is in owner approval → `SES-R12`, nothing recorded |
| Who approves | Estimated record: `ops` → `SES-R13`; `research` → `SES-R13`; the owner → recorded. Real track with no mode event: `research` → `SES-R13`. After the owner sets `advisor` to automatic: `research` → recorded, `approval_path "automatic"`; `research` with its grant revoked → `SES-R03`; `ops` → `SES-R13`. Record bytes with an added `"approver"` key → `SES-R11`. The same approval again → `Replayed` (for `research`, `request_id None`); another record digest for `(bind-1, M)` → `SES-R12` |
| Modes | `ops` and `research` setting a mode → `SES-R13`. The owner switches `advisor` → one event with `from "owner_approval"`. The same switch again, family `"x"`, mode `"auto"`, or an empty reason → `SES-R14` each |
| BuyerEdge | `B1` with no promotion rows: `BE`'s entry is admitted, and the ledger holds no `ADM-R16`. A binding built with both mappings `None` reads all `false` / `""`. **Upgraded ledger (review item 7):** a ledger at migration 8 with `B1`'s binding and `BE`'s open session is migrated to 9; the two columns read `'{}'`; `BE`'s entry is admitted; a row whose column is set to `NULL` by hand reads `false`. A `BINDING_AUTHORIZED` event written without the two keys folds to `false` |
| Exits are never gated (review item 7) | `M` holds a position from an admitted entry. Its promotion rows are then absent for the day (on `D2`, no record). A protective modify, a cancel and an owner close are admitted, and dispatch row 4 sends them |
| Substitution | After `M` is approved and its entry fills, the host loads `M2` → `ADM-R14`. A host whose `binding_flag` gives `false` for `M` → `STR-R16`. `M` with authority `none` → starts. `BE` with flag `false` → starts |
| Enforce | `promotion_enforce` `False` with no promotion rows: `M`'s entry is admitted; `M2`'s is still `ADM-R14`; the `false`-flag host starts. `Settings()` built without the field has `promotion_enforce is True`. The shipped `resources/defaults.yaml` resolves `promotion.enforce` to `true` (review item 7). A profile with `advisor: {promotion: {enforce: false}}` resolves to `false`. Both keys with different values → `CFG-R03` |
| Recording | Over step 4's passing `evaluate` record, real track, with `min_trades` set to its matched count `N`. `today` `2026-11-04T00:10+05:30` gives `trading_date` `2026-11-04`. Bar values all `None` → three unset reasons. `min_trades` `N+1` → "N matched AI trades is below min_trades N+1". A scope date of `2026-11-03` → the same-day text. One changed byte → "evaluation identity does not match its content". `reviewer="ops"` (a string) → the reviewer text. Candidate without `identity` → "evaluation candidate has no model identity bundle". An identity missing `model_spec_digest` → "promotion identity bundle is incomplete". `strategy_family "futures"` → "promotion identity bundle has unsupported strategy_family". `prompt_digest "x"` → the `candidate.prompt_digest` digest message. `record_digest` equals the kernel's digest of `record_bytes` |
| Automatic | A fake port. Owner mode → `awaiting_owner_approval`, no call. An estimated record in automatic mode → the estimated text, no call. Automatic mode with `values_now` unset → the unset text. `min_trades` 31 now → "the promotion bar changed since the receipt was minted". Equal values → one `verify` call with the legacy reason text |
| Disclosure | Three `evaluate` runs over locked rows give three disclosures (`README.md:879`) |

**`tests/recovery/test_restore_fencing.py`, PRF-RES-03 witness rows:**
* **K1:** four `CUSTODY_WITNESSED` for `"8"*32` at sequences 2, 3, 4 and 5 with step 1's hashes; `latest` is 5.
* **K2:** a chain stopped after `claim_read` gives step 1's `W4`. Rows R2, R5, R6, R8 and R9 give step 1's statuses; R7's committed witness gives `conflict`.
* **K3:** a lower sequence, or the same sequence with another hash → `SES-R15`.
* **K4:** `research` without `custody_witness` → `SES-R02`, `client.errors == 1`, and custody is unaffected.

**`tests/recovery/test_crash_boundaries.py`, by killing a real process:**
* **CP-R11:** the child exits 86 on the `PROMOTION_VERIFIED` decision. The record's evidence object is present and `M`'s entry is `ADM-R16`. A resubmission commits exactly one event, and a third commits none.
* **CP-R12:** step 1's `CP-RW` child with `KernelCustodyWitness`, exiting on the `consumption` witness. `latest` is 4, and reopening commits exactly one witness at 5.

**Existing tests that change:**
* `tests/unit/test_settings_resolver.py` gains the four fields and the alias.
* Any guard that lists event kinds, tables, `GRANT_ACTIONS`, `SERVICE_ACTIONS` or `OPERATIONS` gains the new names (`tests/recovery/test_projection_integrity.py`, `tests/contracts/`).

### Break checks

Each anchor is checked present exactly once, one mutation at a time, and each file is restored byte for byte (md5).

| Change | Test that must fail |
|---|---|
| The check requires the approval or the record before `SESSION_OPENED` (`verified_sequence < opened_sequence`) | After the open |
| The check requires a new approval each date | Two acts (`D2`) |
| The check ignores the day's record | Two acts (`D2` with no record) |
| `promotion_verify` takes the approver from the record's bytes when present | Who approves (added key) |
| The owner-only rule skipped for the estimated track | Who approves (`ops`, `research` on estimated) |
| A delegated human accepted with a `promotion_approve` grant | Who approves (`ops`) |
| The service accepted whatever the family's mode | Who approves (real track, no mode) |
| The family read from the record instead of the binding | Binding and family |
| The check refuses whatever the flag | BuyerEdge |
| The fold default for a missing `requires_promotion` flipped to `true` | BuyerEdge (event without the keys) |
| The column reader calls `json.loads` on `NULL` | BuyerEdge (upgraded ledger) |
| `resources/defaults.yaml` ships `promotion.enforce: false` | Enforce (shipped default) |
| The host's `STR-R16` check removed | Substitution (`false`-flag host) |
| `promotion_session_check` called from `ActionAdmission` as well | Exits are never gated |
| `promotion_record` uses the UTC date | Exchange date |
| `set_promotion_mode` accepts any principal with `grant_admin` | Modes |
| `enforce=false` also skips `ADM-R14` | Enforce (`M2`) |
| `enforce=false` still runs the promotion check | Enforce |
| `record` skips the identity-bundle check | Recording (no `identity`) |
| `record` reads the UTC date | Recording (`00:10` IST) |
| `promotion_verify` commits before publishing | CP-R11 |
| `custody_witness` accepts a lower sequence | K3 |

### Files

| File | Change |
|---|---|
| `research/promotion.py` | New: `PromotionRecord`, `record_bytes`, `record_digest`, `record`, `save`, `PromotionPort`, `after_record` |
| `resources/candidates.schema.json` | New: `PromotionRecord/v1` |
| `contracts/identity.py` | `StandingBinding.requires_promotion` and `.families`; the grant, service and operation names; `PROMOTION_FAMILIES`, `PROMOTION_MODES` |
| `kernel/authority.py` | `BindingRef` flags; `today`; `promotion_record`, `promotion_verify`, `set_promotion_mode`, `custody_witness`, the readers; the five stage strings; `BINDING_AUTHORIZED` carries the flags |
| `kernel/lifecycle.py` | `SESSION_OPENED` copies the flags; `promotion_session_check` |
| `kernel/admission.py` | `_a3` runs the check with `promotion_enforce` |
| `kernel/ledger/projections.py`, `kernel/ledger/store.py`, `kernel/ledger/schema.py` and migration 9's SQL file (new, beside the existing migrations) | The DDL above; the folds |
| `resources/events.schema.json` | Two flags in two kinds; four new kinds |
| `strategies/registry.py` | `requires_promotion(registration)` |
| `bootstrap.py` | `binding_flag` and `STR-R16` in `compose_strategy_host`; `today` for `Authority`; `KernelPromotionPort`, `KernelCustodyWitness` |
| `settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml` | `promotion_enforce` (`True`, alias); the three bar values unset |
| Tests | `tests/integration/test_custody_promotion.py` (new); `tests/recovery/test_restore_fencing.py`; `tests/recovery/test_crash_boundaries.py`; `tests/unit/test_settings_resolver.py`; the guards |
| Specs | The sessions, intent and strategies specs; this file |

### Fork calls and Deviations this step adds

* **Fork call (revises slice Fork call 11):** the approval and the day's record serve every entry admitted after they are recorded, after the open and after a restart, as legacy's start check did. Refusing an approval made after the open, or requiring it before the open, joins the spec-only improvements.
* **Fork call:** the owner's approval holds for the binding's whole date range. The daily act is the same-date record by any named reviewer (`session_config.py:889-899`; `evidence.py:136-138`, `:263-269`).
* **Fork call:** the family is bound per candidate at binding time, as legacy read it from the candidate registry rather than from the record (`approval.py:258-267`).
* **Fork call:** legacy's model identity bundle and `prompt_digest` checks, with legacy's messages (`promotion.py:38-53`, `:437-444`).
* **Fork call:** one approval per binding and candidate; a repeat is a no-op and a different record refuses (`activation.py:338-343`).
* **Fork call:** a switch to the current mode refuses, and the event records `from` (`approval.py:193-196`).
* **Fork call:** `promotion.enforce` is a non-refusing `True` with legacy's key as alias, and `false` also skips the host's flag refusal, while the binding checks stay (`promotion.py:477-478`).
* **Deviation:** older binding events and upgraded rows read as no promotion needed.
* **Deviation:** the record carries a `schema` key and drops the receipt fields `CandidateId` covers.
* **Deviation:** the reviewer is a `Principal` instance (legacy took a non-empty name); the kernel records the submitter as `recorder`.
* **Deviation:** a witness at a lower sequence, or the same sequence with another hash, refuses.

**Spec-only improvements, added to the slice list:** requiring an approval before the open of its date. This was the first plan's rule; review item 1 found it a new gate on trading.

### Completion conditions (step 6)

* **Targeted tests:** `tests/integration/test_custody_promotion.py`, `tests/recovery/test_restore_fencing.py`, `tests/recovery/test_crash_boundaries.py`, `tests/recovery/test_projection_integrity.py`, `tests/recovery/test_session_transitions.py`, `tests/integration/test_shared_engine.py`, `tests/integration/test_operator_commands.py`, `tests/unit/test_promotion_gate.py`, `tests/unit/test_settings_resolver.py` and `tests/contracts/`, twice in a row on Windows. The kernel, schema and migration change, so the whole suite runs once before the commit.
* Every break check fails a listed test and every file is restored (md5). `ast.parse` passes on every edited Python file.
* `git diff --name-only` names exactly the files above. One commit on `slice-08` in OA_NEW; nothing pushed.
* This file records step 6 "as built", with any Fork call or Deviation the build adds.

### Step 6 as built

**In plain words.** A model-driven candidate can now trade only with an owner's approval for its binding and a same-day promotion receipt, as in the old system. Both can be given during the day and count from then on, restarts included. The kernel records who approved and knows each candidate's family from the binding, so research cannot approve itself under another label. BuyerEdge is flagged as needing no promotion and is never refused by this check. Exits, protective orders and closes are never gated by promotion. The kernel also keeps a witness of the research custody chain. No gate value, bar value or limit is set.

Commit `8cc2373` on `slice-08` in OA_NEW, on top of `e771734` (the merge of slice-12). 26 files, 1,810 lines added, 53 removed. Not pushed.

It adds:
* `research/promotion.py`;
* `resources/candidates.schema.json`;
* migration 9's SQL file;
* `tests/integration/test_custody_promotion.py`.

It changes:
* **contracts:** `contracts/identity.py`, `contracts/execution.py`;
* **kernel:** `kernel/authority.py`, `kernel/lifecycle.py`, `kernel/admission.py`, `kernel/ledger/schema.py`, `kernel/ledger/projections.py`, `kernel/ledger/store.py`;
* **resources:** `resources/events.schema.json`, `resources/defaults.yaml`;
* **other source:** `strategies/registry.py`, `bootstrap.py`, `settings/schema.py`, `settings/loader.py`, `adapters/unix_channel.py`;
* **tests:** `tests/recovery/test_restore_fencing.py`, `tests/recovery/test_crash_boundaries.py`, `tests/unit/test_settings_resolver.py`, `tests/unit/test_operator_authorization.py`, `tests/unit/test_admission_checks.py`, `tests/contracts/test_capabilities.py`, `tests/contracts/test_installed_artifact.py`.

The sessions, intent and strategies design specs carry the integration edits.

**Re-checked at build:**

| Item | Found |
|---|---|
| The host's scope and date | `compose_strategy_host` has no scope. `bootstrap.binding_flag_reader(authority, clock, account, calendar_id)` builds the flag from the registry row's account, the view policy's calendar and the calendar's exchange date |
| The profile-key alias | None existed (`Field.aliases` names environment variables only). A minimal `PROFILE_ALIASES` map in the loader maps `advisor.promotion.enforce` to `promotion.enforce`; two different values give `CFG-R03` |
| The projection-integrity guard | It reads `TABLES`; nothing to list by hand |
| Calendar and entry fixtures | conftest's `FakeCalendar` (fixed +05:30, days 2026-11-03 to 2026-11-06) and `AdmissionWorld` with `coordinator.admit_entry`. The tests build their own dated `EntryRequest`, because the helper's request is fixed to 2026-11-02 |
| Refusal codes | `SES-R11…R15`, `ADM-R16` and `STR-R16`, as planned |

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| The replay's enforcement (**Fork call**, for the owner) | Step 4's research replay composes its kernel with `promotion_enforce=False`. Legacy's replay never ran the start check, and an exam must replay a candidate before it can be promoted; step 4's exam of a model `trade` candidate depends on it. Production and every non-replay composition keep the shipped `true` |
| Production flag source (open, for SLICE-10/11) | `serve_strategy` reaches the kernel over the channel and has no binding-flag read yet. A model-driven strategy with `plan` or `trade` authority therefore refuses `STR-R16` in production until that read exists. No shipped strategy is one (Q-005: BuyerEdge, a rule strategy, is unaffected) |
| `record()` arguments (**Deviation**) | It takes `candidate_id=` and `family=`, because the evaluation record carries neither. The kernel checks both against the binding |
| The binding's wire form (**Deviation**) | The two mappings are written only when set, and `adapters/unix_channel.py` (not in the plan's Files table) decodes both forms. Unflagged bindings keep their exact pre-SLICE-12 wire form and request digests. `BindingRef` and `SESSION_OPENED` carry the mappings as written (`{}` when unflagged), so an upgraded ledger's index check matches |
| `NULL` columns | The columns are `NOT NULL DEFAULT '{}'`, so a `NULL` cannot be set by hand. The reader helper is tested on `NULL` directly, and on an unparsable hand-edited row |
| The upgraded-ledger test | It builds a migration-8 ledger by limiting the migration list, the fold and the table list, with an unflagged binding. A real pre-SLICE-12 event without the keys is tested on the fold |
| `promotion_record` callers (**Deviation**) | A human other than the owner is refused `SES-R02`. The owner's bound arguments are `{"record_sha256"}`. The plan said neither |
| `custody_witness` input (**Deviation**) | Malformed input raises `ValueError` rather than refusing. The kernel keeps its own `CUSTODY_KINDS`, because it may not import research |
| Doors (**Deviation**) | The three new operations take the default door row (offered, no confirmation) on the CLI and the owner API |
| Test principals | Entries use the existing human test principal holding `g-test`, not `strategy:m` services. K4 submits one witness directly, because the scripted chain submits more than one and `errors == 1` could not hold |
| Not built | The deployment artifact still writes `"candidates_schema": None`. **Built 2026-11-14** (SLICE-15 "Carried after the fresh check", Bundle candidate schema) |
| Break checks | 22, the plan's set. Each anchor was present once, each mutation failed its listed test on the intended assertion, and every file was restored (md5). Run twice: by the builder, and again by the lead before the commit. Script: `s12f_breaks.py` in the session scratchpad |

**Tests run (Windows, affected only, plain OA_NEW, no path override):** 22 files plus `tests/contracts/`: 1,136 passed, 12 skipped (platform skips), twice by the builder and once more by the lead before the commit.
* **The plan's list:** `tests/integration/test_custody_promotion.py`, `tests/recovery/test_restore_fencing.py`, `tests/recovery/test_crash_boundaries.py`, `tests/recovery/test_projection_integrity.py`, `tests/recovery/test_session_transitions.py`, `tests/integration/test_shared_engine.py`, `tests/integration/test_operator_commands.py`, `tests/unit/test_promotion_gate.py`, `tests/unit/test_settings_resolver.py`, `tests/contracts/`.
* **The layering guards:** `tests/unit/test_market_windows.py`, `tests/unit/test_canvas_causality.py`.
* **Files that import changed modules:** `test_operator_authorization`, `test_authority_grants`, `test_operator_routes`, `test_admission_checks`, `test_protection_loop`, `test_safety_matrix`, `test_model_strategy`, `test_strategy_invocation`, `test_strategy_registry`, `test_unix_channel`, `test_custody_ledger`.

The whole-suite run the plan asks for before the commit was not made, under the owner's affected-tests routine. `ast.parse` passes on every edited file.

## Step 7 — memory and reflection

<a id="step-7--memory-and-reflection-outline"></a>

The authority is the spec's [Memory and reflection](../../design/research-rl-custody-promotion.md#memory-and-reflection-cognitionmemorypy-cognitionreflectionpy) and PRF-RES-13. Step 7 is TASK-S12-07. It touches no money, entry or gate: memory is declared by no shipped strategy, and reflection writes only proposals and job requests. Under the coordinator's rule it was planned and built in one pass, with no separate review and no break checks. Legacy citations are at 445eb116.

**In plain words.** The system can now remember past results, but only real, settled trades, and only from the moment each one settled, so a memory can never show the future. A replayed or simulated result never becomes a memory. Each caller sees only what matches its own strategy, account and licence, and exam results are never shown at all. Reflection can suggest an experiment or a candidate, keeping the old system's rule that a statistical claim needs at least 30 trades and states how reliable it is. It can never change a setting, a prompt, a limit or a promotion. Nothing here touches trading.

### Decisions

* **Partitions:**
  * `working`: held in the process, dropped at `end_run`, never persisted.
  * `episodes` and `research`.
  * `protected`: stored, never returned by recall.

  A `MemoryItem/v1` carries its partition, source references, `as_of`, licence class, strategy, account and version. An `(item_id, version)` is written once: the same content again writes nothing, and other content refuses. A version supersedes its predecessor only from its own `as_of`.
* **Episodes keep legacy's rule (Fork call, slice Fork call 19):**
  * Only a `reconciled_live_outcome` is an episode. A replay or simulated outcome refuses (POL-034).
  * It is visible from its settlement instant (`terminal_stamp`; a naive stamp reads as IST).
  * It falls inside a window of calendar days ending on the query's own day (`src/runtime/providers/adaptation.py:15-21`, `:176-212`).
  * The window is `cognition.memory.outcome_days`, refusing when unset. Legacy's `OUTCOME_DAYS` of 5 (`adaptation.py:40`) is evidence only, never a default.
* **Recall** takes the whole `MemoryQuery(purpose, session, as_of, strategy, account, license_scope, partitions)`. Every filter must match, the cache is keyed by the full scope (A06-F5), and asking for `protected` refuses.
* **Reflection** records a `ReflectionProposal/v1` in `research`, of kind `experiment` or `candidate`, and submits an experiment through an injected job port (`cognition` may not import `research`).
  * Legacy's evidence-quality rule and reliability bands are copied unchanged (`src/interfaces/mcp/core/proposals.py:8-30`, `:42-78`, `:211-280`).
  * A statistical claim cites evidence and at least 30 trades, and is stamped with its band (cut-offs at 30, 100 and 300 trades).
  * A mechanical claim cites evidence holding at least one trade.
  * The sample is measured from the reconciled episodes the caller can see, never asserted.
  * Any other kind of write refuses (POL-029).
* **Settings** (register `legacy`; scope cognition and both research participants):
  * `cognition.memory.outcome_days`: `int_pos`, unset.
  * `cognition.improvement.mode`: an `enum` of `read_only` only, shipped `read_only` as legacy's default (`config/defaults.yaml:866`). `automatic` refuses to load (slice Deviation 19).

### Files and tests

* **New code:** `cognition/memory.py` and `cognition/reflection.py`.
* **Changed:** `settings/schema.py` and `resources/defaults.yaml`; `tests/unit/test_settings_resolver.py` gains the two fields.
* **`tests/unit/test_cognition_memory.py`** (new, T-82) covers:
  * the settlement instant, naive stamps and the calendar-day window;
  * simulated and replay outcomes refused, and the unset window refusing episodes;
  * scope filters, and a cache hit never crossing scopes;
  * the protected partition never returned;
  * immutable versions, and persistence without `working`;
  * only `read_only` built;
  * writes limited to proposals and job requests, with an experiment going through the job port;
  * the evidence-quality rule;
  * memory declared by no strategy, and reflection reaching no writer.

### Step 7 as built

Commit `9f9fbfe` on `slice-12`, on top of `fa533d8` (step 5): the six files above, 898 lines added, 1 removed. Not pushed.

**Choices:** no Fork call or Deviation beyond the slice's (Fork call 19, Deviation 19). The proposal bands and the 30-trade floor are legacy's constants, not a promotion or money gate.

**Tests run (Windows, affected only):** `tests/unit/test_cognition_memory.py`, `tests/unit/test_settings_resolver.py`, `tests/contracts/`, `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 271 passed, 6 skipped, twice in a row. `ast.parse` passes on every edited file. No break checks, by the coordinator's rule for this step.

## Step 8 — the boundary

<a id="step-8--the-boundary-outline"></a>

This step is the code half of PRF-RES-14; the OS half is SLICE-11's `tests/isolation/test_resource_storage_scope.py`. Step 8 is TASK-S12-08. It adds tests only and touches no money, entry or gate, so it was planned and built in one pass, with no separate review and no break checks.

**In plain words.** A new automatic check proves the research workshop cannot reach the trading side. Research and memory code never loads the order book writer, the broker connection, the kernel's decision code or the start-up wiring. A research worker refuses to start while it holds the broker key. Only the custody module can touch the record of spent exam days. Nothing here changes behaviour.

### Decisions and tests

These tests are in `tests/contracts/test_capabilities.py`. They scan every module under `research/` (including `research/replay.py` and `research/rl/`), plus `cognition/memory.py` and `cognition/reflection.py`.

| Test | Proves |
|---|---|
| Per-module imports (one case per file) | Every `autonomous_trading` import, at any depth (function-level included), stays within `contracts`, `research`, the read side of `settings` (`loader`, `schema`, `secrets`), `cognition.memory` and `cognition.review`. None names `kernel`, `adapters`, `bootstrap` or `interfaces` |
| The transitive closure | Following every import, the scanned modules reach no forbidden module except `kernel.ledger.envelope` and `kernel.trail`, the two pure helpers that `contracts` itself imports. Both import only the standard library |
| No broker key | For both worker profiles, each of `BROKER_KEY_NAMES` is in the participant's `credentials_forbidden`, and `research.jobs.check` reports `CFG-R07 <name>` for it (a labelled synthetic value). The supervisor runs that check before every claim, and the job child inherits only the checked environment (`test_supervisor_checks_before_every_claim` already proves that order) |
| The custody chain | No scanned module except `research/custody.py` names `events.ndjson`, `.custody.lock` or `adoptions.ndjson`, so none writes the chain except through `CustodyLedger` |

### Step 8 as built

Commit `2e52d19` on `slice-12`, on top of `9f9fbfe` (step 7): `tests/contracts/test_capabilities.py` only, 94 lines added, 1 removed. Not pushed.

**Findings:**
* `cognition.review` is allowed by name, for `ProposalResult` (step 5 as built). Moving `ProposalResult` into `contracts` would let that allowance go. Listed, not made.
* "No write path to settings, policy or bindings" holds through the closure. Policy and bindings live in the kernel, which research never reaches, and research imports only the read side of `settings`.

No Fork call or Deviation.

**Tests run (Windows, affected only):** `tests/contracts/`, `tests/unit/test_market_windows.py` and `tests/unit/test_canvas_causality.py`: 243 passed, 6 skipped, twice in a row, including the 20 new PRF-RES-14 cases. `ast.parse` passes.

## Completion conditions

* Every step's completion conditions hold: its tests pass twice in a row with the whole suite, every break check fails a listed test and every file is restored (md5), and `ast.parse` passes on every edited Python file.
* PRF-RES-01…14 and the rule part of PRF-DSP-12 pass.
* The spec and this file record each step "as built", with every Fork call and Deviation that the build confirmed or added.
