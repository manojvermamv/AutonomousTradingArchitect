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
