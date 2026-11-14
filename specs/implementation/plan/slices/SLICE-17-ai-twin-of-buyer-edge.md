# SLICE-17 — The AI twin of BuyerEdge (`ai_buyer_edge`)

* **Status:** proposed (2026-11-14). Step 1 (the audit) is done and recorded below. Steps 2–6 are outlines in the standing rules' sense: each step's exact detail (signatures, test tables, break checks) is written just before it is built, reviewed by two fresh EGM reviewers, built, run twice with the targeted tests, break-checked and recorded "as built".
* **Why this slice exists.** The owner asked for a model-driven strategy shipped in the repository that sees the same market data and the same statistics as BuyerEdge and gives a **view only**: call, put or no trade, a conviction, and a short reason naming the statistics it used. It never chooses strike, quantity, price or stop and never sends. It ships observe-only, is compared with BuyerEdge on the same bars, and can be promoted only by the owner's approval of one exact frozen version.
* **Precedence:** the master README, then the ROADMAP, then this package. Authorities: the [strategies and cognition spec](../../design/strategies-and-cognition.md) and the [research spec](../../design/research-rl-custody-promotion.md). **No score, threshold, entry gate or money value is set or changed here.** BuyerEdge's code, scores and gates are not touched; the kill, the loss latch, holds, caps and entry gates stay exactly as strict. Nothing in production code gates or mocks real trading; a missing credential never blocks the build.
* **Owner answers applied:** the owner's request of 2026-11-14 (this slice); Standing rules (2026-10-30); Combined answers, slices 09–14 (2026-10-30), "Promotion: the old system's rules"; Server lost: start fresh (2026-11-13).
* **Builds on:** OA_NEW `agentic-desk` at `a0c1bce` (SLICE-09, SLICE-12 and SLICE-15 steps 1–6 as built). Branch `slice-17`, cut from `agentic-desk`.
* **Environment.** Steps 2–5 run on the owner's Windows PC only, with a fake provider (the scripted child of `tests/unit/test_model_strategy.py` and the local HTTP server `_Server` of `tests/unit/test_provider_records.py:272`). No API key, no broker, no money. Step 6's channel half is Linux-only and waits for SLICE-15 step 7. Real model runs wait for the owner's API key and budget answer.
* **Environment classes.** Steps 2–5: S. Step 6: S for the in-process half; P (SLICE-15 step 7, owner's word) for the live-observe half.

**In plain words.** Almost everything this needs already exists: a model strategy type, the AI proposal path, a record of every model call, safe failure statuses, a replay that runs BuyerEdge over the five August days, the candidate freeze, the exam and the promotion record. What is missing is the strategy itself and the glue. Step 2 makes BuyerEdge's statistics a declared list the model can be shown, so the prompt is built from a list, not from hand-written code. Step 3 adds the twin: it scores every bar with BuyerEdge's own code, asks the model only on bars a cheap rule picks, and turns the answer into a view that is recorded but can never trade. Step 4 runs the twin beside BuyerEdge in the replay and writes a comparison report. Step 5 freezes one version as a research candidate and runs the existing exam on it. Step 6 connects the twin for live observation on the new server. Nothing here can place, block or change a BuyerEdge trade.

## Steps

| Step | Builds | Class | Reuses | Proofs |
|---|---|---|---|---|
| 1 | **Audit (as built), below.** What BuyerEdge computes, the closest model pattern, and which deliverables already exist | — | — | This file |
| 2 | Declared inputs: a feature catalogue of BuyerEdge's statistics, a role's optional `features` list in the blueprint, `role_inputs` showing a role only its declared features, each value with its source and instant | S | `cognition/tools.py` scopes (`features` already a market field), `RoleSpec`'s optional-key pattern (`callable_tools`), BuyerEdge's pure compute functions | No look-ahead; declared-only inputs |
| 3 | The twin: `strategies/ai_buyer_edge.py` (descriptor, `decision_method: model`), `strategies/ai_buyer_edge_team.py` (blueprint and prompt as a literal), the consult filter with refusing settings, `registry.is_model_driven` | S | `model_strategy.py`, `ProposalProducer`, `intent_proposal` schema, provider statuses and records, the host's authority rule, ADM-R14 | Abstain on failure; observe-only; BuyerEdge unchanged |
| 4 | Side-by-side replay (two hosts, one ledger, the same bars) and the comparison report: agreement, direction skill against a coin flip, net value from closed trades, the second opinion and BuyerEdge's own reasons per bar | S | `tests/replay/replay_harness.py` (night skip), `research/evaluation.py` (`wilson_interval`, `report_from_labels`), the fake OpenAlgo | Comparison report (single day in tests; five days by hand) |
| 5 | Candidate freeze and exam for one version: the replay engine takes a real proposal port, the receipt carries the prompt identity, the model identity bundle, the evaluation report | S | `research/candidates.py`, `research/replay.py`, `research/evaluation.py`, `research/promotion.py` | Candidate evaluation report on a synthetic quote store |
| 6 | Live-observe wiring: the proposal route over the cognition channel, the shipped team composed in `serve_cognition`, a proposals port in `serve_strategy`; docs | S / P | `ReviewCore`, `KernelChannelServer`, `compose_cognition` | In-process route tests; Linux rows wait for SLICE-15 step 7 |

**Why this order.** Step 3's strategy and prompt need step 2's declared catalogue. Step 4 needs a working twin. Step 5 freezes a version that step 4 has already run. Step 6 is last because its live half cannot run on this PC. Steps 4 and 5 share no files and may be built in parallel by two agents once step 3 is done.

**Run time.** A converted NIFTY day replays in p50 509 s, max 813 s; five days on one ledger 3,014 s (SLICE-15 step 6 as built). Two hosts on one replay will take longer (not measured). Every test uses the synthetic afternoon or one converted day; the five-day report is run by hand once, and it is stated in the report that five days are too few to judge anything.

## Proposals and settings waiting for the owner

Nothing here is set by this slice. Each item is either an unbound setting that refuses until the owner binds it, or a proposal listed and not made.

| Item | Kind | Today | What the owner decides |
|---|---|---|---|
| `strategies.consult_filters.ai_buyer_edge.*` | Setting, new, unbound, refusing at host composition | — | Which bars the model is asked about: e.g. BuyerEdge's signal in a named set (`WATCH`, `EXECUTE`) or its absolute score at or above a floor. Tests use labelled synthetic values |
| The team's `http` `model` and `url`, and `advisor/api_key` | Profile and secret | Unbound; with no key an `http` role answers `not_configured` (SLICE-09 Fork call 10) and the twin abstains | The provider, the model name, the key |
| `cognition.providers_budgets` | Setting (exists) | `{}` (unlimited) composes; **any real cap refuses** cognition's composition (`bootstrap.py:547`, `BudgetCapUnsupported`) because legacy's per-day budget ledger (`BG:42-105`) is not built | Unlimited, or a cap. A cap needs that ledger ported first: a separate step, not planned here (proposal P-1) |
| `cognition.committee_risk_critic`, `cognition.providers_fallback`, `operations.advisor_pause_warn_minutes` | Settings (exist) | Required by `compose_cognition` (`bootstrap.py:519` and on) | Bind as SLICE-09 already asks (`deferred`, `inactive`, 15) |
| `promotion.directional.horizons`, `.min_scored_per_horizon`, `.z` | Settings (exist, `settings/schema.py:167-177`), unbound | The report's direction skill and the exam refuse without them | Bind (legacy's values are 5/15/30, 30 and 1.96; the repository sets none) |
| `promotion.bar.*` | Settings (exist, `settings/schema.py:186-188`), unbound | The bar refuses | **Not set.** The promotion bar stays the owner's |
| Registry row `ai_buyer_edge` | Owner's profile (`strategies.registry`) | No row: not runnable | Proposed row: `enabled: true, authority: none, kind: ai_worker`, BuyerEdge's account. Promotion later only to `plan`, then `trade`, each by an approved PromotionRecord |
| P-1 Budget ledger | Proposal | — | Port legacy's durable per-day budget ledger so a real cap can run |
| P-2 Explain mode by the model | Proposal | Not a run purpose (`records.run_id` purposes are `entry_review`, `exit_advice`, `intent_proposal`) | A new purpose `explain` asking a model why BuyerEdge did or did not enter. Step 4 builds the record-based explanation instead (BuyerEdge's own reasons per bar), which needs no model |
| P-3 Regime research report | Proposal | — | Which statistics carry edge in trending, ranging, high-vol, low-vol and expiry-day regimes. Each regime needs a definition, and each definition is a threshold the owner sets; five days cannot support it |
| P-4 Price the Greeks for BuyerEdge | Proposal (already listed by SLICE-09, call 21) | BuyerEdge scores with no Greeks priced | If made, the twin sees delta, gamma and IV rank too; it is BuyerEdge's change, not this slice's |
| P-5 Statistics BuyerEdge does not compute | Proposal | — | Max pain, support and resistance from price, IV skew, term structure, India VIX, expiry-day flags. Each would be a new catalogue entry and a new input the model sees, so each is a strategy change for the owner |
| P-6 Baseline for the exam | Proposal | `evaluate` takes any named baseline; POL-044's `rule:ema_cross` is not enforced (SLICE-12 step 4) | Use `buyer_edge` as the twin's baseline (recommended), or `rule:ema_cross` |
| P-7 Production binding-flag read | Open (SLICE-12 step 6 as built) | A model strategy at `plan` or `trade` refuses `STR-R16` in production until `serve_strategy` can read the binding flag | Needed before any promotion can take effect live; not needed for observe-only |

## Fork calls

None is planned. The twin adds no money behaviour: BuyerEdge's code is not edited, and the twin's intents never reach a send.

One existing behaviour is recorded so the owner sees it: the host requests a review for **every** intent before it checks authority (`strategies/worker.py:733-735`, then `:736-738`; SLICE-09 Fork call 12). So a twin at `none` still asks for a review of each of its intents. With no review team bound (legacy live and the first release) that is an immediate `unavailable` and an alert in the kernel per twin intent. Not changed here; the step 3 deepening measures the count on one replayed day.

## Deviations

* **D-1 (step 2):** `RoleSpec` gains an optional `features` key (names from the catalogue), shown in `as_dict()` only when non-empty, as `callable_tools` is (`cognition/blueprint.py:253`, `:320-321`). A legacy-shaped blueprint keeps legacy's shape and digest. Legacy declared features on the worker spec (`src/runtime/worker_host/__init__.py:166-175` @445eb116), not on the team.
* **D-2 (step 3):** the consult filter sits where legacy's `should_consult` sat, on the strategy side before the model is asked (`src/runtime/worker_host/__init__.py:421-430` @445eb116, including "a filter that raises asks"), but its values come from an unbound refusing setting instead of literals in the strategy file (`src/strategies/ai_ema_cross.py`'s `worth_asking` @445eb116).
* **D-3 (step 3):** observe-only is enforced twice: by the row's authority `none` in the host (`strategies/worker.py:722`, `:736-738`) and by leaving the twin's `CandidateId` out of the standing binding, so a submit would be refused `ADM-R14 candidate_not_bound` by the kernel (`kernel/lifecycle.py:82-83`). Recording a decision still needs the twin's own `entry` grant (`kernel/policy.py:247-249`); the grant moves no money without the binding.
* **D-4 (step 3):** the twin computes BuyerEdge's statistics with its own scorer instance in its own process. Its stateful statistics (OI z-score, rejection zone, straddle and OI change history) match BuyerEdge's only because it scores every bar, consulted or not; after a restart of one host only, both reset (`reset_on_restart`) at different times. The report names any bar where the twin's recorded score differs from BuyerEdge's.

