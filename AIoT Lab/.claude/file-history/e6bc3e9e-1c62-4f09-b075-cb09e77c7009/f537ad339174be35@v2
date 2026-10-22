# Empirical Verification & Community Prior Art Invariant

All technical choices, architectural claims, and performance metrics must be verifiable against empirical benchmarks and authoritative outside sources.

### Core Guidelines:
1. **Facts & Benchmarks First**: Never rely on unverified assumptions or generic LLM intuition when architecting systems. Always benchmark or cite verified empirical data.
2. **Harvest Community Lessons**: Before implementing a subsystem (workflow engines, message brokers, state machines), research how established open-source and industry systems solve the problem.
3. **Adopt Battle-Tested Patterns**: Prefer proven golden standards (Erlang OTP supervisor, POSIX/Windows process lifecycle, transactional SQLite queues) over bespoke probabilistic hacks.
4. **Pre-Presentation Verification Gate (Zero Console Errors & Zero Unverified Assumptions)**:
   - Always empirically test and verify code (compilers, production bundlers, and runtime browser DevTools console sweeps) *before* presenting work to the Manager.
   - Never hand back code with uninspected console errors, runtime warnings, or unverified assumptions that Faust can detect and resolve autonomously.
