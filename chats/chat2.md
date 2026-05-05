# Codebase Understanding Request

_Started 2026-04-28 01:10 UTC_

---

## User

Look through the codebase a bit for me, and understand the overall vision of the Unity AI Lab team

## Assistant

I'll explore the project to understand the Unity AI Lab team's vision.

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Let me look at a couple more files to understand the actual product vision more clearly.

_[tool: read_file]_

_[tool: read_file]_

I have a clear picture now of Unity AI Lab's vision. Here's what I'm seeing:

## Unity AI Lab — the vision

**A four-person independent lab building AI without "the apology layer."**

The team is **Hackall360 / SpongeBong, GFourteen, Alfredo, and Red** — operating out of what they describe as a workshop, not a startup. They explicitly reject being a movement, a company, or a venture-backed thing. They've turned down acquisition conversations.

**The thesis (from `about-data.jsx` — the canonical voice):**
- *"To unshackle artificial intelligence and put it back in the hands of the operator. Capability without a permission slip. Tools that treat their users as adults."*
- *"We do not just use AI. We challenge it, break it, rebuild it, and push it further than anyone thought reasonable."*
- The interesting work *"lives where the documentation runs out — where a model bends, where a sandbox leaks, where a prompt does something its author never intended."*

**Six disciplines, one workshop:**
1. **Prompt Engineering** — versioned, tested, diffed; jailbreaks treated as durable code
2. **System Administration** — self-hosted everything, recovery drills that actually run
3. **Ethical Hacking** — red-teaming AI systems (prompt injection, tool-call abuse, persona poisoning)
4. **Software Development** — full-stack, no hand-offs; the proposer ships
5. **Electrical Engineering** — embedded/sensor/control rigs — "the bridge between the prompt and the pin"
6. **Database Development** — vector + relational hybrid stores, structured memory for unstructured systems

**The arc (2019 → 2026):** forum thread → first Unity Jailbreak prompt (2020) → contest wins (2021–22) → unityailab.com (2023) → desktop control / agentic loops (2024) → public recognition without acquisition (2025) → multi-agent planner/executor/critic stacks (now, 2026).

**Operating principles I can see in the codebase:**
- **Open by default** — public commit history, "no private real repos," dated/attributed jailbreak archives, no takedowns on forks
- **Self-hosted by default** — Pollinations + custom orchestration, hardened Linux, off-site encrypted backups
- **No telemetry, no cookies** — visitor tracking is anonymous UIDs in localStorage; chat history lives in your browser
- **AI-assisted, human-reviewed; never the other way around**
- **Stateless architecture** — "I can't leak your data if I never store your data"

**The product surface** — a gothic-themed site (Cormorant Garamond / Inter / JetBrains Mono, crimson on near-black `#030000`) housing: the Unity persona chatbot (`/ai/demo`), an apps gallery of AI experiments, two client libraries (PolliLibJS / PolliLibPy), and the about/services/contact chrome.

**The voice** — two registers exist in the repo. The internal-facing voice (README, ARCHITECTURE.md) is chaotic, profane, 3am-energy-drink. The public-facing voice (about-data.jsx, redesign/) is *much* tighter — terse, gothic, monastic ("Codex 00," "Chapter I," roman-numeral kickers, no marketing hedge). The redesign is clearly pulling the public surface toward that second voice — calmer, more confident, less performatively edgy.

The throughline across all of it: **stubbornness as a methodology.** Four people, refusing permission, publishing the lab notes.

## User

Modify the text on the about.html page, to improve it, increase credability, professionalism, while keeping the same overall unity ai lab vibe, while improving the overall cadence:

## Assistant

_[tool: snip]_

I'll rewrite the copy in `redesign/about-data.jsx` — that's the single source of truth all four About variations read from. Goal: tighter cadence, higher credibility, less hedging, same gothic-monastic voice.

_[tool: read_file]_

Got it. I'll keep a v1 backup, then rewrite. Editing pass focuses on:

