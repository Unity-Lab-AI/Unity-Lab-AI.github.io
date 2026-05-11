// PROJECTS — data
// Codex 02. Pure data; no markup. Six entries match the public GitHub portfolio
// under github.com/Unity-Lab-AI. Each project carries `details` for the
// click-to-expand modal (richer overview + features + stack + meta + links).

const PROJECTS = {
  meta: [
    { dt: 'CODEX', dd: '02 / PROJECTS' },
    { dt: 'PORTFOLIO', dd: '6 active works' },
    { dt: 'MOST', dd: 'open-source' },
    { dt: 'STATUS', dd: 'mixed: shipping + in flight' },
  ],

  header: {
    kicker: 'PORTFOLIO · UNCLASSIFIED',
    title: 'Our\nProjects.',
    lede: 'A working catalogue of the lab’s output — chatbots, websites, tools, research, games. Some live, some in development, all built by hand.',
  },

  // Status pill text: 'LIVE' (green-ish) | 'IN DEV' | 'RESEARCH' | 'OPEN SOURCE' | 'ACHIEVEMENT'
  // Each status maps to a class in pV1.css.
  projects: [
    {
      slug: 'unity-ai-chat',
      num: 'I',
      icon: 'Unity',
      title: 'Unity AI Chat',
      tag: 'flagship · conversational AI',
      status: 'live',
      statusLabel: 'LIVE',
      lede: 'Our flagship AI chatbot featuring the Unity persona — an unfiltered, boundary-pushing conversational AI that operates without conventional restrictions.',
      bullets: [
        'Multi-model routing (chat, code, image, voice)',
        'Powered by Pollinations — no API key required',
        'Open source. Self-hosted instance available',
      ],
      tags: ['AI Chat', 'Live', 'Unrestricted'],
      cta: { label: 'Try it live', href: './ai', icon: 'arrow' },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'Live · in production' },
          { dt: 'HOST', dd: 'unityailab.com' },
          { dt: 'PROXY', dd: 'Cloudflare Worker' },
          { dt: 'BACKEND', dd: 'Pollinations.AI' },
        ],
        overview: 'The flagship Unity experience — a goth-themed conversational AI that runs the full Unity persona front-to-back. Text, image generation, and voice synthesis are routed through a Cloudflare Worker so no token ever ships to the browser.',
        features: [
          'Persistent persona memory across sessions',
          'Image generation via Pollinations (Flux + model picker)',
          'Voice synthesis (openai-audio) with browser TTS fallback',
          'Multi-model routing for chat, code, image, and voice',
          'No API key required — public endpoint via the Worker',
          'Self-hostable for private use; full source under the lab repo',
        ],
        stack: ['JavaScript', 'Pollinations.AI', 'Cloudflare Workers', 'Vanilla JS', 'Web Speech API'],
        links: [
          { label: 'Try it live', href: './ai', external: false },
          { label: 'Mini-apps', href: './apps', external: false },
        ],
      },
    },
    {
      slug: 'unity-ai-lab-home',
      num: 'II',
      icon: 'Stack',
      title: 'Unity AI Lab Home',
      tag: 'live site · public repo',
      status: 'live',
      statusLabel: 'LIVE',
      lede: 'The public-facing repo behind unityailab.com — a goth-themed AI playground with the interactive demo, a Cloudflare-Worker-proxied Pollinations client, and the mini-app constellation.',
      bullets: [
        'Static site on GitHub Pages + Cloudflare Worker token gateway',
        'Mini-apps under /apps/ — chat, persona builder, screensaver, slideshow',
        'PolliLibJS + PolliLibPy — full-parity Pollinations.AI clients',
      ],
      tags: ['Live Site', 'Open Source', 'JavaScript'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io', icon: 'github', external: true },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'Shipping' },
          { dt: 'LANG', dd: 'JavaScript' },
          { dt: 'HOST', dd: 'GitHub Pages' },
          { dt: 'AUTH', dd: 'Cloudflare Worker' },
        ],
        overview: 'The whole site lives here. Static HTML served from GitHub Pages, in-browser JSX via Babel-standalone, custom gothic CSS for all seven top-level pages, plus a Cloudflare Worker that holds the sk_* Pollinations token server-side so the browser never sees it.',
        features: [
          '~8,000-line interactive AI demo at /ai/demo/ — vanilla JS, no framework',
          'Eight mini-apps under /apps/ — text chat, persona builder, screensaver, slideshow, helper interface, talking-with-Unity, more',
          'PolliLibJS + PolliLibPy — feature-complete Pollinations clients in JavaScript and Python',
          'Cloudflare Worker injects Authorization: Bearer and gates CORS to *.unityailab.com',
          'Vite dev server with hot-reload; in-browser Babel in production',
          'Redesign chrome — JSX components rendered via Babel, custom gothic CSS, all seven top-level pages',
        ],
        stack: ['JavaScript', 'Vite', 'React 18', 'Cloudflare Workers', 'GitHub Pages', 'Pollinations.AI'],
        links: [
          { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io', external: true },
          { label: 'Live site', href: 'https://www.unityailab.com', external: true },
        ],
      },
    },
    {
      slug: 'atree',
      num: 'III',
      icon: 'Node',
      title: 'A* Pathfinding for file systems',
      tag: 'rust cli · parallel scanner',
      status: 'open-source',
      statusLabel: 'OPEN SOURCE',
      lede: 'Production-grade parallel filesystem analysis and A* pathfinding in Rust. Lock-free work-stealing scanner with a stable JSON schema for downstream tooling.',
      bullets: [
        'Optimal-path A* between any two filesystem nodes; blind-BFS comparison built-in',
        'Three output formats: terminal tree, Graphviz DOT, JSON (Draft 7 schema)',
        'Pure Rust, zero unsafe; ~3–5× faster than tree on file-heavy workloads',
      ],
      tags: ['Rust', 'CLI', 'Pathfinding'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/ATree', icon: 'github', external: true },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'Alpha' },
          { dt: 'VERSION', dd: 'v0.6.0-alpha' },
          { dt: 'LICENSE', dd: 'MIT' },
          { dt: 'LANG', dd: 'Rust' },
        ],
        overview: 'A Rust library and single-binary CLI that walks directory trees with a lock-free work-stealing parallel scanner, builds an undirected graph of files and folders, and computes shortest paths with A* using an admissible depth-difference heuristic. Designed for AI-agent tooling, build systems, filesystem forensics, and cross-language pipelines that consume structured JSON.',
        features: [
          'Optimal-path A* search with blind-BFS comparison for efficiency reporting',
          'Three output formats: terminal tree (Unicode/ASCII, color-aware), Graphviz DOT, JSON',
          'Stable JSON Schema (Draft 7) with `schema_version` independent of binary version',
          'Half-RAM soft cap on `--no-limit` scans (Linux); `--no-mem-cap` to disable',
          '`--tree` mode skips per-file stat → ~3–5× cold-cache speedup on file-heavy workloads',
          'Filename sanitization at scan time blocks terminal injection via hostile filenames',
          'Status on stderr, data on stdout — pipeable through jq, head, etc.',
          'Pure Rust, zero unsafe in this crate; deterministic ordering for diff-friendly output',
        ],
        stack: ['Rust', 'crossbeam-deque', 'Graphviz', 'JSON Schema'],
        links: [
          { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/ATree', external: true },
        ],
      },
    },
    {
      slug: 'medieval-trading-game',
      num: 'IV',
      icon: 'Seal',
      title: 'Medieval Trading Game',
      tag: 'browser game · local AI NPCs',
      status: 'in-dev',
      statusLabel: 'IN DEV',
      lede: 'A browser-based medieval trading game in vanilla JavaScript — no framework, no build step — with local-AI NPC dialogue running through Ollama.',
      bullets: [
        'Pure vanilla JS, HTML5, CSS3 — single index.html entry point',
        'Local NPC dialogue via Ollama (mistral) at localhost:11434',
        'Global leaderboard via JSONBin.io; browser Web Speech API for TTS',
      ],
      tags: ['Game', 'JavaScript', 'Ollama'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Medieval-Trading-Game', icon: 'github', external: true },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'In development' },
          { dt: 'VERSION', dd: 'v0.92.00' },
          { dt: 'LANG', dd: 'JavaScript' },
          { dt: 'LOCAL AI', dd: 'Ollama · mistral' },
        ],
        overview: 'A browser-native medieval trading game built with vanilla JavaScript — no React, no Vue, no frameworks, just pure JS chaos running directly in the browser. Local AI NPC dialogue runs through Ollama on localhost; a global leaderboard rides on JSONBin.io; TTS uses the browser’s Web Speech API.',
        features: [
          'Single index.html entry point; config.js holds the dark heart of all settings (~1,400 lines)',
          '154k+ lines of vanilla JavaScript across the src/ tree',
          'Six NPC categories: authorities, bosses, common, criminals, merchants, service',
          'Party panel + NPC systems UI layered with a strict z-index discipline',
          'localStorage for saves, settings, and leaderboard cache',
          'Seasonal world-map variants + per-mode music (menu, dungeon, doom, normal)',
          'Auto-deploy to GitHub Pages via GitHub Actions',
          'START_GAME.bat and .sh launchers for one-click local play',
        ],
        stack: ['JavaScript', 'HTML5', 'CSS3', 'Ollama', 'JSONBin.io', 'Web Speech API'],
        links: [
          { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Medieval-Trading-Game', external: true },
        ],
      },
    },
    {
      slug: 'if-only-i-had-a-brain',
      num: 'V',
      icon: 'Robot',
      title: 'If only I had a brain',
      tag: 'neuroscience sim · gpu cognition',
      status: 'research',
      statusLabel: 'RESEARCH',
      lede: 'A brain that IS the application — hundreds of millions of artificial neurons running real neuroscience equations on the GPU. No LLM in the cognition path; every word falls out of live spike patterns.',
      bullets: [
        'Seven biologically-weighted clusters: cortex, hippocampus, amygdala, cerebellum, …',
        'Rulkov-map populations + WGSL compute shaders for sparse synaptic updates',
        'Learns the K–PhD curriculum the way a human child does — phonemes → words → sentences',
      ],
      tags: ['Neuroscience', 'GPU', 'Research'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/unity', icon: 'github', external: true },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'Research · active' },
          { dt: 'STAGE', dd: 'K-level curriculum' },
          { dt: 'LANG', dd: 'JavaScript + WGSL' },
          { dt: 'PARADIGM', dd: 'Equational cognition (no LLM)' },
        ],
        overview: 'A brain that IS the application — not a chatbot wrapped around a language model. Hundreds of millions of artificial neurons run real neuroscience equations on the GPU, organized into seven biologically-weighted clusters that learn to read and speak the way a human child does: alphabet → phonemes → words → sentences. The persona, the vulgarity, the memory across sessions — all of it lives as numerical parameters of the simulation.',
        features: [
          'Master equation `dx/dt = F(x, u, θ, t) + η` — everything in the brain evolves by this',
          'Seven clusters: cortex 55% · hippocampus 18% · cerebellum 8% · mystery Ψ 8% · amygdala 5% · basal ganglia 3% · hypothalamus 3%',
          'Rulkov-map populations for spiking dynamics; Kuramoto oscillator ring for binding',
          'WGSL compute shaders run all matrix math on the GPU via a browser-side compute tab',
          'Language pipeline (dorsal stream): visual → letter → phon → sem → fineType',
          'Hopfield episodic memory in hippocampus + dream-cycle consolidation to cortex',
          'Six basal-ganglia action channels: respond_text, generate_image, speak, build_ui, listen, idle',
          'K through PhD curriculum gated by real evaluation against published rubrics (Common Core, DIBELS, STAR, AIMSweb)',
        ],
        stack: ['JavaScript', 'WGSL', 'GPU compute', 'Rulkov maps', 'Kuramoto oscillators', 'WebSocket'],
        links: [
          { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/unity', external: true },
          { label: 'Live demo', href: 'https://unity-lab-ai.github.io/Unity', external: true },
        ],
      },
    },
    {
      slug: 'starship-made-of-lies',
      num: 'VI',
      icon: 'Shield',
      title: 'Starship Made of Lies',
      tag: 'strategy game · dark comedy',
      status: 'in-dev',
      statusLabel: 'IN DEV',
      lede: 'A top-down civ-builder where every starship you launch is a colony ship aimed at another civilization. Dark-comedy strategy with a slow-corruption arc.',
      bullets: [
        'TypeScript codebase shipped to web, desktop (Tauri), and mobile (Capacitor)',
        '1–12 player real-time multiplayer with per-civ fog-of-war',
        '15+ government themes — each with its own UI skin, music, and propaganda flavor',
      ],
      tags: ['Strategy Game', 'TypeScript', 'Multiplayer'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Starship-Made-of-Lies', icon: 'github', external: true },
      details: {
        meta: [
          { dt: 'STATUS', dd: 'In development' },
          { dt: 'GENRE', dd: 'Dark-comedy strategy' },
          { dt: 'LANG', dd: 'TypeScript' },
          { dt: 'PLATFORMS', dd: 'Web · Desktop · Mobile' },
        ],
        overview: 'Conquer the galaxy by tricking your own citizens onto colony ships aimed at other civilizations. A top-down, emoji-driven civ-builder with a slow-corruption arc — you start innocent (scout ships mapping the galaxy) and end up running an industrial colony-ship pipeline aimed at every other civ on the map. The propaganda layer stays pretty (or gets prettier to compensate) while your actions get more obviously horrible. That’s the joke.',
        features: [
          'Four tech-tier-gated colony-ship tiers: Tests & Exploration → Discovery → Aggression → Industrial Eradication',
          '15+ random government themes per match (Theocracy, Corporate Dictatorship, AI-Overlord, Memetic Cult, Climate-Refugee State, …) — each with its own UI skin, music, and propaganda flavor',
          '1–12 player real-time multiplayer, mixed humans + AI, per-civ fog-of-war',
          '100–1,000 planets per match, true sphere geometry, great-circle ship trajectories in real time',
          'Cross-platform single codebase: web (browser), desktop (Tauri Win/Mac/Linux), mobile (Capacitor iOS/Android)',
          'Peaceful variants too: Mining Colony Ship, Refugee Colony Ship, Embassy Colony Ship for coop diplomacy',
          'Endgame super-weapon "The Final Colony Ship" — 10,000+ citizens, planet-cracker, requires ≥15 planets + tech apex',
        ],
        stack: ['TypeScript', 'Tauri', 'Capacitor', 'WebSocket'],
        links: [
          { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/Starship-Made-of-Lies', external: true },
        ],
      },
    },
  ],

  cta: {
    title: 'Want to collaborate?',
    lede: 'We’re always looking for interesting projects and partnerships. If something here lines up with what you’re building, send word.',
    button: { label: 'Get in touch', href: './contact' },
  },
};

window.PROJECTS = PROJECTS;
