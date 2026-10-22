---
name: authoritative-local-state-doctrine
description: "When our application authors all folder mutations, avoid continuous network re-syncing. Local SQLite is the authoritative persistent state (0ms load). Remote Google Drive scanning is strictly manual on-demand."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6c89edda-a7b8-4c2f-b3fb-040d685a9daa
  modified: 2026-10-20T10:38:41.761Z
---

# Authoritative Local State & Anti-Continuous-Resync Doctrine

The Manager established the binding architectural principle:
**"Now, having to re-sync the folders all the time everytime is rather daunting. This data structure is rarely change much anyway, new subfoldes will only change through this app. I don't think the re-sync is necessary, given all the folder we work with is created by the app only."**

### Why Continuous Re-Syncing is an Anti-Pattern:
1. **Network Latency & Frustration**: Traversing Google Drive folder trees takes multiple seconds per scan. Forcing a network traverse on every page load or action creates daunting friction.
2. **Drive API Quota Burning**: Constant polling burns Google Drive API rate limits unnecessarily.
3. **Known System Authorship**: Because our application itself creates, renames, and reconciles all folders, the system already knows the exact state of every directory.

### Core Architectural Invariants:
1. **Local SQLite is the Single Source of Truth**:
   - The folder tree and entity hierarchy are persistently stored in local SQLite (`folder_tree_cache`).
   - On application startup and page reloads, load the state **instantly from SQLite in 0ms**.
   - `bypass_cache` is strictly `false` by default.
2. **In-Place Local Mutation on Every Action**:
   - When a new entity is created, renamed, or moved, update the local SQLite database record immediately.
   - The local state stays 100% synchronized without needing a remote scan.
3. **Manual On-Demand Remote Verification Only**:
   - Remote Google Drive API scanning is reserved exclusively for a manual **`[ 🌐 Re-scan from Google Drive ]`** button.
   - Never automatically re-sync over the network unless explicitly commanded by the Manager.
