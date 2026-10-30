# Security and operator

* **Status:** proposed (package spec), deepened when SLICE-10 started (2026-10-30) from the 45-line stub this file was; revised the same day after the SLICE-10 design review (findings F-1…F-13). Implements accepted master decisions; adds no new ones.
* **Precedence:** master README, then ROADMAP, then this file. A disagreement is an X item in [master-contradictions](../consistency/master-contradictions.md), never an edit here.
* **Specified here (exclusive), and where:**

  | Module | Section |
  |---|---|
  | `interfaces/authorization.py` | [Channels and principals](#channels-and-principals-interfacesauthorizationpy), [Operator requests and confirmations](#operator-requests-and-confirmations-contractsidentitypy-interfacesauthorizationpy), [Read scope and disclosure](#read-scope-and-disclosure-interfacesauthorizationpy-interfacesmcppy), [Restore continuity](#restore-continuity-interfacesauthorizationpy) |
  | `interfaces/cli.py`, `interfaces/api.py` | [Operator commands](#operator-commands-interfacesclipy-interfacesapipy), [Other legacy owner mutations](#other-legacy-owner-mutations), [Owner API transport](#owner-api-transport-interfacesapipy) |
  | `interfaces/mcp.py` | [MCP surface](#mcp-surface-interfacesmcppy) |
  | `adapters/unix_channel.py` | [The kernel's local channel](#the-kernels-local-channel-adaptersunix_channelpy) |
  | `settings/secrets.py` | [Secrets](#secrets-settingssecretspy) |
  | `operator_ui/*` | [Operator UI](#operator-ui-operator_ui) |

* **Contributes to** (owned elsewhere; each change is listed in [The kernel's binding check](#the-kernels-binding-check-kernelauthoritypy), [Kill inputs](#kill-inputs) and [Restore continuity](#restore-continuity-interfacesauthorizationpy), and is integrated into the owning spec): `contracts/identity.py` and `kernel/authority.py` ([sessions spec](sessions-authority-lifecycle.md#grants-and-the-authority-check-kernelauthoritypy)); `kernel/safety.py` and `kernel/coordinator.py` ([protection spec](protection-and-safety.md#kill-and-holds-kernelsafetypy)); the ledger event catalogue ([ledger spec](ledger-and-atomic-transaction.md#event-catalogue)); the kernel adapter's evidence writes (`adapters/openalgo.py`).
* **Consumes:** the grant model, `authority.check` and `recheck`, the recovery stages and the `confirm_grant` hook ([sessions spec](sessions-authority-lifecycle.md)); the kill, hold and latch entry points ([protection spec](protection-and-safety.md)); `policy.clear_pause` ([intent spec](intent-to-admission.md)); `command_status` ([dispatch spec](dispatch-and-coordination.md#command-status-read-only)); `lifecycle.resolve_attempt` ([execution-domain spec](execution-domain-and-observations.md)); the exit-advice `application_request` ([strategies spec](strategies-and-cognition.md)); independent ledger readers ([ledger spec](ledger-and-atomic-transaction.md)); the release digest ([configuration spec](configuration-artifacts-release.md)).
* **Master anchors:** [Security boundaries and operator control](../../../README.md#security-boundaries-and-operator-control) (`README.md:861-871`); the A06 decision rows (`README.md:353-357`); Combined-F4 (`README.md:365`); AUD-03 (`README.md:261`); A02-F1 (`README.md:901`); the reuse rows (`README.md:1145`, `:1157`); the acceptance row (`README.md:1244`).
* **Legacy citations** are at 445eb116, relative to the legacy repository root, each opened at that commit. Built target code is cited relative to `src/autonomous_trading` in OA_NEW.

## Overview

**In plain words.** This part decides who is talking to the trading system and what they may ask it to do. Today the owner uses three doors: the `at` command in a terminal on the server, the web console, and AI tools over MCP. The new system keeps the three doors and today's rules for each. Stopping trading is instant: `at kill-switch on` writes the kill file even when nothing else is running, and the kernel stops before its next order. Restarting trading, lifting a strategy's hold, and cancelling or closing under the kill switch need you to type a confirmation in the terminal, as today. AI tools may read, and may propose a trade idea to an AI strategy, but can never place an order or lift a safety block. Every other change the console makes today (strategy settings, policies, AI settings, research approvals) keeps its button and goes to the part of the new system that owns it. Three things change, none of them about money: every owner action is written into the same ledger as the trades instead of a side file; each request is tied to exactly one action, so it cannot be replayed or swapped; and keys are read from protected files at start-up and never written into any record, log or backup. Who may trade, the kill rules and the limits stay as they are today, and as the owner decided on 27 October (Q-014).

## The problem

* **Owner actions are audited in a side file.** The console writes one JSONL row before each mutation (`src/interfaces/console/api/security.py:92-112`), apart from the ledger that records the trade (LD-15). The two can disagree, and a restore of one does not restore the other.
* **The browser guard is one token per process.** The console's CSRF token is a constant for the life of the gateway process (`security.py:13`; `admin_console/src/lib/write.ts:41-45`). A captured mutation can be sent again until the process restarts; only the exposure routes' owner command is single-use (`src/core/framework/execution/owner_command.py:157-169`).
* **Exact intent covers two actions.** The signed, single-use, 120-second owner command binds channel, principal, action, strategy, broker order ID and reason (`owner_command.py:17-18`, `:90-96`), but only for cancel and close. Kill release, hold release and latch unlock rely on the terminal prompt alone.
* **Identity is implicit.** Every loopback owner-API caller is `owner-api:local`, and every identity the authenticating proxy vouches for is `owner-proxy:<fingerprint>` (`src/interfaces/console/api/routes/ai_management.py:26-41`). `at exposure` and `at loss-latch unlock` post through that API, so they record `owner-api:local` (`src/interfaces/cli/exposure.py:48-56`; `scripts/loss_latch.py:33-41`, `:75`). There is no delegated operator, which the owner's Q-014 answer now allows.
* **Secrets are environment variables.** The broker key is read from the environment and withheld from children by name (`src/config/__init__.py:216-229`); redaction is by key name, not value (`src/contract/safety.py:12-18`).
* **Restored authority.** The target records grants in the ledger (SLICE-03). A ledger restored from a backup taken before a revocation would bring the revoked grant back (Combined-F4).

## Goals

1. Each door authenticates its caller by evidence it can check; a name in a payload is a claim; a relay cannot widen what its caller may do (A06-F1).
2. Every privileged request is bound to its principal, operation, target, argument digest and validity; a confirmation authorizes one request once and never revives (A06-F4, Combined-F4).
3. Every owner action, and every refused one from an authenticated human, is recorded in the kernel ledger (REQ-SEC-003).
4. Secrets come from protected references, are recorded by identifier only, and reach no child, log, record or backup (A06-F3).
5. Reading a field and disclosing it to a destination are checked separately (A06-F5).
6. Today's operator surface and its money rules are kept: every legacy owner mutation has a stated disposition; the typed confirmations, the kill semantics and the read-only MCP stay ([standing rules](../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)).

## Non-goals

* No new financial permission, emergency permission, blanket confirmation or general authorization framework (`README.md:1244`, `:863`).
* No change to who may trade: grants, the kill matrix and the latch are the sessions and protection specs', as the owner answered them (Q-014).
* No new human entry door; the only human modify is the application of exit advice, as legacy (`owner_command.py:35`, `:53-54`; `src/runtime/ai_management/advice.py:968-979`).
* The observation mechanism (native read-only credential or a mediator, A06-F2) is the execution-domain and runtime specs' (TASK-S07-06, TASK-S11-06). This spec proves only that no interface exposes a broker credential or a write route to it (REQ-SEC-010).
* Push delivery of alerts, the service units and their uids: the runtime spec (SLICE-11).

<a id="requirement-keys-pointers"></a>

## Requirement keys

The decision text is the requirement; the label is a reminder.

| Key | Label | Decision (anchor) |
|---|---|---|
| REQ-SEC-001 | Interfaces authenticate the principal and verify delegation; payload names are claims; a relay cannot widen scope | A06-F1 (`README.md:863`) |
| REQ-SEC-002 | Privileged requests and any policy-required confirmation bind actor, operation, target or account, argument digest and validity; consumed confirmations never revive | A06-F4 (`README.md:869`); Combined-F4 (`README.md:365`) |
| REQ-SEC-003 | Owner actions (including KILL-CANCEL-1 cancel and close, and latch unlock) are recorded in the kernel ledger, not a side file; refused human requests are recorded, bounded | AUD-01, AUD-03 (`README.md:754-756`); LD-15; POL-002, POL-004 |
| REQ-SEC-004 | Secrets resolve from protected references; replacement only through supported process transitions; identifiers are recorded, never values | A06-F3 (`README.md:867`) |
| REQ-SEC-005 | Read scope and disclosure destinations are enforced separately, including caches, model context and telemetry | A06-F5 (`README.md:871`) |
| REQ-SEC-006 | MCP exposes no order-capable tool; inferred or proxied `auth.mode: none` refuses | POL-009, POL-053 |
| REQ-SEC-007 | Local authenticated channel validates exact contract versions | A02-F1 (`README.md:901`); `adapters/unix_channel.py` tree comment (`README.md:1045`) |
| REQ-SEC-008 | Restored grants are confirmed against a security record kept apart from the ledger; unconfirmed ones are revoked, provably current ones kept | Combined-F4 (`README.md:365`) |
| REQ-SEC-009 | Each door keeps today's operator commands and typed confirmations; every other legacy owner mutation keeps its door and reaches its owning module; stopping is never gated; no safety gate is lifted over MCP | A06-F4 (`README.md:869`); POL-002…POL-004; Q-014 |
| REQ-SEC-010 | No interface or interface child holds a broker credential or a write route to observations (the interface half of A06-F2) | A06-F2 (`README.md:865`) |
| REQ-SEC-011 | A human's application of exit advice is one authenticated, bound request through normal admission | POL-028; AUD-01 (`README.md:754`) |

## Critical user journeys

### CUJ-SEC-1: The owner closes a position under kill from the terminal

* **Given** kill is engaged and the owner's position on account A has no resting protective order.
* **When** the owner runs `at exposure close STRATEGY BROKER_ORDER_ID --reason TEXT`.
* **Then** the CLI connects to the operator process's CLI socket; the peer is a mapped login user outside any service; a challenge comes back; the owner types the broker order ID; the operator process mints the request at that moment and relays it to the kernel. The kernel binds it, admits the close under the kill exception (Q-014), and records `OPERATOR_REQUEST` and `COMMAND_ADMITTED` in one decision. A mistyped ID sends nothing (PRF-SEC-06).

### CUJ-SEC-2: A captured console request is sent again

* **Given** a recorded `POST /strategies/S/loss-latch/unlock` with its session's CSRF token and nonce, already committed.
* **When** it is sent again in the same session, or after the kernel restarted or was restored.
* **Then** in the same session it returns the recorded result and records nothing new; after a kernel restart or restore the session is gone (`SEC-R01`); a request minted before a restore and absent from the restored ledger is refused (`SEC-R19`) (PRF-SEC-07, PRF-SEC-03).

### CUJ-SEC-3: An AI client asks to lift the loss latch

* **Given** an MCP client holding every grantable scope.
* **When** it lists tools and calls anything named like an unlock.
* **Then** no tool lifts a safety gate or places, modifies or cancels an order; the call is refused (`SEC-R13`). Read tools still work under kill (PRF-SEC-08).

### CUJ-SEC-4: Restore from a backup taken before a revocation

* **Given** grant G was delegated, then revoked, then the host was lost; the restored ledger shows G unrevoked.
* **When** recovery runs its continuity step.
* **Then** with the security journal reachable, G is revoked again and other journal-confirmed grants are kept; with it unreachable, every restored delegated grant is revoked (`restore_unverified`) and the owner re-issues through the owner root. No confirmation or request consumed before the loss authorizes anything (PRF-SEC-10).

### CUJ-SEC-5: The broker key is replaced

* **Given** the kernel runs with credential `openalgo/api_key` version `v3`.
* **When** the operator installs `v4` and restarts the kernel through the release path.
* **Then** the new epoch records `CREDENTIAL_BOUND` with `v4`; nothing re-reads the key while running; a command left `UNCERTAIN` by the restart stays uncertain and is reconciled, never resent because the key changed (PRF-SEC-04).

### CUJ-SEC-6: The kill file while the kernel is down

* **Given** the kernel and the operator process are stopped.
* **When** the owner runs `at kill-switch on`.
* **Then** the CLI writes the kill file at once and says so; it reports that the kernel could not be told. When the kernel starts, it reads the file before any claim and records `KILL_ENGAGED` (principal `kernel:safety`, reason `kill_file`); nothing is sent before that (PRF-SEC-12).

## Technical plan

### Channels and principals (`interfaces/authorization.py`)

A **channel** is a way in, with its own evidence. Authentication produces the kernel's `Authenticated(principal, path)` (`kernel/authority.py:41-44`, built in SLICE-03), extended with `request` and `via` ([below](#the-kernels-binding-check-kernelauthoritypy)). Humans never connect to the kernel's socket: as in legacy, only approved services do (`src/runtime/tier1_authority/service.py:270-277`).

| Channel | Evidence checked | Principal | Path |
|---|---|---|---|
| CLI | Peer credentials on the operator process's CLI socket: the uid is listed in `interfaces.principals` (socket access by the `at-operators` group), and the peer pid belongs to no systemd service unit (a login session) | The mapped principal; the owner only if the map names that uid the owner | `owner_credential` or `operator_credential` |
| Owner API (HTTP) | Reachability ([transport](#owner-api-transport-interfacesapipy)): a loopback peer with a loopback `Host` and no forwarding header, or the configured public host through the local proxy with its auth header | Loopback: the owner, recorded `owner-api:local`; proxy: the identity the header names, mapped by `interfaces.principals`, else the owner, recorded `owner-proxy:<sha256(identity)[:16]>` (legacy `ai_management.py:26-41`) | `owner_credential` or `operator_credential` |
| MCP | The bearer token, under `mcp.auth.mode` `token`, `jwt` or `openalgo` ([MCP surface](#mcp-surface-interfacesmcppy)) | `service` principal `mcp:<client_id>` | none: MCP reaches no kernel operation |
| Kernel socket | Peer credentials: the main pid of an approved systemd unit, each unit under its own uid ([kernel channel](#the-kernels-local-channel-adaptersunix_channelpy)) | A service per `channel.services`, or the operator relay | `local_channel`; a relayed human keeps the path the operator process authenticated |
| Kill input | The kill file exists or the kill flag is set ([Kill inputs](#kill-inputs)) | `kernel:safety` | `in_process`, built-in `kill_engage` only |

* **Identity map.** `interfaces.principals` maps a channel identity (`uid:<n>`, `proxy:<identity>`, `mcp:<client_id>`) to a principal value and kind, and for reads to its accounts. A delegated human operator exists only through this map, and acts only with the grants the kernel holds for that principal (Q-014): the interface grants nothing.
* **Fork call (who is the owner on the console).** A loopback caller, or a proxy-vouched identity the map does not name, is the owner, as legacy. Pinning the owner to one named identity is listed as an improvement, not made.
* **Deviation (who is the owner on the CLI).** The CLI owner is an explicitly mapped uid outside any service, not "any process that reaches loopback" as legacy's `at exposure` was (`exposure.py:48-56`). The CLI now talks over a socket whose peer can be checked, and the Tier-1 rule that no service process may act as the owner is kept (`service.py:270-277`). Logged for the owner's review.
* **Channel identity.** Each request records `channel_identity`: `uid:<n>`, `owner-api:local`, or `owner-proxy:<fingerprint>`, legacy's attribution (`ai_management.py:37-41`).
* **Payload names are claims.** No request field sets the principal. A `by` or `principal` field is kept beside the authenticated principal as text, as legacy `attributed` does (`src/interfaces/mcp/core/identity.py:226-235`).
* **Relays.** The operator process authenticates humans and forwards their requests to the kernel. The kernel accepts a relayed principal only from the peer listed in `channel.relays`, only on the paths that relay may assert (`owner_credential`, `operator_credential`), never a `kernel` or `service` principal. The relay is recorded as `via`. A relay adds no permission: the kernel checks the human's own grants (`SEC-R10` otherwise).

### Operator requests and confirmations (`contracts/identity.py`, `interfaces/authorization.py`)

```text
OperatorRequest(request_id, epoch, channel, channel_identity, principal, via, operation, target,
                argument_digest, confirmation_id | None, issued_at, valid_until)
argument_digest(operation, target, args) -> sha256 hex of the canonical [ "operator-request/1", operation, target, args ]
```

* **Fields.** `operation` is a catalogue name ([catalogue](#operator-commands-interfacesclipy-interfacesapipy)). `target` is `{account: [broker, account] | null, subject}`; `subject` is the strategy, broker order ID, session, grant, pause, binding, advice or command key the operation names. `args` are every other argument, reason included. `epoch` is the kernel epoch the operator process last saw. The digest uses the ledger envelope's canonical JSON; `contracts` may not import the kernel, so step 1 gives `contracts/identity.py` the same canonical function and a test that both agree.
* **Which process holds what.** Interface sessions, nonces and challenges live in the operator process's memory (CLI and owner API) or the MCP process's (MCP sessions). None is stored or restored. Each operator session records the kernel epoch and identity it was opened under; when the relay sees another kernel epoch, every session and challenge is dropped (`SEC-R01` thereafter), so nothing survives a kernel restart or restore, as legacy's owner-command key dies with its process (`owner_command.py:27-29`).
* **Owner API sessions.** `GET /session` from a reachable caller mints a session bound to that caller's channel identity, with its CSRF token. It ends at `interfaces.session_ttl_secs`, at a kernel epoch change, at `POST /session/end`, or when the identity opens more than `interfaces.sessions_per_identity` (the oldest is dropped). A token presented by another identity is refused (`SEC-R03`).
* **Request identity and retries.** `request_id = sha256(principal, channel_identity, nonce)`, independent of the session, so a retry on a new connection keeps it. The nonce is the caller's `x-request-id` (legacy header, `security.py:16-24`; the console already sends one per write, `write.ts:47-50`), required on every mutation. The same `request_id` with the same digest returns the recorded result and makes no second effect; with another digest it is refused (`SEC-R04`). The operator process remembers nonces for at least `interfaces.request_ttl_secs`; the kernel's record is permanent ([below](#the-kernels-binding-check-kernelauthoritypy)).
* **Validity.** The request is minted when it is executed, after any typed confirmation, and `valid_until = issued_at + interfaces.request_ttl_secs`. **Fork call:** 120 s, legacy's owner-command lifetime, counted from the moment the command is issued after the typed confirmation and checked at the send (`deploy/at:4302-4305`; `src/interfaces/console/api/routes/exposure.py:30-34`; `owner_command.py:58`, `:154-156`).
* **Confirmations.** Only where `interfaces.confirmations` requires one for that door and operation. The first release binds legacy's table ([catalogue](#operator-commands-interfacesclipy-interfacesapipy)); no read, development task or routine check needs one (`README.md:869`).
  1. `prepare(operation, target, args)` returns `Challenge(confirmation_id, prompt, expected)`; the challenge binds the principal, session, operation, target and digest, and lives as long as its session (legacy's prompt has no deadline of its own).
  2. `execute(confirmation_id, typed, nonce)` passes only when the challenge exists in this session, for the same principal, with the same digest, and `typed == expected` (exact); it then mints the request with that `confirmation_id`. Each failure has its code ([refusal codes](#refusal-codes)).
  3. The kernel consumes the confirmation when it commits the request; a refused submission leaves the challenge usable until its session ends.
* **Typed confirmation is a guard against mistakes, not attackers** (legacy, `deploy/at:4275-4276`). Authentication and the binding are the security; the confirmation only proves the person meant this one action.

### The kernel's binding check (`kernel/authority.py`)

The kernel revalidates independently (`README.md:869`). Each change below is a contribution to the [sessions spec](sessions-authority-lifecycle.md#grants-and-the-authority-check-kernelauthoritypy) (and the protection spec where named), integrated with SLICE-10 step 2.

* `Authenticated` gains `request: OperatorRequest | None` and `via: Principal | None`.
* `authority.bind(auth, operation, target, args) -> Refusal | None` runs first in every human entry point: `safety.engage_kill`, `release_kill`, `engage_hold`, `release_hold`, `unlock_latch`; `policy.clear_pause`; `lifecycle.resolve_attempt`; `recovery.advance`, `record_fence`; `authority.issue`, `revoke`, `authorize_binding`, `revoke_binding`; and action admission for human `cancel`, `close` and advice-applied `modify`. For a `human` principal it refuses:
  * `SEC-R09` when `request` is absent or its operation, target or digest differ from the entry point's own recomputation;
  * `SEC-R07` when `valid_until` has passed;
  * `SEC-R19` when the `request_id` is not recorded and a restore has been activated since the request's `epoch` (it may have been committed before the loss), so a retry after a restore never repeats an effect;
  * `SEC-R20` when the operation is `advice_apply` and kill is engaged: legacy refused advice-applied commands under kill, because they were never owner commands (`killswitch.py:19-25`; `owner_command.py:8-10`).

  `kernel` and `service` principals need no request.
* **Record.** The entry point's decision also commits `OPERATOR_REQUEST` (the request's fields), folded into the `operator_request` index table: `request_id` primary key, `confirmation_id` unique when set, `argument_digest`, `sequence`. The same `request_id` with the same digest returns the first decision's result; with another digest `SEC-R04`; a used `confirmation_id` `SEC-R08`. This is the audit record, in the ledger (REQ-SEC-003, LD-15).
* **Refused requests.** When `bind`, `authority.check` or the entry point's guards refuse an authenticated human's bound request, the kernel records `OPERATOR_REQUEST_REFUSED` (`request_id`, principal, channel identity, operation, target, code), at most once per `request_id` and code, as legacy audits refused writes (`src/interfaces/console/routes.py:566`; AUD-03, `README.md:261`). Unauthenticated refusals are not attributable and are only logged by the door.
* **Validity at dispatch.** `authority.recheck` also refuses a human command whose request's `valid_until` is before its dispatch claim (`SEC-R07`), as legacy refuses an owner command older than 120 s at the send. The coordinator records `DISPATCH_REFUSED` and the reservation is released.
* **Kill-input exemption.** `BUILTIN["kernel:safety"]` gains `kill_engage`, usable only by the kill-input check with reason `kill_file` or `kill_flag`; `safety._authorized` (`kernel/safety.py:209-220`, today human-only) accepts that one case. `kernel:safety` never holds `kill_release`. This only restricts.
* **Migration.** The `operator_request` table is a new numbered migration (tree delta T-67).

### Operator commands (`interfaces/cli.py`, `interfaces/api.py`)

The catalogue below is the kernel-bound privileged surface. **Fork call:** which door offers which operation, and which typed confirmation it needs, is legacy's at 445eb116, cited per row. Every operation also needs its grant action in the kernel (Q-014).

| Operation | Kernel entry | CLI (`at` name) | CLI confirmation | Owner API | Legacy |
|---|---|---|---|---|---|
| `kill_engage` | the kill file, then `safety.engage_kill` | `at kill-switch on` | none: instant | not offered | `deploy/at:4259-4272` |
| `kill_release` | `safety.release_kill` | `at kill-switch off` | type `DISENGAGE` | not offered (status only) | `deploy/at:4273-4280`; console reads only (`src/interfaces/console/operations_surface.py:196-207`) |
| `hold_engage` | `safety.engage_hold` | `at holds engage <strategy> --reason` | none | `POST /strategies/{s}/hold` | new operator hold (protection spec); restricting only |
| `hold_release` | `safety.release_hold` | `at holds clear <strategy>` | type the strategy ID | not offered (status only) | `deploy/at:4364-4370`; `operations_surface.py:210-219` |
| `latch_unlock` | `safety.unlock_latch` | `at loss-latch unlock <strategy> --reason` | type the strategy ID; a reason | `POST /strategies/{s}/loss-latch/unlock` (a reason, no typing) | `scripts/loss_latch.py:60-75`; `src/interfaces/console/api/routes/loss_latch.py:25-35` |
| `pause_clear` | `policy.clear_pause` | `at pauses clear <id> --reason` | none | `POST /ai/pauses/{id}/clear` | `ai_management.py:86-87` |
| `cancel`, `close` (human) | action admission | `at exposure cancel\|close <strategy> <broker_order_id> --reason [--quantity N]` | type the broker order ID | `POST /exposure/cancel`, `/exposure/close` | `deploy/at:4301-4305`; `exposure.py:37-71` |
| `advice_apply` | `application_request` (strategies spec), then action admission (close or protection modify) | not offered | — | `POST /ai/advice/{id}/apply` (a reason) | `ai_management.py:90`; `src/authoring/capabilities/ai_management.py:716-736` |
| `binding_authorize` | `authority.authorize_binding`, `revoke_binding` | `at bindings approve\|revoke` | none | candidate approval, strategy deactivate, policy activate and rollback ([below](#other-legacy-owner-mutations)) | `src/interfaces/console/api/routes/candidate_activation.py:34-52` |
| `grant_admin` | `authority.issue`, `revoke` | `at grants issue\|revoke` | none | not offered | new (Q-014) |
| `recovery_advance` | `recovery.advance`, `record_fence` | `at recovery advance\|fence` | none | not offered | new (SLICE-03) |
| `attempt_resolve` | `lifecycle.resolve_attempt` | `at attempts resolve` | none | not offered | new (Q-007) |

* **No human entry door, and no human modify door except advice application,** as legacy: the owner command allows cancel and close only (`owner_command.py:53-54`), and the owner's only stop moves came from applied advice (`advice.py:968-979`).
* **Cancel and close arguments** keep legacy's shape (strategy, broker order ID, reason, optional positive finite quantity; `exposure.py:56-66`) and become the typed `CancelRequest` or `CloseRequest` of the execution contracts; the position is found from the broker order ID through `broker_identity`. Admission, the kill matrix and the conflict relation then decide, as for any human principal.
* **Latch unlock target.** The CLI and API name a strategy, as legacy; the kernel's latch is per session (protection spec). The door maps the strategy to the standing binding that names it and that binding's scope to today's session; zero or several matches refuse (`SEC-R21`) and the caller names the session with `--session`.
* **Advice application.** The route calls the strategies spec's `application_request(advice_id, principal, reason)`, which returns one typed close or protection modify; the door binds it as operation `advice_apply` and submits it. The kernel refuses it under kill (`SEC-R20`). Until SLICE-09 composes the advice store the route refuses (`SEC-R22`).
* **Reads** (no request record, no confirmation): kill and hold status, latch status, positions, orders, commands and `command_status(command_key)` for one's own commands (the owner reads all), the alert list, and the outcome event stream (`GET /events?after=<sequence>`). They come from independent ledger readers, not the writer. Kill status reports which kill input is present and whether the kernel watches a file, as legacy (`src/core/framework/execution/killswitch.py:119-129`).
* **Alerts.** The operator alert route is a read model: the kernel's in-process alert lists (`kernel/policy.py:54`, `kernel/recovery.py:98`), served over the kernel channel's `alerts` read, merged with recorded `RECONCILIATION_ESCALATED` events and journal-pending revocations. Push delivery is SLICE-11's.

### Other legacy owner mutations

Every other mutation the legacy doors offer, with its disposition. **Kept** means the door stays and the request reaches the named owner, which applies its own rules; a route whose owner is not yet built refuses (`SEC-R22`) until it is. Each row is a **Fork call**: the door and its effect are legacy's, and any money effect happens only through the owner's existing path.

| Legacy mutation | Legacy | Disposition |
|---|---|---|
| Strategy deactivate (owner API and registry action) | `src/interfaces/console/api/routes/strategies.py:30-36`; `src/interfaces/console/routes.py:462-463` | Kept: `binding_authorize` revoke for the strategy's binding (new entries refused at once, open positions protected, Q-010), and the strategy host stops the worker (SLICE-09) |
| Strategy activate (registry action) | `routes.py:462-463` | Kept, to `strategies/registry.py` (SLICE-09); trading still needs a standing binding (sessions spec) |
| Register, write script, delete, stage and roll back strategy config | `routes.py:442-461` | Kept, to `strategies/registry.py` and the configuration spec's staging; a config takes effect only through a new binding |
| Policy stage, propose (validate, preview and diff are reads) | `strategies.py:48-104` | Kept, to the configuration spec's policy staging |
| Policy activate, rollback | `strategies.py:82-98` | Kept: `binding_authorize` for the staged or the previous policy digest |
| AI config validate, stage, activate, rollback; blueprint and exit-blueprint validate and stage | `ai_management.py:74-83`; `src/authoring/capabilities/ai_management.py:588-615` | Kept, to `cognition/blueprint.py` (SLICE-09); activation through the configuration spec's binding |
| Advice generate, evidence build, designer run | `ai_management.py:91-94` | Kept, to the cognition modules (SLICE-09); no money effect |
| Advice apply | `ai_management.py:90` | Kept on the kernel ([catalogue](#operator-commands-interfacesclipy-interfacesapipy), REQ-SEC-011) |
| Promotion approval mode; dataset lineage repair | `src/interfaces/console/api/routes/promotion_approval.py:24-33`; `src/interfaces/console/api/routes/lineage_repair.py:43-61` | Kept, to `research/promotion.py` and `research/datasets.py` (SLICE-12) |
| Run a named operation | `src/interfaces/console/api/routes/operations.py:25-28`; `routes.py:577-596` | Kept, to `research/jobs.py` (the catalogue is analysis jobs only, `src/interfaces/console/operations.py:39-62`) |
| Global settings write and override delete | `routes.py:547-575`; `src/interfaces/console/api/routes/configuration.py:15-27` | Kept, to the configuration spec: staged for the next release binding, since settings are immutable per process (A02-F3) |
| Tick watch start | `routes.py:648-660` | Kept, to the market process (SLICE-08) |
| Console MCP writes: job enqueue and cancel, research config proposal, trial open and close, `framework_propose_intent` | `admin_console/src/config/tools.ts:95-110` | Kept on the MCP surface ([below](#mcp-surface-interfacesmcppy)), the console being an MCP client |
| `at orders reconcile`; `POST /orders/reconcile` | `deploy/at:4317-4322`; `src/interfaces/console/api/routes/reconciliation.py:11-59` | Mapped: the target has no order registry to repair; reconciliation records ownership from broker evidence continuously, and the owner's manual attribution is `attempt_resolve`. The command stays as a read of the day's reconciliation findings |
| `at orders clear-conflict` | `deploy/at:4323-4329` | Mapped: a target `CONFLICT_RECORDED` refuses no send and holds no marker to clear (execution-domain spec); money it keeps reserved is released only by reconciliation evidence. A human release route would be a new permission: listed, not made |
| Every other `at` command (install, update, restart, deploy, config, backup, approver, strategy start and stop) | `deploy/at` (not checked one by one) | The configuration and runtime specs (SLICE-11) |

### Kill inputs

Legacy engages kill by a flag or by the existence of a file, read on every send, so a `touch` stops trading when nothing else answers (`killswitch.py:88-100`). **Fork call:** both inputs are kept, as engage-only inputs, under legacy's keys.

* **Keys.** `risk_guard.kill_switch` (bool) and `risk_guard.kill_switch_file` (a path; relative from the deployment root, as `killswitch.py:68-85`), with legacy's environment alias `MCP_KILL_SWITCH_FILE` (`deploy/at:4242-4246`). **Deviation:** a live composition with an empty `risk_guard.kill_switch_file` refuses to start; legacy's shipped default is `""` and then nothing is watched (`config/defaults.yaml:132-133`; `deploy/at:4245-4246`).
* **Kernel check.** The kernel reads both inputs before every dispatch claim, on each coordinator wake, and before `OPERATING`. When either is present and kill is released, `kernel:safety` records `KILL_ENGAGED` (reason `kill_file` or `kill_flag`) before the claim, and the claim is then refused by the kill matrix. The check is plain file and setting reads, so it works on every platform.
* **`at kill-switch on`** writes the file first, with legacy's content (`engaged by <user> at <time>`, `deploy/at:4259-4261`), needing no running service; then it asks the operator process to record `kill_engage` for the person and reports if it could not. If no file is watched (only possible outside a live composition), it says trading is **not** stopped and exits non-zero, as legacy (`deploy/at:4262-4270`).
* **`at kill-switch off`** asks for `DISENGAGE`, removes the file, then requests `kill_release` (the bound request carries the confirmation). If the release is refused, kill stays engaged in the ledger and the CLI says so.
* `kill_release` is refused while an input is still present (`SEC-R16`), as legacy stays engaged while the file exists.
* **Deviation (kill rights; logged for the owner's review):** deleting the file without `at kill-switch off` no longer releases kill. Kill is ledger state released only by `KILL_RELEASED` from a principal holding `kill_release` (POL-002, Q-014); legacy released when the file was gone (`deploy/at:4280`).
* The file needs no permission check: anyone able to create it can only stop trading.
* The MCP process reads the same inputs and the ledger's kill state, so its write tools refuse at once, as legacy's Risk Guard (`src/interfaces/mcp/core/riskguard.py:804-809`).

### Owner API transport (`interfaces/api.py`)

The operator process (`deploy/systemd/at-operator.service`) serves the owner API and the CLI socket, and relays to the kernel. It is not mounted on the MCP gateway as legacy (`src/interfaces/mcp/gateway.py:201-234`).

* **Reachability**, as legacy `reachable` (`security.py:45-74`): with no public host, a loopback peer and loopback `Host` and no forwarding header; with `console.public_host`, either that or the public `Host` from a loopback peer (the local proxy) carrying a non-empty `console.auth_header`. A proxied request without a public host is refused. Otherwise `SEC-R02`.
* **Mutations** additionally need: an `Origin` or `Referer` host that is loopback or the public host (`security.py:77-83`); the session's CSRF token in `x-owner-csrf-token`, compared as bytes in constant time (`security.py:84-89`); a nonce in `x-request-id`. **Deviation:** the token is per session and identity, not one per process (`security.py:13`).
* **Body**: at most `console.owner_api.max_body_bytes`, counted while it arrives, a JSON object only, unknown fields refused per route, as legacy (`security.py:115-135`; `loss_latch.py:30-32`).
* **Audit.** Legacy writes a side JSONL row before the mutation and refuses when it cannot (`security.py:92-112`). The target's record is `OPERATOR_REQUEST` (or `OPERATOR_REQUEST_REFUSED`) in the ledger; a commit failure fails the operation. **Deviation:** no side file (LD-15).
* **Routes** keep the catalogue's paths under `/owner/api/v1` and the stable failure shape (`src/interfaces/console/api/registry.py:50-78`). The legacy HTML console's `/console/api/*` writes (`routes.py:422-712`), which the console UI uses today (`write.ts:47-50`), are served under the same prefix with the dispositions above.
* **CLI socket.** A Unix socket, group `at-operators`, mode 0660, peer checks as in the channel table; the same request, confirmation and relay path as HTTP.

### The kernel's local channel (`adapters/unix_channel.py`)

* **Socket.** One per kernel, mode 0600 or group-restricted to the approved units' group, in a directory owned by the kernel's uid and not writable by others; the server refuses to start otherwise and a client refuses a socket of another uid (legacy `src/runtime/tier1_authority/channel.py:98-117`, `:135-146`). One server per socket by an exclusive lock (`service.py:34-36`).
* **Peer.** Linux `SO_PEERCRED` (`channel.py:91-95`). The pid must be the main pid of a unit in `channel.services` (or the relay unit), the uid must be that unit's own uid, and the caller's stated pid and process identity must match the peer, as legacy (`service.py:270-284`). No human session and no unlisted process passes (`SEC-R12`), before any kernel call. **Fork call:** legacy's Linux and systemd attestation is kept (`README.md:1145`); each unit runs under its own uid, the runtime spec's per-unit hardening (SLICE-11).
* **Messages.** One JSON object per line, at most 4 MiB (`channel.py:52-55`). Every request carries `contract` (the exact channel and operation contract version string) and `release` (the bound release digest); either differing refuses with `SEC-R11` (A02-F1). Every reply carries the kernel's `epoch`. **Deviation:** legacy checks an integer protocol and a principal name (`service.py:228-236`).
* **Operations:** `execute` (bound requests) and reads for the relay; `submit_intent` and `command_status` for services (SLICE-09's workers). A reply that cannot be delivered changes nothing: the ledger holds the outcome, and the caller retries with the same nonce or asks `command_status` (as `service.py:24-25`).

### MCP surface (`interfaces/mcp.py`)

* **Authentication**, as legacy (POL-053): `mcp.auth.mode` `none`, `token`, `jwt` or `openalgo`, inferred when unset (`identity.py:31-66`). Over HTTP an inferred `none` refuses to start, an explicit `none` refuses off loopback, and under `none` a request carrying any proxy header is refused (`identity.py:100-127`; `src/interfaces/mcp/core/proxy_guard.py:20-64`). **Deviation:** static tokens come from `settings/secrets.py`, not plain configuration (legacy `src/interfaces/mcp/core/security.py:275-284`).
* **Endpoint grants** (`observe`, `propose`, `act`); `override` cannot be granted, so no MCP profile can lift a gate (`src/interfaces/mcp/core/authority.py:54-60`, `:86-91`). **Scopes** per tool, failing closed when authentication is on (`security.py:82-103`).
* **No order-capable tool** (POL-009). The OpenAlgo proxy lists and forwards only legacy's read allowlist (`src/interfaces/mcp/domains/openalgo/server.py:62-110`). No tool reaches a kernel operation. Each endpoint runs in its own process with only its domains imported, as legacy's two-endpoint split (`gateway.py:114-128`).
* **The proxy's token. Fork call:** the proxy forwards the caller's own OpenAlgo token, never a project credential, as legacy (`openalgo/server.py:124-149`). That token may carry `write:orders`, because legacy advertises all three OpenAlgo scopes by default (`security.py:120-150`); the allowlist is what keeps the proxy read-only. Advertising read scopes only (`auth.advertise_write_orders: false`, `security.py:146-150`) is listed as an improvement, not made.
* **`propose_intent`** is kept (**Fork call**, who may propose a trade): scope `framework.propose`, classified a write, handed to the named model strategy's input through `strategies/worker.py` (SLICE-09) and judged there under that strategy's grant, never the caller's (`src/interfaces/mcp/domains/framework/server.py:369-407`). Until SLICE-09 composes the sink, the tool refuses (`SEC-R22`).
* **Under kill** every `propose` and `act` tool refuses and `observe` tools keep working, as legacy (`riskguard.py:804-809`, `:375`).
* **The console as a client.** The console's reads and its MCP writes go through its backend to this surface with the signed-in user's OIDC access token, or the shared console token when OIDC is off, as legacy (`admin_console/src/lib/gateway.ts:21-40`; `admin_console/src/app/api/gateway/[tool]/route.ts:12-40`). The shared token is a secret of the console's service; with OIDC on, a missing session token is refused, never downgraded (`gateway.ts:25-29`).

### Read scope and disclosure (`interfaces/authorization.py`, `interfaces/mcp.py`)

* **Projections.** Every read leaving a door is a named, versioned projection: its fields, its account scope and the scope that reads it. No tool returns a raw record (`README.md:871`).
* **Two checks.** `read(caller, projection, args)` checks the caller's scope and accounts (`SEC-R14`); `disclose(projection, destination)` checks `interfaces.disclosure.destinations` (`SEC-R15`). An allowed read is not an allowed disclosure.
* **Destinations** are named: `owner-api`, `cli`, `mcp:<client_id>`, `model:<provider>` (used by `cognition/tools.py`, SLICE-09), `telemetry`. **Fork call:** the first release lists every MCP projection for every authenticated MCP client with the scope, as legacy serves reads to any token with the scope.
* **Caches** are keyed by projection, arguments and the caller's scope digest, so an answer is never served to a caller of narrower scope.
* **Redaction.** Every disclosed value passes key redaction (legacy's key set, `src/contract/safety.py:63-75`) and value scrubbing of every resolved secret ([Secrets](#secrets-settingssecretspy)). **Deviation:** legacy redacts by key only (`safety.py:12-18`). The owner's own doors read unredacted, as legacy (`safety.py:1-8`), except secret values.
* **Telemetry** receives only bounded scalars after redaction, as legacy (`src/runtime/telemetry.py:14-25`).

### Secrets (`settings/secrets.py`)

```text
SecretRef(service, name, source: credential | file | env, locator, version | None)
resolve(service) -> dict[name, Secret]            # once, at process start
Secret.identifier -> "<service>/<name>@<version or unversioned>"; Secret.reveal() -> str
child_environment(parent_env, allowed) -> dict; scrub(text) -> str; redact(obj) -> obj
```

* **Sources:** `credential` (a systemd credential, `$CREDENTIALS_DIRECTORY/<locator>`), `file` (an absolute path, mode without group or other bits, owned by the process's uid), `env`. A missing or badly permitted source refuses the process at start (`SEC-R18`). **Deviation:** a live composition refuses `env` for a broker credential (the environment is inherited and readable by the process tree); legacy reads it from the environment (`openalgo/server.py:52-54`). `env` stays accepted for other secrets.
* **Scope.** A process resolves only the references bound to its service: the kernel the broker key; the MCP process its tokens; the console backend its shared token; the operator process none of the broker's.
* **Never written.** `Secret`'s `repr` and `str` show its identifier; only the adapter that needs it calls `reveal`. The kernel records `CREDENTIAL_BOUND` (identifier, source kind) per epoch, never the value or a hash of it.
* **Kernel evidence and logs.** Every evidence record, log line and error the kernel writes passes `scrub`. Today the adapter drops the key only by field name when it records a request (`adapters/openalgo.py:414`, `:468`); scrubbing also catches a key echoed in a response or an error. This is a contribution to the execution-domain spec's adapter.
* **Children.** `child_environment` keeps an allow-list (legacy `src/runtime/strategy_host/process.py:80-139`), removes every secret's environment names and masks the broker key (legacy `withhold_broker_key`, `src/config/__init__.py:216-229`).
* **Replacement** is a process restart under the release and recovery rules; old use ends when the old process exits; nothing re-reads a secret while running. A restart neither resolves an effect it left uncertain nor permits resending it (`README.md:867`).
* **Backups.** No secret value is in the ledger, evidence or recovery set; restoring them cannot restore a revoked credential.

### Restore continuity (`interfaces/authorization.py`)

Combined-F4 needs a record of authorization that a restored ledger cannot roll back.

* **Security journal.** An append-only, digest-chained list of `GRANT_ISSUED` and `GRANT_REVOKED` entries (grant ID, grant digest, ledger sequence), kept apart from the ledger.
* **Issue.** `kernel.authority` appends the issue before its ledger commit; with a journal composed but unreachable, the issue is refused. **Grant issuance with continuity depends on SLICE-11's off-host journal.** Before it, a production composition has no journal: grants can be issued, and every delegated grant is revoked at any restore (fail closed).
* **Revoke.** With the journal reachable, the revocation is appended before its ledger commit. With it unreachable, the revocation commits at once with `journal: pending` in its payload and raises an alert; it never waits on the journal.
* **Catch-up.** After every start the kernel appends each pending revocation in the background and clears the alert when done. It is not a start gate: a routine start reaches `OPERATING` as before (Q-009).
* **Continuity check.** It implements recovery's `confirm_grant` hook (`kernel/recovery.py:183-194`): with the journal reachable and its chain intact, a restored grant is confirmed when the journal shows it issued with the same digest and not revoked, and revoked again otherwise; a grant only in the journal is not brought back (reported for the owner to re-issue). With the journal unreachable, every restored delegated grant is unconfirmed and revoked (`restore_unverified`), the fallback the master allows when continuity cannot be established.
* **Sessions and confirmations** live only in the doors' memory and die at a kernel epoch change; consumed requests are in the ledger; a request lost in a restore cannot be repeated (`SEC-R19`). None can be restored into authority.

### Operator UI (`operator_ui/*`)

The legacy `admin_console` (a Next.js app with its own OIDC login and a backend-for-frontend) is reused, not rewritten (`README.md:1157`). SLICE-10 moves it into `operator_ui/*` and changes only its data access, which legacy keeps in `admin_console/src/lib/write.ts` (writes) and `admin_console/src/lib/gateway.ts` (MCP reads):

* writes go to the owner API under `/owner/api/v1`, opening a session, sending its CSRF token in `x-owner-csrf-token` and a fresh `x-request-id` per action, reused on its own retry (legacy reuses the trace ID on its one retry, `write.ts:76-81`);
* reads keep the MCP path with the signed-in user's token, and the read and write tool allowlists (`admin_console/src/config/tools.ts`);
* the backend's cross-site check on writes stays (`admin_console/src/app/api/console/[...path]/route.ts`), and its OIDC sessions keep their expiry (`admin_console/src/lib/oidc.ts:162-171`).

The target tree names `operator_ui/src/api.ts` for this access layer; the ported `write.ts` and `gateway.ts` become it or sit beside it.

### What other specs rely on

| Interface | Used by |
|---|---|
| The owner credential path and the root grant; re-establishing grants after a restore | [sessions spec](sessions-authority-lifecycle.md#grants-and-the-authority-check-kernelauthoritypy) |
| Grant requests that `kernel.authority` records as `GRANT_ISSUED` and `GRANT_REVOKED` | sessions spec |
| Operator commands with their grant actions ([catalogue](#operator-commands-interfacesclipy-interfacesapipy)) | [protection spec](protection-and-safety.md#kill-and-holds-kernelsafetypy), [intent spec](intent-to-admission.md), sessions spec |
| `command_status(command_key)` for a caller whose reply was lost | [dispatch spec](dispatch-and-coordination.md#command-status-read-only) |
| The alert route and the outcome event stream | intent and execution-domain specs |
| The human route for exit advice | [strategies spec](strategies-and-cognition.md) |
| The projection registry and `disclose` | `cognition/tools.py` (SLICE-09) |

SLICE-01…SLICE-09 use a test principal with a synthetic grant, injected by fixtures (`bootstrap.py:91-100`); SLICE-10 replaces that table.

### Refusal codes

| Code | Meaning | Emitted by |
|---|---|---|
| `SEC-R01` (`unauthenticated`) | No valid evidence for the channel, an unknown or ended session, or an unmapped non-owner identity | doors |
| `SEC-R02` (`unreachable`) | The owner API's reachability rule failed | owner API |
| `SEC-R03` (`mutation_refused`) | Cross-origin, a missing or stale CSRF token, or a token of another identity | owner API |
| `SEC-R04` (`request_replayed`) | A recorded `request_id` with another digest | doors, `kernel.authority` |
| `SEC-R05` (`confirmation_required`) | The table requires a confirmation and none was given | doors |
| `SEC-R06` (`confirmation_mismatch`) | Typed text, principal, session, operation, target or digest differ from the challenge | doors |
| `SEC-R07` (`request_expired`) | The request is past `valid_until` | `kernel.authority` (at admission and dispatch) |
| `SEC-R08` (`confirmation_consumed`) | The confirmation was already used | doors, `kernel.authority` |
| `SEC-R09` (`request_unbound`) | A human principal's call has no request, or its operation, target or digest differ | `kernel.authority` |
| `SEC-R10` (`relay_scope`) | A relay asserted a principal or path it may not | `kernel.authority`, kernel channel |
| `SEC-R11` (`contract_version`) | Contract version or release digest differs | kernel channel |
| `SEC-R12` (`peer_refused`) | Peer uid, unit, process identity or session refused | kernel channel, CLI socket |
| `SEC-R13` (`not_on_surface`) | The operation is not offered on this door | doors |
| `SEC-R14` (`scope_denied`) | The caller may not read this projection or account | `read` |
| `SEC-R15` (`destination_denied`) | The projection may not go to this destination | `disclose` |
| `SEC-R16` (`kill_input_present`) | `kill_release` while the kill file or flag is present | `kernel.safety` |
| `SEC-R17` (`auth_mode_refused`) | MCP start refused, or a proxied request under `none` | MCP |
| `SEC-R18` (`secret_unresolvable`) | A required secret is missing, badly permitted, or from a refused source | `settings/secrets.py` |
| `SEC-R19` (`restored_since_request`) | The request is unrecorded and a restore was activated since its epoch | `kernel.authority` |
| `SEC-R20` (`advice_under_kill`) | An advice application while kill is engaged | `kernel.authority` |
| `SEC-R21` (`ambiguous_target`) | A strategy maps to no session or to several | doors |
| `SEC-R22` (`owner_absent`) | The route's owning module is not composed yet | doors |

### Event catalogue

| Event | Recorded by | Payload | Index table |
|---|---|---|---|
| `OPERATOR_REQUEST` | `kernel.authority`, in the decision of the operation | the `OperatorRequest` fields | `operator_request` |
| `OPERATOR_REQUEST_REFUSED` | `kernel.authority`, once per `request_id` and code | `request_id`, principal, `channel_identity`, operation, target, code | none (evidence) |
| `CREDENTIAL_BOUND` | `kernel:recovery`, once per credential per epoch, in `RECOVERY_WRITING` | `identifier`, `source` | none (evidence) |
| `KILL_ENGAGED` by `kernel:safety` | `kernel.safety`, from a kill input | as the protection spec, reason `kill_file` or `kill_flag` | `safety_state` |
| `GRANT_REVOKED` with `journal: pending` | `kernel.authority` | as the sessions spec, plus `journal` | `grant` |

## Failure modes and crash points

| ID | Failure | Required behaviour | Proof |
|---|---|---|---|
| CP-SEC1 | Crash after the decision with `OPERATOR_REQUEST` commits, before the reply | The caller retries with the same nonce, on any connection, and gets the recorded result; no second effect | PRF-SEC-03 |
| CP-SEC2 | Crash after a journal issue entry, before the grant's ledger commit | The journal holds a grant the ledger lacks; continuity never resurrects it | PRF-SEC-10 |
| CP-SEC3 | Crash after a pending revocation commits, before the catch-up appends it | The next start's background catch-up appends it; the alert stays until then | PRF-SEC-10 |
| F-SEC4 | The kernel restarts or is restored | The operator process sees the new epoch and drops every session and challenge; callers re-authenticate | PRF-SEC-02, -07 |
| F-SEC5 | The journal is unreachable at a restore | Every restored delegated grant is revoked (`restore_unverified`); the owner root still works | PRF-SEC-10 |
| F-SEC6 | A secret file is world-readable or missing, or the broker key comes from the environment in live | The process refuses to start (`SEC-R18`) | PRF-SEC-04 |
| F-SEC7 | The kernel socket's directory is writable by another user | The server refuses to start; clients refuse to connect | PRF-SEC-05 |
| F-SEC8 | The kill file appears while a dispatch is due | `KILL_ENGAGED` is recorded before the claim; the claim is refused | PRF-SEC-12 |
| F-SEC9 | The release digest differs between a worker and the kernel | Every request refused (`SEC-R11`) | PRF-SEC-05 |
| F-SEC10 | A human close waits at dispatch beyond 120 s | Refused at the claim (`SEC-R07`); reservation released | PRF-SEC-03 |
| F-SEC11 | `at kill-switch on` while the kernel or operator process is down | The file is written and reported; the kernel engages before its first claim when it runs | PRF-SEC-12 |
| F-SEC12 | A request committed after the backup is retried after a restore | Refused (`SEC-R19`); nothing repeats | PRF-SEC-03 |
| F-SEC13 | A service process connects to the CLI socket | Refused (`SEC-R12`): no service acts as the owner | PRF-SEC-06 |

## Risks and limits

| Risk or limit | Mitigation |
|---|---|
| Every loopback or proxy-vouched identity not in the map is the owner on the owner API, including a local service that reaches loopback (Fork call) | As legacy; pinning the owner identity, or serving the owner API only on a socket whose peer can be checked, is a listed improvement for the owner |
| A compromised operator process can act as any human it maps | Peer attestation of the relay; it cannot assert kernel or service principals; every request is recorded with `via` and `channel_identity` |
| A pending revocation is lost if the host and the ledger are lost before the catch-up | The alert names the pending revocation; the window closes on the next start that keeps the ledger |
| Code in the same process can read a secret it holds | Not a defence against hostile in-process code, as legacy says of its key (`owner_command.py:31-33`); scope keeps each secret in one process |
| Peer attestation needs Linux `SO_PEERCRED` and systemd | PRF-SEC-05 and the CLI-socket rows of PRF-SEC-06 count only from a Linux run |
| A typed confirmation does not stop an attacker who holds the session | It guards against mistakes; authentication and binding are the security |
| Anyone who can create the kill file stops trading | Intended: stopping is never gated (legacy) |
| A caller's OpenAlgo token may carry `write:orders` usable at OpenAlgo directly | Outside this system; the proxy forwards reads only (Fork call); narrowing the advertised scopes is a listed improvement |

## Policy inputs

| Setting | Meaning | Value |
|---|---|---|
| `interfaces.principals` | Channel identity → principal and read accounts | Optional on the owner API (unnamed: the owner, Fork call); required for every CLI user |
| `interfaces.confirmations` | Per door and operation: none, or the text to type | First release: legacy's table (catalogue) |
| `interfaces.request_ttl_secs` | Validity of a request, counted from its execution | 120 (legacy `owner_command.py:58`); refusing otherwise |
| `interfaces.session_ttl_secs`, `interfaces.sessions_per_identity` | Owner API session lifetime and cap | Refusing; bound per release (no money effect) |
| `interfaces.disclosure.destinations` | Destination → projections it may receive | Refusing; first release lists legacy's MCP reads |
| `console.public_host`, `console.auth_header`, `console.owner_api.max_body_bytes` | Owner API reachability and body cap | Legacy keys and defaults (`config/defaults.yaml:659`, `:677-678`) |
| `mcp.auth.mode` and its keys; `mcp.endpoint.grants`; `mcp.scopes.domains` | MCP authentication, endpoint verbs and scopes | Legacy keys (`config/defaults.yaml:278`) |
| `channel.services`, `channel.relays` | Kernel channel peers: unit, its uid, its principal | Refusing in a live composition |
| `risk_guard.kill_switch`, `risk_guard.kill_switch_file` (alias `MCP_KILL_SWITCH_FILE`) | Kill inputs | Legacy keys and defaults `false` and `""` (`config/defaults.yaml:132-133`); an empty file path refuses a live composition |
| `secrets.<service>.<name>` | Secret references | Refusing for every credential a composition needs |
| `security.journal` | The journal adapter | SLICE-11; absent: fail closed (F-SEC5) |

## Reuse evidence

* **CLI, MCP, console and frontend: retain the surface; migrate imports and read models** (`README.md:1157`). Kept: the `at` command names and prompts, every owner mutation's door, reachability and CSRF rules, the MCP auth modes, scopes, endpoint grants and read-only proxy, `propose_intent`, the key redaction set, the child environment allow-list, the console's data-access layer. Replaced: the side audit file, the process-wide CSRF token, the in-memory owner-command signature (by the ledger's request record).
* **Authority service and channel: wrap and extract; keep Linux peer attestation initially** (`README.md:1145`): `src/runtime/tier1_authority/channel.py` and `service.py` give the socket checks, peer credentials and message bounds.
* **Do not reuse:** the Risk Guard's order caps and human-approval rule (`riskguard.py:954-956`), which guard order tools MCP no longer has; the kernel decides every financial action.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| Portable signed receipts | The master prefers server-side records initially (`README.md:869`) |
| Persist confirmations and sessions | A restored one could revive (Combined-F4); legacy lets them die with the process |
| Revoke every restored grant at every restore | The blanket invalidation the master did not select (`README.md:365`); used only when the journal is unreachable |
| Kill only as a ledger event, dropping the file | Removes legacy's way to stop trading when no door answers |
| The kill input as a human principal | It holds no grant and carries no bound request, so the kernel would refuse it (review finding F-1) |
| Humans on the kernel socket | Legacy's Tier-1 socket admits only approved service processes; the CLI uses the operator process's socket instead |
| Confirmation for every privileged operation | A blanket confirmation the master excludes (`README.md:1244`) |
| MCP order tools behind human approval (legacy Risk Guard) | POL-009 keeps MCP read-only for orders |
| Owner API mounted on the MCP gateway (legacy) | One process holding both surfaces defeats the endpoint split |

## Proofs

| ID | Class | Test | Passes when | Fails when |
|---|---|---|---|---|
| PRF-SEC-01 | T | `tests/unit/test_operator_authorization.py` | Each channel row accepts only its evidence; a payload principal changes nothing; an unmapped non-owner identity is refused; owner-API owner rows as legacy, with `owner-api:local` and `owner-proxy:<fingerprint>`; an unmapped CLI uid refused; a relay asserting a kernel or service principal is refused (`SEC-R10`); the map grants nothing | a payload name, an untrusted header or a relay yields a principal |
| PRF-SEC-02 | T | `tests/unit/test_operator_authorization.py` | The digest changes with each field; the request is minted at `execute`, so typing time does not count; the same nonce with the same digest gives one request, with another digest `SEC-R04`; confirmations missing, mistyped, from another principal or session, for another operation or target, consumed, and after a kernel epoch change each give their code; sessions end at their lifetime, cap and epoch change; a session token from another identity is refused | a confirmation authorizes another request or revives, or a retry makes a second effect |
| PRF-SEC-03 | T | `tests/unit/test_authority_grants.py` | Every human entry point refuses a missing or mismatched request (`SEC-R09`), an expired one (`SEC-R07`), and a request unrecorded after a restore since its epoch (`SEC-R19`); it commits `OPERATOR_REQUEST` in its own decision; the same id and digest returns the first result; another digest `SEC-R04`; a used confirmation `SEC-R08`; an advice application under kill `SEC-R20`; refused bound requests recorded once per id and code; a human close past `valid_until` refused at dispatch with its reservation released; CP-SEC1, F-SEC12; no side audit file exists | an operation commits without its request, or a replay makes a second effect |
| PRF-SEC-04 | T | `tests/unit/test_secret_references.py` | Each source resolves; bad permissions and missing sources refuse; the broker key from `env` in a live composition refuses; a process sees only its service's secrets; a labelled synthetic value appears in no `repr`, log, ledger, evidence (including a response and an error echoing it) or recovery-set byte; `CREDENTIAL_BOUND` carries the identifier only; child environments drop every secret name and mask the broker key; no re-read while running; CUJ-SEC-5 | a synthetic secret value reaches any record or child |
| PRF-SEC-05 | T | `tests/integration/test_unix_channel.py` | Linux: a human session, an unlisted unit, a unit's pid under another uid, a process-identity mismatch, a socket of another uid or in a writable directory, a contract version or release digest one character off, an oversized or malformed line: each refused before any kernel call with its code; a client refuses a server of another uid; every reply carries the epoch | any of these reaches the kernel |
| PRF-SEC-06 | T | `tests/integration/test_operator_commands.py` | Every catalogue row end to end through the CLI socket and the relay on a composed simulation, with its grant action and legacy's confirmation; CUJ-SEC-1; the latch's strategy-to-session mapping and `SEC-R21`; `kill_release` and `hold_release` absent from the owner API; a service process on the CLI socket refused (F-SEC13); the `at` names | a door offers an operation the table withholds, skips a required confirmation, or a service acts as the owner |
| PRF-SEC-07 | T | `tests/integration/test_owner_api.py` | Legacy's reachability cases; cross-origin, missing or stale CSRF, another identity's token, missing nonce, an oversized chunked body, unknown fields, a proxied request without a public host: each refused; CUJ-SEC-2; each mutation reaches the kernel as a relayed request recorded with `via` and `channel_identity` | a mutation passes without every check |
| PRF-SEC-08 | T | `tests/integration/test_mcp_surface.py` | No listed tool can place, modify or cancel an order or lift a gate; the proxy forwards only the read allowlist with the caller's token; the three `none` refusals; scopes fail closed; `override` refused in a profile; under kill `propose` and `act` refuse and `observe` works; CUJ-SEC-3; the console client with OIDC on and no session token refused; cross-account reads refused; a cached answer never reaches a narrower caller; a readable projection to an unlisted destination refused; outputs redacted and scrubbed | an order or gate-lifting tool is reachable, or a field leaves its scope or destination |
| PRF-SEC-09 | T | `tests/contracts/test_capabilities.py` | The MCP, operator and console-backend compositions cannot construct a sending adapter, resolve the broker credential or call a kernel operation (MCP); each process's environment, and its children's, holds no secret it is not scoped to | a non-kernel process can send or read the key |
| PRF-SEC-10 | T | `tests/recovery/test_restore_fencing.py` | CUJ-SEC-4 both ways; CP-SEC2, CP-SEC3, F-SEC5; a revocation with the journal down commits at once, pending and alerted; the catch-up does not delay a routine start; a provably current grant is kept; a journal-only grant is not resurrected; no consumed request or old session authorizes; reconciliation still runs | an old grant, session or confirmation regains authority, a revocation waits on the journal, or a current grant is revoked with the journal reachable |
| PRF-SEC-11 | T | `tests/contracts/test_operator_ui_routes.py` | Every write the ported data-access layer makes is an owner API route with that method; every mutation sends the CSRF header and an `x-request-id`, reused only on its own retry; the MCP read and write allowlists are legacy's; the cross-site check is present | the UI calls an unserved route or mutates without the nonce |
| PRF-SEC-12 | T | `tests/integration/test_kill_inputs.py` | On every platform: the file and the flag each engage kill before the next claim, recorded by `kernel:safety` with its reason, also when the kernel starts with the file present (CUJ-SEC-6, F-SEC8, F-SEC11); `at kill-switch on` writes the file with no service running; `off` asks `DISENGAGE`, removes the file, then releases; `kill_release` refused while an input is present; deleting the file alone releases nothing; the legacy keys and alias; an empty file path refuses a live composition; the "not stopped" message when nothing is watched | the file cannot engage kill, `off` fails after a file engagement, or stopping waits on a service |
| PRF-SEC-13 | T | `tests/integration/test_operator_routes.py` | Every row of the legacy-mutation table reaches its disposition: kernel rows record their request; routed rows reach their owner, or refuse with `SEC-R22` until it is composed; mapped rows do what the table says; advice application produces one bound close or modify through admission and is refused under kill | a legacy owner mutation disappears without its disposition, or reaches money outside its owner's path |

## Delivery

| Slice | Delivers | Proofs |
|---|---|---|
| SLICE-03 (built) | Grants, `authority.check` and `recheck`, the `confirm_grant` hook, the disarmed authentication table | PRF-SES-01, PRF-SES-02, PRF-SES-06 |
| SLICE-10 | Everything in this file, in the [slice file's steps](../plan/slices/SLICE-10-security-and-operator.md#steps) | PRF-SEC-01…13 |
| SLICE-09 | The `propose_intent` sink; `application_request`; the strategy registry and cognition owners the routes reach; `cognition/tools.py` uses the projection registry | (PRF-SEC-08, PRF-SEC-13 cover the door side) |
| SLICE-11 | The off-host security-journal adapter; per-unit uids and units; push alerts; the observation mechanism (A06-F2) | PRF-SEC-10 on the adapter; PRF-DOM-06 |
| SLICE-12 | The research owners of the promotion and lineage routes | (PRF-SEC-13 covers the door side) |

See [plan/delivery-plan.md](../plan/delivery-plan.md).
