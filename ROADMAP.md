# Roadmap

## Assessment storage correction — owner decision 2026-11-17 UTC

The owner replaces the SLICE-11 separate-filesystem hard gate: assessments may share the main disk with the ledger. A second volume is optional, selected for a staged release when actually mounted; a directory alone is not a separate volume. No mid-session move or silent fallback from a selected unavailable mount. This is consistent with master A09-F3, which does not mandate separate physical storage.

Startup requires adequate free space. The selected default is a 10% hard floor and 15% early-warning/entry-stop floor, strengthened by a larger explicit byte reserve. This supports the owner's example 5 GB optional volume without imposing an impossible 5 GB free-space default. The supervisor monitors continuously; new entries stop under pressure while existing-position protection/exit handling remains available. The kernel independently enforces entry admission/dispatch safety.

A local daily checksummed read-only assessment archive follows confirmed recorded market close, with an explicit cutoff and retained original evidence. Later assessments must remain visible as uncovered evidence rather than be silently claimed as sealed. Atomic publication, retries, unknown calendar and disk pressure require targeted verification. A local archive is not off-host backup or protection against loss of the disk; remote backup/restic/restore work remains deferred.

Implemented, committed and pushed as source `b88014e` (`agentic-desk`), with this record as specification `476ae06`. The server's runs: 48 focused checks and 7 staging checks passed, independent review accepted corrections R1–R4, and the installed-wheel check outside the checkout passed (1 test). Because the focused run predated the review fixes, every test file the commit touched was rerun against the committed code before the push: 8 files, 445 passed, 0 failed (server `.workspace/logs/b88014e-verify.log`). Evidence details are in the server workspace result `.workspace/notes/assessment-storage-result.md`; no host activation or live acceptance is implied. This section supersedes the old separate-disk blocker in delivery summaries and SLICE-11 as-built filesystem assertions. Historical records remain dated.

**21 November 2026 (D-017):** superseded for the backup. The nightly backup goes to R2 as plain objects, without restic, and runs nightly. The clean-host restore rehearsal stays deferred.

**23 November 2026 (B9; D-020, D-021):** superseded for new days. Assessments are one append-only SQLite file per IST day (`days/<date>.sqlite`), sealed by the supervisor (a seal row, then read-only), weekends and holidays too; no tar copy is written. Old days keep their layout and readers read both. Every nightly set holds the assessments files; the market store keeps the newest 10 trading days, each older day a checked, compressed file in the bucket. An owner command restores after losing the server (A2); the clean-host restore rehearsal (D10) stays open.

<a id="current-delivery-status--2026-11-20-utc"></a>
<a id="current-delivery-status--2026-11-21-utc"></a>
<a id="current-delivery-status--2026-11-23-utc"></a>
<a id="current-delivery-status--2026-11-24-utc"></a>
<a id="current-delivery-status--2026-11-25-utc"></a>
## Current delivery status — 2026-11-26 UTC

**26 November 2026 (analyze session).** Five BuyerEdge trades on the 25 November release, +711.75 rupees before
costs, every exit by the stop or the trail, the broker's realised P&L equal to the ledger's. PE trades stayed in past
their first tick (13 and 27 minutes) and left by the trail: the 20 November put-delta fix is proven live. Measured in
the session: the strategy host at 0.7% of one core; last night's backup at a 1.2 GB memory peak (`at.slice`, item
13). At 11:44 IST Ubuntu's automatic upgrade restarted every trading service (item 16), which ended the day
(`SESSION_CLOSING kernel_stopped`, D-007) with the book flat and the day's 5-trade limit already reached; the kernel
resumed by itself 4 s later (`routine_standing`).

**25 November 2026 (analyze session).** The first entry since the PRT-R10 fix: NIFTY 01 Dec 25800 CE × 65 at 09:44 IST,
filled 214.70 against a plan of 213.20, stop and target at the broker, the trail raised the stop to 204.45. The three
owner drills ran with it open (item 5). The OpenAlgo-off drill ended the day (`SESSION_CLOSING broker_unreachable`,
D-007) and the kernel squared the position off at 215.55 once OpenAlgo answered: +55.25 rupees before costs, broker
flat, its realised P&L equal to the ledger's. The kernel-stop drill proved R-4's automatic path (`routine_standing`).
Still open from the day: a PE trade past its first tick, and the 15:13 square-off (item 2).

**26 November 2026, after the close: released.** On the owner's word, release `20261126T105806Z-f11c1f35dfa3` (built from the
source repository's `94830da`) converged at 16:29 IST with the host package update fix (item 16: the upgrade timer at
16:15-16:30 IST and needrestart never restarting `at-*` or containerd, both checked on the host); 27 November's
binding and grant issued. The 15:13 square-off (item 2) is proven by simulation. Then, on the owner's word,
`20261126T111601Z-389023c79c86` bound the entry cutoff `account.limits.no_new_trade_after: '15:10'` and the `at.slice`
envelope, and `20261126T112532Z-1e649113052d` (`fb0ad49`) fixed the installer, whose render paths had never passed the bound
`envelope.*` values: `at.slice` now `MemoryHigh` 2 GiB, `MemoryMax` 3 GiB, `TasksMax` 512.

