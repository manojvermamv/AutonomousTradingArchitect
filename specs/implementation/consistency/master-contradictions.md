# Master-document contradictions and gaps

Status: **proposed** findings for the master documents' owner. The master README and ROADMAP at `b9bb32c` win every disagreement. Nothing here edits them. Each item cites exact lines, says whether it blocks any task in this package, and gives the smallest correction for the master's owner to accept or reject.

| ID | Kind | Blocks | State |
|---|---|---|---|
| [X-001](#x-001) | Stale summary after the scoped policy baseline | none | open |
| [X-002](#x-002) | Ledger schema needed before the upgrade-versus-import evaluation | none (SLICE-01 uses a provisional, disarmed schema) | open |
| [X-003](#x-003) | Test files the slices need that README §6 does not list | none | open |
| [X-004](#x-004) | POL-010 misspelt switch value vs A02-F2 unknown-value refusal | TASK-S06-05 (misspelt-value behaviour only) | open |
| [X-005](#x-005) | ATA-05 "policy contracts" as a session-scope dimension | none | open |

---

## X-001

**Kind:** stale summary (partial), not a behaviour contradiction.

**Evidence.** `README.md:1337-1350` "Owner choices retained" lists the following as rows needing a "required choice":

- daily-loss/kill/recovery permissions (`:1341`);
- promotion (`:1346`);
- RPO/RTO/failover (`:1347`).

The preface added at `README.md:1339` already says the table "is not a declaration that every detail is undecided". The legacy register decides part of each row:

- **Kill and latch:** KILL-CANCEL-1 and LOSS-LATCH-1 (`OA/docs/OWNER-DECISIONS.md:308-309`).
- **Promotion:** the bar plus per-family approval mode (`:311-312`).
- **Backup:** nightly backup cadence and the rebuild rule (`:320`, `:344`).

See [POL-002, POL-004, POL-041, POL-047](../02-policy-inventory.md).

**Effect if left.** A later reader may treat a decided matrix or approval structure as open and re-ask the owner. AGENTS forbids re-approving accepted decisions.

**Smallest correction (for the master's owner).** When the scoped inventory is accepted, change those three rows to point at the decided parts by POL ID, and leave open only:

- the recovery-hold reading;
- the loss amount;
- revocation consequences;
- RTO and failover authority.

**Package handling.** The package follows the inventory's narrower reading, and labels each decided part with its POL ID.

---

## X-002

**Kind:** sequencing gap. Not a behaviour contradiction.

**Evidence.**
- README §6 comments `resources/migrations/001_initial.sql` as "Define target schema after upgrade versus import evaluation" (`README.md:987`).
- AUD-05/A04-F4 keeps that method evidence-dependent (`README.md:1195`).
- Phase 3, the disarmed vertical slice (`README.md:1183`), needs a target ledger schema long before the Phase 7 migration choice.
- The legacy schema cannot hold ATA-06 attribution (LD-06) and has no migration path (LD-07). See [legacy-divergence.md](../legacy-divergence.md).

**Effect if left.** Either the first slices wait for a migration comparison they do not need, or they silently commit to a production schema before the comparison.

**Package handling.**
- SLICE-01 defines a target-native schema v1 in `001_initial.sql`, labelled **provisional**. It is used only by disarmed simulation and test ledgers.
- No legacy database is opened.
- The AUD-05 comparison (TASK-S13-01) confirms the file or replaces it, with a recorded reason, before any production use.

**Smallest correction (for the master's owner).** Add to the `001_initial.sql` comment, or to AUD-05: "a provisional target schema may be used by disarmed ledgers before the evaluation; production use waits for it".

---

## X-003

**Kind:** tree delta (additive). README §6 shows example test files, not a complete list.

**Evidence.** [05-module-index.md, proposed tree deltas](../05-module-index.md#proposed-tree-deltas) lists the test paths T-01 … T-19 that the slices need (T-01 … T-05 for SLICE-01). All sit inside existing §6 test directories and add no package.

**Smallest correction (for the master's owner).** Either accept that §6 test files are examples, or list these paths when the slice lands.

---

## X-004

**Kind:** policy row conflicts with an accepted master rule.

**Evidence.**
- POL-010 (21 Oct, `OA/docs/OWNER-DECISIONS.md:132`) says an omitted **or misspelt** `lifecycle.session_close` value means `square_off`; legacy code does that (`OA/src/core/framework/policy/lifecycle.py:64-71` @445eb116).
- A02-F2 (`README.md:903`) refuses unknown configuration values rather than mapping them.

**Effect if left.** The loader either breaks A02-F2 for one field or breaks the recorded owner rule.

**Package handling.** The [protection spec](../design/protection-and-safety.md#policy-inputs) keeps "omitted means `square_off`" (no conflict) and refuses a misspelt value until this item is decided. TASK-S06-05 depends on it.

**Smallest correction (for the master's owner).** Either note POL-010's misspelt-value rule as a named exception to A02-F2, or confirm that a misspelt value is refused.

---

## X-005

**Kind:** reading of an accepted master rule that the package had to make.

**Evidence.**
- ATA-05 (`README.md:450`) says to scope sessions "by applicable market/account/policy contracts".
- The [sessions spec](../design/sessions-authority-lifecycle.md#identity-contract-contractsidentitypy) keys a session by account and exchange calendar only. It records exactly one policy binding in `SESSION_OPENED`, fixed for the session's life; a different policy can take effect only at the next open.
- The legacy latch is keyed per account and IST date (LD-04), not per policy.

**Effect if left.** If ATA-05 means policy is a key field, two policies on one account and calendar would need two concurrent sessions, and the latch and pause scopes would split per policy.

**Package handling.** The package treats policy as bound to the session, not as a key field, and says so where the scope is defined. Nothing in SLICE-01 depends on this; SLICE-03 builds the scope.

**Smallest correction (for the master's owner).** Confirm that "policy contracts" scope a session through its binding, or state that policy is a key dimension of `SessionScope`.
