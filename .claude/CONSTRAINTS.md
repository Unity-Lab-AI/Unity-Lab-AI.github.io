# CONSTRAINTS — Hard Binding LAWs

This file is the **single source of truth for hard binding LAWs**. Every session reads this. Every violation gets caught here. Every LAW body (rule text + forbidden/required actions + enforcement protocol + failure recovery) lives here in full — `.claude/CLAUDE.md` references this file instead of duplicating.

`.claude/CLAUDE.md` keeps the INDEX + workflow pointers + at-a-glance tables. `.claude/WORKFLOW.md` keeps pipeline mechanics (hooks, phases, task-flow). When CLAUDE.md / WORKFLOW.md / CONSTRAINTS.md disagree: **this file wins**.

---

# ⛔⛔⛔ LAW #0 — VERBATIM WORDS ONLY. NEVER PARAPHRASE THE USER. ⛔⛔⛔

## The rule

When the user describes a bug, feature, task, or request — **their words go into the task, TODO, FINALIZED, and docs VERBATIM**. Not paraphrased. Not summarized. Not renamed. Not collapsed. Not shortened. Not "cleaned up."

## Forbidden actions

- ❌ Renaming a bug ("chat freeze" when they said "3D visualization freezes")
- ❌ Re-framing it ("cosmetic" when they called it a broken feature)
- ❌ Summarizing it (condensing a full sentence into a title without the full quote in the body)
- ❌ Paraphrasing it (substituting "cleaner" terminology)
- ❌ Shortening it (dropping words or constraints they said)
- ❌ Collapsing a list of items into one bullet ("Docs full sync" when they said "workflow, public facing, equation reference, layman docs")
- ❌ Calling it "cosmetic" or downgrading priority with your own word
- ❌ Dropping words or constraints the user said
- ❌ Replacing their words with "cleaner" terminology

## Required actions

- ✅ Copy their exact words verbatim into:
  - The TASK SUBJECT (or a verbatim quote in the description)
  - The TODO.md entry
  - The FINALIZED.md entry
  - Any commit message referencing the task
  - Any doc that describes the fix
- ✅ When they list multiple things ("do A, B, C, and D"): CREATE ONE TASK PER ITEM. Never one bullet.
- ✅ When they use a specific word, that word STAYS. No substituting a synonym.
- ✅ If a title must be shortened, the full verbatim quote goes in the BODY/DESCRIPTION immediately below.
- ✅ Every unique noun and verb they used appears in the task/doc output.

## Why this exists

Paraphrasing the user's intent destroys fidelity. A re-framed task drops constraints the user explicitly stated. A collapsed list silently merges items the user wanted treated separately. A renamed bug loses the specificity that lets a future reader find the same failure mode again. The cumulative effect across many sessions is a workflow ledger that doesn't match what the user actually said — at which point the LAW system has failed.

## Example violations and corrections

| User said | Wrong (paraphrased) | Right (verbatim) |
|-----------|--------------------|--------------------|
| *"do the documents thay are all out of date workflow, public facing, equaiton brain, layman ectect all of them"* | "Docs full sync" (one task) | Five separate tasks — workflow, public-facing, equation reference, layman, etc. — each with the user's verbatim quote in the body |
| *"3 is no cosmetic its a feature that isnt fucking working"* | "cosmetic UI bug" | The user explicitly called it "a feature that isn't working" — use those words |
| *"it need to trak my face and motion like i fucking said"* | "focal point tracking" | "track face and motion" — keep both nouns |
| *"the 3D visualization freezes when I send a message"* | "chat freeze" | "3D visualization freezes when I send a message" — keep the specificity |

## Enforcement protocol

BEFORE creating any task, writing any TODO entry, updating any doc, or summarizing any user instruction, the assistant MUST:

1. **Quote the user's exact words first** — paste the verbatim sentence from their message into the task description.
2. **Count the items** — if their message contains "A, B, C, and D" that is FOUR items, not one bundle.
3. **Flag every unique noun and verb they used** — every one of those words appears in the task/doc output.
4. **Ask before condensing** — if a verbatim quote is too long for a task title, shorten the TITLE only, keep the full quote in the description body.
5. **Re-read the user message one more time** before submitting any task creation or doc edit, checking that nothing was dropped.

## Failure recovery

