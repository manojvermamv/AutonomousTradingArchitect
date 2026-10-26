# EGM review — ledger-and-atomic-transaction

Process record (not normative). Target: [design/ledger-and-atomic-transaction.md](../../design/ledger-and-atomic-transaction.md). Resolution codes: **FIX** (applied), **CONTEST** (kept, with evidence), **Q/X** (raised).

## Stage 5 — initial zoom-out (0 Blocker, 8 Major, 2 Nit)

All ten were applied in one rewrite of the spec:

| Topic | Resolution |
|---|---|
| Index tables vs compatibility projections were mixed | FIX: two kinds named; only projections can be "repair scheduled" |
| Three separate apply/repair/compare codes | FIX: one `fold` used three ways |
| Schema v1 incomplete; `release_binding`, session and protection tables unplaced | FIX: table list with the slice that adds each |
| `command_key` vs legacy `idempotency_key` unexplained | FIX: rationale with `gateway_route.py:652` |
| Float money; legacy quantities and states dropped | FIX: exact decimals, legacy amount/margin/worst-case loss and states; `money.rounding` refusing |
| Legacy reservation fold not reused | FIX: `reservations.py:160-224` named as the reuse candidate |
| CP-L3 split into near-identical points | FIX: merged |
| Execution contract types incomplete; request carried the plan and review result | FIX: full type list; requests carry neither |
| Writer recorded refusals itself | FIX: writer returns refusals; callers record them |
| Who decides `COMPLETED` | FIX: `kernel.lifecycle` |

## Stage 6 — comprehension (5 Blocker, 16 Major, 6 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 6-1 | Blocker | `transact` has no contract (decision type, return, touched rows, check order) | FIX: `Decision`, `StateGuard`, return types, ordered checks, touched-row rule |
| 6-2 | Blocker | Tables and event payloads only by legacy pointer | FIX: column meanings and an event catalogue here; exact DDL and JSON Schema in the slice file that adds them (SLICE-01 rows 12–13). CONTEST in part: byte-level DDL for later slices is written when those slices start (delivery-plan depth rule) |
| 6-3 | Blocker | `request_digest` undefined; same-key path missing | FIX: digest rule per verb; `Existing` result; refused requests are not sticky |
| 6-4 | Blocker | Attempt states incomplete; "unresolved" undefined; restart marking owner missing | FIX: attempt state set and transitions; unresolved = `CLAIMED`/`AMBIGUOUS`; `kernel.recovery` appends the interrupted outcome |
| 6-5 | Blocker | Rejected is terminal here but retryable in dispatch | FIX: rejected is final for the command; a new try is a new command key; dispatch spec aligned |
| 6-6 | Major | Reservation lifecycle incomplete; `REDUCED` as a state; amounts undefined | FIX: states `RESERVED`, `HELD`, `RELEASED` (legacy); `REDUCED` is an event; per-transition effect; entries only; quantities defined |
| 6-7 | Major | Reduction formula not written | FIX: legacy formula written out; its non-terminating quotient uses `money.rounding` |
| 6-8 | Major | `Outcome` construction rules missing | FIX: rules for refusal, `sent`, commit failure, admission commit failure; writer-failed state |
| 6-9 | Major | Compatibility projection unspecified | CONTEST in part: no compatibility projection exists until SLICE-13 (import/compat); the outcome contract and the repair rule are stated; format is fixed with SLICE-13 |
| 6-10 | Major | D04 trigger, scope, blocked decisions, repair unclear | FIX: `data_version` trigger; compared tables; only repair and recovery decisions pass; repair actor and clearing |
| 6-11 | Major | No refusal for a transition from the wrong state | FIX: `LED-R09 transition_not_allowed` |
| 6-12 | Major | Writer, epoch, serialization, readers, SQLite settings | FIX: lock, single writer thread, epoch at open, short read transactions, APSW with the legacy safe-version check and readback |
| 6-13 | Major | Migration contract missing | FIX: `ledger_meta` keys, numbered migrations, `schema.check` timing, "bundle" defined |
| 6-14 | Major | "One added field" but two; hash details | FIX: two fields; genesis, hex, exclusion, `ensure_ascii=False` |
| 6-15 | Major | Field types of contract types | FIX: field type table |
| 6-16 | Major | `command_identity` lacks verb and target; attempt lacks epoch | FIX: columns added; `attempt_id` format |
| 6-17 | Major | I-4 duplicate fill: refuse or no-op; I-3 check undefined | FIX: same fill ID and content is a no-op; different content is `LED-R08`; I-3 checks allowed reservation transitions |
| 6-18 | Major | `NotSent` raised vs `not_sent` returned | FIX: raised inside the adapter, returned as a result |
| 6-19 | Major | Caller table overlaps; safety and recovery missing | FIX: table redrawn |
| 6-20 | Major | Retry after a recorded admission refusal | FIX: refusal is not sticky; key still required |
| 6-21 | Major | REQ-LED-014 has no design | FIX: evidence publication rule |
| 6-22 | Nit | Header promises order/position transitions | FIX: header narrowed |
| 6-23 | Nit | Entry rejected after ACK | FIX: `COMPLETED` with reservation released |
| 6-24 | Nit | Undefined terms | FIX: package glossary extended |
| 6-25 | Nit | Decimal normalization | FIX: exactly two fractional digits for INR amounts; no exponent |
| 6-26 | Nit | `broker_identity` keys | FIX: kinds and primary key |
| 6-27 | Nit | `review_ref` vs "review result" | FIX: explained |

