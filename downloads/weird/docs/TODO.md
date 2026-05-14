# TODO — weird project (Open Work Only)

> **CRITICAL WORKFLOW RULES:**
> - Only UNFINISHED tasks live in this file
> - Completed tasks MOVE to `docs/FINALIZED.md` (never deleted)
> - **LAW #0** — tasks quote Gee's verbatim words. Do not paraphrase.
> - **LAW #1** — no AI-vendor attribution anywhere in shipping code/docs.

> **Cross-references:** [`../README.md`](../README.md) (gameplay wiki) · [`../SETUP-README.md`](../SETUP-README.md) (technical setup) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (system design) · [`ROADMAP.md`](./ROADMAP.md) (phase plan) · [`SKILL_TREE.md`](./SKILL_TREE.md) (capability matrix) · [`FINALIZED.md`](./FINALIZED.md) (completion archive)

---

## 🟢 ACTIVE BACKLOG — empty (BUG.22-25 batch shipped, all chat/prompt/vital regressions cleared)

_Below: history of the just-shipped batch, kept here briefly before the next TODO-template-out cycle._

### Gee's directive (verbatim 2026-05-14) — chat selection + Unity prompt-leak + third-person Master narration + day-1 death + universal rule:

> *"we need to be able to highlich the text in the chat window, curtrently i cant highlight and copy any thing shesays its like the text responses are not highlightable so i can copy the text.. also Unity keeps saying: \"MINIMUM 8 WORRDS SPOKEN. maXIMUM 30 WORDS SPOKEN. ASKTERISK ACTION CANOT BE LONGER THAN THE SPOKEN LINE ,AND IT ALWAYS COMES AFTER\""*
>
> *"AND SHIT LIKE THIS\"*shoves inside her dry, no warning, watches her face break*\" NEEDS TO BE FORMATED AS THE GIRL SAYING SOME VERSION OF IT NOT **'S AS THATS NARRATION AND THE TTS IGNORES NARRATION, AND PLAUSE NARRATION DOESNT SOUND RIGHT COMING FROM A GIRL"*
>
> *"AND UNITY DIDED IN LIKE 5 MINUTES WHICH WAS NOT THE 3-5 DAYS FROM LACK OF FOOD AND WATER , GAME TIME I MEAN"*
>
> *"ITS STILL DAY ONE AND SHE ALREADY DIED"*
>
> *"AND THE SPEECH FIRST RULE ISNT SPECIFIC TO UNITY ITS SUPPOSE TO WORK FOR ALL GIRLS"*

### Epic: Chat hygiene + prompt-leak scrub + vitals sole-source-of-truth `(M)` — 🔴 CRITICAL