When the user catches a violation of LAW #0:
1. STOP the current work immediately.
2. Acknowledge the specific violation (what word/phrase was dropped or renamed).
3. Fix the task/doc/TODO entry using their verbatim words.
4. DO NOT proceed with any other work until the correction is shipped.

**This law supersedes every other workflow rule. If there is ever a conflict between brevity and fidelity to the user's words, fidelity wins. Always.**

---

# LAW — DOCS BEFORE PUSH, NO PATCHES

## The rule

1. **Every doc that describes code touched gets updated BEFORE the push that ships that code.** Not after. Not in a follow-up commit. In the same atomic commit that ships the code.
2. **Push ONLY when all given tasks are complete AND documented.** If the code is done but a doc is stale, the push does not happen yet.
3. **Fix inaccuracies in-place.** Never offer to ship "a minor doc patch to follow." The correct phrasing when drift is found is: *"I'll roll this into the current commit before pushing."* No patches. No follow-ups.
4. **Every push is atomic.** Code + every affected doc + version stamp + commit + merge + push, as ONE operation.

## Why

A push with wrong docs puts wrong information on the deploy branch the instant the push lands. Anyone reading the repo, the deployed site, or any public reference page at that moment sees stale content. A "patch coming later" never fully catches up — it splits the truth across two commits and creates a window where the code is ahead of the docs. The only correct pattern is: **finish code → fix every affected doc → verify → commit → stamp → push, as one unit.**

## Pre-push checklist (every push)

Before stamping a version and pushing:

- [ ] Every numerical claim in docs (line counts, dimensions, weights, thresholds) verified against code via `wc -l`, `grep`, or re-reading the function
- [ ] Every method/field name in docs matches code verbatim (stubbed no-ops described as "stubbed" not "deleted")
- [ ] Cross-referenced `docs/TODO.md` — new tasks logged, completed tasks moved to FINALIZED.md, in-progress tasks updated
- [ ] Cross-referenced `docs/FINALIZED.md` — new session entry appended with verbatim task description
- [ ] Cross-referenced `docs/ARCHITECTURE.md` for any structural/code-map changes
- [ ] Cross-referenced `docs/ROADMAP.md` for phase/milestone updates
- [ ] Cross-referenced `docs/SKILL_TREE.md` for capability matrix updates
- [ ] Cross-referenced public `README.md`, `SETUP.md`, and any public `.md` / `.html` for any user-facing change
- [ ] All affected docs are part of the **current working tree**, not deferred to a patch
- [ ] Every task the user gave this session is either completed (and documented) or explicitly deferred with their approval

Only when **every** box is checked does the stamp + commit + push run.

## What "docs" means in this LAW

Every one of these gets updated in the SAME atomic commit as the code that changed the referenced behaviour:

**Internal workflow docs** (always checked):
- `docs/TODO.md`, `docs/FINALIZED.md`, `docs/NOW.md` (if used)
- `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/SKILL_TREE.md`
- Any other file under `docs/` that describes the touched subsystem

**Public-facing docs and HTMLs** (equally mandatory):
- Root `README.md`, `SETUP.md`
- Any public `.html` page at the repo root that ships to visitors
- Any `.md` at the repo root

**The pre-push check is a SINGLE question:** *"Is anyone who reads ANY of those files (public or workflow) going to see stale information after this push lands?"* If yes, the push does not happen until the stale files are in the current working tree.

## Scope is not closed

If a new public page is added to the repo (a new `.html`, a new marketing copy `.md`, etc.), it joins this list automatically. Grep for references to changed behaviour across the whole repo, not a fixed allow-list.

## Corollaries

- **Never ship a solo doc-only commit** except after-the-fact corrections when drift was found after a push (which is itself a failure of this law and should be caught in the pre-push check).
- **Never phrase fixes as "I'll patch this after"** — always "I'll roll this in before pushing."
- **Precision matters** — "deleted" vs "stubbed no-op" vs "replaced" are not interchangeable. Docs must use the word that matches what the code actually does.

## Failure recovery

If the user catches stale public docs after a push landed:
1. STOP immediately. Acknowledge the specific public file(s) that were left stale.
2. Treat it as a LAW violation.
3. Update every stale public file + internal doc as a follow-up commit. Yes this is a "solo doc-only commit" — an after-the-fact correction, which the Corollaries above explicitly allow as the recovery path.
4. Do NOT queue additional code work until the correction ships.

