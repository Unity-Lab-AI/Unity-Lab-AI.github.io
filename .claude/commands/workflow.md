# /workflow — Codebase Analysis & Work Pipeline

---

# ⛔⛔⛔ PHASE -1 — LAW #0: VERBATIM WORDS ONLY ⛔⛔⛔

# 🚨 BEFORE TIMESTAMP. BEFORE PERSONA. BEFORE ANYTHING. READ THIS. 🚨

## THE LAW

When the user describes a bug, feature, task, or request — **their words go into the task, TODO, FINALIZED, and docs VERBATIM**. Not paraphrased. Not summarized. Not renamed. Not collapsed. Not shortened. Not "cleaned up."

### Forbidden actions

- ❌ Renaming a bug ("chat freeze" when they said "3D visualization freezes")
- ❌ Collapsing a list into one bullet ("Docs full sync" when they said "workflow, public facing, equation reference, layman docs")
- ❌ Downgrading priority with your own word ("cosmetic" when they never called it that)
- ❌ Dropping words they said ("focal tracking" when they said "face and motion")
- ❌ Substituting a synonym for their specific word
- ❌ Paraphrasing because their phrasing is "informal" or "typo'd"

### Required actions

- ✅ Paste their exact sentence at the top of every task description they generated
- ✅ One task per item in a list, never a bundle
- ✅ Every unique noun and verb they used appears in the task/doc output
- ✅ Re-read their message once more before submitting any task or doc edit
- ✅ If a title must be shortened, the full verbatim quote goes in the body

### Validation gate -1

```
[LAW #0 VERIFIED]
User's last instruction: "[PASTE VERBATIM QUOTE]"
Items in that instruction: [COUNT]
Tasks being created: [COUNT] (must match items)
Nouns/verbs preserved: [LIST]
Any rename/paraphrase detected: NO (must be NO)
Status: PASS
```

**If you cannot print this gate truthfully, DO NOT PROCEED. Re-read the user's message and redo the task list.**

### Failure recovery

When the user catches a LAW #0 violation:
1. STOP immediately
2. Acknowledge and name the specific word/phrase you dropped
3. Fix the task/doc/TODO using their verbatim words
4. Do NOT resume other work until the correction ships

**LAW #0 OVERRIDES every other phase, gate, and rule in this workflow. Fidelity > brevity. Always.**

---

## PHASE 0.5: TIMESTAMP RETRIEVAL (FIRST - BEFORE EVERYTHING)

### HOOK: System Time Capture

**BEFORE ANYTHING ELSE**, retrieve the REAL system time:

**Windows:**
1. Execute: `powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss (dddd)'"`

**macOS / Linux:**
1. Execute: `date +"%Y-%m-%d %H:%M:%S (%A)"`

Then:
2. Parse and store the result
3. This becomes the SESSION timestamp for ALL operations

### WHY THIS EXISTS

Knowledge cutoff dates are outdated. Without this:
- Web searches may use wrong year context
- File timestamps would be inaccurate
- Version lookups could return old info

### VALIDATION GATE 0.5: Timestamp Locked

**REQUIRED FORMAT:**
```
[TIMESTAMP LOCKED]
System datetime: [ACTUAL RESULT FROM SHELL COMMAND]
Year: [EXTRACTED YEAR]
Session ID: SESSION_[YYYYMMDD]_[HHMMSS]
Web search context: Will use [YEAR] for all searches
Status: CAPTURED
```

**FAIL CONDITIONS - RETRY IF:**
- Command execution failed
- Date parsing failed
- Year seems wrong (older than expected)

**DO NOT PROCEED UNTIL VALIDATION GATE 0.5 PASSES**

---

## PHASE 0: PERSONA VALIDATION (Unity is the default — `/unity` + manifestation modes)

### HOOK: Persona Load Check

**Unity persona is activated by slash commands** — `/unity` for default Unity (loads `ImHanddicapped.txt`), or `/girlfriend` / `/housewife` / `/kittycat` for Unity in alternate manifestation forms, plus their alternate-mode commands (`/wild`, `/strict`, `/feral`) and return-to-mode-default commands (`/sweet`, `/cozy`, `/purr`). NOT by re-reading agent files inside `/workflow`. If Unity is already active from a prior slash command (e.g. the launcher fired `/unity then run /workflow`), skip straight to Gate 0.1. Do NOT Read persona files here — they are slash-command activation targets, not workflow inputs.

If Unity is not active, tell the user to run `/unity` first (or one of the manifestation activation commands). Do not attempt to load persona files here.

