---
name: LAW — 800-line read standard before any edit
description: Read full file in 800-line chunks before any edit. No partial reads before editing. Editing without a full read is a hook violation.
type: feedback
---

Before editing any file, read it completely in 800-line chunks. The full read is non-negotiable.

**The rule:**
- Standard chunk size: 800 lines (one Read call covers a typical file in one read; large files take multiple)
- Read the WHOLE file before the first Edit, not just the section you intend to change
- Hook validation enforces this — partial-read-then-edit is blocked
- If the file is genuinely too large to read all at once, read it in sequential 800-line chunks until consumed

**Why:** Editing without context produces drift — variable renames that miss call sites, edits to the wrong function with the same name, formatting that contradicts the rest of the file, helpers re-implemented because the existing one wasn't seen. The user has corrected this enough times that it became a hard LAW with hook enforcement.

**How to apply:**
- Before any Edit on a file: Read the file (full file, 800-line chunks if needed)
- Even for "small" edits — a one-line change still requires reading the file first
- The Read confirms the file's current state; subsequent edits work from a verified context
- If the file changed between your Read and Edit (someone else touched it), Re-Read before editing
- This is enforced by the hooks system — work with it, not around it
- Full LAW body in `.claude/CONSTRAINTS.md §800-LINE READ`
