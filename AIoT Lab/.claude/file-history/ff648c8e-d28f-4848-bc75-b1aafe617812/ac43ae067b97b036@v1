---
name: d-drive-storage-invariant
description: Non-negotiable hardware rule — all software, packages, models, CLI tools, and downloads must strictly reside on Local Disk D:
metadata:
  node_type: memory
  key: rule:d_drive_storage_invariant
  keys:
    - rule:d_drive_storage_invariant
    - core:hardware_workflow
    - core:rom_config_compliance
  type: feedback
---

# Strict Local Disk D: Installation & Download Invariant

### Non-Negotiable Rule
- **Target Drive**: **`D:\` (Local Disk D:) ALWAYS**.
- Under no circumstances should software, packages, AI models, CLI tools (e.g. GitHub CLI), binaries, virtual environments, caches, or downloaded assets ever be placed on `C:\` or default OS user folders unless strictly required by the Windows kernel.
- Any temporary downloads must use `D:\Temp\`.
- All persistent applications, tools, and runtimes must reside in `D:\Program Files\`, `D:\Program Data\`, or within `D:\My Drive\Blue AI\`.

**Why:** The Manager enforces strict drive partitioning to preserve OS drive integrity and ensure all operational data, AI weights, and developer tools reside on the high-capacity D: drive synchronized across workstations.
**How to apply:** Every install script, PowerShell command, pip target, or download command must explicitly specify paths rooted in `D:\` (e.g. `D:\Program Files\...`, `D:\Temp\...`).

Related memories: [[user-hardware-workflow]], [[project-architecture]], [[faust-manager-codex]]
