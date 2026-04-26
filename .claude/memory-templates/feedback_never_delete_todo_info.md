---
name: LAW — Never delete TODO info, never rewrite from scratch
description: When marking a task done, change the STATUS only. Keep every word of the original description. Never regenerate TODO.md from scratch. Anyone reading the TODO must see WHAT was done and WHERE, not just a checkmark.
type: feedback
---

NEVER delete task descriptions in TODO.md. NEVER rewrite TODO.md from scratch. Edit in place.

**The rule:**
- Marking a task done = change status marker only (`[~]` → `[✓]` or move to FINALIZED — see `feedback_finalized_before_delete.md`)
- Original task description stays word-for-word
- Status markers go at the start: `[ ]` (todo) / `[~]` (in progress) / `[✓]` (done) / etc.
- New tasks always go at the bottom — never at the top, never inserted "logically"
- Completed tasks stay where they are with status updated, until they're moved to FINALIZED

**Why:** The user has explicitly LAW'd this. Anyone reading TODO must be able to see:
- What was originally requested (verbatim per LAW #0)
- Where it sits in the work order
- What status it's in
- A checkmark with no description tells you nothing — the description is permanent context.

**How to apply:**
- When marking done: edit the status marker, leave everything else
- When adding new tasks: append to bottom of file
- NEVER use Write tool to regenerate TODO.md — always Edit in place
- If TODO.md is getting long, that's fine — it's a record, not a UI. Don't "tidy" it.
- If you want to summarize, write a SEPARATE summary file. Don't mutate TODO.
- Full LAW body in `.claude/CONSTRAINTS.md §NEVER DELETE TODO INFO`
