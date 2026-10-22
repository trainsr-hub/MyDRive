---
name: drive-is-slave-mirror-doctrine
description: "Master-Slave Invariant - Local SQLite on Disk D is sovereign Master; Google Drive is merely a slave mirror. All mutations happen locally first in 0ms, pushing to Drive on command."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6c89edda-a7b8-4c2f-b3fb-040d685a9daa
  modified: 2026-10-20T11:11:28.924Z
---

# Sovereign Master-Slave Drive Mirroring Doctrine

The Manager established the binding sovereign architectural rule:
**"We wouldn't want mock data anymore, Faust. Because our real data is rather offline. I think we should add a top-right button to sync the config to the Drive. Meaning We change the folders locally, and then the Drive will only mirror that. Drive is merely slave."**

### Core Invariants:
1. **Local SQLite is the Sovereign Master (SSOT)**:
   - All folder creations, entity spawning, renaming, re-parenting, and deletions happen **locally first in SQLite (`data/neo_drive.db`) in 0ms**.
   - The application is 100% offline-first. Working in the app never freezes or awaits Google Drive network round-trips.
2. **Google Drive is Purely a Slave Mirror**:
   - Google Drive does not dictate state; it merely reflects the local SQLite master.
   - Pushing state to Google Drive is controlled by the Manager via a prominent top-right button: **`[ 🚀 Mirror to Drive ]`**.
3. **Deterministic Push Engine**:
   - Clicking `Mirror to Drive` inspects the delta between local SQLite and remote Drive, executing batch provisioning, renaming, and safe pruning to enforce the local structure onto the cloud.
