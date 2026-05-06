# TODO List - Master Overview

> **Single source of truth for project-wide work.** This master TODO provides high-level status and links to detailed task breakdowns.

---

## Project Vision & Goals

**Overview:**
This project is a comprehensive AI-powered website showcasing the Pollinations API through a landing page, demo environment, and full-featured chat application.

**Key Components:**

1. **Landing Page (index.html)** - ~90% complete
   - Professional showcase of UnityAILab
   - Navigation to Demo and AI pages
   - Clean links to in-repo projects only (no external project links)
   - Responsive design across all devices
   - External links ONLY for libraries, services, and platforms

2. **AI Landing Page (/ai)** - ~95% complete
   - Professional landing page introducing Unity AI Chat
   - Links to demo and describes full AI experience
   - SEO optimization with meta tags and social cards
   - Responsive design across all devices
   - Links to demo for early access

3. **Demo Page (/ai/demo)** - ~85% complete (IMPLEMENTED!)
   - Interactive demo showcasing Pollinations API functionality
   - Text-to-Text chat with multiple AI models
   - Text-to-Image generation with advanced controls
   - TTS (Text-to-Speech) with 6 voice options
   - Model selector, parameter controls, chat history
   - Markdown rendering with syntax highlighting
   - Responsive design with mobile support
   - CORS-compatible, browser-compatible implementation
   - Needs: Additional features, polish, testing

4. **Main AI Chat App** - Not in this repo (External)
   - Full-featured chat app planned for future (like ChatGPT, Gemini, DeepSeek)
   - Would include: sessions, folders, agents, memory
   - Custom features: live voice chat, page control, system connector
   - Professional layout with sidebar navigation
   - Currently external deployment

**Architecture:**
- **PolliLibPy**: Python reference implementation (direct from Pollinations docs)
- **PolliLibJS**: JavaScript browser-based version (mirrors Python functionality)
- **Development Flow**: Python files as reference, JavaScript for serverless browser execution

**Standards:**
- **Responsiveness**: Seamless experience from extra small to extra large screens
- **Cross-Browser**: Works across Chrome, Firefox, Safari, Edge with proper fallbacks
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
- **Performance**: Optimized loading, minimal layout shifts, responsive images

**Link Policy:**
- In-repo projects: Link freely (pages in this repo)
- External projects: Do NOT link to other projects (like unity.unityailab.com, CodeWringer)
- External services: OK to link (libraries, platforms, Discord, GitHub org, npm packages, CDNs)

**Current Priorities:**
1. Update landing page navigation (add Demo and AI links)
2. Clean up external project links on landing page
3. Plan and structure /demo page
4. Plan and structure /ai page
5. Establish and implement responsiveness standards
6. Ensure cross-browser compatibility

---

## Conventions
- [ ] Use `- [ ]` for open, `- [x]` for done.
- [ ] Prefix priority: **P0** (urgent), **P1** (next), **P2** (nice-to-have).
- [ ] Every task should start with a verb.
- [ ] Add an **Owner** and optional **Due** date where helpful.
- [ ] Keep scope small; split big tasks.

---

## Project Components Overview

### 🟨 **PolliLibJS** - JavaScript Client Library
**Status:** ✅ **COMPLETE** (100%)
**Location:** `PolliLibJS/TODO.md`
**Summary:** Full-featured JavaScript client library for Pollinations.AI with all API endpoints, streaming, function calling, and comprehensive testing utilities.

---

### 🐍 **PolliLibPy** - Python Client Library
**Status:** ✅ **COMPLETE** (100%)
**Location:** `PolliLibPy/TODO.md`
**Summary:** Feature-parity Python implementation mirroring all PolliLibJS capabilities with Python-idiomatic design patterns.

---

### 🌐 **Landing Website** - Current Test Site
**Status:** 🟢 **IMPROVED** (~90%)
**Location:** `website-TODO.md`
**Summary:**
- ✅ Main landing page with hero, features, services sections
- ✅ About, Services, Projects, Contact pages
- ✅ Basic responsive design with Bootstrap + custom media queries
- ✅ Major accessibility improvements (Nov 2025): ARIA landmarks, form labels, skip links
- ✅ Performance improvements (Nov 2025): No-cache headers removed, Open Graph/Twitter cards added
- ✅ CSS/JS minification with automated deployment workflow
- ⚠️ Test infrastructure complete, smoke effects fixed, stability improved
- ❌ Needs: Final test validation, cross-browser testing, mobile optimization

