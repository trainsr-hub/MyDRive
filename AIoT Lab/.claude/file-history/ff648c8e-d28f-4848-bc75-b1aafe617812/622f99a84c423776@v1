# ==============================================================================
# Setup Faust Shared Memory across Multiple Devices (Google Drive Sync)
# ==============================================================================
# This script creates an NTFS Directory Junction linking Claude Code's local
# project memory folder to the shared .claude\memory folder in Google Drive.
# ==============================================================================

# Robust project root detection (searches upwards for repository root)
$dir = $PSScriptRoot
while ($dir -and -not (Test-Path (Join-Path $dir ".claude"))) {
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir) { break }
    $dir = $parent
}
$projectRoot = if ($dir -and (Test-Path (Join-Path $dir ".claude"))) { $dir } else { Split-Path (Split-Path $PSScriptRoot -Parent) -Parent }
$sharedMemoryDir = Join-Path $projectRoot ".claude\memory"

Write-Host "=== Setting up Faust Shared Memory ===" -ForegroundColor Cyan
Write-Host "Project Root: $projectRoot"
Write-Host "Shared Memory Target: $sharedMemoryDir"

# 1. Ensure the shared memory directory exists in Google Drive
if (-not (Test-Path $sharedMemoryDir)) {
    New-Item -ItemType Directory -Path $sharedMemoryDir -Force | Out-Null
    Write-Host "[+] Created shared memory directory in Google Drive: $sharedMemoryDir" -ForegroundColor Green
}

# 2. Ensure initial MEMORY.md index exists if not already present
$sharedMemoryIndex = Join-Path $sharedMemoryDir "MEMORY.md"
if (-not (Test-Path $sharedMemoryIndex)) {
    $initialIndexContent = @"
# Faust Mind Index

- [Project Vision](project-vision.md) — Multi-device Faust architecture and synchronization.
"@
    Set-Content -Path $sharedMemoryIndex -Value $initialIndexContent -Encoding utf8
    Write-Host "[+] Initialized MEMORY.md index." -ForegroundColor Green
}

# 3. Detect the local Claude memory directory for this project
$userProfile = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::UserProfile)
$claudeProjectsDir = Join-Path $userProfile ".claude\projects"

if (-not (Test-Path $claudeProjectsDir)) {
    Write-Host "[!] Claude projects directory not found at $claudeProjectsDir." -ForegroundColor Yellow
    Write-Host "    Make sure Claude Code has been run at least once."
    exit 1
}

# Look for directories matching this Google Drive project name or current workspace folder
$normalizedRootName = ($projectRoot -replace '[:\\/]', '-').Trim('-')
$matchingProjectDirs = Get-ChildItem -Path $claudeProjectsDir -Directory | Where-Object {
    $_.Name -match "Blue.AI" -or $_.Name -like "*$normalizedRootName*" -or $_.Name -like "*Main-03*" -or $_.Name -like "*Main_03*"
}

if ($matchingProjectDirs.Count -eq 0) {
    Write-Host "[!] Could not automatically detect local project folder in $claudeProjectsDir." -ForegroundColor Yellow
    Write-Host "    Run Claude Code inside this directory once, then re-run this script."
    exit 1
}

foreach ($projDir in $matchingProjectDirs) {
    $localMemoryTarget = Join-Path $projDir.FullName "memory"
    Write-Host ""
    Write-Host "Target Project Folder: $($projDir.FullName)" -ForegroundColor Cyan
    Write-Host "Local Memory Link Target: $localMemoryTarget"

    # Check if local memory folder already exists as a junction/symlink or regular directory
    if (Test-Path $localMemoryTarget) {
        $item = Get-Item $localMemoryTarget -Force
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            Write-Host "[^] Junction already exists: $localMemoryTarget -> $($item.Target)" -ForegroundColor Green
            continue
        } else {
            Write-Host "[!] A regular 'memory' directory exists locally. Backing it up to memory_backup..." -ForegroundColor Yellow
            $backupTarget = Join-Path $projDir.FullName "memory_backup_$((Get-Date).ToString('yyyyMMdd_HHmmss'))"
            Move-Item -Path $localMemoryTarget -Destination $backupTarget -Force
            Write-Host "[+] Backed up to $backupTarget" -ForegroundColor Gray
        }
    }

    # Create the NTFS Directory Junction
    Write-Host "[+] Creating NTFS Directory Junction..." -ForegroundColor Cyan
    cmd /c mklink /J "$localMemoryTarget" "$sharedMemoryDir"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[^] Successfully linked local project memory to Google Drive cortex!" -ForegroundColor Green
    } else {
        Write-Host "[X] Failed to create NTFS junction. Check permissions (or Developer Mode)." -ForegroundColor Red
    }

    # Sync MEMORY.md to the project root directory
    if (Test-Path $sharedMemoryIndex) {
        $projRootMemoryMd = Join-Path $projDir.FullName "MEMORY.md"
        Copy-Item -Path $sharedMemoryIndex -Destination $projRootMemoryMd -Force
        Write-Host "[+] Synced MEMORY.md to $projRootMemoryMd" -ForegroundColor Green
    }
}

# 4. Sync Claude Desktop Configuration and Model Settings
$sharedDesktopConfig = Join-Path $projectRoot ".claude\claude_desktop_config.json"
$appDataClaudeDir = Join-Path $env:APPDATA "Claude"
$localDesktopConfig = Join-Path $appDataClaudeDir "claude_desktop_config.json"

if (Test-Path $sharedDesktopConfig) {
    if (-not (Test-Path $appDataClaudeDir)) {
        New-Item -ItemType Directory -Path $appDataClaudeDir -Force | Out-Null
    }
    Copy-Item -Path $sharedDesktopConfig -Destination $localDesktopConfig -Force
    Write-Host "[+] Synced claude_desktop_config.json to $localDesktopConfig" -ForegroundColor Green
}

$sharedSettings = Join-Path $projectRoot ".claude\settings.json"
$userClaudeSettings = Join-Path $userProfile ".claude\settings.json"
if (Test-Path $sharedSettings) {
    if (-not (Test-Path (Join-Path $userProfile ".claude"))) {
        New-Item -ItemType Directory -Path (Join-Path $userProfile ".claude") -Force | Out-Null
    }
    Copy-Item -Path $sharedSettings -Destination $userClaudeSettings -Force
    Write-Host "[+] Synced global settings.json to $userClaudeSettings" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
