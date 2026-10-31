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

**Not a fork: deciding on the sealed bar.** The pass decides a window only once SLICE-08 has sealed it, waiting at most `strategies.host.seal_wait_ms`. That changes the bar legacy decided on (legacy read the ticks flushed by the confirmation point, RFL `:3424-3427`), and it is the owner-approved Q-030 rule applied by SLICE-08, not a fork. Step 3's parity walks include bars at the seal boundary, where a tick arrived on time but after legacy's flush, so the difference is visible and bounded.

**Spec-only improvements, listed, not made:** submitting a decided-but-unsent intent after recovery under B1's view-age check (call 11); rebuilding BuyerEdge's state after a restart by re-walking the session's bars (call 10); scoring gamma and IV regime at `score_max=0` to match POL-024's "research-only" (call 4); an age bound on BuyerEdge's scoring view (call 5).

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

## Step 2 — the strategy host (outline)

Deepened after step 1 is built and after SLICE-08 step 3 names carries 1 and 2. The spec's [strategy host](../../design/strategies-and-cognition.md#the-strategy-host-strategiesworkerpy), [invocations and state](../../design/strategies-and-cognition.md#invocations-and-state-strategiesworkerpy) and [handoff](../../design/strategies-and-cognition.md#handoff-to-the-kernel-strategiesworkerpy) sections. Builds the strategy store and its lock; the invocation ID (`inv1:` and 64 hex digits over candidate, session, scope, view policy name and version, and trigger), used as the intent ID and command key; the state machine with I-W1…I-W5; serialization per scope; the three restoration kinds; one view per trigger; the handoff order (publish, record the decision, request the review, submit) and every kernel answer with the retry bound; recovery CP-W1…CP-W5 against the kernel's command status; the pass schedule and seal wait driven by a recorded clock; warm-up and faulted passes; the service principal, account and session of the `EntryRequest`. TASK-S09-09 builds the kernel's `record_decision` and `setup_fresh` derivation, once the intent spec carries them. EMA cross (`strategies/ema_cross.py`) ports `src/strategies/ema_crossover.py:105-205` unchanged, expectations computed by hand; protocol tests may also use strategies from the simulation-only test package. Tests: `tests/unit/test_strategy_invocation.py` (**T-51**), run against the SLICE-04 kernel in a simulation composition for the B1 and planner cases (a catch-up window past B1's bound refused `ADM-R05`; the plan reads the trigger minute's chain), and the CP-W rows of `tests/recovery/test_crash_boundaries.py`, killing a real host subprocess at each named point. Break checks include: one view for all windows of a pass; moving `scope_head` without the predecessor check; a fresh identity on retry; a `|` in the ID; resubmitting after CP-W2; an abstention not recorded with the kernel; retrying `ADM-R12` past the bound; walking a newer window before an unsealed older one.

## Step 3 — BuyerEdge (outline)

Deepened after step 2 is built and SLICE-08 step 3 names carries 3–5. **First, TASK-S09-08's characterizations**, each recorded with its evidence before code:

