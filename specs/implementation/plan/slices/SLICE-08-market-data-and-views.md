# SLICE-08 — Market data and views

* **Status:** proposed (2026-10-29); reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-08-review-2026-10-29)), whose findings are resolved in this text. Step 1 is built (OA_NEW `484a1ec` on `slice-08`; [Step 1 as built](#step-1-as-built)). Step 2 is built (OA_NEW `42879dd`; [Step 2 as built](#step-2-as-built)). Step 3 is built (OA_NEW `fb8f2bb`; [Step 3 as built](#step-3-as-built)). Step 4 is built (OA_NEW `e070d01`; [Step 4 as built](#step-4-as-built)); its C-1 capture is pending. Step 5 is built (OA_NEW `7ebee6c` and `4ecc799`; [Step 5 as built](#step-5-as-built)). Steps 2–6 are deepened in turn, each after the step before it is built, as in SLICE-04, SLICE-05, SLICE-06 and SLICE-07 (the delivery plan's depth rule).
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [market-data spec](../../design/market-data-and-canvas.md). Every deviation is marked **Deviation**. No score, threshold or money value is set here: the confirmation lag is POL-019's approved 7 s, bound only in tests to labelled values.
* **Phase:** master Phase 5 (A01-F1…F5, D08). Environment class S, except step 4's captured OpenAlgo responses (class R).
* **Builds on:** SLICE-03 and SLICE-04 as built, and on SLICE-06 as built (the protection loop reads `closes` and `latest_tick`). The branch `slice-08` is cut from `agentic-desk` (OA_NEW `536f857`, SLICE-06 plus the repository's `AGENTS.md`).
* **Owner answers applied:** [Q-030](../../decisions/owner-questions.md#q-030) option A (a bar is final at its confirmation instant; a later tick is a correction revision). POL-O04 (OD-AS-2…OD-AS-13) stays open: every start-time behaviour stays today's (the spec's non-goals). [Q-031](../../decisions/owner-questions.md#q-031) option A (`latest_tick` for a held option from the chain poll). The owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) apply: a fork touching money keeps legacy's live behaviour and is logged here as **Fork call**.
* **Tasks and proofs:**
  * **Step 1:** TASK-S08-01 (PRF-MKT-01).
  * **Step 2:** TASK-S08-02 (PRF-MKT-02, PRF-MKT-03).
  * **Step 3:** TASK-S08-03 (PRF-MKT-04, PRF-MKT-05, PRF-MKT-06).
  * **Step 4:** TASK-S08-05 (PRF-MKT-08).
  * **Step 5:** TASK-S08-04 (PRF-MKT-07).
  * **Step 6:** TASK-S08-06 (PRF-MKT-09).

**In plain words.** This slice gives the new system real price data in place of the made-up test prices. Step 1 builds the rules for time: what a trading day is, which minute a price belongs to, and when a minute's bar is final. Step 2 builds the store the market process writes and everyone else reads. Step 3 builds the "views", fixed snapshots every decision reads. Step 4 connects OpenAlgo and checks two facts the entry planner depends on. Step 5 plugs the views into the entry checks and the protection loop. Step 6 adds the first Canvas tool, marking confirmed swing highs and lows for inspection only. Trading rules and limits do not change.

**Excluded, and where each part arrives:**

* **SLICE-09:** strategies' input requirements and what they do with an unmet one; the decision pass's wait for a window's seal and its bound; the consumers of the `exact_minute` join and of the five reads step 3 builds for SLICE-09 (BuyerEdge's scoring).
* **SLICE-11:** the market process's service unit, supervision and retention.
* **PRF-ADM-07 (Deviation from the delivery plan's SLICE-08 row):** planner parity over recorded days (`scripts/compare_parity.py`, class P) needs recorded sessions, captured with TASK-S11-07. It runs then, before any live use, as PRF-PRT-08 does. Step 5's port parity (PRF-MKT-07) is its unit-level stand-in, and step 4 checks the PE delta sign at the source (SLICE-04 step 3's carried check).
* **Canvas beyond confirmed swings,** and its renderer: later Canvas work.

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | The calendar, window definition and window facts (`contracts/market.py`); the tick record and its lifting from a raw tick (`market/ingest.py`); the fold, on-time rule, revisions, resampling and late counts (`market/view.py`). Pure: no store, no process | PRF-MKT-01 |
| 2 | The market store (records, seals, coverage, head, `store_id`) and publication; the merge; the simulated source; the live loop's poll, record and seal, driven by a recorded clock; the reference facts store and recorder; `market.bar_confirm_lag_secs` and `market.poll_interval_secs` bound in the market composition; CP-M1…CP-M3 | PRF-MKT-02, PRF-MKT-03 |
| 3 | View policies and identities, re-opening, sealed-only bars, corrections, `stale: drop` and `report`, the reads; quality and requirements | PRF-MKT-04, PRF-MKT-05, PRF-MKT-06 |
| 4 | Two characterizations first (which Greeks the legacy planner's chain rows carry; the sign of PE deltas in the captured chains); then the OpenAlgo market source in `adapters/openalgo.py`: `quotes` with the history repair, `expiry`, `optionchain`, `multioptiongreeks`, `history`, websocket ticks | PRF-MKT-08 |
| 5 | `StoreMarket`, the kernel's market and calendar ports over the store, composed in `bootstrap`; `resolve` and one view per protection pass, recorded on protection's events; premium closes with their day high; `latest_tick` from the chain poll (Q-031 A); the gap sources (`missing_minutes`, the day high, the feed-gap fact) | PRF-MKT-07 |
| 6 | Canvas: `view(as_of)`, confirmed swings, facts, annotations, history and supersession, budgets; `resources/canvas.schema.json`; the import guard | PRF-MKT-09 |

The characterizations come before the port (step 4 before step 5) because the planner's strike selection reads delta, and the port must carry the Greeks the planner read.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root. `RFL` is `scripts/run_framework_live.py`.

* **Who fetches.** The MCP gateway's `market_pull` job runs every minute from 09:00 to 15:59 on weekdays (`src/interfaces/mcp/core/scheduler.py:174-215`) and skips after the configured close (`src/interfaces/mcp/core/marketpull.py:889-896`). Every record of one poll carries the poll's start instant (`:835-846`). The live host only reads the store (`RFL:91-97`); worker processes may not open a subscription (`src/runtime/feed/__init__.py:48`).
* **The store** is append-only NDJSON.gz per stream, instrument and day (`src/data/marketdata/store.py:43-48`, `:117-125`), with a per-file `seq` (`:206-256`) and the envelope `schema`, `at`, `fetched_at`, `src`, `instrument`, `origin`, `seq`, `quality`, `d` (`:291-293`, `:328-335`).
* **Ticks** come from the OpenAlgo websocket (`src/interfaces/mcp/domains/monitoring/state.py:69-124`), buffered and flushed to the store. A tick's arrival instant is kept in memory only (`:72`). The recorder covers the indices, not the held options (`RFL:5065-5066`).
* **Lifting a tick** (`src/data/marketdata/ticks.py`):
  * price: the first numeric field of `ltp`, `last_price`, `close`, `price`, where a bool or NaN is not numeric (`:72`, `:88-100`);
  * size: the first numeric field of `last_quantity`, `ltq`, `volume` (`:78`, `:555-560`);
  * time: the first of `ltt`, `timestamp`, `t`, `exchange_timestamp` that `to_epoch_ms` reads and that converts to a datetime, else the envelope's `at` (`:103-120`). `to_epoch_ms` (`src/data/tape/schema.py:279-342`) reads a `datetime` through `_aware`; a positive number as seconds below 1e11, milliseconds below 1e14, microseconds below 1e17, else nanoseconds; a digit string as that number; any other string by `datetime.fromisoformat`, then six `strptime` formats; a naive time as IST (`_aware`); anything else as nothing. A NaN or infinite number raises in legacy (`int(nan)`, `int(inf)`), outside any `try`.
* **The fold** (`ticks.py:511-560`): per exchange day, ticks in record order into `_floor(event, interval)` windows (`:472-475`): `open` the first price, `high` and `low` the extremes, `close` the last, `ticks` the count, `volume` added with `+=` from `0.0`. A tick with no price is skipped; a tick whose exchange date is not the day is skipped (`:533-534`).
* **Higher timeframes** (`src/core/framework/runtime/context.py:50-78`, `:264-278`): resampled from the confirmed one-minute bars, confirmed once their own end plus the lag has passed.
* **Confirmation** (`ticks.py:680-690`): `confirmed = now >= window_start + interval + lag`, `lag` `market.bar_confirm_lag_secs`, default 7 s, with an invalid value silently 7 s (`src/core/framework/market.py:89-119`).
* **Late ticks** (`ticks.py:148-157`, `:189-202`, `:249-308`): late when `arrival - (floor(event, 60) + 60) > lag`, always on the one-minute window, measured at the flush, counted whether or not the tick has a price, and kept as `late_ticks`, `late_max_secs` (a float rounded to three places) and `late_lag_secs`. They still change the bar at every later read, since every read folds every tick (`:572-640`). That is what Q-030 changes.
* **Calendar** (`src/core/framework/market.py:44-132`): timezone `Asia/Kolkata`; session 09:15 to 15:30, both ends inclusive, Monday to Friday. Holidays and special sessions only through OpenAlgo's market timings and market holidays endpoints, unknown on failure (`src/interfaces/mcp/core/market_calendar.py:67-205`). IST is also hard-coded in `store.py:84`, `ticks.py:65`, `heal.py:49`, `journal.py:39`, `marketpull.py:54`, `market_calendar.py:45`, `reference/store.py:36`, and five more modules.

## Step 1 — calendar, windows and bars

The authorities are the spec's [Records and identity](../../design/market-data-and-canvas.md#records-and-identity-contractsmarketpy), [Calendar and windows](../../design/market-data-and-canvas.md#calendar-and-windows-contractsmarketpy) and [Bars and finality](../../design/market-data-and-canvas.md#bars-and-finality-marketviewpy) sections. Step 1 is pure functions and records: nothing is stored, fetched or run as a process.

### Decisions

**Refusals.** Every record below checks its fields in `__post_init__` and raises `ValueError` on a failed check, as `contracts/market.py` does today (`_money`, `_finite`). An int field refuses a bool. A decimal-string field uses the existing `_finite`. A `date` field matches `^\d{4}-\d{2}-\d{2}$`. Every function below that takes a `datetime` raises `ValueError` on a naive one.

#### Instants (`contracts/market.py`)

* `instant(ts: Timestamp) -> datetime`: `datetime.fromisoformat(ts.utc_iso.replace("Z", "+00:00"))`; a naive result raises `ValueError`.
* `utc(dt: datetime) -> str`: `dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")`, the format of `adapters/clocks.py:10-11`. The market package imports contracts only.

#### The calendar (`contracts/market.py`)

* `Calendar(calendar_id: str, version: str, utc_offset_minutes: int, open: str, close: str, weekdays: tuple[int, ...])`, frozen. `calendar_id` and `version` non-empty strings; `utc_offset_minutes` an int in −720…840; `open` and `close` match `^([01]\d|2[0-3]):[0-5]\d$` with `open < close`; `weekdays` a sorted, non-empty tuple of distinct ints in 0…6.
* `CALENDARS = {"nse-fo/v1": Calendar("NSE-FO", "nse-fo/v1", 330, "09:15", "15:30", (0, 1, 2, 3, 4))}`, keyed by version; `calendar(version) -> Calendar` raises `ValueError` for an unknown version. `calendar_id` is the id sessions use, so a view's `calendar_id` (step 3) compares equal to the session's (`kernel/admission.py:644-647`). A fixed offset, not `zoneinfo`: India has had no daylight saving since 1945, so the two agree, and a fixed offset needs no time-zone database on the host.
* `Calendar.local(dt) -> datetime`: `dt` in the calendar's offset. `Calendar.exchange_date(dt) -> str`: `local(dt).date().isoformat()`.
* `Calendar.in_regular_hours(dt) -> bool`: the local weekday is in `weekdays`, and `open <= local time <= close`, both ends inclusive, as legacy's `is_open`.
* `DayStatus = Literal["open", "closed", "special", "unknown"]`. `SessionTiming(date: str, status: DayStatus, open: str | None, close: str | None)`, frozen: `status` one of the four; `open` and `close` set exactly when the status is `open` or `special`, with the calendar's `HH:MM` pattern and `open < close`. Step 5 builds these from the recorded market timings and holidays facts; step 1 defines the record and `Calendar.in_session(dt, timing: SessionTiming | None) -> bool | None`:
  * `timing` `None` or status `unknown`: `None`;
  * `closed`: `False`;
  * `open` or `special`: `True` when `exchange_date(dt) == timing.date` and `timing.open <= local time <= timing.close`, both inclusive, else `False`.

#### Windows (`contracts/market.py`)

* `WindowDef(interval_secs: int, confirm_lag_secs: str, alignment: str = "epoch")`, frozen. `interval_secs` a positive int; `confirm_lag_secs` fully matches `^(0|[1-9][0-9]*)(\.[0-9]{0,5}[1-9])?$`, one canonical text per value (so `"7"`, never `"7.0"` or `"07"`), at most six decimal places, a whole number of microseconds; `alignment` exactly `"epoch"`. Zero lag is allowed, as legacy's (`market.py:99-100`).
* `BASE_INTERVAL_SECS = 60`: ticks fold only into one-minute windows; longer ones are resampled (below).
* `WindowDef.text -> str`: `f"{interval_secs}s/{alignment}/lag{confirm_lag_secs}"`, part of every view identity (step 3).
* `window_start(event: datetime, interval_secs: int) -> datetime`: `epoch = int(event.timestamp())`, `datetime.fromtimestamp(epoch - epoch % interval_secs, timezone.utc)`. That is legacy's `_floor` (`ticks.py:472-475`) in UTC instead of IST: the same instant.
* `window_end(start, wdef)`: `start + interval`. `confirm_at(start, wdef)`: `start + interval + lag`, the lag as `timedelta(microseconds=int(Decimal(lag) * 10**6))`.
* `WindowFacts(partial: bool, closed: bool, confirmed: bool, sealed_revision: int | None, in_session: bool | None)`, and `window_facts(start, wdef, at, *, sealed_revision=None, in_session=None) -> WindowFacts` with `partial = start <= at < end`, `closed = at >= end`, `confirmed = at >= confirm_at`. `sealed_revision` is the highest revision the store has sealed, or `None`; it and `in_session` are passed through, since the store and the calendar own them (steps 2 and 5).

#### Ticks and bars (`contracts/market.py`)

* `TickRecord(instrument: str, source: str, seq: int, event_at: Timestamp, arrival_at: Timestamp, event_time_source: str, price: str | None, size: str | None)`, frozen:
  * `instrument` and `source` non-empty;
  * `event_at.domain` is `exchange`; `arrival_at.domain` is `wall` or `recorded` (a recorded clock stamps `recorded`, `adapters/clocks.py:21-22`, and step 2's loop runs on one);
  * `event_time_source` is `exchange` or `arrival`;
  * `price` and `size` finite decimal strings (`repr` of the float) or `None`;
  * `seq` a non-negative int: the store's commit sequence (step 2), and in step 1's tests the list index.
* `Bar(instrument: str, interval_secs: int, start: Timestamp, open: str, high: str, low: str, close: str, volume: str, ticks: int, revision: int, first_seq: int, last_seq: int, late_ticks: int)`, frozen. `start.domain` is `exchange`; the five decimal fields finite; `interval_secs >= 1`, `ticks >= 1`, `revision >= 1`, `late_ticks >= 0`, `0 <= first_seq <= last_seq`. `first_seq` and `last_seq` are the `seq` of the first and last ticks folded (those with a price), as legacy's `_seq_first` and `_seq_last` (`ticks.py:541-552`); a resampled bar takes the first base bar's `first_seq` and the last one's `last_seq`.
* `LateCount(date: str, instrument: str, late_ticks: int, late_max_secs: str | None, late_lag_secs: str)`, frozen; `late_ticks >= 0`; `late_max_secs` `None` exactly when `late_ticks` is 0.

#### Lifting a raw tick (`market/ingest.py`)

* `lift_tick(instrument: str, raw: Mapping, *, source: str, seq: int, arrival_at: Timestamp) -> TickRecord`, a port of legacy's field rules (What legacy does):
  * `price`: `repr(float(v))` of the first numeric field of `ltp`, `last_price`, `close`, `price`, else `None`. Numeric means an int or float that is not a bool and is finite. A NaN or infinite value is not numeric, and the next field is tried. **Deviation (correction):** legacy's `_num` lets infinity through as a price, and its `max` and `min` then carry it; a broker sending infinity is not a price, and the contract refuses a non-finite decimal string.
  * `size`: the same rule, over `last_quantity`, `ltq`, `volume`.
  * `event_at`: for each of `ltt`, `timestamp`, `t`, `exchange_timestamp` in turn, `ms = epoch_ms(value)`; if `ms` is not `None` and `datetime.fromtimestamp(ms / 1000, timezone.utc)` does not raise `OSError`, `OverflowError` or `ValueError`, that instant, as `Timestamp(utc(...), "exchange")` with `event_time_source` `exchange`. Otherwise the next field, as legacy (`ticks.py:111-119`). If none gives an instant, `event_at` is `arrival_at`'s instant in the `exchange` domain, with `event_time_source` `arrival`.
* `epoch_ms(value) -> int | None` is legacy's `to_epoch_ms` (`src/data/tape/schema.py:279-342`), ported:
  * `None` or a bool: `None`;
  * a `datetime`: an aware one as is, a naive one as IST (+330 minutes), `int(dt.timestamp() * 1000)`;
  * an int or float: `None` if not finite (**Deviation (correction):** legacy raises on NaN and infinity, and a raising tick would stop the recorder); `v = float(value)`; `None` if `v <= 0`; `int(v * 1000)` below 1e11; `int(v)` below 1e14; `int(v / 1000)` below 1e17; else `int(v / 1_000_000)`;
  * a string: stripped; empty gives `None`; all digits gives `epoch_ms(int(text))`; else `datetime.fromisoformat(text)`, then in order `%Y-%m-%dT%H:%M:%S%z`, `%Y-%m-%d %H:%M:%S%z`, `%Y-%m-%dT%H:%M:%S`, `%Y-%m-%d %H:%M:%S`, `%Y-%m-%d %H:%M`, `%Y-%m-%d` with `strptime`; the first that parses, naive read as IST, `int(dt.timestamp() * 1000)`; none gives `None`;
  * anything else: `None`.

  It lives in `market/ingest.py` because only a source's raw values need it.

#### The fold, the on-time rule, revisions and resampling (`market/view.py`)

* `on_time(tick, wdef) -> bool`: `instant(tick.arrival_at) <= confirm_at(window_start(instant(tick.event_at), wdef.interval_secs), wdef)`. Equality is on time: legacy's late test is `after_close > lag`, strictly greater (`ticks.py:157`). `wdef.interval_secs` must be `BASE_INTERVAL_SECS`, else `ValueError`.
* `fold(ticks: Sequence[TickRecord], wdef, *, revision: int, late_ticks: int) -> Bar | None`: the ticks must share one instrument and one base window (else `ValueError`). In ascending `seq`, skipping a tick whose `price` is `None`: `open` the first price; `high` the running `max` and `low` the running `min`, compared as `float(price)`; `close` the last. `volume`: `v = 0.0`, then `v += float(size)` for each folded tick that has a size, in `seq` order, then `repr(v)`; not `sum()` or `math.fsum`, which round differently from Python 3.12 on. `ticks` is the number folded. `None` when no tick has a price. Each price is written back as `repr(float(price))`.
* `bars(ticks: Sequence[TickRecord], wdef, *, calendar: Calendar, date: str, through: Mapping[str, int] | None = None, revisions: Mapping[str, int] | None = None) -> tuple[Bar, ...]`:
  * every tick has the same instrument (else `ValueError`); only ticks whose event instant's `calendar.exchange_date` is `date` are used (legacy's day filter, `ticks.py:533-534`);
  * `through` and `revisions` are both `None` or both mappings with the same keys, each key `utc(window_start)` and each revision an int ≥ 2 (else `ValueError`);
  * a window not in `through`: **revision 1**, the fold of its on-time ticks, `late_ticks` 0;
  * a window in `through`: the fold of its ticks with `seq <= through[key]`, as revision `revisions[key]`, with `late_ticks` the number of late ticks among them. Step 2's seals supply both maps;
  * a window whose fold is `None` is left out; the result is oldest window first.
* `resample(base: Sequence[Bar], interval_secs: int, wdef, *, now: datetime) -> tuple[Bar, ...]`, legacy's `_resample` (`context.py:50-78`): `base` must be confirmed one-minute bars of one instrument, oldest first, and `interval_secs` a multiple of 60 (else `ValueError`). Each goes into the window `window_start(start, interval_secs)`: the first gives `open`, `high`, `low`, `close` and `volume`; each later one raises `high` with `max`, lowers `low` with `min`, sets `close`, and adds its volume with `+` as floats. A window is returned only when `now >= start + interval_secs + lag`. `ticks` is the sum of the base bars' ticks; `revision` the highest base revision; `late_ticks` the sum.
* `late_counts(ticks, wdef, *, calendar, date) -> tuple[LateCount, ...]`, sorted by instrument, one per instrument with ticks on `date`: late ticks counted whether or not they carry a price, as legacy (`ticks.py:198-202`), on the base window; `late_max_secs` the largest `arrival - window_end` as `f"{us // 10**6}.{us % 10**6:06d}"` with `us = d // timedelta(microseconds=1)`; `late_lag_secs` the `wdef`'s lag. **Deviation:** legacy stored `round(worst, 3)` as a float and measured from the flush; the target keeps microseconds and measures from receipt.

### Tests

`tests/unit/test_market_windows.py` (tree delta **T-40**). Every value is labelled synthetic. The expectations are written by hand from the rules above, independently of the code (A08-F3); the legacy cases are read from a golden file generated once from legacy (below).

| Group | Cases |
|---|---|
| Instants and calendar | `instant` round-trips `utc`; a naive string refused; a naive `datetime` refused by `utc`, `Calendar.local`, `window_start` and `window_facts`; `exchange_date` at 18:29:59.999999 and 18:30:00 UTC; `in_regular_hours` at 09:14:59, 09:15:00, 15:30:00, 15:30:01 IST and on a Saturday; `in_session` for `None`, `unknown`, `closed`, `open`, another date, and a `special` 18:00–19:00 timing; every `Calendar` and `SessionTiming` refusal; an unknown calendar version; `calendar("nse-fo/v1").calendar_id == "NSE-FO"` |
| Windows | `window_start` at 10:41:00.000, 10:41:59.999 and 10:42:00.000 IST; `window_facts` just before and at the end and the confirmation instant; `WindowDef.text`; every `WindowDef` refusal, including `"7.0"`, `"07"`, `"7e0"`, `"+7"`, `" 7"`, `"7.0000001"` and a bool interval |
| Confirmation (POL-019) | With lag `"7"`, ticks arriving 6 s, 7 s and 8 s after the window's end: the first two on time and in revision 1; the third late, outside revision 1, counted in `late_counts` with `late_max_secs` `"8.000000"`. With lag `"0"`, a tick arriving at the end is on time and one a microsecond later is late. A late tick with no price is counted |
| Q-030 | A window with a late tick: `bars` without `through` excludes it; with `through` at the late tick's `seq` and revision 2, it is folded, `late_ticks` 1. The revision-1 bar is unchanged by any later tick. `through` without `revisions`, mismatched keys, and revision 1 in `revisions` refused |
| Resampling | Five one-minute bars into a 5-minute bar by hand; a 15-minute window aligned with IST minutes; a one-hour window starting at :30 IST; a higher window not returned before its end plus the lag, returned at it; a late tick on time for its 5-minute window but late for its one-minute bar stays out of both revision-1 bars |
| Lifting | Each price field's precedence; a bool, a NaN and an infinity skipped to the next field (the Deviation); the size fields' precedence; each time field's precedence; a time field whose value converts to an out-of-range datetime skipped to the next; each `epoch_ms` branch with whole-second values (seconds, milliseconds, microseconds, nanoseconds, a digit string, an aware and a naive `datetime`, `"2025-04-01 09:15:00+05:30"`, `"2025-04-01 9:15:00"` which only `strptime` reads, read as IST, NaN, an unreadable value); the arrival fallback flagged `arrival` |
| Fold | Order by `seq`, not by event time; a tick with no price skipped and not counted; a tick of another date skipped; volume `"0.0"` with no size; volume added in order, not compensated (three sizes whose `+=` sum differs from `math.fsum`); `first_seq` and `last_seq`; mixed instruments or windows refused; a window whose ticks are all late left out of revision 1 |
| Records | Every `TickRecord`, `Bar` and `LateCount` refusal, including `arrival_at` in the `exchange` domain refused and in `recorded` accepted |
| Boundary | No module under `src/autonomous_trading/kernel/` imports `autonomous_trading.market`, checked with `ast` over every `kernel/**/*.py` |
| Legacy parity | Each case of `tests/fixtures/market/fold_golden.json` (tree delta **T-41**): the target's revision-1 bars equal legacy's `_fold` output field by field, matched by window start `t`, the floats compared as `repr` strings |

**The golden file.** `scripts/gen_fold_parity.py` (tree delta **T-42**), run once against a legacy checkout at 445eb116, never in the suite, as SLICE-06's `scripts/gen_trail_parity.py`.

* **Loading legacy:** it puts the legacy checkout's root on `sys.path` and imports `src.data.marketdata.ticks` (the module uses package-relative imports, so a file-path load does not work).
* **Cases:** 40, from `random.Random(seed)` for seeds 0–39. Each has 1–200 ticks over 1–5 one-minute windows on `day = "2026-11-02"`, between 10:00 and 10:05 IST. Each tick draws its price field (one of the four, sometimes none), its size field (one of the three, sometimes none) and its time field (one of the four, in a numeric seconds, milliseconds or ISO form, sometimes none), with finite values only: no NaN or infinite price, size or time is ever generated. `event_ms` is the tick's own time, or for a tick without one the arrival; `arrival_ms = event_ms + rng.randint(0, 7000)`, so no tick is late and every case is compared.
* **Folding:** one `_fold(rows, buckets, day, 60)` per case with a fresh `buckets = {}`. Each row is `{"d": raw, "at": datetime.fromtimestamp(arrival_ms / 1000, IST).isoformat(), "seq": i, "schema": 2}`, so a tick without its own time is filed by its IST arrival date, as legacy files it.
* **Output:** `{"generator": "scripts/gen_fold_parity.py", "legacy_commit": "445eb116", "python": <version>, "cases": [{"seed", "day", "raw_ticks", "arrival_ms", "bars": [{"t", "open", "high", "low", "close", "volume", "ticks"}]}]}`, with `t` the window start as `utc(key)` and the floats as `repr` strings, the shape of `tests/fixtures/trail_parity_445eb116.json`.
* **The test** lifts each raw tick with `lift_tick(instrument, raw, source="openalgo.websocket", seq=index, arrival_at=Timestamp(utc(datetime.fromtimestamp(arrival_ms / 1000, timezone.utc)), "wall"))`, folds with `bars(..., WindowDef(60, "7"), calendar=calendar("nse-fo/v1"), date=day)`, and compares by `t`.

### Break checks

Each is applied with every anchor checked before writing, and restored byte for byte with an md5 check. Each must fail a listed test.

| Change | Test that must fail |
|---|---|
| `on_time` with `<` instead of `<=` | Confirmation |
| Revision 1 folds every tick, as legacy | Q-030 |
| Fold in event-time order | Fold |
| Volume with `math.fsum` | Fold |
| Size fields in the order `volume`, `last_quantity`, `ltq` | Lifting; legacy parity |
| `window_start` floors the IST wall clock's seconds of day instead of the epoch | Resampling (one-hour alignment) |
| `in_regular_hours` with an exclusive close | Instants and calendar |
| A naive time read as UTC | Lifting |
| `late_counts` measured from the confirmation instant instead of the window's end | Confirmation |
| `resample` judges lateness on the higher window | Resampling |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/market.py` | `instant`, `utc`, `Calendar`, `CALENDARS`, `calendar`, `DayStatus`, `SessionTiming`, `BASE_INTERVAL_SECS`, `WindowDef`, `window_start`, `window_end`, `confirm_at`, `WindowFacts`, `window_facts`, `TickRecord`, `Bar`, `LateCount` |
| The `market` package's `__init__.py` | New, empty |
| `src/autonomous_trading/market/ingest.py` | New: `epoch_ms`, `lift_tick` |
| `src/autonomous_trading/market/view.py` | New: `on_time`, `fold`, `bars`, `resample`, `late_counts` |
| `tests/unit/test_market_windows.py` | New (T-40) |
| `tests/fixtures/market/fold_golden.json` | New (T-41), generated once |
| `scripts/gen_fold_parity.py` | New (T-42) |

No existing test or `tests/conftest.py` changes: step 1 adds pure code that nothing yet calls.

### Completion conditions (step 1)

* Every test above passes, twice in a row, with the whole suite.
* Every break check fails a listed test, and every file is restored (md5).
* `ast.parse` passes on every edited Python file.

### Step 1 as built

**In plain words.** The rules for time are built and tested: which minute a price belongs to, when a minute's bar is final, how a late price becomes a correction instead of changing the bar, and how 5-minute and longer bars are built from 1-minute ones. On 40 generated cases the new code builds exactly the bars the old code built.

Commit `484a1ec` on `slice-08` (cut from `agentic-desk` at `536f857`), after a test-only commit `d713cb6` (below). It changes 7 paths. The files match the step's table.

**Choices made while building:**

| Topic | As built |
|---|---|
| `epoch_ms` on other types | A value that is not `None`, a bool, a `datetime`-like or a number is read through `str(value)`, as legacy's `to_epoch_ms` does, not refused as the text above said. That is legacy's rule (fork rule) |
| Naive-datetime check | `market/view.py` uses `contracts/market.py`'s `_aware` for `resample`'s `now` |
| The golden file | Generated with Python 3.14 from the legacy export at 445eb116 (`src/` only, enough for `src.data.marketdata.ticks`): 40 cases, 136 bars. Each tick has its own time in 85% of cases, in seconds, milliseconds or ISO form |
| The flaky evidence tests | Two adapter tests that check what is recorded, not the deadline, ran under the 500 ms deadline on a live clock and failed twice in about 57 runs while helper agents loaded the machine. Commit `d713cb6` gives those two a 5 s deadline (`ROOMY_MS`); the deadline tests are unchanged. This is the timing-sensitive send test recorded in SLICE-06 step 4 as built |
| Test runs | 941 passed, twice in a row, after the test-only commit |

**Tests:** `tests/unit/test_market_windows.py`, 92 cases (40 of them legacy parity), every group of the table above.

**Break checks** (anchors checked first, every file restored byte for byte, md5 verified): all 10 failed a test.

| Change | Test that failed |
|---|---|
| `on_time` with `<` | Confirmation (2 tests) |
| Revision 1 folds every tick | Confirmation; Q-030 (2 tests) |
| Fold in event-time order | Legacy parity (39 cases) |
| Volume with `sum()` | Fold; legacy parity (6 cases) |
| Size fields with `volume` first | Lifting (the golden cases never carry two size fields, so parity does not catch it) |
| `window_start` on the IST wall clock | Resampling (one-hour alignment) |
| An exclusive close | Instants and calendar |
| A naive time read as UTC | Lifting (`epoch_ms`) |
| Lateness measured from the confirmation instant | Confirmation (2 tests) |
| `resample` keeps the first close (replaces "judges lateness on the higher window", which no mutation of `resample` can express: it takes bars, not ticks) | Resampling |

## Step 2 — store, ingestion and publication

The authorities are the spec's [Store and publication](../../design/market-data-and-canvas.md#store-and-publication-marketstorepy) and [Ingestion and merge](../../design/market-data-and-canvas.md#ingestion-and-merge-marketingestpy) sections. Step 2 builds the market process's write side and a read-only reader. Views (step 3) and OpenAlgo (step 4) are not here: the only source is the simulated one. Fresh design and readiness reviewers reviewed this step ([review](../../egm/plan/review.md#slice-08-step-2-review-2026-10-30)); their findings are resolved below.

**In plain words.** The market process gets its own database, separate from the trading ledger. It writes prices in batches, each batch all-or-nothing, and seals each minute once it is final; after that, any price for that minute is kept only as a correction. Anyone else opens the database read-only. A crash at any moment leaves either the whole batch or none of it.

### Decisions

#### A shared storage module (`kernel/ledger/runtime.py`)

* The ledger's writer lock moves, unchanged, from `kernel/ledger/store.py` (`_WriterLock`) into `kernel/ledger/runtime.py` as `WriterLock`; `store.py` imports it under its old name. So the market package imports from the kernel only `kernel/ledger/runtime.py` (`connect`, `WriterLock`) and `kernel/ledger/envelope.py` (`canonical`). **Deviation (from step 1's "the market package imports contracts only"):** those two modules are the storage layer, not financial logic. A test pins it: no `market` module imports any other `autonomous_trading.kernel` module.

#### Records (`contracts/market.py`, built)

* `IncomingRecord(stream, instrument, source, key, event_at, arrival_at, payload, origin, source_order=None)`, `MarketRecord(record, revision, seq, conflict)`, `CoverageEntry(source, stream, instrument, status, scope_from, scope_to, detail=None)` and `ReferenceFact`, as built: `payload` a `dict` (the store checks at commit that canonical JSON can write it), `status` `covered` or `interrupted`, and `ReferenceFact` normalising as legacy (`src/data/reference/store.py:65-126`): the key stripped and upper-cased, dates cut to their first ten characters, `available_at` read from epoch milliseconds, a `datetime` or an ISO string with an offset, `effective_to` optional, `revision` from 0.
* **Keys, per stream.** A tick: `f"{connection}:{receipt}"`, with `connection` a `uuid4` hex made at each process start and each reconnect, and `receipt` a counter from 1 on that connection, so keys never repeat across restarts. A quote or a Greeks batch: `utc(when)`; a chain: `f"{expiry}@{utc(when)}"`; a history bar: its window start as `utc`. Step 2's ticks get their keys from the simulated source; step 4's source makes them.
* **A tick's times come from its payload.** `tick_record(instrument, raw, *, source, key, arrival_at) -> IncomingRecord` in `market/ingest.py` lifts the raw tick (step 1's `lift_tick`) and sets `event_at` from it, so the stored `event_at` and the lifted one cannot differ. The store refuses (`ValueError`, inside the commit) a tick record whose `event_at` differs from its lifted one.

#### The store (`market/store.py`)

* **Opening.** `MarketStore.open(path, clock, *, fault_point=None) -> MarketStore | Refusal` takes the `WriterLock` (else `Refusal("MKT-R01", "writer_lock_held", None, "open")`) and `connect(path, writer=True)`. A file is new when `sqlite_master` has no `store_meta`; then, in one transaction, every table below, `store_meta(uuid4().hex, 1, clock.now().utc_iso)` and `head(1, 0)`. An existing file whose `store_meta.schema` is not `STORE_SCHEMA = 1` gives `Refusal("MKT-R02", "schema_unsupported", None, "open")`. `MarketReader.open(path)` connects read-only and raises `ValueError("MKT-R02 ...")` on the same check.
* **Tables.** Every column is `NOT NULL` except those named nullable; instants are stored as `utc_iso` text, payloads and values as canonical JSON:
  * `store_meta(store_id TEXT, schema INTEGER, created_at TEXT)`;
  * `head(id INTEGER PRIMARY KEY CHECK (id = 1), seq INTEGER)`;
  * `record(seq INTEGER PRIMARY KEY, stream TEXT, instrument TEXT, source TEXT, key TEXT, revision INTEGER, event_at TEXT, arrival_at TEXT, arrival_domain TEXT, origin TEXT, conflict INTEGER, source_order INTEGER nullable, window_start TEXT nullable, payload TEXT)`, unique on `(stream, instrument, source, key, revision)`, indexed on `(stream, instrument, window_start)`. `window_start` is set for ticks only, from the lifted event time;
  * `seal(seq INTEGER PRIMARY KEY, instrument TEXT, interval_secs INTEGER, window_start TEXT, revision INTEGER, through_seq INTEGER, tick_count INTEGER, late_count INTEGER)`, unique on `(instrument, interval_secs, window_start, revision)`;
  * `watermark(seq INTEGER PRIMARY KEY, instrument TEXT, sealed_through TEXT)`: every base window of the instrument whose confirmation instant is at or before `sealed_through` is final, with or without ticks;
  * `coverage(seq INTEGER PRIMARY KEY, source TEXT, stream TEXT, instrument TEXT, status TEXT CHECK (status IN ('covered','interrupted')), scope_from TEXT, scope_to TEXT, first_seq INTEGER nullable, last_seq INTEGER nullable, detail TEXT nullable)`;
  * `reference_fact(seq INTEGER PRIMARY KEY, kind TEXT, key TEXT, value TEXT, effective_from TEXT, effective_to TEXT nullable, available_at TEXT, source TEXT, revision INTEGER)`, unique on `(kind, key, effective_from, revision, available_at)`.
* **One sequence for every row.** Each row of a commit takes the next sequence after `head`; `head` moves to the last one in the same transaction. A reader bound to `through` reads only rows with `seq <= through`, so a commit is visible whole or not at all (Combined-F2).
* **The reads**, on `MarketStore` and `MarketReader` alike, each one `SELECT` (so one read transaction), rows with `seq <= through`, ascending `seq`: `head() -> int` (re-read each call); `records(stream, instrument, *, through) -> list[MarketRecord]`; `ticks(instrument, *, through, window=None) -> list[TickRecord]`, the latest revision of each tick key, lifted with `seq` the stored row's; `seals(instrument, *, through) -> list[Seal]`; `watermark(instrument, *, through) -> str | None`, the latest `sealed_through`; `coverage(*, through) -> list[dict]`; `reference_as_of(kind, key, decision_at, *, through=None)` (below). `Seal` is a frozen record of the table's columns. `store_id` and `schema` are properties.

#### The merge and the commit (`market/store.py`)

* `MarketStore.commit(records, *, coverage=(), now: datetime, wdef: WindowDef, instruments: Sequence[str] = ()) -> CommitResult`, one `BEGIN IMMEDIATE` transaction; any exception inside it rolls back and is re-raised:
  1. **Each record, in the order given**, against every stored revision of its `(stream, instrument, source, key)`, this commit's earlier inserts included. The rows are tried top to bottom, and the first that matches applies:

     | Stored | Incoming | Result |
     |---|---|---|
     | none | | `inserted`, revision 1 |
     | a revision with equal canonical payload | | `duplicate`: counted, not stored |
     | the latest revision has a `source_order`, and so has the incoming | `source_order` below the latest's | `outdated`: counted, not stored |
     | the same | `source_order` above the latest's | `revised`: revision max + 1 |
     | anything else (equal orders, or either order missing) | | `conflicted`: revision max + 1, `conflict` 1 |

  2. **Coverage rows** in the order given; `first_seq` and `last_seq` are the lowest and highest `seq` this commit gave records with the entry's source, stream and instrument, else null. A coverage entry's `source` is the records' `source` string.
  3. **Seals.** For every instrument with a tick window and no revision-1 seal whose confirmation instant is at or before `now`: revision 1 over its on-time ticks (step 1's `on_time`) committed so far; `through_seq` the highest of their `seq`, or 0 if none; `tick_count` the priced ones; `late_count` 0. Then, once per window: if any stored tick of a sealed window has `seq` above its latest seal's `through_seq`, the next revision over every stored tick of the window, with `through_seq` the highest `seq`, `tick_count` the priced ticks and `late_count` the priced late ones. Such a tick may be late, or **on time but committed after the seal**: either way it is a correction, so a sealed revision never changes (Q-030). Seals are written in order of instrument, window and revision.
  4. **Watermarks:** for each name in `instruments`, a row `sealed_through = utc(now)`.
  5. `head` moves to the last sequence used.

  `CommitResult(inserted, duplicate, outdated, revised, conflicted, seals, head)`.
* **Revision 1 in a view (amends step 1).** `bars(..., through=..., revisions=...)` now accepts revision 1: it folds the window's on-time ticks with `seq <= through`. Step 3's views always pass every window's sealed `through_seq`, so a straggler committed after a seal never enters revision 1. Step 1's test "revision 1 in `revisions` refused" becomes "revision 1 folds on-time ticks up to `through`".

#### Reference facts (`market/store.py`)

* `MarketStore.record_reference(facts) -> list[ReferenceFact]` is legacy's `merge` (`src/data/reference/openalgo_recorder.py:145-161`), in its own transaction with `head`. For each fact in order, the held facts with the same `(kind, key, effective_from)`, this call's earlier additions included: if any, the latest by `(reference_instant(available_at), revision)` (the first inserted on a tie, as `max`) is compared with Python `==` on the decoded value (so `75 == 75.0`, as legacy); equal is not added; different is added as revision `max + 1`. With none held, the fact is stored with its own revision. Lot size gates quantity, so the fork rule keeps legacy's merge, which compares only with the latest.
* `reference_as_of(kind, key, decision_at: Timestamp, *, through=None) -> ReferenceFact | ReferenceMissing`, legacy's `as_of` (`src/data/reference/store.py:190-206`): the key stripped and upper-cased; facts in force on `decision_at`'s IST date and with `available_at <= decision_at`, ordered as instants; the latest by `(available_at, revision)`, the first stored on a tie; otherwise `ReferenceMissing` `no_fact`, `not_yet_available` (one is in force but not yet known) or `not_in_force`. `through` defaults to the reader's `head()`.

#### Sources and the loop (`market/sources.py`, `market/ingest.py`)

* `MarketSource`, a `Protocol`: `identity: str`; `source_of(stream) -> str`, the `source` its records carry; `poll(stream, instrument) -> list[dict]`, the payloads of one fetch, raising on a failed fetch; `drain_ticks() -> list[IncomingRecord]`, every tick received and stamped since the last drain, in receipt order. A source **stamps a tick's `arrival_at` with the loop's clock and queues it in one step under one lock**, and never raises from `drain_ticks`; a raw tick canonical JSON cannot write is counted and dropped by the source.
* `SimulatedSource(identity="simulated")`: `responses[(stream, instrument)]` a list the test fills, each a list of payloads or an exception, consumed one per poll; `ticks` a list the test fills and `drain_ticks` empties; `source_of(stream)` is `identity`.
* `MarketLoop(store, source, clock, *, instruments, wdef, calendar, poll_streams=("spot", "chain"), fault_point=None)`:
  * **On construction**, from the store: the minute already polled, if the latest `covered` or `interrupted` coverage row's `scope_from` falls in the current IST minute; and, for each `(source_of(stream), stream, instrument)` with a coverage row, an `interrupted` row from its last `scope_to` to now with detail `process_stopped`, written in one commit, so a stop is attributable (CUJ-MKT-3).
  * `run_once() -> CommitResult`: `now = instant(clock.now())`, `local = calendar.local(now)`. **A poll is due** when `local.weekday()` is in `calendar.weekdays`, `local.time() >= 09:00`, `local.time() <= close` with seconds and microseconds compared, as legacy's skip `when.time() > close` (`marketpull.py:888-890`), and this minute is not yet polled. The minute is marked before the polls. 09:00 is legacy's cron line (`src/interfaces/mcp/core/scheduler.py:174-215`), kept by the fork rule.
  * **Each poll**: `when = clock.now()` at the poll's start, **the actual instant as legacy's `when`** (`marketpull.py:835`), not the minute's start; for each instrument and stream, `source.poll(stream, instrument)`. Each payload becomes `IncomingRecord(stream, instrument, source_of(stream), key, Timestamp(utc(when), "exchange"), Timestamp(when.utc_iso, when.domain), payload, "simulated" or "live")`, with the key per stream (a chain's from `payload["expiry"]`; a missing one is recorded as `interrupted` with detail `KeyError`). A raise records `CoverageEntry(source_of(stream), stream, instrument, "interrupted", when, clock.now(), type(exc).__name__)`, and the loop goes on; a return records `covered` from `when` to `clock.now()`.
  * Then `drain_ticks()`, then `now = instant(clock.now())` again, so every tick stamped by the drain is at or before the sealing instant; a tick stamped between the drain and that read is a straggler, sealed as a correction (above).
  * Records whose payload canonical JSON cannot write are dropped, each counted with an `interrupted` coverage row (detail `payload_not_json`).
  * One `store.commit(records, coverage=..., now=now, wdef=wdef, instruments=instruments)`. If the commit raises, the drained ticks are kept and offered again first at the next run; the exception propagates (the store is failing).
  * `next_wake() -> datetime`: the earliest of the next minute's start while polls are due today and the next confirmation instant of a window with ticks not yet sealed. The host calls `run_once` at each, and keeps calling it after the close until the last window is sealed (15:30's at 15:31:07 with a 7 s lag). The host itself is SLICE-11's.
  * **Per-instrument streams and cadence** (legacy polls chains only for live instruments, on `chain_interval_secs`, `marketpull.py:106-107`, `:416-430`) are step 4's, with the OpenAlgo source.
* **Settings.** `Settings` gains `bar_confirm_lag_secs: str | None` (POL-019, approved 7) and `market_store_path: str | None`; `defaults.yaml` `market.bar_confirm_lag_secs: null` and `market.store_path: null`. The lag is read as `_ADMISSION`'s rows are, with a new kind `lag`: an int is taken as its decimal text, a string must fully match step 1's canonical pattern, anything else raises `SettingsError`; environment `AT_BAR_CONFIRM_LAG_SECS`. `market_store_path` is read as `ledger_path` is, with `AT_MARKET_STORE_PATH`. `ingest.compose(settings, clock, source, *, instruments) -> MarketLoop` uses `calendar("nse-fo/v1")` and `WindowDef(60, lag)`, and raises `SettingsError` while `bar_confirm_lag_secs`, `poll_interval_secs` or `market_store_path` is unbound, while `poll_interval_secs` is not 60 (the loop polls on the minute, as legacy), or with the open's refusal code.

### Tests

`tests/unit/test_market_ingest.py` (tree delta **T-43**), every value labelled synthetic, every store under `tmp_path`; the crash points in `tests/recovery/test_crash_boundaries.py`.

| Group | Cases |
|---|---|
| Open | A new store: `store_meta` with a 32-hex `store_id`, schema 1, head 0; reopening keeps them; a second writer refused `MKT-R01`; a file with schema 2 refused `MKT-R02` by the writer and the reader; the reader cannot write |
| Merge | Each row: inserted, duplicate (also of an older revision), outdated, revised, conflicted (equal orders; a missing order), revision numbers and flags; an earlier insert in the same batch counts as stored; a history bar and a tick for one window are two records |
| Publication | A reader at `through` = H sees nothing committed after H; one commit's records, coverage, seals, watermarks and head appear together; a commit whose record payload was set to NaN after construction leaves head and every table unchanged; a tick whose `event_at` differs from its lifted one refused |
| Coverage | `covered` and `interrupted` rows with their scopes, `first_seq` and `last_seq`; an interrupted poll followed by a good one; a loop constructed over a store whose last coverage ended earlier writes `process_stopped` |
| Seals | Revision 1 at the confirmation instant, not a microsecond before; on-time ticks only; a late tick after the seal makes revision 2 over all with `late_count` 1, a second one revision 3; an on-time straggler committed after the seal makes revision 2 and revision 1 is unchanged; a window with only late ticks gets revision 1 with `tick_count` 0 and then revision 2; an empty commit after a restart seals a confirmed window (CP-M3); two instruments sealed apart; watermarks for named instruments |
| Loop | Polls at 09:00:00 IST and not at 08:59:59.999999; at 15:30:00 and not at 15:30:00.000001; not on a Saturday; one poll per minute however often `run_once` runs; a new loop in the same minute does not poll again; `when` is the poll's actual instant; a chain without `expiry` recorded `interrupted`; a failed poll records `interrupted` and the others still commit; drained ticks in the same commit; a raising commit keeps the ticks for the next run; `next_wake` at the minute's start and at a confirmation instant |
| Reference | Legacy's merge: unchanged not re-added; changed is `max + 1`; A (0), B (1), A again is revision 2; `75` then `75.0` not re-added; `as_of`'s three reasons, its choice by instant across offsets and by revision; a key matched stripped and upper-cased; facts read through the reader's head |
| Settings | The two keys: default `None` from `defaults.yaml`, bound by environment; `7` read as `"7"`; `"7.0"` refused; `compose` refuses each unbound setting, a poll interval other than 60, and a held writer lock |
| Boundary | No `market` module imports an `autonomous_trading.kernel` module other than `kernel.ledger.runtime` and `kernel.ledger.envelope` |

**Crash points.** `MarketStore(fault_point="CP-M2")` and `MarketLoop(fault_point="CP-M1" | "CP-M3")` call `os._exit(86)` at the point, as `coordinator.FaultPlan` does. `tests/recovery/test_crash_boundaries.py`'s child entry gains a branch for a `CP-M` point that composes a simulated loop over the given store and runs it.

| Point | Where the child exits | After reopening |
|---|---|---|
| CP-M1 | In `run_once`, after the polls and the drain, before `commit` | Nothing of the poll is stored; a new loop in a later minute polls and commits once |
| CP-M2 | In `commit`, after the records' inserts, before the coverage rows | No row of the batch is visible; head is unchanged |
| CP-M3 | In `run_once`, after a commit at the confirmation instant minus one microsecond that stored on-time ticks | A commit at the confirmation instant plus one second, with one late tick, writes revision 1 over the on-time ticks and revision 2 over all |

### Break checks

| Change | Test that must fail |
|---|---|
| A duplicate compared with the latest revision only | Merge |
| Equal orders `revised` | Merge |
| `head` moved before the records are inserted, in a second transaction | Publication; CP-M2 |
| Seal at `confirm_at < now` instead of `<=` | Seals |
| Revision 1 sealed over every tick | Seals |
| A straggler folded into revision 1 (`bars` without the `seq` bound) | Seals |
| `when` set to the minute's start | Loop |
| A poll at 15:30:00.000001 | Loop |
| Reference merge against every revision | Reference |
| Reference values compared as canonical text | Reference |
| `as_of` ignoring `available_at` | Reference |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/ledger/runtime.py`, `kernel/ledger/store.py` | `WriterLock` moved, unchanged |
| `src/autonomous_trading/contracts/market.py` | Built: `IncomingRecord`, `MarketRecord`, `CoverageEntry`, `ReferenceFact`, `reference_instant` |
| `src/autonomous_trading/market/store.py` | New: `STORE_SCHEMA`, `MarketStore`, `MarketReader`, `Seal`, `CommitResult` |
| `src/autonomous_trading/market/sources.py` | New: `MarketSource`, `SimulatedSource` |
| `src/autonomous_trading/market/ingest.py` | `tick_record`, `MarketLoop`, `compose` |
| `src/autonomous_trading/market/view.py` | `bars` accepts revision 1 in `through` |
| `src/autonomous_trading/settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml` | The two settings |
| `tests/unit/test_market_ingest.py` | New (T-43) |
| `tests/unit/test_market_windows.py` | The revision-1 case amended |
| `tests/recovery/test_crash_boundaries.py` | CP-M1…CP-M3 |

### Completion conditions (step 2)

* Every test above passes, twice in a row, with the whole suite; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every edited Python file.

### Step 2 as built

**In plain words.** The market process's database is built and tested: prices are stored in all-or-nothing batches, each minute is sealed once final, and a late or straggling price only ever adds a correction. A crash at each of the three named moments leaves the store whole. All of today's 970 automatic checks pass, twice in a row.

Commit `42879dd` on `slice-08`, after a test-only commit `eb06786` (below). It changes 13 paths (1,326 lines added, 51 removed). The files match the step's table.

**Choices made while building:**

| Topic | As built |
|---|---|
| The lag setting | Read through a new `_MARKET` row tuple beside `_ADMISSION`, because `bootstrap` requires every `_ADMISSION` row for an admission composition: the first build put the lag there and 304 tests refused to compose. The text's "read as `_ADMISSION`'s rows are" holds; only the market composition requires it |
| Unsealed windows | The seal query uses the `(stream, instrument, window_start)` index; a correction revision is found by "a stored tick beyond the latest seal's `through_seq`", plus, at revision 1, any stored tick that is not on time (a late tick committed before the seal) |
| `next_wake` | Returns the earliest candidate even when it is already past (a window confirmed but unsealed), so the host runs at once |
| The flaky adapter tests | Seventeen adapter tests with no timing in them now build the adapter with the 5 s `ROOMY_MS`; the tests that script a hang, drip, sleep or slow reply, or measure the deadline, keep 500 ms. `test_the_key_never_leaves` had failed 1 run in 12 while helper agents loaded the machine (commit `eb06786`) |

**Tests:** `tests/unit/test_market_ingest.py`, 25 cases; `tests/recovery/test_crash_boundaries.py`, 3 cases (CP-M1…CP-M3, each a killed child process); `tests/unit/test_market_windows.py`, one case added (93). 970 passed, twice in a row.

**Break checks** (anchors checked first, every file restored byte for byte, md5 verified): all 11 failed a test.

| Change | Test that failed |
|---|---|
| A duplicate compared with the latest revision only | Merge |
| Equal orders `revised` | Merge |
| Records committed apart from `head` | CP-M2 |
| Seal at `<` | Seals (4 tests) |
| Revision 1 sealed over every tick | Seals; CP-M3 |
| A straggler folded into revision 1 | Seals; the step 1 revision-1 case |
| `when` at the minute's start | Loop |
| A poll at 15:30:00.000001 | Loop |
| Reference merge against every revision | Reference |
| Reference values compared as canonical text | Reference |
| `as_of` ignoring `available_at` | Reference |

## Step 3 — views and quality

The authorities are the spec's [Stable views](../../design/market-data-and-canvas.md#stable-views-marketviewpy) and [Quality](../../design/market-data-and-canvas.md#quality-marketqualitypy) sections. Step 3 builds the read side over step 2's store, including the five market reads SLICE-09 carried here. Reads that need the chain payload's shape (a held contract's premium close and tick, `ChainSnapshot`, `as_stable_view`) are step 5's, after step 4 characterizes the OpenAlgo chain. A design review of the first build found lookahead, revision and legacy-parity defects (F-1…F-17); this text is the reworked design, and the code matches it.

**In plain words.** A "view" is a fixed snapshot: which store, which settings (and their exact content), which moment, and how far the store had been written. Its name is enough to open exactly the same snapshot again, from any process, later. A view never shows anything from after its moment: not a minute that was not yet final, not a correction made from a late price, not a price that arrived later. It reads one trading day, as today's system does, and picks prices by today's rules. The quality report says what is missing, stale, conflicting or late, and decides nothing.

### Decisions

#### View policies (`contracts/market.py`)

* `ViewPolicy(name, version, availability, corrections, bars, join, max_age_secs, stale, calendar_version, wdef)`, frozen, every field required (D08: no defaults):
  * `name` and `version` non-empty, without `|`; `name` also without `@` (the identity writes `name@version`);
  * `availability` `arrival` or `event`; `corrections` `exclude` or `include`; `bars` `ticks`, `history` or `ticks_else_history`;
  * `join`, `max_age_secs` and `stale`: tuples of `(stream, value)` pairs, one per stream, sorted `chain`, `greeks`, `spot`: `join` `at_or_before` or `exact_minute`; `max_age_secs` a positive int or `None` (unbounded); `stale` `drop` or `report`, and `drop` requires a bound;
  * `calendar_version` a key of `CALENDARS`; `wdef` a `WindowDef` with `interval_secs` 60.
* `ViewPolicy.text`: the canonical JSON of its fields, so two equal policies are one text. `policy_digest(policy)` (`market/view.py`): the SHA-256 hex of that text. Policies are bound per release by name (SLICE-11); step 3's functions take a `Mapping[str, ViewPolicy]`.

#### The identity (`market/view.py`)

* `ViewId(store_id, store_schema, policy, policy_version, policy_digest, underlying, cutoff, head)`, frozen. `text` is `mv1|{store_id}|{store_schema}|{policy}@{policy_version}|{policy_digest}|{underlying}|{cutoff}|{head}`: eight `|`-separated parts. **Deviation (from the spec's seven-part identity):** the policy's digest is the fifth part, so a name and version re-bound to other content cannot reopen an old view under other rules (F-3). Construction refuses a text field that is empty or contains `|`, a `policy` containing `@`, a digest that is not 64 lower-case hex digits, a negative or bool int, and a `cutoff` that is not its own `utc` text. `ViewId.parse(text)` requires eight parts, `mv1`, `store_schema` and `head` in decimal without leading zeros, and `@` in the fourth part; it raises `ValueError` otherwise.
* `resolve(reader, policies, policy_name, underlying, cutoff: datetime) -> View`: `cutoff` aware; the bound policy's `name` equals its key; `head = reader.head()` once; nothing is written. **The cutoff may be earlier than the resolution instant** (SLICE-09 read 1, one view per trigger): every read below is bounded by the cutoff as well as by `head`, so a view resolved after later commits shows nothing from after its cutoff (F-1, F-8).
* `reopen(reader, policies, text) -> View | Unavailable`, `Unavailable(reason)`, checked in this order:

  | Reason | When |
  |---|---|
  | `version` | the first part is `mv` and digits, other than `mv1` |
  | `malformed` | anything else `parse` refuses, including an eight-part text with a bad cutoff, or a non-string |
  | `store_id`, `store_schema` | the reader's store differs |
  | `policy_unknown` | no policy bound under the name |
  | `policy_version` | the bound policy's version differs |
  | `policy_changed` | same name and version, another digest |
  | `ahead` | `head` above the reader's head |

  **Not built:** a `gone` reason. Records are never deleted in this slice, so retention loss cannot occur; SLICE-11's retention adds the check with the deletion.

#### What a view sees (`market/view.py`, `market/store.py`)

* **A row is visible** when `seq <= head`, its `event_at` falls on the cutoff's exchange date and is at or before the cutoff, and it was seen by the cutoff: `arrival_at <= cutoff` under `arrival`, `event_at <= cutoff` under `event` (a research view, labelled by its policy). Reads use the latest visible revision of each `(source, key)`; a conflicted one keeps its flag. **One exchange date (F-4b), as legacy:** every legacy reader opens one day's file per stream (`src/data/marketdata/store.py:583`), so a view at 09:15:30 does not see the previous day's 15:29 spot.
* **Bounded reads (F-12).** `_Reads` gains four read-only queries, no schema or write change: `heads_between(stream, instrument, *, through, since, until) -> list[RecordHead]` (rows without payloads, `since <= event_at < until` as text), `records_at(seqs) -> list[MarketRecord]`, `tick_records(instrument, *, through, first_window, last_window) -> list[MarketRecord]` (every revision, on the `(stream, instrument, window_start)` index) and `seals_between(instrument, *, through, first_window, last_window) -> list[Seal]`. `window_start` is written by the store with `utc`, so window bounds compare exactly as text. `event_at` is the source's text, so the view passes whole dates a day wider on each side (any ISO text of an instant on a date sorts between the day before and the day after) and filters by instant. A view chooses from payload-less rows and parses only what it returns (one chain poll, not the day's chains), and caches each read for its life. Measured on a synthetic store of two full days (21,057 rows; 20 ticks, one spot, one 30-strike chain and four Greeks per minute): a view at 15:31:07 reads its 376 bars, chain, spot and Greeks in 0.46 s and assesses in 0.11 s, independent of other days.
* `View.anchor -> datetime`: the newest base window whose confirmation instant is at or before the cutoff, `window_start(cutoff − 60 s − lag, 60)`; at 10:42:07 with a 7 s lag, 10:41.

#### The joins (`market/view.py`)

* `View.pick(stream, *, minute=None, usable=True) -> tuple[MarketRecord, ...]`, for `spot`, `chain` and `greeks` of the underlying: the record (for the chain, every record of one poll) the stream's join picks, before the age rule. Under `exact_minute`, `minute` defaults to `anchor` and is compared as the calendar's local `YYYY-MM-DDTHH:MM`; under `at_or_before` a `minute` raises `ValueError`. Every rule below is legacy's, at 445eb116:

  | Stream | `at_or_before` | `exact_minute` |
  |---|---|---|
  | `spot` | the newest **usable** record (F-4a): a value is the first of `ltp`, `last_price`, `close` that is an int or float and truthy (`src/data/marketdata/scans.py:213-221`; a bool `true` passes there as 1.0, kept). Ties by instant go to the **higher value** (F-4c): legacy sorts the day's marks by `(instant, value)` (`scans.py:224`), keeps that order (`src/runtime/market_view.py:260`) and takes the last at or before the bar (`bisect_right`, `:410`); then the higher `seq` | the newest usable record of the minute; no legacy reader (no shipped policy binds it), so the Greeks rule |
  | `chain` | the newest poll (`scan_at`, `market_view.py:417-435`) and all its records | **the oldest poll of the minute and all its records** (F-5): `inputs_at` (`market_view.py:848-860`) takes the first stamp `snapshot_matching` accepts in sorted order, with every record of it (`store.py:1106-1134`). This corrects the earlier text's "the latest `seq`" |
  | `greeks` | the newest record, ties to the higher `seq` | the newest record of the minute, ties to the higher `seq`: `greeks_at` (`scans.py:316-331`) with the stamp at the minute's end |

  A poll's records are ordered by parsed expiry, nearest first (F-6): legacy's spellings in its order (`src/interfaces/mcp/core/marketpull.py:69-83`; the stored form is `%d%b%y`, `06NOV26`, `:58`), an unparsed expiry after them by its text, then `seq`. `usable=False` skips the spot value filter (quality's zero check).
* `View.read(stream, *, minute=None) -> Read | None`: the pick, then the age rule. `Read(record, age_ms, stale, via)`: `age_ms` is `cutoff − event_at` floored to the millisecond and only reported; `stale` is judged on durations, `cutoff − event_at > timedelta(seconds=max_age_secs)`, legacy's `asked - observed <= limit` in seconds (`market_view.py:437-440`) (F-16). Under `stale: drop` a stale read returns `None`, as legacy's live views (`:413-415`, `:433-435`; bounds `live_freshness_bounds`, `:931-943`); under `report` it returns the read with `stale` true. `via` is the stream that answered.
* `View.chain(*, minute=None) -> Read | None`: `read("chain")`, the poll's nearest-expiry record. `View.chains(*, minute=None) -> tuple[MarketRecord, ...]`: every record of that poll, nearest expiry first; empty when nothing is picked or the poll is dropped as stale.
* `View.spot() -> Read | None` (**Fork call, legacy kept, F-13**): `read("spot")`; when that is `None` and both the spot and chain joins are `at_or_before`, legacy's chain-scan spot (`src/runtime/providers/shipped.py:112-115`): the scan's `spot` is the newest usable spot at or before **the chosen chain poll's instant**, within the spot bound measured from that poll (`scans.py:427`, `:227-261`), not the chain payload's own spot. It is returned with `via` `chain` and `stale` judged at the cutoff, and `drop` does not remove it, as legacy filled it. So it answers only when the spot at the cutoff was dropped as stale but was within the bound of the chain poll; with no usable spot at all, the chain's join has none either. The rule is a `View` method, not `market/providers.py`'s registry: one rule, one consumer.
* **The five SLICE-09 reads (F-14):**

  | # | SLICE-09's need | Read |
  |---|---|---|
  | 1 | a cutoff earlier than the resolution instant | `resolve(reader, policies, name, underlying, cutoff)` (above) |
  | 2 | the `exact_minute` chain anchored at the newest confirmed window | `View.chain()` and `View.chains()` under a policy whose chain join is `exact_minute`: the anchor minute's oldest poll |
  | 3 | the spot records through the cutoff | `View.spot_series() -> tuple[MarketRecord, ...]`: every visible spot record of the date, oldest first, ties by `seq`, unfiltered, as legacy's `spot_frame` reads the day (`market_view.py:956-993`) |
  | 4 | the chain poll of one exact minute | `View.chains(minute=m)` |
  | 5 | the day's Greeks through the cutoff | `View.greeks_day() -> dict[tuple[str, object, str], tuple[MarketRecord, ...]]`, keyed `(local minute, strike, side)` with the payload's `strike` and `option_type` upper-cased, each oldest first, as `greeks_by_minute` (`scans.py:269-309`); and `View.greeks_at(stamp, strike, side) -> MarketRecord | None`, legacy's `greeks_at`: in the stamp's minute, the newest at or before the stamp, ties to the later, `None` for a minute without its own batch |

#### Bars (`market/view.py`)

* `View.bars(instrument, *, interval_secs=60, lookback=None) -> tuple[Bar, ...]`, the instrument's bars on the cutoff's exchange date, oldest first. `interval_secs` a positive whole number of minutes and `lookback` `None` or an int ≥ 0, a bool refused (else `ValueError`).
  * `ticks`: windows of the date **whose confirmation instant is at or before the cutoff** and with a revision-1 seal at `seq <= head` (F-1). Under `exclude`, revision 1; under `include`, **the highest sealed revision whose every tick the view sees** (by its availability), else revision 1. A correction made from a tick that arrived after the cutoff is never shown; one made from ticks that arrived by the cutoff but were committed later is shown, since they were available. **Each window's ticks are read as its seal saw them** (F-2): the latest revision of each tick key with `seq <=` that seal's `through_seq`, the store's `ticks(..., through=through_seq, window=w)`. So a tick record revised after the seal leaves revision 1 unchanged. Folded by step 1's `bars` with every shown window's revision and `through_seq`.
  * `history` (F-7): legacy's `spot_minute_bars` (`src/data/marketdata/ticks.py:723-775`) over the `history_bar` stream: a record without `close` skipped (`:744-746`); `open`, `high`, `low` default to `close` (`:753-754`); `volume` `or 0.0` (`:755`); shown once `cutoff >= start + 60 s`, no lag (`:756`); ordered by instant, ties by `seq`; `revision` the record's, `first_seq` = `last_seq` = its `seq`, `late_ticks` 0. One-minute only: another interval raises `ValueError`. **Deviation:** `ticks` is 1, not legacy's 0 (`:759`), because `Bar` requires at least 1; and a present but null `open`, `high` or `low` reads as `close`, where legacy carried the null (a `Bar` has no null price).
  * `ticks_else_history`: legacy's `session_bars` (`ticks.py:801-806`): the tick bars if any; else, at one minute only, the history bars; above one minute, the resampled tick bars or nothing.
  * `interval_secs` above 60: step 1's `resample` over the one-minute bars with `now` the cutoff; `lookback` keeps the last N (0 gives none).
* `View.final(instrument, window) -> bool`: the window's confirmation instant is at or before the earlier of the watermark visible at `head` and the cutoff (F-8); a final window without a seal had no ticks.
* `View.reference(kind, key) -> ReferenceFact | ReferenceMissing`: step 2's `reference_as_of` at the cutoff, bounded by `head`; a fact available after the cutoff is not yet available. It ignores `corrections`.

#### Quality (`market/quality.py`)

* `InputRequirement(consumer, consumer_version, fields_required, fields_optional, lookback_bars, interval_secs, session_reset, partial_bars)`: `fields_*` tuples of distinct `spot`, `chain`, `greeks`, `bars`, none in both; `lookback_bars` an int ≥ 0; `interval_secs` whole minutes; `partial_bars` `allowed` or `excluded`. It describes the consumer and sets no threshold.
  * **Deviation (F-10):** `session_reset` must be `True`. Legacy warms up per session: the runner builds one day's tape and skips `bar_index < warmup` (`src/core/framework/runtime/runner.py:86-102`). A lookback across sessions is not built.
  * **Deviation (F-10):** `partial_bars` is validated and changes nothing. A view never shows a partial bar (only sealed windows, and higher windows only after their own end plus the lag), so `excluded` always holds and `allowed` adds nothing.
* `assess(view, requirement, *, instrument, minute=None) -> Assessment`, pure over the view; `minute` anchors exact-minute fields, defaulting to the view's anchor (F-9):
  * **fields**, per field in `fields_required + fields_optional` other than `bars`: `FieldState(field, state, age_ms, source, revision, zero)`, the first that applies: `missing` (the join picks nothing); `zero` (the picked record has no usable value and its first price field present, of `ltp`, `last_price`, `close`, is a number equal to 0; a bool is not, F-16); `unavailable` (`read` gives `None`: dropped as stale, or no usable spot); `conflicted`; `stale`; `present`. `zero` is `unknown` for a zero state, else `None`. **Deviation (not yet built):** legacy's `genuine` and `substituted` classes (`src/data/marketdata/evidence.py:80-86`) need the source's support evidence, which step 4's source records; a bare zero is `unknown` there too;
  * **bars**, at the requirement's `interval_secs`: `expected` the windows from the calendar's regular open to its close, both inclusive (`Calendar.in_regular_hours`; 376 one-minute windows on a full day, 15:30 included, F-16), final by the earlier of the watermark and the cutoff (a higher window at its own end plus the lag); `present` those the view shows; `gaps` the expected ones it does not; `warm` true when the last `lookback_bars` expected windows all have bars (true at 0). Legacy's own note counts 375 bars on a history-only day (`ticks.py:784-790`), so such a day reports 15:30 as a gap;
  * `conflicted` (replaces `duplicates`, F-11: the store never keeps a duplicate, it only counts one at commit): conflicted tick rows seen by the cutoff in the expected one-minute windows;
  * `late`: step 1's `late_counts` over the latest revision of each tick key seen by the cutoff, for the date (F-11);
  * `join_skew_ms` between the spot and chain reads' `event_at`, both read with the anchor minute where exact;
  * `clock_steps`: rows seen by the cutoff whose `arrival_at` is earlier than the previous row's of the same `(source, stream)` in commit order, a clock step on the market host (`README.md:1241`) (F-11; a chain stamped before the previous spot is not a step);
  * `Assessment(fields, interval_secs, expected, present, gaps, conflicted, late, warm, join_skew_ms, clock_steps, calendar)`.
* Nothing in `assess` refuses, waits or fills a value. The day's session timings (special and shortened days) reach `expected` in step 5 with the calendar port; until then `expected` uses the regular hours, and `Assessment.calendar` says `regular_hours`.

### Tests

`tests/unit/test_market_view.py` (**T-44**, 33 cases) and `tests/unit/test_market_quality.py` (**T-45**, 17 cases), over stores built with step 2's `MarketStore` under `tmp_path`, every value labelled synthetic, every expectation written by hand from the rules above (A08-F3).

| Group | Cases |
|---|---|
| Policy and identity | Every refusal (a missing stream, `drop` without a bound, `|` or `@` in the name, an unknown calendar, a 300 s window, an unknown availability or stale mode); equal policies, one text; the identity's text written out by hand, `parse` round-trips, refusals (`mv2`, nine parts, `head` `042`, no `@`, a `|` or `@` in the policy, a 63-digit digest, a non-canonical or `+05:30` cutoff, a negative head); the digest is the SHA-256 of the policy text |
| Reopen | A live and an include view resolved, then a newer spot, a third revision of a sealed window, a watermark and a reference revision committed: reopened through a `MarketReader`, both reproduce the spot, the chain poll, the bars (revision 1 and revision 2 by hand), `final`, the reference and the Greeks index. A fresh view at the same cutoff shows the newer reference (known before the cutoff, committed later) and the same bars (the third revision arrived after the cutoff). Every `Unavailable` reason, including an eight-part text with a bad cutoff (`malformed`) and a re-bound policy (`policy_changed`) |
| Visibility | `arrival` hides a record that arrived after the cutoff, `event` shows it; a record past `head` hidden; Monday 15:29 spot, chain, Greeks and a sealed tick bar invisible to a Tuesday 09:15:30 view (every read empty), visible to Monday's |
| Joins | Spot: `ltp` 0 with a `close` read through `close`, an all-zero and a text value skipped, the series unfiltered; a tied instant to the higher value, then to the higher `seq`; `true` read as legacy. Staleness: 120 s kept, 120.0005 s dropped with `age_ms` 120,000, reported under `report`. A minute under `at_or_before` refused. Exact minute: two polls in 10:41 (10:41:00.2 with `06NOV26` and `13NOV26`, 10:41:30): the anchor 10:41 at 10:42:07 gives the first poll, both expiries, age 66,800 ms; an explicit minute; none for a minute without a poll; at 10:42:06.999999 the anchor is 10:40. Expiries `27NOV26`, `02DEC26`, `06NOV26` ordered `06NOV26`, `27NOV26`, `02DEC26`. Greeks: the index by hand (a lower-case side upper-cased, one arriving after the cutoff absent), `greeks_at` before, within and after the minute's batches, a minute without its own batch unpriced, the exact read the minute's newest. Fallback: a spot dropped at 150 s answered through the chain poll (`via` `chain`, stale, 150,000 ms); a spot 121 s before the newest poll not; no spot stream, no fallback |
| Bars | Confirmed but unsealed: none; sealed: revision 1; a late tick's correction: `exclude` keeps revision 1, `include` shows revision 2 (Q-030). Lookahead: after later commits, a view at 10:42:20 shows only 10:41 (10:42 confirms at 10:43:07); `include` shows revision 1 at 10:42:29.999999 and revision 2 at 10:42:30, when the late tick arrived; `final` bounded by the cutoff. A tick record revised after its seal: revision 1 keeps the first price, `include` shows revision 2 with the revised price. History: the defaults and the null close by hand, a forming bar not shown at 10:03:59.999999 and shown at 10:04, five-minute history refused, `ticks_else_history` above one minute empty, a tick bar replaces history. Five-minute bars resampled at the cutoff; `lookback` 2 and 0; a negative or bool `lookback` and a 90 s interval refused. `final` by watermark. Reference through `head`, and a fact available after the cutoff `not_yet_available` |
| Quality | Requirement refusals (an unknown or repeated field, a field in both, a negative or bool lookback, a 90 s interval, `session_reset` false or `1`, an unknown `partial_bars`). Field states: present, conflicted (revision 2) and missing with ages; stale; unavailable under `drop`; a zero spot `zero` `unknown`; an `ltp` `false` not zero (the older spot answers). Windows: 5 expected, 3 present, the gaps, `warm` at 3, 2 and 0, one late tick at 30 s while a later-arriving one is not counted. Counts by hand: one conflicted row in an expected window (one outside the hours not counted); two late among the latest seen revisions, worst 70 s. The close: 376 expected at 15:31:07, 375 a microsecond earlier. Five-minute requirement: 2 expected, 2 present, warm, while the one-minute one is not. Join skew; a chain stamped before the previous spot is no clock step, a spot stamped backwards is one, a row arriving after the cutoff unseen. Exact-minute spot and chain read at the anchor without a minute, and at an explicit minute. Nothing refuses |

### Break checks

Each is applied with every anchor checked first, run against the two test files, and restored byte for byte with an md5 check. Each must fail a test.

| Change | Test that must fail |
|---|---|
| F-1: bars from windows confirmed after the cutoff | Bars (lookahead) |
| F-1: `include` without the tick visibility check | Bars (lookahead); Reopen |
| F-2: each window's ticks as of `head`, not its seal | Bars (revised tick); Quality (counts) |
| F-3: `reopen` ignores the digest | Reopen |
| F-4a: spot without the usable filter | Joins (spot); Quality (field states) |
| F-4b: reads not limited to the date | Visibility (date) |
| F-4c: spot ties by `seq` only | Joins (ties) |
| F-5: the exact-minute chain takes the newest poll | Joins (exact minute) |
| F-5: `greeks_at` ignores the stamp; takes the oldest | Joins (Greeks) |
| F-6: expiries sorted as text | Joins (expiry order) |
| F-7: a forming history bar shown; history resampled; history fallback above one minute | Bars (history) |
| F-8: `final` by the watermark alone | Bars (lookahead) |
| F-9: quality reads the spot without its minute | Quality (exact minute) |
| F-11: counts include ticks seen after the cutoff; clock steps across streams; conflicted rows outside the expected windows | Quality |
| F-12: the SQL date bound a day too narrow; the SQL ignores `head` | Many; Visibility (past head) |
| F-13: the fallback's bound measured from the cutoff | Joins (fallback) |
| F-16: staleness on floored milliseconds; 15:30 not expected | Joins (staleness); Quality (close) |
| Visibility ignores `arrival_at` | Visibility; Reopen; Bars; Joins (Greeks) |
| Bars from unsealed windows | Bars |
| `exclude` shows the latest revision | Bars; Reopen |
| `drop` returns the stale read | Joins; Quality |
| `reopen` ignores `store_id` | Reopen |
| The exact minute by the instant's own offset (UTC) | Joins; Quality (exact minute) |
| `warm` from a row count | Quality |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/market.py` | `VIEW_STREAMS`, `ViewPolicy` |
| `src/autonomous_trading/market/view.py` | `policy_digest`, `ViewId`, `Unavailable`, `Read`, `TickRow`, `View`, `resolve`, `reopen` |
| `src/autonomous_trading/market/store.py` | `RecordHead`; `_Reads.heads_between`, `records_at`, `tick_records`, `seals_between` (reads only) |
| `src/autonomous_trading/market/quality.py` | New: `InputRequirement`, `FieldState`, `Assessment`, `assess` |
| `tests/unit/test_market_view.py`, `tests/unit/test_market_quality.py` | New (T-44, T-45) |

### Completion conditions (step 3)

* Every test above passes, twice in a row, with the whole suite; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every edited Python file.

### Step 3 as built

**In plain words.** The snapshots are built and tested: a snapshot opened again later reads exactly what it read the first time, never shows anything from after its moment, and picks prices by today's rules. All 1,020 automatic checks pass, twice in a row.

Commit `fb8f2bb` on `slice-08`, on top of `42879dd`. The code was first written before its review, against the package's order; the review's findings were then resolved in text and code ([review](../../egm/plan/review.md#slice-08-step-3-review-2026-10-30)). The 31 break mutations were re-run independently: 31 of 31 failed a test, every file restored (md5). The files match the step's table.

* **Tests:** 50 (33 in `test_market_view.py`, 17 in `test_market_quality.py`). The whole suite: 1,020 passed, twice in a row.
* **Break checks:** all 31 mutations failed a test (24 for the findings; seven of the first build's eight re-anchored, the eighth, ties to the lower `seq`, now F-4c's); every file restored, md5 verified.
* **Timing:** the bounded reads measured above: 0.46 s for a full day's reads and 0.11 s for the assessment, on a 21,057-row synthetic store.

## Step 4 — the OpenAlgo market source

The authorities are the spec's [Sources and providers](../../design/market-data-and-canvas.md#sources-and-providers-marketsourcespy-marketproviderspy) and [Ingestion and merge](../../design/market-data-and-canvas.md#ingestion-and-merge-marketingestpy) sections, and legacy's poller at 445eb116. Step 4 builds the OpenAlgo market source in `adapters/openalgo.py`, the OpenAlgo response shapes it and step 5 share in `market/sources.py`, the loop's per-instrument streams and cadence (F-15, carried from step 2) and the reference recorder in `market/ingest.py`, and plans one read-only capture (C-1). It is TASK-S08-05 (PRF-MKT-08). As SLICE-07 step 4, no composition binds the source: the market process's unit is SLICE-11's. Fresh design and readiness reviewers reviewed this step; their findings (F-1…F-13, R-1…R-17) are resolved in this text. Every legacy citation is at 445eb116; `MP` is `src/interfaces/mcp/core/marketpull.py`.

**In plain words.** The market process gets its real data feed. Each minute it asks OpenAlgo for the index price, the option chain of the nearest expiry, and the option Greeks, exactly as today's poller asks, and stores each answer as received. It keeps today's safety habits: a broken index price is patched from OpenAlgo's own one-minute history and the patch is labelled; a chain where nothing has a price is treated as a failed poll; the chain is fetched on its own clock; a garbled number does not throw the whole answer away. Index ticks from the live socket are stamped and queued. Every morning the reference facts (lot size, tick size, expiries, holidays, trading hours) are recorded as today. We settled, from the code, which Greeks the entry planner really reads, and we plan one careful read-only capture to learn whether OpenAlgo gives put deltas as negative numbers. No order is ever sent; the key never reaches a stored record.

### Characterizations

#### Which Greeks the planner reads (done, from the code)

* **The planner reads only the GREEKS stream.** BuyerEdge's scoring takes the ATM CE and PE delta and every strike's gamma through `greeks_at` (`src/runtime/market_view.py:627-663`), over an index read from the GREEKS stream (`:613-615`, built by `greeks_by_minute`, `src/runtime/input_source.py:64`). The chain rows themselves never carry a Greek to a reader: `flatten_chain_row` sets every `{ce,pe}_{delta,gamma,theta,vega,rho,iv}` to `None` (`src/data/marketdata/scans.py:158-173`), and `_attach_greeks` fills them only from the same index (`:334-366`).
* **The join** is `(minute, strike, CE|PE)`: the record's `at` cut to 16 characters (the IST minute), the payload's `strike` as stored, and its `option_type` upper-cased (`scans.py:269-309`). `greeks_at` takes, in the stamp's minute, the row at or before the stamp, and on a tie the later in read order (`observed >= found`, `:329`). A row's values are `greeks.{delta,gamma,theta,vega,rho}` and `implied_volatility` beside them (`:296-299`).
* **Two writers feed that stream, both at the poll's one `at`:**
  * the chain's inline Greeks, `greeks_from_chain` (`MP:602-652`), written by `pull_chain` with `src` `openalgo.optionchain.with_greeks` whenever the response carries them, whatever `market_data.greeks` says (`MP:520-528`);
  * `multioptiongreeks` (`MP:685-752`), with `src` `openalgo.multioptiongreeks`, called only when `market_data.greeks` is on (`MP:843-846`), and written after the inline rows. Legacy ships it off (`config/defaults.yaml:1325`). So the shipped planner prices from the chain's inline Greeks, and with it on, the `multioptiongreeks` row wins every tie (`scans.py:329`).
* **What the target keeps (Fork call):** the GREEKS stream is the only source of the planner's Greeks; both writers map to `greeks` records (below); inline rows are committed before `multioptiongreeks` rows of the same poll, so step 3's `View.greeks_at` (ties to the higher `seq`) picks what legacy picks. Every record of a poll carries the poll's one instant as `event_at`, so `greeks_at` at the chain's instant finds them (the loop, below).

#### The sign of PE deltas at the source (open until C-1)

* **No captured chain carries Greeks.** `option_chain_banknifty_20260802.json`, `_20260803.json` and `_20260804.json` have no `greeks_included` field and no Greek on any of their 22 legs each; `option_chain_nifty_20261004.json` says `greeks_included: false` and none of its 50 legs has one. The only negative PE delta in legacy is a hand-written test value (`tests/test_marketdata.py:851-876`), and the one live `multioptiongreeks` reading recorded is a CE (upstream-findings, "PART 20 addendum"). So the sign cannot be read from anything captured.
* **What it changes:** nothing in code. Legacy compares the raw delta with a positive band, and SLICE-04 step 3 keeps that (its carried check). The source maps every delta unchanged, sign included (a test pins it). The capture C-1 (below) reads the sign at the source for the owner. **Deviation:** PRF-MKT-08's "PE delta sign as characterized" clause stays open until C-1 runs.

### Decisions

#### The transport (`adapters/openalgo.py`)

* **One client, moved, not changed.** `OpenAlgoAdapter`'s connection code moves into a private `_Http(base_url, api_key)`: the URL checks of today's constructor (`http` or `https`, plain `http` only to a loopback host), `post(endpoint, body, deadline_ns) -> (status, bytes)` (today's `_post`, unchanged bytes) and `scrub(value)` (today's `_scrub`). `_Http` exposes `key` and `base_url`; `OpenAlgoAdapter` holds one `_Http`, reads them, and delegates `_post` and `_scrub`. Every existing contract test passes unchanged, which proves the move.
* **The byte limit is passed, not global (R-1).** `_read_response(sock, deadline_ns, limit)` and `_Reader(sock, deadline_ns, limit)` are module-level; the `Content-Length` check, the running total and the chunked total all use `limit`. `post` passes the module's `MAX_RESPONSE_BYTES` read at call time (the existing oversize test patches it); `get` passes its own. The reader's buffers are `bytearray`s (F-9): a master read may be tens of megabytes.
* **GET**, for the instrument master only: `get(endpoint, query, deadline_ns, limit) -> (status, bytes)` writes `GET {path}/api/v1/{endpoint}?{urlencode(query)} HTTP/1.1`, `Host`, `Connection: close`, with the same `not_sent` and `ambiguous` split.
* **A market read** is `_call(endpoint, fields, deadline_ns)`: the body `_encode([("apikey", key), *fields])`, fields in the order the tables below give; `_NotSent` raises `MarketReadFailed(f"{endpoint}: not_sent")`, `_Ambiguous(reason)` `f"{endpoint}: {reason}"`; a status outside 200–299 `f"{endpoint}: HTTP {status}"` (legacy's client raises on any non-2xx, `src/interfaces/mcp/core/openalgo.py:181-188`); a body `json.loads` refuses `f"{endpoint}: not JSON"`. The body is parsed with `json.loads`, which reads `NaN` and `Infinity` as legacy's parser did (`openalgo.py:188`), and is scrubbed of the key before anything reads it. No retry.
* **Deadlines (F-10).** Each market read has one total deadline, `market.http_timeout_ms`, a new refusing setting with no default (`Settings.market_http_timeout_ms`, `AT_MARKET_HTTP_TIMEOUT_MS`); SLICE-11 sizes it from legacy's journal latencies. A whole poll is bounded by the number of calls times that deadline: per instrument at most 2 for spot (quotes, history), 2 for the chain (expiry, optionchain) and `ceil(symbols / greeks_batch)` for the Greeks; with legacy's `strike_count` 8 (17 strikes, 34 symbols) and `greeks_batch` 10, at most 8 calls per live instrument with `greeks` on, 4 with it off. **Deviation:** legacy's httpx timeout was 15 s per phase (`openalgo.py:151-152`).
* **The status check** is legacy's `_ok` (`MP:248-259`): a body that is not a dict fails with `f"got {type(body).__name__}, not a response object"` (R-9); no `status` key passes; a value in `("success", "ok", True)` or whose `str` lower-cased is `success`, `ok` or `true` passes (`config/defaults.yaml:580-581`); otherwise it fails with `str(body.get("message") or f"status={value!r}")`, and the source's failure detail is `f"{endpoint}: {that}"`, scrubbed and cut to 200 characters.
* **Non-finite numbers (F-1, Fork call).** Legacy kept a poll carrying `NaN` or `Infinity`: its parser and its writer accept them (`openalgo.py:188`, `src/data/marketdata/store.py:336-337`), the repair treats such a value as broken (`src/data/marketdata/heal.py:136-146`) and the Greeks validity as invalid (`MP:628-631`). The store cannot hold them, so `finite(value)` replaces each by `null` and returns its paths (`ltp`, `response.chain[5].ce.ltp`, `greeks.delta`), and each payload that had one carries `nonfinite`, the list of paths relative to the payload. The repair then runs on the cleaned row, exactly as legacy's on the broken one. Ticks are different (R-5): a websocket tick with a non-finite value fails at `canonical` and is `dropped` (below); polls are cleaned, ticks are dropped.
* **The key never leaves.** Every parsed body passes `scrub` before it becomes a payload, every failure text is scrubbed, and `MarketReadFailed`'s message, every `FetchFailed` detail, every payload and the source's `repr` show `***` for the key. The market store holds no request body.

#### OpenAlgo response shapes (`market/sources.py`)

Pure functions over response shapes, stdlib only, beside the protocol, so step 5 reads stored chain payloads without loading the adapter (PRF-XC-02 forbids the adapter in a simulation). Each is legacy's, ported line for line:

| Function | Legacy | Rule |
|---|---|---|
| `finite(value)` | (F-1) | `(value with every non-finite float as None, the paths)`, keys joined by `.`, list indices as `[i]` |
| `rows_of(body)` | `MP:222-245`, `config/defaults.yaml:576-579` | The first of `data`, `result`, `payload` present; then the first of `positions`, `orders`, `trades`, `holdings`, `rows`, `items`, `chain` holding a list; a dict is one row; only dict rows |
| `status_ok(body) -> (bool, str)` | `MP:248-259` | Above |
| `parse_expiry(text)`, `expiry_for_request(text)` | `MP:69-94` | The eight formats in order; the request form `%d%b%y` upper-cased, an unparsed text upper-cased as is |
| `nearest_expiry(body, when) -> (expiry, why)` | `MP:779-807` | Below |
| `any_priced(rows) -> (bool, int)` | `MP:190-219` | A leg is a dict under `ce` or `pe`; priced when `float(leg.get(k) or 0) > 0` for any of `ltp`, `high`, `low`, `bid`, `ask`, a `TypeError` or `ValueError` skipping the field |
| `chain_symbols(rows)` | `MP:580-593` | Every truthy leg `symbol`, CE then PE, strike by strike |
| `greeks_from_chain(rows)` | `MP:599-652` | One row per leg with a symbol and at least one of `delta`, `gamma`, `theta`, `vega`, `implied_volatility` not `None`: `symbol`, `strike`, `option_type`, `option_price` (the leg's `ltp`), `greeks_source` `openalgo.optionchain.black76`, `valid`, `validity_reason`, `greeks` (without IV), `implied_volatility` |
| `annotate_endpoint_values(rows)` | `MP:655-682` | Each row copied, with `greeks_source` `openalgo.multioptiongreeks.black76`, `valid` and `validity_reason` over `delta`, `gamma`, `theta`, `vega`, `rho` and the IV |
| `invalid_fields(row)` | `heal.py:128-151` | Of `ltp`, `open`, `high`, `low`, those not an int or float, a bool, or NaN; zero is usable |
| `bar_time(bar)`, `bar_at(bars, when)` | `heal.py:64-103`, `:154-174` | The bar's `bar.get("timestamp", bar.get("t"))`, literally (F-13: a present but null `timestamp` does not fall back to `t`): an ISO string, naive read as IST; a positive number in seconds, divided by 1000 above 1e11. The latest bar at or before `when` |
| `repair_row(row, bars, when)` | `heal.py:177-207` | Each broken field whose value in the bar (with `ltp` its `close`) is usable is replaced; `repaired` the filled names in that order and `repair_src` `openalgo.history` when any was |
| `chain_due(last, when, interval_secs)` | `MP:136-176` | `interval_secs <= 0` or no `last`: due; else due when `(when - last).total_seconds() >= interval_secs - 1.0` (`TICK_SLACK`) |

Constants: `GREEKS_BATCH_MAX = 50` (`MP:557`), `HISTORY_CACHE_SECS = 60` (`MP:277`). `MarketInstrument(name, spot_exchange, option_exchange, live)`, frozen: the three texts stripped, upper-cased and non-empty, `live` a bool (legacy's `Instrument`, `src/data/marketdata/instruments.py:46-94`). **Deviation:** an instrument without both exchanges is refused at construction; legacy refused it per poll in its journal (`MP:319-322`, `:420-423`).

#### The source (`adapters/openalgo.py`)

`OpenAlgoMarketSource(base_url, api_key, clock, *, http_timeout_ms, instruments, strike_count, chain_interval_secs, greeks, greeks_batch, repair_live, tick_mode, tick_symbols=())`, `identity` `"openalgo"`; `http_timeout_ms` is `market.http_timeout_ms`. One instance serves the loop, polled in the loop's order (R-16). Construction raises `ValueError` for: the transport's URL refusals; an empty key; `http_timeout_ms` not a positive int (a bool refused); `instruments` empty, not all `MarketInstrument`, or with a repeated name; `strike_count` not an int in 1…100 (OpenAlgo's cap, `config/defaults.yaml:1289`); `chain_interval_secs` not an int ≥ 0; `greeks` or `repair_live` not a bool; `greeks_batch` not an int in 1…50; `tick_mode` not 1, 2 or 3 (`:605-608`); a `tick_symbols` name that is not an instrument. **Deviation:** legacy clamped `greeks_batch` into 1…50 silently (`MP:564-577`); the target refuses, as every setting does (Q-015).

* `source_of(stream)`: `spot` `openalgo.quotes`, `chain` `openalgo.optionchain`, `greeks` `openalgo.multioptiongreeks`, `tick` `openalgo.websocket`; any other stream raises `ValueError`. The inline Greeks carry `openalgo.optionchain.with_greeks`, and the repair's failure `openalgo.history`, through `Fetched` and `FetchFailed` (the loop, below).
* `streams() -> dict[str, tuple[str, ...]]`: a live instrument `("spot", "chain", "greeks")`, any other `("spot",)`, in instrument order (legacy polls spot for every index and the chain only for live ones, `MP:810-846`, `:416-419`).
* **A failed fetch is returned, not raised:** `poll` returns `FetchFailed(source, detail)` with legacy's journal text, so the coverage row says why. It raises only on a programming error, which the loop records as today.
* **Per stream** (`when` is the poll's instant, an aware UTC `datetime`; "the IST date" is `when` at +05:30):

| Stream | `due` | Calls, fields in order (each also carries `apikey` first) | Payloads | Failures |
|---|---|---|---|---|
| `spot` | always | `quotes`: `symbol` name, `exchange` spot exchange (`MP:324-326`) | the one row of `rows_of(body)`, cleaned, after the repair | read or status failure: `FetchFailed("openalgo.quotes", detail)`; no row: `[]` (legacy's `empty`, `MP:334-338`); more than one row: `FetchFailed("openalgo.quotes", f"quotes: {n} rows")` (R-12, **Deviation:** legacy wrote every row, which the target's one spot key per poll cannot hold) |
| `chain` | clears the instrument's pending Greeks, then the instrument is live and `chain_due(last_chain.get(name), when, chain_interval_secs)` (`MP:424-429`) | `expiry`: `symbol`, `exchange` option exchange, `instrumenttype` `options` (`MP:766-769`); then `optionchain`: `underlying` name, `exchange` option exchange, `with_greeks` `true`, `expiry_date` the chosen expiry, `strike_count` (`MP:455-460`) | one: `{"expiry": expiry, "exchange": option exchange, "response": body}`, cleaned | expiry: `FetchFailed("openalgo.optionchain", f"expiry unresolved: {why}")` (`MP:431-435`); chain read or status: `FetchFailed("openalgo.optionchain", detail)`; no rows: `[]`; legs but none priced: refused (below) |
| `greeks` | pending inline rows, or `greeks` on and pending symbols (`MP:520-528`, `:710-713`, `:843-846`) | `multioptiongreeks`, per batch of `greeks_batch` symbols in chain order: `symbols` as `_Objects([[("symbol", s), ("exchange", option exchange)] for s in batch])`, so the body is compact (R-2; `MP:715-738`) | each inline row as `Fetched("openalgo.optionchain.with_greeks", row)`, then each batch's rows of `rows_of(body)`, each cleaned and annotated, as `Fetched("openalgo.multioptiongreeks", row)` | after the batches, if any failed: `FetchFailed("openalgo.multioptiongreeks", text)` with `f"{failed} batch(es) failed: {first[:150]}"` when no row came back, else `f"{failed} of {batches} batch(es) of {greeks_batch} failed: {first[:150]}"` (`MP:740-752`) |

* **The spot repair** (`MP:340-356`), when `repair_live` and the cleaned row has `invalid_fields`: today's one-minute bars come from `history` with `symbol`, `exchange` spot exchange, `interval` `1m`, `start_date` and `end_date` the IST date (`MP:285-303`), the bars being `data` (or the body) when a list, filtered to dicts and cleaned. They are cached per `(name, IST date)` with the `when` they were fetched, reused while `(when - fetched).total_seconds() < 60`, and cached only on success. The row is deep-copied, then `repair_row(row, bars, when)`; **Deviation (addition):** a row a repair changed also carries `unrepaired`, the copy, so the price as received is kept (legacy overwrote it). If the history read fails, the row is returned as received, followed by `FetchFailed("openalgo.history", f"could not repair {sorted(set(broken))}: {detail[:100]}")` (`MP:347-348`). With `repair_live` off, a broken row is stored as received (legacy only journalled it, `MP:354-356`). **Fork call:** the repair is kept; spot feeds admission's ages and the ATM strike.
* **The expiry** (`MP:755-807`): the values are every non-blank string in a `data` list, upper-cased, then for each dict row of `rows_of(body)` the first truthy `expiry`, `expirydate`, `expiry_date` or `date`, upper-cased. None: why `the call worked and named no expiry`. None parsed: the first value as is. Otherwise the request form of the earliest expiry whose date is on or after the IST date of `when`, else of the latest of all (`sorted(parsed)[-1]`). The chain's record key is `f"{expiry}@{when.utc_iso}"` with that exact text (`25AUG26`, legacy's stored form, `MP:513-515`). **Fork call:** the selection and its fallback are kept; they choose the traded contract.
* **The all-zero refusal** (`MP:495-502`): `priced, legs = any_priced(rows)`; with `legs` and not `priced`, `FetchFailed("openalgo.optionchain", f"upstream returned {len(rows)} strike(s) and {legs} leg(s) with no usable price on any of them — a failed poll in a success envelope, not written")`. A chain with no legs at all is kept, as legacy. **Fork call:** the test stays "no leg priced", not "some leg zero".
* **After a stored chain** (and only then, `MP:540`): `last_chain[name] = when`; the pending inline rows are `greeks_from_chain(rows)` and the pending symbols `chain_symbols(rows)`. `poll("greeks")` consumes both. **Fork call:** the cadence, its 1 s slack, and "noted only after a stored chain" are kept, so a failed or refused chain is retried at the next minute, and a restart pulls at once (`MP:124-128`).
* **The chain payload holds the whole response.** **Deviation:** legacy stored one row per strike with the response's context fields on each envelope (`MP:376-404`, `:513-519`); step 2 keys one chain record per poll and expiry, and step 3 returns a poll's records by expiry. Everything legacy kept is in `response`. Legacy's per-record `quality` (`store.py:330-335`) is not stored: it is a function of the payload, source and origin (`src/data/marketdata/evidence.py:92-138`), and a quote never carries support evidence, so a spot zero is always `unknown` there too, as step 3 reports it.

#### The loop: per-instrument streams, cadence and sources (`market/ingest.py`, `market/sources.py`)

Step 2's tested behaviour is kept; each change is additive or a correction to legacy, named:

* **The protocol** gains `due(stream, instrument, *, when: datetime) -> bool`, and `poll` takes `when` by keyword. `poll` returns a list of plain dicts (as today: source `source_of(stream)`), `Fetched(source, payload)` (another source for that record) and `FetchFailed(source, detail)`, both frozen in `market/sources.py`. `SimulatedSource.due` returns `True`, and its `poll` accepts `when=None` and passes `Fetched` and `FetchFailed` entries through.
* **One `when` per poll (Fork call, amends step 2).** `when = clock.now()` is read once, before the first instrument, and every record of every stream of that poll carries it as `event_at` and in its key, as legacy's `poll_once` (`MP:835-846`); the loop passes `when=instant(when)` to `due` and `poll` (R-10). Step 2 read it per stream; a Greeks record stamped after its chain would be invisible to `greeks_at` at the chain's instant (`scans.py:328-329`).
* **`arrival_at` is each fetch's receipt (F-7, Deviation).** A polled record's `arrival_at` is `clock.now()` read when its fetch returns; its `event_at` stays `when`. Legacy wrote `at` and `fetched_at` both as `when` (`store.py:291-293`). Admission is unchanged: B1's ages read `StableView.spot_as_of` and `chain_as_of` (`kernel/admission.py:662-663`), which the spec has step 5 fill from the chosen records' instants, their `event_at`, and step 3's ages are from `event_at` too. Each coverage row keeps `scope_from` `when` and `scope_to` its fetch's receipt.
* **Per-instrument streams.** `MarketLoop(…, streams: Mapping[str, Sequence[str]] | None = None)`; `None` polls `poll_streams` for every instrument (unchanged). Given, its keys must be exactly the instruments and each value distinct members of `spot`, `chain`, `greeks`; `greeks` only after `chain` in the same list, for `poll_streams` too (F-3: a minute never borrows another minute's chain, OD-9); otherwise `ValueError`. Instruments in order, each instrument's streams in order. `compose(…, streams=None)` passes it through.
* **Cadence (F-4).** Before each fetch, `source.due(stream, instrument, when=…)`. When `False`, no fetch and no record, and a `covered` coverage row with detail `not_due`, scope `when` to `when`, under `source_of(stream)`, so step 5 can tell a skip from a poll that never ran. The loop calls `due` immediately before each fetch, in that order, which the OpenAlgo source relies on.
* **What a poll's list becomes.** Records are built in list order; `Fetched` gives its own source. Coverage: one row per source in order of first appearance among the list's entries (`source_of(stream)` alone for an empty list): `interrupted` with the first `FetchFailed` detail of that source, else `covered`. Records still commit beside an `interrupted` row (a partial batch, as legacy kept it).
* **A Greeks row without a symbol (F-2).** A `greeks` payload whose `symbol` is not a non-empty string is skipped, and its source's coverage detail gains `f"{n} row(s) without a symbol skipped"` (joined to a failure detail with `; `); the rows beside it are kept. **Deviation:** legacy kept such a row (its join reads `strike` and `option_type`); the target's per-leg key needs the symbol.
* **A key error (R-11).** A record whose key cannot be made (a chain without `expiry`) leaves nothing of that fetch: no record and one `interrupted` row under `source_of(stream)` with `KeyError`, whatever sources the fetch named.
* **Keys (amends step 2).** A Greeks record's key is `f"{payload['symbol']}@{when.utc_iso}"`, one per leg. Step 2's "a Greeks batch: `utc(when)`" cannot hold per-leg records, which step 3's join reads. Spot and chain keys are unchanged.
* **Stop rows (F-5).** On opening, `process_stopped` rows are written only for each instrument's `(source_of(stream), stream)` of the streams it polls, not for a source seen only sometimes (the repair's history, the inline Greeks).

#### Websocket ticks (`adapters/openalgo.py`)

Built here: what turns a frame into a queued record. Carried to SLICE-11 (the market process's host): the socket, the `authenticate` frame (`{"action": "authenticate", "api_key": key}`, `src/interfaces/mcp/domains/monitoring/client.py:241-242`), backoff from 1 s doubling to 30 s (`:233-234`, `:267-268`), the market-open gate that fails closed (`src/interfaces/mcp/domains/monitoring/autowatch.py:168-191`), the reconnect after two stale runs (`:51`, `:113-147`) and the five-minute re-subscribe (`src/interfaces/mcp/core/scheduler.py:218-247`).

* **Targets:** every instrument named in `tick_symbols`, or every instrument when it is empty, at its spot exchange, in instrument order: legacy subscribes indices only, at their spot exchange, with the recording scope as the ceiling (`autowatch.py:63-94`; `market_data.record_tick_symbols` `[BANKNIFTY, NIFTY]`, `config/profiles/enforcing.yaml:236`). `subscribe_frames()` returns `{"action": "subscribe", "symbol": name, "exchange": spot_exchange, "mode": tick_mode}` per target (`client.py:14-17`, `:214-215`; legacy mode 1, `config/defaults.yaml:1785`).
* `connected()`: under the lock, `connection = uuid4().hex` and `receipt = 0`. The host calls it each time a socket authenticates, the first time included, so keys never repeat across restarts or reconnects (step 2's key rule).
* `on_frame(raw)`, never raising (legacy's `_handle`, `client.py:270-291`), parsed with `json.loads` (non-finite numbers read, as legacy): a frame that is not JSON, not an object, whose `type` is not `market_data`, or whose `data` is not an object is counted in `ignored`. The symbol and exchange are resolved as legacy's field resolver (`src/interfaces/mcp/core/adaptive.py:36-99`): the spellings `symbol`, `tradingsymbol`, `trading_symbol` and `exchange`, `exch`, `exchange_segment` (`config/defaults.yaml:631-633`) exactly first, then by the normalised name; `None` reads as empty. A frame before the first `connected()`, or whose upper-cased pair is not a target, is counted in `ignored`.
* **Stamping (step 2's rule):** under one lock, `receipt += 1`, `arrival = clock.now()` (the loop's clock), `tick_record(name, scrub(data), source="openalgo.websocket", key=f"{connection}:{receipt}", arrival_at=arrival)`, `canonical(record.payload)`, and the append to the queue. If the record or its canonical text raises (a non-finite value, R-5), `dropped += 1` and the receipt stays used, so a gap in receipts marks the drop (legacy counted lost ticks in `dropped`, `src/interfaces/mcp/domains/monitoring/state.py:103-124`). `drain_ticks()` swaps the queue out under the lock.
* The payload is the frame's `data` as received. Legacy added `_at` to it (`src/data/marketdata/ticks.py:199`); the record's `event_at` holds that.

#### Reference facts (`market/ingest.py`, `adapters/openalgo.py`)

* **The reads** (`scripts/record_reference.py:53-96`), `OpenAlgoMarketSource.reference_reads(exchange, underlyings, day) -> dict` with `option_expiries` and `future_expiries` (each a dict keyed by underlying), `holidays`, `timings`, `instruments` and `nonfinite` (R-7), all within one total deadline of 180 s (legacy's `wait_for`, `:183-185`); each POST's deadline is the smaller of the time left and `market.http_timeout_ms`:
  * per underlying, `expiry` with `symbol`, `exchange`, `instrumenttype` `options`, then `futures`: `data` (or `[]`) when `status` is `success`, else `[]` (`:63-66`);
  * `/api/v1/market/holidays` with `year` the day's year, then the next: a failed read (a `MarketReadFailed`) or a non-`success` body ends the loop with holidays `None` for the day's year and is skipped for the next; the `data` of each success concatenated (`:67-81`);
  * `/api/v1/market/timings` with `date` the day: `data` on `success`, else `None` (`:82-83`);
  * `instruments` by `get` with `apikey` and `exchange` (`:84-95`), its deadline the smaller of the time left and `max(market.http_timeout_ms, 60000)` (legacy's `max(c.timeout, 60.0)`): non-2xx raises `MarketReadFailed(f"instruments: HTTP {status}")` (R-6); `data` when the body is a dict, else `[]`. **Deviation:** the master's response is bounded at `MAX_REFERENCE_BYTES = 64 MiB`, a labelled memory bound; the real master's size is not measured, and legacy had none. A larger master fails the run, visibly.
  * **Deviation (owner-visible, F-11):** the key travels in that request's URL, so it appears in OpenAlgo's access log for that request. Legacy's own client refused key-in-URL on purpose (`src/interfaces/mcp/core/openalgo.py:171-176`), but its recorder sent the master read this way because OpenAlgo's server source was not in the mirror to show a POST or a header is accepted (`scripts/record_reference.py:84-88`), and the mirror is still empty. Kept until that is proved; nothing in the target logs a request line.
  * Every body is cleaned (F-1); `nonfinite` lists `f"{endpoint}:{path}"` for each value made null. Any other failure raises `MarketReadFailed` (legacy exits 1, `:186-188`).
* **The facts** (`src/data/reference/openalgo_recorder.py:48-142`), ported verbatim into `market/ingest.py`: `iso_expiry(value)` (`%d-%b-%y` to ISO), `StaleMaster`, and `facts_from_openalgo(*, observed_at, exchange, underlyings, option_expiries, future_expiries, instruments, holidays, timings, calendar) -> (facts, snapshots, refusals)`, with `day = calendar.exchange_date(observed_at)`, each fact `ReferenceFact(kind, key, value, day, day, observed_at.isoformat(), f"openalgo:{endpoint}")`, and `rows_sha256` `kernel/ledger/envelope.py`'s `digest(rows)`, the same bytes as legacy's `json_sha256` for JSON rows (sorted keys, compact, non-ASCII kept, `src/_canonical.py`). **Fork call:** every fact, refusal and the stale-master refusal are kept; lot size gates quantity.
* `record_reference_day(source, store, clock, *, exchange, underlyings, snapshot_root, calendar) -> dict` (legacy's `record`, `scripts/record_reference.py:125-160`): `started = instant(clock.now())`; the reads with `day = calendar.exchange_date(started)` (R-7); `completed`; `FetchWindowError` when `completed < started` or their exchange dates differ (`:131-137`); then `facts_from_openalgo` at `completed` (a `StaleMaster` propagates and nothing is written); then each underlying's master rows to `snapshot_root / fact.value["snapshot"]` as `gzip.compress(json.dumps(rows, sort_keys=True).encode(), mtime=0)`, created without replacing existing bytes, a different existing file raising `RuntimeError` (`:99-122`, `:147-152`); then `store.record_reference(facts)` (step 2's merge). It returns `{"day", "observed_at": completed.isoformat(), "added": [f"{kind} {key} r{revision}"], "unchanged": len(facts) - len(added), "refusals", "nonfinite"}` (R-17). Legacy's `--dry-run` is not ported (no consumer). SLICE-11 runs it at 09:05 IST on weekdays, with legacy's exchange `NFO` and underlyings `NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY` (`:7-8`, `:35`, `:171`), and `snapshot_root` the market store's directory joined with `reference`.

#### What SLICE-11 binds, and what step 5 takes over

* **SLICE-11** binds, as refusing settings (Q-015), legacy's shipped values: `strike_count` 8, `chain_interval_secs` 60, `greeks` false, `greeks_batch` 10, `repair_live` true (`config/defaults.yaml:1299`, `:1325`, `:1348`, `:1361`, `:1374`), `tick_mode` 1, `tick_symbols` `[BANKNIFTY, NIFTY]`, the instruments with their exchanges and live flags (empty in legacy's defaults, set per deployment, `instruments.py:65-94`), the base URL and key (`settings.secrets`), a value for `market.http_timeout_ms`, and `MarketLoop(streams=source.streams())`.
* **Step 5 (F-4, F-6):** the feed-gap fact needs a `gap` coverage status, which the store's `CHECK` does not allow today: a schema change there. A `covered` row with detail `not_due` is a cadence skip, not a gap. `latest_tick`'s delta comes through `greeks_at`, the GREEKS join, where `multioptiongreeks` wins a tie, not from the chain payload. A chain's context (`spot`, `atm`, `expiry_ts`, …) and the `quotes_included = false` support rule are derived from `payload["response"]` as legacy derives them (`MP:379-404`, `:508-519`).

#### Fork calls and Deviations in this step

* **Fork calls:** the GREEKS stream as the planner's only Greeks, inline rows before `multioptiongreeks` rows; one `when` per poll; non-finite values cleaned and the poll kept; the spot repair; the all-zero refusal; the nearest expiry and its fallback; the chain cadence; the reference facts and refusals.
* **Deviations:** the chain payload holds the whole response; `unrepaired` on a repaired spot row; Greeks keys per leg, and a Greeks row without a symbol skipped; more than one quote row refused; `arrival_at` the fetch's receipt; `greeks_batch` and an instrument without exchanges refused at construction; failures as coverage rows, and a cadence skip as a `not_due` row; one total deadline per read instead of httpx's per-phase timeout; the master bounded at 64 MiB (unmeasured); the master's key in its URL (owner-visible); the fixtures copied (below); PRF-MKT-08's PE sign clause open until C-1.

### The capture C-1 (part of TASK-S08-05)

A read-only capture under the owner's standing boundary (read-only OpenAlgo captures with no order are pre-approved, [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)). It is separate from step 4's completion: step 4 is built and proved without it, and `test_pe_delta_sign_at_the_source` is skipped with a reason naming C-1 until it runs.

1. **Where and when:** on the EC2 (`ssh debian-oa`), against the OpenAlgo the live checkout's `.env` names (`OPENALGO_API_URL`, the loopback `127.0.0.1:5000` per the captures' provenance), on a trading day between 09:20 and 15:20 IST, so implied volatility can be solved from live prices. The first POST is sent at about 30 s past a minute, never on the minute and never at :29 or :59 past the hour (legacy's refusals cluster there, `MP:870-876`). Once per day at most; a failure is reported, never retried.
2. **The script,** stdlib only (`urllib.request`), in `~/claude-desktop/scripts/capture_greeks_c1.py`. Its one argument is the path of that `.env`; it reads only the `OPENALGO_API_URL` and `OPENALGO_API_KEY` lines and refuses unless the URL's host is a loopback address. It never prints, logs or writes the key, the URL with a query, or a request body. Its endpoint list is a constant; it has no other code path.
3. **At most three POSTs,** 15 s each, no retry: `/api/v1/expiry` `{"apikey", "symbol": "NIFTY", "exchange": "NFO", "instrumenttype": "options"}`; `/api/v1/optionchain` `{"apikey", "underlying": "NIFTY", "exchange": "NFO", "with_greeks": true, "expiry_date": E, "strike_count": 2}`, with E the earliest listed expiry on or after today's IST date in `%d%b%y` upper-cased (legacy's rule); `/api/v1/multioptiongreeks` `{"apikey", "symbols": [{"symbol": <ATM CE>, "exchange": "NFO"}, {"symbol": <ATM PE>, "exchange": "NFO"}]}`, the two symbols from that chain's row whose `strike` equals its `atm_strike`. **It stops, sends no further POST, saves nothing and prints the reason** when no expiry is on or after today, when the chain call fails (a non-2xx status or a non-`success` body), when no row's `strike` equals `atm_strike`, or when the `multioptiongreeks` call fails. No order endpoint is named anywhere in the script.
4. **What is saved:** the optionchain and `multioptiongreeks` bodies, bytes as received, with every occurrence of the key's bytes replaced by `***` and their absence asserted before writing, to `~/claude-desktop/outputs/option_chain_greeks_nifty_<YYYYMMDD>.json` and `multioptiongreeks_nifty_<YYYYMMDD>.json`. The expiry body is not saved. The script prints only: each HTTP status and byte count, each saved file's SHA-256, E, and the counts of legs whose delta is negative, zero, positive or absent: in the chain by `ce.delta` and `pe.delta`, in `multioptiongreeks` by `greeks.delta` per `option_type`.
5. **Into the suite:** both files copied byte for byte into `tests/fixtures/openalgo`, with their SHA-256 rows in the directory's README table and a provenance row (capture instant in IST, loopback host, the three endpoints and their bodies without the key, the script's SHA-256). Then `test_pe_delta_sign_at_the_source` in `tests/integration/test_openalgo_contract.py` is un-skipped: it asserts the printed counts from the files and that the source maps every leg's delta, sign included, into `greeks` records unchanged; the result is recorded in this file's "Step 4 as built" and closes the Deviation above.

### Tests

The captures used, copied byte for byte from `tests/fixtures/legacy-buyer-edge/openalgo/` at 445eb116 into `tests/fixtures/openalgo` (T-31), by a script writing `git show`'s bytes: `quotes_banknifty_20260802.json`, `_20260803.json`, `_20260804.json`; `expiry_dates_banknifty_20260802.json`, `_20260803.json`, `_20260804.json`; `option_chain_banknifty_20260802.json`, `_20260803.json`, `_20260804.json`; `option_chain_nifty_20261004.json`; `history_index_1m_20260802.json`, `_20260803.json`, `_20260804.json`. Their SHA-256 rows join the directory's README table (the captures test's count goes from 12 to 25), followed by a provenance table of three columns, `| Files | Captured | Source |`, whose first cell is never a single `.json` name (the captures test counts two-cell `.json` rows, R-3). **Deviation (from the outline's list):** the 30 July files are MCP tool outputs from another instance (v2.0.3) with tool fields added, `option_chain_banknifty_zero_oi.json` is hand-derived (its `_fixture_note`), and the option daily histories have no reader here; none is copied.

`tests/integration/test_openalgo_contract.py` gains a "SLICE-08 step 4" section, over the existing fake server on 127.0.0.1 with the `oa` fixture; the fake answers a request without `Content-Length` as an empty body, routes by the path before `?`, and appends each request's head to `heads` (R-13). Labelled synthetic values: the key `SECRET-KEY-123`, BANKNIFTY at `NSE_INDEX` and `NFO` (live), NIFTY at `NSE_INDEX` and `NFO` (spot only), `strike_count` 8, `greeks_batch` 10, `tick_mode` 1. The synthetic `multioptiongreeks` row (R-4) is exactly `{"status": "success", "symbol": s, "exchange": "NFO", "strike": <the chain's strike>, "option_type": s[-2:], "implied_volatility": 15.25, "greeks": {"delta": 0.52 for CE or -0.48 for PE, "gamma": 0.0001, "theta": -4.97, "vega": 30.76, "rho": 0.001}}`, one per requested symbol, in request order. Every expectation below is written by hand from the captures and the rules above (A08-F3).

| Group | Cases |
|---|---|
| Captures | 25 files, each SHA-256 as the README table |
| Construction | Every refusal above; plain `http` to a remote host; an instrument without an exchange; the key not in `repr` |
| Quotes | Each of the three captures: one spot payload equal to its `data` object (2 August: `ltp` 57264.85, `open` 57225.9, `high` 57411.25, `low` 57139.6), the body exactly `{"apikey":"SECRET-KEY-123","symbol":"BANKNIFTY","exchange":"NSE_INDEX"}`; `{"status":"error","message":"x"}` gives `quotes: x`; HTTP 500 gives `quotes: HTTP 500`; an empty `data` list gives `[]`; two rows give `quotes: 2 rows`; a JSON list gives `quotes: got list, not a response object` |
| Repair | 4 August's quote with `ltp` null and `open` `"x"` (synthetic edits), `history_index_1m_20260804.json`, `when` 10:41:30 IST: `ltp` 57758.4 and `open` 57766.25 (the 10:41 bar), `high` 58068.95 and `low` 57352.65 kept, `repaired` `["ltp", "open"]`, `repair_src` `openalgo.history`, `unrepaired` the edited row, the history body exactly. At 10:41:45 still the 10:41 bar. At 10:42:29 the cached bars give 57760.35 and 57763.45 with one history call; at 10:42:30 a second call. At 2026-08-03 09:14:59 IST no bar: the row unchanged. History HTTP 500: the edited row and `could not repair ['ltp', 'open']: history: HTTP 500`. `repair_live` off: the edited row, one call |
| Non-finite (F-1) | A quote `{"ltp":NaN,"open":57225.9,"high":Infinity,"low":57139.6}` at 10:41:30 on 4 August: `ltp` 57758.4 and `high` 57768.1 repaired, `nonfinite` `["ltp", "high"]`, `unrepaired` with both null, the row canonical; the 3 August chain with the 57700 CE `ltp` NaN: `nonfinite` `["response.chain[5].ce.ltp"]` and that value null; a master row's `tick_size` NaN: `nonfinite` `["instruments:data[0].tick_size"]` and the tick size fact still 0.05 |
| Expiry | `expiry_dates_banknifty_20260802.json`: 2 August gives `25AUG26`; 26 August 00:10 IST gives `29SEP26`; 1 July 2027 gives `29JUN27`; `["next-thursday"]` gives `NEXT-THURSDAY`; an empty list gives `expiry unresolved: the call worked and named no expiry`; the expiry body exactly |
| Chain | Each BANKNIFTY capture: one payload `{"expiry": "25AUG26", "exchange": "NFO", "response": <the capture>}`, the body exactly `…"with_greeks":true,"expiry_date":"25AUG26","strike_count":8}`; 22 legs, all priced; 22 symbols, first `BANKNIFTY25AUG2657200CE` on 3 August; no inline Greeks and no `greeks` due with `greeks` off. The NIFTY capture: 25 strikes, 50 legs, `greeks_included` false, no inline Greeks. Every leg zeroed: legacy's text for 11 strikes and 22 legs, and the chain due again; one `bid` 0.05: stored; no rows: `[]`, not noted |
| Cadence | 60: due at 59.5 s; 120: not due at 59.5 s, due at 119.9 s; 0: due at once; a new source due at once; NIFTY (spot only) never |
| Inline Greeks | The 3 August chain with synthetic Greeks on 57700 CE (0.52), 57700 PE (−0.48), 57800 CE (delta 0.4 only) and 57800 PE (+0.48): rows in chain order under `openalgo.optionchain.with_greeks`; the CE row exactly; the PE `option_price` 632.35; both PE signs unchanged; the 57800 CE row `missing inline greeks: gamma,implied_volatility,theta,vega`; consumed after one poll |
| `multioptiongreeks` | `greeks` on: three calls of 10, 10 and 2 symbols in chain order, the body compact (`{"apikey":"SECRET-KEY-123","symbols":[{"symbol":"BANKNIFTY25AUG2657200CE","exchange":"NFO"},…`); 22 rows annotated; one without `rho` `missing greeks: rho`. The second call HTTP 500: 12 rows and `1 of 3 batch(es) of 10 failed: multioptiongreeks: HTTP 500`; every call failing: `3 batch(es) failed: multioptiongreeks: HTTP 500` |
| End to end | A `MarketStore` under `tmp_path`, `MarketLoop(streams=source.streams())`, 2026-08-03 10:00:00.5 IST, BANKNIFTY live with the inline Greeks above, NIFTY spot only, with `greeks` on and off: the coverage rows in order; every record's `event_at` the one `when`. A view at `when` + 1 s: `spot()` 57683.7; `chains()` one record, `25AUG26`; `greeks_at(when, 57700.0, "PE")` the `multioptiongreeks` record with `greeks` on (legacy's tie) and the inline one with it off, delta −0.48 |
| Ticks | Keys `<c>:1`, `<c>:2`, a `tradingsymbol` and `Exchange_Segment` frame resolved; non-JSON, a list, an `error` frame, another symbol and a frame before `connected()` ignored; a NaN `ltp` dropped with its receipt used; `arrival_at` the clock's reading; drained in receipt order; after `connected()` a new 32-hex connection from `:1`; two threads of 500 frames give receipts 2…1,001 in order; `subscribe_frames()` exactly; a loop run commits them as ticks |
| Reference | Synthetic reads in legacy's shapes (a NIFTY master of three options with lot size 75 and tick size 0.05 on two expiries and a future, a BANKNIFTY row left out, holidays, timings): the seven facts by hand, the digest computed in the test with `hashlib`; the snapshot's bytes and path; the master's request line exactly `GET /api/v1/instruments?apikey=SECRET-KEY-123&exchange=NFO HTTP/1.1`; a second run adds nothing; a listed expiry before the day raises `StaleMaster` with nothing written; reads ending on the next IST date raise `FetchWindowError`; lot sizes 65 and 75 refused; holidays for the day's year failing refused; a different existing snapshot raises `RuntimeError`; a master read at HTTP 500 raises `instruments: HTTP 500` without the key |
| Literal port | `bar_time` with `timestamp` null and `t` set gives `""` (F-13) |
| The key | An echo at HTTP 200 with `status` `error` (R-14) and a quote carrying the key in a text field: every `FetchFailed` detail, payload, coverage detail and the `repr` show `***`; no file of the market store contains the key |
| Sign at the source | `test_pe_delta_sign_at_the_source`, skipped until C-1 |

`tests/unit/test_market_ingest.py` (T-43) gains, every value labelled synthetic:

| Group | Cases |
|---|---|
| Loop | One `when` shared by two instruments while the clock advances 250 ms inside each fetch, `arrival_at` and `scope_to` each fetch's receipt (F-7), `due` given the one instant; `streams` per instrument in order; refusals (a missing or extra instrument, `tick`, a repeated stream, `greeks` before `chain`, `greeks` without `chain`, in `streams` and in `poll_streams`); `due` false: no fetch, a `covered` `not_due` row; `Fetched` gives its source; a `FetchFailed` and a Greeks row without a symbol give `interrupted` with `"…; 1 row(s) without a symbol skipped"` while the rows beside it are kept; a key error in a two-source fetch: one `interrupted` row with `KeyError` and nothing else; stop rows only for each instrument's own streams |
| Settings | `market.http_timeout_ms`: `None` by default, bound by `AT_MARKET_HTTP_TIMEOUT_MS`, `0`, `-1`, `5.0` and text refused |
| Boundary | No `market` module imports `autonomous_trading.adapters`, beside step 2's kernel check |

### Break checks

Each is applied with every anchor checked first, run against the two test files, and restored byte for byte with an md5 check. Each must fail a listed test.

| Change | Test that must fail |
|---|---|
| Fork: `when` read per stream | Loop |
| Fork: `multioptiongreeks` rows before the inline rows | End to end |
| Fork: `chain_due` without the 1 s slack | Cadence |
| Fork: the cadence noted on a refused chain | Chain |
| Fork: the refusal on "some leg zero" | Chain |
| Fork: the expiry fallback to the earliest | Expiry |
| Fork: the expiry on the UTC date | Expiry |
| Fork: no spot repair | Repair |
| Fork: `StaleMaster` not raised | Reference |
| Fork: disagreeing lot sizes accepted | Reference |
| `bar_at` taking the nearest bar | Repair |
| The history cache reused at 60 s | Repair |
| A usable field overwritten by the repair | Repair |
| `unrepaired` left out | Repair |
| F-1: a non-finite quote value not cleaned | Non-finite |
| F-2: a row without a symbol drops the fetch | Loop |
| F-3: `greeks` before `chain` allowed | Loop |
| F-4: a not-due stream leaves no row | Loop |
| F-5: stop rows for every source seen | Loop |
| F-7: `arrival_at` is `when` | Loop |
| R-1: `post`'s limit fixed at import | The existing oversize test |
| The key: a body not scrubbed; a detail not scrubbed | The key |
| Batches of 50 regardless of `greeks_batch` | `multioptiongreeks` |
| A failed batch drops the batches that succeeded | `multioptiongreeks` |
| The receipt not reset on `connected()` | Ticks |
| An unwritable tick raised instead of counted | Ticks |
| `abs()` on a delta | Inline Greeks |

### Files

| File | Change |
|---|---|
| `adapters/openalgo.py` | `_Http` (moved transport, `get`, the passed byte limit, `bytearray` buffers); `OpenAlgoAdapter` delegates; `MarketReadFailed`, `MAX_REFERENCE_BYTES`, `OpenAlgoMarketSource` |
| `market/sources.py` | The protocol's `due` and `when`; `Fetched`, `FetchFailed`, `MarketInstrument`; `SimulatedSource.due`; `finite` and the response-shape functions and constants |
| `market/ingest.py` | `MarketLoop` (one `when`, `arrival_at` per fetch, `streams`, `due` and `not_due` rows, sources per record, Greeks keys and skipped rows, stop rows); `compose(streams=…)`; `iso_expiry`, `StaleMaster`, `FetchWindowError`, `facts_from_openalgo`, `record_reference_day` |
| `src/autonomous_trading/settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml` | `market.http_timeout_ms` |
| `tests/integration/test_openalgo_contract.py` | The fake's GET handling and `heads`; the captures count; the step 4 section |
| `tests/unit/test_market_ingest.py` | The loop, settings and boundary cases |
| `tests/fixtures/openalgo` | The 13 captures, their README rows and provenance |

No tree delta: every file is in the tree or under T-31 and T-43. No `contracts` change, no `tests/conftest.py` change.

### Completion conditions (step 4)

* Every test above passes, twice in a row, with the whole suite, with no call leaving 127.0.0.1; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every edited Python file.
* C-1 is not a completion condition: until it runs, PRF-MKT-08's PE sign clause is the recorded Deviation and its test is skipped.

### Step 4 as built

**In plain words.** The real data feed is built and tested against OpenAlgo's own recorded answers: index prices, the patch from history, expiries, option chains, both kinds of Greeks, live ticks and the morning reference facts, all on a fake server on this machine. The entry planner's Greeks come out of the store exactly as today's system picks them. All 1,063 automatic checks pass, twice in a row; the put-delta capture (C-1) has not run and its one test waits for it.

Commit `e070d01` on `slice-08`, on top of `fb8f2bb`. It changes 22 paths (24,318 lines added, 91 removed; the three one-minute history captures are most of it). The files match the step's table.

**Choices made while building:**

| Topic | As built |
|---|---|
| The skipped Greeks row (F-2) | Skipped and counted in the loop, for any source, not in the OpenAlgo source, so the coverage detail is written where coverage is built |
| A chain for a spot-only instrument | `due("chain")` is also false for an instrument that is not live, as legacy's `pull_chain` skips it (`MP:416-419`), should a plan name one |
| History `data` that is not a list | Read as no bars (legacy iterated a dict's keys to nothing and raised on a scalar) |
| `nonfinite` in the reference run | `reference_reads` returns it and `record_reference_day` passes it through in its result, beside R-17's fields |
| Frame parsing | `on_frame` parses outside the lock; only the receipt, the stamp, the record and the append are under it |
| The fake server | A request without `Content-Length` is read as an empty body; routes match the path before `?`; heads recorded |
| The key break checks | "A failure detail not scrubbed" survived: the body is scrubbed before its message is read, so the detail's own scrub is a second guard no test can reach. It is kept, and the break check uses the reachable path instead, a tick's data not scrubbed, with a tick case added to the key test |

**Tests:** `tests/integration/test_openalgo_contract.py` gains 37 cases (36 run, `test_pe_delta_sign_at_the_source` skipped naming C-1; the file is 99 passed, 1 skipped); `tests/unit/test_market_ingest.py` gains 7 (32). Step 2's and step 3's tests pass unchanged. The whole suite: 1,063 passed, 1 skipped, twice in a row (111.9 s and 114.9 s), after the last edit.

**Break checks** (anchors checked first, one at a time, every file restored byte for byte, md5 verified): all 28 failed a test.

| Change | Test that failed |
|---|---|
| Fork: `when` read per stream | Loop (2 tests) |
| Fork: `multioptiongreeks` before the inline rows | End to end (`greeks` on) |
| Fork: `chain_due` without the 1 s slack | Cadence (2 cases) |
| Fork: the cadence noted on a refused chain | Chain (all-zero) |
| Fork: the refusal on "some leg zero" | Chain (2 tests) |
| Fork: the expiry fallback to the earliest | Expiry (1 July 2027) |
| Fork: the expiry on the UTC date | Expiry (26 August 00:10 IST) |
| Fork: no spot repair | Repair; Non-finite (3 tests) |
| Fork: `StaleMaster` not raised | Reference |
| Fork: disagreeing lot sizes accepted | Reference |
| `bar_at` taking the nearest bar | Repair (2 tests) |
| The history cache reused at 60 s | Repair |
| A usable field overwritten by the repair | Repair; Non-finite |
| `unrepaired` left out | Repair; Non-finite |
| F-1: a non-finite quote value not cleaned | Non-finite |
| F-2: a row without a symbol drops the fetch | Loop |
| F-3: `greeks` before `chain` allowed | Loop |
| F-4: a not-due stream leaves no row | Loop |
| F-5: stop rows for every source seen | Loop |
| F-7: `arrival_at` is `when` | Loop (2 tests) |
| R-1: `post`'s limit fixed at import | The existing oversize test |
| The key: a body not scrubbed | The key |
| The key: a tick's data not scrubbed (replaces "a detail not scrubbed", above) | The key |
| Batches of 50 regardless of `greeks_batch` | `multioptiongreeks` |
| A failed batch drops the batches that succeeded | `multioptiongreeks` |
| The receipt not reset on `connected()` | Ticks |
| An unwritable tick raised instead of counted | Ticks |
| `abs()` on a delta | Inline Greeks; End to end (`greeks` off) |

**Open:** C-1 and `test_pe_delta_sign_at_the_source` (the owner's coordinator runs C-1).

## Step 5 — the kernel's port

<a id="step-5--the-kernels-port-outline"></a>The authorities are the spec's [kernel port](../../design/market-data-and-canvas.md#the-kernels-market-port-marketviewpy) section, its [Ingestion and merge](../../design/market-data-and-canvas.md#ingestion-and-merge-marketingestpy) feed-gap rule, the protection spec's gap record as SLICE-06 step 5 built it, and legacy's live host at 445eb116. Step 5 is TASK-S08-04 (PRF-MKT-07). It builds `StoreMarket`, the kernel's market and calendar ports over the store, composes it in `bootstrap` for a composition that names a market store, gives protection one view per pass, ports the two gap sources SLICE-06 carried (`missing_minutes` and the day high), and adds the store's `gap` coverage status that step 4 carried. It builds on step 4 as built (OA_NEW `c2cca11` on `slice-08`, which merges SLICE-10 step 1 into `e070d01`). Fresh design and readiness reviewers reviewed this step ([review](../../egm/plan/review.md)); their findings (F-1…F-12, R-1…R-14) are resolved below, each checked against the code first. Every legacy citation is at 445eb116; `MP` is `src/interfaces/mcp/core/marketpull.py`, `S` is `src/data/marketdata/scans.py`, `RFL` is as above.

**In plain words.** The new system now reads real stored prices instead of test fixtures, through the same doors the entry checks and the protection loop already use. Each protection pass takes one snapshot of the market and records its name on every decision it makes, so any stop move can be replayed later with exactly the prices it saw. The option's minute-by-minute prices come from the stored option chain, as today, and a price that cannot be read stops that position's trail for the pass, as today. Two ways of spotting a missed price peak that today's system has are added back: a hole of more than two minutes between prices, and the option's day high rising across the hole. These are still recorded only, never acted on. If the price store cannot be read, no stop is moved to a new level, the outage is reported once, and the end-of-day square-off still runs. The trading calendar comes from the recorded exchange timings, retried every minute until today's is stored. No trading rule, threshold or money value changes.

### Decisions

#### Who calls the ports today (checked on `c2cca11`, so none is missed)

| Read | Callers in `src/` | Fixture data written by tests and tools |
|---|---|---|
| `MarketPort.closes` | `kernel/protection.py:860` (`ProtectionLoop._trail`), reached for a basket from `:525` (`_basket_desire`); declared `kernel/ports.py:105` | `FixtureMarket.closes`, `tests/conftest.py:541`; rows set in `tests/unit/test_protection_loop.py:106`, `:163`, `:232`, `tests/unit/test_protection_basket.py:285-286`, `tests/recovery/test_crash_boundaries.py:349-350`, `scripts/measure_protection.py:103-104`, `:121` |
| `MarketPort.latest_tick` | `kernel/protection.py:1132` (`_tick_exit`), reached for a basket from `:466`; declared `kernel/ports.py:109` | `FixtureMarket.latest_tick`, `tests/conftest.py:544`; ticks set in `tests/unit/test_protection_loop.py:445`, `tests/recovery/test_crash_boundaries.py:342`, `scripts/measure_protection.py:122` |
| The closes' result (`sj.latest_close`) | `kernel/protection.py:976` (`_stop_requests`) and `:576` (`_basket_leg`), the through-market guard | — |
| `view`, `chain`, `chains`, `reference_facts` | `kernel/admission.py:742`, `:759`, `:763`, `:771` (`EntryAdmission.admit`) | `AdmissionWorld.fresh`, `tests/conftest.py:583-585`, and the admission tests |
| The fixture port itself | Built only in `admission_ports`, `tests/conftest.py:614`; passed on by `bootstrap.py:161` and the two doors | Every admission world |
| `Calendar.today`, `trading_day` | `kernel/lifecycle.py:136`, `:144` (`Sessions`); `kernel/protection.py:1161` (`_square_off`) | `FakeCalendar`, `tests/conftest.py:83` |

#### Records (`contracts/market.py`, `kernel/ports.py`)

* `TradingDay`, `Holiday` and the calendar's `Unavailable` move unchanged from `kernel/ports.py:20-36` into `contracts/market.py`, the last renamed `DayUnavailable` (step 3's `market/view.py` already has an `Unavailable(reason)`). `kernel/ports.py` imports the three and binds `Unavailable = DayUnavailable`, so every existing import and `isinstance` check is unchanged. Reason: `StoreMarket` returns them, and no `market` module may import the kernel beyond the storage layer (step 2's boundary test).
* `PriceUnreadable(instrument: str, field: str, at: Timestamp)`, frozen, `field` `ltp` or `high` (else `ValueError`): a stored price `float` cannot read (F-4).
* `COVERAGE_STATUSES = ("covered", "interrupted", "gap")`; `CoverageEntry.status` must be one of them.
* **`OptionQuote` (Fork call, F-6):** `ltp`, `bid`, `ask` and `tick_size` become finite decimal strings (`_finite`), as `oi`, `volume`, `delta` and `gamma` are. Legacy's `_num` passes any finite number (`S:100-104`) and the planner turns quotes back into floats (`kernel/selection.py:20-35`), so a price is carried as the float's exact decimal text, never rounded. No test pinned the old rule; SLICE-04's planner tests pass unchanged.
* `InstrumentClose` is unchanged: the day high is its own read (F-5, below), which supersedes the spec's `InstrumentClose.high` (and R-3).

#### The kernel's port (`kernel/ports.py`)

`MarketPort` becomes, with `view`, `chain` and `chains` unchanged:

* `resolve(policy: str) -> str | None`: one view identity at the port's clock; `None` when the store cannot be read.
* `closes(view_id: str | None, instrument: str, since: str, *, underlying: str | None) -> tuple[InstrumentClose, ...] | PriceUnreadable`, oldest first.
* `highs(view_id: str | None, instrument: str, frm: str, to: str, *, underlying: str | None) -> tuple[str, ...] | PriceUnreadable`: the leg's day-high readings on every poll with `frm <= ts <= to` (F-5).
* `latest_tick(view_id: str | None, instrument: str, *, underlying: str | None) -> Tick | None`.
* `reference_facts(underlying, decision_at, *, view_id: str | None = None)`: `view_id`, when the caller has one, bounds the read by that view's head (F-11). Admission passes `intent.view_id` (`kernel/admission.py:771`).

**Deviation (from the spec's `closes(view_id, instrument, since)`):** the reads also take the position's underlying. One pass view spans every underlying (below), and a held contract's chain is stored under its underlying. The kernel passes the entry's own `underlying` from its `COMMAND_ADMITTED` payload; nothing is parsed out of a symbol.

#### `StoreMarket` (`market/view.py`)

`StoreMarket(store_path, policies: Mapping[str, ViewPolicy], clock)`. Construction raises `ValueError` when a key differs from its policy's `name`, and opens the reader once (below). It never writes.

* **Threads (F-11).** Admission runs on its callers' threads and the protection loop on the writer thread, and both read one instance. Every public method holds one `threading.RLock` for its whole read: the reader, its lazy reopening and both caches.
* **The reader (F-2, F-12).** Opened lazily with `MarketReader.open(store_path)` and kept. `_UNREADABLE = (OSError, UnsafeRuntime, apsw.Error)` (`FileNotFoundError` is an `OSError`, `kernel/ledger/runtime.py:77-78`; `UnsafeRuntime`, `:85-87`). Opening that raises one of them, or `StoreNotUpgraded` (below), leaves the store unreadable; a read that raises one of them closes and drops the reader. The call then gives its "unreadable" answer, and the next call opens again. Any other `ValueError` from opening (`MKT-R02`, a schema this code does not know) is a configuration error: it is raised at construction, so `bootstrap` refuses the composition with `SettingsError`, and if a store is replaced under a running kernel it is raised from the read, never retried silently.
* **The caches.** Views reopened since the last `resolve`, by `(view text, underlying)` (`None` for an entry view), so one pass parses a day's chain once per underlying; `resolve` empties it. For its whole life, each chain record's legs by `seq`, as `(symbol, raw strike, side, raw ltp, raw high)`, rows in `rows_of` order and `ce` before `pe` (a stored record never changes); entries of another exchange date than the new pass view's are dropped at each `resolve`. The reads use `View.heads(stream, instrument)`, a new public form of step 3's `_latest`, and load only the sequences not yet cached.
* **A view for an underlying:** `reopen(reader, policies, text)`; `Unavailable` (or a non-string) gives `None`. An identity whose `underlying` is `*` gives `View(reader, policy, dataclasses.replace(identity, underlying=underlying))`; one naming that underlying gives itself; one naming another gives `None`. An entry read (`view`, `chain`, `chains`, `chain_evidence`) gives `None` for a `*` identity.

**`resolve(policy)`** (unreadable: `None`): `resolve(reader, policies, policy, "*", instant(clock.now())).id.text`, step 3's function with the underlying `*`. A policy name not bound raises `KeyError` (`bootstrap` checks it). **Deviation (from the spec's identity, which names one underlying):** the pass view names `*`. Its store, schema, policy, digest, cutoff and head fix the population of every underlying, so each derived view reads exactly what the recorded text reopens. `*` is never an underlying.

**`view(view_id) -> StableView | None`** (unreadable, `Unavailable` or `*`: `None`). With `v` the reopened view, `spot = v.spot()` and `chain = v.chain()`; either `None` gives `None`, which admission refuses as `ADM-R05` `view_missing` (`kernel/admission.py:754-755`). Otherwise:

| Field | Value |
|---|---|
| `view_id` | the text |
| `underlying` | the identity's |
| `calendar_id` | `v.calendar.calendar_id` (`NSE-FO`) |
| `bar_open`, `bar_close` | `v.anchor` and `v.anchor + 60 s`, as `Timestamp(utc(...), "exchange")`: the newest window confirmed by the cutoff (the spec) |
| `spot_as_of`, `chain_as_of` | the chosen records' `event_at` text, domain `exchange` |
| `spot` | `repr` of the spot record's usable value (`_usable`, step 3), whether the read answered `via` `spot` or `chain` |

**`chain(view_id)`** is the snapshot of `v.chain()`'s record; **`chains(view_id)`** the snapshots of `v.chains()`, nearest expiry first (`None` and `()` when nothing is picked, unreadable, or `*`). Every snapshot of one poll has the poll's `event_at` as `as_of`, so admission's `as_of` checks hold (`kernel/admission.py:761`, `:767`). **The snapshot of a chain record `m` (Fork call: legacy's planner rows, `S:81-181` flattened, `S:334-366` Greeks attached):**

* `ChainSnapshot(underlying, expiry=str(payload["expiry"]), as_of=Timestamp(event_at, "exchange"), rows, dte)`, `expiry` as stored (`25AUG26`, legacy's envelope expiry). `dte` is legacy's `_dte` (`S:65-78`): the expiry stripped, upper-cased and parsed with `%d%b%y`, `%d-%b-%y`, `%Y-%m-%d` in order, minus the poll's exchange date in days; unparsed gives `None`.
* **A passed expiry (Fork call, F-7):** in `chains()` a snapshot whose `dte` is negative is left out, so structures' `_expiry_rows` skips it as legacy does (`kernel/selection.py:413`); it is never turned into `None`, which `_integer` would refuse (`:397-400`). In `chain()` (the one-leg planner, which never reads `dte`) a negative `dte` is carried as `None`, because the contract carries no negative value (`contracts/market.py:134`).
* `rows`: for each dict row of `rows_of(payload.get("response"))` in order: a row whose `strike` is not an int or float, or is a bool or non-finite, is skipped (**Deviation:** legacy kept a `None` strike, which selection read as 0.0); otherwise `ChainRow(repr(float(strike)), lotsize, None, ce, pe)`. `lotsize` is `positive_integral_lot_size(ce.get("lotsize") or pe.get("lotsize"))`, the planner's own rule (`kernel/selection.py:230-239`) copied into `market/view.py`, on legacy's `ce or pe` choice (`S:146`). A non-dict leg is `{}` (`S:93-98`). The row-level `tick_size` is `None`: legacy's flat row has none.
* A leg gives an `OptionQuote` when it is a non-empty dict whose `symbol` is a non-empty string, else `None`. With `num(x)` legacy's `_num` (`S:100-104`, an int or float that is not a bool, as a float, here also finite, else `None`):
  * `ltp`, `bid`, `ask`, `oi`, `volume`, `tick_size`: `repr(num(...))` or `None` (F-6: never rounded). **Fork call:** the tick size is the raw finite value, as legacy's leg `tick_size` reached `tick_size_of` (`kernel/selection.py:339-349`), so a 0.025 tick is rounded with, never replaced by the 0.05 default;
  * `delta`, `gamma`: from `v.greeks_at(instant(m.record.event_at), raw strike, "CE" or "PE")`, legacy's join on the chain's own stamp (`S:348`): the record's `payload["greeks"]` (a dict, else `{}`), each `repr(num(...))` or `None`; `None` when the minute has no record (OD-9). The leg's own inline `delta` is never read, as legacy (`S:158-170`). `multioptiongreeks` wins a tie, since step 4 commits it after the inline rows and `greeks_at` ties to the higher `seq`; `valid` is not consulted, as `S:351-355`.

**`reference_facts(underlying, decision_at, *, view_id=None)`**: `reader.reference_as_of("lot_size", underlying, decision_at, through=…)`, `through` the head of the view `view_id` reopens (any underlying, `*` included), else the reader's head. A `ReferenceMissing` is returned as is; a fact gives `ReferenceFacts(underlying, calendar("nse-fo/v1").exchange_date(instant(decision_at)), value)` with `value` the fact's value when it is an int and not a bool, else `None`. Unreadable: `ReferenceMissing("no_fact")` (**Deviation:** the contract has no "unreadable" reason).

**`closes(view_id, instrument, since, *, underlying=None)`** (`view_id` or `underlying` `None`, unreadable, or no view: `()`). **Fork call, legacy's premium bars** (`_premium_bars`, RFL `:5062-5134`):

1. the polls the view sees for `underlying`, oldest first: the latest visible revision of each chain record (the cutoff's exchange date, `seq <= head`, `event_at` and, under `arrival`, `arrival_at` at or before the cutoff), grouped by `event_at` instant, each poll's records in `seq` order;
2. polls with `event_at` before `since` (an instant) are skipped (RFL `:5096`);
3. within a poll, the legs whose symbol equals `instrument` (RFL `:5101`), in order: each whose `ltp` is not `None` sets `close = float(ltp)`, so the **last** wins (RFL `:5103-5106`). **Fork call (F-4):** an `ltp` that `float` refuses, or whose float is not finite, returns `PriceUnreadable(instrument, "ltp", poll instant)` at once: legacy's `float(close)` raised there (RFL `:5106`), the error left `_step_one` (`:5452`) and `sweep_trail` noted it (`:5552-5553`), so the position was not stepped, and the bad poll stayed in the day, so every later pass failed the same way;
4. a poll with a `close` gives `InstrumentClose(instrument, Timestamp(utc(at), "exchange"), repr(close))`.

`ltp` is read whatever `quotes_included` says, as legacy's bars (`S` support marks evidence only; Fork call).

**`highs(view_id, instrument, frm, to, *, underlying=None)`** (the same `()` cases). **Fork call (F-5),** legacy's `_leg_day_high_jump` (RFL `:5316-5343`, the spec's "from the chain rows"): over every poll the view sees with `frm <= at <= to` (instants), an `ltp` or not, each matching leg whose `high` is not `None` in order gives `repr(float(high))`; a `high` `float` refuses gives `PriceUnreadable(instrument, "high", poll instant)` (legacy's `float(leg["high"])` raised inside `_record_trail_gap`, `:5339`, `:5492-5498`).

**`latest_tick(view_id, instrument, *, underlying=None)`** (Q-031 A; the same `None` cases; R-12): the newest poll the view sees; the **last** matching leg of that poll; none gives `None` (the held strike left the polled window). If that leg's `ltp` is `None`, or `float` refuses it, or its float is not exact at two places as money, `None`: refused, never rounded (the spec), and no earlier leg or poll is consulted. `delta` as a quote's, from `v.greeks_at(at, row strike, side)`. `Tick(instrument, price, delta, Timestamp(utc(at), "exchange"))`. The kernel's own age and `since` checks (`kernel/protection.py:1134-1138`) still apply.

**The calendar port.** `_BY_ID`, the calendars of `CALENDARS` by `calendar_id`, and `_TRADING_EXCHANGE = {"NSE-FO": "NFO"}` (the recorder's exchange, step 4).

* `today(calendar_id, now)`: `calendar.exchange_date(instant(now))` for a known id; for an unknown id the UTC date of `now`, so the session open that follows fails closed on `trading_day` (**Deviation:** a binding naming an unknown calendar never raises out of `Sessions`).
* `trading_day(calendar_id, date)`, **Fork call, legacy's gate** (`src/interfaces/mcp/core/market_calendar.py:111-205`: a window means trading, none means shut, a failure means not trading, `:28-33`). No caller has a view, so it reads at the reader's head (F-11):
  * an unknown id, or unreadable: `DayUnavailable()`;
  * the facts of kind `trading_day` and key `_TRADING_EXCHANGE[calendar_id]` in force on `date` (`effective_from <= date` and `effective_to` `None` or `>= date`, as step 2's `as_of`) with `available_at` at or before `clock.now()`; the latest by `(reference_instant(available_at), revision)`. None: `DayUnavailable()`, never assumed open;
  * `value["open"]` false: `Holiday()` (`:179-188`);
  * `value["open"]` true and `start` and `end` each an int or float and not a bool: `TradingDay(ms_text(start), ms_text(end), calendar.version, utc_offset_minutes=calendar.utc_offset_minutes)`, with `ms_text(ms) = utc(datetime.fromtimestamp(ms // 1000, timezone.utc) + timedelta(milliseconds=ms % 1000))` on `int(ms)` (R-14: no float division); otherwise `DayUnavailable()` (`:152-154`).
* **Fork call (F-9): retried until stored.** Legacy asked the calendar again at the next gate after a failed read (`market_calendar.py:124-126`). `market/ingest.py` gains `trading_day_recorded(reader, exchange, day) -> bool`, true when the store holds a `trading_day` fact for `exchange` (stripped, upper-cased) in force on `day`. SLICE-11's host runs `record_reference_day` every minute from 09:05 until it is true; SLICE-11 binds that schedule. A session waits, recording `calendar_unavailable` once (`kernel/lifecycle.py:148-149`), and opens on the first tick after the fact is stored.

**Inspection reads** (no kernel caller; R-13):

* `coverage(view_id, instrument) -> tuple[dict, ...]`: the store's coverage rows with `seq <= head`, that `instrument`, and `scope_from` on the view's exchange date and at or before its cutoff, in `seq` order; `()` when unreadable or unavailable. This is the spec's feed-gap fact, readable by view; protection's detection stays from the closes.
* `chain_evidence(view_id) -> tuple[ChainEvidence, ...]`, one per record of `v.chains()`: `ChainEvidence(expiry: str, as_of: Timestamp, context: dict, quote_support: dict | None)`, frozen, with `context = chain_context(response)` and `quote_support = quote_support(response)`; `()` when unreadable, unavailable or `*`. It is the field evidence SLICE-04 deferred to this port for structures (Q-020); nothing refuses on it.

#### Chain context and the support rule (`market/sources.py`)

* `CHAIN_CONTEXT`, legacy's `_CHAIN_CONTEXT` (`MP:379-391`), as `(key, short)` pairs in its order: `underlying_ltp`→`spot`, `underlying_prev_close`, `atm_strike`→`atm`, `expiry_date`, `expiry_ts`, `server_ts`, `quotes_included`, `greeks_included`, `forward_price`, `underlying_symbol`, `underlying_exchange`. `chain_context(response) -> dict` (`MP:399-404`): `{}` for a non-dict; else each key whose value is not `None` and is a `str`, `int`, `float` or `bool`, under its short name.
* `CHAIN_QUOTE_FIELDS` (`MP:393-396`): `ltp`, `bid`, `ask`, `bid_qty`, `ask_qty`, `open`, `high`, `low`, `prev_close`, `volume`, `oi`. `quote_support(response) -> dict[str, bool] | None` (`MP:508-512`): every field `False` when the response is a dict whose `quotes_included` is `False` (identity, not falsiness), else `None`.

#### The protection loop (`kernel/protection.py`)

* **Constants.** `PROTECTION_VIEW = "protection"`, the view policy protection resolves; `TRAIL_GAP_SECS = 120.0`, legacy's `_TRAIL_GAP_SECS` (RFL `:5017-5019`). It only labels a record-only gap; it is not a new value.
* **One view per pass.** `ProtectionLoop.__init__` sets `market_view: str | None = None` and `_outage = False` (R-12). `run_once` first sets `self.market_view = self.market.resolve(PROTECTION_VIEW)`, once, before any subject, then `_market_outage()`.
* **The underlying (F-3).** `_Subject` gains `underlying: str | None = None`. `_desires` sets `sj.underlying = sj.entry.get("underlying")` beside `sj.instrument`, and `_evaluate_basket` does the same after `kernel/protection.py:453`, so the basket's trail (`:525`) and tick exit (`:466`) read through the entry's underlying too. `_trail` calls `self.market.closes(self.market_view, sj.instrument, since, underlying=sj.underlying)` and `_tick_exit` calls `self.market.latest_tick(self.market_view, sj.instrument, underlying=sj.underlying)`.
* **An unreadable store (F-8; Fork call, legacy sends nothing without bars, RFL `:5454-5455`; the spec's failure row).** While `market_view` is `None`:
  * `_trail` returns the desire unstepped and `_tick_exit` returns at once;
  * in `_stop_requests` and `_basket_leg`, `level_differs` is forced false, so no modify carries a new trigger. A placement of a missing stop at its recorded level, a quantity-only modify, a cancel, an exit and the square-off still go: protection is never gated, only a new level is held;
  * `_market_outage()` records `RECONCILIATION_ESCALATED(subject="market", reason="market_unreadable", episode=n)` once per outage, `n` the number of `market_unreadable` escalations already recorded, through `lifecycle.escalate` as `kernel:protection`. `_outage` is set; a pass that resolves a view clears it, so the next outage is a new episode. A restart during an outage records one more episode.
* **An unreadable close (F-4, Fork call).** `closes` returning `PriceUnreadable` makes `_trail` record `self._escalate(sj, "close_unreadable")` (once per position, `lifecycle.escalate`'s rule) and return the desire unstepped: no step, no gap, no new level, as legacy.
* **Square-off (F-1, Fork call).** `_square_off` takes the UTC offset from the static calendar whose `calendar_id` is the session row's (`CALENDARS`), and only for an id the code does not hold (the test calendars) from the calendar port as before. The store is never read for it, so an unreadable store cannot stop the square-off. Legacy used only the policy time and the IST wall clock (`src/runtime/session_close.py:92-118`, RFL `:3739-3751`).
* **Recorded on the events.** `record_desired(writer, position_id, desire, extra=(), *, market_view: str | None = None)` adds `"market_view": market_view` to the `PROTECTION_DESIRED` payload. `market_view` is **not** part of the "unchanged" comparison (`kernel/protection.py:88-94`): a desire is recorded when its own fields change, never because a new pass resolved a new view. `_record` passes `self.market_view`; `_gap_draft` adds `"market_view": self.market_view` to `GAP_PEAK_RECORDED`, whose `view_id` stays the bar view. An unreadable store gives `null`.
* **`gap_of(last, closes) -> Gap | None`**, `Gap(source, started, ended, unseen: tuple[int, ...])` frozen, legacy's `_trail_gap` (RFL `:5285-5313`):
  * with `last`: `new` the indices of closes with `ts > last`; none gives `None`. With `stamps = [last] + [closes[i].ts for i in new]`, `missing_minutes` when any consecutive pair is more than `TRAIL_GAP_SECS` apart as instants (strictly), else `multi_bar` when `len(new) > 1`, else `None`. `started = last`, `ended = closes[new[-1]].ts`, `unseen = new[:-1]`;
  * without: `rebuild` when `len(closes) > 2`, `started` the first close's `ts`, `ended` the last's, `unseen` all but the last; else `None`.
* **`day_high_jump(highs) -> str | None`**, the end of `_leg_day_high_jump`: `None` for none; else `highs[-1]` when `float(highs[-1]) > float(highs[0])`, else `None` (the last reading against the first, never the maximum).
* **`gap_peak(gap, closes, jump) -> tuple[str, int | None] | None`**, legacy's candidates (RFL `:5358-5367`): the unseen top (`max` by `Decimal(close)` over `unseen`, the earliest on a tie) as `(close, index)`; the jump as `(jump, None)` only when `Decimal(jump) > Decimal(top)`, so the unseen close wins a tie (legacy's `max` keeps the first candidate). Neither: `None`.
* **`would_be_sl(settings, pre, bars, peak: float, at: int | None) -> float`**, legacy's replay (RFL `:5374-5388`): with `at` an index, `trail.step` from `at` to the end over `bars[:i + 1]`. With `at` `None` (the day high, which has no close and no time, so it goes just before the newest bar): `series = bars[:-1]`, `prev = series[-1].close`, `series.append(trail.Bar(bars[-1].ts, prev, max(prev, peak), min(prev, peak), peak))`, one `trail.step` at `len(series) - 1`, then `series.append(bars[-1])` and one more. Returns the last accepted `sl`.
* **`_gap_draft`** reads `self.market.highs(self.market_view, sj.instrument, gap.started, gap.ended, underlying=sj.underlying)`: `PriceUnreadable` records nothing and escalates `gap_peak_failed` (the live step is kept; legacy's `except` noted it, RFL `:5492-5498`). Then `gap_peak(gap, closes, day_high_jump(highs))`; `None` records nothing (**Fork call, F-10:** legacy's own rule, RFL `:5365-5366`; this replaces SLICE-06's "one record per gap" for that case). Otherwise `recovered_peak` is the peak string and, when it exceeds the live peak (`Decimal`, as built), `would_be_stop = trail_level(would_be_sl(...), tick_size)`, with the existing failure rule. `_trail` passes `extra = (draft,)` only when there is one.
* **Deviation (R-11):** a candidate not above the live peak is still recorded, with `would_be_stop` null (SLICE-06 as built); legacy recorded nothing then (RFL `:5371-5372`). Record-only.
* **Fork call:** `missing_minutes`, the day high, its window and polls, its placement and the candidate order are legacy's. The whole record stays record-only (POL-013).

#### Events (`resources/events.schema.json`)

`PROTECTION_DESIRED` and `GAP_PEAK_RECORDED` each gain `"market_view": ["string", "null"]`. Payloads are validated on write only (`kernel/ledger/store.py:648`) and no fold reads the field (`kernel/ledger/projections.py:365-386`), so a ledger written before step 5 replays unchanged. No ledger migration.

#### The `gap` coverage status (`market/store.py`, `market/ingest.py`)

* **Schema 2.** `STORE_SCHEMA = 2`. `_COVERAGE_DDL` is the coverage table with `status TEXT NOT NULL CHECK (status IN ('covered', 'interrupted', 'gap'))`; a new store is created at schema 2.
* **The upgrade from schema 1**, in `MarketStore.open`, under the writer lock, when `_schema_of(conn) == 1`, in one `BEGIN IMMEDIATE` transaction (SQLite cannot alter a `CHECK`): create `coverage_v2` with `_COVERAGE_DDL`; `INSERT INTO coverage_v2 (seq, source, stream, instrument, status, scope_from, scope_to, first_seq, last_seq, detail) SELECT` the same columns `FROM coverage`; `DROP TABLE coverage`; `ALTER TABLE coverage_v2 RENAME TO coverage`; `UPDATE store_meta SET schema = 2`; `COMMIT`. Any exception rolls back, the lock is released and the exception re-raised: the file stays schema 1, whole. `store_id`, `head` and every row's `seq` are unchanged. Any other schema than `None`, 1 or 2 is `MKT-R02` as today.
* **The reader** accepts schema 2 only. A schema-1 file raises `StoreNotUpgraded`, a `ValueError` subclass with the `MKT-R02` text, until the writer has opened it once; `StoreMarket` reads that as unreadable (F-12: no startup refusal for schema 1). SLICE-11 opens the market writer, which upgrades, before the kernel starts; until then the kernel sees an unreadable store, which F-1 and F-8 make safe. A view resolved over schema 1 reopens as `Unavailable("store_schema")`, by design (step 3).
* **Who writes `gap`** (`MarketLoop._fetched`): a due fetch whose list is empty records one row `CoverageEntry(source_of(stream), stream, instrument, "gap", when, got_at, "empty")` and no record: legacy's journal `empty` outcome (`MP:334-338` for quotes, `MP:471-474` for a chain), which legacy's evidence reads as a stream with no rows (`src/data/marketdata/evidence.py:160-162`). A not-due skip stays `covered` `not_due`; a fetch with only skipped Greeks rows stays `covered` with its note; any failure stays `interrupted`. **Deviation (from the spec's "silent for more than its expected cadence"):** the cadence is the source's own `due`, so the fact is per due poll. A `gap` row counts as the minute's poll and gets a `process_stopped` row after it, as any status does (`market/ingest.py:163-176`).

#### Composition (`bootstrap.py`)

`compose_simulation` gains `view_policies: Mapping | None = None`; `Composition` gains `market: object = None`, which stays `None` for a fixture world (R-13).

* **Order.** The existing refusals run first (ledger path, capacity, revocation effect, every `_ADMISSION` setting, the budget), then the market checks, so every existing refusal keeps its order.
* **With `settings.market_store_path` set:** `calendar` must be `None` (else `ValueError("a market-store composition takes its calendar from the store")`), `view_policies` given (else `RefusingParameterUnbound("market.views")`), `admission.market` `None` (else `ValueError("admission ports name a market while settings name a market store")`), and with admission and `protection_loop`, `PROTECTION_VIEW` bound (else `RefusingParameterUnbound("market.views.protection")`). Inside the composition's `try`, before `Sessions`: `market = StoreMarket(settings.market_store_path, view_policies, clock)` (its `ValueError` re-raised as `SettingsError`), `calendar = market`, and `admission.market = market`. The `try`'s `except` closes `market` before the writer (R-14).
* **Without it:** unchanged; ports with `market=None` are `ValueError("admission ports name no market")`.
* **SLICE-11 binds** `market.store_path`, `market.views.protection` and the strategies' policies for the kernel host. The protection policy's join, age and staleness fields do not change protection's reads (it never calls `read`); its availability, calendar and window do.

#### The fixture port (`tests/conftest.py`)

`FixtureMarket` gains `resolve(policy) -> "fixture-view"` (the spec's fixed identity), `high_rows` (instrument to `[(utc_iso, high)]`) and `highs(view_id, instrument, frm, to, *, underlying=None)` over it, and `closes`, `latest_tick` and `reference_facts` take the new arguments and ignore them. Every other caller in the table above is unchanged; `scripts/measure_protection.py` reuses it.

#### Fork calls and Deviations in this step

* **Fork calls:** the premium closes (`ltp` only, last leg per poll, from the fill, one exchange date, `quotes_included` ignored); an unreadable `ltp` holding the position (F-4); the day high from every poll in the window, `ltp` or not (F-5), an unreadable `high` recording nothing; quote prices carried exactly (F-6); the tick size carried as received, as legacy's raw leg tick reached the planner; a passed expiry left out of `chains()` (F-7); no new level while the store is unreadable (F-8); square-off from the static calendar (F-1); the planner's Greeks from the GREEKS join at the chain's stamp, `multioptiongreeks` winning a tie, `lotsize` from `ce` then `pe`; `missing_minutes` strictly above 120 s, the day-high candidate and its synthetic bar before the newest; the unseen close winning a tie; no record for a gap with no candidate (F-10); the trading day from the exchange window, failing closed, retried every minute until stored (F-9).
* **Deviations:** the pass identity's underlying `*`; `underlying` on the protection reads; a candidate not above the live peak still recorded with `would_be_stop` null (R-11); a negative `dte` carried as `None` in `chain()`; an unreadable strike dropped; a non-finite price treated as unreadable; `ReferenceMissing("no_fact")` and `DayUnavailable` for an unreadable store; an unknown calendar id failing closed; the trading day from the recorded fact; `gap` per due poll; schema-1 views unavailable after the upgrade; the spec's `InstrumentClose.high` replaced by `highs`.

### Tests

`tests/integration/test_market_port.py` (**T-46**), over stores built with step 2's `MarketStore` under `tmp_path` and kernel worlds built with `conftest.build`. Every value is labelled synthetic; every expectation is written by hand from the rules above (A08-F3), except Gap parity's, generated once from legacy. Shared values: `RecordedClock`; 2026-11-02 (a Monday); `NIFTY`; the calendar id `NSE-FO`; a `protection` policy and a `live` policy, each `arrival`, `exclude`, `ticks`, every join `at_or_before`, `nse-fo/v1`, `WindowDef(60, "7")`, with `max_age_secs` unbounded and `report` for `protection`, 120 s and `drop` for `live`. A chain poll is one record `IncomingRecord("chain", u, "simulated", f"{expiry}@{utc(at)}", Timestamp(utc(at), "exchange"), Timestamp(utc(at + 300 ms), "recorded"), {"expiry": expiry, "exchange": "NFO", "response": {"status": "success", "data": rows}}, "simulated")`; Greeks records as step 4's loop keys them. An entry's view is resolved with step 3's `resolve(MarketReader.open(path), policies, "live" or "protection", "NIFTY", cutoff).id.text` (R-4).

**`store_world(tmp_path, start=START, *, store=True, protection_loop=False, planner=None, policy=OFF, plan=None, facts=(timing(),))`** (R-5): the market store is opened under `tmp_path` and given `facts` (by default a `trading_day` fact for `NFO`: `open` true, `start` and `end` the epoch milliseconds of 09:15:00 and 15:30:00 IST, available at 09:05 IST); `build(..., admission=dataclasses.replace(admission_ports(...), market=None), calendar=None, view_policies=…, admission_settings=dict(ADMISSION_SETTINGS or LOOP_SETTINGS, market_store_path=…), leases=FakeLeaseStore())` and `prepare`; with `store=False`, the fixture port and `FakeCalendar({("NSE-FO", TODAY): FakeCalendar.day(TODAY)})`; `StandingBinding` `b-1` on `SessionScope(ACCT, "NSE-FO")` (and the action grant for a protection world); `recovery.tick()`; no `fresh()`; the `RecordedClock` at 2026-11-02T04:30:00Z (10:00 IST). Requests name `FinancialSessionId(SessionScope(ACCT, "NSE-FO"), TODAY)`. A missing store is simulated by monkeypatching `MarketReader.open` to raise `apsw.CantOpenError` after closing the cached reader (`StoreMarket.close()`).

| Group | Cases |
|---|---|
| Composition | Refused: a `calendar` with a store; ports naming a market; `view_policies` missing (`market.views`); no `protection` policy with the loop (`market.views.protection`); ports with `market=None` and no store. A store world: `comp.market` is the `StoreMarket` and is admission's market, the sessions' calendar and protection's market and calendar; the session opened with `calendar_version` `nse-fo/v1`, 03:45Z to 10:00Z. A fixture world has `comp.market` `None` |
| Schemas at composition (F-2, F-12) | A schema-3 store: `StoreMarket` raises `MKT-R02` and `build` raises `SettingsError`. A schema-1 store composes, `resolve` is `None` and `trading_day` `DayUnavailable`, until the writer opens it; then `resolve` answers. A missing file composes; `resolve` `None`, `closes` `()`, `reference_facts` `no_fact` |
| Calendar port | `today` at 2026-11-01T18:29:59.999999Z (2026-11-01) and 18:30:00Z (2026-11-02); an unknown id the UTC date. `trading_day` at 09:10: no fact, then a fact available at 09:20, both `DayUnavailable`; at 09:20 `TradingDay("2026-11-02T03:45:00.000000Z", "2026-11-02T10:00:00.000000Z", "nse-fo/v1", utc_offset_minutes=330)`; a second revision ending 13:30 IST read over the first (close 08:00Z); `open` false on 2026-11-03 `Holiday`; `start` `"x"` on 2026-11-04 `DayUnavailable`; an unknown id `DayUnavailable`; `trading_day_recorded` true for `nfo` on the date and false on 2026-11-05 |
| Sessions (F-9) | A store world without the fact records `calendar_unavailable` once over two ticks and opens nothing; once the fact is recorded, the next tick opens `sim:acct-sim:NSE-FO:2026-11-02` |
| Views | A spot poll (`ltp` 24000.0) and a chain poll for `04NOV26` and `11NOV26` at 10:42:00.2 IST carrying `make_chain`'s three strikes, prices, sizes and lot, with inline Greeks (delta 0.5, 0.4, 0.3; gamma 0.001), read through a `live` view at 10:42:07: `view()` is `StableView(text, "NIFTY", "NSE-FO", 05:11:00Z, 05:12:00Z, 05:12:00.200000Z, 05:12:00.200000Z, spot="24000.0")`; `chain()` the `04NOV26` snapshot, `dte` 2, its first row `ChainRow("24000.0", 75, None, OptionQuote("NIFTY04NOV2624000CE", "20.0", "19.95", "20.05", "1000.0", "500.0", "0.5", "0.001", None), None)`; `chains()` `04NOV26` (2) and `11NOV26` (9) |
| Tick size | A leg `tick_size` 0.025 is `"0.025"` and `tick_size_of(legacy_rows(chain)[0], "CE")` is 0.025 |
| Mapping | `ltp` 20.125 kept as `"20.125"` (F-6); leg `tick_size` 0.05 as `"0.05"`; `lotsize` `"75"` as 75; `ce` 75 with `pe` 50 gives 75; `ce` without a symbol gives `None` and the row's lot comes from `pe`; strike `"x"` dropped; an inline leg `delta` 0.9 ignored for the Greeks record; `multioptiongreeks` 0.52 beating inline 0.5 at one instant; no Greeks record gives `None`; a `01NOV26` record (passed) left out of `chains()` (F-7) |
| Entry reads that answer `None` | `"v-1"`; a `*` identity (`view` `None`, `chains` `()`); a `live` view whose spot and chain are 121.1 s old; a re-bound policy (`policy_changed`); a missing store (`view`, `chain` `None`, `chains` `()`) |
| Reference | A `lot_size` fact 75 for `NIFTY`: `ReferenceFacts("NIFTY", "2026-11-02", 75)` at 10:00; at 09:00 `not_yet_available`; on 2026-11-01 `not_in_force` (POL-046); `BANKNIFTY` `no_fact`; after a revision 65 (available 09:06) the reader's head gives 65 and a view resolved before it gives 75 (F-11) |
| Chain evidence | `chain_context` of `{underlying_ltp: 24010.5, atm_strike: 24000, quotes_included: false, nested: {…}, server_ts: null}` is `{spot: 24010.5, atm: 24000, quotes_included: false}`; `quote_support` the 11 fields `False`, and `None` for `true` or absent; a non-dict `{}`; `chain_evidence` of the Views store two records, `04NOV26` first, context `{}` and support `None` |
| Admission over the store (PRF-MKT-07) | The Views store; `bound(…, planner=planner_policy())` with `Planner()` and the scores `(signal_score 60.0, iv_rank None, conviction 0.7)`; the intent names the 10:42:07 `live` view's text and is admitted at 10:42:07.4 (spot and chain 7.2 s old, the bar 7.4 s): admitted, `amount` and `worst_case_loss` `"1500.00"`, entry premium `"20.00"`, instrument `NIFTY04NOV2624000CE`. A fixture world fed the store world's own `view`, `chain`, `chains` and `reference_facts` answers records the same `plan` and `measured_ages` |
| Closes, highs and the tick | Polls for `NIFTY-SIM-CE` at 10:00 (`ltp` 19.0), 10:01 (20.0, `high` 21.0), 10:02 (21.5, no `high`), 10:03 (two records, 22.0 then 23.0 with `high` 22.0 and 24.5, and inline 0.5 and `multioptiongreeks` 0.52 Greeks), 10:04 (no `ltp`, `high` 25.0); a 2026-10-30 poll and one arriving at 10:06:30; a `PE` leg and another strike as noise. Since 10:00:30 at a 10:06 view: closes 10:01 `"20.0"`, 10:02 `"21.5"`, 10:03 `"23.0"`; `highs` 10:01–10:04 `("21.0", "22.0", "24.5", "25.0")`; `latest_tick` `None` (10:04's leg has no `ltp`). At a 10:03:30 view: `Tick("NIFTY-SIM-CE", "23.00", "0.52", 10:03)`. `None` view, `None` underlying and `BANKNIFTY` give `()` |
| Unreadable prices | `ltp` 20.125: `latest_tick` `None`; `high` `"x"`: `highs` `PriceUnreadable(…, "high", 10:01)`; `ltp` `"bad"` at 10:02: `closes` `PriceUnreadable(…, "ltp", 10:02)`, and `()` from a `since` after it |
| Protection over the store (PRF-MKT-07) | `protected_world` (a `stop_on_fill` entry filled at 75, its stop resting at 15.00) over the store and over the fixture port, each fed closes 20.0, 22.0, 25.0, 24.0 a pass apart: identical `PROTECTION_DESIRED` payloads but `market_view` and the entry view's name; the fixture world's `market_view` is `"fixture-view"`, the store world's an `mv1` text naming `*` |
| One view per pass | Spies on `resolve` and `run_once` count equal calls; the last desire's `market_view` text, reopened after two more passes and three later commits (one seen by its cutoff but committed after its head), gives the same closes; two passes with no new close record no desire |
| Unreadable store (F-1, F-8) | A desire recorded at 16.00 over a stop confirmed at 15.00; with `MarketReader.open` raising: three passes send no modify and record `("market", "market_unreadable", 0)` once; readable again, the modify `prot:…:stop:2` goes; unreadable again, episode 1; at 15:13 IST the square-off still starts (`EXIT_STARTED` `square_off`) |
| Unreadable close (F-4) | A poll with `ltp` `"bad"` after the fill: two later closes record no desire and `close_unreadable` once |
| Basket (F-3) | In `tests/unit/test_protection_basket.py`: a basket subject's `closes` and `latest_tick` are called with the view `"fixture-view"` and underlying `NIFTY`, and the basket stop still trails |
| Gap sources (R-7) | `gap_of` with the last seen close at 10:01: one close at 10:04 is `missing_minutes` with no unseen close; one at 10:03 (exactly 120 s) is no gap; closes at 10:02 and 10:03 are `multi_bar` with unseen `(2,)`; a hole and two closes is `missing_minutes`; without a seen close, four closes are `rebuild` with unseen `(0, 1, 2)`, two are none. `day_high_jump`: `("22.0", "26.5")` gives `"26.5"`, `("22.0", "22.0")` and `()` none, `("22.0", "27.0", "25.0")` gives `"25.0"` (R-10). `gap_peak` over unseen 25.0: jump `"27.0"` wins, `"25.0"` ties to the unseen close, none gives the close; no candidate gives `None`. By hand, the ladder seeded at 20.0 (stop 15.0, target 30.0) and stepped on closes 20.0, 22.0 at 10:00 and 10:01: a day-high gap (10:04 close 21.0, highs 22.0 then 26.5) has peak `"26.5"`, live peak `"22.0"` and would-be stop `"24.50"`; an unseen-close gap (closes 25.0 and 24.0 at 10:02 and 10:03) has peak `"25.0"` at index 2, live peak `"24.0"` and would-be stop `"23.00"`. In the loop over the fixture port, a close 180 s after the last seen one with highs 22.0 then 26.5 records one gap with `recovered_peak` `"26.5"` and `market_view` `"fixture-view"`; the next such hole with no candidate records nothing |
| Gap parity | Each of the 40 cases of `gap_golden.json` in `tests/fixtures/market` (R-9): each snapshot one chain record with expiry `02NOV26` and `arrival_at` `event_at` + 300 ms, read through the `protection` view at the last stamp + 60 s. Compared: the closes' `ts` and `close` with legacy's bars, and `bars_from_closes` with them (`open`, `high`, `low`, `close` as `repr`); `gap_of`'s source, `gap_from`, `gap_to` and unseen stamps; `day_high_jump` with legacy's jump; `gap_peak`'s existence with legacy's candidate; the live peak; when legacy recorded, the peak, its source (`leg_day_high` or `unseen_close`) and `repr(would_be_sl(...))` against its shadow `sl`; a candidate that legacy did not record is not above the live peak |
| Coverage | A loop whose spot fetch returns `[]` writes `gap` `empty` with null `first_seq` and `last_seq`; `StoreMarket.coverage(view, "NIFTY")` lists it and the chain's `covered` row, not a row on another date or committed after the view's head; `CoverageEntry` refuses `stale` |

**The gap golden file.** `scripts/gen_fold_parity.py` (T-42) gains `--gaps`, which writes only `gap_golden.json` in `tests/fixtures/market` (R-8). It is run once, never in the suite:

```
python -I scripts/gen_fold_parity.py --gaps --legacy <root holding src/> --rfl <path to run_framework_live.py> --out tests/fixtures/market/gap_golden.json
```

* **Loading legacy:** `trail.py` by file path, as `scripts/gen_trail_parity.py`, registered as `src.core.framework.protection.trail`. `src`, `src.core`, `src.core.framework`, `src.core.framework.protection`, `src.data`, `src.data.marketdata` and `src.data.marketdata.store` are installed as empty modules linked to their parents, so the real legacy package never imports; the store stub's `snapshots(root, underlying, day)` yields the current case's polls. RFL's `_stamp_secs`, `_premium_bars`, `_trail_gap`, `_leg_day_high_jump` and `_record_trail_gap` are taken by `ast` and executed in one namespace holding `datetime`, `Any`, `_TRAIL_SEEN = {}`, `_TRAIL_SHADOW = {}`, `_TRAIL_GAP_SECS = 120.0` and `STORE = "case"`.
* **Cases:** 40, `random.Random(1000 + seed)` for seeds 0–39, on 2026-11-02. Each has 6–14 polls from 10:00:00 IST, each 60 s after the last or, with probability 0.2, 120–240 s; stamps `datetime(…, tzinfo=IST).isoformat()`. One row, strike 24000: the CE leg `NIFTY02NOV2624000CE` with `ltp` a walk from 100.0 rounded to 0.05 (absent with probability 0.1 after the first poll, F-5) and `high` the running maximum of `ltp`, shown raised by 0.5–5.0 (rounded to 0.05) with probability 0.3 for that poll only, and absent with probability 0.1; a PE leg as noise. `since` is the first stamp. A rebuild when `seed % 5 == 0` (no seen stamp); otherwise the seen bar index is `1 + int(pick × (len(bars) − 2))`, `pick` the case's next random draw, and the ladder is stepped at each `k` from 1 to it over `bars[:k + 1]`.
* **The ladder:** `TrailSettings()`; `TrailPosition(entry_premium=e, tgt=e + 30.0, sl=e − 10.0, slot_id="case", entry_conviction=0.0, initial_sl=e − 10.0, remaining_qty=75)`, `e` the first bar's close; `managed = SimpleNamespace(engine=PremiumTrail(settings), position=pos)`, so `engine.cycle` is legacy's `on_bar` without its emitter (`src/core/framework/runtime/orchestrator.py:933-958`). Each live cycle is a fresh `PremiumTrail`, as the target's `trail.step`.
* **The pass:** `bars = _premium_bars("NIFTY", day, symbol, since=since)`; `gap = _trail_gap("case", bars, rebuilt=…)`; `pre = deepcopy(managed)` when there is a gap; the live cycle at `len(bars) − 1`; `jump = _leg_day_high_jump(...)` over the gap; `_record_trail_gap("case", managed, pre, gap, bars, symbol=…, underlying="NIFTY", day=…, emit=…, quiet=True)`, the emitter keeping its keyword arguments.
* **Output:** `{"generator", "legacy_commit": "445eb116", "python", "counts", "cases"}`; each case holds its seed, day, symbol, snapshots, `since`, `rebuilt`, `seed_position`, `seen`, `bars` (`[ts, open, high, low, close]`, floats as `repr`), `gap` (`{source, from, to, unseen}` or null), `jump`, `candidate`, `live_peak` and `recorded` (null or `{recovered_peak, recovery_source, shadow_sl}`, `shadow_sl` `repr(_TRAIL_SHADOW["case"].position.sl)`).
* **The generator asserts** at least 3 cases each of `missing_minutes`, `multi_bar`, `rebuild`, a recorded `leg_day_high`, a recorded `unseen_close`, and a gap whose window holds a poll without `ltp`; it exits otherwise.

**Changed existing tests:**

* `tests/unit/test_market_ingest.py` (T-43): "another schema is refused" sets schema 3; `:500` becomes `("spot", "gap", "empty", …)`; `:522` becomes `("simulated", "spot", "gap", "empty"), ("simulated", "chain", "gap", "empty")`; `:539` becomes `("simulated", "spot", "gap", "empty")` (R-6). New: a schema-1 file (step 2's coverage DDL, held in the test, with three rows) is upgraded by the writer to schema 2 with the same `store_id`, `head` 3 and rows, after which a `gap` row commits, the reader refusing it before and opening it after; a schema-1 file holding a table named `coverage_v2` fails the upgrade with `apsw.SQLError` and stays schema 1 with its rows; a loop opened in a minute whose polls wrote `gap` rows does not poll again.
* `tests/unit/test_market_view.py` (T-44): the `store_schema` unavailable case uses 3.
* `tests/unit/test_protection_states.py`: the literal `GAP_PEAK_RECORDED` and `PROTECTION_DESIRED` payloads gain `"market_view": None`, so each refusal still tests its own defect.
* `tests/unit/test_protection_basket.py`: the basket test above (F-3).

### Break checks

Each is applied with its anchor checked first (exactly one occurrence), one at a time, run against `test_market_port.py`, `test_market_ingest.py` and `test_protection_basket.py`, and restored byte for byte with an md5 check (R-10). `P` is `kernel/protection.py`, `V` `market/view.py`, `ST` `market/store.py`, `I` `market/ingest.py`; `⏎` is a line break.

| Change (file: exact text → replacement) | Test that must fail |
|---|---|
| Fork: closes keep the first leg. V: `if symbol != instrument or ltp is None:⏎ continue⏎ close = _float(ltp)` → the same with `if close is not None:⏎ continue` before `close = _float(ltp)` | Closes, highs and the tick |
| Fork: closes ignore `since`. V: `if at < start:` → `if False:` | Closes, highs and the tick |
| Fork: the tick from an older poll with a price. V: `at, legs = polls[-1]` → `at, legs = next(((a, l) for a, l in reversed(polls) if any(x[0] == instrument and x[3] is not None for x in l)), polls[-1])` | Closes, highs and the tick |
| Fork: Greeks tie to the lower `seq`. V: `(instant(m.record.event_at), m.seq)) if found else None` → `(instant(m.record.event_at), -m.seq)) if found else None` | Mapping; Closes, highs and the tick |
| Fork: a quote's delta from the leg. V: `_dec(_num(leg.get("volume"))), _dec(_num(greeks.get("delta"))),` → `… _dec(_num(leg.get("delta"))),` | Views; Mapping |
| Fork: `lotsize` from `pe` first. V: `_lot(ce.get("lotsize") or pe.get("lotsize"))` → `_lot(pe.get("lotsize") or ce.get("lotsize"))` | Mapping |
| F-6: a quote price rounded. V: `OptionQuote(symbol, _dec(_num(leg.get("ltp"))),` → `OptionQuote(symbol, _money_text(_num(leg.get("ltp"))),` | Views; Mapping |
| Fork: a tick size rounded. V: `_dec(_num(greeks.get("gamma"))), _dec(_num(leg.get("tick_size"))))` → `… _money_text(_num(leg.get("tick_size"))))` | Tick size |
| F-7: a passed expiry as `None`. V: `if dte is not None and dte < 0:⏎ continue` → `… dte = None` | Mapping |
| Fork: `missing_minutes` at 120 s. P: `> TRAIL_GAP_SECS:` → `>= TRAIL_GAP_SECS:` | Gap sources |
| Fork: the day high as the maximum. P: `return highs[-1] if float(highs[-1]) > float(highs[0]) else None` → `return max(highs, key=float) if float(max(highs, key=float)) > float(highs[0]) else None` | Gap sources |
| F-5: only polls with an `ltp`. V: `if symbol != instrument or high is None:` → `… or _ltp is None:` | Closes, highs and the tick; Gap parity |
| Fork: the day-high bar after the newest. P: `series = list(bars[:-1])` → `series = list(bars)` | Gap sources; Gap parity |
| Fork: the jump wins a tie. P: `Decimal(jump) > Decimal(closes[top].close)` → `Decimal(jump) >= …` | Gap sources |
| F-10: no candidate recorded anyway. P: `if found is None:⏎ return None, False` → `if found is None:⏎ found = (closes[-1].close, len(closes) - 1)` | Gap sources (the loop) |
| Fork: `Holiday` with no fact. V: `if not facts:⏎ return DayUnavailable()` → `… return Holiday()` | Calendar port; Sessions |
| `trading_day` ignores `available_at`. V: `and reference_instant(f.available_at) <= now]` → `]` | Calendar port |
| A tick price rounded. V: `price = _money_text(_float(ltp)) if ltp is not None else None` → `price = _money_text(round(_float(ltp), 2)) if ltp is not None else None` | Unreadable prices |
| F-1: the offset from the store. P: `offset = static.utc_offset_minutes if static is not None else None` → `offset = None` | Unreadable store |
| F-2: only `apsw.Error` caught. V: `_UNREADABLE = (OSError, UnsafeRuntime, apsw.Error)` → `_UNREADABLE = (apsw.Error,)` | Schemas at composition |
| F-2: `MKT-R02` not refused. V: `except (StoreNotUpgraded, *_UNREADABLE):` → `except (ValueError, *_UNREADABLE):` | Schemas at composition |
| F-3: no underlying for a basket. P: `sj.underlying = entry.get("underlying")` (with its comment) → removed | Basket |
| F-4: an unreadable `ltp` skipped. V: `if close is None:⏎ return PriceUnreadable(` → `if close is None:⏎ continue⏎ return PriceUnreadable(` | Unreadable prices; Unreadable close |
| F-4: an unreadable `high` skipped. V: `if value is None:⏎ return PriceUnreadable(` → `if value is None:⏎ continue⏎ return PriceUnreadable(` | Unreadable prices |
| F-8: a new level while unreadable. P: the two lines `if self.market_view is None:⏎ level_differs = False …` in `_stop_requests` → removed | Unreadable store |
| F-8: escalated every pass. P: `if self._outage:⏎ return` → removed | Unreadable store |
| F-11: reference at the reader's head. V: `through=v.id.head if v is not None else None)` → `through=None)` | Reference |
| `resolve` per subject. P: before `closes = self.market.closes(self.market_view, sj.instrument, since,` insert `self.market_view = self.market.resolve(PROTECTION_VIEW)` | One view per pass |
| Closes at the store's head. V: `heads = v.heads("chain", underlying)` → `heads = View(reader, v.policy, dataclasses.replace(v.id, head=reader.head())).heads("chain", underlying)` | One view per pass |
| `market_view` compared. P: `and row["view_id"] == desire.view_id:` → `… and market_view is None:` | One view per pass |
| `bar_close` equal to `bar_open`. V: `Timestamp(utc(anchor + timedelta(seconds=BASE_INTERVAL_SECS)), "exchange"),` → `Timestamp(utc(anchor), "exchange"),` | Views |
| An empty fetch written `covered`. I: `"gap", when, got_at, "empty")]` → `"covered", when, got_at, None)]` | Coverage; `test_market_ingest.py` |
| A not-due skip written `gap`. I: `"covered", when, when, "not_due")` → `"gap", when, when, "not_due")` | `test_market_ingest.py` (not due) |
| The upgrade loses the rows. ST: `"DROP TABLE coverage",` → `"DELETE FROM coverage_v2", "DROP TABLE coverage",` | `test_market_ingest.py` (upgrade) |
| Schema 1 not upgraded. ST: `elif schema == 1:` → `elif False:` | `test_market_ingest.py` (upgrade); Schemas at composition |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/market/view.py` | `StoreMarket`, `ChainEvidence`, `View.heads`; the snapshot mapping and its number rules |
| `src/autonomous_trading/market/sources.py` | `CHAIN_CONTEXT`, `CHAIN_QUOTE_FIELDS`, `chain_context`, `quote_support` |
| `src/autonomous_trading/market/store.py` | `STORE_SCHEMA = 2`, `_COVERAGE_DDL`, the upgrade from 1, `StoreNotUpgraded` |
| `src/autonomous_trading/market/ingest.py` | The `gap` row for an empty due fetch; `trading_day_recorded` |
| `src/autonomous_trading/contracts/market.py` | `TradingDay`, `Holiday`, `DayUnavailable` moved in; `PriceUnreadable`; `COVERAGE_STATUSES`; `OptionQuote` prices and tick size as decimal strings |
| `src/autonomous_trading/kernel/ports.py` | The three records imported, `Unavailable` bound; `MarketPort.resolve`, `highs` and the reads' signatures |
| `src/autonomous_trading/kernel/protection.py` | `PROTECTION_VIEW`, `TRAIL_GAP_SECS`, `Gap`, `gap_of`, `day_high_jump`, `gap_peak`, `would_be_sl`; one view per pass; the outage; the underlying; the square-off offset; `market_view` on both events |
| `src/autonomous_trading/kernel/admission.py` | `reference_facts(..., view_id=intent.view_id)` |
| `src/autonomous_trading/resources/events.schema.json` | `market_view` on `PROTECTION_DESIRED` and `GAP_PEAK_RECORDED` |
| `src/autonomous_trading/bootstrap.py` | `view_policies`, the store composition, `Composition.market` |
| `tests/conftest.py` | `FixtureMarket.resolve`, `highs`, `high_rows` and the new arguments |
| `tests/integration/test_market_port.py` | New (T-46) |
| `tests/unit/test_market_ingest.py`, `tests/unit/test_market_view.py`, `tests/unit/test_protection_states.py`, `tests/unit/test_protection_basket.py` | The changes above |
| `scripts/gen_fold_parity.py`, `tests/fixtures/market` | `--gaps`; `gap_golden.json`, generated once |

No new tree delta: the golden file sits in T-41's directory, as step 4's captures sit in T-31's, and its generator is T-42's. No ledger migration; the market store's schema goes from 1 to 2.

### Completion conditions (step 5)

* Every test above passes, twice in a row, with the whole suite; every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on every edited Python file.
* `gap_golden.json` is generated once from the legacy export at 445eb116 and committed.
* PRF-MKT-07's clauses each pass a group: the store against the fixture (Admission over the store, Protection over the store), one identity per pass (One view per pass), the calendar port (Calendar port, Sessions), the gap sources and the day high on legacy's cases (Gap sources, Gap parity), the tick source (Closes, highs and the tick), reference facts and POL-046's unavailable date (Reference).

### Step 5 as built

**In plain words.** The kernel now reads the real price store. Entry checks and the protection loop read it the same way they read the test fixtures, and give the same answers for the same prices. Every protection decision names the one snapshot it used. A price that cannot be read, or a store that cannot be opened, holds stop moves and is reported once, while the square-off still runs. On 40 cases generated from today's system, the missed-peak record matches it exactly. All 1,244 automatic checks pass, twice in a row.

Commits `7ebee6c` and `4ecc799` on `slice-08`, on top of `c2cca11`. `4ecc799` carries the tick size as received (Fork call, the owner's coordinator's call on the fork rule): `OptionQuote.tick_size` is a finite decimal string and the snapshot passes the raw value; one test and one break check added, both run (the touched files: 188 passed; the break check failed `test_a_tick_size_reaches_the_planner_as_received`); the full suite after it is the coordinator's run. `7ebee6c` It changes 18 paths (12,504 lines added, 89 removed; the gap golden file is 10,645 of them). The files match the step's table. Not pushed.

**Choices made while building:**

| Topic | As built |
|---|---|
| A third empty-fetch test | `test_a_stream_not_due_is_a_covered_not_due_row_and_no_fetch` (`test_market_ingest.py:500`) also polls an unscripted spot stream, so its row became `("spot", "gap", "empty", …)` too, beside R-6's `:522` and `:539` |
| Refusal order | The first build checked the market store before the existing refusing settings, and 23 cases of `test_policy_parameters.py` (ports with `market=None` and a setting unbound) failed with "no market". The market checks now run after them, so every existing refusal keeps its order |
| Schema 1 against an unknown schema | `MarketReader.open` raises `StoreNotUpgraded`, a `ValueError` subclass with the `MKT-R02` text, for schema 1, so `StoreMarket` can read schema 1 as unreadable (F-12) and still refuse any other schema (F-2) |
| `View.heads` | A public form of step 3's `_latest`, so `StoreMarket` chooses polls without payloads and loads only uncached sequences |
| Test worlds | `protected_world` repeats `test_protection_loop.py`'s entry flow (the entry, the fill, the stop at 15.00): pytest's import mode does not let one test directory import another's module |
| The unreadable close test | Its bad poll needs an instant of its own: at another poll's instant it shares the chain key, and the store keeps the later one as a conflicted revision that replaces it in the view |
| One survivor, then caught | "`market_view` in the unchanged comparison" survived the first run, because the loop never re-records an identical desire. One view per pass now also checks `record_desired` directly (an identical desire with another `market_view` is `unchanged`); the mutation then failed it |
| The golden file | Generated with Python 3.14.0 from the legacy export `legacy445` (`src/` only) and its RFL copy: 40 cases; `missing_minutes` 23, `multi_bar` 6, `rebuild` 8, recorded `leg_day_high` 6, recorded `unseen_close` 18, a window holding a poll without `ltp` 15 |
| Store against fixture | The first desire's `view_id` is the entry's own view (an `mv1` text over the store, `v-1` over the fixture); the comparison names it alike and compares every other field exactly |

**Tests:** `tests/integration/test_market_port.py`, 64 cases (40 of them Gap parity). `tests/unit/test_market_ingest.py` gains 2 (36), and `tests/unit/test_protection_basket.py` gains 1. The existing tests named above changed as stated. The whole suite: 1,244 passed, 1 skipped (`test_pe_delta_sign_at_the_source`, waiting for C-1), twice in a row (125.7 s and 116.8 s), after the last edit. `ast.parse` passes on all 16 edited Python files.

**Break checks** (`s08e_breaks.py`: anchors checked first, one at a time, every file restored byte for byte, md5 verified): all 34 failed a test, 33 on the first run and the 34th after the check above.

| Change | Test that failed |
|---|---|
| Fork: closes keep the first leg | Closes, highs and the tick |
| Fork: closes ignore `since` | Closes, highs and the tick; Unreadable prices; Protection over the store |
| Fork: the tick from an older poll with a price | Closes, highs and the tick |
| Fork: Greeks tie to the lower `seq` | Mapping; Closes, highs and the tick |
| Fork: a quote's delta from the leg | Views; Mapping |
| Fork: `lotsize` from `pe` first | Mapping |
| F-6: a quote price rounded | Views; Mapping |
| F-7: a passed expiry as `None` | Mapping |
| Fork: a tick size rounded (`4ecc799`) | Tick size |
| Fork: `missing_minutes` at 120 s | Gap sources; Gap parity (1 case) |
| Fork: the day high as the maximum | Gap sources; Gap parity (20 cases) |
| F-5: only polls with an `ltp` | Closes, highs and the tick; Gap parity (2 cases) |
| Fork: the day-high bar after the newest | Gap sources (the day-high would-be stop) |
| Fork: the jump wins a tie | Gap sources; Gap parity (13 cases) |
| F-10: no candidate recorded anyway | Gap sources (the loop) |
| Fork: `Holiday` with no fact | Calendar port; Sessions |
| `trading_day` ignores `available_at` | Calendar port |
| A tick price rounded | Unreadable prices |
| F-1: the offset from the store | Unreadable store |
| F-2: only `apsw.Error` caught | Schemas at composition |
| F-2: `MKT-R02` not refused | Schemas at composition |
| F-3: no underlying for a basket | Basket |
| F-4: an unreadable `ltp` skipped | Unreadable prices; Unreadable close |
| F-4: an unreadable `high` skipped | Unreadable prices |
| F-8: a new level while unreadable | Unreadable store |
| F-8: escalated every pass | Unreadable store |
| F-11: reference at the reader's head | Reference |
| `resolve` per subject | One view per pass |
| Closes at the store's head | One view per pass |
| `market_view` compared | One view per pass |
| `bar_close` equal to `bar_open` | Views; Protection over the store; One view per pass; Unreadable store |
| An empty fetch written `covered` | Coverage; `test_market_ingest.py` (4 tests) |
| A not-due skip written `gap` | `test_market_ingest.py` (not due) |
| The upgrade loses the rows | `test_market_ingest.py` (upgrade) |
| Schema 1 not upgraded | Schemas at composition; `test_market_ingest.py` (upgrade) |

**Open:** none in this step. C-1 stays open from step 4. SLICE-11 binds `market.store_path`, `market.views.protection`, the recorder's every-minute schedule until the day's timing is stored, and the writer's start before the kernel's.

## Step 6 — Canvas (outline)

Deepened after step 5 is built: the spec's [Canvas](../../design/market-data-and-canvas.md#canvas-marketcanvas) section, with confirmed swings as the only algorithm, `resources/canvas.schema.json`, and the import guard.

## Completion conditions

* Every step's completion conditions hold.
* PRF-MKT-01…09 pass; PRF-ADM-07 is carried to recorded sessions (Excluded).
* The market-data spec and this file record each step "as built", with any Deviation.
