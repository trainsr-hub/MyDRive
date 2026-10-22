# UI/UX Engineering & Design Doctrine

This document outlines the core UI/UX interaction standards, hitbox architectures, and outliner doctrines (referencing `RAW_RULE.md`).

### 1. Lazy-Read Invariant
Only inspect UI templates or design guidelines when actively tasked with frontend/UI engineering.

### 2. Monolithic Vertical Height Law (Zero "Thread" Inputs)
- Thin single-line inputs (`24px–32px`) are strictly forbidden.
- **Tier 1 (Command/Search Bars)**: `60px` (`min-h-[60px]`). Container padding `0 1.25rem`. `<input>` has `height: 100% !important; line-height: 60px !important;`.
- **Tier 2 (Filters & Modals)**: `48px–52px` (`min-h-[48px]`).
- **Tier 3 (Inline/Tree Inputs)**: `44px` (`min-h-[44px]`).
- **Tier 4 (Multi-Line Prompt Editors)**: `100px–140px+`.

### 3. Full-Surface Target Law (Zero Dead Zones)
- Interactive triggers for expanding sections, opening drawers, or selecting items must be the **entire surface area** of the container.
- Non-functional background whitespace, padding, and field labels function as section collapse/expand toggles.
- Nested buttons inside full-surface cards must stop event propagation (`e.stopPropagation()`).

### 4. Single-Active-Branch Outliner & Theme Agnostic
- Structure views with Zone 1 (Determined Past spine with 1-click summary fold) and Zone 2 (Forward choice pathways with dual Select/Edit modes).
- Use soft-coded CSS tokens (`data-theme="dark"|"light"`) enabling instant theme switching without DOM changes.
