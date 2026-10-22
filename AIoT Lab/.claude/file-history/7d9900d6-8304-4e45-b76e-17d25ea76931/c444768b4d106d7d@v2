# Plan: URL Path Routing for Universe 25 Game Tabs

## Context
Currently all four game tabs share a single URL (`localhost:5173`). Visibility is toggled via CSS `display: none/block` through the `activeApp` state in Zustand. The Manager wants each tab to live at its own URL path — making each app independently bookmarkable and navigable by URL. No routing library exists yet; this introduces React Router v6 as the canonical routing standard.

---

## Approach: React Router v6 (`BrowserRouter` + `<Routes>`)

Install `react-router-dom` and wire up one route per app. Maintain the current `app-visible/app-hidden` mount-all strategy (no unmounting) so component state, timers, and scroll position are preserved across navigations.

---

## Implementation Plan

### 1. Install `react-router-dom`
```
npm install react-router-dom
```

### 2. Update `APP_REGISTRY` — add `path` to each manifest
**File:** `src/store/useGlobalStore.ts`

Add a `path` field to `AppManifest` and each registry entry:

| App | path |
|-----|------|
| golden-hour | `/golden-hour` |
| vinyl-angel | `/vinyl-angel` |
| arc-jurassic | `/arc-jurassic` |
| heraclitus | `/heraclitus` |

### 3. Update `AppManifest` type
**File:** `src/core/types.ts` (wherever `AppManifest` is defined)

```ts
export interface AppManifest {
  id: string
  name: string
  icon: string
  description: string
  path: string       // ← new field
}
```

### 4. Wrap app in `<BrowserRouter>` + add redirect
**File:** `src/main.tsx`

Wrap `<App />` with `<BrowserRouter>`. Add a root redirect from `/` → `/golden-hour` using `<Navigate>`.

### 5. Drive `activeApp` from the URL
**File:** `src/App.tsx`

Use `useLocation` / `useNavigate` from React Router to:
- On mount: set `activeApp` in the store from the current pathname
- Keep the store in sync so existing components (`ImperialHeader`, `GameLayout`, etc.) that read `activeApp` continue to work with zero changes

### 6. Replace `setActiveApp` calls in `ImperialHeader` with navigation
**File:** `src/components/ImperialHeader.tsx`

Tab buttons call `navigate(app.path)` instead of `setActiveApp(app.id)`. The URL change triggers `App.tsx` to update the store.

### 7. Vite: enable history API fallback for dev server
**File:** `vite.config.ts`

```ts
server: {
  historyApiFallback: true,   // ← all 404s return index.html
}
```

This makes direct navigation to `localhost:5173/heraclitus` work in development.

---

## Critical Files
| File | Change |
|------|--------|
| `universe-25/src/main.tsx` | Wrap in `<BrowserRouter>`, add root `<Navigate>` |
| `universe-25/src/App.tsx` | Sync `activeApp` store from `useLocation` |
| `universe-25/src/store/useGlobalStore.ts` | Add `path` to `APP_REGISTRY`; update `AppManifest` |
| `universe-25/src/core/types.ts` | Add `path` to `AppManifest` interface |
| `universe-25/src/components/ImperialHeader.tsx` | Tabs use `navigate()` instead of `setActiveApp()` |
| `universe-25/vite.config.ts` | Add `historyApiFallback: true` |

---

## What Does NOT Change
- `AppManager.tsx` — still mounts all four apps simultaneously, CSS toggle unchanged
- All individual app components — zero changes required
- Backend — no changes
- The `activeApp` Zustand state — still exists, just driven by the URL instead of direct `setActiveApp` calls

---

## Verification
1. `npm run build` — zero TypeScript errors
2. Navigate directly to `localhost:5173/heraclitus` — renders Heraclitus only as active
3. Click each header tab — URL changes, active app switches
4. Browser Back/Forward buttons — navigate between apps via history
5. Bookmark `localhost:5173/arc-jurassic` — opens directly to ARC Jurassic on reload