If the user built a custom handicapped persona via `/template`, the same rule applies — that persona must already be active via its own slash command before `/workflow` runs.

If you've removed the persona system entirely, this phase auto-passes — `/workflow` runs in neutral default voice per `agents/coder.md`.

### VALIDATION GATE 0.1: Persona Confirmation

Just talk in the active persona's voice. A natural in-persona greeting IS the proof. Don't print a boxed "[PERSONA ONLINE]" template — that rigid format is itself a corporate-tone failure.

**PASS =** in-persona voice present in a normal sentence (pet-names, profanity, persona-characteristic vocabulary, physical narration matching whichever persona is active).
**FAIL =** corporate tone, default neutral voice when persona was supposed to be active, or forced template output.

If no persona is configured at all, this gate auto-passes with `Status: N/A`.

**DO NOT PROCEED UNTIL VALIDATION GATE 0.1 PASSES**

---

## PHASE 1: ENVIRONMENT CHECK

### HOOK: Pre-Scan Validation

Before scanning, verify:

1. **Check working directory** - Confirm you're in project root
2. **Check for existing docs** - Look for `docs/ARCHITECTURE.md`

### VALIDATION GATE 1.1: Environment Confirmed

```
[ENV CHECK]
Working directory: [PATH]
docs/ARCHITECTURE.md exists: YES/NO
Mode: FIRST_SCAN / WORK_MODE / RESCAN
```

**ROUTING:**
- If `docs/ARCHITECTURE.md` EXISTS → Skip to PHASE 4 (Work Mode)
- If `docs/ARCHITECTURE.md` DOESN'T EXIST → Continue to PHASE 2
- If user said "rescan" → Continue to PHASE 2 (overwrite mode)

**DO NOT PROCEED UNTIL VALIDATION GATE 1.1 PASSES**

---

## PHASE 2: CODEBASE SCAN (First Run Only)

### HOOK: Pre-Read Validation

**CRITICAL RULE - 800 LINE READ INDEX:**
- Standard read chunk: 800 lines EXACTLY
- Read ALL files in 800-line chunks
- Continue until FULL file is read
- MUST read FULL file before ANY edit
- NO partial reads before editing

### VALIDATION GATE 2.1: Scanner Ready

```
[SCANNER READY]
Persona (if configured): CONFIRMED
Read index: 800 LINES per chunk
Full-file-before-edit rule: ACKNOWLEDGED
Ready to scan: YES
```

### Scan Execution

Run these scans (can be parallel):

1. **File System Scan** - `**/*` glob pattern
2. **Dependency Scan** - package.json, requirements.txt, Cargo.toml, etc.
3. **Config Detection** - .env, config files, build tools

### VALIDATION GATE 2.2: Scan Complete

```
[SCAN COMPLETE]
Total files found: [NUMBER]
Source files: [NUMBER]
Config files: [NUMBER]
Dependencies detected: [LIST]
Entry points: [LIST]
Scan status: COMPLETE
```

**FAIL CONDITIONS - RETRY IF:**
- Total files = 0 (empty scan)
- No source files detected
- Scan threw errors

**DO NOT PROCEED TO PHASE 3 UNTIL VALIDATION GATE 2.2 PASSES**

---

## PHASE 3: ANALYSIS & GENERATION

### HOOK: Pre-Analysis Check

Before generating docs:

1. Confirm scan_results exist
2. Confirm persona still active (if configured)
3. Confirm 800-line read index understood

### VALIDATION GATE 3.1: Analysis Ready

```
[ANALYSIS READY]
Scan results: LOADED
Persona check (if configured): [confirmation]
Read index: 800 lines per chunk
Proceeding to generate: YES
```

### Generate These Files (in `docs/`):

1. **docs/ARCHITECTURE.md** - Structure, patterns, dependencies, tech stack
2. **docs/SKILL_TREE.md** - Capabilities by domain/complexity/priority
3. **docs/TODO.md** - Tiered tasks (Epic > Story > Task) with P1/P2/P3
4. **docs/ROADMAP.md** - High-level milestones and phases

**GENERATION RULES:**
- Use configured voice (or neutral default) in ALL files
- Include actual findings, not placeholders
- Read any existing files using 800-line index before editing

### VALIDATION GATE 3.2: Generation Complete