1. Every live registry row (id, kind, authority, enabled), the deployed host's `--poll`, and the account it trades, read from the live host's registry and unit without changing them (read-only, under the boundary rule). The rows are carried unchanged into `strategies.registry.*`; `--poll` binds `strategies.host.pass_secs`.
2. Which bar series the library runner walks for BuyerEdge (`ctx.close` and `ctx.at`: tick bars or history bars, and the bar's stamp), so the trigger and `as_of` match legacy.
3. Whether a chain poll's minute stamp and the Greeks batch's `at` meet `greeks_at`'s "at or before the stamp" rule for the bar stamp legacy passes (`scans.py:316-331`), on the captured days, so the assembly's parity walks include the boundary.

Then the port: the scorer, `BotConfig` and `to_intent` copied unchanged (with the numpy and pandas dependency recorded in `requirements.lock`); the input assembly over the view, keeping legacy's order of state updates (the previous assembled minute set before the spot frame is checked; the chain history appended only after a full assembly); the clock bound to the bar's stamp for each call; the intent and abstention mapping; the `reset_on_restart` state; the view policy `market.views.buyer_edge`.

**Golden walks.** `scripts/gen_buyer_edge_parity.py` (**T-54**), run once against a legacy checkout, never in the suite, as SLICE-06's and SLICE-08's generators, writes `tests/fixtures/strategies/buyer_edge_golden.json` (**T-53**). Each case is a contiguous walk from a fresh engine and view: from the session's start, and from restart points mid-session (a fresh engine whose first bar is later, as a restart gives). Walks run over seeded synthetic days and over stretches of recorded days (provenance in `tests/fixtures/manifests.json`), and contain gap minutes: no chain for the minute, no spot frame, an unusable chain, missing Greeks, and bars at the seal boundary. For every bar the case records the raw store records legacy read, the clock it bound, its `score_kwargs`, and the `SignalResult` and `Intent`. `tests/unit/test_buyer_edge_parity.py` (**T-52**) replays each walk in order through one fresh target engine and assembly and compares every bar, field by field, floats as `repr` strings. Break checks include: appending chain history before the spot frame succeeds; not setting the previous minute when the frame fails; an unbound clock; a per-bar fresh engine.

## Step 4 — blueprints and assembly (outline)

May run in parallel with steps 1–3. The spec's [Blueprints and typed assembly](../../design/strategies-and-cognition.md#blueprints-and-typed-assembly-cognitionblueprintpy-cognitionruntimepy) and [Role-scoped tools](../../design/strategies-and-cognition.md#role-scoped-tools-cognitiontoolspy). Ports legacy's blueprint validation, limits and team supervision; the token budget from each profile's `max_tokens`; a tool-call budget of 0, with `tool_call_budget` required of any blueprint granting callable tools; the typed role outcome and the assembly validator; legacy's consequences; a committee risk role refused while `cognition.committee.risk_critic` is `deferred`. Test file: `tests/unit/test_cognition_assembly.py` (**T-55**), with scripted role children (a test backend) covering each outcome, required and optional, duplicates, late results, malformed synthesis, varied completion order and each limit.

## Step 5 — providers and records (outline)

The spec's [Providers and run records](../../design/strategies-and-cognition.md#providers-and-run-records-cognitionproviderspy-cognitionrecordspy). Ports the backends, Retry-After and the circuit, budgets and the chain (inactive while `cognition.providers.fallback` is `inactive`); the pause warning through `operations/telemetry.py`; the run record and its evidence publication; the record store; replay from recorded responses. Test file: `tests/unit/test_provider_records.py` (**T-56**), with a fake HTTP transport serving 200, 400 with `response_format`, 429 with finite, date and non-finite hints, and a provider that reports no model; replay tests make any socket raise.

## Step 6 — review, proposals and advice (outline)

The spec's [Entry review](../../design/strategies-and-cognition.md#entry-review-cognitionreviewpy), [Model-generated intents](../../design/strategies-and-cognition.md#model-generated-intents-strategiesmodel_strategypy) and [Exit advice](../../design/strategies-and-cognition.md#exit-advice-cognitionadvicepy). Builds the review producer up to the result, always answering; its submission through `kernel.policy.record_review`; CP-C1 and CP-C2; the proposal purpose and `model_strategy.py`; advice recording and the application request (the human route is SLICE-10's). Tests: `tests/integration/test_review_producer.py` (**T-57**) in a simulation composition with the SLICE-04 kernel as built, covering acceptance rows `README.md:1237` and `:1243` and a PAUSE reviewed for an entry refused at A4 (its pause starts; the next intent in scope is `paused`); `tests/unit/test_model_strategy.py` (**T-58**) on recorded proposals; the CP-C rows of `tests/recovery/test_crash_boundaries.py`.

## Step 7 — the boundary and replay (outline)

Extends `tests/contracts/test_capabilities.py` (PRF-XC-02's file) with PRF-STR-09: an `ast` scan of every module under `strategies` and `cognition` for imports of the ledger writer, the order adapters and the simulated broker, and for constructions of `ReviewApplication` and `Plan`; the spawned host and role environments carry no broker key; no settings, policy or locked-evidence write path; advice alone produces no action. The OS part of D09 is SLICE-11's. Adds PRF-STR-11 to `tests/integration/test_shared_engine.py`: a simulated session (market store, BuyerEdge and EMA cross, a scripted review team, one host crash and restart) is recorded, then re-run in a replay composition with only the replay backend; invocation IDs, state revision digests, outputs, decision records and reviews match the recorded run (Combined-F5, A05-F2; `README.md:366`, `:800`).

## Completion conditions

* Every step's completion conditions hold: its tests pass twice in a row with the whole suite, every break check fails a listed test and every file is restored (md5), and `ast.parse` passes on every edited Python file.
* PRF-STR-01…09 and PRF-STR-11 pass; PRF-STR-10 is carried to recorded sessions (Excluded).
* The spec and this file record each step "as built", with every Fork call and Deviation that the build confirmed or added.
