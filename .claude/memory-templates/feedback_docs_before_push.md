---
name: LAW — Docs before push, no patches
description: Every affected doc updated in the SAME atomic commit as the code. No follow-up "doc patch" commits. Code + docs + stamp + commit + merge + push as one unit. If the docs aren't ready, the push isn't ready.
type: feedback
---

Every push ships with every affected doc already synchronized to the code in that same commit. There is no such thing as a "doc patch follow-up" in this project.

**The atomic unit:**
1. Code change
2. Every affected doc (workflow + public-facing + HTML + READMEs) updated in-place
3. Version stamp updated if applicable
4. Single commit with all of the above
5. Merge + push

**Why:** The user explicitly LAW'd this after multiple incidents where code shipped with stale docs and the "I'll update docs in a follow-up" PR never landed. The atomic commit is the only way to guarantee docs reflect reality.

**How to apply:**
- Before staging code: list every doc that mentions the changed system / function / file / endpoint
- Update those docs in the same working tree
- Stage code + doc updates together
- Commit message describes both the code change AND the doc updates
- If you find yourself wanting to commit code first and "fix docs after" — STOP. The docs are part of the change.
- Public-facing files (READMEs, HTML files, public docs) are in scope — not just internal workflow docs
- Full LAW body in `.claude/CONSTRAINTS.md §DOCS BEFORE PUSH`
