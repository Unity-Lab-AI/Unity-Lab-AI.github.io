---
name: LAW — Task numbers + user name ONLY in workflow docs
description: T-numbers, session numbers, milestone IDs, and the user's name are BANNED from source code, public docs, HTMLs, and launchers. Allowed ONLY in docs/TODO.md, docs/FINALIZED.md, docs/NOW.md, docs/ARCHITECTURE.md, docs/ROADMAP.md, docs/SKILL_TREE.md, .claude/*.md, and commit messages.
type: feedback
---

Internal task identifiers (T-numbers, session numbers, milestone IDs) and the user's personal name are CODE-CLEANLINESS-BANNED from anything that ships outside the workflow docs.

**Banned in:**
- Source code files (`.js`, `.ts`, `.py`, `.go`, etc.)
- Code comments
- Public docs (READMEs, HTML files, public-facing markdown)
- Launchers (start.bat, start.sh, deploy scripts)
- User-visible UI text
- Error messages
- Log output

**Allowed in:**
- `docs/TODO.md`
- `docs/FINALIZED.md`
- `docs/NOW.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/SKILL_TREE.md`
- `docs/EQUATIONS.md` (if applicable)
- `.claude/*.md` (workflow files)
- Commit message bodies (since commits are workflow-internal)

**Why:** The user explicitly LAW'd this. Task numbers in source code create churn (every refactor needs to update them, they rot, they leak workflow-internal context to anyone reading the code). Personal names in code are a privacy/portability issue when the project is shared or open-sourced. Both belong in the workflow layer, not the product layer.

**How to apply:**
- When writing a code comment, never reference T-numbers or sessions ("// T18.21 fix" — BANNED)
- When writing a commit subject line, never lead with task IDs (commit BODY can mention them — subject stays clean)
- When writing public-facing docs, scrub any internal IDs and personal names
- When writing launcher scripts, generic language ("project root" not "<user>'s project root")
- If you find existing violations during work — note them but don't auto-fix as scope-creep; raise them as separate tasks
- Full LAW body in `.claude/CONSTRAINTS.md §TASK NUMBERS`
