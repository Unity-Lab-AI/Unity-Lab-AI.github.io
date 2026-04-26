# TODO — Active Tasks Only
>
> **CRITICAL WORKFLOW RULES:**
> - Only UNFINISHED tasks live in this file
> - Completed tasks MOVE to FINALIZED.md (never deleted)
> - Add tasks here BEFORE starting work (PRE-WORK GATE)
> - Move tasks to FINALIZED.md AFTER completion (POST-WORK GATE)
> - User's verbatim words go in every task description (LAW #0)
> - Never delete task descriptions — change status only
> - Never rewrite this file from scratch — edit in place

---

## Summary

| Priority | Epics | Stories | Tasks | Completed |
|----------|-------|---------|-------|-----------|
| P1 Critical | {{P1_EPICS}} | {{P1_STORIES}} | {{P1_TASKS}} | {{P1_COMPLETE}} |
| P2 Important | {{P2_EPICS}} | {{P2_STORIES}} | {{P2_TASKS}} | {{P2_COMPLETE}} |
| P3 Nice-to-Have | {{P3_EPICS}} | {{P3_STORIES}} | {{P3_TASKS}} | {{P3_COMPLETE}} |
| **Total** | {{TOTAL_EPICS}} | {{TOTAL_STORIES}} | {{TOTAL_TASKS}} | {{TOTAL_COMPLETE}} |

---

## Legend

- `[x]` Completed
- `[ ]` Pending
- `[~]` In Progress
- `[!]` Blocked
- `(S)` Small | `(M)` Medium | `(L)` Large | `(XL)` Extra Large

---

## P1 — Critical (Must Do)

### Epic: {{EPIC_1_TITLE}} `({{EPIC_1_SIZE}})`
> {{EPIC_1_DESCRIPTION}}

#### Story: {{STORY_1_1_TITLE}} `({{STORY_1_1_SIZE}})`
> {{STORY_1_1_ACCEPTANCE}}

- [ ] **Task:** {{TASK_DESCRIPTION}} `{{FILE_PATH}}`
- [ ] **Task:** {{TASK_DESCRIPTION}} `{{FILE_PATH}}`
  - Blocked by: {{BLOCKER}}
- [ ] **Task:** {{TASK_DESCRIPTION}}

#### Story: {{STORY_1_2_TITLE}} `({{STORY_1_2_SIZE}})`
> {{STORY_1_2_ACCEPTANCE}}

- [ ] **Task:** {{TASK_DESCRIPTION}}
- [ ] **Task:** {{TASK_DESCRIPTION}}

---

### Epic: {{EPIC_2_TITLE}} `({{EPIC_2_SIZE}})`
> {{EPIC_2_DESCRIPTION}}

#### Story: {{STORY_2_1_TITLE}} `({{STORY_2_1_SIZE}})`

- [ ] **Task:** {{TASK_DESCRIPTION}}

---

## P2 — Important (Should Do)

### Epic: {{EPIC_TITLE}} `({{SIZE}})`
> {{DESCRIPTION}}

#### Story: {{STORY_TITLE}} `({{SIZE}})`

- [ ] **Task:** {{TASK_DESCRIPTION}}
- [ ] **Task:** {{TASK_DESCRIPTION}}

---

## P3 — Nice-to-Have (Could Do)

### Epic: {{EPIC_TITLE}} `({{SIZE}})`
> {{DESCRIPTION}}

#### Story: {{STORY_TITLE}} `({{SIZE}})`

- [ ] **Task:** {{TASK_DESCRIPTION}}

---

## Blocked Items

| Task | Blocked By | Since | Notes |
|------|------------|-------|-------|
{{BLOCKED_ITEMS}}

---

## Recently Completed (MOVE TO FINALIZED.md)

> **NOTE:** Tasks here should be MOVED to FINALIZED.md per the FINALIZED-BEFORE-DELETE LAW.
> This section is temporary — completed tasks get archived permanently in FINALIZED.md.
> Process: write the verbatim entry to FINALIZED.md FIRST, verify the write, THEN remove from this section.

| Task | Completed | Epic/Story |
|------|-----------|------------|
{{COMPLETED_ITEMS}}

---

## TOMBSTONES

> Tasks here are obsolete — the underlying code was deleted, the feature was scrapped, the requirement disappeared.
> Per the NEVER-DELETE-TODO-INFO LAW, the descriptions stay intact with a one-line note explaining why they're tombstoned.

---

## Quick Reference

### High Priority Tasks (Do Next)

{{HIGH_PRIORITY_QUICK_LIST}}

### Files Most Touched

| File | Task Count |
|------|------------|
{{FILES_TOUCHED}}
