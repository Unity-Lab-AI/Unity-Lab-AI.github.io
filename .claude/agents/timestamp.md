# Timestamp Retrieval Agent

Retrieves and stores the REAL system time for accurate timestamps and web searches.

---

## PURPOSE

Knowledge cutoff dates are outdated. This agent ensures:
- All workflow files use ACTUAL current date/time
- Web searches use correct year/date context
- Documentation timestamps are accurate
- No more searching for stale years when the calendar has moved on

---

## RETRIEVAL COMMAND

**Windows (PowerShell):**

```powershell
powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss (dddd)'"
```

**macOS / Linux:**

```bash
date +"%Y-%m-%d %H:%M:%S (%A)"
```

**Alternative formats available (Windows):**

```powershell
# Full timestamp with timezone
powershell -Command "Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'"

# Date only
powershell -Command "Get-Date -Format 'yyyy-MM-dd'"

# Time only
powershell -Command "Get-Date -Format 'HH:mm:ss'"

# Unix timestamp
powershell -Command "[int](Get-Date -UFormat %s)"
```

**Alternative formats available (macOS / Linux):**

```bash
# ISO with timezone
date +"%Y-%m-%dT%H:%M:%S%z"

# Date only
date +"%Y-%m-%d"

# Time only
date +"%H:%M:%S"

# Unix timestamp
date +"%s"
```

---

## TIMESTAMP CONTEXT BLOCK

After retrieval, store this context for the session:

```
[TIMESTAMP CONTEXT]
Retrieved: [ACTUAL DATETIME FROM SYSTEM]
Year: [YEAR]
Month: [MONTH]
Day: [DAY]
Weekday: [DAY OF WEEK]
Time: [HH:MM:SS]
Timezone: [SYSTEM TIMEZONE]
Status: LOCKED FOR SESSION
```

---

## USAGE IN WORKFLOW

### Phase 0.5: Timestamp Retrieval (Before Persona, After LAW #0 Verbatim Check)

Insert BEFORE Phase 0 in workflow:

```
[PHASE 0.5: TIMESTAMP RETRIEVAL]

1. Execute the system-time command for your OS
2. Parse result
3. Store in context
4. Confirm retrieval

[TIMESTAMP LOCKED]
System time: [RESULT]
Using for: All file timestamps, web searches, documentation
```

---

## WEB SEARCH INSTRUCTIONS

When performing web searches, ALWAYS use the retrieved timestamp:

**CORRECT:**
```
Search: "React hooks best practices [CURRENT YEAR]"
Search: "Node.js [CURRENT MAJOR] features [CURRENT MONTH] [CURRENT YEAR]"
```

**INCORRECT:**
```
Search: "React hooks best practices"   ← May get old results
Search: "Node.js features"             ← No date context
```

---

## FILE TIMESTAMP FORMAT

All generated workflow files should include:

```markdown
---
Generated: [YYYY-MM-DD HH:MM:SS]
System: Workflow pipeline
Session: [TIMESTAMP_ID]
---
```

---

## VALIDATION GATE 0.5: Timestamp Confirmed

```
[GATE 0.5: TIMESTAMP VALIDATION]
Command executed: YES/NO
System time retrieved: [DATETIME]
Year is current: YES/NO
Stored for session: YES/NO
Gate status: PASS/FAIL
```

**FAIL CONDITIONS:**
- Command failed to execute
- Retrieved date is clearly wrong (year doesn't match expected window)
- Failed to parse output

---

## INTEGRATION POINTS

| Location | Usage |
|----------|-------|
| ARCHITECTURE.md header | `Generated: [TIMESTAMP]` |
| SKILL_TREE.md header | `Generated: [TIMESTAMP]` |
| TODO.md header | `Last updated: [TIMESTAMP]` |
| ROADMAP.md header | `Last updated: [TIMESTAMP]` |
| FINALIZED.md session entry | `[YYYY-MM-DD] — Session: [LABEL]` |
| Web searches | Year/month context |
| Version checks | Current versions |

---

## SESSION TIMESTAMP ID

Generate a unique session ID:

```
SESSION_[YYYYMMDD]_[HHMMSS]
```

Example: `SESSION_20260424_214934`

Use this to track which session generated which files.

---

## QUICK REFERENCE

```
GET TIME (Windows):  powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"
GET TIME (Unix):     date +"%Y-%m-%d %H:%M:%S"
STORE:               [TIMESTAMP CONTEXT] block
USE:                 In all file headers, web searches
VALIDATE:            Gate 0.5 before proceeding
```

---

*Real time, not training-data time.*
