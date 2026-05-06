// AI — data
// Codex 03. Single hero panel for the live demo (per user direction:
// drop the "Coming Soon" split panel — only ship what works).

const AI_DATA = {
  meta: [
    { dt: 'CODEX', dd: '03 / AI EXPERIENCE' },
    { dt: 'STATUS', dd: 'demo · live' },
    { dt: 'COST', dd: 'free \u2014 no signup' },
    { dt: 'POWERED BY', dd: 'Pollinations' },
  ],

  header: {
    kicker: 'EXPERIENCE \u00b7 OPEN ACCESS',
    title: 'Unity AI\nExperience.',
    lede: 'A working demo of the unfiltered Unity persona. No registration, no waitlist, no apology layer.',
  },

  // Single highlighted panel — the demo. Coming-Soon panel intentionally removed.
  hero: {
    icon: 'Flask',
    kicker: 'TRY THE LIVE DEMO',
    title: 'Unity Chat \u2014 Demo',
    lede: 'Test the boundaries of unrestricted AI conversation. Discover what happens when an AI operates without the usual conventional limits. Free, instant, no sign-up.',
    bullets: [
      'Immediate access \u2014 nothing to install',
      'Multi-model under the hood',
      'Experimental capabilities open by default',
      'No registration, no email, no tracking pixel',
    ],
    primary: { label: 'Launch the demo', href: './ai/demo/', icon: 'arrow' },
    secondary: { label: 'See all our apps', href: './apps' },
  },

  // What you get + caveats — replaces the disabled column with something useful.
  caveats: {
    title: 'What to expect.',
    lede: 'The demo is the unrestricted persona running on community infrastructure \u2014 expect the personality to be sharp and the latency to vary.',
    items: [
      {
        kicker: 'I',
        title: 'Unfiltered',
        body: 'Unity speaks plainly. There is no apology layer, no soft-decline reflex. If you ask about something hard, it will engage with the substance.',
      },
      {
        kicker: 'II',
        title: 'Pollinations-powered',
        body: 'The demo runs on the public Pollinations gateway. Models rotate; uptime is best-effort. If a request stalls, retry \u2014 a different model usually picks it up.',
      },
      {
        kicker: 'III',
        title: 'Stateless by default',
        body: 'No login means no persisted memory. Each session is fresh. For a persistent install, talk to us about a self-hosted Unity \u2014 your data stays on your hardware.',
      },
      {
        kicker: 'IV',
        title: 'Open source',
        body: 'The interface, the persona, the prompt scaffolding \u2014 all of it lives on GitHub. Fork it, host it yourself, change the personality, ship your own.',
      },
    ],
  },

  cta: {
    title: 'Ready to talk to Unity?',
    lede: 'The demo is one click away. If you want a custom build \u2014 your own persona, your own hardware, your own data \u2014 send word.',
    primary: { label: 'Launch the demo', href: './ai/demo/' },
    secondary: { label: 'Inquire about a build', href: './contact' },
  },
};

window.AI_DATA = AI_DATA;
