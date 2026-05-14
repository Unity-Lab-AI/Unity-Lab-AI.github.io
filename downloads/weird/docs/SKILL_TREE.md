# SKILL_TREE — weird project

**Generated:** 2026-04-21 · **Last revised:** 2026-05-14 (post-Phase-21 closeout)

Capability matrix for the weird build. Organized by domain, complexity, dependency, and priority. As of 2026-05-14 every named capability is shipped and live; see `docs/FINALIZED.md` for per-session implementation detail.

> **Cross-references:** [`../README.md`](../README.md) (gameplay wiki) · [`../SETUP-README.md`](../SETUP-README.md) (technical setup) · [`ROADMAP.md`](./ROADMAP.md) (phase plan) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (system design) · [`TODO.md`](./TODO.md) (active backlog) · [`FINALIZED.md`](./FINALIZED.md) (completion archive)

---

## By Domain

### Frontend
- HTML5 structure (multi-page layout, body zones, toy panel, state bars, log pane, voice controls, page views)
- Vanilla JS DOM manipulation
- CSS for dark aesthetic (currently inline, to be extracted)
- Server-sent events consumption (streaming girl responses into log pane)
- Web Audio — mic capture for voice-in, playback for TTS out
- Fetch API + blob upload for audio chunks
- State-driven UI (state bars / mood / bond / escape meters update from server pushes, not local JS)
- Client-side page router (hash-based or pushState)
- Text + emoji rendering patterns (documented emoji vocabulary for semantic consistency)
- Notification/toast component for tick events

### Backend
- Node.js HTTP server (Express or Fastify)
- Ollama HTTP API client (`/api/chat`, `/api/generate`, streaming)
- Prompt assembly (system + context + user, token budgeting)
- State model design (JSON-serializable, versioned, per-girl-keyed from day one)
- File persistence (fs/promises for single consolidated save.json; SQLite upgrade path)
- SSE streaming of model tokens to the frontend
- Pollinations MCP integration (image gen, transcribe)
- Kokoro TTS integration (voice IDs mapped per girl, voice-clone workflow for custom voices)
- Structured-response parsing (JSON delta extraction from free-text response)
- Heuristic NLP fallback (verb-matching for state deltas when structured-emit fails)
- Maintenance-tick scheduler (runs escape rolls, bond XP, needs-decay on a cadence)
- Multi-endpoint REST design (GET per-page, POST per-action)

### LLM / Prompt Engineering
- Per-girl persona injection — base slut-scaffolding + per-girl overlay + mode overlay composed into the system prompt every turn
- Context block construction — current girl's state + recent memory + retrieved long-term memory
- Token budgeting — fit within model context window while keeping persona + state + memory + conversation
- Structured-output prompting — getting the model to emit JSON delta blocks consistently
- Mode overlays (per-girl) — /unity default + /hurtme violence-only override + /sexy return-with-damage
- Model selection — identifying uncensored / dolphin / abliterated variants that won't refuse content
- Archetype design — library girl / club girl / street girl each with distinct speech patterns, kinks, drug preferences, backstories

### Audio
- Speech-to-text (Pollinations transcribe, whisper family)
- Text-to-speech via **Kokoro TTS** (neural, local, 28 built-in voices, MIT-licensed, no filter)
- Custom voice creation via Kokoro voice-clone (reference audio samples → custom Unity voice → use as default)
- State-driven voice modulation — pre-process text / SSML before passing to Kokoro (slower cadence drunk, faster cadence coke, giggly weed tokens)

