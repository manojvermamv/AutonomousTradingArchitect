# SLICE-08 — Market data and views

* **Status:** proposed (2026-10-29); reviewed by fresh EGM design and implementation-readiness reviewers ([review](../../egm/plan/review.md#slice-08-review-2026-10-29)), whose findings are resolved in this text. Step 1 is built (OA_NEW `484a1ec` on `slice-08`; [Step 1 as built](#step-1-as-built)). Step 2 is built (OA_NEW `42879dd`; [Step 2 as built](#step-2-as-built)). Steps 2–6 are deepened in turn, each after the step before it is built, as in SLICE-04, SLICE-05, SLICE-06 and SLICE-07 (the delivery plan's depth rule).
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
