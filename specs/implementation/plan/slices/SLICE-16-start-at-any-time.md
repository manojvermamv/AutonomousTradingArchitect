# SLICE-16 — Start at any time: late starts, mid-session restarts, partial days and windowed research

* **Status:** proposed (2026-11-14). Step 1 (the audit) is built: it is this file's [Step 1 — audit (as built)](#step-1--audit-as-built). Steps 2–5 are outlines in the standing rules' sense: each step's exact detail is written just before it is built, reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
* **Why this slice exists.** The owner wants the operator or a timer to start, stop, restart or recover any part of the new system (kernel, market host, strategy host, cognition, operator, supervisor, observer, research jobs) at any minute between the exchange's open and close, not only at 09:15. Behaviour must be correct, and nothing may be re-sent or lost.
* **Precedence:** the master README, then the ROADMAP, then this package. Authorities: the [market-data spec](../../design/market-data-and-canvas.md) (calendar, views, quality), the [strategies spec](../../design/strategies-and-cognition.md) (host, warm-up), the [sessions and recovery rules](SLICE-03-sessions-authority-recovery.md) with Q-009, and the [migration spec](../../design/migration-recovery-rollback-continuity.md). Every intentional difference from legacy is marked **Deviation**. Every money-touching fork keeps legacy's live behaviour at 445eb116 and is marked **Fork call**. **No score, threshold, entry gate or money value is set or changed here.**
* **Owner answers applied:** Q-009 (`recovery.routine_advance: standing`: a clean same-host restart resumes by itself; a restore, a host change or a `RECOVERY_GAP` needs a human `RECOVERY_ADVANCED` and the fence); Q-006 revisited (`accounting_only`, 2026-11-14); Standing rules (2026-10-30); Server lost: start fresh (2026-11-13).
* **Builds on:** OA_NEW `agentic-desk` at `a0c1bce` (SLICE-08…15 as built). Branch `slice-16`, cut from `agentic-desk`.
* **Environment.** Class S, the owner's Windows PC only: no WSL, no server, no credential, no broker, no money. OpenAlgo is the SLICE-15 fake on loopback. Replays use the five converted days in `OA_NEW/run/replay-data/2026-08` (`AT_REPLAY_DATA`). A NIFTY day takes 321–813 s on this PC (SLICE-15 step 6, p50 509 s), and five days take 50 min to 2 h 20 min. So most tests are unit tests or short replay windows, and the full matrix runs once per acceptance. Linux-only checks become rows in [SLICE-15's waiting list](SLICE-15-fresh-start.md#linux-only-rows-waiting-for-the-new-server) (listed under each step).

**In plain words.** Most of this already works. The kernel opens a session at any minute of the day. A restart resumes from the ledger, and an earlier process's unsent entries are refused, never re-sent. Protection, the loss latch, holds, kill and reservations all live in the ledger. A market restart already writes a "stopped" gap. The gaps are smaller:

1. Views and the strategy do not say plainly how much of the day they hold.
2. Special and short sessions are not read from the recorded calendar.
3. A late start has nothing earlier than its first poll.
4. Research works only on whole days.
5. Nobody has replayed a late start or a mid-day restart on real data.

Step 2 fixes the calendar and the day coverage. Step 3 handles the late start. Step 4 proves late starts and restarts on the converted days. Step 5 adds windowed research. Nothing here changes how the system trades unless the owner answers a fork call below.

## Fork calls for the owner (answer before building)

Each one keeps legacy at 445eb116 unless the owner chooses otherwise. Two block a step; the rest only need an answer before live use.

| # | Blocks | Question | Legacy at 445eb116 | Proposed default (legacy) |
|---|---|---|---|---|
| F-4 | Step 3 | Does the strategy host start through legacy's start gate? This covers the calendar `ExecCondition` and the session preflight, and whether a missed timer fires on a late boot. | `deploy/systemd/at-strategy.service:46-50` skips the start on a holiday or an unknown calendar (`deploy/session_calendar.py`), and `session_preflight.py` refuses a start that would record nothing. `at-strategy.timer:16-19` fires Mon–Fri with `Persistent=false`, so a box booted after the start time waits for the operator. | Carry the calendar skip: on a holiday or an unknown day the host exits 0 and records why. The kernel already refuses those sessions, so no money changes. Keep `Persistent=false`. For the preflight, carry each legacy check that maps onto the new stores, as a refusal (legacy). The alternative is report-only, which would be a Deviation. |
| F-6 | Step 5 | May a windowed or partial-day research result count towards promotion (locked exam days, effective sample)? | Research is whole days only; nothing partial exists to count. | Never counted. Windowed results are exploratory, and promotion and the locked exam stay whole-day. |
| F-1 | — | Should the system poll and trade in a special session (muhurat, weekend) or after the regular hours? | Polls only on weekdays 09:00–15:59 (`src/interfaces/mcp/core/scheduler.py:174-178`, `* 9-15 * * mon-fri`), skipped after the close (`marketpull.py:888-896`). The strategy timer runs Mon–Fri only. | No. Step 2 only reads the recorded session for views and ends polls at an early close. Start hours stay legacy's. |
| F-2 | — | On an early-close day, should the framework square off before the day's close? | It squares off at the policy's fixed time (`src/runtime/session_close.py:116-117`, default 15:13). After an early close the broker's square-off backstops. | Policy time unchanged (`kernel/protection.py:1301-1330` already matches). |
| F-3 | — | After a late start, may BuyerEdge read the day's earlier minutes fetched from history? | There is no same-day backfill: `marketheal.py:43-58` heals past spot days only. BuyerEdge's tape is the tick bars recorded since its start (`runner.py:96-102`). | No. Step 3 records the backfill as labelled `history_bar` data, and BuyerEdge's view policy keeps `bars: ticks`. |
| F-5 | — | (Information.) After a restart, BuyerEdge's in-memory scorer state and the drawdown-rate window start empty, so decisions after a restart can differ from an uninterrupted run. | Per-process in both: `src/strategies/buyer_edge.py:2494-2504` and `src/runtime/session_state.py:227-234`. | No change. OA_NEW matches (`strategies/worker.py:588-601`, `kernel/admission.py:399`, `:559-564`). Step 4's comparisons account for it. |

## Steps

| Step | Builds | Reuses | Proofs |
|---|---|---|---|
| 1 | The audit: every place that assumes a full day, a 09:15 start or a complete set of bars, and which deliverables are already built | — | This file (as built) |
| 2 | The recorded session and the day coverage. `SessionTiming` is built from the recorded `trading_day` fact. Quality's expected windows follow it. Each view gets `day_coverage`. Polls and the host stop at the recorded close when it is earlier. | `StoreMarket.trading_day` (`market/view.py:985-1009`), `quality._expected`, coverage rows | Unit tests (named in step 2) |
| 3 | The late start. The market host backfills the day's missed spot minutes as labelled `history_bar` records (never ticks, chain or Greeks, and never an outage). `BarContext.day` and a per-window coverage record go in the host. The start gate follows F-4. | `OpenAlgoMarketSource._history_bars` (`adapters/openalgo.py:868`), the host store | Unit and integration tests |
| 4 | The replay proofs on the converted days. Starts at 09:15, 09:16, 10:30, 12:00, 14:00, 15:12 (after `no_new_trade_after` 15:10) and 15:14. Restarts mid-day with an open position and with a pending send, a market outage, a strategy-host restart and a human advance. | SLICE-15 harness (`tests/replay/`), `_compose_kernel(fault_plan=…, receipt=…)` | `-m replay` matrix; synthetic always-run versions |
| 5 | Windowed research: any day ranges, intraday windows, a few minutes, non-contiguous slices and gappy data. Nothing looks ahead, and each result records its windows and the data it used, in custody. | `ReplaySpec.session_open/close` and `clock_identity` (`research/replay.py:1451-1466`, `:1689`), `datasets.build` | Property tests (hypothesis); golden identity unchanged |

**Order.** Step 3 needs step 2's `DayCoverage`. Step 4 needs both. Step 5 shares no files with 2–4 and may be built in parallel by a second agent once F-6 is answered.

## Deviations

* **D-1 (no `Host.session_now`):** the owner's goal names a `Host.session_now` seam. None exists under that name. Every participant takes time from the injected `Clock` (`contracts/clock.py:48-51`). The calendar's fixed offset turns that time into exchange time (`contracts/market.py:253-258`), and the host's time zone is never used, apart from BuyerEdge's copied `get_ist_now` (`strategies/buyer_edge.py:1012-1024`), which is bound to the bar's stamp during scoring (`:2692-2705`). That seam is kept. No new one is added.
* **D-2 (one calendar table):** "any exchange calendar" is served by the `CALENDARS` table (`contracts/market.py:275`) plus the recorded facts (holidays, special and shortened sessions from OpenAlgo's timings and holidays, `market/ingest.py:359-430`, each fact naming its `source`). No second exchange is added: none has a facts source yet. The fixed IST constants in about 15 modules (for example `kernel/admission.py:18`, `market/store.py:29`, `research/rl/environment.py:162`) are left. They equal the one calendar's offset, and the research and RL ones are part of identities bound to legacy (`research/rl/environment.py:180-188`).
* **D-3 (cognition's retry clamp):** `secs_to_session_close` (`cognition/providers.py:246-252`) keeps the regular close. Cognition opens no market store, and the clamp only delays a retry. No money is involved.
* **D-4 (no coverage in prompts):** the production review producer has no context reader and no teams (`bootstrap.py:1587`), so no prompt sees bars. Adding a coverage field to a model's prompt would change model input. That waits until a context reader is built, and then it is a Fork call.

---

## Step 1 — audit (as built)

**Built** 2026-11-14 against OA_NEW `a0c1bce`. OA_NEW has no `.codegraph/` index, so the audit used `grep` and read every cited line. Legacy lines are read with `git show 445eb116:<path>` in `OA`.

Marks: **C** correct already. **D** defect. **M=** money behaviour that already matches legacy (no change). **M?** money behaviour, a fork call candidate.

### Calendar, windows, bars, views and quality (SLICE-08)

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 1 | `contracts/market.py:229-275` | One calendar `nse-fo/v1`, regular hours 09:15–15:30, Mon–Fri. It labels windows; the kernel's sessions come from recorded facts (row 12). | C |
| 2 | `contracts/market.py:286-306` | `SessionTiming` (open, closed, special, unknown) is defined and unit-tested (`tests/unit/test_market_windows.py:68-77`) but **never built** in `src/`, so special and shortened days never reach a view | D |
| 3 | `contracts/market.py:637-638`; `market/view.py:119` | Views use the one-minute base. Higher bars are resampled to the descriptor's `timeframe`, and the warm-up is the descriptor's `warmup_bars`. Bar size and warm-up are already settings. | C |
| 4 | `market/quality.py:46-48` | `session_reset` must be True: warm-up counts from the session's first window | M= `src/core/framework/runtime/runner.py:96-102` |
| 5 | `market/quality.py:98-111`, `:164` | Expected windows come from the regular hours, labelled `regular_hours`. A late start is reported correctly (windows before the start count as gaps), but an early close or a special session is not. | D |
| 6 | `market/ingest.py:120`, `:181-186`, `:298-312` | Polls run on weekdays from 09:00 to the regular close. A special session is never polled, and an early close is polled until 15:30. | M? F-1 (`scheduler.py:174-178`; `marketpull.py:888-896`) |
| 7 | `market/ingest.py:160-179` | A restart writes an `interrupted`/`process_stopped` row for each stream since its last row | C |
| 8 | `market/ingest.py:201-202`, `:223-224`, `:254-256` | An empty fetch is a `gap` row and a failed one an `interrupted` row; nothing is filled in | C |
| 9 | `market/ingest.py:501`, `:519-531` | Tick watch only in hours 9–15 on weekdays (legacy's `*/5 9-15`) | M? F-1 |
| 10 | `market/ingest.py:503`, `:533-536` | Reference facts are recorded from 09:05 until stored, so a late start records them at once | C |
| 11 | `adapters/openalgo.py:855-866` | History is used only to repair a broken quote row inside a poll. A late start has nothing before its first poll. | M? F-3 (`src/interfaces/mcp/core/marketheal.py:43-58`, past days only) |
| 12 | `market/view.py:980-1009` | The calendar port reads the recorded `trading_day` fact: a window means open, `open: false` is a holiday, no fact means unknown. It fails closed. | C |
| 13 | `market/view.py:1012-1020` | `coverage(view_id, instrument)` returns the day's raw coverage rows through the view's head | C (raw rows only; see 14) |
| 14 | (absent) | No view or decision says how much of the day it covers: first and last window, expected against present, gaps, interruptions | D |

### Strategy host and BuyerEdge

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 15 | `strategies/worker.py:511-532`; `kernel/admission.py:1019-1026` | A start walks every recorded bar after the scope's last trigger. A late start therefore decides the morning's recorded bars, and their ENTERs are refused as stale at B1 (`ADM-R05`). | M= `scripts/run_framework_live.py:108-122`, `:7728`, `:8103-8106`, `:8119-8127` |
| 16 | `strategies/worker.py:548-551` | Warm-up counts the bars present from the day's first recorded bar. After a late start BuyerEdge's first decision is 20 bars later. | M= `runner.py:96-102` |
| 17 | `strategies/worker.py:588-601`, `:820-823`; `strategies/buyer_edge.py:2654-2662` | `reset_on_restart`: one engine per process and date, journalled `STATE_RESET host_restart` | M= `src/strategies/buyer_edge.py:2494-2504` (F-5) |
| 18 | `strategies/worker.py:476-483` | `serve` stops at the regular close, not the day's recorded close | D (minor; special sessions are F-1) |
| 19 | `strategies/worker.py:118-128` | `BarContext` carries no fact about how much of the day exists. A partial day is invisible to a strategy and its record. | D |
| 20 | `strategies/buyer_edge.py:1012-1024`, `:2692-2705` | `get_ist_now` reads the host's time zone, but scoring binds it to the bar stamp | C |
| 21 | `strategies/buyer_edge.py:2018-2029` | Bound to NIFTY; the framework is multi-underlying (`MarketLoop(instruments=…)`, `market/ingest.py:145-151`) | C |
| 22 | `deploy/systemd/at-strategy-host.service:1-3`, `:20` | No calendar `ExecCondition` and no session preflight: "SLICE-09's" to decide, never decided. SLICE-15's waiting row names a check that does not exist. | M? F-4 (`deploy/systemd/at-strategy.service:46-50`) |
| 23 | `deploy/systemd/at-strategy-host.timer:7-8` | Weekdays at the session-start time, `Persistent=false` | M= `deploy/systemd/at-strategy.timer:16-19` |

### Cognition

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 24 | `bootstrap.py:1587`; `cognition/review.py:196-228` | The production review producer has `teams={}` and `context=None`, so every review answers `required_role_failed`. Nothing depends on the session start or a full day. Records are idempotent by `intent_ref` (`review.py:202-203`). | C |
| 25 | `cognition/providers.py:246-252` | The Retry-After clamp uses the regular close | D (kept, D-3) |
| 26 | `cognition/providers.py:545-570` | The rule backend's "session high/low" is the range of the bars it is given, whatever part of the day that is | M= legacy rule (RU:47-225, as cited in the file) |

### Kernel: sessions, recovery, protection, latch, holds, reservations, costs

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 27 | `kernel/lifecycle.py:184-206` | A session opens at any instant inside the recorded day (`open_time <= now < close_time`); holiday and unknown are refused. Tested: `test_late_start_opens_late`, `test_restart_mid_session` (`tests/recovery/test_session_transitions.py:66`, `:72`). | C |
| 28 | `kernel/recovery.py:181-220`, `:344-382` | Recovery stages and Q-009's routine checks: standing, previous epoch advanced, same host and no restore, no fence owed, unchanged release, leases, no unusable evidence, the 24-hour limit, no rollback. No time-of-day dependency. | C |
| 29 | `kernel/host.py:286`; `kernel/coordinator.py:620-635` | At start, entries an earlier epoch admitted but never sent are refused, never sent (Fork call K). Pending attempts resolve through `coordinator.recover`, crash points CP-D1, CP-P1…P4, CP-B1…B5 (`tests/recovery/test_crash_boundaries.py:255-592`). | M= (SLICE-11 Fork call K) |
| 30 | `kernel/safety.py:160-175`, `:484-525` | The latch is computed per session from the broker's day P&L. Its state lives in the ledger, so a restart re-evaluates without tripping twice. `inert` reads `not_evaluated` until the first fresh book after a start (`:462-476`). | C |
| 31 | `kernel/admission.py:399`, `:559-564` | The drawdown-rate window is per process, so a restart empties it | M= `src/runtime/session_state.py:227-234` (F-5) |
| 32 | `kernel/admission.py:408-417`, `:441-566` | Session statistics are read from the ledger by trading date, so they survive a restart | C |
| 33 | `kernel/protection.py:987-1039`, `:1041-1054` | The trail reads ladder state from the ledger and closes since the first fill. A missed span is a `GAP_PEAK_RECORDED` (record-only). | C |
| 34 | `kernel/protection.py:1301-1330` | The square-off is at the policy's time on the trading date, not the day's recorded close | M? F-2 (`src/runtime/session_close.py:116-117`) |
| 35 | `kernel/selection.py:560` | The kernel holds no cost-filter state (economics cost 0, as legacy), so a restart has nothing to restore | C |
| 36 | `kernel/safety.py:329-447`; the ledger's reservation rows | Kill, holds and reservations are ledger rows, so they survive a restart. Kill inputs are checked at start (`kernel/recovery.py:222-230`). | C |

### Research

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 37 | `bootstrap.py:2263-2276` | The dataset replay fixes every day at 09:15–15:30, ignoring the recorded session | D |
| 38 | `research/replay.py:1451-1466`, `:1671-1693` | `ReplaySpec` has any `session_open/close` and records them in `clock_identity`. This is the hook for windows. | C |
| 39 | `research/datasets.py:755`; `research/trials.py:197`, `:741-816`; `research/evaluation.py:891-900`, `:2164-2185` | Datasets, trials, the evaluation and the locked exam are whole days only | D (deliverable 4 not built) |
| 40 | `research/rl/environment.py:163-164`, `:180-188`; `research/rl/policy.py:836-837`, `:936-937` | NSE's regular session is part of the policy identity bound to legacy's `history.py` | C (changing it changes identity; D-2) |
| 41 | `research/rl/environment.py:10-11`, `:615`, `:862` | Observations are a causal prefix by `available_at` | C |
| 42 | the promotion gate and locked exam | They count whole days | M? F-6 |

### The replay harness (SLICE-15)

| # | Where | What it assumes | Mark |
|---|---|---|---|
| 43 | `tests/replay/replay_harness.py:237-249`, `:289-299` | Night skip between replayed days | C (built) |
| 44 | `tests/replay/replay_harness.py:317-318`, `:332` | `start=(h, m)` exists, but `ShadowDriver.step` commits every batch already due at the first step (`operations/shadow_run.py:279-282`). A late start therefore replays as "the market host ran all morning". It cannot model a late market host or a restart. | D (harness) |
| 45 | `tests/replay/replay_harness.py:280-286`; `bootstrap.py:2389` | A fixed 09:15–15:30 fact for the converted days. The receipt's `routine_advance` is `never`, so no routine restart can be exercised. | C for the days; D for restarts (fixed in step 4) |

**Counts:** 45 rows. 22 correct already (C). 9 defects (D). 14 money behaviours: 8 already match legacy (M=), and 6 rows are fork candidates (M?), which make the five fork calls F-1, F-2, F-3, F-4 and F-6. F-5 is listed for information.

### Which of the six deliverables are already built

| Deliverable | Built | Missing (planned) |
|---|---|---|
| 1 Late start warm-up; views say what they cover | Coverage rows `covered`/`interrupted`/`gap`/`process_stopped` (rows 7, 8); `quality.assess` expected/present/gaps/warm (`market/quality.py:119-164`); reference facts on a late start (10) | Recorded session in views (2, 5); `day_coverage` on every view (14); same-day spot backfill (11, F-3) — steps 2, 3 |
| 2 Restart and recovery from the ledger | All of it in code: recovery stages and Q-009 (28), earlier-epoch refusal and pending-send recovery (29), latch (30), protection (33), holds, kill and reservations (36), stats (32); crash-point tests | The end-to-end proof on the converted days (44, 45) — step 4 |
| 3 Host and cognition independent of the start | Host walks from any point (15, 16); cognition is stateless per request (24) | The partial day as a fact in `BarContext` and the record (19) — step 3 |
| 4 Research on any time range | Causal RL observations (41); `ReplaySpec` window hook (38) | Windows in datasets, trials and results; look-ahead property tests (37, 39) — step 5 |
| 5 Calendar, settings, time seam, multi-underlying | Facts source and calendar port (12); bar size and warm-up as descriptor settings (3); the `Clock` seam (D-1); multi-underlying (21) | `SessionTiming` built from facts (2, 5, 18) — step 2 |
| 6 Outage or restart is a gap | Market (7, 8), protection (33), quality gaps (5) | Gaps named in the strategy's record (19) — step 3 |

---

## Step 2 — the recorded session and the day coverage

**Files:** `market/view.py`, `market/quality.py`, `market/ingest.py`, `strategies/worker.py` (`serve` only), `contracts/market.py` (a `DayCoverage` record), tests below.

**Behaviour.**

* `StoreMarket.session_timing(calendar_id, date) -> SessionTiming` reads the same fact as `trading_day` (`view.py:985-1009`), under the same visibility (`available_at <= now`):
  * `Holiday` gives `closed`.
  * `DayUnavailable` gives `unknown`.
  * A `TradingDay` gives `open`. It gives `special` when its local window is outside the calendar's weekdays or regular hours.
  * The view holds it as `View.session_timing`, resolved once per view.
* `quality._expected` uses `timing.open`/`timing.close` when the timing is `open` or `special`, and `Assessment.calendar` becomes `recorded_session`. On `unknown` or no timing it keeps the regular hours and `regular_hours` (today's behaviour). No count, warm-up rule or threshold changes.
* `View.day_coverage(instrument) -> DayCoverage(date, basis, session_open, session_close, first_window, last_window, expected, present, gaps, interrupted, complete)`:
  * `gaps` are runs of expected windows with no bar.
  * `interrupted` are the coverage rows (`interrupted`, `gap`, `process_stopped`) clipped to the session, each with its detail.
  * `complete` is true only when every expected window up to the session close is final and present. Before the close, or after any gap, it is false. No view says a day is complete when it is not.
  * `StoreMarket.coverage` stays.
* `MarketLoop._poll_due` and `next_wake` stop at `min(regular close, recorded close)` when the timing is known. The start rule is unchanged (F-1). `WorkerHost.serve` stops at the same earlier close.

**Tests:**

* `test_market_windows.py::test_session_timing_from_the_trading_day_fact` (open, holiday, unknown, special 18:00–19:00, a fact not yet available).
* `test_market_quality.py::test_expected_windows_follow_the_recorded_session` (early close 13:00; special session; unknown falls back to `regular_hours`).
* `test_market_view.py::test_day_coverage_after_a_late_start` (first window 12:00, gaps 09:15–11:59, `complete` false).
* `::test_day_coverage_names_a_process_stop` (an 11:00–11:10 stop in `interrupted` and `gaps`).
* `::test_day_coverage_complete_only_after_the_close`.
* `test_market_ingest.py::test_polls_stop_at_an_early_recorded_close`.
* `::test_polls_start_unchanged_on_a_special_day` (F-1).
* `test_strategy_invocation.py::test_serve_stops_at_the_recorded_close`.

**Break checks:**

* `_expected` ignores the timing.
* `complete` is true before the close.
* A `process_stopped` row is dropped from `interrupted`.
* A `special` timing opens polls before 09:00.
* A fact with a future `available_at` is used.

**Linux waiting list:** none.

## Step 3 — the late start

**Files:** `market/ingest.py` (`MarketLoop._open` backfill), `market/sources.py` and `adapters/openalgo.py` (a `history` read on the source protocol, reusing `_history_bars`), `settings/schema.py` and `settings/loader.py` (one data setting), `strategies/worker.py` (`BarContext.day`, a `DAY_COVERAGE` journal kind), `bootstrap.py` (`serve_strategy` start gate per F-4), `deploy/systemd/at-strategy-host.service` (an `ExecCondition` per F-4), tests below.

**Behaviour.**

* **Backfill, data only.** At the market host's first start of an exchange date, when the store holds no record of an instrument's spot for that date before now, the loop makes one `history` read per spot instrument for the recorded session's open up to now. It writes one-minute `history_bar` records:
  * `event_at` is the bar start and `arrival_at` is the fetch instant, so no view cut off earlier can see them.
  * The source is the history source. The coverage row is `covered` with detail `backfill`, or `gap`/`interrupted` as a fetch is today.
  * It never writes ticks, chain or Greeks (they cannot be refetched; legacy `heal.py`, 445eb116).
  * It never covers an outage after the day's first record. An outage stays a gap (deliverable 6).
  * It is controlled by `market.source.backfill_on_start: bool`. When unbound it refuses with `RefusingParameterUnbound`, as every market setting does.
  * BuyerEdge's view policy keeps `bars: ticks`, so its decisions are unchanged (F-3).
* **The partial day as a fact.** `BarContext` gains `day: DayCoverage`, the trigger view's `day_coverage` (step 2). The host records it once per decided window as a `DAY_COVERAGE` journal row in the host store, holding `first_window`, `gaps`, `interrupted` and `complete`. The intent and abstention payloads are unchanged, so evidence digests, command keys and admission are identical (the deepening confirms by digest test). BuyerEdge and EMA cross ignore `day`.
* **Start gate (F-4, as answered).** If answered as proposed:
  * `at-strategy --check-day` exits 0 on an open or special recorded day (including before the open) and 1 on a holiday or an unknown day. It is used as the unit's `ExecCondition`.
  * The legacy preflight checks that map onto the new stores refuse the start: ticks flowing in the market store, warm-up not above the bars the session can still give, and the freshness bound at least twice the poll interval. Each check's legacy line is cited when it is deepened.
  * A start after the close exits 0 at once.

**Tests:**

* `test_market_ingest.py::test_a_late_first_start_backfills_spot_history_bars` (12:00 start; bars 09:15–11:59 as `history_bar`; arrival = fetch instant; `covered backfill`).
* `::test_backfill_is_invisible_to_an_earlier_cutoff`.
* `::test_no_backfill_after_the_days_first_record` (a restart after an outage leaves the gap).
* `::test_backfill_never_writes_ticks_chain_or_greeks`.
* `::test_backfill_unbound_refuses`.
* `test_strategy_invocation.py::test_bar_context_carries_the_day_coverage`.
* `::test_day_coverage_journal_per_window`.
* `::test_intent_digest_unchanged_by_day_coverage`.
* `test_strategy_invocation.py::test_check_day_exit_codes` (holiday, unknown, open before the open, special, after the close).
* `test_rendered_units.py::test_strategy_unit_has_the_day_condition` (if F-4 as proposed).

**Break checks:**

* Backfill with `arrival_at` = bar time (look-ahead).
* Backfill after an outage.
* Backfill written to the `spot` stream (BuyerEdge would read it).
* `DAY_COVERAGE` folded into the intent payload.
* `--check-day` exits 0 on unknown.

**Linux waiting list (new rows):**

* `at-strategy-host.service`'s `ExecCondition` skipping a holiday under real systemd without marking the unit failed. This replaces SLICE-15's row "the strategy timer's calendar `ExecCondition` and session preflight".
* `systemctl start at-strategy-host` at a mid-session minute through the installer's polkit rule.

## Step 4 — the replay proofs on the converted days

**Files (test support only):**

* `tests/replay/replay_harness.py`, which gains:
  * `build(…, market_from=None, until=None, receipt=None, fault_plan=None)`;
  * a `restart(r, at, parts=…)` helper that closes the named compositions without their stop sequence (as a crash) and recomposes them on the same root;
  * the night skip, unchanged.
* `tests/replay/fake_openalgo.py`, which serves `history` from the converted spot bars at or before now (for step 3's backfill).
* `tests/replay/test_start_anytime.py`, marked `replay`.
* `tests/integration/test_start_anytime_synthetic.py`, which always runs over the SLICE-15 synthetic two-hour afternoon.

**Harness changes.**

* With `market_from=T`, batches fetched before `T` are dropped, modelling a market host that was not running. Without it, the market ran from 09:15 and only the kernel and host start late.
* `receipt` lets a run use a `routine_advance: standing` receipt (Q-009), where today it is `never` (`bootstrap.py:2389`).
* `fault_plan` is `_compose_kernel`'s existing seam (`bootstrap.py:144`).

**Runs** on 2026-08-07, the day with the most fills (39 admitted, 18 fills in SLICE-15). Estimated time is shown against the full-day p50 of 509 s.

| Run | Start or event | Asserts |
|---|---|---|
| A0 | 09:15, the uninterrupted baseline | SLICE-15's reconciliation, no difference |
| A1–A6 | Whole system from 09:16, 10:30, 12:00, 14:00, 15:12 and 15:14 (`market_from` = start, backfill bound) | Reconciles; every decision's trigger at or after the start. `DAY_COVERAGE` on every window: `first_window` at or after the start, `complete` false before 15:30, the backfill visible as `history_bar` only. First decision at least `warmup_bars` after the first tick bar (row 16). 15:12 and 15:14 admit nothing (warm-up and `no_new_trade_after`), and the session still opens and closes, flat. |
| A7 | Kernel and host from 12:00, market from 09:15 | The host decides the morning's bars. Every ENTER whose view is older than `max_view_age_secs` is refused `ADM-R05` at B1, and none is sent (row 15). Fake orders equal admitted entries. |
| R1 | Open position: crash the kernel, market and host at the first fill + 2 min (read from A0), restart with `standing` | `EPOCH_ACTIVATED`, then `RECOVERY_ADVANCED basis routine_standing`. No command key placed twice at the fake. The open position's stop is not re-placed, and its desired levels equal A0's bar for bar until its exit or the first decision that differs (F-5, recorded). The latch's `SAFETY_CHECK_STATE` and any `LOSS_LATCH_TRIPPED` agree with its own books; until the restart the ledger prefix equals A0's. Flat; reconciles. |
| R2 | Pending send: `fault_plan` kills the kernel after `DISPATCH_CLAIMED`, after the fake accepted the order and before the outcome | After restart the attempt is resolved by `coordinator.recover` through the books (existing path, CP-D1). Exactly one fake order for that command and its fill in the ledger once. No re-send; no other unverified item. |
| R3 | As R1 with a `never` receipt | Stays in recovery (no entries, protection per the recovery hold rules) until a human `recovery advance` through the operator path. Then it continues and reconciles. |
| R4 | Market outage 11:00–11:10, the market host restarted alone | A `process_stopped` row. No bar and no decision trigger in 11:00–11:10. `day_coverage.gaps` names it. No backfill into it. |
| R5 | Strategy host restarted alone at 13:00 | `STATE_RESET host_restart`. Every invocation id is unique, and a `COMPLETED` row not yet handed off is handed off once or abandoned per Fork call 11. No duplicate entry request. |

Time: A0–A6 sum to about 3.7 day-equivalents. A7 and R1–R5 run on `until` windows of about 2 h each. That totals about 6 day-equivalents, around 50 min, and up to 80 min on a loaded PC. The always-run synthetic file covers A6-like, R1, R2 and R4 on the two-hour day in under 2 min.

**Break checks:**

* The earlier-epoch refusal skipped (R2 must catch a re-send).
* The routine advance accepted with `never` (R3).
* `process_stopped` not written (R4).
* `market_from` ignored (A2 must fail its first-window check).
* Protection re-placing a confirmed stop at recovery (R1).

**Record:** a "Start at any time" table in `docs/migration.md` beside "The replayed days", labelled "converted simulation data, not legacy-comparable (no bid/ask)".

**Linux waiting list (new rows):**

* R1 and R2 with the kernel, market and strategy hosts as separate units over the kernel channel, restarted by systemd (`Restart=` policies), the lease wait (`wait_for_lease`) observed.
* The market unit's `Restart=always` producing R4's `process_stopped` row.
* The supervisor's assessment staying fresh across a kernel restart.

## Step 5 — windowed research

**Files:** `research/windows.py` (new), `research/datasets.py`, `research/replay.py`, `research/trials.py`, `research/evaluation.py`, `bootstrap.py` (`run_dataset_build`'s `spec_for`), tests below. Blocked on F-6.

**Behaviour.**

* **The window.** `ResearchWindow(day, slices)` has one or more half-open `[from, to)` exchange-time slices on one date. Slices are non-overlapping, ordered and inside the recorded session; anything else is refused. A dataset takes `windows` in place of, or beside, `days`. A whole day is the window `[session open, session close)` from step 2's timing; `bootstrap.py:2275-2276` stops hard-coding 09:15–15:30.
* **The replay per slice.** `ReplaySpec(session_open=from, session_close=to)` runs once per slice. The view cutoff is the clock, so data after a decision instant is never visible. Data before `from` on the same date is visible (it is the past) and is recorded as used.
* **Outcome horizons** that reach past the slice's end are marked `censored` and never read.
* **Gappy data.** `day_coverage` of the slice is recorded, and a gap is never filled.
* **The record.** Every result (row, trial, evaluation) records `windows`, each slice's `day_coverage`, the input store digest and `clock_identity`, and enters custody through the existing `TrialLedger`/`CustodyLedger` events.
* **Identity unchanged.** A dataset given only `days` has no `windows` key, so its identity, the golden `tests/fixtures/research/legacy_identity_445eb116.json`, and every existing digest are unchanged.
* **Promotion (F-6 as proposed).** Windowed datasets are refused by `reserve_locked_evaluation`, the locked exam and the promotion gate (`DatasetError("windowed research is exploratory")`). Whole-day ones are unchanged.

**Tests:**

* `test_research_windows.py::test_window_validation` (overlap, order, outside the session, empty).
* `::test_whole_day_dataset_identity_unchanged` (golden).
* `::test_slice_result_records_windows_coverage_and_inputs`.
* `::test_horizon_past_the_slice_is_censored`.
* `::test_windowed_dataset_refused_by_the_locked_exam_and_promotion`.
* Property tests (hypothesis, synthetic store with random gaps):
  * `test_no_look_ahead_in_any_window`: for every decision in any random set of slices, every record the replay read has `available_at` at or before the decision instant, and the decision is inside its slice.
  * `test_slices_are_independent`: one slice's result is unchanged by adding data or slices after it.
  * `test_gaps_are_never_filled`: no bar appears in a window whose records were removed.
* Custody: `test_custody_ledger.py::test_windowed_dataset_in_custody`.

**Break checks:**

* Cutoff at the slice end, not the decision.
* A horizon read past the slice.
* `windows` added to a days-only identity.
* A windowed dataset accepted by the locked exam.

**Linux waiting list:** none (research runs the same on this PC).

## Completion conditions

* F-4 and F-6 are answered before steps 3 and 5. F-1, F-2 and F-3 are answered before live use. Until then legacy's behaviour stands, and no step changes it.
* Steps 2–5 are built, tested twice, break-checked and recorded "as built" here.
* Step 4's matrix reconciles with no difference, with nothing re-sent, and its table is recorded with the simulation label.
* The new Linux-only rows are added to SLICE-15's waiting list, and SLICE-15's existing row on the strategy timer is replaced by step 3's.