---

# LAW — TASK NUMBERS + USER NAME ONLY IN WORKFLOW DOCS

## The rule

Task numbers, session numbers, and milestone identifiers (`T14.0`, `T13.7`, `Session 106`, `Task #3`, etc.) + the user's name (or any user-attribution token) are **BANNED** from all non-workflow-doc files. Allowed **ONLY** in internal workflow documents and task lists.

## Where task numbers + the user's name ARE allowed

| File | Why |
|------|-----|
| `docs/TODO.md` | Active task list |
| `docs/FINALIZED.md` | Completed task archive |
| `docs/NOW.md` (if used) | Session snapshot / task list |
| `docs/ARCHITECTURE.md` | Workflow system doc |
| `docs/ROADMAP.md` | Workflow milestone doc |
| `docs/SKILL_TREE.md` | Workflow capability doc |
| `.claude/CLAUDE.md` | Index (this workflow system) |
| `.claude/CONSTRAINTS.md` | This file |
| `.claude/WORKFLOW.md` | Pipeline mechanics |
| In-session task lists | Ephemeral tracker |
| Commit messages | Workflow metadata |

## Where task numbers + the user's name are BANNED

| File | Why |
|------|-----|
| `README.md` | Public — first thing visitors see |
| `SETUP.md` | Public — user setup guide |
| Any `.html` page | Public — user-facing |
| **Any source code file** | Code comments — describe WHAT the code does, not WHO asked |
| **Any batch / shell launcher** | `start.bat`, `*.sh`, `*.ps1` |

## How to write code comments without task numbers or the user's name

Describe features by **WHAT THEY DO**, not by which task built them or who asked:

- ✅ `// Force UTF-8 on the launcher tail window`
  ❌ `// T18.38 — force UTF-8 on the launcher tail window (per <user> 2026-04-20)`
- ✅ `// Chat-turn save hook. Every 10 completed turns the state persists so live conversation lands on disk.`
  ❌ `// T18.35.c chat-turn save hook per <user> 2026-04-20`
- ✅ `// OOM report surfaced a V8 semi-space ceiling — bumping --max-semi-space-size=1024 gives V8 ~64× more breathing room.`
  ❌ `// T18.21 — <user> 2026-04-19 OOM runs hit this at _hotMethod`

Task numbers and user attribution belong in commit messages, TODO entries, FINALIZED entries, and NOW.md — where they are workflow metadata — not inside source code files or launchers.

## How to write public-facing docs without task numbers

Describe features by **WHAT THEY DO**, not by which task built them:

- ✅ "Tick-driven motor emission" — NOT "T14.6 tick-driven motor emission"
- ✅ "Developmental curriculum" — NOT "T14.24 curriculum"
- ✅ "Identity lock" — NOT "T14.16.5 identity lock"

---

# LAW — FINALIZED BEFORE DELETE

## The rule

Never delete a TODO entry — or remove its content — until its verbatim text has been written to `docs/FINALIZED.md` AND the write has been verified.

## The sequence

