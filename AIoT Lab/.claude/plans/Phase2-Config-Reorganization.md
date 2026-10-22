# OmniRoute Phase 2: Config Folder Reorganization Plan

**Status:** IN PROGRESS  
**Last Updated:** 2026-10-21 22:58 UTC  
**Current Location:** Step 1 (Manual execution starting)

---

## Overview

**Goal:** Reorganize `D:\My Drive\Sync\Config\omniroute` to keep only essential user data in Drive sync, move runtime/cache to local storage on D:.

**Why:** Google Drive cannot sync junctions. We must keep the Drive folder containing only real files (no junctions), while maintaining the C: junction pointing to a local Config root that orchestrates access to both local and Drive folders.

---

## Current State (Pre-Phase 2)

✅ **Phase 1 Complete:**
- App code moved to: `D:\My System\Local App Junction\OmniRoute\`
- C: app junction: `C:\Users\Admin\AppData\Roaming\npm\node_modules\omniroute` → Local master
- OmniRoute running: ✅ Port 20128 LISTENING

❌ **Phase 2 Status:**
- C: config junction still points to: `D:\My Drive\Sync\Config\omniroute` (NEEDS UPDATE)
- Non-essential folders still in Drive sync: `call_logs`, `logs`, `qoder-cli`, `server`, `supervisor`
- Local config structure: NOT YET CREATED

---

## Architecture Target (After Phase 2)

```
LOCAL MASTER (Sovereign on D:)
D:\My System\Local App Junction\OmniRoute\Config\
├── call_logs/         (real local folder - 2.9GB)
├── logs/              (real local folder - 101MB)
├── qoder-cli/         (real local folder - 2.2GB)
├── server/            (real local folder - 15B PID)
└── supervisor/        (real local folder - 10B PID)

C: JUNCTION (Application access point)
C:\Users\Admin\.omniroute
  → D:\My System\Local App Junction\OmniRoute\Config\

DRIVE SYNC (Essential data only - no junctions)
D:\My Drive\Sync\Config\omniroute/
├── storage.sqlite     (real file - 757MB user data)
├── storage.sqlite-shm (real file - 32KB WAL)
├── storage.sqlite-wal (real file - 775MB WAL)
├── oauth/             (real folder - 36B credentials)
├── .env               (real file - 140B config)
├── db_backups/        (real folder - 299KB backups)
├── omniroute_config_clone.py    (real file)
└── omniroute_config_export.py   (real file)
```

---

## Execution Steps (Manual)

### Step 1: Create Local Config Structure
**Status:** ⏳ PENDING

```powershell
if (-not (Test-Path "D:\My System\Local App Junction\OmniRoute\Config")) {
    New-Item -ItemType Directory -Path "D:\My System\Local App Junction\OmniRoute\Config" -Force
}
```

**Verification:**
- [ ] Directory exists: `D:\My System\Local App Junction\OmniRoute\Config\`

---

### Step 2: Copy Non-Essential Folders to Local
**Status:** ⏳ PENDING

Source folders to copy from Drive sync:
- `call_logs/` (2.9GB)
- `logs/` (101MB)
- `qoder-cli/` (2.2GB)
- `server/` (15B)
- `supervisor/` (10B)

**PowerShell Script:**
```powershell
$source = "D:\My Drive\Sync\Config\omniroute"
$dest = "D:\My System\Local App Junction\OmniRoute\Config"

$folders = @("call_logs", "logs", "qoder-cli", "server", "supervisor")

foreach ($folder in $folders) {
    $srcPath = "$source\$folder"
    $dstPath = "$dest\$folder"
    
    if (Test-Path $srcPath) {
        Write-Host "Copying $folder..."
        robocopy $srcPath $dstPath /E /COPY:DAT /DCOPY:DAT /XJ /R:2 /W:2
    }
}
```

**Verification:**
- [ ] All 5 folders exist in local config
- [ ] Call logs copied: `D:\My System\Local App Junction\OmniRoute\Config\call_logs`
- [ ] Logs copied: `D:\My System\Local App Junction\OmniRoute\Config\logs`
- [ ] Qoder-cli copied: `D:\My System\Local App Junction\OmniRoute\Config\qoder-cli`
- [ ] Server copied: `D:\My System\Local App Junction\OmniRoute\Config\server`
- [ ] Supervisor copied: `D:\My System\Local App Junction\OmniRoute\Config\supervisor`

---

### Step 3: Stop OmniRoute (Before Junction Change)
**Status:** ⏳ PENDING

```powershell
# Kill via PID
$pidFile = "$env:TEMP\OmniRoute\omniroute.pid"
if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Kill via port
Get-NetTCPConnection -LocalPort 20128 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2
```

**Verification:**
- [ ] Port 20128 not listening
- [ ] No omniroute processes running

---

### Step 4: Update C: Config Junction
**Status:** ⏳ PENDING

**Current target:** `C:\Users\Admin\.omniroute` → `D:\My Drive\Sync\Config\omniroute`  
**New target:** `C:\Users\Admin\.omniroute` → `D:\My System\Local App Junction\OmniRoute\Config`

```powershell
$junctionPath = "C:\Users\Admin\.omniroute"
$newTarget = "D:\My System\Local App Junction\OmniRoute\Config"

# Remove old junction
if (Test-Path $junctionPath) {
    cmd /c rmdir "$junctionPath" 2>$null
}

# Create new junction
cmd /c mklink /J "$junctionPath" "$newTarget"