---

## Step 1 — audit (as built)

Every citation below was opened on 2026-11-14. OA_NEW paths are under `src/autonomous_trading/` at `a0c1bce`. Legacy paths are at `445eb116`; `BE` is legacy `src/strategies/buyer_edge.py` (the port's source, 2,527 lines), `MV` is legacy `src/runtime/market_view.py`. OA_NEW has no `.codegraph/` directory, so the search was by reading.

### 1a. What BuyerEdge actually uses

**Raw inputs, per bar (OA_NEW `strategies/buyer_edge.py`).** The view is resolved once per trigger, cut off at that window's confirmation instant (`strategies/worker.py:5-6`).

| Input | OA_NEW | Legacy |
|---|---|---|
| Chain rows: the oldest poll of the trigger minute, records in `seq` order | `BuyerEdgeInputs.chain_rows`, `:2500-2507` | `MV:848-860` |
| Flattened legs: per strike `ce_/pe_` `ltp`, `oi`, `volume`, `bid`, `ask`, `symbol`, lot size | `flatten_chain`, `:2085-2103` | `MV` (same function) |
| Spot: the first chain row carrying `spot`, else the bar close as fallback | `inputs_from_rows`, `:2120-2144`; fallback `:2616-2623` | `MV:739-802` |
| ATM strike, ATM CE and PE LTP, straddle, previous straddle, previous spot | `atm_of` `:2106-2117`; `inputs_from_rows` `:2131-2144` | `MV` |
| Spot bars (OHLC, volume) kept at or before the bar's stamp | `spot_frame`, `:2509-2541` | `MV:956-993` |
| Chain history for OI smoothing (default 5 minutes) | `scoring_at`, `:2639-2641`; `OIFlowAnalyzer.smooth_chain_rows` `:1067` | `BE:1111` |
| Greeks: **none priced** (delta, gamma and `gex_levels` absent); bid/ask feed the synthetic future only | `greek_kwargs`, `:2543-2569` (SLICE-09 Fork call 21) | `MV:627-663`; live never priced them (TASK-S09-08, 673 of 673 bars) |
| Fields a backfilled store cannot give | `ABSENT_FROM_BACKFILL`, `:2037-2038` | `MV:79` |

**Score components** (`SignalEngine.score`, `:1818-2001`; legacy `BE:1862`). Slow tier (spot bars), `INDICATOR_REGISTRY` `:1367`:

| Component | OA_NEW | Legacy | Uses |
|---|---|---|---|
| EMA Trend | `_compute_ema_trend` `:1259` | `BE:1303` | fast and slow EMA of close |
| RSI Momentum | `_compute_rsi_momentum` `:1283` | `BE:1327` | RSI of close |
| Spot vs VWAP | `_compute_spot_vs_vwap` `:1304` | `BE:1348` | session VWAP (hlc3; price-only when volume is 0) |
| RVOL-Simple | `_compute_rvol_simple` `:1337`, `score_max=0` `:1361-1365` | `BE:1381` | volume ratio; not applicable to index volume |

Fast tier (options statistics), `STATISTIC_REGISTRY` `:1771-1784` (legacy `BE:1815`):

| Component | OA_NEW | Legacy | Uses | Live today |
|---|---|---|---|---|
| PCR OI Level | `_compute_pcr` `:1374`; `compute_pcr` `:1154` | `BE:1418`, `:1198` | OI put/call ratio | yes |
| Call OI Flow / Put OI Flow | `:1388`, `:1402`; `classify_ce_flow`/`classify_pe_flow` `:1176`, `:1210` | `BE:1432`, `:1446`, `:1220`, `:1254` | OI change by side | yes, from depth 2 |
| OI Wall Position | `_compute_oi_wall` `:1414`; `call_wall`/`put_wall` `:1160`, `:1169` | `BE:1458`, `:1204`, `:1213` | highest-OI strikes | yes |
| Greeks Bias (Δ) | `_compute_delta_bias` `:1435` | `BE:1479` | ATM delta sum | **unavailable** (no Greeks) |
| Gamma Regime | `_compute_gamma_regime` `:1467` | `BE:1511` | `gex_levels` | **unavailable** (no Greeks) |
| OI Velocity | `_compute_oi_velocity` `:1526` | `BE:1570` | OI change series (`_has_oi_change_basis` `:1052`) | yes, from depth 2 |
| IV Regime | `_compute_iv_regime` `:1562`; `iv_rank` `:1811-1816` | `BE:1606`, `:1855` | CE/PE IV rank | **unavailable** (`score_kwargs` passes no IV rank, `:2070-2082`) |
| Straddle Velocity | `_compute_straddle_velocity` `:1602` | `BE:1646` | straddle change | yes |
| Synthetic Futures | `_compute_synthetic_futures` `:1630` | `BE:1674` | `sf_ltp` | only when a Greeks record exists (`:2547-2548`) |
| OI Z-Score (`score_max=0`) | `:1662` | `BE:1706` | rolling OI z | evidence only |
| OI Rejection Zone (`score_max=0`) | `:1698` | `BE:1742` | OI touches | evidence only |

**The decision and its refusal reasons** (`:1876-2001`; legacy `BE:1920-2008`): trap score from straddle contracting, IV rank > 60, synthetic-future basis, CE/PE spread, extreme PCR (`:1876-1901`); final score = fast score damped by slow disagreement (`:1907-1937`); `NO_TRADE` when fast coverage is below `min_fast_coverage` (`:1954-1963`), when trap > `max_trap` (`:1964-1967`), or below `WATCH_FACTOR × min_score` (`:1970-1973`); `WATCH` / `EXECUTE` (`:1968-1971`). Unscored bars name why: "no chain for this minute", "chain found but not usable", "no spot history at or before this minute" (`:2624-2637`). `to_intent` (`:2383-2479`) keeps the score, signal, trap, coverage, first four reasons and every unavailable component with its reason in an abstention's tags; **an ENTER's published Intent keeps only `signal_score`, `iv_rank` (None) and `conviction`** (`strategies/worker.py:628-643`), so BuyerEdge's reasons for an entry are not in the record today.

**What BuyerEdge does not compute (proposals only, P-5):** max pain; support and resistance from price; IV skew and term structure; India VIX; an expiry-day flag; any Greek beyond the unpriced delta and gamma. Gamma and IV rank **are** coded but receive no data (P-4). The GEX "shadow" is record-only and always reports no gamma (`gex_shadow`, `:2571-2610`).

### 1b. The closest existing model pattern

There is **one** model-driven mechanism, built in SLICE-09 step 6, and **no shipped model strategy**:

| Piece | Where | Reuse |
|---|---|---|
| `decision_method: "model"`; legacy kind `ai_worker` maps to it; a model descriptor must request `cognition.propose` and score `conviction_x100` | `strategies/registry.py:36-37`, `:266-267`, `:288-290`, `:302-303` | As is. OA_NEW has **no** `is_model_driven()` (legacy `src/runtime/strategy_host/registry.py:370`); the test is `descriptor.decision_method == "model"` (`bootstrap.py:411`, `strategies/worker.py:616`). Every kind is a process (`hosting` must be `process`, `registry.py:268`), so legacy's `is_out_of_process()` has no counterpart to get wrong |
| `ModelStrategy`: builds a `ProposalRequest` from the view, maps `propose` to ENTER and `abstain` to NOTHING | `strategies/model_strategy.py:17-52`, `create` `:65-68` | Subclassed. Its inputs are only raw `bars`, `spot`, `chain` (`:13-14`, `:22-40`) |
| `ProposalProducer`: no team → abstain `not_configured`; reuses a recorded proposal; runs a one-purpose team; records the run | `cognition/review.py:344-384` | As is |
| `intent_proposal` output: `direction` CE/PE, `conviction` 0…1, `reason` | `cognition/blueprint.py:43-50` | As is: "no trade" is an abstention |
| Test fakes: the scripted child (`raw:<output>`), the local HTTP server | `tests/unit/test_model_strategy.py:38-50`, `tests/unit/test_provider_records.py:272` | As is |
| Legacy's pairing | `src/strategies/ai_ema_cross.py` @445eb116 (`kind="ai_worker"`, `authority="none"`, `should_consult=worth_asking`), not ported (SLICE-09, "Not ported") | Pattern only (D-2) |
| Legacy's declared features | `WorkerSpec.features` and `src/runtime/features/` @445eb116 | Not ported; step 2 rebuilds the idea for BuyerEdge's statistics |

Gaps found: no shipped model descriptor; no declared feature list; no consult filter; proposals have no channel route and `serve_strategy` passes no proposals port, so a model strategy refuses `STR-R15` in production today (`bootstrap.py:411-412`, `:1532-1563`); `serve_cognition` binds no teams (`bootstrap.py:1587`); the research replay feeds a model strategy only queued proposals (`bootstrap.py:1614-1631`, `:1880`) and records an empty prompt identity (`research/replay.py:1684-1685`).

### 1c. Each deliverable: built or not

| Deliverable | State | Where |
|---|---|---|
| Registry row with model method | **Mechanism built**; no `ai_buyer_edge` descriptor; rows are the owner's | `strategies/registry.py`; step 3 |
| Blueprint | **Built** (validation, pins, digest, `intent_proposal`); no shipped team | `cognition/blueprint.py`; step 3 |
| Declared inputs, each with source and instant | **Partly**: `ToolResult` carries source, `observed_at`, `view_id` (`cognition/tools.py:38-60`); `features` scope exists but empty (`:17-18`); no catalogue | Step 2 |
| Prompt grounded in options statistics | **Not built**: the prompt is the pinned instruction (SLICE-09 step 5); none exists | Step 3 |
| Consultation records (model, prompt, inputs, output, cost, status) | **Built**: request record with inputs and pins, attempts with `effective_model`, tokens, `cost: unpriced` (`cognition/providers.py:719`), run record | `cognition/records.py`; reuse |
| Abstain on slow, cut off, unavailable | **Built**: `timeout`, `backend_error`, `provider_error`, `not_configured`, `replay_gap` (`cognition/providers.py:51`, `:180-191`, `:946`); any non-result run abstains (`cognition/review.py:325-336`) | Reuse; step 3 tests it for the twin |
| Fake provider | **Built** (scripted child, local HTTP server) | Reuse |
| Observe-only authority | **Built**: row `none` never submits (`strategies/worker.py:722`, `:736-738`); ADM-R14 for an unbound candidate (`kernel/lifecycle.py:82-83`) | Reuse (D-3) |
| Views through the same path | **Built**: an ENTER becomes the same `Intent` as BuyerEdge's (`strategies/worker.py:628-643`), published and recorded with the kernel | Reuse |
| `setup_fresh` isolation | **Built**: per strategy and session (`kernel/policy.py:308-317`), so the twin's decisions cannot change BuyerEdge's | Reuse; a break check in step 3 |
| Consult filter, unbound settings | **Not built** | Step 3 |
| Side-by-side replay | **Partly**: the harness runs one host (`tests/replay/replay_harness.py:317-371`), night skip built (`:238-247`, `:292-301`) | Step 4 |
| Agreement, skill vs coin flip, net value | **Statistics built** (`wilson_interval`, `report_from_labels`, `evaluate_gate` in `research/evaluation.py`); no report joins two strategies | Step 4 |
| Candidate freeze | **Built** (`CandidateRegistry`, `research/candidates.py`; model identity `:731-742`, `candidate_id("model")` `:745-760`) | Step 5 |
| Evaluation on locked held-out data | **Built** (`evaluate`, locked access, disclosure); **needs quote data**: `ReplaySource.specs` refuses a non-quote fill (`research/replay.py:1815-1816`), and the August days have no bid/ask (SLICE-15 D-3) | Step 5 on a synthetic quote store; real exam waits for recorded days with quotes |
| PromotionRecord, owner approval, lowest authority first | **Built** (`research/promotion.py:112`, `:218`; `requires_promotion` `strategies/registry.py:439-442`; `STR-R16` `bootstrap.py:413-417`); production flag read open (P-7) | Reuse |
| Promotion bar | **Unbound by design** (`settings/schema.py:186-188`) | Not set |
| Docs | Not built | Step 6 |
| Optional: second opinion | Free once step 4 joins the two hosts' decisions per bar | **Build** (step 4) |
| Optional: explain mode | Record-based explanation is small (the twin's features carry BuyerEdge's score, signal, trap and reasons for every bar, ENTER included); a model-written one is a new run purpose | **Build** the record-based one (step 4); model-written is P-2 |
| Optional: regime report | Needs regime thresholds and more days | P-3 |

---

## Step 2 — declared inputs (outline)

### Decisions

* **The catalogue (`cognition/tools.py`).** `FEATURE_NAMES`, a fixed tuple: BuyerEdge's raw statistics (spot, ATM strike, ATM CE/PE LTP, straddle and its change, PCR, call and put wall, CE and PE OI flow class, OI velocity, VWAP and spot's distance from it, fast and slow EMA, RSI, synthetic-future basis when present) and BuyerEdge's own outputs (each component's score, `score_max`, availability and unavailable reason; the final score, signal, trap score, fast coverage, first reasons). Names only: `cognition` imports nothing from `strategies` (SLICE-09 step 7's boundary). A test pins that the strategy computes exactly this set.
* **Each value** is `{"value", "source", "as_of"}`: `source` names the BuyerEdge function that produced it (for example `buyer_edge.OIFlowAnalyzer.compute_pcr`), `as_of` is the trigger's stamp. The `features` `ToolResult` keeps the view's `view_id` and the confirmation instant as `observed_at`.
* **The declaration (`cognition/blueprint.py`, D-1).** `RoleSpec.features`, optional, a list of distinct catalogue names; a name outside `FEATURE_NAMES` refuses `"role {name!r} names an unknown feature"`; `features` without `"features"` in `input_scope` refuses. Shown in `as_dict()` only when non-empty.
* **What a role sees (`role_inputs`, `cognition/tools.py:81-97`).** For the `features` scope, only the role's declared names, in declared order. An undeclared statistic never reaches the packet, the prompt or the record of what the model was shown.
* **No look-ahead.** Every feature is computed from the trigger's view (one view per trigger, cut at the confirmation instant) and BuyerEdge's `spot_frame` limit (`strategies/buyer_edge.py:2509-2541`). Nothing reads a later record.

### Tests (`tests/unit/test_declared_features.py`)

| Test | Proves |
|---|---|
| `test_role_features_validated` | Unknown name, duplicate, `features` without the scope, each refused with its text; an empty list keeps the legacy shape and digest |
| `test_role_sees_only_declared_features` | A role declaring three names gets exactly those three, in order |
| `test_every_feature_names_its_source_and_instant` | Every value has a non-empty `source` and `as_of` equal to the trigger |
| `test_no_look_ahead_on_features` | Features for bar *t* are identical whether or not records after *t* (spot, chain, a later poll of the same minute) exist in the store |

**Break checks (at least):** drop the filter in `role_inputs`; accept an unknown name; read the view's last record instead of the trigger's.

### Files

`cognition/tools.py`, `cognition/blueprint.py`, `tests/unit/test_declared_features.py`.

---

## Step 3 — the twin (outline)

### Decisions

* **`strategies/ai_buyer_edge.py`.** `DESCRIPTOR`: `id` `ai_buyer_edge`, `family` `options_buyer`, `version` `"1"`, `implementation` `strategies.ai_buyer_edge:create`, `code` the modules it reaches (`ai_buyer_edge_team`, `buyer_edge`, `model_strategy`, `worker`; the registry checks this equals what it imports, `registry.py:264`), `decision_method` `model`, BuyerEdge's underlying, timeframe, higher timeframes, warm-up and input requirement (consumer `ai_buyer_edge`), **`view_policy` `buyer_edge`** so both hosts resolve the same views, `score_source` `conviction_x100`, state `in_memory` / `reset_on_restart`, capabilities as BuyerEdge's plus `cognition.propose`, `requested_authority` `none`.
* **The object.** `AiBuyerEdge(ModelStrategy)` holds its own `BuyerEdge` scorer and scores **every** bar (D-4). It builds the catalogue's values from that scorer's `ScoringView` and `SignalResult`, adds them as the `features` input, then applies the filter. Filter says no: `Signal("NOTHING", …, reason "not consulted: filter", tags {features summary})`, no model call. Filter raises: ask (legacy). Filter says yes: `ModelStrategy.decide`. An unscored bar (no chain, no spot history) is NOTHING with BuyerEdge's own reason and no model call.
* **`strategies/ai_buyer_edge_team.py`.** A literal `TEAM`: one required lead role, `backend` `http`, `input_scope` `["features", "bars", "spot"]`, declared `features`, `output_schema` and `result_schema` `intent_proposal`; and its instruction: what each declared statistic means (one line each, from BuyerEdge's own notes), that the answer is CE, PE or abstain with a conviction and a reason naming the statistics used, and that it chooses nothing else. Kept under 4,096 characters (`cognition/blueprint.py:696-697`). Being a module in `code`, its bytes are part of the twin's `CandidateId`, so a changed prompt or blueprint is a new candidate. `model` and `url` are not in it; they come from the owner's profile.
* **Reason check.** The output schema is unchanged. The report counts reasons that name no declared feature; it never refuses one.
* **The filter's settings.** `strategies.consult_filters` (a mapping keyed by strategy id, bound in the profile like `strategies.registry`). `compose_strategy_host` refuses `RefusingParameterUnbound("strategies.consult_filters.ai_buyer_edge.<name>")` before anything opens when the twin's entry or any of its names is unbound. The names are fixed at deepening from the module's literal list (signal set, score floor). Nothing ships a value.
* **`registry.is_model_driven(registration) -> bool`**: `decision_method == "model"`, so the AGENTS trap has a named answer.

### Tests (`tests/unit/test_ai_buyer_edge.py`)

| Test | Proves |
|---|---|
| `test_descriptor_registers_as_model_driven` | The production registry reads the twin; `is_model_driven` true; with a row `kind: ai_worker` it registers; `requires_promotion` false at `none`, true at `plan` |
| `test_features_equal_buyer_edge_on_the_golden_walks` | On `tests/fixtures/strategies/buyer_edge_golden.json`, the twin's recorded score and signal equal BuyerEdge's bar by bar |
| `test_filter_refuses_unbound_and_gates_the_call` | Unbound: `compose_strategy_host` refuses before opening; bound (synthetic): only matching bars reach the provider (launch log counts) |
| `test_a_raising_filter_asks` | Legacy's rule |
| `test_abstains_on_timeout_backend_error_and_no_key` | Local server sleeping past the role deadline → `timeout`; malformed JSON reply → failure status; no key → `not_configured`; each a NOTHING whose tags name the run and cause, and a recorded run |
| `test_consultation_record_is_complete` | The request record holds the declared features only; the attempt holds `effective_model`, tokens, `cost`, status; the run record its prompt digest via the pin |
| `test_observe_only_never_submits` | At `none`: an ENTER is published and recorded, never submitted; the kernel holds no command for it; a forced submit is `ADM-R14` |
| `test_twin_does_not_change_buyer_edge_setup_fresh` | Interleaved twin ENTERs leave BuyerEdge's `setup_fresh` answers unchanged |
| `test_prompt_names_only_catalogue_features` | Every statistic named in the instruction is in `FEATURE_NAMES` and declared |

Also re-run `tests/unit/test_buyer_edge_parity.py` (BuyerEdge unchanged) and `tests/unit/test_model_strategy.py`, `tests/unit/test_strategy_registry.py`, `tests/contracts/test_capabilities.py` (the boundary scan over the new modules).

**Break checks (at least):** the filter skipped; the twin scoring only consulted bars; a twin at `none` submitting; the twin's candidate added to the binding; a timeout read as CE; an undeclared feature shown.

### Files

`strategies/ai_buyer_edge.py`, `strategies/ai_buyer_edge_team.py`, `strategies/registry.py` (`is_model_driven`), `bootstrap.py` (`compose_strategy_host` filter refusal, `consult` passed to `create`), `settings/schema.py`, `settings/loader.py`, `tests/unit/test_ai_buyer_edge.py`.

---

## Step 4 — side by side, and the comparison report (outline)

### Decisions

* **One replay, two hosts** (`tests/replay/replay_harness.py`). `build(..., strategies=("buyer_edge", "ai_buyer_edge"))`: one ledger, one market store, one driver stepping both hosts each pass. BuyerEdge's row as today (`trade`, synthetic); the twin's row `none`; the binding holds **only** BuyerEdge's candidate; each strategy has its own `entry` grant (D-3). The twin's proposals come from a `ProposalProducer` over the fake provider (scripted child or local server), labelled synthetic. Test support only, never in `bootstrap.COMPOSITIONS`.
* **BuyerEdge unchanged by the twin's presence.** BuyerEdge's decisions, commands and fills on a day with the twin equal those on the same day without it.
* **The twin's own trades, for net value.** A second, rehearsal-only run of the twin alone at `trade` against the same fake OpenAlgo, with its candidate bound and a synthetic `binding_flag` that answers true. Same planner, same fill rule as BuyerEdge's run, so the two nets compare. Never a production path; the rehearsal guard applies.
* **The report** (`tests/replay/compare_twin.py`, JSON plus a short text):
  * per bar: BuyerEdge's signal, score and first reasons (from the twin's features, so ENTER bars are explained too), the twin's view or "not consulted", agreement;
  * agreement table (both enter the same side / opposite sides / one enters / neither);
  * direction skill of each strategy's entries against the underlying's later move, by legacy's labelling rule (`FLAT` 0.0002) at the bound horizons, with the Wilson interval against 0.5 (`research/evaluation.py`), refusing when `promotion.directional.*` is unbound;
  * net rupees and trade counts from closed trades, BuyerEdge from run A, the twin from run B, costs by the bound `costs.*`;
  * consultations, abstentions by cause, reasons naming no declared feature;
  * the label `REPLAY_LABEL` and a fixed line: "Five days are too few to judge skill or value; this report decides nothing."

### Tests (`tests/replay/test_twin_replay.py`)

| Test | Proves |
|---|---|
| `test_synthetic_afternoon_two_hosts_reconcile` | Both hosts run on the synthetic afternoon; books and ledger reconcile; the twin has no command |
| `test_buyer_edge_identical_with_and_without_the_twin` | Decisions, commands and fills equal |
| `test_report_on_synthetic_labels` | Hand-written labels give the expected agreement, hit rate and interval |
| `test_report_refuses_unbound_horizons` | `promotion.directional.*` unbound → refused, nothing written |
| `test_converted_day_side_by_side` (`replay` mark, needs `AT_REPLAY_DATA`) | One NIFTY day, both runs, report written |

The five-day report is run by hand once with `AT_REPLAY_DATA` and its output saved under `docs/measurements/`.

**Break checks (at least):** the twin's candidate bound in run A; BuyerEdge's grant shared with the twin; agreement counting "not consulted" as NOTHING-agreement; skill computed over all bars instead of entries.

### Files

`tests/replay/replay_harness.py`, `tests/replay/compare_twin.py`, `tests/replay/test_twin_replay.py`, `docs/measurements/slice-17-twin-five-days.json` (by hand).

---

## Step 5 — one frozen version and its exam (outline)

### Decisions

* **A real proposal port in the research replay.** `compose_replay_engine` and `ReplayEngine` accept an optional proposal producer for a model strategy (default stays `QueuedProposals`, `bootstrap.py:1880`), composed with `compose_cognition_replay` over staged records or the fake provider; the engine still binds no OpenAlgo adapter and never sends.
* **The prompt identity.** The receipt's `prompt_identity` is the twin team's instruction digest (today the empty digest, `research/replay.py:1684-1685`).
* **The model identity bundle** (`research/candidates.py:731-742`): `strategy_family` `options_buyer`; `model_spec_digest` the team blueprint's digest; `model_artifact_digest` the digest of the pinned provider configuration less `url` and secrets (provider model name, temperature, `max_tokens`); `candidate_generator_identity` and `acceptance_rule_digest` as SLICE-12 fixes them. Mapping fixed at deepening; nothing here invents a gate.
* **The freeze and the exam.** Freeze `CandidateBundle/v1` of the twin's files and team; evaluate it with `research/evaluation.evaluate` on a **synthetic quote store** (labelled), baseline `buyer_edge` (P-6, unless the owner chooses otherwise). The locked held-out exam on real data waits for recorded days with bid/ask from the new server; the August days cannot be used (no quotes) and five days are too few.
* **The report** (`research/evaluation.py` output plus a short text): the evaluation record, gate, bar verdict (refusing while `promotion.bar.*` is unbound), and the exact `CandidateId` an owner would approve. Promotion itself is the existing PromotionRecord path, owner-approved, `none` → `plan` → `trade`, one step per record.

### Tests (`tests/unit/test_twin_candidate.py`)

| Test | Proves |
|---|---|
| `test_replay_engine_runs_the_twin_with_a_proposal_producer` | The engine's twin decisions come from the producer; receipt `prompt_identity` is the team's |
| `test_candidate_id_changes_with_the_prompt` | Editing the team literal changes the host's `CandidateId` |
| `test_twin_freezes_and_is_evaluated_on_synthetic_quotes` | Freeze, evaluate, disclosure written; bar refuses unbound |
| `test_promotion_record_needs_the_exact_version` | A record for another `CandidateId` is refused by the kernel; at `plan` without a record `STR-R16` |

**Break checks (at least):** empty prompt identity kept; the team module left out of `code`; the engine falling back to queued proposals when a producer is given.

### Files

`bootstrap.py` (`compose_replay_engine`), `research/replay.py`, `tests/unit/test_twin_candidate.py`.

---

## Step 6 — live observation and docs (outline)

### Decisions

* **The proposal route.** `ReviewCore` gains a `propose` request beside the review request; `ReviewChannelClient` gains `propose`; `serve_strategy` passes it as the proposals port for a model descriptor (today none, so `STR-R15`). `serve_cognition` composes a `ProposalProducer` with the twin's team, built from the shipped literal and the owner's profile pins; an unbound `model`, `url` or key leaves the twin abstaining `not_configured`, never refusing the kernel.
* **Docs.** `docs/operations.md`: what the twin is, its row at `none`, the filter settings, how to read the comparison and evaluation reports, how promotion works and that the bar is the owner's. `docs/decisions.md`: D-1…D-4.
* **Live observe** runs only after SLICE-15 step 7 sessions in `analyze`, on the owner's word.

### Tests

`test_propose_over_the_review_core_in_process` (the core's handler without sockets) on this PC. Waiting rows for SLICE-15 step 7: the propose route over the real Unix channel with `SO_PEERCRED`; the twin host as its own unit beside BuyerEdge's; one `analyze` session with the twin at `none` and its consultations recorded.

### Files

`adapters/unix_channel.py`, `bootstrap.py` (`serve_strategy`, `serve_cognition`), `docs/operations.md`, `docs/decisions.md`, tests beside the existing channel tests.

---

## Completion conditions

The registry reads `ai_buyer_edge` as model-driven; its blueprint and prompt ship; its inputs are declared and shown only as declared; tests prove no look-ahead, abstention on every failure status, views through the same intent path with no authority, and BuyerEdge unchanged; the single-day comparison report and the synthetic-quote candidate evaluation report are produced; docs are written; the waiting rows are listed in SLICE-15 step 7. No score, threshold, entry gate, bar or money value is set. "As built" is recorded per step.