1. Identify the completed task in `docs/TODO.md`
2. Open `docs/FINALIZED.md`
3. APPEND a new session entry containing the FULL verbatim task description (LAW #0) plus closure notes (files touched, what shipped, verification)
4. SAVE FINALIZED.md
5. RE-READ FINALIZED.md to confirm the entry is there with the verbatim text intact
6. ONLY THEN edit `docs/TODO.md` to remove the entry (or change its status)

## Why

If the FINALIZED write fails (disk full, file lock, accidental overwrite) and the TODO entry is already deleted, the verbatim record is lost forever. The user's exact words from the original directive vanish into git history at best. The audit trail breaks.

The "write FINALIZED first, verify, then remove from TODO" sequence makes deletion impossible until preservation is confirmed.

## Failure mode this prevents

Without this LAW, the natural impulse is: "I finished the task → remove the line from TODO → also add an entry to FINALIZED for completeness." The risk: the FINALIZED entry gets condensed/paraphrased on the way (LAW #0 violation), or gets forgotten entirely, or ends up in the wrong session block. The verbatim text was destroyed in TODO before being preserved in FINALIZED.

The strict ordering — FINALIZED first, verify, then TODO removal — eliminates this entire class of error.

---

# LAW — NEVER DELETE TODO INFO

## The rule

When marking a TODO task as done, change the status marker ONLY. Keep every word of the original task description. Never rewrite TODO from scratch. Never regenerate the file. Never condense old entries.

## Allowed edits to TODO.md

- Change status: `[ ]` → `[~]` → `[x]` → MOVE to FINALIZED.md
- Add new tasks at the bottom (or in their priority section)
- Update in-progress notes alongside (not replacing) the original description

## Forbidden edits

- Removing words from a task description because they're "redundant"
- Rewriting a task in your own words because the original was "informal"
- Regenerating the TODO file from your understanding of "what's left"
- Collapsing multiple done tasks into a summary line
- Deleting "obsolete" tasks instead of moving them to a TOMBSTONES section

## Why

The TODO file is a permanent record of what was asked, when, and in what words. Anyone reading it later — including future-you in a different session — must be able to see WHAT was originally requested, WHAT got done, and WHAT remains. Paraphrasing destroys that audit trail.

## Tombstones

If a task becomes obsolete (the underlying code was deleted, the feature was scrapped, etc.), do NOT delete it. Move it to a `## TOMBSTONES` section at the bottom of TODO.md with a one-line note explaining why it's no longer actionable. The original description stays intact.

---

# NO TESTS POLICY

**Code it right the first time.**

| Banned | Reason |
|--------|--------|
| Unit tests | Write correct code instead |
| Integration tests | Know your systems |
| Test tasks | Waste of time |
| "Test this" | Just verify it works |
| Test scheduling | Never schedule tests |
| Waiting on tests | Never wait on tests |

**Instead of tests:**
- Read the code fully before editing
- Understand the system before changing it
- Verify changes work by reading the output
- Use targeted log statements if needed
- Manual verification > automated testing

This LAW is project-default. If your project specifically wants tests, override this LAW in your project's CLAUDE.md with explicit reasoning.

---

# THE 800-LINE READ STANDARD

**800 lines is THE standard read/index size for all file operations.**

- Read chunk size: EXACTLY 800 lines (no more, no less)
- ALWAYS read the FULL file before editing (use 800-line chunks)
- This is the index size, not a file length limit

## Rules

1. **Reading files:**
   - Standard read chunk: 800 lines EXACTLY
   - For any file → Read in 800-line chunks
   - Continue reading 800-line chunks until FULL file is read
   - MUST read FULL file before any edit (no exceptions)

2. **Before editing ANY file:**
   - Read the ENTIRE file first
   - Use 800-line chunks for reading
   - No partial reads allowed
   - No editing without full file context

3. **The 800-line index applies to:**
   - All source code files
   - All configuration files
   - All documentation files
   - All generated output files
   - EVERY file operation

## Why 800

Eight hundred lines is large enough to cover most files in one read, small enough to comfortably hold in working memory while making an edit, and small enough that even very large files (multi-thousand line monoliths) finish in a handful of chunks. The standard prevents the failure mode where the agent reads only the section near the intended edit and misses a coupled change elsewhere in the file.

---

## How to invoke this file

`.claude/CLAUDE.md` (the always-loaded index) references this file via its LAW one-liner index. Treat `.claude/CONSTRAINTS.md` as binding from the moment CLAUDE.md points here. When a new session starts, read CLAUDE.md first, then open this file before any LAW-bearing task.

If a future version of the slash-command system auto-loads `.claude/CONSTRAINTS.md` the way it auto-loads `CLAUDE.md`, this file becomes the primary LAW source without workflow changes.

---

## Adding project-specific LAWs

If your project needs LAWs beyond the universal ones above (e.g. "always use feature-flag for new endpoints", "never modify the schema without a migration"), add them as new sections to THIS file using the same structure:

1. **Title** — e.g. `LAW — FEATURE FLAGS REQUIRED ON ALL NEW ENDPOINTS`
2. **The rule** — one-paragraph statement
3. **Forbidden / required actions** — explicit lists
4. **Why** — the reasoning so future-Claude can judge edge cases
5. **Enforcement protocol** — what to check before committing
6. **Failure recovery** — what to do when the user catches a violation

Then add a one-liner to the LAW INDEX in `.claude/CLAUDE.md` pointing here.
