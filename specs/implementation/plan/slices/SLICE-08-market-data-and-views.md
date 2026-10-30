# SLICE-08 — Market data and views

* **Status:** proposed (2026-10-29); reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-08-review-2026-10-29)), whose findings are resolved in this text. Step 1 is deepened below and not yet built. Steps 2–6 are deepened in turn, each after the step before it is built, as in SLICE-04, SLICE-05, SLICE-06 and SLICE-07 (the delivery plan's depth rule).
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

* **SLICE-09:** strategies' input requirements and what they do with an unmet one; the decision pass's wait for a window's seal and its bound; the `exact_minute` join's consumer (BuyerEdge's scoring).
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

## Step 2 — store, ingestion and publication (outline)

Deepened after step 1 is built. The store's tables (with `store_id` and the schema version), the merge table, coverage, the seal writer, the poll loop over a recorded clock and the simulated source, the reference facts store and the recorder's fact list are as the spec's [Store and publication](../../design/market-data-and-canvas.md#store-and-publication-marketstorepy) and [Ingestion and merge](../../design/market-data-and-canvas.md#ingestion-and-merge-marketingestpy) sections. The crash points are CP-M1…CP-M3, proved by killing a real process (`tests/recovery/test_crash_boundaries.py`). Test file: `tests/unit/test_market_ingest.py` (tree delta **T-43**).

## Step 3 — views and quality (outline)

Deepened after step 2 is built: the spec's [Stable views](../../design/market-data-and-canvas.md#stable-views-marketviewpy) and [Quality](../../design/market-data-and-canvas.md#quality-marketqualitypy). Test files: `tests/unit/test_market_view.py` (**T-44**), `tests/unit/test_market_quality.py` (**T-45**).

## Step 4 — the OpenAlgo market source (outline)

Deepened after step 3 is built. First, two characterizations against legacy at 445eb116: which Greeks the legacy planner's chain rows carry (the chain's inline Greeks or `multioptiongreeks`, through `src/data/marketdata/scans.py`'s join), and the sign of PE deltas in the captured chains (SLICE-04 step 3's carried check). The source is proved on the captured responses in the legacy repository (`tests/fixtures/legacy-buyer-edge/openalgo/`: `quotes_*`, `expiry_dates_*`, `option_chain_*`, `history_*`, from 2–4 August and 4 October 2026), copied byte for byte into `tests/fixtures/openalgo` (T-31) with their provenance. **Deviation:** no `multioptiongreeks` response and no websocket tick is captured there. Those two are proved on synthetic responses shaped from legacy's parsers, and their capture is carried to TASK-S07-05's authorization.

## Step 5 — the kernel's port (outline)

Deepened after step 4 is built: the spec's [kernel port](../../design/market-data-and-canvas.md#the-kernels-market-port-marketviewpy). It replaces the fixture port in `bootstrap` for compositions that name a market store, and keeps it for those that do not. The kernel change: `MarketPort.resolve`, a `view_id` argument on `closes` and `latest_tick`, and `market_view` on `PROTECTION_DESIRED` and `GAP_PEAK_RECORDED`. The carried SLICE-06 gap sources land here, the day high with parity cases generated from legacy. The tick source is the chain poll (Q-031 A). Test file: `tests/integration/test_market_port.py` (**T-46**).

## Step 6 — Canvas (outline)

Deepened after step 5 is built: the spec's [Canvas](../../design/market-data-and-canvas.md#canvas-marketcanvas) section, with confirmed swings as the only algorithm, `resources/canvas.schema.json`, and the import guard.

## Completion conditions

* Every step's completion conditions hold.
* PRF-MKT-01…09 pass; PRF-ADM-07 is carried to recorded sessions (Excluded).
* The market-data spec and this file record each step "as built", with any Deviation.
