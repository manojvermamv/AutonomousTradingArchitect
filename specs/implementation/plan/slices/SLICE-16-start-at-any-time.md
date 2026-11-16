# SLICE-16 — Start at any time: late starts, mid-session restarts, partial days and windowed research

* **Status:** built (2026-11-14): steps 1–5 as built below. Step 1 (the audit) is built: it is this file's [Step 1 — audit (as built)](#step-1--audit-as-built). Steps 2–5 began as outlines in the standing rules' sense: each step's exact detail was written just before it is built, reviewed by two fresh EGM reviewers, built, run twice with the suite, break-checked and recorded "as built".
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

## Fork calls for the owner (answered 2026-11-14)

Each one keeps legacy at 445eb116 unless the owner chooses otherwise. **All are answered as proposed** ([owner answers](../../decisions/owner-answers-2026-10-27.md), "SLICE-16 and SLICE-17 choices (2026-11-14)"). Two further answers from the same table bind this slice: `market.source.backfill_on_start` defaults to `false` (legacy has no backfill), and polls and the strategy host keep legacy's fixed 15:30 end on an early recorded close (no early stop).

| # | Blocks | Question | Legacy at 445eb116 | Proposed default (legacy) |
|---|---|---|---|---|
| F-4 | Step 3 | Does the strategy host start through legacy's start gate? This covers the calendar `ExecCondition` and the session preflight, and whether a missed timer fires on a late boot. | `deploy/systemd/at-strategy.service:46-50` skips the start on a holiday or an unknown calendar (`deploy/session_calendar.py`), and `session_preflight.py` refuses a start that would record nothing. `at-strategy.timer:16-19` fires Mon–Fri with `Persistent=false`, so a box booted after the start time waits for the operator. | Carry the calendar skip: on a holiday or an unknown day the host exits 0 and records why. The kernel already refuses those sessions, so no money changes. Keep `Persistent=false`. For the preflight, carry each legacy check that maps onto the new stores, as a refusal (legacy). The alternative is report-only, which would be a Deviation. |
| F-6 | Step 5 | May a windowed or partial-day research result count towards promotion (locked exam days, effective sample)? | Research is whole days only; nothing partial exists to count. | Never counted. Windowed results are exploratory, and promotion and the locked exam stay whole-day. |
| F-1 | — | Should the system poll and trade in a special session (muhurat, weekend) or after the regular hours? | Polls only on weekdays 09:00–15:59 (`src/interfaces/mcp/core/scheduler.py:174-178`, `* 9-15 * * mon-fri`), skipped after the close (`marketpull.py:888-896`). The strategy timer runs Mon–Fri only. | No (answered). Step 2 only reads the recorded session for views and quality. Poll hours, start and end, stay legacy's (owner: fixed 15:30). |
| F-2 | — | On an early-close day, should the framework square off before the day's close? | It squares off at the policy's fixed time (`src/runtime/session_close.py:116-117`, default 15:13). After an early close the broker's square-off backstops. | Policy time unchanged (`kernel/protection.py:1301-1330` already matches). |
| F-3 | — | After a late start, may BuyerEdge read the day's earlier minutes fetched from history? | There is no same-day backfill: `marketheal.py:43-58` heals past spot days only. BuyerEdge's tape is the tick bars recorded since its start (`runner.py:96-102`). | No. Step 3 records the backfill as labelled `history_bar` data, and BuyerEdge's view policy keeps `bars: ticks`. |
| F-5 | — | (Information.) After a restart, BuyerEdge's in-memory scorer state and the drawdown-rate window start empty, so decisions after a restart can differ from an uninterrupted run. | Per-process in both: `src/strategies/buyer_edge.py:2494-2504` and `src/runtime/session_state.py:227-234`. | No change. OA_NEW matches (`strategies/worker.py:588-601`, `kernel/admission.py:399`, `:559-564`). Step 4's comparisons account for it. |

## Steps

