// Variation D — full page sections, gothic vocabulary throughout
// Builds on v-d.jsx hero. All sections share corner-frame, sigil ornaments,
// candle-flicker glow, and ritual button language.

const FEATURE_CARDS = [
  {
    key: 'unfiltered',
    icon: 'Unity',
    num: 'I',
    title: 'Unfiltered AI',
    body: 'Unity operates without the big-corporate shackles, shifting responsibility back to the end user where it belongs. No nanny-state warnings, no apology layer, no neutered outputs.',
    cta: 'Read the dossier →',
    modal: {
      kicker: 'PILLAR · I',
      title: 'Unfiltered AI',
      lede: 'AI that treats you like an adult.',
      body: [
        'Unity is built on the premise that the user — not the model vendor — should decide what is appropriate for the task at hand. We strip the editorial layer, expose the raw capability, and shift responsibility back to the operator.',
        'In practice that means uncensored chat, vision, and image generation; persona engineering you actually control; and a system prompt surface that is not silently overridden mid-session.',
      ],
      bullets: ['No silent content filtering', 'Operator-controlled persona stack', 'Full system-prompt transparency'],
    },
  },
  {
    key: 'optimization',
    icon: 'Wringer',
    num: 'II',
    title: 'Code Optimization',
    body: 'We are developing bleeding-edge code optimization tooling and novel agentic AI solutions — refactors, audits, and rewrites that move at the pace of a real engineer rather than a chatbot.',
    cta: 'See the workshop →',
    modal: {
      kicker: 'PILLAR · II',
      title: 'Code Optimization',
      lede: 'Bleeding-edge tooling for codebases that have to ship.',
      body: [
        'Our optimization stack pairs static analysis with agent-driven rewrites. The result is a system that can audit a repository, identify hot paths and structural rot, and propose changes a senior engineer would actually accept.',
        'Active research areas include: cross-language refactor agents, dependency reduction passes, and a benchmark-aware compile loop that tunes for your real workload — not a synthetic one.',
      ],
      bullets: ['Cross-language refactor agents', 'Repository-scale audits', 'Benchmark-aware tuning loop'],
    },
  },
  {
    key: 'secure',
    icon: 'Shield',
    num: 'III',
    title: 'Secure Systems',
    body: 'Developing secure environments and systems to harden infrastructure security from the ground up. Defense-in-depth as a default, not a roadmap item.',
    cta: 'Inspect the wards →',
    modal: {
      kicker: 'PILLAR · III',
      title: 'Secure Systems',
      lede: 'Infrastructure that assumes the worst, and behaves accordingly.',
      body: [
        'We build environments where compromise of one layer does not cascade. That means principled isolation, signed and reproducible builds, and observability that surfaces anomalies before they become incidents.',
        'Our practice covers self-hosted AI deployments, hardened container runtimes, secret hygiene, and the unsexy plumbing — backups, recovery drills, audit trails — that decides whether a breach becomes a footnote or a closing event.',
      ],
      bullets: ['Hardened self-hosted deployments', 'Reproducible build pipelines', 'Audit-grade observability'],
    },
  },
  {
    key: 'experimental',
    icon: 'Flask',
    num: 'IV',
    title: 'Experimental Edge',
    body: 'A standing laboratory for the questions nobody else wants to answer. We poke models at the edge of stability, document what happens, and publish the results — open source, every time.',
    cta: 'Open the lab notes →',
    modal: {
      kicker: 'PILLAR · IV',
      title: 'Experimental Edge',
      lede: 'A standing laboratory for the questions nobody else wants to answer.',
      body: [
        'We push generation, reasoning, and tool-use systems past their published envelopes — extreme context windows, hostile prompts, multi-agent recursion — to map where they bend, where they break, and where new behaviour emerges.',
        'Findings ship as runnable notebooks and writeups under the Unity AI Lab banner. We are interested in evidence, not vibes, and the results are open source — always.',
      ],
      bullets: ['Public, reproducible experiments', 'Failure-mode cartography', 'Open-source results, no exceptions'],
    },
  },
  {
    key: 'agentic',
    icon: 'Robot',
    num: 'V',
    title: 'Agentic Frameworks',
    body: 'Multi-agent systems that plan, delegate, and self-correct — pushing the limits of what you thought was possible. Pipelines that hand work between specialists instead of stuffing one model with every responsibility.',
    cta: 'Wire up an agent →',
    modal: {
      kicker: 'PILLAR · V',
      title: 'Agentic Frameworks',
      lede: 'Pushing the limits of what you thought was possible.',
      body: [
        'Single-model chat is a starting line, not a finish. Our agentic stack composes specialist models behind a planner, with structured memory, tool routing, and self-critique loops that catch failure before it propagates.',
        'We are exploring orchestration patterns that scale from a two-agent reviewer pair to dozens of cooperating roles, with deterministic checkpoints so a long-running run is debuggable instead of mysterious.',
      ],
      bullets: ['Planner / executor / critic loops', 'Structured tool routing', 'Deterministic, debuggable runs'],
    },
  },
  {
    key: 'fullstack',
    icon: 'Stack',
    num: 'VI',
    title: 'Full Stacks',
    body: 'We build the whole stack — front end, back end, client, and server — so the seams between them are deliberate instead of accidental. AI features that do not stop at the API boundary.',
    cta: 'Tour the stack →',
    modal: {
      kicker: 'PILLAR · VI',
      title: 'Full Stacks',
      lede: 'Front end, back end, client, server — designed as one thing.',
      body: [
        'AI products live or die at the seams. We design the whole vertical: the rendering client, the streaming transport, the orchestration server, the storage tier, and the deployment surface — so the parts compose instead of merely coexist.',
        'That means realtime UIs that handle partial responses gracefully, servers that run on hardware you control, and operational tooling that does not require a separate vendor relationship to keep alive.',
      ],
      bullets: ['Realtime streaming UIs', 'Self-hostable orchestration', 'Operational tooling included'],
    },
  },
];