**25 November 2026, after the close: released.** On the owner's word, release `20261125T121017Z-31af10d63d50`
(built from the source repository's `ebde1cc`) converged at 17:41 IST with the two evening pieces below, the `at.slice`
fix and the kill-switch fix with its bound kill file (item 13). The first try (built from `80a09cb`) refused at
`UNITS_WRITTEN`: the installer's `apply-root` built its directory table before creating system users, so the new
`at-messenger` user did not exist; its undo then stopped on a polkit file the installer cannot read and left the kernel,
market and operator stopped, with the book flat after the close. Both fixed (`8afc491`, item 13). After the release:
`at.slice` with no placeholder and no reload warning, the kill folder in place, `at-messenger` created and disabled
(no channel), taflow loading in the release; Thursday 26 November's binding and grant issued for the same BuyerEdge
candidate as 25 November's.

**25 November 2026, evening: messages to the trader through OpenAlgo (built, landed, released after the close).** The owner
asked for OpenAlgo's messaging to be used from the system. Built: one adapter for OpenAlgo's four `notify` endpoints
(Telegram, WhatsApp, Slack, Discord) and a separate process, `at-messenger`, that follows the ledger and sends what
OpenAlgo cannot know (fills, exits with P&L, the trading day, kill, holds, the loss latch, escalations); OpenAlgo's own
`/alerts` already sends every order placed, modified or cancelled, so those are not repeated (source D-022). The owner's
legacy BuyerEdge messages (entry, exit, the 60-second P&L line and the naked-short check, in the standalone script's
exact format) are a setting, off by default (source D-023). Both are off until the owner names a channel; the running
OpenAlgo has its Telegram bot stopped and WhatsApp unpaired. Two independent reviews; every finding fixed and tested.
Landed on `agentic-desk` (the source repository's `HANDOFF.md` names the commit); source `docs/openalgo-messaging.md`.

**25 November 2026, evening: the owner's indicator library inside the source repository (landed, released after the close).**
The owner asked for taflow, their Rust indicator library, to be copied into the project with one import surface.
Source D-024: taflow 0.2.0 is vendored (`native/taflow/`, with prebuilt binaries for Windows and Linux x86_64 inside
the package, so no Rust on any machine) and reached only through `autonomous_trading.indicators` (`series` on taflow;
`options` for the chain statistics and gamma exposure; `excursion` for MFE and MAE). Each call is pinned bit for bit
to the code it mirrors on recorded NIFTY minutes and chains. Moved: the rule provider's EMA and breakout, the Canvas
swings. BuyerEdge and the trail match exactly but stay on their own code until the owner moves them (item 15).

**24 November 2026 (an NSE holiday; no session).** Built and released that evening (`20261124T132627Z-55f838f52897`, on the
owner's word): the recent ledger every 5 minutes (B10's optional step, below) and D-021 counting sessions only. Fixed in the source repository's at-ops skill: `health.sh` runs to its end (item 13's
checkpoint "failure"), a holiday's cleanly ended strategy host is no alarm, `alerts.sh --alive MIN`, `openalgo_books
mode` (source `docs/operations.md` "Health checks and day watches (24 November 2026)"). Wednesday 25 November's
binding and grant are in place.

*History, the evening of 23 November 2026 (IST); the running release is in the source repository's `HANDOFF.md`
section 1.* Running since 18:31 IST: release `20261123T125948Z-200363068b91`
(built from `d7347a1`), the fourth of that evening, all after the close: `c8b112fc7707` (`c3a314b`, the PRT-R10 fix
and D-019), then the data-management work and two backup fixes. Wednesday 25 November's binding and entry grant are
issued (Tuesday 24 November is an NSE holiday). The source repository's `HANDOFF.md` section 1 names the running
release and heads. Decisions D-016 to D-021 are in the source
repository's `docs/decisions.md` (D-001 … D-024 since 25 November).

**Done (23 November 2026; history):**

- **PRT-R10 (`a822a30`).** OpenAlgo's orderbook holds today's orders only, so Friday's ten protective orders (all
  ended at Friday's close) were absent on Monday and every Monday entry was refused. The kernel sends only DAY orders,
  so an owned order first recorded on an earlier exchange day now counts as ended; an order of today the book does not
  show still blocks. Monday's session made no entries.
- **D-019 (`5782a93`):** live Upstox funds come as exact two-decimal strings; they are money now. The out-of-hours
  all-`"0.00"` answer is unavailable. Analyze mode sends numbers, so live funds reads would have failed every entry.
- **The fake OpenAlgo audited against upstream** (`5f2060c`, test-only).
- **A1:** `backup.storage_credential_held_offbox` removed; the owner's Cloudflare account can make a new token at any
  time (D-017's 23 November line). `status` has no UNSURE line.
- **Data management B1–B10 (D-020, D-021):** multipart uploads and one-step store copies (B1); the market writer's
  seal pass reads only what a commit can change, 358 ms to 1–3 ms a commit (B2); a date index (B3); market day files
  exported, uploaded once, receipted (B4); format 2 sets, each object once by hash, zstd level 9, a night with nothing
  new uploads 0 bytes (B5); the live market store keeps 10 trading days, an older day deleted only with a matching
  receipt (B6); replay reads one day, and a DuckDB Parquet research copy (B7); the strategy host caches sealed bars,
  18.7 s to 0.56 s CPU a pass (B8); assessments one file per day, no tar (B9); replay days one zstd stream, 33.9 MB to
  2.56 MB (B10). Measurements: source repository `docs/operations.md` "Data management (23 November 2026)".
- **B10's optional step (24 November 2026, the owner's word):** the recent ledger. Every 5 minutes
  (`at-ledger-recent.timer`), when the ledger's head moved, a checked whole copy (about 0.3 MB compressed) goes to
  the bucket by hash with its evidence; `restore run` takes it when it continues the set's chain. Built and tested (source `docs/operations.md` "B10b"); runs from the
  first release that carries it.
- **A2:** restore after losing the server: `python -m autonomous_trading.operations.restore list|run` and at-ops
  `restore-backup.sh list|rehearse|live` (source repository guide 01 section 6). Rehearsed on the real bucket on
  23 November 2026: ok in 5 minutes, every store equal to the set.

**Done (20 November 2026; history):**

- **Second analyze-mode day.** Five BuyerEdge trades (one 25500 CE, four 25400 PE, 65 each): +₹702.00 before costs,
  flat, every fill matched (source repository `.workspace/reports/2026-11-20-owner-report.md`).
- **D-016 (owner):** an analyze-mode session counts as a live-broker check; the chain signal → order → protection →
  exit → reconciliation is proven by the 19 and 20 November sessions.
- **The 09:15 tick gap** fixed (`1465c4b`) and released (above).
- **The deep-OTM exit** compared a put's signed delta with +0.10, so every PE position left at its first tick; fixed to
  `abs(delta)` as the original strategy (`8c7d99e`, SLICE-06 step 2's amendment). Released 19:03 IST.
- **Replay re-measured** on today's code (SLICE-15/16/17 amendments); R1 under D-007 done.
- **Codex's 17 Markdown findings** fixed; CI green with Gitleaks.

**21 November 2026 (history):** **D-017 (owner):** the nightly backup goes to Cloudflare R2 by default, as plain objects over the
S3 API: no encryption, no passphrase, no restic. Backblaze B2 is supported, untested, deferred; switching is settings
only (`backup.provider`, `backup.destination`, the backup's credential). Built and tested against a local S3
stand-in; `backup.retention` stays the owner's (`keep:<n>`, ships unbound). SLICE-11 step 8 is closed by it.
Proved on the real bucket on 21 November 2026 (`scripts/verify_backup.py`): one set of 551 MB, 122 objects, uploaded, read back, checked and restored into scratch; every hash, the ledger head (712) and rows, the 120 evidence files and the market store match the live stores (the market store had only moved on: new watermark rows); the bucket held exactly the set.

**Still open, in order:**

1. ~~Release `8c7d99e`~~ released 20 Nov 19:03 IST.
2. ~~Verify the first market-session kernel square-off when a position crosses 15:13 IST (D-014)~~ proven end to end by simulation on 26 November 2026 (`tests/replay/test_square_off_day.py`: the real kernel, protection loop and ledger against the fake OpenAlgo; a position open from 14:56 is exited by the kernel at 15:13:07, flat at 15:13:30, stop and target cancelled first, the book flat at the close); live sessions end flat before 15:13 (the 5-trade limit), so no live observation is awaited. Not on a drill day:
   the OpenAlgo-off and kernel-stop drills each end the day and square the position off at once (25 November 2026).
   Also still to see: the kernel-stop drill closing an open position (on 25 November it ran with the book flat; on
   26 November an unplanned kernel stop also found the book flat).
3. ~~Monday's open: the first index tick within seconds of 09:15.~~ Done 23 November 2026 (09:15:00.99 IST).
4. Review OPS09 formally and update the provisional runtime settings (an owner decision; every timing is bound, so
   what is left is keeping or changing them; 23 November re-measured in the 24 November report: chain data at most
   2.73 s late, book at most 0.61 s old). **Measured 19–20 November**
   with the source repository's `scripts/measure_session.py` (`docs/measurements/session-timings-2026-11-19-20.md`):
   sends under 6% of their deadlines, completions under 17% of the escalation limit; one chain stored 6.5 s after its
   minute against `market.http_timeout_ms` 5,000.
5. ~~Owner drills: OpenAlgo off 3 minutes with a position open; the emergency stop once.~~ Done 25 November 2026
   (the 25 November paragraph above; source at-ops `owner-commands.md` "Drills").
6. ~~The recorded calendar checked against NSE's list.~~ Done 20 November 2026; recheck each December.
7. ~~The backup (D-017): bound and proved on the real bucket.~~ Done 21 November 2026 (D-017, D-018; the 21 November
   paragraph above); nightly since. The clean-host restore rehearsal stays open (item 11).
8. ~~The backup token off the machine (`backup.storage_credential_held_offbox`).~~ Closed 23 November 2026 (A1).
9. `security.journal` is unbound, so every backup set records an authorization gap (no authorization snapshot). This
   predates D-017. **Corrected 24 November 2026:** it is not a binding to make: no part of the running system writes a security journal (the off-host adapter SLICE-11 step 8 planned was never built; the kernel starts with `journal=None`), so binding the setting alone closes nothing. Nothing is lost: every
   grant is also in the ledger, which the backup holds, and a restored kernel treats the journal as untrusted and
   fails closed on delegated grants only (the owner issues a fresh grant each trading day anyway). Building the adapter
   is worth it only with several operators or delegated grants; until then the gap is an honest note, not a fault.
10. ~~Prune old releases.~~ Done 25 November 2026, 17:52 IST, on the owner's word: 3 releases, 0.56 GB, records
    archived on the server.
11. ~~Restore after losing the server: no owner command.~~ **Built 23 November 2026 (A2):** `restore-backup.sh`,
    rehearsed on the real bucket that night (ok, 5 minutes). Still open: the clean-host restore rehearsal (D10).
12. ~~Data management: the market store and the nightly set grow about 170 MB each trading day.~~ **Done 23 November
    2026 (D-020, D-021, B1–B10).** The server's settings carry `backup.day_receipts` and `backup.day_files`, and the
    first nights archived 5 day files (23 Nov). Still open: the first real 16:00 prune, once more than 10 trading days
    are held: Thu 3 December from 16:00 IST (the owner's session-only count, released 24 November). B10's optional
    recent ledger: released 24 November 2026, its first upload ok.
13. **Defects found 23 November 2026** (none blocks trading; each is a correctness or tidiness item):
    - `market/store.py`: a tick key revised into another window while its first window is unsealed wedges every
      later commit (`ValueError`, rollback). B2 kept the behaviour identical; live keys are unique per receipt.
    - `market/view.py` detects a pruned day by inference (no watermark or seal rows). Exact alternative: a
      `pruned_day` table written by `days.prune`.
    - `market/view.py`'s incremental read queries `reader.conn` directly; cleaner is `tick_records(..., after=)` in
      `market/store.py`.
    - No research account exists on the server (research is outside the first release); one added later must join
      `at-market-readers` to read `backup.day_files` (`settings/schema.py` gives `research-offline` no groups).
    - ~~D-021 counted a holiday as a trading day.~~ Fixed and released 24 November 2026 (sessions only; D-021).
    - Restored sealed assessment days come back 0640, not 0440 (`operations/restore.py`).
    - A day whose live rows changed after its export keeps its receipt and is never pruned (kept for good; safe).
    - ~~at-ops `health.sh` exits 1 on informational lines.~~ Fixed 24 November 2026 (source `docs/operations.md`
      "Health checks and day watches").
    - `deploy/install.py` `latest_assessment` keeps the old index scan as a fallback for the rehearsal's fake
      supervisor.
    - ~~`at kill-switch on` exits 1 when no kill file is bound.~~ Fixed and released 25 November 2026: exit 0 with
      `KILL SWITCH ENGAGED in the ledger`; `risk_guard.kill_switch_file` bound in the deploy settings, live since that
      release (test `test_cli_on_recorded_without_a_file`).
    - ~~`at.slice` installed with the template's placeholders.~~ Fixed and released 25 November 2026
      (`isolation.installed_slice`). Measured 26 November: the nightly backup peaks at 1.2 GB of memory (the slice at
      1.30 GB), the ledger copy about 1 s of CPU; binding `envelope.optional.*` (proposed `MemoryHigh` 2 GB,
      `MemoryMax` 3 GB) is the owner's decision.
    - ~~The installer built its directory table before creating system users; the refused activation's undo could not
      read polkit's rules.~~ Fixed and released 25 November 2026 (source `8afc491`).
14. **Messaging (D-022, D-023), built and released 25 November 2026** (`at-messenger.service` installed, disabled
    until `messaging.channels` names a channel). Next, the owner chooses a channel and sets
    it up in OpenAlgo (start the Telegram bot and `/link`, or pair WhatsApp, or a Slack or Discord webhook switched on
    at OpenAlgo's `/alerts`), copies the OpenAlgo key for the messenger (source guide 01 section 3.6) and, if wanted,
    turns on `messaging.trade_alerts.enabled`. First live check: one real message per channel, on the owner's word.
15. **Indicators (D-024), built and released 25 November 2026:** on the owner's word, move BuyerEdge and AI BuyerEdge onto
    `autonomous_trading.indicators` in one change at a session start (their files are part of their candidate
    identity, so the session's binding is issued again), and the trail only if its standard-library rule is lifted.
    Found with it: the strike selector's IV-rank gate never acts (the planner passes no IV rank, as legacy live did).
16. **Host updates restart the trading services (found 26 November 2026).** Ubuntu's `apt-daily-upgrade.timer` runs
    `unattended-upgrade` at a random time each day, and `needrestart` restarts every service using an upgraded
    library, the kernel included: on 26 November at 11:44 IST that ended the session (D-007). On the owner's word:
    move the timer after the close and tell `needrestart` never to restart `at-*` units (source `docs/operations.md`
    "Host package updates"). Until then any session can end early, with an open position squared off.

 Live mode only on the owner's word. The AI twin (SLICE-17),
the web console and MCP are not in the first release.

<a id="current-delivery-status--2026-11-19-utc"></a>
## Delivery status — 2026-11-19 UTC (history; superseded by 20 November above)

Updated after the evening deployment on 19 November 2026. The running build is
`AutonomousTrading/agentic-desk` at `b90fdffe`. Decisions D-011 through D-015 are in the source repository's
`docs/decisions.md`.

**Done (19 November 2026):**

- **First analyze-mode day with entries.** Five BuyerEdge trades (65 × NIFTY CE each): +₹5,788.25 before costs (broker
  realised P&L, owner's report). Six issues were found and fixed the same day.
- **Fixes:** `fae71f9`, the `sibling_failed` timer runs only while a cancel or quantity change is due (it froze the
  trail two minutes after every fill); **D-011** (`08c2707`), a leftover stop or target is cancelled even under a hold;
  **D-012** (`08c2707`, `9152a84`), the stop and target are re-anchored to the real fill (fill − points / fill +
  points, both ways); **D-013** (`08c2707`), an entry is priced from the newest chain the view sees; **D-014**
  (`1f7de02`), `protection.session_close: square_off` (was `broker`): the kernel closes at 15:13 IST, before OpenAlgo's
  15:15 MIS square-off, whose order was foreign to the ledger and left a phantom position.
- **Two fresh ledgers on the owner's word** (13:28 IST, and 15:49 IST to clear the phantom and the recovery hold it
  caused); the old ledgers are archived, not deleted.
- **Running:** release `20261119T141735Z-c4ee7cf5c588` converged at 19:49 IST. The kernel is operating.
  The ledger and OpenAlgo analyze books were flat, with the original 20 November binding (19) and entry grant (56).
- **D-015:** deployed the removal of the legacy history import, cutover, shadow and legacy order projection.
  The prior D-014 release remains available for restore. The unfinished 17 November release was retained.
- Validation, as run on the Ubuntu host: full suite 3,722 passed, 19 skipped, 3 failed (the PRF-STR-02 test, fixed in
  `69581b9`; two `tests/isolation/test_resource_storage_scope.py` tests that fail on older code too, a host
  permission). These three failures were subsequently fixed. Tonight's focused protection, isolation and helper run passed 289 checks with one skip.

**Still open, in order:**

1. ~~Verify the first market-session kernel square-off~~ carried to 20 November (flat before 15:13 that day).
2. Review OPS09 formally and measure queue and reconciliation timings before updating the provisional runtime
   settings (an owner decision). Measured so far, 19 November, from the ledger (20 command attempts, one ledger
   segment; ledger intervals, not pure broker latency): admission to dispatch claim 3–49 ms, claim to recorded
   acknowledgement 33–403 ms, acknowledgement to completion 1.4–15.0 s (source repository
   `.workspace/notes/session-20261119/closing-summary.json`, computed by `summarize.py:60-79` beside it).
3. Owner drill: stop OpenAlgo for 3 minutes with a position open.
4. ~~Re-run the R1 start-anytime matrix under D-007.~~ **Done 20 November 2026** on the Ubuntu server, with the
   converted days rebuilt the same day: R1's 09:44 crash ends the day (`SESSION_CLOSING`): 4 admitted, 2 fills,
   48 decisions refused `SES-R07`, flat (source repository `docs/operations.md`, "Replay records", "Start at any time").

Backup integration stays deferred until the owner asks. Live mode only on the owner's word. The AI twin (SLICE-17),
the web console and MCP are not in the first release.

## Delivery status — 2026-11-18 UTC (history; superseded by 19 November above)

<a id="current-delivery-status--2026-11-18-utc"></a>Updated the evening of 18 November 2026 (IST), after the 17:29 IST activation.

Source: `AutonomousTrading/agentic-desk`; the running release's build is `d63928d`. This section supersedes
the 17 November one below and older open-task summaries; historical slice and audit evidence stays as dated. Decisions
D-007 to D-010 are in the source repository's `docs/decisions.md`.

**Done (18 November 2026):**

- **First install, analyze mode.** Release `20261118T024927Z-1a4b7b40a60d` (build `0e63372`) was installed on the
  Ubuntu host with OpenAlgo in analyze mode, logged in to Upstox; the R2 send lease, the owner settings, the market
  calendar and the owner-approved profile are bound. It waited in `RECOVERY_WRITING` until 17:29 IST, so no entry was
  possible. Runtime settings are bound provisionally.
- **Activated, 17:29 IST, on the owner's word.** Release `20261118T115832Z-bb7baf172aaa` (build `d63928d`, which also
  fixes the installer's stop check for timers, found by the first redeploy) replaced the first install. The owner did
  the human recovery advance, so the kernel is `OPERATING`. The standing binding
  `commissioning-binding-20261119-buyer-edge` is recorded, and BuyerEdge holds an entry grant for 19 November,
  09:15–15:40 IST (entries only, no delegation). Ledger head 29.
- **Corrections found on the host:** the strategy host could not reach its evidence folder (`452790c`); `stage
  --openalgo-key-file /dev/stdin` reads the open pipe (`452790c`); the supervisor expected kernel book reads where the
  ledger gives the kernel nothing to read, which would have refused every redeploy (`0f310f1`).
- **D-007, the early close** (`17d6353`): OpenAlgo unreachable 120 s (`reconciliation.broker_unreachable_close_secs`),
  a kernel stop, or a kernel restart mid-session records `SESSION_CLOSING`, refuses entries for the rest of the day and
  squares off under `protection.session_close` (bound to `broker`, square-off 15:13; the NFO close is 15:40 as recorded
  by OpenAlgo). This reverses CUJ-SES-1's "continue in the session".
- **D-008, activation without the market-hours check; D-009, late starts** (`a90b633`): activation keeps the flat-book,
  ledger, sender, continuity and lease checks; restore and the cutover keep the market check. The strategy timer also
  fires right after it starts (`OnActiveSec=1s`). Activating after the close stays the owner's safeguard.
- **D-010, the host stays on and the owner reads the data** (`d3645ce`): the EC2 idle auto-stop counts the installed
  kernel as work; the owner's login joins the ledger, market and assessment reader groups from the installer's
  sysusers file.
- **Session evidence, 18 November** (analyze, no entries): the R2 send lease ran 774 rounds, 772 ok; two 5 s timeouts
  (11:08 and 11:10 IST), never back to back, and one lost reply at 14:45 (the write landed; the next renewal adopted it); no R2 5xx; p95 write 1.78 s, read 0.56 s, against the bound (provisional)
  `lease_secs` 120 and `lease_renew_secs` 20. OpenAlgo 0 errors; market data complete all session (353,242 records);
  core services 0 restarts, 0 faults. Dispatch, queue and reconciliation timings stay unmeasured.
- Validation, as run on the Ubuntu host: the first full suite had 3,624 passed and 17 failed (14 expected a mid-session
  restart to continue, fixed under D-007; 1 web-console file list; 2 location-bound). Then targeted runs of 407, 759,
  567, 185, 385 and 434 passed. The full suite was not re-run after the fixes. Development runs, not production acceptance.

**Still open, in order:**

1. Before 09:15 IST on 19 November (owner): OpenAlgo logged in to Upstox.
2. The 19 November analyze session with BuyerEdge entries and its OPS09 review; the first dispatch, queue and
   reconciliation timings.
3. Replace the provisional runtime settings with measured ones (a new stage and activation, after the close).
4. Owner drill: stop OpenAlgo for 3 minutes with a position open.
5. Re-run the R1 start-anytime matrix under D-007 (run R1 predates it) when the converted days are on a machine.
6. Known gaps: a real late start during market hours is untried. A restore to release `20261118T024927Z-1a4b7b40a60d`
   fails once an early close has been recorded: that release's kernel cannot fold `SESSION_CLOSING`, so the index
   check marks the index unrepairable (`events_unfoldable`) and the kernel cannot advance. Only that one release is affected; this is not CFG-R09.

Backup integration, restic anchors and backup/restore rehearsal stay deferred until the owner asks. Live mode only on
the owner's word. The AI twin (SLICE-17), the web console and MCP are not in the first release.

## Delivery status — 2026-11-17 UTC (history; superseded by 18 November above)

Source: `AutonomousTrading/agentic-desk` at `b58abca058938878d892f4441f4758045ce09b5b`. Historical slice and audit evidence stays as dated.

**Done and pushed (17 November 2026):**

- Shared SLICE-14 restore fingerprints (`e1ed9b7`), offline OPS09 verifier (`1a950f7`), inert staging with deferred owner bindings (`0c5a0d5`).
- The installer's own read-only lease token, `/etc/autonomous-trading/installer-credentials` (`3aec1a4`): `activate`, run as at-installer, no longer needs root's backup credentials.
- Main-disk assessment storage with capacity floors and local daily sealed copies (`b88014e`; [decision](#assessment-storage-correction--owner-decision-2026-11-17-utc)).
- The account follows OpenAlgo's login, as legacy did (`1c13647`): `install.py stage --openalgo-key-file` pins the broker OpenAlgo's ping reports (OpenAlgo has no account-ID endpoint, so `account_id` is the label `openalgo`, exchange NFO); the kernel refuses new entries, never exits, while another broker is logged in. The example profile binds the host's OpenAlgo (`http://127.0.0.1:5000`), legacy's live registry (BuyerEdge on at trade, the others off) and legacy's live account limits.
- Worst-case loss per position: the owner's `30000.00`, one position's full premium (`4342691`).
- Installer records (`40b5f1b`), found by a root audit of the host preparation: a stage refused after its intent records `STAGING refused` and `resume` reports it; `check` refuses `CFG-R10 not_staged` a release without `STAGED done`. A fresh build at `40b5f1b` sits under `/opt/autonomous-trading` (export identical to git; every build-record hash verified). The host's pending profile is rebuilt from the current example.
- Credential names (`628e3f5`): the example's credential locators are now the names systemd's LoadCredential gives the files (`openalgo_api_key`; the two lease-store tokens added), held by a guard test; before, a production kernel would have refused `missing` at its first start.
- Guides (`b58abca`, `guides/` in the source repository): deployment (fresh and redeploy, rollback), office PC and server sync with a server-loss plan, a real-world checklist, and the R2 lease setup.
- Validation, as run: 1,057 targeted tests passed on the Ubuntu host for the account change (one replay skip); 445 for the storage change; 360 for the lease token. Logs are in `OA_NEW/.workspace/logs` on that host. These are development runs, not production acceptance.

**Still open, in order:**

1. The partial release `20261117T030749Z-e50268362cac` predates the current profile and build; it is not staged, verified or active, and the next stage replaces the need for it.
2. Owner bindings still unbound: R2 send-lease store and tokens, session lifetime and sessions per identity, recovery-time objective; licence and journal are report-only.
3. Timers and measured runtime settings; a legitimate market-calendar bootstrap before the first activation (never a faked closed market).
4. Artifact trust record for the `40b5f1b` build, `stage --openalgo-key-file`, `check`, root copy and activation; then genuine analyze-mode sessions and the OPS09 review.

Backup integration, restic anchors and backup/restore rehearsal stay deferred until the owner asks. Cognition, model approval and console work stay with their own slices. No trading service is active.

## About this roadmap

This document tracks the audit and architecture path toward a later production-ready AutonomousTrading build. It is directional: dates describe evidence windows and review snapshots, not delivery promises. A roadmap status follows the default branch of this repository; a source-code audit always names the separate source repository, branch, and revision it actually inspected.

**Scope and change control:** audits here optimize the module boundaries and architecture of the future AutonomousTrading project, using current and historical source audits as evidence; `AutonomousTradingArchitect` is the documentation workspace, not the implementation target. Prefer an available local source directory and/or GitHub repository for code claims. If neither is available in context, the published [target architecture review](https://manojvermamv.github.io/AutonomousTradingArchitect/) may clarify diagrams and ongoing design documents, but it is not implementation evidence. For audit-only work, report findings first and make no file edits until the user confirms the recommendations; a confirmed batch may be applied together when document edits are authorized. After confirmation, record accepted target decisions in this roadmap; update the protected master README only when the user's active-turn confirmation explicitly authorizes that edit.

Historical baseline: as of **24 October 2026 (Asia/Kolkata)**, this roadmap lives on `AutonomousTradingArchitect` branch `main`, at baseline revision `cd40cfc07e57899e2aabb643cbc80228dc433322`. For future source audits, use `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn/` as the default target branch, consistent with that repository's `AGENTS.md`, unless the user names another branch. *(Since 29 October 2026 that branch is deleted: legacy evidence is branch
`legacy`, and the build is `agentic-desk` in OA_NEW; this repository lives at `OA_NEW/.workspace/specifications`.)* The current code-audit snapshot described by the existing master README inspected `AutonomousTrading` branch `claude/openalgo-trading-architecture-uu1bxn` at revision `445eb116514d97c2574c44d4d5374f938dec57a3` on 24 October 2026 UTC. Those are different repositories and different revisions.

**25 October 2026 UTC update:** the owner accepted all ten target recommendations and explicitly authorized updates to both README.md and ROADMAP.md. Architecture pre-update baseline: `AutonomousTradingArchitect/main` at `a4c6308641d12b1a15898c05ce2bbd022cd46822`. Follow-up source audit: `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn` at unchanged revision `445eb116514d97c2574c44d4d5374f938dec57a3`. Design acceptance is recorded; implementation, tests and production acceptance remain pending. No source fixes or money-policy changes were authorized by this document update.

**25 October 2026 UTC — subsequent target-review decisions:** the owner accepted option A for requirements, option A for review ownership, and option A for the connected transaction contracts, then explicitly authorized both documents. D11–D16 map to audit items 1–6. Architecture review baseline: `AutonomousTradingArchitect/main` at `ecf39ad731ad20b9e541b238225f9ca8d1213537`, including subsequent local requirements-table and working-style edits. This is target design reasoning, not another source audit; the historical source revision above remains unchanged. Status: **proposed → accepted design; implementation, tests and production acceptance pending**. Approved money policies and source files remain unchanged.

The supplied React/TypeScript and HTML files are a 24 October audit presentation bundle. Their assessment is useful for tracing how the dashboard grouped findings; it is not proof that an issue exists in the source code. The current code-first audit and later evidence control finding status. This roadmap does not track presentation-page or UI/UX work.

**Status is scoped to the named claim:** ✅ for an audit/design row means its review and documentation are complete, not that the target is implemented or production-accepted. Source implementation status follows its pinned branch/revision and stated evidence. 🟡 means partial or awaiting proof; ⚪ means planned or dependent on a measured need/owner decision. Severity and roadmap status are different: a High finding can remain open while unrelated design work proceeds.

**Contents:** [At a glance](#at-a-glance) · [Accepted decisions and delivery order](#accepted-decisions-and-delivery-order) · [Remaining target audit order](#remaining-target-audit-order) · [Milestones](#milestones) · [Open work and evidence](#open-work-and-evidence) · [Audit history](#audit-history) · [Direction changes](#direction-changes) · [How this roadmap evolves](#how-this-roadmap-evolves) · [Working on the roadmap](#working-on-the-roadmap)

**Design status — 26 October 2026 UTC (history; see [Current delivery status](#current-delivery-status--2026-11-20-utc) above):** ✅ A01–A10 and the combined review are complete for their accepted design scope; ✅ README and ROADMAP updates are recorded. Implementation and production proof remain pending. A03 includes the source-grounded kernel-failure re-audit and owner-selected corrections; A04 recovery/release contracts are recorded; A05 extension contracts are recorded; A06 security/operator contracts are recorded. The subsequent combined A01–A06 review accepted Combined-F4 authorization recovery continuity and Combined-F5 scoped strategy-state ordering; documentation is updated and proof remains pending. A07-F1–F4 are accepted and recorded; no A07-F5 was proposed. Revised A08-F1–F5 are accepted and recorded. A09-F1–F4 are accepted and recorded; capacity proof remains pending. A10-F1–F3 and Combined-F6 are accepted and recorded. The scoped policy-baseline direction is accepted; its inventory accepted 2026-10-27 ([`specs/implementation/02-policy-inventory.md`](specs/implementation/02-policy-inventory.md), X-006). Corrected ATA-05/01/04/03/06 refinements are now accepted, with implementation proof pending. Current continuation is scoped policy reconciliation and concrete first-release specification/planning; implementation and production actions still need their own scope. This update preserves the historical rows below.

## At a glance

| | |
|---|---|
| 🎯 **Target** | A boundary-first architecture with selective reuse around deterministic financial authority, one live execution owner, OpenAlgo as the current live boundary, isolated simulation/replay, bounded cognition, reproducible research, and explainable recovery. |
| 🧭 **Roadmap and audit branches** | This roadmap lives in `OA_NEW/.workspace/specifications`, branch `claude/spec-implementation-package`. The implementation is `AutonomousTrading/agentic-desk`; the running release is in [Current delivery status](#current-delivery-status--2026-11-21-utc). The legacy audits at `445eb116` are history. |
| 🔎 **Current source audit** | Historical (legacy, 24–26 October): `AutonomousTrading` at `445eb116514d97c2574c44d4d5374f938dec57a3`, branch `claude/openalgo-trading-architecture-uu1bxn`; 24 October baseline, 25 October follow-up and scoped 26 October test/policy checks recorded below; no new runtime acceptance. Historical findings remain dated; accepted target changes are integrated in the master README. |
| 📅 **Current evidence window** | Historical audit and design records run from 25 August–4 September, 10–11 October, 20 October, and 24–26 October 2026, including later target-only reviews. The dashboard files were downloaded on 24 October at 19:12–19:13 IST; that timestamp does not establish the audit's actual creation time; first deployed-host session evidence 18 November 2026 (analyze mode, no entries); first entries, protection and exits 19 November 2026 (analyze mode); second analyze day 20 November 2026; first off-box backup proved on the real bucket and running nightly 21 November 2026. |
| 🧱 **Delivery shape** | Define justified boundaries, select reusable code, prove isolated target slices, and consolidate authority only after parity, recovery and fencing proof. Canvas and research may progress in parallel against stable contracts. |
| 🛡 **Decision boundary** | No roadmap item changes scores, thresholds, entry policy, emergency permissions, or live activation without the required evidence and owner decision. No audit label alone authorizes a broker-changing action. |

## Accepted decisions and delivery order

**Design around the best justified boundaries, then reuse code only where it fits. Preserve approved money policies and useful contracts—not accidental directory layouts, coupling, or implementation limitations. These are recommended improvements; implementation tests and measurements must establish their correctness and practical benefit.**

The [master README](README.md#25-october-follow-up-audit-and-accepted-target-decisions) owns target behavior, evidence and the clean Python layout. This roadmap owns work order and acceptance status. D01–D10 and the later D11–D16 refinements are **accepted as design on 25 October 2026 UTC; implementation and acceptance proof are pending**. [D11–D16 in the master README](README.md#accepted-requirements-and-transaction-refinements--25-october-2026-utc) map to the six later audit items and define their behavior. D01–D10 retain the original discussion IDs and D11–D16 identify the six later choices; the order below groups work by dependencies. Existing F1–F9 audit identities are retained, not replaced or renumbered.

| Delivery order | Accepted decision and target owner | Practical acceptance proof |
|---|---|---|
| 1 — define boundaries | **D07: pure planning and explicit effects** — `kernel.planner`, neutral contracts and application composition | Plan computation performs no state/network writes; both versioned planners retain approved financial outputs, required precedence and identity contracts; incidental source call order is not a requirement (D11). Corrected defects have explicit changed expectations. Activation proof seals retain their security meaning. |
| 2 — define financial outcomes | **D01: truthful outcomes** — `contracts.execution`, coordinator and projections | After broker acceptance, inject projection failure: expose accepted/unresolved status and IDs; no resend. Separately test canonical outcome-write failure and conservative reconciliation. |
| 2 — share lifecycle | **D03: one command lifecycle** — `kernel.lifecycle` | Entry/cancel/modify/close each cover not-sent, rejected, acknowledged, ambiguous and reconciled outcomes across restart; no stale command intent. ACK is not fill or settlement. |
| 3 — establish installable composition | **D05: packaged application and versioned releases** — packaging, settings and operations | Shipping manifest, packaged defaults/schemas/migrations, declared commands and external mutable roots work without checkout/`.git`; failed staging leaves prior release untouched; rollback preserves current financial history. |
| 3 — share configuration | **D06: one worker settings contract** — `settings.schema`, deployment renderer and jobs | Both rendered research profiles accept intentional settings, complete an isolated job and reject forbidden credentials. No blanket market-hours gate. |
| 4 — consolidate financial state | **D02: canonical monetary admission** — `kernel.admission`, reservations and ledger | One transaction binds admission, amount/margin, account/state heads and command identity. Concurrent insufficient-capacity requests cannot both pass; crashes leave no orphan acceptance/reservation; JSONL is a verified projection. |
| 4 — prove integrity | **D04: event-derived state verification** — `kernel.ledger.projections` | Alter epoch/command/broker indexes without changing events: mismatch is detected before financial authority proceeds. Clean reconstruction agrees at the required head. |
| Parallel after contracts | **D08: explicit causal Canvas** — market/view/Canvas | Explicit cutoff, availability and freshness policies; late corrections and future bars cannot change earlier as-known facts. Geometry and interpretation remain distinct. |
| Parallel after contracts | **D09: enforced cognition capabilities** — cognition ports and operations isolation | Native descendants cannot reach financial sockets/keys, mutable production files or protected evidence; permitted egress and resource caps work; job submission does not require mutual implementation imports. |
| Before activation | **D10: recovery proof before cutover** — operations/recovery | Restore the candidate artifact/schema/backup on a clean isolated host; prove crash recovery, identity/custody continuity, refusal before fencing and exclusive activation. Actual cutover still needs fresh reconciliation and external old-writer fencing. **Owner note — 18 November 2026:** there is no cutover. The legacy host was lost on 13 November; SLICE-15's fresh start replaced the cutover. The first release runs in analyze mode with backup deferred; the backup and clean-host restore rehearsal stay open before live. **Owner amendment — 19 November 2026 (D-015, source `docs/decisions.md`):** no history import and no cutover; the shadow, legacy adapters, history import and installer cutover commands are being removed. **Owner amendment — 21 November 2026 (D-017):** the nightly backup runs, to R2 as plain objects, proved on the real bucket. The clean-host restore rehearsal stays open before live. **Owner amendment — 23 November 2026 (D-020, D-021):** an owner restore command exists (A2: list, rehearse into a throwaway folder, restore onto a new server); the clean-host restore rehearsal stays open before live. |

The six later choices refine the delivery order above; they do not add six serial release gates or replace the original decisions:

| Dependency order | Accepted choice and target owner | Acceptance proof and real dependency |
|---|---|---|
| **First: D11 / audit item 1** | Requirements before source parity. Each domain owns its behavior; composition connects it. Classify approved policy, supported compatibility, architectural choice, historical behavior and unknowns before selecting code. | Every meaningful requirement names its reason, owner and independent expected outcome. Source tests/fixtures are assessed for fit and provenance; changed expectations are explained. No need to repair the source first. |
| **Next: D12 / audit item 2** | Cognition produces review evidence; `kernel.policy` applies approved rules and `kernel.admission` verifies the exact binding. | All entry routes reject bypass and mismatched evidence; recorded live/replay application agrees, including approved timeout/unavailable behavior. Reuse generation code and relocate application logic without duplicating it. |
| **Together: D13 / audit item 3** | Coordinator revalidates relevant dependencies and durably claims dispatch through the sole writer. | Pause/crash between admission and dispatch, change relevant state/deadline/hold/authority, and verify stale admission cannot send. Distinguish demonstrably unsent work from possibly sent attempts; specify hold ordering without inventing new policy. |
| **Together: D14 / audit item 4** | One logical command retains linked attempt identities across caller retries and recovery; adapter/client cannot secretly repeat effective requests. | Recording endpoint plus disconnect/crash injection proves existing-state responses to duplicates and no blind retry after possible transport. Remote deduplication claims require endpoint-specific evidence. |
| **Together: D15 / audit item 5** | Adapter reports coverage evidence; reconciliation owns identity matching and resolution. | Missing pages, delayed fills, inconsistent snapshots and unrelated manual orders cannot resolve an uncertain command merely by omission or similarity. Synthetic checks proceed independently; deployed completeness claims wait for their own evidence. |
| **Together: D16 / audit item 6** | Lifecycle determines transitions, reservations computes approved accounting consequences, and the existing ledger writer commits them with evidence atomically. | Duplicate/reordered fills, partial cancellation and multi-leg outcomes cannot double-count or release unproved capacity. Define capacity measures, corrections and revaluation explicitly; keep command, order and position lifetimes distinct. |

Specify D13–D16 as one connected contract after D11–D12, then prove it in the disarmed vertical slice and canonical-state work. Retain the clean package structure: no new financial journal, sender or service. Lower-level deadlines, valuation changes and emergency permissions are not implicitly approved. Existing D10 recovery/fencing proof remains attached to activation; independent development and research do not wait for broker acceptance or market close.

This order does not require patching `~/AutonomousTrading` before building the target. That source remains read-only under the current instruction. Work on a later implementation needs its own authorized workspace; these files do not create one. Candidate reuse mappings may change when evidence supports a better implementation. A broad rewrite is not assumed, and an existing implementation is not presumed best merely because it exists. (Since built: `AutonomousTrading/agentic-desk` in OA_NEW; `~/AutonomousTrading` no longer exists.)

Dated acceptance sections below preserve the instructions and next-step notes from their original sessions; historical pauses or commit restrictions do not supersede current user authorization. Current accepted scope and continuation are summarized above and in the affected ATA section.

### Independent-review agreements

**25 October 2026 UTC:** independent report reviewed against `AutonomousTradingArchitect/main` at `70e1e539f1dc8a890b12d68525d125df8dd14012`, with the local module-shorthand clarification preserved. Owner accepted corrected options A for AUD-01–AUD-05. [README contracts and disposition](README.md#accepted-independent-review-refinements) own behavior; no new source inspection or implementation proof is implied.

| Finding | Accepted direction | Delivery and acceptance |
|---|---|---|
| **AUD-01** | Explicit entry/cancel/modify/close variants with kernel-side validation of actual effects, targets and actor permissions. | Refine D12/D13 contracts before implementation; test mislabelled protective requests, oversized closes, wrong targets and stale relevant state. Non-entry is not assumed risk-reducing. |
| **AUD-02** | Atomic classified outcome, lifecycle and applicable accounting transition. | Refine D01/D03/D16 together; fault-inject each commit boundary and prove complete transition or preceding recoverable state. No fixed transaction count per command lifetime. |
| **AUD-03** | Label review-binding evidence and record non-dispatch decisions consistently. | Refine D12 and shared-engine proof; compare approved decisions/evidence across modes without demanding identical call graphs or new PAUSE semantics. |
| **AUD-04** | ✅ A03 reader/observation design recorded; concrete security and recovery proof remains open. | Prove bounded independent committed reads, enforced read-only observation access, progress, latency and log growth under A04/A06; no zero-delay or assumed credential guarantee. |
| **AUD-05** | Compare in-place upgrades with verified import; selection remains open. | Add A02/A04 database conversion proofs preserving original event bytes, identities/provenance and checked derived state; expose historical gaps and choose schema files only after evaluation. |

AUD-01–AUD-03 are accepted design clarifications awaiting implementation proof, not newly proven source defects. AUD-04 was subsequently refined by accepted A03/A06 independent-read and observation contracts; implementation proof remains. AUD-05 leaves database upgrade versus import undecided; ATA-03 separately selects the initial authority-transfer boundary. AUD-06 was rejected as stated: retain the historical research date and actual commit history. Existing money permissions, the clean package layout and independent development remain unchanged.

### A01 design acceptance and delivery

**25 October 2026 UTC:** owner accepted the recommended options for A01-F1–F5 following target-only review of `AutonomousTradingArchitect/main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e`. Status: proposed findings → accepted design; implementation/tests/production proof pending. [README A01 decisions](README.md#accepted-a01-time-and-market-data-decisions) own behavior and alternatives. No new source inspection or money-policy choice is implied.

| Decision | Delivery dependency and owner | Acceptance evidence |
|---|---|---|
| **A01-F1** | Define stable view identity and retained input references first; `market.view/store` and shared contracts. | Interleave reads/ingestion/corrections, reopen the same identity and reproduce inputs and geometry; a new view may see newer data. |
| **A01-F2** | Define source identity/coverage and history/live overlap against F1; sources and ingestion. | Duplicates, conflicting revisions, interrupted backfill/retry and missing intervals preserve attributable selection and cannot invent earlier application knowledge. |
| **A01-F3** | Define small consumer requirement/assessment contracts alongside F4; strategies/algorithms, view and quality. | Warm-up, optional/missing/stale inputs, gaps, duplicates and join skew have independent expected assessments scoped to each operation. |
| **A01-F4** | Pin shared calendar/window semantics for F1/F3; market contracts/view. | Boundary, break, shortened-session, partial-window and late-finalization checks distinguish closure, coverage and usability. |
| **A01-F5** | Recompute derived results from resolved F1/F2/F4 inputs; algorithms and Canvas history. | Old views remain reproducible; corrected new facts match independent calculations and any incremental/restart path. |

Implement these within the existing market/Canvas packages and disarmed proof lanes; do not create a second ingestion path or a global readiness gate. Exact thresholds and financial consequences remain governed. A02 subsequently accepted the compatibility/configuration contracts below; preserve A01 decisions as their inputs rather than repeating them by default.

### A02 design acceptance and delivery

**25 October 2026 UTC:** owner accepted A02-F1–F5 with precise internal-version, per-process resolver, immutable-settings, exact-bundle and migration-accounting formulations. Target review baseline: `AutonomousTradingArchitect/main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local accepted A01 edits. Status: accepted design, implementation and production proof pending. [README A02 decisions](README.md#accepted-a02-compatibility-and-configuration-decisions) own behavior; no trading-source audit or financial-policy change is implied.

| Decision | Implementation owner and dependency | Acceptance proof |
|---|---|---|
| **A02-F1** | Domain contracts and authenticated boundaries validate exact internal versions; compatibility adapters support only named persisted-history, frozen-bundle and external operator/MCP interfaces. | Mixed same-release processes, unknown variants and supported conversions yield explicit correct interpretation or scoped incompatibility. Cognition receives no financial socket capability. |
| **A02-F2** | `settings.loader/schema` first defines shared deterministic defaults → profile → scoped env resolution and canonical shared projections. | Reject simultaneous old/new aliases; verify null/omission, unknown keys, changed defaults, scoped digest agreement and redaction. Whole-process settings need not match. |
| **A02-F3** | Bootstrap/operations activates immutable per-process revisions at restart/session boundaries using F2. | File changes cannot alter active settings; partial activation/restart exposes applicable revisions. Runtime safety controls, orders and reconciliation remain state operations; research stages candidates and Tier-1 verifies session binding. |
| **A02-F4** | Operations validates an exact tested artifact/resource/dependency/schema bundle using F1–F3; ledger schema owner checks database capability. | Missing/substituted artifacts or unsupported current schema/event formats prevent dependent activation/rollback. Event-sequence growth alone does not invalidate rollback, and history is never rewound. |
| **A02-F5** | Ledger migration/recovery and compatibility code define pinned source boundaries and record accounting before A04 selects upgrade/import. | Every captured record has an attributable disposition; original evidence remains intact, derived state reconciles and unknown authoritative records block dependent financial activation. Quarantine alone is not successful migration. |

Apply these within D05/D06 packaging/settings and D10/AUD-05 recovery work. A02 design scope is complete; no schema/import route or new migration file is selected. A03 and A04 are now design accepted; capture/resume and database conversion proof remain implementation work; the later ATA-03 decision selects the initial flat handoff. All isolated work remains independent of unrelated production readiness.

### Accepted runtime and outage contracts — A03

**25 October 2026 UTC — design accepted, implementation proof pending.** The [master runtime contracts](README.md#runtime-progress-and-kernel-failure-behavior) own behavior and module boundaries. Review baseline was architecture `main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02 edits. Read-only re-audit inspected trading branch `claude/openalgo-trading-architecture-uu1bxn` at `445eb116514d97c2574c44d4d5374f938dec57a3` and OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. No broker calls, live fault tests or production-readiness claim. Source mechanisms are optional reuse, not inherited architecture.

| Decision | Delivery responsibility | Acceptance evidence still required |
|---|---|---|
| **A03-F1** | Coordinator separates bounded I/O from serialized state processing; one outbound request per account initially. | Slow HTTP versus whole-kernel failure, requested/applied holds, late results and uncertain conflicting dispatch; no hidden retries. |
| **A03-F2** | Canonical ledger owns admitted durable work; memory triggers are reconstructible; each producer owns overload handling. | Queue saturation/restart, lost acceptance replies and identity lookup, explicit unaccepted BUSY, memory bounds and ingestion coverage gaps. |
| **A03-F3** | Jobs own detached leases; cognition owns deadline/cancellation containment; financial cancel remains an authorized action. | Disconnect and late-result matrix; no expired intent revival, orphan descendants or premature resource release. |
| **A03-F4** | Supervisor uses bounded independent committed-ledger reads, enforced read-only OpenAlgo observations and non-authoritative outage evidence. Ordinary reads remain scoped IPC/API. | Last commit newer than export, consistent head/projections, query/checkpoint/WAL budgets, wrong domain/partial observations, denied observer writes and deduplicated recovery ingestion. A06 verifies native permissions or the restricted observation boundary. |
| **A03-F5** | Supervisor measures demand-aware progress/protection status; recovery retains one financial owner. | Idle versus stalled demand, broker-held versus local/uncertain protection, resource exhaustion, old-process termination and uncertain attempts. A04 selects restart eligibility/fencing/activation details; host failure is a separate recovery case. |

**Direction correction:** snapshot-only preference was superseded by independently verified committed reads with explicitly limited snapshot fallback. Independent assessments do not settle financial state; stale or missing evidence remains visible. Controlled recovery of the same kernel is accepted in principle, not automatic restart permission. Keep A03 IDs stable, existing packages coherent, approved money policies unchanged and independent development ungated.

### Combined A01–A03 review and corrections

**26 October 2026 UTC — ✅ audit complete; ✅ accepted document updates complete; implementation proof pending.** Target-only review at architecture `main`, `842fe1f007b9ef5ccfdcb9e90223597dced56ff9`, with independent review; no new source/runtime/broker verification. The [master combined decisions](README.md#accepted-combined-a01a03-corrections) own behavior. Preserve the existing AGENTS goal update and all unaffected accepted choices.

| Decision | Responsibility and delivery dependency | Acceptance proof still required |
|---|---|---|
| **Combined-F1** | Shared contracts/adapters define time semantics across A01 cutoffs and A03 deadlines; A04 reconstructs deadlines after restart. | Forward/backward jumps, skew, tied times and restart preserve approved expiry and broker uncertainty; replay uses recorded timing evidence. |
| **Combined-F2** | Market/outage owners publish durable evidence and own retention; ledger commits verified references. Specify this before recovery ingestion and cleanup. | Crash around publication, reference commit and handoff; cleanup preserves required evidence; retries do not duplicate effects. Small normalized evidence may be inline. |
| **Combined-F3** | Compatibility reads supported historical worker evidence; internal live contracts remain exact-version. | Old live workers are rejected for the affected operation; supported historical evidence retains identity and meaning. |

Carry these through A04 recovery sequencing and A08 acceptance. No numerical money/timing policy, live permission, new service or rolling-version support is selected. The audit does not require reopening A01–A03 or block independently isolated work.

### A04 recovery and release acceptance

**26 October 2026 UTC — ✅ audit complete; ✅ accepted README/ROADMAP updates complete; implementation and production proof pending.** Owner selected A for A04-F1–F5 after target review with independent cross-check at architecture `main`, `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e`. No new source/runtime/broker verification. The [master A04 decisions](README.md#accepted-a04-recovery-and-release-decisions) own behavior and trade-offs.

| Decision | Delivery owner and dependency | Required acceptance proof |
|---|---|---|
| **A04-F1** | Recovery/authority separates inspection, exclusive recovery writes and authorized operation; admission remains action-specific. | Interrupt each stage; repair cannot dispatch, deadlines remain meaningful, unrelated warm-up does not become a universal gate. |
| **A04-F2** | Operations supplies termination/fencing evidence; recovery/authority establishes exclusion; coordinator preserves outstanding attempts. | Frozen owner, orphan descendant, delayed external completion and attempted dual startup; no resend justified by restart alone. |
| **A04-F3** | Deployment/bootstrap records actual participant/schema transitions and independent observation compatibility; kernel controls activation. | Fail each release step, resume from recorded state, expose coverage loss and reject software rollback incompatible with current financial history. |
| **A04-F4** | Migration/schema/recovery and compatibility owners establish pinned capture, resumable progress and final handoff. | Repeat/interrupt batches, change source boundaries and introduce unknown authoritative records; account for all records. Choose upgrade/import only from actual mappings and recovery comparison. |
| **A04-F5** | Backup/restore coordinates ledger, artifact and evidence owners through a verified recovery manifest. | Clean-host restore with missing/substituted objects, older capture and stale custody; preserve uncertainty and consumed status, report scoped gaps. Include Combined-F4 authorization continuity and unavailable-current-authority scenarios. |

These accepted contracts do not authorize automatic financial activation, new emergency permissions or a particular database upgrade/import method. The later ATA-03 decision selects the initial flat handoff. A05 is now accepted and A06 is now accepted; A07 was next at that stage; A04 implementation proof remains part of release/recovery acceptance and A08 verification. Independent development remains ungated by unrelated production evidence.

### A05 strategy and cognition acceptance

**26 October 2026 UTC — ✅ audit complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Owner accepted all five recommended options. Target review with independent cross-check used `main` at `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e` plus local accepted A04 edits; no new source/runtime/broker verification. The [master A05 decisions](README.md#accepted-a05-strategy-and-cognition-decisions) own behavior.

| Decision | Delivery responsibility | Acceptance proof |
|---|---|---|
| **A05-F1** | Registry/bootstrap validates explicit descriptors before host loading; separate decision method, hosting and granted capabilities. | Supported deterministic/model combinations, invalid descriptor rejection before execution, no grant inferred from registration. |
| **A05-F2** | Worker owns invocation/state/output handoff with stable identities; kernel owns financial acceptance. | Crash before/after state, publication and acceptance; repeat input/handoff, reset session, verify no lost output or duplicate logical decision. Combined-F5 adds distinct overlapping invocations and predecessor/order validation within each mutable state scope. |
| **A05-F3** | Model strategy generates intent; review evaluates a fixed intent; shared infrastructure uses distinct typed purposes. | Wrong-role or swapped/mutated intent evidence rejected; no new mandatory review or circular generation. |
| **A05-F4** | Runtime/records validates typed role outcomes and pinned blueprint assembly with team-specific synthesis. | Required/optional failures, malformed lead output, duplicates and late results preserve approved consequences and deadlines. |
| **A05-F5** | Providers/records retains requested/reported execution identity and context/tool/result/attempt evidence under existing custody rules. | Provider substitution/unknown revision/permitted fallback attributable; recorded replay needs no new inference. |

Use existing packages and a small explicit registry/shared validators initially; no dynamic discovery framework, duplicate planner or financial authority. A06 is now accepted; A07 was next at that stage; security mechanism proof remains separate from descriptor claims. A04 pending implementation and all earlier accepted policies remain intact.

### A06 security and operator acceptance

**26 October 2026 UTC — ✅ audit complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Owner accepted all recommended A06-F1–F5, authorized committing/pushing the documentation and requested a pause afterward. Target baseline: architecture `main`, `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e`, plus local accepted A04/A05 edits; independent cross-check, no new source/runtime/broker verification. [Master A06 decisions](README.md#accepted-a06-security-and-operator-decisions) own behavior.

| Decision | Delivery owner and selected approach | Required proof |
|---|---|---|
| **A06-F1** | Interfaces authenticate/delegate; kernel validates scoped grants independently, including relevant dispatch-time expiry/revocation. | Forged actor, scope escalation, cross-account use and revoked queued requests; no recall or erasure of initiated effects. Combined-F4 tests recovery of stale grants without resurrecting permission. |
| **A06-F2** | Existing adapter/operations boundaries use proved native read grants or isolated typed observation mediation. | Read availability with kernel down; reject writes, arbitrary routing, secret access and direct bypass; attribute actual account/domain. |
| **A06-F3** | Secrets/deployment/isolation provisions protected references and explicit supported replacement transitions initially. | Old-credential retirement, read failures, uncertain effects, and secret exclusion from descendants/diagnostics/evidence/backups. |
| **A06-F4** | Interfaces bind exact operator intent and policy-required confirmations, using server-side records initially; each owner validates its operation. | CSRF, substituted target/arguments, replay, stale/cross-principal receipts and compatibility-route bypass; Combined-F4 also tests restored invalidated sessions and consumed confirmations. |
| **A06-F5** | Tools/interfaces/custody/isolation use fixed typed projections and explicit disclosure destinations initially. | Cross-account/partition/cache access and sensitive export through allowed but unauthorized destinations. |

No new emergency permissions, global confirmation requirement, policy engine or mandatory observation-service package. Deployment must prove the actual enforcement. The session paused here with A07 next.

### Combined A01–A06 acceptance and follow-through

**26 October 2026 UTC — ✅ reviewed audit scope complete; ✅ accepted README/ROADMAP updates complete; implementation and production proof pending.** Architecture `main` at `ea9caedde201c65e6481cd430c1c30bfe273dcd1`; independent target-only review with two separate reviewers, no new source/runtime/broker verification. Owner accepted option A for both [master clarifications](README.md#accepted-combined-a01a06-clarifications), authorized these document updates, and did not authorize commit/push. Earlier choices and AGENTS goal update remain intact.

| Decision | Delivery ownership and dependency | Acceptance proof still required |
|---|---|---|
| **Combined-F4** | Authorization/kernel authority establishes current security-state source and continuity; backup/restore coordinates it with A04-F5. Verify current grants/sessions/confirmation status or invalidate affected restored authorization and re-establish through existing authorized paths. | Restore a snapshot captured before a later grant revocation, session invalidation or confirmation consumption. Test same and new request identities, reads/disclosure and dispatch; unavailable continuity cannot revive authority. Independently authorized reconciliation continues. Blanket invalidation of unaffected access is not selected. |
| **Combined-F5** | Worker declares mutable state scopes and serializes dependent invocations initially; validates predecessors before recoverable successor/output publication. Carry through A01 correction ordering, A03 scheduling and A05-F2 recovery. | Distinct overlapping invocations sharing a predecessor, reversed completion, correction/reset and crash yield one declared lineage and attributable outputs with matching replay. Independent scopes/stateless work remain concurrent; admitted commands are not implicitly cancelled. |

Carry both through A08 failure/acceptance work and A10 integration. No package split, new service, money-policy change or universal development gate. Optimistic state execution is deferred until measured need and conflict/recovery proof. A07 remained next at that stage; that update did not start it.

### A07 research and governed improvement acceptance

**26 October 2026 UTC — ✅ reviewed scope complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Target-only audit at architecture `main`, `4b23abc9081d492e217938f50354f8a411e714cb`; no new source/runtime/broker proof or protected-evidence access. Owner accepted the recommended directions and authorized documentation only, without commit/push. The report contained **A07-F1–F4**, not F5; no fifth finding or acceptance is invented. [Master A07 decisions](README.md#accepted-a07-research-and-governed-improvement-decisions) own behavior.

| Decision | Delivery owner and selected direction | Required proof and trade-off |
|---|---|---|
| **A07-F1** | `research.datasets` records permitted fitting population, learned transformation identity and application population; custody enforces access. Evaluation applies frozen fitted artifacts. | Change evaluation data without changing training-fitted artifacts; reject unauthorized fitting. More provenance than fit-free transforms, without restricting useful research to them. |
| **A07-F2** | `research.trials` owns experiment specification, attempts, statuses and selection history; `research.jobs` owns execution leases/resources. Register attempts before execution and link compatible checkpoint resumes. | Interrupt metrics/checkpoint publication and duplicate job delivery; no omitted attempts or conflicting accepted results. Resume checks cost complexity; restarting from scratch remains possible with retained history. |
| **A07-F3** | `research.rl.environment` retains proposed action, admission decision, simulated execution and resulting state; `reward` derives the versioned objective from that transition with separate economic and shaping components. | Rejections, delayed/partial fills and open exposure at episode end reconcile independently to state and reward. Shared-engine evaluation costs compute; abstract exploration has explicitly limited claims. |
| **A07-F4** | Evaluation produces claim-bound evidence; promotion records approval of exact candidate, relevant inference configuration, evidence and deployment/session scope; Tier-1 verifies applicable authorized binding. | Substitute artifact/configuration/session scope between approval and activation; reject dependent activation while preserving obligations. Record storage may be bundle-contained or separate; no new store is mandated. |

Carry A07-F1 through dataset/frozen-artifact construction, F2 through A03 detached execution, F3 through shared replay/evaluation, and F4 through A02/A06 session activation and authorization continuity. A08 consolidates their independent acceptance evidence. No new money policy, promotion threshold, service or blanket development gate. The session paused after those updates with A08 next.

### Revised A08 verification acceptance

**26 October 2026 UTC — ✅ reviewed scope complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Owner selected A for revised A08-F1–F5 and authorized these updates without commit/push, then pause. The [master A08 decisions](README.md#accepted-revised-a08-verification-decisions) supersede the earlier four unaccepted proposals. Target `main`, `4b23abc9081d492e217938f50354f8a411e714cb`, plus local accepted A07; source `claude/openalgo-trading-architecture-uu1bxn`, `445eb116514d97c2574c44d4d5374f938dec57a3`. Static inventory: 410 Python files under tests/, 397 with test definitions, 6,875 definitions; 191 files use parameterization. Selected bodies/source inspected; no collected-case count, obsolete-test percentage or passing-test claim. No source mutation or protected-data access.

| Decision | Delivery owner and selected approach | Acceptance proof and trade-off |
|---|---|---|
| **A08-F1** | Target module owners write requirement-based tests fresh; selectively reuse inspected fixtures, scenarios or helpers. | A legacy checkout is unnecessary for the core suite. No bulk migration or prerequisite classification of every legacy test. Fresh tests cost effort but avoid inherited requirements. |
| **A08-F2** | Existing unit/contract/isolation groups test observable behavior and only justified structural safety/ownership boundaries. | A private-helper refactor preserves passing behavior tests; a forbidden broker-access dependency fails its boundary check. Broad layout/prose guards are not inherited. |
| **A08-F3** | Strategy, policy, admission and lifecycle owners specify independent expected outcomes; legacy comparisons cover explicitly retained behavior only. | Detect a wrong outcome even when old and new implementations agree; approved corrections have explicit expected differences. No duplicate financial engine or money-policy change. |
| **A08-F4** | Bootstrap/settings and test infrastructure provide explicit configuration, temporary stores and small synthetic fixtures; permitted versioned captures add realism where needed. | Core tests run on a clean machine without legacy checkout, credentials or trading history; installed artifacts work outside checkout. Retain effective resource/filesystem protection. |
| **A08-F5** | Existing test groups and release/recovery tooling separate fast rule tests, focused integration and recovery/isolation campaigns; choose checks by affected risks. | Consolidation retains important fault detection; measure runtime, flakiness and distinct risk coverage. Required production acceptance remains; no arbitrary test-count cap or blanket full-campaign gate for ordinary edits. |

Begin fresh tests with each target implementation slice; no exhaustive legacy-test classification gate. Reuse scenario knowledge as relevant, keep approved money rules and preserve production-dependent acceptance. Existing test groups suffice; no new framework/service. At that stage A09 was next and the A07 updates were still uncommitted; later publication is recorded in git history.

### A09 deployment and optimization acceptance

**26 October 2026 UTC — ✅ reviewed scope complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Target-only review at architecture `main`, `5ff225c0d0868ff266a3814dd278e82327040a6d`; no new source/runtime/broker verification or capacity measurements. Owner accepted A09-F1–F4 and authorized documentation without commit/push, then pause. [Master A09 decisions](README.md#accepted-a09-deployment-and-optimization-decisions) own behavior.

| Decision | Delivery ownership and selected approach | Required proof and trade-off |
|---|---|---|
| **A09-F1** | Settings/bootstrap/deployment define supported compositions and required participants; optional workers run when needed. | An unrelated research outage does not block trading; missing required capability follows approved scoped consequences. Full-service deployment is simpler to configure but costs idle resources. No new AI fallback or all-services-ready gate. |
| **A09-F2** | Isolation/deployment define aggregate host resource envelopes and admission for optional background work, including descendants. | Exercise concurrent research/tests/builds/backups and measure kernel, ingestion and supervisor progress. Derive limits/headroom from measurements; another host offers stronger separation at greater cost. No market-hours ban or new financial priority. |
| **A09-F3** | Storage owners classify authoritative state, required evidence, reproducible artifacts and disposable scratch; deployment/isolation enforce capacity separation or quotas. | Fill isolated scratch allocation, then inject critical-store failure separately; no false success, unsafe resend or deletion of required evidence. Separate physical storage is an alternative, not mandated; directories alone are insufficient isolation. |
| **A09-F4** | Verification/telemetry records pinned workload, artifact/configuration and host/storage environment; compare measured improvements within existing operations boundaries. | Reproduce the bottleneck and compare correctness, tail behavior, recovery, resource interference and cost. Separate local processing from external delay. No invented capacity/latency/RPO/RTO values or infrastructure without demonstrated need. |

Specify supported compositions through existing settings/bootstrap/deployment first. Resource and storage proofs can proceed independently in isolated environments; measure their combined behavior before the dependent production claim. A10 integrates the accepted boundaries; no new service/package is required. Earlier money policies and A01–A08 remain intact. The session paused with A10 next at that stage.

### A10 coherence and delivery acceptance

**26 October 2026 UTC — ✅ reviewed scope complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Target `main`, `5ff225c0d0868ff266a3814dd278e82327040a6d`, plus accepted local A09 edits; document-only review, no new source/runtime/broker proof. Owner selected A for A10-F1–F3 and authorized coherent updates without commit/push, then pause. [Master A10 decisions](README.md#accepted-a10-coherence-and-delivery-decisions) own behavior.

| Decision | Delivery ownership and approach | Required proof and trade-off |
|---|---|---|
| **A10-F1** | Both target diagrams explicitly distinguish strategy hosting, typed review evidence, record-only advice, scoped research submission and custody-controlled access. | Trace entry review, advice application and research requests through diagrams and prose; owners/checks agree. A legend-only alternative is more compact but leaves critical boundaries implicit. No new process/package mandated. |
| **A10-F2** | Settings/bootstrap/deployment define one first-release composition with required, optional and deferred capabilities, preserving the full target. | Run with deferred services absent; required decision/execution/protection/evidence/recovery paths remain complete, including executable continuity for outstanding obligations under Combined-F6. Implementing every capability first offers breadth but delays integration. Selected strategy and unresolved owner policies are not silently chosen. |
| **A10-F3** | Compatibility and migration owners identify each surface's purpose, consumers and retirement obligations. Retire obsolete live routes while retaining or replacing verified required historical readers. | Remove a candidate route in isolation and exercise supported callers, replay, restore and Combined-F6 outstanding-obligation continuity. Indefinite compatibility costs maintenance; retirement cannot make required evidence unreadable or authorize deletion. |

Next authorized planning should select the actual first-release workflow and classify its capability dependencies using the [composition contract](README.md#first-release-composition-and-full-target-scope), then build fresh A08 requirement-based tests and isolated slices. Do not invent a strategy/account choice or resolve owner money policies by default. Historical reader retirement needs compatibility/recovery proof. Full target capabilities remain in scope for later delivery; optional extensions are not universal release prerequisites. That session paused without implementation or publication authorization; later explicit instructions govern subsequent work.

### Combined A01–A10 continuity acceptance

**26 October 2026 UTC — ✅ reviewed scope complete; ✅ README/ROADMAP updated; implementation and production proof pending.** Owner accepted option A and authorized publication. Target-only review of `AutonomousTradingArchitect/main`, `a4c6308641d12b1a15898c05ce2bbd022cd46822` → `2f051ddaae8b77c99712251d203efb307ebac85c` (ten commits); no fresh trading-source/runtime/broker proof. [Master combined clarification](README.md#accepted-combined-a01a10-continuity-clarification) owns behavior.

| Decision | Delivery ownership and dependency | Required acceptance proof |
|---|---|---|
| **Combined-F6** | Kernel lifecycle/protection retain outstanding-obligation bindings and required state; recovery checks executable continuity at the actual activation head; settings/bootstrap/deployment provide a compatible single-owner composition. Extend A02-F4/A04-F3 and A09-F1/A10-F2/F3 checks before dependent activation or support retirement, preserving A05-F2/A07-F4 bindings. | Exercise release/session change and rollback with partial fills, uncertain cancellation and active protection; introduce late fills and handoff crashes. Verify applicable behavior/state, reconciled obligations, stable command identity, current authorization/safety and exclusive authority. Reading historical formats alone must not pass. |

Prefer one current bundle retaining only required behavior. If support is unavailable, defer the affected transition and keep the existing authorized composition only where safe. Explicit behavior migration needs separate governance and any required money-policy decision; no automatic flattening or second writer. Isolated development remains independent. The introductory README test row is aligned with accepted A08; no new test-migration requirement or decision replaces it.

### Scoped policy baseline acceptance

**26 October 2026 UTC — ✅ corrected ATA-02 direction accepted; ✅ documentation updated; inventory reconciliation and implementation proof pending.** Owner selected option A (reply “1”) and authorized these documents and publication. Target pre-update baseline: `AutonomousTradingArchitect/main`, `a85c5f10eb169ad0fe5bf5a6cecb58b0e40eb7e3`. Static supporting source: `AutonomousTrading/claude/openalgo-trading-architecture-uu1bxn`, `445eb116514d97c2574c44d4d5374f938dec57a3`; OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. No fresh runtime or broker proof. [Master baseline contract](README.md#accepted-scoped-policy-baseline) defines the behavior and required fields.

(Since done: inventory accepted 2026-10-27 ([`specs/implementation/02-policy-inventory.md`](specs/implementation/02-policy-inventory.md), X-006).) Next requirements work reconciles applicable approvals into README §9 with provenance, scope, supersessions, observed implementation, target owner/status and independent expected outcomes. Separate host settings and historical conventions from target-wide requirements. Do not mark all emergency, promotion or recovery choices resolved from a partially applicable record. Preserve applicable approvals; only genuine conflicts or new choices need owner input. That acceptance alone did not accept the remaining ATA findings; the later affected-refinement section records subsequent choices.

Acceptance evidence is a traceable policy map with conflicts explicitly retained, not a blanket claim that the legacy register or code is correct. Dependent specifications use that map; unrelated isolated work proceeds. Keep first-release selection, fresh A08 tests and the existing clean package structure. No production action or policy change is authorized.

### Independent ATA report dispositions

**26 October 2026 UTC — review assessment recorded; not blanket design acceptance.** The supplied `ATA-audit-a4c6308-a85c5f1.md` reviewed architecture range `a4c6308641d12b1a15898c05ce2bbd022cd46822` → `a85c5f10eb169ad0fe5bf5a6cecb58b0e40eb7e3`. This table preserves the primary agent's subsequent assessment and the owner's narrower acceptance of corrected ATA-02, recorded at `a834767c6b41ff432d91e18c08e7c98a327ec157`. Supporting review evidence is pinned in the scoped-baseline section above. The initial record did not approve pending recommendations. The subsequent acceptance below records the five corrected choices; all other dispositions retain their stated scope. The external follow-up's phrase “declines the rest” is inaccurate: several narrower clarifications were pending then and five have since been accepted as corrected contracts below, rather than rejected wholesale.

| Report ID | Review disposition and reason | Remaining action / acceptance status |
|---|---|---|
| **ATA-01** | **Accepted corrected option A; implementation proof pending.** The earlier review narrowed or rejected the original report claim; this later acceptance covers only the corrected contract. | Bounded kernel-process protection evaluation; attributable inputs, policy-defined triggers and recoverable desired/attempted/confirmed state. Prove worker independence, uncertain modification and bounded latency; implementation pending. |
| **ATA-02** | **Corrected direction accepted.** A scoped inventory is warranted; blanket conversion of emergency, promotion and recovery categories to “decided” is rejected. | Populate the accepted policy baseline with scope, supersessions, target applicability and proof; preserve applicable approvals. Policy inventory accepted 2026-10-27 ([`specs/implementation/02-policy-inventory.md`](specs/implementation/02-policy-inventory.md), X-006). |
| **ATA-03** | **Accepted new migration choice A; implementation proof pending.** The earlier review narrowed or rejected the original report claim; this later acceptance covers only the corrected contract. | Naturally flat freshly reconciled initial scope; no automatic flattening. Retire the old route at first target broker-changing attempt; target-only rollback thereafter. Later upgrades retain Combined-F6; rehearsal pending. |
| **ATA-04** | **Accepted corrected option A; implementation proof pending.** The earlier review narrowed or rejected the original report claim; this later acceptance covers only the corrected contract. | Admission/safety own explicit conflicts; coordinator owns eligible scheduling. Preserve one outbound/account and account-wide accounting; resolve actual priorities from scoped policies, not legacy lock order. Matrix proof pending. |
| **ATA-05** | **Accepted corrected option A; implementation proof pending.** The earlier review narrowed or rejected the original report claim; this later acceptance covers only the corrected contract. | Persist canonical scoped financial-session bindings/transitions via the kernel writer; restart is not a new session. Prove boundary/restart/crash consistency; implementation pending. |
| **ATA-06** | **Accepted corrected option A; implementation proof pending.** The earlier review narrowed or rejected the original report claim; this later acceptance covers only the corrected contract. | Record per-request/outcome/observation domain evidence, unknowns and contradictions; cached mode is context. Reconcile and export by justified domain evidence without banning analyzer sends. Endpoint/deployment proof pending. |
| **ATA-07** | **Claimed contradiction rejected.** Exact-candidate approval does not require a fresh human click; an authorized standing policy can produce a binding. The proposed automatic rule omits the legacy estimated-evidence restriction. | Reconcile applicable approval provenance and evidence restrictions through ATA-02; no automatic-promotion policy change is accepted. |
| **ATA-08** | **Optional traceability improvement.** Existing roadmap rows already name closure evidence and require a source revision. | If refined, distinguish verified source fixes from verified route retirement; neither erases historical consequences or outstanding obligations. No legacy-register edit authorized. |
| **ATA-09** | **Confirmed summary omission; corrected.** Current summaries now include Combined-F6; the README header also includes the scoped policy-baseline status. | Documentation correction only. Preserve historical F1–F5 references and the original research date; no global replacement. |
| **O-1** | **Useful implementation detail, largely covered by A02-F4.** Reporting rollback compatibility before activation improves operator clarity. | Include in applicable release preflight planning; no separate architectural component or new decision required. |

Follow-up order: reconcile applicable policies first; then specify and prove the accepted session/protection and conflict/scheduling contracts before dependent specifications claim completeness; prove the selected ATA-03 initial migration boundary. The database upgrade/import method remains evidence-dependent. Endpoint attribution work can proceed independently. Accepted refinements remain unproved design contracts; other pending clarifications are not implementation facts, a mandate to repeat A01–A10, or a global block on isolated work.

### Affected ATA refinement acceptance

**26 October 2026 UTC — ✅ corrected ATA-05/01/04/03/06 directions accepted; ✅ docs updated; implementation and production proof pending.** Owner selected recommended A for all five and authorized coherent documentation, commit and push. Target-only README/ROADMAP review baseline: `AutonomousTradingArchitect/main`, `461f9c2ad61e2f7f2df9b47711d305bc7bfc232d`; no new legacy or broker verification. [Master affected contracts](README.md#accepted-affected-ata-contract-refinements) define behavior. The scoped policy inventory accepted 2026-10-27 ([`specs/implementation/02-policy-inventory.md`](specs/implementation/02-policy-inventory.md), X-006); ATA-07/08/O-1 are not newly accepted changes.

Delivery order: establish applicable policy rows, then implement scoped session binding (ATA-05), bounded protection and state recovery (ATA-01), and conflict/scheduling contracts (ATA-04) in existing owners. Their synthetic tests may proceed with explicit inputs while unresolved money choices remain scoped. Endpoint/domain attribution (ATA-06) can proceed independently. Before initial production migration, prove the chosen naturally flat boundary, exclusive handoff and permanent old-route retirement at first target attempt (ATA-03). Target-to-target release/session recovery retains Combined-F6.

Acceptance campaigns cover midday restart and cross-session crash, desired versus broker-confirmed stop state, delayed observations and ambiguous modifies, same/different-target conflict matrices with stalled HTTP, unknown/contradictory domain markers, and old-route reactivation refusal after first target attempt. Neither documentation acceptance nor a calendar close establishes those proofs. No new package, authority, protective priority, stop formula or general market-hours restriction is selected.

## Remaining target audit order

**25 October 2026 UTC:** the owner requested a corrected remaining audit plan and additional production-boundary questions. The previous broad requirements/ownership and financial-transaction audits are complete as documented design work (D11–D16); their implementation and production proof remain pending. They are removed from this queue, not marked production-ready. A01 has completed its reviewed design scope through accepted A01-F1–F5; its implementation proof remains open. A02 likewise has accepted A02-F1–F5 with implementation proof pending; A03-F1–F5 are likewise design accepted; A04-F1–F5 are now also design accepted; A05-F1–F5 are also design accepted; A06-F1–F5 are also design accepted; A07-F1–F4 are now design accepted; Revised A08-F1–F5 are now design accepted; A09-F1–F4 are now design accepted; A10-F1–F3 are now design accepted; all reviewed audit scopes retain implementation/production proof obligations. The [master README audit table](README.md#remaining-deep-audit-directions) owns their scope and corrected questions.

| Order | Audit and current status | Expected result and proof to design |
|---|---|---|
| **1 · A01** | **✅ Audit complete; docs updated: time, data and market intelligence; proof pending** | Define clock/session/data-quality ownership and causal view contracts. Trace mid-session start, insufficient warm-up, partial bars, gaps, late arrivals and corrections; prove that later data cannot change an earlier as-known decision. |
| **2 · A02** | **✅ Audit complete; docs updated: contract evolution, configuration and artifact compatibility; proof pending** | Map schema/configuration owners and supported version transitions. Define producer/consumer mismatch, changed defaults, migration and artifact-binding checks without recreating D05–D06. A02-F1–F5 accepted exact internal contracts, scoped settings identity, process-lifetime immutability, exact bundles and complete migration accounting; AUD-05 route selection continues in A04. |
| **3 · A03** | **✅ Audit complete; docs updated: runtime scheduling, backpressure and failure containment; proof pending** | Define queue and cancellation ownership, bounded work, slow-I/O handling and progress observations. Specify overload/starvation tests and measure service progress; do not invent unapproved action priorities. AUD-04 now specifies independent committed reads and read-only observation capability; prove polling ownership, checkpoint progress and log growth. |
| **4 · A04** | ✅ Audit complete; docs updated: recovery and release lifecycle; proof pending | Complete startup/catch-up/restart/migration/restore/rollback states using A01–A03 contracts and existing authority rules. Specify interrupted upgrade, incompatible artifact and mid-session recovery scenarios; D10 still requires recovery proof before activation. AUD-05 proves the selected migration route without manufacturing missing historical evidence. |
| **5 · A05** | ✅ Audit complete; docs updated: strategy and cognitive extensibility; proof pending | Define minimal plugin/worker/team contracts, version identity and cancellation behavior. Demonstrate representative deterministic and model-driven flows, missing optional workers and provider failures without importing historical worker assumptions or duplicating review policy. |
| **6 · A06** | ✅ Audit complete; docs updated: security boundaries and operator control; proof pending | Map principals, capabilities, privileged entry points and evidence attribution. Define unauthorized access, expired/revoked credentials, confused-deputy and operator-action checks. AUD-04/A03-F4 require enforced read-only observation capability and independently scoped polling; verify the concrete mechanism. Emergency money permissions remain owner decisions. |
| **7 · A07** | ✅ Reviewed scope complete; docs updated: research and governed improvement; proof pending | Define data/experiment/evaluation/custody ownership and the exact candidate handoff. Specify leakage, trial omission, artifact substitution, overlapping evidence and resumed-experiment checks; no protected holdout consumption is needed to design them. |
| **8 · A08** | ✅ Revised scope complete; docs updated; implementation proof continues throughout | Assemble requirement-to-proof coverage, independent oracles, controllable clocks/adapters, fault injection and evidence classes. Distinguish engineering correctness, broker compatibility and economic claims; source tests remain optional reuse. |
| **9 · A09** | ✅ Reviewed scope complete; docs updated; capacity/implementation proof pending | Choose the smallest justified process/storage topology and identify measurements for latency, resource interference, recovery and operating cost. Optional infrastructure needs a measured trigger, not a placeholder package. |
| **10 · A10** | ✅ Reviewed integration scope complete; docs updated; proof pending | Walk one complete production/simulation/recovery/research handoff through contracts, diagrams, tree and roadmap. Resolve duplicate ownership, dependency cycles and incompatible versions; distinguish the minimum complete production slice from deferred features. |

**Audit-table legend:** ✅ marks completed audit/design scope and recorded document updates only. Implementation/tests/production proof remain pending.

**Order follows dependencies, not a global work gate.** A01–A10 and corrected ATA-05/01/04/03/06 design scope is recorded; policy inventory, specifications and implementation proofs remain. Future authorized work selects a concrete first-release composition and plans isolated implementation using A01–A10, Combined-F1–F6 and accepted ATA refinements, with the accepted scoped policy baseline reconciled before dependent specifications claim completeness; no new audit or build is started by this update. A09 implementation must prove the selected composition, aggregate resource/storage isolation and measured optimization claims. A08 selects fresh requirement-based tests, selective legacy reuse and risk-based campaigns; its implementation proof accompanies affected slices. A04 implementation must prove recovery/release stages; the database upgrade/import method, restart eligibility and activation mechanisms remain evidence-dependent; the initial naturally flat handoff and old-route retirement are selected under ATA-03. A06 enforcement proofs accompany implementation of the affected boundaries. A08 contributes failure scenarios and acceptance questions from the start. A10 consolidates reviewed outcomes and reopens only specific evidence-backed conflicts. This audit order is distinct from the implementation phases and does not require finishing all research or optional cognition before useful isolated implementation.

For each audit, report target gaps, recommended behavior, alternatives/trade-offs, affected owners and acceptance evidence. Use the agreed Requirement/Owner/Proof block and recommended choices when an owner decision is needed. Only accepted recommendations become new design decisions; reconcile affected prose, diagrams, clean layout, reuse mapping and acceptance criteria when authorized. Unavailable broker or production evidence limits the associated claim, not independent analysis or development.

## Milestones

*Owner note — 25 November 2026: every milestone below is built and running in analyze mode except scaling and
providers (⚪); a "Still open, item N" in a milestone's text refers to the list as it stood then. The live state is
Current delivery status above.*

### ✅ Establish a dated, evidence-grounded audit baseline

The 24 October code-first report identifies what the inspected source proves and records the scope limits. It remains the historical baseline, supplemented by the 25 October follow-up; neither is proof of deployment, broker behavior, or production acceptance. Keep the full source branch and SHA beside each future snapshot so a later audit can show what changed.

The attached dashboard reports 12 issues across eight modules and proposes eight recommendations. These remain dashboard assessments. The code-first report narrows or qualifies several of them; the mapping below preserves that distinction instead of carrying dashboard severities forward as source facts.

### ✅ Implement accepted reliability contracts in isolated target slices

**Status 2026-11-19:** built in `agentic-desk` and running on the Ubuntu host (analyze mode). The first entries, protection and exits ran on 19 November; dispatch intervals were measured from the ledger (see Still open, item 2).

Use F1–F5 as evidence for D01–D06, not as instructions to copy the source implementation or patch the read-only source first. With D11–D12 ownership established and applicable policies reconciled, implement D13–D16 together with the existing reliability work and accepted ATA session/protection/conflict/domain contracts. Establish explicit caller-visible outcomes when an external order is accepted but local persistence fails (F1), then settle cancel/modify intents for every submitted, rejected, ambiguous, or never-reached result (F2). Verify authority indexes against event-derived state (F3), establish installable resources/entrypoints and versioned deployment as well as package completeness (F4/D05), and share one typed environment contract across both research profiles and their renderer (F5/D06).

Handle the lower-severity findings with bounded scope: share the authentication builder for informational mode status (F6); verify legacy replay provenance (F7); remove or correct the dormant duplicate-checkpoint API hazard before adoption (F8). Keep cross-host fencing (F9) explicit as an operational activation requirement; a local epoch does not fence an old host.

Do not add a new idempotency system or retry protocol based only on the dashboard wording. The inspected source already has durable identity and ambiguous-outcome machinery; reuse it where it satisfies D13–D16, prove attempt identity and transport behavior, and refactor where those target contracts require it. Never reset deduplication because a principal or epoch changed.

### ✅ Preserve behavior while producing an installable target

**Status 2026-11-19:** built in `agentic-desk` and running on the Ubuntu host (analyze mode). The first entries, protection and exits ran on 19 November; dispatch intervals were measured from the ledger (see Still open, item 2). The cutover path in this text is superseded: legacy was lost on 13 November; fresh start (SLICE-15). D-015 (19 November) removed the history import and cutover in build `b90fdffe`.

Define target ownership and pure/effect boundaries first, then inventory current contracts, schemas, entrypoints and evidence to decide what fits. Reuse existing Tier-1 ledger, planner, gateway, replay, cognition, research, and operational code where target requirements and named compatibility proofs support it; source parity alone is insufficient. Keep compatibility readers during migration. Build a disarmed vertical slice and compare exact plans, refusals, reservations, lifecycle transitions, identities, and evidence before moving any financial authority.

The master README phases now implement the accepted sequence: establish D11 requirements and D12 review ownership; specify D13–D16 together and establish outcome/lifecycle/integrity contracts; build the installable target; prove a disarmed vertical slice; consolidate canonical monetary admission; develop Canvas/cognition and research in parallel where independent; prove crash recovery and clean-host restoration before the ATA-03 naturally flat exclusive initial cutover and old-route retirement; then tune recovery objectives, economics and growth. The phases are directional, not a blanket dependency gate for independent work.

### 🟡 Build the deterministic Market Canvas on the existing market seam

**Status 2026-11-18:** built (SLICE-08 Canvas facts and history; SLICE-09, SLICE-12 and SLICE-17 cognition, research and the AI twin). Not in the first release; no Canvas UI.

**Status 2026-11-26 (code check):** the Canvas is a library with no importer (no host, no composition, no role tool). It has one algorithm, `confirmed_swings`. It is not deployed: the deployment lists it optional, with no unit. Its settings (`canvas.swings.k`, `canvas.swings.intervals_secs`, `canvas.budgets.<caller>`) are bound in no config. The differences between the code and the [market-data design](specs/implementation/design/market-data-and-canvas.md) are recorded there as dated status notes. Open owner decisions: whether agents may use the Canvas, and whether to build a chart renderer. Payload measured offline (OA_NEW `docs/measurements/canvas-payload-2026-11-26.md`, `scripts/measure_canvas_payload.py`): in the same 40-minute window, trimmed swing facts are 0.07x–0.22x the bytes of the model's 40-bar input; the full overlay is 2.8x–21x; synthetic ticks, tokens unmeasured. Traced 26 Nov, no change: both quirks are in `market.view.session_windows`, shared by `quality.assess` and `View.day_coverage`. (1) It counts the session's windows from open to close both inclusive, so 09:15-15:30 is 376; live tick days do hold a 15:30 IST window (NIFTY about 600 ticks, BANKNIFTY 250-300 on 20, 23 and 25 Nov, read-only from the server's market store), so only history bars that end at 15:29 (the 2026-08-03 fixture) show 15:30 as a gap and `complete`/`warm` false after the close. (2) It applies the tick seal lag (7 s) and the watermark to every view, while history bars are final at start + 60 s with no lag, so on history bars `expected` can trail the bars shown by one window at the cutoff. Both read low, never count a missing bar as present, and no trading path acts on them (Canvas unused; `day_coverage` is informational, and its history fallback applies only to a day without ticks). A change would alter `day_coverage`, which the AI BuyerEdge team prompt reads, so it is left as is.

The supplied module assessment describes a Canvas as if versioned geometry and bounded tools already exist. Treat that as a target proposal until source evidence proves otherwise. Adopt D08 explicit cutoff/availability/freshness policy for new APIs, using existing provider and MarketView implementations only where they satisfy it; implement accepted A01-F1–F5 stable views, history/live handoff, consumer quality/window semantics and correction reconstruction; version facts, algorithms, inputs, and availability; distinguish computed facts from agent interpretation; and test that later bars cannot alter earlier as-of views. Keep chart rendering downstream of structured evidence.

### 🟡 Extend bounded cognition and research only where measured value supports it

**Status 2026-11-18:** built (SLICE-08 Canvas facts and history; SLICE-09, SLICE-12 and SLICE-17 cognition, research and the AI twin). Not in the first release; no Canvas UI.

Retain approved typed review, abstention, unavailable, timeout, and human-application behavior. D12 places deterministic entry-review application in the kernel; cognition supplies bound evidence and record-only exit advice. Keep cognition proposal-only and without broker credentials. D09 adds OS-enforced filesystem/socket/egress/resource boundaries and a narrow job submission port; stripped environments alone are not proof of isolation. Add rate limits, deduplication, or workflow durability only when measured proposal churn or lost work demonstrates the need; do not add arbitrary cooldowns or confidence thresholds to money decisions.

Preserve research custody and RL as non-authoritative. Candidate artifacts remain frozen and governed. Any locked evaluation, promotion, or activation follows its own custody and owner-approval rules; it does not become a prerequisite for unrelated development.

### ⚪ Scale or add providers only after an evidenced trigger

Start with the proposed single-host SQLite WAL design and OpenAlgo boundary; A09 sizing and performance measurements remain pending. Benchmark actual write contention, retained data volume, latency, outage frequency, and recovery objectives before selecting PostgreSQL, replication, another broker, or a distributed workflow service. A second broker is an extension decision, not an automatic response to “vendor lock-in.” Distributed or active-passive Tier-1 requires a proven exclusive-authority and split-brain prevention design, not a shared SQLite file or an unmeasured leader-election service.

## Open work and evidence

*Dated 26 October 2026 (history): the legacy-defect priorities below. The live list is "Still open" under
Current delivery status.*

The order below reflects the current audit's risk and dependencies. It is not a serial release gate. Isolated implementation, debugging, architecture review, and synthetic testing can proceed while a separate production proof is pending.

| Priority | Work or observation | Evidence needed to close it |
|---|---|---|
| 1 | **F1 — broker acceptance versus local persistence** | Deterministic fault injection at the persistence boundary; prove the returned result preserves broker acceptance, sent state, canonical identity, and unresolved projection state without inviting a resend. |
| 2 | **F2 — command-intent settlement** | Exact identity tests for cancel, modify, close, reject, ambiguous, and never-reached paths; prove restart/reconciliation leaves no stale reservation or unsafe retry. |
| 3 | **F4 / D05 — installable application and deployment portability** | Explicit shipping manifest, resources and executable entrypoints without checkout/`.git`; versioned artifact/environment staging and failure-safe handoff; preserve current history on software rollback. |
| 4 | **F5 / D06 — shared worker configuration contract** | Render both offline and advisor service environments from the shared schema; intentional paths pass, forbidden credentials refuse, and one job per profile completes in isolation. |
| 5 | **F3 — derived authority state integrity** | Rebuild/compare mutable indexes and epochs against event-derived truth after startup, recovery, and external modification; preserve existing release-binding and projection checks. |
| 6 | **F9 / D10 — recovery before cutover** | Before production activation, rehearse the candidate artifact/schema/backup restoration on a clean separate host; prove the old writer cannot act, reconcile accepted/pending/unknown commands, preserve identities, and activate only one writer. Initial migration additionally requires the ATA-03 naturally flat scope and retirement at first target attempt; later target upgrades retain Combined-F6. **Owner note — 18 November 2026:** there is no old writer and no migration (fresh start). Activation was in analyze mode; the backup and clean-host restore rehearsal stay open before live. **Owner amendment — 19 November 2026 (D-015):** the import and cutover code is being removed. **Owner amendment — 21 November 2026 (D-017):** the backup runs nightly and was proved on the real bucket; the clean-host restore rehearsal stays open before live. **Owner amendment — 23 November 2026 (D-020, D-021):** the restore command is built (A2); the clean-host restore rehearsal stays open before live. |
| 7 | **F6–F8 — bounded compatibility and dormant API cleanup** | Auth contract tests; exact legacy replay shape/provenance checks; production-caller search and checkpoint consistency proof or removal. |
| 8 | **Dashboard claims that are conditional or unverified** | Claim-specific load, runtime, custody, observability, or resilience evidence before changing their status. No implementation is implied by a scorecard number. |
| 9 | **Production and broker acceptance** | Release-specific session evidence, exact broker observations, protection/reconciliation outcomes, resource use, and recovery proof. Analyze-mode evidence does not establish a real-broker lifecycle. 18 November: analyze session without entries (R2 lease, OpenAlgo, market data, services measured). 19 November: five analyze-mode trades with entries, protection and exits; dispatch timings not yet recorded. 20 November: a second analyze day; dispatch and completion timings measured for 19–20 November (`docs/measurements/session-timings-2026-11-19-20.md` in the source repository). 21 November: the off-box backup proved on the real bucket and running nightly (D-017). |
| 10 | **Owner decisions** | Explicit choices for gross/net admission, emergency permissions, policy changes, and any multi-person governance requirement. Keep unresolved choices open; do not infer defaults from a dashboard recommendation. |

Accepted ATA-05/01/04/03/06 proof obligations are detailed in the [affected ATA acceptance](#affected-ata-refinement-acceptance) and the master acceptance matrix; the scoped policy inventory accepted 2026-10-27 ([`specs/implementation/02-policy-inventory.md`](specs/implementation/02-policy-inventory.md), X-006).

D02/D07 ownership and planning, D08/D09 Canvas/capabilities, and D11–D16 requirements and transaction refinements have their own acceptance rows above; they are target gaps, not newly numbered F-defects. None of these tasks is closed by accepting the design.

### Attachment-to-source-audit disposition

| Dashboard claim | Current disposition |
|---|---|
| Single kernel point of failure; automatic HA required | Single-writer authority is intentional in the current design. HA is not an automatic correction. Measure availability needs and prove exclusive fencing before any failover proposal. |
| No broker abstraction; add multiple brokers | OpenAlgo is the only live boundary by design. Existing ports/adapters and the code audit must be checked before claiming no abstraction. A second broker needs a concrete requirement and separate contract evidence. |
| SQLite cannot scale | The single-writer limit is real; a current workload bottleneck was not established. Measure before selecting a migration. |
| Missing idempotency | Too broad as stated. The inspected coordinator checks prior outcomes and namespaced IDs. Audit identity scope and retry boundaries; do not reset keys across epochs. |
| Ambiguous-result taxonomy missing | The code has explicit ambiguous outcomes and observation-based resolution. Verify end-to-end callers and persistence behavior; do not replace working recovery with blind retries. |
| Single-person owner governance is an architecture defect | Owner availability and emergency policy are unresolved governance choices, not authority to invent multi-signature or automatic emergency behavior. |
| Simulation isolation unverified | Shared code and disarmed adapters exist. Verify credentials, process/network capability, ledgers, and lifecycle boundaries before changing status. |
| Missing backpressure, observability, cognitive stability | Treat as measurement questions until queue growth, stale data, unobserved incidents, or proposal churn are shown. Preserve bounded tools and asynchronous telemetry. |
| API versioning absent | Track compatibility on the concrete public/internal contracts. Do not add generic semantic versioning or N-1 support without consumers and a migration need. |

## Audit history

Dates are preserved as evidence windows. The date of a report, the date of a source revision, and a downloaded file's timestamp are separate facts. Earlier audit counts are historical and are not added to current findings unless an issue remains open with current evidence.

| Date or range | Snapshot | How it affects the current direction |
|---|---|---|
| **19 June–October 2026** | The source project's history records the evolution from a strategy script to the current framework, Tier-1 authority, replay, custody, operations, and North Star architecture. | Context for reuse and why “clean rebuild” means packaging/recomposition, not deleting proven behavior. This roadmap does not restate the full implementation chronology. |
| **25 August–4 September 2026** | The source roadmap records an eight-lens audit with 99 findings and subsequent consolidation into live specifications and registers. | Historical baseline only. Old counts and retired audit documents do not define today's defects; use current source evidence and preserved git history. |
| **10–11 October 2026** | The research attachment summarized C01–C29 and external references; it explicitly did not establish a private code audit or live fault test. | North Star context and hypotheses. Keep its claims separate from later source verification. |
| **20 October 2026** | The source roadmap refers to a production-code audit and corrective work. | Historical evidence for changes made before the current source snapshot; check the exact source revision when asserting a fix is present. |
| **24 October 2026, 19:12–19:13 IST** | Downloaded `ArchitectureOverview.tsx`, `ArchitectureFlow.tsx`, `App.tsx`, `index.html`, `architectureData.ts`, `Scorecard.tsx`, `Recommendations.tsx`, `ModuleDetails.tsx`, and `IssueAnalysis.tsx`. The data defines 8 modules, 12 issues, and 8 recommendations; the scorecard presents a 5.5/10 grade. | Current presentation bundle. Keep its six review areas and findings taxonomy as a claim inventory; its hand-authored flow, numerical grade, severities, and recommendations are not source-code or operational proof. File modification times bound local acquisition only. |
| **24 October 2026 UTC** | Current code-first audit recorded in the master README; target source revision `445eb116514d97c2574c44d4d5374f938dec57a3` on branch `claude/openalgo-trading-architecture-uu1bxn`. It reports F1–F8 and F9 as a known operational boundary, qualifies dashboard claims, and records audit limitations. | Current evidence baseline for this roadmap. It supersedes dashboard statements only where source evidence directly resolves them; unknowns remain unknown. |
| **25 October 2026 UTC** | Follow-up audit at the unchanged source SHA `445eb116514d97c2574c44d4d5374f938dec57a3`, branch `claude/openalgo-trading-architecture-uu1bxn`; architecture baseline `a4c6308641d12b1a15898c05ce2bbd022cd46822` on `main`. Targeted traces and 528-file import scan; no application execution or live evidence. | F1–F5 remain open; monetary admission is still split, packaging includes deployment/resource concerns, F5 affects both research profiles, and pure planning/Canvas/OS isolation remain target work. Owner subsequently accepted D01–D10 for both documents, not implementation or financial policy. |
| **25 October 2026 UTC — subsequent target review** | Requirements, module ownership and financial boundaries reviewed at architecture `main` revision `ecf39ad731ad20b9e541b238225f9ca8d1213537` with subsequent local explanatory edits; no new source audit or runtime execution. | Owner accepted D11–D16, mapping audit items 1–6, and authorized coherent README/ROADMAP changes. No historical F-finding is closed by this acceptance. |
| **25 October 2026 UTC — A03 failure re-audit** | Target `main` at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02; read-only source `claude/openalgo-trading-architecture-uu1bxn` at `445eb116514d97c2574c44d4d5374f938dec57a3`, OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. Inspected lock/dispatch, ledger reader/backup, supervision, book routing and restart code. | A03-F1–F5 and subsequent failure corrections accepted; no deployed-broker or fault-test proof. Independent committed reads supersede snapshot preference; A04/A06 retain recovery activation and observation capability proof. |
| **26 October 2026 UTC — combined A01–A03** | Target-only independent review at architecture `main`, `842fe1f007b9ef5ccfdcb9e90223597dced56ff9`; no new trading-source verification. | ✅ Audit and accepted README/ROADMAP updates complete: Combined-F1 time semantics, Combined-F2 evidence publication/retention, Combined-F3 historical-only worker compatibility. Implementation proof pending; AGENTS goal update retained. |
| **26 October 2026 UTC — A04** | Target review at architecture `main`, `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e`, with independent cross-check; no new source/runtime verification. | ✅ A04-F1–F5 accepted and docs updated; implementation proof pending. A05 next; migration route and automatic financial activation not selected. |
| **26 October 2026 UTC — A05** | Target review at `main`, `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e`, plus local accepted A04 updates; independent cross-check, no new source/runtime proof. | ✅ A05-F1–F5 accepted and docs updated. A06 next; implementation proof pending. |
| **26 October 2026 UTC — A06** | Target `main` at `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e` plus local A04/A05; independent target-only review. | ✅ A06-F1–F5 accepted and docs updated; implementation proof pending. Owner requests pause after commit/push; A07 next when resumed. |
| **26 October 2026 UTC — combined A01–A06** | Target `main`, `ea9caedde201c65e6481cd430c1c30bfe273dcd1`; two independent reviewers; no new source/runtime/broker verification. | ✅ Combined-F4/F5 accepted and docs updated: current authorization after restore and ordered mutable strategy state. Implementation/production proof pending; no commit/push authorized. |
| **26 October 2026 UTC — A07** | Target `main`, `4b23abc9081d492e217938f50354f8a411e714cb`; target-only review, no new source/runtime/broker proof or protected-data access. | ✅ A07-F1–F4 accepted and docs updated; no F5 proposed. Implementation proof pending; pause without commit/push. |
| **26 October 2026 UTC — revised A08** | Target `main`, `4b23abc9081d492e217938f50354f8a411e714cb`, plus local A07; source `claude/openalgo-trading-architecture-uu1bxn`, `445eb116514d97c2574c44d4d5374f938dec57a3`. Static inventory and selected source/test inspection only. | ✅ Revised A08-F1–F5 accepted and docs updated; no test execution or obsolete-case count claimed. Pause without commit/push; A09 next. |
| **26 October 2026 UTC — A09** | Target `main`, `5ff225c0d0868ff266a3814dd278e82327040a6d`; document-only deployment review, no runtime/source inspection or capacity benchmark. | ✅ A09-F1–F4 accepted and docs updated; production proof and numerical objectives pending. Pause without commit/push; A10 next. |
| **26 October 2026 UTC — A10** | Target `main`, `5ff225c0d0868ff266a3814dd278e82327040a6d`, plus local A09; target-only integration review. | ✅ A10-F1–F3 accepted and docs updated; diagrams, composition scoping and compatibility retirement aligned. Proof pending; pause without commit/push. |
| **13–18 November 2026** | Legacy host lost 13 November; SLICE-15 fresh start; first release installed 18 November, replaced 17:29 IST by `20261118T115832Z-bb7baf172aaa` (`d63928d`); kernel `OPERATING`; BuyerEdge entry grant for 19 November. | First deployed evidence (analyze mode). Production and live acceptance pending. |
| **19 November 2026** | First analyze-mode day with entries: five BuyerEdge trades; fixes `fae71f9`, D-011–D-014; two fresh ledgers; release `20261119T100828Z-91a2667a6d14` (`1f7de02`) running. | Analyze-mode evidence of entries, protection and exits. Production and live acceptance pending. |
| **20–21 November 2026** | Second analyze-mode day (D-016); put-delta exit fix released; D-017 nightly backup to R2 as plain objects, proved on the real bucket; D-018 evidence files 0640. | Off-box backup running; clean-host restore rehearsal, production and live acceptance pending. |
| **23 November 2026** | PRT-R10 fix (an earlier day's protective orders count as ended); D-019 live funds strings; release after the close; D-020 zstd, D-021 10 trading days live; data management B1–B10; restore command (A2). | Monday's entries were all refused (PRT-R10) before the fix; the restore rehearsed on the real bucket that night (ok, 5 minutes); clean-host restore rehearsal, production and live acceptance pending. |
| **24 November 2026** | NSE holiday. The recent ledger every 5 minutes (built, not released); at-ops `health.sh`, `alerts.sh --alive`, `openalgo_books mode`, a holiday no alarm. | Full suite 3,479 passed on the server; live `health.sh` clean from a login and inside a unit; release pending the owner's word. |
| **Future scoped review: date TBD** | Name the target documents and/or source branch and SHA actually inspected. | Review affected requirements or findings only; source re-audit is not a prerequisite for isolated specifications or implementation. Record evidence limits and preserve prior dates. |

## Direction changes

This log records when newer dated evidence changes what the roadmap asks for. Do not backdate a conclusion to the date of an older attachment, and do not delete a prior row when an assessment is later corrected.

| Date | Prior view | Updated view | Evidence and roadmap effect |
|---|---|---|---|
| **24 October 2026** | The attached presentation lists 12 findings, including critical kernel HA, missing idempotency, absent ambiguous-result handling, missing broker abstraction, and an immediate multi-broker recommendation. | The current code-first audit records F1–F8 plus F9 as a known operational boundary. It finds existing coordinator outcome checks and explicit ambiguous outcomes; identifies specific persistence, intent-settlement, index-integrity, packaging, and worker-environment defects; and leaves HA, scale, multi-broker, governance, and observability claims conditional or unresolved. | Treat the dashboard as a dated claim inventory, not an additive defect list. Prioritize the code-cited F1–F5 and evidence-bound F9; measure other claims before changing architecture. Source revision: `445eb116514d97c2574c44d4d5374f938dec57a3`. Exact ordering of same-day artifact generation is not established. |
| **25 October 2026 UTC** | Reuse-first extraction could be read as preserving source boundaries; baseline recovery appeared after cutover. | Owner accepted D01–D10: boundaries first, selective reuse, approved-policy compatibility, explicit defect corrections, canonical monetary admission, installable releases and recovery proof before activation. | README contracts, diagrams, clean layout and phases now reflect the accepted direction; implementation acceptance remains pending. F1–F5 are not closed and no source/live behavior changed. |
| **25 October 2026 UTC — D11–D16** | Source-parity wording could preserve incidental behavior; review application sat in cognition; dispatch, observation and accounting contracts lacked precise shared responsibilities. | Requirements first; kernel-owned review application; revalidated dispatch, durable attempt identity, evidenced reconciliation and atomic obligation accounting. | Owner selected A for items 1 and 2 and A for items 3–6 together. Master contracts, both target diagrams, tree comments, reuse mapping and acceptance checks now agree. Implementation proof and unresolved money-policy choices remain pending. |
| **25 October 2026 UTC — remaining audit agenda** | The older eight-item order included the now-recorded requirements and transaction reviews and did not separate runtime progress, schema evolution or operator security. | Exclude completed design scope, start with A01 time/data, add focused A02/A03/A06/A10 questions, and carry verification throughout. | Owner requested the revised plan. README owns scope/questions; this roadmap owns dependencies and expected evidence. The agenda is planned work, not newly completed audits or production acceptance. |
| **25 October 2026 UTC — independent-review agreements** | Diagram edges left authoritative outcome commits and review evidence/control flow ambiguous; action variants and two later audit questions needed sharper scope. | Accept corrected AUD-01–AUD-03 contracts and AUD-04–AUD-05 investigation tasks; reject AUD-06 as stated. | Owner selected A for all five corrected choices. Design changes remain unimplemented; storage-access and migration mechanisms remain open. README and roadmap updated from `70e1e539f1dc8a890b12d68525d125df8dd14012`; no source audit or money-policy change. |
| **25 October 2026 UTC — A01 acceptance** | Time/data audit was next; D08 left operational view pinning, startup overlap, consumer sufficiency, window meaning and correction reconstruction under-specified. | Owner accepted A01-F1–F5; A01 design scope complete, implementation evidence pending; A02 becomes next. | Target-only review at architecture `main` revision `b65cc821a7d34e527988dfc1277516e7467fbb9e`. README contracts, diagrams, existing tree comments, reuse and proofs updated; no source change or financial-policy adjustment. |
| **25 October 2026 UTC — A02 acceptance** | Compatibility/configuration audit was next; supported versions, effective settings, activation, artifact compatibility and migration accounting needed precise rules. | Owner accepted A02-F1–F5; A03 becomes next. Migration-route selection remains in A04. | Review at `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local accepted A01 edits. No source inspection, financial default change or production proof; README and roadmap updated coherently. |
| **25 October 2026 UTC — A03 acceptance and failure re-audit** | Runtime audit pending; snapshot preference left the latest committed work potentially invisible during failure. | Accept A03-F1–F5 including independent ledger reads, enforced read-only observations, retained outage assessments and controlled exclusive recovery; A04 next. | Architecture baseline `b65cc821a7d34e527988dfc1277516e7467fbb9e` plus local A01/A02; trading source `445eb116514d97c2574c44d4d5374f938dec57a3`, OpenAlgo mirror `b9d155ff6a22ce60337ac6f9a3bd6fe709e95838`. Owner accepted corrections; no live tests or implementation proof. |
| **26 October 2026 UTC — combined corrections** | Accepted A01–A03 left shared time and external-evidence handoff under-specified; legacy worker-reader wording was ambiguous. | Owner accepted Combined-F1–F3; ✅ coherent documentation complete without reversing accepted choices. | Target-only review at `842fe1f007b9ef5ccfdcb9e90223597dced56ff9`; A04 remains next. No source, money policy or production authority change. |
| **26 October 2026 UTC — A04 acceptance** | Recovery stages, partial releases, migration handoff and recoverable artifact set were deferred A04 details. | Owner accepted A04-F1–F5; ✅ README/ROADMAP updated and A05 next. | Target baseline `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e`; preserve A01–A03, combined corrections and money policies. Accepted design is not production proof. |
| **26 October 2026 UTC — A05 acceptance** | Extension registration, state/output handoff and model/team purposes/evidence needed explicit target contracts. | Owner accepted recommended A05-F1–F5 together; ✅ docs updated, A06 next. | Preserve A01–A04 and Combined-F1–F3; target-only baseline `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e` plus local A04. No new financial policies or authority. |
| **26 October 2026 UTC — A06 acceptance** | Actor/delegation, observation mediation, credentials, operator intent and disclosure needed explicit enforcement contracts. | Owner accepted A06-F1–F5; ✅ documentation complete; pause after publication. | Target baseline `c4bf1040228c8cb4437dd224262e0f1e5ee7f17e` plus local A04/A05; no new source proof or financial policy. A07 next when resumed. |
| **26 October 2026 UTC — combined A01–A06 clarification** | Recovery authorization continuity and overlapping stateful invocations remained implicit across otherwise accepted contracts. | Owner accepted option A for Combined-F4/F5; ✅ existing contracts and acceptance rows updated coherently. | Target-only review at `ea9caedde201c65e6481cd430c1c30bfe273dcd1`; preserves accepted choices and policies. A07 remains next, not started. |
| **26 October 2026 UTC — A07 acceptance** | Fitting provenance, resumed trial identity, simulated reward transitions and exact promotion approval needed explicit contracts. | Owner accepted recommended A07-F1–F4; ✅ coherent docs updated. No fifth finding existed in the report. | Target baseline `4b23abc9081d492e217938f50354f8a411e714cb`; earlier policies preserved, implementation proof pending. A08 next when resumed. |
| **26 October 2026 UTC — A08 reset and acceptance** | Earlier four unaccepted A08 proposals emphasized verification machinery before addressing inherited test requirements. | Owner requested a fresh source-grounded review and selected A for revised A08-F1–F5; ✅ fresh target suite decisions recorded. | Preserve approved business rules and useful scenarios; do not inherit legacy packaging/workflow/prose constraints or bulk test logic. A09 next; implementation proof pending. |
| **26 October 2026 UTC — A09 acceptance** | Required runtime participants, combined workload demand, storage capacity and measurement applicability needed clarification. | Owner accepted A09-F1–F4; ✅ contracts, ownership and acceptance aligned. | Target baseline `5ff225c0d0868ff266a3814dd278e82327040a6d`; existing authority/policy preserved, no new infrastructure or measured-capacity claim. A10 next. |
| **26 October 2026 UTC — A10 acceptance** | Diagram shortcuts, unspecified first-release composition and compatibility lifetimes could mislead later implementation. | Owner accepted A10-F1–F3; ✅ two target diagrams and affected contracts/roadmap aligned. | Existing policies/authority and pending A09 preserved. Actual release selection and implementation proofs remain future work; no production certification. |
| **26 October 2026 UTC — combined A01–A10 acceptance** | Existing contracts preserved obligations but did not explicitly establish their executable continuity across release/session changes; introductory test guidance lagged A08. | Owner accepted Combined-F6 and A08 summary alignment; ✅ documents updated; implementation proof pending. | Actual target range `a4c6308641d12b1a15898c05ce2bbd022cd46822` → `2f051ddaae8b77c99712251d203efb307ebac85c`; target-only review. Preserve policies, single authority and existing package boundaries. |
| **26 October 2026 UTC — scoped policy baseline acceptance** | Independent ATA review exposed policy-scope ambiguity; historical decisions and host values cannot be treated as universal target rules. | Owner accepted the corrected ATA-02 approach; ✅ contract recorded, inventory reconciliation pending. | Target baseline `a85c5f10eb169ad0fe5bf5a6cecb58b0e40eb7e3`; preserve applicable approvals, expose conflicts, and ask only about genuinely new choices. Other ATA recommendations remain unaccepted. |
| **26 October 2026 UTC — affected ATA refinements** | Session/protection execution, conflicts, initial migration scope and domain evidence needed explicit corrected contracts. | Owner accepted A for ATA-05/01/04/03/06; ✅ documents aligned, implementation proof pending. | README/ROADMAP-only review at `461f9c2ad61e2f7f2df9b47711d305bc7bfc232d`; initial flat migration is an explicit new choice; preserve Combined-F6 for later target transitions and approved financial policies. |
| **26 October 2026 UTC — full-document consistency correction** | Later ATA decisions were missing from some diagram inputs, tree responsibilities, acceptance rows and current continuation summaries. | Restore clock/ownership labels and align contracts, proof coverage, reuse and migration language with accepted decisions. | README/ROADMAP review at `3fb823a9a2dc83cce5e876359d36f3f82b61c81e`; documentation only, no new policies or runtime proof. Historical acceptance and source evidence remain dated. |
| **18 November 2026** | CUJ-SES-1: a restart continues the session; activation only with the market closed; strategies start at the session clock; cutover from legacy. | D-007 to D-010 (early close, activation without the market-hours check, late start, host stays on with owner read access); the fresh start replaced the cutover (13 November). | Source repository `docs/decisions.md`. |
| **19 November 2026** | A held leg is never touched; stop and target at the plan's levels; entries priced from the decision's exact-minute chain; the broker squares off at the close (`session_close: broker`); legacy history enters by import (D-001). | D-011 a leftover protective order is cancelled even under a hold; D-012 stop and target re-anchored to the real fill, both ways; D-013 entries priced from the newest chain the view sees; D-014 `session_close: square_off`; D-015 no history import and no cutover (their code is being removed). | Source repository `docs/decisions.md`; 19 November analyze session. |
| **20–21 November 2026** | Analyze sessions did not count as live-broker checks; the backup was a restic, encrypted repository, deferred; kernel evidence files were private (0600). | D-016 an analyze session counts as a live-broker check; D-017 the nightly backup goes to R2 as plain objects over S3, no passphrase, no restic (B2 supported, untested); D-018 evidence files are 0640, read by `at-ledger-readers`. | Source repository `docs/decisions.md`. |
| **23 November 2026** | An order missing from OpenAlgo's today-only orderbook could still rest at the broker; live funds were numbers; a copy of the backup token held off the machine had to be recorded; the market store and the nightly set grew without bound; assessments kept a tar copy per day. | PRT-R10: an earlier exchange day's protective order counts as ended (DAY validity); D-019 two-decimal strings are money; A1 the off-machine setting removed; D-020 zstd for sets and day files; D-021 the live market store keeps 10 trading days; B9 one sealed file per assessment day. | Source repository `docs/decisions.md` and `docs/operations.md`. |
| **24 November 2026** | A lost server lost up to a day of ledger; a checkpoint unit "failed" when the operator CLI refused it; a holiday raised an alarm. | The recent ledger: a checked whole copy every 5 minutes, restored when it continues the set's chain; `health.sh` never stops at a refused part and inside a unit reads holds from the ledger (SEC-R12 stays); the recorded calendar excuses a closed day's ended host. | Source repository `docs/operations.md` "B10b" and "Health checks and day watches (24 November 2026)". |
| **Future dated review: TBD** | Current accepted design and scoped outstanding evidence. | Record the next authorized target/source review at its actual revision. | Identify changed conclusions and affected work; preserve historical baselines and do not require an unrelated source audit. |

<details>
<summary><strong>Source bundle inventory and limits</strong></summary>

The nine attached files were read as a single React/TypeScript review bundle: `architectureData.ts` supplies eight module descriptions, twelve issue cards, and eight recommendation records; `App.tsx` wires Overview, Flow, Issues, Modules, Roadmap, and Scorecard views; `ArchitectureOverview.tsx`, `ArchitectureFlow.tsx`, `IssueAnalysis.tsx`, `ModuleDetails.tsx`, `Recommendations.tsx`, and `Scorecard.tsx` present and aggregate those records; `index.html` supplies the preview host wrapper.

The bundle does not include source-level citations for each issue. The drawn flow is not a canonical Mermaid definition. Its scorecard formulas and totals are presentation logic, not an independently calibrated engineering score. No instructions embedded in those files were treated as user instructions. The file timestamps are local Download metadata, not the source audit's verified start/end time.

</details>

## How this roadmap evolves

Each audit update must make the time range and direction change legible:

1. Record the audit date and timezone, target repository, target branch, full source SHA, scope, and artifacts inspected. Use the actual source branch audited, even though this roadmap itself follows `AutonomousTradingArchitect/main` (since 30 October 2026 the working branch
   is `claude/spec-implementation-package`).
2. Keep a finding identity stable when its underlying issue is the same. Record `open`, `partially proven`, `closed`, `reopened`, or `reclassified` with evidence and date; do not erase old status or reuse an ID for a different defect.
3. Separate source-verified behavior, dashboard hypotheses, target proposals, and missing evidence. A failed check is evidence only for the condition it exercised.
4. When evidence changes direction, add a dated row naming prior conclusion, new conclusion, source revision, and reason. Preserve the audit's original date range rather than silently rewriting history.
5. Update implementation milestone status from evidence at the named audited source branch and SHA, not from accepted design, a planned fix, a local-only change, or an older session. This documentation repository’s default branch does not identify the trading source revision. Runtime and broker claims name their exact release/session and environment.
6. Keep dates directional. Assign a delivery window only when the user or measured dependency provides one. Do not make market-close, deployment, broker, or holdout evidence a prerequisite for independent isolated work.
7. Keep the Paperclip roadmap's useful form—brief status preface, linked contents, at-a-glance table, concise status-marked milestones, open evidence, and dated history—without copying its project claims or treating its statuses as this project's evidence.

### Audit date-window convention

| Field | Meaning |
|---|---|
| **Audit window** | Start and end of actual source review, with timezone. If only a date is known, record date precision; do not invent times. |
| **Artifact date** | When a report or attachment says it was created/revised. Keep separate from source commit time. |
| **Acquired** | When a file was downloaded or supplied locally. File mtime is only a local provenance clue. |
| **Source revision** | Full branch and commit SHA against which implementation claims were checked. |
| **Status effective date** | Date a fix or evidence is verified on the target branch. A merge, deploy, and natural-session proof are distinct transitions. |

## Working on the roadmap

Use this document to choose the next evidence-backed architecture or implementation slice. Link each future correction to an audit finding and its target acceptance proof. Keep source-code changes in the `AutonomousTrading` repository (branch `agentic-desk`, checked out as OA_NEW) when requested; keep this repository's work to architecture and audit documents. Do not edit the master README or the rebuild prompt unless the active user turn explicitly requests it. An owner-policy question remains an open decision until answered.

The [Paperclip roadmap](https://github.com/paperclipai/paperclip/blob/master/ROADMAP.md) is a formatting and tone reference only. Statuses, milestones, claims, and dates here are specific to this project's audit evidence.