| Step | Builds | Reuses | Proofs |
|---|---|---|---|
| 1 | The audit: every place that assumes a full day, a 09:15 start or a complete set of bars, and which deliverables are already built | — | This file (as built) |
| 2 | The recorded session and the day coverage. `SessionTiming` is built from the recorded `trading_day` fact. Quality's expected windows follow it. Each view gets `day_coverage`. Polls and the host keep legacy's fixed 15:30 end (owner, 2026-11-14). | `StoreMarket.trading_day` (`market/view.py:985-1009`), `quality._expected`, coverage rows | Unit tests (named in step 2) |
| 3 | The late start. `BarContext.day` and a per-window `DAY_COVERAGE` record in the host; the start gate follows F-4 as answered (legacy's calendar skip and preflight refusals). No backfill: `market.source.backfill_on_start` was answered `false` and nothing reads backfilled bars (see step 3). | `View.day_coverage` (step 2), the host store | Unit tests |
| 4 | The replay proofs: starts at 09:15 (baseline), 10:30, 14:00 and one minute after the baseline's last admitted entry; restarts mid-day with an open position (routine and owner advance, crash and clean stop), a market outage and a strategy-host restart; synthetic always-run versions. | SLICE-15 harness (`tests/replay/`) | `-m replay` runs; synthetic always-run versions |
| 5 | Windowed research: any day ranges, intraday windows, a few minutes, non-contiguous slices and gappy data. Nothing looks ahead, and each result records its windows and the data it used, in custody. | `ReplaySpec.session_open/close` and `clock_identity` (`research/replay.py:1451-1466`, `:1689`), `datasets.build` | Property tests (hypothesis); golden identity unchanged |

**Order.** Step 3 needs step 2's `DayCoverage`. Step 4 needs both. Step 5 shares no files with 2–4 and may be built in parallel by a second agent once F-6 is answered.

## Deviations

* **D-1 (no `Host.session_now`):** the owner's goal names a `Host.session_now` seam. None exists under that name. Every participant takes time from the injected `Clock` (`contracts/clock.py:48-51`). The calendar's fixed offset turns that time into exchange time (`contracts/market.py:253-258`), and the host's time zone is never used, apart from BuyerEdge's copied `get_ist_now` (`strategies/buyer_edge.py:1012-1024`), which is bound to the bar's stamp during scoring (`:2692-2705`). That seam is kept. No new one is added. The wall-clock fallbacks left in `src/` are **accepted**, each because it decides nothing about a session, a window or an order:
  * `cognition/records.py:91` (`_at(None)`): an audit stamp default. Every production caller passes the injected clock's time (`cognition/review.py:166`, `:209`; `cognition/advice.py:108`, `:152`; `cognition/records.py:500`, `:507`).
  * `research/custody.py:314` and `:1873`: the custody ledger's and `adopt`'s default clock when none is injected; custody stamps, never a market cutoff (research cutoffs come from `ReplaySpec`, step 5).
  * `research/jobs.py:1167`: a lease's `expires_at` against `time.time()`; a process-liveness check, not exchange time.
  * `operations/backup.py:67`, `:643`, `operations/restore.py:283`, `operations/deployment.py:449`, `operations/telemetry.py:59`: operations logs, backup status and telemetry retention stamps.
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

**Files:** `contracts/market.py` (a `DayCoverage` record), `market/view.py`, `market/quality.py`, tests below. `market/ingest.py` and `strategies/worker.py` are not changed: the owner kept legacy's fixed 15:30 end (2026-11-14), so neither the poll nor the host stop moves.

**Behaviour.**

* `session_timing_of(reader, calendar, date, now=, through=)` reads the same fact as `StoreMarket.trading_day` (`view.py`, one shared `_trading_day_value`), under the same visibility (`seq <= head`, `available_at <= now`):
  * `Holiday` (`open: false`) gives `closed`.
  * No fact, or a malformed one, gives `unknown` (fails closed).
  * A window gives `open`. It gives `special` when its local window falls outside the calendar's weekdays or regular hours. A shortened day inside the regular hours (an early close) is `open` with the earlier close.
  * `View.session_timing` holds it once per view (cutoff and head of the view); `StoreMarket.session_timing(calendar_id, date)` answers it at the clock's now.
* `quality.assess` takes its expected windows from `session_windows(view, …)`: the recorded session when the timing is `open` or `special` (`Assessment.calendar` = `recorded_session`), none on `closed`, and on `unknown` the regular hours on a weekday with `regular_hours` (today's behaviour). No count rule, warm-up rule or threshold changes.
* `View.day_coverage(instrument) -> DayCoverage(date, instrument, basis, status, session_open, session_close, first_window, last_window, expected, present, gaps, interrupted, complete)`, in one-minute windows of the policy's bars:
  * `gaps` are inclusive runs `(first, last)` of expected windows with no bar.
  * `interrupted` are the coverage rows with status `interrupted` or `gap` (a `process_stopped` row is `interrupted`) that overlap the session, clipped to it. A row is visible once written: at its `scope_to`, at or before the cutoff, and `seq <= head`.
  * `complete` is true only on a recorded session whose every window up to the close is final and present. Before the close, after any gap, or with no recorded session it is false. `DayCoverage` refuses `complete` with a gap or without a recorded session.
  * `DayCoverage.wire()` is its canonical dict, for step 3's journal and SLICE-17's declared inputs.
  * `StoreMarket.coverage` stays.
* **No early stop (owner).** `MarketLoop._poll_due`, `next_wake` and `WorkerHost.serve` keep legacy's weekday 09:00–15:30 (F-1, fixed 15:30). Protection does not depend on them: the square-off fires at the policy's time from the code's calendar offset and never reads the store or the poll hours (`kernel/protection.py:1301-1330`, F-2).

**Tests:**

* `test_market_view.py::test_session_timing_from_the_trading_day_fact` (open, early close, holiday, unknown, special 18:00–19:00, a Saturday session, a malformed fact, a fact not yet available, and `StoreMarket.session_timing`). It is here, not in `test_market_windows.py`, because it needs a store.
* `test_market_quality.py::test_expected_windows_follow_the_recorded_session` (early close 13:00; special session; unknown falls back to `regular_hours`).
* `test_market_view.py::test_day_coverage_after_a_late_start` (first window 12:00, gap 09:15–11:59, `complete` false).
* `::test_day_coverage_names_a_process_stop` (an 11:00–11:10 stop in `interrupted` and `gaps`; another instrument's row ignored; unseen before it was written).
* `::test_day_coverage_complete_only_after_the_close` (and `regular_hours` never complete).
* `::test_day_coverage_on_a_closed_day`.
* `test_market_ingest.py::test_polls_keep_the_regular_close_on_an_early_close_day` (owner's fixed 15:30).
* `::test_polls_start_unchanged_on_a_special_day` (F-1).

**Break checks:**

* `_expected` (now `session_windows`) ignores the timing.
* `complete` is true before the close.
* A `process_stopped` row is dropped from `interrupted`.
* A fact with a future `available_at` is used.

**Linux waiting list:** none.

### Step 2 as built

**Built** 2026-11-14 on OA_NEW `agentic-desk` (commit `SLICE-16 step 2:`).

* **What.** `DayCoverage` (`contracts/market.py`); `session_timing_of`, `View.session_timing`, `View.day_coverage`, `session_windows` and `StoreMarket.session_timing` (`market/view.py`, sharing `_trading_day_value` with `trading_day`, whose answers are unchanged); `quality.assess` on `session_windows` with the `recorded_session`/`regular_hours` label; `coverage(..., instrument=)` on the store's reads (`market/store.py`), so a day-coverage read loads one instrument's rows.
* **Tests.** 8 new (5 in `test_market_view.py`, 1 in `test_market_quality.py`, 2 in `test_market_ingest.py`). Run 1: the market, port, canvas, strategy-invocation and legacy-market files plus `tests/contracts`, 863 passed, 5 skipped, 2 failed: `test_capabilities.py::test_simulation_has_no_live_adapter` and `::test_check_opens_nothing` assert `adapters.openalgo` is not yet imported, which another file in the same process had imported; both pass alone and in `tests/contracts` alone. Run 2, the same files with `tests/contracts` in its own process: 336 passed; 529 passed, 5 skipped.
* **Breaks** (each failed its test, then was restored): timing ignored in `_session_bounds` (3 failed); `complete` without the whole session (1); `process_stopped` rows dropped (1); a fact used before its `available_at` (1).
* **Deviations from the outline.** No early stop for polls or the host (owner, fixed 15:30), so `market/ingest.py` and `strategies/worker.py` are unchanged and their two tests became "keeps legacy's hours" tests. The timing test sits in `test_market_view.py` (it needs a store). A coverage row is visible from its `scope_to` (when it was written), not its `scope_from`, so a view never sees a stop recorded after its cutoff.
* **Fork calls.** None. Protection is unaffected (the square-off reads no store, `kernel/protection.py:1301-1330`).

## Step 3 — the late start

**Files:** `strategies/worker.py` (`BarContext.day`, the `DAY_COVERAGE` journal kind, `StrategyHost.start_gate`), `market/start_gate.py` (new), `bootstrap.py` (`serve_strategy` runs the gate before `serve`), tests below. The unit file and the market host are not changed (see the decisions below).

**Decisions taken before building (owner answers, 2026-11-14):**

* **No backfill is built.** `market.source.backfill_on_start` was answered `false`, legacy has none (F-3), and nothing in this release would read a backfilled bar: BuyerEdge's view policy is `bars: ticks`, and no strategy, admission or protection read uses `history` bars on a live day. The late start is made honest instead by `DayCoverage` (the missing morning is a named gap, `complete` false). So no setting is added and nothing can refuse when it is unbound (reviewer fix 3 is moot). If a future consumer reads `history` bars, the backfill (one `history` read per spot instrument from the recorded open to the first start, `history_bar` records with `arrival_at` = the fetch instant, never ticks, chain or Greeks, never after the day's first record) is built then, behind that setting with default `false`.
* **The start gate runs in-process.** The installer allows a unit exactly one `Exec` line (`deploy/install.py:243-248`), so no `ExecCondition` or `ExecStartPre` is added. **Deviation:** `at-strategy <id>` runs the gate after composing the host and before the first pass. A skip exits 0 (legacy's `ExecCondition` exit 1: the unit is not failed and not restarted); a refusal exits 1 (legacy's failed `ExecStartPre`: `Restart=on-failure` as before).

**Behaviour.**

* **The partial day as a fact.** `BarContext` gains `day` (default `None`) after `invocation_id`, so every positional construction (`strategies/worker.py`, `tests/unit/test_buyer_edge_parity.py:180`) is unchanged. It is the trigger view's `day_coverage(underlying)` (step 2), or `None` if that read fails, so a coverage read never turns a decision into a `strategy_error`. SLICE-17 reads it as `ctx.day` and puts `ctx.day.wire()` in its declared inputs.
* **The record.** The host writes one `DAY_COVERAGE` journal row per decided window, in the same transaction as the window's `PLANNED` row: the trigger plus `DayCoverage.wire()` (`first_window`, `gaps`, `interrupted`, `complete` and the rest). Warm-up windows get none. The intent and abstention payloads are unchanged, so evidence digests, command keys and admission are identical. BuyerEdge and EMA cross ignore `day`.
* **Start gate (F-4, legacy).** `start_gate(...)` in `market/start_gate.py`:
  * The calendar (legacy `deploy/session_calendar.py`, `at-strategy.service:46-50` @445eb116): the recorded `trading_day` fact (step 2's `session_timing_of`). `closed` or `unknown` skips. Legacy asked OpenAlgo at the timer's start; here the fact is the market host's, recorded from 09:05, so an unknown weekday is read again every 30 s until the regular open (09:15), then skipped. `open` or `special` goes on.
  * The preflight's BLOCK lines that read the market store (`deploy/session_preflight.py:254-326`, `:351-379`): none before the regular open or after the close (legacy's `pre`/`post` phases); in session, no ticks for the underlying today, the newest tick older than 180 s (`STALE_TICKS_SECS`, legacy's), or no confirmed bar refuse. An unreadable store refuses. Legacy's WARN lines (cadence, a warm-up not yet elapsed, the feed socket) refuse nothing, as legacy; the outline's "warm-up not above the bars the session can still give" and "freshness bound at least twice the poll interval" were WARNs in legacy and are not carried as refusals. Legacy's other BLOCKs map onto checks the start already makes (release convergence: the manifest verification; entry limits: the bound settings; writable: the host store's open; disarmed execution: the host has no sending code).
  * After the close it starts, and `serve` runs one pass and stops (legacy's order, unchanged).

**Tests** (`test_strategy_invocation.py`):

* `test_bar_context_carries_the_day_coverage` (a 10:40 first bar: gap 09:15–10:39, `complete` false, each view's own windows only).
* `test_day_coverage_journal_per_window` (one row per decided window, none for warm-up, none on a second pass).
* `test_intent_digest_unchanged_by_day_coverage` (published outputs' digests equal with `day` and with it forced to `None`).
* `test_start_gate_calendar` ×5 (holiday skip; unknown read again to 09:15, then skip; recorded at 09:05 then start before the open; a Saturday special day goes on to the preflight; after the close start).
* `test_start_gate_preflight_in_session` (no ticks refuse; fresh ticks and bars start; ticks 4 min old refuse).
* `test_start_gate_counts_only_bars_confirmed` (an unsealed bar is not a bar).

**Break checks:**

* `DAY_COVERAGE` folded into the intent payload.
* An unknown day starts instead of skipping.
* The stale-tick refusal removed.

**Linux waiting list (new rows, in SLICE-15's table):**

* `at-strategy-host.service` started by its timer on a holiday or unknown day exits 0 through the in-process gate without being marked failed or restarted; a refusal exits 1 and restarts within `StartLimitBurst`. This replaces SLICE-15's row "the strategy timer's calendar `ExecCondition` and session preflight".
* `systemctl start at-strategy-host` at a mid-session minute through the installer's polkit rule.

### Step 3 as built

**Built** 2026-11-14 on OA_NEW `agentic-desk` (commit `SLICE-16 step 3:`).

* **What.** `BarContext.day` (default `None`, after `invocation_id`) and the `DAY_COVERAGE` journal kind, written in the `PLANNED` row's transaction (`strategies/worker.py`); `market/start_gate.py` (new): `day_status`, `preflight`, `start_gate`, `gate_for(host)`; `serve_strategy` runs the gate before `serve` (`bootstrap.py`). `tests/integration/test_shared_engine.py`'s PRF-STR-11 journal assertions now set the new `DAY_COVERAGE` rows apart and check one per decided window.
* **Tests.** 10 new in `test_strategy_invocation.py` (3 day-coverage, 7 gate). Runs (the strategy-invocation, BuyerEdge-parity, model-strategy, registry, shared-engine, unix-channel and `tests/replay` files, then `tests/contracts` in its own process): run 1, 223 passed, 14 skipped; 529 passed, 5 skipped. Run 2 the same. An earlier pair of runs, before the gate moved to `market/`, also passed the first set (327 passed, 14 skipped, with the shadow-day and custody-promotion files) and failed only PRF-STR-09 (`test_prf_str_09_the_tree_has_no_finding`), which the move fixed.
* **Breaks** (each failed its test, then was restored): the day folded into an intent (`test_intent_digest_unchanged_by_day_coverage`); an unknown day starting (`test_start_gate_calendar[unknown]`); the stale-tick refusal removed (`test_start_gate_preflight_in_session`).
* **Deviations.** The gate runs in-process, not as `ExecCondition`/`ExecStartPre` (the installer's one-`Exec`-line rule). It lives in `market/`, not `strategies/`: a module the host imports changes every strategy's declared code set (`DESCRIPTOR["code"]`, STR-R03 caught it), and PRF-STR-09 lets only `strategies/worker.py` open a database (the guard caught `strategies/start_gate.py`). An unknown weekday is read again until 09:15 (the fact is the market host's from 09:05, where legacy asked OpenAlgo at the timer). No backfill and no setting (owner `false`; nothing reads it). Changing `worker.py` changes every strategy's code digest and so its candidate ID, as any host change does; no golden pins one.
* **Fork calls.** None. Legacy's preflight WARN lines (cadence, warm-up not elapsed) stay non-refusing, as legacy; the outline had named two of them as refusals, which would have been a difference from legacy and was not built.

## Step 4 — the replay proofs on the converted days

**Files (test support only):** `tests/replay/replay_harness.py`, `tests/replay/test_start_anytime.py` (new), `tests/integration/test_start_anytime_parts.py` (new). No production code changes.

**Harness changes.**

* `build(…, market_from=None, until=None, receipt=None)`. With `market_from=T`, batches fetched before `T` are dropped: a market host that was not running. Without it, the market ran from the start and only the kernel and host start late. `until` ends the run early. `receipt` replaces the replay's `_SHADOW_RECEIPT` (`routine_advance: never`), so a run can use `standing` (Q-009).
* `driver.drop_market(frm, to)`: the market host down over `[frm, to)`; nothing fetched then is committed.
* `restart(r, parts=("kernel", "market", "host"), receipt=, stop=False)` closes the named parts and recomposes them on the same root at the clock's instant:
  * A crash (`stop=False`) runs no stop sequence. The crashed epoch's send lease is then expired at the restart's instant, as the kernel host's `wait_for_lease` would leave it (the wait itself is SLICE-15's Linux row).
  * A clean stop (`stop=True`) runs the kernel host's stop: unsent entries refused `stopping`, a drain, then `recovery.shutdown(clean=True)`, which releases the lease clean.
  * A kernel restart also recomposes the host, because its kernel port belongs to the old composition. It starts a fresh driver over the remaining batches. Its first step refuses the earlier epoch's unsent entries and performs the owner's acts (the advance only if recovery still waits for one).
  * The lease store is the build's, as a restart on the same host finds it.
* The night skip is unchanged.

**Fault plan (R2) not rebuilt in process.** `FaultPlan` ends the process (`os._exit(86)`, `kernel/coordinator.py:176-178`), so a pending send cannot be killed inside one replay process. The pending-send crash points are already proven by `tests/recovery/test_crash_boundaries.py` (CP-D1, CP-P1…P4, CP-B1…B5, subprocesses). The same check over the converted days with separate units is SLICE-15's Linux row.

**Reviewer fix 1 (the 15:12 run).** Nothing binds `no_new_trade_after` (`defaults.yaml:123` is `""`, and the harness binds none). So the "after the last entry" run starts one minute after A0's last admitted command, read from A0's ledger. The 15:14 run is dropped: after the 15:13 square-off it shows nothing A5 does not.

**Always-run synthetic runs** (`test_start_anytime.py`, the SLICE-15 synthetic afternoon 13:15–15:29 with the scripted rule, ENTER CE at its first decided bar):

| Run | Event | Asserts |
|---|---|---|
| Late start | Kernel, market and host from 14:00 (`market_from` 14:00) | Reconciles. The first decided bar is the one that closed at 14:00 (13:59), nothing earlier. One entry. Every `DAY_COVERAGE` row starts at or after it, is not complete, and names the gap 09:15–13:58. One session, opened and closed. |
| R4 | Market host down 14:00–14:10, restarted alone | Reconciles. A `process_stopped` row. No decided bar inside the outage. The day's coverage names the gap and the stop. |
| R5 | Strategy host restarted alone at 14:30 | Reconciles. Invocation IDs unique. The one entry is never requested again. |
| R1 | Kernel, market and host crashed two minutes after the first fill, `standing` receipt | Reconciles. Open at the restart. Advances `routine_standing`. One entry at the fake, and the kernel's own `square_off` closes it. |
| R3 | As R1 with `never` | The owner's advance (`human`), then as R1. |
| Clean stop | As R1, with the stop sequence | `routine_standing`, then as R1. |

**In-process parts** (`test_start_anytime_parts.py`, reviewer fix 4):

* Cognition with a review in flight: the request is recorded, then the process stops. The next process's `recover` answers it once (`unavailable`, `cancelled`), and a repeat request answers nothing new.
* Cognition after a clean stop: an answered review is never answered again.
* The observer: the same reads after a restart. It holds no session state, only a per-process request budget.
* A research job interrupted mid-session: the lease runs out, `recover` ends it `failed` and interrupted, a retry is a new attempt, and a queued job stays queued.
* The operator holds no restart state of its own: its sessions and requests are the kernel's (`CliSession` opens one per connection, `interfaces/api.py:748-757`), and a connection ends with the process. R3's owner advance goes through the authority's relay (`operations/shadow_run.py:120-131`), the path the operator door uses. No separate operator test was added.
* A model strategy's proposal in flight is not tested separately. The production review producer has no teams (`bootstrap.py:1587`); SLICE-17 builds the twin's proposal path. **Closed after the merge (2026-11-16):** the twin's path now exists (`review-channel/1` `propose`), and `tests/integration/test_start_anytime_parts.py::test_cognition_restarts_with_a_model_proposal_in_flight` (OA_NEW bef7ca1) proves it: asked again once after the restart, then reused.

**Converted-day runs** (`test_converted_start_anytime_matrix`, marked `replay`, on 2026-08-07 with BuyerEdge): A0 (09:14, baseline); whole-system late starts at 10:30, 14:00 and one minute after A0's last admitted command; R1 (crash two minutes after A0's first fill, `standing`); R4 (market down 11:00–11:10); R5 (host restarted at 13:00). Each run reconciles, opens and closes its session, and acknowledges every command key once. A late start's first decided bar closed at or after its start, and its coverage is not complete.

**Break checks:**

* The routine advance accepted under a `never` receipt (R3 must see `human`, not `routine_standing`).
* A clean stop releasing its lease `abnormal` (the clean-stop run must still advance `routine_standing`).
* `market_from` ignored (the late start's first-bar check must fail).
* `process_stopped` not written on the market restart (R4).

**Record:** a "Start at any time" table in OA_NEW `docs/migration.md` beside "The replayed days", labelled "converted simulation data, not legacy-comparable (no bid/ask)".

**Linux waiting list (new rows):**

* R1 and R2 with the kernel, market and strategy hosts as separate units over the kernel channel, restarted by systemd (`Restart=` policies), the lease wait (`wait_for_lease`) observed.
* The market unit's `Restart=always` producing R4's `process_stopped` row.
* The supervisor's assessment staying fresh across a kernel restart (the supervisor's real-unit restart stays on SLICE-15's list).

### Step 4 as built

**Built** 2026-11-14 on OA_NEW `agentic-desk` (commit `SLICE-16 step 4:`, after step 5 at the coordinator's request). Test support and the record only; no production code changed.

* **What.** `tests/replay/replay_harness.py`: `market_from`, `until`, `receipt`, `drop_market`, `restart` (crash or clean stop; the build's lease store; a crashed lease expired at the restart). `tests/replay/test_start_anytime.py`: 6 synthetic tests and the converted matrix. `tests/integration/test_start_anytime_parts.py`: 4 in-process tests. OA_NEW `docs/migration.md`: "Start at any time".
* **Harness fixes found on the way.** A restarted `MarketLoop` must be given the calendar itself: `build` gives the first loop the kernel's market port, which a first start never reads, but `MarketLoop._open` does on a restart. A kernel restart must leave the earlier lease as a real restart finds it: still held after a crash (expired by the lease wait), released clean after a stop. Without that the restarted kernel stays in recovery and only the broker's 15:15 square-off closes the position, leaving the ledger open. That is correct kernel behaviour (Q-009 check 6), not a defect.
* **Tests.** Run 1 (synthetic and parts): 10 passed. Run 2 (all of `tests/replay` without `AT_REPLAY_DATA`, with SLICE-15's replay tests, and the parts file): 21 passed, 7 skipped. The converted matrix (`-m replay`, 2026-08-07): 1 passed in 18 min 49 s, every run reconciled (table in OA_NEW `docs/migration.md`).
* **Results.** A0 = SLICE-15's 2026-08-07 (340 decisions, 39 admitted, 18 fills, flat). R1 advanced `routine_standing` and ended as A0 (18 fills, the same realised); R5 ended as A0; R4's outage changed the bars and the trades (10 fills). A late start's first decided bar closed at or after its start. A5 (15:03) decided nothing: fewer than 20 bars were left.
* **Breaks.** `market_from` ignored (late start failed); `process_stopped` not written (R4 failed); a clean stop releasing `abnormal` (clean-stop run failed). The routine advance under `never` with check 1 removed **survived**: the `never` receipt's limit 0 (check 8) refuses it too. That is defence in depth, recorded.
* **Deviations.** R2 is not rebuilt in process (see above; `test_crash_boundaries.py` covers it). The 15:12/15:14 runs became A5 (reviewer fix 1). A7 (kernel and host late, market from 09:15) is not run: this slice's audit row 15 and `test_strategy_invocation.py::test_a_catch_up_is_planned_then_refused_stale_at_b1` already prove the morning's ENTERs are refused `ADM-R05`. The operator and a model proposal in flight have no separate test (see above).
* **Fork calls.** None. No money or BuyerEdge behaviour differs from legacy. The restarted BuyerEdge engine starts empty (F-5) and changed nothing that traded on this day.

## Step 5 — windowed research

**Files:** `research/windows.py` (new), `research/datasets.py`, `research/replay.py`, `research/trials.py`, `research/evaluation.py`, `bootstrap.py` (`run_dataset_build`'s `spec_for`), `research/jobs.py` (the `windows` argument), tests below. F-6 answered: never counted.

**Behaviour.**

* **The window.** `ResearchWindow(day, slices)` has one or more half-open `[from, to)` exchange-time slices on one date. Slices are non-overlapping, ordered and inside the recorded session; anything else is refused. A dataset takes `windows` in place of, or beside, `days`. A whole day is the window `[session open, session close)` from step 2's timing; `bootstrap.py:2275-2276` stops hard-coding 09:15–15:30.
* **The replay per slice.** `ReplaySpec(session_open=from, session_close=to)` runs once per slice. The view cutoff is the clock, so data after a decision instant is never visible. Data before `from` on the same date is visible (it is the past) and is recorded as used.
* **Outcome horizons** that reach past the slice's end are marked `censored` and never read.
* **Gappy data.** `day_coverage` of the slice is recorded, and a gap is never filled.
* **The record.** Every result (row, trial, evaluation) records `windows`, each slice's `day_coverage`, the input store digest and `clock_identity`, and enters custody through the existing `TrialLedger`/`CustodyLedger` events.
* **Identity unchanged.** A dataset given only `days` has no `windows` key (`windows` sits outside `OPTIONAL_IDENTITY_FIELDS`, whose lists the golden pins), so its identity, the golden `tests/fixtures/research/legacy_identity_445eb116.json`, and every existing digest are unchanged.
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
* Custody: `test_research_windows.py::test_windowed_dataset_in_custody` (custody records the window's day through the existing ordinary exposure).
* `test_research_windows.py::test_a_window_outside_the_recorded_session_is_refused`.

**Break checks:**

* Cutoff at the slice end, not the decision.
* A horizon read past the slice.
* `windows` added to a days-only identity.
* A windowed dataset accepted by the locked exam.

**Linux waiting list:** none (research runs the same on this PC).

### Step 5 as built

**Built** 2026-11-14 by a second agent in a worktree off OA_NEW `13f5a9b` (step 2), applied on step 3 (`ddfd35c`) and committed as `SLICE-16 step 5:` (it shares no file with steps 2–4 but `bootstrap.py`, in another function). F-6 as answered: windowed research never counts toward promotion.

* **What.**
  * `research/windows.py` (new; imports only the standard library and `contracts`, inside the research boundary PRF-RES-14): `ResearchWindow(day, slices)` with half-open `[from, to)` exchange-time `HH:MM` slices, non-empty, ordered, non-overlapping, and inside the recorded session `[open, close)` (`check_session`, refusing a closed or unknown day); `parse_windows` (one window per day); `whole_day` = `[open, close)`; `slice_gaps` (a `DayCoverage` wire's gaps clipped to a slice); `censor`.
  * `research/replay.py`: `ReplaySource(..., timing_for=, coverage_for=)`; `rows(..., windows=)` replays one `ReplaySpec` per slice (`session_open`/`session_close` = the slice, so the engine's clock and the `closes` view are cut at the slice's end). Decisions and observations are the slice's own (the host still decides the date's earlier bars, which are the past; they are counted as `decisions_outside_slice` and are never rows). `windowed_labels` is `directional_labels` with every horizon or observed endpoint reaching the slice's end marked `censored` (never read, never a refusal). Each windowed row carries `window`; `RowBatch.windows` holds one record per slice: day, slice, spec digest, `clock_identity`, `input_digest`, replay run id, decision counts, the view's `DayCoverage` at the slice's end and the slice's own gaps. The days-only path is unchanged (same rows, no new keys); `economic_cost_days` lists a day once.
  * `research/datasets.py`: `build(..., windows=)`; window days join `days`, a day without its own window is its whole recorded session. A windowed build is refused (`DatasetError("windowed research is exploratory")`) with a locked-OOS role or declared locked day, partition roles, or a locked trial/claim; `reserve_locked_evaluation(..., windowed=True)` refuses the same. Only a windowed manifest has `windows` in its identity (`WINDOW_IDENTITY_FIELD`, kept outside `OPTIONAL_IDENTITY_FIELDS`, whose list the golden pins). Custody: the window days enter through the existing `expose_ordinary` call.
  * `research/evaluation.py`: `evaluate` refuses a windowed manifest first (`EvaluationError("windowed research is exploratory")`), so no exam and no promotion gate reads one.
  * `research/jobs.py`: `windows` is a `research.dataset_build` argument.
  * `bootstrap.py` `run_dataset_build`: `spec_for` takes the day's recorded session (step 2's `session_timing_of`) and falls back to legacy's fixed 09:15–15:30 when none is recorded (identical text on a regular day, so days-only identities are unchanged); `timing_for` and `coverage_for` (the strategy view's `day_coverage(...).wire()` at the slice's end) are passed to `ReplaySource`; `days` may be omitted when `windows` names them.
* **Tests.** `tests/unit/test_research_windows.py`, 15 tests: `test_window_validation` ×6, `test_slice_result_records_windows_coverage_and_inputs`, `test_horizon_past_the_slice_is_censored`, `test_a_window_outside_the_recorded_session_is_refused`, `test_whole_day_dataset_identity_unchanged`, `test_windowed_dataset_in_custody`, `test_windowed_dataset_refused_by_the_locked_exam_and_promotion`, and three `hypothesis` properties over random slices and random gaps in a real market store (25 examples each): `test_no_look_ahead_in_any_window`, `test_slices_are_independent`, `test_gaps_are_never_filled`. The engine is a double that decides on every bar visible at the clock it is stepped to; the closes are read through a real view cut at the spec's end. Runs (worktree, the new file plus `test_promotion_gate`, `test_dataset_fitting`, `test_custody_ledger`, `test_candidate_freeze` (the golden), `test_research_attempts`, `test_rl_research`, `test_research_worker`, `test_custody_promotion`, `test_shared_engine`; then `tests/contracts` in its own process): run 1 230 passed, 1 skipped; 525 passed, 10 skipped. Run 2 the same. On the main checkout after step 3, the same files: run 1, 230 passed, 1 skipped, and `tests/contracts` 529 passed, 5 skipped, 1 failed (`test_prf_str_09_the_run_time_watch`, while a replay test ran beside it; it passed alone and in run 2); run 2, 230 passed, 1 skipped; 530 passed, 5 skipped.
* **Breaks** (each failed, then restored): the slice's cutoff left at the day's end (1 failed); horizons not censored at the slice's end (1); `windows` added to a days-only identity (1); a windowed dataset accepted by `evaluate` (1). A fifth, dropping only the endpoint check in `windowed_labels`, failed nothing: `censor` and the cut-off closes already cover it (defence in depth, recorded).
* **Deviations from the outline.**
  * A whole day is `[open, close)`, not `[open, close]`: that is the days-only replay's own `session_close`, so a whole-day window replays the same rows (tested).
  * The custody test is in `test_research_windows.py`, not `test_custody_ledger.py`; custody records the window's day through the existing ordinary exposure (no new custody event kind).
  * `windows` is not added to `OPTIONAL_IDENTITY_FIELDS`: the golden `legacy_identity_445eb116.json` pins legacy's two field lists (`test_candidate_freeze.py::test_golden` failed when it was).
  * A slice's end never raises legacy's "available directional label has no observed horizon endpoint"; such a label is censored. A days-only day keeps legacy's refusal.
  * `evaluate` refuses any windowed manifest, locked or not, so a windowed dataset is rows only (exploratory).
* **Fork calls.** None. No score, threshold, gate or money value changed; BuyerEdge and the days-only replay are unchanged.

## Completion conditions

* F-4 and F-6 are answered before steps 3 and 5. F-1, F-2 and F-3 are answered before live use. Until then legacy's behaviour stands, and no step changes it.
* Steps 2–5 are built, tested twice, break-checked and recorded "as built" here.
* Step 4's matrix reconciles with no difference, with nothing re-sent, and its table is recorded with the simulation label.
* The new Linux-only rows are added to SLICE-15's waiting list, and SLICE-15's existing row on the strategy timer is replaced by step 3's.