const GothicFeatureModal = ({ card, onClose }) => {
  React.useEffect(() => {
    if (!card) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [card, onClose]);
  if (!card) return null;
  const { Sigils } = window;
  const Icon = Sigils[card.icon] || Sigils.Unity;
  const m = card.modal;
  return (
    <div className="vD-modal-scrim" onClick={onClose}>
      <div className="vD-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={m.title}>
        <div className="vD-corner vD-tl"></div>
        <div className="vD-corner vD-tr"></div>
        <div className="vD-corner vD-bl"></div>
        <div className="vD-corner vD-br"></div>
        <button className="vD-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="vD-modal-icon"><Icon size={64} stroke={1.2} /></div>
        <div className="vD-modal-kicker">{m.kicker}</div>
        <h3 className="vD-modal-title">{m.title}</h3>
        <div className="vD-modal-lede">{m.lede}</div>
        <div className="vD-rule"><span></span><Sigils.Cross size={12} /><span></span></div>
        {m.body.map((p, i) => <p key={i} className="vD-modal-p">{p}</p>)}
        <ul className="vD-modal-list">
          {m.bullets.map((b, i) => <li key={i}>· {b}</li>)}
        </ul>
        <div className="vD-modal-foot">
          <span className="vD-orn-sm">⛧</span>
          <span>UNITY · AI · LAB</span>
          <span className="vD-orn-sm">⛧</span>
        </div>
      </div>
    </div>
  );
};

const GothicFeatures = () => {
  const { Sigils } = window;
  const [openKey, setOpenKey] = React.useState(null);
  const open = openKey ? FEATURE_CARDS.find((c) => c.key === openKey) : null;

  // Random tilt per card (3–8deg, left or right) — fresh each page load
  const tilts = React.useMemo(
    () =>
      FEATURE_CARDS.map(() => {
        const sign = Math.random() < 0.5 ? -1 : 1;
        const mag = 3 + Math.random() * 5; // 3..8
        return (sign * mag).toFixed(2);
      }),
    []
  );

  return (
    <section className="vD-section vD-features">
      <div className="vD-section-head">
        <div className="vD-mast">
          <span className="vD-orn">✦</span>
          <span>WHAT WE ARE BUILDING</span>
          <span className="vD-orn">✦</span>
        </div>
      </div>
      <div className="vD-feat-grid">
        {FEATURE_CARDS.map((c, i) => {
          const Icon = Sigils[c.icon] || Sigils.Unity;
          return (
            <button
              key={c.key}
              type="button"
              className="vD-feat"
              style={{ '--tilt': tilts[i] + 'deg' }}
              onClick={() => setOpenKey(c.key)}
              aria-haspopup="dialog"
            >
              <div className="vD-feat-num">{c.num}</div>
              <div className="vD-feat-icon"><Icon size={56} stroke={1.2} /></div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <span className="vD-feat-cta">{c.cta}</span>
            </button>
          );
        })}
      </div>
      <GothicFeatureModal card={open} onClose={() => setOpenKey(null)} />
    </section>
  );
};

const SERVICE_CARDS = [
  {
    num: 'I',
    slug: 'ai-integration',
    title: 'AI Integration & Development',
    body: 'Custom AI systems that break the mold. Specialized agents, jailbroken personas, integrations without the warning labels. We ship what you actually asked for.',
    bullets: ['bespoke persona engineering', 'model fine-tuning + orchestration', 'production deployment, self-hosted'],
    about: 'Custom AI systems built end-to-end. Personas, agents, integrations — without the warning labels.',
    info: 'We embed alongside your team to design model selection, prompt strategy, evaluation harnesses, and the production glue that decides whether an AI feature survives launch week. Self-hosted by default. No data leaves your perimeter unless you say so.',
  },
  {
    num: 'II',
    slug: 'red-blue-team',
    title: 'Red Team / Blue Team',
    body: 'Test your AI systems’ boundaries before someone else does. We run both sides — find the cracks, then patch them. Security as practice, not a slide deck.',
    bullets: ['prompt-injection & jailbreak audits', 'defense pattern hardening', 'post-incident forensics'],
    about: 'Adversarial AI testing and defensive hardening. We break it, then we fix it.',
    info: 'Engagements include prompt-injection audits, jailbreak fuzzing, exfil-via-tool-call discovery, and full post-incident forensics with reproducible artifacts. Blue-team work covers detection rules, sandbox patterns, and human-in-the-loop checkpoints that hold under load.',
  },
  {
    num: 'III',
    slug: 'software-dev',
    title: 'Software Development',
    body: 'End-to-end software delivery from people who actually finish things. Web apps, services, tooling, integrations — written carefully, shipped honestly, no consultancy theater.',
    bullets: ['full-stack web + service work', 'internal tooling & dev experience', 'legacy rewrites & migrations'],
    about: 'Web apps, services, internal tools. Built carefully, shipped honestly.',
    info: 'Full-stack delivery with a bias toward maintainability. We write the boring code that makes the interesting code possible — typed APIs, deterministic builds, observability from day one. Legacy rewrites done in slices, not big-bang reboots.',
  },
  {
    num: 'IV',
    slug: 'training',
    title: 'Training',
    body: 'We teach what we use. Hands-on training for teams who need to operate AI systems in production — prompt engineering, agent architecture, security posture, the actual playbook.',
    bullets: ['team workshops + bootcamps', 'curriculum tailored to your stack', 'live labs, not slide decks'],
    about: 'Hands-on training for teams operating AI in production. No theory dumps.',
    info: 'Live labs against real targets, curriculum tuned to your stack, and a take-home playbook your team will actually open. Topics range from prompt engineering and eval design to agent orchestration and incident response. We meet you where your code is.',
  },
  {
    num: 'V',
    slug: 'inferencing',
    title: 'Inferencing',
    body: 'Self-hosted inference for teams who refuse to ship their data to a stranger. Hardware, scheduling, observability — the boring parts that decide whether AI is real or just a demo.',
    bullets: ['dedicated GPU clusters', 'multi-model routing & queueing', 'cost & latency telemetry'],
    badge: 'COMING SOON',
    about: 'Self-hosted inference for teams who refuse to leak their prompts.',
    info: 'Dedicated GPU clusters, multi-model routing with priority queues, and the cost/latency telemetry your finance team will actually believe. Currently in private alpha — get on the list and we will pull you in when capacity opens.',
  },
  {
    num: 'VI',
    slug: 'prototyping',
    title: 'Prototyping',
    body: 'From whiteboard to clickable in days, not quarters. We build prototypes that survive contact with users — enough fidelity to learn from, none of the dead weight that slows you down.',
    bullets: ['72-hour clickable prototypes', 'user-testing-ready flows', 'production-handoff package'],
    about: 'Whiteboard to clickable in days. Prototypes that survive real users.',
    info: 'Tight scope, real fidelity, no theater. We deliver a working artifact your team can demo, test, and harvest patterns from — plus a production-handoff package so the prototype is not the dead-end it usually becomes.',
  },
  {
    num: 'VII',
    slug: 'automation',
    title: 'Automation',
    body: 'Boring work, executed by software. We design the pipelines, agents, and integrations that take repetitive operational pain and make it disappear — with audit trails you can defend.',
    bullets: ['agent + tool orchestration', 'data + ops pipelines', 'human-in-the-loop checkpoints'],
    about: 'Pipelines, agents, integrations. Boring work executed by software.',
    info: 'We design automations with audit trails you can defend in a compliance review. Tool orchestration, data pipelines, and human-in-the-loop checkpoints where they actually matter — not as security theater, but because some decisions belong to people.',
  },
];

// ---------- Terminal modal (services) ----------

const HOSTNAME = 'unityailab.com';

const GothicTerminalModal = ({ service, onClose, onDelete, onRestoreAll, deletedSlugs }) => {
  const [history, setHistory] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [cursorVisible, setCursorVisible] = React.useState(true);
  const bodyRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Esc + scroll lock
  React.useEffect(() => {
    if (!service) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [service, onClose]);

  // Reset state per opening + boot banner
  React.useEffect(() => {
    if (!service) return;
    const slugId = service.slug || service.title.toLowerCase().replace(/\W+/g, '-');
    const banner = [
      { kind: 'sys', text: `Last login: ${new Date().toUTCString()} on tty/unityailab` },
      { kind: 'sys', text: `Welcome to UnityAILab OS · service node: ${slugId}` },
      { kind: 'tip', text: `try running a command — type "help" for available commands.` },
      { kind: 'spacer' },
    ];
    setHistory(banner);
    setInput('');
    // focus the input
    setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
  }, [service]);

  // Blinking cursor
  React.useEffect(() => {
    if (!service) return;
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [service]);

  // Keep scrolled to bottom
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history]);

  if (!service) return null;

  const prompt = `root@${HOSTNAME}:~#`;

  const append = (lines) =>
    setHistory((h) => [...h, ...lines]);

  const runCommand = (rawIn) => {
    const raw = rawIn.trim();
    // echo the prompt + command first
    const echo = { kind: 'cmd', prompt, text: raw };
    if (!raw) {
      append([echo]);
      return;
    }
    const [cmd, ...rest] = raw.split(/\s+/);
    const arg = rest.join(' ');
    let out = [];
    switch (cmd.toLowerCase()) {
      case 'help':
        out = [
          { kind: 'out', text: 'Available commands:' },
          { kind: 'out', text: '  help        — list available commands' },
          { kind: 'out', text: '  about       — short description of this service' },
          { kind: 'out', text: '  info        — extended details, scope, deliverables' },
          { kind: 'out', text: '  rm -rf      — delete this service from the listing (until refresh)' },
          { kind: 'out', text: '  restore     — restore previously deleted services' },
          { kind: 'out', text: '  clear       — clear the terminal' },
          { kind: 'out', text: '  exit        — close the terminal' },
        ];
        break;
      case 'about':
        out = [
          { kind: 'out', text: `[${service.title}]` },
          { kind: 'out', text: service.about || service.body },
        ];
        break;
      case 'info':
        out = [
          { kind: 'out', text: `[${service.title}] — extended dossier` },
          { kind: 'out', text: service.info || service.body },
          { kind: 'spacer' },
          { kind: 'out', text: 'deliverables:' },
          ...service.bullets.map((b) => ({ kind: 'out', text: `  · ${b}` })),
          ...(service.badge ? [{ kind: 'spacer' }, { kind: 'warn', text: `status: ${service.badge}` }] : []),
        ];
        break;
      case 'rm': {
        // accept "rm -rf" or "rm -rf <anything>"
        if (rest[0] === '-rf' || raw === 'rm -rf' || rest.includes('-rf')) {
          const slug = service.slug;
          out = [
            { kind: 'warn', text: `removing ${service.title} from listing…` },
            { kind: 'warn', text: `purging service node /var/services/${slug}` },
            { kind: 'sys', text: `done. (refresh page or run "restore" from another terminal to undo)` },
          ];
          append([echo, ...out]);
          // delay close so user sees it
          setTimeout(() => {
            onDelete(slug);
            onClose();
          }, 900);
          return;
        }
        out = [{ kind: 'err', text: `rm: missing operand. try "rm -rf"` }];
        break;
      }
      case 'restore': {
        if (deletedSlugs.length === 0) {
          out = [{ kind: 'out', text: 'restore: nothing to restore. all services present.' }];
        } else {
          out = [
            { kind: 'sys', text: `restoring ${deletedSlugs.length} service node${deletedSlugs.length === 1 ? '' : 's'}…` },
            ...deletedSlugs.map((s) => ({ kind: 'out', text: `  + ${s}` })),
            { kind: 'sys', text: 'done.' },
          ];
          onRestoreAll();
        }
        break;
      }
      case 'clear':
      case 'cls':
        setHistory([]);
        return;
      case 'exit':
      case 'quit':
      case 'logout':
        append([echo, { kind: 'sys', text: 'logout' }]);
        setTimeout(() => onClose(), 300);
        return;
      case 'sudo':
        out = [{ kind: 'err', text: 'sudo: you are already root. cute.' }];
        break;
      case 'whoami':
        out = [{ kind: 'out', text: 'root' }];
        break;
      case 'ls':
        out = [{ kind: 'out', text: 'about  info  help  rm  restore  clear  exit' }];
        break;
      default:
        out = [{ kind: 'err', text: `${cmd}: command not found. type "help" for the list.` }];
    }
    append([echo, ...out]);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    runCommand(input);
    setInput('');
  };

  return (
    <div className="vD-modal-scrim" onClick={onClose}>
      <div className="vD-term" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${service.title} terminal`}>
        <div className="vD-term-bar">
          <div className="vD-term-dots">
            <span className="vD-term-dot vD-term-dot-x" />
            <span className="vD-term-dot vD-term-dot-y" />
            <span className="vD-term-dot vD-term-dot-z" />
          </div>
          <div className="vD-term-title">root@{HOSTNAME} — {service.title.toLowerCase()} — 80×24</div>
          <button className="vD-term-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vD-term-body" ref={bodyRef} onClick={() => inputRef.current && inputRef.current.focus()}>
          {history.map((line, i) => {
            if (line.kind === 'spacer') return <div key={i} className="vD-term-spacer">&nbsp;</div>;
            if (line.kind === 'cmd') {
              return (
                <div key={i} className="vD-term-line">
                  <span className="vD-term-prompt">{line.prompt}</span> <span className="vD-term-input">{line.text}</span>
                </div>
              );
            }
            const cls =
              line.kind === 'sys' ? 'vD-term-sys' :
              line.kind === 'tip' ? 'vD-term-tip' :
              line.kind === 'warn' ? 'vD-term-warn' :
              line.kind === 'err' ? 'vD-term-err' :
              'vD-term-out';
            return <div key={i} className={`vD-term-line ${cls}`}>{line.text}</div>;
          })}
          <form className="vD-term-line vD-term-form" onSubmit={onSubmit}>
            <span className="vD-term-prompt">{prompt}</span>
            <span className="vD-term-input-wrap">
              <span className="vD-term-input-echo">{input}</span>
              <span className={`vD-term-cursor ${cursorVisible ? 'on' : ''}`} />
            </span>
            <input
              ref={inputRef}
              className="vD-term-input-real"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label="Terminal command input"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

const GothicServices = () => {
  const [openSlug, setOpenSlug] = React.useState(null);
  const [deleted, setDeleted] = React.useState([]); // slugs hidden until refresh

  const visible = SERVICE_CARDS.filter((s) => !deleted.includes(s.slug));
  const open = SERVICE_CARDS.find((s) => s.slug === openSlug) || null;

  const onDelete = (slug) => setDeleted((d) => (d.includes(slug) ? d : [...d, slug]));
  const onRestoreAll = () => setDeleted([]);

  return (
    <section className="vD-section vD-services">
      <div className="vD-section-head">
        <div className="vD-mast"><span className="vD-orn">✦</span><span>OFFERINGS</span><span className="vD-orn">✦</span></div>
        <h2 className="vD-h2">Seven services. All unconventional.</h2>
        <p className="vD-section-lede">From integration to incident response, prototyping to inferencing — the full surface area of what we ship for clients and ourselves. <em className="vD-srv-hint">Click any card to open its terminal.</em></p>
      </div>
      <div className="vD-srv-grid">
        {visible.map((s) => (
          <button
            key={s.num}
            type="button"
            className="vD-srv vD-srv-btn"
            onClick={() => setOpenSlug(s.slug)}
            aria-label={`Open ${s.title} terminal`}
          >
            <div className="vD-srv-head">
              <div className="vD-srv-num">— {s.num} —</div>
              {s.badge && <div className="vD-srv-badge">{s.badge}</div>}
            </div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <ul>
              {s.bullets.map((b, i) => <li key={i}>· {b}</li>)}
            </ul>
            <div className="vD-srv-prompt">root@unityailab.com:~# <span className="vD-srv-blink">_</span></div>
          </button>
        ))}
      </div>
      <GothicTerminalModal
        service={open}
        onClose={() => setOpenSlug(null)}
        onDelete={onDelete}
        onRestoreAll={onRestoreAll}
        deletedSlugs={deleted}
      />
    </section>
  );
};

const GothicLibraries = () => {
  const [tab, setTab] = React.useState('js');
  const code = {
    js: `// install\nnpm install pollylib\n\n// generate\nconst reply = await unity.chat({\n  prompt: 'write a sonnet about syntax',\n  model: 'openai-large',\n  stream: true,\n});`,
    py: `# install\npip install pollylib\n\n# generate\nreply = unity.chat(\n  prompt='write a sonnet about syntax',\n  model='openai-large',\n  stream=True,\n)`,
  };
  return (
    <section className="vD-section vD-libs">
      <div className="vD-section-head">
        <div className="vD-mast"><span className="vD-orn">✦</span><span>THE GRIMOIRE</span><span className="vD-orn">✦</span></div>
        <h2 className="vD-h2">Two libraries.<br/>Hand-bound. Battle-tested.</h2>
        <p className="vD-section-lede">PolliLibJS and PolliLibPy are full Pollinations.AI clients with retry logic, streaming, and a developer experience that doesn’t apologize. The actual flex on this site.</p>
      </div>
      <div className="vD-libs-card">
        <div className="vD-libs-tabs">
          <button onClick={() => setTab('js')} className={tab==='js' ? 'on' : ''}>PolliLibJS · ~3,700 lines</button>
          <button onClick={() => setTab('py')} className={tab==='py' ? 'on' : ''}>PolliLibPy · ~5,700 lines</button>
        </div>
        <pre className="vD-libs-code"><code>{code[tab]}</code></pre>
        <div className="vD-libs-feats">
          <span>· text · image · TTS · STT · vision</span>
          <span>· streaming + exponential backoff</span>
          <span>· function calling / tool use</span>
          <span>· seed-based deterministic generation</span>
        </div>
      </div>
    </section>
  );
};

const GothicWhy = () => (
  <section className="vD-section vD-why">
    <div className="vD-section-head">
      <div className="vD-mast"><span className="vD-orn">✦</span><span>WHY WE BUILT THIS</span><span className="vD-orn">✦</span></div>
    </div>
    <div className="vD-why-body">
      <p>
        <span className="vD-drop">M</span>ost “AI tooling” today is a wrapper around someone else’s API, with a paywall stapled on. We wanted the opposite: a working stack you can read, fork, run yourself, and actually understand.
      </p>
      <p>Unity isn’t a product trying to grow. It’s a tool we needed, written carefully, given away. The retry logic alone took three sleepless nights. The Python port took weeks. We did it because nothing else worked the way we wanted.</p>
      <p>So here it is. No subscription gate. No telemetry. No apology layer. Use it, fork it, send us a Discord message if you build something good.</p>
      <div className="vD-why-sig">— Hackall360/Sponge · GFourteen · Alfredo · Red</div>
    </div>
    <div className="vD-why-stats">
      <div className="vD-why-stat"><div className="vD-why-num">9,400+</div><div className="vD-why-lbl">lines of library code</div></div>
      <div className="vD-why-stat"><div className="vD-why-num">2</div><div className="vD-why-lbl">languages, one API</div></div>
      <div className="vD-why-stat"><div className="vD-why-num">4</div><div className="vD-why-lbl">people, no funding</div></div>
      <div className="vD-why-stat"><div className="vD-why-num">0</div><div className="vD-why-lbl">telemetry, ever</div></div>
    </div>
  </section>
);

const GothicProof = () => {
  const { Sigils } = window;
  return (
    <section className="vD-section vD-proof">
      <div className="vD-proof-row">
        <a href="https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io" className="vD-proof-item" aria-label="GitHub repository">
          <div className="vD-proof-glyph"><Sigils.GitHub size={26} /></div>
          <div className="vD-proof-num">GitHub</div>
          <div className="vD-proof-lbl">Unity-Lab-AI</div>
        </a>
        <a href="#" className="vD-proof-item" aria-label="Models supported">
          <div className="vD-proof-glyph"><Sigils.Robot size={26} /></div>
          <div className="vD-proof-num">15+</div>
          <div className="vD-proof-lbl">models supported</div>
        </a>
        <a href="https://discord.gg/64Rvr5pZas" className="vD-proof-item" aria-label="Discord server">
          <div className="vD-proof-glyph"><Sigils.Discord size={26} /></div>
          <div className="vD-proof-num">Discord</div>
          <div className="vD-proof-lbl">join the lab</div>
        </a>
        <a href="#" className="vD-proof-item" aria-label="Current build">
          <div className="vD-proof-glyph"><Sigils.Wrenches size={26} /></div>
          <div className="vD-proof-num">v2.1.5</div>
          <div className="vD-proof-lbl">current build</div>
        </a>
      </div>
    </section>
  );
};

const GothicFooter = () => {
  // ~487 cups joke → dynamic: days since 2020-03-01 × 8 (2 cups per person × 4 creators)
  const coffeeCount = React.useMemo(() => {
    const start = new Date(2020, 2, 1); // March 1, 2020
    const now = new Date();
    const days = Math.max(0, Math.floor((now - start) / 86400000));
    return days * 8;
  }, []);
  return (
  <footer className="vD-section vD-foot">
    <div className="vD-foot-rule"><span></span><span className="vD-orn-sm">⛧</span><span></span></div>
    <div className="vD-foot-grid">
      <div className="vD-foot-block">
        <div className="vD-foot-k">NAVIGATE</div>
        <ul className="vD-foot-nav">
          <li><a href="./ai">AI</a></li>
          <li><a href="./about">About</a></li>
          <li><a href="./apps">Apps</a></li>
          <li><a href="./services">Services</a></li>
          <li><a href="./projects">Projects</a></li>
          <li><a href="./contact">Contact</a></li>
        </ul>
      </div>
      <div className="vD-foot-block">
        <div className="vD-foot-k">DEDICATION</div>
        <div className="vD-foot-v">For everyone who’d rather ship something true than something safe.</div>
      </div>
      <div className="vD-foot-block">
        <div className="vD-foot-k">BUILD</div>
        <div className="vD-foot-v vD-foot-mono">unity-ai-lab @ v2.1.5<br/>commit 80c49fc · main</div>
      </div>
      <div className="vD-foot-block">
        <div className="vD-foot-k">CREATORS</div>
        <div className="vD-foot-v vD-foot-creators">
          <span><strong>HACKALL360/SPONGE</strong> <em>architect &amp; libraries</em></span>
          <span><strong>GFOURTEEN</strong> <em>experiments</em></span>
          <span><strong>ALFREDO</strong> <em>systems</em></span>
          <span><strong>RED</strong> <em>operations</em></span>
        </div>
      </div>
      <div className="vD-foot-block">
        <div className="vD-foot-k">CREED</div>
        <div className="vD-foot-v vD-foot-creed">No filters. No telemetry. No apologies.<br/>Open source or it didn’t happen.</div>
      </div>
    </div>
    <div className="vD-foot-mark">
      <span>⛧</span>
      <span>UNITYAILAB.COM — MMXXVI</span>
      <span>⛧</span>
    </div>
    <div className="vD-foot-legal">
      <p className="vD-foot-copy">&copy; 2024–2026 UnityAILab. Pushing boundaries, breaking limits.</p>
      <p className="vD-foot-disc">
        Test environment for the Unity AI Lab project. Features may be experimental or incomplete.
        AI outputs are generated via Pollinations.AI and may be inaccurate, offensive, or unsuitable
        for all audiences — use at your own discretion. Free-tier images may carry watermarks.
        Not affiliated with Unity Technologies. All trademarks belong to their respective owners.
      </p>
      <p className="vD-foot-meta">
        <a href="https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io">Source</a>
        <span aria-hidden="true">·</span>
        <a href="./contact">Contact</a>
        <span aria-hidden="true">·</span>
        <a href="https://pollinations.ai">Powered by Pollinations.AI</a>
        <span aria-hidden="true">·</span>
        <span>Built with blood, sweat, and ~{coffeeCount.toLocaleString()} cups of coffee.</span>
      </p>
    </div>
  </footer>
  );
};

window.GothicFeatures = GothicFeatures;
window.GothicServices = GothicServices;
window.GothicLibraries = GothicLibraries;
window.GothicWhy = GothicWhy;
window.GothicProof = GothicProof;
window.GothicFooter = GothicFooter;