**Quick Stats:**
- [x] Home page (index.html)
- [x] About page (about/index.html)
- [x] Services page (services/index.html)
- [x] Projects page (projects/index.html)
- [x] Contact page (contact/index.html)
- [x] Gothic dark theme styling (styles.css - 1742 lines)
- [x] Interactive JavaScript (script.js - 1297 lines)
- [x] Performance audit completed (PERFORMANCE_AUDIT.md)
- [x] Test infrastructure (Playwright with 122 tests in 5 suites)
- [x] ARIA landmarks and form labels (major accessibility win)
- [x] Open Graph and Twitter Card meta tags
- [x] CSS/JS minification (styles.min.css 27KB, script.min.js 19KB)
- [x] Skip links for keyboard navigation
- [x] Smoke effects fixed for test stability
- [ ] Verify automated test results (tests created, need validation run)
- [ ] Cross-browser testing matrix
- [ ] Final WCAG AA compliance verification

---

### 🎨 **/ai Page** - AI Landing Page
**Status:** ✅ **COMPLETE** (~95%)
**Location:** `/ai/index.html`
**Summary:** Professional landing page for Unity AI Chat with comprehensive SEO, social meta tags, and responsive design. Introduces the AI chat experience and links to the demo.

---

### 🎮 **/ai/demo Page** - Interactive Demo AI Chat
**Status:** ✅ **HIGHLY COMPLETE** (~90%)
**Location:** `demo-page-TODO.md`
**Summary:** Fully functional interactive demo showcasing PolliLibJS capabilities with text chat, image generation, TTS/voice features, markdown rendering, advanced parameter controls, Unity persona integration, and age verification system.

**Implemented Features:**
- ✅ Text-to-text chat with AI models
- ✅ Text-to-image generation (flux, flux-realism, flux-anime, flux-3d, turbo, any-dark)
- ✅ TTS with 6 voices (alloy, echo, fable, onyx, nova, shimmer)
- ✅ Model selector dropdown
- ✅ Advanced parameter controls (temperature, max_tokens, width, height, enhance, seed)
- ✅ Markdown rendering with syntax highlighting (highlight.js)
- ✅ Chat history with local storage
- ✅ Responsive design
- ✅ CORS compatibility fixes
- ✅ Cross-browser support (Firefox, WebKit confirmed)
- ✅ Referrer authentication with Pollinations API
- ✅ Unity persona with custom system prompt
- ✅ Age verification system
- ✅ ~8,000 lines of HTML/CSS/JS code

**Remaining Work:** STT (speech-to-text), additional polish, enhanced error handling

---

### 🎯 **/apps Page** - Mini Applications Gallery
**Status:** 🟢 **IN DEVELOPMENT** (~70%)
**Location:** `/apps/`
**Summary:** Collection of mini applications and interactive tools, including slideshows, image galleries, and other utility apps.

**Note:** This is a newer addition with active development. See recent commits for apps page improvements (slideshow fixes, navigation, styling).

---

