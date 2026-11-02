# SLICE-10 — Security and operator

* **Status:** proposed (2026-10-30); revised the same day after the design review (findings F-1…F-13, each verified at 445eb116 and in OA_NEW before it was fixed). The implementation-readiness review is still to come before step 1 is built. Every step is an outline; each step's exact detail is written just before it is built, as the owner's run mode says ([standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30)).
* **Precedence:** the master README, then the ROADMAP, then this package. The authority is the [security-and-operator spec](../../design/security-and-operator.md). A fork touching money (who may trade, kill, hold and unlock rights, limits) keeps legacy's live behaviour at 445eb116 and is logged here as **Fork call**; every other intentional difference from legacy is a **Deviation**. No score, threshold or money value is set here.
* **Phase:** master Phase 2 (installable target, `README.md:1182`) and Phase 5 (built in parallel with SLICE-08 and SLICE-09 against frozen contracts, `README.md:1185`). Environment class S throughout.
* **Builds on:** SLICE-03 as built (grants, `authority.check` and `recheck`, the `confirm_grant` hook), and the human entry points built by SLICE-04 (`policy.clear_pause`), SLICE-05 and SLICE-06 (kill, holds, latch), and SLICE-07 (`lifecycle.resolve_attempt`). The branch `slice-10` is cut from `agentic-desk` when step 1 starts (head not fixed here).
* **Owner answers applied:** [Q-014](../../decisions/owner-questions.md#q-014): the owner and delegated human principals holding the named grant may use the kill exceptions, `kill_release`, `latch_unlock` and `pause_clear`; delegated principals exist only through the identity map, and the kernel checks their grants. The owner's [standing rules](../../decisions/owner-answers-2026-10-27.md#standing-rules-2026-10-30) settle every fork below in legacy's favour.
* **Where Linux-only tests run:** the `SO_PEERCRED` proofs (PRF-SEC-05 and the CLI-socket rows of PRF-SEC-06) run on the EC2's isolated test checkout (`~/at-dev` or its own worktree), one run at a time through the project's safe test runner, which the project's test rules pre-approve at any hour. Elsewhere those tests report their skip and do not count.
* **Tasks and proofs:**
  * **Step 1:** TASK-S10-01 (PRF-SEC-01, PRF-SEC-02).
  * **Step 2:** TASK-S10-02 (PRF-SEC-03).
  * **Step 3:** TASK-S10-03 (PRF-SEC-04).
  * **Step 4:** TASK-S10-04 (PRF-SEC-12).
  * **Step 5:** TASK-S10-05 (PRF-SEC-05).
  * **Step 6:** TASK-S10-06 (PRF-SEC-06, PRF-SEC-07).
  * **Step 7:** TASK-S10-07 (PRF-SEC-13).
  * **Step 8:** TASK-S10-08 (PRF-SEC-08, PRF-SEC-09).
  * **Step 9:** TASK-S10-09 (PRF-SEC-10).
  * **Step 10:** TASK-S10-10 (PRF-SEC-11).

**In plain words.** This slice builds the three doors the owner uses today: the `at` terminal command, the web console and the AI tools. They sit on top of the new kernel and keep today's rules.

* **Step 1** builds the rules for who is asking, and for tying each request to exactly one action, with the typed confirmations you know from `at`.
* **Step 2** makes the kernel check that tie itself and write every owner action into the ledger.
* **Step 3** handles keys and passwords: read from protected files, never written anywhere.
* **Step 4** keeps the kill file. One `touch`, or `at kill-switch on`, stops trading even when nothing else is running.
* **Step 5** builds the kernel's private socket, which only approved services may use.
* **Step 6** builds the console's server side and the terminal commands.
* **Step 7** gives every other change the console makes today a home, including applying an AI exit suggestion.
* **Step 8** builds the AI tools: reading, and proposing a trade idea, but never ordering or unlocking.
* **Step 9** makes sure a restore from an old backup cannot bring back a permission that was taken away.
* **Step 10** moves the existing console screens across.

Who may trade, the kill rules and the limits stay as today.

**Excluded, and where each part arrives:**

* **SLICE-09:** the sink `propose_intent` hands proposals to (`strategies/worker.py`). Also SLICE-09: `application_request` for exit advice; the strategy registry and cognition owners that step 7's routes reach; `cognition/tools.py` using the projection registry. Until each exists, its route refuses (`SEC-R22`).
* **SLICE-11:**
  * the off-host security-journal adapter (with the recovery set; its location follows the backup destination, an owner-only item behind the refusing `security.journal`);
  * each unit's own uid and the service units;
  * push delivery of alerts;
  * the observation mechanism of A06-F2 (TASK-S07-06, TASK-S11-06);
  * installed-artifact checks;
  * the remaining `at` commands (install, update, restart, deploy, config, backup, approver).
* **SLICE-12:** the research owners of the promotion-approval and lineage-repair routes.
* **Not built:** any new human entry door; a general authorization or data-label framework; a redesign of the console screens.

## Steps

| Step | Builds | Proofs |
|---|---|---|
| 1 | `OperatorRequest` (with `epoch` and `channel_identity`) and `argument_digest` (`contracts/identity.py`). In `interfaces/authorization.py`: the channel table, the identity map, relay rules, sessions bound to identity, kernel epoch, lifetime and cap; nonces and retry identity; the confirmation table with `prepare` and `execute`, the request minted at `execute`. Pure and in memory | PRF-SEC-01, PRF-SEC-02 |
| 2 | The kernel's binding check (`kernel/authority.py`): `Authenticated.request` and `via`, `authority.bind` in every human entry point. Its refusals: `SEC-R04`, `-R07` (admission and dispatch), `-R08`, `-R09`, `-R10`, `-R19`, `-R20`. `OPERATOR_REQUEST` and its index table (migration, tree delta **T-67**); bounded `OPERATOR_REQUEST_REFUSED`; the `kernel:safety` kill-input exemption. The disarmed authentication table in `bootstrap.py` is replaced by step 1's | PRF-SEC-03 |
| 3 | `settings/secrets.py`: references, protected sources, the live `env_source` warning for broker credentials, per-service scope, `Secret`, child environments, `scrub` and `redact`. `CREDENTIAL_BOUND`; `scrub` on the kernel's evidence and log writes; secret references in `config/live.example.yaml` | PRF-SEC-04 |
| 4 | Kill inputs, on every platform. The kernel reads `risk_guard.kill_switch` and `risk_guard.kill_switch_file` (alias `MCP_KILL_SWITCH_FILE`) before each claim, on each wake and before `OPERATING`, and `kernel:safety` records `KILL_ENGAGED`. `SEC-R16`; the `kill_file_unwatched` alert for an empty path; `at kill-switch on`, `off` and `status` in `interfaces/cli.py`, with the file written first | PRF-SEC-12 |
| 5 | `adapters/unix_channel.py`: the kernel socket, attestation of service and relay peers (main pid of an approved unit, its own uid, process identity), the exact contract version and release digest, framing, the epoch on every reply | PRF-SEC-05 |
| 6 | The operator process (`interfaces/api.py`, `deploy/systemd/at-operator.service`): the owner API (reachability, origin, per-session CSRF, nonce, body cap), the CLI socket (mapped login users only), the relay. The catalogue's routes and `at` commands in `interfaces/cli.py`, the latch's strategy-to-session mapping, reads, alerts and the event stream | PRF-SEC-06, PRF-SEC-07 |
| 7 | The legacy-mutation table: every other owner mutation's door, routed to its owner or mapped, `SEC-R22` until an owner is composed; the advice-application route (`advice_apply`, REQ-SEC-011) | PRF-SEC-13 |
| 8 | `interfaces/mcp.py`: authentication modes and start refusals, endpoint grants, scopes, the read-only OpenAlgo proxy with the caller's token, `propose_intent`, kill refusal of writes, the console as an MCP client. Projections, `read` and `disclose`, scoped caches, redaction | PRF-SEC-08, PRF-SEC-09 |
| 9 | Restore continuity: the security journal's interface and in-memory fake. Issue before the ledger commit; revoke before it when reachable, else pending and alerted; the background catch-up; `confirm_grant` | PRF-SEC-10 |
| 10 | `operator_ui/*` from legacy `admin_console`: the data-access layer (`write.ts`, `gateway.ts`) on the owner API and the MCP surface, the CSRF header and nonce on every write, the allowlists and cross-site check kept | PRF-SEC-11 |

The steps run in this order for these reasons:

* Steps 1 and 2 come first: every door produces the same request, and the kernel checks it the same way.
* Step 3 precedes the doors that hold secrets.
* Step 4 precedes the socket, so stopping never depends on a service.
* Step 5 precedes step 6, which relays over it.
* Step 7 needs step 6's doors.
* Step 9 needs step 2's request record.
* Step 10 needs steps 6 and 8.

## What legacy does

All citations are at 445eb116, relative to the legacy repository root; each was opened at that commit (with `git show 445eb116:<path>` for `deploy/at` and `admin_console`) unless marked "not checked".

* **Three doors.**
  * The `at` shell script and its Python modules on the host.
  * The owner API, mounted on the MCP gateway's own web app (`src/interfaces/mcp/gateway.py:201-234`), with the older HTML console API beside it (`src/interfaces/console/routes.py:422-712`). The console app writes through that HTML API (`admin_console/src/lib/write.ts:47-50`) and reads through MCP tools via its backend (`admin_console/src/lib/gateway.ts:1-40`).
  * The MCP gateway, split into a read-only public endpoint and a desk endpoint, each a separate process importing only its domains (`gateway.py:114-128`).
* **Who is the owner.**
  * Every loopback caller of the owner API is `owner-api:local`.
  * Every identity the proxy's auth header names is `owner-proxy:<fingerprint>` (`src/interfaces/console/api/routes/ai_management.py:26-41`).
  * `at exposure` posts through that API, so its principal is `owner-api:local` (`src/interfaces/cli/exposure.py:48-56`). So does `at loss-latch unlock` when Tier-1 is on (`scripts/loss_latch.py:33-41`, `:75`).
  * The Tier-1 socket admits only the main process of an approved systemd unit (`src/runtime/tier1_authority/service.py:62-65`, `:270-284`).
  * There is no delegated operator.
* **Owner API guards**, applied by the route wrapper before every handler (`src/interfaces/console/api/registry.py:50-62`):
  * reachability (`src/interfaces/console/api/security.py:45-74`);
  * for mutations, a same-origin `Origin` or `Referer` and the process-wide CSRF token (`security.py:13`, `:77-89`);
  * then one audit row in a JSONL side file, refusing the mutation when it cannot be written (`security.py:92-112`);
  * a body cap counted while it arrives (`security.py:115-135`);
  * the HTML API also audits refused writes (`routes.py:566`).
* **The owner command.** Cancel and close only. It is signed with a per-process key over channel, principal, action, strategy, broker order ID and reason (`src/core/framework/execution/owner_command.py:17-18`, `:90-96`). It is single use, valid 120 s from issue, and checked at the send (`owner_command.py:58`, `:134-169`). The route issues it after re-checking reachability and CSRF (`src/interfaces/console/api/routes/exposure.py:20-34`); the CLI issues it after the typed broker order ID (`deploy/at:4301-4305`).
* **Kill.**
  * Engaged by the flag `risk_guard.kill_switch` or the existence of `risk_guard.kill_switch_file`, read on every call (`src/core/framework/execution/killswitch.py:58-59`, `:88-100`). The environment alias is `MCP_KILL_SWITCH_FILE` (`deploy/at:4242-4246`). Shipped defaults are `false` and `""`, so nothing is watched by default (`config/defaults.yaml:132-133`).
  * `at kill-switch on` writes the file at once, with no prompt and no service needed, and fails loudly when nothing watches it (`deploy/at:4259-4272`). `off` asks for `DISENGAGE`, then deletes the file (`deploy/at:4273-4280`).
  * The console shows kill and holds and can lift neither (`src/interfaces/console/operations_surface.py:196-226`).
  * The MCP Risk Guard refuses every write tool under kill (`src/interfaces/mcp/core/riskguard.py:804-809`, `:375`). Advice application and every other automatic or non-owner write is refused under kill (`killswitch.py:19-25`; `owner_command.py:8-10`).
* **Other owner acts.**
  * `at holds clear` asks for the strategy ID (`deploy/at:4364-4370`).
  * `at loss-latch unlock` needs a reason and a terminal and asks for the strategy ID (`scripts/loss_latch.py:60-75`). The console's unlock takes a reason only (`src/interfaces/console/api/routes/loss_latch.py:25-35`).
  * The console clears AI pauses (`ai_management.py:86-87`).
  * The console applies exit advice, which issues one structure close or a stop or trail move (`ai_management.py:90`; `src/authoring/capabilities/ai_management.py:716-736`; `src/runtime/ai_management/advice.py:959-979`).
  * The console also:
    * deactivates strategies and stages, activates, rolls back and proposes policies (`src/interfaces/console/api/routes/strategies.py:30-104`);
    * registers, writes, deletes and configures strategies (`routes.py:442-463`);
    * stages and activates AI config (`ai_management.py:74-83`);
    * switches promotion approval mode and records lineage repair (`promotion_approval.py:24-33`; `lineage_repair.py:43-61`);
    * runs analysis jobs (`src/interfaces/console/api/routes/operations.py:25-28`);
    * writes global settings (`routes.py:547-575`; `src/interfaces/console/api/routes/configuration.py:15-27`);
    * starts the tick watch (`routes.py:648-660`);
    * reconciles a day's orders (`src/interfaces/console/api/routes/reconciliation.py:11-59`).
  * `at orders reconcile` and `at orders clear-conflict` are on the CLI (`deploy/at:4317-4329`).
* **MCP.**
  * Authentication modes are `none`, `token`, `jwt` and `openalgo`, inferred when unset (`src/interfaces/mcp/core/identity.py:31-66`). Over HTTP an inferred `none` refuses to start, and an explicit `none` refuses off loopback (`identity.py:100-127`). Under `none` a proxied request is refused (`src/interfaces/mcp/core/proxy_guard.py:20-64`). Static tokens come from `auth.tokens` (`src/interfaces/mcp/core/security.py:275-284`).
  * Scopes are per domain (`security.py:82-103`). Endpoint verbs are `observe`, `propose` and `act`; `override` cannot be granted (`src/interfaces/mcp/core/authority.py:54-60`, `:86-91`).
  * The OpenAlgo proxy lists and forwards only a read allowlist, with the caller's own OpenAlgo token (`src/interfaces/mcp/domains/openalgo/server.py:24-30`, `:62-110`, `:124-149`). That token may carry `write:orders`, advertised by default (`security.py:120-150`).
  * `framework_propose_intent` appends one proposal to an AI worker's journal, under scope `framework.propose` (`src/interfaces/mcp/domains/framework/server.py:369-407`).
  * The console calls only allowlisted MCP read and write tools, using the user's OIDC token or a shared token (`admin_console/src/config/tools.ts:95-110`; `gateway.ts:21-40`).
* **The Tier-1 channel.**
  * A Unix socket, mode 0600, in a directory only the authority's uid can write. The client checks the server's uid by `SO_PEERCRED` (`src/runtime/tier1_authority/channel.py:91-117`, `:135-146`).
  * One JSON line per message, up to 4 MiB, protocol `1` (`channel.py:52-55`).
  * The service checks, in order: the peer's uid; that the pid is the main pid of an approved unit; that the caller's stated process identity matches; then the protocol and principal name (`service.py:228-236`, `:270-284`).
* **Secrets.**
  * The broker key and the MCP tokens are environment or configuration values (`openalgo/server.py:52-54`; `security.py:278`).
  * A spawned worker gets an allow-listed environment with the broker key removed and masked (`src/runtime/strategy_host/process.py:80-139`, `:288-299`; `src/config/__init__.py:216-229`).
  * Agent-facing output is redacted by key name at every depth, not by value (`src/contract/safety.py:12-18`, `:63-75`). Telemetry scrubs secret-named environment values (`src/runtime/telemetry.py:54-58`).
* **Not checked:** the live host's kill-file path, MCP auth mode, console public host and OIDC settings. They live in the host's environment file, which also holds secrets, so they are bound at deploy rather than read here. Also not checked: each remaining `at` command one by one.

## Fork calls and deviations

Each **Fork call** keeps legacy's live behaviour because it touches who may trade or the kill, hold and unlock rights.

* **Fork call — the owner on the console.** A loopback caller, or a proxy-vouched identity the map does not name, is the owner, recorded as legacy records it (`ai_management.py:26-41`). Listed improvement, not made: pin the owner to one identity, or serve the owner API only on a peer-checked socket.
* **Fork call — the doors.** Which door offers which kernel operation is legacy's:
  * kill engage and release, and hold release, only on the CLI;
  * latch unlock, pause clear and exposure on both;
  * advice application on the console;
  * nothing that lifts a gate on MCP.

  Citations: `deploy/at:4259-4305`; `operations_surface.py:196-226`; `loss_latch.py:25-35`; `ai_management.py:86-90`; `exposure.py:37-71`; `authority.py:86-91`. Listed improvement, not made: a console button that engages kill.
* **Fork call — every other owner mutation** keeps its door and reaches its owning module, or is mapped where the target has no state for it (`orders reconcile`, `clear-conflict`). The spec's [legacy-mutation table](../../design/security-and-operator.md#other-legacy-owner-mutations) has one row per mutation with its citation. Listed, not made: a human route to release money a `CONFLICT_RECORDED` keeps reserved.
* **Fork call — typed confirmations.** On the CLI: `DISENGAGE` for kill release, the strategy ID for hold release and latch unlock, the broker order ID for exposure. None on the console. None on `grant_admin`, `recovery_advance`, `attempt_resolve` and `binding_authorize`, which have no legacy prompt. Citations: `deploy/at:4278-4279`, `:4302-4303`, `:4369-4370`; `scripts/loss_latch.py:72-73`. Listed improvements, not made:
  * typed confirmation on the console's exposure and unlock;
  * typing the grantee for `grant_admin issue`;
  * typing `ADVANCE` for `recovery_advance`;
  * typing the order for `attempt_resolve`.
* **Fork call — stopping is never gated.** `at kill-switch on` writes the file with no service needed, then tells the kernel. The file and flag are read before every claim and engage kill as `kernel:safety`. Kill release is refused while either is present (`killswitch.py:88-100`; `deploy/at:4259-4272`).
* **Fork call — legacy kill keys.** `risk_guard.kill_switch`, `risk_guard.kill_switch_file` and the alias `MCP_KILL_SWITCH_FILE` are kept (`killswitch.py:58-59`; `deploy/at:4242-4246`).
* **Fork call — request lifetime.** 120 s from the moment the request is issued after the typed confirmation, checked at the send (`owner_command.py:58`, `:154-156`; `deploy/at:4302-4305`; `exposure.py:30-34`).
* **Fork call — advice under kill.** Applying exit advice is refused while kill is engaged, as legacy refused those commands at the send (`killswitch.py:19-25`; `owner_command.py:8-10`).
* **Fork call — no human entry door; the only human modify is advice application** (`owner_command.py:35`, `:53-54`; `advice.py:968-979`).
* **Fork call — AI tools.** No order-capable tool. `propose_intent` is kept under `framework.propose` and judged under the receiving strategy's grant. Every MCP write is refused under kill (`openalgo/server.py:62-110`; `framework/server.py:369-407`; `riskguard.py:804-809`).
* **Fork call — the proxy's token.** The proxy forwards the caller's own OpenAlgo token through the read allowlist; advertising `write:orders` stays legacy's default (`openalgo/server.py:124-149`; `security.py:120-150`). Listed improvement, not made: advertise read scopes only.
* **Fork call — MCP reads.** Every authenticated client with the scope may receive every MCP read projection (`security.py:82-103`).
* **Fork call — peer attestation** on the kernel socket: Linux uid, systemd unit and process identity (`service.py:270-284`; `README.md:1145`).
* **Deviation — CLI owner (logged for the owner's review).** The CLI connects to the operator process's socket. The CLI owner is an explicitly mapped login uid outside any service, instead of any process reaching loopback (`exposure.py:48-56`). This keeps the Tier-1 rule that no service process acts as the owner (`service.py:270-277`).
* **Deviation — kill file removal (kill rights; logged for the owner's review).** Deleting the file without `at kill-switch off` no longer releases kill. Release is a recorded `KILL_RELEASED` by a principal holding `kill_release` (POL-002, Q-014); legacy released when the file was gone (`deploy/at:4280`).
* **Fork call — empty kill path.** A composition with an empty `risk_guard.kill_switch_file` starts as legacy does, reading only the flag; recovery raises the alert `kill_file_unwatched`, and `at kill-switch on` says trading is not stopped and exits 1 unless the kernel recorded kill (`config/defaults.yaml:133`; `deploy/at:4252-4270`).
* **Deviation — audit in the ledger.** `OPERATOR_REQUEST` and bounded `OPERATOR_REQUEST_REFUSED` replace the side JSONL row (`security.py:92-112`; LD-15). Legacy's attribution strings are kept.
* **Deviation — replay.** A CSRF token per session and identity, a nonce per mutation, and sessions dropped at a kernel epoch change, replace one token per process (`security.py:13`; `write.ts:41-45`).
* **Deviation — binding for every privileged operation,** with consumption recorded in the ledger. Legacy binds only cancel and close, and keeps used IDs in memory (`owner_command.py:60-62`).
* **Deviation — value scrubbing** of every resolved secret, in disclosures and in the kernel's own evidence and logs. Legacy scrubs by key or field name only (`safety.py:12-18`; OA_NEW `adapters/openalgo.py:414`, `:468`).
* **Deviation — broker credential source.** A live composition takes the broker key from files or systemd credentials. From the environment it is still accepted, as legacy read it (`openalgo/server.py:52-54`), with the warning `env_source` recorded in `CREDENTIAL_BOUND` (step 3); it never refuses. MCP static tokens move from configuration to secrets (`security.py:278`).
* **Deviation — exact versions.** The kernel socket checks an exact contract version string and the release digest. Legacy checks protocol `1` and a principal name (`service.py:228-236`; A02-F1).
* **Deviation — separate processes.** The owner API runs in the operator process, not on the MCP gateway (`gateway.py:201-234`).
* **New (no legacy equivalent):** the security journal and restore continuity (Combined-F4); delegated human principals (Q-014).

## Step 1 — requests, confirmations and principals

The authorities are the spec's [Channels and principals](../../design/security-and-operator.md#channels-and-principals-interfacesauthorizationpy) and [Operator requests and confirmations](../../design/security-and-operator.md#operator-requests-and-confirmations-contractsidentitypy-interfacesauthorizationpy) sections. Step 1 is pure and in memory: two modules and one test file. It uses no socket, ledger, settings key or process. The doors that hand it evidence come later (steps 5, 6 and 8), and so does the kernel's check of what it produces (step 2); each hand-off is named where it occurs. A design review (F-1…F-11) and a readiness review (R-1…R-12) read the first deepening; each finding was checked against the code and is resolved in the text below.

**In plain words.** This step writes the rules every door will use, before any door exists. It decides who you are from what the door can check (your login on the server, or the console's local or proxy sign-in), never from a name written in the request. It ties each request to exactly one action: what, on what, with which arguments. It keeps today's typed confirmations: `DISENGAGE` to restart trading, the strategy ID to lift a hold or a loss latch, and the broker order ID to cancel or close. The request is made only after you have typed, so it lasts 120 seconds from that moment, as today, however long you took to type. Sending the same click or command again returns the same request, never a second one.

### Decisions

#### Requests (`contracts/identity.py`)

Added beside the built types. The module imports from `autonomous_trading` only `contracts.clock` (for `Timestamp`), never the kernel or an adapter.

* `OPERATIONS = frozenset({"kill_engage", "kill_release", "hold_engage", "hold_release", "latch_unlock", "pause_clear", "cancel", "close", "advice_apply", "binding_authorize", "grant_admin", "recovery_advance", "attempt_resolve"})`, the catalogue's 13 names. That is `GRANT_ACTIONS` (`contracts/identity.py:78-81`) without `entry` and `modify`, plus `advice_apply`: no human entry door, and no human modify door except advice application (the Fork call above; `src/core/framework/execution/owner_command.py:53-54`).
* `REQUEST_CHANNELS = frozenset({"owner-cli", "owner-api"})`, legacy's owner-command channel names (`owner_command.py:50-51`). MCP reaches no kernel operation, so no request names it.
* `parse_utc(text) -> datetime` and `format_utc(dt) -> str` handle the stored UTC form `YYYY-MM-DDTHH:MM:SS.ffffffZ` (`_UTC`, `contracts/identity.py:86`), as the clock adapter writes it (`adapters/clocks.py:10-11`), which `interfaces` may not import. `parse_utc` raises `ValueError` on any other text; `format_utc` raises it on a naive `datetime`.
* `canonical_json(value) -> str` copies the ledger envelope's rule (`kernel/ledger/envelope.py:29-52`), because `contracts` may not import the kernel. It accepts `None`, `str`, `bool`, `int`, a finite `float`, a `list` or `tuple`, and a `dict` with `str` keys, at any depth; anything else raises `ValueError` naming its path. It returns `json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)`. A test pins byte-for-byte agreement with the envelope.
* `check_subject(value, name)` raises `ValueError` unless `value` is a string equal to its own `strip()`, 1 to 256 characters, with no character below U+0020: legacy's rule for the owner command's fields (`_text`, `owner_command.py:99-105`). The door strips; the contract refuses. It applies to a target's subject, to `named` (below) and to a latch unlock's `strategy` argument.
* `OperatorTarget(account, subject)`, frozen. `account` is an `AccountId` or `None`; `subject` is `None` or passes `check_subject`. Anything else raises `ValueError`. Its wire form is `{"account": [broker, account] | null, "subject": subject}`.
* `argument_digest(operation, target, args) -> str` is the SHA-256 hex of the UTF-8 bytes of `canonical_json(["operator-request/1", operation, target_wire, dict(args)])`. It raises `ValueError` when `operation` is not in `OPERATIONS`, `target` is not an `OperatorTarget`, or `args` is not a mapping with `str` keys that `canonical_json` can write. `args` holds every argument other than the target, the reason included; key order never matters.
* `check_target(operation, target, args)` raises `ValueError` when a confirmed operation's target or arguments do not fit its row below; other operations pass, and step 2 fixes their targets and arguments when it lists the kernel's entry points (each must recompute the digest from its own call). The expected typed text depends on these rows, so step 1 fixes them.

  | Operation | `target.account` | `target.subject` | `args` must hold | Kernel entry (built) |
  |---|---|---|---|---|
  | `kill_release` | `None` | `None` | nothing more | `safety.release_kill(auth, reason)` (`kernel/safety.py:242-243`) |
  | `hold_release` | `None` | the strategy | nothing more | `safety.release_hold(auth, strategy, released_reason, justification)` (`kernel/safety.py:249-252`) |
  | `latch_unlock` | the session's account | the session ID, which the door maps from the strategy (step 6, `SEC-R21`) | `strategy`, passing `check_subject` | `safety.unlock_latch(auth, session_id, reason)` (`kernel/safety.py:333`); step 2 checks that `strategy` names that session's standing binding, as legacy unlocks by strategy (`src/interfaces/console/api/routes/loss_latch.py:28-35`) |
  | `cancel`, `close` | the order's account | the broker order ID | nothing more | action admission (step 2) |

* `OperatorRequest(request_id, epoch, channel, channel_identity, principal, via, operation, target, argument_digest, confirmation_id, issued_at, valid_until)`, frozen, every field required. `issued_at` and `valid_until` are `Timestamp`s, so each carries its clock domain. Construction raises `ValueError` when:
  * `request_id` or `argument_digest` is not 64 lower-case hex (`is_hex_id`, `contracts/identity.py:89-91`);
  * `epoch` is not an `EpochId`, or `channel` is not in `REQUEST_CHANNELS`;
  * `channel_identity` does not fit its channel: `owner-cli` needs `uid:` followed by a full match of `0|[1-9][0-9]*`; `owner-api` needs `owner-api:local`, or `owner-proxy:` and 16 lower-case hex;
  * `principal` is not a `human` `Principal`, or `via` is neither `None` nor a `service` `Principal`;
  * `operation` is not in `OPERATIONS`, or `target` is not an `OperatorTarget`;
  * `confirmation_id` is neither `None` nor 32 lower-case hex (a `uuid4().hex`, as legacy's `command_id`, `owner_command.py:121`);
  * `issued_at` or `valid_until` is not a `Timestamp` whose `utc_iso` `parse_utc` accepts; their domains differ or either is `exchange`; or `valid_until` is not after `issued_at`.
* `OperatorRequest.validity(now: Timestamp, lifetime_secs: int) -> str` answers, checked in this order:
  * `"domain"` when `now.domain` is not the request's domain (F-3);
  * `"lifetime"` when `valid_until − issued_at` is not `lifetime_secs`: the kernel passes its own bound lifetime, so a request carrying any other window, 121 s included, is refused whatever its relay chose (F-2);
  * `"expired"` when `age = parse_utc(now) − parse_utc(issued_at)` is below zero or above `lifetime_secs`, compared as durations;
  * `"valid"` otherwise.

  A request is therefore still valid at exactly its lifetime and expired one microsecond later, as legacy's `age < 0 or age > TTL_SECONDS` (`owner_command.py:154-156`). `now` not in the stored form, or `lifetime_secs` not an int ≥ 1 (a bool refused), raises `ValueError`. Step 2 calls it as `validity(effective_now(writer, clock), request_ttl_secs)`, the kernel's ratchet that never moves back (`kernel/lifecycle.py:43-51`), and refuses every answer but `"valid"` with `SEC-R07`.

#### Callers (`interfaces/authorization.py`)

`interfaces/` is a namespace package, as `kernel/` is, with no `__init__.py`. The module imports from `autonomous_trading` only `contracts` modules, so the kernel's channel (step 5) can import its relay rule. It opens no socket, file or database. Every refusal is `Refusal(code, label, None, decision)`, with the label from the spec's [refusal codes](../../design/security-and-operator.md#refusal-codes) and the decision named per function.

* **Evidence.** One frozen type per channel, each holding what a door has already checked. Construction raises `ValueError` on a malformed value.
  * `CliEvidence(uid, pid, unit)`: `uid` an int ≥ 0 and `pid` an int ≥ 1 (bools refused). `unit` is the system `.service` unit whose cgroup holds `pid`, or `None` when there is none: a pid in a login scope (`session-<n>.scope`) or under the per-user manager (`user@<uid>.service`) is not in a service and reports `None` (F-6). Construction refuses a `unit` that does not end in `.service`, starts with `user@`, or holds whitespace or `/`. Step 6 fills it from `SO_PEERCRED` and the pid's cgroup.
  * `ApiEvidence(route, proxy_identity, client)`: `route` is `"loopback"` or `"proxy"`, the outcome of step 6's reachability rule (legacy `src/interfaces/console/api/security.py:45-74`). `proxy_identity` is the raw value of the `console.auth_header` header for `proxy` (a string, possibly blank) and `None` for `loopback`. The release binds that header to the identity provider's verified e-mail claim, and step 6 records the header's name in the release, so the claim used is pinned (F-5). `client` is a label of `[A-Za-z0-9._:-]{1,64}` that step 6 takes from the caller's request (the console backend names itself); it only separates session caps (below, F-11) and never decides identity or authority.
  * `McpEvidence(client_id)`: a client ID that step 8's token check produced, matching `[A-Za-z0-9._:-]{1,128}` (the command-key rule, `contracts/identity.py:8`).
* `MapEntry(principal, accounts)`, frozen. `accounts` is `None` for the owner, else a `frozenset` of `AccountId`; it may be empty, which reads nothing account-scoped. It has no action or grant field: **the map grants nothing**, and the kernel checks the principal's own grants (Q-014).
* `identity_map(entries: Mapping[str, MapEntry], owner: Principal) -> Mapping[str, MapEntry]` validates the map and returns a read-only copy whose `proxy:` keys are case-folded (`str.casefold()`). It raises `ValueError` when:
  * a key is not `uid:` followed by a full match of `0|[1-9][0-9]*` (R-1), `proxy:<identity>` (non-empty, equal to its own `strip()`) or `mcp:<client_id>` (the `McpEvidence` rule);
  * two `proxy:` keys are equal once case-folded;
  * a `uid:` or `proxy:` entry's principal is not `human`, or an `mcp:` entry's principal is not `Principal(key, "service")`;
  * the owner's entry has accounts, or another entry has `None`.
* `Caller(principal, path, channel, channel_identity, accounts, client)`, frozen. `path` is `owner_credential` or `operator_credential` (the kernel's human paths, `kernel/authority.py:27-28`), or `None` for MCP. `channel` is `owner-cli`, `owner-api` or `mcp`. `client` is the evidence's label on `owner-api`, else `None`.
* `Authorizer.authenticate(evidence) -> Caller | Refusal`, decision `"authenticate"`:

  | Evidence | Refusals, in order | Caller |
  |---|---|---|
  | `CliEvidence` | `unit` set: `SEC-R12`, since no service acts as the owner (F-SEC13; `src/runtime/tier1_authority/service.py:272-277`). `uid:<uid>` not in the map: `SEC-R01` | The entry's principal, with `owner_credential` when it is the owner and `operator_credential` otherwise; channel identity `uid:<uid>`; the entry's accounts |
  | `ApiEvidence`, loopback | None; the map is not read | The owner, `owner_credential`, `owner-api:local`, accounts `None` |
  | `ApiEvidence`, proxy | `identity = proxy_identity.strip()` is empty: `SEC-R01`, legacy's "authenticated owner identity is unavailable" (`src/interfaces/console/api/routes/ai_management.py:32-36`) | `proxy:` + `identity.casefold()` mapped: its principal and path, as for the CLI, and the entry's accounts. Unmapped: the owner, `owner_credential`, accounts `None` (R-11). Either way the channel identity is `owner-proxy:` plus the first 16 hex digits of `sha256` of `identity`'s UTF-8 bytes, case kept (`ai_management.py:37-38`) |
  | `McpEvidence` | `mcp:<client_id>` not in the map: `SEC-R01` | The entry's principal, path `None`, `mcp:<client_id>`, the entry's accounts |

  * **Fork call (the owner on the console):** a loopback caller, or a proxy identity the map does not name, is the owner, recorded as legacy records it (`ai_management.py:26-41`).
  * **New (Q-014; F-5):** the map lookup ignores case, so a case variant of a delegate's identity reaches the delegate, never the owner. Only mapped delegates are affected; legacy had none.
  * **Deviation (the CLI owner), accepted by the owner** ([combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30), "Stricter behaviours"): a CLI caller is a mapped login uid outside any service. Legacy's `at exposure` was any process that reached the loopback owner API (`src/interfaces/cli/exposure.py:48-56`).
  * **Payload names are claims:** `authenticate` reads no request field, and `execute` takes the principal from the session, never from `args`.
* **Relays.** `accept_relay(peer, relays, owner, principal, path) -> Relayed | Refusal`, with `Relayed(principal, path, via)` and decision `"relay"`. The kernel's channel calls it after its peer checks (step 5), for each request the operator process relays. It refuses `SEC-R10`, in order, when:
  * `peer` is not in `relays`;
  * `principal` is not `human`;
  * `path` is not `owner_credential` or `operator_credential`;
  * `path` is `owner_credential` and `principal` is not `owner`, or the reverse: the kernel's own pairing (`kernel/authority.py:119-122`).

  `relays` is a `frozenset` of `service` principals (`ValueError` otherwise), and `via` is `peer`. A relay adds no permission: step 2's kernel checks the human's own grants.

#### Doors and typed confirmations (`interfaces/authorization.py`)

* `DoorRule(offered, confirm, text, prompt, trim)`, frozen.
  * `confirm` is `"none"`, `"literal"` (type `text`), `"subject"` (type the target's subject) or `"named"` (type the identifier the person named on the command line).
  * `prompt` is legacy's prompt text.
  * `trim` is `"spaces_tabs"`, which is `str.strip(" \t")`, what bash `read -r` removes (`deploy/at:734`); or `"whitespace"`, which is `str.strip()` (`scripts/loss_latch.py:72`).
  * Construction raises `ValueError` (R-8) when `offered` is not a bool; `confirm` is not one of the four kinds; a row not offered has a `confirm` other than `"none"`; a `"none"` row has a `text`, `prompt` or `trim`; a confirmed row's `prompt` is not a non-empty string or its `trim` not one of the two; a `"literal"` row's `text` fails `check_subject`; or another row has a `text`.
* `LEGACY_DOORS: Mapping[tuple[str, str], DoorRule]` holds one row per channel (`owner-cli`, `owner-api`) and operation: 26 rows. **Fork call (doors and typed confirmations):** every row follows the spec's catalogue, which keeps legacy's doors and confirmations; `hold_engage` is new and only restricts (R-12). Each row not listed below is offered with no confirmation.

  | Channel | Operation | Offered | Typed text | Prompt | Trim | Legacy |
  |---|---|---|---|---|---|---|
  | `owner-cli` | `kill_release` | yes | literal `DISENGAGE` | `Type DISENGAGE to confirm` | spaces and tabs | `deploy/at:4278-4279` |
  | `owner-cli` | `hold_release` | yes | the subject (the strategy) | `Type the strategy id to confirm` | spaces and tabs | `deploy/at:4369-4370` |
  | `owner-cli` | `latch_unlock` | yes | named: the strategy the command named, equal to `args["strategy"]` | `Type the strategy id to confirm` | all whitespace | `scripts/loss_latch.py:72-73` |
  | `owner-cli` | `cancel`, `close` | yes | the subject (the broker order ID) | `Type the broker order id to confirm` | spaces and tabs | `deploy/at:4302-4303` |
  | `owner-cli` | `advice_apply` | no | | | | console only (`ai_management.py:90`) |
  | `owner-api` | `kill_engage`, `kill_release`, `hold_release` | no | | | | the console shows kill and holds and lifts neither (`src/interfaces/console/operations_surface.py:196-226`) |
  | `owner-api` | `grant_admin`, `recovery_advance`, `attempt_resolve` | no | | | | new operations, CLI only (the spec's catalogue) |
  | `owner-api` | `latch_unlock` | yes | none (a reason only) | | | `src/interfaces/console/api/routes/loss_latch.py:25-35` |
  | `owner-api` | `cancel`, `close` | yes | none | | | `src/interfaces/console/api/routes/exposure.py:20-34` |

  The `Authorizer` takes the table as an argument; step 6 binds it as `interfaces.confirmations` (the spec's policy inputs).
* **Exact comparison.** The typed text, trimmed by the row's rule, must equal the expected text under `==`: case-sensitive, with no other normalization, as legacy's `[ "$r" = "$id" ]` and Python `!=` (`deploy/at:4279`, `:4303`, `:4370`; `loss_latch.py:72`).
  * **Fork call (trim per door):** each row keeps its legacy trim. A no-break space around `DISENGAGE` refuses, and one around a latch's strategy ID passes, as today.
  * **Deviation — for owner review (kill and unlock confirmations; stricter, F-9):** an empty answer never matches. Legacy's prompt returns the default `cancel` for an empty line or a non-terminal (`deploy/at:724`, `:736`), so an order or strategy literally named `cancel` was confirmed by pressing Enter. The target closes that hole; keeping legacy would mean accepting Enter as a confirmation for such an ID.

#### Sessions (`interfaces/authorization.py`)

* `Authorizer(clock, *, owner, principals, doors, epoch, via, request_ttl_secs, session_ttl_secs, sessions_per_identity)`. Every argument is required (no defaults, D08). It raises `ValueError` when:
  * `owner` is not `human`, or `via` is not `service`;
  * `principals` fails `identity_map`, or `doors` does not hold exactly the 26 pairs as `DoorRule`s;
  * `epoch` is not an `EpochId`;
  * a duration or the cap is not an int ≥ 1 (a bool refused).

  Step 6 binds the arguments from settings. Tests pass labelled synthetic values, and legacy's 120 for `request_ttl_secs`.
* `Session(session_id, caller, epoch, opened_at, opened_elapsed_ns, csrf_token)`, frozen. `open_session(caller) -> Session` sets:
  * `session_id` to `secrets.token_hex(16)`; `opened_at` to `clock.now()`; `opened_elapsed_ns` to `clock.elapsed().monotonic_ns`;
  * for `owner-api`, `csrf_token` to `secrets.token_urlsafe(32)`, legacy's token form (`security.py:13`); for `owner-cli`, `None`.

  An `mcp` caller raises `ValueError`: MCP sessions are step 8's. An `owner-cli` session is one CLI connection. Step 6 ends it when the connection closes and after any refusal, as legacy's command ends at `die` (`deploy/at:4279`).
* **Live (R-5).** A session is live while it is held by the `Authorizer` and, for `owner-api` only (as the spec says), `clock.elapsed() − opened_elapsed_ns` is below `session_ttl_secs`. The lifetime runs on the monotonic clock, as legacy times its owner command (`owner_command.py:129`, `:154`), so a wall step neither ends nor extends a session (F-10). A session found past its lifetime is dropped with its challenge before the refusal.
* **Cap (F-11).** Opening one more than `sessions_per_identity` live `owner-api` sessions with the same channel identity and `client` drops the oldest of them by opening order, with its challenge. So one loopback client cannot drop another's sessions.
* `session(session_id, caller, csrf) -> Session | Refusal`, decision `"session"`. Refusals, in order:
  * not live (unknown, ended, dropped, or past its lifetime): `SEC-R01`;
  * the caller's channel, channel identity or principal differs from the session's: `SEC-R03` (another identity's token);
  * for `owner-api`, `csrf` is `None` or unequal: `SEC-R03`. The comparison uses `secrets.compare_digest` on UTF-8 bytes, as legacy (`security.py:84-89`).

  A `csrf` given for an `owner-cli` session raises `ValueError`. `prepare` and `execute` run this check themselves (F-1), as legacy's exposure route repeats reachability and the CSRF check before it issues a command (`src/interfaces/console/api/routes/exposure.py:25-29`).
* `end_session(session_id)` drops the session and its challenge; an unknown ID is no error.
* `observe_epoch(epoch) -> bool`. Another kernel epoch drops every session and challenge, records the new epoch and returns true; the same epoch changes nothing and returns false. Remembered requests (below) are kept, so a retry after a kernel restart still carries its old epoch, and step 2 can refuse it after a restore (`SEC-R19`).

#### Prepare and execute (`interfaces/authorization.py`)

* `request_id_of(principal, channel_identity, nonce) -> str` is the SHA-256 hex of the UTF-8 bytes of `canonical_json([[principal.value, principal.kind], channel_identity, nonce])`. It holds no session, so a retry on a new connection keeps it (the spec).
* **The nonce** is the caller's `x-request-id`. It must fully match `[A-Za-z0-9_-]{22,64}`, with nothing stripped, so a trailing newline is refused (`ValueError`); the door refuses it before (step 6). Doors make one with `new_nonce()`, which is `secrets.token_urlsafe(16)`: 22 characters, 128 random bits (F-7). **Deviation:** legacy accepted 8 to 64 characters (`SAFE_ID`, `src/interfaces/mcp/core/trace.py:36`) and replaced a missing or malformed header with a new ID (`security.py:21-22`); the target requires a nonce of at least 128 bits (the replay Deviation above). Step 10's console must send one.
* `prepare(session_id, caller, csrf, operation, target, args, *, named=None) -> Challenge | Refusal`, decision `"prepare"`, in order:
  1. `ValueError` first (R-4): `operation` not in `OPERATIONS`; `target` not an `OperatorTarget`; `args` that `argument_digest` refuses; `check_target` fails (R-2); `named` given and failing `check_subject` (R-3).
  2. `session(session_id, caller, csrf)`: its refusal is returned.
  3. The door rule for `(caller.channel, operation)` is not offered: `SEC-R13`.
  4. `ValueError` for a rule whose `confirm` is `"none"`; `named` missing for `"named"` or given for another kind; for `latch_unlock`, `named` not equal to `args["strategy"]` (F-4).
  5. It returns `Challenge(confirmation_id, prompt, expected, session_id, operation, target, argument_digest, trim)`, with `confirmation_id = uuid4().hex` and `expected` the literal, `target.subject` or `named`. A session holds one challenge: a new `prepare` drops the earlier one, as legacy's command asks one prompt (F-11). The challenge has no deadline of its own, as legacy's prompt has none (`deploy/at:734`).
* `execute(session_id, caller, csrf, operation, target, args, nonce, *, confirmation_id=None, typed=None) -> OperatorRequest | Refusal`, decision `"execute"`, in order:
  1. `ValueError` first: everything `prepare`'s first step refuses, and a nonce that does not match.
  2. `session(session_id, caller, csrf)`: its refusal is returned. A `Session` object built by hand authorizes nothing: only an ID the `Authorizer` holds is live.
  3. It computes `digest = argument_digest(operation, target, args)` and `rid = request_id_of(caller.principal, caller.channel_identity, nonce)`.
  4. **A remembered request.** If `rid` was minted in this process and is still held, then with the same digest the same request is returned unchanged (its `issued_at`, `epoch` and `confirmation_id` too), with nothing checked or minted again, so a retry never extends validity; with another digest, `SEC-R04`. A remembered request is pruned once `clock.elapsed()` is more than twice `request_ttl_secs` past its minting: the lifetime plus a margin of one lifetime (F-11). This bounds memory and moves no money: after the prune, the kernel's permanent record still answers a recorded request (step 2).
  5. The door rule is not offered: `SEC-R13`.
  6. A rule with a confirmation:
     * `confirmation_id` or `typed` is `None`: `SEC-R05`;
     * no challenge with that ID in this session (another session's or principal's, a dropped one, or none): `SEC-R06`;
     * the challenge's operation, target or digest differs: `SEC-R06`;
     * `confirmation_id` is marked consumed: `SEC-R08`;
     * the trimmed `typed` differs from `expected`: `SEC-R06`. The challenge stays usable, since a refused submission leaves it until its session ends (the spec).

     A rule without a confirmation, given a `confirmation_id` or `typed`: `ValueError`.
  7. **Mint, at this moment.** `issued_at` is `clock.now()`, and `valid_until` that instant plus `request_ttl_secs`, in the same domain. The request carries `rid`, the current epoch, the caller's channel, channel identity and principal, `via`, the operation, target and digest, and `confirmation_id`. It is remembered under `rid` and returned.
* `consumed(confirmation_id)` marks a confirmation used. Step 6 calls it when the kernel's reply shows the request committed, or refused with `SEC-R08`. The kernel's `operator_request` index is the lasting record (step 2).
* **Fork call (request lifetime):** 120 s from `execute`, after the typed text, as legacy issues the command after the prompt and refuses it at the send once older (`owner_command.py:56-58`, `:154-156`; `deploy/at:4302-4305`; `exposure.py:25-34`). Time spent typing does not count. Step 6 binds `request_ttl_secs` to 120 (the spec's policy inputs), and the kernel checks with its own value (F-2).
* **Deviation (the clock):** legacy measured the command's age on one process's monotonic clock (`owner_command.py:129`, `:154`). The target's request is issued by the operator process and checked by the kernel, so its age is measured between two processes' wall instants in one recorded domain, the kernel's on its ratchet (F-3). A wall step between the two shortens or lengthens validity by the step.

#### What later steps take from step 1

* **Step 2** (F-8):
  * `Authenticated` gains `request` and `via`, so every constructor of it changes, the simulation's included;
  * the kernel refuses `SEC-R10` when `request.principal` is not the relayed principal, `request.via` is not the relay peer, or the request's channel identity does not fit the principal (`owner-api:local` only for the owner); a path/principal mismatch (`owner_credential` not exactly for the owner) is `SES-R01` at bind's row 0, the kernel's existing `_authenticated`;
  * it looks up the recorded result by `request_id` before `validity`, so a retry of a committed request after 120 s returns the recorded result, and its reply flags `replayed` (F-7);
  * it calls `validity(effective_now(writer, clock), request_ttl_secs)` for `SEC-R07`, and recomputes `argument_digest` from each entry point's own target and arguments, checking a latch unlock's `strategy` against the session's binding.
* **Step 5** calls `accept_relay` after its peer checks.
* **Step 6** builds `CliEvidence` from the pid's cgroup and `ApiEvidence` with its `client` label; binds the `Authorizer`'s settings; makes nonces with `new_nonce()`; ends a CLI session after any refusal; and calls `consumed`.
* **Step 8** builds `McpEvidence` from its token check. **Step 10**'s console sends a nonce of at least 22 characters.

### Tests

`tests/unit/test_operator_authorization.py` (tree delta **T-60**) is pure: no ledger, socket or process. It uses a `RecordedClock` at `START`, `2026-11-02T09:15:00.000000Z` (`tests/conftest.py`). Every identity, uid, account, nonce, reason and duration is labelled synthetic, and every expectation is written by hand from the rules above. Each hex value is the SHA-256 of the hand-written canonical text beside it, computed at deepening.

The synthetic values:

* principals: the owner `Principal("owner", "human")`; the delegate `Principal("synthetic-delegate", "human")`; the relay `Principal("svc:operator-sim", "service")`;
* the map: `uid:1001` → the owner; `uid:1002` → the delegate with `{ACCT}`; `proxy:synthetic-delegate@example.test` → the delegate with `{ACCT}`; `mcp:synthetic-client` → `Principal("mcp:synthetic-client", "service")` with no accounts;
* epochs `epoch-synthetic-1` and `epoch-synthetic-2`; client labels `console-sim` and `script-sim`; session lifetime 900 s and cap 2; request lifetime 120 s (legacy).

| Group | Cases |
|---|---|
| Canonical | `canonical_json` and the envelope's `canonical` give the same bytes for `{"b": 1, "a": [1.5, True, None, "é"]}` (`{"a":[1.5,true,null,"é"],"b":1}`, `é` unescaped), a tuple, nested dicts, an empty dict and a negative int. Both raise `ValueError` for NaN, +inf, −inf, a non-`str` key, a `set`, `bytes` and a `Decimal`. `parse_utc` and `format_utc` round-trip `2026-11-02T09:20:00.000000Z`; `2026-11-02T09:20:00Z` and a naive `datetime` are refused |
| Digest | `cancel`, account `sim`/`acct-sim`, subject `o-close`, args `{"strategy": "buyer_edge", "reason": "synthetic reason"}`: the canonical text by hand is `["operator-request/1","cancel",{"account":["sim","acct-sim"],"subject":"o-close"},{"reason":"synthetic reason","strategy":"buyer_edge"}]`, digest `606e671d8a77f8a9cbdb979ec252040239b2b2596bf8d2919eae8dd8198c6566`. `kill_release` with an empty target: `["operator-request/1","kill_release",{"account":null,"subject":null},{"reason":"synthetic reason"}]`, digest `9a876d519030141a7c0b9cf6f7fbf38d866ed15b2c39808484fc94ccdc309e64`. Each change moves the digest: operation `close`; account `acct-two`; account `None`; subject `o-other`; another reason; an added `quantity`; `strategy` removed. Reordered args do not. Refused: `entry`, `modify`, an unknown name, a non-`str` arg key, a NaN arg, a list as args, a dict as target |
| Targets | One case per row of `check_target`: `kill_release` with an account, and with a subject; `hold_release` with an account, and without a subject; `latch_unlock`, `cancel` and `close` each without an account, and without a subject; `latch_unlock` without `strategy`, and with `strategy` `" x"`. Each raises `ValueError` from `prepare` and from `execute`. `pause_clear` with any target passes |
| Request type | One case per construction refusal: a 63-digit and an upper-case `request_id`; channel `mcp`; identities `uid:00`, `owner-api:remote`, `owner-proxy:CA6A4062FD2A2C32`, and a `uid:` identity on `owner-api` (and `uid:0` accepted); a `service` principal; a `human` `via`; operation `entry`; a 31-digit `confirmation_id`; `issued_at` `2026-11-02T09:20:00Z`; an `exchange` domain; mixed domains; `valid_until` equal to `issued_at`; subjects ` o-close`, 257 characters, and one with a newline. `validity` for a request issued at 09:20:00.000000 and valid until 09:22:00.000000 (recorded), with lifetime 120: `"valid"` at 09:20:00.000000 and 09:22:00.000000; `"expired"` at 09:22:00.000001 and 09:19:59.999999; `"domain"` for a wall `now`; `"lifetime"` for a request whose window is 121 s, and for lifetime 119; a malformed `now` and lifetime `True` raise `ValueError` |
| Authentication | CLI uid 1001: the owner, `owner_credential`, `uid:1001`, accounts `None`. Uid 1002: the delegate, `operator_credential`, `{ACCT}`. Uid 1003: `SEC-R01`. Uid 1001 with unit `at-kernel.service`: `SEC-R12`. Units `session-3.scope` and `user@1001.service`: `ValueError` (the resolver reports them as `None`). API loopback: the owner, `owner-api:local`, client `console-sim`, also with an empty map. Proxy `synthetic-owner@example.test`, unmapped: the owner, `owner-proxy:ca6a4062fd2a2c32`, accounts `None`; the same with surrounding spaces: the same fingerprint. `synthetic-delegate@example.test`: the delegate, `operator_credential`, `{ACCT}`, `owner-proxy:177ac8166c0bf247`. Its case variant `Synthetic-Delegate@Example.TEST`: the delegate, not the owner, `owner-proxy:1fb9e7f374188f78`. A blank identity: `SEC-R01`. Loopback with an identity: `ValueError`. MCP `synthetic-client`: its service principal, path `None`; `other-client`: `SEC-R01`. Map refusals: `uid:00`, `uid:-1`, `proxy:`, `proxy: x`, `proxy:A@x` with `proxy:a@x`, `mcp:a b`, `host:1`, a `service` uid entry, an `mcp` entry with another value, the owner with accounts, the delegate with `None`; `uid:0` accepted. The map grants nothing: `MapEntry`'s fields are exactly `principal` and `accounts`, `Caller`'s exactly its six. A payload name: `args` holding `"by": "synthetic-delegate"` and `"principal": ["synthetic-delegate", "human"]`, executed in the owner's session, mint a request whose principal is the owner |
| Relay | From the listed peer, the owner on `owner_credential` and the delegate on `operator_credential` are accepted, `via` the peer. `SEC-R10` for an unlisted peer, `Principal("kernel:safety", "kernel")`, a `service` principal, paths `local_channel` and `in_process`, the delegate on `owner_credential` and the owner on `operator_credential`. A `human` in `relays`: `ValueError` |
| Doors | `LEGACY_DOORS` has the 26 pairs. Each confirmed row has its kind, text, prompt and trim from the table. `advice_apply` is not offered on the CLI. `kill_engage`, `kill_release`, `hold_release`, `grant_admin`, `recovery_advance` and `attempt_resolve` are not offered on the owner API. Every other row is offered with no confirmation. Each `DoorRule` refusal, one case each. An `Authorizer` given 25 rows raises `ValueError` |
| Sessions | An owner-API session has a 32-hex ID and a token; a CLI session has no token; an MCP caller raises `ValueError`. Lifetime 900 s: live at 899,999 ms, `SEC-R01` at 900,000 ms, its challenge gone. A wall jump of +10,000,000 ms ends nothing. Cap 2: a third `console-sim` session drops the first (`SEC-R01`) and leaves the second and third live; `script-sim`'s session and the proxy owner's are not dropped. An ended session: `SEC-R01`. The loopback session presented by the proxy owner: `SEC-R03`. A missing, wrong, or `é` token: `SEC-R03`, with no exception. A token on a CLI session: `ValueError`. After `epoch-synthetic-2` is observed, every session is `SEC-R01`; observing the current epoch again drops nothing. A `Session` built by hand with a fresh ID: `prepare` and `execute` give `SEC-R01`. A wrong token passed to `execute`: `SEC-R03`, nothing minted |
| Confirmations | In uid 1001's CLI session, `kill_release` with target `(None, None)` and args `{"reason": "synthetic reason"}`: the challenge's prompt and `DISENGAGE`. Execute without a confirmation: `SEC-R05`; `disengage`: `SEC-R06`; `""`: `SEC-R06`; `DISENGAGE` followed by a no-break space: `SEC-R06`; `" DISENGAGE\t"` mints. After `consumed`, the same challenge with a new nonce: `SEC-R08`. A mistyped attempt, then the right text: mints (the challenge stayed usable). A second `prepare` drops the first challenge (`SEC-R06` for its ID). The delegate's challenge used in the owner's session: `SEC-R06`. The challenge used for `hold_release`: `SEC-R06`; for another subject: `SEC-R06`; with another reason: `SEC-R06`. After `epoch-synthetic-2`: `SEC-R01`. `hold_release` expects the subject `buyer_edge`; `cancel` expects `o-close`. `latch_unlock` with subject `sim:acct-sim:NSE-FO-sim:2026-11-02` and args `{"strategy": "buyer_edge", "reason": "synthetic reason"}`: without `named`, with `named=" x"`, and with `named="other"`, `ValueError`; with `named="buyer_edge"` it expects `buyer_edge`, and `" buyer_edge "` mints. `prepare` for `pause_clear`: `ValueError`; `execute` for `pause_clear` with `typed`: `ValueError`. On the owner API, `kill_release`'s `prepare` and `execute`: `SEC-R13` |
| Minting | In uid 1001's CLI session: `prepare` for `kill_release`, target `(None, None)`, args `{"reason": "synthetic reason"}` at 09:15:00; then 300,000 ms of typing; then `execute` with typed `DISENGAGE` and nonce `nonce-synthetic-000000001`. `issued_at` is `2026-11-02T09:20:00.000000Z` and `valid_until` `2026-11-02T09:22:00.000000Z`, both recorded. Its `request_id` is the SHA-256 of `[["owner","human"],"uid:1001","nonce-synthetic-000000001"]`, `ed0b426a2765d08d4315c3d2b062fe10240976a3570a792a95c1b86ad1467d15`; epoch `epoch-synthetic-1`, channel `owner-cli`, `via` the relay, the challenge's `confirmation_id`. An owner-API `latch_unlock` mints with `confirmation_id` `None` |
| Retries | The same nonce and digest 60 s later: the equal request, still issued at its first instant, 09:15:00. In a second session of the same identity: the same. After `consumed`: the same, with no `SEC-R08`. After `epoch-synthetic-2` and a new session: the request with `epoch-synthetic-1`. At 240,000 ms after minting: the same request; at 240,001 ms: a new request, issued then. The same nonce with another reason: `SEC-R04`. The same nonce from uid 1002: another `request_id`. Two sessions, one nonce: one `request_id`. `new_nonce()` gives 22 characters that match. Nonces of 21 characters, of 65 characters, with a space, and a valid one followed by `\n`: `ValueError` |
| Boundary | Parsed with `ast`: `contracts/identity.py` imports from `autonomous_trading` only `contracts.clock`. `interfaces/authorization.py` imports from `autonomous_trading` only `contracts` modules, and imports none of `socket`, `sqlite3`, `apsw`, `subprocess`, `os` and `pathlib` |

### Break checks

Each mutation is applied after its anchor is checked, run against the test file, and restored byte for byte with an md5 check. Each must fail a test.

| Change | Test that must fail |
|---|---|
| The digest omits `target.account` | Digest |
| `canonical_json` without `sort_keys` | Canonical; Digest (reordered args) |
| `canonical_json` escapes non-ASCII | Canonical |
| `check_target` accepts any target | Targets |
| The request minted at `prepare` (its `issued_at` taken there) | Minting |
| `validity` ignores the domain | Request type |
| `validity` uses the request's own window instead of `lifetime_secs` | Request type |
| `validity` expires at `age >= lifetime` | Request type |
| `validity` accepts `age < 0` | Request type |
| Typed text compared case-insensitively | Confirmations |
| Every row trimmed with `str.strip()` | Confirmations (the no-break space after `DISENGAGE`) |
| No trim | Confirmations (`" DISENGAGE\t"`) |
| `latch_unlock` does not compare `named` with `args["strategy"]` | Confirmations |
| A session survives an epoch change | Sessions; Confirmations |
| `execute` skips the token check | Sessions (wrong token) |
| The session lifetime on the wall clock | Sessions (wall jump) |
| The cap counts every client of an identity together | Sessions |
| The cap drops the newest session | Sessions |
| A session ends only past its lifetime (`>`) | Sessions |
| The CSRF token compared as `str` | Sessions (`é`) |
| The retry identity includes the session ID | Retries |
| Remembered requests checked after the confirmation | Retries (after `consumed`) |
| Remembered requests dropped at an epoch change | Retries |
| Remembered requests never pruned | Retries (240,001 ms) |
| The nonce matched with `re.match` and `$` (a trailing newline passes) | Retries |
| An unmapped proxy identity refused | Authentication |
| The proxy lookup case-sensitive | Authentication (the case variant) |
| The fingerprint taken over the unstripped identity | Authentication |
| A CLI peer inside a unit accepted | Authentication |
| `uid:` keys matched with leading zeros allowed | Authentication; Request type |
| `execute` takes the principal from `args["principal"]` when present | Authentication (the payload name) |
| The relay accepts a `service` principal | Relay |
| `kill_release` offered on the owner API | Doors; Confirmations |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/contracts/identity.py` | `OPERATIONS`, `REQUEST_CHANNELS`, `parse_utc`, `format_utc`, `canonical_json`, `check_subject`, `OperatorTarget`, `argument_digest`, `check_target`, `OperatorRequest` |
| `src/autonomous_trading/interfaces/authorization.py` | New: `CliEvidence`, `ApiEvidence`, `McpEvidence`, `MapEntry`, `identity_map`, `Caller`, `Relayed`, `accept_relay`, `DoorRule`, `LEGACY_DOORS`, `Session`, `Challenge`, `request_id_of`, `new_nonce`, `Authorizer` |
| `tests/unit/test_operator_authorization.py` | New (T-60) |

No new tree delta: both modules are in the target tree, and the test file is T-60.

### Completion conditions (step 1)

* Every test above passes twice in a row with the whole suite, on Windows and on Linux alike: nothing in the step depends on the platform.
* Every break check fails a listed test, and every file is restored (md5); `ast.parse` passes on both edited Python files.
* `git diff --name-only` names exactly the three files above.
* PRF-SEC-01 and PRF-SEC-02 pass. Here, PRF-SEC-01's "each channel row" covers the CLI, owner-API and MCP rows and the relay; the kernel socket's peer row is PRF-SEC-05 (step 5), and the kill input's row is PRF-SEC-12 (step 4).

### Step 1 as built

**In plain words.** The rules for who is asking, and for tying each request to one action, are built and tested. Your typed confirmations work as today, a request is made only after you type and lasts 120 seconds, and sending the same request again never makes a second one. All 1,134 automatic checks pass, twice in a row.

Commit `726ff6e` on branch `slice-10`, cut from `fb8f2bb` (SLICE-08 step 3) in its own worktree. It changes the three files in the step's table (1,291 lines added, 1 removed), and nothing else.

**Choices made while building:**

| Topic | As built |
|---|---|
| Target wire form | `OperatorTarget.wire()` is a method of the type, which `argument_digest` calls; the text named only the form |
| Module constants | `interfaces/authorization.py` also holds `LABELS` (the spec's refusal labels), `HUMAN_PATHS`, `DOOR_CHANNELS` and `DoorRule.trimmed(typed)`, the row's trim |
| Order of the `ValueError` checks | `prepare` and `execute` raise every `ValueError` of their first step, the nonce's included, before the session check, so a malformed call never reaches a refusal |
| Cap order | "Oldest" is the `Authorizer`'s opening order (its session table keeps insertion order); `opened_at` never decides it |
| A session's challenge on expiry | The owner API asks no typed text, so the test places a challenge record by hand to prove an expired session drops it |

**Tests:** `tests/unit/test_operator_authorization.py`, 47 test functions, 114 cases with their parameters; all pass. The whole suite: 1,134 passed (1,020 before plus 114), twice in a row (124.5 s and 123.5 s). `ast.parse` passes on the three files.

**Break checks** (`s10a_breaks.py`, anchors checked first, one mutation at a time, every file restored byte for byte, md5 verified): all 33 failed a test of their listed group.

| Change | Test that failed |
|---|---|
| The digest omits `target.account` | Digest |
| `canonical_json` without `sort_keys` | Canonical; Digest |
| `canonical_json` escapes non-ASCII | Canonical |
| `check_target` accepts any target | Targets |
| The request minted at `prepare` | Minting |
| `validity` ignores the domain | Request type |
| `validity` uses the request's own window | Request type |
| `validity` expires at `age >= lifetime` | Request type |
| `validity` accepts `age < 0` | Request type |
| Typed text compared case-insensitively | Confirmations |
| Every row trimmed with `str.strip()` | Confirmations |
| No trim | Confirmations |
| `latch_unlock` does not compare `named` with `args["strategy"]` | Confirmations |
| A session survives an epoch change | Sessions; Confirmations |
| `execute` skips the token check | Sessions |
| The session lifetime on the wall clock | Sessions |
| The cap counts every client of an identity together | Sessions |
| The cap drops the newest session | Sessions |
| A session ends only past its lifetime | Sessions |
| The CSRF token compared as `str` | Sessions |
| The retry identity includes the session ID | Retries |
| Remembered requests checked after the confirmation | Retries |
| Remembered requests dropped at an epoch change | Retries |
| Remembered requests never pruned | Retries |
| The nonce matched with `re.match` and `$` | Retries |
| An unmapped proxy identity refused | Authentication |
| The proxy lookup case-sensitive | Authentication |
| The fingerprint taken over the unstripped identity | Authentication |
| A CLI peer inside a unit accepted | Authentication |
| `uid:` keys with leading zeros allowed | Authentication; Request type |
| `execute` takes the principal from `args["principal"]` | Authentication |
| The relay accepts a `service` principal | Relay |
| `kill_release` offered on the owner API | Doors; Confirmations |

## Step 2 — the kernel's binding check

The authorities are the spec's [binding check](../../design/security-and-operator.md#the-kernels-binding-check-kernelauthoritypy), its [refusal codes](../../design/security-and-operator.md#refusal-codes) and [event catalogue](../../design/security-and-operator.md#event-catalogue), and the crash points CP-SEC1, F-SEC10 and F-SEC12 ([failure modes](../../design/security-and-operator.md#failure-modes-and-crash-points)). Step 2 changes the kernel, the ledger (migration 7), the simulation composition and the tests. It adds no socket, process or door: the doors that hand the kernel a request come in steps 5 and 6. It builds on step 1 as built (`726ff6e`, merged into `slice-08` at `c2cca11`) and honours every item of step 1's "What later steps take from step 1". The branch `slice-10` is brought to `c2cca11` by fast-forward before step 2 starts.

**In plain words.** The kernel now checks every owner action itself, instead of trusting whoever passes it on. Each action must carry the one request it was made for: the same action, on the same thing, with the same details, from the same person. A cancel or a close must also be less than 120 seconds old, as today, timed on the kernel's own clock. Kill release, hold release, latch unlock, pause clear and recovery have no time limit, as today. Your fresh request through the `at` command or the console always passes these checks. They refuse only a request that is malformed, sent by the wrong process, reused, or older than a restore. Every refusal is written down. Every action that goes through is written into the ledger together with its request, in the same step, so the record can never miss one. If the reply is lost and the same request is sent again, even minutes later, you get the first answer back and nothing happens twice. Applying an AI exit suggestion is refused until the advice store arrives (SLICE-09), and while trading is stopped, as today. And the kill file can now stop trading on its own, as the kernel's safety check, with no person needed.

### Decisions

#### The human entry points (found first)

`OA_NEW` has no `.codegraph/` index, so the callers of `Authority.check` and of `Safety._authorized` at `c2cca11` were found with a full-text search of `src/` and each call site opened. Every caller is one of these 14 entry points, or one of the four exclusions below.

| # | Entry point | Reaches the check through | Operation |
|---|---|---|---|
| 1 | `Safety.engage_kill` (`kernel/safety.py:239-240`) | `_commit` (`:222-237`) → `_authorized` (`:209-220`) → `check` (`:217`) | `kill_engage` |
| 2 | `Safety.release_kill` (`:242-243`) | the same | `kill_release` |
| 3 | `Safety.engage_hold` (`:245-247`) | the same | `hold_engage` |
| 4 | `Safety.release_hold` (`:249-252`) | the same | `hold_release` |
| 5 | `Safety.unlock_latch` (`:333-359`) | `check` (`:349`) | `latch_unlock` |
| 6 | `Policy.clear_pause` (`kernel/policy.py:218-230`) | `check` (`:221`) | `pause_clear` |
| 7 | `lifecycle.resolve_attempt` (`kernel/lifecycle.py:489-540`) | `check` (`:502`) | `attempt_resolve` |
| 8 | `Recovery.advance` (`kernel/recovery.py:362-373`) | `_human_recovery_action` (`:351-360`) → `check` (`:357`) | `recovery_advance` |
| 9 | `Recovery.record_fence` (`:375-389`) | the same | `recovery_advance` |
| 10 | `Authority.issue` (`kernel/authority.py:177-196`) | `_admin` (`:170-175`) → `check` (`:172`) | `grant_admin` |
| 11 | `Authority.revoke` (`:198-207`) | the same | `grant_admin` |
| 12 | `Authority.authorize_binding` (`:228-238`) | `check` (`:230`) | `binding_authorize` |
| 13 | `Authority.revoke_binding` (`:240-247`) | `check` (`:243`) | `binding_authorize` |
| 14 | `ActionAdmission.admit` (`kernel/admission.py:519-617`), for a human cancel, close or modify | `_a2` (`:513-517`), at A2 (`:544`) and B:A2 (`:564`) | `cancel`, `close` or `advice_apply` |

Not human entry points:

* `EntryAdmission._a2` (`kernel/admission.py:634-638`) and the SLICE-01 seam `Coordinator._submit_admitted` (`kernel/coordinator.py:169-240`, checks at `:192` and `:206`) admit entries. No operation names `entry`, because there is no human entry door. Step 2 refuses a relayed human and the owner at `EntryAdmission` (below). The seam is reached only by the coordinator and `operations/verification.py` (the `_BUILDERS` guard in `tests/contracts/test_capabilities.py`).
* `Authority.recheck` (`kernel/authority.py:155-163`), called at dispatch (`kernel/coordinator.py:283-286`), gains request validity (below).
* `Authority._revoke_unverified` (`:209-213`) is `kernel:recovery`'s own capability and is never checked.
* The protection loop (`kernel/protection.py:702`, `:1003`, `:1097`) acts as `kernel:protection`.

The list is the spec's 13 names plus action admission. PRF-SEC-03's Binding group has one case per row, and three for row 14 (cancel, close, modify).

#### `Authenticated` (`kernel/authority.py`)

* `Authenticated(principal, path, *, request, via)`, frozen, with slots. `request` is an `OperatorRequest` or `None`; `via` is a `Principal` or `None`. Both are keyword-only and have **no default**, so every construction site states whether it carries a request (step 1, F-8).
* `__post_init__` raises `ValueError` when:
  * `request` is neither `None` nor an `OperatorRequest`;
  * `via` is neither `None` nor a `service` principal;
  * the principal is not `human` and either field is set.
* Every constructor:

  | Site | After step 2 |
  |---|---|
  | `bootstrap.py:96-100`, the disarmed table | `Authenticated(principal, path, request=None, via=None)` |
  | `bootstrap.py:174`, `Composition.owner_auth` | `Authenticated(owner, "owner_credential", request=None, via=None)`, kept as the *unbound* owner: `Authority.check` accepts it, and every human entry point refuses it (`SEC-R09`, unrecorded) |
  | `kernel/protection.py:702` | `Authenticated(PROTECTION, "in_process", request=None, via=None)` |
  | New: `Composition.relay` in `bootstrap.py` | `Authenticated(relayed.principal, relayed.path, request=request, via=relayed.via)`: the simulation's stand-in for step 5's channel |
  | Tests (every file in the Files table that builds one) | Each states `request=None, via=None`, or takes a bound one from the fixture |

* Two guards keep it so, both in `tests/contracts/test_capabilities.py`, with one allowed-file set: `bootstrap.py` and `kernel/protection.py`. Step 4 adds the kill-input check's file; step 5 adds `adapters/unix_channel.py`.
  * `_BUILDERS` gains `"Authenticated("` with that set.
  * `test_authenticated_never_replaced` (new) parses every `src/` file with `ast`. It fails on any call to `replace` or `dataclasses.replace` with a keyword `principal`, `path`, `request` or `via` outside that set, so no code copies an `Authenticated` with a borrowed request or principal. No `src/` call passes those keywords at `c2cca11`.
* **Two commits (F-9).** The constructor change (both fields at every site, `request=None, via=None`, and the guards) lands as its own mechanical commit, with no behaviour change, before the behaviour commit.

#### `Replayed`, labels and the request lifetime (`kernel/authority.py`)

* `Replayed(request_id, decision, sequence, outcome)`, frozen:
  * `decision` is the recorded decision's kind;
  * `sequence` is the recorded `OPERATOR_REQUEST` event's sequence;
  * `outcome` is the command's current `Outcome` for action admission (`_existing_outcome`, `kernel/coordinator.py:47-55`), and `None` for every other entry point.

  An entry point returns it in place of its `Committed` or `Outcome`. It writes nothing and changes no in-memory state (a replayed `advance` does not move `Recovery.stage`). Step 5 puts `replayed: true` on the wire.
* `_MESSAGES` gains the spec's labels: `SEC-R04` `request_replayed`, `SEC-R07` `request_expired`, `SEC-R08` `confirmation_consumed`, `SEC-R09` `request_unbound`, `SEC-R10` `relay_scope`, `SEC-R19` `restored_since_request`, `SEC-R20` `advice_under_kill`, `SEC-R22` `owner_absent`. Each refusal is `Refusal(code, label, None, "authority")`; action admission re-wraps it with its command key and `COMMAND_ADMITTED`, as it does A2's.
* `Authority(writer, clock, *, owner, stage, lease_hook=None, request_ttl_secs, relays)`. Both new arguments are required:
  * `request_ttl_secs` is an int ≥ 1, with a bool refused (`ValueError`). It is the kernel's own bound lifetime, which step 1's `validity` compares with each request's window (F-2).
  * `relays` is a `frozenset` of `service` principals (`ValueError` otherwise): the relay set, passed as data by the composition, so no `kernel/` module imports `interfaces`. The simulation passes `frozenset({SIM_RELAY})`; step 5 binds it from `channel.relays`.
* `TIMED_OPERATIONS = ("cancel", "close")`, the operations legacy timed (`owner_command.py:54`, `:58`, `:154-156`; `src/interfaces/console/api/routes/exposure.py:30-34`).
* `target_of(account, subject) -> OperatorTarget | None` returns the target, or `None` when `OperatorTarget` raises (a subject failing `check_subject`). `bind` refuses a `None` target with `SEC-R09`.
* `action_wire(request) -> dict` (`kernel/admission.py`) is `wire(request)` without its `"principal"` key. It keeps `command_key`, so one request names one command.

#### `bind(auth, operation, target, args) -> Replayed | Refusal | None` (`kernel/authority.py`)

It runs first in every entry point of the table above. `operation`, `target` and `args` are the entry point's own, from the next table. The checks run in this order; the first that fails decides.

| # | Refuses or returns when | Result | Recorded |
|---|---|---|---|
| 0 | `self._authenticated(auth)` is false (`kernel/authority.py:119-122`): no auth, a path the principal's kind may not use, or `owner_credential` not exactly for the owner (the path/principal mismatch) | `SES-R01` | no: not attributable |
| 1 | The principal is `kernel` or `service` | `None` (no request needed) | — |
| 2 | `auth.request` is `None` | `SEC-R09` | no: there is no request to name |
| 3 | `request.principal != auth.principal`; `auth.via` is `None` or `request.via != auth.via`; or `request.channel_identity == "owner-api:local"` and the principal is not the owner (loopback is always the owner, step 1) | `SEC-R10` | no: the relay's assertion is what failed |
| 4 | **The recorded result.** An `operator_request` row has `request.request_id`. When `request.operation == operation`, `request.target == target` and `request.argument_digest == row.argument_digest == argument_digest(operation, target, args)`, the result is `Replayed`; otherwise `SEC-R04` | `Replayed` or `SEC-R04` | `SEC-R04` yes |
| 5 | `target` is `None`; `request.operation != operation`; `request.target != target`; `argument_digest(operation, target, args)` raises or differs from `request.argument_digest`; `check_target(operation, target, args)` raises; or the request's epoch was never activated in this ledger and no activation carries a restore marker | `SEC-R09` | yes |
| 6 | `request.confirmation_id` is set and an `operator_request` row holds it | `SEC-R08` | yes |
| 7 | `operation` is in `TIMED_OPERATIONS` and `request.validity(effective_now(self.writer, self.clock), self.request_ttl_secs)` is not `"valid"`. Any other operation skips this row | `SEC-R07` | yes |
| 8 | A restore was activated since the request's epoch | `SEC-R19` | yes |
| 9 | `operation == "advice_apply"` and kill is engaged: a `safety_state` row with kind `kill`, scope `desk` and state `engaged` | `SEC-R20` | yes |
| 10 | Otherwise | `None` | — |

* **Row 4 runs before validity** (F-7). A retry of a committed cancel or close after 120 s returns its recorded result. A request whose first submission was refused has no row, so its retry is judged again: a refusal consumed nothing, as legacy consumes an owner command only at a send that passes (`src/core/framework/execution/sender.py:335-338`).
* **The epoch rule (rows 5 and 8).** `E` is the first `EPOCH_ACTIVATED` whose `epoch_id` is `request.epoch.value`. "Restored since" means some `EPOCH_ACTIVATED` has a non-null `restore` and either `E` is missing or its sequence is greater than `E`'s. A missing `E` with no restore anywhere is a request minted against another ledger: row 5. A missing `E` after a restore is a request from an epoch the backup never saw, which may have committed before the loss: row 8 (F-SEC12).
* **Time (row 7).** The kernel's ratchet, never moving back (`kernel/lifecycle.py:43-51`). Every answer but `"valid"` (`"domain"`, `"lifetime"`, `"expired"`) is `SEC-R07`. **Fork call (request lifetime: cancel and close only):**
  * 120 s, legacy's owner-command lifetime, applies only to `cancel` and `close`, the only actions legacy's owner command covered and timed (`src/core/framework/execution/owner_command.py:54`, `:58`, `:154-156`; `exposure.py:30-34`). The kernel checks it at admission and at dispatch, as legacy checked at the send (`sender.py:251-258`).
  * Kill release, hold release, latch unlock, pause clear, recovery, grants, bindings and attempt resolution had no lifetime in legacy (`deploy/at:4273-4280`, `:4364-4370`; `src/interfaces/console/api/routes/loss_latch.py:25-35`), and get none.
  * An `advice_apply` close or modify is not a legacy owner command and is not timed. It is refused until SLICE-09 in any case (`SEC-R22`, below).
* **One clock (F-4).** The request's `issued_at` is the kernel's `effective_now`, not the door's wall clock, so a request is issued and judged on one clock.
  * Step 5 builds the read on the kernel channel: a `now` request whose reply is `effective_now(writer, clock)`, with the epoch, as every reply carries it.
  * Step 6 composes the `Authorizer` with an operator-side clock. Its `now()` makes that read; its `elapsed()` is the operator process's own monotonic clock, which step 1's session lifetimes use.
  * The hand-off is step 1's `Authorizer(clock, …)` argument: no step 1 code changes.
  * The simulation passes `KernelNow(writer, clock)` (`bootstrap.py`, below). This narrows step 1's clock Deviation: both instants are the kernel's ratchet, separated only by the read's round trip.

#### What each entry point binds

The entry point computes its own target and args from its own arguments; nothing is read from the request but, for a close or an advice application, the subject that the call cannot name (below).

| Entry point (signature after step 2) | Operation | Target (account, subject) | Args | Decision recorded |
|---|---|---|---|---|
| `engage_kill(auth, reason)` | `kill_engage` | (None, None) | `{"reason": reason}` | `KILL_ENGAGED` |
| `release_kill(auth, reason)` | `kill_release` | (None, None) | `{"reason": reason}` | `KILL_RELEASED` |
| `engage_hold(auth, strategy, reason)`, `reason` new | `hold_engage` | (None, strategy) | `{"reason": reason}` | `HOLD_ENGAGED` |
| `release_hold(auth, strategy, released_reason, justification)` | `hold_release` | (None, strategy) | `{"released_reason": …, "justification": …}` | `HOLD_RELEASED` |
| `unlock_latch(auth, session_id, reason, *, strategy)`, `strategy` new | `latch_unlock` | (the session row's account, or None without a row; session_id) | `{"strategy": strategy, "reason": reason}` | `LOSS_LATCH_UNLOCKED` |
| `clear_pause(auth, pause_id, reason)` | `pause_clear` | (None, pause_id) | `{"reason": reason}` | `PAUSE_CLEARED` |
| `resolve_attempt(writer, authority, auth, command_key, attempt_no, legs, observation)` | `attempt_resolve` | (the command row's account, or None; command_key) | `{"attempt_no": attempt_no, "legs": L, "observation": wire(observation) or None when not an EvidenceRef}`, with `L` the legs rule below | `RESOLVED_REACHED` or `RESOLVED_NEVER_REACHED` |
| `advance(auth)` | `recovery_advance` | (None, None) | `{"step": "advance"}` | `RECOVERY_STAGE` |
| `record_fence(auth, evidence)` | `recovery_advance` | (None, evidence.old_host) | `{"step": "fence", "fence": the OLD_HOST_FENCED payload built at kernel/recovery.py:379-385}` | `OLD_HOST_FENCED` |
| `issue(auth, grant)` | `grant_admin` | (None, grant.grant_id) | `{"step": "issue", "grant": wire(grant)}` | `GRANT_ISSUED` |
| `revoke(auth, grant_id, reason)` | `grant_admin` | (None, grant_id) | `{"step": "revoke", "reason": reason}` | `GRANT_REVOKED` |
| `authorize_binding(auth, binding)` | `binding_authorize` | (binding.scope.account_id, binding.binding_id) | `{"step": "authorize", "binding": wire(binding)}` | `BINDING_AUTHORIZED` |
| `revoke_binding(auth, binding_id, reason)` | `binding_authorize` | (the binding row's account, or None; binding_id) | `{"step": "revoke", "reason": reason}` | `BINDING_REVOKED` |
| `admit_action(request, *, auth=None, reason=None)`: a cancel | `cancel` | (request.account, request.broker_order_id) | `{"action": action_wire(request), "reason": reason}` | `COMMAND_ADMITTED` |
| the same: a close | `advice_apply` when `auth.request` is set and its operation is `advice_apply`, else `close` | (request.account, S) | the same | `COMMAND_ADMITTED` |
| the same: a modify | `advice_apply` | (request.account, S) | the same | `COMMAND_ADMITTED` |

* **The subject `S` (R-2).** `S` is `auth.request.target.subject` when `auth.request` is not `None`, else `None`. The kernel never reads a missing request: with `None`, bind refuses at row 2.
* **The legs rule (R-11).** `L` is `{role: oid for role, oid in legs.items()}` when `legs` is a mapping whose keys are strings and whose values are strings or `None`; otherwise `L` is `None`. That makes the args always canonical, so `argument_digest` never raises on them. A `None` `L` that the request did not name is a digest mismatch (`SEC-R09`). The entry point's own guard then refuses malformed legs as today (`ADM-R01`, `kernel/lifecycle.py:515-516`).
* Every target is built with `target_of`, and every target and args pair fits step 1's `check_target` rows. A latch unlock's `strategy` is in args, as step 1 fixed. It is a confirmation, checked by `check_subject` (step 1's `check_target`, bind row 5) and recorded, and never used to refuse otherwise (below).
* `Coordinator.admit_action(request, *, auth=None, reason=None)` passes `reason` to `ActionAdmission.admit(request, auth, *, reason=None)`.
* The `reason` texts are bound as given. Each entry point keeps its own text guard (a non-empty string, `ADM-R01`), and `action_wire` keeps every field of the action. Legacy signed the reason with the action (`owner_command.py:90-96`).

#### The common flow of a human entry point

1. `bound = authority.bind(auth, operation, target, args)`. A `Replayed` or a `Refusal` is returned at once (re-wrapped by action admission).
2. The entry point's existing checks run in their existing order. Each `Refusal` it returns for a human with a request passes through `authority.refused(auth, refusal)` first. That includes the grant check, stage, malformed text, `LED-R05`, the fence rule and lease refusals, and the writer's `LED-R09` returned today (`kernel/safety.py:234-235`, `:356-357`; `kernel/lifecycle.py:538-539`). A non-human principal keeps today's refusals (for example `SES-R02` at `kernel/safety.py:213-214`).
3. The decision's events are the entry point's own, then `authority.request_drafts(auth, args, decision, command_key)`: one `OPERATOR_REQUEST`, last, in the **same transaction**. The record cannot miss an effect, nor exist without one. `Authority._record`, `Recovery._record`, `Recovery._advance_record`, `Safety._commit` and `Policy._transact` gain `extra: tuple[EventDraft, ...] = ()`, appended after their own drafts. `unlock_latch`, `resolve_attempt` and action admission append the draft inline.
4. **`Safety._commit` (R-9)** becomes `_commit(self, auth, use, kind, payload, texts, *, target, args, kill_reason=None)`. `use` is the operation name (`kill_engage`, `kill_release`, `hold_engage` or `hold_release`), passed to `bind` as the operation. `target` and `args` are the table's. `kill_reason` is passed only by `engage_kill`, as its `reason`.

#### The record (`kernel/authority.py`)

* `request_drafts(auth, args, decision, command_key=None) -> tuple[EventDraft, ...]` is empty unless the principal is human and carries a request. Otherwise it is one `EventDraft("OPERATOR_REQUEST", payload, auth.principal)`, with the payload `request.wire()` plus three fields:
  * `args`, so the digest can be recomputed from the ledger alone, as legacy's audit row described the whole command (`owner_command.py:82-87`);
  * `decision`;
  * `command_key`, which only action admission passes (its command's key). Every other entry point calls `request_drafts` without it, so the field is `None`.
* `refused(auth, refusal) -> Refusal` returns `refusal` unchanged in every case. It records `OPERATOR_REQUEST_REFUSED` with payload `{"request_id", "principal": [value, kind], "channel_identity", "operation": request.operation, "target": request.target.wire(), "code"}`, as its own decision of that kind, except:
  * it writes nothing when `auth` is `None`, the principal is not human, the request is `None`, or the code is `SES-R01` or `SEC-R10` (not attributable);
  * it writes nothing when the `operator_request_refused` table (migration 7, below) has the row `(request_id, code)`, read by primary key. **Bounded:** at most one per request and code, as legacy audited refused writes (`src/interfaces/console/routes.py:566`). How often a caller may submit at all is the door's rate limit, step 6's; the kernel bounds only what it writes;
  * a writer `Refusal` on that commit is not raised, and the original refusal is returned unrecorded: the row is evidence, and the door also logs it. `CommitFailed` propagates, as on every commit.

#### Action admission (`kernel/admission.py`)

`ActionAdmission.admit(request, auth=None, *, reason=None)`, in this order:

1. `auth = auth if auth is not None else c.authenticate(request.principal)`, moved first.
2. For a human `auth`:
   1. Operation and target from the table; `args = {"action": action_wire(request), "reason": reason}`.
   2. `bind`. A `Replayed` is returned with `outcome` filled. A `Refusal` is returned as `refused_outcome(key, Refusal(code, label, key, "COMMAND_ADMITTED"), "unchanged")`: bind recorded it, and no `ADMISSION_REFUSED` is written.
   3. A1, a missing command key: `LED-R01`, through `refused`.
   4. `reason` that is not a non-empty string: `ADM-R01`, recorded as today at check `A1` and through `refused`.
   5. The command key exists in `command_identity`: `SEC-R04`, through `refused` only, outcome `"unchanged"`. **Fork call (single use):** a new attempt is a new request with a new command, as legacy issues a fresh owner command per attempt and consumes it at the send (`owner_command.py:121`, `:157-169`; `sender.py:335-338`). A human therefore never reaches A1a's dispatch retry (`existing_or_retry`, `:201-227`). Only the kernel's own commands do.
   6. For operation `close`, the subject must be the entry's own order of that position. `order = holdings.order(request.account, subject)` is not `None`, `order.verb == "entry"`, `order.position_id == request.position_id`, and `not is_protective(order)`; otherwise `SEC-R09`, through `refused` only, outcome `"unchanged"`. **Fork call (a close names the entry's own order):** legacy refuses a close naming a protective leg and reads ownership of the exact ID at the send (`sender.py:260-270`).
   7. For operation `advice_apply` (F-1): with `ports.advice` `None`, the result is `SEC-R22`, through `refused` only, outcome `"unchanged"`. No advice record exists before SLICE-09, so no human close or modify may claim one. With an advice port composed, the action must equal the advice's action: `ports.advice.action(S, request.account) == action_wire(request)`, else `SEC-R09`, through `refused` only. SLICE-09 replaces the port with its ledger advice record: the advice ID must resolve to a recorded advice whose action wire equals `action_wire(request)`. Under kill, bind's `SEC-R20` (row 9) comes first.
3. For a non-human `auth`:
   1. `reason` must be `None` (`ValueError`), and A1 is unchanged.
   2. **A relay never acts for itself (F-2).** When `auth.principal` is in `c.authority.relays`, the result is `SEC-R10`, recorded as `ADMISSION_REFUSED` at check `A2` (`_CHECK_OF` gains `"SEC-R10": "A2"`). The operator process may relay a person's action and may never act as itself, whatever grant it is issued (`src/runtime/tier1_authority/service.py:270-277`).
4. Then today's flow: targets, `prot_key_check` (A1), A1a (now reached only by non-humans), A2, A4 and stage B. Each refusal for a human is recorded as today (`ADMISSION_REFUSED`) and through `refused`.
5. **The advice port.** `AdmissionPorts` (`kernel/ports.py:115-126`) gains `advice: object | None = None`, an `AdvicePort` with one method, `action(advice_id: str, account: AccountId) -> dict | None`: the advice's action in `action_wire` form, or `None` when unknown.
   * The simulation and every live composition leave it `None` until SLICE-09.
   * Only tests compose `FixtureAdvice` (`tests/conftest.py`), which maps an advice ID to the exact action it allows, so the existing human-modify tests keep exercising modify admission and dispatch.
6. The admission decision's events are `COMMAND_ADMITTED`, then the `OPERATOR_REQUEST` with `command_key` set. The action payload's `dependencies` gains `"operator_request"`: the request ID for a human, `None` otherwise. An entry's payload is unchanged; the recheck reads `dependencies.get("operator_request")`.

**Entries (F-2).** `EntryAdmission._a2` refuses `SEC-R09` in two cases. It is recorded at A2 (`_CHECK_OF` gains `"SEC-R09": "A2"`) and through `refused` (which writes only for a bound request):

* `auth.request` is not `None`: no operation names `entry`;
* the principal is `human` on path `owner_credential`, whatever the request: the owner never places an entry, bound or unbound (`Composition.owner_auth` included).

The simulation's injected test principal still enters through the disarmed table, on `operator_credential` and without a request.

**Fork call (no human entry door; no human modify door except advice application).** Legacy's owner command allows cancel and close only (`owner_command.py:35`, `:53-54`). In step 2 the kernel enforces the entry half and refuses every human modify not bound as `advice_apply` (`SEC-R09`). The advice half is **not yet** enforced by a link to real advice: until SLICE-09 composes the advice record, the kernel refuses every `advice_apply` (`SEC-R22`). The rule is therefore complete only when SLICE-09's check lands.

#### The latch unlock's strategy (`kernel/safety.py`)

After bind, `unlock_latch` keeps today's checks: non-human `SES-R02`; a missing session or an empty reason `ADM-R01`; then the `latch_unlock` grant check (`kernel/safety.py:348-351`).

* `strategy` is a **confirmation** (F-5). It passes `check_subject` (step 1's `check_target`, at bind row 5) and is recorded in the request's `args`. It is **never used to refuse otherwise**: no ledger query decides whether a strategy "belongs" to the session.
* The built standing binding names candidates, not strategies (`resources/migrations/002_sessions_authority.sql`). Only SLICE-09's candidate-to-strategy registry can say which strategies a binding covers. SLICE-09 may then add the check, as its own step, with the owner's review.
* Correction: `INTENT_SEEN` is recorded for every resolved intent at entry admission (`kernel/admission.py:729`), whatever the review policy. The earlier claim about `kernel/policy.py:199-200` was wrong. That line returns the application before `record_intent`, but admission recorded the intent already.

**Fork call (latch unlock by strategy), for the owner's review.** The owner unlocks by naming a strategy, as legacy does (`src/interfaces/console/api/routes/loss_latch.py:25-35`). Unlike legacy, the unlock lifts the **whole session's** latch, for every strategy on that account's session ([Q-028](../../decisions/owner-questions.md#q-028), SLICE-06's per-session latch). Legacy lifted one strategy's record for the day (`src/core/framework/execution/loss_latch.py:96-98`). Step 2 changes nothing in the latch itself.

#### Validity at dispatch (`kernel/authority.py`, `kernel/coordinator.py`)

* `recheck(grant_id, verb, account, *, request_id=None)`. When `request_id` is set, it is checked **before** the owner-root and built-in early return (`kernel/authority.py:156-157`):
  * no `operator_request` row: `SEC-R09`;
  * the row's `operation` is in `TIMED_OPERATIONS`, and either `effective_now(writer, clock).domain` differs from the row's `clock_domain` or `effective_now(...).utc_iso > row.valid_until`: `SEC-R07`.

  Any other recorded operation passes this check. The second rule is step 1's `validity` boundary: still valid at exactly 120 s.
* `_revalidate`'s row 3 (`kernel/coordinator.py:283-286`) passes `request_id=deps.get("operator_request")`. It names the dependency `"request"` for `SEC-R07` and `SEC-R09`, else `"grant"`.
* `_refuse_dispatch` records `DISPATCH_REFUSED`, so the command ends `REFUSED` and its reservation, if any, is released. A human action holds none (`reservation_id` is `None` at `kernel/admission.py:597`). F-SEC10's "reservation released" is therefore checked as "no reservation row, command `REFUSED`, nothing sent".

#### The kill-input exemption (`kernel/authority.py`, `kernel/safety.py`)

* `BUILTIN["kernel:safety"] = frozenset({"kill_engage"})`.
* `KILL_INPUT_REASONS = ("kill_file", "kill_flag")` in `kernel/safety.py`.
* `Safety._authorized(auth, use, *, kill_reason=None)` gains one case, before its human-only refusal. When `auth.principal == SAFETY`, `auth.path == "in_process"`, `use == "kill_engage"` and `kill_reason in KILL_INPUT_REASONS`, it returns `authority.check("kill_engage", auth, None)`'s refusal or `None`. Every other non-human call keeps `SES-R02`, `kernel:safety` with any other reason included. `engage_kill` passes `kill_reason=reason`; no other entry point passes it.
* `kernel:safety` never holds `kill_release`, so `release_kill` by it is `SES-R02`. The stage table already allows `kill_engage` in `RECOVERY_WRITING` and `OPERATING` (`kernel/authority.py:31-38`), so the input check works before `OPERATING`. This only restricts. Step 4 calls it, and records a kill input present at start as `KILL_ENGAGED` by `kernel:safety` in `RECOVERY_WRITING`, before the advance to `OPERATING`.

#### Ledger: migration 7 and the fold

* `resources/migrations/007_security.sql` (tree delta T-67; 7 is the next free number at `c2cca11`, after `001`…`006`):

  ```sql
  CREATE TABLE operator_request (request_id TEXT PRIMARY KEY, confirmation_id TEXT, argument_digest TEXT NOT NULL,
    operation TEXT NOT NULL, decision TEXT NOT NULL, command_key TEXT, valid_until TEXT NOT NULL,
    clock_domain TEXT NOT NULL, sequence INTEGER NOT NULL);
  CREATE UNIQUE INDEX operator_request_confirmation ON operator_request(confirmation_id) WHERE confirmation_id IS NOT NULL;
  CREATE UNIQUE INDEX operator_request_command ON operator_request(command_key) WHERE command_key IS NOT NULL;
  CREATE TABLE operator_request_refused (request_id TEXT NOT NULL, code TEXT NOT NULL, sequence INTEGER NOT NULL,
    PRIMARY KEY (request_id, code));
  ```

  `kernel/ledger/schema.py` gains `Migration(7, "security", "007_security.sql")`. If another slice lands a migration 7 first, this one takes the next free number and the file is renamed; nothing else changes.
* `resources/events.schema.json` gains:
  * `OPERATOR_REQUEST`: `request_id`, `epoch`, `channel`, `channel_identity`, `operation`, `argument_digest`, `issued_at`, `valid_until`, `clock_domain` and `decision` (each `"string"`); `principal` `"array"`; `via` `["array", "null"]`; `target` and `args` `"object"`; `confirmation_id` and `command_key` `["string", "null"]`.
  * `OPERATOR_REQUEST_REFUSED`: `request_id`, `channel_identity`, `operation` and `code` (`"string"`); `principal` `"array"`; `target` `"object"`.
* `kernel/ledger/store.py`:
  * `_FAMILY` maps both kinds to `"authority"`.
  * `_PK["operator_request"] = ("request_id",)` and `_PK["operator_request_refused"] = ("request_id", "code")`.
  * `_load_touched` gains two branches, before its command branch:
    * `OPERATOR_REQUEST` loads `operator_request` rows with `request_id = ? OR confirmation_id = ? OR command_key = ?`;
    * `OPERATOR_REQUEST_REFUSED` loads the `operator_request_refused` row with `request_id = ? AND code = ?`.
* `kernel/ledger/projections.py`:
  * `TABLES` gains `"operator_request"` and `"operator_request_refused"`. `_NO_ROWS` is unchanged.
  * The fold of `OPERATOR_REQUEST` raises `TransitionNotAllowed` (the writer's `LED-R09`) when the `request_id` exists, or when a set `confirmation_id` or `command_key` is held by another row. Otherwise it writes the row from the payload, with `sequence` the event's.
  * The fold of `OPERATOR_REQUEST_REFUSED` raises `TransitionNotAllowed` when `(request_id, code)` exists, else writes `{request_id, code, sequence}`.

  These are backstops: `bind` and admission refuse first.

#### Contracts (`contracts/identity.py`)

* `OperatorRequest.wire() -> dict` returns `{"request_id", "epoch": epoch.value, "channel", "channel_identity", "principal": [value, kind], "via": [value, kind] | None, "operation", "target": target.wire(), "argument_digest", "confirmation_id", "issued_at": utc_iso, "valid_until": utc_iso, "clock_domain": issued_at.domain}`.
* `operator_request_from_wire(obj) -> OperatorRequest` raises `ValueError` on any other key set or value. Construction checks the rest. Step 5's channel and the crash tests use it.

#### Settings (`settings/schema.py`, `settings/loader.py`)

* `Settings` gains three refusing fields, each `None` by default:
  * `request_ttl_secs`, read by the kernel and the operator process: 120, legacy's (`owner_command.py:58`);
  * `session_ttl_secs` and `sessions_per_identity`, read by the operator process and the simulation's stand-in. Values are bound per release in step 6; no money effect.
* The loader gains `_SECURITY` rows, read like `_ADMISSION`'s: section `interfaces`, names as the fields, environment names `AT_REQUEST_TTL_SECS`, `AT_SESSION_TTL_SECS` and `AT_SESSIONS_PER_IDENTITY`, kind `int`. `resources/defaults.yaml` gains nothing: no shipped value.

#### The composition (`bootstrap.py`)

* `SIM_RELAY = Principal("svc:operator-sim", "service")` is the simulation's operator process, labelled synthetic.
* `compose_simulation(…, principals: Mapping[str, MapEntry] | None = None)`:
  * after its existing refusals, it raises `RefusingParameterUnbound` for `interfaces.request_ttl_secs`, then `interfaces.session_ttl_secs`, then `interfaces.sessions_per_identity` when unbound;
  * it builds `Authority(…, request_ttl_secs=settings.request_ttl_secs, relays=frozenset({SIM_RELAY}))`;
  * `KernelNow(writer, clock)`, a small class in `bootstrap.py`, is the simulation's stand-in for step 5's `now` read. Its `now()` is `effective_now(writer, clock)` and its `elapsed()` is `clock.elapsed()`;
  * inside its `try`, after the writer opens, it builds `Authorizer(KernelNow(writer, clock), owner=owner, principals=principals or {}, doors=LEGACY_DOORS, epoch=writer.epoch, via=SIM_RELAY, request_ttl_secs=…, session_ttl_secs=…, sessions_per_identity=…)`. A bad map raises `ValueError` and closes the writer.
* `Composition` gains `authorizer` and `relay_peer` (`SIM_RELAY`). It also gains `relay(request, path) -> Authenticated | Refusal`: `accept_relay(relay_peer, frozenset({relay_peer}), owner, request.principal, path)`, then the constructor in the table above.
* `operator_call(comp, evidence, operation, target, args, *, nonce, named=None, typed=None) -> Authenticated | Refusal`, a module function, is the simulation's door:
  1. `authenticate(evidence)`;
  2. `open_session`, with `csrf` the session's own token;
  3. `prepare`, when the door rule for `(caller.channel, operation)` asks a confirmation, then `execute` with that challenge, `typed` and `nonce`; otherwise `execute` alone;
  4. `end_session`;
  5. `comp.relay(request, caller.path)`.

  Any `Refusal` is returned. It never types on the person's behalf: `typed` is the caller's.
* **In place of the disarmed table.** Every human entry point is now reached only through step 1's `Authorizer` and the relay. The table (`bootstrap.py:91-100`) stays only as the simulation's stand-in for step 5's channel, for the injected test principals: never the owner, never in-process, never with a request. A human it names therefore passes no human entry point (`SEC-R09`), and still submits the SLICE-04…07 entries.
* Only `bootstrap.py` and `operations/verification.py` import `interfaces.authorization`; no `kernel/` module does. A live kernel composition (SLICE-11) composes no `Authorizer`.

`operations/verification.py` composes with:

* `principals={"uid:0": MapEntry(Principal("owner", "human"), None)}`;
* the three settings as labelled synthetic measurement values: 120 (legacy), 900 and 1.

Its owner advance and grant issue go through `operator_call(comp, CliEvidence(0, 1, None), …)` with nonces `nonce-measure-advance-0001` and `nonce-measure-issue-00001`. It raises `RuntimeError` naming any `Refusal`, where today it ignores the results (`operations/verification.py:42-45`).

#### The test fixture (`tests/conftest.py`)

All values are labelled synthetic.

* `SECURITY_SETTINGS = dict(request_ttl_secs=120, session_ttl_secs=900, sessions_per_identity=2)`, legacy's 120 and step 1's synthetic 900 and 2. `build` passes it into `Settings`, and `principals=SIM_PRINCIPALS`.
* `SIM_PRINCIPALS`:

  | Key | Principal | Accounts |
  |---|---|---|
  | `uid:1001` | `OWNER` | None |
  | `uid:1002` | `TEST_PRINCIPAL` | `{ACCT, ACCT_2}` |
  | `uid:1003` | `Principal("ops", "human")` | `{ACCT}` |
  | `uid:1004` | `Principal("deputy", "human")` | `{ACCT}` |
  | `proxy:synthetic-test@example.test` | `TEST_PRINCIPAL` | `{ACCT, ACCT_2}` |

* `operator_auth(comp, operation, target, args, *, principal=OWNER, channel=None, nonce=None, typed=None, named=None) -> Authenticated | Refusal` calls `operator_call`:
  * `channel` defaults to `owner-api` for `advice_apply` and to `owner-cli` otherwise;
  * the evidence is `CliEvidence(uid, 4242, None)` for the principal's `uid:` key on `owner-cli`. On `owner-api` it is `ApiEvidence("loopback", None, "console-sim")` for the owner, and `ApiEvidence("proxy", "synthetic-test@example.test", "console-sim")` for `TEST_PRINCIPAL`;
  * `nonce` defaults to `"nonce-fixture-" + uuid4().hex`, so a reopened ledger never meets a fixture nonce from another process;
  * `named` defaults to `args.get("strategy")` for `latch_unlock`;
  * `typed` defaults to the door rule's expected text: the literal, `target.subject`, or `named`. That is the test acting as the person; a test of a confirmation passes its own.
* `action_auth(comp, request, *, subject=None, operation=None, reason="synthetic reason", nonce=None, channel=None)` binds an action with `principal=request.principal`. The operation defaults to `cancel`, `close` or `advice_apply` by verb. The subject defaults to the broker order ID for a cancel, `"E1"` for a close, and `"advice-synthetic-1"` for a modify. The args are the table's.
* `make_entry_order(**changes)`: an `OwnedOrder` with `broker_order_id="E1"`, `command_key="k-entry"`, `verb="entry"`, `leg_role="primary"`, `side="BUY"`, `order_kind="market"`, `position_id=POSITION`, `managed_by_protection=False`, and the other fields as `make_owned_order`'s. `action_world` (fixture holdings) adds it to its holdings, so a human close can name the entry's own order.
* **`owned_close` (R-1)** gains `subject: str | None = None`, the order the bound close names. It binds its close with `action_auth(…, subject=subject or "E1")`. Its branches:
  * **A ledger position** (a `str` `position`, worlds with `kernel_positions`): the position's entry is already in the ledger (`filled_entry` and `loop_filled_entry` acknowledge `k-entry` as `E1`), and `subject` defaults to `"E1"`.
  * **A fixture position in a kernel-holdings world** (`kernel_holdings=True`, where orders come from `LedgerHoldings`): with `subject` `None`, it first admits entry `k-entry` (`world.request(make_intent(), "k-entry")`), acknowledged as `E1` (a step `{"result": "ack", "order_id": "E1"}` appended before the close's), and dispatches it. It then seeds the fixture position as `make_owned_position(position_id=position_id("k-entry", "primary"))`, so `LedgerHoldings.order(ACCT, "E1")` is that position's entry order (`kernel/admission.py:275-281`). With `subject` given, the caller's own entry and position are used unchanged.
* `FixtureAdvice(entries: dict[str, dict])`, an `AdvicePort` whose `action(advice_id, account)` returns `entries.get(advice_id)`. `admission_ports(…, advice=None)` passes it through; `action_auth` for a modify registers nothing by itself.
* `RESTORE = RestoreMarker("backup-2026-11-01", "old-host")` moves here from `tests/recovery/test_restore_fencing.py:35` (R-7), which imports it, so the crash child can use it too.
* `prepare` advances with `operator_auth(comp, "recovery_advance", OperatorTarget(None, None), {"step": "advance"})` and issues `g-test` with `operator_auth(comp, "grant_admin", OperatorTarget(None, "g-test"), {"step": "issue", "grant": wire(test_grant())})`. `open_admission_world` and `action_world` bind their binding and grant calls the same way.
* `FRESH` becomes: `EPOCH_ACTIVATED`; one `MIGRATION_APPLIED` per migration; `RUNTIME_OPENED`; `RELEASE_BOUND`; `RECOVERY_STAGE` twice; `OPERATOR_REQUEST`; `GRANT_ISSUED`; `OPERATOR_REQUEST`.

**Existing tests that change.** Each file in the Files table marked "existing" changes in one of these ways only; no other expectation changes.

* Every call of a human entry point takes its `auth` from `operator_auth` or `action_auth`, with the original principal, so the original expected code is kept. For example, `OPERATOR` keeps `SES-R05` in `test_delegation`, `OPS` keeps `SES-R02` in `test_a2_before_a4`, and `TEST_PRINCIPAL` keeps `SES-R02` in `test_only_recovery_advance_holder_fences`.
* Every other `Authenticated(...)` states `request=None, via=None`. `tests/recovery/test_restore_fencing.py:134` passes `request_ttl_secs=120` to `Authority`.
* **Every changed kind list or count** (a search for every kind-list equality in `tests/` at `c2cca11`):
  * `FRESH` in `tests/conftest.py`, as above. Every list built on it follows unchanged: `BOOT` in `tests/recovery/test_crash_boundaries.py:63`, `:76`, `:86`, `:95`, `:108`, `:116` and `:149`, and `tests/integration/test_entry_outcomes.py:38`.
  * `tests/unit/test_authority_grants.py:147`: the last four kinds are `COMMAND_ADMITTED`, `GRANT_REVOKED`, `OPERATOR_REQUEST`, `DISPATCH_REFUSED`.
  * `tests/recovery/test_restore_fencing.py:114` (`test_reader_impact_measured`): `2 + len(schema.MIGRATIONS) + 5 + 3 * 50` events.
  * The session-kind lists (`tests/recovery/test_session_transitions.py`) and the before-and-after comparisons (`tests/integration/test_shared_engine.py:61`, `tests/integration/test_reconciliation_commits.py:98`) filter or compare within one test and do not change.
* **R-1's entry `k-entry` adds no checked kind list.** None of the nine tests that call `owned_close` in a kernel-holdings world compares a kind list: `tests/integration/test_dispatch_revalidation.py:341`, `:357`, `:381`, `:390`, `:401` and `tests/unit/test_admission_checks.py:678`, `:692`, `:700`, `:730`. Two of them change:
  * `test_ledger_holdings_rows` (`tests/unit/test_admission_checks.py:673-686`) already acknowledges its own entry `k-e` as `E1`. It passes `subject="E1"` and `position=make_owned_position(position_id=position_id("k-e", "primary"))`, and its close assertion (`:685`) expects that position ID in place of `POSITION`.
  * `test_row_6_refuses_a_close_of_a_position_observed_at_zero` (`tests/integration/test_dispatch_revalidation.py:365-376`) closes a fixture position `p-1` without `owned_close`. It gains an admitted `k-entry` acknowledged as `E1`, and uses `position_id("k-entry", "primary")` in place of `p-1`.
* **A human modify is an advice application** (F-1).
  * With no advice port it is `SEC-R22`. Every existing human-modify test therefore composes `FixtureAdvice` with the exact action of each modify (`advice-synthetic-<key>` → `action_wire(modify)`) and binds it as `advice_apply` on the owner API's proxy. That covers `tests/integration/test_verb_completion.py:74`, `tests/integration/test_dispatch_revalidation.py:343`, `:554`, `:558`, `tests/integration/test_reconciliation_commits.py:227`, `tests/unit/test_admission_checks.py:371`, `:821`, and `tests/unit/test_protection_loop.py:306`, `:660`.
  * Under kill, bind refuses it `SEC-R20` before admission's `SEC-R22`, where today A4 refuses `PRT-R01`, and it writes no `ADMISSION_REFUSED`. In `test_kill_row` the modify row expects `SEC-R20` and `records(world)` has four rows.
* `engage_hold` calls pass a reason. `unlock_latch` calls pass `strategy="buyer_edge"` as a confirmation only. **R-4 is moot under F-5:** no entry is inserted in any latch world, so no count downstream changes.
* Human closes in fixture-holdings worlds name `E1`; in ledger-position worlds they name the entry's acknowledged order ID (`E1` from `filled_entry`).

#### Fork calls and deviations in this step

* **Fork calls**, each named where it applies above:
  * request lifetime, for cancel and close only;
  * single use;
  * a close names the entry's own order;
  * latch unlock by strategy, which lifts the whole session's latch;
  * no human entry door, and no human modify door except advice application. Advice application is refused (`SEC-R22`) until SLICE-09.

  Advice under kill (`SEC-R20`) is the slice's existing Fork call, made by bind.
* **Deviation — for owner review: binding for every privileged operation (F-4).** This step's wording supersedes the slice-level "Deviation — binding for every privileged operation" above, for these operations. Legacy bound only cancel and close (`owner_command.py:53-54`). Kill release, hold release and latch unlock carried no request: a typed prompt on the host (`deploy/at:4273-4280`, `:4364-4370`; `scripts/loss_latch.py:60-75`), and the console route's reachability and CSRF check (`src/interfaces/console/api/routes/loss_latch.py:25-35`). They now carry a bound request, with these **new refusal paths**. None of them fires on the owner's fresh, valid request through the CLI or the console, and none of them times out:

  | Refusal | Fires for kill release, hold release or latch unlock only when |
  |---|---|
  | `SEC-R09`, no request | The call reaches the kernel without a request: never from a door, only by bypassing the operator process |
  | `SEC-R10` | The relay asserts another principal than the request's, comes from another peer than the request names, or puts a delegate on the loopback identity: a forged or foreign relay |
  | `SEC-R09`, unbound | The request names another operation, target or argument than the call: for kill release, another reason; for hold release, another strategy, released reason or justification; for unlock, another session, strategy or reason. Or the request comes from another ledger. A door bug or a forged request |
  | `SEC-R04` | A request ID already recorded is sent again for a different action: a replayed nonce on a new action |
  | `SEC-R08` | A confirmation already used by another committed request is used again: one typed `DISENGAGE` or strategy ID authorises one release or unlock |
  | `SEC-R19` | A request made before a restore is sent after it, and the restored ledger does not hold it |

  The same request sent again, at any age, is not refused: it returns the first result (`Replayed`). For kill release the release still also needs `kill_release` and, from step 4, no kill input present (`SEC-R16`), as legacy stays engaged while the file exists.
* **Deviation — replay after the lifetime.** Legacy refuses an owner command older than 120 s, and its key dies with the process (`owner_command.py:27-29`, `:154-156`). A retry of a committed request, at any age, returns the recorded result flagged `replayed`, with no effect. Nothing moves twice either way; the caller learns the outcome instead of guessing.
* **Deviation — the hold engage reason.** `hold_engage` is new (R-12). Its reason is bound and kept in the request's `args`; `HOLD_ENGAGED`'s payload is unchanged.
* **Deviation — an unauthenticated pause clear.** It refuses `SES-R01` from bind, where today it is `SES-R02` (`kernel/policy.py:219-220`). Both refuse; a service principal keeps `SES-R02`.
* No score, threshold or money value is set. 120 is legacy's lifetime; 900, 2 and 1 are synthetic session values with no money effect.

#### What later steps take from step 2

* **Step 4:** the kill-input check builds `Authenticated(SAFETY, "in_process", request=None, via=None)` and calls `engage_kill` with `kill_file` or `kill_flag`. At start it records a present input in `RECOVERY_WRITING`, before the advance to `OPERATING`. It adds its file to both guards. `SEC-R16` goes in `release_kill` after bind.
* **Step 5:**
  * The channel builds a relayed human's `Authenticated` from `accept_relay` and `operator_request_from_wire`, and a service's with `request=None, via=None`.
  * It binds `Authority.relays` from `channel.relays` and serves the `now` read (`effective_now`) that issues every request.
  * It adds `adapters/unix_channel.py` to both guards and puts `replayed: true` on a `Replayed` reply.
* **Step 6:**
  * The operator process gives the `Authorizer` a clock whose `now()` is step 5's read.
  * The doors map each `at` command and route to this step's target and args table: the hold engage `--reason`, the latch's `strategy` (a confirmation), and a close naming the entry's own order ID.
  * The doors own the submission rate limit, and call `consumed` on a committed or replayed reply, or on `SEC-R08`.
* **Step 7:** the advice route binds `advice_apply` with the advice ID as subject. It answers `SEC-R22` until SLICE-09.
* **SLICE-09:** composes the advice record in place of the `None` advice port: the advice ID must resolve to a ledger advice record whose action wire equals `action_wire(request)`. It may also add the latch unlock's strategy check, from its candidate registry, for the owner's review.

### Tests

`tests/unit/test_authority_grants.py` (T-07) gains PRF-SEC-03's groups, and `tests/recovery/test_crash_boundaries.py` gains CP-SEC1 and F-SEC12. Every identity, nonce, reason, account and duration is labelled synthetic. Every expectation is written by hand from the rules above. Each hex value is the SHA-256 of the hand-written canonical text beside it, computed at deepening.

The synthetic values:

* the clock starts at `START`, `2026-11-02T09:15:00.000000Z` (recorded);
* principals and map: `SIM_PRINCIPALS`; the relay `SIM_RELAY`; reason `"synthetic reason"`; `OFF = bound(ai_mode="off", review_required=False)`;
* request IDs:
  * `[["owner","human"],"uid:1001","nonce-synthetic-000000001"]` → `ed0b426a2765d08d4315c3d2b062fe10240976a3570a792a95c1b86ad1467d15`;
  * `…"nonce-synthetic-000000002"]` (the owner) → `5f2985dc1ffa5264b4dcfffbf736848d522e33da07265f2ccff11145842d3ece`;
  * `[["test-principal","human"],"uid:1002","nonce-synthetic-000000003"]` → `100478e18706a4c397b18946fd08e6891db248caeb115634a8fb487b575e7541`;
* digests:
  * `["operator-request/1","kill_engage",{"account":null,"subject":null},{"reason":"synthetic reason"}]` → `572cc58e9df728c9497437d14fd6cea8a2edc5a07bc739c2ab598ba96eb4a896`;
  * the same with `"other reason"` → `d45e6d07585d857184179a77356db40e583dc78a0acb1bbb197dc50161aa5090`;
  * `["operator-request/1","cancel",{"account":["sim","acct-sim"],"subject":"o-stop"},{"action":{"account":["sim","acct-sim"],"broker_order_id":"o-stop","command_key":"k-c1","verb":"cancel"},"reason":"synthetic reason"}]` → `762969166b948ce93385f0c18895a21cc49aaf91c64e971a61730c6a09f932c0`;
  * `["operator-request/1","grant_admin",{"account":null,"subject":"g-cpsec1"},{"grant":{"accounts":[["sim","acct-sim"]],"actions":["entry"],"delegation_limit":0,"grant_id":"g-cpsec1","parent_grant_id":null,"principal":["test-principal","human"],"valid_from":"2026-11-01T00:00:00.000000Z","valid_until":null},"step":"issue"}]` → `ca560b9a0a96f3495e294f305458731ebae975c0880592a7d61c43eb008e51ca`.

A "mismatch request" is a case's good request with one field replaced (operation, target or args), its digest recomputed over the replaced field so the request is self-consistent, and its `request_id` replaced by that of a fresh nonce. The kernel cannot tell it from a minted one; only its own recomputation can refuse it.

| Group | Cases |
|---|---|
| Types | `Authenticated` raises `ValueError` for: a `dict` as `request`; a `human` `via`; `Principal("kernel:protection", "kernel")` with a request; a `service` principal with a `via`. Omitting `request` or `via` raises `TypeError`. `operator_request_from_wire(request.wire())` equals the minted kill request; an extra key, a missing key, and an account of three items each raise `ValueError`. `Authority(…, request_ttl_secs=0)` and `True` raise `ValueError`, as do `relays` holding a `human` principal and `relays` given as a list. Boundary, parsed with `ast`: no `kernel/` module imports `autonomous_trading.interfaces`. `BUILTIN["kernel:safety"] == frozenset({"kill_engage"})`; `TIMED_OPERATIONS == ("cancel", "close")` |
| Binding | 16 cases, one per entry point and three for actions. The world is `action_world(ACK, policy=OFF)` for every case but fence and advance, which use `simulation([], advance=False, grant=False)` (stage `RECOVERY_WRITING`). There the fence is recorded **first**, then the advance (R-10): after the advance the stage is `OPERATING` and a fence is `SES-R09`. Each case runs its refusals before its good call. (a) Its unbound call (the table's or `owner_auth`): `SEC-R09`, nothing recorded. (b) A mismatch request with operation `pause_clear` (`kill_engage` for the pause case). (c) A mismatch request with subject `synthetic-other`. (d) A mismatch request with `"other reason"`, or, for args without a reason, a changed `step`, `grant_id` or `attempt_no`. Each of (b)–(d) is `SEC-R09`, recorded once. For the close, (c) reaches bind with the request's own subject and is refused `SEC-R09` by the close-subject rule, recorded once. **The modify case has no (c) (R-3):** its subject is the request's own, so no mismatch is possible. The good calls: kill engage, then release (`DISENGAGE` typed); hold engage and release of `buyer_edge` (`released_reason` `operator`, `justification` `synthetic justification`); grant `g-bind` issue and revoke; binding `b-bind` (SCOPE, `POLICY_ID`, `(CANDIDATE,)`, 2026-11-01 to 2026-11-30) authorize and revoke; the fence for `old-host`, then the advance. Each commits its decision. The latch unlock (`SESSION`, strategy `buyer_edge`, no entry needed) is `LED-R09` (not tripped), recorded, which proves bind passed. The pause clear of `pause-synthetic` is `LED-R09`, recorded. `resolve_attempt` on `k-none` (attempt 1, legs `{"primary": None}`, observation `EvidenceRef("simulated", "c" * 64, Timestamp(START, "recorded"))`) is `DOM-R04`, recorded. Cancel `k-c1` of `o-stop` and close `k-x1` naming `E1` (both `TEST_PRINCIPAL` on the CLI, typed) are each `COMMAND_ADMITTED`. Modify `k-m1` (trigger `11.00`, advice `advice-synthetic-1` on the owner API proxy, no advice port) is `SEC-R22`, recorded, which proves bind passed |
| Record | In the Binding world, every committed decision's last event is `OPERATOR_REQUEST`, with the same `transaction_id` as the decision's first event. For each record, `argument_digest(operation, target, args)` recomputed from the payload equals its `argument_digest`. Each `operator_request` row equals its payload's fields plus the event's sequence, and `writer.check_index()` is empty. The owner's kill engage with nonce `nonce-synthetic-000000001` at `START` has exactly this payload: `request_id` `ed0b42…7d15`; `epoch` the writer's; `channel` `owner-cli`; `channel_identity` `uid:1001`; `principal` `["owner","human"]`; `via` `["svc:operator-sim","service"]`; `operation` `kill_engage`; `target` `{"account":null,"subject":null}`; `argument_digest` `572cc5…a896`; `confirmation_id` null; `issued_at` `2026-11-02T09:15:00.000000Z`; `valid_until` `2026-11-02T09:17:00.000000Z`; `clock_domain` `recorded`; `args` `{"reason":"synthetic reason"}`; `decision` `KILL_ENGAGED`; `command_key` null. Cancel `k-c1` with nonce `…003` records `request_id` `100478…7541`, `argument_digest` `762969…32c0` and `command_key` `k-c1`, and its `COMMAND_ADMITTED.dependencies.operator_request` is `100478…7541`; the protection loop's commands carry `null`. Every record whose `decision` is not `COMMAND_ADMITTED` has `command_key` null (F-7). Every `operator_request_refused` row matches one `OPERATOR_REQUEST_REFUSED` event |
| Replay | In `action_world`: the kill engage above commits. The same call with the same request returns `Replayed(ed0b42…7d15, "KILL_ENGAGED", s, None)`, where `s` is its `OPERATOR_REQUEST` sequence, and the event count does not change. A request minted again in a new session with the same nonce is equal, and is replayed. The same request with reason `"other reason"` (the call's digest `d45e6d…5090` differs) is `SEC-R04`; twice gives one `OPERATOR_REQUEST_REFUSED`. After 300,000 ms the same call is still `Replayed`. The cancel `k-c1`, submitted again with its request, is `Replayed` with `outcome.effect == "not_sent"` and the command's key. After 300,000 ms more (with `fresh()`), the cancel is **still** `Replayed`, not `SEC-R07`: a timed operation's lookup runs before its lifetime |
| Confirmations | The owner engages kill. In one CLI session: `prepare` `kill_release`, then `execute` twice with `DISENGAGE` and nonces `…010` and `…011` (no `consumed` between). That gives two requests with one `confirmation_id`. The first commits `KILL_RELEASED`. The second is `SEC-R08`, recorded, not `LED-R09`. Writing the second request's `OPERATOR_REQUEST` through `writer.transact` directly gives `LED-R09` (the fold's backstop) |
| Validity | `action_world`, `TEST_PRINCIPAL`'s cancels of `o-stop` (keys `k-v1`…`k-v6`), with `fresh()` after every clock move so admission's own freshness never decides. **Timed:** `k-v1` minted at `START` and submitted at +120,000 ms: admitted. `k-v2` minted at `START`, submitted at +120,001 ms: `SEC-R07`, recorded. A request whose `valid_until` is +121 s (with a fresh `request_id`): `SEC-R07` ("lifetime"). A request in the `wall` domain: `SEC-R07` ("domain"). **Not timed (F-3):** the owner's kill engage minted at `START` and submitted at +300,000 ms commits. So does a pause clear: `LED-R09`, not `SEC-R07`. **One clock (F-4):** the clock advances 121,000 ms and a bound hold engage commits, so an event exists at 09:17:01. Then `jump_wall(-300_000)` sets the wall to 09:12:01. `k-v3` minted now has `issued_at` `2026-11-02T09:17:01.000000Z`, the kernel's ratchet and not the wall, and is admitted. Built on the raw wall it would be 300 s old and refused. **Ratchet:** `k-v4` minted at 09:15:00, before the event; after the same jump it is `SEC-R07`, though the wall reading alone would leave it valid |
| Relay | All `SEC-R10`, and none recorded: the owner's request with `Authenticated(TEST_PRINCIPAL, "operator_credential", …)`; with `via` `Principal("svc:other", "service")`; with `via=None`. A hand-built pause-clear request for `TEST_PRINCIPAL` with `channel_identity` `owner-api:local`, relayed on `operator_credential`. Its proxy twin (`owner-proxy:` fingerprint) passes bind |
| Restore | Composition A at the ledger. The owner mints R (nonce `…006`, issue `g-restore`) without submitting it. A shuts down. B composes on the same file with `restore=RESTORE` and `confirm_grant=lambda row: True`, then records a fence for `old-host` **first** and advances **second** (R-10), both bound. R through `B.relay` is `SEC-R19`, recorded once, and `g-restore` does not exist. In-memory twin: a request minted by composition C on another ledger file (nonce `…007`), submitted to a fresh composition with no restore, is `SEC-R09` (unknown epoch) |
| Advice | **No advice port** (`action_world`): modify `k-m1` and close `k-x2` bound as `advice_apply` (`advice-synthetic-1`) are each `SEC-R22`, recorded, outcome `"unchanged"`. Modify `k-m2` bound as `close` (subject `o-stop`): `SEC-R09`. **With `FixtureAdvice({"advice-synthetic-1": action_wire(k-m3)})`:** modify `k-m3` bound with that advice ID is admitted. Modify `k-m4` with the same advice ID, a different trigger, is `SEC-R09`. An unknown advice ID is `SEC-R09`. **Under kill**, with the port: the owner engages kill; close `k-x1` bound as `close` (`E1`) is admitted; modify `k-m5` bound as `advice_apply` (registered) is `SEC-R20`, recorded, before any `SEC-R22` |
| Latch | `admission_world(policy=OFF)`, with no entry. `strategy` is a confirmation only (F-5). Unlock `SESSION` with `strategy="buyer_edge"`: `LED-R09`, recorded. With `strategy="other_strategy"`, bound with that strategy: also `LED-R09`, never `SEC-R09`. Bound with `buyer_edge` but called with `other_strategy`: `SEC-R09` (digest). `strategy=" x"`: `ValueError` at the door (step 1's `check_target`). A hand-built request carrying it is `SEC-R09` (bind row 5). The unknown session `sim:acct-sim:NSE-FO-sim:2026-11-03`, bound to `ACCT`: `SEC-R09` (target) |
| Actions | `action_world`. Cancel `k-c1` (nonce `…003`): admitted, as in Record. A new request (nonce `…004`) for the same `k-c1`: `SEC-R04`, recorded, outcome `"unchanged"`, and no `ADMISSION_REFUSED`. Close `k-x3` naming `o-stop` (a protective leg): `SEC-R09`; naming `E1`: admitted. Cancel `k-c5` with `reason=None`: `ADM-R01`, with one `ADMISSION_REFUSED` (check `A1`) and one `OPERATOR_REQUEST_REFUSED`. `kernel:protection` with `reason="x"`: `ValueError`. **A relay acting for itself (F-2):** the owner issues `SIM_RELAY` a grant with `cancel` on `ACCT`; cancel `k-c6` with principal `SIM_RELAY` and `Authenticated(SIM_RELAY, "local_channel", request=None, via=None)` is `SEC-R10`, with `ADMISSION_REFUSED` check `A2` and no `OPERATOR_REQUEST_REFUSED`. The same cancel by a service principal outside `relays` with the same grant is admitted |
| Entry | `admission_world(policy=OFF)`. Entry `k-e1` by `TEST_PRINCIPAL` with a bound pause-clear `auth`: `SEC-R09`, with `ADMISSION_REFUSED` check `A2` and one `OPERATOR_REQUEST_REFUSED`. **The owner never enters (F-2):** entry `k-e3` with principal `OWNER` and `Composition.owner_auth` (no request) is `SEC-R09` at A2, with no `OPERATOR_REQUEST_REFUSED`; with a bound owner `auth` it is `SEC-R09`, recorded. Entry `k-e2` through the table: admitted |
| Settings (`tests/unit/test_policy_parameters.py`, R-8) | `compose_simulation` with every other setting bound: `request_ttl_secs` unbound raises `RefusingParameterUnbound("interfaces.request_ttl_secs")`; then `session_ttl_secs` (`interfaces.session_ttl_secs`); then `sessions_per_identity` (`interfaces.sessions_per_identity`), in that order. `resolve("test", {"AT_REQUEST_TTL_SECS": "120", "AT_SESSION_TTL_SECS": "900", "AT_SESSIONS_PER_IDENTITY": "2"})` gives `120`, `900`, `2`; `AT_REQUEST_TTL_SECS="abc"` raises `SettingsError`; with no environment all three are `None` (nothing shipped) |
| Refused | The `SEC-R07` record of `k-v2` (Validity) has exactly `{"request_id": k-v2's, "principal": ["test-principal","human"], "channel_identity": "uid:1002", "operation": "cancel", "target": {"account": ["sim","acct-sim"], "subject": "o-stop"}, "code": "SEC-R07"}`. The same refusal twice: one event. Another code for the same request: a second event. `SES-R01` (`auth=None`), `SEC-R10` and `SEC-R09` without a request: no event. The owner's kill engage while engaged: `LED-R09`, recorded. `ops` (uid 1003) with no kill grant: `SES-R02`, recorded with principal `["ops","human"]` |
| Dispatch | `action_world([{"result": "ack", "order_id": "o-close"}], admission_settings=dict(ADMISSION_SETTINGS, deadline_ms_close=300_000))`, a labelled synthetic deadline beyond the lifetime. A human close `k-xd` naming `E1` is admitted at `START`. The clock advances 120,001 ms with no fresh observation, so the pass leaves it waiting (stale book). Then `fresh()` and a pass: `DISPATCH_REFUSED` with code `SEC-R07` and dependency `request`. The command is `REFUSED`, there is no reservation row, and `broker.calls` is empty. The twin, in its own world, uses the same close `k-xd` (R-5); at +120,000 ms it is claimed and sent once (F-SEC10) |
| Kill input | `admission_world`, with `SAFETY_AUTH = Authenticated(Principal("kernel:safety", "kernel"), "in_process", request=None, via=None)`. `engage_kill(SAFETY_AUTH, "kill_file")` commits `KILL_ENGAGED` by `kernel:safety` with no `OPERATOR_REQUEST`. `release_kill(SAFETY_AUTH, "kill_file")`: `SES-R02`. After the owner's bound release, `"kill_flag"` commits. After the next release: `"drill"` is `SES-R02`; `kernel:protection` with `"kill_file"` is `SES-R02`; with the stage `INSPECTING` it is `SES-R09`; with the stage `RECOVERY_WRITING` it commits |
| Side files | After the Binding cases, every file under the ledger's directory is `ledger.sqlite`, `ledger.sqlite-wal`, `ledger.sqlite-shm`, or under `ledger.sqlite.evidence/`. There is no audit or side file |

**Crash tests** (`tests/recovery/test_crash_boundaries.py`), by killing a real process. Each runs this file as the child, as the existing crash points do, with argument `CP-SEC1` or `F-SEC12`.

* **CP-SEC1.**
  * The child builds and `prepare`s a composition at the ledger. It mints, with `operator_auth`, the owner's request R: nonce `nonce-synthetic-000000001`, `grant_admin` issue of `test_grant(grant_id="g-cpsec1")`, so `request_id` `ed0b42…7d15` and digest `ca560b…51ca`.
  * It prints `json.dumps(R.wire())` and flushes: the operator process's copy. It calls `authority.issue`, and after the commit returns it exits with code 86 before writing anything else. Until step 5 the reply is the return value, so the parent never sees one.
  * The parent asserts code 86, parses R with `operator_request_from_wire` from the last stdout line, and reopens the ledger with `simulation([], path=tmp_ledger)`.
  * `issue(comp.relay(R, "owner_credential"), test_grant(grant_id="g-cpsec1"))` returns `Replayed(ed0b42…7d15, "GRANT_ISSUED", len(FRESH) + 2, None)`, which is 17 with seven migrations. Exactly one `GRANT_ISSUED` of `g-cpsec1` and one `OPERATOR_REQUEST` with R's ID exist.
  * After 300,000 ms the same call is still `Replayed`. The same request with `valid_until` `2026-11-30T00:00:00.000000Z` on the grant is `SEC-R04`; twice gives one `OPERATOR_REQUEST_REFUSED`.
* **F-SEC12.**
  * The parent builds a composition at the ledger, shuts it down, and copies it with `apsw` backup to `tmp_path / "backup" / "ledger.sqlite"`: the backup.
  * The child reopens the ledger (a new epoch), mints the same R, prints it, issues, and exits 86 after the commit.
  * The parent composes on the backup with `restore=RESTORE` (imported from `tests/conftest.py`) and `confirm_grant=lambda row: True`. It then records, **first**, the bound fence `FenceEvidence("old-host", "stopped", "power_off", "2026-11-02T09:00:00.000000Z", None, "owner", None, ("acct-sim",), ())`, the evidence `test_restore_fencing.py`'s `_fence("old-host")` builds. **Second**, it records the bound advance.
  * R through `relay` is `SEC-R19`, recorded once, and `g-cpsec1` does not exist. R's epoch is unknown to the backup, and a restore was activated.

### Break checks

Each mutation is applied after its anchor is checked, run against the listed test file, and restored byte for byte with an md5 check. Each must fail a test.

The anchor is the code the mutation edits. It is checked to be present, exactly once, before the edit.

| Change | Anchor | Test that must fail |
|---|---|---|
| `bind` skips the recorded-result lookup | `bind`, row 4 (the `operator_request` read by `request_id`) | CP-SEC1; Replay |
| The lookup runs after validity | `bind`, rows 4 and 7 swapped | Replay (the cancel `k-c1` at +300,000 ms gives `SEC-R07`) |
| A replay with another digest is accepted | `bind`, row 4's digest comparison | Replay (`SEC-R04`); CP-SEC1 |
| `bind` trusts `request.argument_digest` without recomputing | `bind`, row 5's `argument_digest(operation, target, args)` | Binding (d) |
| `bind` ignores the target | `bind`, row 5's `request.target != target` | Binding (c) |
| `bind` ignores the operation | `bind`, row 5's `request.operation != operation` | Binding (b) |
| Validity for every operation | `bind`, row 7's `TIMED_OPERATIONS` test | Validity (not timed: the kill engage at +300,000 ms) |
| Validity on `clock.now()` instead of `effective_now` | `bind`, row 7's `effective_now(self.writer, self.clock)` | Validity (ratchet) |
| The simulation's `Authorizer` on the raw clock | `compose_simulation`'s `Authorizer(KernelNow(writer, clock), …)` | Validity (one clock: `k-v3`) |
| Validity on the request's own window | `bind`, row 7's `self.request_ttl_secs` | Validity (lifetime) |
| `SEC-R08` check removed | `bind`, row 6 | Confirmations |
| The fold's confirmation check removed | `projections.py`, the `OPERATOR_REQUEST` fold's `confirmation_id` test | Confirmations (the direct `transact` no longer gives `LED-R09`) |
| `SEC-R19` only when the epoch is unknown | `bind`, the epoch rule's `E is None` | Restore |
| `SEC-R19` removed | `bind`, row 8 | F-SEC12; Restore |
| `SEC-R20` removed | `bind`, row 9 | Advice (under kill) |
| `SEC-R22` removed (an `advice_apply` with no port admitted) | `ActionAdmission.admit`, step 2.7's `ports.advice is None` | Advice; Binding (modify) |
| The advice port's action not compared | `ActionAdmission.admit`, step 2.7's `== action_wire(request)` | Advice (`k-m4`) |
| `SEC-R10` `via` comparison removed | `bind`, row 3's `request.via != auth.via` | Relay |
| `owner-api:local` accepted for a delegate | `bind`, row 3's `"owner-api:local"` test | Relay |
| A relay may act for itself | `ActionAdmission.admit`, step 3.2's `in c.authority.relays` | Actions (`k-c6`) |
| `OPERATOR_REQUEST` left out of a decision | `Safety._commit`'s `request_drafts` call | Record; Binding |
| `OPERATOR_REQUEST` committed in its own transaction | `Safety._commit`'s single `Decision` | Record |
| `refused` records every repeat | `refused`'s `operator_request_refused` read | Refused; Replay |
| `refused` records `SEC-R10` | `refused`'s code exclusion | Relay; Refused |
| The recheck ignores the request | `recheck`'s `request_id` block | Dispatch |
| The recheck's request check after the owner-root return | `recheck`'s order (`kernel/authority.py:156-157`) | Dispatch |
| `kernel:safety` accepted with any reason | `_authorized`'s `KILL_INPUT_REASONS` test | Kill input |
| `kernel:safety` holds `kill_release` | `BUILTIN["kernel:safety"]` | Kill input |
| The latch strategy used to refuse (a ledger query added) | `unlock_latch` after the grant check | Latch (`other_strategy` gives `LED-R09`) |
| The close subject relation removed | `ActionAdmission.admit`, step 2.6 | Actions; Binding (close (c)) |
| A human action may reuse a command key | `ActionAdmission.admit`, step 2.5 | Actions |
| `EntryAdmission` accepts a relayed human | `EntryAdmission._a2`'s `auth.request is not None` | Entry |
| `EntryAdmission` accepts the unbound owner | `EntryAdmission._a2`'s `owner_credential` test | Entry (`k-e3`) |
| `Authenticated` accepts a request on a kernel principal | `Authenticated.__post_init__` | Types |
| `Authority` accepts a non-service relay | `Authority.__init__`'s `relays` check | Types |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/authority.py` | `Authenticated` (`request`, `via`), `Replayed`, labels, `request_ttl_secs`, `target_of`, `bind`, `request_drafts`, `refused`, `recheck`'s `request_id`, `BUILTIN["kernel:safety"]`; `issue`, `revoke`, `authorize_binding`, `revoke_binding` bound |
| `src/autonomous_trading/kernel/safety.py` | `KILL_INPUT_REASONS`, `_authorized`'s kernel case, `_commit`'s new signature, bound; `engage_hold`'s `reason`; `unlock_latch`'s `strategy` (bound, recorded, never refusing otherwise) |
| `src/autonomous_trading/kernel/ports.py` | `AdmissionPorts.advice` (default `None`) |
| `src/autonomous_trading/kernel/policy.py` | `clear_pause` bound; `_transact`'s `extra` |
| `src/autonomous_trading/kernel/lifecycle.py` | `resolve_attempt` bound |
| `src/autonomous_trading/kernel/recovery.py` | `advance`, `record_fence` bound; `_record`, `_advance_record`'s `extra` |
| `src/autonomous_trading/kernel/admission.py` | `action_wire`; `ActionAdmission.admit` (order, `reason`, key reuse, close subject, advice gate `SEC-R22`, relay principal `SEC-R10`, `dependencies.operator_request`); `EntryAdmission._a2`'s two `SEC-R09` cases; `_CHECK_OF` |
| `src/autonomous_trading/kernel/coordinator.py` | `admit_action`'s `reason`; row 3's `request_id` and dependency name |
| `src/autonomous_trading/kernel/protection.py` | The `Authenticated` constructor only |
| `src/autonomous_trading/kernel/ledger/store.py` | `_FAMILY`, `_PK`, `_load_touched` |
| `src/autonomous_trading/kernel/ledger/projections.py` | `TABLES`, the `OPERATOR_REQUEST` and `OPERATOR_REQUEST_REFUSED` folds |
| `src/autonomous_trading/kernel/ledger/schema.py` | `Migration(7, …)` |
| `src/autonomous_trading/resources/migrations/007_security.sql` | New (T-67) |
| `src/autonomous_trading/resources/events.schema.json` | The two kinds |
| `src/autonomous_trading/contracts/identity.py` | `OperatorRequest.wire`, `operator_request_from_wire` |
| `src/autonomous_trading/settings/schema.py`, `src/autonomous_trading/settings/loader.py` | The three `interfaces` settings and `_SECURITY` |
| `src/autonomous_trading/bootstrap.py` | `SIM_RELAY`, `KernelNow`, the `Authorizer`, `principals`, `relays`, `relay`, `operator_call`, the refusing settings, constructors |
| `src/autonomous_trading/operations/verification.py` | Bound advance and issue; settings; refusals raised |
| `tests/conftest.py` | `SECURITY_SETTINGS`, `SIM_PRINCIPALS`, `operator_auth`, `action_auth`, `make_entry_order`, `owned_close`'s `subject`, `FixtureAdvice`, `admission_ports`' `advice`, `RESTORE`, `prepare`, `FRESH`, the worlds' bound calls |
| `tests/unit/test_authority_grants.py` | PRF-SEC-03's groups (T-07); existing tests bound |
| `tests/recovery/test_crash_boundaries.py` | CP-SEC1, F-SEC12 and their child branches |
| `tests/contracts/test_capabilities.py` | The `Authenticated(` guard and `test_authenticated_never_replaced` |
| `tests/unit/test_policy_parameters.py` | The Settings group (R-8) |
| Existing: `tests/unit/test_admission_checks.py`, `tests/unit/test_clock_contract.py`, `tests/unit/test_conflict_relation.py`, `tests/unit/test_observation_loop.py`, `tests/unit/test_protection_basket.py`, `tests/unit/test_protection_loop.py`, `tests/unit/test_protection_states.py`, `tests/unit/test_review_semantics.py`, `tests/unit/test_safety_matrix.py`, `tests/integration/test_bounded_io.py`, `tests/integration/test_dispatch_revalidation.py`, `tests/integration/test_entry_outcomes.py`, `tests/integration/test_reconciliation_commits.py`, `tests/integration/test_verb_completion.py`, `tests/recovery/test_restore_fencing.py` (also imports `RESTORE` from `tests/conftest.py`), `tests/recovery/test_session_transitions.py` | Bound requests from the fixture, constructors, kind lists, `FixtureAdvice` for human modifies, and R-1's entry, as "Existing tests that change" says |

No new tree delta. Every module is in the target tree, the migration is T-67, and the test file is T-07. Migration 7 is the next free number at `c2cca11`. `tests/unit/test_operator_authorization.py` (T-60) does not change.

### Completion conditions (step 2)

* Every test passes twice in a row with the whole suite, on Windows and on Linux alike: the crash children use `subprocess` as the existing crash points do.
* Every break check fails a listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file, and `json.loads` on `resources/events.schema.json`.
* `git diff --name-only` names exactly the files in the table above.
* **Two commits (F-9), in this order:**
  1. The mechanical constructor commit: `Authenticated`'s two required fields, every constructor site stating `request=None, via=None`, and both guards. No behaviour change, and the whole suite passes on it alone.
  2. The behaviour commit: everything else in this step.
* The build starts only after the SLICE-08 step 5 commit, which also changes `bootstrap.py` and `tests/conftest.py`, and on the coordinator's word. Every `bootstrap.py` and `tests/conftest.py` line cited here is re-read on that head before editing.
* PRF-SEC-03 passes. PRF-SES-01, PRF-SES-02 and PRF-SES-06, and every SLICE-04…08 test, pass with no expectation changed beyond "Existing tests that change". No side file is written anywhere.
* The spec's binding-check section and this file record step 2 "as built", with any Deviation or Fork call found while building.

### Step 2 as built

**In plain words.** The kernel now checks each owner action against the one request made for it, and writes the request into the ledger with the action. A lost reply returns the first answer, and nothing happens twice. A cancel or close older than 120 seconds is refused, even while it waits to be sent; your other actions have no time limit. A request older than a restore is refused, AI exit advice is refused until the advice store arrives, and the kill file can stop trading on its own. All 1,288 automatic checks pass.

Built on `slice-08` at `4ecc799` (SLICE-08 step 5), in `OA_NEW`, as two commits. Nothing is pushed.

| Commit | What | Size |
|---|---|---|
| `aaa7bf9` | Mechanical: `Authenticated(principal, path, *, request, via)` at every construction site with `request=None, via=None`; the `Authenticated(` guard and `test_authenticated_never_replaced` | 13 files, +67 −29 |
| `cb439ce` | Behaviour: everything else in this step | 38 files, +1,750 −299 |

**Choices made while building:**

| Topic | As built |
|---|---|
| The test world's advice port | `admission_ports` and `admission_world` compose a `FixtureAdvice` unless a test passes `advice=None`, rather than each human-modify test composing one. `admit_human` registers a modify as its own advice first. Every non-test composition still has none (`SEC-R22`) |
| Test helpers (`tests/conftest.py`) | The step names `operator_auth`, `action_auth`, `make_entry_order` and `FixtureAdvice`. Also built: `admit_human` and `action_args`; one bound wrapper per owner call (`owner_issue`, `owner_revoke`, `owner_authorize`, `owner_revoke_binding`, `owner_advance`, `owner_fence`, `kill`, `hold`, `release_hold`, `unlock`, `clear_pause`, `resolve`); and `SYNTHETIC_REASON`. `SIM_PRINCIPALS` is a function, `sim_principals()`, because `ACCT_2` is defined later in the file |
| `Authority.settle(auth, result)` | A small helper: a writer refusal from a bound call goes through `refused`, and anything else passes unchanged |
| Action admission | Split into `_call` (the operation and target) and `_human` (the binding stage). `auth` is resolved first, then bind for a human, then A1 |
| Human resubmissions | `test_action_admitted_awaiting_dispatch` now expects the same request again to return `Replayed` with the outcome, and a new request for an existing key to give `SEC-R04`. It expected the ledger identity rule and `LED-R02`: the single-use Fork call reaches this test too |
| SLICE-08 step 5's new tests | `tests/integration/test_market_port.py` landed after the deepening and also needed bound requests, for two owner calls. It is in the second commit |
| A shadowed helper | `tests/unit/test_protection_loop.py` defines its own `kill(world)`, so the conftest helper is imported there as `kill_switch` |
| The side-file check | It allows `ledger.sqlite.writer.lock`, the ledger's own single-writer lock (SLICE-01), beside the ledger, its WAL files and its evidence store |
| The dispatch test | It gained an owner case (`OWNER`, whose grant is the owner root), so that moving the recheck's request check after the owner-root return fails a test |
| A break check | "`refused` records `SEC-R10`" mutated code no `SEC-R10` reaches: bind returns it without calling `refused`. It is replaced by "a relay refusal recorded", which routes bind's `SEC-R10` through `refused` and drops the exclusion |
| Proof of the first commit | Its 10 touched test files and the guards: 314 passed. The whole suite was run once, after the last edit, as the coordinator asked |

**Tests:** 42 new cases. `tests/unit/test_authority_grants.py` has 16 Binding cases, 3 Dispatch cases and the other PRF-SEC-03 groups. `tests/recovery/test_crash_boundaries.py` has CP-SEC1 and F-SEC12, each killing a real child process. `tests/unit/test_policy_parameters.py` has the Settings group (R-8). The whole suite: **1,288 passed, 1 skipped** (1,246 before), in 137.5 s, run once. `ast.parse` passes on all 36 edited Python files, and `json.load` on `resources/events.schema.json`. Every SHA-256 value in the tests was recomputed.

**Break checks** (`s10b_breaks.py` in the session scratchpad). Each anchor was checked present exactly once before the run; one mutation at a time; every file restored byte for byte, md5 verified. All 37 failed a test of their listed group.

| Change | Test that failed |
|---|---|
| `bind` skips the recorded-result lookup | CP-SEC1; Replay |
| The lookup runs after validity | Replay |
| A replay with another digest is accepted | CP-SEC1; Replay |
| `bind` trusts `request.argument_digest` | Binding |
| `bind` takes the target from the request | Binding |
| `bind` takes the operation from the request | Binding |
| Validity for every operation | Validity |
| Validity on `clock.now()` instead of `effective_now` | One clock and the ratchet |
| The simulation's `Authorizer` on the raw clock | One clock and the ratchet |
| Validity on the request's own window | Validity |
| `SEC-R08` check removed | Confirmations |
| The fold's confirmation check removed | Confirmations |
| `SEC-R19` only when the epoch is unknown | Restore |
| `SEC-R19` removed | F-SEC12; Restore |
| `SEC-R20` removed | Advice with a port |
| `SEC-R22` removed | Advice without a port; Binding |
| The advice port's action not compared | Advice with a port |
| `SEC-R10` `via` comparison removed | Relay |
| `owner-api:local` accepted for a delegate | Relay |
| A relay may act for itself | Actions |
| `OPERATOR_REQUEST` left out of a decision | Binding; Record |
| `OPERATOR_REQUEST` committed in its own transaction | Binding |
| `refused` records every repeat (the read and the fold's guard removed) | Binding; Refused; Replay |
| A relay refusal recorded | Relay |
| The recheck ignores the request | Dispatch |
| The recheck's request check after the owner-root return | Dispatch |
| `kernel:safety` accepted with any reason | Kill input |
| `kernel:safety` holds `kill_release` | Kill input |
| The latch strategy used to refuse | Latch |
| The close subject relation removed | Actions; Binding |
| A human action may reuse a command key | Actions |
| `EntryAdmission` accepts a relayed human | Entry |
| `EntryAdmission` accepts the unbound owner | Entry |
| `Authenticated` accepts a request on a kernel principal | Types |
| `Authority` accepts a non-service relay | Types |
| An `Authenticated` copied with a borrowed request | `test_authenticated_never_replaced` |
| An `Authenticated` built outside the allowed files | `test_decisions_built_only_by_the_kernel` |

## Step 3 — secrets

<a id="step-3--secrets-outline"></a>

The authorities are the spec's [Secrets](../../design/security-and-operator.md#secrets-settingssecretspy) section, its [refusal codes](../../design/security-and-operator.md#refusal-codes) (`SEC-R18`), its [event catalogue](../../design/security-and-operator.md#event-catalogue) (`CREDENTIAL_BOUND`), F-SEC6 in its [failure modes](../../design/security-and-operator.md#failure-modes-and-crash-points), and A06-F3 (`README.md:867`). Step 3 adds one module, one ledger event kind with no index table, the adapter's use of a `Secret`, and one example file. It adds no socket, door or process. No live composition exists before SLICE-11, so every live path here is reached by tests calling `resolve` with `live=True`. It builds on step 2 as built (`cb439ce` on `slice-08`). Every `OA_NEW` citation below is at `cb439ce`; every legacy citation is at 445eb116. No real secret or `.env` file was opened to write this step.

**In plain words.** This step decides where the broker key and other passwords come from, and keeps them out of everything the system itself writes. On the live server the broker key should come from a protected file. An environment variable, which every child process inherits, or a file other users can read, still works as today, and the start records a warning. The key is used exactly as today: the same text, trimmed of spaces as today, with no new check of its form. The system refuses to start only when the settings that point to the key are broken: no reference, or a missing or empty file. Once running, nothing re-reads the key and nothing about it can stop trading. Every record, error and log line is cleaned of the key, even when OpenAlgo echoes it back. Child processes never get it, as today. Each start writes into the ledger which key version it uses, never the key itself. Replacing the key means a restart, and a restart never resends an order.

### Decisions

#### Where loading may refuse (the boundary)

Loading a secret refuses (`SEC-R18`) **only at process start, and only on a malformed configuration**. Nothing in this step reads, judges or refuses the key's value beyond "empty after trimming". There is no check of its length, form, expiry or age, and no call to OpenAlgo to validate it. Nothing refuses after start. Every refusal names its reason and the reference, never the value.

| Reason | Fires when | Why it is a malformed configuration |
|---|---|---|
| `no_reference` | The process's scope (below) names a credential that no reference names | The live configuration does not say where the key is |
| `malformed_reference` | A reference fails its own rules (below), or two references name one credential | The reference cannot be followed |
| `no_credentials_directory` | A `credential` source with `CREDENTIALS_DIRECTORY` unset or not absolute | The systemd unit loads no credential |
| `missing` | The file, credential or environment name does not exist | The reference points nowhere |
| `unreadable` | Opening raises any other `OSError` | The process cannot read what the reference names |
| `not_regular` | The opened descriptor is not a regular file | The reference names a directory or device |
| `oversize` | More than `MAX_SECRET_BYTES = 65_536` bytes, a fixed memory bound (not a policy value) | No credential is that long |
| `not_utf8` | The bytes do not decode as strict UTF-8 | The reference names a binary file |
| `empty` | The text is empty after legacy's `strip()` | There is no key |

**Warnings, never refusals.** Three conditions under which legacy traded are accepted and recorded. `resolve` adds a `(key, reason)` pair to `Secrets.warnings` for each, and `CREDENTIAL_BOUND` carries them (below). None refuses, at start or after.

| Warning | Raised when |
|---|---|
| `env_source` | `live=True` and a broker credential's source is `env` |
| `permissions` | POSIX only: the file's mode has any group or other bit (`st_mode & 0o077`) |
| `owner` | POSIX only: the file's owner is not the process's effective uid |

* **Deviation — for owner review: a malformed secret configuration refuses the start.** Legacy started with no key and every send then failed at OpenAlgo (`is_configured`, `src/interfaces/mcp/core/openalgo.py:79-80`). The target refuses the start on the refusal table, so a broken reference is found at start, not at the first order. Every refusal row is a case in which legacy could not trade either: no key, or no readable text.
* **Fork call (legacy's key sources keep trading).** Legacy read the key from the environment or configuration, readable by anyone with access (`src/interfaces/mcp/core/openalgo.py:75-76`; `src/interfaces/mcp/domains/openalgo/server.py:52-54`). The target keeps trading in those cases and records `env_source`, `permissions` or `owner` as a warning. **This departs from the spec's F-SEC6** ("refuses to start"): no session may gate real trading. A correctly installed key (SLICE-11 writes it `0600`, owned by the unit's user) raises no warning.
* **Fork call (the key as legacy reads it).** The value is the source's text with legacy's `str.strip()` applied (`src/interfaces/mcp/core/openalgo.py:76`; `src/interfaces/mcp/domains/openalgo/server.py:53`), and nothing else. The bytes sent to OpenAlgo are therefore exactly legacy's for the same key. A file ending in a newline works, as an environment value did.
* **On Windows** (`os.name != "posix"`) the `permissions` and `owner` warnings are not checked, because the platform has no such bits. Live runs only on the Linux host.

#### References (`settings/secrets.py`)

`settings/secrets.py` imports from `autonomous_trading` only `settings.loader` (for `SettingsError`). It imports no `kernel`, `adapters` or `interfaces` module, and reads no global: references and the environment are arguments (D08).

* `SOURCES = ("credential", "file", "env")`.
* `SecretRef(service, name, source, locator, version)`, frozen, with slots. Construction raises `ValueError` when:
  * `service` or `name` is not a full match of `[a-z][a-z0-9_]{0,63}`;
  * `source` is not in `SOURCES`;
  * the `locator` does not fit its source:
    * `file`: an absolute path (`os.path.isabs`);
    * `credential`: a full match of `[A-Za-z0-9._-]{1,255}`, not `.` or `..`;
    * `env`: a full match of `[A-Za-z_][A-Za-z0-9_]{0,127}`;
  * `version` is neither `None` nor a full match of `[A-Za-z0-9._-]{1,64}`.

  `key` is `"<service>/<name>"`. `identifier` is `"<service>/<name>@<version>"`, with `unversioned` for `None`: the spec's form. The version is the operator's label for the installed key (CUJ-SEC-5's `v3`, `v4`). It is never derived from the value or a hash of it.
* `parse_references(section) -> tuple[SecretRef, ...]` reads a profile's `secrets` section: `{service: {name: {"source", "locator", "version"}}}`. `None` or `{}` gives `()`. Any other shape, a missing or extra key, or a `SecretRef` `ValueError` raises `SecretUnresolvable` with reason `malformed_reference`, naming `service/name` (or `secrets` for the outer shape). The result is sorted by `(service, name)`. SLICE-11's live profile loader calls it. `settings/loader.py` and `Settings` do not change in this step.
* `SecretUnresolvable(SettingsError)` has `code = "SEC-R18"`, `label = "secret_unresolvable"`, `where` (the reference's `key`, or `secrets`) and `reason` (the table's vocabulary). Its message is `"SEC-R18 secret_unresolvable: <where>: <reason>"`. A refusal raised after the bytes were read (`oversize`, `not_utf8`, `empty`) still carries no byte of them. **Every `SecretUnresolvable` is raised `from None`.** A `UnicodeDecodeError` holds the bytes it failed on (`.object`), and an `OSError` holds the path. Chaining either as `__cause__` or `__context__` would put them into a traceback.

#### `Secret` and `Secrets` (`settings/secrets.py`)

* `Secret(ref, value)`, frozen: `__slots__ = ("_ref", "_value")` and a `__setattr__` that raises. Construction raises `ValueError` unless `ref` is a `SecretRef` and `value` is a non-empty `str`.
  * Properties `ref`, `key`, `identifier` and `source`. `reveal() -> str` returns the value.
  * `__repr__`, `__str__` and `__format__` (any spec) return `"Secret(<identifier>)"`, so an f-string, `%` formatting or `logging` never shows the value.
  * `__reduce__` and `__reduce_ex__` raise `TypeError`, so `pickle` refuses it. `json.dumps` and the ledger's `canonical` refuse it as they refuse any object (`NotJsonData` names only the type, `kernel/ledger/envelope.py:46`). `__copy__` and `__deepcopy__` return `self`.
  * `__eq__` and `__hash__` are identity (the defaults), so no comparison runs over the value.
* `Secrets(items)`: an immutable `Mapping[str, Secret]` keyed by `key`. A repeated key raises `ValueError`. `__repr__` is `"Secrets(<identifier>, …)"`, in key order. `Secrets(items, warnings=())` also holds `warnings: tuple[tuple[str, str], ...]`, each a `(key, reason)` pair whose key it holds and whose reason is `env_source`, `permissions` or `owner`; anything else raises `ValueError`. Its methods are below: `scrub`, `redact`, `bound` and `log_filter`.
* `Secret(` is built in `src/` only in `settings/secrets.py`, and `.reveal(` is called in `src/` only there and in `adapters/openalgo.py`. A guard in the step's test file enforces both (below). Tests build a `Secret` directly, with a labelled synthetic value.

#### Scope and `resolve` (`settings/secrets.py`)

* `BROKER_CREDENTIALS = frozenset({("openalgo", "api_key")})`.
* `SCOPES: Mapping[str, frozenset[tuple[str, str]]]`, each process's credentials:
  * `"kernel"`: `{("openalgo", "api_key")}`, the spec's scope;
  * `"market"`: `{("openalgo", "api_key")}`;
  * `"operator"`: empty, "none of the broker's" (the spec).

  Step 8 adds `"mcp"` (its static tokens) and `"console"` (the shared console token).
* **Fork call (the market process holds the broker key for its reads).** Legacy's market poller reads OpenAlgo with the broker key, through the same client (`src/interfaces/mcp/core/marketpull.py:816-833`; `src/interfaces/mcp/core/openalgo.py:75-76`). SLICE-08's market source takes it (`adapters/openalgo.py:946-953`). The spec's scope list does not name the market process; the row keeps legacy. A native read-only credential stays A06-F2's listed improvement, after endpoint proof.
* `resolve(refs, scope, *, live, environ) -> Secrets`, all arguments required (`live` a bool, `environ` a `Mapping[str, str]`). The composition passes `SCOPES[<process>]` and `os.environ`. It runs once, at process start: the composition calls it once and holds the result. For each scope entry, in sorted order:
  1. Exactly one reference has that `(service, name)`: none is `no_reference`, more than one `malformed_reference`. A reference outside the scope is **never opened, read or checked**.
  2. `live` and the entry is in `BROKER_CREDENTIALS` and the source is `env`: the warning `env_source`, and resolution continues. `env` is accepted for every secret, with no warning outside this case.
  3. Read the source:
     * `env`: `environ[locator]`; absent is `missing`.
     * `file`: the locator path.
     * `credential`: `environ["CREDENTIALS_DIRECTORY"]` joined with the locator. Unset or not absolute is `no_credentials_directory`.

     A file or credential is opened with `os.open(path, os.O_RDONLY | getattr(os, "O_BINARY", 0))`. Symlinks are followed: the checks are made on the opened descriptor, which is the file actually read. `FileNotFoundError` is `missing`; another `OSError` is `unreadable`. Then `os.fstat` on the descriptor: not `S_ISREG` is `not_regular`. On POSIX, `st_mode & 0o077` adds the warning `permissions`, and `st_uid != os.geteuid()` adds the warning `owner`; resolution continues either way. At most `MAX_SECRET_BYTES + 1` bytes are read, and the descriptor is closed in a `finally`. Python descriptors are not inherited by children (PEP 446).
  4. Decode as strict UTF-8 (`not_utf8`), apply `strip()`, and refuse an empty result (`empty`).
  5. Build `Secret(ref, value)`.

  It returns `Secrets(secrets, warnings)`, with the warnings in scope order, each entry's warnings in the order above. `resolve` never writes, never changes `environ` or `os.environ`, and keeps no copy of the value outside the `Secret`. **Nothing re-reads while running:** no other function opens a source, and `reveal` returns the value held.

#### Scrubbing and redaction (`settings/secrets.py`)

* `Secrets.scrub(value)` returns a new value with every form of every held secret replaced by `***`. That is the marker the built adapter already uses (`adapters/openalgo.py:321`), so no existing expectation changes.
  * **Forms**, for each value `v`: `v`; `json.dumps(v)[1:-1]` and `json.dumps(v, ensure_ascii=False)[1:-1]` (the key inside JSON text); `urllib.parse.quote_plus(v)` and `urllib.parse.quote(v, safe="")` (the key in a query, as the instrument read sends it, `adapters/openalgo.py:1268`). Distinct, non-empty forms are replaced longest first (ties in code-point order), so a form that contains another is replaced whole.
  * **Walk:** a `str` is replaced in; a `dict` is rebuilt with its keys and values scrubbed; a `list` stays a `list` and a `tuple` a `tuple`, each scrubbed item by item; anything else is returned unchanged (a `Decimal` stays exact).
  * Every held value is scrubbed whatever its length. **Deviation:** legacy's telemetry scrubbed only environment values of at least 8 characters (`src/runtime/telemetry.py:54-58`).
* `Secrets.redact(value)` is legacy's agent-edge redaction after scrubbing: `_legacy_redact(self.scrub(value))`. `_legacy_redact`, `SECRET_KEYS`, `_is_secret`, `REDACTED = "[redacted]"`, `MAX_STRING = 4_096`, `MAX_DEPTH = 12` and `MAX_KEYS = 200` are copied from `src/contract/safety.py:59-135`, with that provenance in the module. Scrubbing runs first, so `MAX_STRING`'s truncation can never leave a prefix of a value. Step 8 uses `redact` for every disclosure; the owner's own doors read unredacted except secret values (the spec).
* `Secrets.log_filter() -> logging.Filter`. A `ScrubFilter` whose `filter(record)`:
  * sets `record.msg = self.scrub(record.getMessage())` and `record.args = ()`;
  * when `record.exc_info` is set, sets `record.exc_text` to the scrubbed `logging.Formatter().formatException(record.exc_info)`, then `record.exc_info = None`;
  * scrubs `record.stack_info` when set;
  * returns `True`.

  The kernel writes no log line at `cb439ce` (no `logging`, `print` or `sys.stderr` in `src/`). SLICE-11 attaches this filter to every handler a process composes.

#### Children (`settings/secrets.py`)

`child_environment(parent_env, allowed, *, refs, resolved) -> dict[str, str]` builds a child's environment:

1. It keeps a name when it is in `BASE_ENV` or in `allowed`, or starts with `"PYTHON"` or `"LC_"`. `BASE_ENV` and the prefixes are copied from legacy's `_BASE_ENV` and `_BASE_PREFIXES` (`src/runtime/strategy_host/process.py:80-91`), with that provenance. Legacy's pass-through of configuration overrides (`process.py:132-138`) is not copied: a target child takes its configuration as arguments (SLICE-09).
2. It then **pops**, even when listed in `allowed`:
   * every name `n` with `env_path(n) == BROKER_KEY_PATH`, as legacy's `withhold_broker_key` does (`src/config/__init__.py:226`). `BROKER_KEY_PATH = "openalgo.auth.api_key"` (`:215`). `env_path` is ported from `src/config/__init__.py:197-210`, with its alias table cut to the key's one alias, `{"OPENALGO_API_KEY": "openalgo.auth.api_key"}` (`:76`). `AT__` names map by dropping the prefix, lower-casing and turning `__` into `.`; `MCP_` names containing `__` map the same way; any other name maps to `None`. So `OPENALGO_API_KEY`, `MCP_OPENALGO__AUTH__API_KEY` and `AT__` in any letter case (`AT__openalgo__auth__api_key` included) are popped, where legacy's fixed `BROKER_KEY_ENV` (`src/tier1/recovery.py:72-73`) would miss the case variants;
   * every `env` locator in `refs`;
   * every name whose value contains any form of any value in `resolved`.
3. It sets `BROKER_KEY_MASK = "AT__OPENALGO__AUTH__API_KEY"` to `""`, legacy's mask (`src/config/__init__.py:216`, `:228`).

* **Fork call (children never hold the broker key).** A spawned child gets the allow-list, loses the key's names by a `pop`, not an omission, and carries the mask, as legacy (`src/runtime/strategy_host/process.py:326-329`; `src/config/__init__.py:219-229`). Who can send orders does not change.
* **Deviation (stricter):** step 2's pop by value also removes a secret held under a name nobody listed. Legacy removed by name only.

#### The adapter (`adapters/openalgo.py`)

The adapter is where a secret value and outside text meet. The spec's "every evidence record, log line and error the kernel writes passes `scrub`" is met here, before any digest is taken.

* `_Http.__init__(base_url, api_key, secrets=None)` (`adapters/openalgo.py:306-317`):
  1. It keeps the URL checks first.
  2. A non-`Secret` `api_key` raises `TypeError("api_key must be a Secret")`.
  3. `secrets` defaults to `Secrets((api_key,))`; a given `secrets` whose `get(api_key.key)` is not `api_key` raises `ValueError`.
  4. `self.key = api_key.reveal()`: the adapter's one `reveal`, held privately as today.
  5. `scrub` (`:319-326`) becomes `return self._secrets.scrub(value)`.
* `OpenAlgoAdapter(base_url, api_key, account, clock, evidence, *, http_timeout_ms, exchange, read_budget=None, secrets=None)` and `OpenAlgoMarketSource(base_url, api_key, clock, *, …, secrets=None)` pass both to `_Http`. The market source's `str` check (`:951-952`) becomes the `Secret` `TypeError`. SLICE-11 passes the process's resolved `Secrets`, so every secret the process holds is scrubbed, not only the key.
* **Every parsed response is scrubbed before it is mapped.** `body = self._scrub(_parse_exact(text))` in `_send` (`:462`), `_send_basket` (`:516`) and `_read` (`:720`). An order ID, symbol or message echoing a secret therefore reaches no `LegResult`, observation item, ledger event or evidence as the value; it arrives as `***`. The market source's `_parse` already scrubs (`:1050`).
* **Scrub before truncation.** `{"text": self._scrub(text[:4096])}` (`:466`, `:520`) becomes `{"text": self._scrub(text)[:4096]}`. Truncating first could leave a prefix of a key that straddles byte 4,096.
* **Correction to the slice-level "value scrubbing" Deviation.** It cites `adapters/openalgo.py:414` and `:468` as dropping the key by field name only. At `cb439ce` the adapter already scrubs the key by value (`:319-326`, applied at `:463`, `:466`, `:517`, `:520`, `:592`, `:609`, `:628`, `:669`, `:714`, `:721`, `:763`). It drops the request field by name (`:451`, `:505`). What it does not do is scrub the exact parse it maps (`:462`, `:516`, `:720`), scrub before truncating (`:466`, `:520`), or cover any secret but the key. Step 3 adds those three.
* **Fork call (the instrument master's key in the URL).** The master is read by a GET whose query carries `apikey`, legacy's form (`adapters/openalgo.py:334-338`, `:1268`). It stays: OpenAlgo's endpoint takes the key there. **Leftover risk:** an access log on the OpenAlgo host or a proxy can record query strings, and so the key. That is outside this system's writes, so step 3 cannot scrub it. The SLICE-11 hand-off below stops OpenAlgo's access log from recording query strings.
* **Rejected: scrubbing inside `EvidenceStore.publish`.** It would change content after the adapter stamped its digest, and `kernel/reconciliation.py:834-835` would then refuse the citation. A leak would become a refused entry, which gates trading. The adapter scrubs before the digest instead, and the byte scans (Tests) prove nothing else writes a value.

#### `CREDENTIAL_BOUND` (`kernel/recovery.py`, ledger)

* `Recovery(…, credentials=())` gains one keyword: a tuple of `(identifier, source, warnings)` triples. Each identifier and source is a non-empty `str`, the source in `("credential", "file", "env")`, and the identifiers are distinct. `warnings` is a tuple of reasons from `("env_source", "permissions", "owner")`. Anything else raises `ValueError`. `kernel/` imports nothing from `settings.secrets`: the composition passes plain triples.
* `run()` (`kernel/recovery.py:136-169`) calls `self._bind_credentials()` right after `self._bind_release()` (`:151`), in `RECOVERY_WRITING` and before `coordinator.recover()`. With credentials, it commits **one** decision of kind `CREDENTIAL_BOUND` by `kernel:recovery` through `_record` (`:104-109`). The decision holds one `CREDENTIAL_BOUND` event per credential, in identifier order, with payload exactly `{"identifier": …, "source": …, "warnings": [reason, …]}` (an empty list when there is none). With none, it writes nothing, so `FRESH` and every kind list stay as they are. `run` runs once per composition, so once per credential per epoch.
* The payload never holds the value, a hash of it, its length or its locator. **Fork call (a key replacement never gates a start or a send):** no routine check reads `CREDENTIAL_BOUND` (`routine_failures`, `kernel/recovery.py:232-268`). A key replaced between epochs neither declines the routine advance nor resends anything. A command left `UNCERTAIN` stays uncertain and is reconciled (CUJ-SEC-5; `README.md:867`), as legacy's restart resent nothing.
* `resources/events.schema.json` gains `"CREDENTIAL_BOUND": {"identifier": "string", "source": "string", "warnings": "array"}`. `kernel/ledger/store.py`'s `_FAMILY` (`:32-47`) gains `"CREDENTIAL_BOUND": "recovery"`. `kernel/ledger/projections.py`'s `_NO_ROWS` (`:17-18`) gains it: no index table, as the catalogue says. No migration.
* `compose_simulation(…, credentials: Secrets | None = None)` (`bootstrap.py:123-132`) passes `credentials=credentials.bound() if credentials is not None else ()` to `Recovery` (`:256-259`). It is the simulation's stand-in for SLICE-11's kernel composition; the simulation itself holds no key.
* `Secrets.bound() -> tuple[tuple[str, str, tuple[str, ...]], ...]` is `(identifier, source, reasons)` for each held secret, in identifier order, with `reasons` that secret's warnings in their order.

#### `config/live.example.yaml`

The file is in the target tree (`README.md:963`). Step 3 creates it holding only a header comment and the `secrets` section. SLICE-11 step 7 adds the rest of the production profile.

```yaml
# Secret references only. No value is ever written here (SLICE-10 step 3).
secrets:
  openalgo:
    api_key:
      source: credential        # systemd LoadCredential; `file` is also accepted; `env` works, with the warning env_source
      locator: openalgo-api-key
      version: null             # the operator's label for the installed key, for example v3
```

#### The secret guards

At `cb439ce`, `OA_NEW` has neither `gitleaks` nor a hygiene test: no `.pre-commit-config.yaml`, and no test that scans for secrets (checked with `git ls-tree`). They are repository files for SLICE-11 ([configuration spec](../../design/configuration-artifacts-release.md#repository-files)). This step keeps them unneeded for itself: **no test holds a literal secret value**. Each synthetic value is made at run time (Tests), so no source file holds one.

#### Fork calls and deviations in this step

* **Fork calls**, each named where it applies above:
  * the key as legacy reads it (stripped, nothing checked);
  * legacy's key sources keep trading (`env_source`, `permissions` and `owner` are warnings);
  * the market process holds the broker key for its reads;
  * children never hold the broker key;
  * the instrument master's key in the URL;
  * a key replacement never gates a start or a send.
* **Deviations:**
  * a malformed secret configuration refuses the start, for owner review;
  * scrubbing covers every held secret and its JSON and URL forms, at every length, before truncation and before the adapter maps a response;
  * a child loses a secret by value as well as by name;
  * `CREDENTIAL_BOUND` is new.
* No score, threshold or money value is set. `MAX_SECRET_BYTES` is a memory bound.

#### What later steps take from step 3

* **Step 6:** the operator process resolves `SCOPES["operator"]` (nothing). It builds any child's environment with `child_environment`.
* **Step 8:** adds the `mcp` and `console` scope rows and moves the MCP static tokens from configuration to references (the slice-level Deviation). It uses `Secrets.redact` for every disclosure, and `child_environment` for PRF-SEC-09's check.
* **SLICE-09:** the worker host builds each worker's environment with `child_environment`.
* **SLICE-11:**
  * composes the kernel and market processes with `resolve(parse_references(profile["secrets"]), SCOPES[…], live=True, environ=os.environ)`;
  * passes the result as `credentials=` (kernel) and as the adapters' `api_key` and `secrets`;
  * attaches `log_filter()` to every handler;
  * routes `sys.excepthook` and `threading.excepthook` through that filtered logger, so an uncaught traceback is scrubbed too;
  * stops OpenAlgo's access log from recording query strings (the instrument master's key);
  * installs the key `0600`, owned by the unit's user;
  * completes `config/live.example.yaml`.

### Tests

`tests/unit/test_secret_references.py` (tree delta **T-61**) holds PRF-SEC-04. It uses the `simulation` fixture and `RecordedClock` at `START`.

**Synthetic values, never literals.** Each test draws `SYNTH = "SYNTHETIC-SECRET-" + uuid.uuid4().hex`, and the Scrub group also `ODD = 'SYNTHETIC-SECRET "é" ' + uuid.uuid4().hex`. Every byte scan looks for the value's UTF-8 bytes, its two JSON forms, its `quote_plus` form, and the hex SHA-256 of its UTF-8 bytes.

**Platform.** Cases marked POSIX (`skipif(os.name != "posix")`) run where the slice header says Linux-only tests run, and count only from there. Every other case runs on Windows and Linux.

A test file is written with `Path.write_bytes`, then (POSIX) `os.chmod(path, 0o600)` unless the case says otherwise.

| Group | Cases |
|---|---|
| References | `parse_references` of the example file's `secrets` (`yaml.safe_load`) gives exactly `(SecretRef("openalgo", "api_key", "credential", "openalgo-api-key", None),)`, with identifier `openalgo/api_key@unversioned`. Every leaf of that file under `secrets` is one of `source`, `locator`, `version`. Each of these raises `SecretUnresolvable` (`malformed_reference`, `where` named): source `vault`; a relative `file` locator `keys/k`; `credential` locators `a/b` and `..`; `env` locator `1X`; version `v 3`; service `OpenAlgo`; an extra key `value`; a missing `version`; a list as the section. `None` gives `()` |
| Sources | `file` with `SYNTH + "\n"` resolves to `SYNTH` (legacy's strip), identifier `openalgo/api_key@v3`. `env` (`environ={"SYNTH_KEY": " " + SYNTH}`, not live) resolves to `SYNTH`. `credential` with `environ={"CREDENTIALS_DIRECTORY": str(tmp_path)}` and the file `openalgo-api-key` resolves. Refusals with their reason: a missing file (`missing`); an absent env name (`missing`); `credential` with no `CREDENTIALS_DIRECTORY` and with `"rel"` (`no_credentials_directory`); the file holding `" \n\t"` (`empty`); 65,537 bytes (`oversize`); `b"\xff"` (`not_utf8`); a directory (`not_regular` on POSIX, `unreadable` on Windows). In each refusal the message and `repr` hold none of the value's forms, `__cause__` is `None` and `__suppress_context__` is `True` (`not_utf8` with `b"\xff" + SYNTH.encode()` included). POSIX: modes `0o640`, `0o604` and `0o610` each resolve to `SYNTH` with `warnings == (("openalgo/api_key", "permissions"),)`. `0o600` and `0o400` resolve with no warning. With `os.geteuid` monkeypatched to return the real uid plus 1, it resolves with `(("openalgo/api_key", "owner"),)`; with `0o640` as well, with `permissions` then `owner`. A symlink to a `0o600` file resolves with no warning |
| Live | The broker key from `env` with `live=True` resolves to `SYNTH` with `warnings == (("openalgo/api_key", "env_source"),)`; with `live=False` it resolves with no warning. From `file` with `live=True`: no warning. A non-broker secret, scope `frozenset({("synthetic", "token")})`, from `env` with `live=True`: no warning |
| Scope | References for `openalgo/api_key` (a `file` that exists) and `mcp/tokens` (a `file` that does not). `resolve(…, SCOPES["kernel"], …)` holds exactly `openalgo/api_key` and raises nothing for the missing `mcp` file. `resolve(…, SCOPES["operator"], …)` is empty, also when the `openalgo` file is missing. `SCOPES["kernel"]` with no `openalgo` reference: `no_reference`. Two references for `openalgo/api_key`: `malformed_reference`. The market scope equals the kernel's. With `os.open` wrapped to record paths, a `kernel` resolve opens exactly one path |
| Never written | For `Secret` and `Secrets`: `repr`, `str`, `f"{s}"`, `f"{s:>40}"`, `"%s" % s` and `logging`'s `%s` show `Secret(openalgo/api_key@v3)` and no form of the value. `json.dumps(s)` and `pickle.dumps(s)` raise `TypeError`; `canonical({"k": s})` raises `NotJsonData` naming `$.k: Secret`, with no form of the value. `copy.deepcopy(s) is s`. Setting an attribute raises. `Secret(ref, "")` raises `ValueError` |
| Scrub | `Secrets` holding `SYNTH`: a `str`, a `dict` with the value as key and as value at depth 5, a `list` and a `tuple` keep their types, with every occurrence replaced by `***`. A `Decimal("10.05")` is returned equal. Holding `ODD`: each of its four forms inside a string is replaced. Two secrets `A = "SYNTHETIC-" + h` and `B = A + "-LONGER"`, one `h`, in `"x " + B + " y"`: the result is `"x *** y"` (shortest first would leave `"x ***-LONGER y"`). An empty `Secrets` returns its input unchanged |
| Redact | `{"api_key": "plain", "note": "uses " + SYNTH, "nested": [{"Authorization": "x"}]}` gives `{"api_key": "[redacted]", "note": "uses ***", "nested": [{"Authorization": "[redacted]"}]}`. A 5,000-character string of `x` with `SYNTH` (49 characters) at offset 4,080 gives no prefix of `SYNTH` of 8 or more characters, and ends exactly with `… [truncated, 4954 chars]` (5,000 − 49 + 3) |
| Children | `OLD = "SYNTHETIC-OLD-" + uuid4().hex`, a value no reference resolves. Parent: `PATH`, `HOME`, `LC_ALL`, `PYTHONPATH`; `OPENALGO_API_KEY`, `AT__OPENALGO__AUTH__API_KEY`, `AT__openalgo__auth__api_key` and `MCP_OPENALGO__AUTH__API_KEY`, each `OLD`, so only the name rule can remove them; `SYNTH_TOKEN` (the locator of an `env` reference); `ALLOWED_X = "v=" + SYNTH`; and `RANDOM_NAME`. With `allowed={"OPENALGO_API_KEY", "MCP_OPENALGO__AUTH__API_KEY", "ALLOWED_X", "SYNTH_TOKEN"}` and `resolved` holding `SYNTH`, the result is exactly `PATH`, `HOME`, `LC_ALL` and `PYTHONPATH` with their values, plus `AT__OPENALGO__AUTH__API_KEY = ""`. The parent mapping is unchanged |
| Adapter | The module is imported in a fixture and popped after, as `tests/integration/test_openalgo_contract.py`'s `oa`. `_getaddrinfo` is monkeypatched to one loopback address, and `_open_connection` to return, at each call, one end of a new `socket.socketpair()` whose other end already holds the next scripted response with a `Content-Length` (a basket's in-send orderbook read is the next call). `OTHER = "SYNTHETIC-OTHER-" + uuid4().hex`, and `secrets` holds the key and `Secret(SecretRef("synthetic", "token", "env", "SYNTH_TOKEN", None), OTHER)`. The adapter is built with `secrets["openalgo/api_key"]` and `secrets=secrets`; requests and tickets are built as that file's cancel, close and basket cases build theirs. A cancel `k-s1` of `o-1`, ticket strategy `buyer_edge`, answered 400 `{"status": "error", "message": "bad key " + SYNTH}`: `rejected`, reason `bad key ***`. The same cancel answered 400 `{"status": "error", "message": "bad token " + OTHER}`: `rejected`, reason `bad token ***`. The first cancel answered 502 with a 5,000-byte non-JSON body holding `SYNTH` at offset 4,080: `ambiguous` (`http_502`), and its evidence's `response.text` holds no 8-character prefix of `SYNTH`. A close `k-x1` answered 200 `{"status": "success", "orderid": SYNTH}`: `acknowledged` with `broker_order_id == "***"`. A basket entry with one stop leg answered 200 with `results` rows naming `SYNTH` and `S1` and an in-send orderbook naming neither: `SYNTH` appears in no `LegResult` and the unassigned IDs are exactly `("***", "S1")`. An orderbook answered with rows `{"orderid": SYNTH, "symbol": "NIFTY-SIM-CE", …}` and `{"orderid": "o-9", "symbol": SYNTH, …}`: items with `broker_order_id == "***"` and `symbol == "***"`; `content_digest(observation.content) == observation.digest`, and publishing that content returns that digest. A `str` key raises `TypeError` for both classes. `secrets` lacking the key raises `ValueError` |
| Bytes | `SYNTH + "\n"` in a `file` reference, version `v3`, resolved with `live=True`. `comp = simulation([], credentials=secrets)`. The Adapter group's exchanges are driven with `evidence=comp.evidence`, and the observation published. A `logging.FileHandler` at `tmp_path / "kernel.log"` with `secrets.log_filter()` logs `log.error("echo %s", SYNTH)` and, inside `except`, `log.exception("failed")` for `RuntimeError(SYNTH)`. `comp.recovery.shutdown(True)`. The backup set: an `apsw` backup of the ledger to `tmp_path / "backup" / "ledger.sqlite"`, and `shutil.copytree` of the evidence directory beside it. No file under the ledger's directory, the log file or the backup directory holds any scanned form. Non-vacuous: `***` is in the evidence store and in the log file, and the ledger holds one `CREDENTIAL_BOUND` |
| Bound | In that composition: one `CREDENTIAL_BOUND`, by `kernel:recovery`, with payload exactly `{"identifier": "openalgo/api_key@v3", "source": "file", "warnings": []}`. A composition whose key came from `env` with `live=True` records `"warnings": ["env_source"]`, and still advances routinely when the other checks hold. Its sequence is after this epoch's `RELEASE_BOUND` and before its first `RECOVERY_STAGE`. A second composition on the same ledger adds exactly one more, with the second epoch's `epoch_id`. `simulation([])` writes none: its kinds equal `FRESH` |
| Replacement (CUJ-SEC-5) | Epoch 1 composes with `v3` and `[{"result": "timeout"}]`. The fixture entry is submitted through `comp.coordinator._submit_admitted` (as `tests/contracts/test_capabilities.py:80`): its command is `UNCERTAIN` and its attempt `AMBIGUOUS` (as `tests/recovery/test_crash_boundaries.py:269`). Shut down. The file is rewritten with a second synthetic value, and the reference's version set to `v4`. With `resolve` wrapped to count calls, epoch 2 composes on the same ledger with `[]`. Its `CREDENTIAL_BOUND` names `openalgo/api_key@v4`; the command is still `UNCERTAIN`; after `run_pass()` twice, `broker.calls == []`; `resolve` was called once. **No re-read:** the epoch-1 `Secret` still reveals the first value after its file was rewritten and then deleted |
| Boundary | Parsed with `ast` over `src/autonomous_trading`. A call named `Secret` appears only in `settings/secrets.py`; an attribute call `reveal` only in `settings/secrets.py` and `adapters/openalgo.py`. No `kernel/` module imports `autonomous_trading.settings.secrets`. `settings/secrets.py` imports from `autonomous_trading` only `settings.loader` |

`tests/integration/test_openalgo_contract.py` changes in its three constructor sites only (`:173`, `:756`, `:827`). Each passes `KEY_SECRET = Secret(SecretRef("openalgo", "api_key", "env", "SYNTHETIC_OPENALGO_KEY", None), KEY)` (an `env` locator, because a `file` locator's absoluteness differs by platform), with `KEY` its existing labelled synthetic value. Every expected byte string (`:331`, `:840`, `:1209`, …) and every `***` expectation (`:1285`-`:1299`) stays as it is.

### Break checks

Each mutation is applied after its anchor is checked present exactly once, run against the listed test file, and restored byte for byte with an md5 check. Each must fail a test.

| Change | Anchor | Test that must fail |
|---|---|---|
| The `env_source` warning not raised | `resolve`'s `live` and `BROKER_CREDENTIALS` test | Live |
| The `permissions` warning not raised | `resolve`'s `st_mode & 0o077` | Sources (POSIX) |
| The `owner` warning not raised | `resolve`'s `st_uid != os.geteuid()` | Sources (POSIX) |
| A `SecretUnresolvable` chained (`from None` removed) | `resolve`'s `raise … from None` on `not_utf8` | Sources (`__suppress_context__`) |
| References outside the scope read | `resolve`'s scope filter | Scope |
| No `strip()` | `resolve`'s `strip()` | Sources (`SYNTH + "\n"`) |
| `strip()` replaced by `strip("\n")` | the same | Sources (the `env` value with a leading space) |
| `reveal` re-reads its source | `Secret.reveal` | Replacement (the deleted file) |
| `Secret.__repr__` shows the value | `Secret.__repr__` | Never written |
| `Secret` picklable (both methods removed) | `Secret.__reduce__` and `Secret.__reduce_ex__` | Never written |
| `__format__` removed | `Secret.__format__` | Never written (`f"{s:>40}"` raises `TypeError`) |
| Only the raw form scrubbed | `Secrets.scrub`'s forms | Scrub (`ODD`) |
| Forms replaced shortest first | `Secrets.scrub`'s sort | Scrub (the two overlapping secrets) |
| `redact` truncates before scrubbing | `Secrets.redact`'s order | Redact |
| The log filter keeps `record.args` | `ScrubFilter.filter`'s `record.args = ()` | Bytes (the log file) |
| The log filter ignores `exc_info` | `ScrubFilter.filter`'s `exc_info` branch | Bytes (the log file) |
| The broker names not popped | `child_environment`'s `env_path(n) == BROKER_KEY_PATH` loop | Children |
| A fixed name list in place of `env_path` | the same loop, over legacy's three upper-case names | Children (`AT__openalgo__auth__api_key`) |
| The mask not set | `child_environment`'s `BROKER_KEY_MASK` | Children |
| The removal by value dropped | `child_environment`'s `resolved` test | Children (`ALLOWED_X`) |
| The adapter truncates before scrubbing | `adapters/openalgo.py`, `_send`'s `{"text": …}` | Adapter (the 502 body); Bytes |
| A single send maps the unscrubbed parse | `_send`'s `self._scrub(_parse_exact(text))` | Adapter (the close's acknowledged ID) |
| A basket maps the unscrubbed parse | `_send_basket`'s `self._scrub(_parse_exact(text))` | Adapter (the basket's unassigned ID) |
| The read maps the unscrubbed parse | `_read`'s `self._scrub(_parse_exact(text))` | Adapter (the orderbook items); Bytes |
| The adapter accepts a `str` key | `_Http.__init__`'s `isinstance(api_key, Secret)` | Adapter |
| The adapter scrubs only its key | `_Http.scrub`'s `self._secrets.scrub` | Adapter (`bad token ***`) |
| `CREDENTIAL_BOUND` carries the value's SHA-256 | `Secrets.bound()`'s triple | Bound; Bytes |
| `CREDENTIAL_BOUND` recorded after the routine advance | `run()`'s `_bind_credentials()` call | Bound |
| A `Secret` built outside its module | a `Secret(` call added to `bootstrap.py` | Boundary |
| `reveal` called in the kernel | a `.reveal()` call added to `kernel/recovery.py` | Boundary |

A cancel never returns the response's ID (`_classify`, `adapters/openalgo.py:619-622`, `:630`), so the cancel cases cannot catch an unscrubbed parse. The close and the basket cases in the Adapter group exist for the two parse rows.

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/settings/secrets.py` | New: `SOURCES`, `SecretRef`, `parse_references`, `SecretUnresolvable`, `Secret`, `Secrets` (`scrub`, `redact`, `bound`, `log_filter`), `ScrubFilter`, `BROKER_CREDENTIALS`, `SCOPES`, `MAX_SECRET_BYTES`, `resolve`, `BASE_ENV`, `env_path`, `BROKER_KEY_PATH`, `BROKER_KEY_MASK`, `child_environment`, legacy's redaction copied |
| `src/autonomous_trading/adapters/openalgo.py` | `_Http` takes a `Secret` and `secrets`; both classes' `secrets`; the market source's `TypeError`; parses scrubbed before mapping; scrub before truncation |
| `src/autonomous_trading/kernel/recovery.py` | `credentials`, `_bind_credentials`, its call in `run` |
| `src/autonomous_trading/kernel/ledger/store.py` | `_FAMILY` |
| `src/autonomous_trading/kernel/ledger/projections.py` | `_NO_ROWS` |
| `src/autonomous_trading/resources/events.schema.json` | `CREDENTIAL_BOUND` |
| `src/autonomous_trading/bootstrap.py` | `compose_simulation`'s `credentials` |
| `config/live.example.yaml` | New: the header and `secrets` only |
| `tests/unit/test_secret_references.py` | New (T-61) |
| `tests/integration/test_openalgo_contract.py` | The three constructors take `KEY_SECRET` |

No new tree delta. `settings/secrets.py` and `config/live.example.yaml` are in the target tree, and the test file is T-61.

### Completion conditions (step 3)

* Every test passes twice in a row with the whole suite, on Windows and on Linux. The POSIX cases count only from the Linux run.
* Every break check fails a listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file, `json.loads` on `resources/events.schema.json`, and `yaml.safe_load` on `config/live.example.yaml`.
* `git diff --name-only` names exactly the files in the table above, in one commit.
* No file in the commit holds a secret value: the synthetic values exist only at run time.
* The build starts on the coordinator's word, and every cited line is re-read on the head the build starts from.
* PRF-SEC-04 passes. Every earlier test passes with no expectation changed beyond the three constructor sites.
* The spec's Secrets section and this file record step 3 "as built", with any Deviation or Fork call found while building.

### Step 3 as built

**In plain words.** Keys and passwords now come from references read once at start. The broker key is used exactly as today, and the cases in which today's system traded are recorded as warnings, never refusals. The key reaches no record, error, log or backup the system writes, even when OpenAlgo echoes it, and no child process. All 1,321 automatic checks pass.

Commit `ba2face` on `slice-08`, after `53b7d97` (SLICE-08 step 6), which touched none of the cited files. It changes exactly the ten files in the step's table (+1,043 −30). Nothing is pushed.

**Choices made while building:**

| Topic | As built |
|---|---|
| Children test | `allowed` also names `AT__openalgo__auth__api_key`. Without it the allow-list drops that name anyway, so "a fixed name list in place of `env_path`" could not fail |
| Replacement test | The simulation without admission ports composes no dispatch, so `run_pass()` is not called. `broker.calls == []` after recovery's `coordinator.recover()`. No re-read is also proven by recording `os.open`: epoch 2 never opens the key's path |
| Adapter test | `ObservedOrder`'s field is `instrument`, not `symbol`. The basket uses the fixture plan with one stop leg and an empty in-send orderbook |
| No credentials | `kinds(simulation([])) == FRESH` |
| Contract test | Besides its three constructors, it imports `Secret` and `SecretRef` and defines `KEY_SECRET` beside `KEY` |
| Module extras | `WARNINGS`, `MARKER`, `Secrets.contains_secret` (used by `child_environment`), and `Secret.__delattr__` |
| Break anchors | "The adapter scrubs only its key" mutates `_Http.__init__`'s `self._secrets = secrets`. "The log filter keeps `record.args`" mutates the filter to scrub only the format and keep the arguments: removing `args = ()` alone makes `logging` fail to stderr, which no file check sees. "The adapter accepts a `str` key" wraps the string in a `Secret` |

**Tests:** `tests/unit/test_secret_references.py`, 16 test functions. On Windows, 15 passed and 1 skipped (the POSIX case). On Linux, all 16 passed: a throwaway worktree off the EC2's `~/OA_NEW`, with `~/at-dev`'s venv through `safe_pytest.py`, removed afterwards. The whole suite on Windows, once after the last edit: **1,321 passed, 2 skipped**, in 169.2 s. `ast.parse` passes on the eight edited Python files, `json.loads` on the event schema, and `yaml.safe_load` on the example.

**Break checks** (`s10c_breaks.py` in the session scratchpad; anchors checked first, one mutation at a time, every file restored byte for byte, md5 verified). On Windows 28 of 28 failed a listed test. The two POSIX rows (`permissions` and `owner` not raised) ran on Linux: 2 of 2 failed `test_sources_warn_never_refuse`.

## Step 4 — kill inputs

<a id="step-4--kill-inputs-outline"></a>

The authorities are the spec's [Kill inputs](../../design/security-and-operator.md#kill-inputs) section, CUJ-SEC-6, and F-SEC8 and F-SEC11 in its [failure modes](../../design/security-and-operator.md#failure-modes-and-crash-points). Step 4 builds on steps 2 and 3 as built (`cb439ce`, `ba2face` on `slice-08`). It uses step 2's kill-input exemption (`kernel:safety` may engage kill, with reason `kill_file` or `kill_flag` only) and step 1's `kill_release` door rule. It adds no socket, process or event kind. The check is plain file and setting reads, so every case runs on Windows and Linux. Every `OA_NEW` citation is at `ba2face`; every legacy citation is at 445eb116 (`deploy/at` and `config/defaults.yaml` opened with `git show`).

**In plain words.** The kill file and the kill setting work as today. Create the file, or set `risk_guard.kill_switch`, and the kernel stops trading before its next order. It does so at start, on every pass and before every send, even if nothing else is running, and it writes down that it did. `at kill-switch on` writes the file first, with today's text, so stopping never waits on any service. It also tells the kernel when it can. `at kill-switch off` asks you to type `DISENGAGE`, removes the file, and asks the kernel to lift kill. Deleting the file alone no longer lifts kill, as you accepted, and kill cannot be lifted while the file or the setting is still there. If the setting names no kill file, trading still starts, as today. The start raises an alert, and `at kill-switch on` tells you trading is not stopped unless the kernel recorded kill. You can still cancel and close your own orders under kill, as today.

### Decisions

#### The inputs (`kernel/safety.py`)

* `KillInputUnreadable(Exception)` carries the path it could not check.
* `KillInputs`, exactly:

  ```python
  @dataclass(frozen=True, slots=True)
  class KillInputs:
      flag: bool
      files: tuple[str, ...]
  ```

  `__post_init__` raises `ValueError` unless `flag` is a `bool` (no other type), and `files` is a tuple of distinct `str` paths, each absolute (`os.path.isabs`), possibly empty. The property `watched` is `bool(self.files)`.
* **The deployment root.** One fixed directory that does not change between releases (SLICE-11 installs it; releases live beneath or beside it), shared by the kernel, the CLI and the MCP process. Legacy resolved against the repository root, which an in-place update left unchanged (`src/core/framework/execution/killswitch.py:68-85`). Resolving against a release directory would move the kill file at every release, so a `touch` of the old path would stop nothing.
* `KillInputs.resolve(flag, texts, root) -> KillInputs` builds it from the settings, and is the only builder: the kernel, the CLI (below) and the MCP process (step 8) each call it with the same settings and the same `root`.
  * Each text is stripped, and an empty one is skipped. `~` is expanded.
  * An absolute path is kept; a relative one is joined to `root`.
  * Duplicates are dropped, keeping first-seen order.
  * `root` must be absolute (`ValueError`).
* `present() -> str | None` is legacy's `engaged` order (`killswitch.py:88-100`): `"kill_flag"` when `flag` is set, else `"kill_file"` when any file exists, else `None`.
  * **Exists** means `os.stat(path)` succeeds, for a file, a directory or anything else, as legacy's `Path(path).exists()` (`killswitch.py:100`).
  * **Absent** is exactly what that call treats as absent on legacy's runtime, Python 3.13.5 on the live host (`pathlib._abc._ignore_error`, read there):
    * an `OSError` whose `errno` is `ENOENT`, `ENOTDIR`, `EBADF` or `ELOOP`;
    * an `OSError` whose `winerror` (read with `getattr`) is 21, 123 or 1921;
    * a `ValueError` (a path the platform cannot encode, such as one holding NUL).
  * Every other `OSError` raises `KillInputUnreadable(path)`.
  * Nothing is cached: every call reads, because the file must be able to appear while the kernel runs (`killswitch.py:92-94`).
* `present_files() -> tuple[str, ...]` lists the files that exist, by the same rule.
* `present_inputs() -> tuple[str, ...]` names what is present: `"risk_guard.kill_switch"` when the flag is set, then `present_files()`. A path whose check raises is named as `"<path> (unreadable)"`.

#### The check (`kernel/safety.py`)

* `SAFETY_AUTH = Authenticated(SAFETY, "in_process", request=None, via=None)`, built once in `kernel/safety.py`. The file joins the `Authenticated(` builder set in `tests/contracts/test_capabilities.py`, as step 2 said (`_BUILDERS`).
* `Safety(…, kill_inputs: KillInputs | None = None)` keeps it as `self.kill_inputs`. `None` means not composed: the check does nothing.
* `Safety.present_kill_inputs() -> tuple[str, ...]` is `self.kill_inputs.present_inputs()`, or `()` when none are composed. The CLI's link reads it, so a refusal and the status name the kernel's own paths.
* `check_kill_inputs() -> str` returns one of these, in this order:
  * `"off"` when no inputs are composed, or when `self.authority.stage()` is neither `RECOVERY_WRITING` nor `OPERATING` (nothing is read);
  * `"unreadable"` when `present()` raises (nothing recorded);
  * `"absent"`;
  * `"held"` when an input is present and `killed()` is already true (nothing recorded);
  * `"engaged"` after `engage_kill(SAFETY_AUTH, reason)` commits, where `reason` is `present()`'s answer.

  A `LED-R09` from that commit (kill engaged since `killed()` was read) is also `"held"`. Any other refusal is impossible for `kernel:safety` in `RECOVERY_WRITING` or `OPERATING` (`BUILTIN`, step 2), and raises `WriterLost`, as every failed kernel commit does. The event is `KILL_ENGAGED` with payload `{"reason": "kill_file" | "kill_flag", "principal": ["kernel:safety", "kernel"]}` and no `OPERATOR_REQUEST`.
* `self.kill_input_state` keeps the last answer, for status reads (step 6).

#### Where the kernel checks (`kernel/coordinator.py`, `kernel/recovery.py`)

| Where | Call | When the answer is `"unreadable"` |
|---|---|---|
| `Coordinator.run_pass`, after the returns and `observation_loop.drain()` (`kernel/coordinator.py:418`) and before the stage test (`:419`), when `self.safety` is not `None` | `self.safety.check_kill_inputs()` | The pass returns at once, as a non-`OPERATING` pass does (`:419-420`): no protection, no sweep, no claim |
| In the claim loop, right before `self._revalidate(…)` (`:459`) | the same | The loop stops; the command and every later one wait this pass |
| `Coordinator.dispatch_inline`, before `self._revalidate(cmd, inline=True)` (`:370`) | the same | `Outcome(key, None, "not_sent", "unchanged", "none", {}, None, False, None)`, as the `WAIT` ticket returns (`:377-378`): nothing claimed and no refusal recorded |
| `Recovery.run`, right after `self._bind_credentials()` (`kernel/recovery.py:173`), in `RECOVERY_WRITING` | the same, through `self.coordinator.safety` | Nothing recorded |
| `Recovery._advance_record` (`:376-380`), before its `RECOVERY_STAGE` | the same | Nothing recorded; the advance proceeds, and the first pass then claims nothing |

* A present input is therefore recorded as `KILL_ENGAGED` before the claim. The claim is then refused by the kill matrix at revalidation (`kernel/safety.py:472-480`; `kernel/coordinator.py:298-300`). The owner's cancel and close under kill keep their matrix rows (`safety.py:473-476`).
* **Fork call (an unreadable input sends nothing).** Legacy's guard raised at the send boundary when the check itself failed (`killswitch.py:99-100`, `:111`), so nothing was sent while the error lasted, and nothing was recorded. The target claims nothing while it lasts and records nothing. It neither engages kill nor treats the input as absent.
* `Recovery.run` adds `"kill_inputs"` to its report when inputs are composed: the answer of its own start check, the call after `_bind_credentials()` (`"absent"`, `"held"`, `"engaged"` or `"unreadable"`). It appends the alert `kill_file_unwatched` to `self.alerts` when `watched` is false.
* "On each wake" is met by the pass check: the host (SLICE-11) runs `run_pass` on every wake.

#### Release: `SEC-R16` (`kernel/safety.py`, `kernel/authority.py`)

* `_MESSAGES` (`kernel/authority.py:81-87`) gains `"SEC-R16": "kill_input_present"`.
* `_commit` gains one keyword: `_commit(self, auth, use, kind, payload, texts, *, target, args, kill_reason=None, after_auth: Callable[[], Refusal | None] | None = None)`. It calls `after_auth()` **after** bind, after `_authorized` and after the text guard (`kernel/safety.py:229-239`), and before the commit. A `Refusal` it returns is returned through `self.authority.refused(auth, refusal)`. Only `release_kill` passes it, as `after_auth=self._kill_input_check`.
* `_kill_input_check()`: when `self.kill_inputs` is composed and `present()` is not `None`, the release is `Refusal("SEC-R16", "kill_input_present", None, "KILL_RELEASED")`, returned through `authority.refused` (so a bound request records `OPERATOR_REQUEST_REFUSED` once). A person without `kill_release` therefore still gets `SES-R02`, and learns nothing about the inputs.
* When `present()` raises `KillInputUnreadable`, the release is also `SEC-R16`: an input the kernel cannot read may be present, and legacy stayed engaged while its check failed.
* **Deviation — kill file removal** (the slice-level Deviation, accepted by the owner: [combined answers](../../decisions/owner-answers-2026-10-27.md#combined-answers-slices-0914-2026-10-30), "Stricter behaviours"). Kill is ledger state. Removing the file releases nothing; only `KILL_RELEASED` by a principal holding `kill_release` does.

#### Settings (`settings/schema.py`, `settings/loader.py`, `resources/defaults.yaml`)

* `Settings` gains `kill_switch: bool = False` and `kill_switch_files: tuple[str, ...] = ()`, the raw texts. They are plural because the environment may name more than one (below). Both have defaults, as legacy shipped `false` and `""` (`config/defaults.yaml:132-133`). They are not refusing settings.
* `resources/defaults.yaml` gains `risk_guard: {kill_switch: false, kill_switch_file: ""}`.
* `settings/secrets.py`'s `_ENV_ALIASES` gains legacy's two kill aliases, `"MCP_KILL_SWITCH": "risk_guard.kill_switch"` and `"MCP_KILL_SWITCH_FILE": "risk_guard.kill_switch_file"` (`src/config/__init__.py:115-116`). Its `env_path` stays legacy's rule. `child_environment` compares only with `BROKER_KEY_PATH`, so it does not change.
* `loader.resolve` reads both keys (importing `env_path` inside the function, since `settings.secrets` imports the loader):
  * **Names.** Every environment name `n` with `env_path(n) == "risk_guard.kill_switch"` (or `…_file`): the alias, `AT__RISK_GUARD__KILL_SWITCH` in any letter case after `AT__`, and `MCP_RISK_GUARD__KILL_SWITCH`. When at least one is set, the environment replaces the YAML value, as legacy's overrides did (`src/config/__init__.py:441-444`, `:452-462`).
  * **The flag's value** is legacy's coercion then `bool` (`_coerce`, `src/config/__init__.py:232-261`; `killswitch.py:97`). The text is stripped and lower-cased:
    * `1`, `true`, `yes`, `on` engage;
    * `0`, `false`, `no`, `off`, `""`, `none`, `null` do not;
    * an integer or a float engages unless it is zero;
    * a JSON array or object engages unless it is empty;
    * any other text engages.

    A YAML value engages if and only if `bool(value)`, as legacy read the setting (`killswitch.py:96-97`): `false`, `null`, `0`, `""` and empty collections do not; any other value does, a quoted `"false"` included.
  * **The file's value:** the stripped text; `""`, `none` and `null` name no file.
  * **Order.** The names that are set are taken in code-point order of the name (`sorted`), and their values read in that order.
  * **More than one name set** (legacy applied them in environment order, last wins, `:456-460`, which is not reproducible): the flag engages if any value engages. Every distinct file text is kept, in that order, with later duplicates dropped. For `MCP_KILL_SWITCH_FILE=/k1` and `AT__RISK_GUARD__KILL_SWITCH_FILE=/k2`, `kill_switch_files == ("/k2", "/k1")`, because `AT__…` sorts before `MCP_…`.
  * Nothing here raises: no value of either key refuses to load.
* **Fork call (legacy's kill keys, names and coercion).** Both keys, legacy's aliases and generic names, legacy's coercion, and the environment over YAML are kept. Where legacy's answer depended on environment order, the target resolves towards stopping. Neither input can be turned into a refusal to start.

#### No kill file named: an alert, not a refusal

* A composition whose `KillInputs.watched` is false starts as legacy did, with the flag still read (`config/defaults.yaml:133`; `deploy/at:4252-4257`). `Recovery.run` raises the alert `kill_file_unwatched`.
* **Fork call (no new start gate).** This is the slice-level "Fork call — empty kill path", and the spec's Kill inputs section, its policy inputs and PRF-SEC-12 now say the same. A refusal would stop real trading in a case where legacy traded. The CLI's loud "not stopped" message (below) keeps legacy's warning to the person.

#### The composition (`bootstrap.py`)

`compose_simulation(…, kill_inputs: KillInputs | None = None)` passes it to `Safety` (`bootstrap.py:220-222`). It raises `ValueError` when `kill_inputs` is given and either `admission is None` (no kernel `Safety` is composed, so the inputs would be read by nothing) or `admission.safety is not None` (a fixture safety port would judge the claim instead of the kernel's matrix). The simulation composes none unless a test passes one, so `FRESH` and every existing kind list are unchanged. SLICE-11's live composition always passes `KillInputs.resolve(settings.kill_switch, settings.kill_switch_files, <the fixed deployment root>)`.

#### The CLI (`interfaces/cli.py`)

A new module holding the `kill-switch` command only. Step 6 adds the other commands, the operator-process link and `__main__.py`. It imports `kernel.safety.KillInputs`, `interfaces.authorization.LEGACY_DOORS`, and `contracts` types.

* `KernelUnreachable(Exception)`.
* `KernelLink`, a protocol of four methods:
  * `kill_engaged() -> bool`;
  * `present_inputs() -> tuple[str, ...]`, the kernel's `Safety.present_kill_inputs()`;
  * `engage(reason: str) -> Committed | Refusal`;
  * `release(typed: str, reason: str) -> Committed | Replayed | Refusal`.

  Each raises `KernelUnreachable` when the kernel cannot be asked. Step 6 implements it over the operator process. Until then the link is `None`, which every action treats as unreachable.
* `cli_inputs(settings, root) -> KillInputs` is `KillInputs.resolve(settings.kill_switch, settings.kill_switch_files, root)`, the kernel's own builder with the same fixed deployment root, so the CLI writes and removes exactly the files the kernel watches.
* `kill_switch(action, *, settings, root, link, out, ask, user, now) -> int`:
  * `inputs = cli_inputs(settings, root)`;
  * `fallback` is `<root>/run/KILL`, legacy's unwatched path (`deploy/at:4256`, `RUN_DIR`, `:36`);
  * `ask(prompt) -> str | None` returns the typed line, or `None` with no terminal (legacy's `[ -t 0 ]`, `deploy/at:724`);
  * `user` is the login name (`getpass.getuser()`, legacy's `id -un`);
  * `now` is an aware UTC `datetime`.
* Actions and their legacy aliases (`deploy/at:4258-4285`): `on` and `engage`; `off`, `clear` and `disengage`; `status`, the default. Any other action prints `usage: at kill-switch [on|off|status]` and returns 1.

**`on`** — the file first, so stopping never waits on a service:

1. Targets are every path in `inputs.files`, or `[fallback]` when none is watched. For each target, `os.makedirs(parent, exist_ok=True)`, then write `engaged by <user> at <now as %Y-%m-%dT%H:%M:%SZ>\n` (`deploy/at:4260-4261`). An `OSError` from either the `makedirs` or the write prints `could not write <path>: <strerror>`, counts that target as not written, and continues with the next.
2. Then `link.engage("at kill-switch on")`:

   | Kernel answer | Line printed |
   |---|---|
   | `Committed` | `the kernel recorded kill` |
   | `LED-R09` | `the kernel already had kill engaged` |
   | Unreachable or `None` | `the kernel was not told (not reachable); it engages from the file before its next claim` |
   | Another refusal | `the kernel refused the record (<code> <label>)` |
3. The result, decided in this order (the first that applies):
   1. No target was written: it returns 1, whatever the kernel answered.
   2. Watched and at least one file written: it prints `KILL SWITCH ENGAGED — the kernel refuses every new order` and returns 0, whatever the kernel answered (recorded, already engaged, unreachable, or another refusal). The written file stops trading before the next claim.
   3. Not watched, and the kernel recorded kill or already had it: it prints `kill is recorded, but no kill file is watched: a later touch would not stop trading` and returns 0.
   4. Not watched otherwise (unreachable, `None`, or another refusal): it prints legacy's warning (`deploy/at:4265-4269`): `FILE WRITTEN, BUT TRADING IS NOT STOPPED`, `no kill-switch file is configured, so the kernel is watching nothing.`, and `set risk_guard.kill_switch_file (or MCP_KILL_SWITCH_FILE) to <fallback>, then restart`. It returns 1.

**`off`** — confirm, remove, then release:

1. `inputs.flag` set: it prints `kill stays engaged: risk_guard.kill_switch is set; unset it first` and returns 1, asking nothing.
2. No file present, and the link answers `kill_engaged() == False`: it prints `it was already off — nothing to do` (`deploy/at:4274`) and returns 0, asking nothing.
3. It prints `This removes a safety gate and re-enables every new order.` and asks `Type DISENGAGE to confirm`, the door rule's prompt (`LEGACY_DOORS[("owner-cli", "kill_release")]`).
4. Unless `typed is not None and rule.trimmed(typed) == rule.text` (spaces and tabs trimmed, exact case; `""` never matches, step 1), it prints `cancelled — kill switch stays engaged` (`deploy/at:4279`) and returns 1. The file is untouched.
5. It removes every file in `present_files()`. A missing file is no error; a removal that raises prints `could not remove <path>: <strerror>`, and kill stays engaged.
6. `link.release(typed, "at kill-switch off")`, with the raw typed text, which step 1's `Authorizer` checks again:

   | Kernel answer | Line printed | Returns |
   |---|---|---|
   | `Committed` or `Replayed` | `the block is lifted — new orders are allowed again` (`deploy/at:4280`) | 0 |
   | `SEC-R16` | `kill stays engaged: still present: <link.present_inputs(), comma-separated>`, the kernel's own paths (local `present_inputs()` when the link cannot be asked a second time) | 1 |
   | `LED-R09` | `it was already off — nothing to do` | 0 |
   | Unreachable or `None` | `the file is removed, but kill stays engaged in the ledger until the kernel records the release: run at kill-switch off again when the operator process is up` | 1 |
   | Another refusal | `kill stays engaged: <code> <label>` | 1 |

**`status`** — the inputs are the kernel's `link.present_inputs()`, or the local `inputs.present_inputs()` when the link cannot be asked:
* for each present file, `ENGAGED  <path>  <its first line>` (`deploy/at:4282`);
* for the flag, `ENGAGED  by risk_guard.kill_switch`;
* for an unreadable path, `cannot check <path>`.

Then `ENGAGED  in the ledger` when `kill_engaged()` is true, or `the kernel is not reachable: its kill state is unknown` when it cannot be asked. When nothing is engaged, `trading is not blocked` (`deploy/at:4283`). It returns 0.

* **Fork call (the CLI's file half).** `on` writes with legacy's content, with no prompt and no service. `off` asks legacy's `DISENGAGE` with legacy's prompt and trim (step 1's row). The unwatched case keeps legacy's loud message and exit 1 when trading is not stopped.
* **Deviation — the kernel half.** `on` also records `kill_engage` for the person, and `off` releases through the kernel, so the release is recorded. `off` no longer stops at "no file" (`deploy/at:4274`) unless the kernel also reports kill released, because kill is ledger state.

#### Fork calls and deviations in this step

* **Fork calls**, each named above:
  * legacy's kill keys, names and coercion, resolving towards stopping;
  * an unreadable input sends nothing;
  * no kill file named is an alert, not a refusal;
  * the CLI's file half.

  Also unchanged: the owner's cancel and close under kill (the matrix), and that the file needs no permission check (the spec).
* **Deviations:**
  * kill file removal releases nothing (accepted by the owner);
  * `SEC-R16`;
  * `KILL_ENGAGED` by `kernel:safety` records what legacy only read;
  * the CLI's kernel half.
* No score, threshold or money value is set.

#### What later steps take from step 4

* **Step 5:** no change. The kill check is in-process.
* **Step 6:** the operator process implements `KernelLink` over the kernel channel and composes the CLI's `main` with the fixed deployment root; status reads `Safety.kill_input_state`.
* **Step 8:** the MCP process builds the same `KillInputs` with `KillInputs.resolve` and the same fixed root, and reads the ledger's kill state, so its write tools refuse at once (the spec).
* **SLICE-11:**
  * fixes one deployment root that does not change between releases, and passes it to the kernel, the CLI and the MCP process alike;
  * runs `run_pass` on every wake;
  * surfaces the `kill_file_unwatched` alert;
  * installs a kill-file directory the kernel's user can read and the operators' group can write.

### Tests

`tests/integration/test_kill_inputs.py` (tree delta **T-68**) holds PRF-SEC-12, CUJ-SEC-6, F-SEC8 and F-SEC11. Every case runs on Windows and Linux.

**Synthetic values.**
* The kill file is `tmp_path / "run" / "KILL"`, the root `tmp_path`, and the user `synthetic-user`.
* The CLI's `now` is `datetime(2026, 11, 2, 9, 15, tzinfo=timezone.utc)`, so its content is exactly `engaged by synthetic-user at 2026-11-02T09:15:00Z\n`.
* Worlds are `admission_world(…, kernel_safety=True, kill_inputs=…)` and `action_world(…, kernel_safety=True, kill_inputs=…)`, so the claim uses the kernel's matrix. An entry is `world.request(make_intent(), "k-1")`, admitted through `coordinator.admit_entry`. `ACK = [{"result": "ack", "order_id": "E1"}]`.
* `SimulationLink(comp, uid)` is the test's stand-in for step 6's link:
  * `engage` and `release` call `operator_call` with `CliEvidence(uid, 4242, None)`, then `comp.safety.engage_kill` or `release_kill`;
  * `kill_engaged` is `comp.safety.killed()`, and `present_inputs` is `comp.safety.present_kill_inputs()`;
  * a `Down` link raises `KernelUnreachable` from every method.
* `KILL_SETTINGS` is a `Settings` built as the fixture builds one, with `kill_switch_files=("run/KILL",)`. Its inputs are `KillInputs.resolve(False, ("run/KILL",), tmp_path)`, and the CLI gets the same `settings` and `root=tmp_path`.

| Group | Cases |
|---|---|
| Inputs | `KillInputs.resolve(False, ["run/KILL"], tmp_path).files == (str(tmp_path / "run" / "KILL"),)`. After `os.chdir` to another temporary directory, it still names that path. `" "` and `""` are skipped. A duplicate is dropped. `~/x` expands. A relative `root` raises `ValueError`. `present()`: `None` with nothing; `"kill_file"` with the file; `"kill_file"` with a directory at the path; `"kill_flag"` with the flag alone and with flag and file together. With `os.stat` monkeypatched for the path to raise, one case each: `OSError(errno.ENOENT, …)`, `ENOTDIR`, `EBADF` and `ELOOP` give `None`; an `OSError` subclass whose class attribute `winerror` is 21, 123 or 1921 (errno 0) gives `None`; `ValueError` gives `None`; `PermissionError` (`EACCES`) and `OSError(errno.EIO, …)` raise `KillInputUnreadable` naming the path. A path holding NUL, with `os.stat` not patched, gives `None`. `present_inputs()` with flag and file: `("risk_guard.kill_switch", <the file>)`. `KillInputs(1, ())` and a relative file raise `ValueError` |
| Same files | With `KILL_SETTINGS` and `root=tmp_path`, `cli_inputs(settings, tmp_path)` equals the kernel's `comp.safety.kill_inputs`. That holds for `("run/KILL",)` and for an absolute text. `kill_switch("on", settings=KILL_SETTINGS, root=tmp_path, link=None, …)` writes exactly `comp.safety.kill_inputs.files`. The next pass records `KILL_ENGAGED` (`kill_file`). `status` with a `SimulationLink` names that path |
| Settings | `resolve("test", env)` with no environment: `kill_switch is False`, `kill_switch_files == ()`. Flag text to value, one case each: `1`, `true`, `Yes`, `on`, `2`, `0.5`, `[0]` and `maybe` engage; `0`, `false`, `OFF`, `no`, `""`, `none`, `null`, `0.0`, `[]` and `{}` do not. Under `MCP_KILL_SWITCH`, `AT__RISK_GUARD__KILL_SWITCH`, `AT__risk_guard__kill_switch` and `MCP_RISK_GUARD__KILL_SWITCH` alike. `MCP_KILL_SWITCH_FILE=/k1` and `AT__RISK_GUARD__KILL_SWITCH_FILE=/k2`: `kill_switch_files == ("/k2", "/k1")`. `MCP_KILL_SWITCH_FILE=none` names none. `MCP_KILL_SWITCH=0` with `AT__RISK_GUARD__KILL_SWITCH=1` engages. **YAML** (with `loader._defaults` monkeypatched): `kill_switch: "false"` (a quoted string) engages; `false`, `null`, `0` and `""` do not; `1` engages. No value raises |
| Pass (F-SEC8) | `admission_world(ACK)` with the file inputs. Admit `k-1`; create the file; `dispatch(world)`. `KILL_ENGAGED` by `kernel:safety`, reason `kill_file`, comes before `DISPATCH_REFUSED` of `k-1` (code `PRT-R01`, dependency `safety`). `broker.calls == []` |
| Wake | The same world with no admitted command: create the file, then one `run_pass()`. One `KILL_ENGAGED` is recorded. A second pass records nothing more (`"held"`). **Stage:** a fresh world with the file present, its `recovery.stage` set to `"INSPECTING"` by hand: `check_kill_inputs()` returns `"off"`, records nothing and raises nothing |
| Composition | `compose_simulation` with `kill_inputs` and `admission=None`: `ValueError`. With `admission_ports(kernel_safety=False)` (a fixture safety port): `ValueError`. With `kernel_safety=True`: composes |
| Claim | Admit `k-1`. Wrap `comp.safety.kill_inputs` in `TouchAfter(inputs, calls=1)`, whose `present()` creates the file after answering its first call. One `run_pass()`: the pass-top check answers absent, the claim check engages, and `k-1` is `DISPATCH_REFUSED` `PRT-R01`. `broker.calls == []` |
| Inline | `admission_world(ACK)` built with no file. Then create the file, and call `coordinator._submit_admitted(fixture_entry.request, fixture_entry.application, fixture_entry.plan)`. The outcome is refused with `PRT-R01`, `KILL_ENGAGED` is recorded first, and `broker.calls == []`. **Unreadable:** a second world, with `os.stat` raising `PermissionError` for the path: the outcome is `not_sent` with canonical `"unchanged"`, no `DISPATCH_REFUSED` and no `KILL_ENGAGED` is written, and `broker.calls == []` |
| Start (CUJ-SEC-6, F-SEC11) | A world on the ledger; admit `k-1`; `comp.recovery.shutdown(True)`. Then `kill_switch("on", …, link=None)` returns 0. The file holds exactly the synthetic content. The output names "not reachable". Reopen on the same ledger with the file inputs and `reopen=True`. In the new epoch, `KILL_ENGAGED` by `kernel:safety` (`kill_file`) comes before that epoch's first `RECOVERY_STAGE`, and `report["kill_inputs"] == "engaged"`. `dispatch(world)` refuses `k-1` with `PRT-R01`, and `broker.calls == []` |
| Advance | A world that authorizes nothing before `OPERATING`: `simulation([], advance=False, grant=False, calendar=admission_calendar(), admission=admission_ports(kernel_safety=True), kill_inputs=…)`. A first epoch's routine check 2 declines, so the stage stays `RECOVERY_WRITING`, with no file at start. Create the file. `owner_advance(comp)` commits. `KILL_ENGAGED` by `kernel:safety` is the event immediately before that `RECOVERY_STAGE` to `OPERATING`, each in its own decision |
| Flag | Inputs `KillInputs(True, (), tmp_path)`: one pass records `KILL_ENGAGED` with reason `kill_flag`. With flag and file together: `kill_flag` |
| Release | Kill engaged from the file. The owner's bound `kill_release` (`DISENGAGE` typed) while the file exists: `SEC-R16`, with one `OPERATOR_REQUEST_REFUSED`. Remove the file; the same call with a new nonce commits `KILL_RELEASED`. With the flag set: `SEC-R16`. `ops` (uid 1003, no `kill_release`) with the file present: `SES-R02`, not `SEC-R16`. With `os.stat` raising `PermissionError`: `SEC-R16` |
| File removal | Kill engaged from the file. Delete the file and run two passes: kill is still engaged, a newly admitted `k-2` is refused `PRT-R01`, and no `KILL_RELEASED` exists |
| Unreadable | Admit `k-1`; monkeypatch `os.stat` to raise `PermissionError` for the path; `run_pass()`. Nothing is claimed, no `KILL_ENGAGED` is written, `broker.calls == []`, and `k-1` is still `ADMITTED`. Restore `os.stat`, with no file: the next pass claims `k-1` |
| Unwatched | A world with `KillInputs(False, (), tmp_path)` starts and advances routinely when its checks hold. `recovery.alerts` holds `kill_file_unwatched`. `report["kill_inputs"] == "absent"` |
| Owner under kill | `action_world([{"result": "ack", "order_id": "o-stop"}, {"result": "ack", "order_id": "C1"}], kernel_safety=True, kernel_conflicts=True, kill_inputs=…)`. In order: (1) Create the file and run `run_pass()`: `KILL_ENGAGED` (`kill_file`). (2) An entry `k-e1` by `TEST_PRINCIPAL` is refused at admission, `PRT-R01`. (3) The owner's close `k-x1` naming `E1` (`action_auth`, the owner on the CLI) is admitted, then **waits** on `dispatch(world)`: the entry's protective stop `o-stop` still rests, and conflict row 3 holds a market close while a resting protective order exists (`kernel/safety.py:548-549`). (4) The owner's cancel `k-c1` of `o-stop` is admitted, and `dispatch(world)` claims and sends it, allowed under kill for a human cancel of an order with quantity remaining (`kernel/safety.py:473-474`). (5) Set the observation to show `o-stop` cancelled (`world.orders` with `o-stop` in state `cancelled`, then `world.fresh()`), and `dispatch(world)` again: `k-x1` is claimed and sent. `broker.calls` holds the cancel then the close, and nothing else |
| CLI on | Watched, link `None`: returns 0; the content is exact; the output holds `KILL SWITCH ENGAGED` and `not reachable`. Watched, with a `SimulationLink` to the owner (uid 1001): returns 0, and `KILL_ENGAGED` is by `owner` with args reason `at kill-switch on`. **File first:** a link whose `engage` asserts the file already exists passes. Unwatched, link `None`: the fallback is written; the output holds `FILE WRITTEN, BUT TRADING IS NOT STOPPED` and the `set risk_guard.kill_switch_file` hint; returns 1. Unwatched, with a `SimulationLink`: returns 0 with the "no kill file is watched" line. The file's parent unwritable (`os.makedirs` monkeypatched to raise `PermissionError`): the output names `could not write`, it returns 1, and the link is still asked. A link whose `engage` returns `Refusal("SES-R02", "grant_scope", None, "KILL_ENGAGED")`: watched, it prints `the kernel refused the record (SES-R02 grant_scope)` and returns 0; unwatched, it prints the not-stopped warning and returns 1 |
| CLI off | Kill engaged from the file, with a `SimulationLink`. `ask` returns `None`, `"disengage"`, `""`, or `"DISENGAGE\r"`: each returns 1, prints `cancelled — kill switch stays engaged`, and keeps the file. `" DISENGAGE\t"`: the file is removed, `KILL_RELEASED` committed, the lifted line printed, and 0 returned. With link `None` (or a `Down` link): the file is removed, the "stays engaged in the ledger" line printed, 1 returned, and no `KILL_RELEASED`. With the flag set: 1 returned, `ask` never called. No file and kill released: `it was already off — nothing to do`, 0 returned, `ask` never called. **Kernel paths:** after the CLI removes its file, a second kill file `tmp_path / "other" / "KILL"`, watched by the kernel only (its `KillInputs` names both), still exists. The release is `SEC-R16`, the line names `tmp_path / "other" / "KILL"` from `link.present_inputs()`, and 1 is returned |
| CLI status | Nothing engaged: `trading is not blocked`. The file present: `ENGAGED  <path>  engaged by synthetic-user at 2026-11-02T09:15:00Z`. The flag: `ENGAGED  by risk_guard.kill_switch`. Link `None`: the "not reachable" line. Every case returns 0. `at kill-switch flip` returns 1 with the usage line |
| Guard | `tests/contracts/test_capabilities.py`'s `_BUILDERS["Authenticated("]` is `{"bootstrap.py", "kernel/protection.py", "kernel/safety.py"}`. Its docstring's break check (`:151`) names `kernel/coordinator.py`, since `kernel/safety.py` is now an allowed file. `test_decisions_built_only_by_the_kernel` and `test_authenticated_never_replaced` pass |

### Break checks

Each mutation is applied after its anchor is checked present exactly once, run against the listed test file, and restored byte for byte with an md5 check. Each must fail a test.

| Change | Anchor | Test that must fail |
|---|---|---|
| The pass-top check removed | `run_pass`'s `check_kill_inputs()` before the stage test | Wake |
| The stage condition removed | `check_kill_inputs`'s `RECOVERY_WRITING`/`OPERATING` test | Wake (stage) |
| The claim check removed | the call before `self._revalidate(cmd, inline=False, …)` | Claim |
| The inline check removed | the call before `self._revalidate(cmd, inline=True)` | Inline |
| The inline unreadable path records a refusal | the inline call's `"unreadable"` return | Inline (unreadable) |
| `kill_inputs` accepted without the kernel's `Safety` | `compose_simulation`'s `ValueError` | Composition |
| The start check removed | `Recovery.run`'s call after `_bind_credentials()` | Start |
| The advance check removed | `Recovery._advance_record`'s call | Advance |
| The flag ignored | `KillInputs.present`'s `if self.flag` | Flag; Inputs |
| The file before the flag | `present`'s order | Flag (`kill_flag` with both) |
| A directory not counted (`os.path.isfile`) | `present`'s `os.stat` | Inputs |
| An unreadable input taken as absent | `present`'s `KillInputUnreadable` raise | Unreadable; Inputs |
| Only `FileNotFoundError` and `NotADirectoryError` absent (legacy's set narrowed) | `present`'s absent-error test | Inputs (`ELOOP`, `EBADF`, `winerror` 21) |
| A `ValueError` raised, not absent | the same | Inputs (the NUL path) |
| An unreadable input engages kill | `check_kill_inputs`'s `"unreadable"` branch | Unreadable |
| A relative path from the working directory | `resolve`'s join with `root` | Inputs (after `os.chdir`) |
| `SEC-R16` removed | `release_kill`'s input check | Release; CLI off |
| `SEC-R16` before authorization | the check's place in `_commit` | Release (`ops` gives `SEC-R16`) |
| `SEC-R16` passes an unreadable input | the check's `KillInputUnreadable` branch | Release |
| The environment does not replace YAML | `loader.resolve`'s kill block | Settings |
| The flag read as strict `bool` text | the coercion | Settings (`maybe`, `2`, `[0]`) |
| A YAML value read by the text rule instead of `bool(value)` | the YAML branch | Settings (YAML `"false"`) |
| The files kept in environment order instead of name order | the `sorted` | Settings (`("/k2", "/k1")`) |
| The CLI resolves its own paths (against the working directory) | `cli_inputs`'s `KillInputs.resolve(…, root)` | Same files |
| The CLI's `SEC-R16` line names its local inputs | the `SEC-R16` row's `link.present_inputs()` | CLI off (kernel paths) |
| A generic name ignored (alias only) | the `env_path` filter | Settings (`AT__risk_guard__kill_switch`) |
| Conflicting flags: last one wins | the `any(...)` | Settings |
| An unwatched composition refuses to start | `Recovery.run`'s alert | Unwatched |
| `on` asks the kernel before writing | `kill_switch`'s order | CLI on (file first) |
| `on` unwatched returns 0 when the kernel was not told | the unwatched result | CLI on |
| `on` watched returns 1 when the kernel refuses | the result's order | CLI on (`SES-R02`) |
| `off` removes the file before the confirmation | `kill_switch`'s order | CLI off (`disengage` keeps the file) |
| `off` trims all whitespace | the `rule.trimmed` comparison | CLI off (`"DISENGAGE\r"`) |
| `off` reports lifted when the kernel was unreachable | the unreachable row | CLI off |
| A `kernel:safety` `Authenticated` built in `kernel/coordinator.py` | a constructor added there | Guard |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/kernel/safety.py` | `KillInputUnreadable`, `KillInputs`, `SAFETY_AUTH`, `Safety`'s `kill_inputs`, `present_kill_inputs`, `check_kill_inputs`, `kill_input_state`, `_commit`'s `after_auth`, `_kill_input_check`, `release_kill`'s `SEC-R16` |
| `src/autonomous_trading/kernel/authority.py` | `_MESSAGES["SEC-R16"]` |
| `src/autonomous_trading/kernel/coordinator.py` | The pass, claim and inline checks |
| `src/autonomous_trading/kernel/recovery.py` | The start and advance checks, the report key, the alert |
| `src/autonomous_trading/bootstrap.py` | `compose_simulation`'s `kill_inputs` |
| `src/autonomous_trading/settings/schema.py`, `src/autonomous_trading/settings/loader.py` | `kill_switch`, `kill_switch_files` |
| `src/autonomous_trading/settings/secrets.py` | `_ENV_ALIASES`' two kill aliases |
| `src/autonomous_trading/resources/defaults.yaml` | `risk_guard` |
| `src/autonomous_trading/interfaces/cli.py` | New: `KernelUnreachable`, `KernelLink`, `cli_inputs`, `kill_switch` |
| `tests/integration/test_kill_inputs.py` | New (T-68) |
| `tests/contracts/test_capabilities.py` | `kernel/safety.py` in the `Authenticated(` builder set; the docstring's break check at `:151` names `kernel/coordinator.py` |

No new tree delta: `interfaces/cli.py` is in the target tree and the test file is T-68.

### Completion conditions (step 4)

* The step's tests pass, and the whole suite passes once after the last edit, on Windows. The step has no platform-only case.
* Every break check fails a listed test, and every file is restored (md5). `ast.parse` passes on every edited Python file, and `yaml.safe_load` on `resources/defaults.yaml`.
* `git diff --name-only` names exactly the files in the table above, in one commit.
* No existing expectation changes: no composition outside this step's tests composes `KillInputs`.
* The build starts on the coordinator's word, after SLICE-09 step 1 lands in `OA_NEW`. Every cited line is re-read on that head.
* PRF-SEC-12 passes, as the spec now states it (an empty path starts and raises `kill_file_unwatched`).
* This file records step 4 "as built", with any Deviation or Fork call found while building.

### Step 4 as built

**In plain words.** The kill file and the kill setting now stop trading in the new kernel as they do today, before the next order, at start, and even when nothing else runs. The kernel writes down each time it does. `at kill-switch on`, `off` and `status` work as today, and kill cannot be lifted while the file or setting is still there. All 1,508 automatic checks pass.

Commit `ee6aec9` on `slice-08`, after `8eb3a12` (SLICE-09 step 1), which touched none of the cited files. It changes exactly the twelve files in the step's table (+1,008 −11). Nothing is pushed. The EC2 was not used.

**Choices made while building:**

| Topic | As built |
|---|---|
| Joining a relative path | A `pathlib` join, as legacy's `repo_root / candidate`, so Windows gives one separator style. `os.path.join` mixed `\` and `/` |
| `SAFETY_AUTH` | `safety_auth()`, a cached function built once, because `kernel/safety.py` imports `kernel.authority` lazily |
| Owner under kill (a correction to the text) | Under kill, a market close while the stop rests is refused **at admission** (`PRT-R10`, B3), as `tests/unit/test_safety_matrix.py:178-185` already proved. It does not wait at dispatch. The test: close `k-x1` refused `PRT-R10`; the owner's cancel `k-c1` of `o-stop` is sent; the stop is observed cancelled; a new close `k-x2` is admitted and sent |
| The claim loop on an unreadable input | The command waits, and the loop over accounts stops for that pass |
| A YAML file value | Used as text; the `none`/`null` rule applies only to environment values, as legacy's `str(path)` |
| Platform | No POSIX-only case in this step, so nothing skipped |

**Tests:** `tests/integration/test_kill_inputs.py`, 119 cases with their parameters; all pass on Windows. The whole suite, once after the last edit: **1,508 passed, 2 skipped**, in 161.0 s. Neither skip is from this step: one is the existing Windows skip, the other step 3's POSIX case. `ast.parse` passes on the eleven edited Python files, and `yaml.safe_load` on `resources/defaults.yaml`.

**Break checks** (`s10d_breaks.py` in the session scratchpad; anchors checked first, one mutation at a time, every file restored byte for byte, md5 verified): 36 of 36 failed a listed test. They are the table's rows, plus "an `Authenticated` copied with a borrowed request in `kernel/coordinator.py`", which proves the moved docstring check (`test_authenticated_never_replaced`).

## Step 5 — the kernel's local channel

<a id="step-5--the-kernels-local-channel-outline"></a>

The authorities are the spec's [kernel channel](../../design/security-and-operator.md#the-kernels-local-channel-adaptersunix_channelpy) section, the kernel-socket row of its [channel table](../../design/security-and-operator.md#channels-and-principals-interfacesauthorizationpy), its [refusal codes](../../design/security-and-operator.md#refusal-codes) (`SEC-R10`, `SEC-R11`, `SEC-R12`), F-SEC7 and F-SEC9 in its [failure modes](../../design/security-and-operator.md#failure-modes-and-crash-points), REQ-SEC-007 and A02-F1 (`README.md:901`). The hand-off rule is the runtime spec's [kernel host](../../design/runtime-isolation-observability-deployment.md#the-kernel-host-kernelhostpy) (`submit`). Step 5 builds on steps 1–4 as built (`726ff6e`, `cb439ce`, `ba2face`, `ee6aec9` on `slice-08`). It adds one module, its test file and one line of an existing guard. It changes no kernel module, ledger table, event kind, setting or composition: the kernel's checks are step 2's, and the channel only carries requests to them. Every `OA_NEW` citation was written at `ee6aec9` and re-checked at `e4948d0` (SLICE-09 step 2), where the moved lines were updated; every legacy citation is at 445eb116, relative to the legacy repository root.

**In plain words.** This step builds the private door into the kernel. Only two kinds of program may use it: the operator process, which passes on what you asked for at `at` or in the console, and the strategy host, which hands in trade ideas. The kernel asks the operating system who is knocking: which user, whether it is the main process of an approved service, and whether it is still the same process. Your own terminal, or any other program, is turned away before the kernel is asked anything, as today's Tier-1 socket does. Every message must also name the exact version of the door and of the installed release; a program from another release is turned away. Your own requests pass exactly as before: the kernel still makes every check of steps 1 and 2, and the door adds none to who may trade. If an answer is lost on the way back, asking again gives the first answer and nothing happens twice. Stopping never needs this door: the kill file still works with nothing else running (step 4).

### Decisions

#### What the step closes

| Hand-off | From | Where it is met |
|---|---|---|
| The channel calls `accept_relay` after its peer checks | step 1 | [The order of checks](#the-order-of-checks-channelcorehandle), row 12 |
| A relayed human's `Authenticated` is built from `accept_relay` and `operator_request_from_wire`; a service's with `request=None, via=None` | step 2 | [Operations](#operations), `execute` and the service operations (`svc_auth`) |
| `Authority.relays` is bound from `channel.relays` | step 2 | `ChannelPeers.relays()`, which SLICE-11's kernel composition passes to `Authority`. `ChannelCore` refuses to start when a relay peer's principal is not in `Authority.relays`, or a service peer's principal is in it ([The order of checks](#the-order-of-checks-channelcorehandle)) |
| SLICE-09's strategy host reaches the kernel through `KernelPorts`; SLICE-10's channel replaces `bootstrap.InProcessKernel` | SLICE-09 step 2 | One service operation per `KernelPorts` method ([Operations](#operations)) |
| The channel serves the `now` read (`effective_now`) that issues every request | step 2 | The `now` operation |
| `adapters/unix_channel.py` joins both `Authenticated(` guards | step 2 | `tests/contracts/test_capabilities.py` (Files) |
| A `Replayed` reply carries `replayed: true` | step 2 | [Replies](#replies) |
| No change to the kill check, which is in-process | step 4 | The channel reads no kill input. `kill_status` reports `Safety`'s own state, and `at kill-switch on` writes the file before it asks anything (step 4) |

`bootstrap.py`'s `KernelNow` and `Composition.relay` (`bootstrap.py:41-53`, `:86-92`) stay as the simulation's in-process stand-ins. Every test before this step keeps using them; no expectation changes.

#### Peers (`adapters/unix_channel.py`)

* `Peer(unit, uid, principal, role)`, frozen. Construction raises `ValueError` when:
  * `unit` does not fully match `[^\s/]+\.service`, or starts with `user@` (step 1's unit rule, `interfaces/authorization.py:35`, `:66-68`);
  * `uid` is not an int ≥ 0 (a bool refused);
  * `principal` is not a `service` `Principal`;
  * `role` is not `"relay"` or `"service"`.
* `ChannelPeers(peers)` holds a tuple of `Peer`s. It raises `ValueError` when the tuple is empty, a unit appears twice, or a principal appears twice. Two units may share a uid: legacy ran every unit under one uid (`src/runtime/tier1_authority/service.py:204`), and SLICE-11 gives each its own.
  * `relays() -> frozenset[Principal]`: the relay peers' principals.
  * `uids() -> frozenset[int]`: every listed uid.
* `parse_peers(section) -> ChannelPeers` reads a profile's `channel` section. Its shape is exactly `{"relays": {unit: {"uid": int, "principal": str}}, "services": {unit: {...}}}`: both keys present, each a mapping (possibly empty), and each entry exactly those two keys. Peers come in this order: the relays in sorted unit order, then the services in sorted unit order. Any other shape raises `ValueError` naming `channel` or `channel.<role>.<unit>`. `Settings` and the loader do not change. SLICE-11's live profile loader calls it, as it calls step 3's `parse_references`, and `channel.services` and `channel.relays` stay refusing there (the spec's [policy inputs](../../design/security-and-operator.md#policy-inputs)).

#### Process facts (Linux)

* `PeerCred(pid, uid)`, frozen, each an int ≥ 0 (bools refused). A pid of 0 is what `SO_PEERCRED` reports for a peer in another pid namespace.
* `peer_cred(sock) -> PeerCred` is legacy's `peer` (`src/runtime/tier1_authority/channel.py:91-95`): `getsockopt(SOL_SOCKET, SO_PEERCRED, struct.calcsize("3i"))`, unpacked as `3i` into pid, uid and gid; the gid is dropped.
* `process_identity(pid) -> dict` is legacy's, copied with its provenance (`src/core/framework/runtime/provenance.py:178-198`). It reads field 22 (`starttime`) of `/proc/<pid>/stat` after the last `)` and `/proc/sys/kernel/random/boot_id`, and returns `{"boot_id": str, "start_ticks": int}`. It returns `{}` when the stat file cannot be read or parsed, which is always the case off Linux.
* `systemd_main_pid(unit) -> int | None` is legacy's MainPID query (`service.py:84-96`). Any `main_pid` returns `None` for a unit that is stopped. It runs `["systemctl", "show", "--property=MainPID", "--value", unit]` with `capture_output=True, text=True, timeout=2, check=False`, and `env=SYSTEMCTL_ENV`, where `SYSTEMCTL_ENV = {"PATH": "/usr/bin:/bin", "LC_ALL": "C"}`. It returns the stripped output as an int when the return code is 0, the output is all digits, and the value is above 0. It returns `None` otherwise, including on `OSError` or `TimeoutExpired`.
  * A stopped unit's MainPID is `0`, so `None` keeps a namespaced peer (pid 0) from matching a stopped unit.
  * The fixed environment applies step 3's Fork call "children never hold the broker key" to this child too. Legacy's authority ran `systemctl` with its whole environment, which held the broker key (`service.py:13-14`, `:88-90`).

#### Frames

* `MAX_MESSAGE = 4 * 1024 * 1024`: 4,194,304 bytes, the most a read buffer may hold (`channel.py:54`). Timeouts are legacy's: `CONNECT_TIMEOUT_S = 5.0` and `REPLY_TIMEOUT_S = 60.0` (`channel.py:55-58`), and `REQUEST_TIMEOUT_S = 10.0` for the server's read (`service.py:61`). None is a money value.
* `encode(obj) -> bytes` is legacy's: `json.dumps(obj, sort_keys=True, separators=(",", ":"), allow_nan=False)` plus `"\n"`, as UTF-8, with ASCII escapes (`channel.py:67-69`).
* `FrameError(reason)`, with `reason` one of `timeout`, `incomplete`, `oversize`, `encoding`, `json` and `not_object`.
* `read_frame(sock, timeout_s) -> bytes`, legacy's loop (`channel.py:72-88`). Its cases:
  * While the buffer holds no newline, it reads one `recv(65536)` chunk and appends it. After each append, a buffer of more than `MAX_MESSAGE` bytes is `oversize` and reading stops, **even when that chunk holds the newline** (`channel.py:75-81`, fork rule). So a line of 4,194,303 bytes plus its newline (a buffer of exactly 4,194,304) is read, and a line of 4,194,304 bytes plus its newline is `oversize`.
  * It returns the bytes before the first newline. Bytes after it are discarded: one request per connection.
  * End of stream before a newline is `incomplete`, and so is any other `OSError`.
  * A socket timeout is `timeout`.
* `decode_frame(line) -> dict`:
  * strict UTF-8, else `encoding`;
  * `json.loads` with a `parse_constant` that raises (`NaN`, `Infinity`, `-Infinity`), and an `object_pairs_hook` that raises on a repeated key at any depth; either is `json`;
  * anything but a JSON object is `not_object`.
* **The request** is exactly `{"contract", "release", "caller", "op", "body"}`:
  * `contract`: the string `CONTRACT = "kernel-channel/1"`;
  * `release`: the `bundle_digest` of the release the caller was built from;
  * `caller`: exactly `{"pid", "process_identity"}`;
  * `op`: an operation name;
  * `body`: a JSON object.

#### The order of checks (`ChannelCore.handle`)

`ChannelCore(comp, *, peers, submit, main_pid, identity_of)` holds everything a reply depends on. It raises `ValueError` when:

* `peers` is not a `ChannelPeers`;
* a relay peer's principal is not in `comp.authority.relays`, or a service peer's principal is in it (`kernel/authority.py:119-121`, `:128`): a relay acts only for people, a service only for itself (step 2);
* `comp.safety` or `comp.policy` is `None`: the channel serves only a kernel composed with admission;
* `submit`, `main_pid` or `identity_of` is not callable.

It reads at construction:

* `self.epoch = comp.writer.epoch.value`;
* `self.release`, the field **`bundle_digest`** of the `receipt` in the ledger's last `RELEASE_BOUND` (`kernel/recovery.py:143-145`, bound at `:211-217`). It must be 64 lower-case hex; when no `RELEASE_BOUND` exists, or its receipt has no such field, it raises `ChannelError("release")`.
  * **Code only, never the receipt digest.** The receipt also holds `deployment` and `settings_revision` (the configuration spec's release receipt), so its `receipt_digest` changes with a deployment key or a setting while the code stays the same. `bundle_digest` is `sha256(canonical(artifact))` over the code, dependencies, resources and templates only, with the Git SHA outside it (configuration spec, bundle manifest). Legacy also compared the code revision only (`service.py:291-297`). So changing a setting never turns a peer away; only a peer built from other code is. SLICE-11 gives every client that same `bundle_digest`, read from its release's `bundle.json`.
  * **Fork call (no channel without an attested release):** legacy's authority refused to start unattested (`service.py:803-808`).
* **When it is built.** The composition builds `ChannelCore` after `recovery.run()` has returned (`bootstrap.py:270`; `RELEASE_BOUND` is recorded inside it, `kernel/recovery.py:172`) and before the server starts serving. So `self.release` is this epoch's bound release, and no connection is answered before recovery has bound it.
* `self.relays = comp.authority.relays`, and the owner, `comp.authority.owner`.

`handle(peer: PeerCred, frame: bytes | FrameError) -> dict` returns the reply object ([Replies](#replies)). Its checks run in this order; the first that fails decides, and nothing before row 13 calls the kernel.

| # | Fails when | Reply |
|---|---|---|
| 1 | `peer.uid` is not in `peers.uids()` | `SEC-R12`, reason `uid` |
| 2 | No listed `Peer` `p` has `main_pid(p.unit) == peer.pid`. Peers are asked in `ChannelPeers` order, stopping at the first match; an unlisted unit is never asked | `SEC-R12`, reason `unit` |
| 3 | The matched peer's `uid` is not `peer.uid` | `SEC-R12`, reason `uid` |
| 4 | `frame` is a `FrameError`, or `decode_frame(frame)` raises one | `SEC-R11`, with that reason |
| 5 | The message's keys are not exactly the five; `caller`'s are not exactly `pid` and `process_identity`; `caller.pid` is not an int (a bool refused); `process_identity` is not an object; `op` is not a string; or `body` is not an object | `SEC-R11`, reason `shape` |
| 6 | `caller.pid != peer.pid`; or `identity_of(peer.pid)` is empty; or it is not equal to `caller.process_identity` | `SEC-R12`, reason `identity` |
| 7 | `contract != CONTRACT` (exact `==`) | `SEC-R11`, reason `contract` |
| 8 | `release != self.release` (exact `==`) | `SEC-R11`, reason `release` |
| 9 | `op` is not in `OPS` | `SEC-R11`, reason `op` |
| 10 | `op` is not in `ROLE_OPS[matched peer's role]` | `SEC-R10`, reason `role` |
| 11 | The body does not decode for `op` ([Operations](#operations)) | `SEC-R11`, reason `call` |
| 12 | `execute` only: `accept_relay(p.principal, self.relays, owner, request.principal, body["path"])` returns a `Refusal`, with `p` the `Peer` matched at row 2 (`interfaces/authorization.py:161-169`) | `SEC-R10`, reason `relay` |
| 13 | One hand-off, `submit(fn)`, then the future's result | `answered`, or `ambiguous` when it raises |

* **The peer comes first.** Rows 1–3 need nothing from the message, so a person's session or an unlisted program is refused `SEC-R12` whatever it sent. The frame is still read before the reply, so the peer's write never races the close (`service.py:146-152`).
* **Fork call (peer attestation).** Rows 1–3 and 6 keep legacy's order and facts: the uid, the main pid of an approved unit by systemd, then the caller's stated pid and process identity against the peer's own (`service.py:270-284`). The target checks each unit's own uid; legacy checked one allowed uid set (`service.py:272-273`).
* Each refusal is logged at `WARNING` on the logger `autonomous_trading.channel` as `refused pid <pid> uid <uid>: <code> <reason>`. Nothing from the frame is logged, and nothing is written to the ledger: a refusal here is not attributable to a person (the spec's "unauthenticated refusals are only logged").
* `LABELS = {"SEC-R10": "relay_scope", "SEC-R11": "contract_version", "SEC-R12": "peer_refused"}`, the spec's labels.

#### Operations

`ROLE_OPS = {"relay": frozenset({"now", "execute", "kill_status", "alerts", "command_status"}), "service": frozenset({"alive", "publish", "record_decision", "record_unavailable", "submit", "command_status"})}`, and `OPS` is their union. Every operation that passes row 12 is exactly one `submit` hand-off. The hand-off returns the result's wire form. Below, `p` is the `Peer` matched at row 2, and `svc_auth` is `Authenticated(p.principal, "local_channel", request=None, via=None)`, built for the service operations.

**The relay's operations:**

| Operation | Body, exactly | The hand-off | Result |
|---|---|---|---|
| `now` | `{}` | `effective_now(comp.writer, comp.clock)` (`kernel/lifecycle.py:43`) | `{"utc_iso", "domain", "uncertainty_ms"}` |
| `kill_status` | `{}` | `comp.safety.killed()`, `present_kill_inputs()`, `kill_inputs.watched` and `kill_input_state` (`kernel/safety.py:307`, `:383`, `:70`, `:292`) | `{"engaged": bool, "inputs": [str], "watched": bool or null (no inputs composed), "input_state": str}`, legacy's status facts (`src/core/framework/execution/killswitch.py:119-129`) |
| `alerts` | `{}` | copies of `comp.recovery.alerts` and `comp.policy.alerts` (`kernel/recovery.py:119`; `kernel/policy.py:57`) | `{"recovery": [...], "policy": [...]}` |
| `command_status` | `{"command_key": str}` | `comp.coordinator.command_status(key)` (`kernel/coordinator.py:569-585`) | `{"status": status wire or null}` |
| `execute` | `{"path", "request", "args"}` | the call table below | the execute result |

**The service's operations: one per `KernelPorts` method.** SLICE-09 step 2 names the strategy host's kernel port `KernelPorts` (`strategies/worker.py`): `alive`, `publish`, `record_decision`, `record_unavailable`, `submit` and `command_status`. Its in-process form, `bootstrap.InProcessKernel`, is what this channel replaces ([SLICE-09 step 2](SLICE-09-strategies-and-cognition.md), "The host's principal", and its decision record's `Coordinator.record_decision` and `Coordinator.record_unavailable`). SLICE-09 step 2 was not yet built when this was written (`OA_NEW` HEAD `ee6aec9`), so the table follows its text. The build re-reads `strategies/worker.py`, `bootstrap.InProcessKernel` and the two coordinator routes on its head. Any difference in a signature changes only the body and call of its row here, and is recorded "as built".

| Operation (`KernelPorts` method) | Body, exactly | The hand-off | Result |
|---|---|---|---|
| `alive` (`alive() -> bool`) | `{}` | returns `True`. The answer itself shows the writer thread is running | `{"alive": true}` |
| `publish` (`publish(output: dict) -> str`) | `{"output": object}` | `comp.evidence.publish(output).content_digest` (`kernel/ledger/evidence_store.py:109`) | `{"digest": the 64-hex digest}` |
| `record_decision` (`record_decision(record)`) | `{"record": the decision wire}` | `comp.coordinator.record_decision(D, auth=svc_auth)`, with `D` the `DecisionRecord` decoded below | the execute result |
| `record_unavailable` (`record_unavailable(intent_ref, cause)`) | `{"intent_ref": str, "cause": str}` | `comp.coordinator.record_unavailable(intent_ref, cause, p.principal, auth=svc_auth)` | the execute result |
| `submit` (`submit(request)`; the spec's `submit_intent`) | `{"request": the entry's wire}` | `comp.coordinator.admit_entry(request, auth=svc_auth)` (`kernel/coordinator.py:157-161`) | the execute result |
| `command_status` (`command_status(command_key)`) | `{"command_key": str}` | as the relay's | as the relay's |

* **The decision wire** is exactly `{"invocation_id", "principal": [value, kind], "strategy", "session_id", "trigger", "kind", "evidence_ref"}`, the seven fields of `DecisionRecord` (`contracts/decisions.py`, SLICE-09 step 2) with the principal as a pair. `DecisionRecord(...)` checks the values; its `ValueError`, or a wrong key set, is `call`. The record's principal is a claim: the coordinator authenticates with `svc_auth`, never the payload (SLICE-09 step 2).
* **`record_decision` and `record_unavailable` answer a string or a `Refusal`.** The strings are `recorded`, `existing` and `not_required` (SLICE-09 step 2). The result wire gains one form for them (below).
* **`submit`** decodes with `entry_request_from_wire` (`contracts/execution.py:417-423`). The body's request must have exactly the keys `verb`, `command_key`, `principal`, `account`, `session_id` and `intent_ref`, with `verb == "entry"`. The rebuilt request's `wire()` must equal the sent object; otherwise it is `call`. The request's principal is a claim: A2 compares it with the authenticated service and refuses `SES-R01` (`kernel/admission.py:714-721`).
* **`publish`** takes any JSON object, as `InProcessKernel.publish` hands its output to the evidence store. Its size is bounded by the frame (4 MiB).
* **`command_status`** answers any listed peer for any command key, as legacy's `outcome` read did (`service.py:669-675`). Step 6 limits each person to their own commands (the spec's reads).
* **No service operation carries a cancel, modify or close.** Legacy's strategy unit sent those for its own exit management (`service.py:738-739`). In the target the kernel makes those moves itself, as `kernel:protection` (`kernel/authority.py:24`; SLICE-06). A person's cancel, close and applied advice come through the relay.

**The execute call table.** `execute` decodes `request = operator_request_from_wire(body["request"])` (`contracts/identity.py:363`). `args` must be a JSON object. `subject` below is `request.target.subject`. The call is decoded only from `request.operation`, `request.target` and `args`; the entry point then recomputes the digest from its own call (step 2, bind row 5). So a call that does not match its request is the kernel's recorded `SEC-R09`, never the channel's guess.

| Operation | `args` keys, exactly | The call, with the relayed `auth` |
|---|---|---|
| `kill_engage` | `reason` | `comp.safety.engage_kill(auth, reason)` (`kernel/safety.py:360`) |
| `kill_release` | `reason` | `comp.safety.release_kill(auth, reason)` (`:365`) |
| `hold_engage` | `reason` | `comp.safety.engage_hold(auth, subject, reason)` (`:413`) |
| `hold_release` | `released_reason`, `justification` | `comp.safety.release_hold(auth, subject, released_reason, justification)` (`:419`) |
| `latch_unlock` | `strategy`, `reason` | `comp.safety.unlock_latch(auth, subject, reason, strategy=strategy)` (`:506`) |
| `pause_clear` | `reason` | `comp.policy.clear_pause(auth, subject, reason)` (`kernel/policy.py:320`) |
| `attempt_resolve` | `attempt_no`, `legs`, `observation` | `resolve_attempt(comp.writer, comp.authority, auth, subject, attempt_no, legs, E)` (`kernel/lifecycle.py:489`), where `E` is `None` for `null`, else the observation decoded below |
| `recovery_advance`, `step` `advance` | `step` | `comp.recovery.advance(auth)` (`kernel/recovery.py:411`) |
| `recovery_advance`, `step` `fence` | `step`, `fence` | `comp.recovery.record_fence(auth, F)` (`:430`), with `F` the fence decoded below |
| `grant_admin`, `step` `issue` | `step`, `grant` | `comp.authority.issue(auth, G)` (`kernel/authority.py:323`) |
| `grant_admin`, `step` `revoke` | `step`, `reason` | `comp.authority.revoke(auth, subject, reason)` (`:349`) |
| `binding_authorize`, `step` `authorize` | `step`, `binding` | `comp.authority.authorize_binding(auth, B)` (`:384`) |
| `binding_authorize`, `step` `revoke` | `step`, `reason` | `comp.authority.revoke_binding(auth, subject, reason)` (`:400`) |
| `cancel`, `close`, `advice_apply` | `action`, `reason` | `comp.coordinator.admit_action(A, auth=auth, reason=reason)` (`kernel/coordinator.py:177-182`) |

Another key set, or a `step` value not in the table, is `call`. Values are passed as sent; the entry points keep their own text guards (`ADM-R01`). The decoders accept exactly these shapes, and any `KeyError`, `TypeError`, `ValueError` or `IndexError` while decoding is `call`:

* **The observation `E`.** Exactly `{"store", "content_digest", "published_at"}` gives `EvidenceRef(store, content_digest, Timestamp(published_at, "wall"))` (`contracts/evidence.py:174`). The domain is not on the wire (`contracts/execution.py:355-357`), and `resolve_attempt` reads only the store and digest, so the fixed `"wall"` changes no wire or digest.
* **The fence `F`.** Exactly the nine keys of `_fence_payload` (`kernel/recovery.py:448-456`) give `FenceEvidence` (`:47-57`), with `accounted` as a tuple and each `fenced_lease_holders` item `[[broker, account], ledger, epoch]` as `(AccountId(broker, account), ledger, epoch)`.
* **The grant `G`.** Exactly the eight keys of `wire(Grant)` (`contracts/execution.py:380-384`) give `Grant` (`contracts/identity.py:100-130`): `principal` `[value, kind]`, `actions` a list made a `frozenset`, and `accounts` a list of `[broker, account]` made a `frozenset` of `AccountId`.
* **The binding `B`.** Exactly the six keys of `wire(StandingBinding)` (`contracts/execution.py:385-388`) give `StandingBinding` (`contracts/identity.py:133-155`): `scope` `[[broker, account], calendar]`, and `candidate_ids` a list made a tuple.
* **The action `A`.** `action_request_from_wire(dict(action, principal=[request.principal.value, request.principal.kind]))` (`contracts/execution.py:443-454`). `action_wire` drops the principal (`kernel/admission.py:24`), so the action is always the request's person's.
* The relayed `auth` is `Authenticated(relayed.principal, relayed.path, request=request, via=relayed.via)`, built in this module.

#### Replies

Every reply is exactly `{"contract": CONTRACT, "epoch": self.epoch, "outcome", "result", "refusal"}`. Every reply carries the epoch, refusals included.

| `outcome` | `result` | `refusal` |
|---|---|---|
| `refused` | `null` | `{"code", "label", "reason"}`: rows 1–12, before any kernel call |
| `answered` | the operation's result | `null` |
| `ambiguous` | `{"error": <the exception's class name>}` | `null`: the hand-off raised, or was cancelled, or the reply could not be encoded |

* **The execute result** (also `submit`'s, `record_decision`'s and `record_unavailable`'s), built by `result_wire(value)`:
  * a `str` (`recorded`, `existing`, `not_required`): `{"kind": "answer", "replayed": false, "answer": the string}`;
  * `Committed` (`kernel/ledger/store.py:228-230`): `{"kind": "committed", "replayed": false, "sequences": [...]}`;
  * `Replayed` (`kernel/authority.py:95-102`): `{"kind": "replayed", "replayed": true, "request_id", "decision", "sequence", "outcome": the outcome wire or null}`;
  * `Refusal`: `{"kind": "refusal", "replayed": false, "refusal": the refusal wire}`;
  * `Outcome`: `{"kind": "outcome", "replayed": false, "outcome": the outcome wire}`;
  * anything else raises `TypeError` in the hand-off, and the reply is `ambiguous`.
* **The wire forms:**
  * the refusal wire is `{"code", "message", "command_key", "decision"}` (`contracts/execution.py:292-297`);
  * the outcome wire is `{"command_key", "attempt_no", "effect", "canonical", "broker_order_ids", "domain", "sent", "refusal"}`, with `domain` the `DomainEvidence` value or `null`, and `refusal` a refusal wire or `null` (`:312-330`);
  * the status wire is `{"command_key", "state", "verb", "attempt_no", "effect", "broker_order_ids", "refusal"}` (`:300-309`).
* **No free text leaves the kernel.** A reply holds codes, labels, identifiers and the kernel's own fields, and an `ambiguous` reply only an exception's class name, never its message. So no reply carries outside text that step 3's `scrub` would need to clean.
* **A reply that cannot be delivered changes nothing** (Fork call, `service.py:24-25`, `:168-179`). A failed send is logged as `reply lost`. The ledger holds the outcome, and the caller retries with the same request (`Replayed`) or asks `command_status`. If `encode` raises, the reply becomes `ambiguous` with that class name, as legacy (`service.py:170-175`).

#### Kernel calls run on the writer thread (`submit`)

* `submit: Callable[[Callable[[], object]], Future]` runs each hand-off on the kernel's writer thread, as the runtime spec says. It is SLICE-11's `kernel.host.submit`; the operator channel is one of the hand-offs it names. Every kernel read and write behind an operation, `now` and `kill_status` included, goes through it. The ledger connection is then never used by two threads at once.
* The handler waits for the future to complete, without its own timeout. The client's 60 s bounds the caller (`channel.py:58`), as legacy's server waited for the send to be recorded. A hand-off that raises, or that the host cancels at stop, gives `ambiguous`.
* Until SLICE-11, tests pass an inline submit (the call runs on the caller's thread, and its result or exception goes into a completed `Future`), or a one-thread `ThreadPoolExecutor`'s `submit`.

#### The socket and the server

`ChannelError(reason)`, with reasons `platform`, `release`, `directory` and `locked`. `KernelChannelServer(core, path, *, socket_gid)`, where `socket_gid` is `None` or an int ≥ 0 (`ValueError` otherwise):

* **Construction** raises `ChannelError("platform")` when `socket` has no `AF_UNIX` or `SO_PEERCRED`, or `fcntl` cannot be imported. The `socketserver` classes are defined inside `start()`, so the module imports on Windows.
* **`start()`**, legacy's order (`service.py:800-833`):
  1. `path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)`. Then the directory's owner must be `os.geteuid()`, with no group or other write bit (`st_mode & 0o022`); otherwise `ChannelError("directory")`.
  2. `<path>.lock`, opened `O_RDWR | O_CREAT` with mode `0o600`, takes `fcntl.flock(LOCK_EX | LOCK_NB)`; failing that, the descriptor is closed and it raises `ChannelError("locked")`. One server per socket.
  3. A stale socket file is unlinked (`missing_ok`): the lock is held.
  4. The socket is bound under a umask of `0o177`, then `chmod 0o600`, when `socket_gid` is `None`. With a gid it is bound under `0o117`, then `os.chown(path, -1, socket_gid)` and `chmod 0o660`, group-restricted to the approved units' group (the spec). Any error releases the lock and propagates.
* **`serve_in_thread()`** serves on a thread named `kernel-channel`, with `poll_interval=0.2`. The server is `ThreadingMixIn` with `UnixStreamServer`, `daemon_threads = False` and `block_on_close = True` (`service.py:182-185`, `:842-850`).
* **`shutdown()`** stops serving, joins the thread, closes the server, unlinks the socket and releases the lock (`service.py:862-878`).
* **Each connection:** `settimeout(REQUEST_TIMEOUT_S)`, then `peer_cred`. An `OSError` there is logged and the connection closed with no reply (`service.py:142-145`). Then `read_frame`, keeping a `FrameError` as the frame, then `core.handle`, then `sendall(encode(reply))`.
* **Deviation (per-unit users).** Legacy's socket was `0600` for one shared uid (`service.py:825-830`). With each unit under its own user (SLICE-11), peers reach the socket through a group, and the uid check per peer (rows 1–3) keeps the attestation per unit.

#### The client

`KernelChannelClient(path, *, server_uid, server_gid, release)`. It raises `ValueError` unless `server_uid` is an int ≥ 0, `server_gid` is `None` or an int ≥ 0, and `release` is 64 lower-case hex. At construction it keeps `caller = {"pid": os.getpid(), "process_identity": process_identity(os.getpid())}` (`channel.py:131-133`).

`ChannelRefused(reason)` means no byte of the request left this process. `ChannelAmbiguous(reason)` means the kernel may have it. This is legacy's line (`channel.py:24-33`).

`call(op, body) -> Reply` runs these steps:

1. It encodes the request. A `TypeError` or `ValueError`, or encoded bytes (newline included) over `MAX_MESSAGE`, raises `ChannelRefused("encode")`.
2. `socket_problem(path, server_uid, server_gid)`, legacy's check (`channel.py:98-118`) extended to a group, returns the first reason, or `""`. A reason raises `ChannelRefused` with it:
   * `missing`: `lstat` raises `FileNotFoundError`;
   * `unreadable`: any other `OSError`;
   * `not_socket`;
   * `owner`: `st_uid != server_uid`;
   * `mode`: an other bit (`& 0o007`), or a group bit (`& 0o070`) when `server_gid` is `None` or `st_gid != server_gid`;
   * `directory`: the parent cannot be stat'ed, is not owned by `server_uid`, or has a group or other write bit.
3. It connects with `CONNECT_TIMEOUT_S`; an `OSError` raises `ChannelRefused("connect")`. Then `peer_cred(sock).uid != server_uid` raises `ChannelRefused("peer_uid")` (`channel.py:143-146`).
4. It sets `REPLY_TIMEOUT_S`, then `sendall`, `shutdown(SHUT_WR)`, `read_frame` and `decode_frame`. Any failure raises `ChannelAmbiguous` with the `FrameError` reason, or `send` for an `OSError` during the send.
5. The reply must have exactly the five keys, `contract == CONTRACT`, a non-empty string `epoch`, and an `outcome` among the three. Otherwise it raises `ChannelAmbiguous("malformed_reply")`.
6. It returns `Reply(epoch, outcome, result, refusal)`, frozen.

The typed helpers each call `call` with their body:

* `now()`, `kill_status()` and `alerts()`;
* `command_status(command_key)`;
* `execute(path, request, args)`, with the body `{"path": path, "request": request.wire(), "args": dict(args)}`;
* `alive()`; `publish(output)`, with the body `{"output": output}`; `record_decision(record)`, with the body `{"record": decision_wire(record)}`; `record_unavailable(intent_ref, cause)`; `submit(entry_request)`, with the body `{"request": wire(entry_request)}`. `decision_wire` is the decision wire above.

The client checks no kernel answer: an `answered` refusal is the kernel's, for the caller (step 6) to map.

#### Module boundary

* At module level, `adapters/unix_channel.py` imports only the standard library, `autonomous_trading.contracts` modules and `autonomous_trading.interfaces.authorization` (whose relay rule step 1 made importable for this, `interfaces/authorization.py:1-6`).
* Every `autonomous_trading.kernel` import is inside a function of `ChannelCore` or its call table. So a client process (the operator process in step 6, the strategy host in SLICE-09) loads no kernel module by importing it, which PRF-SEC-09 later relies on.
* `Authenticated(` is built here only in `ChannelCore`: the relayed human and the service.

#### Fork calls and deviations in this step

* **Fork calls:**
  * Peer attestation (the slice-level Fork call): uid, the systemd main pid of a listed unit, then pid and process identity, in legacy's order.
  * **Which peer may call which operation** (who may trade). Legacy gave each approved unit a role (`service.py:62-71`, `:732-741`): the owner API's unit sent only the person's cancel and close, and was the only one that could unlock the latch (`:720-721`); the strategy unit sent entries; the read-only units sent nothing. Here the relay alone carries a person's operations, each judged by the kernel under that person's own grant. A service alone submits entries, under its own grant. MCP is not a peer, since it reaches no kernel operation (the spec). No service operation carries an exit move, because the kernel makes those itself (above). The channel adds no condition on an entry or an owner action beyond the kernel's own checks.
  * No channel without an attested release.
  * Legacy's bounds and timeouts: one JSON line per connection, 4 MiB, 5 s, 60 s and 10 s.
  * A lost reply changes nothing; a kernel failure is `ambiguous`, as legacy's unknown send (`service.py:791-795`).
  * One server per socket under an exclusive lock; the stale socket is replaced only under it.
  * The client's socket, owner and peer-uid checks, refused before the first byte.
* **Deviations:**
  * **Exact versions** (the slice-level Deviation; A02-F1). The exact `contract` string and the bound release digest replace legacy's integer protocol and principal name (`service.py:228-236`). They also replace legacy's check of the caller's startup provenance against the attested git revision (`service.py:285-301`): the caller states the `bundle_digest` it was built from, and the kernel compares it with its own bound release's `bundle_digest`. Like legacy's revision, it covers code only, never settings. A worker from another release is refused `SEC-R11`, as F-SEC9 requires; legacy refused a caller whose provenance did not match its bound release.
  * **Per-unit users:** each peer's uid is its own unit's, and the socket is group-restricted when peers run under other users.
  * **Codes, not text:** a refusal is `SEC-R10`, `-R11` or `-R12` with a reason, where legacy answered free text.
  * **Strict JSON:** `NaN`, the infinities and repeated keys are refused. Legacy's `json.loads` accepted them, but legacy's own `encode` could produce none of them (`channel.py:67-69`), so no legacy client sent one.
  * **No readiness probe without the main-pid check.** Legacy answered `readiness` to any process of an allowed uid whose process identity matched, without asking systemd (`service.py:238-268`). Here every operation passes the whole attestation. The supervisor reads the ledger instead (runtime spec).
  * **`systemctl` gets a fixed environment** (stricter; step 3's rule).
* No score, threshold or money value is set. The sizes and timeouts are legacy's transport bounds.

#### What later steps take from step 5

* **Step 6:**
  * The operator process builds a `KernelChannelClient` for the kernel's socket. The `Authorizer`'s clock is `now()` from `client.now()`'s result (`Timestamp(utc_iso, domain, uncertainty_ms)`), and `elapsed()` from the operator's own monotonic clock.
  * Every reply's `epoch` goes to `authorizer.observe_epoch(EpochId(reply.epoch))`.
  * Step 4's `KernelLink`:
    * `engage` and `release` mint through the `Authorizer`, then call `client.execute(caller.path, request, args)`;
    * `kill_engaged` and `present_inputs` read `client.kill_status()`.
  * It maps `answered` results to `Committed`, `Replayed` and `Refusal` for the CLI and the API, and calls `consumed` on `committed`, on `replayed`, or on a `refusal` coded `SEC-R08`.
  * On `ChannelAmbiguous` or `ambiguous`, it retries with the same nonce. The alert route reads `alerts`, and per-person command reads filter `command_status`.
* **SLICE-09 and SLICE-11:** the strategy host's `KernelPorts` over the channel is one client call per method. `alive()` is `True` for an `answered` reply and `False` on `ChannelRefused` or `ChannelAmbiguous`. Each other method raises SLICE-09's `KernelUnavailable` on either exception and on an `ambiguous` reply, and otherwise returns the answered result decoded back to the in-process return value: the digest; the string or `Refusal`; the `Outcome`; the `CommandStatus` or `None`.
* **SLICE-11:**
  * composes `ChannelCore(comp, peers=parse_peers(profile["channel"]), submit=host.submit, main_pid=systemd_main_pid, identity_of=process_identity)` and `KernelChannelServer(core, <its run directory>/kernel.sock, socket_gid=<the channel group's gid>)`;
  * passes `relays=peers.relays()` to `Authority`;
  * installs the socket directory owned by the kernel's user, with the channel group allowed to search and nobody else to write;
  * puts each peer unit's user in that group;
  * gives each client the kernel's uid and gid and the bundle's release digest;
  * its step 2 adds the projection digests beside `contract` and `release` (configuration spec, boundary handshakes).

### Tests

`tests/integration/test_unix_channel.py` (tree delta **T-62**) holds PRF-SEC-05. The groups marked **Linux** use real sockets and `SO_PEERCRED` (`skipif(sys.platform != "linux")`). They run where the slice header says, and PRF-SEC-05 counts only from that run. Every other group calls `ChannelCore.handle` or the frame functions directly, and runs on Windows and Linux.

**Synthetic values** (labelled synthetic in the file):

* **Peers** (all-platform groups):
  * the relay `Peer("at-operator-sim.service", 1500, SIM_RELAY, "relay")`;
  * the service `Peer("at-strategy-sim.service", 1501, SVC, "service")`, with `SVC = Principal("strategy:sim", "service")`.
* **Process facts:**
  * `MAIN = {"at-operator-sim.service": 4100, "at-strategy-sim.service": 4200}`, so `main_pid = MAIN.get`;
  * `IDS = {4100: {"boot_id": "boot-synthetic", "start_ticks": 7100}, 4200: {"boot_id": "boot-synthetic", "start_ticks": 7200}}`, so `identity_of = lambda pid: IDS.get(pid, {})`.
* **Release:**
  * `RELEASE = "42cf37207ad994b20a7eb7892220d6b1b7395f9b20449c1302e39f60dc06e4d9"`, the SHA-256 of the UTF-8 text `synthetic-bundle-1`, standing in for a `bundle_digest`;
  * `RELEASE_2 = "849a6f736dc55adf49babb52c5ef59f114420b43b1f8b411640e908d91b7843e"`, the SHA-256 of `synthetic-bundle-2`;
  * every world in this file is built with `receipt=CHANNEL_RECEIPT`, where `CHANNEL_RECEIPT = dict(RECEIPT, bundle_digest=RELEASE)` (`RECEIPT`, `tests/conftest.py:41-43`). The fixture's own `RECEIPT` has no `bundle_digest`, so `tests/conftest.py` does not change.
* **Frames:** `frame(op, body, *, pid=4100, identity=IDS[4100], contract=CONTRACT, release=RELEASE)` is `encode` of the five-key request without its newline.
* **Submit:** `Counted`, an inline submit that counts its calls. Each refused case asserts the count unchanged and the ledger's event count unchanged.
* **Every reply** that `handle` or a socket returns in this file is checked to carry `epoch == comp.writer.epoch.value`, through one helper.
* **Minting:** `mint(comp, evidence, operation, target, args, *, nonce, named=None, typed=None) -> (OperatorRequest, path)` is `operator_call` (`bootstrap.py:95-120`) without the relay. It authenticates, opens a session, prepares when the door asks, executes and ends the session, then returns the request and `caller.path`. The tests type as the person.
* **Request IDs and digests,** each the SHA-256 of the canonical text beside it:
  * `[["owner","human"],"uid:1001","nonce-channel-000000001"]` → `d8ed75b5ed932639a3f8fa7b90484902f2de521dfa115616afa30b0dcd922f14`;
  * the kill engage digest `["operator-request/1","kill_engage",{"account":null,"subject":null},{"reason":"synthetic reason"}]` → `572cc58e9df728c9497437d14fd6cea8a2edc5a07bc739c2ab598ba96eb4a896` (step 2's);
  * the grant `g-svc` (`test_grant(SVC, "g-svc")`, `entry` on `ACCT`): `["operator-request/1","grant_admin",{"account":null,"subject":"g-svc"},{"grant":{"accounts":[["sim","acct-sim"]],"actions":["entry"],"delegation_limit":0,"grant_id":"g-svc","parent_grant_id":null,"principal":["strategy:sim","service"],"valid_from":"2026-11-01T00:00:00.000000Z","valid_until":null},"step":"issue"}]` → `5b0cbdce68d4ee3d4d3659239a203b9e5172e9db5a6126ca1548bafa2233f95b`.
* **Worlds:**
  * `action_world(ACK, policy=OFF)`, the world step 2's Binding group used;
  * for the fence and the advance, `simulation([], advance=False, grant=False, calendar=admission_calendar(), admission=admission_ports(kernel_safety=True))`, which stays in `RECOVERY_WRITING`.

| Group | Cases |
|---|---|
| Peers | `parse_peers({"relays": {"at-operator-sim.service": {"uid": 1500, "principal": "svc:operator-sim"}}, "services": {"at-strategy-sim.service": {"uid": 1501, "principal": "strategy:sim"}}})` equals the two synthetic peers, relay first; `relays()` is `frozenset({SIM_RELAY})`; `uids()` is `{1500, 1501}`. Each raises `ValueError`: a missing `services` key; an extra top-level key; an entry with an extra key; uid `-1`, `True` and `"1500"`; units `session-3.scope`, `user@1500.service`, `at op.service` and `a/b.service`; the same unit under both roles; one principal for two units; no peers at all. Two units sharing uid 1500 are accepted. `ChannelCore` raises `ValueError` for a relay peer whose principal is `svc:other` (not in `comp.authority.relays`), for `SIM_RELAY` listed as a service, and over `simulation([])` (no admission). It raises `ChannelError("release")` over `simulation([], receipt=None, calendar=admission_calendar(), admission=admission_ports(kernel_safety=True))` (no `RELEASE_BOUND`), over the same with `receipt=RECEIPT` (no `bundle_digest`), and with `bundle_digest` `"x" * 64` |
| Release (R-1: code only) | World A with `CHANNEL_RECEIPT`; `ChannelCore` over it has `release == RELEASE`, and `now` sent with `RELEASE` is answered. A shuts down. World B composes on the same ledger with `dict(CHANNEL_RECEIPT, deployment=dict(RECEIPT["deployment"], **{"recovery.lease_secs": 31}))`: the ledger now holds two `RELEASE_BOUND` with different `receipt_digest`s. A `ChannelCore` built after B's `recovery.run()` still has `release == RELEASE`, and `now` sent with `RELEASE` is **answered**: a changed deployment key turns no peer away. World C composes on the same ledger with `dict(CHANNEL_RECEIPT, bundle_digest=RELEASE_2)`: `now` with `RELEASE` is `SEC-R11` `release`, and with `RELEASE_2` it is answered |
| Facts | `systemd_main_pid` with `subprocess.run` monkeypatched to record its call: the argv is exactly `["systemctl", "show", "--property=MainPID", "--value", "at-operator-sim.service"]`, with `timeout=2`, `check=False` and `env == {"PATH": "/usr/bin:/bin", "LC_ALL": "C"}`. Stdout `"4100\n"` with return code 0 gives 4100. `"0\n"` gives `None`, as do `""`, `"x\n"`, return code 1, `OSError` and `TimeoutExpired`. **Linux:** `process_identity(os.getpid())` has exactly the keys `boot_id` (non-empty) and `start_ticks` (an int); a pid that does not exist gives `{}` |
| Frames | Over `socket.socketpair()`, with a short timeout of 0.2 s passed to `read_frame`. `b'{"a":1}\n'` gives `b'{"a":1}'`. `b'{"a":1}\nXYZ'` gives the same (the rest is discarded). `b'{"a":1}'` then end of stream is `incomplete`. Nothing sent is `timeout`. 4,194,305 bytes of `x` with no newline is `oversize`, written from a thread. 4,194,303 bytes of `x` then `\n` (a buffer of exactly 4,194,304) is read whole. 4,194,304 bytes of `x` then `\n` is `oversize`, though the newline arrived (legacy's loop, `channel.py:75-81`). `decode_frame`: `b"\xff"` is `encoding`; `b"[1]"` is `not_object`; `b'{"a":NaN}'`, `b'{"a":Infinity}'`, `b'{"a":1,"a":2}'` and `b'{"b":{"a":1,"a":2}}'` are `json`. `encode({"b": 1, "a": "é"})` is exactly `b'{"a":"\\u00e9","b":1}\n'` |
| Attestation | `action_world`, a `ChannelCore` with the synthetic peers, and `Counted`. `handle(PeerCred(4100, 1500), frame("now", {}))` is answered. Each case below is refused before any kernel call, with its code and reason: `PeerCred(4100, 1600)`: `SEC-R12` `uid` (no listed peer has that uid), and the recording `main_pid` was asked about nothing. `PeerCred(4300, 1500)`: `SEC-R12` `unit` (a person's session); the recording `main_pid` was asked exactly about the two listed units, in order. A `main_pid` that returns `None` for the stopped `at-strategy-sim.service` (`MAIN` without it), with `PeerCred(4200, 1501)`: `SEC-R12` `unit`. `main_pid` mapping `at-other.service` to 4300, with `PeerCred(4300, 1500)`: `SEC-R12` `unit` (an unlisted unit). `PeerCred(4100, 1501)`: `SEC-R12` `uid` (the relay unit's pid under the service's uid). `PeerCred(0, 1500)` with `MAIN` unchanged: `SEC-R12` `unit`. `PeerCred(4300, 1500)` with `b"garbage"`: `SEC-R12` `unit` (the peer first). Caller pid 4101: `SEC-R12` `identity`. `start_ticks` 7101: `identity`. `identity_of` returning `{}` with caller identity `{}`: `identity`. A `FrameError` of each reason: `SEC-R11` with that reason. An extra key `principal`: `SEC-R11` `shape`, and so is a caller with an extra key, caller pid `True`, a list body and op `5`. Contracts `"kernel-channel/2"`, `"kernel-channel/1."` and `""`: `SEC-R11` `contract`. Release ending `…e4d8` and `RELEASE.upper()`: `SEC-R11` `release`. Op `submit_order`: `SEC-R11` `op`. `execute` from `PeerCred(4200, 1501)` (identity 7200): `SEC-R10` `role`. `submit` from the relay: `SEC-R10` `role`. `now` with body `{"x": 1}`: `SEC-R11` `call`. Each refusal reply is exactly `{"contract": "kernel-channel/1", "epoch": <the writer's>, "outcome": "refused", "result": null, "refusal": {"code", "label", "reason"}}`, with the spec's label. The log record names the code and reason and holds no frame byte |
| Reads | In `action_world`: `now` is `{"utc_iso": "2026-11-02T09:15:00.000000Z", "domain": "recorded", "uncertainty_ms": null}`. **The ratchet:** the clock advances 121,000 ms, the owner's bound `hold_engage` of `buyer_edge` commits through `execute`, then `jump_wall(-300_000)`; `now` is `2026-11-02T09:17:01.000000Z`, recorded, which is also `effective_now(comp.writer, comp.clock)` read directly. `kill_status` is `{"engaged": false, "inputs": [], "watched": null, "input_state": "off"}`. After the owner's bound kill engage through `execute`, `engaged` is true. `admission_world(kernel_safety=True, kill_inputs=KillInputs.resolve(False, ("run/KILL",), tmp_path))`, with the file created and one `run_pass()`: `{"engaged": true, "inputs": [<the file>], "watched": true, "input_state": "engaged"}`. `admission_world(kernel_safety=True, kill_inputs=KillInputs(False, ()))`: `alerts` is `{"recovery": ["kill_file_unwatched"], "policy": []}`. `command_status` for `k-none` is `{"status": null}`. Each read is one hand-off |
| Execute | One case per row of the call table, each minted with `mint` and sent from `PeerCred(4100, 1500)`. Each is exactly one hand-off, and its request's ID is then in the ledger: an `OPERATOR_REQUEST` for a commit or an admission, an `OPERATOR_REQUEST_REFUSED` for a refusal. **Committed:** kill engage (owner, uid 1001, nonce `nonce-channel-000000001`, reason `synthetic reason`); kill release (`DISENGAGE` typed); hold engage and release of `buyer_edge` (`released_reason` `operator`, `justification` `synthetic justification`); grant `g-bind` issue and revoke; binding `b-bind` (SCOPE, `POLICY_ID`, `(CANDIDATE,)`, 2026-11-01 to 2026-11-30) authorize and revoke; and, in the `RECOVERY_WRITING` world, the fence for `old-host` **first**, then the advance (R-10). **Refused by the kernel, recorded:** latch unlock of `SESSION` with strategy `buyer_edge` is `LED-R09`; pause clear of `pause-synthetic` is `LED-R09`; `attempt_resolve` of `k-none` (attempt 1, legs `{"primary": null}`, observation `{"store": "simulated", "content_digest": "c" * 64, "published_at": "2026-11-02T09:15:00.000000Z"}`) is `DOM-R04`. **Outcome:** cancel `k-c1` of `o-stop` and close `k-x1` naming `E1` (`TEST_PRINCIPAL`, uid 1002, typed), and advice application modify `k-m1` (trigger `11.00`, advice registered with `FixtureAdvice.allow`, `TEST_PRINCIPAL` on the owner API's proxy). Each is `{"kind": "outcome", "replayed": false, …}`, and its `COMMAND_ADMITTED.dependencies.operator_request` is the request's ID. **The first commit's payload:** the kill engage's `OPERATOR_REQUEST` has `request_id` `d8ed75…2f14`, `argument_digest` `572cc5…a896`, `via` `["svc:operator-sim","service"]` and `channel_identity` `uid:1001` |
| Decoding | For each call-table row, the good request with `args` missing its first key, and with an extra key `x`, is `SEC-R11` `call`, with no hand-off. So are: `recovery_advance` with `step` `other`; a grant whose `principal` has three items; a binding whose `scope` is a string; a fence missing `accounted`; an observation with an extra key; an action that is a list; a body without `path`; a `request` with a missing key. **The kernel recomputes:** the kill engage minted with reason `synthetic reason` and sent with `args` `{"reason": "other reason"}` is one hand-off, answered `{"kind": "refusal", …}` with code `SEC-R09`, and one `OPERATOR_REQUEST_REFUSED` with the request's ID and `SEC-R09` |
| Relay | The bound requests are each `SEC-R10` `relay`, with no hand-off: `TEST_PRINCIPAL`'s request sent with path `owner_credential`; the owner's with `operator_credential`; the owner's with path `local_channel`. The same requests with their own paths pass to the kernel |
| Replay | The kill engage executed twice with the same request: the second reply is `{"kind": "replayed", "replayed": true, "request_id": "d8ed75b5ed932639a3f8fa7b90484902f2de521dfa115616afa30b0dcd922f14", "decision": "KILL_ENGAGED", "sequence": s, "outcome": null}`, with `s` the first `OPERATOR_REQUEST`'s sequence, and the event count unchanged. The cancel `k-c1` sent again is `replayed` with `outcome.command_key == "k-c1"` |
| Services (one case per `KernelPorts` method) | The owner issues `g-svc` through `execute`: committed, with `argument_digest` `5b0cbd…f95b`. Each case below is sent from `PeerCred(4200, 1501)` (identity 7200), and each answered case is exactly one hand-off. **`alive`:** `{"alive": true}`. **`publish`** of `{"kind": "synthetic-output", "n": 1}`: `{"digest": "d82158c4c7401b6b7c3cb188a13481dffc7ac6f1f5dd0a772a8ed6a7039f0ff1"}`, the SHA-256 of `{"kind":"synthetic-output","n":1}`. **`record_decision`** of `DecisionRecord("inv1:synthetic-1", SVC, "buyer_edge", SESSION, "2026-11-02T09:14:00.000000Z", "NOTHING", <that digest>)`: `{"kind": "answer", "replayed": false, "answer": "recorded"}`, and one `DECISION_RECORDED`. Sent again: `"existing"`, with nothing more written. **`record_unavailable`** of that digest with cause `review_request_failed`, in this `policy=OFF` world: `"not_required"`. **`submit`** of `world.request(make_intent(), "k-s1", principal=SVC)`: `{"kind": "outcome", …}`, and `comp.writer.command("k-s1")` exists with the service as principal. **`command_status`** of `k-s1`: the state and verb of that row. **Claims:** `submit` of `k-s2` with principal `TEST_PRINCIPAL` is answered with an outcome whose refusal code is `SES-R01`. **`SEC-R11` `call`,** with no hand-off: a decision wire with an extra key; one with `kind` `MAYBE`; `publish` with body `{"output": [1]}`; `record_unavailable` with `cause` `5`; a submit request with an extra key `strategy`; one with `verb` `cancel`. **From the relay,** `alive`, `publish`, `record_decision`, `record_unavailable` and `submit` are each `SEC-R10` `role` |
| Ambiguous | A submit whose function raises `RuntimeError("synthetic-error-text")` gives `{"outcome": "ambiguous", "result": {"error": "RuntimeError"}, "refusal": null}`, and the encoded reply holds no byte of `synthetic-error-text`. A hand-off returning `object()` gives `{"error": "TypeError"}`. A cancelled future gives `{"error": "CancelledError"}` |
| Socket (**Linux**) | A short directory from `tmp_path_factory.mktemp("ch")`, the socket `kernel.sock` in it (under 100 bytes), `action_world`, peers with the relay at `os.getuid()`, `main_pid` mapping the relay unit to `os.getpid()`, `identity_of=process_identity`, and a one-thread executor's `submit`. After `start()`: the socket's mode is `0o600` and its owner `os.geteuid()`; `kernel.sock.lock` exists with mode `0o600`. `KernelChannelClient(path, server_uid=os.getuid(), server_gid=None, release=RELEASE)`: `now()` is answered with the writer's epoch; the owner's bound kill engage through `execute` commits; `kill_status()` shows it engaged. **Refused at start:** a second server on the same path is `ChannelError("locked")`; after the first's `shutdown()`, a third starts over the stale socket file. A directory chmodded `0o777` is `ChannelError("directory")`, and so is `os.geteuid` monkeypatched to return the real value plus 1. **Client refusals,** each with no hand-off: `server_uid=os.getuid() + 1` is `owner`; the socket chmodded `0o666` is `mode`; the directory chmodded `0o777` after start is `directory`; `peer_cred` monkeypatched in the module to report uid + 1 is `peer_uid`; a missing path is `missing`. **Group:** a server with `socket_gid=os.getgid()` has mode `0o660` and that `st_gid`. A client with `server_gid=os.getgid()` is answered; with `None` it is refused `mode`. **Malformed replies:** a stand-in listener in the same directory answering `b'{"x":1}\n'` gives `ChannelAmbiguous("malformed_reply")`, and one closing without a reply gives `ChannelAmbiguous("incomplete")`. **Oversize:** 4,194,305 bytes of `x`, sent raw from a thread that ignores send errors, gives a `SEC-R11` `oversize` reply |
| Real peer (**Linux**) | A child `subprocess` with the test's interpreter and environment builds a client and calls `kill_status()` after reading one line from stdin. The parent sets the relay unit's main pid to the child's `Popen.pid`, then writes the line: the child prints an answered reply. Mapped to the test's own pid instead, the child's call is `SEC-R12` `unit`. The test process sending a raw frame that names the child's pid and the child's `process_identity` as its `caller` is `SEC-R12` `unit`: the peer is what `SO_PEERCRED` says, not what the frame says |
| Lost reply (**Linux**) | A raw socket sends the owner's bound kill engage and closes without reading. `kill_status()` through the client is polled, for at most 5 s, until it is engaged; the server logs `reply lost`. The same request sent again through the client is `replayed`, and exactly one `KILL_ENGAGED` exists |
| Boundary | Parsed with `ast`: the module-level imports of `adapters/unix_channel.py` from `autonomous_trading` are only `contracts` modules and `interfaces.authorization`. In a child process, importing the module and building a client leaves no `autonomous_trading.kernel` module in `sys.modules`. `tests/contracts/test_capabilities.py`'s `_BUILDERS["Authenticated("]` holds `adapters/unix_channel.py`, and `test_decisions_built_only_by_the_kernel` and `test_authenticated_never_replaced` pass |

### Break checks

Each mutation is applied after its anchor is checked present exactly once, run against the listed test file, and restored byte for byte with an md5 check. Each must fail a test. Rows marked **Linux** run in the Linux run.

| Change | Anchor | Test that must fail |
|---|---|---|
| The listed-uid check removed | `handle` row 1's `peers.uids()` | Attestation (uid 1600: `main_pid` is asked about both units, where the test asserts it was asked nothing, and the reason is `unit`, not `uid`) |
| The release read from `receipt_digest` instead of the receipt's `bundle_digest` | `ChannelCore`'s `self.release` | Release (world B's `now` with `RELEASE` is refused) |
| The main-pid check removed | `handle` row 2 | Attestation (a person's session answered; the peer of the stopped unit, whose `main_pid` is `None`, answered) |
| The matched unit's uid not compared | `handle` row 3 | Attestation (uid 1501 on the relay's pid) |
| The frame checked before the peer | rows 1–3 moved after row 4 | Attestation (garbage from pid 4300 gives `SEC-R11`) |
| The caller's pid not compared with the peer's | `handle` row 6's `caller.pid != peer.pid` | Attestation (pid 4101) |
| An empty identity accepted | `handle` row 6's empty test | Attestation (`{}` with `{}`) |
| The contract compared with `startswith` | `handle` row 7's `==` | Attestation (`"kernel-channel/1."`) |
| The release compared case-insensitively | `handle` row 8's `==` | Attestation (`RELEASE.upper()`) |
| The release not checked | `handle` row 8 | Attestation (release `…4bd4`) |
| A service may `execute` | `ROLE_OPS["service"]` | Attestation (`SEC-R10` `role`) |
| The relay may `submit` | `ROLE_OPS["relay"]` | Attestation; Services |
| A service operation called with `auth=None` (the coordinator's disarmed table then authenticates) | `svc_auth` in the service calls | Services (`k-s1` gives `SES-R01`; `record_decision` is refused) |
| `publish` accepts a non-object output | the `publish` body check | Services (`{"output": [1]}`) |
| `accept_relay` skipped | `handle` row 12 | Relay |
| An extra `args` key accepted | the call table's exact key sets | Decoding (`SEC-R11` `call` with no hand-off) |
| The call decoded from a fixed default when a key is missing (`args.get`) | the same | Decoding |
| The action's principal taken from `args["action"]` | the `dict(action, principal=…)` | Execute (the cancel `k-c1` is refused `SEC-R11` `call`: `action_wire` holds no principal) |
| A kernel call made on the handler thread, not by `submit` | `handle` row 13's `submit(fn)` | Reads and Execute (the hand-off count) |
| The epoch left out of refusal replies | the reply builder's `epoch` | Attestation (the epoch helper) |
| `replayed` not set on a `Replayed` | `result_wire`'s `Replayed` branch | Replay |
| The exception's message in an `ambiguous` reply | `handle`'s `{"error": type(exc).__name__}` | Ambiguous |
| `oversize` at `>= MAX_MESSAGE` | `read_frame`'s length test | Frames (the 4,194,303-byte line, a buffer of exactly 4,194,304, is refused) |
| The size checked only while the buffer holds no newline (not legacy's loop) | `read_frame`'s check after each append | Frames (the 4,194,304-byte line with its newline is read) |
| `NaN` accepted | `decode_frame`'s `parse_constant` | Frames |
| Repeated keys accepted | `decode_frame`'s `object_pairs_hook` | Frames |
| A MainPID of `0` returned as 0 | `systemd_main_pid`'s `> 0` test | Facts (`"0\n"` gives 0, not `None`) |
| `systemctl` given the process environment | `systemd_main_pid`'s `env=SYSTEMCTL_ENV` | Facts |
| `ChannelCore` accepts a service principal among the relays | its `relays` check | Peers |
| The directory check removed (**Linux**) | `start()`'s `st_mode & 0o022` | Socket (the `0o777` directory starts) |
| The lock removed (**Linux**) | `start()`'s `flock` | Socket (the second server starts) |
| The socket left at the umask's mode (**Linux**) | `start()`'s `chmod 0o600` | Socket |
| The client's owner check removed (**Linux**) | `socket_problem`'s `st_uid != server_uid` | Socket (`owner`) |
| The client's mode check ignores other bits (**Linux**) | `socket_problem`'s `& 0o007` | Socket (`0o666`) |
| The client's peer uid not checked (**Linux**) | `call`'s `peer_cred(sock).uid != server_uid` | Socket (`peer_uid`) |
| The peer taken from the frame's `caller.pid` instead of `SO_PEERCRED` (**Linux**) | the connection handler's `peer_cred(self.request)` | Real peer (the test process naming the child's pid is answered) |
| A kernel module imported at module level | a top-level `from autonomous_trading.kernel.authority import Authenticated` | Boundary |
| `adapters/unix_channel.py` removed from the builder set | `_BUILDERS["Authenticated("]` | `test_decisions_built_only_by_the_kernel` |

### Files

| File | Change |
|---|---|
| `src/autonomous_trading/adapters/unix_channel.py` | New: `CONTRACT`, `MAX_MESSAGE`, the three timeouts, `LABELS`, `OPS`, `ROLE_OPS`, `SYSTEMCTL_ENV`, `Peer`, `ChannelPeers`, `parse_peers`, `PeerCred`, `peer_cred`, `process_identity`, `systemd_main_pid`, `FrameError`, `encode`, `read_frame`, `decode_frame`, `ChannelError`, `ChannelCore` with the call table, the six service operations, `decision_wire` and `result_wire`, `KernelChannelServer`, `ChannelRefused`, `ChannelAmbiguous`, `Reply`, `socket_problem`, `KernelChannelClient` |
| `tests/integration/test_unix_channel.py` | New (T-62) |
| `tests/contracts/test_capabilities.py` | `_BUILDERS["Authenticated("]` (`:122`) gains `adapters/unix_channel.py`; its comment already names step 5 |

No new tree delta. `adapters/unix_channel.py` is in the target tree (`README.md:1046`), and the test file is T-62. No kernel module, migration, event kind, setting, composition or existing test expectation changes.

### Completion conditions (step 5)

* **Targeted tests only, no full suite** (the owner's routine). On Windows: `tests/integration/test_unix_channel.py`, where the Linux groups report their skip, and `tests/contracts/test_capabilities.py`, the existing test that reads the changed guard. No existing test imports the new module.
* **The Linux groups (PRF-SEC-05) run on the EC2,** in one run of the same two files. The run uses a throwaway folder under `~/claude-desktop/outputs`, made from an `OA_NEW` git bundle, with `~/at-dev`'s environment and the project's safe test runner, as step 3's Linux run. No live checkout or service is touched, and the folder is removed afterwards. PRF-SEC-05 counts from this run only.
* All code is written and committed in `OA_NEW` only. `git diff --name-only` names exactly the three files above, in one commit.
* The break checks run as before: each mutation one at a time, anchor checked first, the **Linux** ones in the EC2 run, every file restored (md5). The table above is the plan; the **final break-check table** (each change, its anchor and the test that failed) is written in "as built". `ast.parse` passes on every edited Python file.
* The build starts on the coordinator's word; every cited line, and SLICE-09 step 2's `KernelPorts`, is re-read on the head it starts from.
* PRF-SEC-05 passes, and the targeted existing tests pass with no expectation changed.
* This file records step 5 "as built", with any Deviation or Fork call found while building.

### Step 5 as built

**In plain words.** The kernel's private door is built and tested. Only an approved service, as the operating system reports it, gets in. A program from other code is turned away, but a changed setting turns no one away. Your requests reach the kernel's own checks unchanged. A lost answer, asked again, returns the first answer. Nothing in the kernel, the ledger or the settings changed.

Commit `e6cfb28` on `slice-08`, after `e4948d0` (SLICE-09 step 2). It changes exactly the three files in the step's table (+1,717 −1). Nothing is pushed. No new Deviation or Fork call was found.

**Choices made while building:**

| Topic | As built |
|---|---|
| `KernelPorts` re-read at `e4948d0` | `strategies/worker.py:130-142` and `bootstrap.InProcessKernel` (`bootstrap.py:301-324`) have the six methods and signatures the text assumed. The coordinator routes are `kernel/coordinator.py:163-175` |
| The `record_decision` test value | `Policy.record_decision` requires the principal `strategy:<record.strategy>`, and a `NOTHING` record must name a published abstention with the same invocation, strategy, session and trigger (`kernel/policy.py:231-275`). So the case records strategy `sim` for `strategy:sim`, citing an abstention published through the channel's own `publish`. Likewise, `record_unavailable` cites an intent published with strategy `sim` |
| Wire helpers | `refusal_wire`, `outcome_wire` and `status_wire` are module functions beside `result_wire`. `encode_reply` (an encoding failure becomes `ambiguous`) is a `ChannelCore` method, so it can be tested without a socket |
| The client's mode case | `0o666` alone could not catch "the client ignores other bits", because its group bits refuse anyway. The test also chmods `0o606` (other bits only) |
| The builder-set check | The Boundary group reads `_BUILDERS` with `ast` rather than importing the other test module |
| The Linux run | A git bundle of a snapshot commit object (no branch moved) was unpacked into `~/claude-desktop/outputs/s10e-linux` on the EC2. It ran under the legacy safe runner with `--memory-max 1G`, because the host had 1.9 GB free, with absolute test paths and `--rootdir`. The folder and every copied file were removed afterwards. No live checkout or service was touched |

**Tests** (targeted only, per the owner's routine):

* Windows: `tests/integration/test_unix_channel.py` and `tests/contracts/test_capabilities.py`: 31 passed, 7 skipped (the Linux groups).
* Linux (EC2): the same two files, 38 passed, none skipped. PRF-SEC-05 passes there.
* `ast.parse` passes on the three files.

**Break checks** (`s10e_breaks.py` in the session scratchpad). Each anchor was checked present exactly once, one mutation at a time, and every file was restored byte for byte, md5 verified. All 38 failed a listed test: 31 on Windows, and the 7 Linux rows on the EC2.

| Change | Anchor | Test that failed |
|---|---|---|
| The listed-uid check removed | `handle` row 1 | Attestation (uid 1600: `main_pid` asked, reason `unit`) |
| The main-pid check removed | row 2's `main_pid(p.unit) == peer.pid` | Attestation |
| The matched unit's uid not compared | row 3 | Attestation |
| The frame checked before the peer | a frame test added before row 1 | Attestation (garbage from pid 4300) |
| The caller's pid not compared | row 6's `caller["pid"] != peer.pid` | Attestation |
| An empty identity accepted | row 6's `not identity` | Attestation |
| The contract compared with `startswith` | row 7 | Attestation |
| The release compared case-insensitively | row 8 | Attestation |
| The release not checked | row 8 | Attestation |
| A service may `execute` | `ROLE_OPS["service"]` | Attestation |
| The relay may `submit` | `ROLE_OPS["relay"]` | Attestation; Services |
| `accept_relay` given the path the principal implies | row 12's `body["path"]` | Relay |
| An extra key accepted | `_keys`' exact set | Decoding |
| A missing key decoded as a default | the `kill_engage` row's `_keys` | Decoding |
| The action's principal taken from `args["action"]` | `dict(action, principal=…)` | Execute |
| A kernel call on the handler thread | row 13's `submit(fn)` | Reads (the hand-off count) |
| The epoch left out of refusals | `_refuse`'s reply | Attestation |
| `replayed` not set | `result_wire`'s `Replayed` branch | Replay |
| The exception's message in an `ambiguous` reply | `_run`'s `{"error": …}` | Ambiguous |
| `oversize` at `>= MAX_MESSAGE` | `read_frame`'s length test | Frames |
| The size checked only while no newline | the same | Frames |
| `NaN` accepted | `decode_frame`'s `parse_constant` | Frames |
| Repeated keys accepted | `decode_frame`'s `object_pairs_hook` | Frames |
| A MainPID of `0` returned | `systemd_main_pid`'s `<= 0` | Facts |
| `systemctl` given the process environment | `env=SYSTEMCTL_ENV` | Facts |
| A service principal among the relays | `ChannelCore`'s relays check | Peers |
| The release read from `receipt_digest` | `self.release` | Release |
| Service calls with `auth=None` | `svc_auth` | Services |
| `publish` accepts a non-object | the `publish` body check | Services |
| A kernel module imported at module level | the module's imports | Boundary |
| `adapters/unix_channel.py` removed from the builder set | `_BUILDERS["Authenticated("]` | `test_decisions_built_only_by_the_kernel` |
| The directory check removed (Linux) | `start()`'s `st_mode & 0o022` | Socket start refusals |
| The lock removed (Linux) | `start()`'s `flock` | Socket |
| The socket left unrestricted (Linux) | `start()`'s umask and `chmod 0o600` | Socket |
| The client's owner check removed (Linux) | `socket_problem`'s `st_uid != server_uid` | Socket |
| The client ignores other bits (Linux) | `socket_problem`'s `& 0o007` | Socket (`0o606`) |
| The client's peer uid not checked (Linux) | `call`'s `peer_cred(sock).uid` | Socket |
| The peer taken from the frame's `caller.pid` (Linux) | `_serve`'s `peer_cred(sock)` | Real peer |

## Step 6 — the operator process and the CLI (outline)

Deepened after step 5 is built. Authority: the spec's [Owner API transport](../../design/security-and-operator.md#owner-api-transport-interfacesapipy) and [Operator commands](../../design/security-and-operator.md#operator-commands-interfacesclipy-interfacesapipy).

* **Builds:** `interfaces/api.py`, an ASGI app whose web framework is an optional dependency extra, never imported by the kernel composition. It carries:
  * sessions, CSRF, nonce, reachability and the body cap;
  * the CLI socket (group `at-operators`, mapped login users, no service peers);
  * the relay with `via` and `channel_identity`, dropping sessions on an epoch change;
  * the catalogue's routes under `/owner/api/v1`;
  * the latch's strategy-to-session mapping (`SEC-R21`);
  * reads, alerts and `GET /events`.

  Also: the catalogue's `at` commands in `interfaces/cli.py` and the package's `__main__.py`; `deploy/systemd/at-operator.service`.
* **Tests:**
  * `tests/integration/test_operator_commands.py` (tree delta **T-63**): the catalogue end to end. The CLI-socket rows run in Linux; the rest everywhere.
  * `tests/integration/test_owner_api.py` (tree delta **T-64**): legacy's reachability cases, rewritten as independent expectations.
* **Done when:** PRF-SEC-06 and PRF-SEC-07 pass; CUJ-SEC-1 and CUJ-SEC-2 behave as written.

## Step 7 — the legacy owner mutations (outline)

Deepened after step 6 is built. Authority: the spec's [Other legacy owner mutations](../../design/security-and-operator.md#other-legacy-owner-mutations).

* **First:** re-list every mutating route of the legacy owner API, the HTML console API and the console's MCP write allowlist at 445eb116. Any route missing from the spec's table is added to it before building.
* **Builds:**
  * each route under `/owner/api/v1`, reaching the kernel (`binding_authorize` for deactivate and policy activation and rollback) or its owning module;
  * `SEC-R22` while an owner is not composed;
  * `at orders reconcile` as a read of the day's reconciliation findings, and `at orders clear-conflict` as the mapped explanation;
  * the advice-application route over `application_request` (SLICE-09), bound as `advice_apply`.
* **Tests:** `tests/integration/test_operator_routes.py` (tree delta **T-69**): every table row, and advice application with a fake `application_request` before SLICE-09.
* **Done when:** PRF-SEC-13 passes.

## Step 8 — the AI tools and disclosure (outline)

Deepened after step 7 is built. Authority: the spec's [MCP surface](../../design/security-and-operator.md#mcp-surface-interfacesmcppy) and [Read scope and disclosure](../../design/security-and-operator.md#read-scope-and-disclosure-interfacesauthorizationpy-interfacesmcppy).

* **First:** copy the read allowlist and tool names from legacy `openalgo/server.py:62-79`, and the console's tool allowlists from `admin_console/src/config/tools.ts`, with provenance, and record the legacy tool list per domain, so the kept surface is exact.
* **Builds:**
  * `interfaces/mcp.py`, with its MCP library an optional extra;
  * the projection registry, `read`, `disclose`, scoped caches, redaction and scrubbing;
  * the console as a client (OIDC token, or the shared token from secrets);
  * `propose_intent`, refusing until SLICE-09's sink exists.
* **Tests:** `tests/integration/test_mcp_surface.py` (tree delta **T-65**) with an in-memory upstream; `tests/contracts/test_capabilities.py` for PRF-SEC-09, inspecting each composed process's environment and its children's.
* **Done when:** PRF-SEC-08 and PRF-SEC-09 pass; CUJ-SEC-3 is refused.

## Step 9 — restore continuity (outline)

Deepened after step 8 is built (it needs only step 2). Authority: the spec's [Restore continuity](../../design/security-and-operator.md#restore-continuity-interfacesauthorizationpy).

* **Builds:**
  * the `SecurityJournal` interface and an in-memory fake;
  * issue before the ledger commit, refused when a composed journal is unreachable;
  * revoke before the commit when reachable, else `journal: pending` and an alert;
  * the background catch-up, which is not a start gate;
  * `confirm_grant` over the journal, composed into recovery.
* **Tests:** `tests/recovery/test_restore_fencing.py`: CUJ-SEC-4 both ways. CP-SEC2 and CP-SEC3 by killing a real process. F-SEC5. A routine start with a pending revocation reaches `OPERATING` on time.
* **Done when:** PRF-SEC-10 passes; PRF-SES-06 still passes.

## Step 10 — the operator UI (outline)

Deepened after step 8 is built. Authority: the spec's [Operator UI](../../design/security-and-operator.md#operator-ui-operator_ui).

* **Builds:**
  * `operator_ui/*` from legacy `admin_console` at 445eb116, copied with its provenance;
  * the data-access layer (legacy `admin_console/src/lib/write.ts` and `admin_console/src/lib/gateway.ts`), which becomes or sits beside `operator_ui/src/api.ts`;
  * writes to the owner API with the session's CSRF header and an `x-request-id` per action;
  * reads through the MCP surface with the user's token;
  * the allowlists, the cross-site check and the OIDC session expiry kept.
* **Tests:** `tests/contracts/test_operator_ui_routes.py` (tree delta **T-66**), reading the ported data-access files and the owner API's route table. The legacy end-to-end checklist is run by hand once and recorded (not counted as a proof).
* **Done when:** PRF-SEC-11 passes.

## Open owner items

The standing rules settle every money fork. These two touch kill or owner rights, but legacy's live behaviour cannot be kept as it was, so they are logged for the owner's review:

* **Deleting the kill file no longer releases kill.** To keep legacy, the kernel would have to release kill with no principal holding `kill_release`, against Q-014. Recommendation: keep the stricter rule; `at kill-switch off` does both steps.
* **The CLI owner must be a mapped login uid.** Legacy's loopback rule would let any local service act as the owner on the socket that replaces Tier-1's, which never admitted one. Recommendation: keep the explicit map.

The earlier question on typed confirmations for `grant_admin`, `recovery_advance`, `attempt_resolve` and `binding_authorize` is settled by the fork rule: none, as legacy. The recommendation stays as a listed improvement.

## Changes other files need (integration)

* **Sessions spec:** `Authenticated.request` and `via`; `authority.bind`; validity in `recheck`; `kernel:safety`'s `kill_engage` exemption; journal ordering in `issue` and `revoke` and `journal: pending`; codes `SEC-R04`, `-R07`…`-R10`, `-R19`, `-R20` emitted by `kernel.authority`.
* **Protection spec:** the kill inputs under the legacy keys, `SEC-R16`, `Safety._authorized`'s one kernel case; the coordinator's read of the inputs before a claim.
* **Ledger spec:** `OPERATOR_REQUEST` (index `operator_request`), `OPERATOR_REQUEST_REFUSED`, `CREDENTIAL_BOUND` in the event catalogue.
* **Execution-domain spec:** `scrub` on the adapter's evidence and log writes.
* **Strategies spec:** the advice route's operation name `advice_apply` and its refusal under kill.
* **Module index:** tree deltas T-60…T-69 (step table above). **Delivery plan:** the SLICE-10 row and TASK-S10-01…10. **Traceability:** REQ-SEC-008…011.

## Completion conditions

* Every step's completion conditions hold, each step with its own two EGM reviews, the suite twice, its break checks and an "as built" record.
* PRF-SEC-01…13 pass; PRF-SEC-05 and the CLI-socket rows of PRF-SEC-06 from a Linux run.
* The spec and this file record each step "as built", with any Deviation or Fork call found while building.
