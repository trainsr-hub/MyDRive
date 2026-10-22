# Plan: Persistent Workspace Memory (RAM + ROM)

## Context
The Manager wants the plugin to return to the exact place they were working—not only while switching tabs in a live session, but also after Obsidian closes/reopens or the plugin reloads. The Reverse Engineering prompt already survives tab unmounting because it was lifted to `App.tsx` RAM; this needs to become a coherent workspace-memory system for the entire studio.

## Recommended Architecture

### 1. Add a dedicated workspace UI state record
**Modify:** `src/types/schema.ts`, `src/utils/templateManager.ts`

Create a `HazardWorkspaceState` persisted at:
`Hazard_Trigger_Data/workspace_state.json`

Persist only navigation/workflow context—not transient modal, toast, loading, or unsaved table-edit state:

```ts
{
  version: 1,
  activeTab: 'triggers' | 'templates' | 'reverse' | 'components' | 'conditions' | ...,
  reverse: { inputPrompt, componentSearch },
  components: {
    selectedFolderId,
    selectedFileRelPath,
    searchQuery,
    filterMode,
    sortMode,
  },
  conditions: {
    selectedFolderId,
    selectedFileRelPath,
    selectedCategory,
    searchQuery,
    filterMode,
  },
  templates: { selectedCategory, searchQuery },
  updatedAt: number,
}
```

- Add `TemplateManager.loadWorkspaceState()` / `saveWorkspaceState()` alongside existing active-state persistence.
- Use debounced atomic writes (250–500ms) through Obsidian’s vault adapter.
- On a corrupt/missing file: fail safely to defaults and never block plugin initialization.

### 2. Centralize durable navigation state in App
**Modify:** `src/app/App.tsx`

- Load workspace state once after the plugin store initializes.
- Hold `activeTab` and the view-level workspace slices in App state so switching tabs cannot unmount/reset them.
- Pass each view its current slice plus a narrow update callback. This replaces local ownership for state that needs to survive tab switches.
- Debounce persistence whenever any workspace slice changes.

### 3. Convert Components Manager into a controlled workspace consumer
**Modify:** `src/app/components/ComponentsManagerView.tsx`

- Accept a persisted state slice and update callback.
- Restore selected category folder, selected JSON file, query, visibility filter, and sorting mode from that slice.
- When restored paths no longer exist after renames/deletions, retain current safe fallback behavior: choose the first available folder/file and immediately write the corrected location back to ROM.
- Preserve only navigation/filter/sort context. Keep `workingEntries` and dirty edits local; intentionally do not revive unsaved changes after a restart.

### 4. Convert Conditions Manager into a controlled workspace consumer
**Modify:** `src/app/components/ConditionsManagerView.tsx`

- Restore selected Conditions category folder/file and internal semantic category/query/filter state.
- Ensure `loadData()` uses restored paths before falling back to `_00_Core/conditions.json` or the first available table.
- Continue keeping table edits local and only persist after the existing explicit Save flow.

### 5. Complete Reverse Engineering persistence
**Modify:** `src/app/components/ReverseEngineeringView.tsx`

- Move both current `inputPrompt` and component-suggestion search context into its App-controlled workspace slice.
- Preserve prompt and analysis context across tabs and full plugin reopen.
- Keep visual expansion state and temporary copied notices local, because those are UI-only and should reset naturally.

### 6. Extend the pattern pragmatically to active workflow tabs
**Modify:** `src/app/components/TemplatesView.tsx` and any currently mounted management views with meaningful location state.

- Persist Templates search/category filter.
- Do not force persistence onto short-lived modals, dropdowns, hover state, toast notices, or selector popovers.
- Triggers selection state already persists through `active_state.json`; only `activeTab` needs workspace persistence for it.

## Verification

1. Build with `npm run build` → zero errors.
2. Components: navigate to a non-default folder/file, enter search/filter/sort context, switch tabs, return; verify exact state remains.
3. Conditions: navigate to a non-default folder/file plus semantic filter/search, switch tabs, return; verify exact state remains.
4. Reverse: paste a wild prompt and set a component search; switch tabs and return; then reload the plugin/reopen Obsidian; verify both fields return.
5. Reload the plugin after storing state; verify the active tab and all persisted workspace locations restore.
6. Rename/delete a selected folder or file externally; reload; verify a safe fallback location loads with no exception, and future reopen uses that corrected location.
7. Verify no unsaved Components/Conditions row edits are silently committed or resurrected after restart.