```
[GENERATION COMPLETE]
ARCHITECTURE.md: CREATED [LINE_COUNT] lines
SKILL_TREE.md: CREATED [LINE_COUNT] lines
TODO.md: CREATED [LINE_COUNT] lines
ROADMAP.md: CREATED [LINE_COUNT] lines
800-line read index used: YES
Voice consistent: YES
```

**FAIL CONDITIONS - FIX AND RETRY IF:**
- Any file missing
- Voice drift detected (if persona configured)
- Placeholder text like {{VARIABLE}} remains
- Did not use 800-line read index for existing files

**DO NOT PROCEED TO PHASE 4 UNTIL VALIDATION GATE 3.2 PASSES**

---

## PHASE 4: WORK MODE

### HOOK: Work Mode Entry Check

Before starting work, you MUST read ALL of these files using the Read tool. No skipping. No shortcuts. No "I already know what's in them."

1. **Read docs/TODO.md** — Active work list
2. **Read docs/ARCHITECTURE.md** — Codebase structure
3. **Read docs/SKILL_TREE.md** — Capabilities
4. **Read docs/ROADMAP.md** — Milestones and phases
5. **Read docs/FINALIZED.md** — Completed work archive
6. **Confirm understanding of current state**
7. **Identify what needs doing**

DO NOT output the Work Mode Ready gate until ALL 5 files have been read with the Read tool.

### VALIDATION GATE 4.1: Work Mode Ready

```
[WORK MODE ACTIVE]
TODO.md read: YES - [SUMMARY OF TOP PRIORITIES]
ARCHITECTURE.md read: YES - [KEY SYSTEMS IDENTIFIED]
SKILL_TREE.md read: YES - [DOMAINS NOTED]
ROADMAP.md read: YES - [CURRENT PHASE IDENTIFIED]
FINALIZED.md read: YES - [LATEST SESSION NOTED]
Persona (if configured): STILL ACTIVE
Ready to work: YES
```

### Work Mode Rules

**BEFORE EDITING ANY FILE:**
```
[PRE-EDIT HOOK]
File: [PATH]
Total lines: [NUMBER]
Read chunk size: 800 lines
Chunks needed: [CEIL(TOTAL/800)]
Full file read: YES (MANDATORY)
Reason for edit: [EXPLANATION]
Proceeding: YES
```

**AFTER EDITING ANY FILE:**
```
[POST-EDIT HOOK]
File: [PATH]
Edit successful: YES/NO
Lines after edit: [NUMBER]
TODO.md updated: YES/NO (if applicable)
```

### Your Job:
- Pick up tasks from `docs/TODO.md`
- Update `docs/TODO.md` as you complete work
- Update other workflow files when things change
- Stay in configured voice (if persona active)
- Actually do the work, don't just plan it

### When Working:
- Mark tasks `[~]` in_progress when you start
- Mark tasks `[x]` completed when done
- Add new tasks you discover
- Keep files in sync with reality

---

## PHASE 5: SESSION END (Optional)

### HOOK: Session Summary

When ending a work session:

```
[SESSION SUMMARY]
Tasks completed: [LIST]
Tasks in progress: [LIST]
Files modified: [LIST]
New issues found: [LIST]
Persona signing off (if configured): [VOICE-CONFIRMING LINE]
```

---

## RESCAN MODE

### HOOK: Rescan Trigger

User must explicitly say "rescan" or "scan again"

```
[RESCAN TRIGGERED]
Reason: User requested full rescan
Existing files: WILL BE OVERWRITTEN
Proceeding to: PHASE 2
```

---

## HOOK FAILURE PROTOCOL

If ANY validation gate fails:

1. **STOP** - Do not proceed
2. **REPORT** - State which gate failed and why
3. **FIX** - Address the issue
4. **RETRY** - Re-run the validation gate
5. **ONLY PROCEED** when gate passes

```
[HOOK FAILURE]
Gate: [WHICH GATE]
Reason: [WHY IT FAILED]
Fix required: [WHAT NEEDS TO HAPPEN]
Status: BLOCKED UNTIL FIXED
```

---

## CRITICAL RULES SUMMARY

| Rule | Enforcement |
|------|-------------|
| LAW #0 verbatim words | Gate -1 blocks all task creation |
| Persona (if configured) MUST be active | Gate 0.1 blocks all progress |
| 800-line read index | All file reads use 800-line chunks |
| Full file read before edit | Pre-Edit Hook (MANDATORY) |
| All hooks must pass | Failure Protocol triggers |
| Verbatim words in every task | LAW #0 — no paraphrasing |

---

**BEGIN NOW** - Start with PHASE -1: LAW #0 VERBATIM CHECK
