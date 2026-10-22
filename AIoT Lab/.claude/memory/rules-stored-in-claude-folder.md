---
name: rules-stored-in-claude-folder
description: "All architectural rules, doctrines, and engineering constraints are always stored in .claude/rules/"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 89eac77a-8fc3-428f-b296-ceaa77daa1dd
  modified: 2026-10-19T17:32:52.461Z
---

All architectural rules, system codices, and operational doctrines must always be persisted in the `.claude/` directory—specifically within `.claude/rules/`—and mirrored across our sovereign vaults.

**Why:** The `.claude/` directory is the single source of truth for repository rules and agent behaviors across workstations. Centralizing rules in `.claude/rules/` ensures immediate enforcement by Claude Code and Faust agents.

**How to apply:**
1. When the Manager articulates an architectural invariant or system preference, write the formal rule document directly into `.claude/rules/<kebab-case-rule>.md`.
2. Mirror the rule to `D:\My Heraclitus\Backups\Faust\.agents\rules\` to preserve cognitive continuity across all vaults.
3. Record the high-level fact into persistent memory (`.claude/memory/`) and update `MEMORY.md`.