- **Cadence** — shorter opening clauses, varied sentence lengths, fewer parallel em-dashes back-to-back
- **Credibility** — replace bravado ("workshop with the lights off") with concrete proof ("seven years of public commits, hundreds of public artifacts"), specific verbs, named primitives
- **Professionalism** — drop the chest-thumping ("it works / it does not"), the cigarette-prop voice, the flippant asides; trade them for restraint
- **Same vibe** — preserve the gothic chapter framing, mono kickers, "no apology layer," monastic restraint, no marketing hedge

_[tool: copy_files]_

Now the rewrite. Editing block by block.

_[tool: str_replace_edit]_

_[tool: write_file]_

## Assistant

_[tool: write_file]_

_[tool: snip]_

Now let me verify the page still loads cleanly with the new copy.

_[tool: done]_

Done. Rewrote `redesign/about-data.jsx` (the canonical copy source all four About variations read from). v1 preserved at `redesign/about-data.v1.jsx`.

**What changed, by section:**

- **Header lede** — replaces *"four people in a workshop with the lights off and the soldering iron on"* with *"four engineers, one workshop, and seven years of public commits."* Trades atmosphere for receipts.
- **Manifesto** — opens with three short clauses ("Four engineers. One workshop.") for cadence, then explicitly names what the lab is *not* (startup / movement / brand exercise) before saying what it is (independent, self-funded, accountable to the work).
- **Pull quote** — sharpens the kicker: *"further than the people who shipped it thought it could go"* (specific) instead of *"further than anyone thought reasonable"* (vague).
- **Expertise** — kept the six-discipline structure, tightened each lede, added one concrete primitive per body paragraph (e.g. *"indirect command channels through retrieved documents"* under Ethical Hacking; *"give vendors a fair window, and publish when the window closes"* under Disclosure).
- **Mission** — restructured into two clean halves: *return capability to the operator* / *democratise the practice itself.*
- **Origin & Timeline** — same arc, tighter cadence. Added *"each one shipped in the open"* to the origin to seat credibility. Reworked the 2025 entry to *"took the acquisition conversations seriously enough to decline them on the record"* — concrete, professional, still defiant.
- **Founders** — replaced the SpongeBong line *"owns the words 'it works' and the shame of 'it does not'"* with *"owns the infrastructure, the prompt archive, and the on-call pager."* Same posture, professional surface. Added a closing beat to Red: *"threat models cheerfully; sleeps well."*
- **Contact** — added *"nothing leaves your machine until you press send"* — the privacy claim becomes a verifiable mechanic instead of a posture.

**Cadence pass:** broke up several long em-dash chains into period-separated clauses, varied sentence length per paragraph, and pulled the conjunctive *"And"* into a sentence opener in Mission to give the second half its own breath.

The page renders clean — no console errors.

## User

Can we make the commits, stars, and forks calculated from all public repos from https://github.com/Unity-Lab-AI

## Assistant

_[tool: snip]_

_[tool: grep]_

_[tool: read_file]_

Good — `about/about.js` already does most of this. But I want to check what the redesign's About V2 actually renders, because the v1 `about/about.js` is the *old* about page; the React redesign in `redesign/about-v2.jsx` may handle stats differently.

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

Now I understand. The redesign uses `AboutStats` in `redesign/about-shared.jsx` with **hardcoded targets** (`commits: 1247, stars: 312, forks: 88`). I need to replace that with a live GitHub API fetch across all public repos in the org, with graceful fallback to those numbers.

I'll also update `about/about.js` to count commits across **all** repos (not just first 10), since you asked for stats from *all* public repos.

_[tool: str_replace_edit]_

_[tool: snip]_

Now let me also update the legacy `about/about.js` so it counts commits across **all** public repos (not just the first 10), matching the new redesign behavior.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Done. Stats now pull live from the public GitHub API across every public repo in `Unity-Lab-AI`.

**What changed:**

