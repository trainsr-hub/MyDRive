# Implementation Plan: Option 4 Dual-Tier Sovereign Telegram Daemon (Plan v2)

## Context
The Manager wants to interact with Faust entirely via Telegram from mobile or desktop, with **no IDE open**. Faust must hold continuous multi-turn conversations, manage workspaces on Local Disk `D:\`, execute deterministic fast-path commands, build and run local development applications, and report execution telemetry directly into Telegram threads.

Following an empirical evaluation of four architectural options and community field reports (from `chenhg5/cc-connect`, `op7418/Claude-to-IM-skill`, and `coleam00/remote-agentic-coding-system`), **Option 4: Dual-Tier Sovereign Daemon** was chosen. It delivers sub-second response times, requires zero open firewall ports, preserves 100% Disk `D:\` storage sovereignty, and guarantees crash-proof session state via ACID SQLite persistence.

---

## Architecture & Structural Boundaries

```
[ Telegram Mobile / Desktop Client ]
                 │
                 │ HTTPS Long-Polling (getUpdates, timeout=30s)
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FAUST SOVEREIGN DAEMON (Local Disk D:)               │
│                                                                        │
│  [ Tier 4: Transport & Lifecycle ]                                     │
│    • Ingress Poller: poller.py (getUpdates, drop webhook, backoff)     │
│    • Daemon Controller: faust_remote.py (PID lock, signals, CLI)       │
│    • Egress Client: telegram_egress.py (HTML fallback, 3900 chunking)  │
│                                                                        │
│  [ Tier 3: Service, Agent Loop & Tool Engine ]                         │
│    • Service Orchestrator: agent_service.py (Fast-path router)         │
│    • Autonomous Agent Loop: agent_loop.py (Multi-step tool calling)    │
│    • Sovereign Tools: tools.py (PowerShell, file read/write/edit, git) │
│    • Job Supervisor: jobs.py (Detached dev servers, log tailing, kill) │
│                                                                        │
│  [ Tier 2: Repository & Persistence ]                                  │
│    • Session DB: repository.py (SQLite thread-isolated history)        │
│    • Workspace Registry: repository.py (workspaces.json topic routing) │
│    • Secrets: repository.py (telegram_config.json & secrets.env)       │
│                                                                        │
│  [ Tier 1: Domain Schemas ]                                            │
│    • Pure Typed Contracts: domain.py (Directives, Results, Jobs, Tools)│
└────────────────────────────────────────────────────────────────────────┘
                 │
                 ▼
[ Sovereign Workspaces on Local Disk D: ]
  • Topic #4526 (Blue AI)   -> D:\My Drive\Blue AI
  • Topic #4525 (Sandbox)   -> D:\My Drive\SandBox Projetcs
  • Topic #4527 (AIoT Lab)  -> D:\My Drive\AIoT Lab
  • Topic #4553 (App Lab)   -> D:\My Drive\App Lab
```

---

## Critical Files to Create / Modify

All modules strictly adhere to the Anti-Spaghetti Architecture: under 300 lines per file, under 40 lines per function, and maximum 3 levels of indentation.

1. **`D:\My Drive\Blue AI\.agents\scripts\daemon\domain.py`**
   - Add typed contracts: `ToolCall`, `ToolResult`, `JobInfo`.
2. **`D:\My Drive\Blue AI\.agents\scripts\daemon\repository.py`**
   - Add `clear_thread(thread_id)` to atomically reset conversational memory for `/clear` or `/new`.
   - Add job state persistence for tracking detached dev server PIDs.
3. **`D:\My Drive\Blue AI\.agents\scripts\daemon\tools.py`**
   - Implement `write_file`, `edit_file`, `list_dir`, and path containment validation ensuring all operations stay within registered workspace roots.
4. **`D:\My Drive\Blue AI\.agents\scripts\daemon\jobs.py`** (New Module)
   - Background job supervisor: `start_background`, `stop_background`, `list_background`, `tail_log`. Runs dev servers windowless (`CREATE_NO_WINDOW`) and captures logs to `D:\Program Data\faust_daemon\jobs\`.
5. **`D:\My Drive\Blue AI\.agents\scripts\daemon\agent_loop.py`** (New Module)
   - Multi-turn cognitive execution loop: retrieves SQLite history, formats system prompt with active workspace path, executes tool calling cycle (max 10 steps), and streams progress telemetry.
6. **`D:\My Drive\Blue AI\.agents\scripts\daemon\agent_service.py`**
   - Integrate fast-path handlers (`/status`, `/git`, `/diff`, `/clear`, `/new`, `/workspaces`, `/ps`, `/kill`, `/run`) with the new `agent_loop`.
7. **`D:\My Drive\Blue AI\.agents\scripts\daemon\poller.py`** (New Module)
   - Long-polling worker using standard library `urllib.request`. Issues `deleteWebhook` on startup, executes `getUpdates(offset, timeout=30)`, filters for Manager ID `8016442589`, and dispatches to service.
8. **`D:\My Drive\Blue AI\.agents\scripts\daemon\faust_remote.py`** (New Module)
   - Main daemon supervisor entrypoint. Manages single-instance PID file `D:\Program Data\faust_daemon\faust_remote.pid`, handles clean shutdown (`SIGINT`/`SIGTERM`), and posts `✅ Faust Remote Sovereign Daemon: ONLINE` to Topic `#4526`.
