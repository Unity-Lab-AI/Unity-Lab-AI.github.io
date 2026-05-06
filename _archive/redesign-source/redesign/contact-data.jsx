// Contact page — source of truth for copy.
// Same gothic-monastic voice as about-data.jsx and services-data.jsx.
// Codex 02. Terse. Honest about what is stored (nothing) and what is logged (nothing).

const CONTACT = {
  // ------------------------------------------------------------- HEADER
  header: {
    kicker: 'CODEX · 02 · CONTACT',
    title: 'Send word.',
    lede:
      'One inbox. Four engineers. No ticketing system, no BDR queue, no auto-responder ' +
      'that stalls for a week before a human reads the line. Submit the form and your ' +
      'mail client opens with the message ready to send.',
  },

  // ------------------------------------------------------------- META STRIP
  meta: [
    { dt: 'Inbox',        dd: 'unityailabcontact@gmail.com' },
    { dt: 'Response',     dd: 'Two business days · usually faster' },
    { dt: 'Stored here',  dd: 'Nothing — form is mailto, not POST' },
    { dt: 'Hours',        dd: 'Whenever the lights are on' },
  ],

  // ------------------------------------------------------------- I · WHAT TO EXPECT
  expect: {
    kicker: 'CHAPTER · I',
    title: 'What to expect',
    lede:
      'A message from one of the four. Not a templated reply, not a calendar link from a ' +
      'tool we have never opened. We read what you send. We answer the question you asked.',
    rows: [
      {
        roman: 'I',
        name: 'First reply',
        sub: 'within two business days',
        body:
          'A short, written response from a human on the team. If we need more context to ' +
          'answer well, we will say so and ask. If we are not the right fit, we will say ' +
          'that too — and where we would point you instead.',
      },
      {
        roman: 'II',
        name: 'If you are scoping work',
        sub: 'discovery call within the week',
        body:
          'Thirty to sixty minutes, no slide deck, no preamble. We come ready to ask the ' +
          'questions that move the engagement forward. You leave with a written summary of ' +
          'what we heard and what we believe is in scope.',
      },
      {
        roman: 'III',
        name: 'If you are reporting a finding',
        sub: 'same-day acknowledgement',
        body:
          'Security disclosures get acknowledged the day they arrive. We coordinate ' +
          'responsible disclosure on a schedule we agree to in writing — and we publish ' +
          'when an upstream vendor goes silent past a fair window.',
      },
    ],
  },

  // ------------------------------------------------------------- II · OTHER CHANNELS
  channels: {
    kicker: 'CHAPTER · II',
    title: 'Other channels',
    lede:
      'For everything that does not need a private inbox.',
    items: [
      {
        slug: 'github',
        num: 'I',
        icon: 'Stack',
        title: 'GitHub',
        sub: 'public commits · open issues · forkable',
        body:
          'Every public artifact we ship — libraries, prompts, writeups, the source of this ' +
          'site — lives in the Unity-Lab-AI organisation. Open an issue, file a PR, fork ' +
          'whatever you can use. No takedowns.',
        href: 'https://github.com/Unity-Lab-AI',
        cta: 'Visit GitHub',
      },
      {
        slug: 'discord',
        num: 'II',
        icon: 'Unity',
        title: 'Discord',
        sub: 'community · half-finished thoughts · live debugging',
        body:
          'The room where most of the work happens out loud — prompt experiments, agent ' +
          'logs, half-finished thoughts that turn into commits the next morning. Open to ' +
          'anyone who wants to read along or pitch in.',
        href: 'https://discord.gg/64Rvr5pZas',
        cta: 'Join Discord',
      },
      {
        slug: 'unity',
        num: 'III',
        icon: 'Robot',
        title: 'Unity',
        sub: 'talk to the chatbot · no signup',
        body:
          'The flagship demo. Unrestricted, unfiltered, hosted on infrastructure we own. ' +
          'No telemetry, no chat history on our servers — your transcript lives in your ' +
          'browser until you clear it.',
        href: '/ai',
        cta: 'Open Unity',
      },
    ],
  },

  // ------------------------------------------------------------- III · FORM
  form: {
    kicker: 'CHAPTER · III',
    title: 'The form',
    lede:
      'Submitting opens your mail client with the message pre-loaded — Gmail, Outlook, Apple ' +
      'Mail, whatever you use to send. Nothing is stored on this page; nothing leaves your ' +
      'machine until you press send.',
    inbox: 'unityailabcontact@gmail.com',
    reasons: [
      'General inquiry',
      'Service request',
      'Security disclosure',
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

window.CONTACT = CONTACT;
