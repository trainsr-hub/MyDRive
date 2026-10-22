# Omniroute Sync Reorganization Plan

## Context & The Problem
Currently, `D:\My Drive\Sync\omniroute` and `D:\My Drive\Sync\Config\omniroute` are the original master folders with junctions pointing to them from C: drive.

**The Core Problem:** Google Drive **cannot sync junctions**. It treats them as broken links or ignores them entirely. This means our "Master-Slave" architecture where Drive syncs a folder that contains junctions won't work — the junctions themselves won't propagate to other machines.

**The Goal:** We need to keep `D:\My Drive\Sync\omniroute` and `D:\My Drive\Sync\Config\omniroute` as **real folders with real content** that Google Drive can sync, while still keeping large cache/log folders out of sync.

---

## Phase 0: Discovery (REQUIRED FIRST STEP)
**Identify all existing C: drive junctions pointing to the Sync folders:**

```powershell
# Check what junctions exist on C: pointing to OmniRoute
Get-ChildItem -Path "C:\" -Force -Directory -ErrorAction SilentlyContinue | 
  Where-Object { $_.Attributes -match "ReparsePoint" } | 
  ForEach-Object { 
    Write-Host $_.Name
    fsutil reparsepoint query $_.FullName 
  }
```

**Expected junctions to find and document:**
- `C:\Users\[User]\AppData\...` paths pointing to `D:\My Drive\Sync\omniroute`
- `C:\Users\[User]\AppData\...` paths pointing to `D:\My Drive\Sync\Config\omniroute`
- Any other C: drive junctions related to OmniRoute

**Record exactly where each junction points** before proceeding.

---

## Phase 1: Reorganize `D:\My Drive\Sync\omniroute` (App Code)

**Goal:** Move entire app code to local storage; **no junction needed back** (unlike Config).

### Step 1.1: Prepare
- Create directory: `D:\My System\Local App Junction\OmniRoute\`
- Stop all OmniRoute processes (Node servers, supervisors, all instances)
- Verify all database locks are released

### Step 1.2: Copy
```batch
robocopy "D:\My Drive\Sync\omniroute" "D:\My System\Local App Junction\OmniRoute" /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XJ
```

### Step 1.3: Verify Copy
- Check file counts match
- Spot-check key files exist (package.json, src/, bin/, dist/)
- Start OmniRoute from new location and verify it runs

### Step 1.4: Rename Original (Safe Breakpoint)
```batch
ren "D:\My Drive\Sync\omniroute" "D:\My Drive\Sync\omniroute_backup"
```

### Step 1.5: Update C: Drive Junctions
For each C: drive junction currently pointing to `D:\My Drive\Sync\omniroute`:

```batch
# Remove old junction
rmdir /S /Q "C:\Users\[User]\...\omniroute"

