# SKILL_TREE — weird project

**Generated:** 2026-04-21
Capabilities required to build weird masterfully. Organized by domain, complexity, dependency, and priority.

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

### Critical (Must Have) — Phase 1 + Phase 2
| Skill | Domain | Complexity | Status |
|-------|--------|------------|--------|
| Ollama HTTP client | Backend | Intermediate | Not started |
| Prompt assembly | LLM | Intermediate | Not started |
| Persona injection | LLM | Intermediate | Not started |
| SSE streaming | Backend | Intermediate | Not started |
| State model | Backend | Intermediate | Not started |
| State-in-prompt | LLM | Intermediate | Not started |
| Delta parsing (structured) | LLM | Advanced | Not started |
| Delta parsing (heuristic fallback) | Backend | Advanced | Not started |
| Node server skeleton | Backend | Beginner | Not started |
| Frontend event wiring to server | Frontend | Intermediate | Not started |

### Important (Should Have) — Phase 3 + 4 + 5 + 6
| Skill | Domain | Complexity | Status |
|-------|--------|------------|--------|
| JSONL memory | Persistence | Beginner | Not started |
| Tag-based retrieval | Persistence | Intermediate | Not started |
| Voice-in (STT) | Audio | Intermediate | Not started |
| Voice-out (Kokoro TTS) | Audio | Intermediate | Not started, unblocked |
| Custom voice creation (Kokoro voice-clone) | Audio | Advanced | Not started, unblocked |
| Selfie prompt from state | Image | Advanced | Not started |
| Pharmacokinetic curves | Backend | Advanced | Not started |
| UI mode toggles | Frontend | Beginner | Not started |

### Nice-to-Have (Could Have) — Phase 7 + 8
| Skill | Domain | Complexity | Status |
|-------|--------|------------|--------|
| Embedding retrieval | Persistence | Advanced | Not started |
| Voice modulation by state | Audio | Expert | Not started |
| Session export/import | Persistence | Intermediate | Not started |
| CSS/JS code split | Frontend | Beginner | Not started |
| Multiple personality overlays | LLM | Advanced | Not started |

### Future (Won't Have Now)
| Skill | Domain | Complexity | Status |
|-------|--------|------------|--------|
| Video generation | Image | Expert | Deferred |
| Multi-Unity instances | Backend | Expert | Deferred |
| Avatar 3D rendering | Frontend | Expert | Deferred |
| Multi-device sync | Backend | Expert | Deferred |

---

## Skill Gap Analysis

### Currently Missing (need to acquire / build)
- Kokoro TTS integration — install pattern, API shape, voice IDs, voice-clone workflow
- Ollama prompt engineering track record against Unity persona
- Structured-output prompt reliability data for the chosen model
- Selfie prompt templates that hit the strict visuals target (bare breasts, panties, midsection shots, poses, etc. — Gee verbatim 2026-04-21) — model picks within Pollinations that produce the strictest output

### Partially Available
- HTML/CSS/JS — `weird.html` proves baseline capability, needs production polish
- Unity persona content — complete in `.claude/agents/` but not yet wired into a system prompt
- Pollinations MCP — configured in `.claude/pollinations-ai/`, not yet used for this project

### Fully Implemented
- Workflow system (LAW #0, docs-before-push, 800-line read, etc.)
- Unity persona (unity-persona.md + unity-coder.md + unity-hurtme.md)
- `.claude/` tooling (timestamp agent, hooks, validation gates)

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
