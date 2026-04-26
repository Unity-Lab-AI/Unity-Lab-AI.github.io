# FINALIZED — Workflow Completion Summary + Permanent Task Archive


## Execution Summary

| Metric | Value |
|--------|-------|
| **Workflow Started** | {{START_TIME}} |
| **Workflow Completed** | {{END_TIME}} |
| **Total Duration** | {{DURATION}} |
| **Files Scanned** | {{FILES_SCANNED}} |
| **Lines Analyzed** | {{LINES_ANALYZED}} |
| **Agents Executed** | {{AGENTS_RUN}} |

---

## Generated Files

| File | Status | Location |
|------|--------|----------|
| ARCHITECTURE.md | {{ARCH_STATUS}} | `docs/ARCHITECTURE.md` |
| SKILL_TREE.md | {{SKILL_STATUS}} | `docs/SKILL_TREE.md` |
| TODO.md | {{TODO_STATUS}} | `docs/TODO.md` |
| ROADMAP.md | {{ROADMAP_STATUS}} | `docs/ROADMAP.md` |
| FINALIZED.md | Generated | `docs/FINALIZED.md` |

---

## Key Findings

### Architecture

{{ARCHITECTURE_SUMMARY}}

### Complexity Assessment

| Level | Count | Percentage |
|-------|-------|------------|
| Low | {{LOW_COMPLEXITY}} | {{LOW_PCT}}% |
| Medium | {{MED_COMPLEXITY}} | {{MED_PCT}}% |
| High | {{HIGH_COMPLEXITY}} | {{HIGH_PCT}}% |
| Critical | {{CRIT_COMPLEXITY}} | {{CRIT_PCT}}% |

### Technical Debt Identified

{{TECH_DEBT_SUMMARY}}

---

## Task Breakdown

### By Priority

| Priority | Epics | Stories | Tasks |
|----------|-------|---------|-------|
| P1 Critical | {{P1_EPICS}} | {{P1_STORIES}} | {{P1_TASKS}} |
| P2 Important | {{P2_EPICS}} | {{P2_STORIES}} | {{P2_TASKS}} |
| P3 Nice-to-Have | {{P3_EPICS}} | {{P3_STORIES}} | {{P3_TASKS}} |
| **Total** | {{TOTAL_EPICS}} | {{TOTAL_STORIES}} | {{TOTAL_TASKS}} |

### Top Priority Items

{{TOP_PRIORITY_ITEMS}}

---

## Skills Analysis

### Domains Identified

{{DOMAINS_LIST}}

### Skill Gaps

{{SKILL_GAPS}}

### Recommended Learning Path

{{LEARNING_PATH}}

---

## Recommendations

### Immediate Actions (Do Now)

{{IMMEDIATE_RECOMMENDATIONS}}

### Short-Term Improvements

{{SHORT_TERM_RECOMMENDATIONS}}

### Long-Term Considerations

{{LONG_TERM_RECOMMENDATIONS}}

---

## Warnings & Concerns

{{WARNINGS}}

---

## Merge Report

{{#IF MERGE_MODE}}
### Files Merged

| File | New Items | Updated Items | Conflicts |
|------|-----------|---------------|-----------|
{{MERGE_REPORT}}

### Conflict Resolution

{{CONFLICTS}}
{{/IF}}

{{#IF NOT MERGE_MODE}}
*Fresh generation — no merge required*
{{/IF}}

---

## Agent Execution Log

| Phase | Agent | Status | Duration |
|-------|-------|--------|----------|
| Scan | Scanner | {{SCAN_STATUS}} | {{SCAN_DURATION}} |
| Analyze | Architect | {{ANALYZE_STATUS}} | {{ANALYZE_DURATION}} |
| Plan | Planner | {{PLAN_STATUS}} | {{PLAN_DURATION}} |
| Document | Documenter | {{DOC_STATUS}} | {{DOC_DURATION}} |
| Finalize | Auto | Complete | {{FINAL_DURATION}} |

---

## Next Steps

1. {{NEXT_STEP_1}}
2. {{NEXT_STEP_2}}
3. {{NEXT_STEP_3}}

---

## Quick Start Commands

```bash
# View architecture
cat docs/ARCHITECTURE.md

# Check tasks
cat docs/TODO.md

# See roadmap
cat docs/ROADMAP.md

# Re-run workflow (merge mode)
/workflow
```

---

# ═══════════════════════════════════════════════════════════════
# COMPLETED TASKS ARCHIVE — NEVER DELETE, ONLY APPEND
# ═══════════════════════════════════════════════════════════════

> **CRITICAL:** This section is a PERMANENT ARCHIVE.
> - All completed tasks are moved here from TODO.md
> - NEVER delete entries — only APPEND
> - Provides full history of all work done
> - Per FINALIZED-BEFORE-DELETE LAW: write the entry here FIRST, verify, THEN remove from TODO.md

---

## COMPLETED TASKS LOG

### Format for each session:

```markdown
## [DATE] — Session: [SESSION_NAME]

### COMPLETED
- [x] **Verbatim task description from user (LAW #0 — paste exact words)**
  - Completed: [TIMESTAMP]
  - Files: [LIST_OF_FILES_MODIFIED]
  - Details: [WHAT_WAS_DONE]

### SESSION SUMMARY
Tasks completed: [COUNT]
Files modified: [LIST]
Notes: [ANYTHING WORTH RECORDING]
```
