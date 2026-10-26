# Owner questions

Status: **open owner decision** unless a row says answered. Each question is a genuine conflict, or a new choice that the accepted baseline leaves to the owner. Routine engineering details are decided inside the specs and are not listed here. Questions are asked one at a time. Work that does not depend on an answer continues.

| ID | Topic | Raised by | Dependent tasks | State |
|---|---|---|---|---|
| [Q-001](#q-001) | Recovery hold vs kill: may automatic protection continue during a recovery hold? | POL-003 | TASK-S06-03, TASK-S06-05 | open |
| [Q-002](#q-002) | Daily-loss budget amount for the first selected strategy | POL-005 | TASK-S06-04 (latch activation for a bound policy) | open |
| [Q-003](#q-003) | View-age stamp: bar open (current) or bar close | POL-018 (existing open record item) | TASK-S04-04 (only the stamp field; the 90 s value is decided) | open, not blocking |
| [Q-004](#q-004) | Protective-vs-entry ordering and protective actions under unresolved effects | ATA-04 (`README.md:454`) | TASK-S05-03, TASK-S05-04 | open |
| [Q-005](#q-005) | First-release workflow, strategy and account scope | A10-F2 (`README.md:1165`) | Production-bound steps of SLICE-11 and SLICE-14 only | open |
| [Q-006](#q-006) | Value of `reconciliation.unknown_domain_settlement`: may an identity-verified effect with `unknown` domain settle obligations? | ATA-06 (`README.md:458`); [execution-domain spec](../design/execution-domain-and-observations.md#domain-attribution-rules) | TASK-S07-04 (binding the production value), TASK-S07-05 | open |
| [Q-007](#q-007) | How is a timed-out place with no broker ID resolved when no client tag round-trips? | D15 (`README.md:762`); [execution-domain spec](../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy); LD-20 | TASK-S07-02, TASK-S07-05 | open |
| [Q-008](#q-008) | Do analyzer, unknown and conflicting obligations count against live capacity? | ATA-06 (`README.md:458`), D16 (`:764`); [execution-domain spec](../design/execution-domain-and-observations.md#domain-attribution-rules) | TASK-S04-03, TASK-S07-04 | open |
| [Q-009](#q-009) | May a standing authorization advance a routine restart to `OPERATING`, or does every restart need a human `RECOVERY_ADVANCED`? | A04-F1/F2 (`README.md:792-794`); [sessions spec](../design/sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy) | TASK-S03-04; SLICE-14 operating procedure | open |
| [Q-010](#q-010) | What does revoking a standing binding do to a session that is already open? | A07-F4 (`README.md:891`); [sessions spec](../design/sessions-authority-lifecycle.md#standing-bindings) | TASK-S03-02, TASK-S04-05 | open |

---

## Q-001

**Recovery hold vs kill.**

```text
Requirement: During a per-strategy recovery hold, the system knows whether automatic cancels, closes and stop moves for that strategy's existing exposure may continue.
Owner: kernel.safety (permission matrix), with kernel.protection as the caller.
Proof: Engage a recovery hold with an open position and a pending trail ratchet; the expected outcome (sent or refused) matches the recorded decision.
```

**Why it matters.** The legacy code lets automatic protection keep working during a recovery hold and refuses only new entries (`OA/src/core/framework/execution/sender.py:293-296`). The 12 October decision KILL-CANCEL-1 was asked as "during kill **or recovery**, may anything still reduce risk?", and its answer says "nothing automatic" (`OA/docs/OWNER-DECISIONS.md:309`). If "recovery" there means the same thing as the per-strategy hold, the code is looser than the decision. The accepted baseline already says to keep kill and recovery-hold semantics distinct (`README.md:444`), but that does not settle which reading applies.

**Options.**

- **A — Recommended:** "Recovery" in KILL-CANCEL-1 means the authority-recovery state (A04-F1 inspection and recovery-writing stages, where nothing dispatches anyway). A per-strategy recovery hold refuses entries only, as the code does today. This keeps protection running for an open position, which is the safer outcome for a long-only buyer, and it matches observed behaviour.
- **B:** A recovery hold behaves like kill: automatic protection stops, and only owner cancel/close is permitted. This is stricter, but an open position then has no automatic trailing or session-close exit while the hold lasts.
- **C:** A free-text answer.

---

## Q-002

**Daily-loss budget amount.**

```text
Requirement: Each bound strategy policy states its daily-loss amount explicitly, so the loss latch has a defined threshold.
Owner: kernel.policy (bound policy), applied by kernel.safety.
Proof: Bind a policy without the amount and activation is refused; bind it with the amount and a breach of exactly that amount latches entries for the session.
```

**Why it matters.** The record cites "the ₹4,000 budget" (`OA/docs/OWNER-DECISIONS.md:308`). The shipped BuyerEdge default is ₹3,600 (`OA/src/strategies/buyer_edge.py:492`), and the framework default is 0 (off) (`OA/config/defaults.yaml:896`). The live host bound no stored policy (`OA/docs/OWNER-DECISIONS.md:141`). The package does not pick a number; it requires the bound policy to state one.

**Options.**

- **A — Recommended:** Confirm the value for the first selected strategy when Q-005 is answered, and record it in that strategy's bound policy. Until then, tests use a synthetic amount labelled synthetic.
- **B:** ₹4,000, as cited in the 12 October question.
- **C:** ₹3,600, as in the shipped BuyerEdge default.

---

## Q-003

**View-age stamp.** This is an existing open record item (`OA/docs/OWNER-DECISIONS.md:358`), not a new question. The 90 s value is decided. Only which bar timestamp it is measured from remains open. The target keeps today's stamp (bar open) until the owner chooses. Not blocking.

---

## Q-004

**Protective-vs-entry ordering under uncertainty.**

```text
Requirement: When one account has an unresolved broker effect, the system knows which later actions may proceed and in what order eligible commands use the account's single outbound slot.
Owner: kernel.admission with kernel.safety (conflict relation); kernel.coordinator (scheduling).
Proof: A matrix test (ambiguous entry, modify and cancel against each later action on the same and different targets) matches the written relation and order.
```

**Why it matters.** ATA-04 accepts explicit conflict dependencies and separate scheduling ownership, and resolves priorities "from the scoped policy baseline, exposing genuine new financial choices rather than copying legacy lock order" (`README.md:454`). The policy inventory decides the entry side: one position at a time (POL-007). It does not decide whether a protective modify or close may proceed while an unrelated entry on the same account is ambiguous, or whether protective commands are scheduled ahead of entries. The legacy behaviour was a process-global lock with unspecified acquisition order (`OA/src/tier1/gateway_route.py:84`, `:617-650`).

**Options.**

- **A — Recommended:** Protective actions (cancel, modify or close of existing owned exposure) depend only on unresolved effects on the same position or order. They are scheduled ahead of new entries for the same account. A new entry depends on any unresolved entry or position in its slot scope (POL-007). This keeps protection moving during an outage on an unrelated order.
- **B:** First in, first out, with account-wide dependency on any unresolved effect. Simpler, but one stalled entry can delay every stop move on the account.
- **C:** A free-text answer.

---

## Q-005

**First-release workflow scope.** This is not asked yet. The accepted baseline requires an explicit first-release composition and forbids choosing it silently (`README.md:1165`, `ROADMAP.md:237`). The delivery plan builds every slice on synthetic fixtures and recorded interfaces first, which needs no answer. Only the production-bound steps of SLICE-11 (restore rehearsal on the real backup) and SLICE-14 (initial cutover) wait for it. It will be asked with a Requirement/Owner/Proof block when those slices are reached.

---

## Q-006

**Settlement when the deployed endpoint gives no per-effect domain marker.**

```text
Requirement: The bound policy states reconciliation.unknown_domain_settlement (forbid | accounting_only); a policy without it refuses to load.
Owner: kernel.reconciliation (settlement rule), with adapters.openalgo recording the evidence.
Proof: Recorded-interface tests with unmarked responses give the bound value's outcome; an unbound value refuses to load; analyzer and unknown evidence never count as live performance either way.
```

**Why it matters.** ATA-06 requires reconciliation to validate attributable domain and identity before settlement (`README.md:458`). The first ATA-06 disposition reported that the checked OpenAlgo mirror has live response paths without an explicit mode field (`ROADMAP.md` at `461f9c2`, ATA-06 row). The current row (`ROADMAP.md:270` at `b9bb32c`) keeps "Endpoint/deployment proof pending". If that holds for the deployment, strict reading means no production obligation can ever settle. The obligations stay reserved and capacity is never released. This is not decided anywhere. Every other part of the package proceeds on simulated and recorded interfaces, which carry known domains.

**Options.**

- **A — Recommended:** First verify the deployed responses at the source (TASK-S07-05). If a per-effect marker or an account binding identifies the domain, use it. If not, bind `accounting_only`: identity-verified `unknown` settlement **for obligation accounting only**. Such effects are labelled `unknown` and excluded from any live-performance, promotion or economics claim. `conflicting` never settles.
- **B:** Bind `forbid`. Obligations stay reserved until a marker exists. This is strictest, but it may block new entries once capacity is used.
- **C:** A free-text answer.

---

## Q-007

**Resolving a timed-out place that has no broker ID.**

```text
Requirement: When a place times out with no broker order ID, and the endpoint has no verified client tag, the system has a defined route that eventually resolves the attempt and its reservation.
Owner: kernel.reconciliation (decision), kernel.authority (who may resolve), kernel.lifecycle (transition).
Proof: CUJ-DOM-4 (one same-shape unattributed order in the window) ends in the chosen resolution, never in adoption by shape and never in FOREIGN_RECORDED while the attempt could account for the order.
```

**Why it matters.** D15 forbids settling by instrument and quantity similarity (`README.md:762`). Legacy evidence says OpenAlgo's order schema has no client tag, so ownership runs only through the broker ID recorded before sending (`OA/src/core/framework/execution/book.py:14-18`). A timed-out place has no broker ID. Legacy resolves it by adopting a unique same-shape order (`OA/src/core/framework/execution/reconcile.py:130-182`, `:410`; LD-20), which the target may not do. Without another route, the attempt and any order it could account for stay unresolved, and the reservation is never released. The package's automatic routes cover only the cases where identity exists or the window is provably empty of unattributed orders ([reconciliation rules](../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy)).

**Options.**

- **A — Recommended:** First check at the source whether any place field round-trips into the orderbook (TASK-S07-05); if one does, it becomes the verified identity and the question closes. Otherwise, the owner resolves the attempt by a recorded action naming the broker order (or attesting none), with the observation as evidence. This needs a new grant action, `attempt_resolve`, in the sessions spec. The machine never adopts by shape.
- **B:** Approve unique same-shape adoption inside a window as a named exception. This conflicts with D15 and needs a master change (an X item), so it is not recommended.
- **C:** A free-text answer.

---

## Q-008

**Non-live obligations against live capacity.**

```text
Requirement: The capacity check knows whether obligations whose domain is analyzer, unknown or conflicting reduce the capacity available to new entries.
Owner: kernel.reservations (calculation), applied by kernel.admission (check B5).
Proof: With one analyzer-domain reservation open, an entry that fits only when that reservation is excluded gives the chosen outcome.
```

**Why it matters.** ATA-06 forbids settling across domains (`README.md:458`), and D16 keeps an obligation until it is reconciled (`README.md:764`). Neither says whether an analyzer reservation consumes the same capacity as a live one. OpenAlgo's mode applies to the whole deployment, so mixed domains mostly appear around a mode switch or when the domain is unknown. Until answered, the package counts them all.

**Options.**

- **A — Recommended:** Count every unresolved obligation, whatever its domain. Capacity may be understated briefly after a mode switch, but never overstated.
- **B:** Count analyzer obligations only against analyzer capacity and live against live; unknown and conflicting count against both.
- **C:** A free-text answer.

---

## Q-009

**Advancing a routine restart.**

```text
Requirement: After any kernel restart, the system knows who may move it from RECOVERY_WRITING to OPERATING, so sending and kernel-held protection resume.
Owner: kernel.recovery (stage), kernel.authority (who may advance).
Proof: Restart mid-session with an open position; the time until protection resumes, and who acted, match the chosen option.
```

**Why it matters.** A04-F1 makes authorized operation a separate transition, and A04-F2 says "no blanket automatic activation" (`README.md:792-794`). The package therefore requires a human principal with `recovery_advance` to record `RECOVERY_ADVANCED` after **every** restart. Until then nothing is sent, and kernel-held protection (trailing ratchets, the session-close exit) does not act; broker-held stops remain. A crash at 11:20 with nobody at the desk leaves an open position without trailing until someone advances. The legacy desk restarted and resumed on its own. Whether a narrower standing authorization is acceptable is the owner's call, not the package's.

**Options.**

- **A — Recommended:** Keep a human advance after every restart for the first release, and have the supervisor alert at once when a restart is waiting. This follows A04-F2 literally. Revisit after measured restart frequency.
- **B:** Allow a standing authorization, recorded once by the owner, that advances a restart automatically only when every condition holds: same trading date, same release and policy binding, D04 clean, no recovery gap, no unresolved attempt. Anything else waits for a human. This needs the master's owner to confirm it is not a "blanket" activation (an X item would record that).
- **C:** A free-text answer.

---

## Q-010

**Revoking a standing binding while its session is open.**

```text
Requirement: The bound policy states binding.revocation_effect (next_session | stop_new_entries_now); a policy without it refuses to load.
Owner: kernel.lifecycle (session), kernel.admission (entries).
Proof: Revoke the binding of an open session; new entries follow the chosen value, and protective and owner actions on existing exposure continue either way.
```

**Why it matters.** A07-F4 leaves "revocation consequences" to the owner (`README.md:891`). The [sessions spec](../design/sessions-authority-lifecycle.md#standing-bindings) records `BINDING_REVOKED` but must not decide what it does to a session that is already open. Without an answer, entries under a revoked binding either continue until the close or stop at once, and either is a choice the owner has not made.

**Options.**

- **A — Recommended:** `stop_new_entries_now`. A revocation is usually a reaction to a problem; new entries stop at once, and existing exposure is managed normally.
- **B:** `next_session`. The open session keeps its binding until it closes; the revocation prevents the next opening. This matches how a staged binding waits for the next session.
- **C:** A free-text answer.