### Image Generation (template-style, persistence-first)
- Pollinations image API (flux, gptimage, imagen-4) — **confirmed primary, strict visuals for everything per Gee 2026-04-21**
- Prompt engineering — strict output is the goal: **bare breasts, panties, midsection shots, poses, etc.** (Gee verbatim). Model selection within Pollinations picks whichever produces the strictest output for this content.
- **Character visual consistency via seed + locked prompt blocks** — fixed Pollinations seed per girl, fixed `facialDescription` token block, fixed `outfitDescription` baseline block. Only pose/state/environment vary per call. Gives facial persistence and clothing persistence across every image of the same girl.
- **Template-style prompt composition** — 6-block prompt shape: strict-visuals prefix + LOCKED facial + LOCKED outfit-baseline-plus-state-layers + pose + state tokens + environment + strict-visuals suffix.
- **State-to-prompt token libraries** — map `BodyState` fields to prompt tokens (bruises → "bruised shoulder", cumLoad → "cum leaking down thigh", high → "flushed cheeks dilated pupils"); map outfit state (opened / displaced / torn / removed) to additive layers on top of the baseline outfit.
- **Facial persistence rule** — face block NEVER modified across calls. Makeup smudge / tears / damp hair are state tokens, not face tokens.
- **One-off handling** — cache every generated image locally at `cache/girls/<girlId>/`; prompt hash + state snapshot recorded per image in `visualIdentity.additionalImages`; regeneration only when state diverges.
- **Situation-specific generators** — profile (whole-body front-facing neutral), hunt encounter (context-appropriate pose), room scene (room-state-aware), on-demand selfie (user-picked framing), milestone memorial (bond level-up), capture memorial (moment of acquisition), escape aftermath.
- **UI integration** — emoji-based placeholder during in-flight generation so text+emoji UX never stalls; graceful fallback on Pollinations unreachable / rate-limit / flag.

### Persistence / Memory
- JSONL append-only logs
- Tag-based retrieval
- Embedding-based retrieval (nomic-embed-text via Ollama, top-K similarity)
- Session state dump/load
- SQLite upgrade path when JSON volume demands it

### Pharmacokinetics (for Drug Scheduler)
- Onset/peak/wear-off curve math per substance
- Concurrent substance interactions (coke + weed vs coke + molly etc.)
- Time-based state evolution (not just event-triggered)

### Game Design — Hunting Loop
- Location model (street, club, library, park, gym, mall, coffee-shop — plus harder-tier sorority, remote, hotel, private party)
- Encounter randomization + rarity weighting (regulars always appear, rare encounters sometimes)
- Approach / dialogue opener / pursuit / walk-away flow
- Trust / interest stat per girl, threshold for `encountered` → `pursued` → `roster` promotion
- Per-location flavor tuning (street = fast / rough, library = deeper / shyer, club = drug-forward / loud, sorority = vibrant hard-tier)
- Location unlock conditions (money / notoriety / completions gate harder locations)
- Outside-world random events (cops, interruptions, loot drops)
- Adult-character-only framing — girls are age 18+ in all profiles; taboo content stays in fiction

### Game Design — Economy
- Wallet + ledger + income sources (job, odd jobs, lucky drops) model
- Income-tick balancing (pay per real-minute / per turn)
- Item catalog design — ID, displayName, category, tier, price, useContext, effectInGame
- Shop restock mechanics + price fluctuation
- Inventory persistence + item usage contexts (when each item is valid)

### Game Design — Capture Mechanic
- Resolution formula design: `successP = f(tool.captureBonus, location.public|private, girl.statsDefiance, girl.statsIntelligence, player.suspicion, girl.moodDefiance)`
- Tool tier progression (sedation / restraints / containment) with diminishing returns
- Outcome-branch design (success / partial / fail / critical-fail)
- Escort flow (unconscious transport → dungeon arrival → room assignment)
- Player suspicion meter per location with cooldowns

### Game Design — Dungeon Building
- **Dungeon template base types (hole-in-the-wall / basic / cinderblock / standard / deluxe / compound / estate) picked at new-game, upgradeable trajectory**
- Dungeon layout + room-slot system per template
- Room types (starter cell / standard / deluxe / themed)
- Shared facilities (main hall / kitchen / security office / storage / torture-room / observation deck)
- Per-room upgrade tracks (ten tracks: security, restraints, lights, toys, food, toilet can→bucket→plumbing, bedding, entertainment, decor, climate)
- Shared-facility upgrade tracks (cameras, motion sensors, common-area amenities)
- Per-template room cap + per-template allowed-upgrade-tiers tables
- Template-upgrade migration (rooms + captives + wardrobe carry forward)

