# Market data and Canvas

* **Status:** proposed (package spec), deepened when SLICE-08 started (2026-10-29) from the stub this file was; reviewed with the [SLICE-08 slice file](../plan/slices/SLICE-08-market-data-and-views.md). Implements accepted master decisions; adds no new ones. Depth follows slices (`README.md:1133`; owner choice recorded in [00-provenance](../00-provenance.md)).
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `contracts/market.py` | [Records and identity](#records-and-identity-contractsmarketpy), [Calendar and windows](#calendar-and-windows-contractsmarketpy) |
  | `market/sources.py`, `market/providers.py` | [Sources and providers](#sources-and-providers-marketsourcespy-marketproviderspy) |
  | `market/store.py` | [Store and publication](#store-and-publication-marketstorepy) |
  | `market/ingest.py` | [Ingestion and merge](#ingestion-and-merge-marketingestpy) |
  | `market/view.py` | [Bars and finality](#bars-and-finality-marketviewpy), [Stable views](#stable-views-marketviewpy), [The kernel's market port](#the-kernels-market-port-marketviewpy) |
  | `market/quality.py` | [Quality](#quality-marketqualitypy) |
  | `market/canvas/*`, `resources/canvas.schema.json` | [Canvas](#canvas-marketcanvas) |

* **Consumes:** the clock contract ([sessions spec](sessions-authority-lifecycle.md)); the OpenAlgo market endpoints through `adapters/openalgo.py` ([execution-domain spec](execution-domain-and-observations.md) owns the adapter's order and book half).
* **Consumed by:** admission and the planner ([intent spec](intent-to-admission.md): `MarketPort.view`, `chain`, `chains`, `reference_facts`); protection ([protection spec](protection-and-safety.md): `closes`, `latest_tick`, the gap sources); strategies (SLICE-09).
* **Master anchors:** [Deterministic Canvas](../../../README.md#deterministic-canvas-and-full-market-scratchpad) (`README.md:806-835`), A01-F1…F5 (`:823-831`), D08 (`:230`), the reuse rows (`:1150`, `:1160`), the acceptance rows (`:1234-1236`, `:1241`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root.

## Overview

**In plain words.** The system needs prices: the index level, the option chain with its Greeks, and the price of each option it holds. Today a separate process asks OpenAlgo for them every 60 seconds and writes them to files, and the trading side only reads those files. The new design keeps that split. A market process collects and stores prices. Everything else reads them through a "view": a fixed snapshot of what was known at one moment, with a name that lets anyone open exactly the same snapshot later. A minute's bar is final 7 seconds after the minute ends and never changes after that (Q-030); a price that arrives later is kept as a correction that only research asks for. A strategy's view drops a price older than twice the poll interval, as today. Nothing here decides a trade: the existing entry and protection rules read the data and decide, as before.

## The problem

* **Bars change after they are called final.** Legacy folds every recorded tick again at each read (`src/data/marketdata/ticks.py:511-560`, `:572-640`), so a tick that arrives after confirmation changes a bar later decisions read as history, with no record of the change. POL-019's approved acceptance says it must not.
* **No view identity.** A legacy decision records a digest of the chain scan it used (`src/runtime/market_view.py:492-509`), not the population of inputs it could see. Spot rows carry no evidence at all on the live path. A decision cannot be re-opened with exactly its inputs.
* **No revisions or coverage on the live path.** The live store is append-only NDJSON with a per-file sequence (`src/data/marketdata/store.py:206-256`, `:291-335`); only historical bundles know revisions (`src/runtime/input_source.py:269-282`). An interrupted capture leaves a gap nobody can attribute.
* **Unsafe defaults.** `MarketView`'s constructor defaults freshness to unbounded and the source to the live store (`src/runtime/market_view.py:185-217`), which D08 forbids new APIs to inherit.
* **Time rules in many places.** IST is hard-coded in at least twelve modules (survey list in the [SLICE-08 slice file](../plan/slices/SLICE-08-market-data-and-views.md#what-legacy-does)); the history-bar fallback confirms with no lag (`ticks.py:756`) while tick bars use 7 s.

## Goals

* One stable view identity per decision, re-openable with the same reads (REQ-MKT-001).
* Overlapping history and live inputs merged with source identity, coverage and revisions (REQ-MKT-002).
* Quality reported against each consumer's declared needs, never a global gate (REQ-MKT-003).
* One versioned calendar and window definition; partiality, closure, finality, completeness and correction as separate facts; a final bar stays final (REQ-MKT-004, POL-019, Q-030).
* Corrections as revisions; old views reproducible (REQ-MKT-005).
* Canvas facts versioned, causal and separate from annotations (REQ-MKT-006).
* Dated reference facts from the daily recorder (REQ-MKT-007).
* Today's money behaviour unchanged: the planner and protection read the same values legacy read, through the store instead of fixtures.

## Non-goals

* **No start-time gate change.** Mid-session start behaviour stays today's until the owner answers OD-AS-2…OD-AS-13 (POL-O04). In particular, live views do not use history-reconstructed bars for the current day (OD-AS-8 stays at today's "never"), and live ingestion does not hydrate today's morning from `history`.
* **No new freshness value, threshold or entry gate.** Admission keeps B1's ages (POL-018, POL-020); the quality assessment reports, it never refuses.
* **No packaging.** The market process's service unit (`deploy/systemd/at-market.service`) and its supervision are SLICE-11.
* **Canvas renders nothing.** The operator interface's renderer (`canvas.tsx`) and richer algorithms (patterns, depth, levels beyond confirmed swings) are later Canvas work; Canvas facts feed no entry rule (`README.md:833`).

## Requirement keys

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-MKT-001 | One stable view identity per decision, used by every related strategy, protection and Canvas read | A01-F1 (`README.md:823`) |
| REQ-MKT-002 | History/live overlap resolved with source identity, coverage and revisions; no invented earlier knowledge | A01-F2 (`README.md:825`) |
| REQ-MKT-003 | Consumers declare input requirements; quality reports coverage, freshness and unmet needs without inventing consequences | A01-F3 (`README.md:827`) |
| REQ-MKT-004 | One versioned calendar and window definition; partiality, closure, completeness and correction are separate facts | A01-F4 (`README.md:829`); POL-019; Q-030 |
| REQ-MKT-005 | Corrections are revisions; old views stay reproducible | A01-F5 (`README.md:831`) |
| REQ-MKT-006 | New Canvas APIs require explicit cutoff, availability and freshness policy; facts are versioned and separate from annotations | D08 (`README.md:230`, `:808`) |
| REQ-MKT-007 | Dated reference history (lot size and similar) comes from the daily recorder; dates before the first recorded day are unavailable | POL-046, POL-022 |

## Critical user journeys

### CUJ-MKT-1: A tick arrives after its bar is final

A NIFTY tick stamped 10:41:58 exchange time arrives at 10:42:08.5, 1.5 s after the 10:41 bar's confirmation instant (10:42:07). The 10:41 bar that every view resolved at or after 10:42:07 shows stays as it was. The tick is stored, counted as late for the day, and makes revision 2 of the 10:41 bar. A live view never shows revision 2; a research view that asks for corrections does, and the Canvas facts computed over revision 1 stay in their old views, superseded in the new one.

### CUJ-MKT-2: An entry re-opens its view

A strategy resolves a view at 10:42:07.4 and sends an intent naming it. Admission, 300 ms later, opens the same view by its name: the market process has published 40 more records since, but the view names its store and its publication sequence, and its reads are bounded by them, so the spot, the chain and its `as_of` are the strategy's. Admission still measures their ages against its own clock (B1), as today.

### CUJ-MKT-3: The market process restarts mid-session

The market process stops at 11:02 and restarts at 11:20. The store's coverage shows the chain and spot streams interrupted from the last committed record to the first new one. Views resolved after 11:20 read the new records; their quality reports the gap to any consumer whose lookback covers it. Protection's gap sources see the missing closes. Nothing is backfilled from `history` for today (non-goals).

### CUJ-MKT-4: A crash during publication

The market process crashes after fetching a chain but before its commit. Nothing of that chain is visible: a view reads only committed records up to the published sequence. On restart the next poll fetches again, at its own poll instant: a new record, not a repeat of the lost one. A record can repeat only when a history window or a reference fact is fetched again; the merge then counts it as a duplicate and does not store it twice.

## Technical plan

### Records and identity (`contracts/market.py`)

* **Every stored value is a record**: `MarketRecord(stream, instrument, source, key, revision, event_at, arrival_at, seq, payload, origin)`.
  * `stream` is one of `tick`, `spot`, `chain`, `greeks`, `history_bar`, `reference`.
  * `source` is a source identity from `market/sources.py` (for example `openalgo.websocket`, `openalgo.quotes`, `openalgo.optionchain`, `openalgo.multioptiongreeks`, `openalgo.history`, `simulated`).
  * `key` identifies what the record is about, per stream:
    * a tick: its receipt number, the market process's own counter per websocket connection and day. OpenAlgo's websocket gives no sequence, and two ticks in one second are two ticks, so no two received ticks share a key, as legacy appends every row (`src/data/marketdata/store.py:315-338`);
    * a quote, a chain or a Greeks batch: its poll instant (and a chain's expiry);
    * a history bar: its window start;
    * a reference fact: its name, underlying and effective date.
    Only a re-fetch of a history window or a reference fact can meet a stored key.
  * `event_at` is when the value happened by the source's own clock (`Timestamp` domain `exchange`); `arrival_at` is when the market process received it (`wall`). Legacy writes both as the poll's wall clock for quotes and chains (`src/data/marketdata/scans.py:184-195`): the instant the poll started, its `when`, for every record of that poll (`src/interfaces/mcp/core/marketpull.py:835-846`, `:878-881`), not each response's receipt. The target keeps that, so admission's spot and chain ages are measured as today, and it keeps the 09:00–09:15 pre-open polls and records a tick's exchange time and its arrival separately, which legacy kept only in memory (`src/interfaces/mcp/domains/monitoring/state.py:72`).
  * `seq` is the store's commit sequence (one counter per store), so arrival order is commit order.
  * `origin` is `live`, `history` or `simulated`.
* **Prices and sizes are decimal strings**, written with Python's `repr` of the float the source gave, as the existing contract does (`contracts/market.py` module note): the planner's and the ladder's `float(...)` is the very float legacy computed with.
* **Instants.** `contracts/market.py` gains `instant(ts) -> datetime` (aware, from `utc_iso`) and `utc(dt) -> str` in the clock adapter's format (`%Y-%m-%dT%H:%M:%S.%fZ`, `adapters/clocks.py:10-11`), so the market package depends on contracts only.
* The SLICE-04 records stay as they are and are produced from the store: `StableView`, `ChainSnapshot`, `ChainRow`, `OptionQuote`, `ReferenceFacts`, `ReferenceMissing`, `InstrumentClose` and `Tick`.

### Calendar and windows (`contracts/market.py`)

* **One calendar, versioned.** `Calendar(calendar_id, version, utc_offset_minutes, open, close, weekdays)`; the first release binds `NSE-FO`, version `nse-fo/v1`: offset +330 minutes, 09:15 to 15:30, Monday to Friday, both ends inclusive, as legacy's `is_open` (`src/core/framework/market.py:68-71`, `:126-132`). Holidays, special and shortened sessions come from the reference facts recorded from OpenAlgo's market timings and market holidays endpoints (as legacy, `src/interfaces/mcp/core/market_calendar.py:67-205`). A day with no recorded timing fact has day status `unknown`, never assumed open. The calendar labels windows only; it grants no financial activation (ATA-05). **It is the one calendar** (A01-F4): in step 5 it implements the kernel's `Calendar` port (`kernel/ports.py:39-44`) from the recorded timings, and a view's `calendar_id` is its `calendar_id`, the id sessions use, so admission's calendar check (`kernel/admission.py:644-647`) compares like with like.
* **Windows.** `WindowDef(interval_secs, confirm_lag_secs, alignment)`, with the lag in one canonical text (no trailing zero), so one definition has one identity. A window starts at `floor(epoch_seconds, interval)` of the event instant, as legacy's `_floor` (`ticks.py:472-475`), and covers `[start, start + interval)`. `alignment` is `epoch`, legacy's rule; it aligns every interval that divides 19,800 s with IST minutes, so a one-hour window starts at :30 IST, as in legacy. The definition's text, `"{interval}s/{alignment}/lag{lag}"`, is part of every view's identity, so a changed definition is a new identity, never a changed old view.
* **The base window is one minute; higher windows are resampled** from confirmed base bars, as legacy's `_resample` (`src/core/framework/runtime/context.py:50-78`, `:264-278`): epoch-floored into the higher window, `open` of the first, extremes, `close` of the last, volumes added in order. A higher bar is confirmed once its own end plus the lag has passed, so never before the base bar that completes it. Lateness is judged on the base window only, so the timeframes never disagree about a tick (A01-F5). A higher bar's revision is the highest revision among the base bars it is built from.
* **The window facts are separate** (A01-F4). For a window and an instant `t`:
  * `partial`: `start <= t < end`;
  * `closed`: `t >= end`;
  * `confirmed`: `t >= end + confirm_lag_secs`, the confirmation instant (POL-019; `market.bar_confirm_lag_secs`, approved 7);
  * `sealed_revision`: the highest revision the store has sealed for the window, or none (below); which revision a view shows is the view's policy (Stable views);
  * `in_session`: the window lies inside the day's session, or `unknown` with the day status.

### Bars and finality (`market/view.py`)

* **A bar is a fold of ticks**, as legacy's `_fold` (`ticks.py:511-560`): the window's ticks in commit order; `open` the first price, `high` and `low` the extremes, `close` the last, `ticks` the count, and `volume` the sum of each tick's first present size field in `last_quantity`, `ltq`, `volume` (`ticks.py:72-78`). A tick's price is its first present field in `ltp`, `last_price`, `close`, `price` (`:94-100`); a tick without one is skipped. A tick without an exchange time takes its arrival instant, flagged `event_time_source: arrival` (`:103-120`).
* **Finality (Q-030 option A).** A tick is **on time** when `arrival_at <= confirmation instant` of its window, and **late** otherwise. Legacy's `_past_confirmation` (`ticks.py:148-157`) uses the same strict comparison, so a tick 7.0 s after the close is on time and one 7.001 s after is late.
  * **Revision 1** of a bar is the fold of its on-time ticks. The market process seals it (`BAR_SEALED`, store section) once its clock passes the confirmation instant and every tick received by then is committed.
  * **Each later commit that adds late ticks** to a sealed window writes a new seal, revision n + 1, over every tick committed so far.
  * **A view shows a window's bar only once it is sealed** within the view's publication bound: revision 1 unless its policy includes corrections, then the highest revision sealed. A confirmed window not yet sealed is reported `confirmed` with no sealed revision and has no bar in the view, so no view ever shows a revision-1 bar that a later view could show differently.
  * **Sealing is prompt.** The market process seals a window at its first commit after the confirmation instant, having committed every tick received by then. A decision pass that decides on a window (SLICE-09's host) waits for that window's seal, with a bound that is SLICE-09's measured setting; until the seal, the pass sees the window as confirmed and unsealed.
  * **Late ticks are counted per day and instrument**, with their maximum lateness, as legacy's capture-health fields (`ticks.py:249-308`), in the quality assessment.
* **Deviation (correction, from legacy):** legacy's live reader saw only the ticks flushed to the store by the pass. The recorder buffered ticks and flushed by row count, or by elapsed time when a later tick arrived (`src/interfaces/mcp/domains/monitoring/state.py:69-124`), so a decision could read a bar missing ticks that had arrived on time. The seal waits for every on-time tick, so revision 1 holds them. And legacy measured lateness from the flush (`ticks.py:189-200`); the target measures it from receipt. The bar gets more complete; no rule or value changes.
* **History bars.** OpenAlgo `history` bars are final when written, as legacy (`ticks.py:756`, `:795-799`), and carry `origin: history`. A view chooses them by its bar rule (below). Legacy's rule is all-or-nothing per day: tick bars if any confirmed one exists, else history bars (`session_bars`, `:801-806`). The target keeps that rule as `ticks_else_history`, for one-minute bars only as legacy (`ticks.py:804-806`), and live ingestion stores no history bars for the current day, so a live view behaves as today (OD-AS-8, POL-O04).
* **Premium closes for protection** are built as legacy's live host builds them (`scripts/run_framework_live.py:5062-5134`): from the chain stream, one close per poll, the held contract's `ltp` at the poll's `at`, from the fill instant on. They are `InstrumentClose` records read through the port; their own bar shape stays the ladder's (`kernel/trail.py`).

### Sources and providers (`market/sources.py`, `market/providers.py`)

* **A source** declares its identity, the streams it serves, whether it can serve history for a scope, and what it knows of revision order (`ordered`, or `unknown`). `market/sources.py` holds the `MarketSource` protocol and the simulated source; the OpenAlgo market source is in `adapters/openalgo.py`, beside the order adapter, and holds the only market credential use.
* **The OpenAlgo market source** reads what legacy's poller reads (`src/interfaces/mcp/core/marketpull.py:810-897`): `quotes` for spot, with the broken-field repair from today's `history` 1-minute bars recorded as `repaired` fields (`:269-356`); `expiry` and `optionchain` with `with_greeks: true` and `strike_count` (`:455-460`, `:755-807`); `multioptiongreeks` in batches (`:685-752`); and websocket ticks. An all-zero chain is refused as a failed poll (`:495-502`). Which Greeks the planner's rows carry, the chain's inline ones or the second call's, is characterized against legacy's join before the source is built (TASK-S08-05).
* **Providers** (`market/providers.py`) keep legacy's dependency contract (`src/runtime/providers/__init__.py:130-289`, `shipped.py`): named fields (`spot`, `chain`, `greeks`, `bars`), each with the fields it fills and the providers it implies (`chain` implies `spot`; `greeks` implies `chain`), filled in registration order because the chain's spot fallback reads the spot first. Unlike legacy, a provider carries no freshness bound of its own: the view policy names every bound (D08).

### Store and publication (`market/store.py`)

* **One SQLite file per market store**, separate from the ledger, opened by one writer (the market process) and by any number of read-only readers. Its tables:
  * `record`: every `MarketRecord`, append-only, unique on `(stream, instrument, source, key, revision)`;
  * `seal`: `BAR_SEALED(instrument, interval, window_start, revision, through_seq, tick_count, late_count)`;
  * `coverage`: per source, stream and instrument, intervals `covered`, `gap` or `interrupted`, each with the first and last `seq` it describes;
  * `head`: the published sequence.
* **Publication** (Combined-F2, market part). A batch's records, its seals and its coverage change commit in one transaction, and `head` moves in that transaction. A reader reads only rows with `seq <= head` as of its view. So nothing a view or a decision names can be half-written, and a crash loses only uncommitted work.
* **Retention.** Records are never deleted in this slice. How long they are kept for replay is the retention policy of the operations slice (SLICE-11); a view whose records are gone is reported unavailable, never silently re-resolved.
* **Reference facts** live in the same store (stream `reference`), with legacy's semantics (`src/data/reference/store.py:190-206`): the newest fact in force on the decision's exchange date and known by the decision instant, else `ReferenceMissing` with `no_fact`, `not_yet_available` or `not_in_force`. A fact effective before the first recorded day is unavailable (POL-046). The daily recorder records `expiry`, `instruments` (lot size, tick size), and the market holidays and timings, as legacy's recorder (`src/data/reference/openalgo_recorder.py:1-161`); a changed value is a new revision.

### Ingestion and merge (`market/ingest.py`)

* **The merge, per incoming record**, against every stored revision with the same `(stream, instrument, source, key)`:

  | Stored | Incoming | Result |
  |---|---|---|
  | none | any | `inserted` as revision 1 |
  | one with the same payload | any | `duplicate`: counted, not stored |
  | different payload, source `ordered` and the incoming one earlier in its order than the latest | | `outdated`: counted, not stored; the source's own order says it is superseded |
  | different payload, source `ordered` and the incoming one later in its order | | `revised`: stored as the next revision |
  | different payload, order `unknown` | | `conflicted`: stored as the next revision with `conflict: true`; quality reports the field conflicted to its consumers. Last arrival is not taken as the newest (A01-F2) |

  Records from different sources never merge with each other: a history bar and a tick bar for the same window are two records, chosen between by the view's bar rule.
* **Coverage.** Each fetch declares its scope (stream, instrument, from, to). A completed fetch records its scope `covered`; a fetch that raises or is interrupted records `interrupted` from its last committed record, in the same transaction as what it did commit, so a retry resumes and the gap stays attributable. A poll that finds the stream silent (no new record, no error) for more than its expected cadence records a `gap`, the store's feed-gap fact.
* **Live loop.** The market process polls on the minute, as legacy's `market_pull` (`src/interfaces/mcp/core/scheduler.py:174-215`), stops after the session close (`marketpull.py:889-896`), records websocket ticks as they arrive, and seals each window after its confirmation instant. The cadence is `market.poll_interval_secs` (POL-020), the value admission's freshness rule already reads.
* **No hydration of today from `history`** on start or reconnect (non-goals). The merge contract is still built and proved, because research and replay load history, and the post-close heal of missing past days uses it (legacy `marketheal.py:43-122`, which never heals today).

### Stable views (`market/view.py`)

* **A view policy** is named and versioned in the bound policy, with no defaults (D08):
  * `availability`: `arrival` (live: a record is visible when committed by the cutoff), or `event` (research only, labelled);
  * `corrections`: `exclude` or `include`;
  * `bars`: `ticks`, `history` or `ticks_else_history`;
  * `join`: `at_or_before` (legacy's `scan_at`, `src/runtime/market_view.py:417-440`) or `exact_minute` (BuyerEdge's scoring join, `:848-860`), per stream;
  * `max_age_secs` and `stale` per stream: under `stale: drop` a read whose record is older than the bound at the cutoff returns nothing, as legacy's live worker views do (`src/runtime/worker_host/__init__.py:507-513`, `src/runtime/market_view.py:413-435`, `:931-943`; OD-16): the live strategy policy binds `drop` with twice `market.poll_interval_secs`, legacy's `live_freshness_bounds`. Under `report` the age is only reported: the kernel's policy binds `report`, because admission's B1 measures the ages itself and refuses (POL-020).
  * `calendar` and `window` versions.
* **The view identity** is `mv1|{store_id}|{store_schema}|{policy}@{policy_version}|{underlying}|{cutoff}|{head}`, where `store_id` is a UUID written once when the store is created, `store_schema` the store's schema version, `cutoff` the resolution instant in UTC and `head` the store's published sequence read at resolution; no field may contain `|`. Re-opening against a store with another `store_id` or schema, or an identity whose version is not `mv1`, returns unavailable: a restored, rebuilt, research or simulated store can never answer for another. The identity carries everything needed to re-open it: re-opening reads only records with `seq <= head` and, under `arrival`, `arrival_at <= cutoff`. So a view resolved at the same instant as an ingestion commit, or re-opened later, reads the same population (A01-F1). Nothing is written to resolve a view.
* **Reads on a view:** `spot()`, `chain(expiry=None)` (the nearest expiry on or after the view's exchange date, as `nearest_expiry`, `marketpull.py:755-807`), `chains()` (every expiry the market process polled at the view's chain poll instant, nearest first, with `dte`, all with that one `as_of`: normally only the nearest, chosen as legacy does, falling back to the latest expiry when none is on or after today, `marketpull.py:805-807`, `:837-846`), `bars(instrument, interval, lookback)`, `closes(instrument, since)`, `latest_tick(instrument)`, `reference(underlying, name)`, which ignores `corrections`: a reference fact is the newest revision known by the cutoff, as legacy (`src/data/reference/store.py:194-199`). Each returns the value with its source, `event_at`, `arrival_at` and revision.
* **The SLICE-04 `StableView`** is produced by `as_stable_view(view, underlying)`: `view_id` the identity, `bar_open` and `bar_close` the newest window confirmed by the cutoff, `spot_as_of` and `chain_as_of` the chosen records' instants, `spot` the value.

### Quality (`market/quality.py`)

* **A consumer declares its needs**: `InputRequirement(consumer, consumer_version, fields_required, fields_optional, lookback_bars, interval_secs, session_reset, partial_bars)`, with `partial_bars` `allowed` or `excluded`. The requirement describes the consumer; it sets no threshold.
* **`assess(view, requirement) -> Assessment`** reports, per field: its state (`present`, `missing`, `stale` against the policy's bound, `unavailable`, `zero`, `conflicted`), age, source and revision; for bars, the expected windows in the lookback (from the calendar), those present, duplicates, gaps and late ticks; the join skew between spot and chain instants. Zero is reported as zero, not missing, with legacy's `genuine`, `substituted` or `unknown` classification (`src/data/marketdata/evidence.py:80-86`).
* **Consequences stay with consumers.** Admission keeps B1's ages unchanged; a strategy decides what an unmet requirement means under its own approved rules (SLICE-09). No readiness gate is created (A01-F3).

### The kernel's market port (`market/view.py`)

* `StoreMarket(store_path, policies, clock)` implements the kernel's `MarketPort` (`kernel/ports.py:92-110`) read-only over the store, so the kernel does not import the market package; `bootstrap` composes it in place of the fixture port.
  * `view(view_id)`, `chain(view_id)` and `chains(view_id)` re-open the named view and return the SLICE-04 records; an identity whose policy is unknown or whose records are gone returns `None`, which admission already refuses.
  * `reference_facts(underlying, decision_at)` keeps the port's rule unchanged.
  * **Protection reads through one view per pass.** The port gains `resolve(policy) -> view_id`; the protection loop calls it once at the start of each pass, and `closes(view_id, instrument, since)` and `latest_tick(view_id, instrument)` read through it. `PROTECTION_DESIRED` and `GAP_PEAK_RECORDED` record it as `market_view`, so a protection decision can be re-opened with its inputs (A01-F1). That is a kernel and event-payload change in step 5; the fixture port answers `resolve` with a fixed identity.
  * **The calendar port.** The same object implements the kernel's `Calendar` port from the calendar and the recorded timings.
  * **Where `latest_tick` comes from is an owner question**, raised when step 5 is deepened. Legacy's live host ran no tick exit, and its recorder captured index ticks, not the held options (`scripts/run_framework_live.py:5065-5066`). The two sources are websocket ticks for the held contracts, with delta from the newest chain poll at or before each tick, or the chain poll's own `ltp` and delta. They differ in how soon the target and deep-OTM exits fire. Either way, a price becomes a `Tick` only when its float is exact at two decimals; otherwise the tick is refused, never rounded.
* **The gap sources** carried from SLICE-06 step 5 arrive here. `missing_minutes`: two consecutive premium closes more than 120 s apart, legacy's `_TRAIL_GAP_SECS` (`scripts/run_framework_live.py:5017-5019`), kept as a constant in `kernel/protection.py`: it only labels a record-only gap, and it is not a new value. The day high: the held contract's `high` from the chain rows across the gap, when it rose since the gap's first snapshot (`_leg_day_high_jump`, `:5316-5343`). `InstrumentClose` gains `high`, the chain row's running day high at that poll, and `_gap_draft` gains legacy's day-high candidate for every gap source, with legacy's synthetic bar placed before the newest bar (`:5358-5385`), proved on cases generated from legacy. The store's `gap` coverage is the feed-gap fact protection's spec names, readable as `coverage(view_id, instrument)`; detection from the closes stays as built.

### Canvas (`market/canvas/*`)

* **Tools** over one view: `view(as_of)` resolves the identity every other tool uses; `compute_overlay`, `compare_timeframes`, `inspect_fact`, `annotate` and `history`, as `README.md:817` names them. The first release's one algorithm is **confirmed swings**: a swing high (low) at bar i needs `k` bars on each side with lower highs (higher lows); it is `provisional` at its anchor and `confirmed` only when the k-th right-hand bar is final and committed, at that bar's confirmation instant (`README.md:821`).
* **A fact** carries a stable ID, the algorithm, its version and parameters, the view identity, an inputs digest over the bar revisions it read, its anchor, confirmation and availability instants, its coordinates and units, and `superseded_by`. **An annotation** carries its author (agent, human or run), role, creation instant, the facts and view it refers to, its claim and confidence, and its own version; it cannot change a fact.
* **Corrections.** A view that sees a newer bar revision recomputes from its inputs; a fact that differs supersedes the old one, which stays in its old views (A01-F5). The first release recomputes from scratch; no incremental path is built.
* **Budgets.** Each tool call has row, timeframe, CPU-time and byte limits, refusing settings bound per caller.
* **Inspection only.** No module under `kernel/` imports `market.canvas`, and no fact is an entry input (`README.md:833`).
* The record shapes are in `resources/canvas.schema.json`.

## Failure modes and crash points

| Point | What happens | Recovery |
|---|---|---|
| CP-M1: crash after a fetch, before its commit | Nothing of it is visible | The next poll fetches again; an identical record is a `duplicate` |
| CP-M2: crash inside a batch commit | SQLite rolls the transaction back: records, seals, coverage and `head` move together or not at all | As CP-M1 |
| CP-M3: crash after the commit, before the seal of a confirmed window | The window is closed but unsealed; views report it `confirmed`, not `sealed` | On restart the market process seals every confirmed, unsealed window: revision 1 over the ticks committed with `arrival_at` by its confirmation instant, then revision 2 over every committed tick when late ones were committed before the restart |
| A source raises mid-fetch | `interrupted` coverage from the last committed record | The next poll retries; the gap stays attributable |
| A reader opens a view whose records were retained no longer | The read returns unavailable | None in this slice (retention is SLICE-11) |
| The store cannot be read | The port returns `None` or unavailable | Admission refuses as today; protection's existing escalations apply |
| Two market processes start | The second cannot take the write lock and exits | The supervisor (SLICE-11) |

## Risks and limits

* **Synthetic proof only.** The merge, revision and view proofs run on synthetic records. They do not establish OpenAlgo's completeness or its revision behaviour (`README.md:1234`); the source's own contract is checked against captured responses (TASK-S08-05).
* **Arrival time is the market process's clock.** A clock step on that host moves `arrival_at`; the clock-quality events (SLICE-03) record it, and the window rule uses exchange time for membership.
* **Legacy's live reader and recorder were different processes** with a flush buffer between them; the seal removes that race, which is a correction (above).
* **One-hour windows align at :30 IST**, as legacy's; a consumer that wants :15 alignment needs a new window definition, a new identity.

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `market.bar_confirm_lag_secs` | Seconds after a window's end that its bar is final (POL-019) | Refusing; approved 7. Legacy's silent fallback to 7 on an invalid value (`src/core/framework/market.py:97-110`) is replaced by a refusal at load (Q-015) |
| `market.poll_interval_secs` | The market process's poll cadence, and B1's freshness base (POL-020) | Refusing; bound per release |
| `market.calendar` | The calendar version | `nse-fo/v1` |
| `market.views.<name>` | Each view policy (above) | No defaults; every field named |
| `canvas.budgets.<caller>` | Canvas tool budgets | Refusing; measured |

## Reuse evidence

* Providers, `MarketInputSource`, `MarketView` and data evidence: **extract and extend against A01** (`README.md:1150`). Ported: the tick fold, the price, size and time field rules, the confirmation comparison, the provider dependency order, the joins, the reference store's `as_of`, the recorder's fact list. Not inherited: `MarketView`'s constructor defaults (`src/runtime/market_view.py:185-217`), the per-read refold, the per-file sequence, the NDJSON layout.
* Canvas algorithms, history and tools: **build on the market seam** (`README.md:1160`). No legacy Canvas code exists; the nearest legacy modules (OI walls, GEX levels) are strategy inputs, not Canvas.

## Alternatives considered

* **Keep NDJSON files.** Rejected: publication of a batch with its seals and coverage needs one atomic commit, which SQLite gives and append-only files do not.
* **Write a view row per resolution.** Rejected: an identity that carries its own bounds needs no write, so a read-only reader (the kernel) can resolve and re-open views.
* **Refold at read, as legacy.** Rejected by Q-030.
* **Hydrate today's morning from `history`.** Deferred to the owner's OD-AS-8 (POL-O04).

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-MKT-01 | T | `tests/unit/test_market_windows.py` | Window starts, ends and boundaries; higher windows resampled from base bars as legacy's `_resample`; the 6 s, 7 s and 8 s ticks of POL-019; fold order, price, size and time fields as legacy; revision 1 from on-time ticks only; late counts; session facts on regular, closed, special and unknown days; one-hour alignment | a late tick changes revision 1, a boundary tick lands in the wrong window, or a fold differs from legacy's |
| PRF-MKT-02 | T | `tests/unit/test_market_ingest.py` | Each merge row; history and live overlap; duplicates; conflicts kept; an interrupted fetch and its retry; coverage attributable; no record visible before its commit | last arrival overwrites, a conflict is dropped, or a gap is unattributed |
| PRF-MKT-03 | T | `tests/recovery/test_crash_boundaries.py` | CP-M1…CP-M3 by killing the market process at each point; repeated ingestion of the same fetch | a half-written batch is visible or a seal is lost |
| PRF-MKT-04 | T | `tests/unit/test_market_view.py` | Interleaved resolution and ingestion, tied timestamps, delayed publication: a view re-opened later reads the same records; the identity round-trips; a confirmed, unsealed window has no bar; another store, schema or identity version is refused; `stale: drop` and `report` | a re-opened view reads a later record, or another store answers |
| PRF-MKT-05 | T | `tests/unit/test_market_view.py` | Q-030: a late tick makes revision 2; views excluding corrections are unchanged; a view including them sees revision 2; recomputation matches an independent fold | a final bar changes in a live view |
| PRF-MKT-06 | T | `tests/unit/test_market_quality.py` | Missing, optional, stale, zero, conflicted fields; duplicates, gaps, breaks, session reset, warm-up by expected windows, join skew, against independent expectations; a clock step on the market process (recorded by the clock-quality events) reported for the windows it spans (`README.md:1241`) | a row count passes for warm-up with gaps, or the assessment refuses anything |
| PRF-MKT-07 | T | `tests/integration/test_market_port.py` | Admission and protection over the store-backed port give the results they give over the fixture port for the same values; one identity per protection pass, recorded on its decisions; the calendar port; the gap sources, the day high on legacy's cases; the tick source as the owner answers; reference facts and POL-046's unavailable date | a port read differs from the fixture's for the same data |
| PRF-MKT-08 | T (recorded inputs) | `tests/integration/test_openalgo_contract.py` | The OpenAlgo market source maps the captured `quotes`, `expiry`, `optionchain` and `history` responses to records; an all-zero chain refused; Greeks and PE delta sign as characterized; `multioptiongreeks` and websocket ticks on synthetic responses shaped from legacy's parsers, since none is captured (slice file) | a captured field is dropped or invented |
| PRF-MKT-09 | T | `tests/unit/test_canvas_causality.py` | A swing is unavailable until its k-th right bar is final; perturbing later bars leaves earlier views unchanged; a corrected bar supersedes the fact in the new view only; a fresh and a restarted computation agree for one view, and no incremental path exists, so row 1236's incremental clause is empty by design; no `kernel` module imports Canvas | a fact appears early, repaints, or reaches the kernel |

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-04 | The minimal `contracts/market.py` records and the fixture port | (PRF-ADM-03…05 use them) |
| SLICE-06 | `InstrumentClose`, `Tick` and the fixture closes and ticks | (PRF-PRT-02 uses them) |
| SLICE-08 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-08-market-data-and-views.md#steps) | PRF-MKT-01…09; PRF-ADM-07 with recorded sessions (slice file) |
