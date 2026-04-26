---
name: LAW — FINALIZED before DELETE — ABSOLUTE
description: Never delete a TODO entry until its verbatim text has been appended to FINALIZED.md AND the write is verified. Order is FINALIZED-write FIRST, verify, THEN remove from TODO. Reverse order = lost task = violation.
type: feedback
---

When marking a task done, the order is ABSOLUTE:

1. **Write** the task's verbatim text to `docs/FINALIZED.md` (per LAW #0 — verbatim, not paraphrased)
2. **Verify** the write succeeded by reading the file back
3. **Then** remove the entry from `docs/TODO.md`

Reverse order = lost work. If you remove from TODO before writing to FINALIZED and the FINALIZED write fails (disk full, permission error, typo'd path), the task disappears with no archive.

**Why:** The user has corrected this MULTIPLE TIMES across sessions. Tasks have been lost when the write order was reversed. The LAW exists because the failure mode is silent — you don't notice the missing task until much later.

**How to apply:**
- Before removing ANY entry from TODO: open FINALIZED.md, append the task's verbatim text, save
- Re-read FINALIZED.md to confirm the entry is there
- ONLY THEN remove from TODO
- If FINALIZED write fails for any reason, the TODO entry stays — fix the write, retry, verify, then delete from TODO
- Never "batch" deletes — do one task at a time, FINALIZED-then-DELETE per task
- Full LAW body in `.claude/CONSTRAINTS.md §FINALIZED BEFORE DELETE`