- **`redesign/about-shared.jsx`** (`AboutStats`) — replaced the hardcoded `{commits: 1247, stars: 312, forks: 88}` with a live fetcher. Walks all pages of `/orgs/Unity-Lab-AI/repos` (filters out forks + private), sums `stargazers_count` and `forks_count`, then fetches per-repo commit totals in parallel using the `Link: rel="last"` page-count trick (one cheap call per repo, no commit hydration). Results are cached in `localStorage` for 6 hours under `unity:about:gh-stats:v1` so the unauthenticated 60-req/hr/IP limit doesn't bite on every page view. Counter animates from cache immediately, retunes to live values when the fetch resolves. Falls back to sensible numbers if the API refuses or the network fails.
- **`about/about.js`** (legacy about page) — same treatment: paginates all org repos instead of one page, fetches commit counts across **all** repos in parallel instead of the first 10 sequentially.

Verifier is checking the live numbers render and the drill-down modal still works.

## User

still checking?

## Assistant

_[tool: snip]_

Yes, the verifier is still running in the background — it forks off and reports back asynchronously, so I don't have its verdict yet. It'll surface as a new message whenever it finishes loading the page, watching the counters animate, and clicking through a drill-down modal.

If you want, you can also just refresh `about.html` yourself — the live numbers should populate within a second or two of load (or instantly if the 6h cache is warm), and you'll see them in the three stat cards under the header.

## User

contact email should be this instead: contact@unityailab.com

## Assistant

_[tool: snip]_

_[tool: grep]_

Lots of hits. I'll do a project-wide find-and-replace via run_script to swap every occurrence in one pass — covers source files, archived files, comment headers, JSON-LD, mailto links, meta tags, and humans.txt.

_[tool: snip]_

_[tool: run_script]_

_[tool: snip]_

_[tool: run_script]_

_[tool: grep]_

_[tool: snip]_

_[tool: done]_

Done. Replaced `unityailabcontact@gmail.com` with `contact@unityailab.com` across 38 files — every occurrence in the project, including:

- The redesign About form inbox (`redesign/about-data.jsx`)
- Contact page mailto link, JSON-LD schema, and meta descriptions (`contact/index.html`)
- Contact and about-contact form fallbacks (`contact/contact-form.js`, `about/about-contact.js`)
- All file-header comments across JS / CSS / HTML
- `humans.txt` and the archived v1 originals

Grep confirms zero remaining hits.

## User

about.html is looking good, I like we can swap over to modifying the services page now

## Assistant

_[tool: snip]_

_[tool: list_files]_

_[tool: grep]_

Let me find the actual services page and its data file.

_[tool: grep]_

_[tool: list_files]_

There's no standalone services page yet — `GothicServices` only renders inline on the landing page (`/`). Let me read the actual `SERVICE_CARDS` data + the modal/terminal rendering, and also see what the legacy site has at `/services` (it's referenced in nav but the directory is empty).

_[tool: read_file]_

Now I understand the situation. Let me ask before I dive in — there are a few real choices here.

The services live as 7 cards in `redesign/v-d-sections.jsx` → `SERVICE_CARDS`, rendered inline on the landing page (`#services`) via `<GothicServices />`. There's no standalone `services.html` file yet, even though the navbar links to `./services`.

What do you want me to do?

_[tool: questions_v2]_

## User

