# Owner questions

Status: **open owner decision** unless a row says answered. Each question is a genuine conflict, or a new choice that the accepted baseline leaves to the owner. Routine engineering details are decided inside the specs and are not listed here. Questions are asked one at a time. Work that does not depend on an answer continues.

| ID | Topic | Raised by | Dependent tasks | State |
|---|---|---|---|---|
| [Q-001](#q-001) | Recovery hold vs kill: may automatic protection continue during a recovery hold? | POL-003 | TASK-S06-03, TASK-S06-05 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-002](#q-002) | Daily-loss budget amount for the first selected strategy | POL-005 | TASK-S06-04 (latch activation for a bound policy) | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-003](#q-003) | View-age stamp: bar open (current) or bar close | POL-018 (existing open record item) | TASK-S04-04 (only the stamp field; the 90 s value is decided) | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-004](#q-004) | Protective-vs-entry ordering and protective actions under unresolved effects | ATA-04 (`README.md:454`) | TASK-S05-03, TASK-S05-04 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-005](#q-005) | First-release workflow, strategy and account scope | A10-F2 (`README.md:1165`) | Production-bound steps of SLICE-11 and SLICE-14 only | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-006](#q-006) | Value of `reconciliation.unknown_domain_settlement`: may an identity-verified effect with `unknown` domain settle obligations? | ATA-06 (`README.md:458`); [execution-domain spec](../design/execution-domain-and-observations.md#domain-attribution-and-combination) | TASK-S07-04 (binding the production value), TASK-S07-05 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-007](#q-007) | How is a timed-out place with no broker ID resolved when no client tag round-trips? | D15 (`README.md:762`); [execution-domain spec](../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy); LD-20 | TASK-S07-02, TASK-S07-05 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-008](#q-008) | Do analyzer, unknown and conflicting obligations count against live capacity? | ATA-06 (`README.md:458`), D16 (`:764`); [execution-domain spec](../design/execution-domain-and-observations.md#domain-attribution-and-combination) | TASK-S04-03, TASK-S07-04 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-009](#q-009) | May a standing authorization advance a routine restart to `OPERATING`, or does every restart need a human `RECOVERY_ADVANCED`? | A04-F1/F2 (`README.md:792-794`); [sessions spec](../design/sessions-authority-lifecycle.md#recovery-stages-kernelrecoverypy) | TASK-S03-04; SLICE-14 operating procedure | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-010](#q-010) | What does revoking a standing binding do to a session that is already open? | A07-F4 (`README.md:891`); [sessions spec](../design/sessions-authority-lifecycle.md#standing-bindings) | TASK-S03-02, TASK-S04-05 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-011](#q-011) | Dispatch deadline per verb (entry, cancel, modify, close) | D13 (`README.md:758`) | TASK-S05-08, TASK-S05-01 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-012](#q-012) | How is a timed-out cancel, modify, close or entry of unknown domain resolved, when absence in a book of one domain says nothing about another? | D15 (`README.md:762`), ATA-06 (`:458`); [execution-domain spec](../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy) | TASK-S07-02, TASK-S07-05; protection retries (TASK-S06-01) | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-013](#q-013) | Protective placement: legacy basket (entry, SL-M stop and LIMIT target together, at plan prices), stop placed on the first fill, or fill-priced protection? | `README.md:1345` (planned vs fill-based protection); [protection spec](../design/protection-and-safety.md#protective-stop-and-tick-exits-kernelprotectionpy); LD-22 | TASK-S06-01, TASK-S06-05 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-014](#q-014) | May delegated human principals, not only the authenticated owner, use the kill exceptions (cancel, close), `kill_release`, `latch_unlock` and `pause_clear`? | POL-002, POL-004, POL-027; `README.md:1343` | TASK-S03-01, TASK-S05-07, TASK-S06-04 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-015](#q-015) | Value of `account.max_worst_case_loss` for the first account | `README.md:776`; [intent spec](../design/intent-to-admission.md#b5-capacity) | TASK-S04-03 (binding a production value) | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-016](#q-016) | Response to foreign (manual or outside) broker activity: record only, escalate, or hold entries for the affected account or underlying? | `README.md:1347` (foreign exposure response); POL-009; [execution-domain spec](../design/execution-domain-and-observations.md#reconciliation-kernelreconciliationpy) | TASK-S07-02 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-017](#q-017) | May a new entry be admitted while a closed position's protective order still rests on the same underlying? | POL-007; [protection spec](../design/protection-and-safety.md#conflict-relation-kernelsafetypy) | TASK-S05-03, TASK-S06-01 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-018](#q-018) | A modify that raises an entry order's limit: how much more capital does it commit? | [SLICE-04 step 2](../plan/slices/SLICE-04-intent-to-admission.md#a-limit-raise-on-an-entry-order-q-018); [intent spec B2](../design/intent-to-admission.md#b2-effect) | TASK-S04-02 (B2 for a modify) | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-019](#q-019) | What amount, margin and worst-case loss does a long-only plan carry for capacity (B5)? | [SLICE-04 step 3](../plan/slices/SLICE-04-intent-to-admission.md#the-plans-money-figures-q-019-answer-option-b) | TASK-S04-02 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-020](#q-020) | How is each structure leg's stop and target level set? | [SLICE-04 step 4](../plan/slices/SLICE-04-intent-to-admission.md#step-4--structure_v1); [protection spec, Structures](../design/protection-and-safety.md#structures-kernelprotectionpy) | TASK-S04-02, TASK-S06-01 | answered 2026-10-27 ([answers](owner-answers-2026-10-27.md)) |
| [Q-021](#q-021) | While a position's group has an unresolved effect, may protection raise its stop's quantity up to the owned position? | [SLICE-05 step 1 build](../plan/slices/SLICE-05-dispatch-conflicts-scheduling.md#step-1-as-built); [protection spec, conflict row 2](../design/protection-and-safety.md#conflict-relation-kernelsafetypy) | TASK-S05-03, TASK-S06-01 | answered 2026-10-28 ([answers](owner-answers-2026-10-27.md)) |
| [Q-022](#q-022) | A broker trade with no trade ID (live Upstox): how is it counted as a fill? | upstream-findings PART 31; [SLICE-07 step 4](../plan/slices/SLICE-07-observations-reconciliation-domain.md#step-4--the-openalgo-adapter) | The OpenAlgo adapter's production composition (SLICE-11); TASK-S07-05 | open |
| [Q-023](#q-023) | How is a timed-out close, cancel or modify resolved when no book can prove its absence? | [SLICE-07 step 4](../plan/slices/SLICE-07-observations-reconciliation-domain.md#step-4--the-openalgo-adapter); Q-012 | The OpenAlgo adapter's production composition (SLICE-11); TASK-S07-05 | open |
| [Q-024](#q-024) | The trail's opposing-signal tightening: what supplies the opposing score in the kernel? | `src/core/framework/protection/trail.py:476-481` @445eb116; [SLICE-06 step 1](../plan/slices/SLICE-06-protection-and-safety.md#step-1--the-ladder-protection-state-and-the-derived-leg) | TASK-S06-01 (SLICE-06 step 2's trail loop) | answered 2026-10-28: option B, after a correction ([answers](owner-answers-2026-10-27.md)) |
| [Q-025](#q-025) | A refused or failed stop modify: does the ladder keep legacy's library rule (the move not taken) or the live host's (only the stop put back)? | `scripts/run_framework_live.py:5221-5278` @445eb116; [SLICE-06 step 1](../plan/slices/SLICE-06-protection-and-safety.md#step-1-as-built) | TASK-S06-01 (SLICE-06 step 2's trail loop) | answered 2026-10-28 ([answers](owner-answers-2026-10-27.md)) |
| [Q-026](#q-026) | The deep-OTM delta exit: legacy's live host never ran it. Keep it in the kernel, or not? | `scripts/run_framework_live.py` @445eb116 (no `premium_exit` call); [SLICE-06 step 2](../plan/slices/SLICE-06-protection-and-safety.md#step-2--the-protection-loop) | TASK-S06-01 (step 2's tick exits), step 3's exits | answered 2026-10-28 ([answers](owner-answers-2026-10-27.md)) |
| [Q-027](#q-027) | Basket maintenance where the spec goes beyond legacy's live host (partial fills, partial or unfilled entries, failed cancels, unproven roles): spec or legacy? | `scripts/run_framework_live.py:4588-4687` @445eb116; [SLICE-06 step 3](../plan/slices/SLICE-06-protection-and-safety.md#step-3--basket-placement) | TASK-S06-01 (SLICE-06 step 3) | answered 2026-10-28 ([answers](owner-answers-2026-10-27.md)) |
| [Q-028](#q-028) | The daily-loss latch: the whole account's P&L (legacy) or only the system's own positions (the spec)? | `scripts/run_framework_live.py:7983-7988` @445eb116; [SLICE-06 step 4](../plan/slices/SLICE-06-protection-and-safety.md#step-4--the-latch-safety-visibility-and-the-recovery-hold) | TASK-S06-04 | answered 2026-10-29 ([answers](owner-answers-2026-10-27.md)) |
| [Q-029](#q-029) | A restart that cannot read the broker: hold every strategy until a person releases it (legacy), or let the stale-book refusal lift on its own? | `scripts/run_framework_live.py:3127-3169` @445eb116; [SLICE-06 step 4](../plan/slices/SLICE-06-protection-and-safety.md#step-4--the-latch-safety-visibility-and-the-recovery-hold) | TASK-S06-03 | answered 2026-10-29 ([answers](owner-answers-2026-10-27.md)) |

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
Requirement: When one account has an unresolved broker effect, the system knows which later actions may proceed, in what order eligible commands use the account's single outbound worker, and whether the busy bound (coordinator.busy_applies_to) also refuses protective actions.
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
- **B:** Bind `forbid`. Obligations stay reserved until a marker exists. Facts (reach, fills, completion) are still recorded, so protection is placed either way; the cost is capacity, not protection. This is strictest, but it may block new entries once capacity is used.
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

---

## Q-011

**Dispatch deadline per verb.**

```text
Requirement: The bound policy states dispatch.deadline_ms for entry, cancel, modify and close; a policy without them refuses to load.
Owner: kernel.coordinator (deadline sweep), kernel.admission (records the deadline).
Proof: A command still unclaimed at its deadline is refused with DSP-R01 and its reservation released; synthetic values in tests are labelled.
```

**Why it matters.** D13 leaves deadline values to owner policy (`README.md:758`). A deadline bounds how long an admitted command may wait for a busy worker or a clearing conflict before it is refused, so a stale entry is never sent late. Too short refuses useful work; too long sends on stale grounds. Protective verbs (cancel, close) may deserve longer deadlines than entries. Legacy had no deadline: a request waited on the route lock as long as it took (`OA/src/tier1/gateway_route.py:621-652`).

**Options.**

- **A — Recommended:** Measure the time from admission to claim on recorded sessions (A09-F4), then set an entry deadline shortly above its high percentile, and longer deadlines for cancel and close. Until measured, simulation and tests use labelled synthetic values; production refuses to load.
- **B:** One deadline for every verb, chosen by the owner now.
- **C:** A free-text answer.

## Q-012

**Resolving a timed-out attempt whose domain is unknown.**

```text
Requirement: A timed-out attempt (any verb) whose response carried no verified domain marker has a defined route to RESOLVED_REACHED or RESOLVED_NEVER_REACHED, so its command, reservation and any protection waiting on it do not stay UNCERTAIN for ever.
Owner: kernel.reconciliation (decision), kernel.lifecycle (transition), kernel.authority (if a human resolves).
Proof: a timed-out stop modify, cancel, close and entry with no marker each end in the chosen resolution; none is resolved by a book of another domain.
```

**Why it matters.** Absence in a book proves an attempt never reached the broker only when the book and the attempt share a domain (ATA-06; D15). A timed-out attempt has no usable response, so its domain is `unknown`, and the package's absence rule can never fire for it. Every timed-out cancel, modify or close therefore stays `UNCERTAIN`: it cannot be retried, and a timed-out trailing-stop modify freezes that stop's ratchet. Legacy has no per-effect domain at all and resolves by the live book (LD-12).

**Options.**

- **A — Recommended:** A cancel, modify or close takes its domain from its target order's recorded domain (the order exists, and the verb acts on it); an entry stays under [Q-007](#q-007). Absence then works for the three target-bound verbs once their endpoint contract proves coverage and visibility (TASK-S07-05).
- **B:** A human principal resolves each such attempt by a recorded action naming the evidence (the `attempt_resolve` action proposed in Q-007, widened to every verb).
- **C:** Treat the deployment's mode, read at the time, as the domain. This makes a session-level read into per-effect proof, which ATA-06 rejects; listed only for completeness.
- **D:** A free-text answer.

## Q-013

**Protective placement.**

```text
Requirement: The bound policy states protection.placement; a policy without it refuses to load.
Owner: kernel.protection (placement), kernel.admission (the protective request).
Proof: PRF-PRT-01 runs every value: the resting orders, their prices and when they are sent match the chosen rule.
```

**Why it matters.** The master keeps "planned vs fill-based protection" as an owner choice (`README.md:1345`) and keeps legacy money semantics unless a recorded decision changes them (`README.md:780`). Legacy sends the entry, a SELL SL-M stop and a SELL LIMIT target together in one basket, priced from the plan (`OA/src/core/framework/execution/orders.py:155-214`); its docstring records that the BuyerEdge baseline instead placed protection after the fill, priced from the executed price, and calls the basket a deliberate trade for a narrower unprotected window. The package's draft placed only a stop, on the first fill, and executed the target in the kernel. Each choice changes the unprotected window, the exit slippage and whether two resting full-quantity sells exist (POL-008).

**Options.**

- **A — Recommended:** Keep the legacy basket (`basket_at_plan`): entry, SL-M stop and LIMIT target at plan prices. It preserves legacy money behaviour; the spec then defines how the resting target and stop are kept within the owned quantity (OCO by the kernel on the first fill of either).
- **B:** Stop on the first fill at plan levels; target and deep-OTM delta exits by the kernel on a tick (`stop_on_fill`, the draft's design).
- **C:** Protection after the fill, priced from the executed price (`fill_priced`, the earlier BuyerEdge baseline).
- **D:** A free-text answer.

## Q-014

**Who may use the kill exceptions and the unlocks.**

```text
Requirement: The safety matrix and the grant table name exactly which principals may cancel or close under kill, release kill, unlock the latch and clear a pause.
Owner: kernel.safety (matrix), kernel.authority (grants).
Proof: PRF-PRT-04 and PRF-SES-01 run each permitted and each refused principal.
```

**Why it matters.** The approved rows say "the authenticated owner" (POL-002, POL-004), and legacy requires an `OwnerCommand` from an authenticated owner entry point (`OA/src/core/framework/execution/sender.py:281-296`). The master keeps allowed actions and actors for cancel, close, protect and unlock as an owner choice (`README.md:1343`). Until answered, the package keeps the legacy reading: these actions are the owner principal's only.

**Options.**

- **A — Recommended:** Owner only, as legacy and the approved wording.
- **B:** Any human principal holding the named grant action, including delegated operators.
- **C:** A free-text answer.

## Q-015

**Worst-case-loss limit per account.**

```text
Requirement: The bound policy states account.max_worst_case_loss; a policy without it refuses to load.
Owner: kernel.admission (check B5).
Proof: PRF-ADM-09 refuses an entry whose worst-case loss exceeds the bound value; tests use labelled synthetic values.
```

**Why it matters.** This is a money limit. TASK-S04-03 characterizes the legacy rule's shape (how worst-case loss is computed and compared), which the master keeps (`README.md:780`); the number itself is policy, as the daily-loss budget is ([Q-002](#q-002)). Legacy values are evidence, not a default.

**Options.**

- **A — Recommended:** The owner states the value for the first account; TASK-S04-03 reports the legacy value beside it as evidence.
- **B:** A free-text answer.

## Q-016

**Response to foreign broker activity.**

```text
Requirement: The bound policy states reconciliation.foreign_response; a policy without it refuses to load.
Owner: kernel.reconciliation (finding), kernel.lifecycle and kernel.safety (response).
Proof: PRF-DOM-02 runs each value against a foreign order observed on a bound account.
```

**Why it matters.** POL-009 says how outside orders arrive (as foreign broker observations). The response is a separate owner choice (`README.md:1347`): recording only leaves an unexpected position unremarked; holding entries stops trading on a manual action.

**Options.**

- **A — Recommended:** `escalate`: record `FOREIGN_RECORDED` and raise an operator alert (`RECONCILIATION_ESCALATED`, reason `foreign_activity`); nothing else changes.
- **B:** `record_only`.
- **C:** `hold_entries`: also engage a hold (reason `foreign_activity`) for the strategies on the affected account and underlying until a human releases it.
- **D:** A free-text answer.

## Q-017

**Entry while a closed position's protective order still rests.**

```text
Requirement: Conflict row 1 states whether a resting protective order of a closed position blocks a new entry on the same account and underlying.
Owner: kernel.safety (conflict relation row 1), applied by kernel.admission check B3.
Proof: PRF-PRT-04 runs the chosen row against a closed position whose stop still rests.
```

**Why it matters.** Under `basket_at_plan` a position can reach `closed` (a square-off, a human close, a foreign trade, or the other leg's fill) while one protective SELL order still rests until its cancel lands. Row 1 today blocks an entry only while a position is open or an entry is unresolved (POL-007, `buyer_edge.py:687`), so a new entry on the same underlying can be admitted while that SELL rests. If the new entry is the same instrument, the old SELL can fill against it. The protection spec keeps such a position a protected subject and cancels the order either way; the question is only whether entries wait for that. Changing it changes an entry gate, so it is the owner's (found by the third EGM design review of the basket section).

**Options.**

- **A — Recommended:** Row 1 also blocks an entry while any position on the same account and underlying has a protective order not observed terminal.
- **B:** Row 1 unchanged (POL-007 as written); the residual SELL is cancelled by protection without blocking entries.
- **C:** A free-text answer.

## Q-018

**Capital committed by a modify that raises an entry order's limit.**

**Answered 2026-10-27: option A** ([answers](owner-answers-2026-10-27.md)). Such a modify is refused at B2 (`ADM-R07`, `wrong_field`); no modify reaches B5.

```text
Requirement: B5 checks a modify that raises committed capital on the increase, and kernel.reservations raises the entry's reservation in the same commit (intent spec, B5).
Owner: kernel.admission (B5 for a modify), kernel.reservations.
Proof: TASK-S04-02 tests the chosen arithmetic against hand calculations; until then B5 refuses (ADM-R09, modify_increase_unbound).
```

**Why it matters.** The spec requires the check but no source gives its arithmetic: legacy never modifies an entry order (its `modify` moves resting protective legs only, `src/runtime/execution_gateway/__init__.py:1292-1300` @445eb116), and the retained capacity rule has no modify path (`reservations.py` @445eb116). The increase in amount, margin and worst-case loss is a money rule. No first-release one-leg entry reaches it, because each is a MARKET order with no limit; a structure entry's legs may carry limits. The step 2 build refuses such a modify until this is answered.

**Options.**

- **A — Recommended:** Refuse it in the first release (legacy parity): a modify may not raise an entry order's limit (`ADM-R07`, `wrong_field`). Revisit when a strategy places limit entries.
- **B:** Admit it on the increase, with Δamount = (new limit − current limit) × remaining quantity, and margin and worst-case loss raised by the same Δ (the most a long option can add), the entry's reservation raised by Δ in the same commit through a `reservation_after` on the modify's `COMMAND_ADMITTED`, and ledger invariant I-6 extended so a raise counts toward the admitted amount.
- **C:** A free-text answer.

## Q-019

**The plan's money figures for capacity.**

**Answered 2026-10-27: option B** ([answers](owner-answers-2026-10-27.md)), with A and C kept documented and selectable by configuration for later adoption.

```text
Requirement: every plan carries amount, margin and worst_case_loss, which B5 checks against funds, margin and account.max_worst_case_loss (intent spec, B5).
Owner: kernel.planner (money_figures).
Proof: tests/unit/test_planner_rules.py checks each option against hand calculations.
```

**Why it matters.** Legacy reserved money only for structure plans (`structure_reservation_snapshot`, `scripts/run_framework_live.py:437-553` @445eb116), with `amount = worst_case_loss =` the structure's maximum loss and `margin` from OpenAlgo's margin preview (`:480-509`), which a pure planner cannot call. A one-leg entry, every entry BuyerEdge makes, carried no figures and reserved nothing; its only money gates were the planner's loss budget (`orchestrator.py:749-771`) and sizing. The target checks capacity on every entry, so the figures are a new money rule.

**Options.**

- **A:** `amount = margin = worst_case_loss = Σ ask × quantity`: the full premium of a MARKET buy at its likely fill price. A plan with no ask is refused. Selectable: `debit_price: ask`, `worst_case_loss: full_debit`.
- **B — chosen:** the same full debit at the LTP, legacy's entry premium (`orchestrator.py:607`). Bound: `debit_price: ltp`, `worst_case_loss: full_debit`.
- **C:** `amount = margin =` premium × quantity at the LTP; `worst_case_loss = (premium − stop) × quantity`, legacy's `proposed_risk` (`orchestrator.py:757`). Selectable: `debit_price: ltp`, `worst_case_loss: to_stop`.

## Q-020

**Each structure leg's stop and target level.**

**Answered 2026-10-27: option C** ([answers](owner-answers-2026-10-27.md)), with A and B recorded for later adoption.

```text
Requirement: each leg of a multi-leg structure gets its own resting stop on its first fill (protection spec, Structures).
Owner: kernel.planner (structure_v1), kernel.protection.
Proof: tests/unit/test_planner_rules.py refuses every structure that passes legacy's stages.
```

**Why it matters.** Legacy's structure planner sets no per-leg stop price (`src/core/framework/structures/planner.py:222-226` @445eb116). A multi-leg structure "owns aggregate protection", applied by a supervisor through the policy's named actions after entry. The target places one resting stop per leg, so every leg needs a level, and legacy gives no rule to retain. A stop level is a money and protection rule. No shipped strategy uses a structure (BuyerEdge emits only `single_long_option`).

**Options.**

- **A:** Each BUY leg gets the one-leg rule BuyerEdge uses today: `entry_stop` from that leg's delta and LTP premium (moneyness bands, floor, cap), with the stop rounded up and the target down to its tick.
- **B:** The template's declared fields (`protection.hard_stop_points` / `target_points`, or the leg's `risk.stop_points` / `target_points`) as fixed premium-point distances per leg. Legacy declared these but never applied them at plan time.
- **C — chosen:** `structure_v1` plans and gates as legacy, then refuses every structure at stage `stop` with `structure_protection_unbound` until a later decision. No structure entry is possible.

## Q-021

**Raising a protective stop while its group has an unresolved effect.**

**Answered 2026-10-28: option A** ([answers](owner-answers-2026-10-27.md)).

```text
Requirement: conflict row 2 decides whether a modify that raises a protective order's quantity waits for the group's unresolved effects (protection spec, conflict relation).
Owner: kernel.safety (Conflicts).
Proof: tests/unit/test_conflict_relation.py::test_row_2_exceptions refuses the raise while a close of the group is unresolved and admits a lowering modify.
```

**Why it matters.** The SLICE-05 step 1 build found row 2's modify exception can never decide: row 2 applies only to an action that adds sale quantity or removes a stop, and the exception covers only a modify that lowers the stop's total. A lowering modify already passes, so the exception is redundant. The open case is a raise to the owned quantity (which B2 allows, intent spec): it adds sale quantity, and with a close of the same position in flight or uncertain, a raised stop can sell more than is owned. The EGM design review had already removed a raise from the exception (D-M1, [plan review](../egm/plan/review.md)).

**Options.**

- **A — chosen:** Refuse it. A raise waits until the group's unresolved effects resolve; a lowering modify, and every cancel row 2 excepts, still pass. The protection spec and the step 1 build already do this.
- **B:** Except a raise whose new total equals the recorded fills plus the owned quantity. Risk: an in-flight close plus a raised stop can oversell. It would reverse D-M1 and amend the protection spec.

## Q-022

**A broker trade with no trade ID (live Upstox): how is it counted as a fill?**

```text
Requirement: a fill counts once, by its fill ID (ledger I-4). An entry's fill creates its ledger position; a reservation is reduced, and a close completes, only from recorded fills.
Owner: adapters.openalgo (the tradebook mapping), kernel.lifecycle.
Proof: tests/integration/test_openalgo_contract.py (the live-shaped trade test); tests/unit/test_reconciliation_rules.py (trade_without_id).
```

**Why it matters.** OpenAlgo's live Upstox tradebook carries no trade ID (upstream-findings PART 31); analyze mode does. The built rule leaves such a row out and escalates it when the order is ours. In live mode that means:

- no entry fill is ever recorded, so no ledger position exists;
- every close is refused `not_open`, because a close may sell at most what the ledger owns (`min(owned, broker net)`);
- protection can never close a position the kernel opened; the broker's own stop, and a human through OpenAlgo, still can;
- no reservation is reduced and no close completes;
- each dropped trade of ours is escalated (`trade_without_id`), and none is lost silently.

Analyze mode is unaffected.

Legacy instead gives such a row a hashed identity, `anonymous-evidence:v1:<sha256>:<occurrence>` (`src/contract/fills.py:90-109,319-330` @445eb116). The hash covers the order ID, symbol, exchange, product, action, quantity, price and timestamp, and identical rows are counted by occurrence. Its risk is a field in the key that changes between polls (a timestamp or a price the broker later corrects), which would count one fill twice. Over-counting is capped for closes by `min(owned, net)`, and under `forbid` no reservation is reduced anyway (Q-006).

**Options.**

- **A — built until answered:** leave such rows out and escalate them. No automatic close is possible in live mode until OpenAlgo passes the trade ID through.
- **B:** adopt legacy's hashed identity, with its double-count risk.
- **C:** report upstream that the broker's trade ID should be passed through (as for PART 31), and keep A until it is.

Nothing runs live before this is answered: the adapter is not composed until it is.

## Q-023

**How is a timed-out close, cancel or modify resolved when no book can prove its absence?**

```text
Requirement: an action whose send timed out stays UNCERTAIN until reconciliation resolves it (reached, by identity or level; never reached, by usable absence).
Owner: kernel.reconciliation, kernel.lifecycle (attempt_resolve).
Proof: tests/unit/test_reconciliation_rules.py; the execution-domain spec's Q-012 rule.
```

**Why it matters.** Through the OpenAlgo adapter, every result and observation has domain `unknown` and coverage `unknown` until TASK-S07-05 binds endpoint contracts, so absence is never usable. Effects:

- an ambiguous close with no order ID can be resolved only by an order that appears, never by absence;
- an ambiguous cancel or modify resolves only when its target's book shows the change;
- `attempt_resolve` covers entries only (Q-007).

Such an action stays `UNCERTAIN`. Conflict row 2 then holds every later close, and every stop removal, on that position (only a human's protective cancel is excepted). Q-012's escalation reaches the operator, but no recorded route resolves it.

**Options.**

- **A:** extend `attempt_resolve` to closes, cancels and modifies: a human names the order the action placed, or that it placed none, citing a published orderbook.
- **B:** compose the adapter only after TASK-S07-05 binds contracts that make absence usable for the consumed books, and keep Q-012's escalation for anything they cannot cover.
- **C:** both: B for the common case, and A for what the contracts cannot cover.

Nothing runs live before this is answered: the adapter is not composed until it is.

## Q-024

**The trail's opposing-signal tightening: what supplies the opposing score in the kernel?**

```text
Requirement: the ladder moves the stop exactly as legacy (ATA-01, POL-012, PRF-PRT-08).
Owner: kernel.protection (the trail loop, SLICE-06 step 2).
Proof: tests/unit/test_protection_states.py (golden cases with an opposing score).
```

**Why it matters.** Legacy's trail cycle takes an `opposing_score`: the score of a fresh, strong signal against the position, which the strategy judges and passes (`src/analysis/core/eventsource.py:81-84` @445eb116). It shrinks the activation threshold and speeds up the step, so the stop moves closer (`src/core/framework/protection/trail.py:476-481`). In the target, protection runs in the kernel, and a strategy worker's only route to the kernel is an intent. If nothing supplies the score, the kernel's trail is looser than legacy's whenever an opposing signal exists.

**Options.**

- **A:** a strategy worker reports its opposing score through a typed, recorded input that the kernel reads at the next bar. This is a new contract; the worker's view and freshness are checked as they are for intents.
- **B:** drop the tightening and record it as a Deviation among PRF-PRT-08's listed corrections. The trail is then never tighter than the base ladder.
- **C:** compute the opposing score in the kernel, from the strategy's retained scorer over the same view. The scorer would then run in the kernel process.

SLICE-06 step 1 ports the ladder with the input intact, so any option fits. Step 2 is deepened only after the answer.

**Answer (2026-10-28): option A.** The strategy worker reports its opposing score as a typed, recorded input, and the kernel reads it at the next bar. SLICE-06 step 2 specifies the contract.

**Correction (2026-10-28), raised while deepening step 2; reconfirmation asked.** The "Why it matters" paragraph above was wrong about legacy's live behaviour. At 445eb116 nothing passes an opposing score:

- The live host steps the ladder through `orch.on_bar(managed, bar_index=…, bars=bars, emit=emit)` with no `opposing_score`, no `delta` and no `modify` (`scripts/run_framework_live.py:5485`).
- `git grep opposing_score 445eb116` finds only the ladder's own parameter (`trail.py:438`, `:693`, `:873`). `src/analysis/core/eventsource.py:81-84` is a description of an unavailable input, not a producer, and BuyerEdge computes no opposing score.

So option A adds a tightening that the live system never applied, and PRF-PRT-08's comparison over recorded days would show it as a difference. Option B is not a Deviation after all: it is exactly the live behaviour. The owner is asked to confirm A or choose B with this corrected.

**Answer (2026-10-28), after the correction: option B.** The kernel's ladder is cycled with no opposing score, exactly as the live host did. Option A's contract is not built. The ladder keeps the parameter, since it is ported unchanged.

## Q-025

**A refused or failed stop modify: which legacy rule does the ladder keep?**

```text
Requirement: the ladder moves the stop exactly as legacy (ATA-01, POL-012, PRF-PRT-08).
Owner: kernel.protection (the trail loop, SLICE-06 step 2).
Proof: tests/unit/test_protection_states.py (golden cases); PRF-PRT-08 over recorded days.
```

**Why it matters.** Legacy has two rules for a stop move the broker does not take, and they leave the ladder in different states:

- **The library rule** (`src/core/framework/protection/trail.py:451-456`, `:558-561`, `:584-587` @445eb116). The cycle calls `modify` before it changes the stop. On False it returns `blocked` and changes neither `sl` nor `premium_trail_active`, so an activation that the broker refused is attempted again on the next bar. SLICE-06 step 1 built this rule as the "refused" outcome.
- **The live host's rule** (`scripts/run_framework_live.py:5221-5278` @445eb116). The host cycles with no `modify`, so the move is taken, then sends the modify. On failure it puts back only `sl` (`managed.position.sl = before`, `:5277`). `premium_trail_active`, `premium_trail_peak`, `premium_trail_sl` and `trail_activation_sl` stay as the move set them. So after a refused activation the ladder counts as active and moves again only on a new high. When reconciliation later proves the broker holds a higher stop, the host adopts it (`:5466-5471`).

The two give different stops after any refused or failed modify. The live host's rule is what traded; the library's is what the ladder's own docstring describes.

**Options.**

- **A:** keep the library rule (as built in step 1).
- **B:** the live host's rule: after a refused or failed modify, keep the accepted outcome with only `sl` put back. Step 2 builds this, and step 1's "refused" outcome is replaced or kept only as evidence.

Step 2 is deepened only after the answer.

**Answer (2026-10-28): option B.** After a refused or failed modify the ladder keeps the move's other fields and puts back only `sl`, as the live host did. Step 2 builds it, and step 1's library-rule "refused" outcome is replaced.

## Q-026

**The deep-OTM delta exit: legacy's live host never ran it. Does the kernel run it?**

```text
Requirement: protection keeps every approved exit rule exactly (ATA-01, POL-012).
Owner: kernel.protection (the tick exits, SLICE-06 step 2; the basket exits, step 3).
Proof: tests/unit/test_protection_states.py; PRF-PRT-08 over recorded days.
```

**Why it matters.** The protection spec runs `premium_exit` on each tick, and its first test closes the position when the option's delta falls below `delta_exit_threshold` (0.10). At 445eb116 nothing live calls it:

- `scripts/run_framework_live.py` has no call to `premium_exit`, `check_exit` or `on_tick`; it steps only the bar ladder (`:5485`).
- The only callers are the replay driver (`src/core/framework/protection/replay.py:179`), the replay outcome rule (`src/data/replay_engine/outcomes.py:177`) and `orchestrator.on_tick` (`src/core/framework/runtime/orchestrator.py:1108`), which nothing calls.

So a kernel deep-OTM exit is new live behaviour: it would sell positions that the live system held until the stop, the target or square-off. The stop and target rows are not affected. Under `basket_at_plan` the target rests at the broker, as it did live.

**Options.**

- **A:** keep the exit as the spec says. The kernel closes on a deep-OTM tick.
- **B:** do not run it, as the live host did not. `premium_exit` is called with no delta, so its delta test never fires. The other rows are unchanged.

Step 2 is built without the deep-OTM row until the answer; everything else in step 2 does not depend on it.

**Answer (2026-10-28): option A.** The kernel keeps the deep-OTM delta exit as the spec says: `premium_exit` receives the tick's delta, and a delta below `delta_exit_threshold` starts the exit sequence (reason `deep_otm_delta`). This is new live behaviour relative to the 445eb116 host.

## Q-027

**Basket maintenance: keep the spec's rules, or legacy's live host's, where they differ?**

```text
Requirement: protection keeps every approved rule exactly; it never leaves more resting sell quantity than the
position can absorb without a recorded reason (ATA-01, Goal 4, POL-008, Q-013).
Owner: kernel.protection (SLICE-06 step 3, basket_at_plan).
Proof: tests/unit/test_protection_basket.py; PRF-PRT-01.
```

**Why it matters.** The protection spec's [Basket placement](../design/protection-and-safety.md#basket-placement-basket_at_plan-kernelprotectionpy) section adds five rules that legacy's live host at 445eb116 never ran, or ran differently. The owner chose the legacy basket (Q-013), and live-host parity for the trail (Q-024 B, Q-025 B). Each rule below gates real sell orders.

1. **A protective leg fills partly.** Legacy cancels every other protective leg on any recorded close, even a partial one (`_cancel_resting_siblings`, `scripts/run_framework_live.py:4588-4664`, called at `:6647-6649`). After a partial target fill the stop is cancelled whole, and the rest of the position has no stop. The spec instead modifies the sibling to its recorded fills plus `q` ("new: keeps each leg within q"), and cancels it only when `q` ≤ 0.
2. **The entry ends partly filled.** Legacy never changes the legs: both rest at the planned quantity (`src/core/framework/execution/orders.py:200`). It trails only fully filled entries (`run_framework_live.py:5522`) and skips them at square-off, leaving the broker's square-off as the backstop (`src/runtime/session_close.py:144-152`). The spec shrinks both legs to `q`, trails the stop, and squares the position off.
3. **The entry never fills, or is rejected, while its legs rest.** Legacy has no rule: the legs stay resting (an unproven entry becomes a recovery hold, `run_framework_live.py:2921-2929`). The spec cancels them as orphans (F-P15).
4. **A sibling's cancel fails.** Legacy holds the strategy at once and does not retry (`run_framework_live.py:4658-4687`). The spec retries a transient refusal until `reconciliation.working_escalation_secs` has passed, then holds.
5. **The basket's leg roles cannot be proven** (a failed in-send read, an unmatched ID). Legacy leaves the entry `UNKNOWN`, re-runs the join on later books, and holds the strategy when it stays ambiguous (`src/core/framework/execution/reconcile.py:480-573`; `run_framework_live.py:2921-2929`). The spec escalates `protective_roles_unassigned` once and submits nothing for the subject until `LEG_ASSIGNED`, with no hold.

**Options.**

- **A:** the spec's five rules, as written.
- **B:** legacy's five behaviours, for live-host parity.
- **Per item:** any mix; the step's text marks each of the four rows.

Step 3 is written with option A and marks the five rows; their build waits on the answer. Nothing else in step 3 depends on it.

**Answer (2026-10-28): option A.** The spec's five basket rules, as written in SLICE-06 step 3.

---

## Q-028

**The daily-loss brake: count the whole account's P&L, or only the trades the system made?**

```text
Requirement: entries stop for the rest of the session once the day's loss reaches the budget (POL-004, POL-005, Q-002).
Owner: kernel.safety (SLICE-06 step 4).
Proof: tests/unit/test_safety_matrix.py; PRF-PRT-05.
```

**In plain words.** The brake adds up the day's profit and loss and stops new trades at a loss of ₹3,600. The question is which trades it adds up.

**Why it matters.** The old system added up **every position on the account**, including trades it did not make, such as a manual trade. It fed that one total to each strategy's own brake (`scripts/run_framework_live.py:312-353`, `:7941`, `:7983-7988` @445eb116). OpenAlgo's position book cannot be split by strategy (upstream-findings, the `positionbook` row). The protection spec says the brake counts **only the system's own positions**, "as legacy does", but legacy does not. With one strategy on one account, as in the first release, both give the same number unless a trade the system did not make is on the account that day. Either way there is one brake per session (step 4, "The latch's scope").

**Options.**

- **A — Recommended: the whole account, as the old system did.** A manual trade's loss counts too, so the brake trips sooner.
- **B: only the system's own trades, as the spec says.** The brake counts the rows for instruments the system traded this session, open or closed. A manual trade on the same instrument would be counted with them, since the book cannot tell them apart.

| Check | A (whole account) | B (own trades) |
|---|---|---|
| Effort now | Less: sum every row | More: match rows to the session's positions |
| Simpler substitute | It is the simpler one | A |
| Extra work later | None now | None now |
| Lock-in | None: switching is one rule | None |
| More than needed? | No | Yes, for one strategy on one account |
| Easy to undo? | Yes | Yes |

Doing nothing is not an option: the spec and the old system disagree, so the build needs one answer.

**Recommendation: A.** It protects the account's real money, it is what ran before, and it is simpler. Step 4 is written for A and marks each line B changes.

**Answer (2026-10-29): option A.** The whole account's P&L, as the old system did.

---

## Q-029

**At a restart where the broker cannot be read: hold every strategy until a person looks, or resume once the broker answers?**

```text
Requirement: a strategy whose orders the system cannot account for sends no new entries until resolved (POL-003, TASK-S06-03).
Owner: kernel.recovery (SLICE-06 step 4).
Proof: tests/recovery/test_crash_boundaries.py; PRF-PRT-04.
```

**In plain words.** When the old system restarted and could not read the broker, it put every strategy on hold. A person then had to look and release each one by hand, even after the broker came back.

**Why it matters.** At startup the old system did one extra check: it compared the broker's positions with its own records (`scripts/run_framework_live.py:3127-3169` @445eb116). If it could not read the broker then, that comparison never ran, so it held. Its order check ran at every pass after that (`:7918-7926`). The new system already refuses new entries while the broker cannot be read (`ADM-R05`), and it holds a strategy while one of its entry orders cannot be accounted for (step 4). But **it does not compare positions yet** (a gap recorded in step 4). So under B, a position that disagrees with the records after such a restart would not be noticed by the system.

**Options.**

- **A — Recommended: hold, as the old system did.** Each restart where the broker does not answer needs a person to look before trading resumes.
- **B: no hold for this case.** New entries wait while the broker cannot be read and resume on their own once it answers.

| Check | A (hold) | B (no hold) |
|---|---|---|
| Effort now | A read at each advance, and a hold | Nothing: already built |
| Simpler substitute | B, once the system compares positions | It is the simpler one |
| Extra work later | A release by hand after each such restart | None |
| Lock-in | None | None |
| More than needed? | No, while positions are not compared | Leaves the position gap open |
| Easy to undo? | Yes | Yes |

**Recommendation: A, for now.** A person looking before trading resumes is the only check on positions until the system compares them itself. Once it does, B becomes the simpler and safe choice. Step 4 is written for A and marks each line B changes.

**Answer (2026-10-29): option B.** No hold: entries wait while the broker cannot be read and resume on their own once it answers. Until the kernel compares positions (step 5), a position that disagrees with the records after such a restart is not noticed by the system.
