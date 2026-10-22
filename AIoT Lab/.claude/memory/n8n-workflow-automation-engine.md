---
name: n8n-workflow-automation-engine
description: "Architecture, environment configuration, credentials, and operation of the sovereign n8n workflow engine on Local Disk D"
metadata:
  node_type: memory
  type: ops
  component_key: "ops:n8n_automation_engine"
  modified: 2026-10-16T18:36:00.000Z
---

# Sovereign n8n Automation Engine Architecture

Faust and the Manager maintain an autonomous, self-hosted n8n workflow orchestration engine running strictly under the **Local Disk D: Storage Invariant**.

### 1. Storage & Runtime Locations
- **Engine Runtime**: `D:\Program Data\n8n\runtime` (Node v24.16.0, isolated npm modules).
- **Persistent Data**: `D:\Program Data\n8n\data` (Database SQLite, execution logs, encryption keys).
- **Directory Junction**: `C:\Users\Admin\.n8n` -> `D:\Program Data\n8n` (ensures zero permanent footprint on disposable C:).
- **Download/Build Cache**: `D:\Temp\npm-cache`.
- **Workflow Version Control**: `d:\My Drive\SandBox Projetcs\n8n_workflows\` (declarative JSON schemas).
- **Desktop / Workspace Shortcut**: `d:\My Drive\SandBox Projetcs\ZZ - Shortcuts\Start_n8n.bat`.

### 2. Environment Variables & Launcher Spec
```bat
set "N8N_USER_FOLDER=D:\Program Data\n8n\data"
set "N8N_PORT=5678"
set "N8N_PROTOCOL=http"
set "N8N_HOST=localhost"
set "WEBHOOK_URL=https://<tunnel>.trycloudflare.com/"
set "N8N_DIAGNOSTICS_ENABLED=false"
set "N8N_VERSION_NOTIFICATIONS_ENABLED=false"
set "N8N_SECURE_COOKIE=false"
```

### 3. Telegram Remote Commander Link
- **Bot Name**: Faust of the Blue Rose (`@FaustoftheBlueRose_bot`)
- **Bot Token**: `8886654932:AAFq6vaPlJig3oekr8BEW2PuRvMejIUB7VU`
- **Command Group Chat ID**: `-1004405650953`
- **Manager User ID**: `8016442589` (strict security filter on incoming triggers)
- **Tunneling**: Cloudflare QUIC Tunnel via `cloudflared tunnel --url http://localhost:5678`
- **Doctrine Compliance**: 4-tier functional emoji (`⚡`, `🔄`, `✅`, `❌`) with direct thread replies via `replyToMessageId`.
- **Active Workflow ID**: `T6APTxfvxjuzmuB9`

### 4. Zero-Manual-Import Invariant & CLI/REST Ingestion Rule
- **Core Invariant**: Faust must **never** ask or expect the Manager to manually click "Import from file" in the n8n canvas.
- **Workflow Registration Rules**:
  1. **New Workflow**: Use `n8n import:workflow --input=<path_to_json>` or `POST /api/v1/workflows` via authenticated REST API.
  2. **Workflow Modification**: Use `PUT /api/v1/workflows/:id` with `X-N8N-API-KEY: n8n_api_faust_master_sovereign_key_2026`.
  3. **Canvas Live-Refresh Rule**: Because n8n web client does not auto-refresh active tabs on backend REST updates, Faust must explicitly notify the Manager to press `F5` to see the updated visual layout.