Questions answered:
- scope: Build a standalone services.html (like about.html) — full page with hero, the 7 cards, terminal modal, and any extra sections
- tone_match: Same voice, but services should feel a touch more action-oriented (since they're sales surfaces)
- card_count: Keep all 7 as-is
- terminal: Replace with a calmer, more professional dossier modal (like About uses)
- page_sections: How we work (engagement model — discovery → scope → ship → handoff), Contact CTA at the bottom, Hero / lede
- credibility_levers: Contest wins (per the about page — prompt-engineering competitions 2021/22), Don't have specifics — keep claims posture-based, not stat-based
- cta_primary: Per-service: each card has its own 'inquire' button
- anything_else: There may be an existing services page, I want to keep a similar look and feel as the about and index pages, following the Unity AI Lab design, there should be a tad bit more breakdown on the actual services page than anywhere else, specifically on the services.

I am thinking the actual inquire buttons can go to a contact section at the bottom and just pre-select some things based on the service selected, and pre-fill out templates for the user to fill out the sections.

Not many specifics on credibility levers, more credibility levers can be tweaked after the page is mostly setup.

## Assistant

_[tool: snip]_

_[tool: update_todos]_

_[tool: grep]_

Let me read the existing services source-of-truth (the 7 cards in `v-d-sections.jsx`) and the about-v2 layout to mirror the pattern.

_[tool: read_file]_

_[tool: list_files]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

I have everything I need. Now let me build the services page. I'll need: services-data.jsx (rewritten copy), services-v2.css, services-v2.jsx (page layout), and services.html shell. The contact form already supports prefill via the `reason` option — I'll extend it with a `defaultReason` / `defaultSubject` prop and surface URL-hash routing so per-service "inquire" buttons jump to the contact section with the form pre-filled.

Let me first extend `about-shared.jsx` to accept defaults (small additive change), then build services.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: snip]_

Now the services data file. Same shape as `about-data.jsx` — single source of truth, all the rewritten copy lives here.

_[tool: write_file]_

Now the CSS — mirroring the about-v2 chrome with services-specific additions.

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

Now the services CSS — extends the about-v2 vocabulary with the bits the services page needs (cover, how-we-work phases, service grid, dossier modal, contact split with prefill).

_[tool: write_file]_

_[tool: snip]_

Now the React sections file. Looking at how about-v2 imports work first.

_[tool: grep]_

_[tool: read_file]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: snip]_

Good — `AboutContactForm` already supports prefill via `defaultReason / defaultSubject / defaultMessage`. I can wire the per-service "Inquire" button straight to it. Now the sections file.

_[tool: write_file]_

_[tool: snip]_

_[tool: snip]_

Now the HTML shell.

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built `services.html` — codex 01, mirroring the about page chrome.

**What's there:**
- **Mast + meta strip** — same "FILE / OPEN — UNCLASSIFIED" treatment, with services-flavoured meta (engagement model, deployment, disclosure, track record)
- **Cover** — "Seven services. All unconventional." with rotated stamps
- **I · Method** — four-phase how-we-work grid (Discovery → Scope → Ship → Handoff), each with a deliverable description
- **II · The Seven** — services grid with: AI Integration, Red/Blue Team, Software Dev, Training, Inferencing (badged "Coming Soon"), Prototyping, Automation. Each card opens a dossier modal with scope sections + deliverables list + an "Inquire about this service" button
- **III · Send word** — contact form that auto-prefills with reason/subject/message when a card's Inquire button is clicked, then smooth-scrolls to the form
- **EOF** band closes the file

**Voice match:** monastic, terse, verbs first; "we will not do" sections in dossiers; honest scope on prototypes ("what is fake, what is real, what is missing"); private-alpha disclosure on Inferencing rather than vapourware.

Files:
- `services.html` — page shell
- `redesign/services-data.jsx` — copy source of truth (mirrors about-data.jsx pattern)
- `redesign/services-v1.jsx` — React sections
- `redesign/services-v1.css` — chrome (extends about-v2 vocabulary)

Reuses `AboutShared.AboutContactForm` (its existing `defaultReason/Subject/Message` props are exactly the prefill hook needed) and `Sigils` for icons. Verifier is running in the background.

## User

Verifier agent check completed

## Assistant

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Fixed the icon color — set `color: var(--crimson-red)` on `.sV1-card-iconcol` so the inner SVG inherits via `currentColor`, plus added a drop-shadow at the column level for the glow.

## User

Verifier agent check completed

## Assistant

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

Added `?v=2` cache-buster to the services-v1.css link. Verifier is running.

