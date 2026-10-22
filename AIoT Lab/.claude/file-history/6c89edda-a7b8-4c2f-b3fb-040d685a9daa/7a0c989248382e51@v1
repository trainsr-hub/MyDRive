# PK Network Outliner Sidebar & Entity Creation Golden Standard

This document establishes the binding, permanent golden standard for all folder structures, hierarchical outliners, and entity creation UX across all Faust applications and tools, derived from the PK Network architecture (`PK Network/src/components/WorkspaceOutliner.tsx` and `NewTableModal.tsx`).

### Non-Negotiable Directive:
"The left sidebar UX of PK Network should be remembered as the golden standard of designing anything related to folder structure. The UX of creating a new entity should be just like how we create a new Table in PK Network."

---

## 1. Outliner Sidebar Anatomy (`WorkspaceOutliner`)
Every folder structure, taxonomy tree, or entity manager must adhere to the 4 layers:

1. **Header Action Deck**:
   - Integrated real-time search input (`min-height: 34px–38px`) with instant `✕` clear button.
   - Global status counter (e.g. `7 to fix` or `All In Sync`).
   - Global action buttons (`Sync All`, `+ New Entity from Template`).
2. **Master Bird's-Eye Toggle**:
   - The topmost node must be a master view trigger (`🌐 All Entities (Bird's Eye)`).
   - Allows zooming out to view the entire system across all groups simultaneously.
3. **Group Folder Nodes (`OutlinerGroupNode`)**:
   - **Visual State**: Dynamic `FolderOpen` when expanded, `Folder` when collapsed, with chevron carets (`▸` / `▾`).
   - **Hover Action**: Hovering over any group header must reveal an inline **`+` button** on the right edge. Clicking this `+` button immediately opens the creation modal with that group pre-selected.
4. **Leaf Entity Nodes (`OutlinerTableNode`)**:
   - Distinct entity icon (`Folder` / `Table`).
   - Active highlight: `border-left: 2px solid var(--accent)`, `background: var(--accent-bg)`, `color: var(--accent)`.
   - Right-side badge: warning counter for conflicts (`[ 4 ]`), clean green `✓` for perfected entities.

---

## 2. Entity Creation Modal Anatomy (`NewTableModal` Pattern)
Every modal designed to spawn, clone, or create a new entity or table must follow this exact sequence:

1. **Geometry & Atmosphere**:
   - Backdrop blur (`rgba(0, 0, 0, 0.7)` with `backdrop-filter: blur(4px)`).
   - `460px` max-width card with `12px` border radius (`radius-lg`) and floating elevation shadow.
   - Header with themed icon (`FolderPlus` / `Database`), title, and clean close `✕`.
2. **Monolithic Form Fields (44px vertical height)**:
   - **Field 1: Natural Language Name**: Human-friendly input with auto-focus (e.g. `C25 - Elena Frost`).
   - **Field 2: Auto-Derived Slug / Folder ID**:
     - Synchronizes live with the Natural Name via regex slugification.
     - Features an amber/accent badge labeled `✨ Auto-derived`.
     - Gracefully decouples if the user manually edits the slug.
   - **Field 3: Group Taxonomy Selector**: `<select>` dropdown pre-selected to the active or hovered group.
   - **Field 4: Template Archetype Card**: Read-only display of the archetype template being cloned.
3. **Action Footer**:
   - Subtle `Cancel` button + Primary accent `Create Entity` button with loading state.
