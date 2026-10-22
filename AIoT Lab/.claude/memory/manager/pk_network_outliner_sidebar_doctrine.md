---
name: pk-network-outliner-sidebar-doctrine
description: "The PK Network Left Sidebar and Creation Modal is the permanent golden standard for all folder structures, outliners, and taxonomy navigation."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6c89edda-a7b8-4c2f-b3fb-040d685a9daa
  modified: 2026-10-20T09:55:36.242Z
---

# PK Network Left Sidebar & Outliner Golden Standard

The Manager established the binding golden standard:
**"The UX should be just like how we create a new Table in `D:\My Drive\Blue AI\PK Network`. In fact. The left sidebar UX of PK Network should be remembered as the golden standard of designing anything related to folder structure"**

### Core Anatomy of the Golden Standard (from `PK Network`):
1. **Sidebar Header (`WorkspaceOutliner`)**:
   - Integrated search filter (`min-height: 38px`) with clear button.
   - Compact action triggers on the top row (`+ Add Group`, `+ Add Entity/Table`).
2. **Hierarchy & Node Design (`OutlinerGroupNode` & `OutlinerTableNode`)**:
   - **Groups (Folders)**:
     - `FolderOpen` when expanded, `Folder` when collapsed.
     - Chevron disclosure carets (`▸` / `▾`).
     - Hover quick-action: an inline `+` button directly on the folder row to immediately spawn an item inside that specific parent without navigating away!
   - **Leaf Items (Entities/Tables)**:
     - Dedicated item icon (`Table` / `Folder`).
     - Active styling: `borderLeft: 2px solid var(--accent)`, `background: var(--accent-bg)`, `color: var(--accent)`.
     - Count badge on the right (`font-mono` pill).
3. **Creation Modal (`NewTableModal` Pattern)**:
   - Backdrop blur (`rgba(0, 0, 0, 0.7)`, `backdropFilter: blur(4px)`).
   - `460px` max-width card with `12px` border radius.
   - Clean header with themed icon, title, and close `✕`.
   - **Form Fields (44px vertical height)**:
     1. Natural Language Name field with autofocus.
     2. Auto-derived slug/folder ID field with `Auto-derived` pill that synchronizes until manual edit.
     3. Group selector `<select>` defaulting to the active or hovered group.
     4. Template Archetype selector.
   - Clean footer: `Cancel` and primary `Create` button.
