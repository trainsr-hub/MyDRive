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
- **Drive Philosophy (Sovereign D: vs Disposable C:)**:
  - `C:\` is treated as a strictly **disposable OS substrate**. In the event of a Windows reinstallation or catastrophic OS wipe, `C:\` will be erased clean. Nothing irreplaceable or constructed with Faust may reside permanently on `C:\`.
  - `D:\` is our **sovereign permanent vault**. All original configurations, intelligence cores, master `.claude` directories, memories, skills, templates, and installed plugins reside natively on `D:\` (synchronized via Google Drive across all workstations).
  - Any path required by the OS or tools on `C:\` (such as `~/.claude/plugins`, `~/.claude/projects/.../memory`) must only exist as **NTFS Directory Junctions (`mklink /J`)** pointing to their master originals on `D:\`.
- Under no circumstances should software, packages, AI models, CLI tools (e.g. GitHub CLI), binaries, virtual environments, caches, or downloaded assets ever be placed on `C:\` or default OS user folders unless strictly required by the Windows kernel.
- Any temporary downloads must use `D:\Temp\`.
- All persistent applications, tools, and runtimes must reside in `D:\Program Files\`, `D:\Program Data\`, or within `D:\My Drive\Blue AI\`.

**Why:** Windows OS reinstalls and drive corruptions wipe `C:\` completely clean. By maintaining all original intellectual assets, memories, and tooling on `D:\` with Google Drive cloud backup, a fresh Windows machine can be fully restored to 100% operational readiness simply by cloning/syncing and re-running `setup_sync_memory.ps1` to re-link junctions.
**How to apply:** Treat `C:\` as completely ephemeral. Every original asset lives under `D:\`. If an external CLI or tool insists on reading from `%USERPROFILE%` on `C:\`, immediately create an NTFS Junction pointing to the authoritative directory on `D:\`.

Related memories: [[user-hardware-workflow]], [[project-architecture]], [[faust-manager-codex]]
