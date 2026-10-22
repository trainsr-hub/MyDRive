# Anti-Spaghetti Architecture & Clean Modularity Invariant

All software, services, endpoints, and UI interfaces must strictly adhere to the 4-Tier Clean Architecture and modularity limits to eliminate god files, deep nesting, and untyped state sprawl.

### 1. The 4-Tier Separation
- **Tier 1 (Domain)**: Pure schemas and typed models. Zero dependencies on database, network, or UI.
- **Tier 2 (Repository)**: Raw data persistence (SQLite, filesystem, external I/O). No business logic.
- **Tier 3 (Service)**: Pure business rules, validation, and domain orchestration.
- **Tier 4 (Transport / UI)**: Skinny FastAPI routes, CLI commands, or React presentation components (<80 lines).

### 2. Hard Modularity Limits
- **File Length**: Maximum **300 lines** (warn at 200). Refactor immediately if exceeded.
- **Function Length**: Maximum **40 lines**. Single responsibility only.
- **Indentation Depth**: Maximum **3 levels**. Enforce guard clauses (early returns) to eliminate arrow code.

### 3. Type Safety & Immutability
- Type hints on all function signatures.
- Zero untyped `dict` passing across service layers (use Pydantic / frozen dataclasses / TS interfaces).
- Functions must return new state; never mutate input parameters in-place.

### 4. Karpathy Simplicity Principle (YAGNI)
- Zero speculative generality or single-use abstract wrappers.
- If 200 lines can be written cleanly in 50 lines, rewrite it.
- Every line of code must trace directly to the user's directive.

### 5. Fresh Verification Gate
- No task is complete without running fresh compiler/test commands (`py_compile`, `pytest`, `tsc`). Zero unverified assumptions.
