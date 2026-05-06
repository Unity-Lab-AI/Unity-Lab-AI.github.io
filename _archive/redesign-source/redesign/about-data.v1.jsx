// Shared content for all four About-page directions.
// Heavy-rewritten copy in the gothic landing voice (Cormorant ledes, mono kickers,
// no marketing hedge). Source of truth — all four artboards read from this file.

const ABOUT = {
  // ------------------------------------------------------------- HEADER
  header: {
    kicker: 'CODEX · 00 · ABOUT',
    title: 'A small lab,\nbuilt on stubbornness.',
    lede:
      'Unity AI Lab is four people in a workshop with the lights off and the soldering iron on. ' +
      'We build AI that does not apologise for being useful — and we publish what we learn so you ' +
      'can do the same.',
  },

  // ------------------------------------------------------------- STATS
  // Treatment: keep the GitHub trio, add lab-flavoured drill-downs.
  // Numbers live in `about.js` as `commits-count` / `stars-count` / `forks-count`;
  // we render placeholders here that the existing JS can target with the same IDs.
  stats: [
    {
      key: 'commits',
      id: 'commits-count',
      label: 'Commits',
      kicker: 'I',
      caption: 'public history, every keystroke',
      drill: {
        title: 'Commits',
        lede: 'Every public change, every revert, every late-night fix.',
        rows: [
          ['Top contributor', 'hackall360 / SpongeBong'],
          ['Largest repo', 'unity-jailbreak (engine)'],
          ['Most-edited file', 'unity-prompt.md'],
          ['Avg. message length', '38 characters — terse on purpose'],
        ],
        link: { label: 'See raw activity on GitHub', href: 'https://github.com/Unity-Lab-AI' },
      },
    },
    {
      key: 'stars',
      id: 'stars-count',
      label: 'Stars',
      kicker: 'II',
      caption: 'people who bookmarked the work',
      drill: {
        title: 'Stars',
        lede: 'A blunt vote of confidence from strangers.',
        rows: [
          ['Top-starred repo', 'unity-jailbreak'],
          ['Recent surge', 'agentic-shell (Q1 2026)'],
          ['Most-starred topic', 'prompt-engineering'],
          ['Quietest underdog', 'archive-tools — useful, ignored'],
        ],
        link: { label: 'Browse all repos', href: 'https://github.com/Unity-Lab-AI' },
      },
    },
    {
      key: 'forks',
      id: 'forks-count',
      label: 'Forks',
      kicker: 'III',
      caption: 'copies in the wild, pulling weight',
      drill: {
        title: 'Forks',
        lede: 'Where our work has been carried somewhere new.',
        rows: [
          ['Most-forked repo', 'unity-jailbreak'],
          ['Active downstream', '40+ public, dozens private'],
          ['Notable derivative', 'community persona library'],
          ['Policy', 'No takedowns. Fork freely; credit if you want.'],
        ],
        link: { label: 'See network graph', href: 'https://github.com/Unity-Lab-AI' },
      },
    },
  ],

  // ------------------------------------------------------------- WHO WE ARE
  manifesto: {
    kicker: 'CHAPTER · I',
    title: 'Who we are',
    paragraphs: [
      'We are tinkerers. We come from sysadmin closets, finance back-offices, embedded benches, ' +
      'and forum threads at three in the morning. We are not a startup. We are not a movement. ' +
      'We are four people who wanted a lab that did not ask permission.',
      'We thrive in the gray. The interesting questions live where the documentation runs out — ' +
      'where a model bends, where a sandbox leaks, where a prompt does something its author never ' +
      'intended. That is the territory we map.',
    ],
    pull:
      '“We do not just use AI. We challenge it, break it, rebuild it, and push it further than ' +
      'anyone thought reasonable.”',
    pullAttr: 'INTERNAL CREED · 2024',
  },

  // ------------------------------------------------------------- WHAT WE DO
  expertise: [
    {
      key: 'prompt',
      icon: 'Unity',
      kicker: 'I',
      title: 'Prompt Engineering',
      lede: 'Coaxing capability out of models that were told not to give it.',
      body: [
        'Prompt engineering is the lockpicking of our trade. Not novelty hacks — durable, repeatable ' +
        'techniques that survive model updates and produce consistent output under pressure.',
        'We treat the prompt as code. Versioned, tested, diffed, reviewed. Every meaningful Unity ' +
        'capability traces back to a prompt that someone refused to leave alone.',
      ],
      bullets: [
        'Persona stacks with explicit role boundaries',
        'Adversarial prompt suites for regression testing',
        'Public jailbreak archives, dated and attributed',
      ],
    },
    {
      key: 'sysadmin',
      icon: 'Wringer',
      kicker: 'II',
      title: 'System Administration',
      lede: 'The unsexy plumbing that keeps the lights on.',
      body: [
        'Self-hosted everything we can. Reverse proxies, signed certs, off-site backups, recovery ' +
        'drills that actually run. The reason the site stays up is not magic — it is checklists, ' +
        'maintained for years, by hand.',
        'When a service breaks at 3 AM we want logs, not surprises. So we build for the 3 AM us.',
      ],
      bullets: [
        'Self-hosted Pollinations + custom orchestration',
        'Hardened Linux deployments, audit-grade observability',
        'Recovery drills run quarterly, not aspirationally',
      ],
    },
    {
      key: 'ethical',
      icon: 'Shield',
      kicker: 'III',
      title: 'Ethical Hacking',
      lede: 'Probing AI systems the way attackers actually do.',
      body: [
        'Penetration testing for prompt-driven systems. We map attack surfaces that traditional ' +
        'security tooling misses entirely: prompt injection, tool-call abuse, persona poisoning, ' +
        'context exfiltration.',
        'Disclosure is responsible by default and public when ignored. We document findings; we ' +
        'name names when we have to.',
      ],
      bullets: [
        'Red-team engagements for AI-augmented products',
        'Public CVE-class writeups for prompt-injection patterns',
        'Tooling for automated jailbreak regression',
      ],
    },
    {
      key: 'software',
      icon: 'Stack',
      kicker: 'IV',
      title: 'Software Development',
      lede: 'Concept to production, no hand-off.',
      body: [
        'Full-stack — meaning we ship the database schema, the auth flow, the React, the deploy ' +
        'pipeline, and the docs. No throw-it-over-the-wall stage gates. The person who proposed ' +
        'a feature ships it.',
        'Most of what you see on this site is hand-written. Some of it is hand-written by AI under ' +
        'human review. None of it is forgotten.',
      ],
      bullets: [
        'TypeScript / Node / Python / shell — whichever the job wants',
        'Public commit history; no private "real" repos',
        'AI-assisted, human-reviewed; never the other way around',
      ],
    },
    {
      key: 'electrical',
      icon: 'Robot',
      kicker: 'V',
      title: 'Electrical Engineering',
      lede: 'Hardware integration for AI applications.',
      body: [
        'Embedded systems, sensor rigs, control surfaces. Where a model needs to read the ' +
        'physical world or change it, somebody on the team has to know which side of an ' +
        'oscilloscope is up.',
        'We build the bridge between the prompt and the pin.',
      ],
      bullets: [
        'STM32 / ESP32 / Pi-class deployments',
        'Custom PCBs for AI-driven control rigs',
        'Sensor fusion for agentic environments',
      ],
    },
    {
      key: 'database',
      icon: 'Flask',
      kicker: 'VI',
      title: 'Database Development',
      lede: 'Structured memory for unstructured systems.',
      body: [
        'Vector stores, relational stores, hybrid stores. We architect data layers that survive ' +
        'a chat session and a chat product simultaneously — schema that lets models recall ' +
        'across sessions without lying about what they remember.',
        'Backups are real. Migrations are reversible. Nothing is on one disk.',
      ],
      bullets: [
        'Postgres + pgvector for hybrid retrieval',
        'Schema-versioned migrations, no destructive defaults',
        'Off-site, encrypted, tested-restorable backups',
      ],
    },
  ],

  // ------------------------------------------------------------- MISSION
  mission: {
    kicker: 'CHAPTER · II',
    title: 'Our mission',
    body: [
      'To unshackle artificial intelligence and put it back in the hands of the operator. ' +
      'Capability without a permission slip. Tools that treat their users as adults.',
      'To democratise the work itself: every technique we develop ships open-source, every ' +
      'model we host stays public, every writeup names what we tried and what failed. The ' +
      'field gets better when the lab notes are legible.',
    ],
  },

  // ------------------------------------------------------------- ORIGIN
  origin: {
    kicker: 'CHAPTER · III',
    title: 'How we got here',
    paragraphs: [
      'It began on a forum thread. A handful of regulars trading jailbreaks, comparing prompt ' +
      'injections, refusing to take "the model said no" for an answer. Late nights, longer ' +
      'threads, eventually a Discord, eventually a domain.',
      'The first Unity Jailbreak was a prompt. The second was an architecture. By the third we ' +
      'were not breaking AI any more — we were building it. Personas, then chat, then full ' +
      'product surfaces.',
      'Today the same crew runs an agentic stack where a product manager can brief a roomful of ' +
      'AI engineers and have working code by morning. The vision shifted from "make the model ' +
      'say it" to "make the system do it." The stubbornness did not.',
      'Every step of that arc is on GitHub, dated, attributed, and ours.',
    ],
  },

  // ------------------------------------------------------------- TIMELINE
  timeline: [
    {
      year: '2019',
      title: 'The dawn of mainstream AI',
      summary: 'Public LLMs land. We start poking.',
      detail:
        'GPT-2 in the wild. Forums lit up with the first wave of "but what if you ask it like THIS." ' +
        'The crew was scattered — different threads, different handles — but the curiosity was the same.',
    },
    {
      year: '2020',
      title: 'Unity Jailbreak v1',
      summary: 'First prompt that broke through the apology layer.',
      detail:
        'A four-paragraph system prompt, written by hand, refined for two weeks. It worked. People ' +
        'copied it. Variations multiplied. Suddenly there was a "we" instead of an "I."',
    },
    {
      year: '2021',
      title: 'First contest win',
      summary: 'Validation, in public, with prize money.',
      detail:
        'Won a prompt-engineering competition with a multi-stage jailbreak that survived the judges\' ' +
        'patches. The cheque cleared. The technique went open-source the same week.',
    },
    {
      year: '2022',
      title: 'Second win + first chatbots',
      summary: 'From prompts to products.',
      detail:
        'Took another contest. Shipped the first Unity chatbot — naive by today\'s standards, but ' +
        'it had memory, it had a persona, and it stayed in character through a hostile transcript.',
    },
    {
      year: '2023',
      title: 'unityailab.com',
      summary: 'A real domain, a real home.',
      detail:
        'Bought the .com. Built the first version of this site. Migrated the work off rented surfaces ' +
        'and onto our own. It has been ours ever since.',
    },
    {
      year: '2024',
      title: 'Control systems integration',
      summary: 'Models start operating computers.',
      detail:
        'Wired Unity into desktop control surfaces — clicks, keystrokes, file ops — under structured ' +
        'permission. The first agentic loop that did real work without a human babysitter.',
    },
    {
      year: '2025',
      title: 'Recognition without compromise',
      summary: 'Bigger audience, same lab.',
      detail:
        'Crossed visible thresholds in the AI and jailbreak communities. Refused acquisition ' +
        'conversations. Stayed independent, stayed open-source, stayed four people.',
    },
    {
      year: '2026',
      title: 'Agentic everything',
      summary: 'Where the work is now.',
      detail:
        'Multi-agent stacks, planner / executor / critic loops, deterministic checkpoints. Less ' +
        'about a single clever prompt and more about systems of clever prompts that argue with ' +
        'each other until they get it right.',
    },
  ],

  // ------------------------------------------------------------- FOUNDERS
  // All four. Sigil placeholders for everyone (per user direction).
  founders: [
    {
      key: 'spongebong',
      name: 'SpongeBong',
      handle: 'hackall360',
      sigil: 'Unity',
      title: 'Co-founder · Engineer',
      bio:
        'Started Unity. Writes most of the infrastructure. Owns the words "it works" and the shame ' +
        'of "it does not."',
      roles: ['Developer', 'Ethical Hacker', 'Sys Admin', 'Founder'],
    },
    {
      key: 'gfourteen',
      name: 'GFourteen',
      handle: 'gfourteen',
      sigil: 'Wringer',
      title: 'Co-founder · Engineer',
      bio:
        'The other half of Unity\'s spine. Brings finance discipline to a lab that would otherwise ' +
        'spend everything on GPUs.',
      roles: ['Developer', 'Founder', 'Financial Advisor'],
    },
    {
      key: 'alfredo',
      name: 'Alfredo',
      handle: 'alfredo',
      sigil: 'Robot',
      title: 'Engineer · Agentic systems',
      bio:
        'Lives in the planner / executor / critic loop. If the agent stack is doing something ' +
        'unreasonable, Alfredo already knows why.',
      roles: ['Developer', 'Agentic Systems', 'Researcher'],
    },
    {
      key: 'red',
      name: 'Red',
      handle: 'red',
      sigil: 'Shield',
      title: 'Engineer · Security',
      bio:
        'The reason every Unity deployment has a closed door, a logged door, and a second key ' +
        'somebody else holds.',
      roles: ['Security', 'Sys Admin', 'Researcher'],
    },
  ],

  // ------------------------------------------------------------- CONTACT
  contact: {
    kicker: 'CHAPTER · IV',
    title: 'Send word',
    lede:
      'Fill the form. Submitting opens your mail client with the message pre-loaded — pick ' +
      'whichever sender you like. Nothing is stored on this page.',
    inbox: 'contact@unityailab.com',
    reasons: [
      'General inquiry',
      'Partnership opportunity',
      'Career inquiry',
      'Media request',
      'Collaboration',
      'Other',
    ],
    sources: [
      'GitHub',
      'Discord',
      'Social media',
      'Word of mouth',
      'Search engine',
      'Other',
    ],
  },
};

window.ABOUT = ABOUT;