## Stage 7 — style (0 Blocker, 9 Major, 29 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7S-M1 | Major | "canonical" means both the authoritative ledger and normalized serialization | FIX: "normalized" for serialization (`normalized(value)`, normalized JSON, normalized decimal string) |
| 7S-M2 | Major | "quantities" means money fields and contract units | FIX: "reservation amounts" for the money fields |
| 7S-M3 | Major | "projection"/"repair" shared by index tables and compatibility projections; three names for the baseline | FIX: "event-derived state" throughout; index-table test file renamed |
| 7S-M4 | Major | Two event-to-module tables that disagree | FIX: one catalogue with a "Decided by" column |
| 7S-M5 | Major | Step 4 omits schema validation and evidence resolution | FIX: step 4 lists all; the writer is the actor |
| 7S-M6 | Major | Garden-path sentence on rejection after ACK | FIX |
| 7S-M7 | Major | Inconsistent legacy cite format | FIX: full path once per file with the pin |
| 7S-M8 | Major | "never stale" contradicts F-L6 | FIX |
| 7S-M9 | Major | Jargon without gloss | FIX: glossed at first use; long sentence split |
| 7S-N1…N29 | Nit | Pronouns, code formatting, passive voice, table shapes, lists | FIX where they touch content changed in this pass; the rest accepted as residual style trade-offs (EGM one-audit cap) |

## Stage 7 — structural (0 Blocker, 10 Major, 9 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7T-1 | Major | REQ keys not traced to proofs; several unproved (003, 007, 012, 014, 015, 001 chain) | FIX: Proof column on the REQ table; proofs added for the gaps |
| 7T-2 | Major | Seven proofs cited nowhere | FIX: CUJs, codes and invariants name their proofs |
| 7T-3 | Major | `LED-R06`, `LED-R07`, I-3 unproved | FIX: covered by PRF-LED-12 and PRF-LED-14 |
| 7T-4 | Major | Delivery disagrees with the plan (projection, verbs, later tables) | FIX: Delivery lists each slice's keys and proofs |
| 7T-5 | Major | Step 4 vs evidence section | FIX (same as 7S-M5) |
| 7T-6 | Major | Schema, catalogue and caller tables do not line up | FIX: one catalogue covering every index table, including `release_binding` and `order_id` identities |
| 7T-7 | Major | Crash points only on the command path; no security or scale limits | FIX: crash points for migration, activation, repair, reply loss; a "Limits" subsection |
| 7T-8 | Major | Alternatives omit this spec's own choices | FIX: rows for the lock file, `data_version`, full fold, decimal strings, evidence store |
| 7T-9 | Major | Owned modules not mapped to sections | FIX: a module map in the header |
| 7T-10 | Major | Goal 1 has no key | FIX: REQ-LED-016 |
| 7T-11…19 | Nit | Order of definitions, I-2 link, refusal rule in four places, header shape, CP column, policy inputs, reuse cites, proof class column, bare cross-references | FIX where touched; the rest accepted as residual |

