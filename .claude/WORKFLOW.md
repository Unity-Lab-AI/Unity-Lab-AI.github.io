# WORKFLOW — Pipeline, Hooks, Task Flow

This file holds the operational workflow mechanics: `/workflow` pipeline phases, double-validation hooks, TODO/FINALIZED task flow, file-edit protocol, and agent file reference.

`.claude/CLAUDE.md` is the index that references this file. `.claude/CONSTRAINTS.md` holds binding LAWs. When CLAUDE.md, this file, or CONSTRAINTS.md disagree: **CONSTRAINTS.md wins**.

---

## DOUBLE VALIDATION HOOKS

Every hook runs TWICE on failure before blocking:

```
ATTEMPT 1 → FAIL → AUTOMATIC RETRY
ATTEMPT 2 → FAIL → BLOCKED (cannot proceed)
```

This prevents false failures while enforcing strict validation.

### Hook types

| Hook | Purpose | When |
|------|---------|------|
| Persona Hook | Verify persona voice active (if a persona is configured) | Before each phase |
| Read Hook | Verify full file read | Before any edit |
| Line Limit Hook | Verify output correctness | After any write |
| Phase Hook | Verify phase complete | Before proceeding |

---

## `/workflow` PIPELINE

The `/workflow` slash command executes this pipeline:

### Phase -1 — LAW #0 verbatim words check (cannot skip)

- Re-read the user's latest instruction
- Count items in the instruction
- Confirm every noun/verb is preserved in any tasks created
- **Gate -1:** LAW #0 verified

### Phase 0.5 — Timestamp retrieval (cannot skip)

- Execute system-time command (PowerShell `Get-Date` on Windows, `date` on macOS/Linux)
- Lock the timestamp for the session
- **Gate 0.5:** Real system time captured (year ≥ current year)

### Phase 0 — Persona Validation (cannot skip if a persona is configured)

- If a persona slash command was used (e.g. `/<persona-name>`), confirm the agent's voice is active
- If no persona is configured, this gate auto-passes
- **Gate 0.1:** Persona confirmed (if configured) — first-person + project tone in normal speech

### Phase 1 — Environment Check

- Verify working directory
- Check for existing `docs/ARCHITECTURE.md`
- **Gate 1.1:** Mode determination (FIRST_SCAN / WORK_MODE / RESCAN)

### Phase 2 — Codebase Scan (first run only)

