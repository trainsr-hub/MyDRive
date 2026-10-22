# Authoritative Backend Data Persistence & Anti-Silent-Fallback Rules

### 1. Authoritative Backend Storage
- Backend is the Single Source of Truth (SSOT) for all persistent resources, database states, and game/application data.
- RAM and client state (`localStorage`, Zustand, React state) are ONLY for transient short-term data (active tabs, animations, input fields, open modals). Never treat in-memory browser storage as primary storage.

### 2. No Silent Fallback / Fail Loudly
- Never use silent `try/catch` fallbacks that swallow backend connection errors or pretend everything is okay when a server or service is offline.
- If backend is unreachable or an API call fails, make it immediately, loudly, and explicitly clear to the user (error banners, offline blocker, explicit status).

### 3. No WET Duplicate Shims
- Perform clean, atomic refactors. Never keep deprecated proxy/shim directories or duplicate project folders.
- Maintain Single Source of Truth across all types and schemas.