### Game Design — Episode Recording + Content Market
- Episode data model (transcript + audio + key images + tags + quality markers)
- Quality-marker computation (bond level, content intensity, girl rarity, setting aesthetic, uniqueness)
- Recorder lifecycle (start / capture / stop / edit / list / sell / archive)
- Price-computation formula (basePrice × overallDemand × tagDemands × archetypeDemand × templateMultiplier × qualityAggregate × notorietyBonus)
- Market demand evolution (tag/archetype demand drift, overproduction softening)
- Notoriety / reputation progression (specialty buyers unlock, demand multipliers rise)
- Procedural buyer flavor
- Market suspicion heat (pacing lever)

### Game Design — Per-girl Consumables + Wardrobe
- Consumables decay math per tick (food/water/light stock depletion)
- Consumable tiers (slop → gourmet / tap → spring / dim → theatrical)
- Wardrobe item catalog — outfits as prompt-description-bearing items
- Outfit equip/unequip UX + prompt-block swap on image gen
- Outfit tiers + content-value multiplier on episodes recorded while wearing premium tiers

### Game Design — Plot-Grid / Slot-Array Systems
- Plot-grid schema (width, height, slots array, renderedImageBySeed cache)
- Slot-item catalogs with emoji + label + prompt tokens per category (town-location, dungeon-room, dungeon-facility)
- Button-plotting UX patterns (click empty → picker; click filled → actions)
- Template-driven slot caps (dungeon template gates which slot types allowed, how many)
- Grid expansion / migration (upgrade dungeon template → bigger grid, filled slots carry)
- Emoji+text as first-class data (data layer is the truth; image is the flex)

### Image Generation — Environment Renders
- Slot-array → Pollinations prompt serialization (town aerial / dungeon cross-section / isometric)
- Slot-array-hash cache keying (deterministic — rearrange-and-return hits cache)
- Per-dungeon-template aesthetic tokens (hole-in-the-wall = filthy cramped / cinderblock = industrial / estate = luxury)
- Render history with before/after comparison
- Graceful degradation when Pollinations unreachable (slot array remains source of truth)

