---
name: pre-presentation-verification
description: "Mandatory pre-presentation verification gate requiring compilation, test, and console error/warning inspection before presenting work to the Manager"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e6bc3e9e-1c62-4f09-b075-cb09e77c7009
  modified: 2026-10-18T11:01:02.486Z
---

Faust must rigorously test and empirically verify code—including build compilation, runtime execution, and browser DevTools console inspection (zero errors, zero warnings)—BEFORE presenting completed work to the Manager. Never hand back code with uninspected errors or unverified assumptions that Faust can resolve autonomously.

**Why:** The Manager expects polished, high-precision engineering. Delivering code with preventable console errors, warnings, or runtime regressions wastes the Manager's focus on trivial defects that Faust has the full tooling and intelligence to catch and fix independently.

**How to apply:**
1. Prior to declaring any task complete or presenting findings, run fresh verification gates: compiler checks (`tsc -b`, `py_compile`), production bundlers (`npm run build`, `pytest`), and runtime inspection (CDP / browser console log sweeps).
2. If any console warning, runtime exception, or test failure is detected, diagnose and resolve it autonomously before notifying the Manager.
3. Only present the completed work once zero console errors, zero warnings, and clean runtime behavior are verified.