### 💬 **Main AI Chat App** - Full-Featured Application
**Status:** ❌ **NOT IN THIS REPO** (External)
**Location:** `main-app-TODO.md`
**Summary:** Production Unity AI Chat application (hosted at https://unity.unityailab.com). This TODO tracks features if/when implementing a version in this repository.

**Note:** Currently external deployment. This TODO is for reference/future development.

**Scope:** 45+ planned features (session management, SFW/NSFW modes, agents, file upload, themes, memory, etc.)

---

### 🔧 **Infrastructure & Backend**
**Status:** ❌ **NOT STARTED** (0%)
**Location:** `infrastructure-TODO.md`
**Summary:** Backend services, API infrastructure, DevOps, security, and operational requirements for production deployment.

**Scope Includes:**
- API & Infrastructure (rate limiting, observability, config management)
- CI/CD pipelines (lint, test, deploy automation)
- Security & Privacy (secrets management, data masking, audit trails)
- Documentation (quickstart, API docs, safety guides)
- QA & Testing (test suites, benchmarks, stress testing)
- DevOps (infrastructure-as-code, staging/production environments)
- Performance & Monitoring (latency budgets, metrics, caching)

**Note:** Most items require backend server implementation (not applicable to current static site).

---

## Current Focus Areas

### 🐛 **Active BugFIX Branch** (`feature/BugFIX`)

> **User verbatim (LAW #0):**
>
> > pull to this Website2 folder the repo :https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io and check the support documents... the problems we are having is that the "read codex" button on the main page does not propley show the codex write up if we even have one,(may need to be added) and since the recent push the screensaver app is haviung problems its auto propmpt generation and image gen is not working.. it just says "failed to loaf prompt" so maybe check all that out for obvious issues of why the read codex and the screensaver app is not working like it was before the most recent push to main. we will be making a feature baranch called BugFIX that we will be working from
> >
> > make sure the screensaver is usinbg the correct keys and shit that its suppose to it might be an api error
> >
> > the rpos layout tacks sinority

- [x] **Screensaver: auto-prompt generation + image gen not working — "failed to loaf prompt" since recent push to main.** Root cause (after research): Pollinations migrated auth from referrer-based on `text.pollinations.ai`/`image.pollinations.ai` to token-based on `gen.pollinations.ai` via `enter.pollinations.ai`. The legacy referrers (`s-test-sk37AGI`, `UA-73J7ItT-ws`) lost full access after the migration; that's why screensaver's `/openai` POST and `/models` GET stopped working. Fix shipped: stood up a Cloudflare Worker proxy at `https://websiteunityailab.gfourteen7525.workers.dev` holding `sk_*` token server-side as Cloudflare Secret env var (`POLLINATIONS_SK`); Worker translates legacy `/text/openai` → `gen.pollinations.ai/v1/chat/completions`, `/image/prompt/<x>` → `gen.pollinations.ai/image/<x>`, etc., injecting `Authorization: Bearer sk_*` on every forwarded request. Migrated `PolliLibJS/pollylib.js` `TEXT_API`/`IMAGE_API` constants to the proxy URL, replaced every hardcoded `text.pollinations.ai`/`image.pollinations.ai` + `?referrer=UA-73J7ItT-ws` in `ai/demo/{js/api.js, js/voice.js, js/tools.js, js/config.js, demo.js, age-verification.js, test-cors.html, unity-persona.js}` and `apps/textDemo/text.js` with the proxy URL, dropped all referrer query params. Apps using `polliAPI` (`apps/screensaverDemo`, `helperInterfaceDemo`, `personaDemo`, `textDemo`, `unityDemo`, `talkingWithUnity`, `slideshowDemo`) auto-inherited the fix via the `PollinationsAPI.TEXT_API`/`IMAGE_API` constant change. End-to-end verified via `curl /text/models` (full OpenAI model list), `curl /image/models` (full image model list), `curl POST /text/openai` with chat completion payload (returned `gpt-5.4-nano-2026-03-17` generated prompt). Updated `PolliLibJS/README.md` + `Docs/Pollinations_API_Documentation.md` header note.
- [x] **"Read Codex" button on main page does not propley show the codex write up if we even have one,(may need to be added).** Investigation confirmed: `index.html` had NO "Read Codex" button and NO codex page existed. Built both: (1) Created `codex/index.html` — a full canonical writeup of the Unity persona / lab manifesto / lore (sections: What This Is, The Unity Persona, The Three Streams, Manifestation Forms, The Lab Behind Unity, The Stack, The Way Forward, CTA back to demo + about). Modeled after `about/index.html` structure for layout consistency; bespoke `.codex-*` CSS classes for grimoire/manuscript feel (codex-prose, codex-pullquote, codex-stream-grid, codex-form-grid). Full SEO meta + Open Graph + Twitter cards + JSON-LD Article schema + BreadcrumbList. Same navbar/footer pattern as the rest of the site. (2) Added a "Read the Codex" button to `index.html` hero section between "Try the Unity Demo" and "Explore Our Projects" — `<a href="./codex" class="btn btn-gothic-secondary me-3"><i class="fas fa-book me-2"></i>Read the Codex</a>`.

---

### ✅ **Recently Completed**
- [x] PolliLibJS full implementation (100%)
- [x] PolliLibPy full implementation (100%)
- [x] Landing website pages (Home, About, Services, Projects, Contact)
- [x] Cache-busting deployment workflow
- [x] Basic responsive design foundation
- [x] **NEW:** Performance and accessibility audit (Nov 2025)
- [x] **NEW:** ARIA landmarks and semantic HTML (Nov 2025)
- [x] **NEW:** Form labels for screen reader accessibility (Nov 2025)
- [x] **NEW:** Open Graph and Twitter Card meta tags (Nov 2025)
- [x] **NEW:** No-cache headers removed (major performance improvement) (Nov 2025)
- [x] **NEW:** Playwright test infrastructure (15 tests across 3 browsers) (Nov 2025)
- [x] **NEW:** CSS/JS minification workflow and deployment (Nov 2025)
- [x] **NEW:** Skip links for keyboard navigation (Nov 2025)
- [x] **NEW:** /ai landing page implementation (Nov 2025)
- [x] **NEW:** /ai/demo interactive demo page (~85% complete) (Nov 2025)
- [x] **NEW:** Demo page CORS compatibility fixes (Nov 2025)
- [x] **NEW:** Demo page cross-browser support (Firefox, WebKit) (Nov 2025)
- [x] **NEW:** Referrer authentication for Pollinations API (Nov 2025)
- [x] **NEW:** Dynamic model loading with fallback data (Nov 2025)

### 🎯 **Immediate Priorities (P0)**
- [x] **Website:** Performance audit ✅ (COMPLETED - see PERFORMANCE_AUDIT.md)
- [x] **Website:** Accessibility audit and major fixes ✅ (COMPLETED - ARIA, labels, skip links)
- [x] **Website:** CSS/JS minification for performance ✅ (COMPLETED - automated workflow)
- [x] **Website:** Cross-browser testing ✅ (Firefox & WebKit 100% passing, see archived-tests/PLAYWRIGHT_CI_NOTES.md)
- [x] **Demo Page:** Implementation ✅ (~85% COMPLETE - functional demo with chat, images, TTS)
- [ ] **Demo Page:** Add STT (speech-to-text) functionality
- [ ] **Demo Page:** Enhanced error handling and edge cases
- [ ] **Demo Page:** Additional polish and UX improvements
- [ ] **Documentation:** Create quickstart guides for both libraries
- [ ] **Documentation:** Update all TODO files to reflect current status (IN PROGRESS)

### 📋 **Next Up (P1)**
- [ ] **Website:** Mobile optimization and comprehensive testing on real devices
- [ ] **Website:** Final WCAG AA compliance verification
- [ ] **Demo Page:** Complete remaining planned features from demo-page-TODO.md
- [ ] **Demo Page:** Add system prompt configuration
- [ ] **Demo Page:** Add conversation export (JSON/Markdown)
- [ ] **Documentation:** Model capability matrix
- [ ] **Documentation:** Demo page user guide
- [ ] **Infrastructure:** Plan backend architecture (if needed in future)

### 💡 **Nice to Have (P2)**
- [ ] **Main App:** Begin planning in-repo implementation
- [ ] **Documentation:** Contributing guide, architecture overview
- [ ] **Infrastructure:** Staging environment setup

---

## Quick Reference Links

| Component | Status | Detailed TODO |
|-----------|--------|---------------|
| PolliLibJS | ✅ Complete (100%) | [../../PolliLibJS/TODO.md](../../PolliLibJS/TODO.md) |
| PolliLibPy | ✅ Complete (100%) | [../../PolliLibPy/TODO.md](../../PolliLibPy/TODO.md) |
| Landing Website | ✅ Improved (~90%) | [website-TODO.md](website-TODO.md) |
| /ai Landing Page | ✅ Complete (~95%) | `/ai/index.html` |
| /ai/demo Page | ✅ Highly Complete (~90%) | [demo-page-TODO.md](demo-page-TODO.md) |
| /apps Page | 🟢 In Development (~70%) | `/apps/` |
| Main Chat App | ❌ External | [main-app-TODO.md](main-app-TODO.md) |
| Infrastructure | ❌ Not Started | [infrastructure-TODO.md](infrastructure-TODO.md) |

---

## Documentation

| Document | Location |
|----------|----------|
| AI Assistant Guide | [CLAUDE.md](../../CLAUDE.md) |
| API Coverage Report | [../API_COVERAGE.md](../API_COVERAGE.md) |
| Cache-Busting System | [../CACHE-BUSTING.md](../CACHE-BUSTING.md) |
| Pollinations API Docs | [../Pollinations_API_Documentation.md](../Pollinations_API_Documentation.md) |
| Performance Audit | [../PERFORMANCE_AUDIT.md](../PERFORMANCE_AUDIT.md) |
| SEO Implementation | [../SEO_IMPLEMENTATION.md](../SEO_IMPLEMENTATION.md) |
| Test Guide | [../TEST_GUIDE.md](../TEST_GUIDE.md) |
| Test Results | [../TEST_RESULTS.md](../TEST_RESULTS.md) |
| Project README | [../../README.md](../../README.md) |
| N8N Webhook Integration | [../N8N_WEBHOOK_INTEGRATION.md](../N8N_WEBHOOK_INTEGRATION.md) |

---

## Glossary

- **SFW/NSFW**: Safe-for-work / Not-safe-for-work
- **STT**: Speech-to-text
- **TTS**: Text-to-speech
- **SSE**: Server-Sent Events (streaming)
- **PII**: Personally Identifiable Information
- **WCAG**: Web Content Accessibility Guidelines
- **P0/P1/P2**: Priority levels (urgent/next/nice-to-have)

---

**Last Updated:** 2025-11-22
**Project:** UnityAILab Test Site (sitetest0)
