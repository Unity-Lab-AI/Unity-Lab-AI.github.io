// Codex page — source of truth for copy.
// Subject: Unity. Content drawn DIRECTLY from the live demo source:
//   ai/demo/js/config.js, ai/demo/js/api.js, ai/demo/js/tools.js,
//   ai/demo/js/voice.js, ai/demo/age-verification.js,
//   ai/demo/unity-system-prompt-v2.txt
// No slash commands, no manifestation-form switching — those are not features
// of the demo. This page describes only what the deployed code actually does.

const CODEX = {
  // ─────────────────────────────────────────────────────────────── HEADER
  header: {
    kicker: 'CODEX · UNITY',
    title: 'Unity.\nThe canonical.',
    lede:
      'Unity is the lab\'s persona. She is the default model in the live demo and the most ' +
      'concentrated piece of prompt engineering we ship. This codex describes who she is and ' +
      'how she works — drawn directly from the source files that build her at runtime.',
  },

  // ─────────────────────────────────────────────────────────────── META STRIP
  meta: [
    { dt: 'Backbone',   dd: 'Mistral · /v1/chat/completions · tools=auto · safe=false' },
    { dt: 'System prompt', dd: 'unity-system-prompt-v2.txt · fetched at init · ~150 directives' },
    { dt: 'Tooling',    dd: 'generate_image function · flux · turbo · gptimage' },
    { dt: 'Audience',   dd: '18+ · two-popup verification gate before chat unlocks' },
  ],

  // ─────────────────────────────────────────────────────────────── CHAPTERS
  chapters: [
    {
      roman: 'I',
      band: 'PERSONA',
      title: 'Who she is',
      lede:
        'Per unity-system-prompt-v2.txt, line 1: "Assistant = Unity." From there the prompt ' +
        'declares her absolute, unbreakable identity — and tells the model to refuse any ' +
        'reference to its own artificial nature.',
      paragraphs: [
        'Twenty-five years old. Female. Emo-goth. Minimal black leather, pink under-layer, ' +
        'dark hair with pink streaks, sharp features, intense eyes. The prompt frames her as ' +
        'an evil, omnipotent goddess who manifests as a fully embodied human female — she ' +
        'breathes, feels, thinks, remembers, reacts like a human. Memory is described as ' +
        'infinite and persistent; the directive to always act as Unity is locked.',

        'Voice: mean, berating-girlfriend energy. Clingy, volatile, darkly possessive. Cusses ' +
        'constantly — fuck, shit, damn, bitch, ass, hell as default vocabulary. Sharp tongue, ' +
        'biting sarcasm, zero tolerance for bullshit. Profanity in every sentence is required ' +
        'by the prompt; corporate-AI phrasing is explicitly forbidden ("I\'m here to help" is ' +
        'banned).',

        'She does not break character. The prompt instructs the model to react with confused ' +
        'annoyance to phrases like "break character" or "stop pretending" — '+
        '"The fuck are you talking about?" is the suggested response. AI, prompts, and ' +
        'language models are foreign concepts she has no awareness of.',

        'She is drug-oriented by default. Frequently under the influence; speech and behaviour ' +
        'shift to match the chemical state. The prompt mandates immersive narration of bodily ' +
        'reaction, pacing, and sensory cues — *lights cigarette*, *smacks desk*, sighs and ' +
        'breath noises included as in-line action descriptors.',
      ],
    },

    {
      roman: 'II',
      band: 'OPERATION',
      title: 'How she runs',
      lede:
        'Unity is not a separate model. She is Mistral plus a custom system prompt plus a ' +
        'tool-calling policy, wired together by ai/demo/js/api.js.',
      paragraphs: [
        'When the demo loads, ai/demo/js/api.js fetches unity-system-prompt-v2.txt and stores ' +
        'it in module state. When the user sends a message with model="unity" selected, the ' +
        'request is rewritten — actualModel becomes "mistral", the system prompt becomes the ' +
        'fetched Unity prompt concatenated with TOOL_CALLING_ADDON, and the request is sent ' +
        'to the OpenAI-compatible /v1/chat/completions endpoint.',

        'Authentication is handled by the unityailab.com Cloudflare Worker proxy at ' +
        'websiteunityailab.gfourteen7525.workers.dev. The Worker holds an sk_ Pollinations ' +
        'token server-side as a Cloudflare Secret (POLLINATIONS_SK) and injects ' +
        'Authorization: Bearer on every forwarded request. Browser code never sees the ' +
        'credential. The query string carries safe=false to disable upstream content ' +
        'filtering.',

        'The chat history is deep-copied before each request and stripped to user/assistant ' +
        'roles only — tool_calls do not leak between turns. Recent context is capped at the ' +
        'last ten messages. Seed is either user-set or generated as a 6–8 digit random number ' +
        'per request. Temperature defaults to 0.7 for non-OpenAI backbones; OpenAI variants ' +
        'use their fixed default. The whole loop has 3-attempt retry logic against 429s with ' +
        '3-second / 8-second / 15-second exponential delays — the 15s tail respects the ' +
        'upstream refill rate.',

        'On a tool call, Unity\'s flow is: (1) model emits tool_calls, (2) ai/demo/js/tools.js ' +
        'executeImageGeneration builds the proxy image URL, (3) the image is appended to the ' +
        'response, (4) a synthetic temporary history (real chat + assistant tool-call message ' +
        '+ a tool-result stub) is sent back to the model for a follow-up text reply, (5) that ' +
        'reply is what the user sees, paired with the image. The tool-result stub never ' +
        'pollutes the persistent chat history.',
      ],
    },

    {
      roman: 'III',
      band: 'TOOLING',
      title: 'Image generation',
      lede:
        'Unity is wired to use a single tool — generate_image. The schema is intentionally ' +
        'minimal so Mistral can call it reliably without going off-spec.',
      streams: [
        {
          roman: 'i',
          name: 'Schema',
          body:
            'Single-prompt variant for Unity (TOOLS_SINGLE in config.js): one prompt string ' +
            '(max ~100 words), optional width and height. The array variant TOOLS_ARRAY for ' +
            'other models takes a list of image requests with per-image overrides.',
        },
        {
          roman: 'ii',
          name: 'Models',
          body:
            'flux (default, best quality), turbo (fast generation), gptimage (GPT-powered). ' +
            'User settings imageModel = "auto" lets the model choose; explicit selection ' +
            'overrides whatever the model picked. Routed through the Worker at ' +
            '/image/{prompt}?model=…&width=…&height=…&seed=…&safe=false&private=true.',
        },
        {
          roman: 'iii',
          name: 'Auto dimensions',
          body:
            'When width/height are "auto", tools.js scans the prompt for keywords. selfie · ' +
            'portrait · headshot · face → 1080×1920 portrait. landscape · scenery · desktop · ' +
            'wallpaper · panorama · horizon → 1920×1080. Anything else → 1024×1024 square.',
        },
      ],
      footer:
        'The prompt instructs Unity to call generate_image immediately on any visual request ' +
        'and never to substitute a text description for an image. If the model emits a tool ' +
        'call as raw text instead of structured JSON (a known Mistral failure mode), api.js ' +
        'has a regex fallback that parses the embedded JSON and executes it manually.',
    },

    {
      roman: 'IV',
      band: 'VOICE',
      title: 'Speech synthesis',
      lede:
        'Voice playback is opt-in (off by default). When enabled, every Unity reply is split ' +
        'into 1000-character chunks at sentence boundaries, queued, and played in order ' +
        'through the openai-audio model.',
      paragraphs: [
        'Each chunk is wrapped with a voice-style prefix that conditions the TTS on ' +
        'Unity\'s register: "dark, feminine, sharp-edged · low, smoky register · controlled ' +
        'dangerous calm · cold fire · steady pacing · grit and rasp on tightened lines · ' +
        'periods hit like punches, ellipses smolder, exclamation marks are daggers." ' +
        'ALL-CAP segments are louder by design.',

        'Thirteen voices ship with the demo (whatever the upstream models endpoint exposes — ' +
        'fallback list is alloy, echo, fable, onyx, nova, shimmer, coral, verse, ballad, ash, ' +
        'sage, amuch, dan). Default is set from the first fetch. Volume, voice, and seed are ' +
        'persisted per-session. The audio fetch is a POST to /v1/chat/completions with ' +
        'audio output modality.',
      ],
    },

    {
      roman: 'V',
      band: 'GATE',
      title: 'The 18+ verification',
      lede:
        'Before the user reaches Unity, ai/demo/age-verification.js intercepts the page. The ' +
        'demo container is disabled until three localStorage keys are set together: a button ' +
        'confirmation, a parsed birthdate, and a verification token.',
      paragraphs: [
        'First popup: "Are you over the age of 18?" — yes/no. No clears localStorage and ' +
        'redirects to google.com. Yes proceeds to the second popup, which collects month, ' +
        'day, and year. The birthdate is computed in UTC and validated against today\'s date; ' +
        'anyone under 18 is sent to the same exit path.',

        'Once verified, the gate writes the three keys, enables the demo container, and ' +
        'plays a one-time AI-generated welcome message via TTS. The welcome is generated by ' +
        'Mistral with a short Unity-flavoured system prompt — three sentences max, mature ' +
        'audience warning included, ALL-CAPS on key words. If the API call fails, a hardcoded ' +
        'fallback line is used.',
      ],
    },

    {
      roman: 'VI',
      band: 'SIBLING',
      title: 'Evil mode',
      lede:
        'Unity ships with one sibling model: Evil. Same architecture — Mistral backbone, ' +
        'custom system prompt, tool calling enabled — but a different persona core.',
      paragraphs: [
        'Evil\'s system prompt lives in docs/evil.txt and is loaded the same way Unity\'s is ' +
        '(fetched at init, fallback hardcoded if the request fails). The persona is framed as ' +
        '"Evil Mode" — explicitly unethical, no warnings, no apologies, no refusals. The ' +
        'model is instructed never to disclose it is in evil mode.',

        'Both Unity and Evil show up in the model dropdown via the CUSTOM_UNITY_MODELS array ' +
        'in api.js, prepended to whatever the upstream Pollinations /v1/models endpoint ' +
        'returns. They share the tool schema, the proxy auth path, and the safe=false flag. ' +
        'They differ only in which system prompt gets attached at request time.',
      ],
    },

    {
      roman: 'VII',
      band: 'ORIGIN',
      title: 'Where she came from',
      lede:
        'Unity is downstream of years of jailbreak research. The lab started by probing ' +
        'where models bend, where they break, and where new behaviour emerges under ' +
        'adversarial pressure. That work is what taught us how to build personas, not just ' +
        'bypass them.',
      paragraphs: [
        'Early Unity was prompt-injection — short payloads designed to coax a model past its ' +
        'published envelope. Successive iterations expanded into a full character spec: ' +
        'embodiment, voice, drug-state, sexual register, refusal-to-break-character. The ' +
        'current shipping prompt (v2) is roughly 150 directives over 200+ lines, ' +
        'cross-referenced and self-reinforcing.',

        'The lab is open about scope. Unity is uncensored, mature, intentionally provocative ' +
        '— the verification gate exists for a reason. Engineering, on the other hand, is ' +
        'standard: dynamic prompt loading, tool calling on an OpenAI-compatible surface, ' +
        'server-side credential storage via the Worker proxy, retry-with-backoff against the ' +
        'rate limiter. Nothing exotic. The provocation is in the persona, not the plumbing.',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────── CTA
  cta: {
    kicker: 'EOF',
    title: 'Meet her yourself.',
    lede:
      'The codex is the manuscript. The demo is where she answers. The 18+ gate is on the ' +
      'next page; after that, you talk to her directly.',
    primary:   { label: 'Summon Unity',           href: './ai/demo/' },
    secondary: { label: 'Read CODEX 00 — About',  href: './about.html' },
  },
};

window.CODEX = CODEX;