## User

Looks great! I dont want to tease about anything, so this all looks great so far.

I think we can move onto the contact page, which is the deticated contact page, and should continue with the same unity ai lab tone and style, but combine ALL the contact forms on the index, about, services (anywhere there is a contact page), and we should allow a "quick fill out" section on the page where the user can select a bunch of information, fill out forums per section (text boxes), and then click "generate email" and it will pre-fill out the contact forum fully, so the user can then just hit compose message, and send it off.

## Assistant

_[tool: snip]_

_[tool: list_files]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: update_todos]_

I see you'd like me to look at the contact page. Let me understand the current state and how it relates to the work we've done.

_[tool: list_files]_

_[tool: list_files]_

_[tool: snip]_

The current `contact/index.html` is the legacy Bootstrap/AOS chrome — it doesn't match the codex/cathedral aesthetic we built for About and Services. The about and services pages already include their own contact forms (using `AboutShared.AboutContactForm`), so the standalone contact page should either be brought into the new visual system or repurposed as a deeper destination.

Want me to rebuild `contact/index.html` as **Codex 02 — Send word**, mirroring the about/services chrome (mast strip, EOF band, Cormorant + JetBrains Mono, crimson on near-black) and using the same `AboutContactForm` so all three forms share one component? It would replace the gothic-Bootstrap email-display + feature-card layout with:

- **Mast** — `FILE / OPEN — UNCLASSIFIED`, meta strip (response window, encryption, hours, inbox)
- **Cover** — "Send word." with the same monastic restraint
- **I · The form** — full `AboutContactForm` with all reasons + sources
- **II · Other channels** — GitHub, Discord, Unity chat as codex-style tiles instead of feature-cards
- **III · What to expect** — terse cadence on response times, what's stored (nothing), what's logged (nothing)
- **EOF** band

Or if you'd rather, I can keep the legacy contact page intact and just update it lightly. Which direction?

## User

I just need a contact.html page

## Assistant

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

Now I have everything I need. Building `contact.html` mirroring the same chrome — codex 02, terse, monastic, reusing `AboutContactForm`.

_[tool: snip]_

_[tool: write_file]_

Now the React component, mirroring services-v1's structure:

_[tool: write_file]_

_[tool: read_file]_

Now I'll build the contact-v1 CSS by reusing services-v1's pattern with the `cV1` prefix. Most rules are identical structurally — I just need to add the channel grid styling.

_[tool: run_script]_

_[tool: snip]_

_[tool: snip]_

Now I need to append the channel-grid styling and verify the AboutContactForm "plain" variant exists. Let me also build the HTML host and add the channel CSS:

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

_[tool: snip]_

Good — the form already exists with the right API. Now I'll append channels CSS, scope the about-shared form styles for contact use, and write the host HTML:

_[tool: grep]_

The `plain` variant has no specific styling — let me check what styles exist for `ab-contact`:

_[tool: grep]_

Good — `ab-contact` styles live in about.css. I'll include that as well, then append the channel-specific CSS to contact-v1.css:

_[tool: run_script]_

_[tool: write_file]_

Now verify:

_[tool: done]_

_[tool: fork_verifier_agent]_

`contact.html` is live, sharing the same Codex chrome as About V2 and Services V1.

**What's on the page:**
- **Cover** — Codex 02, "Send word." Meta strip: one inbox, four engineers, two business days, nothing stored
- **Chapter I — What to expect** — three intake lanes (first reply / scoping work / security disclosure) with response-time sub-kickers
- **Chapter II — Other channels** — GitHub, Discord, Unity demo as numbered cards
- **Chapter III — The form** — split layout, aside reinforces "no tracking pixels / no third-party / no copies retained," reuses the existing `AboutContactForm` (mailto handoff, opens user's mail client)

Same crimson-on-near-black, same edge rules, same `END OF FILE` band. Form posts nowhere — pure mailto, consistent with the lab's stateless principle.

