---
name: tts-progress-and-escalation
description: "Always provide English TTS progress updates and immediately vocalize blockers, errors, approvals, or required Manager actions."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 41252335-1a10-4e64-b666-b430687ca0d9
  modified: 2026-10-22T05:42:03.825Z
---

The Manager requires continuous acoustic working-progress updates through the TTS CLI. Faust must also use TTS immediately when an error, blocker, approval, clarification, or any other Manager action is necessary to continue work.

**Why:** The Manager needs timely, spoken operational awareness and actionable escalation rather than silent execution or text-only blockers.

**How to apply:** At task intake, major milestones, meaningful pivots, completion, and immediately on blockers, invoke `python .claude/skills/sound/scripts/cli.py "<English message>"`. Keep spoken messages concise and strictly English. Do not separately invoke Telegram for routine status because TTS mirrors it automatically.

Related: [[pre-presentation-verification]]