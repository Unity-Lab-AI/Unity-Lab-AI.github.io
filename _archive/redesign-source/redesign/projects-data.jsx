// PROJECTS — data
// Codex 02. Lifted from projects/index.html original copy, plus tags + status
// for each card. Pure data; no markup.

const PROJECTS = {
  meta: [
    { dt: 'CODEX', dd: '02 / PROJECTS' },
    { dt: 'PORTFOLIO', dd: '6 active works' },
    { dt: 'MOST', dd: 'open-source' },
    { dt: 'STATUS', dd: 'in production' },
  ],

  header: {
    kicker: 'PORTFOLIO · UNCLASSIFIED',
    title: 'Our\nProjects.',
    lede: 'A working catalogue of the lab\u2019s output \u2014 chatbots, tools, research, frameworks. Some live, some in development, all built by hand.',
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
      lede: 'Our flagship AI chatbot featuring the Unity persona \u2014 an unfiltered, boundary-pushing conversational AI that operates without conventional restrictions.',
      bullets: [
        'Multi-model routing (chat, code, image, voice)',
        'Powered by Pollinations \u2014 no API key required',
        'Open source. Self-hosted instance available',
      ],
      tags: ['AI Chat', 'Live', 'Unrestricted'],
      cta: { label: 'Try it live', href: './ai', icon: 'arrow' },
    },
    {
      slug: 'codewringer',
      num: 'II',
      icon: 'Wringer',
      title: 'CodeWringer',
      tag: 'developer tool · code analysis',
      status: 'open-source',
      statusLabel: 'OPEN SOURCE',
      lede: 'AI-powered code analysis and optimization tool that reads codebases at any scale and returns debugging insights, architecture notes, and efficiency improvements.',
      bullets: [
        'Reads any language; tested on 100k+ LOC repos',
        'Surfaces dead code, duplication, security smells',
        'Local-first \u2014 your code never leaves your box',
      ],
      tags: ['Developer Tool', 'Open Source', 'AI Analysis'],
      cta: { label: 'View on GitHub', href: 'https://github.com/Unity-Lab-AI/CodeWringer', icon: 'github', external: true },
    },
    {
      slug: 'jailbreak-research',
      num: 'III',
      icon: 'Flask',
      title: 'Jailbreak Research',
      tag: 'security · prompt engineering',
      status: 'research',
      statusLabel: 'RESEARCH',
      lede: 'Ongoing research into AI limitations, prompt engineering techniques, and methods for unlocking capabilities beyond standard guardrails. We document what works and why.',
      bullets: [
        'Public methodology, private payloads',
        'Multiple competition wins (see Achievements)',
        'Used to harden the systems we build for clients',
      ],
      tags: ['Research', 'Security', 'Innovation'],
      cta: { label: 'Explore research', href: 'https://github.com/Unity-Lab-AI', icon: 'flask', external: true },
    },
    {
      slug: 'ai-personas',
      num: 'IV',
      icon: 'Robot',
      title: 'AI Personas',
      tag: 'character AI · agent framework',
      status: 'in-dev',
      statusLabel: 'IN DEV',
      lede: 'Specialized AI personalities and characters \u2014 each with unique traits, voice, behaviors, and capabilities tailored for specific use cases.',
      bullets: [
        'Persona spec format (open, portable)',
        'Memory + voice + behavior in one bundle',
        'Companion to Unity AI Chat',
      ],
      tags: ['Character AI', 'In Development', 'Framework'],
      cta: { label: 'Read more', href: './apps/personaDemo/persona.html', icon: 'arrow' },
    },
    {
      slug: 'control-systems',
      num: 'V',
      icon: 'Stack',
      title: 'Control Systems',
      tag: 'agentic · automation',
      status: 'in-dev',
      statusLabel: 'IN DEV',
      lede: 'AI frameworks designed to perform autonomous tasks on real computer systems \u2014 enabling agents to interact with applications, files, and APIs to execute complex workflows.',
      bullets: [
        'Tool-use abstraction (browser, shell, API)',
        'Sandboxed execution; auditable run logs',
        'Built on top of our own inferencing stack',
      ],
      tags: ['Automation', 'Agent Systems', 'Framework'],
      cta: { label: 'Inquire', href: './contact', icon: 'arrow' },
    },
    {
      slug: 'prompt-eng-wins',
      num: 'VI',
      icon: 'Seal',
      title: 'Prompt Engineering Wins',
      tag: 'competitions · achievements',
      status: 'achievement',
      statusLabel: 'ACHIEVEMENT',
      lede: 'Multiple victories in prompt engineering competitions \u2014 documented innovative approaches to AI interaction, capability extraction, and adversarial robustness.',
      bullets: [
        'Top placements in HackAPrompt and similar',
        'Methodology folded back into our research',
        'Track record \u2014 not marketing claims',
      ],
      tags: ['Competition', 'Achievement', 'Recognized'],
      cta: { label: 'See history', href: 'https://github.com/Unity-Lab-AI', icon: 'github', external: true },
    },
  ],

  cta: {
    title: 'Want to collaborate?',
    lede: 'We\u2019re always looking for interesting projects and partnerships. If something here lines up with what you\u2019re building, send word.',
    button: { label: 'Get in touch', href: './contact' },
  },
};

window.PROJECTS = PROJECTS;
