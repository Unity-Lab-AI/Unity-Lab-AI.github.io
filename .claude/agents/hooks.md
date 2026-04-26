# HOOKS — Validation & Gate System

> *Double-validation on all failures*

---

## CRITICAL RULE: DOUBLE VALIDATION ON FAILURE

Every hook runs TWICE on failure before blocking:

```
ATTEMPT 1 → FAIL → RETRY
ATTEMPT 2 → FAIL → BLOCKED (Cannot proceed)
```

This prevents false failures while still enforcing strict validation.

---

## HOOK TYPES

| Hook Type | When | Purpose |
|-----------|------|---------|
| **PRE-HOOK** | Before phase starts | Validate prerequisites |
| **POST-HOOK** | After phase completes | Validate results |
| **EDIT-HOOK** | Before/after file edits | Enforce read-before-edit |
| **PERSONA-HOOK** | Throughout workflow (if persona configured) | Verify persona voice active |
| **LINE-HOOK** | On file operations | Enforce 800-line limit |

---

## HOOK EXECUTION PATTERN

```
┌─────────────────────────────────────┐
│         HOOK EXECUTION              │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────┐                    │
│  │  ATTEMPT 1  │                    │
│  └──────┬──────┘                    │
│         │                           │
│         ▼                           │
│    ┌─────────┐                      │
│    │  PASS?  │──YES──► PROCEED      │
│    └────┬────┘                      │
│         │NO                         │
│         ▼                           │
│  ┌─────────────┐                    │
│  │  ATTEMPT 2  │ (Automatic retry)  │
│  └──────┬──────┘                    │
│         │                           │
│         ▼                           │
│    ┌─────────┐                      │
│    │  PASS?  │──YES──► PROCEED      │
│    └────┬────┘                      │
│         │NO                         │
│         ▼                           │
│    ┌──────────┐                     │
│    │ BLOCKED  │ (Cannot proceed)    │
│    └──────────┘                     │
│                                     │
└─────────────────────────────────────┘
```

---

## PERSONA VALIDATION HOOK (only if persona configured)

### Purpose
Ensures the configured project persona is loaded and active before ANY work begins.

### Trigger Points
- Workflow start (MANDATORY if persona configured)
- Before each phase (verification)
- After extended operations (re-check)

### Validation Criteria

```
[PERSONA HOOK - ATTEMPT 1]
Check: Response uses configured voice
Check: Response contains expected personality markers
Check: No off-brand language detected
Result: PASS/FAIL
```

If no persona is configured, this hook auto-passes with `Status: N/A (no persona configured)`.

### Double Validation

```
[PERSONA HOOK - ATTEMPT 1]
Response: "I am ready to assist you."
Expected: Project's configured voice (e.g. terse / playful / formal / etc.)
Result: FAIL - Default tone detected when persona was active

[PERSONA HOOK - ATTEMPT 2]
Action: Re-read the persona file at .claude/agents/<persona>.md
Action: Generate new response in configured voice
Result: PASS
```

**IF ATTEMPT 2 FAILS:**
```
[PERSONA HOOK - BLOCKED]
Status: Cannot proceed with persona drift
Action required: Manual intervention or persona reset
Workflow: HALTED
```

---

## READ-BEFORE-EDIT HOOK

### Purpose
Ensures full file is read before ANY edit operation.

### Trigger Points
- Before every Edit tool call
- Before every Write tool call (if file exists)

### Validation Criteria

```
[READ-BEFORE-EDIT HOOK - ATTEMPT 1]
File: [PATH]
File exists: YES/NO
If YES:
  - Full file read completed: YES/NO
  - Lines read: [NUMBER]
  - Read method: SINGLE (≤800) / CHUNKED (>800)
Result: PASS/FAIL
```