9. **`D:\Start_Faust_Remote.bat` & `D:\Stop_Faust_Remote.bat`**
   - 1-click batch scripts on Local Disk `D:\` for starting and stopping the daemon without opening any IDE.

---

## Detailed Step-by-Step Implementation Roadmap

### Phase 1: Core Domain & Tool Engine Expansion
- Update `domain.py` with `ToolCall`, `ToolResult`, and `JobInfo` dataclasses.
- Update `repository.py` with `clear_thread(thread_id)` method.
- Update `tools.py` with `write_file`, `edit_file`, and path containment guards.
- Implement `jobs.py` for detached dev server execution and process tracking.

### Phase 2: Autonomous Agent Execution Loop
- Implement `agent_loop.py`:
  - Context assembly: loads last 10 messages from SQLite for active `thread_id`.
  - Tool execution dispatcher: routes tool calls to `SovereignTools` and `JobManager`.
  - Progress updates: sends `[PROGRESS] Executing tool...` to Telegram during multi-step runs.
- Update `agent_service.py` to route free-form text directives into `agent_loop.py`, while intercepting `/clear`, `/new`, `/ps`, and `/kill`.

### Phase 3: Ingress Transport & Lifecycle Controller
- Implement `poller.py`:
  - Automatic `deleteWebhook` check on startup.
  - Resilient `getUpdates` loop with exponential backoff on HTTP 429/5xx.
  - Strict security gate: drops all non-Manager sender IDs silently.
- Implement `faust_remote.py`:
  - Double-launch protection via `faust_remote.pid`.
  - Graceful termination: stops polling, terminates active child jobs, posts offline notice.
- Author `D:\Start_Faust_Remote.bat` and `D:\Stop_Faust_Remote.bat`.

---

## End-to-End Verification Strategy (The 6 Empirical Gates)

1. **Gate 1: Storage Invariant & Directory Integrity**
   - Verify `D:\Program Data\faust_daemon\` contains SQLite database, logs, and PID lock.
   - Audit `C:\` to confirm zero temporary files or databases are created on the disposable OS drive.
2. **Gate 2: Deterministic Fast-Path Smoke Test (CLI)**
   - Execute `agent_service.py` directly from PowerShell:
     - Test `/status` -> returns system health, active git branch, topic mapping.
     - Test `/git` and `/diff` -> returns clean git status without LLM invocation (<200ms).
     - Test `/clear` -> verifies SQLite table `messages` is cleared for that topic while workspace files remain untouched.
3. **Gate 3: Tool Engine Execution Test**
   - Test `SovereignTools.write_file` and `read_file` within `D:\My Drive\SandBox Projetcs`.
   - Test path containment: verify that attempting to write outside registered workspaces (e.g., `C:\Windows`) is blocked.
4. **Gate 4: Long-Polling Ingress & Security Gate Test**
   - Start daemon in foreground: `python faust_remote.py run-foreground`.
   - Send `/status` from mobile Telegram in Topic `#4526`. Confirm threaded response received in <1.5s.
   - Verify non-whitelisted senders are dropped and logged.
5. **Gate 5: Background Job Lifecycle Test**
   - Dispatch command via Telegram: "Create a simple test server and run it in background".
   - Send `/ps` to list running job PIDs and verify port.
   - Send `/kill <id>` and verify process tree terminates cleanly.
6. **Gate 6: 1-Click Desktop Batch Script Lifecycle Test**
   - Double-click `D:\Start_Faust_Remote.bat` with IDE completely closed.
   - Verify `✅ Faust Remote Sovereign Daemon: ONLINE` appears in Telegram Topic `#4526`.
   - Double-click `D:\Stop_Faust_Remote.bat`.
   - Verify `🛑 Faust Remote Sovereign Daemon: OFFLINE` appears in Telegram, PID file is deleted, and no orphaned Python processes remain.
