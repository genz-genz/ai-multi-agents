---
name: feedback-single-writer-hot-state
description: Before editing docs/STATUS.md or docs/OPEN_LOOPS.md, check the latest handoff for who holds the writer role; don't write if it moved to OpenCode
metadata:
  type: feedback
---

STATUS.md / OPEN_LOOPS.md have exactly one writer per round. After `docs/handoffs/04-claude-to-opencode.md` (2026-09-25) the writer is OpenCode until it hands back.

**Why:** AGENTS.md single-writer rule; two harnesses writing the same hot-state file causes conflicts.
**How to apply:** read the newest file in `docs/handoffs/` first; if writer != Claude, report proposed STATUS/OPEN_LOOPS changes instead of editing. Also stop if the working tree has uncommitted files I didn't author. Related: [[project-site-ia-and-ui-rules]].