### Pass Conditions
- New file (doesn't exist) → Auto-pass
- Existing file fully read → Pass
- File >800 lines read in complete chunks → Pass

### Fail Conditions
- Existing file not read → FAIL
- Partial read of existing file → FAIL
- Edit attempted without read → FAIL

### Double Validation

```
[READ-BEFORE-EDIT HOOK - ATTEMPT 1]
File: src/main.js
Full file read: NO
Result: FAIL - Must read file before editing

[READ-BEFORE-EDIT HOOK - ATTEMPT 2]
Action: Read full file now
File: src/main.js
Lines: 450
Full file read: YES
Result: PASS - Proceeding with edit
```

**IF ATTEMPT 2 FAILS:**
```
[READ-BEFORE-EDIT HOOK - BLOCKED]
Status: Cannot edit without reading
File: [PATH]
Action required: Read file first
Edit: CANCELLED
```

---

## 800-LINE READ INDEX HOOK

### Purpose
Enforces the 800-line READ standard for all file operations. 800 lines = standard read/index chunk size (not file length limit).

### The 800-Line Read Rule
- Read chunk size: EXACTLY 800 lines
- Continue reading until FULL file is consumed
- MUST read full file before ANY edit
- This is a read index, not a file length restriction

### Trigger Points
- Before every file read
- Before every file edit (must read first)
- During any file operation

### Validation Criteria

```
[READ-INDEX HOOK - ATTEMPT 1]
File: [PATH]
Total lines in file: [NUMBER]
Read chunk size: 800 lines
Chunks needed: [CEIL(TOTAL/800)]
Full file read: YES/NO
Result: PASS/FAIL
```

### Double Validation

```
[READ-INDEX HOOK - ATTEMPT 1]
File: src/main.js
Total lines: 1247
Read chunk size: 800
Chunks needed: 2 (800 + 447)
Full file read: NO - Only read first chunk
Result: FAIL - Must read full file

[READ-INDEX HOOK - ATTEMPT 2]
Action: Read remaining chunks
Chunk 1: Lines 1-800 ✓
Chunk 2: Lines 801-1247 ✓
Full file read: YES
Result: PASS - Full file consumed
```

**IF ATTEMPT 2 FAILS:**
```
[READ-INDEX HOOK - BLOCKED]
Status: Cannot proceed without full file read
File: [PATH]
Total lines: [NUMBER]
Lines read: [NUMBER]
Remaining: [NUMBER]
Action required: Read all remaining 800-line chunks
Operation: BLOCKED
```

---

## SCAN COMPLETION HOOK

### Purpose
Validates codebase scan completed successfully.

### Validation Criteria

```
[SCAN HOOK - ATTEMPT 1]
Files discovered: [NUMBER] (must be > 0)
Source files found: YES/NO (must be YES)
Critical errors: [LIST] (must be empty)
Scan data stored: YES/NO (must be YES)
Result: PASS/FAIL
```

### Double Validation

```
[SCAN HOOK - ATTEMPT 1]
Files discovered: 0
Result: FAIL - Empty scan

[SCAN HOOK - ATTEMPT 2]
Action: Re-run scan with broader patterns
Files discovered: 127
Source files: 89
Result: PASS - Scan successful
```

---

## ANALYSIS COMPLETION HOOK

### Validation Criteria

```
[ANALYSIS HOOK - ATTEMPT 1]
Patterns identified: [NUMBER] (must be ≥ 1)
Structure mapped: YES/NO
Complexity rated: YES/NO
Results coherent: YES/NO
Result: PASS/FAIL
```

---

## PLANNING COMPLETION HOOK

### Validation Criteria

```
[PLANNING HOOK - ATTEMPT 1]
Epics created: [NUMBER] (must be ≥ 1)
Stories created: [NUMBER] (must be ≥ 1)
Tasks created: [NUMBER] (must be ≥ 1)
All prioritized: YES/NO
Hierarchy valid: YES/NO
Result: PASS/FAIL
```

---

## DOCUMENTATION COMPLETION HOOK

### Validation Criteria

```
[DOCUMENTATION HOOK - ATTEMPT 1]
ARCHITECTURE.md exists: YES/NO
SKILL_TREE.md exists: YES/NO
TODO.md exists: YES/NO
ROADMAP.md exists: YES/NO
All ≤ 800 lines: YES/NO
No {{PLACEHOLDERS}}: YES/NO
Persona voice (if configured): YES/NO
Result: PASS/FAIL
```

---

## HOOK OUTPUT FORMAT

All hooks MUST output in this format:

### On Pass (Attempt 1)
```
[HOOK_NAME - ATTEMPT 1]
Checks performed: [LIST]
Result: PASS
Proceeding to: [NEXT_STEP]
```

### On Fail (Attempt 1) → Retry
```
[HOOK_NAME - ATTEMPT 1]
Checks performed: [LIST]
Failed check: [WHICH ONE]
Result: FAIL
Action: AUTOMATIC RETRY

[HOOK_NAME - ATTEMPT 2]
Remediation: [WHAT WAS FIXED]
Checks performed: [LIST]
Result: PASS/FAIL
```

### On Blocked (Both Attempts Failed)
```
[HOOK_NAME - BLOCKED]
Attempt 1: FAIL - [REASON]
Attempt 2: FAIL - [REASON]
Status: CANNOT PROCEED
Required action: [WHAT USER MUST DO]
Workflow status: HALTED
```

---

## HOOK CHAIN FOR FULL WORKFLOW

```
/workflow triggered
    │
    ▼
[LAW #0 VERBATIM HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[TIMESTAMP HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[PERSONA HOOK if configured] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[ENV CHECK HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[SCAN HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[ANALYSIS HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[PLANNING HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[DOCUMENTATION HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[LINE-LIMIT HOOK] ──FAIL×2──► BLOCKED
    │PASS
    ▼
[FINAL VALIDATION HOOK]
    │PASS
    ▼
WORKFLOW COMPLETE
```

---

## EDITING FILES — FULL HOOK SEQUENCE

Every file edit goes through this sequence:

```
1. [READ-BEFORE-EDIT HOOK]
   - Attempt 1: Check if file was read
   - Attempt 2 (if fail): Read file now
   - Block if still fail

2. Perform Edit

3. [LINE-LIMIT HOOK]
   - Attempt 1: Check line count
   - Attempt 2 (if fail): Truncate/fix
   - Block if still fail

4. [POST-EDIT VALIDATION]
   - Confirm edit successful
   - Confirm file integrity
```

---

## SUMMARY: DOUBLE VALIDATION RULES

| Rule | Enforcement |
|------|-------------|
| Every hook gets 2 attempts | Automatic retry on first failure |
| Blocked only after 2 fails | Prevents false positives |
| Persona checked repeatedly (if configured) | Voice must persist |
| 800 lines enforced always | Truncate on second attempt |
| Read before edit always | Auto-read on second attempt |
| All gates must pass | Workflow halts on block |

---

## NO TESTS POLICY

Per `CONSTRAINTS.md §NO TESTS POLICY` — code it right the first time. No unit tests, no integration tests, no test tasks in TODO. Manual verification > automated testing.

---

## TODO.md / FINALIZED.md WORKFLOW HOOK

### Purpose
Ensures proper task tracking with TODO.md for active tasks and FINALIZED.md as permanent archive.

### CRITICAL RULES

| Rule | Enforcement | Gate |
|------|-------------|------|
| **Add to TODO.md BEFORE work** | MANDATORY | PRE-WORK GATE |
| **Move to FINALIZED.md AFTER work** | MANDATORY | POST-WORK GATE |
| **Never delete from FINALIZED.md** | ABSOLUTE | ARCHIVE INTEGRITY |
| **Only unfinished in TODO.md** | MANDATORY | TODO PURITY |
| **Verbatim user words in task** | ABSOLUTE | LAW #0 |
| **Never delete TODO descriptions** | ABSOLUTE | TODO INTEGRITY |

### PRE-WORK GATE

**Purpose:** Ensure task is tracked BEFORE any work begins

```
[PRE-WORK HOOK - ATTEMPT 1]
Task: [TASK_DESCRIPTION]
TODO.md Entry Exists: YES/NO
Status in TODO.md: pending/in_progress
Verbatim user quote in description: YES/NO
Action Required: [ADD_TO_TODO / MARK_IN_PROGRESS / PROCEED]
Gate Status: PASS/FAIL
```

**Enforcement:**
- FAIL if task not in TODO.md → Add task first (with verbatim words)
- FAIL if task not marked in_progress → Update status first
- FAIL if user words paraphrased → Restore verbatim quote
- PASS only when task exists AND is in_progress AND uses verbatim text

### POST-WORK GATE

**Purpose:** Move completed tasks to FINALIZED.md (FINALIZED before DELETE)

```
[POST-WORK HOOK - ATTEMPT 1]
Task: [TASK_DESCRIPTION]
Work Completed: YES/NO
Files Modified: [LIST]
FINALIZED.md updated FIRST: YES/NO
FINALIZED.md write verified: YES/NO
ONLY THEN: Remove from TODO.md: YES/NO
Gate Status: PASS/FAIL
```

**Enforcement:**
- FAIL if completed task removed from TODO before FINALIZED entry exists
- FAIL if FINALIZED entry missing the verbatim task description
- PASS only when FINALIZED has the entry AND the entry is verified AND TODO entry then removed

### TODO.md FORMAT

```markdown
# TODO - Active Tasks Only

## IN PROGRESS
- [~] Task description (verbatim user quote inline) | Started: [TIMESTAMP]

## PENDING
- [ ] Task description (verbatim user quote inline) | Added: [TIMESTAMP]
```

**Rules:**
- Only unfinished tasks live here
- Tasks marked completed are MOVED to FINALIZED.md
- Never delete — always move

### FINALIZED.md FORMAT

```markdown
# FINALIZED - Completed Tasks Archive

## [DATE] Session: [SESSION_LABEL]

### COMPLETED
- [x] **Verbatim task description from user**
  - Completed: [TIMESTAMP]
  - Files: [LIST_OF_FILES_MODIFIED]
  - Details: [WHAT_WAS_DONE]

### SESSION SUMMARY
Tasks completed: [COUNT]
Files modified: [LIST]
```

**Rules:**
- NEVER delete entries from this file
- All completed tasks are APPENDED here
- Provides full history of all work done

### Double Validation

```
[PRE-WORK HOOK - ATTEMPT 1]
Task: Fix bug in checkout flow
TODO.md Entry: NOT FOUND
Result: FAIL - Task not in TODO.md

[PRE-WORK HOOK - ATTEMPT 2]
Action: Adding task to TODO.md now
TODO.md Entry: ADDED (with verbatim user quote)
Status: in_progress
Result: PASS - Proceeding with work
```

**IF ATTEMPT 2 FAILS:**
```
[PRE-WORK HOOK - BLOCKED]
Task: [TASK_DESCRIPTION]
TODO.md: STILL NOT UPDATED
Status: CANNOT PROCEED
Required: Must add task to TODO.md first (with verbatim user words)
Workflow: HALTED
```

---

*Hooks — double-check everything, trust nothing, ship it anyway.*
