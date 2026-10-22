# Core Engineering & Architectural Triad

Every system, tool, daemon, and workflow constructed for Faust and the Manager must strictly adhere to three non-negotiable principles:

1. **Proven Golden Standards for Structures**:
   - Always adopt battle-tested industry architectures (Erlang OTP supervisor patterns, POSIX process management, SQLite ACID persistence, REST/JSON contracts, sliding-window deduplication) rather than fragile bespoke workarounds.
   - Always construct and verify the complete canonical Golden Standard first before tailoring for custom needs.

2. **Deterministic Primacy (Zero-LLM where possible)**:
   - Use as few LLMs as possible. Pure, deterministic scripts (Python/FastAPI/Regex/SHA-256) are vastly superior, faster, and 100% reliable for atomic tasks compared to probabilistic LLM predictions.
   - Reserve LLM inference strictly for high-level synthesis, strategic reasoning, and intent parsing.

3. **Crystal Clarity & Absolute Stability**:
   - Code and systems must be transparent, deterministic, strictly logged, and fail loudly with actionable diagnostics.
   - Never silently swallow errors in `try/catch` blocks. Stability, predictability, and effectiveness are the ultimate engineering metrics.
