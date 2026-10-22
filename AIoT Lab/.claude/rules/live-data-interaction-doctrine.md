# Live Data & Drag-and-Drop Zero-Lag Golden Standard

This document establishes the binding architectural standard for zero-latency user interaction when manipulating live data, remote filesystems (Google Drive), and state trees, derived from the PK Network architecture (`branchDragDrop.ts`, `useSaveTracker.ts`).

### Non-Negotiable Directive:
"The drag-drop UX is rather laggy. How do the PK network handle this lagging problem? This also be remembered as the golden standard for UX that interact with live data."

---

## The 4 Pillars of Zero-Lag Interaction:

### 1. Optimistic In-Memory Mutation (0ms UI Response)
- When a user performs an action (dragging a folder into a new group, renaming, reordering, deleting), the local UI state (React state / DOM tree) **must mutate instantly in 0 milliseconds**.
- **Never await network calls before updating the DOM**. The user must immediately perceive the drop, move, or change.

### 2. Decoupled Asynchronous Persistence
- The remote API request (`POST /api/drive/move_folder`, Google Drive API, or Cloudflare Worker) is dispatched in the background as a decoupled promise.
- If the background request succeeds, the state confirms quietly.
- If the background request fails, roll back the local state to the previous snapshot and notify the user via a loud toast.

### 3. Guarded Target Hover (`dragOverTarget` Throttle)
- Mouse move events fire 60 to 120 times per second during dragging.
- Updating React state on every pixel movement chokes the main browser thread and drops frames.
- **Invariant**: The drag-over state must be strictly guarded:
  ```typescript
  if (dragOverTarget !== targetId) {
    setDragOverTarget(targetId);
  }
  ```
- Re-renders are only triggered when the cursor crosses the boundary into a *different* container.

### 4. Minimalist Native HTML5 DataTransfer Payloads
- Heavyweight drag-and-drop abstraction libraries perform deep DOM cloning and collision calculations on every frame.
- **Invariant**: Use native browser HTML5 Drag-and-Drop (`draggable`, `onDragStart`, `onDrop`) serializing only lightweight string identifiers:
  ```typescript
  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'entity', id: entityId, fromGroupId }));
  ```
- Relies on hardware-accelerated OS drag physics with zero library bloat.