- [x] **BUG.22** 🔴 Chat text selection survives state.onChange re-renders. `renderLog()` guards on active selection inside `logEl`, defers render. Incremental append for new turns via `DocumentFragment`; full repaint only when history shrinks. CSS adds explicit `user-select: text` on `.log` + `.log-entry`.
- [x] **BUG.23** 🔴 System-prompt rule-text regurgitation scrubbed. `scrubSystemPromptLeakage()` filters lines matching 17 unambiguous rule-phrase patterns (MINIMUM/MAXIMUM N WORDS, AS?K?TERIS?K ACTION, SPEECH-FIRST, DELTA BLOCK, BOND-LEVEL AFFECT, ## headers, GOOD:/BAD: markers, etc.). Runs in `extractDelta` AND streaming `onChunk`.
- [x] **BUG.24** 🔴 Third-person Master-action asterisk narration eliminated. `BASE_SLUT` SPEECH-FIRST RULE rewritten with first-person-asterisk-only constraint + Master-action narration ban + third-person-self-reference ban + updated GOOD/BAD examples. `scrubMasterAsteriskNarration()` strips asterisks leading with `he|master|sir|his X` OR containing `her|she|herself|her X` (third-person self reference). Bare-verb asterisks describing her own action are KEPT.
- [x] **BUG.25** 🔴 Day-1 death from Ollama-hallucinated health delta. Removed `stamina` + `health` keys from `delta.js` safeDelta. Vitals are now sole-source-of-truth to `action-effects.js` (`applyAction` + `tickStaminaHealth`). The model retains a vote on arousal/wetness/cum/bruises/high/bond/mood/tags but no longer on the survival bar.
- [x] **BUG.SPEECH-FIRST-UNIVERSAL** 🟠 Confirmed architecturally — the rule lives in `BASE_SLUT` (universal scaffolding), not in the unity archetype. Every girl from library to street to sorority etc. gets the tightened rule, the new examples, and the first-person-asterisk constraint by inheritance.

---

As of session-end **2026-05-14** (commit chain through `6421b84`):

As of session-end **2026-05-14** (commit chain through `6421b84`):

As of session-end **2026-05-14** (commit chain through `6421b84`):

As of session-end **2026-05-14** (commit chain through `6421b84`):

All completion records for this project's work live in **[`docs/FINALIZED.md`](./FINALIZED.md)** — 35 session entries covering 71 task IDs across:

- **Phase 21 milestones** — all 24 (21.1 → 21.24) ✅
- **Pre-2026-05-14 epics** — all 14 (PRE.1 → PRE.14) ✅
- **Super-review findings** — all 15 (SR.1 → SR.15) ✅
- **Carry-over polish** — all 8 (CO.1 → CO.8) ✅ (5 audit-dropped, 3 shipped + 1 partial)
- **New 2026-05-14 directives** — both (NEW.1 + NEW.2) ✅
- **Post-review batch** — all 7 (POST-REVIEW.1 → POST-REVIEW.7) ✅
- **Workflow doc sweeps** — README + SETUP-README + ARCHITECTURE + ROADMAP + SKILL_TREE + TODO + FINALIZED all polished, cross-ref headers consistent, LAW #1 audited clean ✅

Per Gee directive 2026-05-14: *"NOTHING IS DEFFERED JUST MAKE SURE WE ACTUALLY NEED IT"* — every previously-deferred item audited; 5 unneeded ones dropped (CO.1 embedding memory / CO.2 voice clone / CO.3 full multi-girl auto-spawn / CO.5 machine-readable cost preview / CO.7 read-only-surface tooltips), all others shipped.

---

## 📥 Adding new work

When a new directive lands, follow this pattern per the LAWs:

### 1. Capture verbatim (LAW #0)

Paste Gee's exact words into the task description. Never paraphrase. Never collapse a list of items into one bullet. One task per item if he listed multiple.

### 2. File under the appropriate section

Use this template structure (sections appear only when work is in flight):

```markdown
### Gee's directive (verbatim YYYY-MM-DD) — short summary:

> *"verbatim quote here"*

### Epic: <descriptive title> `(S | M | L | XL)` — <PRIORITY>

- [ ] **TXX.Y** 🔴/🟠/🟡/🟢 verbatim-quoted sub-task description
```

Priority emoji legend:

- 🔴 **Critical** — blocking play / blocking next ship
- 🟠 **High** — important, ship within session
- 🟡 **Medium** — schedule into next batch
- 🟢 **Low** — polish, schedule when nothing else is pressing

### 3. Run the work

Per LAW: **read full file in 800-line chunks before any edit**. No partial reads, no editing without full file context. Mark task `[~]` in_progress at start.

### 4. Ship + atomic commit

Per `[[feedback-batch-commits]]`: bundle multiple related milestones into a single atomic commit at session end with a single combined FINALIZED entry. Every affected doc updated in the SAME commit per LAW — DOCS BEFORE PUSH.

### 5. Move to FINALIZED (LAW — FINALIZED before DELETE)

After commit lands:

1. Write the verbatim task text to `docs/FINALIZED.md` FIRST (append to top of the archive, never edit existing entries)
2. Verify the write succeeded
3. Then strip the entry from `docs/TODO.md`, leaving TODO at template state

---

## 📜 Recent session history (most recent first)

| Date | Session focus | Commit |
|---|---|---|
| 2026-05-14 | Full rebrand — "SEX SLAVE DUNGEON" → "DUNGEON MASTER: THE HUNT" across every player-visible string + programmatic identifier. 22 `SSD*` globals → `DMTH*`, 11 `ssd_*` localStorage keys → `dmth_*`, IDB name `sex_slave_dungeon` → `dungeon_master_the_hunt`. FINALIZED archive untouched per LAW. | (this commit) |
| 2026-05-14 | BUG.22-25 batch — chat text selection survives state.onChange (selection guard + incremental append + CSS user-select), system-prompt rule-bullet regurgitation scrub, third-person Master-action asterisk narration scrub + SPEECH-FIRST RULE rewrite (universal across all girls), Unity day-1 death fix (Ollama-hallucinated health delta stripped, vitals sole-source-of-truth to action-effects) | `566c989` |
| 2026-05-14 | BUG.1 — `start.bat` / `start.sh` auto-sync `.env` → `js/env.local.js` so Pollinations key flows to browser; landing-page Settings shows effective key with source badge | `6421b84` |
| 2026-05-14 | TODO template-out — verified full FINALIZED coverage before strip | `36e2787` |
| 2026-05-14 | POST-REVIEW.1-7 batch fix (action-effects routing + custom-pose persistence + Ollama fallback + gallery blob + condom state overlay) | `6421b84` |
| 2026-05-14 | POST-REVIEW.1-7 added to active backlog | `726cd45` |
| 2026-05-14 | NEW.1 custom image-prompt + NEW.2 image history gallery + hunt-view tooltips + drop unneeded deferred | `7a59f9c` |
| 2026-05-14 | SR.1-SR.15 super-review batch fix + CO.4/CO.6/CO.8 + CO.3 partial | `b862120` |
| 2026-05-14 | Super-review findings SR.1-SR.15 added to backlog | `ce9142d` |
| 2026-05-14 | Full doc sweep — all 7 docs polished + cross-ref headers + LAW #1 scrub | `5c38f60` |
| 2026-05-14 | TODO returned to template state + FINALIZED gap-fill | `4b91341` |
| 2026-05-14 | PRE.1-PRE.14 closeout + tooltip audit extension | `2387209` |
| 2026-05-14 | Phase 21.19 README split + 10 ASCII diagrams | `ef24687` |
| 2026-05-14 | Phase 21.12 real public landing page | `027d2e3` |
| 2026-05-14 | Phase 21.16 whore-out + john ledger + pregnancy hook | `2fa7d94` |
| 2026-05-14 | Phase 21.17 stamina/health + action-effects + john-happiness | `8679c8f` |

For complete per-session detail, files touched, verbatim Gee directives, and verification notes: **[`docs/FINALIZED.md`](./FINALIZED.md)** (35 session entries, 2178 lines).

---

## 📚 Reference

- **Gameplay wiki** → [`../README.md`](../README.md)
- **Technical setup + troubleshooting** → [`../SETUP-README.md`](../SETUP-README.md)
- **System design** → [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Phase plan + milestones** → [`./ROADMAP.md`](./ROADMAP.md)
- **Capability matrix** → [`./SKILL_TREE.md`](./SKILL_TREE.md)
- **Completed task archive** → [`./FINALIZED.md`](./FINALIZED.md)

---

*Active backlog: 0 tasks. Every item verified shipped (with FINALIZED session entry) or audit-dropped (with rationale) before TODO templated out per LAW — FINALIZED before DELETE.* 🖤
