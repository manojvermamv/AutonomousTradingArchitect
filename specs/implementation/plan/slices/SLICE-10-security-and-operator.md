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

## Step 1 — requests, confirmations and principals (outline)

Deepened just before it is built. Authority: the spec's [Channels and principals](../../design/security-and-operator.md#channels-and-principals-interfacesauthorizationpy) and [Operator requests and confirmations](../../design/security-and-operator.md#operator-requests-and-confirmations-contractsidentitypy-interfacesauthorizationpy).

* **Builds:** in `contracts/identity.py`, `OperatorRequest`, `argument_digest` and a canonical-JSON function, with a test that it agrees byte for byte with `kernel/ledger/envelope.py`. In `interfaces/authorization.py`:
  * `authenticate(channel, evidence)` over the channel table and identity map, including `owner-api:local` and `owner-proxy:<fingerprint>`;
  * relay acceptance;
  * `Session`, bound to identity and kernel epoch, with lifetime and cap;
  * retry identity `sha256(principal, channel_identity, nonce)`;
  * `prepare`, and `execute`, which mints the request.
* **Tests:** `tests/unit/test_operator_authorization.py` (tree delta **T-60**), with synthetic identities and a recorded clock; every row of PRF-SEC-01 and PRF-SEC-02, written by hand from the spec.
* **Break checks to list at deepening:**
  * the digest omits one field;
  * the request is minted at `prepare`;
  * typed text is compared case-insensitively;
  * a session survives an epoch change;
  * the retry identity includes the session.
* **Done when:** both proofs pass twice with the whole suite; nothing outside `contracts/identity.py`, `interfaces/authorization.py` and the test file changes.

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