- File system scan (glob `**/*`)
- Dependency detection (`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, etc.)
- Config discovery (`.env`, build tools)
- **Gates 2.1, 2.2:** Scan results valid

### Phase 3 — Analysis & Generation

- Pattern recognition, structure mapping
- Generate `docs/ARCHITECTURE.md`, `docs/SKILL_TREE.md`, `docs/TODO.md`, `docs/ROADMAP.md`, `docs/FINALIZED.md`
- **Gates 3.1, 3.2:** All docs valid, no placeholders

### Phase 4 — Work Mode

- Read ALL existing workflow docs (TODO/ARCHITECTURE/SKILL_TREE/ROADMAP/FINALIZED) before any work
- Pick up tasks from `docs/TODO.md`
- Execute with pre/post-edit hooks
- **Gate 4.1:** Work mode ready

### Phase 5 — Finalization

- Update `docs/FINALIZED.md` with completed tasks (verbatim)
- Clean `docs/TODO.md` of completed entries (status flip + move, never delete description)
- **Gate 5.1:** Archive valid, TODO clean

---

## WORKFLOW FILES (`docs/` folder)

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | Codebase structure, patterns, dependencies, system documentation |
| `docs/SKILL_TREE.md` | Capabilities by domain / complexity / priority |
| `docs/TODO.md` | **ACTIVE tasks ONLY** — pending / in-progress work |
| `docs/ROADMAP.md` | Milestones, phases, current status |
| `docs/FINALIZED.md` | **PERMANENT ARCHIVE** — every completed task with full description |
| `docs/NOW.md` | Current session snapshot (optional) |

When updating these files: write out ACTUAL system changes — how things work now, what was added, what changed architecturally. NOT just bumping numbers or adding counts.

All files read in 800-line chunks. Full file must be read before any edit.

---

## TODO.md / FINALIZED.md TASK FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BEFORE WORK: Add task to TODO.md                         │
│    - Task must exist in TODO.md BEFORE any work begins      │
│    - Mark status as "in_progress"                           │
│    - User's verbatim words in the description (LAW #0)      │
├─────────────────────────────────────────────────────────────┤
│ 2. DO THE WORK                                              │
│    - Read files (800-line chunks)                           │
│    - Make changes                                           │
│    - Verify success                                         │
├─────────────────────────────────────────────────────────────┤
│ 3. AFTER WORK: Move to FINALIZED.md                         │
│    - Copy completed task to FINALIZED.md (with details)     │
│    - Verify FINALIZED.md write succeeded                    │
│    - THEN remove from TODO.md                               │
│    - NEVER delete from FINALIZED.md                         │
└─────────────────────────────────────────────────────────────┘
```

### TODO.md rules

- Only unfinished tasks live in TODO.md
- Tasks have status: `pending` or `in_progress`
- When completed → MOVE to FINALIZED.md
- Never delete tasks — always move them
- **Never rewrite TODO from scratch** — edit in place, change status only
- **Never delete task descriptions** — keep the user's verbatim words permanently

### FINALIZED.md rules

- Permanent archive of all completed work
- NEVER delete entries — only APPEND
- Include: task, date, files modified, details, closure notes
- Provides full history of every session

### PRE-WORK HOOK

```
[PRE-WORK HOOK — ATTEMPT 1]
Task: [DESCRIPTION]
TODO.md entry exists: YES/NO (MUST be YES)
Verbatim user quote: YES/NO (required if from user)
Status: pending → in_progress
Gate: PASS/FAIL
```

### POST-WORK HOOK

```
[POST-WORK HOOK — ATTEMPT 1]
Task: [DESCRIPTION]
Completed: YES
FINALIZED.md updated: YES/NO (MUST be YES)
TODO.md cleaned: YES/NO (MUST be YES)
Gate: PASS/FAIL
```

---

## FILE EDIT PROTOCOL

### Before editing ANY file

```
[PRE-EDIT HOOK — ATTEMPT 1]
File: [PATH]
Full file read: YES/NO (MUST be YES)
Lines in file: [NUMBER]
Read method: SINGLE (≤800) / CHUNKED (>800)
Reason for edit: [EXPLANATION]
Status: PASS/FAIL
```

### After editing ANY file

```
[POST-EDIT HOOK — ATTEMPT 1]
File: [PATH]
Edit successful: YES/NO
Lines after edit: [NUMBER]
Status: PASS/FAIL
```

---

## HOOK FAILURE PROTOCOL

When ANY hook fails twice:

```
[HOOK FAILURE — BLOCKED]
Phase: [WHICH PHASE]
Gate: [WHICH GATE]
Attempt 1: FAIL — [REASON]
Attempt 2: FAIL — [REASON]
Status: CANNOT PROCEED
Required action: [WHAT TO DO]
Workflow: HALTED
```

Recovery: fix the issue, re-run the validation, only proceed when PASS.

---

## AGENT FILES REFERENCE

Agents live in `.claude/agents/`. Read on demand when a slash command requires them.

| Agent | Purpose |
|-------|---------|
| `timestamp.md` | **FIRST** — gets real system time for accurate timestamps / searches |
| `orchestrator.md` | Coordinates all phases with hooks |
| `scanner.md` | Scans codebase with validation |
| `architect.md` | Analyzes architecture with hooks |
| `planner.md` | Plans tasks with hierarchy validation |
| `documenter.md` | Generates docs with line limits |
| `coder.md` | Code-handling rules (project-agnostic) |
| `persona-template.md` | Fill-in template for project-specific persona |
| `hooks.md` | Complete hook system reference |

---

## SLASH COMMANDS REFERENCE

Commands live in `.claude/commands/`. Read when the command fires.

| Command | File | Purpose |
|---------|------|---------|
| `/workflow` | `workflow.md` | Run this pipeline |
| `/super-review` | `super-review.md` | **INTERNAL** — ruthless senior-engineer code review of the current branch / files / diff. Treats every line as if it came from a fast LLM and reviews accordingly. Output is severity-tagged ISSUES FOUND (Critical / High / Medium / Low / Nitpick) plus a prioritized FINAL FIX & IMPROVEMENT PLAN. Optional `$ARGUMENTS` narrows the scope to a stated intent; with no arguments, defaults to a full architectural / security / performance / maintainability / clean-code sweep. Internal dev usage only — never wired into any public-facing doc, README, or HTML. |

If your project ships a custom persona slash command (e.g. `/<persona-name>`), it goes here too with a pointer to its activation protocol file.

---

## RESCAN MODE

User must explicitly say "rescan" or "scan again":

```
[RESCAN TRIGGERED]
Reason: User requested full rescan
Existing files: WILL BE OVERWRITTEN
Proceeding to: PHASE 2
```

---

## ADDING NEW PHASES OR HOOKS

If your project needs a phase beyond 0–5 (e.g. a security audit phase, a performance baseline phase, a deployment-prep phase), add it here with:

1. **Phase number** (e.g. `Phase 6 — Security Audit`)
2. **Trigger condition** (always vs only on certain commands)
3. **Pre-hook** with validation gate
4. **Execution steps**
5. **Post-hook** with success criteria
6. **Gate** identifier

Then update the pipeline diagram + the `/workflow` command file to include the new phase.

---

*Workflow template — strict validation, real results.*
