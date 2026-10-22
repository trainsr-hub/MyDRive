---
name: safe-ntfs-junction-doctrine
description: "Safe NTFS Junction Golden Standard (Junction_Rule.md) enforcing pre-flight guards, robocopy /XJ /COPY:DAT /DCOPY:DAT, rename to backup, and atomic rollback on mklink failure."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 41252335-1a10-4e64-b666-b430687ca0d9
  modified: 2026-10-22T06:32:55.191Z
---

All directory migrations and NTFS junction creations must strictly adhere to the 5 pillars established in `Junction_Rule.md`. Never run `rmdir /s /q` on source directories during migration.

**Why:** Deleting source data before a junction succeeds risks irreversible data loss. Renaming to `_backup` and providing automatic rollback ensures absolute safety, zero data loss, and seamless recovery if processes have locked handles.

**How to apply:**
1. Pre-flight checks: Verify source exists, halt if destination or `_backup` exists.
2. Robocopy using exact flags: `/E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XJ`. Check `errorlevel 8`.
3. Atomic rename source to `_backup` (halts safely if files in use).
4. Create junction via `mklink /J`. If link fails, immediately rollback rename (`ren <_backup> <source>`).
5. Empirically verify with `dir /AL` and `fsutil reparsepoint query`.

Related: [[rules-stored-in-claude-folder]]
