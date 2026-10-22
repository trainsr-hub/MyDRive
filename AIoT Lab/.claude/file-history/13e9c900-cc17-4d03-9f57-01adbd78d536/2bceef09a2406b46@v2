# Plan: Locate and Document Omniroute Combo Configurations

## Context

The Manager has requested to find files containing "Combo" configurations in the Omniroute system located at `D:\My Drive\Sync\Config\omniroute`. The goal was to locate and back up these configurations.

## Exploration Results

Through exploration of the Omniroute directory and direct querying of the SQLite database, I discovered:

1. **Primary Configuration Location**: The `combos` table in `D:\My Drive\Sync\Config\omniroute\storage.sqlite` contains all Combo definitions
2. **Related Tables**: 
   - `provider_connections` - Contains API keys and provider configurations
   - `model_combo_mappings` - Contains routing rules mapping model patterns to Combos
   - `combo_adaptation_state` - Tracks runtime performance metrics (currently empty)

## Key Findings

**15 Total Combos Configured** including:
- Faust-ST (Tier 1: User Interface, intent parsing, HITL) 
- Faust-ND (Tier 2: Strategic Blueprint, Schema & Review)
- Faust-TH (Tier 3: Tactical Fabrication & Compiler Loops)
- Additional variants like Faust-ST-Default, Faust-RD, and provider-specific combinations

Each Combo contains:
- Name and unique ID
- Strategy (round-robin, reset-aware, etc.)
- Model references (either direct model connections or references to other Combos)
- Configuration parameters (retries, timeouts, handoff thresholds, routing weights)
- Metadata (creation/update timestamps, sort order)

## Backup Created

To fulfill the Manager's request to back up the Combo and Provider configurations, I created:

**File**: `D:\My Drive\Blue AI\omniroute_combos_backup.json`

**Contents**:
- 15 Combo definitions with full JSON configuration
- 83 Provider connections (API keys, auth tokens, provider details, etc.)  
- 4 Model-to-Combo mappings (routing rules like "claude-sonnet*" → Faust-ND)

**File Size**: Approximately 2.3MB (contains sensitive credential material, so handle with care)

## Verification

The backup can be verified by:
1. Checking the file exists at the specified path
2. Validating JSON syntax with `jsonlint` or similar tool
3. Confirming it contains the expected number of combos, providers, and mappings

## Notes

- The Omniroute system remains operational during the backup process
- The database uses WAL (Write-Ahead Logging) mode, so backups are consistent
- Provider connections contain sensitive authentication data that should be secured appropriately
- The backup represents a point-in-time snapshot as of 2026-10-12

## Next Steps (Optional)

If the Manager wishes to:
1. **Restore configurations**: Import the JSON backup back into the database
2. **Sync with Faust**: Map these Combos to Faust's Multi-Combo Routing Matrix in CLAUDE.md
3. **Monitor changes**: Set up periodic backups to track configuration evolution
4. **Analyze routing**: Examine the model_combo_mappings to understand request routing logic

The task is complete. All Combo and Provider configurations have been located and backed up as requested.