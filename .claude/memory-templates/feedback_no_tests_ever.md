---
name: LAW — No tests ever
description: Code it right the first time. Read the code, understand the system, verify by reading output. Manual verification > automated testing. Don't write test files. Don't add test commands. Don't suggest a test suite.
type: feedback
---

This project does not write tests. Period.

**The rule:**
- No `*.test.ts`, `*_test.go`, `test_*.py`, etc.
- No `npm test`, `pytest`, `go test` invocations as part of the workflow
- No "we should add tests" suggestions in PRs or commits
- Verification happens via reading the code, understanding the system, running the actual feature, and reading the output

**Why:** The user explicitly chose this approach. Tests in this project consistently rotted, hid bugs, or shifted attention away from getting the code right the first time. The discipline is to understand what you're writing well enough to ship it correct — not to write tests as a safety net for code you don't fully understand.

**How to apply:**
- Don't generate test files
- Don't add test runners to the workflow
- Don't suggest "let's add coverage" or "we should write a test for this edge case"
- DO read the full file before editing (LAW — 800-line read)
- DO trace through the system, identify call sites, confirm the change works
- DO run the actual feature in the actual environment and verify behavior by reading output
- DO check edge cases manually by reasoning about them and reading the code
- If the project specifically wants tests for some component, override this LAW in that project's CLAUDE.md with explicit reasoning. Default = no tests.
- Full LAW body in `.claude/CONSTRAINTS.md §NO TESTS POLICY`