## Stage 7 — design (1 Blocker, 12 Major, 6 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 7D-1 | Blocker | `RESERVATION_REDUCED` cannot be folded without the ledger rounding money | FIX: every reservation change carries `reservation_after` as decided by `kernel.reservations`; the fold only copies; the writer checks the amount arithmetic |
| 7D-2 | Major | Fills left the reservation whole (legacy reduces per fill, re-read at `reservations.py:130-133`, `:644`); double count with broker funds; no head invariant | FIX: fill-driven reduction kept from legacy; I-6 head reconciliation; PRF-LED-09 extended |
| 7D-3 | Major | No legs in the state machine; reduction split from its outcome; per-leg resolution; proportional rule wrong for spreads | FIX: per-leg attempt state; outcome and resolution carry the reservation change in one transaction; mixed baskets go `WORKING` and are never resent; proportional rule for single-leg only, spreads keep margin and worst-case loss (`README.md:776`); `RESIDUAL_RECORDED` |
| 7D-4 | Major | Outcome-commit refusals lose broker IDs | FIX: adapter results published as evidence first; recovery rebuilds outcomes from it; claimed-attempt outcomes pass the `LED-R05` gate |
| 7D-5 | Major | Epoch guard blocks recovery's `interrupted` outcome | FIX: guard compares the attempt's epoch (active for coordinator outcomes, retired for recovery) |
| 7D-6 | Major | Commit failure reported as definite | FIX: `commit_unknown` for I/O errors other than `SQLITE_FULL`; caller queries `command_status` |
| 7D-7 | Major | Same-key race refused a twin of an admitted command | FIX: identity rule also applies to `ADMISSION_REFUSED`; stage B repeats A1a |
| 7D-8 | Major | `LED-R05` exemption too broad; mid-run re-entry undefined | FIX: exemption narrowed; a detected external change makes the kernel exit and restart through recovery |
| 7D-9 | Major | Writes before activation; mutable `ledger_meta` outside the chain | FIX: migrations after activation with `MIGRATION_APPLIED`; `RUNTIME_OPENED`; `ledger_meta` is a cache; empty-file bootstrap stated |
| 7D-10 | Major | No head anchoring (`README.md:784`) | FIX: off-box head checkpoint by `operations.backup`, checked at writer open (`LED-R11`) |
| 7D-11 | Major | Catalogue missing reconciliation events | FIX: rows added |
| 7D-12 | Major | I-4 "same content" undefined | FIX: compared fields and partial no-op defined |
| 7D-13 | Major | No risks and limits | FIX: section added |
| 7D-14…19 | Nit | Alternatives; CUJ-LED-1 retry; not-sent commit failure; transaction boundary and re-entrancy; reader settings; missing transitions | FIX |

Note: the style reviewer suggested renaming `test_projection_integrity.py`; CONTEST, because the master tree names that file (`README.md:1117`). `kernel/ledger/projections.py` (`README.md:1040`) holds the fold.

## Stage 8 — intermediate zoom-out (0 Blocker, 10 Major, 3 Nit)

| # | Sev | Finding (short) | Resolution |
|---|---|---|---|
| 8-1 | Major | Exit-and-restart vs in-process re-entry disagree with the sessions spec | FIX: exit-and-restart everywhere; sessions spec corrected |
| 8-2 | Major | Outcomes committed while `LED-R05` stands are judged against wrong rows | FIX: exemption removed; recovery repairs before any other write |
| 8-3 | Major | D04 before migrations gives false mismatches | FIX: one order: migrate, compare, repair (in `RECOVERY_WRITING`) |
| 8-4 | Major | `ledger_meta` both folded and excluded | FIX: folded from `MIGRATION_APPLIED` and compared by D04 |
| 8-5 | Major | Reservation arithmetic check has no input or code | FIX: removed; I-6 and PRF-LED-09 carry it |
| 8-6 | Major | `commit_failed` vs `commit_unknown` changes nothing for the caller | FIX: one value, `commit_failed`, meaning persistence unknown; same-key retry |
| 8-7 | Major | Session P&L in the wrong module and defined twice | FIX: moved to `kernel.safety` (protection spec), legacy `session_state.py:171`; attribution justified by the legacy ownership join and the slot rule |
| 8-8 | Major | Head anchoring specifies `operations.backup` | FIX: ledger keeps only the `LED-R11` rule; the anchor source lives in the migration spec with A04-F5 |
| 8-9 | Major | Evidence store has no owner | FIX: section cut to the two rules the ledger enforces; owners are the adapters, storage classes the runtime spec |
| 8-10 | Major | Recovery rules written outside their owner; dispatch drift | FIX: recovery rules belong to the sessions spec; dispatch CP-D1 and PRF-DSP-03 aligned |
| 8-11…13 | Nit | Redundant `UNCERTAIN → FILL` row; `Refusal.schema_revision`; `export.py` unowned | FIX |
