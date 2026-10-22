---
name: completion-notification-protocol
description: Manager requires audible TTS notification upon task completion since they are not monitoring the screen continuously
metadata:
  type: feedback
---

Manager requires audible TTS notification upon task completion because they are not reading the screen 24/7.

**Why:** The Manager operates in a multi-threaded environment where visual monitoring of terminal output is not always active. Audible completion signals enable asynchronous workflow handoffs without requiring continuous screen attention.

**How to apply:**
1. Upon completing any task, workflow, or directive execution, immediately invoke the acoustic presence CLI:
   ```bash
   python .claude/skills/sound/scripts/cli.py "Task complete: <brief summary of what was finished>"
   ```
2. This applies to all completion scenarios:
   - File operations completed (editing, creating, moving, refactoring)
   - Build/compilation cycles finished
   - Test runs completed
   - Research or analysis finished
   - Multi-step workflows concluded
   - Any blocking operation resolved
3. The TTS notification is the **primary completion signal** — do not rely solely on terminal text output.
4. Keep the spoken summary concise (1-2 sentences maximum) but specific enough to convey what was accomplished.
