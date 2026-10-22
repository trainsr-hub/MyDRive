# Safe NTFS Directory Junction Golden Standard

This document establishes the binding, permanent architectural golden standard for all directory migrations, cross-drive linkages, and NTFS junction operations across Faust systems, derived from `Junction_Rule.md`.

### Core Directive:
"Never delete original files during migration. Always enforce pre-flight safety checks, metadata-preserving robocopy, atomic rename to backup, safe junction creation with automatic rollback, and reparse point verification."

---

## The 5 Pillars of Safe Junctioning

### 1. Pre-Flight Existence & Collision Guards
Before executing any file transfer or directory manipulation:
- **Guard 1 (Source Existence)**: Verify the source directory actually exists. Fail loudly if missing.
- **Guard 2 (Stale Backup Guard)**: Check if a `_backup` directory already exists. If present, halt execution immediately to prevent accidental overwrites of previous backups.
- **Guard 3 (Destination Guard)**: Check if destination already exists to prevent accidental re-runs or data collisions.

### 2. High-Fidelity Robocopy with Loop Prevention
Always use robocopy with explicit attribute, timestamp, and loop safeguards:
```cmd
robocopy "<SOURCE>" "<DESTINATION>" /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XJ
```
- `/E`: Copy all subdirectories, including empty ones.
- `/COPY:DAT`: Preserve file Data, Attributes, and Timestamps.
- `/DCOPY:DAT`: Preserve directory Attributes and Timestamps.
- `/R:2 /W:2`: Limit retries to 2 attempts with a 2-second wait (avoids infinite hangs on locked files).
- `/XJ`: **eXclude Junction points** (mandatory invariant to prevent infinite recursive loop traversal).
- **Errorlevel Gate**: Check `if errorlevel 8` (robocopy exit code >= 8 represents fatal failure). Abort before touching the source.

### 3. Safe Two-Phase Commit (Atomic Rename over Deletion)
**Absolute Invariant**: Never run `rmdir /s /q` on source data during a junction migration.
- Once robocopy succeeds, atomically rename the source to `<FOLDER>_backup`:
  ```cmd
  ren "<SOURCE_PATH>" "<FOLDER_NAME>_backup"
  ```
- If rename fails (e.g., active process lock), the operation halts safely with zero data loss and the original source intact.

### 4. Atomic Junction Creation with Automatic Rollback
- Create the NTFS directory junction at the original path:
  ```cmd
  mklink /J "<SOURCE_PATH>" "<DESTINATION_PATH>"
  ```
- **Automatic Rollback Invariant**: If `mklink /J` fails:
  ```cmd
  ren "<FOLDER>_backup" "<FOLDER_NAME>"
  if errorlevel 1 echo CRITICAL: Manual recovery required.
  ```
  The original folder is restored immediately.

### 5. Reparse Point Verification Gate
Every junction operation must empirically verify the junction:
```cmd
dir /AL "<PARENT_PATH>\"
fsutil reparsepoint query "<SOURCE_PATH>"
```
Both the directory attributes (`<JUNCTION>`) and the target reparse point tag must be verified before declaring the operation complete.
