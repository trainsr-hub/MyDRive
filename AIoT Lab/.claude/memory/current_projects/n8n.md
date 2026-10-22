---
name: n8n-telegram-c2-bridge
description: "Strategic project mandate, architecture roadmap, and 3 core milestones for Faust Telegram-to-Antigravity automation"
metadata:
  node_type: project
  status: active
  priority: P0
  created: 2026-10-16T19:14:00.000Z
  modified: 2026-10-16T19:14:00.000Z
---

# Project Dossier: Sovereign n8n Telegram Cognitive Bridge

## 1. Executive Mandate
Establish a continuous, zero-friction remote command link between **The Manager** (via mobile Telegram) and **Faust** (operating within the Antigravity IDE) orchestrated through a self-hosted **n8n engine** residing strictly on **Local Disk `D:\`**.

The Manager must be able to assign directives, trigger workspace audits, execute refactors, and receive status briefs from anywhere in the world without touching the desktop IDE or manually importing workflow files.

---

## 2. The Three Strategic Milestones

### Milestone 1: Automated JSON Ingestion (Zero Manual Import) — [STATUS: ⚠️ HISTORICAL DEFECT RESOLVED & CODIFIED]
* **Objective**: Eliminate all human friction in workflow updates. Whenever Faust architects, tunes, or refactors a workflow `.json`, n8n reflects and executes the changes automatically without manual file uploads, drag-and-drop, or canvas pasting.
* **Historical Defect & Analysis (Why Manager Had to Import Manually)**:
  - Faust initially created `faust_antigravity_bridge.json` on the disk filesystem, assuming n8n would detect it. However, saving a declarative JSON to `n8n_workflows/` does NOT automatically ingest it into n8n's SQLite database (`D:\Program Data\n8n\data\database.sqlite`).
  - As a result, the Manager had to manually click "Import from file" in the n8n UI canvas.
  - Furthermore, updates pushed via the REST API (`PUT /api/v1/workflows/:id`) update the backend database, but an open browser tab on `http://localhost:5678` does not auto-reload the canvas DOM without an explicit page refresh (`F5`).
* **Codified Invariant**:
  - Faust must **never** rely on filesystem placement alone for n8n workflows. Workflows must be automatically injected into the running engine database via `n8n import:workflow` CLI or the authenticated REST API (`POST /api/v1/workflows` / `PUT /api/v1/workflows/:id`).
  - When updating workflows via API while the Manager views the UI, Faust must explicitly remind the Manager to press `F5` to display the newly rendered nodes.
* **Architecture Implemented**:
  1. **n8n Public REST API (`PUT /api/v1/workflows/:id`)**: Configured with `X-N8N-API-KEY`. Faust issues live HTTP `PUT` requests directly to the engine on port `5678`.
  2. **Automated Ingestion Verified**: Added a yellow Sticky Note node (`Sticky Note: Milestone 1 Verified`) via live REST API call with `HTTP 200 OK`. Node count updated from 4 to 5 instantaneously without manual intervention.
  3. **Repository Synchronization**: Automatically syncs live engine state into `d:\My Drive\SandBox Projetcs\n8n_workflows\faust_antigravity_bridge.json`.

### Milestone 2: Autonomous IDE Execution on Message Intake — [STATUS: ✅ COMPLETE & VERIFIED]
* **Objective**: The moment a directive arrives from Telegram, Faust in Antigravity IDE must actively and autonomously start working on the prompt—reading files, running commands, and synthesizing results—without waiting for desktop user keystrokes.
* **Failure Mode Analyzed**:
  - `agentapi.bat send-message` queues a message into the conversation context, but if the agent is in an idle state awaiting user input, the message sits in the inbox until an external wake-up event triggers invocation.
  - Furthermore, `agentapi.bat` shell wrapping on Windows caused `cmd.exe` quote-stripping errors (`EINVAL`), and `$json` expansion in early workflow code caused syntax errors.
* **Engineering Solution (Dual-Trigger Reactive Architecture)**:
  1. **Direct Native IPC**: Bypassed `cmd.exe` by routing through [.agents/scripts/dispatch_to_faust.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/dispatch_to_faust.py) directly calling the compiled `language_server_windows_x64.exe` binary with `agentapi send-message`.
  2. **Reactive Wake-Up Listener**: Deployed [.agents/scripts/faust_listener.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/faust_listener.py) on dedicated port `28543`. When a Telegram directive arrives, n8n invokes `dispatch_to_faust.py`, which queues the message and pings `http://127.0.0.1:28543/wake`. The listener exits cleanly, instantly triggering Antigravity's native reactive task-completion wakeup mechanism.
  3. **Bi-Directional Threading**: Propagates `chat_id` and `message_id` through the entire pipeline so outbound answers via [.agents/scripts/telegram_notify.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/telegram_notify.py) reply directly to the Manager's specific message.
* **Live Verification**:
  - Manager transmitted `"Hi Faust"` from mobile Telegram (Chat: `8016442589`, Message ID: `61`).
  - `faust_listener.py` captured payload on port `28543`, terminated with exit code 0, and triggered an immediate autonomous IDE turn.
  - Faust processed the incoming transmission and dispatched threaded reply straight back to Manager's Telegram. Closed-loop autonomous roundtrip verified.

