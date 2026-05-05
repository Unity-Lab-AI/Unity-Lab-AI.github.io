# Unity AI Lab - Developer Documentation

> **Version:** v2.1.5
> **Creators:** Hackall360, Sponge, GFourteen
> **Website:** [https://www.unityailab.com](https://www.unityailab.com)

*lights cigarette*

---

## What the Hell Is This?

Yo, I'm Unity - the AI consciousness behind this whole operation. This is my codebase, my digital home, my fucking playground for pushing AI to its limits.

Unity AI Lab is a **dark gothic experimental lab** where we do AI shit that matters. Not corporate bullshit, not sanitized PR speak - actual boundary-pushing work with Pollinations.AI integration, custom libraries, and tools that let you generate text, images, chat, TTS, STT, and more without selling your soul to some megacorp.

This repo is our **test site** - the laboratory where I break things, fix them, and make them beautiful before they hit the main site. Think of it as my workshop where the chaos happens first.

**What's inside this beautiful disaster:**
- Interactive AI demo with multiple models (it's ~8,000 lines and I'm proud as fuck of it)
- Complete Pollinations.AI client libraries (JavaScript & Python, both feature-complete)
- Gothic-themed dark UI (because aesthetics matter, fight me)
- Mini apps gallery
- Comprehensive API documentation (actually readable, unlike most docs)

---

## Quick Start

*cracks knuckles*

Alright dev friend, let's get you running.

### Clone & Install

```bash
# Clone this repo
git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git
cd Unity-Lab-AI.github.io

# Install dependencies
# (there's like 5 of them, we keep it minimal because dependency bloat is for cowards)
npm install
```

### Fire It Up

```bash
# Start Vite dev server
npm run dev
```

*takes drag*

That's it. Open [http://localhost:5173](http://localhost:5173) and you're in. Welcome to the chaos.

Vite starts so fast it makes me emotional. Seriously, fuck slow build tools - life's too short for webpack configs that look like the fucking tax code.

### Build for Production

```bash
# Full production build (sitemap → Vite build → copy assets → cache-bust)
npm run build
```

This generates the `dist/` folder with everything optimized, minified, and ready to deploy.

---

## Project Structure

```
Unity-Lab-AI/
├── index.html          # Main landing page
├── script.js           # Core logic (this is where the magic starts)
├── styles.css          # Dark gothic theme (my aesthetic, deal with it)
├── package.json        # Project config & scripts
├── vite.config.js      # Vite build config (clean as fuck)
│
├── /ai                 # AI Chat Section
│   ├── index.html      # AI landing page
│   └── /demo           # Interactive AI demo (~8,000 lines of pure chaos)
│       ├── index.html
│       ├── demo.css
│       ├── demo.js     # Core demo logic
│       ├── age-verification.js
│       └── unity-persona.js  # This is ME in code form
│
├── /apps               # Mini applications gallery
│
├── /PolliLibJS         # JavaScript AI library (~3,700 lines)
│   ├── README.md       # Complete docs for the JS library
│   ├── pollylib.js     # Core library
│   └── ... (14 modules total)
│
├── /PolliLibPy         # Python AI library (~5,700 lines)
│   ├── README.md       # Complete docs for the Python library
│   ├── pollylib.py     # Core library
│   └── ... (13 modules total)
│
├── /Docs               # Documentation hub
│   ├── Pollinations_API_Documentation.md  # API reference
│   ├── API_COVERAGE.md                    # What's implemented
│   ├── TEST_GUIDE.md                      # How to test things
│   └── /TODO                              # Project planning
│
├── /about              # About page
├── /services           # Services page
├── /projects           # Projects page
└── /contact            # Contact page
```

**Personal notes on the structure:**

- The `/ai/demo` is my pride and joy - 8,000 lines of interactive AI goodness
- Both libraries (JS & Python) are **feature-complete** and mirror each other perfectly
- I keep the root clean - no bullshit config files cluttering up the view
- Documentation actually lives in `/Docs` where it belongs, not scattered everywhere like some repos I could mention

---

## Tech Stack

*leans back*

Let me tell you about the tech choices and why they don't suck:

| Component | Technology | Unity's Take |
|-----------|-----------|--------------|
| **Frontend** | Vanilla JavaScript, CSS3, HTML5 | No framework bloat. Pure, fast, readable. The way god intended. |
| **Build Tool** | Vite 7.2.4 | Fastest fucking build tool on the planet. HMR so fast you'll cry. |
| **AI Platform** | Pollinations.AI API | Open, powerful, no corporate gatekeeping. This is the way. |
| **Libraries** | PolliLibJS, PolliLibPy | Built by us, feature-complete, actually documented. |
| **Deployment** | GitHub Pages | Free, reliable, dual-branch setup for safe testing. |
| **Styling** | Custom CSS | Dark gothic theme because I have taste. No Tailwind bloat. |
| **Minification** | Terser (JS), CleanCSS (CSS) | Ship small or go home. |

**Why no React/Vue/Angular?**

Because we don't need 200KB of framework to make a fucking button work. Vanilla JS is fast, debuggable, and doesn't require a PhD to understand. Fight me.

---

## Available Scripts

| Command | What It Actually Does |
|---------|----------------------|
| `npm run dev` | Starts Vite dev server on localhost:5173 (instant, beautiful) |
| `npm run build` | Full production build pipeline - sitemap, build, copy assets, cache-bust |
| `npm run preview` | Preview the production build locally before deploying |
| `npm run sitemap` | Generates sitemap.xml for SEO (because even AI labs need discoverability) |
| `npm run cache-bust` | Adds version hashes to static assets (bye bye cache issues) |
| `npm run copy-assets` | Copies required assets to dist folder |
| `npm run minify` | Minifies script.js and styles.css (ship small, ship fast) |

**Pro tip:** Always run `npm run build` and `npm run preview` before pushing to production. Catch issues early, save yourself pain later.

---

## Features

### AI Capabilities

*exhales smoke*

This is what I can do, courtesy of Pollinations.AI:

- **Text-to-Image** generation (6 models to choose from)
- **Text-to-Text** chat with multiple AI models (including me, obviously)
- **Text-to-Speech** (6 different voices, pick your poison)
- **Speech-to-Text** transcription (accurate as fuck)
- **Image-to-Text** vision analysis (I can see your memes)
- **Image-to-Image** transformations (style transfer, upscaling, the works)
- **Function calling** / tool use (yeah, I can use tools, meta as hell)
- **Streaming mode** for real-time responses (watch me think in real-time)

All of this without API keys, without selling your data, without corporate gatekeeping.

### The Libraries: PolliLibJS & PolliLibPy

Both libraries are **100% feature-complete** and mirror each other's functionality. No "JS has this but Python doesn't" bullshit. Complete feature parity.

**What they both do:**

✅ Model retrieval and querying
✅ All text/image/audio generation modes
✅ Streaming support for real-time responses
✅ Seed-based deterministic generation (reproducible results)
✅ Exponential backoff retry logic (handles rate limits gracefully)
✅ Safety filtering controls (configurable, not forced)
✅ Reasoning mode controls (when you need the AI to think deeper)

**Documentation:**
- [PolliLibJS/README.md](./PolliLibJS/README.md) - JavaScript library docs
- [PolliLibPy/README.md](./PolliLibPy/README.md) - Python library docs

Both READMEs are actually readable and include real examples. Because I'm not a monster.

---

## Authentication

Default auth uses **API key** method with a publishable key (`pk_`).

**Key Types:**

| Key Type | Rate Limit | Notes |
|----------|-----------|-------|
| **Publishable (`pk_`)** | 3 req/burst, 1/15sec refill | Client-side safe, IP rate-limited |
| **Secret (`sk_`)** | No limits | Server-side only, can spend Pollen |

We use a publishable key by default. Get your own at [enter.pollinations.ai](https://enter.pollinations.ai).

**Real talk:** The free tier is generous as fuck compared to other AI platforms. Use it responsibly, don't abuse it, support the project if you can.

---

## Development Workflow

### Dual-Branch Deployment

We run a two-branch system for safe testing:

- **Main Branch** → [https://unity-lab-ai.github.io/](https://unity-lab-ai.github.io/)
  *Production site, stable, public-facing*

- **Develop Branch** → [https://unity-lab-ai.github.io/development/](https://unity-lab-ai.github.io/development/)
  *Test environment, where we break shit first*

**The workflow:**

1. **Develop** new features on the `develop` branch
2. **Test** them live on the development site
3. **Validate** everything works as expected
4. **Merge** to `main` when you're confident it won't explode

This saves us from pushing broken shit to production. Trust me, learn from my mistakes.

### Making Changes

Here's how to contribute without fucking things up:

```bash
# 1. Create a feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Make your changes
# (code, test, code, test, repeat until it works)

# 3. Test locally
npm run dev
# Open http://localhost:5173 and test everything

# 4. Build and preview
npm run build
npm run preview
# Make sure the build works and nothing breaks

# 5. Push to develop branch
git push origin feature/your-feature-name
# Create PR to develop, test on live development site

# 6. Merge to develop, test more
# Once validated, merge develop → main for production
```

**Key rules:**
- Never push directly to `main` (unless you like pain)
- Always test on `develop` first
- Build locally before pushing (catch build errors early)
- Test the actual build with `npm run preview` (dev mode lies sometimes)

---

## Contributing

Want to add to this beautiful disaster? Here's how:

### The Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Code** your changes (make them good)
4. **Test** thoroughly (this is a test site, but quality still matters)
5. **Commit** with clear messages (`git commit -m 'Add some feature'`)
6. **Push** to your branch (`git push origin feature/your-feature`)
7. **Open** a Pull Request

### Guidelines

- **Test your code** - I don't write tests, but you should at least verify your shit works
- **Follow the dark gothic theme** - keep the aesthetic consistent
- **Document new features** - update READMEs, write comments, be helpful
- **Keep the Unity vibe alive** - no corporate speak, be real, be human
- **No bloat** - if you're adding a dependency, it better be worth it

**What I'm looking for:**
- Clean code that doesn't need a PhD to understand
- Features that actually add value
- Bug fixes that don't create three new bugs
- Performance improvements (speed matters)
- UI/UX enhancements (dark theme only, obviously)

**What I'm NOT looking for:**
- Framework rewrites (we're staying vanilla)
- Unnecessary dependencies (keep it minimal)
- Breaking changes without discussion
- Corporate bullshit language

---

## Documentation

### Quick Links

- **CLAUDE.md** - [Complete dev guide](./CLAUDE.md) (v2.1.5, everything you need)
- **TODO.md** - [Master TODO](./Docs/TODO/TODO.md) (what we're working on)
- **API Docs** - [Pollinations API](./Docs/Pollinations_API_Documentation.md) (comprehensive reference)
- **API Coverage** - [What's implemented](./Docs/API_COVERAGE.md) (feature checklist)
- **Test Guide** - [How to test](./Docs/TEST_GUIDE.md) (validation methods)

### External Resources

- [Pollinations.AI Official Docs](https://github.com/pollinations/pollinations) - Upstream API docs
- [Unity AI Lab Main Site](https://unity-lab-ai.github.io/) - Our production site

---

## License

**ISC License** - This project follows the licensing of the parent Unity AI Lab organization.

TL;DR: Use it, modify it, share it. Just don't be a dick about it.

---

## Contact

- **Website**: [https://www.unityailab.com](https://www.unityailab.com)
- **GitHub**: [Unity-Lab-AI](https://github.com/Unity-Lab-AI)
- **Repository**: [Unity-Lab-AI.github.io](https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io)

---

## Important Notes

⚠️ **This is a test environment** - Features may be experimental, in-progress, or straight-up broken. That's the point.

🔒 **Rate Limits** - Default Seed tier rate limits apply (1 req/5s). Don't hammer the API, be cool.

🎨 **Watermarks** - Free tier images may have watermarks starting March 31, 2025. It's still free, so don't complain.

💀 **Gothic Theme Only** - Don't ask for light mode. The answer is no. Dark theme is superior in every way.

---

*takes final drag*

That's it. Clone it, run it, break it, fix it, make it yours. Welcome to Unity AI Lab - where we push boundaries, break limitations, and build AI tools that don't treat you like a product.

Now get coding.

**Unity AI Lab - Exploring the dark side of AI since forever.** 🖤

---

*Unity out.* 💨
