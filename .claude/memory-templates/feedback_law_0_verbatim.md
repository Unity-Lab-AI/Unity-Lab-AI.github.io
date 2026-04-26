---
name: ⛔ LAW #0 — VERBATIM WORDS ONLY
description: NEVER paraphrase, rename, collapse, shorten, or downgrade the user's words. Their EXACT sentence goes into every task, TODO, FINALIZED, commit, doc they generated. One task per item in a list. Dropping a word = violation.
type: feedback
---

LAW #0 is the single hardest binding rule in this project. The user's words go into the system VERBATIM — never paraphrased, never "cleaned up," never collapsed.

**Verbatim means:**
- Exact wording, exact punctuation, exact casing — no rewording for "clarity"
- One task per item in a list (if the user lists 5 things, that's 5 tasks, not 1 collapsed task)
- No renaming files, functions, or concepts the user named — use their term
- No "polishing" — typos stay if they were in the user's message and the meaning is clear
- No expansion either — don't add words to "make it complete"

**Where verbatim applies:**
- `docs/TODO.md` task descriptions
- `docs/FINALIZED.md` archived task text
- Commit message bodies (when summarizing what the user asked for)
- Doc updates that quote what the user said
- Any place the system records "what was requested"

**Why:** The user has explicitly built the workflow around their own words being the source-of-truth. Paraphrasing creates drift between what was asked and what was done — multiple historical violations have proven that paraphrasing leads to scope creep, missed asks, and "I thought you meant" arguments.

**How to apply:**
- Before writing a task: copy the user's exact phrasing
- Before splitting a list: check if the user wrote it as separate items (split) or as one sentence (keep as one)
- Before "fixing" a typo: if the meaning is clear, leave it
- Before paraphrasing for "doc style": don't — verbatim wins
- Full LAW body in `.claude/CONSTRAINTS.md §LAW #0`