# Create new junction to local master
mklink /J "C:\Users\[User]\...\omniroute" "D:\My System\Local App Junction\OmniRoute"
```

### Step 1.6: Verify
- Test application launch from C: junction path
- Verify file access works through junction
- Check `fsutil reparsepoint query` shows correct target

### Step 1.7: Cleanup
Once verified working for 24-48 hours:
```batch
rmdir /S /Q "D:\My Drive\Sync\omniroute_backup"
```

---

## Phase 2: Reorganize `D:\My Drive\Sync\Config\omniroute` (Mixed Data)

**Goal:** Keep essential data in Drive sync (real files). Move caches/logs to local with NO junctions in Drive folder. Configure application to use local paths directly.

### Step 2.1: Identify Current C: Drive Junctions
Document which C: paths point to `D:\My Drive\Sync\Config\omniroute`.

### Step 2.2: Prepare Local Structure
```
D:\My System\Local App Junction\OmniRoute\Config\
├── call_logs\           (2.9GB - runtime, non-essential)
├── logs\                (101MB - runtime, non-essential)
├── qoder-cli\           (2.2GB - cache, non-essential)
├── server\              (15B - PID file, non-essential)
└── supervisor\          (10B - PID file, non-essential)
```

### Step 2.3: Move Non-Essential Items (NO JUNCTIONS IN DRIVE FOLDER)
1. Copy non-essential folders to `D:\My System\Local App Junction\OmniRoute\Config\`
2. Delete originals from `D:\My Drive\Sync\Config\omniroute\`
3. **Do NOT create junctions in the Drive-synced folder** — Google Drive won't sync them

### Step 2.4: Update Application Configuration
Modify OmniRoute config (or environment) to point non-essential paths to local storage:
- `call_logs` → `D:\My System\Local App Junction\OmniRoute\Config\call_logs`
- `logs` → `D:\My System\Local App Junction\OmniRoute\Config\logs`
- `qoder-cli` → `D:\My System\Local App Junction\OmniRoute\Config\qoder-cli`
- `server` (PID) → `D:\My System\Local App Junction\OmniRoute\Config\server`
- `supervisor` (PID) → `D:\My System\Local App Junction\OmniRoute\Config\supervisor`

**Implementation options:**
- Update config files (`.env`, config scripts, startup scripts)
- Or create C: drive junctions at application's expected paths pointing to local folders

### Step 2.5: Essential Items Remain (Real Files in Drive Sync)
These stay directly in Drive-synced folder as real files:
- `storage.sqlite` (757MB - user data)
- `oauth/` (36B - credentials)
- `.env` (140B - user config)
- `db_backups/` (299KB - backups)
- `omniroute_config_*.py` (14KB - config tools)

### Step 2.6: Update C: Drive Junctions (if any point to subfolders)
If any C: junction pointed directly to a subfolder (e.g., `D:\My Drive\Sync\Config\omniroute\logs`):
- Update it to point to the new local path
- Otherwise, if it points to the parent folder, no change needed

### Step 2.7: Verify
- Application writes to local paths correctly
- storage.sqlite is directly editable in Drive-synced folder
- Google Drive syncs only the essential items (no junction errors)
- All C: drive paths work as expected

---

## Storage Architecture After Completion

```
DRIVE-SYNCED (Google Drive backup) — REAL FILES ONLY
D:\My Drive\Sync\omniroute_backup/        (to be deleted after Phase 1 verification)
D:\My Drive\Sync\Config\omniroute/
├── storage.sqlite                 (real file - synced)
├── oauth/                         (real folder - synced)
├── .env                           (real file - synced)
├── db_backups/                    (real folder - synced)
├── omniroute_config_*.py          (real files - synced)
└── [NO JUNCTIONS - Drive would break them]

LOCAL MASTER (D: drive - sovereign)
D:\My System\Local App Junction\OmniRoute/
├── [entire app code, node_modules, dist, src, etc.]
└── Config/
    ├── call_logs/          (2.9GB - local only)
    ├── logs/               (101MB - local only)
    ├── qoder-cli/          (2.2GB - local only)
    ├── server/             (PID file - local only)
    └── supervisor/         (PID file - local only)

C: DRIVE JUNCTIONS (user/developer access)
C:\Users\[User]\... → D:\My System\Local App Junction\OmniRoute
C:\Users\[User]\... → D:\My Drive\Sync\Config\omniroute  (if parent folder junction)
[Subfolder junctions updated to point directly to local paths]
```

**Key Change:** The Drive-synced folder contains ONLY real files/folders. All heavy runtime data lives locally with the application configured to write there directly.

---

## Critical Safeguards

1. **Before any operation**: Document current C: junctions with `fsutil reparsepoint query`
2. **Test every step**: Verify application works after each phase
3. **Safe breakpoints**: Create `_backup` folders before deleting originals
4. **Database safety**: Ensure `storage.sqlite` never locked during moves
5. **Rollback plan**: If issues arise, restore from `_backup` folders and undo junctions

---

## Verification Checklist

- [ ] Phase 0: All C: junctions documented
- [ ] Phase 1: App code copied to local, C: junctions updated, app launches
- [ ] Phase 1: Backup kept for 48 hours before deletion
- [ ] Phase 2: Non-essential folders moved to local (NO junctions in Drive folder)
- [ ] Phase 2: Application config updated to use local paths for caches/logs
- [ ] Phase 2: Essential items remain in Drive-synced folder as real files
- [ ] Phase 2: Application writes to local paths correctly
- [ ] Phase 2: Google Drive syncs only essential items (no junction errors)
- [ ] All C: drive junctions verify with `fsutil reparsepoint query`
