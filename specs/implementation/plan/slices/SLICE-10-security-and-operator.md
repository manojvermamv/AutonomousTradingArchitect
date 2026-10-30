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
| 3 | `settings/secrets.py`: references, protected sources, the live refusal of `env` for broker credentials, per-service scope, `Secret`, child environments, `scrub` and `redact`. `CREDENTIAL_BOUND`; `scrub` on the kernel's evidence and log writes; secret references in `config/live.example.yaml` | PRF-SEC-04 |
| 4 | Kill inputs, on every platform. The kernel reads `risk_guard.kill_switch` and `risk_guard.kill_switch_file` (alias `MCP_KILL_SWITCH_FILE`) before each claim, on each wake and before `OPERATING`, and `kernel:safety` records `KILL_ENGAGED`. `SEC-R16`; the live refusal of an empty path; `at kill-switch on`, `off` and `status` in `interfaces/cli.py`, with the file written first | PRF-SEC-12 |
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
* **Deviation — empty kill path.** A live composition refuses to start with an empty `risk_guard.kill_switch_file`, where legacy then watches nothing (`config/defaults.yaml:133`; `deploy/at:4262-4270`).
* **Deviation — audit in the ledger.** `OPERATOR_REQUEST` and bounded `OPERATOR_REQUEST_REFUSED` replace the side JSONL row (`security.py:92-112`; LD-15). Legacy's attribution strings are kept.
* **Deviation — replay.** A CSRF token per session and identity, a nonce per mutation, and sessions dropped at a kernel epoch change, replace one token per process (`security.py:13`; `write.ts:41-45`).
* **Deviation — binding for every privileged operation,** with consumption recorded in the ledger. Legacy binds only cancel and close, and keeps used IDs in memory (`owner_command.py:60-62`).
* **Deviation — value scrubbing** of every resolved secret, in disclosures and in the kernel's own evidence and logs. Legacy scrubs by key or field name only (`safety.py:12-18`; OA_NEW `adapters/openalgo.py:414`, `:468`).
* **Deviation — broker credential source.** A live composition refuses the broker key from the environment; files or systemd credentials only (`openalgo/server.py:52-54`). MCP static tokens move from configuration to secrets (`security.py:278`).
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
  * the kernel refuses `SEC-R10` when `request.principal` is not the relayed principal, `request.via` is not the relay peer, or `request.channel` does not fit the path (a human channel, with `owner_credential` exactly for the owner);
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

## Step 2 — the kernel's binding check (outline)

Deepened after step 1 is built. Authority: the spec's [binding check](../../design/security-and-operator.md#the-kernels-binding-check-kernelauthoritypy).

* **First:** list every human entry point in the built kernel (codegraph callers of `Authority.check` and of `Safety._authorized`), so none is missed; the list is recorded in the step.
* **Builds:**
  * `Authenticated.request` and `via`;
  * `authority.bind` with `SEC-R07`, `-R09`, `-R19`, `-R20`;
  * `OPERATOR_REQUEST` in each entry point's decision and its fold into `operator_request` (migration T-67, numbered next free when built), with `SEC-R04` and `-R08`;
  * bounded `OPERATOR_REQUEST_REFUSED`;
  * request validity in `recheck`, with `DISPATCH_REFUSED`;
  * `BUILTIN["kernel:safety"]` with `kill_engage` for the kill-input check only, accepted by `Safety._authorized` (`kernel/safety.py:209-220`) for that case;
  * `bootstrap.py` composes step 1's authorization in place of the disarmed table, keeping the simulation's injected test principals.
* **Tests:** `tests/unit/test_authority_grants.py` (T-07) extended with PRF-SEC-03. CP-SEC1 and F-SEC12 run by killing a real process in `tests/recovery/test_crash_boundaries.py`. Every existing test that calls a human entry point gets a bound request from a fixture.
* **Done when:** PRF-SEC-03 passes; PRF-SES-01, PRF-SES-02 and every SLICE-04…07 test still pass; no side file is written anywhere.

## Step 3 — secrets (outline)

Deepened after step 2 is built. Authority: the spec's [Secrets](../../design/security-and-operator.md#secrets-settingssecretspy).

* **Builds:**
  * `settings/secrets.py`;
  * the live refusal of `env` for broker credentials;
  * `CREDENTIAL_BOUND` once per credential per epoch by `kernel:recovery`;
  * `scrub` on every evidence record, log line and error the kernel adapter writes (a contribution to the execution-domain spec's adapter);
  * secret references in `config/live.example.yaml` (names only, no value).
* **Tests:** `tests/unit/test_secret_references.py` (tree delta **T-61**). A labelled synthetic secret value, echoed back by a fake broker response and error, and a byte scan of the ledger, evidence store, logs and a backup set for it. The secret guards (`gitleaks`, the hygiene test) stay on.
* **Done when:** PRF-SEC-04 passes; no test or document holds a real secret.

## Step 4 — kill inputs (outline)

Deepened after step 3 is built. Authority: the spec's [Kill inputs](../../design/security-and-operator.md#kill-inputs). Cross-platform: plain file and setting reads, no socket.

* **Builds:**
  * the input check in the kernel (a contribution to `kernel/safety.py` and `kernel/coordinator.py`), run before every claim, on each wake and before `OPERATING`;
  * `SEC-R16`;
  * the legacy keys and alias, and the live refusal of an empty path;
  * `at kill-switch on|off|status` in `interfaces/cli.py`. `on` writes the file with legacy's content, then asks the operator process to record `kill_engage`, reporting if it cannot. `off` asks `DISENGAGE`, removes the file, then requests `kill_release`.

  Until step 6 builds the operator process, the CLI's kernel half reports "not reachable" and the file half works alone.
* **Tests:** `tests/integration/test_kill_inputs.py` (tree delta **T-68**) on a composed simulation with a temporary file: CUJ-SEC-6, F-SEC8, F-SEC11 and every row of PRF-SEC-12.
* **Done when:** PRF-SEC-12 passes on Windows and Linux.

## Step 5 — the kernel's local channel (outline)

Deepened after step 4 is built. Authority: the spec's [kernel channel](../../design/security-and-operator.md#the-kernels-local-channel-adaptersunix_channelpy).

* **Builds:** `adapters/unix_channel.py`, server and client, with:
  * socket and directory checks;
  * `SO_PEERCRED`, the unit's main pid and own uid, and process identity;
  * the exact contract version and release digest;
  * the epoch on every reply.
* **Tests:** `tests/integration/test_unix_channel.py` (tree delta **T-62**), Linux only, run where the slice header says.
* **Done when:** PRF-SEC-05 passes in a Linux run.

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