# Verify
$newJunction = (Get-Item -LiteralPath $junctionPath).Target
Write-Host "New C: Junction Target: $newJunction"
```

**Verification:**
- [ ] C: junction removed
- [ ] New C: junction created
- [ ] Target confirmed: `D:\My System\Local App Junction\OmniRoute\Config`

---

### Step 5: Delete Non-Essential Folders from Drive Sync
**Status:** ⏳ PENDING

```powershell
$configPath = "D:\My Drive\Sync\Config\omniroute"
$foldersToDelete = @("call_logs", "logs", "qoder-cli", "server", "supervisor")

foreach ($folder in $foldersToDelete) {
    $folderPath = "$configPath\$folder"
    if (Test-Path $folderPath) {
        Write-Host "Deleting $folder from Drive sync..."
        Remove-Item -Path $folderPath -Recurse -Force
    }
}
```

**Verification:**
- [ ] call_logs deleted from Drive sync
- [ ] logs deleted from Drive sync
- [ ] qoder-cli deleted from Drive sync
- [ ] server deleted from Drive sync
- [ ] supervisor deleted from Drive sync

---

### Step 6: Verify Essential Files Remain in Drive Sync
**Status:** ⏳ PENDING

```powershell
$configPath = "D:\My Drive\Sync\Config\omniroute"

Write-Host "Remaining items in Drive sync config folder:"
Get-ChildItem $configPath -Force | Select-Object Name | Format-Table -AutoSize

Write-Host "`nVerifying essential items:"
$essentialItems = @("storage.sqlite", "oauth", ".env", "db_backups")
foreach ($item in $essentialItems) {
    $itemPath = "$configPath\$item"
    if (Test-Path $itemPath) {
        Write-Host "  [OK] $item"
    } else {
        Write-Host "  [ERROR] $item MISSING!"
    }
}
```

**Verification:**
- [ ] storage.sqlite present
- [ ] oauth folder present
- [ ] .env present
- [ ] db_backups present
- [ ] omniroute_config_*.py files present
- [ ] Only 5 essential items remain
- [ ] All 5 non-essential folders gone from Drive sync

---

### Step 7: Restart OmniRoute
**Status:** ⏳ PENDING

```powershell
Write-Host "Starting OmniRoute from new config location..."
& "D:\My Drive\Blue AI\ZZ - Shortcuts\OmniRoute.bat"

Start-Sleep -Seconds 5

# Verify
$listening = Get-NetTCPConnection -LocalPort 20128 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "[OK] OmniRoute listening on Port 20128"
} else {
    Write-Host "[WARN] Port not open yet - check OmniRoute logs"
}
```

**Verification:**
- [ ] OmniRoute starts cleanly
- [ ] Port 20128 listening
- [ ] Faust reconnects

---

### Step 8: Final Verification
**Status:** ⏳ PENDING

```powershell
Write-Host "=== PHASE 2 FINAL VERIFICATION ===" -ForegroundColor Green

# Check C: junctions
Write-Host "`n1. C: Config Junction:"
$target = (Get-Item -LiteralPath "C:\Users\Admin\.omniroute").Target
Write-Host "   Target: $target"
if ($target -eq "D:\My System\Local App Junction\OmniRoute\Config") {
    Write-Host "   [OK] Correct"
} else {
    Write-Host "   [ERROR] Wrong target!"
}

# Check Drive sync only has essentials
Write-Host "`n2. Drive Sync Config Contents:"
$driveItems = @(Get-ChildItem "D:\My Drive\Sync\Config\omniroute" -Force).Count
Write-Host "   Item count: $driveItems"
Get-ChildItem "D:\My Drive\Sync\Config\omniroute" -Force | Select-Object Name | Format-Table -AutoSize

# Check Local config has runtime folders
Write-Host "`n3. Local Config Contents:"
$localItems = @(Get-ChildItem "D:\My System\Local App Junction\OmniRoute\Config" -Force).Count
Write-Host "   Item count: $localItems"
Get-ChildItem "D:\My System\Local App Junction\OmniRoute\Config" -Force | Select-Object Name | Format-Table -AutoSize

Write-Host "`n=== PHASE 2 VERIFICATION COMPLETE ===" -ForegroundColor Green
```

---

## Troubleshooting & Fallbacks

### If junction update fails:
1. Verify OmniRoute is fully stopped
2. Check file locks: `Handle.exe` or Process Explorer
3. Manually verify no process has handles on `C:\Users\Admin\.omniroute`
4. Retry junction creation

### If copying fails:
1. Verify source folders exist
2. Check D: drive free space (need ~5.5GB)
3. Run `chkdsk D: /F` if corrupted
4. Retry copy with fresh robocopy

### If OmniRoute fails to start after junction change:
1. Revert C: junction to old target (Drive sync path)
2. Check OmniRoute logs at `%TEMP%\OmniRoute\omniroute.log`
3. Diagnose root cause
4. Retry with fix

---

## Success Criteria

✅ **Phase 2 Complete when:**
1. C: config junction points to: `D:\My System\Local App Junction\OmniRoute\Config`
2. Drive sync folder contains only: `storage.sqlite`, `oauth/`, `.env`, `db_backups/`, config scripts
3. Local config contains: `call_logs/`, `logs/`, `qoder-cli/`, `server/`, `supervisor/`
4. OmniRoute runs successfully on Port 20128
5. Faust is online and responsive
6. Google Drive syncs only essential files (no junctions)

---

## Resume Instructions

To resume from where you left off:

1. Find the last completed step above (marked ✅)
2. Start from the next incomplete step (marked ⏳)
3. Use the PowerShell scripts provided in each step
4. Verify completion using the checklist
5. Proceed to next step

Current next step: **Step 1 - Create Local Config Structure**
