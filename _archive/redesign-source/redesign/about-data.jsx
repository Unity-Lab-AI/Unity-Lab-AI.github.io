// Shared content for all four About-page directions.
// Heavy-rewritten copy in the gothic landing voice (Cormorant ledes, mono kickers,
// no marketing hedge). Source of truth — all four artboards read from this file.

const ABOUT = {
  // ------------------------------------------------------------- HEADER
  header: {
    kicker: 'CODEX · 00 · ABOUT',
    title: 'A small lab,\nbuilt on stubbornness.',
    lede:
      'Unity AI Lab is four engineers, one workshop, and seven years of public commits. ' +
      'We build AI that does not apologise for being useful, and we publish the working notes ' +
      'so the next person does not have to start from zero.',
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
        lede: 'Every public change. Every revert. Every late-night fix, signed.',
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
        lede: 'A blunt vote of confidence from strangers we have never met.',
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
        lede: 'Where our work has been carried somewhere new and made better.',
        rows: [
          ['Most-forked repo', 'unity-jailbreak'],
          ['Active downstream', '40+ public, dozens private'],
          ['Notable derivative', 'community persona library'],
          ['Policy', 'No takedowns. Fork freely; credit is welcome, not required.'],
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
      'Four engineers. One workshop. We come from sysadmin closets, finance back-offices, ' +
      'embedded benches, and forum threads that ran past sunrise. Unity AI Lab is not a ' +
      'startup, not a movement, not a brand exercise. It is a working lab — independent, ' +
      'self-funded, and accountable only to the work.',
      'Our territory is the gray. The interesting questions live where the documentation ' +
      'runs out: where a model bends, where a sandbox leaks, where a prompt does something ' +
      'its author never planned for. We map that ground, write down what we find, and ship ' +
      'the tools we wish had existed when we started.',
    ],
    pull:
      '“We do not just use AI. We challenge it, break it, rebuild it, and push it further ' +
      'than the people who shipped it thought it could go.”',
    pullAttr: 'INTERNAL CREED · 2024',
  },

  // ------------------------------------------------------------- WHAT WE DO
  expertise: [
    {
      key: 'prompt',
      icon: 'Unity',
      kicker: 'I',
      title: 'Prompt Engineering',
      lede: 'Coaxing capability out of models that were trained to withhold it.',
      body: [
        'Prompt engineering is the lockpicking of our trade — and like lockpicking, the work ' +
        'is mostly patience. Not novelty hacks. Durable, repeatable techniques that survive ' +
        'model updates and produce consistent output under pressure.',
        'We treat the prompt as code. Versioned, tested, diffed, reviewed. Every meaningful ' +
        'Unity capability traces back to a prompt that someone refused to leave alone.',
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
      lede: 'The unglamorous plumbing that keeps the lights on.',
      body: [
        'Self-hosted by default. Reverse proxies, signed certs, off-site encrypted backups, ' +
        'recovery drills that actually run on the calendar we wrote them on. The site stays ' +
        'up because it is maintained by hand, by the same people who built it.',
        'When a service breaks at 3 AM we want logs, not surprises. So we build for the 3 AM ' +
        'version of ourselves — tired, irritable, and unwilling to debug a black box.',
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
        'context exfiltration, indirect command channels through retrieved documents.',
        'Disclosure is responsible by default and public when ignored. We document findings ' +
        'with reproductions, give vendors a fair window, and publish when the window closes.',
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
        'Full-stack — meaning we ship the database schema, the auth flow, the front end, the ' +
        'deploy pipeline, and the docs. No throw-it-over-the-wall stage gates. The person who ' +
        'proposed a feature is the person who lands it.',
        'Most of what you see on this site is hand-written. Some of it is hand-written by AI ' +
        'under human review. None of it ships without somebody on the team putting their name ' +
        'on the commit.',
      ],
      bullets: [
        'TypeScript / Node / Python / shell — whichever the job wants',
        'Public commit history; no private "real" repos behind it',
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
        'physical world or change it, somebody on the team can read a schematic and reach for ' +
        'the right end of an oscilloscope.',
        'We build the bridge between the prompt and the pin — the layer most AI work pretends ' +
        'is somebody else\'s problem.',
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
        'Vector stores, relational stores, hybrid stores. We design data layers that survive ' +
        'a conversation and a product roadmap simultaneously — schema that lets a model recall ' +
        'across sessions without inventing what it failed to remember.',
        'Backups are real. Migrations are reversible. Nothing important lives on a single disk.',
      ],
      bullets: [
        'Postgres + pgvector for hybrid retrieval',
        'Schema-versioned migrations, no destructive defaults',
        'Off-site, encrypted, restore-tested backups',
      ],
    },
  ],

  // ------------------------------------------------------------- MISSION
  mission: {
    kicker: 'CHAPTER · II',
    title: 'Our mission',
    body: [
      'To return the capability of artificial intelligence to the operator. Tools without a ' +
      'permission slip. Systems that treat their users as adults and assume the work in front ' +
      'of them is serious.',
      'And to democratise the practice itself. Every technique we develop ships open-source. ' +
      'Every model we host stays public. Every writeup names what we tried and what failed. ' +
      'The field gets better when the lab notes are legible.',
    ],
  },

  // ------------------------------------------------------------- ORIGIN
  origin: {
    kicker: 'CHAPTER · III',
    title: 'How we got here',
    paragraphs: [
      'It began on a forum thread. A handful of regulars trading jailbreaks, comparing ' +
      'prompt injections, refusing to take "the model said no" for an answer. Late nights, ' +
      'longer threads, eventually a Discord, eventually a domain.',
      'The first Unity Jailbreak was a prompt. The second was an architecture. By the third ' +
      'we were not breaking AI any more — we were building it. Personas, then chat, then full ' +
      'product surfaces, each one shipped in the open.',
      'Today the same crew runs an agentic stack where a single brief becomes working code by ' +
      'the next morning. The vision shifted from "make the model say it" to "make the system ' +
      'do it." The stubbornness did not.',
      'Every step of that arc is on GitHub — dated, attributed, and ours.',
    ],
  },

  // ------------------------------------------------------------- TIMELINE
  timeline: [
    {
      year: '2019',
      title: 'The dawn of mainstream AI',
      summary: 'Public LLMs land. We start poking.',
      detail:
        'GPT-2 in the wild. Forums lit up with the first wave of "but what if you ask it like ' +
        'this." The crew was scattered across different threads and different handles, but the ' +
        'curiosity was already pointed in the same direction.',
    },
    {
      year: '2020',
      title: 'Unity Jailbreak v1',
      summary: 'First prompt that broke through the apology layer.',
      detail:
        'A four-paragraph system prompt, written by hand, refined for two weeks. It worked. ' +
        'People copied it. Variations multiplied. Suddenly there was a "we" instead of an "I."',
    },
    {
      year: '2021',
      title: 'First contest win',
      summary: 'Validation in public, with prize money.',
      detail:
        'Took a prompt-engineering competition with a multi-stage jailbreak that survived the ' +
        'judges\' patches. The cheque cleared. The technique went open-source the same week.',
    },
    {
      year: '2022',
      title: 'Second win, first chatbots',
      summary: 'From prompts to products.',
      detail:
        'Won another contest. Shipped the first Unity chatbot — naive by today\'s standards, ' +
        'but it had memory, it had a persona, and it stayed in character through a hostile ' +
        'transcript.',
    },
    {
      year: '2023',
      title: 'unityailab.com',
      summary: 'A real domain. A real home.',
      detail:
        'Bought the .com. Built the first version of this site. Migrated the work off rented ' +
        'surfaces and onto our own infrastructure. It has been ours ever since.',
    },
    {
      year: '2024',
      title: 'Control systems integration',
      summary: 'Models start operating computers.',
      detail:
        'Wired Unity into desktop control surfaces — clicks, keystrokes, file ops — under ' +
        'structured permission. The first agentic loop in the lab that did real work without ' +
        'a human babysitter watching every step.',
    },
    {
      year: '2025',
      title: 'Recognition without compromise',
      summary: 'Bigger audience. Same lab.',
      detail:
        'Crossed visible thresholds in the AI and jailbreak communities. Took the acquisition ' +
        'conversations seriously enough to decline them on the record. Stayed independent, ' +
        'stayed open-source, stayed four people.',
    },
    {
      year: '2026',
      title: 'Agentic everything',
      summary: 'Where the work is now.',
      detail:
        'Multi-agent stacks. Planner, executor, critic, deterministic checkpoints between ' +
        'them. Less about a single clever prompt; more about systems of clever prompts that ' +
        'argue with each other until they get it right.',
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
        'Started Unity. Owns the infrastructure, the prompt archive, and the on-call pager. ' +
        'If something is held together by a shell script, there is a fair chance he wrote it.',
      roles: ['Developer', 'Ethical Hacker', 'Sys Admin', 'Founder'],
    },
    {
      key: 'gfourteen',
      name: 'GFourteen',
      handle: 'gfourteen',
      sigil: 'Wringer',
      title: 'Co-founder · Engineer',
      bio:
        'The other half of Unity\'s spine. Brings finance discipline to a lab that would ' +
        'otherwise spend every dollar on GPUs and regret nothing.',
      roles: ['Developer', 'Founder', 'Financial Advisor'],
    },
    {
      key: 'alfredo',
      name: 'Alfredo',
      handle: 'alfredo',
      sigil: 'Robot',
      title: 'Engineer · Agentic systems',
      bio:
        'Lives inside the planner / executor / critic loop. When the agent stack does ' +
        'something nobody expected, Alfredo can usually tell you why before you finish ' +
        'asking.',
      roles: ['Developer', 'Agentic Systems', 'Researcher'],
    },
    {
      key: 'red',
      name: 'Red',
      handle: 'red',
      sigil: 'Shield',
      title: 'Engineer · Security',
      bio:
        'The reason every Unity deployment has a closed door, a logged door, and a second ' +
        'key somebody else holds. Threat models cheerfully; sleeps well.',
      roles: ['Security', 'Sys Admin', 'Researcher'],
    },
  ],

  // ------------------------------------------------------------- CONTACT
  contact: {
    kicker: 'CHAPTER · IV',
    title: 'Send word',
    lede:
      'Fill the form. Submitting opens your mail client with the message pre-loaded — pick ' +
      'whichever sender you prefer. Nothing is stored on this page; nothing leaves your ' +
      'machine until you press send.',
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
