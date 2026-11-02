# SLICE-09 — Strategies and cognition

* **Status:** proposed (2026-10-30); revised after a fresh EGM design review (findings F-1…F-12, resolved in this text and the spec); the implementation-readiness review is still to run. Every step below is an outline. By the owner's run-mode rule ([standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)) each step's exact detail (files, signatures, test tables, break checks) is written just before that step is built, then reviewed, built, run twice with the suite, break-checked and recorded "as built".
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [strategies and cognition spec](../../design/strategies-and-cognition.md). Every call that touches money keeps legacy's live behaviour at 445eb116 and is logged below as **Fork call**; every other intentional difference from legacy is marked **Deviation**. No score, threshold or money value is set here.
* **Phase:** master Phase 5 (A05-F1…F5, Combined-F5, D09, D12 evidence side; `README.md:1185`). Environment class S. Step 3's golden walks are generated once from a legacy checkout, which may read recorded market days in an isolated copy (pre-approved); PRF-STR-10 runs on recorded inputs (Excluded).
* **Builds on:** SLICE-03 (sessions, bindings, `CandidateId`), SLICE-04 (the entry route, `ADM-R15`, `kernel.policy.record_review`, as built), SLICE-05 (command status, D14 command keys) and SLICE-08 (views, seals, input requirements). The branch is cut from the branch carrying SLICE-08 as built.
* **Owner answers applied:** [Q-005](../../decisions/owner-questions.md#q-005) (first release: BuyerEdge on the current account); [Q-030](../../decisions/owner-questions.md#q-030) option A (a bar is final when sealed at its confirmation instant, applied by SLICE-08); the standing rules (fork rule, run mode, boundary). POL-035 (committee risk critic) and POL-036 (provider fallback activation) stay open behind refusing settings.
* **Tasks and proofs:**
  * **Step 1:** TASK-S09-01 (PRF-STR-01).
  * **Step 2:** TASK-S09-02 and TASK-S09-09 (PRF-STR-02; PRF-STR-03 rows CP-W1…CP-W5).
  * **Step 3:** TASK-S09-08 and TASK-S09-11 (characterizations; the MCP Risk Guard's ₹5,000 `daily_loss_limit` backstop is carried unchanged if live strategy orders pass it), then TASK-S09-03 (PRF-STR-04).
  * **Step 4:** TASK-S09-04 (PRF-STR-05).
  * **Step 5:** TASK-S09-05 (PRF-STR-06).
  * **Step 6:** TASK-S09-06 (PRF-STR-07, PRF-STR-08; PRF-STR-03 rows CP-C1, CP-C2).
  * **Step 7:** TASK-S09-07 (PRF-STR-09) and TASK-S09-10 (PRF-STR-11).

**In plain words.** This slice moves the strategy and the AI review out of the program that sends orders. Step 1 builds the list of known strategies and the checks a strategy's description must pass before its code is even opened. Step 2 builds the program that runs one strategy: once a minute, it decides on the bar that just became final, using a market snapshot taken for that bar alone, writes the decision down safely, tells the kernel what it decided (even "nothing", because the "fresh setup" rule needs it), and hands any entry to the kernel, so a crash can neither lose a decision silently nor send it twice. Step 3 copies BuyerEdge's scoring exactly and proves, bar after bar in unbroken runs, that it scores what the old code scored. Steps 4 and 5 rebuild the AI review team and its record of every model call. Step 6 connects the review to the kernel, which alone applies it. Step 7 proves neither side can reach orders, broker keys or settings, and that replaying a recorded day reproduces every decision. Trading rules, scores and limits do not change.

**Excluded, and where each part arrives:**

* **Carried into SLICE-08 step 3** (the market spec owns the signatures; the coordinator edits SLICE-08):
  1. resolving a view with a cutoff earlier than the resolution instant (one view per trigger, at the trigger window's confirmation instant);
  2. the `exact_minute` chain join anchored at the newest confirmed base window by the cutoff, so the view's chain, as `MarketPort.chain` returns it to the planner, is the trigger minute's poll;
  3. the spot records through the cutoff;
  4. the chain poll of one exact minute;
  5. the Greeks records of the day through the cutoff.
  Step 2 needs 1 and 2 (settled before step 2 is built); step 3 needs 3–5.
* **Carried into the intent spec** (integration): the kernel's `record_decision` route and `SessionStats.setup_fresh` derived from it (the spec's [handoff](../../design/strategies-and-cognition.md#handoff-to-the-kernel-strategiesworkerpy)). TASK-S09-09 builds them in step 2 once the intent spec carries the text.
* **SLICE-10:** the authenticated channel the strategy host and cognition use to reach the kernel (this slice uses in-process ports and a test principal); the human route that applies exit advice.
* **SLICE-11:** the strategy-host and cognition services, including a strategy-host unit (proposed tree delta **T-59**, `deploy/systemd/at-strategy.service`, the legacy unit's name); D09's OS enforcement and its proof (`tests/isolation/test_resource_storage_scope.py`); measuring `strategies.host.seal_wait_ms` and `strategies.host.review_retry_ms` (TASK-S11-07).
* **SLICE-12:** `cognition/memory.py`, `cognition/reflection.py`, the research-job port, and Phase 5's comparison of simple and specialist teams (`README.md:1185`), a research evaluation. **Deviation** from the module index, which lists memory and reflection for SLICE-09: they need custody and the job port, and the master forbids scaffolding empty modules.
* **PRF-STR-10:** BuyerEdge's decisions over recorded days through the target store (POL-024's acceptance) need recorded sessions in a target market store, captured with TASK-S11-07. It runs then, before any live use, as PRF-ADM-07 does. Step 3's golden walks are its unit-level stand-in.
* **Not ported:** legacy's worker specs `ema_cross_spot` (a `rule`-backend worker, `src/strategies/ema_cross_spot.py:82-99`) and `ai_ema_cross` (`src/strategies/ai_ema_cross.py:126-132`), both disabled at authority `none`. `model_strategy.py` carries the model mechanism; either strategy returns only as a new descriptor.

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | Descriptors read as data, validation before load, registry rows (enabled, authority, account) from the bound settings, the ceiling, legacy kind mapping, `CandidateId`, the simulation-only test package (`strategies/registry.py`) | PRF-STR-01 |
| 2 | The strategy store; invocation identity (valid command key, view policy in the digest); the state machine and I-W1…I-W5; scope serialization; restoration kinds; one view per trigger; the handoff (publish, decision record, review request, submit, every kernel answer and the retry bound) and recovery CP-W1…CP-W5; the pass schedule and seal wait on a recorded clock (`strategies/worker.py`); the kernel's decision record and `setup_fresh` (TASK-S09-09); EMA cross as the stateless example (`strategies/ema_cross.py`); the host composition and its service principal (`bootstrap.py`) | PRF-STR-02, PRF-STR-03 (CP-W rows) |
| 3 | Characterizations first (TASK-S09-08); then BuyerEdge: the scorer ported unchanged, the input assembly over the view, the bound clock, the intent and abstention mapping, `reset_on_restart` state, the view policy (`strategies/buyer_edge.py`); golden contiguous walks | PRF-STR-04 |
| 4 | Blueprint validation with legacy's limits and budgets, the runtime's team supervision, typed role outcomes, the assembly validator and legacy's consequences (`cognition/blueprint.py`, `cognition/runtime.py`); role-scoped tools (`cognition/tools.py`) | PRF-STR-05 |
| 5 | Backends, Retry-After and the pause warning, budgets, the inactive chain, run records, the record store, replay (`cognition/providers.py`, `cognition/records.py`) | PRF-STR-06 |
| 6 | The entry review producer and its route to the kernel (`cognition/review.py`); proposals for model strategies (`strategies/model_strategy.py`); exit advice and its application request (`cognition/advice.py`); CP-C1, CP-C2 | PRF-STR-07, PRF-STR-08, PRF-STR-03 (CP-C rows) |
| 7 | The capability boundary over both packages; the replay composition over a recorded session | PRF-STR-09, PRF-STR-11 |

**Why this order.** The host loads only validated descriptors (1 before 2). One view per trigger (F-1) and the decision record (F-2) are settled before step 2 is built, since both shape its handoff. BuyerEdge needs the host's protocol and waits for SLICE-08 step 3's reads (2 and SLICE-08 step 3 before 3). The cognition steps 4 and 5 depend on nothing in 1–3 and may be built in parallel by a second agent owning `cognition/*` only. Step 6 joins both sides. Step 7 checks the finished packages and replays a whole recorded session through them.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root. `RFL` is `scripts/run_framework_live.py`.

* **Registration.** Rows hold `id, name, kind, authority, strategy_family, exchange, enabled` and process fields (`src/runtime/strategy_host/registry.py:503-510`). Kinds are `library`, `worker`, `ai_worker`; an unknown kind becomes `worker` (`registry.py:332-362`). At each live startup `autoregister.ensure()` creates rows from file declarations (RFL `:7494-7502`), parsing `src/strategies/*.py` with `ast` and never importing them (`src/runtime/strategy_host/autoregister.py:102-106`, `:155-220`). A new row without `authority` is refused (`:352-359`); a declared authority above the ceiling (`registry.default_authority()`, `trade` by default, `autoregister.py:92-95`; `config/defaults.yaml:1238`) is lowered, an unknown one becomes `none` (`autoregister.py:364-384`); an existing row's authority is reported, never changed (`:421-432`). BuyerEdge's file declares `none` (`src/strategies/buyer_edge.py:2116`) while its live row holds `trade` (`autoregister.py:421-426`).
* **Authority** (`registry.py:386-388`): `none` decides and records; `plan` may be carried to a request; `trade` may have it submitted. The gateway checks it at submission (RFL `:6904-6910`, `:3319-3321`).
* **The pass.** One library strategy per process (RFL `:7546-7564`). Passes are phase-locked to each bar's confirmation (`market.bar_confirm_lag_secs`, 7 s), with a cadence of `--poll` (RFL `:3424-3450`), 20 s in the script and in the shipped unit (RFL `:7472`; `deploy/systemd/at-strategy.service:51`). Each pass walks the bars after a cursor through `runner.run_day` (RFL `:8119-8127`); warm-up bars are skipped and not recorded (`src/core/framework/runtime/runner.py:96-102`); a raising strategy records `strategy_error` (`runner.py:112-115`); a faulted pass walks nothing (RFL `:8103-8117`).
* **Planning each decision on its own minute.** For every ENTER after the planning cursor, legacy reads the exact chain of the decision's own stamp (RFL `:6840-6846`; no chain refuses at `inputs`, `:6869-6887`), and plans with `decided_at` = that stamp, from which the view age is measured (RFL `:6894-6902`, `:3966-3972`).
* **Fresh setup.** `fresh_setup_for` reads the strategy's decisions file for the day: an ENTER is fresh only when the decision recorded just before it is not an ENTER; a decision not found is not fresh (RFL `:6790-6798`, applied at `:6891-6893`). The file survives restarts.
* **Restart.** The cursor is the highest bar index in the day's decisions file (RFL `:108-122`, `:7728`). Planning reads decisions after the same cursor (RFL `:6834`, `:8103`, `:8140-8148`), so a decision written before a crash and not yet planned is never planned. A new strategy object starts with empty state. Worker duplicate guards are in memory for the process's life (RFL `:6938-6943`); a killed worker re-decides its bar and re-consults the model (`src/runtime/worker_host/__init__.py:111-114`, `:528-533`).
* **The money chain.** `plan_for_intent` runs the AI review synchronously before the planner's gates (RFL `:4027-4036`, planner at `:4199`), refuses at `ai_management` when planning may not continue (RFL `:4086-4099`), plans with `signal_score` from the decision's score (RFL `:4211`), or `conviction × 100` for a worker (RFL `:7115-7125`), and submits to the gateway (RFL `:3321`).
* **BuyerEdge.** `on_bar` scores the bar through `RealScorer` (`src/strategies/buyer_edge.py:2388-2406`; `src/data/replay_engine/scorer.py:111-173`), which binds the engine's clock to the bar's stamp (`scorer.py:129-143`), with `BotConfig()` defaults (`buyer_edge.py:2454`), floor 40 (`:294`), coverage gate 0.70 (`:810`, `:1998-2007`), `EXECUTE` only (`:2124-2127`). Inputs: the exact chain minute (`src/runtime/market_view.py:848-860`), the spot frame (`:956-993`), the previous assembled minute (set before the spot frame is checked, `:783-787`) and five smoothed chain minutes appended after a full assembly (`:789-791`), exact-minute Greeks (`src/data/marketdata/scans.py:273-282`, `:316-331`), no age bound (`market_view.py:214-217`, `:333-338`). The engine keeps OI z-score buffers and zone state across bars (`buyer_edge.py:1839-1842`, `:1898-1899`). The session-adjusted floor is shadow only (`buyer_edge.py:2204-2225`).
* **The review.** `EntryReviewService` (`src/runtime/ai_management/service.py:196-504`): actions `ALLOW`, `BLOCK`, `PAUSE`, `AI_UNAVAILABLE` (`src/runtime/ai_management/contracts.py:22`); every failure fails open at once with an alert (`service.py:117-138`), including no team (`:270-274`); deadline the blueprint's, at most 300 s (`:279-282`); the mode applied in the service (`:437-504`).
* **The team.** Blueprint fields and caps (`src/runtime/ai_management/blueprint.py:118-121`, `:348-366`); per-role `max_tokens` pinned in the profile (`src/runtime/ai_management/team.py:237-251`); children with a fresh environment, broker key withheld (`src/runtime/agent_team/__init__.py:176-190`, `:824-830`) and rlimits (`src/runtime/agent_team/child.py:17-25`); abstention and invalid output both `failed` (`child.py:41-54`); a required role's failure makes the review unavailable (`team.py:916-925`, `:1435-1473`). The committee refuses a risk role (`src/runtime/advisor/backends/committee.py:192-193`).
* **Providers.** No in-call retry (`src/runtime/advisor/backends/http.py:698-710`); Retry-After clamped to the session close, a 429 opens the circuit (`http.py:770-795`); a monitor warns past `monitoring.advisor_pause_warn_minutes`, 15 (`config/defaults.yaml:1792`; `monitoring/advisor_availability.py:142`); `budgets: {}` refuses nothing (`src/runtime/advisor/budget.py:183-186`); the chain falls through on provider failures (`src/runtime/advisor/backends/chain.py:17-18`); the effective model is recorded apart from the requested one (`http.py:983-993`); the reply is kept to 2,000 characters (`http.py:1001`); replay answers by sequence and abstains on a gap (`src/runtime/advisor/backends/replay.py:57-63`).

## Fork calls

Each keeps legacy's live behaviour because it touches entries, sizes or review semantics. Each is for the owner's review.

1. **Pass timing.** Phase-locked to the confirmation instant with legacy's cadence (RFL `:3424-3450`, `:7472`); the pass decides the window that just closed.
2. **One view per trigger.** Each window is decided on its own view, cut off at that window's confirmation instant, so B1 measures age from the trigger's bar and the planner prices from the trigger minute's chain, as legacy planned each decision from its own stamp's chain and age (RFL `:6840-6846`, `:6894-6902`). A late-decided window is refused as stale past B1's bound.
3. **BuyerEdge's scorer, floor and configuration unchanged** (`buyer_edge.py:1862-2045`, `:289-357`, `:294`, `:2454`): a different floor is a new strategy version, never a setting.
4. **Research-only parts as coded.** The shadow floor recorded, never applied (`buyer_edge.py:2204-2225`); RVOL and OI shadows at `score_max=0` (`:1405-1409`, `:1951`). `GAMMA_REGIME` and `IV_REGIME` stay live fast-tier components (`:1568`, `:1641-1644`), as coded, although POL-024 calls them research-only: unavailable, they lower the coverage the 0.70 gate reads (`:1998-2007`).
5. **No age bound on BuyerEdge's scoring view** (`market_view.py:214-217`, `:333-338`): its view policy binds `stale: report`.
6. **The exact-minute chain and Greeks rules** (`market_view.py:848-860`; `scans.py:273-282`, `:316-331`).
7. **The score mapping per path:** the scorer's score for a library strategy (RFL `:4211`), `conviction × 100` for a worker (RFL `:7115-7125`); `iv_rank` none; `conviction = min(1, |score| / 100)` (`buyer_edge.py:2297`).
8. **Anything but `EXECUTE` with a direction is an abstention**, recorded and never submitted (`buyer_edge.py:2299-2311`; `runner.py:128`).
9. **Fresh setup from the previous recorded decision.** Every decision, abstentions and strategy errors included, is recorded with the kernel, which derives `setup_fresh` from its own record with legacy's rule, across restarts (RFL `:6790-6798`, `:6891-6893`).
10. **BuyerEdge's state is not restored after a restart:** it starts empty at the resume point (RFL `:7728`; `runner.py:96-99`), recorded as `STATE_RESET`.
11. **A decision completed but not handed off before a crash is abandoned**, unless the kernel already holds its command key (RFL `:6834`, `:7728`, `:8103`); its decision is still recorded, as legacy's row stayed in the file.
12. **A review for every published intent**, whatever its authority and whatever admission answers, before the entry's gates (RFL `:4027-4036` before `:4199`; authority checked only at the gateway, `:6904-6910`).
13. **Authority:** only `trade` submits (`registry.py:386-388`); the live rows are carried unchanged, BuyerEdge's at `trade` (`autoregister.py:421-426`).
14. **One strategy per host process** (RFL `:7546-7564`).
15. **A faulted pass walks no window** (RFL `:8103-8117`).
16. **The review always answers at once on failure**, `unavailable`, so the kernel applies `proceed_unavailable` without waiting out its deadline (`service.py:117-138`, `:270-274`).
17. **A required role that does not contribute**, whatever its outcome, makes the review `unavailable`; an optional one is omitted (`team.py:916-925`, `:1435-1473`; `child.py:41-54`).
18. **Review deadline:** the blueprint's `deadline_seconds`, at most 300 s per team and 120 s per role (`service.py:279-282`; `blueprint.py:118-121`).
19. **Management context sources** keep their 300 s freshness (RFL `:4481`, `:4496`).
20. **An ENTER the kernel did not record is never reviewed or submitted** (RFL `:6828`, `:6832-6839`): legacy planned only the decisions its file held. A refused decision record journals an alert; the abstention is recorded, the ENTER abandoned (`decision_unrecorded`); a kernel fault leaves the decision to be recorded first on the next pass.
21. **BuyerEdge scores with no Greeks priced** (coordinator, 2 November 2026). Legacy's live BuyerEdge scored every bar with no Greeks priced, because of a legacy defect: the Greeks batch is fetched about 0.7 ms after the bar's stamp, and `greeks_at` takes only batches at or before the stamp (`scans.py:316-331`; TASK-S09-08 characterization 3: 673 of 673 bars on 23 and 30 October). The port reproduces that result: its assembly gives the scorer no Greeks (no `ce_delta`, `pe_delta` or `gex_levels`), and the Gamma shadow reports no gamma, as legacy's did.

**Not a fork: deciding on the sealed bar.** The pass decides a window only once SLICE-08 has sealed it, waiting at most `strategies.host.seal_wait_ms`. That changes the bar legacy decided on (legacy read the ticks flushed by the confirmation point, RFL `:3424-3427`), and it is the owner-approved Q-030 rule applied by SLICE-08, not a fork. Step 3's parity walks include bars at the seal boundary, where a tick arrived on time but after legacy's flush, so the difference is visible and bounded.

**Spec-only improvements, listed, not made:** submitting a decided-but-unsent intent after recovery under B1's view-age check (call 11); rebuilding BuyerEdge's state after a restart by re-walking the session's bars (call 10); scoring gamma and IV regime at `score_max=0` to match POL-024's "research-only" (call 4); an age bound on BuyerEdge's scoring view (call 5); pricing the Greeks, so BuyerEdge's Greeks components and Gamma shadow see the minute's batch (call 21), for the owner.

## Deviations

1. Decision method, hosting and authority are separate descriptor axes; legacy's `kind` is mapped on read (`registry.py:332-346`).
2. An unknown descriptor value is refused, not mapped to `worker` (`registry.py:353-362`).
3. Rows are written by the owner in the release binding; nothing is auto-registered at startup (RFL `:7494-7502`). The live rows are carried unchanged (TASK-S09-08).
4. The strategy host holds no broker credential, gateway or ledger writer; it submits through the kernel's entry route as a service principal (LD-13). Legacy ran the strategy in the sending process (RFL `:3321`, `:8119-8127`).
5. Invocations, outputs and handoffs are durable in the host's own store, with an invocation ID that is the command key; legacy kept a bar-index cursor and in-memory guards (RFL `:108-122`, `:6938-6943`).
6. **For the owner's review:** the kernel's `ADM-R12` (busy) has no legacy counterpart; the host retries the same key until the trigger's bar passes B1's view-age bound, then abandons it (`busy_until_stale`), which keeps the entry going while its bar is valid. `commit_failed` and an unknown outcome are retried to the same bound; `LED-R02` is terminal with an alert.
7. A model strategy's recorded proposal is reused after a crash; legacy re-consults (`worker_host/__init__.py:111-114`).
8. Under authority `plan` the intent is recorded with no plan; the kernel has no plan-only route.
9. The review request and result carry a `purpose`; legacy distinguished them by type only (`contracts.py:307-381`).
10. Role outcomes are recorded distinctly (abstention, invalid, timeout and the rest); legacy collapsed them to `failed` (`child.py:41-54`). Consequences are legacy's (call 17).
11. Provider evidence keeps the whole response and typed output; legacy kept 2,000 characters (`http.py:1001`).
12. A replay gap is `unavailable` (`replay_gap`); legacy abstained (`replay.py:57-63`). Replay only.
13. The review's application (mode, pause, BLOCK refusal) is the kernel's (D12), already built in SLICE-04; cognition stops at the result (`service.py:437-504` not ported).
14. Memory, reflection and the team comparison move to SLICE-12 (Excluded).

## Step 1 — the registry

<a id="step-1--the-registry-outline"></a>The authority is the spec's [Descriptors and the registry](../../design/strategies-and-cognition.md#descriptors-and-the-registry-strategiesregistrypy) section, A05-F1 (`README.md:839`), POL-030 and the sessions spec's `CandidateId` ([identity contract](../../design/sessions-authority-lifecycle.md#identity-contract-contractsidentitypy)). Step 1 is TASK-S09-01 (PRF-STR-01). It builds `strategies/registry.py` and the package marker of `strategies/`, over SLICE-08 as built (OA_NEW `slice-08`, whose head at the start of this step is the base). It is pure reading and checking: no strategy module is imported, nothing is written, no process is started, and no setting is added to `settings/loader.py` or `resources/defaults.yaml`. Step 2's host composition feeds the registry its bound section and imports the modules the registry accepted. Every legacy citation is at 445eb116; `AR` is `src/runtime/strategy_host/autoregister.py` and `REG` is `src/runtime/strategy_host/registry.py`.

**In plain words.** Before any strategy code runs, the system reads each strategy's description from its file as plain text, without running the file, and checks it. A description that is wrong in any way is turned away with a reason, and its code is never opened. Which strategies are switched on, what each may do (only decide, plan, or trade), and for which account is written by the owner in the release settings, never taken from the strategy's own file. If a file asks for more than it was given, the system says so and changes nothing, exactly as today: BuyerEdge's file says "none" while its live setting says "trade", and the setting wins. Each strategy also gets a fingerprint of its exact code, so a session can name the precise code it allows. No score, threshold or trading rule is touched.

### Decisions

#### What legacy does here

* **Three spellings, read without importing.** Legacy reads a module-level `SPEC = WorkerSpec(...)` or `SPEC = StrategySpec(...)` with literal keyword arguments (same-module named constants allowed), a `STRATEGY` dict, or a `REGISTRATION` dict, all through `ast` (`AR:102-137`, `:155-252`). A file that does not parse, has none, or needs evaluating is silently not a strategy (`AR:162-164`, `:229-231`). Files whose names start with `_` are skipped (`AR:255-270`).
* **The plan per declaration** (`AR:340-448`): a new row without `authority` is refused with the text "declares no authority, so it was not registered. Add authority= 'none', 'plan' or 'trade' to its declaration" (`AR:356-359`), on create only. The declared authority is stripped and lower-cased; one outside `none`, `plan`, `trade` is noted and taken as `none` (`AR:366-374`); one above the ceiling is noted and capped (`AR:375-384`). An existing row's authority is never changed; a difference from the file is noted (`AR:421-432`).
* **The ceiling** is `REG.default_authority()`: `strategy_host.default_authority`, `trade` when unset, stripped and lower-cased, any unrecognised value read as `none` (`REG:400-435`; `config/defaults.yaml:1238`).
* **Kinds** (`REG:332-362`): `library`, `worker`, `ai_worker`, with the old spellings `process` (worker) and `framework` (library); anything else becomes `worker`. A row's authority, absent or unrecognised, reads as `none` (`REG:556-565`). Ids match `^[a-z0-9][a-z0-9_-]{0,63}$` (`REG:46`, `:145-146`).
* BuyerEdge's file declares `authority="none"` (`src/strategies/buyer_edge.py:2105-2122`) while its live row holds `trade` (`AR:421-426`).

#### The descriptor (`strategies/registry.py`)

A strategy module declares one module-level assignment `DESCRIPTOR = {...}`, a pure literal read with `ast.literal_eval` (no named constants, no call). The keys, all required except `requested_authority`, and their rules (each failure is `STR-R02` naming the key, unless the table says otherwise):

| Key | Rule |
|---|---|
| `id` | Legacy's id rule, `^[a-z0-9][a-z0-9_-]{0,63}$` (`REG:46`) |
| `family`, `version` | Non-empty strings without `|` |
| `implementation` | Exactly `"<label>.<stem>:create"`, where `<label>` is the label of the package the file was read from and `<stem>` the file's own name: a descriptor names its own module, and nothing outside its package (`STR-R03`) |
| `code` | A list or tuple of distinct stems of other modules in the same package (possibly empty), each an existing file, equal as a set to the same-package modules the implementation reaches through its imports (below); the files `CandidateId` covers besides the implementation (`STR-R03` `code` otherwise) |
| `decision_method` | `deterministic` or `model` |
| `hosting` | `process` |
| `underlying` | A non-empty string |
| `timeframe` | Matches `^[1-9][0-9]*m$` (legacy's `"1m"`) |
| `higher_timeframes` | A list or tuple of distinct values of that form, each a whole multiple of `timeframe` and larger than it (legacy's `("5m", "15m")`) |
| `warmup_bars` | An int, not a bool, at least 0 |
| `input` | `{"requirement": {...}, "view_policy": name}`. `requirement` holds the eight fields of SLICE-08's `InputRequirement` (as built in `market/quality.py`, not `contracts/market.py` as the spec says), lists read as tuples, and is constructed, so its own checks apply; its `consumer` must equal `id`, its `consumer_version` `version`, its `interval_secs` the `timeframe` in seconds. `view_policy` is a non-empty string without `|` or `@` (a view policy name); whether it is bound is step 2's check |
| `output` | `{"purpose": "entry_intent", "score_source": "signal_score" or "conviction_x100"}` |
| `state` | `{"scope": ["strategy", "underlying", "session"], "kind": stateless, in_memory or checkpointed, "restoration": recompute, reset_on_restart or checkpoint}`. The scope is exactly that list (`STR-R05`); `checkpointed` and `checkpoint` go together, each refused without the other (`STR-R05`) |
| `requested_capabilities` | A list or tuple of distinct values from `market.read`, `evidence.publish`, `kernel.entry_submit`, `kernel.command_status`, `cognition.review_request`, `cognition.propose`. A value outside the set, a repeated value, a value that is not a list or tuple, and a `model` method without `cognition.propose` are each `STR-R04` |
| `requested_authority` | Optional in the literal; see Authority below |

Checks run in this order: unknown keys, then missing keys, then each key in the table's order; a descriptor is refused at the first failure, with that key. A failure inside a nested value is reported by its top-level key: anything wrong in `input` (an `InputRequirement` `ValueError` included) is `STR-R02` `input`, in `output` `STR-R02` `output`, in `state` `STR-R05` `state`. Any other key, including legacy's `kind`, `name`, `exchange`, `enabled`, `strategy_family`, `authority` and `supersedes`, is `STR-R02`: rows carry what legacy declared in files.

`StrategyDescriptor`, frozen, slots, holds the validated values in that order plus `package` (the label) and `stem`; sequences are tuples, `input.requirement` an `InputRequirement`.

#### Reading a package

* `StrategyPackage(label: str, module: str, path: Path)`, frozen: the label used in `implementation`, the dotted import name and the directory. `PRODUCTION = StrategyPackage("strategies", "autonomous_trading.strategies", <the package's directory>)`.
* `read_package(package) -> tuple[StrategyDescriptor | DescriptorRefused, ...]`: every `*.py` file of the directory (not recursive) in name order, skipping a name that starts with `_` (`AR:264-266`). A file is read as UTF-8 text and parsed with `ast.parse`; it is never imported, executed or compiled to bytecode. A file with no module-level `DESCRIPTOR` assignment is not a strategy and yields nothing, as legacy (the registry module itself, helpers, `strategies/worker.py`). A file that does not parse or decode, or whose `DESCRIPTOR` is not a dict that `ast.literal_eval` accepts, or which assigns `DESCRIPTOR` twice, is refused `STR-R01`.
* **Imports reached (review R-2).** From each descriptor's implementation module, `read_package` walks every `ast.Import` and `ast.ImportFrom` node of the parsed tree (inside functions too), and follows the same-package modules transitively, parsing each with `ast` and never importing it. A same-package module is one named absolutely (`import simpkg.sim_util`, `from simpkg import sim_util`, `from simpkg.sim_util import f`, with `simpkg` the package's dotted module) or relatively at level 1 (`from . import sim_util`, `from .sim_util import f`). A name of the form `from simpkg import x` or `from . import x` counts as a module only when `x.py` exists in the package. A relative import above level 1, and every other module (`contracts`, `market`, the standard library, numpy), is outside the package: such modules are versioned by the release (its bundle digest), not by `CandidateId`. The reached set, the implementation itself excluded, must equal `code`; a reached module that does not parse is also `STR-R03` `code`. Step 3 keeps BuyerEdge's scorer inside BuyerEdge's declared files, so a change to the scorer changes BuyerEdge's `CandidateId`.
* `DescriptorRefused(package: str, stem: str, code: str, message: str)`, frozen.

#### Rows, the ceiling and authority

* **The section (review R-1: no new gate on trading).** `parse_registry(section: Mapping) -> RegistrySettings` reads the bound `strategies.registry` mapping and never raises for a row.
  * **The ceiling.** Absent or `None` raises `RegistryUnbound("strategies.registry.ceiling")`, a `ValueError` subclass whose message is the key (Q-015: an unbound refusing setting). Otherwise it is stripped and lower-cased, as legacy's `default_authority` (`REG:432-435`); a value that is then not `none`, `plan` or `trade` reads as `none`, with the note `"strategies.registry.ceiling {raw!r} is not one of ['none', 'plan', 'trade']; read as 'none'"` (`REG:435`).
  * **A row** is every other key. Its value must be a mapping with `enabled` (a bool), `authority`, `account` (a mapping with exactly `broker` and `account`, read as `AccountId`) and optionally `kind` (legacy's, as TASK-S09-08 carries it).
  * **A row's authority** is read as legacy's `authority_of` reads it (`REG:563-565`): absent or `None` reads `none`, with the note `"strategies.registry.{id}.authority is absent; read as 'none'"`; a value that is not exactly `none`, `plan` or `trade` reads `none`, with the note `"strategies.registry.{id}.authority {raw!r} is not one of ['none', 'plan', 'trade']; read as 'none'"`. The row stays usable.
  * **Any other row defect refuses only that row:** a value that is not a mapping (`row`), an id that breaks the id rule (`id`), a missing `enabled` or `account`, an extra key, or a bad value gives `RowRefused(strategy_id, "STR-R11", "row_invalid:<key>")`, the first failing key in the order `row`, `id`, extra keys, `enabled`, `account`, `kind`. A refused row is no row: its descriptor registers without one.
  * `RegistrySettings(ceiling: str, rows: Mapping[str, RegistryRow], refused: tuple[RowRefused, ...], notes: tuple[str, ...])`, frozen, refusals and notes in key order with the ceiling's note first; `RegistryRow(strategy_id, enabled, authority, account, kind)`, frozen; `RowRefused(strategy_id: str, code: str, message: str)`, frozen. Step 2's composition turns `RegistryUnbound` into `RefusingParameterUnbound`.
* **The first release binds** `ceiling` `trade` and the live rows as TASK-S09-08 reads them (step 3); this step binds nothing and tests use labelled synthetic sections.
* **Authority (Fork call, legacy's `_plan`, `AR:350-432`).** For a descriptor with row `R` (or none):
  1. no `requested_authority` (absent, `None` or blank after strip) and no row: refused `STR-R06` with legacy's text exactly (`AR:356-359`);
  2. `wanted` is the ceiling when `requested_authority` is absent, `None` or the empty string (legacy's `declared.get("authority") or ceiling`, `AR:366`; a row exists, so no note). Any other string, blanks included, is stripped and lower-cased and goes to step 3, so `"  "` with a row registers at `none` with the unknown-authority note (`AR:366-374`);
  3. `wanted` outside the three: the note `"declares authority {raw!r}, which is not one of ['none', 'plan', 'trade']; registered at 'none'"`, and `wanted = "none"` (`AR:370-374`);
  4. `wanted` above the ceiling (`none` < `plan` < `trade`): the note `"declares authority {wanted!r}, above this deployment's default {ceiling!r}; registered at {ceiling!r} instead. A file cannot raise its own permission"`, and `wanted = ceiling` (`AR:379-384`);
  5. with a row whose `authority` differs from the raw `requested_authority` (compared as legacy compares, `held != str(declared or held)`): the note `"row holds authority {held!r}, the file declares {raw!r} — left alone. Changing a live strategy's authority from a file is not a reconcile"` (`AR:427-432`).
  `declared_authority` is `wanted`. The registration's `authority` is always the row's; nothing ever writes a row. Rows are not compared with the ceiling, as legacy never re-capped an existing row.
* **Kinds (legacy's map, `REG:332-362`).** A row's optional `kind`, stripped and lower-cased, maps `library`, `framework`, `worker` and `process` to `deterministic` and `ai_worker` to `model`, all to hosting `process`. Any other value, or a mapped method that differs from the descriptor's `decision_method`, refuses that strategy `STR-R08`.

#### The registry

`load(packages: Sequence[StrategyPackage], settings: RegistrySettings, *, composition: str) -> Registry`:

* **The composition.** `production` takes exactly `(PRODUCTION,)`; any other package raises `RegistryRefused("STR-R10 test_package_in_production")` (a `ValueError`) before any file is read. `simulation` requires `packages[0] is PRODUCTION`, plus at most one more package, whose label is not `strategies` and whose module is not under `autonomous_trading`; anything else, `(simpkg,)` alone included, raises `ValueError` before any file is read. Any other `composition` value raises `ValueError`.
* **Order.** Every package is read; descriptors that share an id are all refused `STR-R07` (none wins); then each descriptor is matched to its row (a row refused `STR-R11` is no row); then authority and kind are applied.
* `Registry(registrations: tuple[Registration, ...], refused: tuple[DescriptorRefused | RowRefused, ...], orphan_rows: tuple[str, ...], notes: tuple[str, ...])`, frozen. `registrations` and `orphan_rows` are sorted by id; `refused` holds the settings' row refusals first, in key order, then the descriptor refusals by package then stem; `notes` are the settings' notes. A row with no accepted descriptor of its id is an orphan (`STR-R09`, reported; it runs nothing).
* `Registration(descriptor, row: RegistryRow | None, declared_authority: str, notes: tuple[str, ...], candidate_id: str)`, frozen, with `authority` (the row's, or `none` without a row) and `runnable` (a row exists and is `enabled`) as properties. Registration grants nothing else: kernel grants still decide every submission (SLICE-03).
* `registry.get(strategy_id) -> Registration | None`.

#### Candidate identity

`candidate_id(descriptor, package) -> str`, the sessions spec's manifest for a hand-written strategy:

1. the files are the implementation module and each `code` module, as `"<label>/<stem>.py"`, sorted by that text;
2. each file's bytes with every `\r\n` replaced by `\n` (LF-normalized), hashed with SHA-256;
3. `code_digest` is the SHA-256 of `canonical_json([[path, file_sha256], ...])` (`contracts/identity.py`);
4. the manifest is `{"strategy": id, "strategy_version": version, "code_digest": code_digest}`, and `CandidateId` is the SHA-256 hex of `canonical_json(manifest)`, which `is_hex_id` accepts, as the binding's `candidate_ids` require.

The files are read as bytes for hashing, never imported. **Reading of the specs:** the sessions spec says "the strategy package's files" and this spec "the implementation module and the modules it declares as its code"; this step reads both as the strategy's own declared files, so editing one strategy never changes another's identity. The coordinator may raise it as an X item if the sessions spec meant the whole `strategies/` directory.

#### Refusals

| Code | Message | When |
|---|---|---|
| `STR-R01` | `unreadable` | The file does not decode or parse, or its `DESCRIPTOR` is not one literal dict |
| `STR-R02` | the top-level key | A missing, unknown or invalid key, or a failure nested inside one |
| `STR-R03` | `implementation` or `code` | Not the declaring module; or `code` naming a missing or outside module, or differing from the same-package modules the implementation reaches |
| `STR-R04` | `capability` | A capability outside the set, a repeated one, a value that is not a list or tuple, or a `model` method without `cognition.propose` |
| `STR-R05` | `state` | The scope is not legacy's three, or `checkpointed` and `checkpoint` do not go together |
| `STR-R06` | legacy's text | No `requested_authority` and no row |
| `STR-R07` | `duplicate_id` | Two descriptors with one id |
| `STR-R08` | `kind` | A row's `kind` unknown, or mapping to another decision method |
| `STR-R09` | `row_without_descriptor` | A row with no accepted descriptor |
| `STR-R10` | `test_package_in_production` | Raised: a production composition given another package |
| `STR-R11` | `row_invalid:<key>` | A row defect other than its authority; only that row is refused |

#### Fork calls in this step

* **Authority:** the row decides and is never rewritten; a missing request refused on create only, with legacy's text; an unknown request taken as `none`; a request above the ceiling capped; a difference reported, never acted on; rows not checked against the ceiling (`AR:350-432`; slice Fork call 13).
* **The ceiling's value:** the release binds legacy's `trade` (`REG:432-435`; `config/defaults.yaml:1238`); a bound value that is not one of the three reads `none`, as legacy (`REG:435`).
* **A row's authority** absent or unknown reads `none`, as legacy's `authority_of` (`REG:563-565`): no new gate stops a strategy at load.
* **Kinds:** legacy's map of `library`, `framework`, `worker`, `process` and `ai_worker` (`REG:346`, `:353-362`).
* **The id rule** and the `_` file skip (`REG:46`; `AR:264-266`).

#### Deviations in this step

* **One spelling.** Only `DESCRIPTOR = {literal}`; legacy also read `SPEC = WorkerSpec(...)`, `SPEC = StrategySpec(...)`, `STRATEGY` and named constants (`AR:118-252`).
* **A broken declaration is refused with a record**, `STR-R01`; legacy skipped it silently (`AR:162-164`, `:229-231`). It still runs nothing.
* **An unknown kind is refused** (slice Deviation 2), and a kind that disagrees with the descriptor too.
* **Rows are never created** (slice Deviation 3): a descriptor without a row is registered but not runnable.
* **Notes where legacy was silent.** A row's absent or unknown authority and an unknown ceiling read `none` as legacy did (`REG:435`, `:563-565`), but each now leaves a note; legacy read them silently.
* **A defective row is refused alone** (`STR-R11`), with its key, and its strategy registers without a row; legacy's rows were written by its own registration code, so its reader had no such case. Only an absent ceiling raises (`RegistryUnbound`, Q-015).
* **New descriptor keys:** `code` (for `CandidateId`), checked against the imports the implementation reaches, and the both-ways `checkpointed`/`checkpoint` rule (the spec names one direction); rows gain `account`.

### Tests

`tests/unit/test_strategy_registry.py` (T-50). Every value is labelled synthetic; every expectation is written by hand from the rules above. Each test writes its own strategy package under `tmp_path` (`simpkg`, label `simpkg`, module `simpkg`), so no file is added to the tree and no test strategy can reach a production composition. Unless a case says otherwise, a load is `load((PRODUCTION, simpkg), parse_registry(SECTION), composition="simulation")`. `VALID` is one synthetic descriptor literal, written into `simpkg/sim_alpha.py`:

```text
DESCRIPTOR = {"id": "sim_alpha", "family": "options_buyer", "version": "1",
  "implementation": "simpkg.sim_alpha:create", "code": [], "decision_method": "deterministic", "hosting": "process",
  "underlying": "NIFTY-SYN", "timeframe": "1m", "higher_timeframes": ["5m", "15m"], "warmup_bars": 20,
  "input": {"requirement": {"consumer": "sim_alpha", "consumer_version": "1", "fields_required": ["spot", "chain"],
            "fields_optional": ["greeks"], "lookback_bars": 20, "interval_secs": 60, "session_reset": True,
            "partial_bars": "excluded"}, "view_policy": "sim_view"},
  "output": {"purpose": "entry_intent", "score_source": "signal_score"},
  "state": {"scope": ["strategy", "underlying", "session"], "kind": "in_memory", "restoration": "reset_on_restart"},
  "requested_capabilities": ["market.read", "evidence.publish", "kernel.entry_submit", "kernel.command_status",
                             "cognition.review_request"],
  "requested_authority": "none"}
raise RuntimeError("synthetic: this module must never be imported")
```

`SECTION` is `{"ceiling": "trade", "sim_alpha": {"enabled": True, "authority": "trade", "account": {"broker": "sim", "account": "acct-sim"}}}`.

| Group | Cases |
|---|---|
| Reading without import | With an import spy (a `sys.meta_path` finder recording every name it is asked for) and `sys.modules` compared before and after, `load` over `simpkg` holding `VALID` (whose last line raises if imported), a refused descriptor and a helper module without `DESCRIPTOR`: no `simpkg` name was requested, nothing new in `sys.modules`, no `__pycache__` written. `_hidden.py` holding `VALID` with id `sim_hidden` is skipped. A helper with no `DESCRIPTOR` yields nothing. `DESCRIPTOR = dict(id="x")`, a syntax error, invalid UTF-8 and two `DESCRIPTOR` assignments are each `STR-R01` |
| Fields | `VALID` is accepted, its `StrategyDescriptor` fields as written, `higher_timeframes` `("5m", "15m")` and the requirement an `InputRequirement`. Each required key removed is `STR-R02` naming it; an added `kind` (`"library"`), `name` and `enabled` are each `STR-R02`. Bad values, each `STR-R02` with its key: `id` `"Sim Alpha"`; `decision_method` `"rule"`; `hosting` `"thread"`; `timeframe` `"60s"`; `higher_timeframes` `["1m"]` (not larger) and `["5m", "5m"]` (repeated); `timeframe` `"2m"` with `interval_secs` 120 and `higher_timeframes` `["5m"]` (not a multiple); `warmup_bars` `-1` and `True`; `output.purpose` `"exit_advice"` and `output.score_source` `"score"` (each `output`); `input.requirement.consumer` `"other"`, `input.requirement.interval_secs` 300, `input.requirement.partial_bars` `"maybe"` (an `InputRequirement` `ValueError`) and `input.view_policy` `"a|b"` (each `input`) |
| Implementation and code | `"simpkg.sim_beta:create"`, `"simpkg.sim_alpha:main"`, `"os.path:join"` are `STR-R03` (`implementation`); `code` `["missing"]` and `["../outside"]` are `STR-R03` (`code`). With `sim_util.py` in the package: `sim_alpha.py` holding `import simpkg.sim_util` and `code` `[]` is `STR-R03` (`code`); the same import with `code` `["sim_util"]` is accepted, and so is `from . import sim_util`; `code` `["sim_util"]` with no import is `STR-R03` (`code`); `import json` and `from autonomous_trading.contracts import market` need no `code` entry |
| Capabilities and state | `"kernel.order_send"`, a repeated capability and the string `"market.read"` (not a list) are each `STR-R04`; `decision_method` `"model"` without `cognition.propose` is `STR-R04`, with it accepted. `checkpointed` with `reset_on_restart`, `in_memory` with `checkpoint`, and scope `["strategy", "session"]` are `STR-R05`; `checkpointed` with `checkpoint` is accepted |
| Authority (PRF-STR-01) | No `requested_authority` and no row: `STR-R06` whose message equals legacy's text character for character. No `requested_authority` with a row `trade`: registered, `declared_authority` `"trade"` (the ceiling), no note, `authority` `"trade"`. Requested `"trade"` with ceiling `"plan"`: `declared_authority` `"plan"`, the cap note exactly. Requested `"admin"` against `SECTION`'s `trade` row: `declared_authority` `"none"`, notes exactly two, in order: the unknown note naming `'admin'`, then the difference note naming `'trade'` and `'admin'` (`AR:370-374`, `:427-432`). Requested `" TRADE "` with ceiling `"trade"` and a row `"trade"`: `"trade"`, no cap note, and the difference note (`'trade'` against `' TRADE '`), since legacy compares the raw text. Requested `"  "` with a row `"trade"`: `"none"`, the unknown note naming `'  '`, then the difference note. Requested `""` with a row `"trade"`: the ceiling `"trade"`, no note. Requested `"  "` with no row: `STR-R06`. **BuyerEdge's shape:** requested `"none"` and a row `"trade"`: `authority` `"trade"`, `declared_authority` `"none"`, notes exactly the difference note naming `'trade'` and `'none'`; the `RegistryRow` is the very object `parse_registry` returned, unchanged |
| Rows | `parse_registry` without `ceiling`: `RegistryUnbound("strategies.registry.ceiling")`, the only raise. Ceiling `" Plan "`: `"plan"`, no note; ceiling `"admin"`: `"none"` with the ceiling note naming `'admin'`. No other case raises. A `sim_alpha` row without `authority`: authority `"none"`, the absent note; with `authority` `"TRADE"`: `"none"`, the unknown note naming `'TRADE'`; each row still usable, so `sim_alpha` registers with it at `none`. `RowRefused` `STR-R11` with `row_invalid:enabled` for `enabled` `"yes"`, `row_invalid:exchange` for an extra key `exchange`, `row_invalid:account` for `account` `{"broker": "sim"}`, `row_invalid:id` for id `"Bad Id"`, `row_invalid:row` for the value `"trade"`; each in `Registry.refused`, and `sim_alpha` with a refused row registers with `row` `None`, `authority` `"none"`, `runnable` false. A row `sim_gamma` with no descriptor: `orphan_rows` `("sim_gamma",)`, not registered. A disabled row: registered, `runnable` false. No row: registered, `authority` `"none"`, `runnable` false |
| Kinds | Row `kind` `library`, `framework`, `worker`, `process`, `" Library "` with a `deterministic` descriptor, and `ai_worker` with a `model` one: accepted. `"agent"`: `STR-R08`. `ai_worker` with a `deterministic` descriptor: `STR-R08` |
| Duplicates | `sim_alpha.py` and `sim_alpha2.py` both declaring id `sim_alpha` (each naming its own module): both `STR-R07`, neither registered, the row an orphan |
| Composition | With `Path.read_text` and `Path.read_bytes` monkeypatched to record every call: `load((PRODUCTION, simpkg), …, composition="production")` raises `RegistryRefused` with `STR-R10`, and `load((simpkg,), …, composition="simulation")` raises `ValueError`, each with no recorded call (the checks precede reading). `(PRODUCTION, simpkg)` under `simulation`: loads. With two test packages, with a test package labelled `strategies`, or with `composition="live"`: `ValueError`. `production` with `(PRODUCTION,)` alone: loads with no registration (the package has no strategy yet) and the synthetic row an orphan |
| Candidate identity | For `VALID` in `sim_alpha.py`, the expected value is computed in the test with `hashlib` and `json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False)`: `file_sha256` of the file's bytes, `code_digest` of `[["simpkg/sim_alpha.py", file_sha256]]`, then the manifest `{"strategy": "sim_alpha", "strategy_version": "1", "code_digest": …}`; `candidate_id` equals it and is 64 lower-case hex. The same file written with `\r\n` line ends gives the same id. Adding `import simpkg.sim_util` to `sim_alpha.py` with `"code": ["sim_util"]` and `sim_util.py` present changes it to the two-file value, computed the same way with the paths sorted; editing `sim_util.py` then changes it again; editing an undeclared `sim_other.py` does not; `version` `"2"` changes it |

**Changed existing tests:** none.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence; the exact text is recorded in the as-built table), one at a time, run against `test_strategy_registry.py`, and restored byte for byte with an md5 check.

| Change | Anchor | Test that must fail |
|---|---|---|
| Import before validation: the module is imported and `DESCRIPTOR` read as an attribute | `registry.py`, `read_package`: the parse of the file | Reading without import |
| `_` files read | `registry.py`, `read_package`: the `_` skip | Reading without import |
| A non-literal `DESCRIPTOR` skipped silently | `registry.py`, `read_package`: the `STR-R01` refusal for a non-literal | Reading without import |
| An unknown key accepted | `registry.py`: the unknown-key check | Fields |
| Another module's `implementation` accepted | `registry.py`: the implementation equality | Implementation and code |
| `model` without `cognition.propose` accepted | `registry.py`: the propose check | Capabilities and state |
| `checkpoint` accepted without `checkpointed` | `registry.py`: the reverse state check | Capabilities and state |
| A missing request refused with a row too | `registry.py`, authority step 1: the "no row" condition | Authority |
| The ceiling not applied | `registry.py`, authority step 4 | Authority |
| An unknown request refused instead of taken as `none` | `registry.py`, authority step 3 | Authority |
| The difference note dropped | `registry.py`, authority step 5 | Authority |
| A row's authority rewritten: `authority` returns `declared_authority` | `registry.py`, `Registration.authority` | Authority (BuyerEdge's shape) |
| A row without `authority` raises instead of reading `none` | `registry.py`, `parse_registry`: the absent-authority fallback | Rows |
| A row defect raises instead of refusing that row | `registry.py`, `parse_registry`: the `STR-R11` record | Rows |
| An unknown ceiling raises instead of reading `none` | `registry.py`, `parse_registry`: the ceiling fallback | Rows |
| An undeclared same-package import accepted | `registry.py`, `read_package`: the reached-imports equality | Implementation and code |
| A blank request takes the ceiling | `registry.py`, authority step 2: the absent, `None` or empty test | Authority |
| A simulation load without `PRODUCTION` first accepted | `registry.py`, `load`: the `packages[0] is PRODUCTION` check | Composition |
| An unknown kind mapped to `deterministic` (legacy) | `registry.py`: the kind map's fallback | Kinds |
| The first of two duplicate ids kept | `registry.py`, `load`: the duplicate refusal | Duplicates |
| The test package accepted in production | `registry.py`, `load`: the production package check | Composition |
| `CandidateId` without LF normalization | `registry.py`, `candidate_id`: the `\r\n` replacement | Candidate identity |
| `CandidateId` over every file of the package | `registry.py`, `candidate_id`: the file list | Candidate identity |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/strategies/registry.py` | New: `StrategyDescriptor`, `DescriptorRefused`, `StrategyPackage`, `PRODUCTION`, `read_package`, `RegistryRow`, `RowRefused`, `RegistrySettings`, `RegistryUnbound`, `RegistryRefused`, `parse_registry`, `Registration`, `Registry`, `load`, `candidate_id` |
| the `strategies` package's `__init__.py` | New, empty |
| `tests/unit/test_strategy_registry.py` | New (T-50, PRF-STR-01) |

**No new tree delta:** `strategies/registry.py` is in README §6 and the test file is T-50; the `__init__.py` is the package marker, and the test packages live under `tmp_path`. The registry imports only `contracts/identity.py` (`AccountId`, `canonical_json`, `is_hex_id`) and `market/quality.py` (`InputRequirement`); step 7's capability scan covers it with the rest of `strategies/`.

### Completion conditions (step 1)

* Every test above passes, twice in a row, with the whole suite; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every new Python file.
* `git diff --stat` against the base branch head at the start of step 1 names only the files above.
* PRF-STR-01's clauses each pass a group: each refusal before load with no module imported (Reading without import, Fields, Implementation and code, Capabilities and state); a missing authority refused on create only with legacy's text, a row's authority never rewritten and a disagreement reported, the ceiling lowering a request (Authority); legacy kinds mapped and an unknown kind refused (Kinds); `CandidateId` equal to a hand-computed digest (Candidate identity).

### Step 1 as built

**In plain words.** The strategy list now exists. It reads each strategy's description as plain text without running its code, turns away a bad description with a reason, takes switches and permissions only from the owner's settings, keeps legacy's rules on what a strategy may do, and gives each strategy a fingerprint of its exact code. All 1,389 automatic checks pass.

Commit `8eb3a12` on `slice-08`, on top of `ba2face` (the branch head at the start of step 1, after SLICE-10 step 3). It adds the 3 files of the step's table (907 lines) and changes no existing file. Not pushed.

**Choices made while building:**

| Topic | As built |
|---|---|
| Descriptor fields | `StrategyDescriptor` keeps the table's order with the nested values flattened: `requirement` and `view_policy` for `input`, `purpose` and `score_source` for `output`, `state_scope`, `state_kind` and `restoration` for `state`; `requested_authority` is kept as written, since the notes quote it as legacy did |
| One read per file | `read_package` reads each file once with `read_text` and parses it on first use; the import walk reuses the parsed trees |
| Kind before authority | `load` applies the row's `kind` check, then authority, so a kind mismatch is `STR-R08` whatever the authority |
| `code` naming itself | A `code` entry equal to the descriptor's own module is `STR-R03` `code` |
| Row order | Rows are read in `str`-sorted key order; a row with several extra keys reports the first in that order |
| Orphans | Every row without a registration is an orphan, a disabled one included (the Rows test's `sim_off`) |
| `is_hex_id` | Not imported: `candidate_id` returns a SHA-256 hex by construction, and the test checks 64 lower-case hex digits |
| One more test | `read_package` alone returns descriptors and refusals in file order |

**Tests:** `tests/unit/test_strategy_registry.py`, 68 cases in 25 test functions; every group of the step's table passed on its first run. The whole suite once after the last edit: 1,389 passed, 2 skipped (`test_pe_delta_sign_at_the_source`, waiting for C-1, and SLICE-10's POSIX-only file-mode test on Windows), in 188.9 s. `ast.parse` passes on the 3 files.

**Break checks** (`s09a_breaks.py`: anchors checked first, one at a time, every file restored byte for byte, md5 verified): all 23 failed a test on the first run.

| Change | Test that failed |
|---|---|
| Import before validation | Every group (24 test functions): the synthetic module raises on import |
| `_` files read | Reading without import |
| A non-literal `DESCRIPTOR` skipped silently | Reading without import (`STR-R01` cases) |
| An unknown key accepted | Fields |
| Another module's `implementation` accepted | Implementation and code |
| `model` without `cognition.propose` accepted | Capabilities and state |
| `checkpoint` accepted without `checkpointed` | Capabilities and state |
| A missing request refused with a row too | Authority (two tests) |
| The ceiling not applied | Authority |
| An unknown request refused instead of taken as `none` | Authority |
| The difference note dropped | Authority (BuyerEdge's shape and the unknown and blank cases) |
| A row's authority rewritten | Authority (BuyerEdge's shape); Rows |
| A row without `authority` raises | Rows |
| A row defect raises instead of refusing that row | Rows (two tests) |
| An unknown ceiling raises | Rows |
| An undeclared same-package import accepted | Implementation and code |
| A blank request takes the ceiling | Authority |
| A simulation load without `PRODUCTION` first accepted | Composition |
| An unknown kind mapped to `deterministic` | Kinds |
| The first of two duplicate ids kept | Duplicates |
| The test package accepted in production | Composition |
| `CandidateId` without LF normalization | Candidate identity |
| `CandidateId` over every file of the package | Candidate identity |

**Open:** none in this step. Step 2's host composition feeds `parse_registry` the bound section and imports the accepted modules; TASK-S09-08 (step 3) reads the live rows that the first release binds.

## Step 2 — the strategy host

<a id="step-2--the-strategy-host-outline"></a>The authorities are the spec's [strategy host](../../design/strategies-and-cognition.md#the-strategy-host-strategiesworkerpy), [invocations and state](../../design/strategies-and-cognition.md#invocations-and-state-strategiesworkerpy) and [handoff](../../design/strategies-and-cognition.md#handoff-to-the-kernel-strategiesworkerpy) sections, A05-F2 and Combined-F5 (`README.md:841`), and legacy's live host at 445eb116 (`RFL` is `scripts/run_framework_live.py`, `RUN` is `src/core/framework/runtime/runner.py`). Step 2 is TASK-S09-02 and TASK-S09-09 (PRF-STR-02; PRF-STR-03 rows CP-W1…CP-W5). It builds the strategy host (`strategies/worker.py`), EMA cross (`strategies/ema_cross.py`), the host's composition (`bootstrap.py`), and the kernel's decision record with the `setup_fresh` derivation (`kernel/policy.py`, `kernel/coordinator.py`, the ledger). It builds on step 1 as built (OA_NEW `8eb3a12` on `slice-08`) and on SLICE-08's views, whose two carries for this step are built: `resolve` takes a cutoff earlier than the resolution instant, and the `exact_minute` chain join anchors at the newest base window confirmed by the cutoff (`View.anchor`). No score, threshold or money value is set; every setting the host reads is refusing or is the kernel's own.

**In plain words.** This step builds the program that runs one strategy. A minute after each bar closes, plus the usual seven seconds, it looks for the bars that have become final, and for each one, oldest first, it takes a market snapshot fixed at that bar's own moment, asks the strategy for a decision, and writes the decision down before telling anyone. Then it publishes the decision, tells the kernel what it decided (even "nothing", because today's "fresh setup" rule needs the previous decision), asks for the AI review, and, only for a strategy allowed to trade, hands the entry to the kernel, retrying with the same name while the bar is still young enough to be valid. An entry the kernel did not write down is never sent, as today. If the AI review cannot even be asked for, the kernel is told at once and goes ahead without it, as today, instead of waiting. If the program crashes, it restarts by reading its own notes and asking the kernel what it already has, so a decision is never lost without a record and never sent twice. A decision interrupted before it was sent is not sent after a restart, as today. The kernel now keeps every decision itself, and judges "fresh setup" from that record with today's rule. Trading rules, scores and limits do not change.

### Decisions

#### What legacy does here

* **The pass** is phase-locked to each bar's confirmation: `seconds_to_next_pass(poll, now, lag)` sleeps `max(0.05, min(to_close, to_grid))`, with `since_close = (now - lag) % 60`, `to_close = 60 - since_close`, `to_grid = poll - since_close % poll` and `poll = max(1.0, poll)` (RFL `:3431-3450`); the poll is 20 s by default (RFL `:7472`).
* **The walk**: each pass walks the day's bars after a cursor (RFL `:8119-8127`, `RUN:96-99`); a bar whose index is below `warmup_bars` is skipped and not recorded (`RUN:100-102`); a raising strategy records `strategy_error` (`RUN:112-115`); a faulted pass walks nothing (RFL `:8103-8117`). Planning reads ENTER decisions after the cursor the pass started from (RFL `:6826-6839`, `:8137-8148`), so an ENTER whose planning faulted, or that was written before a crash, is never planned.
* **Fresh setup** (RFL `:6790-6798`): over the day's decision rows in file order, an ENTER is fresh when the row just before it is not an ENTER (the first row of the day is fresh), and a decision not found is not fresh; applied to every planned ENTER (RFL `:6891-6893`). The file survives restarts.
* **The score**: a library strategy plans with `float(ctx.get("score") or 0.0)` (RFL `:4211`), a worker with `conviction × 100` (RFL `:7115-7125`). A strategy's `Intent` holds `kind` (`ENTER` or `NOTHING` here), `direction` (`CE`, `PE`), `conviction` in 0…1, `reason`, `components`, `tags` (`src/core/framework/runtime/types.py:24-85`); `CE` is `bullish` and `PE` `bearish` (`src/core/framework/policy/family.py`, `legacy_bias`).
* **Series**: `window(n)` is the last `n` values, oldest first, the current bar last, short at the start of the day and never padded (`src/data/tape/series.py:168-180`).

#### The kernel's decision record (TASK-S09-09; `contracts/decisions.py`, `kernel/policy.py`, `kernel/coordinator.py`, the ledger)

* **`DecisionRecord(invocation_id: str, principal: Principal, strategy: str, session_id: str, trigger: str, kind: str, evidence_ref: str)`**, frozen, in `contracts/decisions.py`: `invocation_id` a `CommandKey` value starting `inv1:`; `trigger` the decided window's start in the stored UTC form; `kind` `ENTER` or `NOTHING`; `evidence_ref` the 64-hex digest of the published output. Any other value raises `ValueError`.
* **`Coordinator.record_decision(record, *, auth=None) -> str | Refusal`** raises `RuntimeError("entry admission is not composed …")` when `self.entry_admission` is `None`, as `admit_entry` does; otherwise it authenticates as `admit_entry` does (`auth` or `self.authenticate(record.principal)`; the payload principal is never trusted) and delegates to `self.entry_admission.policy.record_decision(record, auth)`, the one `Policy` admission reads applications and `setup_fresh` from. `Policy.record_decision`:
  1. refuses `SES-R01` when `auth` is `None` or its principal differs from `record.principal`; `SEC-R09` when `auth.request` is not `None` or the principal is a human on `owner_credential`, exactly as `_a2` does (`kernel/admission.py:718-721`); and `SES-R02` (`grant_scope`) when the principal is not `Principal(f"strategy:{record.strategy}", "service")`;
  2. refuses `ADM-R01` (`malformed_request`) when no `session` row has `record.session_id`; otherwise reads the session's account from the row's wire form, `AccountId(*json.loads(session["account"]))`, as the kernel's other readers of that column do (`kernel/lifecycle.py:135`), and passes on `authority.check("entry", auth, account)`'s refusal;
  3. resolves `evidence_ref` from the evidence store and refuses `ADM-R01` unless it is, for `ENTER`, an intent whose `intent_id`, `strategy` and `session_id` equal the record's (`intent_from_wire`) and with `record.trigger == intent.as_of.utc_iso`, or, for `NOTHING`, an abstention whose `invocation_id`, `strategy`, `session_id` and `trigger` equal the record's;
  4. a `decision` row with this `invocation_id` and the same fields returns `"existing"` and writes nothing; one with other fields refuses `LED-R02` (`idempotency_conflict`); a row with another `invocation_id` at the same `(strategy, session_id, trigger)` also refuses `LED-R02` (a second invocation at one trigger);
  5. otherwise commits `DECISION_RECORDED` `{invocation_id, strategy, session_id, trigger, kind, evidence_ref, recorded_at}` (family `policy`, principal `kernel:policy`, through `Policy._transact`) and returns `"recorded"`.
* **A failed review request (Fork call 16; legacy `service.py:117-138`, `:270-274`).** `Coordinator.record_unavailable(intent_ref, cause, principal, *, auth=None) -> str | Refusal` is composed and authenticated as `record_decision` (the same `RuntimeError`, `auth` or `self.authenticate(principal)`) and delegates to `Policy.record_unavailable(intent_ref, cause, auth)`, which:
  1. refuses `SES-R01` and `SEC-R09` as step 1 above; resolves `intent_ref` with `resolve_intent` (`ADM-R01` when absent); refuses `SES-R02` when the principal is not `Principal(f"strategy:{intent.strategy}", "service")`; takes `cause` when it matches `[a-z][a-z0-9_]{0,63}`, else `team_unavailable`, as legacy's `_reason_code` (`service.py:140-144`);
  2. with no bound policy for the intent's session refuses `ADM-R01`; with `ai_mode` `off` or `review_required` false returns `"not_required"` and writes nothing (`application` then answers `proceed` without a row, as now);
  3. a `review` row whose `application` is already frozen returns `"existing"` and writes nothing (the first application stands, D12);
  4. otherwise commits, in one transaction, `INTENT_SEEN` when there is no row and `REVIEW_UNAVAILABLE` `{intent_digest, application}` with `application` = `Frozen("proceed_unavailable", "cause", None, None, cause, None, True)`, appends `{"intent_digest", "cause"}` to `self.alerts`, and returns `"recorded"`. Admission's A5 (`Policy.application`) then reads the frozen application on the first `submit`: `proceed_unavailable`, never `ADM-R15`. Under `enforce_entry_holds` an active pause is still read first, as now (legacy `service.py:366-371`).
* **The ledger.** `resources/events.schema.json` gains `DECISION_RECORDED` with those seven string fields and `REVIEW_UNAVAILABLE` with `REVIEW_DEADLINE_PASSED`'s two (`intent_digest` string, `application` object). `kernel/ledger/store.py`: `_FAMILY["DECISION_RECORDED"] = "policy"`, `_FAMILY["REVIEW_UNAVAILABLE"] = "policy"`, `_PK["decision"] = ("invocation_id",)`; `_load_touched` loads the `decision` row by `invocation_id` and the `review` row for `REVIEW_UNAVAILABLE` as for `REVIEW_DEADLINE_PASSED`. `kernel/ledger/projections.py`: `TABLES` gains `decision`; `fold` inserts `{invocation_id, strategy, session_id, trigger, kind, evidence_ref, sequence}` and raises `TransitionNotAllowed` for a second row with the same key; `REVIEW_UNAVAILABLE` folds into the `review` row exactly as `REVIEW_DEADLINE_PASSED` does. `kernel/ledger/schema.py`: `Migration(8, "decisions", "008_decisions.sql")`, a new file under `resources/migrations/` creating `decision (invocation_id TEXT PRIMARY KEY, strategy TEXT NOT NULL, session_id TEXT NOT NULL, trigger TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('ENTER','NOTHING')), evidence_ref TEXT NOT NULL, sequence INTEGER NOT NULL)` and `CREATE UNIQUE INDEX decision_by_trigger ON decision (strategy, session_id, trigger)`, so one trigger holds one decision. **Proposed tree delta** (the next free T number in the module index): the file `008_decisions.sql`; SLICE-13's import migration then takes the next number, as its row already says.
* **`setup_fresh` (Fork call, RFL `:6790-6798`).** `Policy.setup_fresh(intent) -> bool`: the `decision` row whose `invocation_id` is `intent.intent_id`; none gives `False` (legacy's "not found"); otherwise the row of the same `strategy` and `session_id` with the greatest `trigger` below it; none gives `True` (the session's first decision), else `kind != "ENTER"`. The kernel reads only its own record. Legacy ordered by file position; the host decides windows one at a time in trigger order and records each before the next is decided, so trigger order is file order.
* **Composition (no new gate).** `kernel/policy.py` gains `RecordedSetup(inner, policy)`, a `SessionStatsPort` whose `stats(intent, now)` is `dataclasses.replace(inner.stats(intent, now), setup_fresh=policy.setup_fresh(intent))`. `compose_simulation` wraps `admission.stats` in it whenever admission is composed, right after `Policy` is built and before `EntryAdmission`, as legacy always derived the flag from its file. The planner's gate is unchanged (`limits.require_fresh_setup and not s.setup_fresh`, `kernel/planner.py`); with `require_fresh_setup` false, as in every existing admission test, the derived value changes nothing.
* **For the intent spec** (carried; the coordinator decides the wording): the `SessionStats` row names `setup_fresh` as derived by `Policy.setup_fresh` from the kernel's `decision` record, and the kernel's routes gain `record_decision` with steps 1–5 above and `record_unavailable` with its steps 1–4.

#### The strategy protocol (`strategies/worker.py`)

* An implementation module's `create(descriptor: StrategyDescriptor)` returns an object with `decide(ctx: BarContext) -> Signal`; a `checkpointed` strategy also has `checkpoint() -> dict` and `restore(body: dict) -> None`.
* **`Signal(kind: str, direction: str | None, score: float | None, conviction: float, reason: str, components: dict, tags: dict)`**, frozen: legacy's `Intent` fields the host maps. `kind` `ENTER` or `NOTHING`; `ENTER` needs `direction` `CE` or `PE`; `conviction` in 0…1; `NOTHING` carries no direction. A `Signal` that breaks these, or anything else returned, is a `strategy_error` (below).
* **`BarContext`**, read-only: `view` (the trigger's `View`), `trigger` (the window start, aware), `at` (the bar's start as legacy's `Context.at`, ISO-8601 in IST), `bar_index`, and `open`, `high`, `low`, `close`, `volume` as `Series` over `view.bars(descriptor.underlying)` through the trigger bar; `Series.window(n)` is legacy's rule above, values as `float` of the bar strings.

#### The strategy store (`strategies/worker.py`)

* **`StrategyStore.open(path, strategy_id, clock) -> StrategyStore | Refusal`**: one SQLite file through `connect` and `WriterLock` (`kernel/ledger/runtime.py`, as `MarketStore.open`); a held lock refuses `STR-R12` (`store_lock_held`); a file of another schema or strategy `STR-R13` (`store_mismatch`). Schema 1, created in one `BEGIN IMMEDIATE`:
  * `store_meta(host_id, schema, strategy_id, created_at)`;
  * `invocation(invocation_id PRIMARY KEY, scope, trigger, policy, policy_version, state, attempt, view_id, predecessor, output, result_id, revision, revision_digest, published, decision_recorded, review_requested, submitting, outcome, cause, updated_at)`;
  * `scope_head(scope PRIMARY KEY, revision, digest, last_trigger)`;
  * `state(scope, revision, body, digest, PRIMARY KEY (scope, revision))` for `checkpointed` strategies;
  * `journal(seq PRIMARY KEY, kind, scope, invocation_id, payload, at)`, append-only: `WARMUP`, `STATE_RESET`, `RESULT_CONFLICT`, `ALERT`.
  The kernel never reads this file; it is the host's own record of how far each decision got.

#### Identity

`invocation_id = "inv1:" + sha256_hex(canonical([candidate_id, session_id, [strategy, underlying, session_id], policy, policy_version, [trigger, 60]]))`, `canonical` the ledger's (`kernel/ledger/envelope.py`) with `trigger` the window start in the stored UTC form; 69 characters of `[0-9a-f:]`, a valid `CommandKey`, never starting `prot:`. It is computed before anything is read and is the intent's `intent_id` and the entry's command key. `session_id` is `"<broker>:<account>:<calendar_id>:<trading_date>"` (the sessions spec's text, `kernel/lifecycle.py` `session_id_for`), with the row's account, the view policy's `calendar_id` and the trigger's exchange date.

#### The invocation

* **States and transactions** (each one transaction of the store):
  * `PLANNED`: the row with its identity, `attempt` 1;
  * `RESOLVED`: `view_id` and `predecessor` = the scope's head revision (0 with no head);
  * `COMPLETED`: `output`, `result_id = digest(output)`, `revision = predecessor + 1`, `revision_digest = digest([previous digest or "", invocation_id, result_id, body digest or None])`, the `state` row for `checkpointed`, and `scope_head` set to that revision and `last_trigger = trigger`, guarded by `UPDATE … WHERE revision = predecessor`;
  * **an invocation that cannot complete** (`predecessor_moved`: the guarded update changed no row; `checkpoint_mismatch`, below): in the same transaction, the strategy's output and any `state` row are discarded and the invocation is `COMPLETED` with the abstention of cause `strategy_error` and reason the host cause as its `output` and `result_id`, `revision` and `revision_digest` NULL, `cause` the host cause, and `scope_head.last_trigger` moved to the trigger (never backwards; the head's revision and digest untouched, so nothing is built on a moved predecessor, I-W1). It is then handed off as any abstention: published, recorded with the kernel, never reviewed or submitted, `RECORDED` with its `cause` kept. Legacy recorded a strategy that could not decide as `strategy_error` and walked on (`RUN:112-115`);
  * `HANDED_OFF` (`outcome` set), `RECORDED` or `ABANDONED` (`cause` set): terminal.
  A row already `COMPLETED` with another `result_id` is never overwritten: `RESULT_CONFLICT` is journalled and the stored output kept (I-W2).
* **Errors.** `decide` raising, or returning anything but a valid `Signal`, completes with an abstention, cause `strategy_error`, its text `"<ExceptionType>: <message>"` (`RUN:112-115`).
* **Restoration.** `recompute`: a new object from `create` for every invocation. `reset_on_restart`: one object for the host process; at start, every scope with a head gets `STATE_RESET` (`cause: host_restart`) in the journal and the object starts empty (Fork call, RFL `:7728`). `checkpoint`: the object is restored from the predecessor's `state` body after its digest is checked; a mismatch journals an `ALERT` and completes the invocation as one that cannot complete (`checkpoint_mismatch`, above), `decide` never called.
* **Serialization.** One strategy, one host, one thread: invocations run one at a time in trigger order, handoff included, as legacy's single-flight loop (`src/runtime/worker_host/__init__.py:515-519`). A new trading date is a new scope (I-W5).

#### The pass (`StrategyHost.run_pass`)

1. **Schedule (Fork call).** `next_pass_delay(pass_secs, now_epoch, lag_secs)` is legacy's `seconds_to_next_pass` exactly, with `lag_secs` the view policy's `wdef.lag` in seconds (POL-019's lag, the same value) and `pass_secs` `strategies.host.pass_secs`. `StrategyHost.run(stop)` sleeps that, through an injected `sleep`, and runs a pass, until `stop()`.
2. **Faulted pass (Fork call, RFL `:8103-8117`).** A pass whose `kernel.alive()` is false, or whose discovery view cannot be resolved (an unreadable store), walks nothing and records nothing.
3. **Pending handoffs first.** Every invocation of this process left `COMPLETED` by a kernel fault in an earlier pass is resolved as recovery resolves CP-W2 (below) before any new window, in trigger order.
4. **Discovery.** `discovery = resolve(reader, policies, policy, underlying, now)`; the newest confirmed window is `discovery.anchor`. If `discovery.final(underlying, anchor)` is false, the host sleeps `strategies.host.seal_wait_ms` once and resolves again. The windows walked are the bars of `discovery.bars(underlying)` with a start after the scope's `last_trigger`, oldest first, stopping before the first bar that is not `discovery.final(...)`, so no newer window is walked before an older unsealed one.
5. **Per window, one view per trigger (Fork call).** `view = resolve(reader, policies, policy, underlying, confirm_at(trigger, wdef))`. Its bars must end at the trigger, else the pass stops before this window. `bar_index` is the trigger bar's position in `view.bars(underlying)`. Below `warmup_bars`: `WARMUP` journalled, `last_trigger` moved, no invocation and no decision (`RUN:100-102`). Otherwise the invocation runs and is handed off before the next window.

#### The output (Fork calls 7 and 8)

* **`ENTER`** becomes `Intent(intent_id=invocation_id, strategy=id, family, strategy_version=version, session_id, candidate_id, view_id, underlying, as_of=Timestamp(trigger, "exchange"), direction="long_call" for CE or "long_put" for PE, structure_id="single_long_option", market_bias="bullish" or "bearish", scores=(("signal_score", s), ("iv_rank", None), ("conviction", repr(conviction))))`, `s` = `repr(float(score or 0.0))` under `signal_score`, `repr(conviction * 100)` under `conviction_x100`; `evidence_refs` empty.
* **`NOTHING`**, and every error, becomes the abstention `{"kind": "abstention", "invocation_id", "strategy", "session_id", "trigger", "cause": "no_signal" or "strategy_error", "reason", "components", "tags"}`, never submitted.

#### The handoff

For each `COMPLETED` invocation, each step's flag committed before the next starts:

1. `published`: `kernel.publish(output)`; the digest is the intent's `intent_ref` (`intent_digest` is the digest of its wire form);
2. `decision_recorded`: `kernel.record_decision(DecisionRecord(..., trigger, kind="ENTER" or "NOTHING", evidence_ref=digest))`, for every invocation (Fork call 20: legacy planned only the ENTER rows its decisions file held, RFL `:6828`, `:6832-6839`):
   * `"recorded"` or `"existing"`: the flag is set and the handoff continues;
   * `KernelUnavailable`, `WriterLost` or `CommitFailed` raised: the pass faults here (below);
   * any `Refusal`: an `ALERT` is journalled and nothing more is sent for it: an abstention is `RECORDED`; an `ENTER` is `ABANDONED` (`decision_unrecorded`), never reviewed and never submitted;
3. `review_requested`: for an intent, whatever the authority, `reviews.request(intent_ref)` (Fork call 12) through `ReviewPort.request(intent_ref) -> None | Refusal`. `None` sets the flag. A returned `Refusal` or any exception is a failed request (Fork call 16): an `ALERT` is journalled and the host calls `kernel.record_unavailable(intent_ref, "review_request_failed")` at once, so the kernel freezes `proceed_unavailable` with its alert and the first `submit` is decided on its other checks, with no `ADM-R15` and no retry sleep. Its `"recorded"`, `"existing"` or `"not_required"` sets the flag; a `Refusal` journals a second `ALERT` and the handoff continues (the kernel's deadline then applies); `KernelUnavailable`, `WriterLost` or `CommitFailed` faults the pass;
4. for an intent under the row's authority `trade`: `submitting` set, then `kernel.submit(EntryRequest(CommandKey(invocation_id), principal, account, FinancialSessionId(SessionScope(account, calendar_id), date), intent_ref))`, the answer classified below;
5. `RECORDED` for an abstention or an intent under `none` or `plan` (slice Deviation 8), else the classification's terminal state.

A fault in steps 1–3 (`KernelUnavailable`, `WriterLost` or `CommitFailed`) stops the pass there (faulted), the invocation staying `COMPLETED` with the flags already set; the next pass resolves it first (pass step 3, as recovery's CP-W2 row: a publish or decision record not done is retried; Fork call 11 then applies), before any new window.

**The kernel's answers.** The retry bound is the trigger bar's stamp under admission's `market.view_age_stamp` (`bar_close`: trigger + 60 s; `bar_open`: the trigger) plus `market.max_view_age_secs`, the kernel's own settings, read by the host's composition; no new value. Retries sleep `strategies.host.review_retry_ms`.

| Answer (`Outcome`) | Host action |
|---|---|
| `refusal` `None` (admitted, or an existing command's outcome) | `HANDED_OFF` |
| `canonical` `committed` with a refusal (any recorded check) | `HANDED_OFF` |
| `ADM-R15` | Retry; the kernel's review deadline ends it with a recorded answer |
| `ADM-R12` | Retry until the bound; then `ABANDONED` (`busy_until_stale`), slice Deviation 6 |
| `canonical` `commit_failed` | Retry until the bound; then `ABANDONED` (`commit_failed`) |
| `LED-R02` | `ABANDONED` (`idempotency_conflict`) with an `ALERT` |
| Any other unrecorded refusal | `command_status`: known, `HANDED_OFF` with it; none, `ABANDONED` (`unrecorded:<code>`) |
| `KernelUnavailable` or `WriterLost` | `command_status`: known, `HANDED_OFF`; none, retry until the bound, ask once more, then `ABANDONED` (`outcome_unknown`) |

#### Recovery (`StrategyHost.recover`, before the first pass)

| Found | Point | Result |
|---|---|---|
| `PLANNED` | before CP-W1 | Resolve the trigger's view as the pass does, then as CP-W1 |
| `RESOLVED` | CP-W1 | Re-run on the same `view_id` (reopened by identity), `attempt` 2, from the restored state (`reset_on_restart`: empty, after `STATE_RESET`) |
| `COMPLETED`, any of `published`, `decision_recorded`, `review_requested`, `submitting` | CP-W2…CP-W5 | Publish if not published and record the decision if not recorded (legacy's row was already durable), its answer classified as in handoff step 2 (a refusal: `ALERT`, an abstention `RECORDED`, an `ENTER` `ABANDONED` `decision_unrecorded`; a fault: left `COMPLETED`); request no review; then `command_status(invocation_id)`: known, `HANDED_OFF` with it (A05-F2: never resubmitted as new); none, `RECORDED` for an abstention or an intent under `none` or `plan`, else `ABANDONED` (`host_restart`), not submitted (Fork call 11) |

#### The host's composition (`bootstrap.py`)

* `HostSettings(pass_secs: int, seal_wait_ms: int, review_retry_ms: int)`, frozen; `None` raises `RefusingParameterUnbound("strategies.host.<key>")`, a value not an int of at least 1 `ValueError`. SLICE-11 binds them through the loader (`seal_wait_ms` and `review_retry_ms` measured by TASK-S11-07; `pass_secs` from step 3's characterization).
* `compose_strategy_host(settings, host: HostSettings, *, registry, strategy_id, kernel, reviews, market_path, view_policies, store_path, clock, sleep, fault_point=None) -> StrategyHost` refuses, before opening anything: a `strategy_id` with no `runnable` registration (`STR-R14`, `not_runnable`); a descriptor whose `view_policy` is not bound (`RefusingParameterUnbound("market.views.<name>")`); unbound `market.view_age_stamp` or `market.max_view_age_secs`. It imports `<package.module>.<stem>` with `importlib` only now, for that one accepted strategy (one strategy per host, Fork call 14), then opens the store and runs `recover()`.
* The host's principal is `Principal(f"strategy:{id}", "service")`; its `entry` grant on the row's account is recorded by a human holding `grant_admin`; class S tests use a synthetic grant. `bootstrap.InProcessKernel(composition, principal)` implements `KernelPorts` (`alive`, `publish` through the kernel's `EvidenceStore`, `record_decision` and `record_unavailable` through the coordinator's routes, `submit` through `Coordinator.admit_entry`, `command_status`) in process; SLICE-10's channel replaces it. `kernel.alive()` is `True` in process.
* `fault_point` names CP-W1…CP-W5; the host exits 86 there (`os._exit`), as the market store's crash seam.

#### EMA cross (`strategies/ema_cross.py`)

Legacy's `EmaCrossover` and `_ema` copied unchanged (`src/strategies/ema_crossover.py:80-205`): `FAST` 9, `SLOW` 21, `MIN_SEPARATION` 0.0002 and `FULL_SEPARATION` 0.004 are the strategy's own constants, so another value is another strategy version (Fork call). `decide` returns `Signal` in place of legacy's `Intent` with the same kind, direction, conviction, reason, components and tags; `score` `None`. Its descriptor: id `ema_cross`, `decision_method` `deterministic`, `warmup_bars` 64 (`SLOW * 3 + 1`), `state` `stateless`/`recompute`, `score_source` `signal_score`, `requested_authority` `none`; registered disabled (slice Not ported note).

#### Codes

| Code | Message | When |
|---|---|---|
| `STR-R12` | `store_lock_held` | A second host for one strategy store |
| `STR-R13` | `store_mismatch` | A store of another schema or strategy |
| `STR-R14` | `not_runnable` | The composition names a strategy with no runnable registration |

Host causes (`predecessor_moved`, `checkpoint_mismatch`, `decision_unrecorded`, `busy_until_stale`, `commit_failed`, `idempotency_conflict`, `unrecorded:<code>`, `outcome_unknown`, `host_restart`) are recorded on the invocation; only `predecessor_moved` and `checkpoint_mismatch` also leave it, as the reason of the published `strategy_error` abstention. `review_request_failed` is the cause the host sends with `record_unavailable`.

#### Fork calls and Deviations in this step

* **Fork calls:** the pass formula and lag (1); one view per trigger (2); the score mapping and `or 0.0` (7); abstentions never submitted (8); `setup_fresh` from the previous recorded decision, `False` when not recorded (9); BuyerEdge-style state reset at restart (10); a decision completed but not sent before a crash or a kernel fault not sent afterwards (11); a review for every intent (12); one strategy per host (14); a faulted pass walks nothing (15); a failed review request recorded with the kernel as unavailable at once, never waiting out the deadline (16); EMA cross's constants; an `ENTER` the kernel did not record never reviewed or submitted (20).
* **Deviations:** slice Deviations 4–8 as they apply; a refused `record_unavailable` journals an alert and leaves the kernel's deadline to run; a pass that cannot confirm a window's bar against its own view stops before it; the decision record is a ledger projection, where legacy kept a file.

### Tests

`tests/unit/test_strategy_invocation.py` (T-51) and the CP-W rows of `tests/recovery/test_crash_boundaries.py`. Every value is labelled synthetic; every expectation is computed by hand. Instants are IST on 2026-11-02 (a Monday). Strategies come from a `tmp_path` test package (step 1's `simpkg` pattern) holding scripted strategies whose `decide` returns a `Signal` read from a per-test script, plus EMA cross. Kernel worlds are SLICE-08 step 5's store world (`conftest.build` with a market store, a `live` policy, a session for `NSE-FO` on the date, `ai_mode` `off` unless a case says otherwise), its helper repeated in the file; unit cases of the handoff use `ScriptedKernel`, a `KernelPorts` double returning scripted answers. `HostSettings(20, 500, 1000)` and `market.max_view_age_secs` 90 with `view_age_stamp` `bar_close` (synthetic, as POL-018's approved 90).

| Group | Cases |
|---|---|
| Identity | For candidate `"c" * 64`, session `sim:acct-sim:NSE-FO:2026-11-02`, strategy `sim_alpha`, underlying `NIFTY-SYN`, policy `live` version `1`, trigger 10:41: the ID equals `"inv1:" + sha256` of the canonical list written in the test with `json.dumps(sort_keys=True, separators=(",", ":"))`; 69 characters, `CommandKey` accepts it; another policy version or trigger gives another ID; a retry after CP-W1 keeps it |
| Schedule | `next_pass_delay(20, t, 7)` at `t` with `t % 60` 7.0 gives 20.0; 10.0 gives 17.0; 50.0 gives 17.0; 6.98 gives 0.05; `pass_secs` 0 is refused by `HostSettings`, and `next_pass_delay(0.5, …)` uses 1.0 (legacy's floor) |
| Windows and seal wait | Bars at 10:40, 10:41, 10:42 (the minute pattern of SLICE-08 step 6); a pass at 10:43:07 before the 10:43:07 seal commit sleeps `seal_wait_ms` once (recorded `sleep(0.5)`), finds 10:42 still not final and walks 10:40 and 10:41 only; the next pass walks 10:42. Each window's `view_id` names the cutoff at its own confirmation instant (10:41:07, 10:42:07) and differs from the others; a pass at a later instant re-deciding nothing (cursor) |
| Warm-up | `warmup_bars` 2: the day's first two bars are `WARMUP` in the journal with no invocation and no `DECISION_RECORDED`; the third is decided with `bar_index` 2 |
| One view per trigger with the kernel (PRF-STR-02) | `authority` `trade`, ENTER at 10:41: admitted, the plan's chain the 10:41 poll, `measured_ages.view_ms` from the 10:41 bar's close. A catch-up: the 10:41 bar sealed only at 10:43:40 and decided by the pass at 10:43:47: the planner is called once (stage P runs before stage B), then `ADM-R05` is recorded at check `B1` (the bar's close is 107 s old against 90), `HANDED_OFF` with it |
| States and invariants | I-W1: a second `complete` from predecessor 3 after the head moved to 4 stores the `strategy_error` abstention with reason `predecessor_moved`, `revision` NULL and no `state` row, head revision still 4 and `last_trigger` moved to its trigger, in one transaction; it is published and recorded with the kernel once as `NOTHING`, never reviewed or submitted, and ends `RECORDED` with cause `predecessor_moved`; I-W2: a recomputed different `result_id` journals `RESULT_CONFLICT` and keeps the output; I-W3: across every case, at most one `COMMAND_ADMITTED` or `ADMISSION_REFUSED` per invocation ID; I-W4: a revision exists only with its output; I-W5: the next trading date starts scope revision 1 |
| Output mapping | ENTER CE with score 47.0 and conviction 0.47 under `signal_score`: scores `("47.0", None, "0.47")`, `long_call`, `bullish`, `as_of` the trigger; score `None`: `"0.0"`; under `conviction_x100` with conviction 0.47: `repr(0.47 * 100)`; PE gives `long_put`, `bearish`; a raising `decide` and a `Signal` with conviction 1.5 each give an abstention with cause `strategy_error` and the text |
| Handoff order | Per invocation: `publish`, `record_decision`, `request` (intents only), `submit` (`trade` only), in that order; `none` and `plan`: recorded, review requested, never submitted; an abstention: published and recorded, no review, no submit |
| Kernel answers | `ScriptedKernel` returning: admitted; a recorded `ADM-R13`; `ADM-R15` twice then admitted (two sleeps of 1.0); `ADM-R12` until the bound (trigger 10:41, bound 10:43:30: the last retry before it, then `busy_until_stale`); `commit_failed` likewise; `LED-R02` (`idempotency_conflict` and an alert); an unrecorded `DOM-R06` with a known command (adopted) and with none (`unrecorded:DOM-R06`); `KernelUnavailable` with the key known (adopted) and unknown (retried, asked again, `outcome_unknown`). Every retry carries the same command key and request digest. `record_decision` answering: `"existing"` (the handoff continues); a `Refusal` (`ADM-R01`) for an `ENTER` under `trade` (an `ALERT`, `ABANDONED` `decision_unrecorded`, no `request`, no `submit`) and for an abstention (an `ALERT`, `RECORDED`); `KernelUnavailable`, `WriterLost` and `CommitFailed` raised (the pass faulted, no later window walked, the invocation `COMPLETED`; the next pass calls `record_decision` for it first, before any new window) |
| Review request failure (Fork call 16) | `ScriptedKernel`: `request` returning a `Refusal` and `request` raising each give an `ALERT` and one `record_unavailable(intent_ref, "review_request_failed")` before `submit`. Kernel world with `ai_mode` `enforce_entry_holds`, review required, `authority` `trade`, ENTER at 10:41 and a failing `request`: the first `submit` is admitted with application `proceed_unavailable`, cause `review_request_failed`, `alert` true; no `ADM-R15` is returned, no sleep is recorded, and one `REVIEW_UNAVAILABLE` is in the ledger. `record_unavailable` after a review was recorded for the intent: `"existing"`, the review's application kept; with `ai_mode` `off`: `"not_required"`, no event; a cause `"Bad Cause"`: recorded as `team_unavailable`; principal `strategy:other`: `SES-R02` |
| Decision record and `setup_fresh` (PRF-STR-02) | In one session: NOTHING at 10:00, ENTER at 10:01 (fresh), ENTER at 10:02 (not fresh), NOTHING at 10:03, ENTER at 10:04 (fresh); the session's first decision an ENTER at 09:16 (fresh); an intent with no record (`False`); after a host restart and kernel recomposition over the same ledger, the same answers; an abandoned decision still recorded and counted. `record_decision` twice with the same fields: `"existing"`, one event; with another `kind`: `LED-R02`. Refused: an unauthenticated principal (`SES-R01`), an `auth` carrying an operator request (`SEC-R09`), principal `strategy:other` (`SES-R02`), an unknown session and evidence of another invocation (`ADM-R01`); an `ENTER` record whose `trigger` is 10:02 for an intent with `as_of` 10:01, and a `NOTHING` record whose `trigger` differs from its abstention's (`ADM-R01`); a second invocation ID at the 10:01 trigger of the same strategy and session (`LED-R02`, one `decision` row). Two `DECISION_RECORDED` events at one `(strategy, session_id, trigger)` committed straight through the writer: the second does not commit (the unique index). A coordinator composed without admission: `record_decision` and `record_unavailable` raise `RuntimeError`. The account `authority.check` receives is the session row's, decoded. With `require_fresh_setup` true in the bound limits, the 10:02 ENTER is refused by the planner (`ADM-R13`, stage `session_gates`), as legacy |
| Restoration | `reset_on_restart`: a restart journals `STATE_RESET` per scope and the strategy object is new; `checkpoint`: a body restored and its digest checked; a tampered body journals an `ALERT`, `decide` is not called, and the invocation stores the `strategy_error` abstention with reason `checkpoint_mismatch` and `last_trigger` moved, in one transaction, is recorded with the kernel once as `NOTHING`, and ends `RECORDED`; the next window is decided |
| Composition | Unbound `pass_secs`, `seal_wait_ms`, `review_retry_ms`, view policy, `view_age_stamp` or `max_view_age_secs`: `RefusingParameterUnbound` naming it; a disabled row: `STR-R14`; the module is imported only for the accepted strategy (an import spy sees no other); a second host on one store: `STR-R12`; `kernel.alive()` false: the pass walks nothing |
| EMA cross | 65 bars from 09:15, each close 100.0 but the last 101.0, `warmup_bars` 64: bars 0–63 `WARMUP`; bar 64 ENTER CE with `fast_now = 101.0 * 0.2 + 100.0 * 0.8`, `slow_now = 101.0 * (2 / 22) + 100.0 * (1 - 2 / 22)` (`k = 2 / (span + 1)`), `fast_prev = slow_prev = 100.0`, `gap = (fast_now - slow_now) / slow_now` and conviction `min(1.0, abs(gap) / 0.004)`, each written in the test as these float expressions; a flat series gives NOTHING with reason `no cross; separation +0.000%` |
| Crash points (PRF-STR-03; `test_crash_boundaries.py`) | A real host subprocess (the file run as a script, as its CP-L and CP-M rows) killed at each point, then the kernel and host recomposed in process over the same files: CP-W1 re-runs with `attempt` 2 on the same `view_id`; CP-W2 and CP-W3 publish and record once, no review, `ABANDONED` (`host_restart`), no command; CP-W4 (killed after `admit_entry` returned, before `HANDED_OFF`) adopts the kernel's command, never a second; CP-W5 (killed during `ADM-R15` retries) adopts or abandons as the kernel holds; every completed decision recorded exactly once |

**Changed existing tests:** any test that lists the event kinds, the index tables or the shipped migrations gains `DECISION_RECORDED`, `REVIEW_UNAVAILABLE`, `decision` and migration 8; the builder names each in the as-built table.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence; the exact text recorded in the as-built table), one at a time, run against `test_strategy_invocation.py` and `test_crash_boundaries.py`, and restored byte for byte with an md5 check.

| Change | Anchor | Test that must fail |
|---|---|---|
| One view for every window of a pass (the discovery view) | `worker.py`, the per-window `resolve` | Windows and seal wait; One view per trigger |
| `scope_head` moved without the predecessor guard | `worker.py`, the `COMPLETED` update's `WHERE revision = ?` | States and invariants (I-W1) |
| A fresh identity on retry (the attempt in the identity) | `worker.py`, `invocation_id` | Identity; Crash points (CP-W1) |
| A `|` in the ID (`inv1|`) | `worker.py`, the `"inv1:"` prefix | Identity |
| Resubmitting after CP-W2 | `worker.py`, `recover`: the no-command branch | Crash points (CP-W2) |
| An abstention not recorded with the kernel | `worker.py`, the handoff's `record_decision` condition | Handoff order; Decision record |
| `ADM-R12` retried past the bound | `worker.py`, the retry-bound comparison | Kernel answers |
| A newer window walked before an older unsealed one | `worker.py`, the stop at the first non-final bar | Windows and seal wait |
| Warm-up windows decided | `worker.py`, the `warmup_bars` comparison | Warm-up |
| The review requested only under `trade` | `worker.py`, the review condition | Handoff order |
| A refused decision record lets the `ENTER` go on to review and submit | `worker.py`, the decision-record refusal branch | Kernel answers (`decision_unrecorded`, no `request`, no `submit`) |
| A decision-record fault treated as a refusal (the pass walks on) | `worker.py`, the decision-record fault branch | Kernel answers (the pass faulted) |
| A failed review request left to the kernel's deadline (`record_unavailable` not called) | `worker.py`, the review-failure branch | Review request failure |
| `record_unavailable` overwriting an application already frozen | `policy.py`, `record_unavailable`'s `"existing"` branch | Review request failure |
| An `ENTER` record accepted with a trigger other than its intent's `as_of` | `policy.py`, the `ENTER` trigger comparison | Decision record |
| A `NOTHING` record accepted with a trigger other than its abstention's | `policy.py`, the `NOTHING` trigger comparison | Decision record |
| A second invocation at one trigger recorded | `policy.py`, the same-trigger `LED-R02` branch | Decision record |
| `decision_by_trigger` created without `UNIQUE` | `008_decisions.sql`, the index | Decision record (the writer case) |
| An invocation that cannot complete left unrecorded, `last_trigger` unmoved | `worker.py`, the `predecessor_moved` and `checkpoint_mismatch` completion | States and invariants (I-W1); Restoration |
| The score without legacy's `or 0.0` | `worker.py`, the `signal_score` mapping | Output mapping |
| The pass delay without `max(0.05, …)` | `worker.py`, `next_pass_delay` | Schedule |
| `setup_fresh` true for an unrecorded intent | `policy.py`, `setup_fresh`'s not-found branch | Decision record |
| `setup_fresh` from the latest decision of the session, not the one before | `policy.py`, the `trigger <` bound | Decision record |
| `setup_fresh` taken from the fixture (`RecordedSetup` not composed) | `bootstrap.py`, the `RecordedSetup` wrap | Decision record (the planner refusal) |
| `record_decision` trusting the payload principal | `coordinator.py`, the authentication | Decision record (`SES-R01`) |
| A changed decision overwriting the first | `policy.py`, the `LED-R02` branch | Decision record |
| CP-W4 resubmitted as a new command | `worker.py`, `recover`: the known-command branch | Crash points (CP-W4) |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/strategies/worker.py` | New: `Signal`, `BarContext`, `Series`, `StrategyStore`, `KernelPorts`, `ReviewPort`, `KernelUnavailable`, `invocation_id`, `next_pass_delay`, `StrategyHost` (`run_pass`, `run`, `recover`) |
| `src/autonomous_trading/strategies/ema_cross.py` | New: legacy's EMA crossover and its `DESCRIPTOR` |
| `src/autonomous_trading/contracts/decisions.py` | `DecisionRecord` |
| `src/autonomous_trading/kernel/policy.py` | `record_decision`, `record_unavailable`, `setup_fresh`, `RecordedSetup` |
| `src/autonomous_trading/kernel/coordinator.py` | `record_decision`, `record_unavailable` |
| `src/autonomous_trading/kernel/ledger/projections.py`, `src/autonomous_trading/kernel/ledger/store.py`, `src/autonomous_trading/kernel/ledger/schema.py` | The `decision` table, its fold, family, key and load; migration 8 |
| `src/autonomous_trading/resources/events.schema.json` | `DECISION_RECORDED`, `REVIEW_UNAVAILABLE` |
| `src/autonomous_trading/resources/migrations/` | `008_decisions.sql` (T-96) |
| `src/autonomous_trading/bootstrap.py` | The `RecordedSetup` wrap; `HostSettings`, `compose_strategy_host`, `InProcessKernel` |
| `tests/unit/test_strategy_invocation.py` | New (T-51) |
| `tests/recovery/test_crash_boundaries.py` | The CP-W rows and their child |

### Completion conditions (step 2)

* Every test above passes, twice in a row, with the whole suite; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every edited Python file and `json.loads` on `events.schema.json`.
* `git diff --stat` against the branch head at the start of step 2 names only the files above.
* PRF-STR-02's clauses each pass a group (Identity; States and invariants; Warm-up; Handoff order; Kernel answers; Review request failure; One view per trigger; Decision record and `setup_fresh`; Windows and seal wait; Schedule), and PRF-STR-03's CP-W rows pass Crash points.
* The coordinator has decided the intent spec's carried text, and the module index carries the migration's tree delta.

### Step 2 as built

**In plain words.** The program that runs one strategy now exists. It decides each final bar on its own snapshot, writes the decision down, tells the kernel, and sends an entry only for a strategy allowed to trade. The kernel now keeps every decision and judges "fresh setup" from that record.

Commit `e4948d0` on `slice-08`, on top of `ee6aec9` (SLICE-10 step 4). It changes 14 files (2,401 lines added). Not pushed.

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Identity text | The ID is `inv1:` plus 64 lower-case hex digits; the text's "69 characters of `[0-9a-f:]`" overlooked the `i`, `n` and `v` of the prefix |
| Crash points | CP-W1 after `RESOLVED`; CP-W2 after `COMPLETED`, before publishing; CP-W3 after the decision is recorded; CP-W4 after `submit` returns; CP-W5 after the first `ADM-R15` |
| Retry bound | A retry is made only when it lands strictly before the bound (bound 10:43:30: last submit 10:43:29, 83 submits) |
| `record_unavailable` signatures | `Coordinator.record_unavailable(intent_ref, cause, principal, *, auth=None)` and `Policy.record_unavailable(intent_ref, cause, auth, principal)`: the principal has no record to come from |
| Composition | `compose_strategy_host` also takes `packages` (default `(PRODUCTION,)`): the registry holds no map from a package label to its module |
| Gaps the text left open | A `RESOLVED` invocation whose view cannot be reopened faults the pass. A failing `checkpoint()` keeps the predecessor's state body |
| EMA cross descriptor | View policy `ema_cross`, underlying `NIFTY`, fields `bars`, `code: ["worker"]` (it imports `Signal`); registered with no row, so never runnable |
| Existing test changed | `tests/unit/test_strategy_registry.py`: three assertions narrowed, because the production package now registers EMA cross. This file is outside the step's file list |
| Event, table and migration lists | No existing test needed a change: their counts derive from `MIGRATIONS` and the schema |
| Windows test | Extended with a window sealed but not yet final, so the stop at the first non-final bar can be broken |

**Tests:** `tests/unit/test_strategy_invocation.py` (44 cases) and 5 CP-W rows in `tests/recovery/test_crash_boundaries.py`. A targeted run on the owner's new routine passed 552 cases: the step's files plus the existing registry, review, admission, ledger, envelope, planner, projection, restore, session, market-port, entry-outcome, shared-engine, dispatch and capability tests. The full suite was not run (the coordinator decides). `ast.parse` passes on every edited Python file and `json.loads` on `events.schema.json`.

**Break checks** (`s09b_breaks.py`): all 28 failed a listed test, and every file was restored (md5). These are the table's 19 plus 9 added for R-1 to R-5: a decision-record fault treated as a refusal; a failed review request left to the deadline; `record_unavailable` overwriting a frozen application; either trigger check removed; a second invocation at one trigger; `decision_by_trigger` without `UNIQUE`; an invocation that cannot complete left unrecorded; `SEC-R09` not applied.

**Open:** the intent spec's carried text and the module index's tree delta for `008_decisions.sql` (the coordinator's).

## Step 3 — BuyerEdge

The authorities are the spec's [strategy host](../../design/strategies-and-cognition.md#the-strategy-host-strategiesworkerpy) and legacy's live BuyerEdge at 445eb116: `src/strategies/buyer_edge.py` (`BE`), `src/data/replay_engine/scorer.py` (`SC`), `src/runtime/market_view.py` (`MV`), `src/data/marketdata/scans.py`, and RFL. Step 3 is TASK-S09-08 and TASK-S09-11 (characterizations, recorded before any code), then TASK-S09-03 (PRF-STR-04). It builds on step 2 as built (`e4948d0`) and on SLICE-08's reads, all built: the view's spot series through the cutoff (`View.spot_series`), the exact-minute chain poll (`View.chains(minute=)`) and the day's Greeks through the cutoff (`View.greeks_day`, `View.greeks_at`). **The fork rule applies to the whole step:** the scorer, its configuration, its inputs, their order of state updates, the bound clock and the intent mapping are legacy's exactly. Nothing is tuned, cleaned or corrected; a defect found is recorded, never fixed here. No score, threshold or money value is set.

**In plain words.** First, facts are read from the running legacy system without changing it: which strategies it runs and how, which bars BuyerEdge walks, how its Greeks line up with the bar, which scorer and library versions run, and whether its orders pass a second loss limit in the MCP process (they do not). Then BuyerEdge's scoring is copied over unchanged, fed the same market data in the same order, and proven to give the same answer as the old code, bar after bar, over whole sessions and over sessions restarted midway.

### Decisions

#### What legacy does here

* **The strategy.** `create` builds `BuyerEdgeStrategy` around `scorer_for(DEFAULT_SCORER, ...)` (`BE:2496-2509`), `DEFAULT_SCORER = "extracted"` (`BE:2093`): `RealScorer` over this module's own `SignalEngine(BotConfig())` (`BE:2431-2469`), one engine for the whole session (`BE:2422-2429`). The live driver passes only `underlying`, `day` and `name` (`BE:2492-2494`), so no `min_score_schedule` applies. `SPEC` declares `warmup_bars` 20 and needs `("spot", "chain", "greeks")` (`BE:2105-2114`).
* **One bar** (`BE:2388-2406`): `spot = ctx.close[0]`; none gives NOTHING `"no close on this bar"`. Otherwise `RealScorer(ctx=, spot=, stamp=ctx.at)` (`SC:111-160`) assembles the bar, binds the module's `get_ist_now` to the stamp for the one call and restores it after (`SC:129-143`), and calls `engine.score(**view.score_kwargs(instrument))` (`SC:168-173`). An unassembled bar returns `None` (`SC:121-127`).
* **The assembly** (`MV:759-799`): `inputs_at(store, underlying, day, stamp, previous=<the last assembled minute>)`, the exact-minute chain (`MV:848-860`). A chain without spot takes `ctx.close` as spot and recomputes the ATM strike and straddle (`MV:766-773`). No chain: `"no chain for this minute"`; an unusable chain: refused. **The previous assembled minute is set before the spot frame is checked** (`MV:783`). The spot frame is read through the stamp (`MV:784-787`; `:956-993`). **Only then** are the chain rows appended to the history (`MV:789`) and smoothed by `OIFlowAnalyzer.smooth_chain_rows` over the last five (`MV:789-791`). The Greeks kwargs follow (`MV:795`; exact minute, `scans.py:273-282`, `:316-331`); there is no age bound (`MV:214-217`, `:333-338`).
* **The spot frame** (`spot_frame`, `MV:956-993`). The day's spot records are kept when their `at` parses and its instant is at or before the stamp's instant, then stable-sorted by instant (`MV:963-971`), so records with one instant stay in file order. Each kept record becomes a row (`MV:972-990`): `close = d.get("close", d.get("ltp"))`, and a `None` close skips the record; `open`, `high` and `low` are `d.get(<field>, close)` (the close stands in only when the key is absent); `volume` is `d.get("volume", 0) or 0`. The index entry is `pd.Timestamp(at)`, converted to IST (`tz_convert(store.IST)`) only when its offset is not IST's. No rows gives `None` (`MV:991-992`); otherwise `pd.DataFrame(rows, index=pd.DatetimeIndex(index))`.
* **The chain rows' order.** `snapshot_matching` takes the first stamp in `sorted(index)` whose minute matches, then that stamp's records in file order (`store.py:1126-1133`). `inputs_from_rows` takes spot from the first row that has one (`MV:874-878`), flattens the rows in that order (`MV:879`), and `atm_of` takes the first of equally near strikes (`min`, `MV:835`). `greek_kwargs` takes the first raw row at the ATM strike (`MV:639-640`). The order therefore decides the ATM strike, the straddle and the Greeks row when strikes are equidistant or a poll holds more than one expiry.
* **The Greeks refresh** (`MV:585-625`). The Greeks cache is reread only when the stamp's minute is past the newest cached minute, the source is refreshable, and at least `GREEKS_REFRESH_SECS` (20 s, `MV:74-75`) have passed on the monotonic clock since the last read (`MV:603-611`). A failed read keeps the previous cache (`MV:616-620`). So live, a minute's batch can be missing from the cache when that minute is scored.
* **The mapping** (`to_intent`, `BE:2228-2322`): `signal = str(result.signal or "").upper()`, `score = float(result.score or 0)`. Components come from each `ScoreComponent`'s `label`; unavailable ones are named in `tags`. `conviction = min(1.0, |score| / 100)` on every result. `ACTING = {"EXECUTE"}` (`BE:2127`): anything else, a `None` result included, is NOTHING with `reasons[0]` or `"signal=<signal or none>"`. An `EXECUTE` with no direction is NOTHING `"no direction"`. Otherwise ENTER with `direction` (`CE` or `PE`) and `reason` `reasons[0]` or `"score=<score:.0f>"`. The gamma shadow and the session-adjusted floor shadow ride in `tags` only (`BE:2235-2239`, `:2289-2292`; Fork call 4).

#### TASK-S09-08: characterizations (evidence records, read-only on the live host)

Each is recorded in `tests/fixtures/manifests.json` with its source and the command that read it, before code. Nothing on the live host is changed.

1. **Rows and the pass.** Every live registry row (id, kind, authority, enabled, underlying), the account traded, and the deployed unit's `--poll`. The rows are carried unchanged into `strategies.registry.*` (BuyerEdge's at `trade`, `autoregister.py:421-426`); `--poll` binds `strategies.host.pass_secs` (Fork call 1).
2. **The bars walked.** Which series the library runner walks for BuyerEdge (tick bars or history bars) and the text of `ctx.at` (its zone and form), so the host's `BarContext.at` and the trigger match. A difference stops the step for the coordinator.
3. **The Greeks minute boundary and refresh.** On the captured days, whether a chain poll's minute stamp and the Greeks batch's `at` meet `greeks_at`'s "at or before the stamp" rule for the stamp legacy passes (`scans.py:316-331`), so the golden walks include the boundary. With it, whether the 20-second refresh throttle (`MV:603-611`) left a scored minute's batch out of legacy's cache: the decision records' Gamma shadow coverage (`priced_legs`) shows what the cache priced at each scored bar.
4. **The scorer bound live.** The live registry row's `module` (`src.strategies.buyer_edge:create`), and the SHA-256 of the deployed `src/strategies/buyer_edge.py` and `scripts/strategy_factories.py` against the 445eb116 blobs. Equal hashes mean `DEFAULT_SCORER = "extracted"` (`BE:2093`) and the driver's three arguments (`BE:2492-2494`) are what runs. The decision records' floor shadow (`effective_min_score_shadow`, recorded on every scan) shows `applied: false`. `monolith` is not ported.
5. **The live interpreter and libraries.** `<live venv>/bin/python -c "import sys,numpy,pandas;print(sys.version,numpy.__version__,pandas.__version__)"`. The three are pinned with `==` in OA_NEW's `pyproject.toml`, and the golden generator (T-54) runs under them.

**Evidence records** (read 2 November 2026, about 11:42–11:46 IST, during a live session; read-only). Each script is under `~/claude-desktop/scripts/` on `debian-oa`, reached with `C:\Windows\System32\OpenSSH\ssh.exe debian-oa "bash ~/claude-desktop/scripts/<name>"` (Python probes: `~/AutonomousTrading/.venv/bin/python -I <script> ~/claude-desktop/outputs/s09c`). Secrets cannot appear by construction: the scripts print named non-secret fields only, read `.env` only through a `grep -E` of named keys, and print environment-variable names, never values. Recorded days were copied first (`cp -p`) into `~/claude-desktop/outputs/s09c/` and read there. Nothing in `~/AutonomousTrading` was written, and no unit was started or stopped.

| # | Command | Output | Reading |
|---|---|---|---|
| 1 | `s09c_probe1.sh`, `s09c_probe2.sh`, `s09c_probe9.sh` (`run/strategies/strategies.json`, fields `id kind authority enabled exchange module`; `systemctl cat at-strategy.service`) | `buyer_edge`: `library`, `trade`, enabled, `NFO`, `src.strategies.buyer_edge:create`. `ai_ema_cross`: `ai_worker`, `none`, enabled, `NSE`, `src.strategies.ai_ema_cross:main` (running as its own child). `ema_cross_spot`: `worker`, `none`, disabled. `ema_crossover`: `library`, `none`, disabled. The unit runs `scripts/run_framework_live.py --underlying NIFTY --name buyer_edge --poll 20`. Execution URL key `OPENALGO_API_URL=http://127.0.0.1:5000`; the decision records of 30 October say `broker_environment: analyze` | Four rows, carried unchanged. No row has an `underlying` field: NIFTY comes from the unit's `--underlying`. One OpenAlgo account, at `127.0.0.1:5000`. `strategies.host.pass_secs` binds 20 |
| 2 | `s09c_probe6.sh`, `s09c_probe7.py` (decision records of 23 and 30 October); RFL `:51-56` | `at` is `2026-10-30T10:12:00+05:30` (the minute's start, ISO, `+05:30`); `bar_index` 20 on the first record of each day; `provenance.market.cursor.kind` `confirmed_bar_index`; `timeframe` `1m` | Legacy walks confirmed one-minute tick bars (`ticks.bars`), numbered from the day's first bar; `ctx.at` is the bar's start minute in IST. The host's `BarContext.at` and trigger must be that instant. No difference from the plan, so the step continues |
| 3 | `s09c_probe8.py` (output kept in `~/claude-desktop/outputs/s09c/char3.txt`) | 23 Oct: 355 decisions; the stamp's minute holds a Greeks batch only **after** the stamp on all 355 (batch `09:35:00.000726`, stamp `09:35:00`); `priced_legs` 0 on all 355. 30 Oct: 318 decisions, the same on all 318. One chain poll per minute; each poll holds one expiry | Legacy's `greeks_at` left every leg of every scored bar unpriced on both days: the batch is fetched just after the minute's start, which is the stamp. The throttle had no visible effect, because nothing was priced. This is a legacy defect, recorded, not fixed: the port gives the scorer no Greeks, and the golden walks match legacy's no-Greeks scores (Fork call 21) |
| 4 | `s09c_probe3.sh` (`sha256sum` of the deployed file against `git show 445eb116:<path> \| sha256sum`) | `src/strategies/buyer_edge.py` `8e1d7b7f…09b5dc` both; `scripts/strategy_factories.py` `2c73be03…dc5e16` both. Live `HEAD` `c7f9e3df`; the decision records' `provenance.code.git.commit` `445eb116514d`, `dirty: false`. `effective_min_score_shadow` on all 318 records of 30 Oct: `schedule original, base 40, floor 40, applied false`; no record names `min_score_schedule` | The live process binds `extracted`, with no `min_score_schedule` |
| 5 | `s09c_probe1.sh`: `~/AutonomousTrading/.venv/bin/python -c "import sys,numpy,pandas;print(sys.version,numpy.__version__,pandas.__version__)"`; `s09c_probe10.sh` (`pip list`) | `3.13.5 (main, Aug 10 2026, 12:06:59) [GCC 14.2.0] 2.5.3 3.0.6`; `openalgo 2.0.5` | Pins: `numpy==2.5.3`, `pandas==3.0.6`, `openalgo==2.0.5`; `requires-python` unchanged; the golden walks are generated under 3.13.5 |

#### TASK-S09-11: the MCP Risk Guard's `daily_loss_limit`

The question is whether legacy's live strategy orders pass the Risk Guard, whose `daily_loss_limit` (₹5,000, `config/profiles/enforcing.yaml:104`) refuses when the day's P&L is below its floor or unavailable (`src/interfaces/mcp/core/riskguard.py:637-681`). Reading the code at 445eb116 suggests they do not: the strategy path submits through `ExecutionGateway.submit` (RFL `:3321`), which sends through `core.openalgo.execution_client` (`src/runtime/execution_gateway/__init__.py:1910`), and nothing on that path imports the Risk Guard. That is inference from the consumer, so it is measured at the source: on the live host, read-only, the client's endpoint and whether a strategy order of a recorded day reached the MCP process (its log or Risk Guard checks for that order's time). The record names the evidence. The read-only commands, run from `~/AutonomousTrading`:

1. The host key lines only, never the whole `.env`: `grep -E '^(HOST_SERVER|OPENALGO_HOST|OPENALGO_API_URL|AT_CONFIG_FILE|MCP_CONFIG_FILE)=' .env`.
2. Who listens on the execution port and the gateway ports, without process IDs: `ss -ltnpH | awk '{print $4, $6}' | grep -E ':(5000|8000|8001) '`.
3. The Risk Guard audit logs (`risk_guard.audit_log`: `run/riskguard.audit.jsonl` in `enforcing.yaml`, `run/risk-audit.jsonl` in `defaults.yaml`): their rows by `tool` and `allowed`, any order-classified tool, and the audit rows on each day that has strategy orders, set against those orders' `at` times in `run/orders/<day>.jsonl`. The scripts print no arguments.
4. The SHA-256 of the deployed `src/runtime/execution_gateway/__init__.py` and `src/interfaces/mcp/core/openalgo.py` against `git show 445eb116:<path> | sha256sum`.

**Evidence record** (2 November 2026, `s09c_probe3.sh` and `s09c_probe4.sh`, as in TASK-S09-08's records):

| Read | Output |
|---|---|
| Key lines | `OPENALGO_API_URL=http://127.0.0.1:5000`; `AT_CONFIG_FILE` and `MCP_CONFIG_FILE` both `config/profiles/readonly.yaml`; `HOST_SERVER` and `OPENALGO_HOST` not set |
| Listeners | `127.0.0.1:5000` (no process name visible to this user; the port `OPENALGO_API_URL` names); `127.0.0.1:8000` and `:8001` are `python`, the three running `src/interfaces/mcp/gateway.py` processes |
| Gateway profile | `readonly.yaml` extends `enforcing.yaml`, but mounts no order-capable domain (`control` and `openalgo` absent) and sets `risk_guard.orders_disabled: true` |
| Audit logs | `risk-audit.jsonl`: 26 rows, 4 Oct to 23 Oct, tools `analysis_pattern_health`, `analysis_trade_kpis`, `monitoring_pnl_curve` (7 each) and 5 owner-API rows (`POST /orders/reconcile` ×3 on 16 Oct, `POST /exposure/close` ×2 on 18 Oct). `riskguard.audit.jsonl`: 1 row (`analysis_warehouse_status`, 4 Oct). **No order-placing tool in either** |
| Strategy orders | 711 order records over 9 days (9, 14, 15, 16, 19, 21, 22, 23, 30 October), all during the session (for example, 30 Oct from 10:14:08 to 15:15:09 IST). The audit rows on those days fall at other times and are reads or owner-API calls |
| Hashes | `execution_gateway/__init__.py` `a1e60a53…149b92` and `openalgo.py` `f9aed7bb…6087b`: deployed equal the 445eb116 blob |

**TASK-S09-11 is closed: not carried (coordinator, 2 November 2026). Verdict: legacy's strategy orders do not pass the Risk Guard.** The execution client sends straight to OpenAlgo at `127.0.0.1:5000`, the Risk Guard has audited no order on any strategy-order day, and no module on the strategy path imports it (`src/runtime/` and RFL have no reference; the Tier-1 importer lists the Risk Guard's daily-loss check as outside Tier-1, `src/tier1/importer/sources.py:175-177`). Nothing is carried. The latch remains the only loss stop on the strategy path, as legacy.

*Also observed:* the deployed unit's drop-in `/etc/systemd/system/at-strategy.service.d/entry-limits.conf` sets `MCP_LIMITS__MAX_DAILY_LOSS_AMOUNT=4000`, among other `MCP_LIMITS__*` values, for the strategy process. This is consistent with Q-002: legacy merges limits field by field, so the live daily loss limit is `min(4000, 3600)` = ₹3,600 (traced earlier by the coordinator; not re-traced here).

* **If they pass it:** the check is carried unchanged into the kernel's admission as a PRF-PRT-05 row (the ₹5,000 value as bound, refusing when P&L is unavailable), specified as a step 3b before BuyerEdge is built, for the owner's review.
* **If they do not:** nothing is carried; the record says so, and the latch (₹3,600, Q-002) remains the only loss stop on the strategy path, as legacy.

#### The port (`strategies/buyer_edge.py`)

* **Copied unchanged:** the scorer module's code from `BE:1` through the end of `SignalEngine` and `BotConfig` (`BE:289-357`, `:1862-2045`, with every helper class they reach, `OIFlowAnalyzer` included), `ACTING` and `to_intent`, with `DEBUG_ENABLED` and `INFO_ENABLED` off (`BE:2451-2452`). Only imports change: `src._root` and the framework's `Intent` types are not imported. `to_intent`'s result becomes a `Signal` with the same kind, direction, conviction, reason, components and tags. `score` is the result's `float(result.score or 0)`, carried under `signal_score` (Fork call 7). The copied range is listed by line in the as-built record, with each file's SHA-256 against the legacy blob.
* **Dependencies.** The scorer needs numpy and pandas, which are not yet OA_NEW dependencies. `pyproject.toml` pins the live libraries with `==`, from characterization 5: `numpy==2.5.3`, `pandas==3.0.6`, and `openalgo==2.0.5`, the live SDK whose `ta.ema`, `ta.rsi` and `ta.vwap` the scorer calls (`BE:1304-1364`). `requires-python` stays `>=3.11` (coordinator, 2 November 2026). The golden walks were generated under Python 3.13.5, and the test compares floats as `repr(float(x))` (**proposed tree delta** `requirements.lock` if the coordinator wants a lock file).
* **The assembly** (`BuyerEdgeInputs`, in the same file) reads only the trigger's `View`. It reproduces `MV:759-799` and `inputs_at`'s fields exactly:
  * the exact-minute chain poll of the trigger minute (`View.chains(minute=trigger)`). `chains` returns the poll nearest expiry first; the assembly re-sorts its records by `seq`, which is legacy's file order (`store.py:1126-1133`), before it takes spot, flattens the rows and picks the ATM strike;
  * the spot frame, built exactly as `MV:963-993` from `View.spot_series`: keep the records with `instant(event_at) <= instant(ctx.at)` (the stamp, not the view's cutoff), stable-sorted by instant; skip a record whose `close` is `None` (`payload.get("close", payload.get("ltp"))`); `open`, `high` and `low` are `payload.get(<field>, close)`; `volume` is `payload.get("volume", 0) or 0`; the index is `pd.Timestamp(event_at)` in IST, converted only when its offset is not IST's; no rows is "no spot history at or before this minute";
  * no Greeks (Fork call 21). `greek_kwargs` (`MV:627-663`) is reproduced with every `greeks_at` answering none, as on every recorded live bar: the chain row's `ce_bid`, `ce_ask`, `pe_bid`, `pe_ask` and `sf_ltp` are passed, and `ce_delta`, `pe_delta` and `gex_levels` never are. When the view holds no Greeks record of the date, the kwargs are `{}` and the shadow says "no greeks recorded for this day" (`MV:633-634`, `:691-693`), as legacy's empty cache did. The Gamma shadow (`MV:686-724`) runs `profile_from_chain` (`src/analysis/options/gex.py`, copied unchanged) with no gamma.
  
  The same order of state updates: the previous assembled minute is set before the frame is checked; the chain history (a `deque` of five) is appended only after a full assembly. The same refusals and reasons are recorded in `tags["unscored"]`.
* **The clock.** `get_ist_now` is bound to the trigger's `ctx.at` for the one `engine.score` call and restored in `finally`, as `SC:129-143`.
* **State.** One engine and one assembly per host process and exchange date: `state` `in_memory`, `restoration` `reset_on_restart` (Fork call 10). The engine's OI z-score buffers, zone state, previous straddle and previous spot carry across bars. A restart starts empty, journalled as `STATE_RESET` with cause `host_restart` (step 2 as built). Legacy binds one engine to one `day` (`BE:2496-2504`, `:2422-2429`), so when a trigger's exchange date differs from the previous trigger's, the engine and the assembly are rebuilt before that bar, journalled as `STATE_RESET` with cause `session_change`.
* **Descriptor:** id `buyer_edge`, family `options_buyer`, `decision_method` `deterministic`, `warmup_bars` 20, underlying `NIFTY` (characterization 1: the unit's `--underlying`), `score_source` `signal_score`, `requested_authority` `none` (the file's declaration, `BE:2116`; the row's `trade` decides). The view policy is `market.views.buyer_edge`, bound by the release:
  * `chain` and `greeks` joined `exact_minute`, `spot` `at_or_before` (Fork call 6);
  * `stale` `report` with no bound on every stream (Fork call 5);
  * `bars`: confirmed one-minute tick bars, `ctx.at` the bar's start minute in IST (characterization 2).

### Tests

`tests/unit/test_buyer_edge_parity.py` (**T-52**). The golden expectations are generated once from legacy, as SLICE-08's gap parity; every other value is labelled synthetic and computed by hand.

| Group | Cases |
|---|---|
| Golden walks (PRF-STR-04) | `scripts/gen_buyer_edge_parity.py` (**T-54**), run once against a legacy checkout and never in the suite, writes `tests/fixtures/strategies/buyer_edge_golden.json` (**T-53**). Each case is a contiguous walk from a fresh engine: from the session's start, and from restart points mid-session. Walks cover seeded synthetic days and stretches of recorded days (provenance in `tests/fixtures/manifests.json`), and include gap minutes: no chain, no spot frame, an unusable chain, missing Greeks, a Greeks batch fetched just after the stamp (characterization 3), a chain without spot, and bars at the seal boundary. Two synthetic walks pin the chain order: one whose spot is exactly midway between two strikes, and one whose poll holds more than one expiry, with records stored in an order that differs from nearest-expiry-first (no recorded day has such a poll). For every bar the case records the raw store records legacy read, the bound clock, `score_kwargs`, the `SignalResult` and the `Intent`. **Seal-boundary bars** store two expectations: legacy's value, and the target's expected value. They may differ only in the fields that come from `ctx.close` (the spot fallback and its ATM strike and straddle, `MV:766-773`) and in the "no close on this bar" NOTHING; every other field is equal. The generator runs under characterization 5's Python 3.13.5, numpy and pandas, and checks that legacy priced no Greeks on any bar (Fork call 21). The test replays each walk in order through one fresh target engine and assembly over a market store holding the same records, and compares every bar field by field, floats as `repr(float(x))` |
| Mapping | Hand-written `SignalResult` stubs: `EXECUTE` with `CE`; with no direction; `WAIT`; a `None` result; an unavailable component; both shadows; each gives the `Signal` legacy's `to_intent` gives, field by field |
| Clock | The engine's clock reads the trigger during `score` and the original after, also when `score` raises |
| State | Two bars through one host: the second sees the first's buffers. A restart starts empty and journals `STATE_RESET` (`host_restart`). A two-session walk through one host: the first bar of the second exchange date sees a fresh engine and assembly, equal to a fresh walk of that date, and journals `STATE_RESET` with cause `session_change` |
| Host | BuyerEdge through step 2's host and `ScriptedKernel` on a recorded stretch: the published intents equal the golden walk's, mapped to `Intent` by step 2's rule |

Break checks are chosen when the step is built. They include at least: the chain history appended before the frame succeeds; the previous minute not set when the frame fails; an unbound clock; a fresh engine per bar; the floor or coverage gate changed; a shadow applied; chain rows left nearest expiry first; the frame cut at the view's cutoff instead of `ctx.at`; no rebuild when the exchange date changes.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/strategies/buyer_edge.py` | New: the scorer copied unchanged, the assembly, the mapping, `DESCRIPTOR`, `create` |
| `pyproject.toml` | numpy, pandas and the OpenAlgo SDK pinned `==` to characterization 5 and the live venv |
| `scripts/gen_buyer_edge_parity.py` | New (T-54): the one-off generator |
| `tests/fixtures/strategies/buyer_edge_golden.json` | New (T-53) |
| `tests/fixtures/manifests.json` | The characterization records and the walks' provenance |
| `tests/unit/test_buyer_edge_parity.py` | New (T-52) |

### Completion conditions (step 3)

* TASK-S09-08's five records and TASK-S09-11's record exist with their evidence before `buyer_edge.py` is written; a carried Risk Guard check is specified and reviewed first.
* Every golden walk passes bar by bar; the copied scorer's lines match legacy's blob, as recorded.
* The step's tests and the existing tests that exercise the changed files pass; the break checks each fail a test, and every file is restored (md5).

### Step 3 as built

**In plain words.** BuyerEdge now runs in the new system, copied line for line from the old one. Replayed over the same market data, it gives the old system's answer on every bar, including 40 bars of a real session where the old system's own records show the same decisions.

Commit `412baa6` on `slice-08`, on top of `e6cfb28`. It changes 8 files (3,587 lines added). Not pushed.

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Copied lines | `src/autonomous_trading/strategies/buyer_edge.py` holds legacy's `BE:13-30`, `BE:80-2045` and `BE:2130-2322` byte for byte (SHA-256 of those ranges `56a7710b…f10b6ba`; legacy blob `8e1d7b7f…09b5dc`, equal to the deployed file). `BE:31-77`, the `_load_ta` shim, becomes `from openalgo import ta`. `MV:78-99`, `:147-174`, `:805-891` and `src/analysis/options/gex.py:16-128` are copied unchanged. `Intent` is bound to an adapter that returns the host's `Signal`, so `to_intent` itself is unchanged |
| The OpenAlgo SDK | The scorer calls `ta.ema`, `ta.rsi` and `ta.vwap` (`BE:1304-1364`), so `openalgo==2.0.5` (the live venv's) is a pinned dependency beside `numpy==2.5.3` and `pandas==3.0.6`. The strategy host imports the SDK's indicators only; it holds no client or key |
| Chain payload | SLICE-08 stores one chain record per poll and expiry, its rows under `response`; legacy stored one record per row. The assembly reads the poll's records in `seq` order and each record's rows in order, which is legacy's file order |
| No Greeks | `greek_kwargs` keeps the chain row's quotes (`ce_bid`, `ce_ask`, `pe_bid`, `pe_ask`, `sf_ltp`) and never passes `ce_delta`, `pe_delta` or `gex_levels`; with no Greeks record of the date it is `{}`, as legacy's empty cache (Fork call 21) |
| Spot | On every recorded bar the chain rows carry no `spot`, so legacy scored with `ctx.close` as spot (`MV:766-773`); the port does the same |
| Session change | `StrategyHost._strategy_object` rebuilds a `reset_on_restart` object when the trigger's exchange date changes and journals `STATE_RESET` with cause `session_change` (`worker.py`, a step 2 file) |
| `tags["unscored"]` | An unassembled bar's NOTHING carries legacy's refusal text there; every other tag is legacy's |
| Golden walks | Two recorded stretches (30 October from the first scored bar, 40 bars: 40 of 40 equal the live decision records; 23 October from a fresh engine at bar 130, 30 bars: 26 of 30 equal, the first four differing because the engine starts empty) and three synthetic days. 3.2 MB. Of the Greeks only the first walked minute's batch is kept, since the port reads only whether one exists |
| Platform | The golden walks were generated on Linux under Python 3.13.5; the test passed on Windows under Python 3.14.0 with the same numpy, pandas and openalgo, every float equal as `repr(float(x))` |
| Existing test changed | `tests/unit/test_strategy_registry.py`: one assertion, because the production package now registers BuyerEdge (no row, so never runnable) |
| `tests/fixtures/manifests.json` | Did not exist; created with the golden walks' provenance and the characterization summary |

**Tests:** `tests/unit/test_buyer_edge_parity.py` (17 cases). A targeted run passed 208 cases (1 skipped): this file, `test_strategy_invocation.py`, `test_strategy_registry.py`, `tests/recovery/test_crash_boundaries.py`, `tests/contracts/test_capabilities.py`, `test_secret_references.py` and `test_canvas_causality.py`. The full suite was not run. `ast.parse` passes on every edited Python file and `json.loads` on both fixtures.

**Break checks** (`s09c_breaks.py`): all 16 failed a listed test, and every file was restored (md5).

| Break | Caught by |
|---|---|
| The chain history appended before the frame succeeds | Synthetic walks; previous-minute test; host test |
| The previous minute not set when the frame fails | Synthetic walks; previous-minute test; host test |
| An unbound clock | Every walk; clock test; host test |
| A fresh engine per bar | Every walk; state test; clock test; host test |
| The floor changed (40 to 41) | Every walk; floor-shadow test; host test |
| The coverage gate changed (0.70 to 0.71) | Every walk; host test |
| The floor shadow applied | Every walk |
| The Gamma shadow applied as `gex_levels` | Every walk; host test |
| A Greek priced (Fork call 21 broken) | Every walk |
| Chain rows left nearest expiry first | Multi-expiry walk; chain-order test |
| The frame cut at the view's cutoff, not `ctx.at` | Every walk; host test |
| The frame's high always the close | Recorded walks; host test |
| The frame's volume without `or 0` | Spot-frame test |
| A zero close taken as no close | Gaps walk |
| No rebuild when the exchange date changes | Host test |
| The session change journalled as a restart | Host test |

**Open:** the module index's tree delta for `tests/fixtures/manifests.json` and the `openalgo` dependency (the coordinator's).

## Step 4 — blueprints and assembly

<a id="step-4--blueprints-and-assembly-outline"></a>The authorities are the spec's [Blueprints and typed assembly](../../design/strategies-and-cognition.md#blueprints-and-typed-assembly-cognitionblueprintpy-cognitionruntimepy) and [Role-scoped tools](../../design/strategies-and-cognition.md#role-scoped-tools-cognitiontoolspy) sections, A05-F4 (`README.md:851`), the budgets of `README.md:849`, and legacy's AI management at 445eb116. Step 4 is TASK-S09-04 (PRF-STR-05). It builds `cognition/blueprint.py`, `cognition/runtime.py`, `cognition/tools.py`, the `cognition` package's `__init__.py`, one composition function in `bootstrap.py` and one refusing setting row (`settings/schema.py`, `settings/loader.py`), on step 3 as built (OA_NEW `412baa6` on `slice-08`). It depends on nothing in steps 1–3 and may be built beside step 5 by a second agent owning `cognition/*` only. It stops at a typed team result: recording it is step 5's, turning it into a `Review` and submitting it is step 6's. Every legacy citation is at 445eb116; `BP` is `src/runtime/ai_management/blueprint.py`, `TM` `src/runtime/ai_management/team.py`, `SV` `src/runtime/ai_management/service.py`, `AT` `src/runtime/agent_team/__init__.py`, `CH` `src/runtime/agent_team/child.py`. **The fork rule applies to the whole step:** what a role may do, every limit and budget, every deadline and every fail-open answer are legacy's. No score, threshold or money value is set, no setting gains a value, and nothing here can stop an entry: every failure ends in `unavailable`, which the kernel applies as `proceed_unavailable` (SLICE-04, as built).

**In plain words.** This step rebuilds the AI review team without its model calls. First, the team's description (who the roles are, who leads, what order they run in, how long each may take, how much memory and output each may use) is checked with today's rules and today's limits, and anything outside them is refused with today's message. Then the program that runs a team starts each role as a separate small program with no broker key and today's memory and time limits, stops it at its deadline, and reads back what it said. Each role's answer is now labelled precisely: it contributed, abstained, was unavailable, gave an unreadable answer, ran out of time, or was cancelled. Today all but the first were called "failed". What the team then does with those answers does not change: if a required role did not contribute, or time ran out, the review is "unavailable", exactly as today, and the kernel lets the entry go on with an alert, exactly as today. Nothing here can block a trade.

### Decisions

#### What legacy does here

* **The blueprint** (`BP:347-533`) is a frozen value checked when built: 1 to 17 roles, one lead that is required and alone in a final `synthesis` stage, stages without cycles, every role in a stage, role edges without cycles or self-edges and every specialist reaching the lead, a result schema equal to the lead's output schema, and the runtime ceilings `MAX_TASKS` 16, `MAX_CONCURRENCY` 4, 120 s per role, 300 s per team, 128–1024 MB, 1–60 CPU seconds, 262,144 output bytes, 16 rounds (`BP:118-129`). Role defaults: deadline 30.0 s, 512 MB, 10 CPU s, 262,144 bytes (`BP:238-242`). Role backends are `rule` and `http` only (`BP:33`); a role's input scopes must be registered (`BP:138-153`, `:252-258`).
* **Profiles** (`TM:156-292`, `:390-441`): each role's `profile_ref` resolves to an advisor configuration and an instruction, checked against the team task's allow-list (`AT:83-104`), with `max_tokens` pinned (`TM:237-251`; default 300, `src/runtime/advisor/backends/http.py:412`; bound 1–4096, `AT:103-104`), and digested per role (`TM:429-441`). **Any role whose profile cannot be resolved makes the review unavailable with `required_role_failed`, optional roles included** (`TM:580-581`, raised before the run and mapped by `SV:374-382`).
* **The run.** The checks come in this order. Before the run, the service asks the team for its expected identity (`SV:326`): an unresolvable profile raises first (`TM:580-581`), then building the executor raises on an expanded plan over the task limit (`TM:765-771`), a role over the team's resources (`:792-795`) or an input scope with no context (`:716-718`, `:745`) (`TM:585`); `SV:374-382` maps the first to `required_role_failed` and the others to `service_contract_error`. Then `run` (`TM:1304-1523`): a run already claimed answers `capacity_denied` (`TM:1335-1343`); a deadline already past `deadline_expired` (`TM:1376-1395`); no global or per-strategy slot `capacity_denied` (`TM:1397-1424`). Slots are each `MAX_MANAGEMENT_CONCURRENCY` 4 when `ai_management.resources` is `null` (`src/runtime/ai_management/config.py:56`, `TM:646-650`), and a claim is a durable record in the management store, valid until the deadline plus the longest role deadline, so a crashed process's claims still count until they expire (`TM:652-697`). Then the team runs and its consequences are applied in order: past the deadline `deadline_expired`, a required role not completed `required_role_failed`, a lead output that fails the result check `failed_lead` (`TM:1433-1473`). Any exception inside `run` answers `team_unavailable` at once (`TM:1492-1502`; `SV:374-382` keeps it, the run having started).
* **Supervision** (`AT:233-887`): at most four children per shared root (`POOL_SIZE`, `AT:24`, `:321-329`) and `concurrency` per stage; each child gets a fresh minimal environment, the role's credential and the broker key withheld (`AT:176-190`), its own process group (`AT:824-830`), parent-death kill and rlimits (`CH:17-25`). A task that finds no free slot stays pending and is tried again at the next poll, until the team deadline times it out (`AT:783-797`). A task's deadline is `min(team deadline, start + min(team seconds, role seconds))` (`AT:816-818`); a live child past it is killed and marked `timeout`; an exited child's receipt is read whatever the time (`AT:845-870`). A stage that starts after the team deadline times out its tasks; a stage after a failed required role marks its tasks failed (`AT:617-632`). The lead runs only when every required task completed (`AT:403-416`). When the same team is run again after a coordinator restart (`AT:394-402`), each task left running has its child killed (`AT:652`); if its receipt exists the receipt is read and kept (`AT:653-662`), otherwise the task is `interrupted` and never retried (`AT:663-666`); the pending tasks then run within the original deadline.
* **A role's answer.** The child consults the advisor; a status other than `advice` or `abstained`, an abstention, an unparsable reply and a reply that fails the role schema are all `failed`, the reply's status kept only as a detail (`CH:40-58`; `AT:709-728`). The statuses are `advice`, `abstained`, `invalid_output`, `timeout`, `provider_error`, `backend_error`, `not_configured`, `budget_exhausted`, `held` (`src/runtime/advisor/__init__.py:313-314`).
* **Role outputs** are closed objects per schema (`BP:47-114`): an entry review is `action` (`ALLOW`, `BLOCK` or `PAUSE`; never `AI_UNAVAILABLE`), `reason_code`, `explanation`, and `requested_pause_minutes` exactly when `PAUSE`.
* **The committee** advisor accepts exactly `ce_case` and `pe_case`: "risk is deferred" (`src/runtime/advisor/backends/committee.py:24-26`, `:192-193`). It is an advisor backend, not a team role backend (`BP:33`).
* **Context.** Roles receive their declared scopes as supplied context and make no tool calls (`AT:79`); an absent market field is its empty value (`src/runtime/advisor/__init__.py:116-145`). Live, the review's context holds the spot reading (freshness bound 15 s, `src/runtime/providers/shipped.py:67`) and the management sources at 300 s (RFL `:4481`, `:4486`, `:4496`, `:4500-4510`); a source that is not fresh makes the review `context_unavailable` (`SV:254-269`; freshness rule `src/runtime/ai_management/context.py:444-446`, `:567-573`).

#### Characterization (read-only, 2 November 2026)

What the live legacy binds for AI management, read before any code. `C:\Windows\System32\OpenSSH\ssh.exe debian-oa`; the probe `~/claude-desktop/scripts/s09d_probe1.py` ran under the live venv (`-I -B`, `nice -n 19`) with the strategy unit's `AT_CONFIG_FILE` (`config/profiles/readonly.yaml`, from `.env`'s named key only) over a `cp -rp` copy of `run/configs` in `~/claude-desktop/outputs/s09d/`; its output is kept there as `probe1.txt`. It printed named non-secret fields only. No order was sent, nothing was restarted, and nothing in `~/AutonomousTrading` was written.

| Read | Output | Reading |
|---|---|---|
| Configuration layers and `ai_management` | defaults, `enforcing.yaml`, `readonly.yaml`, `owner.yaml`; `mode` `observe`; `resources` `{"global_concurrency": null, "per_strategy_concurrency": null}` | No layer overrides the shipped `null`: both slots are 4 (`config.py:56`) |
| Management profiles (`run/configs/profiles/`) | Strategy profiles only (`ai_ema_cross`, `buyer_edge`, `candidate_worker`); no `__ai_management__<sha256>` profile | No management configuration is active |
| `active_config` for `buyer_edge`, `ai_ema_cross`, `ema_cross_spot`, `ema_crossover` | `mode` `observe`, version `None`, `blueprint` none, `exit_blueprint` none | **Legacy runs no review team live.** With no blueprint the team is `None`, so every review answers `unavailable` (`required_role_failed`) at once (`SV:270-274`; RFL `:4518`) under `observe` |

No live blueprint exists, so none has memory bindings or a `design_proposal` role, and the step continues. The first release therefore binds no blueprint; the runtime is built and proved on synthetic blueprints, and a blueprint bound later is validated by these rules.

#### Blueprints (`cognition/blueprint.py`)

* **Copied unchanged**, with legacy's messages: `STAGE_KINDS`, `ROLE_BACKENDS`, `MANAGEMENT_CONTEXT_PROJECTIONS`, `ROLE_OUTPUT_FIELDS`, the ceilings (`BP:118-129`), `RoleSpec`, `StageSpec`, `TeamBlueprint` with their `from_dict` and every check (`BP:156-533`), `validate_blueprint`, `validate_edge_schedule` (`BP:536-565`), `validate_role_output` for `entry_review` and `exit_advice` (`BP:57-101`), and the `_text`, `_finite`, `_integer`, `_boolean`, `_string_tuple`, `_object` helpers they call. Legacy's `ContractError` becomes `BlueprintRefused`, a `ValueError` whose message is legacy's text exactly.
* **Changed, each a Deviation unless marked:**
  * `OUTPUT_SCHEMAS` is `entry_review` and `exit_advice`; `design_proposal` (the improvement designer) is refused as unregistered, legacy's text (`BP:261-262`); it returns with SLICE-12.
  * The input scopes are `tools.INPUT_SCOPES` (below), a fixed set equal to legacy's registry at 445eb116, instead of the live provider registry (`BP:138-153`).
  * `memory_bindings` must be empty: a non-empty list is refused with the message `"memory bindings are not built (SLICE-12)"`. Memory is SLICE-12 (Excluded).
  * **The tool-call budget** (`README.md:849`; the spec). `RoleSpec` gains three optional keys, checked after legacy's: `callable_tools` (a list of distinct names, default empty), `tool_call_budget` (an int of at least 1, no default) and `tool_result_bytes` (an int of 1…262,144, no default). With `callable_tools` non-empty, a missing `tool_call_budget` refuses `"role {name!r} grants callable tools without a tool_call_budget"`, then a missing `tool_result_bytes` refuses `"role {name!r} grants callable tools without a tool_result_bytes bound"`, then a name outside `CALLABLE_TOOLS` refuses `"role {name!r} names an unknown callable tool"`. Either budget key with `callable_tools` empty refuses `"role {name!r} sets a tool budget without callable tools"`. `CALLABLE_TOOLS` is empty in this slice, so the first release's budget is 0, as legacy's roles called nothing (**Fork call**).
* **`as_dict()`** is every field in declaration order, tuples as lists, nested specs as their own `as_dict()`, edges as two-item lists; a role's three tool keys appear only when `callable_tools` is non-empty, so a legacy-shaped blueprint has legacy's shape. **`digest(blueprint)`** is the SHA-256 hex of `canonical_json(blueprint.as_dict())` (`contracts/identity.py`): 64 lower-case hex digits, the form `BoundPolicy.blueprint_digest` holds (`contracts/decisions.py`). Legacy's `sha256:`-prefixed `canonical_digest` (`BP:494-496`) is not reproduced (Deviation).
* **Profiles and pins.** `pin_role(role, raw) -> RolePin`, frozen `RolePin(role, backend, profile_ref, instruction_version, config, instruction, max_tokens, failure, profile_digest)`. It reads `raw` as legacy's `_profile` (`TM:390-406`): a mapping whose optional `backend` equals the role's, its `config` under `"config"` or as the mapping less `backend` and `instruction`, an `instruction` string; then legacy's task checks on the configuration (`AT:83-104`) and on the instruction (at most 4,096 characters, `AT:152-153`). For `http`, `max_tokens` absent is pinned as 300 and must be an int of 1…4,096 (**Fork call**: the token budget); `rule` has none (`None`). Any failure gives a pin with `config` `{}`, `instruction` `"Profile resolution failed."` and `failure` `"profile_resolution_failed:<reason>"`, as `TM:415-426`, never raised. `profile_digest` is the SHA-256 hex of `canonical_json({"backend", "profile_ref", "instruction_version", "instruction_digest": <SHA-256 hex of canonical_json(instruction)>, "config", "resolution_failure": failure})` (`TM:429-441`). **Deviation:** legacy pinned the adapter-resolved configuration and prompt (`TM:199-257`); here the pin is the bound profile plus `max_tokens`, and step 5's backend applies its own defaults and refuses a prompt that differs from the pinned `prompt_version` and `prompt_digest`.
* **`lineage_digests(pins) -> tuple`** is `tuple(sorted((f"profile_{pin.role}", pin.profile_digest) for pin in pins))`: the session-stable part of legacy's lineage (`TM:972-980`, compared per role at `SV:357-363`, `:390-400`). The per-run parts (the run, each artifact) belong to step 5's run record (Deviation). The session binding records this tuple and the blueprint digest; the kernel already judges a review with others `lineage_mismatch` (`kernel/policy.py`, as built).
* **The committee (Fork call).** `COMMITTEE_ROLES = ("ce_case", "pe_case")` and `committee_members(names, risk_critic)`: with `risk_critic` `"deferred"`, a list that is not exactly those two names, each once, refuses `BlueprintRefused("committee roles must be exactly ce_case and pe_case; risk is deferred")` (`committee.py:192-193`); any other `risk_critic` value raises `ValueError` (POL-035 open). The committee is not a role backend (`ROLE_BACKENDS`), and SLICE-09 builds no committee backend (the spec's backends are `rule`, `http`, `chain`, `replay`), so this check has no caller yet; the coordinator may raise that as an X item.
* **The setting.** `Settings` gains `committee_risk_critic: str | None = None` (`settings/schema.py`), and `settings/loader.py` a tuple `_COGNITION = (("committee_risk_critic", "cognition", "committee_risk_critic", "AT_COGNITION_COMMITTEE_RISK_CRITIC", ("deferred",)),)`, read by the same loop as `_ADMISSION`, `_MARKET` and `_SECURITY` (`loader.py:47`), so any other bound value is a `SettingsError` at load. **Reading of the spec:** the loader reads one level under a section, so the spec's `cognition.committee.risk_critic` is bound as `cognition.committee_risk_critic`. No value is shipped. `bootstrap.compose_cognition_runtime(settings, *, work_root, clock, sleep, child_command=None)` raises `RefusingParameterUnbound("cognition.committee.risk_critic")` when it is `None`, then builds the runtime.

#### Role-scoped tools (`cognition/tools.py`)

* **Scopes.** `MARKET_FIELDS = ("bars", "spot", "chain", "expiry", "chain_at", "greeks_legs", "features")` with legacy's empty values `[]`, `None`, `[]`, `""`, `""`, `0`, `{}` (`src/runtime/advisor/__init__.py:116-145`); `PROVIDER_SCOPES = ("greeks", "regime", "outcomes")`; `MANAGEMENT_SCOPES = ("positions", "pending_orders", "framework_risk", "account")` (`BP:34-40`). `INPUT_SCOPES` is their union, the 14 names legacy's registry held.
* **`ToolResult(scope, value, source, observed_at, freshness_secs, view_id, partition)`**, frozen: `value` JSON data; `source` the reader's name; `observed_at` the stored UTC form; `freshness_secs` a finite float of at least 0; a market scope carries its view's `view_id` and `partition` = the underlying, a management scope `view_id` `None` and `partition` = the session ID. Tools read only; nothing in `tools.py` writes, submits, reads a credential or reaches locked evidence.
* **`freshness(observed_at, cutoff, bound) -> "fresh" | "stale" | "future"`**: `future` when `observed_at > cutoff`; else `stale` when `cutoff − observed_at > bound` seconds; else `fresh`, so an age equal to the bound is fresh (`context.py:444-446`, `:567-573`). `MANAGEMENT_FRESHNESS_SECS = 300.0` and `SPOT_FRESHNESS_SECS = 15.0` are legacy's (RFL `:4481`, `:4486`, `:4496`; `shipped.py:67`) (**Fork call**). `unavailable_sources(results, cutoff) -> tuple[str, ...]` names, in input order, every result not `fresh`.
* **`role_inputs(role, results) -> dict`**: for each scope the role declares, in its declared order, `{"value", "source", "view_id", "observed_at", "partition"}` from the result of that scope; a market field with no result gets its empty value and the other four keys `None`; a provider scope with no result is omitted; a management scope with no result raises `ScopeUnavailable(scope)` (legacy `TM:716-718`). Nothing outside the declared scopes enters the role's packet.
* **What step 6 does with these (hand-off):** it reads the sources (the spot from the trigger's pinned `View`, the management sources from the kernel's read models through SLICE-10's projection registry and `disclose` to `model:<provider>`), answers `context_unavailable` when `unavailable_sources` is non-empty (`SV:261-269`), as legacy's live context did (RFL `:4491-4510`). No Canvas scope is offered: legacy's roles never saw one (**Fork call**, against the spec's "Canvas facts"; listed below, not made), so `tools.py` imports nothing from Canvas and SLICE-08's import guard is unchanged.

#### The runtime (`cognition/runtime.py`)

* **`CognitiveAgentRuntime(work_root, *, clock, sleep, child_command=None, pool_size=POOL_SIZE)`**: `POOL_SIZE = 4` (`AT:24`); `MAX_MANAGEMENT_CONCURRENCY = 4` global and per strategy (**Fork call**, `config.py:56`, `TM:646-650`; no setting is added: every live layer leaves it `null`, which resolves to 4, per the characterization). Slots are held in memory and released when `run` returns; a restart starts with all free (Deviation: legacy's claims were durable and outlived a crash until they expired, `TM:652-697`). `child_command` defaults to `[sys.executable, "-I", "-m", "autonomous_trading.cognition.runtime"]`; tests pass their scripted child. `clock()` is epoch seconds; `sleep` the poll's wait, `POLL_SECS = 0.01` (`AT:874-875`). It holds no kernel port and no store: it returns results.
* **`run(blueprint, pins, request) -> TeamResult`**, with `TeamRequest(run_id, purpose, strategy, payload, identity, results, deadline)`: `run_id` 64 hex (step 5's), `purpose` `entry_review` or `exit_advice` (equal to `blueprint.result_schema`, else `ValueError`), `payload` the request's JSON (the intent's wire form for a review), `identity` `{strategy, underlying, session_id, as_of}`, `results` the `ToolResult`s, `deadline` the caller's epoch deadline. It never raises for a team failure; every path below returns a `TeamResult`. In order:
  1. `started_at = clock()`; `deadline = min(started_at + blueprint.deadline_seconds, request.deadline)` (`TM:603-610`). If `deadline <= started_at`: unavailable `deadline_expired`, no child (`TM:1376-1395`).
  2. Any pin with a `failure`: unavailable `required_role_failed`, no child (`TM:580-581`; **Fork call**, optional roles included).
  3. The expanded plan (below) over `task_limit`, a role over the team's memory, CPU or output bound (`TM:765-771`, `:792-795`), or a `ScopeUnavailable` for any role or the lead: unavailable `service_contract_error`, no child (**Fork call**, the cause `SV:146-150` gives legacy's `ContractError`).
  4. `work_root/<run_id>` exists already, or a global or per-strategy slot cannot be taken at once: unavailable `capacity_denied`, no child, never a wait (`TM:1335-1343`, `:1397-1424`).
  5. The team runs (supervision below); then `assemble` (below) gives the result.

  Steps 3–5 run inside `try … except Exception … finally`: any exception (an unwritable `work_root`, a failed packet write, an error in supervision) returns unavailable `team_unavailable` at once, after killing any child still running (**Fork call**, `TM:1492-1502`, `SV:374-382`); the `finally` releases every slot taken in step 4. **Deviation (the order):** legacy checks the profiles and the plan before the run, then a claimed run, then the deadline, then the slots (above); here the deadline comes first. Every path ends `unavailable` either way; only the recorded cause of a run failing two checks differs.
* **The expanded plan** (`TM:752-839`, `AT:264-319`): non-synthesis stages in blueprint order; a `turns` stage with `round_limit` r runs its roles r times in turn; a task's name is the role's name when the role appears in one stage, else `role[:54] + "_" + sha256_hex(canonical_json([role, stage]))[:8]`, and in a multi-round stage `name[:59] + "_r" + f"{round:02}"`. Stages run in dependency order, each stage's parallelism `min(concurrency, its task count)` for `parallel` and 1 for `turns`. The lead is the last task, named `lead_role`. `task_id = sha256_hex(canonical_json([run_id, task_name]))`.
* **Deadlines (Fork call).** `task_deadline(run_deadline, started, blueprint_secs, role_secs) = min(run_deadline, started + min(blueprint_secs, role_secs))` (`AT:816-818`). At each poll, in this order (`AT:783-875`): a stage not started when `clock() >= deadline` has every task `timeout` (`team_deadline`) (`AT:617-623`); a stage not started after a required task of an earlier stage ended without contributing has every task `cancelled` (`required_prerequisite_failed`) (`AT:624-632`); a running child with `clock() >= its task deadline` is killed and its task is `timeout` (`task_deadline`); an exited child's receipts are read (below). A task that finds none of the pool's four slots free stays pending and is tried again at the next poll; if the team deadline comes first it is `timeout` (`team_deadline`) (**Fork call**, `AT:783-797`). The lead starts only when every required non-lead task contributed, else it is `cancelled` (`required_prerequisite_failed`) (`AT:403-416`). Nothing is retried, re-run or given extra time.
* **The child.** One `subprocess.Popen(child_command + [packet_path], env=role_environment(delegated), stdin/stdout/stderr DEVNULL, cwd=work_root/<run_id>)`, POSIX with `start_new_session=True` (`AT:824-830`), Windows with `CREATE_NEW_PROCESS_GROUP`; no `preexec_fn`. A kill is `os.killpg(pid, SIGKILL)` on POSIX and `Popen.kill()` on Windows, then `wait()`.
* **`apply_child_limits(packet) -> str`** (**Fork call**, `CH:17-25`, legacy's order) is every child's first action, before it imports a backend or reads anything else; the production child and the tests' scripted child both call it. On Linux: `prctl(PR_SET_PDEATHSIG, SIGKILL)` through `ctypes`, raising `RuntimeError("parent-death signal unavailable")` if it fails; then, if `os.getppid() != packet["parent_pid"]`, the child exits 1 at once; then `RLIMIT_AS` = `memory_mb` MiB, `RLIMIT_CPU` = `cpu_seconds`, `RLIMIT_FSIZE` 262,144, `RLIMIT_NOFILE` 64, each soft and hard; it returns `"posix"`. Elsewhere it sets nothing and returns `"unenforced"`. The result is the receipt's `limits` field and the `TeamResult`'s.
* **`role_environment(delegated) -> dict`** (`AT:176-190`; **Fork call**): `PATH` `os.defpath`, `LANG` `C.UTF-8`, `PYTHONUNBUFFERED` `1`, `OPENBLAS_NUM_THREADS` `1`, `OMP_NUM_THREADS` `1`, then `delegated` (the role's provider credential, from step 5; empty for `rule`), then every name whose `settings.secrets.env_path` is `BROKER_KEY_PATH` removed and `BROKER_KEY_MASK` set to `""`, as `settings/secrets.py` `child_environment` does. On Windows `SYSTEMROOT` is copied from the parent, which Python needs to start there (Deviation); legacy's `AT_CONFIG_FILE` is not passed, since the child loads no settings (Deviation).
* **The packet** (written atomically, mode 0600 on POSIX, as `AT:40-56`): `{"parent_pid", "run_id", "task_id", "task", "role", "backend", "profile": {"config", "instruction"}, "output_schema", "request": payload, "identity", "inputs": role_inputs(role, results), "team": [...], "memory_mb", "cpu_seconds", "output_bytes"}`. `team` holds, for each role with an edge into this one (the lead: its incoming edges), each of its tasks that has ended: `{"role", "outcome", "output"}` (`AT:568-603`).
* **The receipt.** The child writes `<task>.result.<k>.json`, k from 1, each `{"run_id", "task_id", "status", "reason", "failure", "detail", "limits"}`: `status` one of legacy's nine statuses or `null`, `reason` the model's reply text, `failure` an exception's type name or `""`, `detail` `{"provider_status", "provider_error_code"}` as `AT:713-727`. The production child (`python -I -m autonomous_trading.cognition.runtime <packet>`) calls `apply_child_limits(packet)`, then `autonomous_trading.cognition.providers.consult(packet)` (step 5) and writes one receipt; an exception writes `status` `null` and `failure` its type name (`CH:59-61`). Until step 5 exists that import fails and every production role is `unavailable` (`backend_error`); no step 4 test uses the production child.
* **Reading receipts** (the parent; legacy read them in both, `CH:44-58`, `AT:734-753`). When a child has exited, its receipts are read in k order. The first one decides the task; each later one is counted in `duplicates` and ignored (Deviation: legacy's single receipt file was replaced by a second write, `AT:45-51`; its child writes once, `CH:62-63`). After a kill at the task deadline, any receipt found is recorded `late: true` and excluded: the task stays `timeout` (legacy never read a killed child's receipt; Deviation: it is now recorded).
* **Typed outcomes** (A05-F4; slice Deviation 10). The first receipt, or its absence, gives the task's `RoleOutcome(role, task, required, outcome, cause, output, output_digest, started_at, ended_at, late, duplicates, detail)`:

  | Found | `outcome` | `cause` |
  |---|---|---|
  | `status` `advice`; `json.loads(reason)` passes `validate_role_output(output_schema, …)` | `contribution` | `None` |
  | `status` `abstained` | `abstention` | `abstained` |
  | `status` `provider_error`, `backend_error`, `not_configured`, `budget_exhausted` or `held` | `unavailable` | the status |
  | `status` `timeout` | `timeout` | `provider_timeout` |
  | `status` `invalid_output` | `invalid` | `invalid_output` |
  | `status` `advice`; `reason` not JSON, or it fails the role schema (an `AI_UNAVAILABLE` action included, `BP:67-68`) | `invalid` | `invalid_typed_output` |
  | `status` `null` with a `failure` | `unavailable` | `backend_error` |
  | A receipt that is not JSON, not an object, larger than `min(262144, output_bytes)` bytes, or whose `run_id` or `task_id` differs, or any other `status` | `invalid` | `invalid_receipt` |
  | The child exited without a receipt | `unavailable` | `child_exit` (`detail.exit_code`) |
  | `Popen` raised | `unavailable` | `child_launch_failed` |
  | Killed at its task deadline | `timeout` | `task_deadline` |
  | Not started: the team deadline passed | `timeout` | `team_deadline` |
  | Not started: a required earlier task did not contribute | `cancelled` | `required_prerequisite_failed` |
  | Running when an earlier runtime stopped (the sweep) | `cancelled` | `coordinator_restart` |

  `output` is the validated payload and `output_digest` the SHA-256 hex of `canonical_json({"schema": output_schema, "payload": output})`, for a contribution only. Every outcome but `contribution` is a non-contribution, whatever its kind: the consequences below do not read the kind (**Fork call**, `TM:916-925`).
* **`assemble(blueprint, outcomes, *, run_id, started_at, completed_at, deadline, lineage_digests, limits) -> TeamResult`**, a pure function (the four identity arguments are copied into the result unread), so completion order cannot change it (outcomes are sorted by the expanded plan's task order before anything is read). In order, the first that applies (**Fork call**, `TM:1433-1473`):
  1. `completed_at > deadline` (strictly): unavailable `deadline_expired`;
  2. any task of a required role, or the lead, not `contribution`: unavailable `required_role_failed`;
  3. the lead's payload fails, independently of the child's narrative, `validate_role_output(blueprint.result_schema, payload)` or, for `entry_review`, legacy's exact field set and `PAUSE` rule (`TM:1016-1032`): unavailable `failed_lead`;
  4. otherwise `outcome` `"result"`, `payload` the lead's.
  `TeamResult(run_id, outcome, cause, payload, roles, completed_required, unavailable_optional, started_at, completed_at, deadline, blueprint_digest, lineage_digests, limits)`: `roles` every task in plan order; `completed_required` the required roles whose tasks all contributed and `unavailable_optional` the optional roles with a task that did not, each in plan order without repeats (`TM:995-1001`). An optional role's failure never changes the outcome. There is no voting, no default `allow` or `block`, and no extra time. A single specialist and a lead is a valid team.
* **State and the sweep.** `work_root/<run_id>/state.json` is rewritten atomically at each task change (`AT:391-393`, `:820`, `:844`, `:873`): each task's state, PID and process identity (`/proc/sys/kernel/random/boot_id` and the process start time, `AT:204-210`, on Linux only). At construction the runtime sweeps every run directory whose state is not terminal: on Linux it kills each recorded child whose identity still matches (`AT:213-219`), and every running or pending task becomes `cancelled` (`coordinator_restart`), a receipt found or not; the run is marked `interrupted` and is never resumed or re-run. CP-C2's answer for such a run (`unavailable`, `cancelled`) is step 6's. **Deviation:** legacy, on the same team's next run, kept the receipt of a killed running task (`AT:653-662`), marked only the others `interrupted` (`AT:663-666`) and ran the pending tasks within the original deadline (`AT:394-402`); so it could still produce a result when time remained. Here the spec's CP-C2 completes an unfinished request as `unavailable`, which the kernel applies as `proceed_unavailable`, as it does a legacy run that ran out of time.
* **Hand-offs.** Step 5: `providers.consult(packet)` and the role's `delegated` credential; the run record built from `TeamResult` (`roles` become `RoleRecord`s with `late` and `duplicate`). Step 6: the deadline it passes (`SV:279-282`: now plus `min(blueprint.deadline_seconds, 300)`, at least 0.05 s), the context, the `Review` mapped from `payload["action"]`, the answers before a run (`off`, no team, `context_unavailable`), the alert, and CP-C1 and CP-C2.

#### Fork calls in this step

Each keeps legacy's behaviour at 445eb116 for the owner's review: the blueprint checks, ceilings and role defaults (`BP:118-129`, `:238-242`, `:347-533`); the token budget, `max_tokens` 300 by default within 1–4,096; the tool-call budget 0; any unresolvable profile, optional included, `required_role_failed`; a plan over its limits or an unsupplied management scope `service_contract_error`; run slots 4 and 4, refused at once as `capacity_denied`; the four children of the pool, a task without a slot pending until the team deadline; any exception in a run `team_unavailable` at once; the child limits as the child's first action in legacy's order; the run and task deadlines, the kill at the first poll past them, stage gating, the lead only after every required task, no retry and no re-run after a restart; the order and strictness of the three consequences, an optional failure only named; the child environment and rlimits; the context freshness of 300 s and 15 s and legacy's empty values; no Canvas scope; the committee's two roles. Slice Fork calls 16, 17 and 18 apply as written.

#### Deviations in this step

Typed outcomes (slice Deviation 10); outputs validated in the parent; no limits on Windows; the deadline checked before the profiles, the plan and a claimed run (legacy's order, `SV:326`, `TM:580-585`, `:1335-1424`); run slots held in memory, so a crashed process's claims do not outlive it (`TM:652-697`); the restart sweep cancels every unfinished task and resumes nothing (legacy kept a killed task's receipt and ran the pending ones, `AT:394-402`, `:653-666`); the first receipt wins and later ones are counted; late receipts recorded; pins of the bound profile, not the adapter-resolved one; 64-hex digests; the session-stable lineage only; `design_proposal` and memory bindings refused until SLICE-12; no `AT_CONFIG_FILE`, and `SYSTEMROOT` on Windows. **Listed, not made:** a Canvas scope for roles (the spec's "Canvas facts"); a caller for the committee check.

### Tests

`tests/unit/test_cognition_assembly.py` (**T-55**). Every value is labelled synthetic; every expectation is written by hand from the rules above. Digests are computed in the test with `hashlib.sha256` over `json.dumps(…, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`. Supervision cases run a **scripted child**: a Python file the test writes under `tmp_path`, passed as `child_command=[sys.executable, "-I", <that file>]`, which first calls `autonomous_trading.cognition.runtime.apply_child_limits(packet)` (the package is installed in the test environment), then acts on the `rule` profile's `signal` string (`contribute:<action>`, `abstain`, `status:<status>`, `raw:<text>`, `twice:<action>:<action>`, `late:<action>`, `sleep:<seconds>`, `exit:<code>`, `env`), each child stamping its start and end in a side file of the run directory. No file is added to the tree.

`VALID` (synthetic): name `sim_team`; roles `lead` (`rule`, profile `p_lead`, instruction `v1`, scope `["spot"]`, `entry_review`, required, lead, deadline 30.0), `spec_a` (the same but not lead), `spec_b` (the same, not required); stages `s1` (`parallel`, `["spec_a", "spec_b"]`) and `final` (`synthesis`, `["lead"]`, depends on `s1`); edges `[["spec_a", "lead"], ["spec_b", "lead"]]`; `result_schema` `entry_review`; `task_limit` 2, `round_limit` 1, `concurrency` 2, `deadline_seconds` 60.0, `memory_mb` 512, `cpu_seconds` 10, `output_bytes` 262144. `ALLOW` is `{"action": "ALLOW", "reason_code": "sim_ok", "explanation": "synthetic"}`.

| Group | Cases |
|---|---|
| Blueprint refusals (PRF-STR-05) | `VALID` is accepted. Each refused with legacy's text exactly: a stage cycle (`s1` depends on `final`, `final` on `s1`): `"stage dependencies contain a cycle"`; an edge `["spec_a", "spec_a"]`; edges `spec_a→spec_b` and `spec_b→spec_a`; `spec_b` with no edge (`"every specialist artifact must reach the lead"`); two roles with `is_lead`; the lead not required; the synthesis stage not last; the lead also in `s1`; `result_schema` `exit_advice` with an `entry_review` lead. Each ceiling at its value accepted and one past it refused: role deadline 120.0 and 120.5 (`"role deadline exceeds the runtime ceiling of 120"`), team deadline 300.0 and 300.5, `task_limit` 16 and 17, `concurrency` 4 and 5 (each with `task_limit` 4), `concurrency` 3 with `task_limit` 2, role `memory_mb` 128 and 127, 1024 and 1025, team `memory_mb` the same four, role `cpu_seconds` 60 and 61, team `cpu_seconds` 60 and 61, role and team `output_bytes` 262144 and 262145, a `turns` stage with `round_limit` 16 and 17 (the blueprint's `round_limit` 16), a blueprint `round_limit` 17, a `parallel` stage with `round_limit` 2. A role with backend `committee`; scope `"news"` (`"unknown context scope: ['news']"`); `design_proposal`; one memory binding (the new message); `task_limit` 1 with two specialists. A role defaulted from `from_dict` reads deadline 30.0, memory 512, CPU 10, output 262144 |
| Tool budget | A role with `callable_tools ["read_view"]` and no budget: the budget message; with `tool_call_budget` 3 and no `tool_result_bytes`: the bytes message; with both: the unknown-tool message (`CALLABLE_TOOLS` is empty); `tool_call_budget` 3 with no tools: the no-tools message. `VALID`'s `as_dict()` has no tool key |
| Digests and pins | `digest(VALID)` equals the hand-computed value. A pin for `http` with `{"config": {"model": "sim-model", "url": "https://sim.invalid/v1"}, "instruction": "synthetic"}`: `max_tokens` 300 and `config["max_tokens"]` 300 in the digested config; with `max_tokens` 4096 accepted, 0 and 4097 failed pins (`profile_resolution_failed:…`), never a raise; a `rule` pin `{"signal": "x"}` has `max_tokens` `None`; a config key `apikey` fails (legacy's allow-list); a profile `backend` `http` for a `rule` role fails. `profile_digest` equals the hand-computed value; `lineage_digests` of `VALID`'s three pins is the three `("profile_<role>", digest)` pairs sorted by key |
| Committee | `committee_members(["ce_case", "pe_case"], "deferred")` passes; `["pe_case", "ce_case"]` passes; `["ce_case", "pe_case", "risk"]`, `["ce_case"]` and `["ce_case", "ce_case"]` raise legacy's text; `risk_critic` `"active"` raises `ValueError`. `compose_cognition_runtime` with `committee_risk_critic` `None` raises `RefusingParameterUnbound("cognition.committee.risk_critic")`; the loader given `cognition: {committee_risk_critic: active}` raises `SettingsError`, given `deferred` reads `"deferred"`, given nothing reads `None` |
| Outcomes | One unit case per row of the outcome table, through the classification function on a hand-written receipt (for the size row: a hand-built `advice` receipt whose UTF-8 JSON is N bytes, N computed in the test with `len`, and `output_bytes` N: it is read; the same receipt with `reason` one character longer, N+1 bytes, is `invalid_receipt`), and `{"action": "AI_UNAVAILABLE", "reason_code": "x", "explanation": "y"}` from an `advice` receipt is `invalid` `invalid_typed_output`. A contribution's `output_digest` equals the hand-computed digest of `{"schema": "entry_review", "payload": ALLOW}` |
| Assembly (pure) | With `started_at` 1000.0 and `deadline` 1060.0, all three contributing: `completed_at` 1060.0 gives `result` with `ALLOW`, `completed_required` `("spec_a", "lead")`, `unavailable_optional` `()`; `completed_at` 1060.5 gives `deadline_expired`. At 1060.0: `spec_a` each of `abstention`, `unavailable`, `invalid`, `timeout`, `cancelled`: `required_role_failed`; `spec_b` each of them: `result` with `unavailable_optional` `("spec_b",)` and the same payload; the lead `invalid`: `required_role_failed`. A lead contribution whose payload is `{"action": "PAUSE", "reason_code": "x", "explanation": "y"}` (constructed directly): `failed_lead`. At 1061.0 with `spec_a` `timeout`: `deadline_expired` (rule 1 first). The outcomes passed in reverse order give an equal `TeamResult`. A two-role team (`spec_a`, lead) contributing: `result`. Every call passes `run_id` `"a" * 64`, `started_at` 1000.0, `lineage_digests` the hand-computed tuple and `limits` `"posix"`, and the result carries them unchanged. **A run that raises:** `run` with `work_root` an existing regular file (so the run directory cannot be made): unavailable `team_unavailable` returned, nothing raised, no child launched, and the strategy's slot free again (a second run for it takes one) |
| Deadlines and plan | `task_deadline(1060.0, 1040.0, 60.0, 30.0)` is 1060.0; `(1060.0, 1010.0, 60.0, 30.0)` is 1040.0; `(1060.0, 1000.0, 60.0, 90.0)` is 1060.0. The run deadline with `started_at` 1000.0 and blueprint 60.0: request 1030.0 gives 1030.0, request 1090.0 gives 1060.0; request 1000.0 gives `deadline_expired` with no child launched. A `turns` stage of `spec_a`, `spec_c` with `round_limit` 3 (the blueprint's `round_limit` 3) and a `parallel` stage of `spec_b`: 7 tasks; with `task_limit` 6 the run is `service_contract_error` with no child, with 7 it runs and the names include `spec_a_r01`…`spec_a_r03`; a role in two stages is named `role[:54] + "_" + <hand-computed 8 hex>` |
| Pins and capacity | A pin failure on optional `spec_b` (an unknown config key): `required_role_failed`, no child. A role scoped `positions` with no result: `service_contract_error`. **Capacity, with threads:** four runs for strategy `sim_a` started from four threads (scripted `sleep:30`, deadline 2.0) and held open; a fifth `run` from the test thread answers `capacity_denied` at once, with no child; after the four return, a run takes a slot. A run whose directory exists: `capacity_denied`. **A full pool:** a runtime with `pool_size` 1 and a `parallel` stage of two `sleep:30` roles (`task_limit` 4, `concurrency` 2, team deadline 1.0): the second task never launches (no packet) and ends `timeout` `team_deadline` |
| Supervision (scripted child) | Every blueprint here is `VALID` with `task_limit` 4, so a third specialist fits. `VALID` with `contribute:ALLOW` for all: `result`, three contributions. `spec_a` `sleep:30` with role deadline 0.5: `timeout` `task_deadline`, killed (the side file has no end stamp), `required_role_failed`. `spec_a` `twice:ALLOW:BLOCK`: contribution `ALLOW`, `duplicates` 1. `spec_a` `late:ALLOW` (writes its receipt, then sleeps past its deadline): `timeout`, `late` true, `required_role_failed`. `exit:3`: `unavailable` `child_exit`, `detail.exit_code` 3. `status:provider_error`: `unavailable` `provider_error`. `raw:not json`: `invalid` `invalid_typed_output`. A stage `s2` (`spec_c`, depending on `s1`) after `spec_a` `abstain`: `spec_c` `cancelled` `required_prerequisite_failed` with no packet written, the lead `cancelled`, `required_role_failed`. A team deadline of 1.0 with `spec_a` `sleep:30` (role deadline 1.0): `spec_c` `timeout` `team_deadline`, the result `deadline_expired`. Completion order: `spec_a` `sleep:0.3` and `spec_b` instant, then reversed: equal outcomes and payload. `concurrency` 2 with three parallel `sleep:0.5` roles: at most two children overlap in the side file's stamps. No child starts after the run's deadline, and every task deadline is at or before it |
| Environment | `role_environment({"ADVISOR_API_KEY": "sim-adv", "OPENALGO_API_KEY": "sim-key"})` is exactly the five fixed names, `ADVISOR_API_KEY`, and `AT__OPENALGO__AUTH__API_KEY` `""` (and `SYSTEMROOT` on Windows). A scripted `env` child run with the parent's environment holding synthetic `OPENALGO_API_KEY` and `AT__OPENALGO__AUTH__API_KEY` sees the same names. **Linux only** (skipped elsewhere, as SLICE-10's file-mode test): an `env` child reads, after `apply_child_limits`, `RLIMIT_AS` 512 MiB, `RLIMIT_CPU` 10, `RLIMIT_FSIZE` 262144, `RLIMIT_NOFILE` 64, and its receipt's `limits` is `"posix"`; `apply_child_limits` given a `parent_pid` that is not its parent's exits 1 before any limit is set. Elsewhere `apply_child_limits` returns `"unenforced"` and sets nothing |
| Sweep (Linux only) | A `state.json` naming a live `sleep:30` child with its recorded identity: a new runtime kills it and marks the task `cancelled` `coordinator_restart`, the run `interrupted`; one whose identity differs is not killed; nothing is re-launched |
| Tools | `freshness` with cutoff 10:42:07 and bound 300: observed 10:37:07 `fresh`, 10:37:06 `stale`, 10:42:08 `future`; bound 15: 10:41:52 `fresh`, 10:41:51 `stale`. `role_inputs` for scope `["spot", "chain", "greeks"]` with only a spot result: `spot` from it, `chain` `{"value": [], "source": None, …}`, no `greeks` key. A role scoped `["spot"]` given results for `spot` and `account` receives `spot` only. `unavailable_sources` with one stale and one fresh result names the stale one. `INPUT_SCOPES` has the 14 names |

**Changed existing tests:** none expected. `tests/contracts/test_capabilities.py` reads every source file; the new modules construct no `ReviewApplication` or `Plan`. A test that lists every `Settings` field or loader row gains `committee_risk_critic`; the builder names each in the as-built table. SLICE-10 step 6 is being built in OA_NEW now and may also touch `settings/loader.py`: step 4's builder starts from its as-built head.

### Break checks

Each is applied with its anchor checked first (exactly one occurrence, the text recorded in the as-built table), one at a time, run against `test_cognition_assembly.py`, and restored byte for byte with an md5 check. At least:

| Change | Test that must fail |
|---|---|
| `MAX_ROLE_DEADLINE_SECONDS` 120 → 121 | Blueprint refusals |
| `max_tokens` default 300 → 400 | Digests and pins |
| An optional role's pin failure ignored | Pins and capacity |
| `abstention` counted as a contribution | Assembly; Supervision |
| An optional role's non-contribution treated as required | Assembly |
| `completed_at > deadline` written `>=` | Assembly |
| Consequences 1 and 2 swapped | Assembly |
| `task_deadline` without the role's seconds | Deadlines and plan; Supervision |
| The last receipt wins | Supervision (`twice`) |
| A late receipt accepted | Supervision (`late`) |
| A later stage started after a required failure | Supervision (`s2`) |
| The broker key not removed | Environment |
| A committee of three accepted | Committee |
| Freshness with `>=` (an age equal to the bound stale) | Tools |
| The sweep re-launching a cancelled task (Linux) | Sweep |
| The `except Exception` around run steps 3–5 removed | Assembly (a run that raises) |
| The `finally` slot release removed | Assembly (a run that raises: the second run is `capacity_denied`) |
| A task without a pool slot failed at once instead of waiting | Pins and capacity (a full pool) |
| `apply_child_limits` setting no `RLIMIT_AS` (Linux) | Environment |

### Files

| File | Change |
|---|---|
| `cognition/blueprint.py` | New: the copied blueprint types and checks, `BlueprintRefused`, `OUTPUT_SCHEMAS`, `CALLABLE_TOOLS`, `digest`, `RolePin`, `pin_role`, `lineage_digests`, `COMMITTEE_ROLES`, `committee_members` |
| `cognition/runtime.py` | New: `POOL_SIZE`, `MAX_MANAGEMENT_CONCURRENCY`, `POLL_SECS`, `TeamRequest`, `RoleOutcome`, `TeamResult`, `task_deadline`, `role_environment`, `apply_child_limits`, the classification, `assemble`, `CognitiveAgentRuntime` (`run`, the sweep), the production child's `__main__` |
| `cognition/tools.py` | New: the scope sets, `ToolResult`, `freshness`, the two freshness constants, `unavailable_sources`, `role_inputs`, `ScopeUnavailable` |
| the `cognition` package's `__init__.py` | New, empty |
| `bootstrap.py` | `compose_cognition_runtime` (the risk-critic setting and the runtime's construction) |
| `settings/schema.py` | `Settings.committee_risk_critic`, a string or `None`, default `None` |
| `settings/loader.py` | `_COGNITION` and its read in the settings loop |
| `tests/unit/test_cognition_assembly.py` | New (T-55, PRF-STR-05) |

**No new tree delta:** the three modules are in README §6 and the module index; the test file is T-55; the `__init__.py` is the package marker. No setting gains a value, no ledger migration, no event kind. The modules import `contracts/identity.py` and `settings/secrets.py` (the broker key's names) only; step 7's capability scan covers them.

### Completion conditions (step 4)

* **Targeted tests only:** `tests/unit/test_cognition_assembly.py`, `tests/contracts/test_capabilities.py`, `tests/unit/test_strategy_invocation.py` (which composes through `bootstrap.py`), and the loader's readers `tests/unit/test_policy_parameters.py` and `tests/unit/test_secret_references.py` pass twice in a row, on the EC2 checkout (the Linux-only cases run there) and locally; every break check fails a listed test and every file is restored (md5); `ast.parse` passes on every new or edited Python file.
* `git diff --stat` against the branch head at the start of step 4 names only the files above.
* PRF-STR-05's clauses each pass a group: blueprint refusals (Blueprint refusals, Tool budget); each role outcome (Outcomes, Supervision); required and optional failures with legacy's consequences, duplicates, late results and malformed synthesis (Assembly, Supervision); varied completion order gives one result (Assembly, Supervision); the risk role refused (Committee); the deadline never extended (Deadlines and plan, Supervision).

### Step 4 as built

**In plain words.** The AI review team now exists without its model calls. Team descriptions are checked with today's rules and limits; each role runs as its own small program with no broker key and today's limits, is stopped at its deadline, and its answer is labelled precisely. If a required role does not contribute, or time runs out, the review is "unavailable", exactly as today. Nothing here can block a trade.

Commit `126eff1` on `slice-08`, on top of `0400d25` (SLICE-10 step 6). It changes the 8 files of the step's table (2,062 lines added, 1 removed). Not pushed.

**Choices and corrections made while building:**

| Topic | As built |
|---|---|
| Pin failure text | `profile_resolution_failed:<exception type name>`, as legacy (`TM:425`), never the message |
| `max_tokens` | Must be an int (not a bool) of 1–4,096, as the text says; legacy's `_bounded` also took a float or numeric string (`AT:59-63`, `:104`) |
| Secret refusal in task text | Legacy's `_refuse_secrets` on the task (`AT:154-155`) is not ported; the profile's keys are still checked against legacy's allow-list. A gap for step 5, which sees the resolved values |
| Public helpers | `plan_order`, `classify`, `output_digest` and `sha256_hex` are module functions, so the tests and step 5 use them directly |
| `assemble` | Raises `ValueError` if a planned task has no outcome; inside `run` that becomes `team_unavailable` |
| Run state | `state.json` records only launched tasks; a pending task has no row, so the sweep has nothing to cancel for it |
| Role credential | `CognitiveAgentRuntime(…, delegated=None)` passes the role credential into `role_environment`; empty until step 5 supplies one |
| Loader test | The YAML cases replace the loader's `_defaults` with the packaged defaults plus a `cognition` section |
| The 7-task plan case | Checked through `plan_order` (the eight task names in order), not by running seven children |
| Linux cases on the EC2 | OA_NEW has no environment there, so `~/claude-desktop/scripts/s09d_linux_tests.sh` unpacks the working tree and a throwaway venv under `~/claude-desktop/outputs/s09d/`, which reuses `~/at-dev`'s packages through a `.pth` file. Nothing is installed or downloaded, and nothing shared is changed |
| Existing tests changed | None |

**Tests:** `tests/unit/test_cognition_assembly.py`, 80 cases: on Windows (Python 3.14.0) 78 passed and the 2 Linux-only cases were skipped; on the EC2 (Linux, Python 3.13.5) all 80 passed, twice. The targeted set ran twice on Windows: this file, `tests/contracts/test_capabilities.py`, `tests/unit/test_strategy_invocation.py`, `tests/unit/test_policy_parameters.py` and `tests/unit/test_secret_references.py`, 185 passed and 3 skipped each time. The full suite was not run. `ast.parse` passes on every new or edited Python file.

**Break checks** (`s09d_breaks.py`, anchors checked first, one at a time, every file restored byte for byte with md5 checked): all 19 failed a listed test. 17 ran on Windows and the two Linux-only checks on the EC2. One anchor was first a line prefix, which left a syntax error, so the check erred rather than failed; it was corrected to the whole line and re-run.

| Break | Caught by |
|---|---|
| `MAX_ROLE_DEADLINE_SECONDS` 120 → 121 | Blueprint refusals |
| `max_tokens` default 300 → 400 | Pins |
| An optional role's pin failure ignored | Pin failure and scope; Deadlines and plan |
| An abstention counted as a contribution (in `assemble`) | Assembly |
| An optional non-contribution treated as required | Assembly |
| `completed_at > deadline` written `>=` | Assembly |
| Consequences 1 and 2 swapped | Assembly; Stage gating |
| `task_deadline` without the role's seconds | Deadlines and plan; Task deadline; Receipts |
| The last receipt wins | Receipts (`twice`) |
| A late receipt accepted | Receipts (`late`) |
| A later stage started after a required failure | Stage gating |
| The broker key not removed | Environment |
| A committee of three accepted | Committee and setting |
| Freshness with `>=` | Tools |
| The `except Exception` around run steps 3–5 removed | A run that raises |
| The `finally` slot release removed | A run that raises; Capacity with threads |
| A task without a pool slot failed at once | Full pool |
| The sweep not killing a matching child (Linux; the text's "re-launching" has no code to break, since the sweep launches nothing) | Sweep |
| `apply_child_limits` setting no `RLIMIT_AS` (Linux) | Environment |

**Open:** the committee check still has no caller (an X item for the coordinator); `_refuse_secrets` is for step 5; `providers.consult` and the role credential are step 5's.

## Step 5 — providers and records (outline)

The spec's [Providers and run records](../../design/strategies-and-cognition.md#providers-and-run-records-cognitionproviderspy-cognitionrecordspy). Ports the backends, Retry-After and the circuit, budgets and the chain (inactive while `cognition.providers.fallback` is `inactive`); the pause warning through `operations/telemetry.py`; the run record and its evidence publication; the record store; replay from recorded responses. Test file: `tests/unit/test_provider_records.py` (**T-56**), with a fake HTTP transport serving 200, 400 with `response_format`, 429 with finite, date and non-finite hints, and a provider that reports no model; replay tests make any socket raise.

## Step 6 — review, proposals and advice (outline)

The spec's [Entry review](../../design/strategies-and-cognition.md#entry-review-cognitionreviewpy), [Model-generated intents](../../design/strategies-and-cognition.md#model-generated-intents-strategiesmodel_strategypy) and [Exit advice](../../design/strategies-and-cognition.md#exit-advice-cognitionadvicepy). Builds the review producer up to the result, always answering; its submission through `kernel.policy.record_review`; CP-C1 and CP-C2; the proposal purpose and `model_strategy.py`; advice recording and the application request (the human route is SLICE-10's). Tests: `tests/integration/test_review_producer.py` (**T-57**) in a simulation composition with the SLICE-04 kernel as built, covering acceptance rows `README.md:1237` and `:1243` and a PAUSE reviewed for an entry refused at A4 (its pause starts; the next intent in scope is `paused`); `tests/unit/test_model_strategy.py` (**T-58**) on recorded proposals; the CP-C rows of `tests/recovery/test_crash_boundaries.py`.

## Step 7 — the boundary and replay (outline)

* **Carried from step 3 (2026-11-02):** BuyerEdge imports the OpenAlgo SDK's `ta` functions (`openalgo==2.0.5`). The capability boundary allows `openalgo.ta` only; any other `openalgo` import from `strategies/` (the broker client) is refused, with a test and a break check.

Extends `tests/contracts/test_capabilities.py` (PRF-XC-02's file) with PRF-STR-09: an `ast` scan of every module under `strategies` and `cognition` for imports of the ledger writer, the order adapters and the simulated broker, and for constructions of `ReviewApplication` and `Plan`; the spawned host and role environments carry no broker key; no settings, policy or locked-evidence write path; advice alone produces no action. The OS part of D09 is SLICE-11's. Adds PRF-STR-11 to `tests/integration/test_shared_engine.py`: a simulated session (market store, BuyerEdge and EMA cross, a scripted review team, one host crash and restart) is recorded, then re-run in a replay composition with only the replay backend; invocation IDs, state revision digests, outputs, decision records and reviews match the recorded run (Combined-F5, A05-F2; `README.md:366`, `:800`).

## Completion conditions

* Every step's completion conditions hold: its tests pass twice in a row with the whole suite, every break check fails a listed test and every file is restored (md5), and `ast.parse` passes on every edited Python file.
* PRF-STR-01…09 and PRF-STR-11 pass; PRF-STR-10 is carried to recorded sessions (Excluded).
* The spec and this file record each step "as built", with every Fork call and Deviation that the build confirmed or added.
