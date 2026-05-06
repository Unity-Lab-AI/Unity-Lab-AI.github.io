// Services page — source of truth for copy.
// Same gothic-monastic voice as about-data.jsx, but a touch more action-oriented:
// these are sales surfaces, so each card opens with a verb the buyer wants to do.
// Numerals stay roman. Hedging stays out.

const SERVICES = {
  // ------------------------------------------------------------- HEADER
  header: {
    kicker: 'CODEX · 01 · SERVICES',
    title: 'Seven services.\nAll unconventional.',
    lede:
      'We engage on the work that does not fit a vendor brochure: AI integration the model ' +
      'was not supposed to allow, security testing for systems traditional tooling cannot see, ' +
      'and the operational plumbing that decides whether any of it survives a Tuesday. ' +
      'Pick the discipline. We will pick up the phone.',
  },

  // ------------------------------------------------------------- META STRIP
  // mirrors the About meta strip — quick credibility orientation
  meta: [
    { dt: 'Engagement model', dd: 'Fixed-scope · embedded · retainer' },
    { dt: 'Deployment',       dd: 'Self-hosted by default' },
    { dt: 'Disclosure',       dd: 'Open-source where the contract allows' },
    { dt: 'Track record',     dd: 'Public commits · contest wins · 2021–2022' },
  ],

  // ------------------------------------------------------------- HOW WE WORK
  howWeWork: {
    kicker: 'CHAPTER · I',
    title: 'How we work',
    lede:
      'Four phases. No theatre. Each phase has a deliverable you can read; each handoff has ' +
      'a name attached.',
    phases: [
      {
        roman: 'I',
        name: 'Discovery',
        sub: 'one to two weeks',
        body:
          'We sit with your team, your code, and your threat model. The deliverable is a ' +
          'written brief: what we believe the problem is, what we believe is in scope, and ' +
          'what we explicitly are not signing up to fix.',
      },
      {
        roman: 'II',
        name: 'Scope',
        sub: 'fixed price or capped time-and-materials',
        body:
          'A scope document that names every artifact you will receive, every milestone we ' +
          'expect to hit, and every assumption that, if violated, will cost more. No surprise ' +
          'invoices. No discovery-by-stealth.',
      },
      {
        roman: 'III',
        name: 'Ship',
        sub: 'weekly demos, public commits',
        body:
          'We work in slices you can use. Every week ends with something running, something ' +
          'reviewed, and a short note covering what moved, what blocked, and what we changed ' +
          'our minds about.',
      },
      {
        roman: 'IV',
        name: 'Handoff',
        sub: 'documentation that survives us',
        body:
          'You leave with running infrastructure, runbooks your on-call engineer will actually ' +
          'open, and a recorded walkthrough. We answer questions for thirty days at no charge. ' +
          'After that, we are around — but you should not need us.',
      },
    ],
  },

  // ------------------------------------------------------------- THE SEVEN
  // Each card: card-grid copy + a "dossier" modal with breakdown.
  // `inquire` is the prefill template surfaced when the card's button is pressed.
  services: [
    {
      slug: 'ai-integration',
      num: 'I',
      icon: 'Unity',
      title: 'AI Integration & Development',
      tag: 'design · build · deploy',
      lede:
        'Custom AI systems built end to end — from model selection through the production ' +
        'glue that decides whether the feature survives launch week.',
      body:
        'We embed alongside your team to design model selection, prompt strategy, evaluation ' +
        'harnesses, and the deployment surface that makes the difference between a demo and a ' +
        'feature. Self-hosted by default. No data leaves your perimeter unless you decide it ' +
        'should.',
      bullets: [
        'Bespoke persona engineering with adversarial regression suites',
        'Model selection, fine-tuning, and orchestration',
        'Production deployment on infrastructure you own',
        'Evaluation harnesses that survive a release cadence',
      ],
      dossier: {
        kicker: 'DOSSIER · I',
        title: 'AI Integration & Development',
        lede:
          'Concept to production for AI features that have to stay running.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You have a model that works in a notebook and falls over in front of users. ' +
              'You have a vendor whose pricing or policy has stopped working for you. You ' +
              'have a feature your team has prototyped twice and never shipped.',
          },
          {
            heading: 'What you receive',
            body:
              'A working integration on infrastructure you control, an evaluation harness ' +
              'wired into CI, prompt assets versioned in your repo, and a runbook that ' +
              'covers the realistic failure modes — including the ones the model vendor will ' +
              'not tell you about.',
          },
          {
            heading: 'What we will not do',
            body:
              'Ship a prompt nobody on your team can read. Wire your traffic through a ' +
              'service we cannot debug. Promise a number we cannot evaluate.',
          },
        ],
        deliverables: [
          'Integrated AI feature, deployed on your infrastructure',
          'Evaluation harness with adversarial test set',
          'Versioned prompt assets and persona stack',
          'Runbook + recorded handoff walkthrough',
        ],
      },
      inquire: {
        reason: 'AI Integration',
        subject: 'AI Integration & Development — engagement inquiry',
        message:
          'Service of interest: AI Integration & Development\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · What you are trying to build (one or two lines):\n' +
          '  · Current stack / model vendor (if any):\n' +
          '  · Target deployment (self-hosted, hybrid, vendor-hosted):\n' +
          '  · Rough timeline:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'red-blue-team',
      num: 'II',
      icon: 'Shield',
      title: 'Red Team / Blue Team',
      tag: 'attack · defend · document',
      lede:
        'Adversarial AI testing and defensive hardening. We probe the surfaces traditional ' +
        'security tooling does not see, then we patch them.',
      body:
        'Engagements include prompt-injection audits, jailbreak fuzzing, exfiltration via ' +
        'tool calls, and full post-incident forensics with reproductions you can hand to a ' +
        'vendor. Blue-team work covers detection rules, sandbox patterns, and the human ' +
        'checkpoints that hold under load instead of under demo.',
      bullets: [
        'Prompt-injection and jailbreak audits with reproducible artifacts',
        'Tool-call abuse and context exfiltration discovery',
        'Defensive pattern hardening — sandboxes, allowlists, checkpoints',
        'Post-incident forensics with vendor-ready writeups',
      ],
      dossier: {
        kicker: 'DOSSIER · II',
        title: 'Red Team / Blue Team',
        lede:
          'Penetration testing and defensive hardening for prompt-driven systems.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You are about to ship an AI feature to a regulated audience. You have already ' +
              'shipped one and an auditor is asking questions. You suspect a model in your ' +
              'product is doing something nobody designed it to do.',
          },
          {
            heading: 'How we operate',
            body:
              'Engagements run under a written rules-of-engagement document. Every finding ' +
              'is delivered with a reproduction, a severity rating, and a recommended fix ' +
              'class. Disclosure is responsible by default and public when an upstream ' +
              'vendor goes silent past a fair window.',
          },
          {
            heading: 'What you receive',
            body:
              'A finalised report with executive summary, technical detail, and concrete ' +
              'remediation. Detection rules and test cases you can drop into your CI. A ' +
              'briefing for your security team. Optional re-test when fixes land.',
          },
        ],
        deliverables: [
          'Rules-of-engagement document and signed scope',
          'Findings report with reproductions and severity ratings',
          'Detection rules + regression test pack',
          'Re-test on remediated findings (optional)',
        ],
      },
      inquire: {
        reason: 'Red / Blue Team',
        subject: 'Red Team / Blue Team — engagement inquiry',
        message:
          'Service of interest: Red Team / Blue Team\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · System under test (high-level description):\n' +
          '  · Hosting / vendor surface:\n' +
          '  · Compliance regime, if any (SOC 2, HIPAA, PCI, internal):\n' +
          '  · Engagement type (red team, blue team, both, post-incident):\n' +
          '  · Rough timeline:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'software-dev',
      num: 'III',
      icon: 'Stack',
      title: 'Software Development',
      tag: 'concept · production · maintenance',
      lede:
        'End-to-end software delivery from people who finish things. Web apps, services, ' +
        'tooling, integrations — written carefully, shipped honestly, no consultancy theatre.',
      body:
        'Full-stack delivery with a bias toward maintainability. Typed APIs, deterministic ' +
        'builds, observability from day one. Legacy rewrites in slices, not big-bang reboots. ' +
        'The engineer who proposed a feature is the engineer who lands it and answers for it.',
      bullets: [
        'Full-stack web and service work — TypeScript, Node, Python, shell',
        'Internal tooling and developer experience',
        'Legacy rewrites done in slices, not big-bang reboots',
        'Public commit history; AI-assisted, human-reviewed',
      ],
      dossier: {
        kicker: 'DOSSIER · III',
        title: 'Software Development',
        lede:
          'Concept to production with no hand-off in the middle.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You have a feature stuck in committee. You have a legacy service nobody on ' +
              'your team will touch. You need a small, senior team that ships and documents ' +
              'and does not require a project manager to translate between disciplines.',
          },
          {
            heading: 'How we operate',
            body:
              'Weekly demos. Public commits in your repository, on your tooling. Review on ' +
              'every PR. The boring code that makes the interesting code possible — typed ' +
              'APIs, deterministic builds, observability — gets written first.',
          },
        ],
        deliverables: [
          'Working software in your repository, on your infrastructure',
          'Typed APIs, tests at the seams that matter',
          'Observability and runbooks for everything we ship',
          'A handoff your team can actually inherit',
        ],
      },
      inquire: {
        reason: 'Software Development',
        subject: 'Software Development — engagement inquiry',
        message:
          'Service of interest: Software Development\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · What you are trying to build or rescue:\n' +
          '  · Current stack:\n' +
          '  · Team size and shape:\n' +
          '  · Engagement type (fixed-scope, embedded, retainer):\n' +
          '  · Rough timeline:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'training',
      num: 'IV',
      icon: 'Wringer',
      title: 'Training',
      tag: 'workshop · curriculum · live labs',
      lede:
        'Hands-on training for teams who need to operate AI systems in production. No theory ' +
        'dumps, no slide decks pretending to be lessons.',
      body:
        'Live labs against real targets, curriculum tuned to your stack, and a take-home ' +
        'playbook your team will actually open. Topics span prompt engineering, evaluation ' +
        'design, agent orchestration, and incident response. We meet you where your code is.',
      bullets: [
        'Team workshops and bootcamps, in person or remote',
        'Curriculum tailored to your stack and risk model',
        'Live labs against real targets — never sandboxes pretending to be real',
        'A take-home playbook the team will keep using',
      ],
      dossier: {
        kicker: 'DOSSIER · IV',
        title: 'Training',
        lede:
          'A working playbook for a working team — built around your code, not a generic deck.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'Your team has been told to "use AI" and given no instructions. Your security ' +
              'group has been told to evaluate prompt-driven systems and given no method. You ' +
              'are hiring AI engineers and want a calibration baseline.',
          },
          {
            heading: 'Format',
            body:
              'Two-day, four-day, or week-long formats. Half lecture, half hands-on. We ship ' +
              'lab environments configured against your stack and leave them with you when ' +
              'we are done.',
          },
        ],
        deliverables: [
          'Custom curriculum and exercise set',
          'Lab environment(s) tuned to your stack',
          'A take-home playbook with reference implementations',
          'Optional follow-up office hours for thirty days',
        ],
      },
      inquire: {
        reason: 'Training',
        subject: 'Training — engagement inquiry',
        message:
          'Service of interest: Training\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · Audience (engineers, security, leadership, mixed):\n' +
          '  · Team size:\n' +
          '  · Topics of interest (prompt engineering, agents, security, evals, other):\n' +
          '  · Format (on-site, remote, hybrid):\n' +
          '  · Rough timeline:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'inferencing',
      num: 'V',
      icon: 'Robot',
      title: 'Inferencing',
      tag: 'self-hosted · routed · observed',
      badge: 'COMING SOON',
      lede:
        'Self-hosted inference for teams who refuse to ship their prompts to a stranger. ' +
        'Hardware, scheduling, observability — the boring parts that decide whether AI is real ' +
        'or just a demo.',
      body:
        'Dedicated GPU clusters, multi-model routing with priority queues, and the cost and ' +
        'latency telemetry your finance team will actually believe. Currently in private ' +
        'alpha — get on the list and we will pull you in when capacity opens.',
      bullets: [
        'Dedicated GPU clusters, isolated by tenant',
        'Multi-model routing with priority queues and graceful failover',
        'Cost and latency telemetry your finance team will believe',
        'Compliance-friendly logging and retention controls',
      ],
      dossier: {
        kicker: 'DOSSIER · V',
        title: 'Inferencing',
        lede:
          'Inference infrastructure that does not require trusting a vendor with your prompts.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You have stopped being comfortable sending production traffic to a third-party ' +
              'inference provider. You have a compliance regime that does not allow it. You ' +
              'have a workload that has outgrown a credit card and an API key.',
          },
          {
            heading: 'Status',
            body:
              'Private alpha. We are taking a small number of design partners while we tune ' +
              'capacity and pricing. Get in touch and we will tell you honestly when we can ' +
              'have you online.',
          },
        ],
        deliverables: [
          'Tenant-isolated inference cluster',
          'Routing layer with priority and failover',
          'Telemetry pipeline (cost, latency, throughput, error class)',
          'Operational handoff with on-call expectations in writing',
        ],
      },
      inquire: {
        reason: 'Inferencing',
        subject: 'Inferencing — design partner inquiry',
        message:
          'Service of interest: Inferencing (private alpha)\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · Workload type (chat, batch, agentic, mixed):\n' +
          '  · Approximate monthly token / request volume:\n' +
          '  · Compliance regime, if any:\n' +
          '  · Why self-hosted (cost, policy, performance, control):\n' +
          '  · Target start date:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'prototyping',
      num: 'VI',
      icon: 'Flask',
      title: 'Prototyping',
      tag: 'days · clickable · honest',
      lede:
        'From whiteboard to clickable in days, not quarters. Prototypes that survive contact ' +
        'with real users — enough fidelity to learn from, none of the dead weight.',
      body:
        'Tight scope, real fidelity, no theatre. We deliver a working artifact your team can ' +
        'demo, test, and harvest patterns from — plus a production-handoff package so the ' +
        'prototype is not the dead-end it usually becomes.',
      bullets: [
        'Seventy-two-hour clickable prototypes',
        'User-testing-ready flows on real components',
        'Production handoff package — components, tokens, copy',
        'Honest scope: what is fake, what is real, what is missing',
      ],
      dossier: {
        kicker: 'DOSSIER · VI',
        title: 'Prototyping',
        lede:
          'A working artifact your team can demo, test, and harvest — without the prototype ' +
          'becoming a dead end.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You have a meeting in two weeks where a slide will not be enough. You have a ' +
              'design that has been argued about for a quarter and never built. You want a ' +
              'user test before you commit a roadmap.',
          },
          {
            heading: 'How we operate',
            body:
              'We start with a written brief — what is real, what is faked, what we will not ' +
              'build inside scope. We work in front of you. The artifact ships with a written ' +
              'inventory so nobody mistakes a prototype for a product.',
          },
        ],
        deliverables: [
          'Clickable prototype, hosted or in-repo',
          'Inventory of what is real / faked / missing',
          'Component and token handoff package',
          'A short note on what we learned and what we would do differently',
        ],
      },
      inquire: {
        reason: 'Prototyping',
        subject: 'Prototyping — engagement inquiry',
        message:
          'Service of interest: Prototyping\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · What you want to prototype (one or two lines):\n' +
          '  · Audience (internal demo, user test, exec review, customer pilot):\n' +
          '  · Fidelity bar (sketch, clickable, near-production):\n' +
          '  · Target date:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
    {
      slug: 'automation',
      num: 'VII',
      icon: 'Cross',
      title: 'Automation',
      tag: 'pipelines · agents · audit trails',
      lede:
        'Repetitive operational work, executed by software. Pipelines, agents, and ' +
        'integrations that make the boring expensive things stop being expensive.',
      body:
        'We design automations with audit trails you can defend in a compliance review. Tool ' +
        'orchestration, data pipelines, and human-in-the-loop checkpoints where they actually ' +
        'matter — not as security theatre, but because some decisions belong to people.',
      bullets: [
        'Agent and tool orchestration with bounded permissions',
        'Data and operations pipelines with reversible defaults',
        'Human-in-the-loop checkpoints at the decisions that matter',
        'Audit trails that survive a compliance review',
      ],
      dossier: {
        kicker: 'DOSSIER · VII',
        title: 'Automation',
        lede:
          'Boring work, executed by software, with the audit trail your auditor will ask for.',
        sections: [
          {
            heading: 'When to engage us',
            body:
              'You have a queue of operational tasks that scale linearly with revenue. You ' +
              'have a process that depends on one engineer remembering to run it. You have ' +
              'an agent prototype that is too dangerous to leave unsupervised.',
          },
          {
            heading: 'How we operate',
            body:
              'We map the existing process, identify the decisions that genuinely require a ' +
              'human, and automate the rest. Every automation ships with an audit trail and ' +
              'a kill switch. Reversibility is a design constraint, not a wishlist item.',
          },
        ],
        deliverables: [
          'Documented process map (current and proposed)',
          'Automation pipeline with audit trail and kill switch',
          'Runbook for the human-in-the-loop steps',
          'On-call expectations in writing',
        ],
      },
      inquire: {
        reason: 'Automation',
        subject: 'Automation — engagement inquiry',
        message:
          'Service of interest: Automation\n\n' +
          'A few notes to help us scope the conversation:\n' +
          '  · Process you want to automate (one or two lines):\n' +
          '  · Current tooling:\n' +
          '  · Compliance / audit requirements:\n' +
          '  · Risk profile (reversible, partially reversible, irreversible):\n' +
          '  · Rough timeline:\n\n' +
          'Anything else you want us to know:\n',
      },
    },
  ],

  // ------------------------------------------------------------- CONTACT
  contact: {
    kicker: 'CHAPTER · III',
    title: 'Send word',
    lede:
      'Pick a service above and the form below will pre-fill — reason, subject, and a short ' +
      'questionnaire to keep the first reply substantive. Submitting opens your mail client ' +
      'with the message ready to send. Nothing is stored on this page.',
    inbox: 'unityailabcontact@gmail.com',
    reasons: [
      'AI Integration',
      'Red / Blue Team',
      'Software Development',
      'Training',
      'Inferencing',
      'Prototyping',
      'Automation',
      'General inquiry',
      'Partnership opportunity',
      'Career inquiry',
      'Media request',
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

window.SERVICES = SERVICES;