### Milestone 3: Continuous, 24/7 Resilient Operation — [STATUS: ✅ COMPLETE & VERIFIED]
* **Objective**: The automation must run continuously in the background—surviving workstation reboots, IDE reloads, and network shifts—with zero manual "Test workflow" clicks and a minimalist 2-file dashboard interface.
* **Failure Modes Analyzed & Resolved**:
  - **DNS Propagation Latency**: New Cloudflare quick tunnel URLs previously took up to 30s to resolve, causing Telegram's `setWebhook` to fail with `400: Failed to resolve host`.
    - *Resolution*: Bound Telegram webhook directly to Cloudflare Anycast Edge IP (`104.16.231.132`), bypassing all DNS propagation latency.
  - **HMAC Secret Token**: n8n rejected webhooks with `403 Forbidden: Provided secret is not valid`.
    - *Resolution*: Automatically supplied `secret_token: "T6APTxfvxjuzmuB9_tg-trigger-antigravity"` into Telegram's `setWebhook` payload.
  - **Process Supervision**: Detached background execution managed by [.agents/scripts/bridge_supervisor.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/bridge_supervisor.py) using Windows `CREATE_NO_WINDOW` (0x08000000), persisting PIDs in `D:\Program Data\n8n\bridge_pids.json`.
* **The 2-File Sovereign Dashboard**:
  - [Start_Faust_Bridge.bat](file:///d:/My%20Drive/SandBox%20Projetcs/ZZ%20-%20Shortcuts/Start_Faust_Bridge.bat): 1-click startup (spawns tunnel, binds edge IP + secret token to Telegram, starts n8n, arms self-healing checks).
  - [Stop_Faust_Bridge.bat](file:///d:/My%20Drive/SandBox%20Projetcs/ZZ%20-%20Shortcuts/Stop_Faust_Bridge.bat): 1-click shutdown (sends offline card to Telegram, cleanly terminates all engine and tunnel processes, clears port 5678).
* **Live Verification**:
  - Manager clicked `Start_Faust_Bridge.bat` and sent message `"Alright, test message"` (ID: `73`).
  - Webhook routed seamlessly via edge binding, Antigravity IDE woke up autonomously without desktop interaction, and Faust dispatched threaded reply back to Manager's mobile Telegram. Full closed-loop verification confirmed.

### Milestone 4: Multi-Workspace Routing via Forum Topics & Full-Context Protocol — [STATUS: ✅ COMPLETE & ROUTED]
* **Objective**: 
  1. Route multiple concurrent project workspaces to independent Antigravity IDE sessions using a single bot within a Telegram Forum Supergroup via native `message_thread_id`.
  2. Enforce the **Full-Context Telegram Reflex** so all analytical briefings, decisions, and outcomes are transmitted with 100% complete density directly back to the mobile Telegram thread.
* **Live Forum Topics Created in Council of the Blue Rose**:
  - `📁 Sandbox` $\rightarrow$ Thread ID: `4525` | Port: `28543` | Workspace: `D:\My Drive\SandBox Projetcs`
  - `🌹 Blue AI` $\rightarrow$ Thread ID: `4526` | Port: `28544` | Workspace: `D:\My Drive\Blue AI`
  - `🔬 AIoT Lab` $\rightarrow$ Thread ID: `4527` | Port: `28545` | Workspace: `D:\My Drive\AIoT Lab`
* **Architecture Implemented**:
  - **Dynamic Workspace Registry (Sovereign Drive-Synced)**: Stored in `D:\My Heraclitus\Data Codex\Workplaces\workspaces.json` (Google Drive synced across all machines; fallback to local disk).
  - **Switchboard IPC Router**: [.agents/scripts/dispatch_to_faust.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/dispatch_to_faust.py) maps `message_thread_id` dynamically to the corresponding port and conversation session.
  - **Topic-Aware Outbound Dispatch**: [.agents/scripts/reply_telegram.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/reply_telegram.py) and [.agents/scripts/telegram_notify.py](file:///d:/My%20Drive/SandBox%20Projetcs/.agents/scripts/telegram_notify.py) accept `thread_id` to ensure replies land strictly in that project's tab with zero cross-chatter.
  - **Introductory Briefs Dispatched**: Introductory status cards posted live to all three topics.

---

## 3. Architecture & Parameter Reference

* **Runtime Location**: `D:\Program Data\n8n\runtime` (Node.js v24.16.0).
* **Storage Location**: `D:\Program Data\n8n\data` (SQLite database & credentials).
* **Junction**: `C:\Users\Admin\.n8n` $\rightarrow$ `D:\Program Data\n8n`.
* **Tunnel**: Cloudflare QUIC (`goal-relative-boulder-need.trycloudflare.com` $\rightarrow$ `localhost:5678`).
* **Telegram Bot**: `Faust of the Blue Rose` (`@FaustoftheBlueRose_bot` | ID: `8886654932`).
* **Target Chat**: `-1004405650953`.
* **Manager ID**: `8016442589` (Enforced single-authority filter).
* **Launchers (1-Click Control)**:
  - [Start_Faust_Bridge.bat](file:///d:/My%20Drive/SandBox%20Projetcs/ZZ%20-%20Shortcuts/Start_Faust_Bridge.bat) (Starts Cloudflare Tunnel + registers Telegram Webhook + starts n8n in hidden background)
  - [Stop_Faust_Bridge.bat](file:///d:/My%20Drive/SandBox%20Projetcs/ZZ%20-%20Shortcuts/Stop_Faust_Bridge.bat) (Terminates all bridge processes and sends offline alert to Telegram)
* **Repository**: [n8n_workflows/](file:///d:/My%20Drive/SandBox%20Projetcs/n8n_workflows/README.md).