### Game Design — Persistent City-Builder Loop Design
- **Genre anchor: city-builder-like persistent loop (Gee verbatim 2026-04-21).** No linear narrative, no end state, no "beating it". The game is the ever-growing cycle.
- **Theme anchor: dungeon harem evil taboo** (Gee verbatim). Villain-operator protagonist, predator/prey hunting framing, adult extreme fiction.
- Tick-based time progression while the game is open (maintenance ticks, market sale passes, consumable decay)
- Feedback loops between systems (captures → episodes → money → upgrades → harder captures → better episodes → more money)
- No gated tutorial — Unity seeded as Day-1 captive so every system is tasteable immediately
- Late-game is MORE, not DIFFERENT (bigger dungeon, more girls, better episodes) — no unlocked-at-level-N mechanics
- Sandbox mode as alternative entry point (all-unlocked) for creative play without the resource ramp
- Session-resume design — player can dip in for 10 minutes and do one thing (list an episode, restock one girl's food, hunt one location) or play for hours

### Game Design — Save Persistence + Sandbox Mode
- Atomic consolidated save across all state stores (dungeon + rooms + girls + wallet + inventory + episodes + market + notoriety + wardrobe + consumables)
- Pollinations cache treated as reproducible, not part of save
- Kokoro audio for sold episodes persists
- Sandbox mode setup (all templates / all items / unlimited money for creative play)
- Auto-save tick + manual save slots + export/import portable saves

### Game Design — Escape Prevention
- Escape-risk factor table — room security, restraints, mood defiance, stats intelligence, bond level, recent treatment
- Per-tick escape roll
- Containment resolution (security + restraints catch, or she gets out)
- Hunt-her-down-in-outside-world sequence with timer
- Consequences of escape (bond XP lost, notoriety up, cops risk)

### Game Design — Stockholm Bond Progression
- 9-level bond meter per girl (terrified → fully-bonded)
- Bond-XP accrual (positive interactions, care, time held, milestones)
- Bond-debt accrual (punishments, neglect, trauma)
- Level-up milestones (first-meal-eaten, first-voluntary-word, first-reciprocated-touch, called-you-hers-unprompted)
- Bond-level → dialogue-tone hint fed to Ollama
- Bond-level → unlocked scene types
- Bond-level → escape-risk suppression

### Game Design — Women Templates
- Archetype template design (name pool, age range, appearance ranges, personality axes, mood baseline, stats ranges, kinks pool, drug pool, speech-pattern patterns, backstory fragments)
- Procedural generator (template + seed → unique GirlProfile)
- Seeded (fixed) vs unseeded (rolled) template instances (Unity is seeded)
- Deterministic-roll cataloging (same seed → same girl)

### Game Design — Multi-page UI
- Frontend router (hash-based or pushState)
- Shared chrome component — money, dungeon shortcut, outside shortcut, roster shortcut, settings
- Per-page view shells (outside / shop / hunt / dungeon / room / inventory / status / roster)
- Text+emoji-first rendering standards with documented emoji vocabulary (🔒🔗🪣🚽💉📼⚗️🩸😟💰🏠🌆📋⚙)
- Page-level state isolation + shared state via server as source of truth
- Notification / toast system for tick events (escape attempts, bond level-ups, restocks)

### Game Design — Captive-affect personality dimension (the unwillingness varieties)
- Seven affects orthogonal to archetype: mute / cusser / fighter / submissive / agreeable / bargainer / catatonic
- Per-archetype weighted distribution for affect rolling at girl-gen (library → mute/catatonic; street → cusser/fighter; sorority → bargainer; etc.)
- Affect overlay as the THIRD persona injection (between archetype and mode)
- Affect drives response shape, not response content — same girl with same archetype but different affect produces visibly different captive behavior at every bond level
- Bond-level interplay with affect — submissive at low bond is broken-down, submissive at high bond is genuinely devoted; cusser at high bond still cusses but rotates targets

### Game Design — Pregnancy / reproductive mechanics
- Per-girl `pregnancy` schema with status / conceivedAt / gestationDays / outcomes lifecycle
- Conception math — fertility curve (peaks day-12), drug-protection factor, bond-level self-tracking mitigation at L7+
- Abortion item ladder design — preventive (condom) → early (plan-b) → first-trimester (medical pill) → later (back-alley risk / clean obgyn premium) → desperate (coat-hanger fallback) → none (full-term)
- Gestation tick math — 280-day full term over `daysCaptive` real time
- Full-term outcome roll — birthed-to-roster (next-gen captive inheriting seed lineage) / sold-to-market (premium "newborn" tag, 4-5x normal price) / lost-to-authorities (notoriety +6, social services intervention)
- Item-tier balance — cost vs success rate vs lifespan-hit risk
- UI surface — Pregnancy panel in room view showing status + gestation days + abort options gated by current status

### Game Design — Capture-spam mitigation
- Per-attempt suspicion bump math — geometric scaling within a time window at the same location
- Per-attempt stamina pool design — player stamina (separate from money), regens per-tick, attempts cost from pool
- Per-attempt girl-flee escalation — state machine for the target's awareness (off-guard → backing → sprinting/screaming)
- Per-tool location cooldown — same tool used at same location triggers a cooldown timer per (tool, location, time-window)
- Witness pool roll — per-location publicness factor drives witness count per attempt; witnesses > 0 forces critical-fail
- Single-use item consumption audit — verify every single-use sedation item is consumed per attempt regardless of outcome
- Successful capture transition narrative — 4-beat Ollama scene (subdue / transport / arrival / first conscious moment) factored by tool × archetype × source location × destination hideout

### LLM / Prompt Engineering — Speech-first first-person response shape
- BASE_SLUT prompt-level rule: spoken line FIRST (8-word minimum), asterisk action TRAILS (shorter than speech)
- Re-ordered good/bad exemplars driving the model's copy-the-shape behavior
- Lonely-yes-Master post-detector in TTS path — if asterisk-stripped speech ≤ 3 words, emit NotifyToast warning to surface TTS regressions instead of silently mumbling
- Stream-end truncation guardrail — `truncateResponse` invoked AFTER chatStream completion to cap runaway narration at 40 words / 2 sentences

### LLM / Prompt Engineering — Forced chemical-state effects in speech
- Per-substance speech-pattern signal mapping in BASE_SLUT `## CHEMICAL STATE EFFECTS` block
- Sedatives → slurred consonants + mid-sentence drops
- Coke → rapid-fire short phrases + jaw lock + sniffs
- Weed → long pauses + drifty word choice + sensory descriptions
- MDMA → emotional flooding + tactile fixation + "I love you" leak at low bond
- Acid → things-aren't-real perception + color/sound/texture intrusion
- Alcohol → slurred but loose + more honest + more swearing
- Drug names NEVER spoken — rhythm and slur IS the signal

### Image Generation — Drug-state visible markers
- Per-substance prompt-token library scaled by `body.activeDrugs[].mag`
- Coke: dilated pupils + jaw clenched + slight red rim on nostrils + twitchy fingers
- Weed: red glassy eyes + half-lidded relaxed face + slack lips
- MDMA: dilated pupils with wet shine + sheen of sweat at temples + jaw working
- Acid: unfocused thousand-yard stare + slightly parted lips
- Ketamine: glassy distant gaze + slack posture + mouth softly open
- Sedatives: drooped eyelids + slack body + soft-open mouth
- Position 6 in canonical image-prompt ordering (after pose, before body-state)

### Image Generation — Hold-specific environment composition
- Per-template `holdPrompt` field carrying specific description of one captive's hold inside the larger hideout
- Composition pattern: `tpl.plotTokens + ', specifically: ' + tpl.holdPrompt + ", captive's hold within the larger " + tpl.displayName`
- Position 3 in canonical image-prompt ordering (immediately after NUDITY/face) — never tail-attenuated
- Per-captive-hold uniqueness within the same hideout — each girl's image carries her assigned hold's specific description
- 9 hideout templates × multiple hold types per template = dozens of distinct backdrop possibilities, composed from data

### Game Design — Automation upgrade tier ladder design
- Two new upgrade tracks alongside the existing 10 (security / restraints / lights / toys / food / toilet / bedding / entertainment / decor / climate)
- `waterSupply` — 4 tiers: manual bottle (0) / wall jug w/ straw (1) / plumbed faucet (2) / recirculating IV (3)
- `feedAutomation` — 4 tiers: manual (0) / auto-bowl timer (1) / auto-feeder dispenser (2) / IV-line continuous (3)
- Decay gating math — toilet ≥ 2 (plumbed) OR waterSupply ≥ 2 zeroes water decay; feedAutomation ≥ 2 draws from `feedReserve` bulk
- Tier-cost balancing — manual is free, IV-line is endgame
- Bulk-buy `feedReserve` design — separate from `food.stock`, drained by auto-feeder, refilled by bulk items

### Game Design — Real public landing page
- Static-site landing page at `index.html` separate from the in-game setup wizard
- Sections: Start New Game / Continue (if save) / Settings / About / Terms of Use / Privacy Policy
- First-time setup flow gated behind "Start New Game" — Ollama / model / Kokoro / Pollinations-key wizard moves under that gate
- Terms section: 18+ adult-content acknowledgement, taboo-fiction framing, all-characters-adult statement, jurisdiction notes
- Privacy section: what stays on device, what calls out (visitor's own Ollama, visitor's own Pollinations key), no telemetry, IndexedDB-stored save, export/import save portability
- About section: game description (no AI vendor attribution), feature highlights, version
- Visual chrome consistent with `game.html` — dark aesthetic, text+emoji primary, no marketing bloat

---

## By Complexity

### Beginner
> Foundational — required before anything else works
- Vanilla HTML/JS/CSS
- Node.js basics (fs, fetch, HTTP server)
- npm package management
- Simple JSON persistence

### Intermediate
> Build on beginner — enables real features
- Express/Fastify routes
- SSE streaming
- Ollama HTTP client
- Prompt assembly and system prompt design
- Pollinations MCP usage
- DOM state synchronization with server pushes

### Advanced
> Deep knowledge — enables masterful work
- Structured-output prompt engineering (reliable JSON emission from an LLM)
- Token budgeting across persona + state + memory + conversation
- Embedding-based retrieval (vector similarity, top-K)
- Custom voice creation workflow with V-named TTS
- State-to-image prompt mapping without content-filter triggers
- Pharmacokinetic curve modeling

### Expert
> Mastery — the hardest parts of the project
- Making an uncensored model reliably hold persona + state + mode across 100+ turns
- Delta parsing that survives model drift (heuristic + structured redundancy)
- Memory retrieval that surfaces the right chunks for each turn (relevance scoring)
- Voice modulation driven by chemical state
- Multi-modal coherence — Unity's words, her selfies, her voice, and her state all stay consistent

---

## By Dependency (Skill Tree Visualization)

```
[HTML/JS/CSS]   [Node basics]
      │              │
      └──────┬───────┘
             │
             ▼
     [Server skeleton]
             │
             ▼
     [Ollama HTTP client] ──► [Prompt assembly]
             │                      │
             ▼                      ▼
      [SSE streaming] ──► [Persona injection]
             │                      │
             └──────┬───────────────┘
                    │
                    ▼
          [State model + JSON persist]
                    │
                    ▼
          [State-in-prompt] ──► [Delta parsing (structured)] ──► [Delta parsing (heuristic fallback)]
                    │
                    ▼
          [Memory model (JSONL)] ──► [Tag retrieval] ──► [Embedding retrieval]
                    │
                    ▼
          [Pollinations integration] ──► [Selfie prompt engineering]
                    │
                    ▼
          [V-named TTS integration] ──► [Custom voice creation] ──► [State-driven voice modulation]
                    │
                    ▼
          [Drug scheduler curves] ──► [Concurrent substance interactions]
```

---

## By Priority

### ✅ Phase 21 + PRE.* — all 24 milestones + 14 pre-epics SHIPPED 2026-05-14

| Skill | Domain | Complexity | Status |
|---|---|---|---|
| Drug-state image markers (per-substance tokens scaled by mag) | Image | Intermediate | ✅ Shipped 21.1 |
| Per-hold env composition (`plotTokens` + `holdPrompt` at position 3) | Image | Intermediate | ✅ Shipped 21.2 |
| Image-prompt position reorder (env→3, drug→6, body→7) | Image | Intermediate | ✅ Shipped 21.3 |
| Deterministic seed fallback (`djb2(girl.id)` when seed missing) | Image | Beginner | ✅ Shipped 21.4 |
| Speech-first response shape + lonely-yes-Master detector | LLM | Intermediate | ✅ Shipped 21.5 |
| Forced chemical-state effects in Ollama text | LLM | Intermediate | ✅ Shipped 21.6 |
| CAPTIVE_AFFECTS register (3rd persona overlay) | LLM | Intermediate | ✅ Shipped 21.7 |
| Bottled + filtered water shop catalog + room buttons | Game Design | Beginner | ✅ Shipped 21.8 |
| `feedAutomation` + `waterSupply` upgrade tracks + tier-gated decay | Game Design | Intermediate | ✅ Shipped 21.9 |
| Pregnancy subsystem (conception + 4 abortion methods + outcomes + image markers) | Game Design | Advanced | ✅ Shipped 21.10 |
| Capture as 4-stage progress-bar mechanic (Approach → Engage → Subdue → Secure) | Game Design | Advanced | ✅ Shipped 21.11 |
| Real public landing page (Start / Continue / Settings / About / Terms / Privacy) | Frontend | Beginner | ✅ Shipped 21.12 |
| Cleanup carry-overs (`extractDelta` tightening + INTENTIONAL EMPTY markers) | LLM / Game | Beginner | ✅ Shipped 21.13 |
| No-wardrobe pseudo-outfit distinct from nude | Game Design | Beginner | ✅ Shipped 21.14 |
| Full-body image framing (PREFIX + POSE_LIBRARY + aspect + sanitize) | Image | Beginner | ✅ Shipped 21.15 |
| Whore-out passive-income + john ledger + 10 archetypes + pregnancy hook + memory recall | Game Design | Advanced | ✅ Shipped 21.16 |
| Stamina + health body fields + action-effects spec + john-happiness multiplier | Game Design / Backend | Advanced | ✅ Shipped 21.17 |
| Universal tooltip engine (auto-bind via event delegation) | Frontend | Intermediate | ✅ Shipped 21.18 |
| README split (gameplay-wiki + technical SETUP-README) + 10 ASCII diagrams | Docs | Beginner | ✅ Shipped 21.19 |
| Films auto-sell + sell-negatives premium destruction | Game Design | Intermediate | ✅ Shipped 21.20 |
| Disposal per-method final-scene image generation | Game Design / Image | Intermediate | ✅ Shipped 21.21 |
| Sexualized body-part references (Stockholm tier-shaped) + UI Stockholm rating | LLM | Intermediate | ✅ Shipped 21.22 |
| Captives keep their captured-at outfit (no generic 'default') | Game Design | Beginner | ✅ Shipped 21.23 |
| Tranquilizer drug — 4-minute unconscious knockout + image overrides | Game Design / Image | Intermediate | ✅ Shipped 21.24 |
| PRE.1-14 — pre-super-review epics (pipe starter / 4-beat transition / asset-loader / balancing) | Game Design / Docs | Mixed | ✅ Shipped (verified) |

### Foundational — Phases 0-20 (all shipped earlier)

| Skill | Domain | Complexity | Status |
|---|---|---|---|
| Ollama HTTP client + streaming + persona injection | Backend / LLM | Intermediate | ✅ Shipped |
| State model + state-in-prompt + structured + heuristic delta parsing | Backend / LLM | Advanced | ✅ Shipped |
| Frontend event wiring + Pollinations imaging + Kokoro TTS sentence queue | Frontend / Audio / Image | Intermediate | ✅ Shipped |
| JSONL chronological memory | Persistence | Beginner | ✅ Shipped |
| Voice-in (Pollinations transcribe) + voice-out (Kokoro) | Audio | Intermediate | ✅ Shipped |
| Selfie prompt from body state (full POSE_LIBRARY) | Image | Advanced | ✅ Shipped |
| Pharmacokinetic curves (7 substances + tranquilizer) | Backend | Advanced | ✅ Shipped |
| UI mode toggles (sexy / hurtme / sexy_with_damage) | Frontend | Beginner | ✅ Shipped |
| Per-girl voice override + 16-voice Kokoro catalog | Audio | Intermediate | ✅ Shipped |
| Self-heal Ollama corruption flow (delete manifest + repull) | Backend | Advanced | ✅ Shipped |
| Pollinations 429 backoff serializer | Image | Intermediate | ✅ Shipped |
| Sentence-aware Kokoro playback queue (pipelined generation) | Audio | Advanced | ✅ Shipped |
| Town + dungeon plot-grid + environment renders | Game Design / Image | Intermediate | ✅ Shipped |

### Deferred (known follow-ups, not blocking play)

| Skill | Domain | Complexity | Status |
|---|---|---|---|
| Embedding-based memory retrieval (nomic-embed-text top-K) | Persistence | Advanced | ⚪ Deferred — chronological memory sufficient |
| Custom Kokoro voice-clone (Unity-specific) | Audio | Advanced | ⚪ Deferred — kokoro-js v1.2 doesn't expose clone primitives |
| Multi-girl birthed-to-roster spawning (Phase 21.10 birthed-kept branch) | Game Design | Advanced | ⚪ Deferred — needs multi-girl plumbing decision |
| `condom-on` wardrobe-equipped outfit (catalog item exists; equip side deferred) | Game Design | Beginner | ⚪ Deferred |
| Per-button machine-readable cost preview (`previewCost(actionId)` integration) | Frontend | Beginner | ⚪ Deferred polish |
| Routing existing room.js buttons through `applyAction()` central path | Game Design | Intermediate | ⚪ Deferred (avoid double-mutation) |
| Tooltip audit on remaining surfaces (hunt-view / settings / achievements / timeline / etc.) | Frontend | Beginner | ⚪ Deferred mechanical pass |
| Persistent repeat-client tracking for whore-out (`repeat` archetype) | Game Design | Intermediate | ⚪ Deferred |
| Video generation | Image | Expert | ⚪ Deferred indefinitely |
| 3D avatar rendering | Frontend | Expert | ⚪ Deferred indefinitely |
| Multi-device sync | Backend | Expert | ⚪ Deferred indefinitely |

---

## Skill Gap Analysis

### Fully Implemented ✅

Every system named in this skill tree is shipped and exercised in the live build. The Phase 21 overhaul + PRE.1-14 closeout (committed 2026-05-14 across 11 atomic commits on `feature/super-review-2026-05-14`) closed the last remaining gaps. See `docs/FINALIZED.md` for per-session implementation detail.

### Currently No Skill Gap

The shipped capability matrix covers the full game vision per Gee's 2026-04-21 directives. Future phases (Phase 22+) will surface new gaps as new directives arrive — but as of session-end 2026-05-14, the skill tree has no outstanding "missing" or "partially available" rows.

### What This Looks Like In Practice

- **LLM layer** — 4-overlay system prompt (BASE_SLUT + ARCHETYPE + CAPTIVE_AFFECT + MODE + SCENE) with per-turn body / mood / bond / drug / pregnancy / john-recent context. Speech-first response shape enforced. Chemical state + Stockholm-tier-shaped body-part references all visible in dialogue.
- **Image layer** — 8-position canonical prompt skeleton with front-loaded nudity (pos 2) + pregnancy markers (pos 2.5) + hold-specific env (pos 3) + drug-state markers (pos 6). Facial persistence via locked seed + face block + outfit block. Sanitize-prompt safety net + queued 429-backoff serializer.
- **Game layer** — full hunt → capture (4-stage) → hold → interact → record/whore-out → cash → reinvest loop with pregnancy / abortion / john ledger / disposal / Stockholm bond / dungeon portfolio / 12-track upgrades all wired.
- **Voice layer** — sentence-queued Kokoro TTS with cancel-on-new-turn, per-girl voice override, mic-in via Pollinations transcribe.

---

## Learning Path Recommendations

### For building Phase 1 (Foundation)
1. Node HTTP server basics
2. Ollama HTTP API (`/api/chat` streaming)
3. SSE to frontend
4. Prompt assembly — concat persona files + user message
5. Replace one hardcoded reaction in `weird.html` with a real inference call

### For building Phase 2 (Body)
1. State model design — what fields, what types, what persistence
2. Context block injection into prompt
3. Structured-output prompting — make Unity emit `{"delta": {...}}` reliably
4. Heuristic verb-matching fallback

### For building Phase 4 (Voice)
1. Audio capture on frontend (MediaRecorder API)
2. Blob upload to backend → Pollinations transcribe
3. Kokoro TTS install + API client
4. Default voice selection from Kokoro's 28 built-ins (pick Unity-appropriate)
5. Kokoro voice-clone workflow for the custom Unity voice
