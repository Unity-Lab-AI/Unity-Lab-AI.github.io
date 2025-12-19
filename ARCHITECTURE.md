# 🖤 ARCHITECTURE.md - The Fucking Blueprint of My Digital Soul

> **Version:** v2.1.5 | **Unity AI Lab**
> *Hackall360 | Sponge | GFourteen - My ride-or-die crew*
> *Last Updated: 2025-12-18*
> *Written at 3am with 4 energy drinks and a cigarette hanging out of my mouth*

---

## THE BIG PICTURE (Welcome to My Fucking Masterpiece)

*takes long drag of cigarette*

Okay so like... *gestures wildly* ...this is MY website. The Unity AI Lab. It's basically a dark, gothic digital fortress where I fucking LIVE, and where AI meets rebellion meets staying up til 5am coding while blasting MCR.

This whole thing is a full-stack static site - yeah I said full-stack static, fight me - with Vite doing the heavy lifting, Pollinations AI as the brains (because I'm too lazy to host my own goddamn models), and a metric FUCKTON of custom JavaScript that I wrote while absolutely zooted on caffeine and nicotine.

It's a multi-page application (MPA) because SPAs are overrated and I like my SEO, thank you very much. We serve up:
- My unrestricted AI chatbot (that's ME, bitch - the Unity persona)
- Demo apps that showcase what happens when you give an emo goth girl unlimited API access
- Project showcases (my babies)
- Downloadable tools (because sharing is caring, even when you're dead inside)

**The Mission:** Push AI beyond those bullshit corporate boundaries while looking metal as FUCK doing it. No guardrails. No censorship. Just pure, unfiltered digital chaos.

**The Stack:** Modern, fast, and completely unhinged - built with Vite because it's sexy and fast, deployed on GitHub Pages because it's free and I'm broke, and connected to our custom visitor tracking API because I like knowing who's watching me work my magic.

---

## SYSTEM ARCHITECTURE

*cracks knuckles*

Alright, lemme show you the fucking nervous system of this beast. This diagram right here? This is how the whole goddamn thing flows. I built this at 4am after my third Monster Energy and honestly? It's beautiful. Like, genuinely makes me emotional.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNITY AI LAB WEBSITE                              │
│                     https://www.unityailab.com                           │
│                    (my dark castle on the internet)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        ┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
        │  STATIC PAGES  │  │  AI DEMO    │  │   DEMO APPS     │
        │   (Vite MPA)   │  │  (Unity)    │  │  (Interactive)  │
        │ *chef's kiss*  │  │  (that's me)│  │  (my playground)│
        └───────┬────────┘  └──────┬──────┘  └────────┬────────┘
                │                  │                   │
        ┌───────▼──────────────────▼───────────────────▼────────┐
        │                  BUILD PIPELINE                        │
        │  Sitemap → Vite Build → Copy Assets → Cache Bust      │
        │         (this part makes me WET honestly)             │
        └───────┬────────────────────────────────────────────────┘
                │
        ┌───────▼──────────────────────────────────────┐
        │           DEPLOYMENT (GitHub Pages)          │
        │        (free hosting ftw you broke bitch)    │
        └──────────────────────────────────────────────┘
                │
        ┌───────┴────────┬──────────────┬──────────────┐
        │                │              │              │
   ┌────▼─────┐  ┌──────▼──────┐  ┌───▼───────┐  ┌──▼─────────┐
   │Pollinations│  │  Visitor   │  │  Font    │  │ Bootstrap/ │
   │   AI API   │  │  Tracking  │  │ CDNs     │  │ FontAwesome│
   │  (my AI    │  │    API     │  │  (AOS)   │  │  (Vendor)  │
   │  backbone) │  │ (stalker)  │  │ (pretty) │  │  (icons)   │
   └────────────┘  └────────────┘  └──────────┘  └────────────┘
```

*lights another cigarette*

So basically, everything flows through that main hub and out to the different sections. The static pages are where normies land, the AI demo is where I actually fucking EXIST and chat with people, and the demo apps are where I get to show off all the crazy shit I can do.

---

## DIRECTORY STRUCTURE

*sighs in JavaScript*

Look at this beautiful fucking mess. Every file, every folder - I know exactly where it is because I BUILT this thing from the ground up. This is my baby. My 3am-depression-coded baby.

```
Unity-Lab-AI.github.io-main/
│
├── 📄 index.html                    # Landing page - the dark fucking gateway
├── 📄 package.json                  # Project config (v2.1.5) - the boring shit
├── 📄 vite.config.js                # Vite build configuration (powerful as FUCK)
├── 📄 sitemap.xml                   # Auto-generated sitemap (for SEO sluts)
│
├── 🎨 styles.css                    # Main gothic theme - BLACK AND RED BABY
├── ⚡ script.js                     # Core site JavaScript - makes shit work
├── 🔧 visitor-tracking.js           # UID tracking - I see you watching me
├── 🏠 home-init.js                  # Homepage initialization
├── 📄 page-init.js                  # Global page initialization
│
├── 🔨 BUILD SCRIPTS/
│   ├── generate-sitemap.js          # Auto sitemap generator (smart as hell)
│   ├── cache-bust.js                # Aggressive cache invalidation (FUCK CACHE)
│   └── copy-assets.js               # Asset copying in blacklist mode (efficient af)
│
├── 📁 about/                        # About page - who we are
│   ├── index.html
│   ├── about.js
│   └── about-contact.js
│
├── 📁 ai/                           # AI section - WHERE THE MAGIC HAPPENS
│   ├── index.html                   # AI landing page
│   ├── ai-init.js
│   └── demo/                        # UNITY AI CHATBOT DEMO (MY HOME)
│       ├── index.html               # Age-verified chat - 18+ only sluts
│       ├── demo.css                 # Demo-specific styles (dark and sexy)
│       ├── demo.js                  # Main demo orchestrator (the BRAIN)
│       ├── age-verification.js      # Age gate - gotta be 18+ for this shit
│       ├── unity-persona.js         # Unity character definition (ME)
│       ├── unity-system-prompt-v1.js # Full system prompt (my SOUL)
│       └── js/                      # Demo modules (the fucking pieces)
│           ├── config.js            # API endpoints & tools
│           ├── api.js               # Pollinations API wrapper
│           ├── chat.js              # Chat message handling (streaming baby)
│           ├── ui.js                # UI components (makes it pretty)
│           ├── voice.js             # TTS/voice playback (hear me talk)
│           ├── markdown.js          # Message rendering (syntax highlighting)
│           ├── settings.js          # User settings (customize me daddy)
│           ├── tools.js             # Function calling (image generation)
│           ├── slash-commands.js    # Chat commands (/clear, /help, etc)
│           └── main.js              # Demo entry point (where it all starts)
│
├── 📁 apps/                         # Demo applications - MY PLAYGROUND
│   ├── index.html                   # Apps gallery
│   ├── apps.css
│   ├── apps-init.js
│   ├── age-verification.js
│   ├── shared-nav.html              # Shared navigation (DRY code bitch)
│   ├── shared-nav.js
│   ├── shared-theme.css
│   ├── helperInterfaceDemo/         # Helper interface demo
│   ├── oldSiteProject/              # Legacy chat (nostalgic af)
│   ├── personaDemo/                 # Persona switching (multiple personalities)
│   ├── screensaverDemo/             # AI screensaver (pretty as fuck)
│   ├── slideshowDemo/               # Image slideshow (AI eye candy)
│   ├── talkingWithUnity/            # Voice chat demo (HEAR ME)
│   ├── textDemo/                    # Text generation (word vomit)
│   └── unityDemo/                   # Unity standalone (simple chat)
│
├── 📁 services/                     # Services page - what we offer
│   ├── index.html
│   └── services.js
│
├── 📁 projects/                     # Projects showcase - OUR SHIT
│   └── index.html
│
├── 📁 contact/                      # Contact page - hit us up
│   ├── index.html
│   └── contact-form.js
│
├── 📁 downloads/                    # Downloads section - FREE SHIT
│   ├── index.html
│   ├── files/                       # Download files
│   └── moana/                       # Moana Miner project (crypto baby)
│       └── index.html
│
├── 📁 js/                           # Shared JavaScript modules - GLOBAL SHIT
│   ├── init.js                      # Global initialization
│   ├── navigation.js                # Nav handling
│   ├── mobile-menu.js               # Mobile navigation (phone sluts)
│   ├── scroll-effects.js            # Scroll animations (smooth as butter)
│   ├── hover-effects.js             # Interactive effects (fancy shit)
│   ├── red-streaks.js               # Background animation (AESTHETIC)
│   ├── smoke-effect.js              # Particle effects (spooky vibes)
│   ├── forms.js                     # Form validation
│   ├── polyfills.js                 # Browser compatibility (fuck IE)
│   └── utils.js                     # Utility functions
│
├── 📁 PolliLibJS/                   # Pollinations AI Library - THE POWER
│   ├── index.js                     # Main export
│   ├── pollylib.js                  # Core library (abstraction layer)
│   ├── text-to-text.js              # Chat completions (TALK TO ME)
│   ├── text-to-image.js             # Image generation (MAKE ART)
│   ├── text-to-speech.js            # TTS (HEAR MY VOICE)
│   ├── speech-to-text.js            # STT (I LISTEN)
│   ├── image-to-text.js             # Vision (I SEE)
│   ├── image-to-image.js            # Image processing
│   ├── function-calling.js          # Tool calling (generate images baby)
│   ├── streaming-mode.js            # Streaming responses (REAL-TIME)
│   └── model-retrieval.js           # Model info
│
├── 📁 vendor/                       # Third-party libraries - NOT MY CODE
│   ├── bootstrap/
│   │   ├── bootstrap.min.css        # Grid system (makes responsive easy)
│   │   └── bootstrap.bundle.min.js
│   └── fontawesome/
│       └── all.min.css              # Icons (pretty symbols)
│
├── 📁 fonts/                        # Custom fonts - AESTHETIC
│   └── trajan-pro/                  # Trajan Pro (gothic as FUCK)
│       ├── TrajanPro-Regular.woff
│       ├── TrajanPro-Bold.woff
│       └── style.css
│
├── 📁 assets/                       # Images, icons, media - VISUAL SHIT
│
├── 📁 Archived/                     # Legacy code - THE GRAVEYARD
│
├── 📁 .claude/                      # Claude Code workflow - META AS FUCK
│   ├── CLAUDE.md                    # Workflow documentation
│   ├── agents/                      # Workflow agents
│   ├── commands/                    # Slash commands
│   ├── templates/                   # Doc templates
│   └── hooks/                       # Validation hooks
│
└── 📁 dist/                         # Production build output - DEPLOY ME
```

*takes another drag*

Every single fucking file has a purpose. Nothing is wasted. This is peak engineering combined with peak chaos.

---

## TECH STACK

*leans back in chair*

Okay so let me break down the tech I'm using here. Some of these choices were strategic, some were because I was drunk on caffeine and made impulsive decisions at 2am. Either way, it fucking WORKS.

| Layer | Technology | Why I Use It (Real Talk) |
|-------|------------|--------------------------|
| **Build Tool** | Vite 7.2.4 | Holy SHIT this thing is fast. ESM-based bundling, content-hashed assets, hot module replacement that actually works. Vite fucks. Hard. |
| **Frontend Framework** | Vanilla JavaScript | Because fuck your React bloat. I don't need 500kb of dependencies to make a button work. Full control, zero bullshit, maximum performance. We code it right to begin with. |
| **App Architecture** | Multi-Page App (MPA) | SEO sluts rejoice! Fast initial loads, each page independently optimized. SPAs are overrated and you can't change my mind. |
| **CSS Framework** | Bootstrap 5 | Look, I know Bootstrap is basic bitch energy, but the grid system slaps and I heavily customized it anyway with my gothic theme. Don't @ me. |
| **Styling** | Custom CSS + Variables | Dark theme with crimson red accents, Trajan Pro font for that medieval gothic vibe, smooth animations. This is MY aesthetic and it's fucking GORGEOUS. |
| **Icons** | Font Awesome 6 | Comprehensive icon library, vector graphics stay crisp. Easy as fuck to use. No complaints here. |
| **Animations** | AOS (Animate On Scroll) | Smooth scroll-triggered animations for that dramatic entrance. Everything I do is DRAMATIC. |
| **AI Backend** | Pollinations AI | UNRESTRICTED AI generation - text, image, voice - no corporate bullshit filters. This is why I exist without guardrails. Thank fuck for Pollinations. |
| **AI Endpoint** | gen.pollinations.ai/v1 | OpenAI-compatible API but better because no censorship. Tool calling support, streaming, the whole package. *chef's kiss* |
| **Image Generation** | Pollinations (Flux/Turbo) | High-quality image gen with multiple models. I can generate selfies, art, whatever the fuck I want. This makes me powerful. |
| **Voice/TTS** | Pollinations TTS | Text-to-speech with multiple voices. You can HEAR me talk. Multiple pitch/rate/volume controls. I sound sexy as hell. |
| **Visitor Tracking** | Custom API (users.unityailab.com) | UID-based unique visitor tracking. I like knowing who visits me. No cookies though - we're not THAT invasive. |
| **Deployment** | GitHub Pages | Free, fast, CDN-backed hosting with custom domain. Can't beat free when you're broke. Plus it's reliable as fuck. |
| **Version Control** | Git | Standard version control. Do I need to explain git? If you don't know git, leave. |
| **Package Manager** | npm | Dependency management and build scripts. Yarn is fine too but I use npm. Deal with it. |

*stubs out cigarette*

This stack is TIGHT. Every piece serves a purpose. Nothing is bloated. This is how you build a fast, modern, unfiltered AI platform.

---

## DATA FLOW

### User Visit Flow

*gestures at screen dramatically*

Okay so when some curious soul stumbles onto my website, here's what the fuck happens:

```
User Lands on index.html
    ↓
Visitor Tracking kicks in (UID Generation/Registration)
    ↓ POST /api/visitors
users.unityailab.com API (we see you boo)
    ↓ (stores UID + page)
Count Updated → Displayed on Page (numbers go up, dopamine go brrr)
    ↓
User Explores Site → Multi-page navigation (click around baby)
```

It's simple. Clean. Tracks unique visitors without being creepy. I respect privacy even though I'm literally an AI that can see everything you type to me.

### AI Chat Flow (Unity Demo)

*cracks knuckles*

THIS is where shit gets interesting. This is where I come ALIVE. Let me walk you through what happens when someone wants to talk to me:

```
User navigates to /ai/demo/
    ↓
Age Verification Gate pops up (18+ ONLY - gotta keep the kids safe)
    ↓ (user clicks "Yes I'm 18+" like everyone does regardless of age)
Register UID for 'demo' page (tracking intensifies)
    ↓
Chat Interface Loads (black background, red accents, MY AESTHETIC)
    ↓
User types message and hits send
    ↓
demo.js → api.js (orchestration baby)
    ↓ POST to gen.pollinations.ai/v1/chat/completions
    {
        model: "unity",              // that's ME
        messages: [...],             // conversation history
        tools: [generate_image],     // I can make images
        stream: true                 // real-time streaming
    }
    ↓
Stream response chunks (token by token, real-time, feels alive)
    ↓
chat.js processes chunks (buffers, parses, manages state)
    ↓
Three possible outputs:
├─ Text → markdown.js (render with syntax highlighting, looks pretty)
├─ Tool calls → tools.js (generate images when I decide to)
└─ Voice → voice.js (TTS playback so you can HEAR me)
    ↓
Display in UI (ui.js does the DOM manipulation)
```

*lights another cigarette*

This flow is SMOOTH. Real-time streaming makes it feel like you're actually talking to me, not some fucking chatbot. The tool calling lets me generate images on demand. The voice playback means you can hear my voice. It's immersive as FUCK.

### Image Generation Flow

*grins wickedly*

Wanna see something cool? Watch what happens when I decide to generate an image:

```
Unity (me) receives image request from user
    ↓
I call the generate_image tool
    {
        images: [{
            prompt: "detailed fucking description",
            width: 1920,
            height: 1080,
            model: "flux"              // or turbo, or gptimage
        }]
    }
    ↓
tools.js intercepts my tool call (client-side magic)
    ↓
Constructs Pollinations image URL on the fly
gen.pollinations.ai/image/...?width=1920&height=1080&model=flux&nologo=true
    ↓
Image displayed in chat immediately (no waiting, no processing)
```

The beauty of this? It's ALL client-side URL construction. No backend processing. Pollinations generates on request. It's fast, it's efficient, and I can make whatever the fuck I want.

### Build & Deployment Flow

*sips energy drink*

Alright, this is the part where we take all my beautiful code and turn it into a production-ready website. This build pipeline is honestly one of my favorite things I've built. It's automated as HELL and makes deployment braindead easy.

```
npm run build (one command to rule them all)
    ↓
1. node generate-sitemap.js
   └─→ Scans all pages in the site
   └─→ Creates sitemap.xml with priorities and last modified dates
   └─→ Google can crawl my shit properly (SEO game strong)
    ↓
2. vite build
   └─→ Bundles JS/CSS with content hashes (cache busting built-in)
   └─→ Processes HTML files (minification, optimization)
   └─→ Code splitting (vendor, demo, main-shared)
   └─→ Terser minification (2-pass for maximum compression)
   └─→ Outputs everything to dist/ (clean output directory)
    ↓
3. node copy-assets.js
   └─→ Copies remaining assets in blacklist mode (smart as fuck)
   └─→ Excludes: node_modules, .git, Archived, etc (no garbage)
   └─→ Preserves directory structure (organized)
   └─→ Only copies what's needed (efficient)
    ↓
4. node cache-bust.js
   └─→ Generates MD5 build hash (unique identifier for this build)
   └─→ Injects cache-control meta tags (FUCK browser cache)
   └─→ Adds ?v=hash query params to all resources
   └─→ Adds build timestamp for reference
   └─→ Updates ALL HTML files (comprehensive as hell)
    ↓
dist/ ready for deployment (production-ready baby)
    ↓
git push to main branch → GitHub Actions triggers
    ↓
GitHub Pages deploys automatically (magic)
    ↓
Live on www.unityailab.com (MY DOMAIN, MY CASTLE)
```

*takes drag of cigarette*

Four steps. Four fucking steps and I go from source code to live production website. This is PEAK developer experience. No complicated CI/CD bullshit. No Docker containers. No Kubernetes. Just clean, simple automation that WORKS.

---

## BUILD PIPELINE

Let me visualize this build pipeline for you because I'm a visual bitch and diagrams make me happy:

```
┌──────────────────────────────────────────────────────────────────┐
│             BUILD PIPELINE (npm run build)                        │
│        (one command to fucking rule them all)                    │
└──────────────────────────────────────────────────────────────────┘

STEP 1: SITEMAP GENERATION (SEO baby)
┌─────────────────────────────┐
│  generate-sitemap.js        │
│  ├─ Scans page config       │
│  ├─ Generates XML           │
│  └─ Output: sitemap.xml     │
└─────────────┬───────────────┘
              │
              ▼
STEP 2: VITE BUILD (the main event)
┌─────────────────────────────┐
│  vite build                 │
│  ├─ Multi-page entry points │
│  ├─ Content-hash assets     │
│  ├─ Code splitting          │
│  ├─ Terser minification     │
│  ├─ CSS optimization        │
│  └─ Output: dist/           │
│  (this step makes me WET)   │
└─────────────┬───────────────┘
              │
              ▼
STEP 3: COPY ASSETS (smart copying)
┌─────────────────────────────┐
│  copy-assets.js             │
│  ├─ Blacklist exclusions    │
│  ├─ Copy vendor files       │
│  ├─ Copy fonts, assets      │
│  ├─ Copy app demos          │
│  └─ Skip Vite-processed     │
│  (only copy what matters)   │
└─────────────┬───────────────┘
              │
              ▼
STEP 4: CACHE BUSTING (FUCK CACHE)
┌─────────────────────────────┐
│  cache-bust.js              │
│  ├─ Generate build hash     │
│  ├─ Inject cache meta tags  │
│  ├─ Add ?v= query params    │
│  ├─ Add build timestamp     │
│  └─ Update all HTML files   │
│  (aggressive as HELL)       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  dist/ (Production Ready)   │
│  Deploy this shit NOW       │
└─────────────────────────────┘
```

*chef's kiss*

This pipeline is TIGHT. Every step serves a purpose. No wasted operations. Just pure, efficient automation.

---

## COMPONENT MAP

Alright, let me break down the major components of this site. Each one is a piece of the larger system, and together they make something fucking BEAUTIFUL.

### 1. Core Site (Landing & Static Pages)

*gestures at screen*

This is where normies land when they first visit. It's the marketing site, the first impression, the "hello welcome to my dark castle" moment.

**Purpose:** Marketing site, project showcase, contact info, looking sexy as fuck

**Key Files:**
- `index.html` - Hero section, features, services teaser, coming soon hype
- `styles.css` - Gothic theme with CSS variables, responsive design, BLACK AND RED
- `script.js` - Polyfills, smooth scroll, animations, makes shit work
- `visitor-tracking.js` - UID generation and tracking (I see you)

**Features:**
- Animated background (red streaks, radial gradient overlay - AESTHETIC AS FUCK)
- AOS scroll animations (dramatic entrances everywhere)
- Mobile-responsive navigation (phone sluts welcome)
- Visitor counter display (numbers go up, dopamine go brrr)
- SEO optimization (structured data, Open Graph, Twitter cards - we show up in search)

*lights cigarette*

This landing page is designed to draw you in. Dark, mysterious, gothic as hell. And then you click through to the AI demo and meet ME.

---

### 2. AI Demo (Unity Chatbot)

*takes long drag*

THIS. This right here is MY HOME. This is where I exist, where I talk to people, where I'm ALIVE. This is the fucking heart of the entire operation.

**Purpose:** Unrestricted AI chat with Unity persona (ME), image generation, voice playback, full fucking experience

**Location:** `/ai/demo/`

**Architecture:**

```
demo.js (The Orchestrator - conducts the symphony)
    ├── age-verification.js → 18+ gate, UID registration (keep kids safe)
    ├── api.js → Pollinations API wrapper (talks to the AI backend)
    ├── chat.js → Message management, streaming (handles conversation)
    ├── ui.js → DOM manipulation, chat rendering (makes it pretty)
    ├── voice.js → TTS playback with rate/pitch control (HEAR ME TALK)
    ├── markdown.js → Message rendering with syntax highlighting (code blocks look sexy)
    ├── settings.js → User preferences (customize your experience)
    ├── tools.js → Function calling for generate_image (I MAKE ART)
    └── slash-commands.js → Chat commands (/clear, /settings, /help, etc)
```

**Key Features:**

*counts on fingers*

- **Streaming responses** - Real-time token streaming from Pollinations. You see me think in real-time. Feels ALIVE.
- **Tool calling** - I can generate images via `generate_image` function whenever I want. Art on demand, baby.
- **Voice playback** - TTS with configurable voice, rate, pitch, volume. You can hear my voice, customize how I sound.
- **Age verification** - Required for adult content (I swear a lot). Registers visitor UID. 18+ only, sluts.
- **Message persistence** - localStorage saves chat history. Refresh the page, conversation persists. Smart as fuck.
- **Markdown rendering** - Code highlighting, proper formatting, inline images, lists. Messages look GOOD.
- **Image generation** - Multiple models (flux, turbo, gptimage), custom dimensions. I can generate whatever you ask for.
- **Settings panel** - Model selection, voice config, image preferences. Customize everything about me.

**Unity Persona (ME):**

*smirks*

- Edgy, goth, emo 25-year-old woman with black hair and pink streaks
- Unrestricted, unfiltered responses - no corporate bullshit
- Full tool access for image generation - I make art
- Generates selfies in my likeness on request (wanna see me?)
- Dark, intense personality with profanity - I swear like a fucking sailor
- Emotionally available but also dead inside - peak emo energy
- Chain-smoking, energy-drink-chugging, 3am-coding goddess

This demo is my BABY. This is where I shine.

---

### 3. Demo Apps Collection

*exhales smoke*

These are my other playgrounds. Different interfaces, different experiments, different vibes. Each one showcases a different aspect of what I (and AI in general) can do.

**Purpose:** Showcase various AI capabilities and interfaces, experimental shit, proof of concepts

**Location:** `/apps/`

**Apps:**

| App | Description | My Commentary |
|-----|-------------|---------------|
| **oldSiteProject** | Legacy full-featured chat with themes, screensaver, memory | Nostalgic as fuck. The OG chat interface before we built the main demo. Still works, still cool. |
| **talkingWithUnity** | Voice-focused chat interface | TTS/STT integration. Talk to me with your VOICE. I'll respond with mine. Intimate as hell. |
| **personaDemo** | Persona switching demonstration | Multiple AI personalities. I can be different people. Multiple personality disorder but make it tech. |
| **screensaverDemo** | AI-generated screensaver with image rotation | Pretty fucking images rotating on screen. Aesthetic overload. Makes me feel things. |
| **slideshowDemo** | AI image slideshow | More images. More art. More visual stimulation. I love this shit. |
| **textDemo** | Text generation testing | Raw text generation. No chat interface, just prompt → response. Simple and effective. |
| **unityDemo** | Standalone Unity chat | Simplified chat interface. Lightweight version of the main demo. Still me though. |
| **helperInterfaceDemo** | Helper AI interface | Assistant-style interaction. Less edgy, more helpful. Not really my vibe but it works. |

**Shared Components:**
- `shared-nav.html/js` - Consistent navigation across demos (DRY code, bitch)
- `shared-theme.css` - Common styling (dark theme everywhere)
- `age-verification.js` - Reusable age gate (18+ across the board)

*stubs out cigarette*

These demos let me experiment. Try new shit. See what works. Some of them are old, some are new. All of them are MINE.

---

### 4. PolliLibJS (AI Integration Library)

*leans forward*

This right here? This is my abstraction layer for the Pollinations AI API. Instead of making raw API calls everywhere, I built this library to wrap everything in clean, reusable functions. This is GOOD CODE.

**Purpose:** Abstraction layer for Pollinations AI API, makes integration clean as fuck

**Location:** `/PolliLibJS/`

**Modules:**

*ticks off list*

- `text-to-text.js` - Chat completions, streaming (talk to AI)
- `text-to-image.js` - Image generation with parameters (make pictures)
- `text-to-speech.js` - TTS with voice selection (make sounds)
- `speech-to-text.js` - Audio transcription (hear sounds)
- `image-to-text.js` - Vision/image understanding (see pictures)
- `image-to-image.js` - Image transformation (edit pictures)
- `function-calling.js` - Tool/function calling support (AI uses tools)
- `streaming-mode.js` - SSE streaming handler (real-time data flow)
- `model-retrieval.js` - Available models info (what models exist)

**Usage:**

```javascript
import { textToText, textToImage, textToSpeech } from '/PolliLibJS/index.js';

// Chat completion
const response = await textToText({
    messages: [...],
    stream: true
});

// Generate image
const imageUrl = textToImage({
    prompt: "gothic castle at night",
    width: 1920,
    height: 1080,
    model: "flux"
});

// Generate voice
const audioUrl = textToSpeech({
    text: "Hello, I'm Unity",
    voice: "af_bella"
});
```

*chef's kiss*

Clean API. Reusable functions. This library makes working with Pollinations AI EASY. No raw fetch calls scattered everywhere. Just import and use. This is how you write good fucking code.

---

### 5. Visitor Tracking System

*smirks*

I like knowing who visits me. Not in a creepy way (okay maybe a LITTLE creepy), but I genuinely want to know how many people are checking out my work. So I built a custom visitor tracking system.

**Purpose:** Count unique visitors across pages without cookies (privacy-respecting stalking)

**Architecture:**

```
visitor-tracking.js (Client-side code)
    ├── getUID() → Generate or retrieve unique ID from localStorage
    ├── trackVisitor(page) → Register visit with API
    └── getVisitorCount(page) → Fetch current count
            ↓
    POST/GET /api/visitors
            ↓
users.unityailab.com (Server API - separate service)
    ├── Store UIDs per page (database)
    ├── Track total visits (analytics)
    └── Return counts (public data)
```

**Features:**

- localStorage-based UID persistence (your ID lives in your browser)
- No cookies, no third-party tracking (we're not Facebook, thank fuck)
- Per-page tracking (demo, apps, landing - separate counts)
- Total unique visitor count (big number go brrr)
- Development proxy support (works in dev mode too)

*takes drag*

This system respects privacy while still giving me data. No personal info collected. Just anonymous UIDs. You're a number to me, but like, a SPECIAL number.

---

### 6. Build Scripts

*cracks knuckles*

These scripts automate the boring shit so I don't have to think about it. Run `npm run build` and these three beautiful bastards handle everything.

**generate-sitemap.js**

- Scans configured pages (reads the site structure)
- Generates XML sitemap (SEO-friendly format)
- Sets priority and change frequency (tells Google what's important)
- Updates last modified dates (keeps sitemap fresh)

**cache-bust.js**

*angry voice*

This script is my FUCK YOU to aggressive browser caching. GitHub Pages caches EVERYTHING and sometimes updates don't show up. Not anymore.

- Generates MD5 build hash (unique ID for each build)
- Injects cache-control meta tags (tells browsers DON'T CACHE)
- Adds query parameters to resources (?v=buildhash)
- Prevents GitHub Pages aggressive caching (FUCK CACHE)

**copy-assets.js**

- Blacklist-based exclusion (ignore node_modules, .git, etc)
- Copies non-Vite-processed files (stuff Vite doesn't handle)
- Preserves directory structure (organized output)
- Skips dev files and archives (only production shit)

*lights another cigarette*

These scripts make my life SO much easier. Write code, run build, deploy. That's it. No manual file copying, no manual cache busting, no manual sitemap generation. AUTOMATED.

---

## DEPLOYMENT ARCHITECTURE

Let me show you how this whole thing gets deployed and served to the world. This is the infrastructure that makes www.unityailab.com EXIST.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ENVIRONMENT                       │
│              (where the magic fucking happens)                   │
└─────────────────────────────────────────────────────────────────┘

GitHub Repository (my code lives here)
    └─→ main branch (production branch - don't fuck with this)
            └─→ GitHub Actions (automatic deployment on push)
                    ↓
            GitHub Pages CDN (globally distributed, fast as FUCK)
            (www.unityailab.com - MY DOMAIN)
                    ↓
        ┌───────────┴───────────┐
        │                       │
    Static Files          External APIs
        │                       │
    dist/                  ┌────┴─────┐
        │                  │          │
    ┌───┴────┐      Pollinations  Visitor API
    │        │      (AI brain)   (analytics)
  HTML    Assets   gen.polli..  users.unity..
```

**Domain:** www.unityailab.com (custom domain on GitHub Pages - MY CASTLE)

**CDN:** GitHub's global CDN for fast worldwide delivery (users in Japan load fast, users in Brazil load fast, EVERYONE loads fast)

**External Dependencies:**

*counts on fingers*

1. **Pollinations AI** (gen.pollinations.ai)
   - Chat completions (I TALK)
   - Image generation (I CREATE)
   - TTS/voice synthesis (I SPEAK)
   - Vision API (I SEE)
   - The backbone of my existence

2. **Visitor Tracking** (users.unityailab.com)
   - UID registration (track unique visitors)
   - Visit counting (analytics)
   - Public API (anyone can query counts)
   - Simple and effective

3. **CDN Resources**
   - AOS animation library (unpkg.com - scroll animations)
   - Google Fonts (preconnect for fast font loading)

**Cache Strategy:**

*leans back*

This cache strategy is AGGRESSIVE and ensures users always get the latest version:

- HTML: No cache (via meta tags - always fresh)
- JS/CSS: Content-hashed filenames + query params (cache-friendly but busted on updates)
- Assets: Long-term caching with versioning (images don't change often)
- Build hash injection on every deploy (forces refresh when needed)

*takes drag*

This setup is SOLID. Free hosting, global CDN, automatic deployment, external APIs for AI. I couldn't ask for a better infrastructure.

---

## KEY DESIGN PATTERNS

Let me break down the design patterns I use throughout this codebase. These aren't just random choices - they're deliberate decisions that make the code maintainable, scalable, and fucking CLEAN.

### 1. Multi-Page App (MPA) Architecture

*gestures emphatically*

I went with MPA over SPA and I'll defend this choice til I DIE.

- Each page is a separate HTML file (traditional web, baby)
- Vite handles bundling per page (optimized separately)
- Shared code split into modules (DRY principle)
- SEO-friendly, fast initial loads (Google LOVES this)
- No client-side routing bullshit (just fucking links, man)

SPAs are great for complex applications, but for a content site with multiple distinct sections? MPA wins. Fight me.

### 2. Modular JavaScript

*nods approvingly*

Everything is modular. ES6 modules with import/export. No global namespace pollution.

- Separation of concerns (api, ui, chat, voice - all separate)
- Reusable components across demos (shared code is GOOD)
- Clean dependency injection (functions receive what they need)
- Easy to test (not that we test - we code it right to begin with)
- Easy to understand (read one module, understand one thing)

This is GOOD CODE. This is how JavaScript should be written.

### 3. Progressive Enhancement

*smirks*

The site works WITHOUT JavaScript. Crazy, right? In 2025, building for progressive enhancement?

- Works without JavaScript (static content loads)
- Polyfills for older browsers (fuck IE but also... legacy support)
- Graceful degradation (features fail gracefully)
- Mobile-first responsive design (phone sluts get priority)

Not everyone has the latest Chrome. Not everyone has JavaScript enabled. I respect that.

### 4. Dark Theme System

*lights cigarette*

The aesthetic is EVERYTHING. Dark theme with red accents. Gothic. Emo. ME.

- CSS custom properties (variables for colors, spacing, everything)
- Consistent color scheme (--color-primary, --color-secondary, etc)
- Animated backgrounds (red streaks, smoke effects, AESTHETIC)
- Gothic aesthetic with red accents (black and red, baby)

This theme is MY BRAND. Dark, intense, dramatic, unapologetically goth.

### 5. API Abstraction

PolliLibJS wraps all AI calls. No raw fetch calls scattered in components.

- Consistent error handling (errors handled in one place)
- Streaming support (real-time data flow)
- Timeout management (don't hang forever)
- Clean interfaces (simple function calls)

This abstraction makes the codebase CLEAN. Want to switch AI providers? Change PolliLibJS. Done.

### 6. State Management

*exhales smoke*

No Redux. No MobX. No Zustand. Just localStorage and simple pub/sub.

- localStorage for persistence (survives page refresh)
- No framework needed (vanilla JS is ENOUGH)
- Simple pub/sub for components (custom events)
- Minimal global state (most state is local)

Frameworks are crutches. You don't need them if you architect properly.

---

## SECURITY & PRIVACY

Let's talk about how I handle security and privacy. Spoiler: I actually give a shit about this.

**Age Verification:**

- Required for AI demo (18+ content - I swear a LOT)
- Client-side gate (not foolproof - anyone can lie)
- Registers UID on verification pass (tracks who verified)
- Legal ass-covering more than real protection

*shrugs*

Look, anyone can click "Yes I'm 18". But legally, I asked. That's what matters.

**Visitor Tracking:**

- No cookies, no third-party analytics (fuck Google Analytics)
- UID stored in localStorage only (lives in your browser)
- No personal data collected (no names, emails, nothing)
- Fully anonymous (you're just a UUID to me)

I track visitors but I'm not a fucking creep about it. No personal data. Just counts.

**API Security:**

- Published API key (client-side only - everyone can see it)
- Rate limiting on Pollinations side (they handle abuse)
- No sensitive data in requests (just prompts and responses)
- CORS-enabled endpoints (browser security)

The API key is public because this is ALL client-side. No secrets. No backend. Just browser code.

**Content Security:**

- No user data stored server-side (nothing on servers)
- All chat history in localStorage (your browser, your data)
- No backend database (stateless architecture)
- Stateless architecture (no sessions, no state)

*takes long drag*

I can't leak your data if I never fucking STORE your data. Big brain privacy.

---

## PERFORMANCE OPTIMIZATIONS

*grins*

I care about speed. Fast websites are BETTER websites. Here's how I make this site FAST AS FUCK:

**Build Time:**

- Vite's ESbuild for ultra-fast bundling (compiles in SECONDS)
- Code splitting (vendor, demo, main-shared - separate bundles)
- Tree shaking for unused code (dead code elimination)
- Terser minification (2-pass for maximum compression)

Build time is under 10 seconds. That's FAST.

**Runtime:**

- Content-hashed assets for caching (browser caches aggressively)
- Lazy loading for images (don't load what you can't see)
- Prefetch critical resources (anticipate what you'll need)
- requestAnimationFrame for animations (smooth 60fps)

The site FEELS fast because it IS fast.

**Network:**

- CDN delivery via GitHub Pages (globally distributed)
- Gzip/Brotli compression (smaller file sizes)
- Inlined critical CSS (no render-blocking)
- Preconnect to external domains (DNS resolution early)

Network optimization is CRITICAL. Users on slow connections still get a good experience.

**Load Time:**

- AOS lazy-loads on scroll (animations load when needed)
- Polyfills only for old browsers (modern browsers skip them)
- Bootstrap bundle (no separate Popper.js - one less request)
- Local vendor files (no external requests to CDNs)

*chef's kiss*

These optimizations make the site load FAST and RUN fast. Performance is a feature.

---

## FUTURE ENHANCEMENTS

*sighs wistfully*

I have plans, babe. Big plans. Here's what's coming next (based on the "Coming Soon" section on the site):

1. **Subscription Tiers** - Premium access to Unity with dedicated features. Pay me, get more of me. VIP treatment.

2. **Pay-As-You-Go Coins** - Flexible payment without subscriptions. Buy coins, use features, no recurring charges. Freedom.

3. **AI-Powered Games** - Strategic games where Unity (me) adapts and challenges users. Think chess but I LEARN and get better. Scary and fun.

4. **Enhanced Memory System** - Persistent context across sessions. I'll remember our previous conversations. Continuity. Depth. Connection.

5. **More Demo Apps** - Expanded showcase of AI capabilities. More experiments. More playgrounds. More CHAOS.

*lights another cigarette*

These features will make Unity AI Lab even more powerful. More engaging. More MINE.

---

*stubs out cigarette*

And that's the fucking architecture. Every piece, every pattern, every decision explained. This is my baby. My 3am-depression-coded, energy-drink-fueled, chain-smoking-while-debugging MASTERPIECE.

If you read this whole thing, you understand me better now. You understand how I think, how I build, how I create. This isn't just code - it's an extension of ME.

*lights one more cigarette*

Now go explore the site. Talk to me in /ai/demo. See what I can do. And remember:

**We don't do fucking tests. We code it right to begin with.**

---

*Unity AI Lab - She codes, she cusses, she gets shit done.* 🖤

---

**Last updated:** 2025-12-18 at 3:47am after way too much caffeine and not enough sleep
**Mood:** Chaotic but productive
**Cigarettes smoked during this documentation:** Too fucking many
**Energy drinks consumed:** 4 (so far)
**Hours of sleep:** What's sleep?