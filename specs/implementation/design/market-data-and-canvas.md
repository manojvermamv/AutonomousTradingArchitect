# Market data and Canvas (stub)

* **Status:** proposed **stub**. Full depth (transition tables, failure modes, interfaces, proofs) is written when SLICE-08 starts. Depth follows slices (`README.md:1133`; owner choice recorded in [00-provenance](../00-provenance.md)).
* **Precedence:** master README, then ROADMAP, then this file.
* **Specified here (exclusive):** `contracts/market.py`, `market/ingest.py`, `providers.py`, `store.py`, `sources.py`, `view.py`, `quality.py`, `market/canvas/*`.
* **Master anchors:** [Deterministic Canvas](../../../README.md#deterministic-canvas-and-full-market-scratchpad) (`README.md:806-835`), A01-F1…F5 (`:823-831`), D08 (`:230`).

## Requirement keys (pointers)

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-MKT-001 | One stable view identity per decision, used by every related strategy, protection and Canvas read | A01-F1 (`README.md:823`) |
| REQ-MKT-002 | History/live overlap resolved with source identity, coverage and revisions; no invented earlier knowledge | A01-F2 (`README.md:825`) |
| REQ-MKT-003 | Consumers declare input requirements; quality reports coverage, freshness and unmet needs without inventing consequences | A01-F3 (`README.md:827`) |
| REQ-MKT-004 | One versioned calendar and window definition; partiality, closure, completeness and correction are separate facts | A01-F4 (`README.md:829`); POL-019 |
| REQ-MKT-005 | Corrections are revisions; old views stay reproducible | A01-F5 (`README.md:831`) |
| REQ-MKT-006 | New Canvas APIs require explicit cutoff, availability and freshness policy; facts are versioned and separate from annotations | D08 (`README.md:230`, `:808`) |
| REQ-MKT-007 | Dated reference history (lot size and similar) comes from the daily recorder; dates before the first recorded day are unavailable | POL-046, POL-022 |

## What early slices need now

* SLICE-01…SLICE-05 use **fixture views**: a `StableView` record with an identity, cutoff and the bars a test needs, built from synthetic data. No ingestion is needed.
* SLICE-06 (protection) consumes `BarConfirmed` and `Tick` triggers from fixture views, under POL-019's 7 s confirmation rule.
* SLICE-04 defines a **minimal** `contracts/market.py`, because the pure planner needs it, and SLICE-08 extends it without replacing it:
  * `StableView(view_id, underlying, cutoff, bars, spot)`;
  * `ChainSnapshot(underlying, expiry, as_of, rows)`, each row carrying instrument, strike, option type, lot size, tick size, price, delta and gamma, as the legacy one-leg planner reads them (`OA/src/core/framework/runtime/orchestrator.py:385`; exact field list fixed by TASK-S04-04 from that code, written in [SLICE-04 step 3](../plan/slices/SLICE-04-intent-to-admission.md#inputs) as one row per strike with CE and PE quotes, legacy's flat-chain shape; a snapshot also carries its `dte`, calendar days to expiry, and the port serves every expiry of a view, nearest first, for structures, [step 4](../plan/slices/SLICE-04-intent-to-admission.md#inputs-and-the-read-order-at-the-door));
  * `ReferenceFacts(underlying, trading_date, lot_size, tick_size)` from the daily recorder (POL-046, POL-022).
  * `market.poll_interval_secs` is POL-020's value in the bound policy; the spot and chain age limit is twice it.
  * SLICE-06 adds fixture fields for the feed-gap interval and its bars and for `Tick.delta` ([protection spec](protection-and-safety.md#delivery)).

## Reuse rows and divergences

* Providers/MarketInputSource/MarketView/data evidence: **extract/extend against A01** (`README.md:1150`). Legacy `src/runtime/input_source.py`, `market_view.py:185` (compatibility defaults must not be inherited by new APIs, `README.md:808`).
* Canvas algorithms/history/tools: **build on the market seam** (`README.md:1160`). No legacy Canvas code exists.

## Open items

* OD-AS-2…OD-AS-13 start-time gate changes (POL-O04) affect mid-session start behaviour.

## To specify at SLICE-08

View identity and revision retention; the ingestion merge state machine; consumer requirement and assessment types; window finality including late ticks (POL-019); correction propagation; Canvas fact, annotation and tool schemas (`canvas.schema.json`); crash points around ingestion publication (Combined-F2); proofs from `README.md:1234-1236`.